// src/store/skillsStore.ts

import { create } from "zustand";

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

const STORAGE_KEY = "georoute_skills";

function loadInitialSkills(): Skill[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Skill[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persistSkills(skills: Skill[]) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(skills));
  } catch {}
}

export const useSkillsStore = create<SkillsState>((set, get) => ({
  skills: [],

  setSkills: (skills) => {
    persistSkills(skills);
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
    persistSkills(skills);
    set({ skills });
    return newSkill;
  },

  deleteSkill: (id) => {
    const skills = get().skills.filter((s) => s.id !== id);
    persistSkills(skills);
    set({ skills });
  },

  renameSkill: (id, newName) => {
    const skills = get().skills.map((s) =>
      s.id === id ? { ...s, name: newName } : s
    );
    persistSkills(skills);
    set({ skills });
  },
}));

if (typeof window !== "undefined") {
  const initial = loadInitialSkills();
  if (initial.length) {
    useSkillsStore.getState().setSkills(initial);
  }
}
