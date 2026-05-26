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
  maxPax?: number;
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
  maxPax?: number;
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
  // Section background image slots
  WELCOME_BG: 10,
  CEREMONY_BG: 11,
  CELEBRATION_BG: 12,
  TEMPLATE5_GLOBAL_BG: 13,
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

export type TemplateConfigSection =
  | 'invitation'
  | 'ceremony'
  | 'rsvp'
  | 'wishes'
  | 'footer'
  | 'navigation'
  | 'general'
  | 'styling'
  | 'music'
  | 'scene';

export type TemplateConfigFieldType =
  | 'text'
  | 'richtext'
  | 'boolean'
  | 'select'
  | 'color'
  | 'image';

export interface TemplateConfigField {
  key: string;
  label: string;
  defaultValue: string;
  maxLength: number;
  /** @deprecated use fieldType instead */
  richText: boolean;
  fieldType: TemplateConfigFieldType;
  /** options list for fieldType === 'select' */
  options?: string[];
  adminOnly: boolean;
  section: TemplateConfigSection;
}

// ========== Itinerary Types ==========

export interface ItineraryItem {
  itineraryItemId: number;
  weddingId: number;
  label: string;
  detail: string;
  sortOrder: number;
}

export interface CreateItineraryItem {
  label: string;
  detail: string;
  sortOrder: number;
}

export interface UpdateItineraryItem {
  label: string;
  detail: string;
  sortOrder: number;
}

export interface ReorderItinerary {
  items: { itineraryItemId: number; sortOrder: number }[];
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