import { useState } from 'react';
import { Outlet, useLocation } from 'react-router';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ProcessingModal } from '@/components/ui/ProcessingModal';
import { useUIStore } from '@/stores/uiStore';

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const fetchLoadingVisible = useUIStore((s) => s.fetchLoading.visible);
  const actionProcessingOpen = useUIStore((s) => s.processingModal.isOpen && s.processingModal.state === 'processing');
  const isBlocking = fetchLoadingVisible || actionProcessingOpen;

  const [prevPath, setPrevPath] = useState(location.pathname);

  if (location.pathname !== prevPath) {
    setPrevPath(location.pathname);
    setSidebarOpen(false);
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-h-screen lg:ml-64 transition-all duration-300">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main
          className={`flex-1 p-4 sm:p-8 transition-opacity duration-200 ${
            isBlocking ? 'pointer-events-none opacity-50 select-none' : ''
          }`}
        >
          <Outlet />
        </main>
      </div>
      <ProcessingModal />
    </div>
  );
}
