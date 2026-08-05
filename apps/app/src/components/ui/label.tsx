import type { ComponentProps } from 'react';

import { cn } from '@/lib/utils';

function Label({ className, ...props }: ComponentProps<'label'>) {
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: generic primitive; callers pass htmlFor or nest the control, neither visible to the rule here.
    <label
      className={cn(
        'flex items-center gap-2 text-sm leading-none font-medium select-none',
        'peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
        className
      )}
      {...props}
    />
  );
}

export { Label };
