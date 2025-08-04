from . import views
from fastapi import APIRouter

router = APIRouter(prefix='/douyin')

router.add_api_route('/add_account', views.add_account, methods=['POST'])
router.add_api_route('/expire_account', views.expire_account, methods=['POST'])
router.add_api_route('/account_list', views.account_list, methods=['GET'])
router.add_api_route('/detail', views.detail, methods=['GET'])
router.add_api_route('/comments', views.comments, methods=['GET'])
router.add_api_route('/replys', views.replys, methods=['GET'])
router.add_api_route('/search', views.search, methods=['GET'])
router.add_api_route('/user', views.user, methods=['GET'])
router.add_api_route('/user/posts', views.user_posts, methods=['GET'])

# 添加文件处理路由
router.include_router(views.file_router, prefix='/file')