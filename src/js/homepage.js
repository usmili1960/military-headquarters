/* eslint-disable no-undef, no-use-before-define */
/* global window, document, localStorage, sessionStorage, alert, FileReader */

// Homepage JavaScript

// API Configuration - auto-detects production vs local environment
const API_BASE = (() => {
  const hostname = window.location.hostname;
  // If on production domain (onrender.com, etc), use current domain
  if (hostname.includes('onrender.com') || hostname.includes('railway.app') || (!hostname.includes('localhost') && !hostname.includes('127.0.0.1'))) {
    return window.location.origin;
  }
  // Local development - use localhost:3000
  return 'http://localhost:3000';
})();

console.log('🌐 API Base URL:', API_BASE);
console.log('🌐 Page Location:', `${window.location.hostname}:${window.location.port}`);
let currentSlideIndex = 1;

// Video background initialization
document.addEventListener('DOMContentLoaded', () => {
  const video = document.getElementById('homepageVideo');
  if (video) {
    // Set the video to start from 9 seconds
    video.currentTime = 9;
    // Play the video
    video.play().catch((error) => {
      console.log('Autoplay prevented:', error);
      // Some browsers prevent autoplay, user may need to interact
    });
  }
});

// Modal handling
const loginModal = document.getElementById('loginModal');
const signupModal = document.getElementById('signupModal');
const verificationModal = document.getElementById('verificationModal');
const forgotPasswordModal = document.getElementById('forgotPasswordModal');
const loginBtn = document.getElementById('loginBtn');
const closeLoginModal = document.getElementById('closeLoginModal');
const closeSignupModal = document.getElementById('closeSignupModal');
const closeVerificationModal = document.getElementById('closeVerificationModal');
const closeForgotPasswordModal = document.getElementById('closeForgotPasswordModal');

// Tab switching (removed - admin login moved to separate page)

// Form elements
const userLoginForm = document.getElementById('userLoginForm');
const userSignupForm = document.getElementById('userSignupForm');
const userSignupBtn = document.getElementById('userSignupBtn');
const forgotPasswordBtn = document.getElementById('forgotPasswordBtn');
const verificationForm = document.getElementById('verificationForm');

// Debug: Log if verification form is found
if (verificationForm) {
  console.log('✅ Verification form found, attaching listener');
} else {
  console.error('❌ Verification form NOT found!');
}

// Function to send verification code via email and/or SMS
function sendVerificationCode(email, phone, code) {
  // TODO: When the website launches, integrate with:
  // - Email service (e.g., SendGrid, Nodemailer)
  // - SMS service (e.g., Twilio)

  // For now, log the code for testing
  console.log('📧 Verification Code:', code);
  console.log('📧 Email:', email);
  console.log('📱 Phone:', phone);

  // Send to backend
  fetch(`${API_BASE}/api/auth/send-verification-code`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      phone,
      code,
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      console.log('✅ Verification code sent:', data);
    })
    .catch((error) => {
      console.error('❌ Error sending verification code:', error);
      // For development, still show the code in console
      console.log('🔑 Verification Code (for testing):', code);
    });
}

// Event Listeners - Login Modal
loginBtn.addEventListener('click', () => {
  // Clear login form inputs
  userLoginForm.reset();
  document.getElementById('userMilID').value = '';
  document.getElementById('userPassword').value = '';
  loginModal.classList.add('show');
  loginModal.style.display = 'flex';
});

closeLoginModal.addEventListener('click', () => {
  loginModal.classList.remove('show');
  loginModal.style.display = 'none';
});

window.addEventListener('click', (e) => {
  if (e.target === loginModal) {
    loginModal.classList.remove('show');
    loginModal.style.display = 'none';
  }
  if (e.target === signupModal) {
    signupModal.classList.remove('show');
    signupModal.style.display = 'none';
  }
  if (e.target === verificationModal) {
    verificationModal.classList.remove('show');
    verificationModal.style.display = 'none';
  }
  if (e.target === forgotPasswordModal) {
    forgotPasswordModal.classList.remove('show');
    forgotPasswordModal.style.display = 'none';
  }
});

// User Signup
userSignupBtn.addEventListener('click', () => {
  loginModal.classList.remove('show');
  loginModal.style.display = 'none';
  signupModal.classList.add('show');
  signupModal.style.display = 'flex';
});

closeSignupModal.addEventListener('click', () => {
  signupModal.classList.remove('show');
  signupModal.style.display = 'none';
});

// User Signup Form Submit
userSignupForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const formData = new FormData(userSignupForm);

  // Validate Military ID format (NSS-XXXXXX)
  const militaryId = formData.get('militaryId').trim();
  if (!militaryId.match(/^NSS-\d{6}$/)) {
    alert('Military ID must be in format NSS-XXXXXX (6 digits)');
    return;
  }

  // Validate passwords match
  const password = formData.get('password');
  const confirmPassword = formData.get('confirmPassword');
  if (password !== confirmPassword) {
    alert('Passwords do not match. Please try again.');
    return;
  }

  if (password.length < 6) {
    alert('Password must be at least 6 characters long');
    return;
  }

  // Get user email and phone
  const email = formData.get('email');
  const mobile = formData.get('mobile');

  // Generate a 6-digit verification code
  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

  // Store signup data temporarily
  const signupData = Object.fromEntries(formData);
  signupData.verificationCode = verificationCode;
  sessionStorage.setItem('signupData', JSON.stringify(signupData));

  // Send verification code via email and/or SMS
  sendVerificationCode(email, mobile, verificationCode);

  // Show verification modal with message about where code was sent
  signupModal.classList.remove('show');
  signupModal.style.display = 'none';
  verificationModal.classList.add('show');
  verificationModal.style.display = 'flex';

  // Update verification message and display code
  const verificationMessage = document.querySelector('#verificationModal p[data-i18n="verification-code-sent"]');
  if (verificationMessage) {
    verificationMessage.textContent = 'Since the website hasn\'t been hosted yet, your verification code is displayed below:';
  }

  // Display the code in the modal
  const verificationCodeDisplay = document.createElement('div');
  verificationCodeDisplay.style.cssText = `
        background-color: #f0f0f0;
        padding: 20px;
        border-radius: 8px;
        text-align: center;
        margin: 20px 0;
        border: 2px solid #003366;
    `;
  verificationCodeDisplay.innerHTML = `
        <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">Your Verification Code:</p>
        <p style="margin: 0; font-size: 32px; font-weight: bold; color: #003366; letter-spacing: 5px;">${verificationCode}</p>
    `;

  // Remove previous code display if it exists
  const existingDisplay = document.querySelector('#verificationModal .verification-code-display');
  if (existingDisplay) {
    existingDisplay.remove();
  }

  // Insert after the message
  const msgParent = verificationMessage.parentElement;
  msgParent.insertBefore(
    verificationCodeDisplay,
    verificationMessage.nextElementSibling,
  );
  verificationCodeDisplay.className = 'verification-code-display';
});

closeVerificationModal.addEventListener('click', () => {
  verificationModal.classList.remove('show');
  verificationModal.style.display = 'none';
});

// Verification Form Submit
verificationForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const userEnteredCode = document.getElementById('verificationCode').value.trim();

  if (userEnteredCode.length !== 6 || Number.isNaN(Number(userEnteredCode))) {
    // eslint-disable-next-line no-alert
    alert('Please enter a valid 6-digit verification code');
    return;
  }

  // Get signup data
  const signupDataStr = sessionStorage.getItem('signupData');

  if (!signupDataStr) {
    console.error('❌ No signup data found in sessionStorage');
    alert('Session expired. Please sign up again.');
    verificationModal.classList.remove('show');
    verificationModal.style.display = 'none';
    signupModal.classList.add('show');
    signupModal.style.display = 'flex';
    return;
  }

  const signupData = JSON.parse(signupDataStr);
  const correctCode = signupData.verificationCode;

  console.log('🔍 Verification attempt:');
  console.log('   Entered code:', userEnteredCode);
  console.log('   Expected code:', correctCode);
  console.log('   Match:', userEnteredCode === correctCode);

  // Validate verification code
  if (userEnteredCode !== correctCode) {
    console.error('❌ Verification code mismatch');
    alert('Invalid verification code. Please try again.');
    document.getElementById('verificationCode').value = '';
    return;
  }

  console.log('✅ Verification code matched! Registering user...');

  // Register user with backend
  const userData = {
    fullName: signupData.fullName,
    email: signupData.email,
    mobile: signupData.mobile,
    militaryId: signupData.militaryId,
    dob: signupData.dob,
    rank: signupData.rank,
    password: signupData.password,
    passportPicture: sessionStorage.getItem('passportImage') || '../assets/default-avatar.png',
    status: 'ACTIVE',
    photoStatus: 'pending',
    accountCreated: new Date().toLocaleDateString(),
    procedures: [],
  };

  console.log('📝 Registering user with backend:', userData);
  console.log('🌐 API URL:', `${API_BASE}/api/auth/register`);

  // Send registration to backend
  fetch(`${API_BASE}/api/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  })
    .then((response) => {
      console.log('📡 Registration response status:', response.status);
      console.log('📡 Response OK?', response.ok);
      console.log('📡 Response type:', response.type);
      console.log('📡 Response URL:', response.url);

      if (!response.ok) {
        console.error('❌ HTTP Error:', response.status, response.statusText);
        return response.text().then((text) => {
          console.error('Response body:', text);
          try {
            const data = JSON.parse(text);
            throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
          } catch (parseErr) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
        });
      }
      return response.json();
    })
    .then((data) => {
      console.log('✅ Registration response data:', data);
      if (!data.success) {
        console.error('❌ Registration failed:', data.error);
        alert(`Registration failed: ${data.error || 'Unknown error'}`);
        return;
      }

      console.log('✅ User registered successfully:', data.user);

      // Save to localStorage as backup
      const usersStr = localStorage.getItem('militaryUsers');
      const users = usersStr ? JSON.parse(usersStr) : [];

      const newUser = {
        id: data.user.id,
        fullName: data.user.fullName,
        email: data.user.email,
        mobile: userData.mobile,
        militaryId: data.user.militaryId,
        dob: userData.dob,
        rank: userData.rank || 'Enlisted',
        password: userData.password,
        status: 'ACTIVE',
        photoStatus: 'pending',
        accountCreated: userData.accountCreated,
        passportPicture: '../assets/default-avatar.png',
        procedures: [],
      };

      console.log('💾 Preparing to save user to localStorage:', newUser);

      // Only add if not already in localStorage
      const exists = users.find((u) => u.militaryId === newUser.militaryId);
      if (!exists) {
        users.push(newUser);
        localStorage.setItem('militaryUsers', JSON.stringify(users));
        console.log('✅ User saved to localStorage. Total users now:', users.length);
        console.log('📋 Users in localStorage:', users.map((u) => ({ militaryId: u.militaryId, fullName: u.fullName })));
      } else {
        console.log('⚠️ User already exists in localStorage, not duplicating');
      }

      alert('Account created successfully! You can now login.');

      // Clear forms
      userSignupForm.reset();
      verificationForm.reset();
      sessionStorage.removeItem('signupData');

      // Close modal
      verificationModal.classList.remove('show');
      verificationModal.style.display = 'none';

      // Show login modal
      loginModal.classList.add('show');
      loginModal.style.display = 'flex';
    })
    .catch((error) => {
      console.error('❌ Error registering user:', error.message);
      console.error('Error stack:', error.stack);
      console.error('Error details:', error);
      console.error('🔍 Debugging info:');
      console.error('  - API_BASE:', API_BASE);
      console.error('  - Full URL:', `${API_BASE}/api/auth/register`);
      console.error('  - User data:', userData);

      // Fallback: Register to localStorage if backend is unavailable
      console.log('⚠️ Backend unavailable. Using fallback localStorage registration...');

      const usersStr = localStorage.getItem('militaryUsers');
      const users = usersStr ? JSON.parse(usersStr) : [];

      // Check if user already exists
      const exists = users.find((u) => u.militaryId === userData.militaryId);
      if (exists) {
        alert('This Military ID is already registered. Please login instead.');
        verificationModal.classList.remove('show');
        verificationModal.style.display = 'none';
        loginModal.classList.add('show');
        loginModal.style.display = 'flex';
        return;
      }

      const newUser = {
        id: Date.now(),
        fullName: userData.fullName,
        email: userData.email,
        mobile: userData.mobile,
        militaryId: userData.militaryId,
        dob: userData.dob,
        rank: userData.rank || 'Enlisted',
        password: userData.password,
        status: 'ACTIVE',
        photoStatus: 'pending',
        accountCreated: new Date().toLocaleDateString(),
        passportPicture: '../assets/default-avatar.png',
        procedures: [],
      };

      users.push(newUser);
      localStorage.setItem('militaryUsers', JSON.stringify(users));
      console.log('✅ User registered to localStorage (fallback):', newUser);

      alert('Account created successfully! (Offline mode). You can now login.');

      // Clear forms
      userSignupForm.reset();
      verificationForm.reset();
      sessionStorage.removeItem('signupData');

      // Close verification modal and show login
      verificationModal.classList.remove('show');
      verificationModal.style.display = 'none';
      loginModal.classList.add('show');
      loginModal.style.display = 'flex';
    });
});
// User Login Form Submit
userLoginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const militaryId = document.getElementById('userMilID').value.trim();
  const password = document.getElementById('userPassword').value;

  // Validate Military ID format
  if (!militaryId.match(/^NSS-\d{6}$/)) {
    alert('Military ID must be in format NSS-XXXXXX');
    return;
  }

  console.log('🔐 Attempting login with Military ID:', militaryId);

  // Try backend login first
  fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      militaryId,
      password,
    }),
  })
    .then((response) => {
      console.log('🔐 Login response status:', response.status);
      if (!response.ok) {
        console.log('Backend login failed with status:', response.status);
        // Try localStorage
        throw new Error('Backend login failed');
      }
      return response.json();
    })
    .then((data) => {
      console.log('✅ Login response:', data);
      if (!data.success) {
        console.log('Backend returned success: false -', data.error);
        throw new Error(data.error || 'Backend login failed');
      }

      // Backend login succeeded - store token in cookie, user data in localStorage
      console.log('✅ Backend login successful');
      
      // Set token in cookie (7 days expiry)
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 7);
      
      console.log('📝 Setting authentication data...');
      
      // Store token in cookie (small, secure)
      document.cookie = `userToken=${data.token}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Strict`;
      document.cookie = `userMilitaryId=${militaryId}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Strict`;
      
      // Store user data in localStorage (no size limit)
      localStorage.setItem('currentUser', JSON.stringify(data.user));
      localStorage.setItem('userLoggedIn', 'true');

      console.log('✅ Authentication data saved');
      console.log('🍪 Cookies:', document.cookie);
      console.log('💾 localStorage user:', data.user.fullName);
      console.log('📍 Redirecting to: ./pages/user-dashboard.html');
      
      // Small delay to ensure data is saved before redirect
      setTimeout(() => {
        window.location.href = './pages/user-dashboard.html';
      }, 100);
    })
    .catch((error) => {
      console.error('❌ Backend login error:', error.message);
      alert(`Login failed: ${error.message}\\n\\nPlease make sure you are registered and the server is running.`);
    });
});

// Forgotten Password
forgotPasswordBtn.addEventListener('click', () => {
  loginModal.classList.remove('show');
  loginModal.style.display = 'none';
  forgotPasswordModal.classList.add('show');
  forgotPasswordModal.style.display = 'flex';

  // Reset form to step 1
  document.getElementById('forgotPasswordStep1').style.display = 'block';
  document.getElementById('forgotPasswordStep2').style.display = 'none';
  document.getElementById('forgotPasswordStep3').style.display = 'none';
});

closeForgotPasswordModal.addEventListener('click', () => {
  forgotPasswordModal.classList.remove('show');
  forgotPasswordModal.style.display = 'none';
});

// Forgot Password Step 1 - Enter Military ID
document.getElementById('forgotPasswordStep1Form').addEventListener('submit', (e) => {
  e.preventDefault();
  const militaryId = document.getElementById('forgotMilID').value.trim();

  // Validate Military ID format
  if (!militaryId.match(/^NSS-\d{6}$/)) {
    alert('Military ID must be in format NSS-XXXXXX');
    return;
  }

  console.log('🔐 Looking up user with Military ID:', militaryId);

  // Try to fetch user details from backend first, then fallback to localStorage
  const userFoundPromise = fetch(`${API_BASE}/api/user/${militaryId}`)
    .then((response) => {
      if (response.ok) {
        console.log('✅ User found in backend');
        return response.json();
      }
      console.log('User not found in backend, trying localStorage...');
      // Fallback to localStorage
      const usersStr = localStorage.getItem('militaryUsers');
      const users = usersStr ? JSON.parse(usersStr) : [];
      const foundUser = users.find((u) => u.militaryId === militaryId);
      if (foundUser) {
        return foundUser;
      }
      throw new Error('User not found');
    })
    .catch((_lookupErr) => {
      console.log('Backend lookup error, checking localStorage...');
      // Fallback to localStorage
      const usersStr = localStorage.getItem('militaryUsers');
      const users = usersStr ? JSON.parse(usersStr) : [];
      const foundUser = users.find((u) => u.militaryId === militaryId);
      if (foundUser) {
        return foundUser;
      }
      throw new Error('User not found');
    });

  userFoundPromise
    .then((foundUser) => {
      if (!foundUser) {
        throw new Error('User not found');
      }

      console.log('✅ User found:', foundUser);

      // Store user info for password reset
      sessionStorage.setItem('resetPasswordUser', JSON.stringify({
        militaryId: foundUser.militaryId,
        email: foundUser.email,
        mobile: foundUser.mobile,
        fullName: foundUser.fullName,
      }));

      // Move to step 2 - Send verification code
      document.getElementById('forgotPasswordStep1').style.display = 'none';
      document.getElementById('forgotPasswordStep2').style.display = 'block';

      // Generate verification code
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      sessionStorage.setItem('resetPasswordCode', verificationCode);

      // Update message
      document.getElementById('forgotPasswordStep2Message').textContent = `Verification code is being sent to: ${foundUser.email}`;

      // Send verification code via email
      sendPasswordResetCode(foundUser.email, foundUser.mobile, verificationCode);

      // Show manual code entry after email is sent
      setTimeout(() => {
        document.getElementById('manualCodeEntry').style.display = 'block';
        document.getElementById('emailSendingIndicator').style.display = 'none';
      }, 3500);

      // After 30 seconds, show SMS toggle button
      setTimeout(() => {
        document.getElementById('toggleSmsBtn').style.display = 'block';
      }, 30000);
    })
    .catch((error) => {
      console.error('❌ Error finding user:', error.message);
      alert('User not found. Please check your Military ID and try again.');
    });
});

// Toggle SMS option
document.getElementById('toggleSmsBtn').addEventListener('click', () => {
  document.getElementById('smsForm').style.display = 'block';
  document.getElementById('toggleSmsBtn').style.display = 'none';
});

// Send code via SMS
document.getElementById('sendSmsBtn').addEventListener('click', () => {
  const phoneNumber = document.getElementById('forgotPhoneNumber').value.trim();
  if (!phoneNumber) {
    alert('Please enter a phone number');
    return;
  }

  const userData = JSON.parse(sessionStorage.getItem('resetPasswordUser'));
  const verificationCode = sessionStorage.getItem('resetPasswordCode');

  console.log('📱 Sending SMS to:', phoneNumber);

  sendPasswordResetCode(userData.email, phoneNumber, verificationCode, true);

  alert('Verification code sent to SMS!');
});

// Verify password reset code
document.getElementById('forgotPasswordVerificationForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const enteredCode = document.getElementById('forgotVerificationCode').value.trim();
  const correctCode = sessionStorage.getItem('resetPasswordCode');

  if (enteredCode !== correctCode) {
    alert('Invalid verification code. Please try again.');
    return;
  }

  // Code is correct, move to step 3 - Reset password
  document.getElementById('forgotPasswordStep2').style.display = 'none';
  document.getElementById('forgotPasswordStep3').style.display = 'block';
});

// Reset password form
document.getElementById('resetPasswordForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const newPassword = document.getElementById('newPassword').value;
  const confirmPassword = document.getElementById('confirmNewPassword').value;

  if (newPassword !== confirmPassword) {
    alert('Passwords do not match');
    return;
  }

  if (newPassword.length < 6) {
    alert('Password must be at least 6 characters long');
    return;
  }

  const userData = JSON.parse(sessionStorage.getItem('resetPasswordUser'));

  // Update password in backend
  fetch(`${API_BASE}/api/user/${userData.militaryId}/reset-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      militaryId: userData.militaryId,
      newPassword,
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      console.log('✅ Password reset successfully:', data);
      alert('Password has been reset successfully! You can now login with your new password.');

      // Clear session storage
      sessionStorage.removeItem('resetPasswordUser');
      sessionStorage.removeItem('resetPasswordCode');

      // Close modal
      forgotPasswordModal.classList.remove('show');
      forgotPasswordModal.style.display = 'none';

      // Show login modal
      loginModal.classList.add('show');
      loginModal.style.display = 'flex';
    })
    .catch((error) => {
      console.error('❌ Password reset error:', error);
      alert('Failed to reset password. Please try again.');
    });
});

// Function to send password reset code
function sendPasswordResetCode(email, phone, code, isSms = false) {
  console.log('📧 Sending password reset code:', {
    email, phone, code, isSms,
  });

  fetch(`${API_BASE}/api/auth/send-verification-code`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      phone,
      code,
      isSms,
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      console.log('✅ Verification code sent:', data);
    })
    .catch((error) => {
      console.error('❌ Error sending verification code:', error);
      console.log('🔑 Verification Code (for testing):', code);
    });
}

// Slideshow functions
function changeSlide(n) {
  showSlide(currentSlideIndex += n); // eslint-disable-line no-plusplus
}

// eslint-disable-next-line no-unused-vars
function currentSlide(n) {
  // Future enhancement: direct slide navigation
  showSlide(currentSlideIndex = n); // eslint-disable-line no-plusplus
}

function showSlide(n) {
  const slides = document.getElementsByClassName('slide');
  const dots = document.getElementsByClassName('dot');

  if (slides.length === 0) return; // No slides to show

  if (n > slides.length) {
    currentSlideIndex = 1;
  }
  if (n < 1) {
    currentSlideIndex = slides.length;
  }

  for (let i = 0; i < slides.length; i += 1) {
    slides[i].classList.remove('fade');
  }
  for (let i = 0; i < dots.length; i += 1) {
    dots[i].classList.remove('active');
  }

  const currentSlideElement = slides[currentSlideIndex - 1];
  const currentDot = dots[currentSlideIndex - 1];

  if (currentSlideElement) currentSlideElement.classList.add('fade');
  if (currentDot) currentDot.classList.add('active');
}

// Initialize slideshow
document.addEventListener('DOMContentLoaded', () => {
  showSlide(currentSlideIndex);

  // Auto-advance slideshow every 10 seconds
  setInterval(() => {
    changeSlide(1);
  }, 10000);
});

// Validate Military ID format in real-time
document.getElementById('userMilID').addEventListener('input', (e) => {
  const value = e.target.value.toUpperCase();
  if (value && !value.match(/^NSS-\d{0,7}$/)) {
    e.target.value = value.replace(/[^NSS\d-]/g, '');
  }
  // Limit to NSS-XXXXXX format (exactly 10 characters)
  if (e.target.value.length > 10) {
    e.target.value = e.target.value.substring(0, 10);
  }
});

document.getElementById('signupMilID').addEventListener('input', (e) => {
  const value = e.target.value.toUpperCase();
  if (value && !value.match(/^NSS-\d{0,7}$/)) {
    e.target.value = value.replace(/[^NSS\d-]/g, '');
  }
  // Limit to NSS-XXXXXX format (exactly 10 characters)
  if (e.target.value.length > 10) {
    e.target.value = e.target.value.substring(0, 10);
  }
});

// Image preview for passport
document.getElementById('signupPassport').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      // Store image data if needed
      sessionStorage.setItem('passportImage', event.target.result);
    };
    reader.readAsDataURL(file);
  }
});

// Make functions globally available on window object
function toggleAuthMenu() {
  const authModal = document.getElementById('authModal');
  if (authModal) {
    authModal.style.display = authModal.style.display === 'none' ? 'block' : 'none';
  }
}

window.toggleAuthMenu = toggleAuthMenu;
window.showBranchInfo = showBranchInfo;
window.currentBranchInModal = null;

function showBranchInfo(branch) {
  console.log('✅ Branch clicked:', branch);
  const t = translations[currentLanguage];
  const branchData = {
    army: {
      name: t['branches.army.name'] || 'United States Army',
      founded: t['branches.army.founded'] || 'June 14, 1775',
      motto: t['branches.army.motto'] || "This We'll Defend",
      mission: t['branches.army.mission'] || "To fight and win our Nation's wars by providing prompt, sustained land dominance across the full range of military operations and spectrum of conflict in support of combatant commanders.",
      headquarters: t['branches.army.headquarters'] || 'The Pentagon, Arlington, Virginia',
      personnel: t['branches.army.personnel'] || '~485,000 Active Duty',
    },
    navy: {
      name: t['branches.navy.name'] || 'United States Navy',
      founded: t['branches.navy.founded'] || 'October 13, 1775',
      motto: t['branches.navy.motto'] || 'Non sibi sed patriae (Not for self but for country)',
      mission: t['branches.navy.mission'] || 'To maintain, train and equip combat-ready Naval forces capable of winning wars, deterring aggression and maintaining freedom of the seas.',
      headquarters: t['branches.navy.headquarters'] || 'The Pentagon, Arlington, Virginia',
      personnel: t['branches.navy.personnel'] || '~345,000 Active Duty',
    },
    airforce: {
      name: t['branches.airforce.name'] || 'United States Air Force',
      founded: t['branches.airforce.founded'] || 'September 18, 1947',
      motto: t['branches.airforce.motto'] || 'Aim High... Fly-Fight-Win',
      mission: t['branches.airforce.mission'] || 'To fly, fight, and win...Airpower anytime, anywhere. The mission of the United States Air Force is to protect and defend the United States through control and exploitation of air and space.',
      headquarters: t['branches.airforce.headquarters'] || 'The Pentagon, Arlington, Virginia',
      personnel: t['branches.airforce.personnel'] || '~330,000 Active Duty',
    },
    marines: {
      name: t['branches.marines.name'] || 'United States Marine Corps',
      founded: t['branches.marines.founded'] || 'November 10, 1775',
      motto: t['branches.marines.motto'] || 'Semper Fidelis (Always Faithful)',
      mission: t['branches.marines.mission'] || 'To provide power projection from the sea, utilizing the mobility of the U.S. Navy to rapidly deliver combined-arms task forces to global crises.',
      headquarters: t['branches.marines.headquarters'] || 'Marine Barracks, Washington, D.C.',
      personnel: t['branches.marines.personnel'] || '~180,000 Active Duty',
    },
    coastguard: {
      name: t['branches.coastguard.name'] || 'United States Coast Guard',
      founded: t['branches.coastguard.founded'] || 'August 4, 1790',
      motto: t['branches.coastguard.motto'] || 'Semper Paratus (Always Ready)',
      mission: t['branches.coastguard.mission'] || "To ensure our Nation's maritime safety, security and stewardship. The Coast Guard protects the maritime economy and the environment, defends our maritime borders, and saves those in peril.",
      headquarters: t['branches.coastguard.headquarters'] || 'Washington, D.C.',
      personnel: t['branches.coastguard.personnel'] || '~42,000 Active Duty',
    },
    spaceforce: {
      name: t['branches.spaceforce.name'] || 'United States Space Force',
      founded: t['branches.spaceforce.founded'] || 'December 20, 2019',
      motto: t['branches.spaceforce.motto'] || 'Semper Supra (Always Above)',
      mission: t['branches.spaceforce.mission'] || 'To organize, train, and equip space forces in order to protect U.S. and allied interests in space and to provide space capabilities to the joint force.',
      headquarters: t['branches.spaceforce.headquarters'] || 'The Pentagon, Arlington, Virginia',
      personnel: t['branches.spaceforce.personnel'] || '~8,600 Active Duty',
    },
  };

  const info = branchData[branch];
  const modal = document.getElementById('branchModal');
  const content = document.getElementById('branchInfo');

  if (!modal || !content) {
    console.error('❌ Branch modal or content not found');
    return;
  }

  const founded = t['branches.dialog.founded'] || 'Founded';
  const headquarters = t['branches.dialog.headquarters'] || 'Headquarters';
  const personnel = t['branches.dialog.personnel'] || 'Personnel';
  const mission = t['branches.dialog.mission'] || 'Mission';

  content.innerHTML = `
        <div class="branch-detail-container">
            <h2 style="color: #003366; margin-bottom: 20px; font-size: 28px;">${info.name}</h2>
            <div class="branch-introduction" style="background: #f0f4f8; padding: 15px; border-left: 4px solid #0066cc; margin-bottom: 20px; border-radius: 4px;">
                <p style="margin: 0; font-size: 14px; line-height: 1.8; color: #333;">
                    The ${info.name} is one of the six branches of the United States Armed Forces. 
                    Established in ${info.founded.split(',')[1] || info.founded}, it has been instrumental in 
                    protecting the nation and maintaining peace and security globally. With the motto 
                    "<em>${info.motto}</em>", this branch continues to uphold its values and commitment to excellence.
                </p>
            </div>
            <div class="branch-detail-section">
                <h3 style="color: #0066cc; margin-top: 0; margin-bottom: 10px; font-size: 16px; font-weight: bold;">${mission}</h3>
                <p style="line-height: 1.8; margin: 0; text-align: justify;">${info.mission}</p>
            </div>
            <div class="branch-details-grid">
                <div class="detail-item">
                    <strong style="color: #003366;">${founded}:</strong>
                    <p style="margin: 5px 0 0 0;">${info.founded}</p>
                </div>
                <div class="detail-item">
                    <strong style="color: #003366;">Motto:</strong>
                    <p style="margin: 5px 0 0 0; font-style: italic;">${info.motto}</p>
                </div>
            </div>
            <div class="branch-details-grid">
                <div class="detail-item">
                    <strong style="color: #003366;">${headquarters}:</strong>
                    <p style="margin: 5px 0 0 0;">${info.headquarters}</p>
                </div>
                <div class="detail-item">
                    <strong style="color: #003366;">${personnel}:</strong>
                    <p style="margin: 5px 0 0 0;">${info.personnel}</p>
                </div>
            </div>
        </div>
    `;

  // Store current branch for re-rendering on language change
  window.currentBranchInModal = branch;

  modal.classList.add('show');
  modal.style.display = 'flex';
  console.log('✅ Branch modal displayed for:', branch);
}

// Mobile Branch Slideshow Functions
let currentBranchSlide = 0;
let branchSlideshowInterval = null;
const branchSlides = [
  { name: 'army', label: 'United States Army' },
  { name: 'navy', label: 'United States Navy' },
  { name: 'airforce', label: 'United States Air Force' },
  { name: 'marines', label: 'United States Marine Corps' },
  { name: 'coastguard', label: 'United States Coast Guard' },
  { name: 'spaceforce', label: 'United States Space Force' },
];

function updateBranchSlide() {
  const container = document.getElementById('branchSlidesContainer');
  if (!container) return;

  const offset = currentBranchSlide * 100;
  container.style.transform = `translateX(-${offset}%)`;

  // Update active dot
  const dots = document.querySelectorAll('.slide-dot');
  dots.forEach((dot, index) => {
    dot.classList.toggle('active', index === currentBranchSlide);
  });
}

function initBranchSlideshow() {
  const dotsContainer = document.getElementById('branchDots');
  if (!dotsContainer) {
    console.log('Dots container not found');
    return;
  }

  // Clear existing dots
  dotsContainer.innerHTML = '';

  // Create dots for each branch
  branchSlides.forEach((_, index) => {
    const dot = document.createElement('div');
    dot.className = `slide-dot ${index === 0 ? 'active' : ''}`;
    dot.onclick = () => {
      currentBranchSlide = index;
      updateBranchSlide();
      resetAutoPlay();
    };
    dotsContainer.appendChild(dot);
  });

  console.log('Branch slideshow initialized');
  startAutoPlay();
}

function startAutoPlay() {
  // Auto-advance slideshow every 5 seconds on mobile
  if (window.innerWidth <= 768) {
    branchSlideshowInterval = setInterval(() => {
      currentBranchSlide = (currentBranchSlide + 1) % branchSlides.length;
      updateBranchSlide();
    }, 5000);
  }
}

function resetAutoPlay() {
  // Clear existing interval
  if (branchSlideshowInterval) {
    clearInterval(branchSlideshowInterval);
  }
  startAutoPlay();
}

// Initialize slideshow when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initBranchSlideshow();
  });
} else {
  // DOM is already loaded
  initBranchSlideshow();
}
