# Subscription System - Integration Checklist

## What Has Been Implemented ✅

### 1. Database Models
- ✅ `SubscriptionTier` - Define subscription plans
- ✅ `Subscription` - Track active subscriptions  
- ✅ `SubscriptionPayment` - Track payments
- ✅ `ProfessionalTrial` - Track trial periods
- ✅ `ProfessionalProfile` - Updated with subscription fields

### 2. API Endpoints
- ✅ `GET /api/subscriptions/tiers` - List all tiers
- ✅ `POST /api/subscriptions/tiers` - Create tier (admin)
- ✅ `GET /api/subscriptions/trial` - Get trial status
- ✅ `POST /api/subscriptions/trial/setup` - Initialize trial
- ✅ `GET /api/subscriptions/manage` - Get current subscription
- ✅ `POST /api/subscriptions/manage` - Create/upgrade subscription
- ✅ `DELETE /api/subscriptions/manage` - Cancel subscription
- ✅ `POST /api/subscriptions/pay` - Initialize Paystack payment
- ✅ `GET /api/subscriptions/verify` - Verify & activate subscription

### 3. UI Components
- ✅ `SubscriptionTiers` - Display plans with comparison
- ✅ `TrialWarning` - Show countdown when expiring
- ✅ `CurrentSubscriptionStatus` - Show active subscription
- ✅ `RestrictedAccessWarning` - Show restrictions when expired

### 4. Utility Functions
- ✅ `canAccessDashboardFeatures()` - Check if can access
- ✅ `getProfessionalAccessTier()` - Get detailed permissions
- ✅ `isTrialExpiringSoon()` - Check 7-day window
- ✅ `getSubscriptionRenewalInfo()` - Get renewal details

### 5. Pages
- ✅ `/dashboard/subscription` - Main subscription page
- ✅ `/dashboard/subscription/current` - Current subscription view
- ✅ `/dashboard/subscription/payment-complete` - Payment callback

---

## What You Need to Do 🎯

### Step 1: Initialize Default Subscription Tiers
Create an API endpoint or database seed to add the 3 default tiers (BASIC, PRO, PREMIUM).

**Location to add:** Create a seed file or an admin endpoint that calls the tier creation.

```tsx
// Your existing files that need updating:
// - app/api/subscriptions/tiers/route.ts (POST endpoint ready to use)
```

### Step 2: Update Professional Registration
When a new professional completes registration, initialize their trial.

**File to update:** `app/(pages)/register-as-professional/page.tsx`

**Add after creating professional profile:**
```tsx
// Initialize trial for new professional
await fetch('/api/subscriptions/trial/setup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ professionalId: createdProfile.id })
})
```

### Step 3: Add Trial Warning to Dashboard
Show countdown when professional is on trial.

**File to update:** `app/dashboard/layout.tsx` or `app/dashboard/components/ServerDashboardShell.tsx`

**Add:**
```tsx
'use client'
import { TrialWarning } from '@/components/subscription/TrialWarning'
import { useEffect, useState } from 'react'

// In your dashboard layout, add:
const [daysRemaining, setDaysRemaining] = useState(0)

useEffect(() => {
  const checkTrial = async () => {
    const res = await fetch('/api/subscriptions/trial')
    const { data } = await res.json()
    setDaysRemaining(data?.daysRemaining || 0)
  }
  checkTrial()
}, [])

// Render before main dashboard content:
{daysRemaining > 0 && daysRemaining <= 30 && (
  <TrialWarning daysRemaining={daysRemaining} />
)}
```

### Step 4: Add Access Control to Dashboard Routes
Restrict features when trial expires or no subscription.

**Files to update:**
- `app/dashboard/(pages)/catalogue/products/page.tsx` - Add product
- `app/dashboard/(pages)/services/page.tsx` - Add services
- `app/dashboard/(pages)/analytics/page.tsx` - View analytics

**Add to each:**
```tsx
'use client'
import { getProfessionalAccessTier } from '@/lib/subscription'
import { RestrictedAccessWarning } from '@/components/subscription/RestrictedAccessWarning'
import { useEffect, useState } from 'react'

export default function Page() {
  const [canAccess, setCanAccess] = useState(true)

  useEffect(() => {
    const checkAccess = async () => {
      const tier = await getProfessionalAccessTier(professionalId)
      setCanAccess(tier.canAddProducts) // or appropriate permission
    }
    checkAccess()
  }, [])

  if (!canAccess) {
    return <RestrictedAccessWarning features={['Add products', 'Edit settings']} />
  }

  return (
    // Your existing page content
  )
}
```

### Step 5: Update Product/Service Creation APIs
Add permission checks to prevent unauthorized use.

**Files to update:**
- `app/api/products/route.ts`
- `app/api/services/route.ts`

**Add to POST endpoints:**
```tsx
import { checkSubscriptionForAction } from '@/lib/subscription-middleware'

export async function POST(request: NextRequest) {
  const user = await requireAuth(request)
  
  // Check if user can add products
  const permission = await checkSubscriptionForAction(request, 'ADD_PRODUCT')
  if (!permission.allowed) {
    return NextResponse.json({ error: permission.message }, { status: permission.status })
  }

  // Continue with creation...
}
```

### Step 6: Add Admin Dashboard to Manage Subscriptions (Optional)
Create admin pages to view and manage professional subscriptions.

**Suggested path:** `/dashboard/admin/subscriptions`

---

## Testing the System

### Test Trial Period
1. Register as a new professional
2. Verify trial starts automatically (3 months)
3. Check `/dashboard/subscription` shows trial status
4. Verify trial warning appears

### Test Subscription Purchase
1. Go to `/dashboard/subscription`
2. Select a plan (MONTHLY recommended for testing)
3. Click "Subscribe Now"
4. Complete Paystack payment (use test cards)
5. Verify redirected to payment completion page
6. Check subscription is active

### Test Access Restrictions
1. Cancel subscription or wait for trial to expire
2. Try to add a product
3. Verify restricted access warning appears
4. Verify view-only mode for dashboard

---

## Environment Variables (Verify These Are Set)

These should already be in your `.env` file:

```
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_xxxxx
PAYSTACK_SECRET_KEY=sk_test_xxxxx
NEXT_PUBLIC_APP_URL=http://localhost:3000
DATABASE_URL=your_db_url
```

---

## Files Created/Updated

### New Files Created:
```
✅ lib/subscription.ts - Utility functions
✅ lib/subscription-middleware.ts - Access control middleware
✅ app/api/subscriptions/tiers/route.ts
✅ app/api/subscriptions/trial/route.ts
✅ app/api/subscriptions/manage/route.ts
✅ app/api/subscriptions/pay/route.ts
✅ app/api/subscriptions/verify/route.ts
✅ components/subscription/SubscriptionTiers.tsx
✅ components/subscription/TrialWarning.tsx
✅ components/subscription/CurrentSubscriptionStatus.tsx
✅ components/subscription/RestrictedAccessWarning.tsx
✅ app/dashboard/(pages)/subscription/page.tsx
✅ app/dashboard/(pages)/subscription/current/page.tsx
✅ app/dashboard/(pages)/subscription/payment-complete/page.tsx
✅ SUBSCRIPTION_SYSTEM.md - Full documentation
✅ INTEGRATION_CHECKLIST.md - This file
```

### Schema Changes:
```
✅ prisma/schema.prisma
  - Added SubscriptionTier model
  - Added Subscription model
  - Added SubscriptionPayment model
  - Added ProfessionalTrial model
  - Updated ProfessionalProfile with subscription fields
  - Added SubscriptionBillingCycle enum
  - Added SubscriptionStatus enum
```

### Database:
```
✅ Migration applied: add_subscription_system
```

---

## Support & Troubleshooting

### Common Issues

**Q: Trial doesn't show in API response**
A: Make sure trial is initialized in `/api/subscriptions/trial/setup` after professional registration

**Q: Payment not verifying**
A: Ensure Paystack credentials are correct in `.env`

**Q: Components showing TypeScript errors**
A: Run `npm install` to ensure all types are available

**Q: Dashboard routes still accessible after trial?**
A: Add access control checks (Step 4 above) to those specific routes

---

## Next Phase Features (Optional)

1. **Automatic Renewal** - Cron job to auto-charge expiring subscriptions
2. **Email Notifications** - Trial expiry warnings, receipt emails
3. **Usage-Based Limits** - Enforce monthly listing limits
4. **Subscription Analytics** - Track MRR, churn, upgrades
5. **Discount Codes** - Admin ability to create coupon codes
6. **Custom Invoices** - Generate PDF invoices for payments
7. **Team Seats** - Allow multiple users on same subscription

---

## Ready to Test? 🚀

Once you complete the integration steps above, your system will have:

✅ Free 3-month trial for all new professionals
✅ Paid subscription plans (Weekly, Monthly, Yearly)
✅ Access control preventing unpaid professionals from using most features
✅ Paystack payment integration
✅ Professional trial countdown warnings
✅ Beautiful subscription management UI

Start with **Step 1** (initialize tiers) and work through in order!
