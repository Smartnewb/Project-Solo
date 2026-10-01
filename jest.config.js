module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  transform: {
    '^.+\\.(js|mjs)$': ['next/dist/build/swc/jest-transformer', {
      isServer: false,
      jsConfig: { compilerOptions: { jsx: 'react-jsx', esModuleInterop: true } },
    }],
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: 'tsconfig.jest.json',
    }],
  },
  // HeroUI v3 ships ESM; exercise the real controls in jsdom, including pnpm paths.
  transformIgnorePatterns: [
    'node_modules/.pnpm/(?!(?:@heroui\\+react|@heroui\\+styles|tailwind-variants)@)',
    'node_modules/(?!.pnpm/|@heroui/|tailwind-variants/)',
  ],
  testMatch: [
    '**/?(*.)+(spec|test).ts?(x)',
    '**/?(*.)+(spec|test).js?(x)',
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/',
    '<rootDir>/.claude/',
    '<rootDir>/.codex-worktrees/',
    '<rootDir>/.omc/',
    '<rootDir>/.omx/',
    '<rootDir>/tests/',
    '<rootDir>/e2e/',
  ],
  modulePathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/.claude/',
    '<rootDir>/.codex-worktrees/',
    '<rootDir>/.omx/',
  ],
};
