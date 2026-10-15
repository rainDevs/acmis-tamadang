# ACMIS Brand Guidelines (v1 — demo)

Source of truth for voice, visual identity, and messaging in the ACMIS frontend.
Keep this file short; details live in code (`frontend/src/`).

## Voice

- Plain, respectful, reassuring. Short sentences. No medical jargon.
- Address residents directly ("you"), staff collectively ("health center staff").
- Never promise instant approval: a request is **pending until staff confirm**.
- Never invent patient stories, reviews, or statistics.

## Visual identity

- Mood: calm, clean, trustworthy public-health service.
- Palette: cyan tint backgrounds (`#ecfeff` family), health-green primary actions
  (`emerald-600/700`), amber reserved for privacy/urgent notices only.
- Shape: rounded-2xl cards, soft shadows, 4/8px spacing rhythm.
- Type: system/Geist stack (no web-font downloads — residents may be on slow connections).
- Imagery: Lucide vector icons only. No emojis as icons. No stock patient photos.

## Messaging framework

- Headline promise: request from your phone, no account needed.
- Proof points: staff-reviewed requests · status + schedule lookup · private by default.
- Urgent-care notice (always near CTAs): online booking is for routine requests only;
  emergencies go directly to the health center or nearest emergency facility.
- Privacy line: status lookup shows schedule + status only, per Data Privacy Act of 2012.

## Rules

- Minimum touch target 44px; primary CTA in thumb reach (bottom on mobile).
- Every form: labels, required markers, inline errors with `role="alert"`, loading state,
  duplicate-submit guard.
- Animations: opacity/transform only, ≤450ms, `prefers-reduced-motion` respected.
