# 抖音博主监控功能使用说明

## 功能概述

抖音博主监控功能可以：
- 每隔1小时自动获取指定博主的作品列表
- 当作品点赞数超过设定阈值时，自动发送飞书通知
- 支持多个博主同时监控，每个博主可以设置不同的点赞阈值
- 支持去重机制，避免同一视频重复通知

## 配置步骤

### 1. 安装依赖

首先安装新增的依赖包：

```bash
pip install -r requirements.txt
```

### 2. 配置飞书机器人

1. 在飞书群聊中添加自定义机器人
2. 获取机器人的Webhook地址
3. 将Webhook地址配置到 `config/config.yaml` 文件中

### 3. 修改配置文件

编辑 `config/config.yaml` 文件，添加监控配置：

```yaml
# 抖音监控配置
douyin_monitor:
  # 是否启用监控
  enabled: true
  
  # 监控间隔（小时）
  interval_hours: 1
  
  # 飞书通知配置
  feishu:
    # 飞书机器人webhook地址（请替换为你的实际地址）
    webhook_url: "https://open.feishu.cn/open-apis/bot/v2/hook/你的webhook_token"
    
  # 监控的博主列表
  users:
    - sec_user_id: "MS4wLjABAAAA实际的用户ID"  # 博主的sec_user_id
      nickname: "博主昵称"                    # 博主昵称（用于通知显示）
      like_threshold: 10000                   # 点赞数阈值
      enabled: true                          # 是否启用此博主的监控
      
  # 监控设置
  settings:
    # 每次检查获取的视频数量
    videos_per_check: 10
    
    # 只监控最近N小时内发布的视频（避免重复通知老视频）
    recent_hours: 24
    
    # 是否启用去重（避免同一视频多次通知）
    enable_deduplication: true
    
    # 去重缓存时间（小时）
    dedup_cache_hours: 72
```

### 4. 获取博主的sec_user_id

1. 打开抖音网页版：https://www.douyin.com
2. 搜索并进入目标博主的主页
3. 从URL中获取sec_user_id，格式如：`https://www.douyin.com/user/MS4wLjABAAAA...`
4. 将`MS4wLjABAAAA...`这部分作为sec_user_id配置到yaml文件中

### 5. 添加抖音账号

使用现有的抖音账号管理功能，确保有可用的抖音账号：

```bash
# 通过API添加账号
curl -X POST "http://localhost:8080/douyin/add_account" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "account1",
    "cookie": "你的抖音cookie"
  }'
```

## 启动和使用

### 1. 启动服务

```bash
python main.py
```

服务启动后，如果配置正确，监控功能会自动开始工作。

### 2. API接口

监控功能提供了以下API接口：

#### 查看监控状态
```bash
GET /monitor/status
```

#### 查看调度器状态
```bash
GET /monitor/scheduler/status
```

#### 立即执行一次监控
```bash
POST /monitor/run-once
```

### 3. 测试功能

可以使用测试脚本验证功能：

```bash
python test/douyin_monitor.py
```

## 通知效果

当检测到视频点赞数超过阈值时，会发送包含以下信息的飞书通知：
- 博主昵称
- 视频内容描述
- 当前点赞数、评论数、分享数
- 视频链接

## 注意事项

1. **Cookie有效性**：确保添加的抖音账号Cookie是有效的，过期的Cookie会导致监控失败

2. **频率限制**：不建议将监控间隔设置得太频繁，避免被抖音限制

3. **网络环境**：确保服务器能够正常访问抖音和飞书的API

4. **日志监控**：可以通过日志文件监控功能运行状态：`tail -f .log/crawler.log`

5. **配置更新**：修改配置文件后需要重启服务才能生效

## 故障排除

### 1. 监控不工作
- 检查配置文件中 `enabled: true`
- 检查是否有可用的抖音账号
- 查看日志文件中的错误信息

### 2. 通知发送失败
- 检查飞书Webhook地址是否正确
- 确认机器人已被添加到目标群聊
- 检查网络连接是否正常

### 3. 获取视频失败
- 检查抖音账号Cookie是否有效
- 确认sec_user_id是否正确
- 查看是否有网络访问限制

## 扩展功能

可以根据需要扩展以下功能：
- 支持更多平台（微博、小红书等）
- 添加更多通知方式（钉钉、企业微信等）
- 支持更复杂的监控条件（评论数、转发数等）
- 添加数据统计和分析功能

## 更新日志

- v1.0.0: 初始版本，支持抖音博主点赞数监控和飞书通知