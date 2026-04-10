'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, CheckCircle2, Phone, Wallet, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

interface PaymentSetupStatus {
  isSetup: boolean
  momoNumber: string | null
  momoProvider: string | null
  momoProviderName: string | null
  hasSubaccount: boolean
}

interface MomoProvider {
  code: string
  name: string
  displayName: string
  active?: boolean
}

export function PaymentSetupForm() {
  const [status, setStatus] = useState<PaymentSetupStatus | null>(null)
  const [providers, setProviders] = useState<MomoProvider[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  
  const [momoNumber, setMomoNumber] = useState('')
  const [momoProvider, setMomoProvider] = useState('')

  // Fetch current setup status and providers
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statusRes, providersRes] = await Promise.all([
          fetch('/api/payments/setup'),
          fetch('/api/payments/momo-providers'),
        ])

        if (statusRes.ok) {
          const statusData = await statusRes.json()
          setStatus(statusData)
          // Prefill the provider and number inputs with DB values for a smoother UX
          if (statusData.momoProvider) setMomoProvider(statusData.momoProvider)
          if (statusData.momoNumberRaw) setMomoNumber(statusData.momoNumberRaw)
        }

        if (providersRes.ok) {
          const providersData = await providersRes.json()
          setProviders(providersData.providers || providersData.fallbackProviders || [])
        }
      } catch (error) {
        console.error('Failed to fetch payment setup data:', error)
        toast.error('Failed to load payment settings')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!momoNumber || !momoProvider) {
      toast.error('Please fill in all fields')
      return
    }

    setIsSaving(true)

    try {
      const response = await fetch('/api/payments/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ momoNumber, momoProvider }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 409) {
          throw new Error("This Mobile Money number is already in use by another professional. Please use a unique number.");
        }
        throw new Error(data.error || 'Failed to setup payment')
      }

      setStatus({
        isSetup: true,
        momoNumber: data.data.momoNumber,
        momoProvider: data.data.momoProvider,
        momoProviderName: data.data.momoProviderName,
        hasSubaccount: true,
      })

      toast.success('Payment setup completed successfully!')
      setMomoNumber('')
      setMomoProvider('')
    } catch (error) {
      console.error('Payment setup error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to setup payment')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="w-5 h-5" />
          Payment Setup
        </CardTitle>
        <CardDescription>
          Set up your mobile money account to receive payments directly when customers purchase your products.
          A 3% platform fee is deducted from each sale.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {status?.isSetup ? (
          <div className="space-y-4">
            {/* Current Setup Status */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-green-900">Payment Setup Complete</h4>
                  <p className="text-sm text-green-700 mt-1">
                    Your payments will be sent to your {status.momoProviderName} account ending in{' '}
                    {status.momoNumber?.slice(-4)}
                  </p>
                </div>
              </div>
            </div>

            {/* Update Form */}
            <div className="border-t pt-4 mt-4">
              <h4 className="font-medium text-gray-900 mb-4">Update Payment Details</h4>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="provider">Mobile Money Provider</Label>
                  <Select value={momoProvider} onValueChange={setMomoProvider}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select provider" />
                    </SelectTrigger>
                    <SelectContent>
                      {providers.map((provider) => (
                        <SelectItem key={provider.code} value={provider.code}>
                          {provider.displayName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="momoNumber">Mobile Money Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="momoNumber"
                      type="tel"
                      placeholder="0241234567"
                      value={momoNumber}
                      onChange={(e) => setMomoNumber(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Enter your Ghana mobile number (e.g., 0241234567)
                  </p>
                </div>

                <Button type="submit" disabled={isSaving} className="w-full">
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update Payment Details'
                  )}
                </Button>
              </form>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Setup Required Notice */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-amber-900">Setup Required</h4>
                  <p className="text-sm text-amber-700 mt-1">
                    You need to set up your mobile money account before you can receive payments for your products.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="provider">Mobile Money Provider *</Label>
              <Select value={momoProvider} onValueChange={setMomoProvider} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select your MoMo provider" />
                </SelectTrigger>
                <SelectContent>
                  {providers.map((provider) => (
                    <SelectItem key={provider.code} value={provider.code}>
                      {provider.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="momoNumber">Mobile Money Number *</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="momoNumber"
                  type="tel"
                  placeholder="0241234567"
                  value={momoNumber}
                  onChange={(e) => setMomoNumber(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
              <p className="text-xs text-gray-500">
                This is where your payments will be sent. Enter your Ghana mobile number.
              </p>
            </div>

            {/* Fee Notice */}
            <div className="bg-gray-50 rounded-lg p-4 text-sm">
              <h5 className="font-medium text-gray-900">How Payments Work</h5>
              <ul className="mt-2 space-y-1 text-gray-600">
                <li>• When a customer pays for your product, you receive 97% of the sale</li>
                <li>• A 3% platform handling fee is automatically deducted</li>
                <li>• Funds are sent directly to your mobile money account</li>
                <li>• You can update these details at any time</li>
              </ul>
            </div>

            <Button type="submit" disabled={isSaving} className="w-full">
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Setting up...
                </>
              ) : (
                'Complete Payment Setup'
              )}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
