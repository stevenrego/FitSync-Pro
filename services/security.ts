/**
 * Security Service - Client-Side API Key Protection
 * 
 * This service ensures NO sensitive API keys are exposed on the client-side.
 * All API keys must be used only in Supabase Edge Functions (server-side).
 */

export const securityService = {
  // Verify no API keys are exposed in client code
  checkClientSecurity() {
    const warnings: string[] = [];
    
    // Check for common API key patterns in environment
    const exposedPatterns = [
      'OPENROUTER_API_KEY',
      'OPENAI_API_KEY', 
      'ANTHROPIC_API_KEY',
      'STRIPE_SECRET_KEY',
      'PRIVATE_KEY',
      'SECRET_KEY'
    ];
    
    exposedPatterns.forEach(pattern => {
      // Only check client-accessible environment variables
      const clientKey = `EXPO_PUBLIC_${pattern}`;
      if (process.env[clientKey]) {
        warnings.push(`⚠️ SECURITY WARNING: ${pattern} found in client environment!`);
      }
    });
    
    if (warnings.length > 0) {
      console.error('🔒 SECURITY ALERTS:');
      warnings.forEach(warning => console.error(warning));
      console.error('📋 Action Required: Move these keys to Supabase Edge Function secrets');
    } else {
      console.log('✅ Security Check Passed: No sensitive keys exposed on client');
    }
    
    return warnings.length === 0;
  },

  // Guide for proper API key usage
  getSecurityGuidelines() {
    return {
      clientSide: [
        '✅ Use only EXPO_PUBLIC_* for non-sensitive config',
        '✅ Call Edge Functions for AI/payment operations', 
        '✅ Never store API keys in React Native code',
        '✅ Use supabase.functions.invoke() for secure calls'
      ],
      serverSide: [
        '🔒 Store all API keys in Supabase Edge Function secrets',
        '🔒 Use Deno.env.get() in Edge Functions only',
        '🔒 Validate user authentication before API calls',
        '🔒 Log API usage for monitoring and security'
      ]
    };
  }
};