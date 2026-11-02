import React from 'react';

interface SummaryCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  accentColor: 'purple' | 'pink' | 'amber' | 'blue';
}

export const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  accentColor
}) => {
  const colorMap = {
    purple: {
      bg: 'bg-purple-50',
      text: 'text-purple-600',
      border: 'border-purple-100',
      shadow: 'shadow-purple-50'
    },
    pink: {
      bg: 'bg-pink-50',
      text: 'text-pink-600',
      border: 'border-pink-100',
      shadow: 'shadow-pink-50'
    },
    amber: {
      bg: 'bg-amber-50',
      text: 'text-amber-600',
      border: 'border-amber-100',
      shadow: 'shadow-amber-50'
    },
    blue: {
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      border: 'border-blue-100',
      shadow: 'shadow-blue-50'
    }
  };

  const scheme = colorMap[accentColor];

  return (
    <div className={`p-5 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between`}>
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {subtitle && <p className="text-xs text-gray-500 font-medium">{subtitle}</p>}
      </div>
      <div className={`w-12 h-12 rounded-2xl ${scheme.bg} ${scheme.text} flex items-center justify-center`}>
        {icon}
      </div>
    </div>
  );
};

