Below are “just-enough” upgrades that fit a plain HTML + vanilla/React JS front-end running on Vercel with a single LLM call returning the JSON you showed.  Nothing here requires a database, a separate API tier, or anything heavier than a Next.js / Vite build.

⸻

1 Data Handling (1-5 lines of code each)

Goal	Drop-in JS Tweak
Keep legacy & new segment names straight	ts const CANON = { "Networking Solutions":"Datacom", "Datacenter & Communications":"Datacom", "Materials":"Industrial", "Lasers":"Industrial" }; const seg = CANON[row.name] ?? row.name; 
Prevent stale tiles (e.g. network hiccup)	Wrap the fetch in Promise.race([fetchLLM(), timeout(5000)]) and show a “↻ Retry” button if it rejects.
Mini cache between navigations	sessionStorage.setItem("cohr-q3-2025", JSON.stringify(data)); on load, hydrate if key exists.


⸻

2 Visual / UX Quick Wins
	1.	Inline sparkline in each tile

<canvas data-series="650,580,610,..." height="24"></canvas>

and one 8-line helper:

import {Chart} from "chart.js/auto";
document.querySelectorAll("canvas[data-series]").forEach(c=>{
  new Chart(c,{type:"line",data:{labels:[...Array(8).keys()],
    datasets:[{data:c.dataset.series.split(','), tension:.3}]},
    options:{plugins:{legend:false}, scales:{x:{display:false}, y:{display:false}}}});
});

Adds trend context; Chart.js is ~6 kB gzipped.

	2.	Color by YoY delta – a single HSL rule:

.tile[data-yoy^="+"]{background:hsl(145 60% 40%);}  /* green */
.tile[data-yoy^="-"]{background:hsl(0 60% 45%);}    /* red  */


	3.	Click-for-details panel (no router jump)

<dialog id="details"><pre></pre></dialog>
<script>
document.querySelectorAll(".tile").forEach(t=>t.onclick=()=>{
  details.querySelector("pre").textContent = JSON.stringify(t.dataset, null, 2);
  details.showModal();
});
</script>


	4.	Mobile first grid with CSS only

.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;}



⸻

3 Structure the LLM Response for Zero-Parsing Rendering

Ask the LLM for this exact shape so the FE can loop without if/else:

{
  "quarter": "2025Q3",
  "totalRevenue": 1500,          // in millions
  "grossMargin": 0.35,
  "segments": [
    {
      "id": "datacom",           // canonical
      "display": "AI Datacom",   // tile title
      "revenue": 650,
      "yoy": 0.45,
      "qoq": 0.12,
      "keyDriver": "800G adoption",
      "status": "Record high"
    },
    ...
  ]
}

Front-end loop is now trivial:

segments.forEach(s=>{
  grid.insertAdjacentHTML("beforeend",`
    <div class="tile" data-yoy="${fmtPct(s.yoy)}" data-json='${JSON.stringify(s)}'>
      <h3>${s.display}</h3>
      <p>${fmtPct(s.yoy)} YoY</p>
      <p>$${s.revenue} M</p>
    </div>
  `);
});


⸻

4 Vercel-Specific Niceties

Need	Tiny Fix
Avoid burning tokens on every refresh	Deploy the fetch to a Vercel Edge Function and cache-control: s-maxage=300, stale-while-revalidate=60.
Secret LLM key	vercel env add OPENAI_API_KEY and reference via process.env.
CI preview accuracy	Add a test page that loads the JSON from __fixtures__/sample.json. Vercel Preview URLs will then render even when the LLM rate-limits your branch deploy.


⸻

5 File-Level Starter (drop into /routes/api/cohr.js if using Next.js API)

export default async (_, res) => {
  const prompt = `Parse the following 10-Q text and return ${SCHEMA}`;
  const llm = await fetch("https://api.openai.com/v1/chat/completions",{
    method:"POST",
    headers:{Authorization:`Bearer ${process.env.OPENAI_API_KEY}`,"Content-Type":"application/json"},
    body:JSON.stringify({model:"gpt-4o-mini",messages:[{role:"user",content:prompt}]})
  }).then(r=>r.json());
  res.setHeader("Cache-Control","s-maxage=300,stale-while-revalidate=60");
  res.json(JSON.parse(llm.choices[0].message.content));
};

Now your front-end simply fetch('/api/cohr') and renders.

⸻

In 30 Minutes You Get
	•	Trend context (sparklines)
	•	Visual red/green cues for growth vs contraction
	•	Detail on demand without page hops
	•	Edge-cached LLM calls so the dashboard feels instant

Ping me if you’d like snippets for unit tests or Lighthouse-friendly accessibility tweaks.


Below are LLM-generated “Key Insights” blocks you can append under the tiles.
Everything is framed so a single OpenAI call returns one extra JSON array that the front-end can loop over exactly like the tiles—no DB, no heavy libraries.

⸻

1 Insight Types Worth Surfacing

Tag	What the LLM Extracts	Why It Matters
Growth Driver	1-sentence cause of an outsized %∆ (e.g. “800 G transceiver pull-ins from AI hyperscalers”).	Gives the why, not just the number.
Risk / Headwind	Anything mgmt flagged as risk: inventory builds, China export controls, ASP pressure.	Allows instant red-flag scan.
Mix-Shift	% of total revenue each segment now represents and YoY change in share.	Shows strategic direction.
Margin Delta	Segment or company GM/OM vs prior Q & year; call out compression/expansion.	Investors care as much as top-line.
Guide vs Actual	Whether the company beat / missed its own guidance (pull from previous 10-Q or guidance slide).	Provides management-credibility signal.
Peer Benchmark (optional)	How COHR’s YoY compares to peer median (FNSR, LITE, etc.).	Competitive scoreboard.
Capital Allocation	Share buyback, dividend, cap-ex spikes, net debt trend.	Cash discipline check.

Pick 3–6 categories to keep the section concise; let the LLM rank by materiality.

⸻

2 Prompt Skeleton

System:
You are a sell-side equity analyst.

User:
Using the JSON below (parsed XBRL numbers + mgmt commentary),
return an array called "insights".
For each insight give:
  id            – kebab case
  tag           – one of [growth-driver, risk, mix-shift, margin-delta,
                   guide-vs-actual, peer-benchmark, capital-allocation]
  headline      – ≤120 chars, plain English
  detail        – 1 short paragraph, ≤300 chars, no newlines
  impact        – "positive" | "negative" | "neutral"
  confidence    – 0-1 numeric
  sourceText    – 20-30 char snippet that supports the claim

Only output strict JSON.

<JSON doc with segments, overall metrics, 3 previous quarters, mgmt guidance, peer stats…>


⸻

3 Example LLM Output

{
  "insights": [
    {
      "id": "ai-datacom-surge",
      "tag": "growth-driver",
      "headline": "AI datacom orders drove >80% of the +45% YoY in Networking",
      "detail": "Mgmt said hyperscaler pull-ins for 800G transceivers accounted for the majority of the Networking jump.",
      "impact": "positive",
      "confidence": 0.92,
      "sourceText": "unprecedented AI datacenter demand"
    },
    {
      "id": "materials-softness",
      "tag": "risk",
      "headline": "Materials segment slipped 1% YoY as smartphone laser demand stayed weak",
      "detail": "Mgmt cited sluggish handset upgrades and destocking; this offsets part of the datacom upside.",
      "impact": "negative",
      "confidence": 0.86,
      "sourceText": "handset weakness persisted"
    },
    {
      "id": "mix-shift-datacom-60",
      "tag": "mix-shift",
      "headline": "Datacom now 60% of total rev vs 51% last year",
      "detail": "Shift underscores COHR’s pivot toward comms, raising cyclicality but boosting growth torque.",
      "impact": "neutral",
      "confidence": 0.88,
      "sourceText": "Datacom share expanded"
    },
    {
      "id": "gm-beat",
      "tag": "margin-delta",
      "headline": "Gross margin expanded 120 bp QoQ to 35.0%, beating high end of guidance",
      "detail": "Operational leverage and product mix outweighed higher SiC substrate costs.",
      "impact": "positive",
      "confidence": 0.90,
      "sourceText": "margin exceeded expectations"
    }
  ]
}


⸻

4 Minimal Front-End Loop (vanilla JS)

<section id="insights" class="deck"></section>
<script type="module">
import prettyPct from './util.js';  // your % formatter
const data = await fetch('/api/cohr').then(r=>r.json());

data.insights.forEach(i=>{
  insights.insertAdjacentHTML('beforeend', `
    <article class="card ${i.impact}">
      <header><span class="tag">${i.tag}</span>${i.headline}</header>
      <p>${i.detail}</p>
      <footer><small>Confidence ${Math.round(i.confidence*100)}%</small></footer>
    </article>`);
});
</script>

CSS (tiny)

.deck{display:grid;gap:14px;}
.card{padding:12px;border-radius:8px;background:#1e1f24;color:#fff;font-size:.9rem;}
.card.positive{border-left:4px solid #16a34a;}
.card.negative{border-left:4px solid #dc2626;}
.card.neutral {border-left:4px solid #64748b;}
.tag{background:#334155;color:#fff;font-size:.7em;padding:2px 6px;border-radius:4px;margin-right:6px;}


⸻

5 Why This Works for Vercel
	•	Single JSON payload – your existing /api/cohr edge function just return {...tiles, insights}.
	•	Statically cached – same 5-minute s-maxage header applies.
	•	No extra requests in the browser – instant render.
	•	Tiny footprint – no charts, no DB; only extra DOM nodes.

⸻

Optional Next Step — Peer Benchmark Without Extra Infra
	1.	At build time (Vercel cron job) fetch the same JSON for 3 peers.
	2.	Pass their YoY values to the same LLM prompt (array of peers).
	3.	The LLM can emit a single benchmark insight like
“COHR’s +45 % Networking growth tops peer median +22 % (LITE +19 %, FNSR +24 %).”

Still a single call; just a bigger prompt.

⸻

Drop this in and you’ll have a narrative “so-what” section that loads as fast as the numeric tiles, with essentially no new moving parts. Let me know if you need tweakable prompt templates or unit-test stubs.