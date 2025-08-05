// 定义非法字符正则和替换字符
const invalid = /[\\\n\r/:*?"<>|]/g;
const repWith = "";

/**
 * 获取作品ID
 * @param {string} dyurl - 抖音短链接。
 * @returns {string} 作品ID
 * @throws {Error} 在请求失败或解析ID时可能会抛出错误。
 */
export async function GetID(dyurl) {
  const response = dyurl;

  if (response.request.res.responseUrl.includes("video")) {
    item_ids = VIDEO_REGEX.exec(response.request.res.responseUrl)[1];
  } else if (response.request.res.responseUrl.includes("note")) {
    item_ids = NOTE_REGEX.exec(response.request.res.responseUrl)[1];
  } else {
    console.error("URL格式不匹配任何已知模式");
    return;
  }
  return item_ids;
}

// 提取需要的数据
export async function getObtainData(data) {
  const {
    video,
    music,
    author,
    desc,
    aweme_id,
    aweme_type,
    statistics,
    create_time,
    images: rawImages,
  } = data || {};

  // 添加数据验证
  if (!author || !statistics) {
    console.error("缺少必要的数据字段");
    return { code: -1, data: null, msg: "数据解析失败：缺少必要字段" };
  }

  const uniqueId = author.unique_id || author.short_id || music?.owner_handle; // 如果unique_id为空，则使用short_id
  const userhome = author.sec_uid
    ? `https://www.douyin.com/user/${author.sec_uid}`
    : "";
  const type = Number(aweme_type) === 0 ? "视频" : "图集";
  const images =
    rawImages?.length > 0
      ? rawImages.map((image) => image.url_list?.[0] || "").filter(Boolean)
      : [];

  const url = aweme_id ? `https://www.douyin.com/video/${aweme_id}` : "";
  // 处理视频URL和封面URL
  const videoUrl = video?.bit_rate?.[0]?.play_addr?.url_list?.[0] ?? "";
  const noteCover = video?.cover?.url_list?.[0] ?? "";
  const cleanedDesc = (desc || "").replaceAll(invalid, repWith);

  const res = {
    url,
    type,
    title: cleanedDesc,
    videoUrl: videoUrl,
    noteCover,
    musicUrl: music?.play_url?.uri ?? "",
    musicTitle: music?.title ?? "",
    nickname: author.nickname,
    signature: author.signature,
    userhome,
    uniqueId,
    videoId: aweme_id,
    images,
    statistics: {
      collect_count: statistics?.collect_count ?? 0,
      digg_count: statistics?.digg_count ?? 0,
      share_count: statistics?.share_count ?? 0,
      comment_count: statistics?.comment_count ?? 0,
    },
    releaseTime: (create_time || 0) * 1000,
    collectionCount: Number(statistics?.collect_count ?? 0),
    likeCount: Number(statistics?.digg_count ?? 0),
    shareCount: Number(statistics?.share_count ?? 0),
    commentCount: Number(statistics?.comment_count ?? 0),
  };
  return res;
}
