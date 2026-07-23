'use client';

import { useEffect, useState } from 'react';

export default function OfflineBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const updateStatus = () => setOffline(!navigator.onLine);

    updateStatus();
    window.addEventListener('offline', updateStatus);
    window.addEventListener('online', updateStatus);

    return () => {
      window.removeEventListener('offline', updateStatus);
      window.removeEventListener('online', updateStatus);
    };
  }, []);

  if (!offline) return null;

  return (
    <div className="fixed left-0 right-0 top-0 z-[9999] bg-[#7F1D1D] px-4 py-2.5 text-center text-sm font-semibold text-white">
      No internet connection. Please check your network.
    </div>
  );
}
