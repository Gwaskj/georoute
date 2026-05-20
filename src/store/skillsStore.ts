// src/store/skillsStore.ts
import { create } from "zustand";
import {
  loadFreeSchedulerData,
  saveFreeSchedulerData,
} from "@/lib/freeSession";

export interface Skill {
  id: string;
  name: string;
}

interface SkillsState {
  skills: Skill[];
  setSkills: (skills: Skill[]) => void;
  addSkill: (name: string) => Skill;
  deleteSkill: (id: string) => void;
  renameSkill: (id: string, newName: string) => void;
}

async function persistFree(skills: Skill[]) {
  const data = (await loadFreeSchedulerData()) ?? {};
  await saveFreeSchedulerData({ ...data, skills });
}

export const useSkillsStore = create<SkillsState>((set, get) => ({
  skills: [],

  setSkills: (skills) => {
    persistFree(skills);
    set({ skills });
  },

  addSkill: (name) => {
    const existing = get().skills.find(
      (s) => s.name.toLowerCase() === name.toLowerCase()
    );
    if (existing) return existing;

    const newSkill: Skill = {
      id: crypto.randomUUID(),
      name,
    };

    const skills = [...get().skills, newSkill];
    persistFree(skills);
    set({ skills });
    return newSkill;
  },

  deleteSkill: (id) => {
    const skills = get().skills.filter((s) => s.id !== id);
    persistFree(skills);
    set({ skills });
  },

  renameSkill: (id, newName) => {
    const skills = get().skills.map((s) =>
      s.id === id ? { ...s, name: newName } : s
    );
    persistFree(skills);
    set({ skills });
  },
}));

// INITIAL LOAD
if (typeof window !== "undefined") {
  loadFreeSchedulerData().then((data) => {
    if (data?.skills?.length) {
      useSkillsStore.getState().setSkills(data.skills);
    }
  });
}
