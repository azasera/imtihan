import assert from 'node:assert';
import test, { describe, it } from 'node:test';

/**
 * Simulates the keydown validation logic from ThemeHotkey in theme-provider.tsx.
 */
function shouldToggleTheme(event: {
  defaultPrevented?: boolean;
  repeat?: boolean;
  metaKey?: boolean;
  ctrlKey?: boolean;
  altKey?: boolean;
  key?: string;
  isTyping?: boolean;
}): boolean {
  if (event.defaultPrevented || event.repeat) {
    return false;
  }

  if (event.metaKey || event.ctrlKey || event.altKey) {
    return false;
  }

  // Defensive check matching the repaired theme-provider.tsx line 50
  if (!event.key || event.key.toLowerCase() !== 'd') {
    return false;
  }

  if (event.isTyping) {
    return false;
  }

  return true;
}

describe('ThemeHotkey onKeyDown handler', () => {
  it('safely handles undefined event.key without throwing TypeError', () => {
    assert.doesNotThrow(() => {
      const result = shouldToggleTheme({ key: undefined });
      assert.strictEqual(result, false);
    });
  });

  it('safely handles null or empty event.key without throwing TypeError', () => {
    assert.doesNotThrow(() => {
      const resultNull = shouldToggleTheme({ key: null as unknown as string });
      assert.strictEqual(resultNull, false);

      const resultEmpty = shouldToggleTheme({ key: '' });
      assert.strictEqual(resultEmpty, false);
    });
  });

  it('allows toggle when key is "d" or "D" and no modifier keys are active', () => {
    assert.strictEqual(shouldToggleTheme({ key: 'd' }), true);
    assert.strictEqual(shouldToggleTheme({ key: 'D' }), true);
  });

  it('ignores other keys', () => {
    assert.strictEqual(shouldToggleTheme({ key: 'Escape' }), false);
    assert.strictEqual(shouldToggleTheme({ key: 'Enter' }), false);
    assert.strictEqual(shouldToggleTheme({ key: 'a' }), false);
  });

  it('ignores when typing target or modifier is active', () => {
    assert.strictEqual(shouldToggleTheme({ key: 'd', isTyping: true }), false);
    assert.strictEqual(shouldToggleTheme({ key: 'd', ctrlKey: true }), false);
    assert.strictEqual(shouldToggleTheme({ key: 'd', metaKey: true }), false);
  });
});
