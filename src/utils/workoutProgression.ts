export interface SetPerformance { weightKg: number; reps: number; rir: number; }
export interface ProgressionDecision { nextWeightKg: number; targetReps: number; reason: string; }

export function recommendNextLoad(last: SetPerformance, repMin = 6, repMax = 10, incrementKg = 2.5): ProgressionDecision {
  if (last.reps >= repMax && last.rir >= 2) return { nextWeightKg: Number((last.weightKg + incrementKg).toFixed(1)), targetReps: repMin, reason: 'Top of the rep range reached with adequate RIR.' };
  if (last.rir <= 0) return { nextWeightKg: last.weightKg, targetReps: Math.min(repMax, last.reps), reason: 'Hold load while fatigue is high.' };
  return { nextWeightKg: last.weightKg, targetReps: Math.min(repMax, last.reps + 1), reason: 'Add a rep before increasing load.' };
}
