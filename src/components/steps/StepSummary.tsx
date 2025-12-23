import { useState } from "react";
import { format } from "date-fns";
import { ArrowLeft, Check, ExternalLink, Calendar, Building2, Users, Palette, FileText, User, Clock, Sparkles, Share2, Mail, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PartnerData, ChannelData, NativeChannelAssets, PaidSocialSearchAssets, StandardChannelAssets, ChannelKey } from "@/types/partner";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface StepSummaryProps {
  data: PartnerData;
  onBack: () => void;
  onComplete?: () => void;
}

const channelConfig: Record<ChannelKey, { name: string; icon: React.ReactNode; dbKey: string }> = {
  native: { name: "Native", icon: <Sparkles className="h-4 w-4" />, dbKey: "native" },
  paidSocialSearch: { name: "Paid Social/Search", icon: <Share2 className="h-4 w-4" />, dbKey: "paid_social_search" },
  media: { name: "Media", icon: <FileText className="h-4 w-4" />, dbKey: "media" },
  newsletter: { name: "Newsletter", icon: <Mail className="h-4 w-4" />, dbKey: "newsletter" },
  contentMarketing: { name: "Content Marketing", icon: <FileText className="h-4 w-4" />, dbKey: "content_marketing" },
};

export function StepSummary({ data, onBack, onComplete }: StepSummaryProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const completedChannels = Object.entries(data.channels).filter(
    ([_, channel]) => channel.completed
  );

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to submit your assets.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Create the partner record
      const { data: partner, error: partnerError } = await supabase
        .from("partners")
        .insert({
          user_id: user.id,
          company_name: data.companyName,
          submission_date: format(data.submissionDate, "yyyy-MM-dd"),
          target_launch_date: data.targetLaunchDate ? format(data.targetLaunchDate, "yyyy-MM-dd") : null,
          primary_contact_name: data.primaryContact.name,
          primary_contact_email: data.primaryContact.email,
          secondary_contact_name: data.secondaryContact?.name || null,
          secondary_contact_email: data.secondaryContact?.email || null,
        })
        .select()
        .single();

      if (partnerError) throw partnerError;

      // 2. Create campaign_status record
      const { error: statusError } = await supabase
        .from("campaign_status")
        .insert({
          partner_id: partner.id,
          stage: "asset_collection",
          priority: "medium",
        });

      if (statusError) throw statusError;

      // 3. Create creative_assets for each selected channel
      const channelInserts = data.selectedChannels.map((channelKey) => {
        const channel = data.channels[channelKey];
        const config = channelConfig[channelKey];
        
        const baseAsset = {
          partner_id: partner.id,
          channel: config.dbKey,
          is_complete: channel.completed,
          is_draft: channel.isDraft,
          file_urls: channel.fileUrls,
        };

        if (channelKey === "native") {
          const native = channel as NativeChannelAssets;
          return {
            ...baseAsset,
            affiliate_platform: native.affiliatePlatform || null,
            driver_types: native.driverTypes,
            promo_copy: native.promoCopy || null,
            affiliate_link: native.affiliateLink || null,
          };
        } else if (channelKey === "paidSocialSearch") {
          const paid = channel as PaidSocialSearchAssets;
          return {
            ...baseAsset,
            copy_from_native: paid.copyFromNative,
            affiliate_link: paid.affiliateLink || null,
            copy_text: paid.copy || null,
          };
        } else {
          const standard = channel as StandardChannelAssets;
          return {
            ...baseAsset,
            context_instructions: standard.contextInstructions || null,
            affiliate_link: standard.affiliateLink || null,
          };
        }
      });

      if (channelInserts.length > 0) {
        const { error: assetsError } = await supabase
          .from("creative_assets")
          .insert(channelInserts);

        if (assetsError) throw assetsError;
      }

      // 4. Create stakeholders
      if (data.stakeholders.length > 0) {
        const stakeholderInserts = data.stakeholders.map((stakeholder) => ({
          partner_id: partner.id,
          name: stakeholder.name,
          email: stakeholder.email,
          phone: stakeholder.phone || null,
          role: stakeholder.role || null,
        }));

        const { error: stakeholdersError } = await supabase
          .from("stakeholders")
          .insert(stakeholderInserts);

        if (stakeholdersError) throw stakeholdersError;
      }

      toast({
        title: "Submission saved!",
        description: "Your creative assets have been submitted successfully.",
      });

      onComplete?.();
    } catch (error: any) {
      console.error("Submission error:", error);
      toast({
        title: "Submission failed",
        description: error.message || "An error occurred while saving your submission.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderChannelDetails = (key: ChannelKey, channel: ChannelData[ChannelKey]) => {
    if (!channel.completed) return null;

    if (key === "native") {
      const native = channel as NativeChannelAssets;
      return (
        <div className="mt-3 pt-3 border-t border-success/20 space-y-1 text-sm">
          {native.affiliatePlatform && (
            <p className="text-muted-foreground">
              Platform: <span className="text-foreground">{native.affiliatePlatform}</span>
            </p>
          )}
          {native.driverTypes.length > 0 && (
            <p className="text-muted-foreground">
              Drivers: <span className="text-foreground">{native.driverTypes.join(", ")}</span>
            </p>
          )}
          {native.fileUrls.length > 0 && (
            <p className="text-muted-foreground">
              Files: <span className="text-foreground">{native.fileUrls.length} uploaded</span>
            </p>
          )}
        </div>
      );
    }

    if (key === "paidSocialSearch") {
      const paid = channel as PaidSocialSearchAssets;
      return (
        <div className="mt-3 pt-3 border-t border-success/20 space-y-1 text-sm">
          {paid.mediaPlatform && (
            <p className="text-muted-foreground">
              Platform: <span className="text-foreground">{paid.mediaPlatform}</span>
            </p>
          )}
          {paid.copyFromNative && (
            <p className="text-muted-foreground text-primary">
              ✓ Affiliate link copied from Native
            </p>
          )}
          {paid.fileUrls.length > 0 && (
            <p className="text-muted-foreground">
              Files: <span className="text-foreground">{paid.fileUrls.length} uploaded</span>
            </p>
          )}
        </div>
      );
    }

    // Standard channels (media, newsletter, contentMarketing)
    const standard = channel as StandardChannelAssets;
    return (
      <div className="mt-3 pt-3 border-t border-success/20 space-y-1 text-sm">
        {standard.contextInstructions && (
          <p className="text-muted-foreground truncate">
            Instructions: {standard.contextInstructions.substring(0, 50)}...
          </p>
        )}
        {standard.fileUrls.length > 0 && (
          <p className="text-muted-foreground">
            Files: <span className="text-foreground">{standard.fileUrls.length} uploaded</span>
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Summary Header */}
      <Card className="shadow-lg border border-border bg-card overflow-hidden">
        <div className="gradient-primary p-6 text-primary-foreground">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-primary-foreground/20 backdrop-blur-sm flex items-center justify-center">
              <Check className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Submission Summary</h1>
              <p className="text-primary-foreground/80 mt-1">
                Review your submission for {data.companyName}
              </p>
            </div>
          </div>
        </div>

        <CardContent className="p-6 space-y-6">
          {/* Company Info */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-healthcare-blue-light flex items-center justify-center">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Company</p>
                <p className="font-semibold text-foreground">{data.companyName}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-healthcare-blue-light flex items-center justify-center">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Submission Date</p>
                <p className="font-semibold text-foreground">{format(data.submissionDate, "PPP")}</p>
              </div>
            </div>

            {data.targetLaunchDate && (
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-success-light flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Target Launch</p>
                  <p className="font-semibold text-foreground">{format(data.targetLaunchDate, "PPP")}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-warning-light flex items-center justify-center">
                <User className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Primary Contact</p>
                <p className="font-semibold text-foreground">{data.primaryContact.name}</p>
                <p className="text-sm text-primary">{data.primaryContact.email}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Channels Summary */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-lg bg-success-light flex items-center justify-center">
                <Palette className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Creative Assets</p>
                <p className="text-sm text-muted-foreground">
                  {completedChannels.length} of 5 channels completed
                </p>
              </div>
            </div>

            <div className="grid gap-3">
              {Object.entries(data.channels).map(([key, channel]) => {
                const channelKey = key as ChannelKey;
                const config = channelConfig[channelKey];
                const isComplete = channel.completed;

                return (
                  <div
                    key={key}
                    className={cn(
                      "p-4 rounded-lg border transition-colors",
                      isComplete
                        ? "bg-success-light/50 border-success/20"
                        : "bg-muted/30 border-border"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-primary">{config.icon}</span>
                        <span className="font-medium">{config.name}</span>
                      </div>
                      <Badge
                        variant={isComplete ? "default" : "secondary"}
                        className={cn(
                          isComplete && "bg-success hover:bg-success"
                        )}
                      >
                        {isComplete ? (
                          <>
                            <Check className="h-3 w-3 mr-1" />
                            Complete
                          </>
                        ) : (
                          "Incomplete"
                        )}
                      </Badge>
                    </div>

                    {renderChannelDetails(channelKey, channel)}
                  </div>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* Stakeholders Summary */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-lg bg-warning-light flex items-center justify-center">
                <Users className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Stakeholders</p>
                <p className="text-sm text-muted-foreground">
                  {data.stakeholders.length} contact{data.stakeholders.length !== 1 ? "s" : ""} added
                </p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              {data.stakeholders.map((stakeholder) => (
                <div
                  key={stakeholder.id}
                  className="p-4 rounded-lg bg-muted/30 border border-border"
                >
                  <p className="font-medium text-foreground">{stakeholder.name}</p>
                  {stakeholder.role && (
                    <p className="text-sm text-muted-foreground">{stakeholder.role}</p>
                  )}
                  <p className="text-sm text-primary mt-1">{stakeholder.email}</p>
                  {stakeholder.phone && (
                    <p className="text-sm text-muted-foreground">{stakeholder.phone}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendly Section */}
      <Card className="shadow-lg border border-border bg-card">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
              <Calendar className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <CardTitle className="text-xl">Book Your Sync Meeting</CardTitle>
              <CardDescription>
                Schedule a recurring partner sync to review campaign performance
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/50 rounded-xl p-8 text-center border border-border">
            <p className="text-muted-foreground mb-4">
              Calendly widget will appear here once you've configured your booking link.
            </p>
            <Button variant="outline" className="gap-2">
              <ExternalLink className="h-4 w-4" />
              Open Calendly
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Edit
        </Button>
        <Button variant="gradient" size="lg" onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Check className="h-5 w-5 mr-2" />
              Submit All Assets
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
