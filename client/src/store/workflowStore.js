import { create } from "zustand";

export const useWorkflowStore = create((set) => ({
  step: "대시보드",
  setStep: (step) => set({ step }),

  storyPrompt: "",
  setStoryPrompt: (val) => set({ storyPrompt: val }),

  imageFile: null,
  imagePreview: null,
  setImage: (file, previewUrl) =>
    set({ imageFile: file, imagePreview: previewUrl }),

  selectedCharacter: "gefo",
  setSelectedCharacter: (val) => set({ selectedCharacter: val }),

  selectedImageCutIndex: 0,
  setSelectedImageCutIndex: (val) => set({ selectedImageCutIndex: val }),

  imageStyle: "simple cartoon",
  setImageStyle: (val) => set({ imageStyle: val }),

  storySummary: "",
  setStorySummary: (val) => set({ storySummary: val }),

  cutsceneList: [],
  setCutsceneList: (val) => set({ cutsceneList: val }),
}));
