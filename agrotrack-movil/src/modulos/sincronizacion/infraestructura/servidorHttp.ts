import { api, estadoHttp, mensajeHttp } from '../../../compartido/infraestructura/http/clienteHttp';
import { CONFIG_SINCRONIZACION } from '../../../compartido/infraestructura/configuracion/entorno';
import type { ServidorSincronizacion } from '../aplicacion/puertos';
import {
  FalloTemporal,
  RechazoDelServidor,
  SesionExpirada,
  type CambiosDelServidor,
  type RespuestaSincronizacion,
} from '../dominio/operacion';

/** Adaptador de {@link ServidorSincronizacion} con los endpoints /api/v1/sincronizacion del backend. */
export const servidorHttp: ServidorSincronizacion = {
  async disponible() {
    try {
      const { data } = await api.get('/api/v1/sincronizacion/estado', {
        timeout: CONFIG_SINCRONIZACION.tiempoMaximoChequeoMs,
      });
      return data?.disponible === true;
    } catch {
      return false;
    }
  },

  async enviar(operaciones) {
    const cuerpo = {
      operaciones: operaciones.map(o => ({
        idOperacion: o.idOperacion,
        entidad: o.entidad,
        accion: o.accion,
        idRegistro: o.idRegistro,
        versionBase: o.versionBase,
        contenido: o.contenido,
        creadoEn: o.creadoEn,
        reintentos: o.reintentos,
      })),
    };
    try {
      const { data } = await api.post<RespuestaSincronizacion>('/api/v1/sincronizacion/operaciones', cuerpo);
      return data;
    } catch (e) {
      const estado = estadoHttp(e);
      if (estado === 401) {
        throw new SesionExpirada(mensajeHttp(e));
      }
      if (estado !== undefined && estado >= 400 && estado < 500 && estado !== 408 && estado !== 429) {
        throw new RechazoDelServidor(mensajeHttp(e));
      }
      throw new FalloTemporal(mensajeHttp(e));
    }
  },

  async cambios(desde) {
    const { data } = await api.get<CambiosDelServidor>('/api/v1/sincronizacion/cambios', {
      params: desde ? { desde } : {},
    });
    return data;
  },

  async parametros(desde) {
    const { data } = await api.get('/api/v1/parametros', { params: desde ? { desde } : {} });
    return data ?? [];
  },
};
