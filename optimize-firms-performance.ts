import { db } from "./db";
import { firmsData } from "./shared/schema";
import { sql } from "drizzle-orm";

// Performance optimization for firms data
export async function optimizeFirmsPerformance() {
  console.log("Starting firms performance optimization...");
  
  try {
    // Create database index on firmName for faster queries
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_firms_name ON firms_data(firm_name)`);
    console.log("✓ Created index on firm_name");
    
    // Create index on totalValue for faster sorting
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_firms_total_value ON firms_data(total_value)`);
    console.log("✓ Created index on total_value");
    
    // Create index on totalDeals for faster sorting
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_firms_total_deals ON firms_data(total_deals)`);
    console.log("✓ Created index on total_deals");
    
    console.log("Performance optimization completed successfully!");
  } catch (error) {
    console.error("Error during performance optimization:", error);
    throw error;
  }
}

// Run optimization if called directly
optimizeFirmsPerformance()
  .then(() => {
    console.log("Optimization completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Optimization failed:", error);
    process.exit(1);
  });