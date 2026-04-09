/**
 * Pinia Store 配置模块
 */
import type { App } from "vue";
import { createPinia } from "pinia";
import { createPersistedState } from "pinia-plugin-persistedstate";

export const store = createPinia();

// 配置持久化插件
store.use(
  createPersistedState({
    key: (storeId: string) => `sys-v-${storeId}`,
    storage: localStorage,
    serializer: {
      serialize: JSON.stringify,
      deserialize: JSON.parse,
    },
  }),
);

/**
 * 初始化 Store
 */
export function initStore(app: App<Element>): void {
  app.use(store);
}
