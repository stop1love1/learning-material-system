// db.ts — domain mock data for the Vườn Văn LMS (môn Ngữ văn / Tiếng Việt Tiểu
// học, lớp 1–5). Ported from data.jsx; the prototype's global `DB` is now a
// mutable module-level object that store.ts mutates and persists.

// Records are intentionally loosely typed: the live store (store.ts) adds fields
// (uses, submitted, graded, status, score, downloads, …) at runtime.
type Rec = Record<string, any>;

const TEACHER: Rec = { name: 'Cô Mai Anh', email: 'maianh@vuonvan.vn', role: 'Giáo viên Tiểu học' };

const QTYPES: Rec[] = [
  { id: 'single', label: 'Trắc nghiệm 1 đáp án', icon: 'checkCircle', short: '1 đáp án' },
  { id: 'multi', label: 'Trắc nghiệm nhiều đáp án', icon: 'check', short: 'Nhiều đáp án' },
  { id: 'truefalse', label: 'Đúng / Sai', icon: 'target', short: 'Đúng/Sai' },
  { id: 'fill', label: 'Điền khuyết', icon: 'pen', short: 'Điền khuyết' },
  { id: 'essay', label: 'Tự luận (tập làm văn)', icon: 'docs', short: 'Tự luận' },
  { id: 'match', label: 'Nối / kéo thả', icon: 'link', short: 'Nối/kéo thả' },
];

const LEVELS: Rec[] = [
  { id: 'easy', label: 'Nhận biết', color: '#4f8a44' },
  { id: 'medium', label: 'Thông hiểu', color: '#b4842a' },
  { id: 'hard', label: 'Vận dụng', color: '#b35338' },
];

const QUESTIONS: Rec[] = [
  { id: 'q1', type: 'single', level: 'easy', topic: 'Tác giả – Tác phẩm', uses: 17, updated: '2 ngày trước', author: 'Cô Mai Anh',
    stem: 'Truyện “Dế Mèn phiêu lưu ký” là sáng tác của nhà văn nào?',
    options: ['Tô Hoài', 'Trần Đăng Khoa', 'Phạm Hổ', 'Võ Quảng'], answer: [0] },
  { id: 'q2', type: 'multi', level: 'medium', topic: 'Luyện từ và câu', uses: 9, updated: 'Hôm qua', author: 'Cô Mai Anh',
    stem: 'Trong các từ sau, những từ nào là từ láy?',
    options: ['lung linh', 'bàn ghế', 'rì rào', 'học sinh'], answer: [0, 2] },
  { id: 'q3', type: 'truefalse', level: 'easy', topic: 'Biện pháp tu từ', uses: 24, updated: '5 ngày trước', author: 'Thầy Quang Đức',
    stem: 'Câu “Ông mặt trời tươi cười nhô lên sau rặng tre” đã sử dụng biện pháp nhân hoá.', answer: [0] },
  { id: 'q4', type: 'fill', level: 'medium', topic: 'Tập đọc – Thơ', uses: 6, updated: 'Hôm nay', author: 'Cô Mai Anh',
    stem: 'Điền từ còn thiếu trong bài thơ “Hạt gạo làng ta” (Trần Đăng Khoa): “Hạt gạo làng ta / Có vị ___ sa / Của sông Kinh Thầy.”', answer: ['phù'] },
  { id: 'q5', type: 'essay', level: 'hard', topic: 'Tập làm văn', uses: 4, updated: '1 tuần trước', author: 'Cô Mai Anh',
    stem: 'Em hãy viết một đoạn văn ngắn (khoảng 5–7 câu) tả một con vật nuôi trong nhà mà em yêu thích.' },
  { id: 'q6', type: 'match', level: 'medium', topic: 'Tác giả – Tác phẩm', uses: 13, updated: '3 ngày trước', author: 'Cô Mai Anh',
    stem: 'Nối tác phẩm với tác giả tương ứng.',
    pairs: [['Tre Việt Nam', 'Nguyễn Duy'], ['Dế Mèn phiêu lưu ký', 'Tô Hoài'], ['Hạt gạo làng ta', 'Trần Đăng Khoa'], ['Truyện cổ nước mình', 'Lâm Thị Mỹ Dạ']] },
  { id: 'q7', type: 'single', level: 'hard', topic: 'Đọc hiểu', uses: 7, updated: '4 ngày trước', author: 'Thầy Quang Đức',
    stem: 'Trong truyện ngụ ngôn “Rùa và Thỏ”, vì sao Thỏ lại thua cuộc?',
    options: ['Vì Thỏ chạy chậm hơn Rùa', 'Vì Thỏ chủ quan, ngủ quên giữa đường', 'Vì đường đua quá dài', 'Vì Rùa đi đường tắt'], answer: [1] },
  { id: 'q8', type: 'truefalse', level: 'easy', topic: 'Chính tả', uses: 19, updated: '6 ngày trước', author: 'Cô Mai Anh',
    stem: 'Từ “ngả nghiêng” được viết đúng chính tả.', answer: [0] },
];

const DOCS: Rec[] = [
  { id: 'd1', name: 'Giáo án Tập đọc “Dế Mèn bênh vực kẻ yếu” (lớp 4)', type: 'doc', size: '2,4 MB', folder: 'Giáo án', updated: '2 ngày trước', by: 'Cô Mai Anh', downloads: 142 },
  { id: 'd2', name: 'Sơ đồ tư duy truyện “Sự tích Hồ Gươm”', type: 'image', size: '3,1 MB', folder: 'Kể chuyện', updated: 'Hôm qua', by: 'Cô Mai Anh', downloads: 88 },
  { id: 'd3', name: 'Audio đọc diễn cảm bài thơ “Tre Việt Nam” — Nguyễn Duy', type: 'audio', size: '12,2 MB', folder: 'Thơ', updated: '4 ngày trước', by: 'Thầy Quang Đức', downloads: 65 },
  { id: 'd4', name: 'Video bài giảng — Luyện từ và câu: Biện pháp nhân hoá', type: 'video', size: '64,5 MB', folder: 'Luyện từ & câu', updated: '1 tuần trước', by: 'Cô Mai Anh', downloads: 51 },
  { id: 'd5', name: 'Đề thi học kì II môn Tiếng Việt lớp 5 (có đáp án)', type: 'pdf', size: '3,7 MB', folder: 'Đề thi', updated: 'Hôm nay', by: 'Cô Mai Anh', downloads: 233 },
  { id: 'd6', name: 'Tuyển tập bài văn mẫu tả người (lớp 4–5)', type: 'pdf', size: '4,9 MB', folder: 'Tập làm văn', updated: '3 ngày trước', by: 'Cô Mai Anh', downloads: 197 },
  { id: 'd7', name: 'Hướng dẫn viết đoạn văn tả cảnh (slide)', type: 'slide', size: '6,8 MB', folder: 'Tập làm văn', updated: '5 ngày trước', by: 'Thầy Quang Đức', downloads: 120 },
  { id: 'd8', name: 'Bảng tổng hợp từ loại: danh từ – động từ – tính từ', type: 'image', size: '1,2 MB', folder: 'Luyện từ & câu', updated: '1 tuần trước', by: 'Cô Mai Anh', downloads: 174 },
];

const DOC_FOLDERS = ['Tất cả', 'Giáo án', 'Tập đọc', 'Thơ', 'Luyện từ & câu', 'Tập làm văn', 'Đề thi', 'Chính tả', 'Kể chuyện'];

const DOWNLOADS: string[] = ['d5', 'd6', 'd2'];

const RUBRICS: Rec[] = [
  { id: 'r1', name: 'Rubric Tập làm văn (tả – kể)', used: 8, levels: 4, criteria: [
      { name: 'Bố cục bài văn', weight: 20, desc: 'Có đủ mở bài – thân bài – kết bài rõ ràng' },
      { name: 'Nội dung & ý tưởng', weight: 35, desc: 'Tả/kể sinh động, đủ ý, biết bộc lộ cảm xúc' },
      { name: 'Dùng từ & đặt câu', weight: 25, desc: 'Từ ngữ phù hợp, câu đúng ngữ pháp, có hình ảnh' },
      { name: 'Chữ viết & chính tả', weight: 20, desc: 'Trình bày sạch đẹp, ít lỗi chính tả' },
    ],
    scale: [
      { label: 'Xuất sắc', pct: 100 }, { label: 'Tốt', pct: 80 },
      { label: 'Đạt', pct: 60 }, { label: 'Cần cố gắng', pct: 40 },
    ] },
  { id: 'r2', name: 'Rubric Kể chuyện', used: 5, levels: 3, criteria: [
      { name: 'Nội dung câu chuyện', weight: 35, desc: 'Kể đúng, đủ tình tiết, có ý nghĩa' },
      { name: 'Lời kể & diễn đạt', weight: 40, desc: 'Kể mạch lạc, tự nhiên, hấp dẫn' },
      { name: 'Bài học rút ra', weight: 25, desc: 'Nêu được ý nghĩa, liên hệ bản thân' },
    ],
    scale: [{ label: 'Tốt', pct: 100 }, { label: 'Khá', pct: 70 }, { label: 'Cần luyện thêm', pct: 40 }] },
  { id: 'r3', name: 'Rubric Đọc diễn cảm', used: 3, levels: 4, criteria: [
      { name: 'Đọc đúng, rõ tiếng', weight: 40, desc: '' },
      { name: 'Ngắt nghỉ & giọng đọc', weight: 30, desc: '' },
      { name: 'Diễn cảm & truyền cảm xúc', weight: 30, desc: '' },
    ],
    scale: [{ label: 'Xuất sắc', pct: 100 }, { label: 'Tốt', pct: 80 }, { label: 'Đạt', pct: 60 }, { label: 'Cần cố gắng', pct: 30 }] },
];

const ASSIGNMENTS: Rec[] = [
  { id: 'a1', title: 'Trắc nghiệm — Đọc hiểu “Dế Mèn bênh vực kẻ yếu”', classId: 'c1', class: 'TV5A1', type: 'Trắc nghiệm',
    due: '24/06 · 21:00', dueIn: 'Còn 2 ngày', submitted: 24, total: 35, graded: 14, status: 'open', points: 10, questions: 12 },
  { id: 'a2', title: 'Tập làm văn — Tả con vật nuôi em yêu thích', classId: 'c1', class: 'TV5A1', type: 'Tự luận',
    due: '26/06 · 21:00', dueIn: 'Còn 4 ngày', submitted: 17, total: 35, graded: 0, status: 'open', points: 10, rubric: 'r1', questions: 1 },
  { id: 'a3', title: 'Trắc nghiệm — Luyện từ và câu: Từ láy, từ ghép', classId: 'c2', class: 'TV4A3', type: 'Trắc nghiệm',
    due: '22/06 · 21:00', dueIn: 'Hôm nay', submitted: 38, total: 38, graded: 33, status: 'closing', points: 10, questions: 10 },
  { id: 'a4', title: 'Tập làm văn — Kể về một việc tốt em đã làm', classId: 'c4', class: 'CLB-VH', type: 'Nộp tệp',
    due: '28/06 · 21:00', dueIn: 'Còn 6 ngày', submitted: 7, total: 24, graded: 0, status: 'open', points: 10, rubric: 'r2', questions: 1 },
  { id: 'a5', title: 'Kiểm tra 15 phút — Chính tả & từ loại', classId: 'c1', class: 'TV5A1', type: 'Trắc nghiệm',
    due: '20/06 · 21:00', dueIn: 'Đã đóng', submitted: 34, total: 35, graded: 34, status: 'done', points: 10, questions: 15 },
];

const SUBMISSIONS: Rec[] = [
  { id: 'sub1', assignmentId: 'a2', studentId: 's3', name: 'Lê Thị Phương', code: 'HS2403', at: '24/06 · 21:10', status: 'ungraded', wordcount: 132,
    text: 'Nhà em nuôi một chú mèo tam thể rất đáng yêu, em đặt tên nó là Mướp. Mướp có bộ lông ba màu vàng, đen, trắng mượt như nhung. Đôi mắt tròn xoe long lanh như hai hòn bi ve. Mỗi khi em đi học về, Mướp lại chạy ra cọ đầu vào chân em rồi kêu meo meo như đang chào đón. Buổi tối, Mướp nằm cuộn tròn bên cạnh em ngủ rất ngoan. Em rất yêu chú mèo nhỏ của mình và luôn chăm sóc nó thật cẩn thận.' },
  { id: 'sub2', assignmentId: 'a2', studentId: 's1', name: 'Nguyễn Thu Hà', code: 'HS2401', at: '24/06 · 19:42', status: 'ungraded', wordcount: 110,
    text: 'Con vật em yêu thích nhất là chú chó nhỏ tên Vàng. Vàng có bộ lông màu vàng óng, hai tai vểnh lên trông rất tinh nghịch. Cái đuôi của nó lúc nào cũng ngoe nguẩy mỗi khi thấy em. Vàng rất khôn, nó biết trông nhà và sủa to khi có người lạ. Em thường cho Vàng ăn và dắt nó đi dạo mỗi buổi chiều. Em coi Vàng như một người bạn thân thiết trong gia đình.' },
  { id: 'sub3', assignmentId: 'a2', studentId: 's7', name: 'Đỗ Hải Yến', code: 'HS2407', at: '24/06 · 18:05', status: 'graded', score: 9.2, wordcount: 145,
    text: 'Trong vườn nhà bà, em thích nhất là chú gà trống choai. Chú khoác trên mình bộ lông nhiều màu rực rỡ, chiếc mào đỏ tươi như bông hoa. Sáng nào chú cũng nhảy lên đống rơm, vỗ cánh phành phạch rồi cất tiếng gáy “ò ó o” vang khắp xóm để đánh thức mọi người. Đôi chân chú có cựa sắc và những ngón chân khoẻ để bới đất tìm giun. Em rất quý chú gà trống vì chú chăm chỉ và là chiếc đồng hồ báo thức của cả nhà.' },
  { id: 'sub4', assignmentId: 'a2', studentId: 's2', name: 'Trần Văn Minh', code: 'HS2402', at: '24/06 · 22:30', status: 'ungraded', wordcount: 88,
    text: 'Em có nuôi một con cá vàng trong bể kính. Con cá có màu vàng cam rất đẹp. Nó bơi đi bơi lại trong bể trông rất vui mắt. Mỗi ngày em đều cho cá ăn hai lần. Em rất thích ngắm con cá vàng của em bơi lội. Em sẽ chăm sóc nó thật tốt.' },
  { id: 'sub5', assignmentId: 'a2', studentId: 's5', name: 'Hoàng Mỹ Linh', code: 'HS2405', at: '23/06 · 20:15', status: 'graded', score: 7.6, wordcount: 102,
    text: 'Nhà em có một chú vẹt rất thông minh. Chú vẹt có bộ lông xanh biếc và chiếc mỏ khoằm màu đỏ. Chú biết bắt chước tiếng người, mỗi khi có khách đến chú lại kêu “xin chào, xin chào”. Em thường cho chú ăn hạt và những lát trái cây nhỏ. Chú vẹt làm cho ngôi nhà của em lúc nào cũng rộn ràng tiếng cười. Em rất yêu chú vẹt nhỏ này.' },
];

const NOTICES: Rec[] = [
  { title: '17 bài “Tả con vật nuôi em yêu thích” đang chờ chấm', time: '15 phút trước', tag: 'Chấm điểm', icon: 'grade' },
  { title: 'Lê Thị Phương vừa nộp bài đọc hiểu “Dế Mèn bênh vực kẻ yếu”', time: '1 giờ trước', tag: 'Lớp TV5A1', icon: 'class' },
  { title: 'Đề thi học kì II môn Tiếng Việt lớp 5 đã được cập nhật', time: 'Hôm qua', tag: 'Hệ thống', icon: 'notify' },
];

const SCHEDULE: Rec[] = [
  { time: '07:15', dur: '40 phút', title: 'Tiếng Việt 5A1 — Tập đọc “Dế Mèn bênh vực kẻ yếu”', room: 'P.305', cls: 'TV5A1' },
  { time: '09:40', dur: '40 phút', title: 'Tiếng Việt 4A3 — Luyện từ và câu', room: 'P.210', cls: 'TV4A3' },
  { time: '15:15', dur: '60 phút', title: 'CLB Văn hay chữ tốt', room: 'P.401', cls: 'CLB-VH' },
];

const STUDENT_TASKS: Rec[] = [
  { id: 'a1', title: 'Trắc nghiệm — Đọc hiểu “Dế Mèn bênh vực kẻ yếu”', class: 'TV5A1', type: 'Trắc nghiệm', due: '24/06', dueIn: 'Còn 2 ngày', status: 'todo', points: 10, questions: 12 },
  { id: 'a2', title: 'Tập làm văn — Tả con vật nuôi em yêu thích', class: 'TV5A1', type: 'Tự luận', due: '26/06', dueIn: 'Còn 4 ngày', status: 'todo', points: 10, questions: 1 },
  { id: 'a3', title: 'Trắc nghiệm — Luyện từ và câu: Từ láy, từ ghép', class: 'TV4A3', type: 'Trắc nghiệm', due: '22/06', dueIn: 'Hôm nay', status: 'todo', points: 10, questions: 10 },
  { id: 'a5', title: 'Kiểm tra 15 phút — Chính tả & từ loại', class: 'TV5A1', type: 'Trắc nghiệm', due: '20/06', dueIn: 'Đã nộp', status: 'done', score: 8.5, points: 10, questions: 15 },
  { id: 'a0', title: 'Tập làm văn — Kể về một việc tốt em đã làm', class: 'TV5A1', type: 'Tự luận', due: '15/06', dueIn: 'Đã chấm', status: 'graded', score: 9.0, points: 10, questions: 1 },
];

const ARTICLES: Rec[] = [
  { id: 'b1', title: 'Mẹo giúp con viết mở bài hay khi tả con vật', excerpt: 'Ba cách mở bài đơn giản giúp bài văn tả con vật của con sinh động và hấp dẫn ngay từ câu đầu.',
    cat: 'Tập làm văn', author: 'Cô Mai Anh', date: '20/06/2026', read: '5 phút', cover: 'clay',
    body: ['Mở bài là phần đầu tiên thầy cô đọc, vì vậy một mở bài hay sẽ tạo thiện cảm ngay lập tức. Với học sinh tiểu học, mở bài chỉ cần ngắn gọn, gần gũi.',
      'Cách trực tiếp: giới thiệu thẳng con vật em sẽ tả, ví dụ “Nhà em nuôi một chú mèo tam thể rất đáng yêu.”. Cách gián tiếp: bắt đầu từ một tình huống, như buổi sáng nghe tiếng gà gáy.',
      'Dù chọn cách nào, hãy nhắc con nêu được tên con vật và cảm xúc của mình trước khi tả chi tiết ở phần thân bài.'] },
  { id: 'b2', title: 'Phân biệt từ láy và từ ghép thật dễ nhớ', excerpt: 'Một mẹo nhỏ giúp các con không còn nhầm lẫn giữa từ láy và từ ghép khi làm bài Luyện từ và câu.',
    cat: 'Luyện từ & câu', author: 'Thầy Quang Đức', date: '18/06/2026', read: '6 phút', cover: 'teal',
    body: ['Từ ghép là từ có hai tiếng đều có nghĩa, ví dụ “bàn ghế”, “học sinh”. Từ láy là từ có các tiếng lặp lại âm hoặc vần, như “lung linh”, “rì rào”.',
      'Mẹo nhỏ: nếu tách hai tiếng ra mà cả hai đều có nghĩa rõ ràng thì đó là từ ghép.',
      'Hãy cho con luyện tập bằng cách tìm từ láy, từ ghép trong chính bài tập đọc các con vừa học để nhớ lâu hơn.'] },
  { id: 'b3', title: '5 lỗi chính tả học sinh tiểu học hay mắc', excerpt: 'Nhận diện và sửa nhanh những lỗi chính tả phổ biến như l/n, ch/tr, dấu hỏi/ngã.',
    cat: 'Chính tả', author: 'Cô Mai Anh', date: '14/06/2026', read: '4 phút', cover: 'indigo',
    body: ['Các lỗi thường gặp nhất là lẫn lộn l/n, ch/tr, s/x và dấu hỏi/ngã.',
      'Cách khắc phục hiệu quả là cho con đọc to và viết lại nhiều lần những từ hay sai.',
      'Một cuốn sổ tay chính tả ghi lại các từ con thường viết sai sẽ giúp con tiến bộ rõ rệt.'] },
  { id: 'b4', title: 'Cùng con đọc sách mỗi ngày: thói quen vàng', excerpt: 'Vì sao 15 phút đọc sách mỗi tối lại giúp con học Tiếng Việt tốt hơn và giàu cảm xúc hơn.',
    cat: 'Cùng con học', author: 'Cô Thu Hồng', date: '10/06/2026', read: '7 phút', cover: 'plum',
    body: ['Đọc sách mỗi ngày giúp con mở rộng vốn từ, viết văn hay hơn và biết cảm nhận cái đẹp.',
      'Bố mẹ nên chọn sách phù hợp lứa tuổi và cùng con trò chuyện về nội dung sau khi đọc.',
      'Chỉ cần 15 phút mỗi tối, duy trì đều đặn, con sẽ yêu thích việc đọc lúc nào không hay.'] },
];

const ADMIN_STATS: Rec = {
  users: 2480, docs: 0, exercises: 0, articles: 0,
  enrollTrend: [12, 15, 11, 18, 16, 22, 19, 24, 20, 26, 23, 28, 25, 31, 27, 33, 30, 29, 35, 32, 38, 34, 40, 37, 43, 39, 45, 42, 47, 44],
};

const ADMIN_USERS: Rec[] = [
  { name: 'Nguyễn Thu Hà', role: 'Người dùng', email: 'thuha@email.com', joined: '12/05/2026', done: 12, status: 'active' },
  { name: 'Trần Văn Minh', role: 'Người dùng', email: 'minhtv@email.com', joined: '08/05/2026', done: 9, status: 'active' },
  { name: 'Lê Thị Phương', role: 'Người dùng', email: 'phuonglt@email.com', joined: '02/05/2026', done: 15, status: 'active' },
  { name: 'Phạm Quốc Bảo', role: 'Người dùng', email: 'baopq@email.com', joined: '28/04/2026', done: 3, status: 'inactive' },
  { name: 'Hoàng Mỹ Linh', role: 'Người dùng', email: 'linhhm@email.com', joined: '20/04/2026', done: 11, status: 'active' },
  { name: 'Trần Thị Loan', role: 'Quản trị viên', email: 'loan@vuonvan.vn', joined: '01/01/2026', done: 0, status: 'active' },
];

export const DB: Record<string, any> = {
  TEACHER, QTYPES, LEVELS, QUESTIONS, DOCS, DOC_FOLDERS, DOWNLOADS,
  RUBRICS, ASSIGNMENTS, SUBMISSIONS, NOTICES, SCHEDULE, STUDENT_TASKS,
  ADMIN_STATS, ADMIN_USERS, ARTICLES,
};
