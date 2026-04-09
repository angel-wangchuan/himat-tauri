import { createApp } from "vue";
import "@styles/index.css";

import App from "./App.vue";
import { initStore } from "./store";
import { initRouter } from "./router";
import { i18n } from "./i18n";
import "@utils/ui/iconify-loader";

const app = createApp(App);
initStore(app);
initRouter(app);

app.use(i18n);

app.mount("#app");
