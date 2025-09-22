# Contributing to Markdown Slots

Thank you for your interest in contributing to Markdown Slots! This document provides guidelines and information for contributors.

## 🚀 Getting Started

### Prerequisites

- [Deno](https://deno.land/) 2.0 or higher
- Basic knowledge of TypeScript
- Familiarity with markdown and template systems

### Development Setup

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/your-username/markdown-slots.git
   cd markdown-slots
   ```

2. **Verify your setup**
   ```bash
   # Run tests to ensure everything works
   deno task test

   # Check code formatting
   deno task fmt:check

   # Run linting
   deno task lint

   # Type checking
   deno task check
   ```

## 📋 Development Workflow

### Available Tasks

```bash
# Testing
deno task test              # Run all tests
deno task test:watch        # Run tests in watch mode
deno task test tests/specific_test.ts  # Run specific test

# Code Quality
deno task lint              # Run linter
deno task fmt               # Format code
deno task fmt:check         # Check formatting
deno task check             # Type checking

# Development
deno task dev               # Run in development mode
```

### Making Changes

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/issue-description
   ```

2. **Make your changes**
   - Add tests for new functionality
   - Update documentation as needed
   - Ensure all tests pass

3. **Test your changes**
   ```bash
   # Run the full test suite
   deno task test

   # Check code quality
   deno task lint
   deno task fmt:check
   deno task check
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add new feature" # Use conventional commits
   ```

5. **Push and create a PR**
   ```bash
   git push origin feature/your-feature-name
   ```

## 🏗️ Project Structure

```
markdown-slots/
├── src/                       # Source code
│   ├── cli/                   # CLI implementation modules
│   ├── mod.ts                 # Main library export
│   ├── compose.ts             # Public API function
│   ├── composition-engine.ts  # Core composition logic
│   ├── types.ts               # TypeScript type definitions
│   └── ...                    # Additional utilities and modules
├── tests/                     # Test suite
│   ├── cli/                   # CLI-specific tests
│   ├── fixtures/              # Test fixture files
│   └── *.test.ts              # Unit and integration tests
├── docs/                      # Documentation
│   ├── examples/              # Example templates and usage
│   └── troubleshooting.md     # Common issues and solutions
├── tools/                     # Utility scripts
│   └── version-bump.ts        # Version management
├── .kiro/specs/               # Project specifications
├── cli.ts                     # CLI entry point
├── deno.json                  # Deno configuration
├── README.md                  # Project documentation
└── CONTRIBUTING.md            # Contribution guidelines
```

## 📝 Code Style Guidelines

### TypeScript Style

- Use TypeScript strict mode
- Prefer explicit types over `any`
- Use meaningful variable and function names
- Add JSDoc comments for public APIs
- Follow existing naming conventions

### Code Organization

- Keep functions focused and small
- Use clear separation of concerns
- Export only what's necessary
- Group related functionality together

### Example Code Style

```typescript
/**
 * Composes markdown content with slot replacement
 *
 * @param node - The markdown node to compose
 * @param options - Optional composition settings
 * @returns Promise resolving to composed content
 */
export async function composeMarkdown(
  node: MarkdownNode,
  options: ComposeOptions = {},
): Promise<ComposeResult> {
  // Implementation
}
```

## 🐛 Bug Reports

When reporting bugs, please include:

1. **Clear description** of the issue
2. **Steps to reproduce** the problem
3. **Expected behavior** vs actual behavior
4. **Environment details** (Deno version, OS, etc.)
5. **Minimal code example** that demonstrates the issue

### Bug Report Template

````markdown
## Bug Description

A clear description of what the bug is.

## Steps to Reproduce

1. Step one
2. Step two
3. Step three

## Expected Behavior

What you expected to happen.

## Actual Behavior

What actually happened.

## Environment

- Deno version:
- OS:
- Markdown Slots version:

## Code Example

```typescript
// Minimal code that reproduces the issue
```
````

````
## 💡 Feature Requests

When suggesting new features:

1. **Describe the use case** - Why is this feature needed?
2. **Propose the API** - How should it work?
3. **Consider alternatives** - Are there other ways to achieve this?
4. **Think about breaking changes** - Will this affect existing users?

## 🔄 Pull Request Process

### Before Submitting

- [ ] Tests pass (`deno task test`)
- [ ] Code is formatted (`deno task fmt`)
- [ ] No linting errors (`deno task lint`)
- [ ] Type checking passes (`deno task check`)
- [ ] Documentation is updated
- [ ] Examples are updated (if applicable)

### PR Description Template

```markdown
## Description
Brief description of changes.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Added tests for new functionality
- [ ] All tests pass
- [ ] Manual testing completed

## Documentation
- [ ] Updated README if needed
- [ ] Updated examples if needed
- [ ] Added JSDoc comments

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] No breaking changes (or clearly documented)
````

### Review Process

1. **Automated checks** must pass (CI/CD)
2. **Code review** by maintainers
3. **Testing** in different environments
4. **Documentation review**
5. **Merge** when approved

## 🏷️ Commit Message Guidelines

We use [Conventional Commits](https://www.conventionalcommits.org/) format:

```
type(scope): description

[optional body]

[optional footer]
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples

```bash
feat(parser): add support for nested code blocks
fix(compose): handle circular dependencies correctly
docs(readme): update installation instructions
test(engine): add integration tests for file composition
```

## 📞 Getting Help

- **Issues**: Use GitHub issues for bugs and feature requests
- **Discussions**: Use GitHub discussions for questions and ideas
- **Code Review**: Tag maintainers in PRs for review

## 🙏 Recognition

All contributors will be recognized in:

- README.md contributors section
- GitHub contributors page

## 📜 Code of Conduct

This project follows a standard code of conduct:

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow
- Maintain a welcoming environment

Thank you for contributing to Markdown Slots! 🎉
