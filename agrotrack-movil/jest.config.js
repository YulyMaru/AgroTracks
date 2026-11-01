module.exports = {
  preset: '@react-native/jest-preset',
  // uuid 14 se publica solo como ESM: Jest debe transformarlo igual que react-native
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|uuid)/)',
  ],
  // Cobertura de todo el codigo de la app, no solo de lo que importan las pruebas (ADR-020)
  collectCoverageFrom: ['src/**/*.{ts,tsx}', 'App.tsx'],
  coverageReporters: ['text-summary', 'lcov'],
};
