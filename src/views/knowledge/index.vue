<template>
  <div class="proxy-panel">
    <h2>代理设置</h2>

    <div class="status">本地代理: {{ localProxyAddr || "启动中..." }}</div>
    <div class="status">当前代理: {{ currentProxy || "直连" }}</div>

    <div class="controls">
      <input
        v-model="proxyInput"
        placeholder="例: socks5://127.0.0.1:1080 或 http://127.0.0.1:7890"
      />
      <button @click="applyProxy">设置代理</button>
      <button @click="removeProxy" class="danger">清除代理</button>
    </div>

    <!-- 使用代理加载的 webview -->
    <div class="webview-container w-d100vh h-100">
      <iframe
        v-if="localProxyAddr"
        :src="'https://www.reaxys.com/#/search/quick/query'"
        class="w-full h-full"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { setProxy, clearProxy, getProxy, waitForProxyServer } from "@utils/proxy";

const localProxyAddr = ref("");
const currentProxy = ref<string | null>(null);
const proxyInput = ref("");

onMounted(async () => {
  // 等待本地代理就绪
  localProxyAddr.value = await waitForProxyServer();
  currentProxy.value = await getProxy();
});

async function applyProxy() {
  if (!proxyInput.value.trim()) {
    // 输入为空 → 清除代理
    await removeProxy();
    return;
  }
  const result = await setProxy(proxyInput.value.trim());
  currentProxy.value = proxyInput.value.trim();
  console.log(result);
}

async function removeProxy() {
  const result = await clearProxy();
  currentProxy.value = null;
  proxyInput.value = "";
  console.log(result);
}
</script>
