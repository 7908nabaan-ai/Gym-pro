import type { ProgressLog } from '../types';

export function analyzeProgress(logs: ProgressLog[]) {
  const sorted = [...logs].sort((a,b) => a.date.localeCompare(b.date));
  if (sorted.length < 3) return { status: 'insufficient-data' as const, weeklyChangeKg: 0, calorieAdjustment: 0 };
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const days = Math.max(1, (Date.parse(last.date) - Date.parse(first.date)) / 86400000);
  const weeklyChangeKg = ((last.weightKg - first.weightKg) / days) * 7;
  const goalSignal = weeklyChangeKg;
  const calorieAdjustment = goalSignal > 0.4 ? -100 : goalSignal < 0.1 ? 100 : 0;
  return { status: 'ready' as const, weeklyChangeKg: Math.round(weeklyChangeKg * 100) / 100, calorieAdjustment };
}
