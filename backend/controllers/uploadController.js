import db from '../config/db.js';

export const uploadImages = async (req, res) => {
  try {
    const { property_id, is_thumbnail, images } = req.body;

    if (!property_id) {
      return res.status(400).json({ message: 'property_id là bắt buộc' });
    }

    if (!images || images.length === 0) {
      return res.status(400).json({ message: 'Vui lòng chọn file ảnh' });
    }

    const pid = Number(property_id);

    const existing = await db.execute({
      sql: 'SELECT COUNT(*) as count FROM property_images WHERE property_id = ?',
      args: [pid]
    });
    const isFirst = existing.rows[0].count === 0;

    if (is_thumbnail === 'true') {
      await db.execute({
        sql: 'UPDATE property_images SET is_thumbnail = 0 WHERE property_id = ?',
        args: [pid]
      });
    }

    const imageUrls = Array.isArray(images) ? images : [images];
    for (let idx = 0; idx < imageUrls.length; idx++) {
      const thumb = (isFirst && idx === 0) || (is_thumbnail === 'true' && idx === 0) ? 1 : 0;
      await db.execute({
        sql: 'INSERT INTO property_images (property_id, image_url, is_thumbnail) VALUES (?, ?, ?)',
        args: [pid, imageUrls[idx], thumb]
      });
    }

    res.status(201).json({ message: 'Upload thành công', count: imageUrls.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteImage = async (req, res) => {
  try {
    const result = await db.execute({
      sql: 'DELETE FROM property_images WHERE id = ?',
      args: [req.params.id]
    });

    if (result.rowsAffected === 0) {
      return res.status(404).json({ message: 'Không tìm thấy ảnh' });
    }
    res.json({ message: 'Xóa ảnh thành công' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const setThumbnail = async (req, res) => {
  try {
    const { image_id, property_id } = req.body;

    await db.execute({
      sql: 'UPDATE property_images SET is_thumbnail = 0 WHERE property_id = ?',
      args: [property_id]
    });

    await db.execute({
      sql: 'UPDATE property_images SET is_thumbnail = 1 WHERE id = ?',
      args: [image_id]
    });

    res.json({ message: 'Đặt ảnh đại diện thành công' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
