import React, { useState, useEffect, useCallback } from 'react';
import {
  User,
  FileText,
  Tag,
  Briefcase,
  GraduationCap,
  FolderGit2,
  Award,
  Sparkles,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Check,
  X,
  AlertTriangle,
  Info,
  Clock,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FormMessage } from '@/components/ui/form-message';
import { ApiClientError } from '@/lib/api/client';
import { createResumeVersion, type ResumeVersion } from '../api/resume-version.api';
import type {
  StructuredResume,
  OptimizedSection,
  ResumeVersionSource,
  ResumeSection,
  StructuredResumeData,
  JobMatchAnalysis,
} from '../types/resume';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ResumeEditorProps {
  resumeId: string;
  initialResume: StructuredResume;
  currentVersionNumber?: number;
  currentVersionTitle?: string;
  currentVersionSource?: ResumeVersionSource;
  currentScore?: number | null;
  jobMatchAnalysis?: JobMatchAnalysis | null;
  jobAnalysisId?: string | null;
  aiSuggestions?: OptimizedSection[];
  onAiSuggestionsChange?: (suggestions: OptimizedSection[]) => void;
  onVersionSaved?: (newVersion: ResumeVersion) => void;
  onDiscardChanges?: () => void;
  isDirty?: boolean;
  onDirtyChange?: (isDirty: boolean) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function deepCloneResume(resume: StructuredResume): StructuredResume {
  return JSON.parse(JSON.stringify(resume));
}

function buildStructuredDataFromDraft(draft: StructuredResume): StructuredResumeData {
  const sections: ResumeSection[] = [];

  if (draft.summary) {
    sections.push({ key: 'summary', title: 'Professional Summary', content: draft.summary });
  }

  if (draft.skills && draft.skills.length > 0) {
    sections.push({ key: 'skills', title: 'Skills', content: draft.skills.join(', ') });
  }

  if (draft.experience && draft.experience.length > 0) {
    const expText = draft.experience
      .map((e) => `${e.title ?? ''} at ${e.company ?? ''}: ${e.description ?? ''}`)
      .join('\n\n');
    sections.push({ key: 'experience', title: 'Experience', content: expText });
  }

  if (draft.education && draft.education.length > 0) {
    const eduText = draft.education
      .map((ed) => `${ed.degree ?? ''} in ${ed.field ?? ''} from ${ed.institution ?? ''}`)
      .join('\n\n');
    sections.push({ key: 'education', title: 'Education', content: eduText });
  }

  if (draft.projects && draft.projects.length > 0) {
    const projText = draft.projects
      .map((p) => `${p.name ?? ''}: ${p.description ?? ''}`)
      .join('\n\n');
    sections.push({ key: 'projects', title: 'Projects', content: projText });
  }

  if (draft.certifications && draft.certifications.length > 0) {
    const certText = draft.certifications
      .map((c) => `${c.name ?? ''} by ${c.issuer ?? ''}`)
      .join('\n');
    sections.push({ key: 'certifications', title: 'Certifications', content: certText });
  }

  return {
    sections,
    skills: draft.skills ?? [],
    structuredResume: draft,
  };
}

export function ResumeEditor({
  resumeId,
  initialResume,
  currentVersionNumber = 1,
  currentVersionTitle = 'Original Upload',
  currentVersionSource = 'ORIGINAL',
  currentScore = null,
  aiSuggestions = [],
  onAiSuggestionsChange,
  onVersionSaved,
  onDiscardChanges,
  onDirtyChange,
}: ResumeEditorProps) {
  const [draft, setDraft] = useState<StructuredResume>(() => deepCloneResume(initialResume));
  const [savedBaseline, setSavedBaseline] = useState<StructuredResume>(() => deepCloneResume(initialResume));
  const [isDirty, setIsDirty] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'personal' | 'summary' | 'skills' | 'experience' | 'projects' | 'education' | 'certifications' | 'achievements'
  >('summary');

  // Suggestion tracking
  const [suggestions, setSuggestions] = useState<OptimizedSection[]>(aiSuggestions);
  const [conflictedSections, setConflictedSections] = useState<Set<string>>(new Set());

  // Save Modal state
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [versionTitle, setVersionTitle] = useState('');
  const [changesSummary, setChangesSummary] = useState('');
  const [saveSource, setSaveSource] = useState<ResumeVersionSource>('MANUAL_EDIT');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // New Skill Input state
  const [newSkillInput, setNewSkillInput] = useState('');

  // Update suggestions when prop changes
  useEffect(() => {
    if (aiSuggestions.length > 0) {
      setSuggestions(aiSuggestions);
    }
  }, [aiSuggestions]);

  // Sync baseline when initialResume changes externally (e.g. switching resumes or restoring)
  useEffect(() => {
    const cloned = deepCloneResume(initialResume);
    setDraft(cloned);
    setSavedBaseline(cloned);
    setIsDirty(false);
    onDirtyChange?.(false);
    setConflictedSections(new Set());
  }, [initialResume, onDirtyChange]);

  // Warn on page unload if there are unsaved changes
  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes in your resume draft.';
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const markDirty = useCallback(() => {
    setIsDirty(true);
    onDirtyChange?.(true);
  }, [onDirtyChange]);

  // ---------------------------------------------------------------------------
  // AI Suggestion Accept / Reject Handlers
  // ---------------------------------------------------------------------------

  function handleAcceptSuggestion(suggestionId: string) {
    const updated = suggestions.map((s) => {
      const id = s.id ?? s.key;
      if (id === suggestionId) {
        return { ...s, status: 'ACCEPTED' as const };
      }
      return s;
    });
    setSuggestions(updated);
    onAiSuggestionsChange?.(updated);

    const target = suggestions.find((s) => (s.id ?? s.key) === suggestionId);
    if (!target) return;

    // Apply to draft based on section key
    setDraft((prev) => {
      const next = deepCloneResume(prev);
      const text = target.suggestedContent ?? target.improved;

      if (target.key === 'summary') {
        next.summary = text;
      } else if (target.key === 'skills') {
        const skillsList = text.split(/[,;\n]+/).map((s) => s.trim()).filter(Boolean);
        if (skillsList.length > 0) {
          next.skills = Array.from(new Set([...next.skills, ...skillsList]));
        }
      }
      return next;
    });

    // Remove conflict if any
    setConflictedSections((prev) => {
      const next = new Set(prev);
      next.delete(target.key);
      return next;
    });

    markDirty();
  }

  function handleRejectSuggestion(suggestionId: string) {
    const updated = suggestions.map((s) => {
      const id = s.id ?? s.key;
      if (id === suggestionId) {
        return { ...s, status: 'REJECTED' as const };
      }
      return s;
    });
    setSuggestions(updated);
    onAiSuggestionsChange?.(updated);

    // If it was previously accepted, revert that section back to baseline
    const target = suggestions.find((s) => (s.id ?? s.key) === suggestionId);
    if (target && target.status === 'ACCEPTED') {
      setDraft((prev) => {
        const next = deepCloneResume(prev);
        if (target.key === 'summary') {
          next.summary = savedBaseline.summary;
        } else if (target.key === 'skills') {
          next.skills = savedBaseline.skills;
        }
        return next;
      });
      markDirty();
    }
  }

  function handleAcceptAllSuggestions() {
    const nextDraft = deepCloneResume(draft);
    const updated = suggestions.map((s) => {
      const text = s.suggestedContent ?? s.improved;
      if (s.key === 'summary') {
        nextDraft.summary = text;
      } else if (s.key === 'skills') {
        const skillsList = text.split(/[,;\n]+/).map((str) => str.trim()).filter(Boolean);
        if (skillsList.length > 0) {
          nextDraft.skills = Array.from(new Set([...nextDraft.skills, ...skillsList]));
        }
      }
      return { ...s, status: 'ACCEPTED' as const };
    });

    setSuggestions(updated);
    onAiSuggestionsChange?.(updated);
    setDraft(nextDraft);
    setConflictedSections(new Set());
    markDirty();
  }

  function handleRejectAllSuggestions() {
    const updated = suggestions.map((s) => ({ ...s, status: 'REJECTED' as const }));
    setSuggestions(updated);
    onAiSuggestionsChange?.(updated);
  }

  // ---------------------------------------------------------------------------
  // Manual Edit Change Handlers
  // ---------------------------------------------------------------------------

  function handleManualSectionEdit(sectionKey: string) {
    // Check if there is an active suggestion for this section
    const hasSuggestion = suggestions.some((s) => s.key === sectionKey);
    if (hasSuggestion) {
      setConflictedSections((prev) => new Set(prev).add(sectionKey));
    }
    markDirty();
  }

  // ---------------------------------------------------------------------------
  // Section: Personal Info
  // ---------------------------------------------------------------------------
  function updatePersonal(field: keyof StructuredResume['personal'], value: string) {
    setDraft((prev) => ({
      ...prev,
      personal: { ...prev.personal, [field]: value },
    }));
    handleManualSectionEdit('personal');
  }

  // ---------------------------------------------------------------------------
  // Section: Summary
  // ---------------------------------------------------------------------------
  function updateSummary(value: string) {
    setDraft((prev) => ({ ...prev, summary: value }));
    handleManualSectionEdit('summary');
  }

  // ---------------------------------------------------------------------------
  // Section: Skills
  // ---------------------------------------------------------------------------
  function addSkill(skill: string) {
    const trimmed = skill.trim();
    if (!trimmed) return;
    if (draft.skills.some((s) => s.toLowerCase() === trimmed.toLowerCase())) return;

    setDraft((prev) => ({
      ...prev,
      skills: [...prev.skills, trimmed],
    }));
    setNewSkillInput('');
    handleManualSectionEdit('skills');
  }

  function removeSkill(skillToRemove: string) {
    setDraft((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skillToRemove),
    }));
    handleManualSectionEdit('skills');
  }

  // ---------------------------------------------------------------------------
  // Section: Experience Items
  // ---------------------------------------------------------------------------
  function addExperienceItem() {
    setDraft((prev) => ({
      ...prev,
      experience: [
        ...prev.experience,
        {
          title: 'Software Engineer',
          company: 'Company Name',
          startDate: '2023',
          endDate: 'Present',
          description: 'Key achievements and responsibilities...',
        },
      ],
    }));
    handleManualSectionEdit('experience');
  }

  function updateExperienceItem(index: number, field: string, value: string) {
    setDraft((prev) => {
      const nextExp = [...prev.experience];
      nextExp[index] = { ...nextExp[index], [field]: value };
      return { ...prev, experience: nextExp };
    });
    handleManualSectionEdit('experience');
  }

  function deleteExperienceItem(index: number) {
    setDraft((prev) => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== index),
    }));
    handleManualSectionEdit('experience');
  }

  function moveExperienceItem(index: number, direction: 'up' | 'down') {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= draft.experience.length) return;

    setDraft((prev) => {
      const nextExp = [...prev.experience];
      const temp = nextExp[index];
      nextExp[index] = nextExp[targetIndex];
      nextExp[targetIndex] = temp;
      return { ...prev, experience: nextExp };
    });
    handleManualSectionEdit('experience');
  }

  // ---------------------------------------------------------------------------
  // Section: Project Items
  // ---------------------------------------------------------------------------
  function addProjectItem() {
    setDraft((prev) => ({
      ...prev,
      projects: [
        ...prev.projects,
        {
          name: 'New Project',
          description: 'Project description and measurable outcomes...',
          technologies: ['React', 'Node.js'],
        },
      ],
    }));
    handleManualSectionEdit('projects');
  }

  function updateProjectItem(index: number, field: string, value: unknown) {
    setDraft((prev) => {
      const nextProj = [...prev.projects];
      nextProj[index] = { ...nextProj[index], [field]: value };
      return { ...prev, projects: nextProj };
    });
    handleManualSectionEdit('projects');
  }

  function deleteProjectItem(index: number) {
    setDraft((prev) => ({
      ...prev,
      projects: prev.projects.filter((_, i) => i !== index),
    }));
    handleManualSectionEdit('projects');
  }

  function moveProjectItem(index: number, direction: 'up' | 'down') {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= draft.projects.length) return;

    setDraft((prev) => {
      const nextProj = [...prev.projects];
      const temp = nextProj[index];
      nextProj[index] = nextProj[targetIndex];
      nextProj[targetIndex] = temp;
      return { ...prev, projects: nextProj };
    });
    handleManualSectionEdit('projects');
  }

  // ---------------------------------------------------------------------------
  // Section: Education Items
  // ---------------------------------------------------------------------------
  function addEducationItem() {
    setDraft((prev) => ({
      ...prev,
      education: [
        ...prev.education,
        {
          degree: "Bachelor's Degree",
          field: 'Computer Science',
          institution: 'University Name',
          startDate: '2019',
          endDate: '2023',
        },
      ],
    }));
    handleManualSectionEdit('education');
  }

  function updateEducationItem(index: number, field: string, value: string) {
    setDraft((prev) => {
      const nextEdu = [...prev.education];
      nextEdu[index] = { ...nextEdu[index], [field]: value };
      return { ...prev, education: nextEdu };
    });
    handleManualSectionEdit('education');
  }

  function deleteEducationItem(index: number) {
    setDraft((prev) => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index),
    }));
    handleManualSectionEdit('education');
  }

  function moveEducationItem(index: number, direction: 'up' | 'down') {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= draft.education.length) return;

    setDraft((prev) => {
      const nextEdu = [...prev.education];
      const temp = nextEdu[index];
      nextEdu[index] = nextEdu[targetIndex];
      nextEdu[targetIndex] = temp;
      return { ...prev, education: nextEdu };
    });
    handleManualSectionEdit('education');
  }

  // ---------------------------------------------------------------------------
  // Section: Certifications Items
  // ---------------------------------------------------------------------------
  function addCertificationItem() {
    setDraft((prev) => ({
      ...prev,
      certifications: [
        ...prev.certifications,
        { name: 'Certification Name', issuer: 'Issuer Organization', date: '2024' },
      ],
    }));
    handleManualSectionEdit('certifications');
  }

  function updateCertificationItem(index: number, field: string, value: string) {
    setDraft((prev) => {
      const nextCert = [...prev.certifications];
      nextCert[index] = { ...nextCert[index], [field]: value };
      return { ...prev, certifications: nextCert };
    });
    handleManualSectionEdit('certifications');
  }

  function deleteCertificationItem(index: number) {
    setDraft((prev) => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== index),
    }));
    handleManualSectionEdit('certifications');
  }

  function moveCertificationItem(index: number, direction: 'up' | 'down') {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= draft.certifications.length) return;

    setDraft((prev) => {
      const nextCert = [...prev.certifications];
      const temp = nextCert[index];
      nextCert[index] = nextCert[targetIndex];
      nextCert[targetIndex] = temp;
      return { ...prev, certifications: nextCert };
    });
    handleManualSectionEdit('certifications');
  }

  // ---------------------------------------------------------------------------
  // Section: Achievements Items
  // ---------------------------------------------------------------------------
  function addAchievementItem() {
    setDraft((prev) => ({
      ...prev,
      achievements: [...(prev.achievements ?? []), 'New documented achievement or award'],
    }));
    handleManualSectionEdit('achievements');
  }

  function updateAchievementItem(index: number, value: string) {
    setDraft((prev) => {
      const nextAch = [...(prev.achievements ?? [])];
      nextAch[index] = value;
      return { ...prev, achievements: nextAch };
    });
    handleManualSectionEdit('achievements');
  }

  function deleteAchievementItem(index: number) {
    setDraft((prev) => ({
      ...prev,
      achievements: (prev.achievements ?? []).filter((_, i) => i !== index),
    }));
    handleManualSectionEdit('achievements');
  }

  // ---------------------------------------------------------------------------
  // Discard Changes Handler
  // ---------------------------------------------------------------------------
  function handleDiscard() {
    if (window.confirm('Discard all unsaved edits and revert back to the saved version?')) {
      const cloned = deepCloneResume(savedBaseline);
      setDraft(cloned);
      setIsDirty(false);
      onDirtyChange?.(false);
      setConflictedSections(new Set());
      onDiscardChanges?.();
    }
  }

  // ---------------------------------------------------------------------------
  // Save as Version Handler
  // ---------------------------------------------------------------------------
  function openSaveModal() {
    const hasAcceptedAI = suggestions.some((s) => s.status === 'ACCEPTED');
    const autoSource: ResumeVersionSource = hasAcceptedAI ? 'AI_OPTIMIZED' : 'MANUAL_EDIT';
    const nextVer = currentVersionNumber + 1;
    const defaultTitle = hasAcceptedAI
      ? `AI Optimized Version ${nextVer}`
      : `Manual Edit Version ${nextVer}`;

    setVersionTitle(defaultTitle);
    setSaveSource(autoSource);
    setChangesSummary('');
    setError(null);
    setIsSaveModalOpen(true);
  }

  async function handleConfirmSaveVersion(e: React.FormEvent) {
    e.preventDefault();
    if (!versionTitle.trim()) return;

    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const structuredData = buildStructuredDataFromDraft(draft);

      const response = await createResumeVersion(
        resumeId,
        versionTitle.trim(),
        changesSummary.trim(),
        saveSource,
        structuredData,
        currentScore,
      );

      setSavedBaseline(deepCloneResume(draft));
      setIsDirty(false);
      onDirtyChange?.(false);
      setIsSaveModalOpen(false);
      setSuccessMessage(`Successfully saved Version v${response.version.versionNumber}: ${response.version.title}`);
      onVersionSaved?.(response.version);
    } catch (err) {
      setError(
        err instanceof ApiClientError ? err.message : 'Failed to save new resume version.',
      );
    } finally {
      setIsSaving(false);
    }
  }

  const acceptedSuggestionsCount = suggestions.filter((s) => s.status === 'ACCEPTED').length;
  const pendingSuggestionsCount = suggestions.filter((s) => s.status === 'PENDING').length;

  return (
    <div id="resume-editor-container" className="space-y-6">
      {/* Editor Top Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#16A36A]" />
              Structured Resume Editor
            </h2>
            {isDirty ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                <Clock className="w-3 h-3" /> Unsaved Draft
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                <Check className="w-3 h-3" /> Saved Version v{currentVersionNumber}
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
            <span>Current: <strong>v{currentVersionNumber} — {currentVersionTitle}</strong></span>
            <span>•</span>
            <span>Origin: <strong className="uppercase">{currentVersionSource}</strong></span>
            {currentScore !== null && (
              <>
                <span>•</span>
                <span title="Score from previous analysis. Re-run Job Match Analysis to evaluate modified version.">
                  ATS Score: <strong>{currentScore}/100</strong>{' '}
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 italic">
                    (from previous analysis)
                  </span>
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-shrink-0">
          {isDirty && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDiscard}
              className="rounded-xl text-xs font-bold flex items-center gap-1.5 text-slate-600 dark:text-slate-300"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Discard Changes</span>
            </Button>
          )}

          <Button
            id="save-resume-version-btn"
            type="button"
            size="sm"
            onClick={openSaveModal}
            className={`rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs ${
              isDirty
                ? 'bg-[#16A36A] hover:bg-[#118A58] text-white animate-pulse'
                : 'bg-slate-800 hover:bg-slate-700 text-white'
            }`}
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save as Version</span>
          </Button>
        </div>
      </div>

      {/* Messages */}
      <FormMessage message={error ?? undefined} />
      {successMessage ? (
        <div
          className="flex items-center gap-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300 p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800"
          role="status"
        >
          <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      ) : null}

      {/* AI Suggestion Banner / Quick Review Controls */}
      {suggestions.length > 0 && (
        <div className="p-4 rounded-3xl border border-[#16A36A]/20 bg-[#F7FAF8] dark:bg-slate-900/60 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#16A36A]" />
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-100">
                AI Optimization Suggestions ({suggestions.length})
              </h3>
              <div className="flex items-center gap-1 text-[11px]">
                {acceptedSuggestionsCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold">
                    {acceptedSuggestionsCount} Accepted
                  </span>
                )}
                {pendingSuggestionsCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold">
                    {pendingSuggestionsCount} Pending
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {pendingSuggestionsCount > 0 && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAcceptAllSuggestions}
                    className="h-7 px-2.5 rounded-lg text-[11px] font-bold text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                  >
                    Accept All
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRejectAllSuggestions}
                    className="h-7 px-2.5 rounded-lg text-[11px] font-bold text-slate-600 dark:text-slate-400"
                  >
                    Reject All
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* List of Suggestions for review */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {suggestions.map((s, idx) => {
              const suggestionId = s.id ?? s.key;
              const isAccepted = s.status === 'ACCEPTED';
              const isRejected = s.status === 'REJECTED';
              const isConflicted = conflictedSections.has(s.key);

              return (
                <div
                  key={`${suggestionId}-${idx}`}
                  className={`p-3 rounded-2xl border text-xs space-y-2 transition-all ${
                    isAccepted
                      ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20'
                      : isRejected
                      ? 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/20 opacity-70'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[11px] uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      {s.section ?? s.key}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {isConflicted && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300" title="You edited this section manually. Suggestion will not silently overwrite your edits.">
                          <AlertTriangle className="w-3 h-3" /> Manually Modified
                        </span>
                      )}
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          isAccepted
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : isRejected
                            ? 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        {s.status ?? 'PENDING'}
                      </span>
                    </div>
                  </div>

                  {/* Suggestion text */}
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 text-[11px] text-slate-800 dark:text-slate-200 line-clamp-3 leading-relaxed">
                    {s.suggestedContent ?? s.improved}
                  </div>

                  {s.reason && (
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                      <strong>Why:</strong> {s.reason}
                    </p>
                  )}

                  {/* Accept / Reject actions */}
                  <div className="flex items-center justify-end gap-2 pt-1">
                    {!isAccepted ? (
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleAcceptSuggestion(suggestionId)}
                        className="h-7 px-3 rounded-lg text-[11px] font-bold bg-[#16A36A] hover:bg-[#118A58] text-white flex items-center gap-1 cursor-pointer"
                      >
                        <Check className="w-3 h-3" /> Accept into Draft
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleRejectSuggestion(suggestionId)}
                        className="h-7 px-3 rounded-lg text-[11px] font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" /> Revert
                      </Button>
                    )}

                    {!isRejected && !isAccepted && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRejectSuggestion(suggestionId)}
                        className="h-7 px-2 rounded-lg text-[11px] font-bold text-slate-500 hover:text-rose-600 dark:text-slate-400 cursor-pointer"
                      >
                        <X className="w-3 h-3" /> Reject
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Editor Section Navigation Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        {[
          { id: 'summary', label: 'Summary', icon: FileText },
          { id: 'skills', label: `Skills (${draft.skills?.length ?? 0})`, icon: Tag },
          { id: 'experience', label: `Experience (${draft.experience?.length ?? 0})`, icon: Briefcase },
          { id: 'projects', label: `Projects (${draft.projects?.length ?? 0})`, icon: FolderGit2 },
          { id: 'education', label: `Education (${draft.education?.length ?? 0})`, icon: GraduationCap },
          { id: 'certifications', label: `Certifications (${draft.certifications?.length ?? 0})`, icon: Award },
          { id: 'achievements', label: `Achievements (${draft.achievements?.length ?? 0})`, icon: Layers },
          { id: 'personal', label: 'Personal Info', icon: User },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const isSectionConflicted = conflictedSections.has(tab.id);

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#16A36A] text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {isSectionConflicted && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" title="Section manually modified" />
              )}
            </button>
          );
        })}
      </div>

      {/* Section 1: Summary */}
      {activeTab === 'summary' && (
        <div className="p-6 rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#16A36A]" />
                Professional Summary
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                A concise 3-4 sentence pitch highlighting your core value and achievements.
              </p>
            </div>
          </div>

          <textarea
            id="editor-summary-textarea"
            rows={5}
            value={draft.summary ?? ''}
            onChange={(e) => updateSummary(e.target.value)}
            placeholder="Write your professional summary..."
            className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 p-4 text-xs sm:text-sm text-slate-900 dark:text-slate-100 leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#16A36A]"
          />

          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Character count: {(draft.summary ?? '').length}</span>
            <span>Tip: Use active verbs and quantify facts where possible without inventing metrics.</span>
          </div>
        </div>
      )}

      {/* Section 2: Skills */}
      {activeTab === 'skills' && (
        <div className="p-6 rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-5">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Tag className="w-4 h-4 text-[#16A36A]" />
              Skills ({draft.skills?.length ?? 0})
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Add genuine skills and technologies matching your actual experience.
            </p>
          </div>

          {/* Add Skill Input */}
          <div className="flex gap-2">
            <input
              id="new-skill-input"
              type="text"
              placeholder="Add a new skill (e.g. TypeScript, GraphQL, Docker)..."
              value={newSkillInput}
              onChange={(e) => setNewSkillInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addSkill(newSkillInput);
                }
              }}
              className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 px-3.5 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#16A36A]"
            />
            <Button
              type="button"
              onClick={() => addSkill(newSkillInput)}
              className="rounded-xl text-xs font-bold bg-[#16A36A] hover:bg-[#118A58] text-white flex items-center gap-1.5 cursor-pointer px-4"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </Button>
          </div>

          {/* Skill Tag Chips */}
          <div className="flex flex-wrap gap-2 pt-2">
            {draft.skills && draft.skills.length > 0 ? (
              draft.skills.map((skill, idx) => (
                <span
                  key={`${skill}-${idx}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
                >
                  <span>{skill}</span>
                  <button
                    type="button"
                    onClick={() => removeSkill(skill)}
                    className="text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                    title={`Remove ${skill}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))
            ) : (
              <p className="text-xs text-slate-400 italic">No skills listed yet. Add skills above.</p>
            )}
          </div>
        </div>
      )}

      {/* Section 3: Experience */}
      {activeTab === 'experience' && (
        <div className="p-6 rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-[#16A36A]" />
                Work Experience ({draft.experience?.length ?? 0})
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Document past roles and responsibilities. Use reorder controls to adjust chronology.
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={addExperienceItem}
              className="rounded-xl text-xs font-bold bg-[#16A36A] hover:bg-[#118A58] text-white flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Role</span>
            </Button>
          </div>

          <div className="space-y-4">
            {draft.experience && draft.experience.length > 0 ? (
              draft.experience.map((exp, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                      Position #{idx + 1}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => moveExperienceItem(idx, 'up')}
                        className="p-1 rounded text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === draft.experience.length - 1}
                        onClick={() => moveExperienceItem(idx, 'down')}
                        className="p-1 rounded text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteExperienceItem(idx)}
                        className="p-1 rounded text-rose-500 hover:text-rose-700 cursor-pointer ml-2"
                        title="Delete Role"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                        Job Title
                      </label>
                      <input
                        type="text"
                        value={exp.title ?? ''}
                        onChange={(e) => updateExperienceItem(idx, 'title', e.target.value)}
                        placeholder="e.g. Senior Software Engineer"
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                        Company Name
                      </label>
                      <input
                        type="text"
                        value={exp.company ?? ''}
                        onChange={(e) => updateExperienceItem(idx, 'company', e.target.value)}
                        placeholder="e.g. Google, Acme Inc."
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs sm:text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                        Start Date
                      </label>
                      <input
                        type="text"
                        value={exp.startDate ?? ''}
                        onChange={(e) => updateExperienceItem(idx, 'startDate', e.target.value)}
                        placeholder="e.g. Jan 2021"
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                        End Date
                      </label>
                      <input
                        type="text"
                        value={exp.endDate ?? ''}
                        onChange={(e) => updateExperienceItem(idx, 'endDate', e.target.value)}
                        placeholder="e.g. Present"
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs sm:text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                      Description & Accomplishments
                    </label>
                    <textarea
                      rows={3}
                      value={exp.description ?? ''}
                      onChange={(e) => updateExperienceItem(idx, 'description', e.target.value)}
                      placeholder="Detail your responsibilities and accomplishments..."
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-xs leading-relaxed"
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 italic">No experience items added yet.</p>
            )}
          </div>
        </div>
      )}

      {/* Section 4: Projects */}
      {activeTab === 'projects' && (
        <div className="p-6 rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <FolderGit2 className="w-4 h-4 text-[#16A36A]" />
                Projects ({draft.projects?.length ?? 0})
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Key technical projects and open-source contributions.
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={addProjectItem}
              className="rounded-xl text-xs font-bold bg-[#16A36A] hover:bg-[#118A58] text-white flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Project</span>
            </Button>
          </div>

          <div className="space-y-4">
            {draft.projects && draft.projects.length > 0 ? (
              draft.projects.map((proj, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                      Project #{idx + 1}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => moveProjectItem(idx, 'up')}
                        className="p-1 rounded text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === draft.projects.length - 1}
                        onClick={() => moveProjectItem(idx, 'down')}
                        className="p-1 rounded text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteProjectItem(idx)}
                        className="p-1 rounded text-rose-500 hover:text-rose-700 cursor-pointer ml-2"
                        title="Delete Project"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                      Project Name
                    </label>
                    <input
                      type="text"
                      value={proj.name ?? ''}
                      onChange={(e) => updateProjectItem(idx, 'name', e.target.value)}
                      placeholder="e.g. Distributed Cache Engine"
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                      Technologies (comma separated)
                    </label>
                    <input
                      type="text"
                      value={(proj.technologies ?? []).join(', ')}
                      onChange={(e) => {
                        const arr = e.target.value.split(',').map((t) => t.trim()).filter(Boolean);
                        updateProjectItem(idx, 'technologies', arr);
                      }}
                      placeholder="e.g. React, TypeScript, Redis"
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                      Description
                    </label>
                    <textarea
                      rows={3}
                      value={proj.description ?? ''}
                      onChange={(e) => updateProjectItem(idx, 'description', e.target.value)}
                      placeholder="Describe what you built, architecture decisions, and metrics..."
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-xs leading-relaxed"
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 italic">No projects added yet.</p>
            )}
          </div>
        </div>
      )}

      {/* Section 5: Education */}
      {activeTab === 'education' && (
        <div className="p-6 rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-[#16A36A]" />
                Education ({draft.education?.length ?? 0})
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Academic degrees, institutions, and graduation dates.
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={addEducationItem}
              className="rounded-xl text-xs font-bold bg-[#16A36A] hover:bg-[#118A58] text-white flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Degree</span>
            </Button>
          </div>

          <div className="space-y-4">
            {draft.education && draft.education.length > 0 ? (
              draft.education.map((edu, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                      Degree #{idx + 1}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => moveEducationItem(idx, 'up')}
                        className="p-1 rounded text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === draft.education.length - 1}
                        onClick={() => moveEducationItem(idx, 'down')}
                        className="p-1 rounded text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteEducationItem(idx)}
                        className="p-1 rounded text-rose-500 hover:text-rose-700 cursor-pointer ml-2"
                        title="Delete Degree"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                        Degree
                      </label>
                      <input
                        type="text"
                        value={edu.degree ?? ''}
                        onChange={(e) => updateEducationItem(idx, 'degree', e.target.value)}
                        placeholder="e.g. B.S., M.S."
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                        Field of Study
                      </label>
                      <input
                        type="text"
                        value={edu.field ?? ''}
                        onChange={(e) => updateEducationItem(idx, 'field', e.target.value)}
                        placeholder="e.g. Computer Science"
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs sm:text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                        Institution
                      </label>
                      <input
                        type="text"
                        value={edu.institution ?? ''}
                        onChange={(e) => updateEducationItem(idx, 'institution', e.target.value)}
                        placeholder="e.g. Stanford University"
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                        Dates (Graduation Year)
                      </label>
                      <input
                        type="text"
                        value={edu.endDate ?? ''}
                        onChange={(e) => updateEducationItem(idx, 'endDate', e.target.value)}
                        placeholder="e.g. 2023"
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs sm:text-sm"
                      />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 italic">No education entries added yet.</p>
            )}
          </div>
        </div>
      )}

      {/* Section 6: Certifications */}
      {activeTab === 'certifications' && (
        <div className="p-6 rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Award className="w-4 h-4 text-[#16A36A]" />
                Certifications ({draft.certifications?.length ?? 0})
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Industry credentials and verified certificates.
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={addCertificationItem}
              className="rounded-xl text-xs font-bold bg-[#16A36A] hover:bg-[#118A58] text-white flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Certificate</span>
            </Button>
          </div>

          <div className="space-y-4">
            {draft.certifications && draft.certifications.length > 0 ? (
              draft.certifications.map((cert, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                      Certificate #{idx + 1}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => moveCertificationItem(idx, 'up')}
                        className="p-1 rounded text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === draft.certifications.length - 1}
                        onClick={() => moveCertificationItem(idx, 'down')}
                        className="p-1 rounded text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteCertificationItem(idx)}
                        className="p-1 rounded text-rose-500 hover:text-rose-700 cursor-pointer ml-2"
                        title="Delete Certificate"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                        Certification Name
                      </label>
                      <input
                        type="text"
                        value={cert.name ?? ''}
                        onChange={(e) => updateCertificationItem(idx, 'name', e.target.value)}
                        placeholder="e.g. AWS Certified Solutions Architect"
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                        Issuer
                      </label>
                      <input
                        type="text"
                        value={cert.issuer ?? ''}
                        onChange={(e) => updateCertificationItem(idx, 'issuer', e.target.value)}
                        placeholder="e.g. Amazon Web Services"
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs sm:text-sm"
                      />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 italic">No certifications added yet.</p>
            )}
          </div>
        </div>
      )}

      {/* Section 7: Achievements */}
      {activeTab === 'achievements' && (
        <div className="p-6 rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#16A36A]" />
                Achievements & Honors ({draft.achievements?.length ?? 0})
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Notable awards, competitions, publications, or career milestones.
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={addAchievementItem}
              className="rounded-xl text-xs font-bold bg-[#16A36A] hover:bg-[#118A58] text-white flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Achievement</span>
            </Button>
          </div>

          <div className="space-y-3">
            {draft.achievements && draft.achievements.length > 0 ? (
              draft.achievements.map((ach, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40"
                >
                  <input
                    type="text"
                    value={ach}
                    onChange={(e) => updateAchievementItem(idx, e.target.value)}
                    placeholder="Describe your achievement..."
                    className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs sm:text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => deleteAchievementItem(idx)}
                    className="p-1.5 rounded text-rose-500 hover:text-rose-700 cursor-pointer"
                    title="Delete Achievement"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 italic">No achievements added yet.</p>
            )}
          </div>
        </div>
      )}

      {/* Section 8: Personal Info */}
      {activeTab === 'personal' && (
        <div className="p-6 rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <User className="w-4 h-4 text-[#16A36A]" />
              Personal Information
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Basic contact and location details.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={draft.personal.name ?? ''}
                onChange={(e) => updatePersonal('name', e.target.value)}
                placeholder="e.g. Jane Doe"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 px-3.5 py-2 text-xs sm:text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={draft.personal.email ?? ''}
                onChange={(e) => updatePersonal('email', e.target.value)}
                placeholder="e.g. jane@example.com"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 px-3.5 py-2 text-xs sm:text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Phone Number
              </label>
              <input
                type="text"
                value={draft.personal.phone ?? ''}
                onChange={(e) => updatePersonal('phone', e.target.value)}
                placeholder="e.g. +1 (555) 019-2834"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 px-3.5 py-2 text-xs sm:text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Location
              </label>
              <input
                type="text"
                value={draft.personal.location ?? ''}
                onChange={(e) => updatePersonal('location', e.target.value)}
                placeholder="e.g. San Francisco, CA"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 px-3.5 py-2 text-xs sm:text-sm"
              />
            </div>
          </div>
        </div>
      )}

      {/* Save Version Modal */}
      {isSaveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Save className="w-5 h-5 text-[#16A36A]" />
                <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                  Save as Immutable Version
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSaveModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmSaveVersion} className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="modal-version-title" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Version Title *
                </label>
                <input
                  id="modal-version-title"
                  type="text"
                  required
                  value={versionTitle}
                  onChange={(e) => setVersionTitle(e.target.value)}
                  placeholder="e.g. AI Optimized Resume V2"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-3.5 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#16A36A]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Changes Summary (optional)
                </label>
                <textarea
                  rows={2}
                  value={changesSummary}
                  onChange={(e) => setChangesSummary(e.target.value)}
                  placeholder="Briefly describe what changed in this version..."
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-3 text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#16A36A]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Version Origin / Source
                </label>
                <select
                  value={saveSource}
                  onChange={(e) => setSaveSource(e.target.value as ResumeVersionSource)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-3 py-2 text-xs"
                >
                  <option value="AI_OPTIMIZED">AI Optimized (Accepted suggestions)</option>
                  <option value="MANUAL_EDIT">Manual Edit</option>
                  <option value="ORIGINAL">Original</option>
                </select>
              </div>

              {currentScore !== null && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 text-xs text-slate-500">
                  <Info className="w-4 h-4 flex-shrink-0 text-slate-400 mt-0.5" />
                  <span>
                    ATS score snapshot: <strong>{currentScore}/100</strong>. This score reflects the previous analysis. Re-run Job Match Analysis after saving to measure score changes.
                  </span>
                </div>
              )}

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsSaveModalOpen(false)}
                  className="rounded-xl text-xs font-bold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSaving || !versionTitle.trim()}
                  className="rounded-xl text-xs font-bold bg-[#16A36A] hover:bg-[#118A58] text-white flex items-center gap-1.5 cursor-pointer"
                >
                  {isSaving ? 'Creating Version…' : 'Save Version'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
