# 🚀 ALM Branching Strategy & Workflow

## 📋 Branch Structure

### **Core Branches:**
- **`main`** 🏠 - **Production Branch** - Live website on GitHub Pages
- **`staging`** 🧪 - **Pre-production** - Final testing before production
- **`develop`** 🔧 - **Development Branch** - Integration of features

### **Supporting Branches:**
- **`feature/feature-name`** ✨ - New features and enhancements
- **`hotfix/fix-name`** 🚨 - Critical production fixes
- **`release/version`** 📦 - Release preparation

---

## 🔄 Workflow Guidelines

### **1. Feature Development**
```bash
# Start from develop branch
git checkout develop
git pull origin develop

# Create feature branch
git checkout -b feature/contact-form-validation
# Work on your feature...
git add .
git commit -m "feat: add contact form validation"
git push -u origin feature/contact-form-validation

# Create Pull Request: feature/contact-form-validation → develop
```

### **2. Hotfix Process**
```bash
# Start from main for critical fixes
git checkout main
git pull origin main

# Create hotfix branch
git checkout -b hotfix/mobile-navigation-fix
# Fix the critical issue...
git add .
git commit -m "fix: resolve mobile navigation overlay issue"
git push -u origin hotfix/mobile-navigation-fix

# Create Pull Requests:
# 1. hotfix/mobile-navigation-fix → main
# 2. hotfix/mobile-navigation-fix → develop
```

### **3. Release Process**
```bash
# Create release branch from develop
git checkout develop
git pull origin develop
git checkout -b release/v1.2.0

# Prepare release (version bumps, final testing)
git add .
git commit -m "chore: prepare release v1.2.0"
git push -u origin release/v1.2.0

# Create Pull Requests:
# 1. release/v1.2.0 → staging (for final testing)
# 2. staging → main (after testing approval)
# 3. main → develop (to sync any release changes)
```

---

## 🎯 Branch Protection Rules

### **Main Branch Protection:**
- ✅ Require pull request reviews
- ✅ Dismiss stale reviews
- ✅ Require status checks to pass
- ✅ Restrict pushes to main
- ✅ Require branches to be up to date

### **Develop Branch Protection:**
- ✅ Require pull request reviews
- ✅ Allow force pushes by administrators
- ✅ Require status checks (if CI/CD setup)

---

## 📝 Commit Message Convention

### **Format:**
```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### **Types:**
- **feat:** ✨ New feature
- **fix:** 🐛 Bug fix
- **docs:** 📚 Documentation changes
- **style:** 💄 Code style changes (formatting)
- **refactor:** ♻️ Code refactoring
- **perf:** ⚡ Performance improvements
- **test:** ✅ Adding or updating tests
- **chore:** 🔧 Maintenance tasks

### **Examples:**
```bash
git commit -m "feat(services): add new ML consulting service card"
git commit -m "fix(mobile): resolve hamburger menu z-index issue"
git commit -m "docs(readme): update installation instructions"
git commit -m "style(hero): improve responsive typography"
```

---

## 🔄 Common Workflows

### **Starting New Feature:**
```bash
# Always start from develop
git checkout develop
git pull origin develop
git checkout -b feature/portfolio-animations

# Work on feature...
# When ready, create PR to develop
```

### **Emergency Hotfix:**
```bash
# Start from main for production fixes
git checkout main
git pull origin main
git checkout -b hotfix/contact-form-bug

# Fix and test...
# Create PR to main AND develop
```

### **Preparing Release:**
```bash
# From develop
git checkout develop
git pull origin develop
git checkout -b release/v1.3.0

# Final preparations, version updates
# Test thoroughly on staging
# When approved, merge to main
```

---

## 🏷️ Tagging Strategy

### **Version Format:** `v<major>.<minor>.<patch>`
- **Major:** Breaking changes
- **Minor:** New features (backward compatible)
- **Patch:** Bug fixes

### **Creating Tags:**
```bash
# After merging to main
git checkout main
git pull origin main
git tag -a v1.2.0 -m "Release version 1.2.0 - Navigation restructure"
git push origin v1.2.0
```

---

## 📊 Branch Status

| Branch | Purpose | Deploy Target | Status |
|--------|---------|---------------|--------|
| `main` | Production | GitHub Pages | ✅ Live |
| `staging` | Testing | Preview URL | 🧪 Testing |
| `develop` | Integration | Local/Dev | 🔧 Active |

---

## 🚨 Emergency Procedures

### **Rollback Production:**
```bash
# If main has issues, rollback to previous tag
git checkout main
git reset --hard v1.1.0  # Previous stable version
git push --force-with-lease origin main
```

### **Quick Hotfix:**
```bash
# For critical fixes that can't wait for full cycle
git checkout main
git cherry-pick <commit-hash-from-develop>
git push origin main
```

---

## 📋 Pre-commit Checklist

- [ ] Code follows project style guidelines
- [ ] All tests pass locally
- [ ] Mobile responsiveness tested
- [ ] Cross-browser compatibility checked
- [ ] Commit message follows convention
- [ ] No sensitive data in commit
- [ ] Branch is up to date with target branch

---

## 🔧 Quick Commands Reference

```bash
# List all branches
git branch -a

# Switch branches
git checkout <branch-name>

# Create and switch to new branch
git checkout -b <branch-name>

# Delete local branch
git branch -d <branch-name>

# Delete remote branch
git push origin --delete <branch-name>

# Update branch from remote
git pull origin <branch-name>

# View commit history
git log --oneline --graph

# Check branch status
git status
```

---

*Last Updated: August 31, 2025*
*Portfolio Project: Nazer Hdaifeh - Data Scientist & ML Engineer*
