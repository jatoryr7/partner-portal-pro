import { useState } from "react";
import { Building2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PartnerData } from "@/components/OnboardingWizard";
import { useToast } from "@/hooks/use-toast";

interface StepCompanyInfoProps {
  data: PartnerData;
  onUpdate: (updates: Partial<PartnerData>) => void;
  onNext: () => void;
}

export function StepCompanyInfo({ data, onUpdate, onNext }: StepCompanyInfoProps) {
  const [companyName, setCompanyName] = useState(data.companyName);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!companyName.trim()) {
      toast({
        title: "Company name required",
        description: "Please enter your company name to continue.",
        variant: "destructive",
      });
      return;
    }

    onUpdate({ companyName: companyName.trim() });
    onNext();
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="shadow-lg border-0 bg-card">
        <CardHeader className="text-center pb-8">
          <div className="mx-auto h-16 w-16 rounded-2xl gradient-primary flex items-center justify-center mb-4 shadow-glow">
            <Building2 className="h-8 w-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">Welcome to Partner Onboarding</CardTitle>
          <CardDescription className="text-base mt-2">
            Let's start by getting to know your company. This information helps us tailor the creative collection process.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="companyName" className="text-base font-medium">
                Company Name
              </Label>
              <Input
                id="companyName"
                type="text"
                placeholder="Enter your company name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="h-12 text-base"
              />
              <p className="text-sm text-muted-foreground">
                This will be used across all your creative submissions and communications.
              </p>
            </div>

            <div className="pt-4">
              <Button type="submit" variant="gradient" size="lg" className="w-full">
                Continue to Creative Assets
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Info Cards */}
      <div className="grid md:grid-cols-3 gap-4 mt-8">
        <Card className="bg-healthcare-blue-light/50 border-0">
          <CardContent className="p-4">
            <h3 className="font-semibold text-foreground mb-1">5 Channels</h3>
            <p className="text-sm text-muted-foreground">
              Upload assets for Meta, TikTok, Google, YouTube & LinkedIn
            </p>
          </CardContent>
        </Card>
        <Card className="bg-success-light/50 border-0">
          <CardContent className="p-4">
            <h3 className="font-semibold text-foreground mb-1">Team Info</h3>
            <p className="text-sm text-muted-foreground">
              Add stakeholder contacts for seamless communication
            </p>
          </CardContent>
        </Card>
        <Card className="bg-warning-light/50 border-0">
          <CardContent className="p-4">
            <h3 className="font-semibold text-foreground mb-1">Book a Sync</h3>
            <p className="text-sm text-muted-foreground">
              Schedule recurring partner meetings at the end
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
