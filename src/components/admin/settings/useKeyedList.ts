'use client';
import { useCallback, useRef, useState } from 'react';

export type KeyedItem = { key: number; text: string };

/** Ordered list of strings with stable React keys — add / edit / remove / move. */
export function useKeyedList(initial: string[]) {
  const seq = useRef(0);
  const [items, setItems] = useState<KeyedItem[]>(() => initial.map((text) => ({ key: ++seq.current, text })));

  const add = useCallback((text = '') => {
    const key = ++seq.current;
    setItems((prev) => [...prev, { key, text }]);
    return key;
  }, []);

  const update = useCallback((key: number, text: string) => setItems((prev) => prev.map((it) => (it.key === key ? { ...it, text } : it))), []);

  const remove = useCallback((key: number) => setItems((prev) => prev.filter((it) => it.key !== key)), []);

  const move = useCallback(
    (key: number, delta: -1 | 1) =>
      setItems((prev) => {
        const i = prev.findIndex((it) => it.key === key);
        const j = i + delta;
        if (i < 0 || j < 0 || j >= prev.length) return prev;
        const next = [...prev];
        [next[i], next[j]] = [next[j], next[i]];
        return next;
      }),
    [],
  );

  return { items, add, update, remove, move };
}

/** Server field errors for an array field ("items" and "items.N"). */
export function listErrors(fieldErrors: Record<string, string> | undefined, name: string) {
  return {
    root: fieldErrors?.[name],
    at: (i: number) => fieldErrors?.[`${name}.${i}`],
  };
}
