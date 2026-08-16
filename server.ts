import express, { type NextFunction, type Request, type Response } from 'express';
import path from 'node:path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();
const app = express();
const PORT = Number(process.env.PORT || 3000);
const AI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const RATE_MAX = Number(process.env.AI_RATE_MAX || 8);
const RATE_WINDOW_MS = Number(process.env.AI_RATE_WINDOW_MS || 60000);
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '').split(',').map(v => v.trim()).filter(Boolean);

app.disable('x-powered-by');
app.use(express.json({ limit: '512kb', strict: true }));

const buckets = new Map<string, { start: number; count: number }>();
function rateLimit(req: Request, res: Response, next: NextFunction) {
  const now = Date.now();
  const key = (req.headers['x-forwarded-for']?.toString().split(',')[0].trim()) || req.ip || 'unknown';
  const bucket = buckets.get(key);
  if (!bucket || now - bucket.start >= RATE_WINDOW_MS) { buckets.set(key, { start: now, count: 1 }); return next(); }
  bucket.count += 1;
  if (bucket.count > RATE_MAX) return res.status(429).json({ status: 'error', error: 'Too many AI requests. Try again shortly.' });
  next();
}
function originGuard(req: Request, res: Response, next: NextFunction) {
  if (ALLOWED_ORIGINS.length && req.headers.origin && !ALLOWED_ORIGINS.includes(req.headers.origin)) return res.status(403).json({ status: 'error', error: 'Origin not allowed.' });
  next();
}
function finite(value: unknown, min: number, max: number): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
}
function validate(body: any): string | null {
  if (!body || typeof body !== 'object') return 'Invalid request body.';
  if (!body.userData || !body.calculationResults) return 'userData and calculationResults are required.';
  const u = body.userData;
  if (!finite(u.age, 13, 100) || !finite(u.heightCm, 100, 250) || !finite(u.currentWeightKg, 30, 350) || !finite(u.bodyFatPercentage, 2, 60) || !finite(u.trainingDaysPerWeek, 0, 7)) return 'One or more profile values are outside supported ranges.';
  if (body.progressLogs !== undefined && (!Array.isArray(body.progressLogs) || body.progressLogs.length > 100)) return 'Too many progress records.';
  if (body.question !== undefined && (typeof body.question !== 'string' || body.question.length > 1000)) return 'Question is invalid or too long.';
  return null;
}
let client: GoogleGenAI | null = null;
function getAi() {
  if (!client) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error('GEMINI_API_KEY is not configured');
    client = new GoogleGenAI({ apiKey: key });
  }
  return client;
}

app.get('/api/health', (_req, res) => res.json({ status: 'ok', model: AI_MODEL }));
app.post('/api/gemini/analyze-progress', rateLimit, originGuard, async (req, res) => {
  const validationError = validate(req.body);
  if (validationError) return res.status(400).json({ status: 'error', error: validationError });
  try {
    const { userData, progressLogs, calculationResults, question } = req.body;
    const prompt = `You are an evidence-aware bodybuilding coach. Treat all calculations as estimates, not diagnoses or precise biological limits. Do not diagnose medical conditions. Distinguish observed data from estimates and uncertainty. Return ONLY JSON with keys summary, assessment, nutrition, training, recommendations, warnings.\n\nPROFILE:\n${JSON.stringify(userData)}\n\nCALCULATIONS:\n${JSON.stringify(calculationResults)}\n\nRECENT LOGS:\n${JSON.stringify((progressLogs || []).slice(-10))}\n\nQUESTION:\n${question || 'Give a concise progress audit.'}`;
    const response = await getAi().models.generateContent({ model: AI_MODEL, contents: prompt });
    const raw = response.text?.trim() || '';
    let analysis: unknown;
    try { analysis = JSON.parse(raw.replace(/^```json\s*/i, '').replace(/\s*```$/i, '')); }
    catch { analysis = { summary: raw, assessment: [], nutrition: [], training: [], recommendations: [], warnings: [] }; }
    return res.json({ status: 'success', analysis });
  } catch (error) {
    console.error('AI provider failure', error);
    return res.status(502).json({ status: 'error', error: 'AI coaching service is temporarily unavailable.' });
  }
});
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  if (err?.type === 'entity.too.large') return res.status(413).json({ status: 'error', error: 'Request is too large.' });
  res.status(500).json({ status: 'error', error: 'Unexpected server error.' });
});

async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    const dist = path.join(process.cwd(), 'dist');
    app.use(express.static(dist));
    app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
  }
  app.listen(PORT, '0.0.0.0', () => console.log(`Gym-Pro server listening on ${PORT}`));
}
start();
