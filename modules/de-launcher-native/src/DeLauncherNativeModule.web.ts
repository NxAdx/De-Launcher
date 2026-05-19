import { registerWebModule, NativeModule } from 'expo';

import { ChangeEventPayload } from './DeLauncherNative.types';

type DeLauncherNativeModuleEvents = {
  onChange: (params: ChangeEventPayload) => void;
}

class DeLauncherNativeModule extends NativeModule<DeLauncherNativeModuleEvents> {
  PI = Math.PI;
  async setValueAsync(value: string): Promise<void> {
    this.emit('onChange', { value });
  }
  hello() {
    return 'Hello world! 👋';
  }
};

export default registerWebModule(DeLauncherNativeModule, 'DeLauncherNativeModule');
