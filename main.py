from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from importlib import import_module
from lib.logger import logger
from utils.douyin_monitor import init_monitor
from utils.scheduler import start_scheduler, stop_scheduler
import uvicorn
import yaml
import argparse
import os
import atexit

CONFIG_PATH = ''

app = FastAPI()

# 挂载静态文件目录
app.mount("/assets", StaticFiles(directory="frontend/dist/assets"), name="assets")
app.mount("/static", StaticFiles(directory="frontend/dist"), name="static")

# 添加根路径路由，返回前端页面
@app.get("/")
async def read_root():
    return FileResponse("frontend/dist/index.html")

# 配置 CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:8080", "http://127.0.0.1:8080", "http://127.0.0.1:5173"],  # 允许的前端域名
    allow_credentials=True,
    allow_methods=["*"],  # 允许所有方法
    allow_headers=["*"],  # 允许所有请求头
)

services = ['xhs', 'weibo', 'taobao', 'kuaishou', 'jd', 'douyin', 'bilibili', 'proxies', 'monitor']

def register_router():
    for service in services:
        module = import_module(f'service.{service}.urls')
        app.include_router(getattr(module, 'router'))

def init_service():
    global CONFIG_PATH
    if CONFIG_PATH == '':
        CONFIG_PATH = os.getenv("FILE", 'config/config.yaml')
    with open(CONFIG_PATH, 'r', encoding='utf-8') as f:
        config = yaml.safe_load(f)
        logger.setup(config)
        
        # 初始化抖音监控器
        douyin_monitor_config = config.get('douyin_monitor', {})
        if douyin_monitor_config.get('enabled', False):
            monitor = init_monitor(douyin_monitor_config)
            logger.info(f"抖音监控器初始化完成，状态：{monitor.get_status()}")
            
            # 启动定时任务调度器
            start_scheduler()
            logger.info("定时任务调度器已启动")
            
            # 注册退出时的清理函数
            atexit.register(stop_scheduler)
        else:
            logger.info("抖音监控功能未启用")

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Crawler server.')
    parser.add_argument('-f', '--file', type=str, help='path of config file', default='config/config.yaml')
    args = parser.parse_args()
    CONFIG_PATH = args.file
    register_router()
    init_service()
    uvicorn.run("main:app", host="0.0.0.0", port=8080)
else:
    register_router()
    init_service()