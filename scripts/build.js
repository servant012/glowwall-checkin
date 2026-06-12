// Cloudflare Pages 构建脚本
// 从环境变量读取配置，生成 config.js

import { writeFileSync } from 'fs';

const supabaseUrl = process.env.SUPABASE_URL || 'https://xxxx.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key-here';
const adminPassword = process.env.ADMIN_PASSWORD || 'admin888';

const config = `// 东方圣光 · 每日打卡系统 — 配置文件（自动生成）
const SUPABASE_URL = '${supabaseUrl}';
const SUPABASE_ANON_KEY = '${supabaseAnonKey}';
const ADMIN_PASSWORD = '${adminPassword}';
`;

writeFileSync('config.js', config);
console.log('✅ config.js generated');
