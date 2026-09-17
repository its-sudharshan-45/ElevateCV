import React, { useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { Eye, Focus, PenLine, Ban } from 'lucide-react';

const benefits = [
  {
    id: 'know',
    icon: Eye,
    label: 'Know What Matters',
    description:
      'See what recruiters and ATS systems are likely to look for — so you focus your energy where it counts.',
  },
  {
    id: 'focus',
    icon: Focus,
    label: 'Focus Your Effort',
    description:
      'Prioritize the skills and keywords that matter for your target role instead of guessing.',
  },
  {
    id: 'present',
    icon: PenLine,
    label: 'Present Your Experience Better',
    description:
      'Turn unclear resume content into stronger, more relevant presentation without inventing anything.',
  },
  {
    id: 'guess',
    icon: Ban,
    label: 'Stop Guessing',
    description:
      'Make informed improvements instead of guessing what to change. Every suggestion is grounded in the job.',
  },
];

export function MeasurableProgressSection() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  const prefersReduced = useReducedMotion();

  return (
    <section
      ref={ref}
      className="py-20 md:py-28 bg-white"
      aria-labelledby="benefits-heading"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={prefersReduced ? false : { opacity: 0, y: 18 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55 }}
          className="max-w-2xl mb-12"
        >
          <span className="text-[11px] font-bold tracking-[0.12em] uppercase text-[#626262]">
            Why ElevateCV
          </span>
          <h2
            id="benefits-heading"
            className="mt-3 text-[2rem] sm:text-[2.5rem] font-bold text-[#171717] tracking-[-0.02em] leading-tight"
          >
            Improve With Confidence.
          </h2>
          <p className="mt-4 text-[15px] text-[#626262] leading-relaxed max-w-lg">
            ElevateCV focuses on outcomes, not features. Here's what changes when you use it.
          </p>
        </motion.div>

        {/* Benefit cards — 2×2 grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          {benefits.map((benefit, i) => {
            const Icon = benefit.icon;
            return (
              <motion.div
                key={benefit.id}
                initial={prefersReduced ? false : { opacity: 0, y: 22 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                whileHover={prefersReduced ? {} : { y: -3 }}
                className="flex items-start gap-4 bg-[#F7F6F2] border border-[#E4E2DC] rounded-2xl p-5 hover:border-[#C9C6BE] hover:bg-white transition-all duration-200 group"
              >
                <div className="w-10 h-10 rounded-xl bg-white border border-[#E4E2DC] flex items-center justify-center flex-shrink-0 group-hover:border-[#B2EACF] group-hover:bg-[#E3F6ED] transition-colors">
                  <Icon className="h-5 w-5 text-[#626262] group-hover:text-[#16A36A] transition-colors" />
                </div>
                <div>
                  <h3 className="text-[15px] font-semibold text-[#171717] mb-1">{benefit.label}</h3>
                  <p className="text-[13px] text-[#626262] leading-relaxed">{benefit.description}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Trust statement — visually emphasized */}
        <motion.div
          initial={prefersReduced ? false : { opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55, delay: 0.45 }}
          className="relative border border-[#E4E2DC] rounded-2xl p-7 bg-[#FAFAF8] overflow-hidden"
        >
          {/* Accent left border */}
          <div className="absolute left-0 inset-y-0 w-1 rounded-l-2xl bg-[#16A36A]" aria-hidden="true" />
          <div className="pl-4">
            <p className="text-[18px] sm:text-[20px] font-semibold text-[#171717] leading-snug tracking-[-0.01em] max-w-xl">
              "Your experience stays yours.{' '}
              <span className="text-[#16A36A]">ElevateCV helps you present it better.</span>"
            </p>
            <p className="mt-3 text-[13px] text-[#909090]">
              No fabrication. No invented achievements. Just clearer, stronger communication of what you've already done.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
