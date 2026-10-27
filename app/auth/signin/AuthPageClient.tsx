'use client'

import React, { useState, useEffect } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import { useSearchParams, useRouter } from 'next/navigation'

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

  const { status } = useSession()

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace(searchParams.get('callbackUrl') || '/')
    }
  }, [status, router, searchParams])

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
    router.push(`/auth/signin?mode=${newMode}`)
  }

  const handleGoogleSignIn = () => {
    setLoading(true)
    const callbackUrl = searchParams.get('callbackUrl') || '/'
    signIn('google', { callbackUrl })
  }

  return (
    <div className="h-screen w-full flex bg-[#0a0a0a] overflow-hidden">

      {/* --- Left Panel: Editorial Image (bg-img1.png with its own built-in typography) --- */}
      <div className="hidden lg:block lg:w-[54%] xl:w-[56%] h-full relative overflow-hidden bg-[#111]">
        <img
          src="/bg-img2.png"
          alt="TrendiZip - More Styles. More You."
          className="absolute inset-0 w-full h-full object-cover object-right"
        />
      </div>

      {/* --- Right Panel: Auth --- */}
      <div className="w-full lg:flex-1 h-full flex flex-col relative bg-[#FAFAF8]">

        {/* Subtle cross-stitch texture */}
        <div
          className="absolute inset-0 opacity-[0.018] pointer-events-none"
          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23000\' fill-opacity=\'1\'%3E%3Cpath d=\'M20 18v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4z\'/%3E%3C/g%3E%3C/svg%3E")' }}
        />

        {/* Mobile hero */}
        <div className="lg:hidden relative h-52 sm:h-64 overflow-hidden bg-stone-950">
          <img
            src="/bg-img1.png"
            alt="TrendiZip"
            className="absolute inset-0 w-full h-full object-cover object-right"
          />
        </div>

        {/* Form — vertically centered */}
        <div className="flex-1 flex flex-col justify-center px-8 sm:px-12 lg:px-14 xl:px-16 relative z-10">
          <motion.div
            key={mode}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-[360px] mx-auto"
          >
            {/* Heading */}
            <div className="mb-10">
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
                className="text-[10px] font-mono uppercase tracking-[0.3em] text-stone-400 mb-3"
              >
                {mode === 'signup' ? 'Get started' : 'Welcome back'}
              </motion.p>
              <h2 className="text-3xl lg:text-[2.5rem] font-serif text-stone-900 leading-[1.15]">
                {mode === 'signup' ? (
                  <>Create your<br /><span className="italic text-stone-400">account.</span></>
                ) : (
                  <>Sign in to<br /><span className="italic text-stone-400">TrendiZip.</span></>
                )}
              </h2>
            </div>

            {/* Google Sign-In */}
            <motion.button
              onClick={handleGoogleSignIn}
              disabled={loading}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.995 }}
              className="w-full flex items-center justify-center gap-3 bg-white border border-stone-200 hover:border-stone-900 rounded-xl px-6 py-[14px] transition-all duration-300 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-stone-300 border-t-stone-900 rounded-full animate-spin" />
              ) : (
                <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              )}
              <span className="text-sm font-medium text-stone-700 group-hover:text-stone-900 transition-colors">
                {loading ? 'Redirecting...' : mode === 'signup' ? 'Sign up with Google' : 'Continue with Google'}
              </span>
            </motion.button>

            {/* Features strip */}
            <div className="flex items-center justify-center gap-5 mt-6">
              {['Browse designers', 'Shop directly', 'Book fittings'].map((item, i) => (
                <motion.div
                  key={item}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 + i * 0.08 }}
                  className="flex items-center gap-1.5"
                >
                  <div className="w-1 h-1 rounded-full bg-stone-300" />
                  <span className="text-[10px] text-stone-400 whitespace-nowrap">{item}</span>
                </motion.div>
              ))}
            </div>

            {/* Terms */}
            <p className="text-center text-[10px] text-stone-400 mt-10 leading-relaxed">
              By continuing, you agree to our{' '}
              <a href="/terms" className="underline underline-offset-2 hover:text-stone-700 transition-colors">Terms</a>
              {' '}&{' '}
              <a href="/privacy" className="underline underline-offset-2 hover:text-stone-700 transition-colors">Privacy Policy</a>.
            </p>

            {/* Toggle Mode */}
            <div className="mt-6 pt-6 border-t border-stone-100 text-center">
              <p className="text-[13px] text-stone-500">
                {mode === 'signup' ? 'Already have an account?' : 'New to TrendiZip?'}
                {' '}
                <button
                  onClick={toggleMode}
                  className="text-stone-900 font-semibold hover:underline underline-offset-4 transition-all"
                >
                  {mode === 'signup' ? 'Sign in' : 'Create account'}
                </button>
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
