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
  users,
  schools,
  memories,
  alumniRequests,
  notifications,
  yearPurchases,
  viewerYearPurchases,
  alumniRequestBlocks,
  students,
  yearbooks,
  yearbookPages,
  tableOfContents,
  alumniBadges,
  adminLogs
} from "../shared/schema";
import { randomUUID } from "crypto";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, and, sql } from "drizzle-orm";

// Database connection
const dbConnection = neon(process.env.DATABASE_URL!);
const db = drizzle(dbConnection);

// Alumni Badge types
type AlumniBadge = typeof alumniBadges.$inferSelect;
export type InsertAlumniBadge = Omit<AlumniBadge, "id" | "createdAt">;

// Storage interface
export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByPhoneNumber(phoneNumber: string): Promise<User | undefined>;
  validateUser(username: string, password: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserPrivacySettings(userId: string, updateData: { showPhoneToAlumni?: boolean; phoneNumber?: string }): Promise<User | undefined>;

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

  // Memory operations
  getMemoriesBySchoolAndYear(schoolId: string, year: number): Promise<Memory[]>;
  createMemory(memory: InsertMemory): Promise<Memory>;
  updateMemoryApprovalStatus(id: string, approved: boolean): Promise<Memory | undefined>;
  deleteMemory(id: string): Promise<boolean>;

  // Year purchase operations
  getYearPurchases(): Promise<YearPurchase[]>;
  getYearPurchasesBySchool(schoolId: string): Promise<YearPurchase[]>;
  createYearPurchase(purchase: InsertYearPurchase): Promise<YearPurchase>;
  updateYearPurchaseStatus(purchaseId: string, purchased: boolean): Promise<YearPurchase | undefined>;

  // Viewer Year Purchase operations
  getViewerYearPurchases(): Promise<ViewerYearPurchase[]>;
  getViewerYearPurchasesByUser(userId: string): Promise<ViewerYearPurchase[]>;
  getViewerYearPurchasesWithSchoolInfo(userId: string): Promise<any[]>;
  createViewerYearPurchase(purchase: InsertViewerYearPurchase): Promise<ViewerYearPurchase>;
  updateViewerYearPurchase(purchaseId: string, purchased: boolean): Promise<ViewerYearPurchase | undefined>;

  // Alumni request block operations
  createAlumniRequestBlock(block: InsertAlumniRequestBlock): Promise<AlumniRequestBlock>;
  getAlumniRequestBlocks(userId: string, schoolId: string): Promise<AlumniRequestBlock[]>;

  // Alumni request operations
  getAlumniRequests(): Promise<AlumniRequest[]>;
  getAlumniRequestsBySchool(schoolId: string): Promise<AlumniRequest[]>;
  getAlumniRequest(id: string): Promise<AlumniRequest | undefined>;
  getAlumniRequestById(requestId: string): Promise<AlumniRequest | undefined>;
  updateAlumniRequestStatus(requestId: string, status: string, reviewedBy: string, reviewNotes?: string): Promise<AlumniRequest | undefined>;
  hasExistingAlumniRequest(userId: string, schoolId: string): Promise<boolean>;
  getAlumniRequestsInLastWeek(userId: string): Promise<AlumniRequest[]>;
  createAlumniRequest(request: InsertAlumniRequest): Promise<AlumniRequest>;
  updateAlumniRequest(id: string, updates: Partial<AlumniRequest>): Promise<AlumniRequest | undefined>;
  deleteAlumniRequest(id: string): Promise<boolean>;

  // Alumni badge operations
  getAlumniBadges(): Promise<AlumniBadge[]>;
  getAlumniBadgesByUser(userId: string): Promise<AlumniBadge[]>;
  getAlumniBadgesBySchool(schoolId: string): Promise<AlumniBadge[]>;
  updateAlumniBadgeStatus(badgeId: string, status: "verified" | "pending"): Promise<AlumniBadge | undefined>;
  createAlumniBadge(badge: InsertAlumniBadge): Promise<AlumniBadge>;
  deleteAlumniBadge(id: string): Promise<boolean>;

  // Notification operations
  getNotificationsByUser(userId: string): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: string): Promise<boolean>;
  deleteNotification(id: string): Promise<boolean>;

  // Student operations
  createStudent(student: InsertStudent): Promise<Student>;
  getStudentsBySchool(schoolId: string): Promise<Student[]>;
  getStudentsBySchoolAndYear(schoolId: string, graduationYear: number): Promise<any[]>;

  // Yearbook operations
  getYearbooks(): Promise<Yearbook[]>;
  getYearbooksBySchool(schoolId: string): Promise<Yearbook[]>;
  getYearbook(id: string): Promise<Yearbook | undefined>;
  getPublishedYearbook(schoolId: string, year: number): Promise<Yearbook | undefined>;
  createYearbook(yearbook: InsertYearbook): Promise<Yearbook>;
  updateYearbookPublishStatus(yearbookId: string, isPublished: boolean): Promise<Yearbook | undefined>;
  
  // Yearbook page operations
  createYearbookPage(page: InsertYearbookPage): Promise<YearbookPage>;
  deleteYearbookPage(pageId: string): Promise<boolean>;
  updateYearbookPageOrder(pageId: string, newPageNumber: number): Promise<YearbookPage | undefined>;
  getNextPageNumber(yearbookId: string): Promise<number>;
  getYearbookPages(yearbookId: string): Promise<YearbookPage[]>;
  updateYearbookPage(id: string, updates: Partial<YearbookPage>): Promise<YearbookPage | undefined>;
  
  // Table of contents operations
  createTableOfContentsItem(item: InsertTableOfContents): Promise<TableOfContentsItem>;
  updateTableOfContentsItem(tocId: string, updates: Partial<TableOfContentsItem>): Promise<TableOfContentsItem | undefined>;
  deleteTableOfContentsItem(tocId: string): Promise<boolean>;
  
  // Super Admin operations
  getAllUsers(): Promise<User[]>;
  getAllSchools(): Promise<School[]>;
  getAllAlumniBadges(): Promise<AlumniBadge[]>;
  getAllAlumniRequests(): Promise<AlumniRequest[]>;
  getUserById(id: string): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  deleteSchool(id: string): Promise<boolean>;
  updateUserRole(id: string, userType: string): Promise<User | undefined>;
  logAdminAction(adminUserId: string, action: string, targetType: string, targetId: string, details?: Record<string, any>): Promise<void>;
  getAdminLogs(): Promise<AdminLog[]>;
}

// Database Storage Implementation - All operations use PostgreSQL database
export class DatabaseStorage implements IStorage {
  
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username.toLowerCase())).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
    return result[0];
  }

  async getUserByPhoneNumber(phoneNumber: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.phoneNumber, phoneNumber)).limit(1);
    return result[0];
  }

  async validateUser(username: string, password: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(
      and(eq(users.username, username), eq(users.password, password))
    ).limit(1);
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const fullName = `${user.firstName}${user.middleName ? ' ' + user.middleName : ''} ${user.lastName}`;
    const newUser = { ...user, fullName };
    const result = await db.insert(users).values(newUser).returning();
    return result[0];
  }

  async updateUserPrivacySettings(userId: string, updateData: { showPhoneToAlumni?: boolean; phoneNumber?: string }): Promise<User | undefined> {
    const result = await db.update(users).set(updateData).where(eq(users.id, userId)).returning();
    return result.length > 0 ? result[0] : undefined;
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

  async getSchoolByActivationCode(activationCode: string): Promise<School | undefined> {
    const result = await db.select().from(schools).where(eq(schools.activationCode, activationCode)).limit(1);
    return result[0];
  }

  async getSchoolByAdminUserId(userId: string): Promise<School | undefined> {
    const result = await db.select().from(schools).where(eq(schools.id, userId)).limit(1);
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

  async getPendingSchools(): Promise<School[]> {
    return await db.select().from(schools).where(eq(schools.approvalStatus, 'pending'));
  }

  async approveSchool(schoolId: string, approvedBy: string, activationCode: string): Promise<School | undefined> {
    const result = await db.update(schools)
      .set({ 
        approvalStatus: 'approved',
        approvedBy,
        approvedAt: new Date(),
        activationCode
      })
      .where(eq(schools.id, schoolId))
      .returning();
    return result[0];
  }

  async rejectSchool(schoolId: string, rejectedBy: string, reason: string): Promise<School | undefined> {
    const result = await db.update(schools)
      .set({ 
        approvalStatus: 'rejected',
        rejectionReason: reason
      })
      .where(eq(schools.id, schoolId))
      .returning();
    return result[0];
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

  async updateMemoryApprovalStatus(id: string, approved: boolean): Promise<Memory | undefined> {
    const result = await db.update(memories).set({ approved }).where(eq(memories.id, id)).returning();
    return result[0];
  }

  async deleteMemory(id: string): Promise<boolean> {
    const result = await db.delete(memories).where(eq(memories.id, id)).returning();
    return result.length > 0;
  }

  // Year purchase operations
  async getYearPurchases(): Promise<YearPurchase[]> {
    return await db.select().from(yearPurchases);
  }

  async getYearPurchasesBySchool(schoolId: string): Promise<YearPurchase[]> {
    return await db.select().from(yearPurchases).where(eq(yearPurchases.schoolId, schoolId));
  }

  async createYearPurchase(purchase: InsertYearPurchase): Promise<YearPurchase> {
    const result = await db.insert(yearPurchases).values(purchase).returning();
    return result[0];
  }

  async updateYearPurchaseStatus(purchaseId: string, purchased: boolean): Promise<YearPurchase | undefined> {
    const result = await db.update(yearPurchases)
      .set({ 
        purchased, 
        purchaseDate: purchased ? new Date() : null 
      })
      .where(eq(yearPurchases.id, purchaseId))
      .returning();
    return result[0];
  }

  // Viewer Year Purchase operations
  async getViewerYearPurchases(): Promise<ViewerYearPurchase[]> {
    return await db.select().from(viewerYearPurchases);
  }

  async getViewerYearPurchasesByUser(userId: string): Promise<ViewerYearPurchase[]> {
    return await db.select().from(viewerYearPurchases).where(eq(viewerYearPurchases.viewerId, userId));
  }

  async getViewerYearPurchasesWithSchoolInfo(userId: string): Promise<any[]> {
    const purchases = await db.select().from(viewerYearPurchases).where(eq(viewerYearPurchases.viewerId, userId));
    
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

  async createAlumniRequestBlock(block: InsertAlumniRequestBlock): Promise<AlumniRequestBlock> {
    const result = await db.insert(alumniRequestBlocks).values(block).returning();
    return result[0];
  }

  async getAlumniRequestBlocks(userId: string, schoolId: string): Promise<AlumniRequestBlock[]> {
    const result = await db.select().from(alumniRequestBlocks).where(
      and(
        eq(alumniRequestBlocks.userId, userId),
        eq(alumniRequestBlocks.schoolId, schoolId)
      )
    );
    return result.filter(block => new Date() < new Date(block.blockedUntil));
  }

  async getAlumniRequests(): Promise<AlumniRequest[]> {
    return await db.select().from(alumniRequests);
  }

  async getYearbookPages(yearbookId: string): Promise<YearbookPage[]> {
    return await db.select().from(yearbookPages).where(eq(yearbookPages.yearbookId, yearbookId));
  }

  async updateYearbookPage(id: string, updates: Partial<YearbookPage>): Promise<YearbookPage | undefined> {
    const result = await db.update(yearbookPages)
      .set(updates)
      .where(eq(yearbookPages.id, id))
      .returning();
    return result[0];
  }

  async getAlumniRequestsBySchool(schoolId: string): Promise<AlumniRequest[]> {
    return await db.select().from(alumniRequests).where(eq(alumniRequests.schoolId, schoolId));
  }

  async getAlumniRequest(id: string): Promise<AlumniRequest | undefined> {
    const result = await db.select().from(alumniRequests).where(eq(alumniRequests.id, id)).limit(1);
    return result[0];
  }

  async getAlumniRequestById(requestId: string): Promise<AlumniRequest | undefined> {
    const result = await db.select().from(alumniRequests).where(eq(alumniRequests.id, requestId)).limit(1);
    return result[0];
  }

  async updateAlumniRequestStatus(requestId: string, status: string, reviewedBy: string, reviewNotes?: string): Promise<AlumniRequest | undefined> {
    const result = await db.update(alumniRequests)
      .set({
        status,
        reviewedBy,
        reviewedAt: new Date(),
        reviewNotes: reviewNotes || null
      })
      .where(eq(alumniRequests.id, requestId))
      .returning();
    return result[0];
  }

  async hasExistingAlumniRequest(userId: string, schoolId: string): Promise<boolean> {
    const result = await db.select().from(alumniRequests).where(
      and(
        eq(alumniRequests.userId, userId),
        eq(alumniRequests.schoolId, schoolId),
        eq(alumniRequests.status, 'pending')
      )
    ).limit(1);
    return result.length > 0;
  }

  async getAlumniRequestsInLastWeek(userId: string): Promise<AlumniRequest[]> {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const result = await db.select().from(alumniRequests).where(eq(alumniRequests.userId, userId));
    return result.filter(request => 
      request.createdAt && new Date(request.createdAt) >= oneWeekAgo
    );
  }

  async createAlumniRequest(request: InsertAlumniRequest): Promise<AlumniRequest> {
    const result = await db.insert(alumniRequests).values(request).returning();
    return result[0];
  }

  async updateAlumniRequest(id: string, updates: Partial<AlumniRequest>): Promise<AlumniRequest | undefined> {
    const result = await db.update(alumniRequests)
      .set(updates)
      .where(eq(alumniRequests.id, id))
      .returning();
    return result[0];
  }

  async deleteAlumniRequest(id: string): Promise<boolean> {
    const result = await db.delete(alumniRequests).where(eq(alumniRequests.id, id)).returning();
    return result.length > 0;
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
    return await db.select().from(notifications).where(eq(notifications.userId, userId));
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const result = await db.insert(notifications).values(notification).returning();
    return result[0];
  }

  async markNotificationAsRead(id: string): Promise<boolean> {
    const result = await db.update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id))
      .returning();
    return result.length > 0;
  }

  async deleteNotification(id: string): Promise<boolean> {
    const result = await db.delete(notifications).where(eq(notifications.id, id)).returning();
    return result.length > 0;
  }

  async createStudent(student: InsertStudent): Promise<Student> {
    const result = await db.insert(students).values(student).returning();
    return result[0];
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

  // Yearbook operations
  async getYearbooks(): Promise<Yearbook[]> {
    return await db.select().from(yearbooks);
  }

  async getYearbooksBySchool(schoolId: string): Promise<Yearbook[]> {
    return await db.select().from(yearbooks).where(eq(yearbooks.schoolId, schoolId));
  }

  async getYearbook(id: string): Promise<Yearbook | undefined> {
    const result = await db.select().from(yearbooks).where(eq(yearbooks.id, id)).limit(1);
    return result[0];
  }

  async getPublishedYearbook(schoolId: string, year: number): Promise<Yearbook | undefined> {
    const result = await db.select().from(yearbooks).where(
      and(
        eq(yearbooks.schoolId, schoolId),
        eq(yearbooks.year, year),
        eq(yearbooks.isPublished, true)
      )
    ).limit(1);
    return result[0];
  }

  async createYearbook(yearbook: InsertYearbook): Promise<Yearbook> {
    const result = await db.insert(yearbooks).values(yearbook).returning();
    return result[0];
  }

  async updateYearbookPublishStatus(yearbookId: string, isPublished: boolean): Promise<Yearbook | undefined> {
    const result = await db.update(yearbooks)
      .set({ isPublished })
      .where(eq(yearbooks.id, yearbookId))
      .returning();
    return result[0];
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
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
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
}

export const storage = new DatabaseStorage();
