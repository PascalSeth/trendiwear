# Subscription System Implementation Guide

## Overview

TrendiWear now has a comprehensive subscription system for professionals:

- **3-Month Free Trial**: All new professionals get a 3-month free trial with full access
- **Paid Subscription Tiers**: WEEKLY, MONTHLY, and YEARLY billing cycles
- **Access Control**: After trial expires, most dashboard features are restricted to view-only unless they have an active subscription
- **Payment Integration**: Integration with Paystack for secure payments

---

## Database Schema

### New Models

#### 1. **SubscriptionTier**
Defines the subscription plans available to professionals.

`Fields:`
- `id`: Unique identifier
- `name`: Tier name (BASIC, PRO, PREMIUM)
- `description`: Tier description
- `weeklyPrice`, `monthlyPrice`, `yearlyPrice`: Pricing for different cycles
- `features`: Array of feature descriptions
- `storageLimit`: Max storage in MB
- `monthlyListings`: Max products/services allowed
- `analyticsAccess`: Whether tier includes analytics
- `prioritySupport`: Priority customer support
- `featuredBadge`: Display featured badge
- `isActive`: Whether tier is available
- `order`: Display order for sorting

#### 2. **Subscription**
Represents an active subscription for a professional.

`Fields:`
- `id`: Unique identifier
- `professionalId`: Reference to ProfessionalProfile
- `tierId`: Reference to SubscriptionTier
- `billingCycle`: WEEKLY, MONTHLY, or YEARLY
- `status`: ACTIVE, INACTIVE, EXPIRED, CANCELLED, PAUSED
- `currentAmount`: Amount per billing cycle
- `startDate`: When subscription started
- `nextRenewalDate`: When next payment is due
- `cancelledAt`: When cancelled (if applicable)
- `autoRenew`: Auto-renewal enabled/disabled

#### 3. **SubscriptionPayment**
Tracks individual subscription payments.

`Fields:`
- `id`: Unique identifier
- `subscriptionId`: Reference to Subscription
- `professionalId`: Reference to ProfessionalProfile
- `amount`: Payment amount
- `billingCycle`: WEEKLY, MONTHLY, or YEARLY
- `status`: PENDING, PAID, FAILED
- `paystackReference`: Paystack transaction reference
- `paystackChannel`: Payment method (card, mobile_money, etc)
- `paidAt`: When payment was confirmed
- `nextRenewal`: When next renewal is expected

#### 4. **ProfessionalTrial**
Tracks trial periods for professionals.

`Fields:`
- `id`: Unique identifier
- `professionalId`: Reference to ProfessionalProfile
- `startDate`: Trial start date
- `endDate`: Trial end date (start + 3 months)
- `daysRemaining`: Calculated days left
- `completed`: Whether trial period completed
- `dismissedReminder`: Whether professional dismissed trial ending reminder

### Updated Models

#### **ProfessionalProfile**
Linked to trial and subscription models:
- `subscriptionId`: Current active subscription (one-to-one)
- `lastSubscriptionRenew`: Last successful renewal date
- `trial`: One-to-one relation to ProfessionalTrial
- `subscription`: One-to-one relation to Subscription

---

## API Endpoints

### Subscription Tiers

#### `GET /api/subscriptions/tiers`
Fetch all active subscription tiers.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "tier_1",
      "name": "BASIC",
      "weeklyPrice": 5,
      "monthlyPrice": 18,
      "yearlyPrice": 180,
      "features": ["Feature 1", "Feature 2"],
      "analyticsAccess": false,
      ...
    }
  ]
}
```

#### `POST /api/subscriptions/tiers` (ADMIN ONLY)
Create a new subscription tier.

**Request:**
```json
{
  "name": "PRO",
  "weeklyPrice": 10,
  "monthlyPrice": 35,
  "yearlyPrice": 350,
  "analyticsAccess": true
}
```

---

### **3. Legend**
*For the masters and iconic fashion houses in the industry.*
- **Weekly**: GH₵ 120
- **Monthly**: GH₵ 450
- **Yearly**: GH₵ 4,500
- **Included Features**:
    - Everything in Professional
    - **Advanced Market Trends & Analytics**
    - **Top Slot Search Placement**
    - Featured Gallery Backgrounds

---

## Trial Guard (New Restriction)

To prevent the platform from being overwhelmed during the free trial period:

- **Trial Duration**: 3 Months free
- **Product Limit**: Maximum of **8 Product Listings** allowed during the trial.
- **Upgrade Path**: To list more than 8 products, the seller must upgrade to any paid tier (**Chop Life**, **Obaahemaa/Ohene**, or **Legend**).

---

## API Endpoints

### Subscription Tiers

#### `GET /api/subscriptions/tiers`
Fetch all available subscription tiers (Chop Life, Ohene, Legend).

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "tier_1",
      "name": "Chop Life",
      "weeklyPrice": 20,
      "monthlyPrice": 70,
      "yearlyPrice": 700,
      "features": ["Feature 1", "Feature 2"],
      ...
    }
  ]
}
```

---

### Professional Trial

#### `GET /api/subscriptions/trial`
Get current professional's trial status and product count toward the 8-product limit.

**Response:**
```json
{
  "success": true,
  "data": {
    "isOnTrial": true,
    "daysRemaining": 87,
    "productCount": 3,
    "productLimit": 8,
    "isLimitReached": false,
    "trialEndDate": "2024-06-16T00:00:00Z"
  }
}
```

#### `POST /api/subscriptions/trial/setup`
Initialize trial for a new professional (called during registration).

**Request:**
```json
{
  "professionalId": "prof_123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Trial initialized successfully",
  "data": {
    "trialStartDate": "2024-03-17T00:00:00Z",
    "trialEndDate": "2024-06-16T00:00:00Z",
    "daysRemaining": 90
  }
}
```

---

### Subscription Management

#### `GET /api/subscriptions/manage`
Get professional's current subscription.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "sub_123",
    "status": "ACTIVE",
    "billingCycle": "MONTHLY",
    "currentAmount": 35,
    "nextRenewalDate": "2024-04-17T00:00:00Z",
    "tier": { ...tierData }
  }
}
```

#### `POST /api/subscriptions/manage`
Create or upgrade professional's subscription.

**Request:**
```json
{
  "tierId": "tier_2",
  "billingCycle": "MONTHLY"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Subscription created successfully",
  "data": { ...subscriptionData }
}
```

#### `DELETE /api/subscriptions/manage`
Cancel professional's subscription.

**Request:**
```json
{
  "reason": "Too expensive"
}
```

---

### Subscription Payment

#### `POST /api/subscriptions/pay`
Initialize subscription payment via Paystack.

**Request:**
```json
{
  "tierId": "tier_2",
  "billingCycle": "MONTHLY",
  "callbackUrl": "http://localhost:3000/dashboard/subscription/payment-complete"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "authorizationUrl": "https://checkout.paystack.com/...",
    "accessCode": "acc_1234567890",
    "reference": "SUB-prof_123-1711000000"
  }
}
```

#### `GET /api/subscriptions/verify?reference=SUB_REFERENCE`
Verify subscription payment and activate subscription.

**Response:**
```json
{
  "success": true,
  "message": "Subscription activated successfully",
  "data": {
    "subscriptionId": "sub_123",
    "status": "PAID",
    "nextRenewalDate": "2024-04-17T00:00:00Z"
  }
}
```

---

## UI Components

### 1. **SubscriptionTiers**
Displays all available subscription plans in a card grid.

```tsx
import { SubscriptionTiers } from '@/components/subscription/SubscriptionTiers'

<SubscriptionTiers
  currentSubscriptionId="sub_123"
  onSelectTier={(tierId, billingCycle) => {
    // Handle tier selection
  }}
  loading={false}
/>
```

### 2. **TrialWarning**
Shows countdown warning when trial is expiring.

```tsx
import { TrialWarning } from '@/components/subscription/TrialWarning'

<TrialWarning daysRemaining={7} />
```

### 3. **CurrentSubscriptionStatus**
Displays current subscription details and renewal information.

```tsx
import { CurrentSubscriptionStatus } from '@/components/subscription/CurrentSubscriptionStatus'

<CurrentSubscriptionStatus />
```

### 4. **RestrictedAccessWarning**
Shows when professional has no active subscription/trial.

```tsx
import { RestrictedAccessWarning } from '@/components/subscription/RestrictedAccessWarning'

<RestrictedAccessWarning
  features={[
    'Add new products',
    'Create services',
    'View analytics'
  ]}
/>
```

---

## Utility Functions

### `lib/subscription.ts`

#### `canAccessDashboardFeatures(professionalId: string): Promise<boolean>`
Check if professional can access full dashboard features.

```tsx
const canAccess = await canAccessDashboardFeatures(professionalId)
```

#### `getProfessionalAccessTier(professionalId: string): Promise<AccessTier>`
Get detailed access permissions for a professional.

```tsx
const access = await getProfessionalAccessTier(professionalId)
// Returns: { canView, canAddProducts, canAddServices, canEditProfile, canViewAnalytics, accessLevel, reason }
```

#### `isTrialExpiringSoon(professionalId: string): Promise<boolean>`
Check if professional's trial expires within 7 days.

```tsx
const expiringSoon = await isTrialExpiringSoon(professionalId)
```

#### `getSubscriptionRenewalInfo(professionalId: string)`
Get subscription renewal information.

```tsx
const renewalInfo = await getSubscriptionRenewalInfo(professionalId)
// Returns: { subscriptionId, tierId, tierName, billingCycle, currentAmount, nextRenewalDate, daysUntilRenewal, autoRenew, status }
```

---

## Dashboard Integration

### Adding Trial Initialization to Professional Registration

In the professional registration flow:

```tsx
// After creating professional profile
const trialResponse = await fetch('/api/subscriptions/trial/setup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ professionalId: newProfile.id })
})
```

### Adding Access Control to Dashboard Pages

Wrap dashboard pages with access checking:

```tsx
'use client'

import { useEffect, useState } from 'react'
import { getProfessionalAccessTier } from '@/lib/subscription'
import { RestrictedAccessWarning } from '@/components/subscription/RestrictedAccessWarning'

export default function DashboardPage() {
  const [accessTier, setAccessTier] = useState(null)

  useEffect(() => {
    const checkAccess = async () => {
      const tier = await getProfessionalAccessTier(professionalId)
      setAccessTier(tier)
    }
    checkAccess()
  }, [])

  if (!accessTier?.canAddProducts) {
    return <RestrictedAccessWarning features={['Add products', 'Add services']} />
  }

  return (
    // Dashboard content
  )
}
```

### Adding Trial Warning to Dashboard

```tsx
import { TrialWarning } from '@/components/subscription/TrialWarning'
import { isTrialExpiringSoon, calculateTrialDaysRemaining } from '@/lib/subscription'

export default function DashboardLayout({ children }) {
  const [daysRemaining, setDaysRemaining] = useState(0)

  useEffect(() => {
    const checkTrial = async () => {
      const profile = await fetch('/api/subscriptions/trial').then(r => r.json())
      if (profile.data?.daysRemaining) {
        setDaysRemaining(profile.data.daysRemaining)
      }
    }
    checkTrial()
  }, [])

  return (
    <>
      {daysRemaining > 0 && daysRemaining <= 30 && (
        <TrialWarning daysRemaining={daysRemaining} />
      )}
      {children}
    </>
  )
}
```

---

## Subscription Dashboard Pages

### Main Subscription Page
- **Path:** `/dashboard/subscription`
- **Shows:** Available subscription plans
- **Features:** Plan comparison, billing cycle selector, Paystack integration

### Current Subscription Page
- **Path:** `/dashboard/subscription/current`
- **Shows:** Current subscription details, renewal date, features included

### Payment Completion Page
- **Path:** `/dashboard/subscription/payment-complete`
- **Shows:** Payment status, next steps

---

## Admin Commands to Initialize Subscription Tiers

Create default subscription tiers in the database:

```tsx
// Run this in a database seed script or API endpoint

await prisma.subscriptionTier.createMany({
  data: [
    {
      name: 'BASIC',
      description: 'Perfect for getting started',
      weeklyPrice: 5,
      monthlyPrice: 18,
      yearlyPrice: 180,
      features: [
        'Up to 10 products/services',
        '500MB storage',
        'Basic support'
      ],
      storageLimit: 500,
      monthlyListings: 10,
      analyticsAccess: false,
      prioritySupport: false,
      featuredBadge: false,
      order: 1,
    },
    {
      name: 'PRO',
      description: 'Great for growing businesses',
      weeklyPrice: 10,
      monthlyPrice: 35,
      yearlyPrice: 350,
      features: [
        'Up to 50 products/services',
        '5GB storage',
        'Advanced analytics',
        'Priority support'
      ],
      storageLimit: 5000,
      monthlyListings: 50,
      analyticsAccess: true,
      prioritySupport: true,
      featuredBadge: true,
      order: 2,
    },
    {
      name: 'PREMIUM',
      description: 'For established brands',
      weeklyPrice: 20,
      monthlyPrice: 70,
      yearlyPrice: 700,
      features: [
        'Unlimited products/services',
        '50GB storage',
        'Full analytics',
        'Dedicated support',
        'Custom branding'
      ],
      storageLimit: 50000,
      monthlyListings: 1000,
      analyticsAccess: true,
      prioritySupport: true,
      featuredBadge: true,
      order: 3,
    },
  ],
})
```

---

## Security Considerations

1. **Trial Verification**: Always verify trial dates on the backend
2. **Subscription Access Control**: Check subscription status for all restricted actions
3. **Payment Verification**: Verify all Paystack payments before activating subscriptions
4. **Rate Limiting**: Implement rate limiting on subscription payment endpoints
5. **Audit Logging**: Log all subscription changes and payments

---

## Testing Checklist

- [ ] Trial initialization works for new professionals
- [ ] Trial warning appears at correct times (7 days, 1 day before expiry)
- [ ] Can view subscription plans
- [ ] Can select a plan and initiate payment
- [ ] Payment verification works
- [ ] Subscription is activated after successful payment
- [ ] Dashboard features are restricted after trial expiry
- [ ] Can cancel subscription
- [ ] Renewal date calculations are correct
- [ ] Email notifications sent for trial expiry and renewal

---

## Next Steps

1. Set up default subscription tiers
2. Add trial initialization to professional registration
3. Add access control to existing dashboard routes
4. Add trial warning to dashboard layout
5. Test payment flow with Paystack
6. Set up renewal job (cron) for automatic renewal
7. Add email notifications for trial expiry and upcoming renewals
8. Add admin dashboard to manage subscriptions
