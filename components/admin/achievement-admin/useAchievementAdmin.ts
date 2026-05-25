"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export interface AdminAchievement {
  id: string;
  name: string;
  description: string;
  icon: string | null;
  category_id: string;
  category_name: string;
  xp_reward: number | null;
  gold_reward: number | null;
  is_hidden: boolean | null;
  criteria_type: string;
  criteria_config: Record<string, unknown>;
  family_id: string | null;
}

export interface AdminCategoryOption {
  id: string;
  name: string;
}

export interface AchievementFormData {
  name: string;
  description: string;
  icon: string;
  category_id: string;
  xp_reward: string;
  gold_reward: string;
  is_hidden: boolean;
  criteria_type: string;
  criteria_config: string;
}

const EMPTY_FORM: AchievementFormData = {
  name: "",
  description: "",
  icon: "",
  category_id: "",
  xp_reward: "0",
  gold_reward: "0",
  is_hidden: false,
  criteria_type: "",
  criteria_config: "{}",
};

async function getAuthToken(): Promise<string> {
  const session = (await supabase.auth.getSession()).data.session;
  if (!session?.access_token) throw new Error("Not authenticated");
  return session.access_token;
}

async function apiFetch(
  path: string,
  method: string,
  body?: Record<string, unknown>,
) {
  const token = await getAuthToken();
  const res = await fetch(path, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export function useAchievementAdmin() {
  const [achievements, setAchievements] = useState<AdminAchievement[]>([]);
  const [categories, setCategories] = useState<AdminCategoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingAchievement, setEditingAchievement] =
    useState<AdminAchievement | null>(null);
  const [formData, setFormData] = useState<AchievementFormData>(EMPTY_FORM);
  const [actionLoading, setActionLoading] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const fetchAchievements = useCallback(async () => {
    try {
      setError(null);
      const data = await apiFetch("/api/admin/achievements", "GET");
      setAchievements(data.achievements);
      setCategories(data.categories);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load achievements",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAchievements();
  }, [fetchAchievements]);

  const filteredAchievements =
    categoryFilter === "all"
      ? achievements
      : achievements.filter((a) => a.category_id === categoryFilter);

  const handleCreate = () => {
    setEditingAchievement(null);
    setFormData(EMPTY_FORM);
    setShowForm(true);
  };

  const handleEdit = (achievement: AdminAchievement) => {
    setEditingAchievement(achievement);
    setFormData({
      name: achievement.name,
      description: achievement.description,
      icon: achievement.icon ?? "",
      category_id: achievement.category_id,
      xp_reward: String(achievement.xp_reward ?? 0),
      gold_reward: String(achievement.gold_reward ?? 0),
      is_hidden: achievement.is_hidden ?? false,
      criteria_type: achievement.criteria_type,
      criteria_config: JSON.stringify(achievement.criteria_config ?? {}),
    });
    setShowForm(true);
  };

  const handleFormChange = (
    field: keyof AchievementFormData,
    value: string | boolean,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setActionLoading(true);
    try {
      let parsedConfig: Record<string, unknown> = {};
      try {
        parsedConfig = JSON.parse(formData.criteria_config);
      } catch {
        // Keep empty object if invalid JSON
      }

      const payload = {
        name: formData.name,
        description: formData.description || "",
        icon: formData.icon || null,
        category_id: formData.category_id,
        xp_reward: parseInt(formData.xp_reward, 10) || 0,
        gold_reward: parseInt(formData.gold_reward, 10) || 0,
        is_hidden: formData.is_hidden,
        criteria_type: formData.criteria_type,
        criteria_config: parsedConfig,
      };

      if (editingAchievement) {
        await apiFetch(
          `/api/admin/achievements/${editingAchievement.id}`,
          "PATCH",
          payload,
        );
      } else {
        await apiFetch("/api/admin/achievements", "POST", payload);
      }

      setShowForm(false);
      setEditingAchievement(null);
      setFormData(EMPTY_FORM);
      await fetchAchievements();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save achievement",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingAchievement(null);
    setFormData(EMPTY_FORM);
  };

  return {
    achievements: filteredAchievements,
    categories,
    loading,
    error,
    showForm,
    editingAchievement,
    formData,
    actionLoading,
    categoryFilter,
    setCategoryFilter,
    handleCreate,
    handleEdit,
    handleFormChange,
    handleSubmit,
    handleCancelForm,
  };
}
