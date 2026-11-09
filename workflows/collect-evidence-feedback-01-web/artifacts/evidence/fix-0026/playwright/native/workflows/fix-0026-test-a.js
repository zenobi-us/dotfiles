// fix-0026-test-a.js
// Test a - Observe identity a
// PASS: The exact identity is visible
// FAIL: The identity is wrong
// Generated from plan.ts. Edit the plan, not this file.
// Run: playwright-cli run-code --filename=<abs path to this file>
async (page) => {
  const BASE = "http://127.0.0.1:40211";
  const SHOTS = "/tmp/ce-fix-0026-proof-Tj74We/collect-evidence-NcABMF/report/shots";
  const E = [];
  const CAP = {};
  let CURRENT = "a.1";
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
      E.push({test:"a",step:CURRENT,action:'capture',target:'pre-assertion',resolved:'',url:page.url(),...lastCapture,observed:'Captured before expect.',verdict:'',note:''});
    }
    const value = await until(check, ms);
    assertionPassed = true;
    if (shot) lastCapture = await capture(shot.replace('--capture-001.', '--capture-002.'), 2);
    return value;
  };

  try {
  // a.1 Open the identity page without a screenshot
  //     Open http://127.0.0.1:40211/?id=a.
  CURRENT = "a.1"; lastCapture = {}; captureFailed = false; assertionPassed = false;
  if (nativePrompt) throw new Error(nativePrompt);
  await page.evaluate(() => (function(){
    var origins=["http://127.0.0.1:40211"];
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
    if(inspect(document))throw new Error("SAFETY STOP a.1: credential prompt or uninspectable frame; human handling required");
    if(location.href!=='about:blank'&&!origins.includes(location.origin))throw new Error("SAFETY STOP a.1: current origin is not approved");
    if(!origins.includes(new URL("/?id=a","http://127.0.0.1:40211").origin))throw new Error("SAFETY STOP a.1: navigation origin is not approved");
    if(!true)throw new Error("SAFETY STOP a.1: confirmation step is not explicitly approved");
    return 'safe';
  })());
  await page.goto("http://127.0.0.1:40211/?id=a");
  await page.evaluate(() => (function(){
    var origins=["http://127.0.0.1:40211"];
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
    if(inspect(document))throw new Error("SAFETY STOP a.1: credential prompt or uninspectable frame; human handling required");
    if(location.href!=='about:blank'&&!origins.includes(location.origin))throw new Error("SAFETY STOP a.1: current origin is not approved");
    
    if(!true)throw new Error("SAFETY STOP a.1: confirmation step is not explicitly approved");
    return 'safe';
  })());
  if (nativePrompt) throw new Error(nativePrompt); E.push({ test: "a", step: "a.1", action: "navigate", target: "/?id=a", resolved: "", url: page.url(), screenshot: '', ...lastCapture, observed: "Page loaded.", verdict: "", note: "", assertionPassed: false });
  // a.2 Check the exact identity
  //     Confirm h1 contains "Identity a".
  CURRENT = "a.2"; lastCapture = {}; captureFailed = false; assertionPassed = false;
  if (nativePrompt) throw new Error(nativePrompt);
  await page.evaluate(() => (function(){
    var origins=["http://127.0.0.1:40211"];
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
    if(inspect(document))throw new Error("SAFETY STOP a.2: credential prompt or uninspectable frame; human handling required");
    if(location.href!=='about:blank'&&!origins.includes(location.origin))throw new Error("SAFETY STOP a.2: current origin is not approved");
    
    if(!true)throw new Error("SAFETY STOP a.2: confirmation step is not explicitly approved");
    return 'safe';
  })());
  { const L = page.locator("h1");
    const T = await settle(async () => {
      if (await L.count() === 0) throw new Error("ASSERT FAIL a.2: h1 not found");
      const T = (await L.first().textContent() || '').trim();
      if (!T.includes("Identity a")) throw new Error("ASSERT FAIL a.2: expected \"Identity a\", got \"" + T + '"');
      return T; }, 5000, "");
    const R = await resolve(L.first());
  if (nativePrompt) throw new Error(nativePrompt); E.push({ test: "a", step: "a.2", action: "assert", target: "h1", resolved: R, url: page.url(), screenshot: '', ...lastCapture, observed: "Found text: " + T, verdict: "", note: "", assertionPassed: true }); }
  // a.3 Capture the visible heading
  //     Read h1.
  CURRENT = "a.3"; lastCapture = {}; captureFailed = false; assertionPassed = false;
  if (nativePrompt) throw new Error(nativePrompt);
  await page.evaluate(() => (function(){
    var origins=["http://127.0.0.1:40211"];
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
    if(inspect(document))throw new Error("SAFETY STOP a.3: credential prompt or uninspectable frame; human handling required");
    if(location.href!=='about:blank'&&!origins.includes(location.origin))throw new Error("SAFETY STOP a.3: current origin is not approved");
    
    if(!true)throw new Error("SAFETY STOP a.3: confirmation step is not explicitly approved");
    return 'safe';
  })());
  { const L = page.locator("h1");
    const V = (await L.textContent() || '').trim();
    CAP["identity"] = V;
  lastCapture = await capture("shots/step-a-003-explicit-identity--capture-001.png", 1);
  if (nativePrompt) throw new Error(nativePrompt); E.push({ test: "a", step: "a.3", action: "read", target: "h1", resolved: String(V), url: page.url(), screenshot: '', ...lastCapture, observed: "Read: " + String(V), verdict: "", note: "", assertionPassed: false }); }

    return { records: E };
  } catch (error) {
    const message = nativePrompt || String(error?.message || error);
    return { records: E, failure: { step: CURRENT, message, blocked: message.includes('SAFETY STOP'), captureFailed, assertionPassed } };
  }
  finally { page.off('dialog', onDialog); }
}