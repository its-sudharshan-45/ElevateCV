
import { DragEvent, FormEvent, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { FormMessage } from '@/components/ui/form-message';
import { ACCEPTED_RESUME_TYPES } from '@/features/resume/types/resume';
import { formatFileSize, validateResumeFile } from '@/features/resume/utils/status';
import type { ResumeListItem } from '@/features/resume/types/resume';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  X,
  Loader2,
  Briefcase,
  Type,
  FileUp,
  Info,
} from 'lucide-react';

interface ResumeUploadProps {
  onUploadAndAnalyze: (file: File, jobDescription: string, jobTitle?: string) => Promise<void>;
  onAnalyzeSavedResume?: (resumeId: string, jobDescription: string, jobTitle?: string) => Promise<void>;
  isUploading: boolean;
  isProcessing: boolean;
  savedResumes?: ResumeListItem[];
  onSelectSavedResume?: (resumeId: string) => void;
}


export function ResumeUpload({
  onUploadAndAnalyze,
  onAnalyzeSavedResume,
  isUploading,
  isProcessing,
  savedResumes = [],
  onSelectSavedResume,
}: ResumeUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const jdFileInputRef = useRef<HTMLInputElement>(null);

  // Resume Mode: 'upload' | 'saved' | 'paste'
  const [resumeMode, setResumeMode] = useState<'upload' | 'saved' | 'paste'>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pastedResumeText, setPastedResumeText] = useState('');
  const [selectedSavedId, setSelectedSavedId] = useState<string>('');

  // Job Description Mode: 'paste' | 'upload'
  const [jdMode, setJdMode] = useState<'paste' | 'upload'>('paste');
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const charCount = jobDescription.length;
  const maxChars = 20000;
  const minChars = 10;
  const isBusy = isUploading || isProcessing;

  function handleFileSelection(file: File | null) {
    if (!file) {
      setSelectedFile(null);
      setError(null);
      return;
    }

    const validationError = validateResumeFile(file);
    if (validationError) {
      setError(validationError);
      setSelectedFile(null);
    } else {
      setError(null);
      setSelectedFile(file);
    }
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }

  function handleDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const file = e.dataTransfer.files?.[0] ?? null;
    handleFileSelection(file);
  }

  function handleJdFileUpload(file: File | null) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setJobDescription(text);
        setJdMode('paste');
      }
    };
    reader.readAsText(file);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (resumeMode === 'saved') {
      if (!selectedSavedId) {
        setError('Please select a saved resume or upload a new file.');
        return;
      }
      if (!jobDescription.trim() || charCount < minChars) {
        setError('Please provide the target Job Description to compare against.');
        return;
      }
      setError(null);
      if (onAnalyzeSavedResume) {
        await onAnalyzeSavedResume(selectedSavedId, jobDescription, jobTitle);
      } else if (onSelectSavedResume) {
        onSelectSavedResume(selectedSavedId);
      }
      return;
    }

    let fileToSubmit = selectedFile;

    // Handle text paste mode by converting to a File object
    if (resumeMode === 'paste') {
      if (!pastedResumeText.trim() || pastedResumeText.length < 20) {
        setError('Please paste your resume text before proceeding.');
        return;
      }
      fileToSubmit = new File([pastedResumeText], 'pasted_resume.txt', { type: 'text/plain' });
    }

    if (!fileToSubmit) {
      setError('Please upload your resume file first.');
      return;
    }

    if (!jobDescription.trim() || charCount < minChars) {
      setError('Please provide the target Job Description to compare against.');
      return;
    }

    const validationError = validateResumeFile(fileToSubmit);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    await onUploadAndAnalyze(fileToSubmit, jobDescription, jobTitle);
  }

  return (
    <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-10 shadow-sm space-y-8">
      {/* Header matching user image */}
      <div className="space-y-2 text-left">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#114B3E] dark:text-emerald-400 tracking-tight">
          Secure Your Interview Chances With a Tailored Resume
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 font-normal">
          Turn applications into interviews with personalized suggestions, ATS scoring and matching cover letters.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Step 1: Upload Your Resume* */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <span className="text-[#114B3E] dark:text-emerald-400 font-extrabold text-lg">①</span>
              <span>Upload Your Resume</span>
              <span className="text-red-500">*</span>
            </h2>
          </div>

          {/* Pill Tabs for Step 1 */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setResumeMode('upload')}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                resumeMode === 'upload'
                  ? 'border-2 border-[#007A5A] text-[#007A5A] bg-[#007A5A]/5 dark:bg-[#007A5A]/15 font-bold shadow-xs'
                  : 'border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <FileUp className="w-3.5 h-3.5" />
              <span>Upload File</span>
            </button>

            <button
              type="button"
              onClick={() => setResumeMode('saved')}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                resumeMode === 'saved'
                  ? 'border-2 border-[#007A5A] text-[#007A5A] bg-[#007A5A]/5 dark:bg-[#007A5A]/15 font-bold shadow-xs'
                  : 'border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Use Saved Resume</span>
            </button>

            <button
              type="button"
              onClick={() => setResumeMode('paste')}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                resumeMode === 'paste'
                  ? 'border-2 border-[#007A5A] text-[#007A5A] bg-[#007A5A]/5 dark:bg-[#007A5A]/15 font-bold shadow-xs'
                  : 'border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Type className="w-3.5 h-3.5" />
              <span>Paste Text</span>
            </button>
          </div>

          {/* Tab 1: Upload File Area */}
          {resumeMode === 'upload' && (
            <div className="space-y-2">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !isBusy && inputRef.current?.click()}
                className={`relative flex flex-col items-center justify-center p-8 sm:p-10 rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer ${
                  isDragOver
                    ? 'border-[#007A5A] bg-[#007A5A]/10 scale-[0.99]'
                    : selectedFile
                      ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20'
                      : 'border-slate-300 dark:border-slate-700 hover:border-[#007A5A] bg-[#F7FAF8] dark:bg-slate-800/40'
                } ${isBusy ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <input
                  ref={inputRef}
                  id="resume-file-input"
                  name="resume-file"
                  type="file"
                  aria-label="Upload resume"
                  accept={ACCEPTED_RESUME_TYPES}
                  className="hidden"
                  onChange={(e) => handleFileSelection(e.target.files?.[0] ?? null)}
                  disabled={isBusy}
                />

                {!selectedFile ? (
                  <div className="flex flex-col items-center text-center space-y-1.5">
                    <span className="text-sm sm:text-base font-bold text-[#007A5A] dark:text-emerald-400 hover:underline">
                      Upload new files
                    </span>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                      Drop files here or click to upload.
                    </p>
                  </div>
                ) : (
                  <div
                    className="w-full flex items-center justify-between gap-4 p-4 rounded-xl bg-white dark:bg-slate-900 border border-emerald-500/30 shadow-xs"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="truncate text-left">
                        <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                          {selectedFile.name}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {formatFileSize(selectedFile.size)} • Ready for ATS scan
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Attached
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFile(null);
                          if (inputRef.current) inputRef.current.value = '';
                        }}
                        disabled={isBusy}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Remove file"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Helper Notes below dashed box */}
              <div className="space-y-1 pt-1 text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
                <p className="flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <span>Supported formats: .pdf, .doc, .docx. Max size: 5 MB.</span>
                </p>
                <p className="flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <span>All languages supported.</span>
                </p>
              </div>
            </div>
          )}

          {/* Tab 2: Use Saved Resume */}
          {resumeMode === 'saved' && (
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-[#F7FAF8] dark:bg-slate-800/40 space-y-3">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Select an existing resume from your account:
              </p>
              {savedResumes.length > 0 ? (
                <div className="grid gap-2">
                  {savedResumes.map((res) => (
                    <label
                      key={res.id}
                      className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                        selectedSavedId === res.id
                          ? 'border-[#007A5A] bg-[#007A5A]/10 text-slate-900 dark:text-slate-100 font-bold'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="saved-resume"
                          checked={selectedSavedId === res.id}
                          onChange={() => setSelectedSavedId(res.id)}
                          className="accent-[#007A5A]"
                        />
                        <span className="text-xs">{res.originalFilename}</span>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {new Date(res.createdAt).toLocaleDateString()}
                      </span>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                  No previously saved resumes found. Please switch to "Upload File" to add your resume.
                </p>
              )}
            </div>
          )}

          {/* Tab 3: Paste Text */}
          {resumeMode === 'paste' && (
            <div className="space-y-2">
              <textarea
                value={pastedResumeText}
                onChange={(e) => setPastedResumeText(e.target.value)}
                placeholder="Paste the raw text of your resume here (Summary, Work Experience, Education, Technical Skills)..."
                rows={6}
                className="w-full text-xs sm:text-sm p-4 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#007A5A]/30 focus:border-[#007A5A]"
              />
              <p className="text-[11px] text-slate-400">
                {pastedResumeText.length} characters entered
              </p>
            </div>
          )}
        </div>

        {/* Step 2: Add a Job Description* */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <span className="text-[#114B3E] dark:text-emerald-400 font-extrabold text-lg">②</span>
              <span>Add a Job Description</span>
              <span className="text-red-500">*</span>
            </h2>
          </div>

          {/* Pill Tabs for Step 2 */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setJdMode('paste')}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                jdMode === 'paste'
                  ? 'border-2 border-[#007A5A] text-[#007A5A] bg-[#007A5A]/5 dark:bg-[#007A5A]/15 font-bold shadow-xs'
                  : 'border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Type className="w-3.5 h-3.5" />
              <span>Paste Text</span>
            </button>

            <button
              type="button"
              onClick={() => jdFileInputRef.current?.click()}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800`}
            >
              <FileUp className="w-3.5 h-3.5" />
              <span>Upload File</span>
            </button>
            <input
              ref={jdFileInputRef}
              type="file"
              accept=".txt,.doc,.docx,.pdf"
              className="hidden"
              onChange={(e) => handleJdFileUpload(e.target.files?.[0] ?? null)}
            />
          </div>

          {/* Optional Job Title */}
          <div className="space-y-1">
            <label
              htmlFor="job-title-input"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              Job Title <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              id="job-title-input"
              type="text"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="e.g. Senior Frontend Engineer"
              disabled={isBusy}
              className="w-full text-xs sm:text-sm px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#007A5A]/30 focus:border-[#007A5A] transition-all"
            />
          </div>

          {/* Job Description Clean Textarea */}
          <div className="space-y-1.5">
            <textarea
              id="job-description-input"
              name="job-description"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the full job description here. The more details you provide, the better we can check your resume's fit."
              rows={6}
              disabled={isBusy}
              className="w-full text-xs sm:text-sm p-4 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#007A5A]/30 focus:border-[#007A5A] transition-all"
            />
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>{charCount >= minChars ? '✓ Job description provided' : `Minimum ${minChars} characters`}</span>
              <span>{charCount.toLocaleString()} / {maxChars.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Error message */}
        {error && <FormMessage message={error} />}

        {/* Submit Button */}
        <div className="pt-2">
          <Button
            type="submit"
            disabled={isBusy}
            className="w-full py-4 sm:py-5 rounded-2xl bg-[#007A5A] hover:bg-[#006349] text-white text-sm sm:text-base font-bold shadow-md shadow-[#007A5A]/20 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            {isBusy ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Running AI ATS Match Analysis…</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 text-emerald-200" />
                <span>Scan & Tailor Resume Fit</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
