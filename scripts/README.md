# 多语言同步脚本

## 功能

自动同步多语言文件的字段结构，以简体中文 (zh-CN) 为基准：

- **新增字段**：当在 zh-CN.ts 中添加新字段时，自动在 zh-TW.ts 和 en-US.ts 中添加对应结构，使用占位符填充
- **删除字段**：当从 zh-CN.ts 中删除字段时，自动从 zh-TW.ts 和 en-US.ts 中删除
- **保留翻译**：已存在的字段会保留原有的翻译内容

## 使用方法

### 1. 在简体中文文件中添加/删除字段

编辑 `src/i18n/locales/zh-CN.ts`：

```typescript
// 添加新字段
export default {
  // ... 其他字段
  myNewFeature: {
    title: "新功能标题",
    description: "新功能描述",
  },
};
```

### 2. 运行同步脚本

```bash
pnpm sync-i18n
```

### 3. 翻译占位符

脚本运行后，搜索占位符并替换为实际翻译：

- 繁体中文：搜索 `[待翻译]`
- 英文：搜索 `[TODO: Translate]`

## 示例

### 添加新字段

**zh-CN.ts** (你添加的):

```typescript
ai: {
  generate: "AI 生成",
  optimize: "智能优化",
}
```

**运行脚本后 zh-TW.ts**:

```typescript
ai: {
  generate: "[待翻译]",
  optimize: "[待翻译]",
}
```

**运行脚本后 en-US.ts**:

```typescript
ai: {
  generate: "[TODO: Translate]",
  optimize: "[TODO: Translate]",
}
```

### 删除字段

从 zh-CN.ts 中删除某个字段后，运行脚本会自动从其他语言文件中删除对应字段。

## 注意事项

1. **始终以 zh-CN.ts 为基准**：所有字段变更都应先在 zh-CN.ts 中进行
2. **及时翻译**：运行脚本后尽快完成占位符的翻译工作
3. **验证结果**：运行 `vp check` 确保文件格式正确
