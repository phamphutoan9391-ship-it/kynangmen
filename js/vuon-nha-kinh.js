(() => {
  "use strict";
  const EXP_KEY = "aeCayKheExpansion_v1";
  const GAME_KEY = "aeCayKheVuonTriThuc_v1";
  const $ = id => document.getElementById(id);
  const potLevels = [
    { level: 1, name: "Chậu đất nung", icon: "🪴", multiplier: 1.00 },
    { level: 2, name: "Chậu men xanh", icon: "🏺", multiplier: 1.15 },
    { level: 3, name: "Chậu tự tưới", icon: "🪻", multiplier: 1.35 },
    { level: 4, name: "Chậu sinh học cao cấp", icon: "✨", multiplier: 1.60 }
  ];
  const adjectives = [
    "Ngân Hà","Ánh Trăng","Bình Minh","Hoàng Hôn","Pha Lê","Cầu Vồng","Tinh Tú","Sao Băng","Lam Ngọc","Hổ Phách",
    "Bạc Hà","Mây Hồng","Sương Mai","Băng Lam","Lửa Nhỏ","Mộng Mơ","Thủy Tinh","Ánh Kim","Thiên Hà","Dạ Quang",
    "Lục Bảo","San Hô","Ánh Vàng","Tím Biếc","Sóng Biển","Gió Xuân","Mặt Trời","Bụi Sao","Hải Đăng","Tuyết Ngọc",
    "Huyền Quang","Bình Yên","Rừng Sâu","Suối Ngọc","Mưa Sao","Sao Bắc Đẩu","Vệt Sáng","Mật Ong","Hoa Sữa","Mộc Lan",
    "Sơn Ca","Cánh Diều","Mặt Hồ","Lưu Ly","Sương Bạc","Đom Đóm","Thiên Điểu","Cực Quang","Mặt Trời Nhỏ","Vân Mây",
    "Lam Tuyền","Thạch Anh","Kim Sa","Lá Ngọc","Tinh Vân"
  ];
  const families = [
    { name: "Hoa Chuông Mây", icon: "🔔" }, { name: "Dạ Lan Tinh Tú", icon: "🌺" },
    { name: "Dương Xỉ Pha Lê", icon: "🌿" }, { name: "Cúc Ngân Hà", icon: "🌼" },
    { name: "Tường Vi Sao Băng", icon: "🌹" }, { name: "Sen Ánh Trăng", icon: "🪷" },
    { name: "Dây Leo Cầu Vồng", icon: "🪴" }, { name: "Nấm Phát Quang", icon: "🍄" },
    { name: "Hoa Sương Lam", icon: "🪻" }, { name: "Cỏ Sao Bạc", icon: "🌾" }
  ];
  const effects = [
    { name: "Đom đóm vờn quanh", key: "firefly", icon: "✨", description: "Thu hút những đốm sáng nhỏ bay quanh chậu." },
    { name: "Cánh lá đổi màu", key: "rainbow", icon: "🌈", description: "Lá chuyển sắc nhẹ theo nhịp chuyển động." },
    { name: "Sương ánh kim", key: "mist", icon: "💫", description: "Tạo làn sương lấp lánh trên tán cây." },
    { name: "Bong bóng tinh thể", key: "bubble", icon: "🫧", description: "Bong bóng sáng nổi lên quanh gốc." },
    { name: "Tia sáng dịu", key: "glow", icon: "🌟", description: "Tán cây phát sáng khi trưởng thành." },
    { name: "Lá rung ngân vang", key: "chime", icon: "🎐", description: "Lá rung theo gió và tạo hiệu ứng chuông." },
    { name: "Bụi sao bay", key: "stardust", icon: "🌠", description: "Hạt sáng bay chậm quanh cây." },
    { name: "Cánh hoa xoay", key: "petal", icon: "🌸", description: "Cánh hoa xoay nhẹ khi cây lớn." },
    { name: "Sóng sáng mặt đất", key: "wave", icon: "🔆", description: "Vòng sáng lan nhẹ quanh chậu." },
    { name: "Mây nhỏ đồng hành", key: "cloud", icon: "☁️", description: "Một cụm mây nhỏ trôi phía trên cây." }
  ];
  const rarityDefs = [
    { name: "Thường", className: "common", cost: 24, reward: 30, seconds: 42 },
    { name: "Hiếm", className: "rare", cost: 42, reward: 52, seconds: 55 },
    { name: "Sử thi", className: "epic", cost: 68, reward: 82, seconds: 72 },
    { name: "Huyền thoại", className: "legendary", cost: 105, reward: 128, seconds: 92 },
    { name: "Thần thoại", className: "mythic", cost: 160, reward: 190, seconds: 120 }
  ];
  const TOTAL_PLANTS = adjectives.length * families.length * effects.length;
  const PAGE_SIZE = 24;
  let page = 1;
  let cachedFilter = [];
  let marketTimer = 0;
  let ex = readExpansion();

  function readExpansion() {
    let raw = {};
    try { raw = JSON.parse(localStorage.getItem(EXP_KEY) || "{}"); } catch (e) { raw = {}; }
    const gh = raw.greenhouse && typeof raw.greenhouse === "object" ? raw.greenhouse : {};
    raw.pots = { 1: 2, 2: 0, 3: 0, 4: 0, ...(raw.pots || {}) };
    raw.selectedPot = Number(raw.selectedPot) || 1;
    raw.greenhouse = {
      buildStartedAt: 0, builtAt: 0, buildDuration: 48000, built: false,
      slots: Array(8).fill(null), magicalSeeds: {}, discovered: [], totalHarvest: 0,
      marketDay: "", marketStock: {}, migratedLegacyHouse: false, ...gh
    };
    raw.greenhouse.slots = Array.from({ length: 8 }, (_, i) => raw.greenhouse.slots?.[i] || null);
    raw.greenhouse.magicalSeeds = raw.greenhouse.magicalSeeds || {};
    raw.greenhouse.discovered = Array.isArray(raw.greenhouse.discovered) ? raw.greenhouse.discovered : [];
  
    if (!raw.greenhouse.migratedLegacyHouse && Number(raw.house) >= 2 && !raw.greenhouse.buildStartedAt && !raw.greenhouse.built) {
      raw.greenhouse.built = true;
      raw.greenhouse.builtAt = Date.now();
      raw.greenhouse.migratedLegacyHouse = true;
    }
    return raw;
  }
  function saveExpansion() {
    localStorage.setItem(EXP_KEY, JSON.stringify(ex));
    window.dispatchEvent(new Event("aeCayKheExternalUpdate"));
  }
  function readGame() {
    try { return JSON.parse(localStorage.getItem(GAME_KEY) || "{}"); } catch (e) { return {}; }
  }
  function saveGame(state) {
    localStorage.setItem(GAME_KEY, JSON.stringify(state));
    window.dispatchEvent(new Event("aeCayKheExternalUpdate"));
  }
  function spendCoins(amount) {
    const game = readGame();
    const price = Math.max(0, Math.floor(Number(amount) || 0));
    if ((Number(game.coins) || 0) < price) return false;
    game.coins = (Number(game.coins) || 0) - price;
    game.totalSpent = (Number(game.totalSpent) || 0) + price;
    saveGame(game);
    return true;
  }
  function awardCoinsAndResearch(coins, research) {
    const game = readGame();
    game.coins = (Number(game.coins) || 0) + coins;
    game.researchPoints = (Number(game.researchPoints) || 0) + research;
    saveGame(game);
  }
  function toast(message) {
    const el = $("toast");
    if (!el) return;
    el.textContent = message;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 2600);
  }
  let toastTimer = 0;
  function catalogPlant(id) {
    const n = Math.max(1, Math.min(TOTAL_PLANTS, Number(id) || 1));
    const index = n - 1;
    const a = Math.floor(index / 100);
    const f = Math.floor(index / 10) % 10;
    const e = index % 10;
    let rarityIndex = n <= 2750 ? 0 : n <= 4400 ? 1 : n <= 5000 ? 2 : n <= 5350 ? 3 : 4;
    const rarity = rarityDefs[rarityIndex];
    return {
      id: n,
      name: `${adjectives[a]} ${families[f].name} · ${effects[e].name}`,
      icon: families[f].icon,
      family: families[f].name,
      effect: effects[e],
      rarity,
      cost: rarity.cost + (n % 7) * 3,
      reward: rarity.reward + (n % 9) * 2,
      seconds: rarity.seconds + (n % 6) * 7
    };
  }
  function dayKey() {
    const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
    const g = k => parts.find(v => v.type === k)?.value || "00";
    return `${g("year")}-${g("month")}-${g("day")}`;
  }
  function hash32(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function ensureMarket() {
    const today = dayKey();
    if (ex.greenhouse.marketDay === today && Array.isArray(ex.greenhouse.marketOffers) && ex.greenhouse.marketOffers.length) return;
    let seed = hash32(today + "-AE-CAY-KHE-NIGHT-MARKET");
    const next = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed; };
    const ids = new Set();
    while (ids.size < 6) ids.add((next() % TOTAL_PLANTS) + 1);
    ex.greenhouse.marketDay = today;
    ex.greenhouse.marketOffers = [...ids].map(id => ({ id, stock: 3 }));
    saveExpansion();
  }
  function totalMagicSeeds() { return Object.values(ex.greenhouse.magicalSeeds).reduce((sum, value) => sum + Math.max(0, Number(value) || 0), 0); }
  function totalPotStock() { return [1, 2, 3, 4].reduce((sum, level) => sum + Math.max(0, Number(ex.pots[level]) || 0), 0); }
  function renderGreenhouseHeader() {
    const pot = $("greenhouse-pot-stock"), seed = $("greenhouse-seed-stock"), count = $("greenhouse-slot-count");
    if (pot) pot.textContent = totalPotStock();
    if (seed) seed.textContent = totalMagicSeeds();
    if (count) count.textContent = `${ex.greenhouse.slots.filter(Boolean).length}/8`;
    const potSelect = $("pot-selected");
    if (potSelect) {
      const chosen = Number(ex.selectedPot) || 1;
      potSelect.value = String(chosen);
    }
    renderMagicSeedSelect();
  }
  const BUILD_STAGES = [
    { name: "Dọn mặt bằng và định vị nền", icon: "🧹" },
    { name: "Đặt móng và dựng khung gỗ", icon: "🪵" },
    { name: "Lắp kính và hệ thống tưới", icon: "🪟" },
    { name: "Bố trí kệ chậu và hoàn thiện", icon: "🪴" }
  ];
  function renderBuild() {
    const status = $("greenhouse-build-status"), progress = $("greenhouse-build-progress"), fill = $("greenhouse-build-fill"), stageLabel = $("greenhouse-build-stage"), button = $("greenhouse-build-button"), area = $("greenhouse-area"), scene = $("greenhouse-build-scene");
    if (!status || !button || !area) return;
    if (ex.greenhouse.built) {
      status.textContent = "✅ Nhà kính đã hoàn thành. Tám vị trí chậu đã sẵn sàng.";
      button.hidden = true; progress.hidden = true; area.hidden = false;
      if (scene) scene.classList.add("greenhouse-construction-complete");
      renderGreenhouseSlots(); renderGreenhouseHeader();
      return;
    }
    area.hidden = true; button.hidden = false;
    if (!ex.greenhouse.buildStartedAt) {
      status.textContent = "Chưa xây dựng. Chi phí 420 xu. Công trình gồm 4 giai đoạn, có thể tiếp tục sau khi tải lại trang.";
      button.disabled = false; button.textContent = "🏗️ Xây nhà kính · 420 xu"; progress.hidden = true;
      if (scene) scene.classList.remove("is-building", "greenhouse-construction-complete");
      return;
    }
    const elapsed = Date.now() - ex.greenhouse.buildStartedAt;
    const duration = Math.max(1000, Number(ex.greenhouse.buildDuration) || 48000);
    const pct = Math.max(0, Math.min(1, elapsed / duration));
    if (pct >= 1) {
      ex.greenhouse.built = true; ex.greenhouse.builtAt = Date.now(); ex.greenhouse.buildStartedAt = 0; saveExpansion();
      renderBuild(); return;
    }
    const stage = Math.min(3, Math.floor(pct * 4));
    status.textContent = `🚧 Đang thi công · Giai đoạn ${stage + 1}/4`;
    button.disabled = true; button.textContent = "⏳ Đang xây dựng..."; progress.hidden = false;
    if (fill) fill.style.width = `${pct * 100}%`;
    if (stageLabel) stageLabel.textContent = `${BUILD_STAGES[stage].icon} ${BUILD_STAGES[stage].name} · ${Math.ceil((duration - elapsed) / 1000)} giây còn lại`;
    if (scene) scene.classList.add("is-building");
  }
  function startBuild() {
    if (ex.greenhouse.built || ex.greenhouse.buildStartedAt) return;
    if (!spendCoins(420)) { toast("Cần 420 xu để xây nhà kính."); return; }
    ex.greenhouse.buildStartedAt = Date.now(); ex.greenhouse.buildDuration = 48000;
    saveExpansion(); renderBuild(); toast("Đã khởi công nhà kính! Công trình bắt đầu từ giai đoạn dọn mặt bằng.");
  }
  function renderMagicSeedSelect() {
    const select = $("greenhouse-seed-select");
    if (!select) return;
    const seeds = Object.entries(ex.greenhouse.magicalSeeds).filter(([, qty]) => Number(qty) > 0).map(([id, qty]) => ({ plant: catalogPlant(Number(id)), qty }));
    const previous = select.value;
    select.innerHTML = seeds.length ? seeds.map(x => `<option value="${x.plant.id}">${x.plant.icon} ${escapeHtml(x.plant.name)} · ×${x.qty}</option>`).join("") : '<option value="">Chưa có hạt huyền bí</option>';
    if (seeds.some(x => String(x.plant.id) === previous)) select.value = previous;
  }
  function escapeHtml(text) { return String(text).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
  function placePot(slotIndex) {
    if (!ex.greenhouse.built) return;
    const level = Number($("pot-selected")?.value || ex.selectedPot || 1);
    if (!(Number(ex.pots[level]) > 0)) { toast("Bạn chưa có chậu cấp này trong kho."); return; }
    ex.pots[level]--;
    ex.greenhouse.slots[slotIndex] = { potLevel: level, plant: null, placedAt: Date.now() };
    saveExpansion(); renderAll(); toast(`Đã đặt ${potLevels.find(p => p.level === level)?.name || "chậu"} vào vị trí ${slotIndex + 1}.`);
  }
  function removePot(slotIndex) {
    const slot = ex.greenhouse.slots[slotIndex];
    if (!slot || slot.plant) { toast("Hãy thu hoạch cây trước khi lấy chậu ra."); return; }
    ex.pots[slot.potLevel] = (Number(ex.pots[slot.potLevel]) || 0) + 1;
    ex.greenhouse.slots[slotIndex] = null;
    saveExpansion(); renderAll(); toast("Đã chuyển chậu về kho.");
  }
  function plantPot(slotIndex) {
    const slot = ex.greenhouse.slots[slotIndex];
    const id = Number($("greenhouse-seed-select")?.value);
    if (!slot || slot.plant || !id) { toast("Chọn hạt huyền bí trong kho trước nhé."); return; }
    const qty = Number(ex.greenhouse.magicalSeeds[id]) || 0;
    if (qty <= 0) { toast("Bạn đã hết hạt giống này."); return; }
    ex.greenhouse.magicalSeeds[id] = qty - 1;
    const plant = catalogPlant(id);
    slot.plant = { id, plantedAt: Date.now(), harvested: false };
    ex.greenhouse.discovered = Array.from(new Set([...ex.greenhouse.discovered, id]));
    saveExpansion(); renderAll(); toast(`🌱 Đã gieo ${plant.name} trong nhà kính.`);
  }
  function plantProgress(slot) {
    if (!slot?.plant) return 0;
    const p = catalogPlant(slot.plant.id);
    const pot = potLevels.find(z => z.level === Number(slot.potLevel)) || potLevels[0];
    const elapsed = Math.max(0, Date.now() - Number(slot.plant.plantedAt || Date.now()));
    return Math.min(1, elapsed * pot.multiplier / (p.seconds * 1000));
  }
  function harvestPot(slotIndex) {
    const slot = ex.greenhouse.slots[slotIndex];
    if (!slot?.plant || plantProgress(slot) < 1) return;
    const plant = catalogPlant(slot.plant.id);
    ex.greenhouse.totalHarvest = (Number(ex.greenhouse.totalHarvest) || 0) + 1;
    slot.plant = null;
    awardCoinsAndResearch(plant.reward, 3 + plant.rarity.cost / 40 | 0);
    saveExpansion(); renderAll();
    toast(`✨ Thu hoạch ${plant.name}! +${plant.reward} xu và điểm nghiên cứu.`);
  }
  function renderGreenhouseSlots() {
    const root = $("greenhouse-slots"); if (!root) return;
    root.innerHTML = ex.greenhouse.slots.map((slot, i) => {
      if (!slot) return `<article class="gh-slot gh-slot-empty"><div class="gh-slot-number">VỊ TRÍ ${i + 1}</div><div class="gh-slot-empty-art">🪵</div><b>Chưa đặt chậu</b><p>Chọn cấp chậu trong kho để bố trí vị trí trồng.</p><button class="primary" data-gh-place="${i}">🪴 Đặt chậu</button></article>`;
      const pot = potLevels.find(p => p.level === slot.potLevel) || potLevels[0];
      if (!slot.plant) return `<article class="gh-slot"><div class="gh-slot-number">VỊ TRÍ ${i + 1}</div><div class="gh-pot-art pot-level-${pot.level}"><span class="gh-pot-plant">🌱</span><span>${pot.icon}</span></div><b>${pot.name}</b><p>Sẵn sàng gieo · Tốc độ ×${pot.multiplier.toFixed(2)}</p><button class="primary" data-gh-plant="${i}">🌱 Gieo hạt đang chọn</button><button class="secondary" data-gh-remove="${i}">Thu chậu về kho</button></article>`;
      const plant = catalogPlant(slot.plant.id), pct = plantProgress(slot), ready = pct >= 1;
      return `<article class="gh-slot gh-slot-planted rarity-${plant.rarity.className}"><div class="gh-slot-number">VỊ TRÍ ${i + 1}</div><div class="gh-pot-art pot-level-${pot.level}"><span class="gh-growing-plant effect-${plant.effect.key}" style="--plant-progress:${Math.max(.2,pct)}">${plant.icon}</span><span>${pot.icon}</span><i class="gh-effect-particle">${plant.effect.icon}</i></div><b>${escapeHtml(plant.name)}</b><small>${plant.rarity.name} · ${plant.effect.name}</small><div class="gh-growth-track"><span style="width:${Math.round(pct * 100)}%"></span></div><p>${ready ? "✅ Đã trưởng thành" : `🌿 Đang phát triển · ${Math.floor(pct * 100)}%`}</p>${ready ? `<button class="primary" data-gh-harvest="${i}">🧺 Thu hoạch · +${plant.reward} xu</button>` : ""}</article>`;
    }).join("");
    root.querySelectorAll("[data-gh-place]").forEach(b => b.onclick = () => placePot(Number(b.dataset.ghPlace)));
    root.querySelectorAll("[data-gh-remove]").forEach(b => b.onclick = () => removePot(Number(b.dataset.ghRemove)));
    root.querySelectorAll("[data-gh-plant]").forEach(b => b.onclick = () => plantPot(Number(b.dataset.ghPlant)));
    root.querySelectorAll("[data-gh-harvest]").forEach(b => b.onclick = () => harvestPot(Number(b.dataset.ghHarvest)));
  }
  function renderMarket() {
    ensureMarket();
    const root = $("night-market-offers"); if (!root) return;
    root.innerHTML = (ex.greenhouse.marketOffers || []).map(offer => {
      const p = catalogPlant(offer.id);
      return `<article class="night-offer rarity-${p.rarity.className}"><div class="night-offer-art">${p.icon}<i>${p.effect.icon}</i></div><b>${escapeHtml(p.name)}</b><small>${p.rarity.name} · ${p.family}</small><p>${p.effect.description}</p><strong>🪙 ${p.cost} xu · Còn ${offer.stock}</strong><button class="primary" data-magic-buy="${p.id}" ${offer.stock <= 0 ? "disabled" : ""}>Mua hạt giống</button></article>`;
    }).join("");
    root.querySelectorAll("[data-magic-buy]").forEach(b => b.onclick = () => {
      const id = Number(b.dataset.magicBuy), offer = ex.greenhouse.marketOffers.find(o => o.id === id), p = catalogPlant(id);
      if (!offer || offer.stock <= 0) return;
      if (!spendCoins(p.cost)) { toast("Không đủ xu để mua hạt huyền bí."); return; }
      ex.greenhouse.magicalSeeds[id] = (Number(ex.greenhouse.magicalSeeds[id]) || 0) + 1;
      offer.stock--;
      ex.greenhouse.discovered = Array.from(new Set([...ex.greenhouse.discovered, id]));
      saveExpansion(); renderAll(); toast(`Đã mua hạt ${p.name} và thêm vào kho nhà kính.`);
    });
  }
  function renderMagicIndex() {
    const root = $("magic-plant-index"); if (!root) return;
    const query = ($( "magic-plant-search")?.value || "").trim().toLocaleLowerCase("vi");
    const rarity = $("magic-plant-rarity")?.value || "all";
    cachedFilter = [];
    for (let id = 1; id <= TOTAL_PLANTS; id++) {
      const p = catalogPlant(id);
      if (rarity !== "all" && p.rarity.name !== rarity) continue;
      if (query && !`${p.name} ${p.effect.name} ${p.family} ${p.rarity.name}`.toLocaleLowerCase("vi").includes(query)) continue;
      cachedFilter.push(p);
    }
    const pages = Math.max(1, Math.ceil(cachedFilter.length / PAGE_SIZE));
    page = Math.max(1, Math.min(pages, page));
    const start = (page - 1) * PAGE_SIZE;
    root.innerHTML = cachedFilter.slice(start, start + PAGE_SIZE).map(p => {
      const found = ex.greenhouse.discovered.includes(p.id);
      const qty = Number(ex.greenhouse.magicalSeeds[p.id]) || 0;
      return `<article class="magic-index-card rarity-${p.rarity.className} ${found ? "discovered" : "undiscovered"}"><div class="magic-index-art">${found ? p.icon : "❔"}<i>${found ? p.effect.icon : "🔒"}</i></div><b>${found ? escapeHtml(p.name) : "Giống huyền bí #" + p.id}</b><small>${p.rarity.name} · ${found ? p.effect.name : "Chưa khám phá"}</small><span>${qty > 0 ? `🎒 Hạt trong kho: ${qty}` : found ? "Đã ghi vào Index" : "Chưa mở khóa"}</span></article>`;
    }).join("") || '<p class="magic-index-empty">Không tìm thấy giống cây phù hợp.</p>';
    const label = $("magic-page-label"); if (label) label.textContent = `Trang ${page}/${pages} · ${cachedFilter.length.toLocaleString("vi-VN")} giống`;
    const prev = $("magic-prev"), next = $("magic-next"); if (prev) prev.disabled = page <= 1; if (next) next.disabled = page >= pages;
    const count = $("night-market-count"); if (count) count.textContent = `${TOTAL_PLANTS.toLocaleString("vi-VN")} giống · ${ex.greenhouse.discovered.length} đã khám phá`;
  }
  function renderAll() {
    ex = readExpansion();
    renderBuild(); renderMarket(); renderMagicIndex(); renderGreenhouseHeader();
    if (typeof window.renderPots === "function") { try { window.renderPots(); } catch (e) {} }
  }
  function init() {
    if (!$('page-greenhouse')) return;
    $('greenhouse-build-button')?.addEventListener('click', startBuild);
    $('magic-plant-search')?.addEventListener('input', () => { page = 1; renderMagicIndex(); });
    $('magic-plant-rarity')?.addEventListener('change', () => { page = 1; renderMagicIndex(); });
    $('magic-prev')?.addEventListener('click', () => { page = Math.max(1, page - 1); renderMagicIndex(); });
    $('magic-next')?.addEventListener('click', () => { page++; renderMagicIndex(); });
    $('pot-selected')?.addEventListener('change', e => { ex.selectedPot = Number(e.target.value) || 1; saveExpansion(); });
    window.addEventListener('aeCayKhePotsUpdated', renderAll);
    window.addEventListener('aeCayKheExternalUpdate', renderAll);
    window.addEventListener('aeCayKheStateUpdated', renderAll);
    renderAll();
    setInterval(() => { renderBuild(); renderGreenhouseSlots(); }, 1000);
    setInterval(() => { const today = dayKey(); if (ex.greenhouse.marketDay !== today) renderAll(); }, 30000);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
