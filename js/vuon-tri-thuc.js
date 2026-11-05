
(() => {
  "use strict";

  const GAME_KEY = "aeCayKheVuonTriThuc_v1";
  const QUIZ_KEY = "soPhieuQuiz";

  const seeds = {
    sunflower: {
      name: "Hướng dương",
      icon: "🌻",
      cost: 4,
      reward: 12,
      seconds: 25
    },
    carrot: {
      name: "Cà rốt",
      icon: "🥕",
      cost: 6,
      reward: 18,
      seconds: 40
    },
    strawberry: {
      name: "Dâu tây",
      icon: "🍓",
      cost: 10,
      reward: 30,
      seconds: 60
    }
  };

  const defaultState = {
    coins: 30,
    level: 1,
    harvests: 0,
    totalSpent: 0,

    pet: {
      name: "Mèo Mướp",
      icon: "🐱",
      hunger: 70,
      bond: 0
    },

    selectedSeed: "sunflower",

    seeds: {
      sunflower: 3,
      carrot: 1,
      strawberry: 0
    },

    plots: Array(6).fill(null),

    tasks: {
      plant: false,
      water: false,
      play: false,
      harvest: false
    },

    lastCare: Date.now(),
    lastAction: "Chào mừng bạn đến với khu vườn!"
  };

  const $ = id => document.getElementById(id);

  let state = loadState();
  let toastTimer;

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(GAME_KEY));

      if (saved && typeof saved === "object") {
        return {
          ...defaultState,
          ...saved,

          pet: {
            ...defaultState.pet,
            ...saved.pet
          },

          seeds: {
            ...defaultState.seeds,
            ...saved.seeds
          },

          tasks: {
            ...defaultState.tasks,
            ...saved.tasks
          },

          plots: Array.isArray(saved.plots)
            ? saved.plots.slice(0, 6)
            : Array(6).fill(null)
        };
      }
    } catch (e) {
      console.log("Không thể đọc dữ liệu game:", e);
    }

    return JSON.parse(JSON.stringify(defaultState));
  }

  function save() {
    localStorage.setItem(GAME_KEY, JSON.stringify(state));
  }

  function quizTickets() {
    return Math.max(
      0,
      Number(localStorage.getItem(QUIZ_KEY)) || 0
    );
  }

  function notify(message) {
    const el = $("toast");

    if (!el) {
      console.log(message);
      return;
    }

    el.textContent = message;
    el.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
      el.classList.remove("show");
    }, 2400);
  }


  function switchTab(tab) {
    document.querySelectorAll(".tab").forEach(button => {
      button.classList.toggle(
        "active",
        button.dataset.tab === tab
      );
    });

    document.querySelectorAll(".tab-page").forEach(page => {
      page.classList.toggle(
        "active",
        page.id === "page-" + tab
      );
    });
  }

  document.querySelectorAll(".tab").forEach(button => {
    button.addEventListener("click", () => {
      switchTab(button.dataset.tab);
    });
  });


  function buySeed(type) {
    const seed = seeds[type];

    if (!seed) return;

    if (state.coins < seed.cost) {
      notify("Bạn chưa đủ xu để mua hạt giống!");
      return;
    }

    state.coins -= seed.cost;
    state.seeds[type] = (state.seeds[type] || 0) + 1;
    state.totalSpent += seed.cost;

    save();
    render();

    notify("Đã mua 1 túi hạt " + seed.name + "!");

    moThuThachSach();
  }



  function plant(index) {
    if (state.plots[index]) {
      harvest(index);
      return;
    }

    const type = state.selectedSeed;
    const seed = seeds[type];

    if (!seed || (state.seeds[type] || 0) <= 0) {
      notify("Bạn đã hết hạt giống này. Hãy mua thêm trong cửa hàng.");
      return;
    }

    state.seeds[type]--;

    state.plots[index] = {
      type: type,
      plantedAt: Date.now(),
      watered: false
    };

    state.tasks.plant = true;

    save();
    render();

    notify("Đã gieo " + seed.name + "! Cây sẽ lớn dần.");

    moThuThachSach();
  }

  function progress(plot) {
    if (!plot || !seeds[plot.type]) return 0;

    const seed = seeds[plot.type];

    return Math.min(
      1,
      (Date.now() - plot.plantedAt) / (seed.seconds * 1000)
    );
  }

  function cropStage(plot) {
    const p = progress(plot);

    if (p >= 1) return 3;
    if (p >= 0.55) return 2;
    if (p >= 0.2) return 1;

    return 0;
  }

  const cropIcons = {
    sunflower: ["🌱", "🌿", "🌻", "🌻"],
    carrot: ["🌱", "🌿", "🥬", "🥕"],
    strawberry: ["🌱", "🌿", "🍃", "🍓"]
  };

  

  function harvest(index) {
    const plot = state.plots[index];

    if (!plot) return;

    if (progress(plot) < 1) {
      notify("Cây chưa chín đâu! Hãy chờ thêm một chút.");
      return;
    }

    const seed = seeds[plot.type];

    state.coins += seed.reward;
    state.harvests++;

    state.plots[index] = null;
    state.tasks.harvest = true;

    state.level = 1 + Math.floor(state.harvests / 5);

    save();
    render();

    notify("Thu hoạch thành công! +" + seed.reward + " xu.");

    moThuThachSach();
  }



  function waterAll() {
    const growing = state.plots.filter(Boolean);

    if (!growing.length) {
      notify("Vườn chưa có cây để tưới.");
      return;
    }

    growing.forEach(plot => {
      plot.watered = true;
    });

    state.tasks.water = true;

    save();
    render();

    notify("Đã tưới nước cho khu vườn! 💧");

    moThuThachSach();
  }

 

  function feedPet() {
    if (state.coins < 5) {
      notify("Bạn cần 5 xu để mua thức ăn cho pet.");
      return;
    }

    if (state.pet.hunger >= 100) {
      notify("Pet đã no căng rồi!");
      return;
    }

    state.coins -= 5;
    state.totalSpent += 5;

    state.pet.hunger = Math.min(
      100,
      state.pet.hunger + 30
    );

    state.pet.bond = Math.min(
      100,
      state.pet.bond + 3
    );

    save();
    render();

    notify("Mèo Mướp ăn ngon lành! 🍓");

    moThuThachSach();
  }

  function playPet() {
    state.pet.bond = Math.min(
      100,
      state.pet.bond + 10
    );

    state.pet.hunger = Math.max(
      0,
      state.pet.hunger - 5
    );

    state.tasks.play = true;

    save();
    render();

    notify("Pet rất vui khi được chơi cùng bạn! 💚");

    moThuThachSach();
  }


function buyTicket() {
    const cost = 25;

    if (state.coins < cost) {
        notify("Bạn cần 25 xu để đổi 1 phiếu Quiz!");
        return;
    }
    const current =
        Number(localStorage.getItem("soPhieuQuiz")) || 0;

    const newTickets = current + 1;

    localStorage.setItem("soPhieuQuiz", String(newTickets));

    state.coins -= cost;
    state.totalSpent += cost;
    state.lastAction = "Đã đổi 1 phiếu Quiz";

    save();
    render();

    try {
        const channel = new BroadcastChannel("ae-cay-khe-quiz-wallet");

        channel.postMessage({
            type: "QUIZ_TICKETS_UPDATED",
            tickets: newTickets
        });

        channel.close();
    } catch (e) {
        console.log("Không thể gửi thông báo cập nhật phiếu.");
    }

    notify("Đổi thành công! Đã chuyển 1 phiếu về website chính.");

    setTimeout(function() {
        window.location.href = "index.html";
    }, 1500);
}


 

  function claimTask(task) {
    const rewards = {
      plant: 5,
      water: 5,
      play: 5,
      harvest: 10
    };

    if (!state.tasks[task]) {
      notify("Bạn chưa hoàn thành nhiệm vụ này.");
      return;
    }

    if (state.tasks["claimed_" + task]) {
      notify("Nhiệm vụ này đã nhận thưởng rồi.");
      return;
    }

    if (rewards[task] === undefined) return;

    state.tasks["claimed_" + task] = true;
    state.coins += rewards[task];

    save();
    render();

    notify("Hoàn thành nhiệm vụ! +" + rewards[task] + " xu.");
  }



  function renderPlots() {
    const container = $("plots");

    if (!container) return;

    container.innerHTML = "";

    state.plots.forEach((plot, index) => {
      const button = document.createElement("button");

      button.className =
        "plot" +
        (plot && progress(plot) >= 1 ? " ready" : "") +
        (plot ? "" : " empty");

      if (!plot) {
        button.innerHTML =
          '<span class="crop">＋</span>' +
          '<small>Ô đất trống</small>';

        button.addEventListener("click", () => {
          plant(index);
        });
      } else {
        const stage = cropStage(plot);
        const seed = seeds[plot.type];

        if (!seed) return;

        const remaining = Math.max(
          0,
          Math.ceil(seed.seconds * (1 - progress(plot)))
        );

        button.innerHTML =
          '<span class="crop">' +
          cropIcons[plot.type][stage] +
          '</span><small>' +
          seed.name +
          " · " +
          (stage === 3 ? "Đã chín" : remaining + " giây") +
          "</small>";

        button.addEventListener("click", () => {
          harvest(index);
        });
      }

      container.appendChild(button);
    });
  }



  function renderSeeds() {
    const container = $("seed-list");

    if (!container) return;

    container.innerHTML = "";

    Object.keys(seeds).forEach(type => {
      const seed = seeds[type];

      const button = document.createElement("button");

      button.className =
        "seed-option" +
        (state.selectedSeed === type ? " selected" : "");

      button.innerHTML =
        "<span>" + seed.icon + "</span>" +
        "<div><b>" + seed.name + "</b>" +
        "<small>Đang có: " +
        (state.seeds[type] || 0) +
        "</small></div>";

      button.addEventListener("click", () => {
        state.selectedSeed = type;

        save();
        renderSeeds();
      });

      container.appendChild(button);
    });
  }



  function renderInventory() {
    const container = $("inventory-grid");

    if (!container) return;

    const items = [
      ...Object.keys(seeds).map(key => ({
        icon: seeds[key].icon,
        name: seeds[key].name,
        count: state.seeds[key] || 0
      })),

      {
        icon: "🎟️",
        name: "Phiếu Quiz",
        count: quizTickets()
      },

      {
        icon: "🪙",
        name: "Xu vườn",
        count: state.coins
      }
    ];

    container.innerHTML = items.map(item =>
      '<div class="inventory-item">' +
      "<span>" + item.icon + "</span>" +
      "<b>" + item.name + "</b>" +
      "<small>Số lượng: " + item.count + "</small>" +
      "</div>"
    ).join("");
  }

 

  function renderTasks() {
    document.querySelectorAll(".task-btn").forEach(button => {
      const key = button.dataset.task;

      const claimed = !!state.tasks["claimed_" + key];
      const done = !!state.tasks[key];

      button.disabled = !done || claimed;

      button.textContent = claimed
        ? "Đã nhận"
        : done
          ? "Nhận thưởng"
          : "Chưa hoàn thành";
    });
  }


  function render() {
    if ($("coin-count")) {
      $("coin-count").textContent = state.coins;
    }

    if ($("level")) {
      $("level").textContent = state.level;
    }

    if ($("harvest-total")) {
      $("harvest-total").textContent = state.harvests;
    }

    if ($("pet-bond")) {
      $("pet-bond").textContent = state.pet.bond;
    }

    if ($("hero-pet")) {
      $("hero-pet").textContent = state.pet.icon;
    }

    if ($("big-pet")) {
      $("big-pet").textContent = state.pet.icon;
    }

    if ($("pet-name")) {
      $("pet-name").textContent = state.pet.name;
    }

    if ($("hunger-label")) {
      $("hunger-label").textContent = state.pet.hunger + "/100";
    }

    if ($("bond-label")) {
      $("bond-label").textContent = state.pet.bond + "/100";
    }

    if ($("hunger-bar")) {
      $("hunger-bar").style.width = state.pet.hunger + "%";
    }

    if ($("bond-bar")) {
      $("bond-bar").style.width = state.pet.bond + "%";
    }

    if ($("pet-mood")) {
      $("pet-mood").textContent =
        state.pet.hunger < 30
          ? "Mình hơi đói rồi..."
          : state.pet.bond >= 70
            ? "Mình rất quý bạn!"
            : "Mình đang vui vẻ!";
    }

    if ($("spent-total")) {
      $("spent-total").textContent = state.totalSpent + " xu";
    }

    if ($("cart-description")) {
      $("cart-description").textContent =
        state.lastAction || "Chưa có giao dịch nào.";
    }

    renderPlots();
    renderSeeds();
    renderInventory();
    renderTasks();
  }



  if ($("water-all")) {
    $("water-all").addEventListener("click", waterAll);
  }

  if ($("feed-pet")) {
    $("feed-pet").addEventListener("click", feedPet);
  }

  if ($("play-pet")) {
    $("play-pet").addEventListener("click", playPet);
  }

  if ($("buy-ticket")) {
    $("buy-ticket").addEventListener("click", buyTicket);
  }

  document.querySelectorAll(".buy-seed").forEach(button => {
    button.addEventListener("click", () => {
      buySeed(button.dataset.seed);
    });
  });

  document.querySelectorAll(".task-btn").forEach(button => {
    button.addEventListener("click", () => {
      claimTask(button.dataset.task);
    });
  });



  let quizSachDangMo = false;
  let quizSachDaTraLoi = false;

  const cauHoiSach = [
    {
      cauHoi: "Tác phẩm Sửa đổi lối làm việc do ai viết?",
      dapAn: [
        "Trần Phú",
        "Hồ Chí Minh",
        "Võ Nguyên Giáp",
        "Phạm Văn Đồng"
      ],
      dapAnDung: 1,
      giaiThich: "Tác phẩm do Hồ Chí Minh viết."
    },
    {
      cauHoi: "Tác phẩm được viết vào thời gian nào?",
      dapAn: [
        "Năm 1930",
        "Năm 1945",
        "Tháng 10 năm 1947",
        "Năm 1954"
      ],
      dapAnDung: 2,
      giaiThich: "Tác phẩm được viết vào tháng 10 năm 1947."
    },
    {
      cauHoi: "Tác giả sử dụng bút danh nào?",
      dapAn: [
        "Nguyễn Ái Quốc",
        "X.Y.Z",
        "T.L",
        "Văn Ba"
      ],
      dapAnDung: 1,
      giaiThich: "Tác phẩm được viết dưới bút danh X.Y.Z."
    },
    {
      cauHoi: "Tác phẩm có bao nhiêu phần chính?",
      dapAn: [
        "4 phần",
        "5 phần",
        "6 phần",
        "8 phần"
      ],
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

    const popup = $("quizSachPopup");

    if (!popup) {
      console.log("Chưa tìm thấy HTML quizSachPopup.");
      return;
    }

    const cauHoi = $("quizSachCauHoi");
    const dapAn = $("quizSachDapAn");
    const ketQua = $("quizSachKetQua");
    const nutDong = $("quizSachDong");

    if (!cauHoi || !dapAn || !ketQua || !nutDong) {
      console.log("Thiếu một phần HTML của popup câu hỏi.");
      return;
    }

    quizSachDangMo = true;
    quizSachDaTraLoi = false;

    const viTri = Math.floor(
      Math.random() * cauHoiSach.length
    );

    const cau = cauHoiSach[viTri];

    popup.style.display = "flex";

    cauHoi.textContent = cau.cauHoi;
    ketQua.textContent = "";
    nutDong.style.display = "none";

    dapAn.innerHTML = "";

    cau.dapAn.forEach((noiDung, i) => {
      const button = document.createElement("button");

      button.type = "button";

      button.textContent =
        String.fromCharCode(65 + i) + ". " + noiDung;

      button.addEventListener("click", () => {
        traLoiQuizSach(i, viTri);
      });

      dapAn.appendChild(button);
    });
  }



  function traLoiQuizSach(chon, viTri) {
    if (quizSachDaTraLoi) return;

    const cau = cauHoiSach[viTri];

    if (!cau) return;

    quizSachDaTraLoi = true;

    const dapAn = $("quizSachDapAn");
    const ketQua = $("quizSachKetQua");
    const nutDong = $("quizSachDong");

    if (!dapAn || !ketQua || !nutDong) return;

    const cacNut = dapAn.children;

    Array.from(cacNut).forEach(button => {
      button.disabled = true;
    });

    if (chon === cau.dapAnDung) {
      state.coins += 10;

      save();
      render();

      ketQua.innerHTML =
        "🎉 Chính xác! Bạn nhận được +10 xu!<br>" +
        cau.giaiThich;

      cacNut[chon].classList.add("dung");

    } else {
      ketQua.innerHTML =
        "❌ Chưa chính xác!<br>" +
        "Đáp án đúng: " +
        cau.dapAn[cau.dapAnDung] +
        "<br>" +
        cau.giaiThich;

      cacNut[chon].classList.add("sai");

      cacNut[cau.dapAnDung].classList.add("dung");
    }

    nutDong.style.display = "inline-block";
  }


  function dongQuizSach() {
    const popup = $("quizSachPopup");

    if (popup) {
      popup.style.display = "none";
    }

    quizSachDangMo = false;
    quizSachDaTraLoi = false;
  }

  window.dongQuizSach = dongQuizSach;

  window.moThuThachSach = moThuThachSach;



  const elapsed = Math.floor(
    (Date.now() - (state.lastCare || Date.now())) / 60000
  );

  if (elapsed > 0) {
    state.pet.hunger = Math.max(
      0,
      state.pet.hunger - Math.min(25, elapsed)
    );

    state.lastCare = Date.now();

    save();
  }

  render();

  setInterval(() => {
    if (state.plots.some(Boolean)) {
      renderPlots();
    }
  }, 1000);


  window.addEventListener("storage", event => {
    if (event.key === QUIZ_KEY) {
      renderInventory();
    }
  });
  try {
    const channel = new BroadcastChannel("ae-cay-khe-quiz-wallet");

    channel.addEventListener("message", event => {
      if (event.data && event.data.type === "QUIZ_TICKETS_UPDATED") {
        renderInventory();
      }
    });
  } catch (e) {
    console.log("Không hỗ trợ BroadcastChannel.");
  }

})();
