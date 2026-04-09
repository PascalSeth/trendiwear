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

    // Parallax values for a weighted, luxury feel
    const y1 = useTransform(scrollYProgress, [0, 1], [0, -100]);
    const y2 = useTransform(scrollYProgress, [0, 1], [0, 100]);
    const rotate = useTransform(scrollYProgress, [0, 1], [2, -2]);

    return (
        <section
            ref={containerRef}
            className="relative min-h-screen bg-[#F8F7F3] py-20 lg:py-24 overflow-hidden font-sans selection:bg-red-900 selection:text-white"
        >
            {/* 1. KINETIC BACKGROUND TEXT (Hardware Accelerated) */}
            <div className="absolute top-20 left-0 w-full whitespace-nowrap opacity-[0.03] pointer-events-none select-none z-0" style={{ willChange: 'transform' }}>
                <motion.h2
                    animate={{ x: [0, -2000] }}
                    transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                    className="text-[18vw] font-black leading-none font-serif italic"
                >
                    TRENDIZIP TRENDIZIP TRENDIZIP
                </motion.h2>
            </div>

            <div className="max-w-[1300px] mx-auto px-6 md:px-12 relative z-10">

                {/* 2. ASYMMETRICAL HEADER GRID */}
                <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between mb-16 gap-12">
                    <div className="max-w-5xl">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="flex items-center gap-3 mb-8"
                        >
                            <span className="h-[2px] w-16 bg-red-900" />
                            <span className="text-sm font-bold tracking-[0.4em] uppercase text-red-900">Vanguard Edition</span>
                        </motion.div>

                        <h1 className="text-[clamp(2.5rem,8vw,6.5rem)] font-black leading-[0.85] tracking-tighter text-stone-900">
                            SELL <span className="text-red-900 italic font-serif font-light">DIFFERENT.</span><br />
                            <span className="lg:ml-[0.6em]">OWN YOUR LINK.</span>
                        </h1>
                    </div>

                    <motion.div
                        style={{ y: y1 }}
                        className="hidden lg:block w-72 text-right pb-12"
                    >
                        <p className="text-stone-500 font-serif italic text-lg leading-relaxed">
                            Fine-tuned commerce for the African artisan. No code, no monthly hosting fees—just pure, high-performance sales.
                        </p>
                    </motion.div>
                </div>

                {/* 3. CORE INTERACTIVE AREA */}
                <div className="grid lg:grid-cols-12 gap-12 lg:gap-20 items-start">

                    {/* Left Column: Feature Bento */}
                    <div className="lg:col-span-4 order-2 lg:order-1 space-y-6">
                        <FeatureCard
                            icon={<Clock className="text-red-600" size={28} />}
                            title="60-Second Setup"
                            desc="Go from artisan to global boutique in the time it takes to brew coffee."
                        />
                        <FeatureCard
                            icon={<Globe2 className="text-blue-600" size={28} />}
                            title="Global Presence"
                            desc="A professional storefront that shines on any device, from Accra to London."
                        />
                        
                        <Link href="/register-as-professional" className="block group">
                            <motion.div
                                whileHover={{ y: -5 }}
                                className="p-8 bg-red-900 rounded-[2.5rem] text-white cursor-pointer overflow-hidden relative shadow-2xl shadow-red-900/10"
                            >
                                <motion.div
                                    whileHover={{ scale: 1.2, rotate: 15 }}
                                    className="absolute -right-6 -top-6 opacity-10"
                                >
                                    <ShoppingCart size={140} />
                                </motion.div>
                                <h3 className="text-2xl font-bold mb-3 font-serif italic">Grow your name.</h3>
                                <p className="text-red-100/90 mb-6 text-base font-medium">Join {(totalProfessionals).toLocaleString()}+ professionals building their digital homes with a <span className="text-white font-black underline underline-offset-4 decoration-2">3-Month Free Trial</span>.</p>
                                <div className="flex items-center gap-2 font-black uppercase tracking-widest text-xs group-hover:gap-5 transition-all">
                                    Start For Free <ArrowRight size={18} className="text-red-300" />
                                </div>
                            </motion.div>
                        </Link>
                    </div>

                    {/* Center Column: The Device Mockup (Fixed Images) */}
                    <div className="lg:col-span-5 order-1 lg:order-2">
                        <motion.div
                            style={{ rotate }}
                            className="relative mx-auto w-full max-w-[380px] aspect-[9/18.5] bg-white rounded-[3rem] border-[10px] border-stone-900 shadow-[0_40px_80px_-20px_rgba(28,25,23,0.3)] overflow-hidden"
                        >
                            {/* Phone Internal UI */}
                            <div className="absolute top-0 w-full h-10 flex justify-center items-center z-20">
                                <div className="w-24 h-5 bg-stone-900 rounded-b-3xl" />
                            </div>

                            <div className="p-6 pt-12 space-y-6 h-full flex flex-col">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full border-2 border-stone-100 overflow-hidden relative">
                                        <Image src="/beccaProfile.jpg" alt="Tailor Profile" fill className="object-cover" />
                                    </div>
                                    <div className="space-y-1.5 text-left">
                                        <div className="w-24 h-3 bg-stone-900/10 rounded-full" />
                                        <div className="w-16 h-1.5 bg-stone-900/5 rounded-full" />
                                    </div>
                                </div>
                                <div className="flex-1 aspect-square bg-[#F8F7F3] rounded-[1.5rem] border border-stone-100 flex items-center justify-center relative overflow-hidden group/img">
                                    <Image src="/woman.png" alt="Featured Work" fill className="object-cover transition-transform duration-1000 group-hover/img:scale-110" />
                                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest shadow-sm">
                                        New Collection
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="w-full h-4 bg-stone-900/10 rounded-full" />
                                    <div className="w-4/5 h-2 bg-stone-900/5 rounded-full" />
                                </div>
                                <div className="w-full py-4 bg-red-900 rounded-xl text-white text-center font-black uppercase tracking-[0.2em] text-[10px] shadow-lg shadow-red-900/10">
                                    Add to Collection
                                </div>
                            </div>

                            {/* Floating High-Conversion Badge */}
                            <motion.div
                                initial={{ x: 60, opacity: 0 }}
                                whileInView={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.8 }}
                                viewport={{ once: true }}
                                className="absolute bottom-20 -right-2 bg-emerald-500 text-white p-4 rounded-2xl shadow-2xl flex items-center gap-3 border-2 border-white"
                            >
                                <div className="bg-white/20 p-1 rounded-full"><Star size={14} fill="white" /></div>
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-black tracking-widest uppercase opacity-80">Success</span>
                                    <span className="text-xs font-bold tracking-tight">Order Fulfilled</span>
                                </div>
                            </motion.div>
                        </motion.div>
                    </div>

                    {/* Right Column: Narrative CTA */}
                    <div className="lg:col-span-3 order-3 space-y-12 lg:pt-24 text-left">
                        <div className="relative">
                            <motion.div style={{ y: y2 }} className="absolute -top-20 lg:-top-28 -right-4 lg:-right-12 text-red-900 opacity-[0.04]">
                                <Plus size={180} strokeWidth={4} />
                            </motion.div>
                            <h4 className="text-3xl lg:text-4xl font-black text-stone-900 tracking-tighter mb-5 leading-none">
                                NO FEES.<br />NO LIMITS.
                            </h4>
                            <p className="text-stone-500 font-serif italic text-lg mb-8 leading-relaxed">
                                Share your personal store link on WhatsApp, Instagram, and TikTok. Your brand, your rules.
                            </p>
                            
                            <Link href="/register-as-professional">
                                <button className="w-full py-5 bg-white border-[3px] border-stone-900 text-stone-900 rounded-full font-black uppercase tracking-[0.2em] hover:bg-stone-900 hover:text-white transition-all duration-700 text-[10px] shadow-[8px_8px_0px_0px_rgba(28,25,23,1)] active:shadow-none active:translate-x-1 active:translate-y-1">
                                    Claim Your Link Now
                                </button>
                            </Link>
                        </div>

                        <div className="flex gap-4 items-center pt-8 border-t border-stone-200">
                            <div className="flex -space-x-4">
                                {[
                                    { src: "/beccaProfile.jpg" },
                                    { src: "/woman.png" },
                                    { src: "/logo3d.jpg" },
                                    { src: "/beccaProfile.jpg" }
                                ].map((user, i) => (
                                    <div key={i} className="w-12 h-12 rounded-full border-4 border-[#F8F7F3] bg-stone-200 overflow-hidden relative shadow-sm">
                                        <Image src={user.src} alt="Tailor" fill className="object-cover" />
                                    </div>
                                ))}
                            </div>
                            <div>
                                <p className="text-[11px] font-black uppercase text-stone-400 tracking-widest leading-none mb-1">
                                    Trusted Globally
                                </p>
                                <p className="text-base font-bold text-stone-900 tracking-tight">
                                    {(totalProfessionals + totalUsers).toLocaleString()}+ Designers & Users
                                </p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* 4. PERFORMANCE BOTTOM MARQUEE (Hardware Accelerated) */}
            <div className="mt-24 border-y-2 border-stone-200/60 py-6 bg-white overflow-hidden rotate-[-1deg] z-20 relative" style={{ willChange: 'transform' }}>
                <motion.div
                    animate={{ x: [0, -1500] }}
                    transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
                    className="flex gap-20 whitespace-nowrap"
                >
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="flex items-center gap-8">
                            <span className="text-xl font-black text-stone-900 italic font-serif">TRENDIZIP</span>
                            <Smartphone className="text-red-900" size={20} />
                            <span className="text-xl font-black text-stone-900 uppercase tracking-tighter">Bio Link Store</span>
                            <div className="w-3 h-3 bg-red-900/10 rounded-full" />
                        </div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
};

const FeatureCard = ({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) => (
    <motion.div
        whileHover={{ x: 8, backgroundColor: '#FFFFFF' }}
        className="p-8 bg-transparent rounded-[2.5rem] border border-stone-200/40 hover:border-red-100 hover:shadow-xl hover:shadow-red-900/5 transition-all duration-500 cursor-default"
    >
        <div className="mb-5 scale-100 origin-left">{icon}</div>
        <h3 className="text-xl font-bold text-stone-900 mb-2 tracking-tight leading-tight uppercase text-xs tracking-[0.1em]">{title}</h3>
        <p className="text-sm text-stone-500 font-serif italic leading-relaxed">{desc}</p>
    </motion.div>
);

export default ProfessionalCTA;