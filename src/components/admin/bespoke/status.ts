/** Client-safe bespoke request status metadata (mirrors the Prisma RequestStatus enum). */

export const BESPOKE_PIPELINE = ['NEW', 'IN_REVIEW', 'QUOTED', 'IN_PRODUCTION', 'COMPLETED'] as const;
export const BESPOKE_STATUSES = [...BESPOKE_PIPELINE, 'CLOSED'] as const;
export type BespokeStatus = (typeof BESPOKE_STATUSES)[number];

export const BESPOKE_STATUS_LABEL: Record<BespokeStatus, string> = {
  NEW: 'New',
  IN_REVIEW: 'In review',
  QUOTED: 'Quoted',
  IN_PRODUCTION: 'In production',
  COMPLETED: 'Completed',
  CLOSED: 'Closed / declined',
};

/** Short guidance shown under the stepper for the current stage. */
export const BESPOKE_STATUS_HINT: Record<BespokeStatus, string> = {
  NEW: 'Just arrived — review the brief and reach out to the client.',
  IN_REVIEW: 'Our design team is reviewing the brief and preparing options.',
  QUOTED: 'A quote has been sent — waiting for the client to confirm.',
  IN_PRODUCTION: 'Confirmed and being crafted in the workshop.',
  COMPLETED: 'Delivered — this commission is complete.',
  CLOSED: 'Closed or declined — no further action is expected.',
};

export function nextBespokeStatus(status: BespokeStatus): BespokeStatus | null {
  const i = (BESPOKE_PIPELINE as readonly string[]).indexOf(status);
  return i >= 0 && i < BESPOKE_PIPELINE.length - 1 ? BESPOKE_PIPELINE[i + 1] : null;
}

/** Short, human-friendly reference — matches the one shown to the client when they submitted. */
export function bespokeReference(id: string) {
  return `BSP-${id.slice(-6).toUpperCase()}`;
}
