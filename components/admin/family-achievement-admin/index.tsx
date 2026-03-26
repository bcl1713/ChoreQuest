"use client";

import { Users } from "lucide-react";
import { Button } from "@/components/ui";
import { useFamilyAchievementAdmin } from "./useFamilyAchievementAdmin";
import { FamilyAchievementList } from "./FamilyAchievementList";
import { FamilyAchievementForm } from "./FamilyAchievementForm";

export default function FamilyAchievementAdmin() {
  const {
    achievements,
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
    handleDelete,
    handleFormChange,
    handleSubmit,
    handleCancelForm,
  } = useFamilyAchievementAdmin();

  if (loading) {
    return (
      <div className="text-center py-8">Loading family achievements...</div>
    );
  }

  return (
    <div className="space-y-6" data-testid="family-achievement-admin">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-fantasy text-gray-100 flex items-center gap-2">
          <Users size={28} />
          Family Achievement Management
        </h2>
        <Button
          onClick={handleCreate}
          variant="gold"
          size="sm"
          data-testid="create-family-achievement-button"
        >
          Create Family Achievement
        </Button>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 text-red-200">
          {error}
        </div>
      )}

      <FamilyAchievementList
        achievements={achievements}
        categories={categories}
        categoryFilter={categoryFilter}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onCategoryFilterChange={setCategoryFilter}
      />

      {showForm && (
        <FamilyAchievementForm
          mode={editingAchievement ? "edit" : "create"}
          formData={formData}
          categories={categories}
          actionLoading={actionLoading}
          onSubmit={handleSubmit}
          onCancel={handleCancelForm}
          onChange={handleFormChange}
        />
      )}
    </div>
  );
}
