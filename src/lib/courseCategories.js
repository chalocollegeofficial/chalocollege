/**
 * Course category mapping helpers.
 *
 * This file normalizes and maps course names from all supported shapes:
 * - `courses_offered` (legacy)
 * - `courses` (structured)
 * - `courses[].subcategories` (actual program names)
 *
 * It also uses safer matching to avoid false positives from substring overlap.
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
      'be',
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
      'business analytics',
      'international business',
      'hotel management',
      'marketing',
      'finance',
    ],
  },
  {
    key: 'law',
    label: 'Law',
    icon: 'scale',
    keywords: [
      'llb',
      'll b',
      'll.m',
      'llm',
      'll m',
      'law',
      'ba llb',
      'ba ll b',
      'bba llb',
      'bba ll b',
      'llb hons',
      'll b hons',
      'bachelor of laws',
      'bcom llb',
      'b com llb',
    ],
  },
  {
    key: 'pharmacy',
    label: 'Pharmacy',
    icon: 'flask',
    keywords: [
      'pharmacy',
      'pharmaceutics',
      'bpharm',
      'b pharm',
      'b pharma',
      'b.pharm',
      'mpharm',
      'm pharm',
      'm pharma',
      'm.pharm',
      'dpharm',
      'd pharm',
      'd pharma',
      'd.pharm',
      'pharm d',
      'pharmd',
    ],
  },
  {
    key: 'computer-application',
    label: 'Computer Application',
    icon: 'code',
    keywords: [
      'bca',
      'mca',
      'computer application',
      'computer applications',
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
    keywords: [
      'bdes',
      'b des',
      'b.des',
      'mdes',
      'm des',
      'm.des',
      'fashion',
      'interior',
      'ui ux',
      'ux ui',
      'graphic',
      'animation',
      'product design',
      'communication design',
      'school of design',
      'department of design',
      'design course',
      'design courses',
    ],
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

const escapeRegExp = (s) =>
  String(s || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

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

const getCollegeCourseEntries = (college) => {
  if (!college) return [];

  const entries = [];

  const pushEntry = (name, options = {}) => {
    const cleanName = String(name || '').trim();
    if (!cleanName) return;

    entries.push({
      name: cleanName,
      parentName: String(options.parentName || '').trim(),
      source: options.source || 'legacy',
    });
  };

  // Legacy/simple field
  const offeredRaw = safeToArray(college.courses_offered);
  for (const item of offeredRaw) {
    pushEntry(normalizeCourseItemToName(item), { source: 'courses_offered' });
  }

  // Structured field (Admin panel)
  const structured = getStructuredCourses(college);
  for (const c of structured) {
    const parentName = String(c?.name || '').trim();
    pushEntry(parentName, { source: 'courses' });

    const subcategories = safeToArray(c?.subcategories);
    for (const sub of subcategories) {
      pushEntry(normalizeCourseItemToName(sub), {
        source: 'subcategories',
        parentName,
      });
    }
  }

  // De-duplicate by name + parent + source
  const seen = new Set();
  const uniqueEntries = [];
  for (const entry of entries) {
    const k = `${normalizeLoose(entry.name)}|${normalizeLoose(entry.parentName)}|${entry.source}`;
    if (!k) continue;
    if (seen.has(k)) continue;
    seen.add(k);
    uniqueEntries.push(entry);
  }

  return uniqueEntries;
};

/**
 * Unified list of course names for one college.
 */
export const getCollegeCourseNames = (college) => {
  const entries = getCollegeCourseEntries(college);

  const seen = new Set();
  const uniqueNames = [];
  for (const entry of entries) {
    const k = normalizeLoose(entry.name);
    if (!k || seen.has(k)) continue;
    seen.add(k);
    uniqueNames.push(entry.name);
  }

  return uniqueNames;
};

// -----------------------------
// Matching logic
// -----------------------------

const keywordIncluded = (text, keyword) => {
  const t = normalizeLoose(text);
  const k = normalizeLoose(keyword);
  if (!t || !k) return false;

  // Boundary-safe phrase match.
  const re = new RegExp(`(?:^| )${escapeRegExp(k)}(?: |$)`);
  return re.test(t);
};

const isEngineeringCourse = (courseName) => {
  if (!courseName) return false;
  return ['btech', 'b tech', 'mtech', 'm tech', 'be', 'b e', 'engineering', 'polytechnic']
    .some((kw) => keywordIncluded(courseName, kw));
};

const isBusinessOrManagementCourse = (courseName) => {
  if (!courseName) return false;
  return ['mba', 'management', 'business', 'pgdm', 'commerce', 'bba', 'bcom']
    .some((kw) => keywordIncluded(courseName, kw));
};

const isStrongComputerApplicationCourse = (courseName) => {
  if (!courseName) return false;
  return [
    'bca',
    'mca',
    'computer application',
    'computer applications',
    'bsc it',
    'b.sc it',
    'msc it',
    'm.sc it',
    'computer science',
  ].some((kw) => keywordIncluded(courseName, kw));
};

const isStrongDesignCourse = (courseName) => {
  if (!courseName) return false;
  return [
    'bdes',
    'b des',
    'mdes',
    'm des',
    'fashion',
    'interior',
    'ui ux',
    'ux ui',
    'graphic',
    'animation',
    'product design',
    'communication design',
    'school of design',
    'department of design',
    'design course',
    'design courses',
  ].some((kw) => keywordIncluded(courseName, kw));
};

const toCourseEntry = (courseOrEntry) => {
  if (typeof courseOrEntry === 'string') {
    return {
      name: courseOrEntry,
      parentName: '',
      source: 'legacy',
    };
  }

  if (courseOrEntry && typeof courseOrEntry === 'object') {
    return {
      name: courseOrEntry.name || '',
      parentName: courseOrEntry.parentName || '',
      source: courseOrEntry.source || 'legacy',
    };
  }

  return { name: '', parentName: '', source: 'legacy' };
};

const courseMatchesCategory = (courseOrEntry, categoryKey) => {
  const category = getCourseCategoryByKey(categoryKey);
  if (!category) return false;

  const entry = toCourseEntry(courseOrEntry);
  const course = String(entry.name || '').trim();
  if (!course) return false;

  // Avoid mapping Engineering courses into "Computer Application".
  if (categoryKey === 'computer-application' && isEngineeringCourse(course)) {
    const allow = ['bca', 'mca', 'computer application', 'computer applications']
      .some((kw) => keywordIncluded(course, kw));
    if (!allow) return false;
  }

  // Subcategory inside Engineering parent should stay Engineering unless it is an explicit CA program.
  if (
    categoryKey === 'computer-application' &&
    entry.source === 'subcategories' &&
    isEngineeringCourse(entry.parentName)
  ) {
    const allow = ['bca', 'mca', 'computer application', 'computer applications']
      .some((kw) => keywordIncluded(course, kw));
    if (!allow) return false;
  }

  // Management specializations like "MBA in Information Technology" should stay in Business.
  if (
    categoryKey === 'computer-application' &&
    isBusinessOrManagementCourse(course) &&
    !isStrongComputerApplicationCourse(course)
  ) {
    return false;
  }

  // Avoid VLSI/CAD engineering terms inflating "Design Courses" card.
  if (
    categoryKey === 'design' &&
    entry.source === 'subcategories' &&
    isEngineeringCourse(entry.parentName) &&
    !isStrongDesignCourse(course)
  ) {
    return false;
  }

  return category.keywords.some((kw) => keywordIncluded(course, kw));
};

export const collegeMatchesCourseCategory = (college, categoryKey) => {
  const courseEntries = getCollegeCourseEntries(college);
  if (courseEntries.length === 0) return false;
  return courseEntries.some((entry) => courseMatchesCategory(entry, categoryKey));
};

export const getMatchingCoursesForCategory = (college, categoryKey) => {
  const courseEntries = getCollegeCourseEntries(college);
  const names = courseEntries
    .filter((entry) => courseMatchesCategory(entry, categoryKey))
    .map((entry) => String(entry.name || '').trim())
    .filter(Boolean);

  const seen = new Set();
  const uniqueNames = [];
  for (const name of names) {
    const k = normalizeLoose(name);
    if (!k || seen.has(k)) continue;
    seen.add(k);
    uniqueNames.push(name);
  }

  return uniqueNames;
};
