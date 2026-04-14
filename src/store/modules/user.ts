/**
 * 用户认证状态管理
 *
 * 负责：
 * - 用户登录/登出状态
 * - Token 管理（access token / refresh token）
 * - 服务器地址配置
 * - 数据同步间隔设置
 */

import { defineStore } from "pinia";
import { ref } from "vue";
import { router } from "@/router";
import { DEFAULT_SERVERS, SYNC_INTERVAL_SECONDS, LOGIN_ROUTE_NAME } from "@/config/constants";

// ==================== 类型定义 ====================

/**
 * 用户信息接口
 */
export interface User {
  /** 用户 ID */
  id: number;
  /** 用户名 */
  username: string;
  /** 邮箱地址 */
  email?: string;
  /** 头像 URL */
  avatar?: string;
  /** 昵称 */
  nickname?: string;
  /** 手机号 */
  phone?: string;
  /** 创建时间 */
  createdAt?: string;
  /** 更新时间 */
  updatedAt?: string;
  /** 用户角色列表 */
  roles?: string[];
  /** 用户权限列表 */
  permissions?: string[];
}

/**
 * 登录方式
 */
export type LoginMethod = "oauth" | "password";

/**
 * 认证状态接口
 */
export interface AuthState {
  /** 服务器地址列表 */
  serverList: string[];
  /** 是否已登录 */
  isLogin: boolean;
  /** 当前用户信息 */
  user?: User;
  /** 访问令牌 */
  accessToken?: string;
  /** 刷新令牌 */
  refreshToken?: string;
  /** 当前服务器地址 */
  serverUrl?: string;
  /** 数据同步间隔（秒） */
  syncInterval: number;
  /** 上次登录方式 */
  lastLoginMethod?: LoginMethod;
}

// ==================== Store 定义 ====================

export const useUserStore = defineStore(
  "user",
  () => {
    // ==================== 状态 ====================

    /** 是否已登录 */
    const isLogin = ref<boolean>(false);

    /** 当前用户信息 */
    const user = ref<User | undefined>(undefined);

    /** 访问令牌 */
    const accessToken = ref<string | undefined>(undefined);

    /** 刷新令牌 */
    const refreshToken = ref<string | undefined>(undefined);

    /** 服务器地址列表（从常量导入） */
    const serverList = ref<string[]>([...DEFAULT_SERVERS]);

    /** 当前使用的服务器地址 */
    const serverUrl = ref<string | undefined>(undefined);

    /** 数据同步间隔（秒），默认 10 分钟 */
    const syncInterval = ref<number>(SYNC_INTERVAL_SECONDS);

    /** 上次登录方式，默认 OAuth */
    const lastLoginMethod = ref<LoginMethod>("oauth");

    // ==================== Mutations ====================

    /**
     * 设置登录状态
     *
     * @param value - 是否已登录
     */
    function setIsLogin(value: boolean) {
      isLogin.value = value;
    }

    /**
     * 设置用户信息
     *
     * @param value - 用户信息对象
     */
    function setUser(value: User | undefined) {
      user.value = value;
    }

    /**
     * 设置访问令牌
     *
     * @param value - 访问令牌字符串
     */
    function setAccessToken(value: string | undefined) {
      accessToken.value = value;
    }

    /**
     * 设置刷新令牌
     *
     * @param value - 刷新令牌字符串
     */
    function setRefreshToken(value: string | undefined) {
      refreshToken.value = value;
    }

    /**
     * 从服务器列表中移除指定服务器
     *
     * @param value - 要移除的服务器地址
     */
    function removeServerList(value: string) {
      serverList.value = serverList.value.filter((v) => v !== value);
    }

    /**
     * 设置当前服务器地址
     * 如果地址不在列表中，自动添加到列表
     *
     * @param value - 服务器地址
     */
    function setServerUrl(value: string | undefined) {
      serverUrl.value = value;
      if (value && !serverList.value.includes(value)) {
        serverList.value.push(value);
      }
    }

    /**
     * 设置数据同步间隔
     *
     * @param value - 同步间隔（秒）
     */
    function setSyncInterval(value: number) {
      syncInterval.value = value;
    }

    /**
     * 设置上次登录方式
     *
     * @param value - 登录方式（oauth/password）
     */
    function setLastLoginMethod(value: LoginMethod) {
      lastLoginMethod.value = value;
    }

    // ==================== Actions ====================

    /**
     * 执行登录
     *
     * TODO: 实现完整的登录逻辑
     * - 调用登录 API
     * - 保存 token
     * - 获取用户信息
     * - 跳转到首页
     */
    async function login() {
      console.log("Login with server:", serverUrl.value);
      // TODO: 实现登录逻辑
    }

    /**
     * 执行登出
     *
     * - 清除所有认证状态
     * - 跳转到登录页
     */
    async function logout() {
      console.log("Logout with server:", serverUrl.value);
      reset();
    }

    /**
     * 重置所有认证状态
     *
     * 用于登出或会话过期时清理状态
     */
    function reset() {
      isLogin.value = false;
      user.value = undefined;
      accessToken.value = undefined;
      refreshToken.value = undefined;
      router.push({ name: LOGIN_ROUTE_NAME });
    }

    // ==================== 导出 ====================

    return {
      // 状态
      isLogin,
      user,
      accessToken,
      refreshToken,
      serverList,
      serverUrl,
      syncInterval,
      lastLoginMethod,

      // Mutations
      setIsLogin,
      setUser,
      setAccessToken,
      setRefreshToken,
      removeServerList,
      setServerUrl,
      setSyncInterval,
      setLastLoginMethod,

      // Actions
      login,
      logout,
      reset,
    };
  },
  {
    persist: true, // 启用持久化
  },
);
