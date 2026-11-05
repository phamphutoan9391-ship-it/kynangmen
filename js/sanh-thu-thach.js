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
  function save(){localStorage.setItem(KEY,JSON.stringify(data));renderStats();}
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
    $("arcade-rank-points").textContent=data.score+" điểm";
    $("arcade-games-played").textContent=data.games;
    $("arcade-badge").textContent=data.score>=100?"Cao thủ":data.score>=50?"Người chăm chỉ":data.score>=20?"Nhà thám hiểm":"Tân thủ";
  }
  document.querySelectorAll(".arcade-tab").forEach(btn=>btn.addEventListener("click",()=>{
    document.querySelectorAll(".arcade-tab").forEach(x=>x.classList.toggle("active",x===btn));
    document.querySelectorAll(".arcade-game").forEach(x=>x.classList.toggle("active",x.id==="arcade-"+btn.dataset.arcadeTab));
    if(btn.dataset.arcadeTab==="chicken")requestAnimationFrame(()=>{if(farm3d)farm3d.resize();});
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
    $("arcade-poker-hint").textContent="Bạn nhận 10 điểm thành tích cho lượt này.";
    addPoints(10);
  });

  const faces=["⚀","⚁","⚂","⚃","⚄","⚅"];
  $("arcade-roll").addEventListener("click",()=>{
    const a=1+Math.floor(Math.random()*6),b=1+Math.floor(Math.random()*6),sum=a+b,guess=Number($("arcade-prediction").value);
    $("arcade-die1").textContent=faces[a-1];$("arcade-die2").textContent=faces[b-1];
    if(sum===guess){$("arcade-dice-result").textContent="Chính xác! Tổng là "+sum+". +5 điểm thành tích!";addPoints(5);}
    else{$("arcade-dice-result").textContent="Tổng là "+sum+". Bạn dự đoán "+guess+"; thử lại nhé!";countGame();}
  });

  // Dung san nong trai va hai chu ga 3D bang Three.js.
  let farm3d = null;
  function taoGa(scene, mauThan, mauCanh, x, quay) {
    const group = new THREE.Group();
    const mat = c => new THREE.MeshStandardMaterial({color:c, roughness:0.82});
    const thanMat=mat(mauThan), canhMat=mat(mauCanh), doMat=mat(0xc83e32), vangMat=mat(0xf0b83f), chanMat=mat(0xb86c32), trangMat=mat(0xffffff), denMat=mat(0x202020);
    function cau(parent,material,pos,scale){const m=new THREE.Mesh(new THREE.SphereGeometry(1,20,16),material);m.position.set(...pos);m.scale.set(...scale);m.castShadow=true;parent.add(m);return m;}
    cau(group,thanMat,[0,0.85,0],[0.72,0.58,0.48]);
    cau(group,thanMat,[0.43,1.42,0],[0.38,0.4,0.35]);
    cau(group,doMat,[0.35,1.82,0],[0.12,0.2,0.11]);
    cau(group,doMat,[0.5,1.78,0],[0.12,0.16,0.1]);
    cau(group,doMat,[0.65,1.7,0],[0.12,0.12,0.1]);
    const beak=new THREE.Mesh(new THREE.ConeGeometry(0.13,0.32,8),vangMat);beak.rotation.z=-Math.PI/2;beak.position.set(0.79,1.37,0);group.add(beak);
    cau(group,trangMat,[0.56,1.48,0.29],[0.105,0.12,0.07]);cau(group,denMat,[0.59,1.48,0.35],[0.045,0.06,0.025]);
    const wing1=cau(group,canhMat,[0.05,0.98,0.43],[0.42,0.25,0.12]);
    cau(group,thanMat,[-0.68,1.05,0],[0.22,0.2,0.22]);cau(group,thanMat,[-0.78,1.2,0],[0.18,0.17,0.18]);
    const legs=[];
    for(let z of [-0.19,0.2]){const leg=new THREE.Mesh(new THREE.CylinderGeometry(0.045,0.055,0.42,8),chanMat);leg.position.set(0.1,0.32,z);group.add(leg);const foot=new THREE.Mesh(new THREE.BoxGeometry(0.28,0.07,0.16),chanMat);foot.position.set(0.2,0.1,z);group.add(foot);legs.push(leg);}
    group.position.set(x,0,0);group.rotation.y=quay;scene.add(group);
    return {group,wing:wing1,legs,baseX:x,phase:Math.random()*6};
  }
  function taoVat(scene,geo,material,x,y,z,sx,sy,sz){const m=new THREE.Mesh(geo,material);m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=true;m.receiveShadow=true;scene.add(m);return m;}
  function khoiTaoFarm3D(){
    const host=$("farm3d-scene");if(!host||!window.THREE){if(host)host.innerHTML='<p style="padding:24px;color:#263e32;font-weight:bold">Không tải được thư viện 3D. Hãy kiểm tra kết nối Internet rồi tải lại trang.</p>';return;}
    const scene=new THREE.Scene();scene.background=new THREE.Color(0xa9cfda);scene.fog=new THREE.Fog(0xa9cfda,18,42);
    const camera=new THREE.PerspectiveCamera(42,Math.max(host.clientWidth,640)/Math.max(host.clientHeight,260),0.1,100);camera.position.set(0,7.2,14.5);camera.lookAt(0,1.2,0);
    const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));renderer.setSize(Math.max(host.clientWidth,640),Math.max(host.clientHeight,260));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;host.innerHTML='';host.appendChild(renderer.domElement);
    scene.add(new THREE.HemisphereLight(0xe8f7ff,0x6b7546,1.7));const sun=new THREE.DirectionalLight(0xffedc2,2.1);sun.position.set(-5,10,7);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);scene.add(sun);
    const grass=new THREE.Mesh(new THREE.PlaneGeometry(32,25),new THREE.MeshStandardMaterial({color:0x6c994c,roughness:1}));grass.rotation.x=-Math.PI/2;grass.position.y=-0.05;grass.receiveShadow=true;scene.add(grass);
    const dirt=new THREE.Mesh(new THREE.CircleGeometry(5.2,48),new THREE.MeshStandardMaterial({color:0xb99563,roughness:1}));dirt.rotation.x=-Math.PI/2;dirt.position.y=0.015;dirt.scale.set(1.45,0.72,1);scene.add(dirt);
    const wood=new THREE.MeshStandardMaterial({color:0x80532f}),roof=new THREE.MeshStandardMaterial({color:0x9e4936}),wall=new THREE.MeshStandardMaterial({color:0xe1c58e}),hay=new THREE.MeshStandardMaterial({color:0xd5ad4f});
    // Hang rao go phia sau
    for(let x=-9;x<=9;x+=1.5){taoVat(scene,new THREE.BoxGeometry(0.12,1.1,0.12),wood,x,0.55,-5.5,1,1,1);}
    for(let y of [0.35,0.82])taoVat(scene,new THREE.BoxGeometry(18,0.13,0.13),wood,0,y,-5.5,1,1,1);
    // Chuong ga nho ben trai
    taoVat(scene,new THREE.BoxGeometry(2.8,1.8,1.8),wall,-6,0.9,-3.5,1,1,1);taoVat(scene,new THREE.ConeGeometry(2.1,1.2,4),roof,-6,2.35,-3.5,1,1,1).rotation.y=Math.PI/4;
    taoVat(scene,new THREE.BoxGeometry(0.7,1.1,0.08),wood,-6,0.55,-2.57,1,1,1);
    // Cuon rom va cay
    for(let i=0;i<3;i++)taoVat(scene,new THREE.CylinderGeometry(0.48,0.48,0.8,16),hay,4.5+i*1.15,0.45,-3.7,1,1,1).rotation.z=Math.PI/2;
    const trunk=new THREE.MeshStandardMaterial({color:0x76502e}),leaf=new THREE.MeshStandardMaterial({color:0x4f8547});
    [-8,7.5].forEach((x)=>{taoVat(scene,new THREE.CylinderGeometry(0.18,0.25,1.5,8),trunk,x,0.75,-2.8,1,1,1);taoVat(scene,new THREE.SphereGeometry(1,12,10),leaf,x,2,-2.8,1.1,1.25,1.1);});
    const player=taoGa(scene,0xd99a35,0xf2c45f,-2.2,0.18),enemy=taoGa(scene,0xf1eee0,0xc7c5bd,2.2,Math.PI-0.18);
    farm3d={scene,camera,renderer,player,enemy,host,clock:new THREE.Clock(),motion:0,playerTarget:-2.2,enemyTarget:2.2,celebrate:false,resize(){const w=Math.max(host.clientWidth,320),h=Math.max(host.clientHeight,220);camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h);}};
    function animate(){if(!farm3d)return;requestAnimationFrame(animate);const t=farm3d.clock.getElapsedTime();[player,enemy].forEach((ch,i)=>{const target=i===0?farm3d.playerTarget:farm3d.enemyTarget;ch.group.position.x+=(target-ch.group.position.x)*0.055;const moving=Math.abs(target-ch.group.position.x)>0.06;ch.group.position.y=(moving?Math.abs(Math.sin(t*11+i))*0.12:Math.abs(Math.sin(t*2+i))*0.025)+(farm3d.celebrate?Math.abs(Math.sin(t*12))*0.22:0);ch.group.rotation.z=moving?Math.sin(t*11+i)*0.08:Math.sin(t*2+i)*0.025;ch.wing.rotation.z=Math.sin(t*9+i)*0.18;ch.legs.forEach((leg,j)=>leg.rotation.z=moving?Math.sin(t*12+j*Math.PI+i)*0.45:0);});renderer.render(scene,camera);}
    animate();
    window.addEventListener('resize',()=>{if(farm3d)farm3d.resize();});
  }
  khoiTaoFarm3D();
  let playerHp=3,enemyHp=3,round=0,matchOver=false;
  function renderChicken(){$("arcade-player-hp").textContent="Thể lực: "+playerHp;$("arcade-enemy-hp").textContent="Thể lực: "+enemyHp;}
  function resetMatch(){
    playerHp=3;enemyHp=3;round=0;matchOver=false;
    $("arcade-chicken-log").textContent="Hội thi bắt đầu! Chọn kỹ năng cho chú gà.";
    $("farm3d-status").textContent="Sẵn sàng vào hội thi";
    if(farm3d){farm3d.playerTarget=-2.2;farm3d.enemyTarget=2.2;farm3d.celebrate=false;}
    renderChicken();document.querySelectorAll(".arcade-skill").forEach(b=>b.disabled=false);
  }
  $("arcade-new-match").addEventListener("click",resetMatch);
  document.querySelectorAll(".arcade-skill").forEach(btn=>btn.addEventListener("click",()=>{
    if(matchOver)return;
    const move=btn.dataset.arcadeSkill,enemy=["speed","focus","guard"][Math.floor(Math.random()*3)];
    const counter={speed:"guard",guard:"focus",focus:"speed"};let msg="";
    if(move===enemy)msg="Hai chú gà cùng hoàn thành thử thách! Không ai mất thể lực.";
    else if(counter[move]===enemy){enemyHp--;msg="Tuyệt vời! Gà Cây Khế hoàn thành phần thi tốt hơn.";}
    else{playerHp--;msg="Gà đối thủ nhỉnh hơn ở lượt này. Cố gắng lượt sau nhé!";}
    round++;if(farm3d){farm3d.playerTarget=move==="speed"?0.4:-1.5;farm3d.enemyTarget=enemy==="speed"?-0.4:1.5;farm3d.celebrate=false;}
    $("farm3d-status").textContent=move==="speed"?"Chạy nước rút!":move==="focus"?"Thử thách giữ thăng bằng":"Né chướng ngại vật!";
    renderChicken();
    if(playerHp<=0||enemyHp<=0||round>=5){matchOver=true;document.querySelectorAll(".arcade-skill").forEach(b=>b.disabled=true);
      if(enemyHp<playerHp){msg+=" Gà Cây Khế thắng hội thi! +15 điểm thành tích.";addPoints(15);if(farm3d)farm3d.celebrate=true;$("farm3d-status").textContent="🏆 Gà Cây Khế vô địch!";}
      else if(enemyHp===playerHp){msg+=" Hai chú gà hòa điểm! +5 điểm tham gia.";addPoints(5);if(farm3d)farm3d.celebrate=true;$("farm3d-status").textContent="🤝 Hội thi hòa điểm!";}
      else{msg+=" Gà đối thủ thắng phần thi này. Cố gắng lần sau nhé!";countGame();$("farm3d-status").textContent="Hội thi đã kết thúc";}
      msg+=" Nhấn ‘Hội thi mới’ để chơi tiếp.";
    }
    $("arcade-chicken-log").textContent=msg;
  }));
  renderStats();resetMatch();
})();