import { auth } from './firebase.js';
import {
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js';

const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const statusMessage = document.getElementById('statusMessage');
const forgotPasswordBtn = document.getElementById('forgotPasswordBtn');
const loginSubmitBtn = document.getElementById('loginSubmitBtn');
const toast = document.getElementById('appToast');

function showToast(message, type = 'info') {
  if (!toast) return;
  toast.textContent = message;
  toast.className = `toast show ${type}`;
  clearTimeout(showToast.timeoutId);
  showToast.timeoutId = setTimeout(() => {
    toast.className = 'toast';
  }, 2600);
}

function mapErrorToUserMessage(error) {
  console.error('Login failed:', error);
  return 'Please try again in a moment.';
}

const showStatus = (message, isError = false) => {
  if (!statusMessage) return;
  statusMessage.textContent = message;
  statusMessage.style.color = isError ? '#b91c1c' : '#15803d';
};

const setLoading = (isLoading) => {
  if (!loginSubmitBtn) return;
  loginSubmitBtn.disabled = isLoading;
  loginSubmitBtn.textContent = isLoading ? 'Signing in...' : 'Login';
};

onAuthStateChanged(auth, (user) => {
  if (user) {
    window.location.href = 'dashboard.html';
  }
});

forgotPasswordBtn?.addEventListener('click', async () => {
  const email = emailInput?.value.trim();
  if (!email) {
    showToast('Enter your email to receive a reset link.', 'error');
    return;
  }

  try {
    await sendPasswordResetEmail(auth, email);
    showToast('A reset link has been sent to your email.', 'success');
    showStatus('A reset link has been sent to your email.', false);
  } catch (error) {
    const friendlyMessage = mapErrorToUserMessage(error);
    showToast(friendlyMessage, 'error');
    showStatus(friendlyMessage, true);
  }
});

loginForm?.addEventListener('submit', async (event) => {
  event.preventDefault();

  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    showToast('Please enter your email and password.', 'error');
    showStatus('Please enter your email and password.', true);
    return;
  }

  try {
    setLoading(true);
    showStatus('Signing in...');
    const credential = await signInWithEmailAndPassword(auth, email, password);

    if (!credential.user.email) {
      await signOut(auth);
      showToast('Your account could not be verified.', 'error');
      showStatus('Your account could not be verified.', true);
      return;
    }

    showToast('Login successful. Redirecting...', 'success');
    showStatus('Login successful. Redirecting...', false);
    window.location.href = 'dashboard.html';
  } catch (error) {
    const friendlyMessage = mapErrorToUserMessage(error);
    showToast(friendlyMessage, 'error');
    showStatus(friendlyMessage, true);
  } finally {
    setLoading(false);
  }
});
