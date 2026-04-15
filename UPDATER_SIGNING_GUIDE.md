# Tauri Updater 签名配置指南

## 📋 概述

本文档说明如何配置 Tauri Updater 的签名功能，确保应用更新的安全性和完整性。

---

## 🔑 第一步：生成签名密钥

### 1. 安装 Tauri CLI

```bash
cargo install tauri-cli --version "^2.0.0"
```

### 2. 生成密钥对

```bash
# 在工作区根目录执行
tauri signer generate -w .tauri/my-key.key
```

系统会提示你设置密码（可选但推荐）：
```
Enter a password for your key (leave empty for no password): 
Confirm password: 
```

### 3. 生成的文件

执行后会生成：
- `.tauri/my-key.key` - **私钥文件**（保密，不要提交到 Git）
- 终端输出公钥 - 需要复制到 `tauri.conf.json`

示例输出：
```
Public key: dW50cnVzdGVkIGNvbW1lbnQ6IHJzaWduIGVuY3J5cHRlZCBzZWNyZXQga2V5ClJXUlRZM...
```

---

## ⚙️ 第二步：配置项目

### 1. 更新 `src-tauri/tauri.conf.json`

在 `plugins` 部分添加 updater 配置：

```json
{
  "plugins": {
    "updater": {
      "pubkey": "dW50cnVzdGVkIGNvbW1lbnQ6IHJzaWduIGVuY3J5cHRlZCBzZWNyZXQga2V5ClJXUlRZM...",
      "endpoints": [
        "https://github.com/your-org/your-repo/releases/latest/download/latest.json"
      ],
      "dialog": true,
      "windows": {
        "installMode": "passive"
      }
    }
  }
}
```

**重要字段说明：**
- `pubkey`: 从上面生成的公钥
- `endpoints`: 更新元数据文件的 URL
- `dialog`: 是否显示更新对话框
- `installMode`: Windows 安装模式（passive = 静默安装）

### 2. 确保 `.tauri/my-key.key` 在 `.gitignore` 中

```gitignore
# .gitignore
.tauri/*.key
```

---

## 🔐 第三步：配置 GitHub Secrets

进入 GitHub 仓库 → Settings → Secrets and variables → Actions → New repository secret

添加以下两个密钥：

### 1. `TAURI_SIGNING_PRIVATE_KEY`

**值**：`.tauri/my-key.key` 文件的**完整内容**

获取方法：
```bash
cat .tauri/my-key.key
```

复制全部内容（包括换行符），粘贴到 GitHub Secret 的值字段。

### 2. `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`

**值**：生成密钥时设置的密码

如果生成时没有设置密码，可以留空或不添加此密钥。

---

## 🚀 第四步：工作流自动签名

配置完成后，GitHub Actions 工作流会自动：

1. 读取 `TAURI_SIGNING_PRIVATE_KEY` 私钥
2. 使用私钥对构建的应用包进行签名
3. 生成 `.sig` 签名文件
4. 将签名文件和应用包一起上传到 GitHub Release

### 生成的文件示例

对于 macOS：
- `app_1.0.0_aarch64.dmg` - 应用包
- `app_1.0.0_aarch64.dmg.sig` - 签名文件

对于 Windows：
- `app_1.0.0_x64-setup.exe` - 安装包
- `app_1.0.0_x64-setup.exe.sig` - 签名文件

对于 Linux：
- `app_1.0.0_amd64.deb` - Debian 包
- `app_1.0.0_amd64.deb.sig` - 签名文件

---

## 📦 第五步：创建更新元数据文件

Tauri Updater 需要一个 `latest.json` 文件来检查更新。

### 手动创建示例

```json
{
  "version": "1.0.0",
  "notes": "修复了一些 bug，提升了性能",
  "pub_date": "2024-01-15T10:00:00Z",
  "platforms": {
    "darwin-aarch64": {
      "signature": "dW50cnVzdGVkIGNvbW1lbnQ6IHJzaWdu...",
      "url": "https://github.com/your-org/your-repo/releases/download/app-v1.0.0/app_1.0.0_aarch64.dmg"
    },
    "darwin-x86_64": {
      "signature": "dW50cnVzdGVkIGNvbW1lbnQ6IHJzaWdu...",
      "url": "https://github.com/your-org/your-repo/releases/download/app-v1.0.0/app_1.0.0_x64.dmg"
    },
    "linux-x86_64": {
      "signature": "dW50cnVzdGVkIGNvbW1lbnQ6IHJzaWdu...",
      "url": "https://github.com/your-org/your-repo/releases/download/app-v1.0.0/app_1.0.0_amd64.deb"
    },
    "windows-x86_64": {
      "signature": "dW50cnVzdGVkIGNvbW1lbnQ6IHJzaWdu...",
      "url": "https://github.com/your-org/your-repo/releases/download/app-v1.0.0/app_1.0.0_x64-setup.exe"
    }
  }
}
```

### 自动生成（推荐）

可以使用 `tauri-action` 的 `updaterJsonPreferNsis` 等选项自动生成，或者编写脚本在发布后生成。

---

## ✅ 验证配置

### 1. 本地测试签名

```bash
# 构建并签名
tauri build -- --target universal-apple-darwin

# 检查是否生成了 .sig 文件
ls src-tauri/target/universal-apple-darwin/release/bundle/dmg/
# 应该看到：
# app_1.0.0_universal.dmg
# app_1.0.0_universal.dmg.sig
```

### 2. 验证签名

```bash
# 使用公钥验证签名
tauri signer verify -k .tauri/my-key.key -p <public_key> -s app_1.0.0_universal.dmg.sig app_1.0.0_universal.dmg
```

---

## 🔧 常见问题

### Q1: 忘记私钥密码怎么办？

**A**: 无法恢复，需要重新生成密钥对：
```bash
tauri signer generate -w .tauri/my-new-key.key
```
然后更新 `tauri.conf.json` 中的 `pubkey` 和 GitHub Secrets。

### Q2: 签名验证失败？

**A**: 检查以下几点：
1. `tauri.conf.json` 中的 `pubkey` 是否与私钥匹配
2. GitHub Secret 中的私钥内容是否完整（包括换行符）
3. 私钥密码是否正确

### Q3: 是否需要为每个平台生成不同的密钥？

**A**: 不需要，一套密钥可以用于所有平台。

### Q4: 可以轮换密钥吗？

**A**: 可以，但需要注意：
1. 生成新密钥对
2. 更新 `tauri.conf.json` 中的 `pubkey`
3. 更新 GitHub Secrets
4. **旧版本应用无法验证新签名的更新**，需要用户手动下载新版本

---

## 📚 相关资源

- [Tauri Updater 官方文档](https://tauri.app/zh-cn/plugin/updater/)
- [Tauri Signer 文档](https://tauri.app/zh-cn/reference/cli/signer/)
- [GitHub Actions 最佳实践](https://docs.github.com/en/actions/security-guides/encrypted-secrets)

---

## 🎯 下一步

配置完成后：

1. 提交代码到 `release` 分支或打标签
2. GitHub Actions 会自动构建并签名
3. 检查 Release 页面确认 `.sig` 文件已上传
4. 在应用中测试更新功能

```typescript
// 在你的 Vue 组件中检查更新
import { checkUpdate, installUpdate } from '@tauri-apps/plugin-updater'

async function checkForUpdates() {
  const update = await checkUpdate()
  if (update) {
    console.log('发现新版本:', update.version)
    await installUpdate()
  }
}
```
