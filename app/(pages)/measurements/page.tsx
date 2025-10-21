'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Ruler, Save, User } from 'lucide-react'

interface Measurement {
  id: string
  bust?: number
  waist?: number
  hips?: number
  shoulder?: number
  armLength?: number
  inseam?: number
  height?: number
  weight?: number
  topSize?: string
  bottomSize?: string
  dressSize?: string
  shoeSize?: string
  bodyType?: string
  stylePreferences?: string[]
  preferredColors?: string[]
  notes?: string
}

interface MeasurementsResponse {
  measurements: Measurement | null
}

export default function MeasurementsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    bust: '',
    waist: '',
    hips: '',
    shoulder: '',
    armLength: '',
    inseam: '',
    height: '',
    weight: '',
    topSize: '',
    bottomSize: '',
    dressSize: '',
    shoeSize: '',
    bodyType: '',
    stylePreferences: [] as string[],
    preferredColors: [] as string[],
    notes: '',
  })

  const fetchMeasurements = async () => {
    try {
      const response = await fetch('/api/measurements')
      if (response.ok) {
        const data: MeasurementsResponse = await response.json()
        if (data.measurements) {
          setFormData({
            bust: data.measurements.bust?.toString() || '',
            waist: data.measurements.waist?.toString() || '',
            hips: data.measurements.hips?.toString() || '',
            shoulder: data.measurements.shoulder?.toString() || '',
            armLength: data.measurements.armLength?.toString() || '',
            inseam: data.measurements.inseam?.toString() || '',
            height: data.measurements.height?.toString() || '',
            weight: data.measurements.weight?.toString() || '',
            topSize: data.measurements.topSize || '',
            bottomSize: data.measurements.bottomSize || '',
            dressSize: data.measurements.dressSize || '',
            shoeSize: data.measurements.shoeSize || '',
            bodyType: data.measurements.bodyType || '',
            stylePreferences: data.measurements.stylePreferences || [],
            preferredColors: data.measurements.preferredColors || [],
            notes: data.measurements.notes || '',
          })
        }
      }
    } catch (error) {
      console.error('Error fetching measurements:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMeasurements()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const dataToSend = {
        ...Object.fromEntries(
          Object.entries(formData).map(([key, value]) => [
            key,
            Array.isArray(value) ? value : value === '' ? undefined : isNaN(Number(value)) ? value : Number(value)
          ])
        ),
      }

      const response = await fetch('/api/measurements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend),
      })

      if (response.ok) {
        fetchMeasurements()
      }
    } catch (error) {
      console.error('Error saving measurements:', error)
    } finally {
      setSaving(false)
    }
  }

  const toggleStylePreference = (preference: string) => {
    setFormData(prev => ({
      ...prev,
      stylePreferences: prev.stylePreferences.includes(preference)
        ? prev.stylePreferences.filter(p => p !== preference)
        : [...prev.stylePreferences, preference]
    }))
  }

  const togglePreferredColor = (color: string) => {
    setFormData(prev => ({
      ...prev,
      preferredColors: prev.preferredColors.includes(color)
        ? prev.preferredColors.filter(c => c !== color)
        : [...prev.preferredColors, color]
    }))
  }

  const styleOptions = [
    'CASUAL', 'FORMAL', 'BOHEMIAN', 'STREETWEAR', 'MINIMALIST',
    'ROMANTIC', 'ATHLETIC', 'VINTAGE', 'PROFESSIONAL', 'ECLECTIC'
  ]

  const colorOptions = [
    'BLACK', 'WHITE', 'GRAY', 'NAVY', 'RED', 'PINK', 'BLUE',
    'GREEN', 'YELLOW', 'PURPLE', 'ORANGE', 'BROWN', 'BEIGE'
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Measurements</h1>
          <p className="text-gray-600">Keep your body measurements up to date for better recommendations</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Body Measurements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Ruler className="w-5 h-5 mr-2" />
                  Body Measurements
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="height">Height (cm)</Label>
                    <Input
                      id="height"
                      type="number"
                      step="0.1"
                      value={formData.height}
                      onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                      placeholder="170.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="weight">Weight (kg)</Label>
                    <Input
                      id="weight"
                      type="number"
                      step="0.1"
                      value={formData.weight}
                      onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                      placeholder="65.5"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="bust">Bust (cm)</Label>
                    <Input
                      id="bust"
                      type="number"
                      step="0.1"
                      value={formData.bust}
                      onChange={(e) => setFormData({ ...formData, bust: e.target.value })}
                      placeholder="90"
                    />
                  </div>
                  <div>
                    <Label htmlFor="waist">Waist (cm)</Label>
                    <Input
                      id="waist"
                      type="number"
                      step="0.1"
                      value={formData.waist}
                      onChange={(e) => setFormData({ ...formData, waist: e.target.value })}
                      placeholder="70"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="hips">Hips (cm)</Label>
                    <Input
                      id="hips"
                      type="number"
                      step="0.1"
                      value={formData.hips}
                      onChange={(e) => setFormData({ ...formData, hips: e.target.value })}
                      placeholder="95"
                    />
                  </div>
                  <div>
                    <Label htmlFor="shoulder">Shoulder (cm)</Label>
                    <Input
                      id="shoulder"
                      type="number"
                      step="0.1"
                      value={formData.shoulder}
                      onChange={(e) => setFormData({ ...formData, shoulder: e.target.value })}
                      placeholder="40"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="armLength">Arm Length (cm)</Label>
                    <Input
                      id="armLength"
                      type="number"
                      step="0.1"
                      value={formData.armLength}
                      onChange={(e) => setFormData({ ...formData, armLength: e.target.value })}
                      placeholder="60"
                    />
                  </div>
                  <div>
                    <Label htmlFor="inseam">Inseam (cm)</Label>
                    <Input
                      id="inseam"
                      type="number"
                      step="0.1"
                      value={formData.inseam}
                      onChange={(e) => setFormData({ ...formData, inseam: e.target.value })}
                      placeholder="75"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Size Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Size Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="bodyType">Body Type</Label>
                  <Select
                    value={formData.bodyType}
                    onValueChange={(value) => setFormData({ ...formData, bodyType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select body type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HOURGLASS">Hourglass</SelectItem>
                      <SelectItem value="PEAR">Pear</SelectItem>
                      <SelectItem value="APPLE">Apple</SelectItem>
                      <SelectItem value="RECTANGLE">Rectangle</SelectItem>
                      <SelectItem value="INVERTED_TRIANGLE">Inverted Triangle</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="topSize">Top Size</Label>
                    <Input
                      id="topSize"
                      value={formData.topSize}
                      onChange={(e) => setFormData({ ...formData, topSize: e.target.value })}
                      placeholder="M"
                    />
                  </div>
                  <div>
                    <Label htmlFor="bottomSize">Bottom Size</Label>
                    <Input
                      id="bottomSize"
                      value={formData.bottomSize}
                      onChange={(e) => setFormData({ ...formData, bottomSize: e.target.value })}
                      placeholder="32"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="dressSize">Dress Size</Label>
                    <Input
                      id="dressSize"
                      value={formData.dressSize}
                      onChange={(e) => setFormData({ ...formData, dressSize: e.target.value })}
                      placeholder="8"
                    />
                  </div>
                  <div>
                    <Label htmlFor="shoeSize">Shoe Size</Label>
                    <Input
                      id="shoeSize"
                      value={formData.shoeSize}
                      onChange={(e) => setFormData({ ...formData, shoeSize: e.target.value })}
                      placeholder="8"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Style Preferences */}
            <Card>
              <CardHeader>
                <CardTitle>Style Preferences</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {styleOptions.map((style) => (
                    <Badge
                      key={style}
                      variant={formData.stylePreferences.includes(style) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleStylePreference(style)}
                    >
                      {style.toLowerCase().replace('_', ' ')}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Preferred Colors */}
            <Card>
              <CardHeader>
                <CardTitle>Preferred Colors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {colorOptions.map((color) => (
                    <Badge
                      key={color}
                      variant={formData.preferredColors.includes(color) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => togglePreferredColor(color)}
                    >
                      {color.toLowerCase()}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Additional Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Any additional notes about your fit preferences, allergies, or special requirements..."
                  rows={4}
                />
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end mt-8">
            <Button type="submit" disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Measurements'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
