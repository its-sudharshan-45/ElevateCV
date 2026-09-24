import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ResumeEditor } from './ResumeEditor';
import * as versionApi from '../api/resume-version.api';
import type { StructuredResume, OptimizedSection } from '../types/resume';

vi.mock('../api/resume-version.api', () => ({
  createResumeVersion: vi.fn(),
}));

const mockResume: StructuredResume = {
  personal: {
    name: 'Alex Mercer',
    email: 'alex@example.com',
    phone: '+1 555-0100',
    location: 'Austin, TX',
  },
  summary: 'Full-stack software engineer with 5 years experience.',
  skills: ['React', 'TypeScript', 'Node.js'],
  experience: [
    {
      title: 'Senior Engineer',
      company: 'TechCorp',
      startDate: '2021',
      endDate: 'Present',
      description: 'Led cloud architecture migration.',
    },
    {
      title: 'Junior Engineer',
      company: 'StartUp Inc',
      startDate: '2019',
      endDate: '2021',
      description: 'Built customer dashboards.',
    },
  ],
  education: [
    {
      degree: 'B.S.',
      field: 'Computer Science',
      institution: 'UT Austin',
      startDate: '2015',
      endDate: '2019',
    },
  ],
  projects: [
    {
      name: 'Rework CV',
      description: 'AI resume builder platform.',
      technologies: ['React', 'Node.js'],
    },
  ],
  certifications: [
    {
      name: 'AWS Solutions Architect',
      issuer: 'Amazon Web Services',
      date: '2023',
    },
  ],
  achievements: ['Won 1st place in internal hackathon 2022'],
};

const mockSuggestions: OptimizedSection[] = [
  {
    id: 'sug-1',
    key: 'summary',
    section: 'Professional Summary',
    original: 'Full-stack software engineer with 5 years experience.',
    improved: 'Impact-driven full-stack software engineer with 5+ years experience building scalable web architectures.',
    reason: 'Stronger active phrasing and ATS alignment.',
    status: 'PENDING',
  },
];

describe('ResumeEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all sections and shows current saved version info', () => {
    render(
      <ResumeEditor
        resumeId="res-1"
        initialResume={mockResume}
        currentVersionNumber={1}
        currentVersionTitle="Original Upload"
      />,
    );

    expect(screen.getByText(/Structured Resume Editor/i)).toBeDefined();
    expect(screen.getByText(/Saved Version v1/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /^Summary$/i })).toBeDefined();
    expect(screen.getByText(/Skills \(3\)/i)).toBeDefined();
    expect(screen.getByText(/Experience \(2\)/i)).toBeDefined();
    expect(screen.getByText(/Projects \(1\)/i)).toBeDefined();
    expect(screen.getByText(/Education \(1\)/i)).toBeDefined();
    expect(screen.getByText(/Certifications \(1\)/i)).toBeDefined();
    expect(screen.getByText(/Achievements \(1\)/i)).toBeDefined();
    expect(screen.getByText(/Personal Info/i)).toBeDefined();
  });

  it('allows editing summary and marks draft as dirty', () => {
    render(<ResumeEditor resumeId="res-1" initialResume={mockResume} />);

    const textarea = screen.getByPlaceholderText(/Write your professional summary/i);
    expect((textarea as HTMLTextAreaElement).value).toBe(mockResume.summary);

    fireEvent.change(textarea, { target: { value: 'Updated summary text.' } });
    expect(screen.getByText(/Unsaved Draft/i)).toBeDefined();
    expect(screen.getByText(/Discard Changes/i)).toBeDefined();
  });

  it('allows adding and removing skills', () => {
    render(<ResumeEditor resumeId="res-1" initialResume={mockResume} />);

    // Switch to Skills tab
    fireEvent.click(screen.getByText(/Skills \(3\)/i));

    expect(screen.getByText('React')).toBeDefined();
    expect(screen.getByText('TypeScript')).toBeDefined();
    expect(screen.getByText('Node.js')).toBeDefined();

    // Add new skill
    const input = screen.getByPlaceholderText(/Add a new skill/i);
    fireEvent.change(input, { target: { value: 'PostgreSQL' } });
    fireEvent.click(screen.getByRole('button', { name: /^add$/i }));

    expect(screen.getByText('PostgreSQL')).toBeDefined();
    expect(screen.getByText(/Unsaved Draft/i)).toBeDefined();

    // Remove a skill
    const removeBtn = screen.getByTitle('Remove React');
    fireEvent.click(removeBtn);
    expect(screen.queryByText('React')).toBeNull();
  });

  it('allows adding, updating and reordering experience items', () => {
    render(<ResumeEditor resumeId="res-1" initialResume={mockResume} />);

    // Switch to Experience tab
    fireEvent.click(screen.getByText(/Experience \(2\)/i));

    expect(screen.getByDisplayValue('TechCorp')).toBeDefined();
    expect(screen.getByDisplayValue('StartUp Inc')).toBeDefined();

    // Click Move Down on the first item
    const moveDownButtons = screen.getAllByTitle('Move Down');
    fireEvent.click(moveDownButtons[0]);

    // Position 1 should now be StartUp Inc
    const companyInputs = screen.getAllByPlaceholderText(/e\.g\. Google, Acme Inc\./i);
    expect((companyInputs[0] as HTMLInputElement).value).toBe('StartUp Inc');
    expect((companyInputs[1] as HTMLInputElement).value).toBe('TechCorp');

    // Add new role
    fireEvent.click(screen.getByRole('button', { name: /Add Role/i }));
    expect(screen.getByText('Position #3')).toBeDefined();
  });

  it('accepts an AI suggestion into the draft and marks it accepted', () => {
    const onSuggestionsChange = vi.fn();

    render(
      <ResumeEditor
        resumeId="res-1"
        initialResume={mockResume}
        aiSuggestions={mockSuggestions}
        onAiSuggestionsChange={onSuggestionsChange}
      />,
    );

    expect(screen.getByText(/AI Optimization Suggestions \(1\)/i)).toBeDefined();
    expect(screen.getByText(/1 Pending/i)).toBeDefined();

    // Click "Accept into Draft"
    const acceptBtn = screen.getByRole('button', { name: /Accept into Draft/i });
    fireEvent.click(acceptBtn);

    expect(onSuggestionsChange).toHaveBeenCalled();
    // Summary textarea should now have the improved text
    const textarea = screen.getByPlaceholderText(/Write your professional summary/i);
    expect((textarea as HTMLTextAreaElement).value).toBe(mockSuggestions[0].improved);
    expect(screen.getByText(/Unsaved Draft/i)).toBeDefined();
  });

  it('rejects an AI suggestion', () => {
    const onSuggestionsChange = vi.fn();

    render(
      <ResumeEditor
        resumeId="res-1"
        initialResume={mockResume}
        aiSuggestions={mockSuggestions}
        onAiSuggestionsChange={onSuggestionsChange}
      />,
    );

    const rejectBtn = screen.getByRole('button', { name: /^Reject$/i });
    fireEvent.click(rejectBtn);

    expect(onSuggestionsChange).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ status: 'REJECTED' })]),
    );
  });

  it('saves draft as a new version and updates baseline', async () => {
    const onVersionSaved = vi.fn();
    vi.mocked(versionApi.createResumeVersion).mockResolvedValue({
      version: {
        id: 'ver-2',
        resumeId: 'res-1',
        userId: 'u-1',
        versionNumber: 2,
        title: 'Updated Resume V2',
        changesSummary: 'Refined experience and summary',
        source: 'MANUAL_EDIT',
        isCurrent: true,
        structuredData: { sections: [], skills: ['React'] },
        score: 85,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });

    render(
      <ResumeEditor
        resumeId="res-1"
        initialResume={mockResume}
        onVersionSaved={onVersionSaved}
      />,
    );

    // Edit summary to make it dirty
    const textarea = screen.getByPlaceholderText(/Write your professional summary/i);
    fireEvent.change(textarea, { target: { value: 'New edited summary' } });

    // Click Save as Version
    const saveBtn = screen.getByRole('button', { name: /Save as Version/i });
    fireEvent.click(saveBtn);

    // Modal opens
    expect(screen.getByText(/Save as Immutable Version/i)).toBeDefined();

    const titleInput = screen.getByLabelText(/Version Title \*/i);
    fireEvent.change(titleInput, { target: { value: 'Updated Resume V2' } });

    const submitBtn = screen.getByRole('button', { name: /^Save Version$/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(versionApi.createResumeVersion).toHaveBeenCalledWith(
        'res-1',
        'Updated Resume V2',
        '',
        'MANUAL_EDIT',
        expect.objectContaining({
          structuredResume: expect.objectContaining({
            summary: 'New edited summary',
          }),
        }),
        null,
      );
      expect(onVersionSaved).toHaveBeenCalled();
    });
  });

  it('discards unsaved changes when requested', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<ResumeEditor resumeId="res-1" initialResume={mockResume} />);

    const textarea = screen.getByPlaceholderText(/Write your professional summary/i);
    fireEvent.change(textarea, { target: { value: 'Temporary edits' } });
    expect(screen.getByText(/Unsaved Draft/i)).toBeDefined();

    const discardBtn = screen.getByRole('button', { name: /Discard Changes/i });
    fireEvent.click(discardBtn);

    expect((textarea as HTMLTextAreaElement).value).toBe(mockResume.summary);
    expect(screen.getByText(/Saved Version/i)).toBeDefined();
  });
});
