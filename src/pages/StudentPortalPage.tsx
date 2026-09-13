import React, { useState, useEffect, useMemo } from 'react';
import {
  GraduationCap,
  Award,
  BookOpen,
  FileText,
  Clock,
  CheckCircle2,
  Calendar,
  Sparkles,
  Download,
  MessageCircle,
  Mail,
  Phone,
  User,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  LogOut,
  Bell,
  Star,
  Check,
  ArrowRight,
  Layers,
  HelpCircle,
  QrCode,
  Bookmark,
  Lock,
  KeyRound,
  Copy,
} from 'lucide-react';
import { PageId, Product, OrderItem } from '../types';
import { StudentMentorshipProfile } from '../types/mentorship';
import { useAuth } from '../context/AuthContext';
import { useOrders } from '../context/OrderContext';
import { useCart } from '../context/CartContext';
import { PRODUCTS } from '../data/products';
import { generateInvoicePDF } from '../services/invoiceService';
import { fetchStudentEnrollments } from '../lib/supabase';
import { MentorshipTrackerView } from '../components/MentorshipTrackerView';
import {
  getOrCreateStudentMentorship,
  getAdminViewingStudentId,
  setAdminViewingStudentId,
  loadAllStoredProfiles,
  generateDefaultChapters,
} from '../services/mentorshipTrackerService';
import {
  getStudentByEmail,
  subscribeToDatabaseChanges,
  updateStudentStudyIndexRows,
  CentralStudent,
} from '../services/centralStudentDatabase';
import { getStudyTrackDetails } from '../services/studyTrackService';
import { StudyProgressIndexCheckoutModal } from '../components/StudyProgressIndexCheckoutModal';

interface StudentPortalPageProps {
  onNavigate: (page: PageId) => void;
  onOpenJoinModal?: () => void;
  onOpenCounsellingModal?: () => void;
}

export const StudentPortalPage: React.FC<StudentPortalPageProps> = ({
  onNavigate,
  onOpenJoinModal,
  onOpenCounsellingModal,
}) => {
  const { user, logout, openAuthModal, updateProfile, requestPasswordReset } = useAuth();
  const { orders, downloadInvoicePDF } = useOrders();
  const { buyNow } = useCart();

  const [activeTab, setActiveTab] = useState<
    'mentorship' | 'study-index' | 'courses' | 'invoices' | 'launches' | 'profile'
  >('mentorship');
  const [notifySuccess, setNotifySuccess] = useState<string | null>(null);
  const [remoteOrders, setRemoteOrders] = useState<OrderItem[]>([]);
  const [mentorshipProfile, setMentorshipProfile] = useState<StudentMentorshipProfile | null>(null);
  const [centralStudent, setCentralStudent] = useState<CentralStudent | null>(null);
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [resetFeedback, setResetFeedback] = useState<{ type: 'success' | 'error'; message: string; url?: string } | null>(null);
  const [copiedResetLink, setCopiedResetLink] = useState(false);
  const [isStudyIndexCheckoutOpen, setIsStudyIndexCheckoutOpen] = useState(false);

  // Admin impersonation handling — STRICT SECURITY: Only master admin can impersonate
  const isAdminUser = user?.role === 'admin';
  const [adminViewingKey, setAdminViewingKeyState] = useState<string | null>(() =>
    isAdminUser ? getAdminViewingStudentId() : null
  );
  const storedProfiles = loadAllStoredProfiles();
  const impersonatedProfile = isAdminUser && adminViewingKey ? storedProfiles[adminViewingKey] : null;
  const isImpersonating = !!impersonatedProfile;

  // Clean up stale admin viewing key if student is not admin
  useEffect(() => {
    if (!isAdminUser && getAdminViewingStudentId()) {
      setAdminViewingStudentId(null);
      setAdminViewingKeyState(null);
    }
  }, [isAdminUser]);

  const effectiveUser = impersonatedProfile
    ? {
        id: impersonatedProfile.studentId,
        fullName: impersonatedProfile.studentName,
        email: impersonatedProfile.studentEmail,
        phone: impersonatedProfile.studentPhone,
        targetExam: `${impersonatedProfile.program} (${impersonatedProfile.group})`,
      }
    : user;

  // Initialize Mentorship Profile with strict Group Isolation
  useEffect(() => {
    if (impersonatedProfile) {
      setMentorshipProfile(impersonatedProfile);
    } else if (user) {
      const profile = getOrCreateStudentMentorship({
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        targetExam: user.targetExam,
      });
      setMentorshipProfile(profile);
    } else {
      setMentorshipProfile(null);
    }
  }, [user, adminViewingKey]);

  // Sync centralStudent with database
  useEffect(() => {
    const targetEmail = effectiveUser?.email;
    if (!targetEmail) {
      setCentralStudent(null);
      return;
    }
    const update = () => {
      const match = getStudentByEmail(targetEmail);
      setCentralStudent(match || null);
    };
    update();
    const unsub = subscribeToDatabaseChanges(update);
    return unsub;
  }, [effectiveUser?.email]);

  const handleSendPasswordResetLink = () => {
    if (!effectiveUser?.email) return;
    setIsSendingReset(true);
    setResetFeedback(null);
    try {
      const res = requestPasswordReset(effectiveUser.email);
      if (res.success) {
        setResetFeedback({
          type: 'success',
          message: `A secure single-use reset link has been dispatched to ${effectiveUser.email}.`,
          url: res.resetUrl,
        });
      } else {
        setResetFeedback({
          type: 'error',
          message: res.message,
        });
      }
    } finally {
      setIsSendingReset(false);
    }
  };

  const handleCopyResetUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedResetLink(true);
    setTimeout(() => setCopiedResetLink(false), 2000);
  };

  // Asynchronously query student's verified records from Supabase with strict RLS / user filtering
  useEffect(() => {
    if (!effectiveUser) {
      setRemoteOrders([]);
      return;
    }

    let isMounted = true;
    fetchStudentEnrollments(effectiveUser.email, effectiveUser.phone).then((records) => {
      if (!isMounted) return;

      const mapped: OrderItem[] = records.map((rec, index) => {
        const productMatch = PRODUCTS.find((p) => p.id === rec.product_id || p.name.toLowerCase() === rec.program?.toLowerCase());
        const orderIdPart = (rec.id || `rec_${index}`).replace(/[^a-zA-Z0-9]/g, '').slice(-4).toUpperCase();
        const year = rec.created_at ? new Date(rec.created_at).getFullYear() : 2026;

        return {
          id: rec.id || `rem_ord_${index}`,
          orderNumber: `ORD-${year}-${orderIdPart || '1001'}`,
          userId: effectiveUser.id,
          items: [
            {
              productId: rec.product_id || productMatch?.id || 'mentorship-enrolled',
              name: rec.program || 'CS Mentorship Program',
              price: Number(rec.amount) || productMatch?.price || 0,
              quantity: 1,
            },
          ],
          subtotal: Number(rec.amount) || productMatch?.price || 0,
          discount: 0,
          tax: 0,
          totalAmount: Number(rec.amount) || productMatch?.price || 0,
          paymentMethod: 'UPI',
          utrNumber: rec.utr_number,
          status: rec.status === 'confirmed' || rec.status === 'completed' ? 'COMPLETED' : 'PENDING_APPROVAL',
          createdAt: rec.created_at || new Date().toISOString(),
          billingDetails: {
            fullName: rec.name || effectiveUser.fullName,
            email: rec.email || effectiveUser.email,
            phone: rec.phone || effectiveUser.phone,
          },
        };
      });

      setRemoteOrders(mapped);
    });

    return () => {
      isMounted = false;
    };
  }, [effectiveUser?.email, effectiveUser?.phone, effectiveUser?.id]);

  // Match orders strictly for the active student ONLY (Local state)
  const localStudentOrders = orders.filter((ord) => {
    const activeTarget = effectiveUser || user;
    if (!activeTarget) return false;

    const userEmail = (activeTarget.email || '').trim().toLowerCase();
    const ordEmail = (ord.billingDetails?.email || '').trim().toLowerCase();

    // 1. HARD SECURITY ISOLATION: If both order email and user email exist and differ,
    // this order belongs to a completely different student - NEVER show it.
    if (userEmail && ordEmail && userEmail !== ordEmail) {
      return false;
    }

    // 2. Direct authenticated user ID match (excluding generic guest ids)
    if (activeTarget.id && ord.userId && ord.userId !== 'usr_guest' && ord.userId === activeTarget.id) {
      return true;
    }

    // 3. Exact email match (case-insensitive)
    if (userEmail && ordEmail && userEmail === ordEmail) {
      return true;
    }

    // 4. Clean 10-digit phone number match (excluding shared/dummy placeholders)
    const cleanUserPhone = (activeTarget.phone || '').replace(/\D/g, '');
    const cleanOrdPhone = (ord.billingDetails?.phone || '').replace(/\D/g, '');
    const genericPhones = ['9876500000', '0000000000', '1234567890', '9999999999'];

    if (
      cleanUserPhone.length >= 10 &&
      cleanOrdPhone.length >= 10 &&
      cleanUserPhone.slice(-10) === cleanOrdPhone.slice(-10) &&
      !genericPhones.includes(cleanUserPhone.slice(-10))
    ) {
      // Must not belong to an order explicitly registered to a different student email
      if (!ordEmail || ordEmail === userEmail) {
        return true;
      }
    }

    return false;
  });

  // Combine and deduplicate local orders with remote Supabase records
  const studentOrders: OrderItem[] = [...localStudentOrders];
  remoteOrders.forEach((remoteOrd) => {
    const isDuplicate = studentOrders.some(
      (local) =>
        (remoteOrd.utrNumber && local.utrNumber && remoteOrd.utrNumber === local.utrNumber) ||
        (local.id === remoteOrd.id) ||
        (local.orderNumber === remoteOrd.orderNumber)
    );
    if (!isDuplicate) {
      studentOrders.push(remoteOrd);
    }
  });

  // Approved orders (strictly completed/approved)
  const approvedOrders = studentOrders.filter(
    (o) => o.status === 'COMPLETED'
  );

  // Check if student has an unapproved payment with UTR submitted
  // Filter out any order that has already been approved via centralStudent database
  const isStudentGloballyApproved = Boolean(
    centralStudent?.paymentStatus === 'approved' ||
    centralStudent?.mentorshipAccess ||
    centralStudent?.studyIndexAccess
  );

  const pendingOrders = studentOrders.filter((o) => {
    if (o.status !== 'PENDING' && o.status !== 'PENDING_APPROVAL') return false;
    if (!o.utrNumber) return false;
    // If student is approved in Central Database with matching UTR or course, this order is approved
    if (
      isStudentGloballyApproved &&
      (o.utrNumber === centralStudent?.purchasedCourse?.transactionRef ||
        o.utrNumber === centralStudent?.purchasedCourse?.utrNumber)
    ) {
      return false;
    }
    return true;
  });

  const hasPendingPayment = Boolean(
    !isStudentGloballyApproved &&
    (centralStudent?.paymentStatus === 'pending' ||
      centralStudent?.paymentStatus === 'pending_approval' ||
      centralStudent?.purchasedCourse?.paymentStatus === 'pending' ||
      centralStudent?.purchasedCourse?.paymentStatus === 'pending_approval' ||
      pendingOrders.length > 0)
  );

  const pendingOrder = pendingOrders[0];
  const pendingUtr =
    centralStudent?.purchasedCourse?.transactionRef ||
    centralStudent?.purchasedCourse?.utrNumber ||
    pendingOrder?.utrNumber;
  const pendingAmount =
    centralStudent?.purchasedCourse?.finalAmount ||
    centralStudent?.purchasedCourse?.amount ||
    pendingOrder?.totalAmount;
  const pendingProgramName =
    centralStudent?.purchasedCourse?.courseName ||
    pendingOrder?.items?.[0]?.name ||
    'CS Mentorship Program';

  const studentProgram = centralStudent?.program || (effectiveUser?.targetExam?.includes('Executive') ? 'CS Executive' : effectiveUser?.targetExam?.includes('Professional') ? 'CS Professional' : 'CS EET');
  const studentGroup = centralStudent?.group || (effectiveUser?.targetExam?.includes('Group 2') ? 'Group 2' : effectiveUser?.targetExam?.includes('Both') ? 'Both Groups' : effectiveUser?.targetExam?.includes('EET') ? 'EET' : 'Group 1');
  const studentLevel = centralStudent?.level || studentProgram;
  const studentName = centralStudent?.fullName || effectiveUser?.fullName || 'Student';

  const studyTrackDetails = useMemo(() => {
    return getStudyTrackDetails(studentProgram, studentGroup, studentLevel);
  }, [studentProgram, studentGroup, studentLevel]);

  // Enrolled products — strictly approved only!
  const enrolledProductIds = new Set<string>([
    ...(centralStudent?.mentorshipAccess ? ['exec-g1-mentorship', 'mentorship-enrolled'] : []),
    ...(centralStudent?.studyIndexAccess ? ['cs-study-progress-index', studyTrackDetails.productId] : []),
    ...(centralStudent?.paymentStatus === 'approved' && centralStudent?.purchasedCourse?.courseId
      ? [centralStudent.purchasedCourse.courseId]
      : []),
    ...approvedOrders.flatMap((o) => o.items.map((i) => i.productId)),
  ]);

  const enrolledProducts = PRODUCTS.filter((p) => enrolledProductIds.has(p.id));

  // Determine approved mentorship access
  const hasApprovedMentorshipAccess = Boolean(
    isImpersonating ||
    centralStudent?.mentorshipAccess ||
    (centralStudent?.paymentStatus === 'approved' &&
      !centralStudent?.purchasedCourse?.courseId?.includes('studytrack') &&
      centralStudent?.purchasedCourse?.courseId !== 'cs-study-progress-index') ||
    approvedOrders.some((o) =>
      o.items.some((i) => !i.productId?.includes('studytrack') && i.productId !== 'cs-study-progress-index')
    )
  );

  // Access status determination:
  // 1. Approved / Active
  const isStudyIndexActive = Boolean(
    isImpersonating ||
    centralStudent?.studyIndexAccess ||
    enrolledProductIds.has(studyTrackDetails.productId) ||
    enrolledProductIds.has('cs-study-progress-index') ||
    approvedOrders.some((o) =>
      o.items.some((i) => i.productId === studyTrackDetails.productId || i.productId === 'cs-study-progress-index')
    )
  );

  // 2. Verification Pending
  const isStudyIndexPending = Boolean(
    !isStudyIndexActive &&
    (
      centralStudent?.paymentStatus === 'pending_approval' ||
      centralStudent?.purchasedCourse?.paymentStatus === 'pending_approval' ||
      orders.some((o) =>
        o.status === 'pending_approval' &&
        o.items.some((i) =>
          i.productId === studyTrackDetails.productId ||
          i.productId?.includes('studytrack') ||
          i.productId === 'cs-study-progress-index'
        )
      ) ||
      (
        (centralStudent?.purchasedCourse?.courseId?.includes('studytrack') ||
          centralStudent?.purchasedCourse?.courseId?.includes('study-progress-index') ||
          centralStudent?.purchasedCourse?.courseName?.toLowerCase().includes('progress index')) &&
        centralStudent?.paymentStatus === 'pending_approval'
      )
    )
  );

  const studyIndexProfile: StudentMentorshipProfile | null = useMemo(() => {
    if (!effectiveUser) return null;
    const baseProfile = mentorshipProfile || getOrCreateStudentMentorship({
      id: effectiveUser.id,
      fullName: studentName,
      email: effectiveUser.email,
      phone: effectiveUser.phone,
      targetExam: effectiveUser.targetExam,
    });

    const rows = (centralStudent?.studyIndexRows && centralStudent.studyIndexRows.length > 0)
      ? centralStudent.studyIndexRows
      : generateDefaultChapters(studentProgram, studentGroup);

    return {
      ...baseProfile,
      fullName: studentName,
      program: studentProgram as any,
      group: studentGroup as any,
      isStudyProgressIndex: true,
      studyIndexAccess: isStudyIndexActive,
      trackerRows: rows,
    };
  }, [effectiveUser, mentorshipProfile, centralStudent, studentProgram, studentGroup, studentName, isStudyIndexActive]);

  // If not logged in and not in Admin Impersonation view, prompt sign in / registration
  if (!user && !isImpersonating) {
    return (
      <div className="min-h-screen pt-28 pb-16 px-4 bg-[#F8F6F2] font-poppins">
        <div className="max-w-xl mx-auto bg-white border border-[#C8A45D]/40 rounded-3xl p-8 sm:p-10 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-[#C8A45D]/40 flex items-center justify-center mx-auto text-[#8A651E]">
            <GraduationCap className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-montserrat font-bold text-[#8A651E] uppercase tracking-widest bg-amber-500/10 px-3 py-1 rounded-full border border-[#C8A45D]/30">
              Aspirant Workspace Access
            </span>
            <h1 className="font-cinzel text-2xl sm:text-3xl font-bold text-[#1C1917]">
              Student Mentorship Portal
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed max-w-md mx-auto">
              Log in or register your account to view your enrolled mentorship index, chapter-wise tracker, 12-month mentor calls schedule, and official Tax Invoices.
            </p>
          </div>

          <div className="p-4 bg-[#FAF7F2] border border-[#E5D9C3] rounded-2xl text-left text-xs text-gray-700 space-y-2 font-poppins">
            <div className="font-bold text-[#8A651E] flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#C8A45D]" /> Instant Direct Access:
            </div>
            <p>
              • If you just enrolled or registered, simply click <strong>Login</strong> or <strong>Register</strong> with your mobile number/email.
            </p>
            <p>
              • Official support workspace: <strong className="text-black">hk.code.of.rankers@gmail.com</strong>
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <button
              onClick={() => openAuthModal('login', { allowRegister: false })}
              className="w-full py-3.5 bg-gradient-to-r from-[#FFE3A0] via-[#C8A45D] to-[#DFB96E] hover:from-[#FFEFA6] hover:to-[#C8A45D] text-black font-montserrat font-bold text-xs rounded-xl shadow-md uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <User className="w-4 h-4" />
              <span>Login to Student Portal</span>
            </button>
            <p className="text-[11px] text-gray-500">
              Only enrolled students with verified admissions can access the portal. New admissions are processed during course enrollment.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const handleNotifyLaunch = (launchTitle: string) => {
    setNotifySuccess(`Priority access confirmed for "${launchTitle}"! We'll notify you via your registered email & portal updates.`);
    setTimeout(() => setNotifySuccess(null), 5000);
  };

  const handleExitAdminImpersonation = () => {
    setAdminViewingStudentId(null);
    setAdminViewingKeyState(null);
    onNavigate('admin');
  };

  if (!effectiveUser) return null;

  return (
    <div className="min-h-screen pt-28 pb-16 px-4 sm:px-6 lg:px-8 bg-[#F8F6F2] font-poppins">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Master Admin Impersonation Top Alert Bar */}
        {isImpersonating && (
          <div className="bg-gradient-to-r from-[#1C1917] via-[#2E2419] to-[#1C1917] border-2 border-[#C8A45D] rounded-2xl p-4 text-white shadow-xl flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-amber-500/20 text-[#FFE3A0] border border-amber-500/40 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase font-black tracking-widest text-[#FFE3A0] font-montserrat">
                    Master Admin Live Student View
                  </span>
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-bold rounded-full border border-emerald-500/40">
                    Full Admin Controls Active
                  </span>
                </div>
                <p className="text-xs text-gray-300">
                  Currently viewing <strong>{effectiveUser.fullName}</strong>'s portal ({effectiveUser.email || effectiveUser.phone}). Updates persist to database and reflect automatically on the student portal.
                </p>
              </div>
            </div>

            <button
              onClick={handleExitAdminImpersonation}
              className="px-4 py-2 bg-white/15 hover:bg-white/25 text-white border border-white/30 text-xs font-montserrat font-bold rounded-xl transition-all cursor-pointer"
            >
              Exit & Return to Admin Dashboard
            </button>
          </div>
        )}

        {/* Top Header Card */}
        <div className="bg-gradient-to-r from-[#0F0F0F] via-[#1A1815] to-[#12100E] border border-[#C8A45D]/40 rounded-3xl p-6 sm:p-8 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FFE3A0] to-[#C8A45D] text-black font-cinzel font-black text-2xl flex items-center justify-center shadow-lg shrink-0 border border-white/20">
                {effectiveUser.fullName.charAt(0).toUpperCase()}
              </div>

              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-cinzel text-xl sm:text-2xl font-bold text-white">
                    {effectiveUser.fullName}
                  </h1>
                  <span className="text-[10px] px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full font-bold uppercase tracking-wider">
                    Enrolled Student
                  </span>
                  {mentorshipProfile && (
                    <span className="text-[10px] px-2.5 py-0.5 bg-[#C8A45D]/20 text-[#FFE3A0] border border-[#C8A45D]/40 rounded-full font-bold">
                      {mentorshipProfile.program} — {mentorshipProfile.group}
                    </span>
                  )}
                </div>

                <p className="text-xs text-gray-300 font-poppins flex flex-wrap items-center gap-3">
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-[#C8A45D]" /> {effectiveUser.email || 'No email registered'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-[#C8A45D]" /> {effectiveUser.phone || 'No phone registered'}
                  </span>
                </p>

                <p className="text-[11px] text-amber-200/80 pt-1">
                  Mentor: <strong>Harkiran Kaur (AIR 3 CS Professional)</strong> • Official Workspace: <span className="underline">hk.code.of.rankers@gmail.com</span>
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-2.5">
              {!isImpersonating && (
                <button
                  onClick={logout}
                  className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white border border-white/20 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Success Alert */}
        {notifySuccess && (
          <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-sm animate-fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{notifySuccess}</span>
          </div>
        )}

        {/* PENDING PAYMENT APPROVAL ALERT BANNER */}
        {hasPendingPayment && (
          <div className="bg-amber-50 border-2 border-amber-500/40 rounded-2xl p-4 text-amber-900 shadow-sm flex items-start gap-3.5 animate-fade-in">
            <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 animate-pulse" />
            <div className="text-xs space-y-1">
              <div className="flex items-center gap-2 font-bold text-amber-900">
                <span>Payment Verification In Progress</span>
                <span className="px-2 py-0.5 bg-amber-200 text-amber-900 text-[10px] font-bold rounded-full uppercase tracking-wider">
                  Awaiting Admin Confirmation
                </span>
              </div>
              <p className="text-amber-800 leading-relaxed">
                {pendingAmount ? (
                  <>
                    Your payment of <strong>₹{pendingAmount.toLocaleString('en-IN')}/-</strong> for{' '}
                    <strong>{pendingProgramName}</strong>{' '}
                  </>
                ) : (
                  <>
                    Your enrollment request for <strong>{pendingProgramName}</strong>{' '}
                  </>
                )}
                {pendingUtr && (
                  <>
                    (UTR: <span className="font-mono font-bold">{pendingUtr}</span>){' '}
                  </>
                )}
                has been submitted to the Central Database and is currently being verified by Harkiran Kaur Kohli. Full course and personalized tracker access unlock immediately upon admin confirmation and approval email.
              </p>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-[#C8A45D]/30 pb-2 overflow-x-auto">
          {/* TAB 1: CS MENTORSHIP PROGRAM */}
          <button
            onClick={() => setActiveTab('mentorship')}
            className={`px-4 py-2.5 text-xs uppercase tracking-wider font-montserrat font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'mentorship'
                ? 'bg-[#C8A45D] text-black shadow-md'
                : 'text-gray-700 hover:text-black hover:bg-white/60'
            }`}
          >
            <Bookmark className="w-4 h-4" />
            <span>CS Mentorship Program</span>
            {mentorshipProfile && (
              <span className="px-2 py-0.5 bg-[#1C1917] text-[#FFE3A0] text-[9px] font-bold rounded-full">
                {mentorshipProfile.program} ({mentorshipProfile.group})
              </span>
            )}
          </button>

          {/* TAB 2: HK STUDYTRACK PRO – CS PROGRESS INDEX */}
          <button
            onClick={() => setActiveTab('study-index')}
            className={`px-4 py-2.5 text-xs uppercase tracking-wider font-montserrat font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'study-index'
                ? 'bg-[#C8A45D] text-black shadow-md'
                : 'text-gray-700 hover:text-black hover:bg-white/60'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Study Progress Index</span>
            <span
              className={`px-2 py-0.5 text-[9px] font-bold rounded-full ${
                isStudyIndexActive
                  ? 'bg-emerald-700 text-white'
                  : isStudyIndexPending
                  ? 'bg-amber-600 text-white animate-pulse'
                  : 'bg-[#1C1917] text-[#FFE3A0]'
              }`}
            >
              {isStudyIndexActive
                ? 'Edit Active'
                : isStudyIndexPending
                ? 'Verification Pending'
                : `₹${studyTrackDetails.price.toLocaleString('en-IN')}`}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('courses')}
            className={`px-4 py-2.5 text-xs uppercase tracking-wider font-montserrat font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'courses'
                ? 'bg-[#C8A45D] text-black shadow-md'
                : 'text-gray-700 hover:text-black hover:bg-white/60'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>My Courses ({enrolledProducts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('invoices')}
            className={`px-4 py-2.5 text-xs uppercase tracking-wider font-montserrat font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'invoices'
                ? 'bg-[#C8A45D] text-black shadow-md'
                : 'text-gray-700 hover:text-black hover:bg-white/60'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Tax Invoices & Orders ({studentOrders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('launches')}
            className={`px-4 py-2.5 text-xs uppercase tracking-wider font-montserrat font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'launches'
                ? 'bg-[#C8A45D] text-black shadow-md'
                : 'text-gray-700 hover:text-black hover:bg-white/60'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Upcoming Launches</span>
            <span className="px-1.5 py-0.5 bg-amber-500 text-black text-[9px] font-black rounded-full">
              New
            </span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2.5 text-xs uppercase tracking-wider font-montserrat font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'profile'
                ? 'bg-[#C8A45D] text-black shadow-md'
                : 'text-gray-700 hover:text-black hover:bg-white/60'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Aspirant Profile</span>
          </button>
        </div>

        {/* TAB 1: CS MENTORSHIP PROGRAM (STRICT VIEW ONLY FOR STUDENTS, FULL EDIT FOR ADMIN) */}
        {activeTab === 'mentorship' && (
          hasApprovedMentorshipAccess ? (
            mentorshipProfile && (
              <MentorshipTrackerView
                profile={mentorshipProfile}
                isAdmin={isImpersonating}
                isStudyProgressIndex={false}
                onProfileUpdated={(updated) => setMentorshipProfile(updated)}
                onExitAdminView={handleExitAdminImpersonation}
              />
            )
          ) : hasPendingPayment ? (
            /* Dedicated Awaiting Approval Card */
            <div className="bg-white border-2 border-amber-500/50 rounded-3xl p-8 sm:p-12 text-center space-y-6 shadow-md max-w-2xl mx-auto my-4 animate-fade-in">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center mx-auto text-amber-700 animate-pulse">
                <Clock className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <span className="inline-block px-3 py-1 bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-montserrat font-bold rounded-full uppercase tracking-wider">
                  Payment Verification In Progress • Awaiting Admin Approval
                </span>
                <h3 className="font-cinzel text-2xl font-bold text-[#1C1917]">
                  Mentorship Access Awaiting Approval
                </h3>
                <p className="text-xs text-gray-600 leading-relaxed max-w-lg mx-auto">
                  We have received your payment details and UTR submission for{' '}
                  <strong className="text-gray-900">{pendingProgramName}</strong>. Harkiran Kaur Kohli is verifying your transaction. Once verified and approved in the Admin Portal, you will receive an official approval confirmation email and your 1-on-1 Mentorship Tracker will unlock immediately.
                </p>
              </div>

              {pendingUtr && (
                <div className="inline-flex items-center gap-2 bg-[#FAF7F2] border border-[#C8A45D]/40 px-4 py-2.5 rounded-2xl text-xs">
                  <span className="text-gray-500 font-montserrat font-bold">Submitted UTR:</span>
                  <span className="font-mono font-black text-black">{pendingUtr}</span>
                  {pendingAmount && (
                    <span className="text-[#8A651E] font-bold border-l border-gray-300 pl-2">
                      ₹{pendingAmount.toLocaleString('en-IN')}/-
                    </span>
                  )}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => {
                    const cleanPhone = '919284084523';
                    const text = `Hello Harkiran Kaur, I have submitted my payment of ₹${pendingAmount || ''} with UTR: ${pendingUtr || ''} for ${pendingProgramName}. Could you please verify and approve my mentorship access? Thank you!`;
                    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
                  }}
                  className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-montserrat font-bold text-xs rounded-xl shadow-md transition-colors flex items-center gap-2 cursor-pointer uppercase tracking-wider"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Notify Mentor on WhatsApp</span>
                </button>
                <button
                  onClick={() => setActiveTab('invoices')}
                  className="px-5 py-3 bg-[#FAF7F2] hover:bg-[#F0EBE0] border border-[#C8A45D] text-[#8A651E] font-montserrat font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center gap-2 uppercase tracking-wider"
                >
                  <FileText className="w-4 h-4" />
                  <span>View Submitted Receipt</span>
                </button>
              </div>
            </div>
          ) : (
            /* Unenrolled State */
            <div className="bg-white border border-[#C8A45D]/40 rounded-3xl p-8 sm:p-12 text-center space-y-5 shadow-sm max-w-2xl mx-auto my-4">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-[#C8A45D]/40 flex items-center justify-center mx-auto text-[#8A651E]">
                <GraduationCap className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="font-cinzel text-xl font-bold text-[#1C1917]">
                  1-on-1 Mentorship Enrollment Required
                </h3>
                <p className="text-xs text-gray-600 max-w-md mx-auto">
                  You are registered on HK Code of Rankers. To unlock your personalized 1-on-1 Mentorship Tracker and diagnostic schedule with Harkiran Kaur (AIR 3), please enroll in a mentorship program.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-3 pt-2">
                <button
                  onClick={() => onNavigate('programs')}
                  className="px-6 py-3 bg-gradient-to-r from-[#FFE3A0] via-[#C8A45D] to-[#DFB96E] hover:from-[#FFEFA6] hover:to-[#C8A45D] text-black font-montserrat font-bold text-xs rounded-xl shadow-md uppercase tracking-wider cursor-pointer"
                >
                  Explore Mentorship Programs
                </button>
              </div>
            </div>
          )
        )}

        {/* TAB 2: HK STUDYTRACK PRO – CS PROGRESS INDEX (STUDENT VIEW + EDIT IF APPROVED) */}
        {activeTab === 'study-index' && studyIndexProfile && (
          <div className="space-y-6">
            {/* MANDATORY METADATA & ACCESS STATUS CARD */}
            <div className="bg-white border-2 border-[#C8A45D]/40 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                <div>
                  <div className="flex items-center gap-2 text-[#8A651E] text-xs font-montserrat uppercase tracking-wider font-bold mb-1">
                    <Layers className="w-4 h-4 text-[#C8A45D]" />
                    <span>Study Progress Index</span>
                  </div>
                  <h2 className="font-cinzel text-xl sm:text-2xl font-bold text-gray-900">
                    HK StudyTrack Pro – CS Progress Index
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Self-study tracking product allowing you to track and edit your own preparation after purchasing the applicable index.
                  </p>
                </div>

                {/* Direct Access Status Display */}
                <div className="flex items-center gap-2 shrink-0">
                  {isStudyIndexActive ? (
                    <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-50 border-2 border-emerald-500 rounded-full text-emerald-800 text-xs font-montserrat font-bold shadow-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Edit Access Active</span>
                    </div>
                  ) : isStudyIndexPending ? (
                    <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-50 border-2 border-amber-400 rounded-full text-amber-900 text-xs font-montserrat font-bold shadow-xs animate-pulse">
                      <Clock className="w-4 h-4 text-amber-600" />
                      <span>Payment Verification Pending</span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-gray-100 border-2 border-gray-300 rounded-full text-gray-800 text-xs font-montserrat font-bold shadow-xs">
                      <Lock className="w-4 h-4 text-gray-500" />
                      <span>View Only</span>
                    </div>
                  )}
                </div>
              </div>

              {/* SPECIFICATION MANDATE:
                  Show:
                  - Student name
                  - Program
                  - Level
                  - Group
                  - Applicable Index
                  - Access status
              */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-1">
                <div className="bg-[#FAF9F5] p-3 rounded-2xl border border-[#C8A45D]/20">
                  <span className="text-[10px] uppercase font-montserrat font-semibold text-gray-500 block">Student Name</span>
                  <span className="text-xs font-bold text-gray-900 truncate block mt-0.5" title={studentName}>
                    {studentName}
                  </span>
                </div>

                <div className="bg-[#FAF9F5] p-3 rounded-2xl border border-[#C8A45D]/20">
                  <span className="text-[10px] uppercase font-montserrat font-semibold text-gray-500 block">Program</span>
                  <span className="text-xs font-bold text-gray-900 truncate block mt-0.5">
                    {studentProgram}
                  </span>
                </div>

                <div className="bg-[#FAF9F5] p-3 rounded-2xl border border-[#C8A45D]/20">
                  <span className="text-[10px] uppercase font-montserrat font-semibold text-gray-500 block">Level</span>
                  <span className="text-xs font-bold text-gray-900 truncate block mt-0.5">
                    {studentLevel}
                  </span>
                </div>

                <div className="bg-[#FAF9F5] p-3 rounded-2xl border border-[#C8A45D]/20">
                  <span className="text-[10px] uppercase font-montserrat font-semibold text-gray-500 block">Group</span>
                  <span className="text-xs font-bold text-gray-900 truncate block mt-0.5">
                    {studentGroup}
                  </span>
                </div>

                <div className="bg-[#FAF9F5] p-3 rounded-2xl border border-[#C8A45D]/20">
                  <span className="text-[10px] uppercase font-montserrat font-semibold text-gray-500 block">Applicable Index</span>
                  <span className="text-xs font-bold text-[#8A651E] truncate block mt-0.5" title={studyTrackDetails.applicableIndex}>
                    {studyTrackDetails.applicableIndex}
                  </span>
                </div>

                <div className="bg-[#FAF9F5] p-3 rounded-2xl border border-[#C8A45D]/20">
                  <span className="text-[10px] uppercase font-montserrat font-semibold text-gray-500 block">Access Status</span>
                  <span className="text-xs font-bold text-gray-900 block mt-0.5">
                    {isStudyIndexActive
                      ? 'Edit Access Active'
                      : isStudyIndexPending
                      ? 'Payment Verification Pending'
                      : 'View Only'}
                  </span>
                </div>
              </div>

              {/* ACTION / NOTIFICATION BANNERS */}
              {!isStudyIndexActive && !isStudyIndexPending && (
                <div className="bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-transparent border border-[#C8A45D]/50 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-amber-500 text-black text-[10px] font-bold rounded-md uppercase">
                        View Only Mode
                      </span>
                      <span className="font-montserrat font-bold text-xs text-gray-900">
                        Unlock {studyTrackDetails.applicableIndex} Edit Access
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">
                      You are currently in <strong>View Only</strong> mode. Purchase your assigned index to edit lecture completion, record test scores, and track your revision cycles.
                    </p>
                  </div>

                  <button
                    onClick={() => setIsStudyIndexCheckoutOpen(true)}
                    className="px-5 py-2.5 bg-gradient-to-r from-[#FFE3A0] via-[#C8A45D] to-[#DFB96E] hover:from-[#FFEFA6] hover:to-[#C8A45D] text-black font-montserrat font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md shrink-0 flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <span>Unlock Edit Access (₹{studyTrackDetails.price.toLocaleString('en-IN')}/-)</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {isStudyIndexPending && (
                <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <h4 className="font-montserrat font-bold text-xs text-amber-950">
                        Payment Verification Pending (₹{studyTrackDetails.price.toLocaleString('en-IN')}/-)
                      </h4>
                      <p className="text-xs text-amber-800 leading-relaxed">
                        Your UPI payment is awaiting verification by Admin Harkiran Kaur. Your index is currently in <strong>View Only</strong> mode and will automatically switch to <strong>Edit Access Active</strong> upon approval.
                      </p>
                    </div>
                  </div>
                  <a
                    href={`https://wa.me/919284084523?text=${encodeURIComponent(
                      `Hello Harkiran Ma'am, I have submitted UPI payment for HK StudyTrack Pro (${studyTrackDetails.applicableIndex}). Kindly verify my UTR.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-montserrat font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shrink-0 transition-colors shadow-xs"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Notify on WhatsApp</span>
                  </a>
                </div>
              )}

              {isStudyIndexActive && (
                <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-3.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs text-emerald-900">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      <strong>Edit Access Active:</strong> You have full permission to edit and save your study progress, revision cycles, and test marks below. Your changes persist across logins and logouts.
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* SYLLABUS INDEX COMPONENT (Strictly Isolated to Student's Applicable Index) */}
            <MentorshipTrackerView
              profile={studyIndexProfile}
              isAdmin={isImpersonating}
              isStudyProgressIndex={true}
              onPurchaseStudyIndex={() => setIsStudyIndexCheckoutOpen(true)}
              onProfileUpdated={(updated) => {
                const studentKey = centralStudent?.studentId || effectiveUser?.email || effectiveUser?.id;
                if (studentKey) {
                  updateStudentStudyIndexRows(studentKey, updated.trackerRows);
                }
              }}
              onExitAdminView={handleExitAdminImpersonation}
            />
          </div>
        )}

        {/* TAB 1: MY COURSES */}
        {activeTab === 'courses' && (
          <div className="space-y-6">
            {enrolledProducts.length === 0 ? (
              <div className="bg-white border border-[#C8A45D]/40 rounded-3xl p-8 sm:p-12 text-center space-y-5 shadow-sm">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-[#C8A45D]/40 flex items-center justify-center mx-auto text-[#8A651E]">
                  <GraduationCap className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-cinzel text-xl font-bold text-[#1C1917]">
                    No Paid Mentorship Programs Enrolled Yet
                  </h3>
                  <p className="text-xs text-gray-600 max-w-md mx-auto">
                    You have registered your free student portal! You can book your 1st 1-on-1 diagnostic call with Harkiran Kaur or join our exclusive 25-aspirant mentorship batches below.
                  </p>
                </div>

                <div className="flex flex-wrap justify-center gap-3 pt-2">
                  <button
                    onClick={() => onNavigate('programs')}
                    className="px-6 py-3 bg-gradient-to-r from-[#FFE3A0] via-[#C8A45D] to-[#DFB96E] hover:from-[#FFEFA6] hover:to-[#C8A45D] text-black font-montserrat font-bold text-xs rounded-xl shadow-md uppercase tracking-wider cursor-pointer"
                  >
                    Explore Mentorship Programs
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {enrolledProducts.map((prod) => {
                  const matchingOrder = studentOrders.find((o) =>
                    o.items.some((it) => it.productId === prod.id)
                  );

                  return (
                    <div
                      key={prod.id}
                      className="bg-white border border-[#C8A45D]/50 rounded-3xl p-6 shadow-md hover:shadow-lg transition-all space-y-4 flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] px-2.5 py-1 bg-amber-500/15 text-[#8A651E] font-bold rounded-lg uppercase tracking-wider border border-[#C8A45D]/30">
                            {prod.category}
                          </span>
                          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Enrolled & Active
                          </span>
                        </div>

                        <h3 className="font-cinzel text-lg font-bold text-[#1C1917] leading-snug">
                          {prod.name}
                        </h3>

                        <p className="text-xs text-gray-600 line-clamp-2">
                          {prod.description}
                        </p>

                        <div className="p-3.5 bg-[#FAF7F2] border border-[#EADBCE] rounded-2xl space-y-2">
                          <div className="text-[11px] font-bold text-[#8A651E] uppercase tracking-wider font-montserrat">
                            Batch & Mentorship Inclusions:
                          </div>
                          <ul className="text-xs text-gray-700 space-y-1.5">
                            {prod.features.slice(0, 3).map((feat, i) => (
                              <li key={i} className="flex items-start gap-1.5">
                                <Check className="w-3.5 h-3.5 text-[#C8A45D] shrink-0 mt-0.5" />
                                <span>{feat}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
                        {matchingOrder ? (
                          <button
                            onClick={() => downloadInvoicePDF(matchingOrder)}
                            className="px-3.5 py-2 bg-[#F8F6F2] hover:bg-[#EFECE6] text-black border border-[#C8A45D]/40 text-xs font-montserrat font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                          >
                            <Download className="w-3.5 h-3.5 text-[#8A651E]" />
                            <span>Download Invoice (PDF)</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-gray-500 font-medium">
                            Enrolled via Student Portal
                          </span>
                        )}

                        <button
                          onClick={() => setActiveTab('tracker')}
                          className="px-3.5 py-2 bg-gradient-to-r from-[#FFE3A0] via-[#C8A45D] to-[#DFB96E] hover:brightness-110 text-black font-montserrat font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>Open Syllabus Tracker</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Quick 1-on-1 Guidance Banner */}
            <div className="bg-gradient-to-r from-amber-500/10 via-[#C8A45D]/15 to-amber-500/10 border border-[#C8A45D]/40 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <span className="text-[10px] font-montserrat font-bold text-[#8A651E] uppercase tracking-widest">
                  Personal Mentorship Protocol
                </span>
                <h4 className="font-cinzel text-base sm:text-lg font-bold text-[#1C1917]">
                  Need 1-on-1 Subject Guidance with Harkiran Kaur?
                </h4>
                <p className="text-xs text-gray-600">
                  Every enrolled aspirant gets direct diagnostic evaluation, target schedules, and test answer checking within 48-72 hours.
                </p>
              </div>

              <div className="px-5 py-3 bg-black text-[#FFE3A0] border border-[#C8A45D] font-montserrat font-bold text-xs rounded-xl shadow-md shrink-0 flex items-center gap-2 uppercase tracking-wider">
                <Calendar className="w-4 h-4 text-[#C8A45D]" />
                <span>Mentorship Calls Coordinated by Academy</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: INVOICES & ORDERS */}
        {activeTab === 'invoices' && (
          <div className="space-y-6">
            <div className="bg-white border border-[#C8A45D]/40 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
                <div>
                  <h3 className="font-cinzel text-lg font-bold text-[#1C1917]">
                    Official Student Tax Invoices & Order Receipts
                  </h3>
                  <p className="text-xs text-gray-600">
                    Compliant tax invoices generated for HK Code of Rankers mentorship enrollments.
                  </p>
                </div>
                <div className="text-xs text-gray-600">
                  Support: <strong className="text-black">hk.code.of.rankers@gmail.com</strong>
                </div>
              </div>

              {studentOrders.length === 0 ? (
                <div className="py-12 text-center text-gray-500 text-xs sm:text-sm space-y-2">
                  <FileText className="w-10 h-10 text-[#C8A45D] mx-auto opacity-70" />
                  <p>No enrollment invoices found for your email / phone yet.</p>
                  <p className="text-[11px] text-gray-400">
                    When you enroll in a mentorship program or submit a direct UPI UTR, your official invoice will appear here for 1-click PDF download.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200 text-gray-500 font-montserrat uppercase text-[10px] tracking-wider">
                        <th className="py-3 px-3">Order #</th>
                        <th className="py-3 px-3">Date</th>
                        <th className="py-3 px-3">Program Enrolled</th>
                        <th className="py-3 px-3">Amount</th>
                        <th className="py-3 px-3">Payment / Ref</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3 text-right">Invoice Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {studentOrders.map((ord) => (
                        <tr key={ord.id} className="hover:bg-[#FAF8F5] transition-colors">
                          <td className="py-3.5 px-3 font-mono font-bold text-[#8A651E]">
                            {ord.orderNumber}
                          </td>
                          <td className="py-3.5 px-3 text-gray-600">
                            {new Date(ord.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </td>
                          <td className="py-3.5 px-3 font-medium text-gray-800 max-w-xs truncate">
                            {ord.items.map((i) => i.name).join(' + ')}
                          </td>
                          <td className="py-3.5 px-3 font-bold font-montserrat text-black">
                            ₹{ord.totalAmount.toLocaleString('en-IN')}/-
                          </td>
                          <td className="py-3.5 px-3 text-gray-600 text-[11px]">
                            {ord.paymentMethod} {ord.utrNumber ? `• UTR: ${ord.utrNumber}` : ''}
                          </td>
                          <td className="py-3.5 px-3">
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                                ord.status === 'COMPLETED'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {ord.status === 'COMPLETED' ? 'Verified' : 'Pending UTR'}
                            </span>
                          </td>
                          <td className="py-3.5 px-3 text-right">
                            <button
                              onClick={() => downloadInvoicePDF(ord)}
                              className="px-3 py-1.5 bg-gradient-to-r from-[#FFE3A0] to-[#C8A45D] hover:from-[#FFEFA6] hover:to-[#C8A45D] text-black font-montserrat font-bold text-[11px] rounded-lg shadow-sm transition-all cursor-pointer inline-flex items-center gap-1.5"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Download PDF</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: UPCOMING LAUNCHES */}
        {activeTab === 'launches' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-[#141210] to-[#1F1C18] border border-[#C8A45D]/40 rounded-3xl p-6 sm:p-8 text-white space-y-2">
              <span className="text-[10px] font-montserrat font-bold text-[#FFE3A0] uppercase tracking-widest bg-amber-500/20 px-3 py-1 rounded-full border border-[#C8A45D]/40">
                Academy Pipeline & Innovations
              </span>
              <h3 className="font-cinzel text-xl sm:text-2xl font-bold text-white">
                Upcoming Launches for 2026 CS Aspirants
              </h3>
              <p className="text-xs text-gray-300 max-w-2xl leading-relaxed">
                As a registered student on HK Code of Rankers, you receive priority reservation and early bird discounts on all upcoming tools, test series, and study materials crafted by Harkiran Kaur (AIR 3).
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Launch 1: Chapter-Wise Evaluated Test Series */}
              <div className="bg-white border border-[#C8A45D]/40 rounded-3xl p-6 shadow-md hover:shadow-xl transition-all space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] px-2.5 py-0.5 bg-amber-500/20 text-[#8A651E] font-bold rounded-full uppercase tracking-wider">
                      Launching Soon
                    </span>
                    <span className="text-[10px] text-gray-500 font-medium">Phase 1</span>
                  </div>

                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-[#C8A45D]/40 flex items-center justify-center text-[#8A651E]">
                    <Award className="w-6 h-6" />
                  </div>

                  <h4 className="font-cinzel text-lg font-bold text-[#1C1917]">
                    Evaluated Chapter-Wise Test Series
                  </h4>

                  <p className="text-xs text-gray-600 leading-relaxed">
                    Targeted chapter tests for CSEET, CS Executive (Group 1 & 2), and CS Professional with ICSI-pattern evaluation, line-by-line mark deduction feedback, and rankers suggested answers within 48 hours.
                  </p>

                  <ul className="text-xs text-gray-700 space-y-1.5 pt-1">
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-[#C8A45D]" /> 50+ Subject-Wise Test Papers
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-[#C8A45D]" /> Strict 48-Hour Return Guarantee
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-[#C8A45D]" /> AIR 3 Personal Answer Analysis
                    </li>
                  </ul>
                </div>

                <button
                  onClick={() => handleNotifyLaunch('Evaluated Chapter-Wise Test Series')}
                  className="w-full py-2.5 bg-[#FAF7F2] hover:bg-[#F0EBE0] border border-[#C8A45D] text-[#8A651E] font-montserrat font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span>Get Priority Notification</span>
                </button>
              </div>

              {/* Launch 2: Digital Notes & ICSI Scanner */}
              <div className="bg-white border border-[#C8A45D]/40 rounded-3xl p-6 shadow-md hover:shadow-xl transition-all space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] px-2.5 py-0.5 bg-amber-500/20 text-[#8A651E] font-bold rounded-full uppercase tracking-wider">
                      Launching Soon
                    </span>
                    <span className="text-[10px] text-gray-500 font-medium">Phase 2</span>
                  </div>

                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-[#C8A45D]/40 flex items-center justify-center text-[#8A651E]">
                    <BookOpen className="w-6 h-6" />
                  </div>

                  <h4 className="font-cinzel text-lg font-bold text-[#1C1917]">
                    Handcrafted ICSI Digital Revision Notes
                  </h4>

                  <p className="text-xs text-gray-600 leading-relaxed">
                    Color-coded revision summaries, flowchart breakdowns of Company Law, Tax Law formula sheets, and past 5-attempt question categorization tailored for rapid memorization.
                  </p>

                  <ul className="text-xs text-gray-700 space-y-1.5 pt-1">
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-[#C8A45D]" /> High-Yield Topic Flash Summaries
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-[#C8A45D]" /> Landmark Case Law Compendium
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-[#C8A45D]" /> Instant PDF Access on Mobile
                    </li>
                  </ul>
                </div>

                <button
                  onClick={() => handleNotifyLaunch('Handcrafted ICSI Digital Revision Notes')}
                  className="w-full py-2.5 bg-[#FAF7F2] hover:bg-[#F0EBE0] border border-[#C8A45D] text-[#8A651E] font-montserrat font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span>Get Priority Notification</span>
                </button>
              </div>

              {/* Launch 3: Live Rankers Masterclass */}
              <div className="bg-white border border-[#C8A45D]/40 rounded-3xl p-6 shadow-md hover:shadow-xl transition-all space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] px-2.5 py-0.5 bg-amber-500/20 text-[#8A651E] font-bold rounded-full uppercase tracking-wider">
                      Launching Soon
                    </span>
                    <span className="text-[10px] text-gray-500 font-medium">Phase 3</span>
                  </div>

                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-[#C8A45D]/40 flex items-center justify-center text-[#8A651E]">
                    <Sparkles className="w-6 h-6" />
                  </div>

                  <h4 className="font-cinzel text-lg font-bold text-[#1C1917]">
                    Rankers Masterclass & Doubt Clinics
                  </h4>

                  <p className="text-xs text-gray-600 leading-relaxed">
                    Weekly live interactive masterclasses on high-weightage drafting techniques, examiner psychology, 100-mark paper pacing, and anxiety elimination with Harkiran Kaur (AIR 3).
                  </p>

                  <ul className="text-xs text-gray-700 space-y-1.5 pt-1">
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-[#C8A45D]" /> Live 2-Way Interactive Sessions
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-[#C8A45D]" /> Recording Vault with Lifetime Access
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-[#C8A45D]" /> Exclusive for Registered Students
                    </li>
                  </ul>
                </div>

                <button
                  onClick={() => handleNotifyLaunch('Rankers Masterclass & Doubt Clinics')}
                  className="w-full py-2.5 bg-[#FAF7F2] hover:bg-[#F0EBE0] border border-[#C8A45D] text-[#8A651E] font-montserrat font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span>Get Priority Notification</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: ASPIRANT PROFILE */}
        {activeTab === 'profile' && (
          <div className="bg-white border border-[#C8A45D]/40 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <h3 className="font-cinzel text-lg font-bold text-[#1C1917] border-b border-gray-100 pb-3">
              Aspirant Registration & Batch Profile
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-[#FAF7F2] rounded-2xl space-y-1">
                <span className="text-gray-500 font-montserrat uppercase text-[10px]">Full Name</span>
                <p className="font-bold text-black text-sm">{user.fullName}</p>
              </div>

              <div className="p-4 bg-[#FAF7F2] rounded-2xl space-y-1">
                <span className="text-gray-500 font-montserrat uppercase text-[10px]">Email Address</span>
                <p className="font-bold text-black text-sm">{user.email}</p>
              </div>

              <div className="p-4 bg-[#FAF7F2] rounded-2xl space-y-1">
                <span className="text-gray-500 font-montserrat uppercase text-[10px]">Registered Mobile Number</span>
                <p className="font-bold text-black text-sm">{user.phone}</p>
              </div>

              <div className="p-4 bg-[#FAF7F2] border border-[#C8A45D]/30 rounded-2xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 font-montserrat uppercase text-[10px] font-bold">Target ICSI Course / Level</span>
                  <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full font-montserrat font-bold">
                    Official Syllabus Index
                  </span>
                </div>
                <div className="mt-1">
                  <p className="font-bold text-black text-sm">
                    {user.targetExam || (mentorshipProfile ? `${mentorshipProfile.program} (${mentorshipProfile.group})` : 'CS Executive Group 1')}
                  </p>
                </div>
                <p className="text-[10px] text-gray-500">
                  Course allocation and syllabus tracker index are managed directly by Academy Administration.
                </p>
              </div>

              <div className="p-4 bg-[#FAF7F2] rounded-2xl space-y-1">
                <span className="text-gray-500 font-montserrat uppercase text-[10px]">Official Head Mentor</span>
                <p className="font-bold text-black text-sm">Harkiran Kaur Kohli (AIR 3 CS Professional)</p>
              </div>

              <div className="p-4 bg-[#FAF7F2] rounded-2xl space-y-1">
                <span className="text-gray-500 font-montserrat uppercase text-[10px]">Official Workspace Email</span>
                <p className="font-bold text-black text-sm">hk.code.of.rankers@gmail.com</p>
              </div>
            </div>

            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>Your student profile is active and verified on HK Code of Rankers portal.</span>
            </div>

            {/* SECURITY & PASSWORD MANAGEMENT (EMAIL-VERIFIED RESET ONLY) */}
            <div className="p-6 bg-gradient-to-br from-[#FAF7F2] to-white border-2 border-[#C8A45D]/40 rounded-3xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-[#C8A45D]/40 flex items-center justify-center text-[#8A651E] shrink-0">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="font-cinzel font-bold text-sm text-[#1C1917]">
                      Security & Password Management
                    </h4>
                    <p className="text-xs text-gray-600 leading-relaxed max-w-md">
                      To prevent unauthorized changes, passwords cannot be altered directly on this screen. A single-use verification link will be sent to your registered email (<strong className="text-black">{effectiveUser.email || 'your email'}</strong>).
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleSendPasswordResetLink}
                  disabled={isSendingReset}
                  className="px-4 py-2.5 bg-gradient-to-r from-[#1C1917] to-[#2E2419] hover:from-[#2E2419] hover:to-[#3F3323] text-[#FFE3A0] border border-[#C8A45D] font-montserrat font-bold text-xs rounded-xl transition-all shadow-sm cursor-pointer shrink-0 flex items-center justify-center gap-2"
                >
                  <Mail className="w-3.5 h-3.5 text-[#C8A45D]" />
                  <span>{isSendingReset ? 'Sending Link...' : 'Email Me Password Reset Link'}</span>
                </button>
              </div>

              {resetFeedback && (
                <div
                  className={`p-4 rounded-2xl text-xs space-y-2.5 animate-fade-in ${
                    resetFeedback.type === 'success'
                      ? 'bg-emerald-50 border border-emerald-300 text-emerald-900'
                      : 'bg-rose-50 border border-rose-300 text-rose-900'
                  }`}
                >
                  <div className="flex items-center gap-2 font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{resetFeedback.message}</span>
                  </div>

                  {resetFeedback.url && (
                    <div className="p-3 bg-white/80 border border-emerald-200 rounded-xl space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] uppercase font-bold text-gray-500">
                          Single-Use Reset URL:
                        </span>
                        <button
                          onClick={() => handleCopyResetUrl(resetFeedback.url!)}
                          className="text-[11px] font-bold text-[#8A651E] flex items-center gap-1 hover:underline cursor-pointer"
                        >
                          <Copy className="w-3 h-3" />
                          <span>{copiedResetLink ? 'Copied!' : 'Copy Link'}</span>
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          readOnly
                          value={resetFeedback.url}
                          className="w-full text-[11px] font-mono bg-gray-50 border border-gray-200 px-2.5 py-1.5 rounded-lg text-gray-700 outline-none"
                        />
                        <a
                          href={resetFeedback.url}
                          target="_self"
                          className="px-3 py-1.5 bg-[#8A651E] hover:bg-[#6D5018] text-white rounded-lg text-[11px] font-bold shrink-0 inline-flex items-center gap-1"
                        >
                          <span>Open Link</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Study Progress Index Dedicated UPI Checkout Modal */}
        {studyTrackDetails && (
          <StudyProgressIndexCheckoutModal
            isOpen={isStudyIndexCheckoutOpen}
            onClose={() => setIsStudyIndexCheckoutOpen(false)}
            details={studyTrackDetails}
            student={
              centralStudent ||
              ({
                studentId: effectiveUser?.id || `std_${Date.now()}`,
                fullName: studentName,
                email: effectiveUser?.email || '',
                phone: effectiveUser?.phone || '',
                program: studentProgram,
                level: studentLevel,
                group: studentGroup,
                targetExam: `${studentProgram} — ${studentGroup}`,
              } as any)
            }
            onSuccess={() => {
              // The central database and OrderContext are updated
            }}
          />
        )}
      </div>
    </div>
  );
};
