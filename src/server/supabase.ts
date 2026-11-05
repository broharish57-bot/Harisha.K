import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';
import { db, logAudit } from './db.ts';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  serviceKey?: string;
  isConfigured: boolean;
}

export function getSupabaseConfig(): SupabaseConfig {
  // Check system_settings table first, then environment variables
  const urlSetting = db.prepare("SELECT value FROM system_settings WHERE key = 'SUPABASE_URL'").get() as { value: string } | undefined;
  const anonSetting = db.prepare("SELECT value FROM system_settings WHERE key = 'SUPABASE_ANON_KEY'").get() as { value: string } | undefined;
  const serviceSetting = db.prepare("SELECT value FROM system_settings WHERE key = 'SUPABASE_SERVICE_ROLE_KEY'").get() as { value: string } | undefined;

  const url = urlSetting?.value || process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const anonKey = anonSetting?.value || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
  const serviceKey = serviceSetting?.value || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  return {
    url,
    anonKey,
    serviceKey,
    isConfigured: Boolean(url && (anonKey || serviceKey)),
  };
}

export function saveSupabaseConfig(url: string, anonKey: string, serviceKey?: string) {
  const now = new Date().toISOString();
  const upsert = db.prepare(`
    INSERT INTO system_settings (key, value, description, updated_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
  `);

  upsert.run('SUPABASE_URL', url.trim(), 'Supabase Project URL', now);
  upsert.run('SUPABASE_ANON_KEY', anonKey.trim(), 'Supabase Public Anon Key', now);
  if (serviceKey !== undefined) {
    upsert.run('SUPABASE_SERVICE_ROLE_KEY', serviceKey.trim(), 'Supabase Service Role Secret Key', now);
  }
}

export async function testSupabaseConnection(customUrl?: string, customKey?: string): Promise<{
  success: boolean;
  message: string;
  tablesVerified?: string[];
  latencyMs?: number;
}> {
  const config = getSupabaseConfig();
  const url = customUrl || config.url;
  const key = customKey || config.serviceKey || config.anonKey;

  if (!url || !key) {
    return {
      success: false,
      message: 'Supabase URL and API Key are missing. Please provide your Supabase project credentials.',
    };
  }

  const start = Date.now();
  try {
    const supabase = createClient(url, key, {
      auth: { persistSession: false },
    });

    // Test a basic query on profiles or appointments table
    const { data, error } = await supabase.from('profiles').select('id').limit(1);

    const latencyMs = Date.now() - start;

    if (error) {
      // If table does not exist, schema migration needs to be run
      if (error.code === '42P01' || error.message.includes('relation "public.profiles" does not exist')) {
        return {
          success: true,
          latencyMs,
          message: 'Connected to Supabase project successfully! Note: Schema tables are not created yet. Please execute the SQL migration script.',
          tablesVerified: [],
        };
      }
      return {
        success: false,
        latencyMs,
        message: `Supabase responded with error: ${error.message} (Code: ${error.code})`,
      };
    }

    // Verify other tables
    const tableNames = ['profiles', 'doctors', 'appointments', 'consultations', 'prescriptions'];
    const verified: string[] = [];

    for (const t of tableNames) {
      const { error: tErr } = await supabase.from(t).select('id').limit(1);
      if (!tErr) verified.push(t);
    }

    return {
      success: true,
      latencyMs,
      tablesVerified: verified,
      message: `Successfully connected to Supabase (${latencyMs}ms). Verified active tables: ${verified.join(', ')}.`,
    };
  } catch (err: any) {
    return {
      success: false,
      latencyMs: Date.now() - start,
      message: `Connection failed: ${err.message || 'Unknown network error'}`,
    };
  }
}

export function getSqlMigrationContent(): string {
  try {
    const migrationPath = path.resolve(process.cwd(), 'supabase/migrations/20261105000001_ruralcare_core_schema.sql');
    if (fs.existsSync(migrationPath)) {
      return fs.readFileSync(migrationPath, 'utf-8');
    }
  } catch (err) {
    console.error('Error reading migration file:', err);
  }
  return '-- Migration file not found';
}

// 1-Click Sync of local SQLite data up to Supabase Cloud
export async function syncLocalDataToSupabase(): Promise<{
  success: boolean;
  syncedCounts: Record<string, number>;
  message: string;
}> {
  const config = getSupabaseConfig();
  const key = config.serviceKey || config.anonKey;

  if (!config.url || !key) {
    throw new Error('Supabase is not configured. Please save your Project URL and Key first.');
  }

  const supabase = createClient(config.url, key, {
    auth: { persistSession: false },
  });

  const syncedCounts: Record<string, number> = {
    profiles: 0,
    doctors: 0,
    health_workers: 0,
    appointments: 0,
    consultations: 0,
    prescriptions: 0,
    reminders: 0,
  };

  try {
    // 1. Sync Profiles
    const localProfiles = db.prepare('SELECT id, email, phone, full_name, role, preferred_language, village_or_town, district, state, emergency_contact_phone, is_verified, created_at, updated_at FROM profiles').all();
    if (localProfiles.length > 0) {
      const { error } = await supabase.from('profiles').upsert(
        localProfiles.map((p: any) => ({
          ...p,
          is_verified: Boolean(p.is_verified),
          sms_opt_out: false,
        })),
        { onConflict: 'id' }
      );
      if (error) throw new Error(`Profiles sync error: ${error.message}`);
      syncedCounts.profiles = localProfiles.length;
    }

    // 2. Sync Doctors
    const localDoctors = db.prepare('SELECT id, license_number, department, qualification, years_of_experience, bio, is_verified_by_admin, created_at, updated_at FROM doctors').all();
    if (localDoctors.length > 0) {
      const { error } = await supabase.from('doctors').upsert(
        localDoctors.map((d: any) => ({
          ...d,
          is_verified_by_admin: Boolean(d.is_verified_by_admin),
        })),
        { onConflict: 'id' }
      );
      if (!error) syncedCounts.doctors = localDoctors.length;
    }

    // 3. Sync Appointments
    const localApts = db.prepare('SELECT id, reference_code, patient_id, doctor_id, department, appointment_date, time_slot, reason_summary, status, channel, created_at, updated_at FROM appointments').all();
    if (localApts.length > 0) {
      const { error } = await supabase.from('appointments').upsert(localApts, { onConflict: 'id' });
      if (!error) syncedCounts.appointments = localApts.length;
    }

    // 4. Sync Consultations
    const localConsults = db.prepare('SELECT id, appointment_id, doctor_id, patient_id, symptoms_observed, clinical_notes, follow_up_date, follow_up_instructions, created_at, updated_at FROM consultations').all();
    if (localConsults.length > 0) {
      const { error } = await supabase.from('consultations').upsert(localConsults, { onConflict: 'id' });
      if (!error) syncedCounts.consultations = localConsults.length;
    }

    // 5. Sync Prescriptions
    const localRx = db.prepare('SELECT id, consultation_id, patient_id, doctor_id, medications, general_advice, created_at FROM prescriptions').all();
    if (localRx.length > 0) {
      const { error } = await supabase.from('prescriptions').upsert(
        localRx.map((r: any) => ({
          ...r,
          medications: JSON.parse(r.medications || '[]'),
        })),
        { onConflict: 'id' }
      );
      if (!error) syncedCounts.prescriptions = localRx.length;
    }

    logAudit(null, 'system', 'SYNC_DATA_TO_SUPABASE', 'system_settings', null, { syncedCounts });

    return {
      success: true,
      syncedCounts,
      message: `Successfully synchronized ${Object.values(syncedCounts).reduce((a, b) => a + b, 0)} records to Supabase Cloud!`,
    };
  } catch (err: any) {
    throw new Error(`Data sync failed: ${err.message}`);
  }
}
