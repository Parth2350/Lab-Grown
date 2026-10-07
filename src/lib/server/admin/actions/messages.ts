'use server';
import 'server-only';
import { z } from 'zod';
import { db } from '@/lib/server/db';
import { adminAction, ok, parse, revalidateAdmin, zCuid } from '../action';
import type { ActionResult } from '../types';

export async function setMessageRead(id: string, isRead: boolean): Promise<ActionResult> {
  return adminAction(async () => {
    const row = await db.contactMessage.update({
      where: { id: parse(zCuid, id) },
      data: { isRead: parse(z.boolean(), isRead) },
      select: { isRead: true },
    });
    revalidateAdmin();
    return ok(row.isRead ? 'Marked as read' : 'Marked as unread');
  });
}

export async function markAllMessagesRead(): Promise<ActionResult> {
  return adminAction(async () => {
    const { count } = await db.contactMessage.updateMany({ where: { isRead: false }, data: { isRead: true } });
    revalidateAdmin();
    return ok(count ? `${count} message${count === 1 ? '' : 's'} marked as read` : 'Everything is already read');
  });
}

export async function deleteMessage(id: string): Promise<ActionResult> {
  return adminAction(async () => {
    const row = await db.contactMessage.delete({ where: { id: parse(zCuid, id) }, select: { name: true } });
    revalidateAdmin();
    return ok(`Message from ${row.name} deleted`);
  });
}
