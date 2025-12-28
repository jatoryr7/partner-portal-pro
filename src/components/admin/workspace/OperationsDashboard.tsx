import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, Truck, ClipboardList } from 'lucide-react';
import { InventoryView } from '@/components/admin/operations/InventoryView';
import { PurchaseOrdersView } from '@/components/admin/operations/PurchaseOrdersView';
import { SuppliersView } from '@/components/admin/operations/SuppliersView';

export function OperationsDashboard() {
  const [activeTab, setActiveTab] = useState('inventory');

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="inventory" className="gap-2">
            <Package className="h-4 w-4" />
            Inventory
          </TabsTrigger>
          <TabsTrigger value="orders" className="gap-2">
            <ClipboardList className="h-4 w-4" />
            Purchase Orders
          </TabsTrigger>
          <TabsTrigger value="suppliers" className="gap-2">
            <Truck className="h-4 w-4" />
            Suppliers
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="mt-6">
          <InventoryView />
        </TabsContent>

        <TabsContent value="orders" className="mt-6">
          <PurchaseOrdersView />
        </TabsContent>

        <TabsContent value="suppliers" className="mt-6">
          <SuppliersView />
        </TabsContent>
      </Tabs>
    </div>
  );
}
