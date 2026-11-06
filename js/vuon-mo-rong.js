(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const KEY="aeCayKheExpansion_v1", GAME_KEY="aeCayKheVuonTriThuc_v1";
  const defaults={land:0,house:0,gearOwned:["ribbon"],gearEquipped:{head:"ribbon",body:"",charm:""},pots:{1:2,2:0,3:0,4:0},selectedPot:1,bugs:[],bugKits:0,weather:{country:"VN",city:"Can Tho",temperature:null,code:null,wind:null,rain:null,updated:0},insectSeenAt:0};
  let x; try{x={...defaults,...JSON.parse(localStorage.getItem(KEY)||"{}"),pots:{...defaults.pots,...(JSON.parse(localStorage.getItem(KEY)||"{}").pots||{})},gearEquipped:{...defaults.gearEquipped,...(JSON.parse(localStorage.getItem(KEY)||"{}").gearEquipped||{})}};}catch(e){x={...defaults};}
  x.bugKits=Math.max(0,Math.floor(Number(x.bugKits)||0));
  const saveX=()=>localStorage.setItem(KEY,JSON.stringify(x));
  const syncGame=()=>window.dispatchEvent(new Event("aeCayKheExternalUpdate"));
  function main(){try{return JSON.parse(localStorage.getItem(GAME_KEY)||"{}");}catch(e){return {};}}
  function coins(){return Math.max(0,Number(main().coins)||0);}
  function spend(n){const s=main();if(coins()<n)return false;s.coins-=n;s.totalSpent=(Number(s.totalSpent)||0)+n;localStorage.setItem(GAME_KEY,JSON.stringify(s));syncGame();const c=$("coin-count");if(c)c.textContent=s.coins;return true;}
  function earn(n){const s=main();s.coins=(Number(s.coins)||0)+n;localStorage.setItem(GAME_KEY,JSON.stringify(s));syncGame();const c=$("coin-count");if(c)c.textContent=s.coins;}
  function note(t){const el=$("toast");if(el){el.textContent=t;el.classList.add("show");setTimeout(()=>el.classList.remove("show"),2400);}}
  const lands=[{name:"Mảnh đất ven suối",price:120,plots:3,desc:"Mở thêm 3 ô trồng."},{name:"Đồng cỏ phía đông",price:260,plots:4,desc:"Mở thêm 4 ô trồng."},{name:"Thung lũng màu mỡ",price:520,plots:6,desc:"Mở thêm 6 ô trồng."}];
  const houses=[{name:"Nhà gỗ nhỏ",price:180,desc:"Mở khóa góc nghỉ ngơi."},{name:"Nhà gỗ mở rộng",price:420,desc:"Mở rộng khu sinh hoạt của nông trại."},{name:"Biệt thự vườn",price:900,desc:"Mở khóa bảng thành tựu nhà cửa."}];
  const gears=[{id:"ribbon",name:"Nơ lá non",slot:"head",icon:"🎀",price:0,bonus:"Trang trí"},{id:"bell",name:"Chuông bạc",slot:"charm",icon:"🔔",price:45,bonus:"+2 xu khi thu hoạch"},{id:"scarf",name:"Khăn choàng",slot:"body",icon:"🧣",price:65,bonus:"Trang trí"},{id:"leaf-crown",name:"Vương miện lá",slot:"head",icon:"👑",price:110,bonus:"+4 xu khi thu hoạch"},{id:"star",name:"Mặt dây sao",slot:"charm",icon:"⭐",price:150,bonus:"+6 xu khi thu hoạch"}];
  const pots=[{level:1,name:"Chậu đất nung",price:10,mult:1,icon:"🪴"},{level:2,name:"Chậu men xanh",price:35,mult:1.15,icon:"🏺"},{level:3,name:"Chậu tự tưới",price:90,mult:1.35,icon:"🪻"},{level:4,name:"Chậu sinh học cao cấp",price:180,mult:1.6,icon:"✨"}];
  const bugs=[{id:"bee",name:"Ong mật",icon:"🐝",type:"Có ích",desc:"Hỗ trợ thụ phấn."},{id:"ladybug",name:"Bọ rùa",icon:"🐞",type:"Có ích",desc:"Ăn rệp hại cây."},{id:"butterfly",name:"Bướm phượng",icon:"🦋",type:"Thụ phấn",desc:"Góp phần thụ phấn cho hoa."},{id:"dragonfly",name:"Chuồn chuồn",icon:"🪰",type:"Có ích",desc:"Là một phần của hệ sinh thái vườn."},{id:"earthworm",name:"Giun đất",icon:"🪱",type:"Có ích",desc:"Giúp đất tơi xốp."},{id:"mantis",name:"Bọ ngựa",icon:"🦗",type:"Thiên địch",desc:"Săn một số côn trùng gây hại."},{id:"grasshopper",name:"Châu chấu",icon:"🦗",type:"Có thể gây hại",desc:"Có thể ăn lá non."},{id:"caterpillar",name:"Sâu bướm",icon:"🐛",type:"Có thể gây hại",desc:"Một số loài ăn lá cây."},{id:"snail",name:"Ốc sên",icon:"🐌",type:"Có thể gây hại",desc:"Thường ăn lá non khi ẩm."},{id:"firefly",name:"Đom đóm",icon:"✨",type:"Quan sát",desc:"Tạo điểm nhấn sinh thái vào buổi tối."},{id:"beetle",name:"Bọ cánh cứng",icon:"🪲",type:"Đa dạng",desc:"Có nhiều vai trò khác nhau trong tự nhiên."},{id:"spider",name:"Nhện vườn",icon:"🕷️",type:"Thiên địch",desc:"Giúp kiểm soát một số côn trùng nhỏ."}];
  function renderEstate(){const s=main(),plots=(Array.isArray(s.plots)?s.plots.length:6);$("estate-summary").textContent=`Xu hiện có: ${coins()} · Đất đã mua: ${x.land}/${lands.length} · Nhà cấp ${x.house} · Quy mô dự kiến: ${plots} ô đất.`;$("estate-shop").innerHTML='<h3 class="expansion-subtitle">🌾 Mua đất</h3>'+lands.map((a,i)=>`<article class="exp-card"><b>${a.name}</b><p>${a.desc}</p><strong>${a.price} xu</strong><button class="primary" data-land="${i}" ${i<x.land?'disabled':''}>${i<x.land?'Đã mua':i===x.land?'Mua đất':'Mở khóa sau'}</button></article>`).join('')+'<h3 class="expansion-subtitle">🏠 Nâng cấp nhà</h3>'+houses.map((a,i)=>`<article class="exp-card"><b>${a.name}</b><p>${a.desc}</p><strong>${a.price} xu</strong><button class="primary" data-house="${i}" ${i<x.house?'disabled':''}>${i<x.house?'Đã sở hữu':i===x.house?'Mua / nâng cấp':'Mở khóa sau'}</button></article>`).join('');$("estate-shop").querySelectorAll('[data-land]').forEach(b=>b.onclick=()=>{let i=+b.dataset.land;if(i!==x.land)return;if(!spend(lands[i].price)){note('Không đủ xu.');return;}const s=main();x.land++;s.expansionLand=(Number(s.expansionLand)||0)+lands[i].plots;s.plots=s.plots||Array(6).fill(null);for(let n=0;n<lands[i].plots;n++)s.plots.push(null);s.agriculture=s.agriculture||{};s.agriculture.soil=s.agriculture.soil||[];s.agriculture.plotStatus=s.agriculture.plotStatus||[];for(let n=0;n<lands[i].plots;n++){s.agriculture.soil.push({fertility:72,organicMatter:48,moisture:62,compaction:18,lastUpdated:Date.now()});s.agriculture.plotStatus.push({pestLoad:0,diseaseLoad:0,pest:'',disease:'',health:100});}localStorage.setItem(GAME_KEY,JSON.stringify(s));syncGame();saveX();note('Đã mua đất mới! Đang tải lại diện tích mở rộng...');setTimeout(()=>location.reload(),500);});$("estate-shop").querySelectorAll('[data-house]').forEach(b=>b.onclick=()=>{let i=+b.dataset.house;if(i!==x.house)return;if(!spend(houses[i].price)){note('Không đủ xu.');return;}x.house++;saveX();renderEstate();note('Nhà đã được nâng cấp!');});}
  function renderGear(){const pet=main().pet||{name:'Pet của bạn',icon:'🐱'};$("petgear-active").textContent=`Pet hiện tại: ${pet.icon||'🐾'} ${pet.name||'Pet'} · Đầu: ${gears.find(g=>g.id===x.gearEquipped.head)?.icon||'—'} · Thân: ${gears.find(g=>g.id===x.gearEquipped.body)?.icon||'—'} · Phụ kiện: ${gears.find(g=>g.id===x.gearEquipped.charm)?.icon||'—'}`;$("petgear-list").innerHTML=gears.map(g=>{let own=x.gearOwned.includes(g.id),eq=x.gearEquipped[g.slot]===g.id;return `<article class="exp-card"><div class="gear-icon">${g.icon}</div><b>${g.name}</b><small>${g.bonus}</small><strong>${g.price?g.price+' xu':'Miễn phí'}</strong><button class="primary" data-gear="${g.id}">${eq?'Đang trang bị':own?'Trang bị': 'Mua phụ kiện'}</button></article>`}).join('');$("petgear-list").querySelectorAll('[data-gear]').forEach(b=>b.onclick=()=>{const g=gears.find(z=>z.id===b.dataset.gear);if(!x.gearOwned.includes(g.id)){if(!spend(g.price)){note('Không đủ xu mua phụ kiện.');return;}x.gearOwned.push(g.id);}x.gearEquipped[g.slot]=g.id;saveX();renderGear();note('Đã cập nhật trang bị pet.');});}
  function renderIndex(){const s=main(),cropList=[['sunflower','🌻','Hướng dương'],['carrot','🥕','Cà rốt'],['strawberry','🍓','Dâu tây'],['blueberry','🫐','Việt quất'],['moonflower','🌙','Hoa ánh trăng']];const owned=(s.collections&&s.collections.crops)||[];const petOwned=(s.collections&&s.collections.pets)||[];$("index-stats").textContent=`Cây đã khám phá: ${owned.length} · Pet đã khám phá: ${petOwned.length} · Côn trùng: ${x.bugs.length}/${bugs.length}`;$("index-crops").innerHTML=cropList.map(a=>`<div class="index-card">${a[1]} <b>${a[2]}</b><small>${(s.seeds&&s.seeds[a[0]]||0)} hạt trong túi</small></div>`).join('');$("index-pets").innerHTML=petOwned.length?petOwned.map(id=>`<div class="index-card">🐾 <b>${String(id).replace(/-/g,' ')}</b><small>Đã khám phá</small></div>`).join(''):'<p>Chưa có pet trong bộ sưu tập.</p>';$("index-bugs").innerHTML=bugs.map(b=>`<div class="index-card ${x.bugs.includes(b.id)?'found':''}">${x.bugs.includes(b.id)?b.icon:'❔'} <b>${x.bugs.includes(b.id)?b.name:'Chưa khám phá'}</b><small>${x.bugs.includes(b.id)?b.type:'Tìm thấy trong vườn'}</small></div>`).join('');}
  const countryCodes=('AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW').split(' ');
  function countryLabel(code){try{return new Intl.DisplayNames(['vi'],{type:'region'}).of(code)||code;}catch(e){return code;}}
  function fillCountrySelect(sel){if(!sel)return;if(!sel.options.length){sel.innerHTML=countryCodes.map(c=>`<option value="${c}">${countryLabel(c)}</option>`).join('');}}
  function renderCountries(){
    const world=$("world-country"),start=$("start-country");
    fillCountrySelect(world);fillCountrySelect(start);
    if(world){world.value=x.weather.country||'VN';}
    if(start){start.value=x.weather.country||'VN';}
    if($("world-city"))$("world-city").value=x.weather.city||'Can Tho';
    if($("start-city"))$("start-city").value=x.weather.city||'Cần Thơ';
    renderRegionCurrent();
  }
  function weatherDescription(code){
    if(code===0)return 'Trời quang';
    if(code===1)return 'Ít mây';
    if(code===2)return 'Có mây';
    if(code===3)return 'Nhiều mây';
    if(code===45||code===48)return 'Sương mù';
    if(code>=51&&code<=57)return 'Mưa phùn';
    if(code>=61&&code<=67)return 'Mưa';
    if(code>=71&&code<=77)return 'Tuyết';
    if(code>=80&&code<=82)return 'Mưa rào';
    if(code>=85&&code<=86)return 'Mưa tuyết';
    if(code>=95)return 'Dông';
    return 'Thời tiết biến đổi';
  }
  function escapeHtml(value){return String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));}
  function weatherEffectText(w){
    if(Number(w.temperature)>=34)return 'Mô phỏng: nắng nóng, cây mới gieo phát triển chậm nhẹ và cần chú ý tưới nước.';
    if(Number(w.temperature)<=8)return 'Mô phỏng: trời lạnh, cây ưa ấm phát triển chậm nhẹ.';
    if(Number(w.rain)>0)return 'Mô phỏng: khu vực đang có mưa, độ ẩm được cải thiện cho cây mới gieo.';
    if(Number(w.wind)>=35)return 'Mô phỏng: gió mạnh, nên dùng hàng cây chắn gió cho cây non.';
    return 'Mô phỏng: điều kiện khu vực tương đối ôn hòa, cây phát triển bình thường.';
  }
  function renderWeatherResult(place,d){
    const out=$("world-weather-result");
    if(out)out.innerHTML=`<b>📍 ${escapeHtml(place.name)}, ${escapeHtml(place.country)}</b><p>🌡️ ${d.temperature_2m}°C · ${weatherDescription(d.weather_code)}</p><p>💧 Độ ẩm: ${d.relative_humidity_2m}% · 🌧️ Lượng mưa: ${d.precipitation} mm · 💨 Gió: ${d.wind_speed_10m} km/h</p><small>Cập nhật: ${new Date().toLocaleString('vi-VN')}</small>`;
    const effect=$("world-weather-effect");if(effect)effect.textContent=weatherEffectText({temperature:d.temperature_2m,rain:d.precipitation,wind:d.wind_speed_10m});
  }
  function renderRegionCurrent(){
    const box=$("region-current");if(!box)return;
    if(!x.weather.onboarded){box.textContent='Chưa chọn khu vực bắt đầu nông trại.';return;}
    const name=x.weather.countryName||countryLabel(x.weather.country||'VN');
    const where=(x.weather.city||'Chưa rõ địa điểm')+', '+name;
    const weather=x.weather.source==='open-meteo'&&Number.isFinite(Number(x.weather.temperature))
      ? ` · ${x.weather.temperature}°C · ${weatherDescription(Number(x.weather.code)||0)}`
      : ' · Thời tiết mô phỏng';
    box.textContent='🌍 Khu vực nông trại: '+where+weather;
  }
  function openRegionOnboarding(){
    renderCountries();
    const modal=$("region-onboarding");if(!modal)return;
    if($("start-region-status"))$("start-region-status").textContent=x.weather.onboarded?'Khu vực hiện tại: '+(x.weather.city||'')+', '+(x.weather.countryName||countryLabel(x.weather.country||'VN'))+'. Chọn địa điểm mới để thay đổi.':'Chọn quốc gia và thành phố để lấy thời tiết thực tế trước khi bắt đầu.';
    if($("start-farm-offline"))$("start-farm-offline").hidden=true;
    modal.hidden=false;
  }
  function closeRegionOnboarding(){const modal=$("region-onboarding");if(modal)modal.hidden=true;}
  async function fetchLocationWeather(country,city){
    const geocodeUrl=`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=20&language=vi&format=json`;
    const g=await fetch(geocodeUrl);if(!g.ok)throw Error('Không truy cập được dịch vụ tìm địa điểm.');
    const gd=await g.json();
    const place=(gd.results||[]).find(z=>(z.country_code||'').toUpperCase()===country);
    if(!place)throw Error('Không tìm thấy thành phố thuộc quốc gia đã chọn. Hãy kiểm tra tên thành phố và quốc gia.');
    const url=`https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m&timezone=auto`;
    const w=await fetch(url);if(!w.ok)throw Error('Không lấy được dữ liệu thời tiết của khu vực.');
    const body=await w.json();if(!body.current)throw Error('Dữ liệu thời tiết trả về không đầy đủ.');
    return {place,current:body.current,timezone:body.timezone||''};
  }
  function saveSelectedRegion(country,city,result,source){
    const place=result?.place||{};const d=result?.current||{};
    x.weather={
      country,countryName:place.country||countryLabel(country),city:place.name||city,
      region:place.admin1||'',latitude:Number.isFinite(place.latitude)?place.latitude:null,
      longitude:Number.isFinite(place.longitude)?place.longitude:null,timezone:result?.timezone||'',
      temperature:Number.isFinite(d.temperature_2m)?d.temperature_2m:null,
      humidity:Number.isFinite(d.relative_humidity_2m)?d.relative_humidity_2m:null,
      code:Number.isFinite(d.weather_code)?d.weather_code:null,
      wind:Number.isFinite(d.wind_speed_10m)?d.wind_speed_10m:null,
      rain:Number.isFinite(d.precipitation)?d.precipitation:null,
      updated:Date.now(),onboarded:true,source:source||'open-meteo'
    };
    saveX();syncGame();renderRegionCurrent();
    if(result)renderWeatherResult(place,d);
    else {
      const out=$("world-weather-result");if(out)out.textContent=`📍 ${x.weather.city}, ${x.weather.countryName} · Đang dùng thời tiết mô phỏng vì chưa kết nối được dữ liệu trực tuyến.`;
      const effect=$("world-weather-effect");if(effect)effect.textContent='Thời tiết mô phỏng trung tính. Bạn có thể cập nhật thời tiết thực tế trong mục này khi có Internet.';
    }
    if($("world-country"))$("world-country").value=country;
    if($("world-city"))$("world-city").value=x.weather.city;
  }
  async function startRegion(){
    const country=$("start-country")?.value||'VN',city=$("start-city")?.value.trim()||'';
    const status=$("start-region-status"),button=$("start-farm-region"),offline=$("start-farm-offline");
    if(!city){if(status)status.textContent='Bạn cần nhập thành phố hoặc khu vực để bắt đầu.';return;}
    if(button){button.disabled=true;button.textContent='⏳ Đang lấy thời tiết khu vực...';}
    if(status)status.textContent='Đang tìm địa điểm và truy vấn thời tiết hiện tại...';
    if(offline)offline.hidden=true;
    try{
      const result=await fetchLocationWeather(country,city);
      saveSelectedRegion(country,city,result,'open-meteo');
      closeRegionOnboarding();
      note('🌱 Nông trại đã bắt đầu tại '+x.weather.city+', '+x.weather.countryName+'.');
    }catch(error){
      if(status)status.textContent='Không lấy được thời tiết thực tế: '+error.message;
      if(offline)offline.hidden=false;
    }finally{if(button){button.disabled=false;button.textContent='🌱 Bắt đầu trồng trọt tại khu vực này';}}
  }
  function startRegionOffline(){
    const country=$("start-country")?.value||'VN',city=$("start-city")?.value.trim()||'';
    if(!city){if($("start-region-status"))$("start-region-status").textContent='Bạn cần nhập thành phố hoặc khu vực.';return;}
    saveSelectedRegion(country,city,null,'simulation');closeRegionOnboarding();
    note('🌱 Đã bắt đầu nông trại với thời tiết mô phỏng tại '+city+'.');
  }
  async function getWeather(){
    const country=$("world-country").value,city=$("world-city").value.trim();
    if(!city){note('Nhập tên thành phố trước nhé.');return;}
    const out=$("world-weather-result");if(out)out.textContent='Đang tìm tọa độ và dữ liệu thời tiết...';
    const button=$("world-weather-btn");if(button)button.disabled=true;
    try{
      const result=await fetchLocationWeather(country,city);
      saveSelectedRegion(country,city,result,'open-meteo');
      if(out)out.insertAdjacentHTML('beforeend','<p><b>Đã cập nhật khí hậu cho các cây gieo tiếp theo.</b></p>');
      note('Đã cập nhật thời tiết khu vực nông trại.');
    }catch(e){if(out)out.textContent='Không thể lấy thời tiết: '+e.message+' (Cần kết nối Internet).';}
    finally{if(button)button.disabled=false;}
  }
  function renderPots(){const shop=$("pot-shop");if(shop)shop.innerHTML=pots.map(p=>{const stock=Number(x.pots[p.level])||0;return `<article class="exp-card pot-exp-card"><div class="pot-animation-stage"><span class="pot-demo-spark">✦</span><span class="pot-demo-plant pot-growth-${p.level}">🌱</span><span class="pot-demo-vessel">${p.icon}</span><span class="pot-demo-firefly">✨</span></div><b>Cấp ${p.level}: ${p.name}</b><p>Tốc độ sinh trưởng ×${p.mult.toFixed(2)}</p><strong>${p.price? p.price+' xu':'Miễn phí ban đầu'} · Kho: ${stock}</strong><button class="primary" data-pot-buy="${p.level}">${p.price?'Mua thêm chậu':'Nhận chậu ban đầu'}</button></article>`;}).join('');if(shop)shop.querySelectorAll('[data-pot-buy]').forEach(b=>b.onclick=()=>{const p=pots.find(z=>z.level===+b.dataset.potBuy);if(p.price&&!spend(p.price)){note('Không đủ xu mua chậu.');return;}x.pots[p.level]=(x.pots[p.level]||0)+1;saveX();renderPots();note('Đã thêm '+p.name+' vào kho nhà kính.');});const sel=$("pot-selected");if(sel){const previous=Number(x.selectedPot)||1;sel.innerHTML=pots.filter(p=>(x.pots[p.level]||0)>0).map(p=>`<option value="${p.level}">${p.name} (×${p.mult}) · còn ${x.pots[p.level]}</option>`).join('');sel.value=(x.pots[previous]||0)>0?String(previous):(pots.find(p=>(x.pots[p.level]||0)>0)?.level||'');sel.onchange=()=>{x.selectedPot=+sel.value;saveX();};}window.dispatchEvent(new Event('aeCayKhePotsUpdated'));}
  function renderBugKit(){
    const stock=$("bug-kit-stock");
    if(stock)stock.textContent="🔎 Bộ quan sát đang có: "+x.bugKits+" bộ";
    const search=$("bug-search");
    if(search)search.textContent="🔎 Quan sát côn trùng · tiêu hao 1 bộ";
  }
  function buyBugKit(){
    const cost=8;
    if(!spend(cost)){note("Cần 8 xu để mua bộ quan sát côn trùng.");return;}
    x.bugKits=(Number(x.bugKits)||0)+1;
    saveX();renderBugKit();
    window.dispatchEvent(new Event("aeCayKheExternalUpdate"));
    note("Đã mua 1 bộ quan sát côn trùng. Vật phẩm đã được thêm vào túi đồ.");
  }
  function searchBug(){const found=bugs.filter(b=>!x.bugs.includes(b.id));if(!found.length){$("bug-encounter").textContent='Bạn đã khám phá đủ 12 loài côn trùng trong Index!';return;}if(x.bugKits<1){$("bug-encounter").textContent='Bạn đã hết bộ quan sát. Hãy mua thêm với giá 8 xu trong mục này.';note('Cần 1 bộ quan sát côn trùng để khám phá.');return;}x.bugKits--;const b=found[Math.floor(Math.random()*found.length)];x.bugs.push(b.id);x.insectSeenAt=Date.now();saveX();const habitat=$("bug-habitat");if(habitat){habitat.classList.remove('bug-discovery-flash');void habitat.offsetWidth;habitat.classList.add('bug-discovery-flash');habitat.querySelectorAll('.bug-discovered-sprite').forEach(e=>e.remove());const sprite=document.createElement('span');sprite.className='bug-discovered-sprite';sprite.textContent=b.icon;habitat.appendChild(sprite);}$("bug-encounter").innerHTML=`<span class="bug-reveal-icon">${b.icon}</span> <b>Phát hiện: ${b.name}</b><p>${b.type} – ${b.desc}</p><small>Đã thêm vào Index côn trùng.</small>`;renderIndex();renderBugKit();window.dispatchEvent(new Event("aeCayKheExternalUpdate"));$("bug-collection").innerHTML=x.bugs.map(id=>{const z=bugs.find(a=>a.id===id);return `<div class="index-card found">${z.icon} <b>${z.name}</b><small>${z.type}</small></div>`}).join('');note('Đã ghi nhận '+b.name+' vào sổ khám phá!');}

  const oldPlant=window.__aePlantHookInstalled?null:null;
  function installPlantHook(){const scriptState=main();if(!scriptState)return;}
  function init(){
    renderEstate();renderGear();renderIndex();renderCountries();renderPots();
    window.addEventListener("aeCayKheStateUpdated",()=>{renderEstate();renderIndex();renderGear();renderPots();});
    window.addEventListener("aeCayKheExternalUpdate",()=>{renderEstate();renderIndex();renderGear();renderPots();});
    $("world-weather-btn").addEventListener('click',getWeather);
    $("world-change-location").addEventListener('click',openRegionOnboarding);
    $("start-farm-region").addEventListener('click',startRegion);
    $("start-farm-offline").addEventListener('click',startRegionOffline);
    $("bug-search").addEventListener('click',searchBug);
    $("bug-kit-buy").addEventListener('click',buyBugKit);
    renderBugKit();
    
    if(x.weather.updated>0&&!x.weather.onboarded){x.weather.onboarded=true;saveX();}
    if(!x.weather.onboarded)openRegionOnboarding();
  }
  init();
})();
