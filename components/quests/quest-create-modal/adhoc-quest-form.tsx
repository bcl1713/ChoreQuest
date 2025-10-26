"use client";

import React from "react";
import { QuestDifficulty, QuestCategory } from "@/lib/types/database";

export interface AdhocQuestFormProps {
  title: string;
  description: string;
  xpReward: number;
  goldReward: number;
  difficulty: QuestDifficulty;
  category: QuestCategory;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onXpRewardChange: (value: number) => void;
  onGoldRewardChange: (value: number) => void;
  onDifficultyChange: (value: QuestDifficulty) => void;
  onCategoryChange: (value: QuestCategory) => void;
}

const AdhocQuestForm = React.memo(function AdhocQuestForm({
  title,
  description,
  xpReward,
  goldReward,
  difficulty,
  category,
  onTitleChange,
  onDescriptionChange,
  onXpRewardChange,
  onGoldRewardChange,
  onDifficultyChange,
  onCategoryChange,
}: AdhocQuestFormProps) {
  return (
    <>
      {/* Custom Quest Fields */}
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-200 mb-2">
            Quest Title
          </label>
          <input
            type="text"
            data-testid="quest-title-input"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-gold-500"
            placeholder="Enter quest title..."
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-200 mb-2">
            Category
          </label>
          <select
            data-testid="quest-category-select"
            value={category}
            onChange={(e) => onCategoryChange(e.target.value as QuestCategory)}
            className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-gold-500"
          >
            <option value="DAILY">Daily</option>
            <option value="WEEKLY">Weekly</option>
            <option value="BOSS_BATTLE">Boss Battle</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-200 mb-2">
          Description
        </label>
        <textarea
          data-testid="quest-description-input"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-gold-500"
          rows={3}
          placeholder="Describe the quest..."
          required
        />
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-200 mb-2">
            Difficulty
          </label>
          <select
            data-testid="quest-difficulty-select"
            value={difficulty}
            onChange={(e) => onDifficultyChange(e.target.value as QuestDifficulty)}
            className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-gold-500"
          >
            <option value="EASY">Easy</option>
            <option value="MEDIUM">Medium</option>
            <option value="HARD">Hard</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-200 mb-2">
            XP Reward
          </label>
          <input
            type="number"
            data-testid="quest-xp-input"
            value={xpReward}
            onChange={(e) => onXpRewardChange(parseInt(e.target.value) || 0)}
            className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-gold-500"
            min="1"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-200 mb-2">
            Gold Reward
          </label>
          <input
            type="number"
            data-testid="quest-gold-input"
            value={goldReward}
            onChange={(e) => onGoldRewardChange(parseInt(e.target.value) || 0)}
            className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-gold-500"
            min="0"
            required
          />
        </div>
      </div>
    </>
  );
});

export default AdhocQuestForm;
