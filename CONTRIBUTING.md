# Contributing to SideKit React Native SDK

Thank you for your interest in contributing to the SideKit React Native SDK! This document provides guidelines and instructions for contributing.

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct. Please be respectful and constructive in all interactions.

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm or yarn
- React Native development environment (for testing)
- Git

### Development Setup

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/sidekit-react-native.git
   cd sidekit-react-native
   ```

3. Install dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```

4. Build the SDK:
   ```bash
   npm run prepare
   ```

5. Run tests:
   ```bash
   npm test
   ```

## Development Workflow

### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm test -- --watch
```

### Type Checking

```bash
# Run TypeScript type checking
npm run typescript
```

### Linting

```bash
# Run ESLint
npm run lint
```

### Building

```bash
# Build the SDK
npm run prepare

# Clean build artifacts
npm run clean
```

### Testing with Example App

1. Build the SDK:
   ```bash
   npm run prepare
   ```

2. Start the example app:
   ```bash
   cd example
   npm install
   npm start
   ```

3. The example app watches SDK source files, so changes will hot reload

## Making Changes

### Branch Naming

Use descriptive branch names:
- `feature/add-new-feature` - For new features
- `fix/bug-description` - For bug fixes
- `docs/documentation-update` - For documentation changes
- `refactor/code-improvement` - For refactoring

### Commit Messages

Follow conventional commit format:
- `feat: add new feature` - New features
- `fix: resolve bug` - Bug fixes
- `docs: update documentation` - Documentation changes
- `test: add tests` - Test additions/changes
- `refactor: improve code` - Code refactoring
- `chore: update dependencies` - Maintenance tasks

Examples:
```
feat: add custom UI theme support
fix: resolve version comparison edge case
docs: update API reference for sendSignal
test: add tests for GateInformation model
```

### Code Style

- Use TypeScript strict mode
- Follow existing code formatting
- Add JSDoc comments for public APIs
- Write tests for new features
- Maintain 80%+ test coverage

### Pull Request Process

1. Update documentation if needed
2. Add tests for new functionality
3. Ensure all tests pass: `npm test`
4. Ensure TypeScript compiles: `npm run typescript`
5. Create a Pull Request with a clear description

## Pull Request Guidelines

### PR Title

Use clear, descriptive titles:
- ✅ "feat: Add offline mode for analytics"
- ✅ "fix: Resolve version comparison for pre-release versions"
- ❌ "Update code"
- ❌ "Fix bug"

### PR Description

Include:
1. **What**: What changes does this PR introduce?
2. **Why**: Why are these changes needed?
3. **How**: How were these changes implemented?
4. **Testing**: How were the changes tested?
5. **Breaking Changes**: Are there any breaking changes?

Example:
```markdown
## What
Adds support for custom themes in DefaultVersionGate component

## Why
Users requested ability to customize colors to match their brand

## How
- Added ThemeProvider context
- Updated DefaultVersionGate to accept theme props
- Maintained backward compatibility with default theme

## Testing
- Added unit tests for theme context
- Tested with example app
- Verified backward compatibility

## Breaking Changes
None - fully backward compatible
```

## Testing Guidelines

### Unit Tests

- Test all public APIs
- Test edge cases and error handling
- Use descriptive test names
- Aim for 80%+ coverage

Example:
```typescript
describe('SemanticVersion', () => {
  it('should parse version string correctly', () => {
    const version = new SemanticVersion('1.2.3');
    expect(version.major).toBe(1);
    expect(version.minor).toBe(2);
    expect(version.patch).toBe(3);
  });

  it('should handle invalid version strings', () => {
    expect(() => new SemanticVersion('invalid')).toThrow();
  });
});
```

### Integration Tests

Test SDK integration with example app to ensure real-world functionality.

## Documentation

### JSDoc Comments

Add comprehensive JSDoc comments for all public APIs:

```typescript
/**
 * Track a custom analytics event.
 *
 * @param {string} key - The event name
 * @param {string} [value] - Optional event value
 * @returns {void}
 *
 * @example
 * ```typescript
 * sendSignal('button_clicked');
 * sendSignal('purchase_completed', '29.99');
 * ```
 */
sendSignal(key: string, value?: string): void {
  // Implementation
}
```

### README Updates

Update README.md when adding:
- New features
- New API methods
- Configuration options
- Breaking changes

## Release Process

(Maintainers only)

1. Update version in package.json
2. Create git tag: `git tag v0.1.0`
3. Push tag: `git push origin v0.1.0`
4. Publish to npm: `npm publish`
5. Create GitHub release

## Questions?

If you have questions about contributing:

- Open an issue for discussion
- Check existing issues and PRs
- Read the documentation

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
