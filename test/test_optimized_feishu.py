#!/usr/bin/env python3
"""
测试优化后的飞书通知样式
"""
import asyncio
import sys
import os

# 添加项目根目录到路径
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.feishu_notification import FeishuNotifier

async def test_optimized_notification():
    """测试优化后的飞书通知样式"""
    print("🧪 测试优化后的飞书通知样式...")
    
    # 使用配置文件中的webhook URL
    webhook_url = "https://open.feishu.cn/open-apis/bot/v2/hook/29e21c8d-498a-49bf-8bc1-80e21c1c9bed"
    
    # 创建通知器
    notifier = FeishuNotifier(webhook_url)
    
    # 模拟不同热度级别的视频数据
    test_videos = [
        {
            "name": "超级热门视频",
            "data": {
                'aweme_id': 'test_super_hot',
                'desc': '这是一个超级热门的视频！内容非常精彩，大家都在疯狂点赞和分享。这个视频展示了最新的抖音热门趋势，包含了很多有趣的元素和创意内容。',
                'author': {
                    'nickname': '超级网红博主'
                },
                'statistics': {
                    'digg_count': 150000,  # 🌋 超级热门
                    'comment_count': 5000,
                    'share_count': 2000
                }
            }
        },
        {
            "name": "热门视频",
            "data": {
                'aweme_id': 'test_hot',
                'desc': '一个很受欢迎的视频内容，获得了不错的数据表现',
                'author': {
                    'nickname': '藤椒很麻呀²³⁵⁸ 🌶️'
                },
                'statistics': {
                    'digg_count': 15000,  # 🔥🔥 很热门
                    'comment_count': 800,
                    'share_count': 300
                }
            }
        },
        {
            "name": "新星视频",
            "data": {
                'aweme_id': 'test_new_star',
                'desc': '一个刚起步但很有潜力的视频',
                'author': {
                    'nickname': '新晋创作者'
                },
                'statistics': {
                    'digg_count': 500,  # ⭐ 新星
                    'comment_count': 20,
                    'share_count': 5
                }
            }
        }
    ]
    
    # 测试每个视频
    for i, video in enumerate(test_videos, 1):
        print(f"\n📤 发送第{i}个测试通知: {video['name']}")
        
        try:
            success = await notifier.send_card_message(video['data'])
            if success:
                print(f"✅ {video['name']} 通知发送成功")
            else:
                print(f"❌ {video['name']} 通知发送失败")
        except Exception as e:
            print(f"❌ {video['name']} 发送异常: {e}")
        
        # 等待一下避免发送过快
        if i < len(test_videos):
            print("⏳ 等待3秒...")
            await asyncio.sleep(3)
    
    print("\n🎉 所有测试通知发送完成！")
    print("📱 请查看飞书群聊确认通知样式是否满意")

if __name__ == "__main__":
    asyncio.run(test_optimized_notification())