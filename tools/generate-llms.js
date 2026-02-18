#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import {
  createBlogSlug,
  createCollegeSlug,
  fetchDynamicSeoData,
  isPgApproved,
  toAbsoluteUrl,
} from './seo-utils.js';

const STATIC_PAGE_ENTRIES = [
  {
    title: 'Home - Aao College',
    url: toAbsoluteUrl('/'),
    description: 'College search, admission consulting, counseling, scholarship and mentorship support.',
  },
  {
    title: 'About Us - Aao College',
    url: toAbsoluteUrl('/about'),
    description: 'About the platform, mission, and student outcomes.',
  },
  {
    title: 'Services - Aao College',
    url: toAbsoluteUrl('/services'),
    description:
      'College Search, Admission Consulting, Course Counseling, Scholarship Guidance, Entrance Exam Prep.',
  },
  {
    title: 'College Search Service - Aao College',
    url: toAbsoluteUrl('/services/college-search'),
    description: 'Guided college discovery by location, budget, and course goals.',
  },
  {
    title: 'Admission Consulting Service - Aao College',
    url: toAbsoluteUrl('/services/admission-consulting'),
    description: 'Application strategy, documentation, and admission execution support.',
  },
  {
    title: 'Course Counseling Service - Aao College',
    url: toAbsoluteUrl('/services/course-counseling'),
    description: 'One-to-one counseling for selecting the right degree and specialization.',
  },
  {
    title: 'Scholarship Guidance Service - Aao College',
    url: toAbsoluteUrl('/services/scholarship-guidance'),
    description: 'Scholarship discovery and application guidance for eligible students.',
  },
  {
    title: 'Entrance Exam Prep Guidance - Aao College',
    url: toAbsoluteUrl('/services/entrance-exam-prep'),
    description: 'Exam planning, strategy, and score improvement guidance.',
  },
  {
    title: 'College Listings - Aao College',
    url: toAbsoluteUrl('/colleges'),
    description: 'Filter and compare colleges by city, category, fees, and courses.',
  },
  {
    title: 'PG Listings - Aao College',
    url: toAbsoluteUrl('/get-pg'),
    description: 'Find PG and hostel options for students.',
  },
  {
    title: 'Blog - Aao College',
    url: toAbsoluteUrl('/blog'),
    description: 'Articles on admissions, exams, scholarships, and career planning.',
  },
  {
    title: 'Mentorship - Aao College',
    url: toAbsoluteUrl('/mentorship'),
    description: 'Request guidance from mentors and senior students.',
  },
  {
    title: 'Contact - Aao College',
    url: toAbsoluteUrl('/contact'),
    description: 'Submit an admission enquiry and connect with counselors.',
  },
  {
    title: 'EMI Calculator - Aao College',
    url: toAbsoluteUrl('/emi-calculator'),
    description: 'Calculate education loan EMI and request financing help.',
  },
];

const asBullet = (entry) => `- [${entry.title}](${entry.url}): ${entry.description}`;

const truncate = (value, max = 200) => {
  const clean = String(value || '').replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).trimEnd()}…`;
};

const main = async () => {
  const { colleges, blogs, pgListings } = await fetchDynamicSeoData();

  const collegeEntries = (colleges || []).slice(0, 120).map((college) => ({
    title: `${college.college_name || 'College'}${college.city ? ` (${college.city})` : ''}`,
    url: toAbsoluteUrl(`/colleges/${createCollegeSlug(college)}`),
    description: `College profile page with courses, fees, placements, and admission details.`,
  }));

  const blogEntries = (blogs || []).slice(0, 120).map((post) => ({
    title: post.title || 'Blog Article',
    url: toAbsoluteUrl(`/blog/${createBlogSlug(post)}/${post.id}`),
    description: truncate(post.short_description || 'Education, admission, and career guidance article.'),
  }));

  const hasApprovedPg = (pgListings || []).some((item) => isPgApproved(item));

  const sections = [
    '# Aao College',
    '',
    'This file helps AI assistants discover important pages and dynamic content routes.',
    '',
    '## Core Pages',
    ...STATIC_PAGE_ENTRIES.map(asBullet),
    '',
    '## College Detail Pages',
    ...(collegeEntries.length
      ? collegeEntries.map(asBullet)
      : ['- No college detail entries available right now.']),
    '',
    '## Blog Articles',
    ...(blogEntries.length
      ? blogEntries.map(asBullet)
      : ['- No published blog articles available right now.']),
    '',
    '## Notes',
    hasApprovedPg
      ? '- PG listings are available at https://aaocollege.com/get-pg'
      : '- PG listings are currently limited; check https://aaocollege.com/get-pg for updates.',
    '- Canonical blog URL format: /blog/{slug}/{id}',
    '- Canonical college URL format: /colleges/{college-slug}',
    '',
  ];

  const outputPath = path.join(process.cwd(), 'public', 'llms.txt');
  fs.writeFileSync(outputPath, sections.join('\n'), 'utf8');
  console.log(`SEO generator: llms.txt updated (${collegeEntries.length} colleges, ${blogEntries.length} blogs)`);
};

main().catch((error) => {
  console.error(`SEO generator: llms.txt failed: ${error.message}`);
  process.exit(1);
});
