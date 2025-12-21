import { ArrowLeft, Check, ExternalLink, Calendar, Building2, Users, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PartnerData, ChannelData } from "@/components/OnboardingWizard";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface StepSummaryProps {
  data: PartnerData;
  onBack: () => void;
}

const channelNames: Record<keyof ChannelData, { name: string; icon: string }> = {
  meta: { name: "Meta", icon: "📘" },
  tiktok: { name: "TikTok", icon: "🎵" },
  googleDisplay: { name: "Google Display", icon: "🔍" },
  youtube: { name: "YouTube", icon: "▶️" },
  linkedin: { name: "LinkedIn", icon: "💼" },
};

export function StepSummary({ data, onBack }: StepSummaryProps) {
  const { toast } = useToast();
  const completedChannels = Object.entries(data.channels).filter(
    ([_, channel]) => channel.completed
  );
  const incompleteChannels = Object.entries(data.channels).filter(
    ([_, channel]) => !channel.completed
  );

  const handleSubmit = () => {
    toast({
      title: "Submission saved!",
      description: "Your creative assets have been submitted successfully. Book a sync meeting below.",
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Summary Header */}
      <Card className="shadow-lg border-0 bg-card overflow-hidden">
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
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-healthcare-blue-light flex items-center justify-center">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Company</p>
              <p className="font-semibold text-foreground">{data.companyName}</p>
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
                const channelKey = key as keyof ChannelData;
                const config = channelNames[channelKey];
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
                        <span className="text-xl">{config.icon}</span>
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

                    {isComplete && (
                      <div className="mt-3 pt-3 border-t border-success/20 space-y-1 text-sm">
                        {channel.creativeUrl && (
                          <p className="text-muted-foreground truncate">
                            Creative: {channel.creativeUrl}
                          </p>
                        )}
                        {channel.copy && (
                          <p className="text-muted-foreground truncate">
                            Copy: {channel.copy.substring(0, 50)}...
                          </p>
                        )}
                        {channel.affiliateLink && (
                          <p className="text-muted-foreground truncate">
                            Link: {channel.affiliateLink}
                          </p>
                        )}
                      </div>
                    )}
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
      <Card className="shadow-lg border-0 bg-card">
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
          <div className="bg-muted/50 rounded-xl p-8 text-center">
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
        <Button variant="gradient" size="lg" onClick={handleSubmit}>
          <Check className="h-5 w-5 mr-2" />
          Submit All Assets
        </Button>
      </div>
    </div>
  );
}
