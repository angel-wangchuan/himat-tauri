/**
 * HTTP 请求封装
 *
 * 基于 @himat/api-sdk 和 axios 的统一请求层
 * - 自动注入认证 token
 * - 统一错误处理
 * - 401 自动登出
 */

import { Configuration, DefaultApi } from "@himat/api-sdk";
import axios, { type AxiosRequestConfig } from "axios";
import { toast } from "vue-sonner";

import { useUserStore } from "@stores/user";
import { ApiError, getUserFriendlyMessage } from "@/utils/errors";
import { REQUEST_TIMEOUT_MS } from "@/config/constants";

// ==================== Axios 实例配置 ====================

/**
 * 创建 axios 实例
 */
const axiosInstance = axios.create({
  timeout: REQUEST_TIMEOUT_MS,
  headers: {
    "Content-Type": "application/json",
  },
});

// ==================== 配置管理 ====================

/**
 * API 配置实例（延迟初始化，避免模块加载时访问 Store）
 */
let apiConfiguration: Configuration | null = null;

/**
 * 获取或创建 API 配置
 *
 * @returns API 配置实例
 */
function getConfiguration(): Configuration {
  if (!apiConfiguration) {
    const userStore = useUserStore();
    apiConfiguration = new Configuration({
      basePath: userStore.serverUrl || "",
      accessToken: () => userStore.accessToken || "",
    });
  }
  return apiConfiguration;
}

/**
 * 同步请求配置到 axios 和 API SDK
 *
 * @param config - Axios 请求配置（可选）
 */
function syncRequestConfig(config?: AxiosRequestConfig) {
  const userStore = useUserStore();
  const { serverUrl, accessToken } = userStore;

  // 更新 API SDK 配置
  const configuration = getConfiguration();
  configuration.basePath = serverUrl || "";
  configuration.accessToken = accessToken || "";

  // 更新 Axios 配置
  if (config) {
    config.baseURL = serverUrl;
    if (accessToken) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${accessToken}`,
      };
    }
  }
}

// ==================== 请求拦截器 ====================

/**
 * 请求拦截器：自动注入认证信息
 */
axiosInstance.interceptors.request.use(
  (config) => {
    syncRequestConfig(config);
    return config;
  },
  (error) => {
    // 记录请求错误
    console.error("[Request Error]", error);
    return Promise.reject(error);
  },
);

// ==================== 响应拦截器 ====================

/**
 * 响应拦截器：统一错误处理
 *
 * 错误处理策略：
 * - 401: 自动登出并跳转登录页
 * - 其他错误: 显示用户友好的错误提示
 */
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const userStore = useUserStore();

    // 提取错误信息
    const statusCode = error?.response?.status;
    const message = error?.response?.data?.message || error?.message || "请求失败";
    const code = error?.response?.data?.code;

    // 创建结构化错误对象
    const apiError = new ApiError(message, {
      statusCode,
      code,
      originalError: error,
      data: error?.response?.data,
    });

    // 401 未授权：自动登出（不显示 toast，避免重复提示）
    if (statusCode === 401) {
      await userStore.logout();
      return Promise.reject(apiError);
    }

    // 其他错误：显示用户友好的提示
    const userMessage = getUserFriendlyMessage(apiError);
    toast.error(userMessage);

    // 保留原始错误信息供上层处理
    return Promise.reject(apiError);
  },
);

// ==================== API 实例导出 ====================

/**
 * 初始化配置
 */
syncRequestConfig();

/**
 * API 实例
 *
 * @example
 * ```ts
 * import api from "@/utils/request";
 *
 * // 调用 API
 * const { data } = await api.minappFindAll();
 * ```
 */
const api = new DefaultApi(getConfiguration(), undefined, axiosInstance as any);

export default api;

// ==================== 工具函数导出 ====================

export { axiosInstance, getConfiguration, syncRequestConfig };

/**
 * 设置请求基础 URL
 *
 * @param baseURL - 基础 URL
 */
export function setRequestBaseURL(baseURL?: string) {
  const normalizedBaseURL = baseURL?.trim() || undefined;
  const configuration = getConfiguration();
  configuration.basePath = normalizedBaseURL || "";
}
