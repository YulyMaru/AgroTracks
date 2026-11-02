import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { app } from '../composicion';
import { formatoPesos } from '../compartido/dominio/formato';
import type {
  FichaCultivo,
  Periodo,
  VistaAnalisis,
  VistaCosecha,
} from '../modulos/analisis/aplicacion/casosDeUso';
import type { Totales } from '../modulos/analisis/dominio/analisis';
import { Barra, COLORES, estilos, registrarFallo, Subtitulo, Tarjeta, TarjetaMovimiento, Texto } from './componentes';

type Vista = 'plata' | 'cosecha' | 'cultivos';

const VISTAS: { id: Vista; texto: string }[] = [
  { id: 'plata', texto: '💵 La plata' },
  { id: 'cosecha', texto: '🧺 La cosecha' },
  { id: 'cultivos', texto: '🌱 Mis cultivos' },
];

/**
 * "¿Cómo voy?": las cuentas de la finca con numeros grandes, barras y frases cortas, sin palabras
 * de contabilidad. Se calcula con los datos del celular, asi que funciona sin internet.
 */
export function PantallaAnalisis({ version }: { version: number }) {
  const [vista, setVista] = useState<Vista>('plata');
  const [mes, setMes] = useState(app.analisis.mesActual());

  return (
    <View style={estilos.contenedor}>
      <ScrollView contentContainerStyle={estilos.pantalla}>
        <View style={estilos.chips}>
          {VISTAS.map(v => (
            <Pressable key={v.id} style={[estilos.chip, vista === v.id && estilos.chipActivo]} onPress={() => setVista(v.id)}
              accessibilityLabel={v.texto}>
              <Text style={[estilos.chipTexto, vista === v.id && estilos.chipTextoActivo]}>{v.texto}</Text>
            </Pressable>
          ))}
        </View>
        {vista === 'plata' && <LaPlata mes={mes} alCambiarMes={setMes} version={version} />}
        {vista === 'cosecha' && <LaCosecha mes={mes} alCambiarMes={setMes} version={version} />}
        {vista === 'cultivos' && <MisCultivos version={version} />}
      </ScrollView>
    </View>
  );
}

function useCargar<T>(cargar: () => Promise<T>, dependencias: unknown[]): T | null {
  const [datos, setDatos] = useState<T | null>(null);
  useEffect(() => {
    let vigente = true;
    setDatos(null);
    cargar().then(d => vigente && setDatos(d)).catch(registrarFallo('analisis'));
    return () => { vigente = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencias);
  return datos;
}

function Cargando() {
  return <ActivityIndicator color={COLORES.primario} />;
}

function SelectorMes({ periodo, alCambiar }: { periodo: Periodo; alCambiar: (mes: string) => void }) {
  return (
    <View style={estilos.filaEntre}>
      <Pressable style={estilos.botonMes} onPress={() => alCambiar(periodo.anterior)} accessibilityLabel="Mes anterior">
        <Texto negrita estilo={estilos.botonMesTexto}>‹</Texto>
      </Pressable>
      <Texto negrita estilo={estilos.tituloMes}>{periodo.titulo}</Texto>
      <Pressable style={[estilos.botonMes, !periodo.siguiente && estilos.deshabilitado]} disabled={!periodo.siguiente}
        onPress={() => periodo.siguiente && alCambiar(periodo.siguiente)} accessibilityLabel="Mes siguiente">
        <Texto negrita estilo={estilos.botonMesTexto}>›</Texto>
      </Pressable>
    </View>
  );
}

// --- La plata ------------------------------------------------------------------------------------
function LaPlata({ mes, alCambiarMes, version }: { mes: string; alCambiarMes: (m: string) => void; version: number }) {
  const vista = useCargar(() => app.analisis.analizar(mes), [mes, version]);
  if (!vista) {
    return <Cargando />;
  }
  return (
    <>
      <SelectorMes periodo={vista} alCambiar={alCambiarMes} />
      {!vista.hayDatos ? (
        <Tarjeta>
          <Texto>Todavía no hay ventas, gastos ni ingresos anotados.</Texto>
          <Texto suave>Cuando los anotes, aquí verás en qué se va tu plata y si te está quedando algo.</Texto>
        </Tarjeta>
      ) : (
        <>
          <Resumen totales={vista.totales} porCadaMil={vista.porCadaMil} />
          <Categorias vista={vista} />
          <MesAMes vista={vista} />
          <Ultimos vista={vista} />
        </>
      )}
    </>
  );
}

/** Entro, salio y lo que queda, en numeros grandes. */
function Cuentas({ totales }: { totales: Totales }) {
  const { ingresos, gastos, balance } = totales;
  return (
    <>
      <View style={estilos.filaEntre}>
        <Texto>💵 Entró</Texto>
        <Texto negrita estilo={[estilos.cifra, { color: COLORES.primario }]}>{formatoPesos(ingresos)}</Texto>
      </View>
      <View style={estilos.filaEntre}>
        <Texto>💸 Salió</Texto>
        <Texto negrita estilo={[estilos.cifra, { color: COLORES.error }]}>{formatoPesos(gastos)}</Texto>
      </View>
      <View style={estilos.separador} />
      <View style={estilos.filaEntre}>
        <Texto negrita>{balance >= 0 ? '✅ Le queda' : '⚠ Le falta'}</Texto>
        <Texto negrita estilo={[estilos.cifraGrande, { color: balance >= 0 ? COLORES.primario : COLORES.error }]}>
          {formatoPesos(Math.abs(balance))}
        </Texto>
      </View>
    </>
  );
}

/**
 * "Por cada $1.000 que gastó, le entraron $1.800" (HU-42): mas claro que hablar de rentabilidad o
 * de porcentajes.
 */
function PorCadaMil({ valor }: { valor: number | null }) {
  if (valor === null) {
    return null;
  }
  const gana = valor >= 1000;
  return (
    <Texto estilo={{ color: gana ? COLORES.primarioOscuro : COLORES.error }}>
      {gana ? '👍' : '👎'} Por cada <Texto negrita>$1.000</Texto> que gastó, le entraron{' '}
      <Texto negrita>{formatoPesos(valor)}</Texto>.{' '}
      {valor > 1000 ? 'Le está ganando.' : valor === 1000 ? 'Está saliendo a la par.' : 'Está perdiendo plata.'}
    </Texto>
  );
}

function Resumen({ totales, porCadaMil }: { totales: Totales; porCadaMil: number | null }) {
  return (
    <Tarjeta estilo={{ gap: 10 }}>
      <Cuentas totales={totales} />
      <PorCadaMil valor={porCadaMil} />
    </Tarjeta>
  );
}

function Categorias({ vista }: { vista: VistaAnalisis }) {
  const mayor = vista.categorias[0]?.valor ?? 0;
  return (
    <Tarjeta estilo={{ gap: 12 }}>
      <Subtitulo>¿En qué se me va la plata?</Subtitulo>
      {vista.categorias.length === 0 ? <Texto suave>Este mes no hay gastos anotados.</Texto> : (
        vista.categorias.map(c => (
          <Barra key={c.nombre} etiqueta={`${c.nombre} (${c.porcentaje}%)`} valor={formatoPesos(c.valor)}
            proporcion={mayor > 0 ? c.valor / mayor : 0} color={COLORES.error} />
        ))
      )}
    </Tarjeta>
  );
}

function MesAMes({ vista }: { vista: VistaAnalisis }) {
  const mayor = Math.max(1, ...vista.meses.flatMap(m => [m.ingresos, m.gastos]));
  return (
    <Tarjeta estilo={{ gap: 12 }}>
      <Subtitulo>¿Voy mejor o peor que antes?</Subtitulo>
      <View style={estilos.leyenda}>
        <View style={[estilos.puntoLeyenda, { backgroundColor: COLORES.primario }]} />
        <Texto suave>Entró</Texto>
        <View style={[estilos.puntoLeyenda, { backgroundColor: COLORES.error }]} />
        <Texto suave>Salió</Texto>
      </View>
      <View style={estilos.columnasMeses}>
        {vista.meses.map(m => (
          <View key={m.nombre} style={estilos.columnaMes}>
            <View style={estilos.barrasMes}>
              <View style={[estilos.barraVertical, { height: `${(m.ingresos / mayor) * 100}%`, backgroundColor: COLORES.primario }]} />
              <View style={[estilos.barraVertical, { height: `${(m.gastos / mayor) * 100}%`, backgroundColor: COLORES.error }]} />
            </View>
            <Texto suave>{m.nombre}</Texto>
          </View>
        ))}
      </View>
      <Texto suave>Si la barra verde es más alta que la roja, ese mes le quedó plata.</Texto>
    </Tarjeta>
  );
}

function Ultimos({ vista }: { vista: VistaAnalisis }) {
  return (
    <Tarjeta estilo={{ gap: 10 }}>
      <Subtitulo>📋 Últimos movimientos</Subtitulo>
      {vista.ultimos.map((m, i) => (
        <TarjetaMovimiento key={i} icono={m.esVenta ? '🧺' : m.entro ? '💵' : '💸'} titulo={m.titulo}
          detalle={m.detalle} valor={formatoPesos(m.valor)} entro={m.entro} />
      ))}
    </Tarjeta>
  );
}

// --- La cosecha ----------------------------------------------------------------------------------
const CAMBIO: Record<VistaCosecha['cultivos'][number]['cambio'], { icono: string; color: string; texto: string }> = {
  MAS: { icono: '▲', color: COLORES.primario, texto: 'Más que el mes pasado' },
  MENOS: { icono: '▼', color: COLORES.error, texto: 'Menos que el mes pasado' },
  IGUAL: { icono: '=', color: COLORES.suave, texto: 'Igual que el mes pasado' },
  NUEVO: { icono: '•', color: COLORES.suave, texto: 'El mes pasado no anotó cosecha' },
};

function LaCosecha({ mes, alCambiarMes, version }: { mes: string; alCambiarMes: (m: string) => void; version: number }) {
  const vista = useCargar(() => app.analisis.cosecha(mes), [mes, version]);
  if (!vista) {
    return <Cargando />;
  }
  return (
    <>
      <SelectorMes periodo={vista} alCambiar={alCambiarMes} />
      <Tarjeta estilo={{ gap: 14 }}>
        <Subtitulo>¿Cuánto coseché?</Subtitulo>
        {!vista.hayDatos ? (
          <Texto suave>Todavía no has anotado cosechas. Cuando las anotes, aquí verás cuánto produce cada cultivo.</Texto>
        ) : vista.cultivos.length === 0 ? (
          <Texto suave>Este mes ni el anterior hay cosechas anotadas.</Texto>
        ) : (
          vista.cultivos.map(c => {
            const cambio = CAMBIO[c.cambio];
            return (
              <View key={`${c.nombre}${c.cantidad}`} style={propios.bloque}>
                <Texto negrita>{c.nombre}</Texto>
                <Texto estilo={estilos.cifra}>{c.cantidad}</Texto>
                <Texto estilo={{ color: cambio.color }}>
                  {cambio.icono} {cambio.texto}{c.cambio === 'NUEVO' ? '' : ` (${c.mesPasado})`}
                </Texto>
              </View>
            );
          })
        )}
      </Tarjeta>
    </>
  );
}

// --- Mis cultivos --------------------------------------------------------------------------------
function MisCultivos({ version }: { version: number }) {
  const vista = useCargar(() => app.analisis.lugares(), [version]);
  if (!vista) {
    return <Cargando />;
  }
  if (!vista.hayDatos) {
    return (
      <Tarjeta>
        <Texto>Todavía no hay cultivos anotados.</Texto>
        <Texto suave>Cuando anotes tus cultivos, aquí verás cuál te deja más y cuánto te cuesta producir.</Texto>
      </Tarjeta>
    );
  }
  return (
    <>
      <Texto suave>Todo lo que has anotado desde que empezaste a usar AgroTrack.</Texto>
      {vista.fincas.length > 1 && <Comparar titulo="¿Qué finca me deja más?" filas={vista.fincas} />}
      {vista.lotes.length > 1 && <Comparar titulo="¿Qué lote me deja más?" filas={vista.lotes} />}
      {vista.fichas.length > 1 && (
        <Comparar titulo="¿Qué cultivo me deja más?" filas={vista.fichas.map(f => ({ nombre: f.nombre, ...f.totales }))} />
      )}
      {vista.fichas.map((f, i) => <Ficha key={i} ficha={f} />)}
    </>
  );
}

/** Lo que deja cada finca, lote o cultivo, con barras verdes (gana) o rojas (pierde). */
function Comparar({ titulo, filas }: { titulo: string; filas: ({ nombre: string } & Totales)[] }) {
  const mayor = Math.max(0, ...filas.map(f => Math.abs(f.balance)));
  return (
    <Tarjeta estilo={{ gap: 12 }}>
      <Subtitulo>{titulo}</Subtitulo>
      <Texto suave>Lo que le entró menos lo que le gastó.</Texto>
      {filas.map((f, i) => (
        <Barra key={i} etiqueta={f.nombre} valor={`${f.balance < 0 ? '−' : ''}${formatoPesos(Math.abs(f.balance))}`}
          proporcion={mayor > 0 ? Math.abs(f.balance) / mayor : 0}
          color={f.balance >= 0 ? COLORES.primario : COLORES.error} />
      ))}
    </Tarjeta>
  );
}

/** Todo lo de un cultivo: plata, cosecha, cuanto cuesta producir, trabajo e insumos. */
function Ficha({ ficha }: { ficha: FichaCultivo }) {
  const hayPlata = ficha.totales.ingresos > 0 || ficha.totales.gastos > 0;
  return (
    <Tarjeta estilo={{ gap: 10 }}>
      <View>
        <Subtitulo>🌱 {ficha.nombre}</Subtitulo>
        {ficha.lugar ? <Texto suave>{ficha.lugar}</Texto> : null}
      </View>
      {hayPlata ? <Cuentas totales={ficha.totales} /> : <Texto suave>Sin ventas ni gastos anotados.</Texto>}
      <PorCadaMil valor={ficha.porCadaMil} />
      {ficha.cosechado.length > 0 && <Texto>🧺 Ha cosechado <Texto negrita>{ficha.cosechado.join(' y ')}</Texto>.</Texto>}
      {ficha.costo && (
        <Texto>
          🏷 Producir cada {ficha.costo.unidad} le ha costado <Texto negrita>{formatoPesos(ficha.costo.valor)}</Texto>.
          {' '}Si lo vende por más de eso, le queda ganancia.
        </Texto>
      )}
      {ficha.trabajo && (
        <Texto>
          ⏱ Le ha dedicado <Texto negrita>{ficha.trabajo.horas} horas</Texto> de trabajo
          (unos <Texto negrita>{ficha.trabajo.jornales} jornales</Texto> de 8 horas).
        </Texto>
      )}
      {ficha.insumos.length > 0 && (
        <View style={propios.bloque}>
          <Texto>🧪 Lo que le ha echado:</Texto>
          {ficha.insumos.map(i => <Texto key={i} suave>• {i}</Texto>)}
        </View>
      )}
    </Tarjeta>
  );
}

const propios = StyleSheet.create({
  bloque: { gap: 2 },
});
