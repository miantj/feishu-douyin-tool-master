"""
监控管理路由
"""
from fastapi import APIRouter
from . import views

router = APIRouter(prefix='/monitor')

# 监控状态相关
router.add_api_route('/status', views.get_monitor_status, methods=['GET'])
router.add_api_route('/run-once', views.run_monitor_once, methods=['POST'])
router.add_api_route('/scheduler/status', views.get_scheduler_status, methods=['GET'])

# 配置管理相关
router.add_api_route('/config', views.get_monitor_config, methods=['GET'])
router.add_api_route('/config', views.update_monitor_config, methods=['PUT'])
router.add_api_route('/config/users', views.get_monitor_users, methods=['GET'])
router.add_api_route('/config/users', views.add_monitor_user, methods=['POST'])
router.add_api_route('/config/users/{user_id}', views.update_monitor_user, methods=['PUT'])
router.add_api_route('/config/users/{user_id}', views.delete_monitor_user, methods=['DELETE'])
router.add_api_route('/config/toggle', views.toggle_monitor, methods=['POST'])
router.add_api_route('/test-notification', views.test_notification, methods=['POST'])