import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Check, Save, Loader2 } from 'lucide-react';
import { getProfile, updateProfile } from '@/services/profile.service';
import type { ExperienceLevel, CurrentStatus } from '@/types/profile';

const EXPERIENCE_LEVEL_OPTIONS: Array<{ value: ExperienceLevel; label: string }> = [
  { value: 'student', label: 'Student' },
  { value: 'intern', label: 'Intern' },
  { value: 'early_career', label: 'Early Career (0–2 yrs)' },
  { value: 'career_switcher', label: 'Career Switcher' },
];

const CURRENT_STATUS_OPTIONS: Array<{ value: CurrentStatus; label: string }> = [
  { value: 'student', label: 'Student' },
  { value: 'fresher', label: 'Fresher' },
  { value: 'working_professional', label: 'Working Professional' },
];

interface SettingsFormState {
  fullName: string;
  targetRole: string;
  experienceLevel: ExperienceLevel;
  currentStatus: CurrentStatus;
}

export function SettingsPage() {
  const [formData, setFormData] = useState<SettingsFormState>({
    fullName: '',
    targetRole: '',
    experienceLevel: 'student',
    currentStatus: 'student',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    async function loadProfile() {
      setIsLoading(true);
      try {
        const res = await getProfile();
        const p = res.profile;
        setFormData({
          fullName: p.fullName ?? '',
          targetRole: p.targetRole ?? '',
          experienceLevel: p.experienceLevel ?? 'student',
          currentStatus: p.currentStatus ?? 'student',
        });
      } catch {
        // If profile doesn't exist yet (new user), keep defaults
      } finally {
        setIsLoading(false);
      }
    }
    void loadProfile();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setSaveStatus('idle');
    setErrorMsg('');
    try {
      await updateProfile({
        fullName: formData.fullName.trim() || null,
        targetRole: formData.targetRole.trim() || null,
        experienceLevel: formData.experienceLevel,
        currentStatus: formData.currentStatus,
      });
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch {
      setSaveStatus('error');
      setErrorMsg('Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }

  const inputClass =
    'w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#6E44FF] disabled:opacity-50';

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#6E44FF] dark:text-purple-400">
            Account Preferences
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight mt-1">
            Settings &amp; Preferences
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage your career targets and profile parameters for AI-powered resume optimization.
          </p>
        </div>

        {saveStatus === 'success' && (
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>Settings saved successfully!</span>
          </div>
        )}

        {saveStatus === 'error' && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 text-rose-800 dark:text-rose-200 text-xs font-bold">
            {errorMsg}
          </div>
        )}

        {isLoading ? (
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-24" />
                <div className="h-9 bg-slate-100 dark:bg-slate-800 rounded-xl w-full" />
              </div>
            ))}
          </div>
        ) : (
          <form
            onSubmit={(e) => void handleSave(e)}
            className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="settings-fullName"
                  className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1"
                >
                  Full Name
                </label>
                <input
                  id="settings-fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="Your full name"
                  className={inputClass}
                  disabled={isSaving}
                />
              </div>

              <div>
                <label
                  htmlFor="settings-targetRole"
                  className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1"
                >
                  Target Role
                </label>
                <input
                  id="settings-targetRole"
                  type="text"
                  value={formData.targetRole}
                  onChange={(e) => setFormData({ ...formData, targetRole: e.target.value })}
                  placeholder="e.g. Full Stack Developer"
                  className={inputClass}
                  disabled={isSaving}
                />
              </div>

              <div>
                <label
                  htmlFor="settings-experienceLevel"
                  className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1"
                >
                  Experience Level
                </label>
                <select
                  id="settings-experienceLevel"
                  value={formData.experienceLevel}
                  onChange={(e) =>
                    setFormData({ ...formData, experienceLevel: e.target.value as ExperienceLevel })
                  }
                  className={inputClass}
                  disabled={isSaving}
                >
                  {EXPERIENCE_LEVEL_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="settings-currentStatus"
                  className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1"
                >
                  Current Status
                </label>
                <select
                  id="settings-currentStatus"
                  value={formData.currentStatus}
                  onChange={(e) =>
                    setFormData({ ...formData, currentStatus: e.target.value as CurrentStatus })
                  }
                  className={inputClass}
                  disabled={isSaving}
                >
                  {CURRENT_STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#6E44FF] hover:bg-purple-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving…</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </DashboardLayout>
  );
}
