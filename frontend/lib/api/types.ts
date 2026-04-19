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
  isActive: boolean;
  totalPhotos: number;           // NEW
  enabledFeaturesCount: number;  // NEW
  templateId: number;
  templateName: string;
  packageId?: number;
  packageName?: string;
}

export interface CreateWedding {
  coupleName: string;
  brideName: string;
  groomName: string;
  weddingDate: string;
  venue: string;
  venueAddress: string;
  templateId?: number;
  packageId?: number;
}

export interface UpdateWeddingDto {
  brideName: string;
  groomName: string;
  weddingDate: string;
  venue: string;
  venueAddress: string;
  templateId?: number;
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
  tableId?: number | null;
  tableName?: string | null;
}

export interface CreateGuest {
  guestName: string;
  email: string;
  phoneNumber: string;
  brideOrGroomSide: 'Bride' | 'Groom';
  numberOfAttendees: number;
  songRequest: string;
  isAttending: boolean;
  tableId?: number | null;
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
  guestName?: string;
  photoUrl: string;
  caption?: string;
  fileSize: number;
  contentType: string;
  uploadedBy: string;
  templateSlot?: number;
  isApproved: boolean;
  isVisible: boolean;
  isFeatured: boolean;
  rejectionReason?: string;
  approvedDate?: string;
  createdDate: string;
}

export const PhotoUploaderRole = {
  GUEST: 'GUEST',
  COUPLE: 'COUPLE',
} as const;

export const TemplateSlots = {
  GROOM_PORTRAIT: 1,
  BRIDE_PORTRAIT: 2,
  EXTRA_1: 3,
  EXTRA_2: 4,
  EXTRA_3: 5,
} as const;

export interface ApprovePhotoRequest {
  isApproved: boolean;
  rejectionReason?: string;
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
  featureCode: string;
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

// ========== Template Types (NEW) ==========

export interface Template {
  templateId: number;
  templateName: string;
  templateCode: string;
  description: string;
  thumbnailUrl: string;
  primaryColor: string;
  secondaryColor: string;
  componentPath: string;
  isActive: boolean;
  isPremium: boolean;
  sortOrder: number;
}

// ========== Package Types ==========

export interface Package {
  packageId: number;
  packageName: string;
  packageCode: string;
  description: string;
  price: number;
  isActive: boolean;
  sortOrder: number;
  features: Feature[];
}

export interface CreatePackage {
  packageName: string;
  packageCode: string;
  description: string;
  price: number;
  sortOrder: number;
  featureIds: number[];
}

export interface UpdatePackage {
  packageName: string;
  description: string;
  price: number;
  isActive: boolean;
  sortOrder: number;
  featureIds: number[];
}

// ========== Template Config Types ==========

export interface TemplateConfigField {
  key: string;
  label: string;
  defaultValue: string;
  maxLength: number;
  richText: boolean;
  adminOnly: boolean;
  section: 'invitation' | 'rsvp' | 'wishes' | 'footer' | 'navigation';
}

// ========== Seating Table Types ==========

export interface TableGuest {
  guestId: number;
  guestName: string;
  numberOfAttendees: number;
}

export interface SeatingTable {
  tableId: number;
  weddingId: number;
  tableName: string;
  capacity: number;
  sortOrder: number;
  guestCount: number;
  guests: TableGuest[];
}

export interface CreateSeatingTable {
  weddingId: number;
  tableName: string;
  capacity: number;
  sortOrder: number;
}

export interface UpdateSeatingTable {
  tableName: string;
  capacity: number;
  sortOrder: number;
}

// ========== API Response Types ==========

export interface ApiError {
  message: string;
}