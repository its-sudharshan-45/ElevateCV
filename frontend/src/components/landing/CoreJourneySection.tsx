import React, { useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { Search, GitCompare, Lightbulb, TrendingUp, ArrowRight } from 'lucide-react';

const journeySteps = [
  {
    id: 'understand',
    label: 'Understand',
    icon: Search,
    description: "See what's in your resume — skills, experience, and gaps at a glance.",
  },
  {
    id: 'match',
    label: 'Match',
    icon: GitCompare,
    description: 'Compare your resume against a specific job description in seconds.',
  },
  {
    id: 'improve',
    label: 'Improve',
    icon: Lightbulb,
    description: 'Get clear, actionable suggestions — not vague advice.',
  },
  {
    id: 'optimize',
    label: 'Optimize',
    icon: TrendingUp,
    description: 'Refine your resume for every opportunity you target.',
  },
];

function JourneyCard({
  step,
  index,
  isLast,
}: {
  step: (typeof journeySteps)[0];
  index: number;
  isLast: boolean;
}) {
  const Icon = step.icon;
  return (
    <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-start gap-4 flex-1 min-w-0 relative">
      {/* Card */}
      <div className="w-full bg-white border border-[#E4E2DC] rounded-2xl p-5 hover:border-[#16A36A]/40 hover:shadow-ecv-card-hover transition-all duration-200 group">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#F7F6F2] border border-[#E4E2DC] flex items-center justify-center flex-shrink-0 group-hover:bg-[#E3F6ED] group-hover:border-[#B2EACF] transition-colors">
            <Icon className="h-5 w-5 text-[#626262] group-hover:text-[#16A36A] transition-colors" />
          </div>
          <div className="pt-0.5 flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold tracking-widest text-[#C9C6BE] uppercase">
                0{index + 1}
              </span>
            </div>
            <h3 className="text-[15px] font-semibold text-[#171717] leading-snug">{step.label}</h3>
            <p className="mt-1 text-[13px] text-[#626262] leading-relaxed">{step.description}</p>
          </div>
        </div>
      </div>

      {/* Arrow connector between cards (desktop) */}
      {!isLast && (
        <div className="hidden lg:flex items-center justify-center h-5 w-full mt-1" aria-hidden="true">
          <div className="w-px h-5 bg-[#E4E2DC]" />
        </div>
      )}
      {!isLast && (
        <ArrowRight
          className="hidden sm:block lg:hidden flex-shrink-0 h-4 w-4 text-[#C9C6BE] mx-1"
          aria-hidden="true"
        />
      )}
    </div>
  );
}

export function CoreJourneySection() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  const prefersReduced = useReducedMotion();

  return (
    <section
      id="about"
      ref={ref}
      className="py-20 md:py-28 bg-[#F7F6F2]"
      aria-labelledby="value-prop-heading"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={prefersReduced ? false : { opacity: 0, y: 18 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55 }}
          className="max-w-2xl"
        >
          <span className="text-[11px] font-bold tracking-[0.12em] uppercase text-[#626262]">
            How It Works
          </span>
          <h2
            id="value-prop-heading"
            className="mt-3 text-[2rem] sm:text-[2.5rem] font-bold text-[#171717] tracking-[-0.02em] leading-tight"
          >
            Know Where Your<br />Resume Stands.
          </h2>
          <p className="mt-4 text-[15px] text-[#626262] leading-relaxed max-w-xl">
            A polished resume can still miss important job requirements. ElevateCV shows how your resume fits the role you want, so you know what is strong, what is missing, and what to improve.
          </p>
        </motion.div>

        {/* Journey cards — vertical on mobile, 2-col on md, 4-col on lg */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {journeySteps.map((step, i) => (
            <motion.div
              key={step.id}
              initial={prefersReduced ? false : { opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <JourneyCard step={step} index={i} isLast={i === journeySteps.length - 1} />
            </motion.div>
          ))}
        </div>

        {/* Core journey tagline */}
        <motion.div
          initial={prefersReduced ? false : { opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-10 flex items-center gap-3"
        >
          <div className="h-px flex-1 bg-[#E4E2DC]" />
          <span className="text-[12px] font-semibold text-[#909090] whitespace-nowrap tracking-wide">
            Understand → Match → Improve → Optimize
          </span>
          <div className="h-px flex-1 bg-[#E4E2DC]" />
        </motion.div>
      </div>
    </section>
  );
}
