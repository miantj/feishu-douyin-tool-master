"""
抖音博主监控模块
定时检查博主作品的点赞数，当超过阈值时发送飞书通知
"""
import asyncio
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Set
from lib.logger import logger
from service.douyin.logic.user_posts import request_user_posts
from service.douyin.models import accounts
from utils.feishu_notification import send_video_notification, init_feishu_notifier
import random


class DouyinMonitor:
    """抖音监控器"""
    
    def __init__(self, config: Dict):
        """
        初始化监控器
        :param config: 监控配置
        """
        self.config = config
        self.enabled = config.get('enabled', False)
        self.interval_hours = config.get('interval_hours', 1)
        
        # 飞书配置
        feishu_config = config.get('feishu', {})
        self.feishu_webhook = feishu_config.get('webhook_url', '')
        
        # 监控用户列表
        self.users = config.get('users', [])
        
        # 监控设置
        settings = config.get('settings', {})
        self.videos_per_check = settings.get('videos_per_check', 10)
        self.recent_hours = settings.get('recent_hours', 24)
        self.enable_deduplication = settings.get('enable_deduplication', True)
        self.dedup_cache_hours = settings.get('dedup_cache_hours', 72)
        
        # 去重缓存：存储已通知的视频ID和时间戳
        self.notified_videos: Dict[str, float] = {}
        
        # 初始化飞书通知器
        if self.feishu_webhook and self.feishu_webhook != "https://open.feishu.cn/open-apis/bot/v2/hook/YOUR_WEBHOOK_TOKEN":
            init_feishu_notifier(self.feishu_webhook)
            logger.info("抖音监控器初始化完成")
        else:
            logger.warning("飞书webhook未配置或使用默认值，请修改config.yaml中的webhook_url")
    
    async def start_monitoring(self):
        """开始监控"""
        if not self.enabled:
            logger.info("抖音监控未启用")
            return
            
        if not self.users:
            logger.warning("未配置监控用户列表")
            return
            
        logger.info(f"开始抖音监控，间隔：{self.interval_hours}小时，监控用户数：{len(self.users)}")
        
        retry_count = 0
        max_retries = 5
        base_delay = 60  # 基础延迟60秒
        
        while True:
            try:
                await self.check_all_users()
                retry_count = 0  # 成功后重置重试计数
                await asyncio.sleep(self.interval_hours * 3600)  # 转换为秒
            except Exception as e:
                retry_count += 1
                delay = min(base_delay * (2 ** (retry_count - 1)), 3600)  # 指数退避，最大1小时
                logger.error(f"监控过程中发生异常 (第{retry_count}次): {e}")
                
                if retry_count >= max_retries:
                    logger.error(f"连续失败{max_retries}次，暂停监控1小时")
                    delay = 3600
                    retry_count = 0
                
                logger.info(f"等待{delay}秒后重试...")
                await asyncio.sleep(delay)
    
    async def check_all_users(self):
        """检查所有用户的视频"""
        logger.info("开始检查所有用户的视频")
        
        # 清理过期的去重缓存
        self._clean_expired_cache()
        
        # 获取可用账号
        available_accounts = await self._get_available_accounts()
        if not available_accounts:
            logger.warning("没有可用的抖音账号，跳过本次检查")
            return
        
        # 并发检查所有用户
        tasks = []
        for user_config in self.users:
            if user_config.get('enabled', True):
                task = self.check_user_videos(user_config, available_accounts)
                tasks.append(task)
        
        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)
        
        logger.info("完成所有用户的检查")
    
    async def check_user_videos(self, user_config: Dict, available_accounts: List[Dict]):
        """
        检查单个用户的视频
        :param user_config: 用户配置
        :param available_accounts: 可用账号列表
        """
        sec_user_id = user_config.get('sec_user_id')
        nickname = user_config.get('nickname', '未知博主')
        like_threshold = user_config.get('like_threshold', 10000)
        
        if not sec_user_id:
            logger.warning(f"用户配置缺少sec_user_id: {user_config}")
            return
        
        logger.info(f"检查用户 {nickname}({sec_user_id}) 的视频，点赞阈值：{like_threshold:,}")
        
        try:
            # 随机选择一个账号
            account = random.choice(available_accounts)
            cookie = account.get('cookie', '')
            
            # 获取用户视频列表
            response, success = await request_user_posts(
                sec_user_id=sec_user_id,
                max_cursor=0,
                cookie=cookie,
                count=self.videos_per_check
            )
            
            if not success:
                logger.error(f"获取用户 {nickname} 的视频列表失败")
                return
            
            aweme_list = response.get('aweme_list', [])
            if not aweme_list:
                logger.info(f"用户 {nickname} 暂无视频")
                return
            
            # 筛选最近发布的视频
            recent_videos = self._filter_recent_videos(aweme_list)
            logger.info(f"用户 {nickname} 最近 {self.recent_hours} 小时内发布了 {len(recent_videos)} 个视频")
            
            # 检查每个视频的点赞数
            for video in recent_videos:
                await self._check_video_likes(video, nickname, like_threshold)
                
        except Exception as e:
            logger.error(f"检查用户 {nickname} 时发生异常: {e}")
    
    async def _check_video_likes(self, video: Dict, author_nickname: str, threshold: int):
        """
        检查单个视频的点赞数
        :param video: 视频信息
        :param author_nickname: 作者昵称
        :param threshold: 点赞阈值
        """
        aweme_id = video.get('aweme_id', '')
        desc = video.get('desc', '无描述')
        statistics = video.get('statistics', {})
        digg_count = statistics.get('digg_count', 0)
        
        if not aweme_id:
            return
        
        # 检查是否已经通知过
        if self.enable_deduplication and aweme_id in self.notified_videos:
            return
        
        # 检查点赞数是否达到阈值
        if digg_count >= threshold:
            logger.info(f"发现热门视频：{author_nickname} - {desc[:50]}... (点赞数：{digg_count:,})")
            
            # 发送通知
            success = await send_video_notification(video)
            
            if success:
                # 记录已通知
                if self.enable_deduplication:
                    self.notified_videos[aweme_id] = time.time()
                
                logger.info(f"成功发送通知：视频ID {aweme_id}，点赞数 {digg_count:,}")
            else:
                logger.error(f"发送通知失败：视频ID {aweme_id}")
    
    def _filter_recent_videos(self, videos: List[Dict]) -> List[Dict]:
        """
        筛选最近发布的视频
        :param videos: 视频列表
        :return: 最近发布的视频列表
        """
        if self.recent_hours <= 0:
            return videos
        
        current_time = int(time.time())
        cutoff_time = current_time - (self.recent_hours * 3600)
        
        recent_videos = []
        for video in videos:
            create_time = video.get('create_time', 0)
            if create_time >= cutoff_time:
                recent_videos.append(video)
        
        return recent_videos
    
    def _clean_expired_cache(self):
        """清理过期的去重缓存"""
        if not self.enable_deduplication:
            return
        
        current_time = time.time()
        cutoff_time = current_time - (self.dedup_cache_hours * 3600)
        
        expired_ids = [
            aweme_id for aweme_id, timestamp in self.notified_videos.items()
            if timestamp < cutoff_time
        ]
        
        for aweme_id in expired_ids:
            del self.notified_videos[aweme_id]
        
        if expired_ids:
            logger.info(f"清理了 {len(expired_ids)} 个过期的去重缓存")
    
    async def _get_available_accounts(self) -> List[Dict]:
        """
        获取可用的抖音账号
        :return: 可用账号列表
        """
        try:
            all_accounts = await accounts.load()
            available_accounts = [
                account for account in all_accounts
                if account.get('expired', 0) != 1
            ]
            return available_accounts
        except Exception as e:
            logger.error(f"获取抖音账号时发生异常: {e}")
            return []
    
    def get_status(self) -> Dict:
        """
        获取监控状态
        :return: 状态信息
        """
        return {
            'enabled': self.enabled,
            'interval_hours': self.interval_hours,
            'monitored_users': len([u for u in self.users if u.get('enabled', True)]),
            'total_users': len(self.users),
            'notified_videos_count': len(self.notified_videos),
            'feishu_configured': bool(self.feishu_webhook and 
                                   self.feishu_webhook != "https://open.feishu.cn/open-apis/bot/v2/hook/YOUR_WEBHOOK_TOKEN")
        }


# 全局监控器实例
_monitor_instance: Optional[DouyinMonitor] = None


def init_monitor(config: Dict) -> DouyinMonitor:
    """
    初始化监控器
    :param config: 配置
    :return: 监控器实例
    """
    global _monitor_instance
    _monitor_instance = DouyinMonitor(config)
    return _monitor_instance


def get_monitor() -> Optional[DouyinMonitor]:
    """
    获取监控器实例
    :return: 监控器实例
    """
    return _monitor_instance


async def start_monitor_task():
    """启动监控任务"""
    if _monitor_instance:
        await _monitor_instance.start_monitoring()
    else:
        logger.warning("监控器未初始化")