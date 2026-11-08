export interface Preference {
  birthYearMin?: number | null;
  birthYearMax?: number | null;
  heightMin?: number | null;
  heightMax?: number | null;
  educationMin?: string | null;
  cityId?: number | null;
  tags: string[];
  cityName?: string;
  educationLabel?: string;
}
export interface ChildFields {
  relationship?: string | null;
  nickname?: string | null;
  gender?: number | null;
  birthDate?: string | null;
  height?: number | null;
  cityId?: number | null;
  education?: string | null;
  income?: string | null;
  occupation?: string | null;
  maritalStatus?: string | null;
  hometownCityId?: number | null;
  workCityId?: number | null;
  carStatus?: string | null;
  traits: string[];
  advantages: string[];
  introduction?: string | null;
  photoOssKeys: string[];
  preference: Preference;
  age?: number;
  cityName?: string;
  hometownCityName?: string;
  workCityName?: string;
  educationLabel?: string;
  incomeLabel?: string;
  maritalStatusLabel?: string;
  carStatusLabel?: string;
  photos?: { ossKey: string; url: string }[];
}
export interface ChildRecord {
  id: string;
  profileNumber: string;
  draftRevision: number;
  currentStep?: string | null;
  submittedRevision: number | null;
  approvedRevision: number | null;
  profileStatus: number;
  draft: ChildFields;
  approved: ChildFields | null;
  latestSubmission: {
    id: string;
    status: number;
    rejectReason: string | null;
    payload: ChildFields;
    createdAt: string;
  } | null;
}
export interface Options {
  education: { value: string; label: string }[];
  income: { value: string; label: string }[];
  maritalStatus: { value: string; label: string }[];
  carStatus: { value: string; label: string }[];
  traits: string[];
  advantages: string[];
  expectations: string[];
  consentVersion: string;
}
export interface City {
  id: string;
  name: string;
  province: string;
}
export const emptyFields = (): ChildFields => ({
  traits: [],
  advantages: [],
  photoOssKeys: [],
  preference: { tags: [] },
});
const keys = [
  'relationship',
  'nickname',
  'gender',
  'birthDate',
  'height',
  'cityId',
  'education',
  'income',
  'occupation',
  'maritalStatus',
  'hometownCityId',
  'workCityId',
  'carStatus',
  'traits',
  'advantages',
  'introduction',
  'photoOssKeys',
] as const;
export function rawFields(p: Partial<ChildFields>): ChildFields {
  const result: any = emptyFields();
  for (const key of keys)
    if (
      p[key] !== undefined &&
      (!Array.isArray(result[key]) || p[key] !== null)
    )
      result[key] = p[key];
  for (const key of [
    'birthYearMin',
    'birthYearMax',
    'heightMin',
    'heightMax',
    'educationMin',
    'cityId',
    'tags',
  ] as const)
    if (
      p.preference?.[key] !== undefined &&
      (key !== 'tags' || p.preference[key] !== null)
    )
      result.preference[key] = p.preference[key];
  return JSON.parse(JSON.stringify(result));
}
export const profileStatuses = [
  '草稿未提交',
  '等待审核',
  '审核通过',
  '需要修改',
];
export function validateBasic(p: ChildFields): string {
  if (
    !p.relationship ||
    !p.gender ||
    !p.birthDate ||
    !p.height ||
    !p.cityId ||
    !p.education ||
    !p.income
  )
    return '请完整填写标有 * 的基础资料';
  const dateError = validateBirthDate(p.birthDate);
  if (dateError) return dateError;
  if (!Number.isInteger(p.height) || p.height < 100 || p.height > 230)
    return '身高需为 100–230 之间的整数，单位是厘米';
  return '';
}
export function validateBirthDate(birthDate?: string | null): string {
  if (!birthDate) return '请填写孩子的出生日期';
  const today = new Date().toLocaleDateString('sv-SE', {
    timeZone: 'Asia/Shanghai',
  });
  const age =
    Number(today.slice(0, 4)) -
    Number(birthDate.slice(0, 4)) -
    (today.slice(5) < birthDate.slice(5) ? 1 : 0);
  const date = new Date(birthDate + 'T00:00:00Z');
  if (age > 60) return '孩子年龄需在 18–60 周岁之间';
  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== birthDate ||
    age < 18 ||
    Number(birthDate.slice(0, 4)) < 1900
  )
    return '请填写真实出生日期，孩子须年满 18 周岁';
  return '';
}
export const registrationKey = 'friends_parent_registration';
