'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Dumbbell, 
  Eye, 
  EyeOff, 
  Lock, 
  Mail, 
  AlertCircle, 
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Zap,
  Flame,
  Layers,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { api } from '@/lib/api';

interface SlideItem {
  id: number;
  tag: string;
  badge: string;
  title: string;
  desc: string;
  image: string;
  stat1: string;
  stat1Label: string;
  stat2: string;
  stat2Label: string;
  accent: string;
}

const SLIDES: SlideItem[] = [
  {
    id: 1,
    tag: 'TITAN IRON ARENA',
    badge: '⚡ HEAVYWEIGHT POWERHOUSE',
    title: 'Forged in Iron, Built for Champions',
    desc: 'Olympic lifting platforms, calibrated steel plates, and an atmosphere forged for pure athletic breakthroughs.',
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1400&auto=format&fit=crop',
    stat1: '5,000+ LBS',
    stat1Label: 'Free Weight Steel',
    stat2: '24/7 Access',
    stat2Label: 'Biometric Turnstiles',
    accent: 'from-[#E8452C] to-[#FF6B4A]'
  },
  {
    id: 2,
    tag: 'SMART MANAGEMENT',
    badge: '🛡️ REAL-TIME FRONT DESK POS',
    title: 'Seamless Access & Instant Check-in',
    desc: 'Automated turnstiles, Telebirr & CBE integrated billing, and real-time member capacity intelligence.',
    image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=1400&auto=format&fit=crop',
    stat1: '0.4s',
    stat1Label: 'Check-in Speed',
    stat2: '100% Ethiopian',
    stat2Label: 'Calendar & Payments',
    accent: 'from-amber-500 to-[#E8452C]'
  },
  {
    id: 3,
    tag: 'COMBAT & PERFORMANCE',
    badge: '🥊 PRO RING & HIIT ARENA',
    title: 'Break Past Every Limitation',
    desc: 'Full-size boxing ring, high-impact heavy bags, sprint tracks, and expert strength & conditioning coaches.',
    image: 'https://images.unsplash.com/photo-1549060279-7e168fcee0c2?q=80&w=1400&auto=format&fit=crop',
    stat1: '48+',
    stat1Label: 'Weekly Group Classes',
    stat2: '12 Master',
    stat2Label: 'Certified Trainers',
    accent: 'from-red-600 to-rose-500'
  },
  {
    id: 4,
    tag: 'FUEL & RECOVERY',
    badge: '🔥 PRO-SHOP & NUTRITION',
    title: 'Elite Supplements & Nutrition',
    desc: 'Premium whey protein, BCAAs, creatine, gym apparel, and hydration station directly integrated with desk checkout.',
    image: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=1400&auto=format&fit=crop',
    stat1: '120+ Items',
    stat1Label: 'Pro-Shop Catalog',
    stat2: 'Live Inventory',
    stat2Label: 'Low-Stock Alerts',
    accent: 'from-orange-500 to-red-600'
  }
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // 3D Scroll & Mouse Tilt States
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [targetProgress, setTargetProgress] = useState(0);
  const [mouseTilt, setMouseTilt] = useState({ x: 0, y: 0 });
  const [isHoveringShowcase, setIsHoveringShowcase] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const isWheelingRef = useRef(false);
  const touchStartYRef = useRef(0);

  // Smooth lerp interpolation for 3D scroll momentum
  useEffect(() => {
    let animId: number;
    const lerpSpeed = 0.12;

    const tick = () => {
      setScrollProgress(prev => {
        const diff = targetProgress - prev;
        if (Math.abs(diff) < 0.001) return targetProgress;
        return prev + diff * lerpSpeed;
      });
      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [targetProgress]);

  // Update active slide index based on progress
  useEffect(() => {
    const rounded = Math.round(targetProgress);
    if (rounded !== currentSlideIndex && rounded >= 0 && rounded < SLIDES.length) {
      setCurrentSlideIndex(rounded);
    }
  }, [targetProgress, currentSlideIndex]);

  // Wheel listener for 3D scroll
  const handleWheel = useCallback((e: WheelEvent) => {
    // Prevent erratic trackpad leaps
    const delta = Math.sign(e.deltaY);
    if (delta !== 0) {
      e.preventDefault();
      setTargetProgress(prev => {
        const next = prev + delta * 0.45;
        return Math.max(0, Math.min(SLIDES.length - 1, next));
      });
    }
  }, []);

  // Attach wheel listener to 3D container
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  // Touch gesture support for mobile / tablet
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touchY = e.touches[0].clientY;
    const diff = touchStartYRef.current - touchY;
    if (Math.abs(diff) > 30) {
      const dir = diff > 0 ? 1 : -1;
      setTargetProgress(prev => Math.max(0, Math.min(SLIDES.length - 1, prev + dir * 0.8)));
      touchStartYRef.current = touchY;
    }
  };

  // 3D Mouse Parallax for Showcase
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMouseTilt({ x, y });
  };

  const handleMouseLeave = () => {
    setMouseTilt({ x: 0, y: 0 });
    setIsHoveringShowcase(false);
  };

  // 3D Glass Form Tilt States & Handlers
  const [formTilt, setFormTilt] = useState({ x: 0, y: 0 });
  const [isHoveringForm, setIsHoveringForm] = useState(false);

  const handleFormMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setFormTilt({ x, y });
  };

  const handleFormMouseLeave = () => {
    setFormTilt({ x: 0, y: 0 });
    setIsHoveringForm(false);
  };

  // Jump to specific slide
  const goToSlide = (idx: number) => {
    setTargetProgress(idx);
  };

  const handleNextSlide = () => {
    setTargetProgress(prev => Math.min(SLIDES.length - 1, Math.floor(prev + 1)));
  };

  const handlePrevSlide = () => {
    setTargetProgress(prev => Math.max(0, Math.ceil(prev - 1)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.login(email.trim(), password);
      if (res.user.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/reception');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0D14] text-white flex flex-col relative overflow-x-hidden selection:bg-[#E8452C] selection:text-white">
      {/* Dynamic Ambient Background Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div 
          className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-[#E8452C]/15 blur-[140px] transition-transform duration-1000 ease-out"
          style={{
            transform: `translate3d(${mouseTilt.x * 60}px, ${mouseTilt.y * 60}px, 0)`
          }}
        />
        <div 
          className="absolute top-1/2 -right-40 w-[550px] h-[550px] rounded-full bg-rose-600/10 blur-[160px] transition-transform duration-1000 ease-out"
          style={{
            transform: `translate3d(${-mouseTilt.x * 50}px, ${-mouseTilt.y * 50}px, 0)`
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />
      </div>

      {/* Top Header Navigation */}
      <header className="relative z-20 w-full px-6 py-5 flex items-center justify-between border-b border-white/5 backdrop-blur-md bg-[#0A0D14]/70">
        <Link
          href="/"
          className="group inline-flex items-center gap-2.5 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-white transition-colors"
        >
          <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-[#E8452C] group-hover:border-[#E8452C] group-hover:text-white transition-all shadow-xs">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          </div>
          <span>Return to Website</span>
        </Link>

        {/* Brand identity badge */}
        <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity" title="Back to Landing Page">
          <div className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-tr from-[#E8452C] to-[#FF6B4A] text-white shadow-md shadow-[#E8452C]/30">
            <Dumbbell className="w-4 h-4 -rotate-45" />
          </div>
          <span className="text-base font-black tracking-tight heading-font">
            TITAN<span className="text-[#E8452C]">GYM</span>
          </span>
          <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-white/10 border border-white/10 text-slate-300">
            Staff Portal
          </span>
        </Link>

        {/* Security indicator */}
        <div className="flex items-center gap-2 text-slate-400 text-xs">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="hidden md:inline font-mono text-[11px] text-emerald-400">256-Bit Encrypted</span>
        </div>
      </header>

      {/* Main Container: Centered on mobile, dual-column on desktop */}
      <main className="relative z-10 flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10 flex flex-col justify-center lg:grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        
        {/* ============================================================== */}
        {/* LEFT COLUMN: 3D SCROLL SHOWCASE (Hidden on mobile, visible on desktop) */}
        {/* ============================================================== */}
        <div 
          ref={containerRef}
          onMouseMove={handleMouseMove}
          onMouseEnter={() => setIsHoveringShowcase(true)}
          onMouseLeave={handleMouseLeave}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          className="hidden lg:flex lg:col-span-7 flex-col justify-center relative perspective-1200 preserve-3d select-none"
        >
          {/* Top Bar for 3D Showcase */}
          <div className="flex items-center justify-between mb-4 px-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#E8452C] animate-ping" />
              <span className="text-xs font-black uppercase tracking-widest text-[#E8452C]">
                3D Interactive Showcase
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-slate-400">
                0{Math.min(SLIDES.length, Math.max(1, Math.round(scrollProgress) + 1))} / 0{SLIDES.length}
              </span>
            </div>
          </div>

          {/* 3D Viewport / Stage */}
          <div className="relative w-full h-[360px] sm:h-[440px] md:h-[480px] lg:h-[520px] rounded-3xl preserve-3d">
            {SLIDES.map((slide, index) => {
              // Calculate spatial distance from continuous scrollProgress
              const dist = index - scrollProgress;
              const absDist = Math.abs(dist);

              // 3D Matrix Math
              const rotateX = Math.max(-45, Math.min(45, dist * 22)) + (isHoveringShowcase ? mouseTilt.y * -8 : 0);
              const rotateY = Math.max(-35, Math.min(35, dist * -14)) + (isHoveringShowcase ? mouseTilt.x * 10 : 0);
              const rotateZ = dist * -3;
              const translateY = dist * 90;
              const translateZ = -absDist * 160;
              const scale = Math.max(0.65, 1 - absDist * 0.16);
              const opacity = Math.max(0, 1 - absDist * 0.55);
              const zIndex = Math.round(30 - absDist * 10);
              const isActive = Math.round(scrollProgress) === index;

              return (
                <div
                  key={slide.id}
                  style={{
                    transform: `perspective(1200px) translateY(${translateY}px) translateZ(${translateZ}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg) scale(${scale})`,
                    opacity: opacity,
                    zIndex: zIndex,
                    pointerEvents: absDist < 0.6 ? 'auto' : 'none',
                    transition: 'opacity 0.25s ease-out',
                  }}
                  className="absolute inset-0 w-full h-full rounded-3xl overflow-hidden shadow-2xl preserve-3d border border-white/10 bg-slate-900 group"
                >
                  {/* High-Resolution Gym Photo */}
                  <img
                    src={slide.image}
                    alt={slide.title}
                    className="w-full h-full object-cover brightness-[0.82] contrast-[1.08] group-hover:scale-105 transition-transform duration-700 ease-out"
                  />

                  {/* Dark Vignette and Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0A0D14] via-[#0A0D14]/40 to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#0A0D14]/70 via-transparent to-[#0A0D14]/30" />

                  {/* Specular Glare Effect driven by Mouse */}
                  <div 
                    className="absolute inset-0 pointer-events-none opacity-30 mix-blend-overlay transition-opacity duration-300"
                    style={{
                      background: `radial-gradient(circle at ${(mouseTilt.x + 0.5) * 100}% ${(mouseTilt.y + 0.5) * 100}%, rgba(255,255,255,0.6) 0%, transparent 60%)`
                    }}
                  />

                  {/* Top Floating Holographic Badge (High 3D Z translation for stereoscopic depth) */}
                  <div 
                    style={{ transform: 'translateZ(45px)' }}
                    className="absolute top-5 left-5 right-5 flex items-center justify-between"
                  >
                    <span className="px-3.5 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-black/60 backdrop-blur-md border border-white/20 text-white shadow-lg flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-[#E8452C]" />
                      {slide.badge}
                    </span>
                    <span className="px-3 py-1 rounded-lg text-[10px] font-mono font-bold bg-white/10 backdrop-blur-md text-slate-300 border border-white/10">
                      STAGE 0{slide.id}
                    </span>
                  </div>

                  {/* Bottom Content Card (Floats at translateZ(55px)) */}
                  <div 
                    style={{ transform: 'translateZ(55px)' }}
                    className="absolute bottom-6 left-6 right-6 space-y-3"
                  >
                    <div className="inline-block px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-widest bg-[#E8452C] text-white shadow-md">
                      {slide.tag}
                    </div>

                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white heading-font tracking-tight leading-tight drop-shadow-md">
                      {slide.title}
                    </h2>

                    <p className="text-xs sm:text-sm text-slate-300 line-clamp-2 max-w-xl font-normal drop-shadow-sm">
                      {slide.desc}
                    </p>

                    {/* Live Facility Stats Strip */}
                    <div className="pt-2 grid grid-cols-2 gap-3 border-t border-white/10 max-w-sm">
                      <div className="p-2 rounded-xl bg-black/40 backdrop-blur-md border border-white/10">
                        <span className="block text-sm sm:text-base font-extrabold text-[#FF6B4A] heading-font">
                          {slide.stat1}
                        </span>
                        <span className="text-[10px] uppercase font-bold text-slate-400">
                          {slide.stat1Label}
                        </span>
                      </div>
                      <div className="p-2 rounded-xl bg-black/40 backdrop-blur-md border border-white/10">
                        <span className="block text-sm sm:text-base font-extrabold text-white heading-font">
                          {slide.stat2}
                        </span>
                        <span className="text-[10px] uppercase font-bold text-slate-400">
                          {slide.stat2Label}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Active Card Neon Rim Border */}
                  {isActive && (
                    <div className="absolute inset-0 rounded-3xl border-2 border-[#E8452C]/60 shadow-[0_0_35px_rgba(232,69,44,0.35)] pointer-events-none" />
                  )}
                </div>
              );
            })}
          </div>

          {/* 3D Navigation Controls Bar */}
          <div className="mt-5 flex items-center justify-between px-2">
            {/* Slide Indicators / Pills */}
            <div className="flex items-center gap-2">
              {SLIDES.map((s, idx) => {
                const isSelected = Math.round(scrollProgress) === idx;
                return (
                  <button
                    key={s.id}
                    onClick={() => goToSlide(idx)}
                    className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                      isSelected 
                        ? 'w-8 bg-gradient-to-r from-[#E8452C] to-[#FF6B4A] shadow-md shadow-[#E8452C]/40' 
                        : 'w-2.5 bg-white/20 hover:bg-white/40'
                    }`}
                    aria-label={`Jump to 3D image ${idx + 1}`}
                  />
                );
              })}
            </div>

            {/* Scroll Hint & Manual Controls */}
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
                <Layers className="w-3.5 h-3.5 text-[#E8452C]" />
                Scroll or drag to navigate 3D space
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={handlePrevSlide}
                  disabled={targetProgress <= 0}
                  className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-slate-300 hover:text-white transition-all cursor-pointer"
                  title="Previous 3D Slide"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button
                  onClick={handleNextSlide}
                  disabled={targetProgress >= SLIDES.length - 1}
                  className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-slate-300 hover:text-white transition-all cursor-pointer"
                  title="Next 3D Slide"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* RIGHT COLUMN: 3D FROSTED GLASS LOGIN CARD (5 Cols on desktop) */}
        {/* ============================================================== */}
        <div className="w-full max-w-md mx-auto lg:max-w-none lg:col-span-5 flex flex-col justify-center relative perspective-1200 preserve-3d my-auto">
          
          {/* Glowing Ambient 3D Light Spheres (behind the glass) */}
          <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-gradient-to-tr from-[#E8452C] to-[#FF6B4A] opacity-40 blur-3xl pointer-events-none animate-pulse" />
          <div className="absolute -bottom-10 -left-10 w-44 h-44 rounded-full bg-gradient-to-tr from-amber-500 to-rose-600 opacity-30 blur-3xl pointer-events-none animate-pulse-slow" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-[#E8452C]/10 blur-[100px] pointer-events-none" />

          {/* 3D Glass Card Container */}
          <div
            onMouseMove={handleFormMouseMove}
            onMouseEnter={() => setIsHoveringForm(true)}
            onMouseLeave={handleFormMouseLeave}
            style={{
              transform: `perspective(1200px) rotateX(${formTilt.y * -14}deg) rotateY(${formTilt.x * 14}deg) translateZ(${isHoveringForm ? 18 : 0}px) scale(${isHoveringForm ? 1.015 : 1})`,
              transition: isHoveringForm ? 'transform 0.12s ease-out' : 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.03) 45%, rgba(10, 13, 20, 0.85) 100%)',
              backdropFilter: 'blur(30px) saturate(190%)',
              WebkitBackdropFilter: 'blur(30px) saturate(190%)',
              boxShadow: isHoveringForm
                ? '0 35px 70px -15px rgba(0, 0, 0, 0.9), 0 0 50px -5px rgba(232, 69, 44, 0.35), inset 0 1px 2px 0 rgba(255, 255, 255, 0.45), inset 0 -1px 2px 0 rgba(0, 0, 0, 0.6)'
                : '0 25px 50px -12px rgba(0, 0, 0, 0.85), 0 0 35px -8px rgba(232, 69, 44, 0.2), inset 0 1px 2px 0 rgba(255, 255, 255, 0.3), inset 0 -1px 2px 0 rgba(0, 0, 0, 0.5)',
            }}
            className="relative rounded-3xl p-6 sm:p-8 border border-white/20 shadow-2xl preserve-3d select-none group"
          >
            {/* Dynamic Specular Light Glare (Glass Surface Reflection) */}
            <div 
              className="absolute inset-0 rounded-3xl pointer-events-none mix-blend-overlay transition-opacity duration-300"
              style={{
                background: `radial-gradient(circle at ${(formTilt.x + 0.5) * 100}% ${(formTilt.y + 0.5) * 100}%, rgba(255,255,255,0.32) 0%, rgba(255,255,255,0.06) 35%, transparent 65%)`,
                opacity: isHoveringForm ? 1 : 0.45
              }}
            />

            {/* Subtle Inner Glass Grid / Frost texture */}
            <div className="absolute inset-0 rounded-3xl bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none opacity-60" />

            {/* Card Header (translateZ(45px) for 3D holographic projection) */}
            <div style={{ transform: 'translateZ(45px)' }} className="mb-6 preserve-3d relative">
              <div className="flex items-center justify-between mb-3.5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-[11px] font-bold shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
                  Staff Authorization Portal
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-slate-400">
                  v2.4 LTS
                </span>
              </div>

              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#E8452C] via-[#FF5538] to-[#FF8A65] p-0.5 shadow-lg shadow-[#E8452C]/35 flex items-center justify-center">
                  <div className="w-full h-full bg-[#0A0D14]/80 rounded-[14px] flex items-center justify-center text-white backdrop-blur-xs">
                    <Dumbbell className="w-5 h-5 text-[#FF6B4A] -rotate-45" />
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-white heading-font tracking-tight">
                    Welcome Back
                  </h1>
                </div>
              </div>

              <p className="text-xs text-slate-300 mt-1 font-medium leading-relaxed">
                Enter your staff credentials to access front desk POS, timetable management, and member analytics.
              </p>
            </div>

            {/* Error Notification Banner (translateZ(35px)) */}
            {error && (
              <div 
                style={{ transform: 'translateZ(35px)' }}
                className="mb-5 p-3.5 rounded-2xl bg-rose-500/20 backdrop-blur-md border border-rose-500/40 text-rose-200 text-xs flex items-start gap-2.5 animate-shake shadow-lg shadow-rose-950/40"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <span className="font-semibold leading-relaxed">{error}</span>
              </div>
            )}

            {/* Login Form (translateZ(30px)) */}
            <form onSubmit={handleSubmit} style={{ transform: 'translateZ(30px)' }} className="space-y-4 preserve-3d">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Staff Email Address
                </label>
                <div className="relative group/input">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within/input:text-[#FF6B4A] transition-colors">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@gym.com"
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white/[0.05] hover:bg-white/[0.08] focus:bg-white/[0.1] border border-white/15 focus:border-[#E8452C] focus:ring-4 focus:ring-[#E8452C]/20 text-white placeholder-slate-400 text-xs sm:text-sm outline-none transition-all font-mono backdrop-blur-md shadow-inner"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                    Password
                  </label>
                  <span className="text-[10px] font-medium text-slate-400">
                    Min 6 characters
                  </span>
                </div>
                <div className="relative group/input">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within/input:text-[#FF6B4A] transition-colors">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-10 py-3 rounded-2xl bg-white/[0.05] hover:bg-white/[0.08] focus:bg-white/[0.1] border border-white/15 focus:border-[#E8452C] focus:ring-4 focus:ring-[#E8452C]/20 text-white placeholder-slate-400 text-xs sm:text-sm outline-none transition-all font-mono backdrop-blur-md shadow-inner"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white transition-colors cursor-pointer"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* 3D Tactile Submit Button (translateZ(50px)) */}
              <div style={{ transform: 'translateZ(50px)' }} className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-[#E8452C] via-[#FF5538] to-[#C7331C] hover:brightness-110 active:brightness-95 active:scale-[0.98] text-white font-black text-xs sm:text-sm uppercase tracking-wider transition-all shadow-[0_12px_28px_-6px_rgba(232,69,44,0.55),_inset_0_1px_1px_rgba(255,255,255,0.45)] hover:shadow-[0_16px_36px_-6px_rgba(232,69,44,0.7),_inset_0_1px_1px_rgba(255,255,255,0.6)] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 group border-t border-white/30"
                >
                  {loading ? (
                    <span>Authenticating Credentials...</span>
                  ) : (
                    <>
                      <span>Sign In to Dashboard</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Card Footer Navigation & Info (translateZ(25px)) */}
            <div style={{ transform: 'translateZ(25px)' }} className="mt-6 pt-5 border-t border-white/10 text-center space-y-3">
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 text-xs font-bold text-slate-200 hover:text-white bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 hover:border-white/25 py-2.5 px-4 rounded-2xl transition-all shadow-md shadow-black/20 w-full group backdrop-blur-md"
              >
                <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform text-[#FF6B4A]" />
                <span>Return to Landing Page (Home)</span>
              </Link>
              <p className="text-[11px] text-slate-400">
                Staff accounts are provisioned by your gym administrator. <br />
                Need help? Contact system support.
              </p>
            </div>
          </div>
        </div>

      </main>

      {/* Subtle Footer Bar */}
      <footer className="relative z-10 w-full px-6 py-4 border-t border-white/5 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-3">
        <Link 
          href="/" 
          suppressHydrationWarning 
          className="hover:text-slate-300 transition-colors"
        >
          © 2026 TITAN GYM MANAGEMENT SYSTEM — All Rights Reserved
        </Link>
        <div className="flex items-center gap-4 text-[11px] text-slate-400">
          <Link href="/" className="hover:text-[#FF6B4A] transition-colors font-semibold">
            Landing Page
          </Link>
          <span>•</span>
          <span>Ethiopian Calendar Integrated</span>
          <span>•</span>
          <span>Telebirr Ready</span>
          <span>•</span>
          <span>Safaricom M-Pesa</span>
        </div>
      </footer>
    </div>
  );
}
