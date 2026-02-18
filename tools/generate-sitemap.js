#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import {
  createBlogSlug,
  createCollegeSlug,
  createCourseSlug,
  fetchDynamicSeoData,
  formatDate,
  parseArrayField,
  toAbsoluteUrl,
} from './seo-utils.js';

const STATIC_URLS = [
  { path: '/', changefreq: 'daily', priority: '1.0' },
  { path: '/about', changefreq: 'monthly', priority: '0.8' },
  { path: '/services', changefreq: 'weekly', priority: '0.9' },
  { path: '/services/college-search', changefreq: 'weekly', priority: '0.7' },
  { path: '/services/admission-consulting', changefreq: 'weekly', priority: '0.7' },
  { path: '/services/course-counseling', changefreq: 'weekly', priority: '0.7' },
  { path: '/services/scholarship-guidance', changefreq: 'weekly', priority: '0.7' },
  { path: '/services/entrance-exam-prep', changefreq: 'weekly', priority: '0.7' },
  { path: '/colleges', changefreq: 'weekly', priority: '0.9' },
  { path: '/blog', changefreq: 'daily', priority: '0.8' },
  { path: '/get-pg', changefreq: 'weekly', priority: '0.8' },
  { path: '/register-pg', changefreq: 'monthly', priority: '0.6' },
  { path: '/mentorship', changefreq: 'weekly', priority: '0.8' },
  { path: '/contact', changefreq: 'monthly', priority: '0.8' },
  { path: '/emi-calculator', changefreq: 'monthly', priority: '0.6' },
];

const xmlEscape = (value = '') =>
  String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const buildUrlNode = (entry) => {
  const lines = ['  <url>'];
  lines.push(`    <loc>${xmlEscape(entry.loc)}</loc>`);
  if (entry.lastmod) lines.push(`    <lastmod>${entry.lastmod}</lastmod>`);
  if (entry.changefreq) lines.push(`    <changefreq>${entry.changefreq}</changefreq>`);
  if (entry.priority) lines.push(`    <priority>${entry.priority}</priority>`);
  lines.push('  </url>');
  return lines.join('\n');
};

const dedupeUrls = (urls) => {
  const map = new Map();
  urls.forEach((entry) => {
    if (!entry?.loc) return;
    map.set(entry.loc, entry);
  });
  return Array.from(map.values());
};

const main = async () => {
  const { colleges, blogs } = await fetchDynamicSeoData();
  const now = formatDate(new Date()) || undefined;

  const entries = [
    ...STATIC_URLS.map((item) => ({
      loc: toAbsoluteUrl(item.path),
      changefreq: item.changefreq,
      priority: item.priority,
      lastmod: now,
    })),
  ];

  colleges.forEach((college) => {
    if (!college?.id) return;
    const collegeSlug = createCollegeSlug(college);
    const basePath = `/colleges/${collegeSlug}`;
    const lastmod = formatDate(college.created_at) || now;

    entries.push({
      loc: toAbsoluteUrl(basePath),
      changefreq: 'weekly',
      priority: '0.8',
      lastmod,
    });

    entries.push({
      loc: toAbsoluteUrl(`${basePath}/courses`),
      changefreq: 'weekly',
      priority: '0.7',
      lastmod,
    });

    const courses = parseArrayField(college.courses);
    courses.forEach((course, index) => {
      if (!course?.name) return;
      const courseSlug = createCourseSlug(course, index);
      entries.push({
        loc: toAbsoluteUrl(`${basePath}/courses/${courseSlug}`),
        changefreq: 'weekly',
        priority: '0.6',
        lastmod,
      });
    });
  });

  blogs.forEach((blog) => {
    if (!blog?.id) return;
    const slug = createBlogSlug(blog);
    entries.push({
      loc: toAbsoluteUrl(`/blog/${slug}/${blog.id}`),
      changefreq: 'weekly',
      priority: '0.7',
      lastmod: formatDate(blog.created_at) || now,
    });
  });

  const uniqueEntries = dedupeUrls(entries).sort((a, b) => a.loc.localeCompare(b.loc));
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...uniqueEntries.map(buildUrlNode),
    '</urlset>',
    '',
  ].join('\n');

  const outputPath = path.join(process.cwd(), 'public', 'sitemap.xml');
  fs.writeFileSync(outputPath, xml, 'utf8');
  console.log(`SEO generator: sitemap updated (${uniqueEntries.length} URLs)`);
};

main().catch((error) => {
  console.error(`SEO generator: sitemap failed: ${error.message}`);
  process.exit(1);
});
