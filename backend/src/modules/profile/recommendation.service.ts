import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { createHash } from 'node:crypto';
import { PrismaService } from '@/prisma/prisma.service';
import { BizException } from '@/common/exceptions';
import { BizCode } from '@/common/constants';
import { ProfileFieldsDto } from './profile.dto';
import { ProfileService } from './profile.service';
import { PROFILE_OPTIONS } from './profile.options';
import { RecommendationQueryDto } from './recommendation.dto';

@Injectable()
export class RecommendationService {
  constructor(private readonly prisma: PrismaService, private readonly profiles: ProfileService) {}

  private eligible(userId: bigint): Prisma.ChildProfileWhereInput {
    return {
      ownerAccountId: { not: userId }, profileStatus: 2,
      approvedPayload: { not: Prisma.DbNull }, matchmakingStatus: 'active',
      owner: { status: 1, cancelStatus: 0 },
    };
  }

  private score(candidate: ProfileFieldsDto, own: ProfileFieldsDto) {
    const pref = own.preference;
    if (!pref) return 0;
    let score = 0;
    if (pref.cityId && candidate.cityId === pref.cityId) score += 4;
    const year = Number(candidate.birthDate?.slice(0, 4));
    if ((pref.birthYearMin != null || pref.birthYearMax != null) && year >= (pref.birthYearMin ?? 1900) && year <= (pref.birthYearMax ?? 2100)) score += 2;
    if ((pref.heightMin != null || pref.heightMax != null) && (candidate.height ?? 0) >= (pref.heightMin ?? 100) && (candidate.height ?? 0) <= (pref.heightMax ?? 230)) score += 2;
    const education = PROFILE_OPTIONS.education.map(x => x.value);
    if (pref.educationMin && education.indexOf(candidate.education || '') >= education.indexOf(pref.educationMin)) score += 2;
    return score;
  }

  private async card(id: bigint, payload: unknown, expanded = false) {
    const p = await this.profiles.decorate(payload);
    if (!p) return null;
    // Recommendations expose only approved child summaries, never account or draft data.
    const summary = {
      id: String(id), profileNumber: `C${String(id).padStart(6, '0')}`,
      gender: p.gender, birthYear: p.birthDate?.slice(0, 4), age: p.age,
      height: p.height, cityId: p.cityId, cityName: p.cityName,
      educationLabel: p.educationLabel, occupation: p.occupation || '',
      traits: p.traits || [], advantages: p.advantages || [],
      introduction: (p.introduction || '').replace(/1[3-9]\d{9}/g, '手机号已隐藏'),
      photoUrl: p.photos[0]?.url || null,
    };
    if (!expanded) return summary;
    return {
      ...summary,
      relationshipLabel: p.relationship === 'father' ? '父亲' : p.relationship === 'mother' ? '母亲' : '家长',
      incomeLabel: p.incomeLabel, maritalStatusLabel: p.maritalStatusLabel,
      hometownCityName: p.hometownCityName, workCityName: p.workCityName,
      carStatusLabel: p.carStatusLabel,
      photoUrls: p.photos.map(photo => photo.url),
      preference: {
        birthYearMin: p.preference.birthYearMin ?? null, birthYearMax: p.preference.birthYearMax ?? null,
        heightMin: p.preference.heightMin ?? null, heightMax: p.preference.heightMax ?? null,
        educationLabel: p.preference.educationLabel, cityName: p.preference.cityName,
        tags: p.preference.tags || [],
      },
    };
  }

  async today(userId: bigint, query: RecommendationQueryDto) {
    const own = await this.profiles.owned(userId);
    const draft = (own?.draft || {}) as ProfileFieldsDto;
    const targetGender = query.gender ?? (draft.gender === 1 ? 2 : draft.gender === 2 ? 1 : 0);
    const filters: Prisma.ChildProfileWhereInput[] = [];
    if (targetGender) filters.push({ approvedPayload: { path: '$.gender', equals: targetGender } });
    if (query.cityId) filters.push({ approvedPayload: { path: '$.cityId', equals: query.cityId } });
    const keyword = query.keyword?.trim();
    if (keyword) filters.push({ OR: ['occupation', 'introduction'].map(field => ({ approvedPayload: { path: `$.${field}`, string_contains: keyword } })) });
    const day = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Shanghai' }).format(new Date());
    const [rows, total, matchCount] = await Promise.all([
      this.prisma.childProfile.findMany({
        where: { ...this.eligible(userId), AND: filters },
        select: { id: true, approvedPayload: true }, orderBy: { id: 'desc' }, take: 200,
      }),
      this.prisma.childProfile.count({ where: { ...this.eligible(userId), AND: filters } }),
      own ? this.prisma.matchRecord.count({ where: { OR: [{ profileAId: own.id }, { profileBId: own.id }] } }) : Promise.resolve(0),
    ]);
    const digest = (id: bigint) => createHash('sha256').update(`${day}:${userId}:${id}`).digest('hex');
    rows.sort((a, b) => this.score(b.approvedPayload as unknown as ProfileFieldsDto, draft) - this.score(a.approvedPayload as unknown as ProfileFieldsDto, draft) || digest(a.id).localeCompare(digest(b.id)));
    const items = (await Promise.all(rows.slice(0, 24).map(row => this.card(row.id, row.approvedPayload)))).filter(Boolean);
    return {
      date: day, targetGender, total, items,
      registration: { hasProfile: !!own, profileStatus: own?.profileStatus ?? 0, hasChanges: !!own && own.draftRevision !== own.submittedRevision },
      matchCount,
    };
  }

  async detail(userId: bigint, id: string) {
    if (!/^\d+$/.test(id)) throw new BizException(BizCode.PROFILE_NOT_FOUND, '这份资料暂不可查看', 404);
    const row = await this.prisma.childProfile.findFirst({ where: { ...this.eligible(userId), id: BigInt(id) }, select: { id: true, approvedPayload: true } });
    if (!row) throw new BizException(BizCode.PROFILE_NOT_FOUND, '这份资料暂不可查看', 404);
    return this.card(row.id, row.approvedPayload, true);
  }

  async cardsByIds(userId: bigint, ids: string[], expanded = false) {
    const uniqueIds = [...new Set(ids.filter(id => /^\d+$/.test(id)))].slice(0, 100);
    if (!uniqueIds.length) return [];
    const rows = await this.prisma.childProfile.findMany({
      where: { ...this.eligible(userId), id: { in: uniqueIds.map(id => BigInt(id)) } },
      select: { id: true, approvedPayload: true },
    });
    const rowsById = new Map(rows.map(row => [String(row.id), row]));
    const cards = await Promise.all(uniqueIds.map(async id => {
      const row = rowsById.get(id);
      if (!row) return null;
      const card = await this.card(row.id, row.approvedPayload, expanded);
      return card ? { ...card, id: String(row.id) } : null;
    }));
    return cards.filter(Boolean);
  }
}
