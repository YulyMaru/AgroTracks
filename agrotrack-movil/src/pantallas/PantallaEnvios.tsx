import React, { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { app } from '../composicion';
import type { Accion, OperacionPendiente } from '../modulos/sincronizacion/dominio/operacion';
import { Boton, COLORES, estilos, IndicadorEnvio, registrarFallo, Tarjeta, Texto, useConfirmacion } from './componentes';
import { REGISTROS } from './tiposDeRegistro';

const ACCIONES: Record<Accion, string> = { CREAR: 'nuevo', EDITAR: 'corregido', ELIMINAR: 'eliminado' };

/** Envios al servidor (HU-25, HU-44): estado de cada cambio, reintentar y descartar. */
export function PantallaEnvios({ version, alCambiar }: { version: number; alCambiar: () => Promise<void> }) {
  const [recientes, setRecientes] = useState<OperacionPendiente[]>([]);
  useEffect(() => {
    app.cola.recientes().then(setRecientes).catch(registrarFallo('envios'));
  }, [version]);
  const conError = recientes.filter(r => r.estado === 'ERROR').length;
  const [ventana, confirmar] = useConfirmacion();

  const descartar = async (r: OperacionPendiente) => {
    const seguro = await confirmar({
      icono: '🗑️',
      titulo: '¿Descartar este cambio?',
      mensaje: 'No se enviará al servidor y se pierde lo que anotaste en él. Si lo necesitas, tendrás que anotarlo de nuevo.',
      textoSi: 'Sí, descartar',
      textoNo: 'No, dejarlo',
      peligro: true,
    });
    if (seguro) {
      await app.registros.descartarCambio(r);
      await alCambiar();
      app.motor.sincronizar().catch(registrarFallo('sincronizacion'));
    }
  };

  return (
    <View style={estilos.contenedor}>
      <ScrollView contentContainerStyle={estilos.pantalla}>
        {conError > 0 && (
          <Boton texto="Volver a intentar los que tienen problema" alPresionar={async () => {
            await app.cola.reintentarErrores();
            await alCambiar();
            app.motor.sincronizar().catch(registrarFallo('sincronizacion'));
          }} />
        )}
        <View>
          <Text style={estilos.tituloPantalla}>Envíos al servidor 📤</Text>
          <Texto suave estilo={estilos.textoCentro}>Lo que anotas se guarda en el celular y se envía solo cuando hay internet.</Texto>
        </View>
        {recientes.length === 0 && <Texto suave>Todavía no has anotado nada.</Texto>}
        {recientes.map(r => (
          <Tarjeta key={r.idOperacion} estilo={{ gap: 6 }}>
            <View style={estilos.filaEntre}>
              <Texto negrita estilo={{ flex: 1 }}>
                {REGISTROS[r.entidad].icono} {REGISTROS[r.entidad].singular} {ACCIONES[r.accion]}{resumenCorto(r)}
              </Texto>
              <IndicadorEnvio estado={r.estado} />
            </View>
            {r.estado === 'ERROR' ? (
              <>
                <Texto estilo={{ color: COLORES.error }}>{r.mensajeError}</Texto>
                <Boton texto="Descartar este cambio" variante="peligro" alPresionar={() => descartar(r)} />
              </>
            ) : null}
          </Tarjeta>
        ))}
      </ScrollView>
      {ventana}
    </View>
  );
}

/** ": La Esperanza" / ": Compra de abono" / ": 2026-10-21", segun lo que tenga el registro. */
function resumenCorto(r: OperacionPendiente): string {
  const c = r.contenido;
  const dato = c.nombre ?? c.concepto ?? c.especie ?? c.descripcion ?? c.fecha;
  return dato ? `: ${String(dato)}` : '';
}
