'use client';

import { useCallback, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase/client';

const IDLE_TIMEOUT_MS = 5 * 60 * 1000;
const ACTIVITY_EVENTS = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'] as const;

function isProtectedPath(path: string) {
  return (
    path === '/admin' ||
    path.startsWith('/admin/') ||
    path === '/dashboard' ||
    path.startsWith('/dashboard/') ||
    path === '/onboarding' ||
    path.startsWith('/onboarding/')
  );
}

export function AuthTimeoutProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearIdleTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const startIdleTimer = useCallback(() => {
    clearIdleTimer();

    timeoutRef.current = setTimeout(async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        return;
      }

      const currentPath =
        window.location.pathname + window.location.search + window.location.hash;

      await supabase.auth.signOut();
      router.replace(`/signin?returnTo=${encodeURIComponent(currentPath)}`);
      router.refresh();
    }, IDLE_TIMEOUT_MS);
  }, [clearIdleTimer, router]);

  useEffect(() => {
    if (!isProtectedPath(pathname)) {
      clearIdleTimer();
      return;
    }

    startIdleTimer();

    ACTIVITY_EVENTS.forEach((eventName) => {
      window.addEventListener(eventName, startIdleTimer, { passive: true });
    });

    return () => {
      clearIdleTimer();
      ACTIVITY_EVENTS.forEach((eventName) => {
        window.removeEventListener(eventName, startIdleTimer);
      });
    };
  }, [clearIdleTimer, pathname, startIdleTimer]);

  return <>{children}</>;
}
