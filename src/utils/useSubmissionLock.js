import { useEffect, useMemo, useState } from 'react';

const DAY_MS = 24 * 60 * 60 * 1000;
const PREFIX = 'aaocollege:form-lock:';

const cookieName = (key) => `${PREFIX}${key}`;

const setCookie = (name, value, days) => {
  try {
    const expires = days
      ? `; expires=${new Date(Date.now() + days * DAY_MS).toUTCString()}`
      : '';
    document.cookie = `${name}=${encodeURIComponent(value)}${expires}; path=/`;
  } catch (err) {
    console.warn('cookie set failed', err);
  }
};

const getCookie = (name) => {
  if (typeof document === 'undefined') return null;
  try {
    const cookies = document.cookie ? document.cookie.split('; ') : [];
    for (const c of cookies) {
      const [k, v] = c.split('=');
      if (k === name) return decodeURIComponent(v);
    }
  } catch (err) {
    console.warn('cookie read failed', err);
  }
  return null;
};

/**
 * Simple localStorage-backed flag to hide forms after one successful submit.
 * @param {string} key unique identifier shared across forms you want to lock together
 * @param {number} ttlDays optional expiry; default 180 days
 */
export function useSubmissionLock(key = 'lead-global', ttlDays = 180) {
  const storageKey = useMemo(() => `${PREFIX}${key}`, [key]);
  const cookieKey = useMemo(() => cookieName(key), [key]);

  const getInitial = () => {
    if (typeof window === 'undefined') return false;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return false;
      const parsed = JSON.parse(raw);
      const ttl = Number(parsed?.ttlDays || ttlDays);
      const ts = Number(parsed?.ts || 0);
      return ts && (!ttl || Date.now() - ts < ttl * DAY_MS);
    } catch (err) {
      console.warn('form lock parse failed', err);
      // fallback to cookie if JSON parse failed
      const cookieVal = getCookie(cookieKey);
      return cookieVal === '1';
    }
  };

  const [hasSubmitted, setHasSubmitted] = useState(getInitial);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const syncFromStorage = () => {
      try {
        const raw = window.localStorage.getItem(storageKey);
        let has = false;
        if (raw) {
          const parsed = JSON.parse(raw);
          const ttl = Number(parsed?.ttlDays || ttlDays);
          const ts = Number(parsed?.ts || 0);

          if (ts && (!ttl || Date.now() - ts < ttl * DAY_MS)) {
            has = true;
          } else {
            window.localStorage.removeItem(storageKey);
          }
        }

        if (!has) {
          const cookieVal = getCookie(cookieKey);
          has = cookieVal === '1';
        }

        setHasSubmitted(has);
      } catch (err) {
        console.warn('form lock parse failed', err);
      }
    };

    syncFromStorage();

    const onStorage = (event) => {
      if (event.key === storageKey) syncFromStorage();
    };

    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [storageKey, cookieKey, ttlDays]);

  const markSubmitted = () => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(
        storageKey,
        JSON.stringify({ ts: Date.now(), ttlDays })
      );
      setCookie(cookieKey, '1', ttlDays);
    } catch (err) {
      console.warn('form lock save failed', err);
    }
    setHasSubmitted(true);
  };

  const clearLock = () => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.removeItem(storageKey);
      setCookie(cookieKey, '', -1);
    } catch (err) {
      console.warn('form lock clear failed', err);
    }
    setHasSubmitted(false);
  };

  return { hasSubmitted, markSubmitted, clearLock };
}
