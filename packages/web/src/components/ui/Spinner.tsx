'use client';

export default function Spinner({ size = 20 }: { size?: number }) {
  return (
    <div
      className="animate-spin rounded-full border-2 border-text-tertiary border-t-accent-purple"
      style={{ width: size, height: size }}
    />
  );
}
