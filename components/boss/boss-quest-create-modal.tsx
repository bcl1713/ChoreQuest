"use client";

import { Swords, X } from "lucide-react";
import { Button } from "@/components/ui";
import type { BossQuestForm } from "./boss-quest-panel";

type BossQuestCreateModalProps = {
  isOpen: boolean;
  form: BossQuestForm;
  submitting: boolean;
  onClose: () => void;
  onChange: (next: Partial<BossQuestForm>) => void;
  onSubmit: () => void;
  onReset: () => void;
};

export function BossQuestCreateModal({
  isOpen,
  form,
  submitting,
  onClose,
  onChange,
  onSubmit,
  onReset,
}: BossQuestCreateModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-2xl bg-dark-900 border border-dark-600 rounded-xl p-5 shadow-2xl space-y-4 relative">
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-white"
          onClick={onClose}
          aria-label="Close"
        >
          <X size={18} />
        </button>
        <div className="flex items-center gap-3">
          <Swords className="text-gold-400" size={22} />
          <div>
            <h4 className="text-lg font-semibold text-gray-100">Create Boss Quest</h4>
            <p className="text-sm text-gray-400">Use default rewards (50 gold / 100 XP) or customize.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-sm text-gray-400">Title</label>
            <input
              value={form.name}
              onChange={(e) => onChange({ name: e.target.value })}
              className="w-full rounded-md border border-dark-600 bg-dark-900 px-3 py-2 text-gray-100 focus:border-gold-500 focus:outline-none"
              placeholder="E.g., Shadow Dragon"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-gray-400">Join window (minutes)</label>
            <input
              type="number"
              min={5}
              max={1440}
              value={form.join_window_minutes}
              onChange={(e) => onChange({ join_window_minutes: Number(e.target.value) })}
              className="w-full rounded-md border border-dark-600 bg-dark-900 px-3 py-2 text-gray-100 focus:border-gold-500 focus:outline-none"
            />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <label className="text-sm text-gray-400">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => onChange({ description: e.target.value })}
              className="w-full rounded-md border border-dark-600 bg-dark-900 px-3 py-2 text-gray-100 focus:border-gold-500 focus:outline-none"
              rows={2}
              placeholder="Describe the boss and objectives"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-gray-400">Gold reward (per participant)</label>
            <input
              type="number"
              min={0}
              value={form.reward_gold}
              onChange={(e) => onChange({ reward_gold: Number(e.target.value) })}
              className="w-full rounded-md border border-dark-600 bg-dark-900 px-3 py-2 text-gray-100 focus:border-gold-500 focus:outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-gray-400">XP reward (per participant)</label>
            <input
              type="number"
              min={0}
              value={form.reward_xp}
              onChange={(e) => onChange({ reward_xp: Number(e.target.value) })}
              className="w-full rounded-md border border-dark-600 bg-dark-900 px-3 py-2 text-gray-100 focus:border-gold-500 focus:outline-none"
            />
          </div>
        </div>
        <div className="flex items-center justify-end gap-2">
          <Button variant="secondary" onClick={onReset}>
            Reset defaults
          </Button>
          <Button
            onClick={onSubmit}
            disabled={submitting || !form.name || !form.description}
            variant="gold"
          >
            Launch Boss Quest
          </Button>
        </div>
      </div>
    </div>
  );
}
