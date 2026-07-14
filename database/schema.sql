-- Database: SQLite (Turso)
-- Bảng bất động sản
CREATE TABLE properties (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    address TEXT NOT NULL,
    district TEXT,
    city TEXT DEFAULT 'TP.HCM',
    width REAL,
    length REAL,
    area REAL,
    structure TEXT,
    listing_type TEXT CHECK(listing_type IN ('rent','sale')) DEFAULT 'rent',
    price REAL NOT NULL,
    currency TEXT CHECK(currency IN ('VND','USD')) DEFAULT 'VND',
    description TEXT,
    contact_name TEXT,
    contact_phone TEXT,
    latitude REAL,
    longitude REAL,
    notes TEXT,
    status TEXT CHECK(status IN ('available','rented','sold')) DEFAULT 'available',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Bảng hình ảnh
CREATE TABLE property_images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    property_id INTEGER NOT NULL,
    image_url TEXT NOT NULL,
    is_thumbnail INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(property_id) REFERENCES properties(id) ON DELETE CASCADE
);

-- Index
CREATE INDEX idx_properties_district ON properties(district);
CREATE INDEX idx_properties_listing_type ON properties(listing_type);
CREATE INDEX idx_properties_price ON properties(price);
CREATE INDEX idx_properties_area ON properties(area);
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_property_images_property_id ON property_images(property_id);
