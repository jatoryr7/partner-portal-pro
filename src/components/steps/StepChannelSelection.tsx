import { ArrowLeft, ArrowRight, Sparkles, Share2, FileText, Mail, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { PartnerData, ChannelKey } from "@/types/partner";
import { cn } from "@/lib/utils";

interface StepChannelSelectionProps {
  data: PartnerData;
  onUpdate: (updates: Partial<PartnerData>) => void;
  onNext: () => void;
  onBack: () => void;
}

interface ChannelOption {
  key: ChannelKey;
  name: string;
  icon: React.ReactNode;
  description: string;
}

const channelOptions: ChannelOption[] = [
  {
    key: "native",
    name: "Native",
    icon: <Sparkles className="h-5 w-5" />,
    description: "Affiliate platform integrations with Levanta, CJ, AWIN, and more",
  },
  {
    key: "paidSocialSearch",
    name: "Paid Social/Search",
    icon: <Share2 className="h-5 w-5" />,
    description: "Meta, Google, TikTok, YouTube, and Podcast campaigns",
  },
  {
    key: "media",
    name: "Media",
    icon: <FileText className="h-5 w-5" />,
    description: "Display advertising and media placement assets",
  },
  {
    key: "newsletter",
    name: "Newsletter",
    icon: <Mail className="h-5 w-5" />,
    description: "Email newsletter creative assets and templates",
  },
  {
    key: "contentMarketing",
    name: "Content Marketing",
    icon: <FileText className="h-5 w-5" />,
    description: "Blog posts, articles, and branded content pieces",
  },
];

export function StepChannelSelection({
  data,
  onUpdate,
  onNext,
  onBack,
}: StepChannelSelectionProps) {
  const toggleChannel = (channelKey: ChannelKey) => {
    const currentSelected = data.selectedChannels || [];
    const isSelected = currentSelected.includes(channelKey);
    
    const newSelected = isSelected
      ? currentSelected.filter((c) => c !== channelKey)
      : [...currentSelected, channelKey];
    
    onUpdate({ selectedChannels: newSelected });
  };

  const selectedChannels = data.selectedChannels || [];
  const canContinue = selectedChannels.length > 0;

  return (
    <div className="max-w-3xl mx-auto">
      <Card className="shadow-lg border border-border bg-card">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 h-14 w-14 rounded-full gradient-primary flex items-center justify-center">
            <Package className="h-7 w-7 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">What is your Media Package?</CardTitle>
          <CardDescription className="text-base mt-2 max-w-xl mx-auto">
            Please select the channels included in your signed agreement to customize your creative requirements.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-3">
            {channelOptions.map((channel) => {
              const isSelected = selectedChannels.includes(channel.key);
              
              return (
                <div
                  key={channel.key}
                  onClick={() => toggleChannel(channel.key)}
                  className={cn(
                    "flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all duration-200",
                    isSelected
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border hover:border-primary/50 hover:bg-muted/50"
                  )}
                >
                  <Checkbox
                    id={channel.key}
                    checked={isSelected}
                    onCheckedChange={() => toggleChannel(channel.key)}
                    className="mt-0.5"
                  />
                  <div
                    className={cn(
                      "h-10 w-10 rounded-lg flex items-center justify-center shrink-0",
                      isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    )}
                  >
                    {channel.icon}
                  </div>
                  <div className="flex-1">
                    <Label
                      htmlFor={channel.key}
                      className={cn(
                        "text-base font-semibold cursor-pointer",
                        isSelected && "text-primary"
                      )}
                    >
                      {channel.name}
                    </Label>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {channel.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {selectedChannels.length > 0 && (
            <div className="mt-6 p-4 rounded-lg bg-success/10 border border-success/20">
              <p className="text-sm font-medium text-success">
                {selectedChannels.length} channel{selectedChannels.length > 1 ? "s" : ""} selected
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                You'll configure creative assets for: {selectedChannels.map(c => 
                  channelOptions.find(o => o.key === c)?.name
                ).join(", ")}
              </p>
            </div>
          )}

          <div className="flex justify-between pt-6 border-t mt-6">
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Button 
              variant="gradient" 
              onClick={onNext}
              disabled={!canContinue}
            >
              Continue to Creative Assets
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
