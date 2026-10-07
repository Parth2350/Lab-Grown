'use client';
import { useEffect, useState } from 'react';

/** True after the first client render — use to gate UI that reads persisted (localStorage) state. */
export function useMounted() {
  const [m, setM] = useState(false);
  useEffect(() => setM(true), []);
  return m;
}
