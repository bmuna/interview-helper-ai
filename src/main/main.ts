import { app, BrowserWindow, ipcMain, desktopCapturer, systemPreferences, shell } from 'electron';
import * as path from 'path';
import { exec } from 'child_process';

// Extend the App interface to include our custom property
declare global {
  namespace Electron {
    interface App {
      quitting?: boolean;
    }
  }
}

// Set Chrome flags for audio capture — must be set before app is ready
app.commandLine.appendSwitch('enable-usermedia-screen-capturing');
app.commandLine.appendSwitch('allow-http-screen-capture');

async function checkAndRequestPermissions() {
  if (process.platform === 'darwin') {
    const hasAudioPermission = systemPreferences.getMediaAccessStatus('microphone');
    if (hasAudioPermission !== 'granted') {
      await systemPreferences.askForMediaAccess('microphone');
    }
  }
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: true,
      allowRunningInsecureContent: false,
      defaultEncoding: 'utf8'
    }
  });

  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.once('did-finish-load', () => {
      setTimeout(() => {
        mainWindow.webContents.openDevTools();
      }, 500); // Delay helps avoid disconnection
    });
  }

  // Handle desktop capture request
  ipcMain.handle('GET_SYSTEM_AUDIO_SOURCE', async () => {
    try {
      const sources = await desktopCapturer.getSources({
        types: ['window', 'screen'],
        thumbnailSize: { width: 0, height: 0 },
        fetchWindowIcons: false
      });

      let selectedSource = sources.find(source =>
        source.name.toLowerCase().includes('system audio') ||
        source.name.toLowerCase().includes('internal audio')
      );

      if (!selectedSource) {
        selectedSource = sources.find(source =>
          source.name === 'Entire Screen' ||
          source.name === 'Screen 1' ||
          source.id.includes('screen:0:0')
        );
      }

      if (!selectedSource) {
        throw new Error('No suitable audio source found');
      }

      return selectedSource.id;
    } catch (error) {
      console.error('Error getting system audio source:', error);
      throw error;
    }
  });

  // Open external URLs in browser
  ipcMain.handle('OPEN_IN_BROWSER', async (event, url) => {
    if (typeof url === 'string' && url.startsWith('http')) {
      await shell.openExternal(url);
    }
  });

  // Permissions
  mainWindow.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
    const allowedPermissions = ['media'];
    callback(allowedPermissions.includes(permission));
  });

  mainWindow.webContents.session.setPermissionCheckHandler((_webContents, permission) => {
    return permission === 'media';
  });

  // CSP - relaxed during development
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    const isDev = process.env.NODE_ENV === 'development';
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          isDev
            ? "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:"
            : "default-src 'self'"
        ]
      }
    });
  });

  // Prevent the window from closing (minimize instead)
  mainWindow.on('close', (event) => {
    if (app.quitting) {
      mainWindow.destroy();
    } else {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  // macOS: flash dock icon
  if (process.platform === 'darwin') {
    app.dock.hide();
    setTimeout(() => {
      app.dock.show();
    }, 500);
  }
}

// Ensure single instance
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.whenReady().then(async () => {
    await checkAndRequestPermissions();
    createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  });
}

app.quitting = false;

app.on('before-quit', () => {
  app.quitting = true;
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
