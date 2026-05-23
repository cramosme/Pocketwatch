# Security Policy

## Reporting a Vulnerability

Please do not report security vulnerabilities through public GitHub issues.

To report a vulnerability, use GitHub's private vulnerability reporting.

## Security Measures

This project currently implements the following security controls:

- JWT authentication on all protected backend routes
- Row Level Security (RLS) on all Supabase tables
- Secret scanning via Gitleaks on every push and PR, plus pre-commit hook
- Static analysis via CodeQL on every push, PR, and weekly schedule
- Automated dependency vulnerability scanning via Dependabot
- Rate limiting on all API routes
- Sensitive fields never logged (tokens, auth headers, full user objects)
- Required CI checks gate all merges to main