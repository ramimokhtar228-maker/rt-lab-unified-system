import { useEffect, useState, useCallback, useRef } from 'react';

/**
 * Hook to keep the device screen active and awake indefinitely.
 * Solves the critical issue where lab staff/mobile screens close or sleep automatically.
 */
export function useScreenWakeLock() {
  const [isWakeLockActive, setIsWakeLockActive] = useState<boolean>(false);
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const wakeLockSentinelRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'wakeLock' in navigator) {
      setIsSupported(true);
    }
  }, []);

  const requestWakeLock = useCallback(async () => {
    if (typeof window === 'undefined' || !('wakeLock' in navigator)) {
      return false;
    }
    try {
      if (wakeLockSentinelRef.current && !wakeLockSentinelRef.current.released) {
        setIsWakeLockActive(true);
        return true;
      }
      const sentinel = await (navigator as any).wakeLock.request('screen');
      wakeLockSentinelRef.current = sentinel;
      setIsWakeLockActive(true);

      sentinel.addEventListener('release', () => {
        setIsWakeLockActive(false);
      });
      return true;
    } catch (err) {
      console.warn('Screen WakeLock error:', err);
      setIsWakeLockActive(false);
      return false;
    }
  }, []);

  const releaseWakeLock = useCallback(async () => {
    try {
      if (wakeLockSentinelRef.current) {
        await wakeLockSentinelRef.current.release();
        wakeLockSentinelRef.current = null;
      }
      setIsWakeLockActive(false);
    } catch (err) {
      console.warn('Screen WakeLock release error:', err);
    }
  }, []);

  const toggleWakeLock = useCallback(() => {
    if (isWakeLockActive) {
      releaseWakeLock();
    } else {
      requestWakeLock();
    }
  }, [isWakeLockActive, releaseWakeLock, requestWakeLock]);

  // Automatically request on mount and re-acquire on visibility change (e.g. user unlocks phone or returns to tab)
  useEffect(() => {
    requestWakeLock();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
      releaseWakeLock();
    };
  }, [requestWakeLock, releaseWakeLock]);

  return {
    isWakeLockActive,
    isSupported,
    requestWakeLock,
    releaseWakeLock,
    toggleWakeLock
  };
}
