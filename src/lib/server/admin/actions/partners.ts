'use server';
import 'server-only';
import { z } from 'zod';
import { ApplicationStatus } from '@prisma/client';
import { db } from '@/lib/server/db';
import { adminAction, ok, parse, revalidateAdmin, zCuid } from '../action';
import type { ActionResult } from '../types';

const statusSchema = z.nativeEnum(ApplicationStatus, { errorMap: () => ({ message: 'Choose a valid status' }) });

const PAST: Record<ApplicationStatus, string> = { APPROVED: 'approved', REJECTED: 'rejected', PENDING: 'moved back to pending' };

export async function setPartnerStatus(id: string, status: ApplicationStatus): Promise<ActionResult> {
  return adminAction(async () => {
    const applicationId = parse(zCuid, id);
    const next = parse(statusSchema, status);
    const row = await db.partnerApplication.update({ where: { id: applicationId }, data: { status: next }, select: { name: true } });
    revalidateAdmin();
    return ok(`${row.name}’s application ${PAST[next]}`);
  });
}

export async function deletePartnerApplication(id: string): Promise<ActionResult> {
  return adminAction(async () => {
    const row = await db.partnerApplication.delete({ where: { id: parse(zCuid, id) }, select: { name: true } });
    revalidateAdmin();
    return ok(`${row.name}’s application deleted`);
  });
}
