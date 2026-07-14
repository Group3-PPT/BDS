import db from '../config/db.js';

const DISTRICT_MAP = {
  'QBT': 'Bình Thạnh', 'Q1': 'Quận 1', 'Q2': 'Quận 2', 'Q3': 'Quận 3',
  'Q4': 'Quận 4', 'Q5': 'Quận 5', 'Q6': 'Quận 6', 'Q7': 'Quận 7',
  'Q8': 'Quận 8', 'Q9': 'Quận 9', 'Q10': 'Quận 10', 'Q11': 'Quận 11',
  'Q12': 'Quận 12', 'QGV': 'Gò Vấp', 'QPN': 'Phú Nhuận',
  'QTB': 'Tân Bình', 'QTP': 'Tân Phú', 'QBC': 'Bình Chánh',
  'QHM': 'Hóc Môn', 'QCC': 'Củ Chi', 'QNB': 'Nhà Bè',
};

function parsePropertyText(text) {
  const blocks = text.trim().split(/\n\s*\n/);
  const results = [];

  for (const block of blocks) {
    const lines = block.trim().split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) continue;

    const p = {
      title: '', address: '', district: '', city: 'TP.HCM',
      width: null, length: null, area: null, usable_area: null,
      structure: '', floors: null, bedrooms: null, bathrooms: null,
      property_type: '', listing_type: 'rent',
      price: null, currency: 'VND', price_unit: 'month', price_display: '',
      deposit: '', commission: '',
      description: '', contact_name: '', contact_phone: '',
      manager_name: '', manager_phone: '',
      source: '', business_type: '', restriction: '',
      notes: '',
    };

    for (const line of lines) {
      const lower = line.toLowerCase();

      if (lower.startsWith('diện tích:') || lower.startsWith('dt:')) {
        const val = line.split(':').slice(1).join(':').trim();
        const parenMatch = val.match(/\((.*?)\)/);
        if (parenMatch) {
          p.notes = (p.notes ? p.notes + ' | ' : '') + parenMatch[1].trim();
        }
        const xyMatch = val.match(/([\d.,]+)\s*[xX×]\s*([\d.,]+)/);
        const areaMatch = val.match(/([\d.,]+)\s*m²/);
        if (xyMatch) {
          p.width = parseFloat(xyMatch[1].replace(',', '.'));
          p.length = parseFloat(xyMatch[2].replace(',', '.'));
          if (!areaMatch) p.area = p.width * p.length;
        }
        if (areaMatch) {
          p.area = parseFloat(areaMatch[1].replace(',', '.'));
        } else if (xyMatch && !p.area) {
          p.area = p.width * p.length;
        }
      } else if (lower.startsWith('dt sd:') || lower.startsWith('diện tích sd:') || lower.startsWith('dt sử dụng:')) {
        const val = line.split(':').slice(1).join(':').trim();
        const m = val.match(/([\d.,]+)\s*m²?/);
        if (m) p.usable_area = parseFloat(m[1].replace(',', '.'));
      } else if (lower.startsWith('kết cấu:') || lower.startsWith('kc:') || lower.startsWith('kt:')) {
        const structStr = line.split(':').slice(1).join(':').trim();
        const structParen = structStr.match(/\((.*?)\)/);
        if (structParen) {
          p.notes = (p.notes ? p.notes + ' | ' : '') + structParen[1].trim();
        }
        p.structure = structStr;
        const floorsMatch = structStr.match(/(\d+)\s*(tầng|lầu|trệt)/i);
        if (floorsMatch) p.floors = parseInt(floorsMatch[1]);
        const bedMatch = structStr.match(/(\d+)\s*PN/i);
        if (bedMatch) p.bedrooms = parseInt(bedMatch[1]);
        const bathMatch = structStr.match(/(\d+)\s*WC/i);
        if (bathMatch) p.bathrooms = parseInt(bathMatch[1]);
      } else if (lower.startsWith('số tầng:') || lower.startsWith('st:')) {
        const val = line.split(':').slice(1).join(':').trim();
        const m = val.match(/(\d+)/);
        if (m) p.floors = parseInt(m[1]);
      } else if (lower.startsWith('số phòng:') || lower.startsWith('spn:')) {
        const val = line.split(':').slice(1).join(':').trim();
        const m = val.match(/(\d+)/);
        if (m) p.bedrooms = parseInt(m[1]);
      } else if (lower.startsWith('số wc:') || lower.startsWith('swc:')) {
        const val = line.split(':').slice(1).join(':').trim();
        const m = val.match(/(\d+)/);
        if (m) p.bathrooms = parseInt(m[1]);
      } else if (lower.startsWith('giá:') || lower.startsWith('gia:')) {
        const priceStr = line.split(':').slice(1).join(':').trim();
        const noteMatch = priceStr.match(/\((.*?)\)/);
        let hhFromParen = false;
        if (noteMatch) {
          const noteContent = noteMatch[1].trim();
          if (/^hh|^hoa\s*hồng/i.test(noteContent)) {
            p.commission = noteContent;
            hhFromParen = true;
          } else {
            p.notes = noteContent;
          }
        }
        if (!hhFromParen) {
          const hhMatch = priceStr.match(/hh[:\s]*([\w\d\s]+)/i);
          if (hhMatch) p.commission = (p.commission ? p.commission + ' | ' : '') + hhMatch[0].trim();
        }
        const cocMatch = priceStr.match(/c[oọ]c[:\s]*([\w\d\s]+)/i);
        if (cocMatch) p.deposit = (p.deposit ? p.deposit + ' | ' : '') + cocMatch[0].trim();
        const tlMatch = priceStr.match(/\b(TL)\b/i);
        if (tlMatch) p.notes = (p.notes ? p.notes + ' | ' : '') + 'TL';
        if (lower.includes('usd') || lower.includes('$')) {
          p.currency = 'USD';
          const numMatch = priceStr.match(/([\d.,]+)/);
          if (numMatch) p.price = parseFloat(numMatch[1].replace(/[,.,]/g, ''));
        } else {
          p.currency = 'VND';
          const numMatch = priceStr.match(/([\d.,]+)/);
          if (numMatch) {
            let num = parseFloat(numMatch[1].replace(/[,]/g, ''));
            if (lower.includes('tỷ') || lower.includes('ty')) num *= 1000000000;
            else if (lower.includes('tr') || lower.includes('triệu')) num *= 1000000;
            p.price = num;
          }
        }
        if (priceStr.match(/\/m²|\/m2|\/m\s/i)) p.price_unit = 'sqm';
        else if (priceStr.match(/tổng|tong/i)) p.price_unit = 'total';
      } else if (lower.startsWith('giá thuê:') || lower.startsWith('gia thue:')) {
        const val = line.split(':').slice(1).join(':').trim();
        const numMatch = val.match(/([\d.,]+)/);
        if (numMatch) {
          let num = parseFloat(numMatch[1].replace(/[,]/g, ''));
          if (val.toLowerCase().includes('tỷ') || val.toLowerCase().includes('ty')) num *= 1000000000;
          else if (val.toLowerCase().includes('tr') || val.toLowerCase().includes('triệu')) num *= 1000000;
          p.price = num;
        }
        if (val.match(/\/m²|\/m2/i)) p.price_unit = 'sqm';
      } else if (lower.startsWith('đơn vị:') || lower.startsWith('đv:') || lower.startsWith('dv:')) {
        const val = line.split(':').slice(1).join(':').trim().toLowerCase();
        if (val.includes('usd') || val.includes('$')) p.currency = 'USD';
        else p.currency = 'VND';
      } else if (lower.startsWith('đơn vị tính:') || lower.startsWith('dvt:')) {
        const val = line.split(':').slice(1).join(':').trim().toLowerCase();
        if (val.includes('m²') || val.includes('m2')) p.price_unit = 'sqm';
        else if (val.includes('tổng') || val.includes('tong')) p.price_unit = 'total';
        else p.price_unit = 'month';
      } else if (lower.startsWith('tiền cọc:') || lower.startsWith('cọc:') || lower.startsWith('coc:')) {
        const val = line.split(':').slice(1).join(':').trim();
        p.deposit = val;
      } else if (lower.startsWith('thanh toán:') || lower.startsWith('tt:')) {
        const val = line.split(':').slice(1).join(':').trim();
        p.notes = (p.notes ? p.notes + ' | ' : '') + 'Thanh toán: ' + val;
      } else if (lower.startsWith('vat:')) {
        const val = line.split(':').slice(1).join(':').trim();
        p.notes = (p.notes ? p.notes + ' | ' : '') + 'VAT: ' + val;
      } else if (lower.startsWith('hh:') || lower.startsWith('hoa hồng:')) {
        const val = line.split(':').slice(1).join(':').trim();
        p.commission = (p.commission ? p.commission + ' | ' : '') + val;
      } else if (lower.startsWith('điều kiện nhận:') || lower.startsWith('dk nhận:')) {
        const val = line.split(':').slice(1).join(':').trim();
        p.notes = (p.notes ? p.notes + ' | ' : '') + 'NHận HH: ' + val;
      } else if (lower.startsWith('thời hạn:') || lower.startsWith('thoi han:')) {
        const val = line.split(':').slice(1).join(':').trim();
        p.notes = (p.notes ? p.notes + ' | ' : '') + 'Thời hạn HH: ' + val;
      } else if (lower.startsWith('phí:') || lower.startsWith('phi:')) {
        const val = line.split(':').slice(1).join(':').trim();
        p.commission = (p.commission ? p.commission + ' | ' : '') + val;
      } else if (lower.startsWith('giá sang:') || lower.startsWith('gia sang:')) {
        const val = line.split(':').slice(1).join(':').trim();
        p.notes = (p.notes ? p.notes + ' | ' : '') + 'Giá sang: ' + val;
      } else if (lower.startsWith('chủ:') || lower.startsWith('chu:')) {
        const val = line.split(':').slice(1).join(':').trim();
        p.contact_name = val.replace(/^(anh|chị|a\.?|ac\.?)\s*/i, '').trim();
      } else if (lower.startsWith('sđt chủ:') || lower.startsWith('sdt chủ:') || lower.startsWith('sdt chu:')) {
        const val = line.split(':').slice(1).join(':').trim();
        const m = val.match(/(0\d{9,10})/);
        if (m) p.contact_phone = m[1];
      } else if (lower.startsWith('người quản lý:') || lower.startsWith('quản lý:') || lower.startsWith('ql:')) {
        const val = line.split(':').slice(1).join(':').trim();
        p.manager_name = val.replace(/^(anh|chị|a\.?|ac\.?)\s*/i, '').trim();
      } else if (lower.startsWith('sđt ql:') || lower.startsWith('sdt ql:') || lower.startsWith('sdt quản lý:')) {
        const val = line.split(':').slice(1).join(':').trim();
        const m = val.match(/(0\d{9,10})/);
        if (m) p.manager_phone = m[1];
      } else if (lower.startsWith('nhân viên:') || lower.startsWith('nv:') || lower.startsWith('nhan vien:')) {
        const val = line.split(':').slice(1).join(':').trim();
        p.notes = (p.notes ? p.notes + ' | ' : '') + 'NV đăng tin: ' + val;
      } else if (lower.startsWith('nguồn:') || lower.startsWith('nguon:')) {
        const val = line.split(':').slice(1).join(':').trim().toLowerCase();
        if (val.includes('zalo')) p.source = 'Zalo';
        else if (val.includes('facebook') || val.includes('fb')) p.source = 'Facebook';
        else p.source = 'Nhập tay';
      } else if (lower.startsWith('phù hợp:') || lower.startsWith('phu hop:')) {
        const val = line.split(':').slice(1).join(':').trim();
        p.business_type = val;
      } else if (lower.startsWith('hạn chế:') || lower.startsWith('han che:') || lower.startsWith('không:') || lower.startsWith('khong:')) {
        const val = line.split(':').slice(1).join(':').trim();
        p.restriction = val;
      } else if (lower.startsWith('ghi chú:') || lower.startsWith('gc:') || lower.startsWith('ghichu:')) {
        const val = line.split(':').slice(1).join(':').trim();
        p.notes = (p.notes ? p.notes + ' | ' : '') + val;
      } else if (lower.startsWith('liên hệ:') || lower.startsWith('lh:') || lower.startsWith('lien he:')) {
        const contactStr = line.split(':').slice(1).join(':').trim();
        const phones = [...contactStr.matchAll(/(0\d{9,10})/g)].map(m => m[1]);
        if (phones.length > 0) {
          p.contact_phone = p.contact_phone || phones[0];
          const afterFirst = contactStr.substring(contactStr.indexOf(phones[0]) + phones[0].length).trim();
          const nameMatch = afterFirst.match(/(.*?)\s*\(.*?\)|(.+)/);
          if (nameMatch) {
            let name = (nameMatch[1] || nameMatch[2] || '').replace(/\(.*?\)/g, '').trim();
            name = name.replace(/^(anh|chị|a\.?|ac\.?|chủ quán|quản lý|HTMG)\s*/i, '').trim();
            p.contact_name = p.contact_name || name || '';
          }
        }
        const noteMatch = contactStr.match(/\((.*?)\)/g);
        if (noteMatch) {
          const notes = noteMatch.map(n => n.replace(/[()]/g, '')).join(' | ');
          p.notes = (p.notes ? p.notes + ' | ' : '') + notes;
        }
        if (phones.length > 1) {
          const extra = contactStr.substring(contactStr.indexOf(phones[1]) + phones[1].length).trim();
          if (extra) p.notes = (p.notes ? p.notes + ' | ' : '') + extra;
        }
      } else if (/^0\d{9,10}/.test(line)) {
        const phoneMatch = line.match(/(0\d{9,10})/);
        if (phoneMatch && !p.contact_phone) p.contact_phone = phoneMatch[1];
        const afterPhone = line.substring(line.indexOf(phoneMatch[1]) + phoneMatch[1].length).trim();
        if (afterPhone) p.notes = (p.notes ? p.notes + ' | ' : '') + afterPhone;
      } else if (/^\(.*\)$/.test(line)) {
        p.notes = (p.notes ? p.notes + ' | ' : '') + line;
      } else if (!p.address) {
        let addr = line;
        let district = '';
        const abbrevMatch = addr.match(/[,]?\s*([A-Z]{2,4})\s*$/);
        if (abbrevMatch && DISTRICT_MAP[abbrevMatch[1]]) {
          district = DISTRICT_MAP[abbrevMatch[1]];
          addr = addr.replace(/[,]?\s*[A-Z]{2,4}\s*$/, '').trim();
        }
        const fullDistrictMatch = addr.match(/[,]?\s*(Quận\s+\S+|quận\s+\S+|Bình Thạnh|Gò Vấp|Phú Nhuận|Tân Bình|Tân Phú|Bình Chánh|Hóc Môn|Củ Chi|Nhà Bè)\s*$/i);
        if (fullDistrictMatch) {
          district = fullDistrictMatch[1];
          addr = addr.replace(/,\s*(Quận\s+\S+|quận\s+\S+|Bình Thạnh|Gò Vấp|Phú Nhuận|Tân Bình|Tân Phú|Bình Chánh|Hóc Môn|Củ Chi|Nhà Bè)\s*$/i, '').trim();
        }
        p.address = addr;
        p.district = district;
        p.title = addr + (district ? ', ' + district : '');
      }
    }

    if (p.address && p.price) {
      results.push(p);
    }
  }

  return results;
}

export const previewImport = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: 'Vui lòng nhập dữ liệu' });
    const parsed = parsePropertyText(text);
    res.json({ data: parsed, count: parsed.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const confirmImport = async (req, res) => {
  try {
    const { items } = req.body;
    if (!items || items.length === 0) return res.status(400).json({ message: 'Không có dữ liệu để import' });

    let imported = 0;
    const ids = [];
    for (const item of items) {
      try {
        const result = await db.execute({
          sql: `INSERT INTO properties
            (title, address, district, city, width, length, area, usable_area,
             structure, floors, bedrooms, bathrooms, property_type, listing_type,
             price, currency, price_unit, price_display, deposit, commission,
             description, contact_name, contact_phone, manager_name, manager_phone,
             source, business_type, restriction, notes, status)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
          args: [
            item.title, item.address, item.district, item.city || 'TP.HCM',
            item.width, item.length, item.area, item.usable_area || null,
            item.structure || null, item.floors || null, item.bedrooms || null, item.bathrooms || null,
            item.property_type || null, item.listing_type || 'rent',
            item.price, item.currency || 'VND', item.price_unit || 'month', item.price_display || null,
            item.deposit || null, item.commission || null,
            item.description || null, item.contact_name || null, item.contact_phone || null,
            item.manager_name || null, item.manager_phone || null,
            item.source || null, item.business_type || null, item.restriction || null,
            item.notes || null, item.status || 'available'
          ]
        });
        ids.push(Number(result.lastInsertRowid));
        imported++;
      } catch (err) {
        console.error('Import error:', err.message);
        ids.push(null);
      }
    }

    res.json({ message: `Đã import ${imported}/${items.length} bất động sản`, imported, ids });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
