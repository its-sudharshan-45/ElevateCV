import React, { useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import {
  FileText,
  Target,
  CheckCircle2,
  Circle,
  Zap,
  GraduationCap,
  Briefcase,
  Award,
  ChevronRight,
} from 'lucide-react';

// Feature 1: Resume Intelligence — document breakdown mock
function ResumeIntelligenceVisual() {
  const sections = [
    { label: 'Experience', icon: Briefcase, count: '3 roles', color: '#E3F6ED', textColor: '#16A36A' },
    { label: 'Education', icon: GraduationCap, count: '2 degrees', color: '#F7F6F2', textColor: '#626262' },
    { label: 'Skills', icon: Target, count: '18 identified', color: '#F7F6F2', textColor: '#626262' },
    { label: 'Certifications', icon: Award, count: '3 found', color: '#F7F6F2', textColor: '#626262' },
  ];
  return (
    <div className="mt-4 space-y-2" aria-hidden="true">
      {sections.map((s) => {
        const Icon = s.icon;
        return (
          <div
            key={s.label}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg"
            style={{ background: s.color }}
          >
            <Icon className="h-3.5 w-3.5 flex-shrink-0" style={{ color: s.textColor }} />
            <span className="text-[12px] font-medium text-[#171717] flex-1">{s.label}</span>
            <span className="text-[11px] font-semibold" style={{ color: s.textColor }}>{s.count}</span>
          </div>
        );
      })}
    </div>
  );
}

// Feature 2: ATS Match — score bars
function ATSMatchVisual() {
  const categories = [
    { label: 'Technical Skills', pct: 87 },
    { label: 'Industry Keywords', pct: 73 },
    { label: 'Soft Skills', pct: 60 },
    { label: 'Experience Level', pct: 90 },
  ];
  return (
    <div className="mt-4 space-y-3" aria-hidden="true">
      <div className="flex items-baseline gap-2 mb-3">
        <span className="text-4xl font-bold text-[#171717] leading-none tabular-nums">84</span>
        <span className="text-base text-[#626262]">/ 100</span>
        <span className="ml-auto text-[11px] font-semibold text-[#16A36A] bg-[#E3F6ED] px-2 py-0.5 rounded-full">Strong</span>
      </div>
      {categories.map((c) => (
        <div key={c.label}>
          <div className="flex justify-between mb-1">
            <span className="text-[11px] text-[#626262]">{c.label}</span>
            <span className="text-[11px] font-semibold text-[#171717]">{c.pct}%</span>
          </div>
          <div className="h-1.5 bg-[#E4E2DC] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-[#16A36A] transition-all duration-700"
              style={{ width: `${c.pct}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// Feature 3: Skill Gaps
function SkillGapsVisual() {
  const matched = ['Java', 'React', 'REST APIs', 'SQL', 'Git'];
  const missing = ['Docker', 'AWS', 'Kubernetes'];
  return (
    <div className="mt-4" aria-hidden="true">
      <p className="text-[10px] font-bold uppercase tracking-widest text-[#626262] mb-2">Matched Skills</p>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {matched.map((s) => (
          <span
            key={s}
            className="inline-flex items-center gap-1 text-[11px] font-medium bg-[#E3F6ED] text-[#0E7A50] px-2 py-0.5 rounded-full border border-[#B2EACF]"
          >
            <CheckCircle2 className="h-3 w-3" />
            {s}
          </span>
        ))}
      </div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-[#C9C6BE] mb-2">Missing Keywords</p>
      <div className="flex flex-wrap gap-1.5">
        {missing.map((s) => (
          <span
            key={s}
            className="inline-flex items-center gap-1 text-[11px] font-medium bg-[#F7F6F2] text-[#909090] px-2 py-0.5 rounded-full border border-[#E4E2DC]"
          >
            <Circle className="h-3 w-3" />
            {s}
          </span>
        ))}
      </div>
    </div>
  );
}

// Feature 4: AI Improvements — before/after
function AIImprovementsVisual() {
  return (
    <div className="mt-4 space-y-3" aria-hidden="true">
      <div className="rounded-xl border border-[#E4E2DC] overflow-hidden">
        <div className="px-3 py-1.5 bg-[#F7F6F2] border-b border-[#E4E2DC]">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#C9C6BE]">Before</span>
        </div>
        <div className="px-3 py-2.5">
          <p className="text-[12px] text-[#909090] leading-relaxed line-through decoration-[#C9C6BE]">
            Worked on backend systems and fixed bugs in the API layer.
          </p>
        </div>
      </div>
      <div className="flex justify-center">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#16A36A]">
          <Zap className="h-3.5 w-3.5" />
          AI Improvement
        </div>
      </div>
      <div className="rounded-xl border border-[#B2EACF] overflow-hidden bg-[#E3F6ED]/40">
        <div className="px-3 py-1.5 bg-[#E3F6ED] border-b border-[#B2EACF]">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#16A36A]">Improved</span>
        </div>
        <div className="px-3 py-2.5">
          <p className="text-[12px] text-[#171717] leading-relaxed font-medium">
            Reduced API response latency by 35% by refactoring query logic and adding Redis caching.
          </p>
        </div>
      </div>
    </div>
  );
}

const features = [
  {
    id: 'intelligence',
    label: 'Resume Intelligence',
    description:
      'Understand your skills, education, experience, projects, and certifications in one clear view.',
    icon: FileText,
    visual: <ResumeIntelligenceVisual />,
    accent: false,
  },
  {
    id: 'ats',
    label: 'ATS Job Analysis',
    description:
      'Compare your resume with a specific job description and see how well you align.',
    icon: Target,
    visual: <ATSMatchVisual />,
    accent: false,
  },
  {
    id: 'gaps',
    label: 'Skill & Keyword Gaps',
    description:
      'Identify important skills and keywords you may be missing from the job description.',
    icon: CheckCircle2,
    visual: <SkillGapsVisual />,
    accent: false,
  },
  {
    id: 'ai',
    label: 'AI-Powered Improvements',
    description:
      'Get practical suggestions to make your resume clearer, stronger, and more relevant — without inventing experience.',
    icon: Zap,
    visual: <AIImprovementsVisual />,
    accent: true,
  },
];

export function FeaturesSection() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  const prefersReduced = useReducedMotion();

  return (
    <section
      id="features"
      ref={ref}
      className="py-20 md:py-28 bg-white"
      aria-labelledby="features-heading"
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
            Capabilities
          </span>
          <h2
            id="features-heading"
            className="mt-3 text-[2rem] sm:text-[2.5rem] font-bold text-[#171717] tracking-[-0.02em] leading-tight"
          >
            Everything You Need to<br />Improve Your Resume.
          </h2>
        </motion.div>

        {/* Bento grid — 2×2 on desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {features.map((feat, i) => {
            const Icon = feat.icon;
            return (
              <motion.div
                key={feat.id}
                initial={prefersReduced ? false : { opacity: 0, y: 22 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                whileHover={prefersReduced ? {} : { y: -4 }}
                className="bg-white border border-[#E4E2DC] rounded-2xl p-6 hover:border-[#16A36A]/30 hover:shadow-ecv-card-hover transition-all duration-250 cursor-default"
              >
                {/* Card header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        feat.accent
                          ? 'bg-[#E3F6ED] border border-[#B2EACF]'
                          : 'bg-[#F7F6F2] border border-[#E4E2DC]'
                      }`}
                    >
                      <Icon
                        className={`h-5 w-5 ${feat.accent ? 'text-[#16A36A]' : 'text-[#626262]'}`}
                      />
                    </div>
                    <div>
                      <h3 className="text-[15px] font-semibold text-[#171717] leading-snug">
                        {feat.label}
                      </h3>
                      <p className="mt-1 text-[13px] text-[#626262] leading-relaxed max-w-xs">
                        {feat.description}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-[#C9C6BE] flex-shrink-0 mt-0.5" />
                </div>

                {/* Visual */}
                {feat.visual}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
