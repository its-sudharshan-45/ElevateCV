import React from 'react';
import { Link } from 'react-router-dom';
import { Linkedin, Github, Mail } from 'lucide-react';

const quickLinks = [
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'About', href: '#about' },
];

const productLinks = [
  { label: 'Resume Intelligence', href: '/signup' },
  { label: 'ATS Analysis', href: '/signup' },
  { label: 'Skill Gaps', href: '/signup' },
  { label: 'AI Improvements', href: '/signup' },
];

const legalLinks = [
  { label: 'Privacy Policy', href: '#' },
  { label: 'Terms of Service', href: '#' },
];

export function Footer() {
  return (
    <footer className="bg-[#171717] text-white" aria-label="Site footer">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main footer content */}
        <div className="py-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8 border-b border-white/[0.07]">
          {/* Brand column */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link to="/" className="flex items-center gap-2.5 mb-4 group" aria-label="ElevateCV home">
              <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center group-hover:bg-[#16A36A] transition-colors">
                <span className="text-white text-sm font-bold">E</span>
              </div>
              <span className="text-[17px] font-bold text-white tracking-tight">ElevateCV</span>
            </Link>
            <p className="text-[13px] text-[#A0A09A] leading-relaxed mb-5 max-w-[220px]">
              Analyze. Match. Improve. Optimize.
            </p>
            {/* Social links */}
            <div className="flex items-center gap-3">
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                aria-label="ElevateCV on LinkedIn"
              >
                <Linkedin className="h-4 w-4 text-[#A0A09A]" />
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                aria-label="ElevateCV on GitHub"
              >
                <Github className="h-4 w-4 text-[#A0A09A]" />
              </a>
              <a
                href="mailto:support@elevatecv.com"
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                aria-label="Email ElevateCV support"
              >
                <Mail className="h-4 w-4 text-[#A0A09A]" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-[#626262] mb-4">
              Quick Links
            </h3>
            <ul className="space-y-2.5">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-[13px] text-[#A0A09A] hover:text-white transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-[#626262] mb-4">
              Product
            </h3>
            <ul className="space-y-2.5">
              {productLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-[13px] text-[#A0A09A] hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal + Contact */}
          <div>
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-[#626262] mb-4">
              Legal
            </h3>
            <ul className="space-y-2.5 mb-6">
              {legalLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-[13px] text-[#A0A09A] hover:text-white transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-[#626262] mb-3">
              Contact
            </h3>
            <a
              href="mailto:support@elevatecv.com"
              className="text-[13px] text-[#A0A09A] hover:text-white transition-colors"
            >
              support@elevatecv.com
            </a>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[12px] text-[#626262]">
            © {new Date().getFullYear()} ElevateCV. All rights reserved.
          </p>
          <p className="text-[12px] text-[#626262]">
            Resume Intelligence · Built for Job Seekers
          </p>
        </div>
      </div>
    </footer>
  );
}
