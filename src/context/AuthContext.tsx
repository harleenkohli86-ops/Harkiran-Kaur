import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '../types';
import {
  getAllStudents,
  getStudentByEmail,
  getStudentById,
  registerStudentInCentralDb,
  approveStudentRegistration,
  rejectStudentRegistration,
  approveStudentPayment,
  rejectStudentPayment,
  requestPasswordResetLink,
  completePasswordResetWithToken,
  subscribeToDatabaseChanges,
  ProgramName,
  ProgramLevel,
  ProgramGroup,
} from '../services/centralStudentDatabase';

interface AuthContextType {
  user: UserProfile | null;
  login: (emailOrPhone: string, pass: string) => { success: boolean; message: string; isPendingApproval?: boolean };
  register: (
    fullName: string,
    email: string,
    phone: string,
    targetExamOrProgram: string,
    pass: string,
    levelInput?: string,
    groupInput?: string
  ) => { success: boolean; message: string; pendingApproval?: boolean };
  requestPasswordReset: (email: string) => { success: boolean; message: string; token?: string; resetUrl?: string };
  completePasswordReset: (token: string, newPass: string) => { success: boolean; message: string };
  resetPassword: (email: string, newPass: string) => { success: boolean; message: string; isPendingApproval?: boolean };
  approveStudentAccount: (emailOrId: string) => Promise<{ success: boolean; message: string }>;
  revokeStudentAccount: (emailOrId: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  updateProfile: (updatedData: Partial<UserProfile>) => void;
  hasPurchased: (productId: string) => boolean;
  grantPurchase: (productIds: string[]) => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  authTab: 'login' | 'register' | 'forgot';
  setAuthTab: (tab: 'login' | 'register' | 'forgot') => void;
  allowRegister: boolean;
  setAllowRegister: (allow: boolean) => void;
  openAuthModal: (tab?: 'login' | 'register' | 'forgot', options?: { allowRegister?: boolean }) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'hk_rankers_user_session_v2';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return null;
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authTab, setAuthTab] = useState<'login' | 'register' | 'forgot'>('login');
  const [allowRegister, setAllowRegister] = useState(true);

  // Sync session with localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [user]);

  // Real-time Central Database Synchronization
  useEffect(() => {
    const unsubscribe = subscribeToDatabaseChanges(() => {
      if (user && user.role !== 'admin' && user.email) {
        const fresh = getStudentByEmail(user.email);
        if (fresh) {
          setUser((prev) => {
            if (!prev) return null;
            const isApproved = fresh.registrationStatus === 'approved';
            const isPaid = fresh.paymentStatus === 'approved';
            const purchasedIds = isPaid
              ? ['mentorship-enrolled', fresh.purchasedCourse?.courseId || 'cs-mentorship']
              : [];

            return {
              ...prev,
              fullName: fresh.fullName,
              phone: fresh.phone,
              targetExam: fresh.targetExam,
              program: fresh.program,
              level: fresh.level,
              group: fresh.group,
              registrationStatus: fresh.registrationStatus,
              paymentStatus: fresh.paymentStatus,
              mentorshipAccess: fresh.mentorshipAccess,
              assignedIndexId: fresh.assignedIndexId,
              isApproved,
              approvalStatus: isApproved ? 'approved' : fresh.registrationStatus === 'rejected' ? 'rejected' : 'pending',
              purchasedProductIds: purchasedIds,
              studyIndexAccess: fresh.studyIndexAccess,
            };
          });
        }
      }
    });

    return unsubscribe;
  }, [user]);

  const openAuthModal = (
    tab: 'login' | 'register' | 'forgot' = 'login',
    options?: { allowRegister?: boolean }
  ) => {
    if (user || options?.allowRegister === false) {
      setAllowRegister(false);
      setAuthTab(tab === 'register' ? 'login' : tab);
    } else {
      setAllowRegister(options?.allowRegister ?? true);
      setAuthTab(tab);
    }
    setIsAuthModalOpen(true);
  };

  /**
   * Automatic Direct Login for Registered Students
   * Checks central database and logs the student in immediately.
   */
  const login = (
    emailOrPhone: string,
    pass: string
  ): { success: boolean; message: string; isPendingApproval?: boolean } => {
    if (!emailOrPhone || !pass) {
      return { success: false, message: 'Please provide your registered email and password.' };
    }

    const cleanInput = emailOrPhone.trim().toLowerCase();
    const cleanPass = pass.trim();
    const digits = cleanInput.replace(/\D/g, '');

    // 1. Check Master Admin login
    const isMasterAdminEmailOrPhone =
      cleanInput === 'admin@hkcodeofrankers.com' ||
      cleanInput === 'harkiran@hkcodeofrankers.com' ||
      cleanInput === 'harleenkohli86@gmail.com' ||
      cleanInput === 'admin' ||
      digits === '9284084523';

    const isMasterAdminPass =
      cleanPass === 'Kaur131327' ||
      cleanPass.toLowerCase() === 'kaur131327' ||
      cleanPass === 'admin123' ||
      cleanPass === 'rankers2026' ||
      cleanPass === 'admin';

    if (isMasterAdminEmailOrPhone && isMasterAdminPass) {
      const adminProfile: UserProfile = {
        id: 'usr_master_admin',
        studentId: 'ADMIN-001',
        fullName: 'Harkiran Kaur Kohli',
        email: cleanInput.includes('@') ? cleanInput : 'harleenkohli86@gmail.com',
        phone: '+91 92840 84523',
        targetExam: 'Master Admin / Head Mentor',
        avatar: 'https://ui-avatars.com/api/?name=Harkiran+Kaur&background=0F0F0F&color=FFE3A0',
        purchasedProductIds: ['cseet-mentorship', 'cs-exec-mentorship', 'cs-prof-mentorship', 'mentorship-enrolled'],
        createdAt: new Date().toISOString(),
        isApproved: true,
        approvalStatus: 'approved',
        registrationStatus: 'approved',
        paymentStatus: 'approved',
        mentorshipAccess: true,
        studyIndexAccess: true,
        role: 'admin',
      };
      setUser(adminProfile);
      setIsAuthModalOpen(false);
      return { success: true, message: 'Welcome Master Admin!' };
    }

    // 2. Query Central Database for Student
    const allStudents = getAllStudents();
    const student = allStudents.find((s) => s.email.toLowerCase() === cleanInput);

    if (student) {
      // Check password
      if (student.password !== pass) {
        return {
          success: false,
          message: 'Incorrect password. If you forgot your password, click "Forgot Password" to receive a secure reset link at your registered email.',
        };
      }

      // Direct Login: No registration approval pending stage!
      const isPaid = student.paymentStatus === 'approved';
      const purchasedIds: string[] = [];
      if (student.mentorshipAccess) {
        purchasedIds.push('mentorship-enrolled', student.purchasedCourse?.courseId || 'cs-mentorship');
      }
      if (student.studyIndexAccess) {
        purchasedIds.push('cs-study-progress-index');
      }

      const userProfile: UserProfile = {
        id: student.studentId,
        studentId: student.studentId,
        fullName: student.fullName,
        email: student.email,
        phone: student.phone,
        targetExam: student.targetExam,
        program: student.program,
        level: student.level,
        group: student.group,
        avatar: student.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.fullName)}&background=C8A45D&color=000`,
        purchasedProductIds: purchasedIds,
        createdAt: student.registeredAt,
        isApproved: true,
        approvalStatus: 'approved',
        registrationStatus: 'approved',
        paymentStatus: student.paymentStatus,
        mentorshipAccess: student.mentorshipAccess,
        studyIndexAccess: student.studyIndexAccess,
        assignedIndexId: student.assignedIndexId,
        approvedAt: student.registrationApprovedAt,
        role: 'student',
      };

      setUser(userProfile);
      setIsAuthModalOpen(false);
      return { success: true, message: `Welcome back, ${student.fullName}!` };
    }

    return {
      success: false,
      message: 'No registered student account found with this email address. Please check your spelling or register as a new student.',
    };
  };

  /**
   * Student Registration
   * Automatically creates account in Central Database.
   * Auto-logs student in immediately.
   */
  const register = (
    fullName: string,
    email: string,
    phone: string,
    targetExamOrProgram: string,
    pass: string,
    levelInput?: string,
    groupInput?: string
  ): { success: boolean; message: string; pendingApproval?: boolean } => {
    let program: ProgramName = 'CS Executive';
    let level: ProgramLevel = 'Level 2';
    let group: ProgramGroup = 'Group 1';

    const lower = (targetExamOrProgram || '').toLowerCase();
    if (lower.includes('eet')) {
      program = 'CS EET';
      level = 'Level 1';
      group = 'EET';
    } else if (lower.includes('professional') || lower.includes('prof')) {
      program = 'CS Professional';
      level = 'Level 3';
      group = lower.includes('group 2') ? 'Group 2' : lower.includes('both') ? 'Both Groups' : 'Group 1';
    } else {
      program = 'CS Executive';
      level = 'Level 2';
      group = lower.includes('group 2') ? 'Group 2' : lower.includes('both') ? 'Both Groups' : 'Group 1';
    }

    if (levelInput) level = levelInput as ProgramLevel;
    if (groupInput) group = groupInput as ProgramGroup;

    const res = registerStudentInCentralDb({
      fullName,
      email,
      phone,
      program,
      level,
      group,
      password: pass,
    });

    if (res.success && res.student) {
      // Automatic Login upon registration!
      const userProfile: UserProfile = {
        id: res.student.studentId,
        studentId: res.student.studentId,
        fullName: res.student.fullName,
        email: res.student.email,
        phone: res.student.phone,
        targetExam: res.student.targetExam,
        program: res.student.program,
        level: res.student.level,
        group: res.student.group,
        avatar: res.student.avatar,
        purchasedProductIds: [],
        createdAt: res.student.registeredAt,
        isApproved: true,
        approvalStatus: 'approved',
        registrationStatus: 'approved',
        paymentStatus: 'unpaid',
        mentorshipAccess: false,
        studyIndexAccess: false,
        assignedIndexId: res.student.assignedIndexId,
        approvedAt: res.student.registeredAt,
        role: 'student',
      };
      setUser(userProfile);
      setIsAuthModalOpen(false);
      return {
        success: true,
        message: 'Account created successfully! You are now logged into your Student Portal.',
      };
    }

    return {
      success: res.success,
      message: res.message,
    };
  };

  /**
   * Request Password Reset Link via Registered Email (Secure Link)
   */
  const requestPasswordReset = (email: string) => {
    return requestPasswordResetLink(email);
  };

  /**
   * Complete Password Reset using Verified Link Token
   */
  const completePasswordReset = (token: string, newPass: string) => {
    return completePasswordResetWithToken(token, newPass);
  };

  /**
   * Backward compatibility for legacy resetPassword
   */
  const resetPassword = (
    email: string,
    _newPass: string
  ): { success: boolean; message: string; isPendingApproval?: boolean } => {
    const res = requestPasswordResetLink(email);
    return {
      success: res.success,
      message: res.message,
    };
  };

  /**
   * Admin: Approve Student Account
   */
  const approveStudentAccount = async (emailOrId: string): Promise<{ success: boolean; message: string }> => {
    const all = getAllStudents();
    const clean = emailOrId.trim().toLowerCase();
    const target = all.find((s) => s.studentId === emailOrId || s.email.toLowerCase() === clean);

    if (!target) {
      return { success: false, message: 'Student not found in central database.' };
    }

    const res = approveStudentRegistration(target.studentId);
    return res;
  };

  /**
   * Admin: Revoke Student Access
   */
  const revokeStudentAccount = async (emailOrId: string): Promise<{ success: boolean; message: string }> => {
    const all = getAllStudents();
    const clean = emailOrId.trim().toLowerCase();
    const target = all.find((s) => s.studentId === emailOrId || s.email.toLowerCase() === clean);

    if (!target) {
      return { success: false, message: 'Student not found in central database.' };
    }

    const res = rejectStudentRegistration(target.studentId, 'Access revoked by administrator.');
    if (user && user.email.toLowerCase() === target.email.toLowerCase()) {
      setUser(null);
    }
    return res;
  };

  const logout = () => {
    setUser(null);
  };

  const updateProfile = (updatedData: Partial<UserProfile>) => {
    if (!user) return;
    const updated = { ...user, ...updatedData };
    setUser(updated);
  };

  const hasPurchased = (productId: string) => {
    if (!user) return false;
    return user.purchasedProductIds.includes(productId);
  };

  const grantPurchase = (productIds: string[]) => {
    if (!user) return;
    const newSet = new Set([...user.purchasedProductIds, ...productIds]);
    const updated: UserProfile = {
      ...user,
      purchasedProductIds: Array.from(newSet),
    };
    setUser(updated);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        requestPasswordReset,
        completePasswordReset,
        resetPassword,
        approveStudentAccount,
        revokeStudentAccount,
        logout,
        updateProfile,
        hasPurchased,
        grantPurchase,
        isAuthModalOpen,
        setIsAuthModalOpen,
        authTab,
        setAuthTab,
        allowRegister,
        setAllowRegister,
        openAuthModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
