export const NAME_REGEX = /^[A-Za-z][A-Za-z'\- ]{0,49}$/;
export const PROGRAMME_REGEX = /^[A-Za-z][A-Za-z'&/\.\- ]{1,99}$/;
export const PHONE_REGEX = /^\+260\d{9}$/;

export function normalizePhoneNumber(value) {
  const compact = String(value ?? '').trim().replace(/[\s\-]+/g, '');

  if (!compact) {
    return '';
  }

  const withoutPlus = compact.startsWith('+') ? compact.slice(1) : compact;

  if (/^0\d{9}$/.test(withoutPlus)) {
    return `+260${withoutPlus.slice(1)}`;
  }

  if (/^260\d{9}$/.test(withoutPlus)) {
    return `+${withoutPlus}`;
  }

  if (/^\+260\d{9}$/.test(compact)) {
    return compact;
  }

  return compact;
}

export function validatePhoneNumber(value) {
  const normalized = normalizePhoneNumber(value);

  if (!PHONE_REGEX.test(normalized)) {
    return {
      ok: false,
      normalized: '',
      error: 'Enter a valid Zambian number, e.g. +260971234567.',
    };
  }

  return {
    ok: true,
    normalized,
    error: '',
  };
}

export function validateName(value) {
  const trimmed = String(value ?? '').trim();

  if (!trimmed) {
    return {
      ok: false,
      value: '',
      error: 'Enter a valid name (letters only, max 50 characters).',
    };
  }

  if (!NAME_REGEX.test(trimmed)) {
    return {
      ok: false,
      value: '',
      error: 'Enter a valid name (letters only, max 50 characters).',
    };
  }

  return {
    ok: true,
    value: trimmed,
    error: '',
  };
}

export function validateProgramme(value) {
  const trimmed = String(value ?? '').trim();

  if (trimmed.length < 2 || trimmed.length > 100) {
    return {
      ok: false,
      value: '',
      error: 'Enter a valid programme (letters only, 2-100 characters).',
    };
  }

  if (!PROGRAMME_REGEX.test(trimmed)) {
    return {
      ok: false,
      value: '',
      error: 'Enter a valid programme (letters only, 2-100 characters).',
    };
  }

  return {
    ok: true,
    value: trimmed,
    error: '',
  };
}

export function validateResidence(value) {
  const trimmed = String(value ?? '').trim();

  if (trimmed.length < 2 || trimmed.length > 100) {
    return {
      ok: false,
      value: '',
      error: 'Enter a valid residence (2-100 characters).',
    };
  }

  return {
    ok: true,
    value: trimmed,
    error: '',
  };
}

export function validateBirthYear(value) {
  const trimmed = String(value ?? '').trim();

  if (!/^\d+$/.test(trimmed)) {
    return {
      ok: false,
      value: '',
      error: 'Enter a birth year between 1990 and 2016.',
    };
  }

  const year = Number(trimmed);

  if (!Number.isInteger(year) || year < 1990 || year > 2016) {
    return {
      ok: false,
      value: '',
      error: 'Enter a birth year between 1990 and 2016.',
    };
  }

  return {
    ok: true,
    value: String(year),
    error: '',
  };
}

export function validateYearOfStudy(value) {
  const trimmed = String(value ?? '').trim();

  if (!['1', '2', '3', '4', '5'].includes(trimmed)) {
    return {
      ok: false,
      value: '',
      error: 'Select a valid year of study (1-5).',
    };
  }

  return {
    ok: true,
    value: trimmed,
    error: '',
  };
}

export function validateDateOfBirth(month, day, year) {
  const monthValue = String(month ?? '').trim();
  const dayValue = String(day ?? '').trim();
  const yearValue = String(year ?? '').trim();

  if (!monthValue || !dayValue || !yearValue) {
    return {
      ok: false,
      value: '',
      error: 'Please choose a valid date of birth.',
    };
  }

  const monthNumber = Number(monthValue);
  const dayNumber = Number(dayValue);
  const yearNumber = Number(yearValue);

  if (!Number.isInteger(monthNumber) || !Number.isInteger(dayNumber) || !Number.isInteger(yearNumber)) {
    return {
      ok: false,
      value: '',
      error: 'Please choose a valid date of birth.',
    };
  }

  const maxDayInMonth = new Date(yearNumber, monthNumber, 0).getDate();

  if (dayNumber < 1 || dayNumber > maxDayInMonth) {
    return {
      ok: false,
      value: '',
      error: 'Please choose a valid date of birth.',
    };
  }

  return {
    ok: true,
    value: `${yearNumber}-${String(monthNumber).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`,
    error: '',
  };
}

export function validateMemberForm(values) {
  const errors = {};

  const firstNameResult = validateName(values.firstName);
  if (!firstNameResult.ok) {
    errors.firstName = firstNameResult.error;
  }

  const lastNameResult = validateName(values.lastName);
  if (!lastNameResult.ok) {
    errors.lastName = lastNameResult.error;
  }

  const phoneResult = validatePhoneNumber(values.phone);
  if (!phoneResult.ok) {
    errors.phone = phoneResult.error;
  }

  const birthYearResult = validateBirthYear(values.dobYear);
  if (!birthYearResult.ok) {
    errors.dobYear = birthYearResult.error;
  }

  const dateResult = validateDateOfBirth(values.dobMonth, values.dobDay, birthYearResult.value || values.dobYear);
  if (!dateResult.ok && birthYearResult.ok) {
    errors.dobDay = dateResult.error;
  }

  const programmeResult = validateProgramme(values.programme);
  if (!programmeResult.ok) {
    errors.programme = programmeResult.error;
  }

  const yearOfStudyResult = validateYearOfStudy(values.yearOfStudy);
  if (!yearOfStudyResult.ok) {
    errors.yearOfStudy = yearOfStudyResult.error;
  }

  const residenceResult = validateResidence(values.residence);
  if (!residenceResult.ok) {
    errors.residence = residenceResult.error;
  }

  const sanitized = {
    firstName: firstNameResult.ok ? firstNameResult.value : '',
    lastName: lastNameResult.ok ? lastNameResult.value : '',
    phone: phoneResult.ok ? phoneResult.normalized : '',
    programme: programmeResult.ok ? programmeResult.value : '',
    yearOfStudy: yearOfStudyResult.ok ? yearOfStudyResult.value : '',
    residence: residenceResult.ok ? residenceResult.value : '',
    dobYear: birthYearResult.ok ? birthYearResult.value : '',
    dob: dateResult.ok ? dateResult.value : '',
  };

  return {
    ok: Object.keys(errors).length === 0,
    errors,
    sanitized,
  };
}
