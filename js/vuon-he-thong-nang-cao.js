(()=>{'use strict';
const KEY='aeCayKheAdvanced_v1',GAME='aeCayKheVuonTriThuc_v1',EXP='aeCayKheExpansion_v1';
const $=id=>document.getElementById(id);let a;try{a={warehouse:0,nails:0,screws:0,paint:0,gems:0,guardian:null,guardianTrip:null,expedition:null,order:null,visitor:null,market:[],potStars:{},rep:0,contract:null,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(e){a={warehouse:0,nails:0,screws:0,paint:0,gems:0,guardian:null,guardianTrip:null,expedition:null,order:null,visitor:null,market:[],potStars:{},rep:0,contract:null};}
const read=()=>{try{return JSON.parse(localStorage.getItem(GAME)||'{}')}catch(e){return {}}},write=s=>{localStorage.setItem(GAME,JSON.stringify(s));window.dispatchEvent(new Event("aeCayKheExternalUpdate"));},save=()=>localStorage.setItem(KEY,JSON.stringify(a));
function note(t){const e=$('toast');if(e){e.textContent=t;e.classList.add('show');setTimeout(()=>e.classList.remove('show'),2600)}}
function spend(n){let s=read();if((+s.coins||0)<n)return false;s.coins-=n;s.totalSpent=(+s.totalSpent||0)+n;write(s);const c=$('coin-count');if(c)c.textContent=s.coins;return true}function earn(n){let s=read();s.coins=(+s.coins||0)+n;write(s);const c=$('coin-count');if(c)c.textContent=s.coins}
const products=[['sunflower','🌻','Hướng dương'],['carrot','🥕','Cà rốt'],['strawberry','🍓','Dâu tây'],['blueberry','🫐','Việt quất'],['moonflower','🌙','Hoa ánh trăng']];
function countItems(){const s=read(),seed=Object.values(s.seeds||{}).reduce((x,n)=>x+(+n||0),0),produce=Object.values(s.produce||{}).reduce((x,n)=>x+(+n||0),0);return seed+produce+a.nails+a.screws+a.paint+a.gems;}
function renderWarehouse(){const cap=30+a.warehouse*20,used=countItems();$('adv-warehouse').innerHTML=`<b>🎒 ${used}/${cap} ô kho</b><p>Đinh: ${a.nails} · Ốc vít: ${a.screws} · Sơn: ${a.paint} · Ngọc: ${a.gems}</p><p>Cấp kho: ${a.warehouse+1} · Mỗi cấp thêm 20 ô.</p><button class="primary" id="adv-upgrade-warehouse">Nâng kho · ${[80,150,260,400][a.warehouse]||600} xu + 2 đinh + 2 ốc + 1 sơn</button>`;$('adv-upgrade-warehouse').onclick=()=>{const cost=[80,150,260,400][a.warehouse]||600;if(a.warehouse>=4)return note('Kho đã đạt cấp tối đa.');if(a.nails<2||a.screws<2||a.paint<1)return note('Chưa đủ vật liệu. Nhận vật liệu qua thám hiểm hoặc khách ghé thăm.');if(!spend(cost))return note('Không đủ xu.');a.nails-=2;a.screws-=2;a.paint--;a.warehouse++;save();render();note('Kho đã được mở rộng!')};}
function newOrder(){const s=read(),available=products.filter(p=>(+(s.produce||{})[p[0]]||0)>=0);const p=available[Math.floor(Math.random()*available.length)];a.order={id:Date.now(),crop:p[0],name:p[2],icon:p[1],qty:2+Math.floor(Math.random()*4),reward:45+Math.floor(Math.random()*90),xp:12+Math.floor(Math.random()*18)};save();renderOrder()}
let orderDeliveryBusy=false;
function renderOrder(){const e=$('adv-order');if(!a.order){e.innerHTML='<p>Chưa có đơn hàng.</p><button class="primary" id="adv-new-order">📋 Nhận đơn mới</button>';$('adv-new-order').onclick=newOrder;return}const s=read(),have=+(s.produce||{})[a.order.crop]||0;e.innerHTML=`<b>${a.order.icon} Đơn hàng: ${a.order.name}</b><p>Cần ${a.order.qty} · Trong kho có ${have}</p><p>Thưởng: ${a.order.reward} xu + ${a.order.xp} EXP nông trại</p><div class="order-delivery-scene" id="order-delivery-scene"><div class="order-delivery-title">🚜 TUYẾN NÔNG TRẠI → KHU PHỐ</div><div class="order-delivery-road"><span class="order-farm">🏡</span><span class="order-wagon">🚚<i>📦</i></span><span class="order-town">🏘️</span></div><b class="order-delivery-status" id="order-delivery-status">Xe đang đỗ tại nông trại</b></div><button class="primary" id="adv-complete-order" ${have<a.order.qty||orderDeliveryBusy?'disabled':''}>🚚 Chất hàng và giao</button> <button id="adv-reroll-order" ${orderDeliveryBusy?'disabled':''}>Bỏ qua đơn</button>`;$('adv-complete-order').onclick=()=>{if(orderDeliveryBusy)return;let g=read();if((+(g.produce||{})[a.order.crop]||0)<a.order.qty)return note('Chưa đủ nông sản.');orderDeliveryBusy=true;const earnedReward=a.order.reward;const deliverBtn=$('adv-complete-order'),rerollBtn=$('adv-reroll-order'),scene=$('order-delivery-scene'),status=$('order-delivery-status');deliverBtn.disabled=true;if(rerollBtn)rerollBtn.disabled=true;scene.classList.remove('is-moving','is-arrived');void scene.offsetWidth;scene.classList.add('is-moving');status.textContent='📦 Đang chất '+a.order.qty+' '+a.order.name+' lên xe...';setTimeout(()=>{if(status)status.textContent='🚚 Xe đang chạy đến khu phố...';},650);setTimeout(()=>{if(status){status.textContent='🏘️ Xe đã đến nơi, đang bàn giao đơn hàng...';}scene.classList.add('is-arrived');},1650);setTimeout(()=>{let latest=read();if((+(latest.produce||{})[a.order.crop]||0)<a.order.qty){orderDeliveryBusy=false;note('Kho hàng đã thay đổi, vui lòng kiểm tra lại đơn.');renderOrder();return;}latest.produce[a.order.crop]-=a.order.qty;latest.coins=(+latest.coins||0)+earnedReward;latest.exp=(+latest.exp||0)+a.order.xp;latest.level=Math.max(+latest.level||1,1+Math.floor(latest.exp/100));latest.orderDeliveries=(+latest.orderDeliveries||0)+1;write(latest);a.rep+=2;a.order=null;save();orderDeliveryBusy=false;render();note('🎉 Giao hàng thành công! Nhận '+earnedReward+' xu và điểm danh vọng.');},2350)};$('adv-reroll-order').onclick=()=>{if(orderDeliveryBusy)return;a.order=null;save();renderOrder()}}
function visitor(){if(a.visitor)return note('Khách đang ở trong vườn rồi.');const list=[{name:'Bác làm vườn',text:'Tặng vật liệu sửa kho.',reward:'materials'},{name:'Cô bán hoa',text:'Muốn mua một bó hoa.',reward:'coins'},{name:'Mực thủ thư',text:'Đố bạn một câu hỏi về cách sửa đổi lề lối làm việc.',reward:'quiz'}];a.visitor=list[Math.floor(Math.random()*list.length)];save();renderVisitor()}
function renderVisitor(){const e=$('adv-visitor');if(!a.visitor){e.innerHTML='<p>Chưa có khách. Khách có thể ghé thăm khi bạn bấm gọi khách.</p><button class="primary" id="adv-call-visitor">🚶 Mời khách vãng lai</button>';$('adv-call-visitor').onclick=visitor;return}e.innerHTML=`<b>👤 ${a.visitor.name}</b><p>${a.visitor.text}</p><button class="primary" id="adv-help-visitor">Tương tác</button>`;$('adv-help-visitor').onclick=()=>{if(a.visitor.reward==='materials'){a.nails+=1;a.screws+=1;a.paint+=1;note('Nhận 1 đinh, 1 ốc vít và 1 sơn!')}else if(a.visitor.reward==='coins'){earn(35);note('Khách mua hoa, bạn nhận 35 xu!')}else{a.rep+=1;note('Mực khen bạn đã chủ động nhìn nhận và sửa thiếu sót! +1 danh vọng')}a.visitor=null;save();render()}}
function renderPotForge(){const star=+(a.potStars.level||0);$('adv-pot').innerHTML=`<b>🪴 Bộ chậu hiện tại: ${star}★</b><p>Mỗi sao tăng 5% tốc độ cây trong chậu (tối đa 5 sao).</p><p>Ngọc: ${a.gems}</p><button class="primary" id="adv-forge-pot">Ép sao chậu · 2 ngọc + ${40+star*30} xu</button>`;$('adv-forge-pot').onclick=()=>{if(star>=5)return note('Chậu đã đạt 5 sao.');if(a.gems<2)return note('Cần 2 ngọc. Nhận qua thám hiểm.');if(!spend(40+star*30))return note('Không đủ xu.');a.gems-=2;a.potStars.level=star+1;save();renderPotForge();note('Ép sao chậu thành công!')};}
function renderWeather(){const w=(JSON.parse(localStorage.getItem(EXP)||'{}').weather)||{};const hasTemp=w.temperature!==null&&w.temperature!==undefined&&Number.isFinite(Number(w.temperature));const kind=Number(w.rain)>0?'Mưa':hasTemp&&Number(w.temperature)>=32?'Nắng nóng':hasTemp&&Number(w.temperature)<=15?'Sương lạnh':hasTemp?'Trời quang':'Chưa có dữ liệu';const place=w.city?(w.city+', '+(w.countryName||w.country||'')):'Chưa chọn khu vực';$('adv-cloud').innerHTML=`<b>☁️ Khu vực: ${place}</b><p>Tầng mây: ${kind} · Nhiệt độ: ${w.temperature??'—'}°C · Mưa: ${w.rain??'—'} mm · Gió: ${w.wind??'—'} km/h</p><p>Thời tiết được lấy theo khu vực khởi đầu của người chơi. Các chỉ số ảnh hưởng mô phỏng sinh trưởng, không làm mất cây.</p>`;}
function renderGuardians(){
 const e=$('adv-guardian'),active=!!a.guardianTrip;
 e.innerHTML=`<b>🐉 Thần hộ mệnh</b><p>${a.guardian?'Đang nuôi: '+a.guardian:'Chưa có thần hộ mệnh'}</p><button class="primary" id="adv-guardian-buy">${a.guardian?'Đã sở hữu':'Nhận Tinh linh hoa · 100 xu'}</button><button id="adv-guardian-trip" ${!a.guardian||active?'disabled':''}>${active?'Đang thám hiểm...':'Gửi đi tìm vật liệu · 1 phút'}</button><p id="adv-guardian-status">${active?'Tinh linh đang bay quanh khu rừng tìm vật liệu.':'Tinh linh có thể rời vườn để tìm nguyên liệu hiếm.'}</p>`;
 $('adv-guardian-buy').onclick=()=>{if(a.guardian)return;if(!spend(100))return note('Không đủ xu.');a.guardian='Tinh linh hoa';save();renderGuardians();note('Tinh linh hoa đã gia nhập khu vườn!')};
 $('adv-guardian-trip').onclick=()=>{if(!a.guardian)return note('Cần có thần hộ mệnh.');if(a.guardianTrip)return note('Tinh linh đang đi tìm vật liệu.');a.guardianTrip=Date.now();save();renderGuardians();note('🧚 Tinh linh hoa đã bay vào khu rừng!')};
}
function finishGuardianTrip(){
 if(!a.guardianTrip||Date.now()-a.guardianTrip<60000)return;
 a.guardianTrip=null;a.gems+=1;a.nails+=1;save();renderGuardians();renderWarehouse();note('✨ Tinh linh trở về: tìm được 1 ngọc và 1 đinh!');
}
function renderMarket(){
 const e=$('adv-market');
 if(!e)return;

 e.innerHTML=`
   <p class="market-scene-caption">Một góc chợ quê nhộn nhịp trong thế giới Vườn Tri Thức.</p>
   <div class="floating-market-scene" role="img" aria-label="Hoạt cảnh chợ quê với quầy nông sản, người bán, khách tham quan và xe hàng chuyển động">
     <div class="floating-market-sky"><span class="market-sun">☀️</span><span class="market-cloud market-cloud-a">☁️</span><span class="market-cloud market-cloud-b">☁️</span></div>
     <div class="market-hill market-hill-back"></div><div class="market-hill market-hill-front"></div>
     <div class="market-shop shop-left"><span class="market-awning"></span><b>QUẦY RAU CỦ</b><div class="market-crates"><i>🥕</i><i>🥬</i><i>🌽</i></div><span class="market-vendor">👩‍🌾</span></div>
     <div class="market-shop shop-right"><span class="market-awning awning-pink"></span><b>GIAN HOA QUẢ</b><div class="market-crates"><i>🍓</i><i>🍊</i><i>🍇</i></div><span class="market-vendor vendor-two">🧑‍🌾</span></div>
     <span class="market-lantern lantern-one">🏮</span><span class="market-lantern lantern-two">🏮</span>
     <div class="market-walker walker-one">🚶<small>Khách tham quan</small></div>
     <div class="market-walker walker-two">🧑‍🌾<small>Người làm vườn</small></div>
     <div class="market-walker walker-three">🧺</div>
     <div class="market-cart">🛒<span>🥕🍓</span></div>
     <div class="market-birds">🐦　🐦</div>
     <div class="market-road"><span></span></div>
     <div class="market-scene-sign">🌿 CHỢ QUÊ VUI VẺ 🌿</div>
   </div>
   <div class="market-scene-footer"><span>🎐 Người bán đang bày hàng</span><span>🚶 Khách ghé thăm</span><span>🛒 Xe hàng đi ngang</span></div>
   <p class="market-scene-note">Chợ trời ở đây chỉ có hoạt ảnh trang trí, không mua bán, đăng tin, đặt giá hay đấu giá. Việc này không làm thay đổi xu hoặc kho đồ của bạn.</p>`;
}
function renderContract(){const e=$('adv-contract');e.innerHTML='<b>📜 Giao kèo NPC</b><p>Nhận trước 20 xu, sau đó giao 3 nông sản bất kỳ trong 24 giờ. Không hoàn thành thì hợp đồng tự hết hạn, không khóa kho hoặc tài khoản.</p><button class="primary" id="adv-contract-start">Nhận hợp đồng</button><span id="adv-contract-state"></span>';$('adv-contract-start').onclick=()=>{if(a.contract)return note('Bạn đang có hợp đồng.');earn(20);a.contract={until:Date.now()+86400000,advance:20};save();$('adv-contract-state').textContent='Đã nhận. Hãy giao đủ 3 nông sản tại bảng đơn hàng.';note('Đã nhận ứng trước 20 xu!')};if(a.contract&&Date.now()>a.contract.until){a.contract=null;save();$('adv-contract-state').textContent='Hợp đồng đã hết hạn; không có hình phạt tài khoản.'}}
function expeditionPhase(elapsed){
 if(elapsed<20000)return '🧚 Rời nông trại, băng qua cánh đồng...';
 if(elapsed<50000)return '🌲 Đang khám phá khu rừng cổ...';
 if(elapsed<90000)return '🪨 Đang tìm đường qua thung lũng đá...';
 if(elapsed<120000)return '✨ Phát hiện dấu vết của hạt giống bí ẩn...';
 return '🏡 Tinh linh đang trở về nông trại...';
}
function updateExpeditionVisual(){
 const scene=$('expedition-scene'),runner=$('expedition-runner'),status=$('expedition-status'),bar=$('expedition-progress'),time=$('expedition-time');
 if(!a.expedition){if(status)status.textContent='Chưa có chuyến thám hiểm nào.';if(bar)bar.style.width='0%';if(time)time.textContent='';return;}
 const elapsed=Math.max(0,Date.now()-a.expedition),pct=Math.min(100,elapsed/120000*100);
 if(scene)scene.classList.add('expedition-running');
 if(runner)runner.style.left=(8+pct*.82)+'%';
 if(status)status.textContent=expeditionPhase(elapsed);
 if(bar)bar.style.width=pct+'%';
 if(time){const remain=Math.max(0,120-Math.floor(elapsed/1000));time.textContent=`Còn ${Math.floor(remain/60)}:${String(remain%60).padStart(2,'0')}`;}
}
function finishExpedition(){
 if(!a.expedition||Date.now()-a.expedition<120000)return;
 a.expedition=null;a.gems+=1;a.screws+=1;
 const s=read(),crop=['sunflower','carrot','strawberry'][Math.floor(Math.random()*3)];
 s.seeds=s.seeds||{};s.seeds[crop]=(Number(s.seeds[crop])||0)+1;
 write(s);save();renderExpedition();renderWarehouse();note('🎉 Thám hiểm thành công: +1 ngọc, +1 ốc vít và 1 hạt giống!');
}
function renderExpedition(){
 const e=$('adv-expedition-map'),active=!!a.expedition;
 e.innerHTML=`<b>🧭 Thám hiểm Vườn Bí Ẩn</b><p>Gửi Tinh linh hoa đi qua các vùng đất, quan sát dấu vết và khám phá hạt giống hiếm. Không có chiến đấu hay vũ khí.</p>
 <div class="expedition-scene" id="expedition-scene"><div class="expedition-scene-sky">☁️ <span>☁️</span></div><div class="expedition-route"><i class="expedition-route-line"></i><span class="expedition-stop stop-home">🏡<small>Nông trại</small></span><span class="expedition-stop stop-forest">🌲<small>Rừng cổ</small></span><span class="expedition-stop stop-cave">🪨<small>Thung lũng</small></span><span class="expedition-stop stop-treasure">✨<small>Hạt giống</small></span><span class="expedition-runner" id="expedition-runner">🧚</span></div><div class="expedition-progress-track"><i id="expedition-progress"></i></div><div class="expedition-status-row"><b id="expedition-status">${active?expeditionPhase(Date.now()-a.expedition):'Chờ Tinh linh nhận nhiệm vụ.'}</b><strong id="expedition-time"></strong></div></div>
 <button class="primary" id="adv-explore" ${!a.guardian||active?'disabled':''}>${active?'🧭 Đang thám hiểm...':'Bắt đầu khám phá · 2 phút'}</button><span id="adv-explore-result"></span>`;
 $('adv-explore').onclick=()=>{if(!a.guardian)return note('Cần có thần hộ mệnh.');if(a.expedition)return note('Tinh linh đang thám hiểm.');a.expedition=Date.now();save();renderExpedition();updateExpeditionVisual();note('🧭 Chuyến thám hiểm bắt đầu!');};
 updateExpeditionVisual();
}
function renderEconomyScene(){
 const s=read(),seeds=Object.values(s.seeds||{}).reduce((n,v)=>n+(Number(v)||0),0),goods=Object.values(s.produce||{}).reduce((n,v)=>n+(Number(v)||0),0);
 const stock=$('economy-scene-stock'),orders=$('economy-scene-orders'),rep=$('economy-scene-rep');
 if(stock)stock.textContent=seeds+goods+a.nails+a.screws+a.paint+a.gems;
 if(orders)orders.textContent=Number(s.orderDeliveries||s.deliveryCount||0);
 if(rep)rep.textContent=a.rep;
}
function render(){renderEconomyScene();renderWarehouse();renderOrder();renderVisitor();renderPotForge();renderWeather();renderGuardians();renderMarket();renderContract();renderExpedition()}
function init(){
 const tab=$('page-advanced');if(!tab)return;render();
 window.addEventListener('aeCayKheStateUpdated',()=>{renderEconomyScene();renderWarehouse();renderOrder();});
 window.addEventListener('aeCayKheExternalUpdate',()=>{renderEconomyScene();renderWarehouse();renderOrder();});
 setInterval(()=>{finishGuardianTrip();finishExpedition();if(a.expedition)updateExpeditionVisual();},1000);
}
init();
})();
