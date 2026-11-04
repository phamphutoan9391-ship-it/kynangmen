var danhSachCauHoi = [
    {
        cauHoi: "Theo nguồn giới thiệu, tác phẩm Sửa đổi lối làm việc hướng đến mục đích chính nào?",
        dapAn: [
            "Dạy cách thiết kế website hiện đại.",
            "Nhìn nhận khuyết điểm và cải thiện tư tưởng, đạo đức, lề lối công tác.",
            "Hướng dẫn quản lý thời gian theo ma trận bốn ô.",
            "Thay thế mọi hình thức làm việc nhóm."
        ],
        dapAnDung: 1,
        giaiThich: "Nguồn tư liệu mô tả mục tiêu là nâng cao lý luận, tư tưởng, đạo đức, tác phong công tác và năng lực lãnh đạo trong bối cảnh của tác phẩm."
    },
    {
        cauHoi: "Trong nhóm lập trình, một chức năng không chạy đúng yêu cầu. Cách phản hồi phù hợp nhất là gì?",
        dapAn: [
            "Chê người viết code trước cả nhóm.",
            "Mô tả lỗi cụ thể, kiểm tra yêu cầu và cùng thống nhất cách sửa.",
            "Bỏ qua vì có thể người khác sẽ sửa.",
            "Nói rằng mọi thứ đã xong dù chưa kiểm thử."
        ],
        dapAnDung: 1,
        giaiThich: "Đây là cách vận dụng tinh thần phê bình gắn với sửa chữa: nêu vấn đề có căn cứ và hướng tới hành động cải thiện."
    },
    {
        cauHoi: "Nhóm đã sửa một lỗi nhiều lần nhưng lỗi vẫn quay lại. Nên làm gì tiếp?",
        dapAn: [
            "Thay đổi ngẫu nhiên thêm vài dòng code.",
            "Trách thành viên phụ trách mà không xem dữ liệu.",
            "Tái hiện lỗi, xem lại yêu cầu và tìm nguyên nhân trước khi sửa tiếp.",
            "Xóa phần chức năng đó mà không trao đổi."
        ],
        dapAnDung: 2,
        giaiThich: "Học từ kinh nghiệm cần xem lại quá trình và nguyên nhân, không chỉ phản ứng với kết quả trước mắt."
    },
    {
        cauHoi: "Điều nào phù hợp với tinh thần chống thói ba hoa khi báo cáo tiến độ đồ án?",
        dapAn: [
            "Nói rõ và trung thực việc nào đã xong, việc nào còn lỗi.",
            "Dùng nhiều từ chuyên môn để tạo cảm giác đã làm được nhiều.",
            "Báo hoàn thành dù chưa chạy thử.",
            "Tránh nhắc đến khó khăn để khỏi bị hỏi."
        ],
        dapAnDung: 0,
        giaiThich: "Báo cáo nên rõ ràng, trung thực với kết quả thực tế; đây là ví dụ liên hệ của nhóm."
    },
    {
        cauHoi: "Khi tổ chức họp nhóm, hành động nào làm cuộc họp hữu ích hơn?",
        dapAn: [
            "Họp càng lâu càng chứng tỏ chăm chỉ.",
            "Không cần chuẩn bị nội dung.",
            "Thảo luận nhiều nhưng không ghi việc phải làm.",
            "Có mục tiêu, nội dung chính, người phụ trách và kết luận rõ ràng."
        ],
        dapAnDung: 3,
        giaiThich: "Một cách làm có tổ chức giúp tránh họp không thiết thực và biến trao đổi thành việc làm cụ thể."
    },
    {
        cauHoi: "Sau khi một bài tập thành công hoặc thất bại, nhóm nên làm gì?",
        dapAn: [
            "Không cần xem lại vì đã kết thúc.",
            "Xem lại nguyên nhân, ghi điều học được và điều chỉnh cách làm.",
            "Chỉ tìm một người để chịu trách nhiệm.",
            "Lặp lại y hệt cách làm cũ trong mọi trường hợp."
        ],
        dapAnDung: 1,
        giaiThich: "Rút kinh nghiệm từ cả thành công và thất bại giúp nhóm hiểu nguyên nhân và cải thiện công việc."
    },
    {
        cauHoi: "Phê bình mang tính xây dựng khác công kích cá nhân ở điểm nào?",
        dapAn: [
            "Phê bình xây dựng luôn khen tất cả mọi người.",
            "Phê bình xây dựng không cần bằng chứng.",
            "Tập trung vào vấn đề cụ thể, tôn trọng người nghe và thống nhất cách sửa.",
            "Phải nói trước đông người để tạo áp lực."
        ],
        dapAnDung: 2,
        giaiThich: "Mục tiêu của phản hồi trong ví dụ vận dụng là giúp công việc tiến bộ, không làm nhục hay gán nhãn người khác."
    },
    {
        cauHoi: "Điều nào là cách vận dụng có thể kiểm chứng trong đồ án CNTT?",
        dapAn: [
            "Nói đã kiểm thử nhưng không lưu kết quả.",
            "Chỉ làm phần dễ và không báo tiến độ.",
            "Chép lời giải của nhóm khác mà không hiểu.",
            "Ghi việc cần sửa, phân công thời hạn, chạy thử và lưu kết quả kiểm tra."
        ],
        dapAnDung: 3,
        giaiThich: "Cách làm này gắn lời nói với hành động và có minh chứng để biết việc sửa đã hiệu quả hay chưa."
    }
];

var viTriCauHoi = 0;
var soCauDung = 0;
var daTraLoi = false;


function hienThiCauHoi() {
    var cau = danhSachCauHoi[viTriCauHoi];
    var noiDung = "";
    var i;

    daTraLoi = false;

    document.getElementById("demCau").innerHTML =
        "Câu " + (viTriCauHoi + 1) + " / " + danhSachCauHoi.length;

    document.getElementById("cauHoi").innerHTML = cau.cauHoi;

    document.getElementById("phanHoiQuiz").style.display = "none";

    document.getElementById("nutTiep").style.display = "inline-block";
    document.getElementById("nutTiep").disabled = true;
    document.getElementById("nutTiep").innerHTML = "Câu tiếp theo";

    document.getElementById("nutLamLai").style.display = "none";

    for (i = 0; i < cau.dapAn.length; i++) {
        noiDung = noiDung +
            '<button class="option" id="dapAn' + i +
            '" onclick="chonDapAn(' + i + ')">';

        noiDung = noiDung +
            String.fromCharCode(65 + i) + ". " + cau.dapAn[i];

        noiDung = noiDung + "</button>";
    }

    document.getElementById("cacDapAn").innerHTML = noiDung;
}


function chonDapAn(viTriDapAn) {
    var cau = danhSachCauHoi[viTriCauHoi];
    var i;
    var nut;

    if (daTraLoi === true) {
        return;
    }

    daTraLoi = true;

    if (viTriDapAn === cau.dapAnDung) {
        soCauDung = soCauDung + 1;
    }

    for (i = 0; i < cau.dapAn.length; i++) {
        nut = document.getElementById("dapAn" + i);

        nut.disabled = true;

        if (i === cau.dapAnDung) {
            nut.className = "option dung";
        } else if (i === viTriDapAn) {
            nut.className = "option sai";
        }
    }

    if (viTriDapAn === cau.dapAnDung) {
        document.getElementById("phanHoiQuiz").innerHTML =
            "Chính xác! " + cau.giaiThich;
    } else {
        document.getElementById("phanHoiQuiz").innerHTML =
            "Chưa đúng. " + cau.giaiThich;
    }

    document.getElementById("phanHoiQuiz").style.display = "block";
    document.getElementById("nutTiep").disabled = false;

    if (viTriCauHoi === danhSachCauHoi.length - 1) {
        document.getElementById("nutTiep").innerHTML = "Xem kết quả";
    }
}


function cauTiepTheo() {
    if (daTraLoi === false) {
        return;
    }

    if (viTriCauHoi < danhSachCauHoi.length - 1) {
        viTriCauHoi = viTriCauHoi + 1;
        hienThiCauHoi();
    } else {
        // Hien thi ket qua cuoi cung
        document.getElementById("demCau").innerHTML = "Hoàn thành";

        document.getElementById("cauHoi").innerHTML =
            "Kết quả của bạn: " + soCauDung +
            " / " + danhSachCauHoi.length;

        document.getElementById("cacDapAn").innerHTML = "";

        document.getElementById("phanHoiQuiz").style.display = "block";

        document.getElementById("nutTiep").style.display = "none";
        document.getElementById("nutLamLai").style.display = "inline-block";

        if (soCauDung >= 7) {
            document.getElementById("phanHoiQuiz").innerHTML =
                "Rất tốt! Bạn trả lời đúng " + soCauDung +
                " / " + danhSachCauHoi.length +
                " câu. Hãy tiếp tục vận dụng vào công việc nhóm.";
        } else if (soCauDung >= 5) {
            document.getElementById("phanHoiQuiz").innerHTML =
                "Khá tốt! Bạn trả lời đúng " + soCauDung +
                " / " + danhSachCauHoi.length +
                " câu. Hãy đọc lại các phần còn phân vân.";
        } else {
            document.getElementById("phanHoiQuiz").innerHTML =
                "Bạn trả lời đúng " + soCauDung +
                " / " + danhSachCauHoi.length +
                " câu. Hãy đọc lại kiến thức rồi thử lần nữa.";
        }
    }
}

function lamLaiQuiz() {
    viTriCauHoi = 0;
    soCauDung = 0;
    hienThiCauHoi();
}

function traLoiTinhHuong1(dapAn) {
    var phanHoi = "";

    if (dapAn === 1) {
        phanHoi =
            "Chính xác! Phù hợp nhất: mô tả lỗi, kiểm tra dữ kiện và cùng chốt cách sửa là góp ý hướng vào công việc.";
    } else if (dapAn === 0) {
        phanHoi =
            "Chưa đúng. Nhận xét chung chung làm người nghe khó biết cần sửa gì. Hãy nêu lỗi quan sát được.";
    } else {
        phanHoi =
            "Chưa đúng. Im lặng sửa thay có thể che mất nguyên nhân và không giúp nhóm tránh lỗi lần sau.";
    }

    document.getElementById("phanHoi1").innerHTML = phanHoi;

    document.getElementById("tinhHuong1A").disabled = true;
    document.getElementById("tinhHuong1B").disabled = true;
    document.getElementById("tinhHuong1C").disabled = true;
}

function traLoiTinhHuong2(dapAn) {
    var phanHoi = "";

    if (dapAn === 1) {
        phanHoi =
            "Chính xác! Tái hiện lỗi, thu thập dữ kiện, tìm nguyên nhân rồi kiểm thử lại.";
    } else if (dapAn === 0) {
        phanHoi =
            "Chưa đúng. Sửa ngẫu nhiên dễ làm phát sinh lỗi mới mà không hiểu nguyên nhân.";
    } else {
        phanHoi =
            "Chưa đúng. Bỏ qua lỗi lặp lại có thể khiến sản phẩm không ổn định; cần kiểm tra cách khắc phục.";
    }

    document.getElementById("phanHoi2").innerHTML = phanHoi;

    document.getElementById("tinhHuong2A").disabled = true;
    document.getElementById("tinhHuong2B").disabled = true;
    document.getElementById("tinhHuong2C").disabled = true;
}
function traLoiTinhHuong3(dapAn) {
    var phanHoi = "";

    if (dapAn === 2) {
        phanHoi = "Chính xác! Biết lắng nghe góp ý, nhìn lại cách làm và cải thiện code sẽ giúp công việc tốt hơn.";
    } else if (dapAn === 0) {
        phanHoi = "Chưa đúng. Bỏ ngoài tai ý kiến góp ý sẽ khiến bản thân khó tiến bộ.";
    } else {
        phanHoi = "Chưa đúng. Lắng nghe qua loa chưa đủ, cần xem xét nghiêm túc và áp dụng góp ý phù hợp.";
    }

    document.getElementById("phanHoi3").innerHTML = phanHoi;

    document.getElementById("tinhHuong3A").disabled = true;
    document.getElementById("tinhHuong3B").disabled = true;
    document.getElementById("tinhHuong3C").disabled = true;
}


function traLoiTinhHuong4(dapAn) {
    var phanHoi = "";

    if (dapAn === 1) {
        phanHoi = "Chính xác! Trưởng nhóm nên trao đổi nghiêm túc, xác định khó khăn, phân công lại công việc và thống nhất thời hạn hoàn thành.";
    } else if (dapAn === 0) {
        phanHoi = "Chưa đúng. Nếu luôn ôm hết công việc, trưởng nhóm dễ quá tải và các thành viên không cải thiện trách nhiệm.";
    } else {
        phanHoi = "Chưa đúng. Chỉ nhắc nhở qua loa chưa giải quyết nguyên nhân khiến công việc bị chậm.";
    }

    document.getElementById("phanHoi4").innerHTML = phanHoi;

    document.getElementById("tinhHuong4A").disabled = true;
    document.getElementById("tinhHuong4B").disabled = true;
    document.getElementById("tinhHuong4C").disabled = true;
}

function lamLaiTinhHuong() {
    document.getElementById("tinhHuong1A").disabled = false;
    document.getElementById("tinhHuong1B").disabled = false;
    document.getElementById("tinhHuong1C").disabled = false;

    document.getElementById("tinhHuong2A").disabled = false;
    document.getElementById("tinhHuong2B").disabled = false;
    document.getElementById("tinhHuong2C").disabled = false;

    document.getElementById("tinhHuong3A").disabled = false;
    document.getElementById("tinhHuong3B").disabled = false;
    document.getElementById("tinhHuong3C").disabled = false;

    document.getElementById("tinhHuong4A").disabled = false;
    document.getElementById("tinhHuong4B").disabled = false;
    document.getElementById("tinhHuong4C").disabled = false;

    document.getElementById("phanHoi1").innerHTML = "";
    document.getElementById("phanHoi2").innerHTML = "";
    document.getElementById("phanHoi3").innerHTML = "";
    document.getElementById("phanHoi4").innerHTML = "";
}
hienThiCauHoi();

function createSpookyFall() {
    const icons = ['🎃', '🦇', '👻', '🕷️'];
    const container = document.body;
    
    setInterval(() => {
        const element = document.createElement('div');
        element.className = 'spooky-item';
        element.innerText = icons[Math.floor(Math.random() * icons.length)];
        
        
        element.style.left = Math.random() * 100 + 'vw';
        element.style.fontSize = Math.random() * 20 + 20 + 'px';
        element.style.animationDuration = Math.random() * 3 + 2 + 's'; 
        element.style.opacity = Math.random();
        
        container.appendChild(element);
        
        
        setTimeout(() => {
            element.remove();
        }, 5000);
    }, 300); 
}
window.addEventListener('DOMContentLoaded', createSpookyFall);

window.addEventListener('DOMContentLoaded', () => {
            const loader = document.getElementById('halloween-loader');
            
            setTimeout(() => {
                loader.classList.add('hidden');
                document.body.style.overflow = 'auto';
            }, 2500); 
        });
   

