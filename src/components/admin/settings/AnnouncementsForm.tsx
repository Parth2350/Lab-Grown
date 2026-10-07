'use client';
import { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { saveAnnouncements } from '@/lib/server/admin/actions/settings';
import { cn } from '@/lib/utils';
import { FormBanner, SubmitButton, useAdminForm } from '../forms';
import { Panel, fieldSm } from '../ui';
import { Counter, IconButton, PanelFooter, settingsLabel } from './shared';
import { listErrors, useKeyedList } from './useKeyedList';

const MAX_ITEMS = 12;
const MAX_LEN = 120;

/** Thin ink strip mirroring the storefront bar (static — the live bar scrolls). */
function AnnouncementPreview({ messages }: { messages: string[] }) {
  return (
    <div>
      <p className={settingsLabel}>Preview</p>
      {messages.length ? (
        <div className="no-scrollbar overflow-x-auto bg-ink" role="img" aria-label={`Announcement bar preview: ${messages.join(', ')}`}>
          <ul className="flex w-max items-center px-5 py-2.5" aria-hidden>
            {messages.map((m, i) => (
              <li key={i} className="flex items-center whitespace-nowrap text-[10px] font-medium uppercase tracking-[0.22em] text-ivory">
                {i > 0 && <span className="mx-6 h-1 w-1 rotate-45 bg-gold-light" />}
                {m}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="border border-dashed border-line bg-ivory px-4 py-2.5 text-xs text-taupe">No messages — the announcement bar is hidden on the storefront.</div>
      )}
    </div>
  );
}

export function AnnouncementsForm({ initial }: { initial: string[] }) {
  const form = useAdminForm(saveAnnouncements);
  const list = useKeyedList(initial);
  const [focusKey, setFocusKey] = useState<number | null>(null);

  useEffect(() => {
    if (focusKey == null) return;
    document.getElementById(`announcement-${focusKey}`)?.focus();
    setFocusKey(null);
  }, [focusKey]);

  const errors = listErrors(form.state && !form.state.ok ? form.state.fieldErrors : undefined, 'items');
  const preview = list.items.map((it) => it.text.replace(/\s+/g, ' ').trim()).filter(Boolean);
  const dirty = JSON.stringify(list.items.map((it) => it.text)) !== JSON.stringify(initial);
  const full = list.items.length >= MAX_ITEMS;

  return (
    <form onSubmit={form.onSubmit} noValidate>
      <Panel
        id="announcements"
        title="Announcement bar"
        description="Short brand promises shown in the thin bar above the storefront header."
        footer={
          <PanelFooter note={`${list.items.length}/${MAX_ITEMS} messages · up to ${MAX_LEN} characters each`}>
            {dirty && <span className="text-xs text-gold-deep">Unsaved changes</span>}
            <SubmitButton pending={form.pending} pendingLabel="Saving…">
              Save announcements
            </SubmitButton>
          </PanelFooter>
        }
      >
        <FormBanner state={form.state && !form.state.ok ? form.state : null} className="mb-4" />
        <AnnouncementPreview messages={preview} />

        <p className={cn(settingsLabel, 'mt-6')} id="announcements-label">
          Messages
        </p>
        {list.items.length > 0 && (
          <ol className="space-y-2" aria-labelledby="announcements-label">
            {list.items.map((item, i) => {
              const error = errors.at(i);
              return (
                <li key={item.key}>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span className="w-5 shrink-0 text-right text-[11px] tabular-nums text-taupe" aria-hidden>
                      {i + 1}
                    </span>
                    <input
                      id={`announcement-${item.key}`}
                      name="items"
                      value={item.text}
                      onChange={(e) => list.update(item.key, e.target.value)}
                      maxLength={MAX_LEN}
                      aria-label={`Message ${i + 1}`}
                      aria-invalid={error ? true : undefined}
                      aria-describedby={error ? `announcement-${item.key}-error` : undefined}
                      placeholder="e.g. Free insured worldwide shipping"
                      className={cn(fieldSm, 'min-w-0 flex-1', error && 'border-danger')}
                    />
                    <Counter value={item.text.length} max={MAX_LEN} className="hidden w-14 shrink-0 text-right sm:inline" />
                    <IconButton label={`Move message ${i + 1} up`} onClick={() => list.move(item.key, -1)} disabled={i === 0}>
                      <ArrowUp className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
                    </IconButton>
                    <IconButton label={`Move message ${i + 1} down`} onClick={() => list.move(item.key, 1)} disabled={i === list.items.length - 1}>
                      <ArrowDown className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
                    </IconButton>
                    <IconButton label={`Remove message ${i + 1}`} tone="danger" onClick={() => list.remove(item.key)}>
                      <X className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
                    </IconButton>
                  </div>
                  {error && (
                    <p id={`announcement-${item.key}-error`} className="ml-7 mt-1 text-xs text-danger" role="alert">
                      {error}
                    </p>
                  )}
                </li>
              );
            })}
          </ol>
        )}
        {errors.root && (
          <p className="mt-2 text-xs text-danger" role="alert">
            {errors.root}
          </p>
        )}
        <Button type="button" size="sm" variant="ghost" className="mt-3 border border-dashed border-line" onClick={() => setFocusKey(list.add(''))} disabled={full}>
          <Plus className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
          {full ? `Limit of ${MAX_ITEMS} reached` : 'Add message'}
        </Button>
      </Panel>
    </form>
  );
}
