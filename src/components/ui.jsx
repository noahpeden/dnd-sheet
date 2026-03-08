import React from 'react';

export function Field({ label, value, onChange, type = "text", w = "w-full", small, mono, t: th }) {
  const c = th || {};
  return (
    <div className={`${w} flex flex-col`}>
      {label && <label style={{ fontFamily: "Arial, sans-serif", fontSize: small ? "0.5rem" : "0.6rem", color: c.primaryMid || "#7a9e7e", letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</label>}
      <input type={type} value={value} onChange={(e) => onChange(type === "number" ? +e.target.value || 0 : e.target.value)}
        className="bg-transparent border-b-2 outline-none px-1 py-0.5"
        style={{ borderColor: c.primaryDim || "#3a5a40", fontFamily: mono ? "'Fira Code', monospace" : "Arial, sans-serif", color: c.text || "#e8e0d0", fontSize: small ? "0.8rem" : "0.9rem" }} />
    </div>
  );
}

export function TextArea({ label, value, onChange, rows = 3, t: th }) {
  const c = th || {};
  return (
    <div className="w-full flex flex-col">
      {label && <label style={{ fontFamily: "Arial, sans-serif", fontSize: "0.6rem", color: c.primaryMid || "#7a9e7e", letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</label>}
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={rows}
        className="bg-transparent border-2 rounded outline-none px-2 py-1 resize-y"
        style={{ borderColor: c.primaryDim || "#3a5a40", fontFamily: "Arial, sans-serif", color: c.text || "#e8e0d0", fontSize: "0.85rem" }} />
    </div>
  );
}

export function Section({ title, children, accent, className = "", t: th }) {
  const c = th || {};
  const bc = accent || c.primaryDim || "#3a5a40";
  return (
    <div className={`rounded-lg p-3 mb-3 ${className}`} style={{ background: "rgba(20,30,20,0.5)", border: `1.5px solid ${bc}`, boxShadow: `inset 0 1px 8px rgba(0,0,0,0.3), 0 0 12px ${bc}15` }}>
      {title && <h3 className="text-xs font-bold uppercase tracking-widest mb-2 pb-1" style={{ fontFamily: "Arial, sans-serif", color: accent || c.primaryMid || "#7a9e7e", borderBottom: `1px solid ${bc}55`, fontSize: "0.7rem" }}>{title}</h3>}
      {children}
    </div>
  );
}

export function TabBtn({ active, label, onClick, icon, t: th }) {
  const c = th || {};
  return (
    <button onClick={onClick} className="px-3 py-1.5 cursor-pointer transition-all duration-200"
      style={{ fontFamily: "Arial, sans-serif", fontSize: "0.65rem", letterSpacing: "0.1em", textTransform: "uppercase",
        background: active ? `linear-gradient(135deg, ${c.primaryDark || "#2d4a30"}, ${c.primaryDim || "#3a5a40"})` : "transparent",
        color: active ? (c.primaryLight || "#c8e6c9") : (c.primaryMid || "#7a9e7e"), borderRadius: "6px 6px 0 0",
        border: active ? `1.5px solid ${c.primary || "#4a7c59"}` : "1.5px solid transparent",
        borderBottom: active ? "1.5px solid transparent" : `1.5px solid ${c.primaryDim || "#3a5a40"}55`, fontWeight: active ? 700 : 400 }}>
      {icon} {label}
    </button>
  );
}

export function Dropdown({ label, value, onChange, options, t: th }) {
  const c = th || {};
  return (
    <div className="flex flex-col">
      {label && <label style={{ fontFamily: "Arial, sans-serif", fontSize: "0.6rem", color: c.primaryMid || "#7a9e7e", letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</label>}
      <select value={value} onChange={(e) => onChange(e.target.value)}
        style={{ background: "transparent", borderBottom: `2px solid ${c.primaryDim || "#3a5a40"}`, color: c.text || "#e8e0d0", fontSize: "0.9rem", fontFamily: "Arial, sans-serif", outline: "none", padding: "2px 4px" }}>
        {options.map((o) => {
          const val = typeof o === "string" ? o : o.value;
          const lab = typeof o === "string" ? o : o.label;
          return <option key={val} value={val} style={{ background: "#1a2a1a" }}>{lab}</option>;
        })}
      </select>
    </div>
  );
}
