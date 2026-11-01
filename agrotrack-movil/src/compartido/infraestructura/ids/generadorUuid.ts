import { v4 as uuidv4 } from 'uuid';

import type { GeneradorIds } from '../../aplicacion/puertos';

/** Adaptador de {@link GeneradorIds} con UUID v4 (requiere react-native-get-random-values en index.js). */
export const generadorUuid: GeneradorIds = {
  nuevo: () => uuidv4(),
};
