// 业务错误码字典（与 README 7.4 节保持一致）
export enum BizCode {
  SUCCESS = 0,

  // 1000-1999 通用 / 鉴权
  UNAUTHORIZED = 1001,
  TOKEN_EXPIRED = 1002,
  FORBIDDEN = 1003,
  RATE_LIMITED = 1004,
  BAD_REQUEST = 1005,
  NOT_FOUND = 1006,

  // 2000-2999 用户
  USER_PHONE_REGISTERED = 2001,
  USER_NOT_FOUND = 2002,
  USER_DISABLED = 2003,
  USER_CANCELING = 2004,
  USER_INVALID_PASSWORD = 2005,

  // 3000-3999 介绍人
  REFERRER_CODE_INVALID = 3001,
  REFERRER_CODE_CONFLICT = 3002,
  REFERRER_SELF = 3003,

  // 4000-4999 资料
  PROFILE_PENDING = 4001,
  PROFILE_APPROVED = 4002,
  PROFILE_REJECTED = 4003,
  PROFILE_NOT_FOUND = 4004,

  // 5000-5999 牵线
  MATCH_SAME_USER = 5001,
  MATCH_REFERRER_CONFLICT = 5002,
  MATCH_NOT_FOUND = 5003,

  // 6000-6999 上传
  UPLOAD_FILE_TOO_LARGE = 6001,
  UPLOAD_FILE_TYPE_INVALID = 6002,
  UPLOAD_SIGN_FAILED = 6003,
  UPLOAD_FILE_NOT_FOUND = 6004,

  // 7000-7999 字典
  DICT_NOT_FOUND = 7001,
  DICT_IN_USE = 7002,

  // 9000-9999 系统
  INTERNAL_ERROR = 9001,
  DATABASE_ERROR = 9002,
  EXTERNAL_DEPENDENCY_ERROR = 9003,
}

export const BizCodeMessages: Record<number, string> = {
  0: 'ok',
  1001: '未登录',
  1002: 'token 已过期',
  1003: '权限不足',
  1004: '操作频繁，请稍后再试',
  1005: '请求参数有误',
  1006: '资源不存在',
  2001: '手机号已注册',
  2002: '用户不存在',
  2003: '账号已被禁用',
  2004: '账号注销中',
  2005: '手机号或密码错误',
  3001: '邀请码无效',
  3002: '邀请码生成冲突',
  3003: '不能将自己设为介绍人',
  4001: '资料待审核中，请勿重复提交',
  4002: '资料已通过审核',
  4003: '资料已驳回',
  4004: '资料不存在',
  5001: '双方不能是同一人',
  5002: '介绍人不能是任一方',
  5003: '牵线记录不存在',
  6001: '文件大小超过限制',
  6002: '文件类型不允许',
  6003: '上传签名生成失败',
  6004: '文件不存在',
  7001: '字典项不存在',
  7002: '字典项已被使用，无法删除',
  9001: '服务内部异常',
  9002: '数据库异常',
  9003: '外部依赖不可用',
};