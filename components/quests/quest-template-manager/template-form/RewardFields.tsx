import { ChangeEvent } from 'react';

interface RewardFieldsProps {
  xpReward: number;
  goldReward: number;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

export function RewardFields({ xpReward, goldReward, onChange }: RewardFieldsProps) {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div>
        <label
          htmlFor="xp_reward"
          className="block text-sm font-semibold uppercase text-gray-300 mb-1"
        >
          XP Reward
        </label>
        <input
          id="xp_reward"
          type="number"
          name="xp_reward"
          value={xpReward}
          onChange={onChange}
          placeholder="XP Reward"
          className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2"
          min={0}
        />
      </div>
      <div>
        <label
          htmlFor="gold_reward"
          className="block text-sm font-semibold uppercase text-gray-300 mb-1"
        >
          Gold Reward
        </label>
        <input
          id="gold_reward"
          type="number"
          name="gold_reward"
          value={goldReward}
          onChange={onChange}
          placeholder="Gold Reward"
          className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2"
          min={0}
        />
      </div>
    </div>
  );
}
