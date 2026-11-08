# Friends · 父母帮孩子相亲

爸爸或妈妈使用自己的手机号注册，登记成年子女资料，提交后由工作人员审核并协助人工牵线

现已实现父母注册、孩子分步资料登记、后台审核、今日推荐首页与人工牵线记录；首页按孩子情况推荐审核通过的资料，尚未提供直接联系、收藏、会员收费或成功案例宣传

## 本地启动

需要 Node.js 20+、Docker Desktop，以及 frontend、admin、backend 各目录的 npm 依赖

```bash
docker compose up -d mysql redis
```

首次配置后端时，将 `backend/.env.example` 复制为 `backend/.env`，填写本地配置；默认 MySQL 端口为 3307，Redis 为 6380，开发图片上传使用 mock 模式

如果 Docker 卷来自之前的版本，初始化新开发库：

```bash
docker compose exec mysql sh -c 'mysql -uroot -p"$MYSQL_ROOT_PASSWORD" -e "CREATE DATABASE IF NOT EXISTS friends_parent_dev CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"'
```

随后在三个终端中分别运行：

```bash
cd backend
npm install
npm run prisma:generate
npm run prisma:deploy
npm run prisma:seed
npm run start:dev
```

```bash
cd frontend
npm install
npm run dev -- --port 5173
```

```bash
cd admin
npm install
npm run dev -- --port 5174
```

- 父母端：<http://localhost:5173/#/register>
- 管理端：<http://localhost:5174/login>
- API 文档：<http://localhost:3000/api/v1/docs>

当前研发版使用 `friends_parent_dev`，不读取原来的 `friends` 数据库，也不迁移旧资料；结构迁移记录面向空库初始化，请不要用于承载旧业务数据的数据库

## 开发体验账号

以下账号由 seed 初始化，仅用于本地开发体验

| 角色 / 状态 | 账号 | 密码 |
| --- | --- | --- |
| 超级管理员 | admin | Admin@123 |
| 运营 | operator1 | Operator@123 |
| 介绍人 | 13900000001 | Pass1234 |
| 林妈妈 · 孩子资料已通过 | 13800000001 | Pass1234 |
| 陈爸爸 · 孩子资料已通过 | 13800000002 | Pass1234 |
| 周妈妈 · 孩子资料待审核 | 13800000003 | Pass1234 |
| 李爸爸 · 孩子资料已驳回 | 13800000004 | Pass1234 |
| 赵妈妈 · 孩子资料为草稿 | 13800000005 | Pass1234 |

介绍人 `13900000001` 的邀请码为 `100001`，不填写邀请码也可注册

## 已实现流程

1. 点选“男孩／找儿媳”或“女孩／找女婿”人物卡片进入登记，按学历、收入、现居城市逐项填写，再分步填写父母联系方式、密码及选填邀请码
2. 创建账号自动登录，已填的孩子资料保存为草稿
3. 一个页面填写一个主题，继续完善父母身份、孩子出生日期与身高，再逐项补充资料和择偶期待；选填可跳过，目录可返回修改
4. 每一步保存草稿和当前填写位置，刷新或重新登录接着填写；并发修改会提示版本冲突，本机未同步内容可核对恢复
5. 提交前预览资料，确认孩子年满 18 周岁并知情同意
6. 工作人员审核提交快照，通过或填写驳回原因，父母可修改并重新提交
7. 后台牵线选择两个审核通过的孩子，介绍人选填，父母联系方式单独展示

父母账号不保存孩子的性别、出生日期、择偶条件或照片；孩子档案通过 `ownerAccountId` 关联父母，首版的 `registrationSlot` 保证同一账号只有一份登记档案，关系结构可扩展多个孩子

## 验证与接口

在 backend、frontend、admin 中分别执行 `npm run build`

后端启动且开发库已 seed 后执行：

```bash
cd backend
npm run test:parent-flow
```

接口流程检查覆盖注册、邀请码、并发草稿、成年限制、照片上传归属、版本冲突、提交快照、审核与驳回、权限、牵线、短信关闭状态和登出，测试结束只清理自身创建的测试记录与图片

短信接口已预留，`GET /api/v1/auth/methods` 返回 `sms: false`，发送、校验和验证码登录接口目前均返回 HTTP 503；接入服务商之前继续使用手机号和密码

详细说明见 [开发验收说明](docs/parent-registration-development.md) 和 [参考资料评估](docs/parent-matchmaking-assessment.md)
