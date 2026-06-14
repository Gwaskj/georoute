// src/store/skillsStore.ts
import { create } from "zustand";
import {
  loadFreeSchedulerData,
  saveFreeSchedulerData,
} from "@/lib/freeSession";
import { supabase } from "@/lib/supabase/client";

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
  loadFromSupabase: () => Promise<void>;
}

async function isPro(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase
    .from("profiles")
    .select("is_pro")
    .eq("user_id", user.id)
    .maybeSingle();
  return data?.is_pro === true;
}

async function persistFree(skills: Skill[]) {
  const data = (await loadFreeSchedulerData()) ?? {
    staff: [],
    appointments: [],
    routes: [],
    windows: [],
    skills: [],
    officePostcode: "",
    selectedStaffIds: [],
    visits: [],
  };

  await saveFreeSchedulerData({
    staff: data.staff ?? [],
    appointments: data.appointments ?? [],
    routes: data.routes ?? [],
    windows: data.windows ?? [],
    skills,
    officePostcode: data.officePostcode ?? "",
    selectedStaffIds: data.selectedStaffIds ?? [],
    visits: data.visits ?? [],
  });
}

async function persistPro(skills: Skill[]) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { error: delError } = await supabase
    .from("user_skills")
    .delete()
    .eq("user_id", user.id);

  if (delError) {
    console.error("Failed to clear pro skills:", delError);
    return;
  }

  if (skills.length === 0) return;

  const { error: insError } = await supabase.from("user_skills").insert(
    skills.map((s) => ({
      user_id: user.id,
      local_id: s.id,
      name: s.name,
    }))
  );

  if (insError) {
    console.error("Failed to insert pro skills:", insError);
  }
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
    isPro().then((pro) => {
      if (pro) persistPro(skills);
    });
    set({ skills });
    return newSkill;
  },

  deleteSkill: (id) => {
    const skills = get().skills.filter((s) => s.id !== id);
    persistFree(skills);
    isPro().then((pro) => {
      if (pro) persistPro(skills);
    });
    set({ skills });
  },

  renameSkill: (id, newName) => {
    const skills = get().skills.map((s) =>
      s.id === id ? { ...s, name: newName } : s
    );
    persistFree(skills);
    isPro().then((pro) => {
      if (pro) persistPro(skills);
    });
    set({ skills });
  },

  loadFromSupabase: async () => {
    const pro = await isPro();
    if (!pro) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("user_skills")
      .select("*")
      .eq("user_id", user.id);

    if (!data) return;

    const seen = new Set<string>();
    const mapped: Skill[] = data
      .filter((row) => {
        const id = row.local_id;
        if (!id || seen.has(id)) return false;
        seen.add(id);
        return true;
      })
      .map((row) => ({
        id: row.local_id,
        name: row.name ?? "",
      }));

    set({ skills: mapped });
  },
}));

// INITIAL LOAD
if (typeof window !== "undefined") {
  loadFreeSchedulerData().then(async (data) => {
    const store = useSkillsStore.getState();

    const pro = await isPro();
    if (pro) {
      await store.loadFromSupabase();
      return;
    }

    if (data?.skills?.length) {
      store.setSkills(data.skills);
    }
  });
}
