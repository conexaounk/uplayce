-- Criar tabela packs
CREATE TABLE IF NOT EXISTS packs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dj_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) DEFAULT 0,
  is_free BOOLEAN DEFAULT true,
  cover_url VARCHAR(500),
  size_gb DECIMAL(10, 2),
  genre VARCHAR(100),
  download_link VARCHAR(500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para packs
CREATE INDEX IF NOT EXISTS idx_packs_dj_id ON packs(dj_id);
CREATE INDEX IF NOT EXISTS idx_packs_created_at ON packs(created_at);

-- Criar tabela tracks
CREATE TABLE IF NOT EXISTS tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_id UUID NOT NULL REFERENCES packs(id) ON DELETE CASCADE,
  dj_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  duration INTEGER,
  bpm INTEGER,
  preview_url VARCHAR(500),
  file_url VARCHAR(500),
  r2_key VARCHAR(500),
  order_index INTEGER DEFAULT 0,
  genre VARCHAR(100),
  is_preview BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para tracks
CREATE INDEX IF NOT EXISTS idx_tracks_pack_id ON tracks(pack_id);
CREATE INDEX IF NOT EXISTS idx_tracks_dj_id ON tracks(dj_id);
CREATE INDEX IF NOT EXISTS idx_tracks_order_index ON tracks(pack_id, order_index);

-- Habilitar Row Level Security
ALTER TABLE packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracks ENABLE ROW LEVEL SECURITY;

-- Política para packs: usuários podem ler todos, apenas donos podem modificar
CREATE POLICY "packs_select" ON packs
  FOR SELECT USING (true);

CREATE POLICY "packs_insert" ON packs
  FOR INSERT WITH CHECK (dj_id = auth.uid());

CREATE POLICY "packs_update" ON packs
  FOR UPDATE USING (dj_id = auth.uid());

CREATE POLICY "packs_delete" ON packs
  FOR DELETE USING (dj_id = auth.uid());

-- Política para tracks: usuários podem ler todos, apenas donos podem modificar
CREATE POLICY "tracks_select" ON tracks
  FOR SELECT USING (true);

CREATE POLICY "tracks_insert" ON tracks
  FOR INSERT WITH CHECK (dj_id = auth.uid());

CREATE POLICY "tracks_update" ON tracks
  FOR UPDATE USING (dj_id = auth.uid());

CREATE POLICY "tracks_delete" ON tracks
  FOR DELETE USING (dj_id = auth.uid());
