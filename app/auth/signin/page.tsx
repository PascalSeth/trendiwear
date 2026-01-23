'use client'

import React, { useState, useEffect } from 'react'
import { getProviders, signIn } from 'next-auth/react'
import { Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

type Provider = {
  id: string
  name: string
  type: string
  signinUrl: string
  callbackUrl: string
}

// Animation Variants
const slideDown = {
  hidden: { height: 0, opacity: 0, marginBottom: 0 },
  visible: { height: 'auto', opacity: 1, marginBottom: '2rem' },
  exit: { height: 0, opacity: 0, marginBottom: 0 }
}

function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [providers, setProviders] = useState<Record<string, Provider> | null>(null)
  const [isLoadingProviders, setIsLoadingProviders] = useState(true)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: ''
  })

  useEffect(() => {
    const getProvidersData = async () => {
      try {
        const res = await getProviders()
        console.log('Loaded providers:', res)
        setProviders(res)
      } catch (error) {
        console.error("Failed to load providers", error)
      } finally {
        setIsLoadingProviders(false)
      }
    }
    getProvidersData()
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.email) newErrors.email = 'Email is required'
    if (!isLogin && !formData.name) newErrors.name = 'Name is required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleEmailAuth = async () => {
    if (!validateForm()) return

    setLoading(true)
    try {
      const result = await signIn('email', {
        email: formData.email,
        redirect: false,
        callbackUrl: '/dashboard',
      })

      if (result?.ok) {
        window.location.href = '/auth/verify-request'
      }
    } catch (error) {
      console.error('Auth error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleProviderAuth = (providerId: string) => {
    console.log('Attempting to sign in with provider:', providerId)
    signIn(providerId, { callbackUrl: '/' })
  }

  // Helper to render social icons
  const renderProviderIcon = (id: string) => {
    if (id === 'google') {
      return <svg className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
    }
    return null
  }

  return (
    <div className="h-screen w-full flex flex-col lg:flex-row bg-white overflow-hidden">
      
      {/* --- Left Panel: Full Height Image (60% width) --- */}
      <div className="hidden lg:flex lg:w-[60%] h-full relative bg-neutral-900">
        <div className="absolute inset-0 w-full h-full">
          <img 
            src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format&fit=crop" 
            alt="Fashion Background" 
            className="w-full h-full object-cover opacity-90"
          />
        </div>

        {/* Overlay Content */}
        <div className="absolute inset-0 flex flex-col justify-between p-12 z-10 text-white pointer-events-none">
          <div className="text-2xl font-serif font-bold tracking-[0.2em] uppercase">
            Trendizip
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="max-w-xl"
          >
            <h2 className="text-7xl font-serif font-bold leading-[1] mb-8">
              Define <br/> <span className="italic font-light text-gray-300">Style.</span>
            </h2>
            <p className="text-lg text-gray-200 font-light max-w-sm border-l-2 border-white/30 pl-6">
              Join the exclusive club. Access the latest collections before anyone else.
            </p>
          </motion.div>

          <div className="flex items-center gap-4 text-xs tracking-widest uppercase text-gray-400">
            <span>Est. 2024</span>
            <span className="w-8 h-px bg-gray-600"></span>
            <span>New York</span>
          </div>
        </div>
      </div>

      {/* --- Right Panel: Form (40% width, Full Height) --- */}
      <div className="w-full lg:w-[40%] h-full flex flex-col bg-white z-20">
        {/* Removed 'justify-center' and added 'py-12 lg:py-20' for natural top-down flow */}
        <div className="flex-1 overflow-y-auto px-6 sm:px-12 lg:px-20 py-12 lg:py-20">
          
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-md mx-auto"
          >
            {/* Toggle Switch - Redesigned */}
            <div className="flex items-center justify-center mb-12">
              <div className="relative bg-gray-100 p-1 rounded-full flex">
                <div 
                  className={`absolute top-1 bottom-1 w-1/2 bg-black rounded-full transition-all duration-300 ease-out shadow-md ${!isLogin ? 'translate-x-full' : 'translate-x-0'}`}
                ></div>
                <button
                  onClick={() => setIsLogin(true)}
                  className={`relative z-10 px-8 py-2.5 text-xs font-bold uppercase tracking-widest transition-colors duration-300 ${isLogin ? 'text-white' : 'text-gray-500 hover:text-black'}`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => setIsLogin(false)}
                  className={`relative z-10 px-8 py-2.5 text-xs font-bold uppercase tracking-widest transition-colors duration-300 ${!isLogin ? 'text-white' : 'text-gray-500 hover:text-black'}`}
                >
                  Join
                </button>
              </div>
            </div>

            <div className="mb-10 text-center">
              <h1 className="text-4xl font-serif font-bold mb-3 text-gray-900">
                {isLogin ? 'Welcome' : 'Create Account'}
              </h1>
              <p className="text-sm text-gray-500 font-light tracking-wide">
                {isLogin ? 'Please enter your details to sign in.' : 'Enter your information to get started.'}
              </p>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleEmailAuth(); }}>
              
              {/* Name Field - Floating Label */}
              <AnimatePresence mode="wait">
                {!isLogin && (
                  <motion.div variants={slideDown} initial="hidden" animate="visible" exit="exit">
                    <div className="relative group z-0 w-full mb-8">
                      <input
                        name="name"
                        type="text"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="block py-2.5 px-0 w-full text-lg text-gray-900 bg-transparent border-0 border-b-2 border-gray-200 appearance-none focus:outline-none focus:ring-0 focus:border-black peer transition-colors duration-300 placeholder-transparent"
                        placeholder="Jane Doe"
                        id="name_field"
                      />
                      <label 
                        htmlFor="name_field"
                        className={`peer-focus:font-medium absolute text-xs text-gray-500 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6 uppercase tracking-[0.15em] ${formData.name ? '-translate-y-6 scale-75' : ''}`}
                      >
                        Full Name
                      </label>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Email Field - Floating Label */}
              <div className="relative group z-0 w-full mb-8">
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="block py-2.5 px-0 w-full text-lg text-gray-900 bg-transparent border-0 border-b-2 border-gray-200 appearance-none focus:outline-none focus:ring-0 focus:border-black peer transition-colors duration-300 placeholder-transparent"
                  placeholder="you@example.com"
                  id="email_field"
                />
                <label 
                  htmlFor="email_field"
                  className={`peer-focus:font-medium absolute text-xs text-gray-500 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6 uppercase tracking-[0.15em] ${formData.email ? '-translate-y-6 scale-75' : ''}`}
                >
                  Email Address
                </label>
                {errors.email && <p className="text-[10px] text-red-500 mt-1 uppercase tracking-wider">{errors.email}</p>}
              </div>

              {/* Password Field - Floating Label */}
              {isLogin && (
                <div className="relative group z-0 w-full mb-8">
                  <input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleInputChange}
                    className="block py-2.5 px-0 w-full text-lg text-gray-900 bg-transparent border-0 border-b-2 border-gray-200 appearance-none focus:outline-none focus:ring-0 focus:border-black peer transition-colors duration-300 placeholder-transparent"
                    placeholder="••••••••"
                    id="password_field"
                  />
                  <label 
                    htmlFor="password_field"
                    className={`peer-focus:font-medium absolute text-xs text-gray-500 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6 uppercase tracking-[0.15em] ${formData.password ? '-translate-y-6 scale-75' : ''}`}
                  >
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-0 top-2 text-gray-400 hover:text-black transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-black text-white text-sm font-bold uppercase tracking-[0.2em] py-4 mt-6 flex items-center justify-center gap-2 hover:bg-gray-800 active:scale-[0.99] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group/btn"
              >
                {loading ? <Loader2 className="animate-spin w-4 h-4" /> : (isLogin ? 'Sign In' : 'Create Account')}
                {!loading && <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover/btn:translate-x-1" />}
              </button>
            </form>

            {/* Social Divider */}
            <div className="relative my-10 flex items-center justify-center">
              <span className="bg-white px-3 text-[10px] text-gray-400 uppercase tracking-widest font-medium">Or continue with</span>
              <div className="absolute w-full h-px bg-gray-100 -z-10"></div>
            </div>

            {/* Social Buttons */}
            <div className="flex justify-center">
              {isLoadingProviders ? (
                <>
                  <div className="h-12 bg-gray-50 animate-pulse rounded"></div>
                  <div className="h-12 bg-gray-50 animate-pulse rounded"></div>
                </>
              ) : (
                providers && Object.values(providers).map((provider) => {
                  if (provider.id === 'email') return null

                  return (
                    <button
                      key={provider.id}
                      onClick={() => handleProviderAuth(provider.id)}
                      className="flex items-center justify-center gap-3 py-3.5 border border-gray-200 rounded-sm hover:border-black hover:bg-white transition-all duration-300 group shadow-sm hover:shadow-md"
                    >
                      {renderProviderIcon(provider.id)}
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-600 group-hover:text-black transition-colors">{provider.name}</span>
                    </button>
                  )
                })
              )}
              
              {/* Fallback */}
              {!isLoadingProviders && (!providers || Object.keys(providers).filter(k => k !== 'email').length === 0) && (
                 <button className="flex items-center justify-center gap-3 py-3.5 border border-gray-200 rounded-sm hover:border-black hover:bg-white transition-all duration-300 group shadow-sm hover:shadow-md">
                    {renderProviderIcon('google')}
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-600 group-hover:text-black transition-colors">Google</span>
                 </button>
              )}
            </div>
            
            <p className="text-center text-[10px] text-gray-400 mt-8 tracking-wide leading-relaxed">
              By continuing, you agree to our <a href="#" className="underline hover:text-black transition-colors">Terms of Service</a> and <a href="#" className="underline hover:text-black transition-colors">Privacy Policy</a>.
            </p>

          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default AuthPage