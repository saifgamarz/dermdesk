import React from 'react';

interface EmptyStateProps {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, subtitle, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center min-h-[400px] bg-white rounded-xl border border-slate-200">
      <div className="w-16 h-16 bg-slate-50 flex items-center justify-center rounded-full mb-4">
        <Icon className="w-8 h-8 text-slate-300" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 max-w-sm mb-6">{subtitle}</p>
      {action && <div>{action}</div>}
    </div>
  );
}
