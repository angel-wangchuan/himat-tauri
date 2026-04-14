/**
 * 应用常量配置
 *
 * 集中管理所有魔法数字和硬编码值，便于维护和修改
 */

// ==================== 服务器配置 ====================

/**
 * 默认服务器地址列表
 */
export const DEFAULT_SERVERS = [
  "http://localhost:3670",
  "https://client.himat.wiat.ac.cn",
  "https://himat.scqcyz.cn",
] as const;

/**
 * 本地开发服务器地址
 */
export const LOCAL_SERVER_URL = "http://localhost:3670";

// ==================== 时间配置 ====================

/**
 * 数据同步间隔（秒）- 默认 10 分钟
 */
export const SYNC_INTERVAL_SECONDS = 600;

/**
 * Token 刷新阈值（秒）- 剩余 5 分钟时刷新
 */
export const TOKEN_REFRESH_THRESHOLD_SECONDS = 300;

/**
 * 请求超时时间（毫秒）
 */
export const REQUEST_TIMEOUT_MS = 30000;

/**
 * 搜索防抖延迟（毫秒）
 */
export const SEARCH_DEBOUNCE_MS = 300;

// ==================== 重试配置 ====================

/**
 * 最大重试次数
 */
export const MAX_RETRY_COUNT = 3;

/**
 * 重试间隔（毫秒）
 */
export const RETRY_DELAY_MS = 1000;

// ==================== 存储键名 ====================

/**
 * 系统设置存储键
 */
export const SETTINGS_STORAGE_KEY = "sys-v-settings";

/**
 * VueUse 颜色模式存储键
 */
export const VUEUSE_COLOR_MODE_KEY = "vueuse-color-scheme";

/**
 * 语言设置存储键
 */
export const LOCALE_STORAGE_KEY = "app-locale";

/**
 * 颜色主题存储键
 */
export const COLOR_THEME_STORAGE_KEY = "color-theme";

// ==================== 主题配置 ====================

/**
 * 主题颜色属性名
 */
export const COLOR_ATTRIBUTE = "data-color";

/**
 * 深色模式媒体查询
 */
export const DARK_MEDIA_QUERY = "(prefers-color-scheme: dark)";

/**
 * 动画持续时间（毫秒）
 */
export const THEME_TRANSITION_DURATION = 420;

/**
 * 动画缓动函数
 */
export const THEME_TRANSITION_EASING = "ease-in-out";

// ==================== Webview 配置 ====================

/**
 * Browser Tab 键名前缀
 */
export const BROWSER_TAB_KEY_PREFIX = "browser:";

/**
 * Webview 标签名前缀
 */
export const WEBVIEW_LABEL_PREFIX = "browser-webview-";

// ==================== 路由配置 ====================

/**
 * 登录路由名称
 */
export const LOGIN_ROUTE_NAME = "Login";

/**
 * 首页路由名称
 */
export const HOME_ROUTE_NAME = "Home";

/**
 * 浏览器路由名称
 */
export const BROWSER_ROUTE_NAME = "Browser";

/**
 * 设置路由名称
 */
export const SETTINGS_ROUTE_NAME = "Settings";

/**
 * OAuth 认证路径
 */
export const OAUTH_PATH = "/auth/casdoor?client=desktop";

// ==================== 代理配置 ====================

/**
 * 代理服务最大重试次数
 */
export const PROXY_MAX_RETRY_COUNT = 20;

/**
 * 代理服务重试间隔（毫秒）
 */
export const PROXY_RETRY_DELAY_MS = 250;

/**
 * 代理服务启动超时时间（毫秒）
 */
export const PROXY_TIMEOUT_MS = 6000;

// ==================== 小程序配置 ====================

/**
 * 小程序 ID 前缀
 */
export const MINIAPP_ID_PREFIX = "miniapp-";
