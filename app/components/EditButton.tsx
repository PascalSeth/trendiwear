'use client';

import { Pencil } from 'lucide-react';

interface EditButtonProps {
  onEdit: () => void;
  isOwner: boolean;
}

export function EditButton({ onEdit, isOwner }: EditButtonProps) {
  if (!isOwner) return null;

  return (
    <button
      onClick={onEdit}
      className="absolute top-4 right-4 p-2 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition-colors shadow-sm"
      aria-label="Edit"
    >
      <Pencil className="w-4 h-4 text-stone-600" />
    </button>
  );
}