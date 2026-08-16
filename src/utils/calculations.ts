import type { Metrics, UserProfile } from '../types';

export const KG_TO_LB = 2.20462262;

export function calculateBmr(p: UserProfile): number {
  if (p.bodyFat > 0 && p.bodyFat < 60) {
    const lbm = p.weightKg * (1 - p.bodyFat / 100);
    return Math.round(370 + 21.6 * lbm);
  }
  const sex = p.gender === 'male' ? 5 : -161;
  return Math.round(10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age + sex);
}

export function activityMultiplier(activity: UserProfile['activity']): number {
  return { sedentary: 1.2, light: 1.375, moderate: 1.55, very_active: 1.725 }[activity];
}

export function calculateMetrics(p: UserProfile): Metrics {
  const bmr = calculateBmr(p);
  const tdee = Math.round(bmr * activityMultiplier(p.activity));
  const targetCalories = Math.max(1200, Math.round(tdee + p.calorieAdjustment));
  const lbmKg = p.weightKg * (1 - p.bodyFat / 100);
  const heightM = p.heightCm / 100;
  const ffmi = lbmKg / (heightM * heightM);
  const normalizedFfmi = ffmi + 6.1 * (1.8 - heightM);

  const growthRates: Record<UserProfile['experience'], [number, number]> = {
    novice: [0.75, 1.25],
    intermediate: [0.5, 0.75],
    advanced: [0.25, 0.5],
    elite: [0.1, 0.25],
  };
  const [lowPct, highPct] = growthRates[p.experience];
  const growthLowKg = Math.round(p.weightKg * lowPct / 100 * 100) / 100;
  const growthHighKg = Math.round(p.weightKg * highPct / 100 * 100) / 100;
  const growthTypicalKg = Math.round(((growthLowKg + growthHighKg) / 2) * 100) / 100;

  const proteinFactor = p.goal === 'aggressive_cut' ? 2.2 : p.goal === 'moderate_cut' ? 2.0 : 1.8;
  const proteinG = Math.round(lbmKg * proteinFactor);
  const fatG = Math.max(Math.round(p.weightKg * 0.6), Math.round(targetCalories * 0.22 / 9));
  const carbG = Math.max(0, Math.round((targetCalories - proteinG * 4 - fatG * 9) / 4));

  return { bmr, tdee, targetCalories, proteinG, fatG, carbG, lbmKg, ffmi, normalizedFfmi, growthLowKg, growthTypicalKg, growthHighKg };
}

export function formatKg(value: number, imperial = false): string {
  return imperial ? `${(value * KG_TO_LB).toFixed(1)} lb` : `${value.toFixed(1)} kg`;
}
