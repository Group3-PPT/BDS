import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import db from './config/db.js';
import propertyRoutes from './routes/propertyRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import importRoutes from './routes/importRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));

app.use('/api/properties', propertyRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/import', importRoutes);

const initDB = async () => {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS properties (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      address TEXT NOT NULL,
      district TEXT,
      city TEXT DEFAULT 'TP.HCM',
      width REAL,
      length REAL,
      area REAL,
      usable_area REAL,
      structure TEXT,
      floors INTEGER,
      bedrooms INTEGER,
      bathrooms INTEGER,
      property_type TEXT,
      listing_type TEXT DEFAULT 'rent',
      price REAL NOT NULL,
      currency TEXT DEFAULT 'VND',
      price_unit TEXT DEFAULT 'month',
      price_display TEXT,
      deposit TEXT,
      commission TEXT,
      description TEXT,
      contact_name TEXT,
      contact_phone TEXT,
      manager_name TEXT,
      manager_phone TEXT,
      source TEXT,
      business_type TEXT,
      restriction TEXT,
      latitude REAL,
      longitude REAL,
      notes TEXT,
      status TEXT DEFAULT 'available',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS property_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      property_id INTEGER NOT NULL,
      image_url TEXT NOT NULL,
      is_thumbnail INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(property_id) REFERENCES properties(id) ON DELETE CASCADE
    )
  `);

  await db.execute('CREATE INDEX IF NOT EXISTS idx_properties_district ON properties(district)');
  await db.execute('CREATE INDEX IF NOT EXISTS idx_properties_listing_type ON properties(listing_type)');
  await db.execute('CREATE INDEX IF NOT EXISTS idx_properties_price ON properties(price)');
  await db.execute('CREATE INDEX IF NOT EXISTS idx_properties_area ON properties(area)');
  await db.execute('CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status)');
  await db.execute('CREATE INDEX IF NOT EXISTS idx_properties_property_type ON properties(property_type)');
  await db.execute('CREATE INDEX IF NOT EXISTS idx_property_images_property_id ON property_images(property_id)');

  const newCols = [
    "ALTER TABLE properties ADD COLUMN usable_area REAL",
    "ALTER TABLE properties ADD COLUMN floors INTEGER",
    "ALTER TABLE properties ADD COLUMN bedrooms INTEGER",
    "ALTER TABLE properties ADD COLUMN bathrooms INTEGER",
    "ALTER TABLE properties ADD COLUMN property_type TEXT",
    "ALTER TABLE properties ADD COLUMN price_unit TEXT DEFAULT 'month'",
    "ALTER TABLE properties ADD COLUMN price_display TEXT",
    "ALTER TABLE properties ADD COLUMN deposit TEXT",
    "ALTER TABLE properties ADD COLUMN commission TEXT",
    "ALTER TABLE properties ADD COLUMN manager_name TEXT",
    "ALTER TABLE properties ADD COLUMN manager_phone TEXT",
    "ALTER TABLE properties ADD COLUMN source TEXT",
    "ALTER TABLE properties ADD COLUMN business_type TEXT",
    "ALTER TABLE properties ADD COLUMN restriction TEXT",
    "ALTER TABLE properties ADD COLUMN title TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE properties ADD COLUMN description TEXT",
    "ALTER TABLE properties ADD COLUMN latitude REAL",
    "ALTER TABLE properties ADD COLUMN longitude REAL",
    "ALTER TABLE properties ADD COLUMN notes TEXT",
    "ALTER TABLE properties ADD COLUMN status TEXT DEFAULT 'available'",
    "ALTER TABLE properties ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP"
  ];
  for (const sql of newCols) {
    try { await db.execute(sql); } catch {}
  }

  console.log('Database initialized');
};

initDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });
