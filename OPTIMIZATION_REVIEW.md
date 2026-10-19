# Prompt Card Lab 审查与 v2.4 优化记录

> 审查对象：`main` @ `c2e1025`
> 审查方式：静态阅读 + Chromium 实机运行（1440×900 / 390×844 / 手机横屏）+ 交互回归 + 数据统计 + 弱网/CPU 降速
> 审查结论：当前不是零散 bug，而是 **5 代补丁叠加后的结构性问题**。优化顺序应当是：先做减法和启动路径，再换数据与生成器，最后拆模块。
> 状态：第 1–6 节是改动前基线；v2.0 见第 7 节，v2.1–v2.2 词库与 NSFW 扩容见第 8 节，v2.3 Prompt 工具见第 9 节，v2.4 修复/细化/芯片/杂交/反馈见第 10 节。

---

## 0. 一句话结论

这个工具的核心创意（散落卡片 + 批量组合 + OC/画师串库）是成立的，但当前版本背上了一个 **328 KB 的单文件 app.js**、一份 **65.9% 由固定词公式生成的 10,000 条 tag 库**、以及 **13 个 DOMContentLoaded 安装器和 1.2 秒轮询**。用户看到的“随机感”有相当一部分来自这些合成词，而不是真实 Danbooru 词库。

---

## 1. 现状快照

| 项目 | 实测 |
|---|---|
| `app.js` | 328 KB / 2,995 行 / 166 个函数声明，其中 15 个函数名重复定义 |
| `tags.js` | 994 KB，10,000 条 tag 全部在单行 `const TAGS = [...]` 里 |
| 首屏（桌面本地） | FCP 976 ms；DOMContentLoaded 处理阶段约 406 ms |
| 首屏（v2.0 复验） | FCP 88–104 ms；DOMContentLoaded 处理 33–43 ms |
| 温启动（缓存命中） | DCL 35 ms，但 DOMContentLoaded 结束 441 ms，出现 412 ms long task |
| 隐藏标签页 | 启动即生成 8 张“批量结果”卡，约 326 ms |
| 移动端 390×844 | 顶部 header 206 px；卡片区从 y=507 开始，尺寸仅 332×430；20 张卡堆叠 |
| 批量生成 | 8 张卡约 326 ms（含渲染和 3 轮后处理）；300 条 prompt 约 1.5–2.3 s |
| 数据质量 | 65.9% 的 tag 以固定修饰词开头；1,770 组“下划线/空格”重复；1,259 条中文仍含英文 |
| 生成质量 | 平均 41 个 tag / 643–696 字符；POV 模式 4.3% 抽到多人动作；1boy 模式 5.3% 抽到多男动作 |
| PWA | 离线可用；Service Worker 为 cache-first；无更新提示 |
| 安全 | 画师串名称/内容可注入 HTML/JS，实测触发 `onerror` |

> 注：冷启动弱网测试使用的是**未开启 gzip 的本地静态服务器**（4× CPU 降速 + 1.6 Mbps + 150 ms 延迟），得到 DCL 7.0 s、DCL 结束 9.3 s。GitHub Pages 会 gzip，真实下载量约为 72 KB + 129 KB，因此这个数字是上限式的压力测试，不代表线上一定 9 秒；但“启动长任务”和“隐藏页也生成”是真实存在的。

---

## 2. 关键问题

### P0-1 数据层：10,000 条里约 66% 是公式词，计数也不可信

**实测**

- 6,590 / 10,000（65.9%）以 `detailed / dynamic / dreamy / intense / gentle / bright / dark / soft / stylish / ...` 开头。
- 大量组合是“修饰词 + 名词”批量拼出来的：
  - `detailed angel hair`
  - `dynamic winter hair`
  - `dreamy maid lighting`
  - `intense sporty scene`
  - `cinematic witch angle`
- 1,770 组只差下划线的语义重复，例如：
  - `butler girl` / `butler_girl`
  - `cat girl` / `cat_girl`
  - `elegant girl` / `elegant_girl`
- 1,772 条 tag 带下划线，进入 prompt 后与空格写法混用。
- 1,259 条 `zh` 字段仍含英文，例如 `blue hair ornament -> 蓝色头发ornament`、`walking upside down -> walkingupsidedown`、`dark idol close-up -> 暗色偶像近上`。
- 计数明显不是真实 Danbooru 计数：`1girl` 为 1,171,109，而 `solo` 只有 3,993；4,526 条超过 100 万。

**影响**

- 生成结果会出现大量语义不成立的组合（如 `bunny_hair`、`intense bunny close-up`、`dynamic cute eyes`）。
- “10,000 tags” 的规模感，实际可用高质量词远低于这个数字。
- 中文摘要会机械翻译，出现“近上”“mood”“illustration”这类半成品。
- 词库体积大，拖慢首次加载与解析。

**位置**

- [tags.js](tags.js#L50)
- [app.js](app.js#L1031)（100 KB 的 `V152_BIG_POOL`，同样含大量合成词）

---

### P0-2 生成逻辑：互斥条件没有被约束

**实测（每个模式 300 条样本）**

| 模式 | 多人动作出现 | `solo` + 多人 | `1boy` + 多人 |
|---|---:|---:|---:|
| POV | 13 / 300 | 13 / 300 | 0 |
| 1boy | 16 / 300 | 0 | 16 / 300 |
| 2boys | 300 / 300 | 0 | 0 |

- POV 结果里出现 `1girl, solo, single focus, ... group sex`。
- 1boy 结果里出现 `spitroast / double penetration / two boys servicing one girl` 这类需要两个以上男性的动作。
- 典型标题：“NSFW｜多人性爱”，prompt 却是 `solo`。

**原因**

- `prefixFor()` 按交互模式加 `solo` / `1boy` / `2boys`，但动作核心直接从 99 条 `NSFW_CORES` 里抽，没有按交互模式过滤。
- [app.js](app.js#L2007) 的 `prefixFor`
- [app.js](app.js#L2049) 的 `pick(NSFW_CORES, u)`
- [app.js](app.js#L1866) 的 `NSFW_CORES`（含 spitroast、double penetration、group sex、bukkake 等）

**同一类问题还有角色词冲突**

- 平均 41 个 tag，其中头发相关 1.4–1.5 个，45%–55% 的结果有 2 个头发词；58% 的 NSFW 和 86% 的 SFW 结果有 2 个以上服装词。
- 实测出现过：`silver drill hair, blue twintails`（两个发色/发型）、`angel_dress, red yukata, orange_hat`（三套服装）、`flat chest, curvy body`（体型冲突）。
- 对应代码：[app.js](app.js#L2033) 头发抽 2 个、[app.js](app.js#L2037) 服装抽 3 个、[app.js](app.js#L2035) 体型抽 2 个，均没有互斥分组。

---

### P0-3 启动路径：隐藏的“批量生成”页在首屏就被完整渲染

**实测**

- 页面加载时，`#make-batch` 所在的标签页是隐藏的，但 `DOMContentLoaded` 仍调用 `renderBatch()` 生成 8 张卡。
- 温启动时 DOMContentLoaded 处理约 406 ms，产生一条 412 ms 的 long task，浏览器在这段时间内无法响应输入。
- 启动链路里接入的安装器包括：v1.5.1 compactor、v1.5.2、v1.5.3、v1.7、v1.9、v1.9.3、v1.9.5、v1.9.6/7、v1.9.8、v1.9.9；其中多个还有 `setTimeout(..., 300/500)` 二次执行。
- 13 处 `DOMContentLoaded` 监听，最终初始化顺序依赖脚本顺序和定时器，难以维护。
- v1.5.2 还保留了一个永久 `setInterval`，每 1.2 秒扫描整页所有 textarea：

```js
setInterval(() => v152ProcessAll(document), 1200);
```

**影响**

- 首屏可交互时间被推迟，手机端更明显。
- 隐藏页做的事情用户看不到，却要付费（时间、内存、电量）。
- 后续任何一次改动都可能被另一层补丁覆盖，调试成本高。

**位置**

- [app.js](app.js#L710) 的 DOMContentLoaded：`renderBatch(); renderOCList(); ... compactOCImages(true)`
- [app.js](app.js#L1268) 的 1.2 秒轮询
- [app.js](app.js#L1031) 的 100 KB 池
- 各版本安装器：[app.js](app.js#L1253)、[app.js](app.js#L1602)、[app.js](app.js#L2107)、[app.js](app.js#L2560)、[app.js](app.js#L2979)

---

### P0-4 移动端：散落卡片在 390 px 宽下几乎不可用

**实测（390×844，触摸模拟）**

- header 高 206 px（标题 + 两行 tabs），卡片区从 y=507 才开始。
- 卡片舞台只有 332×430 px，而卡片宽度是 145–230 px。
- JS 用 `x = 8 + random * (w - 240)` 定位，332 px 宽时可用横向范围只有 92 px，20 张卡必然堆在一起。
- 5 / 20 张卡有超过 50% 面积被其他卡覆盖；视觉上多数标题被截断。
- `.tag-card { touch-action: none; }`，从卡片上开始滑动无法滚动页面；而卡片几乎铺满舞台，移动端滚动体验会很差。
- `#page-cards.active` 用的是 `100vh`，不是 `100dvh`；移动端浏览器地址栏伸缩会造成布局跳动。
- `#page-cards` 在 980 px 以下把卡片舞台硬编码为 430 px 高，20 张卡仍然塞在同一个固定高度里。

**位置**

- [style.css](style.css#L1) 的 `.tag-card` / `#page-cards.active` / `@media(max-width:980px)`
- [app.js](app.js#L1) 的 `generateCards()` 定位计算
- [index.html](index.html#L1) 的 viewport（`user-scalable=no`）

**建议**

- 760 px 以下不要再用“散落”隐喻，直接改成 **2 列卡片网格 / 列表**，点击即加入栏位。
- 桌面端保留散落，但加 **碰撞检测**（简单网格占位或多次重试），避免标题被压住。
- 拖拽时再启用 `touch-action: none`，平时允许页面滚动。
- 使用 `100dvh`，并把移动端工具栏折叠成一行“筛选/刷新”。

---

### P0-5 补丁叠补丁：大量死代码、重复实现和隐藏 UI

**证据**

- 166 个函数声明，15 个同名函数（`norm` 6 次、`esc` 7 次、`install` 4 次、`translatePrompt` 3 次、`pick` 3 次……）。
- 3 套 OC 渲染器：`renderOCList` / `renderOCList198` / `renderOCList199`，后两套仍被绑定到事件上。
- 4 层 `renderBatch` 包装：v1.7 → v1.9 → v1.9.5 → v1.9.7 → v1.9.8。
- v1.9 的“整条中文翻译框”仍然在每次生成时创建 DOM，但 v1.9.8 用 `.zh-prompt-box{display:none!important}` 把它隐藏了；生成、翻译、插入的工作全部白做。
- v1.9.8 的 `saveOrUpdateOC198` 仍在文件里，但最终 `#save-oc` 被 v1.9.9 覆盖。
- v1.5.2 的 100 KB 池仍然被解析和保留在内存中，只为一条 1.2 秒轮询的旧路径服务。
- `index.html` 里有 6 个 `<style>` 块，其中 v1.5.4 和 v1.6.1 的 summary 样式基本重复；`style.css` 第一行是 7 KB 的单行压缩 CSS。

**影响**

- 体积、解析时间、内存、维护成本全部上升。
- 同名函数/多层包装让“改一处”变得不可预测。
- 隐藏的 DOM 和定时器继续消耗 CPU。

---

### P1-1 数据安全：localStorage 是唯一存储，且没有导出/导入

- OC、文件夹、画师串、待定、预设全在 `localStorage`，清缓存/换浏览器/换设备即丢失。
- 没有 JSON 导出/导入，没有备份，没有容量显示。
- 图片虽然已经隐藏上传入口（[index.html](index.html#L34) `#oc-image{display:none!important}`），但旧图片仍以 base64 存在 localStorage 中，继续占容量。
- `setOCs` / `set()` 直接 `localStorage.setItem`，配额满时抛异常；只有旧版 `saveOC` 有 try/catch，v1.9.9 的画师串/待定/预设保存没有兜底。

**建议**

- 增加“导出全部数据 / 导入 JSON”按钮，格式带 `version` 字段。
- 图片迁移到 IndexedDB（或只存缩略图），localStorage 只存元数据。
- 保存统一走 `safeSetItem`，失败时给出明确提示和清理入口。

---

### P1-2 安全：画师串可注入 HTML/JS（已复现）

**实测**

在画师串名称输入 `<img src=x onerror="window.__xss=1">`，内容输入 `</textarea><img src=x onerror="window.__xss2=1"><textarea>`，保存后两个 `onerror` 都执行了。

**原因**

- `saveArtist` / `renderArtistList` 直接把 `it.name`、`it.note`、`it.content` 拼进 `innerHTML`，没有转义。
- [app.js](app.js#L710)（同一个巨大单行里的 `renderArtistList`）
- OC 行、待定、预设已经用了 `esc()`，只有画师串这条路径漏了。

**影响**

虽然目前是本地数据、属于 self-XSS 范畴，但一旦增加“分享/导入配置”，就会变成可利用的持久化 XSS；同源下可以读取全部 OC 与画师串数据。

**修复**

- 用 `esc()` 包住三个字段，或用 `textContent` 构建。
- 加一个最小 CSP（禁止 inline script 以外的外链脚本；注意当前页面有内联 SW 注册脚本，需要 nonce 或 hash）。

---

### P1-3 功能细节 bug

1. **新建的空文件夹不显示**
   - 创建后已写入 `dpcl_oc_folders`，但 `renderOCList199` 在“无搜索关键词”时跳过空文件夹：
     `if(folderFilter==='__all' && !keyword && !items.length && folder.id!==UNCAT) return;`
   - 用户会以为创建失败；实际要通过某个 OC 的“移动到文件夹”下拉才能看到。
   - [app.js](app.js#L2960)

2. **“复制全部 / 下载 TXT”包含中文摘要和编号**
   - `getBatchText()` 拼接的是：标题 + 中文 summary + 空行 + prompt。
   - 实测 8 条结果共 4,336 字符，其中大量是中文摘要，不能直接作为批量 prompt 使用。
   - [app.js](app.js#L535)

3. **“本地库：10,000 tags”是写死的**
   - 页面状态栏文案在 HTML 里硬编码，词库变化后不会同步。
   - [index.html](index.html#L1) 附近

4. **UI 文案与功能不一致**
   - OC 面板仍写“支持插图”，但上传控件被 CSS 隐藏；“压缩已存插图”按钮也不可见。
   - 批量页顶部的统计仍显示“第二页 v1.7 … 动作不再由前 4 个种子截断生成”，属于开发调试文案。
   - [index.html](index.html#L34)、[app.js](app.js#L2092)

5. **画师串删除没有确认**
   - OC/文件夹有 confirm，画师串、待定、预设没有；误点即丢失。

6. **404 / 元信息**
   - 页面没有 favicon link，控制台有 404。
   - `apple-mobile-web-app-capable` 已废弃，建议同时加 `mobile-web-app-capable`。

---

### P1-4 PWA：离线可用，但更新策略偏“锁死”

- 离线实测通过：断网刷新仍能显示 20 张卡。
- `sw.js` 是 cache-first，只有 `CACHE_NAME` 变化才会更新；当前版本号手写在 [sw.js](sw.js#L1)。
- 没有“发现新版本 → 提示刷新”的 UI；用户可能长期停留在旧缓存。
- `APP_SHELL` 里同时缓存 `./` 和 `./index.html`，有重复。
- 建议：构建时注入版本号（或用文件 hash），增加 `updatefound` → “有新版本，点击刷新”的提示；对 HTML 用 network-first 或 stale-while-revalidate。

---

### P2 可访问性与工程化

- `user-scalable=no` 禁止缩放，影响低视力用户；建议移除。
- 卡片是 `div` + pointer 事件，没有 `tabindex` / 键盘操作 / `role`；键盘用户无法选卡。
- tabs 没有 `role="tablist"` / `aria-selected`；页面切换只靠 class。
- 没有 ESLint / Prettier / 测试 / CI；`app.js` 和 `style.css` 都是压缩风格，diff 极难读。
- 没有 schema version / 数据迁移机制；以后改 localStorage 结构容易把老数据读坏。

---

## 3. 优化方案

### Phase 1：先做减法与启动路径（预估 1–2 天）

**目标：不改产品形态，先让项目“能继续改”。**

1. **冻结基线**
   - 在 `opt/phase1` 分支上先提交当前版本，保留 `tags.js` 作为回退。
   - 用 Playwright 建 6 条 golden flow：首屏、选卡/导出、批量 SFW、批量 NSFW 四种交互、OC CRUD/文件夹、离线刷新。

2. **删除死层**
   - 删除 v1.5.2 整个 IIFE（含 100 KB `V152_BIG_POOL`、MutationObserver、1.2 s `setInterval`）。
   - 删除 v1.5.3 与 v1.4 的旧生成器，只保留 v1.7 + v1.9.5 的最终生成路径。
   - 删除隐藏的 `.zh-prompt-box` 创建/翻译/刷新逻辑（保留摘要即可）。
   - 删除 `renderOCList198` / 旧的 `renderOCList`，只留 v1.9.9。
   - 预期 `app.js` 从 328 KB 降到 160–180 KB。

3. **合并初始化**
   - 用一个 `init()` 按顺序做：绑定 tabs → 渲染卡面 → 绑定控件 → 恢复库。
   - 移除所有 `setTimeout(install, 300/500)` 和重复的 `DOMContentLoaded`。
   - `#oc-search` 只保留一个 input 监听；`#save-oc` / `#make-batch` 只保留一个赋值。
   - 批量结果改为“首次切到批量页时生成”，或 `requestIdleCallback` 延迟生成 2 张占位卡。

4. **修互斥与冲突**
   - 给 `NSFW_CORES` 加 `partners: 0|1|2|group` 元数据；按 `partnerMode` 过滤：
     - POV 只允许 0/1 人动作
     - 1boy 只允许单人男性动作
     - 2boys 允许 2 人动作
     - group 允许多人动作
   - 头发/服装/体型改为“互斥组抽样”：1 个发色 + 1 个发型 + 1 套主服装 + 最多 1 个配件。
   - 输出前做冲突检查：`solo` × 多人词、`flat chest` × `huge breasts`、两个不同发色。

5. **移动端改造**
   - 760 px 以下切换为卡片网格（2 列），不再绝对定位。
   - 760 px 以上保留散落，但加碰撞检测或网格占位。
   - `touch-action` 只在拖拽时设置；使用 `100dvh`；移动端 header 压缩到一行标题 + 可横向滚动 tabs。

6. **小修复**
   - 空文件夹始终显示。
   - `getBatchText()` 改成只输出 prompt，每行一条；标题/摘要另走“可读版复制”。
   - 转义画师串三个字段。
   - 统一 `safeSetItem`，配额错误 toast。
   - 加 favicon、`mobile-web-app-capable`、移除 `user-scalable=no`。

**Phase 1 验收指标**

- `app.js` < 180 KB；无 1.2 s 轮询；无 300/500 ms 安装器。
- 温启动 DOMContentLoaded 处理 < 100 ms；无 > 200 ms long task。
- 500 条生成样本中：0 条 `solo + group`，0 条 `1boy + 多男`，0 条多主服装/多主发色。
- 390 px 下：0 张卡被覆盖超过 50%，页面可从卡片区域正常滚动。
- 画师串 XSS 不再执行；空文件夹创建后立即可见；复制全部只含英文 prompt。
- 断网刷新、OC 编辑/文件夹/星标/删除全部回归通过。

---

### Phase 2：重做数据与生成器（预估 3–5 天，收益最大）

1. **词库换血**
   - 保留 2,000–4,000 条真实 Danbooru 常用 tag（可按 post count 排序、人工抽检），删除公式词。
   - 使用真实 count；同一 tag 只保留一种写法（统一空格或下划线，建议 prompt 用空格）。
   - `zh` 字段人工/词典校对，至少清掉“近上 / mood / illustration / ornament”这类机械翻译。
   - 分类重新平衡：hair/eyes/clothing/background 保留真实分布，action_sfw/action_nsfw 单独维护核心动作。

2. **互斥分组**
   - `hair_color`、`hair_style`、`outfit`、`body_type`、`expression` 各抽 0–1 个。
   - 为每套服装绑定“适配场景/风格”，避免 `angel_dress + yukata + hat` 同时出现。
   - NSFW 动作带 `partner_count`、`requires`（例如 `pov` / `two_boys` / `uncensored`），生成前过滤。

3. **Prompt 结构**
   - 固定分区：`quality → character → body/hair/face → outfit → action → partner → scene → camera → lighting → effects → guard`。
   - 提供“标准 / 精简 / 只动作”三档长度；精简档控制在 25–30 个 tag，避免挤占 OC + 画师串。
   - 中文摘要只显示“动作 / 场景 / 镜头 / 光影”，不把机械翻译塞进复制内容。

4. **生成质量测试**
   - 建 500 条 golden 样本，断言：
     - 无自相矛盾 tag
     - 无重复 tag
     - 无下划线混用
     - 每个模式的人数约束正确
     - 长度在目标区间

---

### Phase 3：拆模块与工程化（预估 3–5 天）

1. **构建**
   - 用 Vite 或 esbuild，把 `app.js` 拆成：
     `state / storage / tags / pools / generator / ui-cards / ui-batch / ui-library / ui-pending / pwa`。
   - 保留 vanilla JS 也可以，不必强上框架；关键是模块边界和单一初始化。
   - 输出 hash 文件名，HTML 由构建生成；PWA 版本号自动注入。

2. **存储**
   - IndexedDB 存图片/大对象，localStorage 存设置。
   - 加 schema version + migration；导入/导出 JSON。
   - 增加容量提示和一键清理。

3. **测试与 CI**
   - Vitest 单元测试：pool 过滤、互斥抽样、prompt 组装、storage 迁移。
   - Playwright：选卡/导出、批量 4 模式、OC 文件夹、离线刷新、移动端触摸滚动。
   - GitHub Actions：build + test + deploy Pages。

4. **可访问性**
   - tabs 用 `role=tablist/tab/tabpanel` + 键盘左右切换。
   - 卡片支持 `tabindex=0` + Enter/Space 选卡。
   - 移除 `user-scalable=no`；检查焦点样式与 44 px 点击目标。

---

## 4. 建议的验收口径

| 维度 | 目标 |
|---|---|
| 首屏 | 4G + 中端手机：FCP < 1.8 s，可交互 < 3 s（gzip 后） |
| 温启动 | 可交互 < 300 ms；无 > 200 ms long task |
| JS 体积 | `app.js` < 180 KB（Phase 1），构建后 gzip < 60 KB |
| 生成质量 | 500 条样本 0 条人数/服装/发色冲突；平均 tag 数 ≤ 32 |
| 移动端 | 390 px 下卡片不重叠；页面可从卡片区域滚动；无横向滚动 |
| 数据安全 | 导出/导入 round-trip 100%；配额失败有提示；XSS 不执行 |
| PWA | 离线可用；新版本一次加载内可发现并刷新 |
| 可访问性 | 键盘可完成选卡/切页；Lighthouse Accessibility ≥ 90 |

---

## 5. 风险与不要动的东西

**风险**

- 换词库会改变生成风格；建议保留旧词库开关，先并行跑一周再删。
- localStorage key 不能改；迁移要兼容 `dpcl_oc_list` / `dpcl_oc_folders` / `dpcl_oc_closed_folders` / `dpcl_artist_list` / `dpcl_pending_list` / `dpcl_preset_list`。
- PWA 的 scope、start_url、缓存路径不要动，否则老用户图标会失效。
- 移动端 `100vh` → `100dvh` 要同时测 iOS Safari 独立 PWA 模式。

**不要动**

- 散落卡片的核心交互（桌面端）：这是产品的辨识度。
- 第二页“一次只抽一个主行为”的约束：这是之前修 bug 的关键，不要为了丰富度重新放开。
- 本地优先、无后端、无账号的定位：这是这个工具最大的优点。

---

## 6. 建议的下一步

我建议从 **Phase 1 的 2、3 两步**开始（删死层 + 合并初始化），因为它们风险最低、收益最直接，而且能立刻用“启动长任务”和“app.js 体积”验证效果。

建议拆成 3 个 commit：

1. `refactor: remove legacy v1.5.x patch layers and hidden zh boxes`
2. `perf: single init path; defer hidden batch generation`
3. `fix: partner/outfit constraints, folder visibility, copy-all, artist escaping, mobile card grid`

每个 commit 都跑同一套 golden flow，确认选卡、四模式批量、OC 文件夹、离线刷新没有回归。

---

---

## 7. v2.0 已实施记录（2026-10-19）

### 7.1 已落地

- **删除失效旧层**：移除 v1.5.1 旧压缩器（MutationObserver 二次压缩）、v1.5.2（含 100 KB `V152_BIG_POOL`、1.2 秒 `setInterval`、MutationObserver）和 v1.5.3 整层；`app.js` 从 328 KB / 2,995 行降到约 199 KB。
- **启动路径**：首屏不再为隐藏的批量页预生成 8 张卡；第一次切到“批量生成”时才生成。移除 v1.7 的 500 ms 重复 install 定时器。
- **减少重复监听**：`#oc-search`、`#oc-sort`、`#oc-collapse-all` 只保留 v1.9.9 一套监听，不再每次输入触发三次渲染。
- **生成约束**：
  - 每个结果只抽 1 个发型、1 个眼睛、1 个体型、1 套主服装、1 个配件、1 个背景、1 个光影；NSFW 只抽 1 个表情。
  - 动作核心按 POV / 1boy / 2boys / 3boys+ 过滤，`solo + group sex` 和 `1boy + 多男动作` 已消除。
  - 动作核心按逗号拆开去重，消除核心内部的重复 tag。
  - 场景 / 镜头 / 光影在精简后至少各补 1 条，避免 `compact()` 把画面信息裁空。
- **NSFW 动态层**：
  - 新增运动、镜头、氛围三组动态词，按动作类型选择：后入、骑乘、站立、口交、抱起、侧入、多人、躺姿。
  - 动态词附中文，摘要新增“动态”一行。
  - NSFW 前缀加入 `adult woman`。
  - 地点层增加姿态兼容过滤，避免“站立动作 + 椅上”这类冲突。
- **移动端**：760 px 以下改为 2 列卡片网格，卡片改为静态布局，恢复页面滚动，使用 `touch-action:auto`。
- **修复**：画师串 HTML 转义（XSS）、空文件夹可见、“复制全部 / 下载 TXT”只输出 prompt、PWA 缓存版本、favicon、移动端 meta、页面缩放。
- **文档**：README 顶部新增 v2.0 说明。

### 7.2 复验数据

| 指标 | 改动前 | 改动后 |
|---|---:|---:|
| `app.js` | 328 KB | 约 240 KB |
| `tags.js` | 994 KB / 10,000 条 | 25 KB / 985 条 |
| NSFW 动作核心 | 99 | 209 |
| NSFW 动作/扩展标签 | 24 / 0 | 113 / 82 |
| 首屏 DOMContentLoaded 处理 | 约 406 ms | 33–43 ms |
| 温启动处理 / long task | 406 ms / 412 ms | 18–19 ms / 无 |
| 首屏隐藏批量卡 | 8 张 | 0 张，首次切换才生成 |
| NSFW 平均 tag 数 | 41 | 41.5（240 条样本） |
| 长度预算 30 | — | 平均 30.1 tag / 最高 31 |
| Prompt 质检 | — | 可抓 solo+多人、双发色、多套服装 |
| 星标 / 备份 | — | 星标持久化；导入恢复预算/收藏/待定 |
| 一键修复 | — | 冲突 prompt 修复后补动作并通过质检 |
| 一键细化 | — | 单卡 +4 个细节 tag，遵循预算 |
| Tag 反馈权重 | 无 | 正反馈约 2.5×，负反馈约 0.35×；实测 229 vs 83 |
| 杂交 | — | 两条收藏生成第 9 张卡 |
| `solo + 多人` | 13 / 300 POV | 0 / 300 |
| `1boy + 多男` | 16 / 300 | 0 / 300 |
| 双发色 / 双主服装 | 约 4% / 58% | 0 / 0 |
| 多人场景 + 冲突地点 | 存在 | 0 / 20 |
| 动态词 + NSFW 扩展 | 无 | 动态 3–5 个 + 扩展至少 2 个；摘要 0 条英文残留 |
| SFW 泄漏 NSFW 词 | 未测 | 0 / 20 |
| 连续 3 批 NSFW 动作重复 | 高 | 30 条 / 30 个不同标题 |
| 240 条直接生成的不同动作标题 | — | 177 |
| 空文件夹 | 不可见 | 立即可见 |
| 画师串 XSS | 可执行 | 已转义，0 执行 |
| 复制全部 | 含中文摘要 | 20 条纯 prompt，无中文 |
| 离线刷新 | 可用 | 仍可用 |

### 7.3 仍然保留到下一阶段

- **桌面卡片重叠**：桌面端仍保留“散落”效果，20 张卡偶尔互相遮挡；手机端已改为网格。
- **数据备份**：仍只有 localStorage，没有导出/导入；图片仍以 base64 存储。
- **工程化**：仍是单文件 app.js，未拆模块、未加自动化测试。

---

## 8. v2.1–v2.2：词库重建与 NSFW 扩容

### 8.1 词库

- `tags.js` 从 10,000 条合成词重建为 985 条精选 tag：
  - 0 条公式重复、0 条下划线重复、0 个伪造 count；
  - 中文仅 1 条包含 “JPEG” 缩写；
  - 颜色 × 发型 / 眼睛 / 服装 / 配件用规则生成，保证中文干净。
- 分类规模：头发 104、眼睛 59、服装 167、配件 97、背景 51、动作 SFW 25、动作 NSFW 113、NSFW 扩展 82。
- 卡片顶部状态栏动态显示“本地库：985 tags”；卡片不再显示假计数。

### 8.2 NSFW 生成

- `NSFW_CORES` 从 99 扩到 209：新增正常位变体、后入/俯卧、骑乘变体、站立/墙边/窗边/淋浴/浴缸/镜前、侧入/剪刀/椒盐卷饼、口交/69/乳交/手交/足交、肛交、多人、事后、道具与束缚等。
- 新增跨批次最近 120 条避重；连续 3 批 30 条结果，动作标题 30 个不同。
- 每次 NSFW 结果额外抽 3 个 `nsfw_general` 词（服装状态、情绪、镜头焦点、身体状态、氛围），至少保留 2 个；SFW 不抽。
- 动态层与扩展层分离：动态层负责“画面动势”，扩展层负责“状态/情绪/镜头”，避免把“抓床单/脸埋枕头”写进淋浴或站立场景。
- NSFW 前缀保留 `adult woman`，多人/束缚条目显式带 `consensual`。

### 8.3 复验

| 项目 | 结果 |
|---|---:|
| 卡片词库 | 985 条 |
| NSFW 动作核心 | 209 |
| NSFW 动作标签 | 113 |
| NSFW 扩展标签 | 82 |
| 20 条 SFW 泄漏 NSFW 词 | 0 |
| 连续 3 批 × 10 条 NSFW | 30 条 / 30 个不同标题 |
| 240 条直接生成 | 177 个不同标题，0 空值，平均 41.5 tag |
| JS 错误 / 控制台错误 | 0 / 0 |

### 8.4 仍保留到下一阶段

- **桌面卡片重叠**：桌面端仍保留“散落”效果，20 张卡偶尔互相遮挡；手机端已改为网格。
- **数据备份**：仍只有 localStorage，没有导出/导入；图片仍以 base64 存储。
- **工程化**：仍是单文件 app.js，未拆模块、未加自动化测试。
- **可继续扩容**：NSFW 核心目前 209 条；如果还想更“不重样”，可以继续加到 300–500 条，但需要同步扩充中文标题与体位/场景兼容表。

---

## 9. v2.3 Prompt 工具

### 9.1 已加

- **星标单个 Prompt**：批量结果卡新增“☆ 收藏”，待定页新增“收藏的 Prompt”面板，支持复制、删除、刷新后保留。
- **长度预算**：批量页新增 30 / 35 / 40 / 45 tags 预算；每张卡显示 tag 数、字符数、估算 token；超出时按低优先级裁剪，保核心动作/体位/场景/镜头/光影与 `no text`。
- **Prompt 质检**：检查空值、重复 tag、`solo`+多人、`1boy`+多男、NSFW 缺少 `adult woman`、双发色、多套服装、站位/家具地点冲突、超出预算。
- **数据备份 / 迁移**：导出全部 `dpcl_*` 数据为 JSON；导入前确认，失败自动回滚；覆盖 OC、文件夹、画师串、待定、预设、收藏、预算。

### 9.2 复验

| 项目 | 结果 |
|---|---:|
| SFW 8 条 | 星标/质检/预算 UI 正常，0 错误 |
| 星标切换 | 写入/删除/面板计数/刷新持久化通过 |
| 预算 30（20 条 NSFW） | 平均 30.1 tag，最高 31；1 条超预算被质检标出 |
| 冲突样例 | `solo + group sex`、black/blue 双发色、双服装均被质检抓到 |
| 导入备份 | 预算 30、1 条收藏、1 条待定恢复；页面自动刷新 |
| JS 错误 | 0 |

### 9.3 仍保留

- 桌面卡片重叠；数据仍以 localStorage 为主，图片仍存 base64；单文件 app.js；无自动化测试。
- 预算裁剪只降不升：把预算从 30 调回 45 不会自动恢复被删的词，需要重新生成。

---

## 10. v2.4 修复、细化、芯片、杂交、反馈

### 10.1 已加

- **一键修复**：去重、补 `adult woman`、修双发色、修多套服装、拆 `solo`/`1boy` 与多人冲突、补回单人动作、修地点冲突、按预算裁剪。
- **一键细化**：从光影、镜头/构图、效果、背景、表情、配件、NSFW 氛围池补 4 个不重复细节词，遵循长度预算。
- **芯片编辑器**：结果卡“芯片”按钮打开彩色 tag 芯片；× 删除，搜索词库添加，应用写回卡片。
- **杂交**：收藏两条 Prompt，在待定页勾选后“杂交选中两条”，按 tag 交叉并自动修复，结果作为新卡片加入批量页。
- **Tag 正/负反馈**：待定页“Tag 偏好”支持 `+ 多出` / `− 少出` / `清除`；权重约 2.5× / 0.35×，并作用到动作核心里的单个 tag。
- **新鲜度记忆**：卡片 tag 与 NSFW 核心跨刷新保留；最近用过的 tag 权重降低；可一键清空。

### 10.2 复验

| 项目 | 结果 |
|---|---:|
| 冲突 prompt 修复 | 自动补动作 + 质检通过 |
| 细化 | 单卡 +4 tag，质检通过 |
| 芯片编辑 | 打开/删除/搜索添加/写回通过 |
| 杂交 | 两条收藏 → 批量页第 9 张卡 |
| 反馈权重 | 正反馈 229 / 负反馈 83（300 次抽样） |
| 新鲜度 | 20 个卡片 tag、6 个 NSFW 核心写入本地存储 |
| JS 错误 | 0 |

### 10.3 仍保留

- 芯片编辑器目前无拖拽排序、无权重 `(tag:1.2)`、无自定义 tag 输入。
- 杂交是逐 tag 交叉，标签顺序可能被打散；已用修复兜底，但还不是严格的分段交叉。
- 预算裁剪只降不升；桌面卡片重叠、单文件 app.js、无自动化测试仍在。

*第 1–6 节保留为改动前基线；第 7 节 v2.0，第 8 节 v2.1–v2.2，第 9 节 v2.3，第 10 节 v2.4。*
