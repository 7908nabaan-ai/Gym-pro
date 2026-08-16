import { useMemo, useState } from 'react';
import type { ProgressLog, UserProfile } from './types';
import { calculateMetrics, formatKg } from './utils/calculations';

const DEFAULT_PROFILE: UserProfile = {
  age: 30, gender: 'male', heightCm: 180, weightKg: 80, bodyFat: 15,
  trainingDays: 5, experience: 'intermediate', activity: 'very_active', goal: 'lean_bulk', calorieAdjustment: 250,
};

const tabs = ['Dashboard', 'Nutrition', 'Progress', 'Workout', 'AI Coach'] as const;
type Tab = typeof tabs[number];

function App() {
  const [tab, setTab] = useState<Tab>('Dashboard');
  const [imperial, setImperial] = useState(false);
  const [profile, setProfile] = useState<UserProfile>(() => JSON.parse(localStorage.getItem('gym-profile') || 'null') || DEFAULT_PROFILE);
  const [logs, setLogs] = useState<ProgressLog[]>(() => JSON.parse(localStorage.getItem('gym-logs') || '[]'));
  const [question, setQuestion] = useState('');
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const metrics = useMemo(() => calculateMetrics(profile), [profile]);
  const updateProfile = (patch: Partial<UserProfile>) => {
    const next = { ...profile, ...patch };
    setProfile(next); localStorage.setItem('gym-profile', JSON.stringify(next));
  };
  const addLog = () => {
    const next = [{ date: new Date().toISOString().slice(0,10), weightKg: profile.weightKg, calories: metrics.targetCalories }, ...logs].slice(0, 100);
    setLogs(next); localStorage.setItem('gym-logs', JSON.stringify(next));
  };
  const askCoach = async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/gemini/analyze-progress', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userData: profile, progressLogs: logs, calculationResults: metrics, question }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'AI request failed');
      setAnalysis(data.analysis);
    } catch (e) { setError(e instanceof Error ? e.message : 'AI request failed'); }
    finally { setLoading(false); }
  };

  return <div className="min-h-screen bg-zinc-950 text-zinc-100">
    <header className="sticky top-0 z-20 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 py-4 flex flex-wrap items-center justify-between gap-3">
        <div><div className="text-xl font-black text-lime-400">GYM-PRO</div><div className="text-xs text-zinc-500">Evidence-aware hypertrophy planner</div></div>
        <div className="flex gap-1 overflow-auto">{tabs.map(t => <button key={t} onClick={() => setTab(t)} className={`px-3 py-2 rounded-lg text-xs font-bold ${tab===t?'bg-lime-400 text-black':'bg-zinc-900 text-zinc-400'}`}>{t}</button>)}</div>
        <button onClick={() => setImperial(v=>!v)} className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs">{imperial?'Imperial':'Metric'}</button>
      </div>
    </header>

    <main className="mx-auto max-w-6xl px-4 py-6 space-y-6">
      {tab === 'Dashboard' && <>
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[['TDEE', `${metrics.tdee} kcal`], ['Target', `${metrics.targetCalories} kcal`], ['Lean mass', formatKg(metrics.lbmKg, imperial)], ['FFMI', metrics.normalizedFfmi.toFixed(1)]].map(([label,value]) => <div key={label} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4"><div className="text-xs text-zinc-500">{label}</div><div className="mt-2 text-xl font-black">{value}</div></div>)}
        </section>
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 space-y-4">
          <h2 className="font-bold">Profile</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <label className="text-xs">Age<input className="field" type="number" value={profile.age} onChange={e=>updateProfile({age:Number(e.target.value)})}/></label>
            <label className="text-xs">Height cm<input className="field" type="number" value={profile.heightCm} onChange={e=>updateProfile({heightCm:Number(e.target.value)})}/></label>
            <label className="text-xs">Weight kg<input className="field" type="number" step="0.1" value={profile.weightKg} onChange={e=>updateProfile({weightKg:Number(e.target.value)})}/></label>
            <label className="text-xs">Body fat %<input className="field" type="number" step="0.1" value={profile.bodyFat} onChange={e=>updateProfile({bodyFat:Number(e.target.value)})}/></label>
            <label className="text-xs">Training days<input className="field" type="number" min="0" max="7" value={profile.trainingDays} onChange={e=>updateProfile({trainingDays:Number(e.target.value)})}/></label>
            <label className="text-xs">Experience<select className="field" value={profile.experience} onChange={e=>updateProfile({experience:e.target.value as UserProfile['experience']})}><option>novice</option><option>intermediate</option><option>advanced</option><option>elite</option></select></label>
            <label className="text-xs">Activity<select className="field" value={profile.activity} onChange={e=>updateProfile({activity:e.target.value as UserProfile['activity']})}><option value="sedentary">Sedentary</option><option value="light">Light</option><option value="moderate">Moderate</option><option value="very_active">Very active</option></select></label>
            <label className="text-xs">Goal<select className="field" value={profile.goal} onChange={e=>updateProfile({goal:e.target.value as UserProfile['goal']})}><option value="lean_bulk">Lean bulk</option><option value="maintenance_recomp">Recomp</option><option value="moderate_cut">Moderate cut</option><option value="aggressive_cut">Aggressive cut</option></select></label>
          </div>
        </section>
      </>}

      {tab === 'Nutrition' && <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5"><h2 className="text-xl font-black">Nutrition targets</h2><p className="text-sm text-zinc-400 mt-1">Starting estimates; calibrate against 2–4 week trends.</p><div className="grid grid-cols-3 gap-3 mt-5"><div className="card"><b>{metrics.proteinG} g</b><span>Protein</span></div><div className="card"><b>{metrics.carbG} g</b><span>Carbs</span></div><div className="card"><b>{metrics.fatG} g</b><span>Fat</span></div></div></section>}

      {tab === 'Progress' && <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 space-y-4"><div className="flex items-center justify-between"><div><h2 className="text-xl font-black">Progress log</h2><p className="text-sm text-zinc-500">Data stays local in this version.</p></div><button className="btn" onClick={addLog}>Log today</button></div>{logs.length===0?<div className="text-zinc-500 text-sm">No logs yet.</div>:<div className="space-y-2">{logs.map((l,i)=><div key={`${l.date}-${i}`} className="flex justify-between border-b border-zinc-800 py-2 text-sm"><span>{l.date}</span><span>{formatKg(l.weightKg, imperial)}</span><span>{l.calories ?? '—'} kcal</span></div>)}</div>}</section>}

      {tab === 'Workout' && <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 space-y-4"><h2 className="text-xl font-black">Progressive overload</h2><p className="text-sm text-zinc-400">Use double progression: add reps inside the range, then increase load when the top of the range is reached with ≥2 RIR.</p><div className="grid md:grid-cols-3 gap-3">{['Bench press','Squat','Row'].map(ex=><div key={ex} className="rounded-xl bg-zinc-950 border border-zinc-800 p-4"><b>{ex}</b><div className="text-sm text-zinc-500 mt-2">3 × 6–10 @ RIR 2</div><button className="btn mt-3">Log set</button></div>)}</div></section>}

      {tab === 'AI Coach' && <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 space-y-4"><div><h2 className="text-xl font-black">AI Coach</h2><p className="text-sm text-zinc-500">AI responses are educational estimates, not medical advice.</p></div><textarea className="field min-h-28" value={question} onChange={e=>setQuestion(e.target.value)} placeholder="Ask about your calories, growth rate, training or progress..."/><button className="btn" onClick={askCoach} disabled={loading}>{loading?'Analyzing…':'Ask coach'}</button>{error&&<div className="rounded-xl border border-red-900 bg-red-950/40 p-3 text-sm text-red-300">{error}</div>}{analysis&&<div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 space-y-4"><div className="font-semibold text-white">{analysis.summary}</div>{['assessment','nutrition','training','recommendations','warnings'].map(k=><div key={k}>{analysis[k]?.length>0&&<><h3 className="text-lime-400 font-bold uppercase text-xs mb-2">{k}</h3><ul className="space-y-1 text-sm text-zinc-300">{analysis[k].map((x:string,i:number)=><li key={i}>• {x}</li>)}</ul></>}</div>)}</div>}</section>}
    </main>
    <style>{`.field{margin-top:.4rem;width:100%;border-radius:.75rem;border:1px solid #27272a;background:#09090b;padding:.55rem .7rem;color:#f4f4f5}.btn{border-radius:.75rem;background:#a3e635;color:#09090b;padding:.6rem .9rem;font-weight:800;font-size:.8rem}.card{border:1px solid #27272a;background:#09090b;border-radius:.9rem;padding:1rem;display:flex;flex-direction:column;gap:.35rem}.card b{font-size:1.25rem}.card span{font-size:.75rem;color:#71717a}`}</style>
  </div>;
}
export default App;
