# 监控管理 API 文档

## 概述

监控管理API提供了完整的抖音博主监控功能，包括配置管理、用户管理和状态查看。

## 基础信息

- **Base URL**: `http://localhost:8080/monitor`
- **Content-Type**: `application/json`

## API 接口列表

### 1. 监控状态

#### 获取监控状态
```http
GET /monitor/status
```

**响应示例**:
```json
{
  "code": 0,
  "msg": "成功",
  "data": {
    "enabled": true,
    "total_users": 2,
    "monitored_users": 2,
    "interval_hours": 1,
    "notified_videos_count": 5,
    "feishu_configured": true
  }
}
```

#### 获取调度器状态
```http
GET /monitor/scheduler/status
```

**响应示例**:
```json
{
  "code": 0,
  "msg": "成功", 
  "data": {
    "scheduler_running": true,
    "jobs": [
      {
        "id": "douyin_monitor_task",
        "name": "抖音博主监控任务",
        "next_run": "2024-01-15 15:00:00",
        "trigger": "interval[1:00:00]"
      }
    ]
  }
}
```

### 2. 监控控制

#### 立即执行一次监控
```http
POST /monitor/run-once
```

**响应示例**:
```json
{
  "code": 0,
  "msg": "监控任务执行完成"
}
```

### 3. 配置管理

#### 获取监控配置
```http
GET /monitor/config
```

**响应示例**:
```json
{
  "code": 0,
  "msg": "成功",
  "data": {
    "enabled": true,
    "interval_hours": 1,
    "feishu_webhook_url": "https://open.feishu.cn/open-apis/bot/v2/hook/...",
    "videos_per_check": 10,
    "recent_hours": 24,
    "enable_deduplication": true,
    "dedup_cache_hours": 72
  }
}
```

#### 更新监控配置
```http
PUT /monitor/config
```

**请求体**:
```json
{
  "enabled": true,
  "interval_hours": 2,
  "feishu_webhook_url": "https://open.feishu.cn/open-apis/bot/v2/hook/...",
  "videos_per_check": 15,
  "recent_hours": 48,
  "enable_deduplication": true,
  "dedup_cache_hours": 96
}
```

#### 切换监控开关
```http
POST /monitor/config/toggle
```

**请求体**:
```json
{
  "enabled": true
}
```

### 4. 用户管理

#### 获取监控用户列表
```http
GET /monitor/config/users
```

**响应示例**:
```json
{
  "code": 0,
  "msg": "成功",
  "data": [
    {
      "id": 0,
      "sec_user_id": "MS4wLjABAAAA...",
      "profile_url": "https://www.douyin.com/user/MS4wLjABAAAA...",
      "nickname": "博主名称",
      "like_threshold": 10000,
      "enabled": true
    }
  ]
}
```

#### 添加监控用户
```http
POST /monitor/config/users
```

**请求体**:
```json
{
  "profile_url": "https://www.douyin.com/user/MS4wLjABAAAA...",
  "nickname": "博主名称",
  "like_threshold": 10000,
  "enabled": true
}
```

**说明**:
- `profile_url`: 支持完整的抖音主页地址，系统会自动提取用户ID
- 支持短链接自动解析

#### 更新监控用户
```http
PUT /monitor/config/users/{user_id}
```

**路径参数**:
- `user_id`: 用户在列表中的索引ID

**请求体**:
```json
{
  "profile_url": "https://www.douyin.com/user/MS4wLjABAAAA...",
  "nickname": "新的博主名称",
  "like_threshold": 20000,
  "enabled": true
}
```

#### 删除监控用户
```http
DELETE /monitor/config/users/{user_id}
```

**路径参数**:
- `user_id`: 用户在列表中的索引ID

## 错误响应

所有API在出错时返回统一格式：

```json
{
  "code": -1,
  "msg": "错误描述"
}
```

常见错误码：
- `0`: 成功
- `-1`: 通用错误
- `具体错误码`: 参考 `utils/error_code.py`

## 注意事项

1. **主页地址格式**: 支持以下格式的抖音主页地址
   - 完整地址: `https://www.douyin.com/user/MS4wLjABAAAA...`
   - 短链接: `https://v.douyin.com/xxx/`

2. **用户ID提取**: 系统会自动从主页地址中提取 `sec_user_id`

3. **配置热更新**: 修改配置后会立即生效，无需重启服务

4. **用户索引**: 用户的ID使用数组索引，删除用户后索引会发生变化

5. **监控间隔**: 建议监控间隔不少于1小时，避免频繁请求

## 前端集成

前端已集成完整的监控管理界面，包括：
- 配置管理标签页
- 用户管理标签页  
- 状态监控标签页

访问方式：在主界面选择"监控管理"标签即可使用。