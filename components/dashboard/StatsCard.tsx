import React from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  iconBgColor: string;
  iconColor: string;
}

export function StatsCard({ title, value, icon: Icon, iconBgColor, iconColor }: StatsCardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow duration-200 flex flex-col gap-3">
      <div className={`p-3 w-11 h-11 rounded-[12px] flex items-center justify-center shrink-0 ${iconBgColor} ${iconColor}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="m-0 mb-1 text-xs font-medium text-slate-400 uppercase tracking-wide">{title}</p>
        <h3 className="m-0 text-3xl font-bold text-slate-900">{value}</h3>
      </div>
    </div>
  );
}
