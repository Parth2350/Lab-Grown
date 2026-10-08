'use client';
import { useState, type KeyboardEvent } from 'react';
import { ChevronLeft, ChevronRight, Plus, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { savePopularSearches } from '@/lib/server/admin/actions/settings';
import { cn } from '@/lib/utils';
import { FormBanner, SubmitButton, useAdminForm } from '../forms';
import { Panel, fieldSm } from '../ui';
import { Counter, PanelFooter, settingsLabel } from './shared';
import { listErrors, useKeyedList } from './useKeyedList';

const MAX_ITEMS = 12;
const MAX_LEN = 40;

export function PopularSearchesForm({ initial }: { initial: string[] }) {
  const form = useAdminForm(savePopularSearches);
  const list = useKeyedList(initial);
  const [draft, setDraft] = useState('');
  const [hint, setHint] = useState<string | null>(null);

  const errors = listErrors(form.state && !form.state.ok ? form.state.fieldErrors : undefined, 'items');
  const itemErrors = list.items.map((_, i) => errors.at(i)).filter((e): e is string => Boolean(e));
  const dirty = JSON.stringify(list.items.map((it) => it.text)) !== JSON.stringify(initial);
  const full = list.items.length >= MAX_ITEMS;

  const add = () => {
    const value = draft.replace(/\s+/g, ' ').trim();
    if (!value) return setHint('Type a search term first.');
    if (value.length > MAX_LEN) return setHint(`Keep each search to ${MAX_LEN} characters or fewer.`);
    if (list.items.some((it) => it.text.toLowerCase() === value.toLowerCase())) return setHint(`“${value}” is already in the list.`);
    if (full) return setHint(`You can feature up to ${MAX_ITEMS} searches.`);
    list.add(value);
    setDraft('');
    setHint(null);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // add the chip instead of submitting the form
      add();
    }
  };

  return (
    <form onSubmit={form.onSubmit} noValidate>
      <Panel
        id="popular-searches"
        title="Popular searches"
        description="Suggested in the storefront search overlay before a customer starts typing."
        footer={
          <PanelFooter note={`${list.items.length}/${MAX_ITEMS} searches · up to ${MAX_LEN} characters each`}>
            {dirty && <span className="text-xs text-gold-deep">Unsaved changes</span>}
            <SubmitButton pending={form.pending} pendingLabel="Saving…">
              Save searches
            </SubmitButton>
          </PanelFooter>
        }
      >
        <FormBanner state={form.state && !form.state.ok ? form.state : null} className="mb-4" />

        {list.items.length ? (
          <ul className="flex flex-wrap gap-2" aria-label="Popular searches, in display order">
            {list.items.map((item, i) => (
              <li key={item.key} className={cn('inline-flex items-stretch border bg-ivory text-[15px] text-ink', errors.at(i) ? 'border-danger' : 'border-line')}>
                <input type="hidden" name="items" value={item.text} />
                <button
                  type="button"
                  onClick={() => list.move(item.key, -1)}
                  disabled={i === 0}
                  aria-label={`Move “${item.text}” earlier`}
                  title="Move earlier"
                  className="flex w-7 items-center justify-center text-taupe transition-colors hover:text-ink disabled:pointer-events-none disabled:opacity-25"
                >
                  <ChevronLeft className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
                </button>
                <span className="flex items-center gap-1.5 py-1.5">
                  <Search className="h-3 w-3 text-taupe" strokeWidth={1.5} aria-hidden />
                  {item.text}
                </span>
                <button
                  type="button"
                  onClick={() => list.move(item.key, 1)}
                  disabled={i === list.items.length - 1}
                  aria-label={`Move “${item.text}” later`}
                  title="Move later"
                  className="flex w-7 items-center justify-center text-taupe transition-colors hover:text-ink disabled:pointer-events-none disabled:opacity-25"
                >
                  <ChevronRight className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => list.remove(item.key)}
                  aria-label={`Remove “${item.text}”`}
                  title="Remove"
                  className="flex w-8 items-center justify-center border-l border-line text-taupe transition-colors hover:bg-white hover:text-danger"
                >
                  <X className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="border border-dashed border-line bg-ivory px-4 py-3 text-xs text-taupe">No popular searches — the search overlay will open without suggestions.</p>
        )}
        {(errors.root || itemErrors.length > 0) && (
          <ul className="mt-2 space-y-0.5 text-xs text-danger" role="alert">
            {errors.root && <li>{errors.root}</li>}
            {itemErrors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        )}

        <div className="mt-5 max-w-md">
          <div className="flex items-baseline justify-between gap-3">
            <label htmlFor="popular-search-new" className={settingsLabel}>
              Add a search
            </label>
            <Counter value={draft.length} max={MAX_LEN} />
          </div>
          <div className="flex gap-2">
            <input
              id="popular-search-new"
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                if (hint) setHint(null);
              }}
              onKeyDown={onKeyDown}
              maxLength={MAX_LEN}
              disabled={full}
              placeholder={full ? `Limit of ${MAX_ITEMS} reached` : 'e.g. oval engagement ring'}
              aria-describedby={hint ? 'popular-search-hint' : undefined}
              className={cn(fieldSm, 'min-w-0 flex-1')}
            />
            <Button type="button" size="sm" variant="outline" onClick={add} disabled={full}>
              <Plus className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
              Add
            </Button>
          </div>
          {hint && (
            <p id="popular-search-hint" className="mt-1 text-xs text-[#7A5718]" role="status">
              {hint}
            </p>
          )}
        </div>
      </Panel>
    </form>
  );
}
