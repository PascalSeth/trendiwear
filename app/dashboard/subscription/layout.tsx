'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ShieldCheck, Verified } from 'lucide-react'
import Link from 'next/link'

export default function SubscriptionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#FDFCFE] selection:bg-violet-100 selection:text-violet-900">
      {/* Premium Navigation Header */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100"
      >
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/dashboard">
              <button className="group p-2.5 rounded-2xl bg-slate-50 border border-slate-100 text-slate-400 hover:text-slate-900 hover:border-slate-200 transition-all">
                <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              </button>
            </Link>
            <div className="space-y-0.5">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-600">Secure Billing</p>
                <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase italic">Membership Portal</h1>
            </div>
          </div>
          
          <div className="hidden sm:flex items-center gap-6">
             <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-full border border-slate-100">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Encrypted</span>
             </div>
             <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-full border border-slate-100">
                <Verified className="w-4 h-4 text-amber-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Global Priority</span>
             </div>
          </div>
        </div>
      </motion.header>

      {/* Background Decorative Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-violet-100/30 blur-[120px] rounded-full -mr-64 -mt-64" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-50/50 blur-[120px] rounded-full -ml-64 -mb-64" />
      </div>

      <main className="relative">
        {children}
      </main>

      {/* Minimalist Footer */}
      <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-slate-100 mt-20">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            © 2026 TrendiZip Professional Services
          </p>
          <div className="flex items-center gap-8 text-[10px] font-black uppercase tracking-widest text-slate-500">
            <a href="#" className="hover:text-violet-600 transition-colors">Privacy</a>
            <a href="#" className="hover:text-violet-600 transition-colors">Terms</a>
            <a href="#" className="hover:text-violet-600 transition-colors">Support</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
