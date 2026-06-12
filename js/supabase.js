/* ============================================
   东方圣光 · Supabase 客户端初始化
   ============================================ */

// 使用 Supabase CDN 的全局 supabase 对象（已在 HTML 中引入）
// 等待 CDN 脚本加载完成后，createClient 挂载在 window.supabase 上
let supabase = null;

function initSupabase() {
  if (typeof supabase !== 'undefined' && supabase !== null) return supabase;

  try {
    const { createClient } = window.supabase;
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('✅ Supabase connected');
    return supabase;
  } catch (err) {
    console.error('❌ Supabase 连接失败:', err.message);
    return null;
  }
}

// 获取客户端实例（懒初始化）
function getSupabase() {
  if (supabase) return supabase;
  return initSupabase();
}
