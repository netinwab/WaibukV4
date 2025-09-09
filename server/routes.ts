import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import { promises as fs } from "fs";
import { storage } from "./storage";
import { insertUserSchema, insertSchoolSchema, insertMemorySchema } from "@shared/schema";
import { CURRENT_YEAR } from "@shared/constants";

// Force reload constants to avoid caching issues
console.log(`Server startup: CURRENT_YEAR = ${CURRENT_YEAR}`);

// Ensure upload directories exist
const ensureUploadDirs = async () => {
  const dirs = [
    'public/uploads/accreditation',
    'public/uploads/yearbooks',
    'public/uploads/profiles',
    'public/uploads/memories'
  ];
  
  for (const dir of dirs) {
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch (error) {
      // Directory might already exist, ignore error
    }
  }
};

// Super Admin Authentication Middleware
const requireSuperAdmin = async (req: any, res: any, next: any) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Super admin access denied' });
    }

    const userId = authHeader.substring(7); // Remove 'Bearer ' prefix
    const user = await storage.getUserById(userId);
    
    if (!user || user.userType !== 'super_admin') {
      return res.status(403).json({ message: 'Super admin privileges required' });
    }

    req.superAdmin = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid authentication' });
  }
};

// Configure multer for file uploads
const storage_multer = multer.diskStorage({
  destination: (req, file, cb) => {
    // Different destinations based on field name
    if (file.fieldname === 'accreditationDocument') {
      cb(null, 'public/uploads/accreditation');
    } else if (file.fieldname === 'memoryFile') {
      cb(null, 'public/uploads/memories');
    } else {
      cb(null, 'public/uploads/yearbooks');
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    if (file.fieldname === 'accreditationDocument') {
      cb(null, `accreditation-${uniqueSuffix}${path.extname(file.originalname)}`);
    } else if (file.fieldname === 'memoryFile') {
      cb(null, `memory-${uniqueSuffix}${path.extname(file.originalname)}`);
    } else {
      cb(null, `yearbook-page-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
  }
});

const upload = multer({ 
  storage: storage_multer,
  limits: {
    fileSize: 20 * 1024 * 1024 // 20MB limit to support videos
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || 
        file.mimetype.startsWith('video/') || 
        file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only image, video, and PDF files are allowed'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Ensure upload directories exist
  await ensureUploadDirs();
  // Serve uploaded files statically
  app.use('/uploads', express.static('public/uploads'));
  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password, userType, schoolCode } = req.body;
      
      // Try to find user by username first, then by email
      let user = await storage.getUserByUsername(username.toLowerCase());
      if (!user) {
        // Check if the input looks like an email and try to find by email
        if (username.includes('@')) {
          user = await storage.getUserByEmail(username.toLowerCase());
        }
      }
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      if (user.userType !== userType) {
        return res.status(401).json({ message: `This account is registered as ${user.userType}, but you selected ${userType}. Please select the correct account type.` });
      }

      // For school accounts, validate school code and approval status
      if (userType === "school" && user.schoolId) {
        const school = await storage.getSchoolById(user.schoolId);
        if (!school) {
          return res.status(401).json({ message: "School not found" });
        }
        
        if (school.approvalStatus !== 'approved') {
          return res.status(403).json({ 
            message: "School account is pending approval. Please wait for super admin approval before logging in.",
            approvalStatus: school.approvalStatus
          });
        }
        
        // If schoolCode is provided, validate it matches
        if (schoolCode && school.schoolCode !== schoolCode) {
          return res.status(401).json({ message: "Invalid school code" });
        }
      }

      // Return user info (excluding password)
      const { password: _, ...userInfo } = user;
      res.json({ user: userInfo });
    } catch (error) {
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Password verification endpoint
  app.post("/api/auth/verify-password", async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await storage.validateUser(username, password);
      
      if (user) {
        res.json({ verified: true });
      } else {
        res.json({ verified: false });
      }
    } catch (error) {
      console.error("Password verification error:", error);
      res.status(500).json({ message: "Verification failed" });
    }
  });

  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { username, password, userType, firstName, middleName, lastName, dateOfBirth, email, phoneNumber, schoolCode } = req.body;
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      // Check if phone number already exists (if provided)
      if (phoneNumber && phoneNumber.trim() !== "") {
        const existingUserWithPhone = await storage.getUserByPhoneNumber(phoneNumber);
        if (existingUserWithPhone) {
          return res.status(400).json({ message: "This phone number is already registered with another account" });
        }
      }
      
      // For school accounts, validate school code
      if (userType === "school" && schoolCode) {
        const school = await storage.getSchoolByCode(schoolCode);
        if (!school) {
          return res.status(400).json({ message: "Invalid school code" });
        }
      }
      
      const user = await storage.createUser({
        username: username.toLowerCase(),
        password,
        userType,
        firstName,
        middleName: middleName || null,
        lastName,
        dateOfBirth,
        email: email || null,
        phoneNumber: phoneNumber || null,
        profileImage: null,
      });
      
      // Return user info (excluding password)
      const { password: _, ...userInfo } = user;
      res.json({ user: userInfo, message: "Account created successfully" });
    } catch (error) {
      res.status(500).json({ message: "Signup failed" });
    }
  });

  // School registration route - Creates registration request only, no user account
  app.post("/api/auth/school-register", upload.single('accreditationDocument'), async (req, res) => {
    try {
      const { username, password, schoolName, country, state, city, email, address, yearFounded, registrationNumber } = req.body;
      
      // Validate required fields
      if (!username || !password || !schoolName || !country || !city || !email || !yearFounded) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      // Check if username already exists (reserved for when account is created)
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      // Check if school with this email already has a request
      const existingSchool = await storage.getSchoolByEmail(email);
      if (existingSchool) {
        return res.status(400).json({ message: "A school registration with this email already exists" });
      }
      
      // Generate 10-digit alphanumeric school code
      const generateSchoolCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 10; i++) {
          result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
      };
      
      let schoolCode = generateSchoolCode();
      // Ensure school code is unique
      while (await storage.getSchoolByCode(schoolCode)) {
        schoolCode = generateSchoolCode();
      }
      
      // Handle accreditation document upload
      let accreditationDocumentPath = null;
      if (req.file) {
        // Ensure the file was actually saved successfully
        try {
          await fs.access(req.file.path);
          accreditationDocumentPath = req.file.path;
        } catch (err) {
          console.error("File upload failed:", err);
          // Continue with registration without document
        }
      }
      
      // Create school registration request with temporary admin credentials - NO USER ACCOUNT YET
      const school = await storage.createSchool({
        name: schoolName,
        address: address || null,
        country,
        state: state || null,
        city,
        email,
        schoolCode,
        yearFounded: parseInt(yearFounded),
        registrationNumber: registrationNumber || null,
        accreditationDocument: accreditationDocumentPath,
        tempAdminCredentials: {
          username,
          password,
          firstName: schoolName,
          lastName: "Administrator"
        }
      });
      
      res.json({ 
        school: {
          id: school.id,
          name: school.name,
          email: school.email,
          approvalStatus: school.approvalStatus
        },
        message: "School registration submitted for approval. No account has been created yet - please wait for super admin approval before attempting to log in." 
      });
    } catch (error) {
      console.error("School registration error:", error);
      res.status(500).json({ message: "School registration failed" });
    }
  });

  // User routes
  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const { password: _, ...userInfo } = user;
      res.json(userInfo);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  // School routes
  app.get("/api/schools", async (req, res) => {
    try {
      // Only return approved schools for public access (viewer/alumni accounts)
      const schools = await storage.getApprovedSchools();
      res.json(schools);
    } catch (error) {
      res.status(500).json({ message: "Failed to get schools" });
    }
  });
  app.get("/api/alumni-badges/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const badges = await storage.getAlumniBadgesByUser(userId);
      res.json(badges);
    } catch (error) {
      console.error("Error fetching alumni badges:", error);
      res.status(500).json({ message: "Failed to get alumni badges" });
    }
  });

  // Get alumni badges by school
  app.get("/api/alumni-badges/school/:schoolId", async (req, res) => {
    try {
      const { schoolId } = req.params;
      const badges = await storage.getAlumniBadgesBySchool(schoolId);
      res.json(badges);
    } catch (error) {
      console.error("Error fetching alumni badges by school:", error);
      res.status(500).json({ message: "Failed to get alumni badges" });
    }
  });



  // Create alumni badge request
  app.post("/api/alumni-badges", async (req, res) => {
    try {
      const { userId, school, admissionYear, graduationYear } = req.body;
      
      if (!userId || !school || !admissionYear || !graduationYear) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Get user information for fullName
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const badge = await storage.createAlumniBadge({
        userId,
        school,
        fullName: user.fullName,
        admissionYear,
        graduationYear,
        status: "pending"
      });

      res.status(201).json(badge);
    } catch (error) {
      console.error("Error creating alumni badge:", error);
      res.status(500).json({ message: "Failed to create alumni badge request" });
    }
  });

  // Delete alumni badge
  app.delete("/api/alumni-badges/:badgeId", async (req, res) => {
    try {
      const { badgeId } = req.params;
      
      // Get badge info before deletion for blocking
      const badge = await storage.getAlumniBadgesByUser(""); // This isn't ideal, need to improve this
      const badgeToDelete = Array.from(badge).find(b => b.id === badgeId);
      
      const success = await storage.deleteAlumniBadge(badgeId);
      
      if (!success) {
        return res.status(404).json({ message: "Alumni badge not found" });
      }
      
      // Create 3-month block if badge was deleted
      if (badgeToDelete) {
        const blockedUntil = new Date();
        blockedUntil.setMonth(blockedUntil.getMonth() + 3);
        
        // Find school by name to get schoolId
        const schools = await storage.getSchools();
        const school = schools.find(s => s.name === badgeToDelete.school);
        
        if (school) {
          await storage.createAlumniRequestBlock({
            userId: badgeToDelete.userId,
            schoolId: school.id,
            blockedUntil,
            reason: "badge_deleted"
          });
        }
      }
      
      res.json({ message: "Alumni badge deleted successfully" });
    } catch (error) {
      console.error("Error deleting alumni badge:", error);
      res.status(500).json({ message: "Failed to delete alumni badge" });
    }
  });

  // Alumni request routes
  app.get("/api/alumni-requests/school/:schoolId", async (req, res) => {
    try {
      const { schoolId } = req.params;
      const requests = await storage.getAlumniRequestsBySchool(schoolId);
      res.json(requests);
    } catch (error) {
      console.error("Error fetching alumni requests:", error);
      res.status(500).json({ message: "Failed to get alumni requests" });
    }
  });

  // Get count of pending alumni requests for a school
  app.get("/api/alumni-requests/school/:schoolId/count", async (req, res) => {
    try {
      const { schoolId } = req.params;
      const requests = await storage.getAlumniRequestsBySchool(schoolId);
      const pendingCount = requests.filter(r => r.status === 'pending').length;
      res.json({ pendingCount });
    } catch (error) {
      console.error("Error fetching alumni request count:", error);
      res.status(500).json({ message: "Failed to get alumni request count" });
    }
  });

  app.post("/api/alumni-requests", async (req, res) => {
    try {
      const requestData = req.body;
      
      if (!requestData.userId || !requestData.schoolId || !requestData.fullName || !requestData.admissionYear || !requestData.graduationYear) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Check for existing alumni request for the same school (duplicate prevention)
      const hasExistingRequest = await storage.hasExistingAlumniRequest(requestData.userId, requestData.schoolId);
      if (hasExistingRequest) {
        return res.status(400).json({ message: "You already have a pending alumni request for this school" });
      }

      // Check for request blocks (3-month blocking after badge deletion)
      const blocks = await storage.getAlumniRequestBlocks(requestData.userId, requestData.schoolId);
      if (blocks.length > 0) {
        const latestBlock = blocks[0];
        return res.status(400).json({ 
          message: `You cannot make alumni requests to this school until ${new Date(latestBlock.blockedUntil).toLocaleDateString()}`
        });
      }

      // Check for existing badge from same school (prevent duplicates)
      const school = await storage.getSchool(requestData.schoolId);
      if (school) {
        const existingBadges = await storage.getAlumniBadgesByUser(requestData.userId);
        const duplicateSchoolBadge = existingBadges.find(badge => badge.school === school.name);
        if (duplicateSchoolBadge) {
          return res.status(400).json({ message: `You already have an alumni badge for ${school.name}. You cannot have multiple badges from the same school.` });
        }

        // Check badge limit (max 4 badges total including pending)
        if (existingBadges.length >= 4) {
          return res.status(400).json({ message: "You have reached the maximum number of alumni badges (4). Please upgrade your account to add more alumni statuses." });
        }
      }

      // Check rate limiting (max 10 requests per week)
      const recentRequests = await storage.getAlumniRequestsInLastWeek(requestData.userId);
      if (recentRequests.length >= 10) {
        return res.status(429).json({ message: "You've made too many requests, try again later" });
      }

      const request = await storage.createAlumniRequest(requestData);
      
      // Create a pending badge immediately when request is sent
      if (school) {
        // Get user information for fullName
        const user = await storage.getUser(requestData.userId);
        console.log('Looking up user with ID:', requestData.userId, 'Found:', !!user);
        if (user) {
          await storage.createAlumniBadge({
            userId: requestData.userId,
            school: school.name,
            fullName: user.fullName,
            admissionYear: requestData.admissionYear,
            graduationYear: requestData.graduationYear,
            status: "pending"
          });
        } else {
          console.error('User not found for ID:', requestData.userId);
          return res.status(400).json({ message: "User not found for alumni badge creation" });
        }
      }
      
      // Create notification for the user
      await storage.createNotification({
        userId: requestData.userId,
        type: "alumni_request_sent",
        title: "Alumni Status Request Sent",
        message: `Alumni status request successfully sent to ${school?.name || 'the school'}`,
        isRead: false,
        relatedId: request.id,
      });
      
      res.status(201).json(request);
    } catch (error) {
      console.error("Error creating alumni request:", error);
      res.status(500).json({ message: "Failed to create alumni request" });
    }
  });

  app.patch("/api/alumni-requests/:requestId/approve", async (req, res) => {
    try {
      const { requestId } = req.params;
      const { reviewedBy, reviewNotes } = req.body;
      
      // Get the request first before updating
      const request = await storage.getAlumniRequestById(requestId);
      if (!request) {
        return res.status(404).json({ message: "Alumni request not found" });
      }

      // Update the existing pending badge to verified status
      const school = await storage.getSchool(request.schoolId);
      if (school) {
        const userBadges = await storage.getAlumniBadgesByUser(request.userId);
        const pendingBadge = userBadges.find(badge => 
          badge.school === school.name && 
          badge.status === 'pending' &&
          badge.admissionYear === request.admissionYear &&
          badge.graduationYear === request.graduationYear
        );
        
        if (pendingBadge) {
          await storage.updateAlumniBadgeStatus(pendingBadge.id, "verified");
          
          // Create a student record so this person appears in Alumni classmate searches
          // For non-graduating alumni, use a special value (-1) to represent "did not graduate"
          let graduationYear: number;
          if (request.graduationYear.toLowerCase().includes('did not graduate')) {
            graduationYear = -1; // Special value for non-graduating alumni
          } else {
            graduationYear = parseInt(request.graduationYear);
          }
          
          await storage.createStudent({
            schoolId: request.schoolId,
            fullName: request.fullName,
            graduationYear: graduationYear,
            admissionYear: request.admissionYear ? parseInt(request.admissionYear) : null,
            profileImage: null // Will be updated later if user has profile image
          });
        }
      }

      // Create notification for the user
      await storage.createNotification({
        userId: request.userId,
        type: "alumni_approved",
        title: "Alumni Status Approved!",
        message: `Your alumni status request has been approved. You now have alumni access to memories and content.`,
        isRead: false,
        relatedId: requestId,
      });

      // DELETE the approved request so it moves to current alumni list
      await storage.deleteAlumniRequest(requestId);
      
      res.json({ message: "Alumni request approved successfully", request });
    } catch (error) {
      console.error("Error approving alumni request:", error);
      res.status(500).json({ message: "Failed to approve alumni request" });
    }
  });

  app.patch("/api/alumni-requests/:requestId/deny", async (req, res) => {
    try {
      const { requestId } = req.params;
      const { reviewedBy, reviewNotes } = req.body;
      
      const updatedRequest = await storage.updateAlumniRequestStatus(requestId, "denied", reviewedBy, reviewNotes);
      
      if (!updatedRequest) {
        return res.status(404).json({ message: "Alumni request not found" });
      }

      // Delete the pending badge since request was denied
      const request = await storage.getAlumniRequestById(requestId);
      if (request) {
        const school = await storage.getSchool(request.schoolId);
        
        // Find and delete the pending badge
        if (school) {
          const userBadges = await storage.getAlumniBadgesByUser(request.userId);
          const pendingBadge = userBadges.find(badge => 
            badge.school === school.name && 
            badge.status === 'pending' &&
            badge.admissionYear === request.admissionYear &&
            badge.graduationYear === request.graduationYear
          );
          
          if (pendingBadge) {
            await storage.deleteAlumniBadge(pendingBadge.id);
          }
        }

        // Create notification for the user
        await storage.createNotification({
          userId: request.userId,
          type: "alumni_denied",
          title: "Alumni Status Denied",
          message: `Your alumni request to ${school?.name || 'the school'} has been denied.${reviewNotes ? ` Reason: ${reviewNotes}` : ''}`,
          isRead: false,
          relatedId: requestId,
        });
      }
      
      res.json(updatedRequest);
    } catch (error) {
      console.error("Error denying alumni request:", error);
      res.status(500).json({ message: "Failed to deny alumni request" });
    }
  });

  // Notification routes
  app.get("/api/notifications/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const notifications = await storage.getNotificationsByUser(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to get notifications" });
    }
  });

  app.patch("/api/notifications/:notificationId/read", async (req, res) => {
    try {
      const { notificationId } = req.params;
      const success = await storage.markNotificationAsRead(notificationId);
      
      if (!success) {
        return res.status(404).json({ message: "Notification not found" });
      }
      
      res.json({ message: "Notification marked as read" });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });
  




  
  app.get("/api/schools/:id", async (req, res) => {
    try {
      // First try to get school directly by ID
      let school = await storage.getSchool(req.params.id);
      
      // If not found, try to get school by admin user ID
      if (!school) {
        school = await storage.getSchoolByAdminUserId(req.params.id);
      }
      
      if (!school) {
        return res.status(404).json({ message: "School not found" });
      }
      res.json(school);
    } catch (error) {
      console.error("Error in /api/schools/:id:", error);
      res.status(500).json({ message: "Failed to get school" });
    }
  });

  // Update school profile
  app.patch("/api/schools/:id", async (req, res) => {
    try {
      const { address, state, email, city } = req.body;
      const schoolId = req.params.id;
      
      // Validate that only optional fields are being updated
      const updateData: any = {};
      if (address !== undefined) updateData.address = address;
      if (state !== undefined) updateData.state = state;
      if (email !== undefined) updateData.email = email;
      if (city !== undefined) updateData.city = city;
      
      const updatedSchool = await storage.updateSchoolProfile(schoolId, updateData);
      
      if (!updatedSchool) {
        return res.status(404).json({ message: "School not found" });
      }
      
      res.json(updatedSchool);
    } catch (error) {
      console.error("Error updating school profile:", error);
      res.status(500).json({ message: "Failed to update school profile" });
    }
  });

  // Update user privacy settings and profile
  app.patch("/api/users/:id", async (req, res) => {
    try {
      const { showPhoneToAlumni, phoneNumber } = req.body;
      const userId = req.params.id;
      
      // Validate that only allowed fields are being updated
      const updateData: any = {};
      if (showPhoneToAlumni !== undefined) updateData.showPhoneToAlumni = showPhoneToAlumni;
      if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
      
      const updatedUser = await storage.updateUserPrivacySettings(userId, updateData);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Return user without password
      const { password, ...safeUser } = updatedUser;
      res.json(safeUser);
    } catch (error) {
      console.error("Error updating user privacy settings:", error);
      res.status(500).json({ message: "Failed to update user privacy settings" });
    }
  });


  // Memory routes
  app.get("/api/memories/school/:schoolId/:year", async (req, res) => {
    try {
      const { schoolId, year } = req.params;
      const memories = await storage.getMemoriesBySchoolAndYear(schoolId, parseInt(year));
      res.json(memories);
    } catch (error) {
      res.status(500).json({ message: "Failed to get memories" });
    }
  });

  app.post("/api/memories", upload.single('memoryFile'), async (req, res) => {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const { title, description, eventDate, year, category, schoolId } = req.body;
      
      // Determine media type and URL based on file type
      const mediaType = file.mimetype.startsWith('video/') ? 'video' : 'image';
      const mediaUrl = `/uploads/memories/${file.filename}`;
      
      // Create memory object
      const memoryData = {
        schoolId,
        title,
        description: description || null,
        imageUrl: mediaType === 'image' ? mediaUrl : null,
        videoUrl: mediaType === 'video' ? mediaUrl : null,
        mediaType,
        eventDate,
        year: parseInt(year),
        category: category || null,
        tags: []
      };

      // Validate the data
      const validatedData = insertMemorySchema.parse(memoryData);
      
      // Create the memory
      const memory = await storage.createMemory(validatedData);
      
      res.status(201).json(memory);
    } catch (error) {
      console.error("Error creating memory:", error);
      res.status(500).json({ message: "Failed to create memory" });
    }
  });

  // Year purchase routes for schools
  app.get("/api/year-purchases/school/:schoolId", async (req, res) => {
    try {
      const { schoolId } = req.params;
      const purchases = await storage.getYearPurchasesBySchool(schoolId);
      res.json(purchases);
    } catch (error) {
      console.error("Error fetching year purchases:", error);
      res.status(500).json({ message: "Failed to get year purchases" });
    }
  });

  app.post("/api/year-purchases", async (req, res) => {
    try {
      const purchaseData = req.body;
      
      // Convert purchaseDate string to Date object if needed
      if (purchaseData.purchaseDate && typeof purchaseData.purchaseDate === 'string') {
        purchaseData.purchaseDate = new Date(purchaseData.purchaseDate);
      }
      
      const purchase = await storage.createYearPurchase(purchaseData);
      res.status(201).json(purchase);
    } catch (error) {
      console.error("Error creating year purchase:", error);
      res.status(500).json({ message: "Failed to create year purchase" });
    }
  });

  app.patch("/api/year-purchases/:purchaseId", async (req, res) => {
    try {
      const { purchaseId } = req.params;
      const { purchased } = req.body;
      const updatedPurchase = await storage.updateYearPurchase(purchaseId, purchased);
      
      if (!updatedPurchase) {
        return res.status(404).json({ message: "Year purchase not found" });
      }
      
      res.json(updatedPurchase);
    } catch (error) {
      console.error("Error updating year purchase:", error);
      res.status(500).json({ message: "Failed to update year purchase" });
    }
  });

  // Viewer year purchase routes
  app.get("/api/viewer-year-purchases/:userId/:schoolId", async (req, res) => {
    try {
      const { userId, schoolId } = req.params;
      const purchases = await storage.getViewerYearPurchases(userId, schoolId);
      res.json(purchases);
    } catch (error) {
      console.error("Error fetching viewer year purchases:", error);
      res.status(500).json({ message: "Failed to get viewer year purchases" });
    }
  });

  // Get all purchased yearbooks for a user (for Library feature)
  app.get("/api/viewer-year-purchases/user/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const purchases = await storage.getAllViewerYearPurchases(userId);
      res.json(purchases);
    } catch (error) {
      console.error("Error fetching all viewer year purchases:", error);
      res.status(500).json({ message: "Failed to get all viewer year purchases" });
    }
  });

  // Students API routes
  app.get("/api/students/:schoolId/:graduationYear", async (req, res) => {
    try {
      const { schoolId, graduationYear } = req.params;
      if (graduationYear === "did-not-graduate") {
        // Get alumni who did not graduate (stored with graduationYear = -1)
        const students = await storage.getStudentsBySchoolAndYear(schoolId, -1);
        res.json(students);
        return;
      }
      const students = await storage.getStudentsBySchoolAndYear(schoolId, parseInt(graduationYear));
      res.json(students);
    } catch (error) {
      console.error("Error fetching students:", error);
      res.status(500).json({ message: "Failed to get students" });
    }
  });

  // New endpoint to search students across all years for a school
  app.get("/api/students/:schoolId/search", async (req, res) => {
    try {
      const { schoolId } = req.params;
      const students = await storage.getStudentsBySchool(schoolId);
      res.json(students);
    } catch (error) {
      console.error("Error fetching students:", error);
      res.status(500).json({ message: "Failed to get students" });
    }
  });

  app.post("/api/students", async (req, res) => {
    try {
      const student = await storage.createStudent(req.body);
      res.json(student);
    } catch (error) {
      console.error("Error creating student:", error);
      res.status(500).json({ message: "Failed to create student" });
    }
  });

  app.post("/api/viewer-year-purchases", async (req, res) => {
    try {
      const purchaseData = req.body;
      
      // Convert purchaseDate string to Date object if needed
      if (purchaseData.purchaseDate && typeof purchaseData.purchaseDate === 'string') {
        purchaseData.purchaseDate = new Date(purchaseData.purchaseDate);
      }
      
      const purchase = await storage.createViewerYearPurchase(purchaseData);
      res.status(201).json(purchase);
    } catch (error) {
      console.error("Error creating viewer year purchase:", error);
      res.status(500).json({ message: "Failed to create viewer year purchase" });
    }
  });

  app.patch("/api/viewer-year-purchases/:purchaseId", async (req, res) => {
    try {
      const { purchaseId } = req.params;
      const { purchased } = req.body;
      const updatedPurchase = await storage.updateViewerYearPurchase(purchaseId, purchased);
      
      if (!updatedPurchase) {
        return res.status(404).json({ message: "Viewer year purchase not found" });
      }
      
      res.json(updatedPurchase);
    } catch (error) {
      console.error("Error updating viewer year purchase:", error);
      res.status(500).json({ message: "Failed to update viewer year purchase" });
    }
  });

  // Yearbook management routes
  app.get("/api/yearbooks/:schoolId/:year", async (req, res) => {
    try {
      const { schoolId, year } = req.params;
      const yearbook = await storage.getYearbookBySchoolAndYear(schoolId, parseInt(year));
      if (!yearbook) {
        return res.status(404).json({ message: "Yearbook not found" });
      }
      res.json(yearbook);
    } catch (error) {
      console.error("Error fetching yearbook:", error);
      res.status(500).json({ message: "Failed to get yearbook" });
    }
  });

  // Route for viewers to get only published yearbooks
  app.get("/api/published-yearbooks/:schoolId/:year", async (req, res) => {
    try {
      const { schoolId, year } = req.params;
      const yearbook = await storage.getPublishedYearbook(schoolId, parseInt(year));
      if (!yearbook) {
        return res.status(404).json({ message: "Published yearbook not found" });
      }
      res.json(yearbook);
    } catch (error) {
      console.error("Error fetching published yearbook:", error);
      res.status(500).json({ message: "Failed to get published yearbook" });
    }
  });

  // New efficient endpoint to get ALL published yearbooks for a school
  app.get("/api/published-yearbooks-list/:schoolId", async (req, res) => {
    try {
      const { schoolId } = req.params;
      const publishedYearbooks = await storage.getAllPublishedYearbooks(schoolId);
      res.json(publishedYearbooks);
    } catch (error) {
      console.error("Error fetching all published yearbooks:", error);
      res.status(500).json({ message: "Failed to get published yearbooks" });
    }
  });

  app.post("/api/yearbooks", async (req, res) => {
    try {
      const yearbook = await storage.createYearbook(req.body);
      res.status(201).json(yearbook);
    } catch (error) {
      console.error("Error creating yearbook:", error);
      res.status(500).json({ message: "Failed to create yearbook" });
    }
  });

  app.patch("/api/yearbooks/:yearbookId/publish", async (req, res) => {
    try {
      const { yearbookId } = req.params;
      const { isPublished } = req.body;
      const yearbook = await storage.updateYearbookPublishStatus(yearbookId, isPublished);
      if (!yearbook) {
        return res.status(404).json({ message: "Yearbook not found" });
      }
      res.json(yearbook);
    } catch (error) {
      console.error("Error updating yearbook:", error);
      res.status(500).json({ message: "Failed to update yearbook" });
    }
  });

  app.post("/api/yearbooks/:yearbookId/upload-page", upload.single('file'), async (req, res) => {
    try {
      const { yearbookId } = req.params;
      const { pageType, title } = req.body;
      
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      // For covers, delete existing cover first to enable replacement
      if (pageType === "front_cover" || pageType === "back_cover") {
        const existingPages = await storage.getYearbookPages(yearbookId);
        const existingCover = existingPages.find(p => p.pageType === pageType);
        if (existingCover) {
          // Delete the old image file from filesystem
          const oldImagePath = path.join(process.cwd(), 'public', existingCover.imageUrl);
          try {
            await fs.unlink(oldImagePath);
          } catch (error) {
            console.warn('Could not delete old cover image:', oldImagePath, error);
          }
          
          await storage.deleteYearbookPage(existingCover.id);
        }
      }
      
      // Create the URL path for the uploaded file
      const imageUrl = `/uploads/yearbooks/${req.file.filename}`;
      
      // For front and back covers, use page number 0
      // For content pages, get the next sequential number
      const pageNumber = (pageType === "front_cover" || pageType === "back_cover") 
        ? 0 
        : await storage.getNextPageNumber(yearbookId);
      
      const page = await storage.createYearbookPage({
        yearbookId,
        title,
        imageUrl,
        pageType,
        pageNumber
      });
      
      res.status(201).json(page);
    } catch (error) {
      console.error("Error uploading page:", error);
      
      // Handle multer errors specifically
      if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ message: "File too large. Maximum size is 10MB." });
        }
        return res.status(400).json({ message: error.message });
      }
      
      res.status(500).json({ message: "Failed to upload page" });
    }
  });

  app.delete("/api/yearbooks/pages/:pageId", async (req, res) => {
    try {
      const { pageId } = req.params;
      
      // Delete the page from database first
      const success = await storage.deleteYearbookPage(pageId);
      if (!success) {
        return res.status(404).json({ message: "Page not found" });
      }
      
      // Note: File cleanup is simplified for now to avoid filesystem errors
      // In a production environment, you'd want to implement proper cleanup
      
      res.json({ message: "Page deleted successfully" });
    } catch (error) {
      console.error("Error deleting page:", error);
      res.status(500).json({ message: "Failed to delete page" });
    }
  });

  // Reorder yearbook page
  app.patch("/api/yearbooks/pages/:pageId/reorder", async (req, res) => {
    try {
      const { pageId } = req.params;
      const { pageNumber } = req.body;

      if (typeof pageNumber !== 'number' || pageNumber < 1) {
        return res.status(400).json({ message: "Invalid page number" });
      }

      const updatedPage = await storage.updateYearbookPageOrder(pageId, pageNumber);
      if (!updatedPage) {
        return res.status(404).json({ message: "Page not found" });
      }

      res.json(updatedPage);
    } catch (error) {
      console.error("Error reordering page:", error);
      res.status(500).json({ message: "Failed to reorder page" });
    }
  });

  app.post("/api/yearbooks/:yearbookId/table-of-contents", async (req, res) => {
    try {
      const { yearbookId } = req.params;
      const tocItem = await storage.createTableOfContentsItem({
        ...req.body,
        yearbookId
      });
      res.status(201).json(tocItem);
    } catch (error) {
      console.error("Error creating TOC item:", error);
      res.status(500).json({ message: "Failed to create table of contents item" });
    }
  });

  // Update table of contents item
  app.patch("/api/yearbooks/table-of-contents/:tocId", async (req, res) => {
    try {
      const { tocId } = req.params;
      const updatedItem = await storage.updateTableOfContentsItem(tocId, req.body);
      if (!updatedItem) {
        return res.status(404).json({ message: "TOC item not found" });
      }
      res.json(updatedItem);
    } catch (error) {
      console.error("Error updating TOC item:", error);
      res.status(500).json({ message: "Failed to update table of contents item" });
    }
  });

  // Delete table of contents item
  app.delete("/api/yearbooks/table-of-contents/:tocId", async (req, res) => {
    try {
      const { tocId } = req.params;
      const success = await storage.deleteTableOfContentsItem(tocId);
      if (!success) {
        return res.status(404).json({ message: "TOC item not found" });
      }
      res.json({ message: "TOC item deleted successfully" });
    } catch (error) {
      console.error("Error deleting TOC item:", error);
      res.status(500).json({ message: "Failed to delete table of contents item" });
    }
  });

  // Update yearbook orientation
  app.patch("/api/yearbooks/:yearbookId", async (req, res) => {
    try {
      const { yearbookId } = req.params;
      const { orientation } = req.body;
      
      if (orientation && !["portrait", "landscape"].includes(orientation)) {
        return res.status(400).json({ message: "Invalid orientation. Must be 'portrait' or 'landscape'" });
      }
      
      const updatedYearbook = await storage.updateYearbook(yearbookId, { orientation });
      if (!updatedYearbook) {
        return res.status(404).json({ message: "Yearbook not found" });
      }
      
      res.json(updatedYearbook);
    } catch (error) {
      console.error("Error updating yearbook:", error);
      res.status(500).json({ message: "Failed to update yearbook" });
    }
  });

  // Super Admin API Routes - Protected by middleware
  
  // Get all users
  app.get("/api/super-admin/users", requireSuperAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      // Remove passwords from response
      const safeUsers = users.map(user => {
        const { password, ...safeUser } = user;
        return safeUser;
      });
      res.json(safeUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Get all schools
  app.get("/api/super-admin/schools", requireSuperAdmin, async (req, res) => {
    try {
      const schools = await storage.getAllSchools();
      res.json(schools);
    } catch (error) {
      console.error("Error fetching schools:", error);
      res.status(500).json({ message: "Failed to fetch schools" });
    }
  });

  // Get all alumni badges
  app.get("/api/super-admin/alumni-badges", requireSuperAdmin, async (req, res) => {
    try {
      const badges = await storage.getAllAlumniBadges();
      res.json(badges);
    } catch (error) {
      console.error("Error fetching alumni badges:", error);
      res.status(500).json({ message: "Failed to fetch alumni badges" });
    }
  });

  // Get all alumni requests
  app.get("/api/super-admin/alumni-requests", requireSuperAdmin, async (req, res) => {
    try {
      const requests = await storage.getAllAlumniRequests();
      res.json(requests);
    } catch (error) {
      console.error("Error fetching alumni requests:", error);
      res.status(500).json({ message: "Failed to fetch alumni requests" });
    }
  });

  // Delete user
  app.delete("/api/super-admin/users/:userId", requireSuperAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const success = await storage.deleteUser(userId);
      
      if (success) {
        // Log the admin action
        await storage.logAdminAction(
          req.superAdmin.id,
          'deleted_user',
          'user',
          userId,
          { username: req.body.username || 'unknown' }
        );
        res.json({ message: "User deleted successfully" });
      } else {
        res.status(404).json({ message: "User not found" });
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Delete school
  app.delete("/api/super-admin/schools/:schoolId", requireSuperAdmin, async (req, res) => {
    try {
      const { schoolId } = req.params;
      const success = await storage.deleteSchool(schoolId);
      
      if (success) {
        // Log the admin action
        await storage.logAdminAction(
          req.superAdmin.id,
          'deleted_school',
          'school',
          schoolId,
          { schoolName: req.body.schoolName || 'unknown' }
        );
        res.json({ message: "School deleted successfully" });
      } else {
        res.status(404).json({ message: "School not found" });
      }
    } catch (error) {
      console.error("Error deleting school:", error);
      res.status(500).json({ message: "Failed to delete school" });
    }
  });

  // Update user role
  app.patch("/api/super-admin/users/:userId/role", requireSuperAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const { userType } = req.body;
      
      const validRoles = ['student', 'viewer', 'school', 'super_admin'];
      if (!validRoles.includes(userType)) {
        return res.status(400).json({ message: "Invalid user type" });
      }

      const updatedUser = await storage.updateUserRole(userId, userType);
      
      if (updatedUser) {
        // Log the admin action
        await storage.logAdminAction(
          req.superAdmin.id,
          'updated_user_role',
          'user',
          userId,
          { newRole: userType, previousRole: req.body.previousRole }
        );
        
        const { password, ...safeUser } = updatedUser;
        res.json(safeUser);
      } else {
        res.status(404).json({ message: "User not found" });
      }
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  // Approve/Deny alumni badge
  app.patch("/api/super-admin/alumni-badges/:badgeId", requireSuperAdmin, async (req, res) => {
    try {
      const { badgeId } = req.params;
      const { status } = req.body;
      
      if (!['verified', 'pending'].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const updatedBadge = await storage.updateAlumniBadgeStatus(badgeId, status);
      
      if (updatedBadge) {
        // Log the admin action
        await storage.logAdminAction(
          req.superAdmin.id,
          status === 'verified' ? 'approved_alumni_badge' : 'revoked_alumni_badge',
          'alumni_badge',
          badgeId,
          { status, fullName: updatedBadge.fullName }
        );
        res.json(updatedBadge);
      } else {
        res.status(404).json({ message: "Alumni badge not found" });
      }
    } catch (error) {
      console.error("Error updating alumni badge:", error);
      res.status(500).json({ message: "Failed to update alumni badge" });
    }
  });

  // Delete alumni badge
  app.delete("/api/super-admin/alumni-badges/:badgeId", requireSuperAdmin, async (req, res) => {
    try {
      const { badgeId } = req.params;
      const success = await storage.deleteAlumniBadge(badgeId);
      
      if (success) {
        // Log the admin action
        await storage.logAdminAction(
          req.superAdmin.id,
          'deleted_alumni_badge',
          'alumni_badge',
          badgeId,
          { reason: 'admin_deletion' }
        );
        res.json({ message: "Alumni badge deleted successfully" });
      } else {
        res.status(404).json({ message: "Alumni badge not found" });
      }
    } catch (error) {
      console.error("Error deleting alumni badge:", error);
      res.status(500).json({ message: "Failed to delete alumni badge" });
    }
  });

  // Get admin logs
  app.get("/api/super-admin/logs", requireSuperAdmin, async (req, res) => {
    try {
      const logs = await storage.getAdminLogs();
      res.json(logs);
    } catch (error) {
      console.error("Error fetching admin logs:", error);
      res.status(500).json({ message: "Failed to fetch admin logs" });
    }
  });

  // Super admin login endpoint
  app.post("/api/super-admin/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      // Handle hardcoded super admin credentials
      if (username.toLowerCase() === 'neto_nwab' && password === 'Mondays1') {
        // Create or find super admin user
        let user = await storage.getUserByUsername('neto_nwab');
        if (!user) {
          // Create super admin user if doesn't exist
          user = await storage.createUser({
            username: 'neto_nwab',
            password: 'Mondays1',
            userType: 'super_admin',
            firstName: 'Super',
            lastName: 'Admin',
            dateOfBirth: '1990-01-01',
            email: 'admin@yearbook.com'
          });
        }
        
        // Log the admin action
        await storage.logAdminAction(
          user.id,
          'super_admin_login',
          'user',
          user.id,
          { timestamp: new Date().toISOString() }
        );
        
        // Return user info (excluding password)
        const { password: _, ...userInfo } = user;
        return res.json({ user: userInfo });
      }
      
      const user = await storage.getUserByUsername(username.toLowerCase());
      if (!user || user.password !== password || user.userType !== 'super_admin') {
        return res.status(401).json({ message: "Invalid super admin credentials" });
      }
      
      // Log the admin action
      await storage.logAdminAction(
        user.id,
        'super_admin_login',
        'user',
        user.id,
        { timestamp: new Date().toISOString() }
      );

      // Return user info (excluding password)
      const { password: _, ...userInfo } = user;
      res.json({ user: userInfo });
    } catch (error) {
      console.error("Super admin login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Get pending school requests
  app.get("/api/super-admin/pending-schools", requireSuperAdmin, async (req, res) => {
    try {
      const pendingSchools = await storage.getPendingSchools();
      res.json(pendingSchools);
    } catch (error) {
      console.error("Error fetching pending schools:", error);
      res.status(500).json({ message: "Failed to fetch pending schools" });
    }
  });

  // Approve school request - Creates the actual user account
  app.post("/api/super-admin/approve-school/:schoolId", requireSuperAdmin, async (req, res) => {
    try {
      const { schoolId } = req.params;
      
      // Get the pending school request with admin credentials
      const pendingSchool = await storage.getSchoolById(schoolId);
      if (!pendingSchool || pendingSchool.approvalStatus !== 'pending') {
        return res.status(404).json({ message: "Pending school request not found" });
      }
      
      if (!pendingSchool.tempAdminCredentials) {
        return res.status(400).json({ message: "Admin credentials not found for this school" });
      }
      
      // Generate 12-character alphanumeric activation code
      const generateActivationCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 12; i++) {
          result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
      };

      let activationCode = generateActivationCode();
      // Ensure activation code is unique
      while (await storage.getSchoolByActivationCode(activationCode)) {
        activationCode = generateActivationCode();
      }

      // First approve the school
      const school = await storage.approveSchool(schoolId, req.superAdmin.id, activationCode);
      
      if (school) {
        // NOW create the actual school admin user account
        const adminCredentials = pendingSchool.tempAdminCredentials as any;
        const user = await storage.createUser({
          username: adminCredentials.username,
          password: adminCredentials.password,
          userType: "school",
          firstName: adminCredentials.firstName,
          lastName: adminCredentials.lastName,
          dateOfBirth: "1970-01-01", // Default date for school admin accounts
          email: school.email,
          profileImage: null,
          schoolId: school.id, // Link the user to the school
        });
        
        // Clear the temporary credentials after creating the account
        await storage.clearTempAdminCredentials(schoolId);
        
        // Delete accreditation document after approval (save storage space)
        if (pendingSchool.accreditationDocument) {
          try {
            await fs.unlink(pendingSchool.accreditationDocument);
            console.log(`Deleted accreditation document: ${pendingSchool.accreditationDocument}`);
          } catch (error) {
            console.warn(`Failed to delete accreditation document: ${pendingSchool.accreditationDocument}`, error);
            // Don't fail the approval if file deletion fails
          }
        }
        
        // Log the admin action
        await storage.logAdminAction(
          req.superAdmin.id,
          'school_approval',
          'school',
          schoolId,
          { schoolName: school.name, activationCode, adminUsername: adminCredentials.username }
        );
        
        res.json({ 
          message: "School approved successfully and admin account created",
          school,
          schoolCode: school.schoolCode, // Return the 10-digit school code for login
          activationCode, // Keep for internal purposes
          adminUsername: adminCredentials.username
        });
      } else {
        res.status(404).json({ message: "School not found" });
      }
    } catch (error) {
      console.error("Error approving school:", error);
      res.status(500).json({ message: "Failed to approve school" });
    }
  });

  // Reject school request
  app.post("/api/super-admin/reject-school/:schoolId", requireSuperAdmin, async (req, res) => {
    try {
      const { schoolId } = req.params;
      const { reason } = req.body;
      
      const school = await storage.rejectSchool(schoolId, req.superAdmin.id, reason);
      
      if (school) {
        // Log the admin action
        await storage.logAdminAction(
          req.superAdmin.id,
          'school_rejection',
          'school',
          schoolId,
          { schoolName: school.name, reason }
        );
        
        res.json({ 
          message: "School request rejected",
          school
        });
      } else {
        res.status(404).json({ message: "School not found" });
      }
    } catch (error) {
      console.error("Error rejecting school:", error);
      res.status(500).json({ message: "Failed to reject school" });
    }
  });

  // Get analytics/statistics
  app.get("/api/super-admin/analytics", requireSuperAdmin, async (req, res) => {
    try {
      const [users, schools, alumniBadges, alumniRequests] = await Promise.all([
        storage.getAllUsers(),
        storage.getAllSchools(),
        storage.getAllAlumniBadges(),
        storage.getAllAlumniRequests()
      ]);

      const analytics = {
        totalUsers: users.length,
        usersByType: {
          students: users.filter(u => u.userType === 'student').length,
          viewers: users.filter(u => u.userType === 'viewer').length,
          schools: users.filter(u => u.userType === 'school').length,
          superAdmins: users.filter(u => u.userType === 'super_admin').length,
        },
        totalSchools: schools.length,
        totalAlumniBadges: alumniBadges.length,
        alumniBadgesByStatus: {
          verified: alumniBadges.filter(b => b.status === 'verified').length,
          pending: alumniBadges.filter(b => b.status === 'pending').length,
        },
        totalAlumniRequests: alumniRequests.length,
        alumniRequestsByStatus: {
          pending: alumniRequests.filter(r => r.status === 'pending').length,
          approved: alumniRequests.filter(r => r.status === 'approved').length,
          denied: alumniRequests.filter(r => r.status === 'denied').length,
        }
      };

      res.json(analytics);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Super Admin Year Management Routes
  
  // Get year purchases for a specific school (for super admin)
  app.get("/api/super-admin/school-years/:schoolId", requireSuperAdmin, async (req, res) => {
    try {
      const { schoolId } = req.params;
      const school = await storage.getSchoolById(schoolId);
      if (!school) {
        return res.status(404).json({ message: "School not found" });
      }

      const purchases = await storage.getYearPurchasesBySchool(schoolId);
      
      // Create a comprehensive list of years from school founding year to current year
      // Force fresh import to avoid Node.js module caching
      const { CURRENT_YEAR: freshCurrentYear } = await import(`@shared/constants?timestamp=${Date.now()}`);
      const currentYear = freshCurrentYear;
      console.log(`Super Admin Year Management: Using FRESH CURRENT_YEAR = ${currentYear}`);
      const yearsList = [];
      
      for (let year = school.yearFounded; year <= currentYear; year++) {
        const existingPurchase = purchases.find(p => p.year === year);
        yearsList.push({
          year,
          id: existingPurchase?.id || null,
          purchased: existingPurchase?.purchased || false,
          purchaseDate: existingPurchase?.purchaseDate || null,
          price: existingPurchase?.price || "14.99"
        });
      }
      
      res.json({
        school: {
          id: school.id,
          name: school.name,
          yearFounded: school.yearFounded
        },
        years: yearsList
      });
    } catch (error) {
      console.error("Error fetching school years:", error);
      res.status(500).json({ message: "Failed to fetch school years" });
    }
  });

  // Verify super admin password
  app.post("/api/super-admin/verify-password", requireSuperAdmin, async (req, res) => {
    try {
      const { password } = req.body;
      const user = req.user as any;
      
      // For this demo, verify against stored password (in production, use proper hashing)
      if (password === user.password) {
        res.json({ success: true });
      } else {
        res.status(401).json({ message: 'Invalid password' });
      }
    } catch (error) {
      console.error('Error verifying password:', error);
      res.status(500).json({ message: 'Failed to verify password' });
    }
  });

  // Unlock/lock year for a school (super admin)
  app.post("/api/super-admin/unlock-year", requireSuperAdmin, async (req, res) => {
    try {
      const { schoolId, year, unlock } = req.body;
      
      if (!schoolId || !year || typeof unlock !== 'boolean') {
        return res.status(400).json({ message: "School ID, year, and unlock status are required" });
      }

      const school = await storage.getSchoolById(schoolId);
      if (!school) {
        return res.status(404).json({ message: "School not found" });
      }

      // Check if a purchase record exists for this school/year
      const purchases = await storage.getYearPurchasesBySchool(schoolId);
      let existingPurchase = purchases.find(p => p.year === year);
      
      if (existingPurchase) {
        // Update existing purchase record
        const updatedPurchase = await storage.updateYearPurchase(existingPurchase.id, unlock);
        
        // Log the admin action
        await storage.logAdminAction(
          req.superAdmin.id,
          unlock ? 'unlocked_year' : 'locked_year',
          'year_purchase',
          existingPurchase.id,
          { 
            schoolName: school.name,
            schoolId,
            year,
            previousStatus: existingPurchase.purchased,
            newStatus: unlock
          }
        );
        
        res.json({ 
          message: `Year ${year} ${unlock ? 'unlocked' : 'locked'} for ${school.name}`,
          purchase: updatedPurchase
        });
      } else {
        // Create new purchase record
        const newPurchase = await storage.createYearPurchase({
          schoolId,
          year,
          purchased: unlock,
          purchaseDate: unlock ? new Date() : null,
          price: "14.99"
        });
        
        // Log the admin action
        await storage.logAdminAction(
          req.superAdmin.id,
          unlock ? 'unlocked_year' : 'locked_year',
          'year_purchase', 
          newPurchase.id,
          { 
            schoolName: school.name,
            schoolId,
            year,
            newStatus: unlock
          }
        );
        
        res.json({ 
          message: `Year ${year} ${unlock ? 'unlocked' : 'locked'} for ${school.name}`,
          purchase: newPurchase
        });
      }
    } catch (error) {
      console.error("Error toggling year lock:", error);
      res.status(500).json({ message: "Failed to update year status" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
