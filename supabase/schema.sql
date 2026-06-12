-- ============================================
-- 东方圣光 · 每日打卡系统 — 数据库建表 SQL
-- 在 Supabase SQL Editor 中执行此文件
-- ============================================

-- 0. 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- 1. members（成员表）
-- ============================================
CREATE TABLE IF NOT EXISTS members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  joined_at TIMESTAMPTZ DEFAULT now(),
  is_active BOOLEAN DEFAULT true,
  notes TEXT
);

-- ============================================
-- 2. tasks（每日任务表）
-- ============================================
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_date DATE NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  created_by TEXT DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 3. checkins（打卡记录表）
-- ============================================
CREATE TABLE IF NOT EXISTS checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_name TEXT NOT NULL,
  task_date DATE NOT NULL,
  note TEXT,
  image_urls TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(member_name, task_date)
);

-- ============================================
-- 4. announcements（公告表）
-- ============================================
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ
);

-- ============================================
-- 5. admin_logs（操作日志表）
-- ============================================
CREATE TABLE IF NOT EXISTS admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  target TEXT,
  detail TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 索引
-- ============================================
CREATE INDEX IF NOT EXISTS idx_checkins_task_date ON checkins(task_date);
CREATE INDEX IF NOT EXISTS idx_checkins_member_name ON checkins(member_name);
CREATE INDEX IF NOT EXISTS idx_tasks_task_date ON tasks(task_date);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON admin_logs(created_at);

-- ============================================
-- RLS 策略（Row Level Security）
-- ============================================

-- 启用 RLS
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;

-- --- members: 所有人可读，仅 service_role 可写 ---
CREATE POLICY "members_read_all" ON members
  FOR SELECT USING (true);

-- --- tasks: 所有人可读，仅 service_role 可写 ---
CREATE POLICY "tasks_read_all" ON tasks
  FOR SELECT USING (true);

-- --- checkins: 所有人可读，任何人可插入 ---
CREATE POLICY "checkins_read_all" ON checkins
  FOR SELECT USING (true);

CREATE POLICY "checkins_insert_all" ON checkins
  FOR INSERT WITH CHECK (true);

-- --- announcements: 所有人可读，仅 service_role 可写 ---
CREATE POLICY "announcements_read_all" ON announcements
  FOR SELECT USING (true);

-- --- admin_logs: 仅 service_role 可读写 ---
CREATE POLICY "admin_logs_service_role" ON admin_logs
  FOR SELECT USING (false);

-- ============================================
-- Storage 设置
-- ============================================
-- 请在 Supabase 控制台手动创建 Storage bucket：
--   名称：checkin-images
--   公开访问：是（public bucket）
--   允许的文件类型：image/jpeg, image/png
--   文件大小限制：5MB
--
-- 创建后执行以下 Storage RLS：
--   INSERT POLICY (用于上传):
--     policy name: "allow_upload"
--     allowed operation: INSERT
--     USING expression: true
--
--   SELECT POLICY (用于读取):
--     policy name: "allow_read"
--     allowed operation: SELECT
--     USING expression: true
