import crypto from 'node:crypto';
import { db, logAudit } from './db.ts';

export interface SmsResponse {
  replyText: string;
  sessionUpdated: boolean;
}

// Multilingual text dictionary for keypad phones
export const SMS_MESSAGES = {
  en: {
    menu: `RuralCare Connect:
1: Book Appointment
2: Appointment Status
3: Request Health Worker Callback
4: Urgent Care & 112 Help
0: Main Menu
Reply with number. Reply STOP to opt out.`,
    dept_prompt: `Select Department:
1: General Medicine
2: Pediatrics (Child Care)
3: Maternal & Gynecology
4: Orthopedics (Joints/Bones)
5: Eye Care
0: Back`,
    date_prompt: `Enter preferred date (e.g., TOMORROW or DD-MM-YYYY) and brief reason:`,
    booked: (ref: string, dept: string) =>
      `Your appointment request has been recorded. Reference: ${ref}. Department: ${dept}. You will receive confirmation after doctor review. For emergencies dial 112.`,
    status_none: `No active appointments found for this phone number. Reply 1 to request one.`,
    status_result: (ref: string, date: string, status: string) =>
      `Appointment ${ref} on ${date}: Status is ${status}. Note: SMS does not contain clinical diagnoses.`,
    callback_created: (id: string) =>
      `Your callback request (${id.slice(0, 8)}) is received. An assigned Village Health Worker will contact you. For emergency medical needs, call 108 or 112 immediately.`,
    urgent_guidance: `EMERGENCY ALERT: SMS is NOT an emergency response service.
For life-threatening emergencies, ambulance, or urgent police/medical help, dial 112 or 108 immediately across India.
Local Primary Health Centers are available 24/7.`,
    opt_out_success: `You have unsubscribed from RuralCare SMS alerts. Reply START to re-subscribe.`,
    opt_in_success: `You are now subscribed to RuralCare Connect SMS service. Reply HELP for menu.`,
    invalid_input: `Invalid option. Reply HELP for menu or 4 for emergency assistance.`,
  },
  kn: {
    menu: `ಗ್ರಾಮೀಣ ಕೇರ್ ಕನೆಕ್ಟ್ (RuralCare):
1: ವೈದ್ಯರ ಭೇಟಿ ನೋಂದಣಿ
2: ಭೇಟಿಯ ಸ್ಥಿತಿ ಪರಿಶೀಲನೆ
3: ಆರೋಗ್ಯ ಕಾರ್ಯಕರ್ತೆಯ ಕರೆಗಾಗಿ ವಿನಂತಿ
4: ತುರ್ತು ನೆರವು (112)
0: ಮುಖ್ಯ ಮೆನು
ಸಂಖ್ಯೆಯನ್ನು ಉತ್ತರಿಸಿ. ಸ್ಥಗಿತಗೊಳಿಸಲು STOP ಎಂದು ಕಳುಹಿಸಿ.`,
    dept_prompt: `ವಿಭಾಗವನ್ನು ಆಯ್ಕೆ ಮಾಡಿ:
1: ಸಾಮಾನ್ಯ ಔಷಧಾಲಯ
2: ಮಕ್ಕಳ ಆರೈಕೆ
3: ಮಹಿಳಾ ಮತ್ತು ಮಾತೃ ಆರೈಕೆ
4: ಮೂಳೆ ರೋಗ ತಜ್ಞರು
5: ನೇತ್ರ ಚಿಕಿತ್ಸೆ
0: ಹಿಂದಕ್ಕೆ ಹೋಗಿ`,
    date_prompt: `ದಿನಾಂಕ (ಉದಾ: ನಾಳೆ ಅಥವಾ ದಿನಾಂಕ-ತಿಂಗಳು) ಮತ್ತು ಕಾರಣವನ್ನು ಉತ್ತರಿಸಿ:`,
    booked: (ref: string, dept: string) =>
      `ನಿಮ್ಮ ಭೇಟಿ ಕೋರಿಕೆ ದಾಖಲಾಗಿದೆ. ಸಂಖ್ಯೆ: ${ref}. ವಿಭಾಗ: ${dept}. ವೈದ್ಯರ ಪರಿಶೀಲನೆ ನಂತರ ತಿಳಿಸಲಾಗುವುದು. ತುರ್ತು ಸಂದರ್ಭದಲ್ಲಿ 112 ಗೆ ಕರೆ ಮಾಡಿ.`,
    status_none: `ಯಾವುದೇ ಸಕ್ರಿಯ ಭೇಟಿಗಳು ಕಂಡುಬಂದಿಲ್ಲ. ನೋಂದಾಯಿಸಲು 1 ಎಂದು ಉತ್ತರಿಸಿ.`,
    status_result: (ref: string, date: string, status: string) =>
      `ಭೇಟಿ ${ref} (${date}): ಸ್ಥಿತಿ - ${status}. ಗಮನಿಸಿ: SMS ಮೂಲಕ ವೈದ್ಯಕೀಯ ಚೀಟಿ ಕಳುಹಿಸಲಾಗುವುದಿಲ್ಲ.`,
    callback_created: (id: string) =>
      `ನಿಮ್ಮ ಕರೆಯ ಕೋರಿಕೆಯನ್ನು ದಾಖಲಿಸಲಾಗಿದೆ (${id.slice(0, 8)}). ಆರೋಗ್ಯ ಕಾರ್ಯಕರ್ತೆ ಶೀಘ್ರದಲ್ಲೇ ಸಂಪರ್ಕಿಸುವರು. ತುರ್ತಾಗಿ 108 ಅಥವಾ 112 ಗೆ ಕರೆ ಮಾಡಿ.`,
    urgent_guidance: `ತುರ್ತು ಎಚ್ಚರಿಕೆ: SMS ತುರ್ತು ಸೇವೆಗೆ ಪರ್ಯಾಯವಲ್ಲ.
ಆಪತ್ಕಾಲೀನ ಸಂದರ್ಭದಲ್ಲಿ ಮತ್ತು ಆಂಬ್ಯುಲೆನ್ಸ್‌ಗಾಗಿ ಭಾರತದಾದ್ಯಂತ ತಕ್ಷಣ 112 ಅಥವಾ 108 ಕ್ಕೆ ಕರೆ ಮಾಡಿ.`,
    opt_out_success: `RuralCare SMS ಸೇವೆಯನ್ನು ಸ್ಥಗಿತಗೊಳಿಸಲಾಗಿದೆ. ಪುನಃ ಆರಂಭಿಸಲು START ಎಂದು ಕಳುಹಿಸಿ.`,
    opt_in_success: `RuralCare Connect SMS ಸೇವೆಗೆ ಮರು-ನೋಂದಾಯಿಸಲಾಗಿದೆ. ಮೆನುಗಾಗಿ HELP ಎಂದು ಕಳುಹಿಸಿ.`,
    invalid_input: `ತಪ್ಪು ಆಯ್ಕೆ. ಮೆನುಗಾಗಿ HELP ಅಥವಾ ತುರ್ತು ನೆರವಿಗಾಗಿ 4 ಎಂದು ಉತ್ತರಿಸಿ.`,
  },
  hi: {
    menu: `रूरलकेयर कनेक्ट (RuralCare):
1: डॉक्टर अपॉइंटमेंट बुक करें
2: अपॉइंटमेंट की स्थिति देखें
3: स्वास्थ्य कार्यकर्ता से कॉलबैक का अनुरोध
4: आपातकालीन सहायता (112)
0: मुख्य मेनू
नंबर रिप्लाई करें। बंद करने के लिए STOP भेजें।`,
    dept_prompt: `विभाग चुनें:
1: सामान्य चिकित्सा
2: बाल रोग
3: मातृ एवं स्त्री रोग
4: हड्डी रोग
5: नेत्र रोग
0: वापस जाएं`,
    date_prompt: `पसंदीदा तारीख (उदा: कल या DD-MM-YYYY) और संक्षेप में कारण लिखें:`,
    booked: (ref: string, dept: string) =>
      `आपका अनुरोध दर्ज कर लिया गया है। संदर्भ: ${ref}। विभाग: ${dept}। डॉक्टर की पुष्टि के बाद सूचित किया जाएगा। आपातकाल में 112 डायल करें।`,
    status_none: `इस नंबर पर कोई सक्रिय अपॉइंटमेंट नहीं मिला। अनुरोध के लिए 1 भेजें।`,
    status_result: (ref: string, date: string, status: string) =>
      `अपॉइंटमेंट ${ref} (${date}): स्थिति - ${status}। ध्यान दें: SMS में गोपनीय मेडिकल नुस्खे नहीं भेजे जाते।`,
    callback_created: (id: string) =>
      `कॉलबैक अनुरोध प्राप्त हुआ (${id.slice(0, 8)})। ग्राम स्वास्थ्य कार्यकर्ता आपसे संपर्क करेंगे। आपातकाल में 108 या 112 डायल करें।`,
    urgent_guidance: `आपातकालीन सूचना: SMS आपातकालीन सेवा नहीं है।
जीवन-रक्षक आपात स्थिति या एम्बुलेंस के लिए तुरंत 112 या 108 पर कॉल करें।`,
    opt_out_success: `आपकी SMS सेवा बंद कर दी गई है। पुनः शुरू करने के लिए START भेजें।`,
    opt_in_success: `RuralCare सेवा में पुनः स्वागत है। मेनू के लिए HELP भेजें।`,
    invalid_input: `अमान्य विकल्प। मेनू के लिए HELP या आपातकालीन सहायता के लिए 4 भेजें।`,
  },
};

// Check if SMS provider is configured with live credentials
export function isSmsProviderLive(): { live: boolean; provider: string; reason: string } {
  const provider = process.env.SMS_PROVIDER || 'KALEYRA_EXOTEL_TWILIO';
  const apiKey = process.env.SMS_API_KEY;
  const senderId = process.env.SMS_SENDER_ID;
  if (!apiKey || !senderId) {
    return {
      live: false,
      provider,
      reason: 'Missing SMS_API_KEY or SMS_SENDER_ID in server environment. Inbound webhooks & menu logic active; outbound delivery queued.'
    };
  }
  return {
    live: true,
    provider,
    reason: `Configured with Sender ID: ${senderId}`
  };
}

// Inbound SMS processor with session state machine
export function processInboundSms(phone: string, incomingBody: string, messageId?: string): SmsResponse {
  const trimmed = incomingBody.trim();
  const upper = trimmed.toUpperCase();

  // Deduplication check
  if (messageId) {
    const existing = db.prepare('SELECT id FROM sms_events WHERE message_id = ?').get(messageId);
    if (existing) {
      return { replyText: '', sessionUpdated: false };
    }
  }

  // Record inbound event
  const eventId = crypto.randomUUID();
  db.prepare(`
    INSERT INTO sms_events (id, direction, phone, message_id, content, provider_status, created_at)
    VALUES (?, 'INBOUND', ?, ?, ?, 'RECEIVED', ?)
  `).run(eventId, phone, messageId || null, trimmed, new Date().toISOString());

  // Opt-out handling
  if (['STOP', 'UNSUBSCRIBE', 'QUIT', 'ನಿಷ್ಕ್ರಿಯಗೊಳಿಸಿ', 'बंद'].includes(upper)) {
    db.prepare('UPDATE profiles SET sms_opt_out = 1 WHERE phone = ?').run(phone);
    return { replyText: SMS_MESSAGES.en.opt_out_success, sessionUpdated: true };
  }

  // Opt-in handling
  if (['START', 'SUBSCRIBE', 'ಸಕ್ರಿಯ', 'शुरू'].includes(upper)) {
    db.prepare('UPDATE profiles SET sms_opt_out = 0 WHERE phone = ?').run(phone);
    return { replyText: SMS_MESSAGES.en.opt_in_success, sessionUpdated: true };
  }

  // Fetch or create user session
  let session = db.prepare('SELECT * FROM sms_sessions WHERE phone = ?').get(phone) as {
    id: string;
    phone: string;
    current_step: string;
    session_data: string;
    language: 'kn' | 'hi' | 'en';
    last_interaction_at: string;
  } | undefined;

  const now = new Date().toISOString();
  let lang: 'kn' | 'hi' | 'en' = 'en';

  if (!session) {
    // Check if patient profile exists with preferred language
    const profile = db.prepare('SELECT preferred_language FROM profiles WHERE phone = ?').get(phone) as { preferred_language: 'kn' | 'hi' | 'en' } | undefined;
    if (profile && ['kn', 'hi', 'en'].includes(profile.preferred_language)) {
      lang = profile.preferred_language;
    }
    const sessionId = crypto.randomUUID();
    db.prepare(`
      INSERT INTO sms_sessions (id, phone, current_step, session_data, language, last_interaction_at, created_at)
      VALUES (?, ?, 'MAIN_MENU', '{}', ?, ?, ?)
    `).run(sessionId, phone, lang, now, now);

    session = {
      id: sessionId,
      phone,
      current_step: 'MAIN_MENU',
      session_data: '{}',
      language: lang,
      last_interaction_at: now,
    };
  } else {
    lang = session.language;
    // Session timeout check (15 minutes)
    const lastActive = new Date(session.last_interaction_at).getTime();
    if (Date.now() - lastActive > 15 * 60 * 1000) {
      session.current_step = 'MAIN_MENU';
      session.session_data = '{}';
    }
  }

  const texts = SMS_MESSAGES[lang] || SMS_MESSAGES.en;

  // Language switch detection
  if (upper === 'LANG KN' || upper === 'ಕನ್ನಡ') {
    db.prepare("UPDATE sms_sessions SET language = 'kn', last_interaction_at = ? WHERE phone = ?").run(now, phone);
    return { replyText: 'ಕನ್ನಡ ಭಾಷೆಯನ್ನು ಆಯ್ಕೆ ಮಾಡಲಾಗಿದೆ.\n' + SMS_MESSAGES.kn.menu, sessionUpdated: true };
  } else if (upper === 'LANG HI' || upper === 'हिंदी') {
    db.prepare("UPDATE sms_sessions SET language = 'hi', last_interaction_at = ? WHERE phone = ?").run(now, phone);
    return { replyText: 'हिंदी भाषा चुनी गई है।\n' + SMS_MESSAGES.hi.menu, sessionUpdated: true };
  } else if (upper === 'LANG EN' || upper === 'ENGLISH') {
    db.prepare("UPDATE sms_sessions SET language = 'en', last_interaction_at = ? WHERE phone = ?").run(now, phone);
    return { replyText: 'English language selected.\n' + SMS_MESSAGES.en.menu, sessionUpdated: true };
  }

  // Global commands
  if (['HELP', 'MENU', 'ಮಾರ್ಗದರ್ಶಿ', 'मदद'].includes(upper) || trimmed === '0') {
    db.prepare("UPDATE sms_sessions SET current_step = 'MAIN_MENU', session_data = '{}', last_interaction_at = ? WHERE phone = ?").run(now, phone);
    return { replyText: texts.menu, sessionUpdated: true };
  }

  if (trimmed === '4') {
    return { replyText: texts.urgent_guidance, sessionUpdated: false };
  }

  // State Machine
  if (session.current_step === 'MAIN_MENU') {
    if (trimmed === '1') {
      // Step 1: Prompt department
      db.prepare("UPDATE sms_sessions SET current_step = 'CHOOSE_DEPT', last_interaction_at = ? WHERE phone = ?").run(now, phone);
      return { replyText: texts.dept_prompt, sessionUpdated: true };
    } else if (trimmed === '2') {
      // Step 2: Minimal status inquiry
      // Find patient by phone
      const patient = db.prepare('SELECT id FROM profiles WHERE phone = ?').get(phone) as { id: string } | undefined;
      if (!patient) {
        return { replyText: texts.status_none, sessionUpdated: false };
      }
      const appointment = db.prepare(`
        SELECT reference_code, appointment_date, status
        FROM appointments
        WHERE patient_id = ?
        ORDER BY created_at DESC
        LIMIT 1
      `).get(patient.id) as { reference_code: string; appointment_date: string; status: string } | undefined;

      if (!appointment) {
        return { replyText: texts.status_none, sessionUpdated: false };
      }
      return {
        replyText: texts.status_result(appointment.reference_code, appointment.appointment_date, appointment.status),
        sessionUpdated: false,
      };
    } else if (trimmed === '3') {
      // Step 3: Callback request
      const cbId = crypto.randomUUID();
      const patient = db.prepare('SELECT id, full_name FROM profiles WHERE phone = ?').get(phone) as { id: string; full_name: string } | undefined;

      db.prepare(`
        INSERT INTO callback_requests (id, caller_phone, caller_name, patient_id, source, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, 'SMS_MENU', 'PENDING', ?, ?)
      `).run(cbId, phone, patient?.full_name || 'SMS Patient', patient?.id || null, now, now);

      logAudit(patient?.id || null, 'patient', 'CREATE_CALLBACK_REQUEST_VIA_SMS', 'callback_requests', cbId, { phone });
      return { replyText: texts.callback_created(cbId), sessionUpdated: false };
    } else {
      return { replyText: texts.invalid_input, sessionUpdated: false };
    }
  }

  if (session.current_step === 'CHOOSE_DEPT') {
    const deptMap: Record<string, string> = {
      '1': 'General Medicine',
      '2': 'Pediatrics',
      '3': 'Obstetrics & Gynecology',
      '4': 'Orthopedics',
      '5': 'Ophthalmology',
    };
    const chosen = deptMap[trimmed];
    if (!chosen) {
      return { replyText: texts.dept_prompt, sessionUpdated: false };
    }

    const sessionData = { department: chosen };
    db.prepare("UPDATE sms_sessions SET current_step = 'ENTER_REASON', session_data = ?, last_interaction_at = ? WHERE phone = ?")
      .run(JSON.stringify(sessionData), now, phone);

    return { replyText: texts.date_prompt, sessionUpdated: true };
  }

  if (session.current_step === 'ENTER_REASON') {
    let parsedData = { department: 'General Medicine' };
    try {
      parsedData = JSON.parse(session.session_data);
    } catch {
      // fallback
    }

    // Ensure or register patient profile
    let patient = db.prepare('SELECT id FROM profiles WHERE phone = ?').get(phone) as { id: string } | undefined;
    if (!patient) {
      const patientId = crypto.randomUUID();
      db.prepare(`
        INSERT INTO profiles (id, phone, full_name, role, preferred_language, village_or_town, district, state, password_hash, is_verified, created_at, updated_at)
        VALUES (?, ?, ?, 'patient', ?, 'Rural Outreach', 'Raichur', 'Karnataka', ?, 1, ?, ?)
      `).run(patientId, phone, `Patient ${phone.slice(-4)}`, lang, 'NO_PWD_KEYPAD', now, now);
      patient = { id: patientId };
    }

    // Find a doctor in that department or first available doctor
    let doctor = db.prepare('SELECT id FROM doctors WHERE department LIKE ? LIMIT 1').get(`%${parsedData.department}%`) as { id: string } | undefined;
    if (!doctor) {
      doctor = db.prepare('SELECT id FROM doctors LIMIT 1').get() as { id: string } | undefined;
    }

    if (!doctor) {
      // If no doctor exists yet in system
      const cbId = crypto.randomUUID();
      db.prepare(`
        INSERT INTO callback_requests (id, caller_phone, caller_name, patient_id, source, status, created_at, updated_at)
        VALUES (?, ?, 'SMS Outreach', ?, 'SMS_MENU', 'PENDING', ?, ?)
      `).run(cbId, phone, patient.id, now, now);
      return {
        replyText: texts.callback_created(cbId),
        sessionUpdated: true,
      };
    }

    const aptId = crypto.randomUUID();
    const refCode = `RC-${Date.now().toString().slice(-6)}`;
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    db.prepare(`
      INSERT INTO appointments (id, reference_code, patient_id, doctor_id, department, appointment_date, time_slot, reason_summary, status, channel, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, '10:00 AM - 11:00 AM', ?, 'PENDING', 'SMS', ?, ?)
    `).run(aptId, refCode, patient.id, doctor.id, parsedData.department, tomorrow, trimmed || 'SMS request', now, now);

    // Reset session
    db.prepare("UPDATE sms_sessions SET current_step = 'MAIN_MENU', session_data = '{}', last_interaction_at = ? WHERE phone = ?").run(now, phone);

    logAudit(patient.id, 'patient', 'CREATE_APPOINTMENT_VIA_SMS', 'appointments', aptId, { refCode, department: parsedData.department });

    return {
      replyText: texts.booked(refCode, parsedData.department),
      sessionUpdated: true,
    };
  }

  return { replyText: texts.menu, sessionUpdated: true };
}
