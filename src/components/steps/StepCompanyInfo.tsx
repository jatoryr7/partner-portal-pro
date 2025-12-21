import { useState } from "react";
import { Building2, ArrowRight, CalendarIcon, Plus, X, AlertCircle } from "lucide-react";
import { format, addDays, isAfter } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { PartnerData, ContactInfo } from "@/types/partner";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface StepCompanyInfoProps {
  data: PartnerData;
  onUpdate: (updates: Partial<PartnerData>) => void;
  onNext: () => void;
}

export function StepCompanyInfo({ data, onUpdate, onNext }: StepCompanyInfoProps) {
  const [companyName, setCompanyName] = useState(data.companyName);
  const [targetLaunchDate, setTargetLaunchDate] = useState<Date | null>(data.targetLaunchDate);
  const [primaryContact, setPrimaryContact] = useState<ContactInfo>(data.primaryContact);
  const [secondaryContact, setSecondaryContact] = useState<ContactInfo | null>(data.secondaryContact);
  const [showSecondaryContact, setShowSecondaryContact] = useState(!!data.secondaryContact);
  const { toast } = useToast();

  const minLaunchDate = addDays(new Date(), 14);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

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

    if (!primaryContact.name.trim() || !primaryContact.email.trim()) {
      toast({
        title: "Primary contact required",
        description: "Please enter the primary contact name and email.",
        variant: "destructive",
      });
      return;
    }

    if (!validateEmail(primaryContact.email)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address for the primary contact.",
        variant: "destructive",
      });
      return;
    }

    if (targetLaunchDate && !isAfter(targetLaunchDate, minLaunchDate)) {
      toast({
        title: "Invalid launch date",
        description: "Target launch date must be at least 14 days in the future.",
        variant: "destructive",
      });
      return;
    }

    if (showSecondaryContact && secondaryContact) {
      if (secondaryContact.email && !validateEmail(secondaryContact.email)) {
        toast({
          title: "Invalid email",
          description: "Please enter a valid email address for the secondary contact.",
          variant: "destructive",
        });
        return;
      }
    }

    onUpdate({
      companyName: companyName.trim(),
      targetLaunchDate,
      primaryContact,
      secondaryContact: showSecondaryContact ? secondaryContact : null,
    });
    onNext();
  };

  const addSecondaryContact = () => {
    setShowSecondaryContact(true);
    setSecondaryContact({ name: "", email: "" });
  };

  const removeSecondaryContact = () => {
    setShowSecondaryContact(false);
    setSecondaryContact(null);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="shadow-lg border border-border bg-card">
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
            {/* Company Name */}
            <div className="space-y-2">
              <Label htmlFor="companyName" className="text-base font-medium">
                Company Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="companyName"
                type="text"
                placeholder="Enter your company name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="h-12 text-base"
              />
            </div>

            {/* Dates Row */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* Submission Date (Read-only) */}
              <div className="space-y-2">
                <Label className="text-base font-medium">Submission Date</Label>
                <div className="h-12 px-3 rounded-md border bg-muted flex items-center text-muted-foreground">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  {format(data.submissionDate, "PPP")}
                </div>
                <p className="text-xs text-muted-foreground">Auto-generated</p>
              </div>

              {/* Target Launch Date */}
              <div className="space-y-2">
                <Label className="text-base font-medium">Target Launch Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full h-12 justify-start text-left font-normal",
                        !targetLaunchDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {targetLaunchDate ? format(targetLaunchDate, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={targetLaunchDate || undefined}
                      onSelect={(date) => setTargetLaunchDate(date || null)}
                      disabled={(date) => date < minLaunchDate}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Must be at least 14 days in the future
                </p>
              </div>
            </div>

            {/* Primary Contact */}
            <div className="space-y-4 p-4 rounded-lg border bg-muted/30">
              <Label className="text-base font-medium">
                Primary Point of Contact <span className="text-destructive">*</span>
              </Label>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primaryName" className="text-sm">Name</Label>
                  <Input
                    id="primaryName"
                    placeholder="Full name"
                    value={primaryContact.name}
                    onChange={(e) => setPrimaryContact({ ...primaryContact, name: e.target.value })}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="primaryEmail" className="text-sm">Email</Label>
                  <Input
                    id="primaryEmail"
                    type="email"
                    placeholder="email@company.com"
                    value={primaryContact.email}
                    onChange={(e) => setPrimaryContact({ ...primaryContact, email: e.target.value })}
                    className="h-11"
                  />
                </div>
              </div>
            </div>

            {/* Secondary Contact */}
            {showSecondaryContact && secondaryContact ? (
              <div className="space-y-4 p-4 rounded-lg border bg-muted/30 relative">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium">Secondary Contact</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={removeSecondaryContact}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Remove
                  </Button>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="secondaryName" className="text-sm">Name</Label>
                    <Input
                      id="secondaryName"
                      placeholder="Full name"
                      value={secondaryContact.name}
                      onChange={(e) => setSecondaryContact({ ...secondaryContact, name: e.target.value })}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="secondaryEmail" className="text-sm">Email</Label>
                    <Input
                      id="secondaryEmail"
                      type="email"
                      placeholder="email@company.com"
                      value={secondaryContact.email}
                      onChange={(e) => setSecondaryContact({ ...secondaryContact, email: e.target.value })}
                      className="h-11"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={addSecondaryContact}
                className="w-full border-dashed"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Secondary Contact
              </Button>
            )}

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
        <Card className="bg-healthcare-blue-light/50 border border-border">
          <CardContent className="p-4">
            <h3 className="font-semibold text-foreground mb-1">5 Channels</h3>
            <p className="text-sm text-muted-foreground">
              Native, Paid Social, Media, Newsletter & Content Marketing
            </p>
          </CardContent>
        </Card>
        <Card className="bg-success-light/50 border border-border">
          <CardContent className="p-4">
            <h3 className="font-semibold text-foreground mb-1">Team Info</h3>
            <p className="text-sm text-muted-foreground">
              Add stakeholder contacts for seamless communication
            </p>
          </CardContent>
        </Card>
        <Card className="bg-warning-light/50 border border-border">
          <CardContent className="p-4">
            <h3 className="font-semibold text-foreground mb-1">Auto-Save</h3>
            <p className="text-sm text-muted-foreground">
              Your progress is saved as a draft automatically
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
