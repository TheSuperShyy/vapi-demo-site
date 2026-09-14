// GET /api/auth -> is a dashboard password in force, and does the caller have it?
//
//   no DASHBOARD_PASSWORD set        -> 200 { required: false }
//   set, bearer matches              -> 200 { required: true }
//   set, missing or wrong bearer     -> 401
//
// Lets the login screen verify a password without a Vapi round-trip, and tells the
// page whether to show "Sign out". Nothing else is returned.

import { requireAuth } from './_vapi.js';

export default function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' });
  res.setHeader('Cache-Control', 'no-store');
  if (!process.env.DASHBOARD_PASSWORD) return res.status(200).json({ required: false });
  if (!requireAuth(req, res)) return;
  res.status(200).json({ required: true });
}
