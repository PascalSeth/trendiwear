import React from "react";
import Link from "next/link";
import { ArrowRight, MapPin, Instagram, Twitter, Linkedin, Facebook, type LucideIcon } from "lucide-react";
import InstallPWALink from "./InstallPWALink";

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
    { label: "About", href: "/about" },
    { label: "Careers", href: "/careers" },
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
  ];

  return (
    <footer className="bg-[#FAFAF9] text-stone-900 border-t border-stone-200 pt-10 pb-6">
      <div className="max-w-[1400px] mx-auto px-6">

        {/* MAIN GRID: Brand + Links + Newsletter */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 lg:gap-6 pb-8 border-b border-stone-200">

          {/* Column 1: Brand & Socials */}
          <div className="col-span-2 md:col-span-1 space-y-4">
            <Link href="/" className="text-red-900 font-serif font-bold italic text-xl">
              Trendizip.
            </Link>
            <div className="flex items-start gap-2 text-stone-500 text-xs leading-relaxed">
              <MapPin size={14} className="mt-0.5 shrink-0" />
              <span>Shalom Estate, Shalom Jct Rd, Adenta, Ghana</span>
            </div>
            <div className="flex items-center gap-2">
              <SocialIcon Icon={Instagram} href="https://www.instagram.com/_trendizip?igsh=MTNlN2t0aTR0cjI5OA==" />
              <SocialIcon Icon={Twitter} href="https://x.com/TrendiZip" />
              <SocialIcon Icon={Facebook} href="https://www.facebook.com/share/1HURhta5zP/" />
              <Link
                href="https://www.tiktok.com/@trendizip_?_r=1&_t=ZS-95CfXvUKWm7"
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-full border border-stone-200 text-stone-400 hover:text-red-900 hover:border-stone-400 transition-all duration-200"
              >
                <TikTokIcon size={14} />
              </Link>
              <SocialIcon Icon={Linkedin} href="https://linkedin.com" />
            </div>
          </div>

          {/* Column 2: Explore */}
          <FooterColumn title="Explore" links={exploreLinks}>
            <InstallPWALink />
          </FooterColumn>

          {/* Column 3: Support */}
          <FooterColumn title="Support" links={supportLinks} />

          {/* Column 4: Company */}
          <FooterColumn title="Company" links={companyLinks} />

          {/* Column 5: Newsletter */}
          <div className="col-span-2 md:col-span-3 lg:col-span-1">
            <h4 className="text-[11px] font-medium uppercase tracking-[0.15em] text-stone-900 mb-3">
              Newsletter
            </h4>
            <div className="relative group border-b border-stone-300">
              <input
                type="email"
                placeholder="Your email"
                className="w-full bg-transparent text-stone-900 placeholder-stone-400 focus:outline-none py-1.5 pr-8 text-sm"
              />
              <button className="absolute right-0 top-1/2 -translate-y-1/2 text-stone-400 group-hover:text-red-900 transition-colors">
                <ArrowRight size={16} />
              </button>
            </div>
            <p className="text-[10px] text-stone-400 mt-2">
              By subscribing, you agree to our Privacy Policy.
            </p>
          </div>
        </div>

        {/* BOTTOM BAR */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-5">
          <p className="text-[11px] text-stone-400">
            &copy; {currentYear} Trendizip Inc. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-[11px] text-stone-400">
            <Link href="/privacy" className="hover:text-red-900 transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-red-900 transition-colors">Terms</Link>
            <span className="hidden sm:inline text-stone-300">·</span>
            <span className="hidden sm:inline">
              Built by <span className="text-stone-700 font-serif italic font-semibold">Stan Paraclete</span>
            </span>
          </div>
        </div>

      </div>
    </footer>
  );
}

function FooterColumn({ title, links, children }: { title: string; links: { label: string; href: string }[]; children?: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-[11px] font-medium uppercase tracking-[0.15em] text-stone-900 mb-3">
        {title}
      </h4>
      <ul className="space-y-2">
        {links.map((link, idx) => (
          <li key={idx}>
            <Link
              href={link.href}
              className="text-stone-500 hover:text-red-900 transition-colors duration-200 text-[13px]"
            >
              {link.label}
            </Link>
          </li>
        ))}
        {children}
      </ul>
    </div>
  );
}

function TikTokIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
    </svg>
  );
}

function SocialIcon({ Icon, href }: { Icon: LucideIcon; href: string }) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="p-1.5 rounded-full border border-stone-200 text-stone-400 hover:text-red-900 hover:border-stone-400 transition-all duration-200"
    >
      <Icon size={14} />
    </Link>
  );
}