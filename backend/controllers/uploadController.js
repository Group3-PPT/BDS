import db from '../config/db.js';

export const uploadImages = async (req, res) => {
  try {
    const { property_id, is_thumbnail } = req.body;

    if (!property_id) {
      return res.status(400).json({ message: 'property_id là bắt buộc' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'Vui lòng chọn file ảnh' });
    }

    const pid = Number(property_id);

    const existing = await db.execute({
      sql: 'SELECT COUNT(*) as count FROM property_images WHERE property_id = ?',
      args: [pid]
    });
    const isFirst = existing.rows[0].count === 0;

    const images = req.files.map((file, idx) => ({
      property_id: pid,
      image_url: `/uploads/${file.filename}`,
      is_thumbnail: (isFirst && idx === 0) || is_thumbnail === 'true' ? 1 : 0
    }));

    if (is_thumbnail === 'true') {
      await db.execute({
        sql: 'UPDATE property_images SET is_thumbnail = 0 WHERE property_id = ?',
        args: [pid]
      });
    }

    for (const img of images) {
      await db.execute({
        sql: 'INSERT INTO property_images (property_id, image_url, is_thumbnail) VALUES (?, ?, ?)',
        args: [img.property_id, img.image_url, img.is_thumbnail]
      });
    }

    res.status(201).json({ message: 'Upload thành công', count: images.length });
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
