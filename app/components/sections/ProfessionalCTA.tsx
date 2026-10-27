"use client";
import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, ShoppingCart, Smartphone, Globe2, Clock, Star, Plus } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const ProfessionalCTA = ({ 
    totalUsers = 25000, 
    totalProfessionals = 25000 
}: { 
    totalUsers?: number; 
    totalProfessionals?: number; 
}) => {
    const containerRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start end", "end start"]
    });

    // Parallax values for subtle, refined motion
    const y1 = useTransform(scrollYProgress, [0, 1], [0, -40]);
    const y2 = useTransform(scrollYProgress, [0, 1], [0, 40]);
    const rotate = useTransform(scrollYProgress, [0, 1], [1.5, -1.5]);

    return (
        <section
            ref={containerRef}
            className="relative bg-[#F8F7F3] py-14 lg:py-18 overflow-hidden font-sans selection:bg-stone-900 selection:text-white border-t border-stone-200/80"
        >
            {/* 1. Subtle Background Watermark */}
            <div className="absolute top-12 left-0 w-full whitespace-nowrap opacity-[0.02] pointer-events-none select-none z-0" style={{ willChange: 'transform' }}>
                <motion.h2
                    animate={{ x: [0, -1200] }}
                    transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
                    className="text-[12vw] font-black leading-none font-serif italic text-stone-900"
                >
                    TRENDIZIP TRENDIZIP TRENDIZIP
                </motion.h2>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

                {/* 2. REFINED HEADER GRID */}
                <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between mb-10 lg:mb-12 gap-6 lg:gap-10 pb-6 border-b border-stone-200/80">
                    <div className="max-w-2xl">
                        <motion.div
                            initial={{ opacity: 0, x: -15 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="flex items-center gap-2.5 mb-3"
                        >
                            <span className="h-[2px] w-8 bg-red-900" />
                            <span className="text-xs font-bold tracking-[0.25em] uppercase text-red-900">For Tailors &amp; Designers</span>
                        </motion.div>

                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black leading-[1.05] tracking-tight text-stone-900 uppercase">
                            SELL <span className="text-red-900 italic font-serif font-light">DIFFERENT.</span><br />
                            <span>OWN YOUR LINK.</span>
                        </h2>
                    </div>

                    <motion.div
                        style={{ y: y1 }}
                        className="max-w-sm lg:text-right"
                    >
                        <p className="text-stone-600 text-xs sm:text-sm font-sans leading-relaxed">
                            Fine-tuned commerce for the African fashion designer. Share your personal store link directly on WhatsApp, Instagram, and TikTok with zero hosting fees.
                        </p>
                    </motion.div>
                </div>

                {/* 3. CORE INTERACTIVE AREA */}
                <div className="grid lg:grid-cols-12 gap-8 lg:gap-10 items-center">

                    {/* Left Column: Compact Feature Bento */}
                    <div className="lg:col-span-4 order-2 lg:order-1 space-y-3.5">
                        <FeatureCard
                            icon={<Clock className="text-red-700" size={20} />}
                            title="60-Second Setup"
                            desc="Go from tailor to verified online boutique in minutes with ready templates."
                        />
                        <FeatureCard
                            icon={<Globe2 className="text-stone-700" size={20} />}
                            title="Global Presence"
                            desc="A mobile-first storefront that works seamlessly from Accra to London."
                        />
                        
                        <Link href="/register-as-professional" className="block group">
                            <motion.div
                                whileHover={{ y: -3 }}
                                className="p-5 sm:p-6 bg-red-900 rounded-2xl text-white cursor-pointer overflow-hidden relative shadow-lg shadow-red-900/15"
                            >
                                <motion.div
                                    whileHover={{ scale: 1.15, rotate: 10 }}
                                    className="absolute -right-4 -top-4 opacity-10"
                                >
                                    <ShoppingCart size={90} />
                                </motion.div>
                                <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/20 text-[10px] font-semibold tracking-wide uppercase mb-2">
                                    3-Month Free Trial
                                </span>
                                <h3 className="text-lg sm:text-xl font-bold mb-1.5 font-serif italic">Grow your brand.</h3>
                                <p className="text-red-100/90 mb-4 text-xs font-sans leading-relaxed">
                                    Join {(totalProfessionals).toLocaleString()}+ fashion professionals building their businesses on TrendiZip.
                                </p>
                                <div className="inline-flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px] text-amber-200 group-hover:gap-2.5 transition-all">
                                    <span>Start Free</span>
                                    <ArrowRight size={14} />
                                </div>
                            </motion.div>
                        </Link>
                    </div>

                    {/* Center Column: Perfectly Proportioned Phone Mockup */}
                    <div className="lg:col-span-4 order-1 lg:order-2 flex justify-center">
                        <motion.div
                            style={{ rotate }}
                            className="relative w-full max-w-[270px] sm:max-w-[290px] aspect-[9/17.5] bg-white rounded-[2.5rem] border-[7px] border-stone-900 shadow-[0_25px_50px_-12px_rgba(28,25,23,0.2)] overflow-hidden"
                        >
                            {/* Phone Notch / Island */}
                            <div className="absolute top-0 inset-x-0 h-6 flex justify-center items-start z-20">
                                <div className="w-20 h-4 bg-stone-900 rounded-b-xl" />
                            </div>

                            <div className="p-4 pt-8 space-y-3.5 h-full flex flex-col justify-between">
                                {/* Profile Header in Mockup */}
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-full border border-stone-200 overflow-hidden relative shrink-0">
                                        <Image src="/beccaProfile.jpg" alt="Tailor Profile" fill className="object-cover" />
                                    </div>
                                    <div className="space-y-1 text-left flex-1">
                                        <div className="w-20 h-2.5 bg-stone-900/15 rounded-full" />
                                        <div className="w-12 h-1.5 bg-stone-900/10 rounded-full" />
                                    </div>
                                </div>

                                {/* Mockup Product Showcase */}
                                <div className="flex-1 aspect-[4/4.5] bg-[#F8F7F3] rounded-xl border border-stone-100 flex items-center justify-center relative overflow-hidden group/img">
                                    <Image src="/woman.png" alt="Featured Work" fill className="object-cover transition-transform duration-700 group-hover/img:scale-105" />
                                    <div className="absolute top-2 right-2 bg-white/95 backdrop-blur-xs px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider text-stone-800 shadow-xs">
                                        In Stock
                                    </div>
                                </div>

                                {/* Mockup Details & Action */}
                                <div className="space-y-2">
                                    <div className="space-y-1">
                                        <div className="w-3/4 h-2.5 bg-stone-900/15 rounded-full" />
                                        <div className="w-1/2 h-2 bg-stone-900/10 rounded-full" />
                                    </div>
                                    <div className="w-full py-2.5 bg-red-900 rounded-xl text-white text-center font-bold uppercase tracking-wider text-[9px] shadow-sm">
                                        Order Custom Fit
                                    </div>
                                </div>
                            </div>

                            {/* Floating Verified Notification */}
                            <motion.div
                                initial={{ x: 40, opacity: 0 }}
                                whileInView={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.5 }}
                                viewport={{ once: true }}
                                className="absolute bottom-16 -right-1 bg-emerald-600 text-white px-2.5 py-1.5 rounded-xl shadow-lg flex items-center gap-1.5 border border-white text-[10px]"
                            >
                                <div className="bg-white/20 p-0.5 rounded-full">
                                    <Star size={10} fill="white" />
                                </div>
                                <span className="font-semibold tracking-tight">Order Fulfilled</span>
                            </motion.div>
                        </motion.div>
                    </div>

                    {/* Right Column: Narrative CTA */}
                    <div className="lg:col-span-4 order-3 space-y-6 text-left">
                        <div className="relative">
                            <motion.div style={{ y: y2 }} className="absolute -top-10 -right-2 text-red-900 opacity-[0.04]">
                                <Plus size={120} strokeWidth={3} />
                            </motion.div>
                            <h3 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight mb-2.5 uppercase leading-tight">
                                NO FEES.<br />NO LIMITS.
                            </h3>
                            <p className="text-stone-600 text-xs sm:text-sm font-sans mb-5 leading-relaxed">
                                Share your personal store link across all social channels. Manage orders, accept mobile money, and build your client base on your terms.
                            </p>
                            
                            <Link href="/register-as-professional">
                                <button className="w-full py-3 sm:py-3.5 bg-stone-900 hover:bg-black text-white rounded-xl font-bold uppercase tracking-wider text-xs transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md">
                                    <span>Claim Your Link Now</span>
                                    <ArrowRight size={14} />
                                </button>
                            </Link>
                        </div>

                        {/* Social Proof */}
                        <div className="flex gap-3.5 items-center pt-5 border-t border-stone-200">
                            <div className="flex -space-x-2.5">
                                {[
                                    { src: "/beccaProfile.jpg" },
                                    { src: "/woman.png" },
                                    { src: "/logo3d.jpg" },
                                    { src: "/beccaProfile.jpg" }
                                ].map((user, i) => (
                                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-stone-200 overflow-hidden relative shadow-xs">
                                        <Image src={user.src} alt="Tailor" fill className="object-cover" />
                                    </div>
                                ))}
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase text-stone-400 tracking-wider leading-none mb-0.5">
                                    Trusted by Designers
                                </p>
                                <p className="text-xs sm:text-sm font-bold text-stone-900 tracking-tight">
                                    {(totalProfessionals + totalUsers).toLocaleString()}+ Designers &amp; Clients
                                </p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* 4. COMPACT REFINED BOTTOM MARQUEE */}
            <div className="mt-12 sm:mt-14 border-y border-stone-200/80 py-3 bg-white overflow-hidden z-20 relative" style={{ willChange: 'transform' }}>
                <motion.div
                    animate={{ x: [0, -1000] }}
                    transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                    className="flex gap-12 whitespace-nowrap"
                >
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="flex items-center gap-6">
                            <span className="text-xs font-black text-stone-900 tracking-wider uppercase">TRENDIZIP</span>
                            <Smartphone className="text-red-900" size={14} />
                            <span className="text-xs font-bold text-stone-600 tracking-wide uppercase">Your Personal Store Link</span>
                            <div className="w-1.5 h-1.5 bg-red-900/30 rounded-full" />
                        </div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
};

const FeatureCard = ({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) => (
    <motion.div
        whileHover={{ x: 4, backgroundColor: '#FFFFFF' }}
        className="p-4 sm:p-4.5 bg-white/70 hover:bg-white rounded-2xl border border-stone-200/80 hover:border-stone-300 hover:shadow-sm transition-all duration-300 cursor-default"
    >
        <div className="mb-2.5 flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-stone-100 text-stone-800">
                {icon}
            </div>
            <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider">{title}</h4>
        </div>
        <p className="text-xs text-stone-600 font-sans leading-relaxed">{desc}</p>
    </motion.div>
);

export default ProfessionalCTA;