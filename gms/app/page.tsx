'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  Dumbbell, 
  Clock, 
  MapPin, 
  Phone, 
  Mail, 
  CheckCircle, 
  ChevronDown, 
  ChevronUp,
  Menu, 
  X, 
  Users, 
  Award, 
  Calendar,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Info,
  Flame,
  Star,
  Activity,
  Check,
  Calculator,
  HeartPulse,
  Compass,
  ShoppingBag
} from 'lucide-react';
import { api } from '@/lib/api';

export default function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [timetable, setTimetable] = useState<any[]>([]);
  const [equipment, setEquipment] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(1);
  const [activeSessionDetail, setActiveSessionDetail] = useState<any | null>(null);
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [productCategoryFilter, setProductCategoryFilter] = useState('all');

  // Interactive BMI Calculator State
  const [bmiGender, setBmiGender] = useState<'male' | 'female'>('male');
  const [bmiHeight, setBmiHeight] = useState<number>(176);
  const [bmiWeight, setBmiWeight] = useState<number>(74);

  // Timetable discipline filter
  const [disciplineFilter, setDisciplineFilter] = useState('all');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    async function loadData() {
      try {
        const [timeData, eqData] = await Promise.all([
          api.getPublicTimetable(),
          api.getPublicProducts()
        ]);
        setTimetable(timeData || []);
        setEquipment(eqData || []);
      } catch (err) {
        console.error("Failed to load public data", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Calculated BMI values
  const bmiResult = useMemo(() => {
    const heightInMeters = bmiHeight / 100;
    if (heightInMeters <= 0) return { score: 0, category: 'Invalid', color: 'text-gray-400', plan: 'Monthly Standard', advice: '' };
    const score = Number((bmiWeight / (heightInMeters * heightInMeters)).toFixed(1));
    
    if (score < 18.5) {
      return {
        score,
        category: 'Underweight',
        color: 'text-blue-400',
        plan: 'Quarterly Power Plan (Mass Hypertrophy & Strength)',
        advice: 'Focus on caloric surplus and heavy compound resistance training to build dense muscle mass.'
      };
    } else if (score <= 24.9) {
      return {
        score,
        category: 'Normal & Athletic',
        color: 'text-emerald-400',
        plan: 'Annual Premium Plan (Peak Athletic Conditioning)',
        advice: 'Outstanding body composition! Maintain conditioning with balanced heavy lifting and high-intensity HIIT.'
      };
    } else if (score <= 29.9) {
      return {
        score,
        category: 'Overweight',
        color: 'text-amber-400',
        plan: 'Quarterly Power Plan (Metabolic Fat Burn & Strength)',
        advice: 'Combine functional resistance training with HIIT and structured metabolic cardio to accelerate caloric deficit.'
      };
    } else {
      return {
        score,
        category: 'High Body Mass',
        color: 'text-rose-400',
        plan: 'Monthly Standard with Guided Cardio Coaching',
        advice: 'Focus on low-impact cardio, progressive strength conditioning, and consistent daily aerobic movement.'
      };
    }
  }, [bmiHeight, bmiWeight]);

  const days = [
    { num: 1, name: "Mon", full: "Monday" },
    { num: 2, name: "Tue", full: "Tuesday" },
    { num: 3, name: "Wed", full: "Wednesday" },
    { num: 4, name: "Thu", full: "Thursday" },
    { num: 5, name: "Fri", full: "Friday" },
    { num: 6, name: "Sat", full: "Saturday" },
    { num: 7, name: "Sun", full: "Sunday" },
  ];

  const classColors: Record<string, string> = {
    'HIIT Ignition': 'bg-gradient-to-br from-orange-600/90 to-red-600/90 text-white border-orange-500/50',
    'Vinyasa Flow Yoga': 'bg-gradient-to-br from-emerald-600/90 to-teal-700/90 text-white border-emerald-500/50',
    'Power Strength & Conditioning': 'bg-gradient-to-br from-purple-700/90 to-indigo-800/90 text-white border-purple-500/50',
    'Boxing Fundamentals': 'bg-gradient-to-br from-amber-600/90 to-yellow-600/90 text-white border-amber-500/50',
  };

  // Filtered timetable
  const filteredTimetable = useMemo(() => {
    return timetable.filter(s => {
      if (disciplineFilter === 'all') return true;
      const name = (s.class?.name || '').toLowerCase();
      return name.includes(disciplineFilter.toLowerCase());
    });
  }, [timetable, disciplineFilter]);

  // Product categories
  const productCategories = useMemo(() => {
    const set = new Set<string>();
    equipment.forEach(p => {
      if (p.category) set.add(p.category);
    });
    return ['all', ...Array.from(set)];
  }, [equipment]);

  const filteredEquipment = useMemo(() => {
    if (productCategoryFilter === 'all') return equipment;
    return equipment.filter(p => p.category === productCategoryFilter);
  }, [equipment, productCategoryFilter]);

  // FAQs
  const faqs = [
    {
      q: 'Does Titan Gym track memberships in the Ethiopian Calendar?',
      a: 'Yes, absolutely! All member registrations, validity periods, and expiration dates are seamlessly recorded and presented in the Ethiopian Calendar (የኢትዮጵያ ዘመን አቆጣጠር) with exact month names (Meskerem to Pagume).'
    },
    {
      q: 'What payment methods are supported at the front desk?',
      a: 'We accept Cash, Telebirr / Mobile Money, Bank Transfers (Commercial Bank of Ethiopia, Dashen, etc.), and Debit/Credit Cards. You receive an instant digital and printed receipt.'
    },
    {
      q: 'Can I freeze my membership if I am traveling or ill?',
      a: 'Yes! Members with active plans can freeze their subscription anytime at the front desk. The frozen duration is automatically restored to your expiration date when you return.'
    },
    {
      q: 'Do I need advance booking for group classes?',
      a: 'No advance booking is required for active members! Simply check the live timetable below and arrive 10 minutes prior to session commencement.'
    },
    {
      q: 'Are showers and personal lockers included with my plan?',
      a: 'Yes, every membership includes complimentary access to our air-conditioned locker rooms, private shower suites, and dry sauna facilities.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#0D1117] text-white selection:bg-[#E8452C] selection:text-white font-sans overflow-x-hidden">
      

      {/* ============================================================== */}
      {/* 2. NAVIGATION BAR (Glassmorphism & Fixed) */}
      {/* ============================================================== */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'glass-nav border-b border-white/10 py-3 shadow-2xl'
            : 'bg-transparent py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-6 xl:gap-10">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group shrink-0">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#B5301C] to-[#E8452C] flex items-center justify-center text-white shadow-lg shadow-[#E8452C]/30 group-hover:scale-105 transition-all">
              <Dumbbell className="w-6 h-6 -rotate-45" />
            </div>
            <div>
              <span className="text-xl sm:text-2xl font-black tracking-wider heading-font block leading-none">
                TITAN<span className="text-[#E8452C]">GYM</span>
              </span>
              <span className="text-[10px] tracking-widest text-gray-400 font-bold uppercase block mt-0.5">
                Strength & Athletics
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center gap-3 xl:gap-6">
            <a href="#about" className="px-3 py-1.5 rounded-lg text-xs font-bold text-gray-300 hover:text-white hover:bg-white/10 transition-all uppercase tracking-wider">
              About
            </a>
            <a href="#disciplines" className="px-3 py-1.5 rounded-lg text-xs font-bold text-gray-300 hover:text-white hover:bg-white/10 transition-all uppercase tracking-wider">
              Disciplines
            </a>
            <a href="#pricing" className="px-3 py-1.5 rounded-lg text-xs font-bold text-gray-300 hover:text-white hover:bg-white/10 transition-all uppercase tracking-wider flex items-center gap-1.5">
              <span>Plans</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#E8452C] shadow-sm shadow-[#E8452C]" />
            </a>
            <a href="#timetable" className="px-3 py-1.5 rounded-lg text-xs font-bold text-gray-300 hover:text-white hover:bg-white/10 transition-all uppercase tracking-wider">
              Timetable
            </a>
            <a href="#calculator" className="px-3 py-1.5 rounded-lg text-xs font-bold text-gray-300 hover:text-white hover:bg-white/10 transition-all uppercase tracking-wider">
              BMI Tool
            </a>
            <a href="#equipment" className="px-3 py-1.5 rounded-lg text-xs font-bold text-gray-300 hover:text-white hover:bg-white/10 transition-all uppercase tracking-wider">
              Pro Shop
            </a>
            <a href="#contact" className="px-3 py-1.5 rounded-lg text-xs font-bold text-gray-300 hover:text-white hover:bg-white/10 transition-all uppercase tracking-wider">
              Contact
            </a>
          </div>

          {/* Right Action: Staff Login & Join CTA */}
          <div className="hidden md:flex items-center gap-4 shrink-0">
            <Link
              href="/login"
              className="px-4.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-xs font-bold uppercase tracking-wider transition-all"
            >
              Staff Portal
            </Link>

            <a
              href="#pricing"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#E8452C] to-[#B5301C] text-white text-xs font-black uppercase tracking-wider hover:opacity-95 shadow-md shadow-[#E8452C]/25 transition-all hover:-translate-y-0.5"
            >
              Join Now
            </a>
          </div>

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2.5 rounded-xl text-gray-300 hover:text-white bg-gray-800/80 border border-gray-700/80 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Fullscreen Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 top-[76px] bg-[#0D1117]/98 backdrop-blur-xl z-50 p-6 flex flex-col gap-2.5 border-t border-gray-800 animate-in fade-in overflow-y-auto">
            <a
              href="#about"
              onClick={() => setMobileMenuOpen(false)}
              className="text-base font-bold text-gray-200 hover:text-white px-3.5 py-3 rounded-xl hover:bg-white/5 transition-colors border-b border-gray-800/40"
            >
              About Titan
            </a>
            <a
              href="#disciplines"
              onClick={() => setMobileMenuOpen(false)}
              className="text-base font-bold text-gray-200 hover:text-white px-3.5 py-3 rounded-xl hover:bg-white/5 transition-colors border-b border-gray-800/40"
            >
              Training Disciplines
            </a>
            <a
              href="#pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="text-base font-bold text-[#E8452C] px-3.5 py-3 rounded-xl hover:bg-white/5 transition-colors border-b border-gray-800/40 flex items-center justify-between"
            >
              <span>Membership Plans (ETB)</span>
              <span className="text-xs bg-[#E8452C]/20 px-2 py-0.5 rounded font-mono">From 59 ETB</span>
            </a>
            <a
              href="#timetable"
              onClick={() => setMobileMenuOpen(false)}
              className="text-base font-bold text-gray-200 hover:text-white px-3.5 py-3 rounded-xl hover:bg-white/5 transition-colors border-b border-gray-800/40"
            >
              Weekly Schedule
            </a>
            <a
              href="#calculator"
              onClick={() => setMobileMenuOpen(false)}
              className="text-base font-bold text-gray-200 hover:text-white px-3.5 py-3 rounded-xl hover:bg-white/5 transition-colors border-b border-gray-800/40"
            >
              Interactive BMI Tool
            </a>
            <a
              href="#equipment"
              onClick={() => setMobileMenuOpen(false)}
              className="text-base font-bold text-gray-200 hover:text-white px-3.5 py-3 rounded-xl hover:bg-white/5 transition-colors border-b border-gray-800/40"
            >
              Pro Shop & Gear
            </a>
            <a
              href="#contact"
              onClick={() => setMobileMenuOpen(false)}
              className="text-base font-bold text-gray-200 hover:text-white px-3.5 py-3 rounded-xl hover:bg-white/5 transition-colors border-b border-gray-800/40"
            >
              Contact & Hours
            </a>

            <div className="pt-4 flex flex-col gap-3">
              <a
                href="#pricing"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-3.5 rounded-xl bg-[#E8452C] text-white text-center font-bold text-sm shadow-md"
              >
                Join Now (From 59 ETB)
              </a>
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-3 rounded-xl bg-gray-800 text-gray-300 text-center font-semibold text-sm border border-gray-700"
              >
                Staff Portal Login
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* ============================================================== */}
      {/* 3. HERO SECTION (High-Impact Radial Glow & Visuals) */}
      {/* ============================================================== */}
      <section className="relative min-h-[92vh] flex items-center justify-center pt-28 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Dynamic ambient radial gradients */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-[#E8452C]/15 rounded-full blur-[130px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-[400px] h-[300px] bg-orange-600/10 rounded-full blur-[100px] pointer-events-none" />

        {/* Background Image with Cinematic Overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center z-0 scale-105 transform animate-pulse-slow opacity-35"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070&auto=format&fit=crop')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0D1117] via-[#0D1117]/85 to-[#0D1117]/60 z-0" />

        <div className="relative z-10 max-w-5xl mx-auto text-center flex flex-col items-center">
          
          {/* Top Status & Brand Badges */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-8">
            {/* Live Open Hours Status Pill - Moved from Header */}
            <div className="inline-flex items-center gap-2.5 px-4.5 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm font-semibold backdrop-blur-md shadow-lg shadow-emerald-950/40 hover:bg-emerald-500/15 transition-all">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
              </span>
              <Clock className="w-4 h-4 text-emerald-400" />
              <span className="tracking-wide">Open Today • 05:30 - 23:00</span>
            </div>

            {/* Tagline Pill */}
            <div className="inline-flex items-center gap-2.5 px-4.5 py-2 rounded-full bg-white/10 border border-white/15 text-xs sm:text-sm font-bold text-gray-200 backdrop-blur-md shadow-sm">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E8452C] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#E8452C]" />
              </span>
              <span className="tracking-wider">PREMIER FITNESS & ATHLETIC COMMUNITY</span>
              <span className="text-gray-500">•</span>
              <span className="text-[#E8452C]">2019 E.C. SEASON</span>
            </div>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight heading-font leading-[1.08] mb-6 text-white drop-shadow-xl">
            FORGE YOUR BODY. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E8452C] via-orange-400 to-amber-300">
              UNLEASH YOUR POWER.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg lg:text-xl text-gray-300 max-w-2xl mb-10 leading-relaxed font-normal">
            A state-of-the-art training sanctuary built for real transformations. Heavy Olympic iron, dynamic functional turf, certified coaching, and flexible Ethiopian Calendar plans.
          </p>

          {/* Dual CTAs */}
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto mb-16">
            <a
              href="#pricing"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-[#E8452C] to-[#B5301C] text-white font-extrabold text-sm sm:text-base hover:opacity-95 transition-all shadow-xl shadow-[#E8452C]/30 hover:-translate-y-0.5 flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <Flame className="w-5 h-5 text-amber-300" />
              <span>Explore Membership Plans (From 59 ETB)</span>
              <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="#timetable"
              className="w-full sm:w-auto px-7 py-4 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold text-sm sm:text-base transition-all backdrop-blur-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <Calendar className="w-4 h-4 text-gray-300" />
              <span>View Weekly Timetable</span>
            </a>
          </div>

          {/* 4 Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 w-full max-w-4xl text-left">
            <div className="glass-card p-4 rounded-2xl border border-white/10 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#E8452C]/20 border border-[#E8452C]/30 flex items-center justify-center text-[#E8452C] shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-black text-white heading-font">1,200+</div>
                <div className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">Active Members</div>
              </div>
            </div>

            <div className="glass-card p-4 rounded-2xl border border-white/10 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-black text-white heading-font">12</div>
                <div className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">Weekly Classes</div>
              </div>
            </div>

            <div className="glass-card p-4 rounded-2xl border border-white/10 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-black text-white heading-font">100%</div>
                <div className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">Olympic Gear</div>
              </div>
            </div>

            <div className="glass-card p-4 rounded-2xl border border-white/10 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                <Star className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-black text-white heading-font">4.9 / 5</div>
                <div className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">Member Rating</div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-5 left-1/2 transform -translate-x-1/2 z-10 animate-bounce-subtle text-gray-400">
          <a href="#about" aria-label="Scroll to about section">
            <ChevronDown className="w-7 h-7 opacity-70 hover:opacity-100 transition-opacity" />
          </a>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 4. ABOUT & VALUE PROPOSITIONS */}
      {/* ============================================================== */}
      <section id="about" className="py-24 bg-[#0D1117] border-t border-white/10 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            {/* Left: Text & Features */}
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-[#E8452C] mb-3 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                <span>ABOUT TITAN ATHLETICS</span>
              </div>
              <h2 className="text-3xl sm:text-5xl font-black tracking-tight heading-font mb-6 text-white leading-tight">
                BUILT FOR THOSE WHO REFUSE TO BE AVERAGE.
              </h2>
              <p className="text-gray-300 text-base leading-relaxed mb-6 font-normal">
                At Titan Gym, fitness is not an occasional hobby—it is the foundation for energy, confidence, and longevity. Our 15,000 sq. ft. club incorporates professional Olympic weightlifting platforms, high-speed turf sprint tracks, a full boxing ring, and restorative yoga sanctuaries.
              </p>
              <p className="text-gray-400 text-sm leading-relaxed mb-8">
                Whether you are training for competitive sport or building your lifestyle strength, our certified coaches and vibrant community guide you every single day.
              </p>

              {/* 4 Pillars Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl glass-card border border-white/10 flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-[#E8452C]/15 text-[#E8452C] shrink-0 mt-0.5">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Heavy Iron & Turf</h4>
                    <p className="text-xs text-gray-400 mt-1">Calibrated Olympic plates, dumbells up to 50kg, and sled tracks.</p>
                  </div>
                </div>

                <div className="p-4 rounded-xl glass-card border border-white/10 flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-400 shrink-0 mt-0.5">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Ethiopian Calendar</h4>
                    <p className="text-xs text-gray-400 mt-1">Transparent subscription start & end dates in Ethiopian months.</p>
                  </div>
                </div>

                <div className="p-4 rounded-xl glass-card border border-white/10 flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-blue-500/15 text-blue-400 shrink-0 mt-0.5">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Certified Coaches</h4>
                    <p className="text-xs text-gray-400 mt-1">Strength, conditioning, and martial arts experts on the floor.</p>
                  </div>
                </div>

                <div className="p-4 rounded-xl glass-card border border-white/10 flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-purple-500/15 text-purple-400 shrink-0 mt-0.5">
                    <HeartPulse className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Recovery & Sauna</h4>
                    <p className="text-xs text-gray-400 mt-1">Post-workout infrared recovery suites and private locker showers.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Modern Visual Collage with Glow */}
            <div className="grid grid-cols-2 gap-4 relative">
              <div className="absolute -inset-4 bg-gradient-to-tr from-[#E8452C]/20 to-transparent blur-2xl rounded-3xl -z-10" />
              
              <div className="space-y-4">
                <div className="rounded-2xl overflow-hidden shadow-2xl h-64 border border-white/10 relative group">
                  <img
                    src="https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=800&auto=format&fit=crop"
                    alt="Strength training area"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  <span className="absolute bottom-3 left-3 text-xs font-bold text-white">Olympic Free Weights</span>
                </div>
                <div className="rounded-2xl overflow-hidden shadow-2xl h-44 border border-white/10 relative group">
                  <img
                    src="https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=800&auto=format&fit=crop"
                    alt="Yoga studio"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  <span className="absolute bottom-3 left-3 text-xs font-bold text-white">Mindfulness & Yoga</span>
                </div>
              </div>

              <div className="space-y-4 pt-8">
                <div className="rounded-2xl overflow-hidden shadow-2xl h-44 border border-white/10 relative group">
                  <img
                    src="https://images.unsplash.com/photo-1549060279-7e168fcee0c2?q=80&w=800&auto=format&fit=crop"
                    alt="Cardio floor"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  <span className="absolute bottom-3 left-3 text-xs font-bold text-white">Cardio Conditioning</span>
                </div>
                <div className="rounded-2xl overflow-hidden shadow-2xl h-64 border border-white/10 relative group">
                  <img
                    src="https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=800&auto=format&fit=crop"
                    alt="Member training workout"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  <span className="absolute bottom-3 left-3 text-xs font-bold text-white">Combat & Boxing Ring</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 5. SIGNATURE TRAINING DISCIPLINES */}
      {/* ============================================================== */}
      <section id="disciplines" className="py-24 bg-[#111827] border-t border-white/10 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="text-xs font-bold uppercase tracking-widest text-[#E8452C] mb-2 flex items-center justify-center gap-1.5">
              <Compass className="w-4 h-4" />
              <span>SIGNATURE DISCIPLINES</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight heading-font text-white mb-4">
              TRAIN WITH PURPOSE & MASTERY
            </h2>
            <p className="text-gray-400 text-sm sm:text-base">
              Four focused athletic pillars designed to burn fat, build dense muscle, and enhance cardiovascular endurance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Discipline 1 */}
            <div className="glass-card rounded-2xl overflow-hidden border border-white/10 flex flex-col justify-between hover:border-[#E8452C]/50 transition-all hover:-translate-y-1.5 group shadow-xl">
              <div>
                <div className="h-48 overflow-hidden relative">
                  <img
                    src="https://images.unsplash.com/photo-1534367507873-d2d7e24c797f?q=80&w=800&auto=format&fit=crop"
                    alt="Strength & Powerlifting"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#111827] via-[#111827]/40 to-transparent" />
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-600 text-white">
                    Power & Iron
                  </span>
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-bold text-white mb-2 heading-font group-hover:text-[#E8452C] transition-colors">
                    Olympic Strength & Powerlifting
                  </h3>
                  <p className="text-xs text-gray-400 leading-relaxed mb-4">
                    Master the big 3 lifts with calibrated competition iron, chalk platforms, and coach-led technique cues.
                  </p>
                </div>
              </div>
              <div className="p-5 pt-0 border-t border-white/5 flex items-center justify-between text-xs text-gray-400">
                <span className="text-[#E8452C] font-semibold">⚡ High Load</span>
                <span>Main Floor</span>
              </div>
            </div>

            {/* Discipline 2 */}
            <div className="glass-card rounded-2xl overflow-hidden border border-white/10 flex flex-col justify-between hover:border-[#E8452C]/50 transition-all hover:-translate-y-1.5 group shadow-xl">
              <div>
                <div className="h-48 overflow-hidden relative">
                  <img
                    src="https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=800&auto=format&fit=crop"
                    alt="HIIT Ignition"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#111827] via-[#111827]/40 to-transparent" />
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-600 text-white">
                    High Intensity
                  </span>
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-bold text-white mb-2 heading-font group-hover:text-[#E8452C] transition-colors">
                    HIIT Ignition & Conditioning
                  </h3>
                  <p className="text-xs text-gray-400 leading-relaxed mb-4">
                    Heart-pounding circuit training utilizing SkiErgs, assault bikes, plyo boxes, and bodyweight intervals.
                  </p>
                </div>
              </div>
              <div className="p-5 pt-0 border-t border-white/5 flex items-center justify-between text-xs text-gray-400">
                <span className="text-amber-400 font-semibold">🔥 750+ kcal/hr</span>
                <span>Turf Arena</span>
              </div>
            </div>

            {/* Discipline 3 */}
            <div className="glass-card rounded-2xl overflow-hidden border border-white/10 flex flex-col justify-between hover:border-[#E8452C]/50 transition-all hover:-translate-y-1.5 group shadow-xl">
              <div>
                <div className="h-48 overflow-hidden relative">
                  <img
                    src="https://images.unsplash.com/photo-1549060279-7e168fcee0c2?q=80&w=800&auto=format&fit=crop"
                    alt="Combat & Boxing"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#111827] via-[#111827]/40 to-transparent" />
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-600 text-white">
                    Combat Arts
                  </span>
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-bold text-white mb-2 heading-font group-hover:text-[#E8452C] transition-colors">
                    Boxing & Combat Athletics
                  </h3>
                  <p className="text-xs text-gray-400 leading-relaxed mb-4">
                    Footwork, hand-speed, heavy bag rounds, and defensive technique under experienced ring champions.
                  </p>
                </div>
              </div>
              <div className="p-5 pt-0 border-t border-white/5 flex items-center justify-between text-xs text-gray-400">
                <span className="text-orange-400 font-semibold">🥊 All Levels</span>
                <span>Combat Ring</span>
              </div>
            </div>

            {/* Discipline 4 */}
            <div className="glass-card rounded-2xl overflow-hidden border border-white/10 flex flex-col justify-between hover:border-[#E8452C]/50 transition-all hover:-translate-y-1.5 group shadow-xl">
              <div>
                <div className="h-48 overflow-hidden relative">
                  <img
                    src="https://images.unsplash.com/photo-1545205597-3d9d02c29597?q=80&w=800&auto=format&fit=crop"
                    alt="Yoga & Recovery"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#111827] via-[#111827]/40 to-transparent" />
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-600 text-white">
                    Mind & Recovery
                  </span>
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-bold text-white mb-2 heading-font group-hover:text-[#E8452C] transition-colors">
                    Vinyasa Flow & Deep Recovery
                  </h3>
                  <p className="text-xs text-gray-400 leading-relaxed mb-4">
                    Decompress joints, restore mobility, and enhance nervous system recovery in our tranquil studio.
                  </p>
                </div>
              </div>
              <div className="p-5 pt-0 border-t border-white/5 flex items-center justify-between text-xs text-gray-400">
                <span className="text-emerald-400 font-semibold">🌿 Restoration</span>
                <span>Zen Studio</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 6. MEMBERSHIP TIERS (ETB CURRENCY & ETHIOPIAN CALENDAR ENABLED) */}
      {/* ============================================================== */}
      <section id="pricing" className="py-24 bg-[#0D1117] border-t border-white/10 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-[#E8452C]/10 rounded-full blur-[140px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="text-xs font-bold uppercase tracking-widest text-[#E8452C] mb-2 flex items-center justify-center gap-1.5">
              <Flame className="w-4 h-4 text-[#E8452C]" />
              <span>MEMBERSHIP PLANS IN ETB</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight heading-font text-white mb-4">
              TRANSPARENT, COMMITTED FITNESS
            </h2>
            <p className="text-gray-400 text-sm sm:text-base">
              No hidden signup fees. All subscriptions recorded in the Ethiopian Calendar with valid start & expiration dates.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            {/* Plan 1: Monthly Standard */}
            <div className="glass-card rounded-3xl p-8 border border-white/10 flex flex-col justify-between hover:border-white/20 transition-all shadow-xl">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Flexible Access</div>
                <h3 className="text-2xl font-black text-white heading-font mb-4">Monthly Standard</h3>
                <p className="text-xs text-gray-400 mb-6 leading-relaxed">
                  Ideal for beginners or short-term athletic travelers wanting full gym floor privileges.
                </p>

                <div className="flex items-baseline gap-2 mb-8 pb-6 border-b border-white/10">
                  <span className="text-4xl sm:text-5xl font-black text-white heading-font">59</span>
                  <span className="text-lg font-bold text-[#E8452C]">ETB</span>
                  <span className="text-xs text-gray-400 font-semibold ml-1">/ 1 Month</span>
                </div>

                <ul className="space-y-3.5 text-xs text-gray-300">
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Full access to main gym strength & cardio floor</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Air-conditioned locker rooms & hot showers</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Free body composition fitness assessment</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-gray-500">
                    <X className="w-4 h-4 shrink-0" />
                    <span>Group fitness classes (add-on required)</span>
                  </li>
                </ul>
              </div>

              <div className="pt-8">
                <a
                  href="#contact"
                  className="w-full py-3.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-bold text-xs uppercase tracking-wider transition-all block text-center"
                >
                  Register at Reception
                </a>
              </div>
            </div>

            {/* Plan 2: Quarterly Power (Featured) */}
            <div className="glass-card rounded-3xl p-8 border-2 border-[#E8452C] bg-gradient-to-b from-gray-900 via-gray-900 to-gray-950 flex flex-col justify-between hover:border-[#E8452C] transition-all shadow-2xl relative scale-100 lg:-translate-y-2">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-gradient-to-r from-[#E8452C] to-orange-500 text-white text-[11px] font-black uppercase tracking-widest shadow-lg flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5" />
                <span>MOST POPULAR • BEST PROGRESS</span>
              </div>

              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-[#E8452C] mb-2 pt-2">Comprehensive Athlete</div>
                <h3 className="text-2xl font-black text-white heading-font mb-4">Quarterly Power</h3>
                <p className="text-xs text-gray-300 mb-6 leading-relaxed">
                  The proven 90-day transformation block. Includes unlimited group fitness and progress tracking.
                </p>

                <div className="flex items-baseline gap-2 mb-8 pb-6 border-b border-white/10">
                  <span className="text-4xl sm:text-5xl font-black text-white heading-font">159</span>
                  <span className="text-lg font-bold text-[#E8452C]">ETB</span>
                  <span className="text-xs text-gray-400 font-semibold ml-1">/ 3 Months</span>
                </div>

                <ul className="space-y-3.5 text-xs text-gray-200">
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="font-semibold text-white">All Monthly Standard features included</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Unlimited group classes (HIIT, Yoga, Boxing)</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Personalized workout program design</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>1 free guest day pass per month</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Flexible membership freeze option (up to 14 days)</span>
                  </li>
                </ul>
              </div>

              <div className="pt-8">
                <a
                  href="#contact"
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-[#E8452C] to-[#B5301C] hover:opacity-95 text-white font-extrabold text-xs uppercase tracking-wider transition-all block text-center shadow-lg shadow-[#E8452C]/30"
                >
                  Join Quarterly (159 ETB)
                </a>
              </div>
            </div>

            {/* Plan 3: Annual Premium */}
            <div className="glass-card rounded-3xl p-8 border border-white/10 flex flex-col justify-between hover:border-white/20 transition-all shadow-xl">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2">Elite VIP Access</div>
                <h3 className="text-2xl font-black text-white heading-font mb-4">Annual Premium</h3>
                <p className="text-xs text-gray-400 mb-6 leading-relaxed">
                  Full 1-year lifestyle commitment. Maximum perks, dedicated locker, and recovery suites.
                </p>

                <div className="flex items-baseline gap-2 mb-8 pb-6 border-b border-white/10">
                  <span className="text-4xl sm:text-5xl font-black text-white heading-font">599</span>
                  <span className="text-lg font-bold text-[#E8452C]">ETB</span>
                  <span className="text-xs text-gray-400 font-semibold ml-1">/ 12 Months</span>
                </div>

                <ul className="space-y-3.5 text-xs text-gray-300">
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="font-semibold text-white">All Quarterly Power privileges</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>24/7 VIP keycard facility access</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Free dry sauna recovery sessions</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>5 free guest passes for friends & family</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>10% discount on all Pro Shop equipment & gear</span>
                  </li>
                </ul>
              </div>

              <div className="pt-8">
                <a
                  href="#contact"
                  className="w-full py-3.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-bold text-xs uppercase tracking-wider transition-all block text-center"
                >
                  Join Annual (599 ETB)
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 7. INTERACTIVE BMI & HEALTH CALCULATOR (ENGAGING CLIENT TOOL) */}
      {/* ============================================================== */}
      <section id="calculator" className="py-24 bg-[#111827] border-t border-white/10 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="glass-card rounded-3xl p-8 sm:p-12 border border-white/10 bg-gradient-to-br from-gray-900 via-gray-900/90 to-gray-950 shadow-2xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              
              {/* Left Column: Sliders & Inputs */}
              <div>
                <div className="text-xs font-bold uppercase tracking-widest text-[#E8452C] mb-2 flex items-center gap-1.5">
                  <Calculator className="w-4 h-4" />
                  <span>INTERACTIVE BODY CALCULATOR</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-black tracking-tight heading-font text-white mb-4">
                  CHECK YOUR BODY METRICS
                </h2>
                <p className="text-gray-400 text-xs sm:text-sm mb-8 leading-relaxed">
                  Use our interactive tool to calculate your Body Mass Index (BMI) and discover which Titan training track fits your goals.
                </p>

                {/* Gender Toggle */}
                <div className="mb-6">
                  <label className="text-xs font-bold text-gray-300 block mb-2">Select Gender</label>
                  <div className="grid grid-cols-2 gap-3 max-w-xs">
                    <button
                      type="button"
                      onClick={() => setBmiGender('male')}
                      className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${
                        bmiGender === 'male'
                          ? 'bg-[#E8452C] text-white border-[#E8452C]'
                          : 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700'
                      }`}
                    >
                      Male Athlete
                    </button>
                    <button
                      type="button"
                      onClick={() => setBmiGender('female')}
                      className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${
                        bmiGender === 'female'
                          ? 'bg-[#E8452C] text-white border-[#E8452C]'
                          : 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700'
                      }`}
                    >
                      Female Athlete
                    </button>
                  </div>
                </div>

                {/* Height Slider */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold text-gray-300">Height (cm)</label>
                    <span className="text-base font-black text-white font-mono">{bmiHeight} cm</span>
                  </div>
                  <input
                    type="range"
                    min="140"
                    max="215"
                    value={bmiHeight}
                    onChange={(e) => setBmiHeight(Number(e.target.value))}
                    className="w-full accent-[#E8452C] h-2 bg-gray-800 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                    <span>140 cm</span>
                    <span>175 cm</span>
                    <span>215 cm</span>
                  </div>
                </div>

                {/* Weight Slider */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold text-gray-300">Weight (kg)</label>
                    <span className="text-base font-black text-white font-mono">{bmiWeight} kg</span>
                  </div>
                  <input
                    type="range"
                    min="40"
                    max="150"
                    value={bmiWeight}
                    onChange={(e) => setBmiWeight(Number(e.target.value))}
                    className="w-full accent-[#E8452C] h-2 bg-gray-800 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                    <span>40 kg</span>
                    <span>75 kg</span>
                    <span>150 kg</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Live BMI Gauge Result Card */}
              <div className="p-6 sm:p-8 rounded-2xl bg-black/40 border border-white/10 flex flex-col justify-between space-y-6">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-2">
                    Instant Assessment Result
                  </span>
                  
                  <div className="flex items-baseline gap-4 mb-3">
                    <div className="text-5xl sm:text-6xl font-black text-white heading-font">
                      {bmiResult.score}
                    </div>
                    <div>
                      <span className={`text-base font-extrabold uppercase block ${bmiResult.color}`}>
                        {bmiResult.category}
                      </span>
                      <span className="text-[11px] text-gray-400">Body Mass Index</span>
                    </div>
                  </div>

                  {/* Simple colored score meter */}
                  <div className="w-full h-3 rounded-full bg-gray-800 overflow-hidden flex my-4">
                    <div className="h-full bg-blue-500 w-1/4" title="Underweight (<18.5)" />
                    <div className="h-full bg-emerald-500 w-1/4" title="Normal (18.5-24.9)" />
                    <div className="h-full bg-amber-500 w-1/4" title="Overweight (25-29.9)" />
                    <div className="h-full bg-rose-500 w-1/4" title="Obese (30+)" />
                  </div>

                  <p className="text-xs text-gray-300 leading-relaxed font-normal bg-gray-900/60 p-3.5 rounded-xl border border-white/5 mb-4">
                    💡 <strong className="text-white">Coach Insight:</strong> {bmiResult.advice}
                  </p>
                </div>

                <div className="pt-4 border-t border-white/10">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#E8452C] block mb-1">
                    Recommended Titan Pathway
                  </span>
                  <div className="font-bold text-sm text-white mb-4">
                    {bmiResult.plan}
                  </div>
                  <a
                    href="#pricing"
                    className="w-full py-3 rounded-xl bg-[#E8452C] hover:bg-[#B5301C] text-white font-bold text-xs uppercase tracking-wider transition-all block text-center shadow-md cursor-pointer"
                  >
                    Select Recommended Plan →
                  </a>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 8. TIMETABLE & CLASS SCHEDULE */}
      {/* ============================================================== */}
      <section id="timetable" className="py-24 bg-[#0D1117] border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-[#E8452C] mb-2 flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                <span>LIVE GYM SCHEDULE</span>
              </div>
              <h2 className="text-3xl sm:text-5xl font-black tracking-tight heading-font text-white">
                WEEKLY CLASS TIMETABLE
              </h2>
            </div>

            {/* Filter pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {[
                { id: 'all', label: 'All Classes' },
                { id: 'hiit', label: 'HIIT' },
                { id: 'strength', label: 'Strength' },
                { id: 'boxing', label: 'Boxing' },
                { id: 'yoga', label: 'Yoga' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setDisciplineFilter(f.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    disciplineFilter === f.id
                      ? 'bg-[#E8452C] text-white shadow-sm'
                      : 'bg-gray-800 text-gray-400 hover:text-white'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Mobile Day Selector Tabs */}
          <div className="md:hidden flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-none">
            {days.map((d) => (
              <button
                key={d.num}
                onClick={() => setSelectedDay(d.num)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                  selectedDay === d.num
                    ? 'bg-[#E8452C] text-white shadow-md shadow-[#E8452C]/30'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {d.full}
              </button>
            ))}
          </div>

          {/* Desktop Timetable Grid (7 Days Columns) */}
          <div className="hidden md:grid md:grid-cols-7 gap-3">
            {days.map((d) => {
              const daySessions = filteredTimetable.filter((s) => s.dayOfWeek === d.num);
              return (
                <div key={d.num} className="flex flex-col bg-gray-900/60 rounded-2xl p-3 border border-white/10">
                  <div className="text-center pb-3 mb-3 border-b border-white/5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">{d.name}</span>
                    <span className="text-sm font-extrabold text-white">{d.full}</span>
                  </div>

                  <div className="flex flex-col gap-2.5 min-h-[360px]">
                    {daySessions.length === 0 ? (
                      <div className="flex-1 flex items-center justify-center text-xs text-gray-600 italic text-center p-4">
                        No sessions scheduled
                      </div>
                    ) : (
                      daySessions.map((s) => {
                        const colorClass = classColors[s.class?.name] || 'bg-gradient-to-br from-gray-700 to-gray-800 text-white border-gray-600';
                        return (
                          <div
                            key={s.sessionId}
                            onClick={() => setActiveSessionDetail(s)}
                            className={`p-3 rounded-xl border cursor-pointer transition-all hover:scale-[1.03] shadow-md ${colorClass}`}
                          >
                            <div className="text-xs font-bold leading-tight line-clamp-1 mb-1">
                              {s.class?.name}
                            </div>
                            <div className="flex items-center gap-1 text-[11px] opacity-90 mb-1 font-medium">
                              <Clock className="w-3 h-3" />
                              <span>{s.startTime} – {s.endTime}</span>
                            </div>
                            <div className="text-[10px] opacity-80 truncate">
                              📍 {s.room || 'Main Studio'}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Mobile Vertical View for Selected Day */}
          <div className="md:hidden flex flex-col gap-3">
            {filteredTimetable.filter((s) => s.dayOfWeek === selectedDay).length === 0 ? (
              <div className="p-8 text-center bg-gray-900/60 rounded-2xl border border-white/10 text-gray-400 text-xs">
                No scheduled sessions matching filter on this day.
              </div>
            ) : (
              filteredTimetable
                .filter((s) => s.dayOfWeek === selectedDay)
                .map((s) => {
                  const colorClass = classColors[s.class?.name] || 'bg-gradient-to-br from-gray-700 to-gray-800 text-white border-gray-600';
                  return (
                    <div
                      key={s.sessionId}
                      onClick={() => setActiveSessionDetail(s)}
                      className={`p-4 rounded-xl border cursor-pointer ${colorClass}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-base">{s.class?.name}</h4>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-black/20 font-mono">
                          {s.startTime} – {s.endTime}
                        </span>
                      </div>
                      <div className="text-xs opacity-90 flex items-center justify-between">
                        <span>Room: {s.room || 'Main Studio'}</span>
                        <span className="underline">View Details →</span>
                      </div>
                    </div>
                  );
                })
            )}
          </div>

          {/* Footer note */}
          <div className="mt-8 text-center text-xs text-gray-400 bg-gray-900/40 py-3.5 px-6 rounded-2xl border border-white/5 max-w-xl mx-auto flex items-center justify-center gap-2">
            <Info className="w-4 h-4 text-[#E8452C] shrink-0" />
            <span>All sessions are led by certified coaches and open to active members.</span>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 9. PRO SHOP & EQUIPMENT STORE (PRICING IN ETB) */}
      {/* ============================================================== */}
      <section id="equipment" className="py-24 bg-[#111827] border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-[#E8452C] mb-2 flex items-center gap-1.5">
                <ShoppingBag className="w-4 h-4" />
                <span>OFFICIAL FRONT-DESK PRO SHOP</span>
              </div>
              <h2 className="text-3xl sm:text-5xl font-black tracking-tight heading-font text-white">
                COMMERCIAL GEAR & MERCHANDISE
              </h2>
            </div>

            {/* Category pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {productCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setProductCategoryFilter(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer capitalize ${
                    productCategoryFilter === cat
                      ? 'bg-[#E8452C] text-white shadow-sm'
                      : 'bg-gray-800 text-gray-400 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredEquipment.slice(0, 8).map((item) => {
              const defaultImage = 'https://images.unsplash.com/photo-1586401100295-7a8096fd231a?q=80&w=800&auto=format&fit=crop';
              const img = item.imageUrl || defaultImage;

              return (
                <div
                  key={item.id}
                  className="glass-card rounded-2xl border border-white/10 overflow-hidden hover:border-[#E8452C]/50 transition-all hover:-translate-y-1.5 group shadow-xl flex flex-col justify-between"
                >
                  <div>
                    {/* Equipment Photo */}
                    <div className="h-52 overflow-hidden relative bg-gray-950">
                      <img
                        src={img}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/20 to-transparent" />
                      
                      {/* Category Pill */}
                      <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold bg-black/60 backdrop-blur-md text-white border border-white/10">
                        {item.category || 'Gear'}
                      </div>

                      {/* Stock Pill */}
                      <div className="absolute top-3 right-3 text-[10px] font-bold">
                        {item.inStock ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            In Stock ({item.stockQty})
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
                            Sold Out
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Details */}
                    <div className="p-5">
                      <h3 className="text-base font-bold text-white heading-font mb-1.5 group-hover:text-[#E8452C] transition-colors line-clamp-1">
                        {item.name}
                      </h3>
                      <p className="text-gray-400 text-xs leading-relaxed line-clamp-2">
                        {item.description || 'Tested for rugged athletic durability on our training floor.'}
                      </p>
                    </div>
                  </div>

                  <div className="p-5 pt-0 border-t border-white/5 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-gray-500 block">Retail Price</span>
                      <span className="text-lg font-black text-white font-mono">
                        ETB {Number(item.price || 0).toFixed(2)}
                      </span>
                    </div>

                    <a
                      href="#contact"
                      className="text-xs font-bold text-[#E8452C] hover:underline"
                    >
                      Inquire →
                    </a>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pro Shop Banner */}
          <div className="mt-14 p-6 rounded-3xl glass-card border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#E8452C]/20 border border-[#E8452C]/40 flex items-center justify-center text-[#E8452C] shrink-0">
                <Dumbbell className="w-6 h-6 -rotate-45" />
              </div>
              <div>
                <h4 className="font-bold text-white text-base">Bulk equipment orders or custom apparel?</h4>
                <p className="text-xs text-gray-400 mt-0.5">Purchases are processed directly at the reception register in ETB with receipts.</p>
              </div>
            </div>
            <a
              href="#contact"
              className="px-5 py-2.5 rounded-xl bg-[#E8452C] text-white text-xs font-bold hover:bg-[#B5301C] transition-colors shrink-0"
            >
              Ask at Front Desk
            </a>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 10. FREQUENTLY ASKED QUESTIONS (ACCORDION) */}
      {/* ============================================================== */}
      <section className="py-24 bg-[#0D1117] border-t border-white/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="text-xs font-bold uppercase tracking-widest text-[#E8452C] mb-2">
              FREQUENT QUESTIONS
            </div>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight heading-font text-white mb-4">
              EVERYTHING YOU NEED TO KNOW
            </h2>
            <p className="text-gray-400 text-sm">
              Answers regarding memberships, Ethiopian calendar tracking, payments, and facilities.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="glass-card rounded-2xl border border-white/10 overflow-hidden transition-all"
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-white/5"
                  >
                    <span className="font-bold text-sm sm:text-base text-white">{faq.q}</span>
                    <span className="p-1 rounded-lg bg-gray-800 text-gray-400 shrink-0">
                      {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="p-5 pt-0 text-xs sm:text-sm text-gray-400 leading-relaxed border-t border-white/5 bg-black/20">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 11. CONTACT & LOCATION SECTION */}
      {/* ============================================================== */}
      <section id="contact" className="py-24 bg-[#111827] border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="text-xs font-bold uppercase tracking-widest text-[#E8452C] mb-2">
              LOCATION & HOURS
            </div>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight heading-font text-white mb-4">
              VISIT OUR ATHLETIC FLOOR
            </h2>
            <p className="text-gray-400 text-sm sm:text-base">
              Convenient downtown location with ample parking. Stop by our front desk for a guided facility walk-through.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Left: Contact Details & Quick Form */}
            <div className="glass-card p-8 rounded-3xl border border-white/10 shadow-xl">
              <h3 className="text-xl font-bold text-white heading-font mb-6">Front Desk Contacts</h3>

              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3.5 text-gray-300 text-sm">
                  <div className="w-8 h-8 rounded-lg bg-[#E8452C]/15 text-[#E8452C] flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-white block">Titan Athletic Facility</span>
                    <span className="text-xs text-gray-400">Bole District, Downtown Boulevard, Addis Ababa, Ethiopia</span>
                  </div>
                </div>

                <div className="flex items-center gap-3.5 text-gray-300 text-sm">
                  <div className="w-8 h-8 rounded-lg bg-[#E8452C]/15 text-[#E8452C] flex items-center justify-center shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-white block">+251 (911) 22-33-44</span>
                    <span className="text-xs text-gray-400">Reception Desk Direct Line</span>
                  </div>
                </div>

                <div className="flex items-center gap-3.5 text-gray-300 text-sm">
                  <div className="w-8 h-8 rounded-lg bg-[#E8452C]/15 text-[#E8452C] flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-white block">reception@titangym.et</span>
                    <span className="text-xs text-gray-400">Membership Inquiries & Support</span>
                  </div>
                </div>
              </div>

              {/* Hours Table */}
              <div className="mb-8">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Facility Opening Hours</h4>
                <div className="bg-black/30 rounded-2xl overflow-hidden border border-white/10 text-xs">
                  <div className="flex justify-between p-3.5 border-b border-white/5 text-gray-300">
                    <span className="font-semibold">Monday – Friday</span>
                    <span className="text-white font-mono font-bold">05:30 – 23:00</span>
                  </div>
                  <div className="flex justify-between p-3.5 border-b border-white/5 text-gray-300">
                    <span className="font-semibold">Saturday</span>
                    <span className="text-white font-mono font-bold">06:00 – 22:00</span>
                  </div>
                  <div className="flex justify-between p-3.5 text-gray-300">
                    <span className="font-semibold">Sunday & Public Holidays</span>
                    <span className="text-white font-mono font-bold">07:00 – 20:00</span>
                  </div>
                </div>
              </div>

              {/* Message form */}
              {contactSubmitted ? (
                <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 shrink-0" />
                  <span>Thank you! Your inquiry was sent to our front desk team. We will contact you promptly.</span>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setContactSubmitted(true);
                  }}
                  className="space-y-3"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      required
                      placeholder="Your Full Name"
                      className="w-full px-4 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 text-xs focus:outline-none focus:border-[#E8452C]"
                    />
                    <input
                      type="tel"
                      required
                      placeholder="Phone (0911...)"
                      className="w-full px-4 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 text-xs focus:outline-none focus:border-[#E8452C]"
                    />
                  </div>
                  <textarea
                    rows={3}
                    required
                    placeholder="How can we assist you with memberships or classes?"
                    className="w-full px-4 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 text-xs focus:outline-none focus:border-[#E8452C]"
                  />
                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-[#E8452C] hover:bg-[#B5301C] text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer"
                  >
                    Send Front-Desk Inquiry
                  </button>
                </form>
              )}
            </div>

            {/* Right: Location Preview Card */}
            <div className="rounded-3xl overflow-hidden border border-white/10 min-h-[420px] relative bg-gray-900 shadow-xl flex flex-col justify-end p-6">
              <div 
                className="absolute inset-0 bg-cover bg-center opacity-50"
                style={{
                  backgroundImage: `url('https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=1200&auto=format&fit=crop')`,
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/50 to-transparent" />

              <div className="relative z-10 glass-card p-6 rounded-2xl border border-white/10">
                <div className="flex items-center gap-3.5 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-[#E8452C] flex items-center justify-center text-white shrink-0 shadow-md">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-sm">Titan Gym Olympic Complex</h4>
                    <p className="text-gray-400 text-xs">Dedicated parking deck & locker amenities</p>
                  </div>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed mb-4">
                  Situated in the heart of the city with convenient accessibility, Olympic equipment testing floor, and on-site pro shop.
                </p>
                <div className="flex items-center gap-3">
                  <a
                    href="tel:+251911223344"
                    className="px-4 py-2 rounded-xl bg-[#E8452C] text-white text-xs font-bold hover:bg-[#B5301C] transition-all"
                  >
                    Call Front Desk
                  </a>
                  <a
                    href="#pricing"
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-all border border-white/15"
                  >
                    View Plans
                  </a>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 12. FOOTER */}
      {/* ============================================================== */}
      <footer className="bg-[#090C10] border-t border-white/10 py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-10 border-b border-white/10">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#E8452C] flex items-center justify-center text-white shadow-md">
                <Dumbbell className="w-5 h-5 -rotate-45" />
              </div>
              <div>
                <span className="text-lg font-black tracking-wider text-white">
                  TITAN<span className="text-[#E8452C]">GYM</span>
                </span>
                <span className="text-[10px] text-gray-500 block uppercase font-mono">
                  Ethiopian Calendar Enabled
                </span>
              </div>
            </div>

            {/* Quick Links */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-semibold text-gray-400">
              <a href="#about" className="hover:text-white transition-colors">About</a>
              <a href="#disciplines" className="hover:text-white transition-colors">Disciplines</a>
              <a href="#pricing" className="hover:text-white transition-colors">Plans (ETB)</a>
              <a href="#timetable" className="hover:text-white transition-colors">Timetable</a>
              <a href="#calculator" className="hover:text-white transition-colors">BMI Tool</a>
              <a href="#equipment" className="hover:text-white transition-colors">Pro Shop</a>
              <a href="#contact" className="hover:text-white transition-colors">Contact</a>
              <Link href="/login" className="text-[#E8452C] font-bold hover:underline">
                Staff Portal
              </Link>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
            <div>© 2026 Titan Gym & Fitness Management. All rights reserved.</div>
            <div className="flex items-center gap-6">
              <span className="hover:text-gray-400 cursor-pointer">Privacy Policy</span>
              <span className="hover:text-gray-400 cursor-pointer">Member Terms</span>
              <span className="hover:text-gray-400 cursor-pointer">Facility Guidelines</span>
            </div>
          </div>
        </div>
      </footer>

      {/* ============================================================== */}
      {/* 13. SESSION DETAIL MODAL */}
      {/* ============================================================== */}
      {activeSessionDetail && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          onClick={() => setActiveSessionDetail(null)}
        >
          <div
            className="bg-[#111827] border border-white/15 rounded-3xl max-w-md w-full p-6 text-white shadow-2xl relative animate-in fade-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setActiveSessionDetail(null)}
              className="absolute top-4 right-4 p-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#E8452C]/20 text-[#E8452C] mb-3">
              {activeSessionDetail.dayName} Class
            </div>

            <h3 className="text-2xl font-black heading-font mb-2">
              {activeSessionDetail.class?.name}
            </h3>

            <div className="flex items-center gap-4 text-xs text-gray-300 py-3 border-y border-white/10 my-4">
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#E8452C]" />
                <span className="font-mono font-bold">{activeSessionDetail.startTime} – {activeSessionDetail.endTime}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-gray-400">Duration:</span>
                <span className="font-bold text-white">{activeSessionDetail.class?.durationMinutes || 60}m</span>
              </div>
            </div>

            <p className="text-gray-300 text-xs leading-relaxed mb-6 font-normal">
              {activeSessionDetail.class?.description || "High performance workout session engineered to maximize athletic output and metabolic conditioning."}
            </p>

            <div className="bg-black/30 p-3.5 rounded-2xl border border-white/5 flex items-center justify-between text-xs text-gray-300">
              <div>
                <span className="text-gray-500 block text-[10px] uppercase font-bold">Studio Room</span>
                <span className="font-bold text-white text-sm">
                  {activeSessionDetail.room || 'Main Athletic Studio'}
                </span>
              </div>
              <div className="text-right">
                <span className="text-gray-500 block text-[10px] uppercase font-bold">Access Level</span>
                <span className="font-bold text-emerald-400 text-sm">All Active Members</span>
              </div>
            </div>

            <button
              onClick={() => setActiveSessionDetail(null)}
              className="w-full mt-6 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
            >
              Close Details
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
