const $=s=>document.querySelector(s),$$=s=>Array.from(document.querySelectorAll(s));let picked=[],zCounter=10,currentCards=[],categoryDebt=Object.fromEntries(CATEGORY_ORDER.map(c=>[c,1])),recentTags=[];const activeTags=[...TAGS];const colorMap={quality:205,rating:330,character:260,species:120,body:15,hair:45,eyes:170,face:300,expression:25,clothing:220,accessory:285,pose:190,action_sfw:95,action_nsfw:345,camera:200,composition:240,lighting:55,background:160,effects:35,after:10,negative:0,danbooru_general:270};function toast(m){const e=$("#toast");e.textContent=m;e.classList.add("show");setTimeout(()=>e.classList.remove("show"),1600)}function pickOne(a){return a[Math.floor(Math.random()*a.length)]}function key(i){return `${i.cat}::${i.tag}`}function isPicked(i){return picked.some(p=>key(p)===key(i))}function poolByMode(m){if(m==="mixed")return activeTags;if(m==="sfw")return activeTags.filter(t=>t.mode==="sfw"||t.mode==="mixed"||t.cat==="negative");if(m==="nsfw")return activeTags.filter(t=>t.mode==="nsfw"||t.mode==="mixed"||t.cat==="negative");return activeTags}function weightedCategory(m){const cats=CATEGORY_ORDER.filter(c=>poolByMode(m).some(t=>t.cat===c));const w=cats.map(c=>{let base=c==="negative"?.65:c==="quality"?.75:c==="danbooru_general"?.35:1;return base*Math.max(.15,categoryDebt[c]||1)});let r=Math.random()*w.reduce((a,b)=>a+b,0);for(let i=0;i<cats.length;i++){r-=w[i];if(r<=0)return cats[i]}return cats[0]}function getPoolForCat(cat,mode,seen){let p=poolByMode(mode).filter(t=>t.cat===cat&&!seen.has(t.tag)&&!recentTags.includes(t.tag));if(!p.length)p=poolByMode(mode).filter(t=>t.cat===cat&&!seen.has(t.tag));return p}function generateCards(){const st=$("#card-stage"),cnt=Math.max(8,Math.min(80,Number($("#card-count").value||20))),mode=$("#card-mode").value,chosen=[],seen=new Set(),appeared=new Set();let guaranteed=["quality","hair","eyes","expression","clothing","pose","camera","composition","lighting","background","negative"];if(mode==="sfw")guaranteed.push("action_sfw");else if(mode==="nsfw")guaranteed.push("action_nsfw","rating");else guaranteed.push("action_sfw","action_nsfw","rating");for(const cat of guaranteed){if(chosen.length>=cnt)break;const pool=getPoolForCat(cat,mode,seen);if(pool.length){const item=pickOne(pool);chosen.push(item);seen.add(item.tag);appeared.add(item.cat)}}while(chosen.length<cnt){let cat=weightedCategory(mode),pool=getPoolForCat(cat,mode,seen);if(!pool.length)pool=poolByMode(mode).filter(t=>!seen.has(t.tag)&&!recentTags.includes(t.tag));if(!pool.length)pool=poolByMode(mode).filter(t=>!seen.has(t.tag));const item=pickOne(pool);if(!item)break;chosen.push(item);seen.add(item.tag);appeared.add(item.cat)}CATEGORY_ORDER.forEach(c=>{if(appeared.has(c))categoryDebt[c]=1;else categoryDebt[c]=Math.min(5,(categoryDebt[c]||1)+.45)});recentTags=[...chosen.map(x=>x.tag),...recentTags].slice(0,260);const w=st.clientWidth||1000,h=st.clientHeight||520;currentCards=chosen.map((it,i)=>({...it,id:key(it),x:Math.max(8,Math.random()*(w-240)),y:Math.max(8,Math.random()*(h-88)),rot:Number((Math.random()*30-15).toFixed(1)),hue:(colorMap[it.cat]??Math.floor(Math.random()*360))+Math.random()*28-14,z:i+1}));renderStage()}function fillCard(card,it){card.innerHTML="";let en=document.createElement("div");en.className="tag-en";en.textContent=it.tag;let zh=document.createElement("div");zh.className="tag-zh";zh.textContent=it.zh||"未翻译";let meta=document.createElement("div");meta.className="tag-meta";meta.textContent=`${CATEGORY_LABEL[it.cat]||it.cat} · ${(it.count||0).toLocaleString()}`;card.append(en,zh,meta)}function renderStage(){const st=$("#card-stage");st.innerHTML="";currentCards.filter(it=>!isPicked(it)).forEach(it=>{const c=document.createElement("div");c.className="tag-card";fillCard(c,it);c.style.left=it.x+"px";c.style.top=it.y+"px";c.style.zIndex=String(it.z||1);c.style.setProperty("--rot",`${it.rot||0}deg`);c.style.setProperty("--hue",`${it.hue||220}`);installDrag(c,it);st.appendChild(c)})}function installDrag(card,it){let sx=0,sy=0,ox=0,oy=0,moved=false,drag=false;card.addEventListener("mouseenter",()=>{it.z=++zCounter;card.style.zIndex=String(it.z)});card.addEventListener("pointerdown",e=>{e.preventDefault();drag=true;moved=false;sx=e.clientX;sy=e.clientY;ox=it.x;oy=it.y;it.homeX=ox;it.homeY=oy;it.z=++zCounter;card.style.zIndex=String(it.z);card.classList.add("dragging");card.setPointerCapture(e.pointerId)});card.addEventListener("pointermove",e=>{if(!drag)return;let dx=e.clientX-sx,dy=e.clientY-sy;if(Math.abs(dx)+Math.abs(dy)>4)moved=true;it.x=ox+dx;it.y=oy+dy;card.style.left=it.x+"px";card.style.top=it.y+"px";card.style.setProperty("--rot","0deg")});card.addEventListener("pointerup",e=>{if(!drag)return;drag=false;card.classList.remove("dragging");try{card.releasePointerCapture(e.pointerId)}catch{}const p=$(".picked-panel").getBoundingClientRect(),drop=e.clientX>=p.left&&e.clientX<=p.right&&e.clientY>=p.top&&e.clientY<=p.bottom;if(!moved||drop){addPicked(it);return}const st=$("#card-stage"),mx=Math.max(8,st.clientWidth-card.offsetWidth-8),my=Math.max(8,st.clientHeight-card.offsetHeight-8);it.x=Math.min(mx,Math.max(8,it.x));it.y=Math.min(my,Math.max(8,it.y));it.rot=Number((Math.random()*24-12).toFixed(1));card.style.left=it.x+"px";card.style.top=it.y+"px";card.style.setProperty("--rot",`${it.rot}deg`)})}function clampToStagePos(x,y){
 const st=$("#card-stage");
 const maxX=Math.max(8,(st?.clientWidth||900)-240);
 const maxY=Math.max(8,(st?.clientHeight||520)-88);
 return {x:Math.min(maxX,Math.max(8,x)),y:Math.min(maxY,Math.max(8,y))};
}
function addPicked(it){
 if(!picked.some(p=>key(p)===key(it))){
  const pos=clampToStagePos(Number.isFinite(it.homeX)?it.homeX:it.x,Number.isFinite(it.homeY)?it.homeY:it.y);
  it.returnX=pos.x; it.returnY=pos.y;
  it.x=pos.x; it.y=pos.y; it.rot=Number((Math.random()*24-12).toFixed(1)); it.z=++zCounter;
  picked.push({...it,rot:0,returnX:pos.x,returnY:pos.y});
  renderPicked();renderStage();toast(`已加入：${it.tag}`);
 }
}function renderPicked(){const w=$("#picked-groups");w.innerHTML="";if(!picked.length){w.innerHTML='<div class="empty">还没有收集卡片。</div>';return}CATEGORY_ORDER.forEach(cat=>{const arr=picked.filter(p=>p.cat===cat);if(!arr.length)return;const g=document.createElement("div");g.className="picked-group";g.innerHTML=`<h3>${CATEGORY_LABEL[cat]||cat}</h3>`;arr.forEach(it=>{const c=document.createElement("button");c.className="tag-card picked";c.style.setProperty("--rot","0deg");c.style.setProperty("--hue",`${it.hue||colorMap[it.cat]||220}`);fillCard(c,it);c.onclick=()=>{picked=picked.filter(p=>key(p)!==key(it));const back=currentCards.find(x=>key(x)===key(it));if(back){const pos=clampToStagePos(Number.isFinite(it.returnX)?it.returnX:back.x,Number.isFinite(it.returnY)?it.returnY:back.y);back.x=pos.x;back.y=pos.y;back.rot=Number((Math.random()*30-15).toFixed(1));back.z=++zCounter;}renderPicked();renderStage();toast(`已移回：${it.tag}`)};g.appendChild(c)});w.appendChild(g)})}function exportPicked(){let arr=[];CATEGORY_ORDER.forEach(cat=>picked.filter(p=>p.cat===cat).forEach(p=>arr.push(p.tag)));const t=arr.join(", ");$("#export-output").value=t;return t}async function copyText(t){try{await navigator.clipboard.writeText(t);toast("已复制")}catch{toast("复制失败，可以手动复制")}}function setupTabs(){$$(".tab").forEach(b=>b.onclick=()=>{$$(".tab").forEach(x=>x.classList.remove("active"));$$(".page").forEach(x=>x.classList.remove("active"));b.classList.add("active");$("#"+b.dataset.page).classList.add("active")})}
/* v1.4 第二页：固定控制池 + 动态大池
   目标：
   1. 不再只有几百个手写 tags 可供第二页使用。
   2. 直接复用本地 tags.js 的大量内容，令第二页候选池扩展到 2000+ 以上。
   3. 页面显示当前第二页候选池数量，方便核对。
*/

let generatorRecent = [];
let SECOND_PAGE_POOL_CACHE = null;

function shuffleArray(arr){
 const a=[...arr];
 for(let i=a.length-1;i>0;i--){
  const j=Math.floor(Math.random()*(i+1));
  [a[i],a[j]]=[a[j],a[i]];
 }
 return a;
}
function randomChance(p){ return Math.random() < p; }
function compactPrompt(parts){
 return [...new Set(parts.filter(Boolean).map(x=>String(x).trim()).filter(Boolean))]
  .join(", ")
  .replace(/,\s*,/g,", ")
  .replace(/\s+/g," ")
  .trim();
}
function drawItems(pool,n,used=new Set()){
 let p=pool.filter(x=>!used.has(x.tag||x)&&!generatorRecent.includes(x.tag||x));
 if(!p.length) p=pool.filter(x=>!used.has(x.tag||x));
 if(!p.length) return [];
 const out=[];
 for(let i=0;i<n&&p.length;i++){
  const j=Math.floor(Math.random()*p.length);
  const item=p.splice(j,1)[0];
  used.add(item.tag||item);
  out.push(item);
 }
 return out;
}
function drawFromExternal(pool,n,used){ return drawItems(pool,n,used); }
function tags(arr){ return arr.map(x=>x.tag||x); }
function zhs(arr){ return arr.map(x=>x.zh||x.tag||x); }
function uniqTags(list){
 const seen=new Set(), out=[];
 for(const item of list){
  const key=item.tag||item;
  if(!seen.has(key)){
   seen.add(key);
   out.push(item);
  }
 }
 return out;
}
function activeByCat(cat, mode=null){
 return activeTags.filter(t=>{
  if(t.cat!==cat) return false;
  if(mode==="sfw" && t.mode==="nsfw") return false;
  if(mode==="nsfw" && t.mode==="sfw") return false;
  return true;
 }).map(t=>({tag:t.tag, zh:t.zh||t.tag, mode:t.mode||"both", cat:t.cat}));
}
function buildSecondPagePools(){
 if(SECOND_PAGE_POOL_CACHE) return SECOND_PAGE_POOL_CACHE;

 const dyn = {
  species: activeByCat("species"),
  body: activeByCat("body"),
  hair: activeByCat("hair"),
  eyes: activeByCat("eyes"),
  face: activeByCat("face"),
  clothing: activeByCat("clothing"),
  accessory: activeByCat("accessory"),
  background: activeByCat("background"),
  pose: activeByCat("pose"),
  expression: activeByCat("expression")
 };

 const SFW_EXPRESSION_GROUPS = [
  [{tag:"gentle smile",zh:"温柔微笑"},{tag:"soft smile",zh:"柔和微笑"},{tag:"calm smile",zh:"平静微笑"}],
  [{tag:"bright smile",zh:"明亮笑容"},{tag:"happy smile",zh:"开心笑"},{tag:"cheerful expression",zh:"开朗表情"}],
  [{tag:"curious expression",zh:"好奇表情"},{tag:"surprised expression",zh:"惊讶表情"},{tag:"wide-eyed look",zh:"睁大眼"}],
  [{tag:"shy smile",zh:"害羞笑"},{tag:"slight blush",zh:"微微脸红"},{tag:"embarrassed smile",zh:"害羞微笑"}],
  [{tag:"sleepy expression",zh:"困倦表情"},{tag:"relaxed expression",zh:"放松表情"},{tag:"lazy smile",zh:"懒洋洋的笑"}],
  [{tag:"serious expression",zh:"认真表情"},{tag:"focused eyes",zh:"专注眼神"},{tag:"quiet expression",zh:"安静表情"}],
  [{tag:"pouting",zh:"鼓脸"},{tag:"annoyed but cute",zh:"有点不满但可爱"},{tag:"side glance",zh:"侧目"}],
  [{tag:"natural expression",zh:"自然表情"},{tag:"looking at viewer",zh:"看向观众"},{tag:"soft eyes",zh:"柔和眼神"}]
 ];
 const NSFW_EXPRESSION_GROUPS = [
  [{tag:"flushed face",zh:"脸红"},{tag:"embarrassed expression",zh:"害羞表情"},{tag:"averted eyes",zh:"移开视线"}],
  [{tag:"teary eyes",zh:"泪眼"},{tag:"open mouth",zh:"张嘴"},{tag:"heavy breathing",zh:"喘息"}],
  [{tag:"dazed expression",zh:"迷离表情"},{tag:"half-closed eyes",zh:"半闭眼"},{tag:"relaxed mouth",zh:"嘴唇放松"}],
  [{tag:"gentle loving expression",zh:"温柔爱意表情"},{tag:"soft smile",zh:"柔和微笑"},{tag:"affectionate gaze",zh:"宠溺视线"}],
  [{tag:"surprised pleasure",zh:"惊讶快感"},{tag:"wide eyes",zh:"睁大眼"},{tag:"slight drool",zh:"少量口水"}],
  [{tag:"proud expression",zh:"骄傲表情"},{tag:"confident smile",zh:"自信笑"},{tag:"looking down at viewer",zh:"低头看向观众"}],
  [{tag:"overwhelmed expression",zh:"被快感淹没"},{tag:"trembling lips",zh:"嘴唇发颤"},{tag:"wet eyes",zh:"湿润眼睛"}],
  [{tag:"satisfied expression",zh:"满足表情"},{tag:"messy hair",zh:"凌乱头发"},{tag:"afterglow",zh:"事后余韵"}]
 ];

 const SAFE_SFW_ACTION_TAGS = [
  {tag:"walking forward while looking back",zh:"边走边回头"},
  {tag:"running toward viewer, hair flying",zh:"向镜头奔跑"},
  {tag:"jumping lightly, skirt and hair floating",zh:"轻盈跳起"},
  {tag:"dancing in place, one hand raised",zh:"原地起舞"},
  {tag:"reaching toward viewer, fingers close to camera",zh:"向镜头伸手"},
  {tag:"turning around suddenly, hair swinging",zh:"突然转身"},
  {tag:"leaning forward curiously",zh:"好奇前倾"},
  {tag:"standing on tiptoe, reaching upward",zh:"踮脚伸手"},
  {tag:"sitting by window, looking outside",zh:"坐在窗边看外面"},
  {tag:"reading a book while glancing up",zh:"读书时抬眼"},
  {tag:"holding book close to chest",zh:"抱书在胸前"},
  {tag:"holding teacup with both hands",zh:"双手捧茶杯"},
  {tag:"adjusting glasses with a small smile",zh:"微笑扶眼镜"},
  {tag:"waving from across the room",zh:"隔着房间挥手"},
  {tag:"opening door and peeking inside",zh:"开门探身"},
  {tag:"looking through window, hand on glass",zh:"手贴玻璃看窗外"},
  {tag:"holding umbrella in the rain",zh:"雨中撑伞"},
  {tag:"holding flower near lips",zh:"把花举到唇边"},
  {tag:"cooking in kitchen, sleeves rolled up",zh:"厨房做饭"},
  {tag:"cleaning room with hair tied up",zh:"扎起头发打扫"},
  {tag:"playing instrument on stage",zh:"舞台演奏"},
  {tag:"casting spell, glowing particles around hand",zh:"施法粒子环绕"},
  {tag:"walking upside down in surreal gravity",zh:"超现实重力倒着走"},
  {tag:"fixing hair in front of mirror",zh:"镜前整理头发"},
  {tag:"adjusting clothes, looking away",zh:"移开视线整理衣服"},
  {tag:"putting on glasses, close-up",zh:"戴眼镜近景"},
  {tag:"taking off jacket, shoulder exposed",zh:"脱外套露肩"},
  {tag:"stretching after waking up",zh:"睡醒伸懒腰"},
  {tag:"lying on bed, reaching toward viewer",zh:"床上伸手"},
  {tag:"kneeling on floor, picking something up",zh:"跪地捡东西"},
  {tag:"opening curtains into sunlight",zh:"拉开窗帘迎光"},
  {tag:"holding phone and laughing",zh:"拿手机笑"},
  {tag:"eating dessert with bright eyes",zh:"开心吃甜点"},
  {tag:"drinking tea in a quiet room",zh:"安静房间喝茶"},
  {tag:"waking up under warm light",zh:"暖光下醒来"},
  {tag:"looking in mirror, reflected face visible",zh:"照镜子有倒影"},
  {tag:"running through rain, wet hair",zh:"雨中奔跑湿发"},
  {tag:"standing in strong wind, clothes fluttering",zh:"强风中站立"},
  {tag:"sitting on railing, looking down",zh:"坐在栏杆上俯看"},
  {tag:"stepping over puddle, dynamic pose",zh:"跨过水洼"},
  {tag:"catching falling petals with both hands",zh:"双手接花瓣"},
  {tag:"leaning on desk, playful tilt",zh:"靠桌歪头"},
  {tag:"opening a locker door",zh:"打开柜门"},
  {tag:"walking with shopping bag",zh:"拎购物袋走路"},
  {tag:"riding bicycle past camera",zh:"骑车掠过镜头"},
  {tag:"standing by vending machine",zh:"站在自动贩卖机旁"},
  {tag:"looking over shoulder while climbing stairs",zh:"上楼回头"},
  {tag:"resting chin on hand at desk",zh:"托腮坐桌前"},
  {tag:"holding a letter close to chest",zh:"把信贴在胸前"},
  {tag:"brushing hair with one hand",zh:"单手理发"},
  {tag:"opening refrigerator door at night",zh:"夜里开冰箱"},
  {tag:"watching fireworks from balcony",zh:"阳台看烟花"},
  {tag:"splashing water playfully",zh:"泼水玩闹"},
  {tag:"walking barefoot across room",zh:"赤脚走过房间"},
  {tag:"sitting on windowsill",zh:"坐在窗台"},
  {tag:"covering mouth while laughing",zh:"捂嘴笑"},
  {tag:"reading under blanket light",zh:"被窝灯下看书"}
 ];

 const EXCLUSIVE_NSFW_ACTIONS = [
  {tag:"missionary position, vaginal sex, penis inside pussy, female lying on back, male on top, viewer above her", zh:"正常位", pose:"female lying on back, legs spread, hips on bed, male on top, top-down pressure, not straddling"},
  {tag:"missionary position, legs on shoulders, vaginal sex, penis inside pussy, female lying on back, male on top", zh:"腿架肩正常位", pose:"female lying on back, legs on shoulders, knees near chest, male above her, deep angle"},
  {tag:"cowgirl position, vaginal sex, penis inside pussy, woman straddling viewer, woman on top", zh:"骑乘位", pose:"woman on top, straddling viewer, hips above pelvis, looking down"},
  {tag:"reverse cowgirl, vaginal sex, penis inside pussy, woman on top facing away", zh:"反骑乘", pose:"woman on top, back toward viewer, looking back over shoulder"},
  {tag:"doggystyle, vaginal sex from behind, penis inside pussy, woman on hands and knees, male behind", zh:"后入位", pose:"on all fours, hips raised, male behind, looking back over shoulder"},
  {tag:"side entry sex, vaginal sex from side, penis inside pussy, both bodies lying sideways", zh:"侧入位", pose:"side lying position, one leg raised, bodies parallel from side"},
  {tag:"breeding press, mating press, vaginal sex, penis fully inside pussy, female lying on back, knees pressed to chest, male on top", zh:"种付位", pose:"female lying on back, legs folded up, knees pressed to chest, male on top, bodies pressed close, not cowgirl"},
  {tag:"lifted sex, vaginal sex, penis fully inside pussy, woman held in the air", zh:"抱起插入", pose:"lifted pose, legs wrapped around waist, partner holding thighs and back"},
  {tag:"wall sex, vaginal sex, penis inside pussy, woman pressed against wall", zh:"墙边插入", pose:"pressed against wall, one leg raised, back against wall"},
  {tag:"sitting on partner's lap, vaginal sex, penis inside pussy, close embrace", zh:"膝上插入", pose:"sitting on partner's lap, arms around neck, close body contact"},
  {tag:"bent over desk, doggystyle, vaginal sex from behind, male behind", zh:"桌边后入", pose:"bent over desk, hands on table, hips raised"},
  {tag:"mirror sex, vaginal sex from behind, male behind, mirror reflection visible", zh:"镜前后入", pose:"hands on sink, looking at mirror reflection, male behind"},
  {tag:"blowjob, oral sex, penis in mouth, kneeling close to partner", zh:"口交", pose:"kneeling close to partner, looking up, mouth occupied"},
  {tag:"deepthroat, oral sex, penis in mouth, throat bulge", zh:"深喉", pose:"kneeling, head tilted back, wet eyes"},
  {tag:"handjob, female hand on penis, close-up service", zh:"手交", pose:"sitting or kneeling close to partner, hand on shaft"},
  {tag:"thighjob, penis between thighs, thighs pressed together", zh:"素股", pose:"thighs pressed together, knees close, low angle"},
  {tag:"breastjob, penis between breasts, hands pressing breasts together", zh:"乳交", pose:"upper body close-up, breasts pressed together"},
  {tag:"footjob, penis between feet, bare feet close to camera", zh:"足交", pose:"bare feet foreground, soles framing shaft"},
  {tag:"lactation, breast milk, handjob, milk dripping onto shaft", zh:"授乳手交", pose:"one hand on breast, one hand stroking shaft, milk dripping"},
  {tag:"cum shower, cum on face, cum on body, kneeling", zh:"精子浴", pose:"kneeling, face tilted upward"},
  {tag:"after sex, creampie, cum dripping, lying on bed", zh:"中出事后", pose:"lying on bed, legs slightly spread, exhausted satisfied expression"},
  {tag:"cum on tongue, oral sex aftermath, tongue out", zh:"口部事后", pose:"kneeling, tongue out, looking up"},
  {tag:"public sex, consensual exhibitionism, hidden-in-plain-sight", zh:"公开调教", pose:"partly hidden in dim corridor, nervous glance"},
  {tag:"fingering, hand between thighs, sitting with legs parted", zh:"指交", pose:"sitting with legs parted, hand between thighs"},
  {tag:"masturbation, hand between thighs, lying on bed", zh:"自慰", pose:"lying or sitting with one hand between thighs"},
  {tag:"standing sex, vaginal sex, penis inside pussy, one leg lifted", zh:"站立插入", pose:"standing pose, one leg lifted, body pressed close"},
  {tag:"bed edge sex, vaginal sex, penis deep inside pussy, hips lifted", zh:"床边插入", pose:"lying on bed edge, hips lifted, partner standing at edge"},
  {tag:"shower sex, wet body, steam, vaginal sex", zh:"淋浴间做爱", pose:"standing in shower steam, wet body, hands on wall"},
  {tag:"pinned down on floor, vaginal sex, wrists held down", zh:"地板压制", pose:"pinned down on floor, wrists held down, male above"},
  {tag:"spitroast, one boy in front, one boy behind, consensual group sex", zh:"前后夹击", pose:"one partner in front, one partner behind"},
  {tag:"double penetration, consensual group sex", zh:"双穴插入", pose:"two partners involved, clearly group composition"},
  {tag:"two boys servicing one girl, consensual group sex", zh:"双人侍奉", pose:"two partners surrounding the girl"}
 ];

 const NSFW_SUPPORT_TAGS = [
  {tag:"arched back",zh:"弓起后背"},{tag:"toes curled",zh:"脚趾蜷起"},{tag:"legs trembling",zh:"双腿发颤"},
  {tag:"body trembling",zh:"身体发抖"},{tag:"messy hair",zh:"凌乱头发"},{tag:"slight drool",zh:"少量口水"},
  {tag:"sweat",zh:"汗"},{tag:"wet skin",zh:"湿润皮肤"},{tag:"disheveled clothes",zh:"凌乱衣服"},
  {tag:"skirt flipped up",zh:"裙子翻起"},{tag:"shirt partly open",zh:"衣服半开"},{tag:"bra strap slipping",zh:"肩带滑落"},
  {tag:"legs spread",zh:"双腿张开"},{tag:"hips lifted",zh:"抬胯"},{tag:"gripping sheets",zh:"抓紧床单"},
  {tag:"hands on thighs",zh:"手扶大腿"},{tag:"looking back over shoulder",zh:"回头看"},{tag:"face close-up",zh:"脸部近景"},
  {tag:"cum on thighs",zh:"大腿上的精液"},{tag:"cum on stomach",zh:"腹部精液"},{tag:"cum drip",zh:"液体滴落"},
  {tag:"panting",zh:"喘气"},{tag:"blushing intensely",zh:"强烈脸红"},{tag:"watery eyes",zh:"湿润眼睛"},
  {tag:"tongue slightly out",zh:"舌头微吐"},{tag:"saliva strand",zh:"唾液拉丝"},{tag:"nails digging into skin",zh:"指甲掐入皮肤"},
  {tag:"thigh squeeze",zh:"夹腿"},{tag:"hips bucking",zh:"扭腰顶胯"},{tag:"afterglow",zh:"事后余韵"},
  {tag:"soft moaning expression",zh:"低吟表情"},{tag:"breasts pressed together",zh:"胸部被挤压"},{tag:"underboob",zh:"下乳露出"},
  {tag:"sideboob",zh:"侧乳"},{tag:"collarbone visible",zh:"锁骨可见"},{tag:"back arch",zh:"身体后仰"},
  {tag:"bedroom intimacy",zh:"卧室亲密氛围"},{tag:"close embrace",zh:"贴身拥抱"},{tag:"limp posture",zh:"发软姿态"},
  {tag:"fingers digging into partner",zh:"手指抓住对方"},{tag:"half-lidded eyes",zh:"半睁眼"},{tag:"wet lips",zh:"湿润嘴唇"}
 ];

 const EXTRA_SCENE_TAGS = [
  {tag:"dreamlike corridor",zh:"梦境长廊"},{tag:"rainy window room",zh:"雨天窗边房间"},{tag:"moonlit shrine corridor",zh:"月下神社走廊"},
  {tag:"night festival street",zh:"夜晚祭典街道"},{tag:"quiet library",zh:"安静图书馆"},{tag:"old wooden staircase",zh:"旧木楼梯"},
  {tag:"city apartment at night",zh:"夜晚城市公寓"},{tag:"warm bedroom",zh:"暖光卧室"},{tag:"messy bedroom",zh:"凌乱卧室"},
  {tag:"bathroom steam",zh:"浴室蒸汽"},{tag:"mirror room",zh:"镜屋"},{tag:"rooftop sunset",zh:"天台日落"},
  {tag:"flower field",zh:"花田"},{tag:"empty train platform",zh:"空电车站台"},{tag:"cafe corner",zh:"咖啡店角落"},
  {tag:"convenience store at night",zh:"夜晚便利店"},{tag:"giant aquarium tank",zh:"巨大水族箱"},{tag:"surreal sky",zh:"超现实天空"},
  {tag:"overgrown ruin garden",zh:"废墟花园"},{tag:"stage spotlight",zh:"舞台聚光灯"},{tag:"clock tower interior",zh:"钟楼内部"},
  {tag:"seaside railing",zh:"海边栏杆"},{tag:"dim corridor",zh:"昏暗走廊"},{tag:"soft bed with scattered petals",zh:"散落花瓣的床"},
  {tag:"tatami room",zh:"榻榻米房间"},{tag:"shrine room with lantern light",zh:"灯笼光神社房间"},{tag:"luxury hotel room",zh:"酒店房间"},
  {tag:"large city window",zh:"城市落地窗"},{tag:"empty classroom",zh:"空教室"},{tag:"wooden floor room",zh:"木地板房间"},
  {tag:"sunlit kitchen",zh:"阳光厨房"},{tag:"small balcony at night",zh:"夜晚小阳台"},{tag:"laundry room",zh:"洗衣房"},
  {tag:"old attic room",zh:"旧阁楼"},{tag:"train interior",zh:"电车内部"},{tag:"hotel bathroom",zh:"酒店浴室"},
  {tag:"backstage dressing room",zh:"后台更衣室"},{tag:"empty theater",zh:"空剧场"},{tag:"greenhouse full of flowers",zh:"温室花房"},
  {tag:"snowy street at night",zh:"雪夜街道"},{tag:"summer seaside deck",zh:"夏日海边甲板"},{tag:"dim storage room",zh:"昏暗储物间"},
  {tag:"traditional japanese room",zh:"和室"},{tag:"chinese-style bedroom",zh:"中式卧室"},{tag:"neon alley",zh:"霓虹小巷"},
  {tag:"school infirmary",zh:"校医室"},{tag:"private clinic room",zh:"私人诊室"},{tag:"bathhouse changing room",zh:"浴场更衣室"},
  {tag:"forest path with falling leaves",zh:"落叶森林小路"},{tag:"riverside under moonlight",zh:"月光河边"},{tag:"bookstore corner",zh:"书店角落"},
  {tag:"candlelit room",zh:"烛光房间"},{tag:"window seat on rainy day",zh:"雨日窗边座位"},{tag:"traditional courtyard",zh:"传统庭院"},
  {tag:"sakura path",zh:"樱花小径"},{tag:"lantern-lit festival booth",zh:"灯笼祭典摊位"},{tag:"classroom at dusk",zh:"黄昏教室"}
 ];

 const CAMERA_TAGS = [
  {tag:"close-up",zh:"近景"},{tag:"extreme close-up",zh:"极近特写"},{tag:"upper body",zh:"上半身"},{tag:"cowboy shot",zh:"中景"},
  {tag:"full body",zh:"全身"},{tag:"from above",zh:"俯视"},{tag:"low angle",zh:"低角度"},{tag:"worm's-eye view",zh:"仰视"},
  {tag:"dutch angle",zh:"荷兰角"},{tag:"side view",zh:"侧面"},{tag:"over-the-shoulder view",zh:"越肩视角"},
  {tag:"wide angle",zh:"广角"},{tag:"diagonal camera",zh:"斜向镜头"},{tag:"off-center camera",zh:"偏轴镜头"},
  {tag:"dynamic close-up",zh:"动态近景"},{tag:"intimate crop",zh:"亲密裁切"},{tag:"three-quarter view",zh:"三分之四视角"},
  {tag:"front view",zh:"正面视角"},{tag:"back view",zh:"背面视角"},{tag:"tilted horizon",zh:"倾斜地平线"},
  {tag:"near-lens hand",zh:"前景手部靠近镜头"},{tag:"foreground legs",zh:"前景腿部"},{tag:"depth-focused shot",zh:"景深镜头"},
  {tag:"center-framed face",zh:"居中脸部构图"},{tag:"cropped lower angle",zh:"下方裁切视角"},{tag:"shoulder-level view",zh:"肩部高度视角"}
 ];
 const NSFW_CAMERA_TAGS = [
  ...CAMERA_TAGS,
  {tag:"pov",zh:"第一人称"},{tag:"male pov",zh:"男性第一人称"},{tag:"between-legs perspective",zh:"腿间视角"},
  {tag:"body-level camera",zh:"身体高度镜头"},{tag:"bedside close-up",zh:"床边近景"},{tag:"thigh-level angle",zh:"大腿高度视角"},
  {tag:"from partner's chest level",zh:"从对方胸口高度"},{tag:"upskirt angle",zh:"裙底角度"}
 ];

 const COMPOSITION_TAGS = [
  {tag:"strong perspective",zh:"强透视"},{tag:"strong foreshortening",zh:"强短缩透视"},{tag:"extreme perspective",zh:"极端透视"},
  {tag:"dynamic composition",zh:"动感构图"},{tag:"cinematic crop",zh:"电影式裁切"},{tag:"high visual tension",zh:"高张力"},
  {tag:"diagonal composition",zh:"斜向构图"},{tag:"dramatic crop",zh:"戏剧裁切"},{tag:"depth of field",zh:"景深"},
  {tag:"motion blur",zh:"动态模糊"},{tag:"fisheye",zh:"鱼眼"},{tag:"portrait composition",zh:"竖图构图"},
  {tag:"asymmetrical composition",zh:"非对称构图"},{tag:"foreground hand",zh:"前景手部"},{tag:"strong silhouette",zh:"强剪影"},
  {tag:"center focus",zh:"主体聚焦"},{tag:"layered foreground and background",zh:"前后景层次"},{tag:"cropped limbs for impact",zh:"冲击性裁切"},
  {tag:"off-balance framing",zh:"失衡构图"},{tag:"sweeping motion arc",zh:"扫动弧线构图"},{tag:"close subject, distant background",zh:"近景主体远景背景"},
  {tag:"depth-heavy composition",zh:"纵深感构图"},{tag:"leaning horizon",zh:"倾斜地平线构图"},{tag:"compressed intimate framing",zh:"压缩式亲密构图"}
 ];
 const STRONG_TENSION_TAGS = [
  {tag:"extreme perspective",zh:"极端透视"},{tag:"strong foreshortening",zh:"强短缩透视"},{tag:"dynamic composition",zh:"动感构图"},
  {tag:"high visual tension",zh:"高张力"},{tag:"dramatic crop",zh:"戏剧裁切"},{tag:"dutch angle",zh:"荷兰角"},
  {tag:"diagonal camera",zh:"斜向镜头"},{tag:"close-up",zh:"近景"},{tag:"motion lines",zh:"运动线"},
  {tag:"speed distortion",zh:"高速变形"},{tag:"hair flowing",zh:"头发飘动"},{tag:"clothes fluttering",zh:"衣服飘动"},
  {tag:"lively movement",zh:"灵动动作"},{tag:"natural expression",zh:"自然表情"},{tag:"near-lens body parts",zh:"肢体贴近镜头"},
  {tag:"impactful framing",zh:"有冲击力的取景"},{tag:"aggressive cropping",zh:"大胆裁切"},{tag:"dynamic off-center framing",zh:"偏心动态构图"}
 ];
 const LIGHT_TAGS = [
  {tag:"atmospheric lighting",zh:"氛围光"},{tag:"dramatic lighting",zh:"戏剧光影"},{tag:"soft sunlight",zh:"柔和阳光"},
  {tag:"warm bedroom light",zh:"卧室暖光"},{tag:"moonlight",zh:"月光"},{tag:"candlelight",zh:"烛光"},
  {tag:"lantern light",zh:"灯笼光"},{tag:"neon light",zh:"霓虹光"},{tag:"high contrast shadows",zh:"高反差阴影"},
  {tag:"rim light",zh:"轮廓光"},{tag:"volumetric lighting",zh:"体积光"},{tag:"backlighting",zh:"逆光"},
  {tag:"window light",zh:"窗光"},{tag:"blue ambient light",zh:"蓝色环境光"},{tag:"soft rim lighting",zh:"柔和轮廓光"},
  {tag:"twilight lighting",zh:"暮光"},{tag:"golden hour lighting",zh:"黄金时刻光线"},{tag:"indoor ambient glow",zh:"室内环境微光"},
  {tag:"cool fluorescent light",zh:"冷色荧光灯"},{tag:"screen light",zh:"屏幕光"},{tag:"sunset backlight",zh:"日落逆光"},
  {tag:"rainy-day diffuse light",zh:"阴雨漫射光"},{tag:"morning light",zh:"清晨光线"}
 ];
 const EFFECT_TAGS = [
  {tag:"hair flowing",zh:"头发飘动"},{tag:"clothes fluttering",zh:"衣服飘动"},{tag:"floating petals",zh:"漂浮花瓣"},
  {tag:"glowing particles",zh:"发光粒子"},{tag:"sparkling particles",zh:"闪光粒子"},{tag:"motion lines",zh:"运动线"},
  {tag:"speed distortion",zh:"高速变形"},{tag:"wind",zh:"风"},{tag:"soft shadows",zh:"柔和阴影"},
  {tag:"steam",zh:"蒸汽"},{tag:"smoke",zh:"烟雾"},{tag:"mist",zh:"薄雾"},{tag:"sweat",zh:"汗"},
  {tag:"saliva droplets",zh:"口水飞沫"},{tag:"messy sheets",zh:"凌乱床单"},{tag:"floating dust",zh:"浮尘"},
  {tag:"water droplets",zh:"水滴"},{tag:"fabric folds",zh:"布料褶皱"},{tag:"hair strands",zh:"发丝"},
  {tag:"splash",zh:"飞溅"},{tag:"lens flare",zh:"镜头光斑"},{tag:"particle trail",zh:"粒子拖尾"},
  {tag:"petals in foreground",zh:"前景花瓣"},{tag:"rising steam",zh:"上升蒸汽"},{tag:"falling leaves",zh:"落叶"},
  {tag:"glimmering dust",zh:"闪光浮尘"},{tag:"sheet wrinkles",zh:"床单褶皱"},{tag:"fogged glass",zh:"起雾玻璃"},
  {tag:"wet footprints",zh:"湿脚印"},{tag:"water splash on skin",zh:"皮肤水花"} 
 ];

 const fixedFlat = uniqTags([
  ...SFW_EXPRESSION_GROUPS.flat(), ...NSFW_EXPRESSION_GROUPS.flat(),
  ...SAFE_SFW_ACTION_TAGS, ...EXCLUSIVE_NSFW_ACTIONS, ...NSFW_SUPPORT_TAGS,
  ...EXTRA_SCENE_TAGS, ...CAMERA_TAGS, ...NSFW_CAMERA_TAGS,
  ...COMPOSITION_TAGS, ...STRONG_TENSION_TAGS, ...LIGHT_TAGS, ...EFFECT_TAGS
 ]);

 const dynamicFlat = uniqTags([
  ...dyn.species, ...dyn.body, ...dyn.hair, ...dyn.eyes, ...dyn.face,
  ...dyn.clothing, ...dyn.accessory, ...dyn.background, ...dyn.pose, ...dyn.expression
 ]);

 const totalFlat = uniqTags([...dynamicFlat, ...fixedFlat]);

 SECOND_PAGE_POOL_CACHE = {
  dyn, fixedFlat,
  SFW_EXPRESSION_GROUPS, NSFW_EXPRESSION_GROUPS,
  SAFE_SFW_ACTION_TAGS, EXCLUSIVE_NSFW_ACTIONS, NSFW_SUPPORT_TAGS,
  EXTRA_SCENE_TAGS, CAMERA_TAGS, NSFW_CAMERA_TAGS,
  COMPOSITION_TAGS, STRONG_TENSION_TAGS, LIGHT_TAGS, EFFECT_TAGS,
  stats: {
   dynamic: dynamicFlat.length,
   fixed: fixedFlat.length,
   total: totalFlat.length,
   byCat: {
    species: dyn.species.length, body: dyn.body.length, hair: dyn.hair.length, eyes: dyn.eyes.length, face: dyn.face.length,
    clothing: dyn.clothing.length, accessory: dyn.accessory.length, background: dyn.background.length, pose: dyn.pose.length, expression: dyn.expression.length
   }
  }
 };
 return SECOND_PAGE_POOL_CACHE;
}

function drawModePool(pool, mode, n, used){
 return drawItems(pool.filter(t=>{
  if(mode==="sfw" && t.mode==="nsfw") return false;
  if(mode==="nsfw" && t.mode==="sfw") return false;
  return true;
 }), n, used);
}

function drawExpression(actual,used,pools){
 const group = randomChance(.6)
  ? drawFromExternal(actual==="sfw" ? pools.SFW_EXPRESSION_GROUPS : pools.NSFW_EXPRESSION_GROUPS,1,used)[0]
  : null;
 const fromGroup = group ? drawFromExternal(group, actual==="sfw"?2:3, used) : [];
 const extra = drawModePool(pools.dyn.expression, actual, actual==="sfw"?1:2, used);
 return tags([...fromGroup, ...extra]);
}
function partnerPrefix(actual,partnerMode){
 if(actual!=="nsfw") return ["1girl","solo","single focus","original character"];
 if(partnerMode==="1boy") return ["1girl","1boy","duo","original character"];
 if(partnerMode==="2boys") return ["1girl","2boys","threesome","consensual group sex","original character"];
 if(partnerMode==="group") return ["1girl","multiple boys","group sex","consensual group sex","original character"];
 return ["1girl","solo","single focus","original character"];
}
function makeRandomCharacter(mode,used,partnerMode,pools){
 const parts = partnerPrefix(mode,partnerMode);
 parts.push(...tags(drawModePool(pools.dyn.species,mode,randomChance(.45)?1:0,used)));
 parts.push(...tags(drawModePool(pools.dyn.body,mode,randomChance(.8)?2:1,used)));
 parts.push(...tags(drawModePool(pools.dyn.hair,mode,3,used)));
 parts.push(...tags(drawModePool(pools.dyn.eyes,mode,1,used)));
 parts.push(...tags(drawModePool(pools.dyn.face,mode,randomChance(.7)?2:1,used)));
 return parts;
}
function makeManualCharacter(base,mode,partnerMode="pov"){
 const b=base.trim();
 if(!b) return [];
 const prefix=[];
 if(!/\b1girl\b/.test(b)) prefix.push("1girl");
 if(mode==="nsfw"){
  if(partnerMode==="1boy"){
   if(!/\b1boy\b/.test(b)) prefix.push("1boy");
   if(!/\bduo\b/.test(b)) prefix.push("duo");
  }else if(partnerMode==="2boys"){
   if(!/\b2boys\b/.test(b)) prefix.push("2boys");
   if(!/\bthreesome\b/.test(b)) prefix.push("threesome");
   prefix.push("consensual group sex");
  }else if(partnerMode==="group"){
   if(!/\bmultiple boys\b/.test(b)) prefix.push("multiple boys");
   if(!/\bgroup sex\b/.test(b)) prefix.push("group sex");
   prefix.push("consensual group sex");
  }else{
   if(!/\bsolo\b/.test(b)) prefix.push("solo");
   prefix.push("single focus");
  }
 }else{
  if(!/\bsolo\b/.test(b)) prefix.push("solo");
  prefix.push("single focus");
 }
 return [...prefix,b];
}
function partnerVisibility(actual,partnerMode){
 if(actual!=="nsfw") return [];
 if(partnerMode==="1boy") return ["visible male partner","male body visible","male face partly visible","male arms holding her","male hands on her body","only one boy"];
 if(partnerMode==="2boys") return ["two visible male partners","two male bodies visible","male hands on her body","one boy in front, one boy behind","only two boys"];
 if(partnerMode==="group") return ["multiple visible male partners","several male bodies visible","multiple male hands","surrounded by men","no extra girls"];
 return [];
}
function drawClothing(actual,used,pools){
 return tags([
  ...drawModePool(pools.dyn.clothing,actual,actual==="sfw" ? (randomChance(.5)?3:4) : (randomChance(.5)?2:3),used),
  ...drawModePool(pools.dyn.accessory,actual,randomChance(.45)?2:1,used)
 ]);
}
function drawScene(actual,used,pools){
 return [
  ...drawModePool(pools.dyn.background,actual,actual==="sfw" ? (randomChance(.5)?2:3) : (randomChance(.55)?2:3),used),
  ...drawFromExternal(pools.EXTRA_SCENE_TAGS,randomChance(.65)?1:2,used)
 ];
}
function updateSecondPagePoolStats(){
 const el=$("#batch-pool-stats");
 if(!el) return;
 const pools=buildSecondPagePools();
 const c=pools.stats.byCat;
 el.textContent = `第二页候选池：总计 ${pools.stats.total} tags（动态 ${pools.stats.dynamic} + 固定 ${pools.stats.fixed}）。动态分类：species ${c.species} / body ${c.body} / hair ${c.hair} / eyes ${c.eyes} / face ${c.face} / clothing ${c.clothing} / accessory ${c.accessory} / background ${c.background} / pose ${c.pose} / expression ${c.expression}`;
}

function makePrompt(mode,char,partnerMode="pov",tensionMode="on",batchUsed=new Set()){
 const pools=buildSecondPagePools();
 const actual=mode==="mixed"?(Math.random()>.5?"sfw":"nsfw"):mode;
 const used=batchUsed;
 const base=char.trim();

 const quality=["masterpiece","best quality","very aesthetic","newest"];
 quality.forEach(x=>used.add(x));

 const characterParts = base ? makeManualCharacter(base,actual,partnerMode) : makeRandomCharacter(actual,used,partnerMode,pools);
 const characterRefine = [
  ...tags(drawModePool(pools.dyn.hair,actual,randomChance(.35)?1:0,used)),
  ...tags(drawModePool(pools.dyn.face,actual,randomChance(.5)?1:0,used)),
  ...tags(drawModePool(pools.dyn.body,actual,randomChance(.4)?1:0,used))
 ];
 const expressions = drawExpression(actual,used,pools);
 const clothing = drawClothing(actual,used,pools);

 let action=[], pose=[], cameraPool=pools.CAMERA_TAGS, rating=[], support=[];
 if(actual==="sfw"){
  action = drawFromExternal(pools.SAFE_SFW_ACTION_TAGS,randomChance(.45)?2:1,used);
  pose = tags(drawModePool(pools.dyn.pose,actual,randomChance(.5)?2:1,used));
  rating = ["sfw","no text"];
 }else{
  action = drawFromExternal(pools.EXCLUSIVE_NSFW_ACTIONS,1,used);
  pose = action.length ? [action[0].pose] : [];
  support = tags(drawFromExternal(pools.NSFW_SUPPORT_TAGS,randomChance(.5)?3:4,used));
  cameraPool = partnerMode==="pov" ? pools.NSFW_CAMERA_TAGS : pools.CAMERA_TAGS;
  rating = partnerMode==="pov"
    ? ["pov","male pov","explicit","uncensored","no text"]
    : ["explicit","uncensored","no text"];
 }

 const scene = drawScene(actual,used,pools);
 const camera = drawFromExternal(cameraPool,randomChance(.5)?2:3,used);
 const composition = drawFromExternal(pools.COMPOSITION_TAGS,randomChance(.5)?3:4,used);
 const lighting = drawFromExternal(pools.LIGHT_TAGS,randomChance(.5)?2:3,used);
 const effects = drawFromExternal(pools.EFFECT_TAGS,randomChance(.5)?2:4,used);
 const tension = tensionMode==="on" ? tags(drawFromExternal(pools.STRONG_TENSION_TAGS,5,used)) : [];

 const countGuard = actual==="nsfw"
  ? (partnerMode==="1boy"
     ? ["no extra characters","no multiple girls","only one boy","no crowd"]
     : partnerMode==="2boys"
       ? ["no extra characters","no multiple girls","only two boys","no crowd"]
       : partnerMode==="group"
         ? ["no extra girls","no crowd of girls"]
         : ["no extra characters","no multiple girls","no crowd"])
  : ["no extra characters","no multiple girls","no crowd"];

 const nsfwGuard = actual==="nsfw" ? ["single sex position","one pose only"] : [];

 const prompt=compactPrompt([
  ...characterParts,
  ...quality,
  ...characterRefine,
  ...expressions,
  ...clothing,
  ...partnerVisibility(actual,partnerMode),
  ...pose,
  ...support,
  ...tags(action),
  ...tags(scene),
  ...tags(camera),
  ...tags(composition),
  ...tags(lighting),
  ...tags(effects),
  ...tension,
  ...rating,
  ...countGuard,
  ...nsfwGuard
 ]);

 const actionZh=zhs(action).join(" + ");
 const sceneZh=zhs(scene).slice(0,4).join(" / ");
 const partnerZh = actual==="nsfw" ? ({pov:"POV","1boy":"1boy","2boys":"2boys",group:"3boys+"}[partnerMode]||"POV") : "单人";
 const tensionZh = tensionMode==="on" ? "强张力开启" : "强张力关闭";
 const charHint = actual==="nsfw"
  ? (base ? `使用手填主体，交互方模式为 ${partnerZh}` : `随机角色，交互方模式为 ${partnerZh}`)
  : (base ? "使用手填主体，并强制 1girl/solo" : "随机单人角色");
 const summary=`概要：${actual.toUpperCase()}，${charHint}，${tensionZh}，动作是「${actionZh}」，场景由「${sceneZh}」组合。`;

 generatorRecent=[
  ...characterRefine, ...expressions, ...clothing, ...support,
  ...tags(action),...tags(scene),...tags(camera),...tags(composition),...tags(lighting),...tags(effects),...tension,
  ...generatorRecent
 ].slice(0,1800);

 return {title:(actual==="sfw"?"SFW":"NSFW")+"｜"+(actionZh||"随机动作"),prompt,summary};
}

function renderBatch(){
 updateSecondPagePoolStats();
 const cnt=Math.max(1,Math.min(50,Number($("#batch-count").value||8)));
 const mode=$("#batch-mode").value;
 const char=$("#batch-character").value;
 const partnerMode=$("#batch-partner-mode") ? $("#batch-partner-mode").value : "pov";
 const tensionMode=$("#batch-tension-mode") ? $("#batch-tension-mode").value : "on";
 const wrap=$("#batch-results");
 wrap.innerHTML="";
 const batchUsed=new Set();
 for(let i=0;i<cnt;i++){
  const item=makePrompt(mode,char,partnerMode,tensionMode,batchUsed);
  const box=document.createElement("div");
  box.className="batch-item";
  box.innerHTML=`<h3>${i+1}. ${item.title}</h3><div class="summary">${item.summary}</div><textarea>${item.prompt}</textarea><button class="copy-one">复制这一条</button>`;
  box.querySelector(".copy-one").onclick=()=>copyText(box.querySelector("textarea").value);
  wrap.appendChild(box);
 }
}
function getBatchText(){
 return $$(".batch-item").map(box=>box.querySelector("h3").textContent.replace(/^\d+\.\s*/,"")+"\n"+box.querySelector(".summary").textContent+"\n\n"+box.querySelector("textarea").value).join("\n\n");
}
function downloadText(fn,t){
 const b=new Blob([t],{type:"text/plain;charset=utf-8"}),u=URL.createObjectURL(b),a=document.createElement("a");
 a.href=u;a.download=fn;a.click();URL.revokeObjectURL(u);
}
setTimeout(updateSecondPagePoolStats, 0);
function readFile(file){
 return new Promise((res,rej)=>{
  const r=new FileReader();
  r.onload=()=>res(r.result);
  r.onerror=rej;
  r.readAsDataURL(file);
 });
}

function compressImageDataUrl(dataUrl, maxW=960, maxH=640, quality=.78){
 return new Promise((resolve)=>{
  if(!dataUrl || !dataUrl.startsWith("data:image/")){
   resolve(dataUrl || "");
   return;
  }
  const img=new Image();
  img.onload=()=>{
   try{
    let w=img.naturalWidth || img.width;
    let h=img.naturalHeight || img.height;
    const scale=Math.min(1, maxW/w, maxH/h);
    w=Math.max(1, Math.round(w*scale));
    h=Math.max(1, Math.round(h*scale));
    const canvas=document.createElement("canvas");
    canvas.width=w;
    canvas.height=h;
    const ctx=canvas.getContext("2d");
    ctx.drawImage(img,0,0,w,h);
    resolve(canvas.toDataURL("image/jpeg", quality));
   }catch(e){
    console.warn("compress image failed", e);
    resolve(dataUrl);
   }
  };
  img.onerror=()=>resolve(dataUrl);
  img.src=dataUrl;
 });
}

async function readCompressedImage(file){
 if(!file) return "";
 const raw=await readFile(file);
 return await compressImageDataUrl(raw, 960, 640, .78);
}

function getStore(k){
 try{return JSON.parse(localStorage.getItem(k)||"[]")}
 catch{return[]}
}
function trySetStore(k,v){
 try{
  localStorage.setItem(k,JSON.stringify(v));
  return true;
 }catch(e){
  console.warn("localStorage save failed", e);
  return false;
 }
}
function setStore(k,v){
 localStorage.setItem(k,JSON.stringify(v));
}

async function compactOCImages(silent=false){
 const list=getStore("dpcl_oc_list");
 if(!list.length){
  if(!silent) toast("还没有 OC 可以压缩");
  return;
 }
 let changed=false;
 for(const item of list){
  if(item.image && item.image.length>280000){
   item.image=await compressImageDataUrl(item.image, 760, 520, .68);
   changed=true;
  }
 }
 if(changed){
  if(trySetStore("dpcl_oc_list",list)){
   renderOCList();
   if(!silent) toast("已压缩 OC 插图");
  }else{
   // 再压一轮更狠的兜底
   for(const item of list){
    if(item.image && item.image.length>120000){
     item.image=await compressImageDataUrl(item.image, 520, 360, .55);
    }
   }
   if(trySetStore("dpcl_oc_list",list)){
    renderOCList();
    if(!silent) toast("已强压缩 OC 插图");
   }else{
    if(!silent) toast("压缩后仍然超出浏览器本地存储上限");
   }
  }
 }else{
  if(!silent) toast("当前 OC 插图已经比较小");
 }
}

async function saveOC(){
 let name=$("#oc-name").value.trim(),
     note=$("#oc-note").value.trim(),
     prompt=$("#oc-prompt").value.trim(),
     file=$("#oc-image").files[0];

 if(!name||!prompt){
  toast("OC 名称和 prompt 不能为空");
  return;
 }

 let image="";
 if(file){
  toast("正在压缩插图...");
  image=await readCompressedImage(file);
 }

 let list=getStore("dpcl_oc_list");
 list.unshift({id:Date.now(),name,note,prompt,image});

 if(!trySetStore("dpcl_oc_list",list)){
  // 旧图可能已经把 localStorage 塞满：先压缩旧图，再重试当前保存。
  await compactOCImages(true);
  list=getStore("dpcl_oc_list");
  list.unshift({id:Date.now(),name,note,prompt,image});
  if(!trySetStore("dpcl_oc_list",list)){
   // 当前图也太大时再强压一次
   if(image){
    image=await compressImageDataUrl(image, 520, 360, .55);
   }
   list=getStore("dpcl_oc_list");
   list.unshift({id:Date.now(),name,note,prompt,image});
   if(!trySetStore("dpcl_oc_list",list)){
    toast("保存失败：浏览器本地存储满了，请点“压缩已存插图”或删除几张旧 OC 图");
    return;
   }
  }
 }

 $("#oc-name").value=$("#oc-note").value=$("#oc-prompt").value="";
 $("#oc-image").value="";
 renderOCList();
 toast("OC 已保存");
}

function renderOCList(){
 let w=$("#oc-list"),list=getStore("dpcl_oc_list");
 w.innerHTML="";
 if(!list.length){
  w.innerHTML='<div class="empty">还没有保存 OC。</div>';
  return;
 }
 list.forEach(it=>{
  let d=document.createElement("div");
  d.className="library-card";
  d.innerHTML=`<h3>${it.name}</h3><p>${it.note||""}</p>${it.image?`<img src="${it.image}"/>`:""}<textarea readonly>${it.prompt}</textarea><div class="library-actions"><button data-use>填入第二页</button><button data-copy>复制 prompt</button><button data-del>删除</button></div>`;
  d.querySelector("[data-use]").onclick=()=>{
   $("#batch-character").value=it.prompt;
   $('[data-page="page-generator"]').click();
   toast("已填入第二页");
  };
  d.querySelector("[data-copy]").onclick=()=>copyText(it.prompt);
  d.querySelector("[data-del]").onclick=()=>{
   setStore("dpcl_oc_list",list.filter(x=>x.id!==it.id));
   renderOCList();
  };
  w.appendChild(d);
 });
}
function saveArtist(){let name=$("#artist-name").value.trim(),note=$("#artist-note").value.trim(),content=$("#artist-content").value.trim();if(!name||!content){toast("名称和内容不能为空");return}let list=getStore("dpcl_artist_list");list.unshift({id:Date.now(),name,note,content});setStore("dpcl_artist_list",list);$("#artist-name").value=$("#artist-note").value=$("#artist-content").value="";renderArtistList();toast("画师串已保存")}function renderArtistList(){let w=$("#artist-list"),list=getStore("dpcl_artist_list");w.innerHTML="";if(!list.length){w.innerHTML='<div class="empty">还没有保存画师串。</div>';return}list.forEach(it=>{let d=document.createElement("div");d.className="library-card";d.innerHTML=`<h3>${it.name}</h3><p>${it.note||""}</p><textarea readonly>${it.content}</textarea><div class="library-actions"><button data-copy>复制</button><button data-del>删除</button></div>`;d.querySelector("[data-copy]").onclick=()=>copyText(it.content);d.querySelector("[data-del]").onclick=()=>{setStore("dpcl_artist_list",list.filter(x=>x.id!==it.id));renderArtistList()};w.appendChild(d)})}document.addEventListener("DOMContentLoaded",()=>{setupTabs();generateCards();renderPicked();renderBatch();renderOCList();renderArtistList();$("#refresh-cards").onclick=generateCards;$("#clear-picked").onclick=()=>{picked=[];renderPicked();renderStage();$("#export-output").value=""};$("#export-picked").onclick=()=>{exportPicked();toast("已导出")};$("#copy-picked").onclick=()=>copyText(exportPicked());$("#make-batch").onclick=renderBatch;$("#copy-batch").onclick=()=>copyText(getBatchText());$("#download-batch").onclick=()=>downloadText("batch_prompts.txt",getBatchText());$("#save-oc").onclick=saveOC; if($("#compress-oc-images")) $("#compress-oc-images").onclick=()=>compactOCImages(false); compactOCImages(true);$("#save-artist").onclick=saveArtist});


/* ===== v1.5.1 second-page prompt compactor ===== */
(function(){
  const KEEP_ALWAYS = new Set([
    "1girl","solo","pov","1boy","2boys","3boys","multiple boys",
    "sfw","nsfw","no text","uncensored","censored"
  ]);

  const QUALITY_GROUP = [
    /^masterpiece$/i,
    /^best quality$/i,
    /^very aesthetic$/i,
    /^newest$/i,
    /^highly detailed$/i,
    /^detailed wallpaper$/i,
    /^ultra-?detailed$/i,
    /^cg illustration$/i
  ];

  const CAMERA_GROUP = [
    /^close-?up$/i,
    /^upper body$/i,
    /^cowboy shot$/i,
    /^full body$/i,
    /^front view$/i,
    /^side view$/i,
    /^from above$/i,
    /^low angle$/i,
    /^high angle$/i,
    /^over-?the-?shoulder view$/i,
    /^dutch angle$/i,
    /^diagonal camera$/i,
    /^off-?center camera$/i
  ];

  const COMPOSITION_GROUP = [
    /^dynamic composition$/i,
    /^diagonal composition$/i,
    /^strong perspective$/i,
    /^extreme perspective$/i,
    /^strong foreshortening$/i,
    /^dramatic crop$/i,
    /^cinematic crop$/i
  ];

  const EFFECT_GROUP = [
    /^dramatic lighting$/i,
    /^atmospheric lighting$/i,
    /^cinematic lighting$/i,
    /^cinematic shadows$/i,
    /^high contrast shadows$/i,
    /^soft shadows$/i,
    /^moonlight$/i,
    /^soft sunlight$/i,
    /^glowing particles$/i,
    /^floating petals$/i,
    /^motion blur$/i,
    /^wind$/i,
    /^hair flowing$/i
  ];

  const LOW_PRIORITY = [
    /^very aesthetic$/i,
    /^newest$/i,
    /^highly detailed$/i,
    /^detailed wallpaper$/i,
    /^ultra-?detailed$/i,
    /^cg illustration$/i,
    /^dramatic lighting$/i,
    /^atmospheric lighting$/i,
    /^cinematic lighting$/i,
    /^cinematic shadows$/i,
    /^high contrast shadows$/i,
    /^soft shadows$/i,
    /^glowing particles$/i,
    /^floating petals$/i,
    /^motion blur$/i,
    /^wind$/i,
    /^hair flowing$/i,
    /^moonlight$/i,
    /^soft sunlight$/i,
    /^dreamy .*$/i,
    /^soft .* background$/i
  ];

  const MED_PRIORITY = [
    /^close-?up$/i,
    /^upper body$/i,
    /^cowboy shot$/i,
    /^front view$/i,
    /^side view$/i,
    /^from above$/i,
    /^low angle$/i,
    /^high angle$/i,
    /^over-?the-?shoulder view$/i,
    /^dutch angle$/i,
    /^diagonal camera$/i,
    /^off-?center camera$/i,
    /^dynamic composition$/i,
    /^diagonal composition$/i,
    /^strong perspective$/i,
    /^extreme perspective$/i,
    /^strong foreshortening$/i,
    /^dramatic crop$/i,
    /^cinematic crop$/i,
    /^natural expression$/i,
    /^soft smile$/i,
    /^playful smile$/i,
    /^confident smile$/i,
    /^mischievous smile$/i,
    /^sleepy expression$/i,
    /^sleepy smile$/i
  ];

  function matchesAny(tag, patterns){
    return patterns.some(rx => rx.test(tag));
  }

  function dedupeTags(tags){
    const out = [];
    const seen = new Set();
    tags.forEach(tag=>{
      const k = tag.toLowerCase();
      if(!seen.has(k)){
        seen.add(k);
        out.push(tag);
      }
    });
    return out;
  }

  function capGroup(tags, patterns, keepCount){
    const keep = [];
    let kept = 0;
    for(const tag of tags){
      if(matchesAny(tag, patterns)){
        if(kept < keepCount){
          keep.push(tag);
          kept += 1;
        }
      }else{
        keep.push(tag);
      }
    }
    return keep;
  }

  function compactPromptText(text){
    if(!text || typeof text !== "string") return text;

    let tags = text.split(",").map(s=>s.trim()).filter(Boolean);
    tags = dedupeTags(tags);

    // 太短就不动
    if(tags.length <= 26) return tags.join(", ");

    // 目标：整体压掉约 10-20 个词，但尽量不伤核心语义
    let target = tags.length;
    if(tags.length >= 46) target = tags.length - 18;
    else if(tags.length >= 40) target = tags.length - 16;
    else if(tags.length >= 34) target = tags.length - 14;
    else if(tags.length >= 30) target = tags.length - 10;

    // 保证不会压得太狠
    target = Math.max(target, 24);

    // 质量词只保留最多 3 个
    tags = capGroup(tags, QUALITY_GROUP, 3);
    // 镜头保留最多 2 个
    tags = capGroup(tags, CAMERA_GROUP, 2);
    // 构图保留最多 2 个
    tags = capGroup(tags, COMPOSITION_GROUP, 2);
    // 光影/效果保留最多 2 个
    tags = capGroup(tags, EFFECT_GROUP, 2);

    // 低优先级先删
    function removeByPatterns(tagsIn, patterns, targetLen){
      const out = [];
      for(const tag of tagsIn){
        if(out.length >= targetLen){
          continue
        }
        out.push(tag);
      }
      let current = out.slice();
      for(let i=current.length-1; i>=0 && current.length > targetLen; i--){
        const tag = current[i];
        if(KEEP_ALWAYS.has(tag.toLowerCase())) continue;
        if(matchesAny(tag, patterns)){
          current.splice(i,1);
        }
      }
      return current;
    }

    let current = tags.slice();

    // 如果还是过长，先砍低优先级
    if(current.length > target){
      for(let i=current.length-1; i>=0 && current.length > target; i--){
        const tag = current[i];
        if(KEEP_ALWAYS.has(tag.toLowerCase())) continue;
        if(matchesAny(tag, LOW_PRIORITY)){
          current.splice(i,1);
        }
      }
    }

    // 再砍中优先级
    if(current.length > target){
      for(let i=current.length-1; i>=0 && current.length > target; i--){
        const tag = current[i];
        if(KEEP_ALWAYS.has(tag.toLowerCase())) continue;
        if(matchesAny(tag, MED_PRIORITY)){
          current.splice(i,1);
        }
      }
    }

    // 如果仍然偏长，再砍很泛的风格补词，但尽量保留角色/动作/场景
    if(current.length > target){
      const genericWords = [
        /^beautiful .*$/i, /^detailed .*$/i, /^intense .*$/i, /^stylish .*$/i,
        /^cinematic .*$/i, /^soft .*$/i, /^dramatic .*$/i, /^dreamy .*$/i,
        /^gentle .*$/i, /^bright .*$/i
      ];
      for(let i=current.length-1; i>=0 && current.length > target; i--){
        const tag = current[i];
        if(KEEP_ALWAYS.has(tag.toLowerCase())) continue;
        if(matchesAny(tag, genericWords)){
          current.splice(i,1);
        }
      }
    }

    return current.join(", ");
  }

  function tryCompactTextarea(ta){
    if(!ta) return;
    const oldText = ("value" in ta ? ta.value : ta.textContent || "").trim();
    if(!oldText) return;

    const card = ta.closest("div");
    if(!card) return;

    // 只动第二页结果卡：需要附近存在“复制这一条”按钮
    const hasCopyBtn = Array.from(card.querySelectorAll("button")).some(btn => /复制这一条|copy/i.test((btn.textContent || "").trim()));
    if(!hasCopyBtn) return;

    const newText = compactPromptText(oldText);
    if(newText && newText !== oldText){
      if("value" in ta) ta.value = newText;
      else ta.textContent = newText;
      ta.dataset.compacted = "1";
    }
  }

  function compactSecondPageResults(root=document){
    root.querySelectorAll("textarea").forEach(tryCompactTextarea);
  }

  function interceptCopyButtons(){
    document.addEventListener("click", function(e){
      const btn = e.target.closest("button");
      if(!btn) return;
      if(!/复制这一条|copy/i.test((btn.textContent || "").trim())) return;

      const card = btn.closest("div");
      if(!card) return;
      const ta = card.querySelector("textarea");
      if(!ta) return;

      const newText = compactPromptText(("value" in ta ? ta.value : ta.textContent || "").trim());
      if("value" in ta) ta.value = newText;
      else ta.textContent = newText;

      if(navigator.clipboard && navigator.clipboard.writeText){
        navigator.clipboard.writeText(newText);
      }
      if(typeof toast === "function") toast("已复制精简版 prompt");
      e.preventDefault();
      e.stopImmediatePropagation();
    }, true);
  }

  function installCompactor(){
    compactSecondPageResults(document);

    const obs = new MutationObserver((mutations)=>{
      for(const m of mutations){
        for(const node of m.addedNodes){
          if(node && node.nodeType === 1){
            compactSecondPageResults(node);
          }
        }
      }
    });
    obs.observe(document.body, {childList:true, subtree:true});
    interceptCopyButtons();
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", installCompactor);
  }else{
    installCompactor();
  }

  // 兼容部分结果异步晚到的情况
  window.addEventListener("load", ()=>{
    setTimeout(()=>compactSecondPageResults(document), 300);
    setTimeout(()=>compactSecondPageResults(document), 900);
  });
})();



/* ===== v1.5.2 big-pool diversify + stronger compact ===== */
(function(){
  const V152_BIG_POOL = {"body": ["detailed wolf illustration", "wolf girl", "detailed summer girl", "detailed nurse illustration", "detailed cool girl", "demon girl", "athletic body", "detailed sporty girl", "detailed wolf girl", "detailed elegant mood", "detailed cat mood", "detailed chinese illustration", "detailed gothic mood", "detailed sporty illustration", "fox girl", "detailed casual girl", "detailed bunny illustration", "detailed chinese mood", "detailed fox illustration", "detailed chinese girl", "detailed autumn illustration", "detailed maid mood", "detailed cute illustration", "detailed beautiful girl", "narrow waist", "detailed japanese girl", "detailed idol mood", "detailed modern illustration", "angel girl", "detailed dragon mood", "multiple tails", "detailed modern mood", "detailed fox girl", "detailed gothic girl", "huge breasts", "detailed winter girl", "detailed spring mood", "detailed cool illustration", "detailed idol girl", "detailed nurse girl", "detailed summer illustration", "thick thighs", "sweat", "detailed winter illustration", "detailed demon girl", "detailed summer mood", "detailed angel mood", "medium breasts", "detailed angel illustration", "detailed cat girl", "detailed japanese illustration", "detailed idol illustration", "detailed witch mood", "detailed techwear illustration", "detailed demon illustration", "animal ears", "pale skin", "detailed techwear girl", "detailed winter mood", "detailed butler illustration", "detailed beautiful illustration", "detailed maid girl", "tail", "detailed elegant girl", "detailed cool mood", "detailed cat illustration", "horns", "small breasts", "detailed fox mood", "kemonomimi", "detailed butler mood", "detailed sporty mood", "detailed spring illustration", "detailed dragon illustration", "detailed casual mood", "detailed beautiful mood", "detailed angel girl", "detailed bunny mood", "large breasts", "detailed cute mood", "detailed wolf mood", "detailed spring girl", "detailed autumn girl", "detailed traditional girl", "detailed butler girl", "detailed traditional mood", "detailed fantasy girl", "fox ears", "detailed bunny girl", "detailed casual illustration", "detailed techwear mood", "detailed dragon girl", "dark skin", "wide hips", "detailed modern girl", "detailed witch illustration", "detailed witch girl", "highly detailed", "detailed nurse mood", "flat chest", "detailed japanese mood", "detailed demon mood", "detailed cute girl", "wings", "detailed fantasy illustration", "wolf ears", "cat girl", "curvy body", "detailed maid illustration", "dragon girl", "soft skin", "detailed traditional illustration", "detailed fantasy mood", "detailed gothic illustration", "bunny girl", "detailed elegant illustration", "detailed autumn mood"], "hair": ["stylish techwear hair", "dynamic winter hair", "detailed angel hair", "dark_twintails", "purple braid", "soft demon hair", "blonde bangs", "intense nurse hair", "intense techwear hair", "green_drill_hair", "stylish summer hair", "pale_braid", "blonde_bob_cut", "dark_braid", "purple hair", "silver_hair", "cinematic cool hair", "blonde braid", "autumn_hair", "intense autumn hair", "summer hair", "light_hair", "dramatic dragon hair", "detailed casual hair", "detailed winter hair", "bright casual hair", "fantasy hair", "bright wolf hair", "light_sidelocks", "gold_bangs", "dark chinese hair", "gold_drill_hair", "dynamic demon hair", "cinematic cute hair", "orange sidelocks", "dark cool hair", "beautiful hair", "purple bangs", "multicolored braid", "stylish sporty hair", "night_hair", "cinematic modern hair", "gentle techwear hair", "cinematic cat hair", "orange twintails", "cinematic spring hair", "soft cool hair", "intense bunny hair", "gold_twintails", "grey bangs", "intense idol hair", "teal twintails", "teal bangs", "gold ponytail", "light_bangs", "cool hair", "grey hair", "pale bob cut", "dramatic techwear hair", "brown_bangs", "aqua_bob_cut", "soft spring hair", "multicolored bangs", "black braid", "chinese_hair", "dark_bangs", "silver ponytail", "dramatic summer hair", "white_ponytail", "detailed butler hair", "black drill hair", "purple_drill_hair", "detailed cute hair", "grey_bangs", "black bob cut", "dramatic fantasy hair", "gold_braid", "stylish cat hair", "no bangs", "purple_ponytail", "silver_ponytail", "dark fox hair", "dreamy beautiful hair", "brown hair", "teal bob cut", "dynamic angel hair", "purple_bangs", "detailed spring hair", "dreamy chinese hair", "orange_braid", "silver drill hair", "stylish cool hair", "intense beautiful hair", "stylish idol hair", "soft fantasy hair", "cinematic butler hair", "pink bob cut", "purple drill hair", "cinematic techwear hair", "casual hair", "blue ponytail", "soft fox hair", "gentle dragon hair", "dark twintails", "multicolored_hair", "gentle summer hair", "dark_drill_hair", "intense dragon hair", "intense night hair", "dreamy butler hair", "orange bob cut", "pale braid", "gentle wolf hair", "angel hair", "orange_hair", "cinematic traditional hair", "dynamic bunny hair", "orange_ponytail", "pink_bob_cut", "dreamy wolf hair", "bright winter hair", "detailed sporty hair", "single braid", "pale ponytail", "detailed japanese hair", "dynamic nurse hair", "stylish night hair", "red_drill_hair", "detailed cat hair", "teal_braid", "demon hair", "orange_twintails", "blonde bob cut", "detailed fantasy hair", "dragon hair", "dreamy autumn hair", "white hair", "black_twintails", "purple_hair", "cinematic idol hair", "intense summer hair", "dreamy sporty hair", "red hair", "gentle maid hair", "purple_bob_cut", "yellow bangs", "blue twintails", "dark_ponytail", "gentle idol hair", "white braid", "black twintails", "yellow_hair", "detailed wolf hair", "dark dragon hair", "pale hair", "white_braid", "red_bob_cut", "red sidelocks", "pale_hair", "aqua_twintails", "dark bangs", "pink_bangs", "detailed dragon hair", "red_hair", "blue_ponytail", "dreamy modern hair", "pink twintails", "soft beautiful hair", "stylish chinese hair", "bright sporty hair", "detailed demon hair", "very long hair", "green_twintails", "dynamic casual hair", "bright gothic hair", "fox hair", "exposed forehead", "pink ponytail", "dreamy nurse hair", "blue braid", "silver sidelocks", "silver twintails", "dreamy witch hair", "stylish butler hair", "gentle cool hair", "multicolored bob cut", "orange hair", "butler_hair", "aqua_sidelocks", "soft night hair", "bright elegant hair", "pale_ponytail", "dark angel hair", "multicolored ponytail", "intense elegant hair", "dramatic angel hair", "dramatic winter hair", "soft elegant hair", "grey_drill_hair", "braid", "dynamic night hair", "bright dragon hair", "blue_braid", "stylish modern hair", "blonde_hair", "intense cool hair", "blonde_ponytail", "brown_twintails", "pale drill hair", "intense sporty hair", "intense fantasy hair", "grey ponytail", "blue drill hair", "white sidelocks", "cinematic elegant hair", "dreamy traditional hair", "gentle spring hair", "gentle demon hair", "dramatic beautiful hair", "silver_bangs", "bright cute hair", "detailed witch hair", "pale_twintails", "detailed maid hair", "stylish autumn hair", "dynamic fox hair", "summer_hair", "cinematic summer hair", "autumn hair", "white_sidelocks", "high ponytail", "angel_hair", "silver_twintails", "dark_bob_cut", "short hair", "grey sidelocks", "aqua hair", "multicolored_bob_cut", "yellow drill hair", "dark elegant hair", "dynamic modern hair", "white_drill_hair", "grey_ponytail", "dark beautiful hair", "wolf hair", "short wavy hair", "dynamic chinese hair", "green ponytail", "gentle sporty hair", "pale_bangs", "pale_sidelocks", "stylish nurse hair", "gentle japanese hair", "intense butler hair", "gothic hair", "bright angel hair", "cat_hair", "intense cat hair", "red_twintails", "stylish bunny hair", "pink bangs", "gentle fantasy hair", "bright nurse hair", "cinematic fantasy hair", "stylish maid hair", "dynamic traditional hair", "pale twintails", "soft chinese hair", "dreamy maid hair", "cool_hair", "orange drill hair", "gentle night hair", "pink_braid", "dark_sidelocks", "dynamic beautiful hair", "teal drill hair", "brown sidelocks", "multicolored_ponytail", "white bangs", "twintails", "detailed chinese hair", "purple bob cut", "dreamy demon hair", "aqua_ponytail", "bright modern hair", "black sidelocks", "white drill hair", "soft maid hair", "stylish demon hair", "aqua_bangs", "dynamic cat hair", "stylish elegant hair", "gold_bob_cut", "pink_hair", "dark demon hair", "dreamy fox hair", "cinematic autumn hair", "dynamic butler hair", "blonde sidelocks", "yellow_ponytail", "dramatic traditional hair", "soft idol hair", "intense traditional hair", "bright japanese hair", "dreamy techwear hair", "aqua_drill_hair", "soft butler hair", "detailed traditional hair", "traditional_hair", "gentle gothic hair", "yellow_braid", "yellow_drill_hair", "yellow_sidelocks", "brown_hair", "aqua ponytail", "dramatic wolf hair", "soft cute hair", "brown_bob_cut", "intense spring hair", "dynamic wolf hair", "gold hair", "white_bangs", "dark_hair", "dark butler hair", "dramatic bunny hair", "blue_bob_cut", "blonde hair", "green hair", "dark casual hair", "japanese hair", "bright cat hair", "brown_braid", "straight hair", "pale_bob_cut", "fox_hair", "wavy hair", "intense demon hair", "dynamic gothic hair", "dynamic maid hair", "blonde_twintails", "bright techwear hair", "soft autumn hair", "yellow bob cut", "detailed gothic hair", "dreamy angel hair", "multicolored hair", "purple_twintails", "detailed elegant hair", "purple ponytail", "dragon_hair", "green braid", "dreamy idol hair", "stylish casual hair", "dynamic elegant hair", "aqua_braid", "dreamy cool hair", "blue_drill_hair", "cinematic japanese hair", "pink_twintails", "chinese hair", "cinematic bunny hair", "detailed bunny hair", "gothic_hair", "blue bangs", "gentle cute hair", "yellow twintails", "intense cute hair", "brown_drill_hair", "dynamic cool hair", "dark techwear hair", "dark winter hair", "dark sidelocks", "intense modern hair", "dynamic cute hair", "soft wolf hair", "dramatic japanese hair", "detailed night hair", "intense witch hair", "silver bangs", "multicolored_twintails", "gentle witch hair", "light_braid", "idol_hair", "soft gothic hair", "dramatic modern hair", "stylish wolf hair", "medium hair", "black_bangs", "blonde_bangs", "wolf_hair", "silver_braid", "intense chinese hair", "stylish gothic hair", "soft summer hair", "grey_twintails", "purple_sidelocks", "silver_bob_cut", "red braid", "dark bob cut", "stylish japanese hair", "gentle nurse hair", "cinematic witch hair", "soft traditional hair", "dreamy cat hair", "bright fox hair", "long hair", "gold twintails", "dramatic nurse hair", "dark sporty hair", "witch hair", "pink hair", "red twintails", "detailed beautiful hair", "aqua drill hair", "detailed modern hair", "multicolored sidelocks", "grey_braid", "yellow_bob_cut", "dramatic cat hair", "cinematic casual hair", "blonde_braid", "dynamic summer hair", "gold_hair", "ponytail", "dreamy dragon hair", "silver_drill_hair", "black_bob_cut", "intense angel hair", "silver braid", "intense casual hair", "dark drill hair", "elegant_hair", "cute hair", "green_bob_cut", "dark ponytail", "elegant hair", "blue_bangs", "grey_hair", "aqua twintails", "soft witch hair", "brown twintails", "green bob cut", "orange ponytail", "hair over one eye", "blonde ponytail", "red_braid", "dreamy fantasy hair", "white_hair", "bright traditional hair", "pink_sidelocks", "stylish fantasy hair", "light_twintails", "bright night hair", "dreamy night hair", "green_ponytail", "soft nurse hair", "silver bob cut", "dreamy gothic hair", "multicolored drill hair", "multicolored twintails", "yellow_bangs", "red_sidelocks", "japanese_hair", "green bangs", "dramatic cute hair", "dramatic maid hair", "red bangs", "pink_drill_hair", "grey_sidelocks", "demon_hair", "stylish beautiful hair", "cinematic gothic hair", "multicolored_braid", "blue hair", "white_twintails", "pink sidelocks", "teal_bob_cut", "orange_bangs", "blue_hair", "orange_drill_hair", "intense gothic hair", "brown ponytail", "dreamy winter hair", "orange braid", "soft techwear hair", "dark traditional hair", "dark wolf hair", "teal_bangs", "yellow_twintails", "detailed cool hair", "blonde twintails", "techwear_hair", "cinematic angel hair", "cat hair", "witch_hair", "dynamic dragon hair", "bright beautiful hair", "grey twintails", "grey braid", "night hair", "green drill hair", "dark autumn hair", "blonde drill hair", "bright spring hair", "dark nurse hair", "gentle angel hair", "stylish cute hair", "white ponytail", "cinematic chinese hair", "dreamy spring hair", "gold bob cut", "dramatic butler hair", "bright witch hair", "silver_sidelocks", "traditional hair", "ahoge", "dark idol hair", "grey drill hair", "dramatic cool hair", "cinematic nurse hair", "idol hair", "gold sidelocks", "bright butler hair", "brown bob cut", "modern_hair", "purple twintails", "light_bob_cut", "spring_hair", "red ponytail", "spring hair", "multicolored_bangs", "dramatic casual hair", "maid_hair", "green_braid", "soft sporty hair", "gentle traditional hair", "light_ponytail", "pale sidelocks", "purple sidelocks", "gentle butler hair", "stylish winter hair", "detailed summer hair", "brown bangs", "green sidelocks", "intense japanese hair", "cute_hair", "yellow ponytail", "dramatic fox hair", "gentle elegant hair", "winter_hair", "cinematic sporty hair", "white_bob_cut", "orange_sidelocks", "bright summer hair", "sporty_hair", "blue bob cut", "butler hair", "pale_drill_hair", "gold bangs", "gentle casual hair", "soft dragon hair", "yellow hair", "detailed fox hair", "maid hair", "aqua braid", "black_sidelocks", "teal braid", "detailed techwear hair", "teal ponytail", "side-parted hair", "gentle autumn hair", "teal sidelocks", "cinematic dragon hair", "white twintails", "dreamy elegant hair", "teal_sidelocks", "gold_ponytail", "dramatic autumn hair", "soft angel hair", "dark cute hair", "beautiful_hair", "blue_twintails", "dramatic idol hair", "green_hair", "dark witch hair", "dramatic night hair", "dark japanese hair", "bright bunny hair", "blue sidelocks", "dynamic techwear hair", "dark cat hair", "teal_twintails", "dreamy summer hair", "brown_ponytail", "gold braid", "soft cat hair", "dynamic japanese hair", "dynamic spring hair", "teal_ponytail", "yellow sidelocks", "black hair", "dynamic idol hair", "dramatic witch hair", "detailed nurse hair", "black ponytail", "dark hair", "gentle modern hair", "cinematic winter hair", "grey bob cut", "yellow braid", "dramatic sporty hair", "dramatic gothic hair", "soft bunny hair", "dramatic spring hair", "red bob cut", "soft japanese hair", "sporty hair", "stylish dragon hair", "orange bangs", "stylish spring hair", "bunny_hair", "brown braid", "brown_sidelocks", "dark bunny hair", "dark gothic hair", "light twintails", "bright fantasy hair", "aqua bob cut", "grey_bob_cut", "white bob cut", "dreamy casual hair", "nurse_hair", "bright cool hair", "nurse hair", "dramatic demon hair", "gentle fox hair", "gentle beautiful hair", "light_drill_hair", "dynamic sporty hair", "stylish fox hair", "dark summer hair", "bright idol hair", "gold_sidelocks", "light braid", "bright chinese hair", "pink braid", "cinematic night hair", "dark braid", "aqua_hair", "cinematic wolf hair"], "face": ["dramatic maid smile", "cinematic maid expression", "dark demon eyes", "dreamy casual eyes", "dramatic butler eyes", "sporty_eyes", "soft japanese smile", "dark beautiful eyes", "intense winter smile", "intense maid expression", "bright night expression", "dark techwear expression", "dreamy spring eyes", "dark maid smile", "dramatic cute eyes", "dreamy cat expression", "soft butler eyes", "cinematic dragon eyes", "dark butler expression", "gentle fox eyes", "elegant eyes", "dark idol smile", "dreamy cool eyes", "detailed angel eyes", "dynamic dragon expression", "stylish gothic smile", "cinematic modern expression", "butler_smile", "dark fantasy expression", "techwear_eyes", "stylish summer smile", "cinematic techwear eyes", "detailed cat smile", "stylish maid expression", "brown eyelashes", "witch_expression", "intense chinese eyes", "detailed winter eyes", "light_eyelashes", "detailed dragon expression", "soft chinese expression", "gentle spring expression", "dynamic angel smile", "detailed demon smile", "intense japanese smile", "gentle dragon smile", "dramatic nurse eyes", "dreamy witch expression", "blue eyelashes", "dramatic fantasy expression", "cinematic cute eyes", "bright cute expression", "casual_expression", "dreamy autumn smile", "dreamy cat eyes", "dynamic japanese eyes", "soft cool smile", "cool_expression", "gentle idol eyes", "gentle bunny smile", "blush", "cinematic japanese eyes", "dark chinese expression", "bright modern expression", "gentle elegant expression", "gentle sporty smile", "intense sporty smile", "dreamy demon eyes", "dynamic techwear eyes", "soft spring smile", "dynamic cool smile", "gentle nurse eyes", "dark autumn expression", "dramatic angel expression", "cinematic witch smile", "gentle gothic expression", "intense idol smile", "dynamic nurse smile", "yellow pupils", "stylish nurse smile", "dynamic maid smile", "glasses", "pale_eyelashes", "stylish gothic expression", "techwear_expression", "intense summer smile", "stylish autumn smile", "detailed demon expression", "idol eyes", "traditional_expression", "cinematic winter eyes", "gentle japanese expression", "soft butler expression", "soft night eyes", "soft sporty smile", "black eyes", "dramatic bunny eyes", "soft elegant smile", "soft maid smile", "gentle cool expression", "dreamy techwear smile", "multicolored_eyelashes", "gentle butler eyes", "intense modern smile", "dramatic techwear smile", "bright night eyes", "stylish traditional eyes", "intense japanese eyes", "cat_eyes", "dark traditional smile", "detailed maid expression", "gentle cool smile", "cinematic beautiful eyes", "dramatic traditional smile", "dreamy beautiful eyes", "stylish cool expression", "cinematic sporty eyes", "butler_eyes", "bright sporty smile", "soft autumn eyes", "casual eyes", "detailed fox eyes", "stylish angel expression", "dark cute smile", "bright japanese smile", "dreamy dragon expression", "proud expression", "elegant expression", "dark japanese expression", "dynamic techwear expression", "bright demon expression", "spring_smile", "stylish bunny eyes", "cat_smile", "cinematic cute expression", "soft fox eyes", "dramatic wolf eyes", "detailed butler eyes", "dark gothic eyes", "dynamic night eyes", "yellow_eyes", "black_eyes", "crooked glasses", "bunny_smile", "dynamic fox smile", "dark cat expression", "bright angel eyes", "bright summer eyes", "gentle chinese eyes", "dramatic sporty smile", "soft gothic smile", "dramatic fox eyes", "green_eyes", "beautiful_expression", "stylish dragon smile", "stylish cat eyes", "gentle traditional eyes", "witch smile", "dark elegant expression", "soft wolf expression", "stylish angel eyes", "sleepy expression", "soft fox smile", "cinematic summer expression", "dramatic beautiful eyes", "dreamy fox smile", "soft casual expression", "gentle cat eyes", "detailed nurse smile", "dynamic cool eyes", "grey pupils", "dramatic angel eyes", "dynamic cute eyes", "intense modern eyes", "beautiful expression", "butler eyes", "dark wolf expression", "chinese eyes", "spring expression", "soft night expression", "intense nurse expression", "intense elegant smile", "soft elegant expression", "intense chinese expression", "soft cute eyes", "bright wolf expression", "silver_pupils", "dramatic butler expression", "cinematic dragon expression", "gothic expression", "gentle fantasy smile", "night_expression", "chinese_expression", "dynamic wolf eyes", "blue pupils", "soft beautiful smile", "dynamic fox expression", "cinematic gothic smile", "demon expression", "dynamic traditional smile", "elegant_eyes", "soft japanese expression", "soft spring eyes", "idol_expression", "stylish dragon eyes", "cinematic elegant eyes", "dynamic maid eyes", "detailed angel expression", "soft chinese smile", "gentle nurse smile", "cinematic cat expression", "cinematic angel smile", "gentle spring smile", "sporty_expression", "dynamic fantasy eyes", "bright beautiful smile", "bright maid eyes", "angel smile", "bright cool eyes", "dreamy beautiful smile", "dramatic winter expression", "gentle sporty expression", "gentle techwear expression", "intense dragon expression", "dark summer smile", "intense cute eyes", "intense maid eyes", "dynamic techwear smile", "dramatic night expression", "stylish witch eyes", "intense spring smile", "dark bunny eyes", "soft japanese eyes", "autumn_eyes", "soft angel expression", "dark fox expression", "dramatic cat eyes", "stylish fox smile", "dreamy fantasy eyes", "soft gothic expression", "bright fox expression", "detailed demon eyes", "dark cool eyes", "stylish chinese smile", "dramatic wolf expression", "dramatic summer smile", "cinematic autumn smile", "cinematic cute smile", "bright wolf smile", "soft summer smile", "detailed traditional smile", "red eyes", "dreamy demon smile", "gentle fox smile", "dynamic dragon smile", "gentle wolf eyes", "summer expression", "detailed wolf smile", "detailed japanese smile", "dark nurse smile", "stylish summer eyes", "intense gothic eyes", "black pupils", "bright techwear eyes", "stylish wolf eyes", "cinematic winter expression", "gentle witch expression", "dynamic idol eyes", "bright chinese smile", "cinematic beautiful expression", "soft gothic eyes", "dynamic spring eyes", "cinematic demon eyes", "bright spring smile", "detailed summer eyes", "teasing smile", "intense winter expression", "soft cat eyes", "yellow eyes", "bright witch eyes", "multicolored pupils", "stylish japanese expression", "dreamy witch smile", "detailed spring expression", "bright fox eyes", "pale eyes", "dramatic night smile", "intense fantasy expression", "white eyelashes", "cute eyes", "intense nurse eyes", "dynamic summer eyes", "fantasy smile", "dramatic dragon eyes", "dark demon expression", "grey eyes", "autumn_expression", "bright bunny smile", "cat eyes", "gentle beautiful eyes", "cinematic sporty smile", "intense spring expression", "sporty expression", "bright bunny eyes", "sporty smile", "bright dragon smile", "dark pupils", "detailed fantasy expression", "maid eyes", "soft witch expression", "casual smile", "gentle traditional expression", "dreamy idol smile", "soft idol eyes", "stylish casual eyes", "stylish elegant expression", "winter_smile", "gothic_smile", "bright winter smile", "gentle summer expression", "fox_eyes", "bright autumn expression", "light pupils", "detailed idol expression", "detailed sporty expression", "detailed butler smile", "dreamy sporty expression", "dramatic spring eyes", "dreamy angel eyes", "detailed wolf expression", "dark_pupils", "bright summer smile", "dark maid expression", "dark gothic expression", "cinematic demon smile", "stylish witch expression", "dynamic gothic expression", "witch eyes", "gothic smile", "intense wolf expression", "dreamy maid smile", "cinematic butler eyes", "cinematic fantasy eyes", "purple pupils", "dreamy bunny eyes", "soft winter eyes", "stylish night eyes", "dragon expression", "silver_eyelashes", "stylish winter smile", "dynamic cat eyes", "detailed elegant expression", "soft nurse eyes", "intense fantasy smile", "detailed cat expression", "soft modern eyes", "bright demon smile", "dreamy maid eyes", "aqua pupils", "purple_eyes", "bright wolf eyes", "dramatic chinese expression", "bright fantasy eyes", "dynamic idol expression", "orange eyes", "blonde eyes", "purple eyelashes", "stylish gothic eyes", "stylish summer expression", "dynamic autumn eyes", "dynamic angel expression", "dark sporty smile", "blonde pupils", "bright beautiful eyes", "intense cool eyes", "intense traditional smile", "dreamy bunny smile", "beautiful smile", "dark sporty eyes", "bright demon eyes", "brown_eyes", "dynamic night expression", "dark angel expression", "gentle angel expression", "dreamy cute eyes", "detailed techwear expression", "stylish japanese smile", "modern_eyes", "dramatic demon expression", "natural expression", "soft summer expression", "cinematic beautiful smile", "traditional smile", "autumn smile", "stylish traditional smile", "demon smile", "soft autumn expression", "detailed idol smile", "cute smile", "gentle autumn eyes", "white pupils", "gentle butler expression", "intense maid smile", "stylish demon smile", "teal eyelashes", "intense night smile", "soft fantasy eyes", "dreamy modern expression", "gold_eyelashes", "soft elegant eyes", "dynamic autumn expression", "green eyelashes", "detailed maid eyes", "dreamy autumn expression", "intense autumn smile", "dreamy butler eyes", "dark beautiful smile", "gentle elegant smile", "silver eyelashes", "demon eyes", "bright traditional eyes", "dynamic witch eyes", "soft wolf smile", "stylish cool eyes", "soft bunny smile", "intense demon smile", "intense angel smile", "bright butler eyes", "beautiful_smile", "cool eyes", "soft maid expression", "dark cute eyes", "orange_eyes", "dynamic modern smile", "night smile", "cinematic techwear smile", "dramatic modern eyes", "detailed spring smile", "wolf eyes", "cinematic angel eyes", "cinematic nurse expression", "round glasses", "dreamy witch eyes", "cute_smile", "stylish witch smile", "bright cat eyes", "gentle nurse expression", "stylish cute eyes", "intense casual expression", "gentle witch eyes", "soft beautiful expression", "dreamy casual expression", "dramatic witch smile", "dark winter eyes", "dramatic witch expression", "brown pupils", "dreamy spring smile", "dynamic elegant eyes", "intense beautiful eyes", "gentle demon smile", "dark beautiful expression", "intense fox smile", "gentle cat smile", "dark dragon eyes", "stylish night smile", "bright fantasy smile", "detailed witch smile", "bright idol expression", "intense summer eyes", "dreamy fantasy smile", "stylish spring smile", "dark traditional expression", "flushed face", "cinematic witch expression", "gentle angel smile", "gentle modern smile", "stylish spring eyes", "stylish cute smile", "gold_pupils", "dark fantasy smile", "dramatic cat smile", "detailed cute expression", "dark gothic smile", "gentle beautiful smile", "dreamy sporty smile", "stylish bunny smile", "dynamic sporty eyes", "brown_eyelashes", "intense cute expression", "detailed angel smile", "detailed casual expression", "dreamy summer eyes", "light_pupils", "spring_expression", "cinematic night smile", "purple_pupils", "dark fox eyes", "cinematic butler expression", "detailed night eyes", "bright fox smile", "dramatic cool expression", "detailed witch expression", "intense night expression", "stylish casual smile", "dark modern smile", "gentle casual eyes", "gentle chinese smile", "night_eyes", "pale_eyes", "stylish elegant smile", "cinematic bunny expression", "dark autumn eyes", "cinematic japanese smile", "angel_smile", "cinematic traditional smile", "stylish fantasy expression", "soft smile", "fox smile", "gentle maid smile", "stylish angel smile", "light eyes", "cinematic cool smile", "stylish winter eyes", "dynamic nurse eyes", "detailed dragon eyes", "dynamic witch smile", "gentle cat expression", "blank eyes", "cinematic bunny smile", "dreamy japanese eyes", "stylish techwear eyes", "dreamy chinese eyes", "soft chinese eyes", "fantasy_smile", "dreamy summer smile", "intense butler expression", "stylish maid smile", "teal_pupils", "dreamy techwear eyes", "intense fantasy eyes", "open mouth", "techwear_smile", "dreamy nurse eyes", "dynamic demon smile", "demon_expression", "bright chinese expression", "spring smile", "intense angel expression", "dramatic nurse smile", "dramatic witch eyes", "bright summer expression", "gentle autumn smile", "gold eyes", "dynamic traditional eyes", "winter_eyes", "stylish modern smile", "nurse smile", "gentle elegant eyes", "stylish cat expression", "white_eyes", "multicolored eyes", "detailed nurse eyes", "dynamic sporty expression", "yellow_pupils", "detailed sporty smile", "soft cat smile", "red_eyelashes", "dynamic wolf expression", "cinematic sporty expression", "dramatic cat expression", "cinematic dragon smile", "dreamy cat smile", "techwear expression", "dreamy modern smile", "cinematic angel expression", "dramatic chinese smile", "dynamic cat expression", "sporty eyes", "cinematic casual eyes", "japanese_expression", "detailed witch eyes", "detailed traditional expression", "dramatic beautiful expression", "dramatic cute smile", "cinematic traditional expression", "dramatic traditional eyes", "dark witch smile", "soft witch eyes", "bright butler expression", "intense witch smile", "dramatic nurse expression", "dynamic chinese expression", "dark bunny smile", "detailed cool smile", "detailed wolf eyes", "detailed gothic expression", "teal_eyelashes", "soft bunny expression", "dreamy summer expression", "dynamic bunny smile", "dreamy winter eyes", "cute expression", "stylish cool smile", "bunny eyes", "cinematic summer eyes", "gentle maid expression", "cinematic spring smile", "bright angel expression", "dynamic spring smile", "cinematic fantasy expression", "stylish beautiful eyes", "detailed night expression", "dynamic traditional expression", "dramatic casual eyes", "traditional expression", "gentle night eyes", "detailed chinese smile", "detailed beautiful expression", "stylish butler eyes", "fox eyes", "dramatic beautiful smile", "detailed cat eyes", "bright gothic expression", "dreamy butler smile", "dreamy maid expression", "soft angel smile", "stylish fantasy smile", "dramatic elegant eyes", "detailed gothic eyes", "grey_eyes", "detailed elegant eyes", "detailed techwear smile", "dynamic summer smile", "detailed chinese expression", "cinematic winter smile", "detailed chinese eyes", "blue_eyes", "soft demon smile", "cool_eyes", "gentle idol expression", "dreamy techwear expression", "autumn_smile", "dynamic modern expression", "intense elegant eyes", "cinematic nurse smile", "cool expression", "dark summer expression", "gentle dragon expression", "cool smile", "night eyes", "intense beautiful expression", "dark japanese eyes", "cinematic wolf smile", "fang", "dark elegant smile", "confident smile", "cinematic cool eyes", "cinematic fantasy smile", "dreamy cute expression", "soft cool eyes", "intense traditional eyes", "dramatic dragon smile", "gothic_expression", "soft traditional smile", "dramatic winter eyes", "japanese eyes", "silver eyes", "detailed japanese eyes", "idol smile", "stylish sporty smile", "cinematic chinese eyes", "bright maid expression", "intense techwear expression", "gentle cute expression", "dark cat eyes", "dark fantasy eyes", "stylish demon expression", "dynamic butler eyes", "dreamy wolf smile", "demon_eyes", "intense gothic expression", "bright cute eyes", "cinematic casual smile", "bright dragon eyes", "blue_eyelashes", "dynamic chinese eyes", "dynamic modern eyes", "dynamic japanese smile", "dreamy gothic eyes", "stylish butler smile", "bright sporty eyes", "gentle maid eyes", "wolf smile", "aqua_pupils", "dark chinese eyes", "bright casual expression", "cinematic night eyes", "dark eyelashes", "cinematic idol eyes", "dark modern eyes", "bright autumn eyes", "detailed nurse expression", "casual_smile", "dark cool smile", "soft traditional eyes", "soft casual smile", "stylish chinese expression", "dreamy fox eyes", "dramatic wolf smile", "dark cute expression", "dark witch expression", "stylish wolf expression", "bright modern eyes", "dark idol eyes", "wolf_smile", "embarrassed smile", "soft traditional expression", "blue eyes", "dramatic techwear eyes", "pink eyelashes", "dreamy gothic smile", "intense cat expression", "dynamic dragon eyes", "bright sporty expression", "green_eyelashes", "drooling", "cinematic modern eyes", "orange_pupils", "gentle summer smile", "dramatic japanese expression", "intense traditional expression", "dynamic nurse expression", "intense summer expression", "teal eyes", "cat_expression", "intense elegant expression", "dynamic winter eyes", "dreamy idol expression", "beautiful_eyes", "intense japanese expression", "teary eyes", "dragon smile", "casual expression", "cute_expression", "bright japanese expression", "blonde_eyes", "soft night smile", "dynamic autumn smile", "intense techwear eyes", "stylish casual expression", "stylish demon eyes", "gentle bunny eyes", "half-closed eyes", "dramatic spring smile", "green eyes", "gold pupils", "black_pupils", "dreamy night eyes", "purple_eyelashes", "dreamy nurse expression", "soft fantasy expression", "intense butler eyes", "dreamy demon expression", "stylish traditional expression", "dark casual smile", "soft wolf eyes", "intense cute smile", "cinematic modern smile", "teal_eyes", "gothic eyes", "intense demon eyes", "cinematic butler smile", "cinematic nurse eyes", "stylish butler expression", "dramatic autumn expression", "blonde_pupils", "dreamy wolf eyes", "stylish fox eyes", "dynamic casual eyes", "soft modern expression", "dreamy modern eyes", "intense idol eyes", "stylish modern expression", "spring_eyes", "dreamy elegant eyes", "grey_eyelashes", "yellow eyelashes", "soft modern smile", "pink_pupils", "dark fox smile", "blue_pupils", "green_pupils", "dreamy chinese smile", "chinese_smile", "dynamic beautiful eyes", "angel_eyes", "stylish autumn expression", "dark eyes", "dramatic sporty expression", "orange eyelashes", "intense chinese smile", "soft fox expression", "spring eyes", "round eyes", "idol expression", "dreamy butler expression", "dramatic japanese eyes", "bright cat expression", "dramatic cool smile", "witch expression", "dark_eyes", "detailed cute smile", "soft dragon eyes", "teal pupils", "cinematic traditional eyes", "dynamic cat smile", "bunny_expression", "light_eyes", "dynamic winter expression", "dreamy fantasy expression", "stylish idol smile", "detailed cute eyes", "dreamy elegant expression", "stylish fox expression", "intense nurse smile", "detailed bunny smile", "aqua_eyelashes", "intense sporty expression", "detailed casual eyes", "dramatic gothic smile", "winter_expression", "japanese_smile", "intense beautiful smile", "green pupils", "dark dragon smile", "bright maid smile", "dreamy traditional expression", "dark casual eyes", "cinematic autumn eyes", "intense casual smile", "detailed elegant smile", "intense bunny eyes", "soft spring expression", "dynamic night smile", "multicolored_pupils", "dramatic modern expression", "brown eyes", "orange_eyelashes", "soft techwear smile", "stylish wolf smile", "bright elegant smile", "stylish winter expression", "cinematic maid smile", "gentle cute smile", "soft butler smile", "gentle autumn expression", "gentle traditional smile", "dark witch eyes", "angel eyes", "butler expression", "intense fox eyes", "black_eyelashes", "dynamic angel eyes", "dramatic gothic expression", "gentle winter eyes", "soft cat expression", "blonde_eyelashes", "dramatic dragon expression", "dark modern expression", "intense winter eyes", "stylish cute expression", "witch_eyes", "bright cool smile", "cinematic gothic expression", "dynamic sporty smile", "dramatic sporty eyes", "dynamic gothic eyes", "dragon_expression", "dark casual expression", "intense cat smile", "soft cute smile", "dreamy japanese smile", "stylish dragon expression", "dynamic fox eyes", "bright cool expression", "soft fantasy smile", "dreamy idol eyes", "japanese expression", "fantasy_eyes", "fox_expression", "cinematic cool expression", "dramatic techwear expression", "gentle japanese eyes", "dark butler eyes", "dragon_eyes", "bright bunny expression", "stylish spring expression", "grey_pupils", "detailed fox expression", "intense autumn expression"], "clothing": ["grey_swimsuit", "dark gothic uniform", "stylish fantasy outfit", "dreamy autumn uniform", "blonde jacket", "dreamy night uniform", "dreamy bunny uniform", "techwear_dress", "light dress", "dark fox outfit", "casual_dress", "grey_yukata", "gentle angel outfit", "bright cute dress", "intense cute dress", "dreamy elegant outfit", "bright techwear outfit", "chinese dress", "white_skirt", "soft modern dress", "dynamic fox uniform", "beautiful dress", "blue_sleeves", "blue_hoodie", "dark_swimsuit", "brown_shirt", "teal kimono", "blonde_kimono", "brown sleeves", "gentle wolf dress", "multicolored thighhighs", "intense wolf dress", "gentle dragon uniform", "red_boots", "cinematic gothic dress", "dramatic witch outfit", "multicolored_yukata", "detailed modern outfit", "dark dragon outfit", "soft butler outfit", "cinematic wolf uniform", "dreamy fantasy outfit", "blue_socks", "gold bikini", "detailed modern dress", "blue bikini", "dark autumn dress", "black skirt", "dramatic idol dress", "gold jacket", "stylish sporty dress", "gold_jacket", "blonde bikini", "dark casual uniform", "blue hoodie", "purple_lingerie", "red qipao", "stylish traditional uniform", "blue coat", "dynamic summer outfit", "white_swimsuit", "dreamy night dress", "yellow kimono", "red coat", "silver qipao", "white_gloves", "dreamy sporty outfit", "dramatic elegant uniform", "cinematic cool uniform", "light boots", "bright winter uniform", "cute_uniform", "bright night uniform", "yellow_hoodie", "teal_kimono", "pink lingerie", "detailed nurse uniform", "green sleeves", "light socks", "cinematic wolf outfit", "idol dress", "dark cat outfit", "yellow_thighhighs", "orange_jacket", "autumn uniform", "dreamy wolf uniform", "bunny_uniform", "red lingerie", "dark_boots", "pink_shirt", "dark witch outfit", "stylish fantasy dress", "intense gothic outfit", "dynamic witch dress", "gold_coat", "detailed nurse dress", "gentle dragon outfit", "traditional_outfit", "cinematic winter outfit", "dreamy summer dress", "aqua_thighhighs", "dark maid dress", "dynamic modern dress", "stylish winter uniform", "intense maid outfit", "soft summer uniform", "light capelet", "dreamy elegant uniform", "light qipao", "dark winter uniform", "cinematic witch outfit", "dynamic sporty outfit", "soft witch uniform", "pink_socks", "green_capelet", "bright summer outfit", "orange_capelet", "intense bunny outfit", "detailed casual uniform", "cool_uniform", "dynamic idol dress", "detailed fox uniform", "detailed autumn uniform", "dramatic idol outfit", "teal sleeves", "gentle winter outfit", "soft cool dress", "dreamy cute dress", "dreamy beautiful uniform", "dynamic cute dress", "dynamic angel uniform", "green_kimono", "casual_outfit", "multicolored_thighhighs", "stylish modern uniform", "orange shirt", "gentle autumn dress", "green skirt", "dramatic bunny uniform", "dark cat uniform", "aqua sleeves", "bright traditional uniform", "dramatic japanese dress", "gold yukata", "grey gloves", "gold_sweater", "cinematic cool dress", "soft dragon outfit", "blonde_shirt", "red sleeves", "dark sporty outfit", "dynamic traditional outfit", "soft fox dress", "white_kimono", "pale swimsuit", "blue socks", "dynamic cat uniform", "bright butler outfit", "summer_outfit", "detailed cute uniform", "gentle cat dress", "yellow_skirt", "summer outfit", "detailed cool outfit", "dynamic spring outfit", "red thighhighs", "gentle cool dress", "intense traditional uniform", "black sleeves", "dark witch dress", "intense dragon dress", "cool_outfit", "soft elegant outfit", "orange coat", "dark techwear uniform", "dreamy butler outfit", "idol_uniform", "purple_boots", "aqua lingerie", "detailed autumn outfit", "fantasy dress", "cinematic beautiful dress", "gentle autumn uniform", "dark cute outfit", "red_jacket", "pink_jacket", "light lingerie", "dramatic cat uniform", "dark boots", "orange_bikini", "green_bikini", "pink capelet", "soft spring uniform", "intense japanese outfit", "detailed beautiful uniform", "light_sweater", "bright angel dress", "dreamy butler uniform", "cinematic fox outfit", "dynamic elegant outfit", "gentle traditional outfit", "detailed cute outfit", "detailed japanese dress", "dynamic butler outfit", "soft japanese outfit", "idol outfit", "gentle maid uniform", "bright spring outfit", "soft traditional outfit", "silver lingerie", "orange swimsuit", "dark coat", "stylish maid outfit", "intense chinese outfit", "dynamic night dress", "red boots", "teal shirt", "bright beautiful uniform", "multicolored sweater", "stylish winter dress", "yellow sleeves", "night outfit", "dreamy bunny dress", "stylish sporty uniform", "bright elegant dress", "dreamy traditional outfit", "dynamic elegant dress", "dark angel uniform", "gentle sporty uniform", "stylish summer outfit", "gold socks", "summer uniform", "nurse_uniform", "detailed witch dress", "dynamic wolf outfit", "dramatic witch uniform", "blue boots", "teal boots", "cinematic casual uniform", "yellow_gloves", "blonde capelet", "gentle night dress", "intense modern outfit", "bright maid uniform", "beautiful outfit", "gentle fantasy uniform", "yellow_lingerie", "black_socks", "modern uniform", "winter outfit", "yellow_socks", "blonde_yukata", "dynamic chinese dress", "chinese_outfit", "cinematic cat dress", "intense witch uniform", "dark japanese uniform", "dramatic cute uniform", "dreamy modern dress", "green_yukata", "detailed demon dress", "teal_sweater", "soft summer outfit", "intense japanese dress", "black_yukata", "dreamy witch outfit", "pink_dress", "intense sporty outfit", "orange_shirt", "grey_qipao", "bright elegant uniform", "angel_dress", "dreamy casual uniform", "modern_dress", "dramatic maid uniform", "beautiful_uniform", "blonde gloves", "cinematic traditional uniform", "aqua_socks", "dark techwear outfit", "soft witch outfit", "gentle cool uniform", "beautiful uniform", "intense cool outfit", "bright witch uniform", "silver_gloves", "dark jacket", "intense idol outfit", "stylish summer uniform", "soft summer dress", "gentle traditional uniform", "grey yukata", "dreamy gothic outfit", "cinematic beautiful uniform", "dragon_outfit", "bright techwear dress", "intense winter outfit", "cinematic modern outfit", "dramatic sporty outfit", "teal bikini", "dark nurse outfit", "light_swimsuit", "black_sleeves", "oversized jacket", "detailed maid dress", "dramatic fantasy dress", "grey_jacket", "aqua_capelet", "gold gloves", "blonde thighhighs", "light yukata", "bright cute outfit", "dreamy fantasy uniform", "dark summer outfit", "japanese_dress", "aqua_lingerie", "dark fox dress", "dreamy maid outfit", "brown_hoodie", "stylish demon outfit", "dreamy chinese uniform", "white_shirt", "detailed sporty dress", "pale_lingerie", "detailed techwear uniform", "black socks", "white jacket", "dynamic cat dress", "teal_boots", "dark butler uniform", "dramatic casual dress", "bright cool dress", "gentle elegant outfit", "dark bunny outfit", "gold_skirt", "gentle winter uniform", "dark fantasy outfit", "blonde dress", "dramatic bunny outfit", "dynamic butler uniform", "purple gloves", "brown dress", "bright beautiful dress", "dark hoodie", "multicolored skirt", "dramatic night dress", "dramatic modern uniform", "bright gothic uniform", "dark cute dress", "grey_skirt", "stylish angel uniform", "yellow_swimsuit", "orange_skirt", "bright sporty dress", "soft wolf uniform", "detailed casual outfit", "dynamic japanese dress", "gentle elegant dress", "dramatic nurse uniform", "shirt open", "pale_shirt", "bright maid outfit", "dreamy traditional uniform", "stylish dragon outfit", "teal_dress", "orange qipao", "white shirt", "pale capelet", "grey thighhighs", "dramatic demon uniform", "dark modern uniform", "detailed sporty outfit", "green socks", "cinematic cute uniform", "gentle night outfit", "teal_skirt", "intense wolf uniform", "dramatic fox dress", "bright autumn uniform", "wolf_outfit", "cinematic summer uniform", "dramatic winter uniform", "intense winter dress", "pink qipao", "white swimsuit", "cinematic night outfit", "fox uniform", "dark autumn outfit", "sporty uniform", "intense fantasy uniform", "cinematic summer outfit", "black_skirt", "teal sweater", "dark autumn uniform", "intense witch dress", "aqua_sleeves", "brown_lingerie", "intense beautiful dress", "pale_coat", "brown_jacket", "stylish fox uniform", "pale kimono", "dynamic nurse uniform", "dynamic nurse outfit", "green swimsuit", "orange_sleeves", "pink skirt", "cute uniform", "brown skirt", "green_jacket", "green_swimsuit", "dark lingerie", "dreamy idol outfit", "pink_gloves", "autumn dress", "soft wolf outfit", "silver_socks", "silver_thighhighs", "white qipao", "dynamic butler dress", "dark elegant uniform", "dark summer uniform", "white kimono", "silver sweater", "multicolored_capelet", "night uniform", "stylish night outfit", "cinematic angel outfit", "dynamic maid dress", "pink thighhighs", "intense techwear outfit", "intense fantasy outfit", "bright traditional dress", "soft sporty outfit", "bright japanese uniform", "bright demon outfit", "dramatic casual outfit", "pale_skirt", "grey_hoodie", "white_dress", "fox outfit", "multicolored_shirt", "intense cool uniform", "purple boots", "dreamy dragon outfit", "intense cat uniform", "yellow_yukata", "pink_yukata", "stylish butler outfit", "white dress", "soft casual uniform", "cinematic demon uniform", "gold_sleeves", "cinematic autumn uniform", "dramatic witch dress", "bright modern outfit", "pale sleeves", "dreamy techwear dress", "soft spring dress", "intense bunny uniform", "bright casual outfit", "dark butler outfit", "brown boots", "cinematic nurse uniform", "teal_shirt", "green gloves", "detailed gothic dress", "cinematic idol dress", "aqua capelet", "gold skirt", "green thighhighs", "grey dress", "brown capelet", "brown yukata", "cinematic bunny uniform", "dynamic night uniform", "bright winter outfit", "cinematic fox uniform", "dark sleeves", "dramatic traditional uniform", "cinematic wolf dress", "dark gothic dress", "dreamy nurse uniform", "gentle butler outfit", "autumn outfit", "light_capelet", "cinematic japanese outfit", "dynamic dragon dress", "blue sweater", "cinematic cute dress", "dark socks", "bright dragon uniform", "multicolored shirt", "stylish witch outfit", "black hoodie", "black sweater", "gentle idol outfit", "pinstripe pants", "demon_outfit", "stylish casual outfit", "dreamy modern uniform", "dramatic cat dress", "dark casual dress", "maid_dress", "dark fox uniform", "bright nurse dress", "stylish beautiful uniform", "dynamic beautiful uniform", "cool uniform", "pink_kimono", "winter_dress", "silver shirt", "dynamic japanese outfit", "silver swimsuit", "gentle gothic outfit", "dramatic elegant dress", "dreamy spring dress", "dramatic chinese dress", "light coat", "dark yukata", "blonde lingerie", "pale_boots", "grey_coat", "brown_bikini", "pale_capelet", "purple_bikini", "aqua_dress", "blonde sweater", "green coat", "multicolored swimsuit", "purple_dress", "purple_yukata", "fantasy_outfit", "gentle nurse outfit", "pink swimsuit", "dynamic spring dress", "light_boots", "dreamy angel outfit", "aqua thighhighs", "blue_skirt", "bright dragon outfit", "gentle idol uniform", "gentle gothic uniform", "white skirt", "detailed wolf outfit", "dreamy japanese dress", "detailed butler outfit", "multicolored lingerie", "purple jacket", "dreamy cat uniform", "dramatic casual uniform", "dreamy angel uniform", "soft sporty dress", "dynamic cool uniform", "purple_capelet", "grey_lingerie", "dark casual outfit", "detailed idol outfit", "pale_swimsuit", "teal_coat", "nurse dress", "casual dress", "maid_outfit", "yellow shirt", "dramatic spring uniform", "pinstripe suit", "bright cat dress", "red kimono", "dramatic nurse outfit", "cinematic maid uniform", "stylish dragon dress", "silver_kimono", "night_dress", "dreamy wolf dress", "stylish spring dress", "pale shirt", "detailed winter dress", "bright spring uniform", "stylish demon uniform", "orange_dress", "dramatic chinese uniform", "light swimsuit", "grey_capelet", "gentle winter dress", "nurse uniform", "detailed night outfit", "brown jacket", "black gloves", "stylish gothic dress", "cinematic maid outfit", "black kimono", "dreamy summer uniform", "cinematic casual outfit", "witch outfit", "grey hoodie", "light hoodie", "dreamy maid uniform", "stylish spring outfit", "gold capelet", "dynamic techwear uniform", "dark elegant outfit", "soft idol uniform", "traditional outfit", "bright autumn dress", "detailed fantasy outfit", "stylish techwear outfit", "dark gloves", "fox_dress", "intense casual dress", "light shirt", "dreamy witch dress", "white_thighhighs", "grey_dress", "dark butler dress", "dark bunny dress", "detailed dragon outfit", "detailed beautiful dress", "intense autumn uniform", "gentle japanese outfit", "chinese_uniform", "silver_hoodie", "dark chinese outfit", "sporty outfit", "soft autumn outfit", "dramatic fantasy uniform", "autumn_dress", "gentle sporty outfit", "dynamic bunny dress", "brown_sleeves", "dynamic winter outfit", "summer dress", "yellow_bikini", "detailed japanese outfit", "intense summer uniform", "gentle casual outfit", "blue_coat", "stylish nurse dress", "intense beautiful uniform", "purple_sweater", "bright gothic outfit", "dreamy angel dress", "soft chinese outfit", "dark dragon uniform", "pale_thighhighs", "grey_thighhighs", "cat_dress", "blue_thighhighs", "beautiful_outfit", "soft winter uniform", "dramatic summer dress", "gentle sporty dress", "teal socks", "dark chinese dress", "blonde qipao", "light_sleeves", "purple swimsuit", "stylish angel dress", "dark cat dress", "gold dress", "dynamic maid outfit", "silver_lingerie", "cinematic summer dress", "grey socks", "gentle gothic dress", "cinematic dragon dress", "purple qipao", "butler_dress", "cinematic cute outfit", "chinese uniform", "gentle modern outfit", "cinematic traditional outfit", "red_coat", "red gloves", "dark angel outfit", "stylish maid dress", "detailed beautiful outfit", "teal qipao", "butler dress", "soft bunny uniform", "bright techwear uniform", "pale_hoodie", "gentle summer uniform", "blue_boots", "bright cool outfit", "dynamic fox outfit", "grey capelet", "cool_dress", "dynamic fantasy dress", "silver coat", "yellow hoodie", "light skirt", "detailed bunny dress", "dark kimono", "blue lingerie", "blue_dress", "cinematic sporty dress", "purple_socks", "silver hoodie", "blue_gloves", "dreamy dragon uniform", "angel outfit", "grey skirt", "multicolored_coat", "soft angel uniform", "intense butler dress", "cinematic fantasy uniform", "bright fox dress", "pale_qipao", "purple_kimono", "soft traditional dress", "orange capelet", "multicolored_jacket", "gold coat", "cinematic butler outfit", "blonde_skirt", "intense elegant dress", "detailed gothic outfit", "pink_sleeves", "blue dress", "silver sleeves", "casual uniform", "yellow_jacket", "multicolored kimono", "butler_uniform", "dark elegant dress", "red_dress", "dramatic techwear outfit", "stylish dragon uniform", "brown_coat", "purple yukata", "bunny outfit", "soft chinese uniform", "bright casual dress", "dynamic casual dress", "red_bikini", "dark_sleeves", "red_swimsuit", "detailed nurse outfit", "green jacket", "detailed cool uniform", "dramatic night outfit", "soft winter dress", "light_bikini", "black_gloves", "silver_dress", "green_qipao", "bright demon dress", "detailed night uniform", "dramatic gothic uniform", "multicolored_skirt", "cat outfit", "soft chinese dress", "blue_lingerie", "dynamic chinese outfit", "stylish butler dress", "silver_qipao", "white lingerie", "intense chinese dress", "blue jacket", "cinematic night uniform", "brown_thighhighs", "grey_sleeves", "intense cute outfit", "cinematic modern dress", "green yukata", "cinematic gothic outfit", "pink_boots", "oversized sleeves", "soft demon uniform", "dark_skirt", "soft fantasy dress", "stylish japanese outfit", "stylish elegant dress", "red_hoodie", "gentle witch uniform", "bright wolf dress", "gold_hoodie", "dark dragon dress", "detailed cool dress", "intense traditional outfit", "dark cool uniform", "dramatic dragon outfit", "cute_outfit", "intense cat outfit", "blue capelet", "cinematic butler dress", "yellow jacket", "dark beautiful dress", "soft fox uniform", "black_capelet", "soft nurse outfit", "multicolored coat", "orange sleeves", "gothic dress", "dark_capelet", "cinematic elegant dress", "gentle bunny dress", "blonde_thighhighs", "pale sweater", "intense techwear uniform", "grey_boots", "dramatic chinese outfit", "dynamic demon dress", "soft winter outfit", "dark cool dress", "blue_yukata", "winter dress", "teal thighhighs", "pink socks", "detailed traditional outfit", "light sleeves", "gentle summer outfit", "dreamy modern outfit", "red sweater", "purple_jacket", "blue skirt", "dreamy nurse dress", "dark idol outfit", "dreamy autumn dress", "stylish techwear dress", "dynamic idol uniform", "dark maid outfit", "dark swimsuit", "stylish elegant uniform", "bright chinese dress", "japanese outfit", "intense idol dress", "gentle wolf uniform", "black capelet", "idol uniform", "grey qipao", "cinematic winter dress", "soft cat outfit", "detailed chinese dress", "cool outfit", "black_bikini", "detailed summer uniform", "dark capelet", "stylish summer dress", "dreamy witch uniform", "light_qipao", "detailed bunny outfit", "white bikini", "pink_qipao", "pink_thighhighs", "orange_swimsuit", "black yukata", "dramatic butler uniform", "bright sporty uniform", "blonde_bikini", "cinematic bunny dress", "dramatic winter dress", "soft gothic dress", "orange lingerie", "intense techwear dress", "skirt lifted", "intense gothic uniform", "light_skirt", "bright japanese outfit", "nurse_dress", "dreamy cat dress", "dark shirt", "intense fox outfit", "soft beautiful outfit", "dark_thighhighs", "grey_kimono", "brown hoodie", "bright idol uniform", "bunny_dress", "brown lingerie", "elegant outfit", "cinematic sporty uniform", "soft cute dress", "pink sleeves", "gentle demon dress", "dreamy cool uniform", "soft night uniform", "light sweater", "black lingerie", "intense angel uniform", "detailed japanese uniform", "bright chinese outfit", "aqua jacket", "autumn_uniform", "gentle cool outfit", "gentle japanese uniform", "grey lingerie", "dynamic night outfit", "bright wolf uniform", "dark cool outfit", "sleeves past fingers", "intense fox uniform", "black_qipao", "yellow bikini", "intense bunny dress", "dreamy japanese outfit", "pale gloves", "dreamy demon uniform", "dreamy japanese uniform", "yellow swimsuit", "dynamic casual outfit", "open clothes", "blue thighhighs", "dark winter outfit", "dynamic witch outfit", "intense butler outfit", "white_capelet", "pale_socks", "dynamic fantasy uniform", "brown thighhighs", "silver_yukata", "soft nurse uniform", "dynamic casual uniform", "teal yukata", "brown sweater", "dark wolf dress", "multicolored_lingerie", "teal hoodie", "intense spring uniform", "blonde_sleeves", "dynamic gothic outfit", "blue shirt", "black_swimsuit", "intense witch outfit", "bunny_outfit", "cinematic beautiful outfit", "gold_shirt", "orange dress", "soft fantasy uniform", "black dress", "orange_gloves", "stylish winter outfit", "stylish cute dress", "pale yukata", "multicolored_bikini", "pink_coat", "pale jacket", "detailed witch outfit", "orange jacket", "blue kimono", "silver_swimsuit", "cinematic spring dress", "blonde_hoodie", "soft japanese uniform", "brown_socks", "yellow_sleeves", "pale_gloves", "shrine maiden outfit", "detailed spring uniform", "gentle bunny uniform", "yellow gloves", "multicolored_qipao", "bright sporty outfit", "pink shirt", "stylish chinese uniform", "intense beautiful outfit", "stylish beautiful outfit", "light_dress", "pale dress", "blonde_socks", "silver kimono", "gentle cat uniform", "soft night outfit", "aqua yukata", "white_boots", "dark_socks", "dark_kimono", "white_lingerie", "cinematic fantasy outfit", "cinematic bunny outfit", "dramatic beautiful uniform", "dark sporty dress", "dynamic winter uniform", "green dress", "purple_coat", "dark_yukata", "aqua_bikini", "white gloves", "teal capelet", "dynamic dragon uniform", "dramatic fox uniform", "pale skirt", "brown_yukata", "dramatic autumn uniform", "pale thighhighs", "dynamic demon uniform", "wolf_dress", "green_sweater", "soft fox outfit", "orange_coat", "light jacket", "modern outfit", "gold qipao", "gentle fox uniform", "soft nurse dress", "dramatic cat outfit", "silver capelet", "yellow_kimono", "dreamy cool outfit", "dramatic elegant outfit", "orange_socks", "blue_bikini", "detailed winter uniform", "blue gloves", "intense autumn outfit", "idol_outfit", "multicolored sleeves", "white_coat", "dark demon dress", "dynamic angel outfit", "bright beautiful outfit", "cinematic casual dress", "dark techwear dress", "dynamic spring uniform", "detailed wolf uniform", "green qipao", "silver jacket", "teal dress", "demon_uniform", "teal_thighhighs", "dramatic spring outfit", "black swimsuit", "brown_boots", "dramatic modern dress", "dramatic sporty uniform", "white_yukata", "pink_capelet", "dark beautiful outfit", "butler uniform", "dynamic chinese uniform", "black_lingerie", "dramatic winter outfit", "gentle casual uniform", "cinematic chinese outfit", "witch uniform", "teal skirt", "detailed gothic uniform", "intense cool dress", "dramatic autumn outfit", "cinematic spring outfit", "multicolored socks", "stylish witch uniform", "multicolored bikini", "blue qipao", "intense night outfit", "gentle casual dress", "cinematic elegant uniform", "soft maid dress", "aqua_shirt", "gothic_uniform", "intense modern uniform", "intense summer dress", "red bikini", "red hoodie", "techwear dress", "stylish spring uniform", "soft modern outfit", "bright nurse uniform", "beautiful_dress", "japanese uniform", "witch_dress", "stylish cute outfit", "dragon_uniform", "detailed cat dress", "pink_hoodie", "soft japanese dress", "blue_capelet", "purple coat", "orange hoodie", "gold_socks", "bright butler uniform", "stylish gothic outfit", "soft autumn uniform", "dreamy beautiful dress", "dragon_dress", "blonde skirt", "detailed maid uniform", "hidden hands", "detailed wolf dress", "blonde coat", "dreamy casual dress", "cinematic traditional dress", "red_lingerie", "intense cat dress", "intense nurse dress", "intense dragon uniform", "stylish night dress", "green_thighhighs", "dynamic sporty dress", "soft dragon uniform", "orange sweater", "cute dress", "elegant_dress", "stylish idol uniform", "dramatic techwear dress", "black thighhighs", "blue_qipao", "dreamy fox uniform", "stylish japanese dress", "dragon uniform", "gold_gloves", "purple_shirt", "dramatic nurse dress", "bright autumn outfit", "detailed traditional uniform", "purple hoodie", "bright wolf outfit", "aqua coat", "white coat", "purple shirt", "stylish cute uniform", "cinematic angel uniform", "cinematic idol uniform", "gentle cute outfit", "yellow sweater", "intense modern dress", "dynamic autumn uniform", "dramatic beautiful dress", "blonde_qipao", "night_uniform", "dynamic nurse dress", "multicolored_boots", "dynamic cute outfit", "intense traditional dress", "cinematic autumn outfit", "soft spring outfit", "gentle beautiful uniform", "dramatic cute outfit", "gentle spring uniform", "green boots", "cinematic cat outfit", "intense casual uniform", "pale hoodie", "soft idol dress", "soft butler uniform", "intense maid dress", "butler outfit", "aqua sweater", "stylish nurse outfit", "wolf dress", "orange_lingerie", "pink_skirt", "cute outfit", "thighhighs", "white_jacket", "dreamy chinese outfit", "dynamic bunny outfit", "dynamic autumn dress", "aqua_hoodie", "intense demon dress", "gentle fox outfit", "blonde socks", "spring_uniform", "pink_sweater", "aqua_kimono", "brown_dress", "pale boots", "stylish fox outfit", "green_shirt", "dynamic cute uniform", "dramatic summer uniform", "gold_bikini", "gentle spring dress", "bright winter dress", "dynamic beautiful dress", "dramatic angel outfit", "gentle cute dress", "light kimono", "cinematic techwear uniform", "stylish night uniform", "aqua shirt", "dark_qipao", "brown_swimsuit", "orange_kimono", "intense cute uniform", "yellow lingerie", "soft wolf dress", "dark summer dress", "orange_qipao", "purple_hoodie", "dreamy techwear outfit", "grey coat", "intense angel outfit", "dark beautiful uniform", "dreamy fox outfit", "dramatic techwear uniform", "dark traditional outfit", "dreamy butler dress", "soft beautiful dress", "gentle wolf outfit", "aqua_skirt", "pale_sweater", "dynamic cool dress", "purple_thighhighs", "gentle butler uniform", "pink sweater", "dark_coat", "bright japanese dress", "teal_lingerie", "pink yukata", "purple_swimsuit", "dreamy winter uniform", "dynamic dragon outfit", "fox_uniform", "white socks", "bright cat uniform", "dark maid uniform", "teal_socks", "teal_yukata", "gentle demon uniform", "green hoodie", "dynamic summer uniform", "dark sweater", "stylish wolf dress", "detailed idol dress", "stylish modern outfit", "detailed traditional dress", "detailed modern uniform", "dramatic night uniform", "black qipao", "aqua hoodie", "dark_gloves", "soft casual dress", "gentle chinese dress", "red_sweater", "red shirt", "stylish autumn outfit", "detailed angel uniform", "stylish bunny uniform", "bright fox uniform", "intense demon uniform", "white hoodie", "gentle summer dress", "bright cool uniform", "dreamy elegant dress", "blonde sleeves", "japanese dress", "gold_boots", "soft maid uniform", "spring_outfit", "dark japanese dress", "stylish chinese dress", "purple kimono", "dynamic summer dress", "dark sporty uniform", "bright bunny outfit", "blue_kimono", "dramatic butler outfit", "detailed angel outfit", "green sweater", "silver_capelet", "purple bikini", "dark demon outfit", "teal_qipao", "bright nurse outfit", "dark idol dress", "gold kimono", "dynamic japanese uniform", "detailed angel dress", "intense elegant outfit", "dramatic wolf uniform", "summer_dress", "autumn_outfit", "intense dragon outfit", "night dress", "purple skirt", "white yukata", "cinematic autumn dress", "white_qipao", "aqua_boots", "dreamy cute outfit", "wolf uniform", "dreamy winter outfit", "bright idol outfit", "gothic outfit", "green_socks", "green_lingerie", "cat dress", "yellow_boots", "cinematic techwear dress", "bright elegant outfit", "pale socks", "fox dress", "black shirt", "yellow_qipao", "soft techwear outfit", "knee socks", "cinematic modern uniform", "gentle cute uniform", "light bikini", "gentle maid outfit", "orange_hoodie", "green kimono", "bright fantasy uniform", "techwear uniform", "dreamy beautiful outfit", "techwear outfit", "cat uniform", "intense japanese uniform", "green_coat"], "accessory": ["black mask", "blue hair ornament", "choker", "brown_hairclip", "pink hairclip", "blonde_necklace", "green scarf", "yellow_earrings", "teal earrings", "teal mask", "light scarf", "yellow hair ornament", "blue_glasses", "purple hairclip", "pink necklace", "white mask", "aqua earrings", "dark bow", "purple_hair_ornament", "brown_mask", "pale hat", "silver earrings", "teal necklace", "silver belt", "green_mask", "blue_bow", "multicolored_glasses", "red_hair_ornament", "multicolored_belt", "grey_belt", "silver_hairclip", "red belt", "light_earrings", "light hair ornament", "pale_scarf", "orange_hair_ornament", "green belt", "yellow_hat", "yellow scarf", "white_necklace", "purple_glasses", "pale bow", "orange scarf", "grey_mask", "orange_hairclip", "dark hairclip", "pale mask", "black_glasses", "purple_hairclip", "white_hairclip", "white_earrings", "pink_ribbon", "yellow earrings", "light mask", "heart-shaped eye device", "white ribbon", "yellow_glasses", "dark necklace", "green ribbon", "white earrings", "dark_necklace", "green_hair_ornament", "purple scarf", "grey earrings", "gold hair ornament", "purple_mask", "silver_bow", "grey_bow", "silver hair ornament", "teal_scarf", "orange belt", "brown necklace", "multicolored hair ornament", "dark_ribbon", "orange bow", "blonde glasses", "blonde belt", "blonde mask", "black_belt", "silver_scarf", "silver glasses", "purple earrings", "teal bow", "brown_ribbon", "blue mask", "gold_hat", "grey_scarf", "yellow mask", "dark glasses", "aqua hairclip", "pink hair ornament", "dark earrings", "pale earrings", "teal_mask", "purple_belt", "red mask", "green_hat", "black_hairclip", "brown hat", "light glasses", "light hat", "teal belt", "brown_hat", "red_earrings", "yellow_mask", "red_hat", "blonde_mask", "pink scarf", "orange earrings", "dark_hat", "red bow", "light_hairclip", "pale scarf", "aqua_earrings", "gold_hairclip", "silver hairclip", "pale_mask", "light_glasses", "orange_hat", "blue_necklace", "gold_scarf", "pink glasses", "blonde hair ornament", "black ribbon", "green hair ornament", "grey scarf", "purple_necklace", "white bow", "multicolored_scarf", "dark scarf", "green_belt", "grey_hairclip", "orange_earrings", "blue glasses", "blue_ribbon", "light earrings", "green_scarf", "blue bow", "silver hat", "gold_necklace", "gold_hair_ornament", "aqua_hat", "green bow", "red_ribbon", "blonde_glasses", "grey hairclip", "grey_earrings", "black_scarf", "green_ribbon", "brown_hair_ornament", "white_glasses", "silver_hat", "multicolored hat", "aqua_necklace", "yellow hat", "green_earrings", "teal_bow", "aqua necklace", "pink bow", "dark_hairclip", "pink_hair_ornament", "grey_necklace", "gold ribbon", "gold scarf", "white hair ornament", "dark hat", "orange_glasses", "blonde_hairclip", "pale_hairclip", "yellow_scarf", "yellow_bow", "aqua_belt", "blonde_belt", "teal_necklace", "black_hat", "pink_belt", "light_belt", "black_ribbon", "white_mask", "light_mask", "yellow ribbon", "multicolored scarf", "silver_necklace", "orange hairclip", "brown hair ornament", "blonde ribbon", "white hat", "orange ribbon", "grey ribbon", "multicolored_earrings", "gold earrings", "multicolored_hairclip", "grey bow", "aqua hair ornament", "light_bow", "blue necklace", "dark hair ornament", "orange_ribbon", "blonde bow", "light hairclip", "pale_hair_ornament", "teal_hat", "pale_earrings", "orange glasses", "multicolored_mask", "grey belt", "white_scarf", "silver_belt", "red_mask", "teal_belt", "red ribbon", "blonde_hat", "brown_scarf", "multicolored bow", "green glasses", "yellow_ribbon", "black scarf", "silver_mask", "red necklace", "light_necklace", "gloves", "pink belt", "aqua_ribbon", "aqua_mask", "green_bow", "silver bow", "purple hat", "blonde hat", "blonde scarf", "black hat", "gold belt", "gold hat", "grey_glasses", "brown_belt", "multicolored_hat", "grey mask", "multicolored_ribbon", "black glasses", "yellow_hair_ornament", "red_necklace", "blue_mask", "aqua glasses", "gold_glasses", "aqua_bow", "multicolored belt", "pink_earrings", "brown bow", "multicolored hairclip", "red_bow", "white necklace", "orange mask", "aqua mask", "silver scarf", "teal_earrings", "pale_hat", "blonde hairclip", "blue ribbon", "yellow glasses", "pink_bow", "orange hat", "pink_mask", "multicolored ribbon", "silver mask", "teal hairclip", "dark ribbon", "blue_hairclip", "dark_earrings", "silver_glasses", "yellow belt", "purple hair ornament", "multicolored mask", "black hair ornament", "dark belt", "blonde_hair_ornament", "white glasses", "multicolored necklace", "black_bow", "aqua ribbon", "white belt", "multicolored glasses", "yellow bow", "silver_ribbon", "white_belt", "gold_ribbon", "gold_bow", "orange hair ornament", "yellow heart ornament", "yellow necklace", "pale hairclip", "aqua hat", "gold necklace", "green hairclip", "pale_glasses", "gold_mask", "dark_belt", "pale_necklace", "red_belt", "gold bow", "grey hair ornament", "aqua belt", "pink mask", "black necklace", "orange_belt", "pale belt", "yellow_necklace", "purple ribbon", "pink_hat", "gold hairclip", "brown_earrings", "blue_earrings", "silver necklace", "teal_ribbon", "purple necklace", "blonde_scarf", "purple_bow", "brown belt", "red scarf", "gold glasses", "aqua bow", "black bow", "light_scarf", "green earrings", "teal hat", "blue earrings", "pale_ribbon", "brown_glasses", "pink earrings", "red hair ornament", "brown earrings", "dark_bow", "light ribbon", "brown scarf", "teal scarf", "multicolored_hair_ornament", "brown_necklace", "pink_glasses", "black_necklace", "blonde earrings", "ofuda", "red_glasses", "blue belt", "grey hat", "purple_scarf", "light_hat", "blonde_earrings", "light belt", "blonde necklace", "teal_hair_ornament", "yellow_belt", "purple bow", "red hairclip", "aqua_hairclip", "orange_mask", "teal_glasses", "black_hair_ornament", "black belt", "dark_glasses", "red glasses", "brown ribbon", "grey_ribbon", "grey_hat", "black_mask", "black cords", "purple mask", "black hairclip", "pale hair ornament", "brown hairclip", "closed third eye", "green_glasses", "green_necklace", "gold_belt", "silver ribbon", "brown_bow", "chains", "light bow", "orange necklace", "aqua_scarf", "white_ribbon", "black_earrings", "multicolored_necklace", "blue_belt", "brown mask", "white_hair_ornament", "red_hairclip", "orange_necklace", "pink ribbon", "pink_scarf", "purple_earrings", "teal ribbon", "silver_earrings", "purple_hat", "green mask", "blonde_bow", "orange_bow", "brown glasses", "blue hat", "pink hat", "white scarf", "dark_hair_ornament", "aqua_glasses", "silver_hair_ornament", "red earrings", "grey glasses", "purple_ribbon", "white_bow", "pink_hairclip", "black earrings", "aqua_hair_ornament", "yellow_hairclip", "teal glasses", "light_hair_ornament", "green_hairclip", "pink_necklace", "white hairclip", "orange_scarf", "light_ribbon", "teal hair ornament", "blue_hat", "aqua scarf", "dark mask", "purple glasses", "purple belt", "white_hat", "red hat", "pale_belt", "blue scarf", "green hat", "light necklace", "blue hairclip", "ribbon bow", "yellow hairclip", "blonde_ribbon", "dark_scarf", "multicolored earrings", "pale glasses", "blue_hair_ornament", "gold mask", "pale ribbon", "multicolored_bow", "gold_earrings", "grey necklace", "pale necklace", "grey_hair_ornament", "green necklace", "blue_scarf", "dark_mask", "teal_hairclip", "pale_bow", "red_scarf"], "pose": ["gentle techwear pose", "intense butler pose", "bunny pose", "dreamy maid pose", "dreamy casual pose", "dynamic maid pose", "japanese pose", "bright beautiful pose", "cinematic idol pose", "gentle winter pose", "soft casual pose", "dynamic chinese pose", "dreamy fantasy pose", "night pose", "cinematic butler pose", "soft fantasy pose", "dramatic fantasy pose", "bright witch pose", "detailed sporty pose", "mating press", "gentle chinese pose", "dark idol pose", "dramatic autumn pose", "gentle witch pose", "cinematic autumn pose", "detailed gothic pose", "dark dragon pose", "cinematic maid pose", "soft dragon pose", "casual_pose", "gentle wolf pose", "dynamic nurse pose", "intense modern pose", "dynamic fox pose", "bright summer pose", "one leg raised", "dynamic wolf pose", "intense techwear pose", "cinematic summer pose", "cinematic demon pose", "intense angel pose", "dramatic cool pose", "walking", "cinematic dragon pose", "side entry sex", "chinese pose", "lactation", "stylish cat pose", "butler pose", "dynamic spring pose", "dark fantasy pose", "intense maid pose", "standing", "intense fox pose", "gentle casual pose", "dark traditional pose", "stylish autumn pose", "stylish spring pose", "intense chinese pose", "dark casual pose", "japanese_pose", "looking at viewer", "soft demon pose", "detailed idol pose", "cinematic techwear pose", "dynamic angel pose", "dark autumn pose", "intense fantasy pose", "detailed cute pose", "dynamic butler pose", "beautiful pose", "fantasy_pose", "detailed beautiful pose", "dynamic traditional pose", "fox pose", "gentle traditional pose", "stylish casual pose", "dramatic dragon pose", "dreamy beautiful pose", "gentle nurse pose", "dark cat pose", "detailed summer pose", "bright night pose", "gentle fox pose", "dreamy summer pose", "stylish nurse pose", "stylish butler pose", "breeding press", "idol_pose", "intense summer pose", "dreamy techwear pose", "sporty pose", "cinematic fox pose", "stylish fox pose", "stylish chinese pose", "intense japanese pose", "dramatic summer pose", "stylish demon pose", "dreamy nurse pose", "intense elegant pose", "handjob", "spring_pose", "gentle cute pose", "dreamy japanese pose", "cute_pose", "traditional pose", "stylish japanese pose", "dark beautiful pose", "detailed dragon pose", "stylish night pose", "winter_pose", "detailed cool pose", "gentle spring pose", "gentle autumn pose", "intense bunny pose", "walking upside down", "dark sporty pose", "dynamic beautiful pose", "bright autumn pose", "bright butler pose", "kneeling", "dark fox pose", "cool pose", "intense cute pose", "dreamy winter pose", "dramatic maid pose", "gentle summer pose", "bright wolf pose", "gentle japanese pose", "dramatic cat pose", "soft maid pose", "detailed chinese pose", "soft gothic pose", "stylish elegant pose", "dark angel pose", "bright maid pose", "elegant pose", "detailed casual pose", "dark cool pose", "cinematic casual pose", "bright gothic pose", "dreamy cute pose", "dramatic spring pose", "dramatic gothic pose", "vaginal sex", "dreamy fox pose", "intense sporty pose", "bright japanese pose", "chinese_pose", "stylish beautiful pose", "cinematic wolf pose", "breast milk", "bright winter pose", "gentle angel pose", "elegant_pose", "dynamic sporty pose", "dynamic demon pose", "cinematic chinese pose", "cinematic bunny pose", "dreamy chinese pose", "cinematic beautiful pose", "bright fantasy pose", "stylish fantasy pose", "soft traditional pose", "penis inside pussy", "detailed techwear pose", "creampie", "bright fox pose", "reading a book", "stylish traditional pose", "dreamy demon pose", "dramatic casual pose", "intense night pose", "intense dragon pose", "cum on breasts", "sporty_pose", "gothic_pose", "soft japanese pose", "bright techwear pose", "intense idol pose", "detailed witch pose", "dynamic gothic pose", "bright cute pose", "cinematic traditional pose", "cum on face", "spring pose", "gentle night pose", "bright idol pose", "bright modern pose", "soft night pose", "dramatic modern pose", "cat pose", "dreamy spring pose", "dark bunny pose", "dark demon pose", "soft beautiful pose", "summer pose", "cute pose", "gentle cool pose", "bunny_pose", "angel pose", "dreamy cat pose", "dynamic night pose", "dramatic japanese pose", "dreamy autumn pose", "modern_pose", "detailed modern pose", "dreamy idol pose", "gentle bunny pose", "intense gothic pose", "intense beautiful pose", "dreamy modern pose", "autumn pose", "stylish summer pose", "dynamic fantasy pose", "stylish winter pose", "detailed autumn pose", "dynamic cat pose", "cinematic elegant pose", "detailed elegant pose", "intense traditional pose", "nurse pose", "demon pose", "detailed demon pose", "idol pose", "detailed angel pose", "bright cool pose", "dark wolf pose", "cinematic fantasy pose", "dark summer pose", "dynamic modern pose", "dreamy wolf pose", "stylish techwear pose", "dramatic winter pose", "cinematic japanese pose", "detailed fantasy pose", "dramatic nurse pose", "soft winter pose", "dramatic butler pose", "stylish sporty pose", "holding book", "intense nurse pose", "bright chinese pose", "intense cat pose", "dark nurse pose", "soft nurse pose", "dramatic angel pose", "dramatic traditional pose", "gentle gothic pose", "dynamic pose", "soft butler pose", "witch pose", "gentle cat pose", "intense spring pose", "doggystyle", "autumn_pose", "dynamic summer pose", "intense casual pose", "cinematic nurse pose", "detailed winter pose", "dark gothic pose", "intense winter pose", "dreamy butler pose", "maid_pose", "dynamic casual pose", "detailed maid pose", "gentle dragon pose", "cinematic gothic pose", "soft angel pose", "bright dragon pose", "cinematic angel pose", "soft autumn pose", "dreamy elegant pose", "dynamic elegant pose", "dynamic japanese pose", "blowjob", "dynamic winter pose", "dragon_pose", "gentle modern pose", "dreamy night pose", "lying", "dramatic witch pose", "detailed traditional pose", "soft summer pose", "adjusting glasses", "witch_pose", "dramatic sporty pose", "gentle beautiful pose", "arms up", "dark elegant pose", "dreamy traditional pose", "bright nurse pose", "traditional_pose", "bright spring pose", "cinematic night pose", "breastjob", "stylish angel pose", "soft idol pose", "dreamy gothic pose", "dark butler pose", "bright cat pose", "gentle sporty pose", "cinematic winter pose", "looking back", "dark witch pose", "intense witch pose", "butler_pose", "bright casual pose", "cinematic modern pose", "stylish cool pose", "dramatic bunny pose", "dramatic techwear pose", "soft sporty pose", "stylish idol pose", "stylish wolf pose", "reaching toward viewer", "wolf_pose", "fox_pose", "soft fox pose", "gothic pose", "intense autumn pose", "cinematic witch pose", "dreamy bunny pose", "dynamic witch pose", "detailed cat pose", "night_pose", "dynamic idol pose", "dramatic night pose", "bright sporty pose", "soft elegant pose", "techwear pose", "dreamy sporty pose", "gentle maid pose", "gentle fantasy pose", "cinematic spring pose", "missionary position", "modern pose", "soft cat pose", "winter pose", "dramatic fox pose", "cinematic sporty pose", "dreamy angel pose", "dreamy witch pose", "dynamic cool pose", "bright bunny pose", "dynamic techwear pose", "dark winter pose", "dramatic wolf pose", "dramatic idol pose", "detailed wolf pose", "cinematic cool pose", "wolf pose", "soft spring pose", "stylish cute pose", "nurse_pose", "stylish maid pose", "dramatic demon pose", "dynamic cute pose", "dark techwear pose", "thighjob", "waving", "dreamy cool pose", "beautiful_pose", "dramatic chinese pose", "soft bunny pose", "fantasy pose", "soft wolf pose", "cool_pose", "detailed spring pose", "bright elegant pose", "dreamy dragon pose", "soft witch pose", "dark chinese pose", "gentle idol pose", "stylish modern pose", "soft cool pose", "bright traditional pose", "detailed nurse pose", "dynamic dragon pose", "demon_pose", "stylish dragon pose", "dramatic elegant pose", "soft cute pose", "dynamic autumn pose", "maid pose", "bright demon pose", "detailed japanese pose", "bright angel pose", "summer_pose", "intense cool pose", "stylish gothic pose", "cinematic cat pose", "dramatic cute pose", "techwear_pose", "soft modern pose", "stylish witch pose", "gentle butler pose", "stylish bunny pose", "dark modern pose", "holding teacup", "intense wolf pose", "detailed butler pose", "cinematic cute pose", "dark maid pose", "angel_pose", "cowgirl position", "casual pose", "dark cute pose", "dynamic bunny pose", "dark japanese pose", "dragon pose", "dramatic beautiful pose", "cat_pose", "detailed fox pose", "intense demon pose", "gentle elegant pose", "running", "soft techwear pose", "sitting", "soft chinese pose", "gentle demon pose", "detailed night pose", "detailed bunny pose"], "background": ["green sunset", "traditional scene", "dynamic witch scene", "traditional_room", "cat_scene", "intense sporty scene", "gentle sporty background", "blonde forest", "light forest", "fantasy background", "gentle winter background", "brown garden", "bright elegant room", "bright cool background", "night mood", "blue_morning", "witch_room", "dreamy cat background", "dramatic techwear room", "soft sporty background", "stylish elegant room", "grey_forest", "bright modern scene", "blonde beach", "nurse room", "green_night", "beautiful_room", "purple_forest", "dramatic chinese background", "silver room", "dynamic techwear scene", "brown_clouds", "gentle cool scene", "aqua_clouds", "cinematic traditional scene", "white morning", "gold night", "soft fantasy scene", "detailed night mood", "aqua_street", "pink_temple", "soft fantasy background", "dark casual room", "red morning", "blue_city", "dark casual background", "light river", "red sky", "intense fantasy background", "purple river", "dreamy bunny background", "dark gothic scene", "teal_garden", "silver_city", "brown lake", "red bedroom", "white_lake", "gentle beautiful scene", "stylish idol scene", "dark beautiful scene", "grey sunset", "dramatic night girl", "intense autumn background", "intense dragon background", "black_clouds", "black_river", "pink_rooftop", "bright casual background", "gentle summer scene", "teal room", "intense nurse room", "red_street", "multicolored_rooftop", "stylish fantasy room", "dramatic cool scene", "detailed fantasy room", "dynamic bunny background", "dreamy bunny scene", "cinematic night background", "cinematic bunny scene", "detailed casual background", "blonde_night", "dynamic angel background", "bright cute background", "purple sunset", "bright cat scene", "detailed cute background", "teal forest", "orange_mountain", "dramatic modern room", "autumn_scene", "pink morning", "dynamic maid room", "dark fantasy room", "light_shrine", "light_classroom", "blonde_classroom", "green_morning", "orange_bedroom", "orange_sky", "soft idol room", "dramatic cat scene", "teal morning", "pink room", "intense japanese room", "gold_beach", "dark_lake", "soft cute room", "intense idol background", "cinematic autumn background", "cinematic elegant room", "dreamy japanese scene", "orange sunset", "gold_clouds", "white classroom", "intense witch scene", "dynamic elegant room", "dark japanese scene", "purple_clouds", "dynamic techwear background", "multicolored_night", "dreamy summer scene", "green clouds", "dynamic japanese background", "pale_mountain", "cinematic winter scene", "angel_scene", "silver_garden", "bright fox background", "maid_background", "gentle cat background", "soft spring scene", "summer_room", "gentle beautiful room", "blue_street", "dark gothic room", "gentle summer background", "green temple", "intense cat room", "intense nurse background", "brown room", "yellow temple", "stylish nurse scene", "dreamy techwear scene", "stylish angel scene", "stylish bunny scene", "dark cool scene", "dreamy beautiful scene", "grey night", "cinematic cat background", "soft summer scene", "grey river", "dark japanese room", "stylish idol room", "purple clouds", "dynamic modern background", "blonde_clouds", "purple mountain", "chinese_scene", "winter background", "blonde_sunset", "silver_street", "bright chinese room", "dreamy witch background", "bunny_background", "intense techwear room", "gold morning", "intense techwear scene", "red river", "winter room", "grey forest", "white_sunset", "dark idol background", "grey_rooftop", "dynamic fox scene", "soft traditional scene", "intense summer room", "bright winter scene", "dark_river", "grey_garden", "pink clouds", "stylish maid room", "black_rooftop", "gold sky", "bright cool scene", "dynamic elegant scene", "pale_city", "soft maid background", "orange forest", "detailed elegant background", "aqua sunset", "orange beach", "dramatic cute room", "pale_street", "white_morning", "gold_sky", "blue classroom", "bright winter background", "cinematic winter background", "dramatic modern scene", "stylish japanese scene", "grey_street", "intense winter room", "cat background", "bright night mood", "intense japanese background", "detailed casual scene", "dreamy sporty scene", "gentle traditional scene", "blonde_morning", "orange city", "silver shrine", "dynamic japanese room", "detailed demon scene", "detailed bunny scene", "dynamic gothic scene", "orange_night", "blue night", "yellow beach", "dark butler scene", "detailed sporty scene", "intense japanese scene", "brown_city", "teal_classroom", "cinematic gothic room", "dark techwear background", "soft spring room", "green forest", "intense gothic scene", "stylish demon scene", "dynamic traditional room", "blue_temple", "bright night illustration", "intense demon room", "intense idol scene", "intense casual background", "grey_beach", "red classroom", "stylish night scene", "stylish angel room", "dramatic cat background", "detailed beautiful scene", "spring background", "dramatic fox background", "brown_room", "dynamic sporty background", "dramatic idol scene", "teal_night", "orange_morning", "intense cool scene", "dreamy demon background", "bright traditional background", "detailed beautiful background", "elegant_room", "dramatic dragon scene", "dramatic bunny room", "pink_night", "pale_room", "silver sunset", "yellow_river", "summer scene", "cinematic butler scene", "aqua_beach", "dark cat scene", "dramatic winter room", "intense wolf background", "stylish cute scene", "stylish night room", "pale_beach", "dynamic dragon room", "bright maid scene", "soft fox background", "butler background", "soft summer background", "chinese scene", "gentle fantasy scene", "dynamic witch room", "cinematic night room", "orange_sunset", "dark sky", "light_sunset", "idol background", "cat scene", "detailed dragon background", "white_city", "bright japanese room", "gentle gothic room", "dreamy nurse room", "pale clouds", "intense sporty room", "dark autumn room", "green mountain", "red_classroom", "intense cat scene", "yellow clouds", "dark techwear scene", "aqua beach", "butler room", "dark night", "techwear room", "white forest", "cool background", "yellow shrine", "gold_bedroom", "dark cute background", "summer_background", "pink_sunset", "gentle nurse scene", "dreamy modern background", "fantasy room", "dreamy chinese room", "detailed modern scene", "red clouds", "cinematic dragon scene", "angel background", "pink_room", "pale_river", "orange temple", "multicolored river", "cinematic angel background", "blue lake", "teal street", "red_garden", "dark morning", "dreamy elegant background", "intense traditional scene", "detailed techwear room", "dreamy idol background", "witch scene", "detailed autumn scene", "angel_room", "night background", "intense night girl", "dreamy maid scene", "soft wolf scene", "gentle japanese room", "dramatic bunny scene", "dark idol scene", "dynamic maid scene", "silver garden", "stylish beautiful background", "blonde morning", "butler_background", "gentle butler background", "gentle demon scene", "dramatic night background", "dark sporty room", "intense casual scene", "dramatic cute background", "pink lake", "bright butler room", "dreamy summer background", "blonde shrine", "fox background", "intense gothic background", "dark traditional scene", "intense sporty background", "dynamic night room", "pink river", "orange_garden", "shrine room", "dark witch background", "bright beautiful background", "teal_clouds", "dynamic elegant background", "maid scene", "demon_room", "cinematic beautiful room", "pink_clouds", "green room", "dramatic summer room", "cinematic spring scene", "soft elegant background", "dark cat room", "stylish beautiful room", "dynamic night illustration", "gentle fantasy room", "dramatic spring scene", "multicolored temple", "fantasy_room", "bright cat room", "techwear_background", "dreamy butler background", "dark witch scene", "pink temple", "gentle spring room", "orange_temple", "suzuran_(arknights)", "gold shrine", "dynamic gothic room", "yellow mountain", "dreamy angel scene", "dramatic bunny background", "pale classroom", "dramatic wolf scene", "soft autumn scene", "dramatic beautiful room", "stylish techwear scene", "dramatic butler background", "gold mountain", "stylish demon background", "dynamic wolf scene", "black_sky", "dreamy night background", "orange river", "aqua mountain", "dark bedroom", "stylish modern background", "gentle witch scene", "gentle elegant room", "detailed nurse scene", "night room", "soft dragon background", "red_sky", "intense spring background", "gentle modern background", "multicolored_shrine", "dramatic fantasy background", "soft idol background", "bright fantasy room", "silver_classroom", "yellow street", "yellow lake", "gentle sporty room", "yellow_garden", "white_forest", "cinematic nurse scene", "blonde street", "red_forest", "blue street", "red street", "dark techwear room", "dark demon scene", "multicolored city", "dramatic spring room", "light_night", "light mountain", "gothic scene", "blonde night", "detailed fox background", "intense chinese background", "silver mountain", "sporty room", "purple city", "dynamic sporty scene", "dramatic nurse room", "dark_beach", "grey_room", "red temple", "summer background", "dreamy modern room", "soft casual background", "pale lake", "bright modern background", "detailed summer room", "stylish fox scene", "gentle spring background", "demon_scene", "dreamy cat room", "cinematic elegant scene", "intense summer background", "teal bedroom", "detailed demon background", "white river", "intense winter scene", "cinematic nurse room", "dreamy cat scene", "gentle chinese scene", "white_room", "dramatic maid room", "cinematic witch background", "aqua_temple", "dynamic angel scene", "black river", "cinematic wolf background", "blue_sky", "cinematic dragon room", "cinematic idol background", "grey_city", "silver city", "dynamic spring room", "orange_shrine", "bright chinese scene", "multicolored_sky", "gold rooftop", "orange street", "red_morning", "silver temple", "fox scene", "gentle casual background", "intense butler room", "pink_mountain", "cinematic spring room", "blue temple", "cool_scene", "detailed cat background", "dark fox room", "dreamy chinese scene", "casual room", "dreamy angel room", "blonde_beach", "brown_forest", "demon background", "stylish dragon background", "teal_bedroom", "stylish cat scene", "maid_scene", "orange classroom", "dramatic japanese background", "orange_beach", "grey sky", "dreamy wolf scene", "dramatic butler scene", "gentle fantasy background", "dynamic techwear room", "dynamic butler scene", "green_classroom", "aqua lake", "pink beach", "blonde bedroom", "white bedroom", "dynamic fox room", "cinematic summer room", "gentle fox room", "dramatic idol room", "sporty background", "bright casual scene", "dark nurse background", "dynamic cat room", "black_beach", "pink_bedroom", "dark maid background", "dreamy night girl", "detailed cat scene", "dynamic winter background", "dark butler room", "brown beach", "orange bedroom", "red lake", "light_forest", "dark lake", "stylish sporty scene", "detailed demon room", "white_shrine", "dark temple", "bright beautiful scene", "multicolored_lake", "bright wolf room", "cinematic autumn room", "bright witch scene", "autumn background", "dark angel scene", "soft butler scene", "brown_sky", "blonde river", "cat room", "dark sporty background", "fantasy_scene", "cinematic modern scene", "cool room", "teal_room", "cinematic autumn scene", "gentle fox scene", "aqua room", "bright witch background", "dark_sky", "dreamy cute background", "bright cat background", "gothic background", "stylish cat room", "silver_rooftop", "black_shrine", "dramatic techwear scene", "purple_temple", "aqua clouds", "green_lake", "gentle summer room", "detailed dragon room", "yellow city", "bright fox scene", "black city", "bright autumn scene", "cinematic maid room", "fox room", "dreamy maid background", "gentle angel scene", "fantasy scene", "dreamy night room", "silver_night", "white street", "stylish elegant background", "multicolored rooftop", "intense summer scene", "dramatic winter scene", "butler scene", "bright sporty room", "gentle elegant background", "japanese scene", "cinematic cat room", "elegant room", "bright beautiful room", "dark fantasy background", "dreamy traditional scene", "detailed techwear background", "black_lake", "light_city", "modern_background", "white_beach", "blonde_room", "purple temple", "cinematic techwear scene", "intense elegant room", "soft demon room", "butler_scene", "dark beautiful room", "gentle cute scene", "dragon scene", "pink_beach", "soft techwear scene", "intense angel scene", "aqua_classroom", "dragon_room", "white beach", "nurse_background", "dark forest", "stylish bunny room", "spring room", "gentle fox background", "dark wolf room", "black_night", "brown street", "yellow_forest", "brown classroom", "bright sporty background", "bright nurse scene", "aqua garden", "intense spring scene", "soft night illustration", "grey_temple", "intense casual room", "dynamic sporty room", "cinematic cool scene", "stylish maid background", "pale_shrine", "bright nurse background", "gentle gothic scene", "intense maid scene", "blue rooftop", "dramatic demon background", "dramatic nurse scene", "brown forest", "dynamic cool room", "pink sky", "autumn_room", "dreamy demon room", "green_river", "light clouds", "gentle night girl", "demon scene", "grey street", "cinematic wolf room", "detailed chinese background", "dramatic angel scene", "dynamic nurse scene", "white_garden", "yellow_room", "cinematic bunny background", "cinematic cool background", "intense winter background", "blonde_forest", "yellow morning", "pale rooftop", "red city", "casual_background", "pink_classroom", "red garden", "dramatic night illustration", "dark maid room", "dark cool room", "black_mountain", "black_street", "soft cat room", "soft modern room", "multicolored shrine", "stylish cat background", "library", "aqua night", "soft techwear room", "aqua_room", "cinematic sporty background", "blue beach", "white garden", "intense butler scene", "spring scene", "yellow forest", "pale_classroom", "dragon room", "gentle winter room", "dark bunny scene", "dreamy fantasy scene"], "effect": ["dynamic cool portrait", "intense chinese portrait", "cinematic witch angle", "fantasy lighting", "winter_lighting", "dark winter portrait", "dark idol close-up", "dreamy maid lighting", "gothic_lighting", "summer close-up", "detailed angel close-up", "dynamic techwear angle", "soft traditional lighting", "detailed summer composition", "angel close-up", "dynamic fantasy portrait", "winter lighting", "stylish bunny lighting", "cute portrait", "soft butler lighting", "bright spring close-up", "demon angle", "gentle cool composition", "gentle casual angle", "detailed casual lighting", "traditional_composition", "stylish techwear composition", "techwear_portrait", "dynamic dragon lighting", "intense chinese angle", "dark bunny portrait", "stylish autumn portrait", "stylish night close-up", "intense gothic portrait", "bright summer portrait", "soft modern composition", "dark cool composition", "angel_composition", "bright traditional lighting", "gentle cool close-up", "stylish japanese lighting", "soft sporty portrait", "bright techwear portrait", "nurse_portrait", "bright angel angle", "dynamic fox composition", "sporty_lighting", "bright cat portrait", "bright night close-up", "dramatic fox close-up", "bright modern portrait", "techwear_composition", "dramatic fantasy composition", "cute composition", "dreamy nurse composition", "angel portrait", "dynamic wolf lighting", "gentle wolf portrait", "angel_lighting", "cinematic night portrait", "dynamic gothic lighting", "dynamic japanese angle", "dynamic demon composition", "dreamy maid composition", "night_lighting", "japanese_close-up", "bright night angle", "dreamy autumn portrait", "cinematic casual close-up", "cinematic sporty angle", "intense modern angle", "dynamic cute angle", "bright winter angle", "detailed cool lighting", "dynamic beautiful angle", "detailed nurse close-up", "intense spring angle", "detailed dragon composition", "gentle dragon portrait", "dreamy bunny lighting", "detailed butler close-up", "dark dragon composition", "soft dragon close-up", "bright fox portrait", "cinematic nurse portrait", "intense wolf angle", "dramatic cute lighting", "dreamy spring angle", "dynamic wolf portrait", "dreamy gothic angle", "dramatic autumn portrait", "elegant_composition", "cinematic angel angle", "dynamic japanese portrait", "dramatic cute composition", "cinematic bunny composition", "stylish traditional angle", "intense cool close-up", "dynamic nurse close-up", "detailed bunny composition", "gentle chinese lighting", "idol angle", "bright dragon lighting", "detailed witch composition", "soft winter angle", "japanese portrait", "dreamy butler lighting", "dynamic casual lighting", "stylish butler composition", "winter close-up", "soft autumn portrait", "dramatic gothic close-up", "cinematic cool angle", "stylish cat composition", "spring composition", "cinematic cat close-up", "gentle chinese composition", "detailed traditional angle", "dreamy fox lighting", "dynamic cute lighting", "winter_composition", "gentle dragon composition", "gentle gothic composition", "gentle maid close-up", "cinematic angel portrait", "dreamy chinese composition", "intense elegant lighting", "demon_portrait", "dreamy angel lighting", "detailed chinese composition", "chinese angle", "cinematic fox close-up", "dark chinese composition", "dramatic elegant composition", "dynamic maid portrait", "bright traditional portrait", "gentle witch close-up", "intense nurse angle", "soft chinese angle", "cinematic chinese close-up", "dynamic summer angle", "dreamy japanese angle", "detailed autumn angle", "dark witch close-up", "gentle demon lighting", "dramatic lighting", "gentle witch portrait", "dark cute portrait", "cinematic butler close-up", "stylish nurse lighting", "maid_composition", "cinematic summer portrait", "bright fox lighting", "dreamy elegant angle", "intense witch lighting", "stylish summer angle", "cinematic elegant close-up", "dreamy techwear close-up", "bright idol composition", "soft elegant lighting", "dynamic japanese lighting", "spring lighting", "detailed gothic lighting", "detailed cute close-up", "stylish casual close-up", "gentle night close-up", "bright casual close-up", "dramatic gothic composition", "cinematic fox lighting", "bright nurse close-up", "bright gothic angle", "detailed winter composition", "bright maid composition", "cinematic japanese angle", "gentle gothic portrait", "detailed cool close-up", "dynamic fox lighting", "soft gothic composition", "soft winter portrait", "detailed winter lighting", "detailed cute angle", "japanese_lighting", "idol_lighting", "dark sporty portrait", "dreamy wolf close-up", "night composition", "cinematic japanese close-up", "dark japanese composition", "intense cat angle", "dreamy traditional close-up", "dramatic witch angle", "bright casual portrait", "butler composition", "dark autumn close-up", "summer composition", "dreamy summer angle", "detailed witch angle", "fox_composition", "autumn_close-up", "techwear_angle", "intense modern close-up", "gentle gothic close-up", "gentle angel close-up", "cinematic fantasy close-up", "dynamic butler composition", "detailed techwear portrait", "cinematic butler composition", "gentle fox angle", "soft beautiful composition", "intense cute portrait", "chinese portrait", "dreamy cat portrait", "motion blur", "stylish elegant angle", "stylish gothic composition", "butler_lighting", "dark butler angle", "dreamy cute composition", "detailed fantasy portrait", "elegant portrait", "dynamic night lighting", "dramatic dragon angle", "soft spring composition", "dreamy angel angle", "dragon lighting", "cinematic nurse close-up", "dramatic sporty lighting", "dark gothic lighting", "stylish idol lighting", "dramatic bunny composition", "cinematic fox portrait", "gothic_angle", "dynamic bunny close-up", "dramatic maid close-up", "soft cute close-up", "cinematic spring lighting", "dramatic angel lighting", "dreamy winter angle", "traditional close-up", "dramatic cat lighting", "gentle cute close-up", "cinematic summer composition", "winter angle", "dreamy elegant close-up", "dark chinese lighting", "dramatic bunny lighting", "bright sporty portrait", "gentle autumn lighting", "dramatic fantasy angle", "dynamic cool angle", "stylish bunny close-up", "dynamic modern portrait", "detailed techwear lighting", "demon_lighting", "dark fox composition", "demon_close-up", "stylish beautiful angle", "beautiful close-up", "elegant_portrait", "bright spring angle", "intense traditional composition", "beautiful_composition", "soft dragon lighting", "stylish winter lighting", "intense spring portrait", "cinematic casual lighting", "detailed demon lighting", "dramatic summer angle", "cinematic cool close-up", "dreamy autumn lighting", "dynamic summer close-up", "dreamy summer composition", "dark cat close-up", "cinematic summer close-up", "intense angel angle", "stylish cat portrait", "soft spring portrait", "dark fantasy close-up", "gentle winter angle", "bunny close-up", "dreamy witch composition", "cinematic beautiful lighting", "gentle summer angle", "gentle wolf lighting", "stylish traditional close-up", "dutch angle", "soft cute composition", "dynamic idol angle", "stylish butler angle", "bright night lighting", "gentle idol portrait", "stylish demon close-up", "dreamy traditional angle", "stylish spring angle", "cinematic maid lighting", "dreamy summer lighting", "warm bedroom light", "dark modern angle", "gentle nurse lighting", "gentle modern angle"]};

  function v152SplitTags(text){
    return (text || "").split(",").map(s => s.trim()).filter(Boolean);
  }

  function v152JoinTags(tags){
    const out = [];
    const seen = new Set();
    for (const tag of tags) {
      const t = (tag || "").trim();
      if (!t) continue;
      const k = t.toLowerCase();
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(t);
    }
    return out.join(", ");
  }

  function v152Pick(arr, n, existing){
    if (!Array.isArray(arr) || !arr.length || n <= 0) return [];
    const source = arr.filter(x => !existing.has(String(x).toLowerCase()));
    const picked = [];
    const used = new Set();
    while (picked.length < n && source.length > 0) {
      const idx = Math.floor(Math.random() * source.length);
      const value = source[idx];
      source.splice(idx, 1);
      const k = String(value).toLowerCase();
      if (used.has(k)) continue;
      used.add(k);
      picked.push(value);
    }
    return picked;
  }

  function v152IsCoreTag(tag){
    const t = (tag || "").toLowerCase();
    return [
      "1girl","solo","1boy","2boys","3boys","multiple boys","pov",
      "sfw","nsfw","uncensored","censored","no text"
    ].includes(t);
  }

  function v152Matches(tag, arr){
    return arr.some(rx => rx.test(tag));
  }

  const V152_LOW = [
    /^very aesthetic$/i, /^newest$/i, /^highly detailed$/i, /^detailed wallpaper$/i,
    /^ultra-?detailed$/i, /^cg illustration$/i, /^dramatic lighting$/i,
    /^atmospheric lighting$/i, /^cinematic lighting$/i, /^cinematic shadows$/i,
    /^high contrast shadows$/i, /^soft shadows$/i, /^glowing particles$/i,
    /^floating petals$/i, /^motion blur$/i, /^wind$/i, /^hair flowing$/i,
    /^moonlight$/i, /^soft sunlight$/i, /^dreamy .*$/i, /^soft .* background$/i,
    /^cinematic .* background$/i, /^bright .* background$/i, /^gentle .* background$/i
  ];

  const V152_MED = [
    /^close-?up$/i, /^upper body$/i, /^cowboy shot$/i, /^full body$/i,
    /^front view$/i, /^side view$/i, /^from above$/i, /^low angle$/i, /^high angle$/i,
    /^over-?the-?shoulder view$/i, /^dutch angle$/i, /^diagonal camera$/i, /^off-?center camera$/i,
    /^dynamic composition$/i, /^diagonal composition$/i, /^strong perspective$/i,
    /^extreme perspective$/i, /^strong foreshortening$/i, /^dramatic crop$/i, /^cinematic crop$/i,
    /^natural expression$/i, /^soft smile$/i, /^playful smile$/i, /^confident smile$/i,
    /^mischievous smile$/i, /^sleepy expression$/i, /^sleepy smile$/i,
    /^detailed .* eyes$/i, /^beautiful .* eyes$/i, /^gentle .* expression$/i,
    /^bright .* expression$/i, /^intense .* expression$/i
  ];

  const V152_GENERIC_REPLACE = [
    /^very aesthetic$/i, /^newest$/i, /^highly detailed$/i, /^cg illustration$/i,
    /^natural expression$/i, /^soft smile$/i, /^playful smile$/i, /^confident smile$/i,
    /^mischievous smile$/i, /^sleepy expression$/i, /^dreamy .*$/i,
    /^bright .* expression$/i, /^gentle .* expression$/i, /^intense .* expression$/i,
    /^dynamic .* outfit$/i, /^cinematic .* outfit$/i, /^soft .* background$/i,
    /^cinematic .* background$/i, /^gentle .* background$/i, /^bright .* background$/i
  ];

  function v152Diversify(text){
    let tags = v152SplitTags(text);
    if (!tags.length) return text;

    const existing = new Set(tags.map(t => t.toLowerCase()));
    const extra = [];

    // 从 6k 级大池里直接抽，优先补角色/服装/场景/动作差异
    extra.push(...v152Pick(V152_BIG_POOL.body, 1, existing));
    extra.push(...v152Pick(V152_BIG_POOL.hair, 1, existing));
    extra.push(...v152Pick(V152_BIG_POOL.face, 1, existing));
    extra.push(...v152Pick(V152_BIG_POOL.clothing, 2, existing));
    extra.push(...v152Pick(V152_BIG_POOL.accessory, 1, existing));
    extra.push(...v152Pick(V152_BIG_POOL.pose, 1, existing));
    extra.push(...v152Pick(V152_BIG_POOL.background, 1, existing));
    extra.push(...v152Pick(V152_BIG_POOL.effect, 1, existing));

    // 先删一部分泛词，再塞入真正大池词
    let removable = 0;
    tags = tags.filter(tag => {
      if (removable >= extra.length) return true;
      if (v152IsCoreTag(tag)) return true;
      if (v152Matches(tag, V152_GENERIC_REPLACE)) {
        removable += 1;
        return false;
      }
      return true;
    });

    for (const t of extra) {
      if (!existing.has(String(t).toLowerCase())) tags.push(t);
    }

    return v152JoinTags(tags);
  }

  function v152Compact(text){
    let tags = v152SplitTags(text);

    // 去重
    const seen = new Set();
    tags = tags.filter(tag => {
      const k = tag.toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });

    if (tags.length <= 20) return tags.join(", ");

    let target = tags.length;
    if (tags.length >= 48) target = tags.length - 28;
    else if (tags.length >= 42) target = tags.length - 24;
    else if (tags.length >= 36) target = tags.length - 20;
    else if (tags.length >= 30) target = tags.length - 16;
    else if (tags.length >= 24) target = tags.length - 12;

    target = Math.max(target, 18);

    function trimByMatch(list, patterns, limit){
      let out = [];
      let kept = 0;
      for (const tag of list) {
        if (v152Matches(tag, patterns)) {
          if (kept < limit) {
            out.push(tag);
            kept += 1;
          }
        } else {
          out.push(tag);
        }
      }
      return out;
    }

    const QUALITY = [/^masterpiece$/i,/^best quality$/i,/^very aesthetic$/i,/^newest$/i,/^highly detailed$/i,/^cg illustration$/i,/^ultra-?detailed$/i];
    const CAMERA = [/^close-?up$/i,/^upper body$/i,/^cowboy shot$/i,/^full body$/i,/^front view$/i,/^side view$/i,/^from above$/i,/^low angle$/i,/^high angle$/i,/^over-?the-?shoulder view$/i,/^dutch angle$/i,/^diagonal camera$/i,/^off-?center camera$/i];
    const COMP = [/^dynamic composition$/i,/^diagonal composition$/i,/^strong perspective$/i,/^extreme perspective$/i,/^strong foreshortening$/i,/^dramatic crop$/i,/^cinematic crop$/i];
    const EFFECT = [/^dramatic lighting$/i,/^atmospheric lighting$/i,/^cinematic lighting$/i,/^cinematic shadows$/i,/^high contrast shadows$/i,/^soft shadows$/i,/^moonlight$/i,/^soft sunlight$/i,/^glowing particles$/i,/^floating petals$/i,/^motion blur$/i,/^wind$/i,/^hair flowing$/i];

    tags = trimByMatch(tags, QUALITY, 2);
    tags = trimByMatch(tags, CAMERA, 2);
    tags = trimByMatch(tags, COMP, 1);
    tags = trimByMatch(tags, EFFECT, 1);

    if (tags.length > target) {
      for (let i = tags.length - 1; i >= 0 && tags.length > target; i--) {
        const tag = tags[i];
        if (v152IsCoreTag(tag)) continue;
        if (v152Matches(tag, V152_LOW)) tags.splice(i, 1);
      }
    }
    if (tags.length > target) {
      for (let i = tags.length - 1; i >= 0 && tags.length > target; i--) {
        const tag = tags[i];
        if (v152IsCoreTag(tag)) continue;
        if (v152Matches(tag, V152_MED)) tags.splice(i, 1);
      }
    }
    if (tags.length > target) {
      const veryGeneric = [/^beautiful .*$/i,/^detailed .*$/i,/^intense .*$/i,/^stylish .*$/i,/^cinematic .*$/i,/^soft .*$/i,/^dramatic .*$/i,/^dreamy .*$/i,/^gentle .*$/i,/^bright .*$/i];
      for (let i = tags.length - 1; i >= 0 && tags.length > target; i--) {
        const tag = tags[i];
        if (v152IsCoreTag(tag)) continue;
        if (v152Matches(tag, veryGeneric)) tags.splice(i, 1);
      }
    }
    if (tags.length > target) {
      for (let i = tags.length - 1; i >= 0 && tags.length > target; i--) {
        const tag = tags[i];
        if (v152IsCoreTag(tag)) continue;
        tags.splice(i, 1);
      }
    }

    return tags.join(", ");
  }

  function v152ProcessTextarea(ta){
    if (!ta || ta.dataset.v152done === "1") return;
    const card = ta.closest("div");
    if (!card) return;
    const hasCopyBtn = Array.from(card.querySelectorAll("button")).some(btn => /复制这一条|copy/i.test((btn.textContent || "").trim()));
    if (!hasCopyBtn) return;

    const oldText = (("value" in ta ? ta.value : ta.textContent) || "").trim();
    if (!oldText) return;

    let text = oldText;
    text = v152Diversify(text);
    text = v152Compact(text);

    if ("value" in ta) ta.value = text;
    else ta.textContent = text;

    ta.dataset.v152done = "1";
  }

  function v152ProcessAll(root){
    (root || document).querySelectorAll("textarea").forEach(v152ProcessTextarea);
  }

  function v152Install(){
    v152ProcessAll(document);

    const obs = new MutationObserver((mutations) => {
      for (const m of mutations) {
        for (const node of m.addedNodes) {
          if (node && node.nodeType === 1) {
            v152ProcessAll(node);
          }
        }
      }
    });
    obs.observe(document.body, { childList: true, subtree: true });

    // 第二页每次重新生成后，旧 observer 可能先跑，这里再补一轮
    setInterval(() => v152ProcessAll(document), 1200);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", v152Install);
  } else {
    v152Install();
  }
})();




/* ===== v1.5.3 second-page full big-pool rewrite =====
   重写第二页批量生成：不再依赖原先十几个 pose/action。
   运行时直接从本地 activeTags 里构建 5000+ 固定候选池，并生成大动作池。
*/
(function(){
  const V153_CORE_KEEP = new Set([
    "1girl","solo","single focus","1boy","2boys","multiple boys","duo","threesome","group sex",
    "pov","male pov","sfw","explicit","uncensored","no text",
  ]);

  function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
  function shuffle(arr){
    const a=[...arr];
    for(let i=a.length-1;i>0;i--){
      const j=Math.floor(Math.random()*(i+1));
      [a[i],a[j]]=[a[j],a[i]];
    }
    return a;
  }
  function unique(arr){
    const out=[], seen=new Set();
    for(const x of arr){
      const s=String(x||"").trim();
      if(!s) continue;
      const k=s.toLowerCase();
      if(seen.has(k)) continue;
      seen.add(k); out.push(s);
    }
    return out;
  }
  function compact(parts){ return unique(parts).join(", ").replace(/,\s*,/g,", ").replace(/\s+/g," ").trim(); }
  function tagText(t){ return typeof t === "string" ? t : (t && (t.tag || t.name || t.en || t.text)) || ""; }
  function catText(t){ return (t && (t.cat || t.category || t.group || t.type || t.subCategory || t.subcat)) || ""; }
  function modeOk(t, mode){
    if(!t || typeof t === "string") return true;
    if(mode === "sfw" && t.mode === "nsfw") return false;
    if(mode === "nsfw" && t.mode === "sfw") return false;
    return true;
  }
  function norm(s){ return String(s||"").trim().toLowerCase(); }
  function safeBigTag(s){
    const t=norm(s);
    if(!t || t.length>64) return false;
    if(V153_CORE_KEEP.has(t)) return false;
    if(/watermark|signature|username|artist name|text focus|comic|speech bubble|english text/.test(t)) return false;
    if(/^bad |^worst |^lowres|censored|mosaic|bar censor|extra limb|bad anatomy|bad hands/.test(t)) return false;
    return true;
  }

  let V153_CACHE=null;
  function buildV153Pools(){
    if(V153_CACHE) return V153_CACHE;
    const raw = (typeof activeTags !== "undefined" && Array.isArray(activeTags)) ? activeTags : [];
    const byCat = {};
    for(const t of raw){
      const tag=tagText(t);
      if(!safeBigTag(tag)) continue;
      const cat=catText(t)||"misc";
      if(!byCat[cat]) byCat[cat]=[];
      byCat[cat].push(tag);
    }
    for(const k of Object.keys(byCat)) byCat[k]=unique(byCat[k]);

    const fixedBase = unique([
      ...(byCat.species||[]), ...(byCat.body||[]), ...(byCat.hair||[]), ...(byCat.eyes||[]), ...(byCat.face||[]),
      ...(byCat.expression||[]), ...(byCat.clothing||[]), ...(byCat.accessory||[]), ...(byCat.pose||[]),
      ...(byCat.background||[]), ...(byCat.camera||[]), ...(byCat.composition||[]), ...(byCat.lighting||[]),
      ...(byCat.effects||[]), ...(byCat.danbooru_general||[])
    ]).slice(0, 6000);

    const sfwActionSeeds = [
      "walking forward", "running toward viewer", "jumping lightly", "twirling around", "turning around suddenly",
      "looking back over shoulder", "reaching toward viewer", "leaning forward", "stepping toward camera", "kneeling down",
      "sitting on the edge", "lying on bed", "standing in strong wind", "opening door", "opening curtains",
      "holding phone", "holding flower", "holding book", "holding umbrella", "adjusting clothes", "fixing hair",
      "taking off jacket", "putting on glasses", "stretching after waking up", "crouching close to camera",
      "resting chin on hand", "covering mouth while laughing", "walking barefoot", "dancing in place", "spinning with skirt floating",
      "catching falling petals", "standing on tiptoe", "climbing stairs and looking back", "leaning on desk", "sitting on railing",
      "running through rain", "stepping over puddle", "walking through doorway", "peeking from behind door", "reaching upward",
      "falling through the air", "floating in zero gravity", "splashing water", "holding drink toward viewer", "reading under blanket",
      "brushing hair", "resting against window", "hiding behind curtain", "walking through crowd", "posing for a photo",
      "turning with hair swinging", "grabbing hat in wind", "pulling sleeve", "lifting skirt slightly", "checking reflection",
      "sitting cross-legged", "kneeling on bed", "lying on stomach", "looking over glasses", "tilting head",
      "raising one knee", "standing with one leg forward", "walking down stairs", "running up stairs", "sliding across floor",
      "holding hands behind back", "arms above head", "hands on hips", "one hand on chest", "one hand reaching out"
    ];

    const contexts = unique([
      ...(byCat.pose||[]), ...(byCat.background||[]), ...(byCat.clothing||[]), ...(byCat.accessory||[]),
      ...(byCat.expression||[]), ...(byCat.camera||[]), ...(byCat.composition||[]), ...(byCat.effects||[]),
      ...(byCat.danbooru_general||[])
    ]).filter(safeBigTag).slice(0, 1500);

    const actionBig=[];
    for(const v of sfwActionSeeds){
      for(const c of contexts){
        actionBig.push(`${v}, ${c}`);
        if(actionBig.length>=5600) break;
      }
      if(actionBig.length>=5600) break;
    }

    const nsfwCore = [
      ["missionary position, female lying on back, male on top, vaginal sex, penis inside pussy", "正常位"],
      ["missionary position, legs on shoulders, female lying on back, male on top, vaginal sex", "腿架肩正常位"],
      ["breeding press, mating press, female lying on back, knees pressed to chest, male on top, not cowgirl", "种付位"],
      ["doggystyle, on all fours, male behind, vaginal sex from behind", "后入位"],
      ["side entry sex, side lying position, one leg raised, vaginal sex from side", "侧入位"],
      ["cowgirl position, woman on top, straddling partner, vaginal sex", "骑乘位"],
      ["reverse cowgirl, woman on top facing away, vaginal sex", "反骑乘"],
      ["lifted sex, legs wrapped around waist, partner holding thighs, vaginal sex", "抱起插入"],
      ["wall sex, back against wall, one leg raised, vaginal sex", "墙边插入"],
      ["bed edge sex, hips lifted, partner standing at bed edge, vaginal sex", "床边插入"],
      ["bent over desk, hands on table, doggystyle from behind", "桌边后入"],
      ["mirror sex, hands on sink, male behind, mirror reflection visible", "镜前后入"],
      ["standing sex, one leg lifted, body pressed close, vaginal sex", "站立插入"],
      ["sitting on partner's lap, close embrace, vaginal sex", "膝上插入"],
      ["pinned down on floor, wrists held down, male above, vaginal sex", "地板压制"],
      ["shower sex, wet body, steam, hands on wall, vaginal sex", "淋浴间做爱"],
      ["blowjob, oral sex, penis in mouth, kneeling close to partner", "口交"],
      ["deepthroat, oral sex, head tilted back, wet eyes", "深喉"],
      ["handjob, female hand on penis, close-up service", "手交"],
      ["thighjob, penis between thighs, thighs pressed together", "素股"],
      ["breastjob, penis between breasts, hands pressing breasts together", "乳交"],
      ["footjob, bare feet foreground, soles framing shaft", "足交"],
      ["lactation, breast milk, handjob, milk dripping onto shaft", "授乳手交"],
      ["cum shower, cum on face, cum on body, kneeling", "精子浴"],
      ["after sex, creampie, cum dripping, lying on bed", "中出事后"],
      ["spitroast, one partner in front, one partner behind, consensual group sex", "前后夹击"],
      ["double penetration, consensual group sex, clearly group composition", "双穴插入"]
    ];

    V153_CACHE = {
      byCat,
      fixedBase,
      actionBig: unique(actionBig),
      nsfwCore,
      contexts,
      stats: { fixedBase: fixedBase.length, actionBig: unique(actionBig).length }
    };
    return V153_CACHE;
  }

  function draw(pool, n, used){
    const available = shuffle(pool.filter(x=>!used.has(norm(x))));
    const out=[];
    while(out.length<n && available.length){
      const v=available.pop();
      if(!safeBigTag(v.split(',')[0])) { out.push(v); used.add(norm(v)); }
      else { out.push(v); used.add(norm(v)); }
    }
    return out;
  }

  function prefixFor(mode, partnerMode, manual){
    const p=[];
    if(!/\b1girl\b/.test(manual||"")) p.push("1girl");
    if(mode!=="nsfw"){
      if(!/\bsolo\b/.test(manual||"")) p.push("solo");
      p.push("single focus");
      return p;
    }
    if(partnerMode==="1boy") return [...p,"1boy","duo"];
    if(partnerMode==="2boys") return [...p,"2boys","threesome","consensual group sex"];
    if(partnerMode==="group") return [...p,"multiple boys","group sex","consensual group sex"];
    return [...p,"solo","single focus"];
  }

  function partnerTags(mode, partnerMode){
    if(mode!=="nsfw") return [];
    if(partnerMode==="1boy") return ["visible male partner","male body visible","male face partly visible","male arms holding her","male hands on her body","only one boy"];
    if(partnerMode==="2boys") return ["two visible male partners","two male bodies visible","one boy in front, one boy behind","only two boys"];
    if(partnerMode==="group") return ["multiple visible male partners","several male bodies visible","multiple male hands","surrounded by men","no extra girls"];
    return ["pov","male pov"];
  }

  function countGuard(mode, partnerMode){
    if(mode!=="nsfw") return ["no extra characters","no multiple girls","no crowd"];
    if(partnerMode==="1boy") return ["no extra characters","no multiple girls","only one boy","no crowd","single sex position","one pose only"];
    if(partnerMode==="2boys") return ["no extra characters","no multiple girls","only two boys","no crowd","single sex position","one pose only"];
    if(partnerMode==="group") return ["no extra girls","single sex position","one pose only"];
    return ["no extra characters","no multiple girls","no crowd","single sex position","one pose only"];
  }

  function v153Compact(parts){
    let tags=unique(parts);
    const target = tags.length>=42 ? 28 : tags.length>=36 ? 26 : tags.length>=30 ? 24 : 22;
    const low=[/^very aesthetic$/i,/^newest$/i,/^highly detailed$/i,/^cg illustration$/i,/^dramatic lighting$/i,/^atmospheric lighting$/i,/^soft shadows$/i,/^glowing particles$/i,/^floating petals$/i,/^motion blur$/i,/^wind$/i,/^hair flowing$/i,/^natural expression$/i,/^soft smile$/i,/^playful smile$/i,/^confident smile$/i,/^beautiful .*$/i,/^detailed .*$/i,/^dreamy .*$/i,/^cinematic .*$/i,/^gentle .*$/i,/^bright .*$/i];
    for(let i=tags.length-1;i>=0 && tags.length>target;i--){
      const t=tags[i];
      if(V153_CORE_KEEP.has(norm(t))) continue;
      if(low.some(rx=>rx.test(t))) tags.splice(i,1);
    }
    for(let i=tags.length-1;i>=0 && tags.length>target;i--){
      const t=tags[i];
      if(V153_CORE_KEEP.has(norm(t))) continue;
      tags.splice(i,1);
    }
    return tags;
  }


  const V153_ZH_BY_TAG = new Map((typeof activeTags!=="undefined" && Array.isArray(activeTags) ? activeTags : []).map(t=>[
    String(t.tag||"").replace(/_/g," ").replace(/\s+/g," ").toLowerCase().trim(),
    t.zh || t.tag || ""
  ]));
  const V153_BASIC_ZH = {
    "running toward viewer":"朝镜头跑来", "walking forward":"向前走来", "twirling around":"原地旋身", "jumping lightly":"轻盈跳起",
    "looking back":"回头", "reaching toward viewer":"朝镜头伸手", "reading a book":"读书", "holding book":"拿书", "holding teacup":"拿茶杯", "adjusting glasses":"扶眼镜",
    "missionary position":"正常位", "cowgirl position":"骑乘位", "reverse cowgirl":"背面骑乘", "doggystyle":"后入位", "side entry sex":"侧入位", "breeding press":"种付压迫位", "mating press":"种付压迫位",
    "blowjob":"口交", "handjob":"手交", "thighjob":"腿交", "breastjob":"乳交", "footjob":"足交", "lactation":"授乳", "after sex":"事后", "cum shower":"精液浴",
    "close-up":"近景", "extreme close-up":"特写", "upper body":"上半身", "full body":"全身", "from above":"俯视", "low angle":"仰视", "side view":"侧视", "dutch angle":"荷兰角", "wide angle":"广角",
    "dynamic composition":"动态构图", "strong perspective":"强透视", "extreme perspective":"极端透视", "strong foreshortening":"强前缩透视", "high visual tension":"高张力构图", "dramatic lighting":"戏剧光影", "atmospheric lighting":"氛围光", "warm bedroom light":"卧室暖光"
  };
  const V153_TOKEN_ZH = {
    running:"奔跑", walking:"行走", jumping:"跳起", twirling:"旋转", around:"绕身", toward:"朝向", viewer:"镜头", forward:"向前", looking:"看向", back:"回头", holding:"拿着", book:"书", teacup:"茶杯", adjusting:"整理", glasses:"眼镜",
    orange:"橙色", dark:"昏暗", bright:"明亮", gentle:"柔和", traditional:"传统风", sporty:"运动风", nurse:"护士", room:"房间", bedroom:"卧室", sky:"天空", forest:"森林", rooftop:"屋顶", beach:"海滩", garden:"花园", close:"近", up:"近", extreme:"极端", upper:"上半身", body:"身体", full:"全身", from:"从", above:"上方", low:"低位", angle:"角度", side:"侧面", dutch:"荷兰角", wide:"广角", dynamic:"动态", composition:"构图", strong:"强", perspective:"透视", foreshortening:"前缩透视", high:"高", visual:"视觉", tension:"张力", dramatic:"戏剧化", lighting:"光影", atmospheric:"氛围", soft:"柔和", sunlight:"日光", warm:"暖色", moonlight:"月光", candlelight:"烛光", neon:"霓虹", light:"光"
  };
  function v153NormalizeZhKey(s){ return String(s||"").replace(/_/g," ").replace(/\s+/g," ").toLowerCase().trim(); }
  function v153Zh(s){
    const raw=String(s||"").trim();
    if(!raw) return "";
    const key=v153NormalizeZhKey(raw);
    if(V153_ZH_BY_TAG.has(key)) return V153_ZH_BY_TAG.get(key);
    if(V153_BASIC_ZH[key]) return V153_BASIC_ZH[key];
    if(key.includes(" / ")) return key.split(" / ").map(v153Zh).join(" / ");
    if(key.includes(" + ")) return key.split(" + ").map(v153Zh).join(" + ");
    const translated=key.split(" ").filter(Boolean).map(p=>V153_TOKEN_ZH[p]||p).join("");
    return translated || raw;
  }
  function v153ZhList(arr, limit){ return (arr||[]).slice(0, limit||4).map(v153Zh).filter(Boolean).join(" / "); }
  function v153EscapeHtml(s){ return String(s||"").replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\\\"":"&quot;","'":"&#39;"}[c] || c)); }

  function v153MakePrompt(mode, char, partnerMode, tensionMode, batchUsed){
    const P=buildV153Pools();
    const actual = mode==="mixed" ? (Math.random()>.5 ? "sfw" : "nsfw") : mode;
    const used=batchUsed || new Set();
    const manual=(char||"").trim();

    const hair=draw(P.byCat.hair||[], 2, used);
    const eyes=draw(P.byCat.eyes||[], 1, used);
    const face=draw([...(P.byCat.face||[]), ...(P.byCat.expression||[])], actual==="sfw"?2:3, used);
    const body=draw([...(P.byCat.body||[]), ...(P.byCat.species||[])], 2, used);
    const clothes=draw(P.byCat.clothing||[], actual==="sfw"?3:2, used);
    const acc=draw(P.byCat.accessory||[], 1, used);
    const scene=draw(P.byCat.background||[], 2, used);
    const camera=draw([...(P.byCat.camera||[]), ...(P.byCat.composition||[]), ...(P.byCat.effects||[])], tensionMode==="on"?3:2, used);
    const light=draw([...(P.byCat.lighting||[]), ...(P.byCat.effects||[])], 2, used);

    let action=[], titleAction="";
    if(actual==="sfw"){
      action=draw(P.actionBig, 1, used);
      titleAction=action[0] || "随机动作";
    }else{
      const core=pick(P.nsfwCore);
      action=[core[0]];
      titleAction=core[1];
      action.push(...draw(P.fixedBase, 1, used));
    }

    const tension = tensionMode==="on" ? ["extreme perspective","strong foreshortening","dynamic composition","high visual tension","dutch angle","motion lines","lively movement"] : [];
    const rating = actual==="sfw" ? ["sfw","no text"] : ["explicit","uncensored","no text"];
    const quality = ["masterpiece","best quality"];

    const parts = [
      ...prefixFor(actual, partnerMode, manual),
      manual,
      ...quality,
      ...(manual ? [] : [...body, ...hair, ...eyes]),
      ...face,
      ...clothes,
      ...acc,
      ...partnerTags(actual, partnerMode),
      ...action,
      ...scene,
      ...camera,
      ...light,
      ...tension,
      ...rating,
      ...countGuard(actual, partnerMode)
    ];
    const compacted=v153Compact(parts);
    const prompt=compacted.join(", ");
    const actionZh=v153Zh(titleAction || (action[0]||"随机动作"));
    const sceneZh=v153ZhList(scene,4) || "随机场景";
    const cameraZh=v153ZhList(camera,3) || "随机镜头";
    const lightZh=v153ZhList(light,3) || "随机光影";
    const partnerZh = actual==="nsfw" ? ({pov:"POV","1boy":"1boy","2boys":"2boys",group:"3boys+"}[partnerMode]||"POV") : "单人";
    const tensionZh = tensionMode==="on" ? "强张力开启" : "强张力关闭";
    const summary=`模式 ${actual.toUpperCase()}；交互方 ${partnerZh}；动作 ${actionZh}；场景 ${sceneZh}；镜头/构图 ${cameraZh}；光影 ${lightZh}`;
    const summaryHtml=`<div class="v154-summary-grid"><div><b>模式</b>${v153EscapeHtml(actual.toUpperCase())}；<b>交互方</b>${v153EscapeHtml(partnerZh)}；<b>${v153EscapeHtml(tensionZh)}</b></div><div><b>动作</b>${v153EscapeHtml(actionZh)}</div><div><b>场景</b>${v153EscapeHtml(sceneZh)}</div><div><b>镜头/构图</b>${v153EscapeHtml(cameraZh)}</div><div><b>光影</b>${v153EscapeHtml(lightZh)}</div></div>`;
    return {title:(actual==="sfw"?"SFW":"NSFW")+"｜"+actionZh, prompt, summary, summaryHtml};
  }

  window.renderBatch = function(){
    const P=buildV153Pools();
    const cnt=Math.max(1,Math.min(50,Number($("#batch-count").value||8)));
    const mode=$("#batch-mode").value;
    const char=$("#batch-character").value;
    const partnerMode=$("#batch-partner-mode") ? $("#batch-partner-mode").value : "pov";
    const tensionMode=$("#batch-tension-mode") ? $("#batch-tension-mode").value : "on";
    const wrap=$("#batch-results");
    if(!wrap) return;
    const stats=$("#batch-pool-stats");
    if(stats) stats.textContent=`第二页 v1.5.3：固定大池 ${P.stats.fixedBase} 条；大动作池 ${P.stats.actionBig} 条。现在动作从大动作池抽，不再只用原来的十几个 pose。`;
    wrap.innerHTML="";
    const batchUsed=new Set();
    for(let i=0;i<cnt;i++){
      const item=v153MakePrompt(mode,char,partnerMode,tensionMode,batchUsed);
      const box=document.createElement("div");
      box.className="batch-item";
      box.innerHTML=`<h3>${i+1}. ${item.title}</h3><div class="summary">${item.summaryHtml||item.summary}</div><textarea data-v152done="1" data-compacted="1">${item.prompt}</textarea><button class="copy-one">复制这一条</button>`;
      box.querySelector(".copy-one").onclick=()=>copyText(box.querySelector("textarea").value);
      wrap.appendChild(box);
    }
  };

  window.makePrompt = function(mode,char,partnerMode="pov",tensionMode="on",batchUsed=new Set()){
    return v153MakePrompt(mode,char,partnerMode,tensionMode,batchUsed);
  };

  function installV153(){
    const btn=$("#make-batch");
    if(btn) btn.onclick=window.renderBatch;
    const stats=$("#batch-pool-stats");
    if(stats){
      const P=buildV153Pools();
      stats.textContent=`第二页 v1.5.3：固定大池 ${P.stats.fixedBase} 条；大动作池 ${P.stats.actionBig} 条。`;
    }
  }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded", installV153);
  else installV153();
  setTimeout(installV153, 500);
})();



/* ===== v1.7 balanced action sampler =====
   修复动作高重复的根因：
   v1.5.3 的 actionBig 是“前几个动作种子 × 大量上下文”顺序截断到 5600，
   所以 5600 个所谓动作里几乎全是 walking/running/jumping/twirling。
   v1.7 不再预生成顺序截断的大动作表，而是每条结果实时抽：
   1. 一个真正动作核心
   2. 1~2 个大词池上下文
   3. 场景 / 镜头 / 构图 / 光影
*/
(function(){
  const CORE_KEEP = new Set([
    "1girl","solo","single focus","1boy","2boys","multiple boys","duo","threesome","group sex",
    "pov","male pov","sfw","explicit","uncensored","no text",
    "pussy",
    "visible pussy",
    "spread pussy",
    "pussy focus",
    "vulva",
    "visible vulva",
    "penis",
    "visible penis",
    "erect penis",
    "penis focus",
    "vaginal penetration",
    "penis insertion",
    "insertion",
    "penetration",
    "penis tip entering pussy",
    "penis entering pussy",
    "penis inside pussy",
    "genital focus",
    "explicit genitalia",
    "uncensored genitals",
  ]);

  function $(s){ return document.querySelector(s); }
  function norm(s){ return String(s||"").replace(/_/g," ").replace(/\s+/g," ").trim().toLowerCase(); }
  function tagOf(t){ return typeof t==="string" ? t : (t && (t.tag || t.name || t.en || t.text)) || ""; }
  function catOf(t){ return (t && (t.cat || t.category || t.group || t.type || t.subCategory || t.subcat)) || ""; }
  function zhOf(t){
    if(typeof t==="object" && t.zh) return t.zh;
    const raw = tagOf(t) || String(t||"");
    const k = norm(raw);
    if(ZH.has(k)) return ZH.get(k);
    return BASIC_ZH[k] || raw;
  }
  function shuffle(a){
    const arr=[...a];
    for(let i=arr.length-1;i>0;i--){
      const j=Math.floor(Math.random()*(i+1));
      [arr[i],arr[j]]=[arr[j],arr[i]];
    }
    return arr;
  }
  function unique(arr){
    const out=[], seen=new Set();
    for(const x of arr){
      const s=String(x||"").trim();
      if(!s) continue;
      const k=norm(s);
      if(seen.has(k)) continue;
      seen.add(k); out.push(s);
    }
    return out;
  }
  function safeTag(s){
    const t=norm(s);
    if(!t || t.length>70) return false;
    if(CORE_KEEP.has(t)) return false;
    if(/watermark|signature|username|artist name|text focus|speech bubble|english text/.test(t)) return false;
    if(/^bad |^worst |^lowres|censored|mosaic|bar censor|extra limb|bad anatomy|bad hands/.test(t)) return false;
    return true;
  }
  function pick(pool, used){
    const candidates = pool.filter(x=>!used.has(norm(x.tag || x)));
    const arr = candidates.length ? candidates : pool;
    const v = arr[Math.floor(Math.random()*arr.length)];
    used.add(norm(v.tag || v));
    return v;
  }
  function draw(pool, n, used){
    const out=[];
    for(let i=0;i<n && pool.length;i++) out.push(pick(pool, used));
    return out;
  }
  function tagList(arr){ return arr.map(x => x.tag || x); }
  function zhList(arr, n=99){ return arr.slice(0,n).map(zhOf).join(" / "); }
  function compact(parts){
    let tags = unique(parts);
    const target = tags.length>=42 ? 28 : tags.length>=36 ? 26 : tags.length>=30 ? 24 : 22;
    const low=[
      /^very aesthetic$/i,/^newest$/i,/^highly detailed$/i,/^cg illustration$/i,
      /^dramatic lighting$/i,/^atmospheric lighting$/i,/^soft shadows$/i,/^glowing particles$/i,
      /^floating petals$/i,/^motion blur$/i,/^wind$/i,/^hair flowing$/i,
      /^natural expression$/i,/^soft smile$/i,/^playful smile$/i,/^confident smile$/i,
      /^beautiful .*$/i,/^detailed .*$/i,/^dreamy .*$/i,/^cinematic .*$/i,/^gentle .*$/i,/^bright .*$/i
    ];
    for(let i=tags.length-1;i>=0 && tags.length>target;i--){
      const t=tags[i];
      if(CORE_KEEP.has(norm(t))) continue;
      if(low.some(rx=>rx.test(t))) tags.splice(i,1);
    }
    for(let i=tags.length-1;i>=0 && tags.length>target;i--){
      const t=tags[i];
      if(CORE_KEEP.has(norm(t))) continue;
      tags.splice(i,1);
    }
    return tags;
  }
  function html(s){
    return String(s||"").replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
  }

  const ZH = new Map((typeof activeTags!=="undefined" && Array.isArray(activeTags) ? activeTags : []).map(t=>[norm(t.tag), t.zh || t.tag]));
  const BASIC_ZH = {
    "pov":"第一人称","male pov":"男性第一人称","1boy":"一名男性","2boys":"两名男性","multiple boys":"多名男性",
    "missionary position":"正常位","cowgirl position":"骑乘位","reverse cowgirl":"背面骑乘","doggystyle":"后入位",
    "side entry sex":"侧入位","breeding press":"种付位","mating press":"种付位","blowjob":"口交","handjob":"手交",
    "thighjob":"素股","breastjob":"乳交","footjob":"足交","lactation":"授乳","after sex":"事后",
    "running toward viewer":"朝镜头跑来","walking forward":"向前走来","jumping lightly":"轻盈跳起","twirling around":"原地旋身",
    "dancing in place":"原地跳舞","turning around suddenly":"突然转身","looking back over shoulder":"回头看",
    "reaching toward viewer":"朝镜头伸手","leaning forward":"向前俯身","stepping toward camera":"向镜头迈步",
    "kneeling down":"跪下","sitting on the edge":"坐在边缘","lying on bed":"躺在床上","standing in strong wind":"强风中站立",
    "opening door":"开门","opening curtains":"拉开窗帘","holding phone":"拿手机","holding flower":"拿花",
    "holding book":"拿书","holding umbrella":"撑伞","adjusting clothes":"整理衣服","fixing hair":"整理头发",
    "taking off jacket":"脱外套","putting on glasses":"戴眼镜","stretching after waking up":"起床后伸懒腰",
    "crouching close to camera":"靠近镜头蹲下","resting chin on hand":"托腮","covering mouth while laughing":"捂嘴笑",
    "walking barefoot":"赤脚行走","spinning with skirt floating":"旋身裙摆飞起","catching falling petals":"接住落花",
    "standing on tiptoe":"踮脚","climbing stairs and looking back":"上楼回头","leaning on desk":"靠在桌边",
    "sitting on railing":"坐在栏杆上","running through rain":"雨中奔跑","stepping over puddle":"跨过水洼",
    "walking through doorway":"穿过门口","peeking from behind door":"从门后探身","reaching upward":"向上伸手",
    "falling through the air":"空中坠落","floating in zero gravity":"零重力漂浮","splashing water":"泼水",
    "holding drink toward viewer":"把饮料递向镜头","reading under blanket":"被窝里读书","brushing hair":"梳头",
    "resting against window":"靠在窗边","hiding behind curtain":"藏在窗帘后","walking through crowd":"穿过人群",
    "posing for a photo":"摆拍","turning with hair swinging":"甩发转身","grabbing hat in wind":"风中按住帽子",
    "pulling sleeve":"拉住袖口","checking reflection":"看镜中倒影","sitting cross-legged":"盘腿坐",
    "kneeling on bed":"跪在床上","lying on stomach":"趴着","looking over glasses":"越过眼镜看人",
    "tilting head":"歪头","raising one knee":"抬起一膝","hands on hips":"双手叉腰","arms above head":"双臂举起",
    "close-up":"近景","extreme close-up":"特写","upper body":"上半身","full body":"全身","from above":"俯视",
    "low angle":"仰视","dutch angle":"荷兰角","strong perspective":"强透视","strong foreshortening":"强前缩透视",
    "extreme perspective":"极端透视","dynamic composition":"动态构图","high visual tension":"高张力构图",
    "dramatic lighting":"戏剧光影","atmospheric lighting":"氛围光","warm bedroom light":"卧室暖光",
    "walking forward while looking back":"边走边回头",
    "running past camera":"从镜头旁跑过",
    "running up stairs":"跑上楼梯",
    "jumping down from a step":"从台阶上跳下",
    "standing in wind":"风中站立",
    "standing with one leg forward":"单腿向前站立",
    "walking down stairs":"走下楼梯",
    "sliding across floor":"滑过地板",
    "holding hands behind back":"双手背在身后",
    "one hand on chest":"单手按胸口",
    "one hand reaching out":"单手伸出",
    "opening locker":"打开储物柜",
    "tying ribbon":"系丝带",
    "putting on shoes":"穿鞋",
    "removing shoes":"脱鞋",
    "sitting by window":"坐在窗边",
    "writing in notebook":"在笔记本上写字",
    "taking a photo":"拍照",
    "playing with hair":"拨弄头发",
    "holding bag over shoulder":"单肩挎包",
    "turning page of book":"翻书页",
    "leaning on railing":"靠在栏杆上",
    "sitting on windowsill":"坐在窗台上",
    "lying on sofa":"躺在沙发上",
    "falling asleep at desk":"趴桌睡着",
    "waking up in bed":"在床上醒来",
    "pouring tea":"倒茶",
    "eating dessert":"吃甜点",
    "looking into mirror":"看向镜子",
    "wiping rain from face":"擦去脸上的雨水",
    "holding scarf in wind":"风中握住围巾",
    "standing under umbrella":"站在伞下",
    "catching hat blown by wind":"接住被风吹走的帽子",
    "tiptoeing across room":"踮脚穿过房间",
    "opening refrigerator":"打开冰箱",
    "hanging laundry":"晾衣服",
    "folding clothes":"叠衣服",
    "watering flowers":"浇花",
    "swinging legs while sitting":"坐着晃腿",
    "walking along seaside railing":"沿海边栏杆行走",
    "standing under streetlight":"站在路灯下",
    "running across rooftop":"跑过天台",
    "leaning out of window":"探出窗外",
    "holding letter close to chest":"把信贴在胸前",
    "picking up fallen object":"捡起掉落物",
    "turning toward sudden sound":"听到声音转身",
    "covering eyes from sunlight":"抬手遮挡阳光",
    "lifting curtain":"掀开窗帘",
    "sitting in train seat":"坐在电车座位上",
    "standing at vending machine":"站在自动贩卖机旁",
    "walking through shallow water":"踏过浅水",
    "stepping into moonlight":"走入月光中",
    "looking up at sky":"仰望天空",
    "holding lantern":"提着灯笼",
    "casting spell":"施法",
    "drawing sword":"拔剑",
    "holding fan":"拿着扇子",
    "opening folding fan":"展开折扇",
    "playing instrument":"演奏乐器",
    "singing on stage":"在舞台上唱歌",
    "reaching for high shelf":"伸手够高处架子",
    "pulling blanket up":"拉起毯子",
    "hugging pillow":"抱着枕头",
    "sitting on floor":"坐在地板上",
    "leaning back on hands":"双手后撑后仰",
    "balancing on one foot":"单脚保持平衡",
    "spooning sex":"侧卧抱入",
    "prone bone":"俯卧后入",
    "standing rear entry":"站立后入",
    "against window sex":"窗边做爱",
    "chair sex":"椅上做爱",
    "sofa sex":"沙发做爱",
    "floor sex":"地板做爱",
    "tabletop sex":"桌上做爱",
    "cunnilingus":"舔阴",
    "mutual masturbation":"互相自慰",
    "two boys servicing one girl":"双人侍奉",
  };

  const SFW_ACTIONS = [
    "walking forward","walking forward while looking back","running toward viewer","running past camera","jumping lightly",
    "jumping down from a step","twirling around","dancing in place","spinning with skirt floating","turning around suddenly",
    "looking back over shoulder","reaching toward viewer","leaning forward","stepping toward camera","kneeling down",
    "sitting on the edge","lying on bed","standing in strong wind","opening door","opening curtains","holding phone",
    "holding flower","holding book","holding umbrella","holding drink toward viewer","adjusting clothes","fixing hair",
    "taking off jacket","putting on glasses","stretching after waking up","crouching close to camera","resting chin on hand",
    "covering mouth while laughing","walking barefoot","catching falling petals","standing on tiptoe","climbing stairs and looking back",
    "leaning on desk","sitting on railing","running through rain","stepping over puddle","walking through doorway",
    "peeking from behind door","reaching upward","falling through the air","floating in zero gravity","splashing water",
    "reading under blanket","brushing hair","resting against window","hiding behind curtain","walking through crowd",
    "posing for a photo","turning with hair swinging","grabbing hat in wind","pulling sleeve","checking reflection",
    "sitting cross-legged","kneeling on bed","lying on stomach","looking over glasses","tilting head","raising one knee",
    "standing with one leg forward","walking down stairs","running up stairs","sliding across floor","holding hands behind back",
    "arms above head","hands on hips","one hand on chest","one hand reaching out","opening locker","tying ribbon",
    "putting on shoes","removing shoes","sitting by window","writing in notebook","taking a photo","playing with hair",
    "holding bag over shoulder","turning page of book","leaning on railing","sitting on windowsill","lying on sofa",
    "falling asleep at desk","waking up in bed","pouring tea","eating dessert","looking into mirror","wiping rain from face",
    "holding scarf in wind","standing under umbrella","catching hat blown by wind","tiptoeing across room","opening refrigerator",
    "hanging laundry","folding clothes","watering flowers","swinging legs while sitting","walking along seaside railing",
    "standing under streetlight","running across rooftop","leaning out of window","holding letter close to chest","picking up fallen object",
    "turning toward sudden sound","covering eyes from sunlight","lifting curtain","sitting in train seat","standing at vending machine",
    "walking through shallow water","stepping into moonlight","looking up at sky","holding lantern","casting spell",
    "drawing sword","holding fan","opening folding fan","playing instrument","singing on stage","reaching for high shelf",
    "pulling blanket up","hugging pillow","sitting on floor","leaning back on hands","balancing on one foot"
  ].map(x=>({tag:x, zh:BASIC_ZH[norm(x)]||x}));

  const NSFW_CORES = [
    ["missionary position, female lying on back, legs spread, male on top, vaginal sex, penis tip entering pussy, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals", "正常位"],
    ["missionary position, female lying on back, legs wrapped around waist, male on top, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals", "抱腰正常位"],
    ["missionary position, female lying on back, ankles held up, male on top, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals", "抬脚正常位"],
    ["missionary position, legs on shoulders, female lying on back, male on top, knees near chest, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals", "腿架肩正常位"],
    ["breeding press, mating press, female lying on back, knees pressed to chest, male on top, not cowgirl, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals", "种付位"],
    ["seashell position, female lying on back, legs folded high, knees near shoulders, male on top, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals", "贝壳位"],
    ["butterfly position, female lying on bed edge, hips lifted, partner standing, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals", "蝴蝶位"],
    ["tabletop sex, sitting on table edge, legs spread, partner standing, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals", "桌面坐入"],
    ["g-whiz position, female lying on back, legs over partner shoulders, hips lifted, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals", "G点抬腿位"],
    ["coital alignment technique, missionary position, bodies pressed close, grinding penetration, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals", "贴合正常位"],
    ["folded deckchair position, female lying on back, legs folded up, male leaning over, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals", "折叠椅位"],
    ["eagle position, female lying on back, legs spread wide, male on top, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals", "展鹰位"],
    ["piledriver position, female lying on back, hips raised high, legs vertical, male standing, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals", "打桩位"],
    ["lotus missionary, female lying on back, legs crossed behind partner, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals", "交缠正常位"],
    ["doggystyle, on all fours, hips raised, male behind, vaginal sex from behind, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals", "后入位"],
    ["low doggystyle, chest down, hips raised, male behind, vaginal sex from behind, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals", "低伏后入"],
    ["standing doggystyle, standing rear entry, hands on wall, male behind, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals", "站立后入"],
    ["bent over desk, hands on table, doggystyle from behind, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals", "桌边后入"],
    ["bent over bed, knees on floor, upper body on bed, male behind, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals", "床边俯身后入"],
    ["prone bone, lying on stomach, partner pressing from behind, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals", "俯卧后入"],
    ["prone bone with pillow under hips, lying on stomach, hips raised, vaginal sex from behind, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals", "垫枕俯卧后入"],
    ["flatiron position, lying face down, legs together, partner on top from behind, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals", "熨斗位"],
    ["turtle position, kneeling curled forward, hips raised, male behind, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals", "龟缩后入"],
    ["downward dog position, hands and feet on floor, hips high, male behind, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals", "下犬式后入"],
    ["standing bent over, hands on knees, male behind, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals", "扶膝后入"],
    ["over the lap rear entry, female bent over partner lap, vaginal sex from behind, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals", "趴腿后入"],
    ["kneeling rear entry, female kneeling upright, male behind, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals", "跪姿后入"],
    ["mirror sex, hands on sink, male behind, mirror reflection visible, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals", "镜前后入"],
    ["spooning sex, both lying sideways, partner behind, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals", "侧卧抱入"],
    ["side entry sex, side lying position, one leg raised, vaginal sex from side, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals", "侧入位"],
    ["face-to-face side sex, both lying sideways facing each other, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals", "侧卧面对面"],
    ["scissors position, legs intertwined, side entry vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals", "剪刀交缠位"],
    ["pretzel dip position, female lying on side, one leg raised, partner kneeling, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals", "椒盐卷饼位"],
    ["spork position, female lying on side, one leg lifted, partner between legs, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals", "叉勺位"],
    ["side saddle position, female lying on side, partner kneeling beside her, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals", "侧鞍位"],
    ["lazy spoon position, relaxed side lying rear entry, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals", "懒人汤匙位"],
    ["leg over hip side sex, one leg over partner hip, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals", "搭髋侧入"],
    ["cowgirl position, woman on top, straddling partner, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals", "骑乘位"],
    ["reverse cowgirl, woman on top facing away, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals", "背面骑乘"],
    ["squatting cowgirl, woman squatting on top, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals", "深蹲骑乘"],
    ["leaning forward cowgirl, woman on top leaning down, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals", "前倾骑乘"],
    ["reclining cowgirl, woman on top leaning back, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals", "后仰骑乘"],
    ["sideways cowgirl, woman sitting sideways on partner, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals", "侧坐骑乘"],
    ["lap sex, sitting on partner lap, face-to-face, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals", "面对面膝上位"],
    ["chair sex, sitting on partner lap on chair, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals", "椅上骑乘"],
    ["lotus position, seated face-to-face, legs wrapped around partner, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals", "莲花坐位"],
    ["yab-yum position, seated face-to-face, close embrace, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals", "双修坐位"],
    ["face-off position, partner sitting on chair, woman sitting on lap facing partner, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals", "面对面椅坐位"],
    ["sofa lap sex, sitting on partner lap on sofa, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals", "沙发膝上位"],
    ["straddling on bed, woman on top, knees on bed, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals", "床上跨坐位"],
    ["standing sex, one leg lifted, body pressed close, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals", "站立插入"],
    ["standing face-to-face sex, one leg around partner waist, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals", "面对面站立位"],
    ["lifted sex, legs wrapped around waist, partner holding thighs, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals", "抱起插入"],
    ["standing carry position, partner lifting female by thighs, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals", "托腿抱入"],
    ["wall sex, back against wall, one leg raised, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals", "墙边插入"],
    ["against window sex, hands on glass, city lights outside, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals", "窗边插入"],
    ["countertop sex, sitting on counter edge, legs spread, partner standing, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals", "台面插入"],
    ["stair sex, female sitting on stairs, partner kneeling, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals", "楼梯坐入"],
    ["shower sex, wet body, steam, hands on wall, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals", "淋浴间插入"],
    ["bathtub sex, wet body, sitting in bathtub, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals", "浴缸插入"],
    ["sofa sex, lying back on sofa, partner above, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals", "沙发正常位"],
    ["floor sex, lying on floor, partner above, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals", "地板正常位"],
    ["standing split-leg sex, one leg lifted high, partner standing, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals", "高抬腿站立位"],
    ["anal sex, doggystyle, on all fours, male behind, anal penetration, anus, visible anus, penis, visible penis, erect penis, anal penetration, penis inside anus, genital focus, explicit genitalia, uncensored genitals", "后入肛交"],
    ["anal sex, missionary position, female lying on back, male on top, anal penetration, anus, visible anus, penis, visible penis, erect penis, anal penetration, penis inside anus, genital focus, explicit genitalia, uncensored genitals", "正常位肛交"],
    ["anal sex, spooning position, side lying rear entry, anal penetration, anus, visible anus, penis, visible penis, erect penis, anal penetration, penis inside anus, genital focus, explicit genitalia, uncensored genitals", "侧卧肛交"],
    ["anal sex, cowgirl position, woman on top, anal penetration, anus, visible anus, penis, visible penis, erect penis, anal penetration, penis inside anus, genital focus, explicit genitalia, uncensored genitals", "骑乘肛交"],
    ["anal sex, bent over desk, male behind, anal penetration, anus, visible anus, penis, visible penis, erect penis, anal penetration, penis inside anus, genital focus, explicit genitalia, uncensored genitals", "桌边肛交"],
    ["anal sex, prone bone, lying on stomach, anal penetration from behind, anus, visible anus, penis, visible penis, erect penis, anal penetration, penis inside anus, genital focus, explicit genitalia, uncensored genitals", "俯卧肛交"],
    ["blowjob, oral sex, penis in mouth, kneeling close to partner, penis, visible penis, erect penis, mouth contact, genital focus, explicit genitalia, uncensored genitals", "口交"],
    ["deepthroat, oral sex, penis deep in mouth, head tilted back, wet eyes, penis, visible penis, erect penis, mouth contact, genital focus, explicit genitalia, uncensored genitals", "深喉"],
    ["face fucking, oral sex, penis in mouth, partner holding head, penis, visible penis, erect penis, mouth contact, genital focus, explicit genitalia, uncensored genitals", "口交抽插"],
    ["sixty-nine position, mutual oral sex, oral sex, legs intertwined, penis, visible penis, erect penis, mouth contact, genital focus, explicit genitalia, uncensored genitals", "六九式"],
    ["side-by-side 69 position, mutual oral sex, both lying sideways, penis, visible penis, erect penis, mouth contact, genital focus, explicit genitalia, uncensored genitals", "侧卧六九式"],
    ["standing blowjob, partner standing, kneeling oral sex, penis, visible penis, erect penis, mouth contact, genital focus, explicit genitalia, uncensored genitals", "站立口交"],
    ["paizuri blowjob, breastjob and oral sex together, penis between breasts and mouth, penis, visible penis, erect penis, mouth contact, genital focus, explicit genitalia, uncensored genitals", "乳交口交"],
    ["handjob, female hand on penis, hand around shaft, close-up service, penis, visible penis, erect penis, genital focus, explicit genitalia, uncensored genitals", "手交"],
    ["two-handed handjob, both hands around penis, close-up service, penis, visible penis, erect penis, genital focus, explicit genitalia, uncensored genitals", "双手手交"],
    ["thighjob, penis between thighs, thighs pressed together, penis, visible penis, erect penis, genital focus, explicit genitalia, uncensored genitals", "素股"],
    ["breastjob, penis between breasts, hands pressing breasts together, penis, visible penis, erect penis, genital focus, explicit genitalia, uncensored genitals", "乳交"],
    ["footjob, bare feet foreground, soles framing shaft, penis, visible penis, erect penis, genital focus, explicit genitalia, uncensored genitals", "足交"],
    ["armpit sex, penis under armpit, arm pressed against shaft, penis, visible penis, erect penis, genital focus, explicit genitalia, uncensored genitals", "腋交"],
    ["cunnilingus, face between thighs, legs spread, tongue on pussy, pussy, visible pussy, spread pussy, genital focus, explicit genitalia, uncensored genitals", "舔阴"],
    ["facesitting, woman sitting on partner face, oral sex on pussy, pussy, visible pussy, spread pussy, genital focus, explicit genitalia, uncensored genitals", "坐脸舔阴"],
    ["reverse facesitting, woman sitting on partner face facing away, oral sex on pussy, pussy, visible pussy, spread pussy, genital focus, explicit genitalia, uncensored genitals", "反向坐脸"],
    ["fingering, hand between thighs, fingers inside pussy, pussy, visible pussy, spread pussy, genital focus, explicit genitalia, uncensored genitals", "指交"],
    ["two-finger penetration, fingers inside pussy, spread pussy, pussy, visible pussy, spread pussy, genital focus, explicit genitalia, uncensored genitals", "双指插入"],
    ["mutual masturbation, hands between thighs, close-up genital focus, pussy, visible pussy, spread pussy, genital focus, explicit genitalia, uncensored genitals", "互相自慰"],
    ["tribadism, scissoring, pussy rubbing, legs intertwined, pussy, visible pussy, spread pussy, genital focus, explicit genitalia, uncensored genitals", "磨豆腐剪刀位"],
    ["intercrural sex, penis between thighs, nonpenetrative sex, penis, visible penis, erect penis, genital focus, explicit genitalia, uncensored genitals", "股间性交"],
    ["after sex, creampie, cum leaking from pussy, lying on bed, pussy, visible pussy, spread pussy, genital focus, explicit genitalia, uncensored genitals", "中出事后"],
    ["standing creampie aftermath, cum leaking from pussy, shaky legs, pussy, visible pussy, spread pussy, genital focus, explicit genitalia, uncensored genitals", "站立中出事后"],
    ["cum shower, cum on face, cum on body, kneeling, penis, visible penis, erect penis, genital focus, explicit genitalia, uncensored genitals", "精液浴"],
    ["cum on tongue, oral sex aftermath, tongue out, penis, visible penis, erect penis, mouth contact, genital focus, explicit genitalia, uncensored genitals", "口部事后"],
    ["spitroast, one partner in front, one partner behind, consensual group sex, vaginal penetration, oral sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals", "前后夹击"],
    ["double penetration, consensual group sex, vaginal penetration, anal penetration, multiple visible penises, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals", "双穴插入"],
    ["two boys servicing one girl, consensual group sex, multiple visible penises, penis, visible penis, erect penis, genital focus, explicit genitalia, uncensored genitals", "双人侍奉"],
    ["group sex, multiple visible male partners, consensual group sex, multiple visible penises, penis, visible penis, erect penis, genital focus, explicit genitalia, uncensored genitals", "多人性爱"],
    ["bukkake, multiple visible penises, cum on face, cum on body, kneeling, penis, visible penis, erect penis, genital focus, explicit genitalia, uncensored genitals", "多人射精"]
  ].map(x=>({tag:x[0], zh:x[1]}));

  let CACHE=null;
  function buildPools(){
    if(CACHE) return CACHE;
    const raw = (typeof activeTags !== "undefined" && Array.isArray(activeTags)) ? activeTags : [];
    const byCat={};
    for(const t of raw){
      const tag=tagOf(t);
      if(!safeTag(tag)) continue;
      const cat=catOf(t)||"misc";
      if(!byCat[cat]) byCat[cat]=[];
      byCat[cat].push(tag);
    }
    for(const k of Object.keys(byCat)) byCat[k]=unique(byCat[k]);

    const context = unique([
      ...(byCat.pose||[]), ...(byCat.background||[]), ...(byCat.clothing||[]), ...(byCat.accessory||[]),
      ...(byCat.expression||[]), ...(byCat.camera||[]), ...(byCat.composition||[]), ...(byCat.effects||[]),
      ...(byCat.danbooru_general||[])
    ]).filter(safeTag).slice(0, 6000);

    CACHE = {
      byCat, context,
      stats: {
        sfwActions:SFW_ACTIONS.length,
        nsfwActions:NSFW_CORES.length,
        context:context.length
      }
    };
    return CACHE;
  }

  function prefixFor(mode, partnerMode, manual){
    const p=[];
    if(!/\b1girl\b/.test(manual||"")) p.push("1girl");
    if(mode!=="nsfw"){
      if(!/\bsolo\b/.test(manual||"")) p.push("solo");
      p.push("single focus");
      return p;
    }
    if(partnerMode==="1boy") return [...p,"1boy","duo"];
    if(partnerMode==="2boys") return [...p,"2boys","threesome","consensual group sex"];
    if(partnerMode==="group") return [...p,"multiple boys","group sex","consensual group sex"];
    return [...p,"solo","single focus"];
  }
  function partnerTags(mode, partnerMode){
    if(mode!=="nsfw") return [];
    if(partnerMode==="1boy") return ["visible male partner","male body visible","male face partly visible","male arms holding her","male hands on her body","only one boy"];
    if(partnerMode==="2boys") return ["two visible male partners","two male bodies visible","one boy in front, one boy behind","only two boys"];
    if(partnerMode==="group") return ["multiple visible male partners","several male bodies visible","multiple male hands","surrounded by men","no extra girls"];
    return ["pov","male pov"];
  }
  function guard(mode, partnerMode){
    if(mode!=="nsfw") return ["no extra characters","no multiple girls","no crowd"];
    if(partnerMode==="1boy") return ["no extra characters","no multiple girls","only one boy","no crowd","single sex position","one pose only"];
    if(partnerMode==="2boys") return ["no extra characters","no multiple girls","only two boys","no crowd","single sex position","one pose only"];
    if(partnerMode==="group") return ["no extra girls","single sex position","one pose only"];
    return ["no extra characters","no multiple girls","no crowd","single sex position","one pose only"];
  }

  function makeV17(mode, char, partnerMode, tensionMode, used){
    const P=buildPools();
    const actual = mode==="mixed" ? (Math.random()>.5 ? "sfw" : "nsfw") : mode;
    const manual=(char||"").trim();
    const u=used||new Set();

    const hair=draw(P.byCat.hair||[], manual?0:2, u);
    const eyes=draw(P.byCat.eyes||[], manual?0:1, u);
    const body=draw([...(P.byCat.body||[]), ...(P.byCat.species||[])], manual?0:2, u);
    const face=draw([...(P.byCat.face||[]), ...(P.byCat.expression||[])], actual==="sfw"?2:3, u);
    const clothes=draw(P.byCat.clothing||[], actual==="sfw"?3:2, u);
    const acc=draw(P.byCat.accessory||[], 1, u);
    const scene=draw(P.byCat.background||[], 2, u);
    const camera=draw([...(P.byCat.camera||[]), ...(P.byCat.composition||[]), ...(P.byCat.effects||[])], tensionMode==="on"?3:2, u);
    const light=draw([...(P.byCat.lighting||[]), ...(P.byCat.effects||[])], 2, u);
    const context=draw(P.context, actual==="sfw"?2:1, u);

    let action=[], actionCore;
    if(actual==="sfw"){
      actionCore=pick(SFW_ACTIONS,u);
      action=[actionCore.tag, ...context];
    }else{
      actionCore=pick(NSFW_CORES,u);
      action=[actionCore.tag, ...context];
    }

    const tension = tensionMode==="on" ? ["extreme perspective","strong foreshortening","dynamic composition","high visual tension","dutch angle","motion lines","lively movement"] : [];
    const rating = actual==="sfw" ? ["sfw","no text"] : ["explicit","uncensored","no text"];
    const quality = ["masterpiece","best quality"];

    const parts=[
      ...prefixFor(actual, partnerMode, manual),
      manual,
      ...quality,
      ...body, ...hair, ...eyes,
      ...face, ...clothes, ...acc,
      ...partnerTags(actual, partnerMode),
      ...action,
      ...scene, ...camera, ...light, ...tension,
      ...rating, ...guard(actual, partnerMode)
    ];
    const finalTags=compact(parts);
    const prompt=finalTags.join(", ");

    const actionZh=zhOf(actionCore);
    const sceneZh=scene.map(x=>zhOf(x)).slice(0,3).join(" / ") || "随机场景";
    const cameraZh=camera.map(x=>zhOf(x)).slice(0,3).join(" / ") || "随机镜头";
    const lightZh=light.map(x=>zhOf(x)).slice(0,3).join(" / ") || "随机光影";
    const partnerZh = actual==="nsfw" ? ({pov:"POV","1boy":"1boy","2boys":"2boys",group:"3boys+"}[partnerMode]||"POV") : "单人";
    const tensionZh = tensionMode==="on" ? "强张力开启" : "强张力关闭";
    const title=`${actual==="sfw"?"SFW":"NSFW"}｜${actionZh}`;
    const summaryHtml=`<div class="v154-summary-grid"><div><b>模式</b>${html(actual.toUpperCase())}；<b>交互方</b>${html(partnerZh)}；<b>${html(tensionZh)}</b></div><div><b>动作</b>${html(actionZh)}</div><div><b>动作补充</b>${html(context.map(x=>zhOf(x)).join(" / "))}</div><div><b>场景</b>${html(sceneZh)}</div><div><b>镜头/构图</b>${html(cameraZh)}</div><div><b>光影</b>${html(lightZh)}</div></div>`;
    return {title, prompt, summaryHtml};
  }

  window.renderBatch = function(){
    const P=buildPools();
    const cnt=Math.max(1,Math.min(50,Number($("#batch-count").value||8)));
    const mode=$("#batch-mode").value;
    const char=$("#batch-character").value;
    const partnerMode=$("#batch-partner-mode") ? $("#batch-partner-mode").value : "pov";
    const tensionMode=$("#batch-tension-mode") ? $("#batch-tension-mode").value : "on";
    const wrap=$("#batch-results");
    if(!wrap) return;
    const stats=$("#batch-pool-stats");
    if(stats) stats.textContent=`第二页 v1.7：SFW 动作核心 ${P.stats.sfwActions} 个；NSFW 动作核心 ${P.stats.nsfwActions} 个；动作补充上下文 ${P.stats.context} 条。动作不再由前 4 个种子截断生成。`;
    wrap.innerHTML="";
    const batchUsed=new Set();
    for(let i=0;i<cnt;i++){
      const item=makeV17(mode,char,partnerMode,tensionMode,batchUsed);
      const box=document.createElement("div");
      box.className="batch-item";
      box.innerHTML=`<h3>${i+1}. ${item.title}</h3><div class="summary">${item.summaryHtml}</div><textarea data-v152done="1" data-compacted="1">${item.prompt}</textarea><button class="copy-one">复制这一条</button>`;
      box.querySelector(".copy-one").onclick=()=>copyText(box.querySelector("textarea").value);
      wrap.appendChild(box);
    }
  };
  window.makePrompt = function(mode,char,partnerMode="pov",tensionMode="on",batchUsed=new Set()){
    return makeV17(mode,char,partnerMode,tensionMode,batchUsed);
  };
  function install(){
    const btn=$("#make-batch");
    if(btn) btn.onclick=window.renderBatch;
    const P=buildPools();
    const stats=$("#batch-pool-stats");
    if(stats) stats.textContent=`第二页 v1.7：SFW 动作核心 ${P.stats.sfwActions} 个；NSFW 动作核心 ${P.stats.nsfwActions} 个；动作补充上下文 ${P.stats.context} 条。`;
  }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded", install);
  else install();
  setTimeout(install, 500);
})();









/* ===== v1.9 pretranslated full prompt display =====
   这版不做运行时拆词翻译。
   整条 prompt 中文翻译只读取 tags.js 已预写的 zh 字段；额外固定词只查 EXACT_ZH。
*/
(function(){
  function norm(s){ return String(s||"").replace(/_/g," ").replace(/\s+/g," ").trim().toLowerCase(); }
  function esc(s){ return String(s||"").replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c])); }
  const ZH_BY_TAG = new Map();
  if(typeof activeTags !== "undefined" && Array.isArray(activeTags)){
    for(const t of activeTags){
      if(t && t.tag) ZH_BY_TAG.set(norm(t.tag), t.zh || t.tag);
    }
  }
  const EXACT_ZH = {
    "1girl":"单女主","solo":"单人","single focus":"单人焦点","1boy":"一名男性","2boys":"两名男性",
    "multiple boys":"多名男性","duo":"双人","threesome":"三人场景","group sex":"多人性爱",
    "consensual group sex":"自愿多人交互","pov":"第一人称视角","male pov":"男性第一人称视角",
    "masterpiece":"杰作","best quality":"最佳质量","sfw":"全年龄","explicit":"露骨","uncensored":"无码",
    "no text":"无文字","no extra characters":"不要额外角色","no multiple girls":"不要多名女性","no crowd":"不要人群",
    "single sex position":"单一性爱体位","one pose only":"仅一个姿势","only one boy":"仅一名男性","only two boys":"仅两名男性"
  };
  function zhOfTag(tag){
    const k = norm(tag);
    return ZH_BY_TAG.get(k) || EXACT_ZH[k] || tag;
  }
  function translatePrompt(prompt){
    const parts = String(prompt||"").split(",").map(s=>s.trim()).filter(Boolean);
    return parts.map((p,i)=>`${i+1}. ${zhOfTag(p)}`).join("\n");
  }
  function addZhBox(card){
    const ta = card.querySelector("textarea");
    if(!ta || card.querySelector(".zh-prompt-box")) return;
    const prompt = ta.value || ta.textContent || "";
    if(!prompt.trim()) return;
    const zh = translatePrompt(prompt);
    const box = document.createElement("div");
    box.className = "zh-prompt-box";
    box.innerHTML = `<div class="zh-prompt-title"><span>整条 prompt 中文翻译（预翻译词库）</span><button type="button" class="copy-zh-prompt">复制中文</button></div><div class="zh-prompt-text">${esc(zh)}</div>`;
    ta.insertAdjacentElement("afterend", box);
    box.querySelector(".copy-zh-prompt").onclick = () => {
      if(navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(zh);
      if(typeof toast === "function") toast("已复制中文翻译");
    };
  }
  const oldRender = window.renderBatch;
  if(typeof oldRender === "function"){
    window.renderBatch = function(){
      oldRender.apply(this, arguments);
      document.querySelectorAll(".batch-item").forEach(addZhBox);
    };
  }
  function install(){
    const btn = document.querySelector("#make-batch");
    if(btn && typeof window.renderBatch === "function") btn.onclick = window.renderBatch;
    document.querySelectorAll(".batch-item").forEach(addZhBox);
  }
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", install);
  else install();
  setTimeout(install, 300);
})();



/* ===== v1.9.3 action summary Chinese patch =====
   修动作栏仍有英文的问题：
   v1.7 的动作核心是硬编码数组，不一定存在于 tags.js，所以单靠预翻译 tags.js 不够。
   这里给动作核心补完整中文映射，并只在批量生成后重写一次卡片标题/动作行，不使用定时器。
*/
(function(){
  const ACTION_ZH = {"walking forward": "向前走来", "walking forward while looking back": "边走边回头", "running toward viewer": "朝镜头跑来", "running past camera": "从镜头旁跑过", "running up stairs": "跑上楼梯", "jumping lightly": "轻盈跳起", "jumping down from a step": "从台阶上跳下", "twirling around": "原地旋身", "dancing in place": "原地起舞", "spinning with skirt floating": "旋身时裙摆飘起", "turning around suddenly": "突然转身", "looking back over shoulder": "回头看", "reaching toward viewer": "朝镜头伸手", "leaning forward": "向前俯身", "stepping toward camera": "向镜头迈步", "kneeling down": "跪下", "sitting on the edge": "坐在边缘", "lying on bed": "躺在床上", "standing in strong wind": "强风中站立", "standing in wind": "风中站立", "opening door": "开门", "opening curtains": "拉开窗帘", "holding phone": "拿手机", "holding flower": "拿花", "holding book": "拿书", "holding umbrella": "撑伞", "holding drink toward viewer": "把饮料递向镜头", "adjusting clothes": "整理衣服", "fixing hair": "整理头发", "taking off jacket": "脱外套", "putting on glasses": "戴眼镜", "stretching after waking up": "起床后伸懒腰", "crouching close to camera": "靠近镜头蹲下", "resting chin on hand": "托腮", "covering mouth while laughing": "捂嘴笑", "walking barefoot": "赤脚行走", "catching falling petals": "接住落花", "standing on tiptoe": "踮脚站立", "climbing stairs and looking back": "上楼时回头", "leaning on desk": "靠在桌边", "sitting on railing": "坐在栏杆上", "running through rain": "雨中奔跑", "stepping over puddle": "跨过水洼", "walking through doorway": "穿过门口", "peeking from behind door": "从门后探身", "reaching upward": "向上伸手", "falling through the air": "空中坠落", "floating in zero gravity": "零重力漂浮", "splashing water": "泼水", "reading under blanket": "被窝里读书", "brushing hair": "梳头", "resting against window": "靠窗休息", "hiding behind curtain": "藏在窗帘后", "walking through crowd": "穿过人群", "posing for a photo": "摆拍", "turning with hair swinging": "甩发转身", "grabbing hat in wind": "风中按住帽子", "pulling sleeve": "拉袖口", "checking reflection": "看镜中倒影", "sitting cross-legged": "盘腿坐", "kneeling on bed": "跪在床上", "lying on stomach": "趴着", "looking over glasses": "越过眼镜看人", "tilting head": "歪头", "raising one knee": "抬起一膝", "standing with one leg forward": "单腿向前站立", "walking down stairs": "走下楼梯", "sliding across floor": "滑过地板", "holding hands behind back": "双手背在身后", "arms above head": "双臂举过头顶", "hands on hips": "双手叉腰", "one hand on chest": "单手按胸口", "one hand reaching out": "单手伸出", "opening locker": "打开储物柜", "tying ribbon": "系丝带", "putting on shoes": "穿鞋", "removing shoes": "脱鞋", "sitting by window": "坐在窗边", "writing in notebook": "在笔记本上写字", "taking a photo": "拍照", "playing with hair": "拨弄头发", "holding bag over shoulder": "单肩挎包", "turning page of book": "翻书页", "leaning on railing": "靠在栏杆上", "sitting on windowsill": "坐在窗台上", "lying on sofa": "躺在沙发上", "falling asleep at desk": "趴桌睡着", "waking up in bed": "在床上醒来", "pouring tea": "倒茶", "eating dessert": "吃甜点", "looking into mirror": "看向镜子", "wiping rain from face": "擦去脸上的雨水", "holding scarf in wind": "风中握住围巾", "standing under umbrella": "站在伞下", "catching hat blown by wind": "接住被风吹走的帽子", "tiptoeing across room": "踮脚穿过房间", "opening refrigerator": "打开冰箱", "hanging laundry": "晾衣服", "folding clothes": "叠衣服", "watering flowers": "浇花", "swinging legs while sitting": "坐着晃腿", "walking along seaside railing": "沿海边栏杆行走", "standing under streetlight": "站在路灯下", "running across rooftop": "跑过天台", "leaning out of window": "探出窗外", "holding letter close to chest": "把信贴在胸前", "picking up fallen object": "捡起掉落物", "turning toward sudden sound": "听到声音转身", "covering eyes from sunlight": "抬手遮挡阳光", "lifting curtain": "掀开窗帘", "sitting in train seat": "坐在电车座位上", "standing at vending machine": "站在自动贩卖机旁", "walking through shallow water": "踏过浅水", "stepping into moonlight": "走入月光中", "looking up at sky": "仰望天空", "holding lantern": "提着灯笼", "casting spell": "施法", "drawing sword": "拔剑", "holding fan": "拿着扇子", "opening folding fan": "展开折扇", "playing instrument": "演奏乐器", "singing on stage": "在舞台上唱歌", "reaching for high shelf": "伸手够高处架子", "pulling blanket up": "拉起毯子", "hugging pillow": "抱着枕头", "sitting on floor": "坐在地板上", "leaning back on hands": "双手后撑后仰", "balancing on one foot": "单脚保持平衡", "spooning sex": "侧卧抱入", "prone bone": "俯卧后入", "standing rear entry": "站立后入", "against window sex": "窗边做爱", "chair sex": "椅上做爱", "sofa sex": "沙发做爱", "floor sex": "地板做爱", "tabletop sex": "桌上做爱", "cunnilingus": "舔阴", "mutual masturbation": "互相自慰", "two boys servicing one girl": "双人侍奉"};

  function esc(s){
    return String(s||"").replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
  }
  function norm(s){
    return String(s||"").replace(/_/g," ").replace(/\s+/g," ").trim().toLowerCase();
  }
  function zhAction(s){
    const k = norm(s);
    return ACTION_ZH[k] || s;
  }
  function updateActionLines(){
    const cards = Array.from(document.querySelectorAll(".batch-item"));
    cards.forEach((card, idx)=>{
      const h3 = card.querySelector("h3");
      const summary = card.querySelector(".summary");
      if(!h3 || !summary) return;

      // 标题格式：1. SFW｜xxx
      const text = h3.textContent || "";
      const m = text.match(/^(\d+\.\s*)?(SFW|NSFW)\s*[|｜]\s*(.+)$/i);
      let mode = "SFW";
      let action = "";
      if(m){
        mode = m[2].toUpperCase();
        action = m[3].trim();
      }
      const actionZh = zhAction(action);
      h3.textContent = `${idx+1}. ${mode}｜${actionZh}`;

      // 只改 summary 中“动作”这一行，其他中文摘要保持不动。
      const rows = Array.from(summary.querySelectorAll("div"));
      for(const row of rows){
        const b = row.querySelector("b");
        if(!b) continue;
        if((b.textContent||"").trim() === "动作"){
          row.innerHTML = `<b>动作</b>${esc(actionZh)}`;
        }
      }
    });
  }
  const oldRender = window.renderBatch;
  if(typeof oldRender === "function" && !oldRender.__v193patched){
    const wrapped = function(){
      oldRender.apply(this, arguments);
      updateActionLines();
      // v1.9 中文整条 prompt 框是另一个 wrapper，有些浏览器执行顺序会晚一点，补一帧即可。
      setTimeout(updateActionLines, 0);
    };
    wrapped.__v193patched = true;
    window.renderBatch = wrapped;
    const btn = document.querySelector("#make-batch");
    if(btn) btn.onclick = window.renderBatch;
  }
  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", ()=>{
      const btn = document.querySelector("#make-batch");
      if(btn) btn.onclick = window.renderBatch;
      updateActionLines();
    });
  }else{
    const btn = document.querySelector("#make-batch");
    if(btn) btn.onclick = window.renderBatch;
    updateActionLines();
  }
})();



/* ===== v1.9.4 visible-genital lock for NSFW =====
   修复 NSFW 正常位/种付位等体位经常看不到插入、阴部、阴茎的问题。
   做法：
   1. NSFW_CORES 已经加入 pussy / visible pussy / penis / visible penis / vaginal penetration / genital focus。
   2. 这里再做一次生成后兜底，防止旧的压缩器把这些词裁掉。
*/
(function(){
  const LOCKS = [
    "pussy",
    "visible pussy",
    "penis",
    "visible penis",
    "erect penis",
    "vaginal penetration",
    "penis insertion",
    "penis inside pussy",
    "genital focus",
    "explicit genitalia",
    "uncensored genitals"
  ];
  const PENETRATION_HINTS = [
    "missionary position", "breeding press", "mating press", "doggystyle", "side entry sex",
    "cowgirl position", "reverse cowgirl", "lifted sex", "wall sex", "bed edge sex",
    "bent over desk", "mirror sex", "standing sex", "sitting on partner's lap",
    "pinned down on floor", "shower sex", "spooning sex", "prone bone", "standing rear entry",
    "against window sex", "chair sex", "sofa sex", "floor sex", "tabletop sex"
  ];
  function hasAny(s, arr){
    const x = String(s || "").toLowerCase();
    return arr.some(k => x.includes(k));
  }
  function ensureLocks(text){
    const lower = String(text || "").toLowerCase();
    if(!hasAny(lower, PENETRATION_HINTS)) return text;
    const tags = String(text || "").split(",").map(s => s.trim()).filter(Boolean);
    const seen = new Set(tags.map(t => t.toLowerCase()));
    for(const lock of LOCKS){
      if(!seen.has(lock)) tags.push(lock);
    }
    return tags.join(", ");
  }
  function patchCards(){
    document.querySelectorAll(".batch-item textarea").forEach(ta=>{
      const old = ta.value || ta.textContent || "";
      const newer = ensureLocks(old);
      if(newer !== old){
        if("value" in ta) ta.value = newer;
        else ta.textContent = newer;
      }
    });
  }
  const oldRender = window.renderBatch;
  if(typeof oldRender === "function" && !oldRender.__v194patched){
    const wrapped = function(){
      oldRender.apply(this, arguments);
      patchCards();
      setTimeout(patchCards, 0);
      setTimeout(patchCards, 120);
    };
    wrapped.__v194patched = true;
    window.renderBatch = wrapped;
    const btn = document.querySelector("#make-batch");
    if(btn) btn.onclick = window.renderBatch;
  }
  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", ()=>{
      const btn = document.querySelector("#make-batch");
      if(btn) btn.onclick = window.renderBatch;
      patchCards();
    });
  }else{
    const btn = document.querySelector("#make-batch");
    if(btn) btn.onclick = window.renderBatch;
    patchCards();
  }
})();



/* ===== v1.9.5 expanded NSFW position bank =====
   大幅扩充 NSFW 体位池：前入、后入、侧入、坐入、站立、墙边、家具、口交/手交/非插入、肛交、多人等。
   保持一次只抽一个主行为，避免互斥体位打架。
*/
(function(){
  const ACTION_TITLE_ZH = {"missionary position, female lying on back, legs spread, male on top, vaginal sex, penis tip entering pussy, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "正常位", "missionary position, female lying on back, legs wrapped around waist, male on top, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "抱腰正常位", "missionary position, female lying on back, ankles held up, male on top, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "抬脚正常位", "missionary position, legs on shoulders, female lying on back, male on top, knees near chest, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "腿架肩正常位", "breeding press, mating press, female lying on back, knees pressed to chest, male on top, not cowgirl, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "种付位", "seashell position, female lying on back, legs folded high, knees near shoulders, male on top, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "贝壳位", "butterfly position, female lying on bed edge, hips lifted, partner standing, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "蝴蝶位", "tabletop sex, sitting on table edge, legs spread, partner standing, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "桌面坐入", "g-whiz position, female lying on back, legs over partner shoulders, hips lifted, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "G点抬腿位", "coital alignment technique, missionary position, bodies pressed close, grinding penetration, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "贴合正常位", "folded deckchair position, female lying on back, legs folded up, male leaning over, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "折叠椅位", "eagle position, female lying on back, legs spread wide, male on top, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "展鹰位", "piledriver position, female lying on back, hips raised high, legs vertical, male standing, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "打桩位", "lotus missionary, female lying on back, legs crossed behind partner, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "交缠正常位", "doggystyle, on all fours, hips raised, male behind, vaginal sex from behind, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "后入位", "low doggystyle, chest down, hips raised, male behind, vaginal sex from behind, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "低伏后入", "standing doggystyle, standing rear entry, hands on wall, male behind, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "站立后入", "bent over desk, hands on table, doggystyle from behind, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "桌边后入", "bent over bed, knees on floor, upper body on bed, male behind, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "床边俯身后入", "prone bone, lying on stomach, partner pressing from behind, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "俯卧后入", "prone bone with pillow under hips, lying on stomach, hips raised, vaginal sex from behind, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "垫枕俯卧后入", "flatiron position, lying face down, legs together, partner on top from behind, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "熨斗位", "turtle position, kneeling curled forward, hips raised, male behind, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "龟缩后入", "downward dog position, hands and feet on floor, hips high, male behind, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "下犬式后入", "standing bent over, hands on knees, male behind, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "扶膝后入", "over the lap rear entry, female bent over partner lap, vaginal sex from behind, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "趴腿后入", "kneeling rear entry, female kneeling upright, male behind, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "跪姿后入", "mirror sex, hands on sink, male behind, mirror reflection visible, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "镜前后入", "spooning sex, both lying sideways, partner behind, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "侧卧抱入", "side entry sex, side lying position, one leg raised, vaginal sex from side, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "侧入位", "face-to-face side sex, both lying sideways facing each other, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "侧卧面对面", "scissors position, legs intertwined, side entry vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "剪刀交缠位", "pretzel dip position, female lying on side, one leg raised, partner kneeling, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "椒盐卷饼位", "spork position, female lying on side, one leg lifted, partner between legs, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "叉勺位", "side saddle position, female lying on side, partner kneeling beside her, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "侧鞍位", "lazy spoon position, relaxed side lying rear entry, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "懒人汤匙位", "leg over hip side sex, one leg over partner hip, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "搭髋侧入", "cowgirl position, woman on top, straddling partner, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "骑乘位", "reverse cowgirl, woman on top facing away, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "背面骑乘", "squatting cowgirl, woman squatting on top, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "深蹲骑乘", "leaning forward cowgirl, woman on top leaning down, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "前倾骑乘", "reclining cowgirl, woman on top leaning back, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "后仰骑乘", "sideways cowgirl, woman sitting sideways on partner, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "侧坐骑乘", "lap sex, sitting on partner lap, face-to-face, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "面对面膝上位", "chair sex, sitting on partner lap on chair, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "椅上骑乘", "lotus position, seated face-to-face, legs wrapped around partner, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "莲花坐位", "yab-yum position, seated face-to-face, close embrace, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "双修坐位", "face-off position, partner sitting on chair, woman sitting on lap facing partner, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "面对面椅坐位", "sofa lap sex, sitting on partner lap on sofa, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "沙发膝上位", "straddling on bed, woman on top, knees on bed, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "床上跨坐位", "standing sex, one leg lifted, body pressed close, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "站立插入", "standing face-to-face sex, one leg around partner waist, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "面对面站立位", "lifted sex, legs wrapped around waist, partner holding thighs, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "抱起插入", "standing carry position, partner lifting female by thighs, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "托腿抱入", "wall sex, back against wall, one leg raised, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "墙边插入", "against window sex, hands on glass, city lights outside, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "窗边插入", "countertop sex, sitting on counter edge, legs spread, partner standing, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "台面插入", "stair sex, female sitting on stairs, partner kneeling, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "楼梯坐入", "shower sex, wet body, steam, hands on wall, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "淋浴间插入", "bathtub sex, wet body, sitting in bathtub, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "浴缸插入", "sofa sex, lying back on sofa, partner above, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "沙发正常位", "floor sex, lying on floor, partner above, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "地板正常位", "standing split-leg sex, one leg lifted high, partner standing, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "高抬腿站立位", "anal sex, doggystyle, on all fours, male behind, anal penetration, anus, visible anus, penis, visible penis, erect penis, anal penetration, penis inside anus, genital focus, explicit genitalia, uncensored genitals": "后入肛交", "anal sex, missionary position, female lying on back, male on top, anal penetration, anus, visible anus, penis, visible penis, erect penis, anal penetration, penis inside anus, genital focus, explicit genitalia, uncensored genitals": "正常位肛交", "anal sex, spooning position, side lying rear entry, anal penetration, anus, visible anus, penis, visible penis, erect penis, anal penetration, penis inside anus, genital focus, explicit genitalia, uncensored genitals": "侧卧肛交", "anal sex, cowgirl position, woman on top, anal penetration, anus, visible anus, penis, visible penis, erect penis, anal penetration, penis inside anus, genital focus, explicit genitalia, uncensored genitals": "骑乘肛交", "anal sex, bent over desk, male behind, anal penetration, anus, visible anus, penis, visible penis, erect penis, anal penetration, penis inside anus, genital focus, explicit genitalia, uncensored genitals": "桌边肛交", "anal sex, prone bone, lying on stomach, anal penetration from behind, anus, visible anus, penis, visible penis, erect penis, anal penetration, penis inside anus, genital focus, explicit genitalia, uncensored genitals": "俯卧肛交", "blowjob, oral sex, penis in mouth, kneeling close to partner, penis, visible penis, erect penis, mouth contact, genital focus, explicit genitalia, uncensored genitals": "口交", "deepthroat, oral sex, penis deep in mouth, head tilted back, wet eyes, penis, visible penis, erect penis, mouth contact, genital focus, explicit genitalia, uncensored genitals": "深喉", "face fucking, oral sex, penis in mouth, partner holding head, penis, visible penis, erect penis, mouth contact, genital focus, explicit genitalia, uncensored genitals": "口交抽插", "sixty-nine position, mutual oral sex, oral sex, legs intertwined, penis, visible penis, erect penis, mouth contact, genital focus, explicit genitalia, uncensored genitals": "六九式", "side-by-side 69 position, mutual oral sex, both lying sideways, penis, visible penis, erect penis, mouth contact, genital focus, explicit genitalia, uncensored genitals": "侧卧六九式", "standing blowjob, partner standing, kneeling oral sex, penis, visible penis, erect penis, mouth contact, genital focus, explicit genitalia, uncensored genitals": "站立口交", "paizuri blowjob, breastjob and oral sex together, penis between breasts and mouth, penis, visible penis, erect penis, mouth contact, genital focus, explicit genitalia, uncensored genitals": "乳交口交", "handjob, female hand on penis, hand around shaft, close-up service, penis, visible penis, erect penis, genital focus, explicit genitalia, uncensored genitals": "手交", "two-handed handjob, both hands around penis, close-up service, penis, visible penis, erect penis, genital focus, explicit genitalia, uncensored genitals": "双手手交", "thighjob, penis between thighs, thighs pressed together, penis, visible penis, erect penis, genital focus, explicit genitalia, uncensored genitals": "素股", "breastjob, penis between breasts, hands pressing breasts together, penis, visible penis, erect penis, genital focus, explicit genitalia, uncensored genitals": "乳交", "footjob, bare feet foreground, soles framing shaft, penis, visible penis, erect penis, genital focus, explicit genitalia, uncensored genitals": "足交", "armpit sex, penis under armpit, arm pressed against shaft, penis, visible penis, erect penis, genital focus, explicit genitalia, uncensored genitals": "腋交", "cunnilingus, face between thighs, legs spread, tongue on pussy, pussy, visible pussy, spread pussy, genital focus, explicit genitalia, uncensored genitals": "舔阴", "facesitting, woman sitting on partner face, oral sex on pussy, pussy, visible pussy, spread pussy, genital focus, explicit genitalia, uncensored genitals": "坐脸舔阴", "reverse facesitting, woman sitting on partner face facing away, oral sex on pussy, pussy, visible pussy, spread pussy, genital focus, explicit genitalia, uncensored genitals": "反向坐脸", "fingering, hand between thighs, fingers inside pussy, pussy, visible pussy, spread pussy, genital focus, explicit genitalia, uncensored genitals": "指交", "two-finger penetration, fingers inside pussy, spread pussy, pussy, visible pussy, spread pussy, genital focus, explicit genitalia, uncensored genitals": "双指插入", "mutual masturbation, hands between thighs, close-up genital focus, pussy, visible pussy, spread pussy, genital focus, explicit genitalia, uncensored genitals": "互相自慰", "tribadism, scissoring, pussy rubbing, legs intertwined, pussy, visible pussy, spread pussy, genital focus, explicit genitalia, uncensored genitals": "磨豆腐剪刀位", "intercrural sex, penis between thighs, nonpenetrative sex, penis, visible penis, erect penis, genital focus, explicit genitalia, uncensored genitals": "股间性交", "after sex, creampie, cum leaking from pussy, lying on bed, pussy, visible pussy, spread pussy, genital focus, explicit genitalia, uncensored genitals": "中出事后", "standing creampie aftermath, cum leaking from pussy, shaky legs, pussy, visible pussy, spread pussy, genital focus, explicit genitalia, uncensored genitals": "站立中出事后", "cum shower, cum on face, cum on body, kneeling, penis, visible penis, erect penis, genital focus, explicit genitalia, uncensored genitals": "精液浴", "cum on tongue, oral sex aftermath, tongue out, penis, visible penis, erect penis, mouth contact, genital focus, explicit genitalia, uncensored genitals": "口部事后", "spitroast, one partner in front, one partner behind, consensual group sex, vaginal penetration, oral sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "前后夹击", "double penetration, consensual group sex, vaginal penetration, anal penetration, multiple visible penises, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "双穴插入", "two boys servicing one girl, consensual group sex, multiple visible penises, penis, visible penis, erect penis, genital focus, explicit genitalia, uncensored genitals": "双人侍奉", "group sex, multiple visible male partners, consensual group sex, multiple visible penises, penis, visible penis, erect penis, genital focus, explicit genitalia, uncensored genitals": "多人性爱", "bukkake, multiple visible penises, cum on face, cum on body, kneeling, penis, visible penis, erect penis, genital focus, explicit genitalia, uncensored genitals": "多人射精"};
  const EXTRA_ZH = {"anus": "肛门", "visible anus": "可见肛门", "anal sex": "肛交", "anal penetration": "肛门插入", "penis inside anus": "阴茎插入肛门", "vulva": "外阴", "visible vulva": "可见外阴", "pussy focus": "阴部特写", "penis focus": "阴茎特写", "mouth contact": "口部接触", "mouth around penis": "嘴含阴茎", "hand around penis": "手握阴茎", "fingers inside pussy": "手指插入阴道", "tongue on pussy": "舌头舔阴", "straddling face": "跨坐脸部", "multiple visible penises": "多根可见阴茎", "bukkake": "多人射精", "cum on tongue": "舌头上的精液", "cum leaking from pussy": "精液从阴道流出", "shaky legs": "腿发抖", "legs intertwined": "双腿交缠", "partner holding head": "伴侣扶住头部", "missionary position, female lying on back, legs spread, male on top, vaginal sex, penis tip entering pussy, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "正常位", "missionary position, female lying on back, legs wrapped around waist, male on top, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "抱腰正常位", "missionary position, female lying on back, ankles held up, male on top, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "抬脚正常位", "missionary position, legs on shoulders, female lying on back, male on top, knees near chest, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "腿架肩正常位", "breeding press, mating press, female lying on back, knees pressed to chest, male on top, not cowgirl, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "种付位", "seashell position, female lying on back, legs folded high, knees near shoulders, male on top, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "贝壳位", "butterfly position, female lying on bed edge, hips lifted, partner standing, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "蝴蝶位", "tabletop sex, sitting on table edge, legs spread, partner standing, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "桌面坐入", "g-whiz position, female lying on back, legs over partner shoulders, hips lifted, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "G点抬腿位", "coital alignment technique, missionary position, bodies pressed close, grinding penetration, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "贴合正常位", "folded deckchair position, female lying on back, legs folded up, male leaning over, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "折叠椅位", "eagle position, female lying on back, legs spread wide, male on top, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "展鹰位", "piledriver position, female lying on back, hips raised high, legs vertical, male standing, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "打桩位", "lotus missionary, female lying on back, legs crossed behind partner, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "交缠正常位", "doggystyle, on all fours, hips raised, male behind, vaginal sex from behind, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "后入位", "low doggystyle, chest down, hips raised, male behind, vaginal sex from behind, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "低伏后入", "standing doggystyle, standing rear entry, hands on wall, male behind, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "站立后入", "bent over desk, hands on table, doggystyle from behind, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "桌边后入", "bent over bed, knees on floor, upper body on bed, male behind, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "床边俯身后入", "prone bone, lying on stomach, partner pressing from behind, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "俯卧后入", "prone bone with pillow under hips, lying on stomach, hips raised, vaginal sex from behind, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "垫枕俯卧后入", "flatiron position, lying face down, legs together, partner on top from behind, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "熨斗位", "turtle position, kneeling curled forward, hips raised, male behind, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "龟缩后入", "downward dog position, hands and feet on floor, hips high, male behind, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "下犬式后入", "standing bent over, hands on knees, male behind, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "扶膝后入", "over the lap rear entry, female bent over partner lap, vaginal sex from behind, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "趴腿后入", "kneeling rear entry, female kneeling upright, male behind, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "跪姿后入", "mirror sex, hands on sink, male behind, mirror reflection visible, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "镜前后入", "spooning sex, both lying sideways, partner behind, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "侧卧抱入", "side entry sex, side lying position, one leg raised, vaginal sex from side, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "侧入位", "face-to-face side sex, both lying sideways facing each other, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "侧卧面对面", "scissors position, legs intertwined, side entry vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "剪刀交缠位", "pretzel dip position, female lying on side, one leg raised, partner kneeling, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "椒盐卷饼位", "spork position, female lying on side, one leg lifted, partner between legs, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "叉勺位", "side saddle position, female lying on side, partner kneeling beside her, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "侧鞍位", "lazy spoon position, relaxed side lying rear entry, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "懒人汤匙位", "leg over hip side sex, one leg over partner hip, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "搭髋侧入", "cowgirl position, woman on top, straddling partner, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "骑乘位", "reverse cowgirl, woman on top facing away, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "背面骑乘", "squatting cowgirl, woman squatting on top, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "深蹲骑乘", "leaning forward cowgirl, woman on top leaning down, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "前倾骑乘", "reclining cowgirl, woman on top leaning back, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "后仰骑乘", "sideways cowgirl, woman sitting sideways on partner, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "侧坐骑乘", "lap sex, sitting on partner lap, face-to-face, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "面对面膝上位", "chair sex, sitting on partner lap on chair, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "椅上骑乘", "lotus position, seated face-to-face, legs wrapped around partner, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "莲花坐位", "yab-yum position, seated face-to-face, close embrace, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "双修坐位", "face-off position, partner sitting on chair, woman sitting on lap facing partner, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "面对面椅坐位", "sofa lap sex, sitting on partner lap on sofa, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "沙发膝上位", "straddling on bed, woman on top, knees on bed, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "床上跨坐位", "standing sex, one leg lifted, body pressed close, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "站立插入", "standing face-to-face sex, one leg around partner waist, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "面对面站立位", "lifted sex, legs wrapped around waist, partner holding thighs, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "抱起插入", "standing carry position, partner lifting female by thighs, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "托腿抱入", "wall sex, back against wall, one leg raised, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "墙边插入", "against window sex, hands on glass, city lights outside, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "窗边插入", "countertop sex, sitting on counter edge, legs spread, partner standing, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "台面插入", "stair sex, female sitting on stairs, partner kneeling, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "楼梯坐入", "shower sex, wet body, steam, hands on wall, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "淋浴间插入", "bathtub sex, wet body, sitting in bathtub, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "浴缸插入", "sofa sex, lying back on sofa, partner above, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "沙发正常位", "floor sex, lying on floor, partner above, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "地板正常位", "standing split-leg sex, one leg lifted high, partner standing, vaginal sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "高抬腿站立位", "anal sex, doggystyle, on all fours, male behind, anal penetration, anus, visible anus, penis, visible penis, erect penis, anal penetration, penis inside anus, genital focus, explicit genitalia, uncensored genitals": "后入肛交", "anal sex, missionary position, female lying on back, male on top, anal penetration, anus, visible anus, penis, visible penis, erect penis, anal penetration, penis inside anus, genital focus, explicit genitalia, uncensored genitals": "正常位肛交", "anal sex, spooning position, side lying rear entry, anal penetration, anus, visible anus, penis, visible penis, erect penis, anal penetration, penis inside anus, genital focus, explicit genitalia, uncensored genitals": "侧卧肛交", "anal sex, cowgirl position, woman on top, anal penetration, anus, visible anus, penis, visible penis, erect penis, anal penetration, penis inside anus, genital focus, explicit genitalia, uncensored genitals": "骑乘肛交", "anal sex, bent over desk, male behind, anal penetration, anus, visible anus, penis, visible penis, erect penis, anal penetration, penis inside anus, genital focus, explicit genitalia, uncensored genitals": "桌边肛交", "anal sex, prone bone, lying on stomach, anal penetration from behind, anus, visible anus, penis, visible penis, erect penis, anal penetration, penis inside anus, genital focus, explicit genitalia, uncensored genitals": "俯卧肛交", "blowjob, oral sex, penis in mouth, kneeling close to partner, penis, visible penis, erect penis, mouth contact, genital focus, explicit genitalia, uncensored genitals": "口交", "deepthroat, oral sex, penis deep in mouth, head tilted back, wet eyes, penis, visible penis, erect penis, mouth contact, genital focus, explicit genitalia, uncensored genitals": "深喉", "face fucking, oral sex, penis in mouth, partner holding head, penis, visible penis, erect penis, mouth contact, genital focus, explicit genitalia, uncensored genitals": "口交抽插", "sixty-nine position, mutual oral sex, oral sex, legs intertwined, penis, visible penis, erect penis, mouth contact, genital focus, explicit genitalia, uncensored genitals": "六九式", "side-by-side 69 position, mutual oral sex, both lying sideways, penis, visible penis, erect penis, mouth contact, genital focus, explicit genitalia, uncensored genitals": "侧卧六九式", "standing blowjob, partner standing, kneeling oral sex, penis, visible penis, erect penis, mouth contact, genital focus, explicit genitalia, uncensored genitals": "站立口交", "paizuri blowjob, breastjob and oral sex together, penis between breasts and mouth, penis, visible penis, erect penis, mouth contact, genital focus, explicit genitalia, uncensored genitals": "乳交口交", "handjob, female hand on penis, hand around shaft, close-up service, penis, visible penis, erect penis, genital focus, explicit genitalia, uncensored genitals": "手交", "two-handed handjob, both hands around penis, close-up service, penis, visible penis, erect penis, genital focus, explicit genitalia, uncensored genitals": "双手手交", "thighjob, penis between thighs, thighs pressed together, penis, visible penis, erect penis, genital focus, explicit genitalia, uncensored genitals": "素股", "breastjob, penis between breasts, hands pressing breasts together, penis, visible penis, erect penis, genital focus, explicit genitalia, uncensored genitals": "乳交", "footjob, bare feet foreground, soles framing shaft, penis, visible penis, erect penis, genital focus, explicit genitalia, uncensored genitals": "足交", "armpit sex, penis under armpit, arm pressed against shaft, penis, visible penis, erect penis, genital focus, explicit genitalia, uncensored genitals": "腋交", "cunnilingus, face between thighs, legs spread, tongue on pussy, pussy, visible pussy, spread pussy, genital focus, explicit genitalia, uncensored genitals": "舔阴", "facesitting, woman sitting on partner face, oral sex on pussy, pussy, visible pussy, spread pussy, genital focus, explicit genitalia, uncensored genitals": "坐脸舔阴", "reverse facesitting, woman sitting on partner face facing away, oral sex on pussy, pussy, visible pussy, spread pussy, genital focus, explicit genitalia, uncensored genitals": "反向坐脸", "fingering, hand between thighs, fingers inside pussy, pussy, visible pussy, spread pussy, genital focus, explicit genitalia, uncensored genitals": "指交", "two-finger penetration, fingers inside pussy, spread pussy, pussy, visible pussy, spread pussy, genital focus, explicit genitalia, uncensored genitals": "双指插入", "mutual masturbation, hands between thighs, close-up genital focus, pussy, visible pussy, spread pussy, genital focus, explicit genitalia, uncensored genitals": "互相自慰", "tribadism, scissoring, pussy rubbing, legs intertwined, pussy, visible pussy, spread pussy, genital focus, explicit genitalia, uncensored genitals": "磨豆腐剪刀位", "intercrural sex, penis between thighs, nonpenetrative sex, penis, visible penis, erect penis, genital focus, explicit genitalia, uncensored genitals": "股间性交", "after sex, creampie, cum leaking from pussy, lying on bed, pussy, visible pussy, spread pussy, genital focus, explicit genitalia, uncensored genitals": "中出事后", "standing creampie aftermath, cum leaking from pussy, shaky legs, pussy, visible pussy, spread pussy, genital focus, explicit genitalia, uncensored genitals": "站立中出事后", "cum shower, cum on face, cum on body, kneeling, penis, visible penis, erect penis, genital focus, explicit genitalia, uncensored genitals": "精液浴", "cum on tongue, oral sex aftermath, tongue out, penis, visible penis, erect penis, mouth contact, genital focus, explicit genitalia, uncensored genitals": "口部事后", "spitroast, one partner in front, one partner behind, consensual group sex, vaginal penetration, oral sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "前后夹击", "double penetration, consensual group sex, vaginal penetration, anal penetration, multiple visible penises, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals": "双穴插入", "two boys servicing one girl, consensual group sex, multiple visible penises, penis, visible penis, erect penis, genital focus, explicit genitalia, uncensored genitals": "双人侍奉", "group sex, multiple visible male partners, consensual group sex, multiple visible penises, penis, visible penis, erect penis, genital focus, explicit genitalia, uncensored genitals": "多人性爱", "bukkake, multiple visible penises, cum on face, cum on body, kneeling, penis, visible penis, erect penis, genital focus, explicit genitalia, uncensored genitals": "多人射精"};
  function norm(s){ return String(s||"").replace(/_/g," ").replace(/\s+/g," ").trim().toLowerCase(); }
  function esc(s){ return String(s||"").replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c])); }
  function splitTags(prompt){ return String(prompt||"").split(",").map(s=>s.trim()).filter(Boolean); }
  function zhOfTag(tag){
    const k=norm(tag);
    if(EXTRA_ZH[k]) return EXTRA_ZH[k];
    if(typeof activeTags!=="undefined" && Array.isArray(activeTags)){
      const found=activeTags.find(t=>norm(t.tag)===k);
      if(found) return found.zh || found.tag;
    }
    return tag;
  }
  function translatePrompt(prompt){ return splitTags(prompt).map((p,i)=>`${i+1}. ${zhOfTag(p)}`).join("\n"); }
  function refreshZhBox(card){
    const ta=card.querySelector("textarea");
    if(!ta) return;
    const prompt=ta.value || ta.textContent || "";
    const zh=translatePrompt(prompt);
    let box=card.querySelector(".zh-prompt-box");
    if(!box){
      box=document.createElement("div");
      box.className="zh-prompt-box";
      ta.insertAdjacentElement("afterend", box);
    }
    box.innerHTML=`<div class="zh-prompt-title"><span>整条 prompt 中文翻译（扩展 NSFW 词库）</span><button type="button" class="copy-zh-prompt">复制中文</button></div><div class="zh-prompt-text">${esc(zh)}</div>`;
    box.querySelector(".copy-zh-prompt").onclick=()=>{
      if(navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(zh);
      if(typeof toast==="function") toast("已复制中文翻译");
    };
  }
  function updateCards(){
    document.querySelectorAll(".batch-item").forEach(card=>{
      const h3=card.querySelector("h3");
      if(h3){
        const text=h3.textContent || "";
        const m=text.match(/^(\d+\.\s*)?(SFW|NSFW)\s*[|｜]\s*(.+)$/i);
        if(m){
          const action=m[3].trim();
          const z=ACTION_TITLE_ZH[action] || ACTION_TITLE_ZH[norm(action)];
          if(z) h3.textContent=`${m[1]||""}${m[2].toUpperCase()}｜${z}`;
        }
      }
      refreshZhBox(card);
    });
  }
  const oldRender=window.renderBatch;
  if(typeof oldRender==="function" && !oldRender.__v195patched){
    const wrapped=function(){
      oldRender.apply(this, arguments);
      updateCards();
      setTimeout(updateCards,0);
    };
    wrapped.__v195patched=true;
    window.renderBatch=wrapped;
    const btn=document.querySelector("#make-batch");
    if(btn) btn.onclick=window.renderBatch;
  }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded", ()=>{
    const btn=document.querySelector("#make-batch");
    if(btn) btn.onclick=window.renderBatch;
    updateCards();
  });
  else {
    const btn=document.querySelector("#make-batch");
    if(btn) btn.onclick=window.renderBatch;
    updateCards();
  }
})();









/* ===== v1.9.7 switchable NSFW location + toy layer =====
   地点层 / 小道具层改为：关闭 / 随机 / 指定。
   控制项在第二页下拉框中选择，只作用于 NSFW 结果。
*/
(function(){
  const LOCATIONS = [
    {id:'standing', tag:'standing position, standing sex setting', zh:'站立'},
    {id:'wall', tag:'against wall, wall sex setting', zh:'墙边'},
    {id:'lifted', tag:'lifted in arms, carried sex setting', zh:'抱起'},
    {id:'window', tag:'beside window, against window, hands on glass', zh:'窗边'},
    {id:'shower', tag:'in shower, shower room, wet body, steam', zh:'淋浴间'},
    {id:'bededge', tag:'on bed edge, bed edge sex setting', zh:'床边'},
    {id:'sofa', tag:'on sofa, sofa sex setting', zh:'沙发'},
    {id:'floor', tag:'on floor, floor sex setting', zh:'地板'},
    {id:'table', tag:'on table edge, tabletop sex setting', zh:'桌边'},
    {id:'mirror', tag:'in front of mirror, mirror reflection visible', zh:'镜前'},
    {id:'chair', tag:'on chair, chair sex setting', zh:'椅上'},
    {id:'lap', tag:'on lap, sitting on partner lap', zh:'膝上'},
    {id:'sink', tag:'on bathroom sink, sink sex setting', zh:'洗手台'},
    {id:'railing', tag:'against railing, railing sex setting', zh:'栏杆'},
    {id:'car', tag:'inside car, car sex setting, cramped interior', zh:'车内'}
  ];
  const TOYS = [
    {id:'anal_beads', tag:'anal beads, anal beads inserted, adult toy, genital focus', zh:'肛珠'},
    {id:'butt_plug', tag:'butt plug, anal plug, adult toy, genital focus', zh:'肛塞'},
    {id:'dildo', tag:'dildo, dildo inserted, adult toy, genital focus', zh:'自慰棒'},
    {id:'vibrator', tag:'vibrator, vibrator on pussy, adult toy, genital focus', zh:'震动棒'},
    {id:'wand', tag:'massage wand, wand vibrator, adult toy, genital focus', zh:'按摩棒'},
    {id:'nipple_clamps', tag:'nipple clamps, nipple clamps attached, breast focus', zh:'乳夹'},
    {id:'tentacles', tag:'tentacles, tentacle sex, tentacles around body, fantasy creature sex', zh:'触手'},
    {id:'slime', tag:'slime, slime sex, slime on body, fantasy creature sex', zh:'史莱姆'}
  ];
  const EXTRA_ZH = new Map();
  [...LOCATIONS, ...TOYS].forEach(x=>{
    x.tag.split(',').map(s=>s.trim()).filter(Boolean).forEach(t=>EXTRA_ZH.set(norm(t), x.zh));
    EXTRA_ZH.set(norm(x.tag), x.zh);
  });
  function norm(s){return String(s||'').replace(/_/g,' ').replace(/\s+/g,' ').trim().toLowerCase();}
  function esc(s){return String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function byId(pool,id){return pool.find(x=>x.id===id)||pool[0];}
  function pick(pool,text){
    const low=String(text||'').toLowerCase();
    const candidates=pool.filter(x=>!x.tag.split(',').some(t=>low.includes(t.trim().toLowerCase())));
    const arr=candidates.length?candidates:pool;
    return arr[Math.floor(Math.random()*arr.length)];
  }
  function selected(pool, modeId, choiceId, prompt){
    const mode=document.querySelector(modeId)?.value || 'off';
    if(mode==='off') return null;
    if(mode==='custom') return byId(pool, document.querySelector(choiceId)?.value);
    return pick(pool,prompt);
  }
  function ensureTags(prompt,item){
    if(!item) return prompt;
    const tags=String(prompt||'').split(',').map(s=>s.trim()).filter(Boolean);
    const seen=new Set(tags.map(norm));
    for(const t of item.tag.split(',').map(s=>s.trim()).filter(Boolean)){
      if(!seen.has(norm(t))){tags.push(t);seen.add(norm(t));}
    }
    return tags.join(', ');
  }
  function isNSFW(card,prompt){
    const h3=(card.querySelector('h3')?.textContent||'').toLowerCase();
    const p=String(prompt||'').toLowerCase();
    return h3.includes('nsfw') || p.includes('explicit') || p.includes('uncensored') || p.includes('vaginal sex') || p.includes('penis');
  }
  function translatePrompt(prompt){
    const tags=String(prompt||'').split(',').map(s=>s.trim()).filter(Boolean);
    return tags.map((t,i)=>{
      const k=norm(t);
      let zh=EXTRA_ZH.get(k);
      if(!zh && typeof activeTags!=='undefined' && Array.isArray(activeTags)){
        const found=activeTags.find(x=>norm(x.tag)===k);
        if(found) zh=found.zh || found.tag;
      }
      return `${i+1}. ${zh || t}`;
    }).join('\n');
  }
  function patchSummary(card,loc,toy){
    const summary=card.querySelector('.summary');
    if(!summary) return;
    summary.querySelectorAll('.v197-location-line,.v197-toy-line').forEach(x=>x.remove());
    const div1=document.createElement('div');
    div1.className='v197-location-line';
    div1.innerHTML=`<b>地点</b>${esc(loc ? loc.zh : '关闭')}`;
    summary.appendChild(div1);
    const div2=document.createElement('div');
    div2.className='v197-toy-line';
    div2.innerHTML=`<b>小道具</b>${esc(toy ? toy.zh : '关闭')}`;
    summary.appendChild(div2);
  }
  function refreshZhBox(card,prompt){
    let box=card.querySelector('.zh-prompt-box');
    if(!box) return;
    const zh=translatePrompt(prompt);
    box.innerHTML=`<div class="zh-prompt-title"><span>整条 prompt 中文翻译（v1.9.7 地点/小道具可控）</span><button type="button" class="copy-zh-prompt">复制中文</button></div><div class="zh-prompt-text">${esc(zh)}</div>`;
    const btn=box.querySelector('.copy-zh-prompt');
    if(btn) btn.onclick=()=>{if(navigator.clipboard&&navigator.clipboard.writeText) navigator.clipboard.writeText(zh); if(typeof toast==='function') toast('已复制中文翻译');};
  }
  function populateSelect(sel,pool){
    const el=document.querySelector(sel); if(!el || el.dataset.v197populated==='1') return;
    el.innerHTML=pool.map(x=>`<option value="${esc(x.id)}">${esc(x.zh)}</option>`).join('');
    el.dataset.v197populated='1';
  }
  function initControls(){
    populateSelect('#batch-location-choice',LOCATIONS);
    populateSelect('#batch-toy-choice',TOYS);
  }
  function patchCards(){
    initControls();
    document.querySelectorAll('.batch-item').forEach(card=>{
      if(card.dataset.v197done==='1') return;
      const ta=card.querySelector('textarea'); if(!ta) return;
      let prompt=ta.value || ta.textContent || '';
      if(!isNSFW(card,prompt)) return;
      const loc=selected(LOCATIONS,'#batch-location-mode','#batch-location-choice',prompt);
      prompt=ensureTags(prompt,loc);
      const toy=selected(TOYS,'#batch-toy-mode','#batch-toy-choice',prompt);
      prompt=ensureTags(prompt,toy);
      if('value' in ta) ta.value=prompt; else ta.textContent=prompt;
      patchSummary(card,loc,toy);
      refreshZhBox(card,prompt);
      card.dataset.v197done='1';
    });
  }
  const oldRender=window.renderBatch;
  if(typeof oldRender==='function' && !oldRender.__v197patched){
    const wrapped=function(){oldRender.apply(this,arguments);patchCards();setTimeout(patchCards,0);setTimeout(patchCards,120);};
    wrapped.__v197patched=true;
    window.renderBatch=wrapped;
  }
  function install(){initControls(); const btn=document.querySelector('#make-batch'); if(btn) btn.onclick=window.renderBatch; patchCards();}
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',install); else install();
})();



/* ===== v1.9.7 OC compact library + pending toolbox ===== */
(function(){
  function esc(s){return String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function q(s){return document.querySelector(s);}
  function qa(s){return Array.from(document.querySelectorAll(s));}
  function storeGet(k){try{return JSON.parse(localStorage.getItem(k)||'[]')}catch{return []}}
  function storeSet(k,v){localStorage.setItem(k,JSON.stringify(v));}
  function copy(t){ if(typeof copyText==='function') copyText(t); else navigator.clipboard?.writeText(t); }

  window.renderOCList = renderOCList = function(){
    const w=q('#oc-list'); if(!w) return;
    let list=storeGet('dpcl_oc_list');
    const keyword=(q('#oc-search')?.value||'').toLowerCase().trim();
    if(keyword){
      list=list.filter(it=>[it.name,it.note,it.prompt].some(x=>String(x||'').toLowerCase().includes(keyword)));
    }
    const sort=q('#oc-sort')?.value||'star';
    list=[...list].sort((a,b)=>{
      if(sort==='star') return (b.star?1:0)-(a.star?1:0) || (b.id||0)-(a.id||0);
      if(sort==='old') return (a.id||0)-(b.id||0);
      if(sort==='name') return String(a.name||'').localeCompare(String(b.name||''),'zh-Hans-CN');
      return (b.id||0)-(a.id||0);
    });
    w.innerHTML='';
    if(!list.length){w.innerHTML='<div class="empty">没有找到 OC。</div>';return;}
    const all=storeGet('dpcl_oc_list');
    list.forEach(it=>{
      const d=document.createElement('div');
      d.className='oc-card'+(it.star?' star':'');
      d.innerHTML=`<div class="oc-head">${it.image?`<img class="oc-thumb" src="${it.image}"/>`:`<div class="oc-thumb"></div>`}<div class="oc-meta"><h3>${it.star?'★ ':''}${esc(it.name)}</h3><p>${esc(it.note||'')}</p></div></div><div class="oc-actions"><button data-use>填入第二页</button><button data-copy>复制</button><button data-star>${it.star?'取消星标':'星标'}</button><button data-del>删除</button></div><details><summary>展开 prompt</summary><textarea readonly>${esc(it.prompt||'')}</textarea></details>`;
      d.querySelector('[data-use]').onclick=()=>{ const input=q('#batch-character'); if(input) input.value=it.prompt||''; const tab=document.querySelector('[data-page="page-generator"]'); if(tab) tab.click(); if(typeof toast==='function') toast('已填入第二页'); };
      d.querySelector('[data-copy]').onclick=()=>copy(it.prompt||'');
      d.querySelector('[data-star]').onclick=()=>{ const arr=storeGet('dpcl_oc_list'); const x=arr.find(x=>x.id===it.id); if(x) x.star=!x.star; storeSet('dpcl_oc_list',arr); renderOCList(); };
      d.querySelector('[data-del]').onclick=()=>{ if(confirm('删除这个 OC？')){storeSet('dpcl_oc_list',all.filter(x=>x.id!==it.id));renderOCList();} };
      w.appendChild(d);
    });
  };

  function savePending(){
    const title=q('#pending-title')?.value.trim(); const content=q('#pending-content')?.value.trim();
    if(!title||!content){ if(typeof toast==='function') toast('标题和内容不能为空'); return; }
    const list=storeGet('dpcl_pending_list'); list.unshift({id:Date.now(),title,content}); storeSet('dpcl_pending_list',list);
    q('#pending-title').value=''; q('#pending-content').value=''; renderPending(); if(typeof toast==='function') toast('已保存待定');
  }
  function renderPending(){
    const w=q('#pending-list'); if(!w) return; const list=storeGet('dpcl_pending_list'); w.innerHTML='';
    if(!list.length){w.innerHTML='<div class="empty">还没有待定内容。</div>';return;}
    list.forEach(it=>{const d=document.createElement('div');d.className='library-card';d.innerHTML=`<h3>${esc(it.title)}</h3><textarea readonly>${esc(it.content)}</textarea><div class="library-actions"><button data-use>填入第二页</button><button data-copy>复制</button><button data-del>删除</button></div>`;d.querySelector('[data-use]').onclick=()=>{const input=q('#batch-character');if(input)input.value=it.content;document.querySelector('[data-page="page-generator"]')?.click();};d.querySelector('[data-copy]').onclick=()=>copy(it.content);d.querySelector('[data-del]').onclick=()=>{storeSet('dpcl_pending_list',list.filter(x=>x.id!==it.id));renderPending();};w.appendChild(d);});
  }
  function combinePrompt(){
    const parts=[q('#compose-artist')?.value,q('#compose-oc')?.value,q('#compose-scene')?.value].map(x=>String(x||'').trim()).filter(Boolean);
    const out=parts.join(', ').replace(/,\s*,/g,', '); const ta=q('#compose-output'); if(ta) ta.value=out;
    const tags=out.split(',').map(s=>s.trim()).filter(Boolean).length; const chars=out.length;
    const st=q('#compose-stats'); if(st) st.textContent=`字符数：${chars}；tag 数：${tags}`;
    return out;
  }
  function savePreset(){
    const name=q('#preset-name')?.value.trim(); const content=q('#preset-content')?.value.trim(); if(!name||!content){if(typeof toast==='function')toast('名称和内容不能为空');return;}
    const list=storeGet('dpcl_preset_list'); list.unshift({id:Date.now(),name,content}); storeSet('dpcl_preset_list',list); q('#preset-name').value=''; q('#preset-content').value=''; renderPreset();
  }
  function renderPreset(){
    const w=q('#preset-list'); if(!w) return; const list=storeGet('dpcl_preset_list'); w.innerHTML='';
    if(!list.length){w.innerHTML='<div class="empty">还没有预设。</div>';return;}
    list.forEach(it=>{const d=document.createElement('div');d.className='library-card';d.innerHTML=`<h3>${esc(it.name)}</h3><textarea readonly>${esc(it.content)}</textarea><div class="library-actions"><button data-copy>复制</button><button data-add>加入组合草稿</button><button data-del>删除</button></div>`;d.querySelector('[data-copy]').onclick=()=>copy(it.content);d.querySelector('[data-add]').onclick=()=>{const x=q('#compose-scene'); if(x) x.value=(x.value?x.value+', ':'')+it.content; combinePrompt();};d.querySelector('[data-del]').onclick=()=>{storeSet('dpcl_preset_list',list.filter(x=>x.id!==it.id));renderPreset();};w.appendChild(d);});
  }
  function install(){
    q('#oc-search')?.addEventListener('input',renderOCList); q('#oc-sort')?.addEventListener('change',renderOCList); q('#oc-collapse-all')?.addEventListener('click',()=>qa('#oc-list details').forEach(x=>x.open=false));
    q('#save-pending')?.addEventListener('click',savePending); q('#compose-run')?.addEventListener('click',combinePrompt); q('#compose-copy')?.addEventListener('click',()=>copy(combinePrompt())); q('#save-preset')?.addEventListener('click',savePreset);
    renderOCList(); renderPending(); renderPreset(); combinePrompt();
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',install); else install();
})();



/* ===== v1.9.8 UI cleanup + editable OC =====
   1. 已保存 OC 支持编辑/更新。
   2. 去掉第二页每张结果下方的“整条 prompt 中文翻译”框。
   3. 批量生成页改成多列网格排版，不再一整行挤爆。
*/
(function(){
  const $ = (s, r=document)=>r.querySelector(s);
  const $$ = (s, r=document)=>Array.from(r.querySelectorAll(s));
  function esc(s){ return String(s||'').replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c])); }
  function toast2(msg){ if(typeof toast==='function') toast(msg); else console.log(msg); }
  function getStore2(k){ try{return JSON.parse(localStorage.getItem(k)||'[]')}catch{return[]} }
  function setStore2(k,v){ localStorage.setItem(k,JSON.stringify(v)); }
  function removeZhPromptBoxes(){ $$('.zh-prompt-box').forEach(x=>x.remove()); }

  async function readCompressedImage198(file){
    if(!file) return '';
    const raw = await new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(file);});
    if(typeof compressImageDataUrl === 'function') return await compressImageDataUrl(raw, 960, 640, .78);
    return raw;
  }

  let editingOCId = null;
  function setEditMode(item){
    editingOCId = item ? item.id : null;
    const banner=$('#oc-edit-banner');
    const text=$('#oc-edit-text');
    const btn=$('#save-oc');
    if(item){
      $('#oc-name').value=item.name||'';
      $('#oc-note').value=item.note||'';
      $('#oc-prompt').value=item.prompt||'';
      $('#oc-image').value='';
      if(text) text.textContent=`正在编辑：${item.name||'未命名 OC'}（选择新图片才会替换旧图）`;
      if(banner) banner.classList.add('active');
      if(btn) btn.textContent='更新 OC';
      $$('.oc-card').forEach(card=>card.classList.toggle('editing', String(card.dataset.id)===String(item.id)));
      $('#oc-name')?.scrollIntoView({behavior:'smooth', block:'center'});
    }else{
      $('#oc-name').value='';
      $('#oc-note').value='';
      $('#oc-prompt').value='';
      $('#oc-image').value='';
      if(text) text.textContent='正在编辑 OC';
      if(banner) banner.classList.remove('active');
      if(btn) btn.textContent='保存 OC';
      $$('.oc-card').forEach(card=>card.classList.remove('editing'));
    }
  }

  async function saveOrUpdateOC198(){
    const name=($('#oc-name')?.value||'').trim();
    const note=($('#oc-note')?.value||'').trim();
    const prompt=($('#oc-prompt')?.value||'').trim();
    const file=$('#oc-image')?.files?.[0];
    if(!name || !prompt){ toast2('OC 名称和 prompt 不能为空'); return; }
    let list=getStore2('dpcl_oc_list');
    if(editingOCId){
      const idx=list.findIndex(x=>String(x.id)===String(editingOCId));
      if(idx<0){ toast2('没找到正在编辑的 OC'); setEditMode(null); return; }
      let image=list[idx].image||'';
      if(file){ toast2('正在压缩并替换插图...'); image=await readCompressedImage198(file); }
      list[idx]={...list[idx], name, note, prompt, image, updatedAt:Date.now()};
      setStore2('dpcl_oc_list', list);
      setEditMode(null);
      if(typeof renderOCList==='function') renderOCList();
      toast2('OC 已更新');
      return;
    }
    let image='';
    if(file){ toast2('正在压缩插图...'); image=await readCompressedImage198(file); }
    list.unshift({id:Date.now(), name, note, prompt, image, star:false, updatedAt:Date.now()});
    setStore2('dpcl_oc_list', list);
    setEditMode(null);
    if(typeof renderOCList==='function') renderOCList();
    toast2('OC 已保存');
  }

  function renderOCList198(){
    const w=$('#oc-list'); if(!w) return;
    let all=getStore2('dpcl_oc_list');
    const keyword=($('#oc-search')?.value||'').toLowerCase().trim();
    if(keyword){
      all=all.filter(x=>[x.name,x.note,x.prompt].some(v=>String(v||'').toLowerCase().includes(keyword)));
    }
    const sort=$('#oc-sort')?.value||'star';
    all=[...all].sort((a,b)=>{
      if(sort==='star') return Number(!!b.star)-Number(!!a.star) || Number(b.updatedAt||b.id)-Number(a.updatedAt||a.id);
      if(sort==='old') return Number(a.id)-Number(b.id);
      if(sort==='name') return String(a.name||'').localeCompare(String(b.name||''),'zh');
      return Number(b.updatedAt||b.id)-Number(a.updatedAt||a.id);
    });
    w.innerHTML='';
    if(!all.length){ w.innerHTML='<div class="empty">没有找到 OC。</div>'; return; }
    const fullList=getStore2('dpcl_oc_list');
    all.forEach(it=>{
      const d=document.createElement('div');
      d.className='oc-card'+(it.star?' star':'')+(String(it.id)===String(editingOCId)?' editing':'');
      d.dataset.id=it.id;
      d.innerHTML=`<div class="oc-head">${it.image?`<img class="oc-thumb" src="${it.image}"/>`:`<div class="oc-thumb"></div>`}<div class="oc-meta"><h3>${it.star?'★ ':''}${esc(it.name)}</h3><p>${esc(it.note||'')}</p></div></div><div class="oc-actions"><button data-use>填入第二页</button><button data-edit>编辑</button><button data-copy>复制</button><button data-star>${it.star?'取消星标':'星标'}</button><button data-del>删除</button></div><details><summary>展开 prompt</summary><textarea readonly>${esc(it.prompt||'')}</textarea></details>`;
      d.querySelector('[data-use]').onclick=()=>{ const input=$('#batch-character'); if(input) input.value=it.prompt||''; document.querySelector('[data-page="page-generator"]')?.click(); toast2('已填入第二页'); };
      d.querySelector('[data-edit]').onclick=()=>setEditMode(it);
      d.querySelector('[data-copy]').onclick=()=>copyText(it.prompt||'');
      d.querySelector('[data-star]').onclick=()=>{ const arr=getStore2('dpcl_oc_list'); const x=arr.find(x=>String(x.id)===String(it.id)); if(x){x.star=!x.star;x.updatedAt=Date.now();} setStore2('dpcl_oc_list',arr); renderOCList198(); };
      d.querySelector('[data-del]').onclick=()=>{ if(confirm('删除这个 OC？')){ setStore2('dpcl_oc_list', fullList.filter(x=>String(x.id)!==String(it.id))); if(String(editingOCId)===String(it.id)) setEditMode(null); renderOCList198(); } };
      w.appendChild(d);
    });
  }

  function install198(){
    removeZhPromptBoxes();
    window.renderOCList = renderOCList198;
    if(typeof renderOCList !== 'undefined') renderOCList = renderOCList198;
    const saveBtn=$('#save-oc'); if(saveBtn) saveBtn.onclick=saveOrUpdateOC198;
    const cancel=$('#oc-cancel-edit'); if(cancel) cancel.onclick=()=>setEditMode(null);
    $('#oc-search')?.addEventListener('input', renderOCList198);
    $('#oc-sort')?.addEventListener('change', renderOCList198);
    $('#oc-collapse-all')?.addEventListener('click',()=>$$('#oc-list details').forEach(x=>x.open=false));
    const oldRender = window.renderBatch;
    if(typeof oldRender === 'function' && !oldRender.__v198NoZh){
      const wrapped=function(){ oldRender.apply(this, arguments); removeZhPromptBoxes(); };
      wrapped.__v198NoZh=true;
      window.renderBatch=wrapped;
      const mk=$('#make-batch'); if(mk) mk.onclick=window.renderBatch;
    }
    renderOCList198();
    removeZhPromptBoxes();
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', install198);
  else install198();
  setTimeout(install198, 300);
})();



/* ===== v1.9.9 foldered OC library =====
   OC 区域：隐藏图片，文件夹折叠，拖拽归类，按字搜索，已有 OC 可继续编辑。
*/
(function(){
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const FOLDER_KEY='dpcl_oc_folders';
  const CLOSED_KEY='dpcl_oc_closed_folders';
  const OC_KEY='dpcl_oc_list';
  const UNCAT='_uncat';
  let editingId=null;

  function esc(s){return String(s||'').replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));}
  function toast2(msg){ if(typeof toast==='function') toast(msg); else console.log(msg); }
  function get(k,def=[]){try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(def))}catch{return def}}
  function set(k,v){localStorage.setItem(k,JSON.stringify(v));}
  function now(){return Date.now();}
  function normalizeFolderId(id){return id||UNCAT;}
  function getOCs(){
    const list=get(OC_KEY,[]);
    let changed=false;
    list.forEach(x=>{ if(!x.folderId){x.folderId=UNCAT; changed=true;} });
    if(changed) set(OC_KEY,list);
    return list;
  }
  function setOCs(list){set(OC_KEY,list);}
  function getFolders(){
    let fs=get(FOLDER_KEY,[]).filter(f=>f&&f.id&&f.name);
    const seen=new Set();
    fs=fs.filter(f=>{ if(f.id===UNCAT) return false; if(seen.has(f.id)) return false; seen.add(f.id); return true; });
    return [{id:UNCAT,name:'未分类',system:true},...fs];
  }
  function setFolders(fs){set(FOLDER_KEY,fs.filter(f=>!f.system && f.id!==UNCAT));}
  function getClosed(){return new Set(get(CLOSED_KEY,[]));}
  function setClosed(s){set(CLOSED_KEY,[...s]);}
  function folderName(id){return (getFolders().find(f=>f.id===normalizeFolderId(id))||getFolders()[0]).name;}
  function slug(){return 'f_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,7);}

  function ensureFolderControls(){
    const tools=$('.oc-tools'); if(!tools) return;
    if(!$('#oc-folder-filter')){
      const filter=document.createElement('select');
      filter.id='oc-folder-filter';
      filter.innerHTML='<option value="__all">全部文件夹</option>';
      tools.insertBefore(filter, $('#oc-collapse-all') || null);
    }
    if(!$('#oc-new-folder')){
      const input=document.createElement('input'); input.id='oc-new-folder'; input.placeholder='新文件夹名称';
      const btn=document.createElement('button'); btn.id='oc-add-folder'; btn.type='button'; btn.textContent='新建文件夹';
      tools.appendChild(input); tools.appendChild(btn);
    }
    if(!$('#oc-folder-select')){
      const sel=document.createElement('select'); sel.id='oc-folder-select'; sel.title='保存到文件夹';
      const prompt=$('#oc-prompt');
      if(prompt) prompt.insertAdjacentElement('afterend', sel);
    }
    if($('#oc-collapse-all')) $('#oc-collapse-all').textContent='折叠文件夹';
  }

  function refreshFolderSelects(){
    const folders=getFolders();
    const opts=folders.map(f=>`<option value="${esc(f.id)}">${esc(f.name)}</option>`).join('');
    const saveSel=$('#oc-folder-select'); if(saveSel){ const old=saveSel.value||UNCAT; saveSel.innerHTML=opts; saveSel.value=folders.some(f=>f.id===old)?old:UNCAT; }
    const filter=$('#oc-folder-filter'); if(filter){ const old=filter.value||'__all'; filter.innerHTML='<option value="__all">全部文件夹</option>'+opts; filter.value=(old==='__all'||folders.some(f=>f.id===old))?old:'__all'; }
  }

  function createFolder(){
    const input=$('#oc-new-folder'); if(!input) return;
    const name=input.value.trim();
    if(!name){toast2('文件夹名称不能为空');return;}
    const folders=getFolders();
    if(folders.some(f=>f.name===name)){toast2('已经有同名文件夹');return;}
    const custom=get(FOLDER_KEY,[]);
    custom.push({id:slug(),name,createdAt:now()});
    setFolders(custom); input.value=''; refreshFolderSelects(); renderOCList199(); toast2('文件夹已创建');
  }

  function deleteFolder(id){
    if(id===UNCAT) return;
    const folders=getFolders(); const f=folders.find(x=>x.id===id); if(!f) return;
    if(!confirm(`删除文件夹「${f.name}」？里面的 OC 会移回未分类。`)) return;
    setFolders(get(FOLDER_KEY,[]).filter(x=>x.id!==id));
    const list=getOCs(); list.forEach(x=>{if(x.folderId===id)x.folderId=UNCAT;}); setOCs(list);
    const closed=getClosed(); closed.delete(id); setClosed(closed);
    refreshFolderSelects(); renderOCList199();
  }

  function renameFolder(id){
    if(id===UNCAT) return;
    const folders=get(FOLDER_KEY,[]); const f=folders.find(x=>x.id===id); if(!f) return;
    const name=prompt('新的文件夹名称：',f.name);
    if(!name || !name.trim()) return;
    f.name=name.trim(); setFolders(folders); refreshFolderSelects(); renderOCList199();
  }

  function moveOC(id, folderId){
    const list=getOCs(); const it=list.find(x=>String(x.id)===String(id)); if(!it) return;
    it.folderId=folderId||UNCAT; it.updatedAt=now(); setOCs(list); renderOCList199();
  }

  async function readCompressedMaybe(file){
    if(!file) return '';
    if(typeof readCompressedImage === 'function') return await readCompressedImage(file);
    if(typeof readCompressedImage198 === 'function') return await readCompressedImage198(file);
    const raw=await new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(file);});
    if(typeof compressImageDataUrl==='function') return await compressImageDataUrl(raw,960,640,.78);
    return raw;
  }

  function setEdit(item){
    editingId=item?item.id:null;
    const banner=$('#oc-edit-banner'), text=$('#oc-edit-text'), btn=$('#save-oc');
    if(item){
      $('#oc-name').value=item.name||''; $('#oc-note').value=item.note||''; $('#oc-prompt').value=item.prompt||''; if($('#oc-image')) $('#oc-image').value='';
      if($('#oc-folder-select')) $('#oc-folder-select').value=normalizeFolderId(item.folderId);
      if(text) text.textContent=`正在编辑：${item.name||'未命名 OC'}`;
      if(banner) banner.classList.add('active'); if(btn) btn.textContent='更新 OC';
      $('#oc-name')?.scrollIntoView({behavior:'smooth',block:'center'});
    }else{
      if($('#oc-name')) $('#oc-name').value=''; if($('#oc-note')) $('#oc-note').value=''; if($('#oc-prompt')) $('#oc-prompt').value=''; if($('#oc-image')) $('#oc-image').value='';
      if($('#oc-folder-select')) $('#oc-folder-select').value=UNCAT;
      if(text) text.textContent='正在编辑 OC'; if(banner) banner.classList.remove('active'); if(btn) btn.textContent='保存 OC';
    }
    renderOCList199();
  }

  async function saveOrUpdateOC199(){
    const name=($('#oc-name')?.value||'').trim(), note=($('#oc-note')?.value||'').trim(), promptText=($('#oc-prompt')?.value||'').trim();
    const folderId=$('#oc-folder-select')?.value||UNCAT;
    const file=$('#oc-image')?.files?.[0];
    if(!name||!promptText){toast2('OC 名称和 prompt 不能为空');return;}
    const list=getOCs();
    if(editingId){
      const idx=list.findIndex(x=>String(x.id)===String(editingId));
      if(idx<0){toast2('没找到正在编辑的 OC'); setEdit(null); return;}
      let image=list[idx].image||'';
      if(file){toast2('正在压缩并替换插图...'); image=await readCompressedMaybe(file);}
      list[idx]={...list[idx],name,note,prompt:promptText,image,folderId,updatedAt:now()};
      setOCs(list); setEdit(null); toast2('OC 已更新'); return;
    }
    let image=''; if(file){toast2('正在压缩插图...'); image=await readCompressedMaybe(file);}
    list.unshift({id:now(),name,note,prompt:promptText,image,folderId,star:false,updatedAt:now()});
    setOCs(list); setEdit(null); toast2('OC 已保存');
  }

  function renderRow(it, folders){
    const d=document.createElement('div');
    d.className='oc-row'+(it.star?' star':'')+(String(it.id)===String(editingId)?' editing':'');
    d.dataset.id=it.id; d.draggable=true;
    const moveOpts=folders.map(f=>`<option value="${esc(f.id)}" ${normalizeFolderId(it.folderId)===f.id?'selected':''}>${esc(f.name)}</option>`).join('');
    d.innerHTML=`<div class="oc-row-name">${it.star?'★ ':''}${esc(it.name||'未命名')}</div><div class="oc-row-note">${esc(it.note||'')}</div><div class="oc-row-prompt">${esc(it.prompt||'')}</div><div class="oc-row-actions"><button data-use>填入</button><button data-edit>编辑</button><button data-copy>复制</button><button data-star>${it.star?'取消星标':'星标'}</button><select data-move title="移动到文件夹">${moveOpts}</select><button data-del>删</button></div><details><summary>prompt</summary><textarea readonly>${esc(it.prompt||'')}</textarea></details>`;
    d.addEventListener('dragstart',ev=>{ev.dataTransfer.setData('text/oc-id',String(it.id)); ev.dataTransfer.effectAllowed='move';});
    d.querySelector('[data-use]').onclick=()=>{const input=$('#batch-character'); if(input) input.value=it.prompt||''; document.querySelector('[data-page="page-generator"]')?.click(); toast2('已填入第二页');};
    d.querySelector('[data-edit]').onclick=()=>setEdit(it);
    d.querySelector('[data-copy]').onclick=()=>copyText(it.prompt||'');
    d.querySelector('[data-star]').onclick=()=>{const arr=getOCs(); const x=arr.find(x=>String(x.id)===String(it.id)); if(x){x.star=!x.star;x.updatedAt=now();} setOCs(arr); renderOCList199();};
    d.querySelector('[data-move]').onchange=e=>moveOC(it.id,e.target.value);
    d.querySelector('[data-del]').onclick=()=>{if(confirm('删除这个 OC？')){setOCs(getOCs().filter(x=>String(x.id)!==String(it.id))); if(String(editingId)===String(it.id)) setEdit(null); else renderOCList199();}};
    return d;
  }

  function renderOCList199(){
    ensureFolderControls(); refreshFolderSelects();
    const w=$('#oc-list'); if(!w) return;
    const folders=getFolders();
    let list=getOCs();
    const keyword=($('#oc-search')?.value||'').toLowerCase().trim();
    const folderFilter=$('#oc-folder-filter')?.value||'__all';
    if(keyword){ list=list.filter(x=>[x.name,x.note,x.prompt,folderName(x.folderId)].some(v=>String(v||'').toLowerCase().includes(keyword))); }
    if(folderFilter!=='__all') list=list.filter(x=>normalizeFolderId(x.folderId)===folderFilter);
    const sort=$('#oc-sort')?.value||'star';
    list=[...list].sort((a,b)=>{
      if(sort==='star') return Number(!!b.star)-Number(!!a.star)||Number(b.updatedAt||b.id)-Number(a.updatedAt||a.id);
      if(sort==='old') return Number(a.id)-Number(b.id);
      if(sort==='name') return String(a.name||'').localeCompare(String(b.name||''),'zh');
      return Number(b.updatedAt||b.id)-Number(a.updatedAt||a.id);
    });
    const by=new Map(folders.map(f=>[f.id,[]]));
    list.forEach(x=>{const id=normalizeFolderId(x.folderId); if(!by.has(id)) by.set(UNCAT,[]); (by.get(id)||by.get(UNCAT)).push(x);});
    const closed=getClosed(); w.innerHTML='';
    if(!list.length){w.innerHTML='<div class="empty">没有找到 OC。</div>';return;}
    folders.forEach(folder=>{
      const items=by.get(folder.id)||[];
      if(folderFilter==='__all' && keyword && !items.length) return;
      if(folderFilter!=='__all' && folder.id!==folderFilter) return;
      if(folderFilter==='__all' && !keyword && !items.length && folder.id!==UNCAT) return;
      const sec=document.createElement('section');
      sec.className='oc-folder'+(closed.has(folder.id)?' collapsed':'');
      sec.dataset.folderId=folder.id;
      sec.innerHTML=`<div class="oc-folder-head"><span class="twisty">${closed.has(folder.id)?'▸':'▾'}</span><span class="oc-folder-title">📁 ${esc(folder.name)}</span><span class="oc-folder-count">${items.length} 个 OC</span><span class="oc-folder-actions">${folder.system?'':`<button data-rename>改名</button><button data-folder-del>删文件夹</button>`}</span></div><div class="oc-folder-body"><div class="oc-drop-hint">把 OC 拖到这里归入「${esc(folder.name)}」</div></div>`;
      const head=sec.querySelector('.oc-folder-head');
      head.onclick=e=>{ if(e.target.closest('button')) return; const c=getClosed(); if(c.has(folder.id)) c.delete(folder.id); else c.add(folder.id); setClosed(c); renderOCList199(); };
      sec.querySelector('[data-rename]')?.addEventListener('click',()=>renameFolder(folder.id));
      sec.querySelector('[data-folder-del]')?.addEventListener('click',()=>deleteFolder(folder.id));
      const body=sec.querySelector('.oc-folder-body');
      ['dragenter','dragover'].forEach(ev=>body.addEventListener(ev,e=>{e.preventDefault(); sec.classList.add('drag-over'); e.dataTransfer.dropEffect='move';}));
      ['dragleave','drop'].forEach(ev=>body.addEventListener(ev,e=>{ if(ev==='drop') return; sec.classList.remove('drag-over'); }));
      body.addEventListener('drop',e=>{e.preventDefault(); sec.classList.remove('drag-over'); const id=e.dataTransfer.getData('text/oc-id'); if(id) moveOC(id,folder.id);});
      items.forEach(it=>body.appendChild(renderRow(it,folders)));
      if(!items.length) body.insertAdjacentHTML('beforeend','<div class="oc-empty-folder">这个文件夹还没有 OC。</div>');
      w.appendChild(sec);
    });
  }

  function install199(){
    ensureFolderControls(); refreshFolderSelects();
    window.renderOCList=renderOCList199; try{ renderOCList=renderOCList199; }catch(e){}
    const save=$('#save-oc'); if(save) save.onclick=saveOrUpdateOC199;
    $('#oc-cancel-edit')?.addEventListener('click',()=>setEdit(null));
    $('#oc-search')?.addEventListener('input',renderOCList199);
    $('#oc-sort')?.addEventListener('change',renderOCList199);
    $('#oc-folder-filter')?.addEventListener('change',renderOCList199);
    $('#oc-add-folder')?.addEventListener('click',createFolder);
    $('#oc-new-folder')?.addEventListener('keydown',e=>{if(e.key==='Enter') createFolder();});
    const collapse=$('#oc-collapse-all'); if(collapse) collapse.onclick=()=>{const c=getClosed(); getFolders().forEach(f=>c.add(f.id)); setClosed(c); renderOCList199();};
    renderOCList199();
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',install199); else install199();
  setTimeout(install199,500);
})();
