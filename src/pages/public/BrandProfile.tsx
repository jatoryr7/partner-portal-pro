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
  AlertTriangle,
  ShoppingBag
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
    affiliate_link: string | null;
    website: string | null;
    category: string | null;
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
            primary_contact_email,
            affiliate_link,
            website,
            category
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

  const handleShopClick = () => {
    // Priority: affiliate_link > website > fallback
    const url = brand?.partner?.affiliate_link || brand?.partner?.website;
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const hasShopLink = brand?.partner?.affiliate_link || brand?.partner?.website;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-8 w-32 mb-8" />
          <Skeleton className="h-48 w-full mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
    <div className="min-h-screen bg-background pb-24 md:pb-0">
      {/* Navigation */}
      <div className="border-b">
        <div className="max-w-6xl mx-auto px-4 py-3 md:py-4">
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
      <section className="py-8 md:py-12 px-4 border-b bg-gradient-to-br from-background via-background to-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h1 className="text-2xl md:text-4xl font-bold">
                  {brand.partner?.company_name || 'Unknown Brand'}
                </h1>
                {verified && (
                  <CheckCircle2 className="h-6 md:h-7 w-6 md:w-7 text-blue-500" />
                )}
              </div>
              
              <div className="flex items-center gap-2 flex-wrap">
                {verified && (
                  <Badge className="rounded-none bg-blue-500/10 text-blue-500 border-blue-500/20 hover:bg-blue-500/20">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Verified Partner
                  </Badge>
                )}
                {brand.partner?.category && (
                  <Badge variant="outline" className="rounded-none capitalize">
                    {brand.partner.category}
                  </Badge>
                )}
              </div>

              <p className={cn("mt-4 text-base md:text-lg", gradeConfig.textColor)}>
                {gradeConfig.label}: {gradeConfig.description}
              </p>
            </div>

            {/* Grade Badge */}
            <div className="flex flex-col items-center">
              <div className={cn(
                "w-24 h-24 md:w-28 md:h-28 flex items-center justify-center text-4xl md:text-5xl font-bold text-white shadow-lg",
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

      {/* Primary CTA - Desktop */}
      <section className="hidden md:block py-8 px-4 bg-muted/20 border-b">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold mb-1">Ready to try this brand?</h2>
              <p className="text-muted-foreground">
                Shop directly from the verified brand's official store.
              </p>
            </div>
            
            {hasShopLink ? (
              <Button
                size="lg"
                onClick={handleShopClick}
                className="rounded-none bg-healthcare-teal hover:bg-healthcare-teal/90 text-white shadow-xl px-8 py-6 text-lg"
              >
                <ShoppingBag className="h-5 w-5 mr-2" />
                Shop Verified Product
                <ExternalLink className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                size="lg"
                disabled
                className="rounded-none px-8 py-6 text-lg"
              >
                <ShoppingBag className="h-5 w-5 mr-2" />
                Store Coming Soon
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Trust Signals - Metrics Section */}
      <section className="py-8 md:py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-lg md:text-xl font-semibold mb-6 flex items-center gap-2">
            <Shield className="h-5 w-5 text-healthcare-teal" />
            Why We Trust This Brand
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
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
          </div>

          <div className="mt-4 md:mt-6">
            <MetricCard
              icon={Eye}
              title="Transparency"
              score={brand.transparency_score}
              description="Clarity of ingredient disclosure, sourcing information, and business practices."
              fullWidth
            />
          </div>
        </div>
      </section>

      {/* Disclaimers Section */}
      {brand.required_disclaimers && brand.required_disclaimers.length > 0 && (
        <section className="py-8 md:py-12 px-4 bg-muted/30 border-y">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-lg md:text-xl font-semibold mb-6 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Important Information
            </h2>

            <Card className="rounded-none border-2 border-amber-500/20">
              <CardContent className="p-4 md:p-6">
                <ul className="space-y-2">
                  {brand.required_disclaimers.map((disclaimer, index) => (
                    <li key={index} className="flex items-start gap-2 text-muted-foreground text-sm md:text-base">
                      <span className="text-amber-500 mt-0.5">•</span>
                      <span>{disclaimer}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* Secondary CTA - Desktop */}
      <section className="hidden md:block py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          {hasShopLink && (
            <>
              <h2 className="text-2xl font-bold mb-4">
                Support Verified Healthcare Brands
              </h2>
              <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
                When you shop from verified partners, you're supporting brands that meet our rigorous medical standards.
              </p>
              <Button
                size="lg"
                onClick={handleShopClick}
                className="rounded-none bg-healthcare-teal hover:bg-healthcare-teal/90 text-white shadow-lg"
              >
                <ExternalLink className="h-5 w-5 mr-2" />
                Shop Verified Product
              </Button>
            </>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 md:py-8 px-4 border-t bg-muted/20">
        <div className="max-w-6xl mx-auto text-center text-xs md:text-sm text-muted-foreground">
          <p>
            All evaluations are conducted by licensed medical professionals. 
            Grades reflect our assessment at the time of review and may be updated.
          </p>
        </div>
      </footer>

      {/* Mobile Fixed CTA */}
      {hasShopLink && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t shadow-[0_-4px_20px_rgba(0,0,0,0.1)] md:hidden z-50">
          <Button
            size="lg"
            onClick={handleShopClick}
            className="w-full rounded-none bg-healthcare-teal hover:bg-healthcare-teal/90 text-white shadow-lg h-14 text-base font-semibold"
          >
            <ShoppingBag className="h-5 w-5 mr-2" />
            Shop Verified Product
            <ExternalLink className="h-4 w-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
}

function MetricCard({
  icon: Icon,
  title,
  score,
  description,
  fullWidth = false,
}: {
  icon: React.ElementType;
  title: string;
  score: number | null;
  description: string;
  fullWidth?: boolean;
}) {
  const percentage = score ?? 0;
  
  const getScoreColor = (value: number) => {
    if (value >= 80) return 'text-emerald-500';
    if (value >= 60) return 'text-healthcare-teal';
    if (value >= 40) return 'text-amber-500';
    return 'text-destructive';
  };

  return (
    <Card className={cn("rounded-none border-2", fullWidth && "")}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-healthcare-teal" />
            <CardTitle className="text-sm md:text-base">{title}</CardTitle>
          </div>
          <span className={cn("text-xl md:text-2xl font-bold", getScoreColor(percentage))}>
            {percentage}%
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <Progress value={percentage} className="h-2 md:h-3 rounded-none mb-3 md:mb-4" />
        <p className="text-xs md:text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
