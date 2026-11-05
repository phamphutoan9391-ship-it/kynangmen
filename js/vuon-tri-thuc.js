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
    hybrids:{}, produce:{}, deliveryCount:0, deliveryHistory:[], collections:{crops:[],research:[],pets:[],chickens:[]}, activePet:null, activeChicken:null, pet:{name:"Mèo Mướp",icon:"🐱",hunger:70,bond:0,variant:"normal",bonus:0},
    selectedSeed:"sunflower", seeds:{sunflower:3,carrot:1,strawberry:0,blueberry:0,moonflower:0},
    plots:Array(6).fill(null), tasks:{plant:false,water:false,play:false,harvest:false},
    story:{chapter2MucAccepted:false,chapter2MucDone:false,chapter2ResearchDone:false},
    dailyPlant:{dateKey:"",cropId:"",claimed:false},
    actionQuizIndex:0, actionQuizCorrect:0,
    lastCare:Date.now(), lastAction:"Chào mừng bạn đến với khu vườn!"
  };
  let state = loadState();
  let trackSeasonalEventAction = function(){};
  
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
          collections:{...defaultState.collections,...(saved.collections||{})},
          hybrids:saved.hybrids||{}, produce:saved.produce||{}, deliveryCount:saved.deliveryCount||0, deliveryHistory:saved.deliveryHistory||[],
          seeds:{...defaultState.seeds,...saved.seeds},
          tasks:{...defaultState.tasks,...saved.tasks},
          story:{...defaultState.story,...(saved.story||{})},
          dailyPlant:{...defaultState.dailyPlant,...(saved.dailyPlant||{})},
          plots:Array.isArray(saved.plots)?saved.plots.slice(0,6):Array(6).fill(null)};
      }
    }catch(e){}
    return structuredClone(defaultState);
  }
  function save(){localStorage.setItem(GAME_KEY,JSON.stringify(state));}
  function quizTickets(){return Math.max(0,Number(localStorage.getItem(QUIZ_KEY))||0);}
  function setCoins(value){state.coins=Math.max(0,Math.floor(value));save();render();}
  function notify(message){const el=$("toast");el.textContent=message;el.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove("show"),2400);}

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
    {q:"Điều nào thể hiện tinh thần học hỏi để tiến bộ?",a:["Không tiếp nhận góp ý","Cho rằng mình luôn đúng","Thường xuyên xem lại cách làm và điều chỉnh khi cần","Lặp lại sai sót mà không rút kinh nghiệm"],correct:2,why:"Tự xem xét và điều chỉnh cách làm là biểu hiện của tinh thần học hỏi, sửa đổi."}
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
      '<p class="book-quiz-desc">Mỗi thao tác trong nông trại cần một câu trả lời đúng về sách <b>Sửa đổi lối làm việc</b>.</p>'+ 
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
    state.seeds[type]--;state.plots[index]={type,plantedAt:Date.now(),watered:false};
    state.tasks.plant=true;trackSeasonalEventAction("plant",type,1);save();render();notify("Đã gieo "+seed.name+"! Cây sẽ lớn dần.");
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
    return Math.min(1,elapsed/(seed.seconds*1000));
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
    state.produce=state.produce||{};
    state.produce[plot.type]=(state.produce[plot.type]||0)+1;
    state.bonusSeeds=(state.bonusSeeds||0)+seedBonus;
    const waterDrop=Math.random()<0.15;
    if(waterDrop)state.waterBottles=(state.waterBottles||0)+1;
    state.harvests++;
    state.plots[index]=null;
    state.tasks.harvest=true;
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
    growing.forEach(p=>{p.watered=true;p.wateredAt=Date.now();});
    state.tasks.water=true;trackSeasonalEventAction("water",null,growing.length);save();render();notify("Đã dùng "+growing.length+" bình nước. Cây phát triển nhanh hơn 50%! 💧");
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
    state.pet.bond=Math.min(100,state.pet.bond+10);state.pet.hunger=Math.max(0,state.pet.hunger-5);state.tasks.play=true;trackSeasonalEventAction("play",null,1);save();render();notify("Pet rất vui khi được chơi cùng bạn! 💚");
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
  function claimTask(task){
    const rewards={plant:5,water:5,play:5,harvest:10};
    if(!state.tasks[task]){notify("Bạn chưa hoàn thành nhiệm vụ này.");return;}
    if(state.tasks["claimed_"+task]){notify("Nhiệm vụ này đã nhận thưởng rồi.");return;}
    state.tasks["claimed_"+task]=true;state.coins+=rewards[task];save();render();notify("Hoàn thành nhiệm vụ! +"+rewards[task]+" xu.");
  }
  function renderPlots(){
    $("plots").innerHTML="";
    state.plots.forEach((plot,index)=>{
      const button=document.createElement("button");button.className="plot"+(plot&&progress(plot)>=1?" ready":"")+(plot?"":" empty");
      if(!plot){button.innerHTML='<span class="crop">＋</span><small>Ô đất trống</small>';button.addEventListener("click",()=>askBeforeFarmAction("Trồng cây",()=>plant(index)));}
      else{
        const stage=cropStage(plot),seed=seeds[plot.type],remaining=Math.max(0,Math.ceil(seed.seconds*(1-progress(plot))));
        button.innerHTML='<span class="crop">'+cropIcons[plot.type][stage]+'</span><small>'+seed.name+' · '+(stage===3?"Đã chín":remaining+" giây")+'</small>';
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
  function discover(kind,cost,catalog){if((state.researchPoints||0)<cost){notify('Chưa đủ điểm bé ngoan!');return;}const owned=state.collections[kind]||[];const available=catalog.filter(x=>!owned.includes(x.id));if(!available.length){notify('Bạn đã sưu tầm đủ bộ này rồi!');return;}state.researchPoints-=cost;const item=available[Math.floor(Math.random()*available.length)];owned.push(item.id);state.collections[kind]=owned;if(kind==='crops'||kind==='research')trackSeasonalEventAction("research",item.id,1);if(kind==='crops'){unlockResearchSeed(item);if(state.story&&state.story.chapter2MucDone&&!state.story.chapter2ResearchDone){state.story.chapter2ResearchDone=true;state.coins+=15;state.researchPoints+=5;state.lastAction='Hoàn thành Chương 2: +15 xu, +5 điểm bé ngoan';}}if(kind==='pets'){state.activePet=item.id;const variant=rollPetVariant();state.pet={...state.pet,name:item.name,icon:item.icon,variant:variant.id,variantName:variant.name,bonus:variant.bonus};}if(kind==='chickens'){state.activeChicken=item.id;}save();render();renderCollection();renderEvolutionLab();$('collection-result').textContent=item.icon+' '+item.name+' · '+item.rank+' · Chỉ số '+item.power+' · Thưởng '+item.bonus+(kind==='pets'?' · '+state.pet.variantName:'');notify('Đã mở khóa '+item.name+(kind==='pets'?' · '+state.pet.variantName:'')+'!');}
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
    const reward=amount*(seeds[type].reward+8);
    state.produce[type]-=amount;state.coins+=reward;state.researchPoints=(state.researchPoints||0)+amount*2;
    state.deliveryCount=(state.deliveryCount||0)+1;
    state.deliveryHistory=state.deliveryHistory||[];
    state.deliveryHistory.push({crop:seeds[type].name,district,amount,coins:reward});
    trackSeasonalEventAction("deliver",type,amount);
    state.labLevel=Math.min(5,Math.max(1,1+Math.floor(state.researchPoints/30)));
    $("delivery-result").textContent="✅ Đã giao "+amount+" "+seeds[type].name+" đến "+district+". Nhận +"+reward+" xu và +"+(amount*2)+" điểm bé ngoan.";
    save();render();renderDelivery();notify("Giao hàng thành công!");
  }

  function renderInventory(){
    const seedItems=Object.keys(seeds).map(k=>({icon:seeds[k].icon,name:"Hạt giống: "+seeds[k].name,count:state.seeds[k]||0,kind:"seed"}));
    const produceItems=Object.keys(state.produce||{}).filter(k=>seeds[k]&&(state.produce[k]||0)>0).map(k=>({icon:seeds[k].icon,name:"Nông sản: "+seeds[k].name,count:state.produce[k],kind:"produce"}));
    const items=[...seedItems,...produceItems,{icon:"💧",name:"Bình nước",count:state.waterBottles||0,kind:"water"},{icon:"🎟️",name:"Phiếu Quiz",count:quizTickets(),kind:"ticket"},{icon:"🪙",name:"Xu vườn",count:state.coins,kind:"coin"}];
    $("inventory-grid").innerHTML='<div class="inventory-group-title">🌱 HẠT GIỐNG TRONG TÚI</div>'+seedItems.map(x=>'<div class="inventory-item seed-in-bag"><span>'+x.icon+'</span><b>'+x.name+'</b><small>Số lượng: <strong>'+x.count+'</strong></small></div>').join("")+'<div class="inventory-group-title">📦 NÔNG SẢN & VẬT PHẨM</div>'+[...produceItems,...items.filter(x=>x.kind==="water"||x.kind==="ticket"||x.kind==="coin")].map(x=>'<div class="inventory-item"><span>'+x.icon+'</span><b>'+x.name+'</b><small>Số lượng: <strong>'+x.count+'</strong></small></div>').join("");
  }
  function startMucQuest(){
    if(state.story.chapter2MucDone){notify("Bạn đã hoàn thành nhiệm vụ của Bình Mực rồi!");return;}
    state.story.chapter2MucAccepted=true;
    save();renderStory();
    notify("Đã nhận nhiệm vụ chương 2 từ  Bình Mực!");
  }
  function answerMucQuest(answer){
    if(!state.story.chapter2MucAccepted||state.story.chapter2MucDone)return;
    if(answer!=="a"){
      $("muc-feedback").textContent="Chưa chính xác. Mực nhắc bạn: muốn tiến bộ, chúng ta cần dũng cảm nhìn nhận điều chưa tốt và tìm cách sửa đổi. Hãy thử lại nhé!";
      return;
    }
    state.story.chapter2MucDone=true;
    state.coins+=20;
    state.researchPoints=(Number(state.researchPoints)||0)+10;
    state.labLevel=Math.min(5,Math.max(1,1+Math.floor(state.researchPoints/30)));
    state.lastAction="Hoàn thành nhiệm vụ Mực: +20 xu bé ngoan, +10 điểm  bé ngoan";
    save();render();renderStory();
    notify("Chính xác! +20 xu bé ngoan và +10 điểm bé ngoan.");
  }
  function renderStory(){
    const story=state.story||defaultState.story;
    const start=$("muc-start-area"),answers=$("muc-answer-area"),next=$("chapter2-next-step"),complete=$("chapter2-complete");
    if(!start||!answers||!next||!complete)return;
    start.hidden=!!story.chapter2MucAccepted||!!story.chapter2MucDone;
    answers.hidden=!story.chapter2MucAccepted||!!story.chapter2MucDone;
    next.hidden=!story.chapter2MucDone;
    complete.hidden=!story.chapter2ResearchDone;
    $("chapter2-progress").textContent=(story.chapter2MucDone?1:0)+(story.chapter2ResearchDone?1:0)+"/2 nhiệm vụ";
    if(story.chapter2MucDone){
      $("muc-dialogue").textContent="“Tốt lắm! Nhận ra khuyết điểm là bước đầu. Bây giờ hãy dùng kiến thức để khám phá một giống cây mới trong phòng thí nghiệm.”";
      $("muc-feedback").textContent="✅ Đã hoàn thành: Nhìn nhận khuyết điểm và sửa đổi. Phần thưởng: 20 xu bé ngoan và 10 điểm bé ngoan.";
      $("chapter2-next-status").textContent=story.chapter2ResearchDone?"Tiến độ: Đã hoàn thành":"Tiến độ: Chưa hoàn thành – hãy khám phá 1 giống cây trong phòng thí nghiệm.";
    }else if(story.chapter2MucAccepted){
      $("muc-dialogue").textContent="“Hãy suy nghĩ kỹ nhé. Người biết sửa đổi sẽ ngày càng tiến bộ.”";
      $("muc-feedback").textContent="Nhiệm vụ đang thực hiện: Chọn đáp án đúng để giúp Mực khôi phục trang sách.";
    }
  }
  $("muc-start-quest").addEventListener("click",startMucQuest);
  document.querySelectorAll("[data-muc-answer]").forEach(btn=>btn.addEventListener("click",()=>answerMucQuest(btn.dataset.mucAnswer)));

  function renderTasks(){
    document.querySelectorAll(".task-btn").forEach(btn=>{
      const key=btn.dataset.task,claimed=!!state.tasks["claimed_"+key],done=!!state.tasks[key];
      btn.disabled=!done||claimed;btn.textContent=claimed?"Đã nhận":done?"Nhận thưởng":"Chưa hoàn thành";
    });
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
  // Cap nhat dong ho va tu chuyen cay moi khi sang ngay moi (gio Viet Nam).
  setInterval(updateDailyPlantClock,1000);
 
  window.addEventListener("storage",e=>{if(e.key===QUIZ_KEY)renderInventory();});
 
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

      // Nhiệm vụ tuần: ba mục tiêu thay đổi theo tuần, reset vào thứ Hai 00:00 giờ Việt Nam.
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

})();
