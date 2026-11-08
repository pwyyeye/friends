<template>
  <router-view />
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useFeaturesStore } from '@/store/features';

const features = useFeaturesStore();

onMounted(() => {
  void features.load();
});
</script>
