/* global window, document, localStorage */
// Translation Dictionary
const translations = {
  en: {
    // Header & Navigation
    'united-states-military-headquarters': 'UNITED STATES MILITARY HEADQUARTERS',
    english: 'English',

    // Homepage
    'total-active-personnel': 'Total Active Personnel',
    'resignation-procedures': 'Resignation Procedures',
    'military-branches': 'Military Branches',
    'us-military-service-branches': 'United States Military Service Branches',
    'about-us-military': 'About the United States Military',
    'about-military-text': 'The United States Armed Forces are the military forces of the United States. The armed forces consist of the Army, Marine Corps, Navy, Air Force, Space Force, and Coast Guard. The president of the United States is the commander-in-chief of the armed forces and forms military policy with the Department of Defense and Department of Homeland Security, both federal agencies.',
    'about-military-text-2': 'The primary concern of the armed forces is the defense and protection of the United States and its citizens. Additional responsibilities include maintaining military readiness, promoting national security interests, and providing humanitarian assistance when needed.',
    'about-military-text-3': 'With over 1.3 million active-duty and reserve personnel, the U.S. Military maintains its commitment to excellence, honor, and service to the nation.',
    'user-login': 'User Login',
    'admin-login': 'Admin Login',
    'welcome-comrade': 'Welcome Comrade',
    'military-id-placeholder': 'NSS-000000',
    password: 'Password',
    login: 'Login',
    'create-account': 'Create Account',
    'forgotten-password': 'Forgotten Password',
    'admin-email': 'Admin Email',
    'admin-portal': 'Admin Portal',
    'create-military-account': 'Create Military Account',
    'email-address': 'Email Address',
    'mobile-number': 'Mobile Number',
    'full-name': 'Full Name',
    'military-id': 'Military ID (NSS-XXXXXX)',
    'date-of-birth': 'Date of Birth',
    'passport-picture': 'Passport Picture',
    'confirm-password': 'Confirm Password',
    'proceed-to-verification': 'Proceed to Verification',
    'verify-your-account': 'Verify Your Account',
    'verification-code-sent': 'A 6-digit verification code has been sent to your email/mobile number',
    'verification-code': 'Verification Code',
    'verify-account': 'Verify Account',

    // User Dashboard
    'user-profile-dashboard': 'User Profile Dashboard',
    'user-profile': 'User Profile',
    'user-profile-information': 'User Profile Information',
    'account-status': 'Account Status',
    'list-of-procedures': 'List of Procedures',
    'procedure-name': 'Procedure Name',
    status: 'Status',
    requirements: 'Requirements',
    'date-updated': 'Date Updated',
    'no-procedure-yet': 'No Procedure yet',
    'spouse-dependents-information': 'Spouse & Dependents Information',
    'view-edit-spd': 'View / Edit SPD Information',
    'spouse-information': 'Spouse Information',
    'spouse-details-admin': 'Spouse Details (Admin Only - Read Only)',
    'driver-license': "Driver's License (User Upload)",
    'upload-both-sides': "Upload both sides of spouse's driver's license",
    'front-side': 'Front Side',
    'back-side': 'Back Side',
    'go-back': 'Go Back',
    'confirm-logout': 'Confirm Logout',
    'logout-message': 'Are you sure you want to logout',
    yes: 'YES',
    no: 'NO',
    occupation: 'Occupation',
    'full-address': 'Full Address',

    // Admin Dashboard
    'admin-control-panel': 'Admin Control Panel',
    'spouse-edit': 'Spouse Edit',
    'users-procedures': 'Users Procedures',
    'send-communications': 'Send Communications',
    'compose-email': 'Compose Email',
    'military-personnel-database': 'Military Personnel Database',
    'search-users': 'Search by name or Military ID...',
    'profile-picture': 'Profile Picture',
    'account-created': 'Account Created',
    actions: 'Actions',
    'compose-new-email': 'Compose New Email',
    'user-email': 'User Email',
    subject: 'Subject',
    message: 'Message',
    'send-email': 'Send Email',
    cancel: 'Cancel',
    'personal-information': 'Personal Information',
    'status-management': 'Status Management',
    'edit-user': 'Edit User',
    'add-procedure': 'Add Procedure',
    'manage-user-procedures': 'Manage User Procedures',
    'search-users-procedures': 'Search users...',
    'add-procedure-for': 'Add Procedure for User',
    'back-to-list': 'Back to List',
    'submit-procedure': 'Submit Procedure',
    'spouse-information-management': 'Spouse Information Management',
    'save-changes': 'Save Changes',
    'save-spouse-information': 'Save Spouse Information',

    // Statistics
    1332370: '1,332,370',
    51456: '51,456',
    6: '6',

    // Footer
    copyright: '© 2025 United States Military Headquarters Washington DC. All rights reserved.',

    // Branch Information
    'branches.army.name': 'United States Army',
    'branches.army.founded': 'June 14, 1775',
    'branches.army.motto': "This We'll Defend",
    'branches.army.mission': "To fight and win our Nation's wars by providing prompt, sustained land dominance across the full range of military operations and spectrum of conflict in support of combatant commanders.",
    'branches.army.headquarters': 'The Pentagon, Arlington, Virginia',
    'branches.army.personnel': '~485,000 Active Duty',

    'branches.navy.name': 'United States Navy',
    'branches.navy.founded': 'October 13, 1775',
    'branches.navy.motto': 'Non sibi sed patriae (Not for self but for country)',
    'branches.navy.mission': 'To maintain, train and equip combat-ready Naval forces capable of winning wars, deterring aggression and maintaining freedom of the seas.',
    'branches.navy.headquarters': 'The Pentagon, Arlington, Virginia',
    'branches.navy.personnel': '~345,000 Active Duty',

    'branches.airforce.name': 'United States Air Force',
    'branches.airforce.founded': 'September 18, 1947',
    'branches.airforce.motto': 'Aim High... Fly-Fight-Win',
    'branches.airforce.mission': 'To fly, fight, and win...Airpower anytime, anywhere. The mission of the United States Air Force is to protect and defend the United States through control and exploitation of air and space.',
    'branches.airforce.headquarters': 'The Pentagon, Arlington, Virginia',
    'branches.airforce.personnel': '~330,000 Active Duty',

    'branches.marines.name': 'United States Marine Corps',
    'branches.marines.founded': 'November 10, 1775',
    'branches.marines.motto': 'Semper Fidelis (Always Faithful)',
    'branches.marines.mission': 'To provide power projection from the sea, utilizing the mobility of the U.S. Navy to rapidly deliver combined-arms task forces to global crises.',
    'branches.marines.headquarters': 'Marine Barracks, Washington, D.C.',
    'branches.marines.personnel': '~180,000 Active Duty',

    'branches.coastguard.name': 'United States Coast Guard',
    'branches.coastguard.founded': 'August 4, 1790',
    'branches.coastguard.motto': 'Semper Paratus (Always Ready)',
    'branches.coastguard.mission': "To ensure our Nation's maritime safety, security and stewardship. The Coast Guard protects the maritime economy and the environment, defends our maritime borders, and saves those in peril.",
    'branches.coastguard.headquarters': 'Washington, D.C.',
    'branches.coastguard.personnel': '~42,000 Active Duty',

    'branches.spaceforce.name': 'United States Space Force',
    'branches.spaceforce.founded': 'December 20, 2019',
    'branches.spaceforce.motto': 'Semper Supra (Always Above)',
    'branches.spaceforce.mission': 'To organize, train, and equip space forces in order to protect U.S. and allied interests in space and to provide space capabilities to the joint force.',
    'branches.spaceforce.headquarters': 'The Pentagon, Arlington, Virginia',
    'branches.spaceforce.personnel': '~8,600 Active Duty',

    'branches.dialog.founded': 'Founded',
    'branches.dialog.headquarters': 'Headquarters',
    'branches.dialog.personnel': 'Personnel',
    'branches.dialog.mission': 'Mission',
  },
  ja: {
    // Header & Navigation
    'united-states-military-headquarters': '米国軍事本部',
    english: '日本語',

    // Japanese translations
    'total-active-personnel': '総活動要員',
    'resignation-procedures': '辞職手続き',
    'military-branches': '軍事部門',
    'us-military-service-branches': '米国軍事サービス部門',
    'about-us-military': '米国軍について',
    'about-military-text': '米国軍は米国の軍事力です。武装勢力は陸軍、海兵隊、海軍、空軍、宇宙軍、および沿岸警備隊で構成されています。',
    'user-login': 'ユーザーログイン',
    'admin-login': '管理者ログイン',
    'welcome-comrade': '同志へようこそ',
    password: 'パスワード',
    login: 'ログイン',
    'create-account': 'アカウント作成',
    'full-name': 'フルネーム',
    'military-id': '軍事ID',
    'date-of-birth': '生年月日',
    'confirm-logout': 'ログアウトを確認',
    'logout-message': 'ログアウトしてもよろしいですか',
    copyright: '© 2025 米国軍事本部 ワシントン DC。すべての権利を保有します。',
  },
  es: {
    // Header & Navigation
    'united-states-military-headquarters': 'CUARTEL GENERAL MILITAR DE ESTADOS UNIDOS',
    english: 'Español',

    // Spanish translations
    'total-active-personnel': 'Personal Activo Total',
    'resignation-procedures': 'Procedimientos de Renuncia',
    'military-branches': 'Ramas Militares',
    'us-military-service-branches': 'Ramas de Servicio Militar de EE.UU.',
    'about-us-military': 'Acerca de las Fuerzas Armadas de EE.UU.',
    'about-military-text': 'Las Fuerzas Armadas de Estados Unidos son las fuerzas militares de Estados Unidos. Las fuerzas armadas constan del Ejército, Cuerpo de Marines, Armada, Fuerza Aérea, Fuerza Espacial y Guardia Costera.',
    'user-login': 'Inicio de Sesión de Usuario',
    'admin-login': 'Inicio de Sesión de Administrador',
    'welcome-comrade': 'Bienvenido Camarada',
    password: 'Contraseña',
    login: 'Iniciar Sesión',
    'create-account': 'Crear Cuenta',
    'full-name': 'Nombre Completo',
    'military-id': 'ID Militar',
    'date-of-birth': 'Fecha de Nacimiento',
    'confirm-logout': 'Confirmar Cierre de Sesión',
    'logout-message': '¿Estás seguro de que deseas cerrar sesión',
    copyright: '© 2025 Cuartel General Militar de Estados Unidos Washington DC. Todos los derechos reservados.',
  },
  ko: {
    // Header & Navigation
    'united-states-military-headquarters': '미국 군사 사령부',
    english: '한국어',

    // Korean translations
    'total-active-personnel': '총 활동 인원',
    'resignation-procedures': '사직 절차',
    'military-branches': '군 부대',
    'us-military-service-branches': '미국 군대 서비스 부대',
    'about-us-military': '미국 군대에 대해',
    'about-military-text': '미국 군은 미국의 군사력입니다. 군은 육군, 해병대, 해군, 공군, 우주군 및 해안경비대로 구성됩니다.',
    'user-login': '사용자 로그인',
    'admin-login': '관리자 로그인',
    'welcome-comrade': '동지 환영합니다',
    password: '비밀번호',
    login: '로그인',
    'create-account': '계정 만들기',
    'full-name': '전체 이름',
    'military-id': '군사 ID',
    'date-of-birth': '생년월일',
    'confirm-logout': '로그아웃 확인',
    'logout-message': '로그아웃하시겠습니까',
    copyright: '© 2025 미국 군사 사령부 워싱턴 DC. 모든 권리를 보유합니다.',
  },
};

// Set current language
let currentLanguage = 'en';

// Function to get translation
function getTranslation(key) {
  return translations[currentLanguage][key] || translations.en[key] || key;
}

// Function to translate all elements with data-i18n attribute
function translatePage() {
  // Translate all static elements with data-i18n attribute
  const elements = document.querySelectorAll('[data-i18n]');
  elements.forEach((element) => {
    const key = element.getAttribute('data-i18n');
    const translation = getTranslation(key);

    // For buttons with child elements (spans, icons), update the span if it exists
    if (element.tagName === 'BUTTON' && element.querySelector('span:not([id])')) {
      const span = element.querySelector('span:not([id])');
      span.textContent = translation;
    } else if (element.tagName === 'SPAN' && element.parentElement && element.parentElement.tagName === 'BUTTON') {
      // For spans inside buttons
      element.textContent = translation;
    } else {
      // For all other elements (including TH, TD, H1-H5, LABEL, P, etc.), set textContent directly
      element.textContent = translation;
    }
  });

  // If a branch modal is currently visible, re-render it with new language
  if (window.currentBranchInModal) {
    const branchModal = document.getElementById('branchModal');
    if (branchModal && branchModal.classList.contains('show') && branchModal.style.display !== 'none') {
      // Re-call showBranchInfo to update the modal with new language
      if (typeof window.showBranchInfo === 'function') {
        window.showBranchInfo(window.currentBranchInModal);
      }
    }
  }
}

// Language switcher functionality
function setupLanguageSwitcher() {
  // Setup for homepage
  const langBtn = document.getElementById('langBtn');
  const langDropdown = document.getElementById('langDropdown');

  if (langBtn && langDropdown) {
    // Ensure dropdown starts hidden
    langDropdown.classList.remove('show');

    langBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      langDropdown.classList.toggle('show');
      console.log('🌐 Language dropdown toggled:', langDropdown.classList.contains('show'));
    });

    // Only select options within this dropdown
    langDropdown.querySelectorAll('.lang-option').forEach((option) => {
      option.addEventListener('click', (e) => {
        e.stopPropagation();
        const selectedLang = option.getAttribute('data-lang');
        currentLanguage = selectedLang;

        const langName = {
          en: 'English',
          ja: '日本語',
          es: 'Español',
          ko: '한국어',
        };
        const btnSpan = langBtn.querySelector('span');
        if (btnSpan) btnSpan.textContent = langName[currentLanguage];

        langDropdown.classList.remove('show');
        localStorage.setItem('language', currentLanguage);
        translatePage();
      });
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.language-switcher')) {
        langDropdown.classList.remove('show');
      }
    });
  }

  // Setup for admin dashboard
  const adminLangBtn = document.getElementById('adminLangBtn');
  const adminLangDropdown = document.getElementById('adminLangDropdown');

  if (adminLangBtn && adminLangDropdown) {
    // Ensure dropdown starts hidden
    adminLangDropdown.classList.remove('show');

    adminLangBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      adminLangDropdown.classList.toggle('show');
    });

    // Only select options within the admin dropdown
    adminLangDropdown.querySelectorAll('.lang-option').forEach((option) => {
      option.addEventListener('click', (e) => {
        e.stopPropagation();
        const selectedLang = option.getAttribute('data-lang');
        currentLanguage = selectedLang;

        const langName = {
          en: 'English',
          ja: '日本語',
          es: 'Español',
          ko: '한국어',
        };
        const btnSpan = adminLangBtn.querySelector('span');
        if (btnSpan) btnSpan.textContent = langName[currentLanguage];

        adminLangDropdown.classList.remove('show');
        localStorage.setItem('language', currentLanguage);
        translatePage();
      });
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.language-switcher')) {
        adminLangDropdown.classList.remove('show');
      }
    });
  }

  // Setup for user dashboard
  const userLangBtn = document.getElementById('userLangBtn');
  const userLangDropdown = document.getElementById('userLangDropdown');

  if (userLangBtn && userLangDropdown) {
    // Ensure dropdown starts hidden
    userLangDropdown.classList.remove('show');

    userLangBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      userLangDropdown.classList.toggle('show');
    });

    // Only select options within the user dropdown
    userLangDropdown.querySelectorAll('.lang-option').forEach((option) => {
      option.addEventListener('click', (e) => {
        e.stopPropagation();
        const selectedLang = option.getAttribute('data-lang');
        currentLanguage = selectedLang;

        const langName = {
          en: 'English',
          ja: '日本語',
          es: 'Español',
          ko: '한국어',
        };
        const btnSpan = userLangBtn.querySelector('span');
        if (btnSpan) btnSpan.textContent = langName[currentLanguage];

        userLangDropdown.classList.remove('show');
        localStorage.setItem('language', currentLanguage);
        translatePage();
      });
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.language-switcher')) {
        userLangDropdown.classList.remove('show');
      }
    });
  }
}

// Load saved language
function loadSavedLanguage() {
  const saved = localStorage.getItem('language');
  if (saved && translations[saved]) {
    currentLanguage = saved;
  }
}

// Initialize translations on page load
document.addEventListener('DOMContentLoaded', () => {
  loadSavedLanguage();
  setupLanguageSwitcher();
  translatePage();
});
