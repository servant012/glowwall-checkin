/* ============================================
   东方圣光 · 公告页面逻辑
   ============================================ */

let announcements = [];

async function loadAnnouncements() {
  try {
    announcements = await getAnnouncements();
    renderAnnouncementList();
  } catch (err) {
    console.error('加载公告失败:', err);
    document.getElementById('announcementList').innerHTML = '';
    document.getElementById('annEmpty').style.display = 'flex';
  }
}

function renderAnnouncementList() {
  const list = document.getElementById('announcementList');
  const empty = document.getElementById('annEmpty');

  if (!announcements || announcements.length === 0) {
    list.innerHTML = '';
    empty.style.display = 'flex';
    return;
  }

  empty.style.display = 'none';
  list.innerHTML = announcements.map(a => `
    <div class="announcement-item" onclick="openAnnDetail('${a.id}')">
      <div class="ann-header">
        ${a.is_pinned ? '<span class="tag tag-pinned">置顶</span>' : ''}
        <span class="ann-title">${escapeHtml(a.title)}</span>
      </div>
      <div class="ann-time">${formatDate(a.created_at)}</div>
      <div class="ann-summary line-clamp-2">${escapeHtml(a.content)}</div>
    </div>
  `).join('');
}

function openAnnDetail(id) {
  const a = announcements.find(x => x.id === id);
  if (!a) return;

  document.getElementById('annDetailTitle').textContent = a.title;
  document.getElementById('annDetailMeta').textContent = `发布于 ${formatDate(a.created_at)}${a.is_pinned ? ' · 置顶' : ''}`;
  document.getElementById('annDetailContent').textContent = a.content;

  document.getElementById('announcementList').style.display = 'none';
  document.getElementById('annEmpty').style.display = 'none';
  document.getElementById('annDetail').style.display = 'block';
}

function closeAnnDetail() {
  document.getElementById('annDetail').style.display = 'none';
  document.getElementById('announcementList').style.display = '';
  document.getElementById('annEmpty').style.display = announcements.length === 0 ? 'flex' : 'none';
}
