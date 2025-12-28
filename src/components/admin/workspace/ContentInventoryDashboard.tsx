import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table2, Calendar } from 'lucide-react';
import { PlacementsTable } from '@/components/admin/inventory/PlacementsTable';
import { PlacementsCalendar } from '@/components/admin/inventory/PlacementsCalendar';

export function ContentInventoryDashboard() {
  const [activeTab, setActiveTab] = useState('table');

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Content Inventory</h3>
        <p className="text-sm text-muted-foreground">
          Manage Healthline Media placements and availability
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="table" className="gap-2">
            <Table2 className="h-4 w-4" />
            Inventory Table
          </TabsTrigger>
          <TabsTrigger value="calendar" className="gap-2">
            <Calendar className="h-4 w-4" />
            Calendar View
          </TabsTrigger>
        </TabsList>

        <TabsContent value="table" className="mt-6">
          <PlacementsTable />
        </TabsContent>

        <TabsContent value="calendar" className="mt-6">
          <PlacementsCalendar />
        </TabsContent>
      </Tabs>
    </div>
  );
}
