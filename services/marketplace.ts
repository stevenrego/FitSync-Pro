import { supabase } from './supabase';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  points_price?: number;
  category: 'supplement' | 'equipment' | 'apparel' | 'digital' | 'service';
  image_url?: string;
  in_stock: boolean;
  rating: number;
  rating_count: number;
  features?: string[];
  vendor?: string;
  created_at: string;
}

export interface Order {
  id: string;
  user_id: string;
  product_id: string;
  product?: Product;
  quantity: number;
  total_amount: number;
  points_used?: number;
  payment_method: 'card' | 'points' | 'hybrid';
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  shipping_address: any;
  tracking_number?: string;
  created_at: string;
  updated_at: string;
}

export interface Reward {
  id: string;
  name: string;
  description: string;
  points_required: number;
  reward_type: 'discount' | 'product' | 'service' | 'experience';
  value: number;
  image_url?: string;
  available_quantity?: number;
  expires_at?: string;
  created_at: string;
}

export interface UserReward {
  id: string;
  user_id: string;
  reward_id: string;
  reward?: Reward;
  redeemed_at: string;
  used_at?: string;
  expires_at?: string;
  status: 'active' | 'used' | 'expired';
}

export const marketplaceService = {
  // Get all products
  async getProducts(category?: string): Promise<Product[]> {
    try {
      let query = supabase
        .from('products')
        .select('*')
        .eq('in_stock', true)
        .order('rating', { ascending: false });

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Error loading products:', error);
      return [];
    }
  },

  // Get featured products
  async getFeaturedProducts(): Promise<Product[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('in_stock', true)
        .gte('rating', 4.0)
        .order('rating_count', { ascending: false })
        .limit(6);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error loading featured products:', error);
      return [];
    }
  },

  // Search products
  async searchProducts(query: string): Promise<Product[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
        .eq('in_stock', true)
        .order('rating', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching products:', error);
      return [];
    }
  },

  // Get product by ID
  async getProduct(productId: string): Promise<Product | null> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

      if (error) throw error;
      return data as Product;
    } catch (error) {
      console.error('Error loading product:', error);
      return null;
    }
  },

  // Create order
  async createOrder(
    productId: string,
    quantity: number,
    shippingAddress: any,
    paymentMethod: 'card' | 'points' | 'hybrid',
    pointsToUse?: number
  ): Promise<Order> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get product details
      const product = await this.getProduct(productId);
      if (!product) throw new Error('Product not found');

      const totalAmount = product.price * quantity;
      const pointsUsed = paymentMethod === 'points' ? totalAmount : (pointsToUse || 0);

      // Check if user has enough points
      if (pointsUsed > 0) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('points')
          .eq('id', user.id)
          .single();

        if (!profile || profile.points < pointsUsed) {
          throw new Error('Insufficient points');
        }
      }

      // Create order
      const { data, error } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          product_id: productId,
          quantity,
          total_amount: totalAmount,
          points_used: pointsUsed,
          payment_method: paymentMethod,
          status: 'pending',
          shipping_address: shippingAddress
        })
        .select(`
          *,
          product:products(*)
        `)
        .single();

      if (error) throw error;

      // Deduct points if used
      if (pointsUsed > 0) {
        await supabase
          .from('profiles')
          .update({ 
            points: supabase.sql`points - ${pointsUsed}`,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);
      }

      return data as Order;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  },

  // Get user orders
  async getUserOrders(): Promise<Order[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          product:products(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Order[];
    } catch (error) {
      console.error('Error loading user orders:', error);
      return [];
    }
  },

  // Update order status
  async updateOrderStatus(orderId: string, status: string, trackingNumber?: string): Promise<void> {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      if (trackingNumber) {
        updateData.tracking_number = trackingNumber;
      }

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  },

  // Get available rewards
  async getRewards(): Promise<Reward[]> {
    try {
      const { data, error } = await supabase
        .from('rewards')
        .select('*')
        .or('expires_at.is.null,expires_at.gt.now()')
        .or('available_quantity.is.null,available_quantity.gt.0')
        .order('points_required', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error loading rewards:', error);
      return [];
    }
  },

  // Redeem reward
  async redeemReward(rewardId: string): Promise<UserReward> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get reward details
      const { data: reward, error: rewardError } = await supabase
        .from('rewards')
        .select('*')
        .eq('id', rewardId)
        .single();

      if (rewardError || !reward) throw new Error('Reward not found');

      // Check if user has enough points
      const { data: profile } = await supabase
        .from('profiles')
        .select('points')
        .eq('id', user.id)
        .single();

      if (!profile || profile.points < reward.points_required) {
        throw new Error('Insufficient points');
      }

      // Check availability
      if (reward.available_quantity && reward.available_quantity <= 0) {
        throw new Error('Reward out of stock');
      }

      // Redeem reward
      const { data, error } = await supabase
        .from('user_rewards')
        .insert({
          user_id: user.id,
          reward_id: rewardId,
          redeemed_at: new Date().toISOString(),
          expires_at: reward.expires_at,
          status: 'active'
        })
        .select(`
          *,
          reward:rewards(*)
        `)
        .single();

      if (error) throw error;

      // Deduct points
      await supabase
        .from('profiles')
        .update({ 
          points: supabase.sql`points - ${reward.points_required}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      // Update reward quantity if applicable
      if (reward.available_quantity) {
        await supabase
          .from('rewards')
          .update({ 
            available_quantity: supabase.sql`available_quantity - 1` 
          })
          .eq('id', rewardId);
      }

      return data as UserReward;
    } catch (error) {
      console.error('Error redeeming reward:', error);
      throw error;
    }
  },

  // Get user rewards
  async getUserRewards(): Promise<UserReward[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('user_rewards')
        .select(`
          *,
          reward:rewards(*)
        `)
        .eq('user_id', user.id)
        .order('redeemed_at', { ascending: false });

      if (error) throw error;
      return data as UserReward[];
    } catch (error) {
      console.error('Error loading user rewards:', error);
      return [];
    }
  },

  // Use reward
  async useReward(userRewardId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_rewards')
        .update({
          used_at: new Date().toISOString(),
          status: 'used'
        })
        .eq('id', userRewardId);

      if (error) throw error;
    } catch (error) {
      console.error('Error using reward:', error);
      throw error;
    }
  },

  // Get product categories
  getProductCategories(): Array<{ id: string; name: string; icon: string }> {
    return [
      { id: 'supplement', name: 'Supplements', icon: 'local-pharmacy' },
      { id: 'equipment', name: 'Equipment', icon: 'fitness-center' },
      { id: 'apparel', name: 'Apparel', icon: 'checkroom' },
      { id: 'digital', name: 'Digital', icon: 'smartphone' },
      { id: 'service', name: 'Services', icon: 'room-service' }
    ];
  },

  // Calculate shipping cost
  calculateShipping(totalAmount: number, shippingAddress: any): number {
    // Mock shipping calculation
    if (totalAmount >= 50) return 0; // Free shipping over $50
    return 5.99; // Standard shipping
  },

  // Apply discount code
  async applyDiscountCode(code: string, totalAmount: number): Promise<{ valid: boolean; discount: number; message: string }> {
    try {
      const { data, error } = await supabase
        .from('discount_codes')
        .select('*')
        .eq('code', code.toLowerCase())
        .eq('active', true)
        .single();

      if (error || !data) {
        return { valid: false, discount: 0, message: 'Invalid discount code' };
      }

      // Check expiration
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        return { valid: false, discount: 0, message: 'Discount code has expired' };
      }

      // Check minimum amount
      if (data.minimum_amount && totalAmount < data.minimum_amount) {
        return { 
          valid: false, 
          discount: 0, 
          message: `Minimum order amount of $${data.minimum_amount} required` 
        };
      }

      // Calculate discount
      let discount = 0;
      if (data.discount_type === 'percentage') {
        discount = (totalAmount * data.discount_value) / 100;
        if (data.max_discount && discount > data.max_discount) {
          discount = data.max_discount;
        }
      } else {
        discount = Math.min(data.discount_value, totalAmount);
      }

      return {
        valid: true,
        discount: Math.round(discount * 100) / 100,
        message: `${data.discount_value}${data.discount_type === 'percentage' ? '%' : '$'} discount applied`
      };
    } catch (error) {
      console.error('Error applying discount code:', error);
      return { valid: false, discount: 0, message: 'Error validating discount code' };
    }
  }
};