const express = require('express');
const sql = require('mssql');
const path = require('path');

const config = {
    user: 'sa',
    password: '12345678',
    server: 'DESKTOP-FMEL8VA',
    database: 'dbdw',
    options: {
        encrypt: true,
        trustServerCertificate: true
    }
};

function startApp(callback) {
    sql.connect(config).then(pool => {
        console.log('✅ Đã kết nối SQL Server');
        const app = express();

        app.use(express.static(__dirname));

        // Trang chính
        app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, 'index.html'));
        });
                // API: Doanh thu theo thành phố
        app.get('/testview', async (req, res) => {
            try {
                const query = `
                    SELECT 
                        *
                    FROM dbo.vw_DoanhThu_TheoAllThoiGian_AllKhachHang_AllMatHang;
                `;
                const result = await pool.request().query(query);
                res.json(result.recordset);
            } catch (err) {
                console.error('❌ Lỗi truy vấn doanh thu theo thành phố:', err.message);
                res.status(500).send('Lỗi truy vấn doanh thu theo thành phố');
            }
        });

        // API: Doanh thu theo thành phố
        app.get('/doanhthu/theo-thanhpho', async (req, res) => {
            try {
                const query = `
                    SELECT 
                        MaThanhPho,
                        TenThanhPho,
                        TongDoanhThu
                    FROM dbo.vw_DoanhThuTheoThanhPho;
                `;
                const result = await pool.request().query(query);
                res.json(result.recordset);
            } catch (err) {
                console.error('❌ Lỗi truy vấn doanh thu theo thành phố:', err.message);
                res.status(500).send('Lỗi truy vấn doanh thu theo thành phố');
            }
        });

        // API: Doanh thu theo bang
        app.get('/doanhthu/theo-bang', async (req, res) => {
            try {
                const query = `
                    SELECT 
                        tp.Bang,
                        SUM(fd.ThanhTien) AS TongDoanhThu
                    FROM FactDatHang fd
                    JOIN DimKhachHang kh ON fd.MaKH = kh.MaKH
                    JOIN DimThanhPho tp ON kh.MaThanhPho = tp.MaThanhPho
                    GROUP BY tp.Bang
                    ORDER BY TongDoanhThu DESC
                `;
                const result = await pool.request().query(query);
                res.json(result.recordset);
            } catch (err) {
                console.error('❌ Lỗi truy vấn doanh thu theo bang:', err.message);
                res.status(500).send('Lỗi truy vấn doanh thu theo bang');
            }
        });

        // Route mặc định
        app.get('/khach-hang', (req, res) => {
            const query = `SELECT * FROM DimKhachHang`;
            pool.request().query(query, (err, result) => {
                if (err) {
                    console.error('Lỗi truy vấn:', err.message);
                    return res.status(500).send('Lỗi truy vấn dữ liệu');
                }
                res.json(result.recordset);
            });
        });

        // Lấy danh sách cửa hàng
        app.get('/api/cua-hang', async (req, res) => {
            try {
                const result = await pool.request().query(`
                    SELECT MaCuaHang, SoDienThoai,MaThanhPho FROM DimCuaHang
                `);
                res.json(result.recordset);
            } catch (err) {
                console.error('❌ Lỗi truy vấn cửa hàng:', err.message);
                res.status(500).send('Lỗi truy vấn cửa hàng');
            }
        });
        // -- 9 API Câu Hỏi -- //

        // 1. Tìm các cửa hàng có bán sản phẩm giống sản phẩm có trong kho của cửa hàng X
        app.get('/api/cua-hang-ban-san-pham-theo-cuahang/:maCuaHang', async (req, res) => {
            try {
                const maCuaHang = req.params.maCuaHang;
                const result = await pool.request()
                    .input('maCuaHang', sql.VarChar, maCuaHang)
                    .query(`
                        SELECT DISTINCT 
    C.MaCuaHang, 
    LK.MaMatHang,
    TP.TenThanhPho, 
    TP.Bang, 
    C.SoDienThoai,
    MH.MoTa,
    MH.KichCo,
    MH.TrongLuong
FROM DimCuaHang C
JOIN DimThanhPho TP ON C.MaThanhPho = TP.MaThanhPho
JOIN FactTonKho LK ON C.MaCuaHang = LK.MaCuaHang
JOIN DimMatHang MH ON LK.MaMatHang = MH.MaMatHang
WHERE LK.MaMatHang IN (
    SELECT MaMatHang
    FROM FactTonKho
    WHERE MaCuaHang = @maCuaHang
                        )
        AND C.MaCuaHang <> @maCuaHang
                    `);
                res.json(result.recordset);
            } catch (err) {
                console.error('❌ Lỗi truy vấn cửa hàng bán sản phẩm:', err.message);
                res.status(500).send('Lỗi truy vấn cửa hàng bán sản phẩm');
            }
        });

        // 2. Tìm các đơn đặt hàng của khách hàng X
        app.get('/api/don-hang-theo-khachhang/:maKH', async (req, res) => {
            try {
                const maKH = req.params.maKH;
                const result = await pool.request()
                    .input('maKH', sql.VarChar, maKH)
                    .query(`
                        SELECT 
                            fd.MaDon,
                            fd.MaMatHang,
                            kh.TenKH,
                            fd.NgayDatHang
                        FROM FactDatHang fd
                        JOIN DimKhachHang kh ON fd.MaKH = kh.MaKH
                        WHERE fd.MaKH = @maKH
                        ORDER BY fd.NgayDatHang
                    `);
                res.json(result.recordset);
            } catch (err) {
                console.error('❌ Lỗi truy vấn đơn hàng theo khách hàng:', err.message);
                res.status(500).send('Lỗi truy vấn đơn hàng theo khách hàng');
            }
        });

        // 3. Tìm cửa hàng bán các mặt hàng được khách hàng X đặt
        app.get('/api/cua-hang-ban-mat-hang-theo-khachhang/:maKH', async (req, res) => {
            try {
                const maKH = req.params.maKH;
                const result = await pool.request()
                    .input('maKH', sql.VarChar, maKH)
                    .query(`
                        SELECT DISTINCT
                            ch.MaCuaHang,
                            tk.MaMatHang,
                            tp.TenThanhPho,
                            ch.SoDienThoai
                        FROM DimCuaHang ch
                        JOIN DimThanhPho tp ON ch.MaThanhPho = tp.MaThanhPho
                        JOIN FactTonKho tk ON ch.MaCuaHang = tk.MaCuaHang
                        WHERE tk.MaMatHang IN (
                            SELECT MaMatHang FROM FactDatHang WHERE MaKH = @maKH
                        )
                        ORDER BY ch.MaCuaHang, tk.MaMatHang
                    `);
                res.json(result.recordset);
            } catch (err) {
                console.error('❌ Lỗi truy vấn cửa hàng bán mặt hàng theo khách:', err.message);
                res.status(500).send('Lỗi truy vấn cửa hàng bán mặt hàng theo khách');
            }
        });

        // 4. Tìm địa chỉ văn phòng đại diện với tên thành phố, bang, số lượng tồn kho > tham số
        app.get('/api/van-phong-luu-kho', async (req, res) => {
            try {
                const { maMatHang, soLuongTonKho } = req.query;
                if (!maMatHang || !soLuongTonKho) {
                    return res.status(400).send('Thiếu tham số maMatHang hoặc soLuongTonKho');
                }
                const result = await pool.request()
                    .input('maMatHang', sql.Int, parseInt(maMatHang))
                    .input('soLuongTonKho', sql.Int, parseInt(soLuongTonKho))
                    .query(`
                        SELECT DISTINCT
                            ch.MaCuaHang,
                            vp.DiaChiVP,
                            vp.TenThanhPho,
                            vp.Bang,
                            tk.SoLuongTonKho
                        FROM DimThanhPho vp
                        JOIN DimCuaHang ch ON vp.MaThanhPho = ch.MaThanhPho
                        JOIN FactTonKho tk ON ch.MaCuaHang = tk.MaCuaHang
                        WHERE tk.MaMatHang = @maMatHang
                          AND tk.SoLuongTonKho > @soLuongTonKho
                    `);
                res.json(result.recordset);
            } catch (err) {
                console.error('❌ Lỗi truy vấn văn phòng lưu kho:', err.message);
                res.status(500).send('Lỗi truy vấn văn phòng lưu kho');
            }
        });

        // 5. Liệt kê các mặt hàng được đặt theo mã đơn hàng X
        app.get('/api/mat-hang-theo-don/:maDon', async (req, res) => {
            try {
                const maDon = req.params.maDon;
                const result = await pool.request()
                    .input('maDon', sql.VarChar, maDon)
                    .query(`
                        SELECT DISTINCT
                            mh.MaMatHang,
                            mh.MoTa,
                            ch.MaCuaHang,
                            tp.TenThanhPho
                        FROM FactDatHang fd
                        JOIN DimMatHang mh ON fd.MaMatHang = mh.MaMatHang
                        JOIN FactTonKho tk ON mh.MaMatHang = tk.MaMatHang
                        JOIN DimCuaHang ch ON tk.MaCuaHang = ch.MaCuaHang
                        JOIN DimThanhPho tp ON ch.MaThanhPho = tp.MaThanhPho
                        WHERE fd.MaDon = @maDon
                    `);
                res.json(result.recordset);
            } catch (err) {
                console.error('❌ Lỗi truy vấn mặt hàng theo đơn:', err.message);
                res.status(500).send('Lỗi truy vấn mặt hàng theo đơn');
            }
        });

        // 6. Tìm thành phố và bang của khách hàng theo mã khách hàng X
        app.get('/api/thanh-pho-bang-khach-hang/:maKH', async (req, res) => {
            try {
                const maKH = req.params.maKH;
                const result = await pool.request()
                    .input('maKH', sql.VarChar, maKH)
                    .query(`
                        SELECT 
                          tp.TenThanhPho,
                          tp.Bang
                        FROM DimKhachHang kh
                        JOIN DimThanhPho tp ON kh.MaThanhPho = tp.MaThanhPho
                        WHERE kh.MaKH = @maKH
                    `);
                res.json(result.recordset);
            } catch (err) {
                console.error('❌ Lỗi truy vấn thành phố, bang khách hàng:', err.message);
                res.status(500).send('Lỗi truy vấn thành phố, bang khách hàng');
            }
        });

        // 7. Tìm mức tồn kho mặt hàng X tại tất cả cửa hàng trong thành phố X
        app.get('/api/muc-ton-kho', async (req, res) => {
            try {
                const { tenThanhPho, maMatHang } = req.query;
                if (!tenThanhPho || !maMatHang) {
                    return res.status(400).send('Thiếu tham số tenThanhPho hoặc maMatHang');
                }
                const result = await pool.request()
                    .input('tenThanhPho', sql.NVarChar, tenThanhPho)
                    .input('maMatHang', sql.Int, parseInt(maMatHang))
                    .query(`
                        SELECT
                            ch.MaCuaHang,
                            ch.SoDienThoai,
                            tk.SoLuongTonKho
                        FROM DimCuaHang ch
                        JOIN DimThanhPho tp ON ch.MaThanhPho = tp.MaThanhPho
                        JOIN FactTonKho tk ON ch.MaCuaHang = tk.MaCuaHang
                        WHERE tp.TenThanhPho = @tenThanhPho
                          AND tk.MaMatHang = @maMatHang
                        ORDER BY ch.MaCuaHang
                    `);
                res.json(result.recordset);
            } catch (err) {
                console.error('❌ Lỗi truy vấn mức tồn kho:', err.message);
                res.status(500).send('Lỗi truy vấn mức tồn kho');
            }
        });
        // 8. Tìm mặt hàng, số lượng đặt, khách hàng, cửa hàng và thành phố theo mã đơn hàng X
        app.get('/api/don-hang-chi-tiet/:maDon', async (req, res) => {
            try {
                const maDon = req.params.maDon;
                const result = await pool.request()
                    .input('maDon', sql.VarChar, maDon)
                    .query(`
                        SELECT
                            fd.MaMatHang,
                            mh.MoTa,
                            fd.SoLuongDat,
                            kh.MaKH,
                            kh.TenKH,
                            ch.MaCuaHang,
                            tp.TenThanhPho
                        FROM FactDatHang fd
                        JOIN DimKhachHang kh ON fd.MaKH = kh.MaKH
                        JOIN DimCuaHang ch ON kh.MaThanhPho = ch.MaThanhPho
                        JOIN DimThanhPho tp ON ch.MaThanhPho = tp.MaThanhPho
                        JOIN DimMatHang mh ON fd.MaMatHang = mh.MaMatHang
                        WHERE fd.MaDon = @maDon
                    `);
                res.json(result.recordset);
            } catch (err) {
                console.error('❌ Lỗi truy vấn chi tiết đơn hàng:', err.message);
                res.status(500).send('Lỗi truy vấn chi tiết đơn hàng');
            }
        });

        // 9. Thống kê số lượng khách hàng theo loại khách hàng
app.get('/api/thong-ke-loai-khach-hang', async (req, res) => {
  try {
    const loaiKH = req.query.loaiKH;
    let result;

    if (loaiKH) {
      const query = `
        SELECT MaKH, TenKH, MaThanhPho, LoaiKH
        FROM DimKhachHang
        WHERE LoaiKH = @loaiKH
        ORDER BY MaKH
      `;
      result = await pool.request()
        .input('loaiKH', sql.NVarChar, loaiKH)
        .query(query);
    } else {
      const query = `
        SELECT MaKH, TenKH, MaThanhPho, LoaiKH
        FROM DimKhachHang
        ORDER BY MaKH
      `;
      result = await pool.request().query(query);
    }

    res.json(result.recordset);
  } catch (err) {
    console.error('❌ Lỗi truy vấn khách hàng theo loại:', err.message);
    res.status(500).send('Lỗi truy vấn khách hàng theo loại');
  }
});



        // Gọi callback để server.js sử dụng app này
        callback(app);

    }).catch(err => {
        console.error('❌ Lỗi kết nối SQL:', err);
    });
}

module.exports = startApp;