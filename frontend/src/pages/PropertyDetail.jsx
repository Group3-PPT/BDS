import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiMapPin, FiPhone, FiUser, FiArrowLeft, FiHome, FiMaximize } from 'react-icons/fi';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import { getPropertyById } from '../services/api';

const formatPrice = (price, currency) => {
  if (currency === 'USD') return `$${Number(price).toLocaleString()}`;
  return Number(price).toLocaleString('vi-VN') + ' đ';
};

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
  const position = property.latitude && property.longitude
    ? [property.latitude, property.longitude]
    : null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <Link to="/" className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-4">
        <FiArrowLeft /> Quay lại
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left - Images & Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Image Gallery */}
          <div className="bg-white rounded-lg overflow-hidden shadow-sm">
            <div className="aspect-video bg-gray-200">
              {images.length > 0 ? (
                <img
                  src={images[selectedImage]?.image_url}
                  alt={property.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <FiHome size={64} />
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 p-3 overflow-x-auto">
                {images.map((img, idx) => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImage(idx)}
                    className={`flex-shrink-0 w-20 h-16 rounded overflow-hidden border-2 ${
                      selectedImage === idx ? 'border-blue-500' : 'border-transparent'
                    }`}
                  >
                    <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">{property.title}</h1>

            <div className="flex items-center gap-2 text-gray-500 mb-6">
              <FiMapPin />
              <span>{property.address}, {property.district}, {property.city}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <p className="text-sm text-gray-500">Loại</p>
                <p className="font-semibold text-blue-600">
                  {property.listing_type === 'sale' ? 'Bán' : 'Cho thuê'}
                </p>
              </div>
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <p className="text-sm text-gray-500">Trạng thái</p>
                <p className={`font-semibold ${
                  property.status === 'rented' ? 'text-orange-600' :
                  property.status === 'sold' ? 'text-gray-600' :
                  'text-blue-600'
                }`}>
                  {property.status === 'rented' ? 'Đã cho thuê' :
                   property.status === 'sold' ? 'Đã bán' : 'Đang cho thuê'}
                </p>
              </div>
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <p className="text-sm text-gray-500">Giá</p>
                <p className="font-semibold text-blue-600">
                  {formatPrice(property.price, property.currency)}
                  {property.notes && <span className="block text-xs text-gray-500 font-normal">{property.notes}</span>}
                </p>
              </div>
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <p className="text-sm text-gray-500">Diện tích</p>
                <p className="font-semibold text-blue-600">{property.area} m²</p>
              </div>
              {property.structure && (
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <p className="text-sm text-gray-500">Kết cấu</p>
                  <p className="font-semibold text-blue-600">{property.structure}</p>
                </div>
              )}
            </div>

            {property.width && property.length && (
              <p className="text-sm text-gray-600 mb-2">
                Kích thước: {property.width}m × {property.length}m
              </p>
            )}

            {property.description && (
              <div className="mt-4">
                <h3 className="font-semibold text-gray-800 mb-2">Mô tả</h3>
                <p className="text-gray-600 whitespace-pre-line">{property.description}</p>
              </div>
            )}
          </div>

          {/* Map */}
          {position && (
            <div className="bg-white rounded-lg overflow-hidden shadow-sm">
              <h3 className="font-semibold text-gray-800 p-4 pb-0">Vị trí trên bản đồ</h3>
              <div className="h-80 mt-2">
                <MapContainer center={position} zoom={15} style={{ height: '100%', width: '100%' }}>
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
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
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <FiUser className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Tên</p>
                    <p className="font-medium">{property.contact_name}</p>
                  </div>
                </div>
              )}
              {property.contact_phone && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <FiPhone className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Điện thoại</p>
                    <a
                      href={`tel:${property.contact_phone}`}
                      className="font-medium text-green-600 hover:underline"
                    >
                      {property.contact_phone}
                    </a>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 space-y-2">
              <a
                href={`tel:${property.contact_phone}`}
                className="block w-full text-center py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
              >
                Gọi ngay
              </a>
              <a
                href={`https://zalo.me/${property.contact_phone}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium"
              >
                Nhắn Zalo
              </a>
            </div>

            <div className="mt-4 text-sm text-gray-500">
              <p>Ngày đăng: {new Date(property.created_at).toLocaleDateString('vi-VN')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
