// Exercises real HTTP contracts against a running development server and removes only its own fixtures.
require('dotenv').config({
  path: require('node:path').join(__dirname, '../.env'),
});
const assert = require('node:assert/strict');
const { PrismaClient } = require('@prisma/client');
const { randomUUID } = require('node:crypto');
const { rm } = require('node:fs/promises');
const path = require('node:path');
const db = new PrismaClient();
const base = process.env.TEST_API_URL || 'http://localhost:3000';
const ids = [],
  keys = [];
let checks = 0;
async function api(route, { method = 'GET', body, token, status, message } = {}) {
  const r = await fetch(base + '/api/v1/' + route, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: 'Bearer ' + token } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const envelope = await r.json();
  if (message) assert.match(envelope.message, message);
  if (status)
    assert.equal(
      r.status,
      status,
      `${method} ${route}: ${JSON.stringify(envelope)}`,
    );
  else
    assert.equal(
      envelope.code,
      0,
      `${method} ${route}: ${JSON.stringify(envelope)}`,
    );
  checks++;
  return envelope.data;
}
async function main() {
  assert.ok(
    ['localhost', '127.0.0.1'].includes(new URL(base).hostname),
    'Use a local development API',
  );
  const admin = (
    await api('admin/auth/login', {
      method: 'POST',
      body: { username: 'admin', password: 'Admin@123' },
    })
  ).accessToken;
  const operator = (
    await api('admin/auth/login', {
      method: 'POST',
      body: { username: 'operator1', password: 'Operator@123' },
    })
  ).accessToken;
  const options = await api('profile/options');
  await api('recommendations', { status: 401 });
  await api('recommendations', { token: admin, status: 403 });
  const city = (await api('dict/cities')).find((c) => c.name === '上海市');
  const phoneBase = Number('18' + String(Date.now()).slice(-9));
  async function parent(offset, inviteCode) {
    const auth = await api('auth/register', {
      method: 'POST',
      body: {
        phone: String(phoneBase + offset),
        password: offset === 0 ? '123456' : 'abcdef',
        nickname: '自动验证父母' + offset,
        termsAccepted: true,
        ...(inviteCode ? { inviteCode } : {}),
      },
    });
    ids.push(BigInt(auth.user.id));
    return auth;
  }
  const a = await parent(0),
    b = await parent(1, '100001');
  await api('auth/login', { method: 'POST', body: { phone: String(phoneBase), password: '123456' } });
  await api('auth/login', { method: 'POST', body: { phone: String(phoneBase + 1), password: 'abcdef' } });
  const oldPassword = 'Before1234';
  const newPassword = 'After5678';
  const passwordAuth = await api('auth/register', {
    method: 'POST',
    body: {
      phone: String(phoneBase + 3),
      password: oldPassword,
      nickname: '自动验证改密父母',
      termsAccepted: true,
    },
  });
  ids.push(BigInt(passwordAuth.user.id));
  await api('me', { token: passwordAuth.accessToken });
  await api(`admin/users/${passwordAuth.user.id}/password`, {
    method: 'PUT',
    token: a.accessToken,
    body: { password: newPassword },
    status: 403,
  });
  await api(`admin/users/${passwordAuth.user.id}/password`, {
    method: 'PUT',
    token: operator,
    body: { password: '12345' },
    status: 400,
    message: /密码至少需要 6 位/,
  });
  const resetResult = await api(
    `admin/users/${passwordAuth.user.id}/password`,
    {
      method: 'PUT',
      token: operator,
      body: { password: newPassword },
    },
  );
  assert.equal(resetResult.passwordReset, true);
  assert.equal(JSON.stringify(resetResult).includes(newPassword), false);
  const resetAudit = await db.auditLog.findFirst({
    where: {
      action: 'user.password_reset',
      targetId: BigInt(passwordAuth.user.id),
    },
  });
  assert.deepEqual(resetAudit.payloadJson, { passwordReset: true });
  assert.equal(JSON.stringify(resetAudit.payloadJson).includes(newPassword), false);
  await api('auth/login', {
    method: 'POST',
    body: { phone: String(phoneBase + 3), password: oldPassword },
    status: 400,
    message: /手机号或密码错误/,
  });
  await api('me', { token: passwordAuth.accessToken, status: 401 });
  const newLogin = await api('auth/login', {
    method: 'POST',
    body: { phone: String(phoneBase + 3), password: newPassword },
  });
  await api('me', { token: newLogin.accessToken });
  await api('auth/register', {
    method: 'POST', body: { phone: String(phoneBase + 2), password: '12345', nickname: '验证父母', termsAccepted: true },
    status: 400, message: /密码至少需要 6 位/,
  });
  const meA = await api('me', { token: a.accessToken });
  assert.equal(meA.referrer, null);
  assert.equal(
    (await api('me', { token: b.accessToken })).referrer.inviteCode,
    '100001',
  );
  await api('auth/register', {
    method: 'POST',
    body: {
      phone: String(phoneBase + 2),
      password: 'Test1234',
      nickname: '自动验证',
      inviteCode: '999999',
      termsAccepted: true,
    },
    status: 400,
  });
  await api('auth/register', {
    method: 'POST',
    body: {
      phone: String(phoneBase + 2),
      password: 'Test1234',
      nickname: '自动验证',
      termsAccepted: false,
    },
    status: 400,
  });
  const original = {
    relationship: 'mother',
    nickname: '测试孩子',
    gender: 2,
    birthDate: '1998-03-16',
    height: 165,
    cityId: Number(city.id),
    workCityId: Number(city.id),
    education: 'bachelor',
    income: '8k_12k',
    traits: [options.traits[0]],
    advantages: [options.advantages[0]],
    photoOssKeys: [],
    preference: {
      tags: [options.expectations[0]],
      birthYearMin: 1990,
      birthYearMax: 2001,
    },
  };
  const concurrent = await Promise.allSettled([
    api('profile/draft', {
      method: 'PUT',
      token: a.accessToken,
      body: { payload: original, expectedRevision: 0 },
    }),
    api('profile/draft', {
      method: 'PUT',
      token: a.accessToken,
      body: { payload: { relationship: 'mother' }, expectedRevision: 0 },
    }),
  ]);
  assert.equal(concurrent.filter((r) => r.status === 'fulfilled').length, 1);
  const failedWrite = concurrent.find((r) => r.status === 'rejected');
  assert.match(failedWrite.reason.message, /code.*1005/);
  assert.equal(
    await db.childProfile.count({ where: { ownerAccountId: ids[0] } }),
    1,
  );
  let draft = await api('profile/draft', { token: a.accessToken });
  let rev = draft.draftRevision;
  async function save(payload, currentStep) {
    draft = await api('profile/draft', {
      method: 'PUT',
      token: a.accessToken,
      body: { payload, expectedRevision: rev, currentStep },
    });
    rev = draft.draftRevision;
    return draft;
  }
  // Draft content and the resume position share the same revision guard.
  await save({ gender: 2 }, 'education');
  const resumed = await api('profile/draft', { token: a.accessToken });
  assert.equal(resumed.currentStep, 'education');
  assert.equal(resumed.draft.gender, 2);
  assert.equal(resumed.draft.birthDate, undefined);
  await save(original, 'traits');
  assert.equal(draft.draft.workCityId, Number(city.id));
  assert.equal(draft.draft.workCityName, '上海市');
  await save(original, 'workCity');
  assert.equal(draft.currentStep, 'workCity');
  await save(original, 'traits');
  await api('profile/draft', {
    method: 'PUT', token: a.accessToken,
    body: { payload: { ...original, preference: { birthYearMax: 201 } }, expectedRevision: rev },
    status: 400, message: /最晚出生年份不能小于 1900/,
  });
  await api('profile/draft', {
    method: 'PUT',
    token: a.accessToken,
    body: { payload: original, expectedRevision: rev - 1, currentStep: 'city' },
    status: 409,
  });
  assert.equal(
    (await api('profile/draft', { token: a.accessToken })).currentStep,
    'traits',
  );
  await api('profile/draft', {
    method: 'PUT',
    token: a.accessToken,
    body: {
      payload: original,
      expectedRevision: rev,
      currentStep: 'invalid-step',
    },
    status: 400,
  });
  async function submit(status) {
    return api('profile/submit', {
      method: 'POST',
      token: a.accessToken,
      body: {
        expectedRevision: rev,
        childConsent: true,
        consentVersion: options.consentVersion,
      },
      status,
    });
  }
  await save({ ...original, birthDate: '2015-01-01' });
  await submit(400);
  await save({ ...original, birthDate: '1998-02-30' });
  await submit(400);
  await save({ ...original, preference: { heightMin: 180, heightMax: 160 } });
  await submit(400);
  await save(original);
  await api('profile/draft', {
    method: 'PUT',
    token: a.accessToken,
    body: {
      payload: { ...original, photoOssKeys: ['someone-elses-file.jpg'] },
      expectedRevision: rev,
    },
    status: 400,
  });
  await api('profile/draft', {
    method: 'PUT',
    token: a.accessToken,
    body: { payload: original, expectedRevision: rev - 1 },
    status: 409,
  });
  await api('profile/submit', {
    method: 'POST',
    token: a.accessToken,
    body: {
      expectedRevision: rev,
      childConsent: false,
      consentVersion: options.consentVersion,
    },
    status: 400,
  });
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aL1sAAAAASUVORK5CYII=',
    'base64',
  );
  const metadata = {
    filename: 'test.png',
    mimeType: 'image/png',
    size: png.length,
    purpose: 'lifestyle',
    profileId: draft.id,
  };
  const sign = await api('upload/sign', {
    method: 'POST',
    token: a.accessToken,
    body: metadata,
  });
  keys.push(sign.key);
  await api('upload/sign', {
    method: 'POST',
    token: b.accessToken,
    body: metadata,
    status: 400,
  });
  await api('upload/commit', {
    method: 'POST',
    token: a.accessToken,
    body: { ...metadata, ossKey: sign.key },
    status: 400,
  });
  const fd = new FormData();
  fd.append('key', sign.key);
  fd.append('file', new Blob([png], { type: 'image/png' }), 'test.png');
  const uploaded = await fetch(new URL(sign.url, base), {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + a.accessToken },
    body: fd,
  });
  assert.equal(uploaded.status, 201);
  const committed = await api('upload/commit', {
    method: 'POST',
    token: a.accessToken,
    body: { ...metadata, ossKey: sign.key },
  });
  assert.equal((await fetch(new URL(committed.url, base))).status, 200);
  assert.equal(
    (await fetch(new URL(committed.url.split('?')[0], base))).status,
    403,
  );
  await api('upload/commit', {
    method: 'POST',
    token: b.accessToken,
    body: { ...metadata, ossKey: sign.key },
    status: 400,
  });
  await save({ ...original, photoOssKeys: [sign.key] });
  let submitted = await submit();
  await submit(409);
  const oldReview = submitted.latestSubmission.id;
  await save({
    ...original,
    nickname: '修改后的孩子',
    photoOssKeys: [sign.key],
  });
  await api(`admin/profiles/pending/${oldReview}/approve`, {
    method: 'POST',
    token: admin,
  });
  let mine = await api('profile/draft', { token: a.accessToken });
  assert.equal(mine.approved.nickname, original.nickname);
  assert.equal(mine.draft.nickname, '修改后的孩子');
  assert.equal(
    (await api('me', { token: a.accessToken })).nickname,
    '自动验证父母0',
  );
  submitted = await submit();
  await api(`admin/profiles/pending/${submitted.latestSubmission.id}/reject`, {
    method: 'POST',
    token: operator,
    body: { reason: '补充介绍后再提交' },
  });
  mine = await api('profile/draft', { token: a.accessToken });
  assert.equal(mine.profileStatus, 3);
  assert.equal(mine.approved.nickname, original.nickname);
  const updated = await save({
    ...original,
    nickname: '修改后的孩子',
    introduction: '已按建议补充',
    photoOssKeys: [sign.key],
  });
  const superseded = await submit();
  await save({
    ...original,
    nickname: '修改后的孩子',
    introduction: '补充并确认的新版本',
    photoOssKeys: [sign.key],
  });
  const latest = await submit();
  await api(
    `admin/profiles/pending/${superseded.latestSubmission.id}/approve`,
    { method: 'POST', token: admin, status: 400 },
  );
  await api(`admin/profiles/pending/${latest.latestSubmission.id}/approve`, {
    method: 'POST',
    token: admin,
  });
  await api(`admin/profiles/pending/${latest.latestSubmission.id}/approve`, {
    method: 'POST',
    token: admin,
    status: 400,
  });
  const recommendations = await api('recommendations?gender=2', { token: b.accessToken });
  const repeated = await api('recommendations?gender=2', { token: b.accessToken });
  assert.deepEqual(recommendations.items.map(p => p.id), repeated.items.map(p => p.id));
  assert.ok(recommendations.items.some(p => p.id === updated.id));
  assert.ok(recommendations.items.every(p => p.gender === 2));
  const card = await api(`recommendations/${updated.id}`, { token: b.accessToken });
  assert.equal(card.introduction, '补充并确认的新版本');
  assert.equal(card.relationshipLabel, '母亲');
  assert.equal(card.incomeLabel, options.income.find(x => x.value === original.income).label);
  assert.equal(card.workCityName, city.name);
  assert.equal(card.hometownCityName, null);
  assert.deepEqual(card.preference, { birthYearMin: 1990, birthYearMax: 2001, heightMin: null, heightMax: null, educationLabel: null, cityName: null, tags: original.preference.tags });
  assert.equal(card.photoUrls.length, 1);
  assert.equal(card.photoUrls[0], card.photoUrl);
  assert.equal(recommendations.items.find(p => p.id === updated.id).photoUrls, undefined);
  for (const field of ['phone', 'ownerAccountId', 'nickname', 'birthDate', 'draft', 'photoOssKeys', 'photos', 'referrer', 'latestSubmission']) assert.equal(card[field], undefined);
  await api(`recommendations/${updated.id}`, { token: a.accessToken, status: 404 });
  await api('recommendations/not-a-profile', { token: b.accessToken, status: 404 });
  await api('recommendations/999999999', { token: b.accessToken, status: 404 });
  await api('recommendations?gender=3', { token: b.accessToken, status: 400 });
  assert.equal((await api('recommendations?gender=2&keyword=' + encodeURIComponent('补充并确认'), { token: b.accessToken })).items[0].id, updated.id);
  const cityRecommendations = await api('recommendations?cityId=' + city.id, { token: b.accessToken });
  assert.ok(cityRecommendations.items.every(p => p.cityId === Number(city.id)));
  await save({ ...original, income: options.income.find(x => x.value !== original.income).value, introduction: '未提交的修改不可推荐', photoOssKeys: [sign.key] });
  const unchangedDetail = await api(`recommendations/${updated.id}`, { token: b.accessToken });
  assert.equal(unchangedDetail.introduction, '补充并确认的新版本');
  assert.equal(unchangedDetail.incomeLabel, card.incomeLabel);
  const full = await api(`admin/users/${a.user.id}`, { token: admin });
  const masked = await api(`admin/users/${a.user.id}`, { token: operator });
  assert.equal(full.phone, String(phoneBase));
  assert.match(masked.phone, /\*{4}/);
  await api('profile/draft', { token: admin, status: 403 });
  await api('admin/users', { token: a.accessToken, status: 403 });
  const approved = (
    await api('admin/children?approved=true&pageSize=100', { token: admin })
  ).items;
  const other = approved.find((c) => c.ownerAccountId !== a.user.id);
  await api('admin/matches', {
    method: 'POST',
    token: admin,
    body: {
      profileAId: Number(updated.id),
      profileBId: Number(other.id),
      matchedAt: new Date().toISOString(),
    },
  });
  await api('admin/matches', {
    method: 'POST',
    token: admin,
    body: {
      profileAId: Number(updated.id),
      profileBId: Number(updated.id),
      matchedAt: new Date().toISOString(),
    },
    status: 400,
  });
  await api(`admin/users/${a.user.id}`, {
    method: 'PUT',
    token: admin,
    body: { status: 0 },
  });
  await api('me', { token: a.accessToken, status: 401 });
  await api(`recommendations/${updated.id}`, { token: b.accessToken, status: 404 });
  assert.ok(!(await api('recommendations?gender=2', { token: b.accessToken })).items.some(p => p.id === updated.id));
  await api('admin/matches', {
    method: 'POST',
    token: admin,
    body: {
      profileAId: Number(updated.id),
      profileBId: Number(other.id),
      matchedAt: new Date().toISOString(),
    },
    status: 400,
  });
  await api(`admin/users/${a.user.id}`, {
    method: 'PUT',
    token: admin,
    body: { status: 1 },
  });
  await api('auth/sms/send', {
    method: 'POST',
    body: { phone: String(phoneBase), purpose: 'login' },
    status: 503,
  });
  await api('auth/sms/verify', {
    method: 'POST',
    body: {
      phone: String(phoneBase),
      purpose: 'login',
      challengeId: randomUUID(),
      code: '123456',
    },
    status: 503,
  });
  await api('auth/sms/login', {
    method: 'POST',
    body: {
      phone: String(phoneBase),
      purpose: 'login',
      challengeId: randomUUID(),
      code: '123456',
      termsAccepted: true,
    },
    status: 503,
  });
  await api('auth/logout', { method: 'POST', token: a.accessToken });
  await api('me', { token: a.accessToken, status: 401 });
  const stats = await api('admin/stats/dashboard', { token: admin });
  assert.equal(typeof stats.totalProfiles, 'number');
  assert.equal(stats.successRate, undefined);
  assert.equal(
    (await db.user.findUnique({ where: { id: ids[0] } })).termsVersion,
    options.consentVersion,
  );
  assert.equal(
    (
      await db.userProfilePending.findUnique({
        where: { id: BigInt(latest.latestSubmission.id) },
      })
    ).consentVersion,
    options.consentVersion,
  );
  console.log(
    `PASS: ${checks} HTTP checks, draft concurrency, review snapshots, ownership, photos, optional referrals, roles, consent and logout`,
  );
}
async function cleanup() {
  const profiles = await db.childProfile.findMany({
    where: { ownerAccountId: { in: ids } },
    select: { id: true },
  });
  const profileIds = profiles.map((p) => p.id);
  await db.$transaction(async (tx) => {
    const matches = await tx.matchRecord.findMany({
      where: {
        OR: [
          { profileAId: { in: profileIds } },
          { profileBId: { in: profileIds } },
        ],
      },
    });
    await tx.auditLog.deleteMany({
      where: {
        OR: [
          { targetType: 'user', targetId: { in: ids } },
          { targetType: 'child_profile', targetId: { in: profileIds } },
          { targetType: 'match', targetId: { in: matches.map((m) => m.id) } },
        ],
      },
    });
    await tx.matchRecord.deleteMany({
      where: { id: { in: matches.map((m) => m.id) } },
    });
    await tx.userProfilePending.deleteMany({
      where: { profileId: { in: profileIds } },
    });
    await tx.uploadedFile.deleteMany({ where: { userId: { in: ids } } });
    await tx.childProfile.deleteMany({ where: { id: { in: profileIds } } });
    await tx.tokenBlacklist.deleteMany({ where: { userId: { in: ids } } });
    await tx.user.deleteMany({ where: { id: { in: ids } } });
  });
  for (const key of keys)
    await rm(path.join(process.cwd(), 'uploads', key), { force: true });
}
main()
  .catch((e) => {
    console.error(e.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await cleanup();
    await db.$disconnect();
  });
