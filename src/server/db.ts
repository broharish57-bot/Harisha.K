import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';

// Setup data directory for SQLite persistence
const DATA_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'ruralcare.db');
export const db = new DatabaseSync(DB_PATH);

// Enable Foreign Key support and WAL mode for performance & integrity
db.exec('PRAGMA foreign_keys = ON;');

// Initialize Tables
export function initDatabase() {
  // Check if profiles table exists and needs migration for 'doctor_admin' role
  try {
    const tableInfo = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='profiles'").get() as { sql: string } | undefined;
    if (tableInfo && !tableInfo.sql.includes('doctor_admin')) {
      db.exec('PRAGMA foreign_keys = OFF;');
      db.exec(`
        CREATE TABLE profiles_temp (
          id TEXT PRIMARY KEY,
          email TEXT UNIQUE,
          phone TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          full_name TEXT NOT NULL,
          role TEXT NOT NULL CHECK(role IN ('patient', 'doctor', 'health_worker', 'admin', 'doctor_admin')),
          preferred_language TEXT NOT NULL DEFAULT 'en' CHECK(preferred_language IN ('kn', 'hi', 'en')),
          village_or_town TEXT NOT NULL,
          district TEXT NOT NULL,
          state TEXT NOT NULL DEFAULT 'Karnataka',
          emergency_contact_phone TEXT,
          is_verified INTEGER NOT NULL DEFAULT 0,
          sms_opt_out INTEGER NOT NULL DEFAULT 0,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
        INSERT INTO profiles_temp SELECT * FROM profiles;
        DROP TABLE profiles;
        ALTER TABLE profiles_temp RENAME TO profiles;
      `);
      db.exec('PRAGMA foreign_keys = ON;');
      console.log('[RuralCare] Migrated profiles table to include doctor_admin role');
    }
  } catch (err) {
    console.error('Migration error:', err);
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE,
      phone TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('patient', 'doctor', 'health_worker', 'admin', 'doctor_admin')),
      preferred_language TEXT NOT NULL DEFAULT 'en' CHECK(preferred_language IN ('kn', 'hi', 'en')),
      village_or_town TEXT NOT NULL,
      district TEXT NOT NULL,
      state TEXT NOT NULL DEFAULT 'Karnataka',
      emergency_contact_phone TEXT,
      is_verified INTEGER NOT NULL DEFAULT 0,
      sms_opt_out INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS doctors (
      id TEXT PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
      license_number TEXT UNIQUE NOT NULL,
      department TEXT NOT NULL,
      qualification TEXT NOT NULL,
      years_of_experience INTEGER NOT NULL DEFAULT 0,
      bio TEXT,
      is_verified_by_admin INTEGER NOT NULL DEFAULT 0,
      availability_schedule TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS health_workers (
      id TEXT PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
      worker_code TEXT UNIQUE NOT NULL,
      assigned_village TEXT NOT NULL,
      assigned_primary_health_center TEXT NOT NULL,
      supervisor_name TEXT,
      is_verified_by_admin INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id TEXT PRIMARY KEY,
      reference_code TEXT UNIQUE NOT NULL,
      patient_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
      doctor_id TEXT NOT NULL REFERENCES doctors(id) ON DELETE RESTRICT,
      created_by_worker_id TEXT REFERENCES health_workers(id) ON DELETE SET NULL,
      department TEXT NOT NULL,
      appointment_date TEXT NOT NULL,
      time_slot TEXT NOT NULL,
      reason_summary TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'CONFIRMED', 'REJECTED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED')),
      status_notes TEXT,
      channel TEXT NOT NULL DEFAULT 'WEB' CHECK(channel IN ('WEB', 'SMS', 'HEALTH_WORKER', 'MISSED_CALL')),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(doctor_id, appointment_date, time_slot)
    );

    CREATE TABLE IF NOT EXISTS consultations (
      id TEXT PRIMARY KEY,
      appointment_id TEXT UNIQUE NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
      doctor_id TEXT NOT NULL REFERENCES doctors(id) ON DELETE RESTRICT,
      patient_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
      symptoms_observed TEXT NOT NULL,
      clinical_notes TEXT NOT NULL,
      follow_up_date TEXT,
      follow_up_instructions TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS prescriptions (
      id TEXT PRIMARY KEY,
      consultation_id TEXT NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
      patient_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
      doctor_id TEXT NOT NULL REFERENCES doctors(id) ON DELETE RESTRICT,
      medications TEXT NOT NULL DEFAULT '[]',
      general_advice TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS medical_records (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      uploaded_by_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
      title TEXT NOT NULL,
      record_type TEXT NOT NULL CHECK(record_type IN ('LAB_REPORT', 'DISCHARGE_SUMMARY', 'IMAGING', 'VACCINATION', 'OTHER')),
      file_name TEXT NOT NULL,
      file_type TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      file_data_base64 TEXT NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL,
      sender_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      recipient_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      is_read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS reminders (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      reminder_type TEXT NOT NULL CHECK(reminder_type IN ('MEDICATION', 'FOLLOW_UP', 'VACCINATION', 'APPOINTMENT')),
      due_date TEXT NOT NULL,
      due_time TEXT NOT NULL,
      channel_preference TEXT NOT NULL DEFAULT 'BOTH' CHECK(channel_preference IN ('SMS', 'IN_APP', 'BOTH')),
      is_completed INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sms_sessions (
      id TEXT PRIMARY KEY,
      phone TEXT UNIQUE NOT NULL,
      current_step TEXT NOT NULL DEFAULT 'MAIN_MENU',
      session_data TEXT NOT NULL DEFAULT '{}',
      language TEXT NOT NULL DEFAULT 'en' CHECK(language IN ('kn', 'hi', 'en')),
      last_interaction_at TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sms_events (
      id TEXT PRIMARY KEY,
      direction TEXT NOT NULL CHECK(direction IN ('INBOUND', 'OUTBOUND')),
      phone TEXT NOT NULL,
      message_id TEXT,
      content TEXT NOT NULL,
      provider_status TEXT NOT NULL DEFAULT 'RECEIVED',
      error_message TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS callback_requests (
      id TEXT PRIMARY KEY,
      caller_phone TEXT NOT NULL,
      caller_name TEXT,
      patient_id TEXT REFERENCES profiles(id) ON DELETE SET NULL,
      assigned_health_worker_id TEXT REFERENCES health_workers(id) ON DELETE SET NULL,
      source TEXT NOT NULL CHECK(source IN ('MISSED_CALL', 'SMS_MENU', 'ASSISTED_PORTAL')),
      status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'ASSIGNED', 'CALLED_BACK', 'RESOLVED', 'UNREACHABLE')),
      resolution_notes TEXT,
      attempt_count INTEGER NOT NULL DEFAULT 0,
      provider_call_id TEXT UNIQUE,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS health_worker_assignments (
      id TEXT PRIMARY KEY,
      health_worker_id TEXT NOT NULL REFERENCES health_workers(id) ON DELETE CASCADE,
      patient_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      assigned_by_admin_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
      active INTEGER NOT NULL DEFAULT 1,
      notes TEXT,
      created_at TEXT NOT NULL,
      UNIQUE(health_worker_id, patient_id)
    );

    CREATE TABLE IF NOT EXISTS patient_consents (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      consent_type TEXT NOT NULL,
      granted INTEGER NOT NULL DEFAULT 1,
      witness_or_worker_id TEXT REFERENCES health_workers(id) ON DELETE SET NULL,
      consent_text TEXT NOT NULL,
      recorded_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      actor_id TEXT,
      actor_role TEXT,
      action TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_id TEXT,
      details TEXT,
      ip_address TEXT,
      timestamp TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS system_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      description TEXT,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone);
    CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);
    CREATE INDEX IF NOT EXISTS idx_appointments_doctor ON appointments(doctor_id, appointment_date);
    CREATE INDEX IF NOT EXISTS idx_callbacks_status ON callback_requests(status);
  `);

  seedInitialSettings();
}

// Password hashing utility using PBKDF2 with SHA-256
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha256').toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, combinedHash: string): boolean {
  try {
    const [salt, originalHash] = combinedHash.split(':');
    if (!salt || !originalHash) return false;
    const computedHash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha256').toString('hex');
    return crypto.timingSafeEqual(Buffer.from(computedHash), Buffer.from(originalHash));
  } catch {
    return false;
  }
}

// Audit logger
export function logAudit(
  actorId: string | null,
  actorRole: string | null,
  action: string,
  targetType: string,
  targetId: string | null = null,
  details: Record<string, unknown> = {},
  ipAddress: string | null = null
) {
  try {
    const id = crypto.randomUUID();
    const timestamp = new Date().toISOString();
    const stmt = db.prepare(`
      INSERT INTO audit_logs (id, actor_id, actor_role, action, target_type, target_id, details, ip_address, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      id,
      actorId,
      actorRole,
      action,
      targetType,
      targetId,
      JSON.stringify(details),
      ipAddress,
      timestamp
    );
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
}

// Seed default system settings and standard administrative / clinical accounts
function seedInitialSettings() {
  const checkStmt = db.prepare('SELECT COUNT(*) as count FROM system_settings');
  const result = checkStmt.get() as { count: number };
  if (result.count === 0) {
    const now = new Date().toISOString();
    const defaults = [
      {
        key: 'EMERGENCY_HELPLINE',
        value: '112',
        description: 'National Emergency Helpline for India',
      },
      {
        key: 'AMBULANCE_HELPLINE',
        value: '108',
        description: 'Emergency Medical & Ambulance Transport Service',
      },
      {
        key: 'WOMEN_CHILD_HELPLINE',
        value: '1091',
        description: 'Women & Child Emergency Support Helpline',
      },
      {
        key: 'HOSPITAL_DISTRICT',
        value: 'Raichur & Yadgir Rural Health Mission',
        description: 'Primary Regional Cluster',
      },
      {
        key: 'DEPARTMENTS_LIST',
        value: JSON.stringify([
          { id: 'general_medicine', name: 'General Medicine / ಸಾಮಾನ್ಯ ಔಷಧಾಲಯ / सामान्य चिकित्सा', icon: 'Stethoscope' },
          { id: 'pediatrics', name: 'Pediatrics & Child Care / ಮಕ್ಕಳ ಆರೈಕೆ / बाल रोग विशेषज्ञ', icon: 'Baby' },
          { id: 'gynecology', name: 'Obstetrics & Maternal Care / ಮಹಿಳಾ ಮತ್ತು ಮಾತೃ ಆರೈಕೆ / मातृ स्वास्थ्य', icon: 'HeartPulse' },
          { id: 'orthopedics', name: 'Orthopedics & Joint Health / ಮೂಳೆ ಮತ್ತು ಕೀಲು ತಜ್ಞರು / हड्डी रोग', icon: 'Activity' },
          { id: 'ophthalmology', name: 'Eye & Vision Care / ನೇತ್ರ ಚಿಕಿತ್ಸೆ / नेत्र रोग विशेषज्ञ', icon: 'Eye' },
          { id: 'dermatology', name: 'Dermatology / ಚರ್ಮ ರೋಗ ತಜ್ಞರು / त्वचा रोग', icon: 'Sparkles' }
        ]),
        description: 'Active Clinical Specialties Offered to Rural Centers'
      }
    ];

    const insertStmt = db.prepare('INSERT INTO system_settings (key, value, description, updated_at) VALUES (?, ?, ?, ?)');
    for (const item of defaults) {
      insertStmt.run(item.key, item.value, item.description, now);
    }
  }

  const now = new Date().toISOString();

  // 1. System Admin
  const adminCheck = db.prepare("SELECT COUNT(*) as count FROM profiles WHERE role = 'admin'").get() as { count: number };
  if (adminCheck.count === 0) {
    const adminId = crypto.randomUUID();
    const passHash = hashPassword('Admin@RuralCare2026');
    db.prepare(`
      INSERT INTO profiles (id, email, phone, password_hash, full_name, role, preferred_language, village_or_town, district, state, is_verified, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 'admin', 'en', 'Raichur HQ', 'Raichur', 'Karnataka', 1, ?, ?)
    `).run(adminId, 'admin@ruralcare.in', '+919876500000', passHash, 'Chief Administrative Officer', now, now);

    logAudit(adminId, 'admin', 'INITIALIZE_SYSTEM_ADMIN', 'profiles', adminId, { note: 'Initial admin created' });
  }

  // 2. Doctor Admin (Dual Clinical & Administrative Authority)
  const docAdminCheck = db.prepare("SELECT COUNT(*) as count FROM profiles WHERE role = 'doctor_admin'").get() as { count: number };
  if (docAdminCheck.count === 0) {
    const docAdminId = crypto.randomUUID();
    const docPassHash = hashPassword('Doctor@RuralCare2026');
    db.prepare(`
      INSERT INTO profiles (id, email, phone, password_hash, full_name, role, preferred_language, village_or_town, district, state, is_verified, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 'doctor_admin', 'en', 'Raichur District Hospital', 'Raichur', 'Karnataka', 1, ?, ?)
    `).run(docAdminId, 'doctor.admin@ruralcare.in', '+919876511111', docPassHash, 'Dr. Anand Rao (Doctor Admin)', now, now);

    db.prepare(`
      INSERT INTO doctors (id, license_number, department, qualification, years_of_experience, bio, is_verified_by_admin, availability_schedule, created_at, updated_at)
      VALUES (?, ?, ?, ?, 16, ?, 1, '[]', ?, ?)
    `).run(
      docAdminId,
      'KMC-MED-09821',
      'General Medicine',
      'MBBS, MD (Internal Medicine), Chief Medical Superintendent',
      'Medical Director & Lead Clinician overseeing rural outreach care and patient consultations.',
      now,
      now
    );

    logAudit(docAdminId, 'doctor_admin', 'INITIALIZE_DOCTOR_ADMIN', 'profiles', docAdminId, { note: 'Doctor Admin created' });
  }

  // 3. Clinical Doctor (Dr. Ramesh Patil)
  const docCheck = db.prepare("SELECT COUNT(*) as count FROM profiles WHERE email = 'dr.patil@ruralcare.in'").get() as { count: number };
  if (docCheck.count === 0) {
    const docId = crypto.randomUUID();
    const passHash = hashPassword('Doctor@2026');
    db.prepare(`
      INSERT INTO profiles (id, email, phone, password_hash, full_name, role, preferred_language, village_or_town, district, state, is_verified, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 'doctor', 'kn', 'Devadurga CHC', 'Raichur', 'Karnataka', 1, ?, ?)
    `).run(docId, 'dr.patil@ruralcare.in', '+919876522222', passHash, 'Dr. Ramesh Patil', now, now);

    db.prepare(`
      INSERT INTO doctors (id, license_number, department, qualification, years_of_experience, bio, is_verified_by_admin, availability_schedule, created_at, updated_at)
      VALUES (?, ?, ?, ?, 9, ?, 1, '[]', ?, ?)
    `).run(
      docId,
      'KMC-ORTHO-44120',
      'Orthopedics & Joint Health',
      'MBBS, MS (Orthopedics)',
      'Specialist in joint injuries, arthritis, and trauma stabilization in rural taluks.',
      now,
      now
    );
  }

  // 4. Village Health Worker (ASHA Shanta Devi)
  const hwCheck = db.prepare("SELECT COUNT(*) as count FROM profiles WHERE email = 'asha.gabbur@ruralcare.in'").get() as { count: number };
  if (hwCheck.count === 0) {
    const hwId = crypto.randomUUID();
    const passHash = hashPassword('Asha@RuralCare2026');
    db.prepare(`
      INSERT INTO profiles (id, email, phone, password_hash, full_name, role, preferred_language, village_or_town, district, state, is_verified, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 'health_worker', 'kn', 'Gabbur', 'Raichur', 'Karnataka', 1, ?, ?)
    `).run(hwId, 'asha.gabbur@ruralcare.in', '+919876533333', passHash, 'Smt. Shanta Devi (ASHA Worker)', now, now);

    db.prepare(`
      INSERT INTO health_workers (id, worker_code, assigned_village, assigned_primary_health_center, supervisor_name, is_verified_by_admin, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 1, ?, ?)
    `).run(
      hwId,
      'ASHA-GAB-014',
      'Gabbur',
      'Gabbur Primary Health Center',
      'Dr. Anand Rao',
      now,
      now
    );
  }
}
