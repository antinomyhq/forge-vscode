import * as assert from 'assert';
import { ForgeService } from '../../service/ForgeService';

/**
 * Mock ForgeApp for testing ForgeService
 * Implements the methods that ForgeService expects from ForgeApp
 */
class MockForgeApp {
  public copyFileReferenceCalls: Array<{ format?: 'absolute' | 'relative' }> = [];
  public startForgeSessionCalls: number = 0;
  public shouldThrowError = false;

  public async copyFileReference(format?: 'absolute' | 'relative'): Promise<void> {
    this.copyFileReferenceCalls.push({ format });
    
    if (this.shouldThrowError) {
      throw new Error('Mock error');
    }
  }

  public async startForgeSession(): Promise<void> {
    this.startForgeSessionCalls++;
    
    if (this.shouldThrowError) {
      throw new Error('Mock error');
    }
  }

  // Helper methods for testing
  public reset(): void {
    this.copyFileReferenceCalls = [];
    this.startForgeSessionCalls = 0;
    this.shouldThrowError = false;
  }

  public getLastCopyFileReferenceCall(): { format?: 'absolute' | 'relative' } | undefined {
    return this.copyFileReferenceCalls[this.copyFileReferenceCalls.length - 1];
  }
}

suite('ForgeService Tests', () => {
  let mockApp: MockForgeApp;
  let service: ForgeService<MockForgeApp>;

  setup(() => {
    mockApp = new MockForgeApp();
    service = new ForgeService(mockApp);
  });

  teardown(() => {
    mockApp.reset();
  });

  // copyFileReference() tests
  test('copyFileReference() should call app.copyFileReference() with no format', async () => {
    await service.copyFileReference();

    assert.strictEqual(mockApp.copyFileReferenceCalls.length, 1);
    assert.strictEqual(mockApp.getLastCopyFileReferenceCall()?.format, undefined);
  });

  test('copyFileReference() should propagate errors from app layer', async () => {
    mockApp.shouldThrowError = true;

    await assert.rejects(
      async () => await service.copyFileReference(),
      /Mock error/
    );
  });

  // copyFileReferenceAbsolute() tests
  test('copyFileReferenceAbsolute() should call app.copyFileReference() with absolute format', async () => {
    await service.copyFileReferenceAbsolute();

    assert.strictEqual(mockApp.copyFileReferenceCalls.length, 1);
    assert.strictEqual(mockApp.getLastCopyFileReferenceCall()?.format, 'absolute');
  });

  test('copyFileReferenceAbsolute() should propagate errors from app layer', async () => {
    mockApp.shouldThrowError = true;

    await assert.rejects(
      async () => await service.copyFileReferenceAbsolute(),
      /Mock error/
    );
  });

  // copyFileReferenceRelative() tests
  test('copyFileReferenceRelative() should call app.copyFileReference() with relative format', async () => {
    await service.copyFileReferenceRelative();

    assert.strictEqual(mockApp.copyFileReferenceCalls.length, 1);
    assert.strictEqual(mockApp.getLastCopyFileReferenceCall()?.format, 'relative');
  });

  test('copyFileReferenceRelative() should propagate errors from app layer', async () => {
    mockApp.shouldThrowError = true;

    await assert.rejects(
      async () => await service.copyFileReferenceRelative(),
      /Mock error/
    );
  });

  // startNewForgeSession() tests
  test('startNewForgeSession() should call app.startForgeSession()', async () => {
    await service.startNewForgeSession();

    assert.strictEqual(mockApp.startForgeSessionCalls, 1);
  });

  test('startNewForgeSession() should propagate errors from app layer', async () => {
    mockApp.shouldThrowError = true;

    await assert.rejects(
      async () => await service.startNewForgeSession(),
      /Mock error/
    );
  });

  // Error handling tests
  test('Error Handling: copyFileReference should log and throw errors', async () => {
    mockApp.shouldThrowError = true;

    await assert.rejects(
      async () => await service.copyFileReference(),
      /Mock error/
    );
  });

  test('Error Handling: copyFileReferenceAbsolute should log and throw errors', async () => {
    mockApp.shouldThrowError = true;

    await assert.rejects(
      async () => await service.copyFileReferenceAbsolute(),
      /Mock error/
    );
  });

  test('Error Handling: copyFileReferenceRelative should log and throw errors', async () => {
    mockApp.shouldThrowError = true;

    await assert.rejects(
      async () => await service.copyFileReferenceRelative(),
      /Mock error/
    );
  });

  test('Error Handling: startNewForgeSession should log and throw errors', async () => {
    mockApp.shouldThrowError = true;

    await assert.rejects(
      async () => await service.startNewForgeSession(),
      /Mock error/
    );
  });

  // Multiple calls tests
  test('Multiple Calls: should handle multiple copyFileReference calls', async () => {
    await service.copyFileReference();
    await service.copyFileReferenceAbsolute();
    await service.copyFileReferenceRelative();

    assert.strictEqual(mockApp.copyFileReferenceCalls.length, 3);
    assert.strictEqual(mockApp.copyFileReferenceCalls[0].format, undefined);
    assert.strictEqual(mockApp.copyFileReferenceCalls[1].format, 'absolute');
    assert.strictEqual(mockApp.copyFileReferenceCalls[2].format, 'relative');
  });

  test('Multiple Calls: should handle multiple startForgeSession calls', async () => {
    await service.startNewForgeSession();
    await service.startNewForgeSession();

    assert.strictEqual(mockApp.startForgeSessionCalls, 2);
  });
});
