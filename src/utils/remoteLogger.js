import { doc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Platform } from 'react-native';

/**
 * Remote Logger - Logs to Firestore for production debugging
 * Use this to see logs from App Store builds
 */

class RemoteLogger {
  static async log(level, message, data = {}) {
    try {
      // Log to console first
      const emoji = {
        info: 'ℹ️',
        success: '✅',
        error: '❌',
        warning: '⚠️',
        debug: '🐛'
      }[level] || '📝';
      
      console.log(`${emoji} ${message}`, data);

      // Also save to Firestore for remote viewing
      await addDoc(collection(db, 'AppLogs'), {
        level,
        message,
        data,
        timestamp: serverTimestamp(),
        platform: Platform.OS,
      });
    } catch (error) {
      console.error('Failed to log remotely:', error);
    }
  }

  static info(message, data) {
    return this.log('info', message, data);
  }

  static success(message, data) {
    return this.log('success', message, data);
  }

  static error(message, data) {
    return this.log('error', message, data);
  }

  static warning(message, data) {
    return this.log('warning', message, data);
  }

  static debug(message, data) {
    return this.log('debug', message, data);
  }
}

export default RemoteLogger;

