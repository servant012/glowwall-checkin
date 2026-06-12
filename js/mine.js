/* ============================================
   东方圣光 · 我的打卡页面逻辑
   ============================================ */

let myName = '';

async function loadMinePage() {
  myName = localStorage.getItem('member_name') || '';

  if (!myName) {
    showIdentityModal();
  } else {
    document.getElementById('mineName').textContent = myName;
    document.getElementById('mineAvatar').textContent = myName.charAt(0);
    await loadMineData();
  }

  // 点击修改名字
  document.getElementById('mineIdentity').onclick = showIdentityModal;
}

function showIdentityModal() {
  document.getElementById('identityInput').value = myName || '';
  document.getElementById('identityModal').style.display = 'flex';
}

function saveIdentity() {
  const name = document.getElementById('identityInput').value.trim();
  if (!name) {
    showToast('请输入名字', 'warning');
    return;
  }
  myName = name;
  localStorage.setItem('member_name', name);
  document.getElementById('identityModal').style.display = 'none';
  document.getElementById('mineName').textContent = name;
  document.getElementById('mineAvatar').textContent = name.charAt(0);
  loadMineData();
}

// 关闭身份弹窗（点击遮罩）
document.addEventListener('click', (e) => {
  if (e.target.id === 'identityModal') {
    document.getElementById('identityModal').style.display = 'none';
  }
});

async function loadMineData() {
  if (!myName) return;

  try {
    // 获取本月数据
    const { year, month } = getMonthRange();
    const checkins = await getMemberCheckinsInMonth(myName, year, month);
    const allCheckins = await getCheckinsByMember(myName, 1, 50);

    // 统计数据
    const monthCount = checkins ? checkins.length : 0;
    const today = getTodayDateStr();
    const daysInMonth = new Date(year, month, 0).getDate();
    const elapsedDays = Math.min(parseInt(today.split('-')[2]), daysInMonth);
    const rate = elapsedDays > 0 ? Math.round((monthCount / elapsedDays) * 100) : 0;

    // 连续天数
    const streak = calcStreak(allCheckins);

    document.getElementById('statMonthCount').textContent = monthCount;
    document.getElementById('statStreak').textContent = streak;
    document.getElementById('statRate').textContent = rate + '%';

    // 历史记录
    renderHistory(allCheckins);
  } catch (err) {
    console.error('加载我的数据失败:', err);
  }
}

function calcStreak(checkins) {
  if (!checkins || checkins.length === 0) return 0;

  const dates = new Set(checkins.map(c => c.task_date));
  const today = getTodayDateStr();

  let streak = 0;
  const d = new Date(today + 'T00:00:00+08:00');

  // 检查今天或昨天是否有打卡
  if (!dates.has(today)) {
    // 如果今天没打卡，检查昨天
    const yesterday = new Date(d.getTime() - 86400000).toISOString().split('T')[0];
    if (!dates.has(yesterday)) return 0; // 断签
    d.setTime(d.getTime() - 86400000);
  }

  while (true) {
    const dateStr = d.toISOString().split('T')[0];
    if (dates.has(dateStr)) {
      streak++;
      d.setTime(d.getTime() - 86400000);
    } else {
      break;
    }
  }

  return streak;
}

function renderHistory(checkins) {
  const container = document.getElementById('historyList');
  const empty = document.getElementById('historyEmpty');

  if (!checkins || checkins.length === 0) {
    container.innerHTML = '';
    empty.style.display = 'flex';
    return;
  }

  empty.style.display = 'none';
  container.innerHTML = checkins.map(c => {
    const thumb = c.image_urls && c.image_urls.length > 0 ? c.image_urls[0] : null;
    return `
      <div class="history-item">
        <div class="history-date">${c.task_date}</div>
        <div class="history-info">
          <div class="history-task">已打卡</div>
          ${c.note ? `<div class="history-note">${escapeHtml(c.note)}</div>` : ''}
        </div>
        ${thumb ? `<img class="history-thumb" src="${thumb}" alt="">` : ''}
        <span class="history-status" style="color:var(--color-success)">✓ 已完成</span>
      </div>
    `;
  }).join('');
}
