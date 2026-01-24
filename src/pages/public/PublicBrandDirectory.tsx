import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Building2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { AdminFloatingButton } from '@/components/public/AdminFloatingButton';
import { calculateGrade } from '@/hooks/useMedicalReviews';

function GradeBadge({ grade }: { grade: string | null }) {
  if (!grade) return null;
  
  const gradeStyles: Record<string, string> = {
    A: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    B: 'bg-blue-100 text-blue-800 border-blue-300',
    C: 'bg-amber-100 text-amber-800 border-amber-300',
    D: 'bg-orange-100 text-orange-800 border-orange-300',
    F: 'bg-red-100 text-red-800 border-red-300',
  };

  return (
    <Badge className={`rounded-none text-sm font-bold px-2 py-1 ${gradeStyles[grade] || ''}`}>
      Grade {grade}
    </Badge>
  );
}

export default function PublicBrandDirectory() {
  const [searchQuery, setSearchQuery] = useState('');
  const { user, roles } = useAuth();
  const isAdmin = user && roles && roles.includes('admin');

  // Fetch partners with their medical reviews
  const { data: brands = [], isLoading } = useQuery({
    queryKey: ['public-brands-directory'],
    queryFn: async () => {
      const { data: partners, error: partnersError } = await supabase
        .from('partners')
        .select('id, company_name, created_at')
        .order('company_name');

      if (partnersError) throw partnersError;

      // Fetch medical reviews for each partner
      const { data: reviews, error: reviewsError } = await supabase
        .from('medical_reviews')
        .select('partner_id, clinical_evidence_score, safety_score, transparency_score, overall_grade, status')
        .in('status', ['approved', 'in_medical_review']);

      if (reviewsError) throw reviewsError;

      // Map reviews to partners
      const reviewMap = new Map();
      reviews?.forEach((review: any) => {
        if (!reviewMap.has(review.partner_id)) {
          reviewMap.set(review.partner_id, review);
        }
      });

      return partners?.map((partner: any) => {
        const review = reviewMap.get(partner.id);
        const grade = review?.overall_grade || 
          (review ? calculateGrade({
            clinical: review.clinical_evidence_score,
            safety: review.safety_score,
            transparency: review.transparency_score,
          }) : null);

        return {
          ...partner,
          medicalGrade: grade,
          medicalStatus: review?.status,
        };
      }) || [];
    },
  });

  const filteredBrands = brands.filter((brand: any) =>
    brand.company_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Public Directory | Partner Portal</title>
        <meta name="description" content="Search verified healthcare brands and their medical review scores." />
      </Helmet>
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Brand Directory</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Search verified healthcare brands and their medical review scores
              </p>
            </div>
            {!isAdmin && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => window.location.href = '/partner/login'}
                  className="rounded-none"
                >
                  Partner Login
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.location.href = '/admin/login'}
                  className="rounded-none"
                >
                  Admin Login
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Search Section */}
      <section className="max-w-7xl mx-auto px-6 py-8">
        <div className="relative max-w-2xl mx-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search brands by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 text-lg rounded-none"
          />
        </div>
      </section>

      {/* Results Section */}
      <section className="max-w-7xl mx-auto px-6 pb-12">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1ABC9C]" />
          </div>
        ) : filteredBrands.length === 0 ? (
          <div className="text-center py-16">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-foreground mb-2">
              {searchQuery ? 'No brands found' : 'No brands in directory'}
            </p>
            <p className="text-sm text-muted-foreground">
              {searchQuery 
                ? `Try a different search term or browse all brands`
                : 'Brands will appear here once they complete medical review'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBrands.map((brand: any) => (
              <Card key={brand.id} className="rounded-none border-border/50 hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 flex-1">
                      <Building2 className="h-5 w-5 text-[#1ABC9C] shrink-0" />
                      <CardTitle className="text-lg line-clamp-2">{brand.company_name}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {brand.medicalGrade && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Medical Grade</span>
                      <GradeBadge grade={brand.medicalGrade} />
                    </div>
                  )}
                  {brand.medicalStatus && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Status</span>
                      <Badge variant="outline" className="rounded-none text-xs">
                        {brand.medicalStatus === 'approved' ? 'Approved' : 'In Review'}
                      </Badge>
                    </div>
                  )}
                  {!brand.medicalGrade && (
                    <p className="text-sm text-muted-foreground italic">
                      Medical review pending
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Stats */}
        {filteredBrands.length > 0 && (
          <div className="mt-8 text-center text-sm text-muted-foreground">
            Showing {filteredBrands.length} of {brands.length} brands
          </div>
        )}
      </section>

      {/* Floating Admin Button */}
      {isAdmin && <AdminFloatingButton />}
    </div>
  );
}
