'use client';

import { useEffect } from 'react';

type AdBlockProps = {
  className?: string;
};

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

export function AdBlock({ className }: AdBlockProps) {
  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // ignore
    }
  }, []);

  return (
    <div className={className}>
      <ins
        className="adsbygoogle block w-full"
        style={{ display: 'block' }}
        data-ad-client="ca-pub-1904838490296389"
        data-ad-slot="0000000000"
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
