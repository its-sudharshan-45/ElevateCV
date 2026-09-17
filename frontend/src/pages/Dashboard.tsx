import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { WelcomeBannerCard } from '@/components/dashboard/WelcomeBannerCard';
import { ResumeIntelligenceMetrics } from '@/components/dashboard/ResumeIntelligenceMetrics';
import { ResumeRecommendationsSection } from '@/components/dashboard/ResumeRecommendationsSection';
import { RecentActivityFeed } from '@/components/dashboard/RecentActivityFeed';
import { NewUserOnboardingCard } from '@/components/dashboard/NewUserOnboardingCard';
import { createClient } from '@/lib/supabase/client';
import { listResumes } from '@/services/resume.service';
import type { ResumeListItem } from '@/features/resume/types/resume';

export function DashboardPage() {
  const [userName, setUserName] = useState<string>('User');
  const [resumes, setResumes] = useState<ResumeListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    async function loadDashboardData() {
      setIsLoading(true);
      try {
        const supabase = createClient();
        const { data: authData } = await supabase.auth.getUser();
        if (authData?.user) {
          const email = authData.user.email ?? '';
          const computedName =
            authData.user.user_metadata?.full_name || email.split('@')[0] || 'User';
          setUserName(computedName.charAt(0).toUpperCase() + computedName.slice(1));
        }

        const data = await listResumes().catch(() => null);
        if (data?.resumes) {
          setResumes(data.resumes);
          if (data.resumes.length === 0) {
            setShowOnboarding(true);
          }
        }
      } catch {
        // Fallback gracefully
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  return (
    <DashboardLayout userName={userName}>
      {/* Page Header */}
      <div className="flex items-center justify-between pb-1">
        <span className="text-[11px] font-bold text-slate-400">
          Resume Intelligence Command Center • AI-Powered Analysis
        </span>
        <button
          onClick={() => setShowOnboarding(!showOnboarding)}
          className="text-[11px] font-bold text-[#6E44FF] hover:underline cursor-pointer"
        >
          {showOnboarding ? '← Back to Dashboard' : '⚡ Getting Started Guide'}
        </button>
      </div>

      {showOnboarding ? (
        <NewUserOnboardingCard />
      ) : (
        <div className="space-y-6">
          {/* Section 1: Welcome Banner */}
          <WelcomeBannerCard userName={userName} resumeCount={resumes.length} />

          {/* Section 2: Resume Intelligence Metrics */}
          <ResumeIntelligenceMetrics resumes={resumes} isLoading={isLoading} />

          {/* Section 3: Recommendations & Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7">
              <ResumeRecommendationsSection />
            </div>
            <div className="lg:col-span-5">
              <RecentActivityFeed />
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
