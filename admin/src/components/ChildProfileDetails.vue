<template>
  <div v-if="payload">
    <el-descriptions :column="2" border
      ><el-descriptions-item
        v-for="row in rows"
        :key="row[0]"
        :label="row[0]"
        >{{ row[1] ?? "未填写" }}</el-descriptions-item
      ></el-descriptions
    >
    <h3>性格与优势</h3>
    <p>
      {{
        [...(payload.traits || []), ...(payload.advantages || [])].join(
          " · ",
        ) || "未填写"
      }}
    </p>
    <h3>孩子介绍</h3>
    <p class="intro">{{ payload.introduction || "未填写" }}</p>
    <h3>择偶期待</h3>
    <el-descriptions :column="2" border
      ><el-descriptions-item label="出生年份">{{
        range(
          payload.preference?.birthYearMin,
          payload.preference?.birthYearMax,
        )
      }}</el-descriptions-item
      ><el-descriptions-item label="身高 / 厘米">{{
        range(payload.preference?.heightMin, payload.preference?.heightMax)
      }}</el-descriptions-item
      ><el-descriptions-item label="最低学历">{{
        payload.preference?.educationLabel || "不限"
      }}</el-descriptions-item
      ><el-descriptions-item label="期望城市">{{
        payload.preference?.cityName || "不限"
      }}</el-descriptions-item
      ><el-descriptions-item label="看重的条件">{{
        payload.preference?.tags?.join(" · ") || "不限"
      }}</el-descriptions-item></el-descriptions
    >
    <h3>孩子照片</h3>
    <div class="photos">
      <el-image
        v-for="(p, i) in payload.photos"
        :key="p.ossKey"
        :src="p.url"
        :preview-src-list="payload.photos.map((p: any) => p.url)"
        :initial-index="i"
        preview-teleported
        fit="cover"
      />
    </div>
    <p v-if="!payload.photos?.length" class="muted">未上传照片</p>
  </div>
</template>
<script setup lang="ts">
import { computed } from "vue";
const props = defineProps<{ payload: any }>();
const rows = computed<Array<[string, string | number | null | undefined]>>(
  () => {
    const p = props.payload;
    return [
      ["孩子称呼", p.nickname],
      [
        "登记父母身份",
        p.relationship === "father"
          ? "爸爸"
          : p.relationship === "mother"
            ? "妈妈"
            : null,
      ],
      ["性别", p.gender === 1 ? "男" : p.gender === 2 ? "女" : null],
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
function range(min?: number | null, max?: number | null) {
  return min == null && max == null
    ? "不限"
    : `${min ?? "不限"} 至 ${max ?? "不限"}`;
}
</script>
<style scoped>
.intro {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.photos {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}
.photos :deep(.el-image) {
  width: 100%;
  height: 200px;
  border-radius: 8px;
}
</style>
