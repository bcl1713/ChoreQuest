import { Coins } from 'lucide-react';

interface CostInfoProps {
  cost: number;
  currentGold: number;
}

export function CostInfo({ cost, currentGold }: CostInfoProps) {
  return (
    <div className="p-4 bg-dark-800/50 border border-gold-700/20 rounded-lg">
      <div className="flex items-center justify-between">
        <span className="text-gray-300 flex items-center gap-2">
          <Coins size={18} className="text-gold-400" />
          Class Change Cost:
        </span>
        <span className="text-2xl font-bold text-gold-400">{cost} Gold</span>
      </div>
      <p className="text-xs text-gray-400 mt-2">
        Current balance: {currentGold} gold
        {currentGold < cost && (
          <span className="text-red-400 ml-2">
            (Need {cost - currentGold} more gold)
          </span>
        )}
      </p>
    </div>
  );
}
