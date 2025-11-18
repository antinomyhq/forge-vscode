import * as assert from 'assert';
import { resolveTerminalStrategy, getStrategyDescription } from '../../../app/services/terminalStrategyResolver';
import { TerminalStrategy } from '../../../domain/valueObjects/TerminalStrategy';

suite('Terminal Strategy Resolver Tests (Pure Functions)', () => {
    test('resolveTerminalStrategy() with 2 terminals and 0 processes should return COPY_ONLY_MULTIPLE_TERMINALS', () => {
        const strategy = resolveTerminalStrategy(2, 0);
        assert.strictEqual(strategy, TerminalStrategy.COPY_ONLY_MULTIPLE_TERMINALS);
    });

    test('resolveTerminalStrategy() with 3+ terminals and 0 processes should return COPY_ONLY_MULTIPLE_TERMINALS', () => {
        const strategy = resolveTerminalStrategy(5, 0);
        assert.strictEqual(strategy, TerminalStrategy.COPY_ONLY_MULTIPLE_TERMINALS);
    });

    test('resolveTerminalStrategy() with 1 terminal and 1 process should return COPY_ONLY_MIXED_PROCESSES', () => {
        const strategy = resolveTerminalStrategy(1, 1);
        assert.strictEqual(strategy, TerminalStrategy.COPY_ONLY_MIXED_PROCESSES);
    });

    test('resolveTerminalStrategy() with 1 terminal and 2+ processes should return COPY_ONLY_MIXED_PROCESSES', () => {
        const strategy = resolveTerminalStrategy(1, 3);
        assert.strictEqual(strategy, TerminalStrategy.COPY_ONLY_MIXED_PROCESSES);
    });

    test('resolveTerminalStrategy() with 1 terminal and 0 processes should return REUSE_EXISTING_TERMINAL', () => {
        const strategy = resolveTerminalStrategy(1, 0);
        assert.strictEqual(strategy, TerminalStrategy.REUSE_EXISTING_TERMINAL);
    });

    test('resolveTerminalStrategy() with 0 terminals and 0 processes should return CREATE_NEW_TERMINAL', () => {
        const strategy = resolveTerminalStrategy(0, 0);
        assert.strictEqual(strategy, TerminalStrategy.CREATE_NEW_TERMINAL);
    });

    test('resolveTerminalStrategy() with 0 terminals and 1 process should return PROMPT_FOR_INTERNAL_LAUNCH', () => {
        const strategy = resolveTerminalStrategy(0, 1);
        assert.strictEqual(strategy, TerminalStrategy.PROMPT_FOR_INTERNAL_LAUNCH);
    });

    test('resolveTerminalStrategy() with 0 terminals and 2+ processes should return PROMPT_FOR_INTERNAL_LAUNCH', () => {
        const strategy = resolveTerminalStrategy(0, 3);
        assert.strictEqual(strategy, TerminalStrategy.PROMPT_FOR_INTERNAL_LAUNCH);
    });

    test('getStrategyDescription() should return correct description for COPY_ONLY_MULTIPLE_TERMINALS', () => {
        const desc = getStrategyDescription(TerminalStrategy.COPY_ONLY_MULTIPLE_TERMINALS);
        assert.ok(desc.includes('Multiple Forge terminals'));
    });

    test('getStrategyDescription() should return correct description for COPY_ONLY_MIXED_PROCESSES', () => {
        const desc = getStrategyDescription(TerminalStrategy.COPY_ONLY_MIXED_PROCESSES);
        assert.ok(desc.includes('internally and externally'));
    });

    test('getStrategyDescription() should return correct description for REUSE_EXISTING_TERMINAL', () => {
        const desc = getStrategyDescription(TerminalStrategy.REUSE_EXISTING_TERMINAL);
        assert.ok(desc.includes('Reusing'));
    });

    test('getStrategyDescription() should return correct description for CREATE_NEW_TERMINAL', () => {
        const desc = getStrategyDescription(TerminalStrategy.CREATE_NEW_TERMINAL);
        assert.ok(desc.includes('Creating'));
    });

    test('getStrategyDescription() should return correct description for PROMPT_FOR_INTERNAL_LAUNCH', () => {
        const desc = getStrategyDescription(TerminalStrategy.PROMPT_FOR_INTERNAL_LAUNCH);
        assert.ok(desc.includes('External Forge'));
    });

    test('resolveTerminalStrategy() should be deterministic with same inputs', () => {
        const strategy1 = resolveTerminalStrategy(1, 0);
        const strategy2 = resolveTerminalStrategy(1, 0);
        assert.strictEqual(strategy1, strategy2);
    });

    test('resolveTerminalStrategy() should handle edge cases correctly', () => {
        // Large numbers should still work correctly
        assert.strictEqual(resolveTerminalStrategy(100, 0), TerminalStrategy.COPY_ONLY_MULTIPLE_TERMINALS);
        assert.strictEqual(resolveTerminalStrategy(0, 100), TerminalStrategy.PROMPT_FOR_INTERNAL_LAUNCH);
        assert.strictEqual(resolveTerminalStrategy(1, 100), TerminalStrategy.COPY_ONLY_MIXED_PROCESSES);
    });
});
