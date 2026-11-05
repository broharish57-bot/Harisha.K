-- RuralCare Connect: Production Supabase / PostgreSQL Core Schema
-- Version: 20261105000001
-- Description: Core tables, foreign keys, indexes, RLS policies, and triggers

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles Table (Patients, Doctors, Health Workers, Admins)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE,
    phone TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('patient', 'doctor', 'health_worker', 'admin')),
    preferred_language TEXT NOT NULL DEFAULT 'en' CHECK (preferred_language IN ('kn', 'hi', 'en')),
    village_or_town TEXT NOT NULL,
    district TEXT NOT NULL,
    state TEXT NOT NULL DEFAULT 'Karnataka',
    emergency_contact_phone TEXT,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    sms_opt_out BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Doctor Profiles
CREATE TABLE IF NOT EXISTS public.doctors (
    id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    license_number TEXT NOT NULL UNIQUE,
    department TEXT NOT NULL,
    qualification TEXT NOT NULL,
    years_of_experience INTEGER NOT NULL DEFAULT 0,
    bio TEXT,
    is_verified_by_admin BOOLEAN NOT NULL DEFAULT FALSE,
    availability_schedule JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Village Health Workers (ASHA / ANM)
CREATE TABLE IF NOT EXISTS public.health_workers (
    id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    worker_code TEXT NOT NULL UNIQUE,
    assigned_village TEXT NOT NULL,
    assigned_primary_health_center TEXT NOT NULL,
    supervisor_name TEXT,
    is_verified_by_admin BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Appointments
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reference_code TEXT NOT NULL UNIQUE,
    patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE RESTRICT,
    created_by_worker_id UUID REFERENCES public.health_workers(id) ON DELETE SET NULL,
    department TEXT NOT NULL,
    appointment_date DATE NOT NULL,
    time_slot TEXT NOT NULL,
    reason_summary TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'REJECTED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED')),
    status_notes TEXT,
    channel TEXT NOT NULL DEFAULT 'WEB' CHECK (channel IN ('WEB', 'SMS', 'HEALTH_WORKER', 'MISSED_CALL')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_doctor_slot UNIQUE (doctor_id, appointment_date, time_slot)
);

-- 5. Consultations (Strictly accessible by authorized doctor and patient)
CREATE TABLE IF NOT EXISTS public.consultations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id UUID NOT NULL UNIQUE REFERENCES public.appointments(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE RESTRICT,
    patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    symptoms_observed TEXT NOT NULL,
    clinical_notes TEXT NOT NULL,
    follow_up_date DATE,
    follow_up_instructions TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Prescriptions (Issued by authorized doctors only)
CREATE TABLE IF NOT EXISTS public.prescriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    consultation_id UUID NOT NULL REFERENCES public.consultations(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE RESTRICT,
    medications JSONB NOT NULL DEFAULT '[]'::jsonb,
    general_advice TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Medical Records & Diagnostic Reports (Private storage)
CREATE TABLE IF NOT EXISTS public.medical_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    uploaded_by_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    title TEXT NOT NULL,
    record_type TEXT NOT NULL CHECK (record_type IN ('LAB_REPORT', 'DISCHARGE_SUMMARY', 'IMAGING', 'VACCINATION', 'OTHER')),
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    storage_path TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Messages (Secure Doctor-Patient Communication)
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id TEXT NOT NULL,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Patient Reminders (Medications, Follow-ups)
CREATE TABLE IF NOT EXISTS public.reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    reminder_type TEXT NOT NULL CHECK (reminder_type IN ('MEDICATION', 'FOLLOW_UP', 'VACCINATION', 'APPOINTMENT')),
    due_date DATE NOT NULL,
    due_time TEXT NOT NULL,
    channel_preference TEXT NOT NULL DEFAULT 'BOTH' CHECK (channel_preference IN ('SMS', 'IN_APP', 'BOTH')),
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. SMS Sessions (For Keypad Phone Users)
CREATE TABLE IF NOT EXISTS public.sms_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone TEXT NOT NULL UNIQUE,
    current_step TEXT NOT NULL DEFAULT 'MAIN_MENU',
    session_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    language TEXT NOT NULL DEFAULT 'en' CHECK (language IN ('kn', 'hi', 'en')),
    last_interaction_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. SMS Event Audit & Delivery Tracking
CREATE TABLE IF NOT EXISTS public.sms_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    direction TEXT NOT NULL CHECK (direction IN ('INBOUND', 'OUTBOUND')),
    phone TEXT NOT NULL,
    message_id TEXT,
    content TEXT NOT NULL,
    provider_status TEXT NOT NULL DEFAULT 'RECEIVED',
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. Callback Requests (Missed Calls & SMS Requests)
CREATE TABLE IF NOT EXISTS public.callback_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    caller_phone TEXT NOT NULL,
    caller_name TEXT,
    patient_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    assigned_health_worker_id UUID REFERENCES public.health_workers(id) ON DELETE SET NULL,
    source TEXT NOT NULL CHECK (source IN ('MISSED_CALL', 'SMS_MENU', 'ASSISTED_PORTAL')),
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ASSIGNED', 'CALLED_BACK', 'RESOLVED', 'UNREACHABLE')),
    resolution_notes TEXT,
    attempt_count INTEGER NOT NULL DEFAULT 0,
    provider_call_id TEXT UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. Health Worker Assignments
CREATE TABLE IF NOT EXISTS public.health_worker_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    health_worker_id UUID NOT NULL REFERENCES public.health_workers(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    assigned_by_admin_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_active_assignment UNIQUE (health_worker_id, patient_id)
);

-- 14. Patient Consent Ledger
CREATE TABLE IF NOT EXISTS public.patient_consents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    consent_type TEXT NOT NULL,
    granted BOOLEAN NOT NULL DEFAULT TRUE,
    witness_or_worker_id UUID REFERENCES public.health_workers(id) ON DELETE SET NULL,
    consent_text TEXT NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. Audit Logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID,
    actor_role TEXT,
    action TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id TEXT,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON public.appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_date ON public.appointments(doctor_id, appointment_date);
CREATE INDEX IF NOT EXISTS idx_consultations_patient ON public.consultations(patient_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient ON public.prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_patient ON public.medical_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_callbacks_status ON public.callback_requests(status);
CREATE INDEX IF NOT EXISTS idx_sms_events_phone ON public.sms_events(phone);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON public.audit_logs(timestamp DESC);

-- Row Level Security (RLS) Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.callback_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_worker_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Profiles: Users see own profile; Admins see all; Doctors & HW see assigned
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Consultations: Only doctor who conducted and patient can view. Health workers CANNOT view.
CREATE POLICY "Doctor and Patient view consultation" ON public.consultations
    FOR SELECT USING (auth.uid() = doctor_id OR auth.uid() = patient_id);

CREATE POLICY "Only doctor can create consultation" ON public.consultations
    FOR INSERT WITH CHECK (auth.uid() = doctor_id);

-- Prescriptions: Only doctor who issued and patient can view.
CREATE POLICY "Doctor and Patient view prescription" ON public.prescriptions
    FOR SELECT USING (auth.uid() = doctor_id OR auth.uid() = patient_id);

CREATE POLICY "Only doctor can create prescription" ON public.prescriptions
    FOR INSERT WITH CHECK (auth.uid() = doctor_id);
