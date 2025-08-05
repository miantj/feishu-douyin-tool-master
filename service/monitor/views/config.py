"""
监控配置管理接口
"""
import yaml
import os
from typing import Dict, List
from fastapi import HTTPException
from pydantic import BaseModel
from utils.error_code import ErrorCode
from utils.reply import reply
from utils.douyin_monitor import get_monitor, init_monitor
from utils.scheduler import get_scheduler
from utils.douyin_url_parser import get_sec_user_id_from_any_url, validate_douyin_url, format_douyin_url
from lib.logger import logger


class MonitorUserModel(BaseModel):
    """监控用户模型"""
    profile_url: str  # 改为主页地址
    nickname: str
    like_threshold: int
    enabled: bool = True


class MonitorConfigModel(BaseModel):
    """监控配置模型"""
    enabled: bool
    interval_hours: int
    feishu_webhook_url: str
    videos_per_check: int = 10
    recent_hours: int = 24
    enable_deduplication: bool = True
    dedup_cache_hours: int = 72


def _get_config_path() -> str:
    """获取配置文件路径"""
    return os.getenv("FILE", 'config/config.yaml')


def _load_config() -> Dict:
    """加载配置文件"""
    config_path = _get_config_path()
    try:
        with open(config_path, 'r', encoding='utf-8') as f:
            return yaml.safe_load(f)
    except Exception as e:
        logger.error(f"加载配置文件失败: {e}")
        raise HTTPException(status_code=500, detail=f"加载配置文件失败: {str(e)}")


def _save_config(config: Dict) -> bool:
    """保存配置文件"""
    config_path = _get_config_path()
    try:
        with open(config_path, 'w', encoding='utf-8') as f:
            yaml.dump(config, f, default_flow_style=False, allow_unicode=True)
        return True
    except Exception as e:
        logger.error(f"保存配置文件失败: {e}")
        return False


async def get_monitor_config():
    """
    获取监控配置
    """
    try:
        config = _load_config()
        monitor_config = config.get('douyin_monitor', {})
        
        # 格式化配置数据
        formatted_config = {
            'enabled': monitor_config.get('enabled', False),
            'interval_hours': monitor_config.get('interval_hours', 1),
            'feishu_webhook_url': monitor_config.get('feishu', {}).get('webhook_url', ''),
            'videos_per_check': monitor_config.get('settings', {}).get('videos_per_check', 10),
            'recent_hours': monitor_config.get('settings', {}).get('recent_hours', 24),
            'enable_deduplication': monitor_config.get('settings', {}).get('enable_deduplication', True),
            'dedup_cache_hours': monitor_config.get('settings', {}).get('dedup_cache_hours', 72)
        }
        
        return reply(ErrorCode.OK, '成功', formatted_config)
        
    except Exception as e:
        logger.error(f'获取监控配置失败: {e}')
        return reply(ErrorCode.ERROR, f'获取监控配置失败: {str(e)}')


async def update_monitor_config(config_data: MonitorConfigModel):
    """
    更新监控配置
    """
    try:
        # 参数校验
        if config_data.interval_hours <= 0:
            return reply(ErrorCode.ERROR, '监控间隔必须大于0小时')
        if config_data.videos_per_check <= 0 or config_data.videos_per_check > 50:
            return reply(ErrorCode.ERROR, '每次检查视频数量必须在1-50之间')
        if config_data.recent_hours <= 0:
            return reply(ErrorCode.ERROR, '检查最近视频的时间范围必须大于0小时')
        if config_data.dedup_cache_hours <= 0:
            return reply(ErrorCode.ERROR, '去重缓存时间必须大于0小时')
        if not config_data.feishu_webhook_url.strip():
            return reply(ErrorCode.ERROR, '飞书webhook地址不能为空')
        
        config = _load_config()
        
        # 更新监控配置
        if 'douyin_monitor' not in config:
            config['douyin_monitor'] = {}
        
        monitor_config = config['douyin_monitor']
        monitor_config['enabled'] = config_data.enabled
        monitor_config['interval_hours'] = config_data.interval_hours
        
        # 更新飞书配置
        if 'feishu' not in monitor_config:
            monitor_config['feishu'] = {}
        monitor_config['feishu']['webhook_url'] = config_data.feishu_webhook_url
        
        # 更新设置
        if 'settings' not in monitor_config:
            monitor_config['settings'] = {}
        settings = monitor_config['settings']
        settings['videos_per_check'] = config_data.videos_per_check
        settings['recent_hours'] = config_data.recent_hours
        settings['enable_deduplication'] = config_data.enable_deduplication
        settings['dedup_cache_hours'] = config_data.dedup_cache_hours
        
        # 保存配置
        if not _save_config(config):
            return reply(ErrorCode.ERROR, '保存配置文件失败')
        
        # 重新初始化监控器
        await _reload_monitor_config()
        
        logger.info('监控配置更新成功')
        return reply(ErrorCode.OK, '监控配置更新成功')
        
    except Exception as e:
        logger.error(f'更新监控配置失败: {e}')
        return reply(ErrorCode.ERROR, f'更新监控配置失败: {str(e)}')


async def get_monitor_users():
    """
    获取监控用户列表
    """
    try:
        config = _load_config()
        users = config.get('douyin_monitor', {}).get('users', [])
        
        # 为每个用户添加ID（使用索引）
        formatted_users = []
        for index, user in enumerate(users):
            user_data = {
                'id': index,
                'sec_user_id': user.get('sec_user_id', ''),
                'profile_url': user.get('profile_url', ''),  # 添加主页地址字段
                'nickname': user.get('nickname', ''),
                'like_threshold': user.get('like_threshold', 10000),
                'enabled': user.get('enabled', True)
            }
            formatted_users.append(user_data)
        
        return reply(ErrorCode.OK, '成功', formatted_users)
        
    except Exception as e:
        logger.error(f'获取监控用户列表失败: {e}')
        return reply(ErrorCode.ERROR, f'获取监控用户列表失败: {str(e)}')


async def add_monitor_user(user_data: MonitorUserModel):
    """
    添加监控用户
    """
    try:
        # 输入校验
        if not user_data.nickname.strip():
            return reply(ErrorCode.ERROR, '博主昵称不能为空')
        if user_data.like_threshold <= 0:
            return reply(ErrorCode.ERROR, '点赞阈值必须大于0')
        if not user_data.profile_url.strip():
            return reply(ErrorCode.ERROR, '主页地址不能为空')
            
        # 验证抖音URL
        profile_url = format_douyin_url(user_data.profile_url)
        if not validate_douyin_url(profile_url):
            return reply(ErrorCode.ERROR, '请输入有效的抖音主页地址')
        
        # 从URL提取sec_user_id
        sec_user_id = await get_sec_user_id_from_any_url(profile_url)
        if not sec_user_id:
            return reply(ErrorCode.ERROR, '无法从主页地址中提取用户ID，请检查地址是否正确')
        
        config = _load_config()
        
        # 确保监控配置存在
        if 'douyin_monitor' not in config:
            config['douyin_monitor'] = {}
        if 'users' not in config['douyin_monitor']:
            config['douyin_monitor']['users'] = []
        
        # 检查用户是否已存在
        users = config['douyin_monitor']['users']
        for user in users:
            if user.get('sec_user_id') == sec_user_id:
                return reply(ErrorCode.ERROR, '该用户已存在')
        
        # 添加新用户
        new_user = {
            'sec_user_id': sec_user_id,
            'profile_url': profile_url,  # 保存主页地址
            'nickname': user_data.nickname,
            'like_threshold': user_data.like_threshold,
            'enabled': user_data.enabled
        }
        users.append(new_user)
        
        # 保存配置
        if not _save_config(config):
            return reply(ErrorCode.ERROR, '保存配置文件失败')
        
        # 重新初始化监控器
        await _reload_monitor_config()
        
        logger.info(f'添加监控用户成功: {user_data.nickname} ({sec_user_id})')
        return reply(ErrorCode.OK, '添加监控用户成功')
        
    except Exception as e:
        logger.error(f'添加监控用户失败: {e}')
        return reply(ErrorCode.ERROR, f'添加监控用户失败: {str(e)}')


async def update_monitor_user(user_id: int, user_data: MonitorUserModel):
    """
    更新监控用户
    """
    try:
        # 输入校验
        if not user_data.nickname.strip():
            return reply(ErrorCode.ERROR, '博主昵称不能为空')
        if user_data.like_threshold <= 0:
            return reply(ErrorCode.ERROR, '点赞阈值必须大于0')
        if not user_data.profile_url.strip():
            return reply(ErrorCode.ERROR, '主页地址不能为空')
            
        # 验证抖音URL
        profile_url = format_douyin_url(user_data.profile_url)
        if not validate_douyin_url(profile_url):
            return reply(ErrorCode.ERROR, '请输入有效的抖音主页地址')
        
        # 从URL提取sec_user_id
        sec_user_id = await get_sec_user_id_from_any_url(profile_url)
        if not sec_user_id:
            return reply(ErrorCode.ERROR, '无法从主页地址中提取用户ID，请检查地址是否正确')
        
        config = _load_config()
        users = config.get('douyin_monitor', {}).get('users', [])
        
        if user_id < 0 or user_id >= len(users):
            return reply(ErrorCode.ERROR, '用户不存在')
        
        # 检查是否与其他用户重复（排除自己）
        for index, user in enumerate(users):
            if index != user_id and user.get('sec_user_id') == sec_user_id:
                return reply(ErrorCode.ERROR, '该用户已存在')
        
        # 更新用户信息
        users[user_id] = {
            'sec_user_id': sec_user_id,
            'profile_url': profile_url,  # 保存主页地址
            'nickname': user_data.nickname,
            'like_threshold': user_data.like_threshold,
            'enabled': user_data.enabled
        }
        
        # 保存配置
        if not _save_config(config):
            return reply(ErrorCode.ERROR, '保存配置文件失败')
        
        # 重新初始化监控器
        await _reload_monitor_config()
        
        logger.info(f'更新监控用户成功: {user_data.nickname} ({sec_user_id})')
        return reply(ErrorCode.OK, '更新监控用户成功')
        
    except Exception as e:
        logger.error(f'更新监控用户失败: {e}')
        return reply(ErrorCode.ERROR, f'更新监控用户失败: {str(e)}')


async def delete_monitor_user(user_id: int):
    """
    删除监控用户
    """
    try:
        config = _load_config()
        users = config.get('douyin_monitor', {}).get('users', [])
        
        if user_id < 0 or user_id >= len(users):
            return reply(ErrorCode.ERROR, '用户不存在')
        
        # 删除用户
        deleted_user = users.pop(user_id)
        
        # 保存配置
        if not _save_config(config):
            return reply(ErrorCode.ERROR, '保存配置文件失败')
        
        # 重新初始化监控器
        await _reload_monitor_config()
        
        logger.info(f'删除监控用户成功: {deleted_user.get("nickname", "未知")}')
        return reply(ErrorCode.OK, '删除监控用户成功')
        
    except Exception as e:
        logger.error(f'删除监控用户失败: {e}')
        return reply(ErrorCode.ERROR, f'删除监控用户失败: {str(e)}')


async def toggle_monitor(data: dict = None):
    """
    切换监控开关
    """
    try:
        config = _load_config()
        
        # 从请求数据中获取enabled状态
        enabled = data.get('enabled') if data else None
        
        # 如果没有指定状态，则切换当前状态
        if enabled is None:
            current_enabled = config.get('douyin_monitor', {}).get('enabled', False)
            enabled = not current_enabled
        
        # 更新配置
        if 'douyin_monitor' not in config:
            config['douyin_monitor'] = {}
        config['douyin_monitor']['enabled'] = enabled
        
        # 保存配置
        if not _save_config(config):
            return reply(ErrorCode.ERROR, '保存配置文件失败')
        
        # 重新初始化监控器
        await _reload_monitor_config()
        
        # 发送飞书通知
        status_text = '启用' if enabled else '停用'
        emoji = '🟢' if enabled else '🔴'
        notification_text = f"{emoji} 抖音监控状态变更\n\n📋 状态：监控已{status_text}\n🕐 时间：{_get_current_time()}\n👤 操作：系统管理员"
        
        await _send_status_notification(notification_text)
        
        logger.info(f'监控开关切换成功: {status_text}')
        return reply(ErrorCode.OK, f'监控已{status_text}', {'enabled': enabled})
        
    except Exception as e:
        logger.error(f'切换监控开关失败: {e}')
        return reply(ErrorCode.ERROR, f'切换监控开关失败: {str(e)}')


async def _reload_monitor_config():
    """重新加载监控配置"""
    try:
        config = _load_config()
        monitor_config = config.get('douyin_monitor', {})
        
        # 重新初始化监控器
        monitor = init_monitor(monitor_config)
        
        # 更新调度器任务
        scheduler = get_scheduler()
        scheduler.update_monitor_task()
        
        logger.info('监控配置重新加载成功')
        
    except Exception as e:
        logger.error(f'重新加载监控配置失败: {e}')
        raise


async def _send_status_notification(message: str):
    """发送状态通知到飞书"""
    try:
        from utils.feishu_notification import get_feishu_notifier
        notifier = get_feishu_notifier()
        if notifier:
            await notifier.send_text_message(message)
            logger.info("飞书状态通知发送成功")
        else:
            logger.warning("飞书通知器未初始化，跳过状态通知")
    except Exception as e:
        logger.error(f"发送飞书状态通知失败: {e}")


def _get_current_time() -> str:
    """获取当前时间字符串"""
    from datetime import datetime
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


async def test_notification():
    """
    测试飞书通知
    """
    try:
        test_message = f"🧪 抖音监控测试通知\n\n📋 状态：通知功能正常\n🕐 时间：{_get_current_time()}\n💡 说明：这是一条测试消息，用于验证飞书通知功能是否正常工作"
        
        await _send_status_notification(test_message)
        
        logger.info('测试通知发送成功')
        return reply(ErrorCode.OK, '测试通知发送成功')
        
    except Exception as e:
        logger.error(f'发送测试通知失败: {e}')
        return reply(ErrorCode.ERROR, f'发送测试通知失败: {str(e)}')