import { db } from './firebase.js';
import {
  collection,
  addDoc,
  getDocs,
  query,
  serverTimestamp,
  where,
} from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js';
import { validateMemberForm } from './registerValidation.mjs';

const form = document.getElementById('registrationForm');
const statusMsg = document.getElementById('statusMessage');
const submitButton = document.getElementById('submitRegistrationBtn');
const successBox = document.getElementById('registrationSuccess');
const registerAnotherBtn = document.getElementById('registerAnotherBtn');
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

function friendlyWriteError(error) {
  const message = error && typeof error === 'object' && error.message ? error.message : '';
  if (message && /permission|firestore|network|fetch|quota|unavailable|timeout/i.test(message)) {
    return 'Unable to save your registration right now. Please try again.';
  }
  return 'Something went wrong. Please check your details and try again.';
}

function setLoading(isLoading) {
  if (!submitButton) return;
  submitButton.disabled = isLoading;
  submitButton.textContent = isLoading ? 'Submitting...' : 'Submit Registration';
}

function showStatus(message, isError = false) {
  if (!statusMsg) return;
  statusMsg.textContent = message;
  statusMsg.style.color = isError ? '#b91c1c' : '#15803d';
}

function setFieldError(fieldId, message) {
  const input = document.getElementById(fieldId);
  const errorElement = document.getElementById(`${fieldId}Error`);

  if (!input || !errorElement) return;

  input.classList.add('is-invalid');
  input.setAttribute('aria-invalid', 'true');
  errorElement.textContent = message;
}

function clearFieldError(fieldId) {
  const input = document.getElementById(fieldId);
  const errorElement = document.getElementById(`${fieldId}Error`);

  if (input) {
    input.classList.remove('is-invalid');
    input.setAttribute('aria-invalid', 'false');
  }

  if (errorElement) {
    errorElement.textContent = '';
  }
}

function clearAllFieldErrors() {
  ['firstName', 'lastName', 'phone', 'dobDay', 'dobYear', 'programme', 'yearOfStudy', 'residence'].forEach(clearFieldError);
}

function getFormValues() {
  return {
    firstName: document.getElementById('firstName')?.value ?? '',
    lastName: document.getElementById('lastName')?.value ?? '',
    phone: document.getElementById('phone')?.value ?? '',
    dobMonth: document.getElementById('dobMonth')?.value ?? '',
    dobDay: document.getElementById('dobDay')?.value ?? '',
    dobYear: document.getElementById('dobYear')?.value ?? '',
    programme: document.getElementById('programme')?.value ?? '',
    yearOfStudy: document.getElementById('yearOfStudy')?.value ?? '',
    residence: document.getElementById('residence')?.value ?? '',
  };
}

const resetSuccessState = () => {
  if (successBox) successBox.hidden = true;
  if (form) form.hidden = false;
};

if (registerAnotherBtn) {
  registerAnotherBtn.addEventListener('click', () => {
    resetSuccessState();
    form.reset();
    clearAllFieldErrors();
    showStatus('', false);
    showToast('You can register another member now.', 'success');
  });
}

form?.addEventListener('submit', async (event) => {
  event.preventDefault();

  if (submitButton?.disabled) {
    return;
  }

  clearAllFieldErrors();
  showStatus('', false);
  setLoading(true);

  try {
    const values = getFormValues();
    const validation = validateMemberForm(values);

    if (!validation.ok) {
      Object.entries(validation.errors).forEach(([fieldId, message]) => {
        setFieldError(fieldId, message);
      });

      const message = 'Please check the highlighted fields.';
      showStatus(message, true);
      showToast(message, 'error');
      return;
    }

    const { sanitized } = validation;
    const memberQuery = query(collection(db, 'members'), where('phone', '==', sanitized.phone));
    const existing = await getDocs(memberQuery);

    if (!existing.empty) {
      setFieldError('phone', 'A member with this phone number already exists.');
      const message = 'A member with this phone number already exists.';
      showStatus(message, true);
      showToast(message, 'error');
      return;
    }

    const dob = sanitized.dob;
    const memberData = {
      firstName: sanitized.firstName,
      lastName: sanitized.lastName,
      phone: sanitized.phone,
      dob,
      programme: sanitized.programme,
      yearOfStudy: sanitized.yearOfStudy,
      residence: sanitized.residence,
      status: 'active',
      createdAt: serverTimestamp(),
    };

    await addDoc(collection(db, 'members'), memberData);

    form.reset();
    clearAllFieldErrors();
    if (form) form.hidden = true;
    if (successBox) successBox.hidden = false;
    const successMessage = 'Registration submitted successfully.';
    showStatus(successMessage, false);
    showToast('Registration received successfully.', 'success');
  } catch (error) {
    const message = friendlyWriteError(error);
    showStatus(message, true);
    showToast(message, 'error');
  } finally {
    setLoading(false);
  }
});