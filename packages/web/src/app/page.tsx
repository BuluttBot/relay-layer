'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import PinForm from '@/components/auth/PinForm';
import CodeForm from '@/components/auth/CodeForm';
import Spinner from '@/components/ui/Spinner';

export default function LoginPage() {
  const router = useRouter();
  const { authenticated, loading, checkAuth } = useAuthStore();
  const [step, setStep] = useState<'pin' | 'code'>('pin');

  useEffect(() => {
    checkAuth().then(ok => { if (ok) router.push('/dashboard'); });
  }, []);

  useEffect(() => {
    if (authenticated) router.push('/dashboard');
  }, [authenticated]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-bg-secondary border border-border-subtle rounded-2xl p-8 shadow-modal">
        {step === 'pin' ? (
          <PinForm onSuccess={() => setStep('code')} />
        ) : (
          <CodeForm />
        )}
      </div>
    </div>
  );
}
