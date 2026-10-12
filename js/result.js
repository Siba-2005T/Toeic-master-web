/**
 * Logic Trang Báo cáo kết quả bài thi (web_app/js/result.js)
 */

document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const testId = urlParams.get('test') || 'ETS_2024_1';
  const currentTest = getTestById(testId);

  if (!currentTest) {
    alert('Không tìm thấy bài thi!');
    window.location.href = 'index.html';
    return;
  }

  // Lấy dữ liệu bài thi đã lưu
  const report = getTestProgress(testId);
  if (!report || !report.score) {
    alert('Chưa có dữ liệu kết quả cho đề này. Hãy làm bài trước!');
    window.location.href = `exam.html?test=${testId}`;
    return;
  }

  const { score, submittedAt, timeSpentSeconds } = report;

  // DOM Elements
  const resultTestTitle = document.getElementById('result-test-title');
  const scoreTotal = document.getElementById('score-total');
  const scoreEvaluation = document.getElementById('score-evaluation');
  const scoreLc = document.getElementById('score-lc');
  const scoreRc = document.getElementById('score-rc');
  const scoreLcCorrect = document.getElementById('score-lc-correct');
  const scoreRcCorrect = document.getElementById('score-rc-correct');

  const metaSubmittedDate = document.getElementById('meta-submitted-date');
  const metaTimeSpent = document.getElementById('meta-time-spent');
  const metaAccuracy = document.getElementById('meta-accuracy');

  const partBreakdownContainer = document.getElementById('part-breakdown-container');
  const btnGotoReview = document.getElementById('btn-goto-review');
  const btnBottomReview = document.getElementById('btn-bottom-review');
  const btnBottomRetake = document.getElementById('btn-bottom-retake');

  // Title
  resultTestTitle.textContent = currentTest.title;
  document.title = `Kết quả thi: ${currentTest.title} - TOEIC Master`;

  // Score display
  scoreTotal.textContent = score.totalScaled;
  scoreLc.textContent = score.lcScaled;
  scoreRc.textContent = score.rcScaled;
  scoreLcCorrect.textContent = `${score.lcCorrect} / 100 câu đúng`;
  scoreRcCorrect.textContent = `${score.rcCorrect} / 100 câu đúng`;

  // Evaluation
  let evalText = '';
  if (score.totalScaled >= 850) {
    evalText = '🌟 Xuất sắc! Năng lực Tiếng Anh giao tiếp và công việc cấp độ cao cấp (CEFR C1).';
  } else if (score.totalScaled >= 750) {
    evalText = '🎉 Rất tốt! Khả năng làm việc chuyên nghiệp trong môi trường quốc tế (CEFR B2).';
  } else if (score.totalScaled >= 600) {
    evalText = '👍 Tốt! Đạt chuẩn đầu ra Đại học và tiêu chuẩn tuyển dụng doanh nghiệp (CEFR B1 - B2).';
  } else if (score.totalScaled >= 450) {
    evalText = '📚 Trung bình khá. Đạt yêu cầu giao tiếp cơ bản, cần tăng tốc luyện tập thêm.';
  } else {
    evalText = '💪 Cần cố gắng hơn! Hãy xem lại các câu sai để cải thiện kỹ năng nghe và ngữ pháp.';
  }
  scoreEvaluation.textContent = evalText;

  // Meta row
  const submitDate = submittedAt ? new Date(submittedAt).toLocaleString('vi-VN') : 'Vừa xong';
  metaSubmittedDate.textContent = `Ngày thi: ${submitDate}`;

  const timeMinutes = Math.floor((timeSpentSeconds || 0) / 60);
  const timeSeconds = (timeSpentSeconds || 0) % 60;
  metaTimeSpent.textContent = `Thời gian làm bài: ${timeMinutes} phút ${timeSeconds} giây`;

  const accuracyPct = Math.round((score.totalCorrect / 200) * 100);
  metaAccuracy.textContent = `Độ chính xác: ${accuracyPct}% (${score.totalCorrect}/200 câu đúng)`;

  // Part Breakdown
  partBreakdownContainer.innerHTML = '';
  for (let p = 1; p <= 7; p++) {
    const pStat = score.partStats[p];
    const pct = Math.round((pStat.correct / pStat.total) * 100);

    let barColor = 'bg-emerald-500';
    let textColor = 'text-emerald-600';
    if (pct < 60) {
      barColor = 'bg-rose-500';
      textColor = 'text-rose-600';
    } else if (pct < 80) {
      barColor = 'bg-amber-500';
      textColor = 'text-amber-600';
    }

    const card = document.createElement('div');
    card.className = 'p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between gap-3';
    card.innerHTML = `
      <div class="flex items-center justify-between">
        <div>
          <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">${pStat.section}</span>
          <h4 class="text-sm font-bold text-slate-800">${pStat.name}</h4>
        </div>
        <div class="text-right">
          <span class="text-base font-extrabold ${textColor}">${pct}%</span>
          <span class="text-[11px] text-slate-500 block font-medium">${pStat.correct}/${pStat.total} đúng</span>
        </div>
      </div>

      <!-- Progress bar -->
      <div class="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
        <div class="${barColor} h-full rounded-full transition-all duration-1000" style="width: ${pct}%"></div>
      </div>

      <!-- Breakdown details -->
      <div class="flex items-center justify-between text-[11px] text-slate-500 font-medium">
        <span class="text-emerald-600 font-bold">Đúng: ${pStat.correct}</span>
        <span class="text-rose-500 font-bold">Sai: ${pStat.incorrect}</span>
        <span class="text-slate-400">Chưa làm: ${pStat.unanswered}</span>
      </div>
    `;
    partBreakdownContainer.appendChild(card);
  }

  // Setup Review links
  const reviewUrl = `review.html?test=${testId}`;
  btnGotoReview.href = reviewUrl;
  btnBottomReview.href = reviewUrl;
  btnBottomRetake.href = `exam.html?test=${testId}`;
});
