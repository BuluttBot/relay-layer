'use client';
import { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';
import { MessageCircle } from 'lucide-react';

export default function CodeForm() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const { requestCode, verifyCode } = useAuthStore();

  useEffect(() => {
    if (cooldown > 0) {
      const t = setTimeout(() => setCooldown(c => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [cooldown]);

  const handleSendCode = async () => {
    setError('');
    setLoading(true);
    const result = await requestCode();
    setLoading(false);
    if (result.ok) {
      setCodeSent(true);
      setCooldown(120);
    } else {
      setError(result.error || 'Failed to send code');
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await verifyCode(code);
    setLoading(false);
    if (!result.ok) setError(result.error || 'Invalid code');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-center">
        <div className="w-16 h-16 rounded-2xl bg-accent-teal/10 flex items-center justify-center">
          <MessageCircle size={28} className="text-accent-teal" />
        </div>
      </div>
      <div className="text-center">
        <h2 className="text-xl font-bold text-text-primary">Telegram Verification</h2>
        <p className="text-text-secondary mt-2 text-sm">
          {codeSent ? 'Enter the 6-digit code sent to your Telegram' : 'We\'ll send a verification code to your Telegram'}
        </p>
      </div>

      {!codeSent ? (
        <Button onClick={handleSendCode} className="w-full" disabled={loading}>
          {loading ? 'Sending...' : 'Send Code'}
        </Button>
      ) : (
        <form onSubmit={handleVerify} className="space-y-4">
          <input
            type="text"
            value={code}
            onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            maxLength={6}
            className="w-full px-4 py-3 bg-bg-surface border border-border rounded-xl text-center text-2xl tracking-[0.3em] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent-teal transition-fast"
            autoFocus
          />
          <Button type="submit" className="w-full" disabled={code.length !== 6 || loading}>
            {loading ? 'Verifying...' : 'Verify'}
          </Button>
          <button
            type="button"
            onClick={handleSendCode}
            disabled={cooldown > 0}
            className="w-full text-sm text-text-secondary hover:text-text-primary disabled:opacity-50 transition-fast"
          >
            {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
          </button>
        </form>
      )}

      {error && <p className="text-accent-red text-sm text-center">{error}</p>}
    </div>
  );
}
