import React, { useCallback, useEffect, useState } from 'react';
import { BackHandler, View } from 'react-native';

import { app } from '../composicion';
import type { Tokens } from '../modulos/autenticacion/dominio/sesion';
import type { Entidad } from '../modulos/registros/dominio/modelo';
import type { EstadoLocal, EstadoMotor } from '../modulos/sincronizacion/dominio/operacion';
import { BarraInferior, BarraSuperior, estilos, useConfirmacion, type Aviso, type Pestana } from '../pantallas/componentes';
import { PantallaAnalisis } from '../pantallas/PantallaAnalisis';
import { PantallaAnotar } from '../pantallas/PantallaAnotar';
import { PantallaEnvios } from '../pantallas/PantallaEnvios';
import { PantallaFormulario } from '../pantallas/PantallaFormulario';
import { PantallaInicio } from '../pantallas/PantallaInicio';
import { PantallaLista } from '../pantallas/PantallaLista';

/** Lo que se ve encima de las pestanas: una lista de registros o un formulario. */
type Encima =
  | { tipo: 'lista'; entidad: Entidad }
  /** volverA: a la lista de ese tipo, o a la pestana desde donde se abrio (registro nuevo rapido). */
  | { tipo: 'formulario'; entidad: Entidad; id?: string; volverA: 'lista' | 'pestana' };

const SUBTITULOS: Record<Pestana, string> = {
  inicio: 'Panel principal',
  anotar: 'Anotar en la finca',
  cuentas: '¿Cómo voy? Mis cuentas',
  envios: 'Envíos al servidor',
};

/**
 * Navegacion principal: barra verde arriba, pestanas abajo (Inicio, Anotar, Cuentas, Envios) y,
 * encima de ellas, las listas y formularios. Tambien mantiene el estado compartido (conexion,
 * conteos, avisos).
 */
export function Navegacion({ sesion, alCerrarSesion }: { sesion: Tokens; alCerrarSesion: () => void }) {
  const [pestana, setPestana] = useState<Pestana>('inicio');
  const [encima, setEncima] = useState<Encima | null>(null);
  const [conectado, setConectado] = useState(false);
  const [motor, setMotor] = useState<EstadoMotor>({ sincronizando: false, ultimo: null });
  const [conteo, setConteo] = useState<Record<EstadoLocal, number>>({ PENDIENTE: 0, SINCRONIZADO: 0, ERROR: 0 });
  const [cantidades, setCantidades] = useState<Partial<Record<Entidad, number>>>({});
  const [version, setVersion] = useState(0);
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const [ventana, confirmar] = useConfirmacion();

  const refrescar = useCallback(async () => {
    setConteo(await app.cola.contarPorEstado());
    setCantidades(await app.registros.contarRegistros());
    setVersion(v => v + 1);
  }, []);

  /** Cambia de pantalla; los avisos de error no se arrastran a la siguiente. */
  const ir = useCallback((nuevaPestana: Pestana | null, nuevoEncima: Encima | null) => {
    if (nuevaPestana) {
      setPestana(nuevaPestana);
    }
    setEncima(nuevoEncima);
    setAviso(a => (a?.tipo === 'error' ? null : a));
  }, []);

  useEffect(() => {
    refrescar();
    const desuscribir = app.motor.suscribirse(nuevo => {
      setMotor(nuevo);
      if (!nuevo.sincronizando) {
        refrescar();
      }
    });
    const detenerRed = app.motor.iniciarAutomatica(setConectado);
    return () => {
      desuscribir();
      detenerRed();
    };
  }, [refrescar]);

  /** A donde vuelve el boton "Volver" (o el de atras del celular) desde lo que se ve encima. */
  const volver = useCallback(() => {
    if (encima?.tipo === 'formulario' && encima.volverA === 'lista') {
      ir(null, { tipo: 'lista', entidad: encima.entidad });
    } else {
      ir(null, null);
    }
  }, [encima, ir]);

  // Boton "atras" del celular: formulario -> lista -> pestana -> inicio -> salir de la app.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (encima) {
        volver();
        return true;
      }
      if (pestana !== 'inicio') {
        ir('inicio', null);
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [encima, pestana, volver, ir]);

  /** No se deja salir con registros sin enviar: otra cuenta no podria enviarlos (HU-44). */
  const salir = async () => {
    const pendientes = await app.sesion.registrosSinEnviar();
    if (pendientes > 0) {
      setAviso({
        tipo: 'error',
        titulo: 'Tienes registros sin enviar',
        mensaje: `Conéctate a internet y toca "Enviar ahora" antes de salir (${pendientes} por enviar).`,
      });
      return;
    }
    const seguro = await confirmar({
      icono: '🚪',
      titulo: '¿Salir de tu cuenta?',
      mensaje: 'Todo lo que anotaste ya está guardado en el servidor. Para volver a entrar necesitas tu usuario y tu clave.',
      textoSi: 'Sí, salir',
      textoNo: 'No, quedarme',
    });
    if (seguro) {
      alCerrarSesion();
    }
  };

  /** Tras crear, editar o eliminar: muestra la lista de ese tipo, avisa y envia si hay internet. */
  const alTerminar = async (entidad: Entidad, titulo: string) => {
    await refrescar();
    ir(null, { tipo: 'lista', entidad });
    setAviso({
      tipo: 'exito',
      titulo,
      mensaje: conectado ? 'Se está enviando al servidor.' : 'Se enviará solo cuando haya internet.',
    });
    if (conectado) {
      app.motor.sincronizar();
    }
  };

  if (encima?.tipo === 'formulario') {
    return (
      <PantallaFormulario key={`${encima.entidad}-${encima.id ?? 'nuevo'}`} entidad={encima.entidad}
        id={encima.id} version={version} aviso={aviso} mostrarAviso={setAviso} alVolver={volver}
        alTerminar={alTerminar} />
    );
  }
  if (encima?.tipo === 'lista') {
    return (
      <PantallaLista entidad={encima.entidad} version={version} aviso={aviso} alCerrarAviso={() => setAviso(null)}
        alVolver={volver}
        alAbrir={id => { setAviso(null); setEncima({ tipo: 'formulario', entidad: encima.entidad, id, volverA: 'lista' }); }} />
    );
  }

  const nuevoRapido = (entidad: Entidad) => {
    setAviso(null);
    setEncima({ tipo: 'formulario', entidad, volverA: 'pestana' });
  };

  return (
    <View style={estilos.contenedor}>
      <BarraSuperior subtitulo={SUBTITULOS[pestana]} conectado={conectado} />
      <View style={estilos.centrado}>
        {pestana === 'inicio' && (
          <PantallaInicio nombre={sesion.nombre} version={version} conteo={conteo} motor={motor} aviso={aviso}
            alCerrarAviso={() => setAviso(null)} alSalir={salir} alEnviar={() => app.motor.sincronizar()}
            alAnotar={() => ir('anotar', null)} alVerCuentas={() => ir('cuentas', null)}
            alVerEnvios={() => ir('envios', null)} />
        )}
        {pestana === 'anotar' && (
          <PantallaAnotar cantidades={cantidades} alNuevo={nuevoRapido}
            alAbrirLista={e => { setAviso(null); setEncima({ tipo: 'lista', entidad: e }); }} />
        )}
        {pestana === 'cuentas' && <PantallaAnalisis version={version} />}
        {pestana === 'envios' && <PantallaEnvios version={version} alCambiar={refrescar} />}
      </View>
      <BarraInferior activa={pestana} alElegir={p => ir(p, null)} porEnviar={conteo.PENDIENTE + conteo.ERROR} />
      {ventana}
    </View>
  );
}
