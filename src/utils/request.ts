import { Configuration, DefaultApi } from "@himat/api-sdk";
import axios from "axios";
import { toast } from "vue-sonner";

import { useUserStore } from "@stores/user";

const configuration = new Configuration({
  basePath: "",
  accessToken: () => useUserStore().accessToken || "",
});

const axiosInstance = axios.create();

function syncRequestConfig(config?: any) {
  const { serverUrl, accessToken } = useUserStore();
  configuration.basePath = serverUrl;
  configuration.accessToken = accessToken || "";
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

export function setRequestBaseURL(baseURL?: string) {
  const normalizedBaseURL = baseURL?.trim() || undefined;
  configuration.basePath = normalizedBaseURL;
}

axiosInstance.interceptors.request.use(
  (config) => {
    syncRequestConfig(config);
    return config;
  },
  (error) => Promise.reject(error),
);

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const userStore = useUserStore();
    const message = error?.response?.data?.message || error?.message || "Request failed";

    toast.error(message);

    if (error?.response?.status === 401) {
      await userStore.logout();
    }

    return Promise.reject(new Error(message));
  },
);

syncRequestConfig();

const api = new DefaultApi(configuration, undefined, axiosInstance as any);

export default api;
