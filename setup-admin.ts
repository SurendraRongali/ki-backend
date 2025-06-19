import { AdminAuthService } from './admin-auth';

async function setupAdmin() {
  try {
    // Create admin account with two-factor authentication
    // You'll need to provide your phone number for SMS verification
    const phoneNumber = '+1234567890'; // Replace with your actual phone number
    
    const admin = await AdminAuthService.createAdminAccount(
      'Krugmanadmin123',
      'Ballers123abc***',
      phoneNumber
    );
    
    console.log('✅ Admin account created successfully:');
    console.log(`   Username: ${admin.username}`);
    console.log(`   Phone: ${admin.phoneNumber}`);
    console.log(`   ID: ${admin.id}`);
    console.log('\n🔐 Two-factor authentication is now active!');
    console.log('📱 SMS verification codes will be sent to your phone during login.');
    
  } catch (error) {
    console.error('❌ Failed to create admin account:', error);
  }
}

// Run setup if this file is executed directly
if (require.main === module) {
  setupAdmin();
}

export { setupAdmin };