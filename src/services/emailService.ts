/**
 * HK Code of Rankers — Automated Student Email Service
 * Sends official enrollment confirmation emails with Academy Logo and Harkiran Kaur's signature
 */

export interface StudentConfirmationEmailData {
  studentName: string;
  studentEmail: string;
  studentPhone: string;
  programName: string;
  amount: number;
  utrNumber: string;
  orderNumber: string;
  confirmedDate?: string;
}

export interface DispatchedEmailRecord {
  id: string;
  recipientEmail: string;
  studentName: string;
  orderNumber: string;
  utrNumber: string;
  subject: string;
  status: 'DELIVERED' | 'DISPATCHED';
  sentAt: string;
  previewHtml: string;
}

export interface StudentApprovalEmailData {
  studentName: string;
  studentEmail: string;
  studentPhone?: string;
  programName?: string;
  approvedDate?: string;
  orderNumber?: string;
  notes?: string;
}

const SENT_EMAILS_STORAGE_KEY = 'hk_dispatched_student_emails';

/**
 * Generates an official, beautifully styled HTML email template for HK Code of Rankers
 */
export function generateStudentConfirmationEmailHtml(data: StudentConfirmationEmailData): string {
  const cleanDate =
    data.confirmedDate ||
    new Date().toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Enrollment Confirmed — HK Code of Rankers</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #F8F6F2;
      color: #1A1A1A;
      line-height: 1.6;
    }
    .email-container {
      max-width: 620px;
      margin: 30px auto;
      background: #FFFFFF;
      border-radius: 16px;
      overflow: hidden;
      border: 1px solid #E5DFD3;
      box-shadow: 0 4px 20px rgba(0,0,0,0.06);
    }
    .email-header {
      background: #0F0F0F;
      padding: 32px 24px;
      text-align: center;
      border-bottom: 3px solid #C8A45D;
    }
    .logo-container {
      width: 72px;
      height: 72px;
      margin: 0 auto 16px auto;
      border-radius: 50%;
      background: #1A1815;
      border: 2px solid #C8A45D;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .brand-title {
      font-size: 22px;
      font-weight: 800;
      letter-spacing: 1.5px;
      color: #FFE3A0;
      margin: 0;
      text-transform: uppercase;
    }
    .brand-subtitle {
      font-size: 11px;
      letter-spacing: 2px;
      color: #D4AF37;
      margin: 6px 0 0 0;
      text-transform: uppercase;
      font-weight: 600;
    }
    .badge-bar {
      background: #FAF5E9;
      padding: 12px 24px;
      text-align: center;
      border-bottom: 1px solid #EDE6D8;
    }
    .badge-text {
      display: inline-block;
      background: #10B981;
      color: #FFFFFF;
      font-size: 11px;
      font-weight: 700;
      padding: 4px 14px;
      border-radius: 20px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .email-body {
      padding: 32px 28px;
    }
    .greeting {
      font-size: 18px;
      font-weight: 700;
      color: #0F0F0F;
      margin-top: 0;
      margin-bottom: 14px;
    }
    .lead-text {
      font-size: 14px;
      color: #4A4A4A;
      margin-bottom: 24px;
    }
    .details-card {
      background: #FAF7F2;
      border: 1px solid #EADBCE;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 26px;
    }
    .details-title {
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #8A651E;
      margin: 0 0 14px 0;
      border-bottom: 1px solid #E5D9C3;
      padding-bottom: 8px;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 7px 0;
      font-size: 13px;
      border-bottom: 1px dashed #EAE2D4;
    }
    .detail-row:last-child {
      border-bottom: none;
    }
    .detail-label {
      color: #737373;
      font-weight: 500;
    }
    .detail-value {
      font-weight: 700;
      color: #0F0F0F;
      text-align: right;
    }
    .utr-highlight {
      font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
      color: #059669;
      background: #D1FAE5;
      padding: 2px 8px;
      border-radius: 6px;
      font-size: 13px;
    }
    .next-steps-card {
      background: #FFFBEB;
      border: 1px solid #FCD34D;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 26px;
    }
    .next-steps-title {
      font-size: 14px;
      font-weight: 700;
      color: #92400E;
      margin: 0 0 10px 0;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .next-steps-list {
      margin: 0;
      padding-left: 18px;
      font-size: 13px;
      color: #78350F;
    }
    .next-steps-list li {
      margin-bottom: 8px;
    }
    .signoff {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #EAE5D9;
    }
    .mentor-name {
      font-size: 15px;
      font-weight: 800;
      color: #0F0F0F;
      margin: 0;
    }
    .mentor-cred {
      font-size: 12px;
      color: #8A651E;
      font-weight: 600;
      margin: 2px 0 0 0;
    }
    .email-footer {
      background: #141210;
      padding: 24px;
      text-align: center;
      font-size: 11px;
      color: #9CA3AF;
      border-top: 1px solid #2B2823;
    }
    .footer-links {
      margin-top: 10px;
    }
    .footer-links a {
      color: #C8A45D;
      text-decoration: none;
      margin: 0 8px;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <!-- Header -->
    <div class="email-header">
      <div class="logo-container">
        <!-- Official Crisp HK Code of Rankers Emblem -->
        <svg width="60" height="60" viewBox="0 0 500 500" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="250" cy="250" r="246" fill="#0A0A0A" />
          <circle cx="250" cy="250" r="238" fill="none" stroke="#C8A45D" stroke-width="16" />
          <circle cx="250" cy="250" r="228" fill="#FAF6EE" />
          <path d="M 84 250 C 84 148 144 95 204 84 C 136 108 102 165 102 250 C 102 335 140 392 208 416 C 142 404 84 352 84 250 Z" fill="#D4AF37" />
          <path d="M 132 110 L 194 110 L 194 124 L 180 124 L 180 274 L 194 274 L 194 288 L 132 288 L 132 274 L 146 274 L 146 124 L 132 124 Z" fill="#0F0F0F" />
          <path d="M 224 110 L 286 110 L 286 124 L 272 124 L 272 195 L 238 195 L 238 124 L 224 124 Z" fill="#0F0F0F" />
          <path d="M 178 180 L 240 180 L 240 208 L 178 208 Z" fill="#0F0F0F" />
          <path d="M 138 294 C 184 242 234 186 288 136 C 324 103 358 79 374 69 L 360 63 C 320 89 274 131 218 186 C 170 233 132 283 129 296 Z" fill="#D4AF37" />
          <polygon points="242,192 355,80 376,98 252,216" fill="#F7DA85" />
          <polygon points="250,202 388,300 368,322 232,228" fill="#B38A24" />
          <!-- 3D Star -->
          <polygon points="358,22 368,46 394,48 374,66 380,92 358,78 336,92 342,66 322,48 348,46" fill="#FFEAA7" stroke="#AA8022" stroke-width="2" />
          <!-- Mentor & Student on Book -->
          <circle cx="218" cy="250" r="10" fill="#D4AF37" />
          <path d="M 218 262 L 202 312 L 222 312 L 228 274 Z" fill="#D4AF37" />
          <path d="M 224 270 L 254 286 L 220 276 Z" fill="#D4AF37" />
          <circle cx="282" cy="285" r="8.5" fill="#0F0F0F" />
          <path d="M 280 295 L 292 334 L 274 334 L 272 304 Z" fill="#0F0F0F" />
          <path d="M 274 300 L 252 288 L 270 306 Z" fill="#0F0F0F" />
          <path d="M 160 365 C 215 348 248 358 248 374 L 168 392 C 215 372 248 378 248 386 Z" fill="#1C1A17" />
          <path d="M 340 365 C 285 348 252 358 252 374 L 332 392 C 285 372 252 378 252 386 Z" fill="#1C1A17" />
        </svg>
      </div>
      <h1 class="brand-title">HK CODE OF RANKERS</h1>
      <p class="brand-subtitle">1-on-1 CS Mentorship & Evaluated Test Series</p>
    </div>

    <!-- Status Banner -->
    <div class="badge-bar">
      <span class="badge-text">✓ Payment Verified • Enrollment Confirmed</span>
    </div>

    <!-- Main Content -->
    <div class="email-body">
      <h2 class="greeting">Congratulations, ${data.studentName}!</h2>
      <p class="lead-text">
        We have verified your direct UPI payment. Your seat for <strong>${data.programName}</strong> has been officially confirmed and registered in our active batch.
      </p>

      <!-- Verified Transaction Details -->
      <div class="details-card">
        <div class="details-title">Official Enrollment Receipt</div>
        <div class="detail-row">
          <span class="detail-label">Student Name</span>
          <span class="detail-value">${data.studentName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Enrolled Program</span>
          <span class="detail-value">${data.programName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Order Number</span>
          <span class="detail-value">${data.orderNumber}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Verified UPI UTR</span>
          <span class="detail-value"><span class="utr-highlight">${data.utrNumber}</span></span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Amount Received</span>
          <span class="detail-value">₹${data.amount.toLocaleString('en-IN')}/-</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Payee Account</span>
          <span class="detail-value">Harkiran kaur jatinder singh kohli</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Verification Date</span>
          <span class="detail-value">${cleanDate}</span>
        </div>
      </div>

      <!-- 24-Hour Contact Promise -->
      <div class="next-steps-card">
        <div class="next-steps-title">
          <span>⏱️ What Happens Next? (Within 24 Hours)</span>
        </div>
        <ol class="next-steps-list">
          <li><strong>Direct WhatsApp & Call Contact:</strong> Our admissions team and Harkiran Kaur will contact you on your registered phone (<strong>${data.studentPhone}</strong>) within the next <strong>24 hours</strong>.</li>
          <li><strong>1-on-1 Strategy Session Booking:</strong> You will receive a personalized slot to schedule your diagnostic call to analyze past attempts, daily study hours, and target ICSI exams.</li>
          <li><strong>Study Material & Test Series:</strong> Study material and test series will be soon launching! You will receive priority access and notification as soon as they go live.</li>
        </ol>
      </div>

      <p style="font-size: 13px; color: #4B5563;">
        If you have any urgent questions or wish to share your recent marksheets early, feel free to reply directly to this email or reach our official helpline at <strong>+91 92840 84523</strong>.
      </p>

      <!-- Signoff -->
      <div class="signoff">
        <p class="mentor-name">Harkiran Kaur Kohli</p>
        <p class="mentor-cred">Founder & Head Mentor • AIR 3 (CS Professional)</p>
        <p style="font-size: 11px; color: #6B7280; margin: 4px 0 0 0;">HK Code of Rankers • Nashik, Maharashtra</p>
      </div>
    </div>

    <!-- Footer -->
    <div class="email-footer">
      <p style="margin: 0;">This is an official transaction confirmation from HK Code of Rankers.</p>
      <p style="margin: 6px 0 0 0;">Payee UPI ID: <strong>harkirankaurr@ibl</strong> • Bank: Harkiran kaur jatinder singh kohli</p>
      <div class="footer-links">
        <a href="https://hkcodeofrankers.com" target="_blank">Academy Portal</a> |
        <a href="mailto:hk.code.of.rankers@gmail.com">Support Desk</a> |
        <a href="tel:+919284084523">Helpline: +91 92840 84523</a>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Generates plain text version of confirmation email (ideal for Gmail web, mailto, and WhatsApp)
 */
export function generateStudentConfirmationEmailPlainText(data: StudentConfirmationEmailData): string {
  const cleanDate =
    data.confirmedDate ||
    new Date().toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

  return `Dear ${data.studentName},

Congratulations! We have verified your direct UPI payment for HK Code of Rankers. Your seat has been officially confirmed.

==================================================
OFFICIAL ENROLLMENT RECEIPT
==================================================
• Student Name: ${data.studentName}
• Enrolled Program: ${data.programName}
• Order Number: ${data.orderNumber}
• Verified UPI UTR: ${data.utrNumber}
• Amount Received: ₹${data.amount.toLocaleString('en-IN')}/-
• Payee Account: Harkiran kaur jatinder singh kohli (harkirankaurr@ibl)
• Date of Verification: ${cleanDate}

==================================================
⏱️ WHAT HAPPENS NEXT? (WITHIN 24 HOURS)
==================================================
1. Direct WhatsApp & Call Contact:
Our mentorship team and Harkiran Kaur will contact you on your registered phone (+91 ${data.studentPhone}) within the next 24 hours.

2. 1-on-1 Strategy Session:
We will analyze your past attempts, daily study schedule, and syllabus completion.

3. Study Material & Test Series Launch:
Study material and test series will be soon launching! You will receive priority access and notification as soon as they go live.

If you have urgent questions, feel free to reply to this email or reach our official helpline at +91 92840 84523.

Warm regards,
Harkiran Kaur Kohli
Founder & Head Mentor (AIR 3 CS Professional)
HK Code of Rankers • Nashik, Maharashtra
Website: https://hkcodeofrankers.com`;
}

/**
 * Returns a 1-click Gmail Web compose URL with prefilled recipient, subject, and body
 */
export function getGmailComposeUrl(data: StudentConfirmationEmailData): string {
  const subject = `Enrollment Confirmed: ${data.programName} — HK Code of Rankers (Order #${data.orderNumber})`;
  const body = generateStudentConfirmationEmailPlainText(data);
  return `https://mail.google.com/mail/?authuser=hk.code.of.rankers@gmail.com&view=cm&fs=1&to=${encodeURIComponent(data.studentEmail)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/**
 * Returns a standard mailto: URL for default email clients (Apple Mail, Outlook, etc.)
 */
export function getMailtoUrl(data: StudentConfirmationEmailData): string {
  const subject = `Enrollment Confirmed: ${data.programName} — HK Code of Rankers (Order #${data.orderNumber})`;
  const body = generateStudentConfirmationEmailPlainText(data);
  return `mailto:${encodeURIComponent(data.studentEmail)}?cc=hk.code.of.rankers@gmail.com&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/**
 * Returns a 1-click WhatsApp web/app link to send confirmation directly to the student's phone (manual)
 */
export function getWhatsAppConfirmationUrl(data: StudentConfirmationEmailData): string {
  const cleanPhone = (data.studentPhone || '').replace(/\D/g, '');
  const phoneWithCountry = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
  const text = `*OFFICIAL ENROLLMENT CONFIRMATION — HK CODE OF RANKERS* 🎓

Hello *${data.studentName}*! 
Congratulations, your enrollment with HK Code of Rankers is logged!

*Program:* ${data.programName}
*Order Number:* ${data.orderNumber}
*Verified UTR:* ${data.utrNumber}
*Amount Paid:* ₹${data.amount.toLocaleString('en-IN')}/-
*Head Mentor:* Harkiran Kaur (AIR 3 CS Professional)
*Email Workspace:* hk.code.of.rankers@gmail.com

*Next Steps (Within 24 Hours):*
Harkiran Kaur will connect with you to schedule your 1-on-1 diagnostic call and unlock your evaluated test series schedule.

You can now log in to your Student Portal anytime to view your enrolled courses, syllabus tracker, and download your official Tax Invoice!

Welcome to HK Code of Rankers! 🚀`;

  return `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(text)}`;
}

/**
 * Returns a 1-click manual WhatsApp link for students to message the academy directly
 */
export function getStudentToAcademyWhatsAppUrl(studentName: string, orderNumber?: string, programName?: string): string {
  const text = `Hello Harkiran Kaur Ma'am,

I am registered student *${studentName}* on HK Code of Rankers.
${orderNumber ? `*Order / Reg ID:* ${orderNumber}\n` : ''}${programName ? `*Program:* ${programName}\n` : ''}
I have accessed my Student Portal and would like to connect regarding my 1-on-1 diagnostic call & batch schedule.`;

  return `https://wa.me/919284084523?text=${encodeURIComponent(text)}`;
}

/**
 * Automated background email dispatcher that posts to academy inbox hk.code.of.rankers@gmail.com
 * and cc's the student without requiring browser popups
 */
async function sendBackgroundAutomatedEmail(payload: {
  recipientEmail: string;
  studentName: string;
  subject: string;
  messageText: string;
  orderNumber?: string;
  type: 'ENROLLMENT' | 'REGISTRATION';
}): Promise<boolean> {
  try {
    const res = await fetch('https://formsubmit.co/ajax/hk.code.of.rankers@gmail.com', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        _subject: payload.subject,
        student_name: payload.studentName,
        student_email: payload.recipientEmail,
        _replyto: payload.recipientEmail,
        _cc: payload.recipientEmail,
        order_number: payload.orderNumber || 'REG-STUDENT',
        type: payload.type,
        message: payload.messageText,
        dispatched_at: new Date().toISOString(),
      }),
    });
    return res.ok;
  } catch (e) {
    console.warn('[HK Email Service] Background automated send notice:', e);
    return false;
  }
}

/**
 * Sends an automated welcome email when a student registers on the portal
 */
export async function sendStudentRegistrationEmail(params: {
  studentName: string;
  studentEmail: string;
  studentPhone: string;
  targetExam: string;
}): Promise<void> {
  const subject = `Welcome to HK Code of Rankers — Student Portal Access for ${params.studentName}`;
  const messageText = `Dear ${params.studentName},

Welcome to HK Code of Rankers! Your Student Portal account has been created successfully.

Registration Summary:
• Student Name: ${params.studentName}
• Registered Email: ${params.studentEmail}
• Mobile / WhatsApp: ${params.studentPhone}
• Target ICSI Exam: ${params.targetExam}
• Head Mentor: Harkiran Kaur (AIR 3 CS Professional)
• Official Academy Email: hk.code.of.rankers@gmail.com

Student Portal Features:
1. View enrolled mentorship courses & test schedules
2. Download official Tax Invoices (PDF)
3. Priority access to upcoming launches (Chapter-wise Evaluated Test Series & ICSI Digital Notes)

Official Student Helpline: +91 92840 84523.

Warm regards,
Harkiran Kaur Kohli
HK Code of Rankers`;

  sendBackgroundAutomatedEmail({
    recipientEmail: params.studentEmail,
    studentName: params.studentName,
    subject,
    messageText,
    type: 'REGISTRATION',
  });
}

/**
 * Dispatches the official confirmation email automatically and prepares manual WhatsApp button
 */
export async function sendStudentConfirmationEmail(
  data: StudentConfirmationEmailData,
  options?: { autoTrigger?: boolean }
): Promise<{
  success: boolean;
  message: string;
  record: DispatchedEmailRecord;
  gmailUrl: string;
  mailtoUrl: string;
  whatsAppUrl: string;
  plainText: string;
}> {
  const timestamp = new Date().toISOString();
  const emailHtml = generateStudentConfirmationEmailHtml({
    ...data,
    confirmedDate: new Date().toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
  });

  const subject = `Enrollment Confirmed: ${data.programName} — HK Code of Rankers (Order #${data.orderNumber})`;
  const plainText = generateStudentConfirmationEmailPlainText(data);
  const gmailUrl = getGmailComposeUrl(data);
  const mailtoUrl = getMailtoUrl(data);
  const whatsAppUrl = getWhatsAppConfirmationUrl(data);

  const record: DispatchedEmailRecord = {
    id: `eml_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    recipientEmail: data.studentEmail,
    studentName: data.studentName,
    orderNumber: data.orderNumber,
    utrNumber: data.utrNumber,
    subject,
    status: 'DELIVERED',
    sentAt: timestamp,
    previewHtml: emailHtml,
  };

  // 1. Store in local dispatched emails history
  try {
    const existing = JSON.parse(localStorage.getItem(SENT_EMAILS_STORAGE_KEY) || '[]');
    existing.unshift(record);
    localStorage.setItem(SENT_EMAILS_STORAGE_KEY, JSON.stringify(existing.slice(0, 100)));
  } catch (err) {
    console.warn('Failed to store dispatched email locally:', err);
  }

  // 2. Automatically dispatch the email in the background to student and workspace hk.code.of.rankers@gmail.com
  sendBackgroundAutomatedEmail({
    recipientEmail: data.studentEmail,
    studentName: data.studentName,
    subject,
    messageText: plainText,
    orderNumber: data.orderNumber,
    type: 'ENROLLMENT',
  });

  console.log(`[HK Email Service] ✅ Automated confirmation mail sent for ${data.studentEmail} & workspace hk.code.of.rankers@gmail.com`);

  return {
    success: true,
    message: `Enrollment confirmed! Automated confirmation mail sent to ${data.studentEmail} and workspace hk.code.of.rankers@gmail.com. Manual WhatsApp button ready.`,
    record,
    gmailUrl,
    mailtoUrl,
    whatsAppUrl,
    plainText,
  };
}

/**
 * Gets all dispatched email records
 */
export function getDispatchedEmails(): DispatchedEmailRecord[] {
  try {
    return JSON.parse(localStorage.getItem(SENT_EMAILS_STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

/**
 * Gets dispatched email records for a specific student
 */
export function getStudentEmails(studentEmail?: string): DispatchedEmailRecord[] {
  const all = getDispatchedEmails();
  if (!studentEmail) return all;
  const clean = studentEmail.trim().toLowerCase();
  return all.filter((e) => e.recipientEmail.trim().toLowerCase() === clean);
}

/**
 * Generates official Student Account Approval HTML Email
 * Sent when Admin approves registration/payment
 */
export function generateStudentApprovalEmailHtml(data: StudentApprovalEmailData): string {
  const cleanDate =
    data.approvedDate ||
    new Date().toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Registration Approved — HK Code of Rankers</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #F8F6F2;
      color: #1A1A1A;
      line-height: 1.6;
    }
    .email-container {
      max-width: 620px;
      margin: 30px auto;
      background: #FFFFFF;
      border-radius: 16px;
      overflow: hidden;
      border: 1px solid #E5DFD3;
      box-shadow: 0 4px 20px rgba(0,0,0,0.06);
    }
    .email-header {
      background: #0F0F0F;
      padding: 32px 24px;
      text-align: center;
      border-bottom: 3px solid #C8A45D;
    }
    .brand-title {
      font-size: 22px;
      font-weight: 800;
      letter-spacing: 1.5px;
      color: #FFE3A0;
      margin: 0;
      text-transform: uppercase;
    }
    .brand-subtitle {
      font-size: 11px;
      letter-spacing: 2px;
      color: #D4AF37;
      margin: 6px 0 0 0;
      text-transform: uppercase;
      font-weight: 600;
    }
    .badge-bar {
      background: #ECFDF5;
      padding: 12px 24px;
      text-align: center;
      border-bottom: 1px solid #A7F3D0;
    }
    .badge-text {
      display: inline-block;
      background: #059669;
      color: #FFFFFF;
      font-size: 12px;
      font-weight: 700;
      padding: 4px 16px;
      border-radius: 20px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .email-body {
      padding: 32px 28px;
    }
    .greeting {
      font-size: 18px;
      font-weight: 700;
      color: #0F0F0F;
      margin-top: 0;
      margin-bottom: 14px;
    }
    .lead-text {
      font-size: 14px;
      color: #374151;
      margin-bottom: 24px;
    }
    .details-card {
      background: #FAF7F2;
      border: 1px solid #EADBCE;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 24px;
    }
    .action-box {
      background: #FFFBEB;
      border: 2px solid #F59E0B;
      border-radius: 14px;
      padding: 22px;
      margin-bottom: 24px;
      text-align: center;
    }
    .action-button {
      display: inline-block;
      background: #0F0F0F;
      color: #FFE3A0;
      border: 2px solid #C8A45D;
      font-weight: 800;
      font-size: 14px;
      padding: 12px 28px;
      border-radius: 10px;
      text-decoration: none;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-top: 14px;
    }
    .security-notice {
      background: #EFF6FF;
      border-left: 4px solid #3B82F6;
      border-radius: 8px;
      padding: 14px 18px;
      margin-bottom: 24px;
      font-size: 12px;
      color: #1E3A8A;
      line-height: 1.5;
    }
    .signoff {
      border-top: 1px solid #E5DFD3;
      padding-top: 20px;
      margin-top: 24px;
    }
    .email-footer {
      background: #1C1917;
      color: #A8A29E;
      padding: 20px 24px;
      text-align: center;
      font-size: 11px;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="email-header">
      <h1 class="brand-title">HK Code of Rankers</h1>
      <p class="brand-subtitle">Premier ICSI CS Mentorship & Evaluated Test Series</p>
    </div>

    <div class="badge-bar">
      <span class="badge-text">✓ Registration Approved by Admin</span>
    </div>

    <div class="email-body">
      <h2 class="greeting">Dear ${data.studentName},</h2>
      <p class="lead-text">
        Great news! Your registration and enrollment with <strong>HK Code of Rankers</strong> have been <strong>officially verified and approved</strong> by Harkiran Kaur and our admissions team.
      </p>

      <div class="action-box">
        <h3 style="margin: 0 0 8px 0; color: #92400E; font-size: 16px;">Now You Can Log In & Set Your Password</h3>
        <p style="margin: 0; font-size: 13px; color: #4B5563;">
          Use your registered email address below to log in. If you have not created your password yet or wish to reset it, simply use the <strong>"Forgot / Reset Password"</strong> option on the login window with this same email.
        </p>
        <div style="margin: 12px 0; font-family: monospace; font-size: 15px; font-weight: bold; color: #1F2937; background: #FEF3C7; padding: 8px 16px; border-radius: 8px; display: inline-block;">
          Registered Login Email: ${data.studentEmail}
        </div>
        <div>
          <a href="https://hkcodeofrankers.com" class="action-button" target="_blank">
            Log In To Student Portal &rarr;
          </a>
        </div>
      </div>

      <div class="details-card">
        <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; color: #8A651E; margin-bottom: 10px; border-bottom: 1px solid #E5D9C3; padding-bottom: 6px;">
          Approved Account Credentials
        </div>
        <div style="font-size: 13px; line-height: 1.8;">
          <div>&bull; <strong>Student Name:</strong> ${data.studentName}</div>
          <div>&bull; <strong>Registered Email:</strong> ${data.studentEmail}</div>
          ${data.studentPhone ? `<div>&bull; <strong>Registered Mobile / WhatsApp:</strong> ${data.studentPhone}</div>` : ''}
          ${data.programName ? `<div>&bull; <strong>Enrolled Course / Batch:</strong> ${data.programName}</div>` : ''}
          <div>&bull; <strong>Approval Timestamp:</strong> ${cleanDate}</div>
        </div>
      </div>

      <div class="security-notice">
        <strong>🔒 Document & Test Series Protection:</strong><br/>
        For your safety and protection, your student portal, personalized syllabus tracker, test series questions, and upcoming PDF study materials are strictly bound to your registered email (<strong>${data.studentEmail}</strong>). Please keep your credentials secure.
      </div>

      <div class="signoff">
        <p style="margin: 0 0 6px 0; font-size: 13px; color: #4B5563;">Need help getting started or setting up your password?</p>
        <p style="margin: 0; font-size: 13px; color: #1F2937;">
          Reply to this email or call our student helpline at <strong>+91 92840 84523</strong>.
        </p>
        <div style="margin-top: 16px;">
          <strong style="color: #0F0F0F;">Harkiran Kaur Kohli</strong><br/>
          <span style="font-size: 12px; color: #8A651E;">AIR 3 CS Professional &bull; Founder, HK Code of Rankers</span>
        </div>
      </div>
    </div>

    <div class="email-footer">
      <p style="margin: 0;">HK Code of Rankers &bull; Official Student Portal Access</p>
      <p style="margin: 4px 0 0 0;">Payee Account: Harkiran kaur jatinder singh kohli &bull; Nashik, Maharashtra</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Plain text format for student approval notification
 */
export function generateStudentApprovalEmailPlainText(data: StudentApprovalEmailData): string {
  const cleanDate =
    data.approvedDate ||
    new Date().toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

  return `Dear ${data.studentName},

Your registration has been approved by HK Code of Rankers!

==================================================
ACCOUNT REGISTRATION APPROVED
==================================================
• Student Name: ${data.studentName}
• Registered Login Email: ${data.studentEmail}
• Mobile: ${data.studentPhone || 'N/A'}
• Program: ${data.programName || 'CS Mentorship Batch'}
• Approval Date: ${cleanDate}

==================================================
HOW TO LOG IN TO YOUR ACCOUNT:
==================================================
1. Go to HK Code of Rankers portal (https://hkcodeofrankers.com).
2. Click on "Student Portal" or "Log In".
3. Log in with your registered email address: ${data.studentEmail}
4. If you have not set a password yet or wish to reset it, simply click "Forgot / Reset Password" using this same registered email address.

IMPORTANT SECURITY NOTICE:
Your access to the student syllabus tracker, 1-on-1 mentorship schedule, and test series PDF documents is strictly bound to your registered email (${data.studentEmail}).

For any assistance, contact our student helpline: +91 92840 84523.

Warm regards,
Harkiran Kaur Kohli
Founder & Head Mentor (AIR 3 CS Professional)
HK Code of Rankers`;
}

/**
 * 1-click WhatsApp message to notify student of approval
 */
export function getWhatsAppApprovalUrl(data: StudentApprovalEmailData): string {
  const cleanPhone = (data.studentPhone || '').replace(/\D/g, '');
  const phoneWithCountry = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
  const text = `*REGISTRATION APPROVED — HK CODE OF RANKERS* 🎓

Hello *${data.studentName}*! 
Your registration has been officially approved by Harkiran Kaur!

Now you can log in to your account with your registered email address:
📧 *${data.studentEmail}*

If you need to set or reset your password, click "Forgot Password" on the student login window with this same email.

Your Student Portal is now unlocked with your syllabus tracker and 1-on-1 mentorship! 🚀`;

  return `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(text)}`;
}

/**
 * Dispatches the official approval email and creates a record
 */
export async function sendStudentApprovalEmail(data: StudentApprovalEmailData): Promise<{
  success: boolean;
  message: string;
  record: DispatchedEmailRecord;
  whatsappUrl: string;
  gmailUrl: string;
}> {
  const timestamp = new Date().toISOString();
  const emailHtml = generateStudentApprovalEmailHtml(data);
  const plainText = generateStudentApprovalEmailPlainText(data);
  const subject = `Registration Approved: Welcome to your Student Portal — HK Code of Rankers`;

  const record: DispatchedEmailRecord = {
    id: `appr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    recipientEmail: data.studentEmail,
    studentName: data.studentName,
    orderNumber: data.orderNumber || 'REG-APPROVED',
    utrNumber: 'ADMIN_APPROVED',
    subject,
    status: 'DELIVERED',
    sentAt: timestamp,
    previewHtml: emailHtml,
  };

  // 1. Save in local history
  try {
    const existing = JSON.parse(localStorage.getItem(SENT_EMAILS_STORAGE_KEY) || '[]');
    existing.unshift(record);
    localStorage.setItem(SENT_EMAILS_STORAGE_KEY, JSON.stringify(existing.slice(0, 100)));
  } catch (err) {
    console.warn('Failed to store approval email locally:', err);
  }

  // 2. Automated background send
  sendBackgroundAutomatedEmail({
    recipientEmail: data.studentEmail,
    studentName: data.studentName,
    subject,
    messageText: plainText,
    orderNumber: data.orderNumber || 'REG-APPROVED',
    type: 'ENROLLMENT',
  });

  const whatsappUrl = getWhatsAppApprovalUrl(data);
  const gmailUrl = `https://mail.google.com/mail/?authuser=hk.code.of.rankers@gmail.com&view=cm&fs=1&to=${encodeURIComponent(data.studentEmail)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(plainText)}`;

  console.log(`[HK Email Service] ✅ Approval email dispatched for ${data.studentEmail}`);

  return {
    success: true,
    message: `Registration approved! Official confirmation email sent to ${data.studentEmail}. WhatsApp notification ready.`,
    record,
    whatsappUrl,
    gmailUrl,
  };
}

export const sendRegistrationApprovedEmail = sendStudentApprovalEmail;

/**
 * Dispatches registration rejected email
 */
export async function sendRegistrationRejectedEmail(data: {
  studentName: string;
  studentEmail: string;
  reason?: string;
}): Promise<boolean> {
  const subject = `Update Regarding Your Registration — HK Code of Rankers`;
  const text = `Hello ${data.studentName},

Thank you for your interest in HK Code of Rankers Mentorship.

Your registration application has been reviewed by Harkiran Kaur and our admissions committee. At this moment, we are unable to approve your registration for the following reason:
"${data.reason || 'Batch capacity reached or eligibility requirements not met.'}"

If you believe this is in error, please contact our student admissions desk directly on WhatsApp / Call: +91 92840 84523.

Warm regards,
Harkiran Kaur Kohli
HK Code of Rankers`;

  sendBackgroundAutomatedEmail({
    recipientEmail: data.studentEmail,
    studentName: data.studentName,
    subject,
    messageText: text,
    orderNumber: 'REG-REJECTED',
    type: 'ENROLLMENT',
  });

  return true;
}

/**
 * Dispatches payment approved email
 */
export async function sendPaymentApprovedEmail(data: {
  studentName: string;
  studentEmail: string;
  courseName: string;
  amount: number;
  utrNumber: string;
  orderNumber: string;
}): Promise<boolean> {
  const subject = `Payment Approved: Course & Mentorship Access Activated — HK Code of Rankers`;
  const text = `Congratulations ${data.studentName}!

Your payment for ${data.courseName} (Amount: ₹${data.amount}/-, UTR: ${data.utrNumber}) has been verified and approved by Harkiran Kaur!

Your Course and Student Mentorship Portal are now fully active:
- Official ICSI Syllabus Tracker Unlocked
- 12-Month Mentorship Call Roadmap Activated
- Answer Writing & Chapter Test Evaluation Enabled

Log in to your Student Portal now: https://hkcodeofrankers.com/student-portal

Welcome to the Rankers Batch!

Warm regards,
Harkiran Kaur Kohli (AIR 3)
HK Code of Rankers`;

  sendBackgroundAutomatedEmail({
    recipientEmail: data.studentEmail,
    studentName: data.studentName,
    subject,
    messageText: text,
    orderNumber: data.orderNumber,
    type: 'ENROLLMENT',
  });

  return true;
}

/**
 * Dispatches payment rejected email
 */
export async function sendPaymentRejectedEmail(data: {
  studentName: string;
  studentEmail: string;
  reason?: string;
  orderId?: string;
}): Promise<boolean> {
  const subject = `Payment Verification Update — HK Code of Rankers`;
  const text = `Hello ${data.studentName},

Your submitted payment verification for Order ${data.orderId || 'PENDING'} could not be verified with our bank statement:
"${data.reason || 'Invalid UTR reference or unconfirmed transaction.'}"

Please log in to your Student Portal to re-enter your 12-digit UPI UTR number or contact our admissions desk on +91 92840 84523.

Warm regards,
HK Code of Rankers`;

  sendBackgroundAutomatedEmail({
    recipientEmail: data.studentEmail,
    studentName: data.studentName,
    subject,
    messageText: text,
    orderNumber: data.orderId || 'PAY-REJECTED',
    type: 'ENROLLMENT',
  });

  return true;
}

/**
 * Dispatches secure password reset link email
 */
export async function sendPasswordResetLinkEmail(data: {
  studentName: string;
  studentEmail: string;
  resetUrl: string;
  token: string;
}): Promise<boolean> {
  const subject = `Secure Password Reset Link — HK Code of Rankers`;
  const text = `Hello ${data.studentName},

We received a request to reset your password for your HK Code of Rankers Student Account (${data.studentEmail}).

Please click the secure link below to choose your new password:
${data.resetUrl}

SECURITY NOTICE:
- This link is single-use and will expire in 30 minutes.
- If you did not request this password reset, please ignore this email and your existing password will remain safe.

Helpline: +91 92840 84523
HK Code of Rankers`;

  sendBackgroundAutomatedEmail({
    recipientEmail: data.studentEmail,
    studentName: data.studentName,
    subject,
    messageText: text,
    orderNumber: 'PWD-RESET',
    type: 'ENROLLMENT',
  });

  return true;
}

/**
 * Dispatches 1-on-1 Mentorship Slot Booking confirmation email to registered email
 */
export async function sendSlotBookingConfirmationEmail(data: {
  studentName: string;
  studentEmail: string;
  studentPhone: string;
  program: string;
  bookingDate: string;
  bookingTime: string;
  callType: string;
  bookingId?: string;
  notes?: string;
}): Promise<boolean> {
  const cleanDate = data.bookingDate;
  const subject = `Slot Booking Confirmed [${data.bookingId || 'SLOT'}] — HK Code of Rankers`;

  const text = `Hello ${data.studentName},

Your 1-on-1 Mentorship Call slot has been booked with Harkiran Kaur Kohli (AIR 3 CS Professional).

SLOT BOOKING DETAILS:
- Booking Reference: ${data.bookingId || 'Active'}
- Student Name: ${data.studentName}
- Registered Email: ${data.studentEmail}
- Mobile / WhatsApp: ${data.studentPhone}
- Program: ${data.program}
- Date: ${cleanDate}
- Slot Time: ${data.bookingTime}
- Call Category: ${data.callType}
${data.notes ? `- Notes / Topics: ${data.notes}\n` : ''}

NEXT STEPS:
1. Please ensure you have your doubt list, syllabus tracker, and test copies ready before the call.
2. The mentor desk will connect with you via voice call or video link at the scheduled time.
3. If you need to reschedule, please notify us at least 6 hours in advance via your Student Portal or official email.

Warm regards,
Harkiran Kaur Kohli (AIR 3)
HK Code of Rankers Desk
Email: hk.code.of.rankers@gmail.com
Helpline: +91 92840 84523`;

  sendBackgroundAutomatedEmail({
    recipientEmail: data.studentEmail,
    studentName: data.studentName,
    subject,
    messageText: text,
    orderNumber: data.bookingId || 'SLOT-BOOKING',
    type: 'ENROLLMENT',
  });

  return true;
}

/**
 * Dispatches Free 1-on-1 Demo / Guidance Call Slot Booking email to registered email
 */
export async function sendFreeSlotBookingConfirmationEmail(data: {
  candidateName: string;
  candidateEmail: string;
  candidatePhone: string;
  program: string;
  preferredSlot: string;
  bookingId?: string;
  notes?: string;
}): Promise<boolean> {
  const subject = `Free Guidance Slot Confirmed [${data.bookingId || 'FREE-SLOT'}] — HK Code of Rankers`;

  const text = `Hello ${data.candidateName},

Your Free 1-on-1 Guidance & Counselling Session with Harkiran Kaur Kohli (AIR 3 CS Professional) has been received and scheduled!

FREE SLOT DETAILS:
- Booking Reference: ${data.bookingId || 'FREE-DEMO'}
- Candidate Name: ${data.candidateName}
- Registered Email: ${data.candidateEmail}
- Mobile / WhatsApp: ${data.candidatePhone}
- Exam / Program: ${data.program}
- Preferred Time Slot: ${data.preferredSlot}
${data.notes ? `- Inquiries / Questions: ${data.notes}\n` : ''}

WHAT TO EXPECT ON YOUR CALL:
- Honest 3-year CS Career Roadmap tailored to your current stage.
- Guidance on clearing CS EET, Executive, or Professional on your 1st attempt.
- Review of your daily routine and study hour targets.
- 100% Free Session — No obligation to enroll.

Official Workspace: hk.code.of.rankers@gmail.com
Helpline: +91 92840 84523
HK Code of Rankers`;

  sendBackgroundAutomatedEmail({
    recipientEmail: data.candidateEmail,
    studentName: data.candidateName,
    subject,
    messageText: text,
    orderNumber: data.bookingId || 'FREE-SLOT',
    type: 'ENROLLMENT',
  });

  return true;
}

/**
 * Manual WhatsApp link for Admin to initiate direct chat with a booked student
 * (Ensures no fake automated WhatsApp claim is made)
 */
export function getAdminToSlotStudentWhatsAppUrl(
  phone: string,
  studentName: string,
  slotDate: string,
  slotTime: string,
  program: string
): string {
  const cleanPhone = phone.replace(/\D/g, '');
  const phoneWithCountry = cleanPhone.startsWith('91') && cleanPhone.length > 10
    ? cleanPhone
    : `91${cleanPhone.slice(-10)}`;

  const text = `Hello ${studentName}, this is Harkiran Kaur Kohli from HK Code of Rankers regarding your scheduled mentorship slot on ${slotDate} at ${slotTime} (${program}). Looking forward to connecting!`;

  return `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(text)}`;
}

export interface EnquiryConfirmationEmailData {
  candidateName: string;
  candidateEmail: string;
  candidatePhone?: string;
  programName: string;
  subjectQuery?: string;
  notes?: string;
  enquiryId?: string;
  receivedDate?: string;
}

/**
 * Generates an official, highly polished HTML confirmation email specifically for Student Enquiries / Counselling
 */
export function generateEnquiryConfirmationEmailHtml(data: EnquiryConfirmationEmailData): string {
  const cleanDate =
    data.receivedDate ||
    new Date().toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const enqId = data.enquiryId || `ENQ-${Date.now().toString().slice(-6)}`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Enquiry Received — HK Code of Rankers</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #F8F6F2;
      color: #1A1A1A;
      line-height: 1.6;
    }
    .email-container {
      max-width: 620px;
      margin: 30px auto;
      background: #FFFFFF;
      border-radius: 16px;
      overflow: hidden;
      border: 1px solid #E5DFD3;
      box-shadow: 0 4px 20px rgba(0,0,0,0.06);
    }
    .email-header {
      background: #0F0F0F;
      padding: 32px 24px;
      text-align: center;
      border-bottom: 3px solid #C8A45D;
    }
    .brand-title {
      font-size: 22px;
      font-weight: 800;
      letter-spacing: 1.5px;
      color: #FFE3A0;
      margin: 0;
      text-transform: uppercase;
    }
    .brand-subtitle {
      font-size: 11px;
      letter-spacing: 2px;
      color: #D4AF37;
      margin: 6px 0 0 0;
      text-transform: uppercase;
      font-weight: 600;
    }
    .badge-bar {
      background: #FAF5E9;
      padding: 12px 24px;
      text-align: center;
      border-bottom: 1px solid #EDE6D8;
    }
    .badge-text {
      display: inline-block;
      font-size: 12px;
      font-weight: 700;
      color: #8A651E;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .email-body {
      padding: 36px 32px;
    }
    .greeting {
      font-size: 18px;
      font-weight: 700;
      color: #111111;
      margin-bottom: 12px;
    }
    .intro-p {
      font-size: 14px;
      color: #4A4A4A;
      margin-bottom: 24px;
    }
    .enquiry-card {
      background: #FAF8F5;
      border: 1px solid #E8DFCF;
      border-radius: 12px;
      padding: 20px 24px;
      margin-bottom: 28px;
    }
    .card-title {
      font-size: 12px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #8A651E;
      margin-top: 0;
      margin-bottom: 16px;
      border-bottom: 1px solid #E5DBC7;
      padding-bottom: 8px;
    }
    .data-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px dashed #EADECA;
      font-size: 13px;
    }
    .data-row:last-child {
      border-bottom: none;
    }
    .data-label {
      color: #666666;
      font-weight: 500;
    }
    .data-value {
      color: #111111;
      font-weight: 700;
      text-align: right;
    }
    .steps-box {
      background: #FFFFFF;
      border: 1px solid #E5DFD3;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 28px;
    }
    .step-item {
      margin-bottom: 14px;
      font-size: 13px;
      color: #333333;
    }
    .step-num {
      display: inline-block;
      width: 22px;
      height: 22px;
      line-height: 22px;
      border-radius: 50%;
      background: #C8A45D;
      color: #000000;
      font-weight: 800;
      text-align: center;
      margin-right: 8px;
      font-size: 11px;
    }
    .btn-container {
      text-align: center;
      margin: 28px 0;
    }
    .btn {
      display: inline-block;
      background: #25D366;
      color: #FFFFFF !important;
      font-size: 13px;
      font-weight: 700;
      text-decoration: none;
      padding: 12px 28px;
      border-radius: 30px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .signature-section {
      border-top: 1px solid #E5DFD3;
      padding-top: 20px;
      margin-top: 24px;
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .sig-text {
      font-size: 13px;
      color: #333;
    }
    .sig-name {
      font-weight: 800;
      color: #111;
      font-size: 14px;
    }
    .sig-title {
      color: #8A651E;
      font-size: 12px;
      font-weight: 600;
    }
    .footer {
      background: #F2EFE9;
      padding: 24px;
      text-align: center;
      font-size: 11px;
      color: #777777;
      border-top: 1px solid #E5DFD3;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="email-header">
      <h1 class="brand-title">HK Code of Rankers</h1>
      <p class="brand-subtitle">Exclusive CS Mentorship &bull; Admissions &amp; Academic Cell</p>
    </div>
    
    <div class="badge-bar">
      <span class="badge-text">&bull; Enquiry Confirmation &amp; Consultation Request &bull;</span>
    </div>

    <div class="email-body">
      <div class="greeting">Dear ${data.candidateName},</div>
      
      <p class="intro-p">
        Thank you for your interest in <strong>HK Code of Rankers</strong>! We have received your mentorship enquiry regarding <strong>${data.programName}</strong>.
      </p>

      <div class="enquiry-card">
        <h3 class="card-title">Enquiry Summary &amp; Reference</h3>
        <div class="data-row">
          <span class="data-label">Reference ID:</span>
          <span class="data-value">${enqId}</span>
        </div>
        <div class="data-row">
          <span class="data-label">Candidate Name:</span>
          <span class="data-value">${data.candidateName}</span>
        </div>
        <div class="data-row">
          <span class="data-label">Email Address:</span>
          <span class="data-value">${data.candidateEmail}</span>
        </div>
        ${data.candidatePhone ? `
        <div class="data-row">
          <span class="data-label">Mobile / WhatsApp:</span>
          <span class="data-value">${data.candidatePhone}</span>
        </div>` : ''}
        <div class="data-row">
          <span class="data-label">Program of Interest:</span>
          <span class="data-value">${data.programName}</span>
        </div>
        ${data.subjectQuery ? `
        <div class="data-row">
          <span class="data-label">Subject / Topic:</span>
          <span class="data-value">${data.subjectQuery}</span>
        </div>` : ''}
        ${data.notes ? `
        <div class="data-row">
          <span class="data-label">Your Query / Note:</span>
          <span class="data-value">${data.notes}</span>
        </div>` : ''}
        <div class="data-row">
          <span class="data-label">Date Received:</span>
          <span class="data-value">${cleanDate}</span>
        </div>
        <div class="data-row">
          <span class="data-label">Status:</span>
          <span class="data-value" style="color: #8A651E;">Assigned to Mentor Harkiran Kaur Kohli</span>
        </div>
      </div>

      <div class="steps-box">
        <h4 style="margin: 0 0 14px 0; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; color: #111;">What Happens Next:</h4>
        <div class="step-item">
          <span class="step-num">1</span> <strong>Profile Evaluation:</strong> Mentor Harkiran Kaur Kohli (AIR 3) reviews your educational background, current attempt timeline, and study challenges.
        </div>
        <div class="step-item">
          <span class="step-num">2</span> <strong>Direct Connect:</strong> Our academic team will reach out via WhatsApp or phone within 24 business hours to address your query and schedule your 1-on-1 strategy call.
        </div>
        <div class="step-item">
          <span class="step-num">3</span> <strong>Custom Roadmap:</strong> You will receive clarity on revision cycles, answer writing methodology, and how to conquer your CS exams on your 1st attempt.
        </div>
      </div>

      <div class="btn-container">
        <a href="https://wa.me/919284084523?text=${encodeURIComponent(`Hello Harkiran Ma'am, I submitted an enquiry for ${data.programName} (Ref: ${enqId}). Looking forward to guidance!`)}" class="btn" target="_blank">
          Chat Directly on WhatsApp with Mentor Desk
        </a>
      </div>

      <p style="font-size: 13px; color: #666; margin-top: 24px;">
        If you have urgent questions, feel free to contact us at <strong>hk.code.of.rankers@gmail.com</strong> or call <strong>+91 92840 84523</strong>.
      </p>

      <div class="signature-section">
        <div class="sig-text">
          <div class="sig-name">Harkiran Kaur Kohli</div>
          <div class="sig-title">Founder &amp; Chief CS Mentor &bull; AIR 3 Achiever</div>
          <div style="font-size: 11px; color: #777; margin-top: 2px;">HK Code of Rankers &bull; Transforming CS Aspirants into Rankers</div>
        </div>
      </div>
    </div>

    <div class="footer">
      <p style="margin: 0 0 6px 0;">&copy; ${new Date().getFullYear()} HK Code of Rankers. All rights reserved.</p>
      <p style="margin: 0;">Official Academic Helpline: +91 92840 84523 &bull; Pune, Maharashtra, India</p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Dispatches an official Enquiry Confirmation Email to a student who submitted a contact or guidance enquiry
 */
export async function sendEnquiryConfirmationEmail(data: EnquiryConfirmationEmailData): Promise<{
  success: boolean;
  message: string;
  record: DispatchedEmailRecord;
  gmailUrl: string;
  whatsAppUrl: string;
  mailtoUrl: string;
  plainText: string;
}> {
  const enqId = data.enquiryId || `ENQ-${Date.now().toString().slice(-6)}`;
  const previewHtml = generateEnquiryConfirmationEmailHtml({ ...data, enquiryId: enqId });
  const subject = `Enquiry Received: ${data.programName} — HK Code of Rankers [${enqId}]`;

  const plainText = `Dear ${data.candidateName},

Thank you for your enquiry regarding ${data.programName} with HK Code of Rankers!

We have successfully received your query (Ref: ${enqId}). Mentor Harkiran Kaur Kohli (AIR 3 Achiever) and our admissions desk will review your details and reach out via WhatsApp / Call within 24 business hours.

Enquiry Details:
- Candidate Name: ${data.candidateName}
- Email: ${data.candidateEmail}
- Mobile/WhatsApp: ${data.candidatePhone || 'Not provided'}
- Program: ${data.programName}
${data.subjectQuery ? `- Subject: ${data.subjectQuery}\n` : ''}${data.notes ? `- Message/Notes: ${data.notes}\n` : ''}

In the meantime, feel free to message our student helpdesk on WhatsApp at +91 92840 84523.

Warm regards,
Harkiran Kaur Kohli (AIR 3)
HK Code of Rankers`;

  const record: DispatchedEmailRecord = {
    id: `eml_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    recipientEmail: data.candidateEmail,
    studentName: data.candidateName,
    orderNumber: enqId,
    utrNumber: 'ENQUIRY-CONFIRMED',
    subject,
    status: 'DELIVERED',
    sentAt: new Date().toISOString(),
    previewHtml,
  };

  try {
    const raw = localStorage.getItem(SENT_EMAILS_STORAGE_KEY);
    const list: DispatchedEmailRecord[] = raw ? JSON.parse(raw) : [];
    list.unshift(record);
    localStorage.setItem(SENT_EMAILS_STORAGE_KEY, JSON.stringify(list.slice(0, 50)));
  } catch (err) {
    console.warn('Error persisting dispatched enquiry email record:', err);
  }

  // Send background email
  sendBackgroundAutomatedEmail({
    recipientEmail: data.candidateEmail,
    studentName: data.candidateName,
    subject,
    messageText: plainText,
    orderNumber: enqId,
    type: 'ENROLLMENT',
  });

  const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
    data.candidateEmail
  )}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(plainText)}`;

  const mailtoUrl = `mailto:${encodeURIComponent(data.candidateEmail)}?subject=${encodeURIComponent(
    subject
  )}&body=${encodeURIComponent(plainText)}`;

  const cleanPhone = (data.candidatePhone || '').replace(/\D/g, '');
  const phoneWithCountry =
    cleanPhone.startsWith('91') && cleanPhone.length > 10 ? cleanPhone : `91${cleanPhone.slice(-10)}`;

  const whatsAppUrl = cleanPhone
    ? `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(
        `Hello ${data.candidateName}, thank you for your enquiry regarding ${data.programName} on HK Code of Rankers (Ref: ${enqId}). Harkiran Kaur Kohli (AIR 3) and our academic team have received your request and look forward to guiding you!`
      )}`
    : `https://wa.me/919284084523?text=${encodeURIComponent(
        `Hello Harkiran Ma'am, enquiry received from ${data.candidateName} for ${data.programName} (Ref: ${enqId}).`
      )}`;

  return {
    success: true,
    message: `Enquiry confirmation email prepared and dispatched to ${data.candidateEmail}.`,
    record,
    gmailUrl,
    whatsAppUrl,
    mailtoUrl,
    plainText,
  };
}

/**
 * Dispatches a one-time 2FA / Login Verification Token to the registered Master Admin email
 */
export async function sendAdminLoginTokenEmail(data: {
  adminName: string;
  adminEmail: string;
  token: string;
  expiresInMinutes?: number;
}): Promise<{
  success: boolean;
  message: string;
  gmailUrl: string;
  mailtoUrl: string;
}> {
  const expiry = data.expiresInMinutes || 10;
  const subject = `[HK Code of Rankers] Admin Login Verification Token: ${data.token}`;
  const plainText = `Hello ${data.adminName || 'Administrator'},

A login attempt was initiated for the Master Admin Portal of HK Code of Rankers.

Your One-Time Admin Security Access Token is:
━━━━━━━━━━━━━━━━━━━━━━━━━━━
         ${data.token}
━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECURITY NOTICE:
• This verification token is valid for ${expiry} minutes.
• Only the authorized Master Admin (${data.adminEmail}) may access this dashboard.
• Do not share this token with anyone.

If you did not initiate this login request, please verify your credentials immediately.

Head Mentor & Founder: Harkiran Kaur Kohli (AIR 3 CS Professional)
Academy Helpline: +91 92840 84523
HK Code of Rankers • https://hkcodeofrankers.com`;

  // Dispatch background email to the admin email
  sendBackgroundAutomatedEmail({
    recipientEmail: data.adminEmail,
    studentName: data.adminName || 'Master Admin',
    subject,
    messageText: plainText,
    orderNumber: `TOKEN-${data.token}`,
    type: 'ENROLLMENT',
  });

  const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
    data.adminEmail
  )}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(plainText)}`;

  const mailtoUrl = `mailto:${encodeURIComponent(data.adminEmail)}?subject=${encodeURIComponent(
    subject
  )}&body=${encodeURIComponent(plainText)}`;

  return {
    success: true,
    message: `Security token sent to ${data.adminEmail}.`,
    gmailUrl,
    mailtoUrl,
  };
}


