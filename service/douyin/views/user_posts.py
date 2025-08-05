from utils.error_code import ErrorCode
from utils.reply import reply
from ..models import accounts
from lib.logger import logger
from ..logic.user_posts import request_user_posts
import random

async def user_posts(sec_user_id: str, max_cursor: int = 0):
    """
    获取用户发布的视频列表
    :param sec_user_id: 用户ID
    :param max_cursor: 分页游标，默认0表示第一页
    """
    _accounts = await accounts.load()
    random.shuffle(_accounts)
    for account in _accounts:
        if account.get('expired', 0) == 1:
            continue
        account_id = account.get('id', '')
        res, succ = await request_user_posts(sec_user_id, max_cursor, account.get('cookie', ''), 18)
        if res == {} or not succ:
            logger.error(f'get user posts failed. account: {account_id}, sec_user_id: {sec_user_id}')
            continue
        logger.info(f'get user posts success, account: {account_id}, sec_user_id: {sec_user_id}')
        return reply(ErrorCode.OK, '成功', res)
    logger.warning(f'get user posts failed. sec_user_id: {sec_user_id}')
    return reply(ErrorCode.NO_ACCOUNT, '请先添加账号')