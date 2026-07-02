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

// Read backend/.env so the direct-mongoose WIPE hits the SAME database the API
// writes to (the .env may point at Atlas, not local).
const ENV_PATH = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '.env');
const envUri = fs.existsSync(ENV_PATH)
  ? (fs.readFileSync(ENV_PATH, 'utf8').match(/^MONGODB_URI=(.+)$/m) || [])[1]
  : undefined;
const MONGODB_URI = process.env.MONGODB_URI || (envUri && envUri.trim()) || 'mongodb://127.0.0.1:27017/lms';
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

// Distinct, HTML descriptions per file — derived from the folder + a cleaned topic.
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const cleanName = (name) =>
  name.replace(/\.[a-z0-9]+$/i, '')
    .replace(/^\d+\.\s*/, '')
    .replace(/^(Đề bài về|Đề bài:|Sơ đồ tư duy|Sơ đồ:|SĐTD|SDTD|Thẻ:|Clip:|Tranh:|Trò chơi trên|Trò chơi:|Phiếu học tập[:_]\s*|\[Podcast tản văn\]\s*)/i, '')
    .replace(/^["“]\s*|\s*["”]$/g, '')
    .replace(/\s+/g, ' ').trim();
const descHtml = (folder, name) => {
  const t = esc(cleanName(name));
  // Lead with the DISTINCTIVE topic (bold) so each card's snippet is visibly different,
  // then a category-specific explanation.
  const tail = {
    'Bảng kiểm': 'Bảng kiểm tự đánh giá &amp; chỉnh sửa bài viết — giúp học sinh tự rà soát bài theo từng tiêu chí trước khi nộp (lớp 4–5, Kết nối tri thức).',
    'Đề bài': 'Đề bài Hoạt động Viết lớp 4–5 (bộ Kết nối tri thức). Học sinh đọc kĩ đề, lập dàn ý rồi viết bài hoàn chỉnh.',
    'Tiêu chí đánh giá': 'Bảng tiêu chí chấm bài — dùng để giáo viên và học sinh đánh giá bài viết theo thang điểm rõ ràng.',
    'Phiếu học tập': 'Phiếu học tập luyện Tiếng Việt, có kèm phần đáp án để học sinh tự đối chiếu sau khi làm.',
    'Ngữ liệu mẫu': 'Ngữ liệu đọc tham khảo — dùng cho hoạt động đọc hiểu, cảm thụ văn học hoặc đọc mở rộng.',
    'Sơ đồ tư duy': 'Sơ đồ tư duy hỗ trợ lập ý và triển khai bài viết một cách mạch lạc.',
    'Thẻ từ, bảng từ': 'Thẻ từ / bảng từ giúp mở rộng vốn từ và luyện đặt câu.',
    'Tranh ảnh, clip': 'Học liệu nghe – nhìn (podcast/clip) tạo hứng thú và minh hoạ sinh động cho bài học.',
    'Trò chơi học tập': 'Trò chơi học tập giúp ôn luyện kiến thức một cách vui vẻ, nhẹ nhàng.',
    'Hồ sơ học tập': 'Mẫu hồ sơ học tập của học sinh — minh hoạ cách lưu giữ sản phẩm và theo dõi tiến bộ.',
  };
  return `<p><strong>${t}.</strong> ${tail[folder] || ''}</p>`;
};
// Plain text (paragraphs split by newlines) -> simple HTML.
const paraHtml = (txt) => (txt || '').split(/\n+/).map((s) => s.trim()).filter(Boolean).map((s) => `<p>${s}</p>`).join('');

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
          folderId, subject: grp.subject || 'Tiếng Việt', grade: 'Lớp 4–5', tags: [grp.folder],
          description: descHtml(grp.folder, name),
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
  for (const a of (C.articles || [])) { try { await api('POST', '/articles', { ...a, content: paraHtml(a.content) }); nArt++; } catch (e) { console.log('  article ERR', e.message); } }
  console.log(`Articles: ${nArt}`);

  let nRub = 0;
  for (const r of (C.rubrics || [])) {
    try { await api('POST', '/rubrics', { name: r.name, description: r.description, levels: r.levels, criterions: r.criterions }); nRub++; }
    catch (e) { console.log('  rubric ERR', r.name, e.message); }
  }
  console.log(`Rubrics: ${nRub}`);

  // Questions — group created ids by their "Phiếu N" tag so each real worksheet
  // can be rebuilt as one quiz (mirrors the teacher's actual phiếu học tập).
  const byPhieu = new Map();
  let nQ = 0, qErr = 0;
  for (const q of (C.questions || [])) {
    try {
      const created = await api('POST', '/questions', {
        type: q.type, level: q.level, content: q.content, title: q.title,
        tags: q.tags || [], subject: q.subject, grade: q.grade, detail: q.detail,
      });
      const id = created._id || created.question?._id;
      nQ++;
      // Attach EVERY question of a phiếu to its quiz (incl. essay/viết-đoạn) so the
      // online quiz matches the worksheet image exactly. Order follows content.json.
      const tag = (q.tags || []).find((t) => /^Phiếu /.test(t));
      if (id && tag) {
        if (!byPhieu.has(tag)) byPhieu.set(tag, []);
        byPhieu.get(tag).push(id);
      }
    } catch (e) { qErr++; if (qErr <= 8) console.log('  question ERR', q.type, e.message); }
  }
  console.log(`Questions: ${nQ} (${qErr} errors)`);

  // Essay đề bài exercises.
  let nEx = 0;
  for (const ex of (C.essayExercises || [])) {
    try { await api('POST', '/exercises', { title: ex.title, description: ex.description, type: ex.type === 'file' ? 'file' : 'essay', subject: ex.subject, grade: ex.grade, points: ex.points ?? 10, status: 'open' }); nEx++; }
    catch (e) { console.log('  exercise ERR', ex.title, e.message); }
  }

  // One quiz per phiếu — every phiếu that has questions becomes a quiz (incl. the
  // all-essay "Bài văn miêu tả cây cối"). Metadata (title/passage/grade) from
  // content.json `quizzes` when present, else derived from the tag.
  const quizMeta = new Map((C.quizzes || []).map((qz) => [qz.tag, qz]));
  let nQuiz = 0;
  for (const [tag, ids] of byPhieu) {
    if (!ids.length) continue;
    const qz = quizMeta.get(tag) || { title: tag, subject: 'Tiếng Việt', grade: 'Lớp 4–5', description: null };
    try {
      const exq = await api('POST', '/exercises', {
        title: qz.title || tag, description: qz.description || null, type: 'quiz',
        subject: qz.subject || 'Tiếng Việt', grade: qz.grade || 'Lớp 4–5',
        points: ids.length * 2, status: 'open',
      });
      for (let j = 0; j < ids.length; j++) await api('POST', `/exercises/${exq._id}/questions`, { questionId: ids[j], grades: 2, order: j });
      nQuiz++;
    } catch (e) { console.log('  quiz ERR', tag, e.message); }
  }
  console.log(`Exercises: ${nEx} đề bài (essay) + ${nQuiz} quiz (phiếu)`);

  // ── 5. Gán rubric cho câu/bài tự luận theo nội dung (grading + tự đánh giá dùng đúng
  //       rubric của bài viết). Dùng mongoose trực tiếp (API không có endpoint này). ──
  await assignWritingRubrics();

  console.log('RESEED COMPLETE');
}

async function assignWritingRubrics() {
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;
  const R = {};
  for (const r of await db.collection('rubrics').find({}, { projection: { name: 1 } }).toArray()) {
    const n = r.name.toLowerCase();
    if (n.includes('tả cảnh')) R.taCanh = r._id;
    else if (n.includes('nêu tình cảm')) R.neuTinhCam = r._id;
    else if (n.includes('thuật lại')) R.thuatViec = r._id;
    else if (n.includes('kể lại')) R.keChuyen = r._id;
  }
  const match = (t) => {
    t = (t || '').toLowerCase();
    if (/kể lại (một )?câu chuyện|tưởng tượng dựa vào|ý kiến.{0,20}câu chuyện|thích (một )?câu chuyện|đóng vai.{0,20}kể/.test(t)) return R.keChuyen;
    if (/thuật lại (một )?sự việc|cảm xúc.{0,10}một sự việc|thuật lại (một )?hoạt động/.test(t)) return R.thuatViec;
    if (/tình cảm, cảm xúc về nhân vật|nhân vật (văn học|trong)|giới thiệu nhân vật|tình cảm.{0,20}(nhân vật|bài thơ|người thân)|cảm xúc về.{0,20}(bài thơ|người thân|nhân vật)/.test(t)) return R.neuTinhCam;
    if (/miêu tả cảnh|tả cảnh|bài văn miêu tả (cảnh|con vật|cây cối|người)|đoạn văn.{0,20}miêu tả|viết.{0,15}văn.{0,15}miêu tả/.test(t)) return R.taCanh;
    return null;
  };
  const isFull = (t) => /viết (đoạn văn|bài văn|\d+\s*[-–]?\s*\d*\s*câu (miêu tả|kể|thuật|nêu))/.test((t || '').toLowerCase()) || /miêu tả .{0,30} bằng câu mở đoạn/.test((t || '').toLowerCase());
  let nEq = 0, nEx = 0;
  for (const eq of await db.collection('essay-questions').find({}).toArray()) {
    const q = await db.collection('questions').findOne({ _id: eq.questionId }, { projection: { content: 1 } });
    const rid = isFull(q?.content) ? match(q?.content) : null;
    if (rid) { await db.collection('essay-questions').updateOne({ _id: eq._id }, { $set: { rubricId: rid, gradingType: 'rubric' } }); nEq++; }
  }
  for (const e of await db.collection('exercises').find({ type: 'essay' }).toArray()) {
    const rid = match(e.title);
    if (rid) { await db.collection('exercises').updateOne({ _id: e._id }, { $set: { rubricId: rid } }); nEx++; }
  }
  console.log(`Rubric gán: ${nEx} đề bài + ${nEq} câu tự luận`);

  // Chủ đề: phân loại câu hỏi theo 4 dạng bài viết (không theo từng phiếu) — mỗi phiếu
  // ánh xạ về một dạng văn để ngân hàng câu hỏi gọn và có ý nghĩa với giáo viên.
  //   Phiếu 1-4 → thuật lại sự việc · 5-8 → kể lại câu chuyện
  //   Phiếu 9-14 (+ tag "cây cối") → miêu tả cây cối · 15-18 → miêu tả con vật
  const owner = (await db.collection('questions').findOne({}, { projection: { userId: 1 } }))?.userId;
  if (owner) {
    const now = new Date();
    const CONTENT_TOPICS = [
      'Văn thuật lại một sự việc',
      'Văn kể lại một câu chuyện',
      'Văn miêu tả cây cối',
      'Văn miêu tả con vật',
    ];
    const topicFor = (tag) => {
      if (!tag) return null;
      if (/cây cối/i.test(tag)) return 'Văn miêu tả cây cối';
      const n = parseInt((tag.match(/\d+/) || [0])[0]);
      if (n >= 1 && n <= 4) return 'Văn thuật lại một sự việc';
      if (n >= 5 && n <= 8) return 'Văn kể lại một câu chuyện';
      if (n >= 9 && n <= 14) return 'Văn miêu tả cây cối';
      if (n >= 15 && n <= 18) return 'Văn miêu tả con vật';
      return null;
    };
    const topicId = {};
    for (const title of CONTENT_TOPICS) {
      let t = await db.collection('topics').findOne({ title, userId: owner });
      if (!t) { const r = await db.collection('topics').insertOne({ userId: owner, title, description: null, parentId: null, ancestors: [], depth: 0, createdAt: now, updatedAt: now }); t = { _id: r.insertedId }; }
      topicId[title] = t._id;
    }
    let nT = 0;
    for (const q of await db.collection('questions').find({}, { projection: { tags: 1 } }).toArray()) {
      const tag = (q.tags || []).find((x) => /^Phiếu/.test(x));
      const title = topicFor(tag);
      if (title && topicId[title]) { await db.collection('questions').updateOne({ _id: q._id }, { $set: { topicId: topicId[title] } }); nT++; }
    }
    console.log(`Chủ đề: ${CONTENT_TOPICS.length} chủ đề · gán ${nT} câu`);
  }

  // Chủ đề Bài tập: 6 thư mục theo kiểu bài viết, gán mỗi exercise vào đúng kiểu.
  //   quiz (phiếu) theo số: 1-4 thuật lại · 5-8 kể chuyện · 9-18 (+ "cây cối") miêu tả
  //   essay theo tiêu đề (thuật lại / kể chuyện / miêu tả / nêu ý kiến / cảm xúc / viết thư)
  const exOwner = (await db.collection('exercises').findOne({}, { projection: { userId: 1 } }))?.userId;
  if (exOwner) {
    const now2 = new Date();
    const EX_FOLDERS = [
      'Văn kể chuyện', 'Văn miêu tả', 'Văn thuật lại sự việc',
      'Đoạn văn nêu tình cảm, cảm xúc', 'Đoạn văn nêu ý kiến', 'Viết thư',
    ];
    const folderFor = (title, type) => {
      const t = title || '';
      if (type === 'quiz') {
        if (/cây cối/i.test(t)) return 'Văn miêu tả';
        const n = parseInt((t.match(/\d+/) || [0])[0]);
        if (n >= 1 && n <= 4) return 'Văn thuật lại sự việc';
        if (n >= 5 && n <= 8) return 'Văn kể chuyện';
        if (n >= 9 && n <= 18) return 'Văn miêu tả';
        return null;
      }
      if (/thuật lại/i.test(t)) return 'Văn thuật lại sự việc';
      if (/kể lại .*câu chuyện|tưởng tượng|giới thiệu nhân vật/i.test(t)) return 'Văn kể chuyện';
      if (/miêu tả|tả (cây|con vật|cảnh|người)/i.test(t)) return 'Văn miêu tả';
      if (/nêu ý kiến/i.test(t)) return 'Đoạn văn nêu ý kiến';
      if (/tình cảm|cảm xúc/i.test(t)) return 'Đoạn văn nêu tình cảm, cảm xúc';
      if (/viết thư/i.test(t)) return 'Viết thư';
      return null;
    };
    const exFolderId = {};
    for (const name of EX_FOLDERS) {
      let f = await db.collection('exercise_folders').findOne({ name, userId: exOwner });
      if (!f) { const r = await db.collection('exercise_folders').insertOne({ name, parentId: null, ancestors: [], depth: 0, userId: exOwner, createdAt: now2, updatedAt: now2 }); f = { _id: r.insertedId }; }
      exFolderId[name] = f._id;
    }
    let nExF = 0;
    for (const e of await db.collection('exercises').find({}, { projection: { title: 1, type: 1 } }).toArray()) {
      const name = folderFor(e.title, e.type);
      if (name && exFolderId[name]) { await db.collection('exercises').updateOne({ _id: e._id }, { $set: { folderId: exFolderId[name] } }); nExF++; }
    }
    console.log(`Chủ đề bài tập: ${EX_FOLDERS.length} thư mục · gán ${nExF} bài`);
  }

  await mongoose.disconnect();
}

main().then(() => process.exit(0)).catch((e) => { console.error('FATAL', e); process.exit(1); });
