import { defineStore } from 'pinia';
import { get } from '@/api/request';

export interface FeatureFlags {
  messages: boolean;
  verification: boolean;
  accelerate: boolean;
  favorite: boolean;
  unlock: boolean;
  likes: boolean;
}

export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  messages: true,
  verification: true,
  accelerate: true,
  favorite: true,
  unlock: true,
  likes: true,
};

let request: Promise<FeatureFlags> | null = null;

export const useFeaturesStore = defineStore('features', {
  state: () => ({
    flags: { ...DEFAULT_FEATURE_FLAGS },
    loadedAt: 0,
    loading: false,
  }),
  getters: {
    isEnabled: (state) => (key: keyof FeatureFlags) => state.flags[key],
  },
  actions: {
    async load(force = false) {
      if (!force && this.loadedAt && Date.now() - this.loadedAt < 60_000) {
        return this.flags;
      }
      if (request) return request;
      this.loading = true;
      request = get<FeatureFlags>('/api/v1/features')
        .then((flags) => {
          this.flags = { ...DEFAULT_FEATURE_FLAGS, ...flags };
          this.loadedAt = Date.now();
          return this.flags;
        })
        .catch(() => {
          this.flags = { ...DEFAULT_FEATURE_FLAGS };
          this.loadedAt = Date.now();
          return this.flags;
        })
        .finally(() => {
          this.loading = false;
          request = null;
        });
      return request;
    },
  },
});
