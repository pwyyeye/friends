<template>
  <header class="registration-header">
    <button
      type="button"
      class="registration-back"
      :disabled="disabled"
      aria-label="返回上一页"
      @click="emit('back')"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="m15 5-7 7 7 7" />
      </svg>
    </button>
    <h1>{{ title }}</h1>
    <span class="registration-header-spacer" aria-hidden="true"></span>
  </header>
</template>
<script setup lang="ts">
defineProps<{ title: string; disabled?: boolean }>();
const emit = defineEmits<{ (e: 'back'): void }>();
</script>
