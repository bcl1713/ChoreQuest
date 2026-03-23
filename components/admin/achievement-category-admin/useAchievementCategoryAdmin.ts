"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export interface AdminCategory {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  display_order: number | null;
  achievement_count: number;
}

export interface CategoryFormData {
  name: string;
  description: string;
  icon: string;
  display_order: string;
}

const EMPTY_FORM: CategoryFormData = {
  name: "",
  description: "",
  icon: "",
  display_order: "0",
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

export function useAchievementCategoryAdmin() {
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<AdminCategory | null>(
    null,
  );
  const [formData, setFormData] = useState<CategoryFormData>(EMPTY_FORM);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminCategory | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchCategories = useCallback(async () => {
    try {
      setError(null);
      const data = await apiFetch("/api/admin/achievement-categories", "GET");
      setCategories(data.categories);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load categories",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleCreate = () => {
    setEditingCategory(null);
    setFormData(EMPTY_FORM);
    setShowForm(true);
  };

  const handleEdit = (category: AdminCategory) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description ?? "",
      icon: category.icon ?? "",
      display_order: String(category.display_order ?? 0),
    });
    setShowForm(true);
  };

  const handleFormChange = (field: keyof CategoryFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setActionLoading(true);
    try {
      const payload = {
        name: formData.name,
        description: formData.description || null,
        icon: formData.icon || null,
        display_order: parseInt(formData.display_order, 10) || 0,
      };

      if (editingCategory) {
        await apiFetch(
          `/api/admin/achievement-categories/${editingCategory.id}`,
          "PATCH",
          payload,
        );
      } else {
        await apiFetch("/api/admin/achievement-categories", "POST", payload);
      }

      setShowForm(false);
      setEditingCategory(null);
      setFormData(EMPTY_FORM);
      await fetchCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save category");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingCategory(null);
    setFormData(EMPTY_FORM);
  };

  const handleDeleteClick = (category: AdminCategory) => {
    setDeleteTarget(category);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setActionLoading(true);
    try {
      await apiFetch(
        `/api/admin/achievement-categories/${deleteTarget.id}`,
        "DELETE",
      );
      setShowDeleteConfirm(false);
      setDeleteTarget(null);
      await fetchCategories();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete category",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setDeleteTarget(null);
  };

  return {
    categories,
    loading,
    error,
    showForm,
    editingCategory,
    formData,
    showDeleteConfirm,
    deleteTarget,
    actionLoading,
    handleCreate,
    handleEdit,
    handleFormChange,
    handleSubmit,
    handleCancelForm,
    handleDeleteClick,
    handleConfirmDelete,
    handleCancelDelete,
  };
}
