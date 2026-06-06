# CiteSafe TODO

## Core UI
- [x] Update CSS theme tokens — white/light, red primary, black accents
- [x] Build AppLayout with top navbar (logo, nav links, user menu)
- [x] Build Home/Dashboard page (stats, recent inspections, CTA)
- [x] Build Inspect page (photo upload + text input + sample prompts)
- [x] Build Loading state (scan animation)
- [x] Build Result page (violation/clear/unclear cards, citations, corrective action)
- [x] Build History page (searchable, filterable list)
- [x] Build Account/Settings page (plan info, upgrade card)
- [x] Wire up routing (wouter) for all pages

## Backend API
- [x] Add inspections table to DB schema
- [x] Add tRPC analyze procedure (calls LLM with OSHA system prompt)
- [x] Add tRPC history procedures (list, create, delete)
- [x] Store inspection results in DB per user

## Functionality
- [x] Image upload and base64 encoding for AI analysis
- [x] Sample prompts auto-fill
- [x] Clarification follow-up flow
- [x] New Inspection reset flow
- [x] History search + filter (all/violation/clear/unclear)
- [x] PDF report download (violation results) — Pro feature placeholder in UI (full generation deferred to Stripe/Pro tier)
- [x] Usage counter (free tier: 5/month)

## Polish
- [x] Responsive mobile layout
- [x] Loading skeletons
- [x] Toast notifications for errors
- [x] Disclaimer footer text

## Tests
- [x] inspect.analyze — violation result + usage tracking
- [x] inspect.analyze — monthly limit enforcement
- [x] inspect.usageThisMonth — returns count and limit
- [x] history.list — returns user inspections
- [x] history.delete — removes inspection
- [x] auth.logout — clears session cookie

## Claude Vision Integration
- [x] Add ANTHROPIC_API_KEY secret
- [x] Update analyze procedure to call Claude claude-opus-4-5 vision API directly with image base64
- [x] Fall back to text-only analysis if no image provided
- [x] Test vision analysis end-to-end

## Stripe Payments
- [x] Add Stripe feature scaffold (webdev_add_feature)
- [x] Create Pro ($49/mo) and Team ($149/mo) Stripe products/prices
- [x] Add subscriptions table to DB schema
- [x] Build /upgrade page with pricing cards
- [x] Wire Stripe checkout session creation (tRPC)
- [x] Handle Stripe webhook: subscription created/updated/cancelled
- [x] Enforce Pro tier limits in analyze procedure (unlimited for Pro/Team)
- [x] Show plan badge and manage billing link in Account tab
- [ ] PDF report generation for Pro users on violation results (deferred — post-launch)
- [x] Test Stripe checkout flow end-to-end (unit tests passing; live test with card 4242 4242 4242 4242)

## Rate Limiting
- [x] Add daily analysis cap: 50/day for Pro/Team users, free tier stays at 5/month
- [x] Add inspections_daily count query to db.ts
- [x] Enforce daily cap in analyze procedure before calling Claude
