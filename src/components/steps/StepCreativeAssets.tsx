import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, AlertCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { PartnerData, ChannelData, ChannelAssets } from "@/components/OnboardingWizard";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface StepCreativeAssetsProps {
  data: PartnerData;
  onUpdate: (updates: Partial<PartnerData>) => void;
  onNext: () => void;
  onBack: () => void;
}

interface ChannelConfig {
  key: keyof ChannelData;
  name: string;
  icon: string;
  color: string;
  requiresLink: boolean;
  requiresCopy: boolean;
  specs: {
    creative: string;
    copy?: string;
  };
}

const channels: ChannelConfig[] = [
  {
    key: "meta",
    name: "Meta",
    icon: "📘",
    color: "bg-blue-500",
    requiresLink: true,
    requiresCopy: true,
    specs: {
      creative: "1080x1080px or 1080x1920px (Image/Video)",
      copy: "Primary text: 125 chars, Headline: 40 chars",
    },
  },
  {
    key: "tiktok",
    name: "TikTok",
    icon: "🎵",
    color: "bg-pink-500",
    requiresLink: true,
    requiresCopy: true,
    specs: {
      creative: "1080x1920px (9:16 vertical video)",
      copy: "Caption: 150 chars recommended",
    },
  },
  {
    key: "googleDisplay",
    name: "Google Display",
    icon: "🔍",
    color: "bg-green-500",
    requiresLink: true,
    requiresCopy: false,
    specs: {
      creative: "Multiple sizes: 300x250, 728x90, 160x600",
    },
  },
  {
    key: "youtube",
    name: "YouTube",
    icon: "▶️",
    color: "bg-red-500",
    requiresLink: false,
    requiresCopy: true,
    specs: {
      creative: "1920x1080px (16:9 video)",
      copy: "Title: 100 chars, Description: 5000 chars",
    },
  },
  {
    key: "linkedin",
    name: "LinkedIn",
    icon: "💼",
    color: "bg-blue-700",
    requiresLink: false,
    requiresCopy: true,
    specs: {
      creative: "1200x627px or 1080x1080px",
      copy: "Post text: 3000 chars, Headline: 70 chars",
    },
  },
];

export function StepCreativeAssets({
  data,
  onUpdate,
  onNext,
  onBack,
}: StepCreativeAssetsProps) {
  const [activeChannel, setActiveChannel] = useState<keyof ChannelData>("meta");
  const { toast } = useToast();

  const validateUrl = (url: string): boolean => {
    if (!url) return true;
    try {
      const parsed = new URL(url);
      return parsed.protocol === "https:";
    } catch {
      return false;
    }
  };

  const updateChannel = (
    channelKey: keyof ChannelData,
    field: keyof ChannelAssets,
    value: string | boolean
  ) => {
    const updatedChannels = {
      ...data.channels,
      [channelKey]: {
        ...data.channels[channelKey],
        [field]: value,
      },
    };

    // Check if channel is completed
    const channel = updatedChannels[channelKey];
    const config = channels.find((c) => c.key === channelKey)!;
    
    const isCompleted =
      channel.creativeUrl.trim() !== "" &&
      (!config.requiresCopy || channel.copy.trim() !== "") &&
      (!config.requiresLink || channel.affiliateLink.trim() !== "");

    updatedChannels[channelKey].completed = isCompleted;

    onUpdate({ channels: updatedChannels });
  };

  const handleNext = () => {
    // Validate all URLs
    for (const channel of channels) {
      const channelData = data.channels[channel.key];
      
      if (channelData.creativeUrl && !validateUrl(channelData.creativeUrl)) {
        toast({
          title: "Invalid URL",
          description: `${channel.name} creative URL must start with https://`,
          variant: "destructive",
        });
        setActiveChannel(channel.key);
        return;
      }

      if (channel.requiresLink && channelData.affiliateLink && !validateUrl(channelData.affiliateLink)) {
        toast({
          title: "Invalid URL",
          description: `${channel.name} affiliate link must start with https://`,
          variant: "destructive",
        });
        setActiveChannel(channel.key);
        return;
      }
    }

    onNext();
  };

  const completedCount = Object.values(data.channels).filter((c) => c.completed).length;

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="shadow-lg border-0 bg-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Creative Assets by Channel</CardTitle>
              <CardDescription className="text-base mt-2">
                Upload your creative assets, copy, and affiliate links for each advertising channel.
              </CardDescription>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-primary">{completedCount}/5</p>
              <p className="text-sm text-muted-foreground">Channels Complete</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs
            value={activeChannel}
            onValueChange={(v) => setActiveChannel(v as keyof ChannelData)}
          >
            <TabsList className="grid grid-cols-5 mb-6 h-auto p-1">
              {channels.map((channel) => {
                const isComplete = data.channels[channel.key].completed;
                return (
                  <TabsTrigger
                    key={channel.key}
                    value={channel.key}
                    className={cn(
                      "flex flex-col gap-1 py-3 relative",
                      isComplete && "bg-success-light"
                    )}
                  >
                    <span className="text-xl">{channel.icon}</span>
                    <span className="text-xs font-medium">{channel.name}</span>
                    {isComplete && (
                      <Check className="absolute top-1 right-1 h-3 w-3 text-success" />
                    )}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {channels.map((channel) => (
              <TabsContent key={channel.key} value={channel.key}>
                <ChannelForm
                  channel={channel}
                  data={data.channels[channel.key]}
                  onUpdate={(field, value) => updateChannel(channel.key, field, value)}
                />
              </TabsContent>
            ))}
          </Tabs>

          <div className="flex justify-between pt-6 border-t mt-6">
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Button variant="gradient" onClick={handleNext}>
              Continue to Stakeholders
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface ChannelFormProps {
  channel: ChannelConfig;
  data: ChannelAssets;
  onUpdate: (field: keyof ChannelAssets, value: string) => void;
}

function ChannelForm({ channel, data, onUpdate }: ChannelFormProps) {
  return (
    <div className="space-y-6">
      {/* Specs Banner */}
      <div className="bg-healthcare-blue-light rounded-lg p-4 flex items-start gap-3">
        <Info className="h-5 w-5 text-primary mt-0.5 shrink-0" />
        <div className="text-sm">
          <p className="font-medium text-foreground">Recommended Specifications</p>
          <p className="text-muted-foreground mt-1">{channel.specs.creative}</p>
          {channel.specs.copy && (
            <p className="text-muted-foreground">{channel.specs.copy}</p>
          )}
        </div>
      </div>

      {/* Creative URL */}
      <div className="space-y-2">
        <Label htmlFor={`${channel.key}-creative`} className="text-base font-medium flex items-center gap-2">
          Creative Asset URL
          <span className="text-destructive">*</span>
        </Label>
        <Input
          id={`${channel.key}-creative`}
          type="url"
          placeholder="https://drive.google.com/... or https://dropbox.com/..."
          value={data.creativeUrl}
          onChange={(e) => onUpdate("creativeUrl", e.target.value)}
          className="h-11"
        />
        <p className="text-sm text-muted-foreground">
          Link to your image or video file (Google Drive, Dropbox, etc.)
        </p>
      </div>

      {/* Copy */}
      {channel.requiresCopy && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor={`${channel.key}-copy`} className="text-base font-medium">
              Ad Copy
              <span className="text-destructive ml-1">*</span>
            </Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <AlertCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>
                    <strong>Healthcare Compliance:</strong> Ensure copy does not make
                    unsubstantiated medical claims. Avoid phrases like "cures" or "guaranteed
                    results."
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Textarea
            id={`${channel.key}-copy`}
            placeholder="Enter your ad copy here..."
            value={data.copy}
            onChange={(e) => onUpdate("copy", e.target.value)}
            rows={4}
            className="resize-none"
          />
        </div>
      )}

      {/* Affiliate Link */}
      {channel.requiresLink && (
        <div className="space-y-2">
          <Label htmlFor={`${channel.key}-link`} className="text-base font-medium flex items-center gap-2">
            Affiliate Link
            <span className="text-destructive">*</span>
          </Label>
          <Input
            id={`${channel.key}-link`}
            type="url"
            placeholder="https://yoursite.com/affiliate?ref=partner"
            value={data.affiliateLink}
            onChange={(e) => onUpdate("affiliateLink", e.target.value)}
            className="h-11"
          />
          <p className="text-sm text-muted-foreground">
            Your tracked affiliate or UTM link for this campaign
          </p>
        </div>
      )}
    </div>
  );
}
