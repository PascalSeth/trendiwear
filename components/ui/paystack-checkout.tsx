'use client'

import React, { useState } from 'react'
import { usePaystackPayment } from 'react-paystack'
import { Button } from '@/components/ui/button'
import { Loader2, CreditCard, Smartphone, Building2 } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { PAYSTACK_CONFIG } from '@/lib/paystack'

interface PaystackCheckoutButtonProps {
  orderId: string
  email: string
  amount: number // In GHS (cedis)
  onSuccess?: (reference: string) => void
  onClose?: () => void
  disabled?: boolean
  className?: string
  children?: React.ReactNode
}

export function PaystackCheckoutButton({
  orderId,
  amount,
  disabled = false,
  className = '',
  children,
}: PaystackCheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handlePayment = async () => {
    setIsLoading(true)

    try {
      // Initialize payment with our API
      const response = await fetch('/api/payments/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          callbackUrl: `${window.location.origin}/orders/${orderId}/payment-complete`,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to initialize payment')
      }

      // Redirect to Paystack checkout page
      window.location.href = data.authorizationUrl
    } catch (error) {
      console.error('Payment initialization error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to start payment')
      setIsLoading(false)
    }
  }

  return (
    <Button
      onClick={handlePayment}
      disabled={disabled || isLoading}
      className={`w-full ${className}`}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Processing...
        </>
      ) : children ? (
        children
      ) : (
        <>
          <CreditCard className="w-4 h-4 mr-2" />
          Pay GHS {amount.toFixed(2)}
        </>
      )}
    </Button>
  )
}

// Alternative: Inline Paystack popup (if you prefer not redirecting)
interface PaystackInlineCheckoutProps {
  orderId: string
  email: string
  amount: number
  reference: string
  onSuccess?: (reference: string) => void
  onClose?: () => void
}

export function PaystackInlineCheckout({
  orderId,
  email,
  amount,
  reference,
  onSuccess,
  onClose,
}: PaystackInlineCheckoutProps) {
  const router = useRouter()

  const config = {
    reference,
    email,
    amount: Math.round(amount * 100),
    publicKey: PAYSTACK_CONFIG.publicKey,
    currency: 'GHS',
  }

  const handleSuccess = (ref: { reference: string }) => {
    toast.success('Payment successful!')
    onSuccess?.(ref.reference)
    router.push(`/orders/${orderId}/payment-complete?reference=${ref.reference}`)
  }

  const handleClose = () => {
    toast.info('Payment window closed')
    onClose?.()
  }

  const initializePayment = usePaystackPayment(config)

  return (
    <Button
      onClick={() => initializePayment({ onSuccess: handleSuccess, onClose: handleClose })}
      className="w-full"
    >
      <CreditCard className="w-4 h-4 mr-2" />
      Pay GHS {amount.toFixed(2)}
    </Button>
  )
}

// Payment method selector component
interface PaymentMethodSelectorProps {
  selectedMethod: string
  onMethodChange: (method: string) => void
}

export function PaymentMethodSelector({ selectedMethod, onMethodChange }: PaymentMethodSelectorProps) {
  const methods = [
    {
      id: 'mobile_money',
      name: 'Mobile Money',
      description: 'Pay with MTN, Vodafone, or AirtelTigo',
      icon: Smartphone,
    },
    {
      id: 'card',
      name: 'Card Payment',
      description: 'Visa, Mastercard, Verve',
      icon: CreditCard,
    },
    {
      id: 'bank_transfer',
      name: 'Bank Transfer',
      description: 'Pay via bank transfer',
      icon: Building2,
    },
  ]

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-gray-700">Payment Method</label>
      <div className="grid grid-cols-1 gap-3">
        {methods.map((method) => (
          <button
            key={method.id}
            type="button"
            onClick={() => onMethodChange(method.id)}
            className={`flex items-center p-4 border rounded-lg transition-all ${
              selectedMethod === method.id
                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <method.icon className={`w-6 h-6 mr-3 ${
              selectedMethod === method.id ? 'text-blue-600' : 'text-gray-400'
            }`} />
            <div className="text-left">
              <div className={`font-medium ${
                selectedMethod === method.id ? 'text-blue-900' : 'text-gray-900'
              }`}>
                {method.name}
              </div>
              <div className="text-sm text-gray-500">{method.description}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
