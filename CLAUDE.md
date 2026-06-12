# 东方圣光 · 每日打卡系统 — 项目记忆

## 当前状态：上线但有问题

- ✅ 已部署到 Vercel：https://glowwall-checkin.vercel.app
- ✅ GitHub：https://github.com/servant012/glowwall-checkin
- ✅ Supabase 数据库已建表、Storage bucket 已创建
- ✅ 页面能打开，UI 正常渲染
- ❌ 打卡上传按钮无反应（详见下方）

## 已知问题

### 问题：点 + 打卡按钮没反应，上传功能不可用
- 进度：已将 scripts 从 `<head>` 移到 `</body>` 前（解决 CDN 阻塞），但上传仍不工作
- 下一步排查方向：
  1. 浏览器 F12 看 Console 是否有报错
  2. 检查 Supabase CDN（jsdelivr）在你那边是否被墙
  3. 检查 Supabase Storage bucket 的 RLS 策略是否正确
  4. 检查 `window.supabase` 是否成功挂载（Console 输入 `window.supabase`）

## 技术栈
- 前端：原生 HTML/CSS/JS（无框架）
- 后端：Supabase（PostgreSQL + Storage）
- 部署：Vercel（自动从 GitHub master 部署）

## 文件结构
```
├── index.html          # 主页面（所有 Tab、弹窗都在这里）
├── config.js           # Supabase 密钥 + 管理员密码（gitignore，Vercel 构建时生成）
├── vercel.json         # Vercel 部署配置
├── package.json        # 构建脚本
├── scripts/build.js    # 从环境变量生成 config.js
├── css/
│   ├── base.css        # CSS 变量、Reset
│   ├── components.css  # 组件样式
│   └── pages.css       # 页面样式
├── js/
│   ├── supabase.js     # Supabase 客户端初始化
│   ├── api.js          # 数据库操作
│   ├── upload.js       # 图片上传
│   ├── wall.js         # 打卡墙 + 打卡弹窗
│   ├── announcement.js # 公告
│   ├── mine.js         # 个人记录
│   └── admin.js        # 管理后台
└── supabase/
    └── schema.sql      # 建表 SQL
```

## Supabase 配置
- URL：https://finyqctqxtatdaxhqiowu.supabase.co
- ANON KEY：已配置在 Vercel 环境变量 `SUPABASE_ANON_KEY`
- 管理员密码：`admin888`（Vercel 环境变量 `ADMIN_PASSWORD`）
- Storage bucket：`checkin-images`（public）

## 环境变量（Vercel）
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `ADMIN_PASSWORD`

## 部署
- 每次 `git push` 到 master → Vercel 自动部署
- 预览 URL 格式：`https://glowwall-checkin-XXXXX-wang-s-projects9.vercel.app`
- 正式 URL：`https://glowwall-checkin.vercel.app`

## 开发规则
- 手机优先（375px 基准）
- 管理员密码：admin888
- 每天同一名字只能打卡一次（数据库 UNIQUE 约束兜底）
- 图片最多 3 张，单张 ≤ 5MB，仅 JPG/PNG
- 时区 UTC+8
