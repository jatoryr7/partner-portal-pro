import { BookOpen, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

export function BrandGuidelines() {
  return (
    <div className="space-y-6 text-sm">
      {/* Header */}
      <div className="flex items-center gap-2 text-primary">
        <BookOpen className="w-5 h-5" />
        <span className="font-semibold">Brand Guidelines Reference</span>
      </div>

      {/* Tone of Voice */}
      <section className="space-y-3">
        <h4 className="font-medium text-foreground flex items-center gap-2">
          <Badge variant="outline" className="text-[10px]">01</Badge>
          Tone of Voice
        </h4>
        <ul className="space-y-2 text-muted-foreground">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
            <span>Professional yet approachable</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
            <span>Clear, jargon-free language</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
            <span>Patient-centered messaging</span>
          </li>
          <li className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-warning mt-0.5 flex-shrink-0" />
            <span>Avoid medical claims without disclaimers</span>
          </li>
        </ul>
      </section>

      <Separator />

      {/* Typography */}
      <section className="space-y-3">
        <h4 className="font-medium text-foreground flex items-center gap-2">
          <Badge variant="outline" className="text-[10px]">02</Badge>
          Typography Rules
        </h4>
        <ul className="space-y-2 text-muted-foreground">
          <li className="flex items-start gap-2">
            <Info className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <span>Headlines: Title Case</span>
          </li>
          <li className="flex items-start gap-2">
            <Info className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <span>Body: Sentence case</span>
          </li>
          <li className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-warning mt-0.5 flex-shrink-0" />
            <span>No ALL CAPS except acronyms</span>
          </li>
        </ul>
      </section>

      <Separator />

      {/* Legal Requirements */}
      <section className="space-y-3">
        <h4 className="font-medium text-foreground flex items-center gap-2">
          <Badge variant="outline" className="text-[10px]">03</Badge>
          Legal Requirements
        </h4>
        <ul className="space-y-2 text-muted-foreground">
          <li className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
            <span>HIPAA compliance required</span>
          </li>
          <li className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
            <span>Include FDA disclaimers where applicable</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
            <span>Affiliate disclosure visible</span>
          </li>
        </ul>
      </section>

      <Separator />

      {/* Character Limits */}
      <section className="space-y-3">
        <h4 className="font-medium text-foreground flex items-center gap-2">
          <Badge variant="outline" className="text-[10px]">04</Badge>
          Character Limits
        </h4>
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2 bg-muted/50 rounded-md">
            <p className="text-xs text-muted-foreground">Headlines</p>
            <p className="font-medium">60 chars</p>
          </div>
          <div className="p-2 bg-muted/50 rounded-md">
            <p className="text-xs text-muted-foreground">Subheadlines</p>
            <p className="font-medium">90 chars</p>
          </div>
          <div className="p-2 bg-muted/50 rounded-md">
            <p className="text-xs text-muted-foreground">CTA Text</p>
            <p className="font-medium">25 chars</p>
          </div>
          <div className="p-2 bg-muted/50 rounded-md">
            <p className="text-xs text-muted-foreground">Body Copy</p>
            <p className="font-medium">500 chars</p>
          </div>
        </div>
      </section>

      <Separator />

      {/* Prohibited Terms */}
      <section className="space-y-3">
        <h4 className="font-medium text-foreground flex items-center gap-2">
          <Badge variant="outline" className="text-[10px]">05</Badge>
          Prohibited Terms
        </h4>
        <div className="flex flex-wrap gap-2">
          {['Cure', 'Guaranteed', 'Miracle', 'Risk-free', 'Best', '#1'].map(term => (
            <Badge 
              key={term} 
              variant="outline" 
              className="text-destructive border-destructive/30 bg-destructive/5"
            >
              {term}
            </Badge>
          ))}
        </div>
      </section>
    </div>
  );
}
