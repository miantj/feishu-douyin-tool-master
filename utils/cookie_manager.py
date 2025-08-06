"""
Cookie管理模块
用于处理Cookie过期检测和通知
"""

from typing import Optional, Dict, Any, Tuple
from lib.logger import logger
from utils.feishu_notification import send_cookie_expired_notification
import json
import re

async def check_cookie_expired(
    response: Dict[str, Any],
    platform: str,
    account_id: str,
    custom_expired_check: Optional[callable] = None
) -> Tuple[bool, bool]:
    """
    检查Cookie是否过期并发送通知
    :param response: API响应数据
    :param platform: 平台名称
    :param account_id: 账号ID
    :param custom_expired_check: 自定义过期检查函数
    :return: (是否过期, 是否发送通知成功)
    """
    is_expired = False
    notification_sent = False

    try:
        # 如果提供了自定义检查函数，则使用它
        if custom_expired_check:
            is_expired = custom_expired_check(response)
        else:
            # 默认过期检查逻辑
            is_expired = _default_cookie_expired_check(response)

        if is_expired:
            # 发送飞书通知
            notification_sent = await send_cookie_expired_notification(platform, account_id)
            if notification_sent:
                logger.info(f"{platform} 账号 {account_id} Cookie过期通知发送成功")
            else:
                logger.error(f"{platform} 账号 {account_id} Cookie过期通知发送失败")

    except Exception as e:
        logger.error(f"检查Cookie过期时发生错误: {str(e)}")
        is_expired = False
        notification_sent = False

    return is_expired, notification_sent

def _default_cookie_expired_check(response: Dict[str, Any]) -> bool:
    """
    默认的Cookie过期检查逻辑
    :param response: API响应数据
    :return: 是否过期
    """
    # 转换响应为字符串以进行通用检查
    response_str = str(response).lower()
    
    # 常见的过期关键词
    expired_keywords = [
        'login', '登录', 'cookie', 'expired', '过期',
        'invalid', '失效', 'unauthorized', '未授权',
        'authentication', '认证', 'validate', '验证'
    ]
    
    # 检查状态码
    if isinstance(response, dict):
        # 检查常见的错误码
        code = response.get('code', response.get('status', response.get('errcode', None)))
        if code in [401, 403, 2100, -101, 10010]:  # 常见的未授权/登录错误码
            return True
            
        # 检查错误信息
        message = str(response.get('message', response.get('msg', response.get('error', ''))))
        if any(keyword in message.lower() for keyword in expired_keywords):
            return True
            
    # 通用文本检查
    return any(keyword in response_str for keyword in expired_keywords)