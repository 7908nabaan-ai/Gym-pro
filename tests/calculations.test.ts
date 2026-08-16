import assert from 'node:assert/strict';
import { calculateMetrics } from '../src/utils/calculations';
import type { UserProfile } from '../src/types';

const profile: UserProfile = {
  age: 30, gender: 'male', heightCm: 180, weightKg: 80, bodyFat: 15,
  trainingDays: 5, experience: 'intermediate', activity: 'very_active', goal: 'lean_bulk', calorieAdjustment: 250,
};

const m = calculateMetrics(profile);
assert.ok(m.bmr > 1000 && m.bmr < 3000);
assert.ok(m.tdee > m.bmr);
assert.ok(m.proteinG > 100);
assert.ok(m.growthLowKg < m.growthTypicalKg && m.growthTypicalKg < m.growthHighKg);
console.log('Gym-Pro calculations: OK');
