'use client';

import { useEffect, useState } from 'react';
import { SubscriptionModal } from '@/components/subscription/SubscriptionModal';

interface AccessControlWrapperProps {
  children: React.ReactNode;
  requiredPermission: 'ADD_PRODUCT' | 'ADD_SERVICE' | 'VIEW_ANALYTICS';
}

export function AccessControlWrapper({
  children,
  requiredPermission,
}: AccessControlWrapperProps) {
  const [canAccess, setCanAccess] = useState(true);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const res = await fetch('/api/subscriptions/manage');
        if (!res.ok) {
          setCanAccess(false);
          setShowModal(true);
          setLoading(false);
          return;
        }

        const { data } = await res.json();
        
        // Map permission names to subscription features
        const permissionMap: Record<string, keyof typeof data> = {
          'ADD_PRODUCT': 'canAddProducts',
          'ADD_SERVICE': 'canCreateServices',
          'VIEW_ANALYTICS': 'canViewAnalytics',
        };

        const hasPermission = data?.[permissionMap[requiredPermission]] ?? false;
        setCanAccess(hasPermission);
        if (!hasPermission) {
          setShowModal(true);
        }
      } catch (error) {
        console.error('Error checking subscription:', error);
        setCanAccess(false);
        setShowModal(true);
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [requiredPermission]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  const featureNames = {
    'ADD_PRODUCT': ['Add products', 'Edit products', 'Manage inventory'],
    'ADD_SERVICE': ['Create services', 'Edit services', 'Manage offerings'],
    'VIEW_ANALYTICS': ['View analytics', 'Export reports', 'Compare metrics'],
  };

  return (
    <>
      <SubscriptionModal
        open={showModal}
        onOpenChange={setShowModal}
        features={featureNames[requiredPermission]}
      />
      <div className={!canAccess ? 'opacity-50 pointer-events-none' : ''}>
        {children}
      </div>
    </>
  );
}
