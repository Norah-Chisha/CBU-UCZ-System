const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

exports.setSecretaryRole = functions.https.onCall(async (data) => {
  const uid = data && data.uid;

  if (!uid) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Please provide the Firebase user uid.'
    );
  }

  await admin.auth().setCustomUserClaims(uid, { role: 'secretary' });

  return {
    success: true,
    message: 'Secretary role assigned.',
  };
});

