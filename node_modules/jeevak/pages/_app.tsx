import type { AppProps } from 'next/app';
import '@/styles/globals.css';
import { SWRConfig } from 'swr';

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <SWRConfig
      value={{
        revalidateOnFocus: false,
        shouldRetryOnError: false,
      }}
    >
      <Component {...pageProps} />
    </SWRConfig>
  );
}
