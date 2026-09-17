import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion, type Variants } from 'framer-motion';
import { ArrowRight, CheckCircle2, Circle, ChevronRight, FileText, Zap } from 'lucide-react';

// Animated ATS score counter
function ATSScoreCounter({ target }: { target: number }) {
  const [count, setCount] = useState(0);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    if (prefersReduced) {
      setCount(target);
      return;
    }
    const duration = 1400;
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    };
    const timer = setTimeout(() => requestAnimationFrame(tick), 600);
    return () => clearTimeout(timer);
  }, [target, prefersReduced]);

  return <>{count}</>;
}

// Animated progress ring
function ScoreRing({ score }: { score: number }) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center w-24 h-24">
      <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
        <circle
          cx="50" cy="50" r={radius}
          stroke="#E4E2DC" strokeWidth="7" fill="none"
        />
        <circle
          cx="50" cy="50" r={radius}
          stroke="#16A36A" strokeWidth="7" fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-[1400ms] ease-out"
          style={{ transitionDelay: '0.6s' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold text-[#171717] tabular-nums leading-none">
          <ATSScoreCounter target={score} />
        </span>
        <span className="text-[9px] font-semibold text-[#626262] uppercase tracking-wide mt-0.5">Score</span>
      </div>
    </div>
  );
}

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: i * 0.1, ease: [0.25, 0.1, 0.25, 1] as const },
  }),
};

export function HeroSection() {
  const prefersReduced = useReducedMotion();

  const matchedSkills = ['Java', 'React', 'REST APIs', 'SQL'];
  const missingSkills = ['Docker', 'AWS'];

  return (
    <section
      className="relative min-h-screen flex items-center bg-[#F7F6F2] pt-20 pb-16 md:pt-28 md:pb-20 overflow-hidden"
      aria-label="Hero"
    >
      {/* Subtle texture overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage: 'radial-gradient(circle, #171717 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* ── Left: Copy ── */}
          <div className="text-left">
            {/* Eyebrow */}
            <motion.div
              variants={fadeUp}
              initial={prefersReduced ? false : 'hidden'}
              animate="visible"
              custom={0}
            >
              <span className="inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.12em] uppercase text-[#16A36A] bg-[#E3F6ED] border border-[#B2EACF] px-3 py-1.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-[#16A36A] inline-block" />
                Resume Intelligence
              </span>
            </motion.div>

            {/* H1 */}
            <motion.h1
              variants={fadeUp}
              initial={prefersReduced ? false : 'hidden'}
              animate="visible"
              custom={1}
              className="mt-5 text-[2.9rem] sm:text-[3.5rem] md:text-[4rem] lg:text-[3.6rem] xl:text-[4.2rem] font-bold text-[#171717] leading-[1.08] tracking-[-0.02em]"
            >
              Make Your Resume<br />
              <span className="text-[#16A36A]">Work Harder.</span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              variants={fadeUp}
              initial={prefersReduced ? false : 'hidden'}
              animate="visible"
              custom={2}
              className="mt-5 text-[1.05rem] text-[#626262] leading-relaxed max-w-lg font-normal"
            >
              Understand your resume, match it to the job, and improve what matters — with clear, AI-powered resume intelligence.
            </motion.p>

            {/* CTAs */}
            <motion.div
              variants={fadeUp}
              initial={prefersReduced ? false : 'hidden'}
              animate="visible"
              custom={3}
              className="mt-8 flex flex-col sm:flex-row gap-3"
            >
              <Link
                to="/signup"
                id="hero-primary-cta"
                className="inline-flex items-center justify-center gap-2 bg-[#171717] hover:bg-[#16A36A] text-white font-semibold text-[15px] px-6 py-3.5 rounded-xl transition-all duration-200 group shadow-sm hover:shadow-md"
              >
                Analyze My Resume
                <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <a
                href="#how-it-works"
                id="hero-secondary-cta"
                className="inline-flex items-center justify-center gap-1.5 text-[#171717] bg-white hover:bg-[#F7F6F2] border border-[#E4E2DC] font-medium text-[15px] px-6 py-3.5 rounded-xl transition-all duration-200 group"
              >
                See How It Works
                <ChevronRight className="h-4 w-4 text-[#626262] group-hover:translate-x-0.5 transition-transform" />
              </a>
            </motion.div>

            {/* Trust micro-copy */}
            <motion.p
              variants={fadeUp}
              initial={prefersReduced ? false : 'hidden'}
              animate="visible"
              custom={4}
              className="mt-5 text-[12px] text-[#909090] font-medium"
            >
              No credit card required · Your resume stays private
            </motion.p>
          </div>

          {/* ── Right: Product Visualization ── */}
          <motion.div
            initial={prefersReduced ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
            className="relative"
          >
            {/* Main card */}
            <div className="bg-white border border-[#E4E2DC] rounded-2xl shadow-ecv-card overflow-hidden">
              {/* Card header */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E4E2DC] bg-[#FAFAF8]">
                <div className="flex items-center gap-2.5">
                  <div className="flex gap-1.5" aria-hidden="true">
                    <div className="w-3 h-3 rounded-full bg-[#E4E2DC]" />
                    <div className="w-3 h-3 rounded-full bg-[#E4E2DC]" />
                    <div className="w-3 h-3 rounded-full bg-[#E4E2DC]" />
                  </div>
                  <span className="text-[11px] font-medium text-[#909090]">ElevateCV — Resume Analysis</span>
                </div>
                <span className="text-[10px] font-semibold text-[#16A36A] bg-[#E3F6ED] px-2 py-0.5 rounded-full">Live</span>
              </div>

              <div className="p-5 space-y-4">
                {/* Resume name row */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-[#F7F6F2] border border-[#E4E2DC]">
                  <div className="w-9 h-9 rounded-lg bg-[#E3F6ED] flex items-center justify-center flex-shrink-0">
                    <FileText className="h-4 w-4 text-[#16A36A]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-[#171717] truncate">Software_Engineer_Resume.pdf</p>
                    <p className="text-[11px] text-[#909090]">Uploaded · Analyzed · Ready</p>
                  </div>
                  <span className="flex-shrink-0 text-[11px] font-semibold text-[#16A36A]">✓</span>
                </div>

                {/* ATS Score + Skill Match row */}
                <div className="grid grid-cols-2 gap-3">
                  {/* ATS Score */}
                  <div className="p-4 rounded-xl border border-[#E4E2DC] bg-white flex flex-col items-center gap-1">
                    <p className="text-[10px] font-bold tracking-widest uppercase text-[#626262] mb-1">ATS Match</p>
                    <ScoreRing score={84} />
                    <p className="text-[11px] font-semibold text-[#16A36A] mt-1">Strong alignment</p>
                  </div>

                  {/* Skills panel */}
                  <div className="p-4 rounded-xl border border-[#E4E2DC] bg-white flex flex-col gap-2.5">
                    <div>
                      <p className="text-[10px] font-bold tracking-widest uppercase text-[#626262] mb-2">Matched</p>
                      <div className="space-y-1.5">
                        {matchedSkills.map((skill) => (
                          <div key={skill} className="flex items-center gap-1.5">
                            <CheckCircle2 className="h-3.5 w-3.5 text-[#16A36A] flex-shrink-0" />
                            <span className="text-[12px] font-medium text-[#171717]">{skill}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="border-t border-[#E4E2DC] pt-2">
                      <p className="text-[10px] font-bold tracking-widest uppercase text-[#909090] mb-1.5">Missing</p>
                      <div className="space-y-1.5">
                        {missingSkills.map((skill) => (
                          <div key={skill} className="flex items-center gap-1.5">
                            <Circle className="h-3.5 w-3.5 text-[#C9C6BE] flex-shrink-0" />
                            <span className="text-[12px] font-medium text-[#909090]">{skill}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* AI Suggestion */}
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[#E3F6ED] border border-[#B2EACF]">
                  <div className="w-7 h-7 rounded-lg bg-[#16A36A] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Zap className="h-3.5 w-3.5 text-white" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-[#0E7A50] mb-0.5">AI Suggestion</p>
                    <p className="text-[12px] text-[#171717] leading-relaxed">
                      Add Docker and AWS to your skills section to increase your match score by ~12 points.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating badge — keyword match */}
            <motion.div
              animate={prefersReduced ? {} : { y: [0, -6, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -bottom-4 -left-4 bg-white border border-[#E4E2DC] rounded-xl px-3.5 py-2.5 shadow-ecv-card hidden sm:block"
              aria-hidden="true"
            >
              <p className="text-[10px] font-bold text-[#626262] uppercase tracking-wide mb-0.5">Keyword Coverage</p>
              <div className="flex items-baseline gap-1">
                <span className="text-[20px] font-bold text-[#171717] leading-none">68</span>
                <span className="text-[11px] text-[#909090]">/ 100</span>
              </div>
              <div className="mt-1.5 h-1.5 bg-[#E4E2DC] rounded-full overflow-hidden w-24">
                <div className="h-full bg-[#16A36A] rounded-full" style={{ width: '68%' }} />
              </div>
            </motion.div>

            {/* Floating badge — improvements */}
            <motion.div
              animate={prefersReduced ? {} : { y: [0, 5, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
              className="absolute -top-4 -right-4 bg-white border border-[#E4E2DC] rounded-xl px-3.5 py-2.5 shadow-ecv-card hidden sm:block"
              aria-hidden="true"
            >
              <p className="text-[10px] font-bold text-[#626262] uppercase tracking-wide mb-0.5">Improvements</p>
              <p className="text-[20px] font-bold text-[#171717] leading-none">7 <span className="text-[12px] font-medium text-[#16A36A]">ready</span></p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
