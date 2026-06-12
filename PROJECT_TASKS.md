# 东方圣光 · 每日打卡系统
# PROJECT_TASKS.md

版本：V1.0
项目状态：开发中

---

# AI 开发执行规则

## 开发流程

每次开始工作：

1. 读取：
   - CLAUDE.md
   - PROJECT_TASKS.md

2. 查看当前 Phase

3. 只执行当前 Task

4. 完成后：
   - 测试
   - 更新任务状态
   - 生成变更记录


---

# 状态说明

⬜ todo

🔨 doing

✅ done

⚠️ blocked


---

# 当前任务

current_phase:

Phase 0

current_task:

Task 0.1


================================================


# Phase 0 项目初始化

目标：

建立基础开发环境


---

## Task 0.1 初始化项目结构

状态：

🔨 doing


创建：


/
├── index.html
├── config.example.js
├── .gitignore
├── css/
├── js/
├── assets/
└── docs/



要求：

- 不使用框架
- 原生 HTML/CSS/JS
- 手机优先


验收：

- 浏览器打开 index.html 正常
- CSS JS加载成功


完成：

修改状态：

done


commit:


feat: initialize project structure



---

## Task 0.2 创建 Supabase 配置

状态：

⬜ todo


创建：


js/supabase.js



功能：

初始化 Supabase client


读取：

config.js


禁止：

直接写死 key


验收：

浏览器 console:


Supabase connected



commit:


feat: add supabase client




================================================


# Phase 1 数据层


目标：

数据库可用


---

## Task 1.1 创建数据库结构

状态：

⬜ todo


创建：


supabase/schema.sql



包含：

members

tasks

checkins

announcements


字段必须符合：

CLAUDE.md


验收：

SQL执行成功


测试：

新增一条checkin


commit:


feat: create database schema



---

## Task 1.2 创建 Storage

状态：

⬜ todo


Bucket:


checkins-images



规则：

允许：

jpg
png


限制：

5MB


验收：

上传测试图片成功


commit:


feat: setup image storage




================================================


# Phase 2 核心打卡


目标：

用户可以完成一次打卡


---

## Task 2.1 首页UI

状态：

⬜ todo


修改：

index.html


实现：

顶部：

东方圣光

今日任务


按钮：

+ 打卡


要求：

375px手机适配


验收：

手机浏览正常


commit:


feat: create mobile home ui



---

## Task 2.2 打卡弹窗


状态：

⬜ todo


功能：

输入：

名字


上传：

截图最多3张


输入：

感悟


按钮：

完成打卡


验收：

表单正常打开关闭


commit:


feat: add checkin form




---

## Task 2.3 保存打卡


状态：

⬜ todo


流程：

用户提交

↓

压缩图片

↓

上传Storage

↓

写入checkins


验收：

数据库出现记录


commit:


feat: save checkin data




---

## Task 2.4 防重复打卡


状态：

⬜ todo


规则：

同名字

同日期

只能一次


提示：

今日已经完成打卡


验收：

重复提交失败


commit:


feat: prevent duplicate checkin




================================================


# Phase 3 打卡墙


目标：

替代Messenger刷屏


---

## Task 3.1 获取今日打卡


状态：

⬜ todo


功能：

查询：

当天checkins


排序：

created_at DESC


验收：

显示列表


commit:


feat: load daily checkins



---

## Task 3.2 瀑布流展示


状态：

⬜ todo


卡片：

图片

名字

时间

感悟


手机：

双列


验收：

100条数据不卡


commit:


feat: create checkin wall



---

## Task 3.3 图片查看


状态：

⬜ todo


点击图片：

全屏预览


验收：

手机可关闭


commit:


feat: image preview




================================================


# Phase 4 我的记录


目标：

个人成长记录


---

## Task 4.1 保存身份


状态：

⬜ todo


localStorage:

保存名字


验收：

刷新页面仍存在


commit:


feat: save user identity



---

## Task 4.2 历史记录


状态：

⬜ todo


显示：

日期

任务

图片

感悟


commit:


feat: add history page



---

## Task 4.3 连续打卡


状态：

⬜ todo


计算：

连续天数


显示：

连续：

XX天


commit:


feat: add streak counter




================================================


# Phase 5 管理后台


目标：

管理员运营


---

## Task 5.1 Admin入口


状态：

⬜ todo


路径：


/admin



验证：

密码


session保存


commit:


feat: add admin access



---

## Task 5.2 今日统计


状态：

⬜ todo


显示：

总人数

今日人数

完成率


commit:


feat: add dashboard stats



---

## Task 5.3 任务管理


状态：

⬜ todo


管理员：

创建任务

修改任务


commit:


feat: manage daily tasks




================================================


# Phase 6 优化


---

## Task 6.1 图片优化

状态：

⬜ todo


实现：

上传前压缩


目标：

500KB左右


commit:


perf: optimize images



---

## Task 6.2 错误处理


状态：

⬜ todo


覆盖：

网络失败

上传失败

数据库失败


commit:


fix: improve error handling



---

## Task 6.3 部署


状态：

⬜ todo


流程：

GitHub

↓

Cloudflare Pages


验收：

线上访问


commit:


deploy: production release




================================================


# V1 完成标准


用户：

✅ 可以打卡

✅ 可以上传截图

✅ 可以看到别人

✅ 手机体验正常


管理员：

✅ 设置任务

✅ 查看统计


业务目标：

Messenger每日刷屏减少90%


END