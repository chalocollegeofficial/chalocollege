import { createClient } from '@supabase/supabase-js';

export const SITE_URL = 'https://aaocollege.com';
export const SUPABASE_URL = 'https://vavkmgwwhhykktqrmwdm.supabase.co';
export const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhdmttZ3d3aGh5a2t0cXJtd2RtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2NjMwNDYsImV4cCI6MjA3OTIzOTA0Nn0.jG4lw0NDWxpPzFqjwLGTxriBksd0HAc0hGtBLKx5K7E';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});

export const slugify = (value = '') => {
  const str = String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

  const cleaned = str
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return cleaned || 'item';
};

const COURSE_LEVEL_SLUGS = {
  UG: 'ug',
  PG: 'pg',
  UG_PG: 'ug-pg-programs',
  CERTIFICATE: 'certificate-programs',
  DIPLOMA: 'diploma-programs',
  DOCTORAL: 'doctoral-programs',
  WORKING_PROFESSIONALS: 'programs-for-working-professionals',
};

const normalizeCourseLevel = (value) =>
  String(value || 'UG')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');

export const createCourseSlug = (course, index = 0) => {
  const level = normalizeCourseLevel(course?.level || 'UG');
  const levelToken = COURSE_LEVEL_SLUGS[level] || slugify(level);
  return `${slugify(course?.name || 'course')}-${levelToken}-${Number(index) || 0}`;
};

const uuidToBase36 = (uuid) => {
  const hex = String(uuid || '').replace(/-/g, '').toLowerCase();
  if (!/^[0-9a-f]{32}$/.test(hex)) return '';
  return BigInt(`0x${hex}`).toString(36);
};

export const createCollegeSlug = (college) => {
  const base = slugify(college?.college_name || '');
  const token = uuidToBase36(college?.id || '');
  return token ? `${base}-${token}` : base;
};

export const createBlogSlug = (blog) => slugify(blog?.slug || blog?.title || '');

export const toAbsoluteUrl = (path = '/') => {
  const normalized = String(path || '').startsWith('/') ? String(path || '') : `/${path || ''}`;
  return `${SITE_URL}${normalized}`;
};

export const formatDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
};

export const parseArrayField = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

export const isPgApproved = (pg) => {
  if (!pg || typeof pg !== 'object') return false;
  if (Object.prototype.hasOwnProperty.call(pg, 'is_approved')) return pg.is_approved === true;
  if (Object.prototype.hasOwnProperty.call(pg, 'approved')) return pg.approved === true;
  if (Object.prototype.hasOwnProperty.call(pg, 'status')) return String(pg.status || '').toLowerCase() === 'approved';
  if (Object.prototype.hasOwnProperty.call(pg, 'approval_status')) {
    return String(pg.approval_status || '').toLowerCase() === 'approved';
  }
  return true;
};

const fetchTable = async (queryBuilder, tableName) => {
  try {
    const { data, error } = await queryBuilder;
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.warn(`SEO generator: failed to fetch ${tableName}: ${error.message}`);
    return [];
  }
};

export const fetchDynamicSeoData = async () => {
  const [colleges, blogs, pgListings] = await Promise.all([
    fetchTable(
      supabase.from('colleges').select('id,college_name,city,courses,created_at').order('college_name'),
      'colleges'
    ),
    fetchTable(
      supabase
        .from('blogs')
        .select('id,title,slug,short_description,created_at,is_published')
        .eq('is_published', true)
        .order('created_at', { ascending: false }),
      'blogs'
    ),
    fetchTable(supabase.from('pg_listings').select('*').order('created_at', { ascending: false }), 'pg_listings'),
  ]);

  return {
    colleges,
    blogs,
    pgListings,
  };
};
