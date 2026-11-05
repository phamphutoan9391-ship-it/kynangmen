(() => {
  "use strict";
  const KEY = "aeCayKhe_thanhTichSanThuThach";
  let data;
  try { data = JSON.parse(localStorage.getItem(KEY) || '{"score":0,"games":0}'); }
  catch (e) { data = {score:0,games:0}; }
  if (!data || typeof data !== "object") data = {score:0,games:0};
  data.score = Math.max(0, Number(data.score)||0);
  data.games = Math.max(0, Number(data.games)||0);
  const $ = id => document.getElementById(id);
  let cloud = null, cloudUser = null, cloudReady = false, playerNickname = "";
  function save(){
    localStorage.setItem(KEY,JSON.stringify(data));
    renderStats();

    window.dispatchEvent(new CustomEvent("ae-research-points",{detail:{points:data.score}}));
  }
  function addPoints(points){data.score+=points;data.games++;save();submitOnlineResult(points);}
  function countGame(){data.games++;save();submitOnlineResult(0);}

  function setOnlineMessage(message){const el=$("online-status");if(el)el.textContent=message;}
  function safeText(value){return String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
  async function connectOnline(){
    const url=window.AE_SUPABASE_URL, key=window.AE_SUPABASE_ANON_KEY;
    if(!window.supabase||!url||!key||url.includes("DAN_")||key.includes("DAN_")){
      setOnlineMessage("Chưa cấu hình Supabase. Game vẫn chơi và lưu điểm trên thiết bị này.");
      $("leaderboard-message").textContent="Cần cấu hình Supabase để mở bảng xếp hạng chung.";return;
    }
    try{
      cloud=window.supabase.createClient(url,key);
      let {data:sessionData,error:sessionError}=await cloud.auth.getSession();
      if(sessionError)throw sessionError;
      if(!sessionData.session){const signed=await cloud.auth.signInAnonymously();if(signed.error)throw signed.error;sessionData={session:signed.data.session};}
      cloudUser=sessionData.session.user;cloudReady=true;
      const profile=await cloud.from("player_scores").select("nickname,score,games").eq("user_id",cloudUser.id).maybeSingle();
      if(profile.error)throw profile.error;
      if(profile.data){
        playerNickname=profile.data.nickname;
        $("player-nickname").value=playerNickname;
        data.score=Number(profile.data.score)||0;data.games=Number(profile.data.games)||0;save();
      }else{
        setOnlineMessage("Đã kết nối. Hãy chọn biệt danh để tạo hồ sơ người chơi.");
      }
      if(profile.data)setOnlineMessage("Đã kết nối bảng xếp hạng chung với biệt danh: "+playerNickname);
      await loadLeaderboard();
    }catch(error){
      cloudReady=false;setOnlineMessage("Chưa kết nối được: "+(error.message||"kiểm tra cấu hình Supabase"));
      $("leaderboard-message").textContent="Không tải được bảng xếp hạng. Kiểm tra SQL và cấu hình Supabase.";
    }
  }
  async function saveNickname(){
    const nickname=$("player-nickname").value.trim().replace(/\s+/g," ");
    if(nickname.length<3||nickname.length>18){setOnlineMessage("Biệt danh cần từ 3 đến 18 ký tự.");return;}
    if(!cloudReady){setOnlineMessage("Bạn cần cấu hình và kết nối Supabase trước.");return;}
    try{
      const {error}=await cloud.rpc("set_player_nickname",{p_nickname:nickname});if(error)throw error;
      playerNickname=nickname;setOnlineMessage("Đã lưu biệt danh: "+nickname);await loadLeaderboard();
    }catch(error){setOnlineMessage("Không lưu được biệt danh: "+error.message);}
  }
  async function submitOnlineResult(points){
    if(!cloudReady)return;
    try{
      const {error}=await cloud.rpc("submit_game_result",{p_points:points});if(error)throw error;
      await loadLeaderboard();
    }catch(error){setOnlineMessage("Chưa đồng bộ được điểm online: "+error.message);}
  }
  async function loadLeaderboard(){
    if(!cloudReady)return;
    const list=$("global-leaderboard");
    const {data:rows,error}=await cloud.from("player_scores").select("user_id,nickname,score,games,updated_at").order("score",{ascending:false}).order("updated_at",{ascending:true}).limit(50);
    if(error){$("leaderboard-message").textContent="Lỗi tải bảng: "+error.message;return;}
    $("leaderboard-message").textContent=rows.length?"Top "+rows.length+" người chơi có điểm cao nhất":"Chưa có người chơi. Hãy là người đầu tiên!";
    list.innerHTML=rows.length?rows.map((row,index)=>`<li class="${row.user_id===cloudUser?.id?"me":""}"><span>${index+1}. ${safeText(row.nickname)}</span><b>${Number(row.score)||0} điểm</b></li>`).join(""):"<li>Chưa có dữ liệu.</li>";
    const own=rows.find(row=>row.user_id===cloudUser?.id);
    if(own){data.score=Number(own.score)||0;data.games=Number(own.games)||0;save();}
  }
  $("save-player-profile").addEventListener("click",saveNickname);
  $("refresh-leaderboard").addEventListener("click",loadLeaderboard);
  connectOnline();
  function renderStats(){
    $("arcade-total-score").textContent=data.score;
    $("arcade-rank-score").textContent=data.score;
    $("arcade-rank-points").textContent=data.score+" điểm bé ngoan";
    $("arcade-games-played").textContent=data.games;
    $("arcade-badge").textContent=data.score>=100?"Nhà bé ngoan cấp cao":data.score>=50?"Nhà bé ngoan":data.score>=20?"Thực tập sinh":"Tân thủ";
  }
  document.querySelectorAll(".arcade-tab").forEach(btn=>btn.addEventListener("click",()=>{
    document.querySelectorAll(".arcade-tab").forEach(x=>x.classList.toggle("active",x===btn));
    document.querySelectorAll(".arcade-game").forEach(x=>x.classList.toggle("active",x.id==="arcade-"+btn.dataset.arcadeTab));
    if(btn.dataset.arcadeTab==="chicken")requestAnimationFrame(()=>{const arena=$("farm3d-scene");if(arena)arena.classList.add("ready");});
  }));

  const suits=["♠","♥","♦","♣"], ranks=["2","3","4","5","6","7","8","9","10","J","Q","K","A"];
  function classify(hand){
    const counts={};hand.forEach(c=>counts[c.rank]=(counts[c.rank]||0)+1);
    const vals=Object.values(counts).sort((a,b)=>b-a);
    const flush=hand.every(c=>c.suit===hand[0].suit);
    const nums=hand.map(c=>ranks.indexOf(c.rank)).sort((a,b)=>a-b);
    const straight=nums.every((n,i)=>i===0||n===nums[i-1]+1)||nums.join(",")==="0,1,2,3,12";
    if(flush&&straight)return "Thùng phá sảnh";
    if(vals[0]===4)return "Tứ quý";
    if(vals[0]===3&&vals[1]===2)return "Cù lũ";
    if(flush)return "Thùng";
    if(straight)return "Sảnh";
    if(vals[0]===3)return "Sám cô";
    if(vals[0]===2&&vals[1]===2)return "Hai đôi";
    if(vals[0]===2)return "Một đôi";
    return "Mậu thầu";
  }
  $("arcade-deal").addEventListener("click",()=>{
    const deck=[];suits.forEach(s=>ranks.forEach(r=>deck.push({suit:s,rank:r})));
    for(let i=deck.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[deck[i],deck[j]]=[deck[j],deck[i]];}
    const hand=deck.slice(0,5);$("arcade-cards").innerHTML="";
    hand.forEach(c=>{
      const el=document.createElement("div");
      el.className="arcade-card "+(["♥","♦"].includes(c.suit)?"red":"");
      el.innerHTML="<span>"+c.rank+"</span><span class='suit'>"+c.suit+"</span><span>"+c.rank+"</span>";
      $("arcade-cards").appendChild(el);
    });
    $("arcade-poker-result").textContent="Bộ bài: "+classify(hand);
    $("arcade-poker-hint").textContent="Bạn nhận 10 điểm bé ngoan cho lượt này.";
    addPoints(10);
  });

  const faces=["⚀","⚁","⚂","⚃","⚄","⚅"];
  $("arcade-roll").addEventListener("click",()=>{
    const a=1+Math.floor(Math.random()*6),b=1+Math.floor(Math.random()*6),sum=a+b,guess=Number($("arcade-prediction").value);
    $("arcade-die1").textContent=faces[a-1];$("arcade-die2").textContent=faces[b-1];
    if(sum===guess){$("arcade-dice-result").textContent="Chính xác! Tổng là "+sum+". +5 điểm bé ngoan!";addPoints(5);}
    else{$("arcade-dice-result").textContent="Tổng là "+sum+". Bạn dự đoán "+guess+"; thử lại nhé!";countGame();}
  });

  const chickenArena = $("farm3d-scene");
  if (chickenArena) {
    chickenArena.innerHTML = `
      <div class="chicken2d-sky"><span class="pixel-cloud cloud-a">☁️</span><span class="pixel-cloud cloud-b">☁️</span></div>
      <div class="chicken2d-track">
        <div class="race-lane"><span class="lane-label">GÀ CÂY KHẾ</span><span class="pixel-chicken player-chicken" id="pixel-player">🐓</span><span class="finish-flag">🏁</span></div>
        <div class="race-lane"><span class="lane-label">GÀ BẠN</span><span class="pixel-chicken rival-chicken" id="pixel-rival">🐔</span><span class="finish-flag">🏁</span></div>
      </div>`;
  }
  let playerHp=3,enemyHp=3,round=0,matchOver=false;
  function renderChicken(){
    $("arcade-player-hp").textContent="Thể lực: "+playerHp;
    $("arcade-enemy-hp").textContent="Thể lực: "+enemyHp;
  }
  function resetMatch(){
    playerHp=3;enemyHp=3;round=0;matchOver=false;
    $("arcade-chicken-log").textContent="Chọn kỹ năng để thi chạy và vượt thử thách!";
    $("farm3d-status").textContent="🏁 Sẵn sàng xuất phát";
    const p=$("pixel-player"),r=$("pixel-rival");
    if(p)p.style.left="5%";if(r)r.style.left="5%";
    document.querySelectorAll(".arcade-skill").forEach(b=>b.disabled=false);
    renderChicken();
  }
  $("arcade-new-match").addEventListener("click",resetMatch);
  document.querySelectorAll(".arcade-skill").forEach(btn=>btn.addEventListener("click",()=>{
    if(matchOver)return;
    const move=btn.dataset.arcadeSkill;
    const rivalMove=["speed","focus","guard"][Math.floor(Math.random()*3)];
    const counter={speed:"guard",guard:"focus",focus:"speed"};
    let msg="";
    if(move===rivalMove){msg="Hai chú gà cùng vượt thử thách rất tốt!";}
    else if(counter[move]===rivalMove){enemyHp--;msg="Gà Cây Khế vượt chướng ngại nhanh hơn!";}
    else{playerHp--;msg="Gà bạn vượt thử thách tốt hơn lượt này. Cố lên!";}
    round++;
    const p=$("pixel-player"),r=$("pixel-rival");
    if(p){p.style.left=Math.min(76,5+round*13+(move==="speed"?5:0))+"%";p.classList.remove("run-bounce");void p.offsetWidth;p.classList.add("run-bounce");}
    if(r){r.style.left=Math.min(76,5+round*13+(rivalMove==="speed"?5:0))+"%";r.classList.remove("run-bounce");void r.offsetWidth;r.classList.add("run-bounce");}
    $("farm3d-status").textContent=move==="speed"?"💨 Chạy nước rút!":move==="focus"?"🎯 Giữ thăng bằng!":"🛡️ Vượt chướng ngại vật!";
    renderChicken();
    if(playerHp<=0||enemyHp<=0||round>=5){
      matchOver=true;document.querySelectorAll(".arcade-skill").forEach(b=>b.disabled=true);
      if(enemyHp<playerHp){msg+=" Gà Cây Khế thắng hội thi! +15 điểm bé ngoan.";addPoints(15);$("farm3d-status").textContent="🏆 Gà Cây Khế vô địch!";}
      else if(enemyHp===playerHp){msg+=" Hai chú gà hòa điểm! +5 điểm bé ngoan.";addPoints(5);$("farm3d-status").textContent="🤝 Hội thi hòa điểm!";}
      else{msg+=" Gà bạn thắng phần thi này. Hẹn lần sau nhé!";countGame();$("farm3d-status").textContent="🏁 Hội thi kết thúc";}
      msg+=" Nhấn ‘Hội thi mới’ để chơi tiếp.";
    }
    $("arcade-chicken-log").textContent=msg;
  }));
  renderStats();resetMatch();
})();
