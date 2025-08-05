"""
测试飞书通知功能
"""
import asyncio
import sys
import os

# 添加项目根目录到路径
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.feishu_notification import FeishuNotifier


async def test_feishu_notification():
    """测试飞书通知"""
    # 使用你的webhook地址
    webhook_url = "https://open.feishu.cn/open-apis/bot/v2/hook/29e21c8d-498a-49bf-8bc1-80e21c1c9bed"
    
    # 创建通知器
    notifier = FeishuNotifier(webhook_url)
    
    # 测试文本消息
    print("🔄 测试发送文本消息...")
    success = await notifier.send_text_message("🧪 抖音监控测试：文本消息发送成功！")
    if success:
        print("✅ 文本消息发送成功")
    else:
        print("❌ 文本消息发送失败")
    
    # 测试模拟视频通知
    print("\n🔄 测试发送视频通知...")
    mock_video_info = {
        'aweme_id': 'test123456',
        'desc': '这是一个测试视频的描述内容',
        'author': {
            'nickname': '测试博主'
        },
        'statistics': {
            'digg_count': 5000,
            'comment_count': 100,
            'share_count': 50
        }
    }
    
    success = await notifier.send_card_message(mock_video_info)
    if success:
        print("✅ 视频通知发送成功")
    else:
        print("❌ 视频通知发送失败")


if __name__ == '__main__':
    asyncio.run(test_feishu_notification())