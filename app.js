const $=s=>document.querySelector(s),$$=s=>Array.from(document.querySelectorAll(s));let picked=[],zCounter=10,currentCards=[],categoryDebt=Object.fromEntries(CATEGORY_ORDER.map(c=>[c,1])),recentTags=[];const activeTags=[...TAGS];const colorMap={quality:205,rating:330,character:260,species:120,body:15,hair:45,eyes:170,face:300,expression:25,clothing:220,accessory:285,pose:190,action_sfw:95,action_nsfw:345,camera:200,composition:240,lighting:55,background:160,effects:35,after:10,negative:0,danbooru_general:270,nsfw_general:320};function toast(m){const e=$("#toast");e.textContent=m;e.classList.add("show");setTimeout(()=>e.classList.remove("show"),1600)}function escapeHtml(s){return String(s||"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]))}
function pickOne(a){return a[Math.floor(Math.random()*a.length)]}function key(i){return `${i.cat}::${i.tag}`}function isPicked(i){return picked.some(p=>key(p)===key(i))}function poolByMode(m){if(m==="mixed")return activeTags;if(m==="sfw")return activeTags.filter(t=>t.mode==="sfw"||t.mode==="mixed"||t.cat==="negative");if(m==="nsfw")return activeTags.filter(t=>t.mode==="nsfw"||t.mode==="mixed"||t.cat==="negative");return activeTags}function weightedCategory(m){const cats=CATEGORY_ORDER.filter(c=>poolByMode(m).some(t=>t.cat===c));const w=cats.map(c=>{let base=c==="negative"?.65:c==="quality"?.75:c==="danbooru_general"?.35:1;return base*Math.max(.15,categoryDebt[c]||1)});let r=Math.random()*w.reduce((a,b)=>a+b,0);for(let i=0;i<cats.length;i++){r-=w[i];if(r<=0)return cats[i]}return cats[0]}function getPoolForCat(cat,mode,seen){let p=poolByMode(mode).filter(t=>t.cat===cat&&!seen.has(t.tag)&&!recentTags.includes(t.tag));if(!p.length)p=poolByMode(mode).filter(t=>t.cat===cat&&!seen.has(t.tag));return p}function generateCards(){const st=$("#card-stage"),cnt=Math.max(8,Math.min(80,Number($("#card-count").value||20))),mode=$("#card-mode").value,chosen=[],seen=new Set(),appeared=new Set();let guaranteed=["quality","hair","eyes","expression","clothing","pose","camera","composition","lighting","background","negative"];if(mode==="sfw")guaranteed.push("action_sfw");else if(mode==="nsfw")guaranteed.push("action_nsfw","rating");else guaranteed.push("action_sfw","action_nsfw","rating");for(const cat of guaranteed){if(chosen.length>=cnt)break;const pool=getPoolForCat(cat,mode,seen);if(pool.length){const item=pickOne(pool);chosen.push(item);seen.add(item.tag);appeared.add(item.cat)}}while(chosen.length<cnt){let cat=weightedCategory(mode),pool=getPoolForCat(cat,mode,seen);if(!pool.length)pool=poolByMode(mode).filter(t=>!seen.has(t.tag)&&!recentTags.includes(t.tag));if(!pool.length)pool=poolByMode(mode).filter(t=>!seen.has(t.tag));const item=pickOne(pool);if(!item)break;chosen.push(item);seen.add(item.tag);appeared.add(item.cat)}CATEGORY_ORDER.forEach(c=>{if(appeared.has(c))categoryDebt[c]=1;else categoryDebt[c]=Math.min(5,(categoryDebt[c]||1)+.45)});recentTags=[...chosen.map(x=>x.tag),...recentTags].slice(0,260);const w=st.clientWidth||1000,h=st.clientHeight||520;currentCards=chosen.map((it,i)=>({...it,id:key(it),x:Math.max(8,Math.random()*(w-240)),y:Math.max(8,Math.random()*(h-88)),rot:Number((Math.random()*30-15).toFixed(1)),hue:(colorMap[it.cat]??Math.floor(Math.random()*360))+Math.random()*28-14,z:i+1}));renderStage()}function fillCard(card,it){card.innerHTML="";let en=document.createElement("div");en.className="tag-en";en.textContent=it.tag;let zh=document.createElement("div");zh.className="tag-zh";zh.textContent=it.zh||"未翻译";let meta=document.createElement("div");meta.className="tag-meta";meta.textContent=`${CATEGORY_LABEL[it.cat]||it.cat}${it.count?" · "+Number(it.count).toLocaleString():""}`;card.append(en,zh,meta)}function renderStage(){const st=$("#card-stage");st.innerHTML="";currentCards.filter(it=>!isPicked(it)).forEach(it=>{const c=document.createElement("div");c.className="tag-card";fillCard(c,it);c.style.left=it.x+"px";c.style.top=it.y+"px";c.style.zIndex=String(it.z||1);c.style.setProperty("--rot",`${it.rot||0}deg`);c.style.setProperty("--hue",`${it.hue||220}`);installDrag(c,it);st.appendChild(c)})}function installDrag(card,it){let sx=0,sy=0,ox=0,oy=0,moved=false,drag=false;card.addEventListener("mouseenter",()=>{it.z=++zCounter;card.style.zIndex=String(it.z)});card.addEventListener("pointerdown",e=>{e.preventDefault();drag=true;moved=false;sx=e.clientX;sy=e.clientY;ox=it.x;oy=it.y;it.homeX=ox;it.homeY=oy;it.z=++zCounter;card.style.zIndex=String(it.z);card.classList.add("dragging");card.setPointerCapture(e.pointerId)});card.addEventListener("pointermove",e=>{if(!drag)return;let dx=e.clientX-sx,dy=e.clientY-sy;if(Math.abs(dx)+Math.abs(dy)>4)moved=true;it.x=ox+dx;it.y=oy+dy;card.style.left=it.x+"px";card.style.top=it.y+"px";card.style.setProperty("--rot","0deg")});card.addEventListener("pointerup",e=>{if(!drag)return;drag=false;card.classList.remove("dragging");try{card.releasePointerCapture(e.pointerId)}catch{}const p=$(".picked-panel").getBoundingClientRect(),drop=e.clientX>=p.left&&e.clientX<=p.right&&e.clientY>=p.top&&e.clientY<=p.bottom;if(!moved||drop){addPicked(it);return}const st=$("#card-stage"),mx=Math.max(8,st.clientWidth-card.offsetWidth-8),my=Math.max(8,st.clientHeight-card.offsetHeight-8);it.x=Math.min(mx,Math.max(8,it.x));it.y=Math.min(my,Math.max(8,it.y));it.rot=Number((Math.random()*24-12).toFixed(1));card.style.left=it.x+"px";card.style.top=it.y+"px";card.style.setProperty("--rot",`${it.rot}deg`)})}function clampToStagePos(x,y){
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
}function renderPicked(){const w=$("#picked-groups");w.innerHTML="";if(!picked.length){w.innerHTML='<div class="empty">还没有收集卡片。</div>';return}CATEGORY_ORDER.forEach(cat=>{const arr=picked.filter(p=>p.cat===cat);if(!arr.length)return;const g=document.createElement("div");g.className="picked-group";g.innerHTML=`<h3>${CATEGORY_LABEL[cat]||cat}</h3>`;arr.forEach(it=>{const c=document.createElement("button");c.className="tag-card picked";c.style.setProperty("--rot","0deg");c.style.setProperty("--hue",`${it.hue||colorMap[it.cat]||220}`);fillCard(c,it);c.onclick=()=>{picked=picked.filter(p=>key(p)!==key(it));const back=currentCards.find(x=>key(x)===key(it));if(back){const pos=clampToStagePos(Number.isFinite(it.returnX)?it.returnX:back.x,Number.isFinite(it.returnY)?it.returnY:back.y);back.x=pos.x;back.y=pos.y;back.rot=Number((Math.random()*30-15).toFixed(1));back.z=++zCounter;}renderPicked();renderStage();toast(`已移回：${it.tag}`)};g.appendChild(c)});w.appendChild(g)})}function exportPicked(){let arr=[];CATEGORY_ORDER.forEach(cat=>picked.filter(p=>p.cat===cat).forEach(p=>arr.push(p.tag)));const t=arr.join(", ");$("#export-output").value=t;return t}async function copyText(t){try{await navigator.clipboard.writeText(t);toast("已复制")}catch{toast("复制失败，可以手动复制")}}function setupTabs(){$$(".tab").forEach(b=>b.onclick=()=>{$$(".tab").forEach(x=>x.classList.remove("active"));$$(".page").forEach(x=>x.classList.remove("active"));b.classList.add("active");$("#"+b.dataset.page).classList.add("active");if(b.dataset.page==="page-generator"&&$("#batch-results")&&!$("#batch-results").children.length&&typeof window.renderBatch==="function")window.renderBatch()})}
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
 return $$(".batch-item").map(box=>box.querySelector("textarea").value).join("\n\n");
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
function saveArtist(){let name=$("#artist-name").value.trim(),note=$("#artist-note").value.trim(),content=$("#artist-content").value.trim();if(!name||!content){toast("名称和内容不能为空");return}let list=getStore("dpcl_artist_list");list.unshift({id:Date.now(),name,note,content});setStore("dpcl_artist_list",list);$("#artist-name").value=$("#artist-note").value=$("#artist-content").value="";renderArtistList();toast("画师串已保存")}function renderArtistList(){let w=$("#artist-list"),list=getStore("dpcl_artist_list");w.innerHTML="";if(!list.length){w.innerHTML='<div class="empty">还没有保存画师串。</div>';return}list.forEach(it=>{let d=document.createElement("div");d.className="library-card";d.innerHTML=`<h3>${escapeHtml(it.name)}</h3><p>${escapeHtml(it.note||"")}</p><textarea readonly>${escapeHtml(it.content)}</textarea><div class="library-actions"><button data-copy>复制</button><button data-del>删除</button></div>`;d.querySelector("[data-copy]").onclick=()=>copyText(it.content);d.querySelector("[data-del]").onclick=()=>{setStore("dpcl_artist_list",list.filter(x=>x.id!==it.id));renderArtistList()};w.appendChild(d)})}document.addEventListener("DOMContentLoaded",()=>{setupTabs();generateCards();renderPicked();renderOCList();renderArtistList();const tagStatus=$("#tag-source-status");if(tagStatus)tagStatus.textContent=`本地库：${TAGS.length.toLocaleString()} tags`;$("#refresh-cards").onclick=generateCards;$("#clear-picked").onclick=()=>{picked=[];renderPicked();renderStage();$("#export-output").value=""};$("#export-picked").onclick=()=>{exportPicked();toast("已导出")};$("#copy-picked").onclick=()=>copyText(exportPicked());$("#make-batch").onclick=renderBatch;$("#copy-batch").onclick=()=>copyText(getBatchText());$("#download-batch").onclick=()=>downloadText("batch_prompts.txt",getBatchText());$("#save-oc").onclick=saveOC; if($("#compress-oc-images")) $("#compress-oc-images").onclick=()=>compactOCImages(false); compactOCImages(true);$("#save-artist").onclick=saveArtist});


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
  function compact(parts, extraKeep){
    let tags = unique(parts);
    const keep = extraKeep ? new Set([...CORE_KEEP, ...extraKeep.map(norm)]) : CORE_KEEP;
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
      if(keep.has(norm(t))) continue;
      if(low.some(rx=>rx.test(t))) tags.splice(i,1);
    }
    for(let i=tags.length-1;i>=0 && tags.length>target;i--){
      const t=tags[i];
      if(keep.has(norm(t))) continue;
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

  const NSFW_LOCKS = {
    pen: "pussy, visible pussy, spread pussy, penis, visible penis, erect penis, vaginal penetration, penis insertion, penis inside pussy, genital focus, explicit genitalia, uncensored genitals",
    oral: "penis, visible penis, erect penis, mouth contact, genital focus, explicit genitalia, uncensored genitals",
    cunni: "pussy, visible pussy, spread pussy, genital focus, explicit genitalia, uncensored genitals",
    anal: "anus, visible anus, anal penetration, penis, visible penis, erect penis, penis inside anus, genital focus, explicit genitalia, uncensored genitals",
    gen: "penis, visible penis, erect penis, genital focus, explicit genitalia, uncensored genitals",
    group: "multiple visible penises, consensual group sex, pussy, visible pussy, spread pussy, penis, visible penis, erect penis, genital focus, explicit genitalia, uncensored genitals",
    after: "pussy, visible pussy, spread pussy, cum, afterglow, genital focus, explicit genitalia, uncensored genitals"
  };
  const NSFW_EXTRA_SEED = [
    ["missionary position, eye contact, legs wrapped around waist, slow sex","眼神正常位","lying","pen"],
    ["missionary position, ankles held up, deep penetration","抬脚正常位","lying","pen"],
    ["missionary position, legs on shoulders, knees near chest","腿架肩正常位","lying","pen"],
    ["missionary position, fingers intertwined, passionate","十指相扣正常位","lying","pen"],
    ["mating press, knees pressed to chest, deep","种付深压","lying","pen"],
    ["breeding press, hips raised, close embrace","贴腰种付","lying","pen"],
    ["seashell position, knees near shoulders, hips lifted","贝壳抬腿","lying","pen"],
    ["butterfly position, hips lifted, bed edge","床边蝴蝶位","lying","pen"],
    ["folded deckchair position, legs folded high","折叠椅位","lying","pen"],
    ["eagle position, legs spread wide, deep","展鹰深位","lying","pen"],
    ["g-whiz position, legs over shoulders, hips lifted","G点抬腿","lying","pen"],
    ["coital alignment, grinding, eye contact","贴合磨蹭","lying","pen"],
    ["piledriver position, hips raised high","打桩抬臀","lying","pen"],
    ["missionary position, consensual bondage, blindfold","蒙眼正常位","lying","pen"],
    ["missionary position, rope bondage, consensual","绳缚正常位","lying","pen"],
    ["doggystyle, face down, hips raised","俯身后入","behind","pen"],
    ["doggystyle, looking back, hair pulled","回眸后入","behind","pen"],
    ["prone bone, pillow under hips, deep","垫枕俯卧","behind","pen"],
    ["prone bone, hands held, consensual","按住双手俯卧","behind","pen"],
    ["turtle position, curled forward, hips high","龟缩后入","behind","pen"],
    ["downward dog position, hands and feet on floor","下犬式后入","behind","pen"],
    ["bent over desk, hands on table","桌边弯腰","behind","pen"],
    ["standing doggystyle, hands on wall","扶墙站立后入","behind","pen"],
    ["standing doggystyle, hair pulled, consensual","抓发站立后入","behind","pen"],
    ["bent over, spread legs, from behind","弯腰后入","behind","pen"],
    ["hanging rear entry, held up, legs wrapped","抱起后入","lift","pen"],
    ["cowgirl position, leaning forward, eye contact","前倾骑乘","riding","pen"],
    ["cowgirl position, bouncing, hands on chest","起伏骑乘","riding","pen"],
    ["reverse cowgirl, arched back","反骑弓背","riding","pen"],
    ["squatting cowgirl, thighs tense","深蹲骑乘·紧绷","riding","pen"],
    ["sideways cowgirl, facing side","侧坐骑乘·侧身","riding","pen"],
    ["lotus position, face-to-face, embrace","莲花坐","riding","pen"],
    ["yab-yum, seated, close embrace","双修坐","riding","pen"],
    ["lap sex, grinding, hands on shoulders","膝上磨蹭","riding","pen"],
    ["chair sex, facing, hands on hips","椅上面对面","riding","pen"],
    ["sofa sex, lying back, legs wrapped","沙发仰躺","lying","pen"],
    ["table sex, sitting on edge, legs spread","桌边坐入·张腿","standing","pen"],
    ["bed edge sex, hips lifted, standing partner","床边抬臀","lying","pen"],
    ["floor sex, legs spread, hands held","地板张腿","lying","pen"],
    ["against wall, one leg lifted, deep","墙边抬腿","standing","pen"],
    ["against window, hands on glass, city lights","窗边扶玻璃","standing","pen"],
    ["shower sex, hands on wall, wet body","淋浴扶墙","standing","pen"],
    ["bathtub sex, sitting, water splashes","浴缸坐入","riding","pen"],
    ["mirror sex, standing, eye contact in mirror","镜前站立","standing","pen"],
    ["stair sex, sitting on stairs, partner below","楼梯坐入·抬臀","lying","pen"],
    ["pool sex, standing, water","泳池站立","standing","pen"],
    ["beach sex, lying on sand, sunset","沙滩仰躺","lying","pen"],
    ["car sex, back seat, cramped","车内后座","lying","pen"],
    ["balcony sex, standing, city night","阳台站立","standing","pen"],
    ["suspended sex, held up, legs wrapped","悬空抱起","lift","pen"],
    ["standing carry, legs wrapped around waist","站立抱起","lift","pen"],
    ["wall carry, one leg, deep","墙边抱起","lift","pen"],
    ["scissors position, legs intertwined","剪刀交缠","side","pen"],
    ["pretzel position, one leg raised, side","椒盐卷饼","side","pen"],
    ["spork position, partner between legs","叉勺侧入","side","pen"],
    ["side saddle position, partner beside","侧鞍位·侧卧","side","pen"],
    ["spooning sex, leg raised, slow","侧卧抬腿","side","pen"],
    ["side entry sex, leg over hip, eye contact","侧入对视","side","pen"],
    ["face-to-face side sex, fingers intertwined","侧卧相拥","side","pen"],
    ["blowjob, eye contact, kneeling","跪姿对视口交","oral","oral"],
    ["deepthroat, head tilted back","深喉仰头","oral","oral"],
    ["face fucking, hands in hair, consensual","抓发口交","oral","oral"],
    ["69, mutual oral, legs intertwined","六九交缠","oral","oral"],
    ["side 69, lying sideways","侧卧六九","oral","oral"],
    ["standing blowjob, partner standing","站立口交·对视","oral","oral"],
    ["paizuri, eye contact, oiled","乳交对视","oral","oral"],
    ["handjob, close-up, eye contact","手交对视","gen","gen"],
    ["two-handed handjob, kneeling","双手手交·跪姿","gen","gen"],
    ["thighjob, standing, thighs pressed","站立素股","gen","gen"],
    ["footjob, soles framing shaft","足交特写","gen","gen"],
    ["armpit sex, arm pressed","腋交·贴身","gen","gen"],
    ["intercrural, standing, from behind","站立股间","standing","gen"],
    ["mutual masturbation, eye contact","互相自慰·对视","gen","gen"],
    ["fingering, eye contact, legs spread","指交对视","cunni","cunni"],
    ["cunnilingus, eye contact, legs spread","舔阴对视","cunni","cunni"],
    ["facesitting, eye contact, hands in hair","坐脸对视","cunni","cunni"],
    ["reverse facesitting, facing away","反向坐脸·背对","cunni","cunni"],
    ["breast sucking, eye contact","吸乳对视","oral","oral"],
    ["nipple play, arched back","乳首爱抚","oral","gen"],
    ["anal missionary, legs on shoulders","正常位肛交·抬腿","lying","anal"],
    ["anal doggystyle, face down, hips raised","后入肛交·俯身","behind","anal"],
    ["anal cowgirl, reverse, arched back","骑乘肛交·反骑","riding","anal"],
    ["anal spooning, leg raised","侧卧肛交·抬腿","side","anal"],
    ["anal prone bone, pillow under hips","俯卧肛交·垫枕","behind","anal"],
    ["anal standing, wall, one leg up","站立肛交·扶墙","standing","anal"],
    ["anal wall, hands on wall","墙边肛交·抬腿","standing","anal"],
    ["spitroast, one partner in front, one behind, consensual","前后夹击·双人","group","group"],
    ["double penetration, two partners, consensual","双穴·双人","group","group"],
    ["two boys servicing one girl, consensual","双男侍奉","group","group"],
    ["threesome, two men one woman, consensual","三人·双男","group","group"],
    ["group sex, surrounded by partners, consensual","多人环绕","group","group"],
    ["bukkake, multiple partners, cum on face","多人射精·颜射","group","group"],
    ["gangbang, consensual group, multiple partners","多人场景","group","group"],
    ["group sex, multiple hands, eye contact","多手环绕","group","group"],
    ["after sex, cuddling, messy sheets","事后依偎","after","after"],
    ["afterglow, lying together, soft light","事后余韵","after","after"],
    ["creampie, dripping, legs spread","中出滴落","after","after"],
    ["cum on body, satisfied, eye contact","体液洒身","after","after"],
    ["aftercare, gentle kiss, blanket","事后照顾","after","after"],
    ["pillow talk, lying close, smiling","枕边低语","after","after"],
    ["vibrator, eye contact, legs spread","震动棒","gen","gen"],
    ["dildo, spread legs, eye contact","假阳具","gen","gen"],
    ["anal beads, arched back","肛珠","anal","anal"],
    ["butt plug, looking back","肛塞","anal","anal"],
    ["strap-on, behind, consensual","穿戴式","behind","pen"],
    ["blindfold, consensual bondage, missionary","蒙眼束缚","lying","pen"],
    ["rope bondage, consensual, arched back","绳缚弓背","lying","pen"],
    ["collar and leash, consensual, kneeling","项圈牵引","oral","gen"],
    ["spanking, consensual, bent over","拍打","behind","gen"],
    ["hair pulling, consensual, from behind","抓发","behind","pen"]
  ];
  const NSFW_USED_ZH = new Set(NSFW_CORES.map(c=>c.zh));
  for(const [desc, zh, dyn, kind] of NSFW_EXTRA_SEED){
    let z=zh;
    while(NSFW_USED_ZH.has(z)) z += "·扩展";
    NSFW_USED_ZH.add(z);
    NSFW_CORES.push({ tag: desc + ", " + (NSFW_LOCKS[kind] || NSFW_LOCKS.pen), zh:z, dyn });
  }

  let CACHE=null;
  let NSFW_RECENT=[];
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
        nsfwExtra:(byCat.nsfw_general||[]).length,
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
    p.push("adult woman");
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
    if(partnerMode==="1boy") return ["no extra characters","no multiple girls","only one boy","single sex position","one pose only"];
    if(partnerMode==="2boys") return ["no extra characters","no multiple girls","only two boys","single sex position","one pose only"];
    if(partnerMode==="group") return ["no extra girls","single sex position","one pose only"];
    return ["no extra characters","no multiple girls","single sex position","one pose only"];
  }

  const NSFW_DYNAMIC_GROUPS = {
    lying: ["arched back","head thrown back","head tilted back","parted lips","half-closed eyes","flushed cheeks","sweat on skin","messy hair","legs wrapped around waist","toes curling","breathless","body trembling","hips moving","lip bite","gasping","sweat drops"],
    behind: ["arched back","hips raised","face down","looking back","hands on hips","body pressed down","messy hair","flushed cheeks","breathless","spine curve","body trembling","hips moving","lip bite","gasping"],
    standing: ["standing on tiptoe","knees buckling","hands against wall","body pressed close","head tilted back","breathless","messy hair","arched back","legs wrapped around waist","body trembling","lip bite","gasping"],
    riding: ["hands on chest","head thrown back","arched back","bouncing","thighs trembling","messy hair","flushed cheeks","breathless","eye contact","body trembling","hips moving","lip bite","gasping"],
    oral: ["eye contact","hair falling over face","flushed cheeks","half-closed eyes","hands in hair","messy hair","breathless","parted lips","blissful expression","gasping","looking up","lip bite"],
    lift: ["legs wrapped around waist","arms around neck","body pressed close","floating hair","weightless","sweat on skin","head tilted back","breathless","body trembling","gasping"],
    side: ["leg over hip","fingers intertwined","arched back","half-closed eyes","flushed cheeks","breathless","messy hair","body trembling","gasping"],
    group: ["multiple hands on body","surrounded","close body contact","flushed cheeks","breathless","arched back","messy hair","blissful expression","body trembling","gasping"],
    base: ["dynamic pose","flowing hair","sweat on skin","breathless","parted lips","half-closed eyes","flushed cheeks","messy hair"]
  };
  const NSFW_DYNAMIC_CAMERA = ["low angle","from below","dutch angle","dynamic angle","foreshortening","over-the-shoulder view","close-up","depth of field","wide shot","dynamic perspective"];
  const NSFW_DYNAMIC_ATMOS = ["rim lighting","warm lighting","cool lighting","backlighting","soft shadows","sweat glistening","glowing skin","cinematic lighting","moody lighting"];
  const NSFW_DYNAMIC_ZH = {
    "arched back":"弓起背","head thrown back":"仰起头","head tilted back":"头向后仰","parted lips":"微张嘴唇",
    "half-closed eyes":"半闭眼","flushed cheeks":"脸颊泛红","sweat on skin":"肌肤出汗","messy hair":"凌乱头发",
    "fingers gripping sheets":"手指抓紧床单","hands gripping sheets":"双手抓紧床单","legs wrapped around waist":"双腿缠腰",
    "toes curling":"脚趾蜷缩","breathless":"喘息","hips raised":"臀部抬起","face buried in pillow":"脸埋枕头",
    "looking back":"回头看","body pressed down":"身体压低","spine curve":"脊背曲线","standing on tiptoe":"踮起脚",
    "knees buckling":"膝盖发软","hands against wall":"双手扶墙","body pressed close":"身体紧贴","hands on chest":"双手扶胸",
    "bouncing":"起伏","thighs trembling":"大腿颤抖","eye contact":"对视","hair falling over face":"头发垂落脸侧",
    "hands in hair":"手指穿过头发","blissful expression":"愉悦表情","arms around neck":"双臂环颈","floating hair":"飘动头发",
    "weightless":"失重感","leg over hip":"腿搭髋部","fingers intertwined":"十指相扣","multiple hands on body":"多只手抚触",
    "surrounded":"被人群环绕","close body contact":"身体紧密接触","dynamic pose":"动态姿势","flowing hair":"飘动头发",
    "low angle":"低角度","from below":"从下往上","dutch angle":"荷兰角","dynamic angle":"动态角度","foreshortening":"透视缩短",
    "over-the-shoulder view":"过肩视角","close-up":"特写","depth of field":"景深","wide shot":"广角","dynamic perspective":"动态透视",
    "rim lighting":"轮廓光","warm lighting":"暖光","cool lighting":"冷光","backlighting":"逆光","soft shadows":"柔和阴影",
    "sweat glistening":"汗水闪光","glowing skin":"肌肤发光","cinematic lighting":"电影感光影","moody lighting":"氛围光","face down":"面朝下","hands on hips":"双手扶胯",
    "body trembling":"身体颤抖","hips moving":"腰肢摆动","lip bite":"咬唇","gasping":"喘息","sweat drops":"汗珠","looking up":"仰视"
  };
  function nsfwCoreAllowed(core, partnerMode){
    const t = String(core && core.tag || "").toLowerCase();
    if (/tribadism|scissoring/.test(t)) return false;
    const two = /spitroast|double penetration|two boys servicing|threesome/.test(t);
    const group = /group sex|bukkake|gangbang|multiple visible male partners|multiple visible penises|surrounded by men/.test(t);
    if (partnerMode === "pov" || partnerMode === "1boy") return !two && !group;
    if (partnerMode === "2boys") return two || !group;
    return true;
  }
  function nsfwDynamic(core, partnerMode, tensionMode, existingTags, batchUsed){
    const t = String(core && (core.dyn || core.tag) || "").toLowerCase();
    let group = NSFW_DYNAMIC_GROUPS.lying;
    if (core && core.dyn && NSFW_DYNAMIC_GROUPS[core.dyn]) group = NSFW_DYNAMIC_GROUPS[core.dyn];
    else if (/group sex|bukkake|gangbang|multiple visible male partners|surrounded by men/.test(t)) group = NSFW_DYNAMIC_GROUPS.group;
    else if (/lifted sex|lifted position|lifted in arms|standing carry|carry position|being carried|suspended|held up/.test(t)) group = NSFW_DYNAMIC_GROUPS.lift;
    else if (/doggystyle|from behind|prone|bent over|all fours|turtle|downward dog|desk|over the lap|kneeling rear/.test(t)) group = NSFW_DYNAMIC_GROUPS.behind;
    else if (/cowgirl|riding|straddl|lap sex|chair sex|sofa lap|lotus|yab-yum|face-off|straddling/.test(t)) group = NSFW_DYNAMIC_GROUPS.riding;
    else if (/blowjob|oral|deepthroat|sixty-nine|69|facesitting|cunnilingus|paizuri|handjob|footjob|thighjob|breastjob|armpit|mutual masturbation|fingering|two-finger|intercrural|spitroast|two boys servicing/.test(t)) group = NSFW_DYNAMIC_GROUPS.oral;
    else if (/side|spoon|scissors|pretzel|spork|side saddle/.test(t)) group = NSFW_DYNAMIC_GROUPS.side;
    else if (/standing|wall sex|against window|countertop|tabletop|stair|shower|bathtub/.test(t)) group = NSFW_DYNAMIC_GROUPS.standing;

    const used = new Set((existingTags || []).map(norm));
    if (batchUsed) for (const x of batchUsed) used.add(norm(x));
    function sample(pool, count){
      const out = [];
      for (let i = 0; i < count; i++){
        const avail = pool.filter(x => !used.has(norm(x)));
        if (!avail.length) break;
        const v = avail[Math.floor(Math.random() * avail.length)];
        used.add(norm(v));
        out.push(v);
      }
      return out;
    }
    const motion = sample(group, tensionMode === "on" ? 3 : 2);
    const camera = sample(NSFW_DYNAMIC_CAMERA, 1);
    const atmos = sample(NSFW_DYNAMIC_ATMOS, 1);
    return [...motion, ...camera, ...atmos];
  }
  function zhDynamic(tag){ return NSFW_DYNAMIC_ZH[tag] || zhOf(tag); }

  function makeV17(mode, char, partnerMode, tensionMode, used){
    const P=buildPools();
    const actual = mode==="mixed" ? (Math.random()>.5 ? "sfw" : "nsfw") : mode;
    const manual=(char||"").trim();
    const u=used||new Set();

    const hair=draw(P.byCat.hair||[], manual?0:1, u);
    const eyes=draw(P.byCat.eyes||[], manual?0:1, u);
    const body=draw([...(P.byCat.body||[]), ...(P.byCat.species||[])], manual?0:1, u);
    const face=draw([...(P.byCat.face||[]), ...(P.byCat.expression||[])], actual==="sfw"?2:1, u);
    const clothes=draw(P.byCat.clothing||[], 1, u);
    const acc=draw(P.byCat.accessory||[], 1, u);
    const scene=draw(P.byCat.background||[], 1, u);
    const camera=draw([...(P.byCat.camera||[]), ...(P.byCat.composition||[]), ...(P.byCat.effects||[])], actual==="sfw"?(tensionMode==="on"?3:2):2, u);
    const light=draw([...(P.byCat.lighting||[]), ...(P.byCat.effects||[])], 1, u);
    const context=actual==="sfw"
      ? draw([...(P.byCat.pose||[]), ...(P.byCat.effects||[])], 2, u)
      : draw([...(P.byCat.effects||[])], 1, u);
    const nsfwExtra=actual==="nsfw" ? draw(P.byCat.nsfw_general||[], 3, u) : [];

    let action=[], actionCore;
    const splitAction = core => String(core&&core.tag||"").split(",").map(s=>s.trim()).filter(Boolean);
    if(actual==="sfw"){
      actionCore=pick(SFW_ACTIONS,u);
      action=[...splitAction(actionCore), ...context];
    }else{
      const basePool=NSFW_CORES.filter(c=>nsfwCoreAllowed(c,partnerMode));
      const freshPool=basePool.filter(c=>!NSFW_RECENT.includes(c.tag));
      const nsfwPool=freshPool.length?freshPool:basePool;
      actionCore=pick(nsfwPool.length?nsfwPool:NSFW_CORES,u);
      NSFW_RECENT=[actionCore.tag,...NSFW_RECENT].slice(0,120);
      action=[...splitAction(actionCore), ...context];
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
      ...nsfwExtra,
      ...scene, ...camera, ...light, ...tension,
      ...rating, ...guard(actual, partnerMode)
    ];
    const finalTags=compact(parts, action.slice(0,3));
    const dynamicTags = actual==="nsfw" ? nsfwDynamic(actionCore, partnerMode, tensionMode, finalTags, null) : [];
    const promptTags=[...finalTags];
    const ensureSection = arr => {
      for (const t of (arr||[])) {
        if (t && !promptTags.some(x=>norm(x)===norm(t))) promptTags.push(t);
      }
    };
    ensureSection(action.slice(0,3));
    ensureSection(nsfwExtra.slice(0,2));
    ensureSection(context.slice(0,1));
    ensureSection(scene.slice(0,1));
    ensureSection(camera.slice(0,1));
    ensureSection(light.slice(0,1));
    ensureSection(tension.slice(0,3));
    for (const t of dynamicTags) {
      if (!promptTags.some(x=>norm(x)===norm(t))) promptTags.push(t);
      u.add(norm(t));
    }
    const prompt=promptTags.join(", ");

    const actionZh=zhOf(actionCore);
    const sceneZh=scene.map(x=>zhOf(x)).slice(0,3).join(" / ") || "随机场景";
    const cameraZh=camera.map(x=>zhOf(x)).slice(0,3).join(" / ") || "随机镜头";
    const lightZh=light.map(x=>zhOf(x)).slice(0,3).join(" / ") || "随机光影";
    const partnerZh = actual==="nsfw" ? ({pov:"POV","1boy":"1boy","2boys":"2boys",group:"3boys+"}[partnerMode]||"POV") : "单人";
    const tensionZh = tensionMode==="on" ? "强张力开启" : "强张力关闭";
    const title=`${actual==="sfw"?"SFW":"NSFW"}｜${actionZh}`;
    const dynamicLine = dynamicTags.length ? `<div><b>动态</b>${html(dynamicTags.map(zhDynamic).join(" / "))}</div>` : "";
    const summaryHtml=`<div class="v154-summary-grid"><div><b>模式</b>${html(actual.toUpperCase())}；<b>交互方</b>${html(partnerZh)}；<b>${html(tensionZh)}</b></div><div><b>动作</b>${html(actionZh)}</div><div><b>补充</b>${html(context.map(x=>zhOf(x)).join(" / "))}</div>${dynamicLine}<div><b>场景</b>${html(sceneZh)}</div><div><b>镜头/构图</b>${html(cameraZh)}</div><div><b>光影</b>${html(lightZh)}</div></div>`;
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
    if(stats) stats.textContent=`第二页：SFW 动作核心 ${P.stats.sfwActions} 个；NSFW 动作核心 ${P.stats.nsfwActions} 个（按交互方过滤）；NSFW 扩展 ${P.stats.nsfwExtra} 条；动作补充上下文 ${P.stats.context} 条；NSFW 动态层已启用。`;
    wrap.innerHTML="";
    const batchUsed=new Set();
    for(let i=0;i<cnt;i++){
      const item=makeV17(mode,char,partnerMode,tensionMode,batchUsed);
      const box=document.createElement("div");
      box.className="batch-item";
      box.innerHTML=`<h3>${i+1}. ${item.title}</h3><div class="summary">${item.summaryHtml}</div><textarea data-compacted="1">${item.prompt}</textarea><button class="copy-one">复制这一条</button>`;
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
    if(stats) stats.textContent=`第二页：SFW 动作核心 ${P.stats.sfwActions} 个；NSFW 动作核心 ${P.stats.nsfwActions} 个（按交互方过滤）；NSFW 扩展 ${P.stats.nsfwExtra} 条；动作补充上下文 ${P.stats.context} 条；NSFW 动态层已启用。`;
  }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded", install);
  else install();
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
  function locationCompatible(item,text){
    const low=String(text||"").toLowerCase();
    const posture=item.id;
    const lying=/lying|on back|on stomach|missionary|mating press|piledriver|butterfly|spooning|prone|side entry|side lying|legs spread/.test(low);
    const standing=/standing (sex|position|doggystyle|split|face|carry|creampie|aftermath)|against wall|against window|wall sex|window sex|beside window|countertop|tabletop|shower|bathtub|stair|carried/.test(low);
    const stairs=/stair|staircase/.test(low);
    const riding=/riding|cowgirl|straddl|lap sex|chair sex|sofa lap|lotus|yab-yum|face-off|straddling/.test(low);
    const rear=/doggystyle|from behind|bent over|all fours|prone|desk|kneeling rear|over the lap|turtle|downward dog/.test(low);
    if(lying && ["standing","wall","window","lifted","chair","lap","sink","railing","car"].includes(posture)) return false;
    if(standing && ["chair","lap","sofa","bededge","floor","table","sink","car","railing"].includes(posture)) return false;
    if(riding && ["standing","wall","window","lifted","shower","car","railing","sink"].includes(posture)) return false;
    if(rear && ["standing","lifted","chair","lap","car","bededge"].includes(posture)) return false;
    if(stairs && ["shower","bathtub","bededge","sofa","car","floor"].includes(posture)) return false;
    return true;
  }
  function pick(pool,text){
    const low=String(text||'').toLowerCase();
    const candidates=pool.filter(x=>{
      if(pool===LOCATIONS && !locationCompatible(x,text)) return false;
      return !x.tag.split(',').some(t=>low.includes(t.trim().toLowerCase()));
    });
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
    if(!list.length && folders.length<=1){w.innerHTML='<div class="empty">还没有保存 OC。</div>';return;}
    folders.forEach(folder=>{
      const items=by.get(folder.id)||[];
      if(folderFilter==='__all' && keyword && !items.length) return;
      if(folderFilter!=='__all' && folder.id!==folderFilter) return;
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
