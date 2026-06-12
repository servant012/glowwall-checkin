# 东方圣光 · 每日打卡系统 — 项目记忆

> 最后更新：2026-06-12
> 当前状态：已上线，打卡按钮有 bug 待修

---

## 一、项目概述

东方圣光（Oriental Holy Light）是灵性修行社群的每日打卡工具。替代 Facebook Messenger 群组打卡，提供打卡墙、公告、个人统计、管理后台。

- **用户**：社群成员（师兄），无需注册，输入名字即可打卡
- **管理员**：设置每日任务、管理成员、发公告、看统计（密码 admin888）
- **设计**：手机优先，紫色调，Pinterest 风格双列瀑布流

---

## 二、当前进度

| 模块 | 状态 | 备注 |
|------|------|------|
| 项目骨架 + CSS 系统 | ✅ 完成 | base.css / components.css / pages.css |
| Supabase 数据库 | ✅ 完成 | 5 张表 + RLS + Storage bucket |
| index.html 主框架 | ✅ 完成 | 4 个 Tab + 弹窗 + 图片查看器 |
| js/supabase.js | ✅ 完成 | 客户端初始化 |
| js/api.js | ✅ 完成 | 全部 CRUD 操作 |
| js/upload.js | ✅ 完成 | 图片验证、压缩、上传 |
| js/wall.js | ✅ 完成 | 打卡墙 + 打卡弹窗逻辑 |
| js/announcement.js | ✅ 完成 | 公告列表 + 详情 |
| js/mine.js | ✅ 完成 | 个人统计 + 历史 |
| js/admin.js | ✅ 完成 | 管理后台 4 个子页面 |
| Vercel 部署 | ✅ 已上线 | https://glowwall-checkin.vercel.app |
| 功能验证 | ❌ 待修复 | 页面能打开，但打卡按钮无反应 |

---

## 三、线上地址

| 项目 | 链接 |
|------|------|
| 正式网址 | https://glowwall-checkin.vercel.app |
| GitHub | https://github.com/servant012/glowwall-checkin |
| Vercel 管理 | https://vercel.com/wang-s-projects9/glowwall-checkin |
| Supabase 管理 | https://supabase.com/dashboard/project/finyqctqxtatdaxhqiowu |

---

## 四、技术架构

```
浏览器 (HTML/CSS/JS)
    │
    ├── Supabase JS SDK (CDN: jsdelivr)
    │   ├── REST API → PostgreSQL 数据库
    │   └── Storage API → 图片存储
    │
    └── 部署：Vercel (git push → 自动部署)
```

- **前端**：原生 HTML/CSS/JS，无任何框架，手机优先 375px
- **数据库**：Supabase PostgreSQL（免费 tier）
- **图片**：Supabase Storage，bucket 名 `checkin-images`，公开访问
- **认证**：无登录系统，成员输名字，管理员输密码
- **部署**：GitHub master → Vercel 自动部署

---

## 五、数据库表（已在 Supabase 建好）

| 表名 | 用途 | 关键约束 |
|------|------|---------|
| members | 成员 | name UNIQUE, is_active 软删除 |
| tasks | 每日任务 | task_date UNIQUE |
| checkins | 打卡记录 | (member_name, task_date) UNIQUE |
| announcements | 公告 | is_pinned 置顶, expires_at 过期 |
| admin_logs | 操作日志 | 记录管理员操作 |

---

## 六、文件结构

```
GlowWall/
├── index.html              # 全部页面都在这里（SPA 式 Tab 切换）
├── config.js               # 密钥配置（gitignore，Vercel 构建时从环境变量生成）
├── config.example.js       # 配置模板（可提交 git）
├── CLAUDE.md               # 本文件，项目记忆
├── vercel.json             # Vercel 部署配置（outputDirectory: "."）
├── package.json            # build 脚本
├── scripts/build.js        # 从环境变量生成 config.js
├── .gitignore              # 忽略 config.js, node_modules, .claude
├── css/
│   ├── base.css            # CSS 变量、Reset、工具类
│   ├── components.css      # Tab栏、弹窗、按钮、Toast、上传区
│   └── pages.css           # 打卡墙、公告、我的、管理页面样式
├── js/
│   ├── supabase.js         # Supabase 客户端初始化（懒加载）
│   ├── api.js              # 全部数据库操作（members/tasks/checkins/announcements）
│   ├── upload.js           # 图片验证→压缩→上传 Supabase Storage
│   ├── wall.js             # 打卡墙瀑布流 + 打卡弹窗 + 图片查看器
│   ├── announcement.js     # 公告列表 + 详情展开
│   ├── mine.js             # 个人身份 + 统计 + 连续天数 + 历史
│   └── admin.js            # 密码验证 + 概览/成员/任务/公告 4 个子页
├── supabase/
│   └── schema.sql          # 建表 SQL（含 RLS 策略）
└── assets/                 # 预留：图标等静态资源
```

---

## 七、环境变量（Vercel 已配置）

| 变量名 | 值 | 用途 |
|--------|-----|------|
| SUPABASE_URL | https://finyqctqxtatdaxhqiowu.supabase.co | Supabase 项目地址 |
| SUPABASE_ANON_KEY | (已配置，JWT 格式) | 公开 API 密钥 |
| ADMIN_PASSWORD | admin888 | 管理后台密码 |

---

## 八、已知 BUG 详细记录

### Bug #1：点击 + 打卡按钮无反应

**发现时间**：2026-06-12，部署后首次测试

**现象**：
- 页面能打开，UI 正常渲染
- 底部 Tab 切换正常
- Header 显示"加载中..."（说明 loadTodayTask 未完成）
- 右下角 + 按钮点击无任何反应（不弹打卡面板）

**已尝试的修复**：
1. 第 1 次排查：怀疑 scripts 在 `<head>` 阻塞渲染
   - 将所有 `<script>` 从 `<head>` 移到 `</body>` 前
   - 结果：页面加载更快，但 + 按钮仍然无反应

**根因分析（未确认，下次排查）**：
- 最可能原因 A：Supabase JS SDK CDN（jsdelivr）加载慢或被墙
  - SDK 脚本是**同步阻塞**的，在所有 script 最前面
  - 如果 CDN 超时（30-90秒），后续所有 JS 都不执行
  - 验证方法：浏览器 F12 → Network 标签，看 supabase-js 加载耗时
- 可能原因 B：JavaScript 报错中断执行
  - 验证方法：浏览器 F12 → Console，看红色报错
- 可能原因 C：Supabase Storage RLS 策略未正确配置
  - checkin-images bucket 需要允许公开上传的 policy

**建议修复方案（按优先级）**：
1. **先开 F12 Console 看一眼报错**，贴给我，90% 能直接定位
2. 如果 CDN 超时 → 换国内 CDN（如 bootcdn、staticfile）或本地化 supabase SDK
3. 如果是 JS 错误 → 根据报错信息修

---

## 九、Supabase 关键配置

### Storage Bucket
- 名称：`checkin-images`
- 权限：Public（公开可读）
- 文件大小限制：5MB
- 允许类型：image/jpeg, image/png
- 存储路径格式：`checkins/{task_date}/{member_name}_{timestamp}.jpg`

### RLS 策略
- members：所有人可读，仅 service_role 可写
- tasks：所有人可读，仅 service_role 可写
- checkins：所有人可读，任何人可插入（不可修改/删除）
- announcements：所有人可读，仅 service_role 可写
- admin_logs：仅 service_role 可读写

---

## 十、关键业务规则

- 同一名字同一天只能打卡一次（数据库 UNIQUE 约束兜底，前端也会提示）
- 图片最多 3 张，单张 ≤ 5MB，仅支持 JPG/PNG
- 上传前自动压缩到 ~500KB
- 不支持补录（前端不提供历史日期打卡入口）
- 管理员密码 `admin888` 存在 Vercel 环境变量
- 时区统一 UTC+8（中国标准时间）
- 当日无任务时，前端自动取最近一条任务展示
- 新成员无需注册，直接输入名字打卡即可
- 连续打卡天数由前端计算，以自然日为单位

---

## 十一、如何部署

```bash
# 改完代码后
git add -A
git commit -m "描述你的改动"
git push
# Vercel 自动部署，10 秒生效
```

---

## 十二、下次打开项目的检查清单

1. 读本文件了解当前状态
2. 让用户在手机浏览器打开 https://glowwall-checkin.vercel.app
3. 开 F12 Console，截图报错信息
4. 根据报错修 Bug #1
5. 修复后测试完整打卡流程：输入名字 → 上传截图 → 提交 → 打卡墙出现卡片
6. 切到「我的」Tab 验证统计和历史
7. 切到「管理」Tab 验证后台功能

---

> 2026-06-12 工作记录：
> - 根据 CLAUDE (1).md 的设计文档，一次性生成了全部前端代码（约 4700 行）
> - 配置 Supabase 数据库（5张表 + Storage bucket）
> - 部署到 Vercel 生产环境
> - 发现打卡按钮无反应的 bug，已排查一次（移 scripts 到 body 底部），问题未完全解决
> - 下一步需要用户在浏览器 F12 Console 查看具体报错
