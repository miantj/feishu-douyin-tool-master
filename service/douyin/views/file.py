import os
import tempfile
from typing import Optional
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse, Response
import httpx
from urllib.parse import urlparse, unquote
import asyncio
import aiofiles

router = APIRouter()

async def download_file(url: str) -> tuple[bytes, str]:
    """下载文件并返回内容和文件名"""
    try:
        async with httpx.AsyncClient() as client:
            headers = {
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Referer": "https://www.douyin.com/"
            }
            response = await client.get(url, headers=headers, follow_redirects=True)
            response.raise_for_status()
            
            # 从URL中获取文件名
            parsed_url = urlparse(unquote(url))
            filename = os.path.basename(parsed_url.path)
            if '!' in filename:
                filename = filename.split('!')[0]
            
            return response.content, filename
    except Exception as e:
        raise HTTPException(status_code=200, detail={
            "code": 400,
            "data": None,
            "msg": f"下载文件失败: {str(e)}"
        })

@router.get("/getVideo")
async def get_video(url: Optional[str] = None):
    """获取视频文件"""
    if not url:
        return {"code": 400, "data": None, "msg": "缺少url"}
    
    try:
        content, filename = await download_file(url)
        
        # 直接返回内容，不使用临时文件
        return Response(
            content=content,
            media_type="video/mp4",
            headers={
                "Content-Disposition": f'inline; filename="{filename}"',
                "Content-Type": "video/mp4",
                "Accept-Ranges": "bytes",
                "X-Content-Type-Options": "nosniff"
            }
        )
        
    except HTTPException as e:
        return e.detail
    except Exception as e:
        return {"code": 400, "data": None, "msg": f"服务器内部错误: {str(e)}"}

@router.get("/getImage")
async def get_image(url: Optional[str] = None):
    """获取图片文件"""
    if not url:
        return {"code": 400, "data": None, "msg": "缺少url"}
    
    try:
        content, filename = await download_file(url)
        
        # 确保文件名以.jpeg结尾
        if not filename.lower().endswith(('.jpg', '.jpeg')):
            filename = f"{filename}.jpeg"
        
        return Response(
            content=content,
            media_type="image/jpeg",
            headers={
                "Content-Disposition": f'inline; filename="{filename}"',
                "X-Content-Type-Options": "nosniff"
            }
        )
        
    except HTTPException as e:
        return e.detail
    except Exception as e:
        return {"code": 400, "data": None, "msg": f"服务器内部错误: {str(e)}"}