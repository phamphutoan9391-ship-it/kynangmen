var LUCKY_DRAW_PRIZES = [
    { name: "Ú òa!", label: "Ú òa!", type: "boo", code: "" },
    { name: "Phiếu bé ngoan", label: "Phiếu bé ngoan\nthôi", type: "coupon", code: "con Gà lỏ chưa??" },
    { name: "Phiếu bé ngoan", label: "Phiếu bé ngoan\nthôi", type: "coupon", code: "MÀY NGUU lắm EM!" },
    { name: "Phiếu bé ngoan", label: "Phiếu bé ngoan\nthôi", type: "coupon", code: "mày thật sự đánh cược vận may à?" },
    { name: "Ú òa!", label: "Ú òa!", type: "boo", code: "" },
    { name: "Phiếu bé ngoan", label: "Phiếu bé ngoan\nthôi", type: "coupon", code: "bỏ đi mà làm người" },
    { name: "Phiếu bé ngoan", label: "Phiếu bé ngoan\nthôi", type: "coupon", code: "con Gà lỏ chưa??" },
    { name: "Phiếu bé ngoan", label: "Phiếu bé ngoan\nthôi", type: "coupon", code: "mày thật sự đánh cược vận may à?" }
];

var DIEM_MOI_PHIEU = 20;
var SO_PHIEU_TOI_DA = 3;

var LUCKY_DRAW_SPINS_PER_GAME = 1;
var LUCKY_DRAW_SPIN_DURATION = 7200;


var score = 0;
var timeLeft = 40;
var timespeed = 1;
var booPower = 0;
var streak = 0;
var lastActionTime = 0;
var gameFrozen = false;
var gameOver = false;
var soundOn = true;
var audioContext = null;

var luckySpinsEarned = 0;
var luckySpinsRemaining = 0;
var luckySpinBusy = false;
var wheelRotation = 0;

var scoreValue = document.getElementById("scoreValue");
var timerValue = document.getElementById("timerValue");
var streakValue = document.getElementById("streakValue");
var booValue = document.getElementById("booValue");
var booFill = document.getElementById("booFill");
var booHint = document.getElementById("booHint");
var pumpkinButton = document.getElementById("pumpkinButton");
var ghostLayer = document.getElementById("ghostLayer");
var freezeScreen = document.getElementById("freezeScreen");
var freezeCount = document.getElementById("freezeCount");
var streakBanner = document.getElementById("streakBanner");
var lightningFlash = document.getElementById("lightningFlash");
var gameOverScreen = document.getElementById("gameOverScreen");
var luckyIntro = document.getElementById("luckyIntro");
var luckySpinsCount = document.getElementById("luckySpinsCount");
var luckyResult = document.getElementById("luckyResult");
var luckyDrawStatus = document.getElementById("luckyDrawStatus");
var luckySpinButton = document.getElementById("luckySpinButton");
var luckyDoneButton = document.getElementById("luckyDoneButton");
var prizeWheel = document.getElementById("prizeWheel");
var wheelLabels = document.getElementById("wheelLabels");
var wheelLights = document.getElementById("wheelLights");
var wheelPointer = document.getElementById("wheelPointer");
var treatMessage = document.getElementById("treatMessage");
var treatButton = document.getElementById("treatButton");
var imageCard = document.getElementById("imageCard");
var candyCursor = document.getElementById("candyCursor");
var lastSprinkle = 0;


function updateScore() {
    scoreValue.innerHTML = score;
}

function changeScore(amount) {
    score = score + amount;

    if (score < 0) {
        score = 0;
    }

    updateScore();
}

function updateBoo() {
    booValue.innerHTML = booPower + "%";
    booFill.style.width = booPower + "%";

    if (booPower >= 100) {
        pumpkinButton.classList.add("ready");
        booHint.innerHTML = "BÍ NGÔ ĐÃ ĐẦY NĂNG LƯỢNG! CHẠM NGAY!";
        pumpkinButton.title = "Sóng xung kích đã sẵn sàng!";
    } else {
        pumpkinButton.classList.remove("ready");
        booHint.innerHTML = "Cho ma ăn để nạp năng lượng!";
        pumpkinButton.title = "Cho ma ăn để nạp năng lượng cho bí ngô";
    }
}

function showMessage(message) {
    treatMessage.innerHTML = message;
}


function updateLuckySpins() {
    luckySpinsCount.innerHTML = luckySpinsRemaining;

    luckySpinButton.disabled =
        luckySpinsRemaining <= 0 || luckySpinBusy;

    luckyDoneButton.hidden =
        luckySpinsRemaining > 0 || luckySpinBusy;
}

function buildLuckyWheel() {
    for (var i = 0; i < LUCKY_DRAW_PRIZES.length; i++) {
        var label = document.createElement("span");

        label.className = "wheel-label";
        label.innerHTML = LUCKY_DRAW_PRIZES[i].label;

        var angle = i * 45;

        label.style.transform =
            "rotate(" + angle + "deg) translateY(-103px) rotate(" + (-angle) + "deg)";

        wheelLabels.appendChild(label);
    }

    for (var j = 0; j < 24; j++) {
        var light = document.createElement("span");

        light.className = "wheel-light";

        light.style.transform =
            "rotate(" + (j * 15) + "deg) translateY(-174px)";

        light.style.animationDelay = (-j * .055) + "s";

        wheelLights.appendChild(light);
    }
}

function tickWheelPointer() {
    wheelPointer.classList.remove("tick");

    void wheelPointer.offsetWidth;

    wheelPointer.classList.add("tick");

    playSound("tick");
}

function showerLuckyConfetti() {
    var colors = [
        "#f06e43",
        "#f7c95e",
        "#9d83cf",
        "#f29fbd",
        "#82bca0",
        "#fff4d9"
    ];

    for (var i = 0; i < 54; i++) {
        var piece = document.createElement("span");

        piece.className = "lucky-confetti";

        piece.style.left = (Math.random() * 100) + "vw";

        piece.style.backgroundColor =
            colors[Math.floor(Math.random() * colors.length)];

        piece.style.setProperty(
            "--fall",
            (2.1 + Math.random() * 2.2) + "s"
        );

        piece.style.setProperty(
            "--drift",
            (Math.random() * 180 - 90) + "px"
        );

        piece.style.setProperty(
            "--spin",
            (Math.random() * 900 + 300) + "deg"
        );

        piece.style.animationDelay =
            (Math.random() * .45) + "s";

        document.body.appendChild(piece);

        setTimeout(function (item) {
            item.remove();
        }, 5000, piece);
    }
}


function playSound(kind) {
    if (!soundOn) return;

    var AudioClass =
        window.AudioContext || window.webkitAudioContext;

    if (!AudioClass) return;

    if (audioContext == null) {
        audioContext = new AudioClass();
    }

    if (audioContext.state == "suspended") {
        audioContext.resume();
    }

    var notes = [660, 880];

    if (kind == "spider") notes = [520, 760];
    if (kind == "ghost") notes = [420, 620, 820];
    if (kind == "freeze") notes = [920, 740, 540];
    if (kind == "corn") notes = [740, 990];
    if (kind == "bat") notes = [190, 95, 520];
    if (kind == "pumpkin") notes = [260, 390, 580, 780];
    if (kind == "steal") notes = [240, 160];
    if (kind == "tick") notes = [1250];
    if (kind == "win") notes = [523, 659, 784, 1047];
    if (kind == "boo") notes = [330, 260];

    for (var i = 0; i < notes.length; i++) {
        var oscillator = audioContext.createOscillator();
        var gain = audioContext.createGain();

        oscillator.type =
            (kind == "steal" || kind == "bat")
            ? "sawtooth"
            : "triangle";

        var noteStart =
            audioContext.currentTime + i * .075;

        var noteLength =
            kind == "tick" ? .045 : .16;

        oscillator.frequency.setValueAtTime(
            notes[i],
            noteStart
        );

        gain.gain.setValueAtTime(.0001, noteStart);

        gain.gain.linearRampToValueAtTime(
            kind == "tick" ? .035 : .085,
            noteStart + .015
        );

        gain.gain.exponentialRampToValueAtTime(
            .0001,
            noteStart + noteLength
        );

        oscillator.connect(gain);
        gain.connect(audioContext.destination);

        oscillator.start(noteStart);
        oscillator.stop(noteStart + noteLength + .01);
    }
}


function addStreak() {
    var now = Date.now();

    if (now - lastActionTime > 4200) {
        streak = 0;
    }

    streak = streak + 1;
    lastActionTime = now;

    streakValue.innerHTML = streak + "×";

    var label = "";

    if (streak >= 7) {
        label = "BẤT KHẢ CHIẾN BẠI!";
    } else if (streak >= 4) {
        label = "RÙNG RỢN!";
    } else if (streak >= 2) {
        label = "NGỌT NGÀO!";
    }

    if (label != "") {
        streakBanner.innerHTML = label + " ✨";

        streakBanner.classList.remove("show");

        void streakBanner.offsetWidth;

        streakBanner.classList.add("show");
    }
}


function taoHatRac(x, y) {
    var mauSac = [
        "#fff1b8",
        "#f5a6c8",
        "#bba9ee",
        "#bce7c8",
        "#fff8e9"
    ];

    var hat = document.createElement("span");

    hat.className = "sprinkle";
    hat.style.left = x + "px";
    hat.style.top = y + "px";

    hat.style.backgroundColor =
        mauSac[Math.floor(Math.random() * mauSac.length)];

    hat.style.setProperty(
        "--drift-x",
        (Math.random() * 42 - 21) + "px"
    );

    hat.style.setProperty(
        "--drift-y",
        (Math.random() * 48 + 15) + "px"
    );

    document.body.appendChild(hat);

    setTimeout(function () {
        hat.remove();
    }, 700);
}

document.addEventListener("mousemove", function (event) {
    if (!window.matchMedia("(pointer: fine)").matches) return;

    candyCursor.classList.add("visible");

    var angle =
        Math.atan2(
            event.movementY || 0,
            event.movementX || 0
        ) * 180 / Math.PI;

    candyCursor.style.transform =
        "translate(" + event.clientX + "px," +
        event.clientY + "px) rotate(" + (angle + 18) + "deg)";

    if (Date.now() - lastSprinkle > 24) {
        taoHatRac(event.clientX, event.clientY);
        lastSprinkle = Date.now();
    }

    var rect = imageCard.getBoundingClientRect();

    var x = (event.clientX - rect.left) / rect.width;
    var y = (event.clientY - rect.top) / rect.height;

    if (x >= 0 && x <= 1 && y >= 0 && y <= 1) {
        imageCard.style.transform =
            "rotateX(" + ((.5 - y) * 13) + "deg) " +
            "rotateY(" + ((x - .5) * 13) + "deg) rotate(1deg)";
    }
});

document.addEventListener("mouseleave", function () {
    candyCursor.classList.remove("visible");
});

imageCard.addEventListener("mouseleave", function () {
    imageCard.style.transform = "rotate(2deg)";
});


function thaKeo(x, y, soLuong) {
    var loaiKeo = ["🍬", "🍭", "🍬", "🍭", "🍫", "corn"];

    for (var i = 0; i < soLuong; i++) {
        var keo = document.createElement("span");

        var goc =
            (Math.PI * 2 * i / soLuong) + (Math.random() * .35);

        var khoangCach = 75 + Math.random() * 135;

        var lechX = Math.cos(goc) * khoangCach;
        var lechY = Math.sin(goc) * khoangCach - 35;

        var loai =
            loaiKeo[Math.floor(Math.random() * loaiKeo.length)];

        if (loai == "corn") {
            keo.className = "burst-candy corn";
        } else {
            keo.className = "burst-candy";
            keo.innerHTML = loai;

            keo.style.setProperty(
                "--size",
                (20 + Math.random() * 17) + "px"
            );
        }

        keo.style.left = x + "px";
        keo.style.top = y + "px";

        keo.style.setProperty("--burst-x", lechX + "px");
        keo.style.setProperty("--burst-y", lechY + "px");
        keo.style.setProperty("--bounce-x", (lechX * 1.08) + "px");
        keo.style.setProperty("--bounce-y", (lechY * 1.08) + "px");

        keo.style.setProperty(
            "--spin",
            (Math.random() * 520 - 260) + "deg"
        );

        document.body.appendChild(keo);

        setTimeout(function (item) {
            item.remove();
        }, 1050, keo);
    }
}

document.addEventListener("click", function (event) {
    thaKeo(event.clientX, event.clientY, 13);
});


function feedGhost(ghost, fromShockwave) {
    if (ghost == null || gameOver) return;

    if (!fromShockwave && ghost.classList.contains("fed")) {
        return;
    }

    ghost.classList.add("fed");
    ghost.innerHTML = "🥰<span>NGON QUÁ!</span>";

    if (fromShockwave) {
        changeScore(3);
    } else {
        changeScore(1);

        booPower = booPower + 25;

        if (booPower > 100) {
            booPower = 100;
        }

        updateBoo();
        addStreak();
        playSound("ghost");
    }

    setTimeout(function () {
        if (ghost.isConnected) {
            ghost.classList.remove("fed");
            ghost.innerHTML = "👻<span>ĐÓI BỤNG</span>";
        }
    }, 2100);
}

function taoGhosts() {
    var viTri = ["9%", "31%", "57%", "79%"];
    var doCao = ["112px", "150px", "104px", "136px"];

    for (var i = 0; i < 4; i++) {
        var ghost = document.createElement("button");

        ghost.type = "button";
        ghost.className = "game-ghost";
        ghost.innerHTML = "👻<span>ĐÓI BỤNG</span>";

        ghost.style.setProperty("--ghost-left", viTri[i]);
        ghost.style.setProperty("--ghost-bottom", doCao[i]);
        ghost.style.setProperty("--ghost-speed", (2.8 + i * .45) + "s");
        ghost.style.setProperty("--ghost-delay", (-i * .6) + "s");

        ghost.setAttribute(
            "aria-label",
            "Cho hồn ma đang đói ăn để nhận điểm và năng lượng Ú ÒA"
        );

        ghost.addEventListener("click", function () {
            if (gameFrozen || gameOver) return;

            feedGhost(this, false);

            showMessage(
                "Một hồn ma đã được ăn kẹo! +1 điểm · +25% năng lượng 👻"
            );
        });

        ghostLayer.appendChild(ghost);
    }
}


function taoSongXungKich() {
    var rect = pumpkinButton.getBoundingClientRect();

    var wave = document.createElement("span");

    wave.className = "shockwave";

    wave.style.left =
        (rect.left + rect.width / 2) + "px";

    wave.style.top =
        (rect.top + rect.height / 2) + "px";

    document.body.appendChild(wave);

    setTimeout(function () {
        wave.remove();
    }, 950);

    var ghosts = document.getElementsByClassName("game-ghost");

    var soLuong = ghosts.length;

    for (var i = 0; i < soLuong; i++) {
        feedGhost(ghosts[i], true);
    }

    booPower = 0;

    updateBoo();
    playSound("pumpkin");

    showMessage(
        "SÓNG XUNG KÍCH BÍ NGÔ! Tất cả hồn ma đều nhận được kẹo! 🎃"
    );

    streak = streak + 1;

    streakValue.innerHTML = streak + "×";

    if (streak >= 7) {
        streakBanner.innerHTML = "BẤT KHẢ CHIẾN BẠI! ✨";
    } else {
        streakBanner.innerHTML = "RÙNG RỢN! ✨";
    }

    streakBanner.classList.remove("show");

    void streakBanner.offsetWidth;

    streakBanner.classList.add("show");
}

pumpkinButton.addEventListener("click", function () {
    if (gameFrozen || gameOver) return;

    if (booPower < 100) {
        showMessage(
            "Bí ngô cần đủ 100% năng lượng Ú ÒA. Hãy cho 4 hồn ma đang đói ăn trước nhé!"
        );

        return;
    }

    taoSongXungKich();
});


function spawnSpider() {
    if (gameFrozen || gameOver) return;

    var spider = document.createElement("button");

    spider.type = "button";
    spider.className = "spider-drop";
    spider.innerHTML = "<span>🕷️</span>";

    spider.style.left = (5 + Math.random() * 90) + "vw";

    spider.style.setProperty(
        "--fall-time",
        (6.8 + Math.random() * 2.2) + "s"
    );

    spider.setAttribute("aria-label", "Bắt nhện để nhận 2 điểm");

    spider.addEventListener("click", function () {
        if (gameFrozen || gameOver || this.dataset.caught == "yes") {
            return;
        }

        this.dataset.caught = "yes";

        changeScore(2);
        addStreak();
        playSound("spider");

        showMessage("Bắt được nhện! +2 điểm 🕷️");

        this.remove();
    });

    spider.addEventListener("animationend", function () {
        if (this.isConnected && this.dataset.caught != "yes") {
            if (!gameOver) {
                changeScore(-3);
                playSound("steal");

                showMessage(
                    "Ôi không! Nhện đã chạm đất và lấy mất 3 điểm của bạn! 🕷️"
                );
            }

            this.remove();
        }
    });

    document.body.appendChild(spider);
}


function spawnCorn() {
    if (gameFrozen || gameOver) return;

    var corn = document.createElement("button");

    corn.type = "button";
    corn.className = "corn-drift";

    corn.style.setProperty(
        "--corn-top",
        (18 + Math.random() * 62) + "vh"
    );

    corn.style.setProperty(
        "--corn-time",
        (8 + Math.random() * 5) + "s"
    );

    if (Math.random() > .5) {
        corn.classList.add("reverse");
    }

    corn.setAttribute(
        "aria-label",
        "Nhặt kẹo bắp để nhận thêm 2 điểm"
    );

    corn.addEventListener("click", function () {
        if (gameFrozen || gameOver || this.dataset.taken == "yes") {
            return;
        }

        this.dataset.taken = "yes";

        changeScore(2);
        addStreak();
        playSound("corn");

        showMessage("Đã nhặt được kẹo bắp! +2 điểm thưởng 🌽");

        this.remove();
    });

    corn.addEventListener("animationend", function () {
        this.remove();
    });

    document.body.appendChild(corn);
}


function launchWitch() {
    if (gameFrozen || gameOver) return;

    var witch = document.createElement("button");

    witch.type = "button";
    witch.className = "witch-flight";
    witch.innerHTML = "🧙🏻‍♀️🧹";

    witch.style.setProperty(
        "--witch-top",
        (12 + Math.random() * 43) + "vh"
    );

    witch.setAttribute(
        "aria-label",
        "Chạm vào phù thủy để đóng băng thời gian trong 3 giây"
    );

    witch.addEventListener("click", function () {
        if (gameFrozen || gameOver || this.dataset.tapped == "yes") {
            return;
        }

        this.dataset.tapped = "yes";

        freezeTime();

        showMessage(
            "Phép thuật phù thủy đã kích hoạt! Thời gian đóng băng trong 3 giây! ❄️"
        );
    });

    witch.addEventListener("animationend", function () {
        this.remove();
    });

    document.body.appendChild(witch);
}

function freezeTime() {
    if (gameFrozen || gameOver) return;

    gameFrozen = true;

    document.body.classList.add("time-frozen");
    freezeScreen.classList.add("show");

    playSound("freeze");

    var seconds = 3;

    freezeCount.innerHTML =
        seconds + " GIÂY PHÉP THUẬT BĂNG GIÁ";

    var freezeTimer = setInterval(function () {
        seconds = seconds - 1;

        if (seconds > 0) {
            freezeCount.innerHTML =
                seconds + " GIÂY PHÉP THUẬT BĂNG GIÁ";
        } else {
            clearInterval(freezeTimer);

            gameFrozen = false;

            document.body.classList.remove("time-frozen");
            freezeScreen.classList.remove("show");

            showMessage(
                "Thời gian đã chạy lại! Mau bắt lấy những món quà nào! ⏰"
            );
        }
    }, 1000);
}


function spawnTargetBat() {
    if (gameFrozen || gameOver) return;

    var bat = document.createElement("button");

    bat.type = "button";
    bat.className = "target-bat";
    bat.innerHTML = "🦇";

    bat.style.setProperty(
        "--bat-top",
        (27 + Math.random() * 42) + "vh"
    );

    bat.setAttribute(
        "aria-label",
        "Chạm vào dơi đang bay để nhận 5 điểm"
    );

    bat.addEventListener("click", function () {
        if (gameFrozen || gameOver || this.dataset.hit == "yes") {
            return;
        }

        this.dataset.hit = "yes";

        changeScore(5);
        addStreak();
        playSound("bat");

        lightningFlash.classList.remove("show");

        void lightningFlash.offsetWidth;

        lightningFlash.classList.add("show");

        showMessage(
            "Đánh trúng rồi! Con dơi làm rơi 5 điểm! ⚡ +5"
        );

        this.remove();
    });

    bat.addEventListener("animationend", function () {
        this.remove();
    });

    document.body.appendChild(bat);
}


function taoLaRoi() {
    var la = ["🍂", "🍁", "🍃"];

    for (var i = 0; i < 14; i++) {
        var leaf = document.createElement("span");

        leaf.className = "falling-leaf";
        leaf.innerHTML = la[i % la.length];

        leaf.style.left = (Math.random() * 100) + "vw";

        leaf.style.setProperty(
            "--leaf-size",
            (12 + Math.random() * 13) + "px"
        );

        leaf.style.setProperty(
            "--leaf-speed",
            (9 + Math.random() * 11) + "s"
        );

        leaf.style.setProperty(
            "--leaf-delay",
            (-Math.random() * 18) + "s"
        );

        leaf.style.setProperty(
            "--leaf-drift",
            (Math.random() * 170 - 85) + "px"
        );

        document.body.appendChild(leaf);
    }
}

function endGame() {
    if (gameOver) return;

    gameOver = true;

    document.body.classList.remove("last-ten");

    var quizTickets = Math.floor(score / DIEM_MOI_PHIEU);

    if (quizTickets > SO_PHIEU_TOI_DA) {
        quizTickets = SO_PHIEU_TOI_DA;
    }

    if (window.parent !== window) {
        window.parent.postMessage({
            type: "HALLOWEEN_QUIZ_TICKETS",
            points: score,
            tickets: quizTickets
        }, window.location.origin);
    }

    luckySpinsEarned = LUCKY_DRAW_SPINS_PER_GAME;
    luckySpinsRemaining = LUCKY_DRAW_SPINS_PER_GAME;

    luckySpinBusy = false;
    wheelRotation = 0;

    prizeWheel.style.transform = "rotate(0deg)";
    wheelLights.classList.remove("active");

    luckyIntro.innerHTML =
        "Bạn đã thu thập được <b>" + score + " điểm</b>." +
        "<br>Bạn nhận được <b>" + quizTickets + " phiếu câu hỏi</b>." +
        "<br>Cứ 20 điểm nhận 1 phiếu, tối đa 3 phiếu mỗi ván." +
        "<br>Bạn có <b>1 lượt quay may mắn riêng</b>!";

    luckyResult.innerHTML =
        '<p class="result-label">Phần quà Halloween dành cho bạn</p>' +
        '<h3 id="luckyDrawStatus">May mắn đang chờ bạn! 🎃</h3>' +
        '<p>Chạm vào quả bí ngô ở giữa vòng quay để nhận phần thưởng.</p>';

    luckyDrawStatus = document.getElementById("luckyDrawStatus");

    updateLuckySpins();

    gameOverScreen.classList.add("show");

    showMessage(
        "Đã hết giờ! Phiếu câu hỏi và lượt quay đã sẵn sàng."
    );
window.parent.postMessage({
    type: "HALLOWEEN_QUIZ_TICKETS",
    points: score,
    tickets: Math.min(Math.floor(score / 20), 3)
}, "*");
}


function spinLuckyDraw() {
    if (!gameOver || luckySpinBusy || luckySpinsRemaining <= 0) {
        return;
    }

    luckySpinBusy = true;

    luckySpinsRemaining = luckySpinsRemaining - 1;

    updateLuckySpins();

    luckySpinButton.innerHTML =
        "<span>🌀</span><small>ĐANG QUAY</small>";

    luckyResult.innerHTML =
        '<p class="result-label">Vòng quay đang chọn phần thưởng...</p>' +
        '<h3 id="luckyDrawStatus">Quay đều, quay đều! ✨</h3>' +
        '<p>Hãy lắng nghe tiếng kim chỉ khi vòng quay chậm dần nhé.</p>';

    luckyDrawStatus = document.getElementById("luckyDrawStatus");

    wheelLights.classList.add("active");

    playSound("tick");

    var selectedIndex =
        Math.floor(Math.random() * LUCKY_DRAW_PRIZES.length);

    var selectedPrize = LUCKY_DRAW_PRIZES[selectedIndex];

    var currentMod =
        ((wheelRotation % 360) + 360) % 360;

    var wantedMod =
        (360 - selectedIndex * 45) % 360;

    var alignDegrees =
        (wantedMod - currentMod + 360) % 360;

    var fullTurns =
        5 + Math.floor(Math.random() * 2);

    var totalDegrees =
        fullTurns * 360 + alignDegrees;

    var startRotation = wheelRotation;

    var startedAt = null;
    var previousTick = 0;

    function animateWheel(timestamp) {
        if (startedAt == null) {
            startedAt = timestamp;
        }

        var progress = Math.min(
            (timestamp - startedAt) / LUCKY_DRAW_SPIN_DURATION,
            1
        );

        var eased = 1 - Math.pow(1 - progress, 5);

        var travelled = totalDegrees * eased;

        wheelRotation = startRotation + travelled;

        prizeWheel.style.transform =
            "rotate(" + wheelRotation + "deg)";

        var tickNumber = Math.floor(travelled / 45);

        while (tickNumber > previousTick) {
            tickWheelPointer();
            previousTick = previousTick + 1;
        }

        if (progress < 1) {
            requestAnimationFrame(animateWheel);
        } else {
            wheelRotation = startRotation + totalDegrees;

            prizeWheel.style.transform =
                "rotate(" + wheelRotation + "deg)";

            wheelLights.classList.remove("active");

            luckySpinBusy = false;

            luckySpinButton.innerHTML =
                "<span>🎃</span><small>QUAY</small>";

            showLuckyPrize(selectedPrize);

            updateLuckySpins();
        }
    }

    requestAnimationFrame(animateWheel);
}


function showLuckyPrize(prize) {
    if (prize.type == "boo") {
        luckyResult.innerHTML =
            '<p class="result-label">Một bất ngờ ma quái</p>' +
            '<h3>👻 Ú òa!</h3>' +
            '<p>Các hồn ma lấy mất phần quà này rồi. Chúng giữ kẹo cho riêng mình mất rồi!</p>';

        playSound("boo");
    } else {
        luckyResult.innerHTML =
            '<p class="result-label">Bạn đã trúng quà Halloween!</p>' +
            '<h3>🎉 ' + prize.name + '</h3>' +
            '<p>Mã phiếu giảm giá của bạn:</p>' +
            '<div class="coupon-code">' + prize.code + '</div>' +
            '<p class="screenshot-note">Hãy chụp ảnh màn hình này để đổi quà.</p>';

        showerLuckyConfetti();

        playSound("win");
    }

    if (luckySpinsRemaining > 0) {
        var nextNote = document.createElement("p");

        nextNote.innerHTML =
            "Bạn còn " + luckySpinsRemaining +
            " lượt quay. Chạm vào bí ngô để quay lượt tiếp theo nhé!";

        luckyResult.appendChild(nextNote);
    } else {
        var doneNote = document.createElement("p");

        doneNote.innerHTML =
            "Đó là lượt quay cuối cùng của bạn. Vòng quay Halloween đã kết thúc!";

        luckyResult.appendChild(doneNote);
    }
}


function resetGame() {
    score = 0;
    timeLeft = 60;
    booPower = 0;
    streak = 0;
    lastActionTime = 0;

    gameFrozen = false;
    gameOver = false;

    luckySpinsEarned = 0;
    luckySpinsRemaining = 0;
    luckySpinBusy = false;
    wheelRotation = 0;

    prizeWheel.style.transform = "rotate(0deg)";

    luckySpinButton.innerHTML =
        "<span>🎃</span><small>QUAY</small>";

    luckyResult.innerHTML =
        '<p class="result-label">Phần quà Halloween dành cho bạn</p>' +
        '<h3 id="luckyDrawStatus">Chơi xong để nhận lượt quay nhé!</h3>' +
        '<p>Hoàn thành ván chơi để mở vòng quay may mắn.</p>';

    luckyDrawStatus = document.getElementById("luckyDrawStatus");

    luckySpinButton.disabled = true;
    luckyDoneButton.hidden = true;

    luckySpinsCount.innerHTML = "0";

    wheelLights.classList.remove("active");

    updateScore();
    updateBoo();

    timerValue.innerHTML = timeLeft;
    streakValue.innerHTML = "0×";

    document.body.classList.remove(
        "last-ten",
        "time-frozen"
    );

    freezeScreen.classList.remove("show");
    gameOverScreen.classList.remove("show");

    var items = document.querySelectorAll(
        ".spider-drop,.corn-drift,.witch-flight,.target-bat,.lucky-confetti"
    );

    for (var i = 0; i < items.length; i++) {
        items[i].remove();
    }

    showMessage("Ván Halloween mới bắt đầu! Chúc bạn may mắn! 🎃");
}

document.getElementById("resetButton").addEventListener(
    "click",
    resetGame
);

luckySpinButton.addEventListener(
    "click",
    spinLuckyDraw
);

luckyDoneButton.addEventListener(
    "click",
    resetGame
);

document.getElementById("soundButton").addEventListener(
    "click",
    function () {
        soundOn = !soundOn;

        this.innerHTML = soundOn
            ? "🔊 BẬT ÂM THANH"
            : "🔇 ĐÃ TẮT ÂM THANH";

        if (soundOn) {
            playSound("candy");
        }
    }
);

treatButton.addEventListener("click", function () {
    if (gameOver) return;

    changeScore(3);
    addStreak();
    playSound("candy");

    showMessage(
        "Bạn đã mở bữa tiệc kẹo bí mật! +3 điểm 🍬"
    );

    treatButton.innerHTML = "Thêm kẹo nữa nào! ↗";
});



buildLuckyWheel();
taoGhosts();
taoLaRoi();

updateScore();
updateBoo();

setInterval(function () {
    if (gameOver || gameFrozen) return;

    timeLeft = timeLeft - 1;

    timerValue.innerHTML = timeLeft;

    if (timeLeft <= 10 && timeLeft > 0) {
        document.body.classList.add("last-ten");
    }

    if (timeLeft <= 0) {
        endGame();
    }
}, 1000);

setInterval(spawnSpider, 4200);
setInterval(spawnCorn, 2400);
setInterval(launchWitch, 15000);
setInterval(spawnTargetBat, 11500);

setTimeout(spawnSpider, 1500);
setTimeout(spawnCorn, 900);
setTimeout(spawnTargetBat, 6500);



function kiemTraManHinh() {
    if (
        window.matchMedia("(pointer: coarse)").matches ||
        window.matchMedia("(hover: none)").matches
    ) {
        candyCursor.classList.remove("visible");

        document.body.style.cursor = "auto";
    } else {
        document.body.style.cursor = "none";
    }
}

kiemTraManHinh();

window.addEventListener("resize", kiemTraManHinh);
var soPhieuQuiz =
        Number(localStorage.getItem("soPhieuQuiz")) || 0;

    function capNhatPhieuQuiz() {
        var hienThi = document.getElementById("soPhieu");

        if (hienThi != null) {
            hienThi.innerHTML = soPhieuQuiz;
        }

        localStorage.setItem("soPhieuQuiz", soPhieuQuiz);
    }
var soPhieuQuiz =
    Number(localStorage.getItem("soPhieuQuiz")) || 0;

function capNhatPhieuQuiz() {
    document.getElementById("soPhieuQuiz").innerHTML =
        soPhieuQuiz;

    document.getElementById("soPhieuHienCo").innerHTML =
        soPhieuQuiz;

    localStorage.setItem("soPhieuQuiz", soPhieuQuiz);

    if (soPhieuQuiz > 0) {
        document.getElementById("thongBaoPhieu").innerHTML =
            "Bạn có " + soPhieuQuiz + " phiếu. Có thể mở câu hỏi!";
    } else {
        document.getElementById("thongBaoPhieu").innerHTML =
            "Bạn đã hết phiếu. Hãy chơi Halloween để kiếm thêm nhé!";
    }

    document.getElementById("nutMoCauHoi").disabled =
        soPhieuQuiz <= 0;
}

// Nhận phiếu từ game Halloween
window.addEventListener("message", function(event) {
    if (event.origin !== window.location.origin) return;

    if (
        event.data &&
        event.data.type == "HALLOWEEN_QUIZ_TICKETS"
    ) {
        var phieuNhan = Number(event.data.tickets) || 0;

        if (phieuNhan > 0) {
            soPhieuQuiz += phieuNhan;

            capNhatPhieuQuiz();

            document.getElementById("thongBaoGame").innerHTML =
                "🎉 Bạn vừa nhận được " + phieuNhan +
                " phiếu câu hỏi!";
        } else {
            document.getElementById("thongBaoGame").innerHTML =
                "Bạn chưa đủ 20 điểm để nhận phiếu. Hãy thử lại nhé!";
        }
    }
});

capNhatPhieuQuiz();

function moCauHoi() {
    if (soPhieuQuiz <= 0) {
        alert("Bạn đã hết phiếu câu hỏi!");
        return;
    }

    soPhieuQuiz--;

    capNhatPhieuQuiz();

    document.getElementById("quizGate").style.display = "none";
    document.getElementById("quizContent").style.display = "block";

    hienThiCauHoi();
}
