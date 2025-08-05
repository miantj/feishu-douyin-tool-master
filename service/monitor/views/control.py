"""
监控控制接口
"""
from utils.error_code import ErrorCode
from utils.reply import reply
from utils.scheduler import run_monitor_immediately
from lib.logger import logger


async def run_monitor_once():
    """
    立即执行一次监控任务
    """
    try:
        logger.info('手动触发监控任务')
        await run_monitor_immediately()
        return reply(ErrorCode.OK, '监控任务执行完成')
        
    except Exception as e:
        logger.error(f'执行监控任务失败: {e}')
        return reply(ErrorCode.ERROR, f'执行监控任务失败: {str(e)}')