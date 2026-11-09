// review-0023-test-a_b.js
// Test a_b - Observe identity a_b
// PASS: The exact identity is visible
// FAIL: The identity is wrong
// Generated from plan.ts. Edit the plan, not this file.
// Run: playwright-cli run-code --filename=<abs path to this file>
async (page) => {
  const BASE = "http://127.0.0.1:38879";
  const SHOTS = "/tmp/ce-review-0023-proof-2TiFur/collect-evidence-S7NMjI/report/shots";
  const E = [];
  const CAP = {};
  let CURRENT = "a_b.1";
  let lastCapture = {};
  let nativePrompt = '';
  let captureFailed = false;
  let assertionPassed = false;
  const onDialog = async (dialog) => {
    nativePrompt = 'SAFETY STOP ' + CURRENT + ': native ' + dialog.type() + ' dialog; human handling required';
    await dialog.dismiss().catch(() => {});
  };
  page.on('dialog', onDialog);
  const capture = async (shot, sequence) => {
    if (nativePrompt) throw new Error(nativePrompt);
    try { await page.screenshot({ path: SHOTS + '/' + shot.replace(/^shots\//, '') }); }
    catch (error) { captureFailed = true; throw error; }
    const capturedAt = new Date().toISOString();
    const viewport = await page.evaluate(() => ({width: innerWidth, height: innerHeight, deviceScaleFactor: devicePixelRatio}));
    return { screenshot: shot, capturedAt, viewport, captureSequence: sequence };
  };
  const resolve = async (L) => { try { return await L.evaluate(e => e.outerHTML.slice(0, 120)); } catch { return String(L); } };
  const until = async (check, ms) => {
    const t0 = Date.now();
    for (;;) {
      try { return await check(); }
      catch (e) { if (Date.now() - t0 > ms) throw e; await new Promise((r) => setTimeout(r, 200)); }
    }
  };
  const settle = async (check, ms, shot) => {
    if (shot) {
      lastCapture = await capture(shot, 1);
      E.push({test:"a_b",step:CURRENT,action:'capture',target:'pre-assertion',resolved:'',url:page.url(),...lastCapture,observed:'Captured before expect.',verdict:'',note:''});
    }
    const value = await until(check, ms);
    assertionPassed = true;
    if (shot) lastCapture = await capture(shot.replace('--capture-001.', '--capture-002.'), 2);
    return value;
  };

  try {
  // a_b.1 Open http://127.0.0.1:38879/?id=a_b.
  CURRENT = "a_b.1"; lastCapture = {}; captureFailed = false; assertionPassed = false;
  if (nativePrompt) throw new Error(nativePrompt);
  await page.evaluate(() => (function(){
    var origins=["http://127.0.0.1:38879"];
    var visible=function(e){var r=e.getBoundingClientRect();var s=getComputedStyle(e);return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none';};
    var inspect=function(root){
      var nodes=Array.from(root.querySelectorAll('input,form,dialog,[role="dialog"],h1,h2,h3,[role="heading"],iframe'));
      if(nodes.some(function(e){
        if(!visible(e))return false;
        if(e.tagName==='IFRAME') { try { return !e.contentDocument||inspect(e.contentDocument); } catch { return true; } }
        if(e.tagName==='INPUT')return e.type==='password'||/^(username|current-password|new-password|one-time-code)$/.test(e.autocomplete);
        return /\b(sign\s*in|log\s*in|username|password|passcode|verification code|two.factor|authenticate|credentials?)\b/i.test(e.innerText||'');
      }))return true;
      return Array.from(root.querySelectorAll('*')).some(function(e){return visible(e)&&e.shadowRoot&&inspect(e.shadowRoot);});
    };
    if(inspect(document))throw new Error("SAFETY STOP a_b.1: credential prompt or uninspectable frame; human handling required");
    if(location.href!=='about:blank'&&!origins.includes(location.origin))throw new Error("SAFETY STOP a_b.1: current origin is not approved");
    if(!origins.includes(new URL("/?id=a_b","http://127.0.0.1:38879").origin))throw new Error("SAFETY STOP a_b.1: navigation origin is not approved");
    if(!true)throw new Error("SAFETY STOP a_b.1: confirmation step is not explicitly approved");
    return 'safe';
  })());
  await page.goto("http://127.0.0.1:38879/?id=a_b");
  await page.evaluate(() => (function(){
    var origins=["http://127.0.0.1:38879"];
    var visible=function(e){var r=e.getBoundingClientRect();var s=getComputedStyle(e);return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none';};
    var inspect=function(root){
      var nodes=Array.from(root.querySelectorAll('input,form,dialog,[role="dialog"],h1,h2,h3,[role="heading"],iframe'));
      if(nodes.some(function(e){
        if(!visible(e))return false;
        if(e.tagName==='IFRAME') { try { return !e.contentDocument||inspect(e.contentDocument); } catch { return true; } }
        if(e.tagName==='INPUT')return e.type==='password'||/^(username|current-password|new-password|one-time-code)$/.test(e.autocomplete);
        return /\b(sign\s*in|log\s*in|username|password|passcode|verification code|two.factor|authenticate|credentials?)\b/i.test(e.innerText||'');
      }))return true;
      return Array.from(root.querySelectorAll('*')).some(function(e){return visible(e)&&e.shadowRoot&&inspect(e.shadowRoot);});
    };
    if(inspect(document))throw new Error("SAFETY STOP a_b.1: credential prompt or uninspectable frame; human handling required");
    if(location.href!=='about:blank'&&!origins.includes(location.origin))throw new Error("SAFETY STOP a_b.1: current origin is not approved");
    
    if(!true)throw new Error("SAFETY STOP a_b.1: confirmation step is not explicitly approved");
    return 'safe';
  })());
  if (nativePrompt) throw new Error(nativePrompt); E.push({ test: "a_b", step: "a_b.1", action: "navigate", target: "/?id=a_b", resolved: "", url: page.url(), screenshot: '', ...lastCapture, observed: "Page loaded.", verdict: "", note: "", assertionPassed: false });
  // a_b.2 Confirm h1 contains "Identity a_b".
  CURRENT = "a_b.2"; lastCapture = {}; captureFailed = false; assertionPassed = false;
  if (nativePrompt) throw new Error(nativePrompt);
  await page.evaluate(() => (function(){
    var origins=["http://127.0.0.1:38879"];
    var visible=function(e){var r=e.getBoundingClientRect();var s=getComputedStyle(e);return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none';};
    var inspect=function(root){
      var nodes=Array.from(root.querySelectorAll('input,form,dialog,[role="dialog"],h1,h2,h3,[role="heading"],iframe'));
      if(nodes.some(function(e){
        if(!visible(e))return false;
        if(e.tagName==='IFRAME') { try { return !e.contentDocument||inspect(e.contentDocument); } catch { return true; } }
        if(e.tagName==='INPUT')return e.type==='password'||/^(username|current-password|new-password|one-time-code)$/.test(e.autocomplete);
        return /\b(sign\s*in|log\s*in|username|password|passcode|verification code|two.factor|authenticate|credentials?)\b/i.test(e.innerText||'');
      }))return true;
      return Array.from(root.querySelectorAll('*')).some(function(e){return visible(e)&&e.shadowRoot&&inspect(e.shadowRoot);});
    };
    if(inspect(document))throw new Error("SAFETY STOP a_b.2: credential prompt or uninspectable frame; human handling required");
    if(location.href!=='about:blank'&&!origins.includes(location.origin))throw new Error("SAFETY STOP a_b.2: current origin is not approved");
    
    if(!true)throw new Error("SAFETY STOP a_b.2: confirmation step is not explicitly approved");
    return 'safe';
  })());
  { const L = page.locator("h1");
    const T = await settle(async () => {
      if (await L.count() === 0) throw new Error("ASSERT FAIL a_b.2: h1 not found");
      const T = (await L.first().textContent() || '').trim();
      if (!T.includes("Identity a_b")) throw new Error("ASSERT FAIL a_b.2: expected \"Identity a_b\", got \"" + T + '"');
      return T; }, 5000, "shots/step-a_b-002-distinct-identity--capture-001.png");
    const R = await resolve(L.first());
  if (nativePrompt) throw new Error(nativePrompt); E.push({ test: "a_b", step: "a_b.2", action: "assert", target: "h1", resolved: R, url: page.url(), screenshot: '', ...lastCapture, observed: "Found text: " + T, verdict: "", note: "", assertionPassed: true }); }

    return { records: E };
  } catch (error) {
    const message = nativePrompt || String(error?.message || error);
    return { records: E, failure: { step: CURRENT, message, blocked: message.includes('SAFETY STOP'), captureFailed, assertionPassed } };
  }
  finally { page.off('dialog', onDialog); }
}