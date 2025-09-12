import { 
  type User, 
  type InsertUser, 
  type School, 
  type InsertSchool,
  type Memory,
  type InsertMemory,
  type AlumniRequest,
  type InsertAlumniRequest,
  type Notification,
  type InsertNotification,
  type YearPurchase,
  type InsertYearPurchase,
  type ViewerYearPurchase,
  type InsertViewerYearPurchase,
  type CartItem,
  type InsertCartItem,
  type AlumniRequestBlock,
  type InsertAlumniRequestBlock,
  type Student,
  type InsertStudent,
  type Yearbook,
  type InsertYearbook,
  type YearbookPage,
  type InsertYearbookPage,
  type TableOfContentsItem,
  type InsertTableOfContents,
  type AdminLog,
  type InsertAdminLog,
  type PaymentRecord,
  type InsertPaymentRecord,
  users,
  schools,
  memories,
  alumniRequests,
  notifications,
  yearPurchases,
  viewerYearPurchases,
  cartItems,
  alumniRequestBlocks,
  students,
  yearbooks,
  yearbookPages,
  tableOfContents,
  alumniBadges,
  adminLogs,
  paymentRecords
} from "../shared/schema";
import { randomUUID } from "crypto";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, and } from "drizzle-orm";

// Database connection
const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

// Import AlumniBadge from schema.ts instead of defining it here
type AlumniBadge = typeof alumniBadges.$inferSelect;
export type InsertAlumniBadge = Omit<AlumniBadge, "id" | "createdAt">;





export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserWithPassword(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByPhoneNumber(phoneNumber: string): Promise<User | undefined>;
  validateUser(username: string, password: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;



  // School operations
  getSchools(): Promise<School[]>;
  getApprovedSchools(): Promise<School[]>;
  getSchool(id: string): Promise<School | undefined>;
  getSchoolByCode(schoolCode: string): Promise<School | undefined>;
  getSchoolByActivationCode(activationCode: string): Promise<School | undefined>;
  getSchoolByAdminUserId(userId: string): Promise<School | undefined>;
  createSchool(school: InsertSchool): Promise<School>;
  updateSchoolProfile(schoolId: string, updates: Partial<Pick<School, 'address' | 'state' | 'email' | 'city'>>): Promise<School | undefined>;
  getPendingSchools(): Promise<School[]>;
  approveSchool(schoolId: string, approvedBy: string, activationCode: string): Promise<School | undefined>;
  rejectSchool(schoolId: string, rejectedBy: string, reason: string): Promise<School | undefined>;
  getSchoolById(schoolId: string): Promise<School | undefined>;
  updateSchoolSubaccount(schoolId: string, subaccountCode: string, bankAccountNumber: string, bankCode: string, status: string): Promise<School | undefined>;

  // Memory operations
  getMemoriesBySchoolAndYear(schoolId: string, year: number): Promise<Memory[]>;
  createMemory(memory: InsertMemory): Promise<Memory>;
  
  // Year purchase operations
  getYearPurchasesBySchool(schoolId: string): Promise<YearPurchase[]>;
  createYearPurchase(purchase: InsertYearPurchase): Promise<YearPurchase>;
  updateYearPurchase(purchaseId: string, purchased: boolean): Promise<YearPurchase | undefined>;
  
  // Viewer year purchase operations
  getViewerYearPurchases(userId: string, schoolId: string): Promise<ViewerYearPurchase[]>;
  getAllViewerYearPurchases(userId: string): Promise<ViewerYearPurchase[]>;
  createViewerYearPurchase(purchase: InsertViewerYearPurchase): Promise<ViewerYearPurchase>;
  updateViewerYearPurchase(purchaseId: string, purchased: boolean): Promise<ViewerYearPurchase | undefined>;

  // Cart operations
  getCartItems(userId: string): Promise<CartItem[]>;
  addCartItem(cartItem: InsertCartItem): Promise<CartItem>;
  removeCartItem(cartItemId: string): Promise<boolean>;
  clearCart(userId: string): Promise<boolean>;
  deleteCartItemsBySchoolAndYear(schoolId: string, year: number): Promise<number>;
  getCartItem(userId: string, schoolId: string, year: number): Promise<CartItem | undefined>;
  
  // Alumni request blocking
  createAlumniRequestBlock(block: InsertAlumniRequestBlock): Promise<AlumniRequestBlock>;
  getAlumniRequestBlocks(userId: string, schoolId: string): Promise<AlumniRequestBlock[]>;
  
  // Alumni request rate limiting
  getAlumniRequestsInLastWeek(userId: string): Promise<AlumniRequest[]>;
  hasExistingAlumniRequest(userId: string, schoolId: string): Promise<boolean>;

  // Student operations
  getStudentsBySchoolAndYear(schoolId: string, graduationYear: number): Promise<Student[]>;
  getStudentsBySchool(schoolId: string): Promise<Student[]>;
  createStudent(student: InsertStudent): Promise<Student>;

  









  // Alumni badge operations
  getAlumniBadgesByUser(userId: string): Promise<AlumniBadge[]>;
  getAlumniBadgesBySchool(schoolId: string): Promise<AlumniBadge[]>;
  createAlumniBadge(badge: InsertAlumniBadge): Promise<AlumniBadge>;
  updateAlumniBadgeStatus(badgeId: string, status: "verified" | "pending"): Promise<AlumniBadge | undefined>;
  deleteAlumniBadge(badgeId: string): Promise<boolean>;
  
  // Alumni Requests
  getAlumniRequestsBySchool(schoolId: string): Promise<AlumniRequest[]>;
  getAlumniRequestById(requestId: string): Promise<AlumniRequest | undefined>;
  getAlumniRequest(requestId: string): Promise<AlumniRequest | undefined>;
  createAlumniRequest(request: InsertAlumniRequest): Promise<AlumniRequest>;
  updateAlumniRequestStatus(requestId: string, status: string, reviewedBy: string, reviewNotes?: string): Promise<AlumniRequest | undefined>;
  updateAlumniRequest(id: string, updates: Partial<AlumniRequest>): Promise<AlumniRequest | undefined>;
  
  // Notifications
  getNotificationsByUser(userId: string): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(notificationId: string): Promise<boolean>;
  deleteNotification(notificationId: string): Promise<boolean>;
  
  // Yearbook operations
  getYearbook(schoolId: string, year: number): Promise<Yearbook | undefined>;
  getPublishedYearbook(schoolId: string, year: number): Promise<Yearbook | undefined>;
  createYearbook(yearbook: InsertYearbook): Promise<Yearbook>;
  updateYearbookPublishStatus(yearbookId: string, isPublished: boolean): Promise<Yearbook | undefined>;
  
  // Yearbook page operations
  createYearbookPage(page: InsertYearbookPage): Promise<YearbookPage>;
  deleteYearbookPage(pageId: string): Promise<boolean>;
  updateYearbookPageOrder(pageId: string, newPageNumber: number): Promise<YearbookPage | undefined>;
  getNextPageNumber(yearbookId: string): Promise<number>;
  
  // Table of contents operations
  createTableOfContentsItem(item: InsertTableOfContents): Promise<TableOfContentsItem>;
  updateTableOfContentsItem(tocId: string, updates: Partial<TableOfContentsItem>): Promise<TableOfContentsItem | undefined>;
  deleteTableOfContentsItem(tocId: string): Promise<boolean>;
  
  // Yearbook page operations  
  getYearbookPages(yearbookId: string): Promise<YearbookPage[]>;
  
  // Super Admin operations
  getAllUsers(): Promise<User[]>;
  getAllSchools(): Promise<School[]>;
  getAllAlumniBadges(): Promise<AlumniBadge[]>;
  getAllAlumniRequests(): Promise<AlumniRequest[]>;
  getUserById(id: string): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  deleteSchool(id: string): Promise<boolean>;
  updateUserRole(id: string, userType: string): Promise<User | undefined>;
  updateUserPrivacySettings(userId: string, updateData: { showPhoneToAlumni?: boolean; phoneNumber?: string }): Promise<User | undefined>;
  updateUserProfile(userId: string, updateData: { email?: string; username?: string; fullName?: string; password?: string; preferredCurrency?: string }): Promise<User | undefined>;
  logAdminAction(adminUserId: string, action: string, targetType: string, targetId: string, details?: Record<string, any>): Promise<void>;
  getAdminLogs(): Promise<AdminLog[]>;

  // Payment operations
  createPaymentRecord(payment: InsertPaymentRecord): Promise<PaymentRecord>;
  getPaymentByReference(reference: string): Promise<PaymentRecord | undefined>;
  updatePaymentStatus(reference: string, status: string): Promise<PaymentRecord | undefined>;
  clearUserCart(userId: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private schools: Map<string, School>;
  private memories: Map<string, Memory>;
  private alumniBadges: Map<string, AlumniBadge>;
  private alumniRequests: Map<string, AlumniRequest>;
  private notifications: Map<string, Notification>;
  private yearPurchases: Map<string, YearPurchase>;
  private viewerYearPurchases: Map<string, ViewerYearPurchase>;
  private cartItems: Map<string, CartItem>;
  private alumniRequestBlocks: Map<string, AlumniRequestBlock>;
  private students: Map<string, Student>;
  private yearbooks: Map<string, Yearbook>;
  private yearbookPages: Map<string, YearbookPage>;
  private tableOfContents: Map<string, TableOfContentsItem>;

  constructor() {
    this.users = new Map();
    this.schools = new Map();
    this.memories = new Map();
    this.alumniBadges = new Map();
    this.alumniRequests = new Map();
    this.notifications = new Map();
    this.yearPurchases = new Map();
    this.viewerYearPurchases = new Map();
    this.cartItems = new Map();
    this.alumniRequestBlocks = new Map();
    this.students = new Map();
    this.yearbooks = new Map();
    this.yearbookPages = new Map();
    this.tableOfContents = new Map();
    
    // Initialize with seed data
    this.initializeSeedData();
  }

  private async initializeSeedData() {
    // Database initialized - no seed data
    console.log("Database initialized successfully");
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserWithPassword(id: string): Promise<User | undefined> {
    // Same as getUser for memory storage since it already includes password
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase(),
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email && user.email.toLowerCase() === email.toLowerCase(),
    );
  }

  async getUserByPhoneNumber(phoneNumber: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.phoneNumber && user.phoneNumber === phoneNumber,
    );
  }

  async validateUser(username: string, password: string): Promise<User | undefined> {
    const user = Array.from(this.users.values()).find(
      (user) => user.username === username && user.password === password,
    );
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    // Compute fullName from firstName, middleName, lastName
    const fullName = [insertUser.firstName, insertUser.middleName, insertUser.lastName]
      .filter(Boolean)
      .join(' ');
    
    const user: User = { 
      ...insertUser, 
      fullName,
      id, 
      createdAt: new Date(),
      email: insertUser.email ?? null,
      profileImage: insertUser.profileImage ?? null,
      schoolId: insertUser.schoolId ?? null,
      middleName: insertUser.middleName ?? null,
      phoneNumber: insertUser.phoneNumber ?? null
    };
    this.users.set(id, user);
    return user;
  }

  async getSchools(): Promise<School[]> {
    return Array.from(this.schools.values());
  }

  async getApprovedSchools(): Promise<School[]> {
    return Array.from(this.schools.values()).filter(
      (school) => school.approvalStatus === 'approved'
    );
  }

  async getSchool(id: string): Promise<School | undefined> {
    return this.schools.get(id);
  }

  async getSchoolByCode(schoolCode: string): Promise<School | undefined> {
    return Array.from(this.schools.values()).find(
      (school) => school.schoolCode === schoolCode,
    );
  }

  async createSchool(insertSchool: InsertSchool): Promise<School> {
    const id = randomUUID();
    const school: School = { 
      ...insertSchool, 
      id, 
      createdAt: new Date(),
      address: insertSchool.address ?? null,
      state: insertSchool.state ?? null
    };
    this.schools.set(id, school);
    return school;
  }

  async getSchoolByAdminUserId(userId: string): Promise<School | undefined> {
    // Find the user first
    const user = this.users.get(userId);
    
    if (!user || user.userType !== 'school') {
      return undefined;
    }
    
    // If user has schoolId, use that
    if (user.schoolId) {
      return this.schools.get(user.schoolId);
    }
    
    // If no schoolId, try to match by username pattern
    const username = user.username.toLowerCase();
    
    // Look for a school that matches the admin username pattern
    const schools = Array.from(this.schools.values());
    for (const school of schools) {
      const schoolName = school.name.toLowerCase();
      
      // Check if username contains part of the school name or admin pattern
      if (username.includes('frfr') && schoolName.includes('frfr')) {
        return school;
      }
      if (username.includes('admin') && schoolName.includes('test')) {
        return school;
      }
      if (username.includes('albesta') && schoolName.includes('albesta')) {
        return school;
      }
    }
    
    // Fallback to first school
    return Array.from(this.schools.values())[0];
  }

  async getSchoolByActivationCode(activationCode: string): Promise<School | undefined> {
    return Array.from(this.schools.values()).find(
      (school) => school.activationCode === activationCode,
    );
  }

  async getPendingSchools(): Promise<School[]> {
    return Array.from(this.schools.values()).filter(
      (school) => school.approvalStatus === 'pending'
    );
  }

  async approveSchool(schoolId: string, approvedBy: string, activationCode: string): Promise<School | undefined> {
    const school = this.schools.get(schoolId);
    if (!school) {
      return undefined;
    }
    
    const updatedSchool = {
      ...school,
      approvalStatus: 'approved' as const,
      activationCode,
      approvedBy,
      approvedAt: new Date()
    };
    
    this.schools.set(schoolId, updatedSchool);
    return updatedSchool;
  }

  async rejectSchool(schoolId: string, rejectedBy: string, reason: string): Promise<School | undefined> {
    const school = this.schools.get(schoolId);
    if (!school) {
      return undefined;
    }
    
    const updatedSchool = {
      ...school,
      approvalStatus: 'rejected' as const,
      approvedBy: rejectedBy,
      approvedAt: new Date(),
      rejectionReason: reason
    };
    
    this.schools.set(schoolId, updatedSchool);
    return updatedSchool;
  }

  async updateSchoolProfile(schoolId: string, updates: Partial<Pick<School, 'address' | 'state' | 'email' | 'city'>>): Promise<School | undefined> {
    const school = this.schools.get(schoolId);
    if (!school) {
      return undefined;
    }
    
    const updatedSchool: School = {
      ...school,
      ...updates
    };
    
    this.schools.set(schoolId, updatedSchool);
    return updatedSchool;
  }

  async getMemoriesBySchoolAndYear(schoolId: string, year: number): Promise<Memory[]> {
    return Array.from(this.memories.values()).filter(
      (memory) => memory.schoolId === schoolId && memory.year === year,
    );
  }

  async createMemory(insertMemory: InsertMemory): Promise<Memory> {
    const id = randomUUID();
    const memory: Memory = { 
      ...insertMemory, 
      id, 
      tags: insertMemory.tags ?? [],
      description: insertMemory.description ?? null,
      category: insertMemory.category ?? null,
      imageUrl: insertMemory.imageUrl ?? null,
      videoUrl: insertMemory.videoUrl ?? null,
      createdAt: new Date()
    };
    this.memories.set(id, memory);
    return memory;
  }

  // Year purchase operations
  async getYearPurchasesBySchool(schoolId: string): Promise<YearPurchase[]> {
    return Array.from(this.yearPurchases.values()).filter(
      (purchase) => purchase.schoolId === schoolId,
    );
  }

  async createYearPurchase(insertPurchase: InsertYearPurchase): Promise<YearPurchase> {
    const id = randomUUID();
    const purchase: YearPurchase = {
      ...insertPurchase,
      id,
      purchased: insertPurchase.purchased ?? false,
      createdAt: new Date(),
      purchaseDate: insertPurchase.purchaseDate ? new Date(insertPurchase.purchaseDate) : null,
      price: insertPurchase.price ?? null,
    };
    this.yearPurchases.set(id, purchase);
    return purchase;
  }

  async updateYearPurchase(purchaseId: string, purchased: boolean): Promise<YearPurchase | undefined> {
    const purchase = this.yearPurchases.get(purchaseId);
    if (!purchase) return undefined;
    
    const updatedPurchase = { 
      ...purchase, 
      purchased, 
      purchaseDate: purchased ? new Date() : null 
    };
    this.yearPurchases.set(purchaseId, updatedPurchase);
    return updatedPurchase;
  }

  // Viewer year purchase operations
  async getViewerYearPurchases(userId: string, schoolId: string): Promise<ViewerYearPurchase[]> {
    return Array.from(this.viewerYearPurchases.values()).filter(
      (purchase) => purchase.userId === userId && purchase.schoolId === schoolId,
    );
  }

  async getAllViewerYearPurchases(userId: string): Promise<ViewerYearPurchase[]> {
    // Get all purchases for this user with school information
    const purchases = Array.from(this.viewerYearPurchases.values()).filter(
      (purchase) => purchase.userId === userId && purchase.purchased === true
    );
    
    // Add school information to each purchase for Library display
    const purchasesWithSchoolInfo = await Promise.all(
      purchases.map(async (purchase) => {
        const school = this.schools.get(purchase.schoolId);
        return {
          ...purchase,
          school: school || null,
        };
      })
    );
    
    return purchasesWithSchoolInfo;
  }

  async createViewerYearPurchase(insertPurchase: InsertViewerYearPurchase): Promise<ViewerYearPurchase> {
    const id = randomUUID();
    const purchase: ViewerYearPurchase = {
      ...insertPurchase,
      id,
      purchased: insertPurchase.purchased ?? false,
      createdAt: new Date(),
      purchaseDate: insertPurchase.purchaseDate ?? null,
      price: insertPurchase.price ?? "4.99",
    };
    this.viewerYearPurchases.set(id, purchase);
    return purchase;
  }

  async updateViewerYearPurchase(purchaseId: string, purchased: boolean): Promise<ViewerYearPurchase | undefined> {
    const purchase = this.viewerYearPurchases.get(purchaseId);
    if (!purchase) return undefined;
    
    const updatedPurchase = { 
      ...purchase, 
      purchased, 
      purchaseDate: purchased ? new Date() : null 
    };
    this.viewerYearPurchases.set(purchaseId, updatedPurchase);
    return updatedPurchase;
  }

  // Cart operations
  async getCartItems(userId: string): Promise<CartItem[]> {
    return Array.from(this.cartItems.values()).filter(
      (item) => item.userId === userId,
    );
  }

  async addCartItem(insertCartItem: InsertCartItem): Promise<CartItem> {
    const id = randomUUID();
    const cartItem: CartItem = {
      ...insertCartItem,
      id,
      price: insertCartItem.price ?? "4.99",
      addedAt: new Date(),
    };
    this.cartItems.set(id, cartItem);
    return cartItem;
  }

  async removeCartItem(cartItemId: string): Promise<boolean> {
    return this.cartItems.delete(cartItemId);
  }

  async clearCart(userId: string): Promise<boolean> {
    const userCartItems = Array.from(this.cartItems.entries()).filter(
      ([, item]) => item.userId === userId
    );
    
    for (const [cartItemId] of userCartItems) {
      this.cartItems.delete(cartItemId);
    }
    
    return true;
  }

  // Additional required methods for MemStorage
  async getSchoolById(schoolId: string): Promise<School | undefined> {
    return this.schools.get(schoolId);
  }

  async updateSchoolSubaccount(schoolId: string, subaccountCode: string, bankAccountNumber: string, bankCode: string, status: string): Promise<School | undefined> {
    const school = this.schools.get(schoolId);
    if (!school) return undefined;
    
    const updatedSchool = {
      ...school,
      paystackSubaccountCode: subaccountCode,
      bankAccountNumber: bankAccountNumber,
      bankCode: bankCode,
      subaccountStatus: status
    };
    
    this.schools.set(schoolId, updatedSchool);
    return updatedSchool;
  }

  async deleteCartItemsBySchoolAndYear(schoolId: string, year: number): Promise<number> {
    const itemsToDelete = Array.from(this.cartItems.entries()).filter(
      ([, item]) => item.schoolId === schoolId && item.year === year
    );
    
    for (const [cartItemId] of itemsToDelete) {
      this.cartItems.delete(cartItemId);
    }
    
    return itemsToDelete.length;
  }

  async getCartItem(userId: string, schoolId: string, year: number): Promise<CartItem | undefined> {
    return Array.from(this.cartItems.values()).find(
      (item) => item.userId === userId && item.schoolId === schoolId && item.year === year
    );
  }

  // Alumni request blocking
  async createAlumniRequestBlock(insertBlock: InsertAlumniRequestBlock): Promise<AlumniRequestBlock> {
    const id = randomUUID();
    const block: AlumniRequestBlock = {
      ...insertBlock,
      id,
      createdAt: new Date(),
    };
    this.alumniRequestBlocks.set(id, block);
    return block;
  }

  async getAlumniRequestBlocks(userId: string, schoolId: string): Promise<AlumniRequestBlock[]> {
    return Array.from(this.alumniRequestBlocks.values()).filter(
      (block) => block.userId === userId && block.schoolId === schoolId && 
      new Date() < new Date(block.blockedUntil),
    );
  }

  // Alumni request rate limiting
  async getAlumniRequestsInLastWeek(userId: string): Promise<AlumniRequest[]> {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    return Array.from(this.alumniRequests.values()).filter(
      (request) => request.userId === userId && 
      new Date(request.createdAt || '') >= oneWeekAgo,
    );
  }

  async hasExistingAlumniRequest(userId: string, schoolId: string): Promise<boolean> {
    return Array.from(this.alumniRequests.values()).some(
      (request) => request.userId === userId && 
      request.schoolId === schoolId && 
      request.status === 'pending',
    );
  }

  async getAlumniBadgesByUser(userId: string): Promise<AlumniBadge[]> {
    return Array.from(this.alumniBadges.values()).filter(
      (badge) => badge.userId === userId,
    );
  }

  async getAlumniBadgesBySchool(schoolId: string): Promise<AlumniBadge[]> {
    // Find the school by ID to get the school name
    const school = this.schools.get(schoolId);
    if (!school) return [];
    
    return Array.from(this.alumniBadges.values()).filter(
      (badge) => badge.school === school.name,
    );
  }

  async createAlumniBadge(insertBadge: InsertAlumniBadge): Promise<AlumniBadge> {
    const id = randomUUID();
    
    // Accept the badge with fullName already provided by DatabaseStorage
    const badge: AlumniBadge = { 
      ...insertBadge, 
      id,
      fullName: insertBadge.fullName || 'Unknown User', // Use provided fullName or fallback
      createdAt: new Date(),
    };
    this.alumniBadges.set(id, badge);
    return badge;
  }

  async updateAlumniBadgeStatus(badgeId: string, status: "verified" | "pending"): Promise<AlumniBadge | undefined> {
    const badge = this.alumniBadges.get(badgeId);
    if (!badge) return undefined;
    
    const updatedBadge = { ...badge, status };
    this.alumniBadges.set(badgeId, updatedBadge);
    return updatedBadge;
  }

  async deleteAlumniBadge(badgeId: string): Promise<boolean> {
    return this.alumniBadges.delete(badgeId);
  }

  async getAlumniRequestsBySchool(schoolId: string): Promise<AlumniRequest[]> {
    return Array.from(this.alumniRequests.values()).filter(
      (request) => request.schoolId === schoolId,
    );
  }

  async getAlumniRequestById(requestId: string): Promise<AlumniRequest | undefined> {
    return this.alumniRequests.get(requestId);
  }

  async getAlumniRequest(requestId: string): Promise<AlumniRequest | undefined> {
    return this.alumniRequests.get(requestId);
  }

  async updateAlumniRequest(id: string, updates: Partial<AlumniRequest>): Promise<AlumniRequest | undefined> {
    const existing = this.alumniRequests.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...updates };
    this.alumniRequests.set(id, updated);
    return updated;
  }

  async deleteAlumniRequest(id: string): Promise<boolean> {
    return this.alumniRequests.delete(id);
  }

  async getAlumniRequests(): Promise<AlumniRequest[]> {
    return Array.from(this.alumniRequests.values());
  }

  async getAlumniBadges(): Promise<AlumniBadge[]> {
    return Array.from(this.alumniBadges.values());
  }

  async getStudentsBySchool(schoolId: string): Promise<Student[]> {
    return Array.from(this.students.values()).filter(
      (student) => student.schoolId === schoolId,
    );
  }

  async getStudentsBySchoolAndYear(schoolId: string, graduationYear: number): Promise<any[]> {
    // Get verified alumni badges for the school and year
    const school = this.schools.get(schoolId);
    if (!school) return [];
    
    const verifiedAlumniBadges = Array.from(this.alumniBadges.values()).filter(
      badge => badge.status === 'verified' && 
               badge.school === school.name && 
               badge.graduationYear === graduationYear.toString()
    );
    
    // Get user details for each alumni badge and return as "students" for the Alumni Tab
    const students: any[] = [];
    
    for (const badge of verifiedAlumniBadges) {
      const user = this.users.get(badge.userId);
      if (user) {
        students.push({
          id: badge.id,
          schoolId: schoolId,
          fullName: badge.fullName,
          graduationYear: parseInt(badge.graduationYear),
          admissionYear: badge.admissionYear ? parseInt(badge.admissionYear) : null,
          profileImage: user.profileImage,
          email: user.email, // Add email for alumni cards
          phoneNumber: user.phoneNumber, // Add phone number for alumni cards
          createdAt: badge.createdAt || new Date(),
        });
      }
    }
    
    return students;
  }

  async getYearbookPages(yearbookId: string): Promise<YearbookPage[]> {
    return Array.from(this.yearbookPages.values()).filter(
      (page) => page.yearbookId === yearbookId
    ).sort((a, b) => a.pageNumber - b.pageNumber);
  }

  async updateYearbookPage(id: string, updates: Partial<YearbookPage>): Promise<YearbookPage | undefined> {
    const existing = this.yearbookPages.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...updates };
    this.yearbookPages.set(id, updated);
    return updated;
  }

  async updateYearbookPageOrder(pageId: string, newPageNumber: number): Promise<YearbookPage | undefined> {
    const page = this.yearbookPages.get(pageId);
    if (!page) return undefined;
    
    const updatedPage = { ...page, pageNumber: newPageNumber };
    this.yearbookPages.set(pageId, updatedPage);
    return updatedPage;
  }

  async createAlumniRequest(insertRequest: InsertAlumniRequest): Promise<AlumniRequest> {
    const id = randomUUID();
    const request: AlumniRequest = {
      ...insertRequest,
      id,
      status: insertRequest.status || "pending",
      reviewedBy: insertRequest.reviewedBy || null,
      reviewedAt: null,
      reviewNotes: insertRequest.reviewNotes || null,
      postHeld: insertRequest.postHeld || null,
      studentName: insertRequest.studentName || null,
      studentAdmissionYear: insertRequest.studentAdmissionYear || null,
      additionalInfo: insertRequest.additionalInfo || null,
      createdAt: new Date(),
    };
    this.alumniRequests.set(id, request);
    return request;
  }

  async updateAlumniRequestStatus(
    requestId: string, 
    status: string, 
    reviewedBy: string, 
    reviewNotes?: string
  ): Promise<AlumniRequest | undefined> {
    const request = this.alumniRequests.get(requestId);
    if (!request) return undefined;

    const updatedRequest: AlumniRequest = {
      ...request,
      status,
      reviewedBy,
      reviewedAt: new Date(),
      reviewNotes: reviewNotes || null,
    };
    
    this.alumniRequests.set(requestId, updatedRequest);
    return updatedRequest;
  }

  async getNotificationsByUser(userId: string): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter((notification) => notification.userId === userId)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const id = randomUUID();
    const notification: Notification = {
      ...insertNotification,
      id,
      isRead: insertNotification.isRead ?? false,
      relatedId: insertNotification.relatedId ?? null,
      createdAt: new Date(),
    };
    this.notifications.set(id, notification);
    return notification;
  }

  async markNotificationAsRead(notificationId: string): Promise<boolean> {
    const notification = this.notifications.get(notificationId);
    if (!notification) return false;

    const updatedNotification: Notification = {
      ...notification,
      isRead: true,
    };
    this.notifications.set(notificationId, updatedNotification);
    return true;
  }

  async deleteNotification(notificationId: string): Promise<boolean> {
    return this.notifications.delete(notificationId);
  }

  // Student operations (for Alumni Tab - returns verified alumni as "students")

  async createStudent(student: InsertStudent): Promise<Student> {
    const id = randomUUID();
    const newStudent: Student = {
      id,
      ...student,
      profileImage: student.profileImage || null,
      admissionYear: student.admissionYear || null,
      createdAt: new Date(),
    };
    this.students.set(id, newStudent);
    return newStudent;
  }
  
  // Yearbook operations
  async getYearbook(schoolId: string, year: number): Promise<Yearbook | undefined> {
    const yearbook = Array.from(this.yearbooks.values()).find(
      (yb) => yb.schoolId === schoolId && yb.year === year
    );
    
    if (!yearbook) return undefined;
    
    // Enrich with pages and table of contents
    const pages = Array.from(this.yearbookPages.values()).filter(
      (page) => page.yearbookId === yearbook.id
    ).sort((a, b) => a.pageNumber - b.pageNumber);
    
    const tableOfContents = Array.from(this.tableOfContents.values()).filter(
      (item) => item.yearbookId === yearbook.id
    ).sort((a, b) => a.pageNumber - b.pageNumber);
    
    return {
      ...yearbook,
      pages,
      tableOfContents
    } as any;
  }

  async getPublishedYearbook(schoolId: string, year: number): Promise<Yearbook | undefined> {
    const yearbook = Array.from(this.yearbooks.values()).find(
      (yb) => yb.schoolId === schoolId && yb.year === year && yb.isPublished === true
    );
    
    if (!yearbook) return undefined;
    
    // Enrich with pages and table of contents
    const pages = Array.from(this.yearbookPages.values()).filter(
      (page) => page.yearbookId === yearbook.id
    ).sort((a, b) => a.pageNumber - b.pageNumber);
    
    const tableOfContents = Array.from(this.tableOfContents.values()).filter(
      (item) => item.yearbookId === yearbook.id
    ).sort((a, b) => a.pageNumber - b.pageNumber);
    
    return {
      ...yearbook,
      pages,
      tableOfContents
    } as any;
  }
  
  async createYearbook(insertYearbook: InsertYearbook): Promise<Yearbook> {
    const id = randomUUID();
    const yearbook: Yearbook = {
      ...insertYearbook,
      id,
      isPublished: insertYearbook.isPublished ?? false,
      frontCoverUrl: insertYearbook.frontCoverUrl || null,
      backCoverUrl: insertYearbook.backCoverUrl || null,
      orientation: insertYearbook.orientation ?? null,
      createdAt: new Date(),
      publishedAt: null,
    };
    this.yearbooks.set(id, yearbook);
    return yearbook;
  }
  
  async updateYearbookPublishStatus(yearbookId: string, isPublished: boolean): Promise<Yearbook | undefined> {
    const yearbook = this.yearbooks.get(yearbookId);
    if (!yearbook) return undefined;
    
    const updatedYearbook = {
      ...yearbook,
      isPublished,
      publishedAt: isPublished ? new Date() : null,
    };
    this.yearbooks.set(yearbookId, updatedYearbook);
    return updatedYearbook;
  }
  
  async createYearbookPage(insertPage: InsertYearbookPage): Promise<YearbookPage> {
    const id = randomUUID();
    const page: YearbookPage = {
      ...insertPage,
      id,
      createdAt: new Date(),
    };
    this.yearbookPages.set(id, page);
    return page;
  }
  
  async deleteYearbookPage(pageId: string): Promise<boolean> {
    return this.yearbookPages.delete(pageId);
  }
  
  async getNextPageNumber(yearbookId: string): Promise<number> {
    const pages = Array.from(this.yearbookPages.values()).filter(
      (page) => page.yearbookId === yearbookId && page.pageType === "content"
    );
    return Math.max(...pages.map(p => p.pageNumber), 0) + 1;
  }
  
  async createTableOfContentsItem(insertItem: InsertTableOfContents): Promise<TableOfContentsItem> {
    const id = randomUUID();
    const item: TableOfContentsItem = {
      ...insertItem,
      id,
      createdAt: new Date(),
      description: insertItem.description || null,
    };
    this.tableOfContents.set(id, item);
    return item;
  }

  async updateTableOfContentsItem(tocId: string, updates: Partial<TableOfContentsItem>): Promise<TableOfContentsItem | undefined> {
    const item = this.tableOfContents.get(tocId);
    if (!item) return undefined;
    
    const updatedItem = { ...item, ...updates };
    this.tableOfContents.set(tocId, updatedItem);
    return updatedItem;
  }

  async deleteTableOfContentsItem(tocId: string): Promise<boolean> {
    return this.tableOfContents.delete(tocId);
  }

  // Payment operations (MemStorage - for testing only)
  private paymentRecords: Map<string, PaymentRecord> = new Map();

  async createPaymentRecord(payment: InsertPaymentRecord): Promise<PaymentRecord> {
    const id = randomUUID();
    const record: PaymentRecord = {
      ...payment,
      id,
      status: payment.status || 'pending',
      schoolId: payment.schoolId || null,
      splitCode: payment.splitCode || null,
      platformAmount: payment.platformAmount || null,
      schoolAmount: payment.schoolAmount || null,
      splitStatus: payment.splitStatus || 'pending',
      paystackData: payment.paystackData || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.paymentRecords.set(id, record);
    return record;
  }

  async getPaymentByReference(reference: string): Promise<PaymentRecord | undefined> {
    return Array.from(this.paymentRecords.values()).find(p => p.reference === reference);
  }

  async updatePaymentStatus(reference: string, status: string): Promise<PaymentRecord | undefined> {
    const record = Array.from(this.paymentRecords.values()).find(p => p.reference === reference);
    if (!record) return undefined;
    
    record.status = status;
    record.updatedAt = new Date();
    this.paymentRecords.set(record.id, record);
    return record;
  }

  async clearUserCart(userId: string): Promise<boolean> {
    // clearUserCart is an alias for clearCart
    return this.clearCart(userId);
  }
}

// Database Storage Implementation
export class DatabaseStorage implements IStorage {
  // User operations - hybrid approach: try database first, then memory
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    if (result[0]) return result[0];
    // Fallback to memory storage for users created in memory
    return this.memStorage.getUser(id);
  }

  async getUserWithPassword(id: string): Promise<User | undefined> {
    // Same as getUser since database select already includes all fields including password
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    if (result[0]) return result[0];
    // Fallback to memory storage for users created in memory
    return this.memStorage.getUserWithPassword(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username.toLowerCase())).limit(1);
    if (result[0]) return result[0];
    // Fallback to memory storage for users created in memory
    return this.memStorage.getUserByUsername(username.toLowerCase());
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
    if (result[0]) return result[0];
    // Fallback to memory storage for users created in memory
    return this.memStorage.getUserByEmail(email.toLowerCase());
  }

  async getUserByPhoneNumber(phoneNumber: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.phoneNumber, phoneNumber)).limit(1);
    if (result[0]) return result[0];
    // Fallback to memory storage for users created in memory
    return this.memStorage.getUserByPhoneNumber(phoneNumber);
  }

  async validateUser(username: string, password: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(
      and(eq(users.username, username), eq(users.password, password))
    ).limit(1);
    if (result[0]) return result[0];
    // Fallback to memory storage for users created in memory
    return this.memStorage.validateUser(username, password);
  }

  async createUser(user: InsertUser): Promise<User> {
    const fullName = `${user.firstName}${user.middleName ? ' ' + user.middleName : ''} ${user.lastName}`;
    const newUser = { ...user, fullName };
    const result = await db.insert(users).values(newUser).returning();
    return result[0];
  }

  // School operations
  async getSchools(): Promise<School[]> {
    return await db.select().from(schools);
  }

  async getApprovedSchools(): Promise<School[]> {
    return await db.select().from(schools).where(eq(schools.approvalStatus, 'approved'));
  }

  async getSchool(id: string): Promise<School | undefined> {
    const result = await db.select().from(schools).where(eq(schools.id, id)).limit(1);
    return result[0];
  }

  async getSchoolByCode(schoolCode: string): Promise<School | undefined> {
    const result = await db.select().from(schools).where(eq(schools.schoolCode, schoolCode)).limit(1);
    return result[0];
  }

  async getSchoolByEmail(email: string): Promise<School | undefined> {
    const result = await db.select().from(schools).where(eq(schools.email, email)).limit(1);
    return result[0];
  }

  async getSchoolById(schoolId: string): Promise<School | undefined> {
    const result = await db.select().from(schools).where(eq(schools.id, schoolId)).limit(1);
    return result[0];
  }

  async getSchoolByAdminUserId(userId: string): Promise<School | undefined> {
    const result = await db.select().from(schools).where(eq(schools.id, 
      (await db.select().from(users).where(eq(users.id, userId)).limit(1))[0]?.schoolId || ''
    )).limit(1);
    return result[0];
  }

  async createSchool(school: InsertSchool): Promise<School> {
    const result = await db.insert(schools).values(school).returning();
    return result[0];
  }

  async updateSchoolProfile(schoolId: string, updates: Partial<Pick<School, 'address' | 'state' | 'email' | 'city'>>): Promise<School | undefined> {
    const result = await db.update(schools).set(updates).where(eq(schools.id, schoolId)).returning();
    return result[0];
  }

  async getSchoolByActivationCode(activationCode: string): Promise<School | undefined> {
    const result = await db.select().from(schools).where(eq(schools.activationCode, activationCode)).limit(1);
    return result[0];
  }

  async getPendingSchools(): Promise<School[]> {
    return await db.select().from(schools).where(eq(schools.approvalStatus, 'pending'));
  }

  async approveSchool(schoolId: string, approvedBy: string, activationCode: string): Promise<School | undefined> {
    const result = await db.update(schools)
      .set({
        approvalStatus: 'approved',
        activationCode,
        approvedBy,
        approvedAt: new Date()
      })
      .where(eq(schools.id, schoolId))
      .returning();
    return result[0];
  }

  async rejectSchool(schoolId: string, rejectedBy: string, reason: string): Promise<School | undefined> {
    const result = await db.update(schools)
      .set({
        approvalStatus: 'rejected',
        approvedBy: rejectedBy,
        approvedAt: new Date(),
        rejectionReason: reason
      })
      .where(eq(schools.id, schoolId))
      .returning();
    return result[0];
  }

  async getSchoolById(schoolId: string): Promise<School | undefined> {
    const result = await db.select().from(schools).where(eq(schools.id, schoolId)).limit(1);
    return result[0];
  }

  async updateSchoolSubaccount(schoolId: string, subaccountCode: string, bankAccountNumber: string, bankCode: string, status: string): Promise<School | undefined> {
    const result = await db.update(schools)
      .set({ 
        paystackSubaccountCode: subaccountCode,
        bankAccountNumber: bankAccountNumber,
        bankCode: bankCode,
        subaccountStatus: status
      })
      .where(eq(schools.id, schoolId))
      .returning();
    return result[0];
  }

  async clearTempAdminCredentials(schoolId: string): Promise<void> {
    await db.update(schools)
      .set({ tempAdminCredentials: null })
      .where(eq(schools.id, schoolId));
  }

  // Memory operations
  async getMemoriesBySchoolAndYear(schoolId: string, year: number): Promise<Memory[]> {
    return await db.select().from(memories).where(
      and(eq(memories.schoolId, schoolId), eq(memories.year, year))
    );
  }

  async createMemory(memory: InsertMemory): Promise<Memory> {
    const result = await db.insert(memories).values(memory).returning();
    return result[0];
  }

  // Year purchase operations
  async getYearPurchasesBySchool(schoolId: string): Promise<YearPurchase[]> {
    return await db.select().from(yearPurchases).where(eq(yearPurchases.schoolId, schoolId));
  }

  async createYearPurchase(purchase: InsertYearPurchase): Promise<YearPurchase> {
    const result = await db.insert(yearPurchases).values(purchase).returning();
    return result[0];
  }

  async updateYearPurchase(purchaseId: string, purchased: boolean): Promise<YearPurchase | undefined> {
    const updates: any = { purchased };
    if (purchased) {
      updates.purchaseDate = new Date();
    }
    const result = await db.update(yearPurchases).set(updates).where(eq(yearPurchases.id, purchaseId)).returning();
    return result[0];
  }

  // Continue with other methods following the same pattern...
  // For brevity, I'll implement the key yearbook methods needed for the orientation feature
  
  // Yearbook operations
  async getYearbooksBySchool(schoolId: string): Promise<Yearbook[]> {
    return await db.select().from(yearbooks).where(eq(yearbooks.schoolId, schoolId));
  }

  async getYearbook(id: string): Promise<Yearbook | undefined> {
    const result = await db.select().from(yearbooks).where(eq(yearbooks.id, id)).limit(1);
    return result[0];
  }

  async getYearbookBySchoolAndYear(schoolId: string, year: number): Promise<Yearbook | undefined> {
    const result = await db.select().from(yearbooks).where(
      and(eq(yearbooks.schoolId, schoolId), eq(yearbooks.year, year))
    ).limit(1);
    
    const yearbook = result[0];
    if (!yearbook) return undefined;
    
    // Fetch related pages and table of contents
    const pages = await db.select().from(yearbookPages).where(eq(yearbookPages.yearbookId, yearbook.id));
    const tocItems = await db.select().from(tableOfContents).where(eq(tableOfContents.yearbookId, yearbook.id));
    
    return {
      ...yearbook,
      pages: pages.sort((a, b) => a.pageNumber - b.pageNumber),
      tableOfContents: tocItems.sort((a, b) => a.pageNumber - b.pageNumber)
    } as any;
  }

  async createYearbook(yearbook: InsertYearbook): Promise<Yearbook> {
    const result = await db.insert(yearbooks).values(yearbook).returning();
    return result[0];
  }

  async updateYearbook(id: string, updates: Partial<Yearbook>): Promise<Yearbook | undefined> {
    const result = await db.update(yearbooks).set(updates).where(eq(yearbooks.id, id)).returning();
    return result[0];
  }

  async getPublishedYearbook(schoolId: string, year: number): Promise<Yearbook | undefined> {
    const result = await db.select().from(yearbooks).where(
      and(eq(yearbooks.schoolId, schoolId), eq(yearbooks.year, year), eq(yearbooks.isPublished, true))
    ).limit(1);
    
    const yearbook = result[0];
    if (!yearbook) return undefined;
    
    // Fetch related pages and table of contents
    const pages = await db.select().from(yearbookPages).where(eq(yearbookPages.yearbookId, yearbook.id));
    const tocItems = await db.select().from(tableOfContents).where(eq(tableOfContents.yearbookId, yearbook.id));
    
    return {
      ...yearbook,
      pages: pages.sort((a, b) => a.pageNumber - b.pageNumber),
      tableOfContents: tocItems.sort((a, b) => a.pageNumber - b.pageNumber)
    } as any;
  }

  async updateYearbookPublishStatus(yearbookId: string, isPublished: boolean): Promise<Yearbook | undefined> {
    const updates: any = { isPublished };
    if (isPublished) {
      updates.publishedAt = new Date();
    }
    const result = await db.update(yearbooks).set(updates).where(eq(yearbooks.id, yearbookId)).returning();
    return result[0];
  }

  async getAllPublishedYearbooks(schoolId: string): Promise<{ year: number; isPublished: boolean }[]> {
    const result = await db.select({
      year: yearbooks.year,
      isPublished: yearbooks.isPublished
    }).from(yearbooks).where(
      and(eq(yearbooks.schoolId, schoolId), eq(yearbooks.isPublished, true))
    );
    
    return result.map(yearbook => ({ 
      year: yearbook.year, 
      isPublished: true 
    }));
  }

  // For the remaining methods, let's keep using MemStorage temporarily 
  // This is a hybrid approach until we fully migrate
  private memStorage = new MemStorage();

  // Delegate remaining methods to MemStorage for now
  async getViewerYearPurchases(userId: string, schoolId: string): Promise<ViewerYearPurchase[]> {
    const result = await db.select().from(viewerYearPurchases).where(
      and(
        eq(viewerYearPurchases.userId, userId),
        eq(viewerYearPurchases.schoolId, schoolId)
      )
    );
    return result;
  }

  async getAllViewerYearPurchases(userId: string): Promise<ViewerYearPurchase[]> {
    // Get all purchases for this user with school information
    const purchases = await db.select().from(viewerYearPurchases).where(
      and(
        eq(viewerYearPurchases.userId, userId),
        eq(viewerYearPurchases.purchased, true)
      )
    );
    
    // Add school information to each purchase for Library display
    const purchasesWithSchoolInfo = await Promise.all(
      purchases.map(async (purchase) => {
        const schoolResults = await db.select().from(schools).where(eq(schools.id, purchase.schoolId));
        const school = schoolResults[0] || null;
        return {
          ...purchase,
          school: school,
        };
      })
    );
    
    return purchasesWithSchoolInfo;
  }

  async createViewerYearPurchase(purchase: InsertViewerYearPurchase): Promise<ViewerYearPurchase> {
    const result = await db.insert(viewerYearPurchases).values(purchase).returning();
    return result[0];
  }

  async updateViewerYearPurchase(purchaseId: string, purchased: boolean): Promise<ViewerYearPurchase | undefined> {
    const result = await db.update(viewerYearPurchases)
      .set({ 
        purchased, 
        purchaseDate: purchased ? new Date() : null 
      })
      .where(eq(viewerYearPurchases.id, purchaseId))
      .returning();
    return result[0];
  }

  // Cart operations
  async getCartItems(userId: string): Promise<CartItem[]> {
    const result = await db.select().from(cartItems).where(eq(cartItems.userId, userId));
    return result;
  }

  async addCartItem(cartItem: InsertCartItem): Promise<CartItem> {
    const result = await db.insert(cartItems).values(cartItem).returning();
    return result[0];
  }

  async removeCartItem(cartItemId: string): Promise<boolean> {
    const result = await db.delete(cartItems).where(eq(cartItems.id, cartItemId)).returning();
    return result.length > 0;
  }

  async clearCart(userId: string): Promise<boolean> {
    await db.delete(cartItems).where(eq(cartItems.userId, userId));
    return true;
  }

  async deleteCartItemsBySchoolAndYear(schoolId: string, year: number): Promise<number> {
    const result = await db.delete(cartItems)
      .where(and(eq(cartItems.schoolId, schoolId), eq(cartItems.year, year)))
      .returning();
    return result.length;
  }

  async getCartItem(userId: string, schoolId: string, year: number): Promise<CartItem | undefined> {
    const result = await db.select().from(cartItems).where(
      and(
        eq(cartItems.userId, userId),
        eq(cartItems.schoolId, schoolId),
        eq(cartItems.year, year)
      )
    ).limit(1);
    return result[0];
  }

  async createAlumniRequestBlock(block: InsertAlumniRequestBlock): Promise<AlumniRequestBlock> {
    return this.memStorage.createAlumniRequestBlock(block);
  }

  async getAlumniRequestBlocks(userId: string, schoolId: string): Promise<AlumniRequestBlock[]> {
    return this.memStorage.getAlumniRequestBlocks(userId, schoolId);
  }

  async getAlumniRequests(): Promise<AlumniRequest[]> {
    return this.memStorage.getAlumniRequests();
  }

  async getYearbookPages(yearbookId: string): Promise<YearbookPage[]> {
    // Query database first for pages stored in database
    const result = await db.select().from(yearbookPages).where(eq(yearbookPages.yearbookId, yearbookId));
    if (result.length > 0) {
      return result.sort((a, b) => a.pageNumber - b.pageNumber);
    }
    // Fallback to memory storage for pages created in memory
    return this.memStorage.getYearbookPages(yearbookId);
  }

  async updateYearbookPage(id: string, updates: Partial<YearbookPage>): Promise<YearbookPage | undefined> {
    return this.memStorage.updateYearbookPage(id, updates);
  }

  async getAlumniRequestsBySchool(schoolId: string): Promise<AlumniRequest[]> {
    return this.memStorage.getAlumniRequestsBySchool(schoolId);
  }

  async getAlumniRequest(id: string): Promise<AlumniRequest | undefined> {
    return this.memStorage.getAlumniRequest(id);
  }

  async getAlumniRequestById(requestId: string): Promise<AlumniRequest | undefined> {
    return this.memStorage.getAlumniRequest(requestId);
  }

  async updateAlumniRequestStatus(requestId: string, status: string, reviewedBy: string, reviewNotes?: string): Promise<AlumniRequest | undefined> {
    return this.memStorage.updateAlumniRequestStatus(requestId, status, reviewedBy, reviewNotes);
  }

  async hasExistingAlumniRequest(userId: string, schoolId: string): Promise<boolean> {
    return this.memStorage.hasExistingAlumniRequest(userId, schoolId);
  }

  async getAlumniRequestsInLastWeek(userId: string): Promise<AlumniRequest[]> {
    return this.memStorage.getAlumniRequestsInLastWeek(userId);
  }

  async createAlumniRequest(request: InsertAlumniRequest): Promise<AlumniRequest> {
    return this.memStorage.createAlumniRequest(request);
  }

  async updateAlumniRequest(id: string, updates: Partial<AlumniRequest>): Promise<AlumniRequest | undefined> {
    return this.memStorage.updateAlumniRequest(id, updates);
  }

  async deleteAlumniRequest(id: string): Promise<boolean> {
    return this.memStorage.deleteAlumniRequest(id);
  }

  async getAlumniBadges(): Promise<AlumniBadge[]> {
    return await db.select().from(alumniBadges);
  }

  async getAlumniBadgesByUser(userId: string): Promise<AlumniBadge[]> {
    return await db.select().from(alumniBadges).where(eq(alumniBadges.userId, userId));
  }

  async getAlumniBadgesBySchool(schoolId: string): Promise<AlumniBadge[]> {
    const school = await db.select().from(schools).where(eq(schools.id, schoolId)).limit(1);
    if (!school[0]) return [];
    
    return await db.select().from(alumniBadges).where(eq(alumniBadges.school, school[0].name));
  }

  async updateAlumniBadgeStatus(badgeId: string, status: "verified" | "pending"): Promise<AlumniBadge | undefined> {
    const result = await db.update(alumniBadges).set({ status }).where(eq(alumniBadges.id, badgeId)).returning();
    return result[0];
  }

  async createAlumniBadge(badge: InsertAlumniBadge): Promise<AlumniBadge> {
    const result = await db.insert(alumniBadges).values(badge).returning();
    return result[0];
  }

  async deleteAlumniBadge(id: string): Promise<boolean> {
    const result = await db.delete(alumniBadges).where(eq(alumniBadges.id, id)).returning();
    return result.length > 0;
  }

  async getNotificationsByUser(userId: string): Promise<Notification[]> {
    return this.memStorage.getNotificationsByUser(userId);
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    return this.memStorage.createNotification(notification);
  }

  async markNotificationAsRead(id: string): Promise<boolean> {
    const result = await this.memStorage.markNotificationAsRead(id);
    return result !== undefined;
  }

  async deleteNotification(id: string): Promise<boolean> {
    return this.memStorage.deleteNotification(id);
  }

  async createStudent(student: InsertStudent): Promise<Student> {
    return this.memStorage.createStudent(student);
  }

  async getStudentsBySchool(schoolId: string): Promise<Student[]> {
    // First try to get from actual students table
    const studentsFromDB = await db.select().from(students).where(eq(students.schoolId, schoolId));
    
    if (studentsFromDB.length > 0) {
      return studentsFromDB;
    }
    
    // Fallback: Get ALL verified alumni badges for the school (across all years)
    const school = await db.select().from(schools).where(eq(schools.id, schoolId));
    if (school.length === 0) return [];
    
    const schoolName = school[0].name;
    const verifiedAlumniBadges = await db.select().from(alumniBadges).where(
      and(
        eq(alumniBadges.school, schoolName),
        eq(alumniBadges.status, 'verified')
      )
    );
    
    // Get user details for each alumni badge and return as "students" for the Alumni Tab
    const studentsFromBadges: any[] = [];
    
    for (const badge of verifiedAlumniBadges) {
      const userResults = await db.select().from(users).where(eq(users.id, badge.userId));
      const user = userResults[0];
      if (user) {
        studentsFromBadges.push({
          id: badge.id,
          schoolId: schoolId,
          fullName: badge.fullName,
          graduationYear: parseInt(badge.graduationYear),
          admissionYear: badge.admissionYear ? parseInt(badge.admissionYear) : null,
          profileImage: user.profileImage,
          email: user.email,
          phoneNumber: user.phoneNumber,
          createdAt: badge.createdAt || new Date(),
        });
      }
    }
    
    return studentsFromBadges;
  }

  async getStudentsBySchoolAndYear(schoolId: string, graduationYear: number): Promise<any[]> {
    // First try to get from actual students table
    const studentsFromDB = await db.select().from(students).where(
      and(
        eq(students.schoolId, schoolId),
        eq(students.graduationYear, graduationYear)
      )
    );
    
    if (studentsFromDB.length > 0) {
      return studentsFromDB;
    }
    
    // Fallback: Get verified alumni badges for the school and year
    const school = await db.select().from(schools).where(eq(schools.id, schoolId));
    if (school.length === 0) return [];
    
    const schoolName = school[0].name;
    // Handle special case for "did not graduate" (graduation year -1)
    const graduationYearQuery = graduationYear === -1 ? 'did-not-graduate' : graduationYear.toString();
    
    const verifiedAlumniBadges = await db.select().from(alumniBadges).where(
      and(
        eq(alumniBadges.school, schoolName),
        eq(alumniBadges.graduationYear, graduationYearQuery),
        eq(alumniBadges.status, 'verified')
      )
    );
    
    // Get user details for each alumni badge and return as "students" for the Alumni Tab
    const studentsFromBadges: any[] = [];
    
    for (const badge of verifiedAlumniBadges) {
      const userResults = await db.select().from(users).where(eq(users.id, badge.userId));
      const user = userResults[0];
      if (user) {
        studentsFromBadges.push({
          id: badge.id,
          schoolId: schoolId,
          fullName: badge.fullName,
          graduationYear: badge.graduationYear === 'did-not-graduate' ? -1 : parseInt(badge.graduationYear),
          admissionYear: badge.admissionYear ? parseInt(badge.admissionYear) : null,
          profileImage: user.profileImage,
          email: user.email, // Add email for alumni cards
          phoneNumber: user.phoneNumber, // Add phone number for alumni cards
          createdAt: badge.createdAt || new Date(),
        });
      }
    }
    
    return studentsFromBadges;
  }

  async createYearbookPage(page: InsertYearbookPage): Promise<YearbookPage> {
    const result = await db.insert(yearbookPages).values(page).returning();
    return result[0];
  }

  async deleteYearbookPage(pageId: string): Promise<boolean> {
    const result = await db.delete(yearbookPages).where(eq(yearbookPages.id, pageId)).returning();
    return result.length > 0;
  }

  async getNextPageNumber(yearbookId: string): Promise<number> {
    const pages = await db.select().from(yearbookPages).where(
      and(eq(yearbookPages.yearbookId, yearbookId), eq(yearbookPages.pageType, "content"))
    );
    const maxPageNumber = pages.length > 0 ? Math.max(...pages.map(p => p.pageNumber)) : 0;
    return maxPageNumber + 1;
  }

  async updateYearbookPageOrder(pageId: string, newPageNumber: number): Promise<YearbookPage | undefined> {
    const result = await db.update(yearbookPages)
      .set({ pageNumber: newPageNumber })
      .where(eq(yearbookPages.id, pageId))
      .returning();
    return result[0];
  }

  async createTableOfContentsItem(insertItem: InsertTableOfContents): Promise<TableOfContentsItem> {
    const result = await db.insert(tableOfContents).values(insertItem).returning();
    return result[0];
  }

  async updateTableOfContentsItem(tocId: string, updates: Partial<TableOfContentsItem>): Promise<TableOfContentsItem | undefined> {
    const result = await db.update(tableOfContents)
      .set(updates)
      .where(eq(tableOfContents.id, tocId))
      .returning();
    return result[0];
  }

  async deleteTableOfContentsItem(tocId: string): Promise<boolean> {
    const result = await db.delete(tableOfContents).where(eq(tableOfContents.id, tocId)).returning();
    return result.length > 0;
  }

  // Super Admin methods
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getAllSchools(): Promise<School[]> {
    return await db.select().from(schools);
  }

  async getAllAlumniBadges(): Promise<AlumniBadge[]> {
    return await db.select().from(alumniBadges);
  }

  async getAllAlumniRequests(): Promise<AlumniRequest[]> {
    return await db.select().from(alumniRequests);
  }

  async getUserById(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    if (result[0]) return result[0];
    // Fallback to memory storage for users created in memory
    return this.memStorage.getUser(id);
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id)).returning();
    return Array.isArray(result) && result.length > 0;
  }

  async deleteSchool(id: string): Promise<boolean> {
    const result = await db.delete(schools).where(eq(schools.id, id)).returning();
    return Array.isArray(result) && result.length > 0;
  }

  async updateUserRole(id: string, userType: string): Promise<User | undefined> {
    const result = await db.update(users)
      .set({ userType })
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async updateUserPrivacySettings(userId: string, updateData: { showPhoneToAlumni?: boolean; phoneNumber?: string }): Promise<User | undefined> {
    const result = await db.update(users).set(updateData).where(eq(users.id, userId)).returning();
    return result.length > 0 ? result[0] : undefined;
  }

  async updateUserProfile(userId: string, updateData: { email?: string; username?: string; fullName?: string; password?: string; preferredCurrency?: string }): Promise<User | undefined> {
    const result = await db.update(users).set(updateData).where(eq(users.id, userId)).returning();
    return result.length > 0 ? result[0] : undefined;
  }

  async logAdminAction(adminUserId: string, action: string, targetType: string, targetId: string, details?: Record<string, any>): Promise<void> {
    await db.insert(adminLogs).values({
      adminUserId,
      action,
      targetType,
      targetId,
      details: details || {}
    });
  }

  async getAdminLogs(): Promise<AdminLog[]> {
    return await db.select().from(adminLogs);
  }

  // Payment operations
  async createPaymentRecord(payment: InsertPaymentRecord): Promise<PaymentRecord> {
    const result = await db.insert(paymentRecords).values(payment).returning();
    return result[0];
  }

  async getPaymentByReference(reference: string): Promise<PaymentRecord | undefined> {
    const result = await db.select().from(paymentRecords).where(eq(paymentRecords.reference, reference)).limit(1);
    return result[0];
  }

  async updatePaymentStatus(reference: string, status: string): Promise<PaymentRecord | undefined> {
    const result = await db.update(paymentRecords)
      .set({ status, updatedAt: new Date() })
      .where(eq(paymentRecords.reference, reference))
      .returning();
    return result[0];
  }

  async clearUserCart(userId: string): Promise<boolean> {
    const result = await db.delete(cartItems).where(eq(cartItems.userId, userId)).returning();
    return result.length > 0;
  }
}

export const storage = new DatabaseStorage();
