'use client';
import { Star } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Field, Label, Textarea } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';

export function ReviewForm({ productId, productName }: { productId: string; productName: string }) {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [state, setState] = useState<'idle' | 'loading' | 'done'>('idle');
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (state === 'done') {
    return (
      <p className="mt-8 border border-line bg-white p-5 text-sm text-charcoal" role="status">
        Thank you for reviewing the {productName}. Your review will appear once our team has approved it.
      </p>
    );
  }
  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="label-caps mt-8 h-12 w-full border border-ink transition-colors hover:bg-ink hover:text-ivory">
        Write a Review
      </button>
    );
  }
  return (
    <form
      className="mt-8 space-y-4 border border-line bg-white p-5"
      onSubmit={async (e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        setState('loading');
        setErrors({});
        const res = await fetch('/api/reviews', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId,
            rating,
            authorName: f.get('authorName'),
            location: f.get('location'),
            title: f.get('title'),
            body: f.get('body'),
          }),
        });
        if (res.ok) setState('done');
        else {
          const data = await res.json().catch(() => ({}));
          setErrors(data.fieldErrors ?? { form: data.error ?? 'Something went wrong. Please try again.' });
          setState('idle');
        }
      }}
    >
      <div>
        <Label>Your rating</Label>
        <div className="flex gap-1" role="radiogroup" aria-label="Rating">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={rating === n}
              aria-label={`${n} star${n > 1 ? 's' : ''}`}
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              onClick={() => setRating(n)}
            >
              <Star className={cn('h-6 w-6 transition-colors', (hover || rating) >= n ? 'fill-gold text-gold' : 'text-stone')} strokeWidth={1} />
            </button>
          ))}
        </div>
      </div>
      <Field label="Name" name="authorName" required defaultValue={session?.user?.name ?? ''} error={errors.authorName} autoComplete="name" />
      <Field label="Location" name="location" placeholder="City, Country" error={errors.location} />
      <Field label="Review title" name="title" required error={errors.title} maxLength={120} />
      <div>
        <Label htmlFor="review-body" required>
          Your review
        </Label>
        <Textarea id="review-body" name="body" required minLength={10} maxLength={2000} />
        {errors.body && <p className="mt-1.5 text-xs text-danger">{errors.body}</p>}
      </div>
      {errors.form && <p className="text-xs text-danger">{errors.form}</p>}
      <Button type="submit" loading={state === 'loading'} className="w-full">
        Submit Review
      </Button>
    </form>
  );
}
