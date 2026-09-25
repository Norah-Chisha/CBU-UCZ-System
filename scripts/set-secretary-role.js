const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

const targetUid = process.env.SECRETARY_UID;
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || path.join(process.cwd(), 'serviceAccountKey.json');

if (!targetUid) {
  console.error('Missing SECRETARY_UID. Set it before running this script.');
  console.error('Example: SECRETARY_UID="abc123" node scripts/set-secretary-role.js');
  process.exit(1);
}

if (!fs.existsSync(serviceAccountPath)) {
  console.error(`Service account file not found at: ${serviceAccountPath}`);
  console.error('Create a Firebase service account key JSON and set FIREBASE_SERVICE_ACCOUNT_PATH to its location.');
  process.exit(1);
}

const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

admin
  .auth()
  .setCustomUserClaims(targetUid, { role: 'secretary' })
  .then(() => {
    console.log(`Success: UID ${targetUid} now has role "secretary".`);
    console.log('You can now log in with this account to access the admin dashboard.');
  })
  .catch((error) => {
    console.error('Failed to set the custom claim:', error);
    process.exit(1);
  });
