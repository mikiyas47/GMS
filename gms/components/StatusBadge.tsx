import React from 'react';

interface StatusBadgeProps {
  status: 'active' | 'frozen' | 'expired' | 'cancelled' | 'expiring' | string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const norm = (status || '').toLowerCase();

  let bg = 'bg-gray-100 text-gray-700 border-gray-300';
  let dot = 'bg-gray-400';
  let label = status || 'Unknown';

  if (norm === 'active') {
    bg = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    dot = 'bg-emerald-500';
    label = 'Active';
  } else if (norm === 'frozen') {
    bg = 'bg-amber-50 text-amber-700 border-amber-200';
    dot = 'bg-amber-500';
    label = 'Frozen';
  } else if (norm === 'expiring' || norm === 'expiring soon') {
    bg = 'bg-amber-50 text-amber-800 border-amber-300';
    dot = 'bg-amber-500';
    label = 'Expiring Soon';
  } else if (norm === 'expired') {
    bg = 'bg-rose-50 text-rose-700 border-rose-200';
    dot = 'bg-rose-500';
    label = 'Expired';
  } else if (norm === 'cancelled') {
    bg = 'bg-slate-100 text-slate-600 border-slate-300';
    dot = 'bg-slate-400';
    label = 'Cancelled';
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide border ${bg} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} aria-hidden="true" />
      {label}
    </span>
  );
};
