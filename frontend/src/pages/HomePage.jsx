import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiSearch, FiMapPin, FiHome, FiX } from 'react-icons/fi';
import { getProperties } from '../services/api';

const DISTRICTS = [
  'Quận 1', 'Quận 2', 'Quận 3', 'Quận 4', 'Quận 5', 'Quận 6', 'Quận 7',
  'Quận 8', 'Quận 9', 'Quận 10', 'Quận 11', 'Quận 12',
  'Bình Thạnh', 'Gò Vấp', 'Phú Nhuận', 'Tân Bình', 'Tân Phú',
  'Bình Chánh', 'Hóc Môn', 'Củ Chi', 'Nhà Bè'
];

const PRICE_RANGES = [
  { label: 'Dưới 5 triệu', min: '', max: 5000000 },
  { label: '5 - 10 triệu', min: 5000000, max: 10000000 },
  { label: '10 - 20 triệu', min: 10000000, max: 20000000 },
  { label: '20 - 50 triệu', min: 20000000, max: 50000000 },
  { label: '50 - 100 triệu', min: 50000000, max: 100000000 },
  { label: 'Trên 100 triệu', min: 100000000, max: '' },
  { label: 'Dưới 1 tỷ', min: '', max: 1000000000 },
  { label: '1 - 3 tỷ', min: 1000000000, max: 3000000000 },
  { label: '3 - 5 tỷ', min: 3000000000, max: 5000000000 },
  { label: 'Trên 5 tỷ', min: 5000000000, max: '' },
];

const AREA_RANGES = [
  { label: 'Dưới 30m²', min: '', max: 30 },
  { label: '30 - 50m²', min: 30, max: 50 },
  { label: '50 - 80m²', min: 50, max: 80 },
  { label: '80 - 100m²', min: 80, max: 100 },
  { label: 'Trên 100m²', min: 100, max: '' },
];

const formatPrice = (price, currency) => {
  if (currency === 'USD') return `$${Number(price).toLocaleString()}`;
  if (price >= 1e9) return `${(price / 1e9).toFixed(1)} tỷ`;
  if (price >= 1e6) return `${(price / 1e6).toFixed(0)} triệu`;
  return Number(price).toLocaleString() + ' đ';
};

export default function HomePage() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    search: '',
    district: '',
    listing_type: '',
    status: '',
    min_price: '',
    max_price: '',
    min_area: '',
    max_area: ''
  });

  const activeFilterCount = ['district', 'listing_type', 'status', 'min_price', 'max_price', 'min_area', 'max_area']
    .filter(k => filters[k] !== '').length;

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {};
      Object.entries(filters).forEach(([key, val]) => {
        if (val !== '' && val !== null && val !== undefined) {
          params[key] = val;
        }
      });
      const { data } = await getProperties(params);
      setProperties(data.data);
      setPagination(data.pagination);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filters.page]);

  const handleSearch = (e) => {
    e.preventDefault();
    setFilters(f => ({ ...f, page: 1 }));
    setTimeout(fetchData, 0);
  };

  const handleFilterChange = (key, value) => {
    setFilters(f => ({ ...f, [key]: value, page: 1 }));
    setTimeout(fetchData, 0);
  };

  const clearFilters = () => {
    setFilters({
      page: 1, limit: 20, search: '', district: '',
      listing_type: '', status: '',
      min_price: '', max_price: '',
      min_area: '', max_area: ''
    });
    setTimeout(fetchData, 0);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Search Bar */}
      <form onSubmit={handleSearch} className="mb-4">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm theo tên, địa chỉ..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Tìm kiếm
          </button>
        </div>
      </form>

      {/* Filters - Always Visible */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-700">
            Bộ lọc {activeFilterCount > 0 && <span className="text-sm text-blue-600">({activeFilterCount})</span>}
          </h3>
          {activeFilterCount > 0 && (
            <button onClick={clearFilters} className="text-sm text-red-500 hover:text-red-700 flex items-center gap-1">
              <FiX size={14} /> Xóa bộ lọc
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {/* Quận */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Quận / Huyện</label>
            <select
              value={filters.district}
              onChange={(e) => handleFilterChange('district', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Tất cả</option>
              {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          {/* Loại */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Loại</label>
            <select
              value={filters.listing_type}
              onChange={(e) => handleFilterChange('listing_type', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Tất cả</option>
              <option value="rent">Cho thuê</option>
              <option value="sale">Bán</option>
            </select>
          </div>

          {/* Trạng thái */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Trạng thái</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Tất cả</option>
              <option value="available">Đang cho thuê</option>
              <option value="rented">Đã cho thuê</option>
              <option value="sold">Đã bán</option>
            </select>
          </div>

          {/* Giá */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Khoảng giá</label>
            <select
              value={`${filters.min_price}-${filters.max_price}`}
              onChange={(e) => {
                const [min, max] = e.target.value.split('-');
                setFilters(f => ({ ...f, min_price: min, max_price: max, page: 1 }));
                setTimeout(fetchData, 0);
              }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="-">Tất cả</option>
              <optgroup label="Cho thuê">
                {PRICE_RANGES.slice(0, 5).map((r, i) => (
                  <option key={i} value={`${r.min}-${r.max}`}>{r.label}</option>
                ))}
              </optgroup>
              <optgroup label="Bán">
                {PRICE_RANGES.slice(5).map((r, i) => (
                  <option key={i} value={`${r.min}-${r.max}`}>{r.label}</option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Diện tích */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Diện tích</label>
            <select
              value={`${filters.min_area}-${filters.max_area}`}
              onChange={(e) => {
                const [min, max] = e.target.value.split('-');
                setFilters(f => ({ ...f, min_area: min, max_area: max, page: 1 }));
                setTimeout(fetchData, 0);
              }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="-">Tất cả</option>
              {AREA_RANGES.map((r, i) => (
                <option key={i} value={`${r.min}-${r.max}`}>{r.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Giá thủ công */}
        <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Giá từ (VND)</label>
            <input
              type="number"
              placeholder="Từ"
              value={filters.min_price}
              onChange={(e) => handleFilterChange('min_price', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Giá đến (VND)</label>
            <input
              type="number"
              placeholder="Đến"
              value={filters.max_price}
              onChange={(e) => handleFilterChange('max_price', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Diện tích từ (m²)</label>
            <input
              type="number"
              placeholder="Từ"
              value={filters.min_area}
              onChange={(e) => handleFilterChange('min_area', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Diện tích đến (m²)</label>
            <input
              type="number"
              placeholder="Đến"
              value={filters.max_area}
              onChange={(e) => handleFilterChange('max_area', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
        </div>
      ) : properties.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <FiHome className="mx-auto text-6xl mb-4 text-gray-300" />
          <p className="text-lg">Không tìm thấy bất động sản nào</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {properties.map((p) => (
              <Link
                key={p.id}
                to={`/property/${p.id}`}
                className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition group"
              >
                <div className="aspect-[4/3] bg-gray-200 overflow-hidden">
                  {p.thumbnail ? (
                    <img
                      src={p.thumbnail}
                      alt={p.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <FiHome size={48} />
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                      p.listing_type === 'sale'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {p.listing_type === 'sale' ? 'Bán' : 'Cho thuê'}
                    </span>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                      p.status === 'rented' ? 'bg-orange-100 text-orange-700' :
                      p.status === 'sold' ? 'bg-gray-100 text-gray-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {p.status === 'rented' ? 'Đã cho thuê' :
                       p.status === 'sold' ? 'Đã bán' : 'Đang cho thuê'}
                    </span>
                    {p.area && (
                      <span className="text-xs text-gray-500">{p.area} m²</span>
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-800 line-clamp-1 group-hover:text-blue-600">
                    {p.title}
                  </h3>
                  <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                    <FiMapPin size={14} />
                    <span className="line-clamp-1">{p.address}, {p.district}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-lg font-bold text-blue-600">
                      {formatPrice(p.price, p.currency)}
                      {p.notes && <span className="text-xs text-gray-400 font-normal ml-1">({p.notes})</span>}
                    </span>
                    {p.structure && (
                      <span className="text-xs text-gray-400">{p.structure}</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <button
                onClick={() => setFilters(f => ({ ...f, page: Math.max(1, f.page - 1) }))}
                disabled={filters.page <= 1}
                className="px-3 py-2 rounded-lg bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Trước
              </button>
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === pagination.totalPages || Math.abs(p - filters.page) <= 2)
                .reduce((acc, p, i, arr) => {
                  if (i > 0 && p - arr[i - 1] > 1) acc.push('...');
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, i) => (
                  p === '...' ? (
                    <span key={`dots-${i}`} className="px-2 text-gray-400">...</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setFilters(f => ({ ...f, page: p }))}
                      className={`w-10 h-10 rounded-lg ${
                        p === filters.page
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {p}
                    </button>
                  )
                ))}
              <button
                onClick={() => setFilters(f => ({ ...f, page: Math.min(pagination.totalPages, f.page + 1) }))}
                disabled={filters.page >= pagination.totalPages}
                className="px-3 py-2 rounded-lg bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Sau
              </button>
              <span className="text-sm text-gray-500 ml-2">
                Trang {pagination.page}/{pagination.totalPages} ({pagination.total} kết quả)
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
