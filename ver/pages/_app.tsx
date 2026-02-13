import type { AppProps } from 'next/app';
import '@/styles/globals.css';
import { SWRConfig } from 'swr';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

const PROTECTED_PREFIXES = ['/dashboard', '/doctor', '/nurse', '/patient', '/technician', '/local-agency'];

function AuthGate() {
  const router = useRouter();

  useEffect(() => {
    const protectedRoute = PROTECTED_PREFIXES.some((prefix) => router.pathname.startsWith(prefix));
    if (!protectedRoute || typeof window === 'undefined') return;
    const token = localStorage.getItem('token');
    if (!token) router.replace('/login');
  }, [router]);

  return null;
}

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <SWRConfig
      value={{
        revalidateOnFocus: false,
        shouldRetryOnError: false,
      }}
    >
      <AuthGate />
      <Component {...pageProps} />
    </SWRConfig>
  );
}
