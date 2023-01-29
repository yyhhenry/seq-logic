import { app, BrowserWindow, Menu } from 'electron';
import path from 'path';
import { handleWholeModule } from './handler/handleWholeModule';
import { wholeHandler } from './handler/handler';
// 禁用硬件加速的确会导致性能的大幅下降
// app.disableHardwareAcceleration();
const isDevelopmentMode = process.env.MODE === 'development';
const mainFolder = __dirname;
const resourcesFolder = path.join(mainFolder, '../resources');
if (!isDevelopmentMode) {
    Menu.setApplicationMenu(null);
}
const createWindow = () => {
    const mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        useContentSize: true,
        webPreferences: {
            preload: path.join(mainFolder, 'preload.js'),
        },
    });
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
