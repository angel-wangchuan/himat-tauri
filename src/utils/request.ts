import { Configuration, DefaultApi } from "@himat/api-sdk";
import axios from "axios";
import { toast } from "vue-sonner";

import { useUserStore } from "@stores/user";

const configuration = new Configuration({
  accessToken: () => useUserStore().accessToken || "",
});

const axiosInstance = axios.create();

function syncRequestConfig() {
  const userStore = useUserStore();
  configuration.basePath = userStore.serverUrl;
  configuration.accessToken = userStore.accessToken || "";
}

export function setRequestBaseURL(baseURL?: string) {
  const normalizedBaseURL = baseURL?.trim() || undefined;
  configuration.basePath = normalizedBaseURL;
}

axiosInstance.interceptors.request.use(
  (config) => {
    syncRequestConfig();
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
