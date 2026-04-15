import { defineConfig } from "vite-plus";
import vue from "@vitejs/plugin-vue";
import { resolve } from "path";
import vueDevTools from "vite-plugin-vue-devtools";
import Components from "unplugin-vue-components/vite";
import AutoImport from "unplugin-auto-import/vite";
import tailwindcss from "@tailwindcss/vite";

const host = process.env.TAURI_DEV_HOST;

// https://vite.dev/config/
export default defineConfig(async () => ({
  plugins: [
    vue(),
    tailwindcss(),
    // 自动导入Vue相关函数
    AutoImport({
      dts: "src/types/import/auto-imports.d.ts",
      imports: ["vue", "vue-router", "vue-i18n", "pinia"],
      resolvers: [],
      eslintrc: {
        enabled: true,
        filepath: "./.auto-import.json",
        globalsPropValue: true,
      },
      include: [/\.[tj]sx?$/, /\.vue$/, /\.vue\?vue/, /\.md$/],
    }),
    // 自动按需导入组件
    Components({
      dts: "src/types/import/components.d.ts",
      resolvers: [],
    }),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
      "@views": resolve(__dirname, "src/views"),
      "@imgs": resolve(__dirname, "src/assets/images"),
      "@icons": resolve(__dirname, "src/assets/icons"),
      "@styles": resolve(__dirname, "src/assets/styles"),
      "@utils": resolve(__dirname, "src/utils"),
      "@stores": resolve(__dirname, "src/store/modules"),
    },
  },
  // 专为Tauri开发定制的Vite选项，仅在`tauri dev`或`tauri build`时生效
  //
  // 1. 防止Vite隐藏Rust错误
  clearScreen: false,
  // 2. Tauri期望固定端口，如果端口不可用则失败
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. 告诉Vite忽略监听src-tauri目录
      ignored: ["**/src-tauri/**"],
    },
  },
  // 生产构建配置
  build: {
    target: ["es2021", "chrome100", "safari13"],
    minify: !process.env.TAURI_DEBUG ? ("esbuild" as const) : false,
    sourcemap: !!process.env.TAURI_DEBUG,
    chunkSizeWarningLimit: 1000,
    rolldownOptions: {
      output: {
        codeSplitting: {
          minSize: 20000,
          groups: [
            {
              name: "vue-vendor",
              test: /node_modules[\\/]vue/,
              priority: 20,
            },
            {
              name: "radix-vendor",
              test: /node_modules[\\/]radix-vue/,
              priority: 15,
            },
            {
              name: "vendor",
              test: /node_modules/,
              priority: 10,
            },
            {
              name: "common",
              minShareCount: 2,
              minSize: 10000,
              priority: 5,
            },
          ],
        },
      },
    },
  },
}));
