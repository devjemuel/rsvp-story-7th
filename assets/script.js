const CONFIG = {
  SCRIPT_URL: "https://script.google.com/macros/s/AKfycbxGQL3XVnoEqnZbyVwbQZXZXfXoHxhUK_7SMGIEk2hComnSJUL0Z23pKZExByLMCHaiAw/exec",
  EVENT_START: "2026-10-31T16:00:00+08:00",
  EVENT_END:   "2026-10-31T20:00:00+08:00",
  RSVP_DEADLINE: "2026-10-12T23:59:59+08:00",   // form closes after this
  MAX_COMPANIONS: 5
};

/* ========================================================= */
(function () {
  const $ = (id) => document.getElementById(id);
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const DEMO = !/^https:\/\/script\.google\.com\//.test(CONFIG.SCRIPT_URL);
  const STORE_KEY = "story7-rsvp";

  const store = {
    get() { try { return JSON.parse(localStorage.getItem(STORE_KEY) || "null"); } catch (e) { return null; } },
    set(v) { try { localStorage.setItem(STORE_KEY, JSON.stringify(v)); } catch (e) {} }
  };

  /* ---------- Calendar link ---------- */
  const toCal = (iso) => new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const cal = new URL("https://calendar.google.com/calendar/render");
  cal.searchParams.set("action", "TEMPLATE");
  cal.searchParams.set("text", "Story's 7th Birthday Celebration");
  cal.searchParams.set("dates", toCal(CONFIG.EVENT_START) + "/" + toCal(CONFIG.EVENT_END));
  cal.searchParams.set("location", "Subic Bay Peninsular Hotel");
  cal.searchParams.set("details", "Invited guests only. See you there!");
  $("calLink").href = cal.toString();

  /* ---------- Deadline text ---------- */
  const deadline = new Date(CONFIG.RSVP_DEADLINE);
  $("deadlineText").textContent = deadline.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "Asia/Manila" });
  $("maxText").textContent = CONFIG.MAX_COMPANIONS;

  /* ---------- Countdown ---------- */
  const start = new Date(CONFIG.EVENT_START).getTime();
  const pad = (n) => String(n).padStart(2, "0");
  function tick() {
    let diff = start - Date.now();
    if (diff <= 0) {
      $("countdownTitle").textContent = "It's party time! 🎉";
      ["cdD", "cdH", "cdM", "cdS"].forEach((id) => ($(id).textContent = "00"));
      return;
    }
    const d = Math.floor(diff / 864e5); diff -= d * 864e5;
    const h = Math.floor(diff / 36e5); diff -= h * 36e5;
    const m = Math.floor(diff / 6e4); diff -= m * 6e4;
    const s = Math.floor(diff / 1e3);
    $("cdD").textContent = d; $("cdH").textContent = pad(h); $("cdM").textContent = pad(m); $("cdS").textContent = pad(s);
    setTimeout(tick, 1000 - (Date.now() % 1000));
  }
  tick();

  /* ---------- Closed after deadline ---------- */
  if (Date.now() > deadline.getTime()) {
    $("formCard").hidden = true;
    $("closedCard").hidden = false;
    return;
  }

  /* ---------- Form state ---------- */
  const form = $("rsvpForm");
  let count = 0;
  const savedNames = [];

  function attending() {
    const el = form.querySelector('input[name="attending"]:checked');
    return el ? el.value : "";
  }

  function renderNames() {
    const list = $("namesList");
    // keep typed values
    list.querySelectorAll("input").forEach((inp, i) => (savedNames[i] = inp.value));
    list.innerHTML = "";
    for (let i = 0; i < count; i++) {
      const row = document.createElement("div");
      row.className = "name-row";
      row.innerHTML =
        '<span class="num" aria-hidden="true">' + (i + 1) + "</span>" +
        '<input type="text" id="guest' + (i + 1) + '" maxlength="80" autocomplete="off" aria-label="Name of person ' + (i + 1) + '" placeholder="Full name of person ' + (i + 1) + '">';
      row.querySelector("input").value = savedNames[i] || "";
      list.appendChild(row);
    }
    $("namesField").hidden = count === 0;
  }

  function setCount(n) {
    count = Math.max(0, Math.min(CONFIG.MAX_COMPANIONS, n));
    $("companionCount").textContent = count;
    $("minus").disabled = count === 0;
    $("plus").disabled = count === CONFIG.MAX_COMPANIONS;
    $("headcountPill").textContent = "Total in your party: " + (count + 1);
    renderNames();
    $("namesErr").hidden = true;
  }

  $("minus").addEventListener("click", () => setCount(count - 1));
  $("plus").addEventListener("click", () => {
    setCount(count + 1);
    const last = $("guest" + count);
    if (last) last.focus();
  });

  form.addEventListener("change", (e) => {
    if (e.target.name !== "attending") return;
    $("attendErr").hidden = true;
    const yes = attending() === "Yes";
    const block = $("yesOnly");
    block.hidden = !yes;
    if (yes) { block.classList.remove("reveal"); void block.offsetWidth; block.classList.add("reveal"); }
    $("submitLabel").textContent = yes ? "Count me in!" : "Send my RSVP";
  });

  $("fullName").addEventListener("input", () => { $("nameField").classList.remove("invalid"); $("nameErr").hidden = true; });

  /* ---------- Validation ---------- */
  const clean = (s) => s.replace(/\s+/g, " ").trim();

  function validate() {
    let ok = true, firstBad = null;
    const att = attending();
    if (!att) { $("attendErr").hidden = false; ok = false; firstBad = firstBad || $("attendYes"); }

    const name = clean($("fullName").value);
    if (name.length < 3 || !/\s/.test(name)) {
      $("nameField").classList.add("invalid"); $("nameErr").hidden = false; ok = false;
      firstBad = firstBad || $("fullName");
    }

    const guests = [];
    if (att === "Yes" && count > 0) {
      let missing = false;
      for (let i = 1; i <= count; i++) {
        const inp = $("guest" + i);
        const v = clean(inp.value);
        inp.classList.toggle("invalid", !v);
        if (!v) { missing = true; firstBad = firstBad || inp; }
        guests.push(v);
      }
      if (missing) { $("namesErr").hidden = false; ok = false; }
    }
    if (firstBad) firstBad.focus();
    return ok ? { attending: att, fullName: name, companions: att === "Yes" ? count : 0, companionNames: att === "Yes" ? guests : [] } : null;
  }

  /* ---------- Submit ---------- */
  let sending = false;
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (sending) return;
    $("formError").hidden = true;
    const data = validate();
    if (!data) return;

    sending = true;
    const btn = $("submitBtn");
    btn.disabled = true;
    const label = $("submitLabel").textContent;
    btn.innerHTML = '<span class="spinner" aria-hidden="true"></span><span>Sending…</span>';

    try {
      if (DEMO) {
        console.warn("[RSVP] Demo mode — set CONFIG.SCRIPT_URL to save responses to Google Sheets.", data);
        await new Promise((r) => setTimeout(r, 900));
      } else {
        // text/plain keeps this a "simple" request, so Apps Script needs no CORS preflight
        const res = await fetch(CONFIG.SCRIPT_URL, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify(data)
        });
        const out = await res.json();
        if (!out.ok) throw new Error(out.error || "The RSVP could not be saved.");
      }
      store.set({ ...data, at: Date.now() });
      showThanks(data);
    } catch (err) {
      $("formError").textContent = (err && err.message && !/fetch|network|json/i.test(err.message))
        ? err.message
        : "We couldn't send your RSVP. Check your internet connection and tap the button again.";
      $("formError").hidden = false;
    } finally {
      sending = false;
      btn.disabled = false;
      btn.innerHTML = '<span id="submitLabel">' + label + "</span>";
    }
  });

  /* ---------- Thank-you ---------- */
  function esc(s) { return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }

  function showThanks(d) {
    const yes = d.attending === "Yes";
    $("formCard").hidden = true;
    $("thanksCard").hidden = false;
    $("gymnast").classList.toggle("still", !yes);
    const first = d.fullName.split(" ")[0];
    $("thanksTitle").textContent = yes ? "Yay, " + first + "! See you there!" : "Thank you for letting us know, " + first + ".";
    $("thanksMsg").textContent = yes
      ? "Get ready to twirl, tumble and celebrate with Story on October 31 at 4:00 PM."
      : "We'll miss you at the party! Story will be dancing in your honor.";
    let html = "<div><strong>Attending:</strong> " + (yes ? "Yes" : "No") + "</div><div><strong>Name:</strong> " + esc(d.fullName) + "</div>";
    if (yes) {
      html += "<div><strong>Total in party:</strong> " + (d.companions + 1) + "</div>";
      if (d.companionNames.length) html += "<div><strong>With:</strong> " + d.companionNames.map(esc).join(", ") + "</div>";
    }
    if (DEMO) html += '<div style="margin-top:6px;color:#C0395B"><strong>Demo mode:</strong> this response was not saved.</div>';
    $("summary").innerHTML = html;
    $("thanksCard").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    if (yes) confetti();
  }

  $("editBtn").addEventListener("click", () => {
    $("thanksCard").hidden = true;
    $("formCard").hidden = false;
    $("formCard").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  });

  /* ---------- Returning guest: prefill ---------- */
  const prev = store.get();
  if (prev && prev.fullName) {
    $("returningNotice").hidden = false;
    $("returningNotice").textContent = "Welcome back, " + prev.fullName.split(" ")[0] + "! Your earlier answer is filled in below. Change anything and send again to update it.";
    $("fullName").value = prev.fullName;
    const radio = prev.attending === "Yes" ? $("attendYes") : $("attendNo");
    radio.checked = true;
    radio.dispatchEvent(new Event("change", { bubbles: true }));
    (prev.companionNames || []).forEach((n, i) => (savedNames[i] = n));
    setCount(prev.companions || 0);
  } else {
    setCount(0);
  }

  /* ---------- Confetti ---------- */
  function confetti() {
    if (reduceMotion) return;
    const c = $("confetti"), ctx = c.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = innerWidth * dpr; c.height = innerHeight * dpr; ctx.scale(dpr, dpr);
    const colors = ["#E8849E", "#F2A0B5", "#D4A0B8", "#FBCFDB", "#F4DDE8"];
    const bits = Array.from({ length: 160 }, () => ({
      x: innerWidth / 2 + (Math.random() - .5) * 120,
      y: innerHeight * .35,
      vx: (Math.random() - .5) * 12,
      vy: -Math.random() * 12 - 4,
      r: Math.random() * 6 + 4,
      rot: Math.random() * 6,
      vr: (Math.random() - .5) * .3,
      color: colors[(Math.random() * colors.length) | 0],
      shape: Math.random() < .3 ? "star" : "rect"
    }));
    const t0 = performance.now();
    (function frame(t) {
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      bits.forEach((b) => {
        b.vy += .28; b.vx *= .99; b.x += b.vx; b.y += b.vy; b.rot += b.vr;
        ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.rot); ctx.fillStyle = b.color;
        if (b.shape === "star") {
          ctx.beginPath();
          for (let i = 0; i < 10; i++) { const rr = i % 2 ? b.r / 2.2 : b.r; const a = i * Math.PI / 5; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
          ctx.closePath(); ctx.fill();
        } else ctx.fillRect(-b.r / 2, -b.r / 4, b.r, b.r / 2);
        ctx.restore();
      });
      if (t - t0 < 4000) requestAnimationFrame(frame); else ctx.clearRect(0, 0, innerWidth, innerHeight);
    })(t0);
  }
})();