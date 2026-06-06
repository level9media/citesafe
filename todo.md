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
- [ ] PDF report download (violation results) — Pro feature
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
