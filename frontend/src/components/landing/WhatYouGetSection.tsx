import React, { useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { BarChart3, SlidersHorizontal, ListChecks, Copy } from 'lucide-react';

const deliverables = [
  {
    id: 'insights',
    icon: BarChart3,
    label: 'Resume Insights',
    description: "Understand your resume's strengths and weaknesses. Know what's working before you apply.",
    tag: 'Instant',
  },
  {
    id: 'match',
    icon: SlidersHorizontal,
    label: 'Job Match Analysis',
    description: 'See how closely your resume aligns with a specific role. Real ATS alignment, not estimates.',
    tag: 'Per Job',
  },
  {
    id: 'improvements',
    icon: ListChecks,
    label: 'Actionable Improvements',
    description: 'Know exactly what to improve before you apply — with specific, grounded suggestions.',
    tag: 'Prioritized',
  },
  {
    id: 'versions',
    icon: Copy,
    label: 'Targeted Resume Versions',
    description: 'Adapt your resume for different opportunities without starting from scratch each time.',
    tag: 'Flexible',
  },
];

export function WhatYouGetSection() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  const prefersReduced = useReducedMotion();

  return (
    <section
      ref={ref}
      className="py-20 md:py-28 bg-[#F7F6F2]"
      aria-labelledby="what-you-get-heading"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={prefersReduced ? false : { opacity: 0, y: 18 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55 }}
          className="text-center max-w-xl mx-auto mb-12"
        >
          <span className="text-[11px] font-bold tracking-[0.12em] uppercase text-[#626262]">
            What You Get
          </span>
          <h2
            id="what-you-get-heading"
            className="mt-3 text-[2rem] sm:text-[2.5rem] font-bold text-[#171717] tracking-[-0.02em] leading-tight"
          >
            Clear Insights.<br />Better Applications.
          </h2>
          <p className="mt-4 text-[15px] text-[#626262] leading-relaxed">
            ElevateCV gives you the clarity to apply with confidence, not guesswork.
          </p>
        </motion.div>

        {/* Deliverable cards — 2×2 grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {deliverables.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.id}
                initial={prefersReduced ? false : { opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                whileHover={prefersReduced ? {} : { y: -4 }}
                className="bg-white border border-[#E4E2DC] rounded-2xl p-6 hover:border-[#16A36A]/30 hover:shadow-ecv-card-hover transition-all duration-200 group"
              >
                {/* Top row */}
                <div className="flex items-start justify-between mb-4">
                  <div className="w-11 h-11 rounded-xl bg-[#F7F6F2] border border-[#E4E2DC] flex items-center justify-center group-hover:bg-[#E3F6ED] group-hover:border-[#B2EACF] transition-colors">
                    <Icon className="h-5 w-5 text-[#626262] group-hover:text-[#16A36A] transition-colors" />
                  </div>
                  <span className="text-[10px] font-bold tracking-widest uppercase text-[#16A36A] bg-[#E3F6ED] border border-[#B2EACF] px-2.5 py-1 rounded-full">
                    {item.tag}
                  </span>
                </div>

                {/* Text */}
                <h3 className="text-[16px] font-semibold text-[#171717] mb-2">{item.label}</h3>
                <p className="text-[13px] text-[#626262] leading-relaxed">{item.description}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom divider statement */}
        <motion.div
          initial={prefersReduced ? false : { opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.55, delay: 0.5 }}
          className="mt-12 text-center"
        >
          <p className="text-[13px] text-[#909090] max-w-sm mx-auto leading-relaxed">
            Every insight is grounded in your actual resume and the specific job you're targeting.
            No templates. No generic advice.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
