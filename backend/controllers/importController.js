import db from '../config/db.js';

const DISTRICT_MAP = {
  'QBT': 'Bình Thạnh',
  'Q1': 'Quận 1',
  'Q2': 'Quận 2',
  'Q3': 'Quận 3',
  'Q4': 'Quận 4',
  'Q5': 'Quận 5',
  'Q6': 'Quận 6',
  'Q7': 'Quận 7',
  'Q8': 'Quận 8',
  'Q9': 'Quận 9',
  'Q10': 'Quận 10',
  'Q11': 'Quận 11',
  'Q12': 'Quận 12',
  'QGV': 'Gò Vấp',
  'QPN': 'Phú Nhuận',
  'QTB': 'Tân Bình',
  'QTP': 'Tân Phú',
  'QBC': 'Bình Chánh',
  'QHM': 'Hóc Môn',
  'QCC': 'Củ Chi',
  'QNB': 'Nhà Bè',
  'QDB': 'District 2',
};

function parsePropertyText(text) {
  const blocks = text.trim().split(/\n\s*\n/);
  const results = [];

  for (const block of blocks) {
    const lines = block.trim().split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) continue;

    const property = {
      title: '',
      address: '',
      district: '',
      city: 'TP.HCM',
      width: null,
      length: null,
      area: null,
      structure: '',
      listing_type: 'rent',
      price: null,
      currency: 'VND',
      description: '',
      contact_name: '',
      contact_phone: '',
      notes: '',
    };

    for (const line of lines) {
      const lower = line.toLowerCase();

      if (lower.startsWith('diện tích:') || lower.startsWith('dt:')) {
        const val = line.split(':').slice(1).join(':').trim();
        const xyMatch = val.match(/([\d.,]+)\s*[xX×]\s*([\d.,]+)/);
        const areaMatch = val.match(/([\d.,]+)\s*m²/);
        if (xyMatch) {
          property.width = parseFloat(xyMatch[1].replace(',', '.'));
          property.length = parseFloat(xyMatch[2].replace(',', '.'));
          if (!areaMatch) {
            property.area = property.width * property.length;
          }
        }
        if (areaMatch) {
          property.area = parseFloat(areaMatch[1].replace(',', '.'));
        } else if (xyMatch && !property.area) {
          property.area = property.width * property.length;
        }
      } else if (lower.startsWith('kết cấu:') || lower.startsWith('kc:') || lower.startsWith('kt:')) {
        property.structure = line.split(':').slice(1).join(':').trim();
      } else if (lower.startsWith('giá:') || lower.startsWith('gia:')) {
        const priceStr = line.split(':').slice(1).join(':').trim();
        const noteMatch = priceStr.match(/\((.*?)\)/);
        let hhFromParen = false;
        if (noteMatch) {
          const noteContent = noteMatch[1].trim();
          if (/^hh|^hoa\s*hồng/i.test(noteContent)) {
            property.description = (property.description ? property.description + ' | ' : '') + noteContent;
            hhFromParen = true;
          } else {
            property.notes = noteContent;
          }
        }
        if (!hhFromParen) {
          const hhMatch = priceStr.match(/hh[:\s]*([\w\d\s]+)/i);
          if (hhMatch) {
            property.description = (property.description ? property.description + ' | ' : '') + hhMatch[0].trim();
          }
        }
        if (lower.includes('usd') || lower.includes('$')) {
          property.currency = 'USD';
          const numMatch = priceStr.match(/([\d.,]+)/);
          if (numMatch) property.price = parseFloat(numMatch[1].replace(/[,.,]/g, ''));
        } else {
          property.currency = 'VND';
          const numMatch = priceStr.match(/([\d.,]+)/);
          if (numMatch) {
            let num = parseFloat(numMatch[1].replace(/[,]/g, ''));
            if (lower.includes('tỷ') || lower.includes('ty')) {
              num *= 1000000000;
            } else if (lower.includes('tr') || lower.includes('triệu')) {
              num *= 1000000;
            }
            property.price = num;
          }
        }
      } else if (lower.startsWith('hh:') || lower.startsWith('hoa hồng:')) {
        const hhStr = line.split(':').slice(1).join(':').trim();
        property.description = (property.description ? property.description + ' | ' : '') + 'HH: ' + hhStr;
      } else if (lower.startsWith('cọc:') || lower.startsWith('coc:')) {
        const cocStr = line.split(':').slice(1).join(':').trim();
        property.notes = (property.notes ? property.notes + ' | ' : '') + 'Cọc: ' + cocStr;
      } else if (lower.startsWith('liên hệ:') || lower.startsWith('lh:') || lower.startsWith('lien he:')) {
        const contactStr = line.split(':').slice(1).join(':').trim();
        const phoneMatch = contactStr.match(/(0\d{9,10})/);
        if (phoneMatch) {
          property.contact_phone = phoneMatch[1];
        }
        const nameMatch = contactStr.match(/\d{10,11}\s+(.+)/);
        if (nameMatch) {
          let name = nameMatch[1].replace(/\(.*?\)/g, '').trim();
          name = name.replace(/^(anh|chị|a\.?|ac\.?)\s*/i, '').trim();
          property.contact_name = name || '';
        }
        const noteMatch = contactStr.match(/\((.*?)\)/);
        if (noteMatch) {
          property.description = noteMatch[1].trim();
        }
      } else if (!property.address) {
        let addr = line;
        let district = '';
        const abbrevMatch = addr.match(/[,]?\s*([A-Z]{2,4})\s*$/);
        if (abbrevMatch && DISTRICT_MAP[abbrevMatch[1]]) {
          const abbr = abbrevMatch[1];
          district = DISTRICT_MAP[abbr];
          addr = addr.replace(/[,]?\s*[A-Z]{2,4}\s*$/, '').trim();
        }
        const fullDistrictMatch = addr.match(/[,]?\s*(Quận\s+\S+|quận\s+\S+|Bình Thạnh|Gò Vấp|Phú Nhuận|Tân Bình|Tân Phú|Bình Chánh|Hóc Môn|Củ Chi|Nhà Bè)\s*$/i);
        if (fullDistrictMatch) {
          district = fullDistrictMatch[1];
          addr = addr.replace(/,\s*(Quận\s+\S+|quận\s+\S+|Bình Thạnh|Gò Vấp|Phú Nhuận|Tân Bình|Tân Phú|Bình Chánh|Hóc Môn|Củ Chi|Nhà Bè)\s*$/i, '').trim();
        }
        property.address = addr;
        property.district = district;
        property.title = addr + (district ? ', ' + district : '');
      }
    }

    if (property.address && property.price) {
      results.push(property);
    }
  }

  return results;
}

export const previewImport = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ message: 'Vui lòng nhập dữ liệu' });
    }
    const parsed = parsePropertyText(text);
    res.json({ data: parsed, count: parsed.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const confirmImport = async (req, res) => {
  try {
    const { items } = req.body;
    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Không có dữ liệu để import' });
    }

    let imported = 0;
    const ids = [];
    for (const item of items) {
      try {
        const result = await db.execute({
          sql: `INSERT INTO properties
            (title, address, district, city, width, length, area, structure,
             listing_type, price, currency, description, contact_name, contact_phone, notes, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [
            item.title, item.address, item.district, item.city || 'TP.HCM',
            item.width, item.length, item.area, item.structure || null,
            item.listing_type || 'rent', item.price, item.currency || 'VND',
            item.description || null, item.contact_name || null, item.contact_phone || null,
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
