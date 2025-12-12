import { AlertCircle } from 'lucide-react';

interface ErrorAlertProps {
  message: string;
}

export function ErrorAlert({ message }: ErrorAlertProps) {
  return (
    <div className="flex gap-3 p-3 bg-red-900/30 border border-red-500/30 rounded-lg">
      <AlertCircle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
      <p className="text-red-300 text-sm">{message}</p>
    </div>
  );
}
