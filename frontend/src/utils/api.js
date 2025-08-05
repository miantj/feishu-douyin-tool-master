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
