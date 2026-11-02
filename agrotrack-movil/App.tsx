/**
 * AgroTrack movil - offline-first (solo Android). Arquitectura hexagonal por modulos:
 * src/modulos/<modulo>/{dominio, aplicacion, infraestructura}, conectados en src/composicion.ts.
 * Esta raiz solo carga la sesion y elige entre la pantalla de entrada y la navegacion principal.
 */
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StatusBar } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { app } from './src/composicion';
import type { Tokens } from './src/modulos/autenticacion/dominio/sesion';
import { Navegacion } from './src/navegacion/Navegacion';
import { COLORES, estilos, registrarFallo } from './src/pantallas/componentes';
import { PantallaSesion } from './src/pantallas/PantallaSesion';

export default function App() {
  const [listo, setListo] = useState(false);
  const [sesion, setSesion] = useState<Tokens | null>(null);

  useEffect(() => {
    app.alExpirarSesion(() => setSesion(null));
    (async () => {
      await app.iniciar();
      setSesion(await app.sesion.sesionGuardada());
      setListo(true);
    })().catch(registrarFallo('inicio'));
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={estilos.contenedor} edges={['top', 'bottom']}>
        {!listo ? (
          <ActivityIndicator style={estilos.centrado} size="large" color={COLORES.primario} />
        ) : sesion ? (
          <Navegacion sesion={sesion} alCerrarSesion={async () => {
            await app.sesion.cerrarSesion();
            setSesion(null);
          }} />
        ) : (
          <PantallaSesion alIniciar={setSesion} />
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
