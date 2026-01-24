import React, { useState } from 'react';
import { ExternalLink, Copy, Check, Activity, Shield, Palette, TrendingUp } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

interface PortalCardProps {
  title: string;
  description: string;
  url: string;
  accentColor: string;
  icon: React.ReactNode;
  trafficData: number[];
  isMaintenanceMode: boolean;
  onMaintenanceToggle: (enabled: boolean) => void;
}

const SparklineChart: React.FC<{ data: number[]; color: string }> = ({ data, color }) => {
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const height = 32;
  const width = 100;
  const stepX = width / (data.length - 1);

  const points = data.map((value, index) => {
    const x = index * stepX;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        points={points}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {data.map((value, index) => (
        <circle
          key={index}
          cx={index * stepX}
          cy={height - ((value - min) / range) * height}
          r="2"
          fill={color}
          className="opacity-60"
        />
      ))}
    </svg>
  );
};

const PortalCard: React.FC<PortalCardProps> = ({
  title,
  description,
  url,
  accentColor,
  icon,
  trafficData,
  isMaintenanceMode,
  onMaintenanceToggle,
}) => {
  const [copied, setCopied] = useState(false);
  const totalHits = trafficData.reduce((a, b) => a + b, 0);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success('Link copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div 
      className="bg-white border border-slate-200 p-6 space-y-5"
      style={{ borderRadius: '0px' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div 
            className="p-3"
            style={{ 
              backgroundColor: `${accentColor}15`,
              borderRadius: '0px'
            }}
          >
            <div style={{ color: accentColor }}>{icon}</div>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 text-lg">{title}</h3>
            <p className="text-sm text-slate-500">{description}</p>
          </div>
        </div>
        <div 
          className={`px-2 py-1 text-xs font-medium ${
            isMaintenanceMode 
              ? 'bg-amber-100 text-amber-700' 
              : 'bg-emerald-100 text-emerald-700'
          }`}
          style={{ borderRadius: '0px' }}
        >
          {isMaintenanceMode ? 'Maintenance' : 'Live'}
        </div>
      </div>

      {/* URL Display */}
      <div 
        className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-4 py-3"
        style={{ borderRadius: '0px' }}
      >
        <code className="flex-1 text-sm text-slate-600 truncate font-mono">
          {url}
        </code>
        <button
          onClick={handleCopy}
          className="p-1.5 hover:bg-slate-200 transition-colors text-slate-500"
          style={{ borderRadius: '0px' }}
          title="Copy to clipboard"
        >
          {copied ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
        </button>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 hover:bg-slate-200 transition-colors text-slate-500"
          style={{ borderRadius: '0px' }}
          title="Open in new tab"
        >
          <ExternalLink size={16} />
        </a>
      </div>

      {/* Traffic Analytics */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-slate-500 uppercase tracking-wider font-medium">
            <Activity size={12} style={{ color: accentColor }} />
            24h Traffic Pulse
          </div>
          <div className="flex items-center gap-2">
            <SparklineChart data={trafficData} color={accentColor} />
            <div className="flex items-center gap-1">
              <TrendingUp size={14} style={{ color: accentColor }} />
              <span className="text-sm font-semibold text-slate-700">{totalHits}</span>
              <span className="text-xs text-slate-500">hits</span>
            </div>
          </div>
        </div>
      </div>

      {/* Maintenance Toggle */}
      <div 
        className="flex items-center justify-between pt-4 border-t border-slate-100"
      >
        <div>
          <p className="text-sm font-medium text-slate-700">Maintenance Mode</p>
          <p className="text-xs text-slate-500">Temporarily disable public access</p>
        </div>
        <Switch
          checked={isMaintenanceMode}
          onCheckedChange={onMaintenanceToggle}
        />
      </div>
    </div>
  );
};

const ExternalAccessHub: React.FC = () => {
  const [maintenanceStates, setMaintenanceStates] = useState({
    brandIntegrity: false,
    partnerCreative: false,
  });

  // Mock traffic data (24 hourly data points)
  const brandTrafficData = [12, 18, 15, 22, 28, 35, 42, 38, 45, 52, 48, 55, 62, 58, 65, 72, 68, 75, 82, 78, 85, 92, 88, 95];
  const partnerTrafficData = [8, 12, 15, 18, 22, 25, 28, 32, 35, 38, 42, 45, 48, 52, 55, 58, 62, 65, 68, 72, 75, 78, 82, 85];

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

  const handleMaintenanceToggle = (portal: 'brandIntegrity' | 'partnerCreative') => (enabled: boolean) => {
    setMaintenanceStates(prev => ({ ...prev, [portal]: enabled }));
    toast.success(`${portal === 'brandIntegrity' ? 'Brand Integrity Portal' : 'Partner Creative Portal'} ${enabled ? 'disabled' : 'enabled'}`);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          External Access Hub
        </h1>
        <p className="text-slate-500 text-lg">
          Manage and monitor all public-facing portal entry points
        </p>
      </div>

      {/* Portal Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PortalCard
          title="Brand Integrity Portal"
          description="Public Medical Review submission intake for prospective brands"
          url={`${baseUrl}/brand-application`}
          accentColor="#1ABC9C"
          icon={<Shield size={24} />}
          trafficData={brandTrafficData}
          isMaintenanceMode={maintenanceStates.brandIntegrity}
          onMaintenanceToggle={handleMaintenanceToggle('brandIntegrity')}
        />

        <PortalCard
          title="Partner Creative Portal"
          description="Active partner login for creative assets and campaign materials"
          url={`${baseUrl}/auth`}
          accentColor="#3498DB"
          icon={<Palette size={24} />}
          trafficData={partnerTrafficData}
          isMaintenanceMode={maintenanceStates.partnerCreative}
          onMaintenanceToggle={handleMaintenanceToggle('partnerCreative')}
        />
      </div>

      {/* Summary Stats */}
      <div 
        className="bg-slate-50 border border-slate-200 p-6"
        style={{ borderRadius: '0px' }}
      >
        <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-4">
          Gateway Performance Summary
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="text-3xl font-bold text-slate-900">
              {brandTrafficData.reduce((a, b) => a + b, 0) + partnerTrafficData.reduce((a, b) => a + b, 0)}
            </p>
            <p className="text-sm text-slate-500">Total 24h Visits</p>
          </div>
          <div>
            <p className="text-3xl font-bold" style={{ color: '#1ABC9C' }}>
              {brandTrafficData.reduce((a, b) => a + b, 0)}
            </p>
            <p className="text-sm text-slate-500">Brand Applications</p>
          </div>
          <div>
            <p className="text-3xl font-bold" style={{ color: '#3498DB' }}>
              {partnerTrafficData.reduce((a, b) => a + b, 0)}
            </p>
            <p className="text-sm text-slate-500">Partner Logins</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-emerald-600">
              {Object.values(maintenanceStates).filter(v => !v).length}/2
            </p>
            <p className="text-sm text-slate-500">Portals Live</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExternalAccessHub;
