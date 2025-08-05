import axios from "axios";
import { config } from "./config.js";
import { getObtainData } from "./index.js";

// 创建axios实例
const service = axios.create({
  baseURL: config.serverHost, // API的base_url
  timeout: 60000, // 请求超时时间
  headers: {
    "Content-Type": "application/json;charset=UTF-8",
  },
});

// 请求拦截器
service.interceptors.request.use(
  (config) => {
    // 在发送请求之前做些什么
    console.log("发起请求:", config.url);

    // 可以在这里添加token
    // const token = localStorage.getItem('token')
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`
    // }

    return config;
  },
  (error) => {
    // 对请求错误做些什么
    console.error("请求错误:", error);
    return Promise.reject(error);
  }
);

// 响应拦截器
service.interceptors.response.use(
  (response) => {
    // 对响应数据做点什么
    const res = response.data;
    console.log("响应数据:", res);

    // 这里可以根据后端的响应格式进行统一处理
    // 如果code不为0，则判断为错误
    if (res.code && res.code !== 0) {
      console.warn("业务错误:", res.msg || "请求失败");

      // 可以在这里添加全局错误提示
      // ElMessage.error(res.msg || '请求失败')

      return Promise.reject(new Error(res.msg || "请求失败"));
    }

    return res;
  },
  (error) => {
    // 对响应错误做点什么
    console.error("响应错误:", error);

    let message = "网络错误";

    if (error.response) {
      // 请求已发出，但服务器响应的状态码不在 2xx 范围内
      const status = error.response.status;
      switch (status) {
        case 400:
          message = "请求错误(400)";
          break;
        case 401:
          message = "未授权，请重新登录(401)";
          // 可以在这里处理登录过期
          // router.push('/login')
          break;
        case 403:
          message = "拒绝访问(403)";
          break;
        case 404:
          message = "请求出错(404)";
          break;
        case 408:
          message = "请求超时(408)";
          break;
        case 500:
          message = "服务器错误(500)";
          break;
        case 501:
          message = "服务未实现(501)";
          break;
        case 502:
          message = "网络错误(502)";
          break;
        case 503:
          message = "服务不可用(503)";
          break;
        case 504:
          message = "网络超时(504)";
          break;
        case 505:
          message = "HTTP版本不受支持(505)";
          break;
        default:
          message = `连接出错(${status})!`;
      }
    } else if (error.request) {
      // 请求已经成功发起，但没有收到响应
      message = "网络连接异常,请稍后再试!";
    } else {
      // 发送请求时出了点问题
      message = error.message || "请求失败";
    }

    // 可以在这里添加全局错误提示
    // ElMessage.error(message)

    return Promise.reject(error);
  }
);

// 封装常用的请求方法
const api = {
  // GET请求
  get(url, params = {}) {
    return service({
      method: "get",
      url,
      params,
    });
  },

  // POST请求
  post(url, data = {}) {
    return service({
      method: "post",
      url,
      data,
    });
  },

  // PUT请求
  put(url, data = {}) {
    return service({
      method: "put",
      url,
      data,
    });
  },

  // DELETE请求
  delete(url, params = {}) {
    return service({
      method: "delete",
      url,
      params,
    });
  },

  // 文件上传
  upload(url, formData) {
    return service({
      method: "post",
      url,
      data: formData,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  // 下载文件
  download(url, params = {}) {
    return service({
      method: "get",
      url,
      params,
      responseType: "blob",
    });
  },
};

// 根据项目配置封装具体的API方法
const douyinApi = {
  // 获取抖音视频信息
  async getGouyinDetail(link) {
    const item_ids = link.match(/video\/(\d+)/)?.[1] || "";
    console.log("getQueryParams() >> item_ids", item_ids);
    const response = await api.get(`/douyin/detail?id=${item_ids}`);

    // 提取需要的数据
    const res = await getObtainData(response.data);

    // 验证必要字段
    if (!res.url && !res.images.length) {
      console.error("视频URL和图片列表都为空");
      return { code: -1, data: null, msg: "解析失败：未找到媒体内容" };
    }

    return { code: 0, data: res, msg: "解析成功" };
  },

  // 获取抖音用户视频列表
  async getDouyinUserList(link) {
    const sec_user_id = link.match(/user\/([^?&]+)/)?.[1] || "";
    console.log("getDouyinUserList() >> sec_user_id", sec_user_id);
    const response = await api.get(
      `/douyin/user/posts?sec_user_id=${sec_user_id}`
    );
    const { aweme_list } = response.data || {};
    // const aweme_list = [
    //   {
    //     aweme_id: "7525321412706454843",
    //     desc: "这谁听了不得喊两句啊？",
    //     create_time: 1752125431,
    //     author: {
    //       uid: "888870295051540",
    //       card_entries: null,
    //       nickname: "藤椒很麻呀²³⁵⁸ 🌶️",
    //       ban_user_functions: null,
    //       avatar_schema_list: null,
    //       avatar_thumb: {
    //         uri: "100x100/aweme-avatar/douyin-user-image-file_4560639592011267deb384bdc7ebdc90",
    //         url_list: [
    //           "https://p3-pc.douyinpic.com/aweme/100x100/aweme-avatar/douyin-user-image-file_4560639592011267deb384bdc7ebdc90.jpeg?from=327834062",
    //         ],
    //         width: 720,
    //         height: 720,
    //       },
    //       profile_mob_params: null,
    //       personal_tag_list: null,
    //       follow_status: 0,
    //       follower_list_secondary_information_struct: null,
    //       identity_labels: null,
    //       endorsement_info_list: null,
    //       custom_verify: "",
    //       white_cover_url: null,
    //       im_role_ids: null,
    //       user_permissions: null,
    //       batch_unfollow_relation_desc: null,
    //       homepage_bottom_toast: null,
    //       share_info: {
    //         share_url: "",
    //         share_weibo_desc: "",
    //         share_desc: "",
    //         share_title: "",
    //         share_qrcode_url: {
    //           uri: "",
    //           url_list: [],
    //           width: 720,
    //           height: 720,
    //         },
    //         share_title_myself: "",
    //         share_title_other: "",
    //         share_desc_info: "",
    //       },
    //       sec_uid: "MS4wLjABAAAA250wWQH1y6yH9TFbYBQIoal2suwu_01R6sE-OPeWaXk",
    //       can_set_geofencing: null,
    //       link_item_list: null,
    //       enterprise_verify_reason: "",
    //       is_ad_fake: false,
    //       private_relation_list: null,
    //       card_entries_not_display: null,
    //       batch_unfollow_contain_tabs: null,
    //       verification_permission_ids: null,
    //       card_sort_priority: null,
    //       risk_notice_text: "",
    //       display_info: null,
    //       prevent_download: false,
    //       contrail_list: null,
    //       need_points: null,
    //       not_seen_item_id_list: null,
    //       follower_status: 0,
    //       special_people_labels: null,
    //       data_label_list: null,
    //       not_seen_item_id_list_v2: null,
    //       cover_url: [
    //         {
    //           uri: "c8510002be9a3a61aad2",
    //           url_list: [
    //             "https://p3-pc-sign.douyinpic.com/obj/c8510002be9a3a61aad2?lk3s=138a59ce&x-expires=1755568800&x-signature=zjtpTDaJ%2F%2FBD0y4xaOOVtxXUpvw%3D&from=327834062",
    //             "https://p9-pc-sign.douyinpic.com/obj/c8510002be9a3a61aad2?lk3s=138a59ce&x-expires=1755568800&x-signature=9e4lchR%2BrJTb2P39GcWffojuB5U%3D&from=327834062",
    //           ],
    //           width: 720,
    //           height: 720,
    //         },
    //       ],
    //       offline_info_list: null,
    //       signature_extra: null,
    //       text_extra: null,
    //       interest_tags: null,
    //       cf_list: null,
    //       user_tags: null,
    //       account_cert_info: '{"is_biz_account":1}',
    //       familiar_visitor_user: null,
    //       creator_tag_list: null,
    //     },
    //     music: {
    //       id: 7525321405987065000,
    //       id_str: "7525321405987064626",
    //       title: "@藤椒很麻呀²³⁵⁸ 🌶️创作的原声",
    //       author: "藤椒很麻呀²³⁵⁸ 🌶️",
    //       album: "",
    //       cover_hd: {
    //         uri: "1080x1080/aweme-avatar/douyin-user-image-file_4560639592011267deb384bdc7ebdc90",
    //         url_list: [
    //           "https://p3-pc.douyinpic.com/aweme/1080x1080/aweme-avatar/douyin-user-image-file_4560639592011267deb384bdc7ebdc90.jpeg?from=327834062",
    //         ],
    //         width: 720,
    //         height: 720,
    //       },
    //       cover_large: {
    //         uri: "1080x1080/aweme-avatar/douyin-user-image-file_4560639592011267deb384bdc7ebdc90",
    //         url_list: [
    //           "https://p3-pc.douyinpic.com/aweme/1080x1080/aweme-avatar/douyin-user-image-file_4560639592011267deb384bdc7ebdc90.jpeg?from=327834062",
    //         ],
    //         width: 720,
    //         height: 720,
    //       },
    //       cover_medium: {
    //         uri: "720x720/aweme-avatar/douyin-user-image-file_4560639592011267deb384bdc7ebdc90",
    //         url_list: [
    //           "https://p3-pc.douyinpic.com/aweme/720x720/aweme-avatar/douyin-user-image-file_4560639592011267deb384bdc7ebdc90.jpeg?from=327834062",
    //         ],
    //         width: 720,
    //         height: 720,
    //       },
    //       cover_thumb: {
    //         uri: "100x100/aweme-avatar/douyin-user-image-file_4560639592011267deb384bdc7ebdc90",
    //         url_list: [
    //           "https://p3-pc.douyinpic.com/aweme/100x100/aweme-avatar/douyin-user-image-file_4560639592011267deb384bdc7ebdc90.jpeg?from=327834062",
    //         ],
    //         width: 720,
    //         height: 720,
    //       },
    //       play_url: {
    //         uri: "https://sf5-hl-ali-cdn-tos.douyinstatic.com/obj/ies-music/7525321371006634761.mp3",
    //         url_list: [
    //           "https://sf5-hl-ali-cdn-tos.douyinstatic.com/obj/ies-music/7525321371006634761.mp3",
    //           "https://sf5-hl-cdn-tos.douyinstatic.com/obj/ies-music/7525321371006634761.mp3",
    //         ],
    //         width: 720,
    //         height: 720,
    //         url_key: "7525321405987064626",
    //       },
    //       schema_url: "",
    //       source_platform: 23,
    //       start_time: 0,
    //       end_time: 0,
    //       duration: 22,
    //       extra:
    //         '{"aed_music_score":0.11,"aed_singing_score":0.71,"aggregate_exempt_conf":[],"beats":{},"cover_colors":null,"douyin_beats_info":{},"dsp_switch":274877906944,"extract_item_id":7525321412706454843,"has_edited":0,"hit_high_follow_auto":false,"hit_high_follow_extend":false,"hit_high_follow_original":false,"hotsoon_review_time":-1,"is_aed_music":1,"is_high_follow_user":false,"is_red":0,"is_subsidy_exp":false,"music_label_id":null,"music_tagging":{"AEDs":null,"Genres":null,"Instruments":null,"Languages":null,"Moods":null,"SingingVersions":null,"Themes":null},"review_unshelve_reason":0,"reviewed":0,"schedule_search_time":0,"uniqa_speech_score":0.08,"with_aed_model":1}',
    //       user_count: 0,
    //       position: null,
    //       collect_stat: 0,
    //       status: 1,
    //       offline_desc: "",
    //       owner_id: "888870295051540",
    //       owner_nickname: "藤椒很麻呀²³⁵⁸ 🌶️",
    //       is_original: false,
    //       mid: "7525321405987064626",
    //       binded_challenge_id: 0,
    //       redirect: false,
    //       is_restricted: false,
    //       author_deleted: false,
    //       is_del_video: false,
    //       is_video_self_see: false,
    //       owner_handle: "75559455j",
    //       author_position: null,
    //       prevent_download: false,
    //       strong_beat_url: {
    //         uri: "https://sf5-hl-cdn-tos.douyinstatic.com/obj/ies-music/pattern/7a86e8e5f3f1b2d47fc7fdf5e37cc3c0.json",
    //         url_list: [
    //           "https://sf5-hl-cdn-tos.douyinstatic.com/obj/ies-music/pattern/7a86e8e5f3f1b2d47fc7fdf5e37cc3c0.json",
    //           "https://sf3-cdn-tos.douyinstatic.com/obj/ies-music/pattern/7a86e8e5f3f1b2d47fc7fdf5e37cc3c0.json",
    //         ],
    //         width: 720,
    //         height: 720,
    //       },
    //       unshelve_countries: null,
    //       prevent_item_download_status: 0,
    //       external_song_info: [],
    //       sec_uid: "MS4wLjABAAAA250wWQH1y6yH9TFbYBQIoal2suwu_01R6sE-OPeWaXk",
    //       avatar_thumb: {
    //         uri: "100x100/aweme-avatar/douyin-user-image-file_4560639592011267deb384bdc7ebdc90",
    //         url_list: [
    //           "https://p3-pc.douyinpic.com/aweme/100x100/aweme-avatar/douyin-user-image-file_4560639592011267deb384bdc7ebdc90.jpeg?from=327834062",
    //         ],
    //         width: 720,
    //         height: 720,
    //       },
    //       avatar_medium: {
    //         uri: "720x720/aweme-avatar/douyin-user-image-file_4560639592011267deb384bdc7ebdc90",
    //         url_list: [
    //           "https://p3-pc.douyinpic.com/aweme/720x720/aweme-avatar/douyin-user-image-file_4560639592011267deb384bdc7ebdc90.jpeg?from=327834062",
    //         ],
    //         width: 720,
    //         height: 720,
    //       },
    //       avatar_large: {
    //         uri: "1080x1080/aweme-avatar/douyin-user-image-file_4560639592011267deb384bdc7ebdc90",
    //         url_list: [
    //           "https://p3-pc.douyinpic.com/aweme/1080x1080/aweme-avatar/douyin-user-image-file_4560639592011267deb384bdc7ebdc90.jpeg?from=327834062",
    //         ],
    //         width: 720,
    //         height: 720,
    //       },
    //       preview_start_time: 0,
    //       preview_end_time: 0,
    //       is_commerce_music: false,
    //       is_original_sound: true,
    //       audition_duration: 22,
    //       shoot_duration: 22,
    //       reason_type: 0,
    //       artists: [],
    //       lyric_short_position: null,
    //       mute_share: false,
    //       tag_list: null,
    //       dmv_auto_show: false,
    //       is_pgc: false,
    //       is_matched_metadata: false,
    //       is_audio_url_with_cookie: false,
    //       music_chart_ranks: null,
    //       can_background_play: true,
    //       music_status: 1,
    //       video_duration: 22,
    //       pgc_music_type: 2,
    //       author_status: 1,
    //       search_impr: {
    //         entity_id: "7525321405987064626",
    //       },
    //       artist_user_infos: null,
    //       dsp_status: 10,
    //       musician_user_infos: null,
    //       music_collect_count: 0,
    //       music_cover_atmosphere_color_value: "",
    //       show_origin_clip: false,
    //     },
    //     select_anchor_expanded_content: 0,
    //     video: {
    //       play_addr: {
    //         uri: "v1e00fgi0000d1nkvg7og65t8cui54n0",
    //         url_list: [
    //           "https://v95-web-sz.douyinvod.com/829b7c9cd78945aece51b60011298ce9/68919a1b/video/tos/cn/tos-cn-ve-15c000-ce/oUhiXTuwczAIGB9QiQ4dka065PEM0CPPGA9zi/?a=6383&ch=10010&cr=3&dr=0&lr=all&cd=0%7C0%7C0%7C3&cv=1&br=2341&bt=2341&cs=0&ds=4&ft=GZnU0RqeffPdXP~ka1jNvAq-antLjrKYyVmCRkaml6C9UjVhWL6&mime_type=video_mp4&qs=0&rc=OjM3PDg0NTlkOTw7ZjY7OUBpMzdsZnc5cmpuNDMzbGkzNEBjNGEyYTA2XjQxNV9fMGNjYSNrMnI1MmQ0c2thLS1kLWJzcw%3D%3D&btag=c0000e00010000&cquery=100x_100z_100o_101r_100B&dy_q=1754361813&feature_id=0ea98fd3bdc3c6c14a3d0804cc272721&l=20250805104332288948511D5931AF76A4",
    //           "https://v3-web.douyinvod.com/e2404d652c858ad01cd3651e9f6c6751/68919a1b/video/tos/cn/tos-cn-ve-15c000-ce/oUhiXTuwczAIGB9QiQ4dka065PEM0CPPGA9zi/?a=6383&ch=10010&cr=3&dr=0&lr=all&cd=0%7C0%7C0%7C3&cv=1&br=2341&bt=2341&cs=0&ds=4&ft=GZnU0RqeffPdXP~ka1jNvAq-antLjrKYyVmCRkaml6C9UjVhWL6&mime_type=video_mp4&qs=0&rc=OjM3PDg0NTlkOTw7ZjY7OUBpMzdsZnc5cmpuNDMzbGkzNEBjNGEyYTA2XjQxNV9fMGNjYSNrMnI1MmQ0c2thLS1kLWJzcw%3D%3D&btag=c0000e00010000&cquery=101r_100B_100x_100z_100o&dy_q=1754361813&feature_id=0ea98fd3bdc3c6c14a3d0804cc272721&l=20250805104332288948511D5931AF76A4",
    //           "https://www.douyin.com/aweme/v1/play/?video_id=v1e00fgi0000d1nkvg7og65t8cui54n0&line=0&file_id=f6f833bcb889467aa69231d559d470f7&sign=711aad96b4dac0182c52dd28c1eb1bda&is_play_url=1&source=PackSourceEnum_PUBLISH",
    //         ],
    //         width: 1920,
    //         height: 1080,
    //         url_key: "v1e00fgi0000d1nkvg7og65t8cui54n0_h264_1080p_2398045",
    //         data_size: 6764587,
    //         file_hash: "711aad96b4dac0182c52dd28c1eb1bda",
    //         file_cs: "c:0-20034-90fc|d:0-3382292-7f35,3382293-6764586-f864",
    //       },
    //       cover: {
    //         uri: "tos-cn-p-0015c000-ce/oQ4Kv4Y2SQDSDnPTIhTAieG1LBeOAFfCmg0eis",
    //         url_list: [
    //           "https://p9-pc-sign.douyinpic.com/tos-cn-p-0015c000-ce/oQ4Kv4Y2SQDSDnPTIhTAieG1LBeOAFfCmg0eis~tplv-dy-cropcenter:323:430.jpeg?lk3s=138a59ce&x-expires=2069719200&x-signature=mN9UQGLQFFzTuygua3cl5Diq9YI%3D&from=327834062&s=PackSourceEnum_PUBLISH&se=true&sh=323_430&sc=cover&biz_tag=pcweb_cover&l=20250805104332288948511D5931AF76A4",
    //           "https://p3-pc-sign.douyinpic.com/obj/tos-cn-p-0015c000-ce/oQ4Kv4Y2SQDSDnPTIhTAieG1LBeOAFfCmg0eis?lk3s=138a59ce&x-expires=2069719200&x-signature=5J5v5xgWOwAPm8jarwuGgbZ4mew%3D&from=327834062&s=PackSourceEnum_PUBLISH&se=false&sc=cover&biz_tag=pcweb_cover&l=20250805104332288948511D5931AF76A4",
    //           "https://p9-pc-sign.douyinpic.com/obj/tos-cn-p-0015c000-ce/oQ4Kv4Y2SQDSDnPTIhTAieG1LBeOAFfCmg0eis?lk3s=138a59ce&x-expires=2069719200&x-signature=dcj5Ix9iX%2FQhWNVCWl6ukWKWzjs%3D&from=327834062&s=PackSourceEnum_PUBLISH&se=false&sc=cover&biz_tag=pcweb_cover&l=20250805104332288948511D5931AF76A4",
    //         ],
    //         width: 720,
    //         height: 720,
    //       },
    //       height: 2160,
    //       width: 3840,
    //       dynamic_cover: {
    //         uri: "tos-cn-p-0015c000-ce/o0GeW4GBgFKvSgICfe2nDo1T9en4TASPGDAuLh",
    //         url_list: [
    //           "https://p3-pc-sign.douyinpic.com/obj/tos-cn-p-0015c000-ce/o0GeW4GBgFKvSgICfe2nDo1T9en4TASPGDAuLh?lk3s=138a59ce&x-expires=1755568800&x-signature=zqo4JsQXpOSshLwNyufjW3dPLpg%3D&from=327834062_large&s=PackSourceEnum_PUBLISH&se=false&sc=dynamic_cover&biz_tag=pcweb_cover&l=20250805104332288948511D5931AF76A4",
    //           "https://p9-pc-sign.douyinpic.com/obj/tos-cn-p-0015c000-ce/o0GeW4GBgFKvSgICfe2nDo1T9en4TASPGDAuLh?lk3s=138a59ce&x-expires=1755568800&x-signature=ODHgcEdp6ui1D%2BpMHm4oJVe3cAc%3D&from=327834062_large&s=PackSourceEnum_PUBLISH&se=false&sc=dynamic_cover&biz_tag=pcweb_cover&l=20250805104332288948511D5931AF76A4",
    //         ],
    //         width: 720,
    //         height: 720,
    //       },
    //       origin_cover: {
    //         uri: "tos-cn-p-0015c000-ce/ocNe4SAgIBGAv4lLTtFP2hne1ADT2DF6gZfSeK",
    //         url_list: [
    //           "https://p3-pc-sign.douyinpic.com/tos-cn-p-0015c000-ce/ocNe4SAgIBGAv4lLTtFP2hne1ADT2DF6gZfSeK~tplv-dy-360p.jpeg?lk3s=138a59ce&x-expires=1755568800&x-signature=vfEZfl4QpxzgKTDHo5G21Wga6A4%3D&from=327834062&s=PackSourceEnum_PUBLISH&se=false&sc=origin_cover&biz_tag=pcweb_cover&l=20250805104332288948511D5931AF76A4",
    //           "https://p9-pc-sign.douyinpic.com/tos-cn-p-0015c000-ce/ocNe4SAgIBGAv4lLTtFP2hne1ADT2DF6gZfSeK~tplv-dy-360p.jpeg?lk3s=138a59ce&x-expires=1755568800&x-signature=yig9R9qERNgD1BNENlXLHYDtk0c%3D&from=327834062&s=PackSourceEnum_PUBLISH&se=false&sc=origin_cover&biz_tag=pcweb_cover&l=20250805104332288948511D5931AF76A4",
    //         ],
    //         width: 640,
    //         height: 360,
    //       },
    //       ratio: "1080p",
    //       format: "mp4",
    //       meta: '{"bright_ratio_mean":"0.0697","brightness_mean":"119.2801","diff_overexposure_ratio":"0.0138","enable_manual_ladder":"1","format":"mp4","gear_vqm":"{\\"1080p_720p\\":2,\\"720p_540p\\":-1}","hrids":"500000008","is_spatial_video":"0","isad":"0","loudness":"-15.1","overexposure_ratio_mean":"0.0554","peak":"0.67608","qprf":"1.000","sdgs":"[\\"adapt_lowest_4_1\\",\\"normal_720_0\\",\\"pc_bvc0_exp1_r2_normal_1080_0\\",\\"adapt_lowest_1440_1\\",\\"normal_540_0\\",\\"pc_bvc0_exp1_r2_low_720_0\\",\\"pc_bvc0_exp1_r2_low_540_0\\",\\"lower_540_0\\",\\"1080_1_1\\",\\"pc_bvc0_exp1_r2_adapt_low_540_0\\",\\"720_1_1\\",\\"720_2_1\\",\\"720_3_1\\",\\"720_4_1\\"]","sr_potential":"{\\"v1.0\\":{\\"score\\":44.281}}","sr_score":"1.000","std_brightness":"4.4514","strategy_tokens":"[\\"ladder_group_remove_1080_1_night_peak\\",\\"s_free01_0604\\",\\"sexp_reward01_0603\\",\\"s_free02_0604\\",\\"sexp_reward02_0603\\",\\"sexp_reward02_0721\\",\\"sexp_reward01_0721\\"]","title_info":"{\\"bottom_res_add\\":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],\\"bullet_zone\\":0,\\"progress_bar\\":[0,0,0],\\"ratio_br_l\\":[0,0,0,0,0,0],\\"ratio_edge_l\\":[0,0,0,0,0,0],\\"std_br_l\\":[0,0,0,0,0,0],\\"top_res_add\\":[0,0,0,0,0,0,0],\\"version\\":\\"v1.0\\"}","volume_info":"{\\"Peak\\":0.67608,\\"Loudness\\":-15.1,\\"LoudnessRange\\":6.2,\\"LoudnessRangeEnd\\":-11.9,\\"MaximumShortTermLoudness\\":-11.6,\\"LoudnessRangeStart\\":-18.1,\\"MaximumMomentaryLoudness\\":-10.5,\\"Version\\":2}","vqs_origin":"72.62"}',
    //       is_source_HDR: 0,
    //       bit_rate: [
    //         {
    //           gear_name: "adapt_lowest_4_1",
    //           quality_type: 72,
    //           bit_rate: 3674008,
    //           play_addr: {
    //             uri: "v1e00fgi0000d1nkvg7og65t8cui54n0",
    //             url_list: [
    //               "https://v95-web-sz.douyinvod.com/2ba1f3d6c9962b5cc22832b4c53da637/68919a1b/video/tos/cn/tos-cn-ve-15c000-ce/oIvDUmvvlAYSDUBA8xeA4egMheiy2ckT4OfToF/?a=6383&ch=10010&cr=3&dr=0&lr=all&cd=0%7C0%7C0%7C3&cv=1&br=3587&bt=3587&cs=2&ds=10&ft=GZnU0RqeffPdXP~ka1jNvAq-antLjrKYyVmCRkaml6C9UjVhWL6&mime_type=video_mp4&qs=15&rc=aTg2Mzs5OTVpaThoNzg2NUBpMzdsZnc5cmpuNDMzbGkzNEAwMTExM2JhNmExYl9fLzExYSNrMnI1MmQ0c2thLS1kLWJzcw%3D%3D&btag=c0000e00010000&cquery=100z_100o_101r_100B_100x&dy_q=1754361813&feature_id=10cf95ef75b4f3e7eac623e4ea0ea691&l=20250805104332288948511D5931AF76A4",
    //               "https://v3-web.douyinvod.com/9c7ca8972be0f16843aabd4519299e17/68919a1b/video/tos/cn/tos-cn-ve-15c000-ce/oIvDUmvvlAYSDUBA8xeA4egMheiy2ckT4OfToF/?a=6383&ch=10010&cr=3&dr=0&lr=all&cd=0%7C0%7C0%7C3&cv=1&br=3587&bt=3587&cs=2&ds=10&ft=GZnU0RqeffPdXP~ka1jNvAq-antLjrKYyVmCRkaml6C9UjVhWL6&mime_type=video_mp4&qs=15&rc=aTg2Mzs5OTVpaThoNzg2NUBpMzdsZnc5cmpuNDMzbGkzNEAwMTExM2JhNmExYl9fLzExYSNrMnI1MmQ0c2thLS1kLWJzcw%3D%3D&btag=c0000e00010000&cquery=100x_100z_100o_101r_100B&dy_q=1754361813&feature_id=10cf95ef75b4f3e7eac623e4ea0ea691&l=20250805104332288948511D5931AF76A4",
    //               "https://www.douyin.com/aweme/v1/play/?video_id=v1e00fgi0000d1nkvg7og65t8cui54n0&line=0&file_id=424325b4bee54fdf92d6e6684043453f&sign=0c660ab0ab73cee8fd8aee4fea04f6fe&is_play_url=1&source=PackSourceEnum_PUBLISH",
    //             ],
    //             width: 3840,
    //             height: 2160,
    //             url_key: "v1e00fgi0000d1nkvg7og65t8cui54n0_bytevc1_4k_3674008",
    //             data_size: 10348763,
    //             file_hash: "0c660ab0ab73cee8fd8aee4fea04f6fe",
    //             file_cs:
    //               "c:0-26221-f05e|d:0-5174380-e0d1,5174381-10348762-2d9f",
    //           },
    //           is_h265: 1,
    //           is_bytevc1: 1,
    //           HDR_type: "",
    //           HDR_bit: "",
    //           FPS: 60,
    //           video_extra:
    //             '{"PktOffsetMap":"[{\\"time\\": 1, \\"offset\\": 620152}, {\\"time\\": 2, \\"offset\\": 1034950}, {\\"time\\": 3, \\"offset\\": 1489035}, {\\"time\\": 4, \\"offset\\": 2011574}, {\\"time\\": 5, \\"offset\\": 2654313}, {\\"time\\": 10, \\"offset\\": 5084889}]","format":"mp4","definition":"4k","quality":"adapt_lowest","file_id":"424325b4bee54fdf92d6e6684043453f","applog_map":{"feature_id":"10cf95ef75b4f3e7eac623e4ea0ea691"},"mvmaf":"{\\"mvmaf_sr_v1080\\":-1,\\"mvmaf_sr_v960\\":-1,\\"mvmaf_sr_v864\\":-1,\\"mvmaf_sr_v720\\":-1,\\"mvmaf_ori_v1080\\":95.907,\\"mvmaf_ori_v960\\":96.508,\\"mvmaf_ori_v864\\":97.004,\\"mvmaf_ori_v720\\":97.546}","audio_channels":"2.0","audio_sample_rate":"44100"}',
    //           format: "mp4",
    //         },
    //         {
    //           gear_name: "normal_720_0",
    //           quality_type: 10,
    //           bit_rate: 3159581,
    //           play_addr: {
    //             uri: "v1e00fgi0000d1nkvg7og65t8cui54n0",
    //             url_list: [
    //               "https://v95-web-sz.douyinvod.com/4991d7f51be1cc346787952289fac3d0/68919a1b/video/tos/cn/tos-cn-ve-15c000-ce/oINeg44DBGAmzPhfeTL1T2hAbDKASFgvRSeVjI/?a=6383&ch=10010&cr=3&dr=0&lr=all&cd=0%7C0%7C0%7C3&cv=1&br=3085&bt=3085&cs=0&ds=3&ft=GZnU0RqeffPdXP~ka1jNvAq-antLjrKYyVmCRkaml6C9UjVhWL6&mime_type=video_mp4&qs=0&rc=aTo2OzwzMzlpOTloNGU5NkBpMzdsZnc5cmpuNDMzbGkzNEAuMV81NF41NS4xLWA1LV8yYSNrMnI1MmQ0c2thLS1kLWJzcw%3D%3D&btag=c0000e00010000&cquery=101r_100B_100x_100z_100o&dy_q=1754361813&feature_id=b1cb202f98cf51d95e455ae01e100ce9&l=20250805104332288948511D5931AF76A4",
    //               "https://v3-web.douyinvod.com/0cebe5dc44aa9f2a82de5811506098ee/68919a1b/video/tos/cn/tos-cn-ve-15c000-ce/oINeg44DBGAmzPhfeTL1T2hAbDKASFgvRSeVjI/?a=6383&ch=10010&cr=3&dr=0&lr=all&cd=0%7C0%7C0%7C3&cv=1&br=3085&bt=3085&cs=0&ds=3&ft=GZnU0RqeffPdXP~ka1jNvAq-antLjrKYyVmCRkaml6C9UjVhWL6&mime_type=video_mp4&qs=0&rc=aTo2OzwzMzlpOTloNGU5NkBpMzdsZnc5cmpuNDMzbGkzNEAuMV81NF41NS4xLWA1LV8yYSNrMnI1MmQ0c2thLS1kLWJzcw%3D%3D&btag=c0000e00010000&cquery=100o_101r_100B_100x_100z&dy_q=1754361813&feature_id=b1cb202f98cf51d95e455ae01e100ce9&l=20250805104332288948511D5931AF76A4",
    //               "https://www.douyin.com/aweme/v1/play/?video_id=v1e00fgi0000d1nkvg7og65t8cui54n0&line=0&file_id=53b60b81ce06461f8680a07988b3471f&sign=b48a50d9851bd318784774f447c6049c&is_play_url=1&source=PackSourceEnum_PUBLISH",
    //             ],
    //             width: 1280,
    //             height: 720,
    //             url_key: "v1e00fgi0000d1nkvg7og65t8cui54n0_h264_720p_3159581",
    //             data_size: 8899750,
    //             file_hash: "b48a50d9851bd318784774f447c6049c",
    //             file_cs: "c:0-38498-165e|d:0-4449874-8ba7,4449875-8899749-85fc",
    //           },
    //           is_h265: 0,
    //           is_bytevc1: 0,
    //           HDR_type: "",
    //           HDR_bit: "",
    //           FPS: 60,
    //           video_extra:
    //             '{"PktOffsetMap":"","format":"mp4","definition":"720p","quality":"normal","file_id":"53b60b81ce06461f8680a07988b3471f","applog_map":{"feature_id":"b1cb202f98cf51d95e455ae01e100ce9"},"audio_channels":"2.0","audio_sample_rate":"44100"}',
    //           format: "mp4",
    //         },
    //         {
    //           gear_name: "pc_bvc0_exp1_r2_normal_1080_0",
    //           quality_type: 1,
    //           bit_rate: 2398045,
    //           play_addr: {
    //             uri: "v1e00fgi0000d1nkvg7og65t8cui54n0",
    //             url_list: [
    //               "https://v95-web-sz.douyinvod.com/829b7c9cd78945aece51b60011298ce9/68919a1b/video/tos/cn/tos-cn-ve-15c000-ce/oUhiXTuwczAIGB9QiQ4dka065PEM0CPPGA9zi/?a=6383&ch=10010&cr=3&dr=0&lr=all&cd=0%7C0%7C0%7C3&cv=1&br=2341&bt=2341&cs=0&ds=4&ft=GZnU0RqeffPdXP~ka1jNvAq-antLjrKYyVmCRkaml6C9UjVhWL6&mime_type=video_mp4&qs=0&rc=OjM3PDg0NTlkOTw7ZjY7OUBpMzdsZnc5cmpuNDMzbGkzNEBjNGEyYTA2XjQxNV9fMGNjYSNrMnI1MmQ0c2thLS1kLWJzcw%3D%3D&btag=c0000e00010000&cquery=100x_100z_100o_101r_100B&dy_q=1754361813&feature_id=0ea98fd3bdc3c6c14a3d0804cc272721&l=20250805104332288948511D5931AF76A4",
    //               "https://v3-web.douyinvod.com/e2404d652c858ad01cd3651e9f6c6751/68919a1b/video/tos/cn/tos-cn-ve-15c000-ce/oUhiXTuwczAIGB9QiQ4dka065PEM0CPPGA9zi/?a=6383&ch=10010&cr=3&dr=0&lr=all&cd=0%7C0%7C0%7C3&cv=1&br=2341&bt=2341&cs=0&ds=4&ft=GZnU0RqeffPdXP~ka1jNvAq-antLjrKYyVmCRkaml6C9UjVhWL6&mime_type=video_mp4&qs=0&rc=OjM3PDg0NTlkOTw7ZjY7OUBpMzdsZnc5cmpuNDMzbGkzNEBjNGEyYTA2XjQxNV9fMGNjYSNrMnI1MmQ0c2thLS1kLWJzcw%3D%3D&btag=c0000e00010000&cquery=101r_100B_100x_100z_100o&dy_q=1754361813&feature_id=0ea98fd3bdc3c6c14a3d0804cc272721&l=20250805104332288948511D5931AF76A4",
    //               "https://www.douyin.com/aweme/v1/play/?video_id=v1e00fgi0000d1nkvg7og65t8cui54n0&line=0&file_id=f6f833bcb889467aa69231d559d470f7&sign=711aad96b4dac0182c52dd28c1eb1bda&is_play_url=1&source=PackSourceEnum_PUBLISH",
    //             ],
    //             width: 1920,
    //             height: 1080,
    //             url_key: "v1e00fgi0000d1nkvg7og65t8cui54n0_h264_1080p_2398045",
    //             data_size: 6764587,
    //             file_hash: "711aad96b4dac0182c52dd28c1eb1bda",
    //             file_cs: "c:0-20034-90fc|d:0-3382292-7f35,3382293-6764586-f864",
    //           },
    //           is_h265: 0,
    //           is_bytevc1: 0,
    //           HDR_type: "",
    //           HDR_bit: "",
    //           FPS: 30,
    //           video_extra:
    //             '{"PktOffsetMap":"[{\\"time\\": 1, \\"offset\\": 428239}, {\\"time\\": 2, \\"offset\\": 742679}, {\\"time\\": 3, \\"offset\\": 1065964}, {\\"time\\": 4, \\"offset\\": 1397782}, {\\"time\\": 5, \\"offset\\": 1746059}, {\\"time\\": 10, \\"offset\\": 3279207}]","format":"mp4","definition":"1080p","quality":"normal","file_id":"f6f833bcb889467aa69231d559d470f7","applog_map":{"feature_id":"0ea98fd3bdc3c6c14a3d0804cc272721"},"audio_channels":"2.0","audio_sample_rate":"44100"}',
    //           format: "mp4",
    //         },
    //         {
    //           gear_name: "adapt_lowest_1440_1",
    //           quality_type: 7,
    //           bit_rate: 2276476,
    //           play_addr: {
    //             uri: "v1e00fgi0000d1nkvg7og65t8cui54n0",
    //             url_list: [
    //               "https://v95-web-sz.douyinvod.com/b84e913918bca790c124e263a2302373/68919a1b/video/tos/cn/tos-cn-ve-15c000-ce/oIBXkVhPhWP9CwHIcQii0GvauiE9PQGAuAMzU/?a=6383&ch=10010&cr=3&dr=0&lr=all&cd=0%7C0%7C0%7C3&cv=1&br=2223&bt=2223&cs=2&ft=GZnU0RqeffPdXP~ka1jNvAq-antLjrKYyVmCRkaml6C9UjVhWL6&mime_type=video_mp4&qs=15&rc=aTY8NmdpPGY5NzU0Zmc3OUBpMzdsZnc5cmpuNDMzbGkzNEA1NmMzMDUxNWIxLmEyLjNjYSNrMnI1MmQ0c2thLS1kLWJzcw%3D%3D&btag=c0000e00010000&cquery=101r_100B_100x_100z_100o&dy_q=1754361813&feature_id=10cf95ef75b4f3e7eac623e4ea0ea691&l=20250805104332288948511D5931AF76A4",
    //               "https://v3-web.douyinvod.com/65303ba2a24ccaaa72aa0172a431b8f0/68919a1b/video/tos/cn/tos-cn-ve-15c000-ce/oIBXkVhPhWP9CwHIcQii0GvauiE9PQGAuAMzU/?a=6383&ch=10010&cr=3&dr=0&lr=all&cd=0%7C0%7C0%7C3&cv=1&br=2223&bt=2223&cs=2&ft=GZnU0RqeffPdXP~ka1jNvAq-antLjrKYyVmCRkaml6C9UjVhWL6&mime_type=video_mp4&qs=15&rc=aTY8NmdpPGY5NzU0Zmc3OUBpMzdsZnc5cmpuNDMzbGkzNEA1NmMzMDUxNWIxLmEyLjNjYSNrMnI1MmQ0c2thLS1kLWJzcw%3D%3D&btag=c0000e00010000&cquery=101r_100B_100x_100z_100o&dy_q=1754361813&feature_id=10cf95ef75b4f3e7eac623e4ea0ea691&l=20250805104332288948511D5931AF76A4",
    //               "https://www.douyin.com/aweme/v1/play/?video_id=v1e00fgi0000d1nkvg7og65t8cui54n0&line=0&file_id=f6641d5cd11244e68c498f3d63f9938f&sign=415f1c4cbf8b9c10d84bffb4611df541&is_play_url=1&source=PackSourceEnum_PUBLISH",
    //             ],
    //             width: 2560,
    //             height: 1440,
    //             url_key:
    //               "v1e00fgi0000d1nkvg7og65t8cui54n0_bytevc1_1440p_2276476",
    //             data_size: 6412266,
    //             file_hash: "415f1c4cbf8b9c10d84bffb4611df541",
    //             file_cs: "c:0-26219-4f53|d:0-3206132-59ad,3206133-6412265-f3a1",
    //           },
    //           is_h265: 1,
    //           is_bytevc1: 1,
    //           HDR_type: "",
    //           HDR_bit: "",
    //           FPS: 60,
    //           video_extra:
    //             '{"PktOffsetMap":"[{\\"time\\": 1, \\"offset\\": 401346}, {\\"time\\": 2, \\"offset\\": 656158}, {\\"time\\": 3, \\"offset\\": 936815}, {\\"time\\": 4, \\"offset\\": 1249344}, {\\"time\\": 5, \\"offset\\": 1649504}, {\\"time\\": 10, \\"offset\\": 3155262}]","format":"mp4","definition":"1440p","quality":"adapt_lowest","file_id":"f6641d5cd11244e68c498f3d63f9938f","applog_map":{"feature_id":"10cf95ef75b4f3e7eac623e4ea0ea691"},"mvmaf":"{\\"mvmaf_sr_v1080\\":-1,\\"mvmaf_sr_v960\\":-1,\\"mvmaf_sr_v864\\":-1,\\"mvmaf_sr_v720\\":-1,\\"mvmaf_ori_v1080\\":93.604,\\"mvmaf_ori_v960\\":94.371,\\"mvmaf_ori_v864\\":95.198,\\"mvmaf_ori_v720\\":95.897}","audio_channels":"2.0","audio_sample_rate":"44100"}',
    //           format: "mp4",
    //         },
    //         {
    //           gear_name: "normal_540_0",
    //           quality_type: 20,
    //           bit_rate: 2182923,
    //           play_addr: {
    //             uri: "v1e00fgi0000d1nkvg7og65t8cui54n0",
    //             url_list: [
    //               "https://v95-web-sz.douyinvod.com/b21687d22238f3ab1d511dd977f4291a/68919a1b/video/tos/cn/tos-cn-ve-15c000-ce/oUiPRQkIX3aiFhB9wuRDiz90dM8AxPbiQAEGP/?a=6383&ch=10010&cr=3&dr=0&lr=all&cd=0%7C0%7C0%7C3&cv=1&br=2131&bt=2131&cs=0&ds=6&ft=GZnU0RqeffPdXP~ka1jNvAq-antLjrKYyVmCRkaml6C9UjVhWL6&mime_type=video_mp4&qs=0&rc=NDs1aTQ1ZDY7NzdnaWU6NEBpMzdsZnc5cmpuNDMzbGkzNEAwMV4yMl80NmIxMDUuM14yYSNrMnI1MmQ0c2thLS1kLWJzcw%3D%3D&btag=c0000e00010000&cquery=100B_100x_100z_100o_101r&dy_q=1754361813&feature_id=b1cb202f98cf51d95e455ae01e100ce9&l=20250805104332288948511D5931AF76A4",
    //               "https://v3-web.douyinvod.com/bec3ff0e6555099566e423dab7a97cf1/68919a1b/video/tos/cn/tos-cn-ve-15c000-ce/oUiPRQkIX3aiFhB9wuRDiz90dM8AxPbiQAEGP/?a=6383&ch=10010&cr=3&dr=0&lr=all&cd=0%7C0%7C0%7C3&cv=1&br=2131&bt=2131&cs=0&ds=6&ft=GZnU0RqeffPdXP~ka1jNvAq-antLjrKYyVmCRkaml6C9UjVhWL6&mime_type=video_mp4&qs=0&rc=NDs1aTQ1ZDY7NzdnaWU6NEBpMzdsZnc5cmpuNDMzbGkzNEAwMV4yMl80NmIxMDUuM14yYSNrMnI1MmQ0c2thLS1kLWJzcw%3D%3D&btag=c0000e00010000&cquery=100o_101r_100B_100x_100z&dy_q=1754361813&feature_id=b1cb202f98cf51d95e455ae01e100ce9&l=20250805104332288948511D5931AF76A4",
    //               "https://www.douyin.com/aweme/v1/play/?video_id=v1e00fgi0000d1nkvg7og65t8cui54n0&line=0&file_id=51a76b1f8d3444e8937ab2515fa24831&sign=1f6502e3f6ee86691869045d1fdca0e5&is_play_url=1&source=PackSourceEnum_PUBLISH",
    //             ],
    //             width: 960,
    //             height: 540,
    //             url_key: "v1e00fgi0000d1nkvg7og65t8cui54n0_h264_540p_2182923",
    //             data_size: 6148749,
    //             file_hash: "1f6502e3f6ee86691869045d1fdca0e5",
    //             file_cs: "c:0-38476-e233|d:0-3074373-aa61,3074374-6148748-9c80",
    //           },
    //           is_h265: 0,
    //           is_bytevc1: 0,
    //           HDR_type: "",
    //           HDR_bit: "",
    //           FPS: 60,
    //           video_extra:
    //             '{"PktOffsetMap":"","format":"mp4","definition":"540p","quality":"normal","file_id":"51a76b1f8d3444e8937ab2515fa24831","applog_map":{"feature_id":"b1cb202f98cf51d95e455ae01e100ce9"},"audio_channels":"2.0","audio_sample_rate":"44100"}',
    //           format: "mp4",
    //         },
    //         {
    //           gear_name: "pc_bvc0_exp1_r2_low_720_0",
    //           quality_type: 211,
    //           bit_rate: 1635865,
    //           play_addr: {
    //             uri: "v1e00fgi0000d1nkvg7og65t8cui54n0",
    //             url_list: [
    //               "https://v95-web-sz.douyinvod.com/a7c3741095bfbfe1c125bc4ba164de51/68919a1b/video/tos/cn/tos-cn-ve-15c000-ce/oEAXP0BQEEIuQi91Gkiz1MAEwPoMQhQp9iZPa/?a=6383&ch=10010&cr=3&dr=0&lr=all&cd=0%7C0%7C0%7C3&cv=1&br=1597&bt=1597&cs=0&ds=3&ft=GZnU0RqeffPdXP~ka1jNvAq-antLjrKYyVmCRkaml6C9UjVhWL6&mime_type=video_mp4&qs=1&rc=ODw3Ojw1M2U7Z2g8Zzk7ZkBpMzdsZnc5cmpuNDMzbGkzNEA2MGBhMzRfNjExLjVhMzE1YSNrMnI1MmQ0c2thLS1kLWJzcw%3D%3D&btag=c0000e00010000&cquery=100z_100o_101r_100B_100x&dy_q=1754361813&feature_id=0ea98fd3bdc3c6c14a3d0804cc272721&l=20250805104332288948511D5931AF76A4",
    //               "https://v3-web.douyinvod.com/eb1521a696e0ff05d668392159e0567b/68919a1b/video/tos/cn/tos-cn-ve-15c000-ce/oEAXP0BQEEIuQi91Gkiz1MAEwPoMQhQp9iZPa/?a=6383&ch=10010&cr=3&dr=0&lr=all&cd=0%7C0%7C0%7C3&cv=1&br=1597&bt=1597&cs=0&ds=3&ft=GZnU0RqeffPdXP~ka1jNvAq-antLjrKYyVmCRkaml6C9UjVhWL6&mime_type=video_mp4&qs=1&rc=ODw3Ojw1M2U7Z2g8Zzk7ZkBpMzdsZnc5cmpuNDMzbGkzNEA2MGBhMzRfNjExLjVhMzE1YSNrMnI1MmQ0c2thLS1kLWJzcw%3D%3D&btag=c0000e00010000&cquery=100B_100x_100z_100o_101r&dy_q=1754361813&feature_id=0ea98fd3bdc3c6c14a3d0804cc272721&l=20250805104332288948511D5931AF76A4",
    //               "https://www.douyin.com/aweme/v1/play/?video_id=v1e00fgi0000d1nkvg7og65t8cui54n0&line=0&file_id=8c4866dd891e4d489bb07269d7c43995&sign=d0f8887efc055515777804ab14ebb95b&is_play_url=1&source=PackSourceEnum_PUBLISH",
    //             ],
    //             width: 1280,
    //             height: 720,
    //             url_key: "v1e00fgi0000d1nkvg7og65t8cui54n0_h264_720p_1635865",
    //             data_size: 4614573,
    //             file_hash: "d0f8887efc055515777804ab14ebb95b",
    //             file_cs: "c:0-20032-b309|d:0-2307285-0dac,2307286-4614572-50cd",
    //           },
    //           is_h265: 0,
    //           is_bytevc1: 0,
    //           HDR_type: "",
    //           HDR_bit: "",
    //           FPS: 30,
    //           video_extra:
    //             '{"PktOffsetMap":"[{\\"time\\": 1, \\"offset\\": 295879}, {\\"time\\": 2, \\"offset\\": 509099}, {\\"time\\": 3, \\"offset\\": 728487}, {\\"time\\": 4, \\"offset\\": 951768}, {\\"time\\": 5, \\"offset\\": 1191300}, {\\"time\\": 10, \\"offset\\": 2230618}]","format":"mp4","definition":"720p","quality":"low","file_id":"8c4866dd891e4d489bb07269d7c43995","applog_map":{"feature_id":"0ea98fd3bdc3c6c14a3d0804cc272721"},"audio_channels":"2.0","audio_sample_rate":"44100"}',
    //           format: "mp4",
    //         },
    //         {
    //           gear_name: "pc_bvc0_exp1_r2_low_540_0",
    //           quality_type: 292,
    //           bit_rate: 1478658,
    //           play_addr: {
    //             uri: "v1e00fgi0000d1nkvg7og65t8cui54n0",
    //             url_list: [
    //               "https://v95-web-sz.douyinvod.com/886d273f4fce0a7b892e13f9216eec13/68919a1b/video/tos/cn/tos-cn-ve-15c000-ce/osXTeeGlLPSBvgWw62U4AFKDD1SgR4AeAhTPeI/?a=6383&ch=10010&cr=3&dr=0&lr=all&cd=0%7C0%7C0%7C3&cv=1&br=1444&bt=1444&cs=0&ds=6&ft=GZnU0RqeffPdXP~ka1jNvAq-antLjrKYyVmCRkaml6C9UjVhWL6&mime_type=video_mp4&qs=1&rc=ODM7NTQ8OzQ2Z2ZpOzg7ZUBpMzdsZnc5cmpuNDMzbGkzNEBjYGA2LWIwXl4xNS8wX2IwYSNrMnI1MmQ0c2thLS1kLWJzcw%3D%3D&btag=c0000e00010000&cquery=100o_101r_100B_100x_100z&dy_q=1754361813&feature_id=0ea98fd3bdc3c6c14a3d0804cc272721&l=20250805104332288948511D5931AF76A4",
    //               "https://v3-web.douyinvod.com/636e6172d1cccd3437ea597b3a34446a/68919a1b/video/tos/cn/tos-cn-ve-15c000-ce/osXTeeGlLPSBvgWw62U4AFKDD1SgR4AeAhTPeI/?a=6383&ch=10010&cr=3&dr=0&lr=all&cd=0%7C0%7C0%7C3&cv=1&br=1444&bt=1444&cs=0&ds=6&ft=GZnU0RqeffPdXP~ka1jNvAq-antLjrKYyVmCRkaml6C9UjVhWL6&mime_type=video_mp4&qs=1&rc=ODM7NTQ8OzQ2Z2ZpOzg7ZUBpMzdsZnc5cmpuNDMzbGkzNEBjYGA2LWIwXl4xNS8wX2IwYSNrMnI1MmQ0c2thLS1kLWJzcw%3D%3D&btag=c0000e00010000&cquery=100B_100x_100z_100o_101r&dy_q=1754361813&feature_id=0ea98fd3bdc3c6c14a3d0804cc272721&l=20250805104332288948511D5931AF76A4",
    //               "https://www.douyin.com/aweme/v1/play/?video_id=v1e00fgi0000d1nkvg7og65t8cui54n0&line=0&file_id=3be8b5382f8c4da3a138e90192c8c0f5&sign=64c8c13fc731722bf979d87accb84210&is_play_url=1&source=PackSourceEnum_PUBLISH",
    //             ],
    //             width: 1024,
    //             height: 576,
    //             url_key: "v1e00fgi0000d1nkvg7og65t8cui54n0_h264_540p_1478658",
    //             data_size: 4171110,
    //             file_hash: "64c8c13fc731722bf979d87accb84210",
    //             file_cs: "c:0-20036-1397|d:0-2085554-9a45,2085555-4171109-99bc",
    //           },
    //           is_h265: 0,
    //           is_bytevc1: 0,
    //           HDR_type: "",
    //           HDR_bit: "",
    //           FPS: 30,
    //           video_extra:
    //             '{"PktOffsetMap":"[{\\"time\\": 1, \\"offset\\": 265098}, {\\"time\\": 2, \\"offset\\": 457142}, {\\"time\\": 3, \\"offset\\": 656379}, {\\"time\\": 4, \\"offset\\": 857228}, {\\"time\\": 5, \\"offset\\": 1074043}, {\\"time\\": 10, \\"offset\\": 2010314}]","format":"mp4","definition":"540p","quality":"low","file_id":"3be8b5382f8c4da3a138e90192c8c0f5","applog_map":{"feature_id":"0ea98fd3bdc3c6c14a3d0804cc272721"},"audio_channels":"2.0","audio_sample_rate":"44100"}',
    //           format: "mp4",
    //         },
    //         {
    //           gear_name: "lower_540_0",
    //           quality_type: 224,
    //           bit_rate: 1254164,
    //           play_addr: {
    //             uri: "v1e00fgi0000d1nkvg7og65t8cui54n0",
    //             url_list: [
    //               "https://v95-web-sz.douyinvod.com/40a1b1470eba080a9a672635704fc4f0/68919a1b/video/tos/cn/tos-cn-ve-15c000-ce/oYAAevUD8vMCYooa24eFTSDUA4gITmfilhekAx/?a=6383&ch=10010&cr=3&dr=0&lr=all&cd=0%7C0%7C0%7C3&cv=1&br=1224&bt=1224&cs=0&ds=6&ft=GZnU0RqeffPdXP~ka1jNvAq-antLjrKYyVmCRkaml6C9UjVhWL6&mime_type=video_mp4&qs=4&rc=NjxpOjY3aDU3NGQ1Zjc6O0BpMzdsZnc5cmpuNDMzbGkzNEBiLjFiNDMtX2ExLTIvMjUvYSNrMnI1MmQ0c2thLS1kLWJzcw%3D%3D&btag=c0000e00010000&cquery=100B_100x_100z_100o_101r&dy_q=1754361813&feature_id=eb29b1b3aca69db49524c333df8caaf7&l=20250805104332288948511D5931AF76A4",
    //               "https://v3-web.douyinvod.com/f4e242e2792edd63068ccb69e090a798/68919a1b/video/tos/cn/tos-cn-ve-15c000-ce/oYAAevUD8vMCYooa24eFTSDUA4gITmfilhekAx/?a=6383&ch=10010&cr=3&dr=0&lr=all&cd=0%7C0%7C0%7C3&cv=1&br=1224&bt=1224&cs=0&ds=6&ft=GZnU0RqeffPdXP~ka1jNvAq-antLjrKYyVmCRkaml6C9UjVhWL6&mime_type=video_mp4&qs=4&rc=NjxpOjY3aDU3NGQ1Zjc6O0BpMzdsZnc5cmpuNDMzbGkzNEBiLjFiNDMtX2ExLTIvMjUvYSNrMnI1MmQ0c2thLS1kLWJzcw%3D%3D&btag=c0000e00010000&cquery=100o_101r_100B_100x_100z&dy_q=1754361813&feature_id=eb29b1b3aca69db49524c333df8caaf7&l=20250805104332288948511D5931AF76A4",
    //               "https://www.douyin.com/aweme/v1/play/?video_id=v1e00fgi0000d1nkvg7og65t8cui54n0&line=0&file_id=2887542c520a41d4b20e6473e74f19e3&sign=3d5db4b6ce314512dc832172481720c3&is_play_url=1&source=PackSourceEnum_PUBLISH",
    //             ],
    //             width: 1024,
    //             height: 576,
    //             url_key: "v1e00fgi0000d1nkvg7og65t8cui54n0_h264_540p_1254164",
    //             data_size: 3537842,
    //             file_hash: "3d5db4b6ce314512dc832172481720c3",
    //             file_cs:
    //               "c:0-20032-8746|d:0-1768920-db47,1768921-3537841-1d32|a:v1e00fgi0000d1nkvg7og65t8cui54n0",
    //           },
    //           is_h265: 0,
    //           is_bytevc1: 0,
    //           HDR_type: "",
    //           HDR_bit: "",
    //           FPS: 30,
    //           video_extra:
    //             '{"PktOffsetMap":"","format":"mp4","definition":"540p","quality":"lower","file_id":"2887542c520a41d4b20e6473e74f19e3","applog_map":{"feature_id":"eb29b1b3aca69db49524c333df8caaf7"},"audio_channels":"2.0","audio_sample_rate":"44100"}',
    //           format: "mp4",
    //         },
    //         {
    //           gear_name: "1080_1_1",
    //           quality_type: 3,
    //           bit_rate: 1122975,
    //           play_addr: {
    //             uri: "v1e00fgi0000d1nkvg7og65t8cui54n0",
    //             url_list: [
    //               "https://v95-web-sz.douyinvod.com/db9fd606ac36bc91a4246b135bcc10e1/68919a1b/video/tos/cn/tos-cn-ve-15c000-ce/oUFSWTcDGRWf491eAKLA4k2BSFeehMTgI6APDv/?a=6383&ch=10010&cr=3&dr=0&lr=all&cd=0%7C0%7C0%7C3&cv=1&br=1096&bt=1096&cs=2&ds=4&ft=GZnU0RqeffPdXP~ka1jNvAq-antLjrKYyVmCRkaml6C9UjVhWL6&mime_type=video_mp4&qs=0&rc=NjdoN2VpODlpMzo4ZzY4aEBpMzdsZnc5cmpuNDMzbGkzNEAuYS42Yi02Xl4xNWAwNS8yYSNrMnI1MmQ0c2thLS1kLWJzcw%3D%3D&btag=c0000e00010000&cquery=101r_100B_100x_100z_100o&dy_q=1754361813&feature_id=4fb091d884de9ce11fccc743bd685127&l=20250805104332288948511D5931AF76A4",
    //               "https://v3-web.douyinvod.com/89dedec2c5527f62188cc7cbe237dab0/68919a1b/video/tos/cn/tos-cn-ve-15c000-ce/oUFSWTcDGRWf491eAKLA4k2BSFeehMTgI6APDv/?a=6383&ch=10010&cr=3&dr=0&lr=all&cd=0%7C0%7C0%7C3&cv=1&br=1096&bt=1096&cs=2&ds=4&ft=GZnU0RqeffPdXP~ka1jNvAq-antLjrKYyVmCRkaml6C9UjVhWL6&mime_type=video_mp4&qs=0&rc=NjdoN2VpODlpMzo4ZzY4aEBpMzdsZnc5cmpuNDMzbGkzNEAuYS42Yi02Xl4xNWAwNS8yYSNrMnI1MmQ0c2thLS1kLWJzcw%3D%3D&btag=c0000e00010000&cquery=100o_101r_100B_100x_100z&dy_q=1754361813&feature_id=4fb091d884de9ce11fccc743bd685127&l=20250805104332288948511D5931AF76A4",
    //               "https://www.douyin.com/aweme/v1/play/?video_id=v1e00fgi0000d1nkvg7og65t8cui54n0&line=0&file_id=5e25833dc58740afa6950feb941ed413&sign=9385e98d24b168d6843f5394176edec5&is_play_url=1&source=PackSourceEnum_PUBLISH",
    //             ],
    //             width: 1920,
    //             height: 1080,
    //             url_key:
    //               "v1e00fgi0000d1nkvg7og65t8cui54n0_bytevc1_1080p_1122975",
    //             data_size: 3167773,
    //             file_hash: "9385e98d24b168d6843f5394176edec5",
    //             file_cs: "c:0-20211-0557|d:0-1583885-6263,1583886-3167772-af8d",
    //           },
    //           is_h265: 1,
    //           is_bytevc1: 1,
    //           HDR_type: "",
    //           HDR_bit: "",
    //           FPS: 30,
    //           video_extra:
    //             '{"PktOffsetMap":"[{\\"time\\": 1, \\"offset\\": 246850}, {\\"time\\": 2, \\"offset\\": 362958}, {\\"time\\": 3, \\"offset\\": 509253}, {\\"time\\": 4, \\"offset\\": 668879}, {\\"time\\": 5, \\"offset\\": 829981}, {\\"time\\": 10, \\"offset\\": 1535744}]","format":"mp4","definition":"1080p","quality":"normal","file_id":"5e25833dc58740afa6950feb941ed413","v_gear_id":"aweme/high_value_group","u_vmaf":93.1754,"applog_map":{"feature_id":"4fb091d884de9ce11fccc743bd685127"},"sr_sharpness_strength":8,"mvmaf":"{\\"mvmaf_sr_v1080\\":97.9,\\"mvmaf_sr_v960\\":98.358,\\"mvmaf_sr_v864\\":98.571,\\"mvmaf_sr_v720\\":99.283,\\"mvmaf_ori_v1080\\":92.707,\\"mvmaf_ori_v960\\":93.813,\\"mvmaf_ori_v864\\":94.524,\\"mvmaf_ori_v720\\":96.261}","audio_channels":"2.0","audio_sample_rate":"44100"}',
    //           format: "mp4",
    //         },
    //         {
    //           gear_name: "pc_bvc0_exp1_r2_adapt_low_540_0",
    //           quality_type: 291,
    //           bit_rate: 981845,
    //           play_addr: {
    //             uri: "v1e00fgi0000d1nkvg7og65t8cui54n0",
    //             url_list: [
    //               "https://v95-web-sz.douyinvod.com/2819b9275abc22df540e0b746bacd0e8/68919a1b/video/tos/cn/tos-cn-ve-15c000-ce/oYwPaQBPpI9EXPiG0hPizkCw1ZXQwA9uBAMoi/?a=6383&ch=10010&cr=3&dr=0&lr=all&cd=0%7C0%7C0%7C3&cv=1&br=958&bt=958&cs=0&ds=6&ft=GZnU0RqeffPdXP~ka1jNvAq-antLjrKYyVmCRkaml6C9UjVhWL6&mime_type=video_mp4&qs=12&rc=ZDRkZDYzaGk0NWlmNzk3aUBpMzdsZnc5cmpuNDMzbGkzNEA1LTNiNGExNWExXy0vXi8tYSNrMnI1MmQ0c2thLS1kLWJzcw%3D%3D&btag=c0000e00010000&cquery=100o_101r_100B_100x_100z&dy_q=1754361813&feature_id=0ea98fd3bdc3c6c14a3d0804cc272721&l=20250805104332288948511D5931AF76A4",
    //               "https://v3-web.douyinvod.com/cec749861b20dfed2c619933b814f0fe/68919a1b/video/tos/cn/tos-cn-ve-15c000-ce/oYwPaQBPpI9EXPiG0hPizkCw1ZXQwA9uBAMoi/?a=6383&ch=10010&cr=3&dr=0&lr=all&cd=0%7C0%7C0%7C3&cv=1&br=958&bt=958&cs=0&ds=6&ft=GZnU0RqeffPdXP~ka1jNvAq-antLjrKYyVmCRkaml6C9UjVhWL6&mime_type=video_mp4&qs=12&rc=ZDRkZDYzaGk0NWlmNzk3aUBpMzdsZnc5cmpuNDMzbGkzNEA1LTNiNGExNWExXy0vXi8tYSNrMnI1MmQ0c2thLS1kLWJzcw%3D%3D&btag=c0000e00010000&cquery=101r_100B_100x_100z_100o&dy_q=1754361813&feature_id=0ea98fd3bdc3c6c14a3d0804cc272721&l=20250805104332288948511D5931AF76A4",
    //               "https://www.douyin.com/aweme/v1/play/?video_id=v1e00fgi0000d1nkvg7og65t8cui54n0&line=0&file_id=0f24a6240cbf42d18f4ed073ea6a018a&sign=5e357927fb4dea211c7141dede46d770&is_play_url=1&source=PackSourceEnum_PUBLISH",
    //             ],
    //             width: 1024,
    //             height: 576,
    //             url_key: "v1e00fgi0000d1nkvg7og65t8cui54n0_h264_540p_981845",
    //             data_size: 2769664,
    //             file_hash: "5e357927fb4dea211c7141dede46d770",
    //             file_cs: "c:0-20035-0ecf|d:0-1384831-deab,1384832-2769663-65de",
    //           },
    //           is_h265: 0,
    //           is_bytevc1: 0,
    //           HDR_type: "",
    //           HDR_bit: "",
    //           FPS: 30,
    //           video_extra:
    //             '{"PktOffsetMap":"[{\\"time\\": 1, \\"offset\\": 186579}, {\\"time\\": 2, \\"offset\\": 315096}, {\\"time\\": 3, \\"offset\\": 448815}, {\\"time\\": 4, \\"offset\\": 579792}, {\\"time\\": 5, \\"offset\\": 723664}, {\\"time\\": 10, \\"offset\\": 1338904}]","format":"mp4","definition":"540p","quality":"adapt_low","file_id":"0f24a6240cbf42d18f4ed073ea6a018a","applog_map":{"feature_id":"0ea98fd3bdc3c6c14a3d0804cc272721"},"audio_channels":"2.0","audio_sample_rate":"44100"}',
    //           format: "mp4",
    //         },
    //         {
    //           gear_name: "720_1_1",
    //           quality_type: 11,
    //           bit_rate: 857095,
    //           play_addr: {
    //             uri: "v1e00fgi0000d1nkvg7og65t8cui54n0",
    //             url_list: [
    //               "https://v95-web-sz.douyinvod.com/b0622cb9ed2781565e85c7b92942ee05/68919a1b/video/tos/cn/tos-cn-ve-15c000-ce/o08AiuTlETQXk9uPvGiMQ0IlwP9PiAahVzHCB/?a=6383&ch=10010&cr=3&dr=0&lr=all&cd=0%7C0%7C0%7C3&cv=1&br=837&bt=837&cs=2&ds=3&ft=GZnU0RqeffPdXP~ka1jNvAq-antLjrKYyVmCRkaml6C9UjVhWL6&mime_type=video_mp4&qs=0&rc=OWU8ZDY2MzVnNzU3OTVoPEBpMzdsZnc5cmpuNDMzbGkzNEAxY2EtYjJiNTIxMC9fXjNgYSNrMnI1MmQ0c2thLS1kLWJzcw%3D%3D&btag=c0000e00010000&cquery=101r_100B_100x_100z_100o&dy_q=1754361813&feature_id=4fb091d884de9ce11fccc743bd685127&l=20250805104332288948511D5931AF76A4",
    //               "https://v3-web.douyinvod.com/1dcb26f1eb0bfdf121a5ae4d940a5896/68919a1b/video/tos/cn/tos-cn-ve-15c000-ce/o08AiuTlETQXk9uPvGiMQ0IlwP9PiAahVzHCB/?a=6383&ch=10010&cr=3&dr=0&lr=all&cd=0%7C0%7C0%7C3&cv=1&br=837&bt=837&cs=2&ds=3&ft=GZnU0RqeffPdXP~ka1jNvAq-antLjrKYyVmCRkaml6C9UjVhWL6&mime_type=video_mp4&qs=0&rc=OWU8ZDY2MzVnNzU3OTVoPEBpMzdsZnc5cmpuNDMzbGkzNEAxY2EtYjJiNTIxMC9fXjNgYSNrMnI1MmQ0c2thLS1kLWJzcw%3D%3D&btag=c0000e00010000&cquery=100x_100z_100o_101r_100B&dy_q=1754361813&feature_id=4fb091d884de9ce11fccc743bd685127&l=20250805104332288948511D5931AF76A4",
    //               "https://www.douyin.com/aweme/v1/play/?video_id=v1e00fgi0000d1nkvg7og65t8cui54n0&line=0&file_id=c96ea2b62432445d82e053e30ad9fb46&sign=9b40d72ad097262bb2d538cc4aba5eae&is_play_url=1&source=PackSourceEnum_PUBLISH",
    //             ],
    //             width: 1280,
    //             height: 720,
    //             url_key: "v1e00fgi0000d1nkvg7og65t8cui54n0_bytevc1_720p_857095",
    //             data_size: 2417759,
    //             file_hash: "9b40d72ad097262bb2d538cc4aba5eae",
    //             file_cs: "c:0-20212-c939|d:0-1208878-3af3,1208879-2417758-cfc9",
    //           },
    //           is_h265: 1,
    //           is_bytevc1: 1,
    //           HDR_type: "",
    //           HDR_bit: "",
    //           FPS: 30,
    //           video_extra:
    //             '{"PktOffsetMap":"[{\\"time\\": 1, \\"offset\\": 189553}, {\\"time\\": 2, \\"offset\\": 278662}, {\\"time\\": 3, \\"offset\\": 392708}, {\\"time\\": 4, \\"offset\\": 513288}, {\\"time\\": 5, \\"offset\\": 639231}, {\\"time\\": 10, \\"offset\\": 1177871}]","format":"mp4","definition":"720p","quality":"normal","file_id":"c96ea2b62432445d82e053e30ad9fb46","v_gear_id":"aweme/high_value_group","u_vmaf":94.5199,"applog_map":{"feature_id":"4fb091d884de9ce11fccc743bd685127"},"sr_sharpness_strength":8,"mvmaf":"{\\"mvmaf_sr_v1080\\":93.429,\\"mvmaf_sr_v960\\":95.694,\\"mvmaf_sr_v864\\":96.735,\\"mvmaf_sr_v720\\":98.027,\\"mvmaf_ori_v1080\\":84.423,\\"mvmaf_ori_v960\\":88.206,\\"mvmaf_ori_v864\\":90.552,\\"mvmaf_ori_v720\\":94.119}","audio_channels":"2.0","audio_sample_rate":"44100"}',
    //           format: "mp4",
    //         },
    //         {
    //           gear_name: "720_2_1",
    //           quality_type: 12,
    //           bit_rate: 661074,
    //           play_addr: {
    //             uri: "v1e00fgi0000d1nkvg7og65t8cui54n0",
    //             url_list: [
    //               "https://v95-web-sz.douyinvod.com/a3c42835218df446ad8d5f1771fc2eaa/68919a1b/video/tos/cn/tos-cn-ve-15c000-ce/owhiXGuwxzAIGB9QiQVFkavc1PEM0uPPBA94i/?a=6383&ch=10010&cr=3&dr=0&lr=all&cd=0%7C0%7C0%7C3&cv=1&br=645&bt=645&cs=2&ds=3&ft=GZnU0RqeffPdXP~ka1jNvAq-antLjrKYyVmCRkaml6C9UjVhWL6&mime_type=video_mp4&qs=0&rc=ZzM7NTs6NTw7NmZnaDg1aEBpMzdsZnc5cmpuNDMzbGkzNEAtLl5iNGExNWExMS5fNjIuYSNrMnI1MmQ0c2thLS1kLWJzcw%3D%3D&btag=c0000e00010000&cquery=100x_100z_100o_101r_100B&dy_q=1754361813&feature_id=4fb091d884de9ce11fccc743bd685127&l=20250805104332288948511D5931AF76A4",
    //               "https://v3-web.douyinvod.com/929aab25a668faa6922ffed507fe88ba/68919a1b/video/tos/cn/tos-cn-ve-15c000-ce/owhiXGuwxzAIGB9QiQVFkavc1PEM0uPPBA94i/?a=6383&ch=10010&cr=3&dr=0&lr=all&cd=0%7C0%7C0%7C3&cv=1&br=645&bt=645&cs=2&ds=3&ft=GZnU0RqeffPdXP~ka1jNvAq-antLjrKYyVmCRkaml6C9UjVhWL6&mime_type=video_mp4&qs=0&rc=ZzM7NTs6NTw7NmZnaDg1aEBpMzdsZnc5cmpuNDMzbGkzNEAtLl5iNGExNWExMS5fNjIuYSNrMnI1MmQ0c2thLS1kLWJzcw%3D%3D&btag=c0000e00010000&cquery=100B_100x_100z_100o_101r&dy_q=1754361813&feature_id=4fb091d884de9ce11fccc743bd685127&l=20250805104332288948511D5931AF76A4",
    //               "https://www.douyin.com/aweme/v1/play/?video_id=v1e00fgi0000d1nkvg7og65t8cui54n0&line=0&file_id=1e5295be1d4c43d88942d778e2a8100d&sign=859140695d5e307a4f67cea6d01df893&is_play_url=1&source=PackSourceEnum_PUBLISH",
    //             ],
    //             width: 1280,
    //             height: 720,
    //             url_key: "v1e00fgi0000d1nkvg7og65t8cui54n0_bytevc1_720p_661074",
    //             data_size: 1864808,
    //             file_hash: "859140695d5e307a4f67cea6d01df893",
    //             file_cs: "c:0-20212-b4a3|d:0-932403-6d3d,932404-1864807-768a",
    //           },
    //           is_h265: 1,
    //           is_bytevc1: 1,
    //           HDR_type: "",
    //           HDR_bit: "",
    //           FPS: 30,
    //           video_extra:
    //             '{"PktOffsetMap":"[{\\"time\\": 1, \\"offset\\": 152485}, {\\"time\\": 2, \\"offset\\": 220847}, {\\"time\\": 3, \\"offset\\": 307904}, {\\"time\\": 4, \\"offset\\": 399007}, {\\"time\\": 5, \\"offset\\": 494739}, {\\"time\\": 10, \\"offset\\": 906202}]","format":"mp4","definition":"720p","quality":"normal","file_id":"1e5295be1d4c43d88942d778e2a8100d","v_gear_id":"aweme/high_value_group","u_vmaf":91.4177,"applog_map":{"feature_id":"4fb091d884de9ce11fccc743bd685127"},"sr_sharpness_strength":8,"mvmaf":"{\\"mvmaf_sr_v1080\\":90.184,\\"mvmaf_sr_v960\\":92.581,\\"mvmaf_sr_v864\\":94.004,\\"mvmaf_sr_v720\\":96.098,\\"mvmaf_ori_v1080\\":81.164,\\"mvmaf_ori_v960\\":85.196,\\"mvmaf_ori_v864\\":87.173,\\"mvmaf_ori_v720\\":90.588}","audio_channels":"2.0","audio_sample_rate":"44100"}',
    //           format: "mp4",
    //         },
    //         {
    //           gear_name: "720_3_1",
    //           quality_type: 13,
    //           bit_rate: 522137,
    //           play_addr: {
    //             uri: "v1e00fgi0000d1nkvg7og65t8cui54n0",
    //             url_list: [
    //               "https://v95-web-sz.douyinvod.com/0a222d1dbb9a81c2b53763478e30d813/68919a1b/video/tos/cn/tos-cn-ve-15c000-ce/oY0vPiSzZGzX9hkBExaiPPMwIQ9B9Qu5VAPAi/?a=6383&ch=10010&cr=3&dr=0&lr=all&cd=0%7C0%7C0%7C3&cv=1&br=509&bt=509&cs=2&ds=3&ft=GZnU0RqeffPdXP~ka1jNvAq-antLjrKYyVmCRkaml6C9UjVhWL6&mime_type=video_mp4&qs=0&rc=Omk1ZjVkaDY3MzY8OTc1ZEBpMzdsZnc5cmpuNDMzbGkzNEBhXzIxLTUtNi4xMjIzLjUuYSNrMnI1MmQ0c2thLS1kLWJzcw%3D%3D&btag=c0000e00010000&cquery=100o_101r_100B_100x_100z&dy_q=1754361813&feature_id=4fb091d884de9ce11fccc743bd685127&l=20250805104332288948511D5931AF76A4",
    //               "https://v3-web.douyinvod.com/e2f8c0465da6fb6cbb88d68c0f861304/68919a1b/video/tos/cn/tos-cn-ve-15c000-ce/oY0vPiSzZGzX9hkBExaiPPMwIQ9B9Qu5VAPAi/?a=6383&ch=10010&cr=3&dr=0&lr=all&cd=0%7C0%7C0%7C3&cv=1&br=509&bt=509&cs=2&ds=3&ft=GZnU0RqeffPdXP~ka1jNvAq-antLjrKYyVmCRkaml6C9UjVhWL6&mime_type=video_mp4&qs=0&rc=Omk1ZjVkaDY3MzY8OTc1ZEBpMzdsZnc5cmpuNDMzbGkzNEBhXzIxLTUtNi4xMjIzLjUuYSNrMnI1MmQ0c2thLS1kLWJzcw%3D%3D&btag=c0000e00010000&cquery=101r_100B_100x_100z_100o&dy_q=1754361813&feature_id=4fb091d884de9ce11fccc743bd685127&l=20250805104332288948511D5931AF76A4",
    //               "https://www.douyin.com/aweme/v1/play/?video_id=v1e00fgi0000d1nkvg7og65t8cui54n0&line=0&file_id=1a82146659534014930e8a024c52bfd7&sign=b93a9f2716394d647d88503d6adcf3a5&is_play_url=1&source=PackSourceEnum_PUBLISH",
    //             ],
    //             width: 1280,
    //             height: 720,
    //             url_key: "v1e00fgi0000d1nkvg7og65t8cui54n0_bytevc1_720p_522137",
    //             data_size: 1472885,
    //             file_hash: "b93a9f2716394d647d88503d6adcf3a5",
    //             file_cs: "c:0-20212-b81c|d:0-736441-ae80,736442-1472884-fc0b",
    //           },
    //           is_h265: 1,
    //           is_bytevc1: 1,
    //           HDR_type: "",
    //           HDR_bit: "",
    //           FPS: 30,
    //           video_extra:
    //             '{"PktOffsetMap":"[{\\"time\\": 1, \\"offset\\": 126565}, {\\"time\\": 2, \\"offset\\": 180375}, {\\"time\\": 3, \\"offset\\": 249234}, {\\"time\\": 4, \\"offset\\": 320379}, {\\"time\\": 5, \\"offset\\": 395281}, {\\"time\\": 10, \\"offset\\": 719227}]","format":"mp4","definition":"720p","quality":"normal","file_id":"1a82146659534014930e8a024c52bfd7","v_gear_id":"aweme/high_value_group","u_vmaf":88.2633,"applog_map":{"feature_id":"4fb091d884de9ce11fccc743bd685127"},"sr_sharpness_strength":8,"mvmaf":"{\\"mvmaf_sr_v1080\\":86.676,\\"mvmaf_sr_v960\\":89.003,\\"mvmaf_sr_v864\\":90.875,\\"mvmaf_sr_v720\\":93.153,\\"mvmaf_ori_v1080\\":77.845,\\"mvmaf_ori_v960\\":81.608,\\"mvmaf_ori_v864\\":83.884,\\"mvmaf_ori_v720\\":87.925}","audio_channels":"2.0","audio_sample_rate":"44100"}',
    //           format: "mp4",
    //         },
    //         {
    //           gear_name: "720_4_1",
    //           quality_type: 14,
    //           bit_rate: 409195,
    //           play_addr: {
    //             uri: "v1e00fgi0000d1nkvg7og65t8cui54n0",
    //             url_list: [
    //               "https://v95-web-sz.douyinvod.com/3442af42b1561974b8511223142ca988/68919a1b/video/tos/cn/tos-cn-ve-15c000-ce/okhAIAIYXGQiavwBPMVd09uAEPBPvQi4kzG9i/?a=6383&ch=10010&cr=3&dr=0&lr=all&cd=0%7C0%7C0%7C3&cv=1&br=399&bt=399&cs=2&ds=3&ft=GZnU0RqeffPdXP~ka1jNvAq-antLjrKYyVmCRkaml6C9UjVhWL6&mime_type=video_mp4&qs=0&rc=NzlpZmlnN2U5aDY4NGQ5ZUBpMzdsZnc5cmpuNDMzbGkzNEBfMzQ2NTY1Xl4xYjRgM2I0YSNrMnI1MmQ0c2thLS1kLWJzcw%3D%3D&btag=c0000e00010000&cquery=101r_100B_100x_100z_100o&dy_q=1754361813&feature_id=4fb091d884de9ce11fccc743bd685127&l=20250805104332288948511D5931AF76A4",
    //               "https://v3-web.douyinvod.com/e6b98e398a29149998de359cb282ff15/68919a1b/video/tos/cn/tos-cn-ve-15c000-ce/okhAIAIYXGQiavwBPMVd09uAEPBPvQi4kzG9i/?a=6383&ch=10010&cr=3&dr=0&lr=all&cd=0%7C0%7C0%7C3&cv=1&br=399&bt=399&cs=2&ds=3&ft=GZnU0RqeffPdXP~ka1jNvAq-antLjrKYyVmCRkaml6C9UjVhWL6&mime_type=video_mp4&qs=0&rc=NzlpZmlnN2U5aDY4NGQ5ZUBpMzdsZnc5cmpuNDMzbGkzNEBfMzQ2NTY1Xl4xYjRgM2I0YSNrMnI1MmQ0c2thLS1kLWJzcw%3D%3D&btag=c0000e00010000&cquery=101r_100B_100x_100z_100o&dy_q=1754361813&feature_id=4fb091d884de9ce11fccc743bd685127&l=20250805104332288948511D5931AF76A4",
    //               "https://www.douyin.com/aweme/v1/play/?video_id=v1e00fgi0000d1nkvg7og65t8cui54n0&line=0&file_id=7be66ac175e34ea6ab849d8f9c7f66b4&sign=393d73e8b171f760fa354e6d621d0cc7&is_play_url=1&source=PackSourceEnum_PUBLISH",
    //             ],
    //             width: 1280,
    //             height: 720,
    //             url_key: "v1e00fgi0000d1nkvg7og65t8cui54n0_bytevc1_720p_409195",
    //             data_size: 1154290,
    //             file_hash: "393d73e8b171f760fa354e6d621d0cc7",
    //             file_cs: "c:0-20212-1d03|d:0-577144-768c,577145-1154289-551b",
    //           },
    //           is_h265: 1,
    //           is_bytevc1: 1,
    //           HDR_type: "",
    //           HDR_bit: "",
    //           FPS: 30,
    //           video_extra:
    //             '{"PktOffsetMap":"[{\\"time\\": 1, \\"offset\\": 104355}, {\\"time\\": 2, \\"offset\\": 145888}, {\\"time\\": 3, \\"offset\\": 199230}, {\\"time\\": 4, \\"offset\\": 253622}, {\\"time\\": 5, \\"offset\\": 311075}, {\\"time\\": 10, \\"offset\\": 560560}]","format":"mp4","definition":"720p","quality":"normal","file_id":"7be66ac175e34ea6ab849d8f9c7f66b4","v_gear_id":"aweme/high_value_group","u_vmaf":84.0139,"applog_map":{"feature_id":"4fb091d884de9ce11fccc743bd685127"},"sr_sharpness_strength":8,"mvmaf":"{\\"mvmaf_sr_v1080\\":81.888,\\"mvmaf_sr_v960\\":83.755,\\"mvmaf_sr_v864\\":85.622,\\"mvmaf_sr_v720\\":88.812,\\"mvmaf_ori_v1080\\":73.063,\\"mvmaf_ori_v960\\":77.483,\\"mvmaf_ori_v864\\":79.581,\\"mvmaf_ori_v720\\":83.569}","audio_channels":"2.0","audio_sample_rate":"44100"}',
    //           format: "mp4",
    //         },
    //       ],
    //       duration: 22567,
    //       bit_rate_audio: null,
    //       gaussian_cover: {
    //         uri: "tos-cn-p-0015c000-ce/ocNe4SAgIBGAv4lLTtFP2hne1ADT2DF6gZfSeK",
    //         url_list: [
    //           "https://p3-pc-sign.douyinpic.com/tos-cn-p-0015c000-ce/ocNe4SAgIBGAv4lLTtFP2hne1ADT2DF6gZfSeK~tplv-tsj2vxp0zn-gaosi:40.jpeg?lk3s=138a59ce&x-expires=1785895200&x-signature=SoNQJb9u0f5NR8s%2Bbm4CqgGYYrw%3D&from=327834062",
    //           "https://p9-pc-sign.douyinpic.com/tos-cn-p-0015c000-ce/ocNe4SAgIBGAv4lLTtFP2hne1ADT2DF6gZfSeK~tplv-tsj2vxp0zn-gaosi:40.jpeg?lk3s=138a59ce&x-expires=1785895200&x-signature=Hv3oDUB%2BtF%2Bdzy5Is%2BvgR3ipH7w%3D&from=327834062",
    //         ],
    //         width: 720,
    //         height: 720,
    //       },
    //       play_addr_265: {
    //         uri: "v1e00fgi0000d1nkvg7og65t8cui54n0",
    //         url_list: [
    //           "https://v95-web-sz.douyinvod.com/b84e913918bca790c124e263a2302373/68919a1b/video/tos/cn/tos-cn-ve-15c000-ce/oIBXkVhPhWP9CwHIcQii0GvauiE9PQGAuAMzU/?a=6383&ch=10010&cr=3&dr=0&lr=all&cd=0%7C0%7C0%7C3&cv=1&br=2223&bt=2223&cs=2&ft=GZnU0RqeffPdXP~ka1jNvAq-antLjrKYyVmCRkaml6C9UjVhWL6&mime_type=video_mp4&qs=15&rc=aTY8NmdpPGY5NzU0Zmc3OUBpMzdsZnc5cmpuNDMzbGkzNEA1NmMzMDUxNWIxLmEyLjNjYSNrMnI1MmQ0c2thLS1kLWJzcw%3D%3D&btag=c0000e00010000&cquery=101r_100B_100x_100z_100o&dy_q=1754361813&feature_id=10cf95ef75b4f3e7eac623e4ea0ea691&l=20250805104332288948511D5931AF76A4",
    //           "https://v3-web.douyinvod.com/65303ba2a24ccaaa72aa0172a431b8f0/68919a1b/video/tos/cn/tos-cn-ve-15c000-ce/oIBXkVhPhWP9CwHIcQii0GvauiE9PQGAuAMzU/?a=6383&ch=10010&cr=3&dr=0&lr=all&cd=0%7C0%7C0%7C3&cv=1&br=2223&bt=2223&cs=2&ft=GZnU0RqeffPdXP~ka1jNvAq-antLjrKYyVmCRkaml6C9UjVhWL6&mime_type=video_mp4&qs=15&rc=aTY8NmdpPGY5NzU0Zmc3OUBpMzdsZnc5cmpuNDMzbGkzNEA1NmMzMDUxNWIxLmEyLjNjYSNrMnI1MmQ0c2thLS1kLWJzcw%3D%3D&btag=c0000e00010000&cquery=101r_100B_100x_100z_100o&dy_q=1754361813&feature_id=10cf95ef75b4f3e7eac623e4ea0ea691&l=20250805104332288948511D5931AF76A4",
    //           "https://www.douyin.com/aweme/v1/play/?video_id=v1e00fgi0000d1nkvg7og65t8cui54n0&line=0&file_id=f6641d5cd11244e68c498f3d63f9938f&sign=415f1c4cbf8b9c10d84bffb4611df541&is_play_url=1&source=PackSourceEnum_PUBLISH",
    //         ],
    //         width: 2560,
    //         height: 1440,
    //         url_key: "v1e00fgi0000d1nkvg7og65t8cui54n0_bytevc1_1440p_2276476",
    //         data_size: 6412266,
    //         file_hash: "415f1c4cbf8b9c10d84bffb4611df541",
    //         file_cs: "c:0-26219-4f53|d:0-3206132-59ad,3206133-6412265-f3a1",
    //       },
    //       audio: {
    //         original_sound_infos: null,
    //       },
    //       play_addr_h264: {
    //         uri: "v1e00fgi0000d1nkvg7og65t8cui54n0",
    //         url_list: [
    //           "https://v95-web-sz.douyinvod.com/829b7c9cd78945aece51b60011298ce9/68919a1b/video/tos/cn/tos-cn-ve-15c000-ce/oUhiXTuwczAIGB9QiQ4dka065PEM0CPPGA9zi/?a=6383&ch=10010&cr=3&dr=0&lr=all&cd=0%7C0%7C0%7C3&cv=1&br=2341&bt=2341&cs=0&ds=4&ft=GZnU0RqeffPdXP~ka1jNvAq-antLjrKYyVmCRkaml6C9UjVhWL6&mime_type=video_mp4&qs=0&rc=OjM3PDg0NTlkOTw7ZjY7OUBpMzdsZnc5cmpuNDMzbGkzNEBjNGEyYTA2XjQxNV9fMGNjYSNrMnI1MmQ0c2thLS1kLWJzcw%3D%3D&btag=c0000e00010000&cquery=100x_100z_100o_101r_100B&dy_q=1754361813&feature_id=0ea98fd3bdc3c6c14a3d0804cc272721&l=20250805104332288948511D5931AF76A4",
    //           "https://v3-web.douyinvod.com/e2404d652c858ad01cd3651e9f6c6751/68919a1b/video/tos/cn/tos-cn-ve-15c000-ce/oUhiXTuwczAIGB9QiQ4dka065PEM0CPPGA9zi/?a=6383&ch=10010&cr=3&dr=0&lr=all&cd=0%7C0%7C0%7C3&cv=1&br=2341&bt=2341&cs=0&ds=4&ft=GZnU0RqeffPdXP~ka1jNvAq-antLjrKYyVmCRkaml6C9UjVhWL6&mime_type=video_mp4&qs=0&rc=OjM3PDg0NTlkOTw7ZjY7OUBpMzdsZnc5cmpuNDMzbGkzNEBjNGEyYTA2XjQxNV9fMGNjYSNrMnI1MmQ0c2thLS1kLWJzcw%3D%3D&btag=c0000e00010000&cquery=101r_100B_100x_100z_100o&dy_q=1754361813&feature_id=0ea98fd3bdc3c6c14a3d0804cc272721&l=20250805104332288948511D5931AF76A4",
    //           "https://www.douyin.com/aweme/v1/play/?video_id=v1e00fgi0000d1nkvg7og65t8cui54n0&line=0&file_id=f6f833bcb889467aa69231d559d470f7&sign=711aad96b4dac0182c52dd28c1eb1bda&is_play_url=1&source=PackSourceEnum_PUBLISH",
    //         ],
    //         width: 1920,
    //         height: 1080,
    //         url_key: "v1e00fgi0000d1nkvg7og65t8cui54n0_h264_1080p_2398045",
    //         data_size: 6764587,
    //         file_hash: "711aad96b4dac0182c52dd28c1eb1bda",
    //         file_cs: "c:0-20034-90fc|d:0-3382292-7f35,3382293-6764586-f864",
    //       },
    //       raw_cover: {
    //         uri: "tos-cn-p-0015c000-ce/oQ4Kv4Y2SQDSDnPTIhTAieG1LBeOAFfCmg0eis",
    //         url_list: [
    //           "https://p3-pc-sign.douyinpic.com/tos-cn-p-0015c000-ce/oQ4Kv4Y2SQDSDnPTIhTAieG1LBeOAFfCmg0eis~tplv-dy-cropcenter:323:430.jpeg?lk3s=138a59ce&x-expires=2069719200&x-signature=HxrbEYwW627FHYS0o6ZV4BgKJTE%3D&from=327834062&s=PackSourceEnum_PUBLISH&se=true&sh=323_430&sc=cover&biz_tag=pcweb_cover&l=20250805104332288948511D5931AF76A4",
    //           "https://p3-pc-sign.douyinpic.com/obj/tos-cn-p-0015c000-ce/oQ4Kv4Y2SQDSDnPTIhTAieG1LBeOAFfCmg0eis?lk3s=138a59ce&x-expires=2069719200&x-signature=5J5v5xgWOwAPm8jarwuGgbZ4mew%3D&from=327834062&s=PackSourceEnum_PUBLISH&se=false&sc=cover&biz_tag=pcweb_cover&l=20250805104332288948511D5931AF76A4",
    //           "https://p9-pc-sign.douyinpic.com/obj/tos-cn-p-0015c000-ce/oQ4Kv4Y2SQDSDnPTIhTAieG1LBeOAFfCmg0eis?lk3s=138a59ce&x-expires=2069719200&x-signature=dcj5Ix9iX%2FQhWNVCWl6ukWKWzjs%3D&from=327834062&s=PackSourceEnum_PUBLISH&se=false&sc=cover&biz_tag=pcweb_cover&l=20250805104332288948511D5931AF76A4",
    //         ],
    //         width: 720,
    //         height: 720,
    //       },
    //       animated_cover: {
    //         uri: "tos-cn-p-0015c000-ce/oIeBI4leYTGhvJkDDegnTRBfvF4AMxUAUr298A",
    //         url_list: [
    //           "https://p9-pc-sign.douyinpic.com/obj/tos-cn-p-0015c000-ce/oIeBI4leYTGhvJkDDegnTRBfvF4AMxUAUr298A?lk3s=138a59ce&x-expires=1755568800&x-signature=S6ZklpJIZ0gB%2B7jljDxdwIuwU6I%3D&from=327834062_large&s=PackSourceEnum_PUBLISH&se=false&sc=dynamic_cover&biz_tag=pcweb_cover&l=20250805104332288948511D5931AF76A4",
    //           "https://p3-pc-sign.douyinpic.com/obj/tos-cn-p-0015c000-ce/oIeBI4leYTGhvJkDDegnTRBfvF4AMxUAUr298A?lk3s=138a59ce&x-expires=1755568800&x-signature=ca5RylHSfz83r5rNzKHTv3tlpt4%3D&from=327834062_large&s=PackSourceEnum_PUBLISH&se=false&sc=dynamic_cover&biz_tag=pcweb_cover&l=20250805104332288948511D5931AF76A4",
    //         ],
    //       },
    //       horizontal_type: 1,
    //       big_thumbs: [
    //         {
    //           img_num: 23,
    //           uri: "tos-cn-p-0015c000-ce/oMhiXOuwszAIGB9QiDU4kavMFPIM0DPPCA9pi",
    //           img_url:
    //             "https://p3-sign.douyinpic.com/tos-cn-p-0015c000-ce/oMhiXOuwszAIGB9QiDU4kavMFPIM0DPPCA9pi~tplv-noop.image?cquery=101r_100B_100x_100z_100o&dy_q=1754361813&l=20250805104332288948511D5931AF76A4&x-expires=1754372635&x-signature=zLT4aEK6wv6npTiidyFdQ5ko1Dc%3D",
    //           img_x_size: 240,
    //           img_y_size: 136,
    //           img_x_len: 5,
    //           img_y_len: 5,
    //           duration: 22.506,
    //           interval: 1,
    //           fext: "jpg",
    //           uris: [
    //             "tos-cn-p-0015c000-ce/oMhiXOuwszAIGB9QiDU4kavMFPIM0DPPCA9pi",
    //           ],
    //           img_urls: [
    //             "https://p3-sign.douyinpic.com/tos-cn-p-0015c000-ce/oMhiXOuwszAIGB9QiDU4kavMFPIM0DPPCA9pi~tplv-noop.image?cquery=101r_100B_100x_100z_100o&dy_q=1754361813&l=20250805104332288948511D5931AF76A4&x-expires=1754372635&x-signature=zLT4aEK6wv6npTiidyFdQ5ko1Dc%3D",
    //           ],
    //         },
    //       ],
    //       video_model: "",
    //     },
    //     share_url:
    //       "https://www.iesdouyin.com/share/video/7525321412706454843/?region=CN&mid=7525321405987064626&u_code=jj95fjd6&did=MS4wLjABAAAA9BaozTVk2tPsswpnTKn2Rdxwxvwaw4OqWG7lK0mIBhvGg-Zhtj_y_KgVTFY1STgO&iid=MS4wLjABAAAANwkJuWIRFOzg5uCpDRpMj4OX-QryoDgn-yYlXQnRwQQ&with_sec_did=1&video_share_track_ver=&titleType=title&share_sign=wX3NSs5J2OfsAJchEa7xF1Lm73Sltp0KKzFJiAhrajo-&share_version=190500&ts=1754361813&from_aid=6383&from_ssr=1",
    //     user_digged: 0,
    //     statistics: {
    //       recommend_count: 7398,
    //       comment_count: 4916,
    //       digg_count: 378182,
    //       admire_count: 0,
    //       play_count: 0,
    //       share_count: 163328,
    //       collect_count: 16158,
    //     },
    //     status: {
    //       not_allow_soft_del_reason: "ab",
    //       is_delete: false,
    //       allow_share: true,
    //       review_result: {
    //         review_status: 0,
    //       },
    //       allow_friend_recommend_guide: true,
    //       part_see: 0,
    //       private_status: 0,
    //       listen_video_status: 2,
    //       in_reviewing: false,
    //       allow_self_recommend_to_friend: true,
    //       allow_friend_recommend: true,
    //       is_prohibited: false,
    //       enable_soft_delete: 0,
    //     },
    //     enable_comment_sticker_rec: false,
    //     text_extra: [],
    //     is_top: 1,
    //     personal_page_botton_diagnose_style: 0,
    //     share_info: {
    //       share_url:
    //         "https://www.iesdouyin.com/share/video/7525321412706454843/?region=CN&mid=7525321405987064626&u_code=jj95fjd6&did=MS4wLjABAAAA9BaozTVk2tPsswpnTKn2Rdxwxvwaw4OqWG7lK0mIBhvGg-Zhtj_y_KgVTFY1STgO&iid=MS4wLjABAAAANwkJuWIRFOzg5uCpDRpMj4OX-QryoDgn-yYlXQnRwQQ&with_sec_did=1&video_share_track_ver=&titleType=title&share_sign=wX3NSs5J2OfsAJchEa7xF1Lm73Sltp0KKzFJiAhrajo-&share_version=190500&ts=1754361813&from_aid=6383&from_ssr=1",
    //       share_link_desc:
    //         "4.17 08/28 K@J.vs bAG:/ 这谁听了不得喊两句啊？  %s 复制此链接，打开Dou音搜索，直接观看视频！",
    //     },
    //     is_from_ad_auth: false,
    //     video_labels: null,
    //     original_anchor_type: 15,
    //     is_ads: false,
    //     duration: 22567,
    //     aweme_type: 0,
    //     galileo_pad_textcrop: {
    //       ipad_d_h_cut_ratio: [2, 2],
    //       ipad_d_v_cut_ratio: [2, 2],
    //       android_d_h_cut_ratio: [2],
    //       android_d_v_cut_ratio: [2],
    //       version: 1,
    //     },
    //     follow_shoot_clip_info: {
    //       clip_video_all: 7525321405987065000,
    //       clip_from_user: 7525321405987065000,
    //     },
    //     image_infos: null,
    //     risk_infos: {
    //       vote: false,
    //       warn: false,
    //       risk_sink: false,
    //       type: 0,
    //       content: "",
    //     },
    //     game_tag_info: {
    //       is_game: false,
    //     },
    //     friend_recommend_info: {
    //       friend_recommend_source: 10,
    //       label_user_list: null,
    //       disable_friend_recommend_guide_label: false,
    //     },
    //     position: null,
    //     uniqid_position: null,
    //     comment_list: null,
    //     author_user_id: 888870295051540,
    //     caption_template_id: 0,
    //     geofencing: [],
    //     entertainment_video_type: 2,
    //     aweme_listen_struct: {
    //       trace_info:
    //         '{"copyright_not_speech":"false","copyright_reason":"has_listen_cp_new","copyright_tag_hit":"","copyright_use_aed_default":"false","copyright_use_tag_default":"false","cp_ab":"true","desc":"","duration_over":"false","hit_high_risk":"false","media_type":"4","reason":"hit_ab_0","show":"false"}',
    //     },
    //     region: "CN",
    //     video_text: null,
    //     original: 0,
    //     collect_stat: 0,
    //     label_top_text: null,
    //     promotions: [],
    //     group_id: "7525321412706454843",
    //     prevent_download: false,
    //     nickname_position: null,
    //     challenge_position: null,
    //     publish_plus_alienation: {
    //       alienation_type: 0,
    //     },
    //     is_use_music: false,
    //     caption: "这谁听了不得喊两句啊？",
    //     long_video: null,
    //     mv_info: null,
    //     can_cache_to_local: true,
    //     item_title: "",
    //     series_basic_info: {},
    //     interaction_stickers: null,
    //     flash_mob_trends: 0,
    //     origin_comment_ids: null,
    //     commerce_config_data: null,
    //     cf_assets_type: 0,
    //     video_control: {
    //       allow_download: true,
    //       share_type: 1,
    //       show_progress_bar: 0,
    //       draft_progress_bar: 0,
    //       allow_duet: true,
    //       allow_react: true,
    //       prevent_download_type: 0,
    //       allow_dynamic_wallpaper: true,
    //       timer_status: 1,
    //       allow_music: true,
    //       allow_stitch: true,
    //       allow_douplus: true,
    //       allow_share: true,
    //       share_grayed: false,
    //       download_ignore_visibility: true,
    //       duet_ignore_visibility: true,
    //       share_ignore_visibility: true,
    //       download_info: {
    //         level: 0,
    //       },
    //       duet_info: {
    //         level: 0,
    //       },
    //       allow_record: true,
    //       disable_record_reason: "",
    //       timer_info: {},
    //     },
    //     aweme_control: {
    //       can_forward: true,
    //       can_share: true,
    //       can_comment: true,
    //       can_show_comment: true,
    //     },
    //     is_moment_history: 0,
    //     mix_info: {
    //       mix_id: "7528287669684537382",
    //       mix_name: "行车“疯”景",
    //       cover_url: {
    //         uri: "douyin-user-image-file/1a1dd7b1e7c40864e8dc60118fa1e9d8",
    //         url_list: [
    //           "https://p95-sz-sign.douyinpic.com/obj/douyin-user-image-file/1a1dd7b1e7c40864e8dc60118fa1e9d8?lk3s=138a59ce&x-expires=1754380800&x-signature=VWkfuwX6F8BoYGR1wUgJnbMn7Aw%3D&from=327834062&s=PackSourceEnum_PUBLISH&se=false&sc=mix_cover&biz_tag=aweme_mix&l=20250805104332288948511D5931AF76A4",
    //           "https://p26-sign.douyinpic.com/obj/douyin-user-image-file/1a1dd7b1e7c40864e8dc60118fa1e9d8?lk3s=138a59ce&x-expires=1754380800&x-signature=3AaIOjwwai7jO3GRZ%2FBdJYzboR4%3D&from=327834062&s=PackSourceEnum_PUBLISH&se=false&sc=mix_cover&biz_tag=aweme_mix&l=20250805104332288948511D5931AF76A4",
    //           "https://p9-sign.douyinpic.com/obj/douyin-user-image-file/1a1dd7b1e7c40864e8dc60118fa1e9d8?lk3s=138a59ce&x-expires=1754380800&x-signature=bhNXUBtZNhaVT6OjY2evBWwjBnQ%3D&from=327834062&s=PackSourceEnum_PUBLISH&se=false&sc=mix_cover&biz_tag=aweme_mix&l=20250805104332288948511D5931AF76A4",
    //         ],
    //         width: 720,
    //         height: 720,
    //       },
    //       status: {
    //         status: 2,
    //         is_collected: 0,
    //       },
    //       statis: {
    //         play_vv: 0,
    //         collect_vv: 0,
    //         current_episode: 7,
    //         updated_to_episode: 21,
    //       },
    //       desc: "",
    //       extra:
    //         '{"audit_locktime":1753640522,"ban_fields":[],"create_source":0,"enter_from":"app","first_reviewed":1,"is_author_set_self_see":0,"last_added_item_time":1753667012,"mix_ad_info":{"copy_right_item_count":21,"music_physical_game_count":6,"risk_copy_right_item_count":0},"mix_pic_type":0,"next_info":{"cover":"douyin-user-image-file/1a1dd7b1e7c40864e8dc60118fa1e9d8","desc":"","name":"行车“疯”景"},"pic_item_count":0,"segmentation":"敌 蜜 好 起来 了","top_item_content_label":{"2023":6,"2029":15},"total_duration":444}',
    //       share_info: {
    //         share_url:
    //           "https://www.iesdouyin.com/share/mix/detail/7528287669684537382/?schema_type=24&object_id=7528287669684537382&from_ssr=1",
    //         share_weibo_desc:
    //           "8.99 02/17 BtR:/ N@J.vs 我正在看【行车“疯”景】长按复制此条消息，打开抖音搜索，一起看合集~",
    //         share_desc:
    //           "1.56 02/06 l@p.dn goq:/ 我正在看【行车“疯”景】长按复制此条消息，打开抖音搜索，一起看合集~",
    //         share_title: "这么有趣的合集，不能只有我一个人知道吧",
    //         share_title_myself: "",
    //         share_title_other: "",
    //         share_desc_info:
    //           "8.99 02/17 BtR:/ N@J.vs 我正在看【行车“疯”景】长按复制此条消息，打开抖音搜索，一起看合集~",
    //       },
    //       mix_type: 0,
    //       create_time: 1752816063,
    //       update_time: 1753667012,
    //       ids: null,
    //       watched_item: "",
    //       is_serial_mix: 0,
    //       mix_pic_type: 0,
    //       enable_ad: 0,
    //       is_iaa: 0,
    //       paid_episodes: null,
    //     },
    //     is_new_text_mode: 0,
    //     anchor_info: {
    //       type: 15,
    //       id: "aw7c4z4ej0o3efzd",
    //       icon: {
    //         uri: "aweme-jupiter/18c4cde71e518e1c319cfadb5e140ed7.png",
    //         url_list: [
    //           "https://p3-pc-sign.douyinpic.com/obj/aweme-jupiter/18c4cde71e518e1c319cfadb5e140ed7.png?lk3s=138a59ce&x-expires=1755568800&x-signature=fd1uL9qB8%2BMHUjWLMNyD6hLP9OE%3D&from=327834062",
    //           "https://p9-pc-sign.douyinpic.com/obj/aweme-jupiter/18c4cde71e518e1c319cfadb5e140ed7.png?lk3s=138a59ce&x-expires=1755568800&x-signature=jC8zl%2BJSKLAPa%2FEU1PgivPgnOEs%3D&from=327834062",
    //         ],
    //         width: 720,
    //         height: 720,
    //         url_key:
    //           "https://p3-sign.douyinpic.com/obj/aweme-jupiter/18c4cde71e518e1c319cfadb5e140ed7.png?x-expires=1754618400&x-signature=TJ0ju8fq4DlY5rekjL5nZP3KE3k%3D&from=2347263168",
    //       },
    //       title: "",
    //       title_tag: "剪映",
    //       content: "{}",
    //       style_info: {
    //         default_icon:
    //           "https://p3-sign.douyinpic.com/obj/aweme-jupiter/18c4cde71e518e1c319cfadb5e140ed7.png?x-expires=1754618400&x-signature=TJ0ju8fq4DlY5rekjL5nZP3KE3k%3D&from=2347263168",
    //         scene_icon:
    //           '{"feed":"https://p3-sign.douyinpic.com/obj/aweme-jupiter/18c4cde71e518e1c319cfadb5e140ed7.png?x-expires=1754618400&x-signature=TJ0ju8fq4DlY5rekjL5nZP3KE3k%3D&from=2347263168"}',
    //         extra: "{}",
    //       },
    //       extra:
    //         '{"base":{"client_key":"aw7c4z4ej0o3efzd","app_name":"剪映","app_icon":"https://p11-sign.douyinpic.com/obj/douyin-open-platform/b22313de3911b1169d1064198d589bc1?lk3s=4ced739e\\u0026x-expires=1769911200\\u0026x-signature=9634KGPZLgFHwLhQUSokHGud7FI%3D\\u0026from=1290630046"},"anchor":{"name":"轻松加字幕自动标重点","icon":"https://p3-sign.douyinpic.com/obj/douyin-web-image/b54d7ae38b1ea033b610bf53cf53ae76?lk3s=9e7df69c\\u0026x-expires=1754380800\\u0026x-signature=laMU3ZRpy1HezY%2F%2Buir7L8epiqg%3D\\u0026from=2659055260","url":"https://lv.ulikecam.com/act/lv-feed?app_id=6383\\u0026aweme_item_id=7525321412706454843\\u0026capabilities=subtitle_recognition\\u0026capability_effect_id=%7B%22beauty_body%22%3A%227406181120506678580%2C7408076966164778255%22%7D\\u0026effect_id=subtitle_recognition\\u0026effect_type=tool\\u0026hide_nav_bar=1\\u0026lv_log_extra=%7B%22anchor_type%22%3A%22edit_gameplay%22%7D\\u0026new_style_id=\\u0026new_template_id=\\u0026should_full_screen=true\\u0026template_music_id=\\u0026type=2","new_url":"https://api.amemv.com/magic/eco/runtime/release/6461f944e84c15036369f2a8?appType=douyinpc\\u0026background_color=linear-gradient%28180deg%2C%20%231D6AC4%200.01%25%2C%20%23000%2099.99%25%29\\u0026bundle=landing%2Ftemplate.js\\u0026call_link=vega%3A%2F%2Fcom.ies.videocut%2Fmain%2Fdraft%2Fnew_draft%3Ffrom%3Ddouyin_anchor_middle_page\\u0026channel=anchor_landing_lynx\\u0026lv_log_extra=%7B%22anchor_type%22%3A%22edit_gameplay%22%7D\\u0026magic_page_no=1\\u0026material_type=1\\u0026server_jump_lv_params=%7B%22ug_open_third_app_cert_id%22%3A%221023913986%22%7D\\u0026type=2","icon_uri":"aweme-jupiter/18c4cde71e518e1c319cfadb5e140ed7.png","title_tag":"剪映","is_template":false,"log_extra":"{\\"anchor_type\\":\\"edit_gameplay\\",\\"is_sdk\\":\\"0\\",\\"anchor_key\\":\\"subtitle_recognition\\",\\"image_anchor_type\\":\\"edit_gameplay\\",\\"image_anchor_extra\\":\\"{\\\\\\"anchor_type\\\\\\":\\\\\\"edit_gameplay\\\\\\",\\\\\\"anchor_key\\\\\\":\\\\\\"subtitle_recognition\\\\\\",\\\\\\"anchor_name\\\\\\":\\\\\\"capcut_app\\\\\\"}\\",\\"new_anchor_type\\":\\"edit_gameplay\\"}"},"share":{"share_id":"1837236608276500","style_id":"1815354849617962"}}',
    //       log_extra:
    //         '{"anchor_type":"edit_gameplay","is_sdk":"0","anchor_key":"subtitle_recognition","image_anchor_type":"edit_gameplay","image_anchor_extra":"{\\"anchor_type\\":\\"edit_gameplay\\",\\"anchor_key\\":\\"subtitle_recognition\\",\\"anchor_name\\":\\"capcut_app\\"}","new_anchor_type":"edit_gameplay"}',
    //     },
    //     trends_infos: null,
    //     component_control: {
    //       data_source_url: "/aweme/v1/web/aweme/post/",
    //     },
    //     anchors: null,
    //     hybrid_label: null,
    //     geofencing_regions: null,
    //     is_moment_story: 0,
    //     video_share_edit_status: 0,
    //     is_story: 0,
    //     aweme_type_tags: "",
    //     mark_largely_following: false,
    //     douplus_user_type: 0,
    //     cover_labels: null,
    //     entertainment_video_paid_way: {
    //       paid_ways: [],
    //       paid_type: 0,
    //       enable_use_new_ent_data: false,
    //     },
    //     chapter_bar_color: null,
    //     guide_btn_type: 0,
    //     shoot_way: "direct_shoot",
    //     is_24_story: 0,
    //     images: null,
    //     relation_labels: null,
    //     horizontal_type: 1,
    //     trends_event_track: "{}",
    //     impression_data: {
    //       group_id_list_a: [],
    //       group_id_list_b: [],
    //       similar_id_list_a: null,
    //       similar_id_list_b: null,
    //       group_id_list_c: [],
    //       group_id_list_d: [],
    //     },
    //     origin_duet_resource_uri: "",
    //     xigua_base_info: {
    //       status: 0,
    //       star_altar_order_id: 0,
    //       star_altar_type: 0,
    //       item_id: 0,
    //     },
    //     libfinsert_task_id: "",
    //     social_tag_list: null,
    //     suggest_words: {
    //       suggest_words: [
    //         {
    //           words: [
    //             {
    //               word: "菠萝咒喊麦歌词",
    //               word_id: "6650346552726394119",
    //               info: '{"End":0,"Start":0,"ecpm_boost_tag":false,"log_pb":"","qrec_for_search":"{\\"search_result_scores\\":\\"{\\\\\\"search_result_click\\\\\\":-10000.0,\\\\\\"search_video_play\\\\\\":-10000.0,\\\\\\"search_duration_time\\\\\\":-10000.0,\\\\\\"search_change_query\\\\\\":-10000.0}\\"}"}',
    //             },
    //             {
    //               word: "菠萝咒原版女生",
    //               word_id: "7107093515965207846",
    //               info: '{"End":0,"Start":0,"ecpm_boost_tag":false,"log_pb":"","qrec_for_search":"{\\"search_result_scores\\":\\"{\\\\\\"search_result_click\\\\\\":-10000.0,\\\\\\"search_video_play\\\\\\":-10000.0,\\\\\\"search_duration_time\\\\\\":-10000.0,\\\\\\"search_change_query\\\\\\":-10000.0}\\"}"}',
    //             },
    //             {
    //               word: "菠萝咒喊麦带歌词",
    //               word_id: "6797470456430466312",
    //               info: '{"End":0,"Start":0,"ecpm_boost_tag":false,"log_pb":"","qrec_for_search":"{\\"search_result_scores\\":\\"{\\\\\\"search_result_click\\\\\\":-10000.0,\\\\\\"search_video_play\\\\\\":-10000.0,\\\\\\"search_duration_time\\\\\\":-10000.0,\\\\\\"search_change_query\\\\\\":-10000.0}\\"}"}',
    //             },
    //             {
    //               word: "菠萝咒dj版",
    //               word_id: "6614023516419265806",
    //               info: '{"End":0,"Start":0,"ecpm_boost_tag":false,"log_pb":"","qrec_for_search":"{\\"search_result_scores\\":\\"{\\\\\\"search_result_click\\\\\\":-10000.0,\\\\\\"search_video_play\\\\\\":-10000.0,\\\\\\"search_duration_time\\\\\\":-10000.0,\\\\\\"search_change_query\\\\\\":-10000.0}\\"}"}',
    //             },
    //             {
    //               word: "大菠萝喊麦伴奏",
    //               word_id: "6860724982813578503",
    //               info: '{"End":0,"Start":0,"ecpm_boost_tag":false,"log_pb":"","qrec_for_search":"{\\"search_result_scores\\":\\"{\\\\\\"search_result_click\\\\\\":-10000.0,\\\\\\"search_video_play\\\\\\":-10000.0,\\\\\\"search_duration_time\\\\\\":-10000.0,\\\\\\"search_change_query\\\\\\":-10000.0}\\"}"}',
    //             },
    //             {
    //               word: "菠萝咒音乐简介",
    //               word_id: "7160656053150078220",
    //               info: '{"End":0,"Start":0,"ecpm_boost_tag":false,"log_pb":"","qrec_for_search":"{\\"search_result_scores\\":\\"{\\\\\\"search_result_click\\\\\\":-10000.0,\\\\\\"search_video_play\\\\\\":-10000.0,\\\\\\"search_duration_time\\\\\\":-10000.0,\\\\\\"search_change_query\\\\\\":-10000.0}\\"}"}',
    //             },
    //             {
    //               word: "大菠萝喊麦原唱",
    //               word_id: "6749794198884455692",
    //               info: '{"End":0,"Start":0,"ecpm_boost_tag":false,"log_pb":"","qrec_for_search":"{\\"search_result_scores\\":\\"{\\\\\\"search_result_click\\\\\\":-10000.0,\\\\\\"search_video_play\\\\\\":-10000.0,\\\\\\"search_duration_time\\\\\\":-10000.0,\\\\\\"search_change_query\\\\\\":-10000.0}\\"}"}',
    //             },
    //             {
    //               word: "菠萝咒百科",
    //               word_id: "6968987832728229133",
    //               info: '{"End":0,"Start":0,"ecpm_boost_tag":false,"log_pb":"","qrec_for_search":"{\\"search_result_scores\\":\\"{\\\\\\"search_result_click\\\\\\":-10000.0,\\\\\\"search_video_play\\\\\\":-10000.0,\\\\\\"search_duration_time\\\\\\":-10000.0,\\\\\\"search_change_query\\\\\\":-10000.0}\\"}"}',
    //             },
    //           ],
    //           scene: "comment_top_rec",
    //           icon_url: "",
    //           hint_text: "大家都在搜：",
    //           extra_info: '{"resp_from":"hit_cache"}',
    //         },
    //         {
    //           words: [
    //             {
    //               word: "菠萝咒喊麦歌词",
    //               word_id: "6650346552726394119",
    //               info: '{"End":0,"Start":0,"ecpm_boost_tag":false,"log_pb":"","qrec_for_search":"{\\"search_result_scores\\":\\"{\\\\\\"search_result_click\\\\\\":-10000.0,\\\\\\"search_video_play\\\\\\":-10000.0,\\\\\\"search_duration_time\\\\\\":-10000.0,\\\\\\"search_change_query\\\\\\":-10000.0}\\"}"}',
    //             },
    //           ],
    //           scene: "detail_inbox_rex",
    //           icon_url: "",
    //           hint_text: "",
    //           extra_info: '{"resp_from":"hit_cache"}',
    //         },
    //       ],
    //     },
    //     show_follow_button: {},
    //     duet_aggregate_in_music_tab: false,
    //     is_duet_sing: false,
    //     comment_permission_info: {
    //       comment_permission_status: 0,
    //       can_comment: true,
    //       item_detail_entry: false,
    //       press_entry: false,
    //       toast_guide: false,
    //     },
    //     original_images: null,
    //     series_paid_info: {
    //       series_paid_status: 0,
    //       item_price: 0,
    //     },
    //     img_bitrate: null,
    //     comment_gid: 7525321412706455000,
    //     image_album_music_info: {
    //       begin_time: -1,
    //       end_time: -1,
    //       volume: -1,
    //     },
    //     video_tag: [
    //       {
    //         tag_id: 2029,
    //         tag_name: "随拍",
    //         level: 1,
    //       },
    //       {
    //         tag_id: 2029003,
    //         tag_name: "生活记录",
    //         level: 2,
    //       },
    //       {
    //         tag_id: 2029003001,
    //         tag_name: "日常vlog",
    //         level: 3,
    //       },
    //     ],
    //     is_collects_selected: 0,
    //     chapter_list: null,
    //     feed_comment_config: {
    //       input_config_text: "善语结善缘，恶言伤人心",
    //       author_audit_status: 0,
    //       common_flags:
    //         '{"item_author_nickname":"藤椒很麻呀²³⁵⁸ 🌶️","video_labels_v2_tag1":"音乐","video_labels_v2_tag2":"音乐演唱"}',
    //     },
    //     is_image_beat: false,
    //     dislike_dimension_list: null,
    //     standard_bar_info_list: null,
    //     photo_search_entrance: {
    //       ecom_type: 0,
    //     },
    //     danmaku_control: {
    //       enable_danmaku: true,
    //       post_privilege_level: 0,
    //       is_post_denied: false,
    //       post_denied_reason: "",
    //       skip_danmaku: false,
    //       danmaku_cnt: 134,
    //       activities: [
    //         {
    //           id: 1224,
    //           type: 1,
    //         },
    //       ],
    //       pass_through_params: "{}",
    //       smart_mode_decision: 0,
    //       first_danmaku_offset: 601,
    //       last_danmaku_offset: 22340,
    //     },
    //     is_life_item: false,
    //     image_list: null,
    //     component_info_v2: '{"desc_lines_limit":0,"hide_marquee":false}',
    //     item_warn_notification: {
    //       type: 0,
    //       show: false,
    //       content: "",
    //     },
    //     origin_text_extra: null,
    //     disable_relation_bar: 0,
    //     packed_clips: null,
    //     author_mask_tag: 0,
    //     user_recommend_status: 1,
    //     collection_corner_mark: 0,
    //     is_share_post: false,
    //     image_comment: {},
    //     visual_search_info: {
    //       is_show_img_entrance: false,
    //       is_ecom_img: false,
    //       is_high_accuracy_ecom: false,
    //       is_high_recall_ecom: false,
    //     },
    //     tts_id_list: null,
    //     ref_tts_id_list: null,
    //     voice_modify_id_list: null,
    //     ref_voice_modify_id_list: null,
    //     authentication_token:
    //       "MS4wLjAAAAAARB3Q8YFOCpyfkb_h5FtPDU7K9z8flFESj8kN49fSvbh0zb98X-XeZDu-v6vqSMyHL900mevrOl1p7wpAhgI2wdGUaIx4T0dJxmxbX5JLu1J4sEI58AjQfVPzrSoRJiPU2Xslwq9vszO3xGTgfjHK2bEoOnzxaGIcusvyHx4Eux6L1pZqema3QaVcopl4JfL3Ys1K77eviXOAznFutYv4__fdgp_PHoYnMEqvpPweCKLIua8Qr7_HjxV_D7hnu2NDSy-Im0MBhTbecjvUa85N4g",
    //     video_game_data_channel_config: {},
    //     dislike_dimension_list_v2: null,
    //     distribute_circle: {
    //       distribute_type: 0,
    //       campus_block_interaction: false,
    //       is_campus: false,
    //     },
    //     image_crop_ctrl: 0,
    //     yumme_recreason: null,
    //     slides_music_beats: null,
    //     jump_tab_info_list: null,
    //     media_type: 4,
    //     play_progress: {
    //       play_progress: 0,
    //       last_modified_time: 0,
    //     },
    //     reply_smart_emojis: null,
    //     activity_video_type: 0,
    //     boost_status: 0,
    //     create_scale_type: null,
    //     entertainment_product_info: {
    //       sub_title: null,
    //       market_info: {
    //         limit_free: {
    //           in_free: false,
    //         },
    //         marketing_tag: null,
    //       },
    //     },
    //   },
    //   {
    //     aweme_id: "7496760665458953484",
    //     desc: "别人家的闺蜜：接你下班\n我家的闺蜜：接你出道",
    //     create_time: 1745475631,
    //     author: {
    //       uid: "888870295051540",
    //       card_entries: null,
    //       nickname: "藤椒很麻呀²³⁵⁸ 🌶️",
    //       ban_user_functions: null,
    //       avatar_schema_list: null,
    //       avatar_thumb: {
    //         uri: "100x100/aweme-avatar/douyin-user-image-file_4560639592011267deb384bdc7ebdc90",
    //         url_list: [
    //           "https://p3-pc.douyinpic.com/aweme/100x100/aweme-avatar/douyin-user-image-file_4560639592011267deb384bdc7ebdc90.jpeg?from=327834062",
    //         ],
    //         width: 720,
    //         height: 720,
    //       },
    //       profile_mob_params: null,
    //       personal_tag_list: null,
    //       follow_status: 0,
    //       follower_list_secondary_information_struct: null,
    //       identity_labels: null,
    //       endorsement_info_list: null,
    //       custom_verify: "",
    //       white_cover_url: null,
    //       im_role_ids: null,
    //       user_permissions: null,
    //       batch_unfollow_relation_desc: null,
    //       homepage_bottom_toast: null,
    //       share_info: {
    //         share_url: "",
    //         share_weibo_desc: "",
    //         share_desc: "",
    //         share_title: "",
    //         share_qrcode_url: {
    //           uri: "",
    //           url_list: [],
    //           width: 720,
    //           height: 720,
    //         },
    //         share_title_myself: "",
    //         share_title_other: "",
    //         share_desc_info: "",
    //       },
    //       sec_uid: "MS4wLjABAAAA250wWQH1y6yH9TFbYBQIoal2suwu_01R6sE-OPeWaXk",
    //       can_set_geofencing: null,
    //       link_item_list: null,
    //       enterprise_verify_reason: "",
    //       is_ad_fake: false,
    //       private_relation_list: null,
    //       card_entries_not_display: null,
    //       batch_unfollow_contain_tabs: null,
    //       verification_permission_ids: null,
    //       card_sort_priority: null,
    //       risk_notice_text: "",
    //       display_info: null,
    //       prevent_download: false,
    //       contrail_list: null,
    //       need_points: null,
    //       not_seen_item_id_list: null,
    //       follower_status: 0,
    //       special_people_labels: null,
    //       data_label_list: null,
    //       not_seen_item_id_list_v2: null,
    //       cover_url: [
    //         {
    //           uri: "c8510002be9a3a61aad2",
    //           url_list: [
    //             "https://p3-pc-sign.douyinpic.com/obj/c8510002be9a3a61aad2?lk3s=138a59ce&x-expires=1755568800&x-signature=zjtpTDaJ%2F%2FBD0y4xaOOVtxXUpvw%3D&from=327834062",
    //             "https://p9-pc-sign.douyinpic.com/obj/c8510002be9a3a61aad2?lk3s=138a59ce&x-expires=1755568800&x-signature=9e4lchR%2BrJTb2P39GcWffojuB5U%3D&from=327834062",
    //           ],
    //           width: 720,
    //           height: 720,
    //         },
    //       ],
    //       offline_info_list: null,
    //       signature_extra: null,
    //       text_extra: null,
    //       interest_tags: null,
    //       cf_list: null,
    //       user_tags: null,
    //       account_cert_info: '{"is_biz_account":1}',
    //       familiar_visitor_user: null,
    //       creator_tag_list: null,
    //     },
    //     music: {
    //       id: 7496760638081928000,
    //       id_str: "7496760638081927946",
    //       title: "@藤椒很麻呀²³⁵⁸ 🌶️创作的原声",
    //       author: "藤椒很麻呀²³⁵⁸ 🌶️",
    //       album: "",
    //       cover_hd: {
    //         uri: "1080x1080/aweme-avatar/douyin-user-image-file_4560639592011267deb384bdc7ebdc90",
    //         url_list: [
    //           "https://p3-pc.douyinpic.com/aweme/1080x1080/aweme-avatar/douyin-user-image-file_4560639592011267deb384bdc7ebdc90.jpeg?from=327834062",
    //         ],
    //         width: 720,
    //         height: 720,
    //       },
    //       cover_large: {
    //         uri: "1080x1080/aweme-avatar/douyin-user-image-file_4560639592011267deb384bdc7ebdc90",
    //         url_list: [
    //           "https://p3-pc.douyinpic.com/aweme/1080x1080/aweme-avatar/douyin-user-image-file_4560639592011267deb384bdc7ebdc90.jpeg?from=327834062",
    //         ],
    //         width: 720,
    //         height: 720,
    //       },
    //       cover_medium: {
    //         uri: "720x720/aweme-avatar/douyin-user-image-file_4560639592011267deb384bdc7ebdc90",
    //         url_list: [
    //           "https://p3-pc.douyinpic.com/aweme/720x720/aweme-avatar/douyin-user-image-file_4560639592011267deb384bdc7ebdc90.jpeg?from=327834062",
    //         ],
    //         width: 720,
    //         height: 720,
    //       },
    //       cover_thumb: {
    //         uri: "100x100/aweme-avatar/douyin-user-image-file_4560639592011267deb384bdc7ebdc90",
    //         url_list: [
    //           "https://p3-pc.douyinpic.com/aweme/100x100/aweme-avatar/douyin-user-image-file_4560639592011267deb384bdc7ebdc90.jpeg?from=327834062",
    //         ],
    //         width: 720,
    //         height: 720,
    //       },
    //       play_url: {
    //         uri: "https://sf5-hl-cdn-tos.douyinstatic.com/obj/ies-music/7496760719058946853.mp3",
    //         url_list: [
    //           "https://sf5-hl-cdn-tos.douyinstatic.com/obj/ies-music/7496760719058946853.mp3",
    //           "https://sf6-cdn-tos.douyinstatic.com/obj/ies-music/7496760719058946853.mp3",
    //         ],
    //         width: 720,
    //         height: 720,
    //         url_key: "7496760638081927946",
    //       },
    //       schema_url: "",
    //       source_platform: 23,
    //       start_time: 0,
    //       end_time: 0,
    //       duration: 25,
    //       extra:
    //         '{"aed_music_score":0.31,"aed_singing_score":0.4,"aggregate_exempt_conf":[],"beats":{},"cover_colors":null,"douyin_beats_info":{},"dsp_switch":0,"extract_item_id":7496760665458953484,"has_edited":0,"hit_high_follow_auto":false,"hit_high_follow_extend":false,"hit_high_follow_original":false,"hotsoon_review_time":-1,"is_aed_music":1,"is_high_follow_user":false,"is_red":0,"is_subsidy_exp":false,"music_label_id":null,"music_tagging":{"AEDs":null,"Genres":null,"Instruments":null,"Languages":null,"Moods":null,"SingingVersions":null,"Themes":null},"review_unshelve_reason":0,"reviewed":0,"schedule_search_time":0,"uniqa_speech_score":0.49,"with_aed_model":1}',
    //       user_count: 0,
    //       position: null,
    //       collect_stat: 0,
    //       status: 1,
    //       offline_desc: "",
    //       owner_id: "888870295051540",
    //       owner_nickname: "藤椒很麻呀²³⁵⁸ 🌶️",
    //       is_original: false,
    //       mid: "7496760638081927946",
    //       binded_challenge_id: 0,
    //       redirect: false,
    //       is_restricted: false,
    //       author_deleted: false,
    //       is_del_video: false,
    //       is_video_self_see: false,
    //       owner_handle: "75559455j",
    //       author_position: null,
    //       prevent_download: false,
    //       unshelve_countries: null,
    //       prevent_item_download_status: 0,
    //       external_song_info: [],
    //       sec_uid: "MS4wLjABAAAA250wWQH1y6yH9TFbYBQIoal2suwu_01R6sE-OPeWaXk",
    //       avatar_thumb: {
    //         uri: "100x100/aweme-avatar/douyin-user-image-file_4560639592011267deb384bdc7ebdc90",
    //         url_list: [
    //           "https://p3-pc.douyinpic.com/aweme/100x100/aweme-avatar/douyin-user-image-file_4560639592011267deb384bdc7ebdc90.jpeg?from=327834062",
    //         ],
    //         width: 720,
    //         height: 720,
    //       },
    //       avatar_medium: {
    //         uri: "720x720/aweme-avatar/douyin-user-image-file_4560639592011267deb384bdc7ebdc90",
    //         url_list: [
    //           "https://p3-pc.douyinpic.com/aweme/720x720/aweme-avatar/douyin-user-image-file_4560639592011267deb384bdc7ebdc90.jpeg?from=327834062",
    //         ],
    //         width: 720,
    //         height: 720,
    //       },
    //       avatar_large: {
    //         uri: "1080x1080/aweme-avatar/douyin-user-image-file_4560639592011267deb384bdc7ebdc90",
    //         url_list: [
    //           "https://p3-pc.douyinpic.com/aweme/1080x1080/aweme-avatar/douyin-user-image-file_4560639592011267deb384bdc7ebdc90.jpeg?from=327834062",
    //         ],
    //         width: 720,
    //         height: 720,
    //       },
    //       preview_start_time: 0,
    //       preview_end_time: 0,
    //       is_commerce_music: false,
    //       is_original_sound: true,
    //       audition_duration: 25,
    //       shoot_duration: 25,
    //       reason_type: 0,
    //       artists: [],
    //       lyric_short_position: null,
    //       mute_share: false,
    //       tag_list: null,
    //       dmv_auto_show: false,
    //       is_pgc: false,
    //       is_matched_metadata: false,
    //       is_audio_url_with_cookie: false,
    //       music_chart_ranks: null,
    //       can_background_play: true,
    //       music_status: 1,
    //       video_duration: 25,
    //       pgc_music_type: 2,
    //       author_status: 1,
    //       search_impr: {
    //         entity_id: "7496760638081927946",
    //       },
    //       artist_user_infos: null,
    //       dsp_status: 10,
    //       musician_user_infos: null,
    //       music_collect_count: 0,
    //       music_cover_atmosphere_color_value: "",
    //       show_origin_clip: false,
    //     },
    //     select_anchor_expanded_content: 0,
    //     video: {
    //       play_addr: {
    //         uri: "v0300fg10000d04tg3vog65lcfki63mg",
    //         url_list: [
    //           "https://v95-web-sz.douyinvod.com/ddb8a7913bd85e12cc81255d68885723/68919a1e/video/tos/cn/tos-cn-ve-15/ooPaqFB9DDoICJAgKgZ9ArnGQfHPxWAESaIfdg/?a=6383&ch=10010&cr=3&dr=0&lr=all&cd=0%7C0%7C0%7C3&cv=1&br=4097&bt=4097&cs=0&ds=4&ft=GZnU0RqeffPdXP~ka1jNvAq-antLjrKYyVmCRkaml6C9UjVhWL6&mime_type=video_mp4&qs=0&rc=ZjQ0NDhpODUzZzdpMzw6OEBpajZsaW85cjZ3MzMzNGkzM0AwLzAxMjBjNjExLzEtYjJiYSNqM2hgMmRzZDFhLS1kLTBzcw%3D%3D&btag=c0000e00010000&cquery=100x_100z_100o_101r_100B&dy_q=1754361813&feature_id=136e8d81b95d650c236697554379e663&l=20250805104332288948511D5931AF76A4",
    //           "https://v3-web.douyinvod.com/7141968aa7311f84b8293df587977b2c/68919a1e/video/tos/cn/tos-cn-ve-15/ooPaqFB9DDoICJAgKgZ9ArnGQfHPxWAESaIfdg/?a=6383&ch=10010&cr=3&dr=0&lr=all&cd=0%7C0%7C0%7C3&cv=1&br=4097&bt=4097&cs=0&ds=4&ft=GZnU0RqeffPdXP~ka1jNvAq-antLjrKYyVmCRkaml6C9UjVhWL6&mime_type=video_mp4&qs=0&rc=ZjQ0NDhpODUzZzdpMzw6OEBpajZsaW85cjZ3MzMzNGkzM0AwLzAxMjBjNjExLzEtYjJiYSNqM2hgMmRzZDFhLS1kLTBzcw%3D%3D&btag=c0000e00010000&cquery=100o_101r_100B_100x_100z&dy_q=1754361813&feature_id=136e8d81b95d650c236697554379e663&l=20250805104332288948511D5931AF76A4",
    //           "https://www.douyin.com/aweme/v1/play/?video_id=v0300fg10000d04tg3vog65lcfki63mg&line=0&file_id=e557e9004f244d4092f53f554131213c&sign=9dc37edb06c0e0692b8ea276b22a6886&is_play_url=1&source=PackSourceEnum_PUBLISH",
    //         ],
    //         width: 1920,
    //         height: 1080,
    //         url_key: "v0300fg10000d04tg3vog65lcfki63mg_h264_1080p_4195419",
    //         data_size: 13617807,
    //         file_hash: "9dc37edb06c0e0692b8ea276b22a6886",
    //         file_cs:
    //           "c:0-44132-8874|d:0-6808902-19db,6808903-13617806-7fb5|a:v0300fg10000d04tg3vog65lcfki63mg",
    //       },
    //       cover: {
    //         uri: "tos-cn-p-0015/ocHfdFg5ACj97DqDIt2APxZkAVEACo2DgFBJEe",
    //         url_list: [
    //           "https://p3-pc-sign.douyinpic.com/tos-cn-p-0015/ocHfdFg5ACj97DqDIt2APxZkAVEACo2DgFBJEe~tplv-dy-cropcenter:323:430.jpeg?lk3s=138a59ce&x-expires=2069719200&x-signature=Wm5G7mgMphCZgilPxXWKinExvlU%3D&from=327834062&s=PackSourceEnum_PUBLISH&se=true&sh=323_430&sc=cover&biz_tag=pcweb_cover&l=20250805104332288948511D5931AF76A4",
    //           "https://p3-pc-sign.douyinpic.com/obj/tos-cn-p-0015/ocHfdFg5ACj97DqDIt2APxZkAVEACo2DgFBJEe?lk3s=138a59ce&x-expires=2069719200&x-signature=fjJbVvfk5MayIV1ZotQ1tQ0tzuM%3D&from=327834062&s=PackSourceEnum_PUBLISH&se=false&sc=cover&biz_tag=pcweb_cover&l=20250805104332288948511D5931AF76A4",
    //           "https://p9-pc-sign.douyinpic.com/obj/tos-cn-p-0015/ocHfdFg5ACj97DqDIt2APxZkAVEACo2DgFBJEe?lk3s=138a59ce&x-expires=2069719200&x-signature=9WlGm4jo9lDo%2BeQbT%2FpUn6Awi90%3D&from=327834062&s=PackSourceEnum_PUBLISH&se=false&sc=cover&biz_tag=pcweb_cover&l=20250805104332288948511D5931AF76A4",
    //         ],
    //         width: 720,
    //         height: 720,
    //       },
    //       height: 2160,
    //       width: 3840,
    //       dynamic_cover: {
    //         uri: "tos-cn-p-0015/oUIJIBAv92kCAjDoxFgxfD4etgqAPEigDjdDBl",
    //         url_list: [
    //           "https://p3-pc-sign.douyinpic.com/obj/tos-cn-p-0015/oUIJIBAv92kCAjDoxFgxfD4etgqAPEigDjdDBl?lk3s=138a59ce&x-expires=1755568800&x-signature=CILjIm8cgd4ZTcaOef5YBhU7R28%3D&from=327834062_large&s=PackSourceEnum_PUBLISH&se=false&sc=dynamic_cover&biz_tag=pcweb_cover&l=20250805104332288948511D5931AF76A4",
    //           "https://p9-pc-sign.douyinpic.com/obj/tos-cn-p-0015/oUIJIBAv92kCAjDoxFgxfD4etgqAPEigDjdDBl?lk3s=138a59ce&x-expires=1755568800&x-signature=mrwKP%2BEJbigc%2FllPMToLBUd4x6U%3D&from=327834062_large&s=PackSourceEnum_PUBLISH&se=false&sc=dynamic_cover&biz_tag=pcweb_cover&l=20250805104332288948511D5931AF76A4",
    //         ],
    //         width: 720,
    //         height: 720,
    //       },
    //       origin_cover: {
    //         uri: "tos-cn-p-0015/o8xeI8BoAgcIa09tqE8DfBDAJPRDCFqgdDj2kA",
    //         url_list: [
    //           "https://p3-pc-sign.douyinpic.com/tos-cn-p-0015/o8xeI8BoAgcIa09tqE8DfBDAJPRDCFqgdDj2kA~tplv-dy-360p.jpeg?lk3s=138a59ce&x-expires=1755568800&x-signature=St7BAGp0%2BB9tvYeSjn3V14BTP0E%3D&from=327834062&s=PackSourceEnum_PUBLISH&se=false&sc=origin_cover&biz_tag=pcweb_cover&l=20250805104332288948511D5931AF76A4",
    //           "https://p9-pc-sign.douyinpic.com/tos-cn-p-0015/o8xeI8BoAgcIa09tqE8DfBDAJPRDCFqgdDj2kA~tplv-dy-360p.jpeg?lk3s=138a59ce&x-expires=1755568800&x-signature=yR8VhrgiC0dWmsbIhD1RP%2FlBkok%3D&from=327834062&s=PackSourceEnum_PUBLISH&se=false&sc=origin_cover&biz_tag=pcweb_cover&l=20250805104332288948511D5931AF76A4",
    //         ],
    //         width: 640,
    //         height: 360,
    //       },
    //       ratio: "1080p",
    //       format: "mp4",
    //       meta: '{"enable_manual_ladder":"1","format":"mp4","gear_vqm":"{\\"1080p_720p\\":2,\\"720p_540p\\":2}","hrids":"500000008","is_spatial_video":"0","isad":"0","loudness":"-16.7","peak":"0.66834","qprf":"1.000","sdgs":"[\\"adapt_lowest_4_1\\",\\"normal_1080_0\\",\\"normal_720_0\\",\\"normal_540_0\\",\\"adapt_lowest_1440_1\\",\\"low_720_0\\",\\"low_540_0\\",\\"lower_540_0\\",\\"1080_1_1\\",\\"720_1_1\\",\\"adapt_low_540_0\\",\\"720_2_1\\",\\"540_2_1\\",\\"540_3_1\\",\\"540_4_1\\"]","sr_potential":"{\\"v1.0\\":{\\"score\\":61.901}}","sr_score":"1.000","strategy_tokens":"[\\"ladder_group_remove_1080_1_night_peak\\",\\"strategy_iteration_model_ab02_0117\\",\\"strategy_iteration_model_ab01_0117\\"]","title_info":"{\\"bottom_res_add\\":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],\\"bullet_zone\\":0,\\"progress_bar\\":[0,0,0],\\"ratio_br_l\\":[0,0,0,0,0,0],\\"ratio_edge_l\\":[0,0,0,0,0,0],\\"std_br_l\\":[0,0,0,0,0,0],\\"top_res_add\\":[0,0,0,0,0,0,0],\\"version\\":\\"v1.0\\"}","volume_info":"{\\"MaximumShortTermLoudness\\":-13.4,\\"Peak\\":0.66834,\\"Version\\":2,\\"MaximumMomentaryLoudness\\":-9.1,\\"Loudness\\":-16.7,\\"LoudnessRange\\":7.4,\\"LoudnessRangeEnd\\":-14,\\"LoudnessRangeStart\\":-21.4}","vqs_origin":"51.58"}',
    //       is_source_HDR: 0,
    //       bit_rate: [
    //         {
    //           gear_name: "adapt_lowest_4_1",
    //           quality_type: 72,
    //           bit_rate: 4369110,
    //           play_addr: {
    //             uri: "v0300fg10000d04tg3vog65lcfki63mg",
    //             url_list: [
    //               "https://v95-web-sz.douyinvod.com/7ffbde69d20cfd0fb881331f49c890b8/68919a1e/video/tos/cn/tos-cn-ve-15/o4gxqAf9DCIgaQ9IAPgJQGFEaPbHDoVUDoAdBf/?a=6383&ch=10010&cr=3&dr=0&lr=all&cd=0%7C0%7C0%7C3&cv=1&br=4266&bt=4266&cs=2&ds=10&ft=GZnU0RqeffPdXP~ka1jNvAq-antLjrKYyVmCRkaml6C9UjVhWL6&mime_type=video_mp4&qs=15&rc=OzYzNDVoPDk6ZTY2NDs4OEBpajZsaW85cjZ3MzMzNGkzM0AyXjE2LS5fNWExNC5hLi9gYSNqM2hgMmRzZDFhLS1kLTBzcw%3D%3D&btag=c0000e00010000&cquery=100z_100o_101r_100B_100x&dy_q=1754361813&feature_id=10cf95ef75b4f3e7eac623e4ea0ea691&l=20250805104332288948511D5931AF76A4",
    //               "https://v3-web.douyinvod.com/344826f6b1ee58c3622d00bdb1f9ba99/68919a1e/video/tos/cn/tos-cn-ve-15/o4gxqAf9DCIgaQ9IAPgJQGFEaPbHDoVUDoAdBf/?a=6383&ch=10010&cr=3&dr=0&lr=all&cd=0%7C0%7C0%7C3&cv=1&br=4266&bt=4266&cs=2&ds=10&ft=GZnU0RqeffPdXP~ka1jNvAq-antLjrKYyVmCRkaml6C9UjVhWL6&mime_type=video_mp4&qs=15&rc=OzYzNDVoPDk6ZTY2NDs4OEBpajZsaW85cjZ3MzMzNGkzM0AyXjE2LS5fNWExNC5hLi9gYSNqM2hgMmRzZDFhLS1kLTBzcw%3D%3D&btag=c0000e00010000&cquery=100x_100z_100o_101r_100B&dy_q=1754361813&feature_id=10cf95ef75b4f3e7eac623e4ea0ea691&l=20250805104332288948511D5931AF76A4",
    //               "https://www.douyin.com/aweme/v1/play/?video_id=v0300fg10000d04tg3vog65lcfki63mg&line=0&file_id=c52518d113734bd786b91e029140a358&sign=e78fc3691ac45a7cb241c292fed1c313&is_play_url=1&source=PackSourceEnum_PUBLISH",
    //             ],
    //             width: 3840,
    //             height: 2160,
    //             url_key: "v0300fg10000d04tg3vog65lcfki63mg_bytevc1_4k_4369110",
    //             data_size: 14181586,
    //             file_hash: "e78fc3691ac45a7cb241c292fed1c313",
    //             file_cs:
    //               "c:0-29985-754b|d:0-7090792-ce47,7090793-14181585-3086|a:v0300fg10000d04tg3vog65lcfki63mg",
    //           },
    //           is_h265: 1,
    //           is_bytevc1: 1,
    //           HDR_type: "",
    //           HDR_bit: "",
    //           FPS: 60,
    //           video_extra:
    //             '{"PktOffsetMap":"[{\\"time\\": 1, \\"offset\\": 574206}, {\\"time\\": 2, \\"offset\\": 1035769}, {\\"time\\": 3, \\"offset\\": 1579512}, {\\"time\\": 4, \\"offset\\": 2097422}, {\\"time\\": 5, \\"offset\\": 2743702}, {\\"time\\": 10, \\"offset\\": 5448023}]","format":"mp4","definition":"4k","quality":"adapt_lowest","file_id":"c52518d113734bd786b91e029140a358","applog_map":{"feature_id":"10cf95ef75b4f3e7eac623e4ea0ea691"},"mvmaf":"{\\"mvmaf_sr_v1080\\":-1,\\"mvmaf_sr_v960\\":-1,\\"mvmaf_sr_v864\\":-1,\\"mvmaf_sr_v720\\":-1,\\"mvmaf_ori_v1080\\":94.238,\\"mvmaf_ori_v960\\":95.445,\\"mvmaf_ori_v864\\":96.291,\\"mvmaf_ori_v720\\":97.44}","audio_channels":"2.0","audio_sample_rate":"44100"}',
    //           format: "mp4",
    //         },
    //         {
    //           gear_name: "normal_1080_0",
    //           quality_type: 1,
    //           bit_rate: 4195419,
    //           play_addr: {
    //             uri: "v0300fg10000d04tg3vog65lcfki63mg",
    //             url_list: [
    //               "https://v95-web-sz.douyinvod.com/ddb8a7913bd85e12cc81255d68885723/68919a1e/video/tos/cn/tos-cn-ve-15/ooPaqFB9DDoICJAgKgZ9ArnGQfHPxWAESaIfdg/?a=6383&ch=10010&cr=3&dr=0&lr=all&cd=0%7C0%7C0%7C3&cv=1&br=4097&bt=4097&cs=0&ds=4&ft=GZnU0RqeffPdXP~ka1jNvAq-antLjrKYyVmCRkaml6C9UjVhWL6&mime_type=video_mp4&qs=0&rc=ZjQ0NDhpODUzZzdpMzw6OEBpajZsaW85cjZ3MzMzNGkzM0AwLzAxMjBjNjExLzEtYjJiYSNqM2hgMmRzZDFhLS1kLTBzcw%3D%3D&btag=c0000e00010000&cquery=100x_100z_100o_101r_100B&dy_q=1754361813&feature_id=136e8d81b95d650c236697554379e663&l=20250805104332288948511D5931AF76A4",
    //               "https://v3-web.douyinvod.com/7141968aa7311f84b8293df587977b2c/68919a1e/video/tos/cn/tos-cn-ve-15/ooPaqFB9DDoICJAgKgZ9ArnGQfHPxWAESaIfdg/?a=6383&ch=10010&cr=3&dr=0&lr=all&cd=0%7C0%7C0%7C3&cv=1&br=4097&bt=4097&cs=0&ds=4&ft=GZnU0RqeffPdXP~ka1jNvAq-antLjrKYyVmCRkaml6C9UjVhWL6&mime_type=video_mp4&qs=0&rc=ZjQ0NDhpODUzZzdpMzw6OEBpajZsaW85cjZ3MzMzNGkzM0AwLzAxMjBjNjExLzEtYjJiYSNqM2hgMmRzZDFhLS1kLTBzcw%3D%3D&btag=c0000e00010000&cquery=100o_101r_100B_100x_100z&dy_q=1754361813&feature_id=136e8d81b95d650c236697554379e663&l=20250805104332288948511D5931AF76A4",
    //               "https://www.douyin.com/aweme/v1/play/?video_id=v0300fg10000d04tg3vog65lcfki63mg&line=0&file_id=e557e9004f244d4092f53f554131213c&sign=9dc37edb06c0e0692b8ea276b22a6886&is_play_url=1&source=PackSourceEnum_PUBLISH",
    //             ],
    //             width: 1920,
    //             height: 1080,
    //             url_key: "v0300fg10000d04tg3vog65lcfki63mg_h264_1080p_4195419",
    //             data_size: 13617807,
    //             file_hash: "9dc37edb06c0e0692b8ea276b22a6886",
    //             file_cs:
    //               "c:0-44132-8874|d:0-6808902-19db,6808903-13617806-7fb5|a:v0300fg10000d04tg3vog65lcfki63mg",
    //           },
    //           is_h265: 0,
    //           is_bytevc1: 0,
    //           HDR_type: "",
    //           HDR_bit: "",
    //           FPS: 60,
    //           video_extra:
    //             '{"PktOffsetMap":"","format":"mp4","definition":"1080p","quality":"normal","file_id":"e557e9004f244d4092f53f554131213c","applog_map":{"feature_id":"136e8d81b95d650c236697554379e663"},"audio_channels":"2.0","audio_sample_rate":"44100"}',
    //           format: "mp4",
    //         },
    //         {
    //           gear_name: "normal_720_0",
    //           quality_type: 10,
    //           bit_rate: 3168600,
    //           play_addr: {
    //             uri: "v0300fg10000d04tg3vog65lcfki63mg",
    //             url_list: [
    //               "https://v95-web-sz.douyinvod.com/6cf0f80c689d8bb500c32c4b7b7f1c30/68919a1e/video/tos/cn/tos-cn-ve-15/oMKAMEtDgDJBkgjFfzo9AQAqIxPemCEsdPFshD/?a=6383&ch=10010&cr=3&dr=0&lr=all&cd=0%7C0%7C0%7C3&cv=1&br=3094&bt=3094&cs=0&ds=3&ft=GZnU0RqeffPdXP~ka1jNvAq-antLjrKYyVmCRkaml6C9UjVhWL6&mime_type=video_mp4&qs=0&rc=ZWU3aWQ4NDc1ZjM5ZWc6ZkBpajZsaW85cjZ3MzMzNGkzM0A0MGAyNDUvNS4xNl9jXl80YSNqM2hgMmRzZDFhLS1kLTBzcw%3D%3D&btag=c0000e00010000&cquery=100x_100z_100o_101r_100B&dy_q=1754361813&feature_id=b1cb202f98cf51d95e455ae01e100ce9&l=20250805104332288948511D5931AF76A4",
    //               "https://v3-web.douyinvod.com/370cb70a828921a5eda696a88cac66a0/68919a1e/video/tos/cn/tos-cn-ve-15/oMKAMEtDgDJBkgjFfzo9AQAqIxPemCEsdPFshD/?a=6383&ch=10010&cr=3&dr=0&lr=all&cd=0%7C0%7C0%7C3&cv=1&br=3094&bt=3094&cs=0&ds=3&ft=GZnU0RqeffPdXP~ka1jNvAq-antLjrKYyVmCRkaml6C9UjVhWL6&mime_type=video_mp4&qs=0&rc=ZWU3aWQ4NDc1ZjM5ZWc6ZkBpajZsaW85cjZ3MzMzNGkzM0A0MGAyNDUvNS4xNl9jXl80YSNqM2hgMmRzZDFhLS1kLTBzcw%3D%3D&btag=c0000e00010000&cquery=100B_100x_100z_100o_101r&dy_q=1754361813&feature_id=b1cb202f98cf51d95e455ae01e100ce9&l=20250805104332288948511D5931AF76A4",
    //               "https://www.douyin.com/aweme/v1/play/?video_id=v0300fg10000d04tg3vog65lcfki63mg&line=0&file_id=7cb7adfbb6904c128421857a5fc43b7b&sign=6826b39e92266ce175ed8f670db0b6b7&is_play_url=1&source=PackSourceEnum_PUBLISH",
    //             ],
    //             width: 1280,
    //             height: 720,
    //             url_key: "v0300fg10000d04tg3vog65lcfki63mg_h264_720p_3168600",
    //             data_size: 10284880,
    //             file_hash: "6826b39e92266ce175ed8f670db0b6b7",
    //             file_cs:
    //               "c:0-44142-039c|d:0-5142439-c7dd,5142440-10284879-6821|a:v0300fg10000d04tg3vog65lcfki63mg",
    //           },
    //           is_h265: 0,
    //           is_bytevc1: 0,
    //           HDR_type: "",
    //           HDR_bit: "",
    //           FPS: 60,
    //           video_extra:
    //             '{"PktOffsetMap":"","format":"mp4","definition":"720p","quality":"normal","file_id":"7cb7adfbb6904c128421857a5fc43b7b","applog_map":{"feature_id":"b1cb202f98cf51d95e455ae01e100ce9"},"audio_channels":"2.0","audio_sample_rate":"44100"}',
    //           format: "mp4",
    //         },
    //         {
    //           gear_name: "normal_540_0",
    //           quality_type: 20,
    //           bit_rate: 2784555,
    //           play_addr: {
    //             uri: "v0300fg10000d04tg3vog65lcfki63mg",
    //             url_list: [
    //               "https://v95-web-sz.douyinvod.com/886da8db6a521a9154875aac27704803/68919a1e/video/tos/cn/tos-cn-ve-15/ooB6AKDCrFoIxAdQIoEDqlftEnQsggkeADPPj9/?a=6383&ch=10010&cr=3&dr=0&lr=all&cd=0%7C0%7C0%7C3&cv=1&br=2719&bt=2719&cs=0&ds=6&ft=GZnU0RqeffPdXP~ka1jNvAq-antLjrKYyVmCRkaml6C9UjVhWL6&mime_type=video_mp4&qs=0&rc=NGU5NzU5OTVlOTVlOjtmO0BpajZsaW85cjZ3MzMzNGkzM0BeYjVgMl8uX2ExMjU0MWA2YSNqM2hgMmRzZDFhLS1kLTBzcw%3D%3D&btag=c0000e00010000&cquery=100x_100z_100o_101r_100B&dy_q=1754361813&feature_id=136e8d81b95d650c236697554379e663&l=20250805104332288948511D5931AF76A4",
    //               "https://v3-web.douyinvod.com/609cffc127438ba7dd852441fcd833f4/68919a1e/video/tos/cn/tos-cn-ve-15/ooB6AKDCrFoIxAdQIoEDqlftEnQsggkeADPPj9/?a=6383&ch=10010&cr=3&dr=0&lr=all&cd=0%7C0%7C0%7C3&cv=1&br=2719&bt=2719&cs=0&ds=6&ft=GZnU0RqeffPdXP~ka1jNvAq-antLjrKYyVmCRkaml6C9UjVhWL6&mime_type=video_mp4&qs=0&rc=NGU5NzU5OTVlOTVlOjtmO0BpajZsaW85cjZ3MzMzNGkzM0BeYjVgMl8uX2ExMjU0MWA2YSNqM2hgMmRzZDFhLS1kLTBzcw%3D%3D&btag=c0000e00010000&cquery=101r_100B_100x_100z_100o&dy_q=1754361813&feature_id=136e8d81b95d650c236697554379e663&l=20250805104332288948511D5931AF76A4",
    //               "https://www.douyin.com/aweme/v1/play/?video_id=v0300fg10000d04tg3vog65lcfki63mg&line=0&file_id=98cc48778b5246dbb216b652c486eba1&sign=6f6cb5fdca4b9d7259a919a9be4647b8&is_play_url=1&source=PackSourceEnum_PUBLISH",
    //             ],
    //             width: 960,
    //             height: 540,
    //             url_key: "v0300fg10000d04tg3vog65lcfki63mg_h264_540p_2784555",
    //             data_size: 9038320,
    //             file_hash: "6f6cb5fdca4b9d7259a919a9be4647b8",
    //             file_cs:
    //               "c:0-44144-1e39|d:0-4519159-d09c,4519160-9038319-2712|a:v0300fg10000d04tg3vog65lcfki63mg",
    //           },
    //           is_h265: 0,
    //           is_bytevc1: 0,
    //           HDR_type: "",
    //           HDR_bit: "",
    //           FPS: 60,
    //           video_extra:
    //             '{"PktOffsetMap":"","format":"mp4","definition":"540p","quality":"normal","file_id":"98cc48778b5246dbb216b652c486eba1","applog_map":{"feature_id":"136e8d81b95d650c236697554379e663"},"audio_channels":"2.0","audio_sample_rate":"44100"}',
    //           format: "mp4",
    //         },
    //         {
    //           gear_name: "adapt_lowest_1440_1",
    //           quality_type: 7,
    //           bit_rate: 2655575,
    //           play_addr: {
    //             uri: "v0300fg10000d04tg3vog65lcfki63mg",
    //             url_list: [
    //               "https://v95-web-sz.douyinvod.com/caed92e7d65d9de8156aee19da58f26c/68919a1e/video/tos/cn/tos-cn-ve-15/o4AeIodBxjgEAiF9WDEQYIADkigftPqKOECIkD/?a=6383&ch=10010&cr=3&dr=0&lr=all&cd=0%7C0%7C0%7C3&cv=1&br=2593&bt=2593&cs=2&ft=GZnU0RqeffPdXP~ka1jNvAq-antLjrKYyVmCRkaml6C9UjVhWL6&mime_type=video_mp4&qs=15&rc=M2lkNzk6Ojk5ODs5PDhoOUBpajZsaW85cjZ3MzMzNGkzM0AzMl4zNS1hNWExXjE0Ml9fYSNqM2hgMmRzZDFhLS1kLTBzcw%3D%3D&btag=c0000e00010000&cquery=101r_100B_100x_100z_100o&dy_q=1754361813&feature_id=10cf95ef75b4f3e7eac623e4ea0ea691&l=20250805104332288948511D5931AF76A4",
    //               "https://v3-web.douyinvod.com/afcb162b7454429d04e68c5bee900773/68919a1e/video/tos/cn/tos-cn-ve-15/o4AeIodBxjgEAiF9WDEQYIADkigftPqKOECIkD/?a=6383&ch=10010&cr=3&dr=0&lr=all&cd=0%7C0%7C0%7C3&cv=1&br=2593&bt=2593&cs=2&ft=GZnU0RqeffPdXP~ka1jNvAq-antLjrKYyVmCRkaml6C9UjVhWL6&mime_type=video_mp4&qs=15&rc=M2lkNzk6Ojk5ODs5PDhoOUBpajZsaW85cjZ3MzMzNGkzM0AzMl4zNS1hNWExXjE0Ml9fYSNqM2hgMmRzZDFhLS1kLTBzcw%3D%3D&btag=c0000e00010000&cquery=100o_101r_100B_100x_100z&dy_q=1754361813&feature_id=10cf95ef75b4f3e7eac623e4ea0ea691&l=20250805104332288948511D5931AF76A4",
    //               "https://www.douyin.com/aweme/v1/play/?video_id=v0300fg10000d04tg3vog65lcfki63mg&line=0&file_id=b6be557946a845d686d7078664aa5f60&sign=2c5edfd7a4921f3d904c91f1cff6b73a&is_play_url=1&source=PackSourceEnum_PUBLISH",
    //             ],
    //             width: 2560,
    //             height: 1440,
    //             url_key:
    //               "v0300fg10000d04tg3vog65lcfki63mg_bytevc1_1440p_2655575",
    //             data_size: 8619667,
    //             file_hash: "2c5edfd7a4921f3d904c91f1cff6b73a",
    //             file_cs:
    //               "c:0-29983-033a|d:0-4309832-dc60,4309833-8619666-8cf4|a:v0300fg10000d04tg3vog65lcfki63mg",
    //           },
    //           is_h265: 1,
    //           is_bytevc1: 1,
    //           HDR_type: "",
    //           HDR_bit: "",
    //           FPS: 60,
    //           video_extra:
    //             '{"PktOffsetMap":"[{\\"time\\": 1, \\"offset\\": 345744}, {\\"time\\": 2, \\"offset\\": 610707}, {\\"time\\": 3, \\"offset\\": 927284}, {\\"time\\": 4, \\"offset\\": 1221586}, {\\"time\\": 5, \\"offset\\": 1590027}, {\\"time\\": 10, \\"offset\\": 3240357}]","format":"mp4","definition":"1440p","quality":"adapt_lowest","file_id":"b6be557946a845d686d7078664aa5f60","applog_map":{"feature_id":"10cf95ef75b4f3e7eac623e4ea0ea691"},"mvmaf":"{\\"mvmaf_sr_v1080\\":-1,\\"mvmaf_sr_v960\\":-1,\\"mvmaf_sr_v864\\":-1,\\"mvmaf_sr_v720\\":-1,\\"mvmaf_ori_v1080\\":91.11,\\"mvmaf_ori_v960\\":92.819,\\"mvmaf_ori_v864\\":93.933,\\"mvmaf_ori_v720\\":95.268}","audio_channels":"2.0","audio_sample_rate":"44100"}',
    //           format: "mp4",
    //         },
    //         {
    //           gear_name: "low_720_0",
    //           quality_type: 211,
    //           bit_rate: 1789491,
    //           play_addr: {
    //             uri: "v0300fg10000d04tg3vog65lcfki63mg",
    //             url_list: [
    //               "https://v95-web-sz.douyinvod.com/2f47830e3dfddfa94abeb5be29fa0ed5/68919a1e/video/tos/cn/tos-cn-ve-15c001-alinc2/osOjItFdieDPEDyKAQDAEgCq9xoggB8AFdEkfm/?a=6383&ch=10010&cr=3&dr=0&lr=all&cd=0%7C0%7C0%7C3&cv=1&br=1747&bt=1747&cs=0&ds=3&ft=GZnU0RqeffPdXP~ka1jNvAq-antLjrKYyVmCRkaml6C9UjVhWL6&mime_type=video_mp4&qs=1&rc=NjdlaTw5ZWVkaThnPDVnZUBpajZsaW85cjZ3MzMzNGkzM0A1MV8uLWBfXmAxMjJfLTAwYSNqM2hgMmRzZDFhLS1kLTBzcw%3D%3D&btag=c0000e00010000&cquery=100z_100o_101r_100B_100x&dy_q=1754361813&feature_id=46a7bb47b4fd1280f3d3825bf2b29388&l=20250805104332288948511D5931AF76A4",
    //               "https://v3-web.douyinvod.com/8ac4acc3a749dbca744d69bfca6a2f63/68919a1e/video/tos/cn/tos-cn-ve-15c001-alinc2/osOjItFdieDPEDyKAQDAEgCq9xoggB8AFdEkfm/?a=6383&ch=10010&cr=3&dr=0&lr=all&cd=0%7C0%7C0%7C3&cv=1&br=1747&bt=1747&cs=0&ds=3&ft=GZnU0RqeffPdXP~ka1jNvAq-antLjrKYyVmCRkaml6C9UjVhWL6&mime_type=video_mp4&qs=1&rc=NjdlaTw5ZWVkaThnPDVnZUBpajZsaW85cjZ3MzMzNGkzM0A1MV8uLWBfXmAxMjJfLTAwYSNqM2hgMmRzZDFhLS1kLTBzcw%3D%3D&btag=c0000e00010000&cquery=100o_101r_100B_100x_100z&dy_q=1754361813&feature_id=46a7bb47b4fd1280f3d3825bf2b29388&l=20250805104332288948511D5931AF76A4",
    //               "https://www.douyin.com/aweme/v1/play/?video_id=v0300fg10000d04tg3vog65lcfki63mg&line=0&file_id=3b3d02b95d554fcaabbbc6091fbb4483&sign=a07a8255402e9ad45aedb7aec0a00a3a&is_play_url=1&source=PackSourceEnum_PUBLISH",
    //             ],
    //             width: 1280,
    //             height: 720,
    //             url_key: "v0300fg10000d04tg3vog65lcfki63mg_h264_720p_1789491",
    //             data_size: 5815847,
    //             file_hash: "a07a8255402e9ad45aedb7aec0a00a3a",
    //             file_cs:
    //               "c:0-22868-e084|d:0-2907922-66ea,2907923-5815846-27c1|a:v0300fg10000d04tg3vog65lcfki63mg",
    //           },
    //           is_h265: 0,
    //           is_bytevc1: 0,
    //           HDR_type: "",
    //           HDR_bit: "",
    //           FPS: 30,
    //           video_extra:
    //             '{"PktOffsetMap":"[{\\"time\\": 1, \\"offset\\": 276066}, {\\"time\\": 2, \\"offset\\": 493770}, {\\"time\\": 3, \\"offset\\": 744593}, {\\"time\\": 4, \\"offset\\": 969243}, {\\"time\\": 5, \\"offset\\": 1192873}, {\\"time\\": 10, \\"offset\\": 2247687}]","format":"mp4","definition":"720p","quality":"low","file_id":"3b3d02b95d554fcaabbbc6091fbb4483","applog_map":{"feature_id":"46a7bb47b4fd1280f3d3825bf2b29388"},"audio_channels":"2.0","audio_sample_rate":"44100"}',
    //           format: "mp4",
    //         },
    //         {
    //           gear_name: "low_540_0",
    //           quality_type: 292,
    //           bit_rate: 1671258,
    //           play_addr: {
    //             uri: "v0300fg10000d04tg3vog65lcfki63mg",
    //             url_list: [
    //               "https://v95-web-sz.douyinvod.com/1608e368295ec5f2b3257e79ecc17c96/68919a1e/video/tos/cn/tos-cn-ve-15c001-alinc2/oMVGHKjA9IxARD6fqAQg9JDoXzaFEAPdBgfgEC/?a=6383&ch=10010&cr=3&dr=0&lr=all&cd=0%7C0%7C0%7C3&cv=1&br=1632&bt=1632&cs=0&ds=6&ft=GZnU0RqeffPdXP~ka1jNvAq-antLjrKYyVmCRkaml6C9UjVhWL6&mime_type=video_mp4&qs=1&rc=ZTk8Ojc7OjxnZDs3NzU6M0BpajZsaW85cjZ3MzMzNGkzM0AzLy0wMzE0NjExXzIvNWA1YSNqM2hgMmRzZDFhLS1kLTBzcw%3D%3D&btag=c0000e00010000&cquery=100x_100z_100o_101r_100B&dy_q=1754361813&feature_id=46a7bb47b4fd1280f3d3825bf2b29388&l=20250805104332288948511D5931AF76A4",
    //               "https://v3-web.douyinvod.com/4af2c950529ff2e5879a1859f88b7686/68919a1e/video/tos/cn/tos-cn-ve-15c001-alinc2/oMVGHKjA9IxARD6fqAQg9JDoXzaFEAPdBgfgEC/?a=6383&ch=10010&cr=3&dr=0&lr=all&cd=0%7C0%7C0%7C3&cv=1&br=1632&bt=1632&cs=0&ds=6&ft=GZnU0RqeffPdXP~ka1jNvAq-antLjrKYyVmCRkaml6C9UjVhWL6&mime_type=video_mp4&qs=1&rc=ZTk8Ojc7OjxnZDs3NzU6M0BpajZsaW85cjZ3MzMzNGkzM0AzLy0wMzE0NjExXzIvNWA1YSNqM2hgMmRzZDFhLS1kLTBzcw%3D%3D&btag=c0000e00010000&cquery=101r_100B_100x_100z_100o&dy_q=1754361813&feature_id=46a7bb47b4fd1280f3d3825bf2b29388&l=20250805104332288948511D5931AF76A4",
    //               "https://www.douyin.com/aweme/v1/play/?video_id=v0300fg10000d04tg3vog65lcfki63mg&line=0&file_id=80c7822454b84a4d997748643709266b&sign=c0772bf17895599a271af23f0f49215e&is_play_url=1&source=PackSourceEnum_PUBLISH",
    //             ],
    //             width: 1024,
    //             height: 576,
    //             url_key: "v0300fg10000d04tg3vog65lcfki63mg_h264_540p_1671258",
    //             data_size: 5431591,
    //             file_hash: "c0772bf17895599a271af23f0f49215e",
    //             file_cs:
    //               "c:0-22856-df49|d:0-2715794-8064,2715795-5431590-12c8|a:v0300fg10000d04tg3vog65lcfki63mg",
    //           },
    //           is_h265: 0,
    //           is_bytevc1: 0,
    //           HDR_type: "",
    //           HDR_bit: "",
    //           FPS: 30,
    //           video_extra:
    //             '{"PktOffsetMap":"[{\\"time\\": 1, \\"offset\\": 262021}, {\\"time\\": 2, \\"offset\\": 464506}, {\\"time\\": 3, \\"offset\\": 699390}, {\\"time\\": 4, \\"offset\\": 909054}, {\\"time\\": 5, \\"offset\\": 1118518}, {\\"time\\": 10, \\"offset\\": 2113329}]","format":"mp4","definition":"540p","quality":"low","file_id":"80c7822454b84a4d997748643709266b","applog_map":{"feature_id":"46a7bb47b4fd1280f3d3825bf2b29388"},"audio_channels":"2.0","audio_sample_rate":"44100"}',
    //           format: "mp4",
    //         },
    //         {
    //           gear_name: "lower_540_0",
    //           quality_type: 224,
    //           bit_rate: 1530596,
    //           play_addr: {
    //             uri: "v0300fg10000d04tg3vog65lcfki63mg",
    //             url_list: [
    //               "https://v95-web-sz.douyinvod.com/41a020358f8e59e23fd884aa1ec0595f/68919a1e/video/tos/cn/tos-cn-ve-15c001-alinc2/ocNK9oExCkeEAgRlAAEvDqgfPk9gZFIDQjDBtd/?a=6383&ch=10010&cr=3&dr=0&lr=all&cd=0%7C0%7C0%7C3&cv=1&br=1494&bt=1494&cs=0&ds=6&ft=GZnU0RqeffPdXP~ka1jNvAq-antLjrKYyVmCRkaml6C9UjVhWL6&mime_type=video_mp4&qs=4&rc=NzRmZDQ4PDpkNDhmMzU4ZkBpajZsaW85cjZ3MzMzNGkzM0AuNmEvMjAxX2MxXmBeMzI2YSNqM2hgMmRzZDFhLS1kLTBzcw%3D%3D&btag=c0000e00010000&cquery=100B_100x_100z_100o_101r&dy_q=1754361813&feature_id=eb29b1b3aca69db49524c333df8caaf7&l=20250805104332288948511D5931AF76A4",
    //               "https://v3-web.douyinvod.com/5d1a6e1009f9093b0a915e3a8181313c/68919a1e/video/tos/cn/tos-cn-ve-15c001-alinc2/ocNK9oExCkeEAgRlAAEvDqgfPk9gZFIDQjDBtd/?a=6383&ch=10010&cr=3&dr=0&lr=all&cd=0%7C0%7C0%7C3&cv=1&br=1494&bt=1494&cs=0&ds=6&ft=GZnU0RqeffPdXP~ka1jNvAq-antLjrKYyVmCRkaml6C9UjVhWL6&mime_type=video_mp4&qs=4&rc=NzRmZDQ4PDpkNDhmMzU4ZkBpajZsaW85cjZ3MzMzNGkzM0AuNmEvMjAxX2MxXmBeMzI2YSNqM2hgMmRzZDFhLS1kLTBzcw%3D%3D&btag=c0000e00010000&cquery=100B_100x_100z_100o_101r&dy_q=1754361813&feature_id=eb29b1b3aca69db49524c333df8caaf7&l=20250805104332288948511D5931AF76A4",
    //               "https://www.douyin.com/aweme/v1/play/?video_id=v0300fg10000d04tg3vog65lcfki63mg&line=0&file_id=9c5562a0cca541fab74935512adc9114&sign=6314b7beb47dabfc570a2305cf84bf65&is_play_url=1&source=PackSourceEnum_PUBLISH",
    //             ],
    //             width: 1024,
    //             height: 576,
    //             url_key: "v0300fg10000d04tg3vog65lcfki63mg_h264_540p_1530596",
    //             data_size: 4974437,
    //             file_hash: "6314b7beb47dabfc570a2305cf84bf65",
    //             file_cs:
    //               "c:0-22856-78c9|d:0-2487217-f23e,2487218-4974436-9047|a:v0300fg10000d04tg3vog65lcfki63mg",
    //           },
    //           is_h265: 0,
    //           is_bytevc1: 0,
    //           HDR_type: "",
    //           HDR_bit: "",
    //           FPS: 30,
    //           video_extra:
    //             '{"PktOffsetMap":"","format":"mp4","definition":"540p","quality":"lower","file_id":"9c5562a0cca541fab74935512adc9114","applog_map":{"feature_id":"eb29b1b3aca69db49524c333df8caaf7"},"audio_channels":"2.0","audio_sample_rate":"44100"}',
    //           format: "mp4",
    //         },
    //         {
    //           gear_name: "1080_1_1",
    //           quality_type: 3,
    //           bit_rate: 1422518,
    //           play_addr: {
    //             uri: "v0300fg10000d04tg3vog65lcfki63mg",
    //             url_list: [
    //               "https://v95-web-sz.douyinvod.com/151871109c59fbbca1a589f845fc1487/68919a1e/video/tos/cn/tos-cn-ve-15/ow9oCgDGQABEIQqwfAAgIf0FJdTP5aHgh0x9Dw/?a=6383&ch=10010&cr=3&dr=0&lr=all&cd=0%7C0%7C0%7C3&cv=1&br=1389&bt=1389&cs=2&ds=4&ft=GZnU0RqeffPdXP~ka1jNvAq-antLjrKYyVmCRkaml6C9UjVhWL6&mime_type=video_mp4&qs=0&rc=ZWdmM2czO2g5M2Q1NTU7OEBpajZsaW85cjZ3MzMzNGkzM0AzMTNfX18yXjQxLTRjLmMyYSNqM2hgMmRzZDFhLS1kLTBzcw%3D%3D&btag=c0000e00010000&cquery=101r_100B_100x_100z_100o&dy_q=1754361813&feature_id=63e57b176b357061c14e0ab4b250020b&l=20250805104332288948511D5931AF76A4",
    //               "https://v3-web.douyinvod.com/addce62fb03e6c6125758a2ecb1bca5b/68919a1e/video/tos/cn/tos-cn-ve-15/ow9oCgDGQABEIQqwfAAgIf0FJdTP5aHgh0x9Dw/?a=6383&ch=10010&cr=3&dr=0&lr=all&cd=0%7C0%7C0%7C3&cv=1&br=1389&bt=1389&cs=2&ds=4&ft=GZnU0RqeffPdXP~ka1jNvAq-antLjrKYyVmCRkaml6C9UjVhWL6&mime_type=video_mp4&qs=0&rc=ZWdmM2czO2g5M2Q1NTU7OEBpajZsaW85cjZ3MzMzNGkzM0AzMTNfX18yXjQxLTRjLmMyYSNqM2hgMmRzZDFhLS1kLTBzcw%3D%3D&btag=c0000e00010000&cquery=101r_100B_100x_100z_100o&dy_q=1754361813&feature_id=63e57b176b357061c14e0ab4b250020b&l=20250805104332288948511D5931AF76A4",
    //               "https://www.douyin.com/aweme/v1/play/?video_id=v0300fg10000d04tg3vog65lcfki63mg&line=0&file_id=55f812f2720a4076ae58b0bdb06c4d6b&sign=8e62af317509812d717d21f39dfea808&is_play_url=1&source=PackSourceEnum_PUBLISH",
    //             ],
    //             width: 1920,
    //             height: 1080,
    //             url_key:
    //               "v0300fg10000d04tg3vog65lcfki63mg_bytevc1_1080p_1422518",
    //             data_size: 4623186,
    //             file_hash: "8e62af317509812d717d21f39dfea808",
    //             file_cs:
    //               "c:0-23044-8272|d:0-2311592-4c13,2311593-4623185-704f|a:v0300fg10000d04tg3vog65lcfki63mg",
    //           },
    //           is_h265: 1,
    //           is_bytevc1: 1,
    //           HDR_type: "",
    //           HDR_bit: "",
    //           FPS: 30,
    //           video_extra:
    //             '{"PktOffsetMap":"[{\\"time\\": 1, \\"offset\\": 239353}, {\\"time\\": 2, \\"offset\\": 392261}, {\\"time\\": 3, \\"offset\\": 594842}, {\\"time\\": 4, \\"offset\\": 778196}, {\\"time\\": 5, \\"offset\\": 953305}, {\\"time\\": 10, \\"offset\\": 1777676}]","format":"mp4","definition":"1080p","quality":"normal","file_id":"55f812f2720a4076ae58b0bdb06c4d6b","v_gear_id":"aweme/high_value_group","u_vmaf":94.3323,"applog_map":{"feature_id":"63e57b176b357061c14e0ab4b250020b"},"sr_sharpness_strength":8,"mvmaf":"{\\"mvmaf_sr_v1080\\":-1,\\"mvmaf_sr_v960\\":-1,\\"mvmaf_sr_v864\\":-1,\\"mvmaf_sr_v720\\":-1,\\"mvmaf_ori_v1080\\":94.874,\\"mvmaf_ori_v960\\":95.93,\\"mvmaf_ori_v864\\":96.598,\\"mvmaf_ori_v720\\":96.458}","ufq":"{\\"enh\\":64.059,\\"playback\\":{\\"ori\\":62.933,\\"srv1\\":62.933},\\"src\\":60.069,\\"trans\\":62.933,\\"version\\":\\"v1.0\\"}","audio_channels":"2.0","audio_sample_rate":"44100"}',
    //           format: "mp4",
    //         },
    //         {
    //           gear_name: "720_1_1",
    //           quality_type: 11,
    //           bit_rate: 1195300,
    //           play_addr: {
    //             uri: "v0300fg10000d04tg3vog65lcfki63mg",
    //             url_list: [
    //               "https://v95-web-sz.douyinvod.com/5fb7f6436994890e365dce4757b27c42/68919a1e/video/tos/cn/tos-cn-ve-15/o8AQJFjPgCxUD4FD9feBdkAqgDErAEtEDo0kIt/?a=6383&ch=10010&cr=3&dr=0&lr=all&cd=0%7C0%7C0%7C3&cv=1&br=1167&bt=1167&cs=2&ds=3&ft=GZnU0RqeffPdXP~ka1jNvAq-antLjrKYyVmCRkaml6C9UjVhWL6&mime_type=video_mp4&qs=0&rc=OjhoZWdmNWYzZzM5NjY6OUBpajZsaW85cjZ3MzMzNGkzM0AtMGItMC4uNS4xM18vMTMwYSNqM2hgMmRzZDFhLS1kLTBzcw%3D%3D&btag=c0000e00010000&cquery=100B_100x_100z_100o_101r&dy_q=1754361813&feature_id=63e57b176b357061c14e0ab4b250020b&l=20250805104332288948511D5931AF76A4",
    //               "https://v3-web.douyinvod.com/d7c0bfd15989c1c2ff79eb59344bab38/68919a1e/video/tos/cn/tos-cn-ve-15/o8AQJFjPgCxUD4FD9feBdkAqgDErAEtEDo0kIt/?a=6383&ch=10010&cr=3&dr=0&lr=all&cd=0%7C0%7C0%7C3&cv=1&br=1167&bt=1167&cs=2&ds=3&ft=GZnU0RqeffPdXP~ka1jNvAq-antLjrKYyVmCRkaml6C9UjVhWL6&mime_type=video_mp4&qs=0&rc=OjhoZWdmNWYzZzM5NjY6OUBpajZsaW85cjZ3MzMzNGkzM0AtMGItMC4uNS4xM18vMTMwYSNqM2hgMmRzZDFhLS1kLTBzcw%3D%3D&btag=c0000e00010000&cquery=100x_100z_100o_101r_100B&dy_q=1754361813&feature_id=63e57b176b357061c14e0ab4b250020b&l=20250805104332288948511D5931AF76A4",
    //               "https://www.douyin.com/aweme/v1/play/?video_id=v0300fg10000d04tg3vog65lcfki63mg&line=0&file_id=36674323b6604d108c121c3d0bee3507&sign=1c39588f6bb04aedc8582da2dfceba46&is_play_url=1&source=PackSourceEnum_PUBLISH",
    //             ],
    //             width: 1280,
    //             height: 720,
    //             url_key:
    //               "v0300fg10000d04tg3vog65lcfki63mg_bytevc1_720p_1195300",
    //             data_size: 3884728,
    //             file_hash: "1c39588f6bb04aedc8582da2dfceba46",
    //             file_cs:
    //               "c:0-23044-be3d|d:0-1942363-7978,1942364-3884727-ed4e|a:v0300fg10000d04tg3vog65lcfki63mg",
    //           },
    //           is_h265: 1,
    //           is_bytevc1: 1,
    //           HDR_type: "",
    //           HDR_bit: "",
    //           FPS: 30,
    //           video_extra:
    //             '{"PktOffsetMap":"[{\\"time\\": 1, \\"offset\\": 209781}, {\\"time\\": 2, \\"offset\\": 340983}, {\\"time\\": 3, \\"offset\\": 513373}, {\\"time\\": 4, \\"offset\\": 668604}, {\\"time\\": 5, \\"offset\\": 813940}, {\\"time\\": 10, \\"offset\\": 1521674}]","format":"mp4","definition":"720p","quality":"normal","file_id":"36674323b6604d108c121c3d0bee3507","v_gear_id":"aweme/high_value_group","u_vmaf":92.1495,"applog_map":{"feature_id":"63e57b176b357061c14e0ab4b250020b"},"sr_sharpness_strength":8,"mvmaf":"{\\"mvmaf_sr_v1080\\":95.486,\\"mvmaf_sr_v960\\":97.503,\\"mvmaf_sr_v864\\":98.299,\\"mvmaf_sr_v720\\":99.106,\\"mvmaf_ori_v1080\\":87.595,\\"mvmaf_ori_v960\\":90.762,\\"mvmaf_ori_v864\\":92.594,\\"mvmaf_ori_v720\\":95.275}","ufq":"{\\"enh\\":64.059,\\"playback\\":{\\"ori\\":55.654,\\"srv1\\":62.681},\\"src\\":60.069,\\"trans\\":55.654,\\"version\\":\\"v1.0\\"}","audio_channels":"2.0","audio_sample_rate":"44100"}',
    //           format: "mp4",
    //         },
    //         {
    //           gear_name: "adapt_low_540_0",
    //           quality_type: 291,
    //           bit_rate: 1061052,
    //           play_addr: {
    //             uri: "v0300fg10000d04tg3vog65lcfki63mg",
    //             url_list: [
    //               "https://v95-web-sz.douyinvod.com/dc90c989eceab7e2a748e17ace8bdece/68919a1e/video/tos/cn/tos-cn-ve-15/oItgzQDDoBiqDSjFEDSdMAIxAAkKfCxge9EJcP/?a=6383&ch=10010&cr=3&dr=0&lr=all&cd=0%7C0%7C0%7C3&cv=1&br=1036&bt=1036&cs=0&ds=6&ft=GZnU0RqeffPdXP~ka1jNvAq-antLjrKYyVmCRkaml6C9UjVhWL6&mime_type=video_mp4&qs=12&rc=NGdpPDdmZ2VlPDk4O2VnaUBpajZsaW85cjZ3MzMzNGkzM0AtYi0tNmMzX18xYGMzMDBeYSNqM2hgMmRzZDFhLS1kLTBzcw%3D%3D&btag=c0000e00010000&cquery=100x_100z_100o_101r_100B&dy_q=1754361813&feature_id=46a7bb47b4fd1280f3d3825bf2b29388&l=20250805104332288948511D5931AF76A4",
    //               "https://v3-web.douyinvod.com/ef0cd6de571a397933faa40f9c6d6b28/68919a1e/video/tos/cn/tos-cn-ve-15/oItgzQDDoBiqDSjFEDSdMAIxAAkKfCxge9EJcP/?a=6383&ch=10010&cr=3&dr=0&lr=all&cd=0%7C0%7C0%7C3&cv=1&br=1036&bt=1036&cs=0&ds=6&ft=GZnU0RqeffPdXP~ka1jNvAq-antLjrKYyVmCRkaml6C9UjVhWL6&mime_type=video_mp4&qs=12&rc=NGdpPDdmZ2VlPDk4O2VnaUBpajZsaW85cjZ3MzMzNGkzM0AtYi0tNmMzX18xYGMzMDBeYSNqM2hgMmRzZDFhLS1kLTBzcw%3D%3D&btag=c0000e00010000&cquery=101r_100B_100x_100z_100o&dy_q=1754361813&feature_id=46a7bb47b4fd1280f3d3825bf2b29388&l=20250805104332288948511D5931AF76A4",
    //               "https://www.douyin.com/aweme/v1/play/?video_id=v0300fg10000d04tg3vog65lcfki63mg&line=0&file_id=af3d3b68f5c649bbbb6dfc94090fed01&sign=7e7af6763369f5fb819dcb061428960d&is_play_url=1&source=PackSourceEnum_PUBLISH",
    //             ],
    //             width: 1024,
    //             height: 576,
    //             url_key: "v0300fg10000d04tg3vog65lcfki63mg_h264_540p_1061052",
    //             data_size: 3448420,
    //             file_hash: "7e7af6763369f5fb819dcb061428960d",
    //             file_cs:
    //               "c:0-22855-1368|d:0-1724209-c758,1724210-3448419-681b|a:v0300fg10000d04tg3vog65lcfki63mg",
    //           },
    //           is_h265: 0,
    //           is_bytevc1: 0,
    //           HDR_type: "",
    //           HDR_bit: "",
    //           FPS: 30,
    //           video_extra:
    //             '{"PktOffsetMap":"[{\\"time\\": 1, \\"offset\\": 171930}, {\\"time\\": 2, \\"offset\\": 301059}, {\\"time\\": 3, \\"offset\\": 450625}, {\\"time\\": 4, \\"offset\\": 584406}, {\\"time\\": 5, \\"offset\\": 716455}, {\\"time\\": 10, \\"offset\\": 1341269}]","format":"mp4","definition":"540p","quality":"adapt_low","file_id":"af3d3b68f5c649bbbb6dfc94090fed01","applog_map":{"feature_id":"46a7bb47b4fd1280f3d3825bf2b29388"},"audio_channels":"2.0","audio_sample_rate":"44100"}',
    //           format: "mp4",
    //         },
    //         {
    //           gear_name: "720_2_1",
    //           quality_type: 12,
    //           bit_rate: 911858,
    //           play_addr: {
    //             uri: "v0300fg10000d04tg3vog65lcfki63mg",
    //             url_list: [
    //               "https://v95-web-sz.douyinvod.com/f62ad14ef36e7dbf5c662ff731660ddf/68919a1e/video/tos/cn/tos-cn-ve-15/ogB7A4DCNF4CxAdQIoEDqLftE0j7ggkeADJPj9/?a=6383&ch=10010&cr=3&dr=0&lr=all&cd=0%7C0%7C0%7C3&cv=1&br=890&bt=890&cs=2&ds=3&ft=GZnU0RqeffPdXP~ka1jNvAq-antLjrKYyVmCRkaml6C9UjVhWL6&mime_type=video_mp4&qs=0&rc=aWY1aDg3NjZnaTQ6Mzs7NEBpajZsaW85cjZ3MzMzNGkzM0BfNjItMS80NWAxXjEtYl5jYSNqM2hgMmRzZDFhLS1kLTBzcw%3D%3D&btag=c0000e00010000&cquery=100o_101r_100B_100x_100z&dy_q=1754361813&feature_id=63e57b176b357061c14e0ab4b250020b&l=20250805104332288948511D5931AF76A4",
    //               "https://v3-web.douyinvod.com/596cc989c7daf73e4620b118d16d42fb/68919a1e/video/tos/cn/tos-cn-ve-15/ogB7A4DCNF4CxAdQIoEDqLftE0j7ggkeADJPj9/?a=6383&ch=10010&cr=3&dr=0&lr=all&cd=0%7C0%7C0%7C3&cv=1&br=890&bt=890&cs=2&ds=3&ft=GZnU0RqeffPdXP~ka1jNvAq-antLjrKYyVmCRkaml6C9UjVhWL6&mime_type=video_mp4&qs=0&rc=aWY1aDg3NjZnaTQ6Mzs7NEBpajZsaW85cjZ3MzMzNGkzM0BfNjItMS80NWAxXjEtYl5jYSNqM2hgMmRzZDFhLS1kLTBzcw%3D%3D&btag=c0000e00010000&cquery=100z_100o_101r_100B_100x&dy_q=1754361813&feature_id=63e57b176b357061c14e0ab4b250020b&l=20250805104332288948511D5931AF76A4",
    //               "https://www.douyin.com/aweme/v1/play/?video_id=v0300fg10000d04tg3vog65lcfki63mg&line=0&file_id=f1a8e80047a14fcd837324450e529cbf&sign=37479ef5350f2517c8cce6ceffaf082a&is_play_url=1&source=PackSourceEnum_PUBLISH",
    //             ],
    //             width: 1280,
    //             height: 720,
    //             url_key: "v0300fg10000d04tg3vog65lcfki63mg_bytevc1_720p_911858",
    //             data_size: 2963540,
    //             file_hash: "37479ef5350f2517c8cce6ceffaf082a",
    //             file_cs:
    //               "c:0-23044-42a0|d:0-1481769-ae36,1481770-2963539-4e9a|a:v0300fg10000d04tg3vog65lcfki63mg",
    //           },
    //           is_h265: 1,
    //           is_bytevc1: 1,
    //           HDR_type: "",
    //           HDR_bit: "",
    //           FPS: 30,
    //           video_extra:
    //             '{"PktOffsetMap":"[{\\"time\\": 1, \\"offset\\": 166575}, {\\"time\\": 2, \\"offset\\": 265539}, {\\"time\\": 3, \\"offset\\": 397705}, {\\"time\\": 4, \\"offset\\": 517228}, {\\"time\\": 5, \\"offset\\": 627372}, {\\"time\\": 10, \\"offset\\": 1163676}]","format":"mp4","definition":"720p","quality":"normal","file_id":"f1a8e80047a14fcd837324450e529cbf","v_gear_id":"aweme/high_value_group","u_vmaf":88.1582,"applog_map":{"feature_id":"63e57b176b357061c14e0ab4b250020b"},"sr_sharpness_strength":8,"mvmaf":"{\\"mvmaf_sr_v1080\\":92.496,\\"mvmaf_sr_v960\\":94.608,\\"mvmaf_sr_v864\\":96.074,\\"mvmaf_sr_v720\\":97.769,\\"mvmaf_ori_v1080\\":83.976,\\"mvmaf_ori_v960\\":87.495,\\"mvmaf_ori_v864\\":89.435,\\"mvmaf_ori_v720\\":93.364}","ufq":"{\\"enh\\":64.059,\\"playback\\":{\\"ori\\":52.291,\\"srv1\\":60.079},\\"src\\":60.069,\\"trans\\":52.291,\\"version\\":\\"v1.0\\"}","audio_channels":"2.0","audio_sample_rate":"44100"}',
    //           format: "mp4",
    //         },
    //         {
    //           gear_name: "540_2_1",
    //           quality_type: 23,
    //           bit_rate: 653995,
    //           play_addr: {
    //             uri: "v0300fg10000d04tg3vog65lcfki63mg",
    //             url_list: [
    //               "https://v95-web-sz.douyinvod.com/8fdbd9f2372cf9e66fd79dc468a934c8/68919a1e/video/tos/cn/tos-cn-ve-15/o4oBDgJxPBDIdAF9qAjEeRoQCCAkgmfs7g4DEt/?a=6383&ch=10010&cr=3&dr=0&lr=all&cd=0%7C0%7C0%7C3&cv=1&br=638&bt=638&cs=2&ds=6&ft=GZnU0RqeffPdXP~ka1jNvAq-antLjrKYyVmCRkaml6C9UjVhWL6&mime_type=video_mp4&qs=0&rc=OWdkOGg4Zzs3Nzg6ZDxlO0BpajZsaW85cjZ3MzMzNGkzM0BiYS41YjMwXmAxXjBiLy80YSNqM2hgMmRzZDFhLS1kLTBzcw%3D%3D&btag=c0000e00010000&cquery=101r_100B_100x_100z_100o&dy_q=1754361813&feature_id=63e57b176b357061c14e0ab4b250020b&l=20250805104332288948511D5931AF76A4",
    //               "https://v3-web.douyinvod.com/f7a83539c2484a7d5b1a15dbcf7a467d/68919a1e/video/tos/cn/tos-cn-ve-15/o4oBDgJxPBDIdAF9qAjEeRoQCCAkgmfs7g4DEt/?a=6383&ch=10010&cr=3&dr=0&lr=all&cd=0%7C0%7C0%7C3&cv=1&br=638&bt=638&cs=2&ds=6&ft=GZnU0RqeffPdXP~ka1jNvAq-antLjrKYyVmCRkaml6C9UjVhWL6&mime_type=video_mp4&qs=0&rc=OWdkOGg4Zzs3Nzg6ZDxlO0BpajZsaW85cjZ3MzMzNGkzM0BiYS41YjMwXmAxXjBiLy80YSNqM2hgMmRzZDFhLS1kLTBzcw%3D%3D&btag=c0000e00010000&cquery=100z_100o_101r_100B_100x&dy_q=1754361813&feature_id=63e57b176b357061c14e0ab4b250020b&l=20250805104332288948511D5931AF76A4",
    //               "https://www.douyin.com/aweme/v1/play/?video_id=v0300fg10000d04tg3vog65lcfki63mg&line=0&file_id=782b29ea37a544c4a83d65ee851adde6&sign=19fee3819adb99572623d2b1dbca0126&is_play_url=1&source=PackSourceEnum_PUBLISH",
    //             ],
    //             width: 1024,
    //             height: 576,
    //             url_key: "v0300fg10000d04tg3vog65lcfki63mg_bytevc1_540p_653995",
    //             data_size: 2125484,
    //             file_hash: "19fee3819adb99572623d2b1dbca0126",
    //             file_cs:
    //               "c:0-23044-97c0|d:0-1062741-27ac,1062742-2125483-3c9b|a:v0300fg10000d04tg3vog65lcfki63mg",
    //           },
    //           is_h265: 1,
    //           is_bytevc1: 1,
    //           HDR_type: "",
    //           HDR_bit: "",
    //           FPS: 30,
    //           video_extra:
    //             '{"PktOffsetMap":"[{\\"time\\": 1, \\"offset\\": 127016}, {\\"time\\": 2, \\"offset\\": 197640}, {\\"time\\": 3, \\"offset\\": 291785}, {\\"time\\": 4, \\"offset\\": 376892}, {\\"time\\": 5, \\"offset\\": 454982}, {\\"time\\": 10, \\"offset\\": 837059}]","format":"mp4","definition":"540p","quality":"normal","file_id":"782b29ea37a544c4a83d65ee851adde6","v_gear_id":"aweme/high_value_group","u_vmaf":80.2061,"applog_map":{"feature_id":"63e57b176b357061c14e0ab4b250020b"},"sr_sharpness_strength":8,"mvmaf":"{\\"mvmaf_sr_v1080\\":85.739,\\"mvmaf_sr_v960\\":89.064,\\"mvmaf_sr_v864\\":90.661,\\"mvmaf_sr_v720\\":93.376,\\"mvmaf_ori_v1080\\":74.608,\\"mvmaf_ori_v960\\":79.009,\\"mvmaf_ori_v864\\":81.637,\\"mvmaf_ori_v720\\":86.951}","ufq":"{\\"enh\\":64.059,\\"playback\\":{\\"ori\\":45.265,\\"srv1\\":53.322},\\"src\\":60.069,\\"trans\\":45.265,\\"version\\":\\"v1.0\\"}","audio_channels":"2.0","audio_sample_rate":"44100"}',
    //           format: "mp4",
    //         },
    //         {
    //           gear_name: "540_3_1",
    //           quality_type: 24,
    //           bit_rate: 441430,
    //           play_addr: {
    //             uri: "v0300fg10000d04tg3vog65lcfki63mg",
    //             url_list: [
    //               "https://v95-web-sz.douyinvod.com/d2e74d5f4373f99743390dead408e73e/68919a1e/video/tos/cn/tos-cn-ve-15/o44APEtDgDBBkgjFfXo9AQAqIxJeHCE6dP2kOD/?a=6383&ch=10010&cr=3&dr=0&lr=all&cd=0%7C0%7C0%7C3&cv=1&br=431&bt=431&cs=2&ds=6&ft=GZnU0RqeffPdXP~ka1jNvAq-antLjrKYyVmCRkaml6C9UjVhWL6&mime_type=video_mp4&qs=0&rc=Omc6NDg3M2Y2PDpnZjw7OkBpajZsaW85cjZ3MzMzNGkzM0BjNl4xNWAzXjMxNmA2Yy01YSNqM2hgMmRzZDFhLS1kLTBzcw%3D%3D&btag=c0000e00010000&cquery=100x_100z_100o_101r_100B&dy_q=1754361813&feature_id=7eb8b6723a824f510faba596be48d733&l=20250805104332288948511D5931AF76A4",
    //               "https://v3-web.douyinvod.com/129723ddbef36d08331a6c2fd51e4b5b/68919a1e/video/tos/cn/tos-cn-ve-15/o44APEtDgDBBkgjFfXo9AQAqIxJeHCE6dP2kOD/?a=6383&ch=10010&cr=3&dr=0&lr=all&cd=0%7C0%7C0%7C3&cv=1&br=431&bt=431&cs=2&ds=6&ft=GZnU0RqeffPdXP~ka1jNvAq-antLjrKYyVmCRkaml6C9UjVhWL6&mime_type=video_mp4&qs=0&rc=Omc6NDg3M2Y2PDpnZjw7OkBpajZsaW85cjZ3MzMzNGkzM0BjNl4xNWAzXjMxNmA2Yy01YSNqM2hgMmRzZDFhLS1kLTBzcw%3D%3D&btag=c0000e00010000&cquery=100o_101r_100B_100x_100z&dy_q=1754361813&feature_id=7eb8b6723a824f510faba596be48d733&l=20250805104332288948511D5931AF76A4",
    //               "https://www.douyin.com/aweme/v1/play/?video_id=v0300fg10000d04tg3vog65lcfki63mg&line=0&file_id=8708f99ccd974963ac60c48541a79df7&sign=92ecfe83a1aea6a1f9c68ecc1ff5f5ea&is_play_url=1&source=PackSourceEnum_PUBLISH",
    //             ],
    //             width: 960,
    //             height: 540,
    //             url_key: "v0300fg10000d04tg3vog65lcfki63mg_bytevc1_540p_441430",
    //             data_size: 1434648,
    //             file_hash: "92ecfe83a1aea6a1f9c68ecc1ff5f5ea",
    //             file_cs:
    //               "c:0-23043-2c1e|d:0-717323-8373,717324-1434647-877b|a:v0300fg10000d04tg3vog65lcfki63mg",
    //           },
    //           is_h265: 1,
    //           is_bytevc1: 1,
    //           HDR_type: "",
    //           HDR_bit: "",
    //           FPS: 30,
    //           video_extra:
    //             '{"PktOffsetMap":"[{\\"time\\": 1, \\"offset\\": 96424}, {\\"time\\": 2, \\"offset\\": 144170}, {\\"time\\": 3, \\"offset\\": 207823}, {\\"time\\": 4, \\"offset\\": 264933}, {\\"time\\": 5, \\"offset\\": 317719}, {\\"time\\": 10, \\"offset\\": 573265}]","format":"mp4","definition":"540p","quality":"normal","file_id":"8708f99ccd974963ac60c48541a79df7","v_gear_id":"aweme/high_value_group","u_vmaf":76.7925,"applog_map":{"feature_id":"7eb8b6723a824f510faba596be48d733"},"sr_sharpness_strength":8,"mvmaf":"{\\"mvmaf_sr_v1080\\":78.841,\\"mvmaf_sr_v960\\":83.263,\\"mvmaf_sr_v864\\":85.595,\\"mvmaf_sr_v720\\":86.229,\\"mvmaf_ori_v1080\\":69.501,\\"mvmaf_ori_v960\\":72.58,\\"mvmaf_ori_v864\\":76.316,\\"mvmaf_ori_v720\\":81.313}","ufq":"{\\"enh\\":64.059,\\"playback\\":{\\"ori\\":41.435,\\"srv1\\":47.964},\\"src\\":60.069,\\"trans\\":41.435,\\"version\\":\\"v1.0\\"}","audio_channels":"2.0","audio_sample_rate":"44100"}',
    //           format: "mp4",
    //         },
    //         {
    //           gear_name: "540_4_1",
    //           quality_type: 25,
    //           bit_rate: 327851,
    //           play_addr: {
    //             uri: "v0300fg10000d04tg3vog65lcfki63mg",
    //             url_list: [
    //               "https://v95-web-sz.douyinvod.com/1b2be4b9f5c72aff1ab7153d722c04fc/68919a1e/video/tos/cn/tos-cn-ve-15/o89AVAPkAqBEDQOotdDFEgjCIBefFBEJtgD4Ax/?a=6383&ch=10010&cr=3&dr=0&lr=all&cd=0%7C0%7C0%7C3&cv=1&br=320&bt=320&cs=2&ds=6&ft=GZnU0RqeffPdXP~ka1jNvAq-antLjrKYyVmCRkaml6C9UjVhWL6&mime_type=video_mp4&qs=0&rc=PDxpM2k0ZDpmZWU8NTg1NkBpajZsaW85cjZ3MzMzNGkzM0AuNGIxMjAuXjAxNTNgNGMxYSNqM2hgMmRzZDFhLS1kLTBzcw%3D%3D&btag=c0000e00010000&cquery=100z_100o_101r_100B_100x&dy_q=1754361813&feature_id=7eb8b6723a824f510faba596be48d733&l=20250805104332288948511D5931AF76A4",
    //               "https://v3-web.douyinvod.com/409bdd7acc8473f55694667eec68163b/68919a1e/video/tos/cn/tos-cn-ve-15/o89AVAPkAqBEDQOotdDFEgjCIBefFBEJtgD4Ax/?a=6383&ch=10010&cr=3&dr=0&lr=all&cd=0%7C0%7C0%7C3&cv=1&br=320&bt=320&cs=2&ds=6&ft=GZnU0RqeffPdXP~ka1jNvAq-antLjrKYyVmCRkaml6C9UjVhWL6&mime_type=video_mp4&qs=0&rc=PDxpM2k0ZDpmZWU8NTg1NkBpajZsaW85cjZ3MzMzNGkzM0AuNGIxMjAuXjAxNTNgNGMxYSNqM2hgMmRzZDFhLS1kLTBzcw%3D%3D&btag=c0000e00010000&cquery=100x_100z_100o_101r_100B&dy_q=1754361813&feature_id=7eb8b6723a824f510faba596be48d733&l=20250805104332288948511D5931AF76A4",
    //               "https://www.douyin.com/aweme/v1/play/?video_id=v0300fg10000d04tg3vog65lcfki63mg&line=0&file_id=43f275c2698b4b3ca71a315f40ef7919&sign=786cb0bf5d3d19cd807bf124a25e3771&is_play_url=1&source=PackSourceEnum_PUBLISH",
    //             ],
    //             width: 960,
    //             height: 540,
    //             url_key: "v0300fg10000d04tg3vog65lcfki63mg_bytevc1_540p_327851",
    //             data_size: 1065517,
    //             file_hash: "786cb0bf5d3d19cd807bf124a25e3771",
    //             file_cs:
    //               "c:0-23043-08f1|d:0-532757-049d,532758-1065516-5c8b|a:v0300fg10000d04tg3vog65lcfki63mg",
    //           },
    //           is_h265: 1,
    //           is_bytevc1: 1,
    //           HDR_type: "",
    //           HDR_bit: "",
    //           FPS: 30,
    //           video_extra:
    //             '{"PktOffsetMap":"[{\\"time\\": 1, \\"offset\\": 78570}, {\\"time\\": 2, \\"offset\\": 113669}, {\\"time\\": 3, \\"offset\\": 160365}, {\\"time\\": 4, \\"offset\\": 202219}, {\\"time\\": 5, \\"offset\\": 241062}, {\\"time\\": 10, \\"offset\\": 429274}]","format":"mp4","definition":"540p","quality":"normal","file_id":"43f275c2698b4b3ca71a315f40ef7919","v_gear_id":"aweme/high_value_group","u_vmaf":71.3709,"applog_map":{"feature_id":"7eb8b6723a824f510faba596be48d733"},"sr_sharpness_strength":8,"mvmaf":"{\\"mvmaf_sr_v1080\\":73.168,\\"mvmaf_sr_v960\\":76.37,\\"mvmaf_sr_v864\\":79.011,\\"mvmaf_sr_v720\\":81.04,\\"mvmaf_ori_v1080\\":63.867,\\"mvmaf_ori_v960\\":66.443,\\"mvmaf_ori_v864\\":70.307,\\"mvmaf_ori_v720\\":75.305}","ufq":"{\\"enh\\":64.059,\\"playback\\":{\\"ori\\":37.21,\\"srv1\\":43.709},\\"src\\":60.069,\\"trans\\":37.21,\\"version\\":\\"v1.0\\"}","audio_channels":"2.0","audio_sample_rate":"44100"}',
    //           format: "mp4",
    //         },
    //       ],
    //       duration: 25967,
    //       bit_rate_audio: null,
    //       gaussian_cover: {
    //         uri: "tos-cn-p-0015/o8xeI8BoAgcIa09tqE8DfBDAJPRDCFqgdDj2kA",
    //         url_list: [
    //           "https://p3-pc-sign.douyinpic.com/tos-cn-p-0015/o8xeI8BoAgcIa09tqE8DfBDAJPRDCFqgdDj2kA~tplv-tsj2vxp0zn-gaosi:40.jpeg?lk3s=138a59ce&x-expires=1785895200&x-signature=vswQfAeGRKMcI0IeFYjnBGp1GDY%3D&from=327834062",
    //           "https://p9-pc-sign.douyinpic.com/tos-cn-p-0015/o8xeI8BoAgcIa09tqE8DfBDAJPRDCFqgdDj2kA~tplv-tsj2vxp0zn-gaosi:40.jpeg?lk3s=138a59ce&x-expires=1785895200&x-signature=v8wQbXSmbxQjwZNDd21z415wlhY%3D&from=327834062",
    //         ],
    //         width: 720,
    //         height: 720,
    //       },
    //       play_addr_265: {
    //         uri: "v0300fg10000d04tg3vog65lcfki63mg",
    //         url_list: [
    //           "https://v95-web-sz.douyinvod.com/caed92e7d65d9de8156aee19da58f26c/68919a1e/video/tos/cn/tos-cn-ve-15/o4AeIodBxjgEAiF9WDEQYIADkigftPqKOECIkD/?a=6383&ch=10010&cr=3&dr=0&lr=all&cd=0%7C0%7C0%7C3&cv=1&br=2593&bt=2593&cs=2&ft=GZnU0RqeffPdXP~ka1jNvAq-antLjrKYyVmCRkaml6C9UjVhWL6&mime_type=video_mp4&qs=15&rc=M2lkNzk6Ojk5ODs5PDhoOUBpajZsaW85cjZ3MzMzNGkzM0AzMl4zNS1hNWExXjE0Ml9fYSNqM2hgMmRzZDFhLS1kLTBzcw%3D%3D&btag=c0000e00010000&cquery=101r_100B_100x_100z_100o&dy_q=1754361813&feature_id=10cf95ef75b4f3e7eac623e4ea0ea691&l=20250805104332288948511D5931AF76A4",
    //           "https://v3-web.douyinvod.com/afcb162b7454429d04e68c5bee900773/68919a1e/video/tos/cn/tos-cn-ve-15/o4AeIodBxjgEAiF9WDEQYIADkigftPqKOECIkD/?a=6383&ch=10010&cr=3&dr=0&lr=all&cd=0%7C0%7C0%7C3&cv=1&br=2593&bt=2593&cs=2&ft=GZnU0RqeffPdXP~ka1jNvAq-antLjrKYyVmCRkaml6C9UjVhWL6&mime_type=video_mp4&qs=15&rc=M2lkNzk6Ojk5ODs5PDhoOUBpajZsaW85cjZ3MzMzNGkzM0AzMl4zNS1hNWExXjE0Ml9fYSNqM2hgMmRzZDFhLS1kLTBzcw%3D%3D&btag=c0000e00010000&cquery=100o_101r_100B_100x_100z&dy_q=1754361813&feature_id=10cf95ef75b4f3e7eac623e4ea0ea691&l=20250805104332288948511D5931AF76A4",
    //           "https://www.douyin.com/aweme/v1/play/?video_id=v0300fg10000d04tg3vog65lcfki63mg&line=0&file_id=b6be557946a845d686d7078664aa5f60&sign=2c5edfd7a4921f3d904c91f1cff6b73a&is_play_url=1&source=PackSourceEnum_PUBLISH",
    //         ],
    //         width: 2560,
    //         height: 1440,
    //         url_key: "v0300fg10000d04tg3vog65lcfki63mg_bytevc1_1440p_2655575",
    //         data_size: 8619667,
    //         file_hash: "2c5edfd7a4921f3d904c91f1cff6b73a",
    //         file_cs:
    //           "c:0-29983-033a|d:0-4309832-dc60,4309833-8619666-8cf4|a:v0300fg10000d04tg3vog65lcfki63mg",
    //       },
    //       audio: {
    //         original_sound_infos: null,
    //       },
    //       play_addr_h264: {
    //         uri: "v0300fg10000d04tg3vog65lcfki63mg",
    //         url_list: [
    //           "https://v95-web-sz.douyinvod.com/ddb8a7913bd85e12cc81255d68885723/68919a1e/video/tos/cn/tos-cn-ve-15/ooPaqFB9DDoICJAgKgZ9ArnGQfHPxWAESaIfdg/?a=6383&ch=10010&cr=3&dr=0&lr=all&cd=0%7C0%7C0%7C3&cv=1&br=4097&bt=4097&cs=0&ds=4&ft=GZnU0RqeffPdXP~ka1jNvAq-antLjrKYyVmCRkaml6C9UjVhWL6&mime_type=video_mp4&qs=0&rc=ZjQ0NDhpODUzZzdpMzw6OEBpajZsaW85cjZ3MzMzNGkzM0AwLzAxMjBjNjExLzEtYjJiYSNqM2hgMmRzZDFhLS1kLTBzcw%3D%3D&btag=c0000e00010000&cquery=100x_100z_100o_101r_100B&dy_q=1754361813&feature_id=136e8d81b95d650c236697554379e663&l=20250805104332288948511D5931AF76A4",
    //           "https://v3-web.douyinvod.com/7141968aa7311f84b8293df587977b2c/68919a1e/video/tos/cn/tos-cn-ve-15/ooPaqFB9DDoICJAgKgZ9ArnGQfHPxWAESaIfdg/?a=6383&ch=10010&cr=3&dr=0&lr=all&cd=0%7C0%7C0%7C3&cv=1&br=4097&bt=4097&cs=0&ds=4&ft=GZnU0RqeffPdXP~ka1jNvAq-antLjrKYyVmCRkaml6C9UjVhWL6&mime_type=video_mp4&qs=0&rc=ZjQ0NDhpODUzZzdpMzw6OEBpajZsaW85cjZ3MzMzNGkzM0AwLzAxMjBjNjExLzEtYjJiYSNqM2hgMmRzZDFhLS1kLTBzcw%3D%3D&btag=c0000e00010000&cquery=100o_101r_100B_100x_100z&dy_q=1754361813&feature_id=136e8d81b95d650c236697554379e663&l=20250805104332288948511D5931AF76A4",
    //           "https://www.douyin.com/aweme/v1/play/?video_id=v0300fg10000d04tg3vog65lcfki63mg&line=0&file_id=e557e9004f244d4092f53f554131213c&sign=9dc37edb06c0e0692b8ea276b22a6886&is_play_url=1&source=PackSourceEnum_PUBLISH",
    //         ],
    //         width: 1920,
    //         height: 1080,
    //         url_key: "v0300fg10000d04tg3vog65lcfki63mg_h264_1080p_4195419",
    //         data_size: 13617807,
    //         file_hash: "9dc37edb06c0e0692b8ea276b22a6886",
    //         file_cs:
    //           "c:0-44132-8874|d:0-6808902-19db,6808903-13617806-7fb5|a:v0300fg10000d04tg3vog65lcfki63mg",
    //       },
    //       raw_cover: {
    //         uri: "tos-cn-p-0015/ocHfdFg5ACj97DqDIt2APxZkAVEACo2DgFBJEe",
    //         url_list: [
    //           "https://p3-pc-sign.douyinpic.com/tos-cn-p-0015/ocHfdFg5ACj97DqDIt2APxZkAVEACo2DgFBJEe~tplv-dy-cropcenter:323:430.jpeg?lk3s=138a59ce&x-expires=2069719200&x-signature=Wm5G7mgMphCZgilPxXWKinExvlU%3D&from=327834062&s=PackSourceEnum_PUBLISH&se=true&sh=323_430&sc=cover&biz_tag=pcweb_cover&l=20250805104332288948511D5931AF76A4",
    //           "https://p3-pc-sign.douyinpic.com/obj/tos-cn-p-0015/ocHfdFg5ACj97DqDIt2APxZkAVEACo2DgFBJEe?lk3s=138a59ce&x-expires=2069719200&x-signature=fjJbVvfk5MayIV1ZotQ1tQ0tzuM%3D&from=327834062&s=PackSourceEnum_PUBLISH&se=false&sc=cover&biz_tag=pcweb_cover&l=20250805104332288948511D5931AF76A4",
    //           "https://p9-pc-sign.douyinpic.com/obj/tos-cn-p-0015/ocHfdFg5ACj97DqDIt2APxZkAVEACo2DgFBJEe?lk3s=138a59ce&x-expires=2069719200&x-signature=9WlGm4jo9lDo%2BeQbT%2FpUn6Awi90%3D&from=327834062&s=PackSourceEnum_PUBLISH&se=false&sc=cover&biz_tag=pcweb_cover&l=20250805104332288948511D5931AF76A4",
    //         ],
    //         width: 720,
    //         height: 720,
    //       },
    //       animated_cover: {
    //         uri: "tos-cn-p-0015/oEDAACPDXIAdDB3ejE2gJfBRtgEqxBD4oIk9nF",
    //         url_list: [
    //           "https://p3-pc-sign.douyinpic.com/obj/tos-cn-p-0015/oEDAACPDXIAdDB3ejE2gJfBRtgEqxBD4oIk9nF?lk3s=138a59ce&x-expires=1755568800&x-signature=yAZvThdeShLkkCh%2BtYwOX9xmUI8%3D&from=327834062_large&s=PackSourceEnum_PUBLISH&se=false&sc=dynamic_cover&biz_tag=pcweb_cover&l=20250805104332288948511D5931AF76A4",
    //           "https://p9-pc-sign.douyinpic.com/obj/tos-cn-p-0015/oEDAACPDXIAdDB3ejE2gJfBRtgEqxBD4oIk9nF?lk3s=138a59ce&x-expires=1755568800&x-signature=mkDohDBU2z0eOFYik3RtSfTwqKE%3D&from=327834062_large&s=PackSourceEnum_PUBLISH&se=false&sc=dynamic_cover&biz_tag=pcweb_cover&l=20250805104332288948511D5931AF76A4",
    //         ],
    //       },
    //       horizontal_type: 1,
    //       misc_download_addrs:
    //         '{"suffix_scene":{"uri":"v0300fg10000d04tg3vog65lcfki63mg","url_list":["https://v95-web-sz.douyinvod.com/3b026beb74370cc0aaa8366a97d1b0f3/68919a1e/video/tos/cn/tos-cn-ve-15/oAJGPHgCfAQe9gU8gD9o9JBa8EADFAYGxdaIZq/?a=6383\\u0026ch=10010\\u0026cr=3\\u0026dr=0\\u0026lr=all\\u0026cd=0%7C0%7C0%7C3\\u0026cv=1\\u0026br=3728\\u0026bt=3728\\u0026cs=0\\u0026ds=3\\u0026ft=GZnU0RqeffPdXP~ka1jNvAq-antLjrKYyVmCRkaml6C9UjVhWL6\\u0026mime_type=video_mp4\\u0026qs=0\\u0026rc=OzxkZmc2O2Y7ZWQ1Nzs0NEBpajZsaW85cjZ3MzMzNGkzM0BiNjNeYzAyXzQxNmJgXjUxYSNqM2hgMmRzZDFhLS1kLTBzcw%3D%3D\\u0026btag=c0000e00010000\\u0026cquery=101r_100B_100x_100z_100o\\u0026dy_q=1754361813\\u0026feature_id=dc6e471fd69cf67451806384e04f2b47\\u0026l=20250805104332288948511D5931AF76A4","https://v3-web.douyinvod.com/04221e98289b7a80e85e58aab3592079/68919a1e/video/tos/cn/tos-cn-ve-15/oAJGPHgCfAQe9gU8gD9o9JBa8EADFAYGxdaIZq/?a=6383\\u0026ch=10010\\u0026cr=3\\u0026dr=0\\u0026lr=all\\u0026cd=0%7C0%7C0%7C3\\u0026cv=1\\u0026br=3728\\u0026bt=3728\\u0026cs=0\\u0026ds=3\\u0026ft=GZnU0RqeffPdXP~ka1jNvAq-antLjrKYyVmCRkaml6C9UjVhWL6\\u0026mime_type=video_mp4\\u0026qs=0\\u0026rc=OzxkZmc2O2Y7ZWQ1Nzs0NEBpajZsaW85cjZ3MzMzNGkzM0BiNjNeYzAyXzQxNmJgXjUxYSNqM2hgMmRzZDFhLS1kLTBzcw%3D%3D\\u0026btag=c0000e00010000\\u0026cquery=100x_100z_100o_101r_100B\\u0026dy_q=1754361813\\u0026feature_id=dc6e471fd69cf67451806384e04f2b47\\u0026l=20250805104332288948511D5931AF76A4","https://www.douyin.com/aweme/v1/play/?video_id=v0300fg10000d04tg3vog65lcfki63mg\\u0026line=0\\u0026ratio=540p\\u0026watermark=1\\u0026media_type=4\\u0026vr_type=0\\u0026improve_bitrate=0\\u0026biz_sign=NRPI1lC4AlkgB1YZ_o3JxvAfESRKvePEcuaT8sozJ2uwTcZpBZpXm8NBobnT9VaaOzLa7CA0Ou-V1V2BgVoWftAS5U7GDGbNHaUZIZuaRMUGyO7s5wbVW7et0I2xs1hA\\u0026logo_name=aweme_diversion_search\\u0026source=PackSourceEnum_PUBLISH"],"width":720,"height":720,"data_size":13830960,"file_cs":"c:0-44144-1e39"}}',
    //       big_thumbs: [
    //         {
    //           img_num: 26,
    //           uri: "tos-cn-p-0015/oYxeIXBoAgNIG49tCEdFfDDAJP6DCFqgdDj2kA",
    //           img_url:
    //             "https://p3-sign.douyinpic.com/tos-cn-p-0015/oYxeIXBoAgNIG49tCEdFfDDAJP6DCFqgdDj2kA~tplv-noop.image?cquery=100B_100x_100z_100o_101r&dy_q=1754361813&l=20250805104332288948511D5931AF76A4&x-expires=1754372638&x-signature=DrKVF1gVF1g%2BbrZ8n7QRhI9JHr8%3D",
    //           img_x_size: 240,
    //           img_y_size: 136,
    //           img_x_len: 5,
    //           img_y_len: 5,
    //           duration: 25.968042,
    //           interval: 1,
    //           fext: "jpg",
    //           uris: [
    //             "tos-cn-p-0015/oYxeIXBoAgNIG49tCEdFfDDAJP6DCFqgdDj2kA",
    //             "tos-cn-p-0015/osNAkgoeA29DEPxAFdAAEIIDJgLDCVjBtEf5Fq",
    //           ],
    //           img_urls: [
    //             "https://p3-sign.douyinpic.com/tos-cn-p-0015/oYxeIXBoAgNIG49tCEdFfDDAJP6DCFqgdDj2kA~tplv-noop.image?cquery=100B_100x_100z_100o_101r&dy_q=1754361813&l=20250805104332288948511D5931AF76A4&x-expires=1754372638&x-signature=DrKVF1gVF1g%2BbrZ8n7QRhI9JHr8%3D",
    //             "https://p3-sign.douyinpic.com/tos-cn-p-0015/osNAkgoeA29DEPxAFdAAEIIDJgLDCVjBtEf5Fq~tplv-noop.image?cquery=100B_100x_100z_100o_101r&dy_q=1754361813&l=20250805104332288948511D5931AF76A4&x-expires=1754372638&x-signature=tL4KR1vVyhLn2KX8CoCqsRsu8jQ%3D",
    //           ],
    //         },
    //       ],
    //       video_model: "",
    //     },
    //     share_url:
    //       "https://www.iesdouyin.com/share/video/7496760665458953484/?region=CN&mid=7496760638081927946&u_code=jj95fjd6&did=MS4wLjABAAAA9BaozTVk2tPsswpnTKn2Rdxwxvwaw4OqWG7lK0mIBhvGg-Zhtj_y_KgVTFY1STgO&iid=MS4wLjABAAAANwkJuWIRFOzg5uCpDRpMj4OX-QryoDgn-yYlXQnRwQQ&with_sec_did=1&video_share_track_ver=&titleType=title&share_sign=oAK3VvTUACPVdUilGWju2SL1S1sHEzuuzy6tyUa4Tb0-&share_version=190500&ts=1754361813&from_aid=6383&from_ssr=1",
    //     user_digged: 0,
    //     statistics: {
    //       recommend_count: 6384,
    //       comment_count: 16712,
    //       digg_count: 346635,
    //       admire_count: 0,
    //       play_count: 0,
    //       share_count: 134322,
    //       collect_count: 16631,
    //     },
    //     status: {
    //       not_allow_soft_del_reason: "ab",
    //       is_delete: false,
    //       allow_share: true,
    //       review_result: {
    //         review_status: 0,
    //       },
    //       allow_friend_recommend_guide: true,
    //       part_see: 0,
    //       private_status: 0,
    //       listen_video_status: 2,
    //       in_reviewing: false,
    //       allow_self_recommend_to_friend: true,
    //       allow_friend_recommend: true,
    //       is_prohibited: false,
    //       enable_soft_delete: 0,
    //     },
    //     enable_comment_sticker_rec: false,
    //     text_extra: [],
    //     is_top: 1,
    //     personal_page_botton_diagnose_style: 0,
    //     share_info: {
    //       share_url:
    //         "https://www.iesdouyin.com/share/video/7496760665458953484/?region=CN&mid=7496760638081927946&u_code=jj95fjd6&did=MS4wLjABAAAA9BaozTVk2tPsswpnTKn2Rdxwxvwaw4OqWG7lK0mIBhvGg-Zhtj_y_KgVTFY1STgO&iid=MS4wLjABAAAANwkJuWIRFOzg5uCpDRpMj4OX-QryoDgn-yYlXQnRwQQ&with_sec_did=1&video_share_track_ver=&titleType=title&share_sign=oAK3VvTUACPVdUilGWju2SL1S1sHEzuuzy6tyUa4Tb0-&share_version=190500&ts=1754361813&from_aid=6383&from_ssr=1",
    //       share_link_desc:
    //         "3.53 Hip:/ w@F.UL 07/16 别人家的闺蜜：接你下班 我家的闺蜜：接你出道  %s 复制此链接，打开Dou音搜索，直接观看视频！",
    //     },
    //     is_from_ad_auth: false,
    //     video_labels: null,
    //     original_anchor_type: 15,
    //     is_ads: false,
    //     duration: 25967,
    //     aweme_type: 0,
    //     galileo_pad_textcrop: {
    //       ipad_d_h_cut_ratio: [2, 2],
    //       ipad_d_v_cut_ratio: [2, 2],
    //       android_d_h_cut_ratio: [2],
    //       android_d_v_cut_ratio: [2],
    //       version: 1,
    //     },
    //     douplus_user_type: 0,
    //     image_infos: null,
    //     risk_infos: {
    //       vote: false,
    //       warn: false,
    //       risk_sink: false,
    //       type: 0,
    //       content: "",
    //     },
    //     game_tag_info: {
    //       is_game: false,
    //     },
    //     friend_recommend_info: {
    //       friend_recommend_source: 10,
    //       label_user_list: null,
    //       disable_friend_recommend_guide_label: false,
    //     },
    //     position: null,
    //     uniqid_position: null,
    //     comment_list: null,
    //     author_user_id: 888870295051540,
    //     follow_shoot_clip_info: {
    //       clip_video_all: 7496760638081928000,
    //       clip_from_user: 7496760638081928000,
    //     },
    //     geofencing: [],
    //     entertainment_video_type: 2,
    //     aweme_listen_struct: {
    //       trace_info:
    //         '{"copyright_not_speech":"false","copyright_reason":"has_listen_cp_new","copyright_tag_hit":"","copyright_use_aed_default":"false","copyright_use_tag_default":"false","cp_ab":"true","desc":"","duration_over":"false","hit_high_risk":"false","media_type":"4","reason":"hit_ab_0","show":"false"}',
    //     },
    //     region: "CN",
    //     video_text: null,
    //     original: 0,
    //     collect_stat: 0,
    //     label_top_text: null,
    //     promotions: [],
    //     group_id: "7496760665458953484",
    //     prevent_download: false,
    //     nickname_position: null,
    //     challenge_position: null,
    //     publish_plus_alienation: {
    //       alienation_type: 0,
    //     },
    //     is_use_music: false,
    //     caption: "别人家的闺蜜：接你下班\n我家的闺蜜：接你出道",
    //     long_video: null,
    //     mv_info: null,
    //     can_cache_to_local: true,
    //     item_title: "",
    //     series_basic_info: {},
    //     interaction_stickers: null,
    //     flash_mob_trends: 0,
    //     origin_comment_ids: null,
    //     commerce_config_data: null,
    //     cf_assets_type: 0,
    //     video_control: {
    //       allow_download: true,
    //       share_type: 1,
    //       show_progress_bar: 0,
    //       draft_progress_bar: 0,
    //       allow_duet: true,
    //       allow_react: true,
    //       prevent_download_type: 0,
    //       allow_dynamic_wallpaper: true,
    //       timer_status: 1,
    //       allow_music: true,
    //       allow_stitch: true,
    //       allow_douplus: true,
    //       allow_share: true,
    //       share_grayed: false,
    //       download_ignore_visibility: true,
    //       duet_ignore_visibility: true,
    //       share_ignore_visibility: true,
    //       download_info: {
    //         level: 0,
    //       },
    //       duet_info: {
    //         level: 0,
    //       },
    //       allow_record: true,
    //       disable_record_reason: "",
    //       timer_info: {},
    //     },
    //     aweme_control: {
    //       can_forward: true,
    //       can_share: true,
    //       can_comment: true,
    //       can_show_comment: true,
    //     },
    //     is_moment_history: 0,
    //     mix_info: {
    //       mix_id: "7528287669684537382",
    //       mix_name: "行车“疯”景",
    //       cover_url: {
    //         uri: "douyin-user-image-file/1a1dd7b1e7c40864e8dc60118fa1e9d8",
    //         url_list: [
    //           "https://p95-sz-sign.douyinpic.com/obj/douyin-user-image-file/1a1dd7b1e7c40864e8dc60118fa1e9d8?lk3s=138a59ce&x-expires=1754380800&x-signature=VWkfuwX6F8BoYGR1wUgJnbMn7Aw%3D&from=327834062&s=PackSourceEnum_PUBLISH&se=false&sc=mix_cover&biz_tag=aweme_mix&l=20250805104332288948511D5931AF76A4",
    //           "https://p26-sign.douyinpic.com/obj/douyin-user-image-file/1a1dd7b1e7c40864e8dc60118fa1e9d8?lk3s=138a59ce&x-expires=1754380800&x-signature=3AaIOjwwai7jO3GRZ%2FBdJYzboR4%3D&from=327834062&s=PackSourceEnum_PUBLISH&se=false&sc=mix_cover&biz_tag=aweme_mix&l=20250805104332288948511D5931AF76A4",
    //           "https://p9-sign.douyinpic.com/obj/douyin-user-image-file/1a1dd7b1e7c40864e8dc60118fa1e9d8?lk3s=138a59ce&x-expires=1754380800&x-signature=bhNXUBtZNhaVT6OjY2evBWwjBnQ%3D&from=327834062&s=PackSourceEnum_PUBLISH&se=false&sc=mix_cover&biz_tag=aweme_mix&l=20250805104332288948511D5931AF76A4",
    //         ],
    //         width: 720,
    //         height: 720,
    //       },
    //       status: {
    //         status: 2,
    //         is_collected: 0,
    //       },
    //       statis: {
    //         play_vv: 0,
    //         collect_vv: 0,
    //         current_episode: 4,
    //         updated_to_episode: 21,
    //       },
    //       desc: "",
    //       extra:
    //         '{"audit_locktime":1753640522,"ban_fields":[],"create_source":0,"enter_from":"app","first_reviewed":1,"is_author_set_self_see":0,"last_added_item_time":1753667012,"mix_ad_info":{"copy_right_item_count":21,"music_physical_game_count":6,"risk_copy_right_item_count":0},"mix_pic_type":0,"next_info":{"cover":"douyin-user-image-file/1a1dd7b1e7c40864e8dc60118fa1e9d8","desc":"","name":"行车“疯”景"},"pic_item_count":0,"segmentation":"敌 蜜 好 起来 了","top_item_content_label":{"2023":6,"2029":15},"total_duration":444}',
    //       share_info: {
    //         share_url:
    //           "https://www.iesdouyin.com/share/mix/detail/7528287669684537382/?schema_type=24&object_id=7528287669684537382&from_ssr=1",
    //         share_weibo_desc:
    //           "8.99 02/17 BtR:/ N@J.vs 我正在看【行车“疯”景】长按复制此条消息，打开抖音搜索，一起看合集~",
    //         share_desc:
    //           "1.56 02/06 l@p.dn goq:/ 我正在看【行车“疯”景】长按复制此条消息，打开抖音搜索，一起看合集~",
    //         share_title: "这么有趣的合集，不能只有我一个人知道吧",
    //         share_title_myself: "",
    //         share_title_other: "",
    //         share_desc_info:
    //           "8.99 02/17 BtR:/ N@J.vs 我正在看【行车“疯”景】长按复制此条消息，打开抖音搜索，一起看合集~",
    //       },
    //       mix_type: 0,
    //       create_time: 1752816063,
    //       update_time: 1753667012,
    //       ids: null,
    //       watched_item: "",
    //       is_serial_mix: 0,
    //       mix_pic_type: 0,
    //       enable_ad: 0,
    //       is_iaa: 0,
    //       paid_episodes: null,
    //     },
    //     is_new_text_mode: 0,
    //     anchor_info: {
    //       type: 15,
    //       id: "aw7c4z4ej0o3efzd",
    //       icon: {
    //         uri: "aweme-jupiter/18c4cde71e518e1c319cfadb5e140ed7.png",
    //         url_list: [
    //           "https://p3-pc-sign.douyinpic.com/obj/aweme-jupiter/18c4cde71e518e1c319cfadb5e140ed7.png?lk3s=138a59ce&x-expires=1755568800&x-signature=fd1uL9qB8%2BMHUjWLMNyD6hLP9OE%3D&from=327834062",
    //           "https://p9-pc-sign.douyinpic.com/obj/aweme-jupiter/18c4cde71e518e1c319cfadb5e140ed7.png?lk3s=138a59ce&x-expires=1755568800&x-signature=jC8zl%2BJSKLAPa%2FEU1PgivPgnOEs%3D&from=327834062",
    //         ],
    //         width: 720,
    //         height: 720,
    //         url_key:
    //           "https://p26-sign.douyinpic.com/obj/aweme-jupiter/18c4cde71e518e1c319cfadb5e140ed7.png?x-expires=1754618400&x-signature=uSKm%2BCyYx%2F0mYC4EYs62bIToExw%3D&from=2347263168",
    //       },
    //       title: "",
    //       title_tag: "剪映",
    //       content: "{}",
    //       style_info: {
    //         default_icon:
    //           "https://p26-sign.douyinpic.com/obj/aweme-jupiter/18c4cde71e518e1c319cfadb5e140ed7.png?x-expires=1754618400&x-signature=uSKm%2BCyYx%2F0mYC4EYs62bIToExw%3D&from=2347263168",
    //         scene_icon:
    //           '{"feed":"https://p26-sign.douyinpic.com/obj/aweme-jupiter/18c4cde71e518e1c319cfadb5e140ed7.png?x-expires=1754618400&x-signature=uSKm%2BCyYx%2F0mYC4EYs62bIToExw%3D&from=2347263168"}',
    //         extra: "{}",
    //       },
    //       extra:
    //         '{"base":{"client_key":"aw7c4z4ej0o3efzd","app_name":"剪映","app_icon":"https://p3-sign.douyinpic.com/obj/douyin-open-platform/b22313de3911b1169d1064198d589bc1?lk3s=4ced739e\\u0026x-expires=1769911200\\u0026x-signature=Zg0tTWKnhCm0wKUqGHYsgIELH%2FA%3D\\u0026from=1290630046"},"anchor":{"name":"轻松加字幕自动标重点","icon":"https://p3-sign.douyinpic.com/obj/douyin-web-image/b54d7ae38b1ea033b610bf53cf53ae76?lk3s=9e7df69c\\u0026x-expires=1754380800\\u0026x-signature=laMU3ZRpy1HezY%2F%2Buir7L8epiqg%3D\\u0026from=2659055260","url":"https://lv.ulikecam.com/act/lv-feed?app_id=6383\\u0026aweme_item_id=7496760665458953484\\u0026capabilities=subtitle_recognition\\u0026hide_nav_bar=1\\u0026lv_log_extra=%7B%22anchor_type%22%3A%22edit_gameplay%22%7D\\u0026new_style_id=\\u0026new_template_id=\\u0026should_full_screen=true\\u0026template_music_id=\\u0026type=2","new_url":"https://api.amemv.com/magic/eco/runtime/release/6461f944e84c15036369f2a8?appType=douyinpc\\u0026background_color=linear-gradient%28180deg%2C%20%231D6AC4%200.01%25%2C%20%23000%2099.99%25%29\\u0026bundle=landing%2Ftemplate.js\\u0026call_link=vega%3A%2F%2Fcom.ies.videocut%2Fmain%2Fdraft%2Fnew_draft%3Ffrom%3Ddouyin_anchor_middle_page\\u0026channel=anchor_landing_lynx\\u0026lv_log_extra=%7B%22anchor_type%22%3A%22edit_gameplay%22%7D\\u0026magic_page_no=1\\u0026material_type=1\\u0026server_jump_lv_params=%7B%22ug_open_third_app_cert_id%22%3A%221023913986%22%7D\\u0026type=2","icon_uri":"aweme-jupiter/18c4cde71e518e1c319cfadb5e140ed7.png","title_tag":"剪映","is_template":false,"log_extra":"{\\"image_anchor_type\\":\\"edit_gameplay\\",\\"image_anchor_extra\\":\\"{\\\\\\"anchor_key\\\\\\":\\\\\\"subtitle_recognition\\\\\\",\\\\\\"anchor_name\\\\\\":\\\\\\"capcut_app\\\\\\",\\\\\\"anchor_type\\\\\\":\\\\\\"edit_gameplay\\\\\\"}\\",\\"new_anchor_type\\":\\"edit_gameplay\\",\\"is_sdk\\":\\"0\\",\\"anchor_key\\":\\"subtitle_recognition\\",\\"anchor_type\\":\\"edit_gameplay\\"}"},"share":{"share_id":"1830263780210731","style_id":"1815354849617962"}}',
    //       log_extra:
    //         '{"image_anchor_type":"edit_gameplay","image_anchor_extra":"{\\"anchor_key\\":\\"subtitle_recognition\\",\\"anchor_name\\":\\"capcut_app\\",\\"anchor_type\\":\\"edit_gameplay\\"}","new_anchor_type":"edit_gameplay","is_sdk":"0","anchor_key":"subtitle_recognition","anchor_type":"edit_gameplay"}',
    //     },
    //     trends_infos: null,
    //     component_control: {
    //       data_source_url: "/aweme/v1/web/aweme/post/",
    //     },
    //     anchors: null,
    //     hybrid_label: null,
    //     geofencing_regions: null,
    //     is_moment_story: 0,
    //     video_share_edit_status: 0,
    //     is_story: 0,
    //     aweme_type_tags: "",
    //     mark_largely_following: false,
    //     caption_template_id: 0,
    //     cover_labels: null,
    //     entertainment_video_paid_way: {
    //       paid_ways: [],
    //       paid_type: 0,
    //       enable_use_new_ent_data: false,
    //     },
    //     chapter_bar_color: null,
    //     guide_btn_type: 0,
    //     shoot_way: "direct_shoot",
    //     is_24_story: 0,
    //     images: null,
    //     relation_labels: null,
    //     horizontal_type: 1,
    //     trends_event_track: "{}",
    //     impression_data: {
    //       group_id_list_a: [],
    //       group_id_list_b: [],
    //       similar_id_list_a: null,
    //       similar_id_list_b: null,
    //       group_id_list_c: [],
    //       group_id_list_d: [],
    //     },
    //     origin_duet_resource_uri: "",
    //     xigua_base_info: {
    //       status: 0,
    //       star_altar_order_id: 0,
    //       star_altar_type: 0,
    //       item_id: 0,
    //     },
    //     libfinsert_task_id: "",
    //     social_tag_list: null,
    //     suggest_words: {
    //       suggest_words: [
    //         {
    //           words: [
    //             {
    //               word: "藤椒很辣酒吧喊麦",
    //               word_id: "7196639604874941752",
    //               info: '{"End":0,"Start":0,"ecpm_boost_tag":false,"log_pb":"","qrec_for_search":"{\\"search_result_scores\\":\\"{\\\\\\"search_result_click\\\\\\":-10000.0,\\\\\\"search_video_play\\\\\\":-10000.0,\\\\\\"search_duration_time\\\\\\":-10000.0,\\\\\\"search_change_query\\\\\\":-10000.0}\\"}"}',
    //             },
    //           ],
    //           scene: "detail_inbox_rex",
    //           icon_url: "",
    //           hint_text: "",
    //           extra_info: '{"resp_from":"hit_cache"}',
    //         },
    //         {
    //           words: [
    //             {
    //               word: "藤椒很辣酒吧喊麦",
    //               word_id: "7196639604874941752",
    //               info: '{"End":0,"Start":0,"ecpm_boost_tag":false,"log_pb":"","qrec_for_search":"{\\"search_result_scores\\":\\"{\\\\\\"search_result_click\\\\\\":-10000.0,\\\\\\"search_video_play\\\\\\":-10000.0,\\\\\\"search_duration_time\\\\\\":-10000.0,\\\\\\"search_change_query\\\\\\":-10000.0}\\"}"}',
    //             },
    //             {
    //               word: "女mc酒吧现场喊麦炸开全场",
    //               word_id: "7017933889663243524",
    //               info: '{"End":0,"Start":0,"ecpm_boost_tag":false,"log_pb":"","qrec_for_search":"{\\"search_result_scores\\":\\"{\\\\\\"search_result_click\\\\\\":-10000.0,\\\\\\"search_video_play\\\\\\":-10000.0,\\\\\\"search_duration_time\\\\\\":-10000.0,\\\\\\"search_change_query\\\\\\":-10000.0}\\"}"}',
    //             },
    //           ],
    //           scene: "comment_top_rec",
    //           icon_url: "",
    //           hint_text: "大家都在搜：",
    //           extra_info: '{"resp_from":"hit_cache"}',
    //         },
    //       ],
    //     },
    //     show_follow_button: {},
    //     duet_aggregate_in_music_tab: false,
    //     is_duet_sing: false,
    //     comment_permission_info: {
    //       comment_permission_status: 0,
    //       can_comment: true,
    //       item_detail_entry: false,
    //       press_entry: false,
    //       toast_guide: false,
    //     },
    //     original_images: null,
    //     series_paid_info: {
    //       series_paid_status: 0,
    //       item_price: 0,
    //     },
    //     img_bitrate: null,
    //     comment_gid: 7496760665458953000,
    //     image_album_music_info: {
    //       begin_time: -1,
    //       end_time: -1,
    //       volume: -1,
    //     },
    //     video_tag: [
    //       {
    //         tag_id: 2029,
    //         tag_name: "随拍",
    //         level: 1,
    //       },
    //       {
    //         tag_id: 2029003,
    //         tag_name: "生活记录",
    //         level: 2,
    //       },
    //       {
    //         tag_id: 2029003001,
    //         tag_name: "日常vlog",
    //         level: 3,
    //       },
    //     ],
    //     is_collects_selected: 0,
    //     chapter_list: null,
    //     feed_comment_config: {
    //       input_config_text: "善语结善缘，恶言伤人心",
    //       author_audit_status: 0,
    //       common_flags:
    //         '{"item_author_nickname":"藤椒很麻呀²³⁵⁸ 🌶️","video_labels_v2_tag1":"汽车","video_labels_v2_tag2":"汽车周边"}',
    //     },
    //     is_image_beat: false,
    //     dislike_dimension_list: null,
    //     standard_bar_info_list: null,
    //     photo_search_entrance: {
    //       ecom_type: 0,
    //     },
    //     danmaku_control: {
    //       enable_danmaku: true,
    //       post_privilege_level: 0,
    //       is_post_denied: false,
    //       post_denied_reason: "",
    //       skip_danmaku: false,
    //       danmaku_cnt: 474,
    //       activities: [
    //         {
    //           id: 1224,
    //           type: 1,
    //         },
    //       ],
    //       pass_through_params: "{}",
    //       smart_mode_decision: 0,
    //       first_danmaku_offset: 0,
    //       last_danmaku_offset: 25859,
    //     },
    //     is_life_item: false,
    //     image_list: null,
    //     component_info_v2: '{"desc_lines_limit":0,"hide_marquee":false}',
    //     item_warn_notification: {
    //       type: 0,
    //       show: false,
    //       content: "",
    //     },
    //     origin_text_extra: null,
    //     disable_relation_bar: 0,
    //     packed_clips: null,
    //     author_mask_tag: 0,
    //     user_recommend_status: 1,
    //     collection_corner_mark: 0,
    //     is_share_post: false,
    //     image_comment: {},
    //     visual_search_info: {
    //       is_show_img_entrance: false,
    //       is_ecom_img: false,
    //       is_high_accuracy_ecom: false,
    //       is_high_recall_ecom: false,
    //     },
    //     tts_id_list: null,
    //     ref_tts_id_list: null,
    //     voice_modify_id_list: null,
    //     ref_voice_modify_id_list: null,
    //     authentication_token:
    //       "MS4wLjAAAAAAfFHwRrxYk3Tcwm9b61oqMb_JgMDRYCjJV03BiAk3zCIOvn_pSLtoJn7APhFjm4kQnZSXFGPYgUCNyeRkEFPPBfhsuGoiqxasiDivTsVBBWUkXL0P9LVel5atsN2_q_3TfMqI7SwuTVtM2f47Y6ae3bfcrexu-oZd5aDZSvusBRgV86RxAjcW1zMLTjyL4TyMDKiORTwtMQKYrjynx4qCsidTv1g65cL0U4s_c7qauBtS8Z9IuC1dSOiIEoSoyZ5JHbnLrL6wdjGwFxPtse_-5Q",
    //     video_game_data_channel_config: {},
    //     dislike_dimension_list_v2: null,
    //     distribute_circle: {
    //       distribute_type: 0,
    //       campus_block_interaction: false,
    //       is_campus: false,
    //     },
    //     image_crop_ctrl: 0,
    //     yumme_recreason: null,
    //     slides_music_beats: null,
    //     jump_tab_info_list: null,
    //     media_type: 4,
    //     play_progress: {
    //       play_progress: 0,
    //       last_modified_time: 0,
    //     },
    //     reply_smart_emojis: null,
    //     activity_video_type: 0,
    //     boost_status: 0,
    //     create_scale_type: null,
    //     entertainment_product_info: {
    //       sub_title: null,
    //       market_info: {
    //         limit_free: {
    //           in_free: false,
    //         },
    //         marketing_tag: null,
    //       },
    //     },
    //   },
    //   {
    //     aweme_id: "7490079748131933459",
    //     desc: "大小姐驾到 通通闪开🥳#给生活找点乐子自嗨模式开启 #志同道合的人才会喜欢同一片风景",
    //     create_time: 1743920103,
    //     author: {
    //       uid: "888870295051540",
    //       card_entries: null,
    //       nickname: "藤椒很麻呀²³⁵⁸ 🌶️",
    //       ban_user_functions: null,
    //       avatar_schema_list: null,
    //       avatar_thumb: {
    //         uri: "100x100/aweme-avatar/douyin-user-image-file_4560639592011267deb384bdc7ebdc90",
    //         url_list: [
    //           "https://p3-pc.douyinpic.com/aweme/100x100/aweme-avatar/douyin-user-image-file_4560639592011267deb384bdc7ebdc90.jpeg?from=327834062",
    //         ],
    //         width: 720,
    //         height: 720,
    //       },
    //       profile_mob_params: null,
    //       personal_tag_list: null,
    //       follow_status: 0,
    //       follower_list_secondary_information_struct: null,
    //       identity_labels: null,
    //       endorsement_info_list: null,
    //       custom_verify: "",
    //       white_cover_url: null,
    //       im_role_ids: null,
    //       user_permissions: null,
    //       batch_unfollow_relation_desc: null,
    //       homepage_bottom_toast: null,
    //       share_info: {
    //         share_url: "",
    //         share_weibo_desc: "",
    //         share_desc: "",
    //         share_title: "",
    //         share_qrcode_url: {
    //           uri: "",
    //           url_list: [],
    //           width: 720,
    //           height: 720,
    //         },
    //         share_title_myself: "",
    //         share_title_other: "",
    //         share_desc_info: "",
    //       },
    //       sec_uid: "MS4wLjABAAAA250wWQH1y6yH9TFbYBQIoal2suwu_01R6sE-OPeWaXk",
    //       can_set_geofencing: null,
    //       link_item_list: null,
    //       enterprise_verify_reason: "",
    //       is_ad_fake: false,
    //       private_relation_list: null,
    //       card_entries_not_display: null,
    //       batch_unfollow_contain_tabs: null,
    //       verification_permission_ids: null,
    //       card_sort_priority: null,
    //       risk_notice_text: "",
    //       display_info: null,
    //       prevent_download: false,
    //       contrail_list: null,
    //       need_points: null,
    //       not_seen_item_id_list: null,
    //       follower_status: 0,
    //       special_people_labels: null,
    //       data_label_list: null,
    //       not_seen_item_id_list_v2: null,
    //       cover_url: [
    //         {
    //           uri: "c8510002be9a3a61aad2",
    //           url_list: [
    //             "https://p3-pc-sign.douyinpic.com/obj/c8510002be9a3a61aad2?lk3s=138a59ce&x-expires=1755568800&x-signature=zjtpTDaJ%2F%2FBD0y4xaOOVtxXUpvw%3D&from=327834062",
    //             "https://p9-pc-sign.douyinpic.com/obj/c8510002be9a3a61aad2?lk3s=138a59ce&x-expires=1755568800&x-signature=9e4lchR%2BrJTb2P39GcWffojuB5U%3D&from=327834062",
    //           ],
    //           width: 720,
    //           height: 720,
    //         },
    //       ],
    //       offline_info_list: null,
    //       signature_extra: null,
    //       text_extra: null,
    //       interest_tags: null,
    //       cf_list: null,
    //       user_tags: null,
    //       account_cert_info: '{"is_biz_account":1}',
    //       familiar_visitor_user: null,
    //       creator_tag_list: null,
    //     },
    //     music: {
    //       id: 7490079452254785000,
    //       id_str: "7490079452254784310",
    //       title: "@藤椒很麻呀²³⁵⁸ 🌶️创作的原声",
    //       author: "藤椒很麻呀²³⁵⁸ 🌶️",
    //       album: "",
    //       cover_hd: {
    //         uri: "1080x1080/aweme-avatar/douyin-user-image-file_4560639592011267deb384bdc7ebdc90",
    //         url_list: [
    //           "https://p3-pc.douyinpic.com/aweme/1080x1080/aweme-avatar/douyin-user-image-file_4560639592011267deb384bdc7ebdc90.jpeg?from=327834062",
    //         ],
    //         width: 720,
    //         height: 720,
    //       },
    //       cover_large: {
    //         uri: "1080x1080/aweme-avatar/douyin-user-image-file_4560639592011267deb384bdc7ebdc90",
    //         url_list: [
    //           "https://p3-pc.douyinpic.com/aweme/1080x1080/aweme-avatar/douyin-user-image-file_4560639592011267deb384bdc7ebdc90.jpeg?from=327834062",
    //         ],
    //         width: 720,
    //         height: 720,
    //       },
    //       cover_medium: {
    //         uri: "720x720/aweme-avatar/douyin-user-image-file_4560639592011267deb384bdc7ebdc90",
    //         url_list: [
    //           "https://p3-pc.douyinpic.com/aweme/720x720/aweme-avatar/douyin-user-image-file_4560639592011267deb384bdc7ebdc90.jpeg?from=327834062",
    //         ],
    //         width: 720,
    //         height: 720,
    //       },
    //       cover_thumb: {
    //         uri: "100x100/aweme-avatar/douyin-user-image-file_4560639592011267deb384bdc7ebdc90",
    //         url_list: [
    //           "https://p3-pc.douyinpic.com/aweme/100x100/aweme-avatar/douyin-user-image-file_4560639592011267deb384bdc7ebdc90.jpeg?from=327834062",
    //         ],
    //         width: 720,
    //         height: 720,
    //       },
    //       play_url: {
    //         uri: "https://sf5-hl-cdn-tos.douyinstatic.com/obj/ies-music/7490079783800376105.mp3",
    //         url_list: [
    //           "https://sf5-hl-cdn-tos.douyinstatic.com/obj/ies-music/7490079783800376105.mp3",
    //           "https://sf5-hl-ali-cdn-tos.douyinstatic.com/obj/ies-music/7490079783800376105.mp3",
    //         ],
    //         width: 720,
    //         height: 720,
    //         url_key: "7490079452254784310",
    //       },
    //       schema_url: "",
    //       source_platform: 23,
    //       start_time: 0,
    //       end_time: 0,
    //       duration: 31,
    //       extra:
    //         '{"aed_music_score":0.43,"aed_singing_score":0.48,"aggregate_exempt_conf":[],"beats":{},"cover_colors":null,"douyin_beats_info":{},"dsp_switch":0,"extract_item_id":7490079748131933459,"has_edited":0,"hit_high_follow_auto":false,"hit_high_follow_extend":false,"hit_high_follow_original":false,"hotsoon_review_time":-1,"is_aed_music":1,"is_high_follow_user":false,"is_red":0,"is_subsidy_exp":false,"music_label_id":null,"music_tagging":{"AEDs":null,"Genres":null,"Instruments":null,"Languages":null,"Moods":null,"SingingVersions":null,"Themes":null},"review_unshelve_reason":0,"reviewed":0,"schedule_search_time":0,"uniqa_speech_score":0.07,"with_aed_model":1}',
    //       user_count: 0,
    //       position: null,
    //       collect_stat: 0,
    //       status: 1,
    //       offline_desc: "",
    //       owner_id: "888870295051540",
    //       owner_nickname: "藤椒很麻呀²³⁵⁸ 🌶️",
    //       is_original: false,
    //       mid: "7490079452254784310",
    //       binded_challenge_id: 0,
    //       redirect: false,
    //       is_restricted: false,
    //       author_deleted: false,
    //       is_del_video: false,
    //       is_video_self_see: false,
    //       owner_handle: "75559455j",
    //       author_position: null,
    //       prevent_download: false,
    //       strong_beat_url: {
    //         uri: "https://sf5-hl-cdn-tos.douyinstatic.com/obj/ies-music/pattern/662d5ad4e66ef5f30b756bee751c6c65.json",
    //         url_list: [
    //           "https://sf5-hl-cdn-tos.douyinstatic.com/obj/ies-music/pattern/662d5ad4e66ef5f30b756bee751c6c65.json",
    //           "https://sf5-hl-ali-cdn-tos.douyinstatic.com/obj/ies-music/pattern/662d5ad4e66ef5f30b756bee751c6c65.json",
    //         ],
    //         width: 720,
    //         height: 720,
    //       },
    //       unshelve_countries: null,
    //       prevent_item_download_status: 0,
    //       external_song_info: [],
    //       sec_uid: "MS4wLjABAAAA250wWQH1y6yH9TFbYBQIoal2suwu_01R6sE-OPeWaXk",
    //       avatar_thumb: {
    //         uri: "100x100/aweme-avatar/douyin-user-image-file_4560639592011267deb384bdc7ebdc90",
    //         url_list: [
    //           "https://p3-pc.douyinpic.com/aweme/100x100/aweme-avatar/douyin-user-image-file_4560639592011267deb384bdc7ebdc90.jpeg?from=327834062",
    //         ],
    //         width: 720,
    //         height: 720,
    //       },
    //       avatar_medium: {
    //         uri: "720x720/aweme-avatar/douyin-user-image-file_4560639592011267deb384bdc7ebdc90",
    //         url_list: [
    //           "https://p3-pc.douyinpic.com/aweme/720x720/aweme-avatar/douyin-user-image-file_4560639592011267deb384bdc7ebdc90.jpeg?from=327834062",
    //         ],
    //         width: 720,
    //         height: 720,
    //       },
    //       avatar_large: {
    //         uri: "1080x1080/aweme-avatar/douyin-user-image-file_4560639592011267deb384bdc7ebdc90",
    //         url_list: [
    //           "https://p3-pc.douyinpic.com/aweme/1080x1080/aweme-avatar/douyin-user-image-file_4560639592011267deb384bdc7ebdc90.jpeg?from=327834062",
    //         ],
    //         width: 720,
    //         height: 720,
    //       },
    //       preview_start_time: 0,
    //       preview_end_time: 0,
    //       is_commerce_music: false,
    //       is_original_sound: true,
    //       audition_duration: 31,
    //       shoot_duration: 31,
    //       reason_type: 0,
    //       artists: [],
    //       lyric_short_position: null,
    //       mute_share: false,
    //       tag_list: null,
    //       dmv_auto_show: false,
    //       is_pgc: false,
    //       is_matched_metadata: false,
    //       is_audio_url_with_cookie: false,
    //       music_chart_ranks: null,
    //       can_background_play: true,
    //       music_status: 1,
    //       video_duration: 31,
    //       pgc_music_type: 2,
    //       author_status: 1,
    //       search_impr: {
    //         entity_id: "7490079452254784310",
    //       },
    //       artist_user_infos: null,
    //       dsp_status: 10,
    //       musician_user_infos: null,
    //       music_collect_count: 0,
    //       music_cover_atmosphere_color_value: "",
    //       show_origin_clip: false,
    //     },
    //     douplus_user_type: 0,
    //     video: {
    //       play_addr: {
    //         uri: "v0300fg10000cvp1nffog65kacq8bn7g",
    //         url_list: [
    //           "https://v95-web-sz.douyinvod.com/6e32e52ae7b43f97ca3cf2b4c3cb7886/68919a24/video/tos/cn/tos-cn-ve-15c001-alinc2/oUeP6X7fBcG5IyWIoKLd7gfoB8tNRACRDcAGTA/?a=6383&ch=10010&cr=3&dr=0&lr=all&cd=0%7C0%7C0%7C3&cv=1&br=2965&bt=2965&cs=0&ds=4&ft=GZnU0RqeffPdXP~ka1jNvAq-antLjrKYyVmCRkaml6C9UjVhWL6&mime_type=video_mp4&qs=0&rc=PGZlPDc5OTo1NzY2Nmk7NkBpanE7Zm45cmk0eTMzNGkzM0AxMS8xYTBeNjExLWMwYDJiYSM0X25eMmRja21gLS1kLTBzcw%3D%3D&btag=c0000e00018000&cquery=100o_101r_100B_100x_100z&dy_q=1754361813&feature_id=46a7bb47b4fd1280f3d3825bf2b29388&l=20250805104332288948511D5931AF76A4",
    //           "https://v3-web.douyinvod.com/34feb51b7ee905a67ba410eba3d5d897/68919a24/video/tos/cn/tos-cn-ve-15c001-alinc2/oUeP6X7fBcG5IyWIoKLd7gfoB8tNRACRDcAGTA/?a=6383&ch=10010&cr=3&dr=0&lr=all&cd=0%7C0%7C0%7C3&cv=1&br=2965&bt=2965&cs=0&ds=4&ft=GZnU0RqeffPdXP~ka1jNvAq-antLjrKYyVmCRkaml6C9UjVhWL6&mime_type=video_mp4&qs=0&rc=PGZlPDc5OTo1NzY2Nmk7NkBpanE7Zm45cmk0eTMzNGkzM0AxMS8xYTBeNjExLWMwYDJiYSM0X25eMmRja21gLS1kLTBzcw%3D%3D&btag=c0000e00018000&cquery=101r_100B_100x_100z_100o&dy_q=1754361813&feature_id=46a7bb47b4fd1280f3d3825bf2b29388&l=20250805104332288948511D5931AF76A4",
    //           "https://www.douyin.com/aweme/v1/play/?video_id=v0300fg10000cvp1nffog65kacq8bn7g&line=0&file_id=e358cf33f303444297a636d4492b4c49&sign=348ed2bbef66c7f604c8aa1ce8c1ab5a&is_play_url=1&source=PackSourceEnum_PUBLISH",
    //         ],
    //         width: 1920,
    //         height: 1080,
    //         url_key: "v0300fg10000cvp1nffog65kacq8bn7g_h264_1080p_3036649",
    //         data_size: 12058157,
    //         file_hash: "348ed2bbef66c7f604c8aa1ce8c1ab5a",
    //         file_cs:
    //           "c:0-27578-105d|d:0-6029077-8faa,6029078-12058156-6958|a:v0300fg10000cvp1nffog65kacq8bn7g",
    //       },
    //       cover: {
    //         uri: "tos-cn-i-0813/oIa9u8EHAAp3XkDeAkvlN8gIDfAEFAAuUCAnhQ",
    //         url_list: [
    //           "https://p3-pc-sign.douyinpic.com/tos-cn-i-0813/oIa9u8EHAAp3XkDeAkvlN8gIDfAEFAAuUCAnhQ~tplv-dy-cropcenter:323:430.jpeg?lk3s=138a59ce&x-expires=2069719200&x-signature=nxtYoOCopButhjG05ASGYdw46w4%3D&from=327834062&s=PackSourceEnum_PUBLISH&se=true&sh=323_430&sc=cover&biz_tag=pcweb_cover&l=20250805104332288948511D5931AF76A4",
    //           "https://p3-pc-sign.douyinpic.com/obj/tos-cn-i-0813/oIa9u8EHAAp3XkDeAkvlN8gIDfAEFAAuUCAnhQ?lk3s=138a59ce&x-expires=2069719200&x-signature=68LDC6qk4xqYw96arCd9vV26y5E%3D&from=327834062&s=PackSourceEnum_PUBLISH&se=false&sc=cover&biz_tag=pcweb_cover&l=20250805104332288948511D5931AF76A4",
    //           "https://p9-pc-sign.douyinpic.com/obj/tos-cn-i-0813/oIa9u8EHAAp3XkDeAkvlN8gIDfAEFAAuUCAnhQ?lk3s=138a59ce&x-expires=2069719200&x-signature=36boh8k%2BxtE9LXvEjmVN8sL6k4s%3D&from=327834062&s=PackSourceEnum_PUBLISH&se=false&sc=cover&biz_tag=pcweb_cover&l=20250805104332288948511D5931AF76A4",
    //         ],
    //         width: 720,
    //         height: 720,
    //       },
    //       height: 2160,
    //       width: 3840,
    //       dynamic_cover: {
    //         uri: "tos-cn-i-0813/oIa9u8EHAAp3XkDeAkvlN8gIDfAEFAAuUCAnhQ",
    //         url_list: [
    //           "https://p3-pc-sign.douyinpic.com/obj/tos-cn-i-0813/oIa9u8EHAAp3XkDeAkvlN8gIDfAEFAAuUCAnhQ?lk3s=138a59ce&x-expires=1755568800&x-signature=HCBrryLk1VGKn29TniauCJlVgM8%3D&from=327834062_large&s=PackSourceEnum_PUBLISH&se=false&sc=dynamic_cover&biz_tag=pcweb_cover&l=20250805104332288948511D5931AF76A4",
    //           "https://p9-pc-sign.douyinpic.com/obj/tos-cn-i-0813/oIa9u8EHAAp3XkDeAkvlN8gIDfAEFAAuUCAnhQ?lk3s=138a59ce&x-expires=1755568800&x-signature=TiPGtWS1pC84V97ZPIjIX2OuUAY%3D&from=327834062_large&s=PackSourceEnum_PUBLISH&se=false&sc=dynamic_cover&biz_tag=pcweb_cover&l=20250805104332288948511D5931AF76A4",
    //         ],
    //         width: 720,
    //         height: 720,
    //       },
    //       origin_cover: {
    //         uri: "tos-cn-p-0015/ooGTkeedGIcDPLZBMPRCA7G8I5gBNgNA7Xfgos",
    //         url_list: [
    //           "https://p3-pc-sign.douyinpic.com/tos-cn-p-0015/ooGTkeedGIcDPLZBMPRCA7G8I5gBNgNA7Xfgos~tplv-dy-360p.jpeg?lk3s=138a59ce&x-expires=1755568800&x-signature=QYE5doXaPHXFtxx7%2FlpkqvyufFc%3D&from=327834062&s=PackSourceEnum_PUBLISH&se=false&sc=origin_cover&biz_tag=pcweb_cover&l=20250805104332288948511D5931AF76A4",
    //           "https://p9-pc-sign.douyinpic.com/tos-cn-p-0015/ooGTkeedGIcDPLZBMPRCA7G8I5gBNgNA7Xfgos~tplv-dy-360p.jpeg?lk3s=138a59ce&x-expires=1755568800&x-signature=tb8lCCbuir9lVN875eFMbL%2B%2Fn4Y%3D&from=327834062&s=PackSourceEnum_PUBLISH&se=false&sc=origin_cover&biz_tag=pcweb_cover&l=20250805104332288948511D5931AF76A4",
    //         ],
    //         width: 640,
    //         height: 360,
    //       },
    //       ratio: "1080p",
    //       format: "mp4",
    //       meta: '{"bright_ratio_mean":"0.1147","brightness_mean":"131.9256","diff_overexposure_ratio":"0.0182","enable_manual_ladder":"1","format":"mp4","gear_vqm":"{\\"1080p_720p\\":2,\\"720p_540p\\":2}","hrids":"500000008","is_spatial_video":"0","isad":"0","loudness":"-16.3","overexposure_ratio_mean":"0.0857","peak":"0.66069","qprf":"1.000","sdgs":"[\\"adapt_lowest_4_1\\",\\"normal_1080_0\\",\\"adapt_lowest_1440_1\\",\\"normal_540_0\\",\\"normal_720_0\\",\\"low_720_0\\",\\"low_540_0\\",\\"1080_1_1\\",\\"lower_540_0\\",\\"720_1_1\\",\\"adapt_low_540_0\\",\\"720_2_1\\",\\"540_2_1\\",\\"540_3_1\\",\\"540_4_1\\"]","sr_potential":"{\\"v1.0\\":{\\"score\\":37.597}}","sr_score":"1.000","std_brightness":"12.5254","strategy_tokens":"[\\"ladder_group_remove_1080_1_night_peak\\",\\"strategy_iteration_model_ab02_0117\\",\\"strategy_iteration_model_ab01_0117\\"]","title_info":"{\\"bottom_res_add\\":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],\\"bullet_zone\\":0,\\"progress_bar\\":[0,0,0],\\"ratio_br_l\\":[0,0,0,0,0,0],\\"ratio_edge_l\\":[0,0,0,0,0,0],\\"std_br_l\\":[0,0,0,0,0,0],\\"top_res_add\\":[0,0,0,0,0,0,0],\\"version\\":\\"v1.0\\"}","volume_info":"{\\"LoudnessRangeEnd\\":-14.6,\\"LoudnessRangeStart\\":-18.2,\\"Peak\\":0.66069,\\"Loudness\\":-16.3,\\"LoudnessRange\\":3.6,\\"MaximumMomentaryLoudness\\":-12.7,\\"MaximumShortTermLoudness\\":-14.5,\\"Version\\":2}","vqs_origin":"68.11"}',
    //       is_source_HDR: 0,
    //       bit_rate: [
    //         {
    //           gear_name: "adapt_lowest_4_1",
    //           quality_type: 72,
    //           bit_rate: 4189030,
    //           play_addr: {
    //             uri: "v0300fg10000cvp1nffog65kacq8bn7g",
    //             url_list: [
    //               "https://v95-web-sz.douyinvod.com/e223fb12e7b027f79e73bdd719733d61/68919a24/video/tos/cn/tos-cn-ve-15c001-alinc2/oYhnBywPie3iFbzAXgPI8PU29uzSBAQ0AfwE3D/?a=6383&ch=10010&cr=3&dr=0&lr=all&cd=0%7C0%7C0%7C3&cv=1&br=4090&bt=4090&cs=2&ds=10&ft=GZnU0RqeffPdXP~ka1jNvAq-antLjrKYyVmCRkaml6C9UjVhWL6&mime_type=video_mp4&qs=15&rc=OGhlPDtpaDdkZmhmNmZlNEBpanE7Zm45cmk0eTMzNGkzM0AwMDFgYGAtXzUxNDA0Y2MuYSM0X25eMmRja21gLS1kLTBzcw%3D%3D&btag=c0000e00018000&cquery=100o_101r_100B_100x_100z&dy_q=1754361813&feature_id=10cf95ef75b4f3e7eac623e4ea0ea691&l=20250805104332288948511D5931AF76A4",
    //               "https://v3-web.douyinvod.com/70a2330ca1dd6f69b5bc61744f54c92e/68919a24/video/tos/cn/tos-cn-ve-15c001-alinc2/oYhnBywPie3iFbzAXgPI8PU29uzSBAQ0AfwE3D/?a=6383&ch=10010&cr=3&dr=0&lr=all&cd=0%7C0%7C0%7C3&cv=1&br=4090&bt=4090&cs=2&ds=10&ft=GZnU0RqeffPdXP~ka1jNvAq-antLjrKYyVmCRkaml6C9UjVhWL6&mime_type=video_mp4&qs=15&rc=OGhlPDtpaDdkZmhmNmZlNEBpanE7Zm45cmk0eTMzNGkzM0AwMDFgYGAtXzUxNDA0Y2MuYSM0X25eMmRja21gLS1kLTBzcw%3D%3D&btag=c0000e00018000&cquery=100o_101r_100B_100x_100z&dy_q=1754361813&feature_id=10cf95ef75b4f3e7eac623e4ea0ea691&l=20250805104332288948511D5931AF76A4",
    //               "https://www.douyin.com/aweme/v1/play/?video_id=v0300fg10000cvp1nffog65kacq8bn7g&line=0&file_id=11fbfc733c7e4c8ab40ecfc8c94b3e35&sign=b9016f0b91d6d73058ccc636eacf7e50&is_play_url=1&source=PackSourceEnum_PUBLISH",
    //             ],
    //             width: 3840,
    //             height: 2160,
    //             url_key: "v0300fg10000cvp1nffog65kacq8bn7g_bytevc1_4k_4189030",
    //             data_size: 16620501,
    //             file_hash: "b9016f0b91d6d73058ccc636eacf7e50",
    //             file_cs:
    //               "c:0-36253-cc18|d:0-8310249-c009,8310250-16620500-472a|a:v0300fg10000cvp1nffog65kacq8bn7g",
    //           },
    //           is_h265: 1,
    //           is_bytevc1: 1,
    //           HDR_type: "",
    //           HDR_bit: "",
    //           FPS: 60,
    //           video_extra:
    //             '{"PktOffsetMap":"[{\\"time\\": 1, \\"offset\\": 505240}, {\\"time\\": 2, \\"offset\\": 839273}, {\\"time\\": 3, \\"offset\\": 1190083}, {\\"time\\": 4, \\"offset\\": 1628001}, {\\"time\\": 5, \\"offset\\": 2320261}, {\\"time\\": 10, \\"offset\\": 5191417}]","format":"mp4","definition":"4k","quality":"adapt_lowest","file_id":"11fbfc733c7e4c8ab40ecfc8c94b3e35","applog_map":{"feature_id":"10cf95ef75b4f3e7eac623e4ea0ea691"},"mvmaf":"{\\"mvmaf_sr_v1080\\":-1,\\"mvmaf_sr_v960\\":-1,\\"mvmaf_sr_v864\\":-1,\\"mvmaf_sr_v720\\":-1,\\"mvmaf_ori_v1080\\":96.423,\\"mvmaf_ori_v960\\":97.211,\\"mvmaf_ori_v864\\":97.727,\\"mvmaf_ori_v720\\":98.307}","audio_channels":"2.0","audio_sample_rate":"44100"}',
    //           format: "mp4",
    //         },
    //         {
    //           gear_name: "normal_1080_0",
    //           quality_type: 1,
    //           bit_rate: 3036649,
    //           play_addr: {
    //             uri: "v0300fg10000cvp1nffog65kacq8bn7g",
    //             url_list: [
    //               "https://v95-web-sz.douyinvod.com/6e32e52ae7b43f97ca3cf2b4c3cb7886/68919a24/video/tos/cn/tos-cn-ve-15c001-alinc2/oUeP6X7fBcG5IyWIoKLd7gfoB8tNRACRDcAGTA/?a=6383&ch=10010&cr=3&dr=0&lr=all&cd=0%7C0%7C0%7C3&cv=1&br=2965&bt=2965&cs=0&ds=4&ft=GZnU0RqeffPdXP~ka1jNvAq-antLjrKYyVmCRkaml6C9UjVhWL6&mime_type=video_mp4&qs=0&rc=PGZlPDc5OTo1NzY2Nmk7NkBpanE7Zm45cmk0eTMzNGkzM0AxMS8xYTBeNjExLWMwYDJiYSM0X25eMmRja21gLS1kLTBzcw%3D%3D&btag=c0000e00018000&cquery=100o_101r_100B_100x_100z&dy_q=1754361813&feature_id=46a7bb47b4fd1280f3d3825bf2b29388&l=20250805104332288948511D5931AF76A4",
    //               "https://v3-web.douyinvod.com/34feb51b7ee905a67ba410eba3d5d897/68919a24/video/tos/cn/tos-cn-ve-15c001-alinc2/oUeP6X7fBcG5IyWIoKLd7gfoB8tNRACRDcAGTA/?a=6383&ch=10010&cr=3&dr=0&lr=all&cd=0%7C0%7C0%7C3&cv=1&br=2965&bt=2965&cs=0&ds=4&ft=GZnU0RqeffPdXP~ka1jNvAq-antLjrKYyVmCRkaml6C9UjVhWL6&mime_type=video_mp4&qs=0&rc=PGZlPDc5OTo1NzY2Nmk7NkBpanE7Zm45cmk0eTMzNGkzM0AxMS8xYTBeNjExLWMwYDJiYSM0X25eMmRja21gLS1kLTBzcw%3D%3D&btag=c0000e00018000&cquery=101r_100B_100x_100z_100o&dy_q=1754361813&feature_id=46a7bb47b4fd1280f3d3825bf2b29388&l=20250805104332288948511D5931AF76A4",
    //               "https://www.douyin.com/aweme/v1/play/?video_id=v0300fg10000cvp1nffog65kacq8bn7g&line=0&file_id=e358cf33f303444297a636d4492b4c49&sign=348ed2bbef66c7f604c8aa1ce8c1ab5a&is_play_url=1&source=PackSourceEnum_PUBLISH",
    //             ],
    //             width: 1920,
    //             height: 1080,
    //             url_key: "v0300fg10000cvp1nffog65kacq8bn7g_h264_1080p_3036649",
    //             data_size: 12058157,
    //             file_hash: "348ed2bbef66c7f604c8aa1ce8c1ab5a",
    //             file_cs:
    //               "c:0-27578-105d|d:0-6029077-8faa,6029078-12058156-6958|a:v0300fg10000cvp1nffog65kacq8bn7g",
    //           },
    //           is_h265: 0,
    //           is_bytevc1: 0,
    //           HDR_type: "",
    //           HDR_bit: "",
    //           FPS: 30,
    //           video_extra:
    //             '{"PktOffsetMap":"[{\\"time\\": 1, \\"offset\\": 406805}, {\\"time\\": 2, \\"offset\\": 718353}, {\\"time\\": 3, \\"offset\\": 1025403}, {\\"time\\": 4, \\"offset\\": 1347602}, {\\"time\\": 5, \\"offset\\": 1782543}, {\\"time\\": 10, \\"offset\\": 3752467}]","format":"mp4","definition":"1080p","quality":"normal","file_id":"e358cf33f303444297a636d4492b4c49","applog_map":{"feature_id":"46a7bb47b4fd1280f3d3825bf2b29388"},"audio_channels":"2.0","audio_sample_rate":"44100"}',
    //           format: "mp4",
    //         },
    //         {
    //           gear_name: "adapt_lowest_1440_1",
    //           quality_type: 7,
    //           bit_rate: 2456327,
    //           play_addr: {
    //             uri: "v0300fg10000cvp1nffog65kacq8bn7g",
    //             url_list: [
    //               "https://v95-web-sz.douyinvod.com/1bb08debce66dbbfa15f6d82e38e24e9/68919a24/video/tos/cn/tos-cn-ve-15/oQWQ3AfiQg8XnePDUEBu9FAzJzI3iSASB03hxy/?a=6383&ch=10010&cr=3&dr=0&lr=all&cd=0%7C0%7C0%7C3&cv=1&br=2398&bt=2398&cs=2&ft=GZnU0RqeffPdXP~ka1jNvAq-antLjrKYyVmCRkaml6C9UjVhWL6&mime_type=video_mp4&qs=15&rc=aGVoaWY6aDhlZGU0NmZlOUBpanE7Zm45cmk0eTMzNGkzM0AxLzU1XzVjNWMxYzQzLl9hYSM0X25eMmRja21gLS1kLTBzcw%3D%3D&btag=c0000e00018000&cquery=101r_100B_100x_100z_100o&dy_q=1754361813&feature_id=10cf95ef75b4f3e7eac623e4ea0ea691&l=20250805104332288948511D5931AF76A4",
    //               "https://v3-web.douyinvod.com/5ce22a161bd187ad679b90b6da3159bc/68919a24/video/tos/cn/tos-cn-ve-15/oQWQ3AfiQg8XnePDUEBu9FAzJzI3iSASB03hxy/?a=6383&ch=10010&cr=3&dr=0&lr=all&cd=0%7C0%7C0%7C3&cv=1&br=2398&bt=2398&cs=2&ft=GZnU0RqeffPdXP~ka1jNvAq-antLjrKYyVmCRkaml6C9UjVhWL6&mime_type=video_mp4&qs=15&rc=aGVoaWY6aDhlZGU0NmZlOUBpanE7Zm45cmk0eTMzNGkzM0AxLzU1XzVjNWMxYzQzLl9hYSM0X25eMmRja21gLS1kLTBzcw%3D%3D&btag=c0000e00018000&cquery=100z_100o_101r_100B_100x&dy_q=1754361813&feature_id=10cf95ef75b4f3e7eac623e4ea0ea691&l=20250805104332288948511D5931AF76A4",
    //               "https://www.douyin.com/aweme/v1/play/?video_id=v0300fg10000cvp1nffog65kacq8bn7g&line=0&file_id=d6bb1c6371fb4afb85fe87bc8f8e2b4e&sign=79e51c2806a2b45e64f5febb1e3090b4&is_play_url=1&source=PackSourceEnum_PUBLISH",
    //             ],
    //             width: 2560,
    //             height: 1440,
    //             url_key:
    //               "v0300fg10000cvp1nffog65kacq8bn7g_bytevc1_1440p_2456327",
    //             data_size: 9745786,
    //             file_hash: "79e51c2806a2b45e64f5febb1e3090b4",
    //             file_cs:
    //               "c:0-36251-13b5|d:0-4872892-78f1,4872893-9745785-0521|a:v0300fg10000cvp1nffog65kacq8bn7g",
    //           },
    //           is_h265: 1,
    //           is_bytevc1: 1,
    //           HDR_type: "",
    //           HDR_bit: "",
    //           FPS: 60,
    //           video_extra:
    //             '{"PktOffsetMap":"[{\\"time\\": 1, \\"offset\\": 311445}, {\\"time\\": 2, \\"offset\\": 498377}, {\\"time\\": 3, \\"offset\\": 694170}, {\\"time\\": 4, \\"offset\\": 929971}, {\\"time\\": 5, \\"offset\\": 1321581}, {\\"time\\": 10, \\"offset\\": 3022820}]","format":"mp4","definition":"1440p","quality":"adapt_lowest","file_id":"d6bb1c6371fb4afb85fe87bc8f8e2b4e","applog_map":{"feature_id":"10cf95ef75b4f3e7eac623e4ea0ea691"},"mvmaf":"{\\"mvmaf_sr_v1080\\":-1,\\"mvmaf_sr_v960\\":-1,\\"mvmaf_sr_v864\\":-1,\\"mvmaf_sr_v720\\":-1,\\"mvmaf_ori_v1080\\":93.015,\\"mvmaf_ori_v960\\":94.014,\\"mvmaf_ori_v864\\":95.182,\\"mvmaf_ori_v720\\":96.298}","audio_channels":"2.0","audio_sample_rate":"44100"}',
    //           format: "mp4",
    //         },
    //         {
    //           gear_name: "normal_540_0",
    //           quality_type: 20,
    //           bit_rate: 2290194,
    //           play_addr: {
    //             uri: "v0300fg10000cvp1nffog65kacq8bn7g",
    //             url_list: [
    //               "https://v95-web-sz.douyinvod.com/7308e7be8ba89558d2b25cb22da99008/68919a24/video/tos/cn/tos-cn-ve-15c001-alinc2/o0AzInhBUFuiAzi9Z3EQVLADS0gfPe0yrD8ILB/?a=6383&ch=10010&cr=3&dr=0&lr=all&cd=0%7C0%7C0%7C3&cv=1&br=2236&bt=2236&cs=0&ds=6&ft=GZnU0RqeffPdXP~ka1jNvAq-antLjrKYyVmCRkaml6C9UjVhWL6&mime_type=video_mp4&qs=0&rc=NjVpZTY3ODo5aTdnNWUzNEBpanE7Zm45cmk0eTMzNGkzM0A2X2MtL2IzNi8xNi4zYjItYSM0X25eMmRja21gLS1kLTBzcw%3D%3D&btag=c0000e00018000&cquery=100B_100x_100z_100o_101r&dy_q=1754361813&feature_id=f0150a16a324336cda5d6dd0b69ed299&l=20250805104332288948511D5931AF76A4",
    //               "https://v3-web.douyinvod.com/053ae12897b5b06ac8f383ca2b085db9/68919a24/video/tos/cn/tos-cn-ve-15c001-alinc2/o0AzInhBUFuiAzi9Z3EQVLADS0gfPe0yrD8ILB/?a=6383&ch=10010&cr=3&dr=0&lr=all&cd=0%7C0%7C0%7C3&cv=1&br=2236&bt=2236&cs=0&ds=6&ft=GZnU0RqeffPdXP~ka1jNvAq-antLjrKYyVmCRkaml6C9UjVhWL6&mime_type=video_mp4&qs=0&rc=NjVpZTY3ODo5aTdnNWUzNEBpanE7Zm45cmk0eTMzNGkzM0A2X2MtL2IzNi8xNi4zYjItYSM0X25eMmRja21gLS1kLTBzcw%3D%3D&btag=c0000e00018000&cquery=100B_100x_100z_100o_101r&dy_q=1754361813&feature_id=f0150a16a324336cda5d6dd0b69ed299&l=20250805104332288948511D5931AF76A4",
    //               "https://www.douyin.com/aweme/v1/play/?video_id=v0300fg10000cvp1nffog65kacq8bn7g&line=0&file_id=0150eb621d944f269765e4230bffb293&sign=a62a6483d3a5b06085a15e4849f0a858&is_play_url=1&source=PackSourceEnum_PUBLISH",
    //             ],
    //             width: 1024,
    //             height: 576,
    //             url_key: "v0300fg10000cvp1nffog65kacq8bn7g_h264_540p_2290194",
    //             data_size: 9094076,
    //             file_hash: "a62a6483d3a5b06085a15e4849f0a858",
    //             file_cs:
    //               "c:0-35962-4b44|d:0-4547037-d51c,4547038-9094075-aba0|a:v0300fg10000cvp1nffog65kacq8bn7g",
    //           },
    //           is_h265: 0,
    //           is_bytevc1: 0,
    //           HDR_type: "",
    //           HDR_bit: "",
    //           FPS: 30,
    //           video_extra:
    //             '{"PktOffsetMap":"[{\\"time\\": 1, \\"offset\\": 278293}, {\\"time\\": 2, \\"offset\\": 518856}, {\\"time\\": 3, \\"offset\\": 712780}, {\\"time\\": 4, \\"offset\\": 973322}, {\\"time\\": 5, \\"offset\\": 1269683}, {\\"time\\": 10, \\"offset\\": 2741385}]","format":"mp4","definition":"540p","quality":"normal","file_id":"0150eb621d944f269765e4230bffb293","applog_map":{"feature_id":"f0150a16a324336cda5d6dd0b69ed299"},"audio_channels":"2.0","audio_sample_rate":"44100"}',
    //           format: "mp4",
    //         },
    //         {
    //           gear_name: "normal_720_0",
    //           quality_type: 10,
    //           bit_rate: 2068266,
    //           play_addr: {
    //             uri: "v0300fg10000cvp1nffog65kacq8bn7g",
    //             url_list: [
    //               "https://v95-web-sz.douyinvod.com/d8df7a0978263eda907a8764e82fd1c8/68919a24/video/tos/cn/tos-cn-ve-15c001-alinc2/ogPuFQDBnBH03iFiiH1hDAIUAASyf8zgz9ECTe/?a=6383&ch=10010&cr=3&dr=0&lr=all&cd=0%7C0%7C0%7C3&cv=1&br=2019&bt=2019&cs=0&ds=3&ft=GZnU0RqeffPdXP~ka1jNvAq-antLjrKYyVmCRkaml6C9UjVhWL6&mime_type=video_mp4&qs=0&rc=NTc8ZDlkNmY2NzVpNjY6OkBpanE7Zm45cmk0eTMzNGkzM0A2MC8tNS0tXy4xLWEwLWMyYSM0X25eMmRja21gLS1kLTBzcw%3D%3D&btag=c0000e00018000&cquery=100B_100x_100z_100o_101r&dy_q=1754361813&feature_id=fea919893f650a8c49286568590446ef&l=20250805104332288948511D5931AF76A4",
    //               "https://v3-web.douyinvod.com/a24c1ad4842b639bfc19b12aeacf7012/68919a24/video/tos/cn/tos-cn-ve-15c001-alinc2/ogPuFQDBnBH03iFiiH1hDAIUAASyf8zgz9ECTe/?a=6383&ch=10010&cr=3&dr=0&lr=all&cd=0%7C0%7C0%7C3&cv=1&br=2019&bt=2019&cs=0&ds=3&ft=GZnU0RqeffPdXP~ka1jNvAq-antLjrKYyVmCRkaml6C9UjVhWL6&mime_type=video_mp4&qs=0&rc=NTc8ZDlkNmY2NzVpNjY6OkBpanE7Zm45cmk0eTMzNGkzM0A2MC8tNS0tXy4xLWEwLWMyYSM0X25eMmRja21gLS1kLTBzcw%3D%3D&btag=c0000e00018000&cquery=100z_100o_101r_100B_100x&dy_q=1754361813&feature_id=fea919893f650a8c49286568590446ef&l=20250805104332288948511D5931AF76A4",
    //               "https://www.douyin.com/aweme/v1/play/?video_id=v0300fg10000cvp1nffog65kacq8bn7g&line=0&file_id=57f70333df024413bc030a860a293492&sign=566a3cc85d38d810cb8047d82d2dd89d&is_play_url=1&source=PackSourceEnum_PUBLISH",
    //             ],
    //             width: 1280,
    //             height: 720,
    //             url_key: "v0300fg10000cvp1nffog65kacq8bn7g_h264_720p_2068266",
    //             data_size: 8212829,
    //             file_hash: "566a3cc85d38d810cb8047d82d2dd89d",
    //             file_cs:
    //               "c:0-35941-2c99|d:0-4106413-ec38,4106414-8212828-df41|a:v0300fg10000cvp1nffog65kacq8bn7g",
    //           },
    //           is_h265: 0,
    //           is_bytevc1: 0,
    //           HDR_type: "",
    //           HDR_bit: "",
    //           FPS: 30,
    //           video_extra:
    //             '{"PktOffsetMap":"[{\\"time\\": 1, \\"offset\\": 279401}, {\\"time\\": 2, \\"offset\\": 510354}, {\\"time\\": 3, \\"offset\\": 697065}, {\\"time\\": 4, \\"offset\\": 940276}, {\\"time\\": 5, \\"offset\\": 1212067}, {\\"time\\": 10, \\"offset\\": 2587033}]","format":"mp4","definition":"720p","quality":"normal","file_id":"57f70333df024413bc030a860a293492","applog_map":{"feature_id":"fea919893f650a8c49286568590446ef"},"audio_channels":"2.0","audio_sample_rate":"44100"}',
    //           format: "mp4",
    //         },
    //         {
    //           gear_name: "low_720_0",
    //           quality_type: 211,
    //           bit_rate: 2067298,
    //           play_addr: {
    //             uri: "v0300fg10000cvp1nffog65kacq8bn7g",
    //             url_list: [
    //               "https://v95-web-sz.douyinvod.com/5722d414ed9b71a2d7221607bc8a831a/68919a24/video/tos/cn/tos-cn-ve-15/ocr3AHyi9DzfFuDPugQh9E18IAUnS0BYze4AiB/?a=6383&ch=10010&cr=3&dr=0&lr=all&cd=0%7C0%7C0%7C3&cv=1&br=2018&bt=2018&cs=0&ds=3&ft=GZnU0RqeffPdXP~ka1jNvAq-antLjrKYyVmCRkaml6C9UjVhWL6&mime_type=video_mp4&qs=1&rc=OmdpOWRlOzZlZmU5OmdmNUBpanE7Zm45cmk0eTMzNGkzM0BjYzY0YmIyXjYxYi9hXmMxYSM0X25eMmRja21gLS1kLTBzcw%3D%3D&btag=c0000e00018000&cquery=101r_100B_100x_100z_100o&dy_q=1754361813&feature_id=46a7bb47b4fd1280f3d3825bf2b29388&l=20250805104332288948511D5931AF76A4",
    //               "https://v3-web.douyinvod.com/2d41507eea7ceac685c4f2de3cebdd45/68919a24/video/tos/cn/tos-cn-ve-15/ocr3AHyi9DzfFuDPugQh9E18IAUnS0BYze4AiB/?a=6383&ch=10010&cr=3&dr=0&lr=all&cd=0%7C0%7C0%7C3&cv=1&br=2018&bt=2018&cs=0&ds=3&ft=GZnU0RqeffPdXP~ka1jNvAq-antLjrKYyVmCRkaml6C9UjVhWL6&mime_type=video_mp4&qs=1&rc=OmdpOWRlOzZlZmU5OmdmNUBpanE7Zm45cmk0eTMzNGkzM0BjYzY0YmIyXjYxYi9hXmMxYSM0X25eMmRja21gLS1kLTBzcw%3D%3D&btag=c0000e00018000&cquery=100B_100x_100z_100o_101r&dy_q=1754361813&feature_id=46a7bb47b4fd1280f3d3825bf2b29388&l=20250805104332288948511D5931AF76A4",
    //               "https://www.douyin.com/aweme/v1/play/?video_id=v0300fg10000cvp1nffog65kacq8bn7g&line=0&file_id=42fcadd726eb4c9ba358ebea769ffdf7&sign=bf894b2ce8b0ac12e482b2d745bb438d&is_play_url=1&source=PackSourceEnum_PUBLISH",
    //             ],
    //             width: 1280,
    //             height: 720,
    //             url_key: "v0300fg10000cvp1nffog65kacq8bn7g_h264_720p_2067298",
    //             data_size: 8208982,
    //             file_hash: "bf894b2ce8b0ac12e482b2d745bb438d",
    //             file_cs:
    //               "c:0-27576-c6d5|d:0-4104490-2498,4104491-8208981-e6e2|a:v0300fg10000cvp1nffog65kacq8bn7g",
    //           },
    //           is_h265: 0,
    //           is_bytevc1: 0,
    //           HDR_type: "",
    //           HDR_bit: "",
    //           FPS: 30,
    //           video_extra:
    //             '{"PktOffsetMap":"[{\\"time\\": 1, \\"offset\\": 290163}, {\\"time\\": 2, \\"offset\\": 503833}, {\\"time\\": 3, \\"offset\\": 710585}, {\\"time\\": 4, \\"offset\\": 927745}, {\\"time\\": 5, \\"offset\\": 1221258}, {\\"time\\": 10, \\"offset\\": 2566663}]","format":"mp4","definition":"720p","quality":"low","file_id":"42fcadd726eb4c9ba358ebea769ffdf7","applog_map":{"feature_id":"46a7bb47b4fd1280f3d3825bf2b29388"},"audio_channels":"2.0","audio_sample_rate":"44100"}',
    //           format: "mp4",
    //         },
    //         {
    //           gear_name: "low_540_0",
    //           quality_type: 292,
    //           bit_rate: 1905121,
    //           play_addr: {
    //             uri: "v0300fg10000cvp1nffog65kacq8bn7g",
    //             url_list: [
    //               "https://v95-web-sz.douyinvod.com/0cdc4ca92c080c56c4c5df10265706a6/68919a24/video/tos/cn/tos-cn-ve-15c001-alinc2/oQCeu0QPIi3S7PHAhknAyBmB8EXzDFNfgAUiv9/?a=6383&ch=10010&cr=3&dr=0&lr=all&cd=0%7C0%7C0%7C3&cv=1&br=1860&bt=1860&cs=0&ds=6&ft=GZnU0RqeffPdXP~ka1jNvAq-antLjrKYyVmCRkaml6C9UjVhWL6&mime_type=video_mp4&qs=1&rc=ZmlkZTY1aDQ8NDw2Njk1ZkBpanE7Zm45cmk0eTMzNGkzM0A0YS8tNTIxNi4xY19eNF81YSM0X25eMmRja21gLS1kLTBzcw%3D%3D&btag=c0000e00018000&cquery=101r_100B_100x_100z_100o&dy_q=1754361813&feature_id=46a7bb47b4fd1280f3d3825bf2b29388&l=20250805104332288948511D5931AF76A4",
    //               "https://v3-web.douyinvod.com/7fcda08d3645ba31f0a7351b2d1c9141/68919a24/video/tos/cn/tos-cn-ve-15c001-alinc2/oQCeu0QPIi3S7PHAhknAyBmB8EXzDFNfgAUiv9/?a=6383&ch=10010&cr=3&dr=0&lr=all&cd=0%7C0%7C0%7C3&cv=1&br=1860&bt=1860&cs=0&ds=6&ft=GZnU0RqeffPdXP~ka1jNvAq-antLjrKYyVmCRkaml6C9UjVhWL6&mime_type=video_mp4&qs=1&rc=ZmlkZTY1aDQ8NDw2Njk1ZkBpanE7Zm45cmk0eTMzNGkzM0A0YS8tNTIxNi4xY19eNF81YSM0X25eMmRja21gLS1kLTBzcw%3D%3D&btag=c0000e00018000&cquery=101r_100B_100x_100z_100o&dy_q=1754361813&feature_id=46a7bb47b4fd1280f3d3825bf2b29388&l=20250805104332288948511D5931AF76A4",
    //               "https://www.douyin.com/aweme/v1/play/?video_id=v0300fg10000cvp1nffog65kacq8bn7g&line=0&file_id=8cb276a3b3f94119914e52830b2adf7c&sign=bb9a43a94bff177511e7e94b4beae371&is_play_url=1&source=PackSourceEnum_PUBLISH",
    //             ],
    //             width: 1024,
    //             height: 576,
    //             url_key: "v0300fg10000cvp1nffog65kacq8bn7g_h264_540p_1905121",
    //             data_size: 7565001,
    //             file_hash: "bb9a43a94bff177511e7e94b4beae371",
    //             file_cs:
    //               "c:0-27588-334c|d:0-3782499-b118,3782500-7565000-aee3|a:v0300fg10000cvp1nffog65kacq8bn7g",
    //           },
    //           is_h265: 0,
    //           is_bytevc1: 0,
    //           HDR_type: "",
    //           HDR_bit: "",
    //           FPS: 30,
    //           video_extra:
    //             '{"PktOffsetMap":"[{\\"time\\": 1, \\"offset\\": 272459}, {\\"time\\": 2, \\"offset\\": 473522}, {\\"time\\": 3, \\"offset\\": 667700}, {\\"time\\": 4, \\"offset\\": 868798}, {\\"time\\": 5, \\"offset\\": 1134997}, {\\"time\\": 10, \\"offset\\": 2379974}]","format":"mp4","definition":"540p","quality":"low","file_id":"8cb276a3b3f94119914e52830b2adf7c","applog_map":{"feature_id":"46a7bb47b4fd1280f3d3825bf2b29388"},"audio_channels":"2.0","audio_sample_rate":"44100"}',
    //           format: "mp4",
    //         },
    //         {
    //           gear_name: "1080_1_1",
    //           quality_type: 3,
    //           bit_rate: 1712653,
    //           play_addr: {
    //             uri: "v0300fg10000cvp1nffog65kacq8bn7g",
    //             url_list: [
    //               "https://v95-web-sz.douyinvod.com/6ef10a1aebd468e58e7aa44e3aded0ca/68919a24/video/tos/cn/tos-cn-ve-15/o8KXQeLEfNG7qcoyBgGAId5R7TPAKCHBMDIIeJ/?a=6383&ch=10010&cr=3&dr=0&lr=all&cd=0%7C0%7C0%7C3&cv=1&br=1672&bt=1672&cs=2&ds=4&ft=GZnU0RqeffPdXP~ka1jNvAq-antLjrKYyVmCRkaml6C9UjVhWL6&mime_type=video_mp4&qs=0&rc=PDRpODxlOTc1ODNpNTk5OEBpanE7Zm45cmk0eTMzNGkzM0A2MzFeMmEuNS4xYS1gNmBfYSM0X25eMmRja21gLS1kLTBzcw%3D%3D&btag=c0000e00018000&cquery=101r_100B_100x_100z_100o&dy_q=1754361813&feature_id=63e57b176b357061c14e0ab4b250020b&l=20250805104332288948511D5931AF76A4",
    //               "https://v3-web.douyinvod.com/bf5fa050e18a80fdf22476f2f70f354c/68919a24/video/tos/cn/tos-cn-ve-15/o8KXQeLEfNG7qcoyBgGAId5R7TPAKCHBMDIIeJ/?a=6383&ch=10010&cr=3&dr=0&lr=all&cd=0%7C0%7C0%7C3&cv=1&br=1672&bt=1672&cs=2&ds=4&ft=GZnU0RqeffPdXP~ka1jNvAq-antLjrKYyVmCRkaml6C9UjVhWL6&mime_type=video_mp4&qs=0&rc=PDRpODxlOTc1ODNpNTk5OEBpanE7Zm45cmk0eTMzNGkzM0A2MzFeMmEuNS4xYS1gNmBfYSM0X25eMmRja21gLS1kLTBzcw%3D%3D&btag=c0000e00018000&cquery=101r_100B_100x_100z_100o&dy_q=1754361813&feature_id=63e57b176b357061c14e0ab4b250020b&l=20250805104332288948511D5931AF76A4",
    //               "https://www.douyin.com/aweme/v1/play/?video_id=v0300fg10000cvp1nffog65kacq8bn7g&line=0&file_id=b5c696c20fd045128416db59a54f6199&sign=6fe63ac5a1eac347239efc268f0a2355&is_play_url=1&source=PackSourceEnum_PUBLISH",
    //             ],
    //             width: 1920,
    //             height: 1080,
    //             url_key:
    //               "v0300fg10000cvp1nffog65kacq8bn7g_bytevc1_1080p_1712653",
    //             data_size: 6800733,
    //             file_hash: "6fe63ac5a1eac347239efc268f0a2355",
    //             file_cs:
    //               "c:0-27784-7165|d:0-3400365-27db,3400366-6800732-6f81|a:v0300fg10000cvp1nffog65kacq8bn7g",
    //           },
    //           is_h265: 1,
    //           is_bytevc1: 1,
    //           HDR_type: "",
    //           HDR_bit: "",
    //           FPS: 30,
    //           video_extra:
    //             '{"PktOffsetMap":"[{\\"time\\": 1, \\"offset\\": 284436}, {\\"time\\": 2, \\"offset\\": 404381}, {\\"time\\": 3, \\"offset\\": 562308}, {\\"time\\": 4, \\"offset\\": 749285}, {\\"time\\": 5, \\"offset\\": 994806}, {\\"time\\": 10, \\"offset\\": 2076885}]","format":"mp4","definition":"1080p","quality":"normal","file_id":"b5c696c20fd045128416db59a54f6199","v_gear_id":"aweme/high_value_group","u_vmaf":95.9518,"applog_map":{"feature_id":"63e57b176b357061c14e0ab4b250020b"},"sr_sharpness_strength":8,"mvmaf":"{\\"mvmaf_sr_v1080\\":-1,\\"mvmaf_sr_v960\\":-1,\\"mvmaf_sr_v864\\":-1,\\"mvmaf_sr_v720\\":-1,\\"mvmaf_ori_v1080\\":96.815,\\"mvmaf_ori_v960\\":97.344,\\"mvmaf_ori_v864\\":98.106,\\"mvmaf_ori_v720\\":99.133}","ufq":"{\\"enh\\":84.208,\\"playback\\":{\\"ori\\":83.571,\\"srv1\\":83.571},\\"src\\":83.698,\\"trans\\":83.571,\\"version\\":\\"v1.0\\"}","audio_channels":"2.0","audio_sample_rate":"44100"}',
    //           format: "mp4",
    //         },
    //         {
    //           gear_name: "lower_540_0",
    //           quality_type: 224,
    //           bit_rate: 1536519,
    //           play_addr: {
    //             uri: "v0300fg10000cvp1nffog65kacq8bn7g",
    //             url_list: [
    //               "https://v95-web-sz.douyinvod.com/5c34948957d72d033aa6b9a5ada92965/68919a24/video/tos/cn/tos-cn-ve-15/oc8uIDPUeBAZmzFc0hi0A9nQbAFg3Bg8ESf0yi/?a=6383&ch=10010&cr=3&dr=0&lr=all&cd=0%7C0%7C0%7C3&cv=1&br=1500&bt=1500&cs=0&ds=6&ft=GZnU0RqeffPdXP~ka1jNvAq-antLjrKYyVmCRkaml6C9UjVhWL6&mime_type=video_mp4&qs=4&rc=NDU7PGQ3aGZnZTRoaDhkZEBpanE7Zm45cmk0eTMzNGkzM0AxYy8vNjI1XjQxMTYtNl8wYSM0X25eMmRja21gLS1kLTBzcw%3D%3D&btag=c0000e00018000&cquery=101r_100B_100x_100z_100o&dy_q=1754361813&feature_id=eb29b1b3aca69db49524c333df8caaf7&l=20250805104332288948511D5931AF76A4",
    //               "https://v3-web.douyinvod.com/426744e1dbbffc5afc20b9f072f80bdb/68919a24/video/tos/cn/tos-cn-ve-15/oc8uIDPUeBAZmzFc0hi0A9nQbAFg3Bg8ESf0yi/?a=6383&ch=10010&cr=3&dr=0&lr=all&cd=0%7C0%7C0%7C3&cv=1&br=1500&bt=1500&cs=0&ds=6&ft=GZnU0RqeffPdXP~ka1jNvAq-antLjrKYyVmCRkaml6C9UjVhWL6&mime_type=video_mp4&qs=4&rc=NDU7PGQ3aGZnZTRoaDhkZEBpanE7Zm45cmk0eTMzNGkzM0AxYy8vNjI1XjQxMTYtNl8wYSM0X25eMmRja21gLS1kLTBzcw%3D%3D&btag=c0000e00018000&cquery=101r_100B_100x_100z_100o&dy_q=1754361813&feature_id=eb29b1b3aca69db49524c333df8caaf7&l=20250805104332288948511D5931AF76A4",
    //               "https://www.douyin.com/aweme/v1/play/?video_id=v0300fg10000cvp1nffog65kacq8bn7g&line=0&file_id=3aba950e9e414b7dac8e549a2928f241&sign=20900bbda16c8818e268907ed2eff5b7&is_play_url=1&source=PackSourceEnum_PUBLISH",
    //             ],
    //             width: 1024,
    //             height: 576,
    //             url_key: "v0300fg10000cvp1nffog65kacq8bn7g_h264_540p_1536519",
    //             data_size: 6101328,
    //             file_hash: "20900bbda16c8818e268907ed2eff5b7",
    //             file_cs:
    //               "c:0-27596-e8e3|d:0-3050663-8b6e,3050664-6101327-4d19|a:v0300fg10000cvp1nffog65kacq8bn7g",
    //           },
    //           is_h265: 0,
    //           is_bytevc1: 0,
    //           HDR_type: "",
    //           HDR_bit: "",
    //           FPS: 30,
    //           video_extra:
    //             '{"PktOffsetMap":"","format":"mp4","definition":"540p","quality":"lower","file_id":"3aba950e9e414b7dac8e549a2928f241","applog_map":{"feature_id":"eb29b1b3aca69db49524c333df8caaf7"},"audio_channels":"2.0","audio_sample_rate":"44100"}',
    //           format: "mp4",
    //         },
    //         {
    //           gear_name: "720_1_1",
    //           quality_type: 11,
    //           bit_rate: 1321210,
    //           play_addr: {
    //             uri: "v0300fg10000cvp1nffog65kacq8bn7g",
    //             url_list: [
    //               "https://v95-web-sz.douyinvod.com/4eb7ed49886f0b07d9421e3881005add/68919a24/video/tos/cn/tos-cn-ve-15/ogR7dGPADepTh78kGBgXc5LfuUACIAeRIUBANc/?a=6383&ch=10010&cr=3&dr=0&lr=all&cd=0%7C0%7C0%7C3&cv=1&br=1290&bt=1290&cs=2&ds=3&ft=GZnU0RqeffPdXP~ka1jNvAq-antLjrKYyVmCRkaml6C9UjVhWL6&mime_type=video_mp4&qs=0&rc=Ozo8OTloPDM1aTxpNDQ6Z0BpanE7Zm45cmk0eTMzNGkzM0BfY2FeMi0vXjIxLmI0XmAwYSM0X25eMmRja21gLS1kLTBzcw%3D%3D&btag=c0000e00018000&cquery=100z_100o_101r_100B_100x&dy_q=1754361813&feature_id=63e57b176b357061c14e0ab4b250020b&l=20250805104332288948511D5931AF76A4",
    //               "https://v3-web.douyinvod.com/e27e883d3d6bda288c2ab82f73330b3b/68919a24/video/tos/cn/tos-cn-ve-15/ogR7dGPADepTh78kGBgXc5LfuUACIAeRIUBANc/?a=6383&ch=10010&cr=3&dr=0&lr=all&cd=0%7C0%7C0%7C3&cv=1&br=1290&bt=1290&cs=2&ds=3&ft=GZnU0RqeffPdXP~ka1jNvAq-antLjrKYyVmCRkaml6C9UjVhWL6&mime_type=video_mp4&qs=0&rc=Ozo8OTloPDM1aTxpNDQ6Z0BpanE7Zm45cmk0eTMzNGkzM0BfY2FeMi0vXjIxLmI0XmAwYSM0X25eMmRja21gLS1kLTBzcw%3D%3D&btag=c0000e00018000&cquery=100o_101r_100B_100x_100z&dy_q=1754361813&feature_id=63e57b176b357061c14e0ab4b250020b&l=20250805104332288948511D5931AF76A4",
    //               "https://www.douyin.com/aweme/v1/play/?video_id=v0300fg10000cvp1nffog65kacq8bn7g&line=0&file_id=3dc7a171ef194f52a0290e56a6d9f7b8&sign=b7a7ff5d8b4267a60f69bf98694481db&is_play_url=1&source=PackSourceEnum_PUBLISH",
    //             ],
    //             width: 1280,
    //             height: 720,
    //             url_key:
    //               "v0300fg10000cvp1nffog65kacq8bn7g_bytevc1_720p_1321210",
    //             data_size: 5246360,
    //             file_hash: "b7a7ff5d8b4267a60f69bf98694481db",
    //             file_cs:
    //               "c:0-27784-6a40|d:0-2623179-0fc6,2623180-5246359-7d81|a:v0300fg10000cvp1nffog65kacq8bn7g",
    //           },
    //           is_h265: 1,
    //           is_bytevc1: 1,
    //           HDR_type: "",
    //           HDR_bit: "",
    //           FPS: 30,
    //           video_extra:
    //             '{"PktOffsetMap":"[{\\"time\\": 1, \\"offset\\": 233780}, {\\"time\\": 2, \\"offset\\": 328564}, {\\"time\\": 3, \\"offset\\": 450133}, {\\"time\\": 4, \\"offset\\": 593758}, {\\"time\\": 5, \\"offset\\": 776437}, {\\"time\\": 10, \\"offset\\": 1606609}]","format":"mp4","definition":"720p","quality":"normal","file_id":"3dc7a171ef194f52a0290e56a6d9f7b8","v_gear_id":"aweme/high_value_group","u_vmaf":91.4866,"applog_map":{"feature_id":"63e57b176b357061c14e0ab4b250020b"},"sr_sharpness_strength":8,"mvmaf":"{\\"mvmaf_sr_v1080\\":98.334,\\"mvmaf_sr_v960\\":99.54,\\"mvmaf_sr_v864\\":99.652,\\"mvmaf_sr_v720\\":99.968,\\"mvmaf_ori_v1080\\":88.916,\\"mvmaf_ori_v960\\":92.268,\\"mvmaf_ori_v864\\":94.118,\\"mvmaf_ori_v720\\":97.65}","ufq":"{\\"enh\\":84.208,\\"playback\\":{\\"ori\\":77.124,\\"srv1\\":83.379},\\"src\\":83.698,\\"trans\\":77.124,\\"version\\":\\"v1.0\\"}","audio_channels":"2.0","audio_sample_rate":"44100"}',
    //           format: "mp4",
    //         },
    //         {
    //           gear_name: "adapt_low_540_0",
    //           quality_type: 291,
    //           bit_rate: 1244715,
    //           play_addr: {
    //             uri: "v0300fg10000cvp1nffog65kacq8bn7g",
    //             url_list: [
    //               "https://v95-web-sz.douyinvod.com/a7647faf757eda627e7261d45cd16589/68919a24/video/tos/cn/tos-cn-ve-15c001-alinc2/o8riSwF3IU0ADy8B3ywBfAP9ueAiQthgE2JnEz/?a=6383&ch=10010&cr=3&dr=0&lr=all&cd=0%7C0%7C0%7C3&cv=1&br=1215&bt=1215&cs=0&ds=6&ft=GZnU0RqeffPdXP~ka1jNvAq-antLjrKYyVmCRkaml6C9UjVhWL6&mime_type=video_mp4&qs=12&rc=N2c6ZztoNjhnNDg5ZTk2NkBpanE7Zm45cmk0eTMzNGkzM0BeMmM2MjI2XjIxLTA0Li9eYSM0X25eMmRja21gLS1kLTBzcw%3D%3D&btag=c0000e00018000&cquery=100o_101r_100B_100x_100z&dy_q=1754361813&feature_id=46a7bb47b4fd1280f3d3825bf2b29388&l=20250805104332288948511D5931AF76A4",
    //               "https://v3-web.douyinvod.com/b2bfb82a9fe55d156de51986ce95872d/68919a24/video/tos/cn/tos-cn-ve-15c001-alinc2/o8riSwF3IU0ADy8B3ywBfAP9ueAiQthgE2JnEz/?a=6383&ch=10010&cr=3&dr=0&lr=all&cd=0%7C0%7C0%7C3&cv=1&br=1215&bt=1215&cs=0&ds=6&ft=GZnU0RqeffPdXP~ka1jNvAq-antLjrKYyVmCRkaml6C9UjVhWL6&mime_type=video_mp4&qs=12&rc=N2c6ZztoNjhnNDg5ZTk2NkBpanE7Zm45cmk0eTMzNGkzM0BeMmM2MjI2XjIxLTA0Li9eYSM0X25eMmRja21gLS1kLTBzcw%3D%3D&btag=c0000e00018000&cquery=100B_100x_100z_100o_101r&dy_q=1754361813&feature_id=46a7bb47b4fd1280f3d3825bf2b29388&l=20250805104332288948511D5931AF76A4",
    //               "https://www.douyin.com/aweme/v1/play/?video_id=v0300fg10000cvp1nffog65kacq8bn7g&line=0&file_id=a323167b3605415da5935e589df75da4&sign=2912451193ebc0b5ca369230d5c75b47&is_play_url=1&source=PackSourceEnum_PUBLISH",
    //             ],
    //             width: 1024,
    //             height: 576,
    //             url_key: "v0300fg10000cvp1nffog65kacq8bn7g_h264_540p_1244715",
    //             data_size: 4942611,
    //             file_hash: "2912451193ebc0b5ca369230d5c75b47",
    //             file_cs:
    //               "c:0-27587-c21d|d:0-2471304-ab2f,2471305-4942610-78bb|a:v0300fg10000cvp1nffog65kacq8bn7g",
    //           },
    //           is_h265: 0,
    //           is_bytevc1: 0,
    //           HDR_type: "",
    //           HDR_bit: "",
    //           FPS: 30,
    //           video_extra:
    //             '{"PktOffsetMap":"[{\\"time\\": 1, \\"offset\\": 184817}, {\\"time\\": 2, \\"offset\\": 311711}, {\\"time\\": 3, \\"offset\\": 432767}, {\\"time\\": 4, \\"offset\\": 561530}, {\\"time\\": 5, \\"offset\\": 731471}, {\\"time\\": 10, \\"offset\\": 1552469}]","format":"mp4","definition":"540p","quality":"adapt_low","file_id":"a323167b3605415da5935e589df75da4","applog_map":{"feature_id":"46a7bb47b4fd1280f3d3825bf2b29388"},"audio_channels":"2.0","audio_sample_rate":"44100"}',
    //           format: "mp4",
    //         },
    //         {
    //           gear_name: "720_2_1",
    //           quality_type: 12,
    //           bit_rate: 1003445,
    //           play_addr: {
    //             uri: "v0300fg10000cvp1nffog65kacq8bn7g",
    //             url_list: [
    //               "https://v95-web-sz.douyinvod.com/faf8d0952bd8024feb278cbb43900080/68919a24/video/tos/cn/tos-cn-ve-15/oshUDiBA9AA3GEze8yiIzuBAKQFgM0DS8nfP3P/?a=6383&ch=10010&cr=3&dr=0&lr=all&cd=0%7C0%7C0%7C3&cv=1&br=979&bt=979&cs=2&ds=3&ft=GZnU0RqeffPdXP~ka1jNvAq-antLjrKYyVmCRkaml6C9UjVhWL6&mime_type=video_mp4&qs=0&rc=OTo2aDw5Zmk0PDU6OmlnNEBpanE7Zm45cmk0eTMzNGkzM0A1YTEzNmFeXjExMi5eMzBgYSM0X25eMmRja21gLS1kLTBzcw%3D%3D&btag=c0000e00018000&cquery=100o_101r_100B_100x_100z&dy_q=1754361813&feature_id=63e57b176b357061c14e0ab4b250020b&l=20250805104332288948511D5931AF76A4",
    //               "https://v3-web.douyinvod.com/4f8b1607280bd140f0750943dff95a33/68919a24/video/tos/cn/tos-cn-ve-15/oshUDiBA9AA3GEze8yiIzuBAKQFgM0DS8nfP3P/?a=6383&ch=10010&cr=3&dr=0&lr=all&cd=0%7C0%7C0%7C3&cv=1&br=979&bt=979&cs=2&ds=3&ft=GZnU0RqeffPdXP~ka1jNvAq-antLjrKYyVmCRkaml6C9UjVhWL6&mime_type=video_mp4&qs=0&rc=OTo2aDw5Zmk0PDU6OmlnNEBpanE7Zm45cmk0eTMzNGkzM0A1YTEzNmFeXjExMi5eMzBgYSM0X25eMmRja21gLS1kLTBzcw%3D%3D&btag=c0000e00018000&cquery=101r_100B_100x_100z_100o&dy_q=1754361813&feature_id=63e57b176b357061c14e0ab4b250020b&l=20250805104332288948511D5931AF76A4",
    //               "https://www.douyin.com/aweme/v1/play/?video_id=v0300fg10000cvp1nffog65kacq8bn7g&line=0&file_id=c13d6fa717524941afacd6996e43d786&sign=406916694dc74dc8cd2a706ed9dc8e2c&is_play_url=1&source=PackSourceEnum_PUBLISH",
    //             ],
    //             width: 1280,
    //             height: 720,
    //             url_key:
    //               "v0300fg10000cvp1nffog65kacq8bn7g_bytevc1_720p_1003445",
    //             data_size: 3984555,
    //             file_hash: "406916694dc74dc8cd2a706ed9dc8e2c",
    //             file_cs:
    //               "c:0-27784-8193|d:0-1992276-6150,1992277-3984554-ed65|a:v0300fg10000cvp1nffog65kacq8bn7g",
    //           },
    //           is_h265: 1,
    //           is_bytevc1: 1,
    //           HDR_type: "",
    //           HDR_bit: "",
    //           FPS: 30,
    //           video_extra:
    //             '{"PktOffsetMap":"[{\\"time\\": 1, \\"offset\\": 187746}, {\\"time\\": 2, \\"offset\\": 257927}, {\\"time\\": 3, \\"offset\\": 347081}, {\\"time\\": 4, \\"offset\\": 455205}, {\\"time\\": 5, \\"offset\\": 592049}, {\\"time\\": 10, \\"offset\\": 1226985}]","format":"mp4","definition":"720p","quality":"normal","file_id":"c13d6fa717524941afacd6996e43d786","v_gear_id":"aweme/high_value_group","u_vmaf":89.1627,"applog_map":{"feature_id":"63e57b176b357061c14e0ab4b250020b"},"sr_sharpness_strength":8,"mvmaf":"{\\"mvmaf_sr_v1080\\":96.524,\\"mvmaf_sr_v960\\":98.242,\\"mvmaf_sr_v864\\":98.367,\\"mvmaf_sr_v720\\":99.819,\\"mvmaf_ori_v1080\\":85.479,\\"mvmaf_ori_v960\\":89.514,\\"mvmaf_ori_v864\\":90.974,\\"mvmaf_ori_v720\\":95.649}","ufq":"{\\"enh\\":84.208,\\"playback\\":{\\"ori\\":73.687,\\"srv1\\":83.017},\\"src\\":83.698,\\"trans\\":73.687,\\"version\\":\\"v1.0\\"}","audio_channels":"2.0","audio_sample_rate":"44100"}',
    //           format: "mp4",
    //         },
    //         {
    //           gear_name: "540_2_1",
    //           quality_type: 23,
    //           bit_rate: 736914,
    //           play_addr: {
    //             uri: "v0300fg10000cvp1nffog65kacq8bn7g",
    //             url_list: [
    //               "https://v95-web-sz.douyinvod.com/58c8c13ffe3c91c9f6733aa79788cce5/68919a24/video/tos/cn/tos-cn-ve-15/okd5M8i7BQfGiro5mAPAWCaIAy7DAUu5fBAWQf/?a=6383&ch=10010&cr=3&dr=0&lr=all&cd=0%7C0%7C0%7C3&cv=1&br=719&bt=719&cs=2&ds=6&ft=GZnU0RqeffPdXP~ka1jNvAq-antLjrKYyVmCRkaml6C9UjVhWL6&mime_type=video_mp4&qs=0&rc=NDRkZTw0ZDo6ZzdoN2c8NUBpanE7Zm45cmk0eTMzNGkzM0A0YmNjXy1jNmIxXmNgLV8uYSM0X25eMmRja21gLS1kLTBzcw%3D%3D&btag=c0000e00018000&cquery=101r_100B_100x_100z_100o&dy_q=1754361813&feature_id=63e57b176b357061c14e0ab4b250020b&l=20250805104332288948511D5931AF76A4",
    //               "https://v3-web.douyinvod.com/61d96fd5789d9b02664e36711aa58596/68919a24/video/tos/cn/tos-cn-ve-15/okd5M8i7BQfGiro5mAPAWCaIAy7DAUu5fBAWQf/?a=6383&ch=10010&cr=3&dr=0&lr=all&cd=0%7C0%7C0%7C3&cv=1&br=719&bt=719&cs=2&ds=6&ft=GZnU0RqeffPdXP~ka1jNvAq-antLjrKYyVmCRkaml6C9UjVhWL6&mime_type=video_mp4&qs=0&rc=NDRkZTw0ZDo6ZzdoN2c8NUBpanE7Zm45cmk0eTMzNGkzM0A0YmNjXy1jNmIxXmNgLV8uYSM0X25eMmRja21gLS1kLTBzcw%3D%3D&btag=c0000e00018000&cquery=100o_101r_100B_100x_100z&dy_q=1754361813&feature_id=63e57b176b357061c14e0ab4b250020b&l=20250805104332288948511D5931AF76A4",
    //               "https://www.douyin.com/aweme/v1/play/?video_id=v0300fg10000cvp1nffog65kacq8bn7g&line=0&file_id=12b90dc4fea44de797fa01b9fbfae171&sign=3f04e6abb59d79487267a52596e46008&is_play_url=1&source=PackSourceEnum_PUBLISH",
    //             ],
    //             width: 1024,
    //             height: 576,
    //             url_key: "v0300fg10000cvp1nffog65kacq8bn7g_bytevc1_540p_736914",
    //             data_size: 2926195,
    //             file_hash: "3f04e6abb59d79487267a52596e46008",
    //             file_cs:
    //               "c:0-27784-61ec|d:0-1463096-bdd1,1463097-2926194-6dd1|a:v0300fg10000cvp1nffog65kacq8bn7g",
    //           },
    //           is_h265: 1,
    //           is_bytevc1: 1,
    //           HDR_type: "",
    //           HDR_bit: "",
    //           FPS: 30,
    //           video_extra:
    //             '{"PktOffsetMap":"[{\\"time\\": 1, \\"offset\\": 145622}, {\\"time\\": 2, \\"offset\\": 196368}, {\\"time\\": 3, \\"offset\\": 260737}, {\\"time\\": 4, \\"offset\\": 339623}, {\\"time\\": 5, \\"offset\\": 437945}, {\\"time\\": 10, \\"offset\\": 906327}]","format":"mp4","definition":"540p","quality":"normal","file_id":"12b90dc4fea44de797fa01b9fbfae171","v_gear_id":"aweme/high_value_group","u_vmaf":84.7529,"applog_map":{"feature_id":"63e57b176b357061c14e0ab4b250020b"},"sr_sharpness_strength":8,"mvmaf":"{\\"mvmaf_sr_v1080\\":90.565,\\"mvmaf_sr_v960\\":93.769,\\"mvmaf_sr_v864\\":95.24,\\"mvmaf_sr_v720\\":97.23,\\"mvmaf_ori_v1080\\":77.801,\\"mvmaf_ori_v960\\":80.969,\\"mvmaf_ori_v864\\":83.687,\\"mvmaf_ori_v720\\":88.483}","ufq":"{\\"enh\\":84.208,\\"playback\\":{\\"ori\\":67.809,\\"srv1\\":78.277},\\"src\\":83.698,\\"trans\\":67.809,\\"version\\":\\"v1.0\\"}","audio_channels":"2.0","audio_sample_rate":"44100"}',
    //           format: "mp4",
    //         },
    //         {
    //           gear_name: "540_3_1",
    //           quality_type: 24,
    //           bit_rate: 495463,
    //           play_addr: {
    //             uri: "v0300fg10000cvp1nffog65kacq8bn7g",
    //             url_list: [
    //               "https://v95-web-sz.douyinvod.com/673cfcdab436cf24e6c3420d37c0cd6d/68919a24/video/tos/cn/tos-cn-ve-15/ogn4DmyUeB3IhAi90AFEzIoQB8ASghfHtuKBiP/?a=6383&ch=10010&cr=3&dr=0&lr=all&cd=0%7C0%7C0%7C3&cv=1&br=483&bt=483&cs=2&ds=6&ft=GZnU0RqeffPdXP~ka1jNvAq-antLjrKYyVmCRkaml6C9UjVhWL6&mime_type=video_mp4&qs=0&rc=PGhpZWQ7NTQ7PGlnOjg8N0BpanE7Zm45cmk0eTMzNGkzM0A1Li1eMDQzNl4xYzYzYGIuYSM0X25eMmRja21gLS1kLTBzcw%3D%3D&btag=c0000e00018000&cquery=100B_100x_100z_100o_101r&dy_q=1754361813&feature_id=7eb8b6723a824f510faba596be48d733&l=20250805104332288948511D5931AF76A4",
    //               "https://v3-web.douyinvod.com/4b48944e91badf696c390e4b6048011e/68919a24/video/tos/cn/tos-cn-ve-15/ogn4DmyUeB3IhAi90AFEzIoQB8ASghfHtuKBiP/?a=6383&ch=10010&cr=3&dr=0&lr=all&cd=0%7C0%7C0%7C3&cv=1&br=483&bt=483&cs=2&ds=6&ft=GZnU0RqeffPdXP~ka1jNvAq-antLjrKYyVmCRkaml6C9UjVhWL6&mime_type=video_mp4&qs=0&rc=PGhpZWQ7NTQ7PGlnOjg8N0BpanE7Zm45cmk0eTMzNGkzM0A1Li1eMDQzNl4xYzYzYGIuYSM0X25eMmRja21gLS1kLTBzcw%3D%3D&btag=c0000e00018000&cquery=101r_100B_100x_100z_100o&dy_q=1754361813&feature_id=7eb8b6723a824f510faba596be48d733&l=20250805104332288948511D5931AF76A4",
    //               "https://www.douyin.com/aweme/v1/play/?video_id=v0300fg10000cvp1nffog65kacq8bn7g&line=0&file_id=14e9c5679dff49a89162783aab0f1e89&sign=1334ef247c4bc632bb997c9975feedd6&is_play_url=1&source=PackSourceEnum_PUBLISH",
    //             ],
    //             width: 960,
    //             height: 540,
    //             url_key: "v0300fg10000cvp1nffog65kacq8bn7g_bytevc1_540p_495463",
    //             data_size: 1967422,
    //             file_hash: "1334ef247c4bc632bb997c9975feedd6",
    //             file_cs:
    //               "c:0-27783-7611|d:0-983710-2f5a,983711-1967421-63a8|a:v0300fg10000cvp1nffog65kacq8bn7g",
    //           },
    //           is_h265: 1,
    //           is_bytevc1: 1,
    //           HDR_type: "",
    //           HDR_bit: "",
    //           FPS: 30,
    //           video_extra:
    //             '{"PktOffsetMap":"[{\\"time\\": 1, \\"offset\\": 111226}, {\\"time\\": 2, \\"offset\\": 145682}, {\\"time\\": 3, \\"offset\\": 189644}, {\\"time\\": 4, \\"offset\\": 243943}, {\\"time\\": 5, \\"offset\\": 309387}, {\\"time\\": 10, \\"offset\\": 625408}]","format":"mp4","definition":"540p","quality":"normal","file_id":"14e9c5679dff49a89162783aab0f1e89","v_gear_id":"aweme/high_value_group","u_vmaf":80.1011,"applog_map":{"feature_id":"7eb8b6723a824f510faba596be48d733"},"sr_sharpness_strength":8,"mvmaf":"{\\"mvmaf_sr_v1080\\":84.995,\\"mvmaf_sr_v960\\":88.801,\\"mvmaf_sr_v864\\":91,\\"mvmaf_sr_v720\\":93.64,\\"mvmaf_ori_v1080\\":72.785,\\"mvmaf_ori_v960\\":76.657,\\"mvmaf_ori_v864\\":80.299,\\"mvmaf_ori_v720\\":84.938}","ufq":"{\\"enh\\":84.208,\\"playback\\":{\\"ori\\":64.047,\\"srv1\\":72.708},\\"src\\":83.698,\\"trans\\":64.047,\\"version\\":\\"v1.0\\"}","audio_channels":"2.0","audio_sample_rate":"44100"}',
    //           format: "mp4",
    //         },
    //         {
    //           gear_name: "540_4_1",
    //           quality_type: 25,
    //           bit_rate: 364663,
    //           play_addr: {
    //             uri: "v0300fg10000cvp1nffog65kacq8bn7g",
    //             url_list: [
    //               "https://v95-web-sz.douyinvod.com/3a96c267eec8fa1ed5b2398bab82ebd5/68919a24/video/tos/cn/tos-cn-ve-15/o8xBwdPIkNcG6CIUA7GODeIqLBA73g5ReeXTCQ/?a=6383&ch=10010&cr=3&dr=0&lr=all&cd=0%7C0%7C0%7C3&cv=1&br=356&bt=356&cs=2&ds=6&ft=GZnU0RqeffPdXP~ka1jNvAq-antLjrKYyVmCRkaml6C9UjVhWL6&mime_type=video_mp4&qs=0&rc=OWY0aWk8Zzk4NTM8ZzozPEBpanE7Zm45cmk0eTMzNGkzM0AvLi4wNmMxNjAxNGMtXjI0YSM0X25eMmRja21gLS1kLTBzcw%3D%3D&btag=c0000e00018000&cquery=100z_100o_101r_100B_100x&dy_q=1754361813&feature_id=7eb8b6723a824f510faba596be48d733&l=20250805104332288948511D5931AF76A4",
    //               "https://v3-web.douyinvod.com/a83d16482a37c2fbb0148987aa964f52/68919a24/video/tos/cn/tos-cn-ve-15/o8xBwdPIkNcG6CIUA7GODeIqLBA73g5ReeXTCQ/?a=6383&ch=10010&cr=3&dr=0&lr=all&cd=0%7C0%7C0%7C3&cv=1&br=356&bt=356&cs=2&ds=6&ft=GZnU0RqeffPdXP~ka1jNvAq-antLjrKYyVmCRkaml6C9UjVhWL6&mime_type=video_mp4&qs=0&rc=OWY0aWk8Zzk4NTM8ZzozPEBpanE7Zm45cmk0eTMzNGkzM0AvLi4wNmMxNjAxNGMtXjI0YSM0X25eMmRja21gLS1kLTBzcw%3D%3D&btag=c0000e00018000&cquery=100x_100z_100o_101r_100B&dy_q=1754361813&feature_id=7eb8b6723a824f510faba596be48d733&l=20250805104332288948511D5931AF76A4",
    //               "https://www.douyin.com/aweme/v1/play/?video_id=v0300fg10000cvp1nffog65kacq8bn7g&line=0&file_id=7950a70df9704235964df99f3f111c26&sign=16788bc5ca9fbde8493e8cd3fc432380&is_play_url=1&source=PackSourceEnum_PUBLISH",
    //             ],
    //             width: 960,
    //             height: 540,
    //             url_key: "v0300fg10000cvp1nffog65kacq8bn7g_bytevc1_540p_364663",
    //             data_size: 1448035,
    //             file_hash: "16788bc5ca9fbde8493e8cd3fc432380",
    //             file_cs:
    //               "c:0-27783-bb79|d:0-724016-6e52,724017-1448034-5ac5|a:v0300fg10000cvp1nffog65kacq8bn7g",
    //           },
    //           is_h265: 1,
    //           is_bytevc1: 1,
    //           HDR_type: "",
    //           HDR_bit: "",
    //           FPS: 30,
    //           video_extra:
    //             '{"PktOffsetMap":"[{\\"time\\": 1, \\"offset\\": 91198}, {\\"time\\": 2, \\"offset\\": 116875}, {\\"time\\": 3, \\"offset\\": 150112}, {\\"time\\": 4, \\"offset\\": 189932}, {\\"time\\": 5, \\"offset\\": 237475}, {\\"time\\": 10, \\"offset\\": 470656}]","format":"mp4","definition":"540p","quality":"normal","file_id":"7950a70df9704235964df99f3f111c26","v_gear_id":"aweme/high_value_group","u_vmaf":75.6151,"applog_map":{"feature_id":"7eb8b6723a824f510faba596be48d733"},"sr_sharpness_strength":8,"mvmaf":"{\\"mvmaf_sr_v1080\\":79.396,\\"mvmaf_sr_v960\\":83.719,\\"mvmaf_sr_v864\\":85.39,\\"mvmaf_sr_v720\\":88.288,\\"mvmaf_ori_v1080\\":66.787,\\"mvmaf_ori_v960\\":71.911,\\"mvmaf_ori_v864\\":74.984,\\"mvmaf_ori_v720\\":79.713}","ufq":"{\\"enh\\":84.208,\\"playback\\":{\\"ori\\":59.548,\\"srv1\\":68.509},\\"src\\":83.698,\\"trans\\":59.548,\\"version\\":\\"v1.0\\"}","audio_channels":"2.0","audio_sample_rate":"44100"}',
    //           format: "mp4",
    //         },
    //       ],
    //       duration: 31767,
    //       bit_rate_audio: null,
    //       gaussian_cover: {
    //         uri: "tos-cn-p-0015/ooGTkeedGIcDPLZBMPRCA7G8I5gBNgNA7Xfgos",
    //         url_list: [
    //           "https://p3-pc-sign.douyinpic.com/tos-cn-p-0015/ooGTkeedGIcDPLZBMPRCA7G8I5gBNgNA7Xfgos~tplv-tsj2vxp0zn-gaosi:40.jpeg?lk3s=138a59ce&x-expires=1785895200&x-signature=qMXXCSPHM1YhY5auT14rUryUJus%3D&from=327834062",
    //           "https://p9-pc-sign.douyinpic.com/tos-cn-p-0015/ooGTkeedGIcDPLZBMPRCA7G8I5gBNgNA7Xfgos~tplv-tsj2vxp0zn-gaosi:40.jpeg?lk3s=138a59ce&x-expires=1785895200&x-signature=CiaHiHPUqihPETI8wYdATVzEAZE%3D&from=327834062",
    //         ],
    //         width: 720,
    //         height: 720,
    //       },
    //       play_addr_265: {
    //         uri: "v0300fg10000cvp1nffog65kacq8bn7g",
    //         url_list: [
    //           "https://v95-web-sz.douyinvod.com/1bb08debce66dbbfa15f6d82e38e24e9/68919a24/video/tos/cn/tos-cn-ve-15/oQWQ3AfiQg8XnePDUEBu9FAzJzI3iSASB03hxy/?a=6383&ch=10010&cr=3&dr=0&lr=all&cd=0%7C0%7C0%7C3&cv=1&br=2398&bt=2398&cs=2&ft=GZnU0RqeffPdXP~ka1jNvAq-antLjrKYyVmCRkaml6C9UjVhWL6&mime_type=video_mp4&qs=15&rc=aGVoaWY6aDhlZGU0NmZlOUBpanE7Zm45cmk0eTMzNGkzM0AxLzU1XzVjNWMxYzQzLl9hYSM0X25eMmRja21gLS1kLTBzcw%3D%3D&btag=c0000e00018000&cquery=101r_100B_100x_100z_100o&dy_q=1754361813&feature_id=10cf95ef75b4f3e7eac623e4ea0ea691&l=20250805104332288948511D5931AF76A4",
    //           "https://v3-web.douyinvod.com/5ce22a161bd187ad679b90b6da3159bc/68919a24/video/tos/cn/tos-cn-ve-15/oQWQ3AfiQg8XnePDUEBu9FAzJzI3iSASB03hxy/?a=6383&ch=10010&cr=3&dr=0&lr=all&cd=0%7C0%7C0%7C3&cv=1&br=2398&bt=2398&cs=2&ft=GZnU0RqeffPdXP~ka1jNvAq-antLjrKYyVmCRkaml6C9UjVhWL6&mime_type=video_mp4&qs=15&rc=aGVoaWY6aDhlZGU0NmZlOUBpanE7Zm45cmk0eTMzNGkzM0AxLzU1XzVjNWMxYzQzLl9hYSM0X25eMmRja21gLS1kLTBzcw%3D%3D&btag=c0000e00018000&cquery=100z_100o_101r_100B_100x&dy_q=1754361813&feature_id=10cf95ef75b4f3e7eac623e4ea0ea691&l=20250805104332288948511D5931AF76A4",
    //           "https://www.douyin.com/aweme/v1/play/?video_id=v0300fg10000cvp1nffog65kacq8bn7g&line=0&file_id=d6bb1c6371fb4afb85fe87bc8f8e2b4e&sign=79e51c2806a2b45e64f5febb1e3090b4&is_play_url=1&source=PackSourceEnum_PUBLISH",
    //         ],
    //         width: 2560,
    //         height: 1440,
    //         url_key: "v0300fg10000cvp1nffog65kacq8bn7g_bytevc1_1440p_2456327",
    //         data_size: 9745786,
    //         file_hash: "79e51c2806a2b45e64f5febb1e3090b4",
    //         file_cs:
    //           "c:0-36251-13b5|d:0-4872892-78f1,4872893-9745785-0521|a:v0300fg10000cvp1nffog65kacq8bn7g",
    //       },
    //       audio: {
    //         original_sound_infos: null,
    //       },
    //       play_addr_h264: {
    //         uri: "v0300fg10000cvp1nffog65kacq8bn7g",
    //         url_list: [
    //           "https://v95-web-sz.douyinvod.com/6e32e52ae7b43f97ca3cf2b4c3cb7886/68919a24/video/tos/cn/tos-cn-ve-15c001-alinc2/oUeP6X7fBcG5IyWIoKLd7gfoB8tNRACRDcAGTA/?a=6383&ch=10010&cr=3&dr=0&lr=all&cd=0%7C0%7C0%7C3&cv=1&br=2965&bt=2965&cs=0&ds=4&ft=GZnU0RqeffPdXP~ka1jNvAq-antLjrKYyVmCRkaml6C9UjVhWL6&mime_type=video_mp4&qs=0&rc=PGZlPDc5OTo1NzY2Nmk7NkBpanE7Zm45cmk0eTMzNGkzM0AxMS8xYTBeNjExLWMwYDJiYSM0X25eMmRja21gLS1kLTBzcw%3D%3D&btag=c0000e00018000&cquery=100o_101r_100B_100x_100z&dy_q=1754361813&feature_id=46a7bb47b4fd1280f3d3825bf2b29388&l=20250805104332288948511D5931AF76A4",
    //           "https://v3-web.douyinvod.com/34feb51b7ee905a67ba410eba3d5d897/68919a24/video/tos/cn/tos-cn-ve-15c001-alinc2/oUeP6X7fBcG5IyWIoKLd7gfoB8tNRACRDcAGTA/?a=6383&ch=10010&cr=3&dr=0&lr=all&cd=0%7C0%7C0%7C3&cv=1&br=2965&bt=2965&cs=0&ds=4&ft=GZnU0RqeffPdXP~ka1jNvAq-antLjrKYyVmCRkaml6C9UjVhWL6&mime_type=video_mp4&qs=0&rc=PGZlPDc5OTo1NzY2Nmk7NkBpanE7Zm45cmk0eTMzNGkzM0AxMS8xYTBeNjExLWMwYDJiYSM0X25eMmRja21gLS1kLTBzcw%3D%3D&btag=c0000e00018000&cquery=101r_100B_100x_100z_100o&dy_q=1754361813&feature_id=46a7bb47b4fd1280f3d3825bf2b29388&l=20250805104332288948511D5931AF76A4",
    //           "https://www.douyin.com/aweme/v1/play/?video_id=v0300fg10000cvp1nffog65kacq8bn7g&line=0&file_id=e358cf33f303444297a636d4492b4c49&sign=348ed2bbef66c7f604c8aa1ce8c1ab5a&is_play_url=1&source=PackSourceEnum_PUBLISH",
    //         ],
    //         width: 1920,
    //         height: 1080,
    //         url_key: "v0300fg10000cvp1nffog65kacq8bn7g_h264_1080p_3036649",
    //         data_size: 12058157,
    //         file_hash: "348ed2bbef66c7f604c8aa1ce8c1ab5a",
    //         file_cs:
    //           "c:0-27578-105d|d:0-6029077-8faa,6029078-12058156-6958|a:v0300fg10000cvp1nffog65kacq8bn7g",
    //       },
    //       raw_cover: {
    //         uri: "tos-cn-i-0813/oIa9u8EHAAp3XkDeAkvlN8gIDfAEFAAuUCAnhQ",
    //         url_list: [
    //           "https://p3-pc-sign.douyinpic.com/tos-cn-i-0813/oIa9u8EHAAp3XkDeAkvlN8gIDfAEFAAuUCAnhQ~tplv-dy-cropcenter:323:430.jpeg?lk3s=138a59ce&x-expires=2069719200&x-signature=nxtYoOCopButhjG05ASGYdw46w4%3D&from=327834062&s=PackSourceEnum_PUBLISH&se=true&sh=323_430&sc=cover&biz_tag=pcweb_cover&l=20250805104332288948511D5931AF76A4",
    //           "https://p9-pc-sign.douyinpic.com/obj/tos-cn-i-0813/oIa9u8EHAAp3XkDeAkvlN8gIDfAEFAAuUCAnhQ?lk3s=138a59ce&x-expires=2069719200&x-signature=36boh8k%2BxtE9LXvEjmVN8sL6k4s%3D&from=327834062&s=PackSourceEnum_PUBLISH&se=false&sc=cover&biz_tag=pcweb_cover&l=20250805104332288948511D5931AF76A4",
    //           "https://p3-pc-sign.douyinpic.com/obj/tos-cn-i-0813/oIa9u8EHAAp3XkDeAkvlN8gIDfAEFAAuUCAnhQ?lk3s=138a59ce&x-expires=2069719200&x-signature=68LDC6qk4xqYw96arCd9vV26y5E%3D&from=327834062&s=PackSourceEnum_PUBLISH&se=false&sc=cover&biz_tag=pcweb_cover&l=20250805104332288948511D5931AF76A4",
    //         ],
    //         width: 720,
    //         height: 720,
    //       },
    //       animated_cover: {
    //         uri: "tos-cn-i-0813/oIa9u8EHAAp3XkDeAkvlN8gIDfAEFAAuUCAnhQ",
    //         url_list: [
    //           "https://p3-pc-sign.douyinpic.com/obj/tos-cn-i-0813/oIa9u8EHAAp3XkDeAkvlN8gIDfAEFAAuUCAnhQ?lk3s=138a59ce&x-expires=1755568800&x-signature=HCBrryLk1VGKn29TniauCJlVgM8%3D&from=327834062_large&s=PackSourceEnum_PUBLISH&se=false&sc=dynamic_cover&biz_tag=pcweb_cover&l=20250805104332288948511D5931AF76A4",
    //           "https://p9-pc-sign.douyinpic.com/obj/tos-cn-i-0813/oIa9u8EHAAp3XkDeAkvlN8gIDfAEFAAuUCAnhQ?lk3s=138a59ce&x-expires=1755568800&x-signature=TiPGtWS1pC84V97ZPIjIX2OuUAY%3D&from=327834062_large&s=PackSourceEnum_PUBLISH&se=false&sc=dynamic_cover&biz_tag=pcweb_cover&l=20250805104332288948511D5931AF76A4",
    //         ],
    //       },
    //       horizontal_type: 1,
    //       big_thumbs: [
    //         {
    //           img_num: 32,
    //           uri: "tos-cn-p-0015/osUnLouSvAZ0D9CagIiP8HDBefz3FChiAABnyI",
    //           img_url:
    //             "https://p3-sign.douyinpic.com/tos-cn-p-0015/osUnLouSvAZ0D9CagIiP8HDBefz3FChiAABnyI~tplv-noop.image?cquery=100o_101r_100B_100x_100z&dy_q=1754361813&l=20250805104332288948511D5931AF76A4&x-expires=1754372644&x-signature=TTX4HbE0hzzDDc%2BFu7RQ0O27TCw%3D",
    //           img_x_size: 240,
    //           img_y_size: 136,
    //           img_x_len: 5,
    //           img_y_len: 5,
    //           duration: 31.735,
    //           interval: 1,
    //           fext: "jpg",
    //           uris: [
    //             "tos-cn-p-0015/osUnLouSvAZ0D9CagIiP8HDBefz3FChiAABnyI",
    //             "tos-cn-p-0015/ok7nJB7IARhQcCEPeDGLIdX5QCNeeRVksAGOBT",
    //           ],
    //           img_urls: [
    //             "https://p3-sign.douyinpic.com/tos-cn-p-0015/osUnLouSvAZ0D9CagIiP8HDBefz3FChiAABnyI~tplv-noop.image?cquery=100o_101r_100B_100x_100z&dy_q=1754361813&l=20250805104332288948511D5931AF76A4&x-expires=1754372644&x-signature=TTX4HbE0hzzDDc%2BFu7RQ0O27TCw%3D",
    //             "https://p3-sign.douyinpic.com/tos-cn-p-0015/ok7nJB7IARhQcCEPeDGLIdX5QCNeeRVksAGOBT~tplv-noop.image?cquery=100o_101r_100B_100x_100z&dy_q=1754361813&l=20250805104332288948511D5931AF76A4&x-expires=1754372644&x-signature=GFMNMdoZWEnmv9Wzg0aIn73MhhQ%3D",
    //           ],
    //         },
    //       ],
    //       video_model: "",
    //       use_static_cover: true,
    //     },
    //     share_url:
    //       "https://www.iesdouyin.com/share/video/7490079748131933459/?region=CN&mid=7490079452254784310&u_code=jj95fjd6&did=MS4wLjABAAAA9BaozTVk2tPsswpnTKn2Rdxwxvwaw4OqWG7lK0mIBhvGg-Zhtj_y_KgVTFY1STgO&iid=MS4wLjABAAAANwkJuWIRFOzg5uCpDRpMj4OX-QryoDgn-yYlXQnRwQQ&with_sec_did=1&video_share_track_ver=&titleType=title&share_sign=xL2XYOSmp9rjabO_jqm.8WjaQhWiX8ViMgG3_4wTe9c-&share_version=190500&ts=1754361813&from_aid=6383&from_ssr=1",
    //     user_digged: 0,
    //     statistics: {
    //       recommend_count: 1435,
    //       comment_count: 1637,
    //       digg_count: 63950,
    //       admire_count: 0,
    //       play_count: 0,
    //       share_count: 19019,
    //       collect_count: 5278,
    //     },
    //     status: {
    //       not_allow_soft_del_reason: "ab",
    //       is_delete: false,
    //       allow_share: true,
    //       review_result: {
    //         review_status: 0,
    //       },
    //       allow_friend_recommend_guide: true,
    //       part_see: 0,
    //       private_status: 0,
    //       listen_video_status: 2,
    //       in_reviewing: false,
    //       allow_self_recommend_to_friend: true,
    //       allow_friend_recommend: true,
    //       is_prohibited: false,
    //       enable_soft_delete: 0,
    //     },
    //     enable_comment_sticker_rec: false,
    //     text_extra: [
    //       {
    //         start: 12,
    //         end: 26,
    //         type: 1,
    //         hashtag_name: "给生活找点乐子自嗨模式开启",
    //         hashtag_id: "1678168413628424",
    //         is_commerce: false,
    //         caption_start: 12,
    //         caption_end: 26,
    //       },
    //       {
    //         start: 27,
    //         end: 43,
    //         type: 1,
    //         hashtag_name: "志同道合的人才会喜欢同一片风景",
    //         hashtag_id: "1767586781314062",
    //         is_commerce: false,
    //         caption_start: 27,
    //         caption_end: 43,
    //       },
    //     ],
    //     is_top: 1,
    //     personal_page_botton_diagnose_style: 0,
    //     share_info: {
    //       share_url:
    //         "https://www.iesdouyin.com/share/video/7490079748131933459/?region=CN&mid=7490079452254784310&u_code=jj95fjd6&did=MS4wLjABAAAA9BaozTVk2tPsswpnTKn2Rdxwxvwaw4OqWG7lK0mIBhvGg-Zhtj_y_KgVTFY1STgO&iid=MS4wLjABAAAANwkJuWIRFOzg5uCpDRpMj4OX-QryoDgn-yYlXQnRwQQ&with_sec_did=1&video_share_track_ver=&titleType=title&share_sign=xL2XYOSmp9rjabO_jqm.8WjaQhWiX8ViMgG3_4wTe9c-&share_version=190500&ts=1754361813&from_aid=6383&from_ssr=1",
    //       share_link_desc:
    //         "2.35 hOx:/ 08/27 c@N.jP 大小姐驾到 通通闪开🥳# 给生活找点乐子自嗨模式开启 # 志同道合的人才会喜欢同一片风景  %s 复制此链接，打开Dou音搜索，直接观看视频！",
    //     },
    //     is_from_ad_auth: false,
    //     video_labels: null,
    //     original_anchor_type: 15,
    //     is_ads: false,
    //     duration: 31767,
    //     aweme_type: 0,
    //     galileo_pad_textcrop: {
    //       ipad_d_h_cut_ratio: [1, 1],
    //       ipad_d_v_cut_ratio: [2, 2],
    //       android_d_h_cut_ratio: [1],
    //       android_d_v_cut_ratio: [2],
    //       version: 1,
    //     },
    //     follow_shoot_clip_info: {
    //       clip_video_all: 7490079452254785000,
    //       clip_from_user: 7490079452254785000,
    //     },
    //     image_infos: null,
    //     risk_infos: {
    //       vote: false,
    //       warn: false,
    //       risk_sink: false,
    //       type: 0,
    //       content: "",
    //     },
    //     game_tag_info: {
    //       is_game: false,
    //     },
    //     friend_recommend_info: {
    //       friend_recommend_source: 10,
    //       label_user_list: null,
    //       disable_friend_recommend_guide_label: false,
    //     },
    //     position: null,
    //     uniqid_position: null,
    //     comment_list: null,
    //     author_user_id: 888870295051540,
    //     caption_template_id: 0,
    //     geofencing: [],
    //     entertainment_video_type: 2,
    //     aweme_listen_struct: {
    //       trace_info:
    //         '{"copyright_not_speech":"false","copyright_reason":"has_listen_cp_new","copyright_tag_hit":"","copyright_use_aed_default":"false","copyright_use_tag_default":"false","cp_ab":"true","desc":"","duration_over":"false","hit_high_risk":"false","media_type":"4","reason":"hit_ab_0","show":"false"}',
    //     },
    //     region: "CN",
    //     video_text: null,
    //     original: 0,
    //     collect_stat: 0,
    //     label_top_text: null,
    //     promotions: [],
    //     group_id: "7490079748131933459",
    //     prevent_download: false,
    //     nickname_position: null,
    //     challenge_position: null,
    //     publish_plus_alienation: {
    //       alienation_type: 0,
    //     },
    //     is_use_music: false,
    //     caption:
    //       "大小姐驾到 通通闪开🥳#给生活找点乐子自嗨模式开启 #志同道合的人才会喜欢同一片风景",
    //     long_video: null,
    //     mv_info: null,
    //     can_cache_to_local: true,
    //     item_title: "",
    //     series_basic_info: {},
    //     interaction_stickers: null,
    //     flash_mob_trends: 0,
    //     origin_comment_ids: null,
    //     commerce_config_data: null,
    //     cf_assets_type: 0,
    //     video_control: {
    //       allow_download: true,
    //       share_type: 1,
    //       show_progress_bar: 1,
    //       draft_progress_bar: 1,
    //       allow_duet: true,
    //       allow_react: true,
    //       prevent_download_type: 0,
    //       allow_dynamic_wallpaper: true,
    //       timer_status: 1,
    //       allow_music: true,
    //       allow_stitch: true,
    //       allow_douplus: true,
    //       allow_share: true,
    //       share_grayed: false,
    //       download_ignore_visibility: true,
    //       duet_ignore_visibility: true,
    //       share_ignore_visibility: true,
    //       download_info: {
    //         level: 0,
    //       },
    //       duet_info: {
    //         level: 0,
    //       },
    //       allow_record: true,
    //       disable_record_reason: "",
    //       timer_info: {},
    //     },
    //     aweme_control: {
    //       can_forward: true,
    //       can_share: true,
    //       can_comment: true,
    //       can_show_comment: true,
    //     },
    //     is_moment_history: 0,
    //     mix_info: {
    //       mix_id: "7528287669684537382",
    //       mix_name: "行车“疯”景",
    //       cover_url: {
    //         uri: "douyin-user-image-file/1a1dd7b1e7c40864e8dc60118fa1e9d8",
    //         url_list: [
    //           "https://p95-sz-sign.douyinpic.com/obj/douyin-user-image-file/1a1dd7b1e7c40864e8dc60118fa1e9d8?lk3s=138a59ce&x-expires=1754380800&x-signature=VWkfuwX6F8BoYGR1wUgJnbMn7Aw%3D&from=327834062&s=PackSourceEnum_PUBLISH&se=false&sc=mix_cover&biz_tag=aweme_mix&l=20250805104332288948511D5931AF76A4",
    //           "https://p26-sign.douyinpic.com/obj/douyin-user-image-file/1a1dd7b1e7c40864e8dc60118fa1e9d8?lk3s=138a59ce&x-expires=1754380800&x-signature=3AaIOjwwai7jO3GRZ%2FBdJYzboR4%3D&from=327834062&s=PackSourceEnum_PUBLISH&se=false&sc=mix_cover&biz_tag=aweme_mix&l=20250805104332288948511D5931AF76A4",
    //           "https://p9-sign.douyinpic.com/obj/douyin-user-image-file/1a1dd7b1e7c40864e8dc60118fa1e9d8?lk3s=138a59ce&x-expires=1754380800&x-signature=bhNXUBtZNhaVT6OjY2evBWwjBnQ%3D&from=327834062&s=PackSourceEnum_PUBLISH&se=false&sc=mix_cover&biz_tag=aweme_mix&l=20250805104332288948511D5931AF76A4",
    //         ],
    //         width: 720,
    //         height: 720,
    //       },
    //       status: {
    //         status: 2,
    //         is_collected: 0,
    //       },
    //       statis: {
    //         play_vv: 0,
    //         collect_vv: 0,
    //         current_episode: 6,
    //         updated_to_episode: 21,
    //       },
    //       desc: "",
    //       extra:
    //         '{"audit_locktime":1753640522,"ban_fields":[],"create_source":0,"enter_from":"app","first_reviewed":1,"is_author_set_self_see":0,"last_added_item_time":1753667012,"mix_ad_info":{"copy_right_item_count":21,"music_physical_game_count":6,"risk_copy_right_item_count":0},"mix_pic_type":0,"next_info":{"cover":"douyin-user-image-file/1a1dd7b1e7c40864e8dc60118fa1e9d8","desc":"","name":"行车“疯”景"},"pic_item_count":0,"segmentation":"敌 蜜 好 起来 了","top_item_content_label":{"2023":6,"2029":15},"total_duration":444}',
    //       share_info: {
    //         share_url:
    //           "https://www.iesdouyin.com/share/mix/detail/7528287669684537382/?schema_type=24&object_id=7528287669684537382&from_ssr=1",
    //         share_weibo_desc:
    //           "8.99 02/17 BtR:/ N@J.vs 我正在看【行车“疯”景】长按复制此条消息，打开抖音搜索，一起看合集~",
    //         share_desc:
    //           "1.56 02/06 l@p.dn goq:/ 我正在看【行车“疯”景】长按复制此条消息，打开抖音搜索，一起看合集~",
    //         share_title: "这么有趣的合集，不能只有我一个人知道吧",
    //         share_title_myself: "",
    //         share_title_other: "",
    //         share_desc_info:
    //           "8.99 02/17 BtR:/ N@J.vs 我正在看【行车“疯”景】长按复制此条消息，打开抖音搜索，一起看合集~",
    //       },
    //       mix_type: 0,
    //       create_time: 1752816063,
    //       update_time: 1753667012,
    //       ids: null,
    //       watched_item: "",
    //       is_serial_mix: 0,
    //       mix_pic_type: 0,
    //       enable_ad: 0,
    //       is_iaa: 0,
    //       paid_episodes: null,
    //     },
    //     is_new_text_mode: 0,
    //     anchor_info: {
    //       type: 15,
    //       id: "aw7c4z4ej0o3efzd",
    //       icon: {
    //         uri: "aweme-jupiter/18c4cde71e518e1c319cfadb5e140ed7.png",
    //         url_list: [
    //           "https://p3-pc-sign.douyinpic.com/obj/aweme-jupiter/18c4cde71e518e1c319cfadb5e140ed7.png?lk3s=138a59ce&x-expires=1755568800&x-signature=fd1uL9qB8%2BMHUjWLMNyD6hLP9OE%3D&from=327834062",
    //           "https://p9-pc-sign.douyinpic.com/obj/aweme-jupiter/18c4cde71e518e1c319cfadb5e140ed7.png?lk3s=138a59ce&x-expires=1755568800&x-signature=jC8zl%2BJSKLAPa%2FEU1PgivPgnOEs%3D&from=327834062",
    //         ],
    //         width: 720,
    //         height: 720,
    //         url_key:
    //           "https://p26-sign.douyinpic.com/obj/aweme-jupiter/18c4cde71e518e1c319cfadb5e140ed7.png?x-expires=1754618400&x-signature=uSKm%2BCyYx%2F0mYC4EYs62bIToExw%3D&from=2347263168",
    //       },
    //       title: "",
    //       title_tag: "剪映",
    //       content: "{}",
    //       style_info: {
    //         default_icon:
    //           "https://p26-sign.douyinpic.com/obj/aweme-jupiter/18c4cde71e518e1c319cfadb5e140ed7.png?x-expires=1754618400&x-signature=uSKm%2BCyYx%2F0mYC4EYs62bIToExw%3D&from=2347263168",
    //         scene_icon:
    //           '{"feed":"https://p26-sign.douyinpic.com/obj/aweme-jupiter/18c4cde71e518e1c319cfadb5e140ed7.png?x-expires=1754618400&x-signature=uSKm%2BCyYx%2F0mYC4EYs62bIToExw%3D&from=2347263168"}',
    //         extra: "{}",
    //       },
    //       extra:
    //         '{"base":{"client_key":"aw7c4z4ej0o3efzd","app_name":"剪映","app_icon":"https://p11-sign.douyinpic.com/obj/douyin-open-platform/b22313de3911b1169d1064198d589bc1?lk3s=4ced739e\\u0026x-expires=1769911200\\u0026x-signature=9634KGPZLgFHwLhQUSokHGud7FI%3D\\u0026from=1290630046"},"anchor":{"name":"百万智能运镜师","icon":"https://p26-sign.douyinpic.com/obj/douyin-web-image/b54d7ae38b1ea033b610bf53cf53ae76?lk3s=9e7df69c\\u0026x-expires=1754380800\\u0026x-signature=%2BW0WbFiLS6GgMd9Isvm4fXfRBA8%3D\\u0026from=2659055260","url":"https://lv.ulikecam.com/act/lv-feed?app_id=6383\\u0026aweme_item_id=7490079748131933459\\u0026capabilities=smart_motion%2Cauto_lyrics\\u0026hide_nav_bar=1\\u0026lv_log_extra=%7B%22anchor_type%22%3A%22edit_function%22%7D\\u0026new_style_id=\\u0026new_template_id=\\u0026should_full_screen=true\\u0026template_music_id=\\u0026type=2","new_url":"https://api.amemv.com/magic/eco/runtime/release/6461f944e84c15036369f2a8?appType=douyinpc\\u0026background_color=linear-gradient%28179.98deg%2C%20%23AC2BFC%200.01%25%2C%20rgba%28172%2C%2043%2C%20252%2C%200.35%29%2044%25%2C%20rgba%28172%2C%2043%2C%20252%2C%200%29%2099.99%25%29\\u0026bundle=landing%2Ftemplate.js\\u0026call_link=vega%3A%2F%2Fcom.ies.videocut%2Fmain%2Fdraft%2Fnew_draft%3Ffrom%3Ddouyin_anchor_middle_page\\u0026channel=anchor_landing_lynx\\u0026lv_log_extra=%7B%22anchor_type%22%3A%22edit_function%22%7D\\u0026magic_page_no=1\\u0026material_type=1\\u0026server_jump_lv_params=%7B%22ug_open_third_app_cert_id%22%3A%221023913986%22%7D\\u0026type=2","icon_uri":"aweme-jupiter/18c4cde71e518e1c319cfadb5e140ed7.png","title_tag":"剪映","is_template":false,"log_extra":"{\\"anchor_type\\":\\"edit_function\\",\\"is_sdk\\":\\"0\\",\\"image_anchor_type\\":\\"edit_function\\",\\"image_anchor_extra\\":\\"{\\\\\\"anchor_type\\\\\\":\\\\\\"edit_function\\\\\\",\\\\\\"anchor_key\\\\\\":\\\\\\"smart_motion\\\\\\",\\\\\\"anchor_name\\\\\\":\\\\\\"capcut_app\\\\\\"}\\",\\"new_anchor_type\\":\\"edit_function\\",\\"anchor_key\\":\\"smart_motion\\"}"},"share":{"share_id":"1828632602567787","style_id":"1768408419167271"}}',
    //       log_extra:
    //         '{"anchor_type":"edit_function","is_sdk":"0","image_anchor_type":"edit_function","image_anchor_extra":"{\\"anchor_type\\":\\"edit_function\\",\\"anchor_key\\":\\"smart_motion\\",\\"anchor_name\\":\\"capcut_app\\"}","new_anchor_type":"edit_function","anchor_key":"smart_motion"}',
    //     },
    //     trends_infos: null,
    //     component_control: {
    //       data_source_url: "/aweme/v1/web/aweme/post/",
    //     },
    //     anchors: null,
    //     hybrid_label: null,
    //     geofencing_regions: null,
    //     is_moment_story: 0,
    //     video_share_edit_status: 0,
    //     is_story: 0,
    //     aweme_type_tags: "",
    //     mark_largely_following: false,
    //     select_anchor_expanded_content: 0,
    //     cover_labels: null,
    //     entertainment_video_paid_way: {
    //       paid_ways: [],
    //       paid_type: 0,
    //       enable_use_new_ent_data: false,
    //     },
    //     chapter_bar_color: null,
    //     guide_btn_type: 0,
    //     shoot_way: "direct_shoot",
    //     is_24_story: 0,
    //     images: null,
    //     relation_labels: null,
    //     horizontal_type: 1,
    //     trends_event_track: "{}",
    //     impression_data: {
    //       group_id_list_a: [],
    //       group_id_list_b: [],
    //       similar_id_list_a: [7490079748131933000],
    //       similar_id_list_b: [7490079748131933000],
    //       group_id_list_c: [],
    //       group_id_list_d: [],
    //     },
    //     origin_duet_resource_uri: "",
    //     xigua_base_info: {
    //       status: 0,
    //       star_altar_order_id: 0,
    //       star_altar_type: 0,
    //       item_id: 0,
    //     },
    //     libfinsert_task_id: "",
    //     social_tag_list: null,
    //     suggest_words: {
    //       suggest_words: [
    //         {
    //           words: [
    //             {
    //               word: "粉红色的回忆dj",
    //               word_id: "6595796168104482056",
    //               info: '{"End":0,"Start":0,"ecpm_boost_tag":false,"log_pb":"","qrec_for_search":"{\\"search_result_scores\\":\\"{\\\\\\"search_result_click\\\\\\":-10000.0,\\\\\\"search_video_play\\\\\\":-10000.0,\\\\\\"search_duration_time\\\\\\":-10000.0,\\\\\\"search_change_query\\\\\\":-10000.0}\\"}"}',
    //             },
    //           ],
    //           scene: "detail_inbox_rex",
    //           icon_url: "",
    //           hint_text: "",
    //           extra_info: '{"resp_from":"hit_cache"}',
    //         },
    //         {
    //           words: [
    //             {
    //               word: "粉红色的回忆dj",
    //               word_id: "6595796168104482056",
    //               info: '{"End":0,"Start":0,"ecpm_boost_tag":false,"log_pb":"","qrec_for_search":"{\\"search_result_scores\\":\\"{\\\\\\"search_result_click\\\\\\":-10000.0,\\\\\\"search_video_play\\\\\\":-10000.0,\\\\\\"search_duration_time\\\\\\":-10000.0,\\\\\\"search_change_query\\\\\\":-10000.0}\\"}"}',
    //             },
    //             {
    //               word: "藤椒很辣",
    //               word_id: "6821528318165128451",
    //               info: '{"End":0,"Start":0,"ecpm_boost_tag":false,"log_pb":"","qrec_for_search":"{\\"search_result_scores\\":\\"{\\\\\\"search_result_click\\\\\\":-10000.0,\\\\\\"search_video_play\\\\\\":-10000.0,\\\\\\"search_duration_time\\\\\\":-10000.0,\\\\\\"search_change_query\\\\\\":-10000.0}\\"}"}',
    //             },
    //             {
    //               word: "老白说女dj",
    //               word_id: "7096369349930554659",
    //               info: '{"End":0,"Start":0,"ecpm_boost_tag":false,"log_pb":"","qrec_for_search":"{\\"search_result_scores\\":\\"{\\\\\\"search_result_click\\\\\\":-10000.0,\\\\\\"search_video_play\\\\\\":-10000.0,\\\\\\"search_duration_time\\\\\\":-10000.0,\\\\\\"search_change_query\\\\\\":-10000.0}\\"}"}',
    //             },
    //             {
    //               word: "车载dj",
    //               word_id: "6527569771423077645",
    //               info: '{"End":0,"Start":0,"ecpm_boost_tag":false,"log_pb":"","qrec_for_search":"{\\"search_result_scores\\":\\"{\\\\\\"search_result_click\\\\\\":-10000.0,\\\\\\"search_video_play\\\\\\":-10000.0,\\\\\\"search_duration_time\\\\\\":-10000.0,\\\\\\"search_change_query\\\\\\":-10000.0}\\"}"}',
    //             },
    //           ],
    //           scene: "comment_top_rec",
    //           icon_url: "",
    //           hint_text: "大家都在搜：",
    //           extra_info: '{"resp_from":"hit_cache"}',
    //         },
    //       ],
    //     },
    //     show_follow_button: {},
    //     duet_aggregate_in_music_tab: false,
    //     is_duet_sing: false,
    //     comment_permission_info: {
    //       comment_permission_status: 0,
    //       can_comment: true,
    //       item_detail_entry: false,
    //       press_entry: false,
    //       toast_guide: false,
    //     },
    //     original_images: null,
    //     series_paid_info: {
    //       series_paid_status: 0,
    //       item_price: 0,
    //     },
    //     img_bitrate: null,
    //     comment_gid: 7490079748131933000,
    //     image_album_music_info: {
    //       begin_time: -1,
    //       end_time: -1,
    //       volume: -1,
    //     },
    //     video_tag: [
    //       {
    //         tag_id: 2023,
    //         tag_name: "音乐",
    //         level: 1,
    //       },
    //       {
    //         tag_id: 2023001,
    //         tag_name: "音乐演唱",
    //         level: 2,
    //       },
    //       {
    //         tag_id: 0,
    //         tag_name: "",
    //         level: 0,
    //       },
    //     ],
    //     is_collects_selected: 0,
    //     chapter_list: null,
    //     feed_comment_config: {
    //       input_config_text: "善语结善缘，恶言伤人心",
    //       author_audit_status: 0,
    //       common_flags:
    //         '{"hashtag":"[{\\"name\\":\\"给生活找点乐子自嗨模式开启\\",\\"id\\":1678168413628424},{\\"name\\":\\"志同道合的人才会喜欢同一片风景\\",\\"id\\":1767586781314062}]","item_author_nickname":"藤椒很麻呀²³⁵⁸ 🌶️","video_labels_v2_tag1":"舞蹈","video_labels_v2_tag2":"休闲舞蹈"}',
    //     },
    //     is_image_beat: false,
    //     dislike_dimension_list: null,
    //     standard_bar_info_list: null,
    //     photo_search_entrance: {
    //       ecom_type: 0,
    //     },
    //     danmaku_control: {
    //       enable_danmaku: true,
    //       post_privilege_level: 0,
    //       is_post_denied: false,
    //       post_denied_reason: "",
    //       skip_danmaku: false,
    //       danmaku_cnt: 20,
    //       activities: [
    //         {
    //           id: 1224,
    //           type: 1,
    //         },
    //       ],
    //       pass_through_params: "{}",
    //       smart_mode_decision: 0,
    //       first_danmaku_offset: 451,
    //       last_danmaku_offset: 29231,
    //     },
    //     is_life_item: false,
    //     image_list: null,
    //     component_info_v2: '{"desc_lines_limit":0,"hide_marquee":false}',
    //     item_warn_notification: {
    //       type: 0,
    //       show: false,
    //       content: "",
    //     },
    //     origin_text_extra: null,
    //     disable_relation_bar: 0,
    //     packed_clips: null,
    //     vtag_search: {
    //       vtag_enable: true,
    //       vtag_delay_ts: 41800,
    //     },
    //     author_mask_tag: 0,
    //     user_recommend_status: 1,
    //     collection_corner_mark: 0,
    //     is_share_post: false,
    //     image_comment: {},
    //     visual_search_info: {
    //       visual_search_longpress: 1,
    //       is_show_img_entrance: false,
    //       is_ecom_img: false,
    //       is_high_accuracy_ecom: false,
    //       is_high_recall_ecom: false,
    //     },
    //     tts_id_list: null,
    //     ref_tts_id_list: null,
    //     voice_modify_id_list: null,
    //     ref_voice_modify_id_list: null,
    //     authentication_token:
    //       "MS4wLjAAAAAAZ3SXHR-xq1ASeTPEUymlVI2tA7kcIVoaw4qdLg0oI5o8a6fSZefikZlDtjnOpkUnxYK64tgF0Q1_r1l3rQ7IYE-WL_-6ZPWwTm1RpMFKmbquis8eoyxas8H17Y7RmZhh4wbXEKqVJSQ_fiPL_EGGhTaOL82izU3SGy-I3TTUaZCfcUhYhG8ENdyMe3JK8c9Ombqdb99ks2dENdLtWy_HvIH6Tg8VmvDJH5fpuvZzPqlF-PIpbbuqUKfz-9jxCAxCIOCvKCOhLx7Kr6Vd0Klq7w",
    //     video_game_data_channel_config: {},
    //     dislike_dimension_list_v2: null,
    //     distribute_circle: {
    //       distribute_type: 0,
    //       campus_block_interaction: false,
    //       is_campus: false,
    //     },
    //     image_crop_ctrl: 0,
    //     yumme_recreason: null,
    //     slides_music_beats: null,
    //     jump_tab_info_list: null,
    //     media_type: 4,
    //     play_progress: {
    //       play_progress: 0,
    //       last_modified_time: 0,
    //     },
    //     reply_smart_emojis: null,
    //     activity_video_type: 0,
    //     boost_status: 0,
    //     create_scale_type: null,
    //     entertainment_product_info: {
    //       sub_title: null,
    //       market_info: {
    //         limit_free: {
    //           in_free: false,
    //         },
    //         marketing_tag: null,
    //       },
    //     },
    //   },
    // ];
    const res = await Promise.all(aweme_list.map(getObtainData));
    return { code: 0, data: res, msg: "解析成功" };
  },
};

const redbookApi = {
  // 获取小红书笔记信息
  getNoteInfo(data) {
    return api.post("/redbook/getNoteInfo", data);
  },

  // 获取小红书用户信息
  getProfileInfo(data) {
    return api.post("/redbook/getProfileInfo", data);
  },

  // 获取小红书用户笔记列表
  getNoteList(data) {
    return api.post("/redbook/getNoteList", data);
  },
};

// 通用请求方法 - 兼容现有代码
const request = async (url, data = {}) => {
  try {
    const res = await api.post(url, data);
    console.log("请求结果:", res);

    if (res.code === 0) {
      return res.data;
    } else {
      return {
        code: -1,
        msg: res.msg || "获取数据错误",
      };
    }
  } catch (error) {
    console.error("请求失败:", error);
    return {
      code: -1,
      msg: error.message || "网络请求失败",
    };
  }
};

// 导出
export default service;
export { api, douyinApi, redbookApi, request };
