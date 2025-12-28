import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClipboardList, Microscope, FileCheck2, Table2 } from 'lucide-react';
import { MedicalReviewStats } from './MedicalReviewStats';
import { SubmissionQueue } from './SubmissionQueue';
import { MedicalScoringInterface } from './MedicalScoringInterface';
import { FinalizedReviews } from './FinalizedReviews';
import { MedicalProductEvaluationTable } from './MedicalProductEvaluationTable';
import { DocumentPreviewer } from './DocumentPreviewer';

interface DocItem {
  id: string;
  name: string;
  url: string;
  type: 'pdf' | 'image' | 'doc';
}

const mockDocuments: DocItem[] = [
  { id: '1', name: 'Lab COA - Batch 2024-01.pdf', url: '/placeholder.svg', type: 'pdf' },
  { id: '2', name: 'Clinical Trial Results.pdf', url: '/placeholder.svg', type: 'pdf' },
  { id: '3', name: 'FDA Compliance Certificate.pdf', url: '/placeholder.svg', type: 'pdf' },
];

export function MedicalReviewDesk() {
  const [selectedDocument, setSelectedDocument] = useState<DocItem | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight">Medical Standards Review</h2>
          <p className="text-muted-foreground">Two-gate approval system for brand compliance</p>
        </div>
      </div>

      <MedicalReviewStats />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Tabs defaultValue="evaluation" className="space-y-4">
            <TabsList className="bg-muted/50 rounded-none p-1 h-auto flex-wrap">
              <TabsTrigger value="evaluation" className="rounded-none data-[state=active]:bg-white data-[state=active]:shadow-sm flex items-center gap-2 px-4 py-2">
                <Table2 className="h-4 w-4" />
                Product Evaluation
              </TabsTrigger>
              <TabsTrigger value="queue" className="rounded-none data-[state=active]:bg-white data-[state=active]:shadow-sm flex items-center gap-2 px-4 py-2">
                <ClipboardList className="h-4 w-4" />
                Submission Queue
              </TabsTrigger>
              <TabsTrigger value="scoring" className="rounded-none data-[state=active]:bg-white data-[state=active]:shadow-sm flex items-center gap-2 px-4 py-2">
                <Microscope className="h-4 w-4" />
                Medical Review
              </TabsTrigger>
              <TabsTrigger value="finalized" className="rounded-none data-[state=active]:bg-white data-[state=active]:shadow-sm flex items-center gap-2 px-4 py-2">
                <FileCheck2 className="h-4 w-4" />
                Finalized
              </TabsTrigger>
            </TabsList>

            <TabsContent value="evaluation" className="mt-4">
              <MedicalProductEvaluationTable />
            </TabsContent>
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

        <div className="lg:col-span-1">
          <DocumentPreviewer
            documents={mockDocuments}
            selectedDocument={selectedDocument}
            onSelectDocument={setSelectedDocument}
          />
        </div>
      </div>
    </div>
  );
}
