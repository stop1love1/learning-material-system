export const NAV_BY_ROLE: Record<string, Array<{ group: string; items: Array<{ key: string; icon: string; label: string; badge?: number }> }>> = {
  user: [
    { group: 'KHÁM PHÁ', items: [
      { key: 'home', icon: 'overview', label: 'Trang chủ' },
      { key: 's-docs', icon: 'book', label: 'Kho tài liệu' },
      { key: 's-tasks', icon: 'assign', label: 'Luyện tập' },
      { key: 's-selfcheck', icon: 'rubric', label: 'Tự đánh giá' },
      { key: 'blog', icon: 'docs', label: 'Bài viết' },
      { key: 's-mine', icon: 'star', label: 'Của tôi' },
    ] },
  ],
  admin: [
    { group: 'TỔNG QUAN', items: [{ key: 'a-overview', icon: 'overview', label: 'Tổng quan' }] },
    { group: 'NỘI DUNG', items: [
      { key: 'docs', icon: 'book', label: 'Kho tài liệu' },
      { key: 'bank', icon: 'bank', label: 'Ngân hàng câu hỏi' },
      { key: 'assignments', icon: 'assign', label: 'Bài tập' },
      { key: 'rubrics', icon: 'rubric', label: 'Rubrics' },
      { key: 'a-blog', icon: 'docs', label: 'Bài viết' },
      { key: 'grade', icon: 'grade', label: 'Chấm bài', badge: 19 },
      { key: 'a-schedule', icon: 'calendar', label: 'Lịch dạy' },
    ] },
    { group: 'QUẢN LÝ', items: [
      { key: 'a-users', icon: 'users', label: 'Người dùng' },
      { key: 'a-reports', icon: 'report', label: 'Báo cáo & Thống kê' },
    ] },
    { group: 'HỆ THỐNG', items: [
      { key: 'a-settings', icon: 'settings', label: 'Cài đặt hệ thống' },
      { key: 'notify', icon: 'notify', label: 'Nhật ký & thông báo' },
    ] },
  ],
};

// detail routes → which nav item lights up
export const ROUTE_PARENT: Record<string, string> = {
  'bank-edit': 'bank', 'rubric-edit': 'rubrics',
  'assign-new': 'assignments', 'grade-one': 'grade',
  's-task': 's-tasks', 's-doc': 's-docs', article: 'blog',
};

export const PAGE_TITLES: Record<string, [string, string]> = {
  home: ['Trang chủ', 'Nền tảng học liệu mở'],
  's-mine': ['Của tôi', 'Tài liệu đã tải & bài đã làm'],
  blog: ['Bài viết', 'Chia sẻ học thuật'],
  article: ['Bài viết', ''],
  'a-blog': ['Bài viết', 'Đăng và quản lý bài viết'],
  overview: ['Tổng quan', 'Bảng điều khiển giảng dạy'],
  assignments: ['Bài tập & Giao bài', 'Tạo, giao và theo dõi bài tập'],
  'assign-new': ['Giao bài tập mới', 'Soạn và phát cho lớp'],
  grade: ['Chấm điểm', 'Bài nộp đang chờ chấm'],
  'grade-one': ['Chấm bài', 'Theo rubric & điểm số'],
  bank: ['Ngân hàng câu hỏi', 'Kho câu hỏi dùng lại cho mọi đề'],
  'bank-edit': ['Soạn câu hỏi', 'Thêm câu hỏi vào ngân hàng'],
  docs: ['Kho tài liệu', 'Tài liệu giảng dạy & học liệu'],
  rubrics: ['Rubrics', 'Bộ tiêu chí chấm điểm'],
  't-reports': ['Báo cáo & Thống kê', 'Hiệu quả giảng dạy & học tập'],
  'rubric-edit': ['Trình dựng Rubric', 'Tiêu chí & thang điểm'],
  notify: ['Thông báo', 'Hoạt động gần đây'],
  settings: ['Cài đặt', 'Tài khoản & hệ thống'],
  's-overview': ['Tổng quan', 'Chào mừng trở lại'],
  's-docs': ['Kho tài liệu', 'Tìm và đọc tài liệu học tập'],
  's-selfcheck': ['Tự đánh giá', 'Dùng rubric tự chấm bài của bạn'],
  's-tasks': ['Luyện tập', 'Bài cần làm & đã nộp'],
  's-task': ['Làm bài', 'Hoàn thành và nộp bài'],
  's-doc': ['Đọc tài liệu', 'Học liệu trong kho'],
  's-results': ['Kết quả', 'Điểm số & nhận xét'],
  'a-overview': ['Tổng quan', 'Toàn cảnh hệ thống đào tạo'],
  'a-users': ['Người dùng & phân quyền', 'Tài khoản · vai trò · quyền hạn'],
  'a-settings': ['Cài đặt hệ thống', 'Giao diện · cấu hình chung · bảo mật · tích hợp'],
  'a-reports': ['Báo cáo & Thống kê', 'Thống kê toàn hệ thống & xuất dữ liệu'],
  'a-schedule': ['Lịch dạy', 'Quản lý lịch dạy theo thứ trong tuần'],
  account: ['Hồ sơ cá nhân', 'Thông tin tài khoản của bạn'],
};

export const ROLE_META: Record<string, { label: string; sub: string; initials: string }> = {
  user: { label: 'Người dùng', sub: 'Khách truy cập', initials: 'ND' },
  admin: { label: 'Quản trị', sub: 'Trần Thị Loan', initials: 'TL' },
};
