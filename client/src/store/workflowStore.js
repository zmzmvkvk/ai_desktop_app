import { create } from "zustand";

export const useWorkflowStore = create((set) => ({
  step: "스토리",
  setStep: (step) => set({ step }),

  storyPrompt: "",
  setStoryPrompt: (val) => set({ storyPrompt: val }),

  imageFile: null,
  imagePreview: null,
  setImage: (file, previewUrl) =>
    set({ imageFile: file, imagePreview: previewUrl }),

  selectedCharacter: "gfm_014x",
  setSelectedCharacter: (val) => set({ selectedCharacter: val }),

  selectedImageCutIndex: 0,
  setSelectedImageCutIndex: (val) => set({ selectedImageCutIndex: val }),

  imageStyle: "simple cartoon",
  setImageStyle: (val) => set({ imageStyle: val }),

  storySummary: "",
  setStorySummary: (val) => set({ storySummary: val }),

  cutsceneList: [],
  setCutsceneList: (val) => set({ cutsceneList: val }),

  videoOptions: {
    lipsync: false,
    motionSmoothing: true,
  },
  setVideoOptions: (options) =>
    set((state) => ({
      videoOptions: { ...state.videoOptions, ...options },
    })),
}));
