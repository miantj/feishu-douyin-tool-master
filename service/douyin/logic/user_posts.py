from .common import common_request

async def request_user_posts(sec_user_id: str, max_cursor: int, cookie: str, count: int = 18) -> tuple[dict, bool]:
    """
    请求抖音获取用户发布的视频列表
    :param sec_user_id: 用户ID
    :param max_cursor: 分页游标
    :param cookie: 请求cookie
    :param count: 每页数量，默认18，最大50
    """
    # 确保count在合理范围内
    count = min(max(count, 1), 50)
    
    params = {
        "sec_user_id": sec_user_id,
        "max_cursor": max_cursor,
        "locate_query": "false",
        "show_live_replay_strategy": "1",
        "need_time_list": "1",
        "time_list_query": "0",
        "count": str(count),  # 使用动态的count值
        "publish_video_strategy_type": "2",
        "from_user_page": "1"
    }
    headers = {"cookie": cookie}
    resp, succ = await common_request('/aweme/v1/web/aweme/post/', params, headers)
    if not succ:
        return resp, succ
    return resp, succ