"""
飞书通知模块
用于发送消息到飞书群聊
"""

import aiohttp
import json
from lib.logger import logger
from typing import Optional, Dict, Any


class FeishuNotifier:
    """飞书通知器"""

    def __init__(self, webhook_url: str):
        """
        初始化飞书通知器
        :param webhook_url: 飞书机器人webhook地址
        """
        self.webhook_url = webhook_url

    async def send_text_message(self, content: str) -> bool:
        """
        发送文本消息
        :param content: 消息内容
        :return: 是否发送成功
        """
        # 检查是否为流程webhook
        if "/flow/api/trigger-webhook/" in self.webhook_url:
            # 流程webhook格式
            message = {"msg_type": "text", "content": {"text": content}}
        else:
            # 标准机器人格式
            message = {"msg_type": "text", "content": {"text": content}}
        return await self._send_message(message)

    async def send_rich_text_message(
        self,
        title: str,
        content: str,
        video_url: Optional[str] = None,
        likes_count: Optional[int] = None,
        author_name: Optional[str] = None,
    ) -> bool:
        """
        发送富文本消息
        :param title: 消息标题
        :param content: 消息内容
        :param video_url: 视频链接
        :param likes_count: 点赞数
        :param author_name: 作者名称
        :return: 是否发送成功
        """
        rich_content = []

        # 添加标题
        rich_content.append(
            [{"tag": "text", "text": f"🔥 {title}\n", "style": ["bold"]}]
        )

        # 添加作者信息
        if author_name:
            rich_content.append([{"tag": "text", "text": f"👤 作者：{author_name}\n"}])

        # 添加点赞数
        if likes_count is not None:
            rich_content.append(
                [{"tag": "text", "text": f"❤️ 点赞数：{likes_count:,}\n"}]
            )

        # 添加内容
        rich_content.append([{"tag": "text", "text": f"📝 内容：{content}\n"}])

        # 添加视频链接
        if video_url:
            rich_content.append(
                [{"tag": "a", "text": "🎬 查看视频", "href": video_url}]
            )

        message = {
            "msg_type": "post",
            "content": {
                "post": {
                    "zh_cn": {"title": "抖音博主作品热度提醒", "content": rich_content}
                }
            },
        }
        return await self._send_message(message)

    async def send_card_message(self, video_info: Dict[str, Any]) -> bool:
        """
        发送卡片消息
        :param video_info: 视频信息字典
        :return: 是否发送成功
        """
        aweme_id = video_info.get("aweme_id", "unknown")
        desc = video_info.get("desc", "无描述")
        author_info = video_info.get("author", {})
        author_name = author_info.get("nickname", "未知作者")
        statistics = video_info.get("statistics", {})
        digg_count = statistics.get("digg_count", 0)
        comment_count = statistics.get("comment_count", 0)
        share_count = statistics.get("share_count", 0)

        # 构建视频链接
        video_url = f"https://www.douyin.com/video/{aweme_id}"
        data_url = f"https://yb7ao262ru.feishu.cn/wiki/QyVqwmDZDioZmrkGZPXcYJtFn5d?table=tblzjGWgMzIbcd1p&view=vewoIQDc7P"

        # 获取视频发布时间
        from datetime import datetime

        create_time = video_info.get("create_time", 0)
        if create_time:
            publish_time = datetime.fromtimestamp(create_time).strftime(
                "%Y-%m-%d %H:%M:%S"
            )
        else:
            publish_time = "未知"

        # 获取当前时间
        current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        # 检查是否为流程webhook
        if "/flow/api/trigger-webhook/" in self.webhook_url:
            # 流程webhook发送优化的文本消息
            text_content = self._format_flow_message(
                author_name,
                desc,
                digg_count,
                comment_count,
                share_count,
                video_url,
                current_time,
                publish_time,
            )

            message = {"msg_type": "text", "content": {"text": text_content}}
        else:
            # 标准机器人格式 - 优化的卡片布局
            message = {
                "msg_type": "interactive",
                "card": {
                    "config": {"wide_screen_mode": True},
                    "elements": [
                        # 作者信息区块
                        {
                            "tag": "div",
                            "text": {
                                "content": f"**👤 {author_name}** 发布了新的热门作品",
                                "tag": "lark_md",
                            },
                        },
                        # 分隔线
                        {"tag": "hr"},
                        # 视频内容描述
                        {
                            "tag": "div",
                            "text": {
                                "content": f"📝 **标题**\n{desc[:150]}{'...' if len(desc) > 150 else ''}",
                                "tag": "lark_md",
                            },
                        },
                        # 数据统计区块
                        {
                            "tag": "div",
                            "text": {
                                "content": self._format_statistics(
                                    digg_count, comment_count, share_count
                                ),
                                "tag": "lark_md",
                            },
                        },
                        # 时间信息
                        {
                            "tag": "div",
                            "text": {
                                "content": f"📅 **发布时间：** {publish_time}\n🕐 **检测时间：** {current_time}",
                                "tag": "lark_md",
                            },
                        },
                        # 操作按钮区
                        {
                            "actions": [
                                {
                                    "tag": "button",
                                    "text": {
                                        "content": "🎬 立即观看",
                                        "tag": "lark_md",
                                    },
                                    "url": video_url,
                                    "type": "primary",
                                },
                                {
                                    "tag": "button",
                                    "text": {
                                        "content": "📊 查看数据",
                                        "tag": "lark_md",
                                    },
                                    "url": data_url,
                                    "type": "default",
                                },
                            ],
                            "tag": "action",
                        },
                    ],
                    "header": {
                        "title": {
                            "content": "🔥 抖音热门作品提醒",
                            "tag": "plain_text",
                        },
                        "template": "orange",
                    },
                },
            }
        return await self._send_message(message)

    def _format_flow_message(
        self,
        author_name: str,
        desc: str,
        digg_count: int,
        comment_count: int,
        share_count: int,
        video_url: str,
        current_time: str,
        publish_time: str = "未知",
    ) -> str:
        """
        格式化流程webhook的消息内容
        """
        # 计算热度等级
        hot_level = self._get_hot_level(digg_count)

        return f"""🔥 抖音热门作品提醒 {hot_level}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 作者：{author_name}

📝 内容：
{desc[:120]}{'...' if len(desc) > 120 else ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 数据表现：
❤️ 点赞：{digg_count:,}
💬 评论：{comment_count:,}
🔗 分享：{share_count:,}
🔥 热度：{self._calculate_heat_score(digg_count, comment_count, share_count):,}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎬 视频链接：{video_url}
📅 发布时间：{publish_time}
🕐 检测时间：{current_time}"""

    def _format_statistics(
        self, digg_count: int, comment_count: int, share_count: int
    ) -> str:
        """
        格式化统计数据
        """
        heat_score = self._calculate_heat_score(digg_count, comment_count, share_count)
        hot_level = self._get_hot_level(digg_count)

        return f"""📊 **数据表现** {hot_level}
❤️ **点赞：** {digg_count:,}
💬 **评论：** {comment_count:,}
🔗 **分享：** {share_count:,}
🔥 **热度值：** {heat_score:,}"""

    def _get_hot_level(self, digg_count: int) -> str:
        """
        根据点赞数获取热度等级标识
        """
        if digg_count >= 100000:
            return "🌋"  # 超级热门
        elif digg_count >= 50000:
            return "🔥🔥🔥"  # 非常热门
        elif digg_count >= 10000:
            return "🔥🔥"  # 很热门
        elif digg_count >= 1000:
            return "🔥"  # 热门
        else:
            return "⭐"  # 新星

    def _calculate_heat_score(
        self, digg_count: int, comment_count: int, share_count: int
    ) -> int:
        """
        计算综合热度值
        """
        return digg_count + (comment_count * 2) + (share_count * 3)

    async def _send_message(self, message: Dict[str, Any]) -> bool:
        """
        发送消息到飞书
        :param message: 消息内容
        :return: 是否发送成功
        """
        try:
            headers = {"Content-Type": "application/json; charset=utf-8"}

            # 创建SSL上下文，跳过证书验证（开发环境）
            ssl_context = False  # 禁用SSL验证

            async with aiohttp.ClientSession(
                connector=aiohttp.TCPConnector(ssl=ssl_context)
            ) as session:
                async with session.post(
                    self.webhook_url,
                    headers=headers,
                    data=json.dumps(message, ensure_ascii=False),
                ) as response:
                    result = await response.json()

                    # 兼容不同类型的响应
                    if response.status == 200:
                        # 流程webhook返回格式: {"code":0,"data":{},"msg":"success"}
                        # 机器人webhook返回格式: {"code":0}
                        if (
                            result.get("code") == 0
                            or result.get("msg") == "success"
                            or "success" in str(result).lower()
                        ):
                            logger.info(f"飞书消息发送成功: {result}")
                            return True

                    logger.error(
                        f"飞书消息发送失败: status={response.status}, result={result}"
                    )
                    return False

        except Exception as e:
            logger.error(f"发送飞书消息时发生异常: {e}")
            return False


# 全局飞书通知器实例
_feishu_notifier: Optional[FeishuNotifier] = None


def init_feishu_notifier(webhook_url: str) -> None:
    """
    初始化全局飞书通知器
    :param webhook_url: webhook地址
    """
    global _feishu_notifier
    _feishu_notifier = FeishuNotifier(webhook_url)
    logger.info(f"飞书通知器初始化完成: {webhook_url}")


def get_feishu_notifier() -> Optional[FeishuNotifier]:
    """
    获取全局飞书通知器实例
    :return: 飞书通知器实例
    """
    return _feishu_notifier


async def send_video_notification(video_info: Dict[str, Any]) -> bool:
    """
    发送视频通知
    :param video_info: 视频信息
    :return: 是否发送成功
    """
    if not _feishu_notifier:
        logger.warning("飞书通知器未初始化")
        return False

    return await _feishu_notifier.send_card_message(video_info)

async def send_cookie_expired_notification(platform: str, account_id: str) -> bool:
    """
    发送Cookie过期通知
    :param platform: 平台名称（如：抖音、微博等）
    :param account_id: 账号ID
    :return: 是否发送成功
    """
    if not _feishu_notifier:
        logger.warning("飞书通知器未初始化")
        return False

    # 获取当前时间
    current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    message = {
        "msg_type": "interactive",
        "card": {
            "config": {"wide_screen_mode": True},
            "elements": [
                # 账号信息区块
                {
                    "tag": "div",
                    "text": {
                        "content": f"**⚠️ {platform}账号 Cookie已过期**\n账号ID: {account_id}",
                        "tag": "lark_md",
                    },
                },
                # 分隔线
                {"tag": "hr"},
                # 时间信息
                {
                    "tag": "div",
                    "text": {
                        "content": f"🕐 **过期时间：** {current_time}",
                        "tag": "lark_md",
                    },
                },
                # 提示信息
                {
                    "tag": "div",
                    "text": {
                        "content": "请及时更新Cookie以确保服务正常运行",
                        "tag": "lark_md",
                    },
                },
            ],
            "header": {
                "title": {
                    "content": "🔔 Cookie过期提醒",
                    "tag": "plain_text",
                },
                "template": "red",
            },
        },
    }
    return await _feishu_notifier._send_message(message)
