import { storage } from '../storage';
import { updateAvailableCompanies } from '../shared/constants';

export class FirmLifecycleManager {
  /**
   * Handles complete firm creation lifecycle with full automation
   */
  static async createFirm(firmData: any) {
    console.log("Starting comprehensive firm creation lifecycle for:", firmData.firmName);
    
    // 1. Enhance firm data with automatic logo and metadata
    const enhancedFirmData = await this.enhanceFirmData(firmData);
    
    // 2. Create the firm data entry
    const createdFirm = await storage.createFirmData(enhancedFirmData);
    
    // 3. Generate firm page route data
    await this.generateFirmPageData(firmData.firmName, enhancedFirmData);
    
    // 4. Update global companies list
    await this.refreshGlobalCompaniesList();
    
    // 5. Update all user preferences to include new firm
    await this.addFirmToAllUserPreferences(firmData.firmName);
    
    // 6. Add to display aliases if needed
    await this.updateDisplayAliases(firmData.firmName);
    
    console.log("Completed comprehensive firm creation lifecycle for:", firmData.firmName);
    return createdFirm;
  }

  /**
   * Enhances firm data with automatic logo fetching and metadata
   */
  static async enhanceFirmData(firmData: any) {
    const enhanced = { ...firmData };
    
    // Auto-generate logo URL if not provided
    if (!enhanced.logo_url) {
      const domain = this.extractDomainFromName(firmData.firmName);
      enhanced.logo_url = `https://logo.clearbit.com/${domain}`;
    }
    
    // Set default values for missing fields
    enhanced.firm_type = enhanced.firm_type || 'Investment Firm';
    enhanced.description = enhanced.description || `${firmData.firmName} is a leading financial services firm.`;
    enhanced.metric1_label = enhanced.metric1_label || 'AUM';
    enhanced.metric1_value = enhanced.metric1_value || 'N/A';
    enhanced.metric2_label = enhanced.metric2_label || 'Founded';
    enhanced.metric2_value = enhanced.metric2_value || 'N/A';
    
    return enhanced;
  }

  /**
   * Generates firm page route data for automatic page creation
   */
  static async generateFirmPageData(firmName: string, firmData: any) {
    const slug = this.generateSlug(firmName);
    
    // This would be used by the firm page component to display dynamic data
    const pageData = {
      name: firmName,
      slug,
      logo: firmData.logo_url,
      description: firmData.description,
      type: firmData.firm_type,
      metrics: {
        primary: { 
          label: firmData.metric1_label || 'AUM', 
          value: firmData.metric1_value || 'N/A' 
        },
        secondary: { 
          label: firmData.metric2_label || 'Founded', 
          value: firmData.metric2_value || 'N/A' 
        }
      }
    };
    
    console.log(`Generated page data for ${firmName} with slug: ${slug}`);
    return pageData;
  }

  /**
   * Updates display aliases for long company names
   */
  static async updateDisplayAliases(firmName: string) {
    // Auto-generate shorter aliases for long names
    if (firmName.length > 20) {
      const alias = this.generateDisplayAlias(firmName);
      console.log(`Adding display alias: ${firmName} → ${alias}`);
      // This would update the constants file
    }
  }

  /**
   * Extracts domain from company name for logo generation
   */
  static extractDomainFromName(firmName: string): string {
    return firmName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .replace(/capital|management|corporation|group|partners|llc|inc/g, '')
      .substring(0, 15) + '.com';
  }

  /**
   * Generates URL-friendly slug from firm name
   */
  static generateSlug(firmName: string): string {
    return firmName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /**
   * Generates display alias for long company names
   */
  static generateDisplayAlias(firmName: string): string {
    // Extract key parts of the name
    const words = firmName.split(' ');
    if (words.length > 2) {
      return words.slice(0, 2).join(' ');
    }
    return firmName.substring(0, 15);
  }

  /**
   * Handles complete firm deletion lifecycle
   */
  static async deleteFirm(firmName: string) {
    console.log("Starting firm deletion lifecycle for:", firmName);
    
    // 1. Remove firm from all user preferences
    await this.removeFirmFromAllUserPreferences(firmName);
    
    // 2. Delete the firm data entry
    await storage.deleteFirmData(firmName);
    
    // 3. Update global companies list
    await this.refreshGlobalCompaniesList();
    
    console.log("Completed firm deletion lifecycle for:", firmName);
  }

  /**
   * Refreshes the global companies list from database
   */
  static async refreshGlobalCompaniesList() {
    try {
      const allFirms = await storage.getAllFirmsData();
      const companyNames = allFirms.map(firm => firm.firmName).sort();
      updateAvailableCompanies(companyNames);
      console.log("Updated global companies list. Total firms:", companyNames.length);
    } catch (error) {
      console.error("Error refreshing global companies list:", error);
    }
  }

  /**
   * Adds new firm to all existing user preferences
   */
  static async addFirmToAllUserPreferences(firmName: string) {
    try {
      // Get all users
      const allUsers = await storage.getAllUsers();
      
      for (const user of allUsers) {
        // Get current preferences
        const preferences = await storage.getUserPreferences(user.id);
        
        if (preferences && preferences.companies) {
          // Add new firm to companies list if not already present
          const companies = Array.isArray(preferences.companies) ? preferences.companies : [];
          if (!companies.includes(firmName)) {
            companies.push(firmName);
            companies.sort();
            
            // Update preferences
            await storage.updateUserPreferences(user.id, {
              ...preferences,
              companies
            });
          }
        }
      }
      
      console.log(`Added ${firmName} to all user preferences`);
    } catch (error) {
      console.error(`Error adding ${firmName} to user preferences:`, error);
    }
  }

  /**
   * Removes firm from all user preferences
   */
  static async removeFirmFromAllUserPreferences(firmName: string) {
    try {
      // Get all users
      const allUsers = await storage.getAllUsers();
      
      for (const user of allUsers) {
        // Get current preferences
        const preferences = await storage.getUserPreferences(user.id);
        
        if (preferences && preferences.companies) {
          // Remove firm from companies list
          const companies = Array.isArray(preferences.companies) ? preferences.companies : [];
          const updatedCompanies = companies.filter((company: any) => company !== firmName);
          
          if (updatedCompanies.length !== companies.length) {
            // Update preferences if there was a change
            await storage.updateUserPreferences(user.id, {
              ...preferences,
              companies: updatedCompanies
            });
          }
        }
      }
      
      console.log(`Removed ${firmName} from all user preferences`);
    } catch (error) {
      console.error(`Error removing ${firmName} from user preferences:`, error);
    }
  }

  /**
   * Initialize the system by refreshing companies list on startup
   */
  static async initialize() {
    console.log("Initializing Firm Lifecycle Manager...");
    await this.refreshGlobalCompaniesList();
    console.log("Firm Lifecycle Manager initialized");
  }
}