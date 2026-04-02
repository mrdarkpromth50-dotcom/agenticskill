# Contributing Guidelines

Thank you for your interest in AgenticSkill! Here's how you can contribute.

## Development Setup

1. Clone the repo:
   ```bash
   git clone https://github.com/mrdarkpromth50-dotcom/agenticskill.git
   cd agenticskill
   ```

2. Install dependencies:
   ```bash
   npm install:all
   ```

3. Create feature branch:
   ```bash
   git checkout -b feature/amazing-feature
   ```

## Project Structure

```
agenticskill/
├── config/          # Configuration templates
├── docker/          # Docker setup
├── docs/            # Documentation
├── scripts/         # Automation scripts
├── services/        # Service definitions
└── package.json     # Project metadata
```

## Making Changes

### Adding a New Feature

1. Create a feature branch
2. Make your changes
3. Test locally:
   ```bash
   npm run status
   npm run start:all
   ```
4. Commit with descriptive message:
   ```bash
   git commit -m "Add: Brief description of feature"
   ```
5. Push and create Pull Request

### Commit Message Format

```
[Type]: Brief description

- Details about the change
- Additional context if needed
```

**Types:**
- `Add:` New feature
- `Fix:` Bug fix
- `Docs:` Documentation
- `Refactor:` Code restructuring
- `Test:` Test additions/updates

## Pull Request Process

1. Update documentation if needed
2. Test thoroughly in local environment
3. Ensure no breaking changes
4. Reference any related issues (#123)
5. Get approval before merging

## Code Style

- Use clear, descriptive names
- Add comments for complex logic
- Follow existing patterns
- Keep files focused and organized

## Documentation

- Update README.md for user-facing changes
- Update docs/ for architecture/design changes
- Include examples where applicable

## Reporting Issues

Create an issue with:
- Clear title
- Description of problem
- Steps to reproduce
- Expected vs actual behavior
- Environment info (OS, Node version, etc.)

## Questions?

Open an issue or discussion on GitHub. The community is here to help!

---

**Thank you for contributing! 🚀**
