'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { AlertCircle } from 'lucide-react';

interface SubscriptionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  features: string[];
}

export function SubscriptionModal({ open, onOpenChange, features }: SubscriptionModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            <DialogTitle>Subscription Required</DialogTitle>
          </div>
          <DialogDescription>
            Your subscription has expired or is inactive.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <p className="text-sm font-medium text-orange-900 mb-2">
              The following features are restricted:
            </p>
            <ul className="list-disc list-inside space-y-1">
              {features.map((feature) => (
                <li key={feature} className="text-sm text-orange-800">
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          <p className="text-sm text-gray-600">
            To continue using these features, please renew your subscription.
          </p>

          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Link href="/dashboard/subscription" className="flex-1">
              <Button className="w-full">
                View Plans
              </Button>
            </Link>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
