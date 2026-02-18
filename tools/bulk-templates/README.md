# Bulk import templates (CSV / JSON)

Files:
- `colleges.template.csv` / `colleges.template.json` — supports nested courses, placements, images.
- `pg_listings.template.csv` — PG/hostel listings with facilities and media.
- `blogs.template.csv` — blog posts with primary + gallery images.
- `success_stories.template.csv` — student stories.

How to use quickly (Supabase UI):
1) Open the table (colleges / pg_listings / blogs / success_stories) in Supabase.
2) Click `Import data` → pick CSV → match columns. Leave `id/created_at` blank (auto).
3) For columns that expect arrays/JSON (`images`, `courses`, `placements`, `facilities`):
   - CSV uses a pipe `|` to separate simple lists (e.g., images, facilities).
   - Nested data (`courses`, `placements`) stay as JSON strings exactly as given in the sample.

Using JSON template via script (example for colleges):
```bash
node - <<'NODE'
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
const rows = JSON.parse(fs.readFileSync('tools/bulk-templates/colleges.template.json'));
const { error } = await supabase.from('colleges').insert(rows.map(r => ({
  ...r,
  images: JSON.stringify(r.images || []),
}));
if (error) throw error;
console.log('Inserted', rows.length, 'colleges');
NODE
```

Notes
- Keep column names exactly the same as in templates to avoid mapping errors.
- `images` is stored as text in the DB but parsed as an array in the admin panel — keep it as a pipe list in CSV or array in JSON.
- `courses`/`placements` must remain valid JSON; validate with any linter before import.
- `courses[].level` supported values:
  `UG`, `PG`, `CERTIFICATE`, `DIPLOMA`, `DOCTORAL`, `WORKING_PROFESSIONALS`
  (`UG_PG` and legacy values like `PHD` are still read and normalized).
- You can delete the sample rows and duplicate as many as needed.
