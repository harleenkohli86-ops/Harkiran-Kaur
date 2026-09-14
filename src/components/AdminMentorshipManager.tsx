import React, { useState, useEffect } from 'react';
import {
  StudentMentorshipProfile,
  MentorshipProgram,
  MentorshipLevel,
  MentorshipGroup,
  TrackerRow,
} from '../types/mentorship';
import {
  getAllStudentMentorshipProfiles,
  saveStudentMentorshipProfile,
  reassignStudentGroup,
  setAdminViewingStudentId,
  getOrCreateStudentMentorship,
  deleteStudentMentorshipProfile,
  setStudentApprovalStatus,
  applyCustomIndexToStudent,
  generateDefaultChapters,
} from '../services/mentorshipTrackerService';
import {
  fetchAllAppointments,
  updateAppointmentStatus,
  AppointmentRecord,
} from '../lib/supabase';
import {
  sendStudentConfirmationEmail,
  sendStudentApprovalEmail,
  sendFreeSlotBookingConfirmationEmail,
  getWhatsAppApprovalUrl,
} from '../services/emailService';
import { MentorshipTrackerView } from './MentorshipTrackerView';
import {
  getAllStudents,
  getDiscountCodes,
  getAllSlotBookings,
  getAllFreeSlotBookings,
  updateStudentAccessDetails,
  approveStudentRegistration,
  rejectStudentRegistration,
  approveStudentPayment,
  rejectStudentPayment,
  deleteStudentFromCentralDb,
  subscribeToDatabaseChanges,
  CentralStudent,
  DiscountCodeRecord,
  SlotBookingRecord,
  FreeSlotBookingRecord,
} from '../services/centralStudentDatabase';
import { RegistrationApprovalsTab } from './admin/RegistrationApprovalsTab';
import { PaymentApprovalsTab } from './admin/PaymentApprovalsTab';
import { RegisteredStudentsListTab } from './admin/RegisteredStudentsListTab';
import { DiscountCodesTab } from './admin/DiscountCodesTab';
import { SyllabusIndexTab } from './admin/SyllabusIndexTab';
import { SlotBookingsTab } from './admin/SlotBookingsTab';
import { FreeSlotBookingsTab } from './admin/FreeSlotBookingsTab';
import { ManageStudentModal } from './admin/ManageStudentModal';
import {
  Search,
  Filter,
  User,
  Users,
  Phone,
  Mail,
  ShieldCheck,
  ExternalLink,
  BookOpen,
  CheckCircle2,
  Flame,
  ArrowLeft,
  Plus,
  RefreshCw,
  Edit3,
  Calendar,
  Layers,
  Award,
  Sparkles,
  MessageSquare,
  Send,
  Trash2,
  QrCode,
  AlertTriangle,
  Clock,
  Loader2,
  Check,
  Upload,
  FileSpreadsheet,
  Download,
  FileText,
  Bookmark,
  Tag,
  CreditCard,
  PhoneCall,
  SlidersHorizontal,
} from 'lucide-react';
import { PageId } from '../types';

interface AdminMentorshipManagerProps {
  onNavigate: (page: PageId) => void;
  initialStudentId?: string | null;
}

export const AdminMentorshipManager: React.FC<AdminMentorshipManagerProps> = ({
  onNavigate,
  initialStudentId,
}) => {
  const [centralStudents, setCentralStudents] = useState<CentralStudent[]>(() => getAllStudents());
  const [discountCodes, setDiscountCodes] = useState<DiscountCodeRecord[]>(() => getDiscountCodes());
  const [slotBookings, setSlotBookings] = useState<SlotBookingRecord[]>(() => getAllSlotBookings());
  const [freeSlotBookings, setFreeSlotBookings] = useState<FreeSlotBookingRecord[]>(() => getAllFreeSlotBookings());
  const [students, setStudents] = useState<StudentMentorshipProfile[]>([]);
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [activeStudent, setActiveStudent] = useState<StudentMentorshipProfile | null>(null);
  const [managingStudent, setManagingStudent] = useState<CentralStudent | null>(null);
  const [managerTab, setManagerTab] = useState<
    'students_list' | 'registrations' | 'payments' | 'free_slot_bookings' | 'directory' | 'chart' | 'syllabus_index' | 'discount_codes'
  >('students_list');
  const [searchQuery, setSearchQuery] = useState('');
  const [directoryType, setDirectoryType] = useState<'mentorship' | 'self_paced'>('mentorship');
  const [groupFilter, setGroupFilter] = useState<string>('all');
  const [approvalFilter, setApprovalFilter] = useState<'all' | 'pending' | 'approved'>('all');
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<StudentMentorshipProfile | null>(null);
  const [isDeletingStudent, setIsDeletingStudent] = useState(false);
  const [actionToast, setActionToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
    waUrl?: string;
  } | null>(null);

  // Syllabus Index Upload & Custom Editing state (Admin Only)
  const [uploadingIndexStudent, setUploadingIndexStudent] = useState<StudentMentorshipProfile | null>(null);
  const [indexUploadTab, setIndexUploadTab] = useState<'preset' | 'file' | 'text'>('preset');
  const [pastedIndexText, setPastedIndexText] = useState('');
  const [selectedPresetGroup, setSelectedPresetGroup] = useState('exec-g1');
  const [uploadedParsedRows, setUploadedParsedRows] = useState<TrackerRow[] | null>(null);
  const [uploadError, setUploadError] = useState('');

  const loadCentralData = () => {
    const cs = getAllStudents();
    setCentralStudents(cs);
    setDiscountCodes(getDiscountCodes());
    setSlotBookings(getAllSlotBookings());
    setFreeSlotBookings(getAllFreeSlotBookings());
    if (managingStudent) {
      const refreshed = cs.find((s) => s.studentId === managingStudent.studentId);
      if (refreshed) setManagingStudent(refreshed);
    }
  };

  const loadStudents = () => {
    const list = getAllStudentMentorshipProfiles();
    setStudents(list);
  };

  const loadAppointments = async () => {
    try {
      const res = await fetchAllAppointments();
      setAppointments(res.data);
      // Automatic enrollment: Any confirmed appointment or student record automatically enrolled
      let enrolledAny = false;
      if (res.data && res.data.length > 0) {
        res.data.forEach((appt) => {
          if (appt.status === 'confirmed') {
            const email = (appt.email || '').trim().toLowerCase();
            const phone = (appt.phone || '').trim();
            if (email || phone) {
              getOrCreateStudentMentorship({
                fullName: appt.name,
                email,
                phone,
                targetExam: appt.program || 'CS Executive Group 1',
                isApproved: true,
              });
              enrolledAny = true;
            }
          }
        });
      }
      if (enrolledAny) {
        setStudents(getAllStudentMentorshipProfiles());
      }
    } catch (err) {
      console.warn('Could not fetch appointments in mentorship manager:', err);
    }
  };

  useEffect(() => {
    loadCentralData();
    loadStudents();
    loadAppointments();

    const unsubscribe = subscribeToDatabaseChanges(() => {
      loadCentralData();
      loadStudents();
    });
    return () => unsubscribe();
  }, []);

  // Ensure an active student is selected so the Mentorship Chart is always ready to view and edit
  useEffect(() => {
    if (students.length > 0) {
      if (initialStudentId) {
        const found = students.find(
          (s) =>
            s.studentId === initialStudentId ||
            s.studentEmail?.toLowerCase() === initialStudentId.toLowerCase() ||
            s.studentPhone?.replace(/\D/g, '') === initialStudentId.replace(/\D/g, '')
        );
        if (found) {
          setActiveStudent(found);
          setManagerTab('chart');
          return;
        }
      }
      if (!activeStudent) {
        setActiveStudent(students[0]);
      }
    }
  }, [students, initialStudentId]);

  // Helper to cross-reference student with appointments/UPI submissions
  const getMatchedAppointment = (s: StudentMentorshipProfile): AppointmentRecord | undefined => {
    const cleanPhone = (s.studentPhone || '').replace(/\D/g, '');
    const cleanEmail = (s.studentEmail || '').trim().toLowerCase();

    return appointments.find((a) => {
      const aPhone = (a.phone || '').replace(/\D/g, '');
      const aEmail = (a.email || '').trim().toLowerCase();
      if (cleanPhone && aPhone && (cleanPhone === aPhone || cleanPhone.slice(-10) === aPhone.slice(-10))) return true;
      if (cleanEmail && aEmail && cleanEmail === aEmail) return true;
      return false;
    });
  };

  // Unified Centralized Registration Approval
  const handleApproveRegistration = async (student: CentralStudent) => {
    setApprovingId(student.studentId);
    try {
      approveStudentRegistration(student.studentId);
      loadCentralData();
      loadStudents();

      const waUrl = getWhatsAppApprovalUrl({
        studentName: student.fullName,
        studentEmail: student.email,
        studentPhone: student.phone,
        programName: student.targetExam,
      });

      setActionToast({
        message: `Approved! Registration confirmed for ${student.fullName}. Login access unlocked and notification dispatched.`,
        type: 'success',
        waUrl,
      });
      setTimeout(() => setActionToast(null), 7000);
    } catch (err: any) {
      setActionToast({
        message: err?.message || 'Registration approval error',
        type: 'error',
      });
    } finally {
      setApprovingId(null);
    }
  };

  const handleRejectRegistration = (student: CentralStudent) => {
    const reason = window.prompt(`Enter reason for rejecting registration of ${student.fullName}:`, 'Incomplete registration credentials');
    if (reason === null) return;
    rejectStudentRegistration(student.studentId, reason);
    loadCentralData();
    loadStudents();
    setActionToast({
      message: `Registration marked as rejected for ${student.fullName}.`,
      type: 'info',
    });
    setTimeout(() => setActionToast(null), 5000);
  };

  // Unified Centralized Payment Approval
  const handleApprovePayment = async (student: CentralStudent) => {
    setApprovingId(student.studentId);
    try {
      approveStudentPayment(student.studentId);
      loadCentralData();
      loadStudents();

      const courseName = student.purchasedCourse?.courseName || student.targetExam;
      const cleanPhone = student.phone.replace(/\D/g, '').slice(-10);
      const waUrl = cleanPhone
        ? `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(
            `Hello ${student.fullName}! Your payment for ${courseName} has been verified and approved by Harkiran Kaur! 🎉\n\nYour personalized Mentorship Roadmap, Chapter Index, and 12-Month Diagnostic & Strategy Calls are now unlocked in your Student Portal!`
          )}`
        : undefined;

      setActionToast({
        message: `Payment Verified & Approved! Full mentorship access unlocked for ${student.fullName}.`,
        type: 'success',
        waUrl,
      });
      setTimeout(() => setActionToast(null), 7000);
    } catch (err: any) {
      setActionToast({
        message: err?.message || 'Payment approval error',
        type: 'error',
      });
    } finally {
      setApprovingId(null);
    }
  };

  const handleRejectPayment = (student: CentralStudent) => {
    const reason = window.prompt(`Enter reason for rejecting payment of ${student.fullName}:`, 'Payment UTR / transaction verification failed');
    if (reason === null) return;
    rejectStudentPayment(student.studentId, reason);
    loadCentralData();
    loadStudents();
    setActionToast({
      message: `Payment rejected for ${student.fullName}.`,
      type: 'info',
    });
    setTimeout(() => setActionToast(null), 5000);
  };

  const handleOpenMentorshipChartForCentralStudent = (student: CentralStudent) => {
    const matched = students.find(
      (s) =>
        s.studentId === student.studentId ||
        s.studentEmail?.toLowerCase() === student.email.toLowerCase() ||
        s.studentPhone?.replace(/\D/g, '') === student.phone.replace(/\D/g, '')
    );
    if (matched) {
      setActiveStudent(matched);
    }
    setManagerTab('chart');
  };

  // 1-Click Direct WhatsApp
  const handleDirectWhatsApp = (student: StudentMentorshipProfile) => {
    const phone = (student.studentPhone || '').replace(/\D/g, '');
    if (!phone) {
      setActionToast({
        message: `No phone number available for ${student.studentName}.`,
        type: 'error',
      });
      setTimeout(() => setActionToast(null), 4000);
      return;
    }
    const cleanPhone = phone.startsWith('91') && phone.length === 12 ? phone : `91${phone.slice(-10)}`;
    let message = '';
    if (student.isApproved) {
      message = `Hello ${student.studentName}! Your HK Code of Rankers registration has been approved by Harkiran Kaur! 🎉\n\nYou can now log in to your Student Portal at HK Code of Rankers using your registered email address: ${student.studentEmail || 'your email'}.\n\nIf you haven't set your password yet, use the 'Create / Reset Password' option with this same email.\n\nAll the best for your ${student.program} (${student.group}) journey!`;
    } else {
      message = `Hello ${student.studentName}! This is Harkiran Kaur from HK Code of Rankers regarding your ${student.program} (${student.group}) mentorship registration. We are verifying your details for student portal approval.`;
    }
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  // 1-Click Direct Email (Gmail / Mail Client)
  const handleDirectEmail = (student: StudentMentorshipProfile) => {
    if (!student.studentEmail) {
      setActionToast({
        message: `No email address recorded for ${student.studentName}.`,
        type: 'error',
      });
      setTimeout(() => setActionToast(null), 4000);
      return;
    }
    const subject = student.isApproved
      ? `Registration Approved - Student Portal Access: ${student.studentName}`
      : `HK Code of Rankers - Registration Verification for ${student.studentName}`;
    const body = student.isApproved
      ? `Hello ${student.studentName},\n\nYour registration has been approved by Harkiran Kaur!\n\nYou can now log in to the HK Code of Rankers portal with your registered email: ${student.studentEmail}.\nUse the 'Create / Reset Password' option if you need to create your password.\n\nWarm regards,\nHarkiran Kaur\nHK Code of Rankers`
      : `Hello ${student.studentName},\n\nWe are reviewing your enrollment details for ${student.program} (${student.group}).\n\nWarm regards,\nHarkiran Kaur\nHK Code of Rankers`;
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(student.studentEmail)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(gmailUrl, '_blank', 'noopener,noreferrer');
  };

  // Approve UPI & Send Official Confirmation Email + Enable Login Access
  const handleApproveAndSendEmail = async (student: StudentMentorshipProfile) => {
    const appt = getMatchedAppointment(student);
    setApprovingId(student.studentId);
    try {
      const studentEmail = (student.studentEmail || appt?.email || '').trim().toLowerCase();
      const studentPhone = (student.studentPhone || appt?.phone || '').trim();
      const programName = `${student.program} (${student.group})`;
      const orderNumber = `ORD-${Date.now().toString().slice(-6)}`;
      const utr = appt?.utr_number || (appt?.notes?.match(/\d{12}/)?.[0]) || 'VERIFIED_BY_ADMIN';
      const approvedAtTime = new Date().toISOString();

      // 1. Mark approved in mentorship service
      setStudentApprovalStatus(student.studentId, true);
      if (studentEmail) {
        setStudentApprovalStatus(studentEmail, true);
      }

      // 2. Mark approved in Auth registered users store
      if (studentEmail) {
        try {
          const rawUsers = localStorage.getItem('hk_rankers_registered_users');
          const registeredUsers: any[] = rawUsers ? JSON.parse(rawUsers) : [];
          const idx = registeredUsers.findIndex(
            (u) => u.email && u.email.trim().toLowerCase() === studentEmail
          );
          if (idx !== -1) {
            registeredUsers[idx].isApproved = true;
            registeredUsers[idx].approvalStatus = 'approved';
            registeredUsers[idx].approvedAt = approvedAtTime;
          } else {
            registeredUsers.push({
              id: student.studentId || `usr_${Date.now()}`,
              fullName: student.studentName,
              email: studentEmail,
              phone: studentPhone,
              targetExam: programName,
              password: 'student_pass',
              avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(student.studentName)}&background=C8A45D&color=000`,
              purchasedProductIds: [],
              createdAt: approvedAtTime,
              isApproved: true,
              approvalStatus: 'approved',
              approvedAt: approvedAtTime,
              role: 'student',
            });
          }
          localStorage.setItem('hk_rankers_registered_users', JSON.stringify(registeredUsers));
        } catch (err) {
          console.warn('Registered users storage update error:', err);
        }
      }

      // 3. Dispatch official Approval Email to student
      await sendStudentApprovalEmail({
        studentName: student.studentName,
        studentEmail: studentEmail || `${studentPhone}@student.hkcodeofrankers.com`,
        studentPhone,
        programName,
        approvedDate: new Date().toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        orderNumber,
      });

      // 4. Also confirm order/appointment if one matched
      if (appt) {
        const isCounsellingOrSlot =
          appt.status === 'counselling_booking' ||
          appt.program?.toLowerCase().includes('counselling') ||
          appt.program?.toLowerCase().includes('slot') ||
          appt.program?.toLowerCase().includes('guidance');

        if (isCounsellingOrSlot) {
          // Send Slot Booking Confirmation Email, NEVER Payment Confirmation
          await sendFreeSlotBookingConfirmationEmail({
            candidateName: student.studentName,
            candidateEmail: studentEmail || appt.email || '',
            candidatePhone: studentPhone,
            program: programName,
            preferredSlot: appt.attempt || 'Scheduled by Mentor',
            bookingId: appt.id,
            notes: appt.notes,
          }).catch((e) => console.warn('Slot booking confirmation notice:', e));
        } else {
          await sendStudentConfirmationEmail({
            studentEmail: studentEmail || appt.email,
            studentName: student.studentName,
            programName,
            amount: appt?.amount || 2999,
            utrNumber: utr,
            orderNumber,
            studentPhone,
          }).catch((e) => console.warn('Payment confirmation notice:', e));
        }

        await updateAppointmentStatus(
          {
            id: appt.id,
            phone: appt.phone,
            created_at: appt.created_at || (appt as any).local_saved_at,
          },
          'confirmed',
          {
            email_sent_at: approvedAtTime,
          }
        );
        await loadAppointments();
      }

      // 5. Update local state
      setStudents((prev) =>
        prev.map((s) =>
          s.studentId === student.studentId
            ? {
                ...s,
                isApproved: true,
                approvalStatus: 'approved',
                approvedAt: approvedAtTime,
              }
            : s
        )
      );

      const waUrl = getWhatsAppApprovalUrl({
        studentName: student.studentName,
        studentEmail,
        studentPhone,
        programName,
      });

      setActionToast({
        message: `Approved! ${student.studentName} can now log in. Official approval email was sent to ${studentEmail}.`,
        type: 'success',
        waUrl,
      });
      setTimeout(() => setActionToast(null), 7000);
    } catch (err: any) {
      console.error('Approval/Email dispatch error:', err);
      setActionToast({
        message: `Approval note: ${err?.message || 'Updated approval.'}`,
        type: 'info',
      });
      setTimeout(() => setActionToast(null), 5000);
    } finally {
      setApprovingId(null);
    }
  };

  // Revoke Student Approval (Admin Action)
  const handleRevokeApproval = (student: StudentMentorshipProfile) => {
    setStudentApprovalStatus(student.studentId, false);
    const studentEmail = (student.studentEmail || '').trim().toLowerCase();
    if (studentEmail) {
      setStudentApprovalStatus(studentEmail, false);
      try {
        const rawUsers = localStorage.getItem('hk_rankers_registered_users');
        if (rawUsers) {
          const registeredUsers: any[] = JSON.parse(rawUsers);
          registeredUsers.forEach((u) => {
            if (u.email && u.email.trim().toLowerCase() === studentEmail) {
              u.isApproved = false;
              u.approvalStatus = 'pending';
            }
          });
          localStorage.setItem('hk_rankers_registered_users', JSON.stringify(registeredUsers));
        }
      } catch (e) {
        console.warn('Revocation error:', e);
      }
    }

    setStudents((prev) =>
      prev.map((s) =>
        s.studentId === student.studentId
          ? {
              ...s,
              isApproved: false,
              approvalStatus: 'pending',
            }
          : s
      )
    );

    setActionToast({
      message: `Login access revoked for ${student.studentName}. Account marked as Pending Approval.`,
      type: 'info',
    });
    setTimeout(() => setActionToast(null), 5000);
  };

  // Delete Student from Portal
  const confirmDeleteStudent = async () => {
    if (!studentToDelete) return;
    setIsDeletingStudent(true);
    try {
      await deleteStudentMentorshipProfile(studentToDelete.studentId);
      deleteStudentFromCentralDb(studentToDelete.studentId);
      loadCentralData();
      setStudents((prev) => prev.filter((p) => p.studentId !== studentToDelete.studentId));
      if (activeStudent?.studentId === studentToDelete.studentId) {
        setActiveStudent(null);
      }
      await loadAppointments();
      setActionToast({
        message: `Student "${studentToDelete.studentName}" was permanently deleted from the central database and portal.`,
        type: 'info',
      });
      setTimeout(() => setActionToast(null), 5000);
    } catch (err) {
      console.error('Delete error:', err);
      setActionToast({
        message: 'Could not complete student deletion.',
        type: 'error',
      });
      setTimeout(() => setActionToast(null), 4000);
    } finally {
      setIsDeletingStudent(false);
      setStudentToDelete(null);
    }
  };

  // When a student's profile is updated in MentorshipTrackerView
  const handleProfileUpdated = (updated: StudentMentorshipProfile) => {
    setActiveStudent(updated);
    setStudents((prev) => prev.map((s) => (s.studentId === updated.studentId ? updated : s)));
    saveStudentMentorshipProfile(updated);
  };

  // Reassign student program/group
  const handleReassignGroup = (
    student: StudentMentorshipProfile,
    newGroupVal: string
  ) => {
    let newProg: MentorshipProgram = student.program;
    let newLvl: MentorshipLevel = student.level;
    let newGrp: MentorshipGroup = student.group;

    if (newGroupVal === 'cseet') {
      newProg = 'CS EET';
      newLvl = 'Level 1';
      newGrp = 'General';
    } else if (newGroupVal === 'exec-g1') {
      newProg = 'CS Executive';
      newLvl = 'Level 2';
      newGrp = 'Group 1';
    } else if (newGroupVal === 'exec-g2') {
      newProg = 'CS Executive';
      newLvl = 'Level 2';
      newGrp = 'Group 2';
    } else if (newGroupVal === 'exec-both') {
      newProg = 'CS Executive';
      newLvl = 'Level 2';
      newGrp = 'Both';
    } else if (newGroupVal === 'prof-g1') {
      newProg = 'CS Professional';
      newLvl = 'Level 3';
      newGrp = 'Group 1';
    } else if (newGroupVal === 'prof-g2') {
      newProg = 'CS Professional';
      newLvl = 'Level 3';
      newGrp = 'Group 2';
    } else if (newGroupVal === 'prof-both') {
      newProg = 'CS Professional';
      newLvl = 'Level 3';
      newGrp = 'Both';
    }

    if (confirm(`Reassign ${student.studentName} to ${newProg} (${newGrp})? This will load the verified ${newProg} index.`)) {
      const updated = reassignStudentGroup(student, newProg, newLvl, newGrp);
      setStudents((prev) => prev.map((s) => (s.studentId === updated.studentId ? updated : s)));
      if (activeStudent && activeStudent.studentId === updated.studentId) {
        setActiveStudent(updated);
      }
    }
  };

  // Open Student Portal in live impersonation
  const handleLaunchImpersonation = (student: StudentMentorshipProfile) => {
    const studentKey = (student.studentEmail || student.studentPhone || student.studentId)
      .trim()
      .toLowerCase();
    setAdminViewingStudentId(studentKey);
    onNavigate('student-portal');
  };

  // Process uploaded index file (JSON or CSV)
  const handleProcessUploadedFile = (file: File) => {
    setUploadError('');
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = (e.target?.result as string) || '';
        if (file.name.endsWith('.json')) {
          const json = JSON.parse(text);
          if (Array.isArray(json)) {
            const parsedRows: TrackerRow[] = json.map((item, idx) => ({
              id: item.id || `custom_row_${idx}_${Date.now()}`,
              programGroup: item.programGroup || uploadingIndexStudent?.assignedIndexId || 'exec-g1',
              subjectCode: item.subjectCode || 'SUB',
              subjectName: item.subjectName || item.subject || 'Subject',
              chapterNo: item.chapterNo || `Chapter ${idx + 1}`,
              isChapterRed: Boolean(item.isChapterRed),
              amendment: item.amendment || 'Standard',
              isAmendmentRed: Boolean(item.isAmendmentRed),
              topic: item.topic || item.topicName || item.name || `Topic ${idx + 1}`,
              isTopicRed: Boolean(item.isTopicRed),
              lectures: item.lectures || 'Pending',
              firstDetailedReading: item.firstDetailedReading || 'Pending',
              chapterWiseTest: item.chapterWiseTest || 'Pending',
              firstMockTest: item.firstMockTest || 'Pending',
              secondMockTest: item.secondMockTest || 'Pending',
              fifthRevision: item.fifthRevision || 'Pending',
              fourthRevision: item.fourthRevision || 'Pending',
              thirdRevision: item.thirdRevision || 'Pending',
              secondRevision: item.secondRevision || 'Pending',
              firstRevision: item.firstRevision || 'Pending',
              remarks: item.remarks || '',
            }));
            setUploadedParsedRows(parsedRows);
            return;
          }
          throw new Error('JSON file must contain an array of syllabus chapter objects.');
        }

        // CSV parsing
        const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
        if (lines.length <= 1) {
          throw new Error('CSV file is empty or contains only headers.');
        }
        const parsedRows: TrackerRow[] = [];
        const startIndex =
          lines[0].toLowerCase().includes('subject') || lines[0].toLowerCase().includes('chapter')
            ? 1
            : 0;

        for (let i = startIndex; i < lines.length; i++) {
          const parts = lines[i].split(',').map((p) => p.trim().replace(/^["']|["']$/g, ''));
          if (parts.length >= 2) {
            const subjectName = parts[0] || 'Company Law & Practice';
            const chapterNo = parts[1] || `Chapter ${i}`;
            const topic = parts[2] || parts[1] || 'Chapter Overview';
            const amendment = parts[3] || 'Standard';

            parsedRows.push({
              id: `csv_row_${i}_${Date.now()}`,
              programGroup: uploadingIndexStudent?.assignedIndexId || 'exec-g1',
              subjectCode: subjectName.slice(0, 3).toUpperCase(),
              subjectName,
              chapterNo,
              isChapterRed: false,
              amendment,
              isAmendmentRed: false,
              topic,
              isTopicRed: false,
              lectures: 'Pending',
              firstDetailedReading: 'Pending',
              chapterWiseTest: 'Pending',
              firstMockTest: 'Pending',
              secondMockTest: 'Pending',
              fifthRevision: 'Pending',
              fourthRevision: 'Pending',
              thirdRevision: 'Pending',
              secondRevision: 'Pending',
              firstRevision: 'Pending',
            });
          }
        }
        if (parsedRows.length === 0) {
          throw new Error('Could not parse valid chapters. Ensure format: Subject,Chapter No,Topic,Amendment');
        }
        setUploadedParsedRows(parsedRows);
      } catch (err: any) {
        setUploadError(err.message || 'Failed to parse syllabus file.');
      }
    };
    reader.readAsText(file);
  };

  // Parse pasted syllabus text
  const handleParsePastedText = () => {
    setUploadError('');
    if (!pastedIndexText.trim()) {
      setUploadError('Please paste chapter lines or syllabus text.');
      return;
    }
    const lines = pastedIndexText.split(/\r?\n/).filter((l) => l.trim().length > 0);
    const parsedRows: TrackerRow[] = lines.map((line, idx) => {
      const pipeParts = line.split('|').map((p) => p.trim());
      let subjectName = uploadingIndexStudent?.program ? `${uploadingIndexStudent.program} Paper` : 'General Subject';
      let chapterNo = `Chapter ${idx + 1}`;
      let topic = line.trim();
      let amendment = 'Standard';

      if (pipeParts.length >= 4) {
        subjectName = pipeParts[0];
        chapterNo = pipeParts[1];
        topic = pipeParts[2];
        amendment = pipeParts[3];
      } else if (pipeParts.length === 3) {
        subjectName = pipeParts[0];
        chapterNo = pipeParts[1];
        topic = pipeParts[2];
      } else if (pipeParts.length === 2) {
        chapterNo = pipeParts[0];
        topic = pipeParts[1];
      } else if (line.includes('-')) {
        const dashParts = line.split('-');
        chapterNo = dashParts[0].trim();
        topic = dashParts.slice(1).join('-').trim();
      }

      return {
        id: `pasted_row_${idx}_${Date.now()}`,
        programGroup: uploadingIndexStudent?.assignedIndexId || 'exec-g1',
        subjectCode: 'SUB',
        subjectName,
        chapterNo,
        isChapterRed: false,
        amendment,
        isAmendmentRed: false,
        topic,
        isTopicRed: false,
        lectures: 'Pending',
        firstDetailedReading: 'Pending',
        chapterWiseTest: 'Pending',
        firstMockTest: 'Pending',
        secondMockTest: 'Pending',
        fifthRevision: 'Pending',
        fourthRevision: 'Pending',
        thirdRevision: 'Pending',
        secondRevision: 'Pending',
        firstRevision: 'Pending',
      };
    });
    setUploadedParsedRows(parsedRows);
  };

  // Load ICSI preset syllabus
  const handleLoadPresetSyllabus = (presetKey: string) => {
    setUploadError('');
    setSelectedPresetGroup(presetKey);
    let prog: MentorshipProgram = 'CS Executive';
    let grp: MentorshipGroup = 'Group 1';
    if (presetKey === 'cseet') {
      prog = 'CS EET';
      grp = 'General';
    } else if (presetKey === 'exec-g1') {
      prog = 'CS Executive';
      grp = 'Group 1';
    } else if (presetKey === 'exec-g2') {
      prog = 'CS Executive';
      grp = 'Group 2';
    } else if (presetKey === 'exec-both') {
      prog = 'CS Executive';
      grp = 'Both';
    } else if (presetKey === 'prof-g1') {
      prog = 'CS Professional';
      grp = 'Group 1';
    } else if (presetKey === 'prof-g2') {
      prog = 'CS Professional';
      grp = 'Group 2';
    } else if (presetKey === 'prof-both') {
      prog = 'CS Professional';
      grp = 'Both';
    }
    const freshRows = generateDefaultChapters(prog, grp);
    setUploadedParsedRows(freshRows);
  };

  // Apply syllabus index to student profile
  const handleApplyIndexToStudent = () => {
    if (!uploadingIndexStudent) return;
    if (!uploadedParsedRows || uploadedParsedRows.length === 0) {
      setUploadError('Please select a preset, upload a file, or paste text to generate chapters first.');
      return;
    }
    const updated = applyCustomIndexToStudent(uploadingIndexStudent, uploadedParsedRows);
    setStudents((prev) => prev.map((s) => (s.studentId === updated.studentId ? updated : s)));
    if (activeStudent && activeStudent.studentId === updated.studentId) {
      setActiveStudent(updated);
    }
    setActionToast({
      message: `Syllabus Index updated! ${uploadedParsedRows.length} chapters loaded for ${updated.studentName}. Portal updated.`,
      type: 'success',
    });
    setUploadingIndexStudent(null);
    setUploadedParsedRows(null);
    setPastedIndexText('');
    setUploadError('');
  };

  // Download Sample CSV
  const handleDownloadSampleCsv = () => {
    const sample =
      'Subject,Chapter No,Topic Name,Amendment\n' +
      'Jurisprudence Interpretation and General Laws,Chapter 1,Sources of Law,Standard\n' +
      'Jurisprudence Interpretation and General Laws,Chapter 2,Constitution of India,2024 Landmark Cases\n' +
      'Company Law & Practice,Chapter 1,Introduction to Company Law,Notification No 14\n' +
      'Company Law & Practice,Chapter 2,Share Capital and Debentures,Amended Rules\n' +
      'Setting Up of Business,Chapter 1,Choice of Business Organization,Standard\n';
    const blob = new Blob([sample], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'HK_Rankers_Syllabus_Index_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper to distinguish Self-Paced Index students from Full Mentorship students
  const isSelfPacedStudent = (s: StudentMentorshipProfile) => {
    const centralMatch = centralStudents.find(
      (cs) =>
        cs.studentId === s.studentId ||
        cs.email.toLowerCase() === (s.studentEmail || '').toLowerCase()
    );
    return Boolean(
      s.isStudyProgressIndex ||
      s.studyIndexAccess ||
      centralMatch?.studyIndexAccess ||
      centralMatch?.enrolledProductIds?.some((id) => id.includes('index') || id.includes('progress')) ||
      centralMatch?.registeredVia === 'study_index' ||
      s.assignedIndexId?.includes('index')
    );
  };

  // Two Separate Student Directories
  const mentorshipStudents = students.filter((s) => !isSelfPacedStudent(s));
  const selfPacedStudents = students.filter((s) => isSelfPacedStudent(s));

  // Current directory set based on directoryType
  const currentDirectoryPool = directoryType === 'mentorship' ? mentorshipStudents : selfPacedStudents;

  // Filter students within the active directory
  const filteredStudents = currentDirectoryPool.filter((s) => {
    const matchesSearch =
      !searchQuery ||
      s.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.studentEmail && s.studentEmail.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.studentPhone && s.studentPhone.includes(searchQuery)) ||
      s.studentId.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesGroup =
      groupFilter === 'all' ||
      (groupFilter === 'cseet' && s.program === 'CS EET') ||
      (groupFilter === 'exec-g1' && s.program === 'CS Executive' && s.group === 'Group 1') ||
      (groupFilter === 'exec-g2' && s.program === 'CS Executive' && s.group === 'Group 2') ||
      (groupFilter === 'exec-both' && s.program === 'CS Executive' && s.group === 'Both') ||
      (groupFilter === 'prof-g1' && s.program === 'CS Professional' && s.group === 'Group 1') ||
      (groupFilter === 'prof-g2' && s.program === 'CS Professional' && s.group === 'Group 2') ||
      (groupFilter === 'prof-both' && s.program === 'CS Professional' && s.group === 'Both');

    const matchesApproval =
      approvalFilter === 'all' ||
      (approvalFilter === 'approved' && s.isApproved) ||
      (approvalFilter === 'pending' && !s.isApproved);

    return matchesSearch && matchesGroup && matchesApproval;
  });

  // Aggregate stats for Mentorship
  const totalMentorshipCount = mentorshipStudents.length;
  const pendingMentorshipCount = mentorshipStudents.filter((s) => !s.isApproved).length;
  const approvedMentorshipCount = mentorshipStudents.filter((s) => s.isApproved).length;
  const execG1MentorshipCount = mentorshipStudents.filter((s) => s.program === 'CS Executive' && (s.group === 'Group 1' || s.group === 'Both')).length;
  const profMentorshipCount = mentorshipStudents.filter((s) => s.program === 'CS Professional').length;

  // Aggregate stats for Self-Paced Index
  const totalSelfPacedCount = selfPacedStudents.length;
  const cseetSelfPacedCount = selfPacedStudents.filter((s) => s.program === 'CS EET').length;
  const execSelfPacedCount = selfPacedStudents.filter((s) => s.program === 'CS Executive').length;
  const profSelfPacedCount = selfPacedStudents.filter((s) => s.program === 'CS Professional').length;

  // Legacy aliases
  const totalStudents = students.length;
  const pendingCount = students.filter((s) => !s.isApproved).length;
  const approvedCount = students.filter((s) => s.isApproved).length;
  const execG1Count = execG1MentorshipCount;
  const profCount = profMentorshipCount;

  const pendingRegistrationsCount = centralStudents.filter(
    (s) => s.registrationStatus === 'pending'
  ).length;
  const pendingPaymentsCount = centralStudents.filter(
    (s) => s.purchasedCourse && s.purchasedCourse.paymentStatus === 'pending'
  ).length;
  const pendingSlotBookingsCount = slotBookings.filter(
    (b) => b.status === 'pending'
  ).length;
  const pendingFreeSlotBookingsCount = freeSlotBookings.filter(
    (b) => b.status === 'pending'
  ).length;

  return (
    <div className="space-y-6 font-poppins">
      {/* Sub-Tabs: Unified Admin Bar */}
      <div className="bg-white border-2 border-[#C8A45D]/40 p-2 rounded-2xl shadow-sm flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setManagerTab('students_list')}
            className={`py-2 px-3 rounded-xl text-xs font-montserrat font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              managerTab === 'students_list'
                ? 'gold-gradient-bg text-black shadow-sm font-bold'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>👥 Registered Students ({centralStudents.length})</span>
            {pendingPaymentsCount > 0 && (
              <span className="px-1.5 py-0.2 bg-red-600 text-white text-[10px] font-bold rounded-full animate-pulse">
                {pendingPaymentsCount} Pending
              </span>
            )}
          </button>

          <button
            onClick={() => setManagerTab('payments')}
            className={`py-2 px-3 rounded-xl text-xs font-montserrat font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              managerTab === 'payments'
                ? 'bg-[#1C1917] text-[#FFE3A0] border border-[#C8A45D] shadow-sm'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5 text-[#C8A45D]" />
            <span>💳 Payment Approvals</span>
            {pendingPaymentsCount > 0 && (
              <span className="px-1.5 py-0.2 bg-emerald-500 text-white text-[10px] font-bold rounded-full animate-pulse">
                {pendingPaymentsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setManagerTab('registrations')}
            className={`py-2 px-3 rounded-xl text-xs font-montserrat font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              managerTab === 'registrations'
                ? 'bg-[#1C1917] text-[#FFE3A0] border border-[#C8A45D] shadow-sm'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span>📝 Registration Approvals</span>
            {pendingRegistrationsCount > 0 && (
              <span className="px-1.5 py-0.2 bg-amber-500 text-black text-[10px] font-bold rounded-full animate-pulse">
                {pendingRegistrationsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setManagerTab('directory')}
            className={`py-2 px-3 rounded-xl text-xs font-montserrat font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              managerTab === 'directory'
                ? 'gold-gradient-bg text-black shadow-sm font-bold'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>👥 Student Directory ({centralStudents.length})</span>
          </button>

          <button
            onClick={() => setManagerTab('chart')}
            className={`py-2 px-3 rounded-xl text-xs font-montserrat font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              managerTab === 'chart'
                ? 'bg-[#1C1917] text-[#FFE3A0] border border-[#C8A45D] shadow-sm'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5 text-[#C8A45D]" />
            <span>📊 Mentorship Chart</span>
          </button>

          <button
            onClick={() => setManagerTab('syllabus_index')}
            className={`py-2 px-3 rounded-xl text-xs font-montserrat font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              managerTab === 'syllabus_index'
                ? 'bg-[#1C1917] text-[#FFE3A0] border border-[#C8A45D] shadow-sm'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-[#C8A45D]" />
            <span>📚 5 ICSI Syllabus Indexes</span>
          </button>

          <button
            onClick={() => setManagerTab('discount_codes')}
            className={`py-2 px-3 rounded-xl text-xs font-montserrat font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              managerTab === 'discount_codes'
                ? 'bg-[#1C1917] text-[#FFE3A0] border border-[#C8A45D] shadow-sm'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Tag className="w-3.5 h-3.5 text-[#C8A45D]" />
            <span>🏷️ Promo Codes</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const target = activeStudent || students[0];
              if (target) {
                handleLaunchImpersonation(target);
              } else {
                onNavigate('student-portal');
              }
            }}
            className="px-3.5 py-2 gold-gradient-bg hover:brightness-105 text-black rounded-xl text-xs font-montserrat font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            title="Open Student Portal live view as currently selected student"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>🎓 Launch Student Portal</span>
          </button>
        </div>
      </div>

      {/* TAB 0: REGISTERED STUDENTS LIST */}
      {managerTab === 'students_list' && (
        <RegisteredStudentsListTab
          students={centralStudents}
          onRefresh={loadCentralData}
          onOpenMentorshipChart={handleOpenMentorshipChartForCentralStudent}
        />
      )}

      {/* TAB: FREE SESSION BOOKINGS */}
      {managerTab === 'free_slot_bookings' && (
        <FreeSlotBookingsTab bookings={freeSlotBookings} onRefresh={loadCentralData} />
      )}

      {/* TAB 1: REGISTRATION APPROVALS */}
      {managerTab === 'registrations' && (
        <RegistrationApprovalsTab
          students={centralStudents}
          approvingId={approvingId}
          onApproveRegistration={handleApproveRegistration}
          onRejectRegistration={handleRejectRegistration}
          onRefresh={loadCentralData}
        />
      )}

      {/* TAB 2: PAYMENT APPROVALS */}
      {managerTab === 'payments' && (
        <PaymentApprovalsTab
          students={centralStudents}
          approvingId={approvingId}
          onApprovePayment={handleApprovePayment}
          onRejectPayment={handleRejectPayment}
          onOpenMentorshipChart={handleOpenMentorshipChartForCentralStudent}
          onRefresh={loadCentralData}
        />
      )}

      {/* TAB 3: SYLLABUS INDEXES */}
      {managerTab === 'syllabus_index' && (
        <SyllabusIndexTab />
      )}

      {/* TAB 4: DISCOUNT CODES */}
      {managerTab === 'discount_codes' && (
        <DiscountCodesTab discountCodes={discountCodes} />
      )}

      {/* TAB 5: LIVE MENTORSHIP CHART & TRACKER */}
      {managerTab === 'chart' && (
        <div className="space-y-6">
          {/* Top Student Switcher Bar */}
          <div className="bg-white border-2 border-[#C8A45D]/40 rounded-2xl p-3.5 sm:p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-montserrat font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-4 h-4 text-[#C8A45D]" />
                <span>Select Student:</span>
              </span>

              <select
                value={activeStudent?.studentId || (students[0]?.studentId ?? '')}
                onChange={(e) => {
                  const s = students.find((x) => x.studentId === e.target.value);
                  if (s) setActiveStudent(s);
                }}
                className="px-3 py-2 bg-[#FAF5E9] border border-[#C8A45D]/60 rounded-xl text-xs font-montserrat font-bold text-[#8A651E] outline-none cursor-pointer min-w-[260px] shadow-xs"
              >
                {students.map((s) => (
                  <option key={s.studentId} value={s.studentId}>
                    {s.studentName} — {s.program} ({s.group}) [{s.isApproved ? 'Approved' : 'Pending'}]
                  </option>
                ))}
              </select>

              {activeStudent && (
                <span className="text-xs text-gray-500 font-medium">
                  Attempt: <strong className="text-gray-900">{activeStudent.targetAttempt}</strong>
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {activeStudent && (
                <button
                  onClick={() => handleLaunchImpersonation(activeStudent)}
                  className="px-3.5 py-2 bg-gradient-to-r from-[#1C1917] to-[#2E2419] hover:bg-black text-[#FFE3A0] border border-[#C8A45D]/60 text-xs font-montserrat font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                  title="Open live student portal with this student's view"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Access Student Portal</span>
                </button>
              )}

              <button
                onClick={() => setManagerTab('directory')}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>All Students Directory</span>
              </button>
            </div>
          </div>

          {/* Render the full interactive Mentorship Tracker View with Admin rights */}
          {activeStudent || students[0] ? (
            <MentorshipTrackerView
              profile={activeStudent || students[0]}
              isAdmin={true}
              onProfileUpdated={handleProfileUpdated}
              onExitAdminView={() => setManagerTab('directory')}
            />
          ) : (
            <div className="p-8 bg-white border border-gray-200 rounded-2xl text-center space-y-3">
              <p className="text-gray-600 text-sm">No student enrolled yet.</p>
              <button
                onClick={() => setManagerTab('directory')}
                className="px-4 py-2 gold-gradient-bg text-black rounded-xl font-bold text-xs"
              >
                Open Student Directory
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 6: STUDENT ACCOUNTS & DIRECTORY */}
      {managerTab === 'directory' && (
        <div className="space-y-6">
          {/* Sub-Directory Selector Tabs: Mentorship vs Self-Paced Index */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2 bg-stone-100 rounded-2xl border border-stone-200">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setDirectoryType('mentorship')}
                className={`px-4 py-2.5 rounded-xl text-xs font-montserrat font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  directoryType === 'mentorship'
                    ? 'bg-[#1C1917] text-[#FFE3A0] shadow-md border border-[#C8A45D]'
                    : 'text-gray-700 hover:text-black hover:bg-white/80'
                }`}
              >
                <Users className="w-4 h-4 text-[#C8A45D]" />
                <span>👥 Mentorship Directory</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#C8A45D]/20 text-[#FFE3A0]">
                  {totalMentorshipCount}
                </span>
              </button>

              <button
                onClick={() => setDirectoryType('self_paced')}
                className={`px-4 py-2.5 rounded-xl text-xs font-montserrat font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  directoryType === 'self_paced'
                    ? 'bg-[#1C1917] text-[#FFE3A0] shadow-md border border-[#C8A45D]'
                    : 'text-gray-700 hover:text-black hover:bg-white/80'
                }`}
              >
                <BookOpen className="w-4 h-4 text-[#C8A45D]" />
                <span>📑 Self-Paced Index Directory</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#C8A45D]/20 text-[#FFE3A0]">
                  {totalSelfPacedCount}
                </span>
              </button>
            </div>

            {directoryType === 'self_paced' && (
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-gray-500 font-medium hidden md:inline">
                  Self-study index with student-editable tracker:
                </span>
                <button
                  onClick={() => {
                    const newId = `std-self-${Date.now()}`;
                    const demoStd = getOrCreateStudentMentorship({
                      id: newId,
                      fullName: 'Demo Self-Paced Student',
                      email: `student.${Date.now().toString().slice(-4)}@gmail.com`,
                      phone: '9876543210',
                      targetExam: 'CS Executive Group 1',
                    });
                    demoStd.isStudyProgressIndex = true;
                    demoStd.studyIndexAccess = true;
                    demoStd.isApproved = true;
                    saveStudentMentorshipProfile(demoStd);
                    loadStudents();
                    loadCentralData();
                    setActionToast({
                      message: 'Created sample Self-Paced Student with 100% Student-Editable Index!',
                      type: 'success',
                    });
                    setTimeout(() => setActionToast(null), 4000);
                  }}
                  className="px-3 py-1.5 bg-white hover:bg-amber-50 border border-[#C8A45D]/60 text-[#8A651E] text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                  title="Create a sample enrolled Self-Paced Index student to test student-editable tracker"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Demo Self-Paced Student</span>
                </button>
              </div>
            )}
          </div>

          {/* Top Quick Metrics */}
          {directoryType === 'mentorship' ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white border border-[#C8A45D]/30 p-4 rounded-2xl shadow-sm">
                <div className="text-[11px] font-montserrat font-bold text-gray-500 uppercase tracking-wider">
                  Total Mentorship
                </div>
                <div className="text-2xl font-cinzel font-bold text-[#1C1917] pt-1">
                  {totalMentorshipCount} Students
                </div>
                <div className="text-[10px] text-gray-500 pt-0.5">
                  {approvedMentorshipCount} approved to log in
                </div>
              </div>

              <div
                onClick={() => setApprovalFilter(approvalFilter === 'pending' ? 'all' : 'pending')}
                className={`border p-4 rounded-2xl shadow-sm cursor-pointer transition-all ${
                  pendingMentorshipCount > 0
                    ? 'bg-amber-500/10 border-amber-500/50 hover:bg-amber-500/20'
                    : 'bg-white border-gray-200'
                }`}
              >
                <div className="text-[11px] font-montserrat font-bold text-amber-700 uppercase tracking-wider flex items-center justify-between">
                  <span>Pending Approvals</span>
                  {pendingMentorshipCount > 0 && <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />}
                </div>
                <div className="text-2xl font-cinzel font-bold text-amber-700 pt-1">
                  {pendingMentorshipCount}
                </div>
                <div className="text-[10px] text-amber-800/80 pt-0.5 font-medium">
                  {pendingMentorshipCount > 0 ? 'Click to filter & approve' : 'All accounts verified'}
                </div>
              </div>

              <div className="bg-white border border-[#C8A45D]/30 p-4 rounded-2xl shadow-sm">
                <div className="text-[11px] font-montserrat font-bold text-[#8A651E] uppercase tracking-wider">
                  Executive Mentorship
                </div>
                <div className="text-2xl font-cinzel font-bold text-[#8A651E] pt-1">
                  {execG1MentorshipCount}
                </div>
                <div className="text-[10px] text-gray-500 pt-0.5">
                  Executive G1 & G2 tracks
                </div>
              </div>

              <div className="bg-white border border-[#C8A45D]/30 p-4 rounded-2xl shadow-sm">
                <div className="text-[11px] font-montserrat font-bold text-emerald-800 uppercase tracking-wider">
                  Professional Mentorship
                </div>
                <div className="text-2xl font-cinzel font-bold text-emerald-800 pt-1">
                  {profMentorshipCount}
                </div>
                <div className="text-[10px] text-gray-500 pt-0.5">
                  Prof Group 1 & 2 tracks
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white border border-[#C8A45D]/30 p-4 rounded-2xl shadow-sm">
                <div className="text-[11px] font-montserrat font-bold text-gray-500 uppercase tracking-wider">
                  Total Self-Paced Index
                </div>
                <div className="text-2xl font-cinzel font-bold text-[#1C1917] pt-1">
                  {totalSelfPacedCount} Learners
                </div>
                <div className="text-[10px] text-gray-500 pt-0.5">
                  Student-Editable Study Trackers
                </div>
              </div>

              <div className="bg-white border border-[#C8A45D]/30 p-4 rounded-2xl shadow-sm">
                <div className="text-[11px] font-montserrat font-bold text-[#8A651E] uppercase tracking-wider">
                  CSEET Index (₹699)
                </div>
                <div className="text-2xl font-cinzel font-bold text-[#8A651E] pt-1">
                  {cseetSelfPacedCount}
                </div>
                <div className="text-[10px] text-gray-500 pt-0.5">
                  Level 1 syllabus tracker
                </div>
              </div>

              <div className="bg-white border border-[#C8A45D]/30 p-4 rounded-2xl shadow-sm">
                <div className="text-[11px] font-montserrat font-bold text-amber-700 uppercase tracking-wider">
                  Executive Index (₹899)
                </div>
                <div className="text-2xl font-cinzel font-bold text-amber-700 pt-1">
                  {execSelfPacedCount}
                </div>
                <div className="text-[10px] text-gray-500 pt-0.5">
                  Level 2 syllabus tracker
                </div>
              </div>

              <div className="bg-white border border-[#C8A45D]/30 p-4 rounded-2xl shadow-sm">
                <div className="text-[11px] font-montserrat font-bold text-emerald-800 uppercase tracking-wider">
                  Professional Index (₹999)
                </div>
                <div className="text-2xl font-cinzel font-bold text-emerald-800 pt-1">
                  {profSelfPacedCount}
                </div>
                <div className="text-[10px] text-gray-500 pt-0.5">
                  Level 3 syllabus tracker
                </div>
              </div>
            </div>
          )}

          {/* Search, Filter & Action Bar */}
          <div className="bg-white border border-[#C8A45D]/30 p-4 sm:p-5 rounded-2xl shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search student by name, phone, email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#C8A45D]"
                />
              </div>

              {/* Filter and Enroll */}
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Approval Filter */}
                <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-xl text-xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-gray-500" />
                  <select
                    value={approvalFilter}
                    onChange={(e) => setApprovalFilter(e.target.value as any)}
                    className="bg-transparent text-xs font-semibold text-gray-700 outline-none cursor-pointer"
                  >
                    <option value="all">All Approval States</option>
                    <option value="pending">⏳ Pending Approval Only ({pendingCount})</option>
                    <option value="approved">✓ Approved Accounts ({approvedCount})</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-xl text-xs">
                  <Filter className="w-3.5 h-3.5 text-gray-500" />
                  <select
                    value={groupFilter}
                    onChange={(e) => setGroupFilter(e.target.value)}
                    className="bg-transparent text-xs font-semibold text-gray-700 outline-none cursor-pointer"
                  >
                    <option value="all">All Programs & Groups</option>
                    <option value="cseet">Level 1 — CS EET</option>
                    <option value="exec-g1">Level 2 — CS Executive Group 1</option>
                    <option value="exec-g2">Level 2 — CS Executive Group 2</option>
                    <option value="exec-both">Level 2 — CS Executive Both Groups</option>
                    <option value="prof-g1">Level 3 — CS Professional Group 1</option>
                    <option value="prof-g2">Level 3 — CS Professional Group 2</option>
                    <option value="prof-both">Level 3 — CS Professional Both Groups</option>
                  </select>
                </div>

                <button
                  onClick={loadStudents}
                  className="p-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-700 transition-colors cursor-pointer"
                  title="Refresh list"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>

                <div
                  className="px-3 py-2 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-800 text-xs font-montserrat font-bold flex items-center gap-1.5"
                  title="Students are enrolled automatically upon payment verification or portal registration"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="hidden sm:inline">Automatic Enrollment</span>
                  <span className="text-[10px] bg-emerald-200 text-emerald-900 px-1.5 py-0.5 rounded-full font-bold">Active</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Feedback Toast */}
          {actionToast && (
            <div
              className={`p-3.5 rounded-2xl text-xs font-bold flex flex-wrap items-center justify-between gap-3 shadow-md border ${
                actionToast.type === 'success'
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                  : actionToast.type === 'error'
                  ? 'bg-rose-50 text-rose-900 border-rose-300'
                  : 'bg-amber-50 text-amber-900 border-amber-300'
              }`}
            >
              <div className="flex items-center gap-2">
                {actionToast.type === 'success' ? (
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : actionToast.type === 'error' ? (
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                ) : (
                  <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                )}
                <span>{actionToast.message}</span>
              </div>

              {actionToast.waUrl && (
                <button
                  onClick={() => window.open(actionToast.waUrl, '_blank', 'noopener,noreferrer')}
                  className="px-3 py-1.5 bg-[#25D366] hover:bg-[#20ba59] text-white rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ml-auto"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Notify via WhatsApp (1-Click)</span>
                </button>
              )}
            </div>
          )}

          {/* Students Access Control Table */}
          <div className="bg-white border border-[#C8A45D]/30 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#1C1917] text-white font-montserrat font-bold text-[11px] uppercase tracking-wider">
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Contact</th>
                    <th className="py-3 px-4">Program & Level</th>
                    <th className="py-3 px-4">Enrolled Group & Index</th>
                    <th className="py-3 px-4 text-center">Reading Progress</th>
                    <th className="py-3 px-4">Approval & Access Status</th>
                    <th className="py-3 px-4 text-right">Master Admin Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-gray-500 text-xs">
                        No students match the search/filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((s) => {
                      const completedCount = s.trackerRows.filter(
                        (r) => r.firstDetailedReading === 'Completed'
                      ).length;
                      const redCount = s.trackerRows.filter(
                        (r) => r.isChapterRed || r.isTopicRed
                      ).length;

                      // Map current group to key
                      let currentKey = 'exec-g1';
                      if (s.program === 'CS EET') currentKey = 'cseet';
                      else if (s.program === 'CS Executive') {
                        currentKey = s.group === 'Group 2' ? 'exec-g2' : s.group === 'Both' ? 'exec-both' : 'exec-g1';
                      } else if (s.program === 'CS Professional') {
                        currentKey = s.group === 'Group 2' ? 'prof-g2' : s.group === 'Both' ? 'prof-both' : 'prof-g1';
                      }

                      // Find matching payment / appointment record
                      const appt = getMatchedAppointment(s);
                      const isConfirmed = appt?.status === 'confirmed' || !!appt?.email_sent_at;
                      const isPendingUpi = appt && appt.status !== 'confirmed';
                      const utrDisplay = appt?.utr_number || (appt?.notes?.match(/\d{12}/)?.[0]);

                      return (
                        <tr key={s.studentId} className={`transition-colors ${!s.isApproved ? 'bg-amber-50/40 hover:bg-amber-50/70' : 'hover:bg-[#FAF8F5]'}`}>
                          {/* Student Name */}
                          <td className="py-3.5 px-4 font-semibold text-gray-900">
                            <div className="flex items-center gap-2.5">
                              <div className={`w-8 h-8 rounded-lg border font-bold flex items-center justify-center font-cinzel ${
                                s.isApproved
                                  ? 'bg-amber-500/15 border-[#C8A45D]/40 text-[#8A651E]'
                                  : 'bg-amber-100 border-amber-400 text-amber-900'
                              }`}>
                                {s.studentName.charAt(0)}
                              </div>
                              <div>
                                <div className="font-bold flex items-center gap-1.5">
                                  <span>{s.studentName}</span>
                                </div>
                                <div className="flex items-center gap-1 mt-0.5">
                                  {s.isApproved ? (
                                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                      <Check className="w-2.5 h-2.5 text-emerald-600" />
                                      Approved
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-200/80 text-amber-950 border border-amber-400 animate-pulse">
                                      <Clock className="w-2.5 h-2.5 text-amber-700" />
                                      Pending Approval
                                    </span>
                                  )}
                                  <span className="text-[10px] text-gray-400 font-mono">
                                    ID: {s.studentId.slice(-6)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Contact */}
                          <td className="py-3.5 px-4 text-gray-600">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1">
                                <Mail className="w-3 h-3 text-gray-400" />
                                <span className="font-mono text-[11px]">{s.studentEmail || '—'}</span>
                              </div>
                              <div className="flex items-center gap-1 text-[11px] text-gray-500">
                                <Phone className="w-3 h-3 text-gray-400" />
                                <span>{s.studentPhone || '—'}</span>
                              </div>
                            </div>
                          </td>

                          {/* Program & Level */}
                          <td className="py-3.5 px-4">
                            <span className="inline-block px-2 py-0.5 bg-[#1C1917] text-[#FFE3A0] text-[10px] font-bold rounded-lg font-cinzel">
                              {s.program}
                            </span>
                            <div className="text-[10px] text-gray-500 pt-0.5 font-medium">
                              {s.level}
                            </div>
                          </td>

                          {/* Group & Quick Reassign */}
                          <td className="py-3.5 px-4">
                            <select
                              value={currentKey}
                              onChange={(e) => handleReassignGroup(s, e.target.value)}
                              className="text-xs bg-gray-50 border border-gray-300 rounded-lg p-1.5 focus:border-[#C8A45D] font-semibold text-gray-800 cursor-pointer"
                              title="Admin: Change student enrolled group"
                            >
                              <option value="cseet">CS EET (Single)</option>
                              <option value="exec-g1">Executive Group 1</option>
                              <option value="exec-g2">Executive Group 2</option>
                              <option value="exec-both">Executive Both Groups</option>
                              <option value="prof-g1">Professional Group 1</option>
                              <option value="prof-g2">Professional Group 2</option>
                              <option value="prof-both">Professional Both Groups</option>
                            </select>
                          </td>

                          {/* Reading Progress */}
                          <td className="py-3.5 px-4 text-center">
                            <span className="font-bold text-emerald-700">
                              {completedCount} / {s.trackerRows.length}
                            </span>
                            <div className="w-20 bg-gray-100 h-1.5 rounded-full mx-auto mt-1 overflow-hidden">
                              <div
                                className="bg-emerald-600 h-full rounded-full"
                                style={{
                                  width: `${
                                    s.trackerRows.length > 0
                                      ? (completedCount / s.trackerRows.length) * 100
                                      : 0
                                  }%`,
                                }}
                              />
                            </div>
                            {redCount > 0 && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.2 bg-rose-50 text-rose-700 border border-rose-200 rounded text-[9px] font-bold mt-1">
                                <Flame className="w-2.5 h-2.5 text-rose-600" />
                                {redCount} Red
                              </span>
                            )}
                          </td>

                          {/* Approval & Access Status */}
                          <td className="py-3.5 px-4">
                            {s.isApproved ? (
                              <div className="space-y-1.5">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 border border-emerald-300 text-emerald-900 text-[10px] font-bold">
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  <span>Login Unlocked (Approved)</span>
                                </span>

                                {utrDisplay && (
                                  <div className="text-[10px] font-mono text-gray-500 truncate max-w-[120px]">
                                    UTR: {utrDisplay}
                                  </div>
                                )}

                                <div className="flex items-center gap-2 pt-0.5">
                                  <button
                                    onClick={() => handleApproveAndSendEmail(s)}
                                    disabled={approvingId === s.studentId}
                                    className="text-[10px] text-[#8A651E] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                                    title="Resend official registration approval email"
                                  >
                                    {approvingId === s.studentId ? (
                                      <Loader2 className="w-2.5 h-2.5 animate-spin" />
                                    ) : (
                                      <Mail className="w-2.5 h-2.5" />
                                    )}
                                    <span>Resend Approval Email</span>
                                  </button>

                                  <button
                                    onClick={() => handleRevokeApproval(s)}
                                    className="text-[10px] text-gray-400 hover:text-rose-600 hover:underline cursor-pointer"
                                    title="Temporarily revoke login access"
                                  >
                                    Revoke
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-1.5">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 border border-amber-300 text-amber-950 text-[10px] font-bold">
                                  <Clock className="w-3 h-3 text-amber-600 animate-pulse" />
                                  <span>Login Blocked (Pending)</span>
                                </span>

                                {utrDisplay && (
                                  <div className="text-[10px] font-mono font-bold text-gray-700">
                                    UTR: {utrDisplay}
                                  </div>
                                )}

                                <button
                                  onClick={() => handleApproveAndSendEmail(s)}
                                  disabled={approvingId === s.studentId}
                                  className="w-full px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-lg shadow-sm flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                                  title="Approve student registration, enable portal login, and dispatch official approval email"
                                >
                                  {approvingId === s.studentId ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                  )}
                                  <span>Approve & Unlock Login</span>
                                </button>
                              </div>
                            )}
                          </td>

                          {/* Master Admin Actions: WhatsApp, Email, Open Portal, Delete */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5 flex-wrap">
                              {/* Dedicated Manage Student button */}
                              <button
                                onClick={() => {
                                  const match = centralStudents.find(
                                    (cs) =>
                                      cs.studentId === s.studentId ||
                                      cs.email.toLowerCase() === (s.studentEmail || '').toLowerCase()
                                  );
                                  if (match) {
                                    setManagingStudent(match);
                                  } else {
                                    alert('Student central record not found.');
                                  }
                                }}
                                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#C8A45D]/20 to-[#FFE3A0]/20 hover:from-[#C8A45D]/40 hover:to-[#FFE3A0]/40 border border-[#C8A45D] text-[#8A651E] font-montserrat font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                                title={`Open Manage Student Panel for ${s.studentName}`}
                              >
                                <SlidersHorizontal className="w-3.5 h-3.5 text-[#8A651E]" />
                                <span>Manage Student</span>
                              </button>

                              {/* Direct WhatsApp button */}
                              <button
                                onClick={() => handleDirectWhatsApp(s)}
                                className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                                title={`Chat directly with ${s.studentName} on WhatsApp`}
                              >
                                <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                                <span>WhatsApp</span>
                              </button>

                              {/* Direct Email button */}
                              <button
                                onClick={() => handleDirectEmail(s)}
                                className="px-2.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-300 text-blue-800 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                                title={`Compose direct email to ${s.studentName}`}
                              >
                                <Mail className="w-3.5 h-3.5 text-blue-600" />
                                <span>Email</span>
                              </button>

                              {/* Upload Index / Edit Chapters */}
                              <button
                                onClick={() => {
                                  setUploadingIndexStudent(s);
                                  setUploadedParsedRows(s.trackerRows || null);
                                  setSelectedPresetGroup(s.assignedIndexId || 'exec-g1');
                                  setUploadError('');
                                }}
                                className="px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-[#C8A45D]/50 text-[#8A651E] font-bold text-xs flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                                title={`Upload custom syllabus index or edit chapters for ${s.studentName}`}
                              >
                                <Upload className="w-3.5 h-3.5 text-[#C8A45D]" />
                                <span>Upload Index</span>
                              </button>

                              {/* Open Mentorship Chart in Admin */}
                              <button
                                onClick={() => {
                                  setActiveStudent(s);
                                  setManagerTab('chart');
                                }}
                                className="px-3 py-1.5 bg-gradient-to-r from-[#1C1917] to-[#2E2419] hover:bg-black text-[#FFE3A0] border border-[#C8A45D]/60 font-montserrat font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                                title="Open this student's mentorship tracker and syllabus chart in Admin View"
                              >
                                <Bookmark className="w-3.5 h-3.5 text-[#C8A45D]" />
                                <span>Mentorship Chart</span>
                              </button>

                              {/* Open Student Portal */}
                              <button
                                onClick={() => handleLaunchImpersonation(s)}
                                className="px-3 py-1.5 bg-gradient-to-r from-[#FFE3A0] via-[#C8A45D] to-[#DFB96E] hover:brightness-105 text-black font-montserrat font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                                title="Launch the live student portal as this student"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span>Student Portal</span>
                              </button>

                              {/* Delete Student From Portal */}
                              <button
                                onClick={() => setStudentToDelete(s)}
                                className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-700 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                                title={`Permanently delete ${s.studentName} from the portal`}
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                                <span>Delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Delete Student Confirmation Modal */}
          {studentToDelete && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
              <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-rose-200 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center gap-3 text-rose-600 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center border border-rose-200 shrink-0">
                    <AlertTriangle className="w-6 h-6 text-rose-600" />
                  </div>
                  <div>
                    <h3 className="font-montserrat font-bold text-base text-gray-900">
                      Delete Student from Portal?
                    </h3>
                    <p className="text-xs text-gray-500">
                      This action permanently removes the student from the portal.
                    </p>
                  </div>
                </div>

                <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-4 mb-5 text-xs text-gray-700 space-y-1.5">
                  <div>
                    <strong className="text-gray-900">Student Name:</strong> {studentToDelete.studentName}
                  </div>
                  <div>
                    <strong className="text-gray-900">Email Address:</strong> {studentToDelete.studentEmail || 'N/A'}
                  </div>
                  <div>
                    <strong className="text-gray-900">WhatsApp Mobile:</strong> {studentToDelete.studentPhone || 'N/A'}
                  </div>
                  <div>
                    <strong className="text-gray-900">Program & Group:</strong> {studentToDelete.program} ({studentToDelete.group})
                  </div>
                  <p className="pt-2 text-rose-700 font-semibold border-t border-rose-200/60 mt-2">
                    Their syllabus study progress, red marked chapters, and portal profile will be permanently deleted.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2.5">
                  <button
                    onClick={() => setStudentToDelete(null)}
                    disabled={isDeletingStudent}
                    className="px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-100 text-xs font-bold font-montserrat cursor-pointer transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDeleteStudent}
                    disabled={isDeletingStudent}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white text-xs font-bold font-montserrat shadow-md flex items-center gap-2 cursor-pointer transition-all"
                  >
                    {isDeletingStudent ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Deleting Student...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Student Permanently</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL: UPLOAD & CUSTOMIZE SYLLABUS INDEX (ADMIN ONLY) */}
      {uploadingIndexStudent && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#C8A45D] rounded-3xl p-6 sm:p-8 max-w-2xl w-full space-y-5 shadow-2xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b border-gray-100 pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 bg-amber-100 text-[#8A651E] font-bold text-[10px] rounded-full uppercase tracking-wider">
                    Admin Index Manager
                  </span>
                  <span className="text-xs text-gray-500 font-mono">
                    ID: {uploadingIndexStudent.studentId}
                  </span>
                </div>
                <h3 className="font-cinzel text-lg font-bold text-[#1C1917]">
                  Upload & Manage Syllabus Index for {uploadingIndexStudent.studentName}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Students have view-only access in their portal. Any index updates or chapter edits made here publish directly to the student portal immediately.
                </p>
              </div>
              <button
                onClick={() => {
                  setUploadingIndexStudent(null);
                  setUploadedParsedRows(null);
                  setUploadError('');
                }}
                className="text-gray-400 hover:text-gray-700 p-1.5 rounded-xl hover:bg-gray-100 text-lg leading-none cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-2 border-b border-gray-200 pb-2 text-xs font-montserrat font-bold">
              <button
                onClick={() => setIndexUploadTab('preset')}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  indexUploadTab === 'preset'
                    ? 'bg-[#1C1917] text-[#FFE3A0] shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                1. Official ICSI Presets
              </button>
              <button
                onClick={() => setIndexUploadTab('file')}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  indexUploadTab === 'file'
                    ? 'bg-[#1C1917] text-[#FFE3A0] shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                2. Upload File (CSV / JSON)
              </button>
              <button
                onClick={() => setIndexUploadTab('text')}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  indexUploadTab === 'text'
                    ? 'bg-[#1C1917] text-[#FFE3A0] shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                3. Paste Chapter Lines
              </button>
            </div>

            {/* Error Message */}
            {uploadError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            {/* Tab 1: Official Preset */}
            {indexUploadTab === 'preset' && (
              <div className="space-y-3 bg-[#FAF7F2] p-4 rounded-2xl border border-[#EADBCE]">
                <p className="text-xs text-gray-700 font-semibold">
                  Load the ICSI standard syllabus chapter index into this student's tracker:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <button
                    onClick={() => handleLoadPresetSyllabus('exec-g1')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedPresetGroup === 'exec-g1'
                        ? 'border-[#C8A45D] bg-[#FFE3A0]/20 font-bold text-black shadow-xs'
                        : 'border-gray-200 bg-white hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    <div className="font-montserrat font-bold">CS Executive Group 1</div>
                    <div className="text-[11px] text-gray-500 font-normal mt-0.5">
                      JIGL, Company Law, SBEC (4 Papers)
                    </div>
                  </button>

                  <button
                    onClick={() => handleLoadPresetSyllabus('exec-g2')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedPresetGroup === 'exec-g2'
                        ? 'border-[#C8A45D] bg-[#FFE3A0]/20 font-bold text-black shadow-xs'
                        : 'border-gray-200 bg-white hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    <div className="font-montserrat font-bold">CS Executive Group 2</div>
                    <div className="text-[11px] text-gray-500 font-normal mt-0.5">
                      CMSL, ECIPL, Tax Laws (3 Papers)
                    </div>
                  </button>

                  <button
                    onClick={() => handleLoadPresetSyllabus('exec-both')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedPresetGroup === 'exec-both'
                        ? 'border-[#C8A45D] bg-[#FFE3A0]/20 font-bold text-black shadow-xs'
                        : 'border-gray-200 bg-white hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    <div className="font-montserrat font-bold">CS Executive Both Groups</div>
                    <div className="text-[11px] text-gray-500 font-normal mt-0.5">
                      All 7 Papers complete syllabus
                    </div>
                  </button>

                  <button
                    onClick={() => handleLoadPresetSyllabus('cseet')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedPresetGroup === 'cseet'
                        ? 'border-[#C8A45D] bg-[#FFE3A0]/20 font-bold text-black shadow-xs'
                        : 'border-gray-200 bg-white hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    <div className="font-montserrat font-bold">CS EET (Level 1)</div>
                    <div className="text-[11px] text-gray-500 font-normal mt-0.5">
                      Business Comm, Legal Aptitude, Economics
                    </div>
                  </button>

                  <button
                    onClick={() => handleLoadPresetSyllabus('prof-g1')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedPresetGroup === 'prof-g1'
                        ? 'border-[#C8A45D] bg-[#FFE3A0]/20 font-bold text-black shadow-xs'
                        : 'border-gray-200 bg-white hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    <div className="font-montserrat font-bold">CS Professional Group 1</div>
                    <div className="text-[11px] text-gray-500 font-normal mt-0.5">
                      ESG, Drafting & Pleadings, Compliance
                    </div>
                  </button>

                  <button
                    onClick={() => handleLoadPresetSyllabus('prof-both')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedPresetGroup === 'prof-both'
                        ? 'border-[#C8A45D] bg-[#FFE3A0]/20 font-bold text-black shadow-xs'
                        : 'border-gray-200 bg-white hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    <div className="font-montserrat font-bold">CS Professional Both Groups</div>
                    <div className="text-[11px] text-gray-500 font-normal mt-0.5">
                      All Level 3 Papers complete syllabus
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Tab 2: Upload File (CSV / JSON) */}
            {indexUploadTab === 'file' && (
              <div className="space-y-4 bg-gray-50 p-4 rounded-2xl border border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-700">
                    Upload Custom Syllabus File (.csv or .json)
                  </span>
                  <button
                    onClick={handleDownloadSampleCsv}
                    className="text-[11px] font-montserrat font-bold text-[#8A651E] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-[#C8A45D]" />
                    Download Sample CSV Template
                  </button>
                </div>

                <div className="border-2 border-dashed border-gray-300 hover:border-[#C8A45D] rounded-2xl p-6 text-center transition-colors bg-white">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-gray-700 mb-1">
                    Choose or drag a CSV or JSON file here
                  </p>
                  <p className="text-[11px] text-gray-500 mb-3">
                    Columns required in CSV: <code className="bg-gray-100 px-1 py-0.5 rounded">Subject,Chapter No,Topic Name,Amendment</code>
                  </p>
                  <label className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1C1917] hover:bg-black text-[#FFE3A0] text-xs font-montserrat font-bold rounded-xl cursor-pointer shadow-xs">
                    <span>Select File</span>
                    <input
                      type="file"
                      accept=".csv,.json"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleProcessUploadedFile(file);
                      }}
                    />
                  </label>
                </div>
              </div>
            )}

            {/* Tab 3: Paste Text */}
            {indexUploadTab === 'text' && (
              <div className="space-y-3 bg-gray-50 p-4 rounded-2xl border border-gray-200">
                <p className="text-xs text-gray-700 font-semibold">
                  Paste chapter list line by line. Format: <code className="bg-white px-1 py-0.5 rounded border border-gray-200">Subject | Chapter No | Topic Name | Amendment</code> or just <code className="bg-white px-1 py-0.5 rounded border border-gray-200">Chapter 1 - General Meeting</code>
                </p>
                <textarea
                  rows={6}
                  value={pastedIndexText}
                  onChange={(e) => setPastedIndexText(e.target.value)}
                  placeholder={`Company Law & Practice | Chapter 1 | General Meetings & Postal Ballot | Act 2024\nCompany Law & Practice | Chapter 2 | Board Powers & Resolutions | Standard\nSetting Up of Business | Chapter 1 | Types of Companies | Notification 12`}
                  className="w-full p-3 text-xs border border-gray-300 rounded-xl bg-white font-mono"
                />
                <button
                  onClick={handleParsePastedText}
                  className="px-4 py-2 bg-[#1C1917] hover:bg-black text-[#FFE3A0] text-xs font-montserrat font-bold rounded-xl cursor-pointer"
                >
                  Parse Chapters Text
                </button>
              </div>
            )}

            {/* Parsed Rows Preview */}
            <div className="flex-1 overflow-y-auto min-h-[140px] border border-gray-200 rounded-2xl bg-white p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-800">
                  {uploadedParsedRows ? (
                    <span className="text-emerald-700 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      {uploadedParsedRows.length} Chapters Ready to Publish
                    </span>
                  ) : (
                    <span className="text-gray-500">
                      Currently loaded: {uploadingIndexStudent.trackerRows?.length || 0} chapters in student tracker
                    </span>
                  )}
                </span>
                {uploadedParsedRows && (
                  <button
                    onClick={() => setUploadedParsedRows(null)}
                    className="text-[11px] text-rose-600 hover:underline font-semibold cursor-pointer"
                  >
                    Clear Preview
                  </button>
                )}
              </div>

              {uploadedParsedRows && uploadedParsedRows.length > 0 && (
                <div className="max-h-48 overflow-y-auto text-[11px] border border-gray-100 rounded-xl divide-y divide-gray-100">
                  {uploadedParsedRows.slice(0, 30).map((row, idx) => (
                    <div key={row.id || idx} className="py-1.5 px-2 flex items-center justify-between gap-2 hover:bg-gray-50">
                      <div className="flex items-center gap-2 truncate">
                        <span className="font-bold text-gray-800 w-24 shrink-0 truncate">{row.chapterNo}</span>
                        <span className="text-gray-700 truncate">{row.topic}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">{row.subjectName}</span>
                        <span className="text-[10px] text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded">{row.amendment}</span>
                      </div>
                    </div>
                  ))}
                  {uploadedParsedRows.length > 30 && (
                    <div className="p-2 text-center text-gray-500 text-[10px] font-semibold bg-gray-50">
                      + {uploadedParsedRows.length - 30} more chapters...
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <span className="text-[11px] text-gray-500">
                Changes take effect in student portal immediately without reload.
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setUploadingIndexStudent(null);
                    setUploadedParsedRows(null);
                    setUploadError('');
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApplyIndexToStudent}
                  disabled={!uploadedParsedRows || uploadedParsedRows.length === 0}
                  className="px-5 py-2 bg-gradient-to-r from-[#FFE3A0] via-[#C8A45D] to-[#DFB96E] hover:from-[#FFEFA6] hover:to-[#C8A45D] text-black font-montserrat font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Publish Index to Student Portal</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MANAGE STUDENT MODAL */}
      {managingStudent && (
        <ManageStudentModal
          student={managingStudent}
          slotBookings={slotBookings}
          onClose={() => setManagingStudent(null)}
          onRefresh={loadCentralData}
          onOpenTracker={(studentId) => {
            const prof = students.find((st) => st.studentId === studentId);
            if (prof) {
              setActiveStudent(prof);
              setManagerTab('chart');
              setManagingStudent(null);
            } else {
              setManagerTab('chart');
              setManagingStudent(null);
            }
          }}
          onLaunchPortal={(studentEmail) => {
            const prof = students.find((st) => st.studentEmail.toLowerCase() === studentEmail.toLowerCase());
            if (prof) {
              handleLaunchImpersonation(prof);
            }
          }}
        />
      )}
    </div>
  );
};
