import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ResumeList } from '@/features/resume/components/ResumeList';

describe('ResumeList', () => {
  it('renders empty state when no resumes exist', () => {
    render(
      <ResumeList
        resumes={[]}
        selectedResumeId={null}
        onSelect={() => undefined}
        onDelete={() => undefined}
        deletingResumeId={null}
      />,
    );

    expect(screen.getByText(/No resumes uploaded yet/i)).toBeTruthy();
  });
});
