import { createApp } from "vue";
import "@styles/index.css";

import App from "./App.vue";
import { initStore } from "./store";
import { initRouter } from "./router";
import { i18n, syncNativeMenus } from "./i18n";
import { applyStoredThemeSettings } from "./utils/theme";
import "@utils/ui/iconify-loader";

applyStoredThemeSettings();

const app = createApp(App);
initStore(app);
initRouter(app);

app.use(i18n);

app.mount("#app");

void syncNativeMenus().catch((error) => {
  console.error("[i18n] Failed to sync native menus", error);
});
