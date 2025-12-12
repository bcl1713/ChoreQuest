import { ReactNode } from 'react';

interface TemplateModalShellProps {
  title: string;
  children: ReactNode;
}

export function TemplateModalShell({ title, children }: TemplateModalShellProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-gray-800 text-white p-8 rounded-lg shadow-2xl w-full max-w-2xl border border-gray-700">
        <h2 className="text-2xl font-bold mb-6">{title}</h2>
        {children}
      </div>
    </div>
  );
}
