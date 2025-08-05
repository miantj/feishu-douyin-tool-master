"""
抖音URL解析工具
从抖音主页地址中提取sec_user_id
"""
import re
import aiohttp
from urllib.parse import urlparse, parse_qs
from lib.logger import logger


def extract_sec_user_id_from_url(url: str) -> str:
    """
    从抖音主页URL中提取sec_user_id
    支持的URL格式：
    - https://www.douyin.com/user/MS4wLjABAAAA...
    - https://v.douyin.com/xxx/ (短链接)
    """
    if not url:
        return ""
    
    # 清理URL
    url = url.strip()
    
    # 直接从完整URL中提取
    if 'douyin.com/user/' in url:
        match = re.search(r'/user/([^/?]+)', url)
        if match:
            sec_user_id = match.group(1)
            # 验证sec_user_id格式
            if sec_user_id.startswith('MS4wLjABAAAA'):
                return sec_user_id
    
    return ""


async def resolve_douyin_short_url(short_url: str) -> str:
    """
    解析抖音短链接，获取完整URL
    """
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.get(short_url, headers=headers, allow_redirects=True) as response:
                return str(response.url)
                
    except Exception as e:
        logger.error(f"解析短链接失败: {e}")
        return ""


async def get_sec_user_id_from_any_url(url: str) -> str:
    """
    从任意抖音URL中获取sec_user_id
    自动处理短链接和完整链接
    """
    if not url:
        return ""
    
    # 首先尝试直接提取
    sec_user_id = extract_sec_user_id_from_url(url)
    if sec_user_id:
        return sec_user_id
    
    # 如果是短链接，先解析
    if 'v.douyin.com' in url or 'douyin.com' in url and len(url) < 50:
        logger.info(f"检测到短链接，正在解析: {url}")
        full_url = await resolve_douyin_short_url(url)
        if full_url:
            sec_user_id = extract_sec_user_id_from_url(full_url)
            if sec_user_id:
                return sec_user_id
    
    return ""


def validate_douyin_url(url: str) -> bool:
    """
    验证是否为有效的抖音URL
    """
    if not url:
        return False
    
    douyin_domains = [
        'douyin.com',
        'v.douyin.com',
        'www.douyin.com'
    ]
    
    try:
        parsed = urlparse(url)
        domain = parsed.netloc.lower()
        
        for douyin_domain in douyin_domains:
            if douyin_domain in domain:
                return True
                
    except Exception:
        pass
    
    return False


def format_douyin_url(url: str) -> str:
    """
    格式化抖音URL，确保包含协议
    """
    if not url:
        return ""
    
    url = url.strip()
    
    # 如果没有协议，添加https
    if not url.startswith(('http://', 'https://')):
        url = 'https://' + url
    
    return url