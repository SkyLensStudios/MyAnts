/**
 * Type declarations for renderer process
 * Extends Window interface to include electronAPI
 */

import { ElectronAPI } from '../shared/IPCChannels';

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};