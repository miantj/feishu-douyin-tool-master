"""
监控状态查看接口
"""
from utils.error_code import ErrorCode
from utils.reply import reply
from utils.douyin_monitor import get_monitor
from utils.scheduler import get_scheduler
from lib.logger import logger


async def get_monitor_status():
    """
    获取监控状态
    """
    try:
        monitor = get_monitor()
        if not monitor:
            return reply(ErrorCode.ERROR, '监控器未初始化')
        
        status = monitor.get_status()
        return reply(ErrorCode.OK, '成功', status)
        
    except Exception as e:
        logger.error(f'获取监控状态失败: {e}')
        return reply(ErrorCode.ERROR, f'获取监控状态失败: {str(e)}')


async def get_scheduler_status():
    """
    获取调度器状态
    """
    try:
        scheduler = get_scheduler()
        status = scheduler.get_job_status()
        return reply(ErrorCode.OK, '成功', status)
        
    except Exception as e:
        logger.error(f'获取调度器状态失败: {e}')
        return reply(ErrorCode.ERROR, f'获取调度器状态失败: {str(e)}')