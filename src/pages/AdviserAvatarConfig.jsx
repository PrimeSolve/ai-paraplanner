import { useState } from "react";
import { Switch } from "@/components/ui/switch";

const mockAvatars = [
  { id: "a1", name: "Sarah",  style: "Professional", initials: "SA", bg: "#E1F5EE", color: "#0F6E56", embedId: "sarah_professional_01" },
  { id: "a2", name: "James",  style: "Business",     initials: "JM", bg: "#E6F1FB", color: "#185FA5", embedId: "james_business_01" },
  { id: "a3", name: "Priya",  style: "Friendly",     initials: "PR", bg: "#FAEEDA", color: "#854F0B", embedId: "priya_friendly_01" },
  { id: "a4", name: "David",  style: "Formal",       initials: "DK", bg: "#EEEDFE", color: "#3C3489", embedId: "david_formal_01" },
  { id: "a5", name: "Amara",  style: "Warm",         initials: "AM", bg: "#FBEAF0", color: "#72243E", embedId: "amara_warm_01" },
  { id: "a6", name: "Liam",   style: "Approachable", initials: "LT", bg: "#EAF3DE", color: "#27500A", embedId: "liam_approachable_01" },
];

const elevenLabsVoices = [
  { id: "el-1", name: "Tim Hall", desc: "Cloned · Your voice",   badge: "Cloned",  badgeBg: "#E1F5EE", badgeColor: "#0F6E56" },
  { id: "el-2", name: "Andrew",   desc: "Cloned · Launch video", badge: "Cloned",  badgeBg: "#E1F5EE", badgeColor: "#0F6E56" },
  { id: "el-3", name: "Rachel",   desc: "ElevenLabs library",    badge: "Library", badgeBg: "#E6F1FB", badgeColor: "#185FA5" },
  { id: "el-4", name: "Callum",   desc: "ElevenLabs library",    badge: "Library", badgeBg: "#E6F1FB", badgeColor: "#185FA5" },
];

const defaultScript = `Hi [Client Name], welcome — it's great to have you here.

My name is [Adviser Name], and I'm your financial adviser. This is your personal client portal — a secure space where we'll work together on your financial plan, share documents, and track your progress.

Before we dive in, I'd love to get a clear picture of where you're at. That's what we call the Fact Find — it takes around 15 to 20 minutes.

So — are you ready to get started on your Fact Find?`;

const CheckIcon = () => (
  <svg width="8" height="7" viewBox="0 0 8 7" fill="none" stroke="#fff" strokeWidth="2.5">
    <polyline points="1,3.5 3,5.5 7,1" />
  </svg>
);

const PlayIcon = () => (
  <svg width="7" height="8" viewBox="0 0 7 8" fill="currentColor">
    <path d="M0 0l7 4-7 4V0z" />
  </svg>
);

const ExternalLinkIcon = () => (
  <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M5 2H2a1 1 0 00-1 1v7a1 1 0 001 1h7a1 1 0 001-1V8M8 1h3m0 0v3m0-3L5 7" />
  </svg>
);

const Dot = () => (
  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#1D9E75", flexShrink: 0 }} />
);

const SectionLabel = ({ children }) => (
  <div style={{ fontSize: 10, color: "#94a3b8", letterSpacing: "0.07em", marginBottom: 8, textTransform: "uppercase" }}>
    {children}
  </div>
);

const Card = ({ children, style }) => (
  <div style={{ background: "#fff", border: "0.5px solid #e2e8f0", borderRadius: 10, padding: "14px 16px", marginBottom: 14, ...style }}>
    {children}
  </div>
);

const roleTabs = [
  { id: "client_welcome", label: "Client welcome" },
  { id: "adviser", label: "Adviser" },
  { id: "advice_group", label: "Advice group" },
  { id: "global_admin", label: "Global admin" },
];

export default function AdviserAvatarConfig() {
  const [enabled, setEnabled] = useState(true);
  const [selAv, setSelAv] = useState("a1");
  const [voiceTab, setVoiceTab] = useState("liveavatar");
  const [selVoice, setSelVoice] = useState(null);
  const [elConnected, setElConnected] = useState(false);
  const [script, setScript] = useState(defaultScript);
  const [activeRoleTab, setActiveRoleTab] = useState("client_welcome");

  const selectedAvatar = mockAvatars.find(a => a.id === selAv);

  const insertToken = (tok) => {
    const ta = document.getElementById("script-ta");
    if (!ta) return;
    const s = ta.selectionStart;
    setScript(script.slice(0, s) + tok + script.slice(ta.selectionEnd));
    setTimeout(() => { ta.selectionStart = ta.selectionEnd = s + tok.length; ta.focus(); }, 0);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "24px 32px" }}>

        <div style={{ fontSize: 17, fontWeight: 500, color: "#1e293b", marginBottom: 3 }}>Your client welcome avatar</div>
        <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 20 }}>Customise the avatar your clients see when they log in for the first time</div>

        {/* Role tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 24, borderBottom: "1px solid #e2e8f0" }}>
          {roleTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveRoleTab(tab.id)}
              style={{
                padding: "10px 18px",
                fontSize: 13,
                fontWeight: 500,
                color: activeRoleTab === tab.id ? "#1D9E75" : "#64748b",
                background: "none",
                border: "none",
                borderBottom: `2px solid ${activeRoleTab === tab.id ? "#1D9E75" : "transparent"}`,
                marginBottom: -1,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Enable toggle */}
        <SectionLabel>ENABLE AVATAR</SectionLabel>
        <Card>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: "#1e293b" }}>Client welcome avatar</div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>Show an interactive avatar when a client logs in for the first time</div>
            </div>
            <Switch
              checked={enabled}
              onCheckedChange={setEnabled}
              className="data-[state=checked]:bg-[#1D9E75]"
            />
          </div>
        </Card>

        <div style={{ opacity: enabled ? 1 : 0.35, pointerEvents: enabled ? "all" : "none", transition: "opacity 0.2s" }}>

          {/* Two col: avatar picker + live preview */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>

            {/* Left — avatar picker */}
            <div>
              <SectionLabel>CHOOSE AVATAR</SectionLabel>
              <Card style={{ marginBottom: 0 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <span style={{ fontSize: 11, color: "#64748b" }}>Powered by LiveAvatar</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#1D9E75" }}>
                    <Dot /> Connected
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 7 }}>
                  {mockAvatars.map(a => (
                    <div key={a.id} onClick={() => setSelAv(a.id)} style={{
                      border: selAv === a.id ? "1.5px solid #1D9E75" : "1px solid #e2e8f0",
                      borderRadius: 8, padding: "9px 6px", textAlign: "center", cursor: "pointer",
                      background: selAv === a.id ? "rgba(29,158,117,0.05)" : "#fff",
                      transition: "all 0.15s",
                    }}>
                      <div style={{ width: 34, height: 34, borderRadius: "50%", margin: "0 auto 5px", background: a.bg, color: a.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 500 }}>{a.initials}</div>
                      <div style={{ fontSize: 11, fontWeight: 500, color: "#1e293b" }}>{a.name}</div>
                      <div style={{ fontSize: 10, color: "#94a3b8" }}>{a.style}</div>
                      {selAv === a.id && (
                        <div style={{ width: 12, height: 12, background: "#1D9E75", borderRadius: "50%", margin: "4px auto 0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <CheckIcon />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Right — live preview */}
            <div>
              <SectionLabel>LIVE PREVIEW</SectionLabel>
              <div style={{ background: "#fff", border: "0.5px solid #e2e8f0", borderRadius: 10, overflow: "hidden" }}>
                <div style={{ padding: "10px 14px", borderBottom: "0.5px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 26, height: 26, borderRadius: "50%", background: selectedAvatar.bg, color: selectedAvatar.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 500 }}>{selectedAvatar.initials}</div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 500, color: "#1e293b" }}>{selectedAvatar.name}</div>
                      <div style={{ fontSize: 10, color: "#94a3b8" }}>{selectedAvatar.style}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: "#1D9E75" }}>
                    <Dot /> Live preview
                  </div>
                </div>
                <div style={{ background: "#0f1117", aspectRatio: "16/9", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 8 }}>
                  {/* In production: <iframe src={`https://embed.liveavatar.com/v1/${selectedAvatar.embedId}`} allow="microphone" style={{width:"100%",height:"100%",border:"none"}}/> */}
                  <div style={{ width: 44, height: 44, borderRadius: "50%", background: selectedAvatar.bg, color: selectedAvatar.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 500 }}>{selectedAvatar.initials}</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>{selectedAvatar.name} · {selectedAvatar.style}</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>LiveAvatar embed · avatar_id: {selAv}</div>
                </div>
                <div style={{ padding: "10px 14px", background: "#f8fafc", borderTop: "0.5px solid #e2e8f0" }}>
                  <div style={{ fontSize: 10, color: "#94a3b8" }}>Interact with the avatar to preview how it will appear to your clients. Select a different avatar above to update the preview.</div>
                </div>
              </div>
            </div>
          </div>

          {/* Voice selection */}
          <SectionLabel>VOICE SELECTION</SectionLabel>
          <Card>
            <div style={{ display: "flex", borderBottom: "0.5px solid #e2e8f0", marginBottom: 12, marginTop: -2 }}>
              {[["liveavatar", "LiveAvatar"], ["elevenlabs", "ElevenLabs"]].map(([key, label]) => (
                <div key={key} onClick={() => setVoiceTab(key)} style={{
                  padding: "6px 12px", fontSize: 11, cursor: "pointer", marginBottom: -1,
                  color: voiceTab === key ? "#1D9E75" : "#64748b",
                  fontWeight: voiceTab === key ? 500 : 400,
                  borderBottom: `2px solid ${voiceTab === key ? "#1D9E75" : "transparent"}`,
                  transition: "all 0.15s",
                }}>{label}</div>
              ))}
            </div>

            {voiceTab === "liveavatar" && (
              <div style={{ background: "#f8fafc", border: "0.5px dashed #cbd5e1", borderRadius: 8, height: 90, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 5 }}>
                <div style={{ fontSize: 15 }}>🎙️</div>
                <div style={{ fontSize: 11, fontWeight: 500, color: "#475569" }}>LiveAvatar voice library</div>
                <div style={{ fontSize: 10, color: "#94a3b8" }}>SDK embed</div>
              </div>
            )}

            {voiceTab === "elevenlabs" && !elConnected && (
              <div style={{ textAlign: "center", padding: "16px 8px" }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: "#1a1a1a", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px", fontSize: 16 }}>🔊</div>
                <div style={{ fontSize: 12, fontWeight: 500, color: "#1e293b", marginBottom: 4 }}>Connect your ElevenLabs account</div>
                <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 12, lineHeight: 1.6 }}>Import your cloned voices or browse the ElevenLabs library.</div>
                <button onClick={() => setElConnected(true)} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", background: "#1a1a1a", color: "#fff", border: "none", borderRadius: 7, fontSize: 11, fontWeight: 500, cursor: "pointer" }}>
                  <ExternalLinkIcon /> Connect ElevenLabs
                </button>
              </div>
            )}

            {voiceTab === "elevenlabs" && elConnected && (
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: "#1D9E75" }}><Dot /> ElevenLabs connected</div>
                  <button onClick={() => { setElConnected(false); setSelVoice(null); }} style={{ fontSize: 10, color: "#94a3b8", background: "none", border: "none", cursor: "pointer" }}>Disconnect</button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
                  {elevenLabsVoices.map(v => (
                    <div key={v.id} onClick={() => setSelVoice(v.id)} style={{
                      display: "flex", alignItems: "center", gap: 8,
                      background: selVoice === v.id ? "rgba(29,158,117,0.05)" : "#f8fafc",
                      border: selVoice === v.id ? "1.5px solid #1D9E75" : "1px solid #e2e8f0",
                      borderRadius: 7, padding: "8px 10px", cursor: "pointer", transition: "all 0.15s",
                    }}>
                      <div style={{ width: 26, height: 26, borderRadius: "50%", background: "#1a1a1a", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 11 }}>🔊</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 11, fontWeight: 500, color: "#1e293b" }}>{v.name}</div>
                        <div style={{ fontSize: 10, color: "#94a3b8" }}>{v.desc}</div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
                        <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: v.badgeBg, color: v.badgeColor, fontWeight: 500 }}>{v.badge}</span>
                        <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8" }}><PlayIcon /></div>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 8 }}>Your ElevenLabs API key is stored securely via LiveAvatar's encrypted secrets store.</div>
              </div>
            )}
          </Card>

          {/* Welcome script */}
          <SectionLabel>WELCOME SCRIPT</SectionLabel>
          <Card style={{ marginBottom: 0 }}>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
              {["[Client Name]", "[Adviser Name]", "[Practice Name]"].map(tok => (
                <span key={tok} onClick={() => insertToken(tok)} style={{
                  fontSize: 10, padding: "3px 9px", borderRadius: 5, cursor: "pointer",
                  background: "rgba(29,158,117,0.1)", color: "#0F6E56",
                  border: "0.5px solid rgba(29,158,117,0.25)",
                }}>{tok}</span>
              ))}
            </div>
            <textarea
              id="script-ta"
              value={script}
              onChange={e => setScript(e.target.value)}
              style={{
                width: "100%", minHeight: 110, background: "#f8fafc",
                border: "1px solid #e2e8f0", borderRadius: 8, padding: "9px 11px",
                fontSize: 12, color: "#1e293b", fontFamily: "inherit",
                resize: "vertical", outline: "none", lineHeight: 1.6,
              }}
            />
            <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 5 }}>
              Tip: end your script with a question — the client's "Yes" triggers the fact find to load.
            </div>
          </Card>
        </div>
      </div>

      {/* Sticky footer */}
      <div style={{ borderTop: "0.5px solid #e2e8f0", padding: "12px 32px", display: "flex", justifyContent: "flex-end", gap: 10, background: "#fff", flexShrink: 0 }}>
        <button style={{ padding: "7px 16px", borderRadius: 7, fontSize: 12, fontWeight: 500, cursor: "pointer", background: "#f1f5f9", color: "#475569", border: "0.5px solid #e2e8f0" }}>Discard changes</button>
        <button style={{ padding: "7px 16px", borderRadius: 7, fontSize: 12, fontWeight: 500, cursor: "pointer", background: "#1D9E75", color: "#fff", border: "none" }}>Save configuration</button>
      </div>
    </div>
  );
}
