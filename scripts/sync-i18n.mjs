/**
 * 多语言文件同步脚本
 *
 * 功能：
 * 1. 以简体中文 (zh-CN) 为基准
 * 2. 自动同步字段结构到繁体中文 (zh-TW) 和英文 (en-US)
 * 3. 新增字段使用 [TODO:原值] 格式填充，保留原值方便后续翻译
 * 4. 删除 zh-CN 中不存在的字段
 *
 * 使用方法：
 *   node scripts/sync-i18n.mjs
 */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ==================== 配置 ====================

const LOCALES_DIR = resolve(__dirname, "../src/i18n/locales");
const SOURCE_FILE = resolve(LOCALES_DIR, "zh-CN.ts");
const TARGET_FILES = [
  { path: resolve(LOCALES_DIR, "zh-TW.ts"), lang: "繁体中文", prefix: "[TODO:", suffix: "]" },
  { path: resolve(LOCALES_DIR, "en-US.ts"), lang: "英文", prefix: "[TODO:", suffix: "]" },
];

// ==================== 工具函数 ====================

/**
 * 读取 TypeScript 文件并提取对象
 */
function parseLocaleFile(filePath) {
  const content = readFileSync(filePath, "utf-8");
  const match = content.match(/export\s+default\s+(\{[\s\S]*\})\s*;?\s*$/);
  if (!match) {
    throw new Error(`无法解析文件: ${filePath}`);
  }
  try {
    const parseFn = new Function(`return ${match[1]}`);
    return parseFn();
  } catch (error) {
    throw new Error(`解析文件失败 ${filePath}: ${error.message}`);
  }
}

/**
 * 将对象格式化为 TypeScript 代码
 */
function formatObject(obj, indent = 0) {
  const spaces = "  ".repeat(indent);
  const innerSpaces = "  ".repeat(indent + 1);
  const entries = Object.entries(obj);

  if (entries.length === 0) {
    return "{}";
  }

  const lines = entries.map(([key, value]) => {
    const formattedKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : `"${key}"`;

    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      return `${innerSpaces}${formattedKey}: ${formatObject(value, indent + 1)}`;
    }

    const escapedValue = String(value)
      .replace(/\\/g, "\\\\")
      .replace(/"/g, '\\"')
      .replace(/\n/g, "\\n");
    return `${innerSpaces}${formattedKey}: "${escapedValue}"`;
  });

  return `{\n${lines.join(",\n")}\n${spaces}}`;
}

/**
 * 生成完整的文件内容
 */
function generateFileContent(obj) {
  return `export default ${formatObject(obj)};\n`;
}

/**
 * 创建占位符字符串
 * @param {string} originalValue - 原始中文值
 * @param {string} prefix - 占位符前缀
 * @param {string} suffix - 占位符后缀
 * @returns {string} 格式化后的占位符
 */
function createPlaceholder(originalValue, prefix, suffix) {
  return `${prefix}${originalValue}${suffix}`;
}

/**
 * 同步两个对象的结构
 * @param {Object} source - 源对象 (zh-CN)
 * @param {Object} target - 目标对象 (zh-TW 或 en-US)
 * @param {string} placeholderPrefix - 占位符前缀
 * @param {string} placeholderSuffix - 占位符后缀
 * @param {string} path - 当前路径（用于日志）
 * @returns {Object} 同步后的对象
 */
function syncStructure(source, target, placeholderPrefix, placeholderSuffix, path = "") {
  const result = {};
  let hasChanges = false;

  for (const key of Object.keys(source)) {
    const currentPath = path ? `${path}.${key}` : key;
    const sourceValue = source[key];
    const targetValue = target[key];

    if (typeof sourceValue === "object" && sourceValue !== null && !Array.isArray(sourceValue)) {
      // source 是对象
      if (typeof targetValue === "object" && targetValue !== null && !Array.isArray(targetValue)) {
        // target 也是对象，递归同步
        result[key] = syncStructure(
          sourceValue,
          targetValue,
          placeholderPrefix,
          placeholderSuffix,
          currentPath,
        );
      } else {
        // target 不是对象或不存在，用占位符创建新结构
        result[key] = createPlaceholderStructure(sourceValue, placeholderPrefix, placeholderSuffix);
        console.log(`  ✨ 新增结构: ${currentPath}`);
        hasChanges = true;
      }
    } else {
      // source 是基本类型（字符串）
      if (typeof targetValue === "object" && targetValue !== null && !Array.isArray(targetValue)) {
        // target 是对象但 source 不是，替换为占位符
        result[key] = createPlaceholder(String(sourceValue), placeholderPrefix, placeholderSuffix);
        console.log(`  🔄 类型变更: ${currentPath} (对象 → 字符串)`);
        hasChanges = true;
      } else if (targetValue !== undefined) {
        // target 存在且类型兼容，保留原值
        result[key] = targetValue;
      } else {
        // target 不存在，添加带原值的占位符
        result[key] = createPlaceholder(String(sourceValue), placeholderPrefix, placeholderSuffix);
        console.log(`  ✨ 新增字段: ${currentPath} = "${sourceValue}"`);
        hasChanges = true;
      }
    }
  }

  // 删除 target 中有但 source 中没有的键
  for (const key of Object.keys(target)) {
    if (!(key in source)) {
      const currentPath = path ? `${path}.${key}` : key;
      console.log(`  🗑️  删除字段: ${currentPath}`);
      hasChanges = true;
    }
  }

  if (!hasChanges && path === "") {
    console.log("  ✅ 无需更改，结构已同步");
  }

  return result;
}

/**
 * 根据源对象结构创建占位符对象（递归）
 * @param {Object} source - 源对象
 * @param {string} prefix - 占位符前缀
 * @param {string} suffix - 占位符后缀
 * @returns {Object} 占位符对象
 */
function createPlaceholderStructure(source, prefix, suffix) {
  const result = {};

  for (const [key, value] of Object.entries(source)) {
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      result[key] = createPlaceholderStructure(value, prefix, suffix);
    } else {
      result[key] = createPlaceholder(String(value), prefix, suffix);
    }
  }

  return result;
}

// ==================== 主函数 ====================

function main() {
  console.log("🌍 开始同步多语言文件...\n");
  console.log(`📄 基准文件: zh-CN.ts`);
  console.log(`📁 目录: ${LOCALES_DIR}\n`);

  // 读取源文件
  console.log("📖 读取基准文件...");
  const sourceData = parseLocaleFile(SOURCE_FILE);
  console.log(`✅ 已加载 ${Object.keys(sourceData).length} 个顶层字段\n`);

  // 同步每个目标文件
  for (const { path: targetPath, lang, prefix, suffix } of TARGET_FILES) {
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`🌐 同步到: ${lang} (${targetPath.split("/").pop()})`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    let targetData = {};

    // 尝试读取现有文件
    try {
      targetData = parseLocaleFile(targetPath);
      console.log(`📖 已加载现有文件\n`);
    } catch (error) {
      console.log(`⚠️  无法读取现有文件，将创建新文件\n`, error.message);
    }

    // 同步结构
    const syncedData = syncStructure(sourceData, targetData, prefix, suffix);

    // 生成新内容
    const newContent = generateFileContent(syncedData);

    // 写入文件
    writeFileSync(targetPath, newContent, "utf-8");
    console.log(`\n✅ 文件已更新\n`);
  }

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🎉 多语言文件同步完成！");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("\n💡 提示:");
  console.log("   - 翻译: 搜索 '[TODO:' 来查找需要翻译的内容");
  console.log("   - 占位符格式: [TODO:原值]");
}

// 运行主函数
main();
