import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, ArrowRight } from 'lucide-react';

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Features', href: '#features' },
    { name: 'How It Works', href: '#how-it-works' },
    { name: 'About', href: '#about' },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#F7F6F2]/95 backdrop-blur-md border-b border-[#E4E2DC] shadow-ecv-subtle py-3'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group" aria-label="ElevateCV home">
            <div className="h-8 w-8 rounded-lg bg-[#171717] flex items-center justify-center flex-shrink-0 group-hover:bg-[#16A36A] transition-colors duration-200">
              <span className="text-white text-sm font-bold tracking-tight">E</span>
            </div>
            <span className="text-[17px] font-bold tracking-tight text-[#171717]">
              ElevateCV
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-7" aria-label="Main navigation">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-[13.5px] font-medium text-[#626262] hover:text-[#171717] transition-colors duration-150"
              >
                {link.name}
              </a>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/login"
              className="text-[13.5px] font-medium text-[#626262] hover:text-[#171717] transition-colors duration-150 px-1"
            >
              Log in
            </Link>
            <Link
              to="/signup"
              id="navbar-cta"
              className="inline-flex items-center gap-1.5 bg-[#171717] hover:bg-[#16A36A] text-white text-[13.5px] font-semibold px-4 py-2 rounded-lg transition-all duration-200 group"
            >
              Get Started
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-md text-[#171717] hover:bg-[#E4E2DC]/60 transition-colors"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-2 bg-white border border-[#E4E2DC] rounded-xl shadow-ecv-card overflow-hidden">
            <nav className="flex flex-col p-4 gap-1" aria-label="Mobile navigation">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2.5 text-sm font-medium text-[#171717] hover:bg-[#F7F6F2] rounded-lg transition-colors"
                >
                  {link.name}
                </a>
              ))}
              <div className="mt-3 pt-3 border-t border-[#E4E2DC] flex flex-col gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2.5 text-sm font-medium text-[#626262] hover:bg-[#F7F6F2] rounded-lg transition-colors text-center"
                >
                  Log in
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-1.5 bg-[#171717] text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors hover:bg-[#16A36A]"
                >
                  Get Started
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
