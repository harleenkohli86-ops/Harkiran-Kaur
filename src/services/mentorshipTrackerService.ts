import {
  MentorshipProgram,
  MentorshipLevel,
  MentorshipGroup,
  TrackerRow,
  MonthMentorshipRecord,
  StudentMentorshipProfile,
  MonthlyMentorshipCall,
} from '../types/mentorship';
import { supabase } from '../lib/supabase';
import {
  ICSI_OFFICIAL_SYLLABUS,
  OfficialSyllabusGroup,
} from '../data/icsiOfficialSyllabus';
import {
  getAllStudents,
  toMentorshipProfile,
  updateStudentTrackerRows,
  updateStudentMonthlyCalls,
} from './centralStudentDatabase';

const STORAGE_KEY = 'hk_mentorship_student_profiles';
const ACTIVE_ADMIN_VIEW_KEY = 'hk_admin_viewing_student_id';

export const CURRENT_SYLLABUS_VERSION = '2026_icsi_official_v1';

// Default 12 Months
const MONTHS: MonthMentorshipRecord['month'][] = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export function createDefault12MonthCalls(): MonthMentorshipRecord[] {
  return MONTHS.map((month) => ({
    month,
    call1: {
      callNumber: 1,
      agenda: 'Personal Syllabus Tracking',
      status: 'Pending',
      notes: 'Review syllabus coverage, pending backlogs & target setting.',
    },
    call2: {
      callNumber: 2,
      agenda: 'Study & Progress Mentorship',
      status: 'Pending',
      notes: 'Evaluate daily study hours, consistency and preparation strategy.',
    },
    call3: {
      callNumber: 3,
      agenda: 'Performance & Revision Review',
      status: 'Pending',
      notes: 'Analyze answer sheets, chapter test scores & identify weak spots.',
    },
    call4: {
      callNumber: 4,
      agenda: 'Anxiety Relief / Support Call',
      status: 'Pending',
      notes: 'Direct 1-on-1 calming session, exam stress and panic management.',
    },
  }));
}

// -------------------------------------------------------------
// Official ICSI 2026 Syllabus Seed Chapters Generator
// All 5 Groups / Levels: CSEET, Exec G1, Exec G2, Prof G1, Prof G2
// All columns default to 'Pending', Amendment empty & manually editable
// Red highlight toggle supported on Chapter No & Topic
// -------------------------------------------------------------

export function buildTrackerRowsFromSyllabusGroup(
  groupData: OfficialSyllabusGroup,
  assignedIndexId: string
): TrackerRow[] {
  const rows: TrackerRow[] = [];
  groupData.papers.forEach((paper, pIdx) => {
    paper.chapters.forEach((chapter, cIdx) => {
      rows.push({
        id: `${groupData.id}_p${pIdx + 1}_c${cIdx + 1}`,
        programGroup: assignedIndexId,
        subjectCode: paper.code,
        subjectName: paper.name,
        chapterNo: chapter.ch,
        isChapterRed: false,
        amendment: chapter.defaultAmendment || '',
        isAmendmentRed: false,
        topic: chapter.topic,
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
        remarks: chapter.part ? `[${chapter.part}]` : '',
      });
    });
  });
  return rows;
}

export function generateDefaultChapters(program: MentorshipProgram, group: MentorshipGroup): TrackerRow[] {
  // 1. CSEET
  if (program === 'CS EET') {
    return buildTrackerRowsFromSyllabusGroup(ICSI_OFFICIAL_SYLLABUS['cseet'], 'cseet');
  }

  // 2. CS EXECUTIVE - GROUP 1
  if (program === 'CS Executive' && group === 'Group 1') {
    return buildTrackerRowsFromSyllabusGroup(ICSI_OFFICIAL_SYLLABUS['exec-g1'], 'exec-g1');
  }

  if (program === 'CS Executive' && group === 'Group 2') {
    return buildTrackerRowsFromSyllabusGroup(ICSI_OFFICIAL_SYLLABUS['exec-g2'], 'exec-g2');
  }
  if (program === 'CS Executive' && group === 'Both') {
    const g1Rows = buildTrackerRowsFromSyllabusGroup(ICSI_OFFICIAL_SYLLABUS['exec-g1'], 'exec-both');
    const g2Rows = buildTrackerRowsFromSyllabusGroup(ICSI_OFFICIAL_SYLLABUS['exec-g2'], 'exec-both');
    return [...g1Rows, ...g2Rows];
  }

  // 3. CS PROFESSIONAL
  if (program === 'CS Professional') {
    if (group === 'Group 1') {
      return buildTrackerRowsFromSyllabusGroup(ICSI_OFFICIAL_SYLLABUS['prof-g1'], 'prof-g1');
    }
    if (group === 'Group 2') {
      return buildTrackerRowsFromSyllabusGroup(ICSI_OFFICIAL_SYLLABUS['prof-g2'], 'prof-g2');
    }
    // Both Groups
    const g1Rows = buildTrackerRowsFromSyllabusGroup(ICSI_OFFICIAL_SYLLABUS['prof-g1'], 'prof-both');
    const g2Rows = buildTrackerRowsFromSyllabusGroup(ICSI_OFFICIAL_SYLLABUS['prof-g2'], 'prof-both');
    return [...g1Rows, ...g2Rows];
  }

  // Fallback: Default to Executive Group 1
  return buildTrackerRowsFromSyllabusGroup(ICSI_OFFICIAL_SYLLABUS['exec-g1'], 'exec-g1');
}

/**
 * Synchronizes any student's profile to the official sorted ICSI syllabus.
 * Preserves existing student progress/amendments where chapter number/topic match,
 * while ensuring all newly updated chapters are populated in 'Pending' status.
 */
export function syncProfileToOfficialSyllabus(
  profile: StudentMentorshipProfile,
  forceResetToPending: boolean = false
): StudentMentorshipProfile {
  const freshRows = generateDefaultChapters(profile.program, profile.group);

  let mergedRows: TrackerRow[];

  if (forceResetToPending || !profile.trackerRows || profile.trackerRows.length === 0) {
    mergedRows = freshRows;
  } else {
    // Preserve existing status/amendments by matching chapter number and topic/subject
    const existingMap = new Map<string, TrackerRow>();
    profile.trackerRows.forEach((r) => {
      const key1 = `${r.subjectName}_${r.chapterNo}`.toLowerCase();
      const key2 = `${r.chapterNo}_${r.topic}`.toLowerCase();
      const key3 = r.chapterNo.toLowerCase().trim();
      existingMap.set(key1, r);
      existingMap.set(key2, r);
      if (!existingMap.has(key3)) {
        existingMap.set(key3, r);
      }
    });

    mergedRows = freshRows.map((fresh) => {
      const matchKey1 = `${fresh.subjectName}_${fresh.chapterNo}`.toLowerCase();
      const matchKey2 = `${fresh.chapterNo}_${fresh.topic}`.toLowerCase();
      const matchKey3 = fresh.chapterNo.toLowerCase().trim();
      const existing = existingMap.get(matchKey1) || existingMap.get(matchKey2) || existingMap.get(matchKey3);

      if (existing) {
        return {
          ...fresh,
          isChapterRed: existing.isChapterRed ?? false,
          isTopicRed: existing.isTopicRed ?? false,
          isAmendmentRed: existing.isAmendmentRed ?? false,
          amendment: existing.amendment || fresh.amendment || '',
          lectures: existing.lectures || 'Pending',
          firstDetailedReading: existing.firstDetailedReading || 'Pending',
          chapterWiseTest: existing.chapterWiseTest || 'Pending',
          firstMockTest: existing.firstMockTest || 'Pending',
          secondMockTest: existing.secondMockTest || 'Pending',
          fifthRevision: existing.fifthRevision || 'Pending',
          fourthRevision: existing.fourthRevision || 'Pending',
          thirdRevision: existing.thirdRevision || 'Pending',
          secondRevision: existing.secondRevision || 'Pending',
          firstRevision: existing.firstRevision || 'Pending',
          remarks: existing.remarks || fresh.remarks || '',
        };
      }
      return fresh;
    });
  }

  const updatedProfile: StudentMentorshipProfile = {
    ...profile,
    syllabusVersion: CURRENT_SYLLABUS_VERSION,
    trackerRows: mergedRows,
    updatedAt: new Date().toISOString(),
  };

  saveStudentMentorshipProfile(updatedProfile);
  return updatedProfile;
}

// -------------------------------------------------------------
// Program & Group Identification
// -------------------------------------------------------------

export function resolveProgramAndGroup(rawInput: string): {
  program: MentorshipProgram;
  level: MentorshipLevel;
  group: MentorshipGroup;
  assignedIndexId: string;
} {
  const norm = (rawInput || '').toLowerCase();

  // CSEET
  if (norm.includes('eet') || norm.includes('cseet')) {
    return {
      program: 'CS EET',
      level: 'Level 1',
      group: 'General',
      assignedIndexId: 'cseet',
    };
  }

  // CS Professional
  if (norm.includes('prof') || norm.includes('level 3')) {
    if (norm.includes('g1') || norm.includes('group 1')) {
      return {
        program: 'CS Professional',
        level: 'Level 3',
        group: 'Group 1',
        assignedIndexId: 'prof-g1',
      };
    }
    if (norm.includes('g2') || norm.includes('group 2')) {
      return {
        program: 'CS Professional',
        level: 'Level 3',
        group: 'Group 2',
        assignedIndexId: 'prof-g2',
      };
    }
    return {
      program: 'CS Professional',
      level: 'Level 3',
      group: 'Both',
      assignedIndexId: 'prof-both',
    };
  }

  // Default: CS Executive (Level 2)
  if (norm.includes('group 2') || norm.includes('g2') || norm.includes('exec-g2')) {
    return {
      program: 'CS Executive',
      level: 'Level 2',
      group: 'Group 2',
      assignedIndexId: 'exec-g2',
    };
  }

  if (norm.includes('group 1') || norm.includes('g1') || norm.includes('exec-g1')) {
    return {
      program: 'CS Executive',
      level: 'Level 2',
      group: 'Group 1',
      assignedIndexId: 'exec-g1',
    };
  }

  // Both Groups
  return {
    program: 'CS Executive',
    level: 'Level 2',
    group: 'Both',
    assignedIndexId: 'exec-both',
  };
}

// -------------------------------------------------------------
// Profile Retrieval & Persistence
// -------------------------------------------------------------

export function loadAllStoredProfiles(): Record<string, StudentMentorshipProfile> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function saveAllStoredProfiles(profiles: Record<string, StudentMentorshipProfile>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
  } catch (err) {
    console.warn('Failed to save mentorship profiles:', err);
  }
}

/**
 * Gets or initializes a student's mentorship record.
 * Uses Email or Phone as the persistent key.
 */
export function getOrCreateStudentMentorship(student: {
  id?: string;
  fullName: string;
  email: string;
  phone: string;
  targetExam?: string;
  isApproved?: boolean;
}): StudentMentorshipProfile {
  const profiles = loadAllStoredProfiles();
  const cleanEmail = (student.email || '').trim().toLowerCase();
  const rawDigits = (student.phone || '').replace(/\D/g, '');
  const cleanPhone = rawDigits.length >= 10 ? rawDigits.slice(-10) : '';
  const genericPhones = ['9876543210', '9876500000', '0000000000', '1234567890', '9999999999'];
  const isValidPhone = cleanPhone.length === 10 && !genericPhones.includes(cleanPhone);

  // Canonical key: Email is uniquely authoritative
  const key = cleanEmail || (isValidPhone ? `phone_${cleanPhone}` : (student.id || 'default_student'));

  if (profiles[key]) {
    if (profiles[key].syllabusVersion !== CURRENT_SYLLABUS_VERSION) {
      profiles[key] = syncProfileToOfficialSyllabus(profiles[key], false);
    }
    if (student.isApproved !== undefined && profiles[key].isApproved !== student.isApproved) {
      profiles[key].isApproved = student.isApproved;
      profiles[key].approvalStatus = student.isApproved ? 'approved' : 'pending';
      if (student.isApproved) profiles[key].approvedAt = new Date().toISOString();
      saveAllStoredProfiles(profiles);
    }
    return profiles[key];
  }

  // Find if existing profile matches strictly
  let existingKey: string | undefined = undefined;

  if (cleanEmail) {
    // 1. Strict primary check: exact email match only. NEVER merge if emails differ!
    existingKey = Object.keys(profiles).find((k) => {
      const p = profiles[k];
      const pEmail = (p.studentEmail || '').trim().toLowerCase();
      return pEmail && pEmail === cleanEmail;
    });
  } else if (isValidPhone) {
    // 2. Only if no email was provided at all, allow valid non-placeholder phone match
    existingKey = Object.keys(profiles).find((k) => {
      const p = profiles[k];
      const pDigits = (p.studentPhone || '').replace(/\D/g, '').slice(-10);
      return pDigits === cleanPhone;
    });
  }

  if (existingKey && profiles[existingKey]) {
    if (profiles[existingKey].syllabusVersion !== CURRENT_SYLLABUS_VERSION) {
      profiles[existingKey] = syncProfileToOfficialSyllabus(profiles[existingKey], false);
    }
    if (student.isApproved !== undefined && profiles[existingKey].isApproved !== student.isApproved) {
      profiles[existingKey].isApproved = student.isApproved;
      profiles[existingKey].approvalStatus = student.isApproved ? 'approved' : 'pending';
      if (student.isApproved) profiles[existingKey].approvedAt = new Date().toISOString();
      saveAllStoredProfiles(profiles);
    }
    return profiles[existingKey];
  }

  // Initialize new profile
  const { program, level, group, assignedIndexId } = resolveProgramAndGroup(student.targetExam || 'CS Executive Group 1');
  const trackerRows = generateDefaultChapters(program, group);
  const monthlyCalls = createDefault12MonthCalls();

  const newProfile: StudentMentorshipProfile = {
    studentId: student.id || `std_${Date.now()}`,
    studentName: student.fullName || 'Student',
    studentEmail: cleanEmail,
    studentPhone: student.phone || '',
    program,
    level,
    group,
    assignedIndexId,
    targetAttempt: 'June 2026 / Dec 2026',
    syllabusVersion: CURRENT_SYLLABUS_VERSION,
    trackerRows,
    monthlyCalls,
    adminOverallRemarks: 'Batch 25 Mentorship Enrolled. Follow daily study schedule strictly.',
    isApproved: student.isApproved ?? false,
    approvalStatus: student.isApproved ? 'approved' : 'pending',
    approvedAt: student.isApproved ? new Date().toISOString() : undefined,
    updatedAt: new Date().toISOString(),
  };

  profiles[key] = newProfile;
  saveAllStoredProfiles(profiles);
  return newProfile;
}

/**
 * Toggles or sets a student's approval status in mentorship profiles.
 */
export function setStudentApprovalStatus(
  identifier: string,
  isApproved: boolean
): boolean {
  const profiles = loadAllStoredProfiles();
  const clean = identifier.trim().toLowerCase();
  const digits = identifier.replace(/\D/g, '');

  for (const [key, p] of Object.entries(profiles)) {
    const pEmail = (p.studentEmail || '').trim().toLowerCase();
    const pPhone = (p.studentPhone || '').replace(/\D/g, '');
    const pId = (p.studentId || '').trim();

    if (
      pId === identifier ||
      (clean && pEmail === clean) ||
      (digits && pPhone === digits) ||
      key === identifier ||
      key.toLowerCase() === clean
    ) {
      p.isApproved = isApproved;
      p.approvalStatus = isApproved ? 'approved' : 'pending';
      p.approvedAt = isApproved ? new Date().toISOString() : undefined;
      p.updatedAt = new Date().toISOString();
      saveAllStoredProfiles(profiles);
      return true;
    }
  }
  return false;
}

/**
 * Saves or updates a student mentorship profile.
 * Can also sync to Supabase backend table if available.
 */
export async function saveStudentMentorshipProfile(profile: StudentMentorshipProfile): Promise<boolean> {
  const profiles = loadAllStoredProfiles();
  const cleanEmail = (profile.studentEmail || '').trim().toLowerCase();
  const cleanPhone = (profile.studentPhone || '').replace(/\D/g, '');
  const key = cleanEmail || cleanPhone || profile.studentId;

  profile.updatedAt = new Date().toISOString();
  profiles[key] = profile;
  saveAllStoredProfiles(profiles);

  // Sync to Central Student Database
  try {
    if (profile.studentId) {
      updateStudentTrackerRows(profile.studentId, profile.trackerRows);
      updateStudentMonthlyCalls(profile.studentId, profile.monthlyCalls);
    }
  } catch (err) {
    console.warn('Central DB sync error from mentorship profile:', err);
  }

  // Sync to Supabase in background
  try {
    await supabase.from('mentorship_trackers').upsert([
      {
        student_email: cleanEmail,
        student_phone: cleanPhone,
        student_name: profile.studentName,
        program: profile.program,
        level: profile.level,
        group_name: profile.group,
        assigned_index_id: profile.assignedIndexId,
        tracker_data: profile.trackerRows,
        monthly_calls_data: profile.monthlyCalls,
        admin_remarks: profile.adminOverallRemarks,
        updated_at: profile.updatedAt,
      },
    ]);
  } catch (err) {
    // silently fallback to local storage
  }

  return true;
}

/**
 * Fetches all registered students and their mentorship profiles for Admin view.
 */
export function getAllStudentProfilesForAdmin(): StudentMentorshipProfile[] {
  const deletedKeys: string[] = (() => {
    try {
      return JSON.parse(localStorage.getItem('hk_deleted_student_keys') || '[]');
    } catch {
      return [];
    }
  })();

  const isDeleted = (p: { studentId?: string; studentEmail?: string; studentPhone?: string; id?: string; email?: string; phone?: string }) => {
    const id = (p.studentId || p.id || '').trim();
    const email = (p.studentEmail || p.email || '').trim().toLowerCase();
    const phone = (p.studentPhone || p.phone || '').replace(/\D/g, '');
    return deletedKeys.some(
      (k) =>
        (id && k === id) ||
        (email && k.toLowerCase() === email) ||
        (phone && k === phone)
    );
  };

  const storedMap = loadAllStoredProfiles();
  const result: StudentMentorshipProfile[] = Object.values(storedMap)
    .filter((p) => !isDeleted(p))
    .map((p) => {
      if (p.syllabusVersion !== CURRENT_SYLLABUS_VERSION) {
        return syncProfileToOfficialSyllabus(p, false);
      }
      return p;
    });

  // Include all students from Central Student Database
  try {
    const centralStudents = getAllStudents();
    centralStudents.forEach((student) => {
      if (isDeleted({ id: student.studentId, email: student.email, phone: student.phone })) return;
      const cleanEmail = student.email.toLowerCase();
      const cleanPhone = student.phone.replace(/\D/g, '');
      const existingIdx = result.findIndex(
        (p) =>
          p.studentId === student.studentId ||
          (cleanEmail && p.studentEmail?.toLowerCase() === cleanEmail) ||
          (cleanPhone && p.studentPhone?.replace(/\D/g, '') === cleanPhone)
      );

      const mentorshipProfile = toMentorshipProfile(student);

      if (existingIdx !== -1) {
        // Keep in sync with central status
        result[existingIdx].isApproved = student.registrationStatus === 'approved';
        result[existingIdx].approvalStatus = student.registrationStatus === 'approved' ? 'approved' : student.registrationStatus === 'rejected' ? 'rejected' : 'pending';
        result[existingIdx].studentName = student.fullName;
        result[existingIdx].studentPhone = student.phone;
      } else {
        result.push(mentorshipProfile);
      }
    });
  } catch (err) {
    console.warn('Could not merge central student profiles:', err);
  }

  // Also include registered users from Auth storage who might not have had a profile generated yet
  try {
    const rawUsers = localStorage.getItem('hk_rankers_registered_users');
    if (rawUsers) {
      const regUsers: any[] = JSON.parse(rawUsers);
      regUsers.forEach((user) => {
        if (isDeleted(user)) return;
        const email = (user.email || '').trim().toLowerCase();
        const phone = (user.phone || '').replace(/\D/g, '');
        const exists = result.some(
          (p) =>
            (email && p.studentEmail?.toLowerCase() === email) ||
            (phone && p.studentPhone?.replace(/\D/g, '') === phone)
        );
        if (!exists && (email || phone)) {
          const profile = getOrCreateStudentMentorship({
            id: user.id,
            fullName: user.fullName,
            email: user.email,
            phone: user.phone,
            targetExam: user.targetExam,
            isApproved: user.isApproved ?? false,
          });
          result.push(profile);
        }
      });
    }
  } catch {
    // ignore
  }

  // Also include students from enrollments if available
  try {
    const rawEnr = localStorage.getItem('hk_local_enrollments');
    if (rawEnr) {
      const enrollments: any[] = JSON.parse(rawEnr);
      enrollments.forEach((enr) => {
        if (isDeleted(enr)) return;
        const email = (enr.email || '').trim().toLowerCase();
        const phone = (enr.phone || '').replace(/\D/g, '');
        const exists = result.some(
          (p) =>
            (email && p.studentEmail?.toLowerCase() === email) ||
            (phone && p.studentPhone?.replace(/\D/g, '') === phone)
        );
        if (!exists && (email || phone)) {
          const profile = getOrCreateStudentMentorship({
            fullName: enr.name,
            email: enr.email,
            phone: enr.phone,
            targetExam: enr.program,
            isApproved: enr.status === 'confirmed' || true,
          });
          result.push(profile);
        }
      });
    }
  } catch {
    // ignore
  }

  const FORBIDDEN_DEMO_NAMES = [
    'aarav sharma',
    'riya patel',
    'devansh verma',
    'pooja kulkarni',
    'karan malhotra'
  ];

  return result
    .filter((p) => !isDeleted(p))
    .filter((p) => !FORBIDDEN_DEMO_NAMES.includes((p.studentName || '').trim().toLowerCase()));
}

export const getAllStudentMentorshipProfiles = getAllStudentProfilesForAdmin;

/**
 * Permanently deletes a student from the mentorship portal and database.
 */
export async function deleteStudentMentorshipProfile(studentId: string): Promise<boolean> {
  const profiles = loadAllStoredProfiles();
  let targetProfile: StudentMentorshipProfile | null = null;
  let targetKey: string | null = null;

  for (const [key, p] of Object.entries(profiles)) {
    if (p.studentId === studentId || key === studentId) {
      targetProfile = p;
      targetKey = key;
      break;
    }
    if (
      (p.studentEmail && key.toLowerCase() === p.studentEmail.toLowerCase()) ||
      (p.studentPhone && key === p.studentPhone.replace(/\D/g, ''))
    ) {
      if (p.studentId === studentId) {
        targetProfile = p;
        targetKey = key;
        break;
      }
    }
  }

  if (targetKey) {
    delete profiles[targetKey];
  }
  // Also clean up any other keys pointing to same profile
  Object.keys(profiles).forEach((k) => {
    if (profiles[k].studentId === studentId) {
      delete profiles[k];
    }
  });
  saveAllStoredProfiles(profiles);

  // Add to deleted keys blacklist so it won't be resurrected
  try {
    const deletedList: string[] = JSON.parse(localStorage.getItem('hk_deleted_student_keys') || '[]');
    if (studentId) deletedList.push(studentId);
    if (targetProfile?.studentEmail) deletedList.push(targetProfile.studentEmail.toLowerCase());
    if (targetProfile?.studentPhone) deletedList.push(targetProfile.studentPhone.replace(/\D/g, ''));
    localStorage.setItem('hk_deleted_student_keys', JSON.stringify(Array.from(new Set(deletedList))));
  } catch (e) {
    // ignore
  }

  // Remove from hk_rankers_registered_users
  try {
    const rawUsers = localStorage.getItem('hk_rankers_registered_users');
    if (rawUsers) {
      const regUsers: any[] = JSON.parse(rawUsers);
      const filtered = regUsers.filter((u) => {
        if (u.id === studentId) return false;
        if (targetProfile?.studentEmail && u.email?.toLowerCase() === targetProfile.studentEmail.toLowerCase()) return false;
        if (targetProfile?.studentPhone && u.phone?.replace(/\D/g, '') === targetProfile.studentPhone.replace(/\D/g, '')) return false;
        return true;
      });
      localStorage.setItem('hk_rankers_registered_users', JSON.stringify(filtered));
    }
  } catch (e) {
    // ignore
  }

  // Remove from hk_local_enrollments
  try {
    const rawEnr = localStorage.getItem('hk_local_enrollments');
    if (rawEnr) {
      const enrs: any[] = JSON.parse(rawEnr);
      const filtered = enrs.filter((e) => {
        if (e.id === studentId) return false;
        if (targetProfile?.studentEmail && e.email?.toLowerCase() === targetProfile.studentEmail.toLowerCase()) return false;
        if (targetProfile?.studentPhone && e.phone?.replace(/\D/g, '') === targetProfile.studentPhone.replace(/\D/g, '')) return false;
        return true;
      });
      localStorage.setItem('hk_local_enrollments', JSON.stringify(filtered));
    }
  } catch (e) {
    // ignore
  }

  // Clear active admin viewing student if this student was selected
  try {
    const activeViewing = localStorage.getItem(ACTIVE_ADMIN_VIEW_KEY);
    if (
      activeViewing &&
      (activeViewing === studentId ||
        activeViewing === targetProfile?.studentEmail?.toLowerCase() ||
        activeViewing === targetProfile?.studentPhone?.replace(/\D/g, ''))
    ) {
      localStorage.removeItem(ACTIVE_ADMIN_VIEW_KEY);
    }
  } catch (e) {
    // ignore
  }

  // Background delete from Supabase if connected
  try {
    if (targetProfile?.studentEmail) {
      await supabase.from('mentorship_trackers').delete().eq('student_email', targetProfile.studentEmail.toLowerCase());
    }
    if (targetProfile?.studentPhone) {
      await supabase.from('mentorship_trackers').delete().eq('student_phone', targetProfile.studentPhone);
    }
  } catch (err) {
    console.warn('Supabase delete error:', err);
  }

  return true;
}

/**
 * Re-allocates student's Program, Level, and Group (Admin operation).
 * Automatically updates or regenerates their tracker while preserving existing custom progress.
 */
export function reassignStudentGroup(
  profile: StudentMentorshipProfile,
  newProgram: MentorshipProgram,
  newLevel: MentorshipLevel,
  newGroup: MentorshipGroup
): StudentMentorshipProfile {
  let assignedIndexId = 'exec-g1';
  if (newProgram === 'CS EET') assignedIndexId = 'cseet';
  else if (newProgram === 'CS Executive') {
    assignedIndexId = newGroup === 'Group 1' ? 'exec-g1' : newGroup === 'Group 2' ? 'exec-g2' : 'exec-both';
  } else if (newProgram === 'CS Professional') {
    assignedIndexId = newGroup === 'Group 1' ? 'prof-g1' : newGroup === 'Group 2' ? 'prof-g2' : 'prof-both';
  }

  const updatedTracker = generateDefaultChapters(newProgram, newGroup);

  const updatedProfile: StudentMentorshipProfile = {
    ...profile,
    program: newProgram,
    level: newLevel,
    group: newGroup,
    assignedIndexId,
    trackerRows: updatedTracker,
    updatedAt: new Date().toISOString(),
  };

  saveStudentMentorshipProfile(updatedProfile);
  return updatedProfile;
}

/**
 * Sets all tracking columns of all chapters to 'Pending' for a student profile.
 * Used when initializing or resetting index data as requested by Admin.
 */
export function setAllTrackerRowsToPending(
  profile: StudentMentorshipProfile,
  resetRedFlags: boolean = false
): StudentMentorshipProfile {
  const updatedRows = profile.trackerRows.map((r) => ({
    ...r,
    isChapterRed: resetRedFlags ? false : r.isChapterRed,
    isTopicRed: resetRedFlags ? false : r.isTopicRed,
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
  }));

  const updatedProfile: StudentMentorshipProfile = {
    ...profile,
    trackerRows: updatedRows,
    updatedAt: new Date().toISOString(),
  };

  saveStudentMentorshipProfile(updatedProfile);
  return updatedProfile;
}

export function applyCustomIndexToStudent(
  profile: StudentMentorshipProfile,
  newRows: TrackerRow[]
): StudentMentorshipProfile {
  const updatedProfile: StudentMentorshipProfile = {
    ...profile,
    trackerRows: newRows,
    updatedAt: new Date().toISOString(),
  };
  saveStudentMentorshipProfile(updatedProfile);
  return updatedProfile;
}

// -------------------------------------------------------------
// Admin Impersonation / View State
// -------------------------------------------------------------

export function setAdminViewingStudentId(studentKey: string | null): void {
  if (studentKey) {
    localStorage.setItem(ACTIVE_ADMIN_VIEW_KEY, studentKey);
  } else {
    localStorage.removeItem(ACTIVE_ADMIN_VIEW_KEY);
  }
}

export function getAdminViewingStudentId(): string | null {
  return localStorage.getItem(ACTIVE_ADMIN_VIEW_KEY);
}
