/**
 * @format
 */

// Debe ir primero: define crypto.getRandomValues, que necesita uuid (idLocal y X-Trace-Id).
// Si se importa en otro modulo, la carga diferida de React Native puede ejecutarlo tarde.
import 'react-native-get-random-values';
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
