"use client";

import { FolderOpen } from "lucide-react";
import { Button } from "@/components/ui";
import { useAchievementCategoryAdmin } from "./useAchievementCategoryAdmin";
import { CategoryList } from "./CategoryList";
import { CategoryForm } from "./CategoryForm";
import { DeleteCategoryDialog } from "./DeleteCategoryDialog";

export default function AchievementCategoryAdmin() {
  const {
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
  } = useAchievementCategoryAdmin();

  if (loading) {
    return <div className="text-center py-8">Loading categories...</div>;
  }

  return (
    <div className="space-y-6" data-testid="achievement-category-admin">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-fantasy text-gray-100 flex items-center gap-2">
          <FolderOpen size={28} />
          Achievement Categories
        </h2>
        <Button
          onClick={handleCreate}
          variant="gold"
          size="sm"
          data-testid="create-category-button"
        >
          Create Category
        </Button>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 text-red-200">
          {error}
        </div>
      )}

      <CategoryList
        categories={categories}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
      />

      {showForm && (
        <CategoryForm
          mode={editingCategory ? "edit" : "create"}
          formData={formData}
          actionLoading={actionLoading}
          onSubmit={handleSubmit}
          onCancel={handleCancelForm}
          onChange={handleFormChange}
        />
      )}

      {showDeleteConfirm && deleteTarget && (
        <DeleteCategoryDialog
          category={deleteTarget}
          isOpen={showDeleteConfirm}
          isLoading={actionLoading}
          onCancel={handleCancelDelete}
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  );
}
