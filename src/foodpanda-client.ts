import type {
  Restaurant,
  RestaurantDetails,
  MenuCategory,
  Cart,
  OrderResult,
  AddToCartInput,
} from "./types.js";

const FOODPANDA_BASE_URL = "https://www.foodpanda.ph";

export class FoodpandaClient {
  private sessionToken: string;

  constructor(sessionToken: string) {
    this.sessionToken = sessionToken;
  }

  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${FOODPANDA_BASE_URL}${path}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Cookie: this.sessionToken,
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        ...options.headers,
      },
    });

    if (response.status === 401 || response.status === 403) {
      throw new Error(
        "Session token expired or invalid. Please refresh your token from the browser."
      );
    }

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(
        `Foodpanda API error (${response.status}): ${body.slice(0, 200)}`
      );
    }

    return response.json() as Promise<T>;
  }

  async searchRestaurants(
    query: string,
    _cuisine?: string,
    _limit?: number
  ): Promise<Restaurant[]> {
    // TODO: Reverse-engineer the search endpoint from foodpanda.ph
    throw new Error(
      "Not yet implemented — need to reverse-engineer foodpanda search API"
    );
  }

  async getRestaurantDetails(
    _restaurantId: string
  ): Promise<RestaurantDetails> {
    // TODO: Reverse-engineer the restaurant details endpoint
    throw new Error(
      "Not yet implemented — need to reverse-engineer foodpanda restaurant API"
    );
  }

  async getMenu(_restaurantId: string): Promise<MenuCategory[]> {
    // TODO: Reverse-engineer the menu endpoint
    throw new Error(
      "Not yet implemented — need to reverse-engineer foodpanda menu API"
    );
  }

  async addToCart(
    _restaurantId: string,
    _items: AddToCartInput[]
  ): Promise<Cart> {
    // TODO: Reverse-engineer the cart endpoint
    throw new Error(
      "Not yet implemented — need to reverse-engineer foodpanda cart API"
    );
  }

  async getCart(): Promise<Cart | null> {
    // TODO: Reverse-engineer the get cart endpoint
    throw new Error(
      "Not yet implemented — need to reverse-engineer foodpanda cart API"
    );
  }

  async removeFromCart(_cartItemId: string): Promise<Cart> {
    // TODO: Reverse-engineer the remove from cart endpoint
    throw new Error(
      "Not yet implemented — need to reverse-engineer foodpanda cart API"
    );
  }

  async placeOrder(
    _paymentMethod?: string,
    _specialInstructions?: string
  ): Promise<OrderResult> {
    // TODO: Reverse-engineer the place order endpoint
    throw new Error(
      "Not yet implemented — need to reverse-engineer foodpanda order API"
    );
  }
}
