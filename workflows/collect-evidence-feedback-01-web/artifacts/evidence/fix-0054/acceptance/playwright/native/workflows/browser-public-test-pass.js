// browser-public-test-pass.js
// Test pass - Select the named project
// PASS: Aurora is selected
// FAIL: Aurora is not selected
// Generated from plan.ts. Edit the plan, not this file.
// Run: playwright-cli run-code --filename=<abs path to this file>
async (page) => {
  const BASE = "http://127.0.0.1:39939";
  const SHOTS = "/tmp/ce-playwright-public-ZnTUdZ/collect-evidence-Pd9ENb/report/shots";
  const E = [];
  const CAP = {};
  let CURRENT = "pass.1";
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
      E.push({test:"pass",step:CURRENT,action:'capture',target:'pre-assertion',resolved:'',url:page.url(),...lastCapture,observed:'Captured before expect.',verdict:'',note:''});
    }
    const value = await until(check, ms);
    assertionPassed = true;
    if (shot) lastCapture = await capture(shot.replace('--capture-001.', '--capture-002.'), 2);
    return value;
  };

  try {
  // pass.1 Open the owned page
  //     Open http://127.0.0.1:39939/.
  CURRENT = "pass.1"; lastCapture = {}; captureFailed = false; assertionPassed = false;
  if (nativePrompt) throw new Error(nativePrompt);
  await page.evaluate(() => (function(){
    var origins=["http://127.0.0.1:39939"];
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
    if(inspect(document))throw new Error("SAFETY STOP pass.1: credential prompt or uninspectable frame; human handling required");
    if(location.href!=='about:blank'&&!origins.includes(location.origin))throw new Error("SAFETY STOP pass.1: current origin is not approved");
    if(!origins.includes(new URL("/","http://127.0.0.1:39939").origin))throw new Error("SAFETY STOP pass.1: navigation origin is not approved");
    if(!true)throw new Error("SAFETY STOP pass.1: confirmation step is not explicitly approved");
    return 'safe';
  })());
  await page.goto("http://127.0.0.1:39939/");
  await page.evaluate(() => (function(){
    var origins=["http://127.0.0.1:39939"];
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
    if(inspect(document))throw new Error("SAFETY STOP pass.1: credential prompt or uninspectable frame; human handling required");
    if(location.href!=='about:blank'&&!origins.includes(location.origin))throw new Error("SAFETY STOP pass.1: current origin is not approved");
    
    if(!true)throw new Error("SAFETY STOP pass.1: confirmation step is not explicitly approved");
    return 'safe';
  })());
  if (nativePrompt) throw new Error(nativePrompt); E.push({ test: "pass", step: "pass.1", action: "navigate", target: "/", resolved: "", url: page.url(), screenshot: '', ...lastCapture, observed: "Page loaded.", verdict: "", note: "", assertionPassed: false });
  // pass.2 Check the heading
  //     Confirm h1 contains "Owned evidence test".
  CURRENT = "pass.2"; lastCapture = {}; captureFailed = false; assertionPassed = false;
  if (nativePrompt) throw new Error(nativePrompt);
  await page.evaluate(() => (function(){
    var origins=["http://127.0.0.1:39939"];
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
    if(inspect(document))throw new Error("SAFETY STOP pass.2: credential prompt or uninspectable frame; human handling required");
    if(location.href!=='about:blank'&&!origins.includes(location.origin))throw new Error("SAFETY STOP pass.2: current origin is not approved");
    
    if(!true)throw new Error("SAFETY STOP pass.2: confirmation step is not explicitly approved");
    return 'safe';
  })());
  { const L = page.locator("h1");
    const T = await settle(async () => {
      if (await L.count() === 0) throw new Error("ASSERT FAIL pass.2: h1 not found");
      const T = (await L.first().textContent() || '').trim();
      if (!T.includes("Owned evidence test")) throw new Error("ASSERT FAIL pass.2: expected \"Owned evidence test\", got \"" + T + '"');
      return T; }, 5000, "shots/step-pass-002-heading--capture-001.png");
    const R = await resolve(L.first());
  if (nativePrompt) throw new Error(nativePrompt); E.push({ test: "pass", step: "pass.2", action: "assert", target: "h1", resolved: R, url: page.url(), screenshot: '', ...lastCapture, observed: "Found text: " + T, verdict: "", note: "", assertionPassed: true }); }
  // pass.3 Select Select project
  //     Click #select.
  CURRENT = "pass.3"; lastCapture = {}; captureFailed = false; assertionPassed = false;
  if (nativePrompt) throw new Error(nativePrompt);
  await page.evaluate(() => (function(){
    var origins=["http://127.0.0.1:39939"];
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
    if(inspect(document))throw new Error("SAFETY STOP pass.3: credential prompt or uninspectable frame; human handling required");
    if(location.href!=='about:blank'&&!origins.includes(location.origin))throw new Error("SAFETY STOP pass.3: current origin is not approved");
    
    if(!true)throw new Error("SAFETY STOP pass.3: confirmation step is not explicitly approved");
    return 'safe';
  })());
  { const L = page.locator("#select");
    const R = await resolve(L);
    await L.click();
    await page.evaluate(() => (function(){
    var origins=["http://127.0.0.1:39939"];
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
    if(inspect(document))throw new Error("SAFETY STOP pass.3: credential prompt or uninspectable frame; human handling required");
    if(location.href!=='about:blank'&&!origins.includes(location.origin))throw new Error("SAFETY STOP pass.3: current origin is not approved");
    
    if(!true)throw new Error("SAFETY STOP pass.3: confirmation step is not explicitly approved");
    return 'safe';
  })());
  if (nativePrompt) throw new Error(nativePrompt); E.push({ test: "pass", step: "pass.3", action: "click", target: "#select", resolved: R, url: page.url(), screenshot: '', ...lastCapture, observed: "Clicked.", verdict: "", note: "", assertionPassed: false }); }
  // pass.4 Check the selected project
  //     Confirm #status contains "Project selected: Aurora".
  CURRENT = "pass.4"; lastCapture = {}; captureFailed = false; assertionPassed = false;
  if (nativePrompt) throw new Error(nativePrompt);
  await page.evaluate(() => (function(){
    var origins=["http://127.0.0.1:39939"];
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
    if(inspect(document))throw new Error("SAFETY STOP pass.4: credential prompt or uninspectable frame; human handling required");
    if(location.href!=='about:blank'&&!origins.includes(location.origin))throw new Error("SAFETY STOP pass.4: current origin is not approved");
    
    if(!true)throw new Error("SAFETY STOP pass.4: confirmation step is not explicitly approved");
    return 'safe';
  })());
  { const L = page.locator("#status");
    const T = await settle(async () => {
      if (await L.count() === 0) throw new Error("ASSERT FAIL pass.4: #status not found");
      const T = (await L.first().textContent() || '').trim();
      if (!T.includes("Project selected: Aurora")) throw new Error("ASSERT FAIL pass.4: expected \"Project selected: Aurora\", got \"" + T + '"');
      return T; }, 5000, "shots/step-pass-004-selected-project--capture-001.png");
    const R = await resolve(L.first());
  if (nativePrompt) throw new Error(nativePrompt); E.push({ test: "pass", step: "pass.4", action: "assert", target: "#status", resolved: R, url: page.url(), screenshot: '', ...lastCapture, observed: "Found text: " + T, verdict: "", note: "", assertionPassed: true }); }

    return { records: E };
  } catch (error) {
    const message = nativePrompt || String(error?.message || error);
    return { records: E, failure: { step: CURRENT, message, blocked: message.includes('SAFETY STOP'), captureFailed, assertionPassed } };
  }
  finally { page.off('dialog', onDialog); }
}