/**
 * Logic Trang Xem Lại & Lời Giải Chi Tiết (web_app/js/review.js)
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Đợi nạp MEDIA_BASE_URL từ Vercel Environment Variables nếu có
  if (window.mediaReadyPromise) await window.mediaReadyPromise;

  const urlParams = new URLSearchParams(window.location.search);
  const testId = urlParams.get('test') || 'ETS_2024_1';
  const currentTest = getTestById(testId);

  if (!currentTest) {
    alert('Không tìm thấy đề thi!');
    window.location.href = 'index.html';
    return;
  }

  const report = getTestProgress(testId);
  if (!report || !report.score) {
    alert('Chưa có kết quả bài thi này!');
    window.location.href = `exam.html?test=${testId}`;
    return;
  }

  const userAnswers = report.userAnswers || {};
  const correctAnswers = report.correctAnswers || {};

  // State
  let currentFilter = 'all'; // 'all', 'incorrect', 'correct', 'unanswered'
  let currentPdfMode = 'lc'; // 'lc', 'rc', 'expl'

  // DOM Elements
  const btnBackResult = document.getElementById('btn-back-result');
  const reviewTitle = document.getElementById('review-title');
  const filterBtnIncorrect = document.getElementById('filter-btn-incorrect');
  const filterBtnCorrect = document.getElementById('filter-btn-correct');
  const filterBtnUnanswered = document.getElementById('filter-btn-unanswered');
  const reviewFilterBtns = document.querySelectorAll('.review-filter-btn');

  // PDF Elements
  const tabReviewLc = document.getElementById('tab-review-lc');
  const tabReviewRc = document.getElementById('tab-review-rc');
  const tabReviewExplLc = document.getElementById('tab-review-expl-lc');
  const tabReviewExplRc = document.getElementById('tab-review-expl-rc');
  const reviewPdfFrame = document.getElementById('review-pdf-frame');
  const btnReviewOpenPdf = document.getElementById('btn-review-open-pdf');

  // Audio Elements
  const reviewAudio = document.getElementById('review-audio');
  const btnReviewPlay = document.getElementById('btn-review-play');
  const iconReviewPlay = document.getElementById('icon-review-play');
  const btnReviewRewind = document.getElementById('btn-review-rewind');
  const btnReviewForward = document.getElementById('btn-review-forward');
  const reviewAudioProgress = document.getElementById('review-audio-progress');
  const reviewAudioTime = document.getElementById('review-audio-time');
  const reviewSpeedBtns = document.querySelectorAll('.review-speed-btn');

  // Container
  const reviewQuestionsContainer = document.getElementById('review-questions-container');

  // Setup header & links
  reviewTitle.textContent = currentTest.title;
  btnBackResult.href = `result.html?test=${testId}`;
  document.title = `Xem lại: ${currentTest.title} - TOEIC Master`;

  // Kiểm tra file giải chi tiết
  if (!currentTest.lcExplPdf) tabReviewExplLc.classList.add('hidden');
  if (!currentTest.rcExplPdf) tabReviewExplRc.classList.add('hidden');

  // Setup counts
  let countCorrect = 0;
  let countIncorrect = 0;
  let countUnanswered = 0;

  for (let q = 1; q <= 200; q++) {
    const u = (userAnswers[q] || '').trim().toUpperCase();
    const c = (correctAnswers[q] || '').trim().toUpperCase();
    if (!u) countUnanswered++;
    else if (u === c) countCorrect++;
    else countIncorrect++;
  }

  filterBtnIncorrect.textContent = `Câu sai (${countIncorrect})`;
  filterBtnCorrect.textContent = `Câu đúng (${countCorrect})`;
  filterBtnUnanswered.textContent = `Chưa làm (${countUnanswered})`;

  // Setup PDF viewer
  function updateReviewPdf(mode) {
    currentPdfMode = mode;
    const baseUrl = window.MEDIA_BASE_URL || '';
    let pdfPath = currentTest.lcPdf;

    if (mode === 'rc') {
      pdfPath = currentTest.rcPdf;
    } else if (mode === 'expl-lc') {
      pdfPath = currentTest.lcExplPdf || currentTest.lcPdf;
    } else if (mode === 'expl-rc') {
      pdfPath = currentTest.rcExplPdf || currentTest.rcPdf;
    }

    const fullUrl = `${baseUrl}${pdfPath}#toolbar=1&navpanes=0&scrollbar=1`;
    reviewPdfFrame.src = fullUrl;
    btnReviewOpenPdf.href = `${baseUrl}${pdfPath}`;

    // Update Tab UI styles
    const defaultBtnClass = 'px-2.5 py-1 rounded-md text-xs font-bold transition-all text-slate-600 hover:text-slate-900 flex items-center gap-1';
    const activeBlueClass = 'px-2.5 py-1 rounded-md text-xs font-bold transition-all bg-white text-brand-800 shadow-sm flex items-center gap-1';
    const activeGreenClass = 'px-2.5 py-1 rounded-md text-xs font-bold transition-all bg-white text-emerald-800 shadow-sm flex items-center gap-1';

    tabReviewLc.className = mode === 'lc' ? activeBlueClass : defaultBtnClass;
    tabReviewRc.className = mode === 'rc' ? activeBlueClass : defaultBtnClass;
    if (tabReviewExplLc) tabReviewExplLc.className = mode === 'expl-lc' ? activeGreenClass : defaultBtnClass;
    if (tabReviewExplRc) tabReviewExplRc.className = mode === 'expl-rc' ? activeGreenClass : defaultBtnClass;
  }

  tabReviewLc.addEventListener('click', () => updateReviewPdf('lc'));
  tabReviewRc.addEventListener('click', () => updateReviewPdf('rc'));
  if (tabReviewExplLc) tabReviewExplLc.addEventListener('click', () => updateReviewPdf('expl-lc'));
  if (tabReviewExplRc) tabReviewExplRc.addEventListener('click', () => updateReviewPdf('expl-rc'));
  updateReviewPdf('lc');

  // Setup Audio
  const baseUrl = window.MEDIA_BASE_URL || '';
  reviewAudio.src = `${baseUrl}${currentTest.audio}`;

  function formatTime(seconds) {
    if (isNaN(seconds)) return '00:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  }

  btnReviewPlay.addEventListener('click', () => {
    if (reviewAudio.paused) {
      reviewAudio.play().catch(e => console.warn(e));
      iconReviewPlay.textContent = 'pause';
    } else {
      reviewAudio.pause();
      iconReviewPlay.textContent = 'play_arrow';
    }
  });

  reviewAudio.addEventListener('play', () => iconReviewPlay.textContent = 'pause');
  reviewAudio.addEventListener('pause', () => iconReviewPlay.textContent = 'play_arrow');

  let isDraggingProgress = false;

  reviewAudio.addEventListener('timeupdate', () => {
    if (reviewAudio.duration && !isDraggingProgress) {
      const pct = (reviewAudio.currentTime / reviewAudio.duration) * 100;
      reviewAudioProgress.value = pct;
      reviewAudioTime.textContent = `${formatTime(reviewAudio.currentTime)} / ${formatTime(reviewAudio.duration)}`;
    }
  });

  reviewAudio.addEventListener('loadedmetadata', () => {
    reviewAudioTime.textContent = `00:00 / ${formatTime(reviewAudio.duration)}`;
  });

  reviewAudioProgress.addEventListener('mousedown', () => { isDraggingProgress = true; });
  reviewAudioProgress.addEventListener('touchstart', () => { isDraggingProgress = true; });

  reviewAudioProgress.addEventListener('input', () => {
    if (reviewAudio.duration) {
      const targetTime = (reviewAudioProgress.value / 100) * reviewAudio.duration;
      reviewAudioTime.textContent = `${formatTime(targetTime)} / ${formatTime(reviewAudio.duration)}`;
    }
  });

  reviewAudioProgress.addEventListener('change', () => {
    if (reviewAudio.duration) {
      const targetTime = (reviewAudioProgress.value / 100) * reviewAudio.duration;
      reviewAudio.currentTime = targetTime;
    }
    isDraggingProgress = false;
  });

  reviewAudioProgress.addEventListener('mouseup', () => { isDraggingProgress = false; });
  reviewAudioProgress.addEventListener('touchend', () => { isDraggingProgress = false; });

  function seekReviewAudio(delta) {
    if (isNaN(reviewAudio.duration) || reviewAudio.duration <= 0) return;
    const target = Math.max(0, Math.min(reviewAudio.duration, reviewAudio.currentTime + delta));
    reviewAudio.currentTime = target;
    const pct = (target / reviewAudio.duration) * 100;
    reviewAudioProgress.value = pct;
    reviewAudioTime.textContent = `${formatTime(target)} / ${formatTime(reviewAudio.duration)}`;
  }

  btnReviewRewind.addEventListener('click', () => {
    seekReviewAudio(-5);
  });

  btnReviewForward.addEventListener('click', () => {
    seekReviewAudio(5);
  });

  reviewSpeedBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      reviewSpeedBtns.forEach(b => b.className = 'review-speed-btn px-2 py-0.5 rounded text-[11px] font-bold bg-slate-200 text-slate-600');
      btn.className = 'review-speed-btn px-2 py-0.5 rounded text-[11px] font-bold bg-brand-800 text-white';
      reviewAudio.playbackRate = parseFloat(btn.getAttribute('data-speed'));
    });
  });

  // Render danh sách câu hỏi xem lại
  function renderReviewQuestions() {
    reviewQuestionsContainer.innerHTML = '';

    let itemsToRender = [];
    for (let q = 1; q <= 200; q++) {
      const u = (userAnswers[q] || '').trim().toUpperCase();
      const c = (correctAnswers[q] || '').trim().toUpperCase();

      let status = 'unanswered';
      if (u && u === c) status = 'correct';
      else if (u && u !== c) status = 'incorrect';

      if (currentFilter === 'all' || currentFilter === status) {
        itemsToRender.push({ q, userAns: u, correctAns: c, status });
      }
    }

    if (itemsToRender.length === 0) {
      reviewQuestionsContainer.innerHTML = `
        <div class="py-12 text-center text-slate-400">
          <span class="material-symbols-outlined text-[36px] mb-2 block">task_alt</span>
          <p class="text-xs font-semibold">Không có câu hỏi nào trong mục này.</p>
        </div>
      `;
      return;
    }

    itemsToRender.forEach(({ q, userAns, correctAns, status }) => {
      // Xác định Part
      let partInfo = TOEIC_PARTS[1];
      for (let p = 1; p <= 7; p++) {
        if (q >= TOEIC_PARTS[p].start && q <= TOEIC_PARTS[p].end) {
          partInfo = TOEIC_PARTS[p];
          break;
        }
      }

      const isPart2 = (partInfo.id === 2);
      const options = isPart2 ? ['A', 'B', 'C'] : ['A', 'B', 'C', 'D'];

      const card = document.createElement('div');
      card.id = `review-card-${q}`;

      let borderStatus = 'border-slate-200 bg-white';
      let badgeStatus = '<span class="text-[11px] font-bold text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-full">Chưa làm</span>';

      if (status === 'correct') {
        borderStatus = 'border-emerald-300 bg-emerald-50/30';
        badgeStatus = '<span class="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full flex items-center gap-1"><span class="material-symbols-outlined text-[13px]">check</span> Đúng</span>';
      } else if (status === 'incorrect') {
        borderStatus = 'border-rose-300 bg-rose-50/30';
        badgeStatus = '<span class="text-[11px] font-bold text-rose-700 bg-rose-100 px-2.5 py-0.5 rounded-full flex items-center gap-1"><span class="material-symbols-outlined text-[13px]">close</span> Sai</span>';
      }

      card.className = `p-3.5 rounded-2xl border shadow-2xs transition-all ${borderStatus}`;
      const hasExpl = q <= 100 ? !!currentTest.lcExplPdf : !!currentTest.rcExplPdf;

      card.innerHTML = `
        <div class="flex items-center justify-between mb-2.5">
          <div class="flex items-center gap-2">
            <span class="text-xs font-extrabold text-slate-900">Câu ${q < 10 ? '0' + q : q}</span>
            <span class="text-[10px] font-semibold text-slate-400">(${partInfo.shortName})</span>
            ${badgeStatus}
          </div>
          <div class="flex items-center gap-2">
            <button data-q="${q}" class="btn-jump-pdf text-[11px] font-bold text-brand-600 hover:text-brand-800 flex items-center gap-0.5" title="Mở đề thi">
              <span class="material-symbols-outlined text-[15px]">menu_book</span>
              <span>Đề thi</span>
            </button>
            ${hasExpl ? `
              <button data-q="${q}" class="btn-jump-expl text-[11px] font-bold text-emerald-600 hover:text-emerald-800 flex items-center gap-0.5" title="Mở file lời giải chi tiết">
                <span class="material-symbols-outlined text-[15px]">lightbulb</span>
                <span>Lời giải</span>
              </button>
            ` : ''}
          </div>
        </div>

        <div class="grid grid-cols-${options.length} gap-2 mb-2">
          ${options.map(opt => {
            const isCorrect = (opt === correctAns);
            const isUserChoice = (opt === userAns);

            let optStyle = 'bg-slate-50 text-slate-600 border-slate-200';
            let label = opt;

            if (isCorrect && isUserChoice) {
              optStyle = 'bg-emerald-600 text-white font-extrabold ring-2 ring-emerald-600';
              label = `${opt} ✔`;
            } else if (isCorrect) {
              optStyle = 'bg-emerald-100 text-emerald-900 border-2 border-emerald-500 font-extrabold';
              label = `${opt} (Đúng)`;
            } else if (isUserChoice) {
              optStyle = 'bg-rose-500 text-white font-extrabold ring-2 ring-rose-500';
              label = `${opt} ✖`;
            }

            return `
              <div class="h-9 rounded-lg text-xs flex items-center justify-center border transition-all ${optStyle}">
                ${label}
              </div>
            `;
          }).join('')}
        </div>

        <div class="flex items-center justify-between text-[11px] pt-1 text-slate-500 border-t border-slate-100">
          <span>Bạn chọn: <strong class="${status === 'correct' ? 'text-emerald-700' : (userAns ? 'text-rose-600' : 'text-slate-400')}">${userAns || '―'}</strong></span>
          <span>Đáp án chuẩn: <strong class="text-emerald-700 font-extrabold">${correctAns || '?'}</strong></span>
        </div>
      `;

      // Nút mở đề
      card.querySelector('.btn-jump-pdf').addEventListener('click', () => {
        if (q <= 100) updateReviewPdf('lc');
        else updateReviewPdf('rc');
      });

      // Nút mở lời giải chi tiết
      const btnExpl = card.querySelector('.btn-jump-expl');
      if (btnExpl) {
        btnExpl.addEventListener('click', () => {
          if (q <= 100) updateReviewPdf('expl-lc');
          else updateReviewPdf('expl-rc');
        });
      }

      reviewQuestionsContainer.appendChild(card);
    });
  }

  // Filter Buttons Event
  reviewFilterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      reviewFilterBtns.forEach(b => {
        b.className = 'review-filter-btn px-3 py-1.5 rounded-xl text-xs font-bold transition-all bg-slate-100 text-slate-700 hover:bg-slate-200';
      });
      btn.className = 'review-filter-btn px-3 py-1.5 rounded-xl text-xs font-bold transition-all bg-brand-800 text-white shadow-xs';
      currentFilter = btn.getAttribute('data-filter');
      renderReviewQuestions();
    });
  });

  // Render ban đầu
  renderReviewQuestions();
});
