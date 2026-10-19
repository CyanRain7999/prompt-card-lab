/* ===== Prompt Card Lab curated tag library v2.2 =====
   只保留常用、可读的真实风格 tag，以及可组合的颜色变体。
   不再保留 10,000 条“修饰词 + 名词”的公式合成词，也不再伪造 count。
*/
const CATEGORY_ORDER = [
  "quality","rating","character","species","body","hair","eyes","face","expression",
  "clothing","accessory","pose","action_sfw","action_nsfw","nsfw_general","camera","composition",
  "lighting","background","effects","after","negative","danbooru_general"
];
const CATEGORY_LABEL = {
  quality:"质量",rating:"分级",character:"角色",species:"种族",body:"身体",hair:"头发",
  eyes:"眼睛",face:"脸部",expression:"表情",clothing:"服装",accessory:"配件",pose:"姿势",
  action_sfw:"SFW动作",action_nsfw:"NSFW动作",nsfw_general:"NSFW扩展",camera:"镜头",composition:"构图",
  lighting:"光影",background:"背景",effects:"效果",after:"事后",negative:"负面",
  danbooru_general:"通用扩展"
};

const t = (tag, cat, zh, mode = "mixed") => ({ tag, cat, zh, mode });

const COLORS = [
  ["black", "黑", "黑色"], ["brown", "棕", "棕色"], ["blonde", "金", "金色"],
  ["white", "白", "白色"], ["silver", "银", "银色"], ["grey", "灰", "灰色"],
  ["blue", "蓝", "蓝色"], ["red", "红", "红色"], ["pink", "粉", "粉色"],
  ["purple", "紫", "紫色"], ["green", "绿", "绿色"], ["orange", "橙", "橙色"],
  ["aqua", "水蓝", "水蓝色"]
];

const QUALITY = [
  t("masterpiece","quality","杰作"), t("best quality","quality","最佳质量"),
  t("very aesthetic","quality","高审美"), t("highres","quality","高分辨率"),
  t("absurdres","quality","超高分辨率"), t("newest","quality","新模型倾向"),
  t("official art","quality","官方图"), t("clean lineart","quality","干净线稿"),
  t("highly detailed","quality","高度细节"), t("cg illustration","quality","CG插画"),
  t("game cg","quality","游戏CG"), t("soft shading","quality","柔光上色"),
  t("no text","quality","无文字")
];

const RATING = [
  t("sfw","rating","全年龄","sfw"), t("sensitive","rating","敏感"),
  t("nsfw","rating","成人向","nsfw"), t("explicit","rating","露骨","nsfw"),
  t("uncensored","rating","无码","nsfw")
];

const CHARACTER = [
  t("1girl","character","单女主"), t("1boy","character","一名男性"),
  t("2boys","character","两名男性"), t("solo","character","单人"),
  t("duo","character","双人"), t("multiple girls","character","多名女性"),
  t("multiple boys","character","多名男性"), t("original","character","原创"),
  t("original character","character","原创角色"), t("touhou","character","东方系列"),
  t("arknights","character","明日方舟"), t("hakurei reimu","character","博丽灵梦"),
  t("kirisame marisa","character","雾雨魔理沙"), t("kochiya sanae","character","东风谷早苗"),
  t("komeiji koishi","character","古明地恋"), t("komeiji satori","character","古明地觉"),
  t("inubashiri momiji","character","犬走椛"), t("horikawa raiko","character","堀川雷鼓"),
  t("suzuran (arknights)","character","铃兰（明日方舟）"),
  t("nymph (arknights)","character","妮芙（明日方舟）")
];

const SPECIES = [
  t("wolf girl","species","狼少女"), t("demon girl","species","恶魔少女"),
  t("fox girl","species","狐狸少女"), t("angel girl","species","天使少女"),
  t("cat girl","species","猫少女"), t("bunny girl","species","兔子少女"),
  t("dragon girl","species","龙少女"), t("witch","species","魔女"),
  t("elf","species","精灵"), t("vampire","species","吸血鬼"),
  t("succubus","species","魅魔"), t("mermaid","species","人鱼"),
  t("kemonomimi","species","兽耳"), t("animal ears","species","兽耳"),
  t("multiple tails","species","多条尾巴"), t("horns","species","角"),
  t("tail","species","尾巴"), t("wings","species","翅膀"),
  t("pointy ears","species","尖耳")
];

const BODY = [
  t("athletic body","body","运动型身材"), t("narrow waist","body","细腰"),
  t("huge breasts","body","超巨乳"), t("large breasts","body","巨乳"),
  t("medium breasts","body","中等胸部"), t("small breasts","body","小胸"),
  t("flat chest","body","平胸"), t("thick thighs","body","丰满大腿"),
  t("wide hips","body","宽胯"), t("pale skin","body","白皙皮肤"),
  t("dark skin","body","深色皮肤"), t("sweat","body","汗"),
  t("abs","body","腹肌"), t("muscular","body","肌肉"),
  t("curvy","body","曲线身材"), t("slender","body","纤细")
];

const HAIR_STYLES = [
  ["long hair","长发"],["short hair","短发"],["medium hair","中长发"],["twintails","双马尾"],
  ["ponytail","马尾"],["high ponytail","高马尾"],["low ponytail","低马尾"],["braid","辫子"],
  ["side braid","侧辫"],["bangs","刘海"],["blunt bangs","齐刘海"],["sidelocks","侧发"],
  ["drill hair","卷发"],["bob cut","波波头"],["wavy hair","波浪发"],["curly hair","卷发"],
  ["straight hair","直发"],["messy hair","凌乱头发"],["hair bun","发髻"],["double bun","双丸子头"],
  ["ahoge","呆毛"],["hime cut","姬发式"],["hair over one eye","单眼遮发"],
  ["multicolored hair","多色头发"],["gradient hair","渐变发"],["two-tone hair","双色头发"]
];
const HAIR = [
  ...HAIR_STYLES.map(([tag,zh]) => t(tag,"hair",zh)),
  ...COLORS.flatMap(([en,short,full]) => [
    t(en+" hair","hair",short+"发"),
    t(en+" long hair","hair",full+"长发"),
    t(en+" twintails","hair",full+"双马尾"),
    t(en+" ponytail","hair",full+"马尾"),
    t(en+" braid","hair",full+"辫子"),
    t(en+" bangs","hair",full+"刘海")
  ])
];

const EYE_STYLES = [
  ["closed eyes","闭眼"],["half-closed eyes","半闭眼"],["tsurime","吊眼"],["tareme","垂眼"],
  ["heterochromia","异色瞳"],["glowing eyes","发光眼睛"],["empty eyes","空洞眼神"],
  ["sharp eyes","锐利眼神"],["big eyes","大眼睛"],["narrow eyes","细长眼睛"],
  ["eyelashes","睫毛"],["thick eyelashes","浓密睫毛"],["long eyelashes","长睫毛"],
  ["eyebrows","眉毛"],["thick eyebrows","粗眉"],["colored eyelashes","彩色睫毛"],
  ["sleepy eyes","困倦眼神"],["sultry eyes","妩媚眼神"],["wide eyes","睁大眼睛"],
  ["cat eyes","猫眼"]
];
const EYES = [
  ...EYE_STYLES.map(([tag,zh]) => t(tag,"eyes",zh)),
  ...COLORS.flatMap(([en,short,full]) => [
    t(en+" eyes","eyes",short+"眼"),
    t(en+" pupils","eyes",short+"色瞳孔"),
    t(en+" eyelashes","eyes",short+"色睫毛")
  ])
];

const FACE = [
  t("blush","face","脸红"), t("glasses","face","眼镜"),
  t("round glasses","face","圆框眼镜"), t("open mouth","face","张嘴"),
  t("closed mouth","face","闭嘴"), t("fang","face","虎牙"),
  t("freckles","face","雀斑"), t("mole under eye","face","眼下痣"),
  t("makeup","face","妆容"), t("lipstick","face","口红")
];

const EXPRESSION = [
  t("smile","expression","微笑"), t("gentle smile","expression","温柔微笑"),
  t("grin","expression","咧嘴笑"), t("smirk","expression","得意笑"),
  t("smug","expression","自满"), t("pout","expression","嘟嘴"),
  t("frown","expression","皱眉"), t("angry","expression","生气"),
  t("surprised","expression","惊讶"), t("sad","expression","悲伤"),
  t("tears","expression","眼泪"), t("crying","expression","哭泣"),
  t("embarrassed","expression","害羞"), t("shy","expression","羞涩"),
  t("confident","expression","自信"), t("serious","expression","严肃"),
  t("expressionless","expression","无表情"), t("sleepy","expression","困倦"),
  t("wink","expression","眨眼"), t("tongue out","expression","吐舌"),
  t("drooling","expression","流口水"), t("nose blush","expression","鼻尖泛红"),
  t("teasing","expression","挑逗"), t("naughty smile","expression","坏笑"),
  t("sultry","expression","妩媚"), t("parted lips","expression","微张嘴唇"),
  t("biting lip","expression","咬唇"), t("blissful","expression","愉悦"),
  t("nervous","expression","紧张"), t("excited","expression","兴奋")
];

const CLOTHING_BASIC = [
  ["school uniform","校服"],["serafuku","水手服"],["sailor collar","水手领"],["blazer","西装外套"],
  ["shirt","衬衫"],["t-shirt","T恤"],["hoodie","连帽衫"],["sweater","毛衣"],
  ["cardigan","开衫"],["jacket","外套"],["coat","大衣"],["dress","连衣裙"],
  ["sundress","吊带连衣裙"],["long dress","长裙"],["skirt","裙子"],["pleated skirt","百褶裙"],
  ["miniskirt","超短裙"],["shorts","短裤"],["pants","长裤"],["jeans","牛仔裤"],
  ["leggings","紧身裤"],["thighhighs","过膝袜"],["pantyhose","连裤袜"],["socks","袜子"],
  ["boots","靴子"],["shoes","鞋子"],["sneakers","运动鞋"],["sandals","凉鞋"],
  ["gloves","手套"],["scarf","围巾"],["hat","帽子"],["cap","鸭舌帽"],
  ["beret","贝雷帽"],["headband","发带"],["ribbon","丝带"],["bow","蝴蝶结"],
  ["necktie","领带"],["choker","颈圈"],["belt","腰带"],["apron","围裙"],
  ["maid outfit","女仆装"],["nurse uniform","护士服"],["kimono","和服"],["yukata","浴衣"],
  ["hakama","袴"],["qipao","旗袍"],["bikini","比基尼"],["swimsuit","泳装"],
  ["one-piece swimsuit","连体泳装"],["lingerie","内衣"],["bra","胸罩"],["panties","内裤"],
  ["nightgown","睡裙"],["pajamas","睡衣"],["armor","盔甲"],["cloak","斗篷"],
  ["cape","披风"],["robe","长袍"],["hood","兜帽"],["mask","面具"],
  ["eyepatch","眼罩"],["goggles","护目镜"],["headphones","耳机"]
];
const CLOTHING_GARMENTS = [
  ["dress","连衣裙"],["skirt","裙子"],["shirt","衬衫"],["jacket","外套"],
  ["hoodie","连帽衫"],["kimono","和服"],["bikini","比基尼"],["swimsuit","泳装"]
];
const CLOTHING = [
  ...CLOTHING_BASIC.map(([tag,zh]) => t(tag,"clothing",zh)),
  ...COLORS.flatMap(([en,short,full]) =>
    CLOTHING_GARMENTS.map(([g,zh]) => t(en+" "+g,"clothing",full+zh))
  )
];

const ACCESSORY_BASIC = [
  ["hairclip","发卡"],["hair ornament","发饰"],["hair ribbon","发带"],["hair bow","蝴蝶结发饰"],
  ["necklace","项链"],["pendant","吊坠"],["earrings","耳环"],["bracelet","手链"],
  ["ring","戒指"],["sunglasses","太阳镜"],["earphones","耳塞"],["mic","麦克风"],
  ["sword","剑"],["katana","武士刀"],["staff","法杖"],["spear","长枪"],
  ["gun","枪"],["bag","包"],["backpack","背包"],["umbrella","雨伞"],
  ["fan","扇子"],["teacup","茶杯"],["doll","玩偶"],["crown","王冠"],
  ["tiara","头冠"],["veil","面纱"],["armband","臂环"],["thigh strap","腿环"],
  ["garter","吊袜带"],["wrist cuffs","腕铐"],["bell","铃铛"],["tail ribbon","尾巴丝带"]
];
const ACCESSORY_ITEMS = [["hairclip","发卡"],["necklace","项链"],["earrings","耳环"],["hair ribbon","发带"],["hair bow","蝴蝶结发饰"]];
const ACCESSORY = [
  ...ACCESSORY_BASIC.map(([tag,zh]) => t(tag,"accessory",zh)),
  ...COLORS.flatMap(([en,short,full]) =>
    ACCESSORY_ITEMS.map(([a,zh]) => t(en+" "+a,"accessory",full+zh))
  )
];

const POSE = [
  ["standing","站立"],["sitting","坐着"],["kneeling","跪着"],["lying","躺着"],
  ["on back","仰卧"],["on stomach","俯卧"],["on side","侧卧"],["all fours","四肢着地"],
  ["leaning forward","前倾"],["leaning back","后仰"],["arms behind back","双手背后"],
  ["arms up","举手"],["hands on hips","叉腰"],["crossed arms","抱臂"],
  ["crossed legs","翘腿"],["hand on cheek","托腮"],["hand in hair","手抚头发"],
  ["looking at viewer","看向观众"],["looking away","看向别处"],["looking back","回头看"],
  ["looking up","抬头"],["looking down","低头"],["head tilt","歪头"],
  ["crouching","蹲伏"],["squatting","蹲下"],["hugging","拥抱"],
  ["holding hands","牵手"],["peace sign","剪刀手"],["salute","敬礼"],
  ["pointing","指向"],["one leg raised","单腿抬起"],["knees together","双膝并拢"],
  ["arched back","弓背"],["contrapposto","对立式站姿"]
].map(([tag,zh]) => t(tag,"pose",zh));

const ACTION_SFW = [
  ["walking","走路"],["running","奔跑"],["jumping","跳跃"],["reading a book","读书"],
  ["holding book","拿着书"],["adjusting glasses","扶眼镜"],["waving","挥手"],["dancing","跳舞"],
  ["singing","唱歌"],["playing instrument","演奏乐器"],["holding teacup","拿着茶杯"],["drinking tea","喝茶"],
  ["cooking","做饭"],["writing","写字"],["drawing","画画"],["stretching","伸展"],
  ["fighting","战斗"],["holding sword","持剑"],["casting spell","施法"],["riding horse","骑马"],
  ["driving","开车"],["sleeping","睡觉"],["hugging pillow","抱枕头"],["eating","吃东西"],
  ["looking out window","望向窗外"]
].map(([tag,zh]) => t(tag,"action_sfw",zh,"sfw"));

const ACTION_NSFW = [
  ["mating press","种付压迫位"],["breeding press","种付位"],["missionary position","正常位"],
  ["doggystyle","后入位"],["cowgirl position","骑乘位"],["reverse cowgirl","背面骑乘"],
  ["side entry sex","侧入位"],["standing sex","站立位"],["spooning sex","侧卧后入"],
  ["prone bone","俯卧后入"],["lifted sex","抱起身位"],["anal sex","肛交"],
  ["vaginal sex","阴道性交"],["blowjob","口交"],["handjob","手交"],
  ["paizuri","乳交"],["footjob","足交"],["thighjob","素股"],
  ["fingering","指交"],["cunnilingus","舔阴"],["facesitting","坐脸"],
  ["group sex","多人交互"],["threesome","三人场景"],["lactation","授乳"],
  ["legs on shoulders","腿架肩"],["ankles held up","抬脚"],["knees pressed to chest","膝盖压胸"],
  ["eye contact sex","对视性交"],["standing doggystyle","站立后入"],["bent over desk","桌边后入"],
  ["hands on wall","双手扶墙"],["turtle position","龟缩后入"],["downward dog position","下犬式"],
  ["squatting cowgirl","深蹲骑乘"],["leaning forward cowgirl","前倾骑乘"],["sideways cowgirl","侧坐骑乘"],
  ["lotus position","莲花坐"],["yab-yum","双修坐"],["lap sex","膝上性交"],
  ["chair sex","椅上性交"],["sofa sex","沙发性交"],["table sex","桌边性交"],
  ["bed edge sex","床边性交"],["floor sex","地板性交"],["against wall","墙边性交"],
  ["against window","窗边性交"],["shower sex","淋浴性交"],["bathtub sex","浴缸性交"],
  ["stair sex","楼梯性交"],["mirror sex","镜前性交"],["pool sex","泳池性交"],
  ["beach sex","沙滩性交"],["car sex","车内性交"],["balcony sex","阳台性交"],
  ["suspended sex","悬空性交"],["standing carry","站立抱起"],["scissors position","剪刀位"],
  ["pretzel position","椒盐卷饼位"],["spork position","叉勺位"],["butterfly position","蝴蝶位"],
  ["piledriver position","打桩位"],["seashell position","贝壳位"],["folded deckchair position","折叠椅位"],
  ["eagle position","展鹰位"],["g-whiz position","G点抬腿位"],["coital alignment","贴合位"],
  ["side saddle position","侧鞍位"],["deepthroat","深喉"],["face fucking","口交抽插"],
  ["69","六九式"],["side 69","侧卧六九"],["standing blowjob","站立口交"],
  ["two-handed handjob","双手手交"],["armpit sex","腋交"],["intercrural sex","股间性交"],
  ["mutual masturbation","互相自慰"],["tribadism","磨豆腐"],["frottage","摩擦"],
  ["grinding","磨蹭"],["dry humping","干蹭"],["lap dance","膝上舞"],
  ["striptease","脱衣舞"],["undressing","脱衣"],["kissing","接吻"],
  ["neck kiss","吻颈"],["nipple play","乳首爱抚"],["breast sucking","吸乳"],
  ["spanking","打屁股"],["hair pulling","抓头发"],["anal missionary","正常位肛交"],
  ["anal doggystyle","后入肛交"],["anal cowgirl","骑乘肛交"],["anal spooning","侧卧肛交"],
  ["anal prone bone","俯卧肛交"],["spitroast","前后夹击"],["double penetration","双穴"],
  ["bukkake","多人射精"],["gangbang","群交"],["creampie","中出"],
  ["cum on face","脸上"],["cum on breasts","胸上"],["aftercare","事后照顾"],
  ["cuddling","依偎"],["pillow talk","枕边话"],["vibrator","震动棒"],
  ["dildo","假阳具"],["anal beads","肛珠"],["butt plug","肛塞"],
  ["strap-on","穿戴式"],["blindfold","蒙眼"],["rope bondage","绳缚"],
  ["collar","项圈"],["leash","牵引绳"]
].map(([tag,zh]) => t(tag,"action_nsfw",zh,"nsfw"));

const CAMERA = [
  ["close-up","特写"],["upper body","上半身"],["cowboy shot","牛仔镜头"],["full body","全身"],
  ["portrait","肖像"],["profile","侧脸"],["three-quarter view","四分之三侧脸"],["front view","正面"],
  ["back view","背面"],["side view","侧面"],["from above","俯视"],["from below","仰视"],
  ["from behind","背视"],["over-the-shoulder view","过肩视角"],["dutch angle","荷兰角"],
  ["low angle","低角度"],["high angle","高角度"],["wide shot","广角"],
  ["medium shot","中景"],["depth of field","景深"],["shallow depth of field","浅景深"],["fisheye","鱼眼"],
  ["panoramic","全景"],["pov","第一人称视角"],["male pov","男性第一人称视角"],
  ["dynamic angle","动态角度"],["extreme perspective","极端透视"],["strong foreshortening","强透视缩短"],
  ["sharp focus","清晰对焦"],["wide angle","广角镜头"]
].map(([tag,zh]) => t(tag,"camera",zh));

const COMPOSITION = [
  ["dynamic composition","动态构图"],["diagonal composition","斜向构图"],["symmetrical composition","对称构图"],
  ["centered composition","中心构图"],["rule of thirds","三分法"],["off-center camera","偏心构图"],
  ["negative space","留白"],["cinematic composition","电影感构图"],["wide composition","宽幅构图"],
  ["vertical composition","竖构图"],["close-up composition","特写构图"],["full body composition","全身构图"],
  ["low horizon","低地平线"],["high horizon","高地平线"],["leading lines","引导线"],
  ["framing","取景框"],["silhouette","剪影"],["reflection","倒影"]
].map(([tag,zh]) => t(tag,"composition",zh));

const LIGHTING = [
  ["cinematic lighting","电影感光影"],["dramatic lighting","戏剧光影"],["soft lighting","柔和光影"],
  ["natural lighting","自然光"],["studio lighting","棚拍光"],["rim lighting","轮廓光"],
  ["backlighting","逆光"],["side lighting","侧光"],["top lighting","顶光"],
  ["warm lighting","暖光"],["cool lighting","冷光"],["golden hour","黄金时刻"],
  ["moonlight","月光"],["candlelight","烛光"],["neon lights","霓虹光"],
  ["light rays","光束"],["god rays","耶稣光"],["lens flare","镜头光晕"],
  ["high contrast","高对比"],["low key","暗调"],["high key","亮调"],
  ["chiaroscuro","明暗对照"],["volumetric lighting","体积光"],["bloom","泛光"],
  ["glow","发光"],["soft shadows","柔和阴影"],["hard shadows","硬阴影"],["dappled light","斑驳光影"]
].map(([tag,zh]) => t(tag,"lighting",zh));

const BACKGROUND = [
  ["classroom","教室"],["bedroom","卧室"],["living room","客厅"],["kitchen","厨房"],
  ["bathroom","浴室"],["office","办公室"],["library","图书馆"],["cafe","咖啡馆"],
  ["restaurant","餐厅"],["bar","酒吧"],["hotel room","酒店房间"],["hallway","走廊"],
  ["staircase","楼梯"],["rooftop","天台"],["balcony","阳台"],["garden","花园"],
  ["park","公园"],["forest","森林"],["beach","海滩"],["ocean","海洋"],
  ["lake","湖泊"],["river","河流"],["mountain","山"],["field","田野"],
  ["flower field","花田"],["city","城市"],["street","街道"],["alley","小巷"],
  ["subway","地铁"],["train","火车"],["school","学校"],["shrine","神社"],
  ["temple","寺庙"],["castle","城堡"],["ruins","废墟"],["spaceship","宇宙飞船"],
  ["fantasy landscape","奇幻风景"],["night sky","夜空"],["starry sky","星空"],["sunset","日落"],
  ["sunrise","日出"],["cloudy sky","多云天空"],["rain","雨"],["snow","雪"],
  ["cherry blossoms","樱花"],["autumn leaves","秋叶"],["indoors","室内"],["outdoors","室外"],
  ["window","窗户"],["curtains","窗帘"],["mirror","镜子"]
].map(([tag,zh]) => t(tag,"background",zh));

const EFFECTS = [
  ["motion blur","动态模糊"],["glowing particles","发光粒子"],["floating petals","漂浮花瓣"],
  ["clothes fluttering","衣服飘动"],["hair flowing","头发飘动"],["motion lines","运动线"],
  ["speed lines","速度线"],["sparkles","闪光"],["wind","风"],
  ["smoke","烟"],["dust","尘埃"],["flames","火焰"],
  ["water splashes","水花"],["bubbles","泡泡"],["steam","蒸汽"],
  ["feathers","羽毛"],["petals","花瓣"],["glowing","发光"],
  ["particles","粒子"],["afterimage","残影"],["energy","能量"],["magic circle","魔法阵"]
].map(([tag,zh]) => t(tag,"effects",zh));

const AFTER = [
  t("after sex","after","事后","nsfw"), t("creampie aftermath","after","中出事后","nsfw"),
  t("cum dripping","after","液体滴落","nsfw"), t("cum on body","after","液体洒身","nsfw"),
  t("afterglow","after","余韵","nsfw")
];

const NSFW_GENERAL = [
  ["toes curling","脚趾蜷缩","nsfw"],["trembling","颤抖","nsfw"],["body pressed close","身体紧贴","nsfw"],
  ["body trembling","身体颤抖","nsfw"],["legs trembling","双腿发抖","nsfw"],["gasping","喘息","nsfw"],
  ["breathless","呼吸急促","nsfw"],["moaning","呻吟","nsfw"],
  ["partially undressed","半脱","nsfw"],["clothes pulled aside","衣物拨开","nsfw"],["open shirt","衬衫敞开","nsfw"],
  ["shirt unbuttoned","衬衫解扣","nsfw"],["skirt lifted","裙子掀起","nsfw"],["dress lifted","连衣裙掀起","nsfw"],
  ["bra pulled down","胸罩拉下","nsfw"],["panties around one leg","内裤挂在腿边","nsfw"],["lace lingerie","蕾丝内衣","nsfw"],
  ["garter belt","吊袜带","nsfw"],["wet clothes","湿衣","nsfw"],["see-through","透视","nsfw"],
  ["disheveled clothes","凌乱衣物","nsfw"],["undressed","已脱衣","nsfw"],["half-open robe","浴袍半开","nsfw"],
  ["towel around body","浴巾裹身","nsfw"],["bedsheet wrapped","床单裹身","nsfw"],["loose clothing","宽松衣物","nsfw"],
  ["rolled-up sleeves","卷起袖子","nsfw"],["loosened collar","松开领口","nsfw"],
  ["bedroom eyes","迷离眼神","nsfw"],["lewd expression","淫靡表情","nsfw"],["ahegao","阿黑颜","nsfw"],
  ["seductive","诱惑","nsfw"],["sultry gaze","妩媚凝视","nsfw"],["lustful","渴望","nsfw"],
  ["passionate","热情","nsfw"],["rough","粗暴","nsfw"],["tender","温柔","nsfw"],
  ["slow","缓慢","nsfw"],["intense","激烈","nsfw"],["playful","俏皮","nsfw"],
  ["dominant","主导","nsfw"],["submissive","顺从","nsfw"],["sensual","感官","nsfw"],
  ["intimate","亲密","nsfw"],["eye contact","对视","nsfw"],["flushed face","脸颊泛红","nsfw"],
  ["heavy breathing","粗重呼吸","nsfw"],["consensual","自愿","nsfw"],["enthusiastic","投入","nsfw"],
  ["intimate atmosphere","亲密氛围","nsfw"],["steamy atmosphere","湿热氛围","nsfw"],["romantic","浪漫","nsfw"],
  ["affectionate","亲昵","nsfw"],["longing","渴望凝视","nsfw"],["shameless","毫无羞怯","nsfw"],
  ["uninhibited","放纵","nsfw"],["flirty","调情","nsfw"],["coy","娇羞","nsfw"],
  ["smoldering","炽热","nsfw"],
  ["breast focus","胸部特写","nsfw"],["thigh focus","大腿特写","nsfw"],["hip focus","臀部特写","nsfw"],
  ["face focus","面部特写","nsfw"],["hand focus","手部特写","nsfw"],["crotch focus","胯部特写","nsfw"],
  ["close-up on body","身体特写","nsfw"],["mirror reflection","镜面倒影","nsfw"],["focus on hands","手部焦点","nsfw"],
  ["focus on face","面部焦点","nsfw"],["focus on thighs","大腿焦点","nsfw"],["focus on breasts","胸部焦点","nsfw"],
  ["private room","私密房间","nsfw"],["dim lighting","昏暗光","nsfw"],["intimate lighting","亲密光","nsfw"],
    ["sweat on skin","肌肤出汗","nsfw"],["shiny skin","泛光肌肤","nsfw"],["flushed skin","泛红肌肤","nsfw"],
  ["love bites","吻痕","nsfw"],["hickeys","草莓印","nsfw"],["scratches","抓痕","nsfw"],
  ["red marks","红痕","nsfw"],["goosebumps","鸡皮疙瘩","nsfw"]
].map(([tag,zh,mode]) => t(tag,"nsfw_general",zh,mode||"nsfw"));

const NEGATIVE = [
  ["lowres","低分辨率"],["worst quality","最差质量"],["low quality","低质量"],["jpeg artifacts","JPEG压缩痕迹"],
  ["blurry","模糊"],["bad anatomy","错误人体"],["bad hands","错误手部"],["missing fingers","缺指"],
  ["extra fingers","多指"],["fused fingers","手指粘连"],["extra limbs","多余肢体"],["missing arms","缺臂"],
  ["missing legs","缺腿"],["extra arms","多臂"],["extra legs","多腿"],["malformed limbs","畸形肢体"],
  ["deformed","畸形"],["mutated","变异"],["bad proportions","比例错误"],["long neck","长脖子"],
  ["bad feet","错误脚部"],["watermark","水印"],["signature","签名"],["artist name","画师名"],
  ["username","用户名"],["text","文字"],["logo","标志"],["cropped","裁切"],
  ["out of frame","出画"],["multiple views","多视图"],["duplicate","重复"],["scan artifacts","扫描痕迹"],
  ["censored","打码"],["bar censor","黑条打码"],["mosaic censoring","马赛克"],["extra digits","多余手指"],
  ["fewer digits","缺少手指"]
].map(([tag,zh]) => t(tag,"negative",zh));

const TAGS = [
  ...QUALITY, ...RATING, ...CHARACTER, ...SPECIES, ...BODY,
  ...HAIR, ...EYES, ...FACE, ...EXPRESSION, ...CLOTHING, ...ACCESSORY,
  ...POSE, ...ACTION_SFW, ...ACTION_NSFW, ...CAMERA, ...COMPOSITION,
  ...LIGHTING, ...BACKGROUND, ...EFFECTS, ...AFTER, ...NSFW_GENERAL, ...NEGATIVE
].filter((x, i, arr) => arr.findIndex(y => y.tag === x.tag) === i);
