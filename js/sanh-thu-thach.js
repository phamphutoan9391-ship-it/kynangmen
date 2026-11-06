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
  function handScore(hand){
    const label=classify(hand),weights={"Mậu thầu":1,"Một đôi":2,"Hai đôi":3,"Sám cô":4,"Sảnh":5,"Thùng":6,"Cù lũ":7,"Tứ quý":8,"Thùng phá sảnh":9};
    const high=hand.map(c=>ranks.indexOf(c.rank)+2).sort((a,b)=>b-a);
    return (weights[label]||0)*100000+high.reduce((sum,v,i)=>sum+v*(5-i),0);
  }
  function renderHand(host,hand){
    host.innerHTML="";
    hand.forEach(c=>{
      const el=document.createElement("div");
      el.className="arcade-card "+(["♥","♦"].includes(c.suit)?"red":"");
      el.innerHTML="<span>"+c.rank+"</span><span class='suit'>"+c.suit+"</span><span>"+c.rank+"</span>";
      host.appendChild(el);
    });
  }
  $("arcade-deal").addEventListener("click",()=>{
    const deck=[];suits.forEach(s=>ranks.forEach(r=>deck.push({suit:s,rank:r})));
    for(let i=deck.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[deck[i],deck[j]]=[deck[j],deck[i]];}
    const player=deck.slice(0,5),cpu=deck.slice(5,10);
    renderHand($("arcade-cards"),player);renderHand($("arcade-cpu-cards"),cpu);
    const ps=handScore(player),cs=handScore(cpu),pl=classify(player),cl=classify(cpu);
    $("arcade-poker-result").textContent="Bạn: "+pl;
    $("arcade-cpu-result").textContent="Máy: "+cl;
    if(ps>cs){$("arcade-poker-hint").textContent="Bạn thắng ván này! Nhận +10 điểm bé ngoan.";addPoints(10);}
    else if(ps===cs){$("arcade-poker-hint").textContent="Hai bên hòa! Bạn nhận +5 điểm tham gia.";addPoints(5);}
    else{$("arcade-poker-hint").textContent="Máy thắng ván này. Bạn vẫn nhận +2 điểm tham gia.";addPoints(2);}
    $("arcade-cards").querySelectorAll(".arcade-card").forEach((el,i)=>{el.style.animationDelay=(i*70)+"ms";});
    $("arcade-cpu-cards").querySelectorAll(".arcade-card").forEach((el,i)=>{el.style.animationDelay=(i*70)+"ms";});
  });

  const faces=["⚀","⚁","⚂","⚃","⚄","⚅"];
  $("arcade-roll").addEventListener("click",()=>{
    const button=$("arcade-roll");if(button.disabled)return;button.disabled=true;button.textContent="🎲 Đang gieo...";
    const dice=[$("arcade-die1"),$("arcade-die2"),$("arcade-cpu-die1"),$("arcade-cpu-die2")];
    dice.forEach(el=>el.classList.add("rolling"));
    setTimeout(()=>{
      const vals=Array.from({length:4},()=>1+Math.floor(Math.random()*6));
      dice.forEach((el,i)=>{el.textContent=faces[vals[i]-1];el.classList.remove("rolling");});
      const playerTotal=vals[0]+vals[1],cpuTotal=vals[2]+vals[3];
      $("arcade-player-dice-total").textContent="Tổng: "+playerTotal;
      $("arcade-cpu-dice-total").textContent="Tổng: "+cpuTotal;
      if(playerTotal>cpuTotal){$("arcade-dice-result").textContent="🎉 Bạn thắng máy! +5 điểm bé ngoan.";addPoints(5);}
      else if(playerTotal===cpuTotal){$("arcade-dice-result").textContent="🤝 Hai bên hòa! +3 điểm tham gia.";addPoints(3);}
      else{$("arcade-dice-result").textContent="🤖 Máy thắng lượt này. Bạn nhận +1 điểm tham gia.";addPoints(1);}
      button.disabled=false;button.textContent="🎲 Gieo xúc xắc đấu máy";
    },650);
  });

  const chickenArena = $("farm3d-scene");
  if (chickenArena) {
    chickenArena.innerHTML = `
      <div class="chicken2d-sky"><span class="pixel-cloud cloud-a">☁️</span><span class="pixel-cloud cloud-b">☁️</span></div>
      <div class="chicken2d-track">
        <div class="race-lane"><span class="lane-label">GÀ CÂY KHẾ</span><span class="pixel-chicken player-chicken" id="pixel-player">🐓</span><span class="finish-flag">🏁</span></div>
        <div class="race-lane"><span class="lane-label">GÀ MÁY</span><span class="pixel-chicken rival-chicken" id="pixel-rival">🐔</span><span class="finish-flag">🏁</span></div>
      </div>`;
  }
  let playerProgress=0,cpuProgress=0,round=0,matchOver=false;
  function renderChicken(){
    $("arcade-player-hp").textContent="Tiến độ: "+playerProgress+"/10";
    $("arcade-enemy-hp").textContent="Tiến độ: "+cpuProgress+"/10";
  }
  function resetMatch(){
    playerProgress=0;cpuProgress=0;round=0;matchOver=false;
    $("arcade-chicken-log").textContent="Chọn kỹ năng để vượt từng chặng với máy!";
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
    if(move===rivalMove){playerProgress+=1;cpuProgress+=1;msg="Hai bên vượt chặng ngang nhau! Mỗi bên tiến 1 bước.";}
    else if(counter[move]===rivalMove){playerProgress+=2;cpuProgress+=1;msg="Bạn chọn kỹ năng hợp lý hơn máy! Bạn tiến 2 bước.";}
    else{playerProgress+=1;cpuProgress+=2;msg="Máy xử lý chướng ngại tốt hơn lượt này. Bạn vẫn tiến 1 bước.";}
    round++;
    const p=$("pixel-player"),r=$("pixel-rival");
    if(p){p.style.left=Math.min(84,5+playerProgress*8)+"%";p.classList.remove("run-bounce");void p.offsetWidth;p.classList.add("run-bounce");}
    if(r){r.style.left=Math.min(84,5+cpuProgress*8)+"%";r.classList.remove("run-bounce");void r.offsetWidth;r.classList.add("run-bounce");}
    $("farm3d-status").textContent=move==="speed"?"💨 Chặng chạy nước rút!":move==="focus"?"🎯 Chặng giữ thăng bằng!":"🛡️ Chặng né chướng ngại vật!";
    renderChicken();
    if(playerProgress>=10||cpuProgress>=10||round>=5){
      matchOver=true;document.querySelectorAll(".arcade-skill").forEach(b=>b.disabled=true);
      if(playerProgress>cpuProgress){msg+=" Bạn về đích trước máy! +15 điểm bé ngoan.";addPoints(15);$("farm3d-status").textContent="🏆 Bạn thắng cuộc đua!";}
      else if(playerProgress===cpuProgress){msg+=" Hai bên hòa nhau! +7 điểm tham gia.";addPoints(7);$("farm3d-status").textContent="🤝 Cuộc đua hòa!";}
      else{msg+=" Máy về đích trước. Bạn nhận +3 điểm tham gia.";addPoints(3);$("farm3d-status").textContent="🤖 Máy thắng cuộc đua.";}
      msg+=" Nhấn ‘Cuộc đua mới’ để chơi tiếp.";
    }
    $("arcade-chicken-log").textContent=msg;
  }));
  renderStats();resetMatch();
})();
