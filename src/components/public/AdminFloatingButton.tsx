import { Button } from '@/components/ui/button';
import { ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function AdminFloatingButton() {
  const navigate = useNavigate();

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Button
        onClick={() => navigate('/admin')}
        className="rounded-none bg-[#1ABC9C] hover:bg-[#16A085] text-white shadow-lg hover:shadow-xl transition-all"
        size="lg"
      >
        <ArrowUpRight className="h-4 w-4 mr-2" />
        Go to Command Center
      </Button>
    </div>
  );
}
