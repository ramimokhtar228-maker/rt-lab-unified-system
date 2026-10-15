import React from 'react';
import { useOnlineStatus } from '../hooks/usePWAInstall';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2.5 rounded-2xl bg-amber-600/95 backdrop-blur-md px-4 py-2.5 text-xs font-black text-white shadow-2xl border border-amber-400/50 animate-bounce">
      <WifiOff className="w-4 h-4 text-amber-200" />
      <span>وضع العمل دون اتصال — يتم حفظ كافة التغييرات محلياً وسيتم التسميع السحابي فور عودة الإنترنت تلقائياً.</span>
    </div>
  );
};
