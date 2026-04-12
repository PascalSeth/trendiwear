'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, MapPin, Check, Plus, Loader2, ShieldCheck, Info, Pencil, X, Truck, Package } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useCartStore, selectCartItems, selectCartSummary } from '@/lib/stores'
import { Button } from '@/components/ui/button'
import AddressAutocomplete, { AddressResult } from '@/app/components/AddressAutocomplete'
import dynamic from 'next/dynamic'
import { calculateDistance } from '@/lib/utils/geo'
const PickupMap = dynamic(() => import('@/app/components/checkout/PickupMap'), { ssr: false })

interface Address {
  id: string
  type: string
  firstName: string
  lastName: string
  street: string
  city: string
  state: string
  zipCode: string
  country: string
  latitude: number | null
  longitude: number | null
  isDefault: boolean
  isDeleted: boolean
}


const EMPTY_FORM = {
  type: 'HOME',
  firstName: '',
  lastName: '',
  street: '',
  city: '',
  state: '',
  zipCode: '',
  country: 'Ghana',
  latitude: 0,
  longitude: 0,
  isDefault: false,
}

export default function CheckoutPage() {
  const router = useRouter()
  const cartItems = useCartStore(selectCartItems)
  const summary = useCartStore(selectCartSummary)

  const [addresses, setAddresses] = useState<Address[]>([])
  const [loadingAddresses, setLoadingAddresses] = useState(true)
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)

  const [isProcessing, setIsProcessing] = useState(false)
  // 'none' | 'new' | 'edit'
  const [formMode, setFormMode] = useState<'none' | 'new' | 'edit'>('none')
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)

  // Form State
  const [form, setForm] = useState(EMPTY_FORM)
  const [deliveryMethod, setDeliveryMethod] = useState<'DELIVERY' | 'PICKUP'>('DELIVERY')
  // Geolocation handled by AddressAutocomplete component
  const allAllowPickup = cartItems.every(i => i.product.allowPickup)
  const allAllowDelivery = cartItems.every(i => i.product.allowDelivery)


  // Derived: Unique sellers for pickup
  const pickupSellers = React.useMemo(() => {
    const sellersMap = new Map()
    cartItems.forEach(item => {
      const prof = item.product.professional
      if (prof && prof.professionalProfile) {
        sellersMap.set(prof.professionalProfile.businessName, {
          name: prof.professionalProfile.businessName,
          lat: prof.professionalProfile.latitude,
          lng: prof.professionalProfile.longitude,
          address: prof.professionalProfile.location,
          fullName: `${prof.firstName} ${prof.lastName}`
        })
      }
    })
    return Array.from(sellersMap.values())
  }, [cartItems])

  const selectedAddress = addresses.find(a => a.id === selectedAddressId)

  useEffect(() => {
    if (cartItems.length === 0) router.push('/cart')
  }, [cartItems, router])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [addrRes, meRes] = await Promise.all([fetch('/api/addresses'), fetch('/api/me')])
        if (addrRes.ok) {
          const data = await addrRes.json()
          setAddresses(data.addresses)
          if (data.addresses.length > 0) {
            setSelectedAddressId(data.addresses[0].id)
          } else {
            setFormMode('new')
          }
        }
        if (meRes.ok) {
          // meData fetch remains if needed for other things, but email state was removed
          await meRes.json()
        }
      } catch (err) {
        console.error('Error fetching checkout data', err)
      } finally {
        setLoadingAddresses(false)
      }
    }
    fetchData()
  }, [])

  const openEdit = (addr: Address) => {
    setEditingAddress(addr)
    setForm({
      type: addr.type,
      firstName: addr.firstName,
      lastName: addr.lastName,
      street: addr.street,
      city: addr.city,
      state: addr.state,
      zipCode: addr.zipCode,
      country: addr.country,
      latitude: addr.latitude || 0,
      longitude: addr.longitude || 0,
      isDefault: addr.isDefault,
    })
    setFormMode('edit')
  }

  const openNew = () => {
    setEditingAddress(null)
    setForm(EMPTY_FORM)
    setFormMode('new')
  }

  const closeForm = () => {
    setFormMode('none')
    setEditingAddress(null)
  }

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const isEditing = formMode === 'edit' && editingAddress
      const url = isEditing ? `/api/addresses/${editingAddress.id}` : '/api/addresses'
      const method = isEditing ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (res.ok) {
        const saved = await res.json()
        if (isEditing) {
          setAddresses(prev => prev.map(a => (a.id === saved.id ? saved : a)))
          toast.success('Address updated')
        } else {
          setAddresses(prev => [saved, ...prev])
          setSelectedAddressId(saved.id)
          toast.success('Address saved')
        }
        closeForm()
      } else {
        toast.error('Failed to save address')
      }
    } catch {
      toast.error('An error occurred')
    }
  }

  const handlePayNow = async () => {
    if (!selectedAddressId) {
      toast.error('Please select a delivery address')
      return
    }
    setIsProcessing(true)

    try {
      // Step 1: Create the order (PENDING payment status)
      toast.loading('Preparing your order…', { id: 'checkout-toast' })

      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          addressId: selectedAddressId,
          items: cartItems.map(i => ({
            productId: i.product.id,
            quantity: i.quantity,
            size: i.size,
            color: i.color,
          })),
          deliveryMethod,
          // No paystackReference yet — order created as PENDING
        }),
      })

      const orderData = await orderRes.json()
      if (!orderRes.ok) throw new Error(orderData.error || 'Failed to create order')

      const orderId: string = orderData.id
      toast.dismiss('checkout-toast')

      // Step 2: Initialize payment with proper per-seller splits
      const initRes = await fetch('/api/payments/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          callbackUrl: `${window.location.origin}/orders/${orderId}/payment-complete`,
        }),
      })

      const initData = await initRes.json()
      if (!initRes.ok) throw new Error(initData.error || 'Failed to initialize payment')

      const { accessCode, reference } = initData

      // Step 3: Open Paystack inline widget using the server-generated access code
      // This ensures the split configuration built server-side is used
      setTimeout(async () => {
        const PaystackPop = (await import('@paystack/inline-js')).default
        const popup = new PaystackPop()

        popup.resumeTransaction(accessCode, {
          onSuccess: async (transaction: { reference: string }) => {
            try {
              toast.loading('Verifying payment…', { id: 'verify-toast' })

              const verifyRes = await fetch(`/api/payments/verify?reference=${encodeURIComponent(transaction.reference || reference)}`)
              const verifyData = await verifyRes.json()

              if (!verifyRes.ok || !verifyData.success) throw new Error(verifyData.error || 'Verification failed')

              toast.dismiss('verify-toast')
              toast.success('Payment successful! Order placed.')
              
              // Clear the local cart state instantly (backend cart is cleared by the webhook/verification)
              useCartStore.getState().clearCart()
              
              router.push(`/orders/${orderId}/payment-complete?reference=${transaction.reference || reference}`)
            } catch (err) {
              toast.dismiss('verify-toast')
              console.error('Verification error:', err)
              toast.error('Payment received but verification failed. Please contact support.')
              router.push(`/orders/${orderId}`)
            }
          },
          onCancel: () => {
            toast('Payment cancelled. Your order is saved — you can retry from your orders page.')
            router.push(`/orders/${orderId}`)
          },
        })
      }, 50)
    } catch (err) {
      toast.dismiss('checkout-toast')
      console.error('Checkout error:', err)
      toast.error(err instanceof Error ? err.message : 'Checkout failed')
    } finally {
      setIsProcessing(false)
    }
  }

  if (cartItems.length === 0) return null


  return (
    <div className="min-h-screen bg-[#FAFAF9] text-stone-900 pb-24">

      {/* Top Nav */}
      <div className="bg-white border-b border-stone-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/cart" className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-stone-500 hover:text-stone-900 transition-colors">
            <ArrowLeft size={16} /> Back to Bag
          </Link>
          <div className="flex items-center gap-3">
            <ShieldCheck className="text-emerald-600" size={20} />
            <span className="font-serif">Secure Checkout</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-12 pt-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">

          {/* LEFT: Delivery */}
          <div className="lg:col-span-7 space-y-10">
            <div>
              <h1 className="text-3xl font-serif font-medium mb-2">Delivery Details</h1>
              <p className="text-stone-500 font-light">Choose where you&apos;d like your items delivered</p>
            </div>

            {/* Fulfillment Selection */}
            {(allAllowDelivery || allAllowPickup) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {allAllowDelivery && (
                  <div
                    onClick={() => setDeliveryMethod('DELIVERY')}
                    className={`cursor-pointer p-6 border transition-all flex items-center gap-4 ${deliveryMethod === 'DELIVERY' ? 'border-stone-900 bg-white shadow-sm' : 'border-stone-200 bg-transparent hover:border-stone-300'}`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${deliveryMethod === 'DELIVERY' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-400'}`}>
                      <Truck size={20} />
                    </div>
                    <div>
                      <h4 className="font-medium text-stone-900">Standard Delivery</h4>
                      <p className="text-xs text-stone-500">Delivered to your address</p>
                    </div>
                    {deliveryMethod === 'DELIVERY' && <Check size={16} className="ml-auto text-stone-900" />}
                  </div>
                )}
                {allAllowPickup && (
                  <div
                    onClick={() => setDeliveryMethod('PICKUP')}
                    className={`cursor-pointer p-6 border transition-all flex items-center gap-4 ${deliveryMethod === 'PICKUP' ? 'border-stone-900 bg-white shadow-sm' : 'border-stone-200 bg-transparent hover:border-stone-300'}`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${deliveryMethod === 'PICKUP' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-400'}`}>
                      <Package size={20} />
                    </div>
                    <div>
                      <h4 className="font-medium text-stone-900">Store Pickup</h4>
                      <p className="text-xs text-stone-500">Collect from seller location</p>
                    </div>
                    {deliveryMethod === 'PICKUP' && <Check size={16} className="ml-auto text-stone-900" />}
                  </div>
                )}
              </div>
            )}

            {loadingAddresses ? (
              <div className="flex items-center gap-3 text-stone-500 py-10">
                <Loader2 size={20} className="animate-spin" /> Loading addresses...
              </div>
            ) : (
              <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                  {/* Address Cards */}
                  {formMode !== 'new' && addresses.map(addr => (
                    <motion.div
                      key={addr.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      {/* Edit mode for this address */}
                      {formMode === 'edit' && editingAddress?.id === addr.id ? (
                        <AddressForm 
                          form={form}
                          setForm={setForm}
                          formMode={formMode as 'new' | 'edit'}
                          addresses={addresses}
                          handleSaveAddress={handleSaveAddress}
                          closeForm={closeForm}
                        />
                      ) : (
                        <div
                          onClick={() => setSelectedAddressId(addr.id)}
                          className={`group cursor-pointer p-6 border transition-all ${selectedAddressId === addr.id ? 'border-stone-900 bg-white shadow-sm' : 'border-stone-200 bg-transparent hover:border-stone-300'}`}
                        >
                          <div className="flex justify-between items-start mb-4">
                            <span className="font-mono text-xs uppercase tracking-widest text-stone-500 flex items-center gap-2">
                              <MapPin size={14} /> {addr.type}
                            </span>
                            <div className="flex items-center gap-3">
                              {/* Edit button */}
                              <button
                                onClick={e => { e.stopPropagation(); openEdit(addr) }}
                                className="opacity-0 group-hover:opacity-100 transition-opacity text-stone-400 hover:text-stone-900 flex items-center gap-1 font-mono text-xs uppercase tracking-widest"
                              >
                                <Pencil size={12} /> Edit
                              </button>
                              {selectedAddressId === addr.id && (
                                <div className="w-5 h-5 bg-stone-900 rounded-full flex items-center justify-center">
                                  <Check size={12} className="text-white" />
                                </div>
                              )}
                            </div>
                          </div>
                          <h3 className="font-medium text-stone-900 mb-1">{addr.firstName} {addr.lastName}</h3>
                          <p className="text-sm text-stone-500 leading-relaxed">
                            {addr.street}<br />
                            {addr.city}, {addr.state} {addr.zipCode}<br />
                            {addr.country}
                          </p>
                        </div>
                      )}
                    </motion.div>
                  ))}

                  {/* New address form */}
                  {formMode === 'new' && (
                    <motion.div key="new-form" layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <AddressForm 
                        form={form}
                        setForm={setForm}
                        formMode={formMode as 'new' | 'edit'}
                        addresses={addresses}
                        handleSaveAddress={handleSaveAddress}
                        closeForm={closeForm}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Add new prompt */}
                {formMode === 'none' && (
                  <div
                    onClick={openNew}
                    className="cursor-pointer p-6 border border-dashed border-stone-300 bg-transparent hover:bg-white transition-all flex flex-col items-center justify-center text-stone-500 hover:text-stone-900 gap-2 min-h-[80px]"
                  >
                    <Plus size={20} />
                    <span className="font-mono text-xs uppercase tracking-widest">Add New Address</span>
                  </div>
                )}
              </div>
            )}

            {/* Pickup Details & Map */}
            {deliveryMethod === 'PICKUP' && pickupSellers.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-6"
              >
                <div className="bg-white border border-stone-200 p-8 rounded-none space-y-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-serif">Collection Points</h3>
                      <p className="text-stone-500 text-sm mt-1">Visit our artisans at their studio locations</p>
                    </div>
                    <div className="h-10 w-10 bg-amber-50 rounded-full flex items-center justify-center text-amber-600">
                      <MapPin size={20} />
                    </div>
                  </div>

                  {/* Map Aspect - Cinematic Atelier Style */}
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-full rounded-[2.5rem] overflow-hidden border-8 border-white shadow-2xl relative group bg-stone-100 h-[400px]"
                  >
                    <PickupMap 
                      userAddress={selectedAddress}
                      sellers={pickupSellers}
                    />
                  </motion.div>

                  {/* Seller List with Distances */}
                  <div className="space-y-4">
                    {pickupSellers.map((seller, idx) => {
                      const dist = selectedAddress?.latitude && selectedAddress?.longitude && seller.lat && seller.lng
                        ? calculateDistance(selectedAddress.latitude as number, selectedAddress.longitude as number, seller.lat as number, seller.lng as number)
                        : null;

                      return (
                        <div key={idx} className="flex items-center justify-between p-4 border border-stone-100 hover:border-stone-200 transition-colors">
                          <div className="flex gap-4 items-center">
                            <div className="w-12 h-12 bg-stone-50 flex items-center justify-center border border-stone-100 italic font-serif text-lg text-stone-400">
                              {seller.name.charAt(0)}
                            </div>
                            <div>
                              <h4 className="font-medium text-stone-900">{seller.name}</h4>
                              <p className="text-xs text-stone-500 truncate max-w-[200px]">{seller.address}</p>
                            </div>
                          </div>
                          {dist !== null && (
                             <div className="text-right">
                               <span className="block text-sm font-bold text-stone-900">{dist} km</span>
                               <span className="text-[9px] font-mono uppercase tracking-widest text-stone-400">to collection</span>
                             </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Payment Notice */}
            <div className="p-6 bg-emerald-50/50 border border-emerald-100 flex gap-4 items-start">
              <ShieldCheck className="text-emerald-600 mt-1" size={24} />
              <div>
                <h4 className="font-medium text-stone-900 mb-1">✅ 100% Protected Payment</h4>
                <div className="text-sm text-stone-600 leading-relaxed">
                  Your payment is safely held by <strong>TrendiZip</strong>. The seller is only paid when your delivery is complete. 
                  <span className="block mt-2 text-stone-400 text-xs italic">Note: We are not responsible for any payments made outside our official checkout.</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Order Summary */}
          <div className="lg:col-span-5">
            <div className="bg-white border border-stone-200 p-8 sticky top-28">
              <h2 className="text-xl font-serif text-stone-900 mb-6">Order Summary</h2>

              {/* Items */}
              <div className="max-h-[280px] overflow-y-auto mb-6 pr-2 space-y-4">
                {cartItems.map(item => (
                  <div key={item.id} className="flex gap-4">
                    <div className="relative w-16 h-20 bg-stone-100 border border-stone-100 flex-shrink-0">
                      <Image src={item.product.images[0] || '/placeholder-product.jpg'} alt={item.product.name} fill className="object-cover" />
                      <div className="absolute -top-2 -right-2 w-5 h-5 bg-stone-900 text-white rounded-full flex items-center justify-center text-[10px] font-mono">
                        {item.quantity}
                      </div>
                    </div>
                    <div className="flex-1 py-1 min-w-0">
                      <h4 className="text-sm font-medium text-stone-900 line-clamp-1">{item.product.name}</h4>
                      <div className="flex items-center gap-2 mt-1.5 text-xs text-stone-500">
                        {item.size && <span className="bg-stone-50 px-2 py-0.5 rounded-md border border-stone-200">{item.size}</span>}
                        {item.color && (
                          <span 
                            className="w-4 h-4 rounded-full border border-stone-200 shadow-sm shrink-0" 
                            style={{ backgroundColor: item.color }}
                            title={item.color}
                          />
                        )}
                      </div>
                    </div>
                    <div className="py-1">
                      <span className="text-sm font-medium text-stone-900">
                        {item.product.currency} {((item.product.effectivePrice || item.product.price) * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pricing */}
              <div className="space-y-4 mb-6 pt-6 border-t border-stone-100">
                <div className="flex justify-between text-sm">
                  <span className="text-stone-500 font-light">Subtotal</span>
                  <span className="font-medium">{cartItems[0]?.product?.currency || 'GHS'} {summary?.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-stone-500 font-light flex items-center gap-1">Shipping <Info size={12} /></span>
                  <span className="text-stone-500 font-mono text-xs uppercase tracking-widest">
                    {deliveryMethod === 'PICKUP' ? 'Free (Pickup)' : 'Carrier Quote'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-stone-500 font-light">Handling Fee (3%)</span>
                  <span className="font-medium">{cartItems[0]?.product?.currency || 'GHS'} {((summary?.subtotal || 0) * 0.03).toFixed(2)}</span>
                </div>
              </div>

              <div className="pt-6 border-t border-stone-200 mb-8">
                <div className="flex justify-between items-end">
                  <span className="font-serif text-stone-900">Total</span>
                  <span className="text-3xl font-serif text-stone-900">
                    {cartItems[0]?.product?.currency || 'GHS'} {summary?.estimatedTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              <Button
                onClick={handlePayNow}
                disabled={isProcessing || !selectedAddressId || formMode !== 'none'}
                className="w-full bg-stone-900 hover:bg-stone-800 text-white rounded-none py-7 font-mono text-sm uppercase tracking-widest shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isProcessing ? <><Loader2 className="animate-spin" size={16} /> Processing...</> : 'Pay Now'}
              </Button>

              {formMode !== 'none' && (
                <p className="text-center text-xs text-amber-600 mt-3 font-mono">Please finish editing your address first</p>
              )}

              <p className="text-center text-xs text-stone-400 mt-4 flex items-center justify-center gap-1 font-mono uppercase tracking-widest">
                <ShieldCheck size={12} /> Powered by Paystack
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

// AddressForm extracted outside of CheckoutPage to prevent focus loss issues
interface AddressFormProps {
  form: typeof EMPTY_FORM
  setForm: React.Dispatch<React.SetStateAction<typeof EMPTY_FORM>>
  formMode: 'new' | 'edit'
  addresses: Address[]
  handleSaveAddress: (e: React.FormEvent) => Promise<void>
  closeForm: () => void
}

const AddressForm = ({ 
  form, 
  setForm, 
  formMode, 
  addresses, 
  handleSaveAddress, 
  closeForm
}: AddressFormProps) => (
  <motion.form
    initial={{ opacity: 0, y: -8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    onSubmit={handleSaveAddress}
    className="bg-white border border-stone-200 p-8 space-y-6 overflow-hidden"
  >
    <div className="flex items-center justify-between mb-2">
      <h3 className="font-serif text-xl">{formMode === 'edit' ? 'Edit Address' : 'New Delivery Address'}</h3>
      {(addresses.length > 0 || formMode === 'edit') && (
        <button type="button" onClick={closeForm} className="text-stone-400 hover:text-stone-900 transition-colors">
          <X size={18} />
        </button>
      )}
    </div>

    {/* Address type toggle */}
    <div className="flex gap-3">
      {(['HOME', 'WORK'] as const).map(t => (
        <button
          key={t}
          type="button"
          onClick={() => setForm(f => ({ ...f, type: t }))}
          className={`px-4 py-2 border text-xs font-mono uppercase tracking-widest transition-all ${form.type === t ? 'border-stone-900 bg-stone-900 text-white' : 'border-stone-200 text-stone-500 hover:border-stone-400'}`}
        >
          {t}
        </button>
      ))}
    </div>

    <div className="grid grid-cols-2 gap-6">
      <Field label="First Name" value={form.firstName} onChange={v => setForm(f => ({ ...f, firstName: v }))} />
      <Field label="Last Name" value={form.lastName} onChange={v => setForm(f => ({ ...f, lastName: v }))} />
    </div>
    <div className="space-y-1">
      <label className="text-[10px] font-mono uppercase tracking-widest text-stone-500 ml-1">Street Address</label>
      <AddressAutocomplete
        value={form.street}
        onChange={v => setForm(f => ({ ...f, street: v }))}
        onAddressSelect={(res: AddressResult) => {
          setForm(f => ({
            ...f,
            street: res.street,
            city: res.city || f.city,
            state: res.state || f.state,
            zipCode: res.zipCode || f.zipCode,
            country: res.country || f.country,
            latitude: res.latitude,
            longitude: res.longitude
          }))
        }}
      />
    </div>
    <div className="grid grid-cols-2 gap-6">
      <Field label="City" value={form.city} onChange={v => setForm(f => ({ ...f, city: v }))} />
      <Field label="State / Region" value={form.state} onChange={v => setForm(f => ({ ...f, state: v }))} />
    </div>
    <div className="grid grid-cols-2 gap-6">
      <Field label="Zip / Postal Code" value={form.zipCode} onChange={v => setForm(f => ({ ...f, zipCode: v }))} />
      <Field label="Country" value={form.country} onChange={v => setForm(f => ({ ...f, country: v }))} />
    </div>

    <AnimatePresence mode="wait">
      {(form.latitude !== 0 || form.longitude !== 0) ? (
        <motion.div 
          key="coord-success"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-emerald-50 border border-emerald-100 p-4 flex items-center gap-3 rounded-lg"
        >
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-emerald-200 shadow-sm">
            <Check size={14} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-800">✅ Location Verified for Map</p>
            <p className="text-[10px] font-mono text-emerald-600">{form.latitude.toFixed(4)}, {form.longitude.toFixed(4)}</p>
          </div>
        </motion.div>
      ) : (
        <motion.div 
          key="coord-missing"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-amber-50 border border-amber-100 p-4 flex items-start gap-3 rounded-lg"
        >
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-amber-200 shadow-sm shrink-0">
            <Info size={14} className="text-amber-600" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-amber-800">⚠️ Coordinates Missing</p>
            <p className="text-[9px] text-amber-600 leading-relaxed italic">
              Use &quot;Search&quot; or &quot;Detect&quot; above to add your address to the map for accurate distance calculation.
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>

    <div className="pt-4 flex items-center gap-4">
      <Button type="submit" variant="default" className="bg-stone-900 hover:bg-stone-800 text-white rounded-none px-8 py-6 font-mono text-xs uppercase tracking-widest">
        {formMode === 'edit' ? 'Update Address' : 'Save Address'}
      </Button>
      {formMode === 'edit' && (
        <button type="button" onClick={closeForm} className="text-stone-500 hover:text-stone-900 font-mono text-xs uppercase tracking-widest">
          Cancel
        </button>
      )}
    </div>
  </motion.form>
)

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-2">
      <label className="font-mono text-xs uppercase tracking-widest text-stone-500">{label}</label>
      <input
        required
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full border-b border-stone-200 pb-2 focus:outline-none focus:border-stone-900 bg-transparent transition-colors text-stone-900"
      />
    </div>
  )
}
