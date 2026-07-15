import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FiArrowLeft, FiUpload, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { getPropertyById, createProperty, updateProperty, uploadImages, deleteImage, setThumbnail } from '../services/api';
import { compressImage } from '../utils/compressImage';
import axios from 'axios';

const DISTRICTS = [
  'Quận 1', 'Quận 2', 'Quận 3', 'Quận 4', 'Quận 5', 'Quận 6', 'Quận 7',
  'Quận 8', 'Quận 9', 'Quận 10', 'Quận 11', 'Quận 12',
  'Bình Thạnh', 'Gò Vấp', 'Phú Nhuận', 'Tân Bình', 'Tân Phú',
  'Bình Chánh', 'Hóc Môn', 'Củ Chi', 'Nhà Bè'
];

const PROPERTY_TYPES = ['Mặt bằng', 'Nhà phố', 'Văn phòng', 'Showroom', 'Kho xưởng', 'Sang nhượng'];
const BUSINESS_TYPES = ['Văn phòng', 'Showroom', 'Spa', 'Cafe', 'Nhà hàng'];
const SOURCES = ['Zalo', 'Facebook', 'Nhập tay'];
const STATUSES = [
  { value: 'available', label: 'Đang cho thuê' },
  { value: 'holding', label: 'Đang giữ' },
  { value: 'rented', label: 'Đã cho thuê' },
  { value: 'sold', label: 'Đã bán' },
  { value: 'hidden', label: 'Ẩn' },
];

const DEFAULT_FORM = {
  title: '', address: '', district: '', city: 'TP.HCM',
  width: '', length: '', area: '', usable_area: '',
  structure: '', floors: '', bedrooms: '', bathrooms: '',
  property_type: '', listing_type: 'rent',
  price: '', currency: 'VND', price_unit: 'month', price_display: '',
  deposit: '', commission: '',
  description: '', contact_name: '', contact_phone: '',
  manager_name: '', manager_phone: '',
  source: '', business_type: '', restriction: '',
  latitude: '', longitude: '', notes: '', status: 'available',
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
          const f = {};
          for (const key of Object.keys(DEFAULT_FORM)) {
            f[key] = data[key] ?? DEFAULT_FORM[key];
          }
          setForm(f);
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
    setForm(f => {
      const next = { ...f, [name]: value };
      if ((name === 'width' || name === 'length') && next.width && next.length) {
        next.area = (Number(next.width) * Number(next.length)).toString();
      }
      return next;
    });
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
        navigate('/admin');
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
      const uploadedUrls = [];
      for (const f of files) {
        const compressed = await compressImage(f, 800, 0.6);
        const fd = new FormData();
        fd.append('image', compressed);
        const { data } = await axios.post(`https://api.imgbb.com/1/upload?key=${import.meta.env.VITE_IMGBB_KEY}`, fd);
        uploadedUrls.push(data.data.url);
      }
      await uploadImages({ property_id: id, images: uploadedUrls, is_thumbnail: images.length === 0 ? 'true' : undefined });
      toast.success('Upload thành công');
      navigate('/admin');
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
      setImages(imgs => imgs.map(i => ({ ...i, is_thumbnail: i.id === imageId })));
      toast.success('Đã đặt làm ảnh đại diện');
    } catch (error) {
      toast.error('Thất bại');
    }
  };

  const Input = ({ label, name, type = 'text', step, placeholder, required }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}{required && ' *'}</label>
      <input type={type} name={name} value={form[name]} onChange={handleChange} step={step} placeholder={placeholder} required={required}
        className="w-full border border-gray-300 rounded-lg px-3 py-2" />
    </div>
  );

  const Select = ({ label, name, options }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <select name={name} value={form[name]} onChange={handleChange}
        className="w-full border border-gray-300 rounded-lg px-3 py-2">
        <option value="">Chọn...</option>
        {options.map(o => <option key={typeof o === 'string' ? o : o.value} value={typeof o === 'string' ? o : o.value}>{typeof o === 'string' ? o : o.label}</option>)}
      </select>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <Link to="/admin" className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-4">
        <FiArrowLeft /> Quay lại
      </Link>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        {isEdit ? 'Chỉnh sửa bất động sản' : 'Thêm bất động sản mới'}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Thông tin tin đăng */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Thông tin tin đăng</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Input label="Tiêu đề" name="title" required placeholder="VD: 42 Mê Linh, P19, QBT" />
            </div>
            <Input label="Địa chỉ" name="address" required placeholder="VD: 42 Mê Linh" />
            <Select label="Quận/Huyện" name="district" options={DISTRICTS} />
            <Input label="Thành phố" name="city" />
            <Select label="Loại hình" name="property_type" options={PROPERTY_TYPES} />
            <Select label="Hình thức" name="listing_type" options={[{ value: 'rent', label: 'Cho thuê' }, { value: 'sale', label: 'Bán' }, { value: 'transfer', label: 'Sang nhượng' }]} />
            <Select label="Nguồn" name="source" options={SOURCES} />
          </div>
        </div>

        {/* Diện tích & Kết cấu */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Diện tích & Kết cấu</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Input label="Ngang (m)" name="width" type="number" step="0.01" />
            <Input label="Dài (m)" name="length" type="number" step="0.01" />
            <Input label="DT đất (m²)" name="area" type="number" step="0.01" />
            <Input label="DT sử dụng (m²)" name="usable_area" type="number" step="0.01" />
            <Input label="Số tầng" name="floors" type="number" />
            <Input label="Số phòng" name="bedrooms" type="number" />
            <Input label="Số WC" name="bathrooms" type="number" />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kết cấu</label>
              <input type="text" name="structure" value={form.structure} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="VD: Trệt 1 Lầu" />
            </div>
          </div>
        </div>

        {/* Giá giao dịch */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Giá giao dịch</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input label="Giá" name="price" type="number" required />
            <Select label="Đơn vị tiền" name="currency" options={[{ value: 'VND', label: 'VND' }, { value: 'USD', label: 'USD' }]} />
            <Select label="Đơn vị tính" name="price_unit" options={[{ value: 'month', label: 'Tháng' }, { value: 'sqm', label: 'm²' }, { value: 'total', label: 'Tổng' }]} />
            <Input label="Giá hiển thị" name="price_display" placeholder="VD: 35tr" />
            <Input label="Tiền cọc" name="deposit" placeholder="VD: 2 tháng" />
            <Input label="Hoa hồng" name="commission" placeholder="VD: 1/2" />
          </div>
        </div>

        {/* Chủ nhà & Quản lý */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Thông tin chủ nhà</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Tên chủ" name="contact_name" placeholder="VD: A Quân" />
            <Input label="SĐT chủ" name="contact_phone" placeholder="VD: 0787441111" />
            <Input label="Người quản lý" name="manager_name" />
            <Input label="SĐT quản lý" name="manager_phone" />
          </div>
        </div>

        {/* Kinh doanh */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Thông tin kinh doanh</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select label="Phù hợp" name="business_type" options={BUSINESS_TYPES} />
            <Input label="Hạn chế" name="restriction" placeholder="VD: Không ăn uống" />
          </div>
        </div>

        {/* Description & Notes */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Mô tả & Ghi chú</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hoa hồng (mô tả)</label>
              <textarea name="description" value={form.description} onChange={handleChange} rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="VD: HH 1/2, điều kiện nhận..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú nội bộ</label>
              <textarea name="notes" value={form.notes} onChange={handleChange} rows={4}
                className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="VD: Chủ dễ làm việc, ưu tiên khách lâu dài..." />
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Vị trí</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Vĩ độ" name="latitude" type="number" step="any" placeholder="10.762622" />
            <Input label="Kinh độ" name="longitude" type="number" step="any" placeholder="106.660172" />
          </div>
        </div>

        {/* Status */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Trạng thái</h2>
          <Select label="Trạng thái" name="status" options={STATUSES} />
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
                      <button type="button" onClick={() => handleSetThumbnail(img.id)}
                        className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600">Ảnh chính</button>
                    )}
                    <button type="button" onClick={() => handleDeleteImage(img.id)}
                      className="p-1 bg-red-500 text-white rounded-full hover:bg-red-600"><FiX size={14} /></button>
                  </div>
                  {img.is_thumbnail && (
                    <span className="absolute top-2 left-2 px-2 py-0.5 bg-blue-500 text-white text-xs rounded">Ảnh chính</span>
                  )}
                </div>
              ))}
            </div>
            <label className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
              <FiUpload />{uploading ? 'Đang upload...' : 'Thêm ảnh'}
              <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
            </label>
          </div>
        )}

        {/* Submit */}
        <div className="flex gap-4">
          <button type="submit" disabled={saving}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {saving ? 'Đang lưu...' : isEdit ? 'Cập nhật' : 'Tạo mới'}
          </button>
          <Link to="/admin" className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50">Hủy</Link>
        </div>
      </form>
    </div>
  );
}
