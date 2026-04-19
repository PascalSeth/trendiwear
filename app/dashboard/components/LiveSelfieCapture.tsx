'use client'

import React, { useRef, useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Camera, RefreshCw, Check, AlertCircle, Loader2, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface LiveSelfieCaptureProps {
  onCapture: (file: File) => void
  onCancel: () => void
}

export default function LiveSelfieCapture({ onCapture, onCancel }: LiveSelfieCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [error, setError] = useState<string | null>(null)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [isFlashing, setIsFlashing] = useState(false)

  const stopExistingStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) videoRef.current.srcObject = null
  }, [])

  const startCamera = useCallback(async () => {
    setLoading(true)
    setError(null)
    stopExistingStream()

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      })

      streamRef.current = mediaStream
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        // Critical for iOS/Safari:
        videoRef.current.setAttribute('playsinline', 'true')
        try {
          await videoRef.current.play()
          setLoading(false)
        } catch (e) {
          console.error("Video play failed", e)
        }
      }
    } catch (err: any) {
      console.error(err)
      setError('Allow camera access to take a selfie.')
      setLoading(false)
    }
  }, [stopExistingStream])

  useEffect(() => {
    startCamera()
    return () => stopExistingStream()
  }, [startCamera, stopExistingStream])

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return
    setIsFlashing(true)
    setTimeout(() => setIsFlashing(false), 150)

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')
    if (!context) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    // Match the mirrored preview
    context.translate(canvas.width, 0)
    context.scale(-1, 1)
    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    setCapturedImage(canvas.toDataURL('image/jpeg', 0.9))
    stopExistingStream()
  }

  return (
    <div className="w-full h-full flex flex-col bg-white overflow-hidden">


      {/* Header */}
      <div className="p-4 flex justify-between items-center bg-slate-50 border-b">
        <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Selfie Verification</span>
        <button onClick={onCancel} className="text-slate-400 hover:text-slate-600">
          <X size={20} />
        </button>
      </div>

      {/* Camera Container - Flexible height to ensure buttons stay on screen */}
      <div className="relative flex-1 min-h-0 bg-black overflow-hidden sm:aspect-[3/4]">


        {/* The Live Video Feed */}
        {!capturedImage && (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
          />
        )}

        {/* The Snapshot Result */}
        {capturedImage && (
          <img src={capturedImage} className="absolute inset-0 w-full h-full object-cover" alt="Selfie" />
        )}

        {/* Visual Face Guide Overlay */}
        {!capturedImage && !loading && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            {/* The Cutout Circle */}
            <div className="w-[75%] h-[65%] border-2 border-white/50 rounded-[100%] border-dashed flex items-center justify-center">
              <div className="w-full h-full rounded-[100%] shadow-[0_0_0_999px_rgba(0,0,0,0.4)]" />
            </div>
            <p className="mt-6 text-white text-sm font-medium bg-black/40 px-4 py-1.5 rounded-full backdrop-blur-sm">
              Center your face in the oval
            </p>
          </div>
        )}

        {/* Loading/Error states */}
        {(loading || error) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 text-center p-6 z-20">
            {loading && !error ? (
              <>
                <Loader2 className="w-10 h-10 text-white animate-spin mb-4" />
                <p className="text-white text-sm">Starting Camera...</p>
              </>
            ) : (
              <>
                <AlertCircle className="w-10 h-10 text-rose-500 mb-4" />
                <p className="text-white text-sm mb-4">{error}</p>
                <Button onClick={startCamera} variant="outline" className="text-white border-white">Try Again</Button>
              </>
            )}
          </div>
        )}

        {/* Flash Animation */}
        <AnimatePresence>
          {isFlashing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-white z-30"
            />
          )}
        </AnimatePresence>
      </div>

      {/* Footer Actions - Compact on mobile */}
      <div className="p-4 sm:p-6 bg-white border-t">

        {!capturedImage ? (
          <div className="flex flex-col items-center gap-2 sm:gap-4">
            <button 
              disabled={loading || !!error}
              onClick={capturePhoto}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-slate-900 border-4 border-slate-200 flex items-center justify-center shadow-xl hover:bg-slate-800 transition-all active:scale-90 disabled:opacity-50"
            >
              <Camera className="text-white w-7 h-7 sm:w-8 sm:h-8" />
            </button>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Take Photo</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => { setCapturedImage(null); startCamera(); }}
                className="rounded-xl h-12 border-slate-200 text-slate-600 font-bold"
              >
                <RefreshCw className="mr-2 w-4 h-4" /> Retake
              </Button>
              <Button
                onClick={async () => {
                  const res = await fetch(capturedImage);
                  const blob = await res.blob();
                  onCapture(new File([blob], "selfie.jpg", { type: "image/jpeg" }));
                }}
                className="rounded-xl h-12 bg-emerald-600 hover:bg-emerald-700 font-bold"
              >
                <Check className="mr-2 w-4 h-4" /> Confirm
              </Button>
            </div>
          </div>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}