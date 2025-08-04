from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from importlib import import_module
from lib.logger import logger
import uvicorn
import yaml
import argparse
import os

CONFIG_PATH = ''

app = FastAPI()

# 配置 CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # 允许的前端域名
    allow_credentials=True,
    allow_methods=["*"],  # 允许所有方法
    allow_headers=["*"],  # 允许所有请求头
)

services = ['xhs', 'weibo', 'taobao', 'kuaishou', 'jd', 'douyin', 'bilibili', 'proxies']

def register_router():
    for service in services:
        module = import_module(f'service.{service}.urls')
        app.include_router(getattr(module, 'router'))

def init_service():
    global CONFIG_PATH
    if CONFIG_PATH == '':
        CONFIG_PATH = os.getenv("FILE", 'config/config.yaml')
    with open(CONFIG_PATH, 'r') as f:
        config = yaml.safe_load(f)
        logger.setup(config)

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