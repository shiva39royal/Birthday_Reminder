import { contextBridge, ipcRenderer } from 'electron';
import { BirthdayEmployee, ApplicationSettings } from '../../shared/types';

const celebrationApi = {
  getCelebrationData: (): Promise<{ birthdays: BirthdayEmployee[]; settings: ApplicationSettings }> =>
    ipcRenderer.invoke('celebration:getData'),
  acknowledge: (): Promise<void> =>
    ipcRenderer.invoke('celebration:acknowledge'),
  closeWindow: (): void => {
    ipcRenderer.send('celebration:close');
  }
};

export type CelebrationAPI = typeof celebrationApi;

contextBridge.exposeInMainWorld('celebrationAPI', celebrationApi);

