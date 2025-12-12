import { Clock } from 'lucide-react';
import { formatCooldown } from './utils';

interface CooldownNoticeProps {
  cooldownRemaining: number;
}

export function CooldownNotice({ cooldownRemaining }: CooldownNoticeProps) {
  return (
    <div className="flex gap-3 p-4 bg-amber-900/30 border border-amber-500/30 rounded-lg">
      <Clock size={20} className="text-amber-400 flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-amber-300 font-semibold mb-1">On Cooldown</p>
        <p className="text-amber-300/80 text-sm">
          You can change your class again in {formatCooldown(cooldownRemaining)}
        </p>
      </div>
    </div>
  );
}
