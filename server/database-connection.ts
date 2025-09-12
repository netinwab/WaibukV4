import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { sql } from "drizzle-orm";
import * as schema from "@shared/schema";

/**
 * Create a robust database connection that works on Render
 */
export function createDatabaseConnection() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  let connectionString = process.env.DATABASE_URL;
  
  // Ensure the connection string is using the correct format for HTTP
  // Render sometimes provides URLs that need adjustment
  if (connectionString.includes('postgres://')) {
    connectionString = connectionString.replace('postgres://', 'postgresql://');
  }
  
  // Log connection attempt (without revealing credentials)
  const urlParts = connectionString.split('@');
  const safeUrl = urlParts.length > 1 ? `***@${urlParts[1]}` : 'DATABASE_URL_SET';
  console.log(`📡 Attempting connection to: ${safeUrl}`);
  
  try {
    const sql = neon(connectionString);
    const db = drizzle(sql, { schema });
    return db;
  } catch (error) {
    console.error("❌ Failed to create database connection:", error);
    throw error;
  }
}

/**
 * Test database connectivity with better error reporting
 */
export async function testDatabaseConnection() {
  try {
    const db = createDatabaseConnection();
    
    // Simple connectivity test
    console.log("🔍 Testing database connectivity...");
    await db.execute(sql`SELECT 1 as test`);
    console.log("✅ Database connection test successful");
    
    return db;
  } catch (error) {
    console.error("❌ Database connection test failed:");
    
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      
      if (error.message.includes('ECONNREFUSED')) {
        console.error("💡 Connection refused - this usually means:");
        console.error("   1. Database service is not running");
        console.error("   2. Incorrect DATABASE_URL format");
        console.error("   3. Network/firewall blocking connection");
      }
      
      if (error.message.includes('fetch failed')) {
        console.error("💡 Fetch failed - this might mean:");
        console.error("   1. DATABASE_URL format is incorrect");
        console.error("   2. SSL/TLS configuration issue");
        console.error("   3. Network connectivity problem");
      }
    }
    
    throw error;
  }
}