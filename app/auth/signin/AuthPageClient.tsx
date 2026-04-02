'use client'

import React, { useState, useEffect } from 'react'
import { signIn } from 'next-auth/react'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import Image from 'next/image'
import { ShieldCheck, Zap } from 'lucide-react'
import { useSearchParams, useRouter } from 'next/navigation'

/**
 * AnimatedCounter component for the real-time stats
 */
function AnimatedCounter({ value, label }: { value: number; label: string }) {
  const count = useMotionValue(0)
  const rounded = useTransform(count, (latest) => Math.round(latest))

  useEffect(() => {
    // Animate from 0 to target value
    const animation = animate(count, value, { 
      duration: 2.5, 
      ease: [0.16, 1, 0.3, 1], // Premium slow-out ease
      delay: 0.8 // Start after the main hero animations
    })
    return animation.stop
  }, [count, value])

  return (
    <div className="flex flex-col">
      <div className="flex items-baseline gap-1">
        <motion.span className="text-white text-4xl font-serif tracking-tight">
          {rounded}
        </motion.span>
        <span className="text-stone-500 text-2xl font-light">+</span>
      </div>
      <p className="text-stone-500 text-[10px] font-mono uppercase tracking-[0.2em] mt-3 whitespace-nowrap">
        {label}
      </p>
    </div>
  )
}

export default function AuthPageClient({ 
  productCount, 
  proCount 
}: { 
  productCount: number; 
  proCount: number 
}) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')

  useEffect(() => {
    const m = searchParams.get('mode')
    if (m === 'signup') {
      setMode('signup')
    } else {
      setMode('signin')
    }
  }, [searchParams])

  const toggleMode = () => {
    const newMode = mode === 'signin' ? 'signup' : 'signin'
    setMode(newMode)
    // Update URL to reflect the new mode
    router.push(`/auth/signin?mode=${newMode}`)
  }

  const handleGoogleSignIn = () => {
    setLoading(true)
    signIn('google', { callbackUrl: '/' })
  }

  return (
    <div className="h-screen w-full flex flex-col lg:flex-row bg-[#0a0a0a] overflow-hidden">
      
      {/* --- Left Panel: Cinematic Image (60%) --- */}
      <div className="hidden lg:flex lg:w-[60%] h-full relative overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format&fit=crop"
          alt="Fashion"
          fill
          className="object-cover scale-105"
          priority
        />
        
        {/* Gradient overlays for depth */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
        
        {/* Floating content */}
        <div className="absolute inset-0 flex flex-col justify-between p-16 pt-28 z-10">
          {/* Spacer for navbar */}
          <div />

          {/* Hero Text */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="max-w-lg"
          >
            <h1 className="text-[5.5rem] font-serif leading-[0.9] text-white mb-8">
              Your
              <br />
              <span className="italic font-light text-stone-300">Style,</span>
              <br />
              Elevated.
            </h1>
            <p className="text-stone-400 text-lg font-light leading-relaxed max-w-sm">
              Discover curated fashion from Ghana&apos;s most talented designers, tailors, and stylists.
            </p>
          </motion.div>

          {/* Bottom Stats (Animated & Real-time) */}
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            transition={{ delay: 0.8 }}
            className="flex items-center gap-20"
          >
            <AnimatedCounter value={productCount} label="Curated Products" />
            <AnimatedCounter value={proCount} label="Expert Professionals" />
          </motion.div>
        </div>
      </div>

      {/* --- Right Panel: Auth (40%) --- */}
      <div className="w-full lg:w-[40%] h-full flex flex-col relative">
        
        {/* Background texture */}
        <div className="absolute inset-0 bg-[#fafaf9]" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #000 1px, transparent 0)', backgroundSize: '24px 24px' }} />

        {/* Mobile hero (visible only on mobile) */}
        <div className="lg:hidden relative h-48 overflow-hidden">
          <Image
            src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format&fit=crop"
            alt="Fashion"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-[#fafaf9]" />
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col justify-center px-8 sm:px-12 lg:px-16 relative z-10">
          <motion.div 
            key={mode}
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.6, delay: 0.1 }}
            className="w-full max-w-sm mx-auto"
          >
            {/* Greeting */}
            <div className="mb-12">
              <p className="text-[10px] font-mono uppercase tracking-[0.4em] text-stone-400 mb-4">
                {mode === 'signup' ? 'Join TrendiZip' : 'Welcome back'}
              </p>
              <h2 className="text-4xl lg:text-5xl font-serif text-stone-900 leading-[1.1]">
                {mode === 'signup' ? 'Create an' : 'Sign in to'}
                <br />
                <span className="italic text-stone-400">{mode === 'signup' ? 'account.' : 'continue.'}</span>
              </h2>
            </div>

            {/* Google Sign-In Button */}
            <motion.button
              onClick={handleGoogleSignIn}
              disabled={loading}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="w-full flex items-center justify-center gap-4 bg-white border-2 border-stone-200 hover:border-stone-900 rounded-2xl px-8 py-5 transition-all duration-300 shadow-sm hover:shadow-xl group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-stone-300 border-t-stone-900 rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              <span className="text-sm font-semibold text-stone-700 group-hover:text-stone-900 transition-colors">
                {loading ? 'Redirecting...' : mode === 'signup' ? 'Sign up with Google' : 'Continue with Google'}
              </span>
            </motion.button>

            {/* Trust Signals */}
            <div className="mt-12 space-y-4">
              {[
                { icon: <ShieldCheck className="w-4 h-4" />, text: 'Secure authentication by Google' },
                { icon: <Zap className="w-4 h-4" />, text: 'One click access, no password needed' },
              ].map((item, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div className="text-stone-400">{item.icon}</div>
                  <span className="text-xs text-stone-400 font-light">{item.text}</span>
                </motion.div>
              ))}
            </div>

            {/* Terms */}
            <p className="text-center text-[10px] text-stone-400 mt-12 leading-relaxed">
              By continuing, you agree to our{' '}
              <a href="#" className="underline underline-offset-2 hover:text-stone-900 transition-colors">Terms of Service</a>
              {' '}and{' '}
              <a href="#" className="underline underline-offset-2 hover:text-stone-900 transition-colors">Privacy Policy</a>.
            </p>

            {/* Toggle Mode */}
            <div className="mt-8 pt-8 border-t border-stone-100 text-center">
              <p className="text-sm text-stone-600">
                {mode === 'signup' ? 'Already have an account?' : 'New to TrendiZip?'}
                {' '}
                <button 
                  onClick={toggleMode}
                  className="text-stone-900 font-semibold hover:underline underline-offset-4 ml-1 transition-all"
                >
                  {mode === 'signup' ? 'Sign in' : 'Create an account'}
                </button>
              </p>
            </div>
          </motion.div>
        </div>

        {/* Bottom accent line */}
        <div className="h-1 bg-gradient-to-r from-amber-400 via-rose-400 to-violet-500 relative z-10" />
      </div>
    </div>
  )
}
