export interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  rating: number;
  delivery_fee: number;
  delivery_time: string;
  minimum_order: number;
  is_open: boolean;
}

export interface RestaurantDetails extends Restaurant {
  address: string;
  opening_hours: string;
  description: string;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  variations: Variation[];
  toppings: Topping[];
}

export interface Variation {
  id: string;
  name: string;
  price: number;
}

export interface Topping {
  id: string;
  name: string;
  price: number;
}

export interface MenuCategory {
  name: string;
  items: MenuItem[];
}

export interface CartItem {
  cart_item_id: string;
  item_id: string;
  name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  variation?: string;
  toppings: string[];
}

export interface Cart {
  restaurant_id: string;
  restaurant_name: string;
  items: CartItem[];
  subtotal: number;
  delivery_fee: number;
  total: number;
}

export interface OrderResult {
  order_id: string;
  status: string;
  estimated_delivery_time: string;
  total: number;
}

export interface AddToCartInput {
  item_id: string;
  quantity: number;
  variation_id?: string;
  topping_ids?: string[];
}
