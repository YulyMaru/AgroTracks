import { aErrorParaUsuario, api } from '../../../compartido/infraestructura/http/clienteHttp';
import type { ApiAutenticacion } from '../aplicacion/puertos';
import type { Tokens } from '../dominio/sesion';

/** Adaptador: endpoints /api/v1/autenticacion del backend. */
export const apiAutenticacionHttp: ApiAutenticacion = {
  async registrar(correo, nombreUsuario, nombre, clave) {
    try {
      const { data } = await api.post<Tokens>('/api/v1/autenticacion/registro', { correo, nombreUsuario, nombre, clave });
      return data;
    } catch (e) {
      throw aErrorParaUsuario(e);
    }
  },
  async iniciarSesion(usuario, clave) {
    try {
      const { data } = await api.post<Tokens>('/api/v1/autenticacion/inicio-sesion', { usuario, clave });
      return data;
    } catch (e) {
      throw aErrorParaUsuario(e);
    }
  },
  async cerrarSesion(refreshToken) {
    await api.post('/api/v1/autenticacion/cierre-sesion', { refreshToken });
  },
};
