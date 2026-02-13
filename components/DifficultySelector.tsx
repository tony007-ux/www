'use client';

import type { DifficultyLevel } from '@/lib/ai';

interface DifficultySelectorProps {
  value: DifficultyLevel;
  onChange: (v: DifficultyLevel) => void;
  disabled?: boolean;
}

const OPTIONS: { value: DifficultyLevel; label: string }[] = [
  { value: 'simple', label: 'Simple' },
  { value: 'medium', label: 'Medium' },
  { value: 'advanced', label: 'Advanced' },
];

export default function DifficultySelector({ value, onChange, disabled }: DifficultySelectorProps) {
  return (
    <div className="difficulty-selector">
      <span className="difficulty-label">Level:</span>
      <div className="difficulty-options">
        {OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className={`difficulty-btn ${value === opt.value ? 'active' : ''}`}
            onClick={() => onChange(opt.value)}
            disabled={disabled}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
