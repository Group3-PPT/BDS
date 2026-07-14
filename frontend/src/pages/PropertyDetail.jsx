import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiMapPin, FiPhone, FiUser, FiArrowLeft, FiHome } from 'react-icons/fi';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import { getPropertyById } from '../services/api';

const formatPrice = (price, currency) => {
  if (currency === 'USD') return `$${Number(price).toLocaleString()}`;
  if (price >= 1e9) return `${(price / 1e9).toFixed(1)} tỷ`;
  if (price >= 1e6) return `${(price / 1e6).toFixed(0)} triệu`;
  return Number(price).toLocaleString('vi-VN') + ' đ';
};

const STATUS_MAP = {
  available: { label: 'Đang cho thuê', color: 'text-blue-600' },
  holding: { label: 'Đang giữ', color: 'text-yellow-600' },
  rented: { label: 'Đã cho thuê', color: 'text-orange-600' },
  sold: { label: 'Đã bán', color: 'text-gray-600' },
  hidden: { label: 'Ẩn', color: 'text-gray-400' },
};

const InfoItem = ({ label, value }) => value ? (
  <div className="bg-blue-50 rounded-lg p-3 text-center">
    <p className="text-xs text-gray-500">{label}</p>
    <p className="font-semibold text-blue-600 text-sm">{value}</p>
  </div>
) : null;

export default function PropertyDetail() {
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await getPropertyById(id);
        setProperty(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="text-center py-20 text-gray-500">
        <p>Không tìm thấy bất động sản</p>
        <Link to="/" className="text-blue-600 hover:underline mt-2 inline-block">Về trang chủ</Link>
      </div>
    );
  }

  const images = property.images || [];
  const position = property.latitude && property.longitude ? [property.latitude, property.longitude] : null;
  const st = STATUS_MAP[property.status] || STATUS_MAP.available;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <Link to="/" className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-4">
        <FiArrowLeft /> Quay lại
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Image Gallery */}
          <div className="bg-white rounded-lg overflow-hidden shadow-sm">
            <div className="aspect-video bg-gray-200">
              {images.length > 0 ? (
                <img src={images[selectedImage]?.image_url} alt={property.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400"><FiHome size={64} /></div>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 p-3 overflow-x-auto">
                {images.map((img, idx) => (
                  <button key={img.id} onClick={() => setSelectedImage(idx)}
                    className={`flex-shrink-0 w-20 h-16 rounded overflow-hidden border-2 ${selectedImage === idx ? 'border-blue-500' : 'border-transparent'}`}>
                    <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                property.listing_type === 'sale' ? 'bg-red-100 text-red-700' :
                property.listing_type === 'transfer' ? 'bg-purple-100 text-purple-700' :
                'bg-green-100 text-green-700'
              }`}>
                {property.listing_type === 'sale' ? 'Bán' : property.listing_type === 'transfer' ? 'Sang nhượng' : 'Cho thuê'}
              </span>
              <span className={`text-sm font-medium ${st.color}`}>{st.label}</span>
              {property.property_type && (
                <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">{property.property_type}</span>
              )}
            </div>

            <h1 className="text-2xl font-bold text-gray-800 mb-2">{property.title}</h1>
            <div className="flex items-center gap-2 text-gray-500 mb-6">
              <FiMapPin />
              <span>{property.address}, {property.district}, {property.city}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <InfoItem label="Giá" value={`${formatPrice(property.price, property.currency)}${property.price_unit === 'month' ? '/tháng' : property.price_unit === 'sqm' ? '/m²' : ''}`} />
              <InfoItem label="Diện tích" value={property.area ? `${property.area} m²` : null} />
              <InfoItem label="DT sử dụng" value={property.usable_area ? `${property.usable_area} m²` : null} />
              <InfoItem label="Kết cấu" value={property.structure} />
              <InfoItem label="Tầng" value={property.floors} />
              <InfoItem label="Phòng" value={property.bedrooms ? `${property.bedrooms} PN` : null} />
              <InfoItem label="WC" value={property.bathrooms ? `${property.bathrooms} WC` : null} />
              <InfoItem label="Cọc" value={property.deposit} />
              <InfoItem label="Hoa hồng" value={property.commission} />
            </div>

            {property.width && property.length && (
              <p className="text-sm text-gray-600 mb-2">Kích thước: {property.width}m × {property.length}m</p>
            )}

            {property.description && (
              <div className="mt-4">
                <h3 className="font-semibold text-gray-800 mb-2">Hoa hồng / Điều kiện</h3>
                <p className="text-gray-600 whitespace-pre-line">{property.description}</p>
              </div>
            )}

            {property.notes && (
              <div className="mt-4">
                <h3 className="font-semibold text-gray-800 mb-2">Ghi chú nội bộ</h3>
                <p className="text-gray-600 whitespace-pre-line">{property.notes}</p>
              </div>
            )}

            {(property.business_type || property.restriction) && (
              <div className="mt-4">
                <h3 className="font-semibold text-gray-800 mb-2">Kinh doanh</h3>
                <div className="flex gap-4 text-sm text-gray-600">
                  {property.business_type && <span>Phù hợp: <b>{property.business_type}</b></span>}
                  {property.restriction && <span>Hạn chế: <b>{property.restriction}</b></span>}
                </div>
              </div>
            )}
          </div>

          {/* Map */}
          {position && (
            <div className="bg-white rounded-lg overflow-hidden shadow-sm">
              <h3 className="font-semibold text-gray-800 p-4 pb-0">Vị trí trên bản đồ</h3>
              <div className="h-80 mt-2">
                <MapContainer center={position} zoom={15} style={{ height: '100%', width: '100%' }}>
                  <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Marker position={position} />
                </MapContainer>
              </div>
            </div>
          )}
        </div>

        {/* Right - Contact */}
        <div className="space-y-4">
          <div className="bg-white rounded-lg p-6 shadow-sm sticky top-24">
            <h3 className="font-semibold text-gray-800 mb-4">Thông tin liên hệ</h3>
            <div className="space-y-3">
              {property.contact_name && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center"><FiUser className="text-blue-600" /></div>
                  <div><p className="text-sm text-gray-500">Chủ</p><p className="font-medium">{property.contact_name}</p></div>
                </div>
              )}
              {property.contact_phone && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center"><FiPhone className="text-green-600" /></div>
                  <div><p className="text-sm text-gray-500">SĐT</p>
                    <a href={`tel:${property.contact_phone}`} className="font-medium text-green-600 hover:underline">{property.contact_phone}</a>
                  </div>
                </div>
              )}
              {property.manager_name && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center"><FiUser className="text-purple-600" /></div>
                  <div><p className="text-sm text-gray-500">Quản lý</p><p className="font-medium">{property.manager_name}</p></div>
                </div>
              )}
              {property.manager_phone && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center"><FiPhone className="text-purple-600" /></div>
                  <div><p className="text-sm text-gray-500">SĐT QL</p>
                    <a href={`tel:${property.manager_phone}`} className="font-medium text-purple-600 hover:underline">{property.manager_phone}</a>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 space-y-2">
              <a href={`tel:${property.contact_phone}`} className="block w-full text-center py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium">Gọi ngay</a>
              <a href={`https://zalo.me/${property.contact_phone}`} target="_blank" rel="noopener noreferrer"
                className="block w-full text-center py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium">Nhắn Zalo</a>
            </div>

            <div className="mt-4 text-xs text-gray-400 space-y-1">
              {property.source && <p>Nguồn: {property.source}</p>}
              <p>Ngày đăng: {new Date(property.created_at).toLocaleDateString('vi-VN')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
