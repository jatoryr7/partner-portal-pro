import React from 'react';
import { Card } from '@/components/ui/card';
import { ClipboardList, Microscope, CheckCircle2, XCircle, DollarSign } from 'lucide-react';
import { useMedicalReviewStats } from '@/hooks/useMedicalReviews';

export function MedicalReviewStats() {
  const { data: stats, isLoading } = useMedicalReviewStats();

  const cards = [
    {
      title: 'Pending BD Approval',
      value: stats?.pending_bd ?? 0,
      icon: ClipboardList,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
    },
    {
      title: 'In Medical Review',
      value: stats?.in_review ?? 0,
      icon: Microscope,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Approved',
      value: stats?.approved ?? 0,
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
    {
      title: 'Rejected',
      value: stats?.rejected ?? 0,
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      title: 'Pipeline Value',
      value: `$${((stats?.total_pipeline_value ?? 0) / 1000).toFixed(0)}K`,
      icon: DollarSign,
      color: 'text-teal-600',
      bgColor: 'bg-teal-50',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {cards.map((card) => (
        <Card 
          key={card.title} 
          className="p-4 rounded-none border-border/50 bg-card"
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 ${card.bgColor} rounded-none`}>
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                {card.title}
              </p>
              <p className={`text-2xl font-bold ${card.color}`}>
                {isLoading ? '—' : card.value}
              </p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
