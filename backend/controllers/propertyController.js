import db from '../config/db.js';

export const getProperties = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      district,
      listing_type,
      status,
      min_price,
      max_price,
      min_area,
      max_area,
      search,
      sort = 'created_at',
      order = 'DESC'
    } = req.query;

    let where = [];
    let params = [];

    if (district) {
      where.push('district = ?');
      params.push(district);
    }
    if (listing_type) {
      where.push('listing_type = ?');
      params.push(listing_type);
    }
    if (status) {
      where.push('status = ?');
      params.push(status);
    }
    if (min_price) {
      where.push('price >= ?');
      params.push(Number(min_price));
    }
    if (max_price) {
      where.push('price <= ?');
      params.push(Number(max_price));
    }
    if (min_area) {
      where.push('area >= ?');
      params.push(Number(min_area));
    }
    if (max_area) {
      where.push('area <= ?');
      params.push(Number(max_area));
    }
    if (search) {
      where.push('(title LIKE ? OR address LIKE ? OR description LIKE ?)');
      const s = `%${search}%`;
      params.push(s, s, s);
    }

    const whereClause = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';

    const allowedSort = ['created_at', 'price', 'area'];
    const sortField = allowedSort.includes(sort) ? sort : 'created_at';
    const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const offset = (Number(page) - 1) * Number(limit);

    const countResult = await db.execute({
      sql: `SELECT COUNT(*) as total FROM properties ${whereClause}`,
      args: params
    });
    const total = countResult.rows[0].total;

    const rowsResult = await db.execute({
      sql: `SELECT
        p.id, p.title, p.address, p.district, p.city, p.width, p.length, p.area, p.structure,
        p.listing_type, p.price, p.currency, p.description, p.contact_name, p.contact_phone,
        p.latitude, p.longitude, p.notes, p.status, p.created_at, p.updated_at,
        COALESCE(
          (SELECT image_url FROM property_images WHERE property_id = p.id AND is_thumbnail = 1 LIMIT 1),
          (SELECT image_url FROM property_images WHERE property_id = p.id LIMIT 1)
        ) as thumbnail
       FROM properties p
       ${whereClause}
       ORDER BY p.${sortField} ${sortOrder}
       LIMIT ? OFFSET ?`,
      args: [...params, Number(limit), offset]
    });

    res.json({
      data: rowsResult.rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getPropertyById = async (req, res) => {
  try {
    const rowResult = await db.execute({
      sql: 'SELECT * FROM properties WHERE id = ?',
      args: [req.params.id]
    });

    if (rowResult.rows.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy bất động sản' });
    }

    const imagesResult = await db.execute({
      sql: 'SELECT * FROM property_images WHERE property_id = ? ORDER BY is_thumbnail DESC',
      args: [req.params.id]
    });

    res.json({ ...rowResult.rows[0], images: imagesResult.rows });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createProperty = async (req, res) => {
  try {
    const {
      title, address, district, city,
      width, length, area, structure,
      listing_type, price, currency,
      description, contact_name, contact_phone,
      latitude, longitude, notes, status
    } = req.body;

    const result = await db.execute({
      sql: `INSERT INTO properties
        (title, address, district, city, width, length, area, structure,
         listing_type, price, currency, description, contact_name, contact_phone,
         latitude, longitude, notes, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [title, address, district, city || 'TP.HCM',
       width || null, length || null, area || null, structure || null,
       listing_type || 'rent', price, currency || 'VND',
       description || null, contact_name || null, contact_phone || null,
       latitude || null, longitude || null, notes || null, status || 'available']
    });

    res.status(201).json({ id: Number(result.lastInsertRowid), message: 'Tạo thành công' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateProperty = async (req, res) => {
  try {
    const {
      title, address, district, city,
      width, length, area, structure,
      listing_type, price, currency,
      description, contact_name, contact_phone,
      latitude, longitude, notes, status
    } = req.body;

    const result = await db.execute({
      sql: `UPDATE properties SET
        title=?, address=?, district=?, city=?,
        width=?, length=?, area=?, structure=?,
        listing_type=?, price=?, currency=?,
        description=?, contact_name=?, contact_phone=?,
        latitude=?, longitude=?, notes=?, status=?
       WHERE id=?`,
      args: [title, address, district, city,
       width || null, length || null, area || null, structure || null,
       listing_type, price, currency,
       description || null, contact_name || null, contact_phone || null,
       latitude || null, longitude || null, notes || null, status || 'available', req.params.id]
    });

    if (result.rowsAffected === 0) {
      return res.status(404).json({ message: 'Không tìm thấy bất động sản' });
    }

    res.json({ message: 'Cập nhật thành công' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteProperty = async (req, res) => {
  try {
    const result = await db.execute({
      sql: 'DELETE FROM properties WHERE id = ?',
      args: [req.params.id]
    });

    if (result.rowsAffected === 0) {
      return res.status(404).json({ message: 'Không tìm thấy bất động sản' });
    }
    res.json({ message: 'Xóa thành công' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const result = await db.execute({
      sql: 'UPDATE properties SET status = ? WHERE id = ?',
      args: [status, req.params.id]
    });
    if (result.rowsAffected === 0) {
      return res.status(404).json({ message: 'Không tìm thấy' });
    }
    res.json({ message: 'Cập nhật thành công' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getDistricts = async (req, res) => {
  try {
    const result = await db.execute(
      'SELECT DISTINCT district FROM properties WHERE district IS NOT NULL ORDER BY district'
    );
    res.json(result.rows.map(r => r.district));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const exportExcel = async (req, res) => {
  try {
    const result = await db.execute('SELECT * FROM properties ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
