import * as vscode from 'vscode';
import { ForgeInfra } from '../infra/ForgeInfra';
import { ForgeApp } from '../app/ForgeApp';
import { ForgeService } from '../service/ForgeService';

export function activate(context: vscode.ExtensionContext): void {
  // eslint-disable-next-line no-console
  console.log('[Forge] Extension activating...');
  const infra = new ForgeInfra(context);
  const app = new ForgeApp(infra);
  const service = new ForgeService(app);
  // Command: Start a new Forge session
  const startNewForgeSessionCmd = vscode.commands.registerCommand(
    'forgecode.startNewForgeSession',
    async () => {
      await service.startNewForgeSession();
    }
  );

  // Command: Copy file reference (uses configured format)
  const copyFileReferenceCmd = vscode.commands.registerCommand(
    'forgecode.copyFileReference',
    async () => {
      await service.copyFileReference();
    }
  );

  // Command: Copy file reference with absolute path
  const copyFileReferenceAbsoluteCmd = vscode.commands.registerCommand(
    'forgecode.copyFileReferenceAbsolute',
    async () => {
      await service.copyFileReferenceAbsolute();
    }
  );

  // Command: Copy file reference with relative path
  const copyFileReferenceRelativeCmd = vscode.commands.registerCommand(
    'forgecode.copyFileReferenceRelative',
    async () => {
      await service.copyFileReferenceRelative();
    }
  );

  // ==========================================
  // Register disposables for cleanup
  // ==========================================
  
  context.subscriptions.push(
    startNewForgeSessionCmd,
    copyFileReferenceCmd,
    copyFileReferenceAbsoluteCmd,
    copyFileReferenceRelativeCmd
  );

  // eslint-disable-next-line no-console
  console.log('[Forge] Extension activated successfully');
  // eslint-disable-next-line no-console
  console.log('[Forge] Architecture: ForgeService<ForgeApp<ForgeInfra>>');
}

/**
 * Extension deactivation function
 */
export function deactivate(): void {
  // eslint-disable-next-line no-console
  console.log('[Forge] Extension deactivating...');
}
