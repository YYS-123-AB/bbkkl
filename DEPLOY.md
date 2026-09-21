# 🌩️ 自然灾害天气资讯站 - 部署教程

> 完整中文部署指南 · 纯前端项目 · 支持多种部署方式

---

## 📋 目录

- [1. 项目简介](#1-项目简介)
- [2. 环境要求](#2-环境要求)
- [3. 本地快速开始](#3-本地快速开始)
- [4. 项目结构说明](#4-项目结构说明)
- [5. 部署到 GitHub Pages（推荐，免费）](#5-部署到-github-pages推荐免费)
- [6. 部署到 Vercel（一键部署）](#6-部署到-vercel一键部署)
- [7. 部署到 Netlify](#7-部署到-netlify)
- [8. 部署到 Cloudflare Pages](#8-部署到-cloudflare-pages)
- [9. 部署到自己的服务器（Nginx）](#9-部署到自己的服务器nginx)
- [10. 常见问题 FAQ](#10-常见问题-faq)
- [11. 故障排查](#11-故障排查)

---

## 1. 项目简介

**自然灾害天气资讯站** 是一个纯前端项目，使用原生 HTML + CSS + JavaScript 构建（无任何前端框架），构建工具采用 Vite。

### ✨ 核心功能

- 📍 **顶部天气概览卡**：温度、天气图标、湿度、风力、AQI 空气质量、体感温度，支持一键刷新
- 🔍 **四重智能筛选**：灾害类型 Tab（9种）+ 省份地区选择 + 时间范围 + 关键词搜索（300ms 防抖）
- 🗂️ **资讯卡片**：灾害类型色边/图标、标题、等级（4级）、发生时间、地点、影响人数、状态（4种）、摘要
- 🪟 **详情弹窗**：完整资讯正文、灾区地图、伤亡情况、财产损失、救援力量、物资需求、援助链接、相关新闻（点击可跳）
- 📊 **统计仪表盘**：本月灾害总数、各类型占比（CSS 进度条）、影响人口总数、财产损失统计
- 🎨 **双主题切换**：亮色/暗色主题，支持记忆（localStorage）+ 跟随系统偏好
- 📱 **全响应式**：三断点自适应（≥1200px / ≤768px / ≤480px）
- ⬆️ **回到顶部**：滚动超过 480px 自动显示
- 🔄 **状态完备**：加载动画 / 空状态 / 错误状态 + 重新加载按钮
- 🚪 **弹窗三关闭**：X 按钮 / 点击遮罩 / ESC 键

### 🧩 灾害类型（9 种）

| 类型 | 标识 | 主色调 | 类型 | 标识 | 主色调 |
|-----|------|-------|-----|------|-------|
| 🌀 台风 | typhoon | 紫色 #7c3aed | 🏜️ 干旱 | drought | 琥珀色 #d97706 |
| 🌋 地震 | earthquake | 红色 #dc2626 | 🔥 森林火灾 | wildfire | 橙色 #ea580c |
| 🌊 洪水 | flood | 深湖蓝 #0284c7 | 🥵 高温 | heatwave | 红色 #dc2626 |
| ⛈️ 暴雨 | rainstorm | 蓝色 #2563eb | 🥶 寒潮 | coldwave | 青色 #0891b2 |
| ❄️ 暴雪 | snowstorm | 天蓝 #0ea5e9 | | | |

---

## 2. 环境要求

| 软件 | 版本要求 | 推荐版本 | 检查命令 |
|-----|---------|---------|---------|
| Node.js | ≥ 16.0.0 | 20 LTS | `node -v` |
| npm | ≥ 7.0.0 | 10.x | `npm -v` |

**💡 提示：** 如果不想安装 Node.js，也可以直接用浏览器打开 `index.html` 预览项目（部分浏览器对 fetch 本地 JSON 有限制，建议用本地服务器方式）。

---

## 3. 本地快速开始

### 步骤一：安装依赖

```bash
cd web8
npm install
```

### 步骤二：生成示例数据（可跳过，已附带 data.json）

```bash
npm run fetch
```

这个命令会执行 `scripts/fetch-data.js`，使用 Node.js 原生 https 模块尝试从远程接口抓取数据，如果失败会自动生成 **63 条高质量示例数据**（9 种灾害类型 × 每种 7 条），覆盖全国 34 个省份。

### 步骤三：启动开发服务器

```bash
npm run dev
```

或者（先生成数据再启动）：

```bash
npm run start
```

启动成功后，浏览器会自动打开 `http://localhost:5173/`

### 步骤四：生产环境构建

```bash
npm run build
```

构建产物会输出到 `dist/` 目录，**体积通常小于 200KB**（不含图片）。

### 步骤五：本地预览构建产物

```bash
npm run preview
```

浏览器访问 `http://localhost:4173/` 即可预览构建后的版本。

---

## 4. 项目结构说明

```
web8/
├── 📄 index.html                       # 主页面（UI 骨架）
├── 📁 css/
│   └── 📄 style.css                    # 样式表 (~1300 行：双主题、9 灾害色、响应式)
├── 📁 js/
│   └── 📄 app.js                       # 核心逻辑（过滤、排序、主题、弹窗、仪表盘）
├── 📁 data/
│   └── 📄 data.json                    # 62+ 条灾害数据（9 类型 × ≥6 条）
├── 📁 scripts/
│   └── 📄 fetch-data.js                # Node 数据脚本：远程抓取失败自动生成示例
├── 📁 .github/
│   └── 📁 workflows/
│       └── 📄 deploy.yml               # GitHub Actions：构建 / 部署 / 提交数据
├── 📄 package.json                     # 脚本：fetch / start / dev / build / preview
├── 📄 vite.config.js                   # Vite 配置：base: './'
├── 📄 .nojekyll                        # GitHub Pages 禁用 Jekyll
├── 📄 .gitignore                       # 忽略规则
└── 📄 DEPLOY.md                        # 本文件
```

### data.json 字段说明

```jsonc
{
  "id": 1,                       // 唯一 ID
  "title": "...",                // 资讯标题
  "disasterType": "typhoon",     // 灾害类型 (9 种之一)
  "level": "serious",            // 等级: normal/severe/serious/catastrophic (4 级)
  "status": "ongoing",           // 状态: warning/ongoing/rescue/ended (4 种)
  "location": "广东湛江徐闻县",   // 具体地点
  "province": "广东",             // 省份/地区
  "lat": 20.32, "lng": 110.18,   // 经纬度 (预留)
  "occurTime": "2026-07-20T08:00:00",  // 发生时间 (ISO)
  "endTime": "...",              // 可选：结束时间
  "affectedPeople": 125000,      // 影响人数
  "casualties": 0,               // 伤亡人数
  "propertyLoss": 380,           // 财产损失 (百万元)
  "rescueForces": "...",         // 救援力量描述
  "supplies": "...",             // 物资需求描述 (顿号分隔)
  "summary": "...",              // 摘要
  "content": "...",              // 完整正文
  "mapImage": "https://...",     // 灾区地图 (picsum 占位)
  "source": "广东省气象局",       // 信息来源
  "aidUrl": "https://..."        // 官方援助链接
}
```

---

## 5. 部署到 GitHub Pages（推荐，免费）

### 方式 A：使用 GitHub Actions 自动部署（最简单）

项目已内置完整工作流 `.github/workflows/deploy.yml`，开箱即用。

#### 步骤

1. **将项目推送到 GitHub**（新建一个 Public 仓库，比如叫 `disaster-info`）

   ```bash
   cd web8
   git init
   git checkout -b main
   git add -A
   git commit -m "feat: 初始化自然灾害天气资讯站"
   git remote add origin https://github.com/你的用户名/disaster-info.git
   git push -u origin main
   ```

2. **启用 GitHub Pages**
   - 打开 GitHub 仓库 → **Settings** → **Pages**
   - Source 选项选择 **GitHub Actions**（不是 Deploy from branch）
   - 保存设置

3. **触发构建**
   - 推送代码会自动触发工作流
   - 也可以手动：仓库 → **Actions** → **Deploy to GitHub Pages** → **Run workflow**
   - 可选：**是否重新生成数据？** → 选 `true` 即可在云端生成新数据提交回仓库

4. **等待完成**
   - 构建约 1 分钟完成
   - 访问：`https://你的用户名.github.io/disaster-info/`

#### Workflow 三 Job 说明

| Job 名称 | 说明 |
|---------|-----|
| 🔨 build | 安装依赖 → 生成/校验数据 → Vite 构建 → 上传 Artifact |
| 🚀 deploy | 下载构建产物 → 部署到 GitHub Pages（仅 push/手动触发时） |
| 💾 commit-data | 将重新生成的 data.json 提交回仓库（仅手动选 refresh-data=true 时） |

---

### 方式 B：手动构建后推送 gh-pages 分支

1. 本地构建：

   ```bash
   npm run build
   ```

2. 使用 `gh-pages` 工具推送：

   ```bash
   npx gh-pages -d dist -t true
   ```

3. 到仓库 Settings → Pages → 选择 **Deploy from branch**，分支选 `gh-pages`，目录选 `/ (root)`。

---

## 6. 部署到 Vercel（一键部署）

### 方法一：CLI

```bash
cd web8
npm install -g vercel
vercel --prod
```

按提示登录/关联项目，Vercel 会自动识别 Vite 项目，配置无需修改，默认：
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

### 方法二：Git 集成

1. 将项目推送到 GitHub/GitLab/Bitbucket
2. 打开 [vercel.com/new](https://vercel.com/new) 导入仓库
3. 直接 Deploy 即可，一切零配置

✅ 自动配置 HTTPS + 全球 CDN + 预览部署

---

## 7. 部署到 Netlify

### 方法一：拖拽部署（最快）

1. 执行 `npm run build` 生成 `dist/` 目录
2. 打开 [app.netlify.com/drop](https://app.netlify.com/drop)
3. 直接拖拽整个 `dist` 文件夹到页面，**30 秒内上线**

### 方法二：Git 持续部署

1. 推送代码到 GitHub
2. Netlify → **Add new site** → **Import an existing project**
3. 选择仓库，填写：
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
4. 点击 **Deploy site**

✅ 每次 push 自动更新

---

## 8. 部署到 Cloudflare Pages

1. 推送代码到 GitHub
2. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/) → **Workers & Pages** → **Create → Pages**
3. 连接到 Git 并选择仓库，配置：
   - **Framework preset**: `Vite`（自动填充）
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
4. 点击 **Save and Deploy**

✅ 全球 300+ 节点 CDN · 无限带宽 · 自定义域名免费托管

---

## 9. 部署到自己的服务器（Nginx）

### 9.1 构建并上传

```bash
npm run build
# 将 dist/ 目录下的所有文件上传到服务器，例如 /var/www/disaster-site/
```

### 9.2 Nginx 配置示例

```nginx
server {
    listen 80;
    listen 443 ssl http2;
    server_name disaster.yourdomain.com;

    root /var/www/disaster-site;
    index index.html;
    charset utf-8;

    # SSL 证书 (使用 Certbot 自动申请免费证书)
    ssl_certificate     /etc/letsencrypt/live/disaster.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/disaster.yourdomain.com/privkey.pem;

    # Gzip 压缩 (重要，能减少 60%+ 体积)
    gzip on;
    gzip_types text/plain text/css application/javascript application/json image/svg+xml;
    gzip_min_length 1024;

    # 静态资源长缓存
    location ~* \.(?:css|js|woff2?|ttf|eot|otf|svg|ico|png|jpg|jpeg|gif|webp|avif)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    # HTML 不缓存 (便于发布后立即生效)
    location ~* \.html$ {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    # SPA / 单页回退 (本项目是纯静态，也可保留)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 禁止访问隐藏文件
    location ~ /\. { deny all; }
}
```

### 9.3 检查 & 重载 Nginx

```bash
nginx -t                 # 检查配置语法
systemctl reload nginx   # 重载配置
```

### 9.4 申请免费 HTTPS 证书 (Certbot)

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d disaster.yourdomain.com
```

按提示操作，会自动完成证书配置并加入自动续期。

---

## 10. 常见问题 FAQ

### Q1: 直接打开 index.html，数据加载失败？

**A:** 现代浏览器安全策略禁止从 `file://` 协议发起 fetch 请求 JSON，出现 `CORS` 或 `Not allowed to load local resource` 错误。
**解决方案：** 使用本地 HTTP 服务器，例如：

```bash
# 方式一：Vite (推荐)
npm run dev

# 方式二：Python 内置服务器
cd web8 && python3 -m http.server 8080

# 方式三：Node http-server
npx http-server . -p 8080 -o
```

### Q2: 部署到 GitHub Pages 后，页面白屏 / 资源 404？

**A:** 本项目已在 `vite.config.js` 设置了 `base: './'`，请确认：
1. 你执行的是 `npm run build` 且部署的是 **dist/** 目录
2. 仓库根目录存在 **`.nojekyll`** 文件（已附带）
3. 浏览器控制台查看具体是哪个文件 404，确认路径

### Q3: 如何接入真实的灾害数据 API？

**A:** 修改 `scripts/fetch-data.js` 的 `tryUrls` 数组为你的真实 API：

```js
const tryUrls = [
  'https://你的真实接口地址/disaster.json',
];
```

只要返回的数据结构包含 `disasters` 数组（字段符合 data.json 的规范）即可无缝接入。或者直接定期替换 `data/data.json` 文件。

### Q4: 如何修改顶部天气默认城市？

**A:** 打开 `js/app.js`，找到 `WEATHER_SAMPLES` 数组，修改 `city` 和数据范围即可。天气数据本身为模拟数据，也可以替换为调用真实天气 API。

### Q5: 如何新增/删除灾害类型？

**A:** 需要同步修改 3 处：
1. `data/data.json` 对应数据的 `disasterType` 字段
2. `js/app.js` 顶部的 `DISASTER_TYPES` + `TYPE_COLORS` 常量
3. `css/style.css` 中对应的 `.card-xxx`、`.disaster-xxx` 样式类和 `--color-xxx` 变量
4. `index.html` 中的 Tab 按钮

### Q6: 如何联系官方援助链接变成真实地址？

修改 data.json 中的每条数据 `aidUrl` 字段为真实地址即可（如壹基金、红十字会、各地慈善总会等）。

---

## 11. 故障排查

### ❌ npm install 失败

```bash
# 1. 清除缓存
npm cache clean --force

# 2. 删除 node_modules 重试
rm -rf node_modules package-lock.json
npm install

# 3. 还是失败？尝试使用淘宝镜像
npm config set registry https://registry.npmmirror.com
npm install
```

### ❌ npm run build 报错

1. 确认 Node.js ≥ 16：`node -v`
2. 确认 vite.config.js 未手动修改错误
3. 删除 `.vite/` 目录和 `node_modules/` 重新安装

### ❌ 构建成功但数据显示 0 条

1. 打开浏览器 DevTools → Console，看具体报错
2. 检查 Network 面板的 `data.json` 请求是否成功（HTTP 200？）
3. 确认 data.json 格式合法（推荐工具：https://jsonlint.com）

### ❌ 主题切换后刷新不生效

1. 检查浏览器 Application → Local Storage，是否有 `di-theme` 键
2. 如果是隐私模式/禁用 localStorage，会降级为跟随系统主题

### ❌ 移动端 Tab 按钮显示不全

项目已针对手机（≤480px）做了适配：Tab 按钮文字会自动隐藏仅保留图标。
如果你的自定义浏览器不生效，检查：
- 是否修改了 `@media (max-width: 480px)` 规则
- HTML meta viewport 是否存在（index.html 第二行已包含）

---

## 🏁 总结

| 部署方式 | 难度 | 成本 | HTTPS | 推荐指数 |
|---------|-----|-----|-------|---------|
| GitHub Pages | ⭐ | 免费 | ✅ | ⭐⭐⭐⭐⭐ |
| Vercel | ⭐ | 免费额度够用 | ✅ | ⭐⭐⭐⭐⭐ |
| Cloudflare Pages | ⭐ | 免费 | ✅ | ⭐⭐⭐⭐⭐ |
| Netlify | ⭐ | 免费额度够用 | ✅ | ⭐⭐⭐⭐ |
| 自建 Nginx | ⭐⭐⭐ | 服务器费用 | 需要手动配置 | ⭐⭐⭐（需要运维能力） |

遇到问题？先看 **第 11 节 故障排查**，90% 的常见问题都能解决。祝部署顺利！🚀

---

*© 2026 自然灾害天气资讯站 · DEPLOY.md v1.0*
