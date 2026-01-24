import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Shield, CheckCircle2, ArrowRight, TrendingUp, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PublicBrand {
  id: string;
  partner_id: string;
  overall_grade: string | null;
  status: string;
  clinical_evidence_score: number | null;
  safety_score: number | null;
  transparency_score: number | null;
  partner: {
    id: string;
    company_name: string;
    category: string | null;
  } | null;
}

const TRUSTED_CATEGORIES = [
  { id: 'supplements', label: 'Supplements', icon: '💊' },
  { id: 'wearables', label: 'Wearables', icon: '⌚' },
  { id: 'telehealth', label: 'Telehealth', icon: '🏥' },
  { id: 'nutrition', label: 'Nutrition', icon: '🥗' },
  { id: 'fitness', label: 'Fitness', icon: '💪' },
  { id: 'mental-health', label: 'Mental Health', icon: '🧠' },
];

const getGradeColor = (grade: string | null) => {
  switch (grade?.toUpperCase()) {
    case 'A':
      return 'bg-emerald-500 text-white';
    case 'B':
      return 'bg-healthcare-teal text-white';
    case 'C':
      return 'bg-amber-500 text-white';
    case 'D':
      return 'bg-orange-500 text-white';
    case 'F':
      return 'bg-destructive text-white';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

const isVerified = (grade: string | null): boolean => {
  return grade?.toUpperCase() === 'A' || grade?.toUpperCase() === 'B';
};

export default function PublicBrandDirectory() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Fetch approved medical reviews with partner data
  const { data: brands = [], isLoading } = useQuery({
    queryKey: ['public-brands'],
    queryFn: async () => {
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
          partner:partners (
            id,
            company_name,
            category
          )
        `)
        .eq('status', 'approved')
        .not('overall_grade', 'is', null)
        .order('overall_grade', { ascending: true });

      if (error) throw error;
      return data as unknown as PublicBrand[];
    },
  });

  // Filter brands based on search and category
  const filteredBrands = brands.filter((brand) => {
    const matchesSearch = brand.partner?.company_name
      ?.toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || 
      brand.partner?.category?.toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  // Get trending brands (A-grade verified partners)
  const trendingBrands = brands
    .filter((brand) => brand.overall_grade?.toUpperCase() === 'A')
    .slice(0, 4);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-16 md:py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-healthcare-teal/5 via-background to-primary/5" />
        
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Shield className="h-8 md:h-10 w-8 md:w-10 text-healthcare-teal" />
            <span className="text-xs md:text-sm font-semibold tracking-widest text-healthcare-teal uppercase">
              Verified Healthcare Brands
            </span>
          </div>
          
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
            Search for Healthcare Brands
          </h1>
          
          <p className="text-base md:text-lg text-muted-foreground mb-8 md:mb-10 max-w-2xl mx-auto">
            Every brand in our directory has been rigorously evaluated by our medical team 
            for clinical evidence, safety standards, and transparency.
          </p>

          {/* Search Bar */}
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search verified brands..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-12 md:h-14 pl-12 pr-4 text-base md:text-lg rounded-none shadow-lg border-2 focus:border-healthcare-teal"
            />
          </div>

          {/* Trusted Categories */}
          <div className="mt-6 md:mt-8 flex flex-wrap justify-center gap-2 md:gap-3">
            {TRUSTED_CATEGORIES.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(
                  selectedCategory === category.id ? null : category.id
                )}
                className={cn(
                  "inline-flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-none border-2 text-sm md:text-base font-medium transition-all",
                  selectedCategory === category.id
                    ? "bg-healthcare-teal text-white border-healthcare-teal"
                    : "bg-background border-border hover:border-healthcare-teal/50"
                )}
              >
                <span>{category.icon}</span>
                <span>{category.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Trending Verified Brands */}
      {trendingBrands.length > 0 && !searchQuery && !selectedCategory && (
        <section className="py-8 md:py-12 px-4 bg-muted/30 border-y">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="h-5 w-5 text-healthcare-teal" />
              <h2 className="text-xl md:text-2xl font-semibold">Trending Verified Brands</h2>
              <Badge className="rounded-none bg-healthcare-teal/10 text-healthcare-teal border-healthcare-teal/20">
                <Star className="h-3 w-3 mr-1" />
                Top Rated
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {trendingBrands.map((brand) => (
                <TrendingBrandCard 
                  key={brand.id} 
                  brand={brand} 
                  onClick={() => navigate(`/brands/${brand.id}`)} 
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Results Section */}
      <section className="py-8 md:py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6 md:mb-8">
            <h2 className="text-xl md:text-2xl font-semibold">
              {searchQuery 
                ? `Results for "${searchQuery}"` 
                : selectedCategory 
                  ? `${TRUSTED_CATEGORIES.find(c => c.id === selectedCategory)?.label || 'Category'} Brands`
                  : 'All Verified Brands'}
            </h2>
            <Badge variant="outline" className="rounded-none">
              {filteredBrands.length} brands
            </Badge>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-40 rounded-none" />
              ))}
            </div>
          ) : filteredBrands.length === 0 ? (
            <Card className="rounded-none border-2 border-dashed">
              <CardContent className="py-12 text-center">
                <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No brands found</h3>
                <p className="text-muted-foreground">
                  {searchQuery 
                    ? `No verified brands match "${searchQuery}"`
                    : "No verified brands available yet"
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {filteredBrands.map((brand) => (
                <BrandCard 
                  key={brand.id} 
                  brand={brand} 
                  onClick={() => navigate(`/brands/${brand.id}`)} 
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-12 md:py-16 px-4 bg-muted/30 border-t">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-xl md:text-2xl font-bold mb-4">
            Want Your Brand Verified?
          </h2>
          <p className="text-muted-foreground mb-6">
            Join the trusted healthcare brands directory. Get your products reviewed by our medical team.
          </p>
          <button
            onClick={() => navigate('/brand-application')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-healthcare-teal text-white font-semibold rounded-none hover:bg-healthcare-teal/90 transition-colors shadow-lg"
          >
            <Shield className="h-5 w-5" />
            Apply for Verification
          </button>
        </div>
      </section>
    </div>
  );
}

// Trending Brand Card - More prominent with CTA focus
function TrendingBrandCard({ brand, onClick }: { brand: PublicBrand; onClick: () => void }) {
  return (
    <Card
      onClick={onClick}
      className="rounded-none border-2 border-healthcare-teal/30 hover:border-healthcare-teal hover:shadow-xl transition-all cursor-pointer group bg-gradient-to-br from-background to-healthcare-teal/5"
    >
      <CardContent className="p-4 md:p-5">
        <div className="flex items-start justify-between mb-3">
          <Badge className="rounded-none bg-emerald-500 text-white">
            Grade A
          </Badge>
          <CheckCircle2 className="h-5 w-5 text-blue-500" />
        </div>
        
        <h3 className="font-semibold text-base md:text-lg mb-1 group-hover:text-healthcare-teal transition-colors line-clamp-1">
          {brand.partner?.company_name || 'Unknown Brand'}
        </h3>
        <span className="text-xs text-blue-500 font-medium">Verified Partner</span>

        <div className="mt-4 pt-3 border-t flex items-center justify-between text-sm">
          <span className="text-muted-foreground">View & Shop</span>
          <ArrowRight className="h-4 w-4 text-healthcare-teal group-hover:translate-x-1 transition-transform" />
        </div>
      </CardContent>
    </Card>
  );
}

// Standard Brand Card
function BrandCard({ brand, onClick }: { brand: PublicBrand; onClick: () => void }) {
  const verified = isVerified(brand.overall_grade);

  return (
    <Card
      onClick={onClick}
      className="rounded-none border-2 hover:border-healthcare-teal/50 hover:shadow-lg transition-all cursor-pointer group"
    >
      <CardContent className="p-4 md:p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-base md:text-lg group-hover:text-healthcare-teal transition-colors truncate">
                {brand.partner?.company_name || 'Unknown Brand'}
              </h3>
              {verified && (
                <CheckCircle2 className="h-5 w-5 text-blue-500 flex-shrink-0" />
              )}
            </div>
            {verified && (
              <span className="text-xs text-blue-500 font-medium">
                Verified Partner
              </span>
            )}
          </div>
          
          <Badge className={cn(
            "text-lg font-bold px-3 py-1 rounded-none flex-shrink-0",
            getGradeColor(brand.overall_grade)
          )}>
            {brand.overall_grade || '—'}
          </Badge>
        </div>

        {/* Mini Score Bars */}
        <div className="space-y-2">
          <ScoreBar label="Clinical" value={brand.clinical_evidence_score} />
          <ScoreBar label="Safety" value={brand.safety_score} />
          <ScoreBar label="Transparency" value={brand.transparency_score} />
        </div>

        <div className="mt-4 pt-4 border-t flex items-center justify-end text-sm text-muted-foreground group-hover:text-healthcare-teal">
          <span>View Profile</span>
          <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
        </div>
      </CardContent>
    </Card>
  );
}

function ScoreBar({ label, value }: { label: string; value: number | null }) {
  const percentage = value ?? 0;
  
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground w-20 md:w-24">{label}</span>
      <div className="flex-1 h-2 bg-muted rounded-none overflow-hidden">
        <div
          className="h-full bg-healthcare-teal transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-xs font-medium w-8 text-right">{percentage}%</span>
    </div>
  );
}
