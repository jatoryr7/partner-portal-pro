import React from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export type MedicalStatusType = 'approved' | 'iotp_issued' | 'pending' | 'in_review' | 'rejected' | 'none';

interface MedicalStatusIndicatorProps {
  status: MedicalStatusType;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const STATUS_CONFIG: Record<MedicalStatusType, { color: string; bgColor: string; label: string; description: string }> = {
  approved: {
    color: 'bg-emerald-500',
    bgColor: 'bg-emerald-500/20',
    label: 'Approved',
    description: 'Medical review approved',
  },
  iotp_issued: {
    color: 'bg-[hsl(var(--amber-alert))]',
    bgColor: 'bg-[hsl(var(--amber-alert-light))]',
    label: 'IOTP Issued',
    description: 'Requires revisions to pass',
  },
  in_review: {
    color: 'bg-[hsl(var(--pulse-blue))]',
    bgColor: 'bg-[hsl(var(--pulse-blue-light))]',
    label: 'In Review',
    description: 'Currently under medical review',
  },
  pending: {
    color: 'bg-gray-400',
    bgColor: 'bg-gray-200',
    label: 'Pending',
    description: 'Awaiting review',
  },
  rejected: {
    color: 'bg-red-500',
    bgColor: 'bg-red-100',
    label: 'Rejected',
    description: 'Did not pass medical review',
  },
  none: {
    color: 'bg-gray-300',
    bgColor: 'bg-gray-100',
    label: 'No Review',
    description: 'No medical review initiated',
  },
};

const SIZE_CONFIG = {
  sm: { dot: 'h-2 w-2', ring: 'h-4 w-4' },
  md: { dot: 'h-2.5 w-2.5', ring: 'h-5 w-5' },
  lg: { dot: 'h-3 w-3', ring: 'h-6 w-6' },
};

export function MedicalStatusIndicator({ 
  status, 
  size = 'md',
  showLabel = false,
}: MedicalStatusIndicatorProps) {
  const config = STATUS_CONFIG[status];
  const sizeConfig = SIZE_CONFIG[size];

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={`flex items-center gap-2 ${showLabel ? 'cursor-default' : 'cursor-help'}`}>
          <div className={`${sizeConfig.ring} ${config.bgColor} rounded-full flex items-center justify-center`}>
            <div className={`${sizeConfig.dot} ${config.color} rounded-full`} />
          </div>
          {showLabel && (
            <span className="text-xs font-medium text-muted-foreground">
              {config.label}
            </span>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="rounded-none bg-[hsl(var(--medical-slate))] text-[hsl(var(--medical-slate-foreground))]">
        <div className="text-xs">
          <p className="font-semibold">{config.label}</p>
          <p className="opacity-75">{config.description}</p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

// Helper function to convert database status to UI status
export function mapMedicalStatus(dbStatus: string | null | undefined): MedicalStatusType {
  if (!dbStatus) return 'none';
  switch (dbStatus) {
    case 'approved': return 'approved';
    case 'requires_revision': return 'iotp_issued';
    case 'in_medical_review': return 'in_review';
    case 'pending_bd_approval': return 'pending';
    case 'rejected': return 'rejected';
    default: return 'none';
  }
}
