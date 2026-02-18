-- Adds admin-manageable SEO fields for dynamic entities.
-- Safe to run multiple times.

alter table if exists public.colleges
  add column if not exists meta_title text,
  add column if not exists meta_description text,
  add column if not exists meta_keywords text;

alter table if exists public.blogs
  add column if not exists meta_title text,
  add column if not exists meta_description text,
  add column if not exists meta_keywords text;

alter table if exists public.pg_listings
  add column if not exists meta_title text,
  add column if not exists meta_description text,
  add column if not exists meta_keywords text;

-- Backfill existing records to avoid empty snippets in search engines.
update public.colleges
set
  meta_title = coalesce(nullif(btrim(meta_title), ''), concat_ws(' - ', college_name, 'Courses, Fees & Admission | Aao College')),
  meta_description = coalesce(
    nullif(btrim(meta_description), ''),
    concat_ws(
      ' ',
      'Explore admissions, courses, fees, and placements for',
      college_name,
      case when city is not null and btrim(city) <> '' then concat('in ', city || '.') else '.' end
    )
  ),
  meta_keywords = coalesce(
    nullif(btrim(meta_keywords), ''),
    concat_ws(
      ', ',
      college_name,
      case when city is not null and btrim(city) <> '' then concat(college_name, ' ', city) else null end,
      'college admission',
      'college fees',
      'college courses'
    )
  )
where
  meta_title is null or btrim(meta_title) = ''
  or meta_description is null or btrim(meta_description) = ''
  or meta_keywords is null or btrim(meta_keywords) = '';

update public.blogs
set
  meta_title = coalesce(nullif(btrim(meta_title), ''), concat_ws(' - ', title, 'Aao College Blog')),
  meta_description = coalesce(nullif(btrim(meta_description), ''), short_description),
  meta_keywords = coalesce(
    nullif(btrim(meta_keywords), ''),
    concat_ws(
      ', ',
      title,
      category,
      'college admission blog',
      'career guidance'
    )
  )
where
  meta_title is null or btrim(meta_title) = ''
  or meta_description is null or btrim(meta_description) = ''
  or meta_keywords is null or btrim(meta_keywords) = '';

update public.pg_listings
set
  meta_title = coalesce(nullif(btrim(meta_title), ''), concat_ws(' - ', pg_name, 'PG near College | Aao College')),
  meta_description = coalesce(
    nullif(btrim(meta_description), ''),
    concat_ws(
      ' ',
      'Find details for',
      pg_name,
      case when location is not null and btrim(location) <> '' then concat('in ', location || '.') else '.' end,
      'View rent, room type, facilities, and enquiry support.'
    )
  ),
  meta_keywords = coalesce(
    nullif(btrim(meta_keywords), ''),
    concat_ws(
      ', ',
      pg_name,
      location,
      'pg near college',
      'student hostel',
      'pg listing'
    )
  )
where
  meta_title is null or btrim(meta_title) = ''
  or meta_description is null or btrim(meta_description) = ''
  or meta_keywords is null or btrim(meta_keywords) = '';
