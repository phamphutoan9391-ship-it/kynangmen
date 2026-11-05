(() => {
  "use strict";
  const GAME_KEY = "aeCayKheVuonTriThuc_v1";
  const QUIZ_KEY = "soPhieuQuiz"; // Khóa phiếu Quiz dùng chung với website chính
  const seeds = {
    sunflower: {name:"Hướng dương", icon:"🌻", cost:4, reward:12, seconds:25, amount:0},
    carrot: {name:"Cà rốt", icon:"🥕", cost:6, reward:18, seconds:40, amount:0},
    strawberry: {name:"Dâu tây", icon:"🍓", cost:10, reward:30, seconds:60, amount:0}
  };
  const defaultState = {
    coins:30, level:1, harvests:0, totalSpent:0, pet:{name:"Mèo Mướp",icon:"🐱",hunger:70,bond:0},
    selectedSeed:"sunflower", seeds:{sunflower:3,carrot:1,strawberry:0},
    plots:Array(6).fill(null), tasks:{plant:false,water:false,play:false,harvest:false},
    lastCare:Date.now(), lastAction:"Chào mừng bạn đến với khu vườn!"
  };
  let state = loadState();
  let toastTimer;
  const $ = id => document.getElementById(id);
  function loadState(){
    try{
      const saved=JSON.parse(localStorage.getItem(GAME_KEY));
      if(saved && typeof saved==="object"){
        return {...structuredClone(defaultState),...saved,
          pet:{...defaultState.pet,...saved.pet},
          seeds:{...defaultState.seeds,...saved.seeds},
          tasks:{...defaultState.tasks,...saved.tasks},
          plots:Array.isArray(saved.plots)?saved.plots.slice(0,6):Array(6).fill(null)};
      }
    }catch(e){}
    return structuredClone(defaultState);
  }
  function save(){localStorage.setItem(GAME_KEY,JSON.stringify(state));}
  function quizTickets(){return Math.max(0,Number(localStorage.getItem(QUIZ_KEY))||0);}
  function setCoins(value){state.coins=Math.max(0,Math.floor(value));save();render();}
  function notify(message){const el=$("toast");el.textContent=message;el.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove("show"),2400);}
  function switchTab(tab){
    document.querySelectorAll(".tab").forEach(b=>b.classList.toggle("active",b.dataset.tab===tab));
    document.querySelectorAll(".tab-page").forEach(p=>p.classList.toggle("active",p.id==="page-"+tab));
  }
  document.querySelectorAll(".tab").forEach(b=>b.addEventListener("click",()=>switchTab(b.dataset.tab)));
  function buySeed(type){
    const seed=seeds[type]; if(!seed)return;
    if(state.coins<seed.cost){notify("Bạn chưa đủ xu để mua hạt giống!");return;}
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
    const seed=seeds[plot.type];return Math.min(1,(Date.now()-plot.plantedAt)/(seed.seconds*1000));
  }
  function cropStage(plot){
    const p=progress(plot);if(p>=1)return 3;if(p>=.55)return 2;if(p>=.2)return 1;return 0;
  }
  const cropIcons={sunflower:["🌱","🌿","🌻","🌻"],carrot:["🌱","🌿","🥬","🥕"],strawberry:["🌱","🌿","🍃","🍓"]};
  function harvest(index){
    const plot=state.plots[index];if(!plot)return;
    if(progress(plot)<1){notify("Cây chưa chín đâu! Hãy chờ thêm một chút.");return;}
    const seed=seeds[plot.type];state.coins+=seed.reward;state.harvests++;state.plots[index]=null;state.tasks.harvest=true;
    state.level=1+Math.floor(state.harvests/5);save();render();notify("Thu hoạch thành công! +"+seed.reward+" xu.");
  }
  function waterAll(){
    const growing=state.plots.filter(Boolean);if(!growing.length){notify("Vườn chưa có cây để tưới.");return;}
    growing.forEach(p=>p.watered=true);state.tasks.water=true;save();render();notify("Đã tưới nước cho khu vườn! 💧");
  }
  function feedPet(){
    if(state.coins<5){notify("Bạn cần 5 xu để mua thức ăn cho pet.");return;}
    if(state.pet.hunger>=100){notify("Pet đã no căng rồi!");return;}
    state.coins-=5;state.totalSpent+=5;state.pet.hunger=Math.min(100,state.pet.hunger+30);state.pet.bond=Math.min(100,state.pet.bond+3);save();render();notify("Mèo Mướp ăn ngon lành! 🍓");
  }
  function playPet(){
    state.pet.bond=Math.min(100,state.pet.bond+10);state.pet.hunger=Math.max(0,state.pet.hunger-5);state.tasks.play=true;save();render();notify("Pet rất vui khi được chơi cùng bạn! 💚");
  }
  function buyTicket(){
    const cost=25;if(state.coins<cost){notify("Bạn cần 25 xu để đổi 1 phiếu Quiz.");return;}
    const current=quizTickets();localStorage.setItem(QUIZ_KEY,String(current+1));
    state.coins-=cost;state.totalSpent+=cost;state.lastAction="Đã đổi 1 phiếu Quiz";save();render();
    // Báo cho tab website chính đang mở để ví Quiz cập nhật ngay.
    try{const channel=new BroadcastChannel("ae-cay-khe-quiz-wallet");channel.postMessage({type:"QUIZ_TICKETS_UPDATED",tickets:current+1});channel.close();}catch(e){}
    notify("Đổi thành công 1 phiếu Quiz! Phiếu đã được lưu.");
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
      if(!plot){button.innerHTML='<span class="crop">＋</span><small>Ô đất trống</small>';button.addEventListener("click",()=>plant(index));}
      else{
        const stage=cropStage(plot),seed=seeds[plot.type],remaining=Math.max(0,Math.ceil(seed.seconds*(1-progress(plot))));
        button.innerHTML='<span class="crop">'+cropIcons[plot.type][stage]+'</span><small>'+seed.name+' · '+(stage===3?"Đã chín":remaining+" giây")+'</small>';
        button.addEventListener("click",()=>harvest(index));
      }
      $("plots").appendChild(button);
    });
  }
  function renderSeeds(){
    $("seed-list").innerHTML="";
    Object.keys(seeds).forEach(type=>{
      const seed=seeds[type],button=document.createElement("button");button.className="seed-option"+(state.selectedSeed===type?" selected":"");
      button.innerHTML='<span>'+seed.icon+'</span><div><b>'+seed.name+'</b><small>Đang có: '+(state.seeds[type]||0)+'</small></div>';
      button.addEventListener("click",()=>{state.selectedSeed=type;save();renderSeeds();});$("seed-list").appendChild(button);
    });
  }
  function renderInventory(){
    const items=[...Object.keys(seeds).map(k=>({icon:seeds[k].icon,name:seeds[k].name,count:state.seeds[k]||0})),
      {icon:"🎟️",name:"Phiếu Quiz",count:quizTickets()},{icon:"🪙",name:"Xu vườn",count:state.coins}];
    $("inventory-grid").innerHTML=items.map(x=>'<div class="inventory-item"><span>'+x.icon+'</span><b>'+x.name+'</b><small>Số lượng: '+x.count+'</small></div>').join("");
  }
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
    $("hunger-bar").style.width=state.pet.hunger+"%";$("bond-bar").style.width=state.pet.bond+"%";
    $("pet-mood").textContent=state.pet.hunger<30?"Mình hơi đói rồi...":state.pet.bond>=70?"Mình rất quý bạn!":"Mình đang vui vẻ!";
    $("spent-total").textContent=state.totalSpent+" xu";$("cart-description").textContent=state.lastAction||"Chưa có giao dịch nào.";
    renderPlots();renderSeeds();renderInventory();renderTasks();
  }
  $("water-all").addEventListener("click",waterAll);$("feed-pet").addEventListener("click",feedPet);$("play-pet").addEventListener("click",playPet);$("buy-ticket").addEventListener("click",buyTicket);
  document.querySelectorAll(".buy-seed").forEach(b=>b.addEventListener("click",()=>buySeed(b.dataset.seed)));
  document.querySelectorAll(".task-btn").forEach(b=>b.addEventListener("click",()=>claimTask(b.dataset.task)));
  // Giảm độ no từ từ khi người chơi quay lại; không dùng bộ đếm nền.
  const elapsed=Math.floor((Date.now()-(state.lastCare||Date.now()))/60000);
  if(elapsed>0){state.pet.hunger=Math.max(0,state.pet.hunger-Math.min(25,elapsed));state.lastCare=Date.now();save();}
  render();
  // Cập nhật thời gian cây trồng mỗi giây.
  setInterval(()=>{if(state.plots.some(Boolean))renderPlots();},1000);
  // Đồng bộ phiếu nếu trang chính và game đang mở ở hai tab.
  window.addEventListener("storage",e=>{if(e.key===QUIZ_KEY)renderInventory();});
})();