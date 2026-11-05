(() => {
  "use strict";
  const GAME_KEY = "aeCayKheVuonTriThuc_v1";
  const QUIZ_KEY = "soPhieuQuiz"; 
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
    moThuThachSach();
  }
  function plant(index){
    if(state.plots[index]){harvest(index);return;}
    const type=state.selectedSeed, seed=seeds[type];
    if(!seed || (state.seeds[type]||0)<=0){notify("Bạn đã hết hạt giống này. Hãy mua thêm trong cửa hàng.");return;}
    state.seeds[type]--;state.plots[index]={type,plantedAt:Date.now(),watered:false};
    state.tasks.plant=true;save();render();notify("Đã gieo "+seed.name+"! Cây sẽ lớn dần.");
    moThuThachSach();
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
    moThuThachSach();
  }
  function waterAll(){
    const growing=state.plots.filter(Boolean);if(!growing.length){notify("Vườn chưa có cây để tưới.");return;}
    growing.forEach(p=>p.watered=true);state.tasks.water=true;save();render();notify("Đã tưới nước cho khu vườn! 💧");
    moThuThachSach();
  }
  function feedPet(){
    if(state.coins<5){notify("Bạn cần 5 xu để mua thức ăn cho pet.");return;}
    if(state.pet.hunger>=100){notify("Pet đã no căng rồi!");return;}
    state.coins-=5;state.totalSpent+=5;state.pet.hunger=Math.min(100,state.pet.hunger+30);state.pet.bond=Math.min(100,state.pet.bond+3);save();render();notify("Mèo Mướp ăn ngon lành! 🍓");
    moThuThachSach();
  }
  function playPet(){
    state.pet.bond=Math.min(100,state.pet.bond+10);state.pet.hunger=Math.max(0,state.pet.hunger-5);state.tasks.play=true;save();render();notify("Pet rất vui khi được chơi cùng bạn! 💚");
    moThuThachSach();
  }
  function buyTicket(){
    const cost=25;if(state.coins<cost){notify("Bạn cần 25 xu để đổi 1 phiếu Quiz.");return;}
    const current=quizTickets();localStorage.setItem(QUIZ_KEY,String(current+1));
    state.coins-=cost;state.totalSpent+=cost;state.lastAction="Đã đổi 1 phiếu Quiz";save();render();

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

  const elapsed=Math.floor((Date.now()-(state.lastCare||Date.now()))/60000);
  if(elapsed>0){state.pet.hunger=Math.max(0,state.pet.hunger-Math.min(25,elapsed));state.lastCare=Date.now();save();}
  render();

  setInterval(()=>{if(state.plots.some(Boolean))renderPlots();},1000);

  window.addEventListener("storage",e=>{if(e.key===QUIZ_KEY)renderInventory();});
})();
// ===============================
// THỬ THÁCH SÁCH SỬA ĐỔI LỐI LÀM VIỆC
// ===============================

var quizSachDangMo = false;
var quizSachDaTraLoi = false;

// Danh sách câu hỏi
var cauHoiSach = [
    {
        cauHoi: "Tác phẩm Sửa đổi lối làm việc do ai viết?",
        dapAn: ["Trần Phú", "Hồ Chí Minh", "Võ Nguyên Giáp", "Phạm Văn Đồng"],
        dapAnDung: 1,
        giaiThich: "Tác phẩm do Hồ Chí Minh viết."
    },
    {
        cauHoi: "Tác phẩm được viết vào thời gian nào?",
        dapAn: ["Năm 1930", "Năm 1945", "Tháng 10 năm 1947", "Năm 1954"],
        dapAnDung: 2,
        giaiThich: "Tác phẩm được viết vào tháng 10 năm 1947."
    },
    {
        cauHoi: "Tác giả sử dụng bút danh nào?",
        dapAn: ["Nguyễn Ái Quốc", "X.Y.Z", "T.L", "Văn Ba"],
        dapAnDung: 1,
        giaiThich: "Tác phẩm được viết dưới bút danh X.Y.Z."
    },
    {
        cauHoi: "Tác phẩm có bao nhiêu phần chính?",
        dapAn: ["4 phần", "5 phần", "6 phần", "8 phần"],
        dapAnDung: 2,
        giaiThich: "Tác phẩm gồm 6 phần chính."
    },
    {
        cauHoi: "Mục đích chính của tác phẩm là gì?",
        dapAn: [
            "Hướng dẫn lập trình",
            "Sửa chữa khuyết điểm và cải thiện cách làm việc",
            "Hướng dẫn kinh doanh",
            "Dạy quản lý tài chính"
        ],
        dapAnDung: 1,
        giaiThich: "Tác phẩm hướng đến việc sửa chữa khuyết điểm và nâng cao chất lượng công tác."
    },
    {
        cauHoi: "Tự phê bình có ý nghĩa gì?",
        dapAn: [
            "Nhận ra thiếu sót của bản thân",
            "Chỉ trích người khác",
            "Tránh trách nhiệm",
            "Chứng minh mình luôn đúng"
        ],
        dapAnDung: 0,
        giaiThich: "Tự phê bình giúp mỗi người nhận ra và khắc phục thiếu sót."
    },
    {
        cauHoi: "Khi được góp ý, chúng ta nên làm gì?",
        dapAn: [
            "Tức giận",
            "Không quan tâm",
            "Lắng nghe và xem xét",
            "Đổ lỗi cho người khác"
        ],
        dapAnDung: 2,
        giaiThich: "Biết tiếp thu góp ý giúp bản thân tiến bộ."
    },
    {
        cauHoi: "Phê bình người khác nên có thái độ như thế nào?",
        dapAn: [
            "Công kích cá nhân",
            "Chân thành và có tinh thần xây dựng",
            "Chế giễu",
            "Nói theo tin đồn"
        ],
        dapAnDung: 1,
        giaiThich: "Phê bình cần trung thực và hướng đến sửa chữa."
    },
    {
        cauHoi: "Trong làm việc nhóm, khi một thành viên mắc lỗi nên làm gì?",
        dapAn: [
            "Đổ lỗi cho thành viên đó",
            "Bỏ mặc công việc",
            "Cùng phân tích và tìm cách khắc phục",
            "Xóa tên thành viên"
        ],
        dapAnDung: 2,
        giaiThich: "Cần góp ý xây dựng và cùng nhau sửa lỗi."
    },
    {
        cauHoi: "Theo tinh thần tác phẩm, lời nói cần đi đôi với điều gì?",
        dapAn: [
            "Việc làm",
            "Sự khoe khoang",
            "Lời hứa suông",
            "Sự chỉ trích"
        ],
        dapAnDung: 0,
        giaiThich: "Lời nói cần được thể hiện bằng hành động thực tế."
    },
    {
        cauHoi: "Khi phát hiện chương trình bị lỗi, sinh viên CNTT nên làm gì?",
        dapAn: [
            "Bỏ qua lỗi",
            "Đổ lỗi cho máy tính",
            "Tìm nguyên nhân và sửa lỗi",
            "Xóa toàn bộ bài làm"
        ],
        dapAnDung: 2,
        giaiThich: "Cần nhận ra thiếu sót và chủ động sửa chữa."
    },
    {
        cauHoi: "Một nhóm thường xuyên mắc cùng một lỗi nên làm gì?",
        dapAn: [
            "Tiếp tục làm như cũ",
            "Tìm nguyên nhân và thay đổi cách làm",
            "Đổ lỗi cho người mới",
            "Bỏ dự án"
        ],
        dapAnDung: 1,
        giaiThich: "Tìm nguyên nhân giúp tránh lặp lại sai sót."
    },
    {
        cauHoi: "Điều gì thể hiện tinh thần trách nhiệm?",
        dapAn: [
            "Làm qua loa",
            "Để người khác làm thay",
            "Hoàn thành nhiệm vụ đúng yêu cầu",
            "Che giấu lỗi"
        ],
        dapAnDung: 2,
        giaiThich: "Trách nhiệm thể hiện qua hành động và kết quả công việc."
    },
    {
        cauHoi: "Vì sao cần lắng nghe ý kiến tập thể?",
        dapAn: [
            "Để tránh làm việc",
            "Để có thêm góc nhìn và cải thiện công việc",
            "Để trì hoãn nhiệm vụ",
            "Để đổ lỗi"
        ],
        dapAnDung: 1,
        giaiThich: "Lắng nghe giúp nhận ra thiếu sót và tìm giải pháp tốt hơn."
    },
    {
        cauHoi: "Bài học quan trọng khi vận dụng tác phẩm là gì?",
        dapAn: [
            "Luôn cho rằng mình đúng",
            "Không cần thay đổi",
            "Thường xuyên nhìn nhận và sửa đổi bản thân",
            "Chỉ cần nói hay"
        ],
        dapAnDung: 2,
        giaiThich: "Mỗi người cần thường xuyên tự nhìn nhận và hoàn thiện bản thân."
    }
];

function moThuThachSach() {

    if (quizSachDangMo) return;

    if (Math.random() > 0.65) return;

    var popup = document.getElementById("quizSachPopup");

    if (!popup) {
        console.log("Chưa tìm thấy HTML quizSachPopup");
        return;
    }

    quizSachDangMo = true;
    quizSachDaTraLoi = false;

    var viTri = Math.floor(Math.random() * cauHoiSach.length);
    var cau = cauHoiSach[viTri];

    popup.style.display = "flex";

    document.getElementById("quizSachCauHoi").textContent =
        cau.cauHoi;

    document.getElementById("quizSachKetQua").innerHTML = "";

    document.getElementById("quizSachDong").style.display = "none";

    var html = "";

    for (var i = 0; i < cau.dapAn.length; i++) {
        html += '<button onclick="traLoiQuizSach(' + i + ',' + viTri + ')">' +
            String.fromCharCode(65 + i) + ". " +
            cau.dapAn[i] +
            '</button>';
    }

    document.getElementById("quizSachDapAn").innerHTML = html;
}

function traLoiQuizSach(chon, viTri) {

    if (quizSachDaTraLoi) return;

    quizSachDaTraLoi = true;

    var cau = cauHoiSach[viTri];

    var cacNut = document.getElementById("quizSachDapAn").children;

    if (chon === cau.dapAnDung) {

        state.coins += 10;

        save();
        render();

        document.getElementById("quizSachKetQua").innerHTML =
            "🎉 Chính xác! Bạn nhận được +10 xu!<br>" +
            cau.giaiThich;

        cacNut[chon].classList.add("dung");

    } else {

        document.getElementById("quizSachKetQua").innerHTML =
            "❌ Chưa chính xác!<br>" +
            "Đáp án đúng: " + cau.dapAn[cau.dapAnDung] +
            "<br>" + cau.giaiThich;

        cacNut[chon].classList.add("sai");
        cacNut[cau.dapAnDung].classList.add("dung");
    }

    document.getElementById("quizSachDong").style.display =
        "inline-block";
}

function dongQuizSach() {

    document.getElementById("quizSachPopup").style.display = "none";

    quizSachDangMo = false;
}
