import React, { useState } from 'react';
import { PageId } from '../types';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { PRODUCTS } from '../data/products';
import { ProductCard } from '../components/ProductCard';
import { AnswersheetSubjectModal } from '../components/Modals';
import { TestSeriesProgramSelector } from '../components/TestSeriesProgramSelector';
import {
  GraduationCap,
  BookOpen,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  FileCheck,
  ShieldAlert,
  Award,
  HelpCircle,
  BarChart3,
  UserCheck,
  Zap,
  Target,
  ChevronRight,
  FileText,
  Star,
  Layers,
  PhoneCall,
  Check,
  CheckSquare,
  BadgeCheck,
  ShoppingBag,
  Compass,
  Users,
  MessageSquareText,
  Percent,
} from 'lucide-react';

interface PageProps {
  onNavigate: (page: PageId) => void;
  onOpenJoinModal: () => void;
  onOpenCounsellingModal: () => void;
}

export const ProgramsPage: React.FC<PageProps> = ({
  onNavigate,
  onOpenJoinModal,
  onOpenCounsellingModal,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'cseet' | 'executive' | 'professional' | 'counselling' | 'test-series'>('all');
  const { addToCart, buyNow } = useCart();
  const { hasPurchased } = useAuth();

  const getProduct = (id: string) => PRODUCTS.find((p) => p.id === id) || PRODUCTS[0];

  return (
    <div className="pt-28 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
      {/* Hero Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-[#FFE3A0]/30 via-[#C8A45D]/20 to-[#FFE3A0]/30 border border-[#C8A45D]/60 text-[#7A5816] text-xs font-montserrat font-extrabold tracking-wider uppercase shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-[#C8A45D]" />
          <span>Exclusive 1-on-1 Mentorship • Strictly 25 Students Per Level</span>
        </div>
        <h1 className="font-cinzel text-3xl sm:text-5xl font-extrabold text-[#0F0F0F] leading-tight">
          Mentorship Crafted for <span className="text-[#8A651E]">Ranker Excellence</span>
        </h1>
        <p className="text-xs sm:text-sm text-gray-700 font-poppins max-w-2xl mx-auto leading-relaxed">
          Learn directly under <strong>Harkiran Kaur Kohli (AIR 3 • CS Professional)</strong>. Start with a <strong>100% Free 1-on-1 Guidance Call</strong> (Demo Session) and unlock personalized daily target tracking, answer presentation mastery, and continuous handholding.
        </p>

        {/* Early Bird Highlight Banner */}
        <div className="p-3.5 bg-gradient-to-r from-[#1A1815] via-[#121110] to-[#1A1815] border border-[#C8A45D]/50 rounded-2xl max-w-2xl mx-auto text-white flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2.5 text-left">
            <div className="w-8 h-8 rounded-full bg-[#C8A45D]/20 text-[#FFE3A0] flex items-center justify-center shrink-0">
              <Percent className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-montserrat font-extrabold text-[#FFE3A0] block">
                MENTORSHIP OFFER: 1ST 10 GOT THEIR OFFERS!
              </span>
              <span className="text-[11px] text-gray-300">
                Next offer: <strong>5% OFF on Mentorship</strong> with coupon code <span className="text-[#FFE3A0] font-bold">NEXT5</span> • Test Series at ₹699/subject
              </span>
            </div>
          </div>
          <span className="px-3 py-1 bg-[#C8A45D] text-black font-montserrat font-extrabold text-xs rounded-full uppercase shrink-0">
            Code: NEXT5
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            onClick={onOpenCounsellingModal}
            className="px-6 py-3.5 bg-gradient-to-r from-[#FFE3A0] via-[#C8A45D] to-[#DFB96E] hover:from-[#FFEFA6] hover:to-[#C8A45D] text-black font-montserrat font-extrabold text-xs rounded-full shadow-lg shadow-[#C8A45D]/25 transition-all transform hover:-translate-y-0.5 cursor-pointer uppercase tracking-wider flex items-center gap-2"
          >
            <PhoneCall className="w-4 h-4 text-black" />
            <span>Book 1st Guidance Call (Free Demo)</span>
          </button>
        </div>
      </div>

      {/* Free Demo Guidance Banner */}
      <div className="bg-gradient-to-br from-[#1C1917] via-[#141210] to-[#0A0A0A] border-2 border-[#C8A45D] rounded-3xl p-6 sm:p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-56 h-56 bg-[#C8A45D]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-8 space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              100% Free Demo Session
            </span>
            <h2 className="font-cinzel text-2xl sm:text-3xl font-bold text-white">
              1st 1-on-1 Guidance Call with AIR 3 Harkiran Kaur
            </h2>
            <p className="text-xs sm:text-sm text-gray-300 font-poppins leading-relaxed max-w-2xl">
              Experience our mentorship just like a demo lecture. Before you enroll in any paid program, schedule an honest 1-on-1 guidance call to review your current syllabus preparation, daily schedule, and exam roadmap.
            </p>
            <div className="flex flex-wrap gap-4 pt-1 text-xs text-gray-300">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#C8A45D]" /> 30-Minute In-Depth Call
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#C8A45D]" /> Syllabus Readiness Audit
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#C8A45D]" /> Zero Obligation / 100% Free
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3 justify-center">
            <button
              onClick={onOpenCounsellingModal}
              className="w-full py-3.5 bg-gradient-to-r from-[#FFE3A0] via-[#C8A45D] to-[#DFB96E] text-black font-montserrat font-extrabold text-xs rounded-xl hover:brightness-110 shadow-lg cursor-pointer uppercase tracking-wider flex items-center justify-center gap-2"
            >
              <PhoneCall className="w-4 h-4 text-black" />
              <span>Claim Free 1st Guidance Call</span>
            </button>
            <div className="text-center text-[11px] text-[#FFE3A0] font-montserrat">
              ★ Price: <strong className="text-emerald-400">₹0 Free Demo</strong> (Regular: ₹999)
            </div>
          </div>
        </div>
      </div>

      {/* Program Selector Tabs */}
      <div className="space-y-8">
        <div className="text-center space-y-2">
          <span className="text-xs font-montserrat font-bold text-[#8A651E] uppercase tracking-widest">
            Level-Wise Mentorship Offerings
          </span>
          <h2 className="font-cinzel text-2xl sm:text-3xl font-bold text-[#0F0F0F]">
            Choose Your Level Mentorship Batch
          </h2>
          <p className="text-xs text-gray-600 font-poppins">
            Strictly limited to 25 students per level to maintain supreme 1-on-1 focus.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 p-1.5 bg-white border border-[#C8A45D]/40 rounded-full max-w-4xl mx-auto shadow-sm">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-full text-xs font-montserrat font-bold transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-gradient-to-r from-[#FFE3A0] to-[#C8A45D] text-black shadow-md'
                : 'text-gray-700 hover:text-[#8A651E] hover:bg-[#F8F6F2]'
            }`}
          >
            All Programs
          </button>
          <button
            onClick={() => setActiveTab('cseet')}
            className={`px-4 py-2 rounded-full text-xs font-montserrat font-bold transition-all cursor-pointer ${
              activeTab === 'cseet'
                ? 'bg-gradient-to-r from-[#FFE3A0] to-[#C8A45D] text-black shadow-md'
                : 'text-gray-700 hover:text-[#8A651E] hover:bg-[#F8F6F2]'
            }`}
          >
            Level 1: CSEET (Oct 2026)
          </button>
          <button
            onClick={() => setActiveTab('executive')}
            className={`px-4 py-2 rounded-full text-xs font-montserrat font-bold transition-all cursor-pointer ${
              activeTab === 'executive'
                ? 'bg-gradient-to-r from-[#FFE3A0] to-[#C8A45D] text-black shadow-md'
                : 'text-gray-700 hover:text-[#8A651E] hover:bg-[#F8F6F2]'
            }`}
          >
            Level 2: CS Executive (Dec 2026)
          </button>
          <button
            onClick={() => setActiveTab('professional')}
            className={`px-4 py-2 rounded-full text-xs font-montserrat font-bold transition-all cursor-pointer ${
              activeTab === 'professional'
                ? 'bg-gradient-to-r from-[#FFE3A0] to-[#C8A45D] text-black shadow-md'
                : 'text-gray-700 hover:text-[#8A651E] hover:bg-[#F8F6F2]'
            }`}
          >
            Level 3: CS Professional (Dec 2026)
          </button>
          <button
            onClick={() => setActiveTab('counselling')}
            className={`px-4 py-2 rounded-full text-xs font-montserrat font-bold transition-all cursor-pointer ${
              activeTab === 'counselling'
                ? 'bg-gradient-to-r from-[#FFE3A0] to-[#C8A45D] text-black shadow-md'
                : 'text-gray-700 hover:text-[#8A651E] hover:bg-[#F8F6F2]'
            }`}
          >
            Career Counselling (After 12th)
          </button>
          <button
            onClick={() => setActiveTab('test-series')}
            className={`px-4 py-2 rounded-full text-xs font-montserrat font-bold transition-all cursor-pointer ${
              activeTab === 'test-series'
                ? 'bg-gradient-to-r from-[#FFE3A0] to-[#C8A45D] text-black shadow-md'
                : 'text-gray-700 hover:text-[#8A651E] hover:bg-[#F8F6F2]'
            }`}
          >
            Answersheet Analysis Report
          </button>
        </div>

        {/* Content Display: Dedicated Selector for Test Series vs Grid for Other Programs */}
        {activeTab === 'test-series' ? (
          <div className="space-y-10">
            <TestSeriesProgramSelector onNavigate={onNavigate} />

            {/* Test Series Starting Soon Notice Card */}
            <div className="p-6 sm:p-8 bg-gradient-to-br from-[#1C1917] via-[#141210] to-[#0A0A0A] border-2 border-[#C8A45D]/60 rounded-3xl text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-left">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 bg-[#C8A45D]/20 text-[#FFE3A0] text-[10px] font-bold uppercase rounded-full inline-block">
                    Full Evaluation System
                  </span>
                  <span className="text-xs text-gray-400">All 3 Levels (CSEET, Exec, Prof)</span>
                </div>
                <h3 className="font-cinzel text-xl sm:text-2xl font-bold text-white">Full Chapter-Wise Test Series</h3>
                <p className="text-xs sm:text-sm text-gray-300 font-poppins max-w-2xl leading-relaxed">
                  Comprehensive evaluated chapter-wise test series with suggested answers, ICSI step-marking schemes, and AIR 3 review comments will be starting soon for all CS modules.
                </p>
              </div>
              <div className="p-4 bg-white/5 border border-white/10 rounded-2xl text-center shrink-0 w-full md:w-auto">
                <span className="text-xs font-montserrat font-extrabold text-[#FFE3A0] uppercase tracking-wider block">
                  Full Series Starting Soon
                </span>
                <span className="text-[10px] text-gray-400 mt-0.5 block">Currently Enrolling June 2026 Certified Copy Audits</span>
              </div>
            </div>
          </div>
        ) : (
          /* Dynamic Level Cards Grid for Mentorship & All */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* June 2026 Answersheet Analysis Report (under all) */}
            {activeTab === 'all' && (
              <ProductCard
                product={getProduct('june-2026-answersheet-analysis')}
                onNavigate={onNavigate}
                badgeLabel="June 2026 Certified Copy Analysis"
              />
            )}

            {/* 1. CSEET Oct 2026 Mentorship */}
            {(activeTab === 'all' || activeTab === 'cseet') && (
              <ProductCard
                product={getProduct('cseet-mentorship')}
                onNavigate={onNavigate}
                badgeLabel="October 2026 Batch"
              />
            )}

          {/* 2. CS Executive Group 1 */}
          {(activeTab === 'all' || activeTab === 'executive') && (
            <ProductCard
              product={getProduct('exec-g1-mentorship')}
              onNavigate={onNavigate}
              badgeLabel="Group 1 • Dec 2026"
            />
          )}

          {/* 3. CS Executive Group 2 */}
          {(activeTab === 'all' || activeTab === 'executive') && (
            <ProductCard
              product={getProduct('exec-g2-mentorship')}
              onNavigate={onNavigate}
              badgeLabel="Group 2 • Dec 2026"
            />
          )}

          {/* 4. CS Executive Both Groups */}
          {(activeTab === 'all' || activeTab === 'executive') && (
            <ProductCard
              product={getProduct('exec-both-mentorship')}
              onNavigate={onNavigate}
              badgeLabel="Both Groups (G1+G2)"
            />
          )}

          {/* 5. CS Professional Group 1 */}
          {(activeTab === 'all' || activeTab === 'professional') && (
            <ProductCard
              product={getProduct('prof-g1-mentorship')}
              onNavigate={onNavigate}
              badgeLabel="Prof Group 1 • Dec 2026"
            />
          )}

          {/* 6. CS Professional Group 2 */}
          {(activeTab === 'all' || activeTab === 'professional') && (
            <ProductCard
              product={getProduct('prof-g2-mentorship')}
              onNavigate={onNavigate}
              badgeLabel="Prof Group 2 • Dec 2026"
            />
          )}

          {/* 7. CS Professional Both Groups */}
          {(activeTab === 'all' || activeTab === 'professional') && (
            <ProductCard
              product={getProduct('prof-both-mentorship')}
              onNavigate={onNavigate}
              badgeLabel="Prof Both Groups • Dec 2026"
            />
          )}

          {/* 8. Career Roadmap & Counselling After 12th */}
          {(activeTab === 'all' || activeTab === 'counselling') && (
            <ProductCard
              product={getProduct('career-counselling-12th')}
              onNavigate={onNavigate}
              badgeLabel="Career Roadmap (Post 12th)"
            />
          )}
        </div>
        )}
      </div>

      {/* Detailed Pricing & Level Matrix Breakdown */}
      <div className="bg-white border border-[#C8A45D]/40 rounded-3xl p-6 sm:p-10 shadow-lg space-y-8">
        <div className="border-b border-[#C8A45D]/20 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-xs font-montserrat font-bold text-[#8A651E] uppercase tracking-widest block">
              Official Program Directory
            </span>
            <h3 className="font-cinzel text-2xl font-bold text-[#0F0F0F]">
              Transparent Mentorship Fee Structure
            </h3>
          </div>
          <span className="text-xs bg-[#C8A45D]/15 text-[#8A651E] px-3 py-1 rounded-full font-bold border border-[#C8A45D]/30">
            1st 10 got their offers! Next: Use code <strong className="text-black">NEXT5</strong> for 5% OFF on Mentorship
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Level 1: CSEET */}
          <div className="p-6 bg-[#FAF8F5] border border-[#C8A45D]/40 rounded-2xl space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <span className="px-2.5 py-1 bg-emerald-500/15 text-emerald-800 text-[10px] font-bold uppercase rounded-md">
                Level 1 • Oct 2026
              </span>
              <h4 className="font-cinzel text-lg font-bold text-[#0F0F0F]">CSEET Mentorship</h4>
              <p className="text-xs text-gray-600">
                Complete 4-subject guidance, daily micro-targets, and continuous motivation with AIR 3 Ranker.
              </p>
              <div className="pt-2">
                <span className="text-xs text-gray-500 block">Full Program Fee</span>
                <div className="font-cinzel text-3xl font-extrabold text-[#8A651E]">₹1,199/-</div>
                <span className="text-[11px] text-emerald-700 font-bold block mt-0.5">
                  With Early Bird (25% OFF): ₹899/- only
                </span>
              </div>
            </div>
            <button
              onClick={() => buyNow(getProduct('cseet-mentorship'))}
              className="w-full py-2.5 bg-gradient-to-r from-[#FFE3A0] to-[#C8A45D] text-black font-montserrat font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
            >
              <span>Join CSEET Batch (₹1,199)</span>
              <Zap className="w-3.5 h-3.5 fill-black" />
            </button>
          </div>

          {/* Level 2: CS Executive */}
          <div className="p-6 bg-[#FAF8F5] border-2 border-[#C8A45D] rounded-2xl space-y-4 flex flex-col justify-between relative shadow-md">
            <div className="absolute -top-3 right-4 px-3 py-0.5 bg-[#C8A45D] text-black font-montserrat font-extrabold text-[10px] uppercase rounded-full shadow-sm">
              December 2026 Batch
            </div>
            <div className="space-y-3">
              <span className="px-2.5 py-1 bg-amber-500/15 text-amber-800 text-[10px] font-bold uppercase rounded-md">
                Level 2 • Dec 2026
              </span>
              <h4 className="font-cinzel text-lg font-bold text-[#0F0F0F]">CS Executive Mentorship</h4>
              <ul className="text-xs text-gray-700 space-y-2 pt-1 font-poppins">
                <li className="flex justify-between border-b border-gray-200 pb-1">
                  <span>Group 1 Only:</span>
                  <strong className="text-[#8A651E]">₹1,999/-</strong>
                </li>
                <li className="flex justify-between border-b border-gray-200 pb-1">
                  <span>Group 2 Only:</span>
                  <strong className="text-[#8A651E]">₹1,699/-</strong>
                </li>
                <li className="flex justify-between font-bold text-black pt-0.5">
                  <span>Both Groups (G1+G2):</span>
                  <span className="text-[#8A651E] font-extrabold">₹3,249/-</span>
                </li>
              </ul>
              <span className="text-[11px] text-emerald-700 font-bold block pt-1">
                Early Bird 25% OFF applies on all options!
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => buyNow(getProduct('exec-g1-mentorship'))}
                className="py-2 bg-white hover:bg-gray-100 text-[#0F0F0F] border border-[#C8A45D] font-bold text-xs rounded-xl text-center"
              >
                G1 (₹1,999)
              </button>
              <button
                onClick={() => buyNow(getProduct('exec-both-mentorship'))}
                className="py-2 bg-gradient-to-r from-[#FFE3A0] to-[#C8A45D] text-black font-extrabold text-xs rounded-xl text-center"
              >
                Both (₹3,249)
              </button>
            </div>
          </div>

          {/* Level 3: CS Professional */}
          <div className="p-6 bg-[#FAF8F5] border border-[#C8A45D]/40 rounded-2xl space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <span className="px-2.5 py-1 bg-purple-500/15 text-purple-800 text-[10px] font-bold uppercase rounded-md">
                Level 3 • Dec 2026
              </span>
              <h4 className="font-cinzel text-lg font-bold text-[#0F0F0F]">CS Professional Mentorship</h4>
              <ul className="text-xs text-gray-700 space-y-2 pt-1 font-poppins">
                <li className="flex justify-between border-b border-gray-200 pb-1">
                  <span>Group 1 Only:</span>
                  <strong className="text-[#8A651E]">₹2,499/-</strong>
                </li>
                <li className="flex justify-between border-b border-gray-200 pb-1">
                  <span>Group 2 Only:</span>
                  <strong className="text-[#8A651E]">₹1,999/-</strong>
                </li>
                <li className="flex justify-between font-bold text-black pt-0.5">
                  <span>Both Groups:</span>
                  <span className="text-[#8A651E] font-extrabold">₹3,999/-</span>
                </li>
              </ul>
              <span className="text-[11px] text-emerald-700 font-bold block pt-1">
                Learn directly from AIR 3 Harkiran Kaur!
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => buyNow(getProduct('prof-g1-mentorship'))}
                className="py-2 bg-white hover:bg-gray-100 text-[#0F0F0F] border border-[#C8A45D] font-bold text-xs rounded-xl text-center"
              >
                G1 (₹2,499)
              </button>
              <button
                onClick={() => buyNow(getProduct('prof-both-mentorship'))}
                className="py-2 bg-gradient-to-r from-[#FFE3A0] to-[#C8A45D] text-black font-extrabold text-xs rounded-xl text-center"
              >
                Both (₹3,999)
              </button>
            </div>
          </div>
        </div>

        {/* Section 4: Career Counselling & Guidance After 12th */}
        <div className="p-6 bg-gradient-to-r from-[#1A1815] to-[#12100E] border border-[#C8A45D]/40 rounded-2xl text-white flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="px-2.5 py-0.5 bg-[#C8A45D]/20 text-[#FFE3A0] text-[10px] font-bold uppercase rounded border border-[#C8A45D]/30">
              Career Counselling
            </span>
            <h4 className="font-cinzel text-xl font-bold text-white">
              Career Roadmap & Counselling After 12th (₹999/-)
            </h4>
            <p className="text-xs text-gray-300 max-w-2xl font-poppins">
              Confused about whether to choose Company Secretary (CS) after 12th? Get an in-depth 1-on-1 decision session with AIR 3 Harkiran Kaur comparing CS vs CA vs Law, regular vs correspondence graduation, and step-by-step career path.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <button
              onClick={() => addToCart(getProduct('career-counselling-12th'))}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-[#C8A45D]" /> Add to Cart
            </button>
            <button
              onClick={() => buyNow(getProduct('career-counselling-12th'))}
              className="px-5 py-2.5 bg-gradient-to-r from-[#FFE3A0] to-[#C8A45D] text-black font-montserrat font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 uppercase cursor-pointer"
            >
              <span>Book Session (₹999)</span>
              <Zap className="w-3.5 h-3.5 fill-black" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const CSEETPage: React.FC<PageProps> = ({ onNavigate, onOpenCounsellingModal, onOpenJoinModal }) => {
  const { buyNow, addToCart } = useCart();
  const getProduct = (id: string) => PRODUCTS.find((p) => p.id === id) || PRODUCTS[0];

  return (
    <div className="pt-28 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
      <div className="bg-[#0F0F0F] border border-[#C8A45D]/50 rounded-3xl p-8 sm:p-12 space-y-6 text-white shadow-xl">
        <span className="text-xs font-montserrat font-bold text-emerald-400 uppercase tracking-widest">
          LEVEL 1 — CSEET October 2026 Batch
        </span>
        <h1 className="font-cinzel text-3xl sm:text-4xl font-bold text-white">
          CSEET October 2026 1-on-1 Mentorship Batch
        </h1>
        <p className="text-xs sm:text-sm text-gray-300 max-w-2xl font-poppins leading-relaxed">
          Target 170+ marks in CSEET! Get direct 1-on-1 guidance from Harkiran Kaur Kohli (AIR 3). Daily target tracking, schedule routine planning, and doubt support across all 4 subjects.
        </p>

        {/* Papers Breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl pt-2">
          <div className="p-4 bg-white/5 border border-[#C8A45D]/30 rounded-2xl">
            <span className="text-[10px] text-gray-400 uppercase font-bold block">Paper 1</span>
            <span className="text-sm font-bold text-white">Business Communication</span>
          </div>
          <div className="p-4 bg-white/5 border border-[#C8A45D]/30 rounded-2xl">
            <span className="text-[10px] text-gray-400 uppercase font-bold block">Paper 2</span>
            <span className="text-sm font-bold text-white">Fundamentals of Accounting</span>
          </div>
          <div className="p-4 bg-white/5 border border-[#C8A45D]/30 rounded-2xl">
            <span className="text-[10px] text-gray-400 uppercase font-bold block">Paper 3</span>
            <span className="text-sm font-bold text-white">Economic & Business Env.</span>
          </div>
          <div className="p-4 bg-white/5 border border-[#C8A45D]/30 rounded-2xl">
            <span className="text-[10px] text-gray-400 uppercase font-bold block">Paper 4</span>
            <span className="text-sm font-bold text-white">Business Law & Mgmt</span>
          </div>
        </div>

        {/* Pricing & Enrollment Card */}
        <div className="p-6 bg-white/5 border-2 border-[#C8A45D] rounded-2xl max-w-xl space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase rounded">
                Only 25 Seats Per Batch
              </span>
              <h3 className="font-cinzel text-xl font-bold text-white mt-1">CSEET Full Mentorship (Oct 2026)</h3>
              <p className="text-xs text-gray-400 mt-1">1st Guidance Call is 100% Free (Demo)</p>
            </div>
            <div className="text-right">
              <span className="font-cinzel text-3xl font-extrabold text-[#FFE3A0]">₹1,199/-</span>
              <span className="text-xs text-emerald-400 block font-bold">Code: NEXT5 (5% OFF)</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => addToCart(getProduct('cseet-mentorship'))}
              className="py-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4 text-[#C8A45D]" /> Add to Cart
            </button>
            <button
              onClick={() => buyNow(getProduct('cseet-mentorship'))}
              className="py-3 bg-gradient-to-r from-[#FFE3A0] to-[#C8A45D] text-black font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 uppercase cursor-pointer"
            >
              <span>Join Batch</span>
              <Zap className="w-4 h-4 fill-black" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const CSExecutivePage: React.FC<PageProps> = ({ onNavigate, onOpenCounsellingModal, onOpenJoinModal }) => {
  const { addToCart, buyNow } = useCart();
  const getProduct = (id: string) => PRODUCTS.find((p) => p.id === id) || PRODUCTS[0];

  return (
    <div className="pt-28 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
      <div className="bg-[#0F0F0F] border border-[#C8A45D]/50 rounded-3xl p-8 sm:p-12 space-y-6 text-white shadow-xl">
        <span className="text-xs font-montserrat font-bold text-[#C8A45D] uppercase tracking-widest">
          LEVEL 2 — CS Executive December 2026 Batch
        </span>
        <h1 className="font-cinzel text-3xl sm:text-4xl font-bold text-white">
          CS Executive 1-on-1 Mentorship Programs
        </h1>
        <p className="text-xs sm:text-sm text-gray-300 max-w-2xl font-poppins leading-relaxed">
          Master Group 1 (JIGL, Company Law, SBLL, CAFM) and Group 2 (CMSL, ECIPL, Tax Laws) with Harkiran Kaur Kohli's personal mentorship system. Strictly capped to 25 students per level.
        </p>

        {/* 3 Executive Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl pt-4">
          {/* Group 1 */}
          <div className="p-6 bg-white/5 border border-[#C8A45D]/40 rounded-2xl flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <span className="text-[10px] text-[#FFE3A0] uppercase font-bold block">Group 1 (JIGL, CLAW, SBLL, CAFM)</span>
              <h3 className="font-cinzel text-lg font-bold text-white">Group 1 Mentorship</h3>
              <div className="font-cinzel text-3xl font-extrabold text-[#FFE3A0]">₹1,999/-</div>
              <p className="text-xs text-gray-400">Daily routine planning, answer writing techniques, and doubt calls.</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => addToCart(getProduct('exec-g1-mentorship'))}
                className="py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-bold flex items-center justify-center gap-1"
              >
                <ShoppingBag className="w-3.5 h-3.5 text-[#C8A45D]" /> Add
              </button>
              <button
                onClick={() => buyNow(getProduct('exec-g1-mentorship'))}
                className="py-2.5 bg-gradient-to-r from-[#FFE3A0] to-[#C8A45D] text-black font-extrabold rounded-xl text-xs flex items-center justify-center gap-1 uppercase"
              >
                <span>Buy</span>
                <Zap className="w-3.5 h-3.5 fill-black" />
              </button>
            </div>
          </div>

          {/* Group 2 */}
          <div className="p-6 bg-white/5 border border-[#C8A45D]/40 rounded-2xl flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <span className="text-[10px] text-[#FFE3A0] uppercase font-bold block">Group 2 (CMSL, ECIPL, TAX)</span>
              <h3 className="font-cinzel text-lg font-bold text-white">Group 2 Mentorship</h3>
              <div className="font-cinzel text-3xl font-extrabold text-[#FFE3A0]">₹1,699/-</div>
              <p className="text-xs text-gray-400">SEBI regulations, Tax laws strategy, and daily milestone tracking.</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => addToCart(getProduct('exec-g2-mentorship'))}
                className="py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-bold flex items-center justify-center gap-1"
              >
                <ShoppingBag className="w-3.5 h-3.5 text-[#C8A45D]" /> Add
              </button>
              <button
                onClick={() => buyNow(getProduct('exec-g2-mentorship'))}
                className="py-2.5 bg-gradient-to-r from-[#FFE3A0] to-[#C8A45D] text-black font-extrabold rounded-xl text-xs flex items-center justify-center gap-1 uppercase"
              >
                <span>Buy</span>
                <Zap className="w-3.5 h-3.5 fill-black" />
              </button>
            </div>
          </div>

          {/* Both Groups */}
          <div className="p-6 bg-white/5 border-2 border-[#C8A45D] rounded-2xl flex flex-col justify-between space-y-4 relative shadow-lg">
            <div className="absolute -top-3 right-4 px-2.5 py-0.5 bg-[#C8A45D] text-black text-[9px] font-bold uppercase rounded-full">
              Most Popular
            </div>
            <div className="space-y-2">
              <span className="text-[10px] text-emerald-400 uppercase font-bold block">Both Groups (G1 + G2)</span>
              <h3 className="font-cinzel text-lg font-bold text-white">Both Groups Mentorship</h3>
              <div className="font-cinzel text-3xl font-extrabold text-[#FFE3A0]">₹3,249/-</div>
              <p className="text-xs text-gray-400">Complete 7-paper dual group mastery roadmap for December 2026.</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => addToCart(getProduct('exec-both-mentorship'))}
                className="py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-bold flex items-center justify-center gap-1"
              >
                <ShoppingBag className="w-3.5 h-3.5 text-[#C8A45D]" /> Add
              </button>
              <button
                onClick={() => buyNow(getProduct('exec-both-mentorship'))}
                className="py-2.5 bg-gradient-to-r from-[#FFE3A0] to-[#C8A45D] text-black font-extrabold rounded-xl text-xs flex items-center justify-center gap-1 uppercase"
              >
                <span>Buy</span>
                <Zap className="w-3.5 h-3.5 fill-black" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const CSProfessionalPage: React.FC<PageProps> = ({ onNavigate, onOpenCounsellingModal, onOpenJoinModal }) => {
  const { addToCart, buyNow } = useCart();
  const getProduct = (id: string) => PRODUCTS.find((p) => p.id === id) || PRODUCTS[0];

  return (
    <div className="pt-28 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
      <div className="bg-[#0F0F0F] border border-[#C8A45D]/50 rounded-3xl p-8 sm:p-12 space-y-6 text-white shadow-xl">
        <span className="text-xs font-montserrat font-bold text-purple-400 uppercase tracking-widest">
          LEVEL 3 — CS Professional December 2026 Batch
        </span>
        <h1 className="font-cinzel text-3xl sm:text-4xl font-bold text-white">
          CS Professional Mentorship by AIR 3 Harkiran Kaur
        </h1>
        <p className="text-xs sm:text-sm text-gray-300 max-w-2xl font-poppins leading-relaxed">
          Learn directly under Harkiran Kaur Kohli who achieved All India Rank 3 in CS Professional. Master complex corporate restructuring, drafting, governance, and scoring techniques.
        </p>

        {/* 3 Professional Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl pt-4">
          {/* Group 1 */}
          <div className="p-6 bg-white/5 border border-[#C8A45D]/40 rounded-2xl flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <span className="text-[10px] text-[#FFE3A0] uppercase font-bold block">Group 1 (Governance & Drafting)</span>
              <h3 className="font-cinzel text-lg font-bold text-white">Prof Group 1 Mentorship</h3>
              <div className="font-cinzel text-3xl font-extrabold text-[#FFE3A0]">₹2,499/-</div>
              <p className="text-xs text-gray-400">Legal drafting frameworks and governance exemption roadmap.</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => addToCart(getProduct('prof-g1-mentorship'))}
                className="py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-bold flex items-center justify-center gap-1"
              >
                <ShoppingBag className="w-3.5 h-3.5 text-[#C8A45D]" /> Add
              </button>
              <button
                onClick={() => buyNow(getProduct('prof-g1-mentorship'))}
                className="py-2.5 bg-gradient-to-r from-[#FFE3A0] to-[#C8A45D] text-black font-extrabold rounded-xl text-xs flex items-center justify-center gap-1 uppercase"
              >
                <span>Buy</span>
                <Zap className="w-3.5 h-3.5 fill-black" />
              </button>
            </div>
          </div>

          {/* Group 2 */}
          <div className="p-6 bg-white/5 border border-[#C8A45D]/40 rounded-2xl flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <span className="text-[10px] text-[#FFE3A0] uppercase font-bold block">Group 2 (Restructuring & IBC)</span>
              <h3 className="font-cinzel text-lg font-bold text-white">Prof Group 2 Mentorship</h3>
              <div className="font-cinzel text-3xl font-extrabold text-[#FFE3A0]">₹1,999/-</div>
              <p className="text-xs text-gray-400">Corporate valuation, IBC case studies, and strategic answer structuring.</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => addToCart(getProduct('prof-g2-mentorship'))}
                className="py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-bold flex items-center justify-center gap-1"
              >
                <ShoppingBag className="w-3.5 h-3.5 text-[#C8A45D]" /> Add
              </button>
              <button
                onClick={() => buyNow(getProduct('prof-g2-mentorship'))}
                className="py-2.5 bg-gradient-to-r from-[#FFE3A0] to-[#C8A45D] text-black font-extrabold rounded-xl text-xs flex items-center justify-center gap-1 uppercase"
              >
                <span>Buy</span>
                <Zap className="w-3.5 h-3.5 fill-black" />
              </button>
            </div>
          </div>

          {/* Both Groups */}
          <div className="p-6 bg-white/5 border-2 border-[#C8A45D] rounded-2xl flex flex-col justify-between space-y-4 relative shadow-lg">
            <div className="absolute -top-3 right-4 px-2.5 py-0.5 bg-[#C8A45D] text-black text-[9px] font-bold uppercase rounded-full">
              AIR 3 Flagship
            </div>
            <div className="space-y-2">
              <span className="text-[10px] text-emerald-400 uppercase font-bold block">Both Professional Groups</span>
              <h3 className="font-cinzel text-lg font-bold text-white">Complete Prof Mentorship</h3>
              <div className="font-cinzel text-3xl font-extrabold text-[#FFE3A0]">₹3,999/-</div>
              <p className="text-xs text-gray-400">Comprehensive Ranker Blueprint for all papers with weekly review calls.</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => addToCart(getProduct('prof-both-mentorship'))}
                className="py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-bold flex items-center justify-center gap-1"
              >
                <ShoppingBag className="w-3.5 h-3.5 text-[#C8A45D]" /> Add
              </button>
              <button
                onClick={() => buyNow(getProduct('prof-both-mentorship'))}
                className="py-2.5 bg-gradient-to-r from-[#FFE3A0] to-[#C8A45D] text-black font-extrabold rounded-xl text-xs flex items-center justify-center gap-1 uppercase"
              >
                <span>Buy</span>
                <Zap className="w-3.5 h-3.5 fill-black" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const CareerCounsellingPage: React.FC<PageProps> = ({ onNavigate, onOpenCounsellingModal }) => {
  const { addToCart, buyNow } = useCart();
  const getProduct = (id: string) => PRODUCTS.find((p) => p.id === id) || PRODUCTS[0];

  return (
    <div className="pt-28 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
      <div className="bg-[#0F0F0F] border border-[#C8A45D]/50 rounded-3xl p-8 sm:p-12 space-y-6 text-white shadow-xl">
        <span className="text-xs font-montserrat font-bold text-[#C8A45D] uppercase tracking-widest">
          Career Guidance & Decision Framework
        </span>
        <h1 className="font-cinzel text-3xl sm:text-4xl font-bold text-white">
          CS Career Counselling & Roadmap After 12th
        </h1>
        <p className="text-xs sm:text-sm text-gray-300 max-w-2xl font-poppins leading-relaxed">
          Passed your 12th board exams and deciding on your future? Get clear, honest guidance from All India Rank 3 CS Professional Harkiran Kaur Kohli on Company Secretary career scope, compensation, college management, and study blueprints.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl pt-2">
          <div className="p-5 bg-white/5 border border-[#C8A45D]/30 rounded-2xl space-y-2">
            <Compass className="w-6 h-6 text-[#C8A45D]" />
            <h3 className="font-cinzel text-base font-bold text-white">CS vs CA vs Law</h3>
            <p className="text-xs text-gray-400">Discover which professional path matches your personality, skillset, and long-term goals.</p>
          </div>

          <div className="p-5 bg-white/5 border border-[#C8A45D]/30 rounded-2xl space-y-2">
            <GraduationCap className="w-6 h-6 text-[#C8A45D]" />
            <h3 className="font-cinzel text-base font-bold text-white">College Selection Advice</h3>
            <p className="text-xs text-gray-400">Regular B.Com vs Distance Learning vs Law school balance with CS preparations.</p>
          </div>

          <div className="p-5 bg-white/5 border border-[#C8A45D]/30 rounded-2xl space-y-2">
            <Target className="w-6 h-6 text-[#C8A45D]" />
            <h3 className="font-cinzel text-base font-bold text-white">Step-by-Step 3 Year Plan</h3>
            <p className="text-xs text-gray-400">Clear milestones from CSEET entry to executive, professional, and management training.</p>
          </div>
        </div>

        {/* Pricing Card */}
        <div className="p-6 bg-white/5 border-2 border-[#C8A45D] rounded-2xl max-w-xl space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <span className="px-2.5 py-0.5 bg-[#C8A45D]/20 text-[#FFE3A0] text-[10px] font-bold uppercase rounded">
                1-on-1 Guidance Session
              </span>
              <h3 className="font-cinzel text-xl font-bold text-white mt-1">12th Career Decision Roadmap</h3>
            </div>
            <div className="text-right">
              <span className="font-cinzel text-3xl font-extrabold text-[#FFE3A0]">₹999/-</span>
              <span className="text-xs text-emerald-400 block font-bold">Code: NEXT5 (5% OFF)</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => addToCart(getProduct('career-counselling-12th'))}
              className="py-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4 text-[#C8A45D]" /> Add to Cart
            </button>
            <button
              onClick={() => buyNow(getProduct('career-counselling-12th'))}
              className="py-3 bg-gradient-to-r from-[#FFE3A0] to-[#C8A45D] text-black font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 uppercase cursor-pointer"
            >
              <span>Book Session</span>
              <Zap className="w-4 h-4 fill-black" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const TestSeriesPage: React.FC<PageProps> = ({
  onNavigate,
  onOpenJoinModal,
  onOpenCounsellingModal,
}) => {
  const { addToCart, buyNow } = useCart();
  const getProduct = (id: string) => PRODUCTS.find((p) => p.id === id) || PRODUCTS[0];
  const [selectedSubject, setSelectedSubject] = useState('Company Law & Practice');
  const [isAnswersheetModalOpen, setIsAnswersheetModalOpen] = useState(false);

  const subjects = [
    { name: 'Company Law & Practice', level: 'Executive G1' },
    { name: 'Jurisprudence, Interpretation & General Laws (JIGL)', level: 'Executive G1' },
    { name: 'Setting Up of Business, Industrial & Labour Laws (SBLL)', level: 'Executive G1' },
    { name: 'Corporate Accounting & Financial Management (CAFM)', level: 'Executive G1' },
    { name: 'Capital Markets & Securities Laws (CMSL)', level: 'Executive G2' },
    { name: 'Economic, Commercial & Intellectual Property Laws (ECIPL)', level: 'Executive G2' },
    { name: 'Tax Laws & Practice (TLP)', level: 'Executive G2' },
    { name: 'Environmental, Social and Governance (ESG) - Principles & Practice', level: 'Professional G1' },
    { name: 'Drafting, Pleadings and Appearances', level: 'Professional G1' },
    { name: 'Compliance Management, Audit & Due Diligence', level: 'Professional G1' },
    { name: 'Corporate Restructuring, Valuation & Insolvency', level: 'Professional G2' },
  ];

  const handleSingleAdd = () => {
    const customProduct = {
      ...getProduct('june-2026-answersheet-analysis'),
      name: `June 2026 Answersheet Analysis (${selectedSubject})`,
      description: `June 2026 ICSI Certified Answersheet Analysis & Step-Marking Report by AIR 3 Harkiran Kaur Kohli for ${selectedSubject}.`,
      features: [
        `Selected Subject: ${selectedSubject}`,
        'Line-by-line mark deduction & statutory drafting audit',
        'ICSI step-marking breakdown against official model answers',
        'Personal audio/video feedback breakdown by AIR 3 Harkiran Kaur',
        'Personalized score-boosting action plan for next attempt',
        'Turnaround time: 48-72 hours via WhatsApp / Email',
      ],
    };
    addToCart(customProduct);
  };

  const handleSingleBuy = () => {
    const customProduct = {
      ...getProduct('june-2026-answersheet-analysis'),
      name: `June 2026 Answersheet Analysis (${selectedSubject})`,
      description: `June 2026 ICSI Certified Answersheet Analysis & Step-Marking Report by AIR 3 Harkiran Kaur Kohli for ${selectedSubject}.`,
      features: [
        `Selected Subject: ${selectedSubject}`,
        'Line-by-line mark deduction & statutory drafting audit',
        'ICSI step-marking breakdown against official model answers',
        'Personal audio/video feedback breakdown by AIR 3 Harkiran Kaur',
        'Personalized score-boosting action plan for next attempt',
        'Turnaround time: 48-72 hours via WhatsApp / Email',
      ],
    };
    buyNow(customProduct);
  };

  return (
    <div className="pt-28 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
      {/* Hero Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-[#FFE3A0]/30 via-[#C8A45D]/20 to-[#FFE3A0]/30 border border-[#C8A45D]/60 text-[#7A5816] text-xs font-montserrat font-extrabold tracking-wider uppercase shadow-sm">
          <FileCheck className="w-3.5 h-3.5 text-[#C8A45D]" />
          <span>June 2026 Attempt Evaluation • 1-on-1 Certified Copy Audit</span>
        </div>
        <h1 className="font-cinzel text-3xl sm:text-5xl font-extrabold text-[#0F0F0F] leading-tight">
          June 2026 Answersheet <span className="text-[#8A651E]">Analysis Report</span>
        </h1>
        <p className="text-xs sm:text-sm text-gray-700 font-poppins max-w-2xl mx-auto leading-relaxed">
          Don't repeat the same mistakes in your next attempt. Get your ICSI certified answersheet evaluated line-by-line by <strong>AIR 3 Harkiran Kaur Kohli</strong> to uncover step-marking deductions, statutory drafting flaws, and receive an actionable score-booster roadmap.
        </p>

        {/* Pricing Badge Banner */}
        <div className="p-4 bg-gradient-to-r from-[#1A1815] via-[#121110] to-[#1A1815] border border-[#C8A45D]/50 rounded-2xl max-w-2xl mx-auto text-white flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3 text-left">
            <div className="w-10 h-10 rounded-full bg-[#C8A45D]/20 text-[#FFE3A0] flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-montserrat font-extrabold text-[#FFE3A0] block">
                JUNE 2026 REPORT: ₹699/- EACH SUBJECT
              </span>
              <span className="text-[11px] text-gray-300">
                1st 10 got their offers! Next offer: Use code <strong className="text-[#FFE3A0]">NEXT5</strong> for 5% OFF on Mentorship
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsAnswersheetModalOpen(true)}
            className="px-4 py-2 bg-gradient-to-r from-[#FFE3A0] via-[#C8A45D] to-[#DFB96E] text-black font-montserrat font-extrabold text-xs rounded-xl uppercase shrink-0 shadow-md hover:brightness-110 cursor-pointer"
          >
            Select All / Multiple Subjects
          </button>
        </div>
      </div>

      {/* Interactive Program & Subject Selector Section */}
      <TestSeriesProgramSelector onNavigate={onNavigate} />

      {/* Starting Soon Announcement Card */}
      <div className="p-6 sm:p-8 bg-gradient-to-r from-[#FAF7F2] via-[#FFFDF9] to-[#FAF7F2] border-2 border-dashed border-[#C8A45D] rounded-3xl text-center space-y-4 shadow-sm">
        <span className="px-3 py-1 bg-[#C8A45D]/20 text-[#8A651E] text-xs font-montserrat font-extrabold uppercase tracking-wider rounded-full inline-block">
          Upcoming Major Release
        </span>
        <h3 className="font-cinzel text-2xl font-bold text-[#0F0F0F]">
          Full Evaluated Test Series for All 3 Levels — Launching Soon!
        </h3>
        <p className="text-xs sm:text-sm text-gray-600 font-poppins max-w-2xl mx-auto">
          We are currently preparing full evaluated test series with step-marking assessments and model solutions for <strong>Level 1 (CSEET)</strong>, <strong>Level 2 (CS Executive)</strong>, and <strong>Level 3 (CS Professional)</strong>, curated directly by AIR 3 Harkiran Kaur Kohli!
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
          <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-montserrat font-bold">
            Level 1: CSEET Test Series (Soon)
          </span>
          <span className="px-3 py-1 bg-amber-50 text-[#8A651E] border border-[#C8A45D]/40 rounded-full text-xs font-montserrat font-bold">
            Level 2: CS Executive G1 + G2 (Soon)
          </span>
          <span className="px-3 py-1 bg-indigo-50 text-indigo-800 border border-indigo-200 rounded-full text-xs font-montserrat font-bold">
            Level 3: CS Professional G1 + G2 (Soon)
          </span>
        </div>
      </div>

      {/* Main Answersheet Analysis Product & Subject Booking Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: What the Analysis Report Includes */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-6 sm:p-8 bg-white border border-[#C8A45D]/40 rounded-3xl space-y-6 shadow-md">
            <div>
              <span className="text-xs font-montserrat font-bold text-[#8A651E] uppercase tracking-widest block">
                Comprehensive Diagnostic
              </span>
              <h2 className="font-cinzel text-2xl font-bold text-[#0F0F0F] mt-1">
                What the June 2026 Answersheet Report Covers
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-[#FAF8F5] border border-[#C8A45D]/30 rounded-2xl space-y-2">
                <div className="w-8 h-8 rounded-lg bg-[#C8A45D]/20 text-[#8A651E] flex items-center justify-center font-bold">
                  1
                </div>
                <h4 className="font-cinzel text-sm font-bold text-[#0F0F0F]">Step-Marking & Deduction Audit</h4>
                <p className="text-xs text-gray-600 leading-relaxed font-poppins">
                  Question-by-question breakdown of why marks were withheld under ICSI guidelines and where step marks were lost.
                </p>
              </div>

              <div className="p-4 bg-[#FAF8F5] border border-[#C8A45D]/30 rounded-2xl space-y-2">
                <div className="w-8 h-8 rounded-lg bg-[#C8A45D]/20 text-[#8A651E] flex items-center justify-center font-bold">
                  2
                </div>
                <h4 className="font-cinzel text-sm font-bold text-[#0F0F0F]">Legal Drafting & Citation Review</h4>
                <p className="text-xs text-gray-600 leading-relaxed font-poppins">
                  Detailed check of section number citations, relevant case law references, and legal phrasing required for high scores.
                </p>
              </div>

              <div className="p-4 bg-[#FAF8F5] border border-[#C8A45D]/30 rounded-2xl space-y-2">
                <div className="w-8 h-8 rounded-lg bg-[#C8A45D]/20 text-[#8A651E] flex items-center justify-center font-bold">
                  3
                </div>
                <h4 className="font-cinzel text-sm font-bold text-[#0F0F0F]">Voice / Video Feedback by AIR 3</h4>
                <p className="text-xs text-gray-600 leading-relaxed font-poppins">
                  Personal audio/video notes from Harkiran Kaur pointing out exact presentation flaws and time management issues.
                </p>
              </div>

              <div className="p-4 bg-[#FAF8F5] border border-[#C8A45D]/30 rounded-2xl space-y-2">
                <div className="w-8 h-8 rounded-lg bg-[#C8A45D]/20 text-[#8A651E] flex items-center justify-center font-bold">
                  4
                </div>
                <h4 className="font-cinzel text-sm font-bold text-[#0F0F0F]">Action Plan for Next Attempt</h4>
                <p className="text-xs text-gray-600 leading-relaxed font-poppins">
                  Clear, subject-specific revision priorities and drafting guidelines to convert your attempt into 60+ exemption marks.
                </p>
              </div>
            </div>

            {/* Submission Steps */}
            <div className="pt-4 border-t border-[#C8A45D]/20 space-y-3">
              <h4 className="font-cinzel text-sm font-bold text-[#0F0F0F] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#8A651E]" /> Simple 3-Step Process:
              </h4>
              <div className="text-xs text-gray-700 font-poppins space-y-2">
                <p><strong>Step 1:</strong> Enroll below at ₹699/- for your required subject(s).</p>
                <p><strong>Step 2:</strong> Send your ICSI certified answersheet PDF on WhatsApp or Email.</p>
                <p><strong>Step 3:</strong> Receive your thorough marks deduction audit & improvement report within 48 to 72 hours.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Instant Booking Card */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 sm:p-8 bg-[#0F0F0F] border-2 border-[#C8A45D] rounded-3xl text-white space-y-6 shadow-2xl sticky top-28">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 bg-[#C8A45D]/20 text-[#FFE3A0] text-[10px] font-bold uppercase rounded-full">
                  June 2026 Analysis
                </span>
                <span className="text-xs text-[#FFE3A0] font-bold">₹699 / Subject</span>
              </div>
              <h3 className="font-cinzel text-2xl font-bold text-white pt-1">
                Answersheet Analysis Report
              </h3>
              <p className="text-xs text-gray-300 font-poppins">
                Understand your mistakes & transform your score for the next attempt.
              </p>
            </div>

            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-montserrat font-bold text-[#FFE3A0] uppercase">
                  Select Subject:
                </label>
                <button
                  type="button"
                  onClick={() => setIsAnswersheetModalOpen(true)}
                  className="text-[11px] font-bold text-[#C8A45D] hover:underline cursor-pointer"
                >
                  Choose Multiple Subjects →
                </button>
              </div>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#181818] border border-[#C8A45D]/40 rounded-xl text-xs text-white focus:outline-none focus:border-[#C8A45D]"
              >
                {subjects.map((sub, idx) => (
                  <option key={idx} value={sub.name} className="bg-[#181818] text-white">
                    {sub.name} ({sub.level})
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-gray-400">
                Selected: <strong className="text-white">{selectedSubject}</strong>
              </p>
            </div>

            <div className="flex items-baseline justify-between pt-2 border-t border-white/10">
              <div>
                <span className="text-xs text-gray-400 block">Fee per subject:</span>
                <div className="font-cinzel text-3xl font-extrabold text-[#FFE3A0]">
                  ₹699/-
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-gray-400 line-through">₹1,200</span>
                <span className="text-xs text-[#FFE3A0] block font-bold">Standard ₹699</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                onClick={handleSingleAdd}
                className="py-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all"
              >
                <ShoppingBag className="w-4 h-4 text-[#C8A45D]" /> Add to Cart
              </button>
              <button
                onClick={handleSingleBuy}
                className="py-3 bg-gradient-to-r from-[#FFE3A0] via-[#C8A45D] to-[#DFB96E] text-black font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 uppercase cursor-pointer hover:brightness-110 shadow-lg transition-all"
              >
                <span>Get Report</span>
                <Zap className="w-4 h-4 fill-black" />
              </button>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsAnswersheetModalOpen(true)}
                className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-xs font-semibold text-gray-300 border border-white/15 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <FileCheck className="w-4 h-4 text-[#C8A45D]" />
                <span>Need Audit for Multiple Subjects? Click here</span>
              </button>
            </div>

            <div className="text-center pt-1">
              <span className="text-[11px] text-gray-400">
                1-on-1 Evaluation by AIR 3 Harkiran Kaur • 48-72h Turnaround
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Subject Multi-Select Modal */}
      <AnswersheetSubjectModal
        isOpen={isAnswersheetModalOpen}
        onClose={() => setIsAnswersheetModalOpen(false)}
        onAddToCart={addToCart}
        onBuyNow={buyNow}
      />
    </div>
  );
};

