import React, { useRef, useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';

import { app } from '../composicion';
import {
  limpiarNombreUsuario,
  nombreUsuarioValido,
  type Tokens,
} from '../modulos/autenticacion/dominio/sesion';
import { CajaAviso, Campo, Desplazable, estilos, Texto, type Aviso, type EntradaTexto } from './componentes';

type Modo = 'entrar' | 'crear';

/**
 * Entrar o crear cuenta. Se entra con el nombre de usuario (o el correo) y la clave. El correo se
 * pide al crear la cuenta para poder recuperar la clave mas adelante.
 */
export function PantallaSesion({ alIniciar }: { alIniciar: (t: Tokens) => void }) {
  const [modo, setModo] = useState<Modo>('entrar');
  const [aviso, setAviso] = useState<Aviso | null>(null);

  const cambiarModo = (nuevo: Modo) => {
    setModo(nuevo);
    setAviso(null);
  };

  return (
    <View style={estilos.contenedor}>
      <View style={estilos.cabeceraSesion}>
        <View style={estilos.marca}>
          <Image source={require('../recursos/logo.png')} style={estilos.logo} accessibilityLabel="Logo de AgroTrack" />
          <View>
            <Text style={estilos.nombreApp}>AgroTrack</Text>
            <Text style={estilos.subtituloApp}>
              {modo === 'entrar' ? 'El cuaderno digital de su finca' : 'Crear una cuenta nueva'}
            </Text>
          </View>
        </View>
        <View style={estilos.selectorSesion}>
          {([['entrar', '🔑', 'Entrar'], ['crear', '📝', 'Crear cuenta']] as const).map(([id, icono, texto]) => (
            <Pressable key={id} onPress={() => cambiarModo(id)} accessibilityLabel={texto}
              style={[estilos.opcionSesion, modo === id && estilos.opcionSesionActiva]}>
              <Text style={[estilos.opcionSesionTexto, modo === id && estilos.opcionSesionTextoActivo]}>
                {icono} {texto}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <Desplazable estilo={estilos.pantalla}>
        <CajaAviso aviso={aviso} alCerrar={() => setAviso(null)} />
        {modo === 'entrar'
          ? <FormularioEntrar alIniciar={alIniciar} mostrarAviso={setAviso} alCrear={() => cambiarModo('crear')} />
          : <FormularioCrear alIniciar={alIniciar} mostrarAviso={setAviso} alEntrar={() => cambiarModo('entrar')} />}
      </Desplazable>
    </View>
  );
}

type Errores = Record<string, string | undefined>;

/** Llama al caso de uso mostrando "cargando" y el mensaje de error si algo falla. */
function useEnviar(mostrarAviso: (a: Aviso | null) => void, alIniciar: (t: Tokens) => void) {
  const [cargando, setCargando] = useState(false);
  const enviar = async (trabajo: () => Promise<Tokens>) => {
    setCargando(true);
    mostrarAviso(null);
    try {
      alIniciar(await trabajo());
    } catch (e) {
      console.error('[sesion] fallo al continuar', e);
      mostrarAviso({ tipo: 'error', titulo: 'No se pudo continuar', mensaje: app.mensajeDeError(e) });
    } finally {
      setCargando(false);
    }
  };
  return { cargando, enviar };
}

function faltanDatos(errores: Errores, mostrarAviso: (a: Aviso | null) => void): boolean {
  if (Object.values(errores).some(Boolean)) {
    mostrarAviso({ tipo: 'error', titulo: 'Faltan datos', mensaje: 'Revise los campos marcados en rojo.' });
    return true;
  }
  return false;
}

function FormularioEntrar({ alIniciar, mostrarAviso, alCrear }: {
  alIniciar: (t: Tokens) => void; mostrarAviso: (a: Aviso | null) => void; alCrear: () => void;
}) {
  const [usuario, setUsuario] = useState('');
  const [clave, setClave] = useState('');
  const [errores, setErrores] = useState<Errores>({});
  const { cargando, enviar } = useEnviar(mostrarAviso, alIniciar);
  const refClave = useRef<EntradaTexto>(null);

  const entrar = () => {
    const nuevos = {
      usuario: usuario.trim() ? undefined : 'Escriba su nombre de usuario o su correo.',
      clave: clave ? undefined : 'Escriba su clave.',
    };
    setErrores(nuevos);
    if (!faltanDatos(nuevos, mostrarAviso)) {
      enviar(() => app.sesion.iniciarSesion(usuario.trim(), clave));
    }
  };

  return (
    <>
      <View style={[estilos.tarjetaInfo, estilos.tarjetaInfoVerde]}>
        <Text style={estilos.tarjetaInfoIcono}>👨‍🌾</Text>
        <View style={estilos.tarjetaInfoCuerpo}>
          <Text style={estilos.tarjetaInfoTitulo}>¡Bienvenido a su finca!</Text>
          <Texto suave>Escriba su usuario y su clave para ver sus cuentas y cosechas.</Texto>
        </View>
      </View>

      <Campo etiqueta="👤 Nombre de usuario o correo" valor={usuario} error={errores.usuario} sinMayusculas
        ejemplo="Ej: jose.perez" alSiguiente={() => refClave.current?.focus()}
        alCambiar={v => { setUsuario(v); setErrores(e => ({ ...e, usuario: undefined })); }} />
      <Campo etiqueta="🔒 Su clave" valor={clave} error={errores.clave} secreto refEntrada={refClave}
        alCambiar={v => { setClave(v); setErrores(e => ({ ...e, clave: undefined })); }} />

      <BotonGrande texto="🚜  ¡Entrar a mi finca!" color="verde" cargando={cargando} alPresionar={entrar} />

      <Pressable style={estilos.enlace} onPress={alCrear}>
        <Text style={estilos.enlaceTexto}>¿No tiene cuenta? Toque aquí para crearla</Text>
      </Pressable>
    </>
  );
}

function FormularioCrear({ alIniciar, mostrarAviso, alEntrar }: {
  alIniciar: (t: Tokens) => void; mostrarAviso: (a: Aviso | null) => void; alEntrar: () => void;
}) {
  const [nombre, setNombre] = useState('');
  const [nombreUsuario, setNombreUsuario] = useState('');
  const [correo, setCorreo] = useState('');
  const [clave, setClave] = useState('');
  const [errores, setErrores] = useState<Errores>({});
  const { cargando, enviar } = useEnviar(mostrarAviso, alIniciar);
  const refUsuario = useRef<EntradaTexto>(null);
  const refCorreo = useRef<EntradaTexto>(null);
  const refClave = useRef<EntradaTexto>(null);
  const limpiar = (campo: string) => setErrores(e => ({ ...e, [campo]: undefined }));

  const crear = () => {
    const nuevos = {
      nombre: nombre.trim() ? undefined : 'Escriba su nombre.',
      nombreUsuario: nombreUsuarioValido(nombreUsuario) ? undefined
        : 'De 3 a 30 letras o números, sin espacios ni tildes. Puede usar punto o guion bajo.',
      correo: /^\S+@\S+\.\S+$/.test(correo.trim()) ? undefined : 'Escriba un correo válido.',
      clave: clave.length >= 8 ? undefined : 'La clave debe tener al menos 8 caracteres.',
    };
    setErrores(nuevos);
    if (!faltanDatos(nuevos, mostrarAviso)) {
      enviar(() => app.sesion.registrarse({
        nombre: nombre.trim(), nombreUsuario: nombreUsuario.trim(), correo: correo.trim(), clave,
      }));
    }
  };

  return (
    <>
      <View style={[estilos.tarjetaInfo, estilos.tarjetaInfoNaranja]}>
        <Text style={estilos.tarjetaInfoIcono}>📝</Text>
        <View style={estilos.tarjetaInfoCuerpo}>
          <Text style={estilos.tarjetaInfoTitulo}>Registro en 1 minuto</Text>
          <Texto suave>Sin papeleo ni cosas enredadas. Solo sus datos básicos.</Texto>
        </View>
      </View>

      <Campo etiqueta="🧑‍🌾 Su nombre" valor={nombre} error={errores.nombre} ejemplo="Ej: José Pérez"
        alSiguiente={() => refUsuario.current?.focus()} alCambiar={v => { setNombre(v); limpiar('nombre'); }} />
      <Campo etiqueta="👤 Invente un nombre de usuario" valor={nombreUsuario} error={errores.nombreUsuario}
        sinMayusculas ejemplo="Ej: jose.perez" refEntrada={refUsuario} alSiguiente={() => refCorreo.current?.focus()}
        ayuda="Con este nombre va a entrar. Sin espacios ni tildes."
        alCambiar={v => { setNombreUsuario(limpiarNombreUsuario(v)); limpiar('nombreUsuario'); }} />
      <Campo etiqueta="📧 Su correo" valor={correo} error={errores.correo} teclado="email-address"
        ejemplo="Ej: jose@gmail.com" refEntrada={refCorreo} alSiguiente={() => refClave.current?.focus()}
        ayuda="Sirve para recuperar la clave si se le olvida."
        alCambiar={v => { setCorreo(v); limpiar('correo'); }} />
      <Campo etiqueta="🔒 Invente una clave" valor={clave} error={errores.clave} secreto refEntrada={refClave}
        ayuda="Mínimo 8 caracteres. Toque el ojo para verla."
        alCambiar={v => { setClave(v); limpiar('clave'); }} />

      <BotonGrande texto="🚜  ¡Crear mi cuenta gratis! ✨" color="naranja" cargando={cargando} alPresionar={crear} />

      <Pressable style={estilos.enlace} onPress={alEntrar}>
        <Text style={estilos.enlaceTexto}>¿Ya tiene una cuenta? Toque aquí para entrar</Text>
      </Pressable>
    </>
  );
}

function BotonGrande({ texto, color, cargando, alPresionar }: {
  texto: string; color: 'verde' | 'naranja'; cargando: boolean; alPresionar: () => void;
}) {
  return (
    <Pressable onPress={alPresionar} disabled={cargando} accessibilityLabel={texto}
      style={({ pressed }) => [estilos.botonRapido, color === 'verde' && estilos.botonVerde,
        (pressed || cargando) && estilos.presionado]}>
      <Text style={estilos.botonRapidoTexto}>{cargando ? 'Un momento…' : texto}</Text>
    </Pressable>
  );
}
