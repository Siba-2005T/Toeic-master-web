/**
 * Logic Trang chủ Dashboard (web_app/js/app.js)
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Đợi nạp MEDIA_BASE_URL từ Vercel Environment Variables nếu có
  if (window.mediaReadyPromise) await window.mediaReadyPromise;

  // Khởi tạo trạng thái
  let currentFilter = 'all';
  let searchQuery = '';

  // DOM Elements
  const testGrid = document.getElementById('test-grid');
  const emptyState = document.getElementById('empty-state');
  const searchInput = document.getElementById('search-input');
  const filterBtns = document.querySelectorAll('.filter-btn');

  // Stats Elements
  const statTotalTests = document.getElementById('stat-total-tests');
  const statCompletedTests = document.getElementById('stat-completed-tests');
  const statHighestScore = document.getElementById('stat-highest-score');
  const statAvgScore = document.getElementById('stat-avg-score');

  // Modal Elements
  const modalCloud = document.getElementById('modal-cloud');
  const btnCloudConfig = document.getElementById('btn-cloud-config');
  const closeModalCloud = document.getElementById('close-modal-cloud');
  const inputMediaUrl = document.getElementById('input-media-url');
  const btnSaveCloud = document.getElementById('btn-save-cloud');
  const btnResetHistory = document.getElementById('btn-reset-history');

  // Hàm tính toán thống kê
  function updateDashboardStats() {
    const total = TOEIC_TESTS.length;
    let completedCount = 0;
    let highest = 0;
    let sumScore = 0;

    TOEIC_TESTS.forEach(test => {
      const prog = getTestProgress(test.id);
      if (prog && prog.score) {
        completedCount++;
        const score = prog.score.totalScaled || 0;
        if (score > highest) highest = score;
        sumScore += score;
      }
    });

    statTotalTests.textContent = `${total} Đề`;
    statCompletedTests.textContent = `${completedCount} / ${total}`;
    statHighestScore.textContent = completedCount > 0 ? `${highest} / 990` : '-- / 990';
    statAvgScore.textContent = completedCount > 0 ? `${Math.round(sumScore / completedCount)} / 990` : '-- / 990';
  }

  // Hàm render danh sách đề thi
  function renderTests() {
    testGrid.innerHTML = '';

    const filtered = TOEIC_TESTS.filter(test => {
      const prog = getTestProgress(test.id);
      const isCompleted = prog && prog.score;

      // Filter theo tab
      let matchFilter = true;
      if (currentFilter === 'ets2024') matchFilter = test.series === 'ETS 2024';
      else if (currentFilter === 'ets2025') matchFilter = test.series === 'ETS 2025';
      else if (currentFilter === 'completed') matchFilter = isCompleted;
      else if (currentFilter === 'uncompleted') matchFilter = !isCompleted;

      // Filter theo search
      let matchSearch = true;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        matchSearch = test.title.toLowerCase().includes(query) ||
                      test.series.toLowerCase().includes(query) ||
                      `test ${test.testNum}`.includes(query);
      }

      return matchFilter && matchSearch;
    });

    if (filtered.length === 0) {
      emptyState.classList.remove('hidden');
    } else {
      emptyState.classList.add('hidden');
    }

    filtered.forEach(test => {
      const prog = getTestProgress(test.id);
      const isCompleted = !!(prog && prog.score);
      const score = isCompleted ? prog.score.totalScaled : 0;
      const lcScore = isCompleted ? prog.score.lcScaled : 0;
      const rcScore = isCompleted ? prog.score.rcScaled : 0;
      const correctCount = isCompleted ? prog.score.totalCorrect : 0;

      const card = document.createElement('div');
      card.className = "bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group hover:border-brand-300 relative overflow-hidden";

      const badgeColor = test.series === 'ETS 2025' 
        ? 'bg-purple-100 text-purple-700 border-purple-200' 
        : 'bg-blue-100 text-brand-700 border-blue-200';

      card.innerHTML = `
        <div>
          <!-- Top Row: Badge & Year -->
          <div class="flex items-center justify-between gap-2 mb-3">
            <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${badgeColor}">
              ${test.series}
            </span>
            ${isCompleted 
              ? `<span class="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                   <span class="material-symbols-outlined text-[14px]">check_circle</span> Đã làm
                 </span>`
              : `<span class="text-[11px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                   Chưa làm
                 </span>`
            }
          </div>

          <!-- Title -->
          <h3 class="text-base font-bold text-slate-900 group-hover:text-brand-700 transition-colors">
            ${test.title}
          </h3>

          <!-- Details info -->
          <div class="mt-3 flex items-center gap-4 text-xs text-slate-500 font-medium">
            <span class="inline-flex items-center gap-1">
              <span class="material-symbols-outlined text-[16px] text-slate-400">help</span>
              200 câu
            </span>
            <span class="inline-flex items-center gap-1">
              <span class="material-symbols-outlined text-[16px] text-slate-400">timer</span>
              120 phút
            </span>
            <span class="inline-flex items-center gap-1">
              <span class="material-symbols-outlined text-[16px] text-slate-400">headphones</span>
              Audio chuẩn
            </span>
          </div>

          <!-- Score display if completed -->
          ${isCompleted ? `
            <div class="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div>
                <span class="text-[10px] uppercase font-bold text-slate-400 block">Điểm bài thi:</span>
                <span class="text-xl font-extrabold text-emerald-600">${score} <span class="text-xs font-semibold text-slate-500">/ 990</span></span>
              </div>
              <div class="text-right text-[11px] text-slate-500 font-medium">
                <div>LC: <strong class="text-slate-800">${lcScore}</strong> (câu ${prog.score.lcCorrect}/100)</div>
                <div>RC: <strong class="text-slate-800">${rcScore}</strong> (câu ${prog.score.rcCorrect}/100)</div>
              </div>
            </div>
          ` : `
            <div class="mt-4 p-3 rounded-xl bg-slate-50/60 border border-dashed border-slate-200 text-xs text-slate-500 flex items-center gap-2">
              <span class="material-symbols-outlined text-[18px] text-brand-600">bolt</span>
              <span>Đầy đủ Listening, Reading và chấm điểm tự động.</span>
            </div>
          `}
        </div>

        <!-- Action Buttons -->
        <div class="mt-5 pt-3 border-t border-slate-100 flex items-center gap-2">
          ${isCompleted ? `
            <a href="result.html?test=${test.id}" class="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold text-center transition-colors">
              Xem kết quả
            </a>
            <a href="exam.html?test=${test.id}" class="flex-1 py-2 px-3 rounded-xl bg-brand-800 hover:bg-brand-700 text-white text-xs font-bold text-center transition-all shadow-sm">
              Làm lại
            </a>
          ` : `
            <a href="exam.html?test=${test.id}" class="w-full py-2.5 px-4 rounded-xl bg-brand-800 hover:bg-brand-700 active:scale-[0.98] text-white text-xs font-bold text-center transition-all shadow-sm shadow-brand-700/20 flex items-center justify-center gap-1.5">
              <span>Bắt đầu thi</span>
              <span class="material-symbols-outlined text-[16px]">arrow_forward</span>
            </a>
          `}
        </div>
      `;

      testGrid.appendChild(card);
    });
  }

  // Bắt sự kiện lọc tab
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => {
        b.className = 'filter-btn px-4 py-2 rounded-xl text-xs font-bold transition-all bg-slate-100 text-slate-700 hover:bg-slate-200';
      });
      btn.className = 'filter-btn px-4 py-2 rounded-xl text-xs font-bold transition-all bg-brand-800 text-white shadow-sm';
      currentFilter = btn.getAttribute('data-filter');
      renderTests();
    });
  });

  // Bắt sự kiện search
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderTests();
  });

  // Xử lý Modal Cloud Config
  btnCloudConfig.addEventListener('click', () => {
    inputMediaUrl.value = localStorage.getItem('toeic_media_base_url') || '';
    modalCloud.classList.remove('hidden');
  });

  closeModalCloud.addEventListener('click', () => {
    modalCloud.classList.add('hidden');
  });

  modalCloud.addEventListener('click', (e) => {
    if (e.target === modalCloud) modalCloud.classList.add('hidden');
  });

  btnSaveCloud.addEventListener('click', () => {
    const val = inputMediaUrl.value.trim().replace(/\/+$/, '');
    if (val) {
      localStorage.setItem('toeic_media_base_url', val);
      window.MEDIA_BASE_URL = val;
      alert(`Đã lưu Media Base URL: ${val}`);
    } else {
      localStorage.removeItem('toeic_media_base_url');
      window.MEDIA_BASE_URL = '';
      alert('Đã thiết lập lại đường dẫn Media về mặc định (Local Server).');
    }
    modalCloud.classList.add('hidden');
  });

  // Xóa toàn bộ lịch sử thi
  btnResetHistory.addEventListener('click', () => {
    if (confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử điểm số và bài thi đã làm không?')) {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k.startsWith('toeic_result_') || k.startsWith('toeic_exam_answers_') || k === 'toeic_completed_tests')) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
      updateDashboardStats();
      renderTests();
      alert('Đã làm mới toàn bộ lịch sử bài thi!');
    }
  });

  // Khởi động
  updateDashboardStats();
  renderTests();
});
