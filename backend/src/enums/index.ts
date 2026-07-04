export enum UserRole {
  Student = 'student',
  Admin = 'admin',
}

export enum UserStatus {
  Active = 'active',
  Inactive = 'inactive',
}

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

export enum QuestionType {
  Single = 'single',
  Multi = 'multi',
  TrueFalse = 'truefalse',
  Fill = 'fill',
  Essay = 'essay',
  Match = 'match',
  Number = 'number',
  Sort = 'sort',
  TableSelection = 'tableselection',
}

export enum QuestionLevel {
  Easy = 'easy',
  Medium = 'medium',
  Hard = 'hard',
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

export enum ExerciseType {
  Quiz = 'quiz',
  Essay = 'essay',
  FileUpload = 'file',
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
