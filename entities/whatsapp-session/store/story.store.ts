import { create } from "zustand";

import { apiClient } from "@/shared/api/apiClient";
import type { ApiResponse } from "@/shared/api/http";
import { groupWhatsappStories } from "../model/whatsappSession.model";
import type {
  WhatsappStory,
  WhatsappStoryGroup,
} from "../model/whatsappSession.model";

interface StoryState {
  groups: WhatsappStoryGroup[];
  isLoading: boolean;
  errorMessage: string | null;
  fetchStories: (sessionId: string, ownerId: string) => Promise<void>;
  markViewed: (
    sessionId: string,
    ownerId: string,
    storyId: string,
  ) => Promise<void>;
  reset: () => void;
}

export const useStoryStore = create<StoryState>((set, get) => ({
  groups: [],
  isLoading: false,
  errorMessage: null,

  fetchStories: async (sessionId, ownerId) => {
    set({ isLoading: true, errorMessage: null });

    try {
      const { data: response } = await apiClient.get<ApiResponse<WhatsappStory[]>>(
        "/whatsapp/stories",
        { params: { sessionId, ownerId } },
      );

      set({ groups: groupWhatsappStories(response.data) });
    } catch {
      set({ errorMessage: "Gagal memuat story WhatsApp" });
    } finally {
      set({ isLoading: false });
    }
  },

  markViewed: async (sessionId, ownerId, storyId) => {
    await apiClient.post(`/whatsapp/stories/${storyId}/view`, undefined, {
      params: { sessionId, ownerId },
    });

    const stories = get().groups.flatMap((group) =>
      group.stories.map((story) =>
        story.id === storyId
          ? { ...story, viewedAt: new Date().toISOString() }
          : story,
      ),
    );

    set({ groups: groupWhatsappStories(stories) });
  },

  reset: () => set({ groups: [], isLoading: false, errorMessage: null }),
}));
