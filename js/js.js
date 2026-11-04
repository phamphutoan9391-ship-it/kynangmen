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

    var demCau = document.getElementById("demCau");
    var cauHoi = document.getElementById("cauHoi");
    var phanHoiQuiz = document.getElementById("phanHoiQuiz");
    var nutTiep = document.getElementById("nutTiep");
    var nutLamLai = document.getElementById("nutLamLai");
    var cacDapAn = document.getElementById("cacDapAn");

    if(demCau) demCau.innerHTML = "Câu " + (viTriCauHoi + 1) + " / " + danhSachCauHoi.length;
    if(cauHoi) cauHoi.innerHTML = cau.cauHoi;
    if(phanHoiQuiz) phanHoiQuiz.style.display = "none";
    if(nutLamLai) nutLamLai.style.display = "none";

    if(nutTiep) {
        nutTiep.style.display = "inline-block";
        nutTiep.disabled = true;
        nutTiep.innerHTML = "Câu tiếp theo";
    }

    for (i = 0; i < cau.dapAn.length; i++) {
        noiDung += '<button class="option" id="dapAn' + i + '" onclick="chonDapAn(' + i + ')">' +
                   String.fromCharCode(65 + i) + ". " + cau.dapAn[i] + '</button>';
    }
    if(cacDapAn) cacDapAn.innerHTML = noiDung;
}

function chonDapAn(viTriDapAn) {
    var cau = danhSachCauHoi[viTriCauHoi];
    var i, nut;

    if (daTraLoi === true) return;
    daTraLoi = true;

    if (viTriDapAn === cau.dapAnDung) {
        soCauDung++;
    }

    for (i = 0; i < cau.dapAn.length; i++) {
        nut = document.getElementById("dapAn" + i);
        if (nut) {
            nut.disabled = true;
            if (i === cau.dapAnDung) {
                nut.className = "option dung";
            } else if (i === viTriDapAn) {
                nut.className = "option sai";
            }
        }
    }

    var phanHoiQuiz = document.getElementById("phanHoiQuiz");
    if (phanHoiQuiz) {
        if (viTriDapAn === cau.dapAnDung) {
            phanHoiQuiz.innerHTML = "Chính xác! " + cau.giaiThich;
        } else {
            phanHoiQuiz.innerHTML = "Chưa đúng. " + cau.giaiThich;
        }
        phanHoiQuiz.style.display = "block";
    }

    var nutTiep = document.getElementById("nutTiep");
    if (nutTiep) {
        nutTiep.disabled = false;
        if (viTriCauHoi === danhSachCauHoi.length - 1) {
            nutTiep.innerHTML = "Xem kết quả";
        }
    }
}

function cauTiepTheo() {
    if (daTraLoi === false) return;

    if (viTriCauHoi < danhSachCauHoi.length - 1) {
        viTriCauHoi++;
        hienThiCauHoi();
    } else {
        var demCau = document.getElementById("demCau");
        var cauHoi = document.getElementById("cauHoi");
        var cacDapAn = document.getElementById("cacDapAn");
        var phanHoiQuiz = document.getElementById("phanHoiQuiz");
        var nutTiep = document.getElementById("nutTiep");
        var nutLamLai = document.getElementById("nutLamLai");

        if(demCau) demCau.innerHTML = "Hoàn thành";
        if(cauHoi) cauHoi.innerHTML = "Kết quả của bạn: " + soCauDung + " / " + danhSachCauHoi.length;
        if(cacDapAn) cacDapAn.innerHTML = "";
        if(nutTiep) nutTiep.style.display = "none";
        if(nutLamLai) nutLamLai.style.display = "inline-block";

        if(phanHoiQuiz) {
            phanHoiQuiz.style.display = "block";
            if (soCauDung >= 7) {
                phanHoiQuiz.innerHTML = "Rất tốt! Bạn trả lời đúng " + soCauDung + " / " + danhSachCauHoi.length + " câu. Hãy tiếp tục vận dụng vào công việc nhóm.";
            } else if (soCauDung >= 5) {
                phanHoiQuiz.innerHTML = "Khá tốt! Bạn trả lời đúng " + soCauDung + " / " + danhSachCauHoi.length + " câu. Hãy đọc lại các phần còn phân vân.";
            } else {
                phanHoiQuiz.innerHTML = "Bạn trả lời đúng " + soCauDung + " / " + danhSachCauHoi.length + " câu. Hãy đọc lại kiến thức rồi thử lần nữa.";
            }
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
    var oPhanHoi = document.getElementById("phanHoiTinhHuong1");
    if (dapAn === 1) {
        phanHoi = "Chính xác! Phù hợp nhất: mô tả lỗi, kiểm tra dữ liệu và cùng thống nhất cách sửa.";
    } else {
        phanHoi = "Lựa chọn này chưa tối ưu. Hãy thử cách tiếp cận mang tính xây dựng hơn.";
    }
    if(oPhanHoi) {
        oPhanHoi.innerHTML = phanHoi;
        oPhanHoi.style.display = "block";
    }
}
// ================= KHU VỰC ĐẶC TRỊ LỖI MÀN HÌNH CHỜ (HALLOWEEN LOADER) =================
function removeHalloweenLoader() {
    var loader = document.getElementById('halloween-loader');
    if (loader) {
        loader.style.transition = "opacity 0.4s ease, visibility 0.4s ease";
        loader.style.opacity = "0";
        loader.style.visibility = "hidden";
        document.body.style.setProperty("overflow", "auto", "important");
        document.body.style.setProperty("overflow-y", "auto", "important");
        document.documentElement.style.setProperty("overflow", "auto", "important");
        setTimeout(function() {
            loader.remove();
        }, 400);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    if (typeof hienThiCauHoi === "function") {
        hienThiCauHoi(); 
    }
    setTimeout(removeHalloweenLoader, 1000); 
});
setTimeout(removeHalloweenLoader, 2500);


