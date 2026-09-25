import {
  onAuthStateChanged,
  signOut,
} from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
} from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js';
import { auth, db } from './firebase.js';

const MEMBERS_PER_PAGE = 25;
let allMembers = [];
let filteredMembers = [];
let currentPage = 1;

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
  console.error('Dashboard error:', error);
  return 'Please try again in a moment.';
}

const ensureAdminAccess = () => new Promise((resolve) => {
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    unsubscribe();

    if (!user) {
      window.location.href = 'login.html';
      resolve(false);
      return;
    }

    if (!user.email) {
      signOut(auth).catch((error) => console.error('Failed to sign out invalid user:', error));
      window.location.href = 'login.html';
      resolve(false);
      return;
    }

    resolve(true);
  });
});

function formatDobDisplay(dobString) {
  if (!dobString) return 'N/A';
  const match = String(dobString).match(/^\d{4}-(\d{2})-(\d{2})$/);
  if (!match) return dobString;

  const [, month, day] = match;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${parseInt(day, 10)} ${months[parseInt(month, 10) - 1]}`;
}

function formatMemberName(member) {
  const firstName = member.firstName || '';
  const lastName = member.lastName || '';
  return `${firstName} ${lastName}`.trim() || 'Unknown member';
}

function createTextCell(label, value) {
  const cell = document.createElement('td');
  cell.setAttribute('data-label', label);
  if (typeof value === 'string' && value.startsWith('http')) {
    const link = document.createElement('a');
    link.href = value;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = value;
    cell.appendChild(link);
    return cell;
  }

  const textNode = document.createTextNode(value || 'N/A');
  cell.appendChild(textNode);
  return cell;
}

function createActionCell(member) {
  const cell = document.createElement('td');
  cell.setAttribute('data-label', 'Actions');

  const editButton = document.createElement('button');
  editButton.type = 'button';
  editButton.className = 'btn btn-sm btn-secondary action-btn';
  editButton.textContent = 'Edit';
  editButton.addEventListener('click', () => openMemberModal(member));

  const deleteButton = document.createElement('button');
  deleteButton.type = 'button';
  deleteButton.className = 'btn btn-sm action-btn danger-btn';
  deleteButton.textContent = 'Remove';
  deleteButton.addEventListener('click', () => deleteMember(member));

  cell.append(editButton, deleteButton);
  return cell;
}

function showErrorState(elementId, message, retryAction) {
  const container = document.getElementById(elementId);
  if (!container) return;

  container.innerHTML = '';
  container.classList.remove('hidden');

  const state = document.createElement('div');
  state.className = 'error-state';

  const title = document.createElement('strong');
  title.textContent = 'Something went wrong';

  const msg = document.createElement('p');
  msg.textContent = message;

  const retryButton = document.createElement('button');
  retryButton.type = 'button';
  retryButton.className = 'btn btn-sm';
  retryButton.textContent = 'Retry';
  retryButton.addEventListener('click', retryAction);

  state.append(title, msg, retryButton);
  container.appendChild(state);
}

function buildBirthdayCards(members, sectionId, type) {
  const container = document.getElementById(sectionId);
  if (!container) return;

  container.innerHTML = '';

  if (!members.length) {
    const empty = document.createElement('div');
    empty.className = 'muted-message';
    empty.textContent = type === 'today' ? 'No birthdays today.' : 'No birthdays tomorrow.';
    container.appendChild(empty);
    return;
  }

  members.forEach((member) => {
    const card = document.createElement('div');
    card.className = 'birthday-badge';

    const title = document.createElement('strong');
    title.textContent = `${type === 'today' ? '🎉 BIRTHDAY TODAY' : '🎂 BIRTHDAY TOMORROW'}: ${formatMemberName(member)}`;

    const meta = document.createElement('div');
    const programme = member.programme || 'N/A';
    const year = member.yearOfStudy || 'N/A';
    const phone = member.phone || 'N/A';
    meta.textContent = `${programme} (${year} Year) • Phone: ${phone}`;

    const action = document.createElement('div');
    action.style.marginTop = '4px';
    action.style.fontStyle = 'italic';
    action.textContent = type === 'today' ? 'Action: Contact member for birthday post.' : 'Action: Contact member and request photo.';

    card.append(title, document.createElement('br'), meta, document.createElement('br'), action);
    container.appendChild(card);
  });
}

async function getAllMembers() {
  const membersRef = collection(db, 'members');
  const q = query(membersRef, orderBy('firstName'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

function escapeCsvCell(value) {
  const stringValue = value == null ? '' : String(value);
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

async function exportCsv() {
  const button = document.getElementById('exportCsvBtn');
  if (button) {
    button.disabled = true;
    button.innerHTML = '<span class="spinner spinner-sm" aria-hidden="true"></span><span>Exporting...</span>';
  }

  try {
    const rows = filteredMembers.length ? filteredMembers : allMembers;
    const header = ['Name', 'Phone', 'Programme', 'Year', 'Residence', 'Birthday'];
    const body = rows.map((member) => [
      formatMemberName(member),
      member.phone || '',
      member.programme || '',
      member.yearOfStudy || '',
      member.residence || '',
      member.dob || '',
    ]);

    const csvContent = [header, ...body].map((row) => row.map(escapeCsvCell).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'cbu_ucz_members.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showToast('CSV export downloaded.', 'success');
  } catch (error) {
    const friendly = mapErrorToUserMessage(error);
    showToast(friendly, 'error');
  } finally {
    if (button) {
      button.disabled = false;
      button.innerHTML = 'Export CSV';
    }
  }
}

function exportPdf() {
  const button = document.getElementById('exportPdfBtn');
  if (button) {
    button.disabled = true;
    button.innerHTML = '<span class="spinner spinner-sm" aria-hidden="true"></span><span>Exporting...</span>';
  }

  try {
    if (!window.jspdf || !window.jspdf.jsPDF) {
      throw new Error('PDF library not loaded');
    }

    const rows = filteredMembers.length ? filteredMembers : allMembers;
    const data = rows.map((member) => [
      formatMemberName(member),
      member.phone || 'N/A',
      member.programme || 'N/A',
      member.yearOfStudy || 'N/A',
      member.residence || 'N/A',
      formatDobDisplay(member.dob),
    ]);

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.setTextColor(27, 54, 93);
    doc.text('CBU UCZ FELLOWSHIP', 14, 15);
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text('Member Records — 2026/2027 Academic Year', 14, 22);
    doc.autoTable({
      head: [['Name', 'Phone', 'Programme', 'Year', 'Residence', 'Birthday']],
      body: data,
      startY: 28,
      headStyles: { fillColor: [27, 54, 93] },
      styles: { fontSize: 8 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });
    doc.save('cbu_ucz_members_2026_2027.pdf');
    showToast('PDF export downloaded.', 'success');
  } catch (error) {
    const friendly = mapErrorToUserMessage(error);
    showToast(friendly, 'error');
  } finally {
    if (button) {
      button.disabled = false;
      button.innerHTML = 'Export PDF';
    }
  }
}

async function loadDashboardMetrics() {
  const metricsLoading = document.getElementById('metricsLoading');
  const metricsState = document.getElementById('metricsState');

  if (metricsLoading) metricsLoading.classList.remove('hidden');
  if (metricsState) metricsState.classList.add('hidden');

  try {
    const members = await getAllMembers();
    allMembers = members;

    const totalMembers = members.length;
    const today = new Date();
    const birthdayToday = members.filter((member) => {
      const [year, month, day] = String(member.dob || '').split('-');
      if (!year || !month || !day) return false;
      return Number(month) === today.getMonth() + 1 && Number(day) === today.getDate();
    });

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const birthdayTomorrow = members.filter((member) => {
      const [year, month, day] = String(member.dob || '').split('-');
      if (!year || !month || !day) return false;
      return Number(month) === tomorrow.getMonth() + 1 && Number(day) === tomorrow.getDate();
    });

    document.getElementById('totalMembers').textContent = String(totalMembers);
    document.getElementById('todayCount').textContent = String(birthdayToday.length);
    document.getElementById('tomorrowCount').textContent = String(birthdayTomorrow.length);

    buildBirthdayCards(birthdayToday, 'birthdayTodaySection', 'today');
    buildBirthdayCards(birthdayTomorrow, 'birthdayTomorrowSection', 'tomorrow');

    const noBirthdaysMsg = document.getElementById('noBirthdaysMsg');
    if (noBirthdaysMsg) {
      noBirthdaysMsg.style.display = birthdayToday.length === 0 && birthdayTomorrow.length === 0 ? 'block' : 'none';
    }
  } catch (error) {
    const friendly = mapErrorToUserMessage(error);
    showErrorState('metricsState', friendly, loadDashboardMetrics);
  } finally {
    if (metricsLoading) metricsLoading.classList.add('hidden');
  }
}

function renderMemberTable() {
  const searchInput = document.getElementById('searchInput');
  const filterYear = document.getElementById('filterYear');
  const search = searchInput ? searchInput.value.trim().toLowerCase() : '';
  const year = filterYear ? filterYear.value : 'All';

  filteredMembers = allMembers.filter((member) => {
    const matchesYear = year === 'All' || String(member.yearOfStudy) === String(year);
    const text = `${member.firstName || ''} ${member.lastName || ''} ${member.phone || ''} ${member.residence || ''}`.toLowerCase();
    const matchesSearch = !search || text.includes(search);
    return matchesYear && matchesSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filteredMembers.length / MEMBERS_PER_PAGE));
  if (currentPage > totalPages) currentPage = totalPages;

  const start = (currentPage - 1) * MEMBERS_PER_PAGE;
  const pageMembers = filteredMembers.slice(start, start + MEMBERS_PER_PAGE);

  const tbody = document.getElementById('membersTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (!pageMembers.length) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 7;
    cell.style.textAlign = 'center';
    cell.textContent = 'No members found.';
    row.appendChild(cell);
    tbody.appendChild(row);
    return;
  }

  pageMembers.forEach((member) => {
    const row = document.createElement('tr');
    row.appendChild(createTextCell('Name', formatMemberName(member)));
    row.appendChild(createTextCell('Phone', member.phone || 'N/A'));
    row.appendChild(createTextCell('Programme', member.programme || 'N/A'));
    row.appendChild(createTextCell('Year', member.yearOfStudy || 'N/A'));
    row.appendChild(createTextCell('Residence', member.residence || 'N/A'));
    row.appendChild(createTextCell('Birthday', formatDobDisplay(member.dob)));
    row.appendChild(createActionCell(member));
    tbody.appendChild(row);
  });

  const controls = document.getElementById('paginationControls');
  if (controls) {
    controls.innerHTML = '';

    const prevBtn = document.createElement('button');
    prevBtn.type = 'button';
    prevBtn.textContent = 'Previous';
    prevBtn.disabled = currentPage === 1;
    prevBtn.addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage -= 1;
        renderMemberTable();
      }
    });

    const pageInfo = document.createElement('span');
    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;

    const nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.textContent = 'Next';
    nextBtn.disabled = currentPage >= totalPages;
    nextBtn.addEventListener('click', () => {
      if (currentPage < totalPages) {
        currentPage += 1;
        renderMemberTable();
      }
    });

    controls.append(prevBtn, pageInfo, nextBtn);
  }
}

async function loadMemberRecords() {
  const tableLoading = document.getElementById('tableLoading');
  const tableState = document.getElementById('tableState');
  if (tableLoading) tableLoading.classList.remove('hidden');
  if (tableState) tableState.classList.add('hidden');

  try {
    if (!allMembers.length) {
      const members = await getAllMembers();
      allMembers = members;
    }

    renderMemberTable();
  } catch (error) {
    const friendly = mapErrorToUserMessage(error);
    showErrorState('tableState', friendly, loadMemberRecords);
  } finally {
    if (tableLoading) tableLoading.classList.add('hidden');
  }
}

function openMemberModal(member = null) {
  const modal = document.getElementById('memberModal');
  const title = document.getElementById('memberModalTitle');
  const form = document.getElementById('memberForm');

  if (!modal || !form) return;

  form.reset();
  document.getElementById('memberId').value = member ? member.id : '';
  document.getElementById('memberFirstName').value = member?.firstName || '';
  document.getElementById('memberLastName').value = member?.lastName || '';
  document.getElementById('memberPhone').value = member?.phone || '';
  document.getElementById('memberDob').value = member?.dob || '';
  document.getElementById('memberProgramme').value = member?.programme || '';
  document.getElementById('memberYearOfStudy').value = member?.yearOfStudy || '';
  document.getElementById('memberResidence').value = member?.residence || '';

  title.textContent = member ? 'Edit Member' : 'Add Member';
  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';

  requestAnimationFrame(() => {
    modal.scrollIntoView({ behavior: 'smooth', block: 'start' });
    const firstField = form.querySelector('input, select, button');
    firstField?.focus();
  });
}

function closeMemberModal() {
  const modal = document.getElementById('memberModal');
  const form = document.getElementById('memberForm');

  if (!modal || !form) return;

  form.reset();
  modal.classList.add('hidden');
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

async function saveMember(event) {
  event.preventDefault();

  const memberId = document.getElementById('memberId').value;
  const firstName = document.getElementById('memberFirstName').value.trim();
  const lastName = document.getElementById('memberLastName').value.trim();
  const phone = document.getElementById('memberPhone').value.trim();
  const dob = document.getElementById('memberDob').value;
  const programme = document.getElementById('memberProgramme').value.trim();
  const yearOfStudy = document.getElementById('memberYearOfStudy').value;
  const residence = document.getElementById('memberResidence').value.trim();

  if (!firstName || !lastName || !phone || !dob || !programme || !yearOfStudy || !residence) {
    showToast('Please complete all member details.', 'error');
    return;
  }

  const normalizedPhone = phone.replace(/\s+/g, '');

  try {
    const duplicate = allMembers.find((member) => {
      if (memberId && member.id === memberId) return false;
      return (member.phone || '').replace(/\s+/g, '') === normalizedPhone;
    });

    if (duplicate) {
      showToast('A member with this phone number already exists.', 'error');
      return;
    }

    const memberData = {
      firstName,
      lastName,
      phone: normalizedPhone,
      dob,
      programme,
      yearOfStudy,
      residence,
      status: 'active',
    };

    if (memberId) {
      const memberRef = doc(db, 'members', memberId);
      await updateDoc(memberRef, memberData);
      showToast('Member updated successfully.', 'success');
    } else {
      await addDoc(collection(db, 'members'), {
        ...memberData,
        createdAt: new Date(),
      });
      showToast('Member added successfully.', 'success');
    }

    closeMemberModal();
    allMembers = [];
    await loadDashboardMetrics();
    await loadMemberRecords();
  } catch (error) {
    console.error('Save member failed:', error);
    showToast('Unable to save member right now.', 'error');
  }
}

async function deleteMember(member) {
  if (!member?.id) return;

  const confirmed = window.confirm(`Remove ${formatMemberName(member)} from the member list?`);
  if (!confirmed) return;

  try {
    await deleteDoc(doc(db, 'members', member.id));
    allMembers = [];
    await loadDashboardMetrics();
    await loadMemberRecords();
    showToast('Member removed successfully.', 'success');
  } catch (error) {
    console.error('Delete member failed:', error);
    showToast('Unable to remove member right now.', 'error');
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const searchInput = document.getElementById('searchInput');
  const filterYear = document.getElementById('filterYear');

  const isAuthorized = await ensureAdminAccess();
  if (!isAuthorized) return;

  await Promise.all([
    loadDashboardMetrics(),
    loadMemberRecords(),
  ]);

  searchInput?.addEventListener('input', () => {
    currentPage = 1;
    renderMemberTable();
  });

  filterYear?.addEventListener('change', () => {
    currentPage = 1;
    renderMemberTable();
  });

  const logoutButton = document.getElementById('logoutBtn');
  logoutButton?.addEventListener('click', async () => {
    try {
      await signOut(auth);
      window.location.href = 'login.html';
    } catch (error) {
      console.error('Logout failed:', error);
      showToast('Unable to log out right now. Please try again.', 'error');
    }
  });

  document.getElementById('addMemberBtn')?.addEventListener('click', () => openMemberModal());
  document.getElementById('closeMemberModalBtn')?.addEventListener('click', closeMemberModal);
  document.getElementById('cancelMemberBtn')?.addEventListener('click', closeMemberModal);
  document.getElementById('memberForm')?.addEventListener('submit', saveMember);
  document.getElementById('memberModal')?.addEventListener('click', (event) => {
    if (event.target.id === 'memberModal') closeMemberModal();
  });

  document.getElementById('exportCsvBtn')?.addEventListener('click', exportCsv);
  document.getElementById('exportPdfBtn')?.addEventListener('click', exportPdf);
});