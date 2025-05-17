let allData = [];
let currentPage = 1;
const rowsPerPage = 20;
let allDataQuery = [];
let currentPageQuery = 1;
const rowsPerPageQuery = 20;
let pieChart;

const tableHeadRow = document.getElementById('tableHeadRow');
const tableBody = document.getElementById('khachHangTable').getElementsByTagName('tbody')[0];
const pagination = document.getElementById('pagination');
const tableHeadRowResult = document.getElementById('tableHeadRowResult');
const tableBodyResult = document.querySelector('#resultTable tbody');

// Vẽ biểu đồ tròn cho dữ liệu đã tổng hợp (cột doanh thu là TongDoanhThu)
function drawPieChart(data, labelField) {
  const labels = data.map(item => item[labelField]);
  const values = data.map(item => item.TongDoanhThu);

  const ctx = document.getElementById('pieChart').getContext('2d');
  if (pieChart) pieChart.destroy();

  pieChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [{
        data: values,
        backgroundColor: labels.map(() => `hsl(${Math.random() * 360}, 70%, 70%)`),
        borderWidth: 1,
      }]
    },
    options: {
      plugins: {
        legend: { position: 'bottom' },
        title: {
          display: true,
          text: `Phân Bổ Doanh Thu Theo ${labelField === 'TenThanhPho' ? 'Thành Phố' : 'Bang'}`
        }
      }
    }
  });
}


const maxPageButtons = 7;

function createPaginationControls(totalItems) {
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  pagination.innerHTML = '';

  const prevBtn = document.createElement('button');
  prevBtn.textContent = 'Trang trước';
  prevBtn.disabled = currentPage === 1;
  prevBtn.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      updateTableAndPagination();
    }
  });
  pagination.appendChild(prevBtn);

  function createPageButton(i) {
    const btn = document.createElement('button');
    btn.textContent = i;
    if (i === currentPage) btn.classList.add('active');
    btn.addEventListener('click', () => {
      currentPage = i;
      updateTableAndPagination();
    });
    return btn;
  }

  let startPage = Math.max(1, currentPage - Math.floor(maxPageButtons / 2));
  let endPage = startPage + maxPageButtons - 1;
  if (endPage > totalPages) {
    endPage = totalPages;
    startPage = Math.max(1, endPage - maxPageButtons + 1);
  }

  if (startPage > 1) {
    pagination.appendChild(createPageButton(1));
    if (startPage > 2) {
      const dots = document.createElement('span');
      dots.textContent = '...';
      pagination.appendChild(dots);
    }
  }

  for (let i = startPage; i <= endPage; i++) {
    pagination.appendChild(createPageButton(i));
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      const dots = document.createElement('span');
      dots.textContent = '...';
      pagination.appendChild(dots);
    }
    pagination.appendChild(createPageButton(totalPages));
  }

  const nextBtn = document.createElement('button');
  nextBtn.textContent = 'Trang sau';
  nextBtn.disabled = currentPage === totalPages;
  nextBtn.addEventListener('click', () => {
    if (currentPage < totalPages) {
      currentPage++;
      updateTableAndPagination();
    }
  });
  pagination.appendChild(nextBtn);
}

function paginateData(data, page) {
  const start = (page - 1) * rowsPerPage;
  return data.slice(start, start + rowsPerPage);
}

function fillTable(data) {
  tableHeadRow.innerHTML = '';
  tableBody.innerHTML = '';
  if (data.length === 0) return;

  const columns = Object.keys(data[0]);
  columns.forEach(col => {
    const th = document.createElement('th');
    th.textContent = col;
    tableHeadRow.appendChild(th);
  });

  data.forEach(row => {
    const tr = document.createElement('tr');
    columns.forEach(col => {
      const td = document.createElement('td');
      td.textContent = row[col];
      tr.appendChild(td);
    });
    tableBody.appendChild(tr);
  });
}

function updateTableAndPagination() {
  fillTable(paginateData(allData, currentPage));
  createPaginationControls(allData.length);
}

// Không gọi lúc chưa có data
// updateTableAndPagination();
function loadDoanhThuTheoThanhPho() {
  fetch('/doanhthu/theo-thanhpho')
    .then(res => res.json())
    .then(data => {
      allData = data;
      currentPage = 1;
      updateTableAndPagination(); // Hiển thị bảng theo dữ liệu trả về
      drawPieChart(allData, 'TenThanhPho'); // Vẽ biểu đồ theo thành phố
    })
    .catch(err => console.error('Lỗi khi tải dữ liệu doanh thu:', err));
}

// Tải dữ liệu và khởi tạo bảng + biểu đồ
fetch('/khach-hang')
  .then(res => res.json())
  .then(data => {
    allData = data;
    currentPage = 1;
    updateTableAndPagination();
    drawPieChart(allData, 'TenThanhPho');
  })
  .catch(err => console.error('Lỗi khi tải dữ liệu:', err));

// Cập nhật biểu đồ khi chọn loại phân bổ
document.getElementById('chartTypeSelect').addEventListener('change', e => {
  drawPieChart(allData, e.target.value);
});

// Đổi tiêu đề bảng theo lựa chọn
const titleMap = {
  "1": "Danh Sách Cửa Hàng Theo Thành Phố",
  "2": "Danh Sách Đơn Hàng Theo Khách Hàng",
  "3": "Cửa Hàng Bán Mặt Hàng Cho Khách",
  "4": "Văn Phòng Đại Diện Lưu Kho Mặt Hàng",
  "5": "Đơn Hàng Và Mặt Hàng Đi Kèm",
  "6": "Thành Phố Và Bang Của Khách Hàng",
  "7": "Mức Tồn Kho Mặt Hàng Theo Thành Phố",
  "8": "Mặt Hàng Theo Đơn Đặt Hàng",
  "9": "Khách Du Lịch, Khách Đặt Theo Bưu Điện"
};
document.getElementById('questionSelect').addEventListener('change', function () {
  const heading = document.querySelector('h1');
  heading.textContent = titleMap[this.value] || "Danh Sách Bán theo Cửa Hàng";
});

const selectCuaHang = document.getElementById('selectCuaHang');

fetch('/api/cua-hang')
  .then(res => res.json())
  .then(data => {
    data.forEach(ch => {
      const option = document.createElement('option');
      option.value = ch.MaCuaHang;
      option.textContent = `${ch.MaCuaHang} (${ch.SoDienThoai})`;
      selectCuaHang.appendChild(option);
    });
  });

selectCuaHang.addEventListener('change', () => {
  const maCH = selectCuaHang.value;
  if (!maCH) return;

  fetch(`/api/mat-hang-theo-cua-hang/${maCH}`)
    .then(res => res.json())
    .then(data => {
      tableHeadRowResult.innerHTML = '';
      tableBodyResult.innerHTML = '';

      if (data.length === 0) {
        tableHeadRowResult.innerHTML = '<th>Không có dữ liệu</th>';
        return;
      }

      const cols = Object.keys(data[0]);
      cols.forEach(col => {
        const th = document.createElement('th');
        th.textContent = col;
        tableHeadRowResult.appendChild(th);
      });

      data.forEach(row => {
        const tr = document.createElement('tr');
        cols.forEach(col => {
          const td = document.createElement('td');
          td.textContent = row[col];
          tr.appendChild(td);
        });
        tableBodyResult.appendChild(tr);
      });
    });
});

const queryInputs = document.querySelectorAll('.query-input');
const queryResultTable = document.getElementById('queryResultTable');
const queryResultHead = document.getElementById('queryResultHead');
const queryResultBody = queryResultTable.querySelector('tbody');

const questionSelect = document.getElementById('questionSelect');

questionSelect.addEventListener('change', () => {
  // Ẩn hết tất cả input
  queryInputs.forEach(div => div.style.display = 'none');
  queryResultHead.innerHTML = '';
  queryResultBody.innerHTML = '';

  const val = questionSelect.value;
  if (!val) {
    queryResultTable.style.display = 'none';
    return;
  }

  // Hiện input phù hợp
  const divToShow = document.getElementById('query' + val);
  if(divToShow) {
    divToShow.style.display = 'block';
  }
  queryResultTable.style.display = 'table';
});

// Hàm show kết quả chung
function showResult(data) {
  queryResultHead.innerHTML = '';
  queryResultBody.innerHTML = '';
  if (!data || data.length === 0) {
    queryResultHead.innerHTML = '<th>Không có dữ liệu</th>';
    return;
  }
  const cols = Object.keys(data[0]);
  cols.forEach(col => {
    const th = document.createElement('th');
    th.textContent = col;
    queryResultHead.appendChild(th);
  });
  data.forEach(row => {
    const tr = document.createElement('tr');
    cols.forEach(col => {
      const td = document.createElement('td');
      td.textContent = row[col];
      tr.appendChild(td);
    });
    queryResultBody.appendChild(tr);
  });
}

// Các hàm gọi API từng câu hỏi
function runQuery1() {
  const maCuaHang = document.getElementById('input1_maCuaHang').value.trim();
  if (!maCuaHang) return alert('Vui lòng nhập mã cửa hàng');
  fetch(`/api/cua-hang-ban-san-pham-theo-cuahang/${encodeURIComponent(maCuaHang)}`)
    .then(res => res.json())
    .then(showResult)
    .catch(err => alert('Lỗi tải dữ liệu: ' + err));
}

function runQuery2() {
  const maKH = document.getElementById('input2_maKH').value.trim();
  if (!maKH) return alert('Vui lòng nhập mã khách hàng');
  fetch(`/api/don-hang-theo-khachhang/${encodeURIComponent(maKH)}`)
    .then(res => res.json())
    .then(showResult)
    .catch(err => alert('Lỗi tải dữ liệu: ' + err));
}

function runQuery3() {
  const maKH = document.getElementById('input3_maKH').value.trim();
  if (!maKH) return alert('Vui lòng nhập mã khách hàng');
  fetch(`/api/cua-hang-ban-mat-hang-theo-khachhang/${encodeURIComponent(maKH)}`)
    .then(res => res.json())
    .then(showResult)
    .catch(err => alert('Lỗi tải dữ liệu: ' + err));
}

function runQuery4() {
  const maMatHang = document.getElementById('input4_maMatHang').value.trim();
  const soLuongTonKho = document.getElementById('input4_soLuong').value.trim();
  if (!maMatHang || !soLuongTonKho) return alert('Vui lòng nhập đủ mã mặt hàng và số lượng tồn kho');
  fetch(`/api/van-phong-luu-kho?maMatHang=${encodeURIComponent(maMatHang)}&soLuongTonKho=${encodeURIComponent(soLuongTonKho)}`)
    .then(res => res.json())
    .then(showResult)
    .catch(err => alert('Lỗi tải dữ liệu: ' + err));
}

function runQuery5() {
  const maDon = document.getElementById('input5_maDon').value.trim();
  if (!maDon) return alert('Vui lòng nhập mã đơn đặt hàng');
  fetch(`/api/mat-hang-theo-don/${encodeURIComponent(maDon)}`)
    .then(res => res.json())
    .then(showResult)
    .catch(err => alert('Lỗi tải dữ liệu: ' + err));
}

function runQuery6() {
  const maKH = document.getElementById('input6_maKH').value.trim();
  if (!maKH) return alert('Vui lòng nhập mã khách hàng');
  fetch(`/api/thanh-pho-bang-khach-hang/${encodeURIComponent(maKH)}`)
    .then(res => res.json())
    .then(showResult)
    .catch(err => alert('Lỗi tải dữ liệu: ' + err));
}

function runQuery7() {
  const tenThanhPho = document.getElementById('input7_tenThanhPho').value.trim();
  const maMatHang = document.getElementById('input7_maMatHang').value.trim();
  if (!tenThanhPho || !maMatHang) return alert('Vui lòng nhập đủ tên thành phố và mã mặt hàng');
  fetch(`/api/muc-ton-kho?tenThanhPho=${encodeURIComponent(tenThanhPho)}&maMatHang=${encodeURIComponent(maMatHang)}`)
    .then(res => res.json())
    .then(showResult)
    .catch(err => alert('Lỗi tải dữ liệu: ' + err));
}

function runQuery8() {
  const maDon = document.getElementById('input8_maDon').value.trim();
  if (!maDon) return alert('Vui lòng nhập mã đơn đặt hàng');
  fetch(`/api/don-hang-chi-tiet/${encodeURIComponent(maDon)}`)
    .then(res => res.json())
    .then(showResult)
    .catch(err => alert('Lỗi tải dữ liệu: ' + err));
}

function runQuery9() {
  const loaiKH = document.getElementById('selectLoaiKH').value;

  // Tạo URL API với query param nếu có loại khách hàng
  let url = '/api/thong-ke-loai-khach-hang';
  if(loaiKH) {
    url += `?loaiKH=${encodeURIComponent(loaiKH)}`;
  }

  fetch(url)
    .then(res => res.json())
    .then(data => {
      showResult(data);
    })
    .catch(err => alert('Lỗi tải dữ liệu: ' + err));
}
