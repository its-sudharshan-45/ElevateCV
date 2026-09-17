import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { ArrowRight, ChevronRight } from 'lucide-react';

export function AboutAndCtaSection() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });
  const prefersReduced = useReducedMotion();

  return (
    <section
      ref={ref}
      id="final-cta"
      className="py-20 md:py-28 bg-white"
      aria-labelledby="final-cta-heading"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Dark CTA block */}
        <motion.div
          initial={prefersReduced ? false : { opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="relative bg-[#171717] rounded-3xl overflow-hidden px-8 py-14 sm:px-14 sm:py-16 text-center"
        >
          {/* Subtle dot pattern overlay */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.04]"
            style={{
              backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
            aria-hidden="true"
          />

          {/* Emerald accent glow — very subtle */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-32 rounded-full blur-3xl pointer-events-none"
            style={{ background: 'rgba(22,163,106,0.12)' }}
            aria-hidden="true"
          />

          <div className="relative z-10 max-w-2xl mx-auto">
            {/* Eyebrow */}
            <motion.span
              initial={prefersReduced ? false : { opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.12em] uppercase text-[#16A36A] bg-[#16A36A]/10 border border-[#16A36A]/20 px-3 py-1.5 rounded-full mb-6"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#16A36A] inline-block" />
              Get Started Today
            </motion.span>

            <motion.h2
              id="final-cta-heading"
              initial={prefersReduced ? false : { opacity: 0, y: 14 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.55, delay: 0.2 }}
              className="text-[2rem] sm:text-[2.6rem] font-bold text-white tracking-[-0.02em] leading-tight mb-5"
            >
              Ready to Improve<br />Your Resume?
            </motion.h2>

            <motion.p
              initial={prefersReduced ? false : { opacity: 0, y: 14 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.55, delay: 0.3 }}
              className="text-[15px] text-[#A0A09A] leading-relaxed max-w-lg mx-auto mb-8"
            >
              Stop guessing what to change. Upload your resume and discover where you can improve for the role you want.
            </motion.p>

            <motion.div
              initial={prefersReduced ? false : { opacity: 0, y: 14 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.55, delay: 0.4 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-3"
            >
              <Link
                to="/signup"
                id="final-cta-primary"
                className="inline-flex items-center justify-center gap-2 bg-[#16A36A] hover:bg-[#0E7A50] text-white font-semibold text-[15px] px-7 py-3.5 rounded-xl transition-all duration-200 group shadow-lg shadow-[#16A36A]/20 hover:shadow-xl hover:shadow-[#16A36A]/25 w-full sm:w-auto"
              >
                Analyze My Resume
                <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                to="/signup"
                id="final-cta-secondary"
                className="inline-flex items-center justify-center gap-1.5 text-white/80 hover:text-white border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 font-medium text-[15px] px-7 py-3.5 rounded-xl transition-all duration-200 group w-full sm:w-auto"
              >
                Get Started Free
                <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </motion.div>

            {/* Trust micro-copy */}
            <motion.p
              initial={prefersReduced ? false : { opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ duration: 0.5, delay: 0.55 }}
              className="mt-6 text-[12px] text-[#626262] font-medium"
            >
              No credit card required · Your data stays private
            </motion.p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
