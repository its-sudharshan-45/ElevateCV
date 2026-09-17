import React from 'react';
import { Navbar } from '@/components/landing/Navbar';
import { HeroSection } from '@/components/landing/HeroSection';
import { CoreJourneySection } from '@/components/landing/CoreJourneySection';
import { FeaturesSection } from '@/components/landing/FeaturesSection';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { MeasurableProgressSection } from '@/components/landing/MeasurableProgressSection';
import { WhatYouGetSection } from '@/components/landing/WhatYouGetSection';
import { AboutAndCtaSection } from '@/components/landing/AboutAndCtaSection';
import { Footer } from '@/components/landing/Footer';

export function HomePage() {
  return (
    <div className="min-h-screen bg-[#F7F6F2] text-[#171717] antialiased overflow-x-hidden">
      {/* Sticky Navigation */}
      <Navbar />

      <main>
        {/* 1. Hero — Make Your Resume Work Harder */}
        <HeroSection />

        {/* 2. Value Proposition — Know Where Your Resume Stands */}
        <CoreJourneySection />

        {/* 3. Features — Everything You Need to Improve Your Resume */}
        <FeaturesSection />

        {/* 4. How It Works — Simple From Start to Finish */}
        <HowItWorksSection />

        {/* 5. Benefits — Improve With Confidence */}
        <MeasurableProgressSection />

        {/* 6. What You Get — Clear Insights. Better Applications. */}
        <WhatYouGetSection />

        {/* 7. Final CTA — Ready to Improve Your Resume? */}
        <AboutAndCtaSection />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
