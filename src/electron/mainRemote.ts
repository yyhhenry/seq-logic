import type { app, dialog } from 'electron';
export const remoteList = [
    'app.getPath',
    'dialog.showOpenDialog',
    'dialog.showOpenDialogSync',
    'dialog.showSaveDialog',
    'dialog.showSaveDialogSync',
    'dialog.showMessageBox',
    'dialog.showMessageBoxSync',
    'dialog.showErrorBox',
    'dialog.showCertificateTrustDialog',
];
export type MainRemote = {
    'app.getPath': typeof app.getPath;
    'dialog.showOpenDialog': typeof dialog.showOpenDialog;
    'dialog.showOpenDialogSync': typeof dialog.showOpenDialogSync;
    'dialog.showSaveDialog': typeof dialog.showSaveDialog;
    'dialog.showSaveDialogSync': typeof dialog.showSaveDialogSync;
    'dialog.showMessageBox': typeof dialog.showMessageBox;
    'dialog.showMessageBoxSync': typeof dialog.showMessageBoxSync;
    'dialog.showErrorBox': typeof dialog.showErrorBox;
    'dialog.showCertificateTrustDialog': typeof dialog.showCertificateTrustDialog;
};
