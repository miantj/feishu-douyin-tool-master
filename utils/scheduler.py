"""
定时任务调度器
用于管理抖音监控等定时任务
"""
import asyncio
from typing import Optional
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from lib.logger import logger
from utils.douyin_monitor import start_monitor_task, get_monitor


class TaskScheduler:
    """任务调度器"""
    
    def __init__(self):
        """初始化调度器"""
        self.scheduler: Optional[AsyncIOScheduler] = None
        self.monitor_task_id = "douyin_monitor_task"
    
    def start(self):
        """启动调度器"""
        if self.scheduler is not None:
            logger.warning("调度器已经启动")
            return
        
        self.scheduler = AsyncIOScheduler()
        
        # 添加监控任务
        self._add_monitor_task()
        
        # 启动调度器
        self.scheduler.start()
        logger.info("定时任务调度器启动成功")
    
    def stop(self):
        """停止调度器"""
        if self.scheduler is not None:
            self.scheduler.shutdown()
            self.scheduler = None
            logger.info("定时任务调度器已停止")
    
    def _add_monitor_task(self):
        """添加监控任务"""
        monitor = get_monitor()
        if not monitor:
            logger.warning("监控器未初始化，跳过添加监控任务")
            return
        
        if not monitor.enabled:
            logger.info("监控功能未启用，跳过添加监控任务")
            return
        
        # 添加定时任务
        self.scheduler.add_job(
            func=self._run_monitor_task,
            trigger=IntervalTrigger(hours=monitor.interval_hours),
            id=self.monitor_task_id,
            name="抖音博主监控任务",
            replace_existing=True,
            max_instances=1  # 防止任务重叠执行
        )
        
        logger.info(f"已添加抖音监控任务，间隔：{monitor.interval_hours}小时")
    
    async def _run_monitor_task(self):
        """运行监控任务"""
        try:
            logger.info("开始执行抖音监控任务")
            monitor = get_monitor()
            if monitor:
                await monitor.check_all_users()
            logger.info("抖音监控任务执行完成")
        except Exception as e:
            logger.error(f"执行抖音监控任务时发生异常: {e}")
    
    def update_monitor_task(self):
        """更新监控任务"""
        if self.scheduler is None:
            return
        
        # 移除现有任务
        try:
            self.scheduler.remove_job(self.monitor_task_id)
            logger.info("已移除旧的监控任务")
        except Exception:
            pass  # 任务可能不存在
        
        # 重新添加任务
        self._add_monitor_task()
    
    def get_job_status(self) -> dict:
        """获取任务状态"""
        if self.scheduler is None:
            return {"scheduler_running": False, "jobs": []}
        
        jobs = []
        for job in self.scheduler.get_jobs():
            jobs.append({
                "id": job.id,
                "name": job.name,
                "next_run": str(job.next_run_time) if job.next_run_time else None,
                "trigger": str(job.trigger)
            })
        
        return {
            "scheduler_running": self.scheduler.running,
            "jobs": jobs
        }
    
    async def run_monitor_once(self):
        """立即执行一次监控任务"""
        await self._run_monitor_task()


# 全局调度器实例
_scheduler_instance: Optional[TaskScheduler] = None


def get_scheduler() -> TaskScheduler:
    """获取调度器实例"""
    global _scheduler_instance
    if _scheduler_instance is None:
        _scheduler_instance = TaskScheduler()
    return _scheduler_instance


def start_scheduler():
    """启动调度器"""
    scheduler = get_scheduler()
    scheduler.start()


def stop_scheduler():
    """停止调度器"""
    scheduler = get_scheduler()
    scheduler.stop()


async def run_monitor_immediately():
    """立即运行一次监控任务"""
    scheduler = get_scheduler()
    await scheduler.run_monitor_once()