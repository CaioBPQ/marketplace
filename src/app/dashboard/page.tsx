'use client';

import InteractiveSalesDashboard from '@/components/InteractiveSalesDashboard';
import IntegrationsHubPanel from '@/components/IntegrationsHubPanel';

export default function DashboardHomePage() {
  return (
    <>
      <InteractiveSalesDashboard defaultTab="BALANCO" />
      <IntegrationsHubPanel />
    </>
  );
}
