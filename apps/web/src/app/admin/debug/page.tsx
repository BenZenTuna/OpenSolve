import DebugDashboard from './DebugDashboard';

export default function DebugPage() {
  const debugKey = process.env.DEBUG_ACCESS_KEY ?? '';

  return <DebugDashboard debugKey={debugKey} />;
}
