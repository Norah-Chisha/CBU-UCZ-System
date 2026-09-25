import test from 'node:test';
import assert from 'node:assert/strict';

import {
  normalizePhoneNumber,
  validateName,
  validateProgramme,
  validateResidence,
  validateBirthYear,
  validateYearOfStudy,
  validateDateOfBirth,
  validateMemberForm,
} from '../public/js/registerValidation.mjs';

test('normalizePhoneNumber accepts local Zambian numbers and strips separators', () => {
  assert.equal(normalizePhoneNumber('0971234567'), '+260971234567');
  assert.equal(normalizePhoneNumber(' +260 971 234 567 '), '+260971234567');
  assert.equal(normalizePhoneNumber(' +260-971-234-567 '), '+260971234567');
});

test('validateName rejects numbers and whitespace-only names', () => {
  assert.equal(validateName('Mwansa-Banda').ok, true);
  assert.equal(validateName("O'Brien").ok, true);
  assert.equal(validateName('M1wansa').ok, false);
  assert.equal(validateName('   ').ok, false);
});

test('validateProgramme and validateResidence enforce size limits', () => {
  assert.equal(validateProgramme('BSc Computer Science').ok, true);
  assert.equal(validateProgramme('BSc 2 Computer Science').ok, false);
  assert.equal(validateProgramme('A').ok, false);
  assert.equal(validateResidence('Frazer Crescent #28').ok, true);
  assert.equal(validateResidence('  ').ok, false);
});

test('validateBirthYear and validateYearOfStudy reject invalid ranges', () => {
  assert.equal(validateBirthYear('1985').ok, false);
  assert.equal(validateBirthYear('2020').ok, false);
  assert.equal(validateBirthYear('2016').ok, true);
  assert.equal(validateYearOfStudy('3').ok, true);
  assert.equal(validateYearOfStudy('6').ok, false);
});

test('validateDateOfBirth respects month/day validity for leap years', () => {
  assert.equal(validateDateOfBirth('02', '29', '2016').ok, true);
  assert.equal(validateDateOfBirth('02', '29', '2015').ok, false);
  assert.equal(validateDateOfBirth('02', '30', '2016').ok, false);
});

test('validateMemberForm reports every invalid field together', () => {
  const result = validateMemberForm({
    firstName: 'J3hn',
    lastName: 'Doe',
    phone: '1234567',
    dobMonth: '02',
    dobDay: '29',
    dobYear: '2020',
    programme: '  ',
    yearOfStudy: '6',
    residence: '  ',
  });

  assert.equal(result.ok, false);
  assert.equal(result.errors.firstName, 'Enter a valid name (letters only, max 50 characters).');
  assert.equal(result.errors.phone, 'Enter a valid Zambian number, e.g. +260971234567.');
  assert.equal(result.errors.dobYear, 'Enter a birth year between 1990 and 2016.');
  assert.equal(result.errors.programme, 'Enter a valid programme (letters only, 2-100 characters).');
  assert.equal(result.errors.yearOfStudy, 'Select a valid year of study (1-5).');
  assert.equal(result.errors.residence, 'Enter a valid residence (2-100 characters).');
});
