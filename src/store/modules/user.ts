import { defineStore } from "pinia";
import { ref } from "vue";

export interface User {
  id: number;
  username: string;
  email?: string;
  [key: string]: any;
}

export interface AuthState {
  serverList: string[];
  isLogin: boolean;
  user?: User;
  accessToken?: string;
  refreshToken?: string;
  serverUrl?: string;
  syncInterval: number;
  lastLoginMethod?: "oauth" | "password";
}

export const useUserStore = defineStore(
  "user",
  () => {
    const isLogin = ref<boolean>(false);
    const user = ref<User | undefined>(undefined);
    const accessToken = ref<string | undefined>(undefined);
    const refreshToken = ref<string | undefined>(undefined);
    const serverList = ref<string[]>([
      "http://localhost:3670",
      "https://client.himat.wiat.ac.cn",
      "https://himat.scqcyz.cn",
    ]);
    const serverUrl = ref<string | undefined>(undefined);
    const syncInterval = ref<number>(60 * 10);
    const lastLoginMethod = ref<"oauth" | "password">("oauth");

    function setIsLogin(value: boolean) {
      isLogin.value = value;
    }

    function setUser(value: User | undefined) {
      user.value = value;
    }

    function setAccessToken(value: string | undefined) {
      accessToken.value = value;
    }

    function setRefreshToken(value: string | undefined) {
      refreshToken.value = value;
    }

    function setServerList(value: string[]) {
      serverList.value = value;
    }

    function setServerUrl(value: string | undefined) {
      serverUrl.value = value;
    }

    function setSyncInterval(value: number) {
      syncInterval.value = value;
    }

    function setLastLoginMethod(value: "oauth" | "password") {
      lastLoginMethod.value = value;
    }

    async function login() {
      console.log("Login with server:", serverUrl.value);
    }

    async function logout() {
      console.log("Logout with server:", serverUrl.value);
      reset();
    }

    function reset() {
      isLogin.value = false;
      user.value = undefined;
      accessToken.value = undefined;
      refreshToken.value = undefined;
      serverUrl.value = undefined;
      syncInterval.value = 60 * 10;
      lastLoginMethod.value = "oauth";
    }

    return {
      isLogin,
      user,
      accessToken,
      refreshToken,
      serverList,
      serverUrl,
      syncInterval,
      lastLoginMethod,
      setIsLogin,
      setUser,
      setAccessToken,
      setRefreshToken,
      setServerList,
      setServerUrl,
      setSyncInterval,
      setLastLoginMethod,
      login,
      logout,
      reset,
    };
  },
  {
    persist: true,
  },
);
