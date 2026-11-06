(() => {
  "use strict";
  const GAME_KEY = "aeCayKheVuonTriThuc_v1";
  const QUIZ_KEY = "soPhieuQuiz"; 
  const seeds = {
    sunflower: {name:"Hướng dương", icon:"🌻", cost:4, reward:12, seconds:25, amount:0},
    carrot: {name:"Cà rốt", icon:"🥕", cost:6, reward:18, seconds:40, amount:0},
    strawberry: {name:"Dâu tây", icon:"🍓", cost:10, reward:30, seconds:60, amount:0},
    blueberry: {name:"Việt quất", icon:"🫐", cost:15, reward:42, seconds:75, unlockLevel:2, amount:0},
    moonflower: {name:"Hoa ánh trăng", icon:"🌙", cost:22, reward:65, seconds:95, unlockLevel:4, amount:0}
  };
  const defaultState = {
    coins:30, level:1, harvests:0, totalSpent:0, researchPoints:0, labLevel:1, bonusSeeds:0,
    waterBottles:2, waterPickupAt:0, unlockedResearchSeeds:[],
    weatherTools:{shadeNet:false,greenhouse:false,drainage:false,windbreak:false},
    agriculture:{
      soil:Array.from({length:6},()=>({fertility:72,organicMatter:48,moisture:62,compaction:18,lastUpdated:Date.now()})),
      plotStatus:Array.from({length:6},()=>({pestLoad:0,diseaseLoad:0,pest:"",disease:"",health:100})),
      inventory:{compost:3,organicSpray:2,feed:4,manure:0},
      beneficial:{ladybugs:0,bees:0},
      livestock:{chicken:1,cow:0,goat:0,eggs:0,milk:0,products:{eggs:0,milk:0,manure:0},hunger:75,water:75,health:100,lastCare:Date.now()},
      lastDailyKey:"",marketKey:"",marketPrices:{}
    },
    hybrids:{}, produce:{}, deliveryCount:0, deliveryHistory:[], collections:{crops:[],research:[],pets:[],chickens:[]}, activePet:null, activeChicken:null, pet:{name:"Mèo Mướp",icon:"🐱",hunger:70,bond:0,variant:"normal",bonus:0},
    selectedSeed:"sunflower", seeds:{sunflower:3,carrot:1,strawberry:0,blueberry:0,moonflower:0},
    plots:Array(6).fill(null), tasks:{plant:false,water:false,play:false,harvest:false},
    dailyMissions:{dateKey:"",progress:{plant:false,water:false,play:false,harvest:false},claimed:{}},
    story:{chapter2MucAccepted:false,chapter2MucDone:false,chapter2ResearchDone:false,mucSaga:{chapter:1,accepted:false,questionPassed:false,progress:0,completed:[]}},
    dailyPlant:{dateKey:"",cropId:"",claimed:false},
    actionQuizIndex:0, actionQuizCorrect:0,
    lastCare:Date.now(), lastAction:"Chào mừng bạn đến với khu vườn!"
  };
  let state = loadState();
  let trackSeasonalEventAction = function(){};
  let farmScienceSystem = null;
  
  try {
    const arcadeData = JSON.parse(localStorage.getItem("aeCayKhe_thanhTichSanThuThach") || "{}");
    state.researchPoints = Math.max(Number(state.researchPoints)||0, Number(arcadeData.score)||0);
    state.labLevel = Math.min(5, Math.max(Number(state.labLevel)||1, 1 + Math.floor(state.researchPoints / 30)));
    localStorage.setItem(GAME_KEY, JSON.stringify(state));
  } catch(e) {}
  let toastTimer;
  const $ = id => document.getElementById(id);
  function loadState(){
    try{
      const saved=JSON.parse(localStorage.getItem(GAME_KEY));
      if(saved && typeof saved==="object"){
        return {...structuredClone(defaultState),...saved,
          pet:{...defaultState.pet,...saved.pet},
          waterBottles:Math.max(0,Number(saved.waterBottles ?? defaultState.waterBottles)||0),
          waterPickupAt:Number(saved.waterPickupAt)||0,
          unlockedResearchSeeds:Array.isArray(saved.unlockedResearchSeeds)?saved.unlockedResearchSeeds:[],
          agriculture:{
            ...defaultState.agriculture,...(saved.agriculture||{}),
            soil:Array.from({length:6},(_,i)=>({...defaultState.agriculture.soil[i],...((saved.agriculture&&saved.agriculture.soil&&saved.agriculture.soil[i])||{})})),
            plotStatus:Array.from({length:6},(_,i)=>({...defaultState.agriculture.plotStatus[i],...((saved.agriculture&&saved.agriculture.plotStatus&&saved.agriculture.plotStatus[i])||{})})),
            inventory:{...defaultState.agriculture.inventory,...((saved.agriculture&&saved.agriculture.inventory)||{})},
            beneficial:{...defaultState.agriculture.beneficial,...((saved.agriculture&&saved.agriculture.beneficial)||{})},
            livestock:{...defaultState.agriculture.livestock,...((saved.agriculture&&saved.agriculture.livestock)||{})},
            marketPrices:(saved.agriculture&&saved.agriculture.marketPrices)||{}
          },
          collections:{...defaultState.collections,...(saved.collections||{})},
          hybrids:saved.hybrids||{}, produce:saved.produce||{}, deliveryCount:saved.deliveryCount||0, deliveryHistory:saved.deliveryHistory||[],
          seeds:{...defaultState.seeds,...saved.seeds},
          tasks:{...defaultState.tasks,...saved.tasks},
          dailyMissions:{...defaultState.dailyMissions,...(saved.dailyMissions||{}),progress:{...defaultState.dailyMissions.progress,...((saved.dailyMissions&&saved.dailyMissions.progress)||{})},claimed:{...((saved.dailyMissions&&saved.dailyMissions.claimed)||{})}},
          story:{...defaultState.story,...(saved.story||{}),mucSaga:{...defaultState.story.mucSaga,...((saved.story&&saved.story.mucSaga)||{}),completed:Array.isArray(saved.story&&saved.story.mucSaga&&saved.story.mucSaga.completed)?saved.story.mucSaga.completed:[]}},
          dailyPlant:{...defaultState.dailyPlant,...(saved.dailyPlant||{})},
          plots:Array.from({length:6},(_,i)=>Array.isArray(saved.plots)&&saved.plots[i]?{...saved.plots[i],soilIndex:Number.isInteger(saved.plots[i].soilIndex)?saved.plots[i].soilIndex:i}:null)};
      }
    }catch(e){}
    return structuredClone(defaultState);
  }
  function save(){localStorage.setItem(GAME_KEY,JSON.stringify(state));}
  function quizTickets(){return Math.max(0,Number(localStorage.getItem(QUIZ_KEY))||0);}
  function setCoins(value){state.coins=Math.max(0,Math.floor(value));save();render();}
  function notify(message){const el=$("toast");el.textContent=message;el.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove("show"),2400);}

  const weatherSystem = (() => {
    const ZONE = "Asia/Ho_Chi_Minh";
    const weatherList = [
      {id:"sunny",weight:22,name:"Nắng đẹp",icon:"☀️",multiplier:1.10,desc:"Ánh nắng thuận lợi giúp cây gieo hôm nay phát triển nhanh hơn 10%.",effect:"Tăng tốc độ sinh trưởng 10%.",color:"sun"},
      {id:"cloudy",weight:18,name:"Nhiều mây",icon:"☁️",multiplier:1.00,desc:"Thời tiết ổn định, cây phát triển theo tốc độ bình thường.",effect:"Không tăng hoặc giảm tốc độ.",color:"cloud"},
      {id:"rain",weight:15,name:"Mưa rào",icon:"🌧️",multiplier:1.00,naturalWater:true,desc:"Mưa tự tưới miễn phí cho cây mới gieo hôm nay.",effect:"Cây mới gieo được tưới tự động, không tốn bình nước.",color:"rain"},
      {id:"heatwave",weight:10,name:"Nắng nóng gay gắt",icon:"🥵",multiplier:0.78,desc:"Nhiệt độ cao làm cây mới gieo phát triển chậm hơn. Lưới che nắng giúp giảm ảnh hưởng.",effect:"Giảm tốc độ sinh trưởng 22%.",color:"hot"},
      {id:"drought",weight:8,name:"Hạn hán",icon:"🏜️",multiplier:0.65,desc:"Đất khô khiến cây mới gieo phát triển chậm. Lưới che nắng giúp giữ ẩm tốt hơn.",effect:"Giảm tốc độ sinh trưởng 35%.",color:"dry"},
      {id:"thunderstorm",weight:9,name:"Mưa dông",icon:"⛈️",multiplier:0.76,desc:"Mưa dông làm việc chăm sóc khó khăn hơn. Rãnh thoát nước giúp bảo vệ khu vườn.",effect:"Giảm tốc độ sinh trưởng 24%.",color:"storm"},
      {id:"cold",weight:7,name:"Rét đậm",icon:"🥶",multiplier:0.76,desc:"Không khí lạnh làm cây mới gieo phát triển chậm. Nhà kính giúp giảm tác động.",effect:"Giảm tốc độ sinh trưởng 24%.",color:"cold"},
      {id:"frost",weight:4,name:"Sương giá",icon:"❄️",multiplier:0.62,desc:"Sương giá làm cây non phát triển chậm. Nhà kính có thể bảo vệ cây.",effect:"Giảm tốc độ sinh trưởng 38%.",color:"frost"},
      {id:"windstorm",weight:4,name:"Gió giật mạnh",icon:"🌬️",multiplier:0.72,desc:"Gió mạnh ảnh hưởng cây mới gieo. Hàng cây chắn gió giúp giảm tác động.",effect:"Giảm tốc độ sinh trưởng 28%.",color:"wind"},
      {id:"hail",weight:3,name:"Mưa đá",icon:"🌨️",multiplier:0.58,desc:"Mưa đá làm cây non phát triển chậm nhưng không phá hủy cây. Hàng cây chắn gió giúp che chắn.",effect:"Giảm tốc độ sinh trưởng 42%, không làm mất cây.",color:"hail"}
    ];
    const upgrades = [
      {id:"shadeNet",name:"Lưới che nắng",icon:"⛱️",cost:70,research:15,desc:"Giảm ảnh hưởng của nắng nóng và hạn hán."},
      {id:"greenhouse",name:"Nhà kính mini",icon:"🏡",cost:120,research:30,desc:"Giảm ảnh hưởng của rét đậm và sương giá."},
      {id:"drainage",name:"Rãnh thoát nước",icon:"💧",cost:90,research:20,desc:"Giảm ảnh hưởng của mưa dông."},
      {id:"windbreak",name:"Hàng cây chắn gió",icon:"🌳",cost:100,research:25,desc:"Giảm ảnh hưởng của gió giật và mưa đá."}
    ];

    function getDateParts(offsetDays=0){
      const date=new Date(Date.now()+offsetDays*86400000);
      const parts=new Intl.DateTimeFormat("en-CA",{timeZone:ZONE,year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(date);
      const get=name=>Number(parts.find(part=>part.type===name)?.value||0);
      const y=get("year"),m=get("month"),d=get("day");
      return {y,m,d,key:y+"-"+String(m).padStart(2,"0")+"-"+String(d).padStart(2,"0")};
    }
    function hash(text){let h=2166136261;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
    function getForDate(date){
      const roll=hash(date.key)%100;let total=0;
      for(const item of weatherList){total+=item.weight;if(roll<total)return item;}
      return weatherList[0];
    }
    function getToday(){return getForDate(getDateParts(0));}
    function getTomorrow(){return getForDate(getDateParts(1));}
    function getNextMidnight(){
      const date=getDateParts(0);
      return Date.UTC(date.y,date.m-1,date.d+1)-7*60*60*1000;
    }
    function getPlantEffect(){
      const weather=getToday(),tools=state.weatherTools||{};
      let multiplier=weather.multiplier;
      let note=weather.effect;
      if(weather.id==="heatwave"&&tools.shadeNet){multiplier+=0.15;note="Lưới che nắng giảm ảnh hưởng nắng nóng; tốc độ còn giảm nhẹ.";}
      if(weather.id==="drought"&&tools.shadeNet){multiplier+=0.20;note="Lưới che nắng giúp giữ ẩm; cây phát triển tốt hơn.";}
      if(weather.id==="thunderstorm"&&tools.drainage){multiplier+=0.18;note="Rãnh thoát nước đã giảm ảnh hưởng mưa dông.";}
      if((weather.id==="cold"||weather.id==="frost")&&tools.greenhouse){multiplier+=weather.id==="frost"?0.25:0.20;note="Nhà kính mini giúp bảo vệ cây trước không khí lạnh.";}
      if((weather.id==="windstorm"||weather.id==="hail")&&tools.windbreak){multiplier+=weather.id==="hail"?0.18:0.20;note="Hàng cây chắn gió giúp bảo vệ cây non.";}
      return {weather,multiplier:Math.max(0.55,Math.min(1.2,multiplier)),naturalWater:!!weather.naturalWater,note};
    }
    function buyUpgrade(id){
      const item=upgrades.find(x=>x.id===id);if(!item)return;
      state.weatherTools=state.weatherTools||{};
      if(state.weatherTools[id]){notify("Bạn đã có công trình này rồi.");return;}
      if(state.coins<item.cost){notify("Cần "+item.cost+" xu để xây "+item.name+".");return;}
      if((state.researchPoints||0)<item.research){notify("Cần "+item.research+" điểm bé ngoan để xây "+item.name+".");return;}
      state.coins-=item.cost;state.researchPoints-=item.research;state.weatherTools[id]=true;
      state.lastAction="Xây công trình bảo vệ thời tiết: "+item.name;
      save();render();renderPanel();notify("Đã xây "+item.name+"! Công trình sẽ bảo vệ các cây gieo từ hôm nay trở đi.");
    }
    function ensurePanel(){
      let panel=document.getElementById("farm-weather-panel");if(panel)return panel;
      panel=document.createElement("section");panel.id="farm-weather-panel";panel.className="farm-weather-panel panel";
      panel.innerHTML='<div class="weather-heading"><div><p class="weather-kicker">KHÍ HẬU MÔ PHỎNG · GIỜ VIỆT NAM</p><h2>🌦️ Trạm thời tiết nông trại</h2></div><span class="weather-live-tag">Cập nhật mỗi ngày</span></div><div class="weather-main" id="weather-main"></div><div class="weather-tools-wrap"><h3>🛡️ Công trình bảo vệ cây trồng</h3><p class="weather-note">Cây không bị phá hủy bởi thời tiết. Công trình giúp giảm tác động bất lợi cho những cây được gieo sau khi xây.</p><div class="weather-tools-grid" id="weather-tools-grid"></div></div>';
      const weekly=document.getElementById("weekly-update-panel"),eventPanel=document.getElementById("seasonal-event-panel"),welcome=document.querySelector(".game-wrap .welcome");
      if(weekly)weekly.insertAdjacentElement("afterend",panel);else if(eventPanel)eventPanel.insertAdjacentElement("afterend",panel);else if(welcome)welcome.insertAdjacentElement("afterend",panel);
      panel.addEventListener("click",event=>{
        const button=event.target.closest("[data-weather-upgrade]");if(!button||button.disabled)return;
        const id=button.dataset.weatherUpgrade,item=upgrades.find(x=>x.id===id);if(!item)return;
        askBeforeFarmAction("Xây công trình "+item.name,()=>buyUpgrade(id));
      });
      return panel;
    }
    function renderPanel(){
      const panel=ensurePanel(),today=getToday(),tomorrow=getTomorrow(),effect=getPlantEffect(),tools=state.weatherTools||{};
      const weatherMain=panel.querySelector("#weather-main");
      weatherMain.innerHTML='<article class="weather-current weather-'+today.color+'"><div class="weather-icon">'+today.icon+'</div><div class="weather-copy"><small>THỜI TIẾT HÔM NAY</small><h3>'+today.name+'</h3><p>'+today.desc+'</p><b>Ảnh hưởng: '+effect.note+'</b></div></article><div class="weather-forecast"><div><small>DỰ BÁO NGÀY MAI</small><strong>'+tomorrow.icon+' '+tomorrow.name+'</strong><p>'+tomorrow.effect+'</p></div><div class="weather-count"><small>ĐỔI THỜI TIẾT SAU</small><strong id="weather-countdown">--:--:--</strong></div></div><p class="weather-simulation-note">Thời tiết được mô phỏng cố định theo ngày để mọi người chơi có cùng thử thách; không phải dự báo khí tượng ngoài đời.</p>';
      panel.querySelector("#weather-tools-grid").innerHTML=upgrades.map(item=>{
        const owned=!!tools[item.id];
        return '<article class="weather-tool"><div class="weather-tool-icon">'+item.icon+'</div><div class="weather-tool-copy"><b>'+item.name+'</b><small>'+item.desc+'</small><small>Giá: '+item.cost+' xu · '+item.research+' điểm bé ngoan</small></div><button type="button" class="weather-upgrade-button" data-weather-upgrade="'+item.id+'" '+(owned?'disabled':'')+'>'+(owned?'✓ Đã xây':'Xây dựng')+'</button></article>';
      }).join("");
      updateCountdown();
    }
    function updateCountdown(){
      const el=document.getElementById("weather-countdown");if(!el)return;
      const left=Math.max(0,getNextMidnight()-Date.now()),hours=String(Math.floor(left/3600000)).padStart(2,"0"),minutes=String(Math.floor(left%3600000/60000)).padStart(2,"0"),seconds=String(Math.floor(left%60000/1000)).padStart(2,"0");
      el.textContent=hours+":"+minutes+":"+seconds;
    }
    function init(){
      state.weatherTools={...{shadeNet:false,greenhouse:false,drainage:false,windbreak:false},...(state.weatherTools||{})};
      renderPanel();
      let currentKey=getDateParts(0).key;
      setInterval(()=>{updateCountdown();const newKey=getDateParts(0).key;if(newKey!==currentKey){currentKey=newKey;renderPanel();notify("🌦️ Thời tiết nông trại đã thay đổi! Hãy xem dự báo hôm nay.");}},1000);
      window.addEventListener("focus",()=>{const newKey=getDateParts(0).key;if(newKey!==currentKey){currentKey=newKey;renderPanel();}else updateCountdown();});
      document.addEventListener("visibilitychange",()=>{if(!document.hidden){const newKey=getDateParts(0).key;if(newKey!==currentKey){currentKey=newKey;renderPanel();}else updateCountdown();}});
      save();
    }
    return {getPlantEffect,init,renderPanel};
  })();

  const bookQuestions = [
    {q:"Tác phẩm Sửa đổi lối làm việc được viết vào thời gian nào?",a:["Tháng 10 năm 1947","Tháng 8 năm 1945","Tháng 5 năm 1954","Tháng 9 năm 1969"],correct:0,why:"Tác phẩm được viết vào tháng 10-1947 tại Việt Bắc."},
    {q:"Bút danh được dùng khi viết tác phẩm là gì?",a:["Nguyễn Ái Quốc","T.Lan","X.Y.Z","Trần Dân Tiên"],correct:2,why:"Tác phẩm Sửa đổi lối làm việc được ký bút danh X.Y.Z."},
    {q:"Tác phẩm có bao nhiêu phần chính?",a:["4 phần","5 phần","6 phần","8 phần"],correct:2,why:"Tác phẩm gồm 6 phần chính, từ Phê bình và sửa chữa đến Chống thói ba hoa."},
    {q:"Phần đầu tiên của tác phẩm có tên là gì?",a:["Cách lãnh đạo","Phê bình và sửa chữa","Vấn đề cán bộ","Mấy điều kinh nghiệm"],correct:1,why:"Phần I có tên Phê bình và sửa chữa."},
    {q:"Một mục đích quan trọng của việc tự phê bình là gì?",a:["Che giấu khuyết điểm","Đổ lỗi cho người khác","Nhận ra thiếu sót để sửa chữa và tiến bộ","Chỉ tìm lỗi của người khác"],correct:2,why:"Nhìn nhận đúng khuyết điểm giúp sửa chữa và làm công việc tiến bộ hơn."},
    {q:"Ba loại khuyết điểm được nhấn mạnh cần khắc phục gồm những gì?",a:["Chủ quan, hẹp hòi, ba hoa","Chậm chạp, ít nói, tiết kiệm","Thiếu ngủ, nóng nảy, vội vàng","Quên việc, ít tiền, thiếu dụng cụ"],correct:0,why:"Tác phẩm nêu bệnh chủ quan, bệnh hẹp hòi và thói ba hoa là những khuyết điểm cần khắc phục."},
    {q:"Phần nào của tác phẩm bàn về đạo đức và tư cách của người cách mạng?",a:["Tư cách và đạo đức cách mạng","Chống thói ba hoa","Cách lãnh đạo","Mấy điều kinh nghiệm"],correct:0,why:"Đây là tên phần III của tác phẩm."},
    {q:"Phần nào tập trung bàn về công tác cán bộ?",a:["Phê bình và sửa chữa","Vấn đề cán bộ","Chống thói ba hoa","Cách lãnh đạo"],correct:1,why:"Vấn đề cán bộ là phần IV của tác phẩm."},
    {q:"Theo tinh thần tác phẩm, khi phát hiện cách làm chưa hiệu quả ta nên làm gì?",a:["Giữ nguyên vì đã quen","Bỏ qua và không trao đổi","Xem xét nguyên nhân, tiếp thu góp ý và sửa cách làm","Đổ lỗi cho hoàn cảnh"],correct:2,why:"Tinh thần sửa đổi là nhìn nhận thực tế, học hỏi và chủ động sửa những điểm chưa tốt."},
    {q:"Thói ba hoa trong nói và viết nên được thay bằng cách diễn đạt nào?",a:["Dài dòng, nhiều từ khó","Rõ ràng, đúng trọng tâm, dễ hiểu","Dùng thật nhiều thuật ngữ","Nói càng lâu càng tốt"],correct:1,why:"Nói và viết cần thiết thực, rõ ràng, phù hợp với người nghe và nội dung."},
    {q:"Phần cuối cùng của tác phẩm có tên là gì?",a:["Vấn đề cán bộ","Cách lãnh đạo","Chống thói ba hoa","Tư cách và đạo đức cách mạng"],correct:2,why:"Phần VI, cũng là phần cuối, có tên Chống thói ba hoa."},
    {q:"Khi góp ý cho bạn trong nhóm, cách làm phù hợp nhất là gì?",a:["Nêu cụ thể việc cần sửa và trao đổi trên tinh thần xây dựng","Chê bai trước đám đông","Im lặng dù thấy lỗi rõ ràng","Chỉ nói lỗi mà không đề xuất cách sửa"],correct:0,why:"Góp ý nên chân thành, cụ thể, nhằm giúp nhau tiến bộ chứ không công kích cá nhân."},
    {q:"Vì sao cần gắn học tập với thực hành?",a:["Để chỉ nhớ lý thuyết","Để kiến thức được vận dụng và tạo kết quả thực tế","Để tránh làm việc","Để có thêm khẩu hiệu"],correct:1,why:"Kiến thức cần được vận dụng vào công việc cụ thể để tạo chuyển biến thực tế."},
    {q:"Khi nhận nhiệm vụ nhóm, cách làm nào thể hiện tinh thần trách nhiệm?",a:["Chờ người khác làm","Làm theo cảm tính, không kiểm tra","Lập kế hoạch, thực hiện và kiểm tra kết quả","Bỏ qua góp ý"],correct:2,why:"Làm việc có kế hoạch và kiểm tra kết quả giúp công việc thiết thực, hiệu quả."},
    {q:"Nội dung chính của phần Cách lãnh đạo hướng đến điều gì?",a:["Phương pháp và cách tổ chức lãnh đạo công việc","Cách trồng cây trong vườn","Cách viết truyện dài","Cách buôn bán ở chợ"],correct:0,why:"Phần V bàn về phương pháp lãnh đạo, tổ chức và thực hiện công việc."},
    {q:"Nếu mắc lỗi trong công việc, lựa chọn nào phù hợp với tinh thần sửa đổi?",a:["Giấu lỗi","Thừa nhận, tìm nguyên nhân và sửa chữa","Đổ lỗi cho đồng đội","Không làm việc đó nữa"],correct:1,why:"Tinh thần tự phê bình là dám nhận thiếu sót và có hành động khắc phục."},
    {q:"Một bài học có thể áp dụng khi làm bài tập nhóm là gì?",a:["Không cần lắng nghe ai","Phân công rõ ràng, phối hợp và góp ý xây dựng","Chỉ một người làm tất cả","Không cần kiểm tra sản phẩm"],correct:1,why:"Phối hợp, phân công và trao đổi thẳng thắn giúp tập thể làm việc tốt hơn."},
    {q:"Tác phẩm hướng đến việc nâng cao điều gì ở người cán bộ cách mạng?",a:["Trình độ lý luận, phẩm chất đạo đức và tác phong công tác","Khả năng nói thật dài","Sự nổi tiếng cá nhân","Số lượng khẩu hiệu"],correct:0,why:"Mục đích tác phẩm gắn với nâng cao lý luận, tư tưởng, đạo đức và tác phong công tác."},
    {q:"Khi báo cáo kết quả, nên trình bày như thế nào?",a:["Nói chung chung, không có căn cứ","Dùng lời lẽ phức tạp","Nêu đúng việc đã làm, kết quả và vấn đề còn tồn tại","Chỉ kể thành tích"],correct:2,why:"Báo cáo cần trung thực, cụ thể, rõ kết quả và cả điểm còn hạn chế."},
    {q:"Điều nào thể hiện tinh thần học hỏi để tiến bộ?",a:["Không tiếp nhận góp ý","Cho rằng mình luôn đúng","Thường xuyên xem lại cách làm và điều chỉnh khi cần","Lặp lại sai sót mà không rút kinh nghiệm"],correct:2,why:"Tự xem xét và điều chỉnh cách làm là biểu hiện của tinh thần học hỏi, sửa đổi."},
    {q:"Khi tự phê bình, điều quan trọng nhất là gì?",a:["Nói cho có hình thức","Thành thật nhận ra thiếu sót và đề ra cách khắc phục","Chỉ kể thành tích","Tìm người để đổ lỗi"],correct:1,why:"Tự phê bình có ý nghĩa khi trung thực nhìn nhận hạn chế và sửa chữa bằng hành động."},
    {q:"Phê bình người khác nên dựa trên nguyên tắc nào?",a:["Công kích cá nhân","Nói theo tin đồn","Góp ý chân thành, có căn cứ và nhằm giúp nhau tiến bộ","Chỉ trích trước đám đông"],correct:2,why:"Góp ý cần có căn cứ, thiện chí và tập trung vào việc cần sửa, không hạ thấp con người."},
    {q:"Trong học tập, biểu hiện nào gần với bệnh chủ quan?",a:["Kiểm tra dữ kiện trước khi kết luận","Cho rằng ý kiến mình luôn đúng dù chưa tìm hiểu","Tham khảo tài liệu","Hỏi lại khi chưa rõ"],correct:1,why:"Chủ quan là đánh giá theo ý muốn cá nhân, thiếu kiểm tra thực tế và lắng nghe."},
    {q:"Một biểu hiện của thói hẹp hòi là gì?",a:["Hợp tác với người khác","Tôn trọng ý kiến khác biệt","Chỉ muốn lợi ích của nhóm mình, không quan tâm lợi ích chung","Chia sẻ kinh nghiệm"],correct:2,why:"Hẹp hòi làm hạn chế tinh thần đoàn kết và khả năng phối hợp vì mục tiêu chung."},
    {q:"Khi chưa hiểu rõ một vấn đề, cách làm nào phù hợp?",a:["Đoán rồi khẳng định","Hỏi người có kinh nghiệm và kiểm tra tài liệu","Chép ý kiến bất kỳ","Bỏ qua vấn đề"],correct:1,why:"Chủ động hỏi và kiểm chứng giúp tránh hiểu sai, làm sai."},
    {q:"Một kế hoạch công việc tốt nên có yếu tố nào?",a:["Mục tiêu, việc cần làm, thời hạn và người phụ trách","Chỉ có khẩu hiệu","Không cần thời hạn","Không cần kiểm tra tiến độ"],correct:0,why:"Kế hoạch rõ giúp mọi người biết mục tiêu, trách nhiệm và cách theo dõi kết quả."},
    {q:"Sau khi hoàn thành nhiệm vụ, vì sao cần kiểm tra kết quả?",a:["Để tìm người trách phạt","Để đối chiếu mục tiêu, phát hiện thiếu sót và rút kinh nghiệm","Để kéo dài công việc","Vì không tin ai"],correct:1,why:"Kiểm tra giúp nhận biết kết quả thực tế và điều chỉnh cách làm cho lần sau."},
    {q:"Khi làm việc nhóm, phân công nhiệm vụ rõ ràng giúp gì?",a:["Tăng chồng chéo","Không ai chịu trách nhiệm","Mỗi người hiểu phần việc và phối hợp đúng tiến độ","Một người phải làm tất cả"],correct:2,why:"Phân công rõ ràng làm tăng trách nhiệm cá nhân và hiệu quả phối hợp."},
    {q:"Trong trao đổi, nói ngắn gọn và đúng trọng tâm giúp gì?",a:["Người nghe dễ hiểu và dễ thực hiện","Che giấu thông tin","Làm nội dung khó hiểu","Thể hiện mình biết nhiều"],correct:0,why:"Diễn đạt rõ ràng, thiết thực giúp truyền đạt đúng nội dung và tiết kiệm thời gian."},
    {q:"Khi báo cáo gặp khó khăn, nên làm gì?",a:["Che giấu để khỏi bị hỏi","Báo cáo trung thực, nêu nguyên nhân và đề xuất hướng xử lý","Chỉ nói phần thuận lợi","Đổ lỗi cho người khác"],correct:1,why:"Báo cáo trung thực giúp tập thể xử lý vấn đề kịp thời và đúng thực tế."},
    {q:"Học lý luận mà không liên hệ thực tiễn dễ dẫn đến điều gì?",a:["Kiến thức được vận dụng tốt hơn","Hiểu sâu hơn nhờ thực hành","Học thuộc máy móc, khó giải quyết công việc cụ thể","Tự động làm việc hiệu quả"],correct:2,why:"Kiến thức cần gắn với thực hành để tránh hình thức và nâng cao hiệu quả."},
    {q:"Khi nhận được góp ý trái với ý kiến của mình, nên làm gì?",a:["Bác bỏ ngay","Lắng nghe, xem xét căn cứ rồi trao đổi bình tĩnh","Ngừng hợp tác","Tranh cãi để thắng"],correct:1,why:"Biết lắng nghe và kiểm tra căn cứ thể hiện tinh thần cầu thị."},
    {q:"Tinh thần trách nhiệm trong công việc thể hiện rõ nhất ở hành động nào?",a:["Nhận việc rồi bỏ dở","Chỉ làm khi được nhắc","Chủ động thực hiện, báo cáo tiến độ và chịu trách nhiệm về kết quả","Đẩy việc khó cho người khác"],correct:2,why:"Trách nhiệm gắn với chủ động thực hiện và chịu trách nhiệm về phần việc của mình."},
    {q:"Vì sao cần chống bệnh hình thức?",a:["Vì hình thức quan trọng hơn kết quả","Vì công việc cần có kết quả thực chất, không chỉ đẹp trên báo cáo","Vì không cần báo cáo","Vì không cần tổ chức"],correct:1,why:"Trọng tâm là hiệu quả thực tế, tránh chỉ chú trọng biểu hiện bên ngoài."},
    {q:"Khi lựa chọn cách giải quyết một vấn đề, nên căn cứ vào đâu?",a:["Sở thích nhất thời","Tin đồn","Tình hình thực tế, mục tiêu và bằng chứng","Lời khen"],correct:2,why:"Quyết định cần dựa trên thực tế và mục tiêu cụ thể, không chỉ dựa vào cảm tính."},
    {q:"Một người lãnh đạo hoặc trưởng nhóm cần làm gì để hiểu tình hình?",a:["Chỉ nghe một phía","Gần gũi, lắng nghe và nắm tình hình thực tế","Chỉ xem báo cáo thành tích","Tránh trao đổi với thành viên"],correct:1,why:"Nắm thực tế và lắng nghe nhiều phía giúp đánh giá đúng tình hình."},
    {q:"Khi phát hiện quy trình làm việc có điểm bất hợp lý, nên làm gì?",a:["Giữ nguyên vì đã quen","Tự ý bỏ mọi quy định","Nêu vấn đề, phân tích nguyên nhân và đề xuất cải tiến phù hợp","Chỉ phàn nàn"],correct:2,why:"Sửa đổi cần dựa trên phân tích và giải pháp cụ thể, có trách nhiệm."},
    {q:"Cách nào giúp tránh thói ba hoa trong báo cáo?",a:["Dùng nhiều từ hoa mỹ","Nói đúng sự việc, có số liệu hoặc ví dụ cần thiết","Kể chuyện ngoài lề","Lặp lại khẩu hiệu"],correct:1,why:"Báo cáo thiết thực nên rõ việc, rõ kết quả và có căn cứ."},
    {q:"Tinh thần đoàn kết trong tập thể cần đi cùng điều gì?",a:["Né tránh mọi góp ý","Bao che sai sót","Thẳng thắn góp ý, tôn trọng nhau và cùng sửa việc chưa tốt","Chỉ bảo vệ ý kiến cá nhân"],correct:2,why:"Đoàn kết bền vững cần sự chân thành, tôn trọng và cùng hướng đến công việc chung."},
    {q:"Bài học nào phù hợp nhất khi áp dụng tác phẩm vào học tập hiện nay?",a:["Chỉ ghi nhớ nội dung","Tự đánh giá, học hỏi, lập kế hoạch và sửa cách làm qua thực hành","Không cần hợp tác","Tránh nhận nhiệm vụ khó"],correct:1,why:"Có thể vận dụng tinh thần tự sửa đổi, học hỏi và làm việc thiết thực vào học tập hằng ngày."}
  ];
  let pendingFarmAction = null;
  let currentBookQuestion = null;

  function createBookQuiz(){
    if($("farm-book-quiz"))return;
    const wrap=document.createElement("div");
    wrap.id="farm-book-quiz";wrap.className="book-quiz-backdrop";wrap.hidden=true;
    wrap.innerHTML='<section class="book-quiz-box" role="dialog" aria-modal="true" aria-labelledby="farm-book-title">'+
      '<button type="button" class="book-quiz-close" id="farm-book-close" aria-label="Đóng">×</button>'+ 
      '<div class="book-quiz-kicker">📖 THỬ THÁCH TRI THỨC</div>'+ 
      '<h2 id="farm-book-title">Trả lời câu hỏi để tiếp tục</h2>'+ 
      '<p class="book-quiz-desc">Ngân hàng gồm 40 câu hỏi về sách <b>Sửa đổi lối làm việc</b>. Trả lời đúng để tiếp tục thao tác và tích lũy xu.</p>'+ 
      '<p class="book-quiz-action" id="farm-book-action"></p>'+ 
      '<div class="book-quiz-progress" id="farm-book-progress"></div>'+ 
      '<h3 id="farm-book-question"></h3>'+ 
      '<div class="book-quiz-options" id="farm-book-options"></div>'+ 
      '<p class="book-quiz-feedback" id="farm-book-feedback" aria-live="polite"></p>'+ 
      '<button type="button" class="book-quiz-retry" id="farm-book-retry" hidden>↻ Thử câu hỏi khác</button>'+ 
      '<small class="book-quiz-reward">Trả lời đúng: +10 xu. Trả lời sai: xem giải thích rồi thử câu khác.</small>'+ 
      '</section>';
    document.body.appendChild(wrap);
    $("farm-book-close").addEventListener("click",cancelBookAction);
    $("farm-book-retry").addEventListener("click",showNextBookQuestion);
    $("farm-book-options").addEventListener("click",function(event){
      const btn=event.target.closest("[data-book-answer]");
      if(btn)answerFarmBookQuestion(Number(btn.dataset.bookAnswer));
    });
    wrap.addEventListener("click",function(event){if(event.target===wrap)cancelBookAction();});
    document.addEventListener("keydown",function(event){if(event.key==="Escape"&&!wrap.hidden)cancelBookAction();});
  }
  function showNextBookQuestion(){
    createBookQuiz();
    const index=(Number(state.actionQuizIndex)||0)%bookQuestions.length;
    currentBookQuestion=bookQuestions[index];
    state.actionQuizIndex=(Number(state.actionQuizIndex)||0)+1;
    save();
    $("farm-book-progress").textContent="Câu hỏi "+(index+1)+" / "+bookQuestions.length;
    $("farm-book-question").textContent=currentBookQuestion.q;
    $("farm-book-options").innerHTML=currentBookQuestion.a.map((choice,i)=>'<button type="button" class="book-quiz-option" data-book-answer="'+i+'"><b>'+String.fromCharCode(65+i)+'.</b> '+choice+'</button>').join("");
    $("farm-book-feedback").textContent="";
    $("farm-book-retry").hidden=true;
    $("farm-book-options").hidden=false;
  }
  function askBeforeFarmAction(actionName,callback){
    pendingFarmAction={name:actionName,callback};
    createBookQuiz();
    $("farm-book-action").textContent="Thao tác đang chờ: "+actionName;
    showNextBookQuestion();
    $("farm-book-quiz").hidden=false;
    document.body.classList.add("book-quiz-open");
  }
  function cancelBookAction(){
    const wrap=$("farm-book-quiz");if(wrap)wrap.hidden=true;
    document.body.classList.remove("book-quiz-open");
    pendingFarmAction=null;currentBookQuestion=null;
    notify("Đã hủy thao tác. Bạn có thể thực hiện lại khi sẵn sàng.");
  }
  function answerFarmBookQuestion(answerIndex){
    if(!pendingFarmAction||!currentBookQuestion)return;
    if(answerIndex!==currentBookQuestion.correct){
      const correctText=String.fromCharCode(65+currentBookQuestion.correct)+". "+currentBookQuestion.a[currentBookQuestion.correct];
      $("farm-book-feedback").textContent="Chưa đúng. Đáp án: "+correctText+". "+currentBookQuestion.why;
      $("farm-book-options").hidden=true;
      $("farm-book-retry").hidden=false;
      return;
    }
    const action=pendingFarmAction.callback;
    const actionName=pendingFarmAction.name;
    pendingFarmAction=null;currentBookQuestion=null;
    $("farm-book-quiz").hidden=true;
    document.body.classList.remove("book-quiz-open");
    state.coins=(Number(state.coins)||0)+10;
    state.actionQuizCorrect=(Number(state.actionQuizCorrect)||0)+1;
    recordMucAction("bookCorrect",1);
    trackSeasonalEventAction("book",null,1);
    state.lastAction="Trả lời đúng câu hỏi sách trước khi: "+actionName;
    save();render();
    notify("Chính xác! +10 xu. Đang thực hiện: "+actionName+".");
    action();
  }
  function switchTab(tab){
    document.querySelectorAll(".tab").forEach(b=>b.classList.toggle("active",b.dataset.tab===tab));
    document.querySelectorAll(".tab-page").forEach(p=>p.classList.toggle("active",p.id==="page-"+tab));
  }
  document.querySelectorAll(".tab").forEach(b=>b.addEventListener("click",()=>switchTab(b.dataset.tab)));
  function buySeed(type){
    const seed=seeds[type]; if(!seed)return;
    if(seed.unlockLevel && state.labLevel<seed.unlockLevel){notify("Cần nâng cấp phòng thí nghiệm lên cấp "+seed.unlockLevel+" để mở giống này.");return;}
    if(state.coins<seed.cost){notify("Bạn chưa đủ xu bé ngoan để mua hạt giống!");return;}
    state.coins-=seed.cost;state.seeds[type]=(state.seeds[type]||0)+1;state.totalSpent+=seed.cost;save();render();notify("Đã mua 1 túi hạt "+seed.name+"!");
  }
  function plant(index){
    if(state.plots[index]){harvest(index);return;}
    const type=state.selectedSeed, seed=seeds[type];
    if(!seed || (state.seeds[type]||0)<=0){notify("Bạn đã hết hạt giống này. Hãy mua thêm trong cửa hàng.");return;}
    const plantedAt=Date.now();
    const weatherEffect=weatherSystem.getPlantEffect();
    state.seeds[type]--;
    state.plots[index]={type,plantedAt,watered:weatherEffect.naturalWater,wateredAt:weatherEffect.naturalWater?plantedAt:0,weatherMultiplier:weatherEffect.multiplier,weatherName:weatherEffect.weather.name,soilIndex:index};
    if(farmScienceSystem)farmScienceSystem.onPlant(index);
    state.tasks.plant=true;markDailyMission("plant");recordMucAction("plant",1);trackSeasonalEventAction("plant",type,1);save();render();
    notify("Đã gieo "+seed.name+"! Thời tiết: "+weatherEffect.weather.name+". "+(weatherEffect.naturalWater?"Mưa đã tưới miễn phí cho cây. ":weatherEffect.note));
  }
  function progress(plot){
    if(!plot)return 0;
    const seed=seeds[plot.type];
    const now=Date.now();
    let elapsed=now-plot.plantedAt;
    if(plot.wateredAt){
      const before=Math.max(0,plot.wateredAt-plot.plantedAt);
      const after=Math.max(0,now-plot.wateredAt);
      elapsed=before+after*1.5;
    }
    const weatherMultiplier=Math.max(0.55,Number(plot.weatherMultiplier)||1);
    const scienceMultiplier=farmScienceSystem?farmScienceSystem.getGrowthFactor(plot):1;
    return Math.min(1,(elapsed*weatherMultiplier*scienceMultiplier)/(seed.seconds*1000));
  }
  function cropStage(plot){
    const p=progress(plot);if(p>=1)return 3;if(p>=.55)return 2;if(p>=.2)return 1;return 0;
  }
  const cropIcons={
    sunflower:["🌱","🌿","🌻","🌻"],
    carrot:["🌱","🌿","🥬","🥕"],
    strawberry:["🌱","🌿","🍃","🍓"],
    blueberry:["🌱","🌿","🫐","🫐"],
    moonflower:["🌱","🌿","🌿","🌙"]
  };
  Object.entries(state.hybrids||{}).forEach(([key,h])=>{
    seeds[key]={name:h.name,icon:h.icon,cost:0,reward:h.reward,seconds:h.seconds,amount:0};
    cropIcons[key]=["🌱","🌿","🍃",h.icon];
  });
  function harvest(index){
    const plot=state.plots[index];if(!plot)return;
    if(progress(plot)<1){notify("Cây chưa chín đâu! Hãy chờ thêm một chút.");return;}
    const seed=seeds[plot.type];
    const petBonus=Number(state.pet.bonus)||0;
    const coinBonus=5*state.labLevel+petBonus;
    const seedBonus=1;
    state.coins+=seed.reward+coinBonus;
    state.seeds[plot.type]=(state.seeds[plot.type]||0)+seedBonus;
    if(farmScienceSystem)farmScienceSystem.onHarvest(index);
    state.produce=state.produce||{};
    state.produce[plot.type]=(state.produce[plot.type]||0)+1;
    state.bonusSeeds=(state.bonusSeeds||0)+seedBonus;
    const waterDrop=Math.random()<0.15;
    if(waterDrop)state.waterBottles=(state.waterBottles||0)+1;
    state.harvests++;
    state.plots[index]=null;
    state.tasks.harvest=true;markDailyMission("harvest");recordMucAction("harvest",1);
    trackSeasonalEventAction("harvest",plot.type,1);
    state.level=1+Math.floor(state.harvests/5);
    const newLabLevel=Math.min(5,1+Math.floor(state.researchPoints/30));
    const leveledUp=newLabLevel>(state.labLevel||1);
    state.labLevel=newLabLevel;
    save();render();
    notify("Thu hoạch thành công! +"+(seed.reward+coinBonus)+" xu, +1 hạt giống "+seed.name+"!"+(waterDrop?" +1 bình nước 💧":"")+(leveledUp?" Phòng thí nghiệm lên cấp "+state.labLevel+"!":""));
  }
  function waterAll(){
    const growing=state.plots.filter(p=>p&&!p.watered);
    if(!growing.length){notify("Không có cây nào cần tưới.");return;}
    if((state.waterBottles||0)<growing.length){notify("Cần "+growing.length+" bình nước để tưới hết cây. Hãy nhặt hoặc mua thêm.");return;}
    state.waterBottles-=growing.length;
    growing.forEach(p=>{p.watered=true;p.wateredAt=Date.now();const soilIndex=Number.isInteger(p.soilIndex)?p.soilIndex:state.plots.indexOf(p);const soil=state.agriculture.soil[soilIndex];soil.moisture=Math.min(100,(soil.moisture||0)+38);soil.lastUpdated=Date.now();});
    state.tasks.water=true;markDailyMission("water");recordMucAction("water",1);trackSeasonalEventAction("water",null,growing.length);save();render();notify("Đã dùng "+growing.length+" bình nước. Cây phát triển nhanh hơn 50%! 💧");
  }
  function findWater(){
    const cooldown=10*60*1000, now=Date.now(), left=cooldown-(now-(state.waterPickupAt||0));
    if(left>0){notify("Bạn đã nhặt bình nước rồi. Thử lại sau "+Math.ceil(left/60000)+" phút.");return;}
    state.waterBottles=(state.waterBottles||0)+1;state.waterPickupAt=now;save();render();notify("Bạn vừa nhặt được 1 bình nước! 💧");
  }
  function buyWater(){
    const cost=4;
    if(state.coins<cost){notify("Bạn cần 4 xu bé ngoan để mua bình nước.");return;}
    state.coins-=cost;state.totalSpent+=cost;state.waterBottles=(state.waterBottles||0)+1;state.lastAction="Đã mua 1 bình nước";save();render();notify("Đã mua 1 bình nước! 💧");
  }
  function feedPet(){
    if(state.coins<5){notify("Bạn cần 5 xu bé ngoan để mua thức ăn cho pet.");return;}
    if(state.pet.hunger>=100){notify("Pet đã no căng rồi!");return;}
    state.coins-=5;state.totalSpent+=5;state.pet.hunger=Math.min(100,state.pet.hunger+30);state.pet.bond=Math.min(100,state.pet.bond+3);save();render();notify("Mèo Mướp ăn ngon lành! 🍓");
  }
  function playPet(){
    state.pet.bond=Math.min(100,state.pet.bond+10);state.pet.hunger=Math.max(0,state.pet.hunger-5);state.tasks.play=true;markDailyMission("play");recordMucAction("play",1);trackSeasonalEventAction("play",null,1);save();render();notify("Pet rất vui khi được chơi cùng bạn! 💚");
  }
  function buyTicket(){
    const cost=25;
    if(state.coins<cost){
      notify("Bạn cần 25 xu để đổi 1 phiếu Quiz.");
      return;
    }

    const current=quizTickets();
    const totalTickets=current+1;
   
    localStorage.setItem(QUIZ_KEY,String(totalTickets));
    state.coins-=cost;
    state.totalSpent+=cost;
    state.lastAction="Đã đổi 1 phiếu Quiz";
    save();
    render();
    try{
      const channel=new BroadcastChannel("ae-cay-khe-quiz-wallet");
      channel.postMessage({type:"QUIZ_TICKETS_UPDATED",tickets:totalTickets});
      channel.close();
    }catch(e){}
    notify("Đã lưu phiếu Quiz. Đang về website chính...");
   
    const mainUrl=new URL("./index.html",document.baseURI);
    setTimeout(()=>{window.location.assign(mainUrl.href);},700);
  }
  function renderPlots(){
    $("plots").innerHTML="";
    state.plots.forEach((plot,index)=>{
      const button=document.createElement("button");button.className="plot"+(plot&&progress(plot)>=1?" ready":"")+(plot?"":" empty");
      if(!plot){button.innerHTML='<span class="crop">＋</span><small>Ô đất trống</small>';button.addEventListener("click",()=>askBeforeFarmAction("Trồng cây",()=>plant(index)));}
      else{
        const stage=cropStage(plot),seed=seeds[plot.type],remaining=Math.max(0,Math.ceil(seed.seconds*(1-progress(plot))));
        const lifeStage=farmScienceSystem?farmScienceSystem.getStageLabel(progress(plot)):(stage===3?"Đã chín":"Đang lớn");
        const cropStageIcon=(cropIcons[plot.type]||["🌱","🌿","🍃",seed.icon])[stage]||seed.icon;
        button.innerHTML='<span class="crop">'+cropStageIcon+'</span><small>'+seed.name+' · '+(stage===3?"Đã chín":lifeStage+" · "+remaining+" giây")+'</small>';
        button.title=plot.weatherName?"Thời tiết lúc gieo: "+plot.weatherName:"Cây đang phát triển";
        button.addEventListener("click",()=>{if(progress(plot)>=1)askBeforeFarmAction("Thu hoạch cây",()=>harvest(index));else notify("Cây chưa chín đâu! Hãy chờ thêm một chút.");});
      }
      $("plots").appendChild(button);
    });
  }
  function renderSeeds(){
    $("seed-list").innerHTML="";
    Object.keys(seeds).forEach(type=>{
      const seed=seeds[type],locked=!!seed.unlockLevel && state.labLevel<seed.unlockLevel;
      const button=document.createElement("button");
      button.className="seed-option"+(state.selectedSeed===type?" selected":"")+(locked?" locked":"");
      button.disabled=locked;
      button.innerHTML='<span>'+seed.icon+'</span><div><b>'+seed.name+'</b><small>'+(locked?"🔒 Mở ở phòng thí nghiệm cấp "+seed.unlockLevel:"Đang có: "+(state.seeds[type]||0))+'</small></div>';
      button.addEventListener("click",()=>{if(locked)return;askBeforeFarmAction("Chọn hạt giống",()=>{state.selectedSeed=type;save();renderSeeds();});});
      $("seed-list").appendChild(button);
    });
  }

  const makeCatalog=(prefixes,suffixes,icons,count,kind)=>{const out=[];for(let i=0;i<count;i++){out.push({id:kind+'_'+(i+1),name:prefixes[i%prefixes.length]+' '+suffixes[Math.floor(i/prefixes.length)%suffixes.length],icon:icons[i%icons.length],rank:i%20===0?'Huyền thoại':i%5===0?'Hiếm':'Thường',power:5+(i*7)%46,bonus:1+(i*3)%12});}return out;};


  const extraCropSpecies = [
    {name:'Xoài',icon:'🥭'},{name:'Chuối',icon:'🍌'},{name:'Dứa',icon:'🍍'},{name:'Đu đủ',icon:'🍈'},
    {name:'Thanh long',icon:'🐉'},{name:'Dưa hấu',icon:'🍉'},{name:'Dưa lưới',icon:'🍈'},{name:'Dưa gang',icon:'🍈'},
    {name:'Bưởi',icon:'🍊'},{name:'Chanh',icon:'🍋'},{name:'Quýt',icon:'🍊'},{name:'Bơ',icon:'🥑'},
    {name:'Mận',icon:'🍑'},{name:'Đào',icon:'🍑'},{name:'Mơ',icon:'🍑'},{name:'Ổi',icon:'🍐'},
    {name:'Mít',icon:'🍈'},{name:'Sầu riêng',icon:'🌳'},{name:'Măng cụt',icon:'🍇'},{name:'Chôm chôm',icon:'🍒'},
    {name:'Nhãn',icon:'🍒'},{name:'Vải',icon:'🍒'},{name:'Khế',icon:'⭐'},{name:'Mãng cầu',icon:'🍈'},
    {name:'Dâu tằm',icon:'🫐'},{name:'Dừa',icon:'🥥'},{name:'Cóc',icon:'🥭'},{name:'Me',icon:'🫘'},
    {name:'Sim',icon:'🫐'},{name:'Nho',icon:'🍇'},{name:'Cà tím',icon:'🍆'},{name:'Dưa leo',icon:'🥒'},
    {name:'Bí xanh',icon:'🥒'},{name:'Bí đỏ',icon:'🎃'},{name:'Mướp',icon:'🥒'},{name:'Khổ qua',icon:'🥒'},
    {name:'Cà rốt',icon:'🥕'},{name:'Củ cải',icon:'🥕'},{name:'Củ dền',icon:'🫜'},{name:'Khoai lang',icon:'🍠'},
    {name:'Khoai môn',icon:'🥔'},{name:'Khoai tây',icon:'🥔'},{name:'Hành tây',icon:'🧅'},{name:'Tỏi',icon:'🧄'},
    {name:'Gừng',icon:'🫚'},{name:'Nghệ',icon:'🫚'},{name:'Riềng',icon:'🫚'},{name:'Sả',icon:'🌿'},
    {name:'Rau muống',icon:'🥬'},{name:'Cải thìa',icon:'🥬'},{name:'Cải ngọt',icon:'🥬'},{name:'Cải bó xôi',icon:'🥬'},
    {name:'Xà lách',icon:'🥬'},{name:'Rau dền',icon:'🥬'},{name:'Mồng tơi',icon:'🍃'},{name:'Đậu bắp',icon:'🌶️'},
    {name:'Hẹ',icon:'🌿'},{name:'Cần tây',icon:'🥬'},{name:'Bắp cải',icon:'🥬'},{name:'Súp lơ',icon:'🥦'},
    {name:'Lúa nếp',icon:'🌾'},{name:'Lúa tẻ',icon:'🌾'},{name:'Lúa mì',icon:'🌾'},{name:'Yến mạch',icon:'🌾'},
    {name:'Đại mạch',icon:'🌾'},{name:'Kê',icon:'🌾'},{name:'Cao lương',icon:'🌾'},{name:'Ngô nếp',icon:'🌽'},
    {name:'Đậu xanh',icon:'🫘'},{name:'Đậu đỏ',icon:'🫘'},{name:'Đậu đen',icon:'🫘'},{name:'Đậu nành',icon:'🫘'},
    {name:'Đậu phộng',icon:'🥜'},{name:'Đậu Hà Lan',icon:'🫛'},{name:'Đậu đũa',icon:'🫘'},{name:'Mè',icon:'🌱'},
    {name:'Húng quế',icon:'🌿'},{name:'Bạc hà',icon:'🌿'},{name:'Tía tô',icon:'🍃'},{name:'Kinh giới',icon:'🌿'},
    {name:'Rau răm',icon:'🍃'},{name:'Ngò rí',icon:'🌿'},{name:'Thì là',icon:'🌿'},{name:'Hương thảo',icon:'🌿'},
    {name:'Lá lốt',icon:'🍃'},{name:'Ngải cứu',icon:'🌿'},{name:'Nha đam',icon:'🪴'},{name:'Cỏ ngọt',icon:'🌱'},
    {name:'Cà phê',icon:'☕'},{name:'Ca cao',icon:'🍫'},{name:'Chè',icon:'🍵'},{name:'Hồ tiêu',icon:'🫒'},
    {name:'Điều',icon:'🥜'},{name:'Sen',icon:'🪷'},{name:'Súng',icon:'🪷'},{name:'Cúc',icon:'🌼'},
    {name:'Hồng',icon:'🌹'},{name:'Tulip',icon:'🌷'},{name:'Cẩm tú cầu',icon:'💐'},{name:'Hướng dương',icon:'🌻'}
  ];
  const extraCropVariants = ['Ánh Trăng','Cầu Vồng','Pha Lê','Lá Đỏ','Thân Tím','Mini','Khổng Lồ','Sinh Trưởng Nhanh','Chịu Hạn','Ngân Hà'];
  function makeExtraCropCatalog(){
    const out=[];
    extraCropSpecies.forEach((species,speciesIndex)=>{
      extraCropVariants.forEach((variant,variantIndex)=>{
        const index=speciesIndex*extraCropVariants.length+variantIndex;
        out.push({
          id:'crop_'+(141+index),
          name:species.name+' '+variant,
          icon:species.icon,
          rank:index%100===0?'Huyền thoại':index%10===0?'Hiếm':'Thường',
          power:20+(index*11)%81,
          bonus:3+(index*7)%28,
          species:species.name,
          variant:variant
        });
      });
    });
    return out;
  }
  const cropCatalog=makeCatalog(['Cà chua','Dâu','Ớt','Bí','Đậu','Khoai','Ngô','Cải','Hoa','Lúa','Táo','Lê','Nho','Cam'],['đỏ','vàng','tím','xanh','mật ong','pha lê','sao','băng','mặt trời','rừng','sa mạc'],['🍅','🍓','🌶️','🎃','🫘','🥔','🌽','🥬','🌼','🌾','🍎','🍐','🍇','🍊'],140,'crop').concat(makeExtraCropCatalog());
  const researchCatalog=makeCatalog(['Lan','Sen','Cúc','Hồng','Tulip','Phong lan','Dạ yến thảo','Mộc lan','Anh đào','Thược dược'],['biến dị','phát sáng','kháng hạn','siêu sinh trưởng','thích nghi','di truyền','ánh trăng','cầu vồng','bất tử','ngân hà'],['🌸','🪷','🌼','🌹','🌷','💠','🌺','🌻','🌸','💐'],100,'gene');
  const petCatalog=makeCatalog(['Mèo','Chó','Thỏ','Cáo','Gấu trúc','Rái cá','Sóc','Nhím'],['mây','đốm','tuyết','kẹo','lá non'],['🐱','🐶','🐰','🦊','🐼','🦦','🐿️','🦔'],40,'pet');
  const chickenCatalog=makeCatalog(['Gà tre','Gà ri','Gà hồ','Gà ác','Gà lông xù','Gà sao','Gà rừng','Gà vàng'],['mơ','đốm','tuyết','lửa','mây'],['🐓','🐔','🐣','🐤'],40,'chicken');

  (state.unlockedResearchSeeds||[]).forEach(id=>{
    const item=cropCatalog.find(x=>x.id===id);
    if(item){
      const index=Number(item.id.split('_')[1]||1)-1;
      seeds[id]={name:item.name,icon:item.icon,cost:12+(index%8)*2,reward:35+(index%10)*5,seconds:60+(index%6)*15,amount:0,unlockLevel:1,researchSeed:true};
      state.seeds[id]=state.seeds[id]||0;
      cropIcons[id]=["🌱","🌿","🍃",item.icon];
    }
  });
  function unlockResearchSeed(item){
    if(!item || state.unlockedResearchSeeds.includes(item.id))return;
    const index=Number(item.id.split('_')[1]||1)-1;
    const key=item.id;
    state.unlockedResearchSeeds.push(key);
    seeds[key]={name:item.name,icon:item.icon,cost:12+(index%8)*2,reward:35+(index%10)*5,seconds:60+(index%6)*15,amount:0,unlockLevel:1,researchSeed:true};
    state.seeds[key]=state.seeds[key]||0;
    cropIcons[key]=["🌱","🌿","🍃",item.icon];
  }

  function getDailyPlantDateInfo(){
    const parts=new Intl.DateTimeFormat("en-US",{
      timeZone:"Asia/Ho_Chi_Minh",year:"numeric",month:"2-digit",day:"2-digit"
    }).formatToParts(new Date());
    const part=name=>parts.find(x=>x.type===name)?.value||"0";
    const y=Number(part("year")),m=Number(part("month")),d=Number(part("day"));
    const key=y+"-"+String(m).padStart(2,"0")+"-"+String(d).padStart(2,"0");
    const dayNumber=Math.floor(Date.UTC(y,m-1,d)/86400000);

    const nextMidnight=Date.UTC(y,m-1,d+1)-7*60*60*1000;
    return {y,m,d,key,dayNumber,nextMidnight};
  }

  function getDailyPlantSelection(){
    const date=getDailyPlantDateInfo();
    if(!state.dailyPlant)state.dailyPlant={dateKey:"",cropId:"",claimed:false};
    if(state.dailyPlant.dateKey!==date.key){
      const owned=new Set([...(state.collections.crops||[]),...(state.unlockedResearchSeeds||[])]);
      const start=((date.dayNumber*37+13)%cropCatalog.length+cropCatalog.length)%cropCatalog.length;
      let item=null;
      for(let i=0;i<cropCatalog.length;i++){
        const candidate=cropCatalog[(start+i)%cropCatalog.length];
        if(!owned.has(candidate.id)){item=candidate;break;}
      }
      state.dailyPlant={dateKey:date.key,cropId:item?item.id:"",claimed:false};
      save();
    }
    const item=cropCatalog.find(x=>x.id===state.dailyPlant.cropId)||null;
    const alreadyOwned=!!(item&&((state.collections.crops||[]).includes(item.id)||(state.unlockedResearchSeeds||[]).includes(item.id)));
    if(alreadyOwned&&!state.dailyPlant.claimed){
      state.dailyPlant.claimed=true;
      save();
    }
    return {date,item,claimed:!!state.dailyPlant.claimed||alreadyOwned};
  }

  function unlockDailyPlant(id,dateKey){
    const daily=getDailyPlantSelection();
    if(daily.date.key!==dateKey||!daily.item||daily.item.id!==id){
      notify("Cây mới đã đổi sang ngày mới. Hãy xem giống cây hôm nay nhé!");
      renderDailyPlant();
      return;
    }
    if(daily.claimed){notify("Giống cây hôm nay đã được mở khóa rồi!");return;}
    if((state.researchPoints||0)<5){notify("Bạn cần 5 điểm bé ngoan để mở khóa cây mới hôm nay.");return;}

    const item=daily.item;
    state.researchPoints-=5;
    state.collections.crops=state.collections.crops||[];
    if(!state.collections.crops.includes(item.id))state.collections.crops.push(item.id);
    unlockResearchSeed(item);
    state.seeds[item.id]=(state.seeds[item.id]||0)+1;
    state.dailyPlant.claimed=true;
    trackSeasonalEventAction("research",item.id,1);
    state.lastAction="Mở khóa cây mới hôm nay: "+item.name;
    save();
    render();
    renderCollection();
    renderEvolutionLab();
    notify("🌱 Đã mở khóa vĩnh viễn "+item.name+" và nhận 1 hạt giống vào túi đồ!");
  }

  function renderDailyPlant(){
    const host=$("daily-plant-panel");
    if(!host)return;
    const daily=getDailyPlantSelection(),item=daily.item;
    const remaining=Math.max(0,daily.date.nextMidnight-Date.now());
    const hh=String(Math.floor(remaining/3600000)).padStart(2,"0");
    const mm=String(Math.floor((remaining%3600000)/60000)).padStart(2,"0");
    const ss=String(Math.floor((remaining%60000)/1000)).padStart(2,"0");

    if(!item){
      host.innerHTML='<div class="daily-plant-head"><span class="daily-plant-icon">🏆</span><div><p class="daily-plant-kicker">BỘ SƯU TẬP HẰNG NGÀY</p><h3>Đã khám phá toàn bộ cây trồng</h3><p>Bạn đã mở khóa đủ '+cropCatalog.length+' giống trong bộ sưu tập hiện tại.</p></div></div><small class="daily-plant-countdown">Kiểm tra lại vào ngày mai: <b id="daily-plant-countdown-value">'+hh+':'+mm+':'+ss+'</b></small>';
      return;
    }

    const status=daily.claimed
      ?'<span class="daily-plant-owned">✓ Đã mở khóa hôm nay</span>'
      :'<span class="daily-plant-cost">🔬 5 điểm bé ngoan</span>';
    const button=daily.claimed
      ?'<button type="button" class="daily-plant-button" disabled>Đã sở hữu</button>'
      :'<button type="button" class="daily-plant-button" id="unlock-daily-plant">Mở khóa cây hôm nay</button>';
    host.innerHTML='<div class="daily-plant-head"><span class="daily-plant-icon">'+item.icon+'</span><div class="daily-plant-info"><p class="daily-plant-kicker">🌱 CÂY MỚI HÔM NAY</p><h3>'+item.name+'</h3><p>Giống cây nổi bật trong ngày · '+item.rank+' · Thu hoạch nhận '+(35+(Number(item.id.split("_")[1]||1)-1)%10*5)+' xu.</p>'+status+'</div></div><div class="daily-plant-bottom"><small class="daily-plant-countdown">Giống tiếp theo sau <b id="daily-plant-countdown-value">'+hh+':'+mm+':'+ss+'</b> · Mở khóa sẽ giữ vĩnh viễn.</small>'+button+'</div>';
    const buttonEl=$("unlock-daily-plant");
    if(buttonEl)buttonEl.addEventListener("click",()=>askBeforeFarmAction("Mở khóa cây mới hôm nay",()=>unlockDailyPlant(item.id,daily.date.key)));
  }

  function updateDailyPlantClock(){
    const date=getDailyPlantDateInfo();
    if(!state.dailyPlant||state.dailyPlant.dateKey!==date.key){
      renderDailyPlant();
      return;
    }
    const timer=$("daily-plant-countdown-value");
    if(!timer)return;
    const remaining=Math.max(0,date.nextMidnight-Date.now());
    const hh=String(Math.floor(remaining/3600000)).padStart(2,"0");
    const mm=String(Math.floor((remaining%3600000)/60000)).padStart(2,"0");
    const ss=String(Math.floor((remaining%60000)/1000)).padStart(2,"0");
    timer.textContent=hh+":"+mm+":"+ss;
  }

  function renderResearchSeedShop(){
    const host=$("research-seed-shop");if(!host)return;
    const unlocked=(state.unlockedResearchSeeds||[]).filter(id=>seeds[id]);
    host.innerHTML=unlocked.map(id=>{
      const seed=seeds[id];
      return '<article class="shop-card panel research-seed-card"><div class="shop-art">'+seed.icon+'</div><h3>'+seed.name+'</h3><p>Giống đã được khám phá trong phòng thí nghiệm. Thu hoạch nhận '+seed.reward+' xu.</p><div class="shop-bottom"><b>'+seed.cost+' xu</b><button class="primary" data-research-buy="'+id+'">Mua hạt</button></div><small class="hint">Trong túi: '+(state.seeds[id]||0)+'</small></article>';
    }).join("")||'<div class="panel research-empty">🔒 Chưa có giống bé ngoan nào được mở khóa. Hãy vào phòng thí nghiệm và chọn “Mở giống cây”.</div>';
    host.querySelectorAll('[data-research-buy]').forEach(btn=>btn.addEventListener('click',()=>askBeforeFarmAction('Mua hạt giống bé ngoan',()=>buySeed(btn.dataset.researchBuy))));
  }
  function rollPetVariant(){
    const r=Math.random();
    if(r<0.02)return {id:"galaxy",name:"Galaxy",bonus:20};
    if(r<0.10)return {id:"golden",name:"Golden",bonus:12};
    if(r<0.30)return {id:"shiny",name:"Shiny",bonus:6};
    return {id:"normal",name:"Thường",bonus:0};
  }
  function discover(kind,cost,catalog){if((state.researchPoints||0)<cost){notify('Chưa đủ điểm bé ngoan!');return;}const owned=state.collections[kind]||[];const available=catalog.filter(x=>!owned.includes(x.id));if(!available.length){notify('Bạn đã sưu tầm đủ bộ này rồi!');return;}state.researchPoints-=cost;const item=available[Math.floor(Math.random()*available.length)];owned.push(item.id);state.collections[kind]=owned;if(kind==='crops'||kind==='research')trackSeasonalEventAction("research",item.id,1);if(kind==='crops'||kind==='research')recordMucAction("research",1);if(kind==='crops'){unlockResearchSeed(item);if(state.story&&state.story.chapter2MucDone&&!state.story.chapter2ResearchDone){state.story.chapter2ResearchDone=true;state.coins+=15;state.researchPoints+=5;state.lastAction='Hoàn thành Chương 2: +15 xu, +5 điểm bé ngoan';}}if(kind==='pets'){state.activePet=item.id;const variant=rollPetVariant();state.pet={...state.pet,name:item.name,icon:item.icon,variant:variant.id,variantName:variant.name,bonus:variant.bonus};}if(kind==='chickens'){state.activeChicken=item.id;}save();render();renderCollection();renderEvolutionLab();$('collection-result').textContent=item.icon+' '+item.name+' · '+item.rank+' · Chỉ số '+item.power+' · Thưởng '+item.bonus+(kind==='pets'?' · '+state.pet.variantName:'');notify('Đã mở khóa '+item.name+(kind==='pets'?' · '+state.pet.variantName:'')+'!');}
  function renderCollection(){const groups=[['crops',cropCatalog],['research',researchCatalog],['pets',petCatalog],['chickens',chickenCatalog]];groups.forEach(([key,list])=>{const el=$('count-'+key);if(el)el.textContent=(state.collections[key]||[]).length+'/'+list.length;});const all=[...cropCatalog.map(x=>({...x,group:'Cây trồng',key:'crops'})),...researchCatalog.map(x=>({...x,group:'Cây bé ngoan',key:'research'})),...petCatalog.map(x=>({...x,group:'Pet',key:'pets'})),...chickenCatalog.map(x=>({...x,group:'Giống gà',key:'chickens'}))];$('collection-book').innerHTML=all.filter(x=>(state.collections[x.key]||[]).includes(x.id)).map(x=>'<div class="collection-entry">'+x.icon+' <b>'+x.name+'</b><small>'+x.group+' · '+x.rank+' · Chỉ số '+x.power+' · Bonus '+x.bonus+'</small></div>').join('')||'Chưa có mục sưu tầm nào.';}
  $('collect-crop').addEventListener('click',()=>askBeforeFarmAction('Mở khóa giống cây',()=>discover('crops',5,cropCatalog)));
  $('research-crop').addEventListener('click',()=>askBeforeFarmAction('bé ngoan cây trồng',()=>discover('research',5,researchCatalog)));
  $('hatch-pet').addEventListener('click',()=>askBeforeFarmAction('Khám phá pet',()=>discover('pets',10,petCatalog)));
  $('hatch-chicken').addEventListener('click',()=>askBeforeFarmAction('Khám phá giống gà',()=>discover('chickens',10,chickenCatalog)));

  function renderEvolutionLab(){
    const points=state.researchPoints||0;
    const level=state.labLevel||1;
    const next=level>=5?30:30-(points%30);
    const progress=level>=5?100:(points%30)/30*100;
    $("lab-level").textContent=level;
    $("lab-points").textContent=points;
    $("lab-harvests").textContent=state.harvests;
    $("lab-bonus-seeds").textContent=state.bonusSeeds||0;
    $("lab-next").textContent=level>=5?"Đã đạt cấp tối đa":"Còn "+next+" điểm bé ngoan để lên cấp";
    $("lab-progress").style.width=progress+"%";
    $("lab-unlocks").textContent=level>=4?"Đã mở khóa toàn bộ giống đặc biệt":level>=2?"Đã mở Việt quất · Cần cấp 4 để mở Hoa ánh trăng":"Cấp 2 mở Việt quất · Cấp 4 mở Hoa ánh trăng";
  }
  function renderBreeding(){
    const a=$("breed-parent-a"), b=$("breed-parent-b");
    const available=Object.keys(seeds).filter(k=>(state.seeds[k]||0)>0);
    [a,b].forEach(sel=>{
      const old=sel.value;
      sel.innerHTML=available.map(k=>'<option value="'+k+'">'+seeds[k].icon+' '+seeds[k].name+' (còn '+state.seeds[k]+')</option>').join("");
      if(available.includes(old))sel.value=old;
    });
    $("hybrid-book").innerHTML=Object.entries(state.hybrids||{}).map(([id,h])=>'<div class="collection-entry">'+h.icon+' <b>'+h.name+'</b><small>'+h.parents+' · '+h.seconds+' giây · '+h.reward+' xu</small></div>').join("")||"Chưa khám phá giống lai.";
  }
  function breedPlants(){
    const a=$("breed-parent-a").value, b=$("breed-parent-b").value;
    if(!a||!b){notify("Bạn cần có ít nhất một loại hạt giống để lai.");return;}
    if(a===b && (state.seeds[a]||0)<2){notify("Lai cùng một giống cần 2 hạt giống.");return;}
    if((state.seeds[a]||0)<1||(state.seeds[b]||0)<1){notify("Không đủ hạt giống bố mẹ.");return;}
    if(state.coins<10){notify("Cần 10 xu cho chi phí bé ngoan lai tạo.");return;}
    state.coins-=10;state.totalSpent+=10;state.seeds[a]--;state.seeds[b]--;
    const key=[a,b].sort().join("_");
    if(!state.hybrids[key]){
      const names={sunflower:"Hướng dương",carrot:"Cà rốt",strawberry:"Dâu tây",blueberry:"Việt quất",moonflower:"Hoa ánh trăng"};
      const icons={sunflower:"🌻",carrot:"🥕",strawberry:"🍓",blueberry:"🫐",moonflower:"🌙"};
      const iconSet=["🌺","🍀","🌼","🍇","🍒","🌷"];
      const hybrid={name:names[a]+" lai "+names[b],icon:iconSet[Object.keys(state.hybrids).length%iconSet.length],parents:names[a]+" × "+names[b],seconds:Math.max(35,Math.round((seeds[a].seconds+seeds[b].seconds)/2)),reward:Math.round((seeds[a].reward+seeds[b].reward)/2)+15};
      state.hybrids[key]=hybrid;
      seeds[key]={name:hybrid.name,icon:hybrid.icon,cost:0,reward:hybrid.reward,seconds:hybrid.seconds,amount:0};
      state.seeds[key]=(state.seeds[key]||0)+2;
      cropIcons[key]=["🌱","🌿","🍃",hybrid.icon];
      state.researchPoints=(state.researchPoints||0)+5;
      $("breed-result").textContent="🎉 Khám phá giống mới: "+hybrid.icon+" "+hybrid.name+"! Nhận 2 hạt giống lai và +5 điểm bé ngoan.";
    }else{
      state.seeds[key]=(state.seeds[key]||0)+2;
      $("breed-result").textContent="Đã lai lại thành công! Nhận thêm 2 hạt giống "+state.hybrids[key].name+".";
    }
    state.labLevel=Math.min(5,Math.max(1,1+Math.floor(state.researchPoints/30)));
    trackSeasonalEventAction("breed",null,1);
    save();render();renderBreeding();notify("Lai tạo thành công!");
  }
  function renderDelivery(){
    const select=$("delivery-crop");
    const stocked=Object.keys(state.produce||{}).filter(k=>state.produce[k]>0);
    select.innerHTML=stocked.map(k=>'<option value="'+k+'">'+seeds[k].icon+' '+seeds[k].name+' (kho: '+state.produce[k]+')</option>').join("")||'<option value="">Chưa có nông sản</option>';
    $("produce-total").textContent=Object.values(state.produce||{}).reduce((x,y)=>x+y,0);
    $("delivery-total").textContent=state.deliveryCount||0;
    $("delivery-history").innerHTML=(state.deliveryHistory||[]).slice(-8).reverse().map(x=>'<div class="collection-entry">🚚 <b>'+x.crop+'</b><small>'+x.district+' · '+x.amount+' sản phẩm · +'+x.coins+' xu</small></div>').join("")||"Chưa có chuyến giao hàng.";
  }
  function deliverProduce(){
    const type=$("delivery-crop").value, district=$("delivery-district").value;
    const amount=Math.max(1,Math.min(5,Math.floor(Number($("delivery-amount").value)||1)));
    if(!type||!seeds[type]){notify("Bạn chưa có nông sản để giao.");return;}
    if((state.produce[type]||0)<amount){notify("Kho không đủ số lượng để giao đơn này.");return;}
    const marketFactor=farmScienceSystem?farmScienceSystem.getMarketFactor(type):1;
    const reward=Math.floor(amount*(seeds[type].reward+8)*marketFactor);
    state.produce[type]-=amount;state.coins+=reward;state.researchPoints=(state.researchPoints||0)+amount*2;
    state.deliveryCount=(state.deliveryCount||0)+1;
    state.deliveryHistory=state.deliveryHistory||[];
    state.deliveryHistory.push({crop:seeds[type].name,district,amount,coins:reward});
    trackSeasonalEventAction("deliver",type,amount);
    recordMucAction("deliver",1);
    state.labLevel=Math.min(5,Math.max(1,1+Math.floor(state.researchPoints/30)));
    $("delivery-result").textContent="✅ Đã giao "+amount+" "+seeds[type].name+" đến "+district+". Nhận +"+reward+" xu và +"+(amount*2)+" điểm bé ngoan.";
    save();render();renderDelivery();notify("Giao hàng thành công!");
  }

  function renderInventory(){
    const seedItems=Object.keys(seeds).map(k=>({icon:seeds[k].icon,name:"Hạt giống: "+seeds[k].name,count:state.seeds[k]||0,kind:"seed"}));
    const produceItems=Object.keys(state.produce||{}).filter(k=>seeds[k]&&(state.produce[k]||0)>0).map(k=>({icon:seeds[k].icon,name:"Nông sản: "+seeds[k].name,count:state.produce[k],kind:"produce"}));
    const ag=state.agriculture||defaultState.agriculture,livestock=ag.livestock||{},inv=ag.inventory||{},beneficial=ag.beneficial||{},animalProducts=livestock.products||{};
    const farmItems=[
      {icon:"💧",name:"Bình nước",count:state.waterBottles||0},
      {icon:"🌿",name:"Phân ủ hữu cơ",count:inv.compost||0},
      {icon:"🧴",name:"Chế phẩm sinh học",count:inv.organicSpray||0},
      {icon:"🌾",name:"Thức ăn vật nuôi",count:inv.feed||0},
      {icon:"🐞",name:"Bọ rùa thiên địch",count:beneficial.ladybugs||0},
      {icon:"🐝",name:"Ong có ích",count:beneficial.bees||0},
      {icon:"🥚",name:"Trứng gà",count:animalProducts.eggs||0},
      {icon:"🥛",name:"Sữa tươi",count:animalProducts.milk||0},
      {icon:"💩",name:"Phân chuồng",count:animalProducts.manure||0},
      {icon:"🎟️",name:"Phiếu Quiz",count:quizTickets()},
      {icon:"🪙",name:"Xu vườn",count:state.coins}
    ];
    $("inventory-grid").innerHTML='<div class="inventory-group-title">🌱 HẠT GIỐNG TRONG TÚI</div>'+seedItems.map(x=>'<div class="inventory-item seed-in-bag"><span>'+x.icon+'</span><b>'+x.name+'</b><small>Số lượng: <strong>'+x.count+'</strong></small></div>').join("")+'<div class="inventory-group-title">📦 NÔNG SẢN & VẬT PHẨM</div>'+produceItems.map(x=>'<div class="inventory-item"><span>'+x.icon+'</span><b>'+x.name+'</b><small>Số lượng: <strong>'+x.count+'</strong></small></div>').join("")+'<div class="inventory-group-title">🧪 VẬT TƯ NÔNG NGHIỆP & CHĂN NUÔI</div>'+farmItems.map(x=>'<div class="inventory-item"><span>'+x.icon+'</span><b>'+x.name+'</b><small>Số lượng: <strong>'+x.count+'</strong></small></div>').join("");
  }
  const mucStoryChapters = [
    {title:"Nhìn nhận để sửa đổi",skill:"Tự nhận thức và tự phê bình",lesson:"Muốn tiến bộ, trước hết cần thành thật nhìn nhận điều mình làm chưa tốt.",dialogue:"Chào người chăm vườn! Một người làm việc tốt có cần nhìn nhận những khuyết điểm của mình không?",question:"Một người làm việc tốt có cần nhìn nhận những khuyết điểm của mình không?",answers:["Có, để nhận ra sai sót và sửa đổi.","Không, chỉ cần quan tâm đến kết quả.","Không cần học hỏi thêm."],correct:0,why:"Nhận ra hạn chế là bước đầu để sửa chữa và tiến bộ.",action:"plant",target:1,task:"Gieo ít nhất 1 hạt giống sau khi nhận nhiệm vụ.",reward:[20,10]},
    {title:"Học đi đôi với hành",skill:"Vận dụng kiến thức vào thực tế",lesson:"Kiến thức chỉ phát huy giá trị khi được áp dụng vào công việc cụ thể.",dialogue:"Đọc sách là quan trọng, nhưng chỉ đọc mà không thực hành thì đã đủ chưa?",question:"Cách học nào giúp kiến thức trở nên thiết thực?",answers:["Chỉ học thuộc câu chữ.","Kết hợp tìm hiểu, thực hành và rút kinh nghiệm.","Chỉ nghe người khác kể."],correct:1,why:"Học cần gắn với thực hành để hiểu sâu và tạo kết quả thực tế.",action:"harvest",target:1,task:"Thu hoạch ít nhất 1 cây trong vườn.",reward:[25,10]},
    {title:"Lập kế hoạch trước khi làm",skill:"Quản lý thời gian và công việc",lesson:"Việc có mục tiêu, thứ tự ưu tiên và thời hạn rõ ràng sẽ dễ thực hiện hơn.",dialogue:"Một khu vườn muốn phát triển cần có kế hoạch. Trước khi làm, ta nên chuẩn bị điều gì?",question:"Một kế hoạch công việc tốt cần có những nội dung nào?",answers:["Mục tiêu, việc cần làm, thời hạn và người phụ trách.","Chỉ cần nghĩ trong đầu.","Làm việc nào thấy thích trước."],correct:0,why:"Kế hoạch rõ ràng giúp phân công, theo dõi tiến độ và kiểm tra kết quả.",action:"plant",target:2,task:"Gieo thêm ít nhất 2 hạt giống để thực hiện kế hoạch.",reward:[30,12]},
    {title:"Tinh thần trách nhiệm",skill:"Chủ động và chịu trách nhiệm",lesson:"Đã nhận việc thì cần cố gắng hoàn thành, báo cáo trung thực khi gặp khó khăn.",dialogue:"Nếu đã nhận chăm sóc luống cây, người làm vườn nên làm gì khi gặp khó khăn?",question:"Hành động nào thể hiện tinh thần trách nhiệm?",answers:["Bỏ qua và chờ người khác.","Che giấu vấn đề.","Chủ động xử lý, báo cáo khó khăn và theo dõi kết quả."],correct:2,why:"Trách nhiệm thể hiện ở việc chủ động thực hiện và trung thực với kết quả.",action:"water",target:1,task:"Tưới ít nhất một cây đang cần nước.",reward:[30,12]},
    {title:"Đoàn kết và phối hợp",skill:"Làm việc nhóm",lesson:"Cùng trao đổi, phân công rõ và hỗ trợ nhau sẽ giúp hoàn thành mục tiêu chung.",dialogue:"Khu vườn có nhiều việc. Làm thế nào để mọi người cùng hoàn thành tốt?",question:"Cách phối hợp nào phù hợp trong một nhóm?",answers:["Phân công rõ ràng, lắng nghe và hỗ trợ nhau.","Một người làm tất cả.","Không chia sẻ thông tin."],correct:0,why:"Phối hợp hiệu quả cần phân công, trao đổi và tôn trọng đóng góp của nhau.",action:"play",target:1,task:"Chơi và tăng gắn kết với thú cưng một lần.",reward:[35,12]},
    {title:"Lắng nghe và góp ý xây dựng",skill:"Giao tiếp và phản hồi",lesson:"Góp ý cần chân thành, có căn cứ, tập trung vào việc cần sửa chứ không công kích cá nhân.",dialogue:"Một người bạn góp ý rằng cách chăm cây của bạn chưa hợp lý. Bạn nên phản ứng thế nào?",question:"Khi nhận góp ý trái với ý kiến của mình, nên làm gì?",answers:["Bác bỏ ngay.","Lắng nghe, xem xét căn cứ rồi trao đổi bình tĩnh.","Ngừng hợp tác."],correct:1,why:"Lắng nghe và kiểm tra căn cứ giúp tiếp nhận điều đúng và phản hồi có trách nhiệm.",action:"bookCorrect",target:1,task:"Trả lời đúng thêm 1 câu hỏi sách trong thao tác nông trại.",reward:[35,15]},
    {title:"Nói và viết rõ ràng",skill:"Trình bày và báo cáo",lesson:"Thông tin nên ngắn gọn, đúng trọng tâm, trung thực và phù hợp với người nghe.",dialogue:"Mực muốn bạn viết một bản báo cáo về khu vườn. Điều gì cần được ưu tiên?",question:"Cách báo cáo nào rõ ràng và thiết thực?",answers:["Kể nhiều chuyện ngoài lề.","Chỉ nêu thành tích.","Nêu đúng việc đã làm, kết quả và vấn đề còn tồn tại."],correct:2,why:"Báo cáo tốt cần phản ánh đúng thực tế, cả kết quả lẫn điểm cần cải thiện.",action:"deliver",target:1,task:"Giao ít nhất một chuyến nông sản đến khu phố.",reward:[40,15]},
    {title:"Kiểm tra và rút kinh nghiệm",skill:"Tự đánh giá và cải tiến",lesson:"Sau mỗi công việc, cần đối chiếu kết quả với mục tiêu để biết điều gì hiệu quả và điều gì cần sửa.",dialogue:"Một luống cây đã thu hoạch. Làm sao biết cách chăm sóc vừa rồi có hiệu quả?",question:"Vì sao cần kiểm tra kết quả sau khi hoàn thành công việc?",answers:["Để kéo dài công việc.","Để đối chiếu mục tiêu, phát hiện thiếu sót và rút kinh nghiệm.","Để tìm người trách phạt."],correct:1,why:"Kiểm tra giúp đánh giá kết quả thực tế và điều chỉnh cách làm cho lần sau.",action:"harvest",target:3,task:"Thu hoạch tổng cộng ít nhất 3 cây.",reward:[45,15]},
    {title:"Chống chủ quan và hẹp hòi",skill:"Tư duy khách quan và tôn trọng tập thể",lesson:"Cần dựa trên thực tế, lắng nghe nhiều phía và đặt mục tiêu chung lên trên lợi ích riêng.",dialogue:"Mực tìm thấy hai bản nhận xét khác nhau. Bạn cần làm gì trước khi kết luận?",question:"Cách nào giúp tránh đánh giá chủ quan?",answers:["Chỉ tin điều mình nghĩ.","Kết luận theo lời đồn.","Kiểm tra sự việc, lắng nghe nhiều phía và xem xét bằng chứng."],correct:2,why:"Đánh giá khách quan cần căn cứ thực tế, không dựa vào cảm tính hay tin đồn.",action:"research",target:1,task:"Khám phá ít nhất một giống cây trong phòng thí nghiệm.",reward:[50,18]},
    {title:"Biến tri thức thành hành động",skill:"Tổng kết và cam kết cải thiện",lesson:"Sửa đổi không dừng ở lời hứa; cần biến điều đã học thành hành động đều đặn và có kiểm tra.",dialogue:"Đây là trang cuối của hành trình. Bạn đã học được cách nhận lỗi, lập kế hoạch và phối hợp. Bây giờ hãy chứng minh bằng hành động nhé!",question:"Điều quan trọng nhất khi vận dụng bài học sửa đổi vào cuộc sống là gì?",answers:["Chỉ ghi nhớ khẩu hiệu.","Biến điều đã học thành việc làm cụ thể, kiên trì kiểm tra và cải thiện.","Chờ người khác thay đổi trước."],correct:1,why:"Giá trị của tri thức thể hiện ở hành động cụ thể, liên tục tự xem xét và hoàn thiện.",action:"deliver",target:2,task:"Hoàn thành thêm 2 chuyến giao hàng nông sản.",reward:[100,30]}
  ];

  function getMucSaga(){
    if(!state.story)state.story={};
    if(!state.story.mucSaga)state.story.mucSaga={chapter:1,accepted:false,questionPassed:false,progress:0,completed:[]};
    const saga=state.story.mucSaga;
    saga.chapter=Math.min(10,Math.max(1,Number(saga.chapter)||1));
    saga.progress=Math.max(0,Number(saga.progress)||0);
    if(!Array.isArray(saga.completed))saga.completed=[];
    return saga;
  }
  function currentMucChapter(){return mucStoryChapters[getMucSaga().chapter-1];}
  function startMucQuest(){
    const saga=getMucSaga();
    if(saga.completed.includes(saga.chapter)){notify("Chương này đã hoàn thành. Hãy nhận chương tiếp theo nhé!");return;}
    saga.accepted=true;
    saga.questionPassed=false;
    saga.progress=0;
    save();renderStory();
    notify("Mực đã giao nhiệm vụ Chương "+saga.chapter+"!");
  }
  function answerMucQuest(answer){
    const saga=getMucSaga(),chapter=currentMucChapter();
    if(!saga.accepted||saga.completed.includes(saga.chapter)||saga.questionPassed)return;
    if(Number(answer)!==chapter.correct){
      $("muc-feedback").textContent="Chưa chính xác. Mực giải thích: "+chapter.why+" Hãy đọc lại rồi thử lần nữa nhé!";
      return;
    }
    saga.questionPassed=true;
    $("muc-feedback").textContent="✅ Chính xác! "+chapter.why+" Bây giờ hãy thực hiện nhiệm vụ thực tế: "+chapter.task;
    save();checkMucChapterCompletion();renderStory();
  }
  function recordMucAction(action,count=1){
    const saga=getMucSaga(),chapter=currentMucChapter();
    if(!saga.accepted||!saga.questionPassed||saga.completed.includes(saga.chapter)||chapter.action!==action)return;
    saga.progress=Math.min(chapter.target,saga.progress+Math.max(1,Number(count)||1));
    checkMucChapterCompletion();
  }
  function checkMucChapterCompletion(){
    const saga=getMucSaga(),chapter=currentMucChapter();
    if(!saga.accepted||!saga.questionPassed||saga.progress<chapter.target||saga.completed.includes(saga.chapter))return;
    saga.completed.push(saga.chapter);
    state.coins=(Number(state.coins)||0)+chapter.reward[0];
    state.researchPoints=(Number(state.researchPoints)||0)+chapter.reward[1];
    state.labLevel=Math.min(5,Math.max(1,1+Math.floor(state.researchPoints/30)));
    state.lastAction="Hoàn thành Chương "+saga.chapter+": +"+chapter.reward[0]+" xu, +"+chapter.reward[1]+" điểm nghiên cứu";
    save();
    notify("Hoàn thành Chương "+saga.chapter+" – "+chapter.title+"! Nhận +"+chapter.reward[0]+" xu và +"+chapter.reward[1]+" điểm nghiên cứu.");
    render();
  }
  function advanceMucChapter(){
    const saga=getMucSaga();
    if(!saga.completed.includes(saga.chapter)){notify("Bạn cần hoàn thành chương hiện tại trước.");return;}
    if(saga.chapter>=10){notify("Bạn đã hoàn thành toàn bộ 10 chương của Mực!");return;}
    saga.chapter++;
    saga.accepted=false;saga.questionPassed=false;saga.progress=0;
    save();renderStory();notify("Mực đã mở Chương "+saga.chapter+"!");
  }
  function renderStory(){
    const saga=getMucSaga(),chapter=currentMucChapter();
    const badge=$("muc-story-badge"),progress=$("chapter2-progress"),dialogue=$("muc-dialogue"),questionBox=$("muc-story-question"),answers=$("muc-answer-area"),start=$("muc-start-area"),next=$("muc-next-chapter"),feedback=$("muc-feedback"),task=$("muc-story-task"),chapters=$("muc-chapter-list"),finale=$("muc-story-finale");
    if(!badge||!progress||!dialogue||!questionBox||!answers||!start||!next||!feedback||!task||!chapters)return;
    const done=saga.completed.includes(saga.chapter);
    badge.textContent="📖 CHƯƠNG "+saga.chapter+" / 10";
    progress.textContent=saga.completed.length+"/10 chương hoàn thành";
    dialogue.textContent=done?(saga.chapter===10?"Bạn đã hoàn thành hành trình! Cây Tri Thức đã hồi sinh. Hãy tiếp tục vận dụng những kỹ năng đã học mỗi ngày.":"Tốt lắm! Chương này đã hoàn thành. Khi sẵn sàng, hãy nhận thử thách tiếp theo nhé."):chapter.dialogue;
    questionBox.innerHTML='<b>Câu hỏi của Mực:</b> '+chapter.question+'<br><small>Chủ đề kỹ năng: '+chapter.skill+'</small>';
    answers.innerHTML=chapter.answers.map((a,i)=>'<button class="story-answer" type="button" data-muc-answer="'+i+'" '+(saga.questionPassed||done?'disabled':'')+'>'+String.fromCharCode(65+i)+'. '+a+'</button>').join("");
    answers.hidden=!saga.accepted||saga.questionPassed||done;
    start.hidden=saga.accepted||done;
    next.hidden=!done||saga.chapter===10;
    if(finale)finale.hidden=!(saga.chapter===10&&done);
    next.textContent="📖 Nhận Chương tiếp theo →";
    task.textContent=done?"✅ Đã hoàn thành nhiệm vụ thực tế.":saga.questionPassed?"Nhiệm vụ thực tế: "+chapter.task+" · Tiến độ "+saga.progress+"/"+chapter.target: "Kỹ năng trọng tâm: "+chapter.skill+". Trả lời câu hỏi để mở nhiệm vụ thực tế.";
    if(done)feedback.textContent="🏅 Chương "+saga.chapter+" hoàn thành! "+chapter.lesson+" Phần thưởng: +"+chapter.reward[0]+" xu, +"+chapter.reward[1]+" điểm nghiên cứu.";
    else if(saga.questionPassed)feedback.textContent="Đúng rồi! "+chapter.why+" Hãy hoàn thành mục tiêu để nhận dấu ấn chương.";
    else if(saga.accepted)feedback.textContent="Hãy chọn câu trả lời phù hợp. Trả lời sai không bị trừ xu hay điểm.";
    else feedback.textContent="Nhận nhiệm vụ từ Mực, trả lời câu hỏi và áp dụng bài học vào hoạt động nông trại.";
    chapters.innerHTML=mucStoryChapters.map((item,i)=>'<div class="muc-chapter-item '+(saga.completed.includes(i+1)?'done':i+1===saga.chapter?'current':'')+'"><b>'+(saga.completed.includes(i+1)?'✅':i+1===saga.chapter?'📖':'🔒')+' Chương '+(i+1)+': '+item.title+'</b><small>'+item.skill+'</small></div>').join("");
  }
  $("muc-start-quest").addEventListener("click",startMucQuest);
  $("muc-answer-area").addEventListener("click",event=>{const btn=event.target.closest("[data-muc-answer]");if(btn)answerMucQuest(btn.dataset.mucAnswer);});
  $("muc-next-chapter").addEventListener("click",advanceMucChapter);

  const dailyTaskDefinitions={plant:{label:"Gieo một hạt giống",reward:5},water:{label:"Chăm sóc khu vườn",reward:5},play:{label:"Kết bạn với thú cưng",reward:5},harvest:{label:"Thu hoạch thành quả",reward:10}};
  function ensureDailyMissions(){
    const today=getDailyPlantDateInfo().key;
    if(!state.dailyMissions)state.dailyMissions={dateKey:"",progress:{},claimed:{}};
    if(state.dailyMissions.dateKey!==today){
      state.dailyMissions={dateKey:today,progress:{plant:false,water:false,play:false,harvest:false},claimed:{}};
      save();
    }
    return state.dailyMissions;
  }
  function markDailyMission(key){
    const daily=ensureDailyMissions();
    if(daily.progress[key]!==true){daily.progress[key]=true;save();}
  }
  function claimTask(task){
    const daily=ensureDailyMissions(),definition=dailyTaskDefinitions[task];
    if(!definition)return;
    if(!daily.progress[task]){notify("Bạn chưa hoàn thành nhiệm vụ này.");return;}
    if(daily.claimed[task]){notify("Nhiệm vụ hôm nay đã nhận thưởng rồi.");return;}
    daily.claimed[task]=true;state.coins+=definition.reward;save();render();notify("Hoàn thành nhiệm vụ! +"+definition.reward+" xu.");
  }

  function renderTasks(){
    const daily=ensureDailyMissions();
    document.querySelectorAll(".task-btn").forEach(btn=>{
      const key=btn.dataset.task,claimed=!!daily.claimed[key],done=!!daily.progress[key],reward=dailyTaskDefinitions[key]?.reward||0;
      btn.disabled=!done||claimed;btn.textContent=claimed?"Đã nhận":done?"Nhận "+reward+" xu":"Chưa hoàn thành";
    });
    const dateEl=$("daily-task-date");if(dateEl)dateEl.textContent="Nhiệm vụ ngày "+daily.dateKey+" · Làm mới lúc 00:00 giờ Việt Nam";
    updateDailyTaskClock();
  }
  function updateDailyTaskClock(){
    const previousKey=state.dailyMissions&&state.dailyMissions.dateKey;
    const daily=ensureDailyMissions();
    if(previousKey&&previousKey!==daily.dateKey){renderTasks();return;}
    const timer=$("daily-task-countdown");if(!timer)return;
    const remaining=Math.max(0,getDailyPlantDateInfo().nextMidnight-Date.now());
    const hh=String(Math.floor(remaining/3600000)).padStart(2,"0");
    const mm=String(Math.floor((remaining%3600000)/60000)).padStart(2,"0");
    const ss=String(Math.floor((remaining%60000)/1000)).padStart(2,"0");
    timer.textContent=hh+":"+mm+":"+ss;
  }
  function render(){
    $("coin-count").textContent=state.coins;$("level").textContent=state.level;$("harvest-total").textContent=state.harvests;
    $("pet-bond").textContent=state.pet.bond;$("hero-pet").textContent=state.pet.icon;$("big-pet").textContent=state.pet.icon;$("pet-name").textContent=state.pet.name;
    $("hunger-label").textContent=state.pet.hunger+"/100";$("bond-label").textContent=state.pet.bond+"/100";
    const petStage=$("big-pet").parentElement;petStage.classList.remove("pet-shiny","pet-golden","pet-galaxy");
    if(state.pet.variant==="shiny")petStage.classList.add("pet-shiny");
    if(state.pet.variant==="golden")petStage.classList.add("pet-golden");
    if(state.pet.variant==="galaxy")petStage.classList.add("pet-galaxy");
    $("pet-name").textContent=state.pet.name+(state.pet.variantName?" · "+state.pet.variantName:"");
    $("hunger-bar").style.width=state.pet.hunger+"%";$("bond-bar").style.width=state.pet.bond+"%";
    $("pet-mood").textContent=state.pet.hunger<30?"Mình hơi đói rồi...":state.pet.bond>=70?"Mình rất quý bạn!":"Mình đang vui vẻ!";
    $("spent-total").textContent=state.totalSpent+" xu";$("cart-description").textContent=state.lastAction||"Chưa có giao dịch nào.";
    renderPlots();renderSeeds();renderInventory();renderTasks();renderStory();renderEvolutionLab();renderCollection();renderBreeding();renderDelivery();renderResearchSeedShop();renderDailyPlant();
    if(farmScienceSystem)farmScienceSystem.render();
    if($("water-count"))$("water-count").textContent=state.waterBottles||0;
    if($("water-info")){const left=10*60*1000-(Date.now()-(state.waterPickupAt||0));$("water-info").textContent=left>0?"Có thể nhặt bình tiếp theo sau "+Math.ceil(left/60000)+" phút. Mỗi cây cần 1 bình.":"Có thể nhặt 1 bình nước. Mỗi cây cần 1 bình.";}
  }
  $("water-all").addEventListener("click",()=>askBeforeFarmAction("Tưới cây",waterAll));
  $("find-water").addEventListener("click",()=>askBeforeFarmAction("Nhặt bình nước",findWater));
  $("buy-water").addEventListener("click",()=>askBeforeFarmAction("Mua bình nước",buyWater));
  $("breed-button").addEventListener("click",()=>askBeforeFarmAction("Lai tạo cây trồng",breedPlants));
  $("delivery-button").addEventListener("click",()=>askBeforeFarmAction("Giao hàng đến khu phố",deliverProduce));$("feed-pet").addEventListener("click",()=>askBeforeFarmAction("Cho pet ăn",feedPet));$("play-pet").addEventListener("click",()=>askBeforeFarmAction("Chơi cùng pet",playPet));$("buy-ticket").addEventListener("click",()=>askBeforeFarmAction("Đổi phiếu Quiz",buyTicket));
  document.querySelectorAll(".buy-seed").forEach(b=>b.addEventListener("click",()=>askBeforeFarmAction("Mua hạt giống",()=>buySeed(b.dataset.seed))));
  document.querySelectorAll(".task-btn").forEach(b=>b.addEventListener("click",()=>askBeforeFarmAction("Nhận thưởng nhiệm vụ",()=>claimTask(b.dataset.task))));
 
  const elapsed=Math.floor((Date.now()-(state.lastCare||Date.now()))/60000);
  if(elapsed>0){state.pet.hunger=Math.max(0,state.pet.hunger-Math.min(25,elapsed));state.lastCare=Date.now();save();}
  render();
  
  window.addEventListener("ae-research-points", function(event){
    const points = Math.max(0, Number(event.detail && event.detail.points) || 0);
    state.researchPoints = Math.max(Number(state.researchPoints)||0, points);
    state.labLevel = Math.min(5, Math.max(1, 1 + Math.floor(state.researchPoints / 30)));
    save();
    renderEvolutionLab();
    notify("Đã cập nhật " + state.researchPoints + " điểm bé ngoan từ sảnh thử thách!");
  });
 
  setInterval(()=>{if(state.plots.some(Boolean))renderPlots();},1000);

  setInterval(updateDailyPlantClock,1000);
  setInterval(updateDailyTaskClock,1000);
 
  window.addEventListener("storage",e=>{if(e.key===QUIZ_KEY)renderInventory();if(e.key===GAME_KEY){state=loadState();render();}});
  window.addEventListener("focus",()=>{ensureDailyMissions();renderTasks();renderStory();});

  (function initSeasonalEvents(){
    const EVENT_TZ = "Asia/Ho_Chi_Minh";
    const EVENT_STORE_KEY = "aeCayKheSeasonalEvents_v1";
    const DAY_MS = 86400000;

    const EVENT_CONTENT = {
      halloween: {
        crop:{id:"event_halloween_pumpkin",name:"Bí Ngô Ma",icon:"🎃",cost:0,reward:95,seconds:105},
        pet:{id:"event_pet_halloween_cat",name:"Mèo Bí Ngô",icon:"🐈‍⬛",rank:"Độc quyền Halloween",power:88,bonus:14,variant:"shiny",variantName:"Halloween Shiny"},
        quests:[
          {id:"harvest",title:"Thu hoạch 5 nông sản",icon:"🌾",action:"harvest",target:5},
          {id:"book",title:"Trả lời đúng 3 câu hỏi sách",icon:"📖",action:"book",target:3},
          {id:"play",title:"Chơi cùng pet 2 lần",icon:"🐈",action:"play",target:2}
        ]
      },
      christmas: {
        crop:{id:"event_christmas_poinsettia",name:"Trạng Nguyên Tuyết",icon:"🌺",cost:0,reward:110,seconds:125},
        pet:{id:"event_pet_christmas_reindeer",name:"Tuần Lộc Nhí",icon:"🦌",rank:"Độc quyền Giáng Sinh",power:92,bonus:18,variant:"golden",variantName:"Golden Noel"},
        quests:[
          {id:"water",title:"Dùng 6 bình nước tưới cây",icon:"💧",action:"water",target:6},
          {id:"deliver",title:"Giao 5 nông sản đến khu phố",icon:"🚚",action:"deliver",target:5},
          {id:"breed",title:"Lai tạo thành công 1 giống cây",icon:"🧬",action:"breed",target:1}
        ]
      },
      tet: {
        crop:{id:"event_tet_mai",name:"Mai Vàng Tài Lộc",icon:"🌼",cost:0,reward:120,seconds:135},
        pet:{id:"event_pet_tet_luckycat",name:"Mèo Thần Tài",icon:"🐱",rank:"Độc quyền Tết",power:96,bonus:20,variant:"golden",variantName:"Golden Tài Lộc"},
        quests:[
          {id:"plant",title:"Gieo 5 hạt giống",icon:"🌱",action:"plant",target:5},
          {id:"harvest",title:"Thu hoạch 5 cây",icon:"🌻",action:"harvest",target:5},
          {id:"research",title:"Khám phá 1 giống cây trong phòng bé ngoan",icon:"🔬",action:"research",target:1}
        ]
      },
      easter: {
        crop:{id:"event_easter_carrot",name:"Cà Rốt Cầu Vồng",icon:"🥕",cost:0,reward:105,seconds:115},
        pet:{id:"event_pet_easter_bunny",name:"Thỏ Phục Sinh",icon:"🐰",rank:"Độc quyền Phục Sinh",power:90,bonus:16,variant:"galaxy",variantName:"Galaxy Phục Sinh"},
        quests:[
          {id:"breed",title:"Lai tạo thành công 2 lần",icon:"🧬",action:"breed",target:2},
          {id:"book",title:"Trả lời đúng 3 câu hỏi sách",icon:"📚",action:"book",target:3},
          {id:"deliver",title:"Giao 3 nông sản đến khu phố",icon:"📦",action:"deliver",target:3}
        ]
      }
    };

    const TET_DATES = {
      2026:[2026,2,17], 2027:[2027,2,6], 2028:[2028,1,26],
      2029:[2029,2,13], 2030:[2030,2,2], 2031:[2031,1,23],
      2032:[2032,2,11], 2033:[2033,1,31], 2034:[2034,2,19],
      2035:[2035,2,8], 2036:[2036,1,28], 2037:[2037,2,15],
      2038:[2038,2,4], 2039:[2039,1,24], 2040:[2040,2,12]
    };

    function getVNDate(){
      const parts=new Intl.DateTimeFormat("en-CA-u-ca-gregory",{timeZone:EVENT_TZ,year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date());
      const part=key=>Number(parts.find(p=>p.type===key).value);
      return {y:part("year"),m:part("month"),d:part("day")};
    }
    function dayNumber(date){return Math.floor(Date.UTC(date.y,date.m-1,date.d)/DAY_MS);}
    function addDays(date,amount){const d=new Date(Date.UTC(date.y,date.m-1,date.d+amount));return {y:d.getUTCFullYear(),m:d.getUTCMonth()+1,d:d.getUTCDate()};}
    function formatDate(date){return new Intl.DateTimeFormat("vi-VN",{timeZone:"UTC",day:"2-digit",month:"2-digit",year:"numeric"}).format(new Date(Date.UTC(date.y,date.m-1,date.d,12)));}
    function getTetDate(year){
      if(TET_DATES[year]){const a=TET_DATES[year];return {y:a[0],m:a[1],d:a[2]};}
      try{
        const lunar=new Intl.DateTimeFormat("en-u-ca-chinese",{timeZone:EVENT_TZ,month:"numeric",day:"numeric"});
        for(let month=1;month<=2;month++){
          const lastDay=new Date(Date.UTC(year,month,0)).getUTCDate();
          for(let day=1;day<=lastDay;day++){
            const date=new Date(Date.UTC(year,month-1,day,12));
            const parts=lunar.formatToParts(date);
            if(parts.find(p=>p.type==="month")?.value==="1"&&parts.find(p=>p.type==="day")?.value==="1")return {y:year,m:month,d:day};
          }
        }
      }catch(error){console.warn("Không đọc được lịch âm:",error);}
      return {y:year,m:2,d:1};
    }
    function getEasterDate(year){
      const a=year%19,b=Math.floor(year/100),c=year%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),month=Math.floor((h+l-7*m+114)/31),day=((h+l-7*m+114)%31)+1;
      return {y:year,m:month,d:day};
    }
    function makeEvent(type,year){
      let start,end,event;
      if(type==="halloween"){
        start={y:year,m:10,d:25};end={y:year,m:11,d:1};
        event={id:"halloween-"+year,type,icon:"🎃",title:"Halloween "+year,desc:"Lễ hội bí ngô đã đến! Hoàn thành chuỗi nhiệm vụ để nhận vĩnh viễn Mèo Bí Ngô và giống Bí Ngô Ma.",itemName:"Kẹo Bí Ngô",theme:"halloween"};
      }else if(type==="christmas"){
        start={y:year,m:12,d:20};end={y:year,m:12,d:26};
        event={id:"christmas-"+year,type,icon:"🎄",title:"Giáng Sinh "+year,desc:"Khu vườn phủ tuyết! Hoàn thành nhiệm vụ để nhận vĩnh viễn Tuần Lộc Nhí và giống Trạng Nguyên Tuyết.",itemName:"Hộp Quà Noel",theme:"christmas"};
      }else if(type==="tet"){
        start=getTetDate(year);end=addDays(start,6);
        event={id:"tet-"+year,type,icon:"🧧",title:"Tết Nguyên Đán "+year,desc:"Mừng năm mới! Chăm mai, thu hoạch và bé ngoan để nhận Mèo Thần Tài cùng Mai Vàng Tài Lộc vĩnh viễn.",itemName:"Bao Lì Xì",theme:"tet"};
      }else{
        const easter=getEasterDate(year);start=addDays(easter,-2);end=addDays(easter,1);
        event={id:"easter-"+year,type,icon:"🐣",title:"Lễ Phục Sinh "+year,desc:"Mùa xuân rực rỡ! Hoàn thành nhiệm vụ để sở hữu Thỏ Phục Sinh và Cà Rốt Cầu Vồng vĩnh viễn.",itemName:"Trứng Phục Sinh",theme:"easter"};
      }
      event.start=start;event.end=end;event.startNo=dayNumber(start);event.endNo=dayNumber(end);event.dateText=formatDate(start)+" – "+formatDate(end);
      event.content=EVENT_CONTENT[type];
      return event;
    }
    function getEventList(today){
      const list=[];
      for(let year=today.y-1;year<=today.y+3;year++)["tet","easter","halloween","christmas"].forEach(type=>list.push(makeEvent(type,year)));
      return list.sort((a,b)=>a.startNo-b.startNo);
    }

    function readEventStore(){
      try{
        const saved=JSON.parse(localStorage.getItem(EVENT_STORE_KEY)||"{}");
        return {
          claims:saved.claims||{},items:saved.items||{},quests:saved.quests||{},
          unlocked:saved.unlocked||{events:[]},
          weekly:saved.weekly||null,weeklyHistory:Array.isArray(saved.weeklyHistory)?saved.weeklyHistory:[]
        };
      }catch(error){return {claims:{},items:{},quests:{},unlocked:{events:[]},weekly:null,weeklyHistory:[]};}
    }
    function saveEventStore(data){localStorage.setItem(EVENT_STORE_KEY,JSON.stringify(data));}

    function registerPermanentEventRewards(type,equipPet,initialSeedCount){
      const content=EVENT_CONTENT[type];if(!content)return;
      const crop=content.crop,pet=content.pet;
      if(!seeds[crop.id])seeds[crop.id]={name:crop.name,icon:crop.icon,cost:0,reward:crop.reward,seconds:crop.seconds,eventOnly:true,eventType:type};
      if(!cropIcons[crop.id])cropIcons[crop.id]=["🌱","🌿","🍃",crop.icon];
      if(!Object.prototype.hasOwnProperty.call(state.seeds,crop.id))state.seeds[crop.id]=Number.isFinite(initialSeedCount)?initialSeedCount:3;
      if(!cropCatalog.some(item=>item.id===crop.id))cropCatalog.push({id:crop.id,name:crop.name,icon:crop.icon,rank:"Độc quyền lễ hội",power:90,bonus:crop.reward});
      state.collections=state.collections||{};state.collections.crops=state.collections.crops||[];
      if(!state.collections.crops.includes(crop.id))state.collections.crops.push(crop.id);

      if(!petCatalog.some(item=>item.id===pet.id))petCatalog.push({id:pet.id,name:pet.name,icon:pet.icon,rank:pet.rank,power:pet.power,bonus:pet.bonus,eventOnly:true});
      state.collections.pets=state.collections.pets||[];
      if(!state.collections.pets.includes(pet.id))state.collections.pets.push(pet.id);
      if(equipPet){
        state.activePet=pet.id;
        state.pet={...state.pet,name:pet.name,icon:pet.icon,variant:pet.variant,variantName:pet.variantName,bonus:pet.bonus};
      }
    }

    function restorePermanentRewards(){
      const data=readEventStore();
      (data.unlocked.events||[]).forEach(type=>registerPermanentEventRewards(type,false));
      save();
      render();
    }

    function addEventStyles(){
      if(document.getElementById("seasonal-event-styles"))return;
      const style=document.createElement("style");style.id="seasonal-event-styles";
      style.textContent=`
        .seasonal-event-panel,.weekly-update-panel{margin:16px 0 20px;padding:18px 20px;overflow:hidden;border:1px solid #e6e8db;background:#fffdf7;border-radius:20px}
        .seasonal-event-main{display:flex;align-items:center;gap:15px}
        .seasonal-event-icon{width:66px;height:66px;flex:0 0 66px;display:grid;place-items:center;border-radius:18px;background:#ffffffa8;font-size:36px}
        .seasonal-event-copy{flex:1;min-width:0}.seasonal-event-kicker{margin:0 0 4px;font-size:10px;font-weight:900;letter-spacing:1.8px;opacity:.72}
        .seasonal-event-title{margin:0 0 5px;font-size:22px;color:#284b35}.seasonal-event-desc{margin:0;color:#536957;font-size:13px;line-height:1.5}
        .seasonal-event-date{display:block;margin-top:7px;font-size:11px;color:#607365;font-weight:700}
        .seasonal-event-status{align-self:flex-start;background:#ffffffb8;border-radius:20px;padding:7px 10px;font-size:10px;font-weight:900;white-space:nowrap}
        .seasonal-event-bottom{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:15px;padding-top:13px;border-top:1px solid #ffffff9c}
        .seasonal-event-reward b,.seasonal-event-reward small{display:block}.seasonal-event-reward small{margin-top:4px;font-size:11px;color:#5c6d5f}
        .seasonal-event-claim{border:0;border-radius:11px;padding:11px 15px;background:#28583a;color:#fff;font-weight:900;cursor:pointer}.seasonal-event-claim:disabled{opacity:.48;cursor:not-allowed}
        .seasonal-event-calendar{display:flex;flex-wrap:wrap;gap:7px;margin-top:13px}.seasonal-event-pill{padding:6px 9px;border-radius:9px;background:#ffffffa8;font-size:10px;font-weight:800;color:#4b5e4e}
        .seasonal-event-panel.theme-halloween{background:linear-gradient(115deg,#fff0dc,#f8d5b4);border-color:#edc39d}.seasonal-event-panel.theme-christmas{background:linear-gradient(115deg,#e9f6f0,#d4eee4);border-color:#c5e2d4}
        .seasonal-event-panel.theme-tet{background:linear-gradient(115deg,#fff1d5,#f9d9aa);border-color:#edcf9e}.seasonal-event-panel.theme-easter{background:linear-gradient(115deg,#f3efff,#e5f5e8);border-color:#ddd8f2}
        .seasonal-event-quests{margin-top:16px;padding-top:14px;border-top:1px solid #ffffffa8}.seasonal-event-quests h3,.weekly-update-panel h3{margin:0 0 10px;color:#284b35;font-size:17px}
        .event-quest-list,.weekly-quest-list{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:9px}
        .event-quest,.weekly-quest{background:#ffffffb9;border:1px solid #e8eadf;border-radius:13px;padding:11px 12px;min-width:0}
        .event-quest b,.weekly-quest b{display:block;font-size:13px;color:#304a37}.event-quest small,.weekly-quest small{display:block;color:#687b6b;font-size:11px;margin-top:4px}
        .event-quest-bar,.weekly-quest-bar{height:7px;background:#e7ecdf;border-radius:20px;overflow:hidden;margin-top:8px}.event-quest-bar i,.weekly-quest-bar i{display:block;height:100%;background:#63a66f;border-radius:20px}
        .event-quest.done{border-color:#9bc9a0;background:#f1faef}.event-reward-line{margin-top:11px;padding:10px 12px;border-radius:12px;background:#ffffffb5;color:#405c45;font-size:12px}
        .weekly-update-panel{background:linear-gradient(120deg,#edf7e9,#fffdf2);border-color:#d9e8d2}.weekly-update-head{display:flex;gap:12px;align-items:center;justify-content:space-between;flex-wrap:wrap}.weekly-update-head p{margin:4px 0 0;font-size:12px;color:#607365}.weekly-update-bonus{margin-top:12px;font-size:12px;font-weight:800;color:#42634a}
        .event-pet-use{border:0;border-radius:9px;background:#28583a;color:#fff;padding:7px 10px;font-weight:800;cursor:pointer;margin-top:7px}.event-pet-use:disabled{opacity:.5}
        @media(max-width:600px){.seasonal-event-panel,.weekly-update-panel{padding:14px}.seasonal-event-main{align-items:flex-start;gap:10px}.seasonal-event-icon{width:50px;height:50px;flex-basis:50px;font-size:28px}.seasonal-event-title{font-size:18px}.seasonal-event-status{display:none}.seasonal-event-bottom{align-items:flex-start;flex-direction:column}.seasonal-event-claim{width:100%}}
      `;
      document.head.appendChild(style);
    }

    function createEventPanel(){
      let panel=document.getElementById("seasonal-event-panel");if(panel)return panel;
      addEventStyles();panel=document.createElement("section");panel.id="seasonal-event-panel";panel.className="seasonal-event-panel panel";
      panel.innerHTML=`
        <div class="seasonal-event-main"><div class="seasonal-event-icon" id="seasonal-event-icon">🎉</div>
          <div class="seasonal-event-copy"><p class="seasonal-event-kicker">SỰ KIỆN TỰ ĐỘNG THEO LỊCH VIỆT NAM</p>
            <h2 class="seasonal-event-title" id="seasonal-event-title">Lễ hội khu vườn</h2><p class="seasonal-event-desc" id="seasonal-event-desc"></p><small class="seasonal-event-date" id="seasonal-event-date"></small>
          </div><span class="seasonal-event-status" id="seasonal-event-status"></span>
        </div>
        <div class="seasonal-event-bottom"><div class="seasonal-event-reward"><b id="seasonal-event-reward-title">🎁 Quà sự kiện mỗi ngày</b><small id="seasonal-event-reward-info"></small></div><button class="seasonal-event-claim" id="seasonal-event-claim" type="button">Nhận quà lễ</button></div>
        <div class="seasonal-event-quests" id="seasonal-event-quests"></div>
        <div class="event-reward-line" id="seasonal-event-permanent-reward"></div>
        <div class="seasonal-event-calendar" id="seasonal-event-calendar"></div>
      `;
      const welcome=document.querySelector(".game-wrap .welcome");
      if(welcome)welcome.insertAdjacentElement("afterend",panel);else document.querySelector(".game-wrap")?.prepend(panel);
      panel.querySelector("#seasonal-event-claim").addEventListener("click",function(){
        const today=getVNDate(),todayNo=dayNumber(today),active=getEventList(today).find(e=>e.startNo<=todayNo&&e.endNo>=todayNo);
        if(!active){notify("Sự kiện chưa mở. Hãy quay lại đúng dịp lễ nhé!");return;}
        askBeforeFarmAction("Nhận quà sự kiện "+active.title,function(){claimEventGift(active);});
      });
      return panel;
    }

    const WEEKLY_PLANS=[
      {name:"Tuần gieo mầm",tasks:[{id:"plant",title:"Gieo 5 cây",action:"plant",target:5},{id:"harvest",title:"Thu hoạch 5 cây",action:"harvest",target:5},{id:"book",title:"Trả lời đúng 3 câu hỏi sách",action:"book",target:3}]},
      {name:"Tuần chăm vườn",tasks:[{id:"water",title:"Dùng 8 bình nước tưới cây",action:"water",target:8},{id:"play",title:"Chơi với pet 4 lần",action:"play",target:4},{id:"deliver",title:"Giao 4 nông sản",action:"deliver",target:4}]},
      {name:"Tuần bé ngoan",tasks:[{id:"breed",title:"Lai tạo 2 lần",action:"breed",target:2},{id:"research",title:"Khám phá 2 giống mới",action:"research",target:2},{id:"harvest",title:"Thu hoạch 6 cây",action:"harvest",target:6}]},
      {name:"Tuần giao thương",tasks:[{id:"deliver",title:"Giao 8 nông sản",action:"deliver",target:8},{id:"plant",title:"Gieo 4 cây",action:"plant",target:4},{id:"play",title:"Chơi với pet 3 lần",action:"play",target:3}]},
      {name:"Tuần học hỏi",tasks:[{id:"book",title:"Trả lời đúng 5 câu hỏi sách",action:"book",target:5},{id:"water",title:"Tưới 6 cây",action:"water",target:6},{id:"research",title:"Khám phá 1 giống mới",action:"research",target:1}]},
      {name:"Tuần mùa màng",tasks:[{id:"harvest",title:"Thu hoạch 8 cây",action:"harvest",target:8},{id:"breed",title:"Lai tạo 2 lần",action:"breed",target:2},{id:"plant",title:"Gieo 5 cây",action:"plant",target:5}]},
      {name:"Tuần đồng hành",tasks:[{id:"play",title:"Chơi với pet 5 lần",action:"play",target:5},{id:"deliver",title:"Giao 5 nông sản",action:"deliver",target:5},{id:"book",title:"Trả lời đúng 4 câu hỏi sách",action:"book",target:4}]},
      {name:"Tuần khám phá",tasks:[{id:"research",title:"Khám phá 2 giống mới",action:"research",target:2},{id:"water",title:"Tưới 8 cây",action:"water",target:8},{id:"harvest",title:"Thu hoạch 6 cây",action:"harvest",target:6}]}
    ];

    function getWeekInfo(today){
      const d=new Date(Date.UTC(today.y,today.m-1,today.d,12));
      const weekday=d.getUTCDay();
      const monday=addDays(today,-((weekday+6)%7));
      const key=monday.y+"-"+String(monday.m).padStart(2,"0")+"-"+String(monday.d).padStart(2,"0");
      const index=((Math.floor(dayNumber(monday)/7)%WEEKLY_PLANS.length)+WEEKLY_PLANS.length)%WEEKLY_PLANS.length;
      const nextMonday=addDays(monday,7);
      return {key,index,plan:WEEKLY_PLANS[index],nextMonday};
    }
    function ensureWeekly(data,today){
      const info=getWeekInfo(today);
      if(!data.weekly||data.weekly.weekKey!==info.key){
        if(data.weekly&&data.weekly.weekKey){data.weeklyHistory.push({weekKey:data.weekly.weekKey,completed:(data.weekly.completed||[]).slice()});data.weeklyHistory=data.weeklyHistory.slice(-52);}
        data.weekly={weekKey:info.key,progress:{},completed:[],bonusClaimed:false};
        saveEventStore(data);
      }
      return {info,weekly:data.weekly};
    }
    function createWeeklyPanel(){
      let panel=document.getElementById("weekly-update-panel");if(panel)return panel;
      addEventStyles();panel=document.createElement("section");panel.id="weekly-update-panel";panel.className="weekly-update-panel panel";
      panel.innerHTML=`<div class="weekly-update-head"><div><p class="seasonal-event-kicker">CẬP NHẬT NỘI DUNG TỰ ĐỘNG</p><h2 class="seasonal-event-title">🔄 Thử thách tuần mới</h2><p id="weekly-update-date"></p></div><span class="seasonal-event-status" id="weekly-update-status">ĐANG CẬP NHẬT</span></div><div class="weekly-quest-list" id="weekly-quest-list"></div><div class="weekly-update-bonus" id="weekly-update-bonus"></div>`;
      const eventPanel=createEventPanel();eventPanel.insertAdjacentElement("afterend",panel);return panel;
    }

    function updateWeeklyPanel(){
      const panel=createWeeklyPanel(),today=getVNDate(),data=readEventStore(),bundle=ensureWeekly(data,today),tasks=bundle.info.plan.tasks,weekly=bundle.weekly;
      const nowNo=dayNumber(today),nextNo=dayNumber(bundle.info.nextMonday),days=Math.max(0,nextNo-nowNo);
      panel.querySelector("#weekly-update-date").textContent=""+bundle.info.plan.name+" · "+formatDate({y:today.y,m:today.m,d:today.d})+" · Làm mới vào thứ Hai hàng tuần";
      panel.querySelector("#weekly-update-status").textContent=days===1?"NGÀY MAI CÓ TUẦN MỚI":"CÒN "+days+" NGÀY ĐẾN TUẦN MỚI";
      panel.querySelector("#weekly-quest-list").innerHTML=tasks.map(task=>{
        const count=Math.min(task.target,Number(weekly.progress[task.id])||0),done=(weekly.completed||[]).includes(task.id),pct=Math.round(count/task.target*100);
        return '<article class="weekly-quest '+(done?'done':'')+'"><b>'+(done?'✅ ': '⭐ ')+task.title+'</b><small>'+count+'/'+task.target+' · '+(done?'Đã nhận thưởng':'+50 xu và +8 điểm bé ngoan khi hoàn thành')+'</small><div class="weekly-quest-bar"><i style="width:'+pct+'%"></i></div></article>';
      }).join("");
      const allDone=tasks.every(task=>(weekly.completed||[]).includes(task.id));
      panel.querySelector("#weekly-update-bonus").textContent=allDone?"🏆 Đã hoàn thành tuần này! Thưởng thêm +100 xu, +20 điểm bé ngoan và +2 bình nước.":"🎁 Hoàn thành cả 3 thử thách để nhận thêm +100 xu, +20 điểm bé ngoan và +2 bình nước.";
    }

    function createOrUpdateEventQuests(event,active,data){
      const host=document.getElementById("seasonal-event-quests");if(!host)return;
      const progress=data.quests[event.id]||{counts:{},completed:[],finalRewardClaimed:false};
      const quests=event.content.quests;
      host.innerHTML='<h3>📜 Nhiệm vụ riêng của '+event.title+'</h3><div class="event-quest-list">'+quests.map(q=>{
        const count=Math.min(q.target,Number(progress.counts[q.id])||0),done=(progress.completed||[]).includes(q.id),pct=Math.round(count/q.target*100);
        return '<article class="event-quest '+(done?'done':'')+'"><b>'+(done?'✅ ':'⭐ ')+q.icon+' '+q.title+'</b><small>'+(active?count+'/'+q.target:(done?'Đã hoàn thành':'Mở khi lễ hội bắt đầu'))+' · '+(done?'Đã nhận +25 xu, +5 điểm bé ngoan':'Thưởng khi hoàn thành')+'</small><div class="event-quest-bar"><i style="width:'+pct+'%"></i></div></article>';
      }).join('')+'</div>';
      const allDone=quests.every(q=>(progress.completed||[]).includes(q.id));
      const crop=event.content.crop,pet=event.content.pet;
      const unlocked=(data.unlocked.events||[]).includes(event.type);
      document.getElementById("seasonal-event-permanent-reward").textContent=(unlocked||allDone?'🏆 ĐÃ MỞ KHÓA VĨNH VIỄN: ':'🎁 PHẦN THƯỞNG CUỐI CHUỖI: ')+crop.icon+' '+crop.name+' (giống cây) · '+pet.icon+' '+pet.name+' (pet)'+(unlocked?' · Có thể dùng trong các mùa sau.':' · Hoàn thành đủ '+quests.length+' nhiệm vụ để nhận.');
    }

    function claimEventGift(event){
      const today=getVNDate(),dateKey=today.y+"-"+String(today.m).padStart(2,"0")+"-"+String(today.d).padStart(2,"0"),data=readEventStore();
      if(data.claims[event.id]===dateKey){notify("Bạn đã nhận quà sự kiện hôm nay rồi!");updateSeasonalEvent();return;}
      data.claims[event.id]=dateKey;data.items[event.id]=(Number(data.items[event.id])||0)+1;saveEventStore(data);
      state.coins+=15;state.researchPoints+=3;state.waterBottles=(state.waterBottles||0)+1;
      state.labLevel=Math.min(5,Math.max(1,1+Math.floor(state.researchPoints/30)));
      state.lastAction="Nhận quà "+event.title+": +15 xu, +3 điểm bé ngoan, +1 bình nước";
      save();render();updateSeasonalEvent();notify("🎉 Nhận quà thành công! +15 xu, +3 điểm bé ngoan, +1 bình nước và 1 "+event.itemName+".");
    }

    function trackActions(action,detail,amount){
      const today=getVNDate(),todayNo=dayNumber(today),events=getEventList(today),active=events.find(e=>e.startNo<=todayNo&&e.endNo>=todayNo);
      const count=Math.max(1,Number(amount)||1),data=readEventStore();let messages=[],shouldRender=false;
    
      if(active){
        const questState=data.quests[active.id]||(data.quests[active.id]={counts:{},completed:[],finalRewardClaimed:false});
        active.content.quests.forEach(q=>{
          if(q.action!==action||(questState.completed||[]).includes(q.id))return;
          questState.counts[q.id]=Math.min(q.target,(Number(questState.counts[q.id])||0)+count);
          if(questState.counts[q.id]>=q.target){
            questState.completed.push(q.id);state.coins+=25;state.researchPoints+=5;
            messages.push('Hoàn thành nhiệm vụ lễ hội: '+q.title+'! +25 xu, +5 điểm bé ngoan.');
          }
        });
        const allDone=active.content.quests.every(q=>(questState.completed||[]).includes(q.id));
        if(allDone&&!questState.finalRewardClaimed){
          questState.finalRewardClaimed=true;
          const already=(data.unlocked.events||[]).includes(active.type);
          if(!already){
            data.unlocked.events=data.unlocked.events||[];data.unlocked.events.push(active.type);
            registerPermanentEventRewards(active.type,true,0);
            const crop=active.content.crop;
            state.seeds[crop.id]=(state.seeds[crop.id]||0)+3;
            state.lastAction='Mở khóa vĩnh viễn pet '+active.content.pet.name+' và giống cây '+crop.name;
            messages.push('🎊 Đã nhận vĩnh viễn '+active.content.pet.name+' và '+crop.name+'! Có 3 hạt giống trong túi.');
            shouldRender=true;
          }else{
            state.coins+=100;state.researchPoints+=20;
            messages.push('Bạn đã sở hữu quà mùa này từ trước: nhận thêm +100 xu và +20 điểm bé ngoan.');
          }
        }
      }

      const bundle=ensureWeekly(data,today),weekly=bundle.weekly;
      bundle.info.plan.tasks.forEach(task=>{
        if(task.action!==action||(weekly.completed||[]).includes(task.id))return;
        weekly.progress[task.id]=Math.min(task.target,(Number(weekly.progress[task.id])||0)+count);
        if(weekly.progress[task.id]>=task.target){
          weekly.completed.push(task.id);state.coins+=50;state.researchPoints+=8;
          messages.push('Hoàn thành thử thách tuần: '+task.title+'! +50 xu, +8 điểm bé ngoan.');
        }
      });
      if(bundle.info.plan.tasks.every(task=>(weekly.completed||[]).includes(task.id))&&!weekly.bonusClaimed){
        weekly.bonusClaimed=true;state.coins+=100;state.researchPoints+=20;state.waterBottles=(state.waterBottles||0)+2;
        messages.push('🏆 Hoàn thành toàn bộ thử thách tuần! Thưởng thêm +100 xu, +20 điểm bé ngoan và +2 bình nước.');
      }
      state.labLevel=Math.min(5,Math.max(1,1+Math.floor(state.researchPoints/30)));
      saveEventStore(data);save();
      if(shouldRender){render();renderCollection();}
      updateSeasonalEvent();updateWeeklyPanel();renderOwnedEventPets();
      if(messages.length)setTimeout(()=>notify(messages.join(" ")),700);
    }
    trackSeasonalEventAction=trackActions;

    function updateSeasonalEvent(){
      const panel=createEventPanel(),today=getVNDate(),todayNo=dayNumber(today),events=getEventList(today).filter(e=>e.endNo>=todayNo);
      const active=events.find(e=>e.startNo<=todayNo&&e.endNo>=todayNo),featured=active||events[0];if(!featured)return;
      panel.className="seasonal-event-panel panel theme-"+featured.type;
      panel.querySelector("#seasonal-event-icon").textContent=featured.icon;
      panel.querySelector("#seasonal-event-title").textContent=active?featured.title:"Sắp diễn ra: "+featured.title;
      panel.querySelector("#seasonal-event-desc").textContent=featured.desc;
      panel.querySelector("#seasonal-event-date").textContent="Thời gian: "+featured.dateText;
      panel.querySelector("#seasonal-event-status").textContent=active?"ĐANG DIỄN RA · CÒN "+(featured.endNo-todayNo)+" NGÀY":"CÒN "+(featured.startNo-todayNo)+" NGÀY NỮA";
      const store=readEventStore(),dateKey=today.y+"-"+String(today.m).padStart(2,"0")+"-"+String(today.d).padStart(2,"0"),claimed=active&&store.claims[active.id]===dateKey,itemCount=active?(Number(store.items[active.id])||0):0;
      panel.querySelector("#seasonal-event-reward-title").textContent=active?"🎁 Quà hôm nay · Đã sưu tầm "+itemCount+" "+featured.itemName:"🎁 Quà lễ mỗi ngày";
      panel.querySelector("#seasonal-event-reward-info").textContent=active?"+15 xu · +3 điểm bé ngoan · +1 bình nước · +1 "+featured.itemName:"Mỗi ngày trong thời gian sự kiện: +15 xu, +3 điểm bé ngoan và +1 bình nước.";
      const button=panel.querySelector("#seasonal-event-claim");button.disabled=!active||!!claimed;button.textContent=!active?"Chưa mở sự kiện":claimed?"✓ Đã nhận quà hôm nay":"🎁 Nhận quà lễ";
      createOrUpdateEventQuests(featured,!!active,store);
      panel.querySelector("#seasonal-event-calendar").innerHTML=events.slice(0,4).map(e=>'<span class="seasonal-event-pill">'+e.icon+' '+e.title+' · '+(active&&e.id===active.id?"ĐANG DIỄN RA":formatDate(e.start))+'</span>').join("");
    }

    function activateEventPet(type){
      const pet=EVENT_CONTENT[type]?.pet;if(!pet)return;
      if(!(state.collections.pets||[]).includes(pet.id)){notify("Bạn chưa mở khóa pet sự kiện này.");return;}
      state.activePet=pet.id;state.pet={...state.pet,name:pet.name,icon:pet.icon,variant:pet.variant,variantName:pet.variantName,bonus:pet.bonus};
      save();render();notify("Đã chọn pet "+pet.name+" làm bạn đồng hành!");
    }
    function renderOwnedEventPets(){
      const panel=document.getElementById("weekly-update-panel");if(!panel)return;
      const owned=Object.keys(EVENT_CONTENT).filter(type=>(state.collections.pets||[]).includes(EVENT_CONTENT[type].pet.id));
      let host=document.getElementById("event-pet-selector");
      if(!host){host=document.createElement("div");host.id="event-pet-selector";host.className="event-reward-line";panel.appendChild(host);}
      host.innerHTML=owned.length?'<b>🐾 Pet lễ hội đã sở hữu vĩnh viễn</b><div class="event-pet-list">'+owned.map(type=>{
        const pet=EVENT_CONTENT[type].pet,active=state.activePet===pet.id;
        return '<span>'+pet.icon+' '+pet.name+' <button type="button" class="event-pet-use" data-event-pet="'+type+'" '+(active?'disabled':'')+'>'+(active?'Đang dùng':'Dùng pet')+'</button></span>';
      }).join(' · ')+'</div>':'🐾 Chưa sở hữu pet lễ hội nào. Hoàn thành chuỗi nhiệm vụ của một dịp lễ để mở khóa.';
      host.querySelectorAll('[data-event-pet]').forEach(btn=>btn.addEventListener('click',()=>activateEventPet(btn.dataset.eventPet)));
    }

    function updateAllEventUI(){updateSeasonalEvent();updateWeeklyPanel();renderOwnedEventPets();}
    restorePermanentRewards();
    updateAllEventUI();
    setInterval(updateAllEventUI,60000);
    window.addEventListener("focus",updateAllEventUI);
    window.addEventListener("storage",function(event){if(event.key===EVENT_STORE_KEY||event.key===GAME_KEY)updateAllEventUI();});
    document.addEventListener("visibilitychange",function(){if(!document.hidden)updateAllEventUI();});
  })();


  function createFarmScienceSystem(){
    const root=document.getElementById("page-farm");
    const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
    const ag=()=>state.agriculture;
    const vnParts=(date=new Date())=>{
      const parts=new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Ho_Chi_Minh",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",hourCycle:"h23"}).formatToParts(date);
      const get=k=>Number(parts.find(x=>x.type===k)?.value||0);
      return {y:get("year"),m:get("month"),d:get("day"),hour:get("hour"),key:get("year")+"-"+String(get("month")).padStart(2,"0")+"-"+String(get("day")).padStart(2,"0")};
    };
    const hash=text=>{let h=2166136261;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;};
    const soilNames=soil=>soil.fertility>=80?"Đất rất màu mỡ":soil.fertility>=60?"Đất tốt":soil.fertility>=40?"Đất trung bình":"Đất bạc màu";
    const currentClimate=()=>{
      const now=vnParts(),weather=weatherSystem.getPlantEffect().weather;
      const tempAdjust={sunny:2,cloudy:0,rain:-2,heatwave:9,drought:7,thunderstorm:-2,cold:-8,frost:-12,windstorm:-1,hail:-4};
      const temperature=clamp(27+(tempAdjust[weather.id]||0)+((now.hour>=11&&now.hour<=15)?3:(now.hour<6||now.hour>=20?-4:0)),4,43);
      let light=now.hour>=7&&now.hour<17?1:now.hour>=6&&now.hour<7?0.55:now.hour>=17&&now.hour<19?0.5:0.18;
      if(["cloudy","rain","thunderstorm","hail"].includes(weather.id))light*=0.78;
      const humidity=clamp(68+(weather.id==="rain"||weather.id==="thunderstorm"?22:weather.id==="drought"||weather.id==="heatwave"?-25:0),20,100);
      return {now,weather,temperature,light,humidity,lightText:light>=0.85?"Ánh sáng tốt":light>=0.45?"Ánh sáng trung bình":"Ánh sáng yếu"};
    };
    const marketFactor=(id)=>{
      const today=vnParts().key;
      const value=hash(today+"|market|"+id)%61;
      return 0.75+value/100;
    };
    function ensurePanel(){
      let panel=document.getElementById("farm-science-panel");if(panel)return panel;
      panel=document.createElement("section");panel.id="farm-science-panel";panel.className="farm-science-panel panel";
      panel.innerHTML=`
        <div class="science-head"><div><p class="eyebrow">NÔNG NGHIỆP MÔ PHỎNG</p><h2>🔬 Trung tâm quản lý nông trại</h2><p>Theo dõi đất, vòng đời cây, sinh vật có ích, đàn vật nuôi và giá nông sản.</p></div><span class="science-tag">Dữ liệu lưu trong tiến trình</span></div>
        <div class="science-grid">
          <article class="science-card"><h3>🌱 Chất lượng đất</h3><p class="science-desc">Chọn ô đất để cải tạo độ màu mỡ, hữu cơ, độ ẩm và độ nén.</p><label class="science-label" for="science-plot-select">Ô đất đang xem</label><select id="science-plot-select"></select><div id="science-soil-detail"></div><div class="science-actions"><button data-agri-action="buy-compost">Mua 2 phân ủ · 12 xu</button><button data-agri-action="apply-compost">Bón 1 phân ủ</button><button data-agri-action="loosen-soil">Xới đất · 6 xu</button></div><small id="science-soil-stock"></small></article>
          <article class="science-card"><h3>🌿 Vòng đời cây trồng</h3><p class="science-desc">Cây trải qua các giai đoạn từ hạt đến thu hoạch; chỉ số môi trường điều chỉnh tốc độ sinh trưởng.</p><div id="science-life-cycle" class="science-life-cycle"></div></article>
          <article class="science-card"><h3>🐞 Thiên địch & dịch bệnh</h3><p class="science-desc">Bọ rùa hỗ trợ kiểm soát rệp; chế phẩm sinh học giúp giảm sâu bệnh.</p><div id="science-pest-status"></div><div class="science-actions"><button data-agri-action="buy-ladybugs">Mua 2 đàn bọ rùa · 20 xu</button><button data-agri-action="buy-spray">Mua chế phẩm · 18 xu</button><button data-agri-action="treat-plots">Phun sinh học · 1 bình</button></div><small id="science-pest-stock"></small></article>
          <article class="science-card"><h3>🐔 Mô phỏng chăn nuôi</h3><p class="science-desc">Nuôi gà, bò và dê; cho ăn, cấp nước, thu trứng, sữa và phân chuồng.</p><div id="science-livestock-status"></div><div class="science-actions"><button data-agri-action="buy-chicken">Mua gà · 55 xu</button><button data-agri-action="buy-cow">Mua bò · 160 xu</button><button data-agri-action="buy-goat">Mua dê · 110 xu</button><button data-agri-action="buy-feed">Mua 5 phần thức ăn · 12 xu</button><button data-agri-action="feed-animals">Cho đàn ăn</button><button data-agri-action="water-animals">Cấp nước · 1 bình</button><button data-agri-action="collect-animal">Thu sản phẩm</button><button data-agri-action="compost-manure">Ủ phân chuồng</button></div><small id="science-livestock-stock"></small></article>
          <article class="science-card"><h3>📈 Kinh tế & thị trường</h3><p class="science-desc">Giá mua bán biến động theo ngày; bán nông sản hoặc sản phẩm chăn nuôi theo giá hiện tại.</p><div id="science-market-prices"></div><div class="science-market-form"><label>Sản phẩm<select id="science-market-item"></select></label><label>Số lượng<input id="science-market-amount" type="number" min="1" max="99" value="1"></label><button data-agri-action="sell-market">Bán theo giá hôm nay</button></div><small id="science-market-note"></small></article>
          <article class="science-card"><h3>🌞 Ánh sáng & nhiệt độ</h3><p class="science-desc">Điều kiện ánh sáng thay đổi theo giờ; nhiệt độ và độ ẩm phụ thuộc thời tiết mô phỏng.</p><div id="science-climate-status"></div><div class="science-climate-bar"><span>Ánh sáng</span><i><b id="science-light-bar"></b></i></div><div class="science-climate-bar"><span>Độ ẩm không khí</span><i><b id="science-humidity-bar"></b></i></div><p class="science-hint">Nhiệt độ quá cao hoặc quá thấp và thiếu ánh sáng đều làm cây sinh trưởng chậm.</p></article>
        </div>`;
      const farmLayout=root&&root.querySelector(".farm-layout");
      const weather=document.getElementById("farm-weather-panel");
      if(farmLayout)farmLayout.insertAdjacentElement("afterend",panel);else if(weather)weather.insertAdjacentElement("afterend",panel);else if(root)root.appendChild(panel);
      panel.addEventListener("click",event=>{
        const button=event.target.closest("[data-agri-action]");if(!button)return;
        const action=button.dataset.agriAction;
        const map={
          "buy-compost":["Mua phân ủ hữu cơ",buyCompost],"apply-compost":["Bón phân ủ cho đất",applyCompost],"loosen-soil":["Xới đất",loosenSoil],
          "buy-ladybugs":["Mua bọ rùa thiên địch",buyLadybugs],"buy-spray":["Mua chế phẩm sinh học",buySpray],"treat-plots":["Xử lý sâu bệnh sinh học",treatPlots],
          "buy-chicken":["Mua gà nuôi",()=>buyAnimal("chicken")],"buy-cow":["Mua bò nuôi",()=>buyAnimal("cow")],"buy-goat":["Mua dê nuôi",()=>buyAnimal("goat")],
          "buy-feed":["Mua thức ăn chăn nuôi",buyFeed],"feed-animals":["Cho vật nuôi ăn",feedAnimals],"water-animals":["Cấp nước cho vật nuôi",waterAnimals],
          "collect-animal":["Thu sản phẩm chăn nuôi",collectAnimalProducts],"compost-manure":["Ủ phân chuồng",compostManure],"sell-market":["Bán nông sản theo giá thị trường",sellAtMarket]
        };
        if(map[action])askBeforeFarmAction(map[action][0],map[action][1]);
      });
      panel.querySelector("#science-plot-select").addEventListener("change",render);
      return panel;
    }
    function selectedPlotIndex(){const el=document.getElementById("science-plot-select");return clamp(Number(el&&el.value)||0,0,5);}
    function soilFor(index){return ag().soil[index]||(ag().soil[index]={fertility:70,organicMatter:45,moisture:60,compaction:20,lastUpdated:Date.now()});}
    function statusFor(index){return ag().plotStatus[index]||(ag().plotStatus[index]={pestLoad:0,diseaseLoad:0,pest:"",disease:"",health:100});}
    function onPlant(index){const soil=soilFor(index);const st=statusFor(index);st.pestLoad=0;st.diseaseLoad=0;st.pest="";st.disease="";soil.moisture=Math.max(soil.moisture,48);soil.lastUpdated=Date.now();}
    function onHarvest(index){const soil=soilFor(index);soil.fertility=clamp(soil.fertility-7,0,100);soil.organicMatter=clamp(soil.organicMatter-3,0,100);const st=statusFor(index);st.pestLoad=0;st.diseaseLoad=0;st.pest="";st.disease="";st.health=100;}
    function getStageLabel(p){if(p<.08)return"Hạt giống";if(p<.20)return"Nảy mầm";if(p<.40)return"Cây con";if(p<.65)return"Sinh trưởng thân lá";if(p<.82)return"Ra hoa";if(p<.97)return"Kết trái";return"Sắp thu hoạch";}
    function getGrowthFactor(plot){
      const index=clamp(Number(plot.soilIndex)||0,0,5),soil=soilFor(index),st=statusFor(index),climate=currentClimate();
      const fertility=0.78+(soil.fertility/100)*0.25;
      const organic=0.92+(soil.organicMatter/100)*0.10;
      const moisture=soil.moisture<20?0.68:soil.moisture<40?0.84:soil.moisture>96?0.94:1;
      const compaction=1-(soil.compaction/100)*0.20;
      const temperature=clamp(1-Math.abs(climate.temperature-24)*0.012,0.68,1.08);
      const light=0.72+climate.light*0.30;
      const pest=1-(st.pestLoad/100)*0.22-(st.diseaseLoad/100)*0.28;
      const pollination=ag().beneficial.bees>0?1.025:1;
      return clamp(fertility*organic*moisture*compaction*temperature*light*pest*pollination,0.5,1.28);
    }
    function getMarketFactor(id){return marketFactor(id);}
    function applyDailySimulation(){
      const climate=currentClimate(),today=climate.now.key;if(ag().lastDailyKey===today)return;
      ag().lastDailyKey=today;
      ag().soil.forEach((soil,index)=>{
        soil.moisture=clamp(soil.moisture-(climate.weather.id==="drought"||climate.weather.id==="heatwave"?18:10),0,100);
        if(climate.weather.id==="rain"||climate.weather.id==="thunderstorm")soil.moisture=clamp(soil.moisture+24,0,100);
        if(state.plots[index]){soil.fertility=clamp(soil.fertility-1.5,0,100);soil.organicMatter=clamp(soil.organicMatter-.5,0,100);}
        const st=statusFor(index);if(!state.plots[index]){st.pestLoad=Math.max(0,st.pestLoad-10);st.diseaseLoad=Math.max(0,st.diseaseLoad-10);return;}
        const risk=.07+(soil.moisture>82?.14:0)+(soil.fertility<35?.10:0)+(climate.temperature>33?.08:0);
        const protectedByLadybugs=ag().beneficial.ladybugs>0;
        const roll=(hash(today+"|pest|"+index)%100)/100;
        if(roll<risk*(protectedByLadybugs?.35:1)){st.pest="Rệp hoặc sâu ăn lá";st.pestLoad=clamp(st.pestLoad+24,0,100);}else st.pestLoad=Math.max(0,st.pestLoad-5);
        if((soil.moisture>88&&climate.humidity>82)&&hash(today+"|disease|"+index)%100<22){st.disease="Nấm lá do ẩm cao";st.diseaseLoad=clamp(st.diseaseLoad+22,0,100);}else st.diseaseLoad=Math.max(0,st.diseaseLoad-4);
        if(protectedByLadybugs){st.pestLoad=Math.max(0,st.pestLoad-7);st.pest=st.pestLoad?st.pest:"";}
      });
      const live=ag().livestock,total=live.chicken+live.cow+live.goat;
      if(total>0){live.hunger=clamp(live.hunger-12,0,100);live.water=clamp(live.water-14,0,100);if(live.hunger>=35&&live.water>=30){live.health=clamp(live.health+2,0,100);live.eggs+=live.chicken;live.milk+=live.cow+live.goat;ag().inventory.manure+=Math.max(1,Math.floor(total/2));}else live.health=clamp(live.health-5,20,100);}
      ag().marketKey=today;save();
    }
    function buyCompost(){if(state.coins<12){notify("Cần 12 xu để mua 2 phần phân ủ.");return;}state.coins-=12;ag().inventory.compost+=2;save();render();notify("Đã mua 2 phần phân ủ hữu cơ.");}
    function applyCompost(){const i=selectedPlotIndex(),soil=soilFor(i);if(ag().inventory.compost<1){notify("Bạn đã hết phân ủ. Hãy mua thêm hoặc ủ phân chuồng.");return;}ag().inventory.compost--;soil.fertility=clamp(soil.fertility+18,0,100);soil.organicMatter=clamp(soil.organicMatter+20,0,100);soil.moisture=clamp(soil.moisture+5,0,100);save();render();notify("Đất ô "+(i+1)+" đã được bổ sung dinh dưỡng.");}
    function loosenSoil(){const i=selectedPlotIndex(),soil=soilFor(i);if(state.coins<6){notify("Cần 6 xu để xới đất.");return;}state.coins-=6;soil.compaction=clamp(soil.compaction-22,0,100);soil.fertility=clamp(soil.fertility+2,0,100);save();render();notify("Đã làm tơi đất ô "+(i+1)+".");}
    function buyLadybugs(){if(state.coins<20){notify("Cần 20 xu để mua bọ rùa.");return;}state.coins-=20;ag().beneficial.ladybugs+=2;ag().beneficial.bees+=1;save();render();notify("Đã thả 2 nhóm bọ rùa và thu hút 1 nhóm ong có ích.");}
    function buySpray(){if(state.coins<18){notify("Cần 18 xu để mua 2 bình chế phẩm sinh học.");return;}state.coins-=18;ag().inventory.organicSpray+=2;save();render();notify("Đã mua 2 bình chế phẩm sinh học.");}
    function treatPlots(){if(ag().inventory.organicSpray<1){notify("Bạn không còn chế phẩm sinh học.");return;}ag().inventory.organicSpray--;ag().plotStatus.forEach(st=>{st.pestLoad=clamp(st.pestLoad-60,0,100);st.diseaseLoad=clamp(st.diseaseLoad-55,0,100);if(!st.pestLoad)st.pest="";if(!st.diseaseLoad)st.disease="";});save();render();notify("Đã xử lý sâu bệnh sinh học cho toàn bộ khu vườn.");}
    function buyAnimal(kind){const cfg={chicken:{cost:55,label:"gà"},cow:{cost:160,label:"bò"},goat:{cost:110,label:"dê"}}[kind];if(!cfg)return;if(state.coins<cfg.cost){notify("Không đủ xu để mua "+cfg.label+".");return;}state.coins-=cfg.cost;ag().livestock[kind]++;save();render();notify("Đã thêm 1 "+cfg.label+" vào chuồng.");}
    function buyFeed(){if(state.coins<12){notify("Cần 12 xu để mua thức ăn.");return;}state.coins-=12;ag().inventory.feed+=5;save();render();notify("Đã mua 5 phần thức ăn chăn nuôi.");}
    function feedAnimals(){const live=ag().livestock,total=live.chicken+live.cow+live.goat;if(!total){notify("Chuồng chưa có vật nuôi.");return;}if(ag().inventory.feed<total){notify("Không đủ thức ăn cho toàn đàn. Hãy mua thêm.");return;}ag().inventory.feed-=total;live.hunger=clamp(live.hunger+35,0,100);live.health=clamp(live.health+3,0,100);save();render();notify("Đàn vật nuôi đã được cho ăn.");}
    function waterAnimals(){const live=ag().livestock;if(!live.chicken&&!live.cow&&!live.goat){notify("Chuồng chưa có vật nuôi.");return;}if((state.waterBottles||0)<1){notify("Cần 1 bình nước để bổ sung máng uống.");return;}state.waterBottles--;live.water=clamp(live.water+45,0,100);save();render();notify("Đã bổ sung nước sạch cho máng uống.");}
    function collectAnimalProducts(){const live=ag().livestock;if(!live.eggs&&!live.milk&&!ag().inventory.manure){notify("Chưa có sản phẩm chăn nuôi để thu.");return;}const eggs=live.eggs,milk=live.milk,manure=ag().inventory.manure;live.eggs=0;live.milk=0;ag().inventory.manure=0;ag().livestock.products={...(ag().livestock.products||{}),eggs:(ag().livestock.products?.eggs||0)+eggs,milk:(ag().livestock.products?.milk||0)+milk,manure:(ag().livestock.products?.manure||0)+manure};save();render();notify("Thu được "+eggs+" trứng, "+milk+" sữa và "+manure+" phân chuồng.");}
    function compostManure(){const products=ag().livestock.products||{};if((products.manure||0)<2){notify("Cần 2 phân chuồng đã thu để ủ thành 1 phân hữu cơ.");return;}products.manure-=2;ag().inventory.compost++;save();render();notify("Ủ thành công 1 phần phân hữu cơ.");}
    function allMarketGoods(){const goods=[];Object.keys(state.produce||{}).forEach(id=>{const count=state.produce[id]||0;if(count>0&&seeds[id])goods.push({id,name:seeds[id].name,icon:seeds[id].icon,count,base:seeds[id].reward});});const prod=ag().livestock.products||{};if(prod.eggs>0)goods.push({id:"eggs",name:"Trứng gà",icon:"🥚",count:prod.eggs,base:8});if(prod.milk>0)goods.push({id:"milk",name:"Sữa tươi",icon:"🥛",count:prod.milk,base:14});return goods;}
    function sellAtMarket(){const id=document.getElementById("science-market-item").value,amount=clamp(Math.floor(Number(document.getElementById("science-market-amount").value)||1),1,99),goods=allMarketGoods(),item=goods.find(x=>x.id===id);if(!item){notify("Bạn chưa có sản phẩm này trong kho.");return;}if(item.count<amount){notify("Kho không đủ số lượng để bán.");return;}const factor=marketFactor(id),price=Math.max(1,Math.floor(item.base*factor)),total=price*amount;if(id==="eggs"||id==="milk"){ag().livestock.products[id]-=amount;}else state.produce[id]-=amount;state.coins+=total;state.lastAction="Bán "+amount+" "+item.name+" theo giá thị trường";save();render();notify("Đã bán "+amount+" "+item.name+" với giá "+price+" xu/món. Nhận +"+total+" xu.");}
    function render(){
      const panel=ensurePanel(),climate=currentClimate(),soilSelect=panel.querySelector("#science-plot-select"),selected=selectedPlotIndex(),soil=soilFor(selected);
      soilSelect.innerHTML=Array.from({length:6},(_,i)=>'<option value="'+i+'">Ô đất '+(i+1)+(state.plots[i]?' · Có cây':' · Đất trống')+'</option>').join("");soilSelect.value=String(selected);
      panel.querySelector("#science-soil-detail").innerHTML='<div class="science-stat"><b>'+soilNames(soil)+'</b><small>Độ màu mỡ: '+Math.round(soil.fertility)+'% · Hữu cơ: '+Math.round(soil.organicMatter)+'%</small><div class="science-meter"><i style="width:'+soil.fertility+'%"></i></div><small>Độ ẩm: '+Math.round(soil.moisture)+'% · Độ nén: '+Math.round(soil.compaction)+'%</small><div class="science-meter"><i style="width:'+soil.moisture+'%"></i></div>'+(state.plots[selected]?'<small>Đang trồng: '+(seeds[state.plots[selected].type]?.name||"Cây trồng")+'</small>':'<small>Ô đất đang trống.</small>')+'</div>';
      panel.querySelector("#science-soil-stock").textContent="Phân ủ: "+ag().inventory.compost+" · Phân chuồng đã thu: "+((ag().livestock.products||{}).manure||0);
      panel.querySelector("#science-life-cycle").innerHTML=state.plots.map((plot,i)=>{if(!plot)return '<div class="science-life-row"><b>Ô '+(i+1)+'</b><span>Chưa gieo hạt</span></div>';const p=progress(plot);return '<div class="science-life-row"><b>Ô '+(i+1)+' · '+(seeds[plot.type]?.name||"Cây")+'</b><span>'+getStageLabel(p)+' · '+Math.round(p*100)+'%</span></div>';}).join("");
      panel.querySelector("#science-pest-status").innerHTML=state.plots.map((plot,i)=>{if(!plot)return '';const st=statusFor(i),risk=st.pestLoad||st.diseaseLoad;return '<div class="science-life-row"><b>Ô '+(i+1)+'</b><span>'+(risk?((st.pest||st.disease||"Có dấu hiệu bất thường")+" · "+Math.max(st.pestLoad,st.diseaseLoad)+"%"):'✅ Chưa phát hiện sâu bệnh')+'</span></div>';}).join("")||'<p class="science-hint">Chưa có cây trồng cần theo dõi.</p>';
      panel.querySelector("#science-pest-stock").textContent="Bọ rùa: "+ag().beneficial.ladybugs+" · Ong có ích: "+ag().beneficial.bees+" · Chế phẩm sinh học: "+ag().inventory.organicSpray;
      const live=ag().livestock,products=live.products||{};panel.querySelector("#science-livestock-status").innerHTML='<div class="science-livestock-grid"><span>🐔 Gà: <b>'+live.chicken+'</b></span><span>🐄 Bò: <b>'+live.cow+'</b></span><span>🐐 Dê: <b>'+live.goat+'</b></span><span>🍽️ Độ no: <b>'+live.hunger+'%</b></span><span>💧 Nước: <b>'+live.water+'%</b></span><span>💚 Sức khỏe: <b>'+live.health+'%</b></span></div><p class="science-hint">Sản phẩm chờ thu: '+live.eggs+' trứng · '+live.milk+' sữa · '+ag().inventory.manure+' phân chuồng. Trong kho: '+(products.eggs||0)+' trứng · '+(products.milk||0)+' sữa · '+(products.manure||0)+' phân.</p>';
      panel.querySelector("#science-livestock-stock").textContent="Thức ăn còn: "+ag().inventory.feed+" phần · Mỗi ngày vật nuôi khỏe tạo ra sản phẩm.";
      const goods=allMarketGoods();panel.querySelector("#science-market-item").innerHTML=goods.map(x=>'<option value="'+x.id+'">'+x.icon+' '+x.name+' · '+x.count+' món</option>').join("")||'<option value="">Chưa có nông sản hoặc sản phẩm chăn nuôi</option>';
      const marketShowcase=goods.length?goods.slice(0,6):["sunflower","carrot","strawberry","blueberry","moonflower"].filter(id=>seeds[id]).map(id=>({id,name:seeds[id].name,icon:seeds[id].icon,count:0,base:seeds[id].reward}));
      panel.querySelector("#science-market-prices").innerHTML=marketShowcase.map(x=>{const price=Math.max(1,Math.floor(x.base*marketFactor(x.id)));return '<div class="science-market-row"><span>'+x.icon+' '+x.name+'</span><b>'+price+' xu</b><small>Kho: '+x.count+'</small></div>';}).join("")||'<p class="science-hint">Hãy thu hoạch cây hoặc thu sản phẩm từ chuồng để bán.</p>';
      panel.querySelector("#science-market-note").textContent="Giá thay đổi lúc 00:00 giờ Việt Nam. Thời tiết và nhu cầu mô phỏng tạo ra biến động giá.";
      panel.querySelector("#science-climate-status").innerHTML='<div class="science-climate-number">'+Math.round(climate.temperature)+'°C</div><b>'+climate.weather.icon+' '+climate.weather.name+'</b><p>'+climate.lightText+' · Độ ẩm không khí '+Math.round(climate.humidity)+'%</p>';
      panel.querySelector("#science-light-bar").style.width=Math.round(climate.light*100)+"%";panel.querySelector("#science-humidity-bar").style.width=climate.humidity+"%";
    }
    function init(){
      const panel=ensurePanel();applyDailySimulation();render();
      let lastDay=vnParts().key;
      setInterval(()=>{const day=vnParts().key;if(day!==lastDay){lastDay=day;applyDailySimulation();render();notify("🌱 Dữ liệu đất, sâu bệnh, chăn nuôi và thị trường đã sang ngày mới.");}else render();},60000);
      window.addEventListener("focus",()=>{applyDailySimulation();render();});
      window.addEventListener("storage",e=>{if(e.key===GAME_KEY){applyDailySimulation();render();}});
    }
    return {init,render,getGrowthFactor,getStageLabel,getMarketFactor,onPlant,onHarvest};
  }

  farmScienceSystem=createFarmScienceSystem();
  weatherSystem.init();
  farmScienceSystem.init();

})();
