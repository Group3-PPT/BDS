import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiPlus, FiEdit2, FiTrash2, FiDownload, FiSearch, FiUpload } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { getProperties, deleteProperty, updateStatus, exportExcel } from '../services/api';
import * as XLSX from 'xlsx';

const formatPrice = (price, currency) => {
  if (currency === 'USD') return `$${Number(price).toLocaleString()}`;
  return Number(price).toLocaleString('vi-VN') + ' đ';
};

export default function AdminPage() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({});
  const [page, setPage] = useState(1);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data } = await getProperties({ page, limit: 20, search });
      setProperties(data.data);
      setPagination(data.pagination);
    } catch (error) {
      toast.error('Lỗi khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page]);

  const handleDelete = async (id, title) => {
    if (!confirm(`Xóa "${title}"?`)) return;
    try {
      await deleteProperty(id);
      toast.success('Đã xóa');
      fetchData();
    } catch (error) {
      toast.error('Xóa thất bại');
    }
  };

  const handleExport = async () => {
    try {
      const { data } = await exportExcel();
      const formatted = data.map(p => ({
        'Tiêu đề': p.title,
        'Địa chỉ': p.address,
        'Quận': p.district,
        'Thành phố': p.city,
        'Diện tích (m²)': p.area,
        'Kết cấu': p.structure,
        'Loại': p.listing_type === 'sale' ? 'Bán' : 'Cho thuê',
        'Giá': p.price,
        'Tiền tệ': p.currency,
        'Liên hệ': p.contact_name,
        'SĐT': p.contact_phone,
        'Ngày tạo': new Date(p.created_at).toLocaleDateString('vi-VN')
      }));
      const ws = XLSX.utils.json_to_sheet(formatted);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'BĐS');
      XLSX.writeFile(wb, 'danh-sach-bds.xlsx');
      toast.success('Xuất file thành công');
    } catch (error) {
      toast.error('Xuất file thất bại');
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchData();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý bất động sản</h1>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            <FiDownload /> Xuất Excel
          </button>
          <Link
            to="/admin/import"
            className="px-4 py-2 border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 flex items-center gap-2"
          >
            <FiUpload /> Nhập tin nhắn
          </Link>
          <Link
            to="/admin/add"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <FiPlus /> Thêm mới
          </Link>
        </div>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-4 flex gap-2">
        <div className="flex-1 relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>
        <button type="submit" className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">
          Tìm
        </button>
      </form>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
          </div>
        ) : properties.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>Chưa có dữ liệu</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium text-gray-500">Ảnh</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Tiêu đề</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Địa chỉ</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Loại</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Trạng thái</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Giá</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Diện tích</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {properties.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      {p.thumbnail ? (
                        <img src={p.thumbnail} alt="" className="w-16 h-12 object-cover rounded" />
                      ) : (
                        <div className="w-16 h-12 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xs">
                          No img
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium max-w-[200px] truncate">{p.title}</td>
                    <td className="px-4 py-3 text-gray-500 max-w-[200px] truncate">
                      {p.address}, {p.district}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                        p.listing_type === 'sale'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {p.listing_type === 'sale' ? 'Bán' : 'Thuê'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={p.status || 'available'}
                        onChange={async (e) => {
                          try {
                            await updateStatus(p.id, e.target.value);
                            toast.success('Đã cập nhật');
                            fetchData();
                          } catch {
                            toast.error('Lỗi');
                          }
                        }}
                        className={`text-xs font-medium rounded px-2 py-1 border-0 cursor-pointer ${
                          p.status === 'rented' ? 'bg-orange-100 text-orange-700' :
                          p.status === 'sold' ? 'bg-gray-100 text-gray-700' :
                          'bg-blue-100 text-blue-700'
                        }`}
                      >
                        <option value="available">Đang cho thuê</option>
                        <option value="rented">Đã cho thuê</option>
                        <option value="sold">Đã bán</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 font-medium text-blue-600">
                      {formatPrice(p.price, p.currency)}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{p.area} m²</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Link
                          to={`/admin/edit/${p.id}`}
                          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <FiEdit2 size={16} />
                        </Link>
                        <button
                          onClick={() => handleDelete(p.id, p.title)}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-10 h-10 rounded-lg ${
                p === page ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
