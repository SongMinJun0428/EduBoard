(function () {
  'use strict';

  const ITERATIONS = 120000;
  const KEY_LENGTH = 32;
  const PREFIX = 'pbkdf2';

  function toHex(bytes) {
    return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  }

  function fromHex(hex) {
    const out = new Uint8Array(hex.length / 2);
    for (let i = 0; i < out.length; i += 1) {
      out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    }
    return out;
  }

  async function derive(password, saltHex, iterations = ITERATIONS) {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      enc.encode(password),
      'PBKDF2',
      false,
      ['deriveBits']
    );

    const bits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: fromHex(saltHex),
        iterations,
        hash: 'SHA-256'
      },
      keyMaterial,
      KEY_LENGTH * 8
    );

    return toHex(new Uint8Array(bits));
  }

  async function hash(password) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const saltHex = toHex(salt);
    const hashHex = await derive(password, saltHex, ITERATIONS);
    return `${PREFIX}$${ITERATIONS}$${saltHex}$${hashHex}`;
  }

  async function verify(password, storedValue) {
    if (!storedValue) return { ok: false, needsUpgrade: false, normalized: null };

    if (!storedValue.startsWith(`${PREFIX}$`)) {
      return {
        ok: storedValue === password,
        needsUpgrade: storedValue === password,
        normalized: storedValue === password ? await hash(password) : null
      };
    }

    const parts = storedValue.split('$');
    if (parts.length !== 4) return { ok: false, needsUpgrade: false, normalized: null };

    const iterations = parseInt(parts[1], 10);
    const saltHex = parts[2];
    const expected = parts[3];
    const actual = await derive(password, saltHex, iterations);

    return {
      ok: actual === expected,
      needsUpgrade: false,
      normalized: storedValue
    };
  }

  window.EduPassword = {
    hash,
    verify,
    isHashed(value) {
      return typeof value === 'string' && value.startsWith(`${PREFIX}$`);
    }
  };
})();
