
'use client';
import React from "react";
import Link from "next/link";
import { ArrowRight, MapPin, Instagram, Twitter, Linkedin, type LucideIcon } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const exploreLinks = [
    { label: "Fashion Trends", href: "/fashion-trends" },
    { label: "Tailors & Designers", href: "/tailors-designers" },
    { label: "Shopping", href: "/shopping" },
    { label: "Blog", href: "/blog" },
  ];

  const supportLinks = [
    { label: "Help Center", href: "/help" },
    { label: "Shipping & Returns", href: "/shipping" },
    { label: "Size Guide", href: "/size-guide" },
    { label: "Contact Us", href: "/contact" },
  ];

  const companyLinks = [
    { label: "About Trendizip", href: "/about" },
    { label: "Careers", href: "/careers" },
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
  ];

  return (
    <footer className="bg-[#FAFAF9] text-stone-900 border-t border-stone-200 pt-16 pb-8">
      <div className="max-w-[1600px] mx-auto px-6">
        
        {/* TOP SECTION: Editorial Statement & Newsletter */}
        <div className="flex flex-col lg:flex-row justify-between items-start gap-12 mb-20">
          
          {/* Left: Typography Hook */}
          <div className="max-w-2xl">
            <h2 className="font-serif italic text-5xl md:text-6xl lg:text-7xl text-red-900 leading-[0.9] mb-6">
              Crafted for the <br /> discerning.
            </h2>
            <p className="font-serif text-lg text-stone-500 max-w-md leading-relaxed">
              Connecting the world&apos;s most talented creators with fashion enthusiasts who value detail and quality.
            </p>
          </div>

          {/* Right: Newsletter Input */}
          <div className="w-full lg:w-96">
            <label className="block text-xs font-mono uppercase tracking-[0.2em] text-stone-500 mb-4">
              Subscribe to our newsletter
            </label>
            <div className="relative group border-b border-stone-300 pb-1">
              <input
                type="email"
                placeholder="Enter your email address"
                className="w-full bg-transparent text-stone-900 placeholder-stone-400 focus:outline-none py-2 pr-10 font-serif text-lg"
              />
              <button className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-stone-400 group-hover:text-red-900 transition-colors">
                <ArrowRight size={20} />
              </button>
            </div>
            <p className="text-xs text-stone-400 mt-3 font-mono">
              By subscribing, you agree to our Privacy Policy.
            </p>
          </div>
        </div>

        {/* MIDDLE SECTION: Link Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16 border-b border-stone-200 pb-16">
          
          {/* Column 1: Brand & Contact */}
          <div className="space-y-8">
            <div className="flex items-center gap-2 text-red-900 font-serif font-bold italic text-2xl">
              Trendizip.
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3 text-stone-600 hover:text-stone-900 transition-colors cursor-pointer group">
                <MapPin size={18} className="mt-1 text-stone-400 group-hover:text-red-900 transition-colors" />
                <span className="text-sm leading-relaxed">
                  123 Fashion District<br />
                  New York, NY 10012
                </span>
              </div>
              <div className="flex items-center gap-4">
                <SocialIcon Icon={Instagram} />
                <SocialIcon Icon={Twitter} />
                <SocialIcon Icon={Linkedin} />
              </div>
            </div>
          </div>

          {/* Column 2: Explore */}
          <FooterColumn title="Explore" links={exploreLinks} />

          {/* Column 3: Support */}
          <FooterColumn title="Support" links={supportLinks} />

          {/* Column 4: Company */}
          <FooterColumn title="Company" links={companyLinks} />
        </div>

        {/* BOTTOM SECTION: Legal Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs font-mono text-stone-400 uppercase tracking-wider">
            &copy; {currentYear} Trendizip Inc. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="text-xs font-mono text-stone-400 hover:text-red-900 transition-colors uppercase">
              Privacy
            </Link>
            <Link href="/terms" className="text-xs font-mono text-stone-400 hover:text-red-900 transition-colors uppercase">
              Terms
            </Link>
            <div className="flex items-center gap-2 text-xs font-mono text-stone-500">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
              Systems Operational
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
}

// Sub-component for cleaner code
function FooterColumn({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-stone-900 mb-6">
        {title}
      </h4>
      <ul className="space-y-4">
        {links.map((link, idx) => (
          <li key={idx}>
            <Link 
              href={link.href} 
              className="group relative inline-block text-stone-500 hover:text-red-900 transition-colors duration-300 text-sm font-medium"
            >
              {link.label}
              {/* Navbar-style hover underline */}
              <span className="absolute -bottom-1 left-0 w-full h-[1px] bg-stone-900 transition-transform duration-300 scale-x-0 group-hover:scale-x-100 origin-left"></span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Sub-component for Social Icons
function SocialIcon({ Icon }: { Icon: LucideIcon }) {
  return (
    <button className="p-2 rounded-full border border-stone-200 text-stone-500 hover:text-red-900 hover:border-stone-900 transition-all duration-300">
      <Icon size={16} />
    </button>
  );
}