'use client'

import React, { useEffect, useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ShieldCheck, 
  FileText, 
  UserCheck, 
  AlertCircle, 
  Loader2, 
  CheckCircle2, 
  XCircle,
  Clock,
  Upload,
  Camera,
  Eye,
  Trash2,
  FileUp,
  Fingerprint
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import Image from 'next/image'
import LiveSelfieCapture from './LiveSelfieCapture'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'


interface VerificationDoc {
  id: string
  documentType: 'NATIONAL_ID_FRONT' | 'NATIONAL_ID_BACK' | 'SELFIE' | 'BUSINESS_REGISTRATION'
  documentUrl: string
  isVerified: boolean
  verificationMessage?: string
  uploadedAt: string
}

interface FileState {
  file: File | null
  url: string | null
  uploading: boolean
  uploaded: boolean
}

export default function VerificationCenter() {
  const [status, setStatus] = useState<{ isVerified: boolean; documents: VerificationDoc[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showCamera, setShowCamera] = useState(false)


  // Document states
  const [docs, setDocs] = useState<Record<string, FileState>>({
    NATIONAL_ID_FRONT: { file: null, url: null, uploading: false, uploaded: false },
    NATIONAL_ID_BACK: { file: null, url: null, uploading: false, uploaded: false },
    SELFIE: { file: null, url: null, uploading: false, uploaded: false },
    BUSINESS_REGISTRATION: { file: null, url: null, uploading: false, uploaded: false }
  })

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/professional-profiles/verification')
      if (res.ok) {
        const data = await res.json()
        setStatus(data)
        
        // Map existing documents to state
        setDocs(prevDocs => {
          const updatedDocs = { ...prevDocs }
          data.documents.forEach((doc: VerificationDoc) => {
            if (updatedDocs[doc.documentType]) {
              updatedDocs[doc.documentType] = {
                ...updatedDocs[doc.documentType],
                url: doc.documentUrl,
                uploaded: true
              }
            }
          })
          return updatedDocs
        })
      }
    } catch (err) {
      console.error('Failed to fetch verification status:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStatus()
  }, [fetchStatus])

  const handleFileChange = (type: string, file: File | null) => {
    // Revoke old blob URL if it exists to prevent memory leaks
    if (docs[type].file && docs[type].url?.startsWith('blob:')) {
      URL.revokeObjectURL(docs[type].url!)
    }

    if (!file) {
      setDocs(prev => ({
        ...prev,
        [type]: { file: null, url: null, uploading: false, uploaded: false }
      }))
      return
    }

    // Instant local preview
    const objectUrl = URL.createObjectURL(file)
    setDocs(prev => ({
      ...prev,
      [type]: { 
        file, 
        url: objectUrl, 
        uploading: false, 
        uploaded: true 
      }
    }))
  }

  const uploadFile = async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('bucket', 'documents')
    formData.append('folder', 'verification')

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    })

    if (!res.ok) throw new Error('Upload failed')
    const data = await res.json()
    return data.url
  }

  const handleSubmit = async () => {
    const requiredTypes = ['NATIONAL_ID_FRONT', 'NATIONAL_ID_BACK', 'SELFIE', 'BUSINESS_REGISTRATION']
    const missing = requiredTypes.filter(t => !docs[t].uploaded)

    if (missing.length > 0) {
      toast.error(`Please complete all steps (${missing.length} remaining)`)
      return
    }

    setIsSubmitting(true)
    const finalizedUrls: Record<string, string> = {}

    try {
      // 1. Upload new files if necessary
      for (const type of requiredTypes) {
        const doc = docs[type]
        if (doc.file) {
          // It's a new local file, upload it
          toast.info(`Uploading ${type.replace(/_/g, ' ')}...`)
          finalizedUrls[type] = await uploadFile(doc.file)
        } else if (doc.url) {
          // Already have a remote URL from initial fetch
          finalizedUrls[type] = doc.url
        }
      }

      // 2. Submit to verification API
      const res = await fetch('/api/professional-profiles/verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nationalIdFrontUrl: finalizedUrls.NATIONAL_ID_FRONT,
          nationalIdBackUrl: finalizedUrls.NATIONAL_ID_BACK,
          selfieUrl: finalizedUrls.SELFIE,
          businessProofUrl: finalizedUrls.BUSINESS_REGISTRATION
        })
      })

      if (res.ok) {
        toast.success('Verification submitted successfully')
        fetchStatus()
      } else {
        const err = await res.json()
        toast.error(err.error || 'Submission failed')
      }
    } catch (error) {
      console.error('Submission error:', error)
      toast.error('Failed to process documents. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }


  const isVerified = status?.isVerified
  const isPending = status?.documents.length === 4 && !isVerified && !status.documents.some(d => d.verificationMessage)
  const isRejected = status?.documents.some(d => d.verificationMessage)

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-violet-500 opacity-20" />
        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Checking your status...</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Premium Status Header */}
      <section className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 p-8 text-white shadow-2xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-violet-500/20 rounded-full blur-[80px]"></div>
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-indigo-500/20 rounded-full blur-[80px]"></div>
        
        <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6 text-center md:text-left">
            <div className={`p-5 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 shadow-xl ${isVerified ? 'text-emerald-400' : 'text-amber-400'}`}>
              <ShieldCheck size={40} className={isVerified ? 'animate-pulse' : ''} />
            </div>
            <div>
              <h2 className="text-3xl font-black tracking-tighter uppercase italic">
                Verify your <span className="text-violet-400">Identity</span>
              </h2>
              <p className="text-slate-400 text-sm font-medium tracking-wide">Get Verified</p>
            </div>
          </div>
          
          <div className="flex flex-col items-center md:items-end gap-2">
            {isVerified ? (
              <Badge className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border-emerald-500/30 px-6 py-2 rounded-2xl uppercase text-[10px] font-black tracking-[0.2em]">
                <CheckCircle2 className="w-3.5 h-3.5 mr-2" /> Verified Profile
              </Badge>
            ) : isPending ? (
              <Badge className="bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border-amber-500/30 px-6 py-2 rounded-2xl uppercase text-[10px] font-black tracking-[0.2em]">
                <Clock className="w-3.5 h-3.5 mr-2" /> Pending Review
              </Badge>
            ) : isRejected ? (
              <Badge className="bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 border-rose-500/30 px-6 py-2 rounded-2xl uppercase text-[10px] font-black tracking-[0.2em]">
                <XCircle className="w-3.5 h-3.5 mr-2" /> Resubmit Required
              </Badge>
            ) : (
              <Badge className="bg-white/10 text-white/60 border-white/10 px-6 py-2 rounded-2xl uppercase text-[10px] font-black tracking-[0.2em]">
                Not Verified
              </Badge>
            )}
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest italic">Your data is safe</p>
          </div>
        </div>
      </section>

      {/* Upload Documents */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Step 1: National ID Front */}
        <UploadCard 
          title="ID Front" 
          description="Take a clear photo of the front"
          type="NATIONAL_ID_FRONT"
          state={docs.NATIONAL_ID_FRONT}
          onFileChange={handleFileChange}
          disabled={isVerified || isPending}
          icon={<UserCheck className="w-5 h-5" />}
        />

        {/* Step 2: National ID Back */}
        <UploadCard 
          title="ID Back" 
          description="Take a clear photo of the back"
          type="NATIONAL_ID_BACK"
          state={docs.NATIONAL_ID_BACK}
          onFileChange={handleFileChange}
          disabled={isVerified || isPending}
          icon={<Fingerprint className="w-5 h-5" />}
        />

        {/* Step 3: Selfie Verification */}
        <UploadCard 
          title="Selfie" 
          description="Take a live photo of your face"
          type="SELFIE"
          state={docs.SELFIE}
          onFileChange={handleFileChange}
          onCameraClick={() => setShowCamera(true)}
          disabled={isVerified || isPending}
          icon={<Camera className="w-5 h-5" />}
          forceCamera
        />

        {/* Step 4: Business Proof */}

        <UploadCard 
          title="Business Proof" 
          description="Upload your permit or license"
          type="BUSINESS_REGISTRATION"
          state={docs.BUSINESS_REGISTRATION}
          onFileChange={handleFileChange}
          disabled={isVerified || isPending}
          icon={<FileText className="w-5 h-5" />}
        />
      </div>

      {/* Rejection Feedback */}
      <AnimatePresence>
        {isRejected && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-6 bg-rose-50 border border-rose-100 rounded-[2rem] flex items-start gap-4"
          >
            <div className="p-3 bg-rose-500 text-white rounded-2xl shadow-lg shadow-rose-200">
              <AlertCircle size={24} />
            </div>
            <div>
              <h4 className="text-sm font-black text-rose-900 uppercase tracking-widest">Please fix these</h4>
              <ul className="mt-2 space-y-1">
                {status?.documents.filter(d => d.verificationMessage).map(doc => (
                  <li key={doc.id} className="text-xs text-rose-600 font-medium italic">
                    • {doc.documentType.replace(/_/g, ' ')}: {doc.verificationMessage}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Submission Control */}
      {(!isVerified && !isPending) && (
        <div className="pt-4 flex justify-center">
          <Button 
            onClick={handleSubmit}
            disabled={isSubmitting || Object.values(docs).some(d => !d.uploaded)}
            className="h-16 px-12 rounded-[2rem] bg-slate-900 hover:bg-violet-600 text-white shadow-2xl shadow-slate-200 hover:shadow-violet-200/50 transition-all duration-500 group"
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin mr-3" />
            ) : (
              <FileUp className="w-5 h-5 mr-3 group-hover:-translate-y-1 transition-transform" />
            )}
            <span className="uppercase text-[11px] font-black tracking-[0.3em]">Submit for Review</span>
          </Button>
        </div>
      )}

      <footer className="flex flex-col items-center gap-4 text-center">
        <div className="h-px w-32 bg-slate-200"></div>
        <p className="max-w-md text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
          We use secure systems to verify your identity. Your data is kept private and safe.
        </p>
      </footer>

      <Dialog open={showCamera} onOpenChange={setShowCamera}>
        <DialogContent className="max-w-xl p-0 overflow-hidden bg-white border-none rounded-[2rem] sm:rounded-[2.5rem] w-[95vw] sm:w-full max-h-[90vh] flex flex-col">
          <DialogHeader className="p-6 sm:p-8 pb-0">

            <DialogTitle className="text-2xl font-black uppercase italic tracking-tight">
              Live <span className="text-violet-500">Verification</span>
            </DialogTitle>
            <DialogDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Please ensure your face is clearly visible in the frame
            </DialogDescription>
          </DialogHeader>
          
          {showCamera && (
            <LiveSelfieCapture 
              onCapture={(file) => {
                handleFileChange('SELFIE', file)
                setShowCamera(false)
              }}
              onCancel={() => setShowCamera(false)}
            />
          )}

        </DialogContent>
      </Dialog>
    </div>

  )
}

interface UploadCardProps {
  title: string;
  description: string;
  type: string;
  state: FileState;
  onFileChange: (type: string, file: File | null) => void;
  disabled: boolean;
  icon: React.ReactNode;
  onCameraClick?: () => void;
  forceCamera?: boolean;
}


function UploadCard({ title, description, type, state, onFileChange, disabled, icon, onCameraClick, forceCamera }: UploadCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  return (
    <div 
      className={`group relative overflow-hidden rounded-[2rem] p-6 border-2 transition-all duration-500 h-full flex flex-col ${
        state.uploaded 
          ? 'bg-emerald-50/50 border-emerald-100' 
          : 'bg-white border-slate-100 hover:border-violet-200 hover:shadow-xl hover:shadow-slate-200/40'
      }`}
    >
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-2xl transition-all duration-500 ${state.uploaded ? 'bg-emerald-500 text-white rotate-6' : 'bg-slate-50 text-slate-400 group-hover:bg-violet-50 group-hover:text-violet-600'}`}>
            {icon}
          </div>
          <div>
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">{title}</h4>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{description}</p>
          </div>
        </div>
        {state.uploaded && <CheckCircle2 className="w-5 h-5 text-emerald-500 animate-in zoom-in" />}
      </div>

      <div className="flex-1">
        {state.url ? (
          <div className="relative aspect-video rounded-2xl overflow-hidden border border-slate-100 bg-slate-50 group/preview">
            <Image 
              src={state.url} 
              alt={title} 
              fill 
              className="object-cover transition-transform duration-700 group-hover/preview:scale-110" 
            />
            {state.uploading && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
              </div>
            )}
            {!disabled && !state.uploading && (
               <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover/preview:opacity-100 transition-opacity flex items-center justify-center gap-2">
                 <Button 
                   variant="secondary" 
                   size="icon" 
                   className="rounded-full bg-white/20 backdrop-blur-md text-white hover:bg-white/40"
                   onClick={() => window.open(state.url!, '_blank')}
                 >
                   <Eye size={16} />
                 </Button>
                 <Button 
                   variant="destructive" 
                   size="icon" 
                   className="rounded-full bg-rose-500 text-white"
                   onClick={() => onFileChange(type, null)}
                 >
                   <Trash2 size={16} />
                 </Button>
               </div>
            )}
          </div>
        ) : (
          <button 
            disabled={disabled}
            onClick={() => forceCamera ? onCameraClick?.() : fileInputRef.current?.click()}
            className="w-full aspect-video rounded-2xl border-2 border-dashed border-slate-200 hover:border-violet-300 bg-slate-50/50 hover:bg-violet-50 transition-all duration-300 flex flex-col items-center justify-center gap-3 text-slate-400 hover:text-violet-500 disabled:opacity-50 disabled:cursor-not-allowed group/btn"
          >
            <div className="p-3 bg-white rounded-xl shadow-sm group-hover/btn:scale-110 transition-transform">
              {forceCamera ? <Camera size={20} /> : <Upload size={20} />}
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">
              {forceCamera ? 'Capture Selfie' : 'Upload File'}
            </span>
          </button>
        )}
      </div>

      {!forceCamera && (
        <input 
          type="file" 
          ref={fileInputRef}
          className="hidden" 
          accept="image/*,application/pdf"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) onFileChange(type, file)
          }}
        />
      )}
    </div>

  )
}
