export interface Track {
  id: string;
  name: string;
  duration: string;
  bpm: number;
  previewUrl?: string;
}

export interface Pack {
  id: string;
  name: string;
  price: number;
  tracks: Track[];
  sizeGB: number;
  coverEmoji: string;
  isFree: boolean;
}

export interface DJ {
  id: string;
  name: string;
  avatar: string;
  genre: string;
  bio: string;
  followers: number;
  packs: Pack[];
  freeDownloads: Pack[];
}

export interface CartItem {
  pack: Pack;
  djName: string;
  quantity: number;
}
