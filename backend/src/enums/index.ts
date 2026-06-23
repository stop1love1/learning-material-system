// Domain enums for the Vườn Văn / Học Viện LMS. String enums so values are
// human-readable in the database and stable across refactors.

// ── Tài khoản ────────────────────────────────────────────────────────────────
export enum UserRole {
  Student = 'student',
  Teacher = 'teacher',
  Admin = 'admin',
}

export enum UserStatus {
  Active = 'active',
  Inactive = 'inactive',
}

// ── Kho tài liệu ─────────────────────────────────────────────────────────────
/** Where a file's bytes live. External = chỉ lưu link (mặc định). */
export enum FileSource {
  External = 'external',
  Internal = 'internal',
}

export enum FileType {
  Pdf = 'pdf',
  Doc = 'doc',
  Slide = 'slide',
  Image = 'image',
  Audio = 'audio',
  Video = 'video',
  Link = 'link',
  Other = 'other',
}

/** Mục "Của tôi": người dùng đã tải hoặc đã lưu một file. */
export enum DownloadKind {
  Download = 'download',
  Save = 'save',
}

// ── Ngân hàng câu hỏi ────────────────────────────────────────────────────────
export enum QuestionType {
  Single = 'single', // Trắc nghiệm 1 đáp án
  Multi = 'multi', // Trắc nghiệm nhiều đáp án
  TrueFalse = 'truefalse', // Đúng / Sai
  Fill = 'fill', // Điền khuyết
  Essay = 'essay', // Tự luận
  Match = 'match', // Nối / kéo thả
  Number = 'number', // Đáp án số
  Sort = 'sort', // Sắp xếp thứ tự
  TableSelection = 'tableselection', // Chọn Đúng/Sai trong bảng
}

export enum QuestionLevel {
  Easy = 'easy', // Nhận biết
  Medium = 'medium', // Thông hiểu
  Hard = 'hard', // Vận dụng
}

/** Tên collection chi tiết — dùng cho `question.questionModel` + refPath. */
export enum QuestionModel {
  SingleChoice = 'SingleChoiceQuestion',
  MultipleChoice = 'MultipleChoiceQuestion',
  TrueFalse = 'TrueFalseQuestion',
  ShortAnswer = 'ShortAnswerQuestion',
  Essay = 'EssayQuestion',
  Match = 'MatchQuestion',
  Number = 'NumberQuestion',
  Sort = 'SortQuestion',
  TableSelection = 'TableSelectionQuestion',
}

/** So khớp đáp án điền khuyết. */
export enum QuestionMatchMode {
  Exact = 'exact', // khớp tuyệt đối
  Caseless = 'caseless', // bỏ qua hoa/thường
  Trimmed = 'trimmed', // bỏ khoảng trắng đầu/cuối
}

/** Cách chấm câu tự luận. */
export enum EssayGradingType {
  Manual = 'manual', // giáo viên tự cho điểm
  Rubric = 'rubric', // chấm theo rubric
  Instruction = 'instruction', // chấm theo hướng dẫn (tỉ lệ %)
}

// ── Bài tập & bài làm ────────────────────────────────────────────────────────
export enum ExerciseType {
  Quiz = 'quiz', // Trắc nghiệm
  Essay = 'essay', // Tự luận
  FileUpload = 'file', // Nộp tệp
}

export enum ExerciseStatus {
  Draft = 'draft',
  Open = 'open',
  Closing = 'closing',
  Closed = 'closed',
}

/** Đối tượng được tự đánh giá (màn "Tự đánh giá"). */
export enum SelfAssessmentSource {
  File = 'file',
  Exercise = 'exercise',
  Text = 'text',
}
