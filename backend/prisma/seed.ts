/* eslint-disable no-console */
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const CITIES: Array<{ name: string; pinyin: string; province: string; level: number }> = [
  { name: '北京', pinyin: 'beijing', province: '北京', level: 1 },
  { name: '上海', pinyin: 'shanghai', province: '上海', level: 1 },
  { name: '广州', pinyin: 'guangzhou', province: '广东', level: 1 },
  { name: '深圳', pinyin: 'shenzhen', province: '广东', level: 1 },
  { name: '杭州', pinyin: 'hangzhou', province: '浙江', level: 2 },
  { name: '成都', pinyin: 'chengdu', province: '四川', level: 2 },
  { name: '重庆', pinyin: 'chongqing', province: '重庆', level: 2 },
  { name: '苏州', pinyin: 'suzhou', province: '江苏', level: 2 },
  { name: '南京', pinyin: 'nanjing', province: '江苏', level: 2 },
  { name: '武汉', pinyin: 'wuhan', province: '湖北', level: 2 },
  { name: '西安', pinyin: 'xian', province: '陕西', level: 2 },
  { name: '天津', pinyin: 'tianjin', province: '天津', level: 2 },
  { name: '长沙', pinyin: 'changsha', province: '湖南', level: 2 },
  { name: '青岛', pinyin: 'qingdao', province: '山东', level: 3 },
  { name: '宁波', pinyin: 'ningbo', province: '浙江', level: 3 },
  { name: '厦门', pinyin: 'xiamen', province: '福建', level: 3 },
  { name: '福州', pinyin: 'fuzhou', province: '福建', level: 3 },
  { name: '济南', pinyin: 'jinan', province: '山东', level: 3 },
  { name: '合肥', pinyin: 'hefei', province: '安徽', level: 3 },
  { name: '郑州', pinyin: 'zhengzhou', province: '河南', level: 3 },
  { name: '昆明', pinyin: 'kunming', province: '云南', level: 3 },
  { name: '佛山', pinyin: 'foshan', province: '广东', level: 3 },
  { name: '东莞', pinyin: 'dongguan', province: '广东', level: 3 },
  { name: '无锡', pinyin: 'wuxi', province: '江苏', level: 3 },
  { name: '沈阳', pinyin: 'shenyang', province: '辽宁', level: 3 },
  { name: '大连', pinyin: 'dalian', province: '辽宁', level: 3 },
  { name: '南昌', pinyin: 'nanchang', province: '江西', level: 4 },
  { name: '南宁', pinyin: 'nanning', province: '广西', level: 4 },
  { name: '贵阳', pinyin: 'guiyang', province: '贵州', level: 4 },
  { name: '太原', pinyin: 'taiyuan', province: '山西', level: 4 },
];

const OCCUPATIONS: Array<{ name: string; category: string }> = [
  { name: '软件工程师', category: 'IT/互联网' },
  { name: '产品经理', category: 'IT/互联网' },
  { name: 'UI 设计师', category: 'IT/互联网' },
  { name: '运营', category: 'IT/互联网' },
  { name: '数据分析师', category: 'IT/互联网' },
  { name: '教师', category: '教育' },
  { name: '公务员', category: '公共' },
  { name: '医生', category: '医疗' },
  { name: '护士', category: '医疗' },
  { name: '律师', category: '法律' },
  { name: '会计师', category: '金融' },
  { name: '银行职员', category: '金融' },
  { name: '销售', category: '商业' },
  { name: '市场经理', category: '商业' },
  { name: 'HR', category: '商业' },
  { name: '行政', category: '商业' },
  { name: '工程师', category: '制造' },
  { name: '建筑设计师', category: '工程' },
  { name: '记者', category: '传媒' },
  { name: '编辑', category: '传媒' },
  { name: '设计师', category: '文化' },
  { name: '插画师', category: '文化' },
  { name: '摄影师', category: '文化' },
  { name: '导游', category: '服务' },
  { name: '厨师', category: '服务' },
  { name: '美容师', category: '服务' },
  { name: '健身教练', category: '服务' },
  { name: '司机', category: '物流' },
  { name: '快递员', category: '物流' },
  { name: '电商运营', category: '商业' },
  { name: '主播', category: '传媒' },
  { name: '自由职业', category: '其他' },
  { name: '学生', category: '其他' },
];

const INTERESTS: Array<{ name: string; category: string; sort: number }> = [
  { name: '篮球', category: '运动', sort: 1 },
  { name: '足球', category: '运动', sort: 2 },
  { name: '跑步', category: '运动', sort: 3 },
  { name: '游泳', category: '运动', sort: 4 },
  { name: '瑜伽', category: '运动', sort: 5 },
  { name: '健身', category: '运动', sort: 6 },
  { name: '羽毛球', category: '运动', sort: 7 },
  { name: '网球', category: '运动', sort: 8 },
  { name: '电影', category: '影视', sort: 20 },
  { name: '追剧', category: '影视', sort: 21 },
  { name: '纪录片', category: '影视', sort: 22 },
  { name: '音乐', category: '音乐', sort: 30 },
  { name: '唱歌', category: '音乐', sort: 31 },
  { name: '乐器', category: '音乐', sort: 32 },
  { name: '阅读', category: '文艺', sort: 40 },
  { name: '写作', category: '文艺', sort: 41 },
  { name: '摄影', category: '文艺', sort: 42 },
  { name: '绘画', category: '文艺', sort: 43 },
  { name: '旅行', category: '户外', sort: 50 },
  { name: '露营', category: '户外', sort: 51 },
  { name: '徒步', category: '户外', sort: 52 },
  { name: '骑行', category: '户外', sort: 53 },
  { name: '登山', category: '户外', sort: 54 },
  { name: '美食', category: '生活', sort: 60 },
  { name: '烹饪', category: '生活', sort: 61 },
  { name: '咖啡', category: '生活', sort: 62 },
  { name: '茶道', category: '生活', sort: 63 },
  { name: '桌游', category: '娱乐', sort: 70 },
  { name: '剧本杀', category: '娱乐', sort: 71 },
  { name: '密室', category: '娱乐', sort: 72 },
  { name: '游戏', category: '娱乐', sort: 73 },
  { name: '宠物', category: '生活', sort: 64 },
  { name: '园艺', category: '生活', sort: 65 },
  { name: '收藏', category: '文艺', sort: 44 },
  { name: '舞蹈', category: '运动', sort: 9 },
  { name: '滑雪', category: '户外', sort: 55 },
  { name: '冲浪', category: '户外', sort: 56 },
];

async function main() {
  console.log('🌱 Start seeding...');

  // 1) 字典数据
  for (const c of CITIES) {
    await prisma.city.upsert({
      where: { name: c.name },
      update: c,
      create: c,
    });
  }
  for (const o of OCCUPATIONS) {
    await prisma.occupation.upsert({
      where: { name: o.name },
      update: o,
      create: o,
    });
  }
  for (const t of INTERESTS) {
    await prisma.interestTag.upsert({
      where: { name: t.name },
      update: t,
      create: t,
    });
  }
  console.log(`  ✓ Cities: ${CITIES.length}, Occupations: ${OCCUPATIONS.length}, Interests: ${INTERESTS.length}`);

  // 2) 管理员
  const admins = [
    { username: 'admin', password: 'Admin@123', role: 'super_admin' },
    { username: 'operator1', password: 'Operator@123', role: 'operator' },
  ];
  for (const a of admins) {
    const passwordHash = await bcrypt.hash(a.password, 12);
    await prisma.admin.upsert({
      where: { username: a.username },
      update: { role: a.role, passwordHash },
      create: {
        username: a.username,
        passwordHash,
        role: a.role,
        status: 1,
      },
    });
  }
  console.log(`  ✓ Admins: ${admins.length}`);

  // 3) 测试介绍人（3 个）
  const referrerSpecs = [
    { phone: '13900000001', nickname: '王大姐', inviteCode: '100001' },
    { phone: '13900000002', nickname: '李姐',   inviteCode: '100002' },
    { phone: '13900000003', nickname: '张哥',   inviteCode: '100003' },
  ];
  const passwordHash = await bcrypt.hash('Pass1234', 12);
  const cities = await prisma.city.findMany();
  const occs = await prisma.occupation.findMany();
  const tags = await prisma.interestTag.findMany();

  const referrers = [];
  for (const r of referrerSpecs) {
    const u = await prisma.user.upsert({
      where: { phone: r.phone },
      update: { nickname: r.nickname, inviteCode: r.inviteCode, profileStatus: 2 },
      create: {
        phone: r.phone,
        passwordHash,
        nickname: r.nickname,
        inviteCode: r.inviteCode,
        status: 1,
        profileStatus: 2,
        gender: r.nickname.includes('哥') ? 1 : 2,
        age: 30,
        cityId: cities[0].id,
        occupationId: occs[0].id,
      },
    });
    referrers.push(u);
  }

  // 给介绍人补完整资料（兴趣 + 需求）
  for (const u of referrers) {
    await prisma.userInterest.deleteMany({ where: { userId: u.id } });
    await prisma.userInterest.createMany({
      data: tags.slice(0, 4).map((t) => ({ userId: u.id, interestTagId: t.id })),
    });
    await prisma.userRequirement.upsert({
      where: { userId: u.id },
      update: {
        targetGender: u.gender === 1 ? 2 : 1,
        targetAgeMin: 24,
        targetAgeMax: 32,
        selfDesc: '希望认识有趣的你',
      },
      create: {
        userId: u.id,
        targetGender: u.gender === 1 ? 2 : 1,
        targetAgeMin: 24,
        targetAgeMax: 32,
        selfDesc: '希望认识有趣的你',
      },
    });
  }
  console.log(`  ✓ Referrers: ${referrers.length} (codes: ${referrers.map(r => r.inviteCode).join(', ')})`);

  // 4) 被介绍人（6 个，分布不同状态）
  const inviteeSpecs = [
    { phone: '13800000001', nickname: '小明',  gender: 1, age: 28, refIdx: 0, profileStatus: 2 },
    { phone: '13800000002', nickname: '小红',  gender: 2, age: 26, refIdx: 0, profileStatus: 2 },
    { phone: '13800000003', nickname: '阿强',  gender: 1, age: 30, refIdx: 1, profileStatus: 1 }, // pending
    { phone: '13800000004', nickname: '阿丽',  gender: 2, age: 27, refIdx: 1, profileStatus: 1 }, // pending
    { phone: '13800000005', nickname: '小伟',  gender: 1, age: 29, refIdx: 2, profileStatus: 3 }, // rejected
    { phone: '13800000006', nickname: '小芳',  gender: 2, age: 25, refIdx: 2, profileStatus: 2 },
  ];

  const invitees = [];
  for (const s of inviteeSpecs) {
    const u = await prisma.user.upsert({
      where: { phone: s.phone },
      update: {
        nickname: s.nickname,
        gender: s.gender,
        age: s.age,
        profileStatus: s.profileStatus,
        referrerId: referrers[s.refIdx].id,
        status: 1,
      },
      create: {
        phone: s.phone,
        passwordHash,
        nickname: s.nickname,
        gender: s.gender,
        age: s.age,
        profileStatus: s.profileStatus,
        referrerId: referrers[s.refIdx].id,
        status: 1,
        inviteCode: String(200000 + parseInt(s.phone.slice(-4))),
      },
    });
    invitees.push(u);
  }
  console.log(`  ✓ Invitees: ${invitees.length}`);

  // 5) 审核通过的：补 interests + requirement
  for (const u of invitees.filter(i => i.profileStatus === 2)) {
    await prisma.userInterest.deleteMany({ where: { userId: u.id } });
    await prisma.userInterest.createMany({
      data: tags.slice(2, 6).map((t) => ({ userId: u.id, interestTagId: t.id })),
    });
    await prisma.userRequirement.upsert({
      where: { userId: u.id },
      update: {
        targetGender: u.gender === 1 ? 2 : 1,
        targetAgeMin: 24,
        targetAgeMax: 32,
        selfDesc: '想找一个三观合的人一起看世界',
      },
      create: {
        userId: u.id,
        targetGender: u.gender === 1 ? 2 : 1,
        targetAgeMin: 24,
        targetAgeMax: 32,
        selfDesc: '想找一个三观合的人一起看世界',
      },
    });
  }

  // 6) pending 的：插入 user_profiles_pending
  for (const u of invitees.filter(i => i.profileStatus === 1)) {
    await prisma.userProfilePending.deleteMany({ where: { userId: u.id, status: 1 } });
    await prisma.userProfilePending.create({
      data: {
        userId: u.id,
        payloadJson: {
          nickname: u.nickname,
          gender: u.gender,
          age: u.age,
          cityId: cities[0].id.toString(),
          height: 165,
          occupationId: occs[0].id.toString(),
          avatarOssKey: null,
          interestTagIds: tags.slice(1, 4).map(t => t.id.toString()),
          customInterests: ['露营', '剧本杀'],
          requirement: {
            targetGender: u.gender === 1 ? 2 : 1,
            targetAgeMin: 24,
            targetAgeMax: 32,
            targetCityId: cities[0].id.toString(),
            selfDesc: '热爱生活，希望遇到对的人',
          },
        },
        status: 1,
      },
    });
  }

  // 7) rejected 的：插入 user_profiles_pending (status=3)
  for (const u of invitees.filter(i => i.profileStatus === 3)) {
    await prisma.userProfilePending.deleteMany({ where: { userId: u.id } });
    await prisma.userProfilePending.create({
      data: {
        userId: u.id,
        payloadJson: {
          nickname: u.nickname,
          gender: u.gender,
          age: u.age,
          cityId: cities[0].id.toString(),
          height: 170,
          occupationId: occs[0].id.toString(),
          avatarOssKey: null,
          interestTagIds: tags.slice(0, 3).map(t => t.id.toString()),
          customInterests: [],
          requirement: {
            targetGender: u.gender === 1 ? 2 : 1,
            targetAgeMin: 25,
            targetAgeMax: 35,
            selfDesc: '性格开朗',
          },
        },
        status: 3,
        rejectReason: '头像不规范，请重新上传清晰本人照片',
        reviewedBy: (await prisma.admin.findFirst({ where: { role: 'operator' } }))?.id,
        reviewedAt: new Date(),
      },
    });
  }

  // 8) 示例牵线记录（2 条）
  const [m1UserA, m1UserB] = invitees.filter(i => i.profileStatus === 2).slice(0, 2);
  if (m1UserA && m1UserB) {
    await prisma.matchRecord.deleteMany({
      where: {
        OR: [
          { userAId: m1UserA.id, userBId: m1UserB.id },
          { userAId: m1UserB.id, userBId: m1UserA.id },
        ],
      },
    });
    await prisma.matchRecord.create({
      data: {
        userAId: m1UserA.id,
        userBId: m1UserB.id,
        referrerId: m1UserA.referrerId!,
        matchedAt: new Date(Date.now() - 7 * 24 * 3600 * 1000),
        note: '双方见面后感觉合适，进入深度了解',
        createdBy: (await prisma.admin.findFirst({ where: { role: 'operator' } }))!.id,
      },
    });
    const invitees2 = invitees.filter(i => i.profileStatus === 2);
    if (invitees2.length >= 4) {
      await prisma.matchRecord.create({
        data: {
          userAId: invitees2[2].id,
          userBId: invitees2[3].id,
          referrerId: invitees2[2].referrerId!,
          matchedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000),
          note: '第二次约会，准备确定关系',
          createdBy: (await prisma.admin.findFirst({ where: { role: 'super_admin' } }))!.id,
        },
      });
    }
  }

  // 9) 自定义兴趣示例
  const firstInv = invitees[0];
  if (firstInv) {
    await prisma.userCustomInterest.deleteMany({ where: { userId: firstInv.id } });
    await prisma.userCustomInterest.create({
      data: {
        userId: firstInv.id,
        tagText: '飞盘',
        promoted: 0,
      },
    });
  }

  console.log('🌱 Seed completed!');
  console.log('');
  console.log('   管理员账号：');
  console.log('     admin / Admin@123        (super_admin)');
  console.log('     operator1 / Operator@123 (operator)');
  console.log('');
  console.log('   测试介绍人邀请码：');
  referrers.forEach((r) => {
    console.log(`     ${r.phone} - ${r.nickname} - 邀请码 ${r.inviteCode}`);
  });
  console.log('');
  console.log('   测试被介绍人：13800000001~13800000006 密码 Pass1234');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });