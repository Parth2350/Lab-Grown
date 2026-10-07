import { SearchX } from 'lucide-react';
import { ButtonLink } from '@/components/ui/Button';
import { EmptyState } from '@/components/admin/ui';

export default function AdminNotFound() {
  return (
    <div className="border border-line bg-white">
      <EmptyState
        icon={<SearchX className="h-5 w-5" strokeWidth={1.25} />}
        title="Not found"
        description="This record does not exist or has been deleted."
        action={
          <ButtonLink href="/admin" size="sm" variant="outline">
            Back to dashboard
          </ButtonLink>
        }
      />
    </div>
  );
}
