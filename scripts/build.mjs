#!/usr/bin/env node

/**
 * Tauri 构建脚本
 * 支持跨平台构建和参数传递
 *
 * 用法:
 *   node scripts/build.mjs                    # 构建当前平台
 *   node scripts/build.mjs -t macos           # 构建 macOS
 *   node scripts/build.mjs -t windows         # 构建 Windows
 *   node scripts/build.mjs -t linux           # 构建 Linux
 *   node scripts/build.mjs --debug            # 调试构建
 *   node scripts/build.mjs -b dmg,appimage    # 指定打包格式
 */

import { execSync } from "child_process";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, "..");

// 平台映射表：简化名称 -> Rust target triple
const TARGET_MAP = {
  // macOS
  macos: "x86_64-apple-darwin",
  "macos-intel": "x86_64-apple-darwin",
  "macos-aarch64": "aarch64-apple-darwin",
  "macos-arm": "aarch64-apple-darwin",
  darwin: "x86_64-apple-darwin",
  "darwin-x86_64": "x86_64-apple-darwin",
  "darwin-aarch64": "aarch64-apple-darwin",

  // Windows
  windows: "x86_64-pc-windows-msvc",
  win: "x86_64-pc-windows-msvc",
  "windows-x86_64": "x86_64-pc-windows-msvc",
  "win-x86_64": "x86_64-pc-windows-msvc",

  // Linux
  linux: "x86_64-unknown-linux-gnu",
  "linux-x86_64": "x86_64-unknown-linux-gnu",
};

// Bundle 类型映射
const BUNDLE_MAP = {
  dmg: "dmg",
  app: "app",
  msi: "msi",
  nsis: "nsis",
  appimage: "appimage",
  deb: "deb",
  rpm: "rpm",
  tar: "tar.gz",
};

// 解析命令行参数
const args = process.argv.slice(2);
const options = {
  target: null,
  debug: false,
  bundles: [],
  help: false,
  verbose: false,
};

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === "--help" || arg === "-h") {
    options.help = true;
  } else if (arg === "--debug" || arg === "-d") {
    options.debug = true;
  } else if (arg === "--verbose" || arg === "-v") {
    options.verbose = true;
  } else if (arg.startsWith("--target=")) {
    options.target = arg.split("=")[1];
  } else if ((arg === "--target" || arg === "-t") && args[i + 1]) {
    options.target = args[++i];
  } else if (arg.startsWith("--bundles=")) {
    options.bundles = arg.split("=")[1].split(",");
  } else if ((arg === "--bundles" || arg === "-b") && args[i + 1]) {
    options.bundles = args[++i].split(",");
  }
}

// 显示帮助信息
if (options.help) {
  console.log(`
Tauri 构建脚本

用法:
  node scripts/build.mjs [选项]

选项:
  -t, --target <platform>    指定目标平台
                             支持: macos, macos-aarch64, windows, linux
  -b, --bundles <types>      指定打包格式，逗号分隔
                             macOS: dmg, app
                             Windows: msi, nsis
                             Linux: appimage, deb, rpm
  -d, --debug                调试构建（不优化，包含调试符号）
  -v, --verbose              详细输出
  -h, --help                 显示此帮助信息

示例:
  # 构建当前平台
  node scripts/build.mjs

  # 构建 macOS (Intel)
  node scripts/build.mjs -t macos
  node scripts/build.mjs -t macos-intel

  # 构建 macOS (Apple Silicon)
  node scripts/build.mjs -t macos-aarch64

  # 构建 Windows
  node scripts/build.mjs -t windows

  # 构建 Linux
  node scripts/build.mjs -t linux

  # 构建 macOS 并生成 DMG
  node scripts/build.mjs -t macos -b dmg

  # 构建 Windows 并生成 MSI 和 NSIS
  node scripts/build.mjs -t windows -b msi,nsis

  # 调试构建
  node scripts/build.mjs -d

平台与 Target 映射:
  macos / darwin          -> x86_64-apple-darwin
  macos-aarch64           -> aarch64-apple-darwin
  windows / win           -> x86_64-pc-windows-msvc
  linux                   -> x86_64-unknown-linux-gnu
`);
  process.exit(0);
}

// 读取私钥
function getPrivateKey() {
  try {
    const keyPath = join(rootDir, ".certificate", "himat.key");
    return readFileSync(keyPath, "utf-8").trim();
  } catch {
    console.error("错误: 无法读取私钥文件 .certificate/himat.key");
    console.error("请确保密钥文件存在且可读");
    process.exit(1);
  }
}

// 获取密码（如果配置了）
function getPassword() {
  return process.env.TAURI_SIGNING_PRIVATE_KEY_PASSWORD || "";
}

// 解析 target
function resolveTarget(input) {
  if (!input) return null;
  // 如果是完整的 target triple，直接返回
  if (input.includes("-apple-") || input.includes("-pc-") || input.includes("-unknown-")) {
    return input;
  }
  // 否则查找映射
  const target = TARGET_MAP[input.toLowerCase()];
  if (!target) {
    console.error(`错误: 未知的平台 "${input}"`);
    console.error("支持的平台: " + Object.keys(TARGET_MAP).join(", "));
    process.exit(1);
  }
  return target;
}

// 构建命令
function build() {
  const privateKey = getPrivateKey();
  const password = getPassword();

  // 设置环境变量
  const env = {
    ...process.env,
    TAURI_SIGNING_PRIVATE_KEY: privateKey,
  };

  if (password) {
    env.TAURI_SIGNING_PRIVATE_KEY_PASSWORD = password;
  }

  // 解析 target
  const target = resolveTarget(options.target);

  // 构建命令
  let cmd = "pnpm exec tauri build";

  if (options.debug) {
    cmd += " --debug";
  }

  if (target) {
    cmd += ` --target ${target}`;
  }

  if (options.bundles.length > 0) {
    const bundleList = options.bundles.map((b) => BUNDLE_MAP[b] || b).join(",");
    cmd += ` --bundles ${bundleList}`;
  }

  if (options.verbose) {
    cmd += " --verbose";
  }

  console.log(`\n开始构建...`);
  console.log(`平台: ${target || "当前平台"}`);
  console.log(`模式: ${options.debug ? "调试" : "生产"}`);
  if (options.bundles.length > 0) {
    console.log(`打包格式: ${options.bundles.join(", ")}`);
  }
  console.log("");

  try {
    execSync(cmd, {
      stdio: "inherit",
      env,
      cwd: rootDir,
    });
    console.log("\n构建成功！");
  } catch {
    console.error("\n构建失败");
    process.exit(1);
  }
}

// 主逻辑
build();
