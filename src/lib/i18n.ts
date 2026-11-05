export type Language = 'kn' | 'hi' | 'en';

export interface Translations {
  appName: string;
  tagline: string;
  emergencyTitle: string;
  emergencyDial112: string;
  emergencyDial108: string;
  emergencyDisclaimer: string;
  
  // Navigation
  navHome: string;
  navDashboard: string;
  navAppointments: string;
  navPrescriptions: string;
  navRecords: string;
  navReminders: string;
  navMessages: string;
  navPatients: string;
  navCallbacks: string;
  navAvailability: string;
  navUsers: string;
  navDoctors: string;
  navHealthWorkers: string;
  navAuditLogs: string;
  navSettings: string;
  navLogin: string;
  navRegister: string;
  navLogout: string;
  navInstallApp: string;

  // Roles
  rolePatient: string;
  roleDoctor: string;
  roleHealthWorker: string;
  roleAdmin: string;

  // Channels
  channelWeb: string;
  channelSms: string;
  channelMissedCall: string;
  channelAssisted: string;

  // Common Actions
  bookAppointment: string;
  requestCallback: string;
  viewDetails: string;
  cancel: string;
  confirm: string;
  save: string;
  uploadReport: string;
  loading: string;
  noData: string;
  status: string;
  date: string;
  time: string;
  reason: string;
  department: string;
  doctor: string;
  phone: string;
  village: string;
  district: string;
  emergencyContact: string;

  // Statuses
  statusPending: string;
  statusConfirmed: string;
  statusCompleted: string;
  statusCancelled: string;
  statusRejected: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    appName: 'RuralCare Connect',
    tagline: 'Bridging healthcare for every rural household across smartphones, keypad SMS, and missed-calls',
    emergencyTitle: 'Urgent Care Notice (Emergency Hotline: 112)',
    emergencyDial112: 'Dial 112 National Emergency',
    emergencyDial108: 'Dial 108 Ambulance Service',
    emergencyDisclaimer: 'This platform is for scheduled consultations and primary care coordination. For acute life-threatening medical emergencies, dial 112 or 108 immediately.',
    
    navHome: 'Home',
    navDashboard: 'Dashboard',
    navAppointments: 'Appointments',
    navPrescriptions: 'Prescriptions',
    navRecords: 'Medical Records',
    navReminders: 'Reminders',
    navMessages: 'Messages',
    navPatients: 'My Patients',
    navCallbacks: 'Callback Requests',
    navAvailability: 'My Availability',
    navUsers: 'User Management',
    navDoctors: 'Doctor Verification',
    navHealthWorkers: 'Health Workers',
    navAuditLogs: 'Security Audit Logs',
    navSettings: 'Settings',
    navLogin: 'Login',
    navRegister: 'Patient Registration',
    navLogout: 'Sign Out',
    navInstallApp: 'Install App (PWA)',

    rolePatient: 'Patient',
    roleDoctor: 'Doctor',
    roleHealthWorker: 'Village Health Worker (ASHA)',
    roleAdmin: 'Administrator',

    channelWeb: 'Smartphone App',
    channelSms: 'Keypad SMS (Menu 1-4)',
    channelMissedCall: 'Missed-Call Request',
    channelAssisted: 'ASHA Worker Assisted',

    bookAppointment: 'Book Consultation',
    requestCallback: 'Request Callback',
    viewDetails: 'View Details',
    cancel: 'Cancel',
    confirm: 'Confirm',
    save: 'Save Changes',
    uploadReport: 'Upload Report',
    loading: 'Loading...',
    noData: 'No records found.',
    status: 'Status',
    date: 'Date',
    time: 'Time Slot',
    reason: 'Reason for Consultation',
    department: 'Department',
    doctor: 'Doctor',
    phone: 'Mobile Number',
    village: 'Village / Town',
    district: 'District',
    emergencyContact: 'Emergency Contact Phone',

    statusPending: 'Pending Doctor Review',
    statusConfirmed: 'Confirmed',
    statusCompleted: 'Consultation Completed',
    statusCancelled: 'Cancelled',
    statusRejected: 'Declined',
  },
  kn: {
    appName: 'ರೂರಲ್ ಕೇರ್ ಕನೆಕ್ಟ್ (RuralCare)',
    tagline: 'ಸ್ಮಾರ್ಟ್‌ಫೋನ್, ಕೀಪ್ಯಾಡ್ SMS ಮತ್ತು ಮಿಸ್ಡ್-ಕಾಲ್ ಮೂಲಕ ಗ್ರಾಮೀಣ ಪ್ರದೇಶಗಳಿಗೆ ಸುಲಭ ಆರೋಗ್ಯ ಸೇವೆ',
    emergencyTitle: 'ತುರ್ತು ಚಿಕಿತ್ಸಾ ಸೂಚನೆ (ತುರ್ತು ಸಹಾಯವಾಣಿ: 112)',
    emergencyDial112: '112 ರಾಷ್ಟ್ರೀಯ ತುರ್ತು ಸಹಾಯವಾಣಿ',
    emergencyDial108: '108 ಆಂಬ್ಯುಲೆನ್ಸ್ ಸೇವೆ',
    emergencyDisclaimer: 'ಈ ವೇದಿಕೆಯು ನಿಯಮಿತ ವೈದ್ಯಕೀಯ ಸಮಾಲೋಚನೆಗಳಿಗಾಗಿ ಮಾತ್ರ. ತೀವ್ರವಾದ ಜೀವಕ್ಕೆ ಅಪಾಯವಿರುವ ತುರ್ತು ಸಂದರ್ಭಗಳಲ್ಲಿ ತಕ್ಷಣ 112 ಅಥವಾ 108 ಗೆ ಕರೆ ಮಾಡಿ.',

    navHome: 'ಮುಖಪುಟ',
    navDashboard: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
    navAppointments: 'ವೈದ್ಯರ ಭೇಟಿಗಳು',
    navPrescriptions: 'ವೈದ್ಯಕೀಯ ಚೀಟಿಗಳು',
    navRecords: 'ವರದಿಗಳು',
    navReminders: 'ಜ್ಞಾಪನೆಗಳು',
    navMessages: 'ಸಂದೇಶಗಳು',
    navPatients: 'ನನ್ನ ರೋಗಿಗಳು',
    navCallbacks: 'ಕರೆ ವಿನಂತಿಗಳು',
    navAvailability: 'ಲಭ್ಯತೆಯ ಸಮಯ',
    navUsers: 'ಬಳಕೆದಾರರ ನಿರ್ವಹಣೆ',
    navDoctors: 'ವೈದ್ಯರ ಪರಿಶೀಲನೆ',
    navHealthWorkers: 'ಆಶಾ ಕಾರ್ಯಕರ್ತೆಯರು',
    navAuditLogs: 'ಭದ್ರತಾ ಲಾಗ್‌ಗಳು',
    navSettings: 'ಸೆಟ್ಟಿಂಗ್‌ಗಳು',
    navLogin: 'ಲಾಗಿನ್',
    navRegister: 'ರೋಗಿ ನೋಂದಣಿ',
    navLogout: 'ನಿರ್ಗಮಿಸಿ',
    navInstallApp: 'ಆ್ಯಪ್ ಇನ್‌ಸ್ಟಾಲ್ ಮಾಡಿ',

    rolePatient: 'ರೋಗಿ',
    roleDoctor: 'ವೈದ್ಯರು',
    roleHealthWorker: 'ಗ್ರಾಮ ಆರೋಗ್ಯ ಕಾರ್ಯಕರ್ತೆ (ಆಶಾ)',
    roleAdmin: 'ಆಡಳಿತಾಧಿಕಾರಿ',

    channelWeb: 'ಸ್ಮಾರ್ಟ್‌ಫೋನ್ ವೆಬ್ ಆ್ಯಪ್',
    channelSms: 'ಕೀಪ್ಯಾಡ್ SMS (ಮೆನು 1-4)',
    channelMissedCall: 'ಮಿಸ್ಡ್-ಕಾಲ್ ಸೇವೆ',
    channelAssisted: 'ಆಶಾ ಕಾರ್ಯಕರ್ತೆಯ ನೆರವು',

    bookAppointment: 'ಭೇಟಿ ನೋಂದಾಯಿಸಿ',
    requestCallback: 'ಕರೆಗಾಗಿ ವಿನಂತಿಸಿ',
    viewDetails: 'ವಿವರಗಳನ್ನು ನೋಡಿ',
    cancel: 'ರದ್ದುಗೊಳಿಸಿ',
    confirm: 'ದೃಢೀಕರಿಸಿ',
    save: 'ಉಳಿಸಿ',
    uploadReport: 'ವರದಿ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ',
    loading: 'ಲೋಡ್ ಆಗುತ್ತಿದೆ...',
    noData: 'ಯಾವುದೇ ದಾಖಲೆಗಳಿಲ್ಲ.',
    status: 'ಸ್ಥಿತಿ',
    date: 'ದಿನಾಂಕ',
    time: 'ಸಮಯದ ಸ್ಲಾಟ್',
    reason: 'ಸಮಸ್ಯೆಯ ವಿವರ',
    department: 'ವಿಭಾಗ',
    doctor: 'ವೈದ್ಯರು',
    phone: 'ಮೊಬೈಲ್ ಸಂಖ್ಯೆ',
    village: 'ಗ್ರಾಮ / ಊರು',
    district: 'ಜಿಲ್ಲೆ',
    emergencyContact: 'ತುರ್ತು ಸಂಪರ್ಕ ಸಂಖ್ಯೆ',

    statusPending: 'ವೈದ್ಯರ ಪರಿಶೀಲನೆಯಲ್ಲಿದೆ',
    statusConfirmed: 'ದೃಢೀಕರಿಸಲಾಗಿದೆ',
    statusCompleted: 'ಪೂರ್ಣಗೊಂಡಿದೆ',
    statusCancelled: 'ರದ್ದುಗೊಳಿಸಲಾಗಿದೆ',
    statusRejected: 'ತಿರಸ್ಕರಿಸಲಾಗಿದೆ',
  },
  hi: {
    appName: 'रूरलकेयर कनेक्ट (RuralCare)',
    tagline: 'स्मार्टफोन, कीपैड SMS और मिस्ड-कॉल के माध्यम से ग्रामीण भारत में स्वास्थ्य सेवा की सुलभ पहुंच',
    emergencyTitle: 'आपातकालीन सूचना (हेल्पलाइन: 112)',
    emergencyDial112: '112 राष्ट्रीय आपातकालीन नंबर',
    emergencyDial108: '108 एम्बुलेंस सेवा',
    emergencyDisclaimer: 'यह प्लेटफ़ॉर्म पूर्व-निर्धारित परामर्श और प्राथमिक स्वास्थ्य समन्वय हेतु है। किसी भी आपातकालीन स्थिति में तुरंत 112 या 108 डायल करें।',

    navHome: 'होम',
    navDashboard: 'डैशबोर्ड',
    navAppointments: 'अपॉइंटमेंट्स',
    navPrescriptions: 'दवा के नुस्खे',
    navRecords: 'मेडिकल रिपोर्ट्स',
    navReminders: 'स्मरणपत्र',
    navMessages: 'संदेश',
    navPatients: 'मेरे मरीज़',
    navCallbacks: 'कॉलबैक अनुरोध',
    navAvailability: 'मेरी उपलब्धता',
    navUsers: 'उपयोगकर्ता प्रबंधन',
    navDoctors: 'डॉक्टर सत्यापन',
    navHealthWorkers: 'स्वास्थ्य कार्यकर्ता (आशा)',
    navAuditLogs: 'सुरक्षा ऑडिट लॉग',
    navSettings: 'सेटिंग्स',
    navLogin: 'लॉग इन',
    navRegister: 'मरीज़ पंजीकरण',
    navLogout: 'लॉग आउट',
    navInstallApp: 'ऐप इंस्टॉल करें',

    rolePatient: 'मरीज़',
    roleDoctor: 'डॉक्टर',
    roleHealthWorker: 'ग्राम स्वास्थ्य कार्यकर्ता (आशा)',
    roleAdmin: 'प्रशासक',

    channelWeb: 'स्मार्टफोन वेब ऐप',
    channelSms: 'कीपैड SMS (मेनू 1-4)',
    channelMissedCall: 'मिस्ड-कॉल सेवा',
    channelAssisted: 'आशा कार्यकर्ता सहायता',

    bookAppointment: 'अपॉइंटमेंट बुक करें',
    requestCallback: 'कॉलबैक अनुरोध',
    viewDetails: 'विवरण देखें',
    cancel: 'रद्द करें',
    confirm: 'पुष्टि करें',
    save: 'सहेजें',
    uploadReport: 'रिपोर्ट अपलोड करें',
    loading: 'लोड हो रहा है...',
    noData: 'कोई रिकॉर्ड नहीं मिला।',
    status: 'स्थिति',
    date: 'तारीख',
    time: 'समय स्लॉट',
    reason: 'परामर्श का कारण',
    department: 'विभाग',
    doctor: 'डॉक्टर',
    phone: 'मोबाइल नंबर',
    village: 'गाँव / कस्बा',
    district: 'ज़िला',
    emergencyContact: 'आपातकालीन संपर्क नंबर',

    statusPending: 'डॉक्टर समीक्षा लंबित',
    statusConfirmed: 'स्वीकृत',
    statusCompleted: 'परामर्श पूर्ण',
    statusCancelled: 'रद्द',
    statusRejected: 'अस्वीकृत',
  },
};
