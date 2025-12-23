const store = new Map();

export function putOtp(email, otp, ttlSec = 300) {
  const expiresAt = Date.now() + ttlSec * 1000;
  store.set(String(email).toLowerCase(), { otp: String(otp), expiresAt });
}

export function verifyOtp(email, otp) {
  const rec = store.get(String(email).toLowerCase());
  if (!rec) return false;
  if (Date.now() > rec.expiresAt) {
    store.delete(String(email).toLowerCase());
    return false;
  }
  const ok = String(rec.otp) === String(otp);
  if (ok) store.delete(String(email).toLowerCase());
  return ok;
}
