import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Shield, 
  CheckCircle2, 
  ExternalLink, 
  ArrowLeft,
  Beaker,
  ShieldCheck,
  Eye,
  AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface BrandProfile {
  id: string;
  partner_id: string;
  overall_grade: string | null;
  status: string;
  clinical_evidence_score: number | null;
  safety_score: number | null;
  transparency_score: number | null;
  clinical_claims: string[] | null;
  safety_concerns: string[] | null;
  required_disclaimers: string[] | null;
  medical_notes: string | null;
  partner: {
    id: string;
    company_name: string;
    primary_contact_email: string | null;
  } | null;
}

const getGradeConfig = (grade: string | null) => {
  switch (grade?.toUpperCase()) {
    case 'A':
      return {
        color: 'bg-emerald-500',
        textColor: 'text-emerald-500',
        label: 'Excellent',
        description: 'Meets the highest standards for clinical evidence, safety, and transparency.',
      };
    case 'B':
      return {
        color: 'bg-healthcare-teal',
        textColor: 'text-healthcare-teal',
        label: 'Good',
        description: 'Strong evidence base with minor areas for improvement.',
      };
    case 'C':
      return {
        color: 'bg-amber-500',
        textColor: 'text-amber-500',
        label: 'Acceptable',
        description: 'Meets basic requirements but has notable gaps in documentation.',
      };
    case 'D':
      return {
        color: 'bg-orange-500',
        textColor: 'text-orange-500',
        label: 'Below Standard',
        description: 'Significant concerns identified. Requires improvement.',
      };
    case 'F':
      return {
        color: 'bg-destructive',
        textColor: 'text-destructive',
        label: 'Failed',
        description: 'Does not meet minimum standards for verification.',
      };
    default:
      return {
        color: 'bg-muted',
        textColor: 'text-muted-foreground',
        label: 'Pending',
        description: 'Evaluation in progress.',
      };
  }
};

const isVerified = (grade: string | null): boolean => {
  return grade?.toUpperCase() === 'A' || grade?.toUpperCase() === 'B';
};

export default function BrandProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: brand, isLoading, error } = useQuery({
    queryKey: ['public-brand', id],
    queryFn: async () => {
      if (!id) throw new Error('Brand ID required');

      const { data, error } = await supabase
        .from('medical_reviews')
        .select(`
          id,
          partner_id,
          overall_grade,
          status,
          clinical_evidence_score,
          safety_score,
          transparency_score,
          clinical_claims,
          safety_concerns,
          required_disclaimers,
          medical_notes,
          partner:partners (
            id,
            company_name,
            primary_contact_email
          )
        `)
        .eq('id', id)
        .eq('status', 'approved')
        .single();

      if (error) throw error;
      return data as unknown as BrandProfile;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-8 w-32 mb-8" />
          <Skeleton className="h-48 w-full mb-6" />
          <div className="grid grid-cols-3 gap-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !brand) {
    return (
      <div className="min-h-screen bg-background py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <Shield className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Brand Not Found</h1>
          <p className="text-muted-foreground mb-6">
            This brand profile is not available or has not been verified yet.
          </p>
          <Button onClick={() => navigate('/brands')} variant="outline" className="rounded-none">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Directory
          </Button>
        </div>
      </div>
    );
  }

  const gradeConfig = getGradeConfig(brand.overall_grade);
  const verified = isVerified(brand.overall_grade);

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <div className="border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/brands')}
            className="rounded-none"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Directory
          </Button>
        </div>
      </div>

      {/* Header Section */}
      <section className="py-12 px-4 border-b bg-gradient-to-br from-background via-background to-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl md:text-4xl font-bold">
                  {brand.partner?.company_name || 'Unknown Brand'}
                </h1>
                {verified && (
                  <div className="flex items-center gap-1 text-blue-500">
                    <CheckCircle2 className="h-7 w-7" />
                  </div>
                )}
              </div>
              
              {verified && (
                <Badge className="rounded-none bg-blue-500/10 text-blue-500 border-blue-500/20 hover:bg-blue-500/20">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Verified Partner
                </Badge>
              )}

              <p className={cn("mt-4 text-lg", gradeConfig.textColor)}>
                {gradeConfig.label}: {gradeConfig.description}
              </p>
            </div>

            {/* Grade Badge */}
            <div className="flex flex-col items-center">
              <div className={cn(
                "w-28 h-28 flex items-center justify-center text-5xl font-bold text-white shadow-lg",
                gradeConfig.color
              )}>
                {brand.overall_grade || '—'}
              </div>
              <span className="mt-2 text-sm text-muted-foreground font-medium">
                Medical Grade
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Metrics Section */}
      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <Shield className="h-5 w-5 text-healthcare-teal" />
            Evaluation Metrics
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <MetricCard
              icon={Beaker}
              title="Clinical Evidence"
              score={brand.clinical_evidence_score}
              description="Strength of scientific research and clinical trials supporting product claims."
            />
            <MetricCard
              icon={ShieldCheck}
              title="Safety Standards"
              score={brand.safety_score}
              description="Adherence to safety protocols, manufacturing standards, and regulatory compliance."
            />
            <MetricCard
              icon={Eye}
              title="Transparency"
              score={brand.transparency_score}
              description="Clarity of ingredient disclosure, sourcing information, and business practices."
            />
          </div>
        </div>
      </section>

      {/* Disclaimers Section */}
      {brand.required_disclaimers && brand.required_disclaimers.length > 0 && (
        <section className="py-12 px-4 bg-muted/30 border-y">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Required Disclaimers
            </h2>

            <Card className="rounded-none border-2 border-amber-500/20">
              <CardContent className="p-6">
                <ul className="space-y-2">
                  {brand.required_disclaimers.map((disclaimer, index) => (
                    <li key={index} className="flex items-start gap-2 text-muted-foreground">
                      <span className="text-amber-500 mt-1">•</span>
                      <span>{disclaimer}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">
            Interested in This Brand?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Visit the brand's official website to learn more about their products and services.
          </p>

          <Button
            size="lg"
            className="rounded-none bg-healthcare-teal hover:bg-healthcare-teal/90 text-white shadow-lg"
            onClick={() => {
              // In production, this would link to the brand's actual URL
              window.open('#', '_blank');
            }}
          >
            <ExternalLink className="h-5 w-5 mr-2" />
            Shop Verified Product
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t bg-muted/20">
        <div className="max-w-6xl mx-auto text-center text-sm text-muted-foreground">
          <p>
            All evaluations are conducted by licensed medical professionals. 
            Grades reflect our assessment at the time of review and may be updated.
          </p>
        </div>
      </footer>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  title,
  score,
  description,
}: {
  icon: React.ElementType;
  title: string;
  score: number | null;
  description: string;
}) {
  const percentage = score ?? 0;
  
  const getScoreColor = (value: number) => {
    if (value >= 80) return 'text-emerald-500';
    if (value >= 60) return 'text-healthcare-teal';
    if (value >= 40) return 'text-amber-500';
    return 'text-destructive';
  };

  return (
    <Card className="rounded-none border-2">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-healthcare-teal" />
            <CardTitle className="text-base">{title}</CardTitle>
          </div>
          <span className={cn("text-2xl font-bold", getScoreColor(percentage))}>
            {percentage}%
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <Progress value={percentage} className="h-3 rounded-none mb-4" />
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
