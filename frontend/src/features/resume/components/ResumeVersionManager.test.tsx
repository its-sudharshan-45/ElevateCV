import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ResumeVersionManager } from './ResumeVersionManager';
import * as versionApi from '../api/resume-version.api';

vi.mock('../api/resume-version.api');

const sampleVersion: versionApi.ResumeVersion = {
  id: 'v-1',
  resumeId: 'resume-1',
  userId: 'user-1',
  versionNumber: 1,
  title: 'v1 Title',
  changesSummary: 'Initial snapshot',
  structuredData: { sections: [], skills: ['React'] },
  score: 85,
  source: 'ORIGINAL',
  isCurrent: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('ResumeVersionManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders version list and allows creating a new version when status is PROCESSED', async () => {
    vi.mocked(versionApi.listResumeVersions).mockResolvedValue({ versions: [sampleVersion] });
    vi.mocked(versionApi.createResumeVersion).mockResolvedValue({
      version: { ...sampleVersion, id: 'v-2', versionNumber: 2, title: 'v2 Title' },
    });

    render(<ResumeVersionManager resumeId="resume-1" processingStatus="PROCESSED" />);

    expect(await screen.findByText('v1 Title')).toBeTruthy();

    const createBtn = screen.getByRole('button', { name: 'Create Snapshot' });
    fireEvent.click(createBtn);

    const titleInput = screen.getByLabelText('Version Title *');
    fireEvent.change(titleInput, { target: { value: 'v2 Title' } });

    const submitBtn = screen.getByRole('button', { name: 'Save Snapshot' });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(versionApi.createResumeVersion).toHaveBeenCalledWith('resume-1', 'v2 Title', '');
    });
  });

  it('disables snapshot creation when processingStatus is not PROCESSED', async () => {
    vi.mocked(versionApi.listResumeVersions).mockResolvedValue({ versions: [] });

    render(<ResumeVersionManager resumeId="resume-1" processingStatus="UPLOADED" />);

    expect(await screen.findByText('Processing required before creating snapshots')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Create Snapshot' })).toBeNull();
  });
});
