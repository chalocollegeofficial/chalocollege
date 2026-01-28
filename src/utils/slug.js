// src/utils/slug.js

/**
 * Basic, URL-safe slugify.
 * - Lowercase
 * - Removes most punctuation
 * - Replaces spaces with hyphens
 */
export const slugify = (value = '') => {
  const str = String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .toLowerCase()
    .trim();

  const cleaned = str
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

  return cleaned || 'item';
};

// UUID v4-ish matcher (Supabase IDs)
const UUID_REGEX = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

// ---------- UUID <-> Base36 reversible encoding (short unique token) ----------

const isUuidLike = (uuid) => UUID_REGEX.test(String(uuid || ''));

const uuidToHex32 = (uuid) => {
  const hex = String(uuid || '').replace(/-/g, '').toLowerCase();
  if (!/^[0-9a-f]{32}$/.test(hex)) return '';
  return hex;
};

const hex32ToUuid = (hex32) => {
  const h = String(hex32 || '').toLowerCase();
  if (!/^[0-9a-f]{32}$/.test(h)) return '';
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
};

const parseBase36ToBigInt = (str) => {
  const s = String(str || '').toLowerCase().trim();
  if (!/^[0-9a-z]+$/.test(s)) throw new Error('Invalid base36');

  let n = 0n;
  for (const ch of s) {
    const code = ch.charCodeAt(0);
    let v;
    if (code >= 48 && code <= 57) v = BigInt(code - 48); // 0-9
    else if (code >= 97 && code <= 122) v = BigInt(code - 87); // a-z => 10-35
    else throw new Error('Invalid base36 char');
    n = n * 36n + v;
  }
  return n;
};

export const uuidToBase36 = (uuid) => {
  const hex32 = uuidToHex32(uuid);
  if (!hex32) return '';
  const n = BigInt(`0x${hex32}`);
  return n.toString(36); // variable length, usually <= 25 chars
};

export const base36ToUuid = (token) => {
  const t = String(token || '').toLowerCase().trim();
  // keep it strict to avoid false positives
  if (!/^[0-9a-z]{10,30}$/.test(t)) return '';
  try {
    const n = parseBase36ToBigInt(t);
    const hex32 = n.toString(16).padStart(32, '0'); // restore leading zeros
    const uuid = hex32ToUuid(hex32);
    return isUuidLike(uuid) ? uuid : '';
  } catch {
    return '';
  }
};

// ---------- Public helpers used across the app ----------

/**
 * Creates a stable, SEO-friendly college slug.
 * Format: "{name-slug}-{base36(uuid)}"
 * Example: "galgotias-university-k1m9x2..."
 */
export const createCollegeSlug = (college) => {
  const name = college?.college_name || college?.name || '';
  const id = college?.id || '';
  const base = slugify(name);

  if (!id) return base;

  // Prefer short reversible token
  const token = uuidToBase36(id);
  return token ? `${base}-${token}` : `${base}-${id}`;
};

/**
 * Extracts the college UUID from:
 * - old format: "{name}-{uuid}"
 * - new format: "{name}-{base36token}"
 * - raw UUID
 */
export const extractCollegeIdFromSlug = (collegeSlugOrId = '') => {
  const raw = String(collegeSlugOrId || '').trim();
  if (!raw) return '';

  // 1) If it contains an actual UUID anywhere, use it (supports old URLs)
  const match = raw.match(UUID_REGEX);
  if (match) return match[0].toLowerCase();

  // 2) Otherwise, assume last segment after '-' is our base36 token
  const parts = raw.split('-').filter(Boolean);
  const last = parts[parts.length - 1] || '';
  const decoded = base36ToUuid(last);
  if (decoded) return decoded;

  // 3) Fallback: return raw (may be UUID without hyphens or some legacy)
  return raw;
};

/**
 * Creates a stable course slug for a course category inside a college.
 * Since course categories don't have their own IDs, we append the index.
 * Example: "btech-computer-science-ug-3"
 */
export const createCourseSlug = (course, index = 0) => {
  const name = course?.name || '';
  const level = String(course?.level || 'UG').toLowerCase();
  const base = slugify(name);
  const safeIndex = Number.isFinite(Number(index)) ? Number(index) : 0;
  return `${base}-${level}-${safeIndex}`;
};

/**
 * Parses "{course}-{level}-{index}" slugs.
 */
export const parseCourseSlug = (courseSlug = '') => {
  const raw = String(courseSlug || '').trim();
  const m = raw.match(/-(ug|pg|diploma|phd)-(\d+)$/i);
  if (!m) return { level: null, index: null };
  return { level: m[1].toUpperCase(), index: Number(m[2]) };
};
