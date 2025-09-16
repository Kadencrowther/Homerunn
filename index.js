import { registerRootComponent } from 'expo';
import { Platform } from 'react-native';

// Add FormData polyfill for Hermes
if (Platform.OS !== 'web' && !global.FormData) {
  global.FormData = class FormData {
    constructor() {
      this._parts = [];
    }
    append(name, value) {
      this._parts.push([name, value]);
    }
    getParts() {
      return this._parts;
    }
  };
}

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
