import { useState, useMemo } from "react";
import { ArrowLeft, Check, Info, Copy, Sparkles, FileText, Mail, Share2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { 
  PartnerData, 
  ChannelData,
  ChannelKey,
  NativeChannelAssets,
  PaidSocialSearchAssets,
  StandardChannelAssets,
  AFFILIATE_PLATFORMS,
  DRIVER_TYPES,
  MEDIA_PLATFORMS 
} from "@/types/partner";
import { FileUploadZone } from "@/components/shared/FileUploadZone";
import { MultiSelectTags } from "@/components/shared/MultiSelectTags";
import { RichTextArea } from "@/components/shared/RichTextArea";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface StepCreativeAssetsProps {
  data: PartnerData;
  onUpdate: (updates: Partial<PartnerData>) => void;
  onNext: () => void;
  onBack: () => void;
}

interface ChannelConfig {
  key: ChannelKey;
  name: string;
  icon: React.ReactNode;
  description: string;
}

const allChannels: ChannelConfig[] = [
  {
    key: "native",
    name: "Native",
    icon: <Sparkles className="h-4 w-4" />,
    description: "Expert setup with affiliate platforms and driver types",
  },
  {
    key: "paidSocialSearch",
    name: "Paid Social/Search",
    icon: <Share2 className="h-4 w-4" />,
    description: "Meta, Google, TikTok, YouTube, Podcast campaigns",
  },
  {
    key: "media",
    name: "Media",
    icon: <FileText className="h-4 w-4" />,
    description: "Display and media placement assets",
  },
  {
    key: "newsletter",
    name: "Newsletter",
    icon: <Mail className="h-4 w-4" />,
    description: "Email newsletter creative assets",
  },
  {
    key: "contentMarketing",
    name: "Content Marketing",
    icon: <FileText className="h-4 w-4" />,
    description: "Blog, articles, and content pieces",
  },
];

export function StepCreativeAssets({
  data,
  onUpdate,
  onNext,
  onBack,
}: StepCreativeAssetsProps) {
  const { toast } = useToast();
  
  // Filter channels based on selection
  const channels = useMemo(() => 
    allChannels.filter(c => data.selectedChannels?.includes(c.key)),
    [data.selectedChannels]
  );
  
  const [activeChannel, setActiveChannel] = useState<ChannelKey>(
    channels[0]?.key || "native"
  );

  const updateChannel = <K extends ChannelKey>(
    channelKey: K,
    updates: Partial<ChannelData[K]>
  ) => {
    const updatedChannels = {
      ...data.channels,
      [channelKey]: {
        ...data.channels[channelKey],
        ...updates,
      },
    };

    // Check if channel is completed based on type
    const channel = updatedChannels[channelKey];
    let isCompleted = false;

    if (channelKey === "native") {
      const native = channel as NativeChannelAssets;
      isCompleted = native.affiliatePlatform !== "" && native.fileUrls.length > 0;
    } else if (channelKey === "paidSocialSearch") {
      const paid = channel as PaidSocialSearchAssets;
      isCompleted = paid.mediaPlatform !== "" && paid.fileUrls.length > 0;
    } else {
      const standard = channel as StandardChannelAssets;
      isCompleted = standard.fileUrls.length > 0;
    }

    updatedChannels[channelKey].completed = isCompleted;
    updatedChannels[channelKey].isDraft = false;

    onUpdate({ channels: updatedChannels });
  };

  const copyAffiliateLinkFromNative = () => {
    const nativeLink = data.channels.native.affiliateLink;
    if (nativeLink) {
      updateChannel("paidSocialSearch", { 
        affiliateLink: nativeLink,
        copyFromNative: true 
      });
      toast({
        title: "Link copied",
        description: "Affiliate link copied from Native tab.",
      });
    } else {
      toast({
        title: "No link available",
        description: "Please add an affiliate link in the Native tab first.",
        variant: "destructive",
      });
    }
  };

  // Count completed selected channels
  const completedCount = channels.filter((c) => data.channels[c.key].completed).length;
  const totalSelected = channels.length;
  
  // Validation: all selected channels must be completed
  const allChannelsComplete = completedCount === totalSelected && totalSelected > 0;

  if (channels.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-lg border border-border bg-card">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No channels selected. Please go back and select at least one channel.</p>
            <Button variant="outline" onClick={onBack} className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Channel Selection
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="shadow-lg border border-border bg-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Creative Assets by Channel</CardTitle>
              <CardDescription className="text-base mt-2">
                Upload your creative assets for each selected channel.
              </CardDescription>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-primary">{completedCount}/{totalSelected}</p>
              <p className="text-sm text-muted-foreground">Channels Complete</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs
            value={activeChannel}
            onValueChange={(v) => setActiveChannel(v as ChannelKey)}
          >
            <TabsList className={cn(
              "grid mb-6 h-auto p-1",
              channels.length === 1 && "grid-cols-1",
              channels.length === 2 && "grid-cols-2",
              channels.length === 3 && "grid-cols-3",
              channels.length === 4 && "grid-cols-4",
              channels.length === 5 && "grid-cols-5"
            )}>
              {channels.map((channel) => {
                const isComplete = data.channels[channel.key].completed;
                return (
                  <TabsTrigger
                    key={channel.key}
                    value={channel.key}
                    className={cn(
                      "flex flex-col gap-1 py-3 px-2 relative",
                      isComplete && "bg-success/10"
                    )}
                  >
                    <span>{channel.icon}</span>
                    <span className="text-xs font-medium leading-tight">{channel.name}</span>
                    {isComplete && (
                      <Check className="absolute top-1 right-1 h-3 w-3 text-success" />
                    )}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {/* Native Tab */}
            {data.selectedChannels?.includes("native") && (
              <TabsContent value="native">
                <NativeChannelForm
                  data={data.channels.native}
                  onUpdate={(updates) => updateChannel("native", updates)}
                />
              </TabsContent>
            )}

            {/* Paid Social/Search Tab */}
            {data.selectedChannels?.includes("paidSocialSearch") && (
              <TabsContent value="paidSocialSearch">
                <PaidSocialSearchForm
                  data={data.channels.paidSocialSearch}
                  onUpdate={(updates) => updateChannel("paidSocialSearch", updates)}
                  onCopyFromNative={copyAffiliateLinkFromNative}
                  showCopyFromNative={data.selectedChannels?.includes("native")}
                />
              </TabsContent>
            )}

            {/* Media Tab */}
            {data.selectedChannels?.includes("media") && (
              <TabsContent value="media">
                <StandardChannelForm
                  data={data.channels.media}
                  onUpdate={(updates) => updateChannel("media", updates)}
                  title="Media"
                  description="Upload display and media placement assets"
                />
              </TabsContent>
            )}

            {/* Newsletter Tab */}
            {data.selectedChannels?.includes("newsletter") && (
              <TabsContent value="newsletter">
                <StandardChannelForm
                  data={data.channels.newsletter}
                  onUpdate={(updates) => updateChannel("newsletter", updates)}
                  title="Newsletter"
                  description="Upload email newsletter creative assets"
                />
              </TabsContent>
            )}

            {/* Content Marketing Tab */}
            {data.selectedChannels?.includes("contentMarketing") && (
              <TabsContent value="contentMarketing">
                <StandardChannelForm
                  data={data.channels.contentMarketing}
                  onUpdate={(updates) => updateChannel("contentMarketing", updates)}
                  title="Content Marketing"
                  description="Upload blog, article, and content piece assets"
                />
              </TabsContent>
            )}
          </Tabs>

          {/* Completion Status Banner */}
          {allChannelsComplete && (
            <div className="mt-6 p-4 rounded-lg bg-success/10 border border-success/20 flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-success" />
              <div>
                <p className="font-medium text-success">All channels complete!</p>
                <p className="text-sm text-muted-foreground">You're ready to proceed to the next step.</p>
              </div>
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
              disabled={!allChannelsComplete}
              className={cn(
                "min-w-[140px]",
                allChannelsComplete && "shadow-glow"
              )}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Done
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Native Channel Form
interface NativeChannelFormProps {
  data: NativeChannelAssets;
  onUpdate: (updates: Partial<NativeChannelAssets>) => void;
}

function NativeChannelForm({ data, onUpdate }: NativeChannelFormProps) {
  return (
    <div className="space-y-6">
      <div className="bg-primary/5 rounded-lg p-4 flex items-start gap-3 border border-primary/20">
        <Info className="h-5 w-5 text-primary mt-0.5 shrink-0" />
        <div className="text-sm">
          <p className="font-medium text-foreground">Expert Setup</p>
          <p className="text-muted-foreground mt-1">
            Configure your native advertising with affiliate platform integration and driver types.
          </p>
        </div>
      </div>

      {/* Affiliate Platform Dropdown */}
      <div className="space-y-2">
        <Label className="text-base font-medium">
          Affiliate Platform <span className="text-destructive">*</span>
        </Label>
        <Select
          value={data.affiliatePlatform}
          onValueChange={(value) => onUpdate({ affiliatePlatform: value })}
        >
          <SelectTrigger className="h-11">
            <SelectValue placeholder="Select affiliate platform" />
          </SelectTrigger>
          <SelectContent>
            {AFFILIATE_PLATFORMS.map((platform) => (
              <SelectItem key={platform} value={platform}>
                {platform}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Driver Types Multi-Select */}
      <div className="space-y-2">
        <Label className="text-base font-medium">Driver Types</Label>
        <MultiSelectTags
          options={DRIVER_TYPES}
          selected={data.driverTypes}
          onChange={(selected) => onUpdate({ driverTypes: selected })}
        />
      </div>

      {/* Promo Copy */}
      <div className="space-y-2">
        <Label className="text-base font-medium">Promo Copy</Label>
        <RichTextArea
          value={data.promoCopy}
          onChange={(value) => onUpdate({ promoCopy: value })}
          placeholder="Enter your promotional copy here..."
          maxLength={3000}
        />
      </div>

      {/* Affiliate Link */}
      <div className="space-y-2">
        <Label className="text-base font-medium">Affiliate Link</Label>
        <Input
          type="url"
          placeholder="https://yoursite.com/affiliate?ref=partner"
          value={data.affiliateLink}
          onChange={(e) => onUpdate({ affiliateLink: e.target.value })}
          className="h-11"
        />
      </div>

      {/* File Upload */}
      <div className="space-y-2">
        <Label className="text-base font-medium">
          Bulk Upload (up to 10 files) <span className="text-destructive">*</span>
        </Label>
        <FileUploadZone
          files={data.fileUrls}
          onFilesChange={(files) => onUpdate({ fileUrls: files })}
          maxFiles={10}
        />
      </div>
    </div>
  );
}

// Paid Social/Search Form
interface PaidSocialSearchFormProps {
  data: PaidSocialSearchAssets;
  onUpdate: (updates: Partial<PaidSocialSearchAssets>) => void;
  onCopyFromNative: () => void;
  showCopyFromNative?: boolean;
}

function PaidSocialSearchForm({ data, onUpdate, onCopyFromNative, showCopyFromNative = true }: PaidSocialSearchFormProps) {
  return (
    <div className="space-y-6">
      <div className="bg-primary/5 rounded-lg p-4 flex items-start gap-3 border border-primary/20">
        <Info className="h-5 w-5 text-primary mt-0.5 shrink-0" />
        <div className="text-sm">
          <p className="font-medium text-foreground">Paid Social & Search</p>
          <p className="text-muted-foreground mt-1">
            Configure your paid advertising campaigns across major platforms.
          </p>
        </div>
      </div>

      {/* Media Platform Dropdown */}
      <div className="space-y-2">
        <Label className="text-base font-medium">
          Media Platform <span className="text-destructive">*</span>
        </Label>
        <Select
          value={data.mediaPlatform}
          onValueChange={(value) => onUpdate({ mediaPlatform: value })}
        >
          <SelectTrigger className="h-11">
            <SelectValue placeholder="Select media platform" />
          </SelectTrigger>
          <SelectContent>
            {MEDIA_PLATFORMS.map((platform) => (
              <SelectItem key={platform} value={platform}>
                {platform}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Copy Affiliate Link Toggle */}
      {showCopyFromNative && (
        <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
          <div>
            <Label className="text-base font-medium">Copy Affiliate Link from Native</Label>
            <p className="text-sm text-muted-foreground mt-1">
              Use the same affiliate link from your Native tab
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={data.copyFromNative}
              onCheckedChange={(checked) => {
                if (checked) {
                  onCopyFromNative();
                } else {
                  onUpdate({ copyFromNative: false });
                }
              }}
            />
            <Copy className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      )}

      {/* Affiliate Link */}
      <div className="space-y-2">
        <Label className="text-base font-medium">Affiliate Link</Label>
        <Input
          type="url"
          placeholder="https://yoursite.com/affiliate?ref=partner"
          value={data.affiliateLink}
          onChange={(e) => onUpdate({ affiliateLink: e.target.value, copyFromNative: false })}
          className="h-11"
        />
      </div>

      {/* Ad Copy */}
      <div className="space-y-2">
        <Label className="text-base font-medium">Ad Copy</Label>
        <RichTextArea
          value={data.copy}
          onChange={(value) => onUpdate({ copy: value })}
          placeholder="Enter your ad copy here..."
          maxLength={5000}
        />
      </div>

      {/* File Upload */}
      <div className="space-y-2">
        <Label className="text-base font-medium">
          Upload Files (up to 10) <span className="text-destructive">*</span>
        </Label>
        <FileUploadZone
          files={data.fileUrls}
          onFilesChange={(files) => onUpdate({ fileUrls: files })}
          maxFiles={10}
        />
      </div>
    </div>
  );
}

// Standard Channel Form (Media, Newsletter, Content Marketing)
interface StandardChannelFormProps {
  data: StandardChannelAssets;
  onUpdate: (updates: Partial<StandardChannelAssets>) => void;
  title: string;
  description: string;
}

function StandardChannelForm({ data, onUpdate, title, description }: StandardChannelFormProps) {
  return (
    <div className="space-y-6">
      <div className="bg-primary/5 rounded-lg p-4 flex items-start gap-3 border border-primary/20">
        <Info className="h-5 w-5 text-primary mt-0.5 shrink-0" />
        <div className="text-sm">
          <p className="font-medium text-foreground">{title}</p>
          <p className="text-muted-foreground mt-1">{description}</p>
        </div>
      </div>

      {/* Context/Placement Instructions */}
      <div className="space-y-2">
        <Label className="text-base font-medium">Context/Placement Instructions</Label>
        <RichTextArea
          value={data.contextInstructions}
          onChange={(value) => onUpdate({ contextInstructions: value })}
          placeholder="Describe where these assets should live (e.g., homepage banner, sidebar ad, email header)..."
          maxLength={2000}
          rows={4}
        />
      </div>

      {/* Affiliate Link */}
      <div className="space-y-2">
        <Label className="text-base font-medium">Affiliate Link</Label>
        <Input
          type="url"
          placeholder="https://yoursite.com/affiliate?ref=partner"
          value={data.affiliateLink}
          onChange={(e) => onUpdate({ affiliateLink: e.target.value })}
          className="h-11"
        />
      </div>

      {/* File Upload */}
      <div className="space-y-2">
        <Label className="text-base font-medium">
          Upload Files (up to 10) <span className="text-destructive">*</span>
        </Label>
        <FileUploadZone
          files={data.fileUrls}
          onFilesChange={(files) => onUpdate({ fileUrls: files })}
          maxFiles={10}
        />
      </div>
    </div>
  );
}
