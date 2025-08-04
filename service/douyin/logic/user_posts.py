from .common import common_request

async def request_user_posts(sec_user_id: str, max_cursor: int, cookie: str) -> tuple[dict, bool]:
    """
    请求抖音获取用户发布的视频列表
    """
    params = {
        "sec_user_id": sec_user_id,
        "max_cursor": max_cursor,
        "locate_query": "false",
        "show_live_replay_strategy": "1",
        "need_time_list": "1",
        "time_list_query": "0",
        "count": "18",
        "publish_video_strategy_type": "2",
        "from_user_page": "1"
    }
    headers = {"cookie": cookie}
    resp, succ = await common_request('/aweme/v1/web/aweme/post/', params, headers)
    if not succ:
        return resp, succ
    return resp, succ