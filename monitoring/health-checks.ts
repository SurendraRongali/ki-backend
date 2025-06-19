/**
 * Comprehensive Health Monitoring & Alert System
 * 
 * This system continuously monitors the follow functionality and alerts
 * if any issues are detected, preventing silent failures.
 */

import { storage } from '../storage';

interface HealthCheckResult {
  isHealthy: boolean;
  timestamp: number;
  checks: {
    name: string;
    status: 'pass' | 'fail' | 'warn';
    message: string;
    responseTime?: number;
  }[];
}

/**
 * Run comprehensive health checks on user preferences system
 */
export async function runPreferencesHealthCheck(): Promise<HealthCheckResult> {
  const startTime = Date.now();
  const checks: HealthCheckResult['checks'] = [];
  
  try {
    // Test 1: Database connectivity
    const dbStart = Date.now();
    try {
      await storage.getUsers(); // Simple query to test DB
      checks.push({
        name: 'database_connectivity',
        status: 'pass',
        message: 'Database connection successful',
        responseTime: Date.now() - dbStart
      });
    } catch (error) {
      checks.push({
        name: 'database_connectivity',
        status: 'fail',
        message: `Database connection failed: ${error}`,
        responseTime: Date.now() - dbStart
      });
    }

    // Test 2: User preferences retrieval
    const prefsStart = Date.now();
    try {
      // Try to get a real user's preferences
      const users = await storage.getUsers();
      if (users.length > 0) {
        const testUser = users[0];
        const userPrefs = testUser.preferences;
        
        checks.push({
          name: 'preferences_retrieval',
          status: 'pass',
          message: `Preferences retrieved successfully for user ${testUser.id}`,
          responseTime: Date.now() - prefsStart
        });
      } else {
        checks.push({
          name: 'preferences_retrieval',
          status: 'warn',
          message: 'No users found to test preferences retrieval',
          responseTime: Date.now() - prefsStart
        });
      }
    } catch (error) {
      checks.push({
        name: 'preferences_retrieval',
        status: 'fail',
        message: `Preferences retrieval failed: ${error}`,
        responseTime: Date.now() - prefsStart
      });
    }

    // Test 3: Preferences structure validation
    try {
      const users = await storage.getUsers();
      let validCount = 0;
      let totalCount = 0;
      
      for (const user of users) {
        totalCount++;
        const prefs = user.preferences || {};
        
        // Check if preferences have required structure
        if (prefs.companies && Array.isArray(prefs.companies)) {
          validCount++;
        }
      }
      
      if (totalCount === 0) {
        checks.push({
          name: 'preferences_structure',
          status: 'warn',
          message: 'No users to validate preferences structure'
        });
      } else if (validCount === totalCount) {
        checks.push({
          name: 'preferences_structure',
          status: 'pass',
          message: `All ${totalCount} users have valid preferences structure`
        });
      } else {
        checks.push({
          name: 'preferences_structure',
          status: 'warn',
          message: `${validCount}/${totalCount} users have valid preferences structure`
        });
      }
    } catch (error) {
      checks.push({
        name: 'preferences_structure',
        status: 'fail',
        message: `Preferences structure validation failed: ${error}`
      });
    }

    // Determine overall health
    const failedChecks = checks.filter(check => check.status === 'fail');
    const isHealthy = failedChecks.length === 0;

    return {
      isHealthy,
      timestamp: Date.now(),
      checks
    };

  } catch (error) {
    return {
      isHealthy: false,
      timestamp: Date.now(),
      checks: [{
        name: 'health_check_system',
        status: 'fail',
        message: `Health check system failed: ${error}`
      }]
    };
  }
}

/**
 * Continuous monitoring function
 */
export function startContinuousMonitoring() {
  console.log('[HEALTH-MONITOR] Starting continuous preferences monitoring...');
  
  // Run health checks every 5 minutes
  setInterval(async () => {
    try {
      const result = await runPreferencesHealthCheck();
      
      if (!result.isHealthy) {
        console.error('[HEALTH-MONITOR] ALERT: Preferences system unhealthy!');
        console.error('[HEALTH-MONITOR] Failed checks:', 
          result.checks.filter(c => c.status === 'fail')
        );
      } else {
        console.log('[HEALTH-MONITOR] Preferences system healthy ✓');
      }
    } catch (error) {
      console.error('[HEALTH-MONITOR] Health check failed:', error);
    }
  }, 5 * 60 * 1000); // 5 minutes

  // Run initial check
  runPreferencesHealthCheck().then(result => {
    console.log('[HEALTH-MONITOR] Initial health check:', result.isHealthy ? 'PASS' : 'FAIL');
  });
}

/**
 * Test specific user preferences save/retrieve cycle
 */
export async function testUserPreferencesCycle(userId: string): Promise<boolean> {
  try {
    console.log(`[PREFS-TEST] Testing preferences cycle for user ${userId}`);
    
    // Get current preferences
    const user = await storage.getUser(userId);
    if (!user) {
      console.error(`[PREFS-TEST] User ${userId} not found`);
      return false;
    }
    
    const originalPrefs = user.preferences || {};
    console.log(`[PREFS-TEST] Original preferences:`, JSON.stringify(originalPrefs));
    
    // Test save
    const testCompany = `TestCompany_${Date.now()}`;
    const testPrefs = {
      ...originalPrefs,
      companies: [...(originalPrefs.companies || []), testCompany]
    };
    
    await storage.updateUserPreferences(userId, testPrefs);
    console.log(`[PREFS-TEST] Saved test preferences with company: ${testCompany}`);
    
    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Test retrieve
    const updatedUser = await storage.getUser(userId);
    const retrievedPrefs = updatedUser?.preferences || {};
    
    console.log(`[PREFS-TEST] Retrieved preferences:`, JSON.stringify(retrievedPrefs));
    
    // Verify test company exists
    const hasTestCompany = retrievedPrefs.companies?.includes(testCompany);
    
    if (hasTestCompany) {
      console.log(`[PREFS-TEST] SUCCESS: Test company found in retrieved preferences`);
      
      // Clean up test data
      const cleanPrefs = {
        ...retrievedPrefs,
        companies: retrievedPrefs.companies?.filter((c: string) => c !== testCompany) || []
      };
      await storage.updateUserPreferences(userId, cleanPrefs);
      console.log(`[PREFS-TEST] Cleaned up test data`);
      
      return true;
    } else {
      console.error(`[PREFS-TEST] FAIL: Test company not found in retrieved preferences`);
      return false;
    }
    
  } catch (error) {
    console.error(`[PREFS-TEST] Error testing preferences cycle:`, error);
    return false;
  }
}