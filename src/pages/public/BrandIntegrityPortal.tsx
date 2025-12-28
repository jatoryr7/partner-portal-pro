import React, { useState, useEffect } from 'react';
import { Search, TrendingUp, Heart, Share2, CheckCircle, Sparkles, Users, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const FREE_CREDITS_MAX = 3;
const STORAGE_KEY = 'brand_portal_credits';

interface ReviewRequest {
  id: string;
  brand_name: string;
  brand_url: string | null;
  request_count: number;
  requester_name: string | null;
  created_at: string;
}

const BrandIntegrityPortal = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [freeCredits, setFreeCredits] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? parseInt(stored, 10) : FREE_CREDITS_MAX;
  });
  
  // Form state
  const [brandName, setBrandName] = useState('');
  const [productUrl, setProductUrl] = useState('');
  const [reason, setReason] = useState('');
  const [requesterName, setRequesterName] = useState('');
  const [requesterEmail, setRequesterEmail] = useState('');

  // Fetch community requests
  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['public-review-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('public_review_requests')
        .select('*')
        .order('request_count', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data as ReviewRequest[];
    }
  });

  // Submit request mutation
  const submitRequest = useMutation({
    mutationFn: async (data: { brand_name: string; brand_url: string; requester_name: string; requester_email: string }) => {
      // Check if brand already exists
      const { data: existing } = await supabase
        .from('public_review_requests')
        .select('id, request_count')
        .eq('brand_name', data.brand_name)
        .maybeSingle();

      if (existing) {
        // Increment count
        const { error } = await supabase
          .from('public_review_requests')
          .update({ request_count: existing.request_count + 1 })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        // Create new
        const { error } = await supabase
          .from('public_review_requests')
          .insert({
            brand_name: data.brand_name,
            brand_url: data.brand_url || null,
            requester_name: data.requester_name || null,
            requester_email: data.requester_email || null
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['public-review-requests'] });
      const newCredits = freeCredits - 1;
      setFreeCredits(newCredits);
      localStorage.setItem(STORAGE_KEY, newCredits.toString());
      
      toast({
        title: "Request Submitted!",
        description: "Your brand review request has been added to the community queue.",
      });
      
      // Reset form
      setBrandName('');
      setProductUrl('');
      setReason('');
      setShowRequestForm(false);
    },
    onError: () => {
      toast({
        title: "Submission Failed",
        description: "Please try again later.",
        variant: "destructive"
      });
    }
  });

  // Upvote mutation
  const upvoteRequest = useMutation({
    mutationFn: async (id: string) => {
      const request = requests.find(r => r.id === id);
      if (!request) throw new Error('Request not found');
      
      const { error } = await supabase
        .from('public_review_requests')
        .update({ request_count: request.request_count + 1 })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['public-review-requests'] });
      toast({
        title: "Vote Recorded",
        description: "Thank you for your input!"
      });
    }
  });

  const handleSearch = () => {
    const found = requests.find(r => 
      r.brand_name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (!found && searchQuery.trim()) {
      setBrandName(searchQuery);
      setShowRequestForm(true);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (freeCredits <= 0) {
      toast({
        title: "No Free Credits Remaining",
        description: "Subscribe to unlock unlimited submissions.",
        variant: "destructive"
      });
      return;
    }
    submitRequest.mutate({
      brand_name: brandName,
      brand_url: productUrl,
      requester_name: requesterName,
      requester_email: requesterEmail
    });
  };

  const copyShareLink = (request: ReviewRequest) => {
    const url = `${window.location.origin}/brand-application?brand=${encodeURIComponent(request.brand_name)}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "Link Copied",
      description: "Share it to help prioritize this review!"
    });
  };

  const filteredRequests = searchQuery 
    ? requests.filter(r => r.brand_name.toLowerCase().includes(searchQuery.toLowerCase()))
    : requests;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F9FAFB' }}>
      {/* Hero Section */}
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 flex items-center justify-center" style={{ backgroundColor: '#1ABC9C' }}>
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Brand Integrity Registry</h1>
          </div>
          <p className="text-lg text-slate-600">
            Community-powered verification for health & wellness products
          </p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        {/* Credits Banner */}
        <div className="bg-white border border-slate-200 p-6 mb-10" style={{ borderRadius: '0px' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" style={{ color: '#1ABC9C' }} />
              <span className="font-medium text-slate-700">Free Credits Remaining</span>
            </div>
            <span className="text-lg font-bold" style={{ color: freeCredits > 0 ? '#1ABC9C' : '#EF4444' }}>
              {freeCredits}/{FREE_CREDITS_MAX}
            </span>
          </div>
          <Progress 
            value={(freeCredits / FREE_CREDITS_MAX) * 100} 
            className="h-2"
            style={{ borderRadius: '0px' }}
          />
          {freeCredits === 0 && (
            <p className="text-sm text-slate-500 mt-3">
              <Button 
                variant="link" 
                className="p-0 h-auto font-medium"
                style={{ color: '#1ABC9C' }}
              >
                Subscribe for unlimited monthly submissions →
              </Button>
            </p>
          )}
        </div>

        {/* Search Section */}
        <section className="text-center mb-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            Search 10,000+ Verified Products
          </h2>
          <p className="text-lg text-slate-500 mb-8 max-w-2xl mx-auto">
            Find medical-grade assessments or request a new review from our community queue.
          </p>
          
          <div className="flex gap-0 max-w-2xl mx-auto">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter brand or product name..."
              className="flex-1 h-14 text-lg border-slate-300 focus:border-[#1ABC9C]"
              style={{ borderRadius: '0px', borderRight: 'none' }}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button 
              onClick={handleSearch}
              className="h-14 px-8 text-lg font-medium text-white"
              style={{ backgroundColor: '#1ABC9C', borderRadius: '0px' }}
            >
              <Search className="w-5 h-5 mr-2" />
              Search
            </Button>
          </div>

          {searchQuery && filteredRequests.length === 0 && !showRequestForm && (
            <div className="mt-8 p-6 bg-white border border-slate-200" style={{ borderRadius: '0px' }}>
              <p className="text-slate-600 mb-4">No results found for "{searchQuery}"</p>
              <Button 
                onClick={() => {
                  setBrandName(searchQuery);
                  setShowRequestForm(true);
                }}
                style={{ backgroundColor: '#1ABC9C', borderRadius: '0px' }}
                className="text-white"
              >
                Request a Medical Review
              </Button>
            </div>
          )}
        </section>

        {/* Request Form */}
        {showRequestForm && (
          <section className="mb-16">
            <div className="bg-white border border-slate-200 p-8" style={{ borderRadius: '0px' }}>
              <h3 className="text-xl font-bold text-slate-900 mb-6">Request a Medical Review</h3>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Brand Name *</label>
                  <Input
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    placeholder="e.g., Athletic Greens"
                    required
                    style={{ borderRadius: '0px' }}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Product URL</label>
                  <Input
                    value={productUrl}
                    onChange={(e) => setProductUrl(e.target.value)}
                    placeholder="https://..."
                    type="url"
                    style={{ borderRadius: '0px' }}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Why do you want this reviewed?</label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="I've seen ads for this product and want to know if the claims are legitimate..."
                    className="w-full min-h-[100px] px-3 py-2 border border-slate-300 focus:outline-none focus:border-[#1ABC9C]"
                    style={{ borderRadius: '0px' }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Your Name (optional)</label>
                    <Input
                      value={requesterName}
                      onChange={(e) => setRequesterName(e.target.value)}
                      placeholder="Jane Doe"
                      style={{ borderRadius: '0px' }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Your Email (optional)</label>
                    <Input
                      value={requesterEmail}
                      onChange={(e) => setRequesterEmail(e.target.value)}
                      placeholder="jane@email.com"
                      type="email"
                      style={{ borderRadius: '0px' }}
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button 
                    type="button"
                    variant="outline"
                    onClick={() => setShowRequestForm(false)}
                    style={{ borderRadius: '0px' }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    disabled={!brandName.trim() || freeCredits <= 0 || submitRequest.isPending}
                    className="text-white"
                    style={{ backgroundColor: '#1ABC9C', borderRadius: '0px' }}
                  >
                    {submitRequest.isPending ? 'Submitting...' : 'Submit Request'}
                  </Button>
                </div>
              </form>
            </div>
          </section>
        )}

        {/* Community Queue / Leaderboard */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-6 h-6" style={{ color: '#1ABC9C' }} />
                Community Request Queue
              </h2>
              <p className="text-slate-500 mt-1">Upvote brands to prioritize their medical review</p>
            </div>
            <div className="flex items-center gap-2 text-slate-500">
              <Users className="w-5 h-5" />
              <span className="font-medium">{requests.reduce((sum, r) => sum + r.request_count, 0)} total votes</span>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-12 text-slate-500">Loading community requests...</div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-12 bg-white border border-slate-200" style={{ borderRadius: '0px' }}>
              <p className="text-slate-500">No community requests yet. Be the first!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRequests.map((request, index) => (
                <div 
                  key={request.id}
                  className="bg-white border border-slate-200 p-5 flex items-center gap-6 hover:border-[#1ABC9C] transition-colors"
                  style={{ borderRadius: '0px' }}
                >
                  {/* Rank */}
                  <div className="w-10 h-10 flex items-center justify-center font-bold text-lg" 
                    style={{ 
                      backgroundColor: index < 3 ? '#1ABC9C' : '#F1F5F9',
                      color: index < 3 ? 'white' : '#64748B'
                    }}>
                    {index + 1}
                  </div>

                  {/* Brand Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-slate-900 text-lg truncate">{request.brand_name}</h4>
                    {request.brand_url && (
                      <a 
                        href={request.brand_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-slate-500 hover:text-[#1ABC9C] truncate block"
                      >
                        {request.brand_url}
                      </a>
                    )}
                  </div>

                  {/* Trending Badge */}
                  {request.request_count >= 10 && (
                    <Badge 
                      className="font-medium text-white"
                      style={{ backgroundColor: '#F59E0B', borderRadius: '0px' }}
                    >
                      🔥 Trending: Expedited Review
                    </Badge>
                  )}

                  {/* Vote Count & Actions */}
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="flex items-center gap-1">
                        <Heart 
                          className="w-5 h-5 cursor-pointer hover:scale-110 transition-transform"
                          style={{ color: '#1ABC9C' }}
                          fill={request.request_count >= 5 ? '#1ABC9C' : 'none'}
                        />
                        <span className="font-bold text-lg" style={{ color: '#1ABC9C' }}>
                          {request.request_count}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500">votes</span>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => upvoteRequest.mutate(request.id)}
                      disabled={upvoteRequest.isPending}
                      className="border-[#1ABC9C] text-[#1ABC9C] hover:bg-[#1ABC9C] hover:text-white"
                      style={{ borderRadius: '0px' }}
                    >
                      <ArrowRight className="w-4 h-4 mr-1" />
                      Upvote
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyShareLink(request)}
                      className="text-slate-500 hover:text-[#1ABC9C]"
                    >
                      <Share2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Community Verified Seal Info */}
        <section className="mt-16 text-center">
          <div className="inline-flex items-center gap-3 bg-white border border-slate-200 px-6 py-4" style={{ borderRadius: '0px' }}>
            <CheckCircle className="w-8 h-8" style={{ color: '#1ABC9C' }} />
            <div className="text-left">
              <h4 className="font-semibold text-slate-900">Community Verified Seal</h4>
              <p className="text-sm text-slate-500">Brands reaching 50+ votes unlock the "Community Priority" seal</p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white mt-16">
        <div className="max-w-5xl mx-auto px-6 py-8 text-center text-slate-500 text-sm">
          <p>© 2024 Brand Integrity Registry. Powered by medical science, driven by community.</p>
        </div>
      </footer>
    </div>
  );
};

export default BrandIntegrityPortal;
