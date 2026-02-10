'use client';
import { useState } from 'react';
import Button from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';
import { Lock } from 'lucide-react';

interface PinFormProps {
  onSuccess: () => void;
}

export default function PinForm({ onSuccess }: PinFormProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const submitPin = useAuthStore(s => s.submitPin);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await submitPin(pin);
    setLoading(false);
    if (result.ok) onSuccess();
    else setError(result.error || 'Invalid PIN');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex justify-center">
        <div className="w-16 h-16 rounded-2xl bg-accent-purple/10 flex items-center justify-center">
          <Lock size={28} className="text-accent-purple" />
        </div>
      </div>
      <div className="text-center">
        <h1 className="text-2xl font-bold text-text-primary">Relay layeR</h1>
        <p className="text-text-secondary mt-2 text-sm">Enter PIN to continue</p>
      </div>
      <div>
        <input
          type="password"
          value={pin}
          onChange={e => setPin(e.target.value)}
          placeholder="••••"
          maxLength={4}
          className="w-full px-4 py-3 bg-bg-surface border border-border rounded-xl text-center text-2xl tracking-[0.5em] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent-purple transition-fast"
          autoFocus
        />
      </div>
      {error && <p className="text-accent-red text-sm text-center">{error}</p>}
      <Button type="submit" className="w-full" disabled={pin.length !== 4 || loading}>
        {loading ? 'Verifying...' : 'Continue'}
      </Button>
    </form>
  );
}
