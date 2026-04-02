'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, Edit2, Trash2, Home, Building2, Check, X, Plus, ChevronRight } from 'lucide-react'
import AddressAutocomplete, { AddressResult } from '@/app/components/AddressAutocomplete'

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
  latitude?: number
  longitude?: number
  isDefault: boolean
}

interface AddressesResponse {
  addresses: Address[]
}

const EMPTY_FORM = {
  type: 'HOME' as 'HOME' | 'WORK',
  firstName: '',
  lastName: '',
  street: '',
  city: '',
  state: '',
  zipCode: '',
  country: 'Kenya',
  latitude: null as number | null,
  longitude: null as number | null,
  isDefault: false,
}

function Field({
  label,
  id,
  value,
  onChange,
  required,
  placeholder,
}: {
  label: string
  id: string
  value: string
  onChange: (v: string) => void
  required?: boolean
  placeholder?: string
}) {
  return (
    <div className="field-group">
      <label htmlFor={id} className="field-label">{label}</label>
      <input
        id={id}
        className="field-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        autoComplete="off"
      />
    </div>
  )
}

function AddressCard({
  address,
  onEdit,
  onDelete,
}: {
  address: Address
  onEdit: (a: Address) => void
  onDelete: (id: string) => void
}) {
  const [confirming, setConfirming] = useState(false)

  return (
    <div className={`address-card ${address.isDefault ? 'is-default' : ''}`}>
      {address.isDefault && <span className="default-ribbon">Default</span>}

      <div className="card-type-row">
        <span className="card-type-icon">
          {address.type === 'HOME' ? <Home size={14} /> : <Building2 size={14} />}
        </span>
        <span className="card-type-label">{address.type}</span>
      </div>

      <div className="card-name">
        {address.firstName} {address.lastName}
      </div>

      <div className="card-address">
        <span>{address.street}</span>
        <span>{address.city}, {address.state} {address.zipCode}</span>
        <span>{address.country}</span>
      </div>

      <div className="card-actions">
        <button className="card-btn edit-btn" onClick={() => onEdit(address)}>
          <Edit2 size={13} />
          Edit
        </button>

        {confirming ? (
          <div className="confirm-row">
            <span className="confirm-text">Remove?</span>
            <button className="card-btn danger-btn" onClick={() => { onDelete(address.id); setConfirming(false) }}>
              <Check size={13} /> Yes
            </button>
            <button className="card-btn ghost-btn" onClick={() => setConfirming(false)}>
              <X size={13} /> No
            </button>
          </div>
        ) : (
          <button className="card-btn ghost-btn" onClick={() => setConfirming(true)}>
            <Trash2 size={13} />
            Remove
          </button>
        )}
      </div>
    </div>
  )
}

function AddressForm({
  initial,
  onSave,
  onCancel,
  isEditing,
}: {
  initial: typeof EMPTY_FORM
  onSave: (data: typeof EMPTY_FORM) => Promise<void>
  onCancel: () => void
  isEditing: boolean
}) {
  const [form, setForm] = useState(initial)
  const [saving, setSaving] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [])

// Geolocation handled by AddressAutocomplete component

  const set = (key: keyof typeof form) => (val: string | boolean) =>
    setForm((f) => ({ ...f, [key]: val }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await onSave(form)
    setSaving(false)
  }

  return (
    <div className="form-card" ref={ref}>
      <div className="form-header">
        <span className="form-title">{isEditing ? 'Edit address' : 'New address'}</span>
        <button className="form-close" onClick={onCancel}><X size={16} /></button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="type-toggle">
          {(['HOME', 'WORK'] as const).map((t) => (
            <button
              key={t}
              type="button"
              className={`type-option ${form.type === t ? 'active' : ''}`}
              onClick={() => set('type')(t)}
            >
              {t === 'HOME' ? <Home size={13} /> : <Building2 size={13} />}
              {t}
            </button>
          ))}
        </div>

        <div className="form-grid two-col">
          <Field label="First name" id="fn" value={form.firstName} onChange={set('firstName')} required placeholder="Jane" />
          <Field label="Last name" id="ln" value={form.lastName} onChange={set('lastName')} required placeholder="Doe" />
        </div>

        <div className="field-group">
          <label className="field-label">Street address</label>
          <AddressAutocomplete
            value={form.street}
            onChange={set('street')}
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

        <div className="form-grid two-col">
          <Field label="City" id="ci" value={form.city} onChange={set('city')} required placeholder="Nairobi" />
          <Field label="State / Province" id="stt" value={form.state} onChange={set('state')} required placeholder="Nairobi County" />
        </div>

        <div className="form-grid two-col">
          <Field label="ZIP / Postal code" id="zp" value={form.zipCode} onChange={set('zipCode')} required placeholder="00100" />
          <Field label="Country" id="co" value={form.country} onChange={set('country')} required placeholder="Kenya" />
        </div>

        <AnimatePresence>
          {form.latitude !== null && form.longitude !== null && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-2 flex items-center gap-2 text-[10px] font-mono font-bold text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-100"
            >
              <Check size={12} />
              GPS Locked: {form.latitude.toFixed(4)}, {form.longitude.toFixed(4)}
            </motion.div>
          )}
        </AnimatePresence>

        <label className="default-check">
          <Checkbox
            id="def"
            checked={form.isDefault}
            onCheckedChange={(c) => set('isDefault')(c as boolean)}
          />
          <span>Set as default address</span>
        </label>

        <div className="form-footer">
          <button type="button" className="btn-cancel" onClick={onCancel}>Cancel</button>
          <button type="submit" className="btn-save" disabled={saving}>
            {saving ? 'Saving…' : isEditing ? 'Update address' : 'Save address'}
            {!saving && <ChevronRight size={15} />}
          </button>
        </div>
      </form>
    </div>
  )
}

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)

  const fetchAddresses = async () => {
    try {
      const response = await fetch('/api/addresses')
      if (response.ok) {
        const data: AddressesResponse = await response.json()
        setAddresses(data.addresses)
      }
    } catch (error) {
      console.error('Error fetching addresses:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAddresses() }, [])

  const handleSave = async (formData: typeof EMPTY_FORM) => {
    const url = editingAddress ? `/api/addresses/${editingAddress.id}` : '/api/addresses'
    const method = editingAddress ? 'PUT' : 'POST'
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    })
    if (response.ok) {
      await fetchAddresses()
      setShowForm(false)
      setEditingAddress(null)
    }
  }

  const handleEdit = (address: Address) => {
    setEditingAddress(address)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    const response = await fetch(`/api/addresses/${id}`, { method: 'DELETE' })
    if (response.ok) fetchAddresses()
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingAddress(null)
  }

  const formInitial = editingAddress
    ? {
        type: editingAddress.type as 'HOME' | 'WORK',
        firstName: editingAddress.firstName,
        lastName: editingAddress.lastName,
        street: editingAddress.street,
        city: editingAddress.city,
        state: editingAddress.state,
        zipCode: editingAddress.zipCode,
        country: editingAddress.country,
        latitude: editingAddress.latitude || null,
        longitude: editingAddress.longitude || null,
        isDefault: editingAddress.isDefault,
      }
    : EMPTY_FORM

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600&family=DM+Sans:wght@300;400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .page-root {
          min-height: 100vh;
          background: #f5f0ea;
          font-family: 'DM Sans', sans-serif;
          padding: 48px 24px 80px;
          color: #1a1612;
        }

        /* ── Header ── */
        .page-header {
          max-width: 840px;
          margin: 0 auto 40px;
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 16px;
          border-bottom: 1.5px solid #d8cfc4;
          padding-bottom: 20px;
        }
        .header-left h1 {
          font-family: 'Playfair Display', serif;
          font-size: 2.4rem;
          font-weight: 500;
          letter-spacing: -0.5px;
          line-height: 1;
          color: #1a1612;
        }
        
        /* ── Location Box ── */
        .location-box {
          background: #f7f3ef;
          border: 1.5px solid #e2d9cc;
          border-radius: 6px;
          padding: 12px;
          margin-bottom: 16px;
        }
        .location-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        .location-label {
          font-size: 0.68rem;
          font-weight: 600;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          color: #7a6f62;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .location-label .text-active { color: #8b7355; }
        .detect-btn {
          background: #1a1612;
          color: #f5f0ea;
          border: none;
          border-radius: 4px;
          padding: 5px 10px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.7rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s;
        }
        .detect-btn:hover { background: #3b2f24; }
        .detect-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .location-status {
          font-size: 0.72rem;
          display: flex;
          align-items: center;
          gap: 5px;
        }
        .location-status.success { color: #5a7a5a; font-weight: 500; }
        .location-status.hint { color: #9c8a76; font-style: italic; }

        .header-left p {
          font-size: 0.82rem;
          color: #7a6f62;
          margin-top: 6px;
          font-weight: 300;
          letter-spacing: 0.3px;
        }
        .add-new-btn {
          display: flex;
          align-items: center;
          gap: 7px;
          background: #1a1612;
          color: #f5f0ea;
          border: none;
          border-radius: 6px;
          padding: 10px 18px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.83rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s, transform 0.1s;
          letter-spacing: 0.3px;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .add-new-btn:hover { background: #3b2f24; transform: translateY(-1px); }
        .add-new-btn.active { background: #5c4a38; }

        /* ── Grid ── */
        .grid {
          max-width: 840px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 16px;
          align-items: start;
        }

        /* ── Address card ── */
        .address-card {
          background: #fffdf9;
          border: 1.5px solid #e2d9cc;
          border-radius: 12px;
          padding: 22px 22px 16px;
          position: relative;
          transition: box-shadow 0.2s, border-color 0.2s;
        }
        .address-card:hover {
          box-shadow: 0 4px 20px rgba(60,40,20,0.08);
          border-color: #c8bfb2;
        }
        .address-card.is-default {
          border-color: #b59a78;
          background: #fffef7;
        }

        .default-ribbon {
          position: absolute;
          top: 14px;
          right: 14px;
          font-size: 0.68rem;
          font-weight: 500;
          letter-spacing: 0.8px;
          text-transform: uppercase;
          background: #f0e6d3;
          color: #7a5c38;
          padding: 3px 8px;
          border-radius: 4px;
        }

        .card-type-row {
          display: flex;
          align-items: center;
          gap: 5px;
          margin-bottom: 10px;
        }
        .card-type-icon { color: #9c8a76; display: flex; }
        .card-type-label {
          font-size: 0.7rem;
          font-weight: 500;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          color: #9c8a76;
        }

        .card-name {
          font-family: 'Playfair Display', serif;
          font-size: 1.08rem;
          font-weight: 500;
          margin-bottom: 8px;
          color: #1a1612;
        }

        .card-address {
          display: flex;
          flex-direction: column;
          gap: 2px;
          font-size: 0.82rem;
          color: #6b5f52;
          font-weight: 300;
          line-height: 1.5;
          margin-bottom: 16px;
          padding-bottom: 14px;
          border-bottom: 1px solid #ece5dc;
        }

        .card-actions {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }
        .card-btn {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 0.75rem;
          font-family: 'DM Sans', sans-serif;
          font-weight: 500;
          border-radius: 5px;
          padding: 5px 10px;
          border: 1px solid transparent;
          cursor: pointer;
          transition: all 0.15s;
        }
        .edit-btn {
          background: transparent;
          border-color: #d0c5b8;
          color: #4a3f34;
        }
        .edit-btn:hover { background: #f0e8de; border-color: #b8a898; }
        .ghost-btn {
          background: transparent;
          color: #9c8a76;
          border-color: transparent;
        }
        .ghost-btn:hover { color: #5c4a38; background: #f0e8de; }
        .danger-btn {
          background: #fdf0ef;
          color: #b04040;
          border-color: #f5c5c0;
        }
        .danger-btn:hover { background: #f9dfdd; }
        .confirm-row { display: flex; align-items: center; gap: 5px; }
        .confirm-text { font-size: 0.75rem; color: #7a6f62; }

        /* ── Empty state ── */
        .empty-state {
          max-width: 840px;
          margin: 0 auto;
          text-align: center;
          padding: 64px 24px;
          background: #fffdf9;
          border: 1.5px dashed #d0c5b8;
          border-radius: 16px;
        }
        .empty-icon {
          width: 52px;
          height: 52px;
          background: #f0e8de;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
          color: #9c8a76;
        }
        .empty-state h3 {
          font-family: 'Playfair Display', serif;
          font-size: 1.4rem;
          font-weight: 500;
          margin-bottom: 8px;
          color: #1a1612;
        }
        .empty-state p {
          font-size: 0.83rem;
          color: #7a6f62;
          font-weight: 300;
          max-width: 300px;
          margin: 0 auto;
          line-height: 1.6;
        }

        /* ── Inline form card ── */
        .form-card {
          background: #fffdf9;
          border: 1.5px solid #b59a78;
          border-radius: 12px;
          padding: 22px;
          grid-column: 1 / -1;
          box-shadow: 0 8px 32px rgba(60,40,20,0.1);
          animation: slideDown 0.2s ease;
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .form-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }
        .form-title {
          font-family: 'Playfair Display', serif;
          font-size: 1.1rem;
          font-weight: 500;
          color: #1a1612;
        }
        .form-close {
          background: none;
          border: none;
          cursor: pointer;
          color: #9c8a76;
          display: flex;
          padding: 4px;
          border-radius: 4px;
          transition: color 0.15s, background 0.15s;
        }
        .form-close:hover { color: #1a1612; background: #f0e8de; }

        /* type toggle */
        .type-toggle {
          display: flex;
          gap: 8px;
          margin-bottom: 18px;
        }
        .type-option {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 7px 16px;
          border: 1.5px solid #d0c5b8;
          border-radius: 6px;
          background: transparent;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.8rem;
          font-weight: 500;
          color: #7a6f62;
          cursor: pointer;
          letter-spacing: 0.5px;
          transition: all 0.15s;
        }
        .type-option.active {
          border-color: #1a1612;
          background: #1a1612;
          color: #f5f0ea;
        }
        .type-option:not(.active):hover {
          border-color: #9c8a76;
          color: #3b2f24;
        }

        /* fields */
        .form-grid { display: grid; gap: 12px; margin-bottom: 12px; }
        .form-grid.two-col { grid-template-columns: 1fr 1fr; }
        .field-group { display: flex; flex-direction: column; gap: 5px; margin-bottom: 12px; }
        .field-label {
          font-size: 0.72rem;
          font-weight: 500;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          color: #7a6f62;
        }
        .field-input {
          background: #f7f3ef;
          border: 1.5px solid #e2d9cc;
          border-radius: 6px;
          padding: 9px 12px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.88rem;
          color: #1a1612;
          outline: none;
          transition: border-color 0.15s, background 0.15s;
          width: 100%;
        }
        .field-input::placeholder { color: #b8a898; }
        .field-input:focus {
          border-color: #9c8a76;
          background: #fffdf9;
        }

        /* default checkbox row */
        .default-check {
          display: flex;
          align-items: center;
          gap: 9px;
          margin: 14px 0 20px;
          cursor: pointer;
          font-size: 0.83rem;
          color: #4a3f34;
          font-weight: 400;
          user-select: none;
        }

        /* form footer */
        .form-footer {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          padding-top: 8px;
          border-top: 1px solid #ece5dc;
        }
        .btn-cancel {
          padding: 9px 18px;
          border: 1.5px solid #d0c5b8;
          border-radius: 6px;
          background: transparent;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.83rem;
          color: #7a6f62;
          cursor: pointer;
          transition: all 0.15s;
        }
        .btn-cancel:hover { border-color: #9c8a76; color: #3b2f24; }
        .btn-save {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 9px 20px;
          border: none;
          border-radius: 6px;
          background: #1a1612;
          color: #f5f0ea;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.83rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s;
        }
        .btn-save:hover { background: #3b2f24; }
        .btn-save:disabled { background: #9c8a76; cursor: not-allowed; }

        /* loading */
        .spinner-wrap {
          min-height: 60vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .spinner {
          width: 32px; height: 32px;
          border: 2px solid #e2d9cc;
          border-top-color: #9c8a76;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        @media (max-width: 540px) {
          .page-header { flex-direction: column; align-items: flex-start; gap: 12px; }
          .form-grid.two-col { grid-template-columns: 1fr; }
          .header-left h1 { font-size: 1.8rem; }
        }
      `}</style>

      <div className="page-root">
        <div className="page-header">
          <div className="header-left">
            <h1>Address Book</h1>
            <p>Manage your delivery locations</p>
          </div>
          {!showForm && (
            <button
              className={`add-new-btn ${showForm ? 'active' : ''}`}
              onClick={() => { setEditingAddress(null); setShowForm(true) }}
            >
              <Plus size={15} />
              New address
            </button>
          )}
        </div>

        {loading ? (
          <div className="spinner-wrap"><div className="spinner" /></div>
        ) : (
          <div className="grid">
            {/* Inline form — appears at top when adding new */}
            {showForm && !editingAddress && (
              <AddressForm
                key="new"
                initial={EMPTY_FORM}
                onSave={handleSave}
                onCancel={handleCancel}
                isEditing={false}
              />
            )}

            {addresses.length === 0 && !showForm ? (
              <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
                <div className="empty-icon"><MapPin size={22} /></div>
                <h3>No saved addresses</h3>
                <p>Add a delivery address to make checkout quicker next time.</p>
              </div>
            ) : (
              addresses.map((address) =>
                showForm && editingAddress?.id === address.id ? (
                  <AddressForm
                    key={`edit-${address.id}`}
                    initial={formInitial}
                    onSave={handleSave}
                    onCancel={handleCancel}
                    isEditing={true}
                  />
                ) : (
                  <AddressCard
                    key={address.id}
                    address={address}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                )
              )
            )}
          </div>
        )}
      </div>
    </>
  )
}