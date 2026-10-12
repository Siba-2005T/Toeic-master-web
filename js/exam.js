/**
 * Logic Phòng thi thực chiến (web_app/js/exam.js)
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Đợi nạp MEDIA_BASE_URL từ Vercel Environment Variables nếu có
  if (window.mediaReadyPromise) await window.mediaReadyPromise;

  // Lấy ID đề thi từ URL
  const urlParams = new URLSearchParams(window.location.search);
  const testId = urlParams.get('test') || 'ETS_2024_1';
  const currentTest = getTestById(testId);

  if (!currentTest) {
    alert('Không tìm thấy đề thi này!');
    window.location.href = 'index.html';
    return;
  }

  // Khởi tạo state
  let userAnswers = {};
  let flaggedQuestions = new Set();
  let currentPdfTab = 'lc'; // 'lc' hoặc 'rc'
  let secondsLeft = 120 * 60; // 120 phút
  let timerInterval = null;

  // Phục hồi bài thi đang làm dở nếu có
  try {
    const savedAns = localStorage.getItem(`toeic_exam_answers_${testId}`);
    if (savedAns) userAnswers = JSON.parse(savedAns);

    const savedFlags = localStorage.getItem(`toeic_exam_flags_${testId}`);
    if (savedFlags) flaggedQuestions = new Set(JSON.parse(savedFlags));

    const savedTime = localStorage.getItem(`toeic_exam_time_${testId}`);
    if (savedTime) secondsLeft = parseInt(savedTime, 10);
  } catch (e) {
    console.error('Lỗi đọc tiến trình làm bài:', e);
  }

  // DOM Elements
  const examTitle = document.getElementById('exam-title');
  const btnBack = document.getElementById('btn-back');
  const examTimer = document.getElementById('exam-timer');
  const badgeAnsweredCount = document.getElementById('badge-answered-count');
  const btnSubmit = document.getElementById('btn-submit');

  // PDF Elements
  const tabLc = document.getElementById('tab-lc');
  const tabRc = document.getElementById('tab-rc');
  const pdfFrame = document.getElementById('pdf-viewer-frame');
  const btnOpenPdfExt = document.getElementById('btn-open-pdf-ext');

  // Audio Elements
  const audioEl = document.getElementById('exam-audio');
  const btnAudioPlay = document.getElementById('btn-audio-play');
  const iconAudioPlay = document.getElementById('icon-audio-play');
  const btnAudioRewind = document.getElementById('btn-audio-rewind');
  const btnAudioForward = document.getElementById('btn-audio-forward');
  const audioProgress = document.getElementById('audio-progress');
  const audioTimeDisplay = document.getElementById('audio-time-display');
  const speedBtns = document.querySelectorAll('.speed-btn');

  // Navigation & Questions Elements
  const partPillsContainer = document.getElementById('part-pills');
  const questionsContainer = document.getElementById('questions-container');

  // Modal Elements
  const btnOpenMatrix = document.getElementById('btn-open-matrix');
  const modalMatrix = document.getElementById('modal-matrix');
  const closeModalMatrix = document.getElementById('close-modal-matrix');
  const matrixGridSections = document.getElementById('matrix-grid-sections');

  const modalSubmit = document.getElementById('modal-submit');
  const btnCancelSubmit = document.getElementById('btn-cancel-submit');
  const btnConfirmSubmit = document.getElementById('btn-confirm-submit');
  const submitAnsweredText = document.getElementById('submit-answered-text');
  const submitUnansweredText = document.getElementById('submit-unanswered-text');
  const submitTimeLeftText = document.getElementById('submit-time-left-text');

  // 1. Cập nhật Tiêu đề
  examTitle.textContent = currentTest.title;
  document.title = `${currentTest.title} - Phòng Thi TOEIC Master`;

  // 2. Cài đặt PDF Viewer
  function updatePdfView(tab) {
    currentPdfTab = tab;
    const baseUrl = window.MEDIA_BASE_URL || '';
    const pdfPath = tab === 'lc' ? currentTest.lcPdf : currentTest.rcPdf;
    const fullUrl = `${baseUrl}${pdfPath}#toolbar=1&navpanes=0&scrollbar=1`;

    pdfFrame.src = fullUrl;
    btnOpenPdfExt.href = `${baseUrl}${pdfPath}`;

    if (tab === 'lc') {
      tabLc.className = 'px-3 py-1 rounded-md text-xs font-bold transition-all bg-white text-brand-800 shadow-sm flex items-center gap-1';
      tabRc.className = 'px-3 py-1 rounded-md text-xs font-bold transition-all text-slate-600 hover:text-slate-900 flex items-center gap-1';
    } else {
      tabRc.className = 'px-3 py-1 rounded-md text-xs font-bold transition-all bg-white text-brand-800 shadow-sm flex items-center gap-1';
      tabLc.className = 'px-3 py-1 rounded-md text-xs font-bold transition-all text-slate-600 hover:text-slate-900 flex items-center gap-1';
    }
  }

  tabLc.addEventListener('click', () => updatePdfView('lc'));
  tabRc.addEventListener('click', () => updatePdfView('rc'));
  updatePdfView('lc');

  // 3. Cài đặt Audio Player
  const baseUrl = window.MEDIA_BASE_URL || '';
  audioEl.src = `${baseUrl}${currentTest.audio}`;

  function formatTime(seconds) {
    if (isNaN(seconds)) return '00:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  }

  btnAudioPlay.addEventListener('click', () => {
    if (audioEl.paused) {
      audioEl.play().catch(e => console.warn('Không thể tự phát audio:', e));
      iconAudioPlay.textContent = 'pause';
    } else {
      audioEl.pause();
      iconAudioPlay.textContent = 'play_arrow';
    }
  });

  audioEl.addEventListener('play', () => iconAudioPlay.textContent = 'pause');
  audioEl.addEventListener('pause', () => iconAudioPlay.textContent = 'play_arrow');

  let isDraggingProgress = false;

  audioEl.addEventListener('timeupdate', () => {
    if (audioEl.duration && !isDraggingProgress) {
      const pct = (audioEl.currentTime / audioEl.duration) * 100;
      audioProgress.value = pct;
      audioTimeDisplay.textContent = `${formatTime(audioEl.currentTime)} / ${formatTime(audioEl.duration)}`;
    }
  });

  audioEl.addEventListener('loadedmetadata', () => {
    audioTimeDisplay.textContent = `00:00 / ${formatTime(audioEl.duration)}`;
  });

  audioProgress.addEventListener('mousedown', () => { isDraggingProgress = true; });
  audioProgress.addEventListener('touchstart', () => { isDraggingProgress = true; });

  audioProgress.addEventListener('input', () => {
    if (audioEl.duration) {
      const targetTime = (audioProgress.value / 100) * audioEl.duration;
      audioTimeDisplay.textContent = `${formatTime(targetTime)} / ${formatTime(audioEl.duration)}`;
    }
  });

  audioProgress.addEventListener('change', () => {
    if (audioEl.duration) {
      const targetTime = (audioProgress.value / 100) * audioEl.duration;
      audioEl.currentTime = targetTime;
    }
    isDraggingProgress = false;
  });

  audioProgress.addEventListener('mouseup', () => { isDraggingProgress = false; });
  audioProgress.addEventListener('touchend', () => { isDraggingProgress = false; });

  function seekAudio(delta) {
    if (isNaN(audioEl.duration) || audioEl.duration <= 0) return;
    const target = Math.max(0, Math.min(audioEl.duration, audioEl.currentTime + delta));
    audioEl.currentTime = target;
    const pct = (target / audioEl.duration) * 100;
    audioProgress.value = pct;
    audioTimeDisplay.textContent = `${formatTime(target)} / ${formatTime(audioEl.duration)}`;
  }

  btnAudioRewind.addEventListener('click', () => {
    seekAudio(-5);
  });

  btnAudioForward.addEventListener('click', () => {
    seekAudio(5);
  });

  speedBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      speedBtns.forEach(b => b.className = 'speed-btn px-2 py-0.5 rounded text-[11px] font-bold bg-slate-200 text-slate-600 hover:bg-slate-300');
      btn.className = 'speed-btn px-2 py-0.5 rounded text-[11px] font-bold bg-brand-800 text-white';
      audioEl.playbackRate = parseFloat(btn.getAttribute('data-speed'));
    });
  });

  // 4. Timer Countdown
  function updateTimerDisplay() {
    const m = Math.floor(secondsLeft / 60);
    const s = Math.floor(secondsLeft % 60);
    examTimer.textContent = `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;

    if (secondsLeft <= 300) {
      examTimer.parentElement.classList.add('bg-rose-50', 'border-rose-300', 'text-rose-600');
    }

    if (secondsLeft <= 0) {
      clearInterval(timerInterval);
      alert('Đã hết 120 phút làm bài! Hệ thống sẽ tự động nộp bài.');
      executeSubmit();
    }
  }

  timerInterval = setInterval(() => {
    if (secondsLeft > 0) {
      secondsLeft--;
      updateTimerDisplay();
      if (secondsLeft % 10 === 0) {
        localStorage.setItem(`toeic_exam_time_${testId}`, secondsLeft.toString());
      }
    }
  }, 1000);
  updateTimerDisplay();

  // 5. Render Part Quick Navigator Pills
  for (let p = 1; p <= 7; p++) {
    const part = TOEIC_PARTS[p];
    const pill = document.createElement('button');
    pill.className = 'px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-colors bg-white hover:bg-brand-50 text-slate-700 hover:text-brand-700 border border-slate-200 shadow-2xs';
    pill.innerHTML = `<span>${part.shortName}</span> <span class="text-[10px] text-slate-400">(${part.start}-${part.end})</span>`;
    
    pill.addEventListener('click', () => {
      // Tự động chuyển tab PDF phù hợp
      if (p <= 4 && currentPdfTab !== 'lc') updatePdfView('lc');
      if (p >= 5 && currentPdfTab !== 'rc') updatePdfView('rc');

      // Cuộn đến câu đầu tiên của Part
      const targetEl = document.getElementById(`question-card-${part.start}`);
      if (targetEl) targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    partPillsContainer.appendChild(pill);
  }

  // 6. Render 200 Câu hỏi
  function renderQuestionsList() {
    questionsContainer.innerHTML = '';

    for (let p = 1; p <= 7; p++) {
      const part = TOEIC_PARTS[p];

      // Header của mỗi Part
      const partHeader = document.createElement('div');
      partHeader.className = 'sticky top-0 z-10 bg-slate-100/95 backdrop-blur px-3 py-2 rounded-xl border border-slate-200 flex items-center justify-between mb-3 shadow-xs';
      partHeader.innerHTML = `
        <span class="text-xs font-bold text-slate-800">${part.name}</span>
        <span class="text-[11px] font-semibold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">Câu ${part.start} - ${part.end}</span>
      `;
      questionsContainer.appendChild(partHeader);

      // Render từng câu hỏi trong Part
      for (let q = part.start; q <= part.end; q++) {
        const isPart2 = (p === 2); // Part 2 chỉ có 3 đáp án: A, B, C
        const options = isPart2 ? ['A', 'B', 'C'] : ['A', 'B', 'C', 'D'];
        const currentAns = userAnswers[q] || '';
        const isFlagged = flaggedQuestions.has(q);

        const qCard = document.createElement('div');
        qCard.id = `question-card-${q}`;
        qCard.className = `p-3 rounded-xl border transition-all ${
          isFlagged ? 'bg-amber-50/60 border-amber-300' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
        }`;

        qCard.innerHTML = `
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-2">
              <span class="text-xs font-bold text-slate-900">Câu ${q < 10 ? '0' + q : q}</span>
              <span id="badge-selected-${q}" class="text-[10px] font-bold px-2 py-0.5 rounded-full ${
                currentAns ? 'bg-brand-100 text-brand-700' : 'bg-slate-200/60 text-slate-400'
              }">
                ${currentAns ? `Đã chọn: ${currentAns}` : 'Chưa chọn'}
              </span>
            </div>
            <button data-q="${q}" class="btn-flag text-slate-400 hover:text-amber-500 transition-colors ${
              isFlagged ? 'text-amber-500' : ''
            }" title="Cắm cờ xem lại">
              <span class="material-symbols-outlined text-[18px]">${isFlagged ? 'bookmark' : 'bookmark_border'}</span>
            </button>
          </div>

          <div class="grid grid-cols-${options.length} gap-2">
            ${options.map(opt => `
              <button 
                data-q="${q}" 
                data-opt="${opt}" 
                class="opt-btn-${q} h-10 rounded-lg text-xs font-extrabold flex items-center justify-center transition-all active:scale-95 ${
                  currentAns === opt 
                    ? 'bg-brand-800 text-white shadow-sm shadow-brand-800/30 ring-2 ring-brand-800' 
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                }"
              >
                ${opt}
              </button>
            `).join('')}
          </div>
        `;

        // Gắn sự kiện chọn đáp án
        qCard.querySelectorAll(`[data-opt]`).forEach(btn => {
          btn.addEventListener('click', (e) => {
            const chosenQ = parseInt(btn.getAttribute('data-q'), 10);
            const chosenOpt = btn.getAttribute('data-opt');

            if (userAnswers[chosenQ] === chosenOpt) {
              // Bấm lại để bỏ chọn
              delete userAnswers[chosenQ];
            } else {
              userAnswers[chosenQ] = chosenOpt;
            }

            // Lưu localStorage
            localStorage.setItem(`toeic_exam_answers_${testId}`, JSON.stringify(userAnswers));
            
            // Cập nhật giao diện nút
            updateQuestionUI(chosenQ);
            updateAnsweredBadge();
            updateMatrixItem(chosenQ);
          });
        });

        // Gắn sự kiện cắm cờ
        const flagBtn = qCard.querySelector('.btn-flag');
        flagBtn.addEventListener('click', () => {
          const targetQ = parseInt(flagBtn.getAttribute('data-q'), 10);
          if (flaggedQuestions.has(targetQ)) {
            flaggedQuestions.delete(targetQ);
          } else {
            flaggedQuestions.add(targetQ);
          }
          localStorage.setItem(`toeic_exam_flags_${testId}`, JSON.stringify([...flaggedQuestions]));
          updateQuestionUI(targetQ);
          updateMatrixItem(targetQ);
        });

        questionsContainer.appendChild(qCard);
      }
    }
  }

  // Hàm cập nhật giao diện của 1 câu hỏi sau khi chọn
  function updateQuestionUI(q) {
    const card = document.getElementById(`question-card-${q}`);
    if (!card) return;

    const currentAns = userAnswers[q] || '';
    const isFlagged = flaggedQuestions.has(q);

    // Card style
    card.className = `p-3 rounded-xl border transition-all ${
      isFlagged ? 'bg-amber-50/60 border-amber-300' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
    }`;

    // Badge
    const badge = document.getElementById(`badge-selected-${q}`);
    if (badge) {
      badge.textContent = currentAns ? `Đã chọn: ${currentAns}` : 'Chưa chọn';
      badge.className = `text-[10px] font-bold px-2 py-0.5 rounded-full ${
        currentAns ? 'bg-brand-100 text-brand-700' : 'bg-slate-200/60 text-slate-400'
      }`;
    }

    // Flag icon
    const flagBtn = card.querySelector('.btn-flag');
    if (flagBtn) {
      flagBtn.className = `btn-flag transition-colors ${isFlagged ? 'text-amber-500' : 'text-slate-400 hover:text-amber-500'}`;
      flagBtn.querySelector('.material-symbols-outlined').textContent = isFlagged ? 'bookmark' : 'bookmark_border';
    }

    // Option buttons
    card.querySelectorAll(`.opt-btn-${q}`).forEach(btn => {
      const opt = btn.getAttribute('data-opt');
      if (currentAns === opt) {
        btn.className = `opt-btn-${q} h-10 rounded-lg text-xs font-extrabold flex items-center justify-center transition-all active:scale-95 bg-brand-800 text-white shadow-sm shadow-brand-800/30 ring-2 ring-brand-800`;
      } else {
        btn.className = `opt-btn-${q} h-10 rounded-lg text-xs font-extrabold flex items-center justify-center transition-all active:scale-95 bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 hover:border-slate-300`;
      }
    });
  }

  // Cập nhật tổng số câu đã làm
  function updateAnsweredBadge() {
    const count = Object.keys(userAnswers).length;
    badgeAnsweredCount.textContent = `${count}/200`;
  }

  // 7. Render Question Matrix Modal
  function renderMatrixModal() {
    matrixGridSections.innerHTML = '';

    for (let p = 1; p <= 7; p++) {
      const part = TOEIC_PARTS[p];
      const partBlock = document.createElement('div');
      partBlock.innerHTML = `
        <h4 class="text-xs font-bold text-slate-700 mb-2">${part.shortName} (Câu ${part.start} - ${part.end})</h4>
        <div class="grid grid-cols-10 gap-1.5" id="matrix-part-${p}"></div>
      `;
      const grid = partBlock.querySelector(`#matrix-part-${p}`);

      for (let q = part.start; q <= part.end; q++) {
        const item = document.createElement('button');
        item.id = `matrix-btn-${q}`;
        item.className = getMatrixItemClass(q);
        item.textContent = q;
        item.title = `Câu ${q}`;

        item.addEventListener('click', () => {
          modalMatrix.classList.add('hidden');
          // Chuyển tab PDF nếu cần
          if (q <= 100 && currentPdfTab !== 'lc') updatePdfView('lc');
          if (q > 100 && currentPdfTab !== 'rc') updatePdfView('rc');

          const targetCard = document.getElementById(`question-card-${q}`);
          if (targetCard) {
            targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
            targetCard.classList.add('ring-2', 'ring-brand-500');
            setTimeout(() => targetCard.classList.remove('ring-2', 'ring-brand-500'), 1500);
          }
        });

        grid.appendChild(item);
      }

      matrixGridSections.appendChild(partBlock);
    }
  }

  function getMatrixItemClass(q) {
    const hasAns = !!userAnswers[q];
    const isFlag = flaggedQuestions.has(q);

    let base = 'h-8 rounded-lg text-[11px] font-extrabold flex items-center justify-center transition-all active:scale-95 ';
    if (isFlag) return base + 'bg-amber-500 text-white shadow-xs';
    if (hasAns) return base + 'bg-brand-800 text-white shadow-xs';
    return base + 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200';
  }

  function updateMatrixItem(q) {
    const item = document.getElementById(`matrix-btn-${q}`);
    if (item) item.className = getMatrixItemClass(q);
  }

  btnOpenMatrix.addEventListener('click', () => {
    modalMatrix.classList.remove('hidden');
  });

  closeModalMatrix.addEventListener('click', () => {
    modalMatrix.classList.add('hidden');
  });

  modalMatrix.addEventListener('click', (e) => {
    if (e.target === modalMatrix) modalMatrix.classList.add('hidden');
  });

  // 8. Xử lý Nộp bài
  btnSubmit.addEventListener('click', () => {
    const answeredCount = Object.keys(userAnswers).length;
    const unansweredCount = 200 - answeredCount;

    submitAnsweredText.textContent = `${answeredCount} / 200 câu`;
    submitUnansweredText.textContent = `${unansweredCount} câu`;
    submitTimeLeftText.textContent = examTimer.textContent;

    modalSubmit.classList.remove('hidden');
  });

  btnCancelSubmit.addEventListener('click', () => {
    modalSubmit.classList.add('hidden');
  });

  modalSubmit.addEventListener('click', (e) => {
    if (e.target === modalSubmit) modalSubmit.classList.add('hidden');
  });

  btnConfirmSubmit.addEventListener('click', () => {
    modalSubmit.classList.add('hidden');
    executeSubmit();
  });

  async function executeSubmit() {
    clearInterval(timerInterval);

    // Tải bộ đáp án đúng từ file JSON
    let correctAnswers = {};
    try {
      const res = await fetch(currentTest.answersFile);
      const allAnswers = await res.json();
      correctAnswers = allAnswers[currentTest.answerKey] || {};
    } catch (e) {
      console.error('Lỗi tải đáp án chuẩn:', e);
      alert('Không thể kết nối đến tệp đáp án. Đang sử dụng đáp án mặc định.');
    }

    // Tính điểm theo chuẩn ETS
    const scoreResult = calculateToeicScore(userAnswers, correctAnswers);

    // Lưu kết quả đầy đủ vào localStorage
    const finalReport = {
      testId: currentTest.id,
      title: currentTest.title,
      submittedAt: new Date().toISOString(),
      timeSpentSeconds: (120 * 60) - secondsLeft,
      userAnswers,
      correctAnswers,
      score: scoreResult
    };

    saveTestResult(currentTest.id, finalReport);

    // Dọn dẹp bản nháp tạm
    localStorage.removeItem(`toeic_exam_answers_${testId}`);
    localStorage.removeItem(`toeic_exam_flags_${testId}`);
    localStorage.removeItem(`toeic_exam_time_${testId}`);

    // Chuyển hướng sang trang Result
    window.location.href = `result.html?test=${currentTest.id}`;
  }

  // 9. Nút Back về Dashboard
  btnBack.addEventListener('click', () => {
    const answeredCount = Object.keys(userAnswers).length;
    if (answeredCount > 0) {
      if (confirm('Bài làm của bạn đã được tự động lưu tạm. Bạn có chắc muốn quay về trang chủ không?')) {
        window.location.href = 'index.html';
      }
    } else {
      window.location.href = 'index.html';
    }
  });

  // Khởi chạy giao diện
  renderQuestionsList();
  renderMatrixModal();
  updateAnsweredBadge();
});
