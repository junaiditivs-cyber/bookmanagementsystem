export interface Publisher {
  id: string;
  publisher_number: string;
  publisher_name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  credit_days: number;
  status: 'active' | 'inactive';
  notes?: string;
  created_at: string;
}

export interface Location {
  id: string;
  code: string;
  name: string;
  type: 'warehouse' | 'shop' | 'school';
  city?: string;
  address?: string;
  contact_person?: string;
  phone?: string;
  status: 'active' | 'inactive';
}

export interface Category {
  id: string;
  name: string;
  status: 'active' | 'inactive';
}

export interface Subject {
  id: string;
  name: string;
  status: 'active' | 'inactive';
}

export interface ClassEntity {
  id: string;
  name: string;
  status: 'active' | 'inactive';
}

export interface Book {
  id: string;
  book_number: string;
  title: string;
  barcode?: string;
  ISBN?: string;
  publisher_id: string;
  category_id: string;
  subject_id: string;
  class_id: string;
  purchase_cost: number;
  sale_price: number;
  reorder_level: number;
  cover_image?: string;
  status: 'active' | 'inactive';
  notes?: string;
  created_at: string;
}

export interface StockEntry {
  id: string;
  entry_number: string;
  date: string;
  book_id: string;
  location_id: string;
  quantity: number;
  unit_cost: number;
  reference_number?: string;
  notes?: string;
  created_at: string;
}

export interface StockBalance {
  id: string;
  book_id: string;
  location_id: string;
  quantity: number;
}

export interface StockHistory {
  id: string;
  date: string;
  book_id: string;
  location_id: string;
  movement_type:
    | 'Opening Stock'
    | 'Add Stock'
    | 'Sale'
    | 'Customer Return'
    | 'Return to Publisher'
    | 'Transfer Out'
    | 'Transfer In'
    | 'Damage'
    | 'Loss'
    | 'Correction';
  quantity_in: number;
  quantity_out: number;
  balance_after: number;
  reference_number?: string;
  notes?: string;
  created_at: string;
}

export interface Sale {
  id: string;
  sale_number: string;
  date: string;
  location_id: string;
  customer_name?: string;
  payment_method: 'Cash' | 'Bank' | 'Credit';
  notes?: string;
  created_at: string;
  total_amount: number;
  discount: number;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  book_id: string;
  quantity: number;
  unit_price: number;
  discount: number;
  line_total: number;
}

export interface CustomerReturn {
  id: string;
  return_number: string;
  date: string;
  customer_name?: string;
  original_sale_number?: string;
  book_id: string;
  location_id: string;
  quantity: number;
  reason: string;
  notes?: string;
  created_at: string;
}

export interface PublisherReturn {
  id: string;
  return_number: string;
  date: string;
  publisher_id: string;
  book_id: string;
  location_id: string;
  quantity: number;
  reason: string;
  notes?: string;
  created_at: string;
}

export interface StockTransfer {
  id: string;
  transfer_number: string;
  date: string;
  from_location_id: string;
  to_location_id: string;
  book_id: string;
  quantity: number;
  notes?: string;
  created_at: string;
}

export interface DamageLossRecord {
  id: string;
  date: string;
  book_id: string;
  location_id: string;
  quantity: number;
  reason: 'Damage' | 'Loss' | 'Free Sample' | 'Other';
  notes?: string;
  created_at: string;
}

export interface LiveLog {
  id: string;
  timestamp: string;
  user: string;
  module: string;
  action: string;
  record_number: string;
  description: string;
  severity: 'info' | 'warning' | 'error';
}

export interface DatabaseSchema {
  publishers: Publisher[];
  locations: Location[];
  categories: Category[];
  subjects: Subject[];
  classes: ClassEntity[];
  books: Book[];
  stock_entries: StockEntry[];
  stock_balances: StockBalance[];
  stock_history: StockHistory[];
  sales: Sale[];
  sale_items: SaleItem[];
  customer_returns: CustomerReturn[];
  publisher_returns: PublisherReturn[];
  stock_transfers: StockTransfer[];
  damage_loss_records: DamageLossRecord[];
  live_logs: LiveLog[];
}
