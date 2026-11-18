import { AlertOctagon, AlertTriangle, CheckCircle2, Info, ShieldCheck } from 'lucide-react';
import { ThreatLevel, VerdictType } from '../types';

export function ThreatLevelIndicator({ level }: { level: ThreatLevel }) {
  const config: Record<
    ThreatLevel,
    { color: string; bg: string; border: string; Icon: typeof CheckCircle2 }
  > = {
    Safe: {
      color: 'text-emerald-700 dark:text-[#00E676]',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/30',
      Icon: ShieldCheck,
    },
    Low: {
      color: 'text-emerald-700 dark:text-[#00E676]',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/30',
      Icon: CheckCircle2,
    },
    Medium: {
      color: 'text-amber-700 dark:text-[#FFC107]',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/30',
      Icon: Info,
    },
    High: {
      color: 'text-orange-700 dark:text-orange-400',
      bg: 'bg-orange-500/10',
      border: 'border-orange-500/30',
      Icon: AlertTriangle,
    },
    Critical: {
      color: 'text-red-700 dark:text-[#FF5252]',
      bg: 'bg-red-500/10',
      border: 'border-red-500/30',
      Icon: AlertOctagon,
    },
  };

  const { color, bg, border, Icon } = config[level] || config.Medium;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium whitespace-nowrap shrink-0 ${color} ${bg} ${border}`}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span>{level}</span>
    </span>
  );
}

export function VerdictIndicator({ verdict }: { verdict: VerdictType }) {
  const config: Record<
    VerdictType,
    { color: string; bg: string; border: string; Icon: typeof CheckCircle2 }
  > = {
    Safe: {
      color: 'text-emerald-700 dark:text-[#00E676]',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/30',
      Icon: CheckCircle2,
    },
    Suspicious: {
      color: 'text-amber-700 dark:text-[#FFC107]',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/30',
      Icon: AlertTriangle,
    },
    Phishing: {
      color: 'text-red-700 dark:text-[#FF5252]',
      bg: 'bg-red-500/10',
      border: 'border-red-500/30',
      Icon: AlertOctagon,
    },
  };

  const { color, bg, border, Icon } = config[verdict] || config.Suspicious;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-semibold whitespace-nowrap shrink-0 ${color} ${bg} ${border}`}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span>{verdict}</span>
    </span>
  );
}
