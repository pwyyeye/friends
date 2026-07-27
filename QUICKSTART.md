# 快速启动指南

> 5 分钟把项目跑起来。本文档是实操版，详细设计见 [README.md](./README.md)。

## 0. 环境准备

| 工具           | 版本  | 说明                     |
| -------------- | ----- | ------------------------ |
| Node.js        | ≥ 18 | 后端 / 前端构建          |
| npm            | ≥ 9  | 包管理（已自带 Node.js） |
| Docker Desktop | 最新  | 跑 MySQL + Redis         |

> 没有 pnpm 也可以，全程用 `npm` 即可，命令已经统一。

## 1. 启动 MySQL + Redis

```bash
cd d:/code/friends
docker compose up -d mysql redis
```

等待 ~10 秒，等 MySQL 完成首次初始化。

## 2. 启动后端

```bash
cd backend
cp .env.example .env       # 默认配置即可（含本地 MySQL/Redis/OSS mock）
npm install                # 已安装可跳过
npx prisma migrate dev --name init   # 建表
npm run prisma:seed        # 灌入字典 + 管理员 + 测试用户 + 牵线示例
npm run start:dev          # 启动，监听 :3000
```

启动后访问：

- 接口文档：http://localhost:3000/api/v1/docs
- 健康检查（需 admin 登录后访问）：http://localhost:3000/api/v1/admin/health

## 3. 启动管理端

```bash
cd admin
npm install                # 已安装可跳过
npm run dev                # 启动，监听 :5174
```

访问 http://localhost:5174 ，使用以下账号登录：

| 账号      | 密码         | 角色       |
| --------- | ------------ | ---------- |
| admin     | Admin@123    | 超级管理员 |
| operator1 | Operator@123 | 运营       |

## 4. 启动用户端 H5

```bash
cd frontend
npm install                # 已安装可跳过
npm run dev                # 启动，监听 :5173
```

访问 http://localhost:5173 ，测试账号：

| 手机号                    | 密码     | 角色                                  |
| ------------------------- | -------- | ------------------------------------- |
| 13800000001 ~ 13800000006 | Pass1234 | 被介绍人                              |
| 13900000001 ~ 13900000003 | Pass1234 | 介绍人（邀请码 100001/100002/100003） |

## 5. 体验关键流程

```
1. 用介绍人手机号登录 → 看到自己的 6 位邀请码
2. 退出，用新手机号 + 上面任一邀请码注册
3. 进入「资料」tab → 填写完整资料 → 提交审核
4. 切到管理端 → 「资料审核」→ 通过 / 驳回
5. 回到用户端 → 看到状态变为「已通过 / 已驳回 + 原因」
6. 管理端 → 「牵线记录」→「新增」→ 录入一对成功案例
7. 看板自动更新
```

## 6. 关于 OSS

后端 `.env` 默认 `OSS_PROVIDER=aliyun`，但本地不配置 `OSS_ACCESS_KEY/SECRET` 时，签名接口会返回错误。

**两种方式二选一：**

- **A. 临时跑通**（推荐本地）：编辑 `backend/.env` 把 `OSS_PROVIDER=aliyun` 改为 `OSS_PROVIDER=mock`。上传走 `backend/uploads/` 本地存储。
- **B. 真实 OSS**：填入阿里云 AccessKey / Secret / Bucket 即可。

头像字段（`avatarOssKey`）保存的是 key，**mock 模式下 URL 通过 `/api/v1/upload/mock-put` 端点访问**。

## 7. 启动排错

| 现象                                          | 排查                                                          |
| --------------------------------------------- | ------------------------------------------------------------- |
| 后端启动报`Can't reach database`            | `docker compose ps` 看 mysql 状态；等健康检查通过           |
| Prisma migrate 失败                           | 检查`backend/.env` 的 `DATABASE_URL` 是否正确             |
| 前端访问接口 404                              | 看 vite proxy 配置，`/api` 转发到 `localhost:3000`        |
| 用户端登录后跳不到资料页                      | 看浏览器控制台、vite 终端的 HMR 报错                          |
| 管理端列表加载不到数据                        | 看后端日志是否有 401/403，确认已登录                          |
| 资料提交后状态没变                            | 后端事务日志；JWT 是否过期；查看`user_profiles_pending` 表  |
| `docker compose up` 报 docker daemon 连不上 | 启动 Docker Desktop，等右下角图标变绿再重试                   |
| `MySQL` 容器起来但 `prisma migrate` 卡住  | 看`docker logs friends-mysql`，等 `ready for connections` |

## 8. 常用命令

```bash
# 后端
cd backend
npm run start:dev          # 开发（热重启）
npm run build              # 编译 dist
npm run prisma:studio      # 可视化数据库
npm run prisma:seed        # 重新灌示例数据

# 管理端
cd admin
npm run dev                # 开发
npm run build              # 编译 dist
npm run type-check         # 仅类型检查

# 用户端
cd frontend
npm run dev                # 开发
npm run build              # 编译 dist
```

## 9. 完整流程验证（端到端冒烟测试）

启动三端后，按以下顺序操作应当全部成功：

```
□ 浏览器打开 http://localhost:5174
  □ 用 admin / Admin@123 登录管理端
  □ 「看板」应显示总用户 9 人（3 介绍人 + 6 被介绍人）、牵线 2 条
  □ 「用户管理」→ 列表显示 9 条记录，手机号均为 138**** 或 139****
  □ 「介绍人管理」→ 列表显示 3 人，邀请人数各 2
  □ 「资料审核」→ 列表显示 2 条 pending
  □ 点开一条 → 「通过审核」→ 列表少一条，看板总用户不变
  □ 「牵线记录」→ 列表显示 2 条
  □ 「操作日志」→ 看到刚才的「资料审核通过」记录

□ 浏览器打开 http://localhost:5173
  □ 用 13800000001 / Pass1234 登录用户端
  □ 「我的」tab 看到昵称「小明」+ 介绍人是「王大姐 (100001)」
  □ 「邀请」tab 看到自己的邀请码 200001 + 邀请人数 0
  □ 「资料」tab 应显示已通过的完整资料
  □ 退出，用 13800000003 / Pass1234 登录（profileStatus=1）
  □ 「资料」tab 顶部黄色 banner「资料审核中」，表单为只读
  □ 退出，用 13800000005 / Pass1234 登录（profileStatus=3）
  □ 「资料」tab 顶部红色 banner 显示驳回原因，可修改后重新提交

□ 注册流程
  □ 退出登录
  □ 访问 /#/register
  □ 填入邀请码 100001、新手机号 13800000999、密码 Pass1234、昵称
  □ 提交 → 自动登录 → 看到资料采集页（空）
  □ 填写完整资料 → 提交
  □ 切到管理端 → 资料审核看到新一条
```
