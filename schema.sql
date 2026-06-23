-- Create the listings table
CREATE TABLE IF NOT EXISTS listings (
    id INTEGER PRIMARY KEY, -- Unique ID from the JSON data
    title TEXT NOT NULL,
    featured BOOLEAN DEFAULT false,
    type TEXT,
    building TEXT NOT NULL,
    file_name TEXT NOT NULL,
    location JSONB,
    about JSONB,
    details JSONB,
    amenities JSONB DEFAULT '[]'::jsonb,
    pricing JSONB,
    house_rules JSONB,
    host JSONB,
    seo JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS) optionally
-- ALTER TABLE listings ENABLE ROW LEVEL SECURITY;

-- If using anon key and you want anyone to read and write without policy restrictions (or you can restrict it as you see fit)
-- CREATE POLICY "Allow public read" ON listings FOR SELECT USING (true);
-- CREATE POLICY "Allow public insert/update/delete" ON listings FOR ALL USING (true);

-- Trigger function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE TRIGGER update_listings_updated_at
    BEFORE UPDATE ON listings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
