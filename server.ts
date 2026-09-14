import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json());

const DATA_DIR = path.join(process.cwd(), 'data');
const STUDENTS_FILE = path.join(DATA_DIR, 'central_students.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Ensure students file exists
if (!fs.existsSync(STUDENTS_FILE)) {
  fs.writeFileSync(STUDENTS_FILE, JSON.stringify([], null, 2), 'utf8');
}

const FORBIDDEN_DEMO_NAMES = [
  'aarav sharma',
  'riya patel',
  'devansh verma',
  'pooja kulkarni',
  'karan malhotra'
];

function readStudents(): any[] {
  try {
    const raw = fs.readFileSync(STUDENTS_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      // Strictly filter out any mock/seed students
      return parsed.filter(
        (s) => !FORBIDDEN_DEMO_NAMES.includes((s.fullName || '').trim().toLowerCase())
      );
    }
    return [];
  } catch (err) {
    console.error('Error reading students file:', err);
    return [];
  }
}

function writeStudents(students: any[]): boolean {
  try {
    const clean = students.filter(
      (s) => !FORBIDDEN_DEMO_NAMES.includes((s.fullName || '').trim().toLowerCase())
    );
    fs.writeFileSync(STUDENTS_FILE, JSON.stringify(clean, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error writing students file:', err);
    return false;
  }
}

// -------------------------------------------------------------
// API Endpoints
// -------------------------------------------------------------

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// GET all real registered students
app.get('/api/students', (_req, res) => {
  const students = readStudents();
  res.json({ success: true, count: students.length, data: students });
});

// POST register student
app.post('/api/students/register', (req, res) => {
  const { fullName, email, phone, program, level, group, password } = req.body;

  const cleanName = (fullName || '').trim();
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanPhone = (phone || '').replace(/\D/g, '');

  if (!cleanName || !cleanEmail || !cleanPhone || !password) {
    return res.status(400).json({
      success: false,
      message: 'All fields (name, email, phone, program, level/group, password) are required.',
    });
  }

  const students = readStudents();

  // Duplicate checks
  const existingEmail = students.find((s) => s.email?.toLowerCase() === cleanEmail);
  if (existingEmail) {
    return res.status(409).json({
      success: false,
      message: `An account with email ${cleanEmail} already exists. Please log in with your password.`,
    });
  }

  const existingPhone = students.find((s) => (s.phone || '').replace(/\D/g, '').slice(-10) === cleanPhone.slice(-10));
  if (existingPhone) {
    return res.status(409).json({
      success: false,
      message: `An account with phone number ${cleanPhone} already exists. Please log in with your password.`,
    });
  }

  const studentCount = students.length + 1;
  const studentId = `STU-2026-${String(studentCount).padStart(3, '0')}`;
  const targetExam = `${program || 'CS Executive'} — ${group || 'Group 1'}`;

  const newStudent = {
    studentId,
    fullName: cleanName,
    email: cleanEmail,
    phone: cleanPhone,
    program: program || 'CS Executive',
    level: level || 'Level 2',
    group: group || 'Group 1',
    targetExam,
    password,
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanName)}&background=C8A45D&color=000`,
    registrationStatus: 'approved',
    registeredAt: new Date().toISOString(),
    registrationApprovedAt: new Date().toISOString(),
    paymentStatus: 'unpaid',
    mentorshipAccess: false,
    studyIndexAccess: false,
    assignedIndexId: (program || '').includes('Professional')
      ? ((group || '').includes('2') ? 'prof-g2' : 'prof-g1')
      : (program || '').includes('EET')
      ? 'cseet'
      : ((group || '').includes('2') ? 'exec-g2' : 'exec-g1'),
    trackerRows: [],
    studyIndexRows: [],
    monthlyCalls: [],
    isActive: true,
    role: 'student',
    updatedAt: new Date().toISOString(),
  };

  students.unshift(newStudent);
  writeStudents(students);

  return res.json({
    success: true,
    message: `Account created successfully! Welcome to HK Code of Rankers, ${cleanName}.`,
    student: newStudent,
  });
});

// POST submit student course payment with 12-digit UTR
app.post('/api/students/payment', (req, res) => {
  const {
    studentId,
    email,
    fullName,
    phone,
    courseId,
    courseName,
    amount,
    discountCode,
    discountAmount,
    finalAmount,
    paymentMethod,
    transactionRef,
    utrNumber,
    paymentProofNotes,
  } = req.body;

  const rawUtr = (utrNumber || transactionRef || '').replace(/\D/g, '');
  if (!rawUtr || rawUtr.length < 10) {
    return res.status(400).json({
      success: false,
      message: 'A valid 12-digit UPI UTR / Transaction reference is required.',
    });
  }

  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanPhone = (phone || '').replace(/\D/g, '');
  const students = readStudents();

  let idx = students.findIndex(
    (s) =>
      (studentId && s.studentId === studentId) ||
      (cleanEmail && s.email?.toLowerCase() === cleanEmail) ||
      (cleanPhone && (s.phone || '').replace(/\D/g, '').slice(-10) === cleanPhone.slice(-10))
  );

  const orderId = `ORD-2026-${Date.now().toString().slice(-5)}`;

  if (idx === -1) {
    // Create student if not yet registered
    const studentCount = students.length + 1;
    const generatedId = studentId || `STU-2026-${String(studentCount).padStart(3, '0')}`;
    const newStudent = {
      studentId: generatedId,
      fullName: fullName || 'CS Aspirant',
      email: cleanEmail || `${generatedId.toLowerCase()}@student.hkcodeofrankers.com`,
      phone: cleanPhone || '',
      program: 'CS Executive',
      level: 'Level 2',
      group: 'Group 1',
      targetExam: courseName || 'CS Executive Group 1',
      password: 'registered_via_payment',
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName || 'Student')}&background=C8A45D&color=000`,
      registrationStatus: 'approved',
      registeredAt: new Date().toISOString(),
      registrationApprovedAt: new Date().toISOString(),
      paymentStatus: 'pending_approval',
      mentorshipAccess: false,
      studyIndexAccess: false,
      assignedIndexId: 'exec-g1',
      trackerRows: [],
      studyIndexRows: [],
      monthlyCalls: [],
      isActive: true,
      role: 'student',
      purchasedCourse: {
        courseId: courseId || 'course_default',
        courseName: courseName || 'CS Mentorship Course',
        amount: Number(amount) || 0,
        discountCodeUsed: discountCode,
        discountAmount: Number(discountAmount) || 0,
        finalAmount: Number(finalAmount) || Number(amount) || 0,
        orderId,
        paymentMethod: paymentMethod || 'UPI',
        transactionRef: rawUtr,
        utrNumber: rawUtr,
        paymentDate: new Date().toISOString(),
        paymentProofNotes: paymentProofNotes || `Direct UPI transfer with UTR: ${rawUtr}`,
        paymentStatus: 'pending_approval',
      },
      updatedAt: new Date().toISOString(),
    };
    students.unshift(newStudent);
    writeStudents(students);

    return res.json({
      success: true,
      message: `Payment submitted successfully (UTR: ${rawUtr})! It is now pending Admin Payment Approval.`,
      orderId,
      student: newStudent,
    });
  }

  const student = students[idx];
  student.paymentStatus = 'pending_approval';
  student.purchasedCourse = {
    courseId: courseId || student.purchasedCourse?.courseId || 'course_default',
    courseName: courseName || student.purchasedCourse?.courseName || 'CS Mentorship Course',
    amount: Number(amount) || student.purchasedCourse?.amount || 0,
    discountCodeUsed: discountCode || student.purchasedCourse?.discountCodeUsed,
    discountAmount: Number(discountAmount) || 0,
    finalAmount: Number(finalAmount) || Number(amount) || 0,
    orderId,
    paymentMethod: paymentMethod || 'UPI',
    transactionRef: rawUtr,
    utrNumber: rawUtr,
    paymentDate: new Date().toISOString(),
    paymentProofNotes: paymentProofNotes || `Direct UPI transfer with UTR: ${rawUtr}`,
    paymentStatus: 'pending_approval',
  };
  student.updatedAt = new Date().toISOString();

  writeStudents(students);

  return res.json({
    success: true,
    message: `Payment submitted successfully (UTR: ${rawUtr})! It is now pending Admin Payment Approval.`,
    orderId,
    student,
  });
});

// POST approve student payment (Admin)
app.post('/api/students/approve-payment', (req, res) => {
  const { studentId, adminName = 'Harkiran Kaur' } = req.body;
  if (!studentId) {
    return res.status(400).json({ success: false, message: 'Student ID is required.' });
  }

  const students = readStudents();
  const idx = students.findIndex((s) => s.studentId === studentId);
  if (idx === -1) {
    return res.status(404).json({ success: false, message: 'Student record not found.' });
  }

  const student = students[idx];
  student.paymentStatus = 'approved';
  student.paymentApprovedAt = new Date().toISOString();
  student.mentorshipAccess = true;
  student.studyIndexAccess = true;

  if (student.purchasedCourse) {
    student.purchasedCourse.paymentStatus = 'approved';
    student.purchasedCourse.reviewedBy = adminName;
    student.purchasedCourse.reviewedAt = new Date().toISOString();
  }

  student.updatedAt = new Date().toISOString();
  writeStudents(students);

  return res.json({
    success: true,
    message: `Payment for ${student.fullName} has been approved! Course access unlocked.`,
    student,
  });
});

// POST reject student payment (Admin)
app.post('/api/students/reject-payment', (req, res) => {
  const { studentId, reason = 'Payment UTR could not be verified in bank records.' } = req.body;
  if (!studentId) {
    return res.status(400).json({ success: false, message: 'Student ID is required.' });
  }

  const students = readStudents();
  const idx = students.findIndex((s) => s.studentId === studentId);
  if (idx === -1) {
    return res.status(404).json({ success: false, message: 'Student record not found.' });
  }

  const student = students[idx];
  student.paymentStatus = 'rejected';
  student.mentorshipAccess = false;
  student.studyIndexAccess = false;

  if (student.purchasedCourse) {
    student.purchasedCourse.paymentStatus = 'rejected';
    student.purchasedCourse.rejectionReason = reason;
    student.purchasedCourse.rejectedAt = new Date().toISOString();
  }

  student.updatedAt = new Date().toISOString();
  writeStudents(students);

  return res.json({
    success: true,
    message: `Payment for ${student.fullName} has been rejected.`,
    student,
  });
});

// POST manually add student (Admin)
app.post('/api/students/manual-add', (req, res) => {
  const {
    fullName,
    email,
    phone,
    program,
    level,
    group,
    initialPaymentStatus,
    courseName,
    amount,
    utrNumber,
  } = req.body;

  const cleanName = (fullName || '').trim();
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanPhone = (phone || '').replace(/\D/g, '');

  if (!cleanName || !cleanEmail || !cleanPhone) {
    return res.status(400).json({
      success: false,
      message: 'Student Name, Email, and Phone are required.',
    });
  }

  const students = readStudents();

  // Duplicate checks
  if (students.some((s) => s.email?.toLowerCase() === cleanEmail)) {
    return res.status(409).json({
      success: false,
      message: `A student with email ${cleanEmail} already exists.`,
    });
  }
  if (students.some((s) => (s.phone || '').replace(/\D/g, '').slice(-10) === cleanPhone.slice(-10))) {
    return res.status(409).json({
      success: false,
      message: `A student with phone number ${cleanPhone} already exists.`,
    });
  }

  const studentCount = students.length + 1;
  const studentId = `STU-2026-${String(studentCount).padStart(3, '0')}`;
  const isApproved = initialPaymentStatus === 'approved';
  const cleanUtr = (utrNumber || '').replace(/\D/g, '');
  const parsedAmount = Number(amount) || (cleanUtr ? 2999 : 0);

  const newStudent = {
    studentId,
    fullName: cleanName,
    email: cleanEmail,
    phone: cleanPhone,
    program: program || 'CS Executive',
    level: level || 'Level 2',
    group: group || 'Group 1',
    targetExam: `${program || 'CS Executive'} — ${group || 'Group 1'}`,
    password: 'student_manual_default',
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanName)}&background=C8A45D&color=000`,
    registrationStatus: 'approved',
    registeredAt: new Date().toISOString(),
    registrationApprovedAt: new Date().toISOString(),
    paymentStatus: isApproved ? 'approved' : cleanUtr ? 'pending_approval' : 'unpaid',
    paymentApprovedAt: isApproved ? new Date().toISOString() : undefined,
    mentorshipAccess: isApproved,
    studyIndexAccess: isApproved,
    assignedIndexId: (program || '').includes('Professional')
      ? ((group || '').includes('2') ? 'prof-g2' : 'prof-g1')
      : (program || '').includes('EET')
      ? 'cseet'
      : ((group || '').includes('2') ? 'exec-g2' : 'exec-g1'),
    trackerRows: [],
    studyIndexRows: [],
    monthlyCalls: [],
    isActive: true,
    role: 'student',
    purchasedCourse: (cleanUtr || isApproved || courseName) ? {
      courseId: 'manual_enrollment',
      courseName: courseName || `${program || 'CS Executive'} (${group || 'Group 1'}) Mentorship`,
      amount: parsedAmount,
      finalAmount: parsedAmount,
      orderId: `ORD-MANUAL-${Date.now().toString().slice(-4)}`,
      paymentMethod: 'UPI',
      transactionRef: cleanUtr || 'MANUAL-ADMIN-ENROLLED',
      utrNumber: cleanUtr || 'MANUAL-ADMIN',
      paymentDate: new Date().toISOString(),
      paymentStatus: isApproved ? 'approved' : 'pending_approval',
    } : undefined,
    updatedAt: new Date().toISOString(),
  };

  students.unshift(newStudent);
  writeStudents(students);

  return res.json({
    success: true,
    message: `Student ${cleanName} added successfully!`,
    student: newStudent,
  });
});

// DELETE student (Admin)
app.delete('/api/students/:id', (req, res) => {
  const { id } = req.params;
  let students = readStudents();
  const initialLen = students.length;
  students = students.filter(
    (s) => s.studentId !== id && s.email?.toLowerCase() !== id.toLowerCase()
  );

  if (students.length === initialLen) {
    return res.status(404).json({ success: false, message: 'Student not found.' });
  }

  writeStudents(students);
  return res.json({ success: true, message: 'Student removed successfully.' });
});

// -------------------------------------------------------------
// Vite Middleware / Static Asset Serving
// -------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
