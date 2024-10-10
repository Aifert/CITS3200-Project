# CITS3200 Web Application Security Overview

This document provides an easy-to-understand summary of the security measures in place for the CITS3200 Web Application, focusing on how we protect user data and ensure safe access to the application.

## 1. Authentication & Authorization

- **User Authentication**: We use NextAuth.js for secure login. This ensures users are verified before accessing any protected areas of the application.

- **Token Security**: After users log in, their session is managed using JSON Web Tokens (JWTs). These tokens are checked for authenticity on the server side using a secret key, ensuring only valid users can access protected resources.

- **Protecting Routes**: If users are not logged in, they will be automatically redirected to the login page to prevent unauthorized access to any part of the app.

## 2. API Security

- **Securing API Endpoints**: All requests made to the application's backend API are secured by checking the user's session token. Only verified users can access these routes, keeping sensitive operations protected.

- **Cross-Origin Protection (CORS)**: To prevent unwanted external access, we carefully control which websites can send requests to our API. Only trusted origins are allowed, and cookies are securely exchanged across domains when needed.

- **API Key System for Integrations**: External integrations, such as with SDR devices, use a custom API key system. These keys are securely generated and checked before allowing any external system to interact with the application.

## 3. Data Protection

- **Session Security**: We use HTTP-only cookies for sessions, meaning they can't be accessed by client-side JavaScript, which protects against cross-site scripting (XSS) attacks.

- **Secure Storage of Sensitive Information**: All critical configurations, such as API keys and secrets, are stored in environment variables, which are never exposed to the public.

## 4. Input Validation & Safety

- **Validating User Inputs**: All user inputs, such as form submissions or URL parameters, are carefully checked to ensure they are valid. This prevents malicious data from being sent to the server and keeps the system safe from attacks like SQL injection.

## 5. Error Handling

- **Secured Error Responses**: If something goes wrong, we ensure that error messages are clear but do not reveal sensitive information to users, protecting the application from attacks that target error details.

- **Server-Side Logging**: Errors are logged server-side for developers to review and fix without exposing vulnerabilities to users.

## 6. HTTPS & Encrypted Communication

- **Secure Data Transfer**: All data sent between the user's browser and the server is encrypted using HTTPS, preventing eavesdropping or tampering.

## 7. Managing API Keys

- **API Key Security**: API keys for external integrations are generated using secure methods and stored in a way that ensures no one can retrieve them. Each key is linked to a specific user or device and is verified before access is granted.

- **API Key Expiry & Management**: We recommend regularly rotating API keys to limit exposure and revoking any keys that are no longer in use.
