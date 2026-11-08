import { ValidationError } from 'class-validator';

const labels: Record<string, string> = {
  phone: '手机号', password: '密码', nickname: '称呼', termsAccepted: '用户协议',
  inviteCode: '邀请码', gender: '孩子性别', relationship: '您与孩子的关系',
  birthDate: '孩子出生日期', height: '孩子身高', cityId: '城市',
  hometownCityId: '籍贯城市', workCityId: '工作城市', occupation: '孩子职业',
  education: '孩子学历', income: '孩子收入', maritalStatus: '婚姻状况',
  carStatus: '购车情况', traits: '孩子特点', advantages: '孩子优势',
  introduction: '孩子介绍', photoOssKeys: '孩子照片', tags: '看重的条件',
  birthYearMin: '最早出生年份', birthYearMax: '最晚出生年份',
  heightMin: '最低身高', heightMax: '最高身高', educationMin: '学历要求',
  currentStep: '填写位置', expectedRevision: '草稿版本', childConsent: '孩子知情同意',
  consentVersion: '协议版本', reason: '修改建议', payload: '孩子资料',
};

export function validationMessages(errors: ValidationError[]): string[] {
  return errors.flatMap(error => {
    const label = labels[error.property] || '填写内容';
    const messages = Object.entries(error.constraints || {}).map(([rule, message]) => {
      if (/[\u4e00-\u9fff]/.test(message)) return message;
      const limit = message.match(/\d+(?:\.\d+)?(?=\D*$)/)?.[0];
      switch (rule) {
        case 'min': return `${label}不能小于 ${limit || '规定下限'}`;
        case 'max': return `${label}不能大于 ${limit || '规定上限'}`;
        case 'minLength': return `${label}至少需要 ${limit || '规定数量'} 位`;
        case 'maxLength': return `${label}不能超过 ${limit || '规定数量'} 字符`;
        case 'isInt': return `${label}请选择整数`;
        case 'isMobilePhone': return '请输入正确的 11 位手机号';
        case 'arrayMaxSize': return `${label}最多选择 ${limit || '规定数量'} 项`;
        case 'arrayUnique': return `${label}不能重复选择`;
        case 'isIn': return `请为${label}选择有效选项`;
        case 'equals': return `请确认${label}`;
        default: return `请检查${label}是否填写正确`;
      }
    });
    return [...messages, ...validationMessages(error.children || [])];
  });
}
