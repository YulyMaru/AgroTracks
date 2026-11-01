import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { app } from '../composicion';
import type { DatosPorEntidad, Entidad } from '../modulos/registros/dominio/modelo';
import { Boton, CajaAviso, COLORES, Desplazable, Encabezado, estilos, Tarjeta, useConfirmacion, type Aviso } from './componentes';
import { REGISTROS } from './tiposDeRegistro';

/** Formulario: crear o editar, y eliminar. Corregir y eliminar piden confirmacion en una ventana. */
export function PantallaFormulario({ entidad, id, version, aviso, mostrarAviso, alVolver, alTerminar }: {
  entidad: Entidad; id?: string; version: number; aviso: Aviso | null; mostrarAviso: (a: Aviso | null) => void;
  alVolver: () => void; alTerminar: (entidad: Entidad, titulo: string) => Promise<void>;
}) {
  const { Componente, nuevo, singular } = REGISTROS[entidad];
  const [inicial, setInicial] = useState<DatosPorEntidad[Entidad] | undefined>();
  const [cargado, setCargado] = useState(!id);
  const [eliminando, setEliminando] = useState(false);
  const [ventana, confirmar] = useConfirmacion();

  useEffect(() => {
    if (id) {
      app.registros.obtener(entidad, id)
        .then(datos => { setInicial(datos); setCargado(true); })
        .catch(e => mostrarAviso({ tipo: 'error', titulo: 'No se pudo abrir', mensaje: app.mensajeDeError(e) }));
    }
  }, [entidad, id, mostrarAviso]);

  const guardar = async (datos: DatosPorEntidad[Entidad]) => {
    if (id && !(await confirmar({
      icono: '✏️',
      titulo: '¿Guardar los cambios?',
      mensaje: `Lo que estaba anotado en este registro (${singular.toLowerCase()}) se reemplaza por lo que acabas de corregir.`,
      textoSi: 'Sí, guardar cambios',
      textoNo: 'Seguir corrigiendo',
    }))) {
      return;
    }
    try {
      if (id) {
        await app.registros.editar(entidad, id, datos);
        await alTerminar(entidad, '¡Cambios guardados!');
      } else {
        await app.registros.crear(entidad, datos);
        await alTerminar(entidad, '¡Guardado!');
      }
    } catch (e) {
      mostrarAviso({ tipo: 'error', titulo: 'No se pudo guardar', mensaje: app.mensajeDeError(e) });
    }
  };

  const borrar = async () => {
    const seguro = await confirmar({
      icono: '🗑️',
      titulo: '¿Eliminar este registro?',
      mensaje: `${singular}: dejará de aparecer en tus listas y en tus cuentas. Se guarda una copia en el historial.`,
      textoSi: 'Sí, eliminar',
      textoNo: 'No, dejarlo',
      peligro: true,
    });
    if (!seguro) {
      return;
    }
    setEliminando(true);
    try {
      await app.registros.eliminar(entidad, id!);
      await alTerminar(entidad, `${singular} eliminado`);
    } catch (e) {
      mostrarAviso({ tipo: 'error', titulo: 'No se pudo eliminar', mensaje: app.mensajeDeError(e) });
    } finally {
      setEliminando(false);
    }
  };

  return (
    <View style={estilos.contenedor}>
      <Encabezado titulo={id ? `Corregir ${singular.toLowerCase()}` : nuevo} alVolver={alVolver} />
      <Desplazable estilo={estilos.pantalla}>
        <CajaAviso aviso={aviso} alCerrar={() => mostrarAviso(null)} />
        {!cargado ? <ActivityIndicator color={COLORES.primario} /> : (
          <Tarjeta>
            <Componente version={version} inicial={inicial} alGuardar={guardar} mostrarAviso={mostrarAviso} />
          </Tarjeta>
        )}
        {id && cargado && (
          <Boton texto={`Eliminar ${singular.toLowerCase()}`} variante="peligro" cargando={eliminando} alPresionar={borrar} />
        )}
      </Desplazable>
      {ventana}
    </View>
  );
}
