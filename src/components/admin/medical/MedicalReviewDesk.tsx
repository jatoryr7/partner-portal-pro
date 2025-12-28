import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClipboardList, Microscope, FileCheck2 } from 'lucide-react';
import { MedicalReviewStats } from './MedicalReviewStats';
import { SubmissionQueue } from './SubmissionQueue';
import { MedicalScoringInterface } from './MedicalScoringInterface';
import { FinalizedReviews } from './FinalizedReviews';

export function MedicalReviewDesk() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight">Medical Standards Review</h2>
          <p className="text-muted-foreground">Two-gate approval system for brand compliance</p>
        </div>
      </div>

      {/* Stats Cards */}
      <MedicalReviewStats />

      {/* Main Content Tabs */}
      <Tabs defaultValue="queue" className="space-y-4">
        <TabsList className="bg-muted/50 rounded-none p-1 h-auto">
          <TabsTrigger 
            value="queue" 
            className="rounded-none data-[state=active]:bg-white data-[state=active]:shadow-sm flex items-center gap-2 px-4 py-2"
          >
            <ClipboardList className="h-4 w-4" />
            Submission Queue
          </TabsTrigger>
          <TabsTrigger 
            value="scoring" 
            className="rounded-none data-[state=active]:bg-white data-[state=active]:shadow-sm flex items-center gap-2 px-4 py-2"
          >
            <Microscope className="h-4 w-4" />
            Medical Review
          </TabsTrigger>
          <TabsTrigger 
            value="finalized" 
            className="rounded-none data-[state=active]:bg-white data-[state=active]:shadow-sm flex items-center gap-2 px-4 py-2"
          >
            <FileCheck2 className="h-4 w-4" />
            Finalized
          </TabsTrigger>
        </TabsList>

        <TabsContent value="queue" className="mt-4">
          <SubmissionQueue />
        </TabsContent>

        <TabsContent value="scoring" className="mt-4">
          <MedicalScoringInterface />
        </TabsContent>

        <TabsContent value="finalized" className="mt-4">
          <FinalizedReviews />
        </TabsContent>
      </Tabs>
    </div>
  );
}
