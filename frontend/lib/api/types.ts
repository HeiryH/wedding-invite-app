// ========== Wedding Types ==========

export interface Wedding {
  weddingId: number;
  coupleName: string;
  brideName: string;
  groomName: string;
  weddingDate: string;
  venue: string;
  venueAddress: string;
  totalGuests: number;
  totalAttending: number;
  daysUntilWedding: number;
  totalPhotos: number;           // NEW
  enabledFeaturesCount: number;  // NEW
}

export interface CreateWedding {
  coupleName: string;
  brideName: string;
  groomName: string;
  weddingDate: string;
  venue: string;
  venueAddress: string;
}

// ========== Guest Types ==========

export interface Guest {
  guestId: number;
  weddingId: number;
  guestName: string;
  email: string;
  phoneNumber: string;
  brideOrGroomSide: 'Bride' | 'Groom';
  numberOfAttendees: number;
  songRequest: string;
  isAttending: boolean;
  respondedDate: string | null;
}

export interface CreateGuest {
  guestName: string;
  email: string;
  phoneNumber: string;
  brideOrGroomSide: 'Bride' | 'Groom';
  numberOfAttendees: number;
  songRequest: string;
  isAttending: boolean;
}

// ========== Wish Types ==========

export interface Wish {
  wishId: number;
  weddingId: number;
  guestName: string;
  message: string;
  createdDate: string;
}

export interface CreateWish {
  guestName: string;
  message: string;
}


// ========== Photo Types ==========

export interface Photo {
  photoId: number;
  weddingId: number;
  guestName: string;
  fileName: string;
  photoUrl: string;
  fileSize: number;
  caption: string;
  isApproved: boolean;
  isVisible: boolean;
  uploadedDate: string;
}

export interface CreatePhoto {
  guestName: string;
  caption: string;
}

// ========== Feature Types ==========

export interface Feature {
  featureId: number;
  featureCode: string;
  featureName: string;
  description: string;
  isPremium: boolean;
  isActive: boolean;
  sortOrder: number;
}

export interface WeddingFeature {
  weddingFeatureId: number;
  weddingId: number;
  featureId: number;
  featureCode: string;
  featureName: string;
  description: string;
  isEnabled: boolean;
  isPremium: boolean;
  configuration: string | null;
  enabledDate: string;
}

export interface WeddingWithFeatures {
  wedding: Wedding;
  features: WeddingFeature[];
}

export interface ToggleFeature {
  featureId: number;
  isEnabled: boolean;
  configuration?: string | null;
}

// ========== Wedding Admin View Types ==========


export interface WeddingAdminView extends Wedding {
  // We include extra data for the Super Admin to see at a glance
  userEmail: string;
  subscriptionTier: 'Free' | 'Silver' | 'Gold';
  isActive: boolean;
  registeredDate: string;
}

export interface Template {
  templateId: number;
  name: string;
  templateCode: string; // The key used by Next.js to load the UI
  thumbnailUrl: string;
  isPremium: boolean;
}

// ========== API Response Types ==========

export interface ApiError {
  message: string;
}