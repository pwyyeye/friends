按

# Friends · 牵线交友平台

> 以"介绍人牵线"为核心的轻量级交友平台。用户通过介绍人编码进入，平台采集画像信息，运营人员撮合并记录每一次成功牵线的关系链。

---

## 一、业务背景

传统婚恋平台重算法匹配，运营成本高、转化难。本项目采用**熟人/半熟人介绍 + 人工撮合**的轻模式：

- **介绍人必须先注册**，由系统生成唯一邀请码，保证关系链可溯源
- 被介绍人填写资料时填入介绍人编码，建立**三方关系（介绍人 / 用户A / 用户B）**
- 撮合成功后由运营在管理端录入牵线记录，沉淀运营资产

### 核心价值

| 维度   | 说明                                          |
| ------ | --------------------------------------------- |
| 可信度 | 熟人/半熟人介绍，降低双方信任成本             |
| 可溯源 | 每次成功牵线都能溯源到介绍人、时间、撮合人    |
| 可运营 | 介绍人邀请关系树 + 牵线转化统计，让运营有抓手 |

---

## 二、角色与业务流程

### 2.1 角色

| 角色                       | 说明                     | 主要动作                       |
| -------------------------- | ------------------------ | ------------------------------ |
| **用户（被介绍人）** | 通过邀请码进入的注册用户 | 填写资料、查看自己被介绍的关系 |
| **介绍人**           | 已注册的用户，可邀请他人 | 生成邀请码、查看自己的邀请成果 |
| **运营管理员**       | 后台账号                 | 审核资料、撮合、录入牵线记录   |

### 2.2 主流程

```
介绍人注册 → 获得 6 位邀请码 → 分享给被介绍人
    ↓
被介绍人填写邀请码注册（仅校验编码，不审核）
    ↓
登录后填写资料（基本信息 / 兴趣 / 需求）→ 提交
    ↓
资料进入 user_profiles_pending（待审核池）
    ↓
管理员审核 ──▶ 通过：合并入 users / user_interests / user_requirements
           └─▶ 驳回：填写原因，用户端可见，用户可修改再提交
    ↓
资料入库后 → 运营撮合 → 手工录入「牵线记录」→ 关系链沉淀
```

---

## 三、功能模块

### 3.1 用户端（H5 · Vue 3 + Vant）

- 注册 / 登录（含介绍人编码校验）
- 资料采集：基本信息、兴趣爱好（多选 + 自定义）、交友需求、头像
- 资料审核状态：未提交 / 待审核 / 已通过 / 已驳回（驳回可见原因）
- 我的资料：查看、编辑（编辑后重新进入待审核池）
- 我的介绍成果：我邀请过的人、我的邀请码

### 3.2 管理端（Web · Vue 3 + Element Plus）

- **用户管理**：列表（分页/筛选）、详情、编辑、禁用
- **介绍人管理**：介绍人列表、邀请关系树、邀请码生成/失效
- **资料审核**：待审核资料列表 / 详情 / 通过 / 驳回（带原因）
- **牵线记录**：新增（选双方 + 介绍人）、列表（按时间/介绍人筛选）、备注
- **操作日志**：审核 / 禁启用 / 录入牵线 等动作的审计记录
- **统计看板**：总用户、介绍人数、牵线成功率、近 7/30 天新增

### 3.3 后端（NestJS · REST API）

- 用户模块（注册、登录、资料 CRUD）
- 介绍人模块（邀请码生成、邀请关系查询、统计）
- 资料审核模块（提交 / 通过 / 驳回 / 事务合并）
- 牵线记录模块（新增、查询、统计）
- 上传模块（阿里 OSS 直传签名）
- 鉴权模块（用户 JWT、管理员 JWT、双角色权限隔离）
- 公共模块（统一响应、异常处理、日志、CORS）

---

## 四、技术栈

| 层     | 选型                                | 理由                     |
| ------ | ----------------------------------- | ------------------------ |
| 用户端 | Vue 3 + Vite + Vant 4 + Pinia       | 移动端 H5 首选，组件齐全 |
| 管理端 | Vue 3 + Vite + Element Plus + Pinia | 后台类项目标配           |
| 后端   | NestJS 10 + TypeScript + Prisma     | 模块化清晰、类型统一     |
| 数据库 | MySQL 8.0                           | 关系型为主，结构清晰     |
| 缓存   | Redis 7                             | 会话、计数器、邀请码缓存 |
| 部署   | Docker Compose                      | 初期单库单体，简化运维   |
| 文档   | OpenAPI（Swagger）                  | 接口自描述               |

> 全栈 TypeScript，前后端类型一致，便于协作。

---

## 五、目录结构

```
friends/
├── backend/              # NestJS 后端
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/         # 鉴权（用户/管理员双角色）
│   │   │   ├── user/         # 用户模块
│   │   │   ├── referrer/     # 介绍人模块
│   │   │   ├── match/        # 牵线记录模块
│   │   │   └── stats/        # 统计看板
│   │   ├── common/           # 公共（filters/decorators/utils）
│   │   ├── prisma/           # Prisma 客户端封装
│   │   └── main.ts
│   ├── prisma/
│   │   └── schema.prisma
│   ├── .env.example
│   └── package.json
│
├── frontend/             # 用户端 H5
│   ├── src/
│   │   ├── views/
│   │   │   ├── Register.vue
│   │   │   ├── Profile.vue
│   │   │   └── MyInvites.vue
│   │   ├── api/              # axios 封装 + 接口
│   │   ├── stores/           # Pinia
│   │   ├── router/
│   │   └── main.ts
│   └── package.json
│
├── admin/                # 管理端
│   ├── src/
│   │   ├── views/
│   │   │   ├── user/         # 用户管理
│   │   │   ├── referrer/     # 介绍人管理
│   │   │   ├── match/        # 牵线记录
│   │   │   └── dashboard/    # 看板
│   │   ├── api/
│   │   └── main.ts
│   └── package.json
│
├── docs/                 # 设计文档、API 文档、ER 图
├── docker-compose.yml    # MySQL + Redis 一键起
└── README.md             # 本文档
```

---

## 六、数据库设计（核心表）

### 6.1 ER 概览

```
users (用户表)
  ├─ N:1 ── cities (city_id)
  ├─ N:1 ── occupations (occupation_id)
  ├─ 1:N ── user_interests ── N:1 ── interest_tags
  ├─ 1:N ── user_custom_interests (用户自填的兴趣)
  ├─ 1:1 ── user_requirements (交友需求)
  ├─ 1:N ── user_profiles_pending (用户提交过的资料版本)
  ├─ N:1 ── users (referrer_id 自关联：我的介绍人)
  └─ 1:N ── match_records (我作为介绍人的牵线记录)

match_records (牵线记录)
  ├─ N:1 ── users (user_a_id：牵线人 A)
  ├─ N:1 ── users (user_b_id：被牵线人 B)
  └─ N:1 ── users (referrer_id：介绍人)

audit_logs (管理员操作日志)
  ├─ N:1 ── admins
  └─ 记录审核通过/驳回/禁启用/录入牵线/转让介绍人等动作

admins (管理员表，独立于 users)

字典表（独立维护）：
  cities          - 城市字典
  occupations     - 职业字典
  interest_tags   - 兴趣标签字典
```

### 6.2 关键字段

**users**

| 字段                   | 类型                         | 说明                                 |
| ---------------------- | ---------------------------- | ------------------------------------ |
| id                     | bigint PK                    |                                      |
| phone                  | varchar(20) unique           | 手机号即账号                         |
| nickname               | varchar(50)                  |                                      |
| gender                 | tinyint                      | 1男 2女                              |
| age                    | int                          |                                      |
| city_id                | bigint FK→cities.id         | 城市（字典）                         |
| height                 | int                          | 身高（cm）                           |
| occupation_id          | bigint FK→occupations.id    | 职业（字典）                         |
| occupation_custom      | varchar(100) nullable        | 字典无对应时自填，审核通过后入字典   |
| avatar_oss_key         | varchar(255)                 | 头像 OSS key（用户上传后回填）       |
| invite_code            | varchar(8) unique            | 自己作为介绍人的邀请码（6 位数字）   |
| referrer_id            | bigint nullable FK→users.id | 我的介绍人（1:1 不可改，超管可转让） |
| profile_status         | tinyint                      | 0 未提交 1 待审核 2 已通过 3 已驳回  |
| status                 | tinyint                      | 1启用 0禁用                          |
| cancel_status          | tinyint                      | 0 正常 1 注销中 2 已注销             |
| cancel_at              | datetime nullable            | 注销冷静期开始时间                   |
| created_at, updated_at | datetime                     |                                      |

**user_interests**

| 字段            | 类型                        | 说明     |
| --------------- | --------------------------- | -------- |
| id              | bigint PK                   |          |
| user_id         | bigint FK→users            |          |
| interest_tag_id | bigint FK→interest_tags.id | 关联字典 |

`UNIQUE(user_id, interest_tag_id)` 防止重复。

**user_custom_interests**（用户自填的兴趣）

| 字段       | 类型             | 说明                      |
| ---------- | ---------------- | ------------------------- |
| id         | bigint PK        |                           |
| user_id    | bigint FK→users |                           |
| tag_text   | varchar(50)      | 用户自定义的兴趣词        |
| promoted   | tinyint          | 0 未提升 1 已提升为字典项 |
| created_at | datetime         |                           |

> 用户在资料采集时，如果兴趣字典里没有合适选项，可手动输入。审核通过后，超管可把高频自定义词批量「提升」到 `interest_tags` 字典里。

**user_requirements**

| 字段           | 类型                          | 说明             |
| -------------- | ----------------------------- | ---------------- |
| user_id        | bigint PK FK→users           | 1:1              |
| target_gender  | tinyint                       | 1男 2女 0不限    |
| target_age_min | int                           |                  |
| target_age_max | int                           |                  |
| target_city_id | bigint FK→cities.id nullable | 期望城市（字典） |
| self_desc      | text                          | 自我介绍         |

### 6.3 字典表

**cities**（城市字典）

| 字段     | 类型               | 说明                      |
| -------- | ------------------ | ------------------------- |
| id       | bigint PK          |                           |
| name     | varchar(50) unique | 城市名，如「杭州」        |
| pinyin   | varchar(50)        | 用于排序/检索             |
| province | varchar(50)        | 所属省份                  |
| level    | tinyint            | 1一线 2新一线 3二线 4其他 |
| status   | tinyint            | 1启用 0禁用               |

**occupations**（职业字典）

| 字段     | 类型               | 说明                     |
| -------- | ------------------ | ------------------------ |
| id       | bigint PK          |                          |
| name     | varchar(50) unique | 职业名，如「软件工程师」 |
| category | varchar(50)        | 大类，如「IT/互联网」    |
| status   | tinyint            | 1启用 0禁用              |

**interest_tags**（兴趣标签字典）

| 字段     | 类型               | 说明                      |
| -------- | ------------------ | ------------------------- |
| id       | bigint PK          |                           |
| name     | varchar(30) unique | 标签名                    |
| category | varchar(30)        | 大类（运动/音乐/旅行...） |
| sort     | int                | 展示排序                  |
| status   | tinyint            | 1启用 0禁用               |

字典表初始数据通过 seed 脚本写入（约 100 个城市、80 个职业、60 个兴趣标签）。运营可管理端增删改。

**user_profiles_pending**（资料待审核池 ⭐ 关键表）

| 字段                   | 类型                       | 说明                                            |
| ---------------------- | -------------------------- | ----------------------------------------------- |
| id                     | bigint PK                  |                                                 |
| user_id                | bigint FK→users           | 哪个用户提交的                                  |
| payload_json           | json                       | 完整资料快照（基本信息/兴趣/需求/头像 OSS key） |
| status                 | tinyint                    | 1 pending 2 approved 3 rejected 4 superseded    |
| reject_reason          | varchar(500) nullable      | 驳回原因                                        |
| reviewed_by            | bigint FK→admins nullable | 审核人                                          |
| reviewed_at            | datetime nullable          | 审核时间                                        |
| created_at, updated_at | datetime                   |                                                 |

**索引**：`UNIQUE(user_id, status)` 的部分索引（仅 status=pending），保证同一用户同时只有一份 pending。

**match_records**

| 字段        | 类型              | 说明         |
| ----------- | ----------------- | ------------ |
| id          | bigint PK         |              |
| user_a_id   | bigint FK→users  | 牵线人 A     |
| user_b_id   | bigint FK→users  | 被牵线人 B   |
| referrer_id | bigint FK→users  | 介绍人       |
| matched_at  | datetime          | 牵线成功时间 |
| note        | text              | 备注         |
| created_by  | bigint FK→admins | 录入的管理员 |
| created_at  | datetime          |              |

**admins**

| 字段                   | 类型               | 说明                           |
| ---------------------- | ------------------ | ------------------------------ |
| id                     | bigint PK          |                                |
| username               | varchar(50) unique | 登录名                         |
| password_hash          | varchar(255)       | bcrypt                         |
| role                   | varchar(20)        | `super_admin` / `operator` |
| status                 | tinyint            | 1启用 0禁用                    |
| last_login_at          | datetime nullable  |                                |
| created_at, updated_at | datetime           |                                |

**audit_logs**

| 字段         | 类型              | 说明                                                                              |
| ------------ | ----------------- | --------------------------------------------------------------------------------- |
| id           | bigint PK         |                                                                                   |
| admin_id     | bigint FK→admins | 操作人                                                                            |
| action       | varchar(50)       | `profile.approve` / `profile.reject` / `user.disable` / `match.create` 等 |
| target_type  | varchar(30)       | `user` / `profile_pending` / `match`                                        |
| target_id    | bigint            |                                                                                   |
| payload_json | json              | 操作上下文                                                                        |
| created_at   | datetime          |                                                                                   |

---

## 七、接口规范（摘要）

详见 `docs/api.md` 与 Swagger（`/api/v1/docs`）。

> 所有接口位于 `/api/v1/` 前缀下。后续不兼容升级走 `/api/v2/`，老版本至少保留 6 个月。

### 7.1 用户端

| Method | Path                       | 说明                               |
| ------ | -------------------------- | ---------------------------------- |
| POST   | /api/v1/auth/register      | 注册（手机号 + 介绍人编码 + 密码） |
| POST   | /api/v1/auth/login         | 登录，返回 JWT                     |
| GET    | /api/v1/me                 | 我的基本信息（不含详细资料）       |
| GET    | /api/v1/profile            | 我的资料（已通过的版本）           |
| POST   | /api/v1/profile/submit     | 提交资料进入待审核                 |
| GET    | /api/v1/profile/status     | 我的资料审核状态                   |
| PUT    | /api/v1/profile            | 用户修改资料 → 重新进入待审核     |
| GET    | /api/v1/me/invite-code     | 我的邀请码                         |
| GET    | /api/v1/me/invites         | 我邀请过的人                       |
| POST   | /api/v1/upload/sign        | 申请 OSS 直传策略（头像）          |
| POST   | /api/v1/account/cancel     | 申请注销（30 天冷静期）            |
| GET    | /api/v1/dict/cities        | 城市字典（下拉）                   |
| GET    | /api/v1/dict/occupations   | 职业字典（下拉）                   |
| GET    | /api/v1/dict/interest-tags | 兴趣标签字典（下拉）               |

### 7.2 管理端（需 `admin` JWT）

| Method   | Path                                       | 说明                                     |
| -------- | ------------------------------------------ | ---------------------------------------- |
| POST     | /api/v1/admin/auth/login                   | 管理员登录                               |
| GET      | /api/v1/admin/users                        | 用户列表（分页/筛选/脱敏）               |
| GET/PUT  | /api/v1/admin/users/:id                    | 详情/编辑/禁用                           |
| GET      | /api/v1/admin/profiles/pending             | 待审核资料列表                           |
| GET      | /api/v1/admin/profiles/pending/:id         | 待审核详情                               |
| POST     | /api/v1/admin/profiles/pending/:id/approve | 审核通过                                 |
| POST     | /api/v1/admin/profiles/pending/:id/reject  | 审核驳回（带原因）                       |
| GET      | /api/v1/admin/referrers                    | 介绍人列表                               |
| GET      | /api/v1/admin/referrers/:id/invitees       | 某介绍人邀请的用户                       |
| POST     | /api/v1/admin/users/:id/transfer-referrer  | 转让介绍人（仅 super_admin）             |
| POST/GET | /api/v1/admin/matches                      | 牵线记录                                 |
| GET      | /api/v1/admin/audit-logs                   | 审核/操作日志                            |
| GET      | /api/v1/admin/stats/dashboard              | 看板数据                                 |
| GET      | /api/v1/admin/health                       | 健康检查（DB/Redis/OSS）                 |
| GET      | /api/v1/admin/dict/cities                  | 城市字典（下拉）                         |
| GET      | /api/v1/admin/dict/occupations             | 职业字典（下拉）                         |
| GET      | /api/v1/admin/dict/interest-tags           | 兴趣标签字典（下拉）                     |
| POST/GET | /api/v1/admin/dict/interests/promote       | 自定义兴趣 → 字典提升（仅 super_admin） |

### 7.3 统一响应格式

```json
{
  "code": 0,
  "message": "ok",
  "data": { ... },
  "requestId": "a1b2c3d4-..."
}
```

- `code: 0` 成功；非 `0` 失败，`message` 为可读描述
- `requestId` 由网关注入，便于日志追踪

### 7.4 错误码字典

| 段位      | 模块        | 示例                                                                                    |
| --------- | ----------- | --------------------------------------------------------------------------------------- |
| 0         | 成功        | `0`                                                                                   |
| 1000-1999 | 通用 / 鉴权 | `1001` 未登录 / `1002` token 过期 / `1003` 权限不足 / `1004` 限流               |
| 2000-2999 | 用户        | `2001` 手机号已注册 / `2002` 用户不存在 / `2003` 账号已禁用 / `2004` 账号注销中 |
| 3000-3999 | 介绍人      | `3001` 邀请码无效 / `3002` 邀请码冲突重试失败                                       |
| 4000-4999 | 资料        | `4001` 资料待审核中 / `4002` 资料已通过 / `4003` 资料已驳回 / `4004` 资料不存在 |
| 5000-5999 | 牵线        | `5001` 双方不能是同一人 / `5002` 介绍人不能是任一方 / `5003` 牵线记录不存在       |
| 6000-6999 | 上传        | `6001` 文件超限 / `6002` 文件类型不允许 / `6003` OSS 签名生成失败                 |
| 9000-9999 | 系统        | `9001` 服务内部异常 / `9002` 数据库异常 / `9003` 外部依赖不可用                   |

### 7.5 关键业务约束

- 注册时**只校验介绍人编码是否存在**，不进入审核；用户登录后才有「提交资料」动作
- 同一用户同一时刻**只允许一份** `pending` 资料，重复提交标 `superseded`
- 资料审核通过用**事务**保证 users / user_interests / user_requirements 同步落地
- 审核驳回后用户可在用户端看到原因，修改后可再次提交（覆盖上一份 rejected）
- 接口时间戳一律 ISO 8601 UTC（`2026-07-20T10:00:00Z`），DB 存 UTC，前端按需本地化

---

## 八、本地开发

### 8.1 环境要求

- Node.js ≥ 18
- pnpm ≥ 8（推荐）或 npm
- Docker Desktop（用于跑 MySQL / Redis）
- 阿里云 OSS 账号（AccessKey + Bucket + 域名）

### 8.2 启动依赖

```bash
docker compose up -d mysql redis
```

| 服务  | 端口 | 用途                |
| ----- | ---- | ------------------- |
| mysql | 3306 | 主库                |
| redis | 6379 | 缓存 / 邀请码计数器 |

> docker-compose.yml 待开发完成后再提供，本节仅说明期望的服务清单。

### 8.3 后端启动

```bash
cd backend
cp .env.example .env             # 修改 DATABASE_URL / 阿里 OSS 配置
pnpm install
pnpm prisma migrate dev          # 建表 + 生成 client
pnpm prisma db seed              # 初始化管理员账号
pnpm start:dev                   # 监听 :3000
```

### 8.4 阿里云 OSS 配置（.env）

```env
OSS_PROVIDER=aliyun
OSS_ENDPOINT=oss-cn-hangzhou.aliyuncs.com
OSS_REGION=cn-hangzhou
OSS_ACCESS_KEY=<your-access-key-id>
OSS_SECRET_KEY=<your-access-key-secret>
OSS_BUCKET=friends-dev
OSS_PUBLIC_BASE=https://friends-dev.oss-cn-hangzhou.aliyuncs.com

# 生产环境
# OSS_BUCKET=friends-prod
# OSS_PUBLIC_BASE=https://friends-prod.oss-cn-hangzhou.aliyuncs.com
```

**权限要求**：AccessKey 需具备 Bucket 的 `PutObject` / `GetObject` 权限。
**Bucket 配置**：建议开启「公共读」，否则生成的图片链接需带签名。

### 8.5 用户端 / 管理端启动

```bash
# 用户端 H5（新开终端）
cd frontend
pnpm install
pnpm dev                         # 监听 :5173

# 管理端（新开终端）
cd admin
pnpm install
pnpm dev                         # 监听 :5174
```

访问：

- 用户端 H5：http://localhost:5173
- 管理端：http://localhost:5174
- 后端 Swagger：http://localhost:3000/api/docs

### 8.6 默认账号

- 管理员：`admin / admin123`（首次登录后请改密码）
- 测试介绍人：通过管理端手工创建或运行 seed 脚本生成

### 8.7 直传策略（OSS）

为避免图片走后端中转，**头像上传走「前端直传阿里 OSS」**：

1. 前端调 `POST /api/upload/sign` 拿到带签名的 PUT 策略
2. 前端拿到策略后直接 `PUT` 到阿里 OSS
3. 上传成功后，前端把返回的 OSS key 提交到资料表单
4. 后端不接触文件流，只保存 key

后端实现位于 `backend/src/modules/upload/`，对接阿里 OSS SDK。

### 8.8 本地无 OSS 凭证的临时方案

如果团队成员本地暂时拿不到阿里 OSS 凭证，可以在 `OSS_PROVIDER=mock` 模式下用**本地文件后端**跑通流程（文件落到 `backend/uploads/`，后端自己签发伪策略 + 本地 PUT 路由）。这是**仅限开发期**的兜底方案，不影响生产部署。

---

## 九、关键设计决策（已敲定）

> 全部设计均已确认。

1. ✅ 介绍人必须注册，由系统生成唯一 6 位数字邀请码（`000000-999999`，冲突重试）
2. ✅ 用户端采用 H5（Vue 3 + Vant 4）
3. ✅ 管理端采用 Vue 3 + Element Plus
4. ✅ 后端采用 NestJS + MySQL + Prisma
5. ✅ 牵线成功由**管理员手工录入**判定，不做双方互认；保留 `note` 字段便于运营备注
6. ✅ 用户资料**强制审核流**：提交后进入 `user_profiles_pending` 表，管理员审核通过后才合并到 `users` / `user_interests` / `user_requirements`
7. ✅ 邀请码规则：6 位数字，去重失败重试
8. ✅ 对象存储使用**阿里云 OSS**（头像/图片）；本地开发期若暂未拿到 OSS 凭证，可临时用 `mock` 驱动跑通流程
9. ✅ **MVP 不做短信验证码**，注册与登录走「手机号 + 密码」方案（Phase 2 接入）
10. ✅ **JWT 单一 long-lived token（7 天）**，无 refresh；过期需重新登录；服务端保留 token 黑名单以支持即时吊销
11. ✅ **管理端 RBAC 2 角色**：`super_admin`（全部权限）+ `operator`（资料审核 + 牵线录入，但不能管理管理员账号）
12. ✅ **介绍人编码注册限流**：IP 维度 1 分钟 5 次，手机号维度 1 小时 5 次
13. ✅ **上传文件约束**：头像 ≤ 5MB，仅 `image/jpeg|jpg|png|webp`，OSS 策略限制 content-type & content-length-range
14. ✅ **敏感信息脱敏**：列表接口手机号统一 `138****5678`，完整号仅 `super_admin` 详情页可见
15. ✅ **错误码字典**：见 7.4 节，段位划分明确，前端可按段位做 toast / 弹窗 / 跳转
16. ✅ **用户主动注销**：30 天冷静期可撤销，到期硬删；注销中账号登录拦截并提示
17. ✅ **接口版本管理**：所有接口位于 `/api/v1/` 下，未来不兼容升级走 `/api/v2/`
18. ✅ **时间戳格式**：全栈 ISO 8601 UTC，DB 存 `DATETIME(3)` UTC，前端按需 `Intl.DateTimeFormat` 本地化
19. ✅ **字典数据方案**：城市采用字典表（必选下拉）；兴趣与职业采用「字典 + 用户自定义」，自定义词由超管审核后批量提升为字典项
20. ✅ **介绍人关系**：用户注册后 referrer_id 1:1 绑定，**用户端不可改、超管后台可转让**（写 audit_logs 留痕）
21. ✅ **批量审核**：MVP **不做**批量通过/驳回，Phase 2 再补
22. ✅ **referrer 唯一性**：每个用户只能有 1 个 referrer（单外键），不支持 1:N

### 9.1 审核流说明

```
用户提交资料
    │
    ▼
┌─────────────────────────────┐
│ user_profiles_pending       │  状态：pending
│ - 完整采集资料（基本信息/兴趣/需求）
│ - 头像 OSS key
│ - 提交时间
└─────────────────────────────┘
    │
    ▼  管理员审核
    ├── 通过 ──▶ 事务合并到 users / user_interests / user_requirements
    │            + pending 标记 approved，关联到 user_id
    └── 驳回 ──▶ pending 标记 rejected，填写驳回原因，用户端可见

边界情况：
- 用户重复提交：保留最新一份 pending，旧的可标 superseded
- 资料审核通过后用户再次修改：视为新一轮 pending
- 注册本身不需要审核（只校验介绍人编码），仅「完善资料」走审核
```

---

## 十、路线图

### Phase 1 · MVP（首版交付）

- [ ] 后端骨架：NestJS + Prisma + 鉴权 + Swagger
- [ ] 用户端：注册（含介绍人编码）、资料采集、我的邀请码
- [ ] 管理端：用户/介绍人/牵线记录 CRUD + 基础看板
- [ ] Docker Compose 一键起
- [ ] README + docs/api.md

### Phase 2 · 体验优化

- [ ] 表单分步填写、保存草稿
- [ ] 用户端「我的介绍成果」可视化
- [ ] 管理端高级筛选、批量操作
- [ ] 操作日志、审计追踪

### Phase 3 · 运营增强

- [ ] 介绍人邀请关系树可视化
- [ ] 牵线成功率漏斗
- [ ] 数据导出（CSV）
- [ ] 消息通知（短信/微信）

---

## 十一、贡献与规范

- **分支**：`feat/*`、`fix/*`、`docs/*`，主干 `main`
- **提交**：`feat(user): 新增资料采集接口`
- **PR**：每个 PR 关联一个 issue / 任务，CI 通过 + 1 人 review
- **代码风格**：ESLint + Prettier，后端额外启用 `@typescript-eslint`
- **接口变更**：必须同步更新 `docs/api.md` 与 Swagger 注解

---

## 十二、License

内部项目，暂未开源。

---

## 十三、设计要点补遗（P0 安全与可运维细节）

> 以下补遗覆盖 10 项 P0 设计要点，与第九章决策一一对应。本章是后续编码时的「必读清单」。

### 13.1 鉴权与登录

#### 13.1.1 用户鉴权（注册 / 登录）

- **注册**：POST `/api/v1/auth/register`
  - 入参：`{ phone, password, inviteCode, nickname? }`
  - 校验：手机号格式、密码强度（≥ 8 位，含字母+数字）、介绍人编码必须存在
  - 限流：同 IP 1 分钟 5 次，同手机号 1 小时 5 次
- **登录**：POST `/api/v1/auth/login`
  - 入参：`{ phone, password }`
  - 成功：返回 `accessToken`（7 天）+ 用户基本信息（不含详细资料）
- **密码哈希**：bcrypt，`cost = 12`
- **JWT payload**：`{ sub: userId, role: 'user', iat, exp }`，密钥从 `JWT_SECRET` 环境变量读取

#### 13.1.2 管理员鉴权

- **登录**：POST `/api/v1/admin/auth/login`
  - 入参：`{ username, password }`
- **JWT payload**：`{ sub: adminId, role: 'super_admin' | 'operator', iat, exp }`
- **角色守卫**：`@Roles('super_admin')` 装饰器；`operator` 不可访问管理员账号管理接口

#### 13.1.3 Token 黑名单

- 用户/管理员登出时，token jti 加入 Redis 黑名单（TTL = 剩余有效期）
- 网关中间件校验黑名单，命中即 401
- MVP 暂不实现「踢下线」按钮，仅支持用户主动登出；Phase 2 加 admin 强制踢人

### 13.2 限流

| 维度         | 阈值                    | 实现                                 |
| ------------ | ----------------------- | ------------------------------------ |
| 注册接口     | IP: 5/min；phone: 5/h   | `@nestjs/throttler` + Redis 计数器 |
| 登录接口     | IP: 10/min；phone: 10/h | 同上                                 |
| 资料提交     | user: 3/h               | 同上                                 |
| 管理端写操作 | admin: 60/min           | 同上                                 |

### 13.3 上传文件约束

- **类型**：`image/jpeg`、`image/png`、`image/webp`（OSS 策略里限制 `content-type`）
- **大小**：≤ 5MB（OSS 策略里限制 `content-length-range: 0,5242880`）
- **命名规则**：`avatar/{userId}/{yyyyMM}/{uuid}.{ext}`，避免覆盖与命名冲突
- **回调校验**：前端提交 OSS key 到后端时，后端二次校验 key 前缀是否属于本用户，防止越权写入
- **mock 驱动**：本地无 OSS 凭证时，`OSS_PROVIDER=mock`，文件落到 `backend/uploads/`，后端提供本地 PUT 路由 `/api/v1/upload/mock-put?key=xxx` 模拟直传

### 13.4 敏感信息脱敏

- **手机号**：列表返回 `138****5678`；详情页仅 `super_admin` 可见完整号
- **身份证 / 住址**：本期不采集，无脱敏需求
- **位置信息**：列表展示市级，不展示区/街道

脱敏在**后端序列化层**统一处理，用 `@ExcludeFromList()` 装饰器标记字段。

### 13.5 错误码

详见 [7.4 错误码字典](#74-错误码字典)。前端 toast 规则建议：

| code 前缀         | 推荐 UI 反馈                               |
| ----------------- | ------------------------------------------ |
| 1002 token 过期   | 弹窗 → 跳登录                             |
| 1003 权限不足     | 静默 + 跳 403 页                           |
| 1004 限流         | toast「操作频繁，请稍后再试」              |
| 2001 手机号已注册 | 表单内红字提示                             |
| 4003 资料已驳回   | 跳驳回详情页                               |
| 9000+             | toast「系统异常，请稍后重试」+ 上报 Sentry |

### 13.6 用户注销

- **触发**：POST `/api/v1/account/cancel`（需登录）
- **状态机**：`active` → `canceling`（30 天冷静期）→ `deleted`（硬删）
- **冷静期行为**：
  - 用户可登录撤销注销
  - 不可提交资料、不可被撮合
  - 资料从公开列表移除
- **到期处理**：定时任务每日扫描 `canceling < 30d` 的账号，触发硬删（删 user_profiles_pending、match_records 中涉及该用户的记录软标记）

### 13.7 字典数据管理

#### 设计原则

| 字段                       | 字典来源               | 是否支持自定义              |
| -------------------------- | ---------------------- | --------------------------- |
| 城市 (`city_id`)         | `cities` 字典        | ❌ 仅字典，禁用城市无法被选 |
| 职业 (`occupation_id`)   | `occupations` 字典   | ✅ 可输入自定义词           |
| 兴趣 (`interest_tag_id`) | `interest_tags` 字典 | ✅ 可输入自定义词           |

#### 接口

- 用户端：`GET /api/v1/dict/{cities|occupations|interest-tags}` 拿启用项，按 sort 排序
- 管理端：字典 CRUD（增/改/禁用/排序），Phase 2 实现简单列表页；MVP 通过 seed 与数据库直维护

#### 自定义词流程

```
用户在资料表单输入自定义职业/兴趣词
    ↓
保存到 user_custom_interests（或 pending.payload_json 中）
    ↓
审核通过后写入 user_custom_interests 表
    ↓
超管在管理端看到高频自定义词列表
    ↓
点击「提升为字典项」→ 写入 interest_tags / occupations，标记 promoted=1
    ↓
其他用户资料表单可选到这个新词
```

### 13.8 介绍人转让（超管操作）

- **接口**：`POST /api/v1/admin/users/:id/transfer-referrer`
- **权限**：仅 `super_admin`
- **入参**：`{ newReferrerId: number, reason: string }`
- **校验**：
  - 不能转给自己（`newReferrerId !== userId`）
  - 目标介绍人必须存在且启用
  - 目标介绍人不能是被介绍人自己或被介绍人的介绍人（避免环状关系）
- **行为**：
  - 更新 `users.referrer_id`
  - 写 `audit_logs`：`action = 'user.transfer_referrer'`，payload 含 old/new/operator/reason
  - 历史邀请关系记录保留（新增 `referrer_history` 表存变更轨迹）
  - 用户的 6 位邀请码不变（被转让方仍带自己原邀请码）

### 13.9 接口版本与时间戳

- **URL 前缀**：所有接口 `/api/v1/`
- **版本策略**：不兼容变更 → `/api/v2/`；兼容变更（新增字段、新增接口）→ 维持 v1
- **时间戳格式**：
  - 响应：`"createdAt": "2026-07-20T10:00:00.000Z"`（ISO 8601 UTC，毫秒精度）
  - 数据库：`DATETIME(3)`，全部存 UTC
  - 前端：用 `dayjs` / `date-fns` 做本地化展示，不在 UI 写时区

### 13.10 健康检查

- **端点**：`GET /api/v1/admin/health`（需 admin 鉴权，避免外部探测）
- **响应**：

  ```json
  {
    "code": 0,
    "data": {
      "status": "ok",
      "checks": {
        "mysql": { "status": "ok", "latencyMs": 3 },
        "redis": { "status": "ok", "latencyMs": 1 },
        "oss":   { "status": "ok", "latencyMs": 12 }
      },
      "version": "1.0.0",
      "uptime": 3600
    }
  }
  ```

### 13.11 请求追踪（TraceId）

- 网关中间件生成 `X-Request-Id`（UUIDv4），写入响应头与日志上下文
- 所有 SQL 日志、异常日志自动带上 requestId
- 前端 axios 拦截器把当前 requestId 上报 Sentry

### 13.12 环境变量与配置

- 启动时用 `Joi` schema 校验 `.env`，缺关键变量直接 fail-fast
- 关键变量清单：

  ```env
  NODE_ENV=development
  PORT=3000

  DATABASE_URL=mysql://user:pass@localhost:3306/friends
  REDIS_URL=redis://localhost:6379

  JWT_SECRET=<32-char-random>
  JWT_EXPIRES_IN=7d

  OSS_PROVIDER=aliyun
  OSS_ENDPOINT=oss-cn-hangzhou.aliyuncs.com
  OSS_REGION=cn-hangzhou
  OSS_ACCESS_KEY=<ak>
  OSS_SECRET_KEY=<sk>
  OSS_BUCKET=friends-dev
  OSS_PUBLIC_BASE=https://friends-dev.oss-cn-hangzhou.aliyuncs.com

  THROTTLE_TTL=60
  THROTTLE_LIMIT=10
  ```

### 13.13 数据库迁移规范

- 迁移文件命名：`prisma/migrations/YYYYMMDDHHMMSS_<topic>/migration.sql`
- 本地：`pnpm prisma migrate dev`（生成 + 应用）
- 生产：**禁止** `migrate dev`，只允许 `migrate deploy`（仅应用已有迁移）
- 紧急回滚：写反向迁移，不要直接改历史文件

### 13.14 Seed 脚本

`backend/prisma/seed.ts` 创建以下示例数据，便于前后端联调：

- **字典数据**：
  - `cities`：约 30 个一线/新一线城市
  - `occupations`：约 40 个常见职业
  - `interest_tags`：约 30 个常见兴趣标签
- **管理员**：`admin / Admin@123`（super_admin）、`operator1 / Operator@123`（operator）
- **介绍人用户**：3 个已审核通过的测试用户，每人带 6 位邀请码
- **被介绍人用户**：6 个，分布不同审核状态
  - 2 个 pending（待审核）
  - 1 个 rejected（已驳回，带原因）
  - 3 个 approved（已通过，用于撮合测试）
- **示例牵线记录**：2 条已成功案例
- **示例邀请关系**：3 个介绍人各介绍 2 人
- **示例自定义兴趣**：1-2 条 `user_custom_interests`，用于测试提升流程

---

> 补遗完毕。开始编码前请通读本章 13.1 ~ 13.14。
