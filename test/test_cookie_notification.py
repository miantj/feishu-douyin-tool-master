import unittest
import asyncio
from utils.cookie_manager import check_cookie_expired
from utils.feishu_notification import init_feishu_notifier

class TestCookieNotification(unittest.TestCase):
    def setUp(self):
        # 初始化飞书通知器，使用测试webhook
        init_feishu_notifier("YOUR_TEST_WEBHOOK_URL")  # 请替换为实际的测试webhook URL

    def test_cookie_expired_check(self):
        # 测试默认过期检查逻辑
        test_cases = [
            {
                "response": {"code": 401, "message": "请登录"},
                "expected": True,
                "description": "未授权错误码"
            },
            {
                "response": {"code": 0, "data": {"user": "test"}},
                "expected": False,
                "description": "正常响应"
            },
            {
                "response": {"code": -101, "msg": "Cookie已失效"},
                "expected": True,
                "description": "Cookie失效错误"
            },
            {
                "response": {"status": 403, "error": "需要登录"},
                "expected": True,
                "description": "需要登录错误"
            }
        ]

        async def run_test():
            for case in test_cases:
                is_expired, notification_sent = await check_cookie_expired(
                    case["response"],
                    "test_platform",
                    "test_account"
                )
                self.assertEqual(
                    is_expired,
                    case["expected"],
                    f"测试用例 '{case['description']}' 失败"
                )

        # 运行异步测试
        asyncio.run(run_test())

    def test_custom_expired_check(self):
        # 测试自定义过期检查逻辑
        def custom_check(response):
            return response.get("custom_code") == "EXPIRED"

        async def run_test():
            # 测试自定义检查函数 - 过期情况
            is_expired, notification_sent = await check_cookie_expired(
                {"custom_code": "EXPIRED"},
                "test_platform",
                "test_account",
                custom_check
            )
            self.assertTrue(is_expired, "自定义检查应该返回过期")

            # 测试自定义检查函数 - 正常情况
            is_expired, notification_sent = await check_cookie_expired(
                {"custom_code": "OK"},
                "test_platform",
                "test_account",
                custom_check
            )
            self.assertFalse(is_expired, "自定义检查应该返回正常")

        # 运行异步测试
        asyncio.run(run_test())

if __name__ == '__main__':
    unittest.main()