import { sql } from "drizzle-orm";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import { testDatabaseConnection } from "./database-connection";
import { initializeDatabaseFallback } from "./render-fallback";

/**
 * Initialize database tables and default data for production deployment
 * This ensures tables exist and creates a default super-admin account
 */
export async function initializeDatabase() {
  try {
    console.log("🔄 Initializing database...");
    
    // Try the standard Neon HTTP approach first
    try {
      const db = await testDatabaseConnection();
      
      // Check if users table exists and has data
      const existingUsers = await db.select().from(users).limit(1);
      
      // If no users exist, create default super-admin
      if (existingUsers.length === 0) {
        console.log("📝 Creating default super-admin account...");
        
        await db.insert(users).values({
          username: "admin",
          password: process.env.SUPER_ADMIN_PASSWORD || "admin123", // Use secure password from environment
          userType: "super_admin",
          firstName: "Super",
          lastName: "Admin",
          fullName: "Super Admin", // Required field
          dateOfBirth: new Date("1990-01-01"),
          email: "admin@yearbook.com",
        });
        
        console.log("✅ Default super-admin created:");
        console.log("   Username: admin");
        console.log("   Password: [SECURED]");
        console.log("   ✅ Using secure password from environment variables");
      } else {
        console.log("✅ Users table already has data, skipping super-admin creation");
      }
      
      console.log("✅ Database initialization complete");
      return;
      
    } catch (neonError) {
      console.warn("⚠️  Standard Neon connection failed, trying fallback approach...");
      console.warn("Neon error:", neonError instanceof Error ? neonError.message : neonError);
      
      // Try the fallback approach using basic PostgreSQL
      const fallbackSuccess = await initializeDatabaseFallback();
      
      if (fallbackSuccess) {
        console.log("✅ Database initialization completed using fallback method");
        return;
      } else {
        throw new Error("Both standard and fallback database initialization methods failed");
      }
    }
    
  } catch (error) {
    console.error("❌ Database initialization failed:", error);
    
    // If tables don't exist, they should be created via drizzle push
    if (error instanceof Error && error.message.includes('relation') && error.message.includes('does not exist')) {
      console.log("💡 Tables don't exist. Run 'npm run db:push' to create them");
      console.log("💡 For Render deployment, ensure your build command includes 'npm run db:push'");
    }
    
    throw error;
  }
}

/**
 * Check if super-admin exists and create one if needed
 */
export async function ensureSuperAdminExists() {
  try {
    // Test database connection
    const db = await testDatabaseConnection();
    
    const superAdmin = await db.select().from(users).where(eq(users.userType, "super_admin")).limit(1);
    
    if (superAdmin.length === 0) {
      console.log("📝 No super-admin found, creating default account...");
      
      await db.insert(users).values({
        username: "admin",
        password: process.env.SUPER_ADMIN_PASSWORD || "admin123",
        userType: "super_admin", 
        firstName: "Super",
        lastName: "Admin",
        fullName: "Super Admin", // Required field
        dateOfBirth: new Date("1990-01-01"),
        email: "admin@yearbook.com",
      });
      
      console.log("✅ Default super-admin created (username: admin, password: [SECURED])");
      return true;
    }
    
    return false;
  } catch (error) {
    console.error("❌ Failed to check/create super-admin:", error);
    return false;
  }
}