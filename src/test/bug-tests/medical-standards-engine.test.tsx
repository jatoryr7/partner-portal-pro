/**
 * Bug Tests for Medical Standards Engine
 * 
 * Phase 2 Requirement: Already complete with A–F scoring system
 * 
 * Expected Features:
 * - A–F scoring system (A: 9+, B: 7+, C: 5+, D: 3+, F: <3)
 * - Three criteria: Clinical Evidence, Safety Profile, Transparency
 * - Scoring interface with sliders (1–10)
 * - Medical review notes, clinical claims, safety concerns, required disclaimers
 * - Final decision workflow (Approve/Reject/Requires Revision)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { MedicalScoringInterface } from '@/components/admin/medical/MedicalScoringInterface';
import { calculateGrade, MedicalReview } from '@/hooks/useMedicalReviews';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
};

// Mock review data
const mockReview: MedicalReview = {
  id: 'test-review-id',
  partner_id: 'test-partner-id',
  deal_id: null,
  status: 'in_medical_review',
  bd_approved_by: null,
  bd_approved_at: null,
  bd_notes: 'Test BD notes',
  estimated_revenue: 10000,
  clinical_evidence_score: 5,
  safety_score: 5,
  transparency_score: 5,
  overall_grade: null,
  medical_reviewer_id: null,
  medical_reviewed_at: null,
  medical_notes: null,
  clinical_claims: null,
  safety_concerns: null,
  required_disclaimers: null,
  final_decision_by: null,
  final_decision_at: null,
  final_decision_notes: null,
  report_generated_at: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  partners: {
    id: 'test-partner-id',
    company_name: 'Test Brand',
    primary_contact_name: null,
    primary_contact_email: null,
  },
  campaign_deals: null,
};

describe('Medical Standards Engine', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    queryClient.clear(); // Clear all query data between tests
    vi.clearAllMocks();
  });

  describe('A-F Scoring System', () => {
    it('BUG: Should calculate grade A for average score >= 9', () => {
      const grade = calculateGrade({ clinical: 9, safety: 9, transparency: 9 });
      expect(grade).toBe('A');
    });

    it('BUG: Should calculate grade B for average score >= 7 and < 9', () => {
      const grade = calculateGrade({ clinical: 7, safety: 7, transparency: 7 });
      expect(grade).toBe('B');
      
      const grade2 = calculateGrade({ clinical: 8, safety: 8, transparency: 8 });
      expect(grade2).toBe('B');
    });

    it('BUG: Should calculate grade C for average score >= 5 and < 7', () => {
      const grade = calculateGrade({ clinical: 5, safety: 5, transparency: 5 });
      expect(grade).toBe('C');
      
      const grade2 = calculateGrade({ clinical: 6, safety: 6, transparency: 6 });
      expect(grade2).toBe('C');
    });

    it('BUG: Should calculate grade D for average score >= 3 and < 5', () => {
      const grade = calculateGrade({ clinical: 3, safety: 3, transparency: 3 });
      expect(grade).toBe('D');
      
      const grade2 = calculateGrade({ clinical: 4, safety: 4, transparency: 4 });
      expect(grade2).toBe('D');
    });

    it('BUG: Should calculate grade F for average score < 3', () => {
      const grade = calculateGrade({ clinical: 2, safety: 2, transparency: 2 });
      expect(grade).toBe('F');
      
      const grade2 = calculateGrade({ clinical: 1, safety: 1, transparency: 1 });
      expect(grade2).toBe('F');
    });

    it('BUG: Should handle null scores gracefully', () => {
      const grade = calculateGrade({ clinical: null, safety: 5, transparency: 5 });
      expect(grade).toBeNull();
    });
  });

  describe('Scoring Criteria', () => {
    it('BUG: Should have Clinical Evidence scoring slider', async () => {
      const user = userEvent.setup();
      // Set mock data in query client
      queryClient.setQueryData(['medical-reviews', 'in_medical_review'], [mockReview]);

      render(
        <BrowserRouter>
          <QueryClientProvider client={queryClient}>
            <MedicalScoringInterface />
          </QueryClientProvider>
        </BrowserRouter>
      );
      
      // Wait for the component to render with data and find the Score button
      await waitFor(() => {
        expect(screen.queryByText(/test brand/i)).toBeInTheDocument();
      });
      
      // Click the "Score" button to open the dialog
      const scoreButton = await screen.findByRole('button', { name: /score/i });
      await user.click(scoreButton);
      
      // Wait for dialog to open and check for Clinical Evidence
      const dialog = await screen.findByRole('dialog');
      expect(within(dialog).queryByText(/clinical evidence/i)).toBeInTheDocument();
    });

    it('BUG: Should have Safety Profile scoring slider', async () => {
      const user = userEvent.setup();
      // Set mock data in query client
      queryClient.setQueryData(['medical-reviews', 'in_medical_review'], [mockReview]);

      render(
        <BrowserRouter>
          <QueryClientProvider client={queryClient}>
            <MedicalScoringInterface />
          </QueryClientProvider>
        </BrowserRouter>
      );
      
      // Wait for the component to render with data and find the Score button
      await waitFor(() => {
        expect(screen.queryByText(/test brand/i)).toBeInTheDocument();
      });
      
      // Click the "Score" button to open the dialog
      const scoreButton = await screen.findByRole('button', { name: /score/i });
      await user.click(scoreButton);
      
      // Wait for dialog to open and check for Safety Profile
      await waitFor(() => {
        const dialog = screen.queryByRole('dialog');
        expect(dialog).toBeInTheDocument();
      });
      
      const dialog = screen.getByRole('dialog');
      expect(within(dialog).queryByText(/safety profile/i)).toBeInTheDocument();
    });

    it('BUG: Should have Transparency scoring slider', async () => {
      const user = userEvent.setup();
      // Set mock data in query client
      queryClient.setQueryData(['medical-reviews', 'in_medical_review'], [mockReview]);

      render(
        <BrowserRouter>
          <QueryClientProvider client={queryClient}>
            <MedicalScoringInterface />
          </QueryClientProvider>
        </BrowserRouter>
      );
      
      // Wait for the component to render with data and find the Score button
      await waitFor(() => {
        expect(screen.queryByText(/test brand/i)).toBeInTheDocument();
      });
      
      // Click the "Score" button to open the dialog
      const scoreButton = await screen.findByRole('button', { name: /score/i });
      await user.click(scoreButton);
      
      // Wait for dialog to open and check for Transparency
      const dialog = await screen.findByRole('dialog');
      expect(within(dialog).queryByText(/transparency/i)).toBeInTheDocument();
    });

    it('BUG: Sliders should have range 1-10', async () => {
      const user = userEvent.setup();
      // Set mock data in query client
      queryClient.setQueryData(['medical-reviews', 'in_medical_review'], [mockReview]);

      render(
        <BrowserRouter>
          <QueryClientProvider client={queryClient}>
            <MedicalScoringInterface />
          </QueryClientProvider>
        </BrowserRouter>
      );
      
      // Wait for the component to render with data and find the Score button
      await waitFor(() => {
        expect(screen.queryByText(/test brand/i)).toBeInTheDocument();
      });
      
      // Click the "Score" button to open the dialog
      const scoreButton = await screen.findByRole('button', { name: /score/i });
      await user.click(scoreButton);
      
      // Wait for dialog to open and check for sliders
      await waitFor(() => {
        const dialog = screen.queryByRole('dialog');
        expect(dialog).toBeInTheDocument();
      });
      
      const dialog = screen.getByRole('dialog');
      const sliders = within(dialog).queryAllByRole('slider');
      sliders.forEach(slider => {
        const min = slider.getAttribute('aria-valuemin');
        const max = slider.getAttribute('aria-valuemax');
        expect(min).toBe('1');
        expect(max).toBe('10');
      });
    });
  });

  describe('Review Details', () => {
    it('BUG: Should have Medical Review Notes field', async () => {
      const user = userEvent.setup();
      // Set mock data in query client
      queryClient.setQueryData(['medical-reviews', 'in_medical_review'], [mockReview]);

      render(
        <BrowserRouter>
          <QueryClientProvider client={queryClient}>
            <MedicalScoringInterface />
          </QueryClientProvider>
        </BrowserRouter>
      );
      
      // Wait for the component to render with data and find the Score button
      await waitFor(() => {
        expect(screen.queryByText(/test brand/i)).toBeInTheDocument();
      });
      
      // Click the "Score" button to open the dialog
      const scoreButton = await screen.findByRole('button', { name: /score/i });
      await user.click(scoreButton);
      
      // Wait for dialog to open and check for Medical Review Notes
      const dialog = await screen.findByRole('dialog');
      expect(within(dialog).queryByText(/medical review notes/i)).toBeInTheDocument();
    });

    it('BUG: Should have Clinical Claims field', async () => {
      const user = userEvent.setup();
      // Set mock data in query client
      queryClient.setQueryData(['medical-reviews', 'in_medical_review'], [mockReview]);

      render(
        <BrowserRouter>
          <QueryClientProvider client={queryClient}>
            <MedicalScoringInterface />
          </QueryClientProvider>
        </BrowserRouter>
      );
      
      // Wait for the component to render with data and find the Score button
      await waitFor(() => {
        expect(screen.queryByText(/test brand/i)).toBeInTheDocument();
      });
      
      // Click the "Score" button to open the dialog
      const scoreButton = await screen.findByRole('button', { name: /score/i });
      await user.click(scoreButton);
      
      // Wait for dialog to open and check for Clinical Claims
      await waitFor(() => {
        const dialog = screen.queryByRole('dialog');
        expect(dialog).toBeInTheDocument();
      });
      
      const dialog = screen.getByRole('dialog');
      expect(within(dialog).queryByText(/clinical claims/i)).toBeInTheDocument();
    });

    it('BUG: Should have Safety Concerns field', async () => {
      const user = userEvent.setup();
      // Set mock data in query client
      queryClient.setQueryData(['medical-reviews', 'in_medical_review'], [mockReview]);

      render(
        <BrowserRouter>
          <QueryClientProvider client={queryClient}>
            <MedicalScoringInterface />
          </QueryClientProvider>
        </BrowserRouter>
      );
      
      // Wait for the component to render with data and find the Score button
      await waitFor(() => {
        expect(screen.queryByText(/test brand/i)).toBeInTheDocument();
      });
      
      // Click the "Score" button to open the dialog
      const scoreButton = await screen.findByRole('button', { name: /score/i });
      await user.click(scoreButton);
      
      // Wait for dialog to open and check for Safety Concerns
      const dialog = await screen.findByRole('dialog');
      expect(within(dialog).queryByText(/safety concerns/i)).toBeInTheDocument();
    });

    it('BUG: Should have Required Disclaimers field', async () => {
      const user = userEvent.setup();
      // Set mock data in query client
      queryClient.setQueryData(['medical-reviews', 'in_medical_review'], [mockReview]);

      render(
        <BrowserRouter>
          <QueryClientProvider client={queryClient}>
            <MedicalScoringInterface />
          </QueryClientProvider>
        </BrowserRouter>
      );
      
      // Wait for the component to render with data and find the Score button
      await waitFor(() => {
        expect(screen.queryByText(/test brand/i)).toBeInTheDocument();
      });
      
      // Click the "Score" button to open the dialog
      const scoreButton = await screen.findByRole('button', { name: /score/i });
      await user.click(scoreButton);
      
      // Wait for dialog to open and check for Required Disclaimers
      await waitFor(() => {
        const dialog = screen.queryByRole('dialog');
        expect(dialog).toBeInTheDocument();
      });
      
      const dialog = screen.getByRole('dialog');
      expect(within(dialog).queryByText(/required disclaimers/i)).toBeInTheDocument();
    });
  });

  describe('Final Decision Workflow', () => {
    it('BUG: Should have Approve button', async () => {
      const user = userEvent.setup();
      const reviewWithGrade = { ...mockReview, overall_grade: 'B' };
      // Set mock data in query client
      queryClient.setQueryData(['medical-reviews', 'in_medical_review'], [reviewWithGrade]);

      render(
        <BrowserRouter>
          <QueryClientProvider client={queryClient}>
            <MedicalScoringInterface />
          </QueryClientProvider>
        </BrowserRouter>
      );
      
      // Click the "Decision" button to open the decision dialog
      const decisionButton = await screen.findByRole('button', { name: /decision/i });
      await user.click(decisionButton);
      
      // Wait for dialog to open and check for Approve button
      const dialog = await screen.findByRole('dialog');
      expect(within(dialog).queryByRole('button', { name: /approve/i })).toBeInTheDocument();
    });

    it('BUG: Should have Reject button', async () => {
      const user = userEvent.setup();
      const reviewWithGrade = { ...mockReview, overall_grade: 'B' };
      // Set mock data in query client
      queryClient.setQueryData(['medical-reviews', 'in_medical_review'], [reviewWithGrade]);

      render(
        <BrowserRouter>
          <QueryClientProvider client={queryClient}>
            <MedicalScoringInterface />
          </QueryClientProvider>
        </BrowserRouter>
      );
      
      // Click the "Decision" button to open the decision dialog
      const decisionButton = await screen.findByRole('button', { name: /decision/i });
      await user.click(decisionButton);
      
      // Wait for dialog to open and check for Reject button
      await waitFor(() => {
        const dialog = screen.queryByRole('dialog');
        expect(dialog).toBeInTheDocument();
      });
      
      const dialog = screen.getByRole('dialog');
      expect(within(dialog).queryByRole('button', { name: /reject/i })).toBeInTheDocument();
    });

    it('BUG: Should have Requires Revision button', async () => {
      const user = userEvent.setup();
      const reviewWithGrade = { ...mockReview, overall_grade: 'B' };
      // Set mock data in query client
      queryClient.setQueryData(['medical-reviews', 'in_medical_review'], [reviewWithGrade]);

      render(
        <BrowserRouter>
          <QueryClientProvider client={queryClient}>
            <MedicalScoringInterface />
          </QueryClientProvider>
        </BrowserRouter>
      );
      
      // Click the "Decision" button to open the decision dialog
      const decisionButton = await screen.findByRole('button', { name: /decision/i });
      await user.click(decisionButton);
      
      // Wait for dialog to open and check for Requires Revision button
      const dialog = await screen.findByRole('dialog');
      expect(within(dialog).queryByRole('button', { name: /requires revision|revision/i })).toBeInTheDocument();
    });
  });

  describe('Design System Compliance', () => {
    it('BUG: Should use 0px border-radius (rounded-none)', () => {
      const { container } = render(
        <BrowserRouter>
          <QueryClientProvider client={queryClient}>
            <MedicalScoringInterface />
          </QueryClientProvider>
        </BrowserRouter>
      );
      
      const roundedNoneElements = container.querySelectorAll('[class*="rounded-none"]');
      expect(roundedNoneElements.length).toBeGreaterThan(0);
    });
  });
});
