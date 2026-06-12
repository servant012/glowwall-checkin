/* ============================================
   东方圣光 · 打卡墙逻辑
   ============================================ */

let wallPage = 1;
let wallHasMore = true;
let wallLoading = false;
let selectedFiles = [];

// --- 打卡弹窗 ---
function initCheckinSheet() {
  document.getElementById('fabCheckin').addEventListener('click', openCheckin);
  document.getElementById('checkinOverlay').addEventListener('click', closeCheckin);
}

function openCheckin() {
  const name = localStorage.getItem('member_name') || '';
  document.getElementById('checkinName').value = name;
  document.getElementById('checkinNote').value = '';
  clearUploadPreview();
  document.getElementById('checkinOverlay').style.display = 'block';
  document.getElementById('checkinSheet').style.display = 'flex';
}

function closeCheckin() {
  document.getElementById('checkinOverlay').style.display = 'none';
  document.getElementById('checkinSheet').style.display = 'none';
}

// --- 上传区 ---
function initUploadArea() {
  const area = document.getElementById('uploadArea');
  const input = document.getElementById('fileInput');

  area.addEventListener('click', () => input.click());
  input.addEventListener('change', (e) => handleFiles(e.target.files));

  area.addEventListener('dragover', (e) => {
    e.preventDefault();
    area.classList.add('drag-over');
  });
  area.addEventListener('dragleave', () => area.classList.remove('drag-over'));
  area.addEventListener('drop', (e) => {
    e.preventDefault();
    area.classList.remove('drag-over');
    handleFiles(e.dataTransfer.files);
  });
}

function handleFiles(fileList) {
  const remaining = MAX_FILES - selectedFiles.length;
  const files = Array.from(fileList).slice(0, remaining);

  for (const file of files) {
    const validation = validateFile(file);
    if (!validation.valid) {
      showToast(validation.error, 'error');
      continue;
    }
    selectedFiles.push(file);
  }

  if (selectedFiles.length >= MAX_FILES) {
    document.getElementById('uploadArea').style.display = 'none';
  }

  renderUploadPreview();
}

function renderUploadPreview() {
  const container = document.getElementById('uploadPreview');
  container.innerHTML = '';

  selectedFiles.forEach((file, index) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const div = document.createElement('div');
      div.className = 'upload-preview-item';
      div.innerHTML = `
        <img src="${e.target.result}" alt="预览">
        <button class="remove-btn" onclick="removeFile(${index})">✕</button>
      `;
      container.appendChild(div);
    };
    reader.readAsDataURL(file);
  });
}

function removeFile(index) {
  selectedFiles.splice(index, 1);
  document.getElementById('uploadArea').style.display = 'block';
  renderUploadPreview();
}

function clearUploadPreview() {
  selectedFiles = [];
  document.getElementById('uploadPreview').innerHTML = '';
  document.getElementById('uploadArea').style.display = 'block';
  document.getElementById('fileInput').value = '';
}

// --- 提交打卡 ---
async function submitCheckinHandler() {
  const name = document.getElementById('checkinName').value.trim();
  if (!name) {
    showToast('请输入你的名字', 'warning');
    return;
  }

  const note = document.getElementById('checkinNote').value.trim();
  const taskDate = getTodayDateStr();
  const btn = document.getElementById('submitCheckinBtn');

  btn.disabled = true;
  btn.textContent = '提交中...';

  try {
    // 上传图片
    let imageUrls = [];
    if (selectedFiles.length > 0) {
      imageUrls = await uploadImages(selectedFiles, name, taskDate);
    }

    // 写入数据库
    await submitCheckin(name, taskDate, note, imageUrls);

    // 记住名字
    localStorage.setItem('member_name', name);

    showToast('打卡成功，愿光明与你同在 ✨', 'success');
    closeCheckin();
    wallPage = 1;
    loadWall();
  } catch (err) {
    if (err.message === 'DUPLICATE') {
      showToast('今日已打卡，明天再来吧 🙏', 'warning');
    } else {
      console.error('打卡失败:', err);
      showToast('打卡失败，请重试', 'error');
    }
  } finally {
    btn.disabled = false;
    btn.textContent = '完成打卡 🙏';
  }
}

// --- 加载打卡墙 ---
async function loadWall(reset = true) {
  if (wallLoading) return;
  wallLoading = true;

  if (reset) {
    wallPage = 1;
    wallHasMore = true;
    document.getElementById('masonryGrid').innerHTML = '';
    document.getElementById('wallEmpty').style.display = 'none';
  }

  try {
    const today = getTodayDateStr();
    const { data, count } = await getCheckinsByDate(today, wallPage, 20);

    // 更新计数
    document.getElementById('todayCount').innerHTML = `今日 <strong>${count || 0}</strong> 人已打卡`;

    if (reset && (!data || data.length === 0)) {
      document.getElementById('wallEmpty').style.display = 'flex';
      document.getElementById('loadMore').style.display = 'none';
    } else if (data && data.length > 0) {
      document.getElementById('wallEmpty').style.display = 'none';
      renderCheckinCards(data);
      wallPage++;
      wallHasMore = data.length >= 20;
      document.getElementById('loadMore').style.display = wallHasMore ? 'flex' : 'none';
    } else {
      document.getElementById('loadMore').style.display = 'none';
    }
  } catch (err) {
    console.error('加载打卡墙失败:', err);
    if (reset) {
      document.getElementById('masonryGrid').innerHTML = '';
      document.getElementById('wallEmpty').style.display = 'flex';
    }
  } finally {
    wallLoading = false;
  }
}

function renderCheckinCards(checkins) {
  const grid = document.getElementById('masonryGrid');

  checkins.forEach(c => {
    const card = document.createElement('div');
    card.className = 'checkin-card';

    const mainImage = c.image_urls && c.image_urls.length > 0 ? c.image_urls[0] : null;
    const imageCount = c.image_urls ? c.image_urls.length : 0;

    let imageHtml = '';
    if (mainImage) {
      imageHtml = `
        <div style="position:relative">
          <img class="card-image" src="${mainImage}" alt="打卡截图" loading="lazy"
               onclick="event.stopPropagation();openImageViewer('${mainImage}')">
          ${imageCount > 1 ? `<span class="card-badge">${imageCount}张</span>` : ''}
        </div>`;
    }

    card.innerHTML = `
      ${imageHtml}
      <div class="card-body">
        <div class="card-name">${escapeHtml(c.member_name)}</div>
        <div class="card-time">${formatTime(c.created_at)}</div>
        ${c.note ? `<div class="card-note line-clamp-2">${escapeHtml(c.note)}</div>` : ''}
      </div>
    `;

    // 点击卡片查看大图
    if (mainImage) {
      card.style.cursor = 'pointer';
      card.addEventListener('click', () => openImageViewer(mainImage));
    }

    grid.appendChild(card);
  });
}

// 加载更多
document.getElementById('loadMoreBtn')?.addEventListener('click', () => {
  if (!wallLoading && wallHasMore) loadWall(false);
});

// --- 图片查看器 ---
function openImageViewer(url) {
  document.getElementById('viewerImage').src = url;
  document.getElementById('imageViewer').style.display = 'flex';
}

function closeImageViewer() {
  document.getElementById('imageViewer').style.display = 'none';
}
