import * as Keychain from 'react-native-keychain';

import type { AlmacenSesion } from '../aplicacion/puertos';
import type { Tokens } from '../dominio/sesion';

/** Adaptador: tokens en el Keystore de Android (ADR-011, ADR-017). Nunca en SQLite ni en AsyncStorage. */
const SERVICIO = 'agrotrack.sesion';

export const almacenSesionKeychain: AlmacenSesion = {
  async guardar(tokens) {
    await Keychain.setGenericPassword('sesion', JSON.stringify(tokens), { service: SERVICIO });
  },
  async obtener() {
    const credenciales = await Keychain.getGenericPassword({ service: SERVICIO });
    return credenciales ? (JSON.parse(credenciales.password) as Tokens) : null;
  },
  async borrar() {
    await Keychain.resetGenericPassword({ service: SERVICIO });
  },
};
