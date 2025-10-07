// config/firebase.js
import admin from 'firebase-admin';
import fs from 'fs';

const credentials = JSON.parse(fs.readFileSync('./credentials.json'));

admin.initializeApp({
  credential: admin.credential.cert(credentials),
});

export default admin;
