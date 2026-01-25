---
title: Integrate OAuth2 Providers Correctly
impact: CRITICAL
impactDescription: Secure third-party authentication with proper flow handling
tags: authentication, oauth2, google, github, social-login
---

## Integrate OAuth2 Providers Correctly

OAuth2 integration should use the all-in-one method for simplicity and security. Manual code exchange should only be used when necessary (e.g., mobile apps with deep links).

**Incorrect (manual implementation without SDK):**

```javascript
// Don't manually handle OAuth flow
async function loginWithGoogle() {
  // Redirect user to Google manually
  window.location.href = 'https://accounts.google.com/oauth/authorize?...';
}

// Manual callback handling
async function handleCallback(code) {
  // Exchange code manually - error prone!
  const response = await fetch('/api/auth/callback', {
    method: 'POST',
    body: JSON.stringify({ code })
  });
}
```

**Correct (using SDK's all-in-one method):**

```javascript
import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

// All-in-one OAuth2 (recommended for web apps)
async function loginWithOAuth2(providerName) {
  try {
    const authData = await pb.collection('users').authWithOAuth2({
      provider: providerName,  // 'google', 'github', 'microsoft', etc.
      // Optional: create new user data if not exists
      createData: {
        emailVisibility: true,
        name: ''  // Will be populated from OAuth provider
      }
    });

    console.log('Logged in via', providerName);
    console.log('User:', authData.record.email);
    console.log('Is new user:', authData.meta?.isNew);

    return authData;
  } catch (error) {
    if (error.isAbort) {
      console.log('OAuth popup was closed');
      return null;
    }
    throw error;
  }
}

// Usage
document.getElementById('google-btn').onclick = () => loginWithOAuth2('google');
document.getElementById('github-btn').onclick = () => loginWithOAuth2('github');
```

**Manual code exchange (for React Native / deep links):**

```javascript
// Only use when all-in-one isn't possible
async function loginWithOAuth2Manual() {
  // Get auth methods to find provider config
  const authMethods = await pb.collection('users').listAuthMethods();
  const provider = authMethods.oauth2.providers.find(p => p.name === 'google');

  // Generate code verifier for PKCE
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);

  // Open OAuth URL (handle redirect in your app)
  const authUrl = provider.authURL +
    `?client_id=${provider.clientId}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&code_challenge=${codeChallenge}` +
    `&code_challenge_method=S256` +
    `&response_type=code` +
    `&scope=openid%20email%20profile`;

  // After redirect, exchange code
  const authData = await pb.collection('users').authWithOAuth2Code(
    'google',
    code,           // From redirect URL
    codeVerifier,   // Must match the challenge
    redirectUri,
    { emailVisibility: true }
  );

  return authData;
}
```

**Configure OAuth2 provider (Admin UI or API):**

```javascript
// Via API (superuser only) - usually done in Admin UI
await pb.collections.update('users', {
  oauth2: {
    enabled: true,
    providers: [{
      name: 'google',
      clientId: 'your-client-id',
      clientSecret: 'your-client-secret'
    }],
    mappedFields: {
      avatarURL: 'avatar'  // Map OAuth field to collection field
    }
  }
});
```

Reference: [PocketBase OAuth2](https://pocketbase.io/docs/authentication/#oauth2-authentication)
