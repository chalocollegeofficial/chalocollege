export const SITE_URL = 'https://aaocollege.com';
export const SITE_NAME = 'Aao College';
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-banner.jpg`;

export const BASE_SEO_KEYWORDS = [
  'aao college',
  'college admissions',
  'college counseling',
  'college search india',
  'career guidance',
  'admission consulting',
  'course counseling',
  'scholarship guidance',
  'entrance exam prep',
];

const textOrEmpty = (value) => String(value || '').trim();

export const collapseWhitespace = (value = '') =>
  String(value || '').replace(/\s+/g, ' ').trim();

export const stripHtml = (value = '') => collapseWhitespace(String(value || '').replace(/<[^>]+>/g, ' '));

export const truncate = (value = '', max = 160) => {
  const clean = collapseWhitespace(value);
  if (!clean || clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).trimEnd()}…`;
};

const STOP_WORDS = new Set([
  'a',
  'an',
  'the',
  'and',
  'or',
  'of',
  'to',
  'for',
  'in',
  'on',
  'with',
  'by',
  'from',
  'at',
  'is',
  'are',
  'be',
  'this',
  'that',
  'your',
  'you',
  'our',
  'we',
  'it',
  'as',
  'about',
  'into',
  'after',
  'how',
  'what',
  'why',
  'when',
  'where',
  'who',
  'all',
  'best',
  'top',
  'get',
  'guide',
  'tips',
  'college',
  'colleges',
  'aao',
]);

const tokenize = (value = '') =>
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);

export const extractKeywordsFromText = (text = '', options = {}) => {
  const limit = Number.isFinite(options.limit) ? options.limit : 8;
  const minLength = Number.isFinite(options.minLength) ? options.minLength : 3;
  const counts = new Map();

  tokenize(text).forEach((token) => {
    if (token.length < minLength) return;
    if (STOP_WORDS.has(token)) return;
    counts.set(token, (counts.get(token) || 0) + 1);
  });

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([token]) => token);
};

export const autoDescriptionFromText = (text = '', fallback = '', max = 170) => {
  const source = collapseWhitespace(text) || collapseWhitespace(fallback);
  return truncate(source, max);
};

export const parseKeywordInput = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => textOrEmpty(item)).filter(Boolean);
  }

  const raw = textOrEmpty(value);
  if (!raw) return [];

  return raw
    .split(',')
    .map((item) => textOrEmpty(item))
    .filter(Boolean);
};

export const mergeKeywords = (...keywordGroups) => {
  const unique = new Map();

  keywordGroups
    .flatMap((group) => parseKeywordInput(group))
    .forEach((keyword) => {
      const normalized = keyword.toLowerCase();
      if (!unique.has(normalized)) unique.set(normalized, keyword);
    });

  return Array.from(unique.values());
};

export const toAbsoluteUrl = (pathOrUrl = '/') => {
  const value = textOrEmpty(pathOrUrl);
  if (!value) return SITE_URL;
  if (/^https?:\/\//i.test(value)) return value;
  const normalizedPath = value.startsWith('/') ? value : `/${value}`;
  return `${SITE_URL}${normalizedPath}`;
};

export const pickSeoTitle = (customTitle, fallbackTitle) => {
  const custom = textOrEmpty(customTitle);
  const fallback = textOrEmpty(fallbackTitle);
  return custom || fallback || SITE_NAME;
};

export const pickSeoDescription = (customDescription, fallbackDescription) => {
  const custom = collapseWhitespace(customDescription);
  const fallback = collapseWhitespace(fallbackDescription);
  return truncate(custom || fallback, 170);
};

export const pickSeoKeywords = (customKeywords, fallbackKeywords = []) =>
  mergeKeywords(customKeywords, fallbackKeywords, BASE_SEO_KEYWORDS);

export const STATIC_PAGE_SEO = {
  home: {
    title: 'Aao College | College Search, Admission Guidance & PG Listings in India',
    description:
      'Compare colleges, courses, fees, and student reviews. Get expert admission consulting, course counseling, scholarship guidance, and PG search support.',
    keywords: [
      'home',
      'best college in india',
      'college search',
      'college admission guidance',
      'top colleges',
      'pg near college',
    ],
    canonicalPath: '/',
  },
  about: {
    title: 'About Aao College | College Admission Experts & Counselors',
    description:
      'Know the Aao College team, mission, and track record in guiding students with college search, admissions, mentorship, and scholarship planning.',
    keywords: ['about aao college', 'admission experts', 'education counselors india'],
    canonicalPath: '/about',
  },
  services: {
    title: 'College Admission Services | Aao College',
    description:
      'Explore College Search, Admission Consulting, Course Counseling, Scholarship Guidance, and Entrance Exam Prep services with expert support.',
    keywords: [
      'college search',
      'admission consulting',
      'course counseling',
      'scholarship guidance',
      'entrance exam prep',
      'student loan assistance',
      'mentorship till placement',
    ],
    canonicalPath: '/services',
  },
  colleges: {
    title: 'Colleges in India | Compare Courses, Fees & Placements | Aao College',
    description:
      'Browse and compare colleges by city, state, category, courses, fees, and placements. Find the right college with expert guidance.',
    keywords: ['colleges in india', 'college list', 'college comparison', 'college fees', 'college placements'],
    canonicalPath: '/colleges',
  },
  blog: {
    title: 'College Admission Blog | Career, Courses & Exam Tips | Aao College',
    description:
      'Read practical articles on admissions, entrance exams, scholarships, career planning, and college life to make better education decisions.',
    keywords: ['college blog', 'admission tips', 'entrance exam tips', 'career guidance blog'],
    canonicalPath: '/blog',
  },
  pgListings: {
    title: 'Find PG Near Colleges | Student PG & Hostel Listings | Aao College',
    description:
      'Discover verified PG and hostel options near top colleges with room types, rent range, facilities, and quick enquiry support.',
    keywords: ['pg near college', 'student pg', 'hostel near college', 'pg listing'],
    canonicalPath: '/get-pg',
  },
  pgRegister: {
    title: 'List Your PG | Add Student PG/Hostel Listing | Aao College',
    description:
      'PG owners can submit their property for student listings. Add PG details, facilities, rent, and photos for approval.',
    keywords: ['list your pg', 'add pg listing', 'student hostel listing'],
    canonicalPath: '/register-pg',
  },
  mentorship: {
    title: 'Mentorship Program | College Seniors & Career Guidance | Aao College',
    description:
      'Connect with mentors from top colleges for admission strategy, profile building, and long-term career planning.',
    keywords: ['college mentorship', 'student mentor', 'career mentorship'],
    canonicalPath: '/mentorship',
  },
  contact: {
    title: 'Admission Enquiry & Counseling | Aao College',
    description:
      'Talk to admission counselors for college search, application support, scholarship guidance, and personalized counseling.',
    keywords: ['admission enquiry', 'college counseling', 'contact aao college'],
    canonicalPath: '/contact',
  },
  emi: {
    title: 'Education Loan EMI Calculator | Aao College',
    description:
      'Calculate monthly EMI, total interest, and repayment for education loans. Get expert support for student loan planning.',
    keywords: ['education loan emi calculator', 'student loan calculator', 'college loan assistance'],
    canonicalPath: '/emi-calculator',
  },
};
