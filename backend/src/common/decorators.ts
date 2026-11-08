import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
/** 标记接口为公开，跳过 JWT 鉴权 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export const ROLES_KEY = 'roles';
/** 限制接口只能被指定角色访问 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

export const CURRENT_USER_KEY = 'currentUser';
/** 用于在 Request 中读取当前用户 */
export interface JwtPayload {
  sub: string; // userId (string 化的 bigint) 或 adminId
  role: 'user' | 'super_admin' | 'operator';
  authVersion?: number;
  iat?: number;
  exp?: number;
  jti?: string;
}
