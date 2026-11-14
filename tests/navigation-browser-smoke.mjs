import {spawn} from "node:child_process";
import assert from "node:assert/strict";
import {mkdtemp, mkdir, rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import path from "node:path";

const browserPath = process.argv[2];
if (!browserPath) throw new Error("Pass the Chrome or Edge executable path.");
const origin = "http://127.0.0.1:4173/";
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function run({port, standalone=false}) {
  const profile = await mkdtemp(path.join(tmpdir(), "sanjay-navigation-"));
  const downloadPath = path.join(profile, "downloads");
  await mkdir(downloadPath);
  const args = [`--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, "--headless=new", "--no-first-run", "--no-default-browser-check", "--disable-background-networking"];
  args.push(standalone ? `--app=${origin}` : origin);
  const browser = spawn(browserPath, args, {stdio:"ignore", windowsHide:true});
  let socket;
  let serial = 0;
  const pending = new Map();
  const downloads = [];
  const runtimeErrors = [];
  const send = (method, params={}) => new Promise((resolve, reject) => {
    const id = ++serial;
    pending.set(id, {resolve, reject});
    socket.send(JSON.stringify({id, method, params}));
  });
  const evaluate = async expression => {
    const message = await send("Runtime.evaluate", {expression, awaitPromise:true, returnByValue:true});
    if (message.result.exceptionDetails) throw new Error(message.result.exceptionDetails.exception?.description || message.result.exceptionDetails.text);
    return message.result.result.value;
  };
  const waitFor = async (expression, timeout=30000) => {
    const end = Date.now() + timeout;
    while (Date.now() < end) {
      if (await evaluate(expression).catch(() => false)) return;
      await sleep(100);
    }
    throw new Error(`Timed out: ${expression}`);
  };
  try {
    let target;
    for (let attempt=0; attempt<100 && !target; attempt++) {
      try {
        const targets = await fetch(`http://127.0.0.1:${port}/json`).then(response => response.json());
        target = targets.find(item => item.type === "page" && item.url.startsWith(origin));
      } catch {}
      if (!target) await sleep(100);
    }
    if (!target) throw new Error("Browser target unavailable");
    socket = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => { socket.onopen=resolve; socket.onerror=reject; });
    socket.onmessage = event => {
      const message = JSON.parse(event.data);
      if (message.method === "Browser.downloadWillBegin") downloads.push(message.params);
      if (message.method === "Runtime.exceptionThrown") runtimeErrors.push(message.params.exceptionDetails?.text || "runtime exception");
      if (!message.id || !pending.has(message.id)) return;
      const task = pending.get(message.id); pending.delete(message.id);
      message.error ? task.reject(new Error(message.error.message)) : task.resolve(message);
    };
    await send("Runtime.enable");
    await send("Page.enable");
    await send("Browser.setDownloadBehavior", {behavior:"allow", downloadPath, eventsEnabled:true});
    await waitFor("document.readyState === 'complete' && document.querySelectorAll('.class-dashboard-card').length === 4");
    await waitFor("!('serviceWorker' in navigator) || Boolean(navigator.serviceWorker.controller)", 30000);
    await sleep(600);
    await waitFor("document.readyState === 'complete' && document.querySelectorAll('.class-dashboard-card').length === 4");

    const installability = (await send("Page.getInstallabilityErrors")).result.installabilityErrors;
    const manifestErrors = (await send("Page.getAppManifest")).result.errors;
    const layouts = [];
    for (const viewport of [{name:"desktop",width:1440,height:900,mobile:false},{name:"portrait",width:412,height:915,mobile:true},{name:"landscape",width:915,height:412,mobile:true}]) {
      await send("Emulation.setDeviceMetricsOverride", {width:viewport.width,height:viewport.height,deviceScaleFactor:viewport.mobile?2:1,mobile:viewport.mobile});
      await send("Page.navigate", {url:origin});
      await waitFor("document.readyState === 'complete' && document.querySelectorAll('.class-dashboard-card').length === 4");
      for (const className of ["Class 9th","Class 10th","Class 11th","Class 12th"]) {
        await evaluate(`(()=>{const branch=document.querySelector('[data-nav-branch=${JSON.stringify(className)}]');if(!branch.classList.contains('expanded'))branch.querySelector(':scope > .class-tab').click();return true;})()`);
        await waitFor(`document.querySelector('[data-nav-branch=${JSON.stringify(className)}]').classList.contains('expanded')`);
        const state = await evaluate(`({navHidden:getComputedStyle(document.querySelector('.class-nav')).display==='none',legs:document.querySelectorAll('[data-nav-branch=${JSON.stringify(className)}] [data-nav-target]').length,dashboardOpen:document.body.classList.contains('learning-dashboard-open'),scrollX:document.documentElement.scrollWidth<=document.documentElement.clientWidth,metrics:{innerWidth,clientWidth:document.documentElement.clientWidth,scrollWidth:document.documentElement.scrollWidth,visualWidth:visualViewport?.width},overflow:[...document.querySelectorAll('body *')].filter(element=>element.getBoundingClientRect().right>document.documentElement.clientWidth+1&&!element.closest('.video-grid')).slice(0,6).map(element=>({tag:element.tagName,id:element.id,className:element.className,right:Math.round(element.getBoundingClientRect().right),parent:element.parentElement?.id||element.parentElement?.className||element.parentElement?.tagName,text:element.textContent?.trim().slice(0,40)}))})`);
        layouts.push({viewport:viewport.name,className,...state});
      }
    }

    await send("Emulation.setDeviceMetricsOverride", {width:412,height:915,deviceScaleFactor:2,mobile:true});
    await evaluate("document.querySelector('[data-class=\"Class 9th\"]').click();true");
    await waitFor("document.querySelector('[data-nav-branch=\"Class 9th\"]').classList.contains('expanded')");
    const sections = [];
    for (const targetName of ["videos","pdfs","question-bank","quiz"]) {
      await evaluate(`document.querySelector('[data-nav-class="Class 9th"][data-nav-target=${JSON.stringify(targetName)}]').click();true`);
      await waitFor(`document.body.classList.contains('learning-section-open') && document.querySelector('#${targetName}').classList.contains('active-learning-section')`);
      sections.push(await evaluate(`({target:${JSON.stringify(targetName)},visibleSections:[...document.querySelectorAll('.learning-section')].filter(section=>getComputedStyle(section).display!=='none').map(section=>section.id),navHidden:getComputedStyle(document.querySelector('.class-nav')).display==='none',nestedScroll:getComputedStyle(document.querySelector('#${targetName} .learning-scroll')||document.querySelector('#${targetName}')).overflowY})`));
      await evaluate("document.querySelector('#learningViewBack').click();true");
      await waitFor("!document.body.classList.contains('learning-section-open')");
    }

    await evaluate("document.querySelector('[data-nav-class=\"Class 9th\"][data-nav-target=\"pdfs\"]').click();true");
    await waitFor("document.querySelector('#pdfs').classList.contains('active-learning-section')");
    await evaluate("document.querySelector('[data-open-pdf^=\"imported-9-\"]').click();true");
    await waitFor("document.querySelector('#pdfModal').classList.contains('open') && document.querySelector('.pdf-page-canvas[data-rendered=\"true\"]')", 60000);
    const pdf = await evaluate("(()=>{const stage=document.querySelector('#bookStage');const contextEvent=new MouseEvent('contextmenu',{bubbles:true,cancelable:true});stage.dispatchEvent(contextEvent);return {page:Number(document.querySelector('#pageNumber').value),renderedPages:document.querySelectorAll('.pdf-page-canvas[data-rendered=\"true\"]').length,pageFrames:document.querySelectorAll('.pdf-page-frame').length,scrollable:stage.scrollHeight>stage.clientHeight,downloadControls:document.querySelectorAll('#readerDownload,[download]').length,externalOpenControls:document.querySelectorAll('#readerFallbackOpen').length,contextBlocked:contextEvent.defaultPrevented,shieldVisible:!document.querySelector('#pdfProtectionShield').classList.contains('hidden')};})()");
    await evaluate("document.querySelector('#readerDownload').click();true");
    await sleep(300);
    await evaluate("history.back();true");
    await waitFor("!document.querySelector('#pdfModal').classList.contains('open')");

    await evaluate("document.querySelector('#adminLoginBtn').click();true");
    await evaluate("document.querySelector('#adminPin').value='runtime-test-pin';document.querySelector('#loginForm').requestSubmit();true");
    await waitFor("document.body.classList.contains('admin-mode') && Boolean(sessionStorage.getItem('ssp_admin_token'))");
    const authenticated = await evaluate("({adminLogoutControls:document.querySelectorAll('#headerLogoutBtn,#logoutBtn,#logoutConfirmModal').length,dashboardVisible:!document.querySelector('#adminDashboard').classList.contains('hidden')})");
    await send("Network.enable");
    await send("Network.emulateNetworkConditions", {offline:true,latency:0,downloadThroughput:0,uploadThroughput:0});
    await evaluate("document.querySelector('#exitAppBtn').click();true");
    await waitFor("document.body.classList.contains('app-exited') && !document.querySelector('#exitScreen').classList.contains('hidden')");
    const loggedOutOffline = await evaluate("({token:sessionStorage.getItem('ssp_admin_token'),legacy:sessionStorage.getItem('ssp_admin_session'),exitMarker:sessionStorage.getItem('ssp_app_exited'),interfaceHidden:getComputedStyle(document.querySelector('.app-header')).display==='none',exitVisible:getComputedStyle(document.querySelector('#exitScreen')).display!=='none',dashboardHidden:document.querySelector('#adminDashboard').getClientRects().length===0,pdfCount:data.pdfs.length,assistants:Boolean(document.querySelector('#aiAssistant')&&document.querySelector('#spaPanel'))})");
    await evaluate("history.back();true");
    await sleep(300);
    const backProtected = await evaluate("document.body.classList.contains('app-exited') && !sessionStorage.getItem('ssp_admin_token')");
    await send("Network.emulateNetworkConditions", {offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1});
    const unauthenticatedStatus = await evaluate("fetch('/api/admin-session').then(response=>response.status)");
    const loggedOut = {...loggedOutOffline, unauthenticatedStatus};
    const terminalExit = await evaluate("!document.querySelector('#returnToLoginBtn') && document.querySelector('#exitScreenTitle').textContent==='App Closed' && document.querySelector('#exitScreen p').textContent.includes('safely close this window')");

    return {standalone:await evaluate("matchMedia('(display-mode: standalone)').matches"),installability,manifestErrors,layouts,sections,pdf:{...pdf,downloadStarted:downloads.length>0},authenticated,loggedOut,backProtected,terminalExit,runtimeErrors};
  } finally {
    try { socket?.close(); } catch {}
    browser.kill();
    await sleep(400);
    await rm(profile, {recursive:true,force:true});
  }
}

function assertResult(result, expectedStandalone) {
  assert.deepEqual(result.installability, []);
  assert.deepEqual(result.manifestErrors, []);
  assert.equal(result.standalone, expectedStandalone);
  for (const layout of result.layouts) {
    assert.equal(layout.navHidden, false, `${layout.className} ${layout.viewport}: class selector was hidden`);
    assert.equal(layout.legs, 4, `${layout.className} ${layout.viewport}: dynamic submenu is incomplete`);
    assert.equal(layout.dashboardOpen, false, `${layout.className} ${layout.viewport}: class click opened the old dashboard`);
    assert.equal(layout.scrollX, true, `${layout.className} ${layout.viewport}: horizontal overflow detected`);
    assert.deepEqual(layout.overflow, [], `${layout.className} ${layout.viewport}: overflowing elements detected`);
  }
  for (const section of result.sections) {
    assert.deepEqual(section.visibleSections, [section.target], `${section.target}: more than one learning section is visible`);
    assert.equal(section.navHidden, false, `${section.target}: class selector was hidden`);
    assert.equal(section.nestedScroll, "visible", `${section.target}: nested scrolling remains enabled`);
  }
  assert.equal(result.pdf.page, 1);
  assert.ok(result.pdf.renderedPages >= 1);
  assert.ok(result.pdf.pageFrames >= 1);
  assert.equal(result.pdf.scrollable, true);
  assert.equal(result.pdf.downloadControls, 1);
  assert.equal(result.pdf.externalOpenControls, 0);
  assert.equal(result.pdf.contextBlocked, true);
  assert.equal(result.pdf.shieldVisible, true);
  assert.equal(result.pdf.downloadStarted, true);
  assert.equal(result.authenticated.adminLogoutControls, 0);
  assert.equal(result.authenticated.dashboardVisible, true);
  assert.equal(result.loggedOut.token, null);
  assert.equal(result.loggedOut.legacy, null);
  assert.equal(result.loggedOut.exitMarker, "true");
  assert.equal(result.loggedOut.interfaceHidden, true);
  assert.equal(result.loggedOut.exitVisible, true);
  assert.equal(result.loggedOut.dashboardHidden, true);
  assert.equal(result.loggedOut.assistants, true);
  assert.equal(result.loggedOut.unauthenticatedStatus, 401);
  assert.equal(result.backProtected, true);
  assert.equal(result.terminalExit, true);
  assert.deepEqual(result.runtimeErrors, []);
}

const browserResult = await run({port:9252});
const standaloneResult = await run({port:9253,standalone:true});
assertResult(browserResult, false);
assertResult(standaloneResult, true);
console.log(JSON.stringify({browser:browserResult,standalone:standaloneResult}, null, 2));
