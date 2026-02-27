'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push('/feed');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-bg-primary">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-text-primary mb-2">Helicarrier v3</h1>
        <p className="text-text-secondary">Redirecting to dashboard...</p>
      </div>
    </div>
  );
}
