import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FiArrowLeft, FiUpload, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { getPropertyById, createProperty, updateProperty, uploadImages, deleteImage, setThumbnail } from '../services/api';

const DISTRICTS = [
  'Quận 1', 'Quận 2', 'Quận 3', 'Quận 4', 'Quận 5', 'Quận 6', 'Quận 7',
  'Quận 8', 'Quận 9', 'Quận 10', 'Quận 11', 'Quận 12',
  'Bình Thạnh', 'Gò Vấp', 'Phú Nhuận', 'Tân Bình', 'Tân Phú',
  'Bình Chánh', 'Hóc Môn', 'Củ Chi', 'Nhà Bè'
];

const DEFAULT_FORM = {
  title: '',
  address: '',
  district: '',
  city: 'TP.HCM',
  width: '',
  length: '',
  area: '',
  structure: '',
  listing_type: 'rent',
  price: '',
  currency: 'VND',
  notes: '',
  status: 'available',
  description: '',
  contact_name: '',
  contact_phone: '',
  latitude: '',
  longitude: ''
};

export default function PropertyForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEdit) {
      const fetchData = async () => {
        try {
          const { data } = await getPropertyById(id);
          setForm({
            title: data.title || '',
            address: data.address || '',
            district: data.district || '',
            city: data.city || 'TP.HCM',
            width: data.width || '',
            length: data.length || '',
            area: data.area || '',
            structure: data.structure || '',
            listing_type: data.listing_type || 'rent',
            price: data.price || '',
            currency: data.currency || 'VND',
            notes: data.notes || '',
            status: data.status || 'available',
            description: data.description || '',
            contact_name: data.contact_name || '',
            contact_phone: data.contact_phone || '',
            latitude: data.latitude || '',
            longitude: data.longitude || ''
          });
          setImages(data.images || []);
        } catch (error) {
          toast.error('Lỗi khi tải dữ liệu');
          navigate('/admin');
        }
      };
      fetchData();
    }
  }, [id, isEdit, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.address || !form.price) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    setSaving(true);
    try {
      if (isEdit) {
        await updateProperty(id, form);
        toast.success('Cập nhật thành công');
      } else {
        const { data } = await createProperty(form);
        toast.success('Tạo thành công');
        navigate(`/admin/edit/${data.id}`);
        return;
      }
    } catch (error) {
      toast.error('Thao tác thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    try {
      const formData = new FormData();
      files.forEach(f => formData.append('images', f));
      formData.append('property_id', id);
      if (images.length === 0) {
        formData.append('is_thumbnail', 'true');
      }
      await uploadImages(formData);
      toast.success('Upload thành công');
      navigate('/');
    } catch (error) {
      toast.error('Upload thất bại');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDeleteImage = async (imageId) => {
    if (!confirm('Xóa ảnh này?')) return;
    try {
      await deleteImage(imageId);
      setImages(imgs => imgs.filter(i => i.id !== imageId));
      toast.success('Đã xóa ảnh');
    } catch (error) {
      toast.error('Xóa ảnh thất bại');
    }
  };

  const handleSetThumbnail = async (imageId) => {
    try {
      await setThumbnail({ image_id: imageId, property_id: id });
      setImages(imgs => imgs.map(i => ({
        ...i,
        is_thumbnail: i.id === imageId
      })));
      toast.success('Đã đặt làm ảnh đại diện');
    } catch (error) {
      toast.error('Thất bại');
    }
  };

  const calculateArea = () => {
    if (form.width && form.length) {
      const area = Number(form.width) * Number(form.length);
      setForm(f => ({ ...f, area: area.toString() }));
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <Link to="/admin" className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-4">
        <FiArrowLeft /> Quay lại
      </Link>

      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        {isEdit ? 'Chỉnh sửa bất động sản' : 'Thêm bất động sản mới'}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Thông tin cơ bản</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề *</label>
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="VD: Nhà phố Lê Văn Sỹ"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ *</label>
              <input
                type="text"
                name="address"
                value={form.address}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="VD: 123 Lê Văn Sỹ"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quận</label>
              <select
                name="district"
                value={form.district}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="">Chọn quận</option>
                {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Thành phố</label>
              <input
                type="text"
                name="city"
                value={form.city}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
          </div>
        </div>

        {/* Size & Structure */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Kích thước & Kết cấu</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rộng (m)</label>
              <input
                type="number"
                name="width"
                value={form.width}
                onChange={(e) => { handleChange(e); setTimeout(calculateArea, 0); }}
                step="0.01"
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dài (m)</label>
              <input
                type="number"
                name="length"
                value={form.length}
                onChange={(e) => { handleChange(e); setTimeout(calculateArea, 0); }}
                step="0.01"
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Diện tích (m²)</label>
              <input
                type="number"
                name="area"
                value={form.area}
                onChange={handleChange}
                step="0.01"
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kết cấu</label>
              <input
                type="text"
                name="structure"
                value={form.structure}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="VD: 1 trệt 2 lầu"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Loại *</label>
              <select
                name="listing_type"
                value={form.listing_type}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="rent">Cho thuê</option>
                <option value="sale">Bán</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="available">Đang cho thuê</option>
                <option value="rented">Đã cho thuê</option>
                <option value="sold">Đã bán</option>
              </select>
            </div>
          </div>
        </div>

        {/* Price */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Giá</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Giá *</label>
              <input
                type="number"
                name="price"
                value={form.price}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Đơn vị</label>
              <select
                name="currency"
                value={form.currency}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="VND">VND</option>
                <option value="USD">USD</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú giá</label>
              <input
                type="text"
                name="notes"
                value={form.notes}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="VD: Bao VAT, chưa bao gồm phí..."
              />
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Liên hệ</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tên liên hệ</label>
              <input
                type="text"
                name="contact_name"
                value={form.contact_name}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
              <input
                type="text"
                name="contact_phone"
                value={form.contact_phone}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Vị trí (tùy chọn)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vĩ độ (Latitude)</label>
              <input
                type="number"
                name="latitude"
                value={form.latitude}
                onChange={handleChange}
                step="any"
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="VD: 10.762622"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kinh độ (Longitude)</label>
              <input
                type="number"
                name="longitude"
                value={form.longitude}
                onChange={handleChange}
                step="any"
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="VD: 106.660172"
              />
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Mô tả</h2>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={5}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
            placeholder="Mô tả chi tiết về bất động sản..."
          />
        </div>

        {/* Images */}
        {isEdit && (
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Hình ảnh</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-4">
              {images.map(img => (
                <div key={img.id} className="relative group">
                  <img src={img.image_url} alt="" className="w-full aspect-square object-cover rounded-lg" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition rounded-lg flex items-center justify-center gap-2">
                    {!img.is_thumbnail && (
                      <button
                        type="button"
                        onClick={() => handleSetThumbnail(img.id)}
                        className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                      >
                        Ảnh chính
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteImage(img.id)}
                      className="p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      <FiX size={14} />
                    </button>
                  </div>
                  {img.is_thumbnail && (
                    <span className="absolute top-2 left-2 px-2 py-0.5 bg-blue-500 text-white text-xs rounded">
                      Ảnh chính
                    </span>
                  )}
                </div>
              ))}
            </div>
            <label className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
              <FiUpload />
              {uploading ? 'Đang upload...' : 'Thêm ảnh'}
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                disabled={uploading}
              />
            </label>
          </div>
        )}

        {/* Submit */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Đang lưu...' : isEdit ? 'Cập nhật' : 'Tạo mới'}
          </button>
          <Link
            to="/admin"
            className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Hủy
          </Link>
        </div>
      </form>
    </div>
  );
}
