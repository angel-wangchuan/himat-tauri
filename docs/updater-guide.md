# Tauri Updater 静态 JSON 文件模式配置指南

## 概述

本项目使用 Tauri updater 插件的**静态 JSON 文件模式**来实现应用自动更新。

## 工作原理

1. 应用在启动或用户点击"检查更新"时，会请求配置的端点 URL（`latest.json`）
2. `latest.json` 文件包含最新版本信息和各平台的下载链接
3. 如果有新版本，Tauri 会自动下载并验证签名
4. 验证通过后，用户可以安装更新并重启应用

## 密钥配置

### 1. 私钥文件

项目已包含签名私钥：`.certificate/himat.key`

**重要**：不要将此文件提交到公共仓库！

### 2. 环境变量配置

复制 `.env.example` 为 `.env`：

```bash
cp .env.example .env
```

`.env` 文件内容：

```bash
# 更新签名私钥（从 .certificate/himat.key 文件内容复制）
TAURI_SIGNING_PRIVATE_KEY=your_private_key_here

# 私钥密码（如果生成密钥时设置了密码，必须配置此项）
TAURI_SIGNING_PRIVATE_KEY_PASSWORD=your_password_here
```

**注意**：如果生成密钥时设置了密码，必须配置 `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` 环境变量，否则构建会失败。

### 3. 公钥

公钥已配置在 `src-tauri/tauri.conf.json` 中：

```json
{
  "plugins": {
    "updater": {
      "pubkey": "dW50cnVzdGVk..."
    }
  }
}
```

## 打包命令

项目提供了灵活的构建脚本，支持不同平台的打包。

### 基本用法

```bash
# 查看帮助
node scripts/build.mjs --help

# 构建当前平台
pnpm build:app

# 构建指定平台
pnpm build:app:macos        # macOS (Intel)
pnpm build:app:macos-arm    # macOS (Apple Silicon)
pnpm build:app:windows      # Windows x64
pnpm build:app:linux        # Linux x64

# 调试构建
pnpm build:app:debug
```

### 使用构建脚本（推荐）

```bash
# 构建当前平台
node scripts/build.mjs

# 构建指定平台（使用简化名称）
node scripts/build.mjs -t macos           # macOS Intel
node scripts/build.mjs -t macos-aarch64   # macOS Apple Silicon
node scripts/build.mjs -t windows         # Windows
node scripts/build.mjs -t linux           # Linux

# 指定打包格式
node scripts/build.mjs -t macos -b dmg,app
node scripts/build.mjs -t windows -b msi,nsis
node scripts/build.mjs -t linux -b appimage,deb

# 调试构建
node scripts/build.mjs -d

# 详细输出
node scripts/build.mjs -v
```

### 平台与 Target 映射

| 简化名称       | Rust Target Triple          | 平台            |
| -------------- | --------------------------- | --------------- |
| `macos`        | `x86_64-apple-darwin`       | macOS Intel     |
| `macos-aarch64`| `aarch64-apple-darwin`      | macOS Apple M   |
| `windows`      | `x86_64-pc-windows-msvc`    | Windows x64     |
| `linux`        | `x86_64-unknown-linux-gnu`  | Linux x64       |

### Bundle 格式

| 平台    | 可用格式                |
| ------- | ---------------------- |
| macOS   | `dmg`, `app`           |
| Windows | `msi`, `nsis`          |
| Linux   | `appimage`, `deb`, `rpm`|

### 手动签名

如果需要对已有文件进行签名：

```bash
pnpm updater:sign -- <file-to-sign>
```

## 服务端配置

### 1. latest.json 文件格式

在你的更新服务器上创建 `latest.json` 文件，格式如下：

```json
{
  "version": "0.1.1",
  "notes": "修复了一些问题，优化了用户体验",
  "pub_date": "2026-04-15T10:00:00.000Z",
  "platforms": {
    "darwin-aarch64": {
      "signature": "YOUR_SIGNATURE_HERE",
      "url": "https://himat.wiat.ac.cns/darwin/aarch64/0.1.1/App.tar.gz"
    },
    "darwin-x86_64": {
      "signature": "YOUR_SIGNATURE_HERE",
      "url": "https://himat.wiat.ac.cns/darwin/x86_64/0.1.1/App.tar.gz"
    },
    "windows-x86_64": {
      "signature": "YOUR_SIGNATURE_HERE",
      "url": "https://himat.wiat.ac.cns/windows/x86_64/0.1.1/App.msi"
    },
    "linux-x86_64": {
      "signature": "YOUR_SIGNATURE_HERE",
      "url": "https://himat.wiat.ac.cns/linux/x86_64/0.1.1/App.AppImage"
    }
  }
}
```

### 2. 字段说明

| 字段        | 类型   | 说明                     |
| ----------- | ------ | ------------------------ |
| `version`   | string | 版本号，必须大于当前版本 |
| `notes`     | string | 更新说明                 |
| `pub_date`  | string | 发布日期，RFC 3339 格式  |
| `platforms` | object | 各平台的更新信息         |

### 3. 平台标识符

| 平台    | 架构          | 标识符           |
| ------- | ------------- | ---------------- |
| macOS   | Apple Silicon | `darwin-aarch64` |
| macOS   | Intel         | `darwin-x86_64`  |
| Windows | x64           | `windows-x86_64` |
| Linux   | x64           | `linux-x86_64`   |

### 4. 获取签名

构建应用后，签名文件会生成在 `src-tauri/target/release/bundle/` 目录中：

- macOS: `.tar.gz.sig` 文件
- Windows: `.msi.sig` 文件
- Linux: `.AppImage.sig` 文件

## 客户端配置

### tauri.conf.json

```json
{
  "plugins": {
    "updater": {
      "pubkey": "你的公钥",
      "endpoints": ["https://your-server.com/latest.json"]
    }
  }
}
```

## 完整发布流程

### 1. 构建应用

```bash
# 安装依赖
pnpm install

# 构建当前平台（推荐）
pnpm build:app

# 或构建指定平台
pnpm build:app:macos      # macOS
pnpm build:app:windows    # Windows
pnpm build:app:linux      # Linux

# 或一次性构建所有平台
pnpm build:app:all
```

### 2. 查找生成的文件

构建完成后，文件位于：

```
src-tauri/target/release/bundle/
├── macos/
│   └── himat.app.tar.gz
│   └── himat.app.tar.gz.sig    # <-- 需要这个签名
├── msi/
│   └── himat_0.1.0_x64.msi
│   └── himat_0.1.0_x64.msi.sig # <-- 需要这个签名
└── appimage/
    └── himat_0.1.0_amd64.AppImage
    └── himat_0.1.0_amd64.AppImage.sig # <-- 需要这个签名
```

### 3. 上传更新包

将以下文件上传到你的更新服务器：

- 应用包（`.tar.gz`, `.msi`, `.AppImage`）
- 签名文件（`.sig`）

### 4. 更新 latest.json

```json
{
  "version": "0.1.1",
  "notes": "本次更新内容...",
  "pub_date": "2026-04-15T10:00:00.000Z",
  "platforms": {
    "darwin-aarch64": {
      "signature": "从 .sig 文件复制内容",
      "url": "https://himat.wiat.ac.cns/darwin/aarch64/0.1.1/himat.app.tar.gz"
    }
  }
}
```

### 5. 部署 latest.json

将 `latest.json` 部署到配置的端点 URL。

## CI/CD 自动构建（推荐）

项目提供了 GitHub Actions 工作流，可以自动构建所有平台并生成 `latest.json` 文件。

### 配置 GitHub Secrets

在 GitHub 仓库的 Settings > Secrets and variables > Actions 中添加以下密钥：

| Secret | 说明 | 获取方式 |
|--------|------|----------|
| `TAURI_SIGNING_PRIVATE_KEY` | 签名私钥 | `.tauri/himat.key` 文件内容 |
| `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | 私钥密码（如果有） | 生成密钥时设置的密码 |
| `GITHUB_TOKEN` | GitHub Token | 自动生成，无需配置 |

### 使用方式

#### 方式 1：通过 Git Tag 触发

```bash
# 打标签并发布
git tag v0.1.1
git push origin v0.1.1
```

这将自动触发构建所有平台并生成 `latest.json`。

#### 方式 2：手动触发

1. 进入 GitHub Actions 页面
2. 选择 "Build and Generate latest.json" 工作流
3. 点击 "Run workflow"
4. 填写版本号和更新说明
5. 运行

### 工作流程

1. **构建阶段**：在 macOS、Windows、Linux 上分别构建应用
2. **收集产物**：下载所有平台的构建产物和签名文件
3. **生成 latest.json**：自动创建包含所有平台信息的 JSON 文件
4. **部署**：将 `latest.json` 上传到你的 CDN

### 自定义 CDN 部署

编辑 `.github/workflows/build-and-generate.yml`，取消注释并配置你的 CDN：

```yaml
- name: Deploy to CDN
  uses: aws-actions/configure-aws-credentials@v4
  with:
    aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
    aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
    aws-region: ${{ secrets.AWS_REGION }}
  run: |
    aws s3 cp latest.json s3://your-bucket/latest.json
```

## 示例

参考 `docs/latest.json.example` 文件查看完整示例。

## 注意事项

1. **版本号**：必须使用语义化版本（如 0.1.1），且必须大于当前版本
2. **签名验证**：确保 `latest.json` 中的签名与上传的更新包匹配
3. **HTTPS**：更新服务器必须使用 HTTPS
4. **CORS**：确保服务器允许跨域请求
5. **私钥安全**：
   - 不要将 `.env` 文件提交到版本控制
   - 不要将 `.certificate/*.key` 私钥文件提交到公共仓库
   - 只分发公钥
6. **构建环境**：确保构建时设置了 `TAURI_SIGNING_PRIVATE_KEY` 环境变量

## 常见问题

### Q: 如何生成新的密钥对？

```bash
tauri signer generate -w .certificate/himat.key
```

生成时如果设置了密码，需要记住密码并在 `.env` 中配置 `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`。

### Q: 如何查看公钥？

```bash
tauri signer info -k .certificate/himat.key
```

### Q: 构建时提示缺少私钥？

确保已设置环境变量：

```bash
export TAURI_SIGNING_PRIVATE_KEY=$(cat .certificate/himat.key)
pnpm tauri build
```

或使用 npm scripts：

```bash
pnpm tauri:build
```

### Q: 构建时提示私钥密码错误？

如果生成密钥时设置了密码，必须在 `.env` 中配置：

```bash
TAURI_SIGNING_PRIVATE_KEY_PASSWORD=your_password_here
```

然后重新运行构建命令。

### Q: 如何修改私钥密码？

需要重新生成密钥对：

```bash
# 备份旧密钥
mv .certificate/himat.key .certificate/himat.key.backup

# 生成新密钥（会提示输入新密码）
tauri signer generate -w .certificate/himat.key

# 更新 .env 文件中的私钥和密码
# 更新 tauri.conf.json 中的公钥
```

**注意**：更换密钥后，之前发布的更新包将无法验证，需要重新发布所有版本。
