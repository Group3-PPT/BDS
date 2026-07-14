import db from '../config/db.js';

const ALL_COLS = [
  'p.id', 'p.title', 'p.address', 'p.district', 'p.city',
  'p.width', 'p.length', 'p.area', 'p.usable_area',
  'p.structure', 'p.floors', 'p.bedrooms', 'p.bathrooms',
  'p.property_type', 'p.listing_type', 'p.price', 'p.currency',
  'p.price_unit', 'p.price_display', 'p.deposit', 'p.commission',
  'p.description', 'p.contact_name', 'p.contact_phone',
  'p.manager_name', 'p.manager_phone', 'p.source',
  'p.business_type', 'p.restriction',
  'p.latitude', 'p.longitude', 'p.notes', 'p.status',
  'p.created_at', 'p.updated_at'
].join(', ');

export const getProperties = async (req, res) => {
  try {
    const {
      page = 1, limit = 20,
      district, listing_type, status, property_type,
      min_price, max_price, min_area, max_area,
      search, sort = 'created_at', order = 'DESC'
    } = req.query;

    let where = [];
    let params = [];

    if (district) { where.push('p.district = ?'); params.push(district); }
    if (listing_type) { where.push('p.listing_type = ?'); params.push(listing_type); }
    if (status) { where.push('p.status = ?'); params.push(status); }
    if (property_type) { where.push('p.property_type = ?'); params.push(property_type); }
    if (min_price) { where.push('p.price >= ?'); params.push(Number(min_price)); }
    if (max_price) { where.push('p.price <= ?'); params.push(Number(max_price)); }
    if (min_area) { where.push('p.area >= ?'); params.push(Number(min_area)); }
    if (max_area) { where.push('p.area <= ?'); params.push(Number(max_area)); }
    if (search) {
      where.push('(p.title LIKE ? OR p.address LIKE ? OR p.description LIKE ? OR p.notes LIKE ?)');
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }

    const whereClause = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';
    const allowedSort = ['created_at', 'price', 'area'];
    const sortField = allowedSort.includes(sort) ? `p.${sort}` : 'p.created_at';
    const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    const offset = (Number(page) - 1) * Number(limit);

    const countResult = await db.execute({
      sql: `SELECT COUNT(*) as total FROM properties p ${whereClause}`,
      args: params
    });
    const total = countResult.rows[0].total;

    const rowsResult = await db.execute({
      sql: `SELECT ${ALL_COLS},
        COALESCE(
          (SELECT image_url FROM property_images WHERE property_id = p.id AND is_thumbnail = 1 LIMIT 1),
          (SELECT image_url FROM property_images WHERE property_id = p.id LIMIT 1)
        ) as thumbnail
       FROM properties p
       ${whereClause}
       ORDER BY ${sortField} ${sortOrder}
       LIMIT ? OFFSET ?`,
      args: [...params, Number(limit), offset]
    });

    res.json({
      data: rowsResult.rows,
      pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getPropertyById = async (req, res) => {
  try {
    const rowResult = await db.execute({
      sql: `SELECT * FROM properties WHERE id = ?`,
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
    const b = req.body;
    const result = await db.execute({
      sql: `INSERT INTO properties
        (title, address, district, city, width, length, area, usable_area,
         structure, floors, bedrooms, bathrooms, property_type, listing_type,
         price, currency, price_unit, price_display, deposit, commission,
         description, contact_name, contact_phone, manager_name, manager_phone,
         source, business_type, restriction, latitude, longitude, notes, status)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      args: [
        b.title, b.address, b.district, b.city || 'TP.HCM',
        b.width || null, b.length || null, b.area || null, b.usable_area || null,
        b.structure || null, b.floors || null, b.bedrooms || null, b.bathrooms || null,
        b.property_type || null, b.listing_type || 'rent',
        b.price, b.currency || 'VND', b.price_unit || 'month', b.price_display || null,
        b.deposit || null, b.commission || null,
        b.description || null, b.contact_name || null, b.contact_phone || null,
        b.manager_name || null, b.manager_phone || null,
        b.source || null, b.business_type || null, b.restriction || null,
        b.latitude || null, b.longitude || null, b.notes || null, b.status || 'available'
      ]
    });
    res.status(201).json({ id: Number(result.lastInsertRowid), message: 'Tạo thành công' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateProperty = async (req, res) => {
  try {
    const b = req.body;
    const result = await db.execute({
      sql: `UPDATE properties SET
        title=?, address=?, district=?, city=?,
        width=?, length=?, area=?, usable_area=?,
        structure=?, floors=?, bedrooms=?, bathrooms=?,
        property_type=?, listing_type=?,
        price=?, currency=?, price_unit=?, price_display=?,
        deposit=?, commission=?,
        description=?, contact_name=?, contact_phone=?,
        manager_name=?, manager_phone=?,
        source=?, business_type=?, restriction=?,
        latitude=?, longitude=?, notes=?, status=?,
        updated_at=CURRENT_TIMESTAMP
       WHERE id=?`,
      args: [
        b.title, b.address, b.district, b.city || 'TP.HCM',
        b.width || null, b.length || null, b.area || null, b.usable_area || null,
        b.structure || null, b.floors || null, b.bedrooms || null, b.bathrooms || null,
        b.property_type || null, b.listing_type || 'rent',
        b.price, b.currency || 'VND', b.price_unit || 'month', b.price_display || null,
        b.deposit || null, b.commission || null,
        b.description || null, b.contact_name || null, b.contact_phone || null,
        b.manager_name || null, b.manager_phone || null,
        b.source || null, b.business_type || null, b.restriction || null,
        b.latitude || null, b.longitude || null, b.notes || null, b.status || 'available',
        req.params.id
      ]
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
      sql: 'UPDATE properties SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
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
