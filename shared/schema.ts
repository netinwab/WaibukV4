import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, json, integer, boolean, date, PgTableWithColumns } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  userType: text("user_type").notNull(), // 'student', 'viewer', 'school', 'super_admin'
  firstName: text("first_name").notNull(),
  middleName: text("middle_name"), // Optional
  lastName: text("last_name").notNull(),
  fullName: text("full_name").notNull(), // Computed from firstName + middleName + lastName
  dateOfBirth: date("date_of_birth").notNull(),
  email: text("email"),
  phoneNumber: text("phone_number"), // Format: (country code)(number)
  showPhoneToAlumni: boolean("show_phone_to_alumni").default(true), // Privacy setting for phone visibility
  preferredCurrency: text("preferred_currency").default("USD"), // User's preferred currency: USD or NGN
  profileImage: text("profile_image"),
  schoolId: varchar("school_id").references(() => schools.id), // For school admin users
  createdAt: timestamp("created_at").defaultNow(),
});

export const schools = pgTable("schools", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  address: text("address"),
  country: text("country").notNull(),
  state: text("state"),
  city: text("city").notNull(),
  email: text("email").notNull(),
  phoneNumber: text("phone_number").notNull(), // School phone number
  website: text("website"), // School website (optional)
  yearFounded: integer("year_founded").notNull(),
  schoolCode: varchar("school_code", { length: 10 }).notNull().unique(),
  registrationNumber: text("registration_number"), // School registration/license number
  accreditationDocument: text("accreditation_document"), // Path to uploaded accreditation document
  approvalStatus: text("approval_status").notNull().default("pending"), // 'pending', 'approved', 'rejected'
  activationCode: varchar("activation_code", { length: 12 }), // Alphanumeric code for approved schools
  approvedBy: varchar("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  rejectionReason: text("rejection_reason"),
  tempAdminCredentials: json("temp_admin_credentials"), // Temporary storage for admin credentials until approval
  // Paystack revenue sharing fields
  paystackSubaccountCode: text("paystack_subaccount_code"), // Paystack subaccount code for revenue sharing
  bankAccountNumber: text("bank_account_number"), // School's bank account number
  bankCode: text("bank_code"), // Bank code for the school's account
  subaccountStatus: text("subaccount_status").default("pending"), // 'pending', 'active', 'failed'
  revenueSharePercentage: integer("revenue_share_percentage").default(80), // School's share percentage (default 80%)
  createdAt: timestamp("created_at").defaultNow(),
});

export const students = pgTable("students", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  schoolId: varchar("school_id").references(() => schools.id).notNull(),
  fullName: text("full_name").notNull(),
  graduationYear: integer("graduation_year").notNull(),
  admissionYear: integer("admission_year"),
  profileImage: text("profile_image"),
  createdAt: timestamp("created_at").defaultNow(),
});




export interface AlumniBadge {
  id: string;
  userId: string;        // the user this badge belongs to
  school: string;        // name of the school
  fullName: string;      // full name of the alumni
  graduationYear: string;
  admissionYear: string;
  status: "verified" | "pending";
}

export const alumniRequests = pgTable("alumni_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  schoolId: varchar("school_id").references(() => schools.id).notNull(),
  fullName: text("full_name").notNull(),
  admissionYear: text("admission_year").notNull(),
  graduationYear: text("graduation_year").notNull(),
  postHeld: text("post_held"),
  studentName: text("student_name"),
  studentAdmissionYear: text("student_admission_year"),
  additionalInfo: text("additional_info"),
  status: text("status").notNull().default("pending"), // 'pending', 'approved', 'denied'
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  reviewNotes: text("review_notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Yearbook tables
export const yearbooks = pgTable("yearbooks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  schoolId: varchar("school_id").references(() => schools.id).notNull(),
  year: integer("year").notNull(),
  title: text("title").notNull(),
  isPublished: boolean("is_published").default(false),
  frontCoverUrl: text("front_cover_url"),
  backCoverUrl: text("back_cover_url"),
  orientation: text("orientation"), // 'portrait', 'landscape', null (not selected)
  createdAt: timestamp("created_at").defaultNow(),
  publishedAt: timestamp("published_at"),
});

export const yearbookPages = pgTable("yearbook_pages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  yearbookId: varchar("yearbook_id").references(() => yearbooks.id).notNull(),
  pageNumber: integer("page_number").notNull(),
  title: text("title").notNull(),
  imageUrl: text("image_url").notNull(),
  pageType: text("page_type").notNull(), // 'front_cover', 'back_cover', 'content'
  createdAt: timestamp("created_at").defaultNow(),
});

export const tableOfContents = pgTable("table_of_contents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  yearbookId: varchar("yearbook_id").references(() => yearbooks.id).notNull(),
  title: text("title").notNull(),
  pageNumber: integer("page_number").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const alumniBadges = pgTable("alumni_badges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  school: text("school").notNull(), // name of the school
  fullName: text("full_name").notNull(), // full name of the alumni
  graduationYear: text("graduation_year").notNull(),
  admissionYear: text("admission_year").notNull(),
  status: text("status").notNull().default("pending"), // 'verified', 'pending'
  createdAt: timestamp("created_at").defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  type: text("type").notNull(), // 'alumni_approved', 'alumni_denied'
  title: text("title").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false),
  relatedId: varchar("related_id"), // ID of related entity (alumni request, etc.)
  createdAt: timestamp("created_at").defaultNow(),
});






export const yearPurchases = pgTable("year_purchases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  schoolId: varchar("school_id").references(() => schools.id).notNull(),
  year: integer("year").notNull(), // e.g., 2024
  purchased: boolean("purchased").default(false),
  purchaseDate: timestamp("purchase_date"),
  price: text("price"), // "14.99" or "0.00" for free
  paymentReference: text("payment_reference"), // Reference to payment record
  createdAt: timestamp("created_at").defaultNow(),
});

export const viewerYearPurchases = pgTable("viewer_year_purchases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  schoolId: varchar("school_id").references(() => schools.id).notNull(),
  year: integer("year").notNull(),
  purchased: boolean("purchased").default(false),
  purchaseDate: timestamp("purchase_date"),
  price: text("price").default("4.99"),
  paymentReference: text("payment_reference"), // Reference to payment record
  createdAt: timestamp("created_at").defaultNow(),
});

export const cartItems = pgTable("cart_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  schoolId: varchar("school_id").references(() => schools.id).notNull(),
  year: integer("year").notNull(),
  price: text("price").default("4.99"),
  addedAt: timestamp("added_at").defaultNow(),
});


export const memories = pgTable("memories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  schoolId: varchar("school_id").references(() => schools.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  imageUrl: text("image_url"), // Made optional for videos
  videoUrl: text("video_url"), // Added for video support
  mediaType: text("media_type").notNull(), // 'image' or 'video'
  eventDate: text("event_date").notNull(),
  year: integer("year").notNull(), // Changed from academicYear to year
  category: text("category"), // 'graduation', 'sports', 'arts', 'field_trips', 'academic'
  tags: json("tags").$type<string[]>(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const alumniRequestBlocks = pgTable("alumni_request_blocks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  schoolId: varchar("school_id").references(() => schools.id).notNull(),
  blockedUntil: timestamp("blocked_until").notNull(),
  reason: text("reason").notNull(), // 'badge_deleted'
  createdAt: timestamp("created_at").defaultNow(),
});

export const adminLogs = pgTable("admin_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  adminUserId: varchar("admin_user_id").references(() => users.id).notNull(),
  action: text("action").notNull(), // 'deleted_school', 'approved_alumni', 'blocked_user', etc.
  targetType: text("target_type").notNull(), // 'user', 'school', 'alumni_badge'
  targetId: varchar("target_id").notNull(), // ID of the affected entity
  details: json("details").$type<Record<string, any>>(), // Additional action details
  createdAt: timestamp("created_at").defaultNow(),
});

export const paymentRecords = pgTable("payment_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reference: text("reference").notNull().unique(),
  email: text("email").notNull(),
  amount: integer("amount").notNull(), // Amount in kobo (smallest currency unit)
  userId: varchar("user_id").references(() => users.id).notNull(),
  status: text("status").notNull().default("pending"), // 'pending', 'success', 'failed'
  cartItems: text("cart_items").notNull(), // JSON string of cart items
  paystackData: text("paystack_data"), // JSON string of Paystack response data
  // Revenue sharing fields
  schoolId: varchar("school_id").references(() => schools.id), // School involved in the transaction
  splitCode: text("split_code"), // Paystack split code used for revenue sharing
  platformAmount: integer("platform_amount"), // Platform's share in kobo
  schoolAmount: integer("school_amount"), // School's share in kobo
  splitStatus: text("split_status").default("pending"), // 'pending', 'completed', 'failed'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  fullName: true, // This will be computed from firstName + middleName + lastName
}).extend({
  phoneNumber: z.string().regex(/^\([1-9]\d{0,3}\)\d{4,15}$/, "Phone number must be in format (country code)(number)").optional(),
});

export const insertSchoolSchema = createInsertSchema(schools).omit({
  id: true,
  createdAt: true,
});


export const insertMemorySchema = createInsertSchema(memories).omit({
  id: true,
  createdAt: true,
}).extend({
  category: z.enum(['graduation', 'sports', 'arts', 'field_trips', 'academic']).optional(),
  mediaType: z.enum(['image', 'video']),
});

export const insertAlumniRequestSchema = createInsertSchema(alumniRequests).omit({
  id: true,
  createdAt: true,
  reviewedAt: true,
});

export const insertAlumniBadgeSchema = createInsertSchema(alumniBadges).omit({
  id: true,
  createdAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const insertStudentSchema = createInsertSchema(students).omit({
  id: true,
  createdAt: true,
});

export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type Student = typeof students.$inferSelect;
export type InsertSchool = z.infer<typeof insertSchoolSchema>;
export type School = typeof schools.$inferSelect;
export type InsertMemory = z.infer<typeof insertMemorySchema>;
export type Memory = typeof memories.$inferSelect;

export type InsertAlumniRequest = z.infer<typeof insertAlumniRequestSchema>;
export type AlumniRequest = typeof alumniRequests.$inferSelect;

export type InsertAlumniBadge = z.infer<typeof insertAlumniBadgeSchema>;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;
export const insertYearPurchaseSchema = createInsertSchema(yearPurchases).omit({
  id: true,
  createdAt: true,
});

export const insertViewerYearPurchaseSchema = createInsertSchema(viewerYearPurchases).omit({
  id: true,
  createdAt: true,
});

export const insertCartItemSchema = createInsertSchema(cartItems).omit({
  id: true,
  addedAt: true,
});

export const insertAlumniRequestBlockSchema = createInsertSchema(alumniRequestBlocks).omit({
  id: true,
  createdAt: true,
});

export const insertAdminLogSchema = createInsertSchema(adminLogs).omit({
  id: true,
  createdAt: true,
});

export const insertPaymentRecordSchema = createInsertSchema(paymentRecords).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertYearPurchase = z.infer<typeof insertYearPurchaseSchema>;
export type YearPurchase = typeof yearPurchases.$inferSelect;
export type InsertViewerYearPurchase = z.infer<typeof insertViewerYearPurchaseSchema>;
export type ViewerYearPurchase = typeof viewerYearPurchases.$inferSelect;
export type InsertCartItem = z.infer<typeof insertCartItemSchema>;
export type CartItem = typeof cartItems.$inferSelect;
export type InsertAlumniRequestBlock = z.infer<typeof insertAlumniRequestBlockSchema>;
export type AlumniRequestBlock = typeof alumniRequestBlocks.$inferSelect;
export type InsertAdminLog = z.infer<typeof insertAdminLogSchema>;
export type AdminLog = typeof adminLogs.$inferSelect;
export type InsertPaymentRecord = z.infer<typeof insertPaymentRecordSchema>;
export type PaymentRecord = typeof paymentRecords.$inferSelect;

// Yearbook schema exports
export const insertYearbookSchema = createInsertSchema(yearbooks).omit({
  id: true,
  createdAt: true,
  publishedAt: true,
});

export const insertYearbookPageSchema = createInsertSchema(yearbookPages).omit({
  id: true,
  createdAt: true,
});

export const insertTableOfContentsSchema = createInsertSchema(tableOfContents).omit({
  id: true,
  createdAt: true,
});

export type InsertYearbook = z.infer<typeof insertYearbookSchema>;
export type Yearbook = typeof yearbooks.$inferSelect;
export type InsertYearbookPage = z.infer<typeof insertYearbookPageSchema>;
export type YearbookPage = typeof yearbookPages.$inferSelect;
export type InsertTableOfContents = z.infer<typeof insertTableOfContentsSchema>;
export type TableOfContentsItem = typeof tableOfContents.$inferSelect;
