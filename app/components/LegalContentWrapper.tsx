"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface LegalContentWrapperProps {
  title: string;
  subtitle: string;
  lastUpdated: string;
  children: ReactNode;
}

export default function LegalContentWrapper({
  title,
  subtitle,
  lastUpdated,
  children,
}: LegalContentWrapperProps) {
  return (
    <div className="min-h-screen bg-stone-50 pt-32 pb-24 px-6">
      {/* Subtle Grid Pattern */}
      <div className="fixed inset-0 z-0 opacity-20 pointer-events-none"
        style={{ backgroundImage: 'linear-gradient(#d6d3d1 1px, transparent 1px), linear-gradient(90deg, #d6d3d1 1px, transparent 1px)', backgroundSize: '60px 60px' }}>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto">
        {/* Header */}
        <header className="mb-20 text-center lg:text-left">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <p className="text-[10px] font-mono uppercase tracking-[0.5em] text-stone-400 mb-6">
              Legal Documentation / {lastUpdated}
            </p>
            <h1 className="text-6xl md:text-8xl font-serif font-medium text-stone-900 leading-[0.9] mb-8">
              {title}
            </h1>
            <p className="text-xl font-serif italic text-stone-500 max-w-xl">
              {subtitle}
            </p>
          </motion.div>
        </header>

        {/* Content Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="prose prose-stone max-w-none"
        >
          <div className="bg-white border border-stone-200 p-8 md:p-16 shadow-sm rounded-none relative overflow-hidden">
             {/* Editorial Accent */}
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-900 via-stone-900 to-red-900 opacity-80"></div>
             
             <div className="legal-content text-stone-800 leading-relaxed font-serif text-lg space-y-12">
               {children}
             </div>
          </div>
        </motion.div>

        {/* Footer Note */}
        <footer className="mt-16 text-center">
            <p className="text-xs font-mono text-stone-400 uppercase tracking-widest">
              End of Document — Trendizip Inc.
            </p>
            <p className="mt-4 text-[10px] text-stone-400 italic">
              Questions regarding these terms? Contact us at <a href="mailto:trendiziponline@gmail.com" className="text-stone-900 underline">trendiziponline@gmail.com</a>
            </p>
        </footer>
      </div>

      <style jsx global>{`
        .legal-content h2 {
          font-family: var(--font-serif);
          font-size: 2rem;
          color: #1c1917;
          border-bottom: 1px solid #e7e5e4;
          padding-bottom: 0.5rem;
          margin-top: 4rem;
          margin-bottom: 1.5rem;
        }
        .legal-content p {
          margin-bottom: 1.5rem;
        }
        .legal-content ul {
          list-style: none;
          padding-left: 0;
        }
        .legal-content li {
          position: relative;
          padding-left: 1.5rem;
          margin-bottom: 0.75rem;
        }
        .legal-content li::before {
          content: "—";
          position: absolute;
          left: 0;
          color: #78716c;
        }
        .legal-content strong {
          color: #1c1917;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}
