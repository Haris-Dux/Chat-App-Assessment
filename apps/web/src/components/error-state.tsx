import type { ReactNode } from 'react';
import { Button } from './ui/button';

export function ErrorState({
  message,
  onRetry,
  children,
}: {
  message: string;
  onRetry?: () => void;
  children?: ReactNode;
}) {
  return (
    <div className="grid h-full place-items-center px-6">
      <div className="max-w-sm text-center">
        <p className="font-display text-2xl">{message}</p>
        <div className="mt-6 flex justify-center gap-3">
          {onRetry && (
            <Button variant="outline" onClick={onRetry}>
              Try again
            </Button>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}
