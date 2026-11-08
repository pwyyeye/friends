import { defineStore } from 'pinia';
import { ref, watch } from 'vue';
import { del, get, post, put } from '@/api/request';
import { useFeaturesStore } from '@/store/features';
import type {
  Recommendation,
  RecommendationDetail,
} from '@/types/recommendation';

export type SocialActivityKind = 'favorite' | 'view' | 'unlock';

interface SocialSnapshot {
  favorites: string[];
  views: string[];
  unlocks: string[];
  liked: string[];
  profiles: Record<string, Recommendation | RecommendationDetail>;
}

export interface SocialSummary {
  notificationEnabled: boolean;
  counts: {
    favorite: number;
    view: number;
    unlock: number;
    like: number;
    receivedFavorite: number;
    receivedView: number;
    receivedUnlock: number;
    receivedLike: number;
  };
  latest: {
    id: string;
    kind: SocialActivityKind | 'like';
    actorName: string;
    at: string;
  }[];
}

const STORAGE_KEY = 'friends_social_activity_v1';

function emptySnapshot(): SocialSnapshot {
  return {
    favorites: [],
    views: [],
    unlocks: [],
    liked: [],
    profiles: {},
  };
}

function readSnapshot(): SocialSnapshot {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptySnapshot();
    const parsed = JSON.parse(raw) as Partial<SocialSnapshot>;
    return {
      favorites: Array.isArray(parsed.favorites) ? parsed.favorites : [],
      views: Array.isArray(parsed.views) ? parsed.views : [],
      unlocks: Array.isArray(parsed.unlocks) ? parsed.unlocks : [],
      liked: Array.isArray(parsed.liked) ? parsed.liked : [],
      profiles:
        parsed.profiles && typeof parsed.profiles === 'object'
          ? parsed.profiles
          : {},
    };
  } catch {
    return emptySnapshot();
  }
}

function newestFirst(list: string[], id: string) {
  return [id, ...list.filter((item) => item !== id)].slice(0, 100);
}

export const useSocialStore = defineStore('social', () => {
  const features = useFeaturesStore();
  const snapshot = readSnapshot();
  const favorites = ref(snapshot.favorites);
  const views = ref(snapshot.views);
  const unlocks = ref(snapshot.unlocks);
  const liked = ref(snapshot.liked);
  const profiles = ref(snapshot.profiles);
  const summary = ref<SocialSummary | null>(null);
  const hydrated = ref(false);
  let hydrateRequest: Promise<void> | null = null;

  watch(
    [favorites, views, unlocks, liked, profiles],
    () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          favorites: favorites.value,
          views: views.value,
          unlocks: unlocks.value,
          liked: liked.value,
          profiles: profiles.value,
        }),
      );
    },
    { deep: true },
  );

  function remember(profile: Recommendation | RecommendationDetail) {
    profiles.value[profile.id] = profile;
  }

  function idsFor(kind: SocialActivityKind) {
    return kind === 'favorite'
      ? favorites.value
      : kind === 'view'
        ? views.value
        : unlocks.value;
  }

  function record(kind: SocialActivityKind, profileId: string) {
    if (kind === 'favorite') {
      favorites.value = newestFirst(favorites.value, profileId);
    } else if (kind === 'view') {
      views.value = newestFirst(views.value, profileId);
    } else {
      unlocks.value = newestFirst(unlocks.value, profileId);
    }
    persist(kind, profileId, true);
  }

  function remove(kind: SocialActivityKind, profileId: string) {
    if (kind === 'favorite') {
      favorites.value = favorites.value.filter((id) => id !== profileId);
    } else if (kind === 'view') {
      views.value = views.value.filter((id) => id !== profileId);
    } else {
      unlocks.value = unlocks.value.filter((id) => id !== profileId);
    }
    persist(kind, profileId, false);
  }

  function isFavorite(profileId: string) {
    return favorites.value.includes(profileId);
  }

  function toggleFavorite(profile: Recommendation | RecommendationDetail) {
    remember(profile);
    if (isFavorite(profile.id)) {
      remove('favorite', profile.id);
      return false;
    }
    record('favorite', profile.id);
    return true;
  }

  function isLiked(profileId: string) {
    return liked.value.includes(profileId);
  }

  function toggleLike(profile: Recommendation) {
    remember(profile);
    if (isLiked(profile.id)) {
      liked.value = liked.value.filter((id) => id !== profile.id);
      persist('like', profile.id, false);
      return false;
    }
    liked.value = newestFirst(liked.value, profile.id);
    persist('like', profile.id, true);
    return true;
  }

  async function persist(
    kind: SocialActivityKind | 'like',
    profileId: string,
    active: boolean,
  ) {
    const url = `/api/v1/social/profiles/${profileId}/${kind}`;
    try {
      if (active) await post(url);
      else await del(url);
    } catch {
      if (kind === 'like') {
        liked.value = active
          ? liked.value.filter((id) => id !== profileId)
          : newestFirst(liked.value, profileId);
      } else {
        const list =
          kind === 'favorite'
            ? favorites
            : kind === 'view'
              ? views
              : unlocks;
        list.value = active
          ? list.value.filter((id) => id !== profileId)
          : newestFirst(list.value, profileId);
      }
    }
  }

  async function loadSummary() {
    summary.value = await get<SocialSummary>('/api/v1/social/summary');
    if (summary.value) {
      localStorage.setItem(
        'friends_message_notifications',
        summary.value.notificationEnabled ? '1' : '0',
      );
    }
    return summary.value;
  }

  async function hydrate(force = false) {
    if (hydrated.value && !force) return;
    if (hydrateRequest) return hydrateRequest;
    hydrateRequest = (async () => {
      try {
        const kinds = (['favorite', 'view', 'unlock'] as SocialActivityKind[])
          .filter(
            (kind) =>
              kind === 'view' ||
              features.isEnabled(kind as 'favorite' | 'unlock'),
          );
        const [lists, likes] = await Promise.all([
          Promise.all(
            kinds.map((kind) =>
              get<{ items: (Recommendation & { interactedAt?: string })[] }>(
                '/api/v1/social/activities',
                { kind },
              ),
            ),
          ),
          features.isEnabled('likes')
            ? get<{ items: (Recommendation & { interactedAt?: string })[] }>(
                '/api/v1/social/activities',
                { kind: 'like' },
              )
            : Promise.resolve({ items: [] }),
        ]);
        const byKind = Object.fromEntries(
          kinds.map((kind, index) => [kind, lists[index]]),
        ) as Partial<
          Record<
            SocialActivityKind,
            { items: (Recommendation & { interactedAt?: string })[] }
          >
        >;
        const apply = (
          target: typeof favorites,
          result: { items: (Recommendation & { interactedAt?: string })[] },
        ) => {
          target.value = result.items.map((item) => item.id);
          result.items.forEach((item) => remember(item));
        };
        if (byKind.favorite) apply(favorites, byKind.favorite);
        if (byKind.view) apply(views, byKind.view);
        if (byKind.unlock) apply(unlocks, byKind.unlock);
        liked.value = likes.items.map((item) => item.id);
        likes.items.forEach((item) => remember(item));
        await loadSummary();
        hydrated.value = true;
      } catch {
        hydrated.value = false;
      } finally {
        hydrateRequest = null;
      }
    })();
    return hydrateRequest;
  }

  async function updateNotifications(enabled: boolean) {
    const result = await put<{ notificationEnabled: boolean }>(
      '/api/v1/social/notifications',
      { enabled },
    );
    if (summary.value) {
      summary.value.notificationEnabled = result.notificationEnabled;
    }
    localStorage.setItem(
      'friends_message_notifications',
      result.notificationEnabled ? '1' : '0',
    );
    return result.notificationEnabled;
  }

  function itemsFor(kind: SocialActivityKind) {
    return idsFor(kind)
      .map((id) => profiles.value[id])
      .filter(Boolean) as Recommendation[];
  }

  return {
    favorites,
    views,
    unlocks,
    liked,
    profiles,
    summary,
    hydrated,
    remember,
    record,
    remove,
    isFavorite,
    toggleFavorite,
    isLiked,
    toggleLike,
    itemsFor,
    hydrate,
    loadSummary,
    updateNotifications,
  };
});
