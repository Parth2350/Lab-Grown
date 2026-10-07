/**
 * Type-only module shared by admin server actions and the client components that call them.
 * (No runtime code — safe to `import type` from client components.)
 */

export type ActionResult<T = unknown> =
  | { ok: true; message?: string; data?: T }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

/** State shape for forms driven by `useActionState(action, null)` */
export type FormState<T = unknown> = ActionResult<T> | null;

/** Signature of a server action used with useActionState */
export type FormAction<T = unknown> = (prev: FormState<T>, formData: FormData) => Promise<FormState<T>>;

/** Signature of a bound server action used by buttons (e.g. `approve.bind(null, id)`) */
export type BoundAction<T = unknown> = () => Promise<ActionResult<T>>;
