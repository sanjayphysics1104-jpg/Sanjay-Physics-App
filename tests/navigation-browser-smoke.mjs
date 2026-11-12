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

    const installability = (await send("Page.getInstallabilityErrors")).result.installabilityErrors;
    const manifestErrors = (await send("Page.getAppManifest")).result.errors;
    const layouts = [];
    for (const viewport of [{name:"desktop",width:1440,height:900,mobile:false},{name:"portrait",width:412,height:915,mobile:true},{name:"landscape",width:915,height:412,mobile:true}]) {
      await send("Emulation.setDeviceMetricsOverride", {width:viewport.width,height:viewport.height,deviceScaleFactor:viewport.mobile?2:1,mobile:viewport.mobile});
      await send("Page.navigate", {url:origin});
      await waitFor("document.readyState === 'complete' && document.querySelectorAll('.class-dashboard-card').length === 4");
      for (const className of ["Class 9th","Class 10th","Class 11th","Class 12th"]) {
        await evaluate(`document.querySelector('[data-class=${JSON.stringify(className)}]').click();true`);
        await waitFor("document.body.classList.contains('learning-dashboard-open')");
        const state = await evaluate("({title:document.querySelector('#classDashboardTitle').textContent,navHidden:getComputedStyle(document.querySelector('.class-nav')).display==='none',cards:document.querySelectorAll('.class-dashboard-card').length,scrollX:document.documentElement.scrollWidth<=document.documentElement.clientWidth,metrics:{innerWidth,clientWidth:document.documentElement.clientWidth,scrollWidth:document.documentElement.scrollWidth,visualWidth:visualViewport?.width},overflow:[...document.querySelectorAll('body *')].filter(element=>element.getBoundingClientRect().right>document.documentElement.clientWidth+1).slice(0,6).map(element=>({tag:element.tagName,id:element.id,className:element.className,right:Math.round(element.getBoundingClientRect().right),parent:element.parentElement?.id||element.parentElement?.className||element.parentElement?.tagName,text:element.textContent?.trim().slice(0,40)}))})");
        layouts.push({viewport:viewport.name,className,...state});
        await evaluate("document.querySelector('#learningViewBack').click();true");
        await waitFor("!document.body.classList.contains('learning-dashboard-open')");
      }
    }

    await send("Emulation.setDeviceMetricsOverride", {width:412,height:915,deviceScaleFactor:2,mobile:true});
    await evaluate("document.querySelector('[data-class=\"Class 12th\"]').click();true");
    await waitFor("document.body.classList.contains('learning-dashboard-open')");
    const sections = [];
    for (const targetName of ["videos","pdfs","question-bank","quiz"]) {
      await evaluate(`document.querySelector('[data-learning-target=${JSON.stringify(targetName)}]').click();true`);
      await waitFor(`document.body.classList.contains('learning-section-open') && document.querySelector('#${targetName}').classList.contains('active-learning-section')`);
      sections.push(await evaluate(`({target:${JSON.stringify(targetName)},visibleSections:[...document.querySelectorAll('.learning-section')].filter(section=>getComputedStyle(section).display!=='none').map(section=>section.id),navHidden:getComputedStyle(document.querySelector('.class-nav')).display==='none',nestedScroll:getComputedStyle(document.querySelector('#${targetName} .learning-scroll')||document.querySelector('#${targetName}')).overflowY})`));
      await evaluate("history.back();true");
      await waitFor("document.body.classList.contains('learning-dashboard-open')");
    }

    await evaluate("document.querySelector('[data-learning-target=\"pdfs\"]').click();true");
    await waitFor("document.querySelector('#pdfs').classList.contains('active-learning-section')");
    await evaluate("document.querySelector('[data-open-pdf]').click();true");
    await waitFor("document.querySelector('#pdfModal').classList.contains('open') && document.querySelector('#pdfCanvas').style.display === 'block'", 60000);
    const pdf = await evaluate("(async()=>({page:Number(document.querySelector('#pageNumber').value),downloadVisible:!document.querySelector('#readerDownload').classList.contains('hidden'),downloadStatus:(await fetch(currentPdfUrl)).status}))()");
    await evaluate("document.querySelector('#readerDownload').click();true");
    await waitFor("true", 500);
    await evaluate("history.back();true");
    await waitFor("!document.querySelector('#pdfModal').classList.contains('open')");

    await evaluate("document.querySelector('#adminLoginBtn').click();true");
    await evaluate("document.querySelector('#adminPin').value='runtime-test-pin';document.querySelector('#loginForm').requestSubmit();true");
    await waitFor("document.body.classList.contains('admin-mode') && Boolean(sessionStorage.getItem('ssp_admin_token'))");
    const authenticated = await evaluate("({headerLogoutVisible:!document.querySelector('#headerLogoutBtn').classList.contains('hidden'),dashboardVisible:!document.querySelector('#adminDashboard').classList.contains('hidden')})");
    await evaluate("document.querySelector('#headerLogoutBtn').click();true");
    await waitFor("document.querySelector('#logoutConfirmModal').classList.contains('open')");
    await evaluate("document.querySelector('#cancelLogoutBtn').click();true");
    const cancelled = await evaluate("Boolean(sessionStorage.getItem('ssp_admin_token')) && document.body.classList.contains('admin-mode')");
    await evaluate("document.querySelector('#headerLogoutBtn').click();document.querySelector('#confirmLogoutBtn').click();true");
    await waitFor("!document.body.classList.contains('admin-mode') && document.querySelector('#adminModal').classList.contains('open')");
    const loggedOut = await evaluate("(async()=>({token:sessionStorage.getItem('ssp_admin_token'),legacy:sessionStorage.getItem('ssp_admin_session'),loginVisible:!document.querySelector('#loginView').classList.contains('hidden'),dashboardHidden:document.querySelector('#adminDashboard').classList.contains('hidden'),pdfCount:data.pdfs.length,assistants:Boolean(document.querySelector('#aiAssistant')&&document.querySelector('#spaPanel')),unauthenticatedStatus:(await fetch('/api/admin-session')).status}))()");
    await evaluate("document.querySelector('#adminPin').value='runtime-test-pin';document.querySelector('#loginForm').requestSubmit();true");
    await waitFor("document.body.classList.contains('admin-mode') && Boolean(sessionStorage.getItem('ssp_admin_token'))");
    const relogin = await evaluate("!document.querySelector('#adminDashboard').classList.contains('hidden')");

    return {standalone:await evaluate("matchMedia('(display-mode: standalone)').matches"),installability,manifestErrors,layouts,sections,pdf:{...pdf,downloadStarted:downloads.length>0},authenticated,cancelled,loggedOut,relogin,runtimeErrors};
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
    assert.equal(layout.navHidden, true, `${layout.className} ${layout.viewport}: class selector remained visible`);
    assert.equal(layout.cards, 4, `${layout.className} ${layout.viewport}: dashboard cards are incomplete`);
    assert.equal(layout.scrollX, true, `${layout.className} ${layout.viewport}: horizontal overflow detected`);
    assert.deepEqual(layout.overflow, [], `${layout.className} ${layout.viewport}: overflowing elements detected`);
  }
  for (const section of result.sections) {
    assert.deepEqual(section.visibleSections, [section.target], `${section.target}: more than one learning section is visible`);
    assert.equal(section.navHidden, true, `${section.target}: class selector remained visible`);
    assert.equal(section.nestedScroll, "visible", `${section.target}: nested scrolling remains enabled`);
  }
  assert.equal(result.pdf.page, 1);
  assert.equal(result.pdf.downloadVisible, true);
  assert.equal(result.pdf.downloadStatus, 200);
  assert.equal(result.pdf.downloadStarted, true);
  assert.equal(result.authenticated.headerLogoutVisible, true);
  assert.equal(result.authenticated.dashboardVisible, true);
  assert.equal(result.cancelled, true);
  assert.equal(result.loggedOut.token, null);
  assert.equal(result.loggedOut.legacy, null);
  assert.equal(result.loggedOut.loginVisible, true);
  assert.equal(result.loggedOut.dashboardHidden, true);
  assert.equal(result.loggedOut.assistants, true);
  assert.equal(result.loggedOut.unauthenticatedStatus, 401);
  assert.equal(result.relogin, true);
  assert.deepEqual(result.runtimeErrors, []);
}

const browserResult = await run({port:9252});
const standaloneResult = await run({port:9253,standalone:true});
assertResult(browserResult, false);
assertResult(standaloneResult, true);
console.log(JSON.stringify({browser:browserResult,standalone:standaloneResult}, null, 2));
