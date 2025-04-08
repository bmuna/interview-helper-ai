/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/main/main.ts":
/*!**************************!*\
  !*** ./src/main/main.ts ***!
  \**************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
const electron_1 = __webpack_require__(/*! electron */ "electron");
const path = __importStar(__webpack_require__(/*! path */ "path"));
// Set Chrome flags for audio capture — must be set before app is ready
electron_1.app.commandLine.appendSwitch('enable-usermedia-screen-capturing');
electron_1.app.commandLine.appendSwitch('allow-http-screen-capture');
function checkAndRequestPermissions() {
    return __awaiter(this, void 0, void 0, function* () {
        if (process.platform === 'darwin') {
            const hasAudioPermission = electron_1.systemPreferences.getMediaAccessStatus('microphone');
            if (hasAudioPermission !== 'granted') {
                yield electron_1.systemPreferences.askForMediaAccess('microphone');
            }
        }
    });
}
function createWindow() {
    const mainWindow = new electron_1.BrowserWindow({
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
    if (true) {
        mainWindow.webContents.once('did-finish-load', () => {
            setTimeout(() => {
                mainWindow.webContents.openDevTools();
            }, 500); // Delay helps avoid disconnection
        });
    }
    // Handle desktop capture request
    electron_1.ipcMain.handle('GET_SYSTEM_AUDIO_SOURCE', () => __awaiter(this, void 0, void 0, function* () {
        try {
            const sources = yield electron_1.desktopCapturer.getSources({
                types: ['window', 'screen'],
                thumbnailSize: { width: 0, height: 0 },
                fetchWindowIcons: false
            });
            let selectedSource = sources.find(source => source.name.toLowerCase().includes('system audio') ||
                source.name.toLowerCase().includes('internal audio'));
            if (!selectedSource) {
                selectedSource = sources.find(source => source.name === 'Entire Screen' ||
                    source.name === 'Screen 1' ||
                    source.id.includes('screen:0:0'));
            }
            if (!selectedSource) {
                throw new Error('No suitable audio source found');
            }
            return selectedSource.id;
        }
        catch (error) {
            console.error('Error getting system audio source:', error);
            throw error;
        }
    }));
    // Open external URLs in browser
    electron_1.ipcMain.handle('OPEN_IN_BROWSER', (event, url) => __awaiter(this, void 0, void 0, function* () {
        if (typeof url === 'string' && url.startsWith('http')) {
            yield electron_1.shell.openExternal(url);
        }
    }));
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
        const isDev = "development" === 'development';
        callback({
            responseHeaders: Object.assign(Object.assign({}, details.responseHeaders), { 'Content-Security-Policy': [
                    isDev
                        ? "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:"
                        : "default-src 'self'"
                ] })
        });
    });
    // Prevent the window from closing (minimize instead)
    mainWindow.on('close', (event) => {
        if (electron_1.app.quitting) {
            mainWindow.destroy();
        }
        else {
            event.preventDefault();
            mainWindow.hide();
        }
    });
    // macOS: flash dock icon
    if (process.platform === 'darwin') {
        electron_1.app.dock.hide();
        setTimeout(() => {
            electron_1.app.dock.show();
        }, 500);
    }
}
// Ensure single instance
const gotTheLock = electron_1.app.requestSingleInstanceLock();
if (!gotTheLock) {
    electron_1.app.quit();
}
else {
    electron_1.app.whenReady().then(() => __awaiter(void 0, void 0, void 0, function* () {
        yield checkAndRequestPermissions();
        createWindow();
        electron_1.app.on('activate', () => {
            if (electron_1.BrowserWindow.getAllWindows().length === 0) {
                createWindow();
            }
        });
    }));
}
electron_1.app.quitting = false;
electron_1.app.on('before-quit', () => {
    electron_1.app.quitting = true;
});
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});


/***/ }),

/***/ "electron":
/*!***************************!*\
  !*** external "electron" ***!
  \***************************/
/***/ ((module) => {

module.exports = require("electron");

/***/ }),

/***/ "path":
/*!***********************!*\
  !*** external "path" ***!
  \***********************/
/***/ ((module) => {

module.exports = require("path");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __webpack_require__("./src/main/main.ts");
/******/ 	
/******/ })()
;
//# sourceMappingURL=main.js.map