// video-test-sequence.js
// Test sequence - Observe red then blue page transition
// PASS: Blue final scene
// FAIL: No transition
// Generated from plan.ts. Edit the plan, not this file.
// Run: playwright-cli run-code --filename=<abs path to this file>
async (page) => {
  const BASE = "http://127.0.0.1:43123";
  const SHOTS = "/tmp/collect-evidence-OaPxhw/report/shots";
  const E = [];
  const CAP = {};
  let CURRENT = "sequence.1";
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
      E.push({test:"sequence",step:CURRENT,action:'capture',target:'pre-assertion',resolved:'',url:page.url(),...lastCapture,observed:'Captured before expect.',verdict:'',note:''});
    }
    const value = await until(check, ms);
    assertionPassed = true;
    if (shot) lastCapture = await capture(shot.replace('--capture-001.', '--capture-002.'), 2);
    return value;
  };

  try {
  // sequence.1 Open red scene
  //     Open http://127.0.0.1:43123/.
  CURRENT = "sequence.1"; lastCapture = {}; captureFailed = false; assertionPassed = false;
  if (nativePrompt) throw new Error(nativePrompt);
  await page.evaluate(() => (function(){
    var origins=["http://127.0.0.1:43123"];
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
    if(inspect(document))throw new Error("SAFETY STOP sequence.1: credential prompt or uninspectable frame; human handling required");
    if(location.href!=='about:blank'&&!origins.includes(location.origin))throw new Error("SAFETY STOP sequence.1: current origin is not approved");
    if(!origins.includes(new URL("/","http://127.0.0.1:43123").origin))throw new Error("SAFETY STOP sequence.1: navigation origin is not approved");
    if(!true)throw new Error("SAFETY STOP sequence.1: confirmation step is not explicitly approved");
    return 'safe';
  })());
  await page.goto("http://127.0.0.1:43123/");
  await page.evaluate(() => (function(){
    var origins=["http://127.0.0.1:43123"];
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
    if(inspect(document))throw new Error("SAFETY STOP sequence.1: credential prompt or uninspectable frame; human handling required");
    if(location.href!=='about:blank'&&!origins.includes(location.origin))throw new Error("SAFETY STOP sequence.1: current origin is not approved");
    
    if(!true)throw new Error("SAFETY STOP sequence.1: confirmation step is not explicitly approved");
    return 'safe';
  })());
  lastCapture = await capture("shots/step-sequence-001-red--capture-001.png", 1);
  if (nativePrompt) throw new Error(nativePrompt); E.push({ test: "sequence", step: "sequence.1", action: "navigate", target: "/", resolved: "", url: page.url(), screenshot: '', ...lastCapture, observed: "Page loaded.", verdict: "", note: "", assertionPassed: false });
  // sequence.2 Wait for blue scene
  //     Wait for #done to render.
  CURRENT = "sequence.2"; lastCapture = {}; captureFailed = false; assertionPassed = false;
  if (nativePrompt) throw new Error(nativePrompt);
  await page.evaluate(() => (function(){
    var origins=["http://127.0.0.1:43123"];
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
    if(inspect(document))throw new Error("SAFETY STOP sequence.2: credential prompt or uninspectable frame; human handling required");
    if(location.href!=='about:blank'&&!origins.includes(location.origin))throw new Error("SAFETY STOP sequence.2: current origin is not approved");
    
    if(!true)throw new Error("SAFETY STOP sequence.2: confirmation step is not explicitly approved");
    return 'safe';
  })());
  { const L = page.locator("#done");
    await L.first().waitFor({ state: 'attached', timeout: 30000 });
    const R = await resolve(L.first());
  if (nativePrompt) throw new Error(nativePrompt); E.push({ test: "sequence", step: "sequence.2", action: "wait", target: "#done", resolved: R, url: page.url(), screenshot: '', ...lastCapture, observed: "Rendered.", verdict: "", note: "", assertionPassed: false }); }
  // sequence.3 Read blue scene
  //     Confirm h1 contains "BLUE: final scene".
  CURRENT = "sequence.3"; lastCapture = {}; captureFailed = false; assertionPassed = false;
  if (nativePrompt) throw new Error(nativePrompt);
  await page.evaluate(() => (function(){
    var origins=["http://127.0.0.1:43123"];
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
    if(inspect(document))throw new Error("SAFETY STOP sequence.3: credential prompt or uninspectable frame; human handling required");
    if(location.href!=='about:blank'&&!origins.includes(location.origin))throw new Error("SAFETY STOP sequence.3: current origin is not approved");
    
    if(!true)throw new Error("SAFETY STOP sequence.3: confirmation step is not explicitly approved");
    return 'safe';
  })());
  { const L = page.locator("h1");
    const T = await settle(async () => {
      if (await L.count() === 0) throw new Error("ASSERT FAIL sequence.3: h1 not found");
      const T = (await L.first().textContent() || '').trim();
      if (!T.includes("BLUE: final scene")) throw new Error("ASSERT FAIL sequence.3: expected \"BLUE: final scene\", got \"" + T + '"');
      return T; }, 5000, "shots/step-sequence-003-blue--capture-001.png");
    const R = await resolve(L.first());
  if (nativePrompt) throw new Error(nativePrompt); E.push({ test: "sequence", step: "sequence.3", action: "assert", target: "h1", resolved: R, url: page.url(), screenshot: '', ...lastCapture, observed: "Found text: " + T, verdict: "", note: "", assertionPassed: true }); }

    return { records: E };
  } catch (error) {
    const message = nativePrompt || String(error?.message || error);
    return { records: E, failure: { step: CURRENT, message, blocked: message.includes('SAFETY STOP'), captureFailed, assertionPassed } };
  }
  finally { page.off('dialog', onDialog); }
}