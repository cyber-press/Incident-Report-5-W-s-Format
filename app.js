/* Inter-Con Incident Report Mobile Form
   Header buttons logic rebuilt for reliability.
*/
const DRAFT_KEY = "ic_draft_v4";
const EMAIL_TO = "press.amadu@gmail.com";
const FORM_IDS = [
  "site_name",
  "date",
  "time",
  "officer_name",
  "post_shift",
  "supervisor_contacted_name",
  "time_contacted",
  "who_persons_involved",
  "what_happened",
  "where_location",
  "t_incident",
  "t_supervisor",
  "t_called",
  "t_arrived",
  "why_cause",
  "actions_taken",
  "officer_signature",
  "officer_sig_date",
  "supervisor_signature"
];

function $(id) { return document.getElementById(id); }

function showToast(msg) {
  const el = $("toast");
  if (!el) return;
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(window.__toastT);
  window.__toastT = setTimeout(() => el.classList.remove("show"), 1800);
}
function toast(msg) { return showToast(msg); }

function oneLine(s) {
  return String(s || "").replace(/\s+/g, " ").trim();
}
function nowHHMM(){
  const d = new Date();
  const hh = String(d.getHours()).padStart(2,'0');
  const mm = String(d.getMinutes()).padStart(2,'0');
  return `${hh}:${mm}`;
}
function todayYYYYMMDD(){
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,'0');
  const day = String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
}

function collectData(){
  const data = {};
  for (const id of FORM_IDS) {
    const el = $(id);
    if (!el) continue;
    data[id] = (el.value ?? "").toString();
  }
  return data;
}

function saveDraft(){
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(collectData()));
    toast("Draft saved ✅");
  } catch(e) {
    toast("Draft save failed ❌");
  }
}

function loadDraft(){
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return;
    const draft = JSON.parse(raw);
    for (const id of FORM_IDS) {
      if (!$(id)) continue;
      if (draft[id] !== undefined && draft[id] !== null && String(draft[id]).length) {
        $(id).value = draft[id];
      }
    }
  } catch(e) {
    // ignore
  }
}

function buildQuickSummary(d){
  const lines = [];
  lines.push("QUICK SUMMARY");
  lines.push("------------------------------");
  if (oneLine(d.site_name)) lines.push(`Site: ${oneLine(d.site_name)}`);
  if (oneLine(d.date)) lines.push(`Date: ${oneLine(d.date)}`);
  if (oneLine(d.time)) lines.push(`Time: ${oneLine(d.time)}`);
  if (oneLine(d.officer_name)) lines.push(`Officer: ${oneLine(d.officer_name)}`);
  if (oneLine(d.post_shift)) lines.push(`Post/Shift: ${oneLine(d.post_shift)}`);
  if (oneLine(d.where_location)) lines.push(`Location: ${oneLine(d.where_location)}`);
  if (oneLine(d.who_persons_involved)) lines.push(`Who: ${oneLine(d.who_persons_involved)}`);
  if (oneLine(d.what_happened)) lines.push(`What: ${oneLine(d.what_happened)}`);
  if (oneLine(d.why_cause)) lines.push(`Why: ${oneLine(d.why_cause)}`);
  return lines.join("\n");
}

function buildEmailSubject(d){
  const site = oneLine(d.site_name) || "Site";
  const date = oneLine(d.date) || "Date";
  const time = oneLine(d.time) || "Time";
  return `Incident Report | ${site} | ${date} | ${time}`;
}

function buildFullReportText(d){
  const lines = [];
  lines.push(buildEmailSubject(d));
  lines.push("");
  lines.push(`Site: ${oneLine(d.site_name)}`);
  lines.push(`Date: ${oneLine(d.date)}`);
  lines.push(`Time: ${oneLine(d.time)}`);
  lines.push(`Officer: ${oneLine(d.officer_name)}`);
  lines.push(`Post/Shift: ${oneLine(d.post_shift)}`);
  lines.push("");
  lines.push(`Supervisor Contacted: ${oneLine(d.supervisor_contacted_name)}  Time: ${oneLine(d.time_contacted)}`);
  lines.push("");
  lines.push("WHO (Persons Involved):");
  lines.push(d.who_persons_involved || "");
  lines.push("");
  lines.push("WHAT (Incident Details):");
  lines.push(d.what_happened || "");
  lines.push("");
  lines.push("WHERE (Location):");
  lines.push(d.where_location || "");
  lines.push("");
  lines.push("WHEN (Timeline):");
  lines.push(`Incident Occurred: ${oneLine(d.t_incident)}`);
  lines.push(`Supervisor Contacted: ${oneLine(d.t_supervisor)}`);
  lines.push(`EMS/Police Called: ${oneLine(d.t_called)}`);
  lines.push(`EMS/Police Arrived: ${oneLine(d.t_arrived)}`);
  lines.push("");
  lines.push("WHY:");
  lines.push(d.why_cause || "");
  lines.push("");
  lines.push("ACTIONS TAKEN:");
  lines.push(d.actions_taken || "");
  lines.push("");
  lines.push(`Officer Signature: ${oneLine(d.officer_signature)}  Date Filed: ${oneLine(d.officer_sig_date)}`);
  lines.push(`Supervisor Signature: ${oneLine(d.supervisor_signature)}`);
  return lines.join("\n").trim();
}

function buildCombinedCopyText(){
  const d = collectData();
  const quick = buildQuickSummary(d);
  const full = buildFullReportText(d);
  return quick ? `${quick}\n\n${full}` : full;
}

async function copyToClipboard(text){
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch(e) {}
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    return true;
  } catch(e) {
    return false;
  }
}

function fileSafeName(s){
  return String(s || "report").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g,"");
}

async function exportJpg(){
  if (!window.html2canvas) {
    toast("Export error: html2canvas not loaded ❌");
    return;
  }
  toast("Creating JPG… 📷");
  const node = $("captureRoot") || document.body;
  const canvas = await html2canvas(node, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#F4F6F8",
    scrollY: -window.scrollY
  });
  const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
  const a = document.createElement("a");
  const d = collectData();
  const name = `ic_${fileSafeName(d.site_name)}_${(d.date||todayYYYYMMDD())}_${nowHHMM().replace(":","")}.jpg`;
  a.href = dataUrl;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  toast("JPG saved ✅");
}

async function exportPdf(){
  if (!window.html2canvas) {
    toast("Export error: html2canvas not loaded ❌");
    return;
  }
  if (!window.jspdf || !window.jspdf.jsPDF) {
    toast("Export error: jsPDF not loaded ❌");
    return;
  }

  toast("Creating PDF… 📄");
  const node = $("captureRoot") || document.body;
  const canvas = await html2canvas(node, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#F4F6F8",
    scrollY: -window.scrollY
  });

  const imgData = canvas.toDataURL("image/png");
  const pdf = new window.jspdf.jsPDF("p", "mm", "a4");
  const pW = pdf.internal.pageSize.getWidth();
  const pH = pdf.internal.pageSize.getHeight();
  const iH = (canvas.height * pW) / canvas.width;

  let hLeft = iH;
  let pos = 0;
  pdf.addImage(imgData, "PNG", 0, pos, pW, iH);
  hLeft -= pH;

  while (hLeft > 0) {
    pos = hLeft - iH;
    pdf.addPage();
    pdf.addImage(imgData, "PNG", 0, pos, pW, iH);
    hLeft -= pH;
  }

  const d = collectData();
  const name = `ic_${fileSafeName(d.site_name)}_${(d.date||todayYYYYMMDD())}_${nowHHMM().replace(":","")}.pdf`;
  pdf.save(name);
  toast("PDF saved ✅");
}

function openEmail(){
  const d = collectData();
  const subject = buildEmailSubject(d);
  const body = encodeURIComponent(buildCombinedCopyText());
  const href = `mailto:${EMAIL_TO}?subject=${encodeURIComponent(subject)}&body=${body}`;
  window.location.href = href;
}

function buildDARNote(d) {
  const lines = [];
  lines.push("DAR ENTRY (COPY/PASTE)");
  lines.push("================================");
  if (oneLine(d.date) || oneLine(d.time)) lines.push(`Date/Time: ${oneLine(d.date)||"—"}${oneLine(d.time) ? " • " + oneLine(d.time) : ""}`.trim());
  if (oneLine(d.site_name)) lines.push(`Site: ${oneLine(d.site_name)}`);
  if (oneLine(d.officer_name)) lines.push(`Officer: ${oneLine(d.officer_name)}`);
  if (oneLine(d.post_shift)) lines.push(`Post/Shift: ${oneLine(d.post_shift)}`);
  if (oneLine(d.supervisor_contacted_name) || oneLine(d.time_contacted)) lines.push(`Supervisor Contacted: ${oneLine(d.supervisor_contacted_name)||"—"}${oneLine(d.time_contacted) ? " • " + oneLine(d.time_contacted) : ""}`);
  lines.push("");
  lines.push("WHEN (TIMELINE)");
  lines.push("--------------------------------");
  lines.push(`Incident Occurred: ${oneLine(d.t_incident)||"—"}`);
  lines.push(`Supervisor Contacted: ${oneLine(d.t_supervisor)||"—"}`);
  lines.push(`EMS/Police Called: ${oneLine(d.t_called)||"—"}`);
  lines.push(`EMS/Police Arrived: ${oneLine(d.t_arrived)||"—"}`);
  lines.push("");
  lines.push("QUICK SUMMARY");
  lines.push("--------------------------------");
  if (oneLine(d.where_location)) lines.push(`Location: ${oneLine(d.where_location)}`);
  if (oneLine(d.who_persons_involved)) lines.push(`Who: ${oneLine(d.who_persons_involved)}`);
  if (oneLine(d.what_happened)) lines.push(`What: ${oneLine(d.what_happened)}`);
  if (oneLine(d.why_cause)) lines.push(`Why: ${oneLine(d.why_cause)}`);
  lines.push("");
  lines.push("ACTIONS TAKEN");
  lines.push("--------------------------------");
  lines.push(d.actions_taken ? d.actions_taken : "—");
  return lines.join("\n");
}

function openNotesMode(){
  const modal = $("notesModal");
  const ta = $("notesText");
  if (!modal || !ta) return;
  ta.value = buildDARNote(collectData());
  modal.hidden = false;
  document.body.style.overflow = "hidden";
  setTimeout(() => $("btnNotesClose")?.focus(), 0);
}
function closeNotesMode(){
  const modal = $("notesModal");
  if (!modal) return;
  modal.hidden = true;
  document.body.style.overflow = "";
}

function bindHeaderButtons(){
  $("btnSaveDraft")?.addEventListener("click", saveDraft);

  $("btnCopy")?.addEventListener("click", async () => {
    const ok = await copyToClipboard(buildCombinedCopyText());
    toast(ok ? "Copied ✅" : "Copy failed ❌");
  });

  $("btnEmail")?.addEventListener("click", openEmail);

  $("btnPdf")?.addEventListener("click", () => {
    exportPdf().catch(() => toast("PDF export failed ❌"));
  });

  $("btnJpg")?.addEventListener("click", () => {
    exportJpg().catch(() => toast("JPG export failed ❌"));
  });

  $("btnNotesMode")?.addEventListener("click", openNotesMode);

  $("btnNotesClose")?.addEventListener("click", closeNotesMode);
  document.querySelectorAll("[data-close='1']").forEach(el => el.addEventListener("click", closeNotesMode));
  document.addEventListener("keydown", (e) => {
    const modal = $("notesModal");
    if (e.key === "Escape" && modal && !modal.hidden) closeNotesMode();
  });

  $("btnNotesCopy")?.addEventListener("click", async () => {
    const text = $("notesText")?.value || "";
    const ok = await copyToClipboard(text);
    toast(ok ? "Copied DAR ✅" : "Copy failed ❌");
  });

  $("btnNotesShare")?.addEventListener("click", async () => {
    const text = $("notesText")?.value || "";
    try {
      if (navigator.share) {
        await navigator.share({ title: "DAR Entry", text });
        toast("Shared ✅");
      } else {
        toast("Share not supported ❌");
      }
    } catch (e) {
      // cancelled
    }
  });
}

function autoFillDate(){
  const el = $("date");
  if (el && !el.value) el.value = todayYYYYMMDD();
}

document.addEventListener("DOMContentLoaded", () => {
  loadDraft();
  autoFillDate();
  bindHeaderButtons();
});
