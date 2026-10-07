'use server';
import 'server-only';
import { z } from 'zod';
import { RequestStatus } from '@prisma/client';
import { db } from '@/lib/server/db';
import { adminAction, formObject, ok, parse, revalidateAdmin, zCuid, zOptText } from '../action';
import type { ActionResult, FormState } from '../types';

const statusSchema = z.nativeEnum(RequestStatus, { errorMap: () => ({ message: 'Choose a valid status' }) });

const LABEL: Record<RequestStatus, string> = {
  NEW: 'New',
  IN_REVIEW: 'In review',
  QUOTED: 'Quoted',
  IN_PRODUCTION: 'In production',
  COMPLETED: 'Completed',
  CLOSED: 'Closed',
};

const notesSchema = z.object({
  id: zCuid,
  adminNotes: zOptText(5000),
});

export async function setBespokeStatus(id: string, status: RequestStatus): Promise<ActionResult> {
  return adminAction(async () => {
    const requestId = parse(zCuid, id);
    const next = parse(statusSchema, status);
    const row = await db.bespokeRequest.update({ where: { id: requestId }, data: { status: next }, select: { name: true } });
    revalidateAdmin();
    return ok(`${row.name}’s request marked ${LABEL[next].toLowerCase()}`);
  });
}

export async function saveBespokeNotes(_prev: FormState, fd: FormData): Promise<FormState> {
  return adminAction(async () => {
    const { id, adminNotes } = parse(notesSchema, formObject(fd));
    await db.bespokeRequest.update({ where: { id }, data: { adminNotes }, select: { id: true } });
    revalidateAdmin();
    return ok(adminNotes ? 'Internal notes saved' : 'Internal notes cleared');
  });
}

export async function deleteBespokeRequest(id: string): Promise<ActionResult> {
  return adminAction(async () => {
    const row = await db.bespokeRequest.delete({ where: { id: parse(zCuid, id) }, select: { name: true } });
    revalidateAdmin();
    return ok(`${row.name}’s bespoke request deleted`);
  });
}
