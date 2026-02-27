'use client';

import { useState } from 'react';
import DashboardTopBar from './DashboardTopBar';
import DashboardSidebar from './DashboardSidebar';
import { Role } from '@prisma/client';
import { X } from 'lucide-react';
import type { UserInfo } from './ServerDashboardShell';

interface DashboardShellProps {
  children: React.ReactNode;
  role: Role;
  userInfo: UserInfo;
}

const DashboardShell: React.FC<DashboardShellProps> = ({ children, role, userInfo }) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <DashboardSidebar role={role} />
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
          {/* Sidebar */}
          <div className="absolute left-0 top-0 h-full w-64 bg-white shadow-xl">
            <button
              onClick={() => setIsMobileSidebarOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-lg text-gray-500 hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
            <DashboardSidebar role={role} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="lg:ml-64 flex flex-col min-h-screen">
        <DashboardTopBar onMenuClick={() => setIsMobileSidebarOpen(true)} userInfo={userInfo} />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardShell;
