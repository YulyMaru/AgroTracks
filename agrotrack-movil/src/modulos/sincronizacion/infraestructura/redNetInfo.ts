import NetInfo from '@react-native-community/netinfo';

import type { Red } from '../aplicacion/puertos';

/** Adaptador de {@link Red} con NetInfo. */
export const redNetInfo: Red = {
  async hayConexion() {
    return (await NetInfo.fetch()).isConnected === true;
  },
  escuchar(alCambiar) {
    return NetInfo.addEventListener(red => {
      alCambiar(red.isConnected === true && red.isInternetReachable !== false);
    });
  },
};
