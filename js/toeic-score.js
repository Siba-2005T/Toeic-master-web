/**
 * Bảng quy đổi điểm chuẩn ETS TOEIC và định nghĩa các Part
 */

const TOEIC_PARTS = {
  1: { id: 1, name: 'Part 1: Photographs', shortName: 'Part 1', start: 1, end: 6, count: 6, section: 'LC' },
  2: { id: 2, name: 'Part 2: Question-Response', shortName: 'Part 2', start: 7, end: 31, count: 25, section: 'LC' },
  3: { id: 3, name: 'Part 3: Conversations', shortName: 'Part 3', start: 32, end: 70, count: 39, section: 'LC' },
  4: { id: 4, name: 'Part 4: Short Talks', shortName: 'Part 4', start: 71, end: 100, count: 30, section: 'LC' },
  5: { id: 5, name: 'Part 5: Incomplete Sentences', shortName: 'Part 5', start: 101, end: 130, count: 30, section: 'RC' },
  6: { id: 6, name: 'Part 6: Text Completion', shortName: 'Part 6', start: 131, end: 146, count: 16, section: 'RC' },
  7: { id: 7, name: 'Part 7: Reading Comprehension', shortName: 'Part 7', start: 147, end: 200, count: 54, section: 'RC' }
};

// Bảng quy đổi điểm Listening (0 -> 100 câu đúng sang điểm 5 -> 495)
const LC_SCORE_TABLE = [
  5, 5, 5, 5, 5, 5, 10, 15, 20, 25,     // 0 - 9
  30, 35, 40, 45, 50, 55, 60, 65, 70, 75, // 10 - 19
  80, 85, 90, 95, 100, 110, 115, 120, 125, 130, // 20 - 29
  135, 140, 145, 150, 160, 165, 170, 175, 180, 185, // 30 - 39
  190, 195, 200, 210, 215, 220, 225, 230, 235, 240, // 40 - 49
  245, 250, 255, 260, 265, 270, 275, 280, 285, 290, // 50 - 59
  295, 300, 310, 315, 320, 325, 330, 335, 340, 345, // 60 - 69
  350, 355, 360, 365, 370, 380, 385, 390, 395, 400, // 70 - 79
  405, 410, 420, 425, 430, 435, 440, 445, 450, 455, // 80 - 89
  460, 465, 470, 475, 480, 485, 490, 495, 495, 495, // 90 - 99
  495 // 100
];

// Bảng quy đổi điểm Reading (0 -> 100 câu đúng sang điểm 5 -> 495)
const RC_SCORE_TABLE = [
  5, 5, 5, 5, 5, 5, 5, 5, 5, 10,       // 0 - 9
  15, 20, 25, 30, 35, 40, 45, 50, 55, 60, // 10 - 19
  65, 70, 75, 80, 85, 90, 95, 100, 105, 110, // 20 - 29
  115, 120, 125, 130, 135, 140, 145, 150, 155, 160, // 30 - 39
  165, 170, 175, 180, 185, 190, 195, 200, 205, 210, // 40 - 49
  215, 220, 225, 230, 235, 240, 245, 250, 255, 260, // 50 - 59
  265, 270, 275, 280, 285, 290, 295, 300, 305, 310, // 60 - 69
  315, 320, 325, 330, 335, 340, 345, 350, 355, 360, // 70 - 79
  365, 370, 375, 380, 385, 390, 395, 400, 405, 410, // 80 - 89
  415, 420, 425, 435, 445, 455, 465, 475, 485, 490, // 90 - 99
  495 // 100
];

function calculateToeicScore(userAnswers, correctAnswers) {
  let lcCorrect = 0;
  let rcCorrect = 0;
  const partStats = {};

  // Khởi tạo thống kê từng Part
  for (let p = 1; p <= 7; p++) {
    partStats[p] = {
      id: p,
      name: TOEIC_PARTS[p].name,
      shortName: TOEIC_PARTS[p].shortName,
      section: TOEIC_PARTS[p].section,
      total: TOEIC_PARTS[p].count,
      correct: 0,
      incorrect: 0,
      unanswered: 0
    };
  }

  // Chấm từng câu từ 1 -> 200
  for (let q = 1; q <= 200; q++) {
    const userAns = (userAnswers[q] || '').trim().toUpperCase();
    const correctAns = (correctAnswers[q] || '').trim().toUpperCase();
    
    // Tìm câu hỏi thuộc Part nào
    let partId = 1;
    for (let p = 1; p <= 7; p++) {
      if (q >= TOEIC_PARTS[p].start && q <= TOEIC_PARTS[p].end) {
        partId = p;
        break;
      }
    }

    if (!userAns) {
      partStats[partId].unanswered++;
    } else if (userAns === correctAns) {
      partStats[partId].correct++;
      if (q <= 100) lcCorrect++;
      else rcCorrect++;
    } else {
      partStats[partId].incorrect++;
    }
  }

  // Quy đổi điểm
  const lcScaled = LC_SCORE_TABLE[Math.min(100, Math.max(0, lcCorrect))];
  const rcScaled = RC_SCORE_TABLE[Math.min(100, Math.max(0, rcCorrect))];
  const totalScaled = lcScaled + rcScaled;

  return {
    lcCorrect,
    rcCorrect,
    totalCorrect: lcCorrect + rcCorrect,
    totalQuestions: 200,
    lcScaled,
    rcScaled,
    totalScaled,
    partStats
  };
}

// Export cho browser
window.TOEIC_PARTS = TOEIC_PARTS;
window.calculateToeicScore = calculateToeicScore;
