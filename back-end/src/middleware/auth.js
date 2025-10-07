// middleware/auth.js
import admin from '../config/firebase.js';

export function extractToken(req) {
  if (req.headers.authtoken) return req.headers.authtoken;
  const authz = req.headers.authorization || '';
  const m = authz.match(/^Bearer\s+(.+)$/i);
  return m ? m[1] : null;
}

export async function verifyUser(req, res, next) {
  try {
    const token = extractToken(req);
    if (!token) return res.status(401).json({ error: 'Missing auth token' });

    const decoded = await admin.auth().verifyIdToken(token);
    req.user = { uid: decoded.uid, email: decoded.email || null };
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}