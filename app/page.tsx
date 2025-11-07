"use client";

import { useEffect, useState } from "react";

type Client = {
  id: string;
  name: string;
};

type Entry = {
  id: string;
  clientId: string;
  timestamp: string;
  bp?: string;
  hr?: string;
  ciwa?: number | null;
  meds?: string;
  notes?: string;
};

const STORAGE_KEY = "home_detox_navigator_v1";

export default function Home() {
  const [clients, setClients] = useState<Client[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>("");

  const [newClientName, setNewClientName] = useState("");
  const [bp, setBp] = useState("");
  const [hr, setHr] = useState("");
  const [ciwa, setCiwa] = useState("");
  const [meds, setMeds] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed.clients) setClients(parsed.clients);
      if (parsed.entries) setEntries(parsed.entries);
      if (parsed.selectedClientId) setSelectedClientId(parsed.selectedClientId);
    } catch (e) {
      console.error("Failed to load saved data", e);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const payload = {
      clients,
      entries,
      selectedClientId,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [clients, entries, selectedClientId]);

  const addClient = () => {
    const name = newClientName.trim();
    if (!name) return;
    const client: Client = {
      id: crypto.randomUUID(),
      name,
    };
    setClients((prev) => [...prev, client]);
    setSelectedClientId(client.id);
    setNewClientName("");
  };

  const addEntry = () => {
    if (!selectedClientId) return;

    const ciwaTrimmed = ciwa.trim();
    const ciwaNum =
      ciwaTrimmed === ""
        ? null
        : isNaN(Number(ciwaTrimmed))
        ? null
        : Number(ciwaTrimmed);

    const entry: Entry = {
      id: crypto.randomUUID(),
      clientId: selectedClientId,
      timestamp: new Date().toISOString(),
      bp: bp.trim() || undefined,
      hr: hr.trim() || undefined,
      ciwa: ciwaNum,
      meds: meds.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    setEntries((prev) => [entry, ...prev]);
    setBp("");
    setHr("");
    setCiwa("");
    setMeds("");
    setNotes("");
  };

  const currentClient = clients.find((c) => c.id === selectedClientId);

  const currentEntries = entries
    .filter((e) => e.clientId === selectedClientId)
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return (
      d.toLocaleDateString() +
      " " +
      d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  };

  const generateSummaryText = () => {
    if (!currentClient) return "";
    const header = `Home Detox Summary\nClient: ${
      currentClient.name
    }\nGenerated: ${formatTime(new Date().toISOString())}\n\n`;

    const body = currentEntries
      .slice()
      .reverse()
      .map((e) => {
        const vitals =
          e.bp || e.hr
            ? `Vitals: ${e.bp ? `BP ${e.bp}` : ""}${
                e.bp && e.hr ? " | " : ""
              }${e.hr ? `HR ${e.hr}` : ""}`
            : "";
        const meds = e.meds ? `Meds: ${e.meds}` : "";
        const notes = e.notes ? `Notes: ${e.notes}` : "";
        const ciwa =
          e.ciwa !== null && e.ciwa !== undefined
            ? `CIWA: ${e.ciwa}`
            : "";
        const lineParts = [vitals, meds, notes, ciwa].filter(Boolean).join(" | ");
        return `${formatTime(e.timestamp)}\n${lineParts}\n`;
      })
      .join("\n");

    return header + body;
  };

  const summaryText = generateSummaryText();

  const handleCopySummary = async () => {
    if (!summaryText) return;
    try {
      await navigator.clipboard.writeText(summaryText);
      alert("Summary copied to clipboard.");
    } catch (e) {
      console.error("Clipboard error", e);
    }
  };

  const getCiwaChip = (ciwa?: number | null) => {
    if (ciwa === null || ciwa === undefined) return null;
    if (ciwa >= 15)
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-orange-500 text-slate-950">
          CIWA {ciwa} – escalate
        </span>
      );
    if (ciwa >= 10)
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-300 text-slate-950">
          CIWA {ciwa} – watch
        </span>
      );
    return (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-400 text-slate-950">
        CIWA {ciwa}
      </span>
    );
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Home Detox Navigator
          </h1>
          <p className="text-xs text-slate-400">
            Private-pay, nurse-led documentation. Time-stamped, clean, defensible.
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-[260px,1fr]">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 space-y-3">
            <h2 className="text-[11px] font-semibold text-slate-200 uppercase tracking-[0.14em]">
              Clients
            </h2>
            <div className="flex gap-2">
              <input
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
                placeholder="Add client name or initials"
                className="flex-1 rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-amber-400"
              />
              <button
                onClick={addClient}
                className="px-3 py-2 rounded-xl bg-amber-400 text-slate-950 text-[10px] font-semibold hover:bg-amber-300"
              >
                Add
              </button>
            </div>
            <div className="space-y-1 max-h-52 overflow-y-auto pr-1">
              {clients.length === 0 && (
                <p className="text-[10px] text-slate-500">
                  Start by adding a client. This stays on this device.
                </p>
              )}
              {clients.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedClientId(c.id)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-[10px] border flex items-center justify-between gap-2 ${
                    selectedClientId === c.id
                      ? "bg-amber-400 text-slate-950 border-amber-300 shadow-md"
                      : "bg-slate-950 border-slate-800 text-slate-300 hover:border-amber-300/70"
                  }`}
                >
                  <span className="truncate">{c.name}</span>
                  <span className="px-2 py-0.5 rounded-full text-[8px] bg-slate-800 text-slate-300">
                    {entries.some((e) => e.clientId === c.id)
                      ? "active"
                      : "new"}
                  </span>
                </button>
              ))}
            </div>
            <p className="text-[9px] text-slate-500">
              This tool is for structured notes only. Use clinical judgment & MD orders.
            </p>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 space-y-2">
            <div className="flex justify-between items-baseline gap-2">
              <h2 className="text-[11px] font-semibold text-slate-200 uppercase tracking-[0.14em]">
                New Entry
              </h2>
              {currentClient && (
                <span className="text-[10px] text-slate-400">
                  Documenting: <strong>{currentClient.name}</strong>
                </span>
              )}
            </div>
            {!currentClient && (
              <p className="text-[10px] text-slate-500">
                Select or add a client on the left to begin documenting.
              </p>
            )}
            {currentClient && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px]">
                  <input
                    value={bp}
                    onChange={(e) => setBp(e.target.value)}
                    placeholder="BP (e.g. 128/82)"
                    className="rounded-xl bg-slate-950 border border-slate-700 px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-amber-400"
                  />
                  <input
                    value={hr}
                    onChange={(e) => setHr(e.target.value)}
                    placeholder="HR"
                    className="rounded-xl bg-slate-950 border border-slate-700 px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-amber-400"
                  />
                  <input
                    value={ciwa}
                    onChange={(e) => setCiwa(e.target.value)}
                    placeholder="CIWA"
                    className="rounded-xl bg-slate-950 border border-slate-700 px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-amber-400"
                  />
                  <input
                    value={meds}
                    onChange={(e) => setMeds(e.target.value)}
                    placeholder="Meds given"
                    className="rounded-xl bg-slate-950 border border-slate-700 px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-amber-400"
                  />
                </div>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Notes (symptoms, mental status, fluids, support person, MD notified, etc.)"
                  className="w-full mt-2 rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-[10px] outline-none focus:ring-1 focus:ring-amber-400 min-h-[64px]"
                />
                <div className="flex justify-end mt-1">
                  <button
                    onClick={addEntry}
                    disabled={!selectedClientId}
                    className="px-4 py-2 rounded-xl bg-emerald-400 text-slate-950 text-[10px] font-semibold hover:bg-emerald-300 disabled:opacity-40"
                  >
                    Save Entry (auto-timestamped)
                  </button>
                </div>
                <p className="text-[8px] text-slate-500">
                  CIWA ≥ 15 flagged as escalate; ≥ 10 as watch. Visual cue only.
                </p>
              </>
            )}
          </div>
        </section>

        {currentClient && (
          <section className="grid gap-4 md:grid-cols-[1.6fr,1.2fr]">
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3">
              <h2 className="text-[11px] font-semibold text-slate-200 uppercase tracking-[0.14em] mb-1">
                Timeline – {currentClient.name}
              </h2>
              {currentEntries.length === 0 && (
                <p className="text-[10px] text-slate-500">
                  No entries yet. Start with initial assessment.
                </p>
              )}
              <div className="flex flex-col gap-2 max-h-[320px] overflow-y-auto pr-1">
                {currentEntries.map((e) => (
                  <div
                    key={e.id}
                    className="p-2.5 rounded-2xl border border-slate-800 bg-slate-950 text-[9px] flex flex-col gap-1"
                  >
                    <div className="flex justify-between items-center gap-2 text-slate-400">
                      <span>{formatTime(e.timestamp)}</span>
                      {getCiwaChip(e.ciwa)}
                    </div>
                    <div className="text-slate-300 flex flex-wrap gap-2">
                      {e.bp && <span>BP {e.bp}</span>}
                      {e.hr && <span>HR {e.hr}</span>}
                      {e.meds && <span>Meds: {e.meds}</span>}
                    </div>
                    {e.notes && (
                      <div className="text-slate-400">
                        {e.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 flex flex-col gap-2">
              <h2 className="text-[11px] font-semibold text-slate-200 uppercase tracking-[0.14em]">
                Aftercare Summary
              </h2>
              <p className="text-[9px] text-slate-500">
                Copy into a letter or secure email for the client&apos;s ongoing clinician.
              </p>
              <textarea
                readOnly
                value={summaryText}
                className="flex-1 w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-[9px] text-slate-300 whitespace-pre-wrap min-h-[140px]"
              />
              <div className="flex justify-between items-center gap-2">
                <p className="text-[8px] text-slate-500">
                  Demonstrates monitoring, meds, and escalation awareness.
                </p>
                <button
                  onClick={handleCopySummary}
                  disabled={!summaryText}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-100 text-[9px] hover:bg-slate-700 disabled:opacity-40"
                >
                  Copy Summary
                </button>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
