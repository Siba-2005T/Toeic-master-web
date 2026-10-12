/**
 * Danh sách 20 đề thi ETS 2024 & ETS 2025
 */

// Cấu hình URL gốc của file Media (PDF & Audio)
// Local: '' (dùng đường dẫn tương đối từ FastAPI/Static Server)
// Vercel: Có thể trỏ tới Cloudflare R2 / Supabase / GitHub Releases
window.MEDIA_BASE_URL = window.MEDIA_BASE_URL || '';

const TOEIC_TESTS = [
  // ===================== ETS 2024 =====================
  ...Array.from({ length: 10 }, (_, i) => {
    const num = i + 1;
    const numStr = num < 10 ? `0${num}` : `${num}`;
    return {
      id: `ETS_2024_${num}`,
      title: `ETS TOEIC 2024 - Test ${numStr}`,
      series: 'ETS 2024',
      year: 2024,
      testNum: num,
      difficulty: 'Chuẩn format ETS',
      totalQuestions: 200,
      durationMinutes: 120,
      tags: ['ETS 2024', 'Full Test', 'Có Lời Giải'],
      audio: `/media/ets2024/audio/Test_${numStr}.mp3`,
      lcPdf: `/media/ets2024/lc/TEST ${num} LC.pdf`,
      rcPdf: `/media/ets2024/rc/TEST ${num} RC.pdf`,
      lcExplPdf: `/media/ets2024/expl/EXPL_LC_${num}.pdf`,
      rcExplPdf: `/media/ets2024/expl/EXPL_RC_${num}.pdf`,
      answersFile: 'data/answers_2024.json',
      answerKey: `TEST_${num}`
    };
  }),

  // ===================== ETS 2025 =====================
  ...Array.from({ length: 10 }, (_, i) => {
    const num = i + 1;
    const numStr = num < 10 ? `0${num}` : `${num}`;
    return {
      id: `ETS_2025_${num}`,
      title: `ETS TOEIC 2025 - Test ${numStr}`,
      series: 'ETS 2025',
      year: 2025,
      testNum: num,
      difficulty: 'Đề mới nhất 2025',
      totalQuestions: 200,
      durationMinutes: 120,
      tags: ['ETS 2025', 'Full Test', 'Mới Nhất'],
      audio: `/media/ets2025/audio/E26-T${numStr}-01-merged.mp3`,
      lcPdf: `/media/ets2025/lc/ets2025_lc_test_${num}.pdf`,
      rcPdf: `/media/ets2025/rc/ets2025_rc_test_${num}.pdf`,
      lcExplPdf: null,
      rcExplPdf: null,
      answersFile: 'data/answers_2025.json',
      answerKey: `TEST_${num}`
    };
  })
];

// Helper lấy đề theo ID
function getTestById(id) {
  return TOEIC_TESTS.find(t => t.id === id) || null;
}

// Helper lấy kết quả đã lưu trong localStorage
function getTestProgress(testId) {
  try {
    const saved = localStorage.getItem(`toeic_result_${testId}`);
    return saved ? JSON.parse(saved) : null;
  } catch (e) {
    return null;
  }
}

// Helper lưu kết quả
function saveTestResult(testId, resultData) {
  try {
    localStorage.setItem(`toeic_result_${testId}`, JSON.stringify(resultData));
    
    // Cập nhật danh sách đề đã làm
    let completedList = JSON.parse(localStorage.getItem('toeic_completed_tests') || '[]');
    if (!completedList.includes(testId)) {
      completedList.push(testId);
      localStorage.setItem('toeic_completed_tests', JSON.stringify(completedList));
    }
  } catch (e) {
    console.error('Lỗi lưu kết quả bài thi:', e);
  }
}

// Export cho browser
window.TOEIC_TESTS = TOEIC_TESTS;
window.getTestById = getTestById;
window.getTestProgress = getTestProgress;
window.saveTestResult = saveTestResult;
