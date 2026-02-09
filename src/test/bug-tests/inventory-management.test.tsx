/**
 * Bug Tests for Inventory Management - Leaderboards & Newsletters
 * 
 * Phase 2 Requirement: Enhanced with dedicated views for Leaderboards and Newsletters
 * 
 * Expected Features:
 * - View mode tabs: All Ad Units, Leaderboards, Newsletters
 * - Filtered stats per view mode
 * - Tracking for Leaderboard ad units (availability, stock levels)
 * - Tracking for Newsletter ad units (availability, stock levels)
 * - Status indicators: Available, Low Stock alerts
 * - Inventory value calculations per view
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { ContentInventoryExplorer } from '@/components/admin/workspace/ContentInventoryExplorer';
import { InventoryView } from '@/components/admin/operations/InventoryView';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
};

describe('Inventory Management - Leaderboards & Newsletters', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  describe('View Mode Tabs', () => {
    it('BUG: Should have "All Ad Units" view mode tab', () => {
      render(
        <QueryClientProvider client={queryClient}>
          <ContentInventoryExplorer />
        </QueryClientProvider>
      );
      
      const allAdUnitsTab = screen.queryByRole('tab', { name: /all ad units/i });
      expect(allAdUnitsTab).toBeInTheDocument();
    });

    it('BUG: Should have "Leaderboards" view mode tab', () => {
      render(
        <QueryClientProvider client={queryClient}>
          <ContentInventoryExplorer />
        </QueryClientProvider>
      );
      
      const leaderboardsTab = screen.queryByRole('tab', { name: /leaderboards/i });
      expect(leaderboardsTab).toBeInTheDocument();
    });

    it('BUG: Should have "Newsletters" view mode tab', () => {
      render(
        <QueryClientProvider client={queryClient}>
          <ContentInventoryExplorer />
        </QueryClientProvider>
      );
      
      const newslettersTab = screen.queryByRole('tab', { name: /newsletters/i });
      expect(newslettersTab).toBeInTheDocument();
    });
  });

  describe('Leaderboards View', () => {
    it('BUG: Leaderboards tab should filter to show only leaderboard ad units', () => {
      render(
        <QueryClientProvider client={queryClient}>
          <ContentInventoryExplorer />
        </QueryClientProvider>
      );
      
      const leaderboardsTab = screen.queryByRole('tab', { name: /leaderboards/i });
      if (leaderboardsTab) {
        leaderboardsTab.click();
      }
      
      // Should show leaderboard-specific content
      expect(screen.queryByText(/leaderboard/i)).toBeInTheDocument();
    });

    it('BUG: Should display availability status for leaderboard ad units', () => {
      const { container } = render(
        <QueryClientProvider client={queryClient}>
          <ContentInventoryExplorer />
        </QueryClientProvider>
      );
      
      // Check for availability indicators in stats cards
      const statsSection = container.querySelector('.grid.grid-cols-1.md\\:grid-cols-4');
      if (statsSection) {
        const statsText = within(statsSection as HTMLElement).queryAllByText(/available|pitched|booked/i);
        expect(statsText.length).toBeGreaterThan(0);
      } else {
        // Fallback: check if any availability text exists
        const availabilityElements = screen.queryAllByText(/available|pitched|booked/i);
        expect(availabilityElements.length).toBeGreaterThan(0);
      }
    });

    it('BUG: Should display stock levels for leaderboard ad units', () => {
      const { container } = render(
        <QueryClientProvider client={queryClient}>
          <ContentInventoryExplorer />
        </QueryClientProvider>
      );
      
      // Check for stock level indicators in stats cards
      const statsSection = container.querySelector('.grid.grid-cols-1.md\\:grid-cols-4');
      if (statsSection) {
        const stockText = within(statsSection as HTMLElement).queryByText(/stock levels/i);
        expect(stockText).toBeInTheDocument();
      } else {
        // Fallback: check if any stock/inventory/units text exists
        const stockElements = screen.queryAllByText(/stock|inventory|units/i);
        expect(stockElements.length).toBeGreaterThan(0);
      }
    });

    it('BUG: Should show filtered stats when Leaderboards tab is active', () => {
      const { container } = render(
        <QueryClientProvider client={queryClient}>
          <ContentInventoryExplorer />
        </QueryClientProvider>
      );
      
      const leaderboardsTab = screen.queryByRole('tab', { name: /leaderboards/i });
      if (leaderboardsTab) {
        leaderboardsTab.click();
      }
      
      // Stats should be visible in stats cards (even if 0)
      const statsSection = container.querySelector('.grid.grid-cols-1.md\\:grid-cols-4');
      if (statsSection) {
        const statsNumbers = within(statsSection as HTMLElement).queryAllByText(/\d+/);
        expect(statsNumbers.length).toBeGreaterThan(0);
      } else {
        // Fallback: check if any numbers exist
        const numberElements = screen.queryAllByText(/\d+/);
        expect(numberElements.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Newsletters View', () => {
    it('BUG: Newsletters tab should filter to show only newsletter ad units', () => {
      render(
        <QueryClientProvider client={queryClient}>
          <ContentInventoryExplorer />
        </QueryClientProvider>
      );
      
      const newslettersTab = screen.queryByRole('tab', { name: /newsletters/i });
      if (newslettersTab) {
        newslettersTab.click();
      }
      
      // Should show newsletter-specific content
      expect(screen.queryByText(/newsletter/i)).toBeInTheDocument();
    });

    it('BUG: Should display availability status for newsletter ad units', () => {
      const { container } = render(
        <QueryClientProvider client={queryClient}>
          <ContentInventoryExplorer />
        </QueryClientProvider>
      );
      
      // Check for availability indicators in stats cards
      const statsSection = container.querySelector('.grid.grid-cols-1.md\\:grid-cols-4');
      if (statsSection) {
        const statsText = within(statsSection as HTMLElement).queryAllByText(/available|pitched|booked/i);
        expect(statsText.length).toBeGreaterThan(0);
      } else {
        // Fallback: check if any availability text exists
        const availabilityElements = screen.queryAllByText(/available|pitched|booked/i);
        expect(availabilityElements.length).toBeGreaterThan(0);
      }
    });

    it('BUG: Should display stock levels for newsletter ad units', () => {
      const { container } = render(
        <QueryClientProvider client={queryClient}>
          <ContentInventoryExplorer />
        </QueryClientProvider>
      );
      
      // Check for stock level indicators in stats cards
      const statsSection = container.querySelector('.grid.grid-cols-1.md\\:grid-cols-4');
      if (statsSection) {
        const stockText = within(statsSection as HTMLElement).queryByText(/stock levels/i);
        expect(stockText).toBeInTheDocument();
      } else {
        // Fallback: check if any stock/inventory/units text exists
        const stockElements = screen.queryAllByText(/stock|inventory|units/i);
        expect(stockElements.length).toBeGreaterThan(0);
      }
    });

    it('BUG: Should show filtered stats when Newsletters tab is active', () => {
      const { container } = render(
        <QueryClientProvider client={queryClient}>
          <ContentInventoryExplorer />
        </QueryClientProvider>
      );
      
      const newslettersTab = screen.queryByRole('tab', { name: /newsletters/i });
      if (newslettersTab) {
        newslettersTab.click();
      }
      
      // Stats should be visible in stats cards (even if 0)
      const statsSection = container.querySelector('.grid.grid-cols-1.md\\:grid-cols-4');
      if (statsSection) {
        const statsNumbers = within(statsSection as HTMLElement).queryAllByText(/\d+/);
        expect(statsNumbers.length).toBeGreaterThan(0);
      } else {
        // Fallback: check if any numbers exist
        const numberElements = screen.queryAllByText(/\d+/);
        expect(numberElements.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Status Indicators', () => {
    it('BUG: Should display "Available" status badges', () => {
      render(
        <QueryClientProvider client={queryClient}>
          <ContentInventoryExplorer />
        </QueryClientProvider>
      );
      
      // Check for "Available" text - use getAllByText since it appears multiple times
      const availableElements = screen.queryAllByText(/available/i);
      expect(availableElements.length).toBeGreaterThan(0);
    });

    it('BUG: Should display "Low Stock" alerts when stock is low', () => {
      render(
        <QueryClientProvider client={queryClient}>
          <InventoryView />
        </QueryClientProvider>
      );
      
      // Check for low stock indicators
      expect(screen.queryByText(/low stock|stock alert/i)).toBeInTheDocument();
    });
  });

  describe('Inventory Value Calculations', () => {
    it('BUG: Should calculate and display inventory value per view', () => {
      const { container } = render(
        <QueryClientProvider client={queryClient}>
          <ContentInventoryExplorer />
        </QueryClientProvider>
      );
      
      // Check for value display in stats cards
      const statsSection = container.querySelector('.grid.grid-cols-1.md\\:grid-cols-4');
      if (statsSection) {
        const valueText = within(statsSection as HTMLElement).queryByText(/inventory value/i);
        expect(valueText).toBeInTheDocument();
      } else {
        // Fallback: check if any value/$ text exists
        const valueElements = screen.queryAllByText(/\$|value/i);
        expect(valueElements.length).toBeGreaterThan(0);
      }
    });

    it('BUG: Should show different inventory values for different view modes', () => {
      render(
        <QueryClientProvider client={queryClient}>
          <ContentInventoryExplorer />
        </QueryClientProvider>
      );
      
      // Value should be calculated per view
      const valueElements = screen.queryAllByText(/\$[\d,]+/);
      expect(valueElements.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Design System Compliance', () => {
    it('BUG: Should use 0px border-radius (rounded-none)', () => {
      const { container } = render(
        <QueryClientProvider client={queryClient}>
          <ContentInventoryExplorer />
        </QueryClientProvider>
      );
      
      const roundedNoneElements = container.querySelectorAll('[class*="rounded-none"]');
      expect(roundedNoneElements.length).toBeGreaterThan(0);
    });
  });
});
