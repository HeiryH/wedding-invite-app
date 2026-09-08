// ========== Event Types ==========
//
// EventDto (backend, camelCased on the wire): eventId, slug, eventType, name1, name2, eventTitle,
// displayName, eventDate, venue, venueAddress, isActive, isRsvpOpen, isPublic, totalGuests,
// totalAttending, daysUntilEvent, totalPhotos, enabledFeaturesCount, templateId, templateName,
// templateCode, maxPax, maxCapacity, showCapacityWarning, createdByUserId, createdByEmail, domain.
// This is the real API contract — used everywhere except the legacy `Wedding` shape below.

export interface Event {
  eventId: number;
  slug: string;
  eventType: string;
  name1: string | null;
  name2: string | null;
  eventTitle: string | null;
  displayName: string;
  eventDate: string;
  venue: string;
  venueAddress: string;
  totalGuests: number;
  totalAttending: number;
  daysUntilEvent: number;
  isActive: boolean;
  isPublic: boolean;
  totalPhotos: number;
  enabledFeaturesCount: number;
  templateId: number;
  templateName: string;
  templateCode?: string | null;
  maxPax?: number;
  maxCapacity?: number;
  showCapacityWarning?: boolean;
  isRsvpOpen?: boolean;
  createdByUserId?: number;
  createdByEmail?: string;
  domain?: string | null;
  ownerTier: 'BASIC' | 'PREMIUM' | 'PRO';
}

export interface CreateEvent {
  slug: string;
  eventType: string;
  name1: string;
  name2: string;
  eventTitle?: string;
  eventDate: string;
  venue: string;
  venueAddress: string;
  templateId?: number;
}

export interface UpdateEventDto {
  name1: string;
  name2: string;
  eventTitle?: string;
  eventDate: string;
  venue: string;
  venueAddress: string;
  maxPax?: number;
  maxCapacity?: number;
  showCapacityWarning?: boolean;
}

// ── Legacy `Wedding` view model ─────────────────────────────────────────────
// The 7 template components (components/templates/Template1.tsx … Template7-romangarden/) and
// their shared preview/adjust machinery (TemplateWrapper, _shared/types.ts, the customize page's
// PreviewPanel + standalone preview iframe, template-preview, try/page.tsx, personalise) are out
// of scope for this pass and still read `.brideName`/`.groomName`/`.coupleName`/`.weddingId`/
// `.weddingDate`/`.daysUntilWedding` directly off a `wedding` prop typed as `Wedding`. Rather than
// touch 15+ template-internal files, callers that fetch the new `Event` shape build a small
// `Wedding`-shaped adapter object (old field names) at the page boundary before handing data to a
// template — see app/[eventType]/[slug]/page.tsx and app/organizer-admin/customize/page.tsx.
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
  isPublic: boolean;
  totalPhotos: number;
  enabledFeaturesCount: number;
  templateId: number;
  templateName: string;
  /** Only set when the template is authored (data, not a React component) — see TemplateWrapper. */
  templateStagesJson?: string | null;
  maxPax?: number;
  maxCapacity?: number;
  showCapacityWarning?: boolean;
  isRsvpOpen?: boolean;
  createdByUserId?: number;
  createdByEmail?: string;
  domain?: string | null;
  // ── Native Event fields, carried alongside the legacy shape above ──────────
  // Templates 8 (PARTY) and 9 (CEREMONY) read these instead of brideName/groomName:
  // PARTY has one honoree (name1), CEREMONY has no individual names at all (eventTitle only).
  // Templates 1–7 ignore these; page.tsx populates them on the same adapter object rather than
  // branching, so one object serves both the legacy and native field-name callers.
  name1?: string | null;
  name2?: string | null;
  eventTitle?: string | null;
  eventType?: string;
  displayName?: string;
}

// ========== Guest Types ==========

export interface Guest {
  guestId: number;
  eventId: number;
  guestName: string;
  email: string;
  phoneNumber: string;
  guestSide?: 'PRIMARY' | 'SECONDARY' | null;
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
  guestSide?: 'PRIMARY' | 'SECONDARY' | null;
  numberOfAttendees: number;
  songRequest: string;
  isAttending: boolean;
  tableId?: number | null;
}

// ========== Wish Types ==========

export interface Wish {
  wishId: number;
  eventId: number;
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
  eventId: number;
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
  // Adjust-panel layer images — non-upserting, so a stage can hold many.
  LAYER_IMAGE: 20,
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

export interface FeatureWithUsage extends Feature {
  weddingCount: number;
}

export interface UpdateFeature {
  featureName: string;
  description: string;
  isPremium: boolean;
  isActive: boolean;
  sortOrder: number;
}

export interface EventFeature {
  eventFeatureId: number;
  eventId: number;
  featureId: number;
  featureCode: string;
  featureName: string;
  description: string;
  isEnabled: boolean;
  isPremium: boolean;
  configuration: string | null;
  enabledDate: string;
}

export interface EventWithFeatures {
  event: Event;
  features: EventFeature[];
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
  tier: 'BASIC' | 'PREMIUM' | 'PRO';
  sortOrder: number;
  isAuthored: boolean;
  /** Only meaningful when isAuthored — the Record<StageId,StageDef> JSON the authoring editor
   *  reads back in. Null for every hand-coded template. */
  stagesJson?: string | null;
  eventTypes: string;
}

export interface TemplateWithUsage extends Template {
  weddingCount: number;
}

export interface UpdateTemplate {
  templateName: string;
  description: string;
  tier: 'BASIC' | 'PREMIUM' | 'PRO';
  isActive: boolean;
  sortOrder: number;
  eventTypes: string;
}

// Creates a brand-new authored template (data, not code) on a blank canvas.
// templateCode is optional — a blank value is slugified from templateName server-side.
export interface CreateTemplate {
  templateName: string;
  templateCode: string;
  description: string;
  tier: 'BASIC' | 'PREMIUM' | 'PRO';
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
  | 'scene'
  | 'photobooth';

export type TemplateConfigFieldType =
  | 'text'
  | 'richtext'
  | 'boolean'
  | 'select'
  | 'color'
  | 'image'
  /** Opens the stage-layer Adjust panel rather than rendering an input. */
  | 'layout'
  /** A stored key with no inspector control — driven by some other UI (e.g. the section rail). */
  | 'hidden';

/** Rail blocks in the customize inspector. */
export type TemplateConfigBlock =
  | 'details'
  | 'welcome'
  | 'walimah'
  | 'rsvp'
  | 'itinerary'
  | 'wishes'
  | 'photobooth'
  | 'music';

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

  // ── Presentation hints for the schema-driven inspector ──────────────────────
  /** Which rail block renders this field. Defaults to SECTION_BLOCK[section]. */
  block?: TemplateConfigBlock;
  /** Group() heading this field sits under. */
  group?: string;
  /** chipAnchor for the group's quick-nav chip. */
  chip?: string;
  /** Sub-label shown under the field name. */
  hint?: string;
  /** Named colour-swatch palette (see PRESETS in the customize page). */
  presets?: string;
  /**
   * Renders this field inside another field's card rather than standalone —
   * e.g. `names.bride.color` attaches to the Bride's Name card.
   */
  attachTo?: string;
  /** Friendlier labels for select options, keyed by option value. */
  optionLabels?: Record<string, string>;
  /**
   * Templates that actually read this key. Omitted ⇒ every template.
   * Without this, a shared field renders a control that does nothing on templates
   * whose markup never looks the key up.
   */
  templateIds?: number[];
  /**
   * Minimum user tier to see/edit this field. Omitted ⇒ BASIC (everyone). The stage-layout
   * launcher is PRO. Enforced client-side by getConfigFields and server-side by
   * TemplateConfigPolicy — keep the two in step.
   */
  minTier?: 'BASIC' | 'PREMIUM' | 'PRO';
  /**
   * Overrides whether the field appears in the guest self-serve Personalise page
   * (getGuestFields). Omitted ⇒ the default content heuristic decides. Set `true`
   * to force-include a field the heuristic skips, `false` to hide one it would keep.
   */
  guestEssential?: boolean;
}

// ========== Landing CMS Types ==========

export interface LandingSectionDto {
  id: number;
  sectionKey: string;
  title: string;
  sortOrder: number;
  isVisible: boolean;
}

export interface LandingItemDto {
  id: number;
  sectionKey: string;
  sortOrder: number;
  isActive: boolean;
  title: string;
  body: string;
  imageUrl: string;
  meta: string;
  price: string;
  features: string;
  cta: string;
  ctaHref: string;
  highlighted: boolean;
}

export interface LandingDto {
  content: Record<string, string>;
  sections: LandingSectionDto[];
  items: LandingItemDto[];
}

// ========== Itinerary Types ==========

export interface ItineraryItem {
  itineraryItemId: number;
  eventId: number;
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
  eventId: number;
  tableName: string;
  capacity: number;
  sortOrder: number;
  guestCount: number;
  guests: TableGuest[];
}

export interface CreateSeatingTable {
  eventId: number;
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