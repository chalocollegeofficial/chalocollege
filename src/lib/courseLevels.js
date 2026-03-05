const normalizeAlias = (value) =>
  String(value || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const toSlugToken = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

export const DEFAULT_COURSE_LEVEL = 'UG';

export const COURSE_LEVEL_OPTIONS = [
  {
    value: 'UG',
    order: 1,
    shortLabel: 'UG',
    filterLabel: 'Undergraduate',
    coursesLabel: 'UG Courses',
    adminLabel: 'UG (Undergraduate)',
    slugToken: 'ug',
    aliases: ['UG', 'UNDERGRADUATE'],
    slugAliases: ['undergraduate'],
  },
  {
    value: 'PG',
    order: 2,
    shortLabel: 'PG',
    filterLabel: 'Postgraduate',
    coursesLabel: 'PG Courses',
    adminLabel: 'PG (Postgraduate)',
    slugToken: 'pg',
    aliases: ['PG', 'POSTGRADUATE'],
    slugAliases: ['postgraduate'],
  },
  {
    value: 'UG_PG',
    order: 3,
    shortLabel: 'UG + PG',
    filterLabel: 'UG + PG Programs',
    coursesLabel: 'UG + PG Programs',
    adminLabel: 'UG + PG Programs',
    slugToken: 'ug-pg-programs',
    aliases: ['UG PG', 'UG_PG', 'UG/PG', 'UG AND PG', 'UG + PG'],
    slugAliases: ['ug-pg', 'ug-and-pg'],
  },
  {
    value: 'CERTIFICATE',
    order: 4,
    shortLabel: 'Certificate',
    filterLabel: 'Certificate Programs',
    coursesLabel: 'Certificate Programs',
    adminLabel: 'Certificate Programs',
    slugToken: 'certificate-programs',
    aliases: ['CERTIFICATE', 'CERTIFICATE PROGRAM', 'CERTIFICATE PROGRAMS'],
    slugAliases: ['certificate', 'certificate-program'],
  },
  {
    value: 'DIPLOMA',
    order: 5,
    shortLabel: 'Diploma',
    filterLabel: 'Diploma Programs',
    coursesLabel: 'Diploma Programs',
    adminLabel: 'Diploma Programs',
    slugToken: 'diploma-programs',
    aliases: ['DIPLOMA', 'DIPLOMA PROGRAM', 'DIPLOMA PROGRAMS'],
    slugAliases: ['diploma', 'diploma-program'],
  },
  {
    value: 'DOCTORAL',
    order: 6,
    shortLabel: 'Doctoral',
    filterLabel: 'Doctoral Programs',
    coursesLabel: 'Doctoral Programs',
    adminLabel: 'Doctoral Programs',
    slugToken: 'doctoral-programs',
    aliases: [
      'DOCTORAL',
      'DOCTORAL PROGRAM',
      'DOCTORAL PROGRAMS',
      'DOCTORATE',
      'PHD',
      'PH D',
      'PH.D',
      'PH.D.',
    ],
    slugAliases: ['doctoral', 'doctorate', 'phd', 'ph-d'],
  },
  {
    value: 'WORKING_PROFESSIONALS',
    order: 7,
    shortLabel: 'Working Professionals',
    filterLabel: 'Programs for Working Professionals',
    coursesLabel: 'Programs for Working Professionals',
    adminLabel: 'Programs for Working Professionals',
    slugToken: 'programs-for-working-professionals',
    aliases: [
      'WORKING PROFESSIONAL',
      'WORKING PROFESSIONALS',
      'PROGRAM FOR WORKING PROFESSIONAL',
      'PROGRAM FOR WORKING PROFESSIONALS',
      'PROGRAMS FOR WORKING PROFESSIONAL',
      'PROGRAMS FOR WORKING PROFESSIONALS',
      'WORKING PROFESSIONAL PROGRAM',
      'WORKING PROFESSIONAL PROGRAMS',
    ],
    slugAliases: ['working-professionals', 'working-professional-programs'],
  },
];

const courseLevelByValue = new Map(
  COURSE_LEVEL_OPTIONS.map((opt) => [opt.value, opt])
);

const aliasToValue = new Map();
const slugTokenToValue = new Map();

for (const option of COURSE_LEVEL_OPTIONS) {
  aliasToValue.set(normalizeAlias(option.value), option.value);
  (option.aliases || []).forEach((alias) => {
    aliasToValue.set(normalizeAlias(alias), option.value);
  });

  if (option.slugToken) {
    slugTokenToValue.set(String(option.slugToken).toLowerCase(), option.value);
  }
  (option.slugAliases || []).forEach((slug) => {
    slugTokenToValue.set(String(slug).toLowerCase(), option.value);
  });
}

export const COURSE_LEVEL_ADMIN_OPTIONS = COURSE_LEVEL_OPTIONS.map((opt) => ({
  value: opt.value,
  label: opt.adminLabel,
}));

export const normalizeCourseLevel = (
  value,
  fallback = DEFAULT_COURSE_LEVEL
) => {
  const raw = String(value || '').trim();
  if (!raw) return fallback;

  const mapped = aliasToValue.get(normalizeAlias(raw));
  if (mapped) return mapped;

  // Preserve unexpected legacy values in a stable normalized form.
  return normalizeAlias(raw).replace(/\s+/g, '_');
};

export const getCourseLevelMeta = (value) => {
  const normalized = normalizeCourseLevel(value);
  const known = courseLevelByValue.get(normalized);
  if (known) return known;

  const fallbackLabel =
    normalized
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (m) => m.toUpperCase()) || 'Courses';

  return {
    value: normalized,
    order: 999,
    shortLabel: fallbackLabel,
    filterLabel: fallbackLabel,
    coursesLabel: `${fallbackLabel} Courses`,
    adminLabel: fallbackLabel,
    slugToken: toSlugToken(normalized || DEFAULT_COURSE_LEVEL),
  };
};

export const getCourseLevelShortLabel = (value) =>
  getCourseLevelMeta(value).shortLabel;

export const getCourseLevelFilterLabel = (value) =>
  getCourseLevelMeta(value).filterLabel;

export const getCourseLevelCoursesLabel = (value) =>
  getCourseLevelMeta(value).coursesLabel;

export const getCourseLevelOrder = (value) => getCourseLevelMeta(value).order;

export const getCourseLevelSlugToken = (value) =>
  getCourseLevelMeta(value).slugToken;

export const getCourseLevelFromSlugToken = (token) => {
  const raw = String(token || '').toLowerCase().trim();
  if (!raw) return null;

  const mapped = slugTokenToValue.get(raw);
  if (mapped) return mapped;

  const normalized = normalizeAlias(raw.replace(/-/g, ' '));
  return aliasToValue.get(normalized) || null;
};

export const getAllCourseLevelSlugTokens = () => {
  const tokens = [];
  for (const option of COURSE_LEVEL_OPTIONS) {
    if (option.slugToken) tokens.push(option.slugToken);
    (option.slugAliases || []).forEach((slug) => tokens.push(slug));
  }

  return [...new Set(tokens.filter(Boolean))].sort((a, b) => b.length - a.length);
};

export const sortCourseLevels = (levels = []) => {
  const unique = [];
  const seen = new Set();

  for (const level of levels) {
    const normalized = normalizeCourseLevel(level, '');
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    unique.push(normalized);
  }

  return unique.sort((a, b) => {
    const orderDiff = getCourseLevelOrder(a) - getCourseLevelOrder(b);
    if (orderDiff !== 0) return orderDiff;
    return String(a).localeCompare(String(b));
  });
};
