import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { app } from '../composicion';
import { formatoPesos } from '../compartido/dominio/formato';
import type { VistaAnalisis } from '../modulos/analisis/aplicacion/casosDeUso';
import type { EstadoLocal, EstadoMotor } from '../modulos/sincronizacion/dominio/operacion';
import {
  Boton,
  CajaAviso,
  COLORES,
  estilos,
  registrarFallo,
  Subtitulo,
  Tarjeta,
  TarjetaMovimiento,
  Texto,
  type Aviso,
} from './componentes';

/**
 * Inicio: saludo, como va el envio al servidor, el resumen del mes, el boton naranja para anotar
 * rapido y lo ultimo que se anoto de dinero.
 */
export function PantallaInicio(props: {
  nombre: string;
  version: number;
  conteo: Record<EstadoLocal, number>;
  motor: EstadoMotor;
  aviso: Aviso | null;
  alCerrarAviso: () => void;
  alSalir: () => void;
  alEnviar: () => void;
  alAnotar: () => void;
  alVerCuentas: () => void;
  alVerEnvios: () => void;
}) {
  const [vista, setVista] = useState<VistaAnalisis | null>(null);
  useEffect(() => {
    app.analisis.analizar(app.analisis.mesActual()).then(setVista).catch(registrarFallo('inicio'));
  }, [props.version]);

  const porEnviar = props.conteo.PENDIENTE;
  return (
    <ScrollView contentContainerStyle={estilos.pantalla}>
      <CajaAviso aviso={props.aviso} alCerrar={props.alCerrarAviso} />

      <View style={estilos.bienvenida}>
        <Text style={estilos.bienvenidaAdorno}>👨‍🌾</Text>
        <Text style={estilos.bienvenidaEtiqueta}>¡BIENVENIDO DE VUELTA!</Text>
        <Text style={estilos.bienvenidaNombre}>Hola, {props.nombre} 👋</Text>
        <View style={estilos.bienvenidaChip}>
          <Text style={estilos.bienvenidaChipTexto}>
            {porEnviar === 0 ? '✓ Todo lo que anotaste está guardado' : `⏱ ${porEnviar} por enviar al servidor`}
          </Text>
        </View>
        <Pressable onPress={props.alSalir} style={estilos.salir} accessibilityLabel="Salir de la cuenta">
          <Text style={estilos.salirTexto}>Salir</Text>
        </Pressable>
      </View>

      {(porEnviar > 0 || props.conteo.ERROR > 0) && (
        <Tarjeta estilo={{ gap: 8, borderColor: COLORES.pendienteSuave }}>
          {props.conteo.ERROR > 0 && (
            <Pressable onPress={props.alVerEnvios}>
              <Texto negrita estilo={{ color: COLORES.error }}>
                ⚠ {props.conteo.ERROR} con problema. Toca aquí para revisarlos.
              </Texto>
            </Pressable>
          )}
          {porEnviar > 0 && (
            <Boton texto={props.motor.sincronizando ? 'Enviando…' : 'Enviar ahora'} variante="secundario"
              cargando={props.motor.sincronizando} alPresionar={props.alEnviar} />
          )}
          {props.motor.ultimo && porEnviar > 0 && <Texto suave>{props.motor.ultimo.mensaje}</Texto>}
        </Tarjeta>
      )}

      <Pressable onPress={props.alVerCuentas} accessibilityLabel="Ver mis cuentas">
        <Tarjeta estilo={{ gap: 12 }}>
          <View style={estilos.filaEntre}>
            <Subtitulo>📦 Resumen del mes</Subtitulo>
            <Text style={estilos.etiquetaPequena}>Este mes</Text>
          </View>
          <View style={estilos.cajaCifras}>
            <View>
              <Text style={estilos.cifraEtiqueta}>Entró</Text>
              <Texto negrita estilo={[estilos.cifra, { color: COLORES.primario }]}>
                {formatoPesos(vista?.totales.ingresos ?? 0)}
              </Texto>
            </View>
            <View>
              <Text style={[estilos.cifraEtiqueta, estilos.derecha]}>Salió</Text>
              <Texto negrita estilo={[estilos.cifra, estilos.derecha, { color: COLORES.error }]}>
                {formatoPesos(vista?.totales.gastos ?? 0)}
              </Texto>
            </View>
          </View>
          <Texto suave>Toca para ver en qué se va tu plata →</Texto>
        </Tarjeta>
      </Pressable>

      <Pressable onPress={props.alAnotar} accessibilityLabel="Anotar rápido"
        style={({ pressed }) => [estilos.botonRapido, pressed && estilos.presionado]}>
        <Text style={estilos.botonRapidoIcono}>✍️</Text>
        <Text style={estilos.botonRapidoTexto}>¡Anotar rápido un gasto o una venta!</Text>
      </Pressable>

      {vista && vista.ultimos.length > 0 && (
        <Tarjeta estilo={{ gap: 10 }}>
          <Subtitulo>📋 Últimos movimientos</Subtitulo>
          {vista.ultimos.slice(0, 3).map((m, i) => (
            <TarjetaMovimiento key={i} icono={m.esVenta ? '🧺' : m.entro ? '💵' : '💸'} titulo={m.titulo}
              detalle={m.detalle} valor={formatoPesos(m.valor)} entro={m.entro} />
          ))}
        </Tarjeta>
      )}
    </ScrollView>
  );
}
