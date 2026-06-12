/* ============================================
   东方圣光 · 数据库操作封装
   ============================================ */

// --- 成员 ---

async function getMembers() {
  const { data, error } = await getSupabase()
    .from('members')
    .select('*')
    .eq('is_active', true)
    .order('name');
  if (error) throw error;
  return data;
}

async function addMember(name, notes = '') {
  const { data, error } = await getSupabase()
    .from('members')
    .upsert({ name, notes, is_active: true }, { onConflict: 'name' });
  if (error) throw error;
  return data;
}

async function deactivateMember(name) {
  const { error } = await getSupabase()
    .from('members')
    .update({ is_active: false })
    .eq('name', name);
  if (error) throw error;
}

// --- 任务 ---

async function getTodayTask() {
  const today = getTodayDateStr();
  const { data, error } = await getSupabase()
    .from('tasks')
    .select('*')
    .eq('task_date', today)
    .maybeSingle();
  if (error) throw error;
  if (data) return data;

  // fallback: 取最近一条任务
  const { data: recent, error: err2 } = await getSupabase()
    .from('tasks')
    .select('*')
    .order('task_date', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (err2) throw err2;
  return recent;
}

async function getTasksByDateRange(startDate, endDate) {
  const { data, error } = await getSupabase()
    .from('tasks')
    .select('*')
    .gte('task_date', startDate)
    .lte('task_date', endDate)
    .order('task_date', { ascending: false });
  if (error) throw error;
  return data;
}

async function setTask(taskDate, title, description = '') {
  const { data, error } = await getSupabase()
    .from('tasks')
    .upsert({ task_date: taskDate, title, description }, { onConflict: 'task_date' });
  if (error) throw error;
  return data;
}

// --- 打卡 ---

async function getCheckinsByDate(dateStr, page = 1, pageSize = 20) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const { data, error, count } = await getSupabase()
    .from('checkins')
    .select('*', { count: 'exact' })
    .eq('task_date', dateStr)
    .order('created_at', { ascending: false })
    .range(from, to);
  if (error) throw error;
  return { data, count };
}

async function getCheckinsByMember(memberName, page = 1, pageSize = 50) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const { data, error } = await getSupabase()
    .from('checkins')
    .select('*')
    .eq('member_name', memberName)
    .order('task_date', { ascending: false })
    .range(from, to);
  if (error) throw error;
  return data;
}

async function getMemberCheckinsInMonth(memberName, year, month) {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = `${year}-${String(month).padStart(2, '0')}-31`;
  const { data, error } = await getSupabase()
    .from('checkins')
    .select('task_date')
    .eq('member_name', memberName)
    .gte('task_date', startDate)
    .lte('task_date', endDate);
  if (error) throw error;
  return data;
}

async function submitCheckin(memberName, taskDate, note, imageUrls) {
  const { data, error } = await getSupabase()
    .from('checkins')
    .insert({
      member_name: memberName,
      task_date: taskDate,
      note: note || null,
      image_urls: imageUrls || []
    })
    .select()
    .single();
  if (error) {
    if (error.code === '23505') {
      throw new Error('DUPLICATE');
    }
    throw error;
  }
  return data;
}

// --- 公告 ---

async function getAnnouncements() {
  const now = new Date().toISOString();
  const { data, error } = await getSupabase()
    .from('announcements')
    .select('*')
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

async function createAnnouncement(title, content, isPinned, expiresAt) {
  const { data, error } = await getSupabase()
    .from('announcements')
    .insert({ title, content, is_pinned: isPinned || false, expires_at: expiresAt || null })
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function updateAnnouncement(id, updates) {
  const { error } = await getSupabase()
    .from('announcements')
    .update(updates)
    .eq('id', id);
  if (error) throw error;
}

async function deleteAnnouncement(id) {
  const { error } = await getSupabase()
    .from('announcements')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// --- 管理日志 ---

async function logAdminAction(action, target, detail) {
  const { error } = await getSupabase()
    .from('admin_logs')
    .insert({ action, target, detail });
  if (error) {
    console.warn('日志记录失败:', error);
  }
}

// --- 工具函数 ---

function getTodayDateStr() {
  const d = new Date();
  // UTC+8
  const offset = 8 * 60;
  const local = new Date(d.getTime() + offset * 60000);
  return local.toISOString().split('T')[0];
}

function getMonthRange() {
  const d = new Date();
  const offset = 8 * 60;
  const local = new Date(d.getTime() + offset * 60000);
  const year = local.getFullYear();
  const month = local.getMonth() + 1;
  return { year, month };
}
