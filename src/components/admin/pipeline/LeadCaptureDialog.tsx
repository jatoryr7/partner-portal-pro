import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Loader2, DollarSign } from 'lucide-react';
import { INDUSTRIES, LEAD_SOURCES } from '@/config/inputOptions';

const leadFormSchema = z.object({
  estimated_deal_value: z
    .string()
    .min(1, 'Deal value is required')
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: 'Must be a positive number',
    }),
  company_name: z.string().min(1, 'Company name is required').max(100),
  contact_name: z.string().min(1, 'Contact name is required').max(100),
  contact_email: z.string().email('Invalid email address').max(255),
  contact_phone: z.string().max(20).optional(),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
  industry: z.string().optional(),
  notes: z.string().max(1000).optional(),
  source: z.string().optional(),
});

type LeadFormData = z.infer<typeof leadFormSchema>;

interface LeadCaptureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    company_name: string;
    contact_name: string;
    contact_email: string;
    contact_phone?: string;
    website?: string;
    industry?: string;
    estimated_deal_value?: number;
    notes?: string;
    source?: string;
  }) => void;
  isLoading?: boolean;
}

export function LeadCaptureDialog({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
}: LeadCaptureDialogProps) {
  const form = useForm<LeadFormData>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      estimated_deal_value: '',
      company_name: '',
      contact_name: '',
      contact_email: '',
      contact_phone: '',
      website: '',
      industry: '',
      notes: '',
      source: '',
    },
  });

  const handleFormSubmit = (data: LeadFormData) => {
    onSubmit({
      company_name: data.company_name,
      contact_name: data.contact_name,
      contact_email: data.contact_email,
      estimated_deal_value: parseFloat(data.estimated_deal_value),
      contact_phone: data.contact_phone || undefined,
      website: data.website || undefined,
      industry: data.industry || undefined,
      notes: data.notes || undefined,
      source: data.source || undefined,
    });
  };

  const handleClose = () => {
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto bg-background border-border p-8">
        <DialogHeader className="space-y-3 pb-4">
          <DialogTitle className="text-xl font-bold tracking-tight">
            Add New Lead
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Capture a new brand prospect to add to your sales pipeline.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
            {/* Primary Field - Deal Value at Top */}
            <FormField
              control={form.control}
              name="estimated_deal_value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-bold text-foreground">
                    Estimated Deal Value *
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        <DollarSign className="h-4 w-4" />
                      </div>
                      <Input
                        {...field}
                        type="number"
                        min="0"
                        step="1000"
                        placeholder="50,000"
                        className="pl-9 h-12 text-lg font-medium"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Company Name - Full Width */}
            <FormField
              control={form.control}
              name="company_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-bold text-foreground">
                    Company Name *
                  </FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Acme Corporation" className="h-11" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Contact Info - 2 Column Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="contact_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-bold text-foreground">
                      Contact Name *
                    </FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="John Smith" className="h-11" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contact_email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-bold text-foreground">
                      Contact Email *
                    </FormLabel>
                    <FormControl>
                      <Input {...field} type="email" placeholder="john@acme.com" className="h-11" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contact_phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-bold text-foreground">
                      Contact Phone
                    </FormLabel>
                    <FormControl>
                      <Input {...field} type="tel" placeholder="+1 (555) 123-4567" className="h-11" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-bold text-foreground">
                      Website
                    </FormLabel>
                    <FormControl>
                      <Input {...field} type="url" placeholder="https://acme.com" className="h-11" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Dropdowns - 2 Column Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="industry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-bold text-foreground">
                      Industry
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select industry" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {INDUSTRIES.map((industry) => (
                          <SelectItem key={industry} value={industry}>
                            {industry}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-bold text-foreground">
                      Lead Source
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="How did you find them?" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {LEAD_SOURCES.map((source) => (
                          <SelectItem key={source} value={source}>
                            {source}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Notes - Full Width */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-bold text-foreground">
                    Notes
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Add any relevant context about this prospect..."
                      rows={3}
                      className="resize-none"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Full-width Submit Button */}
            <div className="pt-4 space-y-3">
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 text-base font-semibold"
              >
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Add to Pipeline
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={handleClose}
                className="w-full h-10 text-muted-foreground"
              >
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
