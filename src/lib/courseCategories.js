export const COURSE_CATEGORIES = [
  {
    key: 'engineering-technology',
    label: 'Engineering & Technology',
    icon: 'cpu',
    keywords: [
      'b.tech', 'btech', 'm.tech', 'mtech', 'b.e', 'be', 'beng',
      'engineering', 'polytechnic', 'diploma',
    ],
  },
  {
    key: 'business-commerce',
    label: 'Business & Commerce',
    icon: 'briefcase',
    keywords: ['mba', 'bba', 'b.com', 'bcom', 'm.com', 'mcom', 'pgdm', 'commerce', 'management'],
  },
  {
    key: 'law',
    label: 'Law',
    icon: 'scale',
    keywords: ['llb', 'll.m', 'llm', 'law', 'ba llb', 'bba llb'],
  },
  {
    key: 'pharmacy',
    label: 'Pharmacy',
    icon: 'flask',
    keywords: ['pharmacy', 'b.pharm', 'bpharm', 'm.pharm', 'mpharm', 'd.pharm', 'dpharm'],
  },
  {
    key: 'computer-application',
    label: 'Computer Application',
    icon: 'code',
    keywords: ['bca', 'mca', 'computer application', 'information technology', 'software', 'computer science', 'cs', 'it'],
  },
  {
    key: 'design',
    label: 'Design Courses',
    icon: 'paintbrush',
    keywords: ['design', 'b.des', 'bdes', 'm.des', 'mdes', 'fashion', 'interior', 'ui/ux', 'ux', 'graphic'],
  },
];

export const getCourseCategoryByKey = (key) =>
  COURSE_CATEGORIES.find((c) => c.key === key) || null;

const normalize = (s) => String(s || '').toLowerCase();

const safeToArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;

  if (typeof value === 'string') {
    const trimmed = value.trim();
    // Try JSON string
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      try {
        const parsed = JSON.parse(trimmed);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        // ignore and fallback
      }
    }
    // Comma-separated string
    if (trimmed.includes(',')) return trimmed.split(',').map((s) => s.trim()).filter(Boolean);
    return trimmed ? [trimmed] : [];
  }

  // If it's some object (rare), we can't safely interpret it as a list
  return [];
};

const normalizeCourseItemToName = (item) => {
  if (!item) return '';
  if (typeof item === 'string') return item;

  if (typeof item === 'object') {
    // Handle possible shapes
    return (
      item.name ||
      item.course ||
      item.course_name ||
      item.title ||
      ''
    );
  }

  return '';
};

/**
 * ✅ Get course names from the college record.
 * Your DB clearly uses `courses_offered` in the UI, so we focus on that.
 * Also supports string/JSON-string/array-of-objects.
 */
export const getCollegeCourseNames = (college) => {
  if (!college) return [];

  const offeredRaw = safeToArray(college.courses_offered);
  const offeredNames = offeredRaw
    .map(normalizeCourseItemToName)
    .map((s) => String(s).trim())
    .filter(Boolean);

  return offeredNames;
};

export const collegeMatchesCourseCategory = (college, categoryKey) => {
  const category = getCourseCategoryByKey(categoryKey);
  if (!category) return false;

  const courseNames = getCollegeCourseNames(college);
  if (courseNames.length === 0) return false;

  return courseNames.some((course) => {
    const c = normalize(course);
    return category.keywords.some((kw) => c.includes(normalize(kw)));
  });
};

export const getMatchingCoursesForCategory = (college, categoryKey) => {
  const category = getCourseCategoryByKey(categoryKey);
  if (!category) return [];

  const courseNames = getCollegeCourseNames(college);

  return courseNames.filter((course) => {
    const c = normalize(course);
    return category.keywords.some((kw) => c.includes(normalize(kw)));
  });
};
