"""
抖音监控功能测试
"""
import asyncio
import sys
import os

# 添加项目根目录到路径
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.douyin_monitor import init_monitor
from utils.feishu_notification import init_feishu_notifier
import yaml


async def test_monitor():
    """测试监控功能"""
    # 读取配置
    with open('config/config.yaml', 'r', encoding='utf-8') as f:
        config = yaml.safe_load(f)
    
    # 初始化监控器
    monitor_config = config.get('douyin_monitor', {})
    if not monitor_config.get('enabled', False):
        print("监控功能未启用，请在config.yaml中启用")
        return
    
    monitor = init_monitor(monitor_config)
    print(f"监控器状态: {monitor.get_status()}")
    
    # 测试检查一次用户
    print("开始测试检查用户...")
    await monitor.check_all_users()
    print("测试完成")


if __name__ == '__main__':
    asyncio.run(test_monitor())