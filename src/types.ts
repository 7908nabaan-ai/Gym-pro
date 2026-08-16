export type Goal = 'lean_bulk' | 'maintenance_recomp' | 'moderate_cut' | 'aggressive_cut';
export type Experience = 'novice' | 'intermediate' | 'advanced' | 'elite';

export interface UserProfile {
  age: number;
  gender: 'male' | 'female';
  heightCm: number;
  weightKg: number;
  bodyFat: number;
  trainingDays: number;
  experience: Experience;
  activity: 'sedentary' | 'light' | 'moderate' | 'very_active';
  goal: Goal;
  calorieAdjustment: number;
}

export interface ProgressLog {
  date: string;
  weightKg: number;
  calories?: number;
  waistCm?: number;
  benchKg?: number;
  squatKg?: number;
  deadliftKg?: number;
}

export interface Metrics {
  bmr: number;
  tdee: number;
  targetCalories: number;
  proteinG: number;
  fatG: number;
  carbG: number;
  lbmKg: number;
  ffmi: number;
  normalizedFfmi: number;
  growthLowKg: number;
  growthTypicalKg: number;
  growthHighKg: number;
}
