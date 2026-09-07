-- 1. Tabel Profil & Setting
CREATE TABLE profile_settings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text,
  username text,
  bio text,
  profile_image_url text,
  footer_text text,
  updated_at timestamp with time zone DEFAULT now()
);

-- 2. Tabel Links (Tombol)
CREATE TABLE links (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  subtitle text,
  url text NOT NULL,
  icon_name text,
  is_highlight boolean DEFAULT false,
  order_index integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- 3. Tabel Embeds (Media Sosial)
CREATE TABLE embeds (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  platform text NOT NULL, -- 'youtube', 'tiktok', 'instagram'
  embed_url text NOT NULL,
  order_index integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- 4. Tabel Gallery
CREATE TABLE gallery (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  image_url text NOT NULL,
  caption text,
  order_index integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

-- Insert data dummy awal (Default Profile)
INSERT INTO profile_settings (name, username, bio, footer_text) 
VALUES ('Baim', '@baimdaily', 'Owner @warunkarsi.bekasi | Praktisi Bisnis Kuliner UMKM. Membantu owner warung melek angka & rapi operasional.', 'Powered by Warunk Arsi.');
