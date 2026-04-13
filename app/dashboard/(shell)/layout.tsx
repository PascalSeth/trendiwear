import React from 'react'
import ServerDashboardShell from '../components/ServerDashboardShell';

export default function ShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ServerDashboardShell>
      {children}
    </ServerDashboardShell>
  );
}
