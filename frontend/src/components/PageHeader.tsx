import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  action?: ReactNode;
}

export default function PageHeader({ title, action }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <h1 className="min-w-0 text-2xl font-semibold text-gray-900">{title}</h1>
      {action && <div className="min-w-0">{action}</div>}
    </div>
  );
}
