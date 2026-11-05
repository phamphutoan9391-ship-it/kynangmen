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
    actionQuizIndex:0, actionQuizCorrect:0,
    lastCare:Date.now(), lastAction:"Chào mừng bạn đến với khu vườn!"
  };
  let state = loadState();
  
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
          plots:Array.isArray(saved.plots)?saved.plots.slice(0,6):Array(6).fill(null)};
      }
    }catch(e){}
    return structuredClone(defaultState);
  }
  function save(){localStorage.setItem(GAME_KEY,JSON.stringify(state));}
  function quizTickets(){return Math.max(0,Number(localStorage.getItem(QUIZ_KEY))||0);}
  function setCoins(value){state.coins=Math.max(0,Math.floor(value));save();render();}
  function notify(message){const el=$("toast");el.textContent=message;el.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove("show"),2400);}

  // Bo cau hoi dung chung: moi thao tac lam thay doi tien trinh deu phai qua cau hoi sach.
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
    state.tasks.plant=true;save();render();notify("Đã gieo "+seed.name+"! Cây sẽ lớn dần.");
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
    state.tasks.water=true;save();render();notify("Đã dùng "+growing.length+" bình nước. Cây phát triển nhanh hơn 50%! 💧");
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
    state.pet.bond=Math.min(100,state.pet.bond+10);state.pet.hunger=Math.max(0,state.pet.hunger-5);state.tasks.play=true;save();render();notify("Pet rất vui khi được chơi cùng bạn! 💚");
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
  const cropCatalog=makeCatalog(['Cà chua','Dâu','Ớt','Bí','Đậu','Khoai','Ngô','Cải','Hoa','Lúa','Táo','Lê','Nho','Cam'],['đỏ','vàng','tím','xanh','mật ong','pha lê','sao','băng','mặt trời','rừng','sa mạc'],['🍅','🍓','🌶️','🎃','🫘','🥔','🌽','🥬','🌼','🌾','🍎','🍐','🍇','🍊'],140,'crop');
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
  function renderResearchSeedShop(){
    const host=$("research-seed-shop");if(!host)return;
    const unlocked=(state.unlockedResearchSeeds||[]).filter(id=>seeds[id]);
    host.innerHTML=unlocked.map(id=>{
      const seed=seeds[id];
      return '<article class="shop-card panel research-seed-card"><div class="shop-art">'+seed.icon+'</div><h3>'+seed.name+'</h3><p>Giống đã được khám phá trong phòng thí nghiệm. Thu hoạch nhận '+seed.reward+' xu.</p><div class="shop-bottom"><b>'+seed.cost+' xu</b><button class="primary" data-research-buy="'+id+'">Mua hạt</button></div><small class="hint">Trong túi: '+(state.seeds[id]||0)+'</small></article>';
    }).join("")||'<div class="panel research-empty">🔒 Chưa có giống nghiên cứu nào được mở khóa. Hãy vào phòng thí nghiệm và chọn “Mở giống cây”.</div>';
    host.querySelectorAll('[data-research-buy]').forEach(btn=>btn.addEventListener('click',()=>askBeforeFarmAction('Mua hạt giống nghiên cứu',()=>buySeed(btn.dataset.researchBuy))));
  }
  function rollPetVariant(){
    const r=Math.random();
    if(r<0.02)return {id:"galaxy",name:"Galaxy",bonus:20};
    if(r<0.10)return {id:"golden",name:"Golden",bonus:12};
    if(r<0.30)return {id:"shiny",name:"Shiny",bonus:6};
    return {id:"normal",name:"Thường",bonus:0};
  }
  function discover(kind,cost,catalog){if((state.researchPoints||0)<cost){notify('Chưa đủ điểm bé ngoan!');return;}const owned=state.collections[kind]||[];const available=catalog.filter(x=>!owned.includes(x.id));if(!available.length){notify('Bạn đã sưu tầm đủ bộ này rồi!');return;}state.researchPoints-=cost;const item=available[Math.floor(Math.random()*available.length)];owned.push(item.id);state.collections[kind]=owned;if(kind==='crops'){unlockResearchSeed(item);if(state.story&&state.story.chapter2MucDone&&!state.story.chapter2ResearchDone){state.story.chapter2ResearchDone=true;state.coins+=15;state.researchPoints+=5;state.lastAction='Hoàn thành Chương 2: +15 xu, +5 điểm nghiên cứu';}}if(kind==='pets'){state.activePet=item.id;const variant=rollPetVariant();state.pet={...state.pet,name:item.name,icon:item.icon,variant:variant.id,variantName:variant.name,bonus:variant.bonus};}if(kind==='chickens'){state.activeChicken=item.id;}save();render();renderCollection();renderEvolutionLab();$('collection-result').textContent=item.icon+' '+item.name+' · '+item.rank+' · Chỉ số '+item.power+' · Thưởng '+item.bonus+(kind==='pets'?' · '+state.pet.variantName:'');notify('Đã mở khóa '+item.name+(kind==='pets'?' · '+state.pet.variantName:'')+'!');}
  function renderCollection(){const groups=[['crops',cropCatalog],['research',researchCatalog],['pets',petCatalog],['chickens',chickenCatalog]];groups.forEach(([key,list])=>{const el=$('count-'+key);if(el)el.textContent=(state.collections[key]||[]).length+'/'+list.length;});const all=[...cropCatalog.map(x=>({...x,group:'Cây trồng',key:'crops'})),...researchCatalog.map(x=>({...x,group:'Cây nghiên cứu',key:'research'})),...petCatalog.map(x=>({...x,group:'Pet',key:'pets'})),...chickenCatalog.map(x=>({...x,group:'Giống gà',key:'chickens'}))];$('collection-book').innerHTML=all.filter(x=>(state.collections[x.key]||[]).includes(x.id)).map(x=>'<div class="collection-entry">'+x.icon+' <b>'+x.name+'</b><small>'+x.group+' · '+x.rank+' · Chỉ số '+x.power+' · Bonus '+x.bonus+'</small></div>').join('')||'Chưa có mục sưu tầm nào.';}
  $('collect-crop').addEventListener('click',()=>askBeforeFarmAction('Mở khóa giống cây',()=>discover('crops',5,cropCatalog)));
  $('research-crop').addEventListener('click',()=>askBeforeFarmAction('Nghiên cứu cây trồng',()=>discover('research',5,researchCatalog)));
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
    if(state.coins<10){notify("Cần 10 xu cho chi phí nghiên cứu lai tạo.");return;}
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
      $("breed-result").textContent="🎉 Khám phá giống mới: "+hybrid.icon+" "+hybrid.name+"! Nhận 2 hạt giống lai và +5 điểm nghiên cứu.";
    }else{
      state.seeds[key]=(state.seeds[key]||0)+2;
      $("breed-result").textContent="Đã lai lại thành công! Nhận thêm 2 hạt giống "+state.hybrids[key].name+".";
    }
    state.labLevel=Math.min(5,Math.max(1,1+Math.floor(state.researchPoints/30)));
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
    state.labLevel=Math.min(5,Math.max(1,1+Math.floor(state.researchPoints/30)));
    $("delivery-result").textContent="✅ Đã giao "+amount+" "+seeds[type].name+" đến "+district+". Nhận +"+reward+" xu và +"+(amount*2)+" điểm nghiên cứu.";
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
    renderPlots();renderSeeds();renderInventory();renderTasks();renderStory();renderEvolutionLab();renderCollection();renderBreeding();renderDelivery();renderResearchSeedShop();
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
 
  window.addEventListener("storage",e=>{if(e.key===QUIZ_KEY)renderInventory();});
  
// =====================================
// NHIỆM VỤ NÔNG TRẠI TỰ LÀM MỚI MỖI 5 PHÚT
// =====================================

const TASK_REFRESH_TIME = 5 * 60 * 1000;
const TASK_REFRESH_KEY = "aeCayKhe_taskRefreshAt_v1";

// Lấy thời gian làm mới đã lưu
let taskRefreshAt = Number(localStorage.getItem(TASK_REFRESH_KEY));

// Nếu chưa có thời gian thì bắt đầu chu kỳ 5 phút
if (!taskRefreshAt || !Number.isFinite(taskRefreshAt)) {
    taskRefreshAt = Date.now() + TASK_REFRESH_TIME;
    localStorage.setItem(TASK_REFRESH_KEY, taskRefreshAt);
}

// Tạo bộ đếm ngược ở tiêu đề nhiệm vụ
const taskHeading = document.querySelector("#page-tasks .section-heading");

let taskTimer = document.getElementById("task-reset-timer");

if (taskHeading && !taskTimer) {
    taskTimer = document.createElement("span");
    taskTimer.id = "task-reset-timer";
    taskTimer.className = "tag";
    taskTimer.style.marginLeft = "auto";
    taskTimer.style.color = "#287a48";
    taskHeading.appendChild(taskTimer);
}

function resetFarmTasks() {

    const taskList = ["plant", "water", "play", "harvest"];

    taskList.forEach(function(task) {
        state.tasks[task] = false;
        state.tasks["claimed_" + task] = false;
    });

    taskRefreshAt = Date.now() + TASK_REFRESH_TIME;

    localStorage.setItem(TASK_REFRESH_KEY, taskRefreshAt);

    save();
    renderTasks();

    notify("🔄 Nhiệm vụ đã được làm mới! Hãy tiếp tục chăm sóc khu vườn.");
}

function updateTaskTimer() {

    const now = Date.now();

    if (now >= taskRefreshAt) {
        resetFarmTasks();
    }

    const remaining = Math.max(0, taskRefreshAt - Date.now());

    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);

    if (taskTimer) {
        taskTimer.textContent =
            "⏳ Làm mới sau " +
            String(minutes).padStart(2, "0") +
            ":" +
            String(seconds).padStart(2, "0");
    }
}

window.addEventListener("storage", function(event) {
    if (event.key === TASK_REFRESH_KEY && event.newValue) {
        taskRefreshAt = Number(event.newValue);
    }
});

updateTaskTimer();
setInterval(updateTaskTimer, 1000);

})();
