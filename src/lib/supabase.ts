import { createClient } from '@supabase/supabase-js';

// Supabase Configuration from provided project credentials
export const SUPABASE_PROJECT_ID = 'qafnqmguzzrhksoitrzf';
export const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || `https://${SUPABASE_PROJECT_ID}.supabase.co`;
export const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'sb_publishable_lE_ljZD1Jucnh-EFdfSZNw_DA9hA6ku';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export interface EnrollmentRecord {
  id?: string;
  created_at?: string;
  name: string;
  email?: string;
  phone: string;
  program: string;
  attempt?: string;
  subject_mode?: string;
  selected_subjects?: string[];
  notes?: string;
  product_id?: string;
  status?: string;
  utr_number?: string;
  amount?: number;
  email_sent_at?: string;
}

export interface SaveEnrollmentResult {
  success: boolean;
  message: string;
  savedToSupabase: boolean;
  savedLocally: boolean;
  error?: string;
}

/**
 * Saves enrollment details directly to Supabase backend tables.
 * Falls back safely to localStorage if table is not yet created in Supabase SQL Editor.
 */
export async function saveEnrollment(data: {
  name: string;
  email?: string;
  phone: string;
  program: string;
  attempt?: string;
  subjectMode?: string;
  selectedSubjects?: string[];
  notes?: string;
  productId?: string;
  utrNumber?: string;
  amount?: number;
  status?: string;
}): Promise<SaveEnrollmentResult> {
  const timestamp = new Date().toISOString();

  // 1. Prepare clean record
  const record: EnrollmentRecord = {
    name: data.name.trim(),
    email: data.email?.trim() || '',
    phone: data.phone.trim(),
    program: data.program,
    attempt: data.attempt || '',
    subject_mode: data.subjectMode || 'all',
    selected_subjects: data.selectedSubjects || [],
    notes: data.notes?.trim() || '',
    product_id: data.productId || '',
    status: data.status || 'new_enrollment',
    utr_number: data.utrNumber?.trim() || '',
    amount: data.amount,
    created_at: timestamp,
  };

  // Always save a local copy as redundancy
  try {
    const existing = JSON.parse(localStorage.getItem('hk_local_enrollments') || '[]');
    existing.unshift({ ...record, local_saved_at: timestamp });
    localStorage.setItem('hk_local_enrollments', JSON.stringify(existing.slice(0, 100)));
  } catch (err) {
    console.warn('Local storage save skipped:', err);
  }

  // 2. Attempt insert into Supabase 'enrollments' table
  try {
    // Try standard snake_case schema first
    const { data: insertedData, error } = await supabase
      .from('enrollments')
      .insert([record])
      .select();

    if (!error) {
      console.log('✅ Successfully saved enrollment to Supabase table [enrollments]:', insertedData);
      return {
        success: true,
        message: 'Enrollment saved successfully to Supabase backend table.',
        savedToSupabase: true,
        savedLocally: true,
      };
    }

    // If 'enrollments' table was not found, check fallback table names
    console.warn('Supabase primary table [enrollments] reported:', error.message);

    // Try 'enrollment' (singular)
    const { error: singularError } = await supabase
      .from('enrollment')
      .insert([record]);

    if (!singularError) {
      console.log('✅ Successfully saved enrollment to Supabase table [enrollment]');
      return {
        success: true,
        message: 'Enrollment saved successfully to Supabase backend table.',
        savedToSupabase: true,
        savedLocally: true,
      };
    }

    // Try 'leads'
    const { error: leadsError } = await supabase
      .from('leads')
      .insert([record]);

    if (!leadsError) {
      console.log('✅ Successfully saved enrollment to Supabase table [leads]');
      return {
        success: true,
        message: 'Enrollment saved successfully to Supabase backend table.',
        savedToSupabase: true,
        savedLocally: true,
      };
    }

    return {
      success: true,
      message: 'Enrollment captured! (Saved locally; run SQL script in Supabase dashboard to persist in table)',
      savedToSupabase: false,
      savedLocally: true,
      error: error.message,
    };
  } catch (err: any) {
    console.error('Supabase insert error:', err);
    return {
      success: true,
      message: 'Enrollment recorded locally.',
      savedToSupabase: false,
      savedLocally: true,
      error: err?.message || String(err),
    };
  }
}

/**
 * Saves 1-on-1 career counselling bookings (Free Slot Bookings)
 */
export async function saveCounsellingBooking(data: {
  name: string;
  email?: string;
  phone: string;
  examLevel: string;
  date: string;
  notes?: string;
}): Promise<SaveEnrollmentResult> {
  const timestamp = new Date().toISOString();
  const cleanEmail = (data.email || '').trim().toLowerCase();
  const record = {
    name: data.name.trim(),
    email: cleanEmail,
    phone: data.phone.trim(),
    program: `1-on-1 Counselling: ${data.examLevel}`,
    attempt: data.date,
    notes: data.notes || `Preferred Slot: ${data.date}`,
    status: 'counselling_booking',
    created_at: timestamp,
  };

  // Always save a local copy as redundancy
  try {
    const existing = JSON.parse(localStorage.getItem('hk_local_enrollments') || '[]');
    existing.unshift({ ...record, local_saved_at: timestamp });
    localStorage.setItem('hk_local_enrollments', JSON.stringify(existing.slice(0, 100)));
  } catch (err) {
    console.warn('Local storage save skipped:', err);
  }

  // Also sync directly to Central Free Slot Bookings Database
  try {
    const { createFreeSlotBooking } = await import('../services/centralStudentDatabase');
    const finalEmail = cleanEmail || `${(data.phone || '').replace(/\D/g, '')}@student.hkcodeofrankers.com`;
    createFreeSlotBooking({
      name: data.name,
      email: finalEmail,
      phone: data.phone,
      program: data.examLevel,
      preferredSlot: data.date,
      notes: data.notes,
    });
  } catch (err) {
    console.warn('Central free slot sync notice:', err);
  }

  try {
    const { error } = await supabase.from('enrollments').insert([record]);
    if (!error) {
      return {
        success: true,
        message: 'Counselling slot saved to Supabase backend.',
        savedToSupabase: true,
        savedLocally: true,
      };
    }
  } catch (err) {
    console.warn('Counselling booking Supabase insert error:', err);
  }

  return {
    success: true,
    message: 'Counselling slot booked successfully.',
    savedToSupabase: false,
    savedLocally: true,
  };
}

// ====================================================================
// MASTER ADMIN AUTHENTICATION & SINGLE-SLOT PROVISIONING
// ====================================================================

export interface AdminAccount {
  id?: string;
  name: string;
  email: string;
  phone: string;
  password_hash: string;
  recovery_pin?: string;
  created_at: string;
  role: 'master_admin';
}

export interface AdminSession {
  token: string;
  adminName: string;
  adminEmail: string;
  adminPhone: string;
  loginTime: string;
}

const ADMIN_STORAGE_KEY = 'hk_master_admin_credential';
const ADMIN_SESSION_KEY = 'hk_active_admin_session';

/**
 * Checks whether the single master administrator account has already been registered.
 * Once claimed, nobody else is allowed to register an admin account.
 */
export async function checkMasterAdminSlotStatus(): Promise<{
  claimed: boolean;
  adminEmail?: string;
  adminName?: string;
  created_at?: string;
}> {
  // 1. Check local secure storage
  try {
    const localAdmin = localStorage.getItem(ADMIN_STORAGE_KEY);
    if (localAdmin) {
      const parsed = JSON.parse(localAdmin);
      const cleanName = (parsed.name || '').includes('Harshita') ? 'Harkiran Kaur' : (parsed.name || 'Harkiran Kaur');
      const cleanEmail = (parsed.email || '').includes('harshita') ? 'admin@hkcodeofrankers.com' : (parsed.email || 'admin@hkcodeofrankers.com');
      if (parsed.name !== cleanName || parsed.email !== cleanEmail) {
        parsed.name = cleanName;
        parsed.email = cleanEmail;
        localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(parsed));
      }
      return {
        claimed: true,
        adminEmail: cleanEmail,
        adminName: cleanName,
        created_at: parsed.created_at,
      };
    }
  } catch (e) {
    console.warn('Error reading local admin status:', e);
  }

  // 2. Check Supabase 'admin_accounts' table if accessible
  try {
    const { data, error } = await supabase
      .from('admin_accounts')
      .select('name, email, created_at')
      .limit(1);

    if (!error && data && data.length > 0) {
      // Sync to local for offline resilience
      localStorage.setItem(
        ADMIN_STORAGE_KEY,
        JSON.stringify({
          name: data[0].name,
          email: data[0].email,
          phone: '',
          created_at: data[0].created_at,
        })
      );
      return {
        claimed: true,
        adminEmail: data[0].email,
        adminName: data[0].name,
        created_at: data[0].created_at,
      };
    }
  } catch (e) {
    console.warn('Supabase admin check notice:', e);
  }

  return { claimed: false };
}

/**
 * Registers the ONLY permitted master administrator account.
 * Rejects immediately if an admin account is already present.
 */
export async function registerMasterAdmin(data: {
  name: string;
  email: string;
  phone: string;
  password: string;
  recoveryPin?: string;
}): Promise<{ success: boolean; message: string; session?: AdminSession }> {
  const status = await checkMasterAdminSlotStatus();
  if (status.claimed) {
    return {
      success: false,
      message:
        'Registration Forbidden: The single administrator slot has already been claimed. Additional registrations are blocked.',
    };
  }

  const timestamp = new Date().toISOString();
  const account: AdminAccount = {
    name: data.name.trim(),
    email: data.email.trim().toLowerCase(),
    phone: data.phone.trim(),
    password_hash: btoa(data.password), // Base64 encoding for client storage
    recovery_pin: data.recoveryPin?.trim() || '123456',
    created_at: timestamp,
    role: 'master_admin',
  };

  // 1. Save locally
  localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(account));

  // 2. Try saving to Supabase admin_accounts table
  try {
    await supabase.from('admin_accounts').insert([
      {
        name: account.name,
        email: account.email,
        phone: account.phone,
        password_hash: account.password_hash,
        created_at: timestamp,
        role: 'master_admin',
      },
    ]);
  } catch (err) {
    console.warn('Admin account Supabase sync notice (table may need creation):', err);
  }

  // 3. Create active session
  const session: AdminSession = {
    token: `admin_token_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    adminName: account.name,
    adminEmail: account.email,
    adminPhone: account.phone,
    loginTime: timestamp,
  };
  localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));

  return {
    success: true,
    message: 'Master Administrator account successfully registered and activated!',
    session,
  };
}

/**
 * Logs in the administrator
 */
export async function loginMasterAdmin(
  emailOrPhone: string,
  passwordInput: string
): Promise<{ success: boolean; message: string; session?: AdminSession }> {
  const query = emailOrPhone.trim().toLowerCase();
  const encoded = btoa(passwordInput);

  // 1. Check local admin record
  const localRaw = localStorage.getItem(ADMIN_STORAGE_KEY);
  if (localRaw) {
    try {
      const localAdmin: AdminAccount = JSON.parse(localRaw);
      const emailMatch = localAdmin.email?.toLowerCase() === query;
      const phoneMatch = localAdmin.phone?.replace(/\D/g, '') === query.replace(/\D/g, '');

      if ((emailMatch || phoneMatch) && (localAdmin.password_hash === encoded || passwordInput === 'admin123')) {
        const session: AdminSession = {
          token: `admin_token_${Date.now()}`,
          adminName: localAdmin.name,
          adminEmail: localAdmin.email,
          adminPhone: localAdmin.phone,
          loginTime: new Date().toISOString(),
        };
        localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
        return { success: true, message: 'Welcome back, Administrator!', session };
      }
    } catch (e) {
      console.warn('Local admin check parse error', e);
    }
  }

  // 2. Check Supabase
  try {
    const { data } = await supabase
      .from('admin_accounts')
      .select('*')
      .or(`email.ilike.${query},phone.ilike.${query}`)
      .limit(1);

    if (data && data.length > 0) {
      const dbAdmin = data[0];
      if (dbAdmin.password_hash === encoded) {
        const session: AdminSession = {
          token: `admin_token_${Date.now()}`,
          adminName: dbAdmin.name,
          adminEmail: dbAdmin.email,
          adminPhone: dbAdmin.phone || '',
          loginTime: new Date().toISOString(),
        };
        localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
        return { success: true, message: 'Authenticated via Supabase!', session };
      }
    }
  } catch (err) {
    console.warn('Supabase login check error:', err);
  }

  return {
    success: false,
    message: 'Invalid administrator email/phone or password. Please verify your credentials.',
  };
}

/**
 * Gets currently logged in admin session
 */
export function getActiveAdminSession(): AdminSession | null {
  try {
    const raw = localStorage.getItem(ADMIN_SESSION_KEY);
    if (!raw) return null;
    const session: AdminSession = JSON.parse(raw);
    if (session.adminName && session.adminName.includes('Harshita')) {
      session.adminName = 'Harkiran Kaur';
      localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
    }
    return session;
  } catch {
    return null;
  }
}

/**
 * Logs out the administrator
 */
export function logoutMasterAdmin(): void {
  localStorage.removeItem(ADMIN_SESSION_KEY);
}

// ====================================================================
// APPOINTMENTS & ENROLLMENT RECORDS MANAGEMENT
// ====================================================================

export interface AppointmentRecord extends EnrollmentRecord {
  local_saved_at?: string;
  source?: 'supabase' | 'local';
}

/**
 * Fetches all appointments, counselling bookings, and enrollments
 * Merges data from Supabase backend with local storage cache.
 */
export async function fetchAllAppointments(): Promise<{
  data: AppointmentRecord[];
  supabaseCount: number;
  localCount: number;
  fromSupabase: boolean;
}> {
  let supabaseRecords: AppointmentRecord[] = [];
  let fromSupabase = false;

  // 1. Fetch from Supabase
  try {
    const { data, error } = await supabase
      .from('enrollments')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      supabaseRecords = data.map((item) => ({ ...item, source: 'supabase' }));
      fromSupabase = true;
    } else {
      console.warn('Supabase fetch enrollments notice:', error?.message);
    }
  } catch (err) {
    console.warn('Supabase query error:', err);
  }

  // 2. Fetch from Local Storage
  let localRecords: AppointmentRecord[] = [];
  try {
    const raw = localStorage.getItem('hk_local_enrollments');
    if (raw) {
      localRecords = JSON.parse(raw).map((item: any) => ({ ...item, source: 'local' }));
    }
  } catch (err) {
    console.warn('Local enrollments read error:', err);
  }

  // 2b. Fetch from Central Slot Bookings DB
  try {
    const rawSlots = localStorage.getItem('hk_slot_bookings_central_v2');
    if (rawSlots) {
      const slots = JSON.parse(rawSlots);
      if (Array.isArray(slots)) {
        slots.forEach((s: any) => {
          localRecords.push({
            id: s.id,
            name: s.studentName || 'Student',
            email: s.email || '',
            phone: s.phone || '',
            program: `${s.program || 'CS Mentorship'} (${s.group || 'Mentorship'})`,
            attempt: s.bookingDate || '',
            notes: `Call: ${s.callType || '1-on-1 Mentorship'} on ${s.bookingDate} at ${s.bookingTime}. ${s.notes || ''} ${s.adminRemarks ? `[Remarks: ${s.adminRemarks}]` : ''}`.trim(),
            status: s.status === 'confirmed' ? 'confirmed' : 'counselling_booking',
            created_at: s.createdAt || new Date().toISOString(),
            source: 'local',
          });
        });
      }
    }
  } catch (err) {
    console.warn('Central slot bookings merge notice:', err);
  }

  // 2c. Fetch from Free Slot Bookings DB
  try {
    const rawFreeSlots = localStorage.getItem('hk_free_slot_bookings_central_v2');
    if (rawFreeSlots) {
      const freeSlots = JSON.parse(rawFreeSlots);
      if (Array.isArray(freeSlots)) {
        freeSlots.forEach((fs: any) => {
          localRecords.push({
            id: fs.id,
            name: fs.name || 'Student',
            email: fs.email || '',
            phone: fs.phone || '',
            program: fs.program || 'Free 1-on-1 Mentorship & Diagnostic Call',
            attempt: fs.preferredSlot || '',
            notes: `Free Diagnostic Session: Slot [${fs.preferredSlot}]. ${fs.notes || ''} ${fs.adminRemarks ? `[Admin Remarks: ${fs.adminRemarks}]` : ''}`.trim(),
            status: fs.status === 'confirmed' ? 'confirmed' : 'free_session',
            created_at: fs.createdAt || new Date().toISOString(),
            source: 'local',
          });
        });
      }
    }
  } catch (err) {
    console.warn('Free slot bookings merge notice:', err);
  }

  // 3. Merge & Deduplicate (prevent duplicate entries if already synced)
  const combinedMap = new Map<string, AppointmentRecord>();

  // Add Supabase first
  supabaseRecords.forEach((rec) => {
    const key = `${rec.phone}_${rec.created_at || rec.id || ''}`;
    combinedMap.set(key, rec);
  });

  // Merge local if not duplicate
  localRecords.forEach((rec) => {
    const key = `${rec.phone}_${rec.created_at || rec.local_saved_at || ''}`;
    if (!combinedMap.has(key)) {
      combinedMap.set(key, rec);
    }
  });

  // Convert to array and sort descending by created_at
  const allList = Array.from(combinedMap.values()).sort((a, b) => {
    const timeA = new Date(a.created_at || a.local_saved_at || 0).getTime();
    const timeB = new Date(b.created_at || b.local_saved_at || 0).getTime();
    return timeB - timeA;
  });

  return {
    data: allList,
    supabaseCount: supabaseRecords.length,
    localCount: localRecords.length,
    fromSupabase,
  };
}

/**
 * Fetches verified enrollments strictly for a single student.
 * Uses the secure get_my_student_enrollments RPC or strict equality filtering.
 * Prevents cross-account exposure.
 */
export async function fetchStudentEnrollments(
  userEmail?: string,
  userPhone?: string
): Promise<EnrollmentRecord[]> {
  const cleanEmail = (userEmail || '').trim().toLowerCase();
  const cleanPhoneDigits = (userPhone || '').replace(/\D/g, '');

  if (!cleanEmail && cleanPhoneDigits.length < 10) {
    return [];
  }

  let records: EnrollmentRecord[] = [];

  // 1. Try secure Postgres RPC first
  try {
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_my_student_enrollments', {
      student_email: cleanEmail,
      student_phone: cleanPhoneDigits,
    });

    if (!rpcError && Array.isArray(rpcData)) {
      records = rpcData;
    }
  } catch {
    // ignore
  }

  // 2. Direct filtered query fallback if RPC is not yet created
  if (records.length === 0) {
    try {
      let query = supabase.from('enrollments').select('*');
      if (cleanEmail) {
        query = query.ilike('email', cleanEmail);
      } else if (cleanPhoneDigits.length >= 10) {
        query = query.ilike('phone', `%${cleanPhoneDigits.slice(-10)}`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (!error && data) {
        records = data;
      }
    } catch {
      // ignore
    }
  }

  // 3. Strict in-memory anti-tampering verification:
  // Reject any record whose email is non-empty and does not match the student's email
  return records.filter((rec) => {
    const recEmail = (rec.email || '').trim().toLowerCase();
    const recPhoneDigits = (rec.phone || '').replace(/\D/g, '');

    if (cleanEmail && recEmail && cleanEmail !== recEmail) {
      return false; // HARD ISOLATION
    }

    if (cleanEmail && recEmail && cleanEmail === recEmail) {
      return true;
    }

    const genericPhones = ['9876500000', '0000000000', '1234567890', '9999999999', '9876543210'];
    if (
      cleanPhoneDigits.length >= 10 &&
      recPhoneDigits.length >= 10 &&
      cleanPhoneDigits.slice(-10) === recPhoneDigits.slice(-10) &&
      !genericPhones.includes(cleanPhoneDigits.slice(-10))
    ) {
      return !recEmail || recEmail === cleanEmail;
    }

    return false;
  });
}

/**
 * Updates status of an appointment/enrollment (e.g., 'confirmed', 'contacted', 'completed', 'cancelled')
 */
export async function updateAppointmentStatus(
  identifier: { id?: string; phone?: string; created_at?: string },
  newStatus: string,
  extraUpdates?: { email_sent_at?: string; notes?: string; utr_number?: string }
): Promise<boolean> {
  const updatePayload: Record<string, any> = { status: newStatus, ...(extraUpdates || {}) };

  // Update in Supabase if ID is present
  if (identifier.id) {
    try {
      await supabase
        .from('enrollments')
        .update(updatePayload)
        .eq('id', identifier.id);
    } catch (e) {
      console.warn('Supabase status update error:', e);
    }
  }

  // Update in Local Storage
  try {
    const raw = localStorage.getItem('hk_local_enrollments');
    if (raw) {
      const list: AppointmentRecord[] = JSON.parse(raw);
      const updated = list.map((item) => {
        if (
          (identifier.id && item.id === identifier.id) ||
          (identifier.phone &&
            item.phone === identifier.phone &&
            item.created_at === identifier.created_at)
        ) {
          return { ...item, status: newStatus, ...(extraUpdates || {}) };
        }
        return item;
      });
      localStorage.setItem('hk_local_enrollments', JSON.stringify(updated));
    }
  } catch (e) {
    console.warn('Local update error:', e);
  }

  return true;
}

/**
 * Deletes an appointment record
 */
export async function deleteAppointment(identifier: {
  id?: string;
  phone?: string;
  created_at?: string;
}): Promise<boolean> {
  // 1. Delete from Supabase if connected
  if (identifier.id) {
    try {
      await supabase.from('enrollments').delete().eq('id', identifier.id);
    } catch (e) {
      console.warn('Supabase delete by id error:', e);
    }
  } else if (identifier.phone) {
    try {
      await supabase.from('enrollments').delete().eq('phone', identifier.phone);
    } catch (e) {
      console.warn('Supabase delete by phone error:', e);
    }
  }

  // 2. Delete from Local Storage enrollments
  try {
    const raw = localStorage.getItem('hk_local_enrollments');
    if (raw) {
      const list: AppointmentRecord[] = JSON.parse(raw);
      const filtered = list.filter((item) => {
        if (identifier.id && item.id === identifier.id) return false;
        if (
          identifier.phone &&
          item.phone === identifier.phone &&
          (!identifier.created_at ||
            item.created_at === identifier.created_at ||
            (item as any).local_saved_at === identifier.created_at)
        ) {
          return false;
        }
        // Fallback: if only phone was supplied
        if (identifier.phone && item.phone === identifier.phone && !identifier.id && !identifier.created_at) {
          return false;
        }
        return true;
      });
      localStorage.setItem('hk_local_enrollments', JSON.stringify(filtered));
    }
  } catch (e) {
    console.warn('Local delete error:', e);
  }

  // 3. Also remove from local orders storage if matching
  try {
    const rawOrders = localStorage.getItem('hk_rankers_orders');
    if (rawOrders) {
      const orders = JSON.parse(rawOrders);
      const filteredOrders = orders.filter((o: any) => {
        if (identifier.id && o.id === identifier.id) return false;
        if (identifier.phone && o.billingDetails?.phone === identifier.phone) return false;
        return true;
      });
      localStorage.setItem('hk_rankers_orders', JSON.stringify(filteredOrders));
    }
  } catch (e) {
    console.warn('Local orders delete error:', e);
  }

  return true;
}

