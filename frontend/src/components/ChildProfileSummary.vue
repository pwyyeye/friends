<template>
  <div v-if="profile" class="child-summary">
    <h2 class="section-title">
      {{ profile.nickname || "孩子资料" }}
      <small class="muted">{{
        profile.gender === 1 ? "男" : profile.gender === 2 ? "女" : "未填性别"
      }}</small>
    </h2>
    <div class="summary-grid">
      <div v-for="[label, value] in rows" :key="label">
        <span class="muted">{{ label }}</span
        ><strong>{{ value || "未填写" }}</strong>
      </div>
    </div>
    <h3 class="section-title--sm">性格与优势</h3>
    <p>
      {{ [...profile.traits, ...profile.advantages].join(" · ") || "未填写" }}
    </p>
    <h3 class="section-title--sm">孩子介绍</h3>
    <p class="preserve-lines">{{ profile.introduction || "未填写" }}</p>
    <h3 class="section-title--sm">择偶期待</h3>
    <p>
      出生年份：{{
        range(
          profile.preference?.birthYearMin,
          profile.preference?.birthYearMax,
          "年",
        )
      }}
    </p>
    <p>
      身高：{{
        range(
          profile.preference?.heightMin,
          profile.preference?.heightMax,
          "厘米",
        )
      }}
    </p>
    <p>
      学历：{{ profile.preference?.educationLabel || "不限" }}　城市：{{
        profile.preference?.cityName || "不限"
      }}
    </p>
    <p>{{ profile.preference?.tags?.join(" · ") || "未设置标签" }}</p>
    <div class="photo-grid">
      <img
        v-for="photo in profile.photos"
        :key="photo.ossKey"
        :src="photo.url"
        alt="孩子照片"
        @click="showImagePreview(profile.photos?.map((p) => p.url) || [])"
      />
    </div>
    <p v-if="!profile.photos?.length" class="muted">尚未添加孩子照片</p>
  </div>
</template>
<script setup lang="ts">
import { computed } from "vue";
import { showImagePreview } from "vant";
import { ChildFields } from "@/types/profile";
const props = defineProps<{ profile: ChildFields | null }>();
const rows = computed<Array<[string, string | number | null | undefined]>>(
  () => {
    const p = props.profile!;
    return [
      [
        "登记人身份",
        p.relationship === "father"
          ? "爸爸"
          : p.relationship === "mother"
            ? "妈妈"
            : null,
      ],
      ["出生日期", p.birthDate],
      ["年龄", p.age == null ? null : `${p.age} 岁`],
      ["身高", p.height ? `${p.height} 厘米` : null],
      ["现居城市", p.cityName],
      ["学历", p.educationLabel],
      ["月收入", p.incomeLabel],
      ["职业", p.occupation],
      ["婚姻状况", p.maritalStatusLabel],
      ["籍贯", p.hometownCityName],
      ["工作城市", p.workCityName],
      ["购车情况", p.carStatusLabel],
    ];
  },
);
function range(min?: number | null, max?: number | null, unit = "") {
  return min == null && max == null
    ? "不限"
    : min != null && max != null
      ? `${min}–${max} ${unit}`
      : min != null
        ? `${min} ${unit}及以上`
        : `${max} ${unit}及以下`;
}
</script>
