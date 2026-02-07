const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const PROJECT_DIR = '/mnt/Store/Projects/Mine/Github/obsidian-remotestorage-sync';

(async () => {
  // Harness: each page creates ONE peer. They sync via BroadcastChannel (same origin).
  const testHarnessCode = `
import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';

const LOCAL_ORIGIN = Symbol('local-origin');

function readNoteContent(doc) {
  return doc.getText('content').toString();
}

function readAttachmentData(doc) {
  const att = doc.getMap('attachment');
  const data = att.get('data');
  return data instanceof Uint8Array ? data : null;
}

// Create a single peer for a note room
window.createNotePeer = function(roomName, initialContent) {
  const doc = new Y.Doc();
  const text = doc.getText('content');
  if (initialContent && initialContent.length > 0) text.insert(0, initialContent);
  const meta = doc.getMap('meta');
  meta.set('path', 'Notes/shared.md');
  meta.set('type', 'note');
  
  // No signaling server - rely on BroadcastChannel for same-origin sync
  const provider = new WebrtcProvider(roomName, doc, { signaling: [] });
  
  window.__PEER_DOC__ = doc;
  window.__PEER_PROVIDER__ = provider;
  return { content: readNoteContent(doc) };
};

// Create a single peer for an attachment room
window.createAttachmentPeer = function(roomName, dataArray) {
  const doc = new Y.Doc();
  const meta = doc.getMap('meta');
  meta.set('path', 'Assets/test.bin');
  meta.set('type', 'attachment');
  const att = doc.getMap('attachment');
  if (dataArray && dataArray.length > 0) {
    att.set('data', new Uint8Array(dataArray));
  }
  
  const provider = new WebrtcProvider(roomName, doc, { signaling: [] });
  
  window.__PEER_DOC__ = doc;
  window.__PEER_PROVIDER__ = provider;
  return { hasData: readAttachmentData(doc) !== null };
};

window.getNoteContent = function() {
  return readNoteContent(window.__PEER_DOC__);
};

window.setNoteContent = function(content) {
  const doc = window.__PEER_DOC__;
  doc.transact(() => {
    const text = doc.getText('content');
    text.delete(0, text.length);
    if (content.length > 0) text.insert(0, content);
  }, LOCAL_ORIGIN);
};

window.getAttachmentData = function() {
  const data = readAttachmentData(window.__PEER_DOC__);
  return data ? Array.from(data) : null;
};

window.setAttachmentData = function(dataArray) {
  const doc = window.__PEER_DOC__;
  doc.transact(() => {
    doc.getMap('attachment').set('data', new Uint8Array(dataArray));
  }, LOCAL_ORIGIN);
};

window.destroyPeer = function() {
  if (window.__PEER_PROVIDER__) window.__PEER_PROVIDER__.destroy();
  if (window.__PEER_DOC__) window.__PEER_DOC__.destroy();
};

window.__TEST_READY__ = true;
`;

  // Write harness inside project for dep resolution
  const harnessPath = path.join(PROJECT_DIR, 'src/__tests__/two-peer-browser-harness.mjs');
  fs.writeFileSync(harnessPath, testHarnessCode);

  console.log('📦 Bundling test harness...');
  try {
    execSync(
      `cd ${PROJECT_DIR} && npx esbuild src/__tests__/two-peer-browser-harness.mjs --bundle --format=iife --outfile=/tmp/two-peer-bundle.js --platform=browser`,
      { stdio: 'pipe' }
    );
  } catch (err) {
    console.error('esbuild failed:', err.stderr?.toString());
    process.exit(1);
  }

  // Create HTML page
  const bundleCode = fs.readFileSync('/tmp/two-peer-bundle.js', 'utf-8');
  const html = `<!DOCTYPE html>
<html><head><title>Two-Peer WebRTC Test</title></head>
<body>
  <h1 id="role">Peer</h1>
  <pre id="output"></pre>
  <script>${bundleCode}</script>
</body></html>`;
  fs.writeFileSync('/tmp/two-peer-test.html', html);
  console.log('✅ Bundle + HTML ready');

  // Helper to poll for a condition
  async function waitForCondition(page, fn, label, timeoutMs = 30000) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const result = await page.evaluate(fn);
      if (result) return result;
      await new Promise(r => setTimeout(r, 200));
    }
    throw new Error('Timeout: ' + label);
  }

  // Launch headful browser
  console.log('🌐 Launching Chromium (headful)...');
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();

  // Two separate pages = two separate JS contexts, same origin
  const pageA = await context.newPage();
  const pageB = await context.newPage();

  for (const [label, pg] of [['A', pageA], ['B', pageB]]) {
    pg.on('console', msg => {
      if (msg.type() === 'error') console.error(`  [${label} error]`, msg.text());
    });
    pg.on('pageerror', err => console.error(`  [${label} page error]`, err.message));
  }

  await pageA.goto('file:///tmp/two-peer-test.html');
  await pageB.goto('file:///tmp/two-peer-test.html');
  await pageA.waitForFunction(() => window.__TEST_READY__ === true, null, { timeout: 10000 });
  await pageB.waitForFunction(() => window.__TEST_READY__ === true, null, { timeout: 10000 });
  console.log('✅ Both pages loaded\n');

  let allPassed = true;

  // ─── NOTE SYNC TEST ───
  console.log('📝 TEST 1: Two-peer note sync via WebRTC + BroadcastChannel');
  const noteRoom = 'note-test-' + Date.now();

  // Peer A creates doc with content
  await pageA.evaluate((room) => window.createNotePeer(room, 'Hello from peer A'), noteRoom);
  console.log('  Peer A created with "Hello from peer A"');

  // Peer B creates empty doc in same room
  await pageB.evaluate((room) => window.createNotePeer(room, ''), noteRoom);
  console.log('  Peer B created (empty)');

  // Wait for B to receive A's content
  try {
    await waitForCondition(pageB, () => {
      const c = window.getNoteContent();
      return c === 'Hello from peer A' ? c : false;
    }, 'Peer B to receive A content', 15000);
    console.log('  ✅ Peer B received: "Hello from peer A"');
  } catch (e) {
    const actual = await pageB.evaluate(() => window.getNoteContent());
    console.error(`  ❌ Peer B has: "${actual}" (expected "Hello from peer A")`);
    allPassed = false;
  }

  // B modifies content
  await pageB.evaluate(() => window.setNoteContent('Updated by peer B'));
  console.log('  Peer B set content to "Updated by peer B"');

  // Wait for A to receive
  try {
    await waitForCondition(pageA, () => {
      const c = window.getNoteContent();
      return c === 'Updated by peer B' ? c : false;
    }, 'Peer A to receive B update', 15000);
    console.log('  ✅ Peer A received: "Updated by peer B"');
  } catch (e) {
    const actual = await pageA.evaluate(() => window.getNoteContent());
    console.error(`  ❌ Peer A has: "${actual}" (expected "Updated by peer B")`);
    allPassed = false;
  }

  await pageA.evaluate(() => window.destroyPeer());
  await pageB.evaluate(() => window.destroyPeer());

  // ─── ATTACHMENT SYNC TEST ───
  console.log('\n📎 TEST 2: Two-peer attachment sync via WebRTC + BroadcastChannel');
  const attachRoom = 'attach-test-' + Date.now();

  // Peer A creates doc with binary
  await pageA.evaluate((room) => window.createAttachmentPeer(room, [1, 2, 3, 4, 5]), attachRoom);
  console.log('  Peer A created with [1,2,3,4,5]');

  // Peer B creates empty attachment doc
  await pageB.evaluate((room) => window.createAttachmentPeer(room, []), attachRoom);
  console.log('  Peer B created (empty)');

  // Wait for B to receive
  try {
    await waitForCondition(pageB, () => {
      const d = window.getAttachmentData();
      return d && d.length === 5 ? JSON.stringify(d) : false;
    }, 'Peer B to receive attachment', 15000);
    const data = await pageB.evaluate(() => window.getAttachmentData());
    const matches = JSON.stringify(data) === JSON.stringify([1,2,3,4,5]);
    if (matches) {
      console.log('  ✅ Peer B received: [1,2,3,4,5]');
    } else {
      console.error(`  ❌ Peer B received: ${JSON.stringify(data)} (expected [1,2,3,4,5])`);
      allPassed = false;
    }
  } catch (e) {
    console.error(`  ❌ ${e.message}`);
    allPassed = false;
  }

  // B updates attachment
  await pageB.evaluate(() => window.setAttachmentData([9, 8, 7]));
  console.log('  Peer B set data to [9,8,7]');

  try {
    await waitForCondition(pageA, () => {
      const d = window.getAttachmentData();
      return d && d[0] === 9 ? JSON.stringify(d) : false;
    }, 'Peer A to receive updated attachment', 15000);
    const data = await pageA.evaluate(() => window.getAttachmentData());
    const matches = JSON.stringify(data) === JSON.stringify([9,8,7]);
    if (matches) {
      console.log('  ✅ Peer A received: [9,8,7]');
    } else {
      console.error(`  ❌ Peer A received: ${JSON.stringify(data)} (expected [9,8,7])`);
      allPassed = false;
    }
  } catch (e) {
    console.error(`  ❌ ${e.message}`);
    allPassed = false;
  }

  await pageA.evaluate(() => window.destroyPeer());
  await pageB.evaluate(() => window.destroyPeer());

  // ─── SUMMARY ───
  console.log('\n' + '='.repeat(60));
  if (allPassed) {
    console.log('✅ ALL TWO-PEER WEBRTC TESTS PASSED');
    console.log('  - Notes sync bidirectionally via BroadcastChannel ✓');
    console.log('  - Attachments sync bidirectionally via BroadcastChannel ✓');
  } else {
    console.log('❌ SOME TESTS FAILED (see above)');
  }
  console.log('='.repeat(60));

  await new Promise(r => setTimeout(r, 3000));
  await browser.close();

  // Cleanup temp harness
  try { fs.unlinkSync(path.join(PROJECT_DIR, 'src/__tests__/two-peer-browser-harness.mjs')); } catch(e) {}

  process.exit(allPassed ? 0 : 1);
})();
