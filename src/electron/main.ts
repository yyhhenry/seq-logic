import { app, BrowserWindow, Menu } from 'electron';
import path from 'path';
import { handleWholeModule } from './handler/handleWholeModule';
import { wholeHandler } from './handler/handler';
import { isDevelopmentMode } from './isDevelopmentMode';
// 禁用硬件加速的确会导致性能的大幅下降
// app.disableHardwareAcceleration();
const mainFolder = path.dirname(__dirname);
const resourcesFolder = path.join(mainFolder, '../resources');
if (!isDevelopmentMode) {
    Menu.setApplicationMenu(null);
}
const createWindow = () => {
    const mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        minWidth: 800,
        minHeight: 600,
        titleBarStyle: 'hidden',
        titleBarOverlay: {
            color: 'rgb(68, 132, 229)',
            symbolColor: 'white',
        },
        webPreferences: {
            preload: path.join(mainFolder, 'electron/preload.js'),
        },
        show: false,
    });
    mainWindow.on('ready-to-show', () => mainWindow.show());
    if (isDevelopmentMode) {
        mainWindow.loadURL('http://localhost:3000');
    } else {
        mainWindow.loadFile(path.join(mainFolder, 'src/index.html'));
    }
    mainWindow.setIcon(path.join(resourcesFolder, 'icon.png'));
};

app.whenReady().then(async () => {
    await handleWholeModule(wholeHandler);
    createWindow();
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
