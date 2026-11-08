<template>
  <article class="recommendation-card" :class="{ 'is-boy': profile.gender === 1, 'is-link': !expanded }" @click="!expanded && emit('view', profile.id)">
    <div class="recommendation-title">
      <h3>{{ profile.gender === 1 ? '男' : '女' }}<span> · </span>{{ profile.birthYear.slice(-2) }}年</h3>
      <span class="review-badge"><span aria-hidden="true">✓</span> 资料已审核</span>
    </div>
    <div class="recommendation-body">
      <dl>
        <div><dt>现居</dt><dd>{{ profile.cityName || '未填写' }}</dd></div>
        <div><dt>身高</dt><dd>{{ profile.height }}<small>cm</small></dd></div>
        <div><dt>学历</dt><dd>{{ profile.educationLabel || '未填写' }}</dd></div>
        <div><dt>职业</dt><dd>{{ profile.occupation || '未填写' }}</dd></div>
      </dl>
      <div class="recommendation-photo">
        <img :src="profile.photoUrl || `/images/registration/${profile.gender === 1 ? 'boy' : 'girl'}.webp`" :class="{ blurred: !!profile.photoUrl }" :alt="profile.photoUrl ? '孩子照片模糊预览' : ''" />
        <span>{{ profile.photoUrl ? '照片保护中' : '暂未上传照片' }}</span>
      </div>
    </div>
    <p class="recommendation-intro" :class="{ expanded }">{{ profile.introduction || '期待遇到合适的人，更多情况可由工作人员协助了解' }}</p>
    <div v-if="profile.traits.length || profile.advantages.length" class="recommendation-tags">
      <span v-for="tag in [...profile.traits, ...profile.advantages].slice(0, 4)" :key="tag">{{ tag }}</span>
    </div>
    <div v-if="!expanded" class="recommendation-footer">
      <span>{{ profile.profileNumber }}</span>
      <button type="button" :aria-label="`查看${profile.profileNumber}资料`" @click.stop="emit('view', profile.id)">查看资料 <span aria-hidden="true">→</span></button>
    </div>
  </article>
</template>
<script setup lang="ts">
import { Recommendation } from '@/types/recommendation';
defineProps<{ profile: Recommendation; expanded?: boolean }>();
const emit = defineEmits<{ (e: 'view', id: string): void }>();
</script>
<style scoped>
.recommendation-card { background:#fff; border-radius:24px; padding:24px 20px 18px; box-shadow:0 4px 18px #26263404; }
.recommendation-card.is-link { cursor:pointer; }
.recommendation-title { display:flex; flex-wrap:wrap; align-items:center; gap:8px 12px; margin-bottom:20px; }
.recommendation-title h3 { color:#fa5266; font-size:32px; font-weight:800; margin:0; line-height:1.3; }
.recommendation-title h3 > span { color:#f7adb9; }
.is-boy .recommendation-title h3 { color:#287fde; }
.review-badge { display:inline-flex; align-items:center; gap:4px; background:#fff3d9; color:#946113; font-size:15px; font-weight:600; padding:4px 8px; border-radius:8px; }
.recommendation-body { display:grid; grid-template-columns:minmax(0,1fr) 96px; gap:14px; align-items:center; }
dl { margin:0; min-width:0; font-size:20px; font-weight:600; }
dl > div { display:flex; gap:10px; margin-bottom:8px; line-height:1.6; }
dt { color:#767676; flex-shrink:0; }
dd { margin:0; overflow-wrap:anywhere; }
dd small { font-size:17px; margin-left:2px; }
.recommendation-photo { position:relative; align-self:stretch; border-radius:14px; overflow:hidden; background:#fff0f4; min-height:132px; }
.recommendation-photo img { width:100%; height:100%; min-height:132px; object-fit:cover; position:absolute; }
.recommendation-photo .blurred { filter:blur(8px); transform:scale(1.15); }
.recommendation-photo > span { position:absolute; bottom:0; width:100%; background:#ffffffdc; color:#656565; text-align:center; font-size:13px; padding:5px 1px; }
.recommendation-intro { font-size:20px; font-weight:600; line-height:1.65; margin:18px 0 12px; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; overflow-wrap:anywhere; }
.recommendation-intro.expanded { display:block; white-space:pre-wrap; }
.recommendation-tags { display:flex; flex-wrap:wrap; gap:8px; }
.recommendation-tags > span { border-radius:6px; padding:3px 8px; background:#fff1f4; color:#a83e52; font-size:16px; }
.recommendation-footer { display:flex; justify-content:space-between; align-items:center; gap:12px; border-top:1px solid #f0f0f2; margin-top:16px; padding-top:12px; }
.recommendation-footer > span { font-size:15px; color:#767676; }
.recommendation-footer button { min-height:48px; border:0; border-radius:999px; padding:8px 18px; color:#fff; background:#ff5266; font:inherit; font-size:18px; font-weight:600; cursor:pointer; }
@media(min-width:600px) { .recommendation-card { padding:28px; } .recommendation-body { grid-template-columns:minmax(0,1fr) 120px; } }
@media(max-width:350px) { .recommendation-card { padding:22px 16px 16px; } .recommendation-title h3 { font-size:28px; } .recommendation-body { grid-template-columns:minmax(0,1fr) 80px; gap:10px; } dl { font-size:18px; } dl > div { gap:8px; } }
</style>
