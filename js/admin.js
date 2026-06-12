/* ============================================
   东方圣光 · 管理后台逻辑
   ============================================ */

let adminAuthed = false;
let currentAdminSub = 'overview';
let editingAnnId = null;
let adminAnnouncements = [];

// --- 管理员入口 ---
function checkAdminAccess() {
  if (sessionStorage.getItem('admin_authed') === 'true') {
    adminAuthed = true;
    initAdmin();
  } else {
    showPasswordModal();
  }
}

function showPasswordModal() {
  document.getElementById('passwordModal').style.display = 'flex';
  document.getElementById('adminPasswordInput').value = '';
  document.getElementById('adminPasswordInput').focus();
}

function verifyAdmin() {
  const input = document.getElementById('adminPasswordInput').value;
  if (input === ADMIN_PASSWORD) {
    adminAuthed = true;
    sessionStorage.setItem('admin_authed', 'true');
    document.getElementById('passwordModal').style.display = 'none';
    initAdmin();
  } else {
    showToast('密码错误', 'error');
  }
}

// 回车提交密码
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && document.getElementById('passwordModal').style.display === 'flex') {
    verifyAdmin();
  }
});

// 点击遮罩关闭
document.addEventListener('click', (e) => {
  if (e.target.id === 'passwordModal') {
    document.getElementById('passwordModal').style.display = 'none';
  }
});

// --- 初始化 ---
function initAdmin() {
  document.getElementById('adminDate').textContent = `今天：${getTodayDateStr()}`;
  initAdminNav();
  loadAdminOverview();
}

// --- 子导航 ---
function initAdminNav() {
  document.querySelectorAll('.admin-nav-item').forEach(item => {
    item.addEventListener('click', () => {
      currentAdminSub = item.dataset.sub;
      document.querySelectorAll('.admin-nav-item').forEach(x => x.classList.remove('active'));
      item.classList.add('active');
      document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
      document.getElementById(`admin-${currentAdminSub}`).classList.add('active');

      if (currentAdminSub === 'overview') loadAdminOverview();
      else if (currentAdminSub === 'members') loadAdminMembers();
      else if (currentAdminSub === 'tasks') loadAdminTasks();
      else if (currentAdminSub === 'announcements') loadAdminAnnouncements();
    });
  });
}

// --- A. 今日概览 ---
async function loadAdminOverview() {
  try {
    const today = getTodayDateStr();
    const members = await getMembers();
    const { data: checkins, count: checkinCount } = await getCheckinsByDate(today, 1, 1);
    const totalMembers = members ? members.length : 0;
    const absentCount = totalMembers - (checkinCount || 0);
    const rate = totalMembers > 0 ? Math.round(((checkinCount || 0) / totalMembers) * 100) : 0;

    document.getElementById('overviewStats').innerHTML = `
      <div class="stat-card">
        <div class="stat-num">${totalMembers}</div>
        <div class="stat-label">总人数</div>
      </div>
      <div class="stat-card">
        <div class="stat-num success">${checkinCount || 0}</div>
        <div class="stat-label">今日打卡</div>
      </div>
      <div class="stat-card">
        <div class="stat-num danger">${absentCount}</div>
        <div class="stat-label">今日缺席</div>
      </div>
      <div class="stat-card">
        <div class="stat-num">${rate}%</div>
        <div class="stat-label">出勤率</div>
      </div>
    `;

    document.getElementById('progressFill').style.width = rate + '%';
    document.getElementById('progressLabel').textContent = `出勤率 ${rate}%`;

    // 连续缺席检测
    await loadWarnings(members, checkins || []);
  } catch (err) {
    console.error('加载概览失败:', err);
  }
}

async function loadWarnings(members, todayCheckins) {
  const container = document.getElementById('warningList');
  const today = getTodayDateStr();
  const todayNames = new Set(todayCheckins.map(c => c.member_name));

  // 检查每个成员最近打卡情况
  const warnings = [];
  for (const m of members) {
    if (todayNames.has(m.name)) continue; // 今天打了卡，跳过

    // 获取该成员最近打卡记录
    const checkins = await getCheckinsByMember(m.name, 1, 10);
    const dates = new Set(checkins.map(c => c.task_date));

    // 检查昨天是否也缺席
    const d = new Date(today + 'T00:00:00');
    d.setTime(d.getTime() - 86400000);
    const yesterday = d.toISOString().split('T')[0];

    if (!dates.has(yesterday)) {
      warnings.push(m.name);
    }
  }

  if (warnings.length > 0) {
    container.innerHTML = warnings.map(n =>
      `<div class="member-item">
        <div class="member-info">
          <div class="member-name">${escapeHtml(n)}</div>
          <div class="member-meta" style="color:var(--color-danger)">连续缺席 2 天以上</div>
        </div>
      </div>`
    ).join('');
  } else {
    container.innerHTML = '<div class="empty-state" style="padding:20px"><div class="empty-text">暂无需要关注的成员</div></div>';
  }
}

// --- B. 成员管理 ---
async function loadAdminMembers() {
  try {
    const members = await getMembers();
    const container = document.getElementById('memberList');

    if (!members || members.length === 0) {
      container.innerHTML = '<div class="empty-state" style="padding:20px"><div class="empty-text">暂无成员</div></div>';
      return;
    }

    container.innerHTML = members.map(m => `
      <div class="member-item">
        <div class="member-info">
          <div class="member-name">${escapeHtml(m.name)}</div>
          <div class="member-meta">加入于 ${formatDate(m.joined_at)}</div>
        </div>
        <div class="member-actions">
          <button class="btn btn-outline btn-sm" onclick="deactivateMemberHandler('${escapeHtml(m.name)}')">停用</button>
        </div>
      </div>
    `).join('');
  } catch (err) {
    console.error('加载成员失败:', err);
  }
}

async function addNewMember() {
  const input = document.getElementById('newMemberName');
  const name = input.value.trim();
  if (!name) { showToast('请输入名字', 'warning'); return; }

  try {
    await addMember(name);
    showToast('成员已添加', 'success');
    input.value = '';
    loadAdminMembers();
  } catch (err) {
    console.error('添加成员失败:', err);
    showToast('添加失败', 'error');
  }
}

async function deactivateMemberHandler(name) {
  if (!confirm(`确定停用成员「${name}」吗？历史记录将保留。`)) return;
  try {
    await deactivateMember(name);
    await logAdminAction('deactivate_member', name, '停用成员');
    showToast('已停用', 'success');
    loadAdminMembers();
  } catch (err) {
    console.error('停用失败:', err);
    showToast('操作失败', 'error');
  }
}

// --- C. 任务管理 ---
async function loadAdminTasks() {
  try {
    // 今日任务
    const todayTask = await getTodayTask();
    if (todayTask && todayTask.task_date === getTodayDateStr()) {
      document.getElementById('todayTaskTitle').value = todayTask.title;
      document.getElementById('todayTaskDesc').value = todayTask.description || '';
    } else {
      document.getElementById('todayTaskTitle').value = '';
      document.getElementById('todayTaskDesc').value = '';
    }

    // 历史任务
    const { year, month } = getMonthRange();
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const tasks = await getTasksByDateRange(startDate, getTodayDateStr());
    const container = document.getElementById('taskHistory');

    if (!tasks || tasks.length === 0) {
      container.innerHTML = '<div class="empty-state" style="padding:12px"><div class="empty-text">本月暂无任务</div></div>';
    } else {
      container.innerHTML = tasks.map(t => `
        <div class="member-item">
          <div class="member-info">
            <div class="member-name">${escapeHtml(t.title)}</div>
            <div class="member-meta">${t.task_date}</div>
          </div>
        </div>
      `).join('');
    }
  } catch (err) {
    console.error('加载任务失败:', err);
  }
}

async function saveTodayTask() {
  const title = document.getElementById('todayTaskTitle').value.trim();
  if (!title) { showToast('请输入任务标题', 'warning'); return; }

  const desc = document.getElementById('todayTaskDesc').value.trim();
  try {
    await setTask(getTodayDateStr(), title, desc);
    await logAdminAction('set_task', getTodayDateStr(), title);
    showToast('今日任务已更新', 'success');
    loadTodayTask(); // 刷新页面 header
  } catch (err) {
    console.error('保存任务失败:', err);
    showToast('保存失败', 'error');
  }
}

async function saveTomorrowTask() {
  const title = document.getElementById('tomorrowTaskTitle').value.trim();
  if (!title) { showToast('请输入任务标题', 'warning'); return; }

  const desc = document.getElementById('tomorrowTaskDesc').value.trim();
  const d = new Date();
  const offset = 8 * 60;
  const local = new Date(d.getTime() + offset * 60000 + 86400000);
  const tomorrow = local.toISOString().split('T')[0];

  try {
    await setTask(tomorrow, title, desc);
    await logAdminAction('set_task', tomorrow, title);
    showToast('明天任务已设置', 'success');
    document.getElementById('tomorrowTaskTitle').value = '';
    document.getElementById('tomorrowTaskDesc').value = '';
  } catch (err) {
    console.error('保存失败:', err);
    showToast('保存失败', 'error');
  }
}

// --- D. 公告管理 ---
async function loadAdminAnnouncements() {
  try {
    adminAnnouncements = await getAnnouncements();
    const container = document.getElementById('adminAnnList');
    document.getElementById('annForm').style.display = 'none';
    editingAnnId = null;

    if (!adminAnnouncements || adminAnnouncements.length === 0) {
      container.innerHTML = '<div class="empty-state" style="padding:20px"><div class="empty-text">暂无公告</div></div>';
      return;
    }

    container.innerHTML = adminAnnouncements.map(a => `
      <div class="admin-announcement-item">
        <div style="display:flex;align-items:center;gap:6px">
          ${a.is_pinned ? '<span class="tag tag-pinned">置顶</span>' : ''}
          <strong>${escapeHtml(a.title)}</strong>
        </div>
        <div style="font-size:11px;color:var(--color-text-tertiary);margin-top:4px">${formatDate(a.created_at)}</div>
        <div style="font-size:12px;color:var(--color-text-secondary);margin-top:4px;line-height:1.5" class="line-clamp-2">${escapeHtml(a.content)}</div>
        <div class="ann-actions">
          <button class="btn btn-outline btn-sm" onclick="editAnnouncementHandler('${a.id}')">编辑</button>
          <button class="btn btn-danger btn-sm" onclick="deleteAnnouncementHandler('${a.id}')">删除</button>
        </div>
      </div>
    `).join('');
  } catch (err) {
    console.error('加载公告失败:', err);
  }
}

function showNewAnnouncementForm() {
  editingAnnId = null;
  document.getElementById('annFormTitle').textContent = '新建公告';
  document.getElementById('annTitle').value = '';
  document.getElementById('annContent').value = '';
  document.getElementById('annPinned').checked = false;
  document.getElementById('annExpires').value = '';
  document.getElementById('annForm').style.display = 'block';
  document.getElementById('adminAnnList').style.display = 'none';
}

function editAnnouncementHandler(id) {
  const a = adminAnnouncements.find(x => x.id === id);
  if (!a) return;
  editingAnnId = id;
  document.getElementById('annFormTitle').textContent = '编辑公告';
  document.getElementById('annTitle').value = a.title;
  document.getElementById('annContent').value = a.content;
  document.getElementById('annPinned').checked = a.is_pinned;
  document.getElementById('annExpires').value = a.expires_at ? a.expires_at.split('T')[0] : '';
  document.getElementById('annForm').style.display = 'block';
  document.getElementById('adminAnnList').style.display = 'none';
}

function cancelAnnForm() {
  document.getElementById('annForm').style.display = 'none';
  document.getElementById('adminAnnList').style.display = '';
  editingAnnId = null;
}

async function saveAnnouncement() {
  const title = document.getElementById('annTitle').value.trim();
  const content = document.getElementById('annContent').value.trim();
  if (!title || !content) { showToast('标题和内容不能为空', 'warning'); return; }

  const isPinned = document.getElementById('annPinned').checked;
  const expiresAt = document.getElementById('annExpires').value || null;

  try {
    if (editingAnnId) {
      await updateAnnouncement(editingAnnId, { title, content, is_pinned: isPinned, expires_at: expiresAt || null });
      await logAdminAction('edit_announcement', editingAnnId, title);
      showToast('公告已更新', 'success');
    } else {
      await createAnnouncement(title, content, isPinned, expiresAt);
      await logAdminAction('create_announcement', '', title);
      showToast('公告已发布', 'success');
    }
    cancelAnnForm();
    loadAdminAnnouncements();
  } catch (err) {
    console.error('保存公告失败:', err);
    showToast('保存失败', 'error');
  }
}

async function deleteAnnouncementHandler(id) {
  if (!confirm('确定删除此公告？')) return;
  try {
    await deleteAnnouncement(id);
    await logAdminAction('delete_announcement', id, '删除公告');
    showToast('公告已删除', 'success');
    loadAdminAnnouncements();
  } catch (err) {
    console.error('删除失败:', err);
    showToast('删除失败', 'error');
  }
}
