from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from tasks.contract_tasks import check_expired_contracts
from core.logging import logging

logger = logging.getLogger(__name__)
scheduler = BackgroundScheduler()


def start_scheduler():
    """启动定时任务调度器"""
    # 每天凌晨1点检查过期合同
    scheduler.add_job(
        check_expired_contracts,
        CronTrigger(hour=1, minute=0),
        id='check_expired_contracts',
        name='检查过期合同',
        replace_existing=True,
    )

    scheduler.start()
    logger.info("定时任务调度器已启动")


def shutdown_scheduler():
    """关闭定时任务调度器"""
    if scheduler.running:
        scheduler.shutdown()
        logger.info("定时任务调度器已关闭")
