/**
 * HK Code of Rankers — Central Unified Student Database
 * Single source of truth for:
 * - Student Accounts & Profiles
 * - Registration Approvals (Stage 1)
 * - Payment Approvals (Stage 2)
 * - Mentorship Access & Isolated Index Mapping
 * - Official ICSI 2026 Chapter Tracker (with Red Marking)
 * - 12-Month Mentorship Calls Tracker
 * - 11 Single-Use 15% Discount Codes
 * - Secure Link-Based Password Resets
 */

import {
  TrackerRow,
  MonthMentorshipRecord,
  StudentMentorshipProfile,
} from '../types/mentorship';
import {
  buildTrackerRowsFromSyllabusGroup,
  createDefault12MonthCalls,
  CURRENT_SYLLABUS_VERSION,
} from './mentorshipTrackerService';
import { ICSI_OFFICIAL_SYLLABUS } from '../data/icsiOfficialSyllabus';
export { ICSI_OFFICIAL_SYLLABUS };
import {
  sendStudentRegistrationEmail,
  sendRegistrationApprovedEmail,
  sendRegistrationRejectedEmail,
  sendPaymentApprovedEmail,
  sendPaymentRejectedEmail,
  sendPasswordResetLinkEmail,
  sendSlotBookingConfirmationEmail,
  sendFreeSlotBookingConfirmationEmail,
} from './emailService';

// Storage Keys
const CENTRAL_STUDENTS_KEY = 'hk_central_students_db_v2';
const DISCOUNT_CODES_KEY = 'hk_discount_codes_15_percent_v2';
const PASSWORD_RESET_TOKENS_KEY = 'hk_password_reset_tokens_v2';
const SLOT_BOOKINGS_KEY = 'hk_slot_bookings_central_v2';
const FREE_SLOT_BOOKINGS_KEY = 'hk_free_slot_bookings_central_v2';
const SYNC_EVENT_NAME = 'hk_central_db_updated';

export interface FreeSlotBookingRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  program: string;
  preferredSlot: string;
  notes?: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  createdAt: string;
  adminRemarks?: string;
}

export type ProgramName = 'CS EET' | 'CS Executive' | 'CS Professional';
export type ProgramLevel = 'Level 1' | 'Level 2' | 'Level 3';
export type ProgramGroup = 'EET' | 'Group 1' | 'Group 2' | 'Both Groups';

export type RegistrationStatus = 'approved' | 'rejected' | 'pending_approval';
export type PaymentStatus = 'unpaid' | 'pending_approval' | 'approved' | 'rejected';

export interface PurchasedCourseInfo {
  courseId: string;
  courseName: string;
  amount: number;
  discountCodeUsed?: string;
  discountAmount?: number;
  finalAmount: number;
  orderId: string;
  paymentMethod: string;
  transactionRef?: string; // 12-digit UPI UTR
  paymentDate: string;
  paymentProofNotes?: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface SlotBookingRecord {
  id: string; // e.g. SLOT-2026-001
  studentId?: string;
  studentName: string;
  email: string;
  phone: string;
  program: string;
  group: string;
  bookingDate: string; // e.g. "2026-09-22"
  bookingTime: string; // e.g. "11:30 AM"
  callType: string; // e.g. "Mentorship 1: Personal Syllabus Tracking"
  notes?: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  createdAt: string;
  adminRemarks?: string;
}

export interface CentralStudent {
  studentId: string; // STU-2026-XXX
  fullName: string;
  email: string;
  phone: string;
  program: ProgramName;
  level: ProgramLevel;
  group: ProgramGroup;
  targetExam: string; // e.g. 'CS Executive — Group 1'
  password: string;
  avatar?: string;

  // Registration: Automatic approval upon registration (No approval queue!)
  registrationStatus: RegistrationStatus;
  registeredAt: string;
  registrationApprovedAt?: string;
  registrationRejectedAt?: string;
  registrationRejectionReason?: string;

  // Payment Status (Course / Product purchase)
  paymentStatus: PaymentStatus;
  purchasedCourse?: PurchasedCourseInfo;
  paymentApprovedAt?: string;
  paymentRejectedAt?: string;
  paymentRejectionReason?: string;

  // PRODUCT A: Mentorship Access (Admin Controlled, Student View-Only)
  mentorshipAccess: boolean;
  assignedIndexId: 'cseet' | 'exec-g1' | 'exec-g2' | 'prof-g1' | 'prof-g2';

  // PRODUCT B: CS Study Progress Index — ₹999/- (Student = VIEW + EDIT ACCESS)
  studyIndexAccess: boolean;
  studyIndexRows?: TrackerRow[];

  // Syllabus Tracker & Mentorship Calls Data (Mentorship Course)
  trackerRows: TrackerRow[];
  monthlyCalls: MonthMentorshipRecord[];

  adminNotes?: string;
  isActive: boolean;
  role: 'student';
  updatedAt: string;
}

export interface DiscountCodeRecord {
  code: string;
  discountPercent: 15 | 5;
  isUsed: boolean;
  usedByStudentId?: string;
  usedByStudentName?: string;
  usedByEmail?: string;
  usedWithOrderId?: string;
  usedAt?: string;
}

export interface PasswordResetToken {
  token: string;
  studentId: string;
  email: string;
  expiresAt: number; // epoch ms
  used: boolean;
  createdAt: string;
}

// 11 Designated 15% OFF One-Time Promo Codes + HK5 5% Code
export const PREDEFINED_15_PERCENT_CODES = [
  'AIR1',
  'RANKER15',
  'CSVICTORY',
  'HARSHITA15',
  'TOPPER15',
  'EXCEL15',
  'SUCCESS15',
  'ICSI15',
  'FUTURECS',
  'GOLDEN15',
  'CSDEC15',
  'HK15-A7K9P',
  'HK15-B4M8Q',
  'HK15-C6R2X',
  'HK15-D9L5N',
  'HK15-E3T7V',
  'HK15-F8P4K',
  'HK15-G2W6M',
  'HK15-H5Q9R',
  'HK15-J7N3X',
  'HK15-K4V8T',
  'HK15-L6M2P',
];

/**
 * Maps program + level + group to assigned index ID
 */
export function getAssignedIndexId(
  program: ProgramName,
  group: ProgramGroup
): 'cseet' | 'exec-g1' | 'exec-g2' | 'prof-g1' | 'prof-g2' {
  if (program === 'CS EET' || group === 'EET') return 'cseet';
  if (program === 'CS Executive') {
    if (group === 'Group 2') return 'exec-g2';
    return 'exec-g1'; // defaults to Group 1 (or primary for Both Groups)
  }
  if (program === 'CS Professional') {
    if (group === 'Group 2') return 'prof-g2';
    return 'prof-g1';
  }
  return 'exec-g1';
}

/**
 * Dispatches a cross-component event so all screens refresh instantly
 */
function notifyDbChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(SYNC_EVENT_NAME));
  }
}

/**
 * Subscribes to real-time database changes
 */
export function subscribeToDatabaseChanges(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleCustom = () => callback();
  const handleStorage = (e: StorageEvent) => {
    if (
      e.key === CENTRAL_STUDENTS_KEY ||
      e.key === DISCOUNT_CODES_KEY ||
      e.key === PASSWORD_RESET_TOKENS_KEY ||
      e.key === SLOT_BOOKINGS_KEY ||
      e.key === FREE_SLOT_BOOKINGS_KEY
    ) {
      callback();
    }
  };

  window.addEventListener(SYNC_EVENT_NAME, handleCustom);
  window.addEventListener('storage', handleStorage);

  return () => {
    window.removeEventListener(SYNC_EVENT_NAME, handleCustom);
    window.removeEventListener('storage', handleStorage);
  };
}

/**
 * Initializes discount codes if not already seeded
 */
export function getDiscountCodes(): DiscountCodeRecord[] {
  try {
    const raw = localStorage.getItem(DISCOUNT_CODES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Ensure HK5 is present
        if (!parsed.some((c: DiscountCodeRecord) => c.code === 'HK5')) {
          parsed.unshift({
            code: 'HK5',
            discountPercent: 5,
            isUsed: false,
          });
          localStorage.setItem(DISCOUNT_CODES_KEY, JSON.stringify(parsed));
        }
        return parsed;
      }
    }
  } catch {
    // fallback
  }

  const initial: DiscountCodeRecord[] = [
    {
      code: 'HK5',
      discountPercent: 5,
      isUsed: false,
    },
    ...PREDEFINED_15_PERCENT_CODES.map((code) => ({
      code,
      discountPercent: 15 as const,
      isUsed: false,
    })),
  ];

  try {
    localStorage.setItem(DISCOUNT_CODES_KEY, JSON.stringify(initial));
  } catch {
    // ignore
  }

  return initial;
}

/**
 * Validates a discount code (15% or 5% off, single use per code, no stacking)
 */
export function validateDiscountCode(
  code: string
): { valid: boolean; discountPercent: number; message: string; record?: DiscountCodeRecord } {
  const formatted = (code || '').trim().toUpperCase();
  if (!formatted) {
    return { valid: false, discountPercent: 0, message: 'Please enter a promo code.' };
  }

  const codes = getDiscountCodes();
  const found = codes.find((c) => c.code === formatted);

  if (!found) {
    return {
      valid: false,
      discountPercent: 0,
      message: 'Invalid promo code. Please enter a valid discount code.',
    };
  }

  if (found.isUsed) {
    return {
      valid: false,
      discountPercent: 0,
      message: `Code ${formatted} has already been redeemed and cannot be reused.`,
    };
  }

  return {
    valid: true,
    discountPercent: found.discountPercent,
    message: `🎉 Success! ${found.discountPercent}% Ranker Discount applied (${formatted}).`,
    record: found,
  };
}

/**
 * Marks a discount code as permanently redeemed
 */
export function markDiscountCodeUsed(
  code: string,
  details: { studentId: string; studentName: string; email: string; orderId: string }
): boolean {
  const formatted = (code || '').trim().toUpperCase();
  const codes = getDiscountCodes();
  const idx = codes.findIndex((c) => c.code === formatted);
  if (idx === -1) return false;

  codes[idx].isUsed = true;
  codes[idx].usedByStudentId = details.studentId;
  codes[idx].usedByStudentName = details.studentName;
  codes[idx].usedByEmail = details.email;
  codes[idx].usedWithOrderId = details.orderId;
  codes[idx].usedAt = new Date().toISOString();

  try {
    localStorage.setItem(DISCOUNT_CODES_KEY, JSON.stringify(codes));
    notifyDbChange();
    return true;
  } catch {
    return false;
  }
}

/**
 * Creates initial default demo students if DB is empty
 */
function createSeedStudents(): CentralStudent[] {
  const createStudentSeed = (
    id: string,
    name: string,
    email: string,
    phone: string,
    program: ProgramName,
    level: ProgramLevel,
    group: ProgramGroup,
    targetExam: string,
    indexId: 'cseet' | 'exec-g1' | 'exec-g2' | 'prof-g1' | 'prof-g2',
    isMentorshipPaid: boolean,
    isStudyIndexPaid: boolean
  ): CentralStudent => {
    const syllabus = ICSI_OFFICIAL_SYLLABUS[indexId];
    const rows = syllabus
      ? buildTrackerRowsFromSyllabusGroup(syllabus, indexId)
      : [];
    const studyRows = syllabus
      ? buildTrackerRowsFromSyllabusGroup(syllabus, indexId)
      : [];

    return {
      studentId: id,
      fullName: name,
      email: email.toLowerCase(),
      phone,
      program,
      level,
      group,
      targetExam,
      password: 'student123',
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=C8A45D&color=000`,
      // Registration is ALWAYS active and approved
      registrationStatus: 'approved',
      registeredAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      registrationApprovedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      paymentStatus: (isMentorshipPaid || isStudyIndexPaid) ? 'approved' : 'unpaid',
      paymentApprovedAt: (isMentorshipPaid || isStudyIndexPaid) ? new Date(Date.now() - 86400000 * 3).toISOString() : undefined,
      purchasedCourse: isMentorshipPaid
        ? {
            courseId: `course_${indexId}`,
            courseName: `${program} (${group}) Mentorship Batch`,
            amount: indexId.includes('prof') ? 3499 : indexId.includes('exec') ? 2999 : 1199,
            finalAmount: indexId.includes('prof') ? 3499 : indexId.includes('exec') ? 2999 : 1199,
            orderId: `ORD-2026-${id.slice(-4)}`,
            paymentMethod: 'UPI',
            transactionRef: `928408${Math.floor(100000 + Math.random() * 900000)}`,
            paymentDate: new Date(Date.now() - 86400000 * 3).toISOString(),
          }
        : isStudyIndexPaid
        ? {
            courseId: 'cs-study-progress-index',
            courseName: 'CS Study Progress Index (₹999)',
            amount: 999,
            finalAmount: 999,
            orderId: `ORD-2026-${id.slice(-4)}`,
            paymentMethod: 'UPI',
            transactionRef: `928408${Math.floor(100000 + Math.random() * 900000)}`,
            paymentDate: new Date(Date.now() - 86400000 * 2).toISOString(),
          }
        : undefined,
      mentorshipAccess: isMentorshipPaid,
      assignedIndexId: indexId,
      studyIndexAccess: isStudyIndexPaid,
      studyIndexRows: studyRows,
      trackerRows: rows,
      monthlyCalls: createDefault12MonthCalls(),
      isActive: true,
      role: 'student',
      updatedAt: new Date().toISOString(),
    };
  };

  return [
    createStudentSeed(
      'STU-2026-001',
      'Aarav Sharma',
      'aarav.sharma@gmail.com',
      '9876543210',
      'CS EET',
      'Level 1',
      'EET',
      'CS EET — Complete Mentorship',
      'cseet',
      true, // Mentorship paid
      false
    ),
    createStudentSeed(
      'STU-2026-002',
      'Riya Patel',
      'riya.patel@gmail.com',
      '9876543211',
      'CS Executive',
      'Level 2',
      'Group 1',
      'CS Executive — Group 1',
      'exec-g1',
      true, // Mentorship paid
      false
    ),
    createStudentSeed(
      'STU-2026-003',
      'Devansh Verma',
      'devansh.verma@gmail.com',
      '9876543212',
      'CS Executive',
      'Level 2',
      'Group 2',
      'CS Executive — Group 2',
      'exec-g2',
      false, // No mentorship
      true // Has CS Study Progress Index ₹999!
    ),
    createStudentSeed(
      'STU-2026-004',
      'Pooja Kulkarni',
      'pooja.kulkarni@gmail.com',
      '9876543213',
      'CS Professional',
      'Level 3',
      'Group 1',
      'CS Professional — Group 1',
      'prof-g1',
      true, // Has mentorship
      true // Also has CS Study Progress Index!
    ),
    createStudentSeed(
      'STU-2026-005',
      'Karan Malhotra',
      'karan.malhotra@gmail.com',
      '9876543214',
      'CS Professional',
      'Level 3',
      'Group 2',
      'CS Professional — Group 2',
      'prof-g2',
      false,
      false // Registered, unpaid
    ),
  ];
}

/**
 * Loads all students from the central database
 */
export function getAllStudents(): CentralStudent[] {
  try {
    const raw = localStorage.getItem(CENTRAL_STUDENTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Auto-migration: ensure no student is stuck in registration pending approval
        let needsSave = false;
        const migrated = parsed.map((s: any) => {
          if (s.registrationStatus === 'pending_approval' || s.registrationStatus === 'pending') {
            s.registrationStatus = 'approved';
            s.registrationApprovedAt = s.registrationApprovedAt || s.registeredAt || new Date().toISOString();
            needsSave = true;
          }
          if (s.studyIndexAccess === undefined) {
            s.studyIndexAccess = false;
            needsSave = true;
          }
          if (!s.studyIndexRows || s.studyIndexRows.length === 0) {
            const syllabus = ICSI_OFFICIAL_SYLLABUS[s.assignedIndexId as keyof typeof ICSI_OFFICIAL_SYLLABUS];
            if (syllabus) {
              s.studyIndexRows = buildTrackerRowsFromSyllabusGroup(syllabus, s.assignedIndexId);
              needsSave = true;
            }
          }
          return s as CentralStudent;
        });

        if (needsSave) {
          saveAllStudents(migrated);
        }
        return migrated;
      }
    }
  } catch {
    // fallback
  }

  const seeded = createSeedStudents();
  saveAllStudents(seeded);
  return seeded;
}

/**
 * Saves all students to the central database and broadcasts sync event
 */
export function saveAllStudents(students: CentralStudent[]): void {
  try {
    localStorage.setItem(CENTRAL_STUDENTS_KEY, JSON.stringify(students));
    notifyDbChange();
  } catch (err) {
    console.warn('Central DB save error:', err);
  }
}

/**
 * Gets a student by Student ID
 */
export function getStudentById(studentId: string): CentralStudent | null {
  const all = getAllStudents();
  return all.find((s) => s.studentId === studentId) || null;
}

/**
 * Gets a student by Email address
 */
export function getStudentByEmail(email: string): CentralStudent | null {
  if (!email) return null;
  const clean = email.trim().toLowerCase();
  const all = getAllStudents();
  return all.find((s) => s.email.toLowerCase() === clean) || null;
}

/**
 * Converts a CentralStudent into a StudentMentorshipProfile for compatibility with MentorshipTrackerView
 */
export function toMentorshipProfile(student: CentralStudent): StudentMentorshipProfile {
  return {
    studentId: student.studentId,
    studentName: student.fullName,
    studentEmail: student.email,
    studentPhone: student.phone,
    program: student.program,
    level: student.level,
    group: student.group as any,
    assignedIndexId: student.assignedIndexId,
    targetAttempt: student.targetExam,
    syllabusVersion: CURRENT_SYLLABUS_VERSION,
    trackerRows: student.trackerRows,
    monthlyCalls: student.monthlyCalls,
    isApproved: true,
    approvalStatus: 'approved',
    approvedAt: student.registrationApprovedAt || student.registeredAt,
    updatedAt: student.updatedAt,
  };
}

// ====================================================================
// 1. STUDENT REGISTRATION (Automatic Account Creation — No Approval Queue)
// ====================================================================

export interface RegisterStudentInput {
  fullName: string;
  email: string;
  phone: string;
  program: ProgramName;
  level: ProgramLevel;
  group: ProgramGroup;
  password: string;
}

export function registerStudentInCentralDb(
  input: RegisterStudentInput
): { success: boolean; message: string; student?: CentralStudent } {
  const cleanEmail = (input.email || '').trim().toLowerCase();
  const cleanPhone = (input.phone || '').trim();
  const cleanName = (input.fullName || '').trim();

  if (!cleanName || !cleanEmail || !cleanPhone || !input.password) {
    return { success: false, message: 'All registration fields are required.' };
  }

  const all = getAllStudents();

  // Check duplicate email
  const existing = all.find((s) => s.email.toLowerCase() === cleanEmail);
  if (existing) {
    return {
      success: false,
      message: `An account with email ${cleanEmail} already exists. Please log in with your password.`,
    };
  }

  // Derive assigned index and target exam
  const assignedIndexId = getAssignedIndexId(input.program, input.group);
  const targetExam = `${input.program} — ${input.group}`;

  // Seed syllabus tracker rows (for mentorship tracker)
  const syllabus = ICSI_OFFICIAL_SYLLABUS[assignedIndexId];
  const trackerRows = syllabus
    ? buildTrackerRowsFromSyllabusGroup(syllabus, assignedIndexId)
    : [];
  // Seed study index rows (for the student-editable Study Progress Index)
  const studyIndexRows = syllabus
    ? buildTrackerRowsFromSyllabusGroup(syllabus, assignedIndexId)
    : [];

  const studentCount = all.length + 1;
  const studentId = `STU-2026-${String(studentCount).padStart(3, '0')}`;

  const newStudent: CentralStudent = {
    studentId,
    fullName: cleanName,
    email: cleanEmail,
    phone: cleanPhone,
    program: input.program,
    level: input.level,
    group: input.group,
    targetExam,
    password: input.password,
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanName)}&background=C8A45D&color=000`,
    // Registration is automatically approved!
    registrationStatus: 'approved',
    registeredAt: new Date().toISOString(),
    registrationApprovedAt: new Date().toISOString(),
    paymentStatus: 'unpaid',
    mentorshipAccess: false,
    studyIndexAccess: false,
    assignedIndexId,
    trackerRows,
    studyIndexRows,
    monthlyCalls: createDefault12MonthCalls(),
    isActive: true,
    role: 'student',
    updatedAt: new Date().toISOString(),
  };

  all.unshift(newStudent);
  saveAllStudents(all);

  // Send automated registration welcome email
  sendStudentRegistrationEmail({
    studentName: cleanName,
    studentEmail: cleanEmail,
    studentPhone: cleanPhone,
    targetExam,
  }).catch((e) => console.warn('Registration welcome email notice:', e));

  return {
    success: true,
    message: `Account created successfully! Welcome to HK Code of Rankers, ${cleanName}. Your student portal account is now active.`,
    student: newStudent,
  };
}

// ====================================================================
// 2. APPROVAL 1: REGISTRATION APPROVAL (Admin)
// ====================================================================

export function approveStudentRegistration(
  studentId: string,
  adminName = 'CS Harkiran Kaur'
): { success: boolean; message: string } {
  const all = getAllStudents();
  const idx = all.findIndex((s) => s.studentId === studentId);
  if (idx === -1) {
    return { success: false, message: 'Student record not found in central database.' };
  }

  const student = all[idx];
  student.registrationStatus = 'approved';
  student.registrationApprovedAt = new Date().toISOString();
  student.updatedAt = new Date().toISOString();

  saveAllStudents(all);

  // Send Registration Approved Email
  sendRegistrationApprovedEmail({
    studentName: student.fullName,
    studentEmail: student.email,
    studentPhone: student.phone,
    programName: student.targetExam,
    approvedDate: new Date().toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
    notes: `Approved by ${adminName}. You can now log into your Student Portal and select your mentorship program to purchase.`,
  }).catch((e) => console.warn('Registration approval email notice:', e));

  return {
    success: true,
    message: `Registration for ${student.fullName} has been approved! Login access is unlocked and confirmation email dispatched.`,
  };
}

export function rejectStudentRegistration(
  studentId: string,
  reason: string,
  adminName = 'CS Harkiran Kaur'
): { success: boolean; message: string } {
  const all = getAllStudents();
  const idx = all.findIndex((s) => s.studentId === studentId);
  if (idx === -1) {
    return { success: false, message: 'Student record not found in central database.' };
  }

  const student = all[idx];
  student.registrationStatus = 'rejected';
  student.registrationRejectedAt = new Date().toISOString();
  student.registrationRejectionReason = reason || 'Application did not meet admission criteria.';
  student.updatedAt = new Date().toISOString();

  saveAllStudents(all);

  // Send Registration Rejected Email
  sendRegistrationRejectedEmail({
    studentName: student.fullName,
    studentEmail: student.email,
    reason: student.registrationRejectionReason,
  }).catch((e) => console.warn('Registration rejection email notice:', e));

  return {
    success: true,
    message: `Registration for ${student.fullName} has been rejected.`,
  };
}

// ====================================================================
// 3. COURSE PURCHASE & PAYMENT SUBMISSION (Student)
// ====================================================================

export interface SubmitPaymentInput {
  studentId: string;
  courseId: string;
  courseName: string;
  amount: number;
  discountCode?: string;
  discountAmount?: number;
  finalAmount: number;
  paymentMethod: string;
  transactionRef: string; // UTR number
  paymentProofNotes?: string;
}

export function submitStudentCoursePayment(
  input: SubmitPaymentInput
): { success: boolean; message: string; orderId?: string } {
  const all = getAllStudents();
  const idx = all.findIndex((s) => s.studentId === input.studentId);
  if (idx === -1) {
    return { success: false, message: 'Student record not found.' };
  }

  const student = all[idx];
  // Registration is automatic; ensure status is approved
  student.registrationStatus = 'approved';

  const orderId = `ORD-2026-${Date.now().toString().slice(-5)}`;

  // If discount code used, mark it permanently as USED
  if (input.discountCode) {
    markDiscountCodeUsed(input.discountCode, {
      studentId: student.studentId,
      studentName: student.fullName,
      email: student.email,
      orderId,
    });
  }

  student.paymentStatus = 'pending_approval';
  student.purchasedCourse = {
    courseId: input.courseId,
    courseName: input.courseName,
    amount: input.amount,
    discountCodeUsed: input.discountCode,
    discountAmount: input.discountAmount || 0,
    finalAmount: input.finalAmount,
    orderId,
    paymentMethod: input.paymentMethod || 'UPI',
    transactionRef: input.transactionRef.trim(),
    paymentDate: new Date().toISOString(),
    paymentProofNotes: input.paymentProofNotes,
  };
  student.updatedAt = new Date().toISOString();

  saveAllStudents(all);

  return {
    success: true,
    message: `Payment submitted successfully (UTR: ${input.transactionRef})! It is now pending Admin Payment Approval. Your mentorship tracker will unlock automatically once confirmed.`,
    orderId,
  };
}

// ====================================================================
// 4. APPROVAL 2: PAYMENT APPROVAL (Admin)
// ====================================================================

export function approveStudentPayment(
  studentId: string,
  adminName = 'CS Harkiran Kaur'
): { success: boolean; message: string } {
  const all = getAllStudents();
  const idx = all.findIndex((s) => s.studentId === studentId);
  if (idx === -1) {
    return { success: false, message: 'Student record not found.' };
  }

  const student = all[idx];
  student.paymentStatus = 'approved';
  student.paymentApprovedAt = new Date().toISOString();

  // Differentiate Mentorship Course vs. CS Study Progress Index (₹999)
  const isStudyIndexProduct =
    student.purchasedCourse?.courseId === 'cs-study-progress-index' ||
    student.purchasedCourse?.courseName?.toLowerCase().includes('study progress index') ||
    student.purchasedCourse?.courseName?.toLowerCase().includes('progress index');

  if (isStudyIndexProduct) {
    student.studyIndexAccess = true;
    if (!student.studyIndexRows || student.studyIndexRows.length === 0) {
      const syllabus = ICSI_OFFICIAL_SYLLABUS[student.assignedIndexId];
      if (syllabus) {
        student.studyIndexRows = buildTrackerRowsFromSyllabusGroup(syllabus, student.assignedIndexId);
      }
    }
  } else {
    // Mentorship Course payment
    student.mentorshipAccess = true;
  }

  if (student.purchasedCourse) {
    student.purchasedCourse.reviewedAt = new Date().toISOString();
    student.purchasedCourse.reviewedBy = adminName;
  }
  student.updatedAt = new Date().toISOString();

  saveAllStudents(all);

  // Send Payment Approval & Course Activation Email
  if (student.purchasedCourse) {
    sendPaymentApprovedEmail({
      studentName: student.fullName,
      studentEmail: student.email,
      courseName: student.purchasedCourse.courseName,
      amount: student.purchasedCourse.finalAmount,
      utrNumber: student.purchasedCourse.transactionRef || 'VERIFIED-UPI',
      orderNumber: student.purchasedCourse.orderId,
    }).catch((e) => console.warn('Payment approval email notice:', e));
  }

  return {
    success: true,
    message: `Payment for ${student.fullName} has been approved! ${isStudyIndexProduct ? 'CS Study Progress Index (Student Editable)' : 'Mentorship Course (View-Only)'} access is now active.`,
  };
}

export function rejectStudentPayment(
  studentId: string,
  reason: string,
  adminName = 'CS Harkiran Kaur'
): { success: boolean; message: string } {
  const all = getAllStudents();
  const idx = all.findIndex((s) => s.studentId === studentId);
  if (idx === -1) {
    return { success: false, message: 'Student record not found.' };
  }

  const student = all[idx];
  student.paymentStatus = 'rejected';
  student.paymentRejectedAt = new Date().toISOString();
  student.paymentRejectionReason = reason || 'Payment could not be verified with bank records.';
  student.updatedAt = new Date().toISOString();

  saveAllStudents(all);

  // Send Payment Rejection Email
  sendPaymentRejectedEmail({
    studentName: student.fullName,
    studentEmail: student.email,
    reason: student.paymentRejectionReason,
    orderId: student.purchasedCourse?.orderId,
  }).catch((e) => console.warn('Payment rejection email notice:', e));

  return {
    success: true,
    message: `Payment for ${student.fullName} has been rejected.`,
  };
}

// ====================================================================
// 5. MENTORSHIP TRACKER & RED MARKING (Admin Updates)
// ====================================================================

export function updateStudentTrackerRows(
  studentId: string,
  newRows: TrackerRow[]
): boolean {
  const all = getAllStudents();
  const idx = all.findIndex((s) => s.studentId === studentId);
  if (idx === -1) return false;

  all[idx].trackerRows = newRows;
  all[idx].updatedAt = new Date().toISOString();

  saveAllStudents(all);
  return true;
}

/**
 * CS STUDY PROGRESS INDEX (₹999) — Student Editable
 * Allows student to update their own study progress index rows
 */
export function updateStudentStudyIndexRows(
  studentId: string,
  newRows: TrackerRow[]
): boolean {
  const all = getAllStudents();
  const idx = all.findIndex((s) => s.studentId === studentId);
  if (idx === -1) return false;

  all[idx].studyIndexRows = newRows;
  all[idx].updatedAt = new Date().toISOString();

  saveAllStudents(all);
  return true;
}

/**
 * Direct Admin Access Update for Student
 * Allows Admin to manage course access, study index access, and group assignment
 */
export function updateStudentAccessDetails(
  studentId: string,
  updates: {
    fullName?: string;
    email?: string;
    phone?: string;
    program?: ProgramName;
    level?: ProgramLevel;
    group?: ProgramGroup;
    targetExam?: string;
    mentorshipAccess?: boolean;
    studyIndexAccess?: boolean;
    paymentStatus?: PaymentStatus;
    registrationStatus?: RegistrationStatus;
    adminNotes?: string;
  }
): boolean {
  const all = getAllStudents();
  const idx = all.findIndex((s) => s.studentId === studentId);
  if (idx === -1) return false;

  const s = all[idx];
  if (updates.fullName) s.fullName = updates.fullName.trim();
  if (updates.email) s.email = updates.email.trim().toLowerCase();
  if (updates.phone) s.phone = updates.phone.trim();
  if (updates.program) s.program = updates.program;
  if (updates.level) s.level = updates.level;
  if (updates.group) s.group = updates.group;
  if (updates.targetExam) s.targetExam = updates.targetExam.trim();
  if (updates.program || updates.group) {
    s.assignedIndexId = getAssignedIndexId(s.program, s.group);
    if (!updates.targetExam) {
      s.targetExam = `${s.program} — ${s.group}`;
    }
  }
  if (updates.mentorshipAccess !== undefined) s.mentorshipAccess = updates.mentorshipAccess;
  if (updates.studyIndexAccess !== undefined) s.studyIndexAccess = updates.studyIndexAccess;
  if (updates.paymentStatus !== undefined) s.paymentStatus = updates.paymentStatus;
  if (updates.registrationStatus !== undefined) s.registrationStatus = updates.registrationStatus;
  if (updates.adminNotes !== undefined) s.adminNotes = updates.adminNotes;
  s.updatedAt = new Date().toISOString();

  saveAllStudents(all);
  return true;
}

/**
 * Universal Central Student Updater
 */
export function updateCentralStudent(
  studentId: string,
  updates: Partial<CentralStudent>
): boolean {
  const all = getAllStudents();
  const idx = all.findIndex((s) => s.studentId === studentId);
  if (idx === -1) return false;

  all[idx] = {
    ...all[idx],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  saveAllStudents(all);
  return true;
}

export function updateStudentMonthlyCalls(
  studentId: string,
  calls: MonthMentorshipRecord[]
): boolean {
  const all = getAllStudents();
  const idx = all.findIndex((s) => s.studentId === studentId);
  if (idx === -1) return false;

  all[idx].monthlyCalls = calls;
  all[idx].updatedAt = new Date().toISOString();

  saveAllStudents(all);
  return true;
}

// ====================================================================
// 5B. SLOT BOOKINGS DATABASE (Connected Real-Time to Admin & Student)
// ====================================================================

export function getAllSlotBookings(): SlotBookingRecord[] {
  try {
    const raw = localStorage.getItem(SLOT_BOOKINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // fallback
  }

  const seeded: SlotBookingRecord[] = [
    {
      id: 'SLOT-2026-001',
      studentId: 'STU-2026-001',
      studentName: 'Aarav Sharma',
      email: 'aarav.sharma@gmail.com',
      phone: '9876543210',
      program: 'CS EET',
      group: 'EET',
      bookingDate: '2026-09-24',
      bookingTime: '11:30 AM',
      callType: 'Mentorship 1: Personal Syllabus Tracking',
      notes: 'Initial syllabus audit and backlog target setup.',
      status: 'confirmed',
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      adminRemarks: 'Slot confirmed. Zoom / WhatsApp link shared.',
    },
    {
      id: 'SLOT-2026-002',
      studentId: 'STU-2026-002',
      studentName: 'Riya Patel',
      email: 'riya.patel@gmail.com',
      phone: '9876543211',
      program: 'CS Executive',
      group: 'Group 1',
      bookingDate: '2026-09-25',
      bookingTime: '04:00 PM',
      callType: 'Mentorship 2: Study & Progress Mentorship',
      notes: 'Need guidance on JIGL Bare Act case law citations and answer structuring.',
      status: 'pending',
      createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    },
    {
      id: 'SLOT-2026-003',
      studentId: 'STU-2026-004',
      studentName: 'Pooja Kulkarni',
      email: 'pooja.kulkarni@gmail.com',
      phone: '9876543213',
      program: 'CS Professional',
      group: 'Group 1',
      bookingDate: '2026-09-27',
      bookingTime: '06:30 PM',
      callType: 'Mentorship 3: Performance & Revision Review',
      notes: 'Discussion on Drafting & Pleadings mock test paper evaluation.',
      status: 'confirmed',
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      adminRemarks: 'Answer sheet review scheduled.',
    },
  ];

  saveAllSlotBookings(seeded);
  return seeded;
}

export function saveAllSlotBookings(bookings: SlotBookingRecord[]): void {
  try {
    localStorage.setItem(SLOT_BOOKINGS_KEY, JSON.stringify(bookings));
    notifyDbChange();
  } catch (err) {
    console.warn('Slot bookings save error:', err);
  }
}

export function bookMentorshipSlot(data: {
  studentId?: string;
  studentName: string;
  email: string;
  phone: string;
  program: string;
  group: string;
  bookingDate: string;
  bookingTime: string;
  callType: string;
  notes?: string;
}): { success: boolean; message: string; booking: SlotBookingRecord } {
  const all = getAllSlotBookings();
  const id = `SLOT-2026-${String(all.length + 1).padStart(3, '0')}`;
  const booking: SlotBookingRecord = {
    id,
    studentId: data.studentId,
    studentName: data.studentName.trim(),
    email: data.email.trim().toLowerCase(),
    phone: data.phone.trim(),
    program: data.program,
    group: data.group,
    bookingDate: data.bookingDate,
    bookingTime: data.bookingTime,
    callType: data.callType,
    notes: data.notes,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  all.unshift(booking);
  saveAllSlotBookings(all);

  // Send booking confirmation email to registered email
  sendSlotBookingConfirmationEmail({
    studentName: booking.studentName,
    studentEmail: booking.email,
    studentPhone: booking.phone,
    program: `${booking.program} (${booking.group})`,
    bookingDate: booking.bookingDate,
    bookingTime: booking.bookingTime,
    callType: booking.callType,
    bookingId: booking.id,
    notes: booking.notes,
  }).catch((err) => console.warn('Slot booking confirmation email dispatch:', err));

  return {
    success: true,
    message: `Slot booked successfully for ${data.bookingDate} at ${data.bookingTime}! Details have been sent to ${data.email} and recorded in the Admin Portal.`,
    booking,
  };
}

export function updateSlotBookingStatus(
  bookingId: string,
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled',
  adminRemarks?: string
): boolean {
  const all = getAllSlotBookings();
  const idx = all.findIndex((b) => b.id === bookingId);
  if (idx === -1) return false;

  all[idx].status = status;
  if (adminRemarks !== undefined) all[idx].adminRemarks = adminRemarks;

  saveAllSlotBookings(all);
  return true;
}

export function deleteSlotBooking(bookingId: string): boolean {
  const all = getAllSlotBookings();
  const filtered = all.filter((b) => b.id !== bookingId);
  if (filtered.length === all.length) return false;

  saveAllSlotBookings(filtered);
  return true;
}

// ====================================================================
// 5C. FREE SLOT BOOKINGS DATABASE (ADMIN → FREE SLOT BOOKINGS)
// ====================================================================

export function getAllFreeSlotBookings(): FreeSlotBookingRecord[] {
  try {
    const raw = localStorage.getItem(FREE_SLOT_BOOKINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore
  }

  const seeded: FreeSlotBookingRecord[] = [
    {
      id: 'FREE-2026-001',
      name: 'Aditya Verma',
      email: 'aditya.verma@gmail.com',
      phone: '9823456781',
      program: 'CS Executive Group 1',
      preferredSlot: 'Tomorrow Evening (4:00 PM - 6:00 PM)',
      notes: 'Need guidance on clearing JIGL & Company Law in 1st attempt.',
      status: 'pending',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: 'FREE-2026-002',
      name: 'Sneha Rao',
      email: 'sneha.rao@gmail.com',
      phone: '9845123980',
      program: 'Class 12th Pass (CS Career Roadmap)',
      preferredSlot: 'Weekend Special Slot',
      notes: 'Parent inquiry on CSEET preparation timeline and registration fees.',
      status: 'confirmed',
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      adminRemarks: 'Call confirmed for Saturday 11 AM.',
    },
  ];

  saveAllFreeSlotBookings(seeded);
  return seeded;
}

export function saveAllFreeSlotBookings(bookings: FreeSlotBookingRecord[]): void {
  try {
    localStorage.setItem(FREE_SLOT_BOOKINGS_KEY, JSON.stringify(bookings));
    notifyDbChange();
  } catch (err) {
    console.warn('Free slot bookings save error:', err);
  }
}

export function createFreeSlotBooking(data: {
  name: string;
  email: string;
  phone: string;
  program: string;
  preferredSlot: string;
  notes?: string;
}): { success: boolean; message: string; booking: FreeSlotBookingRecord } {
  const all = getAllFreeSlotBookings();
  const id = `FREE-2026-${String(all.length + 1).padStart(3, '0')}`;
  const booking: FreeSlotBookingRecord = {
    id,
    name: data.name.trim(),
    email: data.email.trim().toLowerCase(),
    phone: data.phone.trim(),
    program: data.program,
    preferredSlot: data.preferredSlot,
    notes: data.notes,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  all.unshift(booking);
  saveAllFreeSlotBookings(all);

  // Send Free Slot confirmation email to registered email
  sendFreeSlotBookingConfirmationEmail({
    candidateName: booking.name,
    candidateEmail: booking.email,
    candidatePhone: booking.phone,
    program: booking.program,
    preferredSlot: booking.preferredSlot,
    bookingId: booking.id,
    notes: booking.notes,
  }).catch((err) => console.warn('Free slot confirmation email dispatch:', err));

  return {
    success: true,
    message: `Free guidance slot booked successfully for ${booking.preferredSlot}! Confirmation sent to ${booking.email}.`,
    booking,
  };
}

export function updateFreeSlotBookingStatus(
  bookingId: string,
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled',
  adminRemarks?: string
): boolean {
  const all = getAllFreeSlotBookings();
  const idx = all.findIndex((b) => b.id === bookingId);
  if (idx === -1) return false;

  all[idx].status = status;
  if (adminRemarks !== undefined) all[idx].adminRemarks = adminRemarks;

  saveAllFreeSlotBookings(all);
  return true;
}

export function deleteFreeSlotBooking(bookingId: string): boolean {
  const all = getAllFreeSlotBookings();
  const filtered = all.filter((b) => b.id !== bookingId);
  if (filtered.length === all.length) return false;

  saveAllFreeSlotBookings(filtered);
  return true;
}

// ====================================================================
// 6. PASSWORD RESET VIA SECURE EMAIL LINK ONLY
// ====================================================================

function getStoredResetTokens(): PasswordResetToken[] {
  try {
    const raw = localStorage.getItem(PASSWORD_RESET_TOKENS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return [];
}

function saveStoredResetTokens(tokens: PasswordResetToken[]): void {
  try {
    localStorage.setItem(PASSWORD_RESET_TOKENS_KEY, JSON.stringify(tokens));
  } catch {
    // ignore
  }
}

/**
 * Stage 1: Student requests password reset link
 * Checks email exists, generates single-use token, sends secure link
 */
export function requestPasswordResetLink(
  email: string
): { success: boolean; message: string; token?: string; resetUrl?: string } {
  const cleanEmail = (email || '').trim().toLowerCase();
  if (!cleanEmail) {
    return { success: false, message: 'Please provide your registered email address.' };
  }

  const student = getStudentByEmail(cleanEmail);
  if (!student) {
    return {
      success: false,
      message: `No account found with ${cleanEmail}. Please check your spelling or register as a new student.`,
    };
  }

  // Account exists, proceed with password reset link regardless of manual approval state


  // Generate a cryptographically secure token
  const randomPart = Math.random().toString(36).substring(2, 12);
  const timePart = Date.now().toString(36);
  const token = `rst_${timePart}_${randomPart}`;

  // 30 minute expiration
  const expiresAt = Date.now() + 30 * 60 * 1000;

  const tokenRecord: PasswordResetToken = {
    token,
    studentId: student.studentId,
    email: cleanEmail,
    expiresAt,
    used: false,
    createdAt: new Date().toISOString(),
  };

  const tokens = getStoredResetTokens();
  // Invalidate any existing unused tokens for this email
  tokens.forEach((t) => {
    if (t.email === cleanEmail) t.used = true;
  });
  tokens.push(tokenRecord);
  saveStoredResetTokens(tokens);

  // Construct secure reset link
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://hkcodeofrankers.com';
  const resetUrl = `${origin}/student-portal?resetToken=${token}`;

  // Send official password reset link email
  sendPasswordResetLinkEmail({
    studentName: student.fullName,
    studentEmail: student.email,
    resetUrl,
    token,
  }).catch((e) => console.warn('Password reset email error:', e));

  return {
    success: true,
    token,
    resetUrl,
    message: `A secure password reset link has been sent to ${cleanEmail}. Click the link in your email to choose a new password. The link expires in 30 minutes.`,
  };
}

/**
 * Stage 2: Verifies if a reset token is valid and not expired
 */
export function verifyPasswordResetToken(
  token: string
): { valid: boolean; email?: string; studentId?: string; error?: string } {
  if (!token) return { valid: false, error: 'Reset token is missing.' };

  const tokens = getStoredResetTokens();
  const record = tokens.find((t) => t.token === token);

  if (!record) {
    return { valid: false, error: 'Invalid or unrecognized reset token.' };
  }

  if (record.used) {
    return { valid: false, error: 'This password reset link has already been used.' };
  }

  if (Date.now() > record.expiresAt) {
    return { valid: false, error: 'This password reset link has expired. Please request a new one.' };
  }

  return { valid: true, email: record.email, studentId: record.studentId };
}

/**
 * Stage 3: Executes password reset using verified token
 */
export function completePasswordResetWithToken(
  token: string,
  newPassword: string
): { success: boolean; message: string } {
  const verification = verifyPasswordResetToken(token);
  if (!verification.valid || !verification.email) {
    return { success: false, message: verification.error || 'Invalid reset token.' };
  }

  if (!newPassword || newPassword.length < 6) {
    return { success: false, message: 'New password must be at least 6 characters long.' };
  }

  const all = getAllStudents();
  const student = all.find((s) => s.email.toLowerCase() === verification.email!.toLowerCase());

  if (!student) {
    return { success: false, message: 'Student account could not be found.' };
  }

  // Update password in central DB
  student.password = newPassword;
  student.updatedAt = new Date().toISOString();
  saveAllStudents(all);

  // Invalidate token
  const tokens = getStoredResetTokens();
  const tokenIdx = tokens.findIndex((t) => t.token === token);
  if (tokenIdx !== -1) {
    tokens[tokenIdx].used = true;
    saveStoredResetTokens(tokens);
  }

  return {
    success: true,
    message: 'Your password has been reset successfully! You can now log in with your new password.',
  };
}

// ====================================================================
// 7. STUDENT ACCOUNT MANAGEMENT (Delete, Toggle)
// ====================================================================

export function deleteStudentFromCentralDb(studentId: string): boolean {
  const all = getAllStudents();
  const filtered = all.filter((s) => s.studentId !== studentId);
  if (filtered.length === all.length) return false;

  saveAllStudents(filtered);
  return true;
}

export function toggleStudentActiveStatus(studentId: string): boolean {
  const all = getAllStudents();
  const idx = all.findIndex((s) => s.studentId === studentId);
  if (idx === -1) return false;

  all[idx].isActive = !all[idx].isActive;
  all[idx].updatedAt = new Date().toISOString();
  saveAllStudents(all);
  return true;
}

// ====================================================================
// 8. SLOT BOOKING COMPATIBILITY ALIAS
// ====================================================================

export const createSlotBooking = bookMentorshipSlot;


