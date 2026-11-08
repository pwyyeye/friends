import { ChildFields, validateBirthDate } from './profile';

export const profileSteps = [
  {
    id: 'gender',
    title: '您家孩子性别是？',
    label: '孩子性别',
    group: '孩子基本情况',
    hint: '',
    required: true,
  },
  {
    id: 'education',
    title: '孩子学历',
    label: '孩子学历',
    group: '孩子基本情况',
    hint: '',
    required: true,
  },
  {
    id: 'income',
    title: '孩子月收入',
    label: '孩子收入',
    group: '孩子基本情况',
    hint: '',
    required: true,
  },
  {
    id: 'city',
    title: '孩子现居地',
    label: '现居城市',
    group: '孩子基本情况',
    hint: '',
    required: true,
  },
  {
    id: 'relationship',
    title: '您是孩子的？',
    label: '您的身份',
    group: '孩子基本情况',
    hint: '',
    required: true,
  },
  {
    id: 'birthDate',
    title: '孩子出生日期',
    label: '出生日期',
    group: '孩子基本情况',
    hint: '请按年、月、日填写，孩子须年满 18 周岁',
    required: true,
  },
  {
    id: 'height',
    title: '孩子身高',
    label: '孩子身高',
    group: '孩子基本情况',
    hint: '',
    required: true,
  },
  {
    id: 'nickname',
    title: '孩子称呼',
    label: '孩子称呼',
    group: '补充孩子资料',
    hint: '可以填昵称，不必填写真实姓名',
    required: false,
  },
  {
    id: 'occupation',
    title: '孩子职业',
    label: '孩子职业',
    group: '补充孩子资料',
    hint: '',
    required: false,
  },
  {
    id: 'maritalStatus',
    title: '孩子婚姻状况',
    label: '婚姻状况',
    group: '补充孩子资料',
    hint: '',
    required: false,
  },
  {
    id: 'hometown',
    title: '孩子籍贯',
    label: '孩子籍贯',
    group: '补充孩子资料',
    hint: '',
    required: false,
  },
  {
    id: 'workCity',
    title: '孩子工作地',
    label: '工作城市',
    group: '补充孩子资料',
    hint: '',
    required: false,
  },
  {
    id: 'car',
    title: '孩子购车情况',
    label: '购车情况',
    group: '补充孩子资料',
    hint: '',
    required: false,
  },
  {
    id: 'traits',
    title: '您家孩子的特点',
    label: '孩子性格',
    group: '补充孩子资料',
    hint: '点击选择最符合的两个',
    required: false,
  },
  {
    id: 'advantages',
    title: '您家孩子的优势',
    label: '孩子优势',
    group: '补充孩子资料',
    hint: '点击选择最符合的两个',
    required: false,
  },
  {
    id: 'introduction',
    title: '孩子介绍',
    label: '孩子介绍',
    group: '补充孩子资料',
    hint: '',
    required: false,
  },
  {
    id: 'photos',
    title: '孩子照片',
    label: '孩子照片',
    group: '补充孩子资料',
    hint: '请先征得孩子同意，最多上传 9 张',
    required: false,
  },
  {
    id: 'targetHeight',
    title: '身高要求',
    label: '期望身高',
    group: '孩子择偶期待',
    hint: '请选择身高范围，也可以选择不限',
    required: false,
  },
  {
    id: 'targetBirth',
    title: '年份要求',
    label: '期望出生年份',
    group: '孩子择偶期待',
    hint: '',
    required: false,
  },
  {
    id: 'targetEducation',
    title: '学历要求',
    label: '期望学历',
    group: '孩子择偶期待',
    hint: '',
    required: false,
  },
  {
    id: 'targetCity',
    title: '现居地要求',
    label: '期望城市',
    group: '孩子择偶期待',
    hint: '',
    required: false,
  },
  {
    id: 'expectations',
    title: '您看重对方哪些条件',
    label: '看重的条件',
    group: '孩子择偶期待',
    hint: '最多选 2 项，请与孩子商量后选择',
    required: false,
  },
  {
    id: 'review',
    title: '确认孩子相亲资料',
    label: '核对并提交',
    group: '核对提交',
    hint: '',
    required: false,
  },
] as const;
export type ProfileStepId = (typeof profileSteps)[number]['id'];
export function stepIndex(id?: string | null) {
  return profileSteps.findIndex((s) => s.id === id);
}
export function validateStep(id: ProfileStepId, p: ChildFields): string {
  const required: Partial<Record<ProfileStepId, keyof ChildFields>> = {
    gender: 'gender',
    education: 'education',
    income: 'income',
    city: 'cityId',
    relationship: 'relationship',
    birthDate: 'birthDate',
    height: 'height',
  };
  const field = required[id];
  if (field && !p[field]) return '请先填写这一项，再继续';
  if (id === 'birthDate') return validateBirthDate(p.birthDate);
  if (
    id === 'height' &&
    (!Number.isInteger(p.height) || p.height! < 100 || p.height! > 230)
  )
    return '身高需为 100–230 之间的整数，单位是厘米';
  const ranges =
    id === 'targetHeight'
      ? [p.preference.heightMin, p.preference.heightMax]
      : id === 'targetBirth'
        ? [p.preference.birthYearMin, p.preference.birthYearMax]
        : [];
  if (ranges.length) {
    const min = id === 'targetHeight' ? 100 : new Date().getFullYear() - 60;
    const max = id === 'targetHeight' ? 230 : new Date().getFullYear() - 18;
    if (
      ranges.some(
        (x) => x != null && (!Number.isInteger(x) || x < min || x > max),
      )
    )
      return `请填写 ${min}–${max} 之间的整数，或留空表示不限`;
    if (ranges[0] != null && ranges[1] != null && ranges[0] > ranges[1])
      return '下限不能大于上限';
  }
  return '';
}
export function firstMissingStep(p: ChildFields) {
  const missing = profileSteps.findIndex(
    (s) => s.required && validateStep(s.id, p),
  );
  return missing >= 0 ? missing : profileSteps.length - 1;
}
