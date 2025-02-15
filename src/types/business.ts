
export type BusinessStatus = 'pending' | 'verified' | 'rejected';

export interface Business {
  id: string;
  name: string;
  description?: string;
  address: string;
  latitude: number;
  longitude: number;
  phone?: string;
  website?: string;
  email?: string;
  status: BusinessStatus;
  created_at: string;
  updated_at: string;
}

export interface BusinessReview {
  id: string;
  business_id: string;
  user_id: string;
  rating: number;
  comment?: string;
  created_at: string;
  updated_at: string;
}

export interface SpecialOffer {
  id: string;
  business_id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
}
