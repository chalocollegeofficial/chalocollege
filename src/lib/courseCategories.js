/**
 * Course category mapping helpers.
 *
 * Problem fixed:
 * - Your Admin panel stores courses in the structured `courses` column
 *   (array of objects with { name, level, brochure_url, subcategories }).
 * - Home page category cards were only reading `courses_offered`, so newly
 *   added colleges were not getting mapped correctly.
 *
 * This file now:
 * - Reads BOTH `courses_offered` (legacy) and `courses` (structured)
 * - Uses stronger normalization so "B Tech" / "B.Tech" / "B.Tech." all match
 * - Avoids common false-positives for "Computer Application" (e.g. B.Tech CSE)
 */

export const COURSE_CATEGORIES = [
  {
    key: 'engineering-technology',
    label: 'Engineering & Technology',
    icon: 'cpu',
    keywords: [
      'btech',
      'b tech',
      'b.tech',
      'mtech',
      'm tech',
      'm.tech',
      'b e',
      'b.e',
      'b.e.',
      'beng',
      'engineering',
      'polytechnic',
    ],
  },
  {
    key: 'business-commerce',
    label: 'Business & Commerce',
    icon: 'briefcase',
    keywords: [
      'mba',
      'bba',
      'pgdm',
      'pgdbm',
      'bcom',
      'b com',
      'b.com',
      'mcom',
      'm com',
      'm.com',
      'commerce',
      'management',
      'business administration',
    ],
  },
  {
    key: 'law',
    label: 'Law',
    icon: 'scale',
    keywords: ['llb', 'll.m', 'llm', 'law', 'ba llb', 'bba llb', 'llb hons'],
  },
  {
    key: 'pharmacy',
    label: 'Pharmacy',
    icon: 'flask',
    keywords: ['pharmacy', 'bpharm', 'b pharm', 'b.pharm', 'mpharm', 'm pharm', 'm.pharm', 'dpharm', 'd pharm', 'd.pharm'],
  },
  {
    key: 'computer-application',
    label: 'Computer Application',
    icon: 'code',
    keywords: [
      'bca',
      'mca',
      'computer application',
      'bsc it',
      'b.sc it',
      'msc it',
      'm.sc it',
      'bsc computer science',
      'b.sc computer science',
      'msc computer science',
      'm.sc computer science',
      // keep as a phrase (not "it"), and we will ignore it for engineering courses
      'information technology',
    ],
  },
  {
    key: 'design',
    label: 'Design Courses',
    icon: 'paintbrush',
    keywords: ['design', 'bdes', 'b des', 'b.des', 'mdes', 'm des', 'm.des', 'fashion', 'interior', 'ui ux', 'ux', 'graphic'],
  },
];

export const getCourseCategoryByKey = (key) =>
  COURSE_CATEGORIES.find((c) => c.key === key) || null;

// -----------------------------
// Normalization / parsing utils
// -----------------------------

const normalizeLoose = (s) => {
  const text = String(s || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return text;
};

const compact = (s) => normalizeLoose(s).replace(/\s+/g, '');

const safeJsonParse = (value) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!(trimmed.startsWith('[') || trimmed.startsWith('{'))) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    return null;
  }
};

const safeToArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;

  if (typeof value === 'string') {
    const parsed = safeJsonParse(value);
    if (Array.isArray(parsed)) return parsed;

    const trimmed = value.trim();
    if (!trimmed) return [];

    if (trimmed.includes(',')) {
      return trimmed
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }
    return [trimmed];
  }

  return [];
};

const normalizeCourseItemToName = (item) => {
  if (!item) return '';
  if (typeof item === 'string') return item;

  if (typeof item === 'object') {
    return item.name || item.course || item.course_name || item.title || '';
  }

  return '';
};

const getStructuredCourses = (college) => {
  if (!college) return [];
  const raw = college.courses;
  if (!raw) return [];

  // Supabase json/jsonb columns are usually returned as arrays/objects.
  if (Array.isArray(raw)) return raw;

  // Sometimes it may be stored as a JSON string.
  const parsed = safeJsonParse(raw);
  return Array.isArray(parsed) ? parsed : [];
};

/**
 * ✅ Unified: get course names from BOTH shapes.
 * - courses_offered: legacy simple list
 * - courses: structured list from Admin panel
 */
export const getCollegeCourseNames = (college) => {
  if (!college) return [];

  const names = [];

  // 1) Legacy/simple field
  const offeredRaw = safeToArray(college.courses_offered);
  for (const item of offeredRaw) {
    const name = String(normalizeCourseItemToName(item) || '').trim();
    if (name) names.push(name);
  }

  // 2) Structured field (Admin panel)
  const structured = getStructuredCourses(college);
  for (const c of structured) {
    const name = String(c?.name || '').trim();
    if (name) names.push(name);
  }

  // De-duplicate (preserve order)
  const seen = new Set();
  const unique = [];
  for (const n of names) {
    const k = normalizeLoose(n);
    if (!k) continue;
    if (seen.has(k)) continue;
    seen.add(k);
    unique.push(n);
  }

  return unique;
};

// -----------------------------
// Matching logic
// -----------------------------

const keywordIncluded = (text, keyword) => {
  const t = normalizeLoose(text);
  const k = normalizeLoose(keyword);
  if (!t || !k) return false;

  // Normal include
  if (t.includes(k)) return true;

  // Also match punctuation/spacing variations (e.g. "b.tech" vs "b tech")
  const tc = compact(text);
  const kc = compact(keyword);
  return tc && kc ? tc.includes(kc) : false;
};

const isEngineeringCourse = (courseName) => {
  // Use only strong engineering indicators here
  const t = normalizeLoose(courseName);
  if (!t) return false;
  return (
    t.includes('btech') ||
    t.includes('b tech') ||
    t.includes('mtech') ||
    t.includes('m tech') ||
    t.includes('b e') ||
    t.includes('engineering') ||
    t.includes('polytechnic')
  );
};

const courseMatchesCategory = (courseName, categoryKey) => {
  const category = getCourseCategoryByKey(categoryKey);
  if (!category) return false;
  const course = String(courseName || '').trim();
  if (!course) return false;

  // Special rule: avoid mapping Engineering courses into "Computer Application".
  if (categoryKey === 'computer-application' && isEngineeringCourse(course)) {
    // Example: "B.Tech Computer Science & Engineering" should stay in Engineering.
    // Allow only BCA/MCA etc which are not engineering degrees.
    const allow = ['bca', 'mca', 'computer application'].some((kw) => keywordIncluded(course, kw));
    if (!allow) return false;
  }

  return category.keywords.some((kw) => keywordIncluded(course, kw));
};

export const collegeMatchesCourseCategory = (college, categoryKey) => {
  const courseNames = getCollegeCourseNames(college);
  if (courseNames.length === 0) return false;
  return courseNames.some((course) => courseMatchesCategory(course, categoryKey));
};

export const getMatchingCoursesForCategory = (college, categoryKey) => {
  const courseNames = getCollegeCourseNames(college);
  return courseNames.filter((course) => courseMatchesCategory(course, categoryKey));
};
