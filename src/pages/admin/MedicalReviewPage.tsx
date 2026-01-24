import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, ClipboardList, Microscope } from 'lucide-react';
import { IntakeQueue } from '@/components/admin/medical/IntakeQueue';
import { EvaluationLab } from '@/components/admin/medical/EvaluationLab';
import { MedicalReviewStats } from '@/components/admin/medical/MedicalReviewStats';

export default function MedicalReviewPage() {
  const [activeTab, setActiveTab] = useState('intake');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <Shield className="h-6 w-6 text-[#1ABC9C]" />
            Medical Review
          </h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive medical evaluation and compliance tracking
          </p>
        </div>
      </div>

      <MedicalReviewStats />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-muted/50 rounded-none p-1 h-auto flex-wrap">
          <TabsTrigger 
            value="intake" 
            className="rounded-none data-[state=active]:bg-white data-[state=active]:shadow-sm flex items-center gap-2 px-4 py-2"
          >
            <ClipboardList className="h-4 w-4" />
            Intake Queue
          </TabsTrigger>
          <TabsTrigger 
            value="evaluation" 
            className="rounded-none data-[state=active]:bg-white data-[state=active]:shadow-sm flex items-center gap-2 px-4 py-2"
          >
            <Microscope className="h-4 w-4" />
            Evaluation Lab
          </TabsTrigger>
        </TabsList>

        <TabsContent value="intake" className="mt-4">
          <IntakeQueue />
        </TabsContent>

        <TabsContent value="evaluation" className="mt-4">
          <EvaluationLab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
