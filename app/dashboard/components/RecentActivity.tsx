'use client';

import React from 'react';
import { 
  ShoppingBag, 
  Package, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  TrendingUp,
  User,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

export interface ActivityItem {
  id: string;
  type: 'ORDER' | 'PRODUCT' | 'SERVICE' | 'REVIEW';
  title: string;
  description: string;
  timestamp: Date;
  status?: string;
  meta?: {
    customerName?: string;
    [key: string]: unknown;
  };
}

interface RecentActivityProps {
  activities: ActivityItem[];
}

const RecentActivity: React.FC<RecentActivityProps> = ({ activities }) => {
  const getIcon = (type: string, status?: string) => {
    switch (type) {
      case 'ORDER':
        if (status === 'DELIVERED') return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
        if (status === 'PENDING') return <Clock className="w-4 h-4 text-amber-500" />;
        return <ShoppingBag className="w-4 h-4 text-blue-500" />;
      case 'PRODUCT':
        return <Package className="w-4 h-4 text-purple-500" />;
      case 'REVIEW':
        return <TrendingUp className="w-4 h-4 text-pink-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-slate-400" />;
    }
  };

  const getBgColor = (type: string) => {
    switch (type) {
      case 'ORDER': return 'bg-blue-50';
      case 'PRODUCT': return 'bg-purple-50';
      case 'REVIEW': return 'bg-pink-50';
      default: return 'bg-slate-50';
    }
  };

  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-slate-100 rounded-3xl bg-slate-50/30">
        <div className="p-4 rounded-2xl bg-white shadow-sm mb-4">
          <Clock className="w-8 h-8 text-slate-300" />
        </div>
        <p className="text-slate-500 font-medium">No recent activity yet</p>
        <p className="text-slate-400 text-xs mt-1">Activities will appear as your business grows</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <div 
          key={activity.id} 
          className="group relative flex items-start gap-4 p-4 rounded-2xl bg-white/50 border border-transparent hover:border-slate-200 hover:bg-white hover:shadow-lg hover:shadow-slate-200/40 transition-all duration-300"
        >
          <div className={`mt-1 p-2.5 rounded-xl ${getBgColor(activity.type)} transition-transform group-hover:scale-110`}>
            {getIcon(activity.type, activity.status)}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-sm font-bold text-slate-900 truncate group-hover:text-violet-600 transition-colors">
                {activity.title}
              </h4>
              <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap bg-slate-50 px-2 py-0.5 rounded-full">
                {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{activity.description}</p>
            
            <div className="flex items-center gap-3 mt-2">
               {activity.meta?.customerName && (
                 <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
                    <User className="w-3 h-3" />
                    {activity.meta.customerName}
                 </div>
               )}
               <Link 
                 href={activity.type === 'ORDER' ? `/dashboard/orders` : `/dashboard/catalogue/products`}
                 className="flex items-center gap-1 text-[10px] text-violet-500 font-bold hover:text-violet-700 transition-colors"
               >
                 View details <ExternalLink className="w-2.5 h-2.5" />
               </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default RecentActivity;
