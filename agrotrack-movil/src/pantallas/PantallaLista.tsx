import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';

import { app } from '../composicion';
import type { Entidad, RegistroEnLista } from '../modulos/registros/dominio/modelo';
import {
  Boton,
  CajaAviso,
  COLORES,
  Encabezado,
  estilos,
  IndicadorEnvio,
  Tarjeta,
  Texto,
  type Aviso,
} from './componentes';
import { describir } from './resumenes';
import { REGISTROS } from './tiposDeRegistro';

/** Lista de un tipo de registro: ver, crear y tocar para editar. */
export function PantallaLista({ entidad, version, aviso, alCerrarAviso, alVolver, alAbrir }: {
  entidad: Entidad; version: number; aviso: Aviso | null; alCerrarAviso: () => void;
  alVolver: () => void; alAbrir: (id?: string) => void;
}) {
  const [registros, setRegistros] = useState<(RegistroEnLista & { titulo: string; detalle: string })[] | null>(null);
  useEffect(() => {
    Promise.all([app.registros.listar(entidad), app.registros.cargarEtiquetas()]).then(([lista, etiquetas]) =>
      setRegistros(lista.map(r => {
        const [titulo, detalle] = describir(entidad, r.datos, etiquetas);
        return { ...r, titulo, detalle };
      })));
  }, [entidad, version]);
  const { plural, nuevo, singular } = REGISTROS[entidad];

  return (
    <View style={estilos.contenedor}>
      <Encabezado titulo={plural} alVolver={alVolver} />
      <ScrollView contentContainerStyle={estilos.pantalla}>
        <CajaAviso aviso={aviso} alCerrar={alCerrarAviso} />
        <Boton texto={`+ ${nuevo}`} alPresionar={() => alAbrir()} />
        {registros === null && <ActivityIndicator color={COLORES.primario} />}
        {registros?.length === 0 && (
          <Texto suave>Todavía no hay {plural.toLowerCase()}. Toca "{nuevo}" para anotar el primero.</Texto>
        )}
        {registros && registros.length > 0 && <Texto suave>Toca un registro para corregirlo o eliminarlo.</Texto>}
        {registros?.map(r => (
          <Pressable key={r.id} onPress={() => alAbrir(r.id)} accessibilityLabel={`Abrir ${singular} ${r.titulo}`}
            style={({ pressed }) => pressed && estilos.presionado}>
            <Tarjeta estilo={{ gap: 4 }}>
              <View style={estilos.filaEntre}>
                <Texto negrita estilo={{ flex: 1 }}>{r.titulo}</Texto>
                <IndicadorEnvio estado={r.envio} />
              </View>
              <Texto suave>{r.detalle}</Texto>
              {r.envio === 'ERROR' && r.mensajeError ? (
                <Texto estilo={{ color: COLORES.error }}>{r.mensajeError}</Texto>
              ) : null}
            </Tarjeta>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
