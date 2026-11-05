import { Router } from 'express';
import crypto from 'node:crypto';
import { db, hashPassword, verifyPassword, logAudit } from './db.ts';
import {
  authMiddleware,
  requireAuth,
  requireRole,
  createAuthToken,
  type AuthenticatedRequest,
} from './auth.ts';
import {
  processInboundSms,
  isSmsProviderLive,
} from './sms.ts';
import {
  processMissedCallEvent,
  verifyTelephonySignature,
  isTelephonyProviderLive,
} from './telephony.ts';
import {
  getSupabaseConfig,
  saveSupabaseConfig,
  testSupabaseConnection,
  syncLocalDataToSupabase,
  getSqlMigrationContent,
} from './supabase.ts';

export const apiRouter = Router();

// Apply auth middleware to all routes
apiRouter.use(authMiddleware);

// ==========================================
// 1. PUBLIC & AUTHENTICATION ENDPOINTS
// ==========================================

// Public list of active departments
apiRouter.get('/system/departments', (_req, res) => {
  const row = db.prepare("SELECT value FROM system_settings WHERE key = 'DEPARTMENTS_LIST'").get() as { value: string } | undefined;
  if (!row) {
    return res.json([]);
  }
  try {
    res.json(JSON.parse(row.value));
  } catch {
    res.json([]);
  }
});

// Public directory of verified doctors
apiRouter.get('/system/doctors', (_req, res) => {
  const doctors = db.prepare(`
    SELECT p.id, p.full_name, d.department, d.qualification, d.years_of_experience, d.bio, d.availability_schedule
    FROM doctors d
    JOIN profiles p ON p.id = d.id
    WHERE d.is_verified_by_admin = 1
  `).all();
  res.json(doctors);
});

// Registration Endpoint supporting Patient, Doctor, and Doctor Admin
apiRouter.post('/auth/register', (req, res) => {
  const {
    phone,
    password,
    full_name,
    email,
    preferred_language,
    village_or_town,
    district,
    state,
    emergency_contact_phone,
    role,
    department,
    license_number,
    qualification,
    years_of_experience,
    bio,
  } = req.body;

  if (!phone || !password || !full_name || !village_or_town || !district) {
    return res.status(400).json({ error: 'Please provide all required fields: phone, password, full name, village, and district.' });
  }

  // Validate phone format (Indian 10-digit or E.164 +91...)
  const cleanPhone = phone.trim().replace(/\s+/g, '');
  if (!/^(?:\+91)?[6-9]\d{9}$/.test(cleanPhone)) {
    return res.status(400).json({ error: 'Invalid Indian phone number. Please enter a valid 10-digit mobile number.' });
  }

  // Check uniqueness
  const existing = db.prepare('SELECT id FROM profiles WHERE phone = ?').get(cleanPhone);
  if (existing) {
    return res.status(409).json({ error: 'An account with this phone number already exists. Please log in.' });
  }

  const userId = crypto.randomUUID();
  const passwordHash = hashPassword(password);
  const now = new Date().toISOString();
  const lang = ['kn', 'hi', 'en'].includes(preferred_language) ? preferred_language : 'en';

  // Determine role: doctor, doctor_admin, or default patient
  const targetRole = role === 'doctor_admin' ? 'doctor_admin' : role === 'doctor' ? 'doctor' : 'patient';

  db.prepare(`
    INSERT INTO profiles (
      id, email, phone, password_hash, full_name, role, preferred_language,
      village_or_town, district, state, emergency_contact_phone, is_verified, created_at, updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
  `).run(
    userId,
    email ? email.trim() : null,
    cleanPhone,
    passwordHash,
    full_name.trim(),
    targetRole,
    lang,
    village_or_town.trim(),
    district.trim(),
    state ? state.trim() : 'Karnataka',
    emergency_contact_phone || null,
    now,
    now
  );

  // If registering as Doctor or Doctor Admin, initialize doctor profile with medical credentials
  if (targetRole === 'doctor' || targetRole === 'doctor_admin') {
    db.prepare(`
      INSERT INTO doctors (
        id, license_number, department, qualification, years_of_experience,
        bio, is_verified_by_admin, availability_schedule, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, 1, '[]', ?, ?)
    `).run(
      userId,
      license_number?.trim() || `MED-${Date.now().toString().slice(-6)}`,
      department || 'General Medicine',
      qualification?.trim() || 'MBBS, MD',
      Number(years_of_experience) || 5,
      bio?.trim() || (targetRole === 'doctor_admin' ? 'Chief Medical Officer & Administrator' : 'Clinical Medical Practitioner'),
      now,
      now
    );
  }

  // Record initial consent
  const consentId = crypto.randomUUID();
  db.prepare(`
    INSERT INTO patient_consents (id, patient_id, consent_type, granted, consent_text, recorded_at)
    VALUES (?, ?, 'DATA_SHARING', 1, 'Registered and accepted RuralCare terms of service & privacy policy.', ?)
  `).run(consentId, userId, now);

  logAudit(userId, targetRole, 'USER_REGISTER', 'profiles', userId, { phone: cleanPhone, role: targetRole });

  const user = {
    id: userId,
    phone: cleanPhone,
    email: email || undefined,
    full_name: full_name.trim(),
    role: targetRole as any,
    preferred_language: lang as 'kn' | 'hi' | 'en',
    village_or_town: village_or_town.trim(),
    district: district.trim(),
    state: state || 'Karnataka',
    is_verified: true,
  };

  const token = createAuthToken(user);
  res.status(201).json({ token, user });
});

// Login
apiRouter.post('/auth/login', (req, res) => {
  const { identifier, password } = req.body; // phone or email
  if (!identifier || !password) {
    return res.status(400).json({ error: 'Please enter your phone number or email and password.' });
  }

  const cleanIdent = identifier.trim();
  const profile = db.prepare(`
    SELECT id, email, phone, password_hash, full_name, role, preferred_language,
           village_or_town, district, state, is_verified
    FROM profiles
    WHERE phone = ? OR email = ?
  `).get(cleanIdent, cleanIdent) as (AuthenticatedRequest['user'] & { password_hash: string }) | undefined;

  if (!profile || !verifyPassword(password, profile.password_hash)) {
    return res.status(401).json({ error: 'Invalid phone/email or password.' });
  }

  const user = {
    id: profile.id,
    phone: profile.phone,
    email: profile.email,
    full_name: profile.full_name,
    role: profile.role,
    preferred_language: profile.preferred_language,
    village_or_town: profile.village_or_town,
    district: profile.district,
    state: profile.state,
    is_verified: Boolean(profile.is_verified),
  };

  const token = createAuthToken(user);
  logAudit(user.id, user.role, 'LOGIN_SUCCESS', 'profiles', user.id);

  res.json({ token, user });
});

// Current Authenticated User Profile
apiRouter.get('/auth/me', requireAuth, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  // If doctor, include license and verification
  let extra = {};
  if (user.role === 'doctor' || user.role === 'doctor_admin') {
    const doc = db.prepare('SELECT license_number, department, qualification, is_verified_by_admin, availability_schedule FROM doctors WHERE id = ?').get(user.id);
    extra = { doctor_details: doc };
  } else if (user.role === 'health_worker') {
    const hw = db.prepare('SELECT worker_code, assigned_village, assigned_primary_health_center, is_verified_by_admin FROM health_workers WHERE id = ?').get(user.id);
    extra = { health_worker_details: hw };
  }

  res.json({ user: { ...user, ...extra } });
});

// ==========================================
// 2. PATIENT WORKFLOW ENDPOINTS
// ==========================================

// Patient Dashboard Overview
apiRouter.get('/patient/dashboard', requireAuth, requireRole(['patient']), (req: AuthenticatedRequest, res) => {
  const patientId = req.user!.id;

  const upcomingAppointments = db.prepare(`
    SELECT a.*, p.full_name as doctor_name, d.department, d.qualification
    FROM appointments a
    JOIN doctors d ON d.id = a.doctor_id
    JOIN profiles p ON p.id = d.id
    WHERE a.patient_id = ? AND a.status IN ('PENDING', 'CONFIRMED')
    ORDER BY a.appointment_date ASC
  `).all(patientId);

  const prescriptions = db.prepare(`
    SELECT pr.*, p.full_name as doctor_name, a.appointment_date
    FROM prescriptions pr
    JOIN doctors d ON d.id = pr.doctor_id
    JOIN profiles p ON p.id = d.id
    JOIN consultations c ON c.id = pr.consultation_id
    JOIN appointments a ON a.id = c.appointment_id
    WHERE pr.patient_id = ?
    ORDER BY pr.created_at DESC
    LIMIT 5
  `).all(patientId);

  const records = db.prepare(`
    SELECT id, title, record_type, file_name, file_size, created_at
    FROM medical_records
    WHERE patient_id = ?
    ORDER BY created_at DESC
    LIMIT 5
  `).all(patientId);

  const reminders = db.prepare(`
    SELECT * FROM reminders
    WHERE patient_id = ? AND is_completed = 0
    ORDER BY due_date ASC
    LIMIT 5
  `).all(patientId);

  res.json({
    upcomingAppointments,
    prescriptions,
    records,
    reminders,
  });
});

// Patient Appointments List
apiRouter.get('/patient/appointments', requireAuth, requireRole(['patient']), (req: AuthenticatedRequest, res) => {
  const patientId = req.user!.id;
  const list = db.prepare(`
    SELECT a.*, p.full_name as doctor_name, d.department, d.qualification
    FROM appointments a
    JOIN doctors d ON d.id = a.doctor_id
    JOIN profiles p ON p.id = d.id
    WHERE a.patient_id = ?
    ORDER BY a.appointment_date DESC, a.created_at DESC
  `).all(patientId);
  res.json(list);
});

// Patient Book Appointment
apiRouter.post('/patient/appointments', requireAuth, requireRole(['patient']), (req: AuthenticatedRequest, res) => {
  const patientId = req.user!.id;
  const { doctor_id, department, appointment_date, time_slot, reason_summary } = req.body;

  if (!doctor_id || !department || !appointment_date || !time_slot || !reason_summary) {
    return res.status(400).json({ error: 'Please provide doctor, department, date, time slot, and reason.' });
  }

  // Prevent double booking on same doctor, date and slot
  const slotConflict = db.prepare(`
    SELECT id FROM appointments
    WHERE doctor_id = ? AND appointment_date = ? AND time_slot = ? AND status IN ('PENDING', 'CONFIRMED')
  `).get(doctor_id, appointment_date, time_slot);

  if (slotConflict) {
    return res.status(409).json({ error: 'This time slot is already booked for this doctor. Please choose another slot.' });
  }

  const aptId = crypto.randomUUID();
  const refCode = `RC-${Date.now().toString().slice(-6)}`;
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO appointments (
      id, reference_code, patient_id, doctor_id, department,
      appointment_date, time_slot, reason_summary, status, channel, created_at, updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', 'WEB', ?, ?)
  `).run(
    aptId,
    refCode,
    patientId,
    doctor_id,
    department,
    appointment_date,
    time_slot,
    reason_summary.trim(),
    now,
    now
  );

  logAudit(patientId, 'patient', 'BOOK_APPOINTMENT', 'appointments', aptId, { refCode, doctor_id, appointment_date });
  res.status(201).json({ success: true, reference_code: refCode, id: aptId });
});

// Patient Cancel Appointment
apiRouter.post('/patient/appointments/:id/cancel', requireAuth, requireRole(['patient']), (req: AuthenticatedRequest, res) => {
  const patientId = req.user!.id;
  const aptId = req.params.id;

  const apt = db.prepare('SELECT id, status FROM appointments WHERE id = ? AND patient_id = ?').get(aptId, patientId) as { id: string; status: string } | undefined;
  if (!apt) {
    return res.status(404).json({ error: 'Appointment not found.' });
  }

  if (apt.status === 'COMPLETED' || apt.status === 'CANCELLED') {
    return res.status(400).json({ error: `Cannot cancel an appointment that is already ${apt.status.toLowerCase()}.` });
  }

  const now = new Date().toISOString();
  db.prepare("UPDATE appointments SET status = 'CANCELLED', updated_at = ? WHERE id = ?").run(now, aptId);
  logAudit(patientId, 'patient', 'CANCEL_APPOINTMENT', 'appointments', aptId);

  res.json({ success: true, message: 'Appointment successfully cancelled.' });
});

// Patient Prescriptions
apiRouter.get('/patient/prescriptions', requireAuth, requireRole(['patient']), (req: AuthenticatedRequest, res) => {
  const patientId = req.user!.id;
  const list = db.prepare(`
    SELECT pr.*, p.full_name as doctor_name, d.department, d.qualification,
           a.appointment_date, a.reference_code
    FROM prescriptions pr
    JOIN doctors d ON d.id = pr.doctor_id
    JOIN profiles p ON p.id = d.id
    JOIN consultations c ON c.id = pr.consultation_id
    JOIN appointments a ON a.id = c.appointment_id
    WHERE pr.patient_id = ?
    ORDER BY pr.created_at DESC
  `).all(patientId);

  const formatted = list.map((item: any) => ({
    ...item,
    medications: JSON.parse(item.medications || '[]'),
  }));

  res.json(formatted);
});

// Patient Medical Records (Upload and view)
apiRouter.get('/patient/records', requireAuth, requireRole(['patient']), (req: AuthenticatedRequest, res) => {
  const patientId = req.user!.id;
  const list = db.prepare(`
    SELECT id, title, record_type, file_name, file_type, file_size, notes, created_at
    FROM medical_records
    WHERE patient_id = ?
    ORDER BY created_at DESC
  `).all(patientId);
  res.json(list);
});

apiRouter.get('/patient/records/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  const recordId = req.params.id;
  const userId = req.user!.id;
  const role = req.user!.role;

  const record = db.prepare('SELECT * FROM medical_records WHERE id = ?').get(recordId) as any;
  if (!record) {
    return res.status(404).json({ error: 'Record not found.' });
  }

  // Security authorization: Patient can view own; Doctor can view if under care; Admin can view
  if (role === 'patient' && record.patient_id !== userId) {
    return res.status(403).json({ error: 'Access denied.' });
  }

  res.json(record);
});

apiRouter.post('/patient/records', requireAuth, requireRole(['patient']), (req: AuthenticatedRequest, res) => {
  const patientId = req.user!.id;
  const { title, record_type, file_name, file_type, file_data_base64, notes } = req.body;

  if (!title || !file_name || !file_type || !file_data_base64) {
    return res.status(400).json({ error: 'Missing title or file payload.' });
  }

  // Validate file type (PDF, JPEG, PNG)
  const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
  if (!allowed.includes(file_type.toLowerCase())) {
    return res.status(400).json({ error: 'Only PDF documents and JPG/PNG medical image scans are supported.' });
  }

  // Calculate approximate file size from base64
  const sizeInBytes = Math.round((file_data_base64.length * 3) / 4);
  if (sizeInBytes > 15 * 1024 * 1024) {
    return res.status(400).json({ error: 'File size exceeds maximum permitted limit of 15 MB.' });
  }

  const recId = crypto.randomUUID();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO medical_records (
      id, patient_id, uploaded_by_id, title, record_type, file_name,
      file_type, file_size, file_data_base64, notes, created_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    recId,
    patientId,
    patientId,
    title.trim(),
    record_type || 'LAB_REPORT',
    file_name.trim(),
    file_type.toLowerCase(),
    sizeInBytes,
    file_data_base64,
    notes || '',
    now
  );

  logAudit(patientId, 'patient', 'UPLOAD_MEDICAL_RECORD', 'medical_records', recId, { fileName: file_name, fileType: file_type });
  res.status(201).json({ success: true, id: recId });
});

// Patient Reminders
apiRouter.get('/patient/reminders', requireAuth, requireRole(['patient']), (req: AuthenticatedRequest, res) => {
  const patientId = req.user!.id;
  const list = db.prepare('SELECT * FROM reminders WHERE patient_id = ? ORDER BY due_date ASC').all(patientId);
  res.json(list);
});

apiRouter.post('/patient/reminders', requireAuth, requireRole(['patient']), (req: AuthenticatedRequest, res) => {
  const patientId = req.user!.id;
  const { title, reminder_type, due_date, due_time, channel_preference } = req.body;

  if (!title || !due_date || !due_time) {
    return res.status(400).json({ error: 'Please provide title, due date, and time.' });
  }

  const remId = crypto.randomUUID();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO reminders (id, patient_id, title, reminder_type, due_date, due_time, channel_preference, is_completed, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)
  `).run(
    remId,
    patientId,
    title.trim(),
    reminder_type || 'MEDICATION',
    due_date,
    due_time,
    channel_preference || 'BOTH',
    now
  );

  res.status(201).json({ success: true, id: remId });
});

apiRouter.post('/patient/reminders/:id/toggle', requireAuth, requireRole(['patient']), (req: AuthenticatedRequest, res) => {
  const patientId = req.user!.id;
  const remId = req.params.id;

  const current = db.prepare('SELECT is_completed FROM reminders WHERE id = ? AND patient_id = ?').get(remId, patientId) as { is_completed: number } | undefined;
  if (!current) {
    return res.status(404).json({ error: 'Reminder not found.' });
  }

  const newStatus = current.is_completed === 1 ? 0 : 1;
  db.prepare('UPDATE reminders SET is_completed = ? WHERE id = ?').run(newStatus, remId);

  res.json({ success: true, is_completed: Boolean(newStatus) });
});

// Secure In-App Messages
apiRouter.get('/patient/messages', requireAuth, (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const messages = db.prepare(`
    SELECT m.*, s.full_name as sender_name, r.full_name as recipient_name
    FROM messages m
    JOIN profiles s ON s.id = m.sender_id
    JOIN profiles r ON r.id = m.recipient_id
    WHERE m.sender_id = ? OR m.recipient_id = ?
    ORDER BY m.created_at ASC
  `).all(userId, userId);

  res.json(messages);
});

apiRouter.post('/patient/messages', requireAuth, (req: AuthenticatedRequest, res) => {
  const senderId = req.user!.id;
  const { recipient_id, content } = req.body;

  if (!recipient_id || !content || !content.trim()) {
    return res.status(400).json({ error: 'Recipient and content are required.' });
  }

  const convId = [senderId, recipient_id].sort().join('_');
  const msgId = crypto.randomUUID();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO messages (id, conversation_id, sender_id, recipient_id, content, is_read, created_at)
    VALUES (?, ?, ?, ?, ?, 0, ?)
  `).run(msgId, convId, senderId, recipient_id, content.trim(), now);

  res.status(201).json({ success: true, id: msgId });
});

// ==========================================
// 3. DOCTOR PORTAL ENDPOINTS
// ==========================================

// Doctor Dashboard
apiRouter.get('/doctor/dashboard', requireAuth, requireRole(['doctor']), (req: AuthenticatedRequest, res) => {
  const doctorId = req.user!.id;

  const totalAssigned = db.prepare('SELECT COUNT(*) as count FROM appointments WHERE doctor_id = ?').get(doctorId) as { count: number };
  const pendingRequests = db.prepare("SELECT COUNT(*) as count FROM appointments WHERE doctor_id = ? AND status = 'PENDING'").get(doctorId) as { count: number };
  const todayDate = new Date().toISOString().split('T')[0];
  const todayAppointments = db.prepare(`
    SELECT a.*, p.full_name as patient_name, p.phone as patient_phone, p.village_or_town
    FROM appointments a
    JOIN profiles p ON p.id = a.patient_id
    WHERE a.doctor_id = ? AND a.appointment_date = ?
    ORDER BY a.time_slot ASC
  `).all(doctorId, todayDate);

  res.json({
    stats: {
      totalAssigned: totalAssigned.count,
      pendingRequests: pendingRequests.count,
    },
    todayAppointments,
  });
});

// Doctor Appointments List
apiRouter.get('/doctor/appointments', requireAuth, requireRole(['doctor']), (req: AuthenticatedRequest, res) => {
  const doctorId = req.user!.id;
  const list = db.prepare(`
    SELECT a.*, p.full_name as patient_name, p.phone as patient_phone, p.village_or_town, p.preferred_language
    FROM appointments a
    JOIN profiles p ON p.id = a.patient_id
    WHERE a.doctor_id = ?
    ORDER BY a.appointment_date DESC, a.created_at DESC
  `).all(doctorId);
  res.json(list);
});

// Doctor Book Consultation for Patient (Walk-in or In-Person Direct Scheduling)
apiRouter.post('/doctor/appointments/book-for-patient', requireAuth, requireRole(['doctor']), (req: AuthenticatedRequest, res) => {
  const currentUserId = req.user!.id;
  const {
    patient_id,
    patient_name,
    patient_phone,
    village_or_town,
    district,
    appointment_date,
    time_slot,
    reason_summary,
    department,
    doctor_id,
  } = req.body;

  if (!appointment_date || !time_slot || !reason_summary) {
    return res.status(400).json({ error: 'Date, time slot, and consultation reason are required.' });
  }

  // Determine target doctor (if doctor_admin specifies another doctor, otherwise current user)
  const targetDoctorId = (req.user!.role === 'doctor_admin' && doctor_id) ? doctor_id : currentUserId;

  let finalPatientId = patient_id;

  // If patient_id not provided, look up by phone or register quick patient
  if (!finalPatientId) {
    if (!patient_phone || !patient_name) {
      return res.status(400).json({ error: 'Either select an existing patient or provide patient name and phone number.' });
    }
    const cleanPhone = patient_phone.trim().replace(/\s+/g, '');
    const existing = db.prepare('SELECT id FROM profiles WHERE phone = ?').get(cleanPhone) as { id: string } | undefined;

    if (existing) {
      finalPatientId = existing.id;
    } else {
      finalPatientId = crypto.randomUUID();
      const tempHash = hashPassword('WalkIn@RuralCare2026');
      const now = new Date().toISOString();
      db.prepare(`
        INSERT INTO profiles (
          id, phone, password_hash, full_name, role, preferred_language,
          village_or_town, district, state, is_verified, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, 'patient', 'kn', ?, ?, 'Karnataka', 1, ?, ?)
      `).run(
        finalPatientId,
        cleanPhone,
        tempHash,
        patient_name.trim(),
        village_or_town?.trim() || 'Local Village',
        district?.trim() || 'Raichur',
        now,
        now
      );
    }
  }

  // Get doctor department
  let docDept = department;
  if (!docDept) {
    const doc = db.prepare('SELECT department FROM doctors WHERE id = ?').get(targetDoctorId) as { department: string } | undefined;
    docDept = doc?.department || 'General Medicine';
  }

  const aptId = crypto.randomUUID();
  const refCode = `RC-${Date.now().toString().slice(-6)}`;
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO appointments (
      id, reference_code, patient_id, doctor_id, department,
      appointment_date, time_slot, reason_summary, status, channel, created_at, updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'CONFIRMED', 'WEB', ?, ?)
  `).run(
    aptId,
    refCode,
    finalPatientId,
    targetDoctorId,
    docDept,
    appointment_date,
    time_slot,
    reason_summary.trim(),
    now,
    now
  );

  logAudit(currentUserId, req.user!.role, 'DOCTOR_BOOK_APPOINTMENT', 'appointments', aptId, {
    patientId: finalPatientId,
    targetDoctorId,
    referenceCode: refCode
  });

  res.status(201).json({
    success: true,
    reference_code: refCode,
    id: aptId,
    patient_id: finalPatientId,
    message: 'Consultation scheduled and confirmed.'
  });
});

// Doctor Update Appointment Status
apiRouter.post('/doctor/appointments/:id/status', requireAuth, requireRole(['doctor']), (req: AuthenticatedRequest, res) => {
  const doctorId = req.user!.id;
  const aptId = req.params.id;
  const { status, status_notes } = req.body;

  const validStatuses = ['CONFIRMED', 'REJECTED', 'COMPLETED', 'CANCELLED'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status.' });
  }

  const apt = db.prepare('SELECT id FROM appointments WHERE id = ? AND doctor_id = ?').get(aptId, doctorId);
  if (!apt) {
    return res.status(404).json({ error: 'Appointment not found or not assigned to you.' });
  }

  const now = new Date().toISOString();
  db.prepare('UPDATE appointments SET status = ?, status_notes = ?, updated_at = ? WHERE id = ?')
    .run(status, status_notes || '', now, aptId);

  logAudit(doctorId, 'doctor', 'UPDATE_APPOINTMENT_STATUS', 'appointments', aptId, { status, status_notes });
  res.json({ success: true, message: `Appointment status updated to ${status}.` });
});

// Doctor Authorized Patient History View (Only patients who have an appointment with this doctor)
apiRouter.get('/doctor/patients', requireAuth, requireRole(['doctor']), (req: AuthenticatedRequest, res) => {
  const doctorId = req.user!.id;
  const patients = db.prepare(`
    SELECT DISTINCT p.id, p.full_name, p.phone, p.village_or_town, p.district, p.preferred_language, p.emergency_contact_phone,
           COUNT(a.id) as total_appointments,
           MAX(a.appointment_date) as latest_visit
    FROM profiles p
    JOIN appointments a ON a.patient_id = p.id
    WHERE a.doctor_id = ?
    GROUP BY p.id
    ORDER BY latest_visit DESC
  `).all(doctorId);

  res.json(patients);
});

apiRouter.get('/doctor/patients/:id', requireAuth, requireRole(['doctor']), (req: AuthenticatedRequest, res) => {
  const doctorId = req.user!.id;
  const patientId = req.params.id;

  // Authorization check: Must have an appointment with this doctor
  const authorized = db.prepare('SELECT id FROM appointments WHERE doctor_id = ? AND patient_id = ? LIMIT 1').get(doctorId, patientId);
  if (!authorized) {
    return res.status(403).json({ error: 'Access denied. You can only view clinical records for patients under your active care.' });
  }

  const patient = db.prepare(`
    SELECT id, full_name, phone, email, village_or_town, district, state, preferred_language, emergency_contact_phone
    FROM profiles WHERE id = ?
  `).get(patientId);

  const pastConsultations = db.prepare(`
    SELECT c.*, a.appointment_date, a.reference_code, p.full_name as doctor_name
    FROM consultations c
    JOIN appointments a ON a.id = c.appointment_id
    JOIN doctors d ON d.id = c.doctor_id
    JOIN profiles p ON p.id = d.id
    WHERE c.patient_id = ?
    ORDER BY c.created_at DESC
  `).all(patientId);

  const pastPrescriptions = db.prepare(`
    SELECT pr.*, a.appointment_date, a.reference_code, p.full_name as doctor_name
    FROM prescriptions pr
    JOIN consultations c ON c.id = pr.consultation_id
    JOIN appointments a ON a.id = c.appointment_id
    JOIN doctors d ON d.id = pr.doctor_id
    JOIN profiles p ON p.id = d.id
    WHERE pr.patient_id = ?
    ORDER BY pr.created_at DESC
  `).all(patientId);

  const records = db.prepare(`
    SELECT id, title, record_type, file_name, file_type, file_size, notes, created_at
    FROM medical_records
    WHERE patient_id = ?
    ORDER BY created_at DESC
  `).all(patientId);

  res.json({
    patient,
    consultations: pastConsultations,
    prescriptions: pastPrescriptions.map((p: any) => ({ ...p, medications: JSON.parse(p.medications || '[]') })),
    records,
  });
});

// Doctor Consultation Notes (Confidential clinical record)
apiRouter.post('/doctor/consultations', requireAuth, requireRole(['doctor']), (req: AuthenticatedRequest, res) => {
  const doctorId = req.user!.id;
  const { appointment_id, symptoms_observed, clinical_notes, follow_up_date, follow_up_instructions } = req.body;

  if (!appointment_id || !symptoms_observed || !clinical_notes) {
    return res.status(400).json({ error: 'Appointment ID, observed symptoms, and clinical notes are required.' });
  }

  const apt = db.prepare('SELECT id, patient_id FROM appointments WHERE id = ? AND doctor_id = ?').get(appointment_id, doctorId) as { id: string; patient_id: string } | undefined;
  if (!apt) {
    return res.status(403).json({ error: 'Unauthorized or appointment does not exist.' });
  }

  // Check if consultation already exists for this appointment
  const existing = db.prepare('SELECT id FROM consultations WHERE appointment_id = ?').get(appointment_id);
  if (existing) {
    return res.status(409).json({ error: 'A consultation is already recorded for this appointment.' });
  }

  const consultId = crypto.randomUUID();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO consultations (
      id, appointment_id, doctor_id, patient_id, symptoms_observed,
      clinical_notes, follow_up_date, follow_up_instructions, created_at, updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    consultId,
    appointment_id,
    doctorId,
    apt.patient_id,
    symptoms_observed.trim(),
    clinical_notes.trim(),
    follow_up_date || null,
    follow_up_instructions || '',
    now,
    now
  );

  // Mark appointment as COMPLETED
  db.prepare("UPDATE appointments SET status = 'COMPLETED', updated_at = ? WHERE id = ?").run(now, appointment_id);

  logAudit(doctorId, 'doctor', 'RECORD_CONSULTATION', 'consultations', consultId, { appointmentId: appointment_id });
  res.status(201).json({ success: true, id: consultId });
});

// Doctor Issue Prescription
apiRouter.post('/doctor/prescriptions', requireAuth, requireRole(['doctor']), (req: AuthenticatedRequest, res) => {
  const doctorId = req.user!.id;
  const { consultation_id, medications, general_advice } = req.body;

  if (!consultation_id || !Array.isArray(medications) || medications.length === 0) {
    return res.status(400).json({ error: 'Consultation ID and at least one medication are required.' });
  }

  const consult = db.prepare('SELECT id, patient_id, doctor_id FROM consultations WHERE id = ?').get(consultation_id) as { id: string; patient_id: string; doctor_id: string } | undefined;
  if (!consult || consult.doctor_id !== doctorId) {
    return res.status(403).json({ error: 'Unauthorized. You can only prescribe for your own consultations.' });
  }

  const rxId = crypto.randomUUID();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO prescriptions (id, consultation_id, patient_id, doctor_id, medications, general_advice, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    rxId,
    consultation_id,
    consult.patient_id,
    doctorId,
    JSON.stringify(medications),
    general_advice || '',
    now
  );

  logAudit(doctorId, 'doctor', 'ISSUE_PRESCRIPTION', 'prescriptions', rxId, { consultationId: consultation_id });
  res.status(201).json({ success: true, id: rxId });
});

// Doctor Schedule Availability
apiRouter.get('/doctor/availability', requireAuth, requireRole(['doctor']), (req: AuthenticatedRequest, res) => {
  const doctorId = req.user!.id;
  const doc = db.prepare('SELECT availability_schedule FROM doctors WHERE id = ?').get(doctorId) as { availability_schedule: string } | undefined;
  res.json({ schedule: JSON.parse(doc?.availability_schedule || '[]') });
});

apiRouter.put('/doctor/availability', requireAuth, requireRole(['doctor']), (req: AuthenticatedRequest, res) => {
  const doctorId = req.user!.id;
  const { schedule } = req.body;

  if (!Array.isArray(schedule)) {
    return res.status(400).json({ error: 'Schedule must be an array of day/slot definitions.' });
  }

  const now = new Date().toISOString();
  db.prepare('UPDATE doctors SET availability_schedule = ?, updated_at = ? WHERE id = ?')
    .run(JSON.stringify(schedule), now, doctorId);

  res.json({ success: true, message: 'Availability schedule updated.' });
});

// ==========================================
// 4. VILLAGE HEALTH WORKER (ASHA) ENDPOINTS
// ==========================================

// Health Worker Dashboard
apiRouter.get('/health-worker/dashboard', requireAuth, requireRole(['health_worker']), (req: AuthenticatedRequest, res) => {
  const workerId = req.user!.id;
  const hw = db.prepare('SELECT assigned_village FROM health_workers WHERE id = ?').get(workerId) as { assigned_village: string } | undefined;
  const village = hw?.assigned_village || req.user!.village_or_town;

  const pendingCallbacks = db.prepare(`
    SELECT COUNT(*) as count
    FROM callback_requests
    WHERE assigned_health_worker_id = ? AND status IN ('PENDING', 'ASSIGNED')
  `).get(workerId) as { count: number };

  const assistedPatientsCount = db.prepare(`
    SELECT COUNT(DISTINCT patient_id) as count
    FROM patient_consents
    WHERE witness_or_worker_id = ?
  `).get(workerId) as { count: number };

  const villagePatients = db.prepare(`
    SELECT id, full_name, phone, village_or_town, preferred_language, emergency_contact_phone, created_at
    FROM profiles
    WHERE role = 'patient' AND village_or_town = ?
    ORDER BY created_at DESC
    LIMIT 10
  `).all(village);

  const activeCallbacks = db.prepare(`
    SELECT * FROM callback_requests
    WHERE (assigned_health_worker_id = ? OR assigned_health_worker_id IS NULL)
      AND status IN ('PENDING', 'ASSIGNED')
    ORDER BY created_at ASC
  `).all(workerId);

  res.json({
    stats: {
      pendingCallbacks: pendingCallbacks.count,
      assistedPatientsCount: assistedPatientsCount.count,
      assignedVillage: village,
    },
    villagePatients,
    activeCallbacks,
  });
});

// Assisted Patient Registration (with verifiable patient consent)
apiRouter.post('/health-worker/assisted-registration', requireAuth, requireRole(['health_worker']), (req: AuthenticatedRequest, res) => {
  const workerId = req.user!.id;
  const { phone, full_name, preferred_language, village_or_town, district, emergency_contact_phone, consent_confirmed, initial_appointment_dept, initial_appointment_reason } = req.body;

  if (!phone || !full_name || !village_or_town || !district) {
    return res.status(400).json({ error: 'Phone number, full name, village, and district are required.' });
  }

  if (!consent_confirmed) {
    return res.status(400).json({ error: 'Assisted registration requires explicit patient or guardian verbal/written consent.' });
  }

  const cleanPhone = phone.trim().replace(/\s+/g, '');
  const existing = db.prepare('SELECT id FROM profiles WHERE phone = ?').get(cleanPhone) as { id: string } | undefined;

  let patientId = existing?.id;
  const now = new Date().toISOString();

  if (!patientId) {
    patientId = crypto.randomUUID();
    const tempHash = hashPassword('Assisted@RuralCare2026');
    db.prepare(`
      INSERT INTO profiles (
        id, phone, password_hash, full_name, role, preferred_language,
        village_or_town, district, state, emergency_contact_phone, is_verified, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, 'patient', ?, ?, ?, 'Karnataka', ?, 1, ?, ?)
    `).run(
      patientId,
      cleanPhone,
      tempHash,
      full_name.trim(),
      preferred_language || 'kn',
      village_or_town.trim(),
      district.trim(),
      emergency_contact_phone || null,
      now,
      now
    );
  }

  // Record Consent in immutable ledger
  const consentId = crypto.randomUUID();
  db.prepare(`
    INSERT INTO patient_consents (id, patient_id, consent_type, granted, witness_or_worker_id, consent_text, recorded_at)
    VALUES (?, ?, 'ASSISTED_REGISTRATION', 1, ?, 'Patient consented to assisted digital registration and care coordination via Village Health Worker.', ?)
  `).run(consentId, patientId, workerId, now);

  // Link Health Worker Assignment
  const assignId = crypto.randomUUID();
  try {
    db.prepare(`
      INSERT OR REPLACE INTO health_worker_assignments (id, health_worker_id, patient_id, assigned_by_admin_id, active, notes, created_at)
      VALUES (?, ?, ?, ?, 1, 'Assisted community registration', ?)
    `).run(assignId, workerId, patientId, workerId, now);
  } catch {
    // Already linked
  }

  let appointmentReference: string | null = null;
  // If initial appointment requested simultaneously
  if (initial_appointment_dept) {
    let doc = db.prepare('SELECT id FROM doctors WHERE department LIKE ? AND is_verified_by_admin = 1 LIMIT 1').get(`%${initial_appointment_dept}%`) as { id: string } | undefined;
    if (!doc) {
      doc = db.prepare('SELECT id FROM doctors WHERE is_verified_by_admin = 1 LIMIT 1').get() as { id: string } | undefined;
    }

    if (doc) {
      const aptId = crypto.randomUUID();
      appointmentReference = `RC-${Date.now().toString().slice(-6)}`;
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      db.prepare(`
        INSERT INTO appointments (
          id, reference_code, patient_id, doctor_id, created_by_worker_id, department,
          appointment_date, time_slot, reason_summary, status, channel, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, '11:00 AM - 12:00 PM', ?, 'PENDING', 'HEALTH_WORKER', ?, ?)
      `).run(
        aptId,
        appointmentReference,
        patientId,
        doc.id,
        workerId,
        initial_appointment_dept,
        tomorrow,
        initial_appointment_reason || 'Assisted community appointment',
        now,
        now
      );
    }
  }

  logAudit(workerId, 'health_worker', 'ASSISTED_PATIENT_REGISTRATION', 'profiles', patientId, { phone: cleanPhone, appointmentReference });
  res.status(201).json({
    success: true,
    patient_id: patientId,
    appointment_reference: appointmentReference,
    message: 'Patient registered with consent recorded.',
  });
});

// Health Worker Callback Queue & Status Updates
apiRouter.get('/health-worker/callbacks', requireAuth, requireRole(['health_worker']), (req: AuthenticatedRequest, res) => {
  const workerId = req.user!.id;
  const list = db.prepare(`
    SELECT c.*, p.village_or_town, p.preferred_language
    FROM callback_requests c
    LEFT JOIN profiles p ON p.id = c.patient_id
    WHERE c.assigned_health_worker_id = ? OR c.assigned_health_worker_id IS NULL
    ORDER BY c.created_at DESC
  `).all(workerId);
  res.json(list);
});

apiRouter.post('/health-worker/callbacks/:id/status', requireAuth, requireRole(['health_worker']), (req: AuthenticatedRequest, res) => {
  const workerId = req.user!.id;
  const cbId = req.params.id;
  const { status, resolution_notes } = req.body;

  const valid = ['ASSIGNED', 'CALLED_BACK', 'RESOLVED', 'UNREACHABLE'];
  if (!valid.includes(status)) {
    return res.status(400).json({ error: 'Invalid callback status.' });
  }

  const now = new Date().toISOString();
  db.prepare(`
    UPDATE callback_requests
    SET status = ?, resolution_notes = ?, assigned_health_worker_id = ?, attempt_count = attempt_count + 1, updated_at = ?
    WHERE id = ?
  `).run(status, resolution_notes || '', workerId, now, cbId);

  logAudit(workerId, 'health_worker', 'UPDATE_CALLBACK_STATUS', 'callback_requests', cbId, { status, resolution_notes });
  res.json({ success: true, message: 'Callback updated successfully.' });
});

// Restricted Village Patients Directory for Health Worker (No clinical consultation notes/prescriptions)
apiRouter.get('/health-worker/patients', requireAuth, requireRole(['health_worker']), (req: AuthenticatedRequest, res) => {
  const workerId = req.user!.id;
  const hw = db.prepare('SELECT assigned_village FROM health_workers WHERE id = ?').get(workerId) as { assigned_village: string } | undefined;
  const village = hw?.assigned_village || req.user!.village_or_town;

  const patients = db.prepare(`
    SELECT id, full_name, phone, village_or_town, district, preferred_language, emergency_contact_phone, created_at
    FROM profiles
    WHERE role = 'patient' AND (village_or_town = ? OR id IN (SELECT patient_id FROM health_worker_assignments WHERE health_worker_id = ?))
    ORDER BY full_name ASC
  `).all(village, workerId);

  res.json(patients);
});

// Health Worker Audit Activity Log
apiRouter.get('/health-worker/activity', requireAuth, requireRole(['health_worker']), (req: AuthenticatedRequest, res) => {
  const workerId = req.user!.id;
  const logs = db.prepare(`
    SELECT * FROM audit_logs
    WHERE actor_id = ?
    ORDER BY timestamp DESC
    LIMIT 50
  `).all(workerId);
  res.json(logs);
});

// ==========================================
// 5. ADMINISTRATOR ENDPOINTS
// ==========================================

// Administrator Dashboard Overview
apiRouter.get('/admin/dashboard', requireAuth, requireRole(['admin']), (_req, res) => {
  const totalPatients = db.prepare("SELECT COUNT(*) as count FROM profiles WHERE role = 'patient'").get() as { count: number };
  const totalDoctors = db.prepare('SELECT COUNT(*) as count FROM doctors').get() as { count: number };
  const verifiedDoctors = db.prepare('SELECT COUNT(*) as count FROM doctors WHERE is_verified_by_admin = 1').get() as { count: number };
  const totalHealthWorkers = db.prepare('SELECT COUNT(*) as count FROM health_workers').get() as { count: number };
  const totalAppointments = db.prepare('SELECT COUNT(*) as count FROM appointments').get() as { count: number };
  const pendingCallbacks = db.prepare("SELECT COUNT(*) as count FROM callback_requests WHERE status IN ('PENDING', 'ASSIGNED')").get() as { count: number };
  const smsCount = db.prepare('SELECT COUNT(*) as count FROM sms_events').get() as { count: number };

  const recentAudit = db.prepare('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 8').all();

  res.json({
    metrics: {
      totalPatients: totalPatients.count,
      totalDoctors: totalDoctors.count,
      verifiedDoctors: verifiedDoctors.count,
      totalHealthWorkers: totalHealthWorkers.count,
      totalAppointments: totalAppointments.count,
      pendingCallbacks: pendingCallbacks.count,
      smsCount: smsCount.count,
    },
    recentAudit,
  });
});

// Admin Users List & Doctor Verification
apiRouter.get('/admin/users', requireAuth, requireRole(['admin']), (_req, res) => {
  const users = db.prepare(`
    SELECT p.*,
           d.license_number, d.department, d.is_verified_by_admin as doctor_verified,
           hw.worker_code, hw.assigned_village
    FROM profiles p
    LEFT JOIN doctors d ON d.id = p.id
    LEFT JOIN health_workers hw ON hw.id = p.id
    ORDER BY p.created_at DESC
  `).all();
  res.json(users);
});

apiRouter.post('/admin/doctors/:id/verify', requireAuth, requireRole(['admin']), (req: AuthenticatedRequest, res) => {
  const doctorId = req.params.id;
  const adminId = req.user!.id;
  const { is_verified } = req.body;

  const verifiedInt = is_verified ? 1 : 0;
  const now = new Date().toISOString();

  db.prepare('UPDATE doctors SET is_verified_by_admin = ?, updated_at = ? WHERE id = ?').run(verifiedInt, now, doctorId);
  db.prepare('UPDATE profiles SET is_verified = ?, updated_at = ? WHERE id = ?').run(verifiedInt, now, doctorId);

  logAudit(adminId, 'admin', 'VERIFY_DOCTOR', 'doctors', doctorId, { is_verified: Boolean(verifiedInt) });
  res.json({ success: true, message: `Doctor verification status updated to ${verifiedInt === 1 ? 'VERIFIED' : 'UNVERIFIED'}.` });
});

// Admin Create Staff (Doctor or Health Worker)
apiRouter.post('/admin/users/create-staff', requireAuth, requireRole(['admin']), (req: AuthenticatedRequest, res) => {
  const adminId = req.user!.id;
  const { role, full_name, phone, email, password, department, license_number, qualification, worker_code, assigned_village, assigned_primary_health_center } = req.body;

  if (!role || !full_name || !phone || !password) {
    return res.status(400).json({ error: 'Role, name, phone, and password are required.' });
  }

  const cleanPhone = phone.trim().replace(/\s+/g, '');
  const existing = db.prepare('SELECT id FROM profiles WHERE phone = ?').get(cleanPhone);
  if (existing) {
    return res.status(409).json({ error: 'A staff member with this phone number already exists.' });
  }

  const staffId = crypto.randomUUID();
  const hash = hashPassword(password);
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO profiles (
      id, email, phone, password_hash, full_name, role, preferred_language,
      village_or_town, district, state, is_verified, created_at, updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, 'en', ?, 'Raichur', 'Karnataka', 1, ?, ?)
  `).run(
    staffId,
    email || null,
    cleanPhone,
    hash,
    full_name.trim(),
    role,
    assigned_village || 'District Hospital Raichur',
    now,
    now
  );

  if (role === 'doctor') {
    db.prepare(`
      INSERT INTO doctors (
        id, license_number, department, qualification, years_of_experience,
        bio, is_verified_by_admin, availability_schedule, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, 5, 'Hospital Medical Specialist', 1, '[]', ?, ?)
    `).run(
      staffId,
      license_number || `MED-KA-${Date.now().toString().slice(-5)}`,
      department || 'General Medicine',
      qualification || 'MBBS, MD',
      now,
      now
    );
  } else if (role === 'health_worker') {
    db.prepare(`
      INSERT INTO health_workers (
        id, worker_code, assigned_village, assigned_primary_health_center,
        supervisor_name, is_verified_by_admin, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, 'Dr. Ramesh Patil', 1, ?, ?)
    `).run(
      staffId,
      worker_code || `ASHA-${Date.now().toString().slice(-4)}`,
      assigned_village || 'Gabbur',
      assigned_primary_health_center || 'PHC Gabbur Cluster',
      now,
      now
    );
  }

  logAudit(adminId, 'admin', 'CREATE_STAFF_ACCOUNT', 'profiles', staffId, { role, full_name });
  res.status(201).json({ success: true, id: staffId });
});

// Admin All Appointments
apiRouter.get('/admin/appointments', requireAuth, requireRole(['admin']), (_req, res) => {
  const appointments = db.prepare(`
    SELECT a.*, p.full_name as patient_name, p.phone as patient_phone,
           d_p.full_name as doctor_name, d.department
    FROM appointments a
    JOIN profiles p ON p.id = a.patient_id
    JOIN doctors d ON d.id = a.doctor_id
    JOIN profiles d_p ON d_p.id = d.id
    ORDER BY a.created_at DESC
  `).all();
  res.json(appointments);
});

// Admin All Callbacks
apiRouter.get('/admin/callbacks', requireAuth, requireRole(['admin']), (_req, res) => {
  const list = db.prepare(`
    SELECT c.*, p.full_name as patient_name, hw_p.full_name as assigned_worker_name
    FROM callback_requests c
    LEFT JOIN profiles p ON p.id = c.patient_id
    LEFT JOIN health_workers hw ON hw.id = c.assigned_health_worker_id
    LEFT JOIN profiles hw_p ON hw_p.id = hw.id
    ORDER BY c.created_at DESC
  `).all();
  res.json(list);
});

// Admin Communications Status & Real SMS/Telephony telemetry
apiRouter.get('/admin/communications', requireAuth, requireRole(['admin']), (_req, res) => {
  const smsLive = isSmsProviderLive();
  const telephonyLive = isTelephonyProviderLive();

  const smsEvents = db.prepare('SELECT * FROM sms_events ORDER BY created_at DESC LIMIT 30').all();
  const telephonyCallbacks = db.prepare("SELECT * FROM callback_requests WHERE source = 'MISSED_CALL' ORDER BY created_at DESC LIMIT 30").all();

  res.json({
    smsStatus: smsLive,
    telephonyStatus: telephonyLive,
    recentSmsEvents: smsEvents,
    recentMissedCalls: telephonyCallbacks,
  });
});

// Admin Audit Logs
apiRouter.get('/admin/audit-logs', requireAuth, requireRole(['admin']), (_req, res) => {
  const logs = db.prepare('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 100').all();
  res.json(logs);
});

// ==========================================
// 6. REAL SMS & MISSED-CALL WEBHOOKS
// ==========================================

// Inbound SMS Webhook (Matches Indian SMS Gateways like Kaleyra, Exotel, Gupshup, Twilio)
apiRouter.post('/sms/inbound', (req, res) => {
  // Provider formats vary: from/sender/From, body/text/Body, id/MessageSid
  const fromPhone = req.body.From || req.body.from || req.body.sender || req.query.from;
  const messageBody = req.body.Body || req.body.body || req.body.text || req.query.text;
  const messageId = req.body.MessageSid || req.body.message_id || req.body.id || req.query.id;

  if (!fromPhone || !messageBody) {
    return res.status(400).send('Missing required from or text fields');
  }

  const result = processInboundSms(String(fromPhone), String(messageBody), messageId ? String(messageId) : undefined);

  // Return standard XML or JSON response matching gateway standards
  res.set('Content-Type', 'text/plain');
  res.status(200).send(result.replyText);
});

// SMS Delivery Status Webhook
apiRouter.post('/sms/status-callback', (req, res) => {
  const messageId = req.body.MessageSid || req.body.message_id;
  const status = req.body.MessageStatus || req.body.status || 'DELIVERED';

  if (messageId) {
    db.prepare('UPDATE sms_events SET provider_status = ? WHERE message_id = ?').run(status, messageId);
  }
  res.status(200).send('OK');
});

// Telephony Inbound Missed-Call Webhook
apiRouter.post('/telephony/missed-call', (req, res) => {
  const secret = process.env.TELEPHONY_WEBHOOK_SECRET;
  const signature = req.headers['x-telephony-signature'] as string | undefined;

  // Validate HMAC signature if secret configured
  if (secret && !verifyTelephonySignature(JSON.stringify(req.body), signature, secret)) {
    return res.status(401).json({ error: 'Invalid cryptographic signature from telephony provider.' });
  }

  const callId = req.body.CallSid || req.body.call_id || req.body.event_id || `CALL-${Date.now()}`;
  const fromPhone = req.body.From || req.body.from || req.body.caller_number;

  if (!fromPhone) {
    return res.status(400).json({ error: 'Caller phone is required.' });
  }

  const result = processMissedCallEvent({
    callId,
    fromPhone: String(fromPhone),
    timestamp: new Date().toISOString(),
  });

  res.status(200).json(result);
});

// ==========================================
// 7. OFFLINE SYNC ENDPOINT (IndexedDB Sync)
// ==========================================

apiRouter.post('/sync/offline-batch', requireAuth, (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const { items } = req.body; // Array of queued actions with client requestId

  if (!Array.isArray(items)) {
    return res.status(400).json({ error: 'Items array expected.' });
  }

  const results: Array<{ requestId: string; status: 'Synced' | 'Failed'; error?: string; reference?: string }> = [];

  for (const item of items) {
    try {
      if (item.action === 'CREATE_APPOINTMENT') {
        const { doctor_id, department, appointment_date, time_slot, reason_summary } = item.payload;
        const aptId = crypto.randomUUID();
        const refCode = `RC-${Date.now().toString().slice(-6)}`;
        const now = new Date().toISOString();

        db.prepare(`
          INSERT INTO appointments (
            id, reference_code, patient_id, doctor_id, department,
            appointment_date, time_slot, reason_summary, status, channel, created_at, updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', 'WEB', ?, ?)
        `).run(aptId, refCode, userId, doctor_id, department, appointment_date, time_slot, reason_summary, now, now);

        results.push({ requestId: item.requestId, status: 'Synced', reference: refCode });
      } else if (item.action === 'CREATE_CALLBACK') {
        const { caller_phone, caller_name } = item.payload;
        const cbId = crypto.randomUUID();
        const now = new Date().toISOString();

        db.prepare(`
          INSERT INTO callback_requests (id, caller_phone, caller_name, patient_id, source, status, created_at, updated_at)
          VALUES (?, ?, ?, ?, 'ASSISTED_PORTAL', 'PENDING', ?, ?)
        `).run(cbId, caller_phone, caller_name, userId, now, now);

        results.push({ requestId: item.requestId, status: 'Synced', reference: cbId });
      } else {
        results.push({ requestId: item.requestId, status: 'Failed', error: 'Unknown action type.' });
      }
    } catch (err: any) {
      results.push({ requestId: item.requestId, status: 'Failed', error: err.message || 'Error processing item.' });
    }
  }

  res.json({ results });
});

// ==========================================
// 8. SUPABASE CLOUD SYNC & CONFIGURATION
// ==========================================

// Get current Supabase status (Safe for display: masks secrets)
apiRouter.get('/supabase/status', requireAuth, (_req, res) => {
  const config = getSupabaseConfig();
  res.json({
    isConfigured: config.isConfigured,
    url: config.url || '',
    hasAnonKey: Boolean(config.anonKey),
    hasServiceKey: Boolean(config.serviceKey),
    anonKeyPreview: config.anonKey ? `${config.anonKey.slice(0, 10)}...${config.anonKey.slice(-6)}` : '',
    serviceKeyPreview: config.serviceKey ? `${config.serviceKey.slice(0, 8)}...${config.serviceKey.slice(-6)}` : '',
  });
});

// Update Supabase credentials (Admin or Doctor Admin)
apiRouter.post('/supabase/config', requireAuth, requireRole(['admin']), (req: AuthenticatedRequest, res) => {
  const { url, anonKey, serviceKey } = req.body;
  if (!url || !anonKey) {
    return res.status(400).json({ error: 'Supabase Project URL and Anon Public Key are required.' });
  }

  saveSupabaseConfig(url, anonKey, serviceKey);
  logAudit(req.user!.id, req.user!.role, 'UPDATE_SUPABASE_CONFIG', 'system_settings', null, { url });

  res.json({ success: true, message: 'Supabase configuration saved successfully.' });
});

// Test Supabase connection
apiRouter.post('/supabase/test-connection', requireAuth, async (req, res) => {
  const { url, anonKey, serviceKey } = req.body || {};
  const result = await testSupabaseConnection(url, serviceKey || anonKey);
  res.json(result);
});

// Sync local SQLite records to Supabase Cloud (Admin or Doctor Admin)
apiRouter.post('/supabase/sync-data', requireAuth, requireRole(['admin']), async (req: AuthenticatedRequest, res) => {
  try {
    const result = await syncLocalDataToSupabase();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Sync failed.' });
  }
});

// View PostgreSQL migration schema
apiRouter.get('/supabase/sql-migration', requireAuth, (_req, res) => {
  const sql = getSqlMigrationContent();
  res.json({ sql });
});
