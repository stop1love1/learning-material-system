/**
 * seed-demo-activity.js — bơm dữ liệu "hoạt động" trông chuyên nghiệp vào DB.
 *
 * AN TOÀN / CÓ THỂ GỠ SẠCH:
 *  - Mọi bản ghi seed MỚI (users, attempts, submissions, participants, downloads,
 *    articles) đều mang cờ `seeded: true`. Gỡ = deleteMany({ seeded: true }).
 *  - Các counter trên nội dung THẬT (file.downloadCount/viewCount, exercise.viewCount)
 *    phải sửa trực tiếp trên doc thật -> trước khi sửa, snapshot giá trị gốc vào
 *    collection `_seed_backup`. `--clean` khôi phục lại.
 *  - KHÔNG đụng user/exercise/file/article thật (ngoài counter đã snapshot).
 *
 * Dùng:
 *   node scripts/seed-demo-activity.js --seed --yes      # chèn
 *   node scripts/seed-demo-activity.js --clean --yes     # gỡ sạch + khôi phục counter
 *   node scripts/seed-demo-activity.js --stats           # đếm nhanh seed hiện có
 *
 * Đọc MONGODB_URI từ backend/.env (Atlas production!). Bắt buộc --yes để chạy ghi.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
// Văn/đáp án mẫu KHỚP TỪNG ĐỀ tự luận (soạn tay). Xem essay-answers.js.
const { QUESTION_ANSWERS, EXERCISE_ESSAYS } = require('./essay-answers');

// ---- config (chỉnh ở đây nếu muốn nhiều/ít hơn) ----
const CFG = {
  students: 150,
  demoPassword: 'hocsinh123',
  // email học sinh mẫu: trông tự nhiên (không lộ là demo). Cờ gỡ sạch là `seeded:true`.
  emailProviders: ['gmail.com', 'gmail.com', 'gmail.com', 'yahoo.com', 'icloud.com'],
  // mỗi bài tập CÓ CÂU HỎI: số học sinh nộp (chọn ngẫu nhiên trong khoảng)
  submittersRange: [55, 110],
  // với lượt làm có chứa câu tự luận: tỉ lệ đã được giáo viên chấm (còn lại "chờ chấm")
  essayGradedRatio: 0.75,
  filesPerStudentRange: [5, 25], // số tài liệu mỗi HS tải/lưu
  saveRatio: 0.25, // trong đó tỉ lệ là "lưu" thay vì "tải"
  monthsBack: 8, // trải hoạt động trong ~8 tháng gần đây
};

const MARK = { seeded: true }; // cờ nhận diện

// ---------------- helpers ----------------
const args = process.argv.slice(2);
const has = (f) => args.includes(f);
const MODE = has('--clean') ? 'clean' : has('--stats') ? 'stats' : has('--seed') ? 'seed' : null;
const CONFIRMED = has('--yes');

function readUri() {
  const env = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8');
  const m = env.match(/^MONGODB_URI=(.*)$/m);
  if (!m) throw new Error('MONGODB_URI không có trong backend/.env');
  return m[1].trim();
}

const rand = (a, b) => a + Math.floor(Math.random() * (b - a + 1)); // int trong [a,b]
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const chance = (p) => Math.random() < p;

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const MS_DAY = 86400000;
function dateWithinMonths(months) {
  const days = months * 30;
  const back = Math.floor(Math.random() * days * MS_DAY);
  return new Date(Date.now() - back);
}
function jitterAfter(date, maxMinutes) {
  return new Date(date.getTime() + Math.floor(Math.random() * maxMinutes * 60000));
}

// năng lực học sinh (ẩn): 0.45..0.97 — HS giỏi làm đúng nhiều câu hơn, ổn định
function abilityFor() {
  return Math.round((0.45 + Math.random() * 0.52) * 100) / 100;
}
// xác suất làm đúng 1 câu = năng lực + nhiễu nhỏ, chặn trong [0.05, 0.99]
function willBeCorrect(ability) {
  const p = ability + (Math.random() - 0.5) * 0.25;
  return Math.random() < Math.max(0.05, Math.min(0.99, p));
}

/**
 * Sinh câu trả lời của HS cho 1 câu hỏi khách quan sao cho đúng/sai như `correct`.
 * Shape khớp comment trong student-question.schema + AttemptsService.gradeObjective.
 */
function answerFor(type, detail, correct) {
  switch (type) {
    case 'single': {
      const opts = detail.options || [];
      const ci = detail.correctOptionIndex;
      if (correct) return ci;
      const others = opts.map((_, i) => i).filter((i) => i !== ci);
      return others.length ? pick(others) : ci;
    }
    case 'multi': {
      const opts = detail.options || [];
      const ci = Array.isArray(detail.correctOptionIndices) ? detail.correctOptionIndices.slice() : [];
      if (correct) return ci.slice();
      // tạo tập KHÁC tập đúng: bỏ 1 phần tử hoặc thêm 1 phần tử sai
      const all = opts.map((_, i) => i);
      if (ci.length > 1 && chance(0.5)) return ci.slice(0, ci.length - 1); // thiếu 1
      const notIn = all.filter((i) => !ci.includes(i));
      if (notIn.length) return ci.concat(pick(notIn)); // dư 1
      return ci.slice(0, Math.max(0, ci.length - 1));
    }
    case 'truefalse': {
      return correct ? detail.isCorrect : !detail.isCorrect;
    }
    case 'fill': {
      const acc = Array.isArray(detail.answers) ? detail.answers : [];
      if (correct && acc.length) return [String(acc[0])];
      return ['(chưa trả lời đúng)'];
    }
    case 'number': {
      const acc = Array.isArray(detail.answers) ? detail.answers : [];
      if (correct && acc.length) return [String(acc[0])];
      return ['0'];
    }
    case 'sort': {
      const co = Array.isArray(detail.correctOrder) ? detail.correctOrder.slice() : [];
      if (correct) return co.slice();
      if (co.length >= 2) { const s = co.slice(); [s[0], s[1]] = [s[1], s[0]]; return s; }
      return co.slice();
    }
    case 'tableselection': {
      const ca = Array.isArray(detail.correctAnswers) ? detail.correctAnswers : [];
      if (correct) return ca.slice();
      const flip = ca.slice(); if (flip.length) flip[0] = !flip[0]; return flip;
    }
    case 'match': {
      const pairs = Array.isArray(detail.pairs) ? detail.pairs : [];
      const arr = pairs.map((p) => ({ left: p.left, right: p.right }));
      if (correct || arr.length < 2) return arr;
      const s = arr.map((x) => ({ ...x }));
      [s[0].right, s[1].right] = [s[1].right, s[0].right]; // hoán 2 vế phải -> sai
      return s;
    }
    default:
      return null;
  }
}

// đoạn văn mẫu cho câu tự luận (đủ dài, hợp ngữ cảnh Tiếng Việt tiểu học)
const ESSAY_TEXTS = [
  'Em rất thích câu chuyện này vì nó dạy em bài học về lòng nhân ái. Nhân vật chính tuy gặp nhiều khó khăn nhưng luôn cố gắng và biết giúp đỡ người khác. Qua đó em học được rằng cần sống chân thành và biết yêu thương mọi người xung quanh.',
  'Buổi sáng ở quê em thật đẹp. Ông mặt trời từ từ nhô lên sau rặng tre, những giọt sương còn đọng trên lá cỏ long lanh như hạt ngọc. Tiếng chim hót líu lo làm cho khu vườn thêm rộn ràng. Em yêu cảnh vật bình yên nơi đây.',
  'Người mà em yêu quý nhất là bà của em. Bà đã già, mái tóc bạc trắng nhưng đôi mắt vẫn hiền từ. Mỗi tối bà thường kể cho em nghe những câu chuyện cổ tích. Em mong bà luôn khỏe mạnh để ở bên em thật lâu.',
  'Chú mèo nhà em có bộ lông vàng mượt, đôi mắt tròn xoe long lanh. Mỗi khi em đi học về, chú lại chạy ra cọ vào chân em kêu meo meo. Em rất yêu chú mèo nhỏ đáng yêu này.',
  'Em cảm thấy rất vui và tự hào khi được tham gia buổi lao động cùng các bạn. Chúng em đã nhặt rác, tưới cây và làm cho sân trường sạch đẹp hơn. Qua đó em hiểu rằng mỗi người cần góp một phần công sức để giữ gìn môi trường.',
];

// ---------------- danh sách tên VN ----------------
const HO = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương', 'Lý', 'Đinh', 'Đoàn', 'Trịnh', 'Mai'];
const DEM_NU = ['Thị', 'Thị Ngọc', 'Thị Thu', 'Thị Minh', 'Thị Kim', 'Ngọc', 'Thu', 'Khánh', 'Phương', 'Hà'];
const DEM_NAM = ['Văn', 'Hữu', 'Đức', 'Minh', 'Quang', 'Bá', 'Công', 'Thành', 'Gia', 'Hoàng'];
const TEN_NU = ['An', 'Bình', 'Chi', 'Dung', 'Duyên', 'Giang', 'Hà', 'Hân', 'Hoa', 'Hương', 'Lan', 'Linh', 'Mai', 'My', 'Nga', 'Ngân', 'Ngọc', 'Nhi', 'Như', 'Oanh', 'Phương', 'Quỳnh', 'Thảo', 'Thanh', 'Thu', 'Trang', 'Trâm', 'Uyên', 'Vân', 'Yến', 'Diệp', 'Hằng', 'Khánh', 'Tiên'];
const TEN_NAM = ['An', 'Bảo', 'Bình', 'Cường', 'Dũng', 'Duy', 'Đạt', 'Đức', 'Hải', 'Hiếu', 'Hoàng', 'Huy', 'Khang', 'Khoa', 'Kiên', 'Lâm', 'Long', 'Minh', 'Nam', 'Nghĩa', 'Phong', 'Phúc', 'Quân', 'Quang', 'Sơn', 'Tài', 'Tâm', 'Thành', 'Tiến', 'Trung', 'Tuấn', 'Việt', 'Vinh', 'Bách'];

function noDiacritics(s) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
}

function makeStudent(i, hashed) {
  const nu = chance(0.55);
  const ho = pick(HO);
  const dem = nu ? pick(DEM_NU) : pick(DEM_NAM);
  const ten = nu ? pick(TEN_NU) : pick(TEN_NAM);
  const name = `${ho} ${dem} ${ten}`;
  const slug = noDiacritics(`${ten}${ho}`).toLowerCase().replace(/[^a-z]/g, '');
  const created = dateWithinMonths(CFG.monthsBack + 2);
  // email tự nhiên: tenho + số + provider; kèm i để chắc chắn không trùng
  const email = `${slug}${rand(1, 89)}${i}@${pick(CFG.emailProviders)}`;
  return {
    ...MARK,
    name,
    email,
    password: hashed,
    role: 'student',
    avatar: null,
    status: 'active',
    lastActiveAt: dateWithinMonths(1),
    emailVerified: true,
    provider: 'local',
    verifyToken: null, verifyExpires: null,
    resetPasswordToken: null, resetPasswordExpires: null,
    passwordChangedAt: null, failedLoginAttempts: 0, lockUntil: null,
    otpCode: null, otpExpires: null,
    createdAt: created,
    updatedAt: created,
  };
}

// ---------------- bài viết (nội dung mẫu) ----------------
const COVERS = ['clay', 'leaf', 'sun'];
const ARTICLES = [
  { cat: 'Hoạt động Viết', title: 'Dạy học sinh lập dàn ý bài văn miêu tả: từ quan sát đến câu chữ', tags: ['Hoạt động Viết', 'Dàn ý', 'Miêu tả'],
    excerpt: 'Một dàn ý tốt bắt đầu từ quan sát có chủ đích. Gợi ý các bước giúp học sinh lớp 4–5 chuyển điều quan sát được thành câu văn miêu tả sinh động.' },
  { cat: 'Hoạt động Viết', title: 'Mở bài và kết bài trong văn kể chuyện: những cách vào bài tự nhiên', tags: ['Hoạt động Viết', 'Kể chuyện', 'Mở bài'],
    excerpt: 'Học sinh thường lúng túng ở câu mở đầu. Bài viết giới thiệu vài kiểu mở bài, kết bài phù hợp với văn kể chuyện tiểu học và ví dụ minh hoạ.' },
  { cat: 'Hoạt động Viết', title: 'Giúp học sinh dùng từ ngữ gợi tả, gợi cảm khi viết đoạn văn', tags: ['Hoạt động Viết', 'Từ ngữ', 'Đoạn văn'],
    excerpt: 'Từ gợi tả, gợi cảm làm đoạn văn "có hồn" hơn. Một số hoạt động nhỏ giúp học sinh làm giàu vốn từ và biết chọn từ đúng ngữ cảnh.' },
  { cat: 'Hoạt động Viết', title: 'Sửa bài viết cùng học sinh: dùng bảng kiểm thay vì chỉ gạch lỗi', tags: ['Hoạt động Viết', 'Bảng kiểm', 'Tự đánh giá'],
    excerpt: 'Thay vì gạch đỏ chi chít, hãy để học sinh tự soi bài theo bảng kiểm. Cách làm này giúp các em hiểu vì sao cần sửa và tự chỉnh được lần sau.' },
  { cat: 'Hoạt động Viết', title: 'Viết đoạn văn nêu tình cảm, cảm xúc: gỡ khó cho học sinh e ngại bày tỏ', tags: ['Hoạt động Viết', 'Cảm xúc', 'Đoạn văn'],
    excerpt: 'Nhiều em ngại viết về cảm xúc vì sợ "sến" hoặc không biết bắt đầu. Vài gợi ý câu hỏi dẫn dắt giúp các em nói thật lòng mình một cách mạch lạc.' },
  { cat: 'Hoạt động Đọc', title: 'Đọc hiểu văn bản: đặt câu hỏi thế nào để học sinh suy nghĩ sâu hơn', tags: ['Hoạt động Đọc', 'Đọc hiểu', 'Câu hỏi'],
    excerpt: 'Câu hỏi đọc hiểu tốt không dừng ở "tìm chi tiết". Phân loại câu hỏi theo mức độ và cách nâng dần độ khó để rèn tư duy cho học sinh.' },
  { cat: 'Hoạt động Đọc', title: 'Đọc mở rộng ở tiểu học: chọn ngữ liệu và duy trì thói quen đọc', tags: ['Hoạt động Đọc', 'Đọc mở rộng', 'Ngữ liệu'],
    excerpt: 'Đọc mở rộng chỉ hiệu quả khi ngữ liệu vừa sức và cách tổ chức nhẹ nhàng. Kinh nghiệm chọn bài đọc và theo dõi tiến bộ của học sinh.' },
  { cat: 'Hoạt động Đọc', title: 'Rèn kĩ năng cảm thụ: hướng dẫn học sinh nói về cái hay của một câu thơ', tags: ['Hoạt động Đọc', 'Cảm thụ', 'Thơ'],
    excerpt: 'Cảm thụ không phải là "khen chung chung". Cách gợi mở để học sinh chỉ ra được hình ảnh, từ ngữ làm nên cái hay và diễn đạt thành câu.' },
  { cat: 'Giới thiệu học liệu', title: 'Kho học liệu Tiếng Việt 4–5: cách sắp xếp để dễ tìm khi lên lớp', tags: ['Kho học liệu', 'Tổ chức', 'Lớp 4', 'Lớp 5'],
    excerpt: 'Học liệu nhiều mà khó tìm thì cũng ít dùng. Cách gắn thẻ, phân thư mục theo hoạt động Đọc – Viết – Nói và nghe để lấy nhanh khi cần.' },
  { cat: 'Giới thiệu học liệu', title: 'Phiếu bài tập tự luyện: dùng thế nào cho vừa sức từng nhóm học sinh', tags: ['Kho học liệu', 'Phiếu học tập', 'Phân hoá'],
    excerpt: 'Cùng một phiếu bài tập có thể dùng linh hoạt cho nhiều nhóm. Gợi ý cách chia mức và giao bài để không em nào quá tải hoặc quá nhàn.' },
  { cat: 'Giới thiệu học liệu', title: 'Dùng sơ đồ tư duy trong giờ Tiếng Việt: ôn tập và hệ thống kiến thức', tags: ['Kho học liệu', 'Sơ đồ tư duy', 'Ôn tập'],
    excerpt: 'Sơ đồ tư duy giúp học sinh nhìn thấy mối liên hệ giữa các phần. Vài mẫu sơ đồ cho ôn tập từ loại, cấu trúc bài văn và ý chính bài đọc.' },
  { cat: 'Kinh nghiệm dạy học', title: 'Đánh giá bài viết theo thang Likert 4 mức: hiểu đúng và chấm công bằng', tags: ['Đánh giá', 'Rubric', 'Likert'],
    excerpt: 'Thang Likert 4 mức giúp việc chấm bài viết minh bạch hơn. Cách hiểu từng mức và tránh "cảm tính" khi cho điểm học sinh.' },
  { cat: 'Kinh nghiệm dạy học', title: 'Nhận xét bài làm sao cho học sinh muốn sửa: lời khen và lời góp ý', tags: ['Đánh giá', 'Nhận xét', 'Động lực'],
    excerpt: 'Một lời nhận xét đúng chỗ có sức nặng hơn nhiều lời chê. Cân bằng giữa ghi nhận nỗ lực và chỉ ra điểm cần chỉnh cho học sinh tiểu học.' },
  { cat: 'Kinh nghiệm dạy học', title: 'Tổ chức giờ Nói và nghe: để mọi học sinh đều được lên tiếng', tags: ['Nói và nghe', 'Tổ chức lớp', 'Kĩ năng'],
    excerpt: 'Giờ Nói và nghe dễ thành sân khấu của vài em mạnh dạn. Vài cách chia nhóm, giao vai để cả lớp cùng tham gia và tự tin hơn.' },
  { cat: 'Kinh nghiệm dạy học', title: 'Giao bài và theo dõi tiến bộ trên hệ thống: quy trình gọn cho giáo viên', tags: ['Giao bài', 'Theo dõi', 'Hệ thống'],
    excerpt: 'Giao bài tập, thu bài và nhìn lại kết quả cả lớp chỉ trong vài bước. Chia sẻ một quy trình sử dụng hệ thống nhẹ nhàng, ít thao tác.' },
  { cat: 'Giới thiệu học liệu', title: 'Trò chơi học tập trong giờ Tiếng Việt: học mà chơi, chơi mà học', tags: ['Kho học liệu', 'Trò chơi học tập', 'Tạo hứng thú'],
    excerpt: 'Trò chơi ngắn đầu hoặc cuối giờ giúp lớp học nhẹ nhàng mà vẫn củng cố kiến thức. Một vài trò dễ tổ chức, ít chuẩn bị cho lớp 4–5.' },
];

function articleContent(a) {
  // nội dung mạch lạc, không phải lorem — vài đoạn xoay quanh excerpt
  return [
    a.excerpt,
    'Trong thực tế lên lớp ở tiểu học, điều quan trọng không phải là làm thật nhiều mà là làm đúng trọng tâm và vừa sức học sinh. Giáo viên nên bắt đầu từ những gì các em đã có, rồi mở rộng dần từng bước nhỏ.',
    'Có thể chia hoạt động thành ba nhịp: khơi gợi để học sinh có hứng thú và huy động vốn hiểu biết; hướng dẫn mẫu để các em nắm cách làm; và luyện tập – vận dụng để các em tự làm được. Ở mỗi nhịp, giáo viên quan sát và điều chỉnh cho phù hợp với lớp mình.',
    'Cuối cùng, hãy để học sinh nhìn lại việc mình đã làm: các em tự nhận ra điểm được, điểm cần cố gắng thì sẽ tiến bộ bền hơn là chỉ nghe nhận xét từ thầy cô. Bộ học liệu và các phiếu tự luyện trong kho có thể dùng linh hoạt để hỗ trợ cho quá trình này.',
  ].join('\n\n');
}

function makeArticle(a, adminId) {
  const created = dateWithinMonths(CFG.monthsBack);
  return {
    ...MARK,
    userId: adminId,
    title: a.title,
    slug: null,
    excerpt: a.excerpt,
    content: articleContent(a),
    images: [],
    category: a.cat,
    cover: pick(COVERS),
    tags: a.tags,
    isPublished: true,
    isFeatured: chance(0.2),
    viewCount: rand(80, 1200),
    readMinutes: rand(3, 6),
    createdAt: created,
    updatedAt: created,
  };
}

// ---------------- main ----------------
async function main() {
  if (!MODE) {
    console.log('Chỉ định --seed | --clean | --stats. Ghi cần thêm --yes.');
    process.exit(1);
  }
  const uri = readUri();
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const dbName = db.databaseName;
  console.log(`Kết nối DB: ${dbName}`);

  // Gồm cả câu essay + link tổng hợp gắn vào 16 bài "Đề bài" (đều mang cờ seeded).
  const SEEDED_COLS = ['users', 'attempts', 'submissions', 'participants', 'student-questions',
    'questions', 'essay-questions', 'exercise-questions', 'downloads', 'articles'];

  if (MODE === 'stats') {
    for (const c of SEEDED_COLS) {
      console.log(c.padEnd(14), await db.collection(c).countDocuments({ seeded: true }));
    }
    const bk = await db.collection('_seed_backup').countDocuments();
    console.log('_seed_backup   ', bk, '(counter đã snapshot)');
    await mongoose.disconnect();
    return;
  }

  if (!CONFIRMED) {
    console.log('Thiếu --yes. Đây là DB production, cần xác nhận rõ để ghi.');
    process.exit(1);
  }

  if (MODE === 'clean') {
    for (const c of SEEDED_COLS) {
      const r = await db.collection(c).deleteMany({ seeded: true });
      console.log(`xoá ${c}: ${r.deletedCount}`);
    }
    // khôi phục counter từ snapshot
    const backups = await db.collection('_seed_backup').find({}).toArray();
    let restored = 0;
    for (const b of backups) {
      await db.collection(b.col).updateOne({ _id: b.docId }, { $set: b.fields });
      restored++;
    }
    await db.collection('_seed_backup').deleteMany({});
    console.log(`khôi phục counter: ${restored} doc`);
    console.log('Đã gỡ sạch seed.');
    await mongoose.disconnect();
    return;
  }

  // ---- MODE === 'seed' ----
  const existing = await db.collection('users').countDocuments({ seeded: true });
  if (existing > 0) {
    console.log(`Đã có ${existing} user seed. Chạy --clean trước nếu muốn seed lại. Dừng.`);
    await mongoose.disconnect();
    process.exit(1);
  }

  const admin = await db.collection('users').findOne({ role: 'admin' });
  if (!admin) throw new Error('Không tìm thấy admin để gán làm tác giả bài viết.');

  // 1) Học sinh
  console.log(`\n[1/5] Tạo ${CFG.students} học sinh mẫu...`);
  const hashed = await bcrypt.hash(CFG.demoPassword, 10);
  const students = Array.from({ length: CFG.students }, (_, i) => makeStudent(i + 1, hashed));
  const insStudents = await db.collection('users').insertMany(students, { ordered: false });
  const studentIds = Object.values(insStudents.insertedIds);
  console.log(`   -> ${studentIds.length} học sinh (mật khẩu demo: ${CFG.demoPassword})`);

  const insertBatched = async (col, docs) => {
    for (let i = 0; i < docs.length; i += 1000) {
      if (docs.slice(i, i + 1000).length) await db.collection(col).insertMany(docs.slice(i, i + 1000), { ordered: false });
    }
  };

  // 2) Hoạt động làm bài — CHỈ trên bài tập CÓ CÂU HỎI, sinh student-questions thật
  //    và tính submission y hệt AttemptsService (điểm quy về thang academic.scoreScale).
  console.log('\n[2/5] Tạo lượt làm bài (kèm bài làm từng câu) trên bài tập có câu hỏi...');

  // academic policy (giống getAcademicPolicy trong AttemptsService)
  const settingsDoc = await db.collection('settings').findOne({ key: 'system' });
  const acad = (settingsDoc && settingsDoc.academic) || {};
  const policy = {
    scoreScale: typeof acad.scoreScale === 'number' ? acad.scoreScale : 10,
    passThreshold: typeof acad.passThreshold === 'number' ? acad.passThreshold : 5,
    rounding: typeof acad.rounding === 'string' ? acad.rounding : 'none',
  };
  const applyRounding = (s) => {
    if (policy.rounding === 'half') return Math.round(s * 2) / 2;
    if (policy.rounding === 'integer') return Math.round(s);
    return Math.round(s * 100) / 100;
  };
  console.log(`   policy: scale=${policy.scoreScale} pass=${policy.passThreshold} rounding=${policy.rounding}`);

  const exercises = await db.collection('exercises').find({}).toArray();
  // nạp chi tiết câu hỏi cho từng bài (chỉ bài có exercise-questions)
  const detailCols = {
    single: 'single-choice-questions', multi: 'multiple-choice-questions',
    truefalse: 'true-false-questions', fill: 'short-answer-questions',
    essay: 'essay-questions', number: 'number-questions', sort: 'sort-questions',
    match: 'match-questions', tableselection: 'table-selection-questions',
  };
  const detailCache = {}; // questionId -> detail
  async function loadQuestions(qIds) {
    const qs = await db.collection('questions').find({ _id: { $in: qIds } }).toArray();
    for (const q of qs) {
      if (detailCache[String(q._id)] === undefined) {
        const col = detailCols[q.type];
        detailCache[String(q._id)] = col ? await db.collection(col).findOne({ questionId: q._id }) : null;
      }
    }
    return qs;
  }

  // Bài "Đề bài" tự luận (type=essay) hiện có 0 câu hỏi -> không nộp/chấm được.
  // Tạo 1 câu tự luận (seeded) = chính đề bài cho mỗi bài, để có thể nộp bài & chấm theo rubric.
  let addedEssayQ = 0;
  for (const ex of exercises) {
    if (ex.type !== 'essay') continue;
    if (!EXERCISE_ESSAYS[String(ex._id)]) continue; // chỉ bài đã soạn văn mẫu
    const hasLinks = await db.collection('exercise-questions').countDocuments({ exerciseId: ex._id });
    if (hasLinks > 0) continue;
    const qId = new mongoose.Types.ObjectId();
    const dId = new mongoose.Types.ObjectId();
    const useRubric = !!ex.rubricId;
    const now = dateWithinMonths(CFG.monthsBack + 1);
    await db.collection('essay-questions').insertOne({
      ...MARK, _id: dId, questionId: qId,
      gradingType: useRubric ? 'rubric' : 'manual',
      rubricId: useRubric ? ex.rubricId : null,
      instructions: [], guideAnswer: null, allowUploadFiles: false, maxFileSize: 0, maxFileCount: 0,
      createdAt: now, updatedAt: now,
    });
    await db.collection('questions').insertOne({
      ...MARK, _id: qId, userId: admin._id, topicId: null,
      title: null, content: ex.title, type: 'essay', level: 'medium', tags: [],
      questionDetail: dId, questionModel: 'EssayQuestion',
      subject: 'Tiếng Việt', grade: ex.grade || 'Lớp 4–5', uses: 0,
      createdAt: now, updatedAt: now,
    });
    await db.collection('exercise-questions').insertOne({
      ...MARK, _id: new mongoose.Types.ObjectId(), exerciseId: ex._id, questionId: qId,
      order: 0, grades: ex.points || 10, createdAt: now, updatedAt: now,
    });
    addedEssayQ++;
  }
  console.log(`   -> thêm ${addedEssayQ} câu tự luận cho bài "Đề bài" (seeded, có thể nộp/chấm)`);

  const attempts = [], participants = [], submissions = [], studentQuestions = [];
  const exViewBump = []; // {docId, orig, next}
  let withQuestions = 0, skippedNoQ = 0;

  for (const ex of exercises) {
    const links = await db.collection('exercise-questions').find({ exerciseId: ex._id }).toArray();
    if (!links.length) { skippedNoQ++; continue; } // bài không có câu hỏi -> không tạo bài làm
    withQuestions++;
    const qs = await loadQuestions(links.map((l) => l.questionId));
    const qById = new Map(qs.map((q) => [String(q._id), q]));
    const pointsByQ = new Map(links.map((l) => [String(l.questionId), l.grades != null ? l.grades : 1]));
    const maxRaw = links.reduce((s, l) => s + (l.grades != null ? l.grades : 1), 0);
    const orderedQIds = links.slice().sort((a, b) => (a.order || 0) - (b.order || 0)).map((l) => l.questionId);
    const hasEssay = qs.some((q) => q.type === 'essay');

    const n = Math.min(rand(...CFG.submittersRange), studentIds.length);
    const chosen = shuffle(studentIds).slice(0, n);

    for (const sid of chosen) {
      const attemptId = new mongoose.Types.ObjectId();
      const start = dateWithinMonths(CFG.monthsBack);
      const submittedAt = jitterAfter(start, 30);
      const ability = abilityFor();
      // lượt làm có câu tự luận: quyết định đã chấm hay chờ chấm
      const essayGradedThisAttempt = hasEssay ? chance(CFG.essayGradedRatio) : true;

      attempts.push({
        ...MARK, _id: attemptId, exerciseId: ex._id, studentId: sid, sessionId: null,
        attemptNumber: 1, isSelected: true, submittedAt, anonymousExpiresAt: null,
        createdAt: start, updatedAt: submittedAt,
      });
      participants.push({
        ...MARK, _id: new mongoose.Types.ObjectId(), studentId: sid, sessionId: null,
        attemptId, joinedAt: start, startedAt: start, endedAt: submittedAt,
        isFinished: true, isBanned: false, createdAt: start, updatedAt: submittedAt,
      });

      let correct = 0, wrong = 0, notComplete = 0, waitingGrades = 0;
      let numberOfEssays = 0, multipleChoiceGrades = 0, essayGrades = null;

      for (const qid of orderedQIds) {
        const q = qById.get(String(qid));
        if (!q) continue;
        const detail = detailCache[String(qid)] || {};
        const maxPoints = pointsByQ.get(String(qid)) ?? 1;
        const sq = {
          ...MARK, _id: new mongoose.Types.ObjectId(), attemptId, questionId: qid, studentId: sid,
          answer: null, isCorrect: null, grades: null, feedback: null, shuffledOptionIndices: [],
          createdAt: submittedAt, updatedAt: submittedAt,
        };

        if (q.type === 'essay') {
          // đáp án KHỚP TỪNG ĐỀ: câu quiz -> QUESTION_ANSWERS[qid]; bài "Đề bài" -> EXERCISE_ESSAYS[exId]
          const pool = QUESTION_ANSWERS[String(qid)] || EXERCISE_ESSAYS[String(ex._id)] || ESSAY_TEXTS;
          sq.answer = { text: pick(pool), fileUrls: [] };
          numberOfEssays += 1;
          notComplete += 1; // essay: isCorrect = null -> tính vào notComplete (giống service)
          if (essayGradedThisAttempt) {
            const ratio = Math.max(0.3, Math.min(1, ability + (Math.random() - 0.5) * 0.2));
            const g = Math.round(ratio * maxPoints * 2) / 2; // làm tròn 0.5
            sq.grades = g;
            essayGrades = (essayGrades ?? 0) + g;
            sq.updatedAt = jitterAfter(submittedAt, 60 * 24 * 3);
          } else {
            waitingGrades += 1; // chờ chấm
          }
        } else {
          const isC = willBeCorrect(ability);
          sq.answer = answerFor(q.type, detail, isC);
          sq.isCorrect = isC;
          sq.grades = isC ? maxPoints : 0;
          if (isC) correct += 1; else wrong += 1;
          multipleChoiceGrades += sq.grades;
        }
        studentQuestions.push(sq);
      }

      const graded = waitingGrades === 0;
      const sub = {
        ...MARK, attemptId, correct, wrong, notComplete, waitingGrades,
        numberOfEssays, multipleChoiceGrades, essayGrades,
        submittedAt, submissionCount: 1, isGraded: graded,
        totalScore: null, percent: null, isPassed: null,
        feedback: null, gradedBy: null, gradedAt: null,
        createdAt: submittedAt, updatedAt: submittedAt,
      };
      if (graded) {
        const rawEarned = (multipleChoiceGrades || 0) + (essayGrades || 0);
        let scaled = maxRaw > 0 ? (rawEarned / maxRaw) * policy.scoreScale : 0;
        scaled = Math.max(0, Math.min(policy.scoreScale, applyRounding(scaled)));
        sub.totalScore = scaled;
        sub.percent = maxRaw > 0 ? Math.round((rawEarned / maxRaw) * 100) : 0;
        sub.isPassed = scaled >= policy.passThreshold;
        if (hasEssay) { // đã có chấm tay -> ghi người/lúc chấm
          sub.gradedBy = admin._id;
          sub.gradedAt = jitterAfter(submittedAt, 60 * 24 * 3);
          sub.updatedAt = sub.gradedAt;
          sub.feedback = pick(['Bài làm tốt, cần chú ý chính tả.', 'Diễn đạt rõ ràng.', 'Ý đủ nhưng cần thêm chi tiết.', 'Có tiến bộ.', null]);
        }
      }
      submissions.push(sub);
    }

    // viewCount bài tập: nhiều hơn số nộp (có người xem không làm)
    const orig = ex.viewCount || 0;
    const next = orig + Math.round(n * (1.3 + Math.random() * 1.2)) + rand(5, 40);
    exViewBump.push({ docId: ex._id, orig, next });
  }

  await insertBatched('attempts', attempts);
  await insertBatched('participants', participants);
  await insertBatched('submissions', submissions);
  await insertBatched('student-questions', studentQuestions);
  console.log(`   -> ${withQuestions} bài có câu hỏi (bỏ qua ${skippedNoQ} bài không có câu hỏi)`);
  console.log(`   -> attempts: ${attempts.length}, submissions: ${submissions.length}, student-questions: ${studentQuestions.length}`);

  // snapshot + bump viewCount cho MỌI bài tập (kể cả bài không có câu hỏi — vẫn có lượt xem)
  for (const ex of exercises) {
    if (exViewBump.find((b) => String(b.docId) === String(ex._id))) continue;
    const orig = ex.viewCount || 0;
    exViewBump.push({ docId: ex._id, orig, next: orig + rand(8, 60) });
  }
  for (const b of exViewBump) {
    await db.collection('_seed_backup').insertOne({ col: 'exercises', docId: b.docId, fields: { viewCount: b.orig } });
    await db.collection('exercises').updateOne({ _id: b.docId }, { $set: { viewCount: b.next } });
  }
  console.log(`   -> bump viewCount cho ${exViewBump.length} bài tập (đã snapshot)`);

  // 3) Lượt tải / lưu tài liệu trên file THẬT
  console.log('\n[3/5] Tạo lượt tải/lưu tài liệu...');
  const files = await db.collection('files').find({ isPublic: true }, { projection: { _id: 1, downloadCount: 1, viewCount: 1 } }).toArray();
  const fileIds = files.map((f) => f._id);
  const downloads = [];
  const dlCountByFile = {}; // fileId -> số lượt 'download'
  for (const sid of studentIds) {
    const k = Math.min(rand(...CFG.filesPerStudentRange), fileIds.length);
    const chosenFiles = shuffle(fileIds).slice(0, k);
    for (const fid of chosenFiles) {
      const kind = chance(CFG.saveRatio) ? 'save' : 'download';
      const created = dateWithinMonths(CFG.monthsBack);
      downloads.push({ ...MARK, userId: sid, fileId: fid, kind, createdAt: created, updatedAt: created });
      if (kind === 'download') dlCountByFile[String(fid)] = (dlCountByFile[String(fid)] || 0) + 1;
    }
  }
  await insertBatched('downloads', downloads);
  console.log(`   -> ${downloads.length} lượt tải/lưu`);

  // snapshot + bump counter file
  let bumpedFiles = 0;
  for (const f of files) {
    const dl = dlCountByFile[String(f._id)] || 0;
    if (dl === 0 && chance(0.5)) continue; // vài file không có lượt cũng tự nhiên
    const origDl = f.downloadCount || 0;
    const origView = f.viewCount || 0;
    const nextDl = origDl + dl;
    const nextView = origView + Math.round((nextDl + 1) * (2 + Math.random() * 4)) + rand(3, 30);
    await db.collection('_seed_backup').insertOne({ col: 'files', docId: f._id, fields: { downloadCount: origDl, viewCount: origView } });
    await db.collection('files').updateOne({ _id: f._id }, { $set: { downloadCount: nextDl, viewCount: nextView } });
    bumpedFiles++;
  }
  console.log(`   -> bump counter cho ${bumpedFiles} tài liệu (đã snapshot)`);

  // 4) Bài viết mới (nội dung mẫu)
  console.log('\n[4/5] Tạo bài viết mẫu...');
  const articles = ARTICLES.map((a) => makeArticle(a, admin._id));
  await db.collection('articles').insertMany(articles, { ordered: false });
  console.log(`   -> ${articles.length} bài viết`);

  // 5) tổng kết
  console.log('\n[5/5] Xong. Tổng kết seed:');
  for (const c of SEEDED_COLS) {
    console.log('  ', c.padEnd(14), await db.collection(c).countDocuments({ seeded: true }));
  }
  console.log('\nGỡ sạch bất cứ lúc nào:  node scripts/seed-demo-activity.js --clean --yes');
  await mongoose.disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
