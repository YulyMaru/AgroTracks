import React from 'react';
import { ScrollView, Text, View } from 'react-native';

import type { Entidad } from '../modulos/registros/dominio/modelo';
import { BotonColor, BotonMenu, COLORES, estilos, Subtitulo, Texto } from './componentes';
import { GRUPOS, REGISTROS } from './tiposDeRegistro';

/**
 * Anotar: arriba los botones grandes de colores para lo que mas se anota (abren el formulario
 * nuevo), y abajo todos los registros para verlos, corregirlos o eliminarlos.
 */
export function PantallaAnotar({ cantidades, alNuevo, alAbrirLista }: {
  cantidades: Partial<Record<Entidad, number>>;
  alNuevo: (entidad: Entidad) => void;
  alAbrirLista: (entidad: Entidad) => void;
}) {
  return (
    <ScrollView contentContainerStyle={estilos.pantalla}>
      <View>
        <Text style={estilos.tituloPantalla}>¿Qué quieres anotar? ✍️</Text>
        <Texto suave estilo={estilos.textoCentro}>Toca un botón y llena lo que te pide.</Texto>
      </View>

      <View style={estilos.rejilla}>
        <BotonColor icono="💸" titulo="Gasté dinero" detalle="Insumos, jornal, transporte" color={COLORES.errorVivo}
          alPresionar={() => alNuevo('GASTO')} />
        <BotonColor icono="💰" titulo="Vendí cosecha" detalle="Lo que me pagaron" color={COLORES.primario}
          alPresionar={() => alNuevo('VENTA')} />
        <BotonColor icono="🧺" titulo="Coseché" detalle="Cuánto saqué" color={COLORES.ambar}
          alPresionar={() => alNuevo('COSECHA')} />
        <BotonColor icono="🧑‍🌾" titulo="Hice una labor" detalle="Abonar, fumigar, desyerbar" color={COLORES.teal}
          alPresionar={() => alNuevo('LABOR')} />
      </View>

      <Subtitulo>📂 Mis registros</Subtitulo>
      <Texto suave>Toca uno para ver lo que has anotado, corregirlo o agregar más.</Texto>
      {GRUPOS.map(grupo => (
        <View key={grupo.titulo} style={estilos.grupo}>
          <Texto negrita estilo={{ color: COLORES.suave }}>{grupo.titulo}</Texto>
          <View style={estilos.rejilla}>
            {grupo.entidades.map(e => (
              <BotonMenu key={e} icono={REGISTROS[e].icono}
                texto={`${REGISTROS[e].plural}${cantidades[e] ? ` (${cantidades[e]})` : ''}`}
                alPresionar={() => alAbrirLista(e)} />
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}
