# 东方圣光 · 每日打卡系统
## CLAUDE.md — 项目全量文档

> 本文档包含需求、架构、数据库、UI规范的完整描述。
> Claude Code 按本文档开发，无需额外说明。

---

## 一、项目概述

### 背景
东方圣光（Oriental Holy Light）是一个灵性修行社群，在 Facebook Messenger 群组中运营每日打卡活动。群组成员（称"师兄"）每天完成修习任务后，上传截图作为打卡凭证。原有 Messenger 打卡方式消息量大、无法统计、难以归档，故开发独立打卡网页工具。

### 核心功能
- 师兄每天上传截图 = 完成打卡
- 所有人可见打卡墙（瀑布流展示）
- 管理员每日设置任务、管理成员、查看统计
- 公告栏发布通知
- 个人历史记录查看

### 用户角色
| 角色 | 说明 |
|------|------|
| 普通成员（师兄） | 每日打卡、查看打卡墙、查看公告、查看个人记录 |
| 管理员 | 以上所有 + 设置任务、管理成员、查看统计、查看缺勤 |

---

## 二、技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 前端 | 原生 HTML / CSS / JavaScript | 无框架，轻量，易于部署 |
| 部署 | Cloudflare Pages | 静态托管，全球 CDN |
| 数据库 | Supabase（PostgreSQL） | 免费 tier，REST API，实时订阅 |
| 图片存储 | Supabase Storage | 与数据库同平台，管理方便 |
| 认证 | 无登录系统 | 成员输入名字即可，管理员用固定密码进入后台 |

### Supabase 配置
- 在 Supabase 控制台创建项目后，将以下环境变量写入前端 `config.js`：
```js
const SUPABASE_URL = 'https://xxxx.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key';
```
- Storage bucket 名称：`checkin-images`，设置为 **public**（图片可直接访问）
- RLS（Row Level Security）策略：
  - `checkins` 表：所有人可读，任何人可插入，不可修改/删除
  - `announcements` 表：所有人可读，仅管理员可写（通过 service_role key）
  - `members` 表：所有人可读，仅管理员可写
  - `tasks` 表：所有人可读，仅管理员可写

---

## 三、数据库表结构

### 3.1 members（成员表）
```sql
CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,         -- 名字或法号，唯一
  joined_at TIMESTAMPTZ DEFAULT now(),
  is_active BOOLEAN DEFAULT true,    -- 软删除
  notes TEXT                         -- 管理员备注
);
```

### 3.2 tasks（每日任务表）
```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_date DATE NOT NULL UNIQUE,    -- 每天一条
  title TEXT NOT NULL,               -- 任务标题，如"静心冥想·与内在光明同在"
  description TEXT,                  -- 任务说明（选填）
  created_by TEXT DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT now()
);
```
> **默认任务机制**：若当天无任务记录，前端自动取最近一条任务作为默认展示。

### 3.3 checkins（打卡记录表）
```sql
CREATE TABLE checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_name TEXT NOT NULL,         -- 直接存名字，不做外键关联（允许新人直接打卡）
  task_date DATE NOT NULL,           -- 对应哪天的任务
  note TEXT,                         -- 感悟文字（选填）
  image_urls TEXT[],                 -- 图片 URL 数组，最多 3 张
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(member_name, task_date)     -- 每人每天只能打一次
);
```

### 3.4 announcements（公告表）
```sql
CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT false,   -- 置顶
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ             -- 过期时间（选填，过期后不显示）
);
```

### 3.5 admin_logs（操作日志表）
```sql
CREATE TABLE admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,              -- 操作类型，如 'add_member', 'set_task', 'delete_checkin'
  target TEXT,                       -- 操作对象，如成员名字
  detail TEXT,                       -- 详情
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 四、页面结构

### 整体布局（手机优先）
```
┌─────────────────────────┐
│  顶部 Header             │  Logo + 今日任务标题
├─────────────────────────┤
│                         │
│  主内容区（各 Tab 页）    │
│                         │
├─────────────────────────┤
│  底部 Tab 导航           │  打卡墙 / 公告 / 我的 / 管理
└─────────────────────────┘
```

### Tab 导航
| Tab | 图标 | 说明 |
|-----|------|------|
| 打卡墙 | 🏠 | 默认首页，瀑布流 |
| 公告 | 📢 | 公告列表 |
| 我的 | 👤 | 个人打卡记录 |
| 管理 | 🛡️ | 管理员后台（需密码） |

---

## 五、各页面功能详述

### 5.1 打卡墙（首页）

**顶部区域**
- Logo：东方圣光 · 每日打卡
- 今日任务标题（从 tasks 表取当天任务，无则取最近一条）
- 今日打卡人数：「今日 XX 人已打卡」
- 右上角：「+ 打卡」按钮

**主内容：双列瀑布流**
- 每张卡片显示：
  - 截图图片（点击可放大查看）
  - 成员名字
  - 打卡时间（如「今天 08:42」）
  - 感悟文字（有则显示，截断超过2行）
  - 图片数量角标（如有多张）
- 按打卡时间倒序排列（最新在最前）
- 下拉加载更多（分页，每次加载 20 条）

**打卡弹窗（点击「+ 打卡」触发）**
- 输入名字或法号（文本框）
- 上传截图（最多 3 张，选填）
  - 上传区：点击或拖拽
  - 上传后显示缩略图预览，可删除
- 填写今日感悟（文本域，选填）
- 提交按钮「完成打卡」
- 提交后显示成功提示「打卡成功，愿光明与你同在」
- **限制**：同一名字当天只能打一次卡，重复提交提示「今日已打卡」

---

### 5.2 公告栏

**列表页**
- 置顶公告优先显示（带「置顶」标签）
- 其余按时间倒序
- 每条显示：标题、发布时间、内容摘要
- 点击展开查看全文

**无需登录**，所有成员可查看

---

### 5.3 我的打卡

**入口**
- 首次点击：弹出输入框「请输入你的名字或法号」
- 本地 localStorage 记住名字，下次无需重新输入

**个人统计卡片**
- 本月打卡次数
- 连续打卡天数
- 总出勤率（本月）

**历史记录列表**
- 按日期倒序
- 每条显示：日期、任务名称、状态（已打卡/缺席）、缩略图（有图则显示）、感悟摘要
- 缺席日期标红显示

---

### 5.4 管理后台

**入口**
- 点击「管理」Tab 后弹出密码输入框
- 密码硬编码在前端 config.js（`ADMIN_PASSWORD`），后续可升级
- 密码正确后 sessionStorage 记录，当次会话内无需重复输入

**管理后台包含 4 个子页面：**

#### A. 今日概览
- 数据卡片：总人数 / 今日打卡 / 今日缺席 / 出勤率
- 打卡进度条
- 今日任务显示 + 「修改任务」按钮
- 需要关注：连续缺席 2 天以上的成员列表

#### B. 成员管理
- 成员列表（名字、加入时间、本月出勤率、连续天数）
- 添加成员（输入名字）
- 停用成员（软删除，历史记录保留）
- 操作均记录到 admin_logs

#### C. 任务管理
- 今日任务（可修改）
- 设置明天任务
- 历史任务列表（查看过去每天的任务）
- 若未设置当天任务，系统显示警告提示管理员设置

#### D. 公告管理
- 新增公告（标题、内容、是否置顶、过期时间）
- 编辑/删除已有公告
- 操作记录到 admin_logs

---

## 六、UI 风格规范

### 设计原则
- **实用优先**：功能清晰，操作简单，不堆砌装饰
- **手机优先**：所有布局以 375px 宽度为基准设计
- **社群温度**：干净留白，有人情味，不冷冰冰

### 参考风格
- 整体骨架参考 Pinterest 移动端：双列瀑布流、白底、圆角卡片
- 品牌气质参考东方圣光调性：克制的紫色点缀、金色强调

### 颜色系统
```css
/* 主色 */
--color-primary: #534AB7;        /* 紫色，品牌主色 */
--color-primary-light: #EEEDFE;  /* 浅紫，背景/标签 */
--color-primary-dark: #3C3489;   /* 深紫，hover状态 */

/* 强调色 */
--color-gold: #B8922A;           /* 金色，特殊标注 */

/* 功能色 */
--color-success: #1D9E75;        /* 绿色，已打卡 */
--color-danger: #E24B4A;         /* 红色，缺席/警告 */
--color-warning: #E8922A;        /* 橙色，提醒 */

/* 中性色 */
--color-bg: #FAFAF8;             /* 极浅米色背景 */
--color-card: #FFFFFF;           /* 卡片白色 */
--color-border: #EBEBEB;         /* 边框 */
--color-text-primary: #1A1A1A;   /* 主文字 */
--color-text-secondary: #6B6B6B; /* 次要文字 */
--color-text-tertiary: #ABABAB;  /* 辅助文字 */
```

### 字体
```css
font-family: -apple-system, 'PingFang SC', 'Hiragino Sans GB', 
             'Microsoft YaHei', sans-serif;
```

### 圆角
```css
--radius-sm: 8px;
--radius-md: 12px;
--radius-lg: 16px;
--radius-xl: 24px;
```

### 间距
- 页面左右边距：16px
- 卡片间距：8px
- 区块间距：24px

### 组件规范

**底部 Tab 栏**
- 高度：56px + safe-area-inset-bottom
- 激活 Tab：主色图标 + 文字
- 非激活：灰色图标

**打卡卡片（瀑布流）**
- 白色背景，12px 圆角，轻阴影
- 图片上方，撑满卡片宽度，高度自适应
- 图片下方：名字（粗体）、时间（灰色小字）、感悟（灰色，最多 2 行截断）

**浮动打卡按钮**
- 右下角固定，距边 20px
- 圆形，直径 56px，主色背景，白色「+」图标
- 轻微阴影

**打卡弹窗**
- 从底部滑出（bottom sheet 样式）
- 圆角顶部 20px
- 半透明遮罩背景

---

## 七、文件目录结构

```
/
├── index.html          # 入口，打卡墙
├── config.js           # Supabase配置 & 管理员密码（不提交git）
├── config.example.js   # 配置模板（提交git）
├── css/
│   ├── base.css        # 全局样式、CSS变量
│   ├── components.css  # 公共组件样式
│   └── pages.css       # 各页面样式
├── js/
│   ├── supabase.js     # Supabase客户端初始化
│   ├── api.js          # 所有数据库操作封装
│   ├── upload.js       # 图片上传逻辑
│   ├── wall.js         # 打卡墙页面逻辑
│   ├── announcement.js # 公告页面逻辑
│   ├── mine.js         # 我的打卡页面逻辑
│   └── admin.js        # 管理后台逻辑
└── .gitignore          # 忽略config.js
```

---

## 八、开发顺序建议

Claude Code 请按以下顺序开发，每步完成后验证再进行下一步：

1. **环境搭建**：创建文件目录，配置 config.js，测试 Supabase 连接
2. **数据库初始化**：在 Supabase 执行建表 SQL，设置 RLS 策略，创建 Storage bucket
3. **基础框架**：index.html 骨架，底部 Tab 导航，CSS 变量系统
4. **打卡墙**：从 Supabase 读取数据，渲染双列瀑布流
5. **打卡弹窗**：表单 + 图片上传 + 提交到 Supabase
6. **公告页**：读取公告列表，展示
7. **我的打卡**：本地记住名字，查询个人记录，统计数据
8. **管理后台**：密码验证，四个子页面逐一实现
9. **细节完善**：加载状态、错误处理、空状态页面
10. **部署**：推送到 GitHub，连接 Cloudflare Pages

---

## 九、边界条件 & 注意事项

- 同一名字当天只能打一次卡（数据库 UNIQUE 约束兜底）
- 图片上传最多 3 张，单张不超过 5MB，仅支持 JPG/PNG
- 图片上传到 Supabase Storage，存储路径格式：`checkins/{task_date}/{member_name}_{timestamp}.jpg`
- 不支持补录（前端不提供历史日期打卡入口）
- 管理员密码存在 config.js，不提交 git，部署时在 Cloudflare Pages 环境变量设置
- 新成员无需注册，直接输入名字打卡即可；管理员可在成员管理页补录新人信息
- 连续打卡天数计算：以自然日为单位，缺一天即断，前端计算
- 时区统一使用 UTC+8（中国标准时间）

---

*文档版本：V1.0 · 2025年6月11日*  
*项目：东方圣光每日打卡系统*  
*技术栈：HTML + Cloudflare Pages + Supabase*
