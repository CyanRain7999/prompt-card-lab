# Danbooru Prompt Card Lab v0.6

## 更新

- 保留本地 10,000 条 tag，但重新清理了填充方式，减少 `dynamic xxx v0` 这类假重复感标签。
- 第一页混合模式现在会纳入负面词，初始刷新会保证出现更多类别。
- 第一页增加 recentTags 记忆，最近出现过的 tag 会尽量避开，降低刷新重复率。
- 拖拽到右侧栏位改为按鼠标释放位置判定，不再被左侧盘面边界卡住。
- 第二页增加每条 prompt 的中文概要。
- 第二页改成结构化随机，不再固定刷某个剧情模板。


## v0.6.1 修复

- 修复：卡片拖进右侧栏位后，再点击右侧卡片取消选择时，卡片会回到拖动前在左侧盘面的原位置。
- 修复：回到盘面时自动重新置顶，避免被其它卡片或区域压住。


## v0.9 更新

- 第二页彻底改为“随机组合器”，不再使用预设完整场景。
- 随机槽位：
  - 随机角色主体：character / species / body / hair / eyes / face
  - 随机表情：expression
  - 随机服装配件：clothing / accessory
  - 随机动作：SFW 或 NSFW 动作池
  - 随机场景：background + 场景补充池
  - 随机镜头：camera
  - 随机构图：composition
  - 随机光影：lighting
  - 随机动态效果：effects
- 如果第二页“角色/主体”为空，会自动生成随机角色。
- 如果第二页“角色/主体”有内容，就使用手填主体，再随机动作和场景。
- 每批生成有 batchUsed 避重，连续生成有 generatorRecent 避重。


## v1.0 更新

- 第二页默认强制 `1girl, solo, single focus`。
- 随机角色不再从 `character` 分类乱抽，避免抽到 `multiple girls`、`1boy`、`1girl 1boy`、作品名等导致多角色。
- 手填角色时也会自动补 `1girl, solo, single focus`。
- NSFW 改为 POV 逻辑：使用 `pov, male pov` 表示交互方，尽量避免生成第二个完整角色。
- NSFW 核心动作/体位改为互斥单槽位，一次只抽一个体位。
- NSFW 不再额外追加随机 pose / after，避免多个体位冲突。
- NSFW 输出增加 `single sex position, one pose only` 约束。
- 所有输出增加 `no extra characters, no multiple girls, no crowd` 数量约束。


## v1.1 更新

- 第二页新增“交互方”选项：
  - `POV`
  - `1boy`
- NSFW + `POV`
  - 自动使用 `1girl, solo, single focus`
  - 自动添加 `pov, male pov`
- NSFW + `1boy`
  - 自动使用 `1girl, 1boy, duo`
  - 自动移除 `solo` 与 `pov`
  - 自动补 `only one boy`
- SFW 不受交互方选项影响，仍保持默认单人。


## v1.2 更新

- 第二页表情池扩展，避免总是一脸坏笑。
- NSFW 体位描述加强：正常位、种付位、腿架肩等加入 female lying on back / male on top / knees pressed to chest 等姿势锁定词。
- SFW 动作池、场景池、镜头/构图/光影/效果池扩展，降低重复感。
- 第二页仍然保留 POV / 1boy 交互方模式。


## v1.3 更新

- 第二页交互方扩展：
  - `POV`
  - `1boy`
  - `2boys`
  - `3boys+`
- `1boy` 现在会显式加入：
  - `visible male partner`
  - `male body visible`
  - `male face partly visible`
  - `male arms holding her`
  - `male hands on her body`
- `2boys` / `3boys+` 使用自愿多人交互语义：
  - `consensual group sex`
  - `two visible male partners`
  - `multiple visible male partners`
- 修复交互模式无效的问题：
  - `POV` 才会使用 `solo, single focus, pov, male pov`
  - `1boy` 会使用 `1girl, 1boy, duo`
  - `2boys` 会使用 `1girl, 2boys, threesome`
  - `3boys+` 会使用 `1girl, multiple boys, group sex`
- 第二页新增“强张力”开关：
  - 开：追加 `extreme perspective / strong foreshortening / dynamic composition / high visual tension / dutch angle / motion lines / speed distortion` 等
  - 关：不额外强塞这些词


## v1.4 更新

- 第二页从“少量手写固定池”升级为“固定控制池 + 本地 tags.js 动态大池”。
- 第二页现在直接大量复用以下动态分类：
  - species
  - body
  - hair
  - eyes
  - face
  - clothing
  - accessory
  - background
  - pose
  - expression
- 页面会显示当前第二页候选池的总量与各分类数量。
- 这样第二页真正可用的候选 tag 数不再停留在两三百，而会取决于本地 tags.js 的实际规模，通常可以轻松超过 2000。


## v1.5 更新

- 修复 OC 页面第三个 OC 经常保存不进去的问题。
- 原因通常是插图以 base64 原图存入 localStorage，浏览器本地存储额度很小，几张大图就会满。
- 保存 OC 时现在会自动压缩插图：
  - 默认压到约 960x640、JPEG 0.78
  - 保存失败时自动进一步压缩兜底
- OC 页面新增“压缩已存插图”按钮。
- 页面启动时会尝试自动压缩旧的大图，减少 localStorage 爆容量概率。


## v1.5.1 更新

- 第二页批量结果新增“自动精简”后处理。
- 目标是让“第二页生成结果 + 第三页 OC + 画师串”更不容易超长。
- 精简逻辑会优先删除：
  - 冗余质量词
  - 重复镜头词
  - 重复构图词
  - 过多的光影 / 氛围填充词
- 尽量保留角色、动作、场景、交互方、模式词（如 1girl / solo / 1boy / pov / sfw / nsfw / no text）。
- 复制“第二页结果卡”的按钮时，会优先复制精简版 prompt。


## v1.5.2 更新

- 第二页 prompt 再次压缩：在 v1.5.1 的基础上继续缩短，通常再砍 10–20 个词。
- 精简优先级：
  - 先砍冗余质量词
  - 再砍重复镜头 / 构图 / 光影词
  - 最后才砍泛用修饰词
- 第二页新增“大池增强”：
  - 从本地 tags 库直接抽取大词池，不再只依赖小固定池
  - 已从本地 tags 中整理出约 4839 条可用于第二页混抽的 tag
  - 分为 body / hair / face / clothing / accessory / pose / background / effect 八组
- 第二页结果会先从大池补充差异化词，再自动做强压缩。


## v1.5.3 更新

- 第二页批量生成改为大池重写逻辑。
- 不再主要依赖原来的十几个 pose/action。
- 运行时会从本地 activeTags 构建：
  - 固定大池：最多 6000 条
  - 大动作池：最多 5600 条组合动作
- 第二页的 SFW 动作会从大动作池抽取。
- NSFW 保留互斥单体位，但会从固定大池补充差异化词，避免同质化。
- 结果继续保持短 prompt，适配 OC + 第二页 + 画师串的组合。


## v1.5.4 更新

- 第二页结果卡改成可读版。
- 每张卡标题不再显示“大池动作源 5600 / 固定大池 6000”这类调试文本。
- 概要拆成中文字段：
  - 模式
  - 交互方
  - 动作
  - 场景
  - 镜头/构图
  - 光影
- 动作标题会尽量只显示动作，不再把 background / room / scene 误当动作标题。


## v1.5.5 更新

- 第二页顶部中文摘要新增中文映射。
- 动作、场景、镜头/构图、光影会优先显示中文。
- prompt 主体仍保持英文，方便直接复制到 NovelAI。
- 未命中的词会保留英文，避免错误翻译。


## v1.6.1 更新

- 修复 v1.6 首屏卡片无法生成、页面几乎不可操作的问题。
- 根因是 v1.6 打包时残留了未闭合的 JS 注释，导致 app.js 语法错误。
- 移除了 v1.5.4 / v1.5.5 的定时中文摘要重写层，避免闪烁。
- 中文摘要改为第二页生成时一次性写入。
- 保留 v1.6 的 tags.js 中文字段：10,000 条 tag 均带中文说明。


## v1.7 更新

- 修复第二页 SFW 动作高重复的根因。
- 原 v1.5.3 的“大动作池 5600 条”是按顺序生成的：
  - walking forward × 大量上下文
  - running toward viewer × 大量上下文
  - jumping lightly × 大量上下文
  - twirling around × 大量上下文
  - 然后就被 5600 截断了
- 所以看起来有 5600 条，实际核心动作只有前几个。
- v1.7 改为“平衡动作采样”：
  - SFW 先从 100+ 动作核心中抽 1 个
  - 再从 6000 条上下文里抽补充词
  - 不再预生成并顺序截断动作大池
- NSFW 动作核心扩充到 40+，仍保持一次只抽一个主行为，避免互斥体位打架。


## v1.8 更新

- 第二页每张结果卡新增“整条 prompt 中文翻译”区域。
- 英文 prompt 仍保留在原 textarea 中，方便直接复制到 NovelAI。
- 中文翻译会逐 tag 编号显示，方便检查整条 prompt 里每个词是什么意思。
- 中文翻译优先使用 tags.js 里的中文字段，其次使用内置固定词典，最后用词素翻译兜底。
- 增加“复制中文”按钮。


## v1.9 更新

- 不再使用 v1.8 的“运行时拆词翻译”方式。
- 直接把 `tags.js` 里的每一条 tag 都写入预翻译后的 `zh` 字段。
- 本次处理 tag 数：10000。
- 已写入中文字段：10000。
- 仍含英文片段的中文字段：1260。
- 第二页整条 prompt 中文翻译只读取预写好的 `zh` 字段，不再临时拆词翻译。
- 英文 prompt 仍保留在 textarea 中，方便直接用于 NovelAI。


## v1.9.2 修复

- 修复 v1.9 首页空白、按钮无法响应的问题。
- 根因：重写 `tags.js` 时只保留了 `TAGS`，误删了 `CATEGORY_ORDER` 和 `CATEGORY_LABEL`。
- `app.js` 首行会立刻读取 `CATEGORY_ORDER`，因此浏览器脚本直接中断，页面看起来就“动不了了”。
- v1.9.2 已从 v1.8 恢复分类常量，同时保留 v1.9 的 10,000 条预翻译 `zh` 字段。


## v1.9.3 更新

- 修复第二页“动作”栏仍有英文的问题。
- 根因：第二页 v1.7 的动作核心是 `app.js` 里硬编码的动作数组，不全在 `tags.js` 词库中。
- v1.9.3 给这些硬编码 SFW / NSFW 动作核心补了完整中文映射。
- 新增映射包括：
  - playing with hair → 拨弄头发
  - pulling blanket up → 拉起毯子
  - running up stairs → 跑上楼梯
  - writing in notebook → 在笔记本上写字
  - singing on stage → 在舞台上唱歌
  - tiptoeing across room → 踮脚穿过房间
  - 以及其余 100+ 个 SFW 动作核心
- 这个补丁只在“批量生成”后重写一次标题和动作行，不使用定时刷新，避免闪烁。


## v1.9.4 更新

- 修复 NSFW 正常位 / 种付位 / 后入 / 侧入等体位经常没有插入画面的问题。
- 所有插入类 NSFW 核心动作都追加了显式器官和插入锁定词：
  - `pussy`
  - `visible pussy`
  - `spread pussy`
  - `penis`
  - `visible penis`
  - `erect penis`
  - `vaginal penetration`
  - `penis insertion`
  - `penis inside pussy`
  - `genital focus`
  - `explicit genitalia`
  - `uncensored genitals`
- 正常位 / 种付位额外强调：
  - `female lying on back`
  - `male on top`
  - `not cowgirl`
  - `penis tip entering pussy`
- 生成后还有兜底补丁，防止旧压缩器把显式器官词裁掉。


## v1.9.5 更新

- 大幅扩充第二页 NSFW 核心动作池。
- NSFW 核心动作数量：99。
- 新增类别：
  - 正常位/种付位变体
  - 后入/俯卧/弯腰/站立后入
  - 侧入/汤匙位/剪刀位/pretzel/spork
  - 骑乘/背骑/莲花坐/椅上/膝上
  - 站立/抱起/墙边/窗边/桌面/楼梯/浴室
  - 口交/手交/素股/乳交/足交/腋交/六九式/坐脸/舔阴/指交
  - 肛交变体
  - 多人/双穴/前后夹击/精液浴等
- 所有插入类体位继续保留显式器官与插入锁定词，降低“只有姿势没有插入”的概率。
- 仍然保持一次只抽一个主行为，避免多个互斥体位同时出现导致生图失败。


## v1.9.6 更新

- 在 v1.9.5 的 NSFW 主动作池基础上新增独立“地点层”。
- 地点层包括：站立、墙边、抱起、窗边、淋浴间、床边、沙发、地板、桌边、镜前、椅上、膝上、洗手台、栏杆、车内。
- 新增独立“小道具层”。
- 小道具层包括：肛珠、肛塞、自慰棒、震动棒、按摩棒、乳夹、触手、史莱姆。
- 小道具层约 55% 概率叠加，避免每张 NSFW 都被道具污染。
- 第二页摘要新增“地点”“小道具”两行，中文翻译区会同步更新。


## v1.9.7 更新

- 第二页 NSFW 地点层 / 小道具层改为可控下拉框：
  - 地点层：关闭 / 随机 / 指定
  - 小道具层：关闭 / 随机 / 指定
- 指定地点包含：站立、墙边、抱起、窗边、淋浴间、床边、沙发、地板、桌边、镜前、椅上、膝上、洗手台、栏杆、车内。
- 指定小道具包含：肛珠、肛塞、自慰棒、震动棒、按摩棒、乳夹、触手、史莱姆。
- OC 页面改成紧凑卡片式：
  - 搜索 OC 名称 / 备注 / prompt
  - 星标优先 / 最新 / 最旧 / 名称排序
  - 缩略图 + 折叠 prompt
  - 支持星标、复制、填入第二页、删除
- 新增“待定页”：
  - 待定灵感 / prompt 片段保存
  - 组合草稿器与长度统计
  - 负面词 / 附加词预设保存


## v1.9.8 更新

- 已保存 OC 支持编辑/更新。
  - OC 卡片新增“编辑”按钮。
  - 编辑时会回填名称、备注、prompt。
  - 不选择新图片时保留旧图；选择新图片时替换旧图。
  - 顶部会显示编辑状态，可以取消编辑。
- 移除第二页每张结果下方的“整条 prompt 中文翻译”框。
  - 英文 prompt textarea 保留。
  - 顶部摘要仍保留中文，便于快速识别。
- 第二页控制区重新排版为响应式网格。
  - 不再一整行横向挤爆。
  - 窄屏时自动换成多行。


## v1.9.9 更新

- OC 区域改为文件夹式管理。
- OC 图片在列表中隐藏，改为紧凑文本行，方便十几个/几十个 OC 查找。
- 新增文件夹：可创建、改名、删除；删除文件夹时 OC 自动移回“未分类”。
- 支持把已有 OC 拖拽到文件夹中。
- 每个 OC 行也有“移动到文件夹”的下拉框，作为拖拽的替代操作。
- 文件夹可以折叠。
- 搜索框按名称 / 备注 / prompt / 文件夹名检索。
- 保存和编辑 OC 时可以选择所属文件夹。


## v1.10 PWA 更新

- 增加 PWA 支持：manifest、service worker、图标。
- 适合部署到 GitHub Pages 后添加到手机主屏幕。
- 增加 `GITHUB_PAGES_PWA_GUIDE.md` 部署说明。
- 增加少量手机端布局优化。


## v1.10.1 更新

- PWA 显示方向改为 `portrait-primary`，用于减少手机安装后自动横竖屏乱转。
- Service Worker 缓存版本已更新，避免旧 PWA 缓存继续使用旧 manifest。
- 注意：手机上已经“添加到主屏幕”的旧 PWA 可能仍缓存旧 manifest，需要删除桌面图标后重新添加一次。

## v1.10.2 更新

- 增加手机横屏防护层。
- 手机横屏且高度较低时，会显示“请竖屏使用”遮罩，避免界面被横屏拉坏。
- 继续保留 PWA `orientation: portrait-primary`。
- 更新 service worker cache name，部署后会触发新缓存。
