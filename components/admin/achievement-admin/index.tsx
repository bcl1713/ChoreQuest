"use client";

import { Trophy } from "lucide-react";
import { Button } from "@/components/ui";
import { useAchievementAdmin } from "./useAchievementAdmin";
import { AchievementList } from "./AchievementList";
import { AchievementForm } from "./AchievementForm";

export default function AchievementAdmin() {
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
    handleFormChange,
    handleSubmit,
    handleCancelForm,
  } = useAchievementAdmin();

  if (loading) {
    return <div className="text-center py-8">Loading achievements...</div>;
  }

  return (
    <div className="space-y-6" data-testid="achievement-admin">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-fantasy text-gray-100 flex items-center gap-2">
          <Trophy size={28} />
          Achievement Management
        </h2>
        <Button
          onClick={handleCreate}
          variant="gold"
          size="sm"
          data-testid="create-achievement-button"
        >
          Create Achievement
        </Button>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 text-red-200">
          {error}
        </div>
      )}

      <AchievementList
        achievements={achievements}
        categories={categories}
        categoryFilter={categoryFilter}
        onEdit={handleEdit}
        onCategoryFilterChange={setCategoryFilter}
      />

      {showForm && (
        <AchievementForm
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
