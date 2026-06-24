// Reseed the LMS with REAL data: wipe demo content (keep users + settings),
// seed the user's Google Drive library (KNTT Tiếng Việt 4-5) + authored
// curriculum content (questions / rubrics / essay đề bài / articles + quizzes).
//
// Run from the backend dir so 'mongoose' resolves:
//   node scripts/reseed.mjs
// Requires: MongoDB up, backend API up on :3001, admin admin@vuonvan.vn/admin123456.
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { pathToFileURL, fileURLToPath } from 'url';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/lms';
const API = process.env.API || 'http://localhost:3001/api';
const DATA = path.join(path.dirname(fileURLToPath(import.meta.url)), 'seed-data');
const KEEP = new Set(['users', 'settings']);

const extOf = (n) => (n.split('.').pop() || '').toLowerCase();
const fileTypeOf = (n) => {
  const e = extOf(n);
  if (e === 'pdf') return 'pdf';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(e)) return 'image';
  if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(e)) return 'video';
  if (['doc', 'docx'].includes(e)) return 'doc';
  if (['mp3', 'wav', 'm4a'].includes(e)) return 'audio';
  if (['ppt', 'pptx'].includes(e)) return 'slide';
  return 'link';
};

let TOKEN = '';
async function api(method, path, body) {
  const h = { 'Content-Type': 'application/json' };
  if (TOKEN) h.Authorization = 'Bearer ' + TOKEN;
  const res = await fetch(API + path, { method, headers: h, body: body ? JSON.stringify(body) : undefined });
  const txt = await res.text();
  let data = null; try { data = txt ? JSON.parse(txt) : null; } catch { data = txt; }
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status} ${JSON.stringify(data).slice(0, 160)}`);
  return data;
}

async function main() {
  // ── 1. WIPE content collections (keep users + settings) ──
  await mongoose.connect(MONGODB_URI);
  const cols = await mongoose.connection.db.listCollections().toArray();
  let wiped = 0;
  for (const c of cols) {
    if (KEEP.has(c.name)) continue;
    const r = await mongoose.connection.db.collection(c.name).deleteMany({});
    if (r.deletedCount) console.log(`  wiped ${c.name}: ${r.deletedCount}`);
    wiped += r.deletedCount;
  }
  console.log(`WIPE done: ${wiped} docs across ${cols.length - KEEP.size} collections (kept users + settings)`);
  await mongoose.disconnect();

  // ── 2. Login admin ──
  TOKEN = (await api('POST', '/auth/login', { email: 'admin@vuonvan.vn', password: 'admin123456' })).accessToken;
  console.log('admin logged in');

  // ── 3. Seed Drive folders + files ──
  const { DRIVE } = await import(pathToFileURL(path.join(DATA, 'drive-inventory.mjs')).href);
  let nFolders = 0, nFiles = 0, fileErr = 0;
  for (const grp of DRIVE) {
    let folderId = null;
    try { folderId = (await api('POST', '/folders', { name: grp.folder })) ._id; nFolders++; } catch (e) { console.log('  folder ERR', grp.folder, e.message); }
    for (const [name, url] of grp.files) {
      try {
        await api('POST', '/files', {
          name, fileType: fileTypeOf(name), source: 'external', url,
          folderId, subject: grp.subject || 'Tiếng Việt', tags: [grp.folder],
        });
        nFiles++;
      } catch (e) { fileErr++; if (fileErr <= 5) console.log('  file ERR', name, e.message); }
    }
  }
  console.log(`Drive seeded: ${nFolders} folders, ${nFiles} files (${fileErr} errors)`);

  // ── 4. Seed authored curriculum content (if present) ──
  const contentPath = path.join(DATA, 'content.json');
  if (!fs.existsSync(contentPath)) { console.log('content.json missing — skipping curriculum content'); return; }
  const C = JSON.parse(fs.readFileSync(contentPath, 'utf8'));

  let nArt = 0;
  for (const a of (C.articles || [])) { try { await api('POST', '/articles', a); nArt++; } catch (e) { console.log('  article ERR', e.message); } }
  console.log(`Articles: ${nArt}`);

  let nRub = 0;
  for (const r of (C.rubrics || [])) {
    try { await api('POST', '/rubrics', { name: r.name, description: r.description, levels: r.levels, criterions: r.criterions }); nRub++; }
    catch (e) { console.log('  rubric ERR', r.name, e.message); }
  }
  console.log(`Rubrics: ${nRub}`);

  // Questions — keep ids grouped by grade for building quizzes.
  const byGrade = { 'Lớp 4': [], 'Lớp 5': [] };
  let nQ = 0, qErr = 0;
  for (const q of (C.questions || [])) {
    try {
      const created = await api('POST', '/questions', {
        type: q.type, level: q.level, content: q.content, title: q.title,
        tags: q.tags || [], subject: q.subject, grade: q.grade, detail: q.detail,
      });
      const id = created._id || created.question?._id;
      nQ++;
      if (id && q.type !== 'essay' && byGrade[q.grade]) byGrade[q.grade].push(id);
    } catch (e) { qErr++; if (qErr <= 8) console.log('  question ERR', q.type, e.message); }
  }
  console.log(`Questions: ${nQ} (${qErr} errors)`);

  // Essay đề bài exercises.
  let nEx = 0;
  for (const ex of (C.essayExercises || [])) {
    try { await api('POST', '/exercises', { title: ex.title, description: ex.description, type: ex.type === 'file' ? 'file' : 'essay', subject: ex.subject, grade: ex.grade, points: ex.points ?? 10, status: 'open' }); nEx++; }
    catch (e) { console.log('  exercise ERR', ex.title, e.message); }
  }

  // Build quiz exercises from seeded questions (5 per quiz, per grade).
  let nQuiz = 0;
  for (const grade of ['Lớp 4', 'Lớp 5']) {
    const ids = byGrade[grade];
    for (let i = 0; i + 3 < ids.length && nQuiz < 8; i += 5) {
      const chunk = ids.slice(i, i + 5);
      try {
        const exq = await api('POST', '/exercises', { title: `Trắc nghiệm Tiếng Việt ${grade} — Đề ${Math.floor(i / 5) + 1}`, type: 'quiz', subject: 'Tiếng Việt', grade, points: chunk.length * 2, status: 'open' });
        for (let j = 0; j < chunk.length; j++) await api('POST', `/exercises/${exq._id}/questions`, { questionId: chunk[j], grades: 2, order: j });
        nQuiz++;
      } catch (e) { console.log('  quiz ERR', e.message); }
    }
  }
  console.log(`Exercises: ${nEx} đề bài (essay) + ${nQuiz} quiz`);
  console.log('RESEED COMPLETE');
}

main().then(() => process.exit(0)).catch((e) => { console.error('FATAL', e); process.exit(1); });
