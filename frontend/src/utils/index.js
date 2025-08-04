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
