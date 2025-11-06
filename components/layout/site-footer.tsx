import type { GitReferenceMetadata } from '@/lib/git-metadata';
import { Tag, GitBranch } from 'lucide-react';

interface SiteFooterProps {
  gitReference: GitReferenceMetadata | null;
}

const getReferenceLabel = (metadata: GitReferenceMetadata | null) => {
  if (!metadata) return null;
  const Icon = metadata.type === 'tag' ? Tag : GitBranch;
  const label = metadata.type === 'tag' ? 'Tag' : 'Branch';
  return { Icon, label, value: metadata.value };
};

export default function SiteFooter({ gitReference }: SiteFooterProps) {
  const referenceLabel = getReferenceLabel(gitReference);

  return (
    <footer className="border-t border-dark-700 bg-dark-900/80 px-6 py-6 text-center text-gray-300 backdrop-blur-sm">
      <p className="font-game text-gray-200">
        Built with Next.js • TypeScript • Tailwind CSS • Prisma ORM
      </p>
      <p className="text-sm mt-2 text-gray-400">
        Ready for your family&apos;s epic adventure? The quest begins soon...
      </p>
      {referenceLabel && (
        <p className="text-xs mt-4 text-gray-500 font-mono flex items-center justify-center gap-1">
          <referenceLabel.Icon size={14} />
          {referenceLabel.label}: {referenceLabel.value}
        </p>
      )}
    </footer>
  );
}
