document.addEventListener('DOMContentLoaded', () => {
  loadDashboardMetrics();
  loadMemberRecords();

  document.getElementById('searchInput')?.addEventListener('input', loadMemberRecords);
  document.getElementById('filterYear')?.addEventListener('change', loadMemberRecords);
});

function formatDobDisplay(dobString) {
  if (!dobString) return 'N/A';
  const [, m, d] = dobString.split('-');
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${parseInt(d, 10)} ${months[parseInt(m, 10) - 1]}`;
}

async function loadDashboardMetrics() {
  try {
    const res = await fetch('/api/dashboard');
    const data = await res.json();

    if (document.getElementById('totalMembers')) {
      document.getElementById('totalMembers').textContent = data.totalMembers;
    }
    if (document.getElementById('todayCount')) {
      document.getElementById('todayCount').textContent = data.birthdayToday.length;
    }
    if (document.getElementById('tomorrowCount')) {
      document.getElementById('tomorrowCount').textContent = data.birthdayTomorrow.length;
    }

    const todaySec = document.getElementById('birthdayTodaySection');
    const tomorrowSec = document.getElementById('birthdayTomorrowSection');
    const noMsg = document.getElementById('noBirthdaysMsg');

    if (todaySec && tomorrowSec) {
      todaySec.innerHTML = '';
      tomorrowSec.innerHTML = '';

      if (data.birthdayToday.length === 0 && data.birthdayTomorrow.length === 0) {
        if (noMsg) noMsg.style.display = 'block';
      } else {
        if (noMsg) noMsg.style.display = 'none';

        data.birthdayToday.forEach(m => {
          todaySec.innerHTML += `
            <div class="birthday-badge">
              <strong>🎉 BIRTHDAY TODAY: ${m.firstName} ${m.lastName}</strong><br>
              ${m.programme} (${m.yearOfStudy} Year) • Phone: <a href="tel:${m.phone}">${m.phone}</a><br>
              <em>Action: Contact member for birthday post.</em>
            </div>`;
        });

        data.birthdayTomorrow.forEach(m => {
          tomorrowSec.innerHTML += `
            <div class="birthday-badge" style="background: #e0f2fe; border-left-color: #0284c7;">
              <strong style="color: #0369a1;">🎂 BIRTHDAY TOMORROW: ${m.firstName} ${m.lastName}</strong><br>
              ${m.programme} (${m.yearOfStudy} Year) • Phone: <a href="tel:${m.phone}">${m.phone}</a><br>
              <em>Action: Contact member and request photo.</em>
            </div>`;
        });
      }
    }
  } catch (err) {
    console.error('Error loading dashboard stats:', err);
  }
}

async function loadMemberRecords() {
  const searchInput = document.getElementById('searchInput');
  const filterYear = document.getElementById('filterYear');

  const search = searchInput ? searchInput.value : '';
  const year = filterYear ? filterYear.value : 'All';

  const query = new URLSearchParams({ search, year }).toString();

  try {
    const res = await fetch(`/api/members?${query}`);
    const members = await res.json();

    const tbody = document.getElementById('membersTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (members.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No members found.</td></tr>';
      return;
    }

    members.forEach(m => {
      tbody.innerHTML += `
        <tr>
          <td><strong>${m.firstName} ${m.lastName}</strong></td>
          <td><a href="tel:${m.phone}">${m.phone}</a></td>
          <td>${m.programme}</td>
          <td>${m.yearOfStudy}</td>
          <td>${m.residence}</td>
          <td>${formatDobDisplay(m.dob)}</td>
        </tr>
      `;
    });
  } catch (err) {
    console.error('Error fetching members:', err);
  }
}

document.getElementById('exportPdfBtn')?.addEventListener('click', () => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // 1. Add Header Title & Academic Year
  doc.setFontSize(16);
  doc.setTextColor(27, 54, 93); // UCZ Deep Blue
  doc.text("CBU UCZ FELLOWSHIP", 14, 15);
  
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text("Member Records — 2026/2027 Academic Year", 14, 22);

  // 2. Generate Table from DOM
  doc.autoTable({
    html: 'table',
    startY: 28,
    headStyles: { fillColor: [27, 54, 93] },
    styles: { fontSize: 8 },
    alternateRowStyles: { fillColor: [248, 250, 252] }
  });

  // 3. Save PDF
  doc.save("cbu_ucz_members_2026_2027.pdf");
});