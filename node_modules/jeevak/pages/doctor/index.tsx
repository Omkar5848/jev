import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    if (!router.isReady) return;
    router.replace('/doctor/overview');
  }, [router]);

  return <div style={{ padding: 16 }}>Redirecting…</div>;
}
