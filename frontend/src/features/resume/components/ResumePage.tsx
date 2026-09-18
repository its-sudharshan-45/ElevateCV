import { Link, useSearchParams } from 'react-router-dom';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { FormMessage } from '@/components/ui/form-message';
import {
  analyzeResumeForJob,
  deleteResume,
  getLatestJobAnalysis,
  getResume,
  listJobAnalyses,
  listResumes,
  processResume,
  uploadResume,
} from '@/features/resume/api/resume.api';
import { ResumeList } from '@/features/resume/components/ResumeList';
import { ResumeUpload } from '@/features/resume/components/ResumeUpload';
import { CakeMeReport } from '@/features/resume/components/CakeMeReport';
import { ResumeVersionManager } from '@/features/resume/components/ResumeVersionManager';
import type {
  JobMatchAnalysis,
  ResumeDetail,
  ResumeListItem,
} from '@/features/resume/types/resume';
import { ApiClientError } from '@/lib/api/client';
import {
  Sparkles,
  FileText,
  ArrowLeft,
  History,
  CheckCircle2,
} from 'lucide-react';

export function ResumePage() {
  const [searchParams] = useSearchParams();
  const queryResumeId = searchParams.get('resumeId');

  const [resumes, setResumes] = useState<ResumeListItem[]>([]);
  const [selectedResume, setSelectedResume] = useState<ResumeDetail | null>(null);
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [deletingResumeId, setDeletingResumeId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Job Match analysis result state
  const [jobMatchAnalysis, setJobMatchAnalysis] = useState<JobMatchAnalysis | null>(null);
  const [jobAnalysisId, setJobAnalysisId] = useState<string | null>(null);
  const [showReport, setShowReport] = useState<boolean>(false);

  const loadResumes = useCallback(async (autoSelect = false) => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await listResumes();
      const enrichedResumes = await Promise.all(
        (data.resumes || []).map(async (res) => {
          try {
            const analysesData = await listJobAnalyses(res.id);
            if (analysesData.analyses && analysesData.analyses.length > 0) {
              return {
                ...res,
                score: analysesData.analyses[0].matchScore,
              };
            }
          } catch {
            // keep existing score
          }
          return res;
        }),
      );
      setResumes(enrichedResumes);

      // Auto-select targeted resume if query param matches, else first resume if none selected yet
      if (enrichedResumes.length > 0) {
        if (queryResumeId && enrichedResumes.some((r) => r.id === queryResumeId)) {
          void handleSelect(queryResumeId);
        } else if (autoSelect || !selectedResumeId) {
          void handleSelect(enrichedResumes[0].id);
        }
      }
    } catch (loadError) {
      console.error('Failed to load resumes:', loadError);
      setError(
        loadError instanceof ApiClientError
          ? loadError.message
          : 'Unable to load resumes. Please verify you are logged in and try again.',
      );
    } finally {
      setIsLoading(false);
    }
  }, [selectedResumeId, queryResumeId]);

  useEffect(() => {
    void loadResumes(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSelect(resumeId: string) {
    setSelectedResumeId(resumeId);
    setError(null);
    setJobMatchAnalysis(null);
    setJobAnalysisId(null);

    try {
      const data = await getResume(resumeId);
      let matchScore = data.resume.score;

      try {
        const latestData = await getLatestJobAnalysis(resumeId);
        if (latestData?.analysis?.data) {
          setJobMatchAnalysis(latestData.analysis.data);
          setJobAnalysisId(latestData.analysis.analysisId);
          matchScore = latestData.analysis.data.matchScore;
          setResumes((current) =>
            current.map((r) =>
              r.id === resumeId ? { ...r, score: matchScore } : r,
            ),
          );
        }
      } catch {
        setJobMatchAnalysis(null);
      }

      setSelectedResume({
        ...data.resume,
        score: matchScore,
      });

      setShowReport(true);
    } catch (selectError) {
      setSelectedResume(null);
      setShowReport(false);
      setJobMatchAnalysis(null);
      setError(
        selectError instanceof ApiClientError
          ? selectError.message
          : 'Unable to load resume details.',
      );
    }
  }


  // Unified Resume Upload + Job Description Analysis flow
  async function handleUploadAndAnalyze(file: File, jobDescription: string, jobTitle?: string) {
    setIsUploading(true);
    setIsProcessing(false);
    setError(null);
    setSuccessMessage(null);
    // Clear any previous report while running a new analysis
    setShowReport(false);
    setJobMatchAnalysis(null);
    setJobAnalysisId(null);

    try {
      // 1. Upload resume
      const data = await uploadResume(file);
      setSelectedResumeId(data.resume.id);
      setSelectedResume(data.resume);

      // 2. Process through Hugging Face NER extraction
      setIsProcessing(true);
      const processed = await processResume(data.resume.id);
      setSelectedResume(processed.resume);

      // 3. Run Job-Specific ATS match analysis
      const jobMatchRes = await analyzeResumeForJob(
        processed.resume.id,
        jobDescription,
        jobTitle,
      );

      const matchedScore = jobMatchRes.data.matchScore;
      setJobMatchAnalysis(jobMatchRes.data);
      setJobAnalysisId(jobMatchRes.analysisId);

      const updatedResume = {
        ...processed.resume,
        score: matchedScore,
      };
      setSelectedResume(updatedResume);

      // Add to resumes list with synchronized match score
      setResumes((current) => [
        {
          ...data.resume,
          processingStatus: 'PROCESSED',
          score: matchedScore,
        },
        ...current.filter((r) => r.id !== data.resume.id),
      ]);

      // Display the completed report below
      setShowReport(true);
      setSuccessMessage('Resume & Job Description successfully analyzed!');
    } catch (uploadError) {
      setError(
        uploadError instanceof ApiClientError
          ? uploadError.message
          : 'Unable to analyze resume against job description. Please try again.',
      );
      setShowReport(false);
    } finally {
      setIsUploading(false);
      setIsProcessing(false);
    }
  }

  // Unified Saved Resume + Job Description Analysis flow
  async function handleAnalyzeSavedResume(resumeId: string, jobDescription: string, jobTitle?: string) {
    setIsProcessing(true);
    setError(null);
    setSuccessMessage(null);
    setShowReport(false);
    setJobMatchAnalysis(null);
    setJobAnalysisId(null);

    try {
      // 1. Ensure resume is processed before running job analysis
      const resumeData = await getResume(resumeId);
      let activeResume = resumeData.resume;
      if (activeResume.processingStatus !== 'PROCESSED') {
        const processed = await processResume(resumeId);
        activeResume = processed.resume;
      }

      // 2. Run Job-Specific ATS match analysis
      const jobMatchRes = await analyzeResumeForJob(
        resumeId,
        jobDescription,
        jobTitle,
      );

      const matchedScore = jobMatchRes.data.matchScore;
      setJobMatchAnalysis(jobMatchRes.data);
      setJobAnalysisId(jobMatchRes.analysisId);

      const updatedResume = {
        ...activeResume,
        score: matchedScore,
      };
      setSelectedResumeId(resumeId);
      setSelectedResume(updatedResume);

      // Update resume list score
      setResumes((current) =>
        current.map((r) =>
          r.id === resumeId
            ? { ...r, processingStatus: 'PROCESSED', score: matchedScore }
            : r,
        ),
      );

      setShowReport(true);
      setSuccessMessage('Saved resume successfully analyzed against job description!');
    } catch (analysisError) {
      setError(
        analysisError instanceof ApiClientError
          ? analysisError.message
          : 'Unable to analyze saved resume against job description. Please try again.',
      );
      setShowReport(false);
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleDelete(resumeId: string) {
    const confirmed = window.confirm('Delete this resume? This action cannot be undone.');
    if (!confirmed) {
      return;
    }

    setDeletingResumeId(resumeId);
    setError(null);

    try {
      await deleteResume(resumeId);
      const remaining = resumes.filter((item) => item.id !== resumeId);
      setResumes(remaining);

      // If the deleted resume was currently displayed, hide the report and clear active selection
      if (selectedResumeId === resumeId) {
        setSelectedResumeId(null);
        setSelectedResume(null);
        setJobMatchAnalysis(null);
        setJobAnalysisId(null);
        setShowReport(false);
      }
      setSuccessMessage('Resume deleted successfully.');
    } catch (deleteError) {
      setError(
        deleteError instanceof ApiClientError
          ? deleteError.message
          : 'Unable to delete resume. Please try again.',
      );
    } finally {
      setDeletingResumeId(null);
    }
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between no-print">
        <Button asChild variant="outline" className="rounded-xl text-xs font-bold">
          <Link to="/dashboard">
            <ArrowLeft className="w-3.5 h-3.5 mr-1 text-slate-500" />
            Back to Dashboard
          </Link>
        </Button>
      </div>

      {/* Messages */}
      <FormMessage message={error ?? undefined} />
      {successMessage ? (
        <div
          className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-emerald-800 dark:text-emerald-300 p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800"
          role="status"
          aria-live="polite"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      ) : null}

      {/* Unified Resume + Job Description Upload Section */}
      <div className="no-print">
        <ResumeUpload
          onUploadAndAnalyze={handleUploadAndAnalyze}
          onAnalyzeSavedResume={handleAnalyzeSavedResume}
          isUploading={isUploading}
          isProcessing={isProcessing}
          savedResumes={resumes}
          onSelectSavedResume={handleSelect}
        />
      </div>

      {/* History & Active Resume List */}
      <div className="space-y-4 no-print">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <History className="w-4 h-4 text-[#007A5A]" />
            Your Uploaded Resumes ({resumes.length})
          </h3>
        </div>

        {isLoading ? (
          <p className="text-xs text-slate-400 p-4 text-center">Loading your resumes…</p>
        ) : (
          <ResumeList
            resumes={resumes}
            selectedResumeId={selectedResumeId}
            onSelect={handleSelect}
            onDelete={handleDelete}
            deletingResumeId={deletingResumeId}
          />
        )}
      </div>

      {/* Analysis Report Section - Only displayed once analysis ends or View Analysis is clicked */}
      {showReport && selectedResume ? (
        <div id="analysis-report-section" className="space-y-8 pt-4 border-t border-slate-200 dark:border-slate-800 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#007A5A]" />
                Analysis Results: {selectedResume.originalFilename}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Evaluation based on Hugging Face NER extraction & ATS Job Description criteria.
              </p>
            </div>
          </div>

          {selectedResume.failureReason ? (
            <FormMessage message={selectedResume.failureReason} />
          ) : null}

          {/* Render structured clean report */}
          <div className="space-y-8">
            <CakeMeReport
              analysis={jobMatchAnalysis ?? undefined}
              resume={selectedResume}
              analysisId={jobAnalysisId ?? undefined}
            />
          </div>

          {/* Resume Versioning Manager */}
          <div className="no-print">
            <ResumeVersionManager
              resumeId={selectedResume.id}
              processingStatus={selectedResume.processingStatus}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
