# RuralCare Connect (ಗ್ರಾಮೀಣ ಕೇರ್ ಕನೆಕ್ಟ್ / रूरलकेयर कनेक्ट)

**Unified Rural Healthcare Access Platform for Indian Communities**  
Connecting Smartphone Patients, Keypad-Phone Feature Users, Village Health Workers (ASHA/ANM), Doctors, and Administrators through **one shared backend and patient database**.

---

## 1. Architectural Overview & Channels

RuralCare Connect is built on a shared backend and relational database serving four distinct user channels:

1. **Smartphone Web App / PWA (`/`)**:
   - Progressive Web App with offline request queueing in IndexedDB.
   - Interactive appointment scheduling, longitudinal prescription viewing, and diagnostic lab report uploads (PDF/JPG/PNG).
   - In-app install prompt (`PWAInstallButton`) with Safari iOS and Android standalone support.

2. **Keypad-Phone SMS Gateway (`/api/sms/inbound`)**:
   - Zero-internet SMS menu state machine for feature phones.
   - Multilingual support: Kannada (ಕನ್ನಡ), Hindi (हिन्दी), English.
   - Interactive commands:
     - `HELP` or `0`: Main menu
     - `1`: Request appointment and choose specialty department
     - `2`: Query minimal authorized appointment status (no confidential clinical notes sent over SMS)
     - `3`: Request an ASHA worker callback
     - `4`: Urgent-care guidance, including India emergency hotline 112
     - `STOP`: Opt out of SMS alerts; `START`: Re-subscribe

3. **Missed-Call Telephony Gateway (`/api/telephony/missed-call`)**:
   - Toll-free missed-call webhook handler.
   - Cryptographic HMAC signature validation.
   - Provider CallSid deduplication preventing duplicate task entries.
   - Automatically queues a callback task assigned to the local Village Health Worker.

4. **Village Health Worker Assisted Portal (`/health-worker/*`)**:
   - Enables doorstep assisted registration for illiterate and elderly villagers.
   - Explicit verbal/written consent recording in an immutable consent ledger.
   - Manages missed-call callback tasks and resolution notes.
   - Role-enforced privacy: Health workers cannot view raw clinical doctor diagnosis notes or issue prescriptions.

---

## 2. Roles & Access Control

| Role | Permissions & Boundaries |
|---|---|
| **Patient** | View/update own profile, book/cancel appointments, view issued prescriptions, upload medical records, set reminders, secure doctor messaging. |
| **Doctor** | Manage clinical availability, view assigned patient records under active care, document confidential consultation notes, issue structured digital prescriptions (Rx). |
| **Village Health Worker** | Assisted registration with consent ledger entry, view village patient demographics, resolve assigned callback requests. **Restricted from raw clinical notes and prescriptions.** |
| **Administrator** | Superuser oversight, verify doctor licenses, provision staff, manage departments, monitor SMS & telephony gateway logs, inspect immutable audit trail. |

---

## 3. Quick Start & Setup Guide (Windows PowerShell)

Ensure Node.js (v20 or v22) is installed.

### Step 1: Clone & Install Dependencies
Open Windows PowerShell in the project directory:

```powershell
npm.cmd install
```

### Step 2: Configure Environment Variables
Copy `.env.example` to `.env`:

```powershell
Copy-Item .env.example .env
```

Review `.env`:
```env
PORT=3000
SESSION_SECRET="ruralcare-production-secret-token-2026-secure"

# India SMS Gateway (Kaleyra, Exotel, Gupshup, Twilio India)
SMS_PROVIDER="KALEYRA"
SMS_API_KEY=""
SMS_SENDER_ID="RURLCR"
SMS_WEBHOOK_SECRET=""

# India Telephony Gateway (Exotel, Kaleyra, Ozonetel)
TELEPHONY_PROVIDER="EXOTEL"
TELEPHONY_WEBHOOK_SECRET=""
```

*Note: In the absence of live gateway credentials, the system runs safely in "Configured — Awaiting Provider Credentials" mode, and inbound webhooks can be tested directly from the home page console.*

### Step 3: Run Full-Stack Development Server
```powershell
npm.cmd run dev
```

Visit **http://localhost:3000** in your browser.

---

## 4. Default System Administrator Credentials

For immediate evaluation, the database initializes with the system administrator account:

- **Phone / Identifier:** `+919876500000` or `admin@ruralcare.in`
- **Password:** `Admin@RuralCare2026`
- **Role:** Administrator (`/admin/dashboard`)

*(Additional doctors and health workers can be created and verified directly from the Admin Users panel).*

---

## 5. Supabase / PostgreSQL Schema Migration

A production-ready SQL migration script is located at:
`supabase/migrations/20261105000001_ruralcare_core_schema.sql`

To apply this schema to a Supabase project:
1. Log in to your Supabase Dashboard.
2. Navigate to **SQL Editor** -> **New Query**.
3. Paste the contents of `supabase/migrations/20261105000001_ruralcare_core_schema.sql` and click **Run**.
4. The migration establishes all 15 relational tables, foreign key constraints, unique slot indexes, and Row Level Security (RLS) policies.

---

## 6. Testing & Verification

1. **Patient Registration & Booking:**
   - Register at `/register` with an Indian mobile number.
   - Book a consultation at `/patient/appointments/new`.
   - Double-booking prevention: Attempting to book the same doctor, date, and time slot will be rejected with an informative error.
2. **Doctor Care & Prescription Flow:**
   - Log in as doctor or admin.
   - Confirm visit and click **Start Consultation**.
   - Enter observed symptoms, examination notes, and structured medication rows (dosage, frequency, duration, directions).
   - Once saved, appointment transitions to `COMPLETED` and the patient immediately sees the digital prescription at `/patient/prescriptions`.
3. **Assisted Registration:**
   - Log in as health worker and navigate to `/health-worker/patients/new`.
   - Submit assisted registration with consent confirmed.
   - Verify that the consent ledger records the assisting worker ID.
4. **Keypad SMS & Missed Call Webhook Testing:**
   - Test inbound SMS: Send `POST /api/sms/inbound` with `{"From": "+919876543210", "Body": "HELP"}`.
   - Test missed call: Send `POST /api/telephony/missed-call` with `{"CallSid": "CALL-101", "From": "+919876543210"}`.
   - Re-sending the same `CallSid` returns `isDuplicate: true`.
5. **Offline PWA Queueing:**
   - Disconnect network in DevTools (Offline mode).
   - Submit an appointment booking request.
   - Request is saved in IndexedDB and marked `Pending`.
   - Reconnect network; click **Sync Now** or let auto-reconnect trigger `/api/sync/offline-batch`.
