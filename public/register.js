document.getElementById('registrationForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const statusMsg = document.getElementById('statusMessage');
  statusMsg.style.color = 'var(--primary)';
  statusMsg.textContent = 'Submitting registration...';

  // Format Date of Birth
  const month = document.getElementById('dobMonth').value;
  const day = document.getElementById('dobDay').value.padStart(2, '0');
  const yearInput = document.getElementById('dobYear').value.trim();
  
  // Use 2000 as a placeholder year if omitted
  const year = yearInput || '2000';
  const dob = `${year}-${month}-${day}`;

  const formData = {
    firstName: document.getElementById('firstName').value.trim(),
    lastName: document.getElementById('lastName').value.trim(),
    phone: document.getElementById('phone').value.trim(),
    dob: dob,
    programme: document.getElementById('programme').value.trim(),
    yearOfStudy: document.getElementById('yearOfStudy').value,
    residence: document.getElementById('residence').value.trim()
  };

  try {
    const res = await fetch('/api/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    const data = await res.json();

    if (res.ok) {
      statusMsg.style.color = '#15803d'; // Success Green
      statusMsg.textContent = 'Registration submitted successfully! Thank you.';
      document.getElementById('registrationForm').reset();
    } else {
      statusMsg.style.color = '#b91c1c'; // Error Red
      statusMsg.textContent = data.error || 'Submission failed. Please check your inputs.';
    }
  } catch (err) {
    statusMsg.style.color = '#b91c1c';
    statusMsg.textContent = 'Unable to connect to the server. Please try again later.';
  }
});