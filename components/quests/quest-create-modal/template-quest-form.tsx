"use client";

import React, { useMemo } from "react";
import { Coins, Zap } from "lucide-react";
import { QuestTemplate } from "@/lib/types/database";

export interface TemplateQuestFormProps {
  templates: QuestTemplate[];
  selectedTemplateId: string;
  onTemplateSelect: (templateId: string) => void;
}

const TemplateQuestForm = React.memo(function TemplateQuestForm({
  templates,
  selectedTemplateId,
  onTemplateSelect,
}: TemplateQuestFormProps) {
  // Memoize template lookup to avoid re-finding on every render
  const selectedTemplate = useMemo(
    () => templates.find((t) => t.id === selectedTemplateId),
    [templates, selectedTemplateId]
  );

  return (
    <>
      {/* Template Selection */}
      <div>
        <label htmlFor="template-select" className="block text-sm font-medium text-gray-200 mb-2">
          Select Template
        </label>
        <select
          id="template-select"
          data-testid="template-select"
          value={selectedTemplateId}
          onChange={(e) => onTemplateSelect(e.target.value)}
          className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-gold-500"
          required
        >
          <option value="">Choose a quest template...</option>
          {templates.map((template) => (
            <option key={template.id} value={template.id}>
              {template.title} - {template.difficulty} (
              {template.xp_reward} XP, {template.gold_reward} Gold)
            </option>
          ))}
        </select>
      </div>

      {/* Template Preview */}
      {selectedTemplate && (
        <div data-testid="template-preview" className="bg-dark-800 p-4 rounded-lg">
          <h4 className="font-medium text-gray-100 mb-2">
            {selectedTemplate.title}
          </h4>
          <p className="text-gray-400 text-sm mb-3">
            {selectedTemplate.description}
          </p>
          <div className="flex gap-4 text-sm flex-wrap">
            <span className="text-yellow-400">
              {selectedTemplate.difficulty}
            </span>
            <span className="text-blue-400">
              {selectedTemplate.category}
            </span>
            <span className="text-gold-400 flex items-center gap-1">
              <Coins size={16} className="inline" /> {selectedTemplate.gold_reward}
            </span>
            <span className="xp-text flex items-center gap-1">
              <Zap size={16} className="inline" /> {selectedTemplate.xp_reward} XP
            </span>
          </div>
        </div>
      )}
    </>
  );
});

export default TemplateQuestForm;
