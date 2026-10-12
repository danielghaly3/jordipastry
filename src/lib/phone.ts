// Egyptian mobile numbers: 010 / 011 / 012 / 015 followed by 8 digits.
const ARABIC_DIGITS = /[٠-٩۰-۹]/g;

/** Returns +201XXXXXXXXX or null. Accepts 01..., +20 1..., 0020..., 20..., spaces, dashes and Arabic-Indic digits. */
export function normalizeEgyptPhone(input: string): string | null {
  const ascii = input.replace(ARABIC_DIGITS, (d) => String(d.charCodeAt(0) & 0xf));
  let digits = ascii.replace(/[^\d]/g, "");
  if (digits.startsWith("0020")) digits = digits.slice(4);
  else if (digits.startsWith("20") && digits.length === 12) digits = digits.slice(2);
  if (digits.length === 10 && digits.startsWith("1")) digits = "0" + digits;
  return /^01[0125]\d{8}$/.test(digits) ? `+2${digits}` : null;
}

/** Any international number for WhatsApp (falls back to Egyptian normalization). Returns +<digits> or null. */
export function normalizeWhatsApp(input: string): string | null {
  const eg = normalizeEgyptPhone(input);
  if (eg) return eg;
  const ascii = input.replace(ARABIC_DIGITS, (d) => String(d.charCodeAt(0) & 0xf)).trim();
  const digits = ascii.replace(/[^\d]/g, "").replace(/^00/, "");
  return ascii.startsWith("+") || ascii.startsWith("00") ? (/^\d{8,15}$/.test(digits) ? `+${digits}` : null) : null;
}

/** wa.me link (digits only, international format) with a prefilled message. */
export function whatsappLink(phone: string, message?: string) {
  const digits = (normalizeWhatsApp(phone) ?? phone).replace(/[^\d]/g, "");
  return `https://wa.me/${digits}${message ? `?text=${encodeURIComponent(message)}` : ""}`;
}

/** +20 10 1234 5678 */
export function prettyPhone(e164: string) {
  const m = e164.match(/^\+20(\d{2})(\d{4})(\d{4})$/);
  return m ? `+20 ${m[1]} ${m[2]} ${m[3]}` : e164;
}

export function maskPhone(e164: string) {
  return e164.length > 6 ? `${e164.slice(0, 5)}•••••${e164.slice(-3)}` : e164;
}
