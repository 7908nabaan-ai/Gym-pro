# Gym-Pro

Gym-Pro is an evidence-aware bodybuilding planning and progress app rebuilt from the original Gym project.

## Included fixes
- Bounded AI request payloads
- Per-client AI rate limiting
- Optional origin allow-listing
- Server-side input validation
- Configurable Gemini model
- Provider errors are not returned verbatim
- Structured AI coaching output
- Muscle-growth ranges instead of guaranteed outcomes
- Progress calibration foundation
- Workout progression foundation
- Calculation regression tests
- LocalStorage persistence for the prototype

## Local development

```bash
cp .env.example .env
npm install
npm run lint
npm test
npm run dev
```

The AI Coach requires `GEMINI_API_KEY` on the server.

## Important

Fitness calculations are planning estimates. Individual response varies, so calories and training recommendations should be calibrated against multi-week weight, waist, and performance trends. The AI coach is educational information, not medical advice.
