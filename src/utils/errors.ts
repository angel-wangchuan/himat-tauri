/**
 * 自定义错误类
 *
 * 提供结构化的错误处理，保留原始错误信息和上下文
 */

/**
 * API 请求错误
 *
 * @example
 * ```ts
 * try {
 *   await api.getData();
 * } catch (error) {
 *   if (error instanceof ApiError) {
 *     if (error.statusCode === 401) {
 *       // 处理未授权
 *     }
 *   }
 * }
 * ```
 */
export class ApiError extends Error {
  /**
   * HTTP 状态码
   */
  public readonly statusCode?: number;

  /**
   * 业务错误码
   */
  public readonly code?: string | number;

  /**
   * 原始错误对象
   */
  public readonly originalError?: any;

  /**
   * 额外的错误数据
   */
  public readonly data?: any;

  constructor(
    message: string,
    options?: {
      statusCode?: number;
      code?: string | number;
      originalError?: any;
      data?: any;
    },
  ) {
    super(message);
    this.name = "ApiError";
    this.statusCode = options?.statusCode;
    this.code = options?.code;
    this.originalError = options?.originalError;
    this.data = options?.data;

    // 保持正确的原型链
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  /**
   * 判断是否为认证错误
   */
  isUnauthorized(): boolean {
    return this.statusCode === 401;
  }

  /**
   * 判断是否为权限不足错误
   */
  isForbidden(): boolean {
    return this.statusCode === 403;
  }

  /**
   * 判断是否为资源不存在错误
   */
  isNotFound(): boolean {
    return this.statusCode === 404;
  }

  /**
   * 判断是否为服务器错误
   */
  isServerError(): boolean {
    return this.statusCode !== undefined && this.statusCode >= 500;
  }

  /**
   * 判断是否为网络错误
   */
  isNetworkError(): boolean {
    return this.statusCode === undefined || this.statusCode === 0;
  }
}

/**
 * 验证错误
 */
export class ValidationError extends Error {
  public readonly field?: string;
  public readonly value?: any;

  constructor(message: string, field?: string, value?: any) {
    super(message);
    this.name = "ValidationError";
    this.field = field;
    this.value = value;
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * 配置错误
 */
export class ConfigError extends Error {
  public readonly key?: string;

  constructor(message: string, key?: string) {
    super(message);
    this.name = "ConfigError";
    this.key = key;
    Object.setPrototypeOf(this, ConfigError.prototype);
  }
}

/**
 * 类型守卫：判断是否为 ApiError
 */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/**
 * 类型守卫：判断是否为 ValidationError
 */
export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}

/**
 * 获取用户友好的错误消息
 *
 * @param error - 错误对象
 * @returns 适合展示给用户的错误消息
 */
export function getUserFriendlyMessage(error: unknown): string {
  if (isApiError(error)) {
    if (error.isUnauthorized()) {
      return "登录已过期，请重新登录";
    }
    if (error.isForbidden()) {
      return "权限不足，无法执行此操作";
    }
    if (error.isNotFound()) {
      return "请求的资源不存在";
    }
    if (error.isNetworkError()) {
      return "网络连接失败，请检查网络设置";
    }
    if (error.isServerError()) {
      return "服务器错误，请稍后重试";
    }
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "发生未知错误";
}
