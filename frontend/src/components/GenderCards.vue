<template>
  <div class="gender-cards" role="group" aria-label="孩子性别">
    <button
      v-for="card in cards"
      :key="card.value"
      type="button"
      class="gender-card"
      :class="[card.theme, { selected: modelValue === card.value }]"
      :aria-label="card.label + '，' + card.goal"
      :aria-pressed="modelValue === card.value"
      @click="select(card.value)"
    >
      <img :src="card.image" alt="" width="426" height="456" />
      <span class="gender-card-info">
        <span class="gender-card-copy">
          <strong>{{ card.label }}</strong>
          <span>{{ card.goal }}</span>
        </span>
        <span class="gender-card-arrow" aria-hidden="true">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.4"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path v-if="modelValue === card.value" d="m5 12 4 4 10-10" />
            <path v-else d="M5 12h14m-6-6 6 6-6 6" />
          </svg>
        </span>
      </span>
    </button>
  </div>
</template>
<script setup lang="ts">
defineProps<{ modelValue?: number | null }>();
const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void;
  (e: 'continue'): void;
}>();
const cards = [
  {
    value: 1,
    label: '男孩',
    goal: '找儿媳',
    theme: 'boy',
    image: '/images/registration/boy.webp',
  },
  {
    value: 2,
    label: '女孩',
    goal: '找女婿',
    theme: 'girl',
    image: '/images/registration/girl.webp',
  },
];
function select(value: number) {
  emit('update:modelValue', value);
  emit('continue');
}
</script>
<style scoped>
.gender-cards {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
  width: 100%;
  max-width: 560px;
  margin: 0 auto;
}
.gender-card {
  --gender-color: #287fde;
  position: relative;
  display: block;
  width: 100%;
  padding: 0;
  border: 2px solid transparent;
  border-radius: 26px;
  background: transparent;
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.gender-card.girl {
  --gender-color: #ed476b;
}
.gender-card img {
  display: block;
  width: 100%;
  height: auto;
  aspect-ratio: 426 / 456;
  object-fit: cover;
  border-radius: 24px 24px 0 0;
}
.gender-card-info {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 16px;
  margin-top: -12px;
  min-height: 106px;
  background: #fff;
  border-radius: 24px;
  box-shadow: 0 12px 26px rgba(74, 145, 230, 0.08);
}
.girl .gender-card-info {
  box-shadow: 0 12px 26px rgba(237, 71, 107, 0.08);
}
.gender-card-copy {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}
.gender-card-copy strong {
  color: var(--gender-color);
  font-size: 30px;
  font-weight: 800;
  line-height: 1.4;
}
.gender-card-copy > span {
  color: #737373;
  font-size: 22px;
  white-space: nowrap;
}
.gender-card-arrow {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: var(--gender-color);
  color: #fff;
}
.gender-card-arrow svg {
  width: 24px;
  height: 24px;
}
.gender-card.selected {
  border-color: var(--gender-color);
}
.gender-card:focus-visible {
  outline: 3px solid var(--gender-color);
  outline-offset: 5px;
}
@media (max-width: 380px) {
  .gender-cards {
    gap: 16px;
  }
  .gender-card-info {
    padding: 12px;
    min-height: 96px;
    gap: 4px;
  }
  .gender-card-copy strong {
    font-size: 26px;
  }
  .gender-card-copy > span {
    font-size: 20px;
  }
  .gender-card-arrow {
    width: 30px;
    height: 30px;
  }
}
@media (prefers-reduced-motion: no-preference) {
  .gender-card {
    animation: card-arrive 0.35s ease-out both;
  }
  .gender-card.girl {
    animation-delay: 0.06s;
  }
  @keyframes card-arrive {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
}
</style>
