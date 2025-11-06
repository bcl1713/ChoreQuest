import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface IconWithLabelProps {
  icon: LucideIcon;
  label: string;
  size?: number;
}

/**
 * A simple component to render an icon alongside a label text.
 * Used to display character class, user role, and other icon-label pairs.
 */
export function IconWithLabel({
  icon: Icon,
  label,
  size = 16,
}: IconWithLabelProps) {
  return (
    <>
      <Icon size={size} />
      {label}
    </>
  );
}
