/**
 * @format
 */

import React from 'react';
import { Text } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';

// La raiz de composicion abre SQLite cifrado y el Keychain, que solo existen en el celular.
// Se reemplaza por un doble que arranca sin sesion guardada.
jest.mock('../src/composicion', () => ({
  app: {
    alExpirarSesion: jest.fn(),
    iniciar: jest.fn().mockResolvedValue(undefined),
    mensajeDeError: jest.fn(),
    // Formularios.tsx toma estas funciones al cargarse
    registros: {
      listarParametros: jest.fn(),
      nombreDe: jest.fn(),
      opcionesCultivos: jest.fn(),
      opcionesFincas: jest.fn(),
      opcionesLotes: jest.fn(),
      ubicacionDe: jest.fn(),
      sugerencias: jest.fn(),
    },
    sesion: {
      sesionGuardada: jest.fn().mockResolvedValue(null),
      cerrarSesion: jest.fn(),
    },
  },
}));

// Sin celular no hay medidas de pantalla y SafeAreaProvider no dibujaria nada
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);

// Montar App carga todas las pantallas: sin cache y midiendo cobertura (como en CI) tarda 30-65 s
jest.setTimeout(120000);

test('sin sesion guardada muestra la pantalla de entrada', async () => {
  let arbol!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    arbol = ReactTestRenderer.create(<App />);
  });

  const textos = arbol.root.findAllByType(Text).map(t => t.props.children);
  expect(textos).toContain('AgroTrack');
});
