# Contributing to De-Launcher

We ❤️ contributions! Whether it's bug fixes, features, documentation, or translations, all help is appreciated.

## Code of Conduct

Please note we have a Code of Conduct. By participating, you are expected to uphold this code:
- Be respectful and inclusive
- Provide constructive feedback
- Report inappropriate behavior to maintainers

## Getting Started

1. **Fork** the repository
2. **Clone** your fork: `git clone https://github.com/your-username/de-launcher.git`
3. **Create** a feature branch: `git checkout -b feature/my-feature`
4. **Set up** development environment (see DEVELOPER_GUIDE.md)
5. **Make** your changes
6. **Test** thoroughly
7. **Commit** with clear messages
8. **Push** to your fork
9. **Create** a Pull Request

## Types of Contributions

### 🐛 Bug Reports

Found a bug? Great! Please:

1. **Search** existing issues first (might already be reported)
2. **Create** an issue with:
   - Clear title
   - Steps to reproduce
   - Expected behavior
   - Actual behavior
   - Device info (model, Android version)
   - De-Launcher version
   - Attached screenshots/logcat if relevant

**Example**:
```
Title: Whitelist not persisting after restart

Steps:
1. Open De-Launcher
2. Navigate to Settings
3. Add an app to whitelist
4. Restart device
5. Open De-Launcher again

Expected: App is still whitelisted
Actual: Whitelist is empty

Device: Pixel 6, Android 14
Version: v1.0.0
```

### ✨ Feature Requests

Have an idea? Please:

1. **Check** if similar request exists
2. **Create** an issue with:
   - Clear description of feature
   - Motivation (why is this useful?)
   - Proposed implementation (optional)
   - Screenshots/mockups if applicable

**Example**:
```
Title: Time-based distraction blocking

Motivation:
Users want to restrict distracting apps only during work hours. 
Currently, the whitelist is always active.

Proposed Solution:
Add a schedule in Settings where users can:
- Set work hours (9 AM - 5 PM)
- Have a separate "work whitelist" and "personal whitelist"
- Toggle which whitelist is active per time slot
```

### 📝 Documentation

Help us improve docs! You can:

- Fix typos and grammar
- Improve clarity
- Add examples
- Translate to other languages
- Add troubleshooting tips

**Process**:
1. Edit directly in fork
2. Create PR with changes
3. Maintainers will review

### 💻 Code Contributions

### Before Starting

**Check if work is already in progress**:
1. Search issues for `help wanted` or `good first issue` labels
2. Comment on issue to claim it
3. Wait for approval before starting major work

### Development Workflow

```bash
# 1. Create feature branch
git checkout -b feature/my-awesome-feature

# 2. Make changes following style guide
# See DEVELOPER_GUIDE.md for code standards

# 3. Type check and lint
npm test

# 4. Test manually
npm start
npm run android

# 6. Commit with clear message
git commit -m "feat: add awesome feature

- Describe what was added
- Mention why this was necessary
- Reference issue if applicable: Fixes #123"
```

### Commit Message Guidelines

Follow conventional commits:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types**:
- `feat` — New feature
- `fix` — Bug fix
- `docs` — Documentation
- `style` — Code style (formatting, etc.)
- `refactor` — Code refactoring
- `perf` — Performance improvement
- `test` — Tests
- `chore` — Build, CI/CD, dependencies

**Examples**:
```
feat(settings): add icon pack selection UI

- Display available icon packs in settings
- Allow users to switch between packs
- Load custom icons dynamically

Fixes #45

---

fix(accessibility): handle null context in distraction service

Previously caused crashes on some Android versions

---

docs(readme): add troubleshooting section

Added common issues and solutions
```

## Pull Request Guidelines

### Before Submitting

- [ ] Code follows style guide
- [ ] TypeScript strict mode and ESLint pass (`npm test`)
- [ ] No console warnings/errors
- [ ] Changes tested on actual device/emulator
- [ ] No breaking changes (or documented in PR)
- [ ] Documentation updated
- [ ] Commit messages are clear

### PR Title & Description

**Title**: Clear, concise description of changes
```
feat: add icon pack support to settings
fix: distraction service blocking wrong apps
docs: improve README with more examples
```

**Description** (use template):
```markdown
## Description
Brief explanation of what this PR does.

## Motivation
Why is this change needed? What problem does it solve?

## Changes
- List specific changes made
- Include any API changes
- Note any breaking changes

## Testing
How was this tested?
- Manual testing on Android 13, 14
- Tested with [icon pack name]
- Screenshots attached

## Screenshots (if applicable)
[Add screenshots]

## Checklist
- [x] Code follows style guide
- [x] Tests pass
- [x] Documentation updated
- [ ] No breaking changes
```

## Review Process

1. **Automated Checks**: GitHub Actions runs:
   - TypeScript compilation
   - ESLint
   - Unit tests
   
2. **Code Review**: Maintainers review:
   - Code quality
   - Design decisions
   - Performance implications
   - Documentation
   
3. **Feedback**: Constructive feedback provided (request changes vs. approve)

4. **Revisions**: Address feedback in follow-up commits

5. **Merge**: Once approved, PR is merged

## Coding Standards

### TypeScript
- Strict mode (`strict: true`)
- No `any` types
- Explicit return types
- Proper type exports

### React / React Native
- Functional components
- Proper hook usage
- Memoization where needed
- Descriptive variable names

### Kotlin
- Follow Android style guide
- Use nullability annotations (`@Nullable`, `@NonNull`)
- Proper error handling
- Clear logging

### Testing
- Unit tests for utilities
- Component tests for UI
- E2E tests for critical flows

### Git
- One feature per branch
- Meaningful commit messages
- Rebase before submitting PR
- Keep history clean

## Areas for Contribution

### High Priority
- [ ] Widget hosting UI
- [ ] E2E tests
- [ ] Dark mode refinements
- [ ] Performance optimizations
- [ ] More icon pack testing

### Medium Priority
- [ ] Advanced scheduling
- [ ] Per-app permissions
- [ ] Usage analytics (local only)
- [ ] Shortcut tiles
- [ ] Backup/restore settings

### Good First Issues
- [ ] Documentation improvements
- [ ] Bug fixes labeled `good-first-issue`
- [ ] Translations
- [ ] UI polish (spacing, colors, animations)

## Style Guide Quick Reference

### File Structure
```
ComponentName.tsx          (Component)
componentName.ts          (Utility, service, hook)
types.ts                  (Type definitions)
styles.ts                 (Styles if complex)
__tests__/Component.test.tsx (Tests)
```

### Import Organization
```typescript
// 1. React/RN imports
import React, { useState } from 'react';
import { View, Text } from 'react-native';

// 2. Third-party
import { useNavigation } from '@react-navigation/native';
import Animated from 'react-native-reanimated';

// 3. Local imports (absolute)
import { useTheme } from '@/src/theme/ThemeContext';
import { AppIcon } from '@/src/components';

// 4. Relative imports (if needed)
import { styles } from './styles';
```

### Function Declarations
```typescript
// ✅ Preferred: Arrow function with types
const MyComponent = ({ prop1, prop2 }: MyComponentProps): React.ReactNode => {
  return <View />;
};

// ❌ Avoid: Generic return type
const MyComponent = ({ prop1, prop2 }: any) => {
  return <View />;
};
```

## Licensing

By contributing, you agree your code will be licensed under the MIT License. See LICENSE file.

## Questions?

- 💬 **GitHub Discussions**: Ask questions in discussions
- 📧 **Email**: developers@de-launcher.io
- 🐦 **Twitter**: [@de_launcher](https://twitter.com/de_launcher)

## Thank You!

We appreciate all contributions, no matter the size. Every PR, issue, and discussion helps make De-Launcher better! 🙌

---

**Happy contributing!** 🚀
