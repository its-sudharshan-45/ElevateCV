import React, { useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { Upload, ScanLine, GitCompare, Sparkles } from 'lucide-react';

const steps = [
  {
    number: '01',
    label: 'Upload',
    description: 'Add your existing resume securely. Supports PDF and common formats.',
    icon: Upload,
    detail: 'Drag & drop or browse',
  },
  {
    number: '02',
    label: 'Analyze',
    description: 'Get structured insights from your resume — skills, experience, and education extracted automatically.',
    icon: ScanLine,
    detail: 'Instant AI analysis',
  },
  {
    number: '03',
    label: 'Match',
    description: 'Add a job description to check ATS alignment and skill match across every requirement.',
    icon: GitCompare,
    detail: 'Real ATS scoring',
  },
  {
    number: '04',
    label: 'Improve',
    description: 'Apply clear, AI-generated recommendations and create a stronger, job-targeted resume.',
    icon: Sparkles,
    detail: 'Actionable suggestions',
  },
];

export function HowItWorksSection() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  const prefersReduced = useReducedMotion();

  return (
    <section
      id="how-it-works"
      ref={ref}
      className="py-20 md:py-28 bg-[#F7F6F2]"
      aria-labelledby="how-it-works-heading"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={prefersReduced ? false : { opacity: 0, y: 18 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55 }}
          className="text-center max-w-xl mx-auto mb-14"
        >
          <span className="text-[11px] font-bold tracking-[0.12em] uppercase text-[#626262]">
            Workflow
          </span>
          <h2
            id="how-it-works-heading"
            className="mt-3 text-[2rem] sm:text-[2.5rem] font-bold text-[#171717] tracking-[-0.02em] leading-tight"
          >
            Simple From Start<br className="hidden sm:block" /> to Finish.
          </h2>
          <p className="mt-4 text-[15px] text-[#626262] leading-relaxed">
            Four clear steps from resume upload to a stronger, more targeted application.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative">
          {/* Horizontal connector line (desktop only) */}
          <div
            className="absolute top-[52px] left-0 right-0 hidden lg:block pointer-events-none"
            aria-hidden="true"
          >
            <div className="max-w-4xl mx-auto px-12">
              <div className="h-px bg-[#E4E2DC]" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.number}
                  initial={prefersReduced ? false : { opacity: 0, y: 24 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: i * 0.12 }}
                  className="flex flex-col items-start lg:items-center text-left lg:text-center"
                >
                  {/* Icon circle */}
                  <div className="relative mb-5 flex-shrink-0">
                    <div className="w-[52px] h-[52px] rounded-xl bg-white border border-[#E4E2DC] flex items-center justify-center shadow-ecv-subtle z-10 relative">
                      <Icon className="h-5 w-5 text-[#171717]" />
                    </div>
                    {/* Step number badge */}
                    <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-[#171717] flex items-center justify-center">
                      <span className="text-[9px] font-bold text-white leading-none">{i + 1}</span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <h3 className="text-[17px] font-bold text-[#171717] mb-2">{step.label}</h3>
                    <p className="text-[13px] text-[#626262] leading-relaxed mb-3">{step.description}</p>
                    <span className="inline-flex items-center text-[11px] font-semibold text-[#16A36A] bg-[#E3F6ED] border border-[#B2EACF] px-2.5 py-1 rounded-full">
                      {step.detail}
                    </span>
                  </div>

                  {/* Vertical connector (mobile only) */}
                  {i < steps.length - 1 && (
                    <div className="sm:hidden mt-6 w-px h-6 bg-[#E4E2DC] mx-auto" aria-hidden="true" />
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Bottom CTA nudge */}
        <motion.div
          initial={prefersReduced ? false : { opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-14 text-center"
        >
          <a
            href="#features"
            className="inline-flex items-center gap-2 text-[13px] font-medium text-[#626262] hover:text-[#171717] transition-colors"
          >
            See all features
            <span className="text-[#16A36A]">→</span>
          </a>
        </motion.div>
      </div>
    </section>
  );
}
