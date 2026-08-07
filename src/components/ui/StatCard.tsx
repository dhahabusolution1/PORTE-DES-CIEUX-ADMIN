import React from 'react';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  description?: string;
  variant?: 'primary' | 'success' | 'warning' | 'info' | 'accent';
}

export function StatCard({ title, value, icon, description, variant = 'accent' }: StatCardProps) {
  const variants = {
    primary: 'border-primary-200 bg-surface',
    success: 'border-emerald-200 bg-surface',
    warning: 'border-amber-200 bg-surface',
    info:    'border-[#F59E0B]/40 bg-surface',
    accent:  'border-accent-200 bg-surface',
  };

  const iconColors = {
    primary: 'bg-primary-500 text-white',
    success: 'bg-emerald-500 text-white',
    warning: 'bg-amber-500 text-white',
    info:    'bg-[#F59E0B] text-[#0B0618]',
    accent:  'bg-accent-600 text-white',
  };

  const labelColors = {
    primary: 'text-primary-600',
    success: 'text-emerald-600',
    warning: 'text-amber-600',
    info:    'text-[#F59E0B]',
    accent:  'text-accent-500',
  };

  return (
    <div className={`border rounded-lg p-5 flex justify-between items-start transition-colors ${variants[variant]}`}>
      <div className="space-y-1">
        <p className={`text-[10px] font-bold uppercase tracking-widest ${labelColors[variant]}`}>
          {title}
        </p>
        <p className="text-2xl font-black text-accent-900 tracking-tight">
          {value}
        </p>
        {description && (
          <p className="text-[10px] text-accent-400 font-medium leading-tight">
            {description}
          </p>
        )}
      </div>
      
      <div className={`w-10 h-10 rounded-md flex items-center justify-center shrink-0 ${iconColors[variant]}`}>
        {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: 'w-5 h-5' })}
      </div>
    </div>
  );
}
