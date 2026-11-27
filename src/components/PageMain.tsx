import type { PropsWithChildren } from 'react';

export function PageMain({ children, className }: PropsWithChildren<{ className?: string }>) {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className={className}
    >
      {children}
    </main>
  );
}
