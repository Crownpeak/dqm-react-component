# Security Policy

## Supported Versions

We release patches for security vulnerabilities for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security issue in this project, please report it responsibly.

### How to Report

**Please do NOT report security vulnerabilities through public GitHub issues.**

Instead, please report them via email to: **security@crownpeak.com**

Include the following information in your report:

1. **Description** - A clear description of the vulnerability
2. **Impact** - What an attacker could achieve by exploiting this vulnerability
3. **Steps to Reproduce** - Detailed steps to reproduce the issue
4. **Affected Versions** - Which versions are affected
5. **Possible Fix** - If you have suggestions for fixing the vulnerability
6. **Your Contact Info** - So we can follow up with questions if needed

### What to Expect

- **Acknowledgment** - We'll acknowledge receipt of your report within 48 hours
- **Investigation** - We'll investigate and validate the vulnerability
- **Status Updates** - We'll keep you informed of our progress
- **Resolution** - We'll work on a fix and release a patched version
- **Credit** - With your permission, we'll credit you in the security advisory

### Security Best Practices

When using this component:

1. **Keep Dependencies Updated**
   ```bash
   npm audit
   npm audit fix
   ```

2. **Use Environment Variables** - Never hardcode API keys or credentials
   ```bash
   # .env file (never commit this)
   DQM_API_KEY=your_api_key_here
   DQM_WEBSITE_ID=your_website_id
   ```

3. **Secure Backend** - If using the included backend server:
   - Use HTTPS in production
   - Set secure Redis password
   - Use environment variables for secrets
   - Enable CORS only for trusted domains

4. **Session Management**
   - Sessions expire after 24 hours
   - Clear localStorage on logout
   - Validate tokens on backend

5. **Content Security Policy** - Configure CSP headers:
   ```
   Content-Security-Policy: 
     default-src 'self';
     connect-src 'self' https://api.crownpeak.net;
     style-src 'self' 'unsafe-inline';
   ```

### Known Security Considerations

1. **HTML Rendering**
   - Component uses DOMPurify to sanitize rendered HTML
   - Shadow DOM isolation prevents style leakage
   - Be cautious when using `debugHtml` prop (dev only)

2. **Session Storage**
   - Redis sessions expire after 24 hours
   - Tokens stored in localStorage (consider security implications)
   - Clear sensitive data on logout

3. **API Keys**
   - Never expose API keys in client-side code
   - Use backend proxy for API calls
   - Rotate keys regularly

### Third-Party Dependencies

We regularly monitor and update dependencies for security vulnerabilities:

- React 18+
- Material-UI 5+
- Axios (HTTP client)
- DOMPurify (HTML sanitization)
- Express (backend server)
- Redis (session storage)

Run `npm audit` to check for known vulnerabilities in dependencies.

### Security Updates

Security patches will be released as soon as possible:

- **Critical** - Within 24-48 hours
- **High** - Within 1 week
- **Medium** - Within 2 weeks
- **Low** - In next scheduled release

### Disclosure Policy

- We follow responsible disclosure practices
- Security issues will be disclosed after a fix is available
- We'll publish a security advisory on GitHub

### Security Hall of Fame

We recognize security researchers who help improve our security:

<!-- Security researchers will be listed here after disclosure -->

Thank you for helping keep Crownpeak DQM React Component secure! 🔒
