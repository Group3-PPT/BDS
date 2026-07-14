import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiCheck, FiTrash2, FiUpload, FiImage, FiPlus, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { previewImport, confirmImport, uploadImages } from '../services/api';
import { compressImage } from '../utils/compressImage';
import axios from 'axios';

const SAMPLE = `68 Nguyễn Hữu Cảnh, QBT
Diện tích: 4 x 12m
Kết cấu: Trệt, 2 lầu
Giá: 40tr (Bao VAT)
HH: 1/2
Liên hệ: 0909063553 anh Phi (hình a.Hoàng Anh + a.Nghĩa)

50F1 Phú Mỹ, QBT
Diện tích: 4 x 7m. 55m²
Kết cấu: Trệt, lầu, 2P
Giá: 10tr
HH: 1/2 (2 năm)
Liên hệ: 0907229869 (hình a.Hoàng Anh + a.Nghĩa)`;

export default function ImportPage() {
  const navigate = useNavigate();
  const [text, setText] = useState('');
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);

  const handlePreview = async () => {
    if (!text.trim()) {
      toast.error('Vui lòng nhập dữ liệu');
      return;
    }
    setLoading(true);
    try {
      const { data } = await previewImport(text);
      const items = data.data.map(item => ({ ...item, imageFiles: [], imagePreviews: [] }));
      setPreview({ ...data, data: items });
      if (data.count === 0) {
        toast.error('Không tìm thấy bất động sản nào hợp lệ');
      }
    } catch (error) {
      toast.error('Lỗi phân tích dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!preview || preview.data.length === 0) return;
    setImporting(true);
    try {
      const itemsToSend = preview.data.map(({ imageFiles, imagePreviews, ...rest }) => rest);
      const { data } = await confirmImport(itemsToSend);
      const propertyIds = data.ids || [];

      for (let i = 0; i < preview.data.length; i++) {
        const item = preview.data[i];
        if (item.imageFiles && item.imageFiles.length > 0 && propertyIds[i]) {
          const urls = [];
          for (const f of item.imageFiles) {
            const compressed = await compressImage(f, 800, 0.6);
            const fd = new FormData();
            fd.append('image', compressed);
            try {
              const { data } = await axios.post(`https://api.imgbb.com/1/upload?key=${import.meta.env.VITE_IMGBB_KEY}`, fd);
              urls.push(data.data.url);
            } catch (e) {
              console.error('Upload to imgbb error:', e);
            }
          }
          if (urls.length > 0) {
            try {
              await uploadImages({ property_id: propertyIds[i], images: urls, is_thumbnail: 'true' });
            } catch (e) {
              console.error('Save images error:', e);
            }
          }
        }
      }

      toast.success(data.message);
      setText('');
      setPreview(null);
    } catch (error) {
      toast.error('Import thất bại');
    } finally {
      setImporting(false);
    }
  };

  const handleRemoveItem = (index) => {
    setPreview(p => ({
      ...p,
      data: p.data.filter((_, i) => i !== index),
      count: p.count - 1
    }));
  };

  const handleFileChange = (itemIdx, e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setPreview(p => {
      const items = [...p.data];
      items[itemIdx] = {
        ...items[itemIdx],
        imageFiles: [...(items[itemIdx].imageFiles || []), ...files],
        imagePreviews: [
          ...(items[itemIdx].imagePreviews || []),
          ...files.map(f => URL.createObjectURL(f))
        ]
      };
      return { ...p, data: items };
    });
    e.target.value = '';
  };

  const handleRemoveFile = (itemIdx, fileIdx) => {
    setPreview(p => {
      const items = [...p.data];
      const newFiles = items[itemIdx].imageFiles.filter((_, i) => i !== fileIdx);
      const newPreviews = items[itemIdx].imagePreviews.filter((_, i) => i !== fileIdx);
      items[itemIdx] = { ...items[itemIdx], imageFiles: newFiles, imagePreviews: newPreviews };
      return { ...p, data: items };
    });
  };

  const formatPrice = (price, currency) => {
    if (!price) return '---';
    if (currency === 'USD') return `$${Number(price).toLocaleString()}`;
    if (price >= 1e9) return `${(price / 1e9).toFixed(1)} tỷ`;
    if (price >= 1e6) return `${(price / 1e6).toFixed(0)} triệu`;
    return Number(price).toLocaleString() + ' đ';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <Link to="/admin" className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-4">
        <FiArrowLeft /> Quay lại
      </Link>

      <h1 className="text-2xl font-bold text-gray-800 mb-6">Nhập nhanh từ tin nhắn</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input */}
        <div>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Dán tin nhắn vào đây</h2>
              <button
                onClick={() => setText(SAMPLE)}
                className="text-sm text-blue-600 hover:underline"
              >
                Dùng mẫu
              </button>
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={20}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 font-mono text-sm resize-none"
              placeholder={`Ví dụ:\n68 Nguyễn Hữu Cảnh, QBT\nDiện tích: 4 x 12m\nKết cấu: Trệt, 2 lầu\nGiá: 40tr\nLiên hệ: 0909063553 anh Phi`}
            />
            <button
              onClick={handlePreview}
              disabled={loading}
              className="mt-4 w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <FiUpload />
              {loading ? 'Đang phân tích...' : 'Phân tích dữ liệu'}
            </button>
          </div>

          <div className="mt-4 bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
            <p className="font-medium mb-2">Định dạng hỗ trợ:</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Địa chỉ, <strong>viết tắt quận</strong> (QBT, Q1, QGV...)</li>
              <li>Diện tích: <code>4 x 12m</code> hoặc <code>55m²</code></li>
              <li>Giá: <code>40tr</code>, <code>1.5 tỷ</code>, <code>$1200</code></li>
              <li>Liên hệ: <code>0909063553 anh Phi</code></li>
            </ul>
          </div>
        </div>

        {/* Preview */}
        <div>
          {preview ? (
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">
                  Kết quả: {preview.count} BĐS
                </h2>
                {preview.count > 0 && (
                  <button
                    onClick={handleImport}
                    disabled={importing}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    <FiCheck />
                    {importing ? 'Đang lưu...' : 'Lưu vào database'}
                  </button>
                )}
              </div>

              {preview.data.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Không tìm thấy dữ liệu hợp lệ</p>
              ) : (
                <div className="space-y-4 max-h-[70vh] overflow-y-auto">
                  {preview.data.map((item, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-lg p-4 relative">
                      <button
                        onClick={() => handleRemoveItem(idx)}
                        className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500"
                      >
                        <FiTrash2 size={14} />
                      </button>

                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                          item.listing_type === 'sale' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                        }`}>
                          {item.listing_type === 'sale' ? 'Bán' : 'Thuê'}
                        </span>
                        <span className="px-2 py-0.5 text-xs font-medium rounded bg-blue-100 text-blue-700">
                          Đang cho thuê
                        </span>
                        <span className="font-semibold text-gray-800">{item.title}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
                        {item.area && <span>DT: {item.area} m²</span>}
                        {item.width && item.length && <span>Kích thước: {item.width} x {item.length}m</span>}
                        {item.structure && <span>KC: {item.structure}</span>}
                        <span className="font-medium text-blue-600">
                          Giá: {formatPrice(item.price, item.currency)}
                          {item.notes && <span className="text-xs text-gray-500 font-normal ml-1">({item.notes})</span>}
                        </span>
                        {item.contact_phone && <span>SĐT: {item.contact_phone}</span>}
                        {item.contact_name && <span>Tên: {item.contact_name}</span>}
                      </div>

                      {/* Upload ảnh */}
                      <div className="border-t border-gray-100 pt-3">
                        <div className="flex items-center gap-2 mb-2">
                          <FiImage size={14} className="text-gray-400" />
                          <span className="text-xs font-medium text-gray-500 uppercase">Ảnh</span>
                        </div>

                        {item.imagePreviews && item.imagePreviews.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-2">
                            {item.imagePreviews.map((preview, fileIdx) => (
                              <div key={fileIdx} className="relative group">
                                <img
                                  src={preview}
                                  alt=""
                                  className="w-20 h-16 object-cover rounded border border-gray-200"
                                />
                                <button
                                  onClick={() => handleRemoveFile(idx, fileIdx)}
                                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                                >
                                  <FiX size={10} />
                                </button>
                                {fileIdx === 0 && (
                                  <span className="absolute bottom-0 left-0 right-0 text-[9px] bg-blue-500 text-white text-center rounded-b">
                                    Chính
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        <label className="inline-flex items-center gap-2 px-3 py-1.5 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 text-sm text-gray-600">
                          <FiUpload size={14} />
                          Chọn ảnh
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={(e) => handleFileChange(idx, e)}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-lg p-6 shadow-sm flex flex-col items-center justify-center h-64 text-gray-400">
              <FiUpload size={48} className="mb-4" />
              <p>Nhập dữ liệu bên trái và nhấn "Phân tích"</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
