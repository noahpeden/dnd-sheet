import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import * as pdfjsLib from "pdfjs-dist";
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).href;
import { SignInButton, SignOutButton, useUser } from "@clerk/clerk-react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../convex/_generated/api";
import { useCharacter } from "./hooks/useCharacter";
import { BLANK_CHARACTER, HUGH_JASS_SEED, DEFAULT_TEXT_STYLES } from "./characterDefaults";
import { ITEM_CATALOG } from "./data/itemCatalog";
import {
  ABILITY_DESCRIPTIONS, ABILITY_UPGRADES, ABILITY_SKILL_EFFECTS,
  THEME_PRESETS, THEME_FIELDS, SKILL_GROUPS, ITEM_CATEGORIES, ITEM_CAT_LABELS,
  DEFAULT_SLOT_POSITIONS, BODY_SLOTS, DEFAULT_INVENTORY, DEFAULT_ABILITIES,
  MAX_LEVEL, POINTS_PER_LEVEL, EDITOR_COLORS, fmtMod,
  RACE_DATA, RACE_NAMES, CLASS_DATA, CLASS_NAMES,
} from "./data";

/* ─── REUSABLE COMPONENTS ─── */
function Field({ label, value, onChange, type = "text", w = "w-full", small, mono, t: th }) {
  const c = th || {};
  return (
    <div className={`${w} flex flex-col`}>
      {label && <label style={{ fontFamily: "Arial, sans-serif", fontSize: small ? "var(--ty-meta-size)" : "var(--ty-label-size)", color: "var(--ty-label-color)", letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</label>}
      <input type={type} value={value} onChange={(e) => onChange(type === "number" ? +e.target.value || 0 : e.target.value)}
        className="bg-transparent border-b-2 outline-none px-1 py-0.5"
        style={{ borderColor: c.primaryDim || "#3a5a40", fontFamily: mono ? "'Fira Code', monospace" : "Arial, sans-serif", color: c.text || "#e8e0d0", fontSize: small ? "var(--ty-body-size)" : "var(--ty-value-size)" }} />
    </div>
  );
}

function TextArea({ label, value, onChange, rows = 3, t: th }) {
  const c = th || {};
  return (
    <div className="w-full flex flex-col">
      {label && <label style={{ fontFamily: "Arial, sans-serif", fontSize: "var(--ty-label-size)", color: "var(--ty-label-color)", letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</label>}
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={rows}
        className="bg-transparent border-2 rounded outline-none px-2 py-1 resize-y"
        style={{ borderColor: c.primaryDim || "#3a5a40", fontFamily: "Arial, sans-serif", color: c.text || "#e8e0d0", fontSize: "var(--ty-body-size)" }} />
    </div>
  );
}

function Section({ title, children, accent, className = "", t: th }) {
  const c = th || {};
  const bc = accent || c.primaryDim || "#3a5a40";
  return (
    <div className={`rounded-lg p-3 mb-3 ${className}`} style={{ background: "rgba(20,30,20,0.5)", border: `1.5px solid ${bc}`, boxShadow: `inset 0 1px 8px rgba(0,0,0,0.3), 0 0 12px ${bc}15` }}>
      {title && <h3 className="font-bold uppercase tracking-widest mb-2 pb-1" style={{ fontFamily: "Arial, sans-serif", color: accent || "var(--ty-heading-color)", borderBottom: `1px solid ${bc}55`, fontSize: "var(--ty-heading-size)" }}>{title}</h3>}
      {children}
    </div>
  );
}

function TabBtn({ active, label, onClick, icon, t: th }) {
  const c = th || {};
  return (
    <button onClick={onClick} className="px-3 py-1.5 cursor-pointer transition-all duration-200"
      style={{ fontFamily: "Arial, sans-serif", fontSize: "var(--ty-label-size)", letterSpacing: "0.1em", textTransform: "uppercase",
        background: active ? `linear-gradient(135deg, ${c.primaryDark || "#2d4a30"}, ${c.primaryDim || "#3a5a40"})` : "transparent",
        color: active ? (c.primaryLight || "#c8e6c9") : (c.primaryMid || "#7a9e7e"), borderRadius: "6px 6px 0 0",
        border: active ? `1.5px solid ${c.primary || "#4a7c59"}` : "1.5px solid transparent",
        borderBottom: active ? "1.5px solid transparent" : `1.5px solid ${c.primaryDim || "#3a5a40"}55`, fontWeight: active ? 700 : 400 }}>
      {icon} {label}
    </button>
  );
}

/* ─── RICH TEXT EDITOR ─── */
function RichTextEditor({ html, onChange, minHeight = 40, t: th }) {
  const c = th || {};
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.innerHTML = html ?? "";
    }
  }, []); // set content on mount only

  return (
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      onInput={() => onChange(ref.current?.innerHTML ?? "")}
      style={{
        minHeight,
        fontFamily: "Arial, sans-serif",
        fontSize: "0.8rem",
        color: c.text || "#e8e0d0",
        background: "transparent",
        outline: "none",
        padding: "2px 0",
        lineHeight: 1.5,
        wordBreak: "break-word",
        whiteSpace: "pre-wrap",
      }}
    />
  );
}

/* ─── SVG BODY FIGURE ─── */
function BodySVG() {
  return (
    <g transform="translate(90, 10)">
      <circle cx="60" cy="28" r="20" fill="none" stroke="#4a7c59" strokeWidth="2.5" />
      {/* Eyes */}
      <circle cx="52" cy="24" r="2.5" fill="#4a7c59" />
      <circle cx="68" cy="24" r="2.5" fill="#4a7c59" />
      {/* Mouth - slight smile */}
      <path d="M50 34 Q60 40 70 34" fill="none" stroke="#4a7c59" strokeWidth="1.5" />
      {/* Neck */}
      <line x1="60" y1="48" x2="60" y2="58" stroke="#4a7c59" strokeWidth="2.5" />
      {/* Torso */}
      <rect x="35" y="58" width="50" height="65" rx="8" fill="none" stroke="#4a7c59" strokeWidth="2.5" />
      {/* Left arm */}
      <line x1="35" y1="65" x2="8" y2="95" stroke="#4a7c59" strokeWidth="2.5" />
      <line x1="8" y1="95" x2="-10" y2="130" stroke="#4a7c59" strokeWidth="2.5" />
      {/* Right arm */}
      <line x1="85" y1="65" x2="112" y2="95" stroke="#4a7c59" strokeWidth="2.5" />
      <line x1="112" y1="95" x2="130" y2="130" stroke="#4a7c59" strokeWidth="2.5" />
      {/* Left leg */}
      <line x1="48" y1="123" x2="38" y2="180" stroke="#4a7c59" strokeWidth="2.5" />
      <line x1="38" y1="180" x2="32" y2="240" stroke="#4a7c59" strokeWidth="2.5" />
      {/* Right leg */}
      <line x1="72" y1="123" x2="82" y2="180" stroke="#4a7c59" strokeWidth="2.5" />
      <line x1="82" y1="180" x2="88" y2="240" stroke="#4a7c59" strokeWidth="2.5" />
      {/* Feet */}
      <ellipse cx="28" cy="245" rx="12" ry="6" fill="none" stroke="#4a7c59" strokeWidth="2" />
      <ellipse cx="92" cy="245" rx="12" ry="6" fill="none" stroke="#4a7c59" strokeWidth="2" />
      {/* Hands */}
      <circle cx="-12" cy="134" r="6" fill="none" stroke="#4a7c59" strokeWidth="2" />
      <circle cx="132" cy="134" r="6" fill="none" stroke="#4a7c59" strokeWidth="2" />
      {/* Mask connector — dashed line from head to mask slot */}
      <line x1="80" y1="20" x2="115" y2="20" stroke="#c77dff" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />
    </g>
  );
}

/* ─── DRAGGABLE EQUIPMENT SLOT (div-based, free positioning) ─── */
function DraggableSlot({ slot, equippedItem, onDrop, onRemove, onMove, onDelete, canvasRef }) {
  const { label, x, y, accent } = slot;
  const hasItem = !!equippedItem;
  const [hovering, setHovering] = useState(false);
  const [dragging, setDragging] = useState(false);
  const dragOffset = useRef({ dx: 0, dy: 0 });
  const color = accent || "#4a7c59";

  const handlePointerDown = (e) => {
    if (e.target.closest("[data-nodrag]")) return;
    e.preventDefault();
    const canvasRect = canvasRef.current?.getBoundingClientRect();
    if (!canvasRect) return;
    dragOffset.current = { dx: e.clientX - canvasRect.left - x, dy: e.clientY - canvasRect.top - y };
    setDragging(true);

    const onPointerMove = (ev) => {
      const cr = canvasRef.current?.getBoundingClientRect();
      if (!cr) return;
      const nx = Math.max(0, Math.min(cr.width - 82, ev.clientX - cr.left - dragOffset.current.dx));
      const ny = Math.max(0, Math.min(cr.height - 38, ev.clientY - cr.top - dragOffset.current.dy));
      onMove(slot.id, nx, ny);
    };
    const onPointerUp = () => {
      setDragging(false);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  };

  return (
    <div
      onPointerDown={handlePointerDown}
      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; setHovering(true); }}
      onDragLeave={() => setHovering(false)}
      onDrop={(e) => { e.preventDefault(); setHovering(false); const itemId = e.dataTransfer.getData("text/plain"); if (itemId) onDrop(itemId, slot.id); }}
      style={{
        position: "absolute", left: x, top: y,
        width: 82, height: hasItem ? 38 : 28, borderRadius: 6,
        border: dragging ? `2px solid ${color}` : hasItem ? `1.5px solid ${color}` : hovering ? `1.5px solid ${color}88` : `1.5px dashed ${color}44`,
        background: dragging ? "rgba(5,10,5,0.85)" : hasItem ? "rgba(5,10,5,0.82)" : hovering ? "rgba(5,10,5,0.75)" : "rgba(5,10,5,0.7)",
        backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        cursor: dragging ? "grabbing" : "grab",
        transition: dragging ? "none" : "all 0.15s",
        padding: 2, overflow: "hidden", zIndex: dragging ? 20 : 10,
        boxShadow: dragging ? `0 4px 16px ${color}44` : hasItem ? `0 0 8px ${color}22` : "none",
        userSelect: "none", touchAction: "none",
      }}
    >
      {hasItem ? (
        <>
          <span style={{ fontSize: "0.5rem", color: accent ? accent + "cc" : "#c8e6c9", fontWeight: 700, textAlign: "center", lineHeight: 1.1, fontFamily: "Arial, sans-serif", maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block", width: "100%", padding: "0 2px" }}>
            {equippedItem.name}
          </span>
          {(equippedItem.enchantments || []).length > 0 && (
            <span style={{ fontSize: "0.35rem", color: accent ? accent + "99" : "#4a7c59cc", textAlign: "center", lineHeight: 1.1, fontFamily: "Arial, sans-serif", maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block", width: "100%", padding: "0 2px" }}>
              {equippedItem.enchantments.map((e) => e.name).join(" · ")}
            </span>
          )}
          <span style={{ fontSize: "0.4rem", color: accent ? accent + "88" : "#7a9e7e", textAlign: "center", lineHeight: 1, fontFamily: "Arial, sans-serif" }}>{label}</span>
          <button data-nodrag="true" onClick={(e) => { e.stopPropagation(); onRemove(slot.id); }}
            style={{ fontSize: "0.4rem", color: "#ce6b6b", cursor: "pointer", background: "none", border: "none", padding: 0, marginTop: 1, fontFamily: "Arial, sans-serif" }}>[unequip]</button>
        </>
      ) : (
        <span style={{ fontSize: "0.45rem", color: hovering ? `${color}cc` : `${color}55`, textAlign: "center", fontFamily: "Arial, sans-serif", textTransform: "uppercase", letterSpacing: "0.05em", transition: "color 0.2s" }}>
          {accent ? "🎭 " : ""}{label}
        </span>
      )}
      {/* Delete slot button — top right corner */}
      <button data-nodrag="true" onClick={(e) => { e.stopPropagation(); onDelete(slot.id); }}
        style={{ position: "absolute", top: -6, right: -6, width: 14, height: 14, borderRadius: "50%", background: "#1a2a1a", border: "1px solid #ce6b6b44", color: "#ce6b6b", fontSize: "0.5rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.4, transition: "opacity 0.2s", lineHeight: 1 }}
        onMouseEnter={(e) => e.currentTarget.style.opacity = 1} onMouseLeave={(e) => e.currentTarget.style.opacity = 0.4}>
        ✕
      </button>
    </div>
  );
}

/* ─── DRAGGABLE INVENTORY ITEM ─── */
function DragItem({ item, isEquipped, equippedSlotLabel }) {
  return (
    <div draggable={!isEquipped} onDragStart={(e) => { e.dataTransfer.setData("text/plain", item.id); e.dataTransfer.effectAllowed = "move"; }}
      className="flex items-center gap-2 px-2 py-1.5 rounded mb-1"
      style={{ background: isEquipped ? "rgba(74,124,89,0.1)" : "rgba(20,30,20,0.5)", border: isEquipped ? "1px solid #4a7c5944" : "1px solid #3a5a4066",
        cursor: isEquipped ? "default" : "grab", opacity: isEquipped ? 0.5 : 1, transition: "all 0.15s" }}>
      <div style={{ width: 6, height: 6, borderRadius: "50%", background: isEquipped ? "#4a7c59" : "#3a5a40", flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "0.7rem", color: "#e8e0d0", fontWeight: 600, fontFamily: "Arial, sans-serif", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.name}</div>
        <div style={{ fontSize: "0.55rem", color: "#7a9e7e", fontFamily: "Arial, sans-serif" }}>{isEquipped ? `Equipped → ${equippedSlotLabel}` : item.stats}</div>
        {(item.enchantments || []).length > 0 && (
          <div style={{ fontSize: "0.5rem", color: "#4a7c59cc", fontFamily: "Arial, sans-serif", marginTop: 1 }}>
            ✦ {item.enchantments.map((e) => e.name).join(" · ")}
          </div>
        )}
      </div>
      {!isEquipped && <span style={{ fontSize: "0.5rem", color: "#3a5a4088", fontFamily: "Arial, sans-serif" }}>DRAG</span>}
    </div>
  );
}

/* ─── BONUS TOOLTIP ─── */
function BonusTooltip({ skillName, bodySlots, inventory, equipBonuses, slotLookup }) {
  const [show, setShow] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const ref = useRef(null);
  const totalBonus = equipBonuses[skillName] || 0;

  /* Find all equipped items contributing to this skill */
  const contributors = useMemo(() => {
    const items = [];
    Object.entries(bodySlots).forEach(([slot, itemId]) => {
      if (!itemId) return;
      const item = inventory.find((i) => i.id === itemId);
      if (!item?.bonuses?.[skillName]) return;
      items.push({ slot, item, bonus: item.bonuses[skillName], note: item.bonusNotes?.[skillName] || "" });
    });
    return items;
  }, [bodySlots, inventory, skillName]);

  const handleMouseEnter = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setPos({ x: rect.left + rect.width / 2, y: rect.top });
    setShow(true);
  };

  if (totalBonus === 0) return null;

  return (
    <span
      ref={ref}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setShow(false)}
      style={{ fontSize: "0.7rem", color: totalBonus > 0 ? "#4a7c59" : "#ce6b6b", fontWeight: 700, minWidth: 28, textAlign: "center", cursor: "help", position: "relative", borderBottom: "1px dotted #4a7c5966" }}
    >
      {fmtMod(totalBonus)}

      {show && contributors.length > 0 && (
        <div style={{
          position: "fixed",
          left: pos.x,
          top: pos.y - 8,
          transform: "translate(-50%, -100%)",
          zIndex: 100,
          background: "linear-gradient(145deg, #1a2e1a, #0d1a0d)",
          border: "1.5px solid #4a7c59",
          borderRadius: 8,
          padding: "8px 12px",
          minWidth: 200,
          maxWidth: 300,
          boxShadow: "0 8px 32px rgba(0,0,0,0.7), 0 0 12px rgba(74,124,89,0.15)",
          pointerEvents: "none",
        }}>
          {/* Arrow */}
          <div style={{
            position: "absolute", bottom: -6, left: "50%", transform: "translateX(-50%)",
            width: 0, height: 0,
            borderLeft: "6px solid transparent", borderRight: "6px solid transparent", borderTop: "6px solid #4a7c59",
          }} />

          <div style={{ fontSize: "0.55rem", color: "#4a7c59", textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 700, marginBottom: 6, fontFamily: "Arial, sans-serif" }}>
            Equipment Bonuses — {skillName}
          </div>

          {contributors.map((c, i) => (
            <div key={i} style={{ marginBottom: i < contributors.length - 1 ? 6 : 0, paddingBottom: i < contributors.length - 1 ? 6 : 0, borderBottom: i < contributors.length - 1 ? "1px solid #3a5a4033" : "none" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#c8e6c9", fontFamily: "Arial, sans-serif" }}>{c.item.name}</span>
                <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#4a7c59", fontFamily: "Arial, sans-serif" }}>{fmtMod(c.bonus)}</span>
              </div>
              <div style={{ fontSize: "0.55rem", color: "#7a9e7e88", fontFamily: "Arial, sans-serif", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                {(slotLookup || BODY_SLOTS)[c.slot]?.label || c.slot}{c.note ? ` · ${c.note}` : ""}
              </div>
              {c.item.stats && (
                <div style={{ fontSize: "0.6rem", color: "#7a9e7e", fontFamily: "Arial, sans-serif", marginTop: 2 }}>{c.item.stats}</div>
              )}
              {c.item.notes && (
                <div style={{ fontSize: "0.55rem", color: "#c8c0b088", fontFamily: "Arial, sans-serif", marginTop: 1, lineHeight: 1.3, fontStyle: "italic" }}>{c.item.notes}</div>
              )}
            </div>
          ))}

          {contributors.length > 1 && (
            <div style={{ marginTop: 6, paddingTop: 4, borderTop: "1px solid #4a7c5933", display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: "0.6rem", color: "#7a9e7e", fontWeight: 700 }}>Total</span>
              <span style={{ fontSize: "0.7rem", color: "#c8e6c9", fontWeight: 700 }}>{fmtMod(totalBonus)}</span>
            </div>
          )}
        </div>
      )}
    </span>
  );
}

/* ─── BLANK CHARACTER STATE FACTORIES ─── */
function makeBlankSkills() {
  const s = {};
  Object.entries(SKILL_GROUPS).forEach(([, data]) => {
    data.skills.forEach((sk) => { s[sk.name] = { base: sk.base, bonus: "", temp: 0, tempNote: "" }; });
  });
  return s;
}
function makeBlankLevelLog() {
  return Array.from({ length: MAX_LEVEL }, (_, i) => ({
    level: i + 1,
    points: [{ skill: "", amount: 1 }, { skill: "", amount: 1 }, { skill: "", amount: 1 }],
    abilityType: "", abilityName: "", abilityDesc: "", abilityNotes: "", locked: false,
  }));
}
const BLANK_INFO = { name: "", player: "", race: "Human", class: "Shaman", level: 1, alignment: "", age: "", height: "", weight: "", sex: "" };
const BLANK_BODY_SLOTS = { head: null, mask: null, armor: null, mainHand: null, offHand: null, hands: null, feet: null, belt: null, other: null };
const BLANK_FOLDERS = [
  { id: "equipment", name: "Equipment", icon: "⚔", locked: true, items: [] },
  { id: "carried",   name: "Carried",   icon: "🧳", locked: false, items: [] },
];

/* ─── ENCHANTMENT HELPERS ─── */
// Parse EC capacity from an item's stats string, e.g. "1H | EC: 6 | DEF: ..." → 6
const parseEC = (stats) => {
  if (!stats) return 0;
  const m = stats.match(/EC:\s*(\d+)/);
  return m ? parseInt(m[1], 10) : 0;
};
// Parse what an enchantment can be applied to from its stats string
// "Armor | EC: 1 | ..." → "armor"  "Weapons | ..." → "weapons"  "Weapons/Armor | ..." → "both"
const parseEnchType = (stats) => {
  if (!stats) return null;
  if (/^Weapons\/Armor/i.test(stats)) return "both";
  if (/^Weapons/i.test(stats)) return "weapons";
  if (/^Armor/i.test(stats)) return "armor";
  return null;
};

/* ─── CHARACTER SELECT SCREEN ─── */
function CharacterSelectScreen({ characters, onCreate, onOpen, onDelete, onImportPDF }) {
  const p = THEME_PRESETS.forest;
  const [confirmDelete, setConfirmDelete] = useState(null);
  const pdfInputRef = useRef(null);

  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(160deg, ${p.bgDark} 0%, ${p.bgMid} 50%, ${p.bgDark} 100%)`, fontFamily: "Arial, sans-serif", color: p.text, display: "flex", flexDirection: "column", alignItems: "center", padding: "48px 24px" }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <div style={{ fontSize: "2rem", marginBottom: 8 }}>📜</div>
        <h1 style={{ fontSize: "1.4rem", fontWeight: 700, color: p.primaryLight, letterSpacing: "0.15em", textTransform: "uppercase", margin: 0 }}>Character Sheets</h1>
        <p style={{ fontSize: "0.7rem", color: p.primaryMid, letterSpacing: "0.1em", marginTop: 6 }}>Select a character to continue, or create a new one</p>
      </div>

      {/* Character grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16, width: "100%", maxWidth: 900 }}>
        {/* Existing character cards */}
        {characters.map((c) => (
          <div key={c.id} style={{ position: "relative", cursor: "pointer", borderRadius: 10, border: `1.5px solid ${p.primaryDim}`, background: `linear-gradient(145deg, ${p.bgCard}, ${p.bgLight})`, padding: "20px 16px", transition: "all 0.2s", boxShadow: `0 4px 16px rgba(0,0,0,0.4)` }}
            onClick={() => onOpen(c.id)}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = p.primary; e.currentTarget.style.boxShadow = `0 6px 24px rgba(0,0,0,0.5), 0 0 16px ${p.primary}33`; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = p.primaryDim; e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.4)"; }}>
            {/* Class/race badge */}
            <div style={{ fontSize: "0.55rem", color: p.primaryMid, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
              {c.race} · {c.class_}
            </div>
            {/* Name */}
            <div style={{ fontSize: "1.1rem", fontWeight: 700, color: p.primaryLight, lineHeight: 1.2, marginBottom: 10, wordBreak: "break-word" }}>
              {c.name || "Unnamed"}
            </div>
            {/* Level badge */}
            <div style={{ display: "inline-block", fontSize: "0.6rem", fontWeight: 700, color: p.primary, background: `${p.primary}22`, border: `1px solid ${p.primary}44`, borderRadius: 4, padding: "2px 8px", letterSpacing: "0.08em" }}>
              Level {c.level}
            </div>
            {/* Delete button */}
            {confirmDelete === c.id ? (
              <div style={{ position: "absolute", top: 8, right: 8, display: "flex", gap: 4 }} onClick={(e) => e.stopPropagation()}>
                <button onClick={() => { onDelete(c.id); setConfirmDelete(null); }}
                  style={{ fontSize: "0.55rem", background: p.danger, color: "#fff", border: "none", borderRadius: 4, padding: "2px 6px", cursor: "pointer" }}>Delete</button>
                <button onClick={() => setConfirmDelete(null)}
                  style={{ fontSize: "0.55rem", background: "transparent", color: p.primaryMid, border: `1px solid ${p.primaryDim}`, borderRadius: 4, padding: "2px 6px", cursor: "pointer" }}>Cancel</button>
              </div>
            ) : (
              <button onClick={(e) => { e.stopPropagation(); setConfirmDelete(c.id); }}
                style={{ position: "absolute", top: 8, right: 8, fontSize: "0.6rem", color: p.primaryDim, background: "none", border: "none", cursor: "pointer", opacity: 0.5, transition: "opacity 0.15s" }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = 1} onMouseLeave={(e) => e.currentTarget.style.opacity = 0.5}>🗑</button>
            )}
          </div>
        ))}

        {/* New character card */}
        <div onClick={onCreate} style={{ cursor: "pointer", borderRadius: 10, border: `1.5px dashed ${p.primaryDim}`, background: "transparent", padding: "20px 16px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 120, transition: "all 0.2s", gap: 8 }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = p.primary; e.currentTarget.style.background = `${p.primary}0d`; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = p.primaryDim; e.currentTarget.style.background = "transparent"; }}>
          <div style={{ fontSize: "1.4rem", color: p.primaryDim }}>+</div>
          <div style={{ fontSize: "0.7rem", color: p.primaryMid, textTransform: "uppercase", letterSpacing: "0.1em" }}>New Character</div>
        </div>

        {/* Import from PDF card */}
        <div onClick={() => pdfInputRef.current?.click()} style={{ cursor: "pointer", borderRadius: 10, border: `1.5px dashed ${p.primaryDim}`, background: "transparent", padding: "20px 16px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 120, transition: "all 0.2s", gap: 8 }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = p.primary; e.currentTarget.style.background = `${p.primary}0d`; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = p.primaryDim; e.currentTarget.style.background = "transparent"; }}>
          <div style={{ fontSize: "1.2rem", color: p.primaryDim }}>📄</div>
          <div style={{ fontSize: "0.7rem", color: p.primaryMid, textTransform: "uppercase", letterSpacing: "0.1em" }}>Import from PDF</div>
          <div style={{ fontSize: "0.55rem", color: p.primaryDim, textAlign: "center" }}>Upload an existing character sheet</div>
          <input ref={pdfInputRef} type="file" accept=".pdf" style={{ display: "none" }}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) { e.target.value = ""; onImportPDF(f); } }} />
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════ */
function CharacterSheet({ characterId, onBack }) {
  const { data: character, isLoading, updateField } = useCharacter(characterId);

  /* ─── UI-ONLY STATE (not persisted) ─── */
  const [tab, setTab] = useState("skills");
  const [showThemeEditor, setShowThemeEditor] = useState(false);
  const [itemsCategory, setItemsCategory] = useState(ITEM_CATALOG[0].category);
  const [itemsSearch, setItemsSearch] = useState("");

  /* ─── READ FROM CONVEX (with fallbacks while loading) ─── */
  const info = character?.info ?? BLANK_CHARACTER.info;
  const racialStats = character?.racialStats ?? {};
  const initialTotal = character?.initialTotal ?? 16;
  const skills = character?.skills ?? BLANK_CHARACTER.skills;
  const hp = character?.hp ?? BLANK_CHARACTER.hp;
  const hpMax = hp.max;
  const hpCurrent = hp.current;
  const hpTemp = hp.temp;
  const inventory = character?.inventory ?? [];
  const inventoryRef = useRef(inventory);
  inventoryRef.current = inventory;
  const slotPositions = character?.slotPositions ?? DEFAULT_SLOT_POSITIONS;
  const bodySlots = character?.bodySlots ?? BLANK_CHARACTER.bodySlots;
  const slotPositionsRef = useRef(slotPositions);
  slotPositionsRef.current = slotPositions;
  const bodySlotsRef = useRef(bodySlots);
  bodySlotsRef.current = bodySlots;
  const inventoryFolders = character?.inventoryFolders ?? BLANK_CHARACTER.inventoryFolders;
  const currency = character?.currency ?? BLANK_CHARACTER.currency;
  const abilities = character?.abilities ?? BLANK_CHARACTER.abilities;
  const customAbilities = character?.customAbilities ?? [];
  const charNotes = character?.charNotes ?? "";
  const sessionNotes = character?.sessionNotes ?? [];
  const levelLog = character?.levelLog ?? BLANK_CHARACTER.levelLog;
  const theme = character?.theme ?? THEME_PRESETS.forest;
  const textStyles = character?.textStyles ?? DEFAULT_TEXT_STYLES;

  const t = theme; /* shorthand */

  /* ─── PERSISTENCE HELPERS ─── */
  const setInfo = (newInfo) => updateField("info", newInfo);
  const setRacialStats = (v) => updateField("racialStats", v);
  const setSkills = (v) => {
    if (typeof v === "function") updateField("skills", v(skills));
    else updateField("skills", v);
  };
  const setHpMax = (v) => updateField("hp", { ...hp, max: v });
  const setHpCurrent = (v) => updateField("hp", { ...hp, current: v });
  const setHpTemp = (v) => updateField("hp", { ...hp, temp: v });
  const setInventory = (v) => {
    if (typeof v === "function") updateField("inventory", v(inventoryRef.current));
    else updateField("inventory", v);
  };
  const setSlotPositions = (v) => {
    if (typeof v === "function") updateField("slotPositions", v(slotPositions));
    else updateField("slotPositions", v);
  };
  const setBodySlots = (v) => {
    if (typeof v === "function") updateField("bodySlots", v(bodySlots));
    else updateField("bodySlots", v);
  };
  const setInventoryFolders = (v) => {
    if (typeof v === "function") updateField("inventoryFolders", v(inventoryFolders));
    else updateField("inventoryFolders", v);
  };
  const setCurrency = (v) => {
    if (typeof v === "function") updateField("currency", v(currency));
    else updateField("currency", v);
  };
  const setAbilities = (v) => {
    if (typeof v === "function") updateField("abilities", v(abilities));
    else updateField("abilities", v);
  };
  const setCharNotes = (v) => updateField("charNotes", v);
  const setSessionNotes = (v) => {
    if (typeof v === "function") updateField("sessionNotes", v(sessionNotes));
    else updateField("sessionNotes", v);
  };
  const setLevelLog = (v) => {
    if (typeof v === "function") updateField("levelLog", v(levelLog));
    else updateField("levelLog", v);
  };
  const setTheme = (v) => updateField("theme", v);
  const setTextStyles = (v) => {
    if (typeof v === "function") updateField("textStyles", v(textStyles));
    else updateField("textStyles", v);
  };
  const setTextStyle = (cat, field, val) => setTextStyles((p) => ({ ...p, [cat]: { ...p[cat], [field]: val } }));
  const setThemeColor = (key, value) => setTheme({ ...theme, [key]: value });
  const [newItemForm, setNewItemForm] = useState({ name: "", stats: "", notes: "", bonusSkill: "", bonusValue: 0, bonusNote: "", category: "misc", ecCap: 0 });
  const [inventoryTab, setInventoryTab] = useState("all");
  const [enchantPicker, setEnchantPicker] = useState(null); // { enchantment, cost, fillsEC, enchType }
  const [enchantTypeFilter, setEnchantTypeFilter] = useState("all"); // "all" | "armor" | "weapons" | "both"
  const [bgImage, setBgImage] = useState(null);
  const [newSlotLabel, setNewSlotLabel] = useState("");
  const canvasRef = useRef(null);
  const slotIdCounter = useRef(20);

  const handleBgUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setBgImage(ev.target.result);
    reader.readAsDataURL(file);
  };

  const moveSlot = useCallback((slotId, nx, ny) => {
    updateField("slotPositions", slotPositionsRef.current.map((s) => s.id === slotId ? { ...s, x: Math.round(nx), y: Math.round(ny) } : s));
  }, []);

  const addSlot = () => {
    const label = newSlotLabel.trim() || `Slot ${slotPositions.length + 1}`;
    const id = "slot_" + slotIdCounter.current++;
    setSlotPositions((prev) => [...prev, { id, label, x: 110, y: 140, accent: null }]);
    setBodySlots((prev) => ({ ...prev, [id]: null }));
    setNewSlotLabel("");
  };

  const deleteSlot = useCallback((slotId) => {
    setSlotPositions((prev) => prev.filter((s) => s.id !== slotId));
    setBodySlots((prev) => { const next = { ...prev }; delete next[slotId]; return next; });
  }, []);

  /* Also keep BODY_SLOTS in sync for tooltip lookups */
  const bodySlotLookup = useMemo(() => {
    const m = {};
    slotPositions.forEach((s) => { m[s.id] = { label: s.label, cx: s.x + 41, cy: s.y + 14 }; });
    return m;
  }, [slotPositions]);

  const equipItem = useCallback((itemId, slot) => {
    const next = { ...bodySlotsRef.current };
    Object.keys(next).forEach((s) => { if (next[s] === itemId) next[s] = null; });
    next[slot] = itemId;
    updateField("bodySlots", next);
  }, []);

  const unequipItem = useCallback((slot) => { setBodySlots((prev) => ({ ...prev, [slot]: null })); }, []);

  /* Compute total equipment bonuses */
  const equipBonuses = useMemo(() => {
    const totals = {};
    Object.values(bodySlots).forEach((itemId) => {
      if (!itemId) return;
      const item = inventory.find((i) => i.id === itemId);
      if (!item?.bonuses) return;
      Object.entries(item.bonuses).forEach(([skill, val]) => { totals[skill] = (totals[skill] || 0) + val; });
    });
    return totals;
  }, [bodySlots, inventory]);

  const getEquippedSlot = (itemId) => { for (const [slot, id] of Object.entries(bodySlots)) { if (id === itemId) return slot; } return null; };
  const equipableItems = inventory.filter((i) => i.category === "weapons" || i.category === "armor");
  const getSlotLabel = (slotId) => { const s = slotPositions.find((p) => p.id === slotId); return s?.label || slotId; };

  /* ─── Other State ─── */
  const [invActiveFolder, setInvActiveFolder] = useState("equipment");
  const [newFolderName, setNewFolderName] = useState("");
  const [newInvItem, setNewInvItem] = useState({ name: "", notes: "", qty: 1 });
  const invFolderIdCounter = useRef(10);
  const invItemIdCounter = useRef(100);

  const addFolder = () => {
    if (!newFolderName.trim()) return;
    const id = "folder_" + invFolderIdCounter.current++;
    setInventoryFolders((prev) => [...prev, { id, name: newFolderName.trim(), icon: "📦", locked: false, items: [] }]);
    setNewFolderName("");
    setInvActiveFolder(id);
  };

  const deleteFolder = (folderId) => {
    if (folderId === "equipment") return;
    setInventoryFolders((prev) => prev.filter((f) => f.id !== folderId));
    if (invActiveFolder === folderId) setInvActiveFolder("equipment");
  };

  const renameFolder = (folderId, newName) => {
    setInventoryFolders((prev) => prev.map((f) => f.id === folderId ? { ...f, name: newName } : f));
  };

  const addInvItem = (folderId) => {
    if (!newInvItem.name.trim()) return;
    const item = { id: "inv_" + invItemIdCounter.current++, name: newInvItem.name, notes: newInvItem.notes, qty: newInvItem.qty || 1 };
    setInventoryFolders((prev) => prev.map((f) => f.id === folderId ? { ...f, items: [...f.items, item] } : f));
    setNewInvItem({ name: "", notes: "", qty: 1 });
  };

  const removeInvItem = (folderId, itemId) => {
    setInventoryFolders((prev) => prev.map((f) => f.id === folderId ? { ...f, items: f.items.filter((i) => i.id !== itemId) } : f));
  };

  const moveInvItem = (fromFolderId, itemId, toFolderId) => {
    let movedItem = null;
    setInventoryFolders((prev) => {
      const next = prev.map((f) => {
        if (f.id === fromFolderId) {
          movedItem = f.items.find((i) => i.id === itemId);
          return { ...f, items: f.items.filter((i) => i.id !== itemId) };
        }
        return f;
      });
      if (!movedItem) return next;
      return next.map((f) => f.id === toFolderId ? { ...f, items: [...f.items, movedItem] } : f);
    });
  };

  const updateInvItem = (folderId, itemId, field, value) => {
    setInventoryFolders((prev) => prev.map((f) => f.id === folderId ? { ...f, items: f.items.map((i) => i.id === itemId ? { ...i, [field]: value } : i) } : f));
  };

  const updateInventoryItem = useCallback((itemId, field, value) => {
    setInventory((prev) => prev.map((i) => i.id === itemId ? { ...i, [field]: value } : i));
  }, []);

  const deleteInventoryItem = useCallback((itemId) => {
    setInventory((prev) => prev.filter((i) => i.id !== itemId));
    const next = { ...bodySlotsRef.current };
    Object.keys(next).forEach((s) => { if (next[s] === itemId) next[s] = null; });
    updateField("bodySlots", next);
  }, []);

  const removeEnchantment = useCallback((itemId, enchId) => {
    setInventory((prev) => prev.map((i) =>
      i.id === itemId ? { ...i, enchantments: (i.enchantments || []).filter((e) => e.id !== enchId) } : i
    ));
  }, []);

  const [notesSubTab, setNotesSubTab] = useState("character");
  const [sessionSearch, setSessionSearch] = useState("");
  const [expandedSession, setExpandedSession] = useState(null);
  const nextSessionId = useRef(2);

  const addSession = () => {
    const id = nextSessionId.current++;
    const today = new Date().toISOString().slice(0, 10);
    setSessionNotes((prev) => [{ id, title: `Session ${prev.length}`, date: today, content: "" }, ...prev]);
    setExpandedSession(id);
  };

  const updateSession = (id, field, value) => {
    setSessionNotes((prev) => prev.map((s) => s.id === id ? { ...s, [field]: value } : s));
  };

  const deleteSession = (id) => {
    setSessionNotes((prev) => prev.filter((s) => s.id !== id));
    if (expandedSession === id) setExpandedSession(null);
  };

  /* Search across all session notes — returns sessions with highlighted match info */
  const searchResults = useMemo(() => {
    if (!sessionSearch.trim()) return null;
    const q = sessionSearch.toLowerCase();
    const results = [];
    sessionNotes.forEach((s) => {
      const matches = [];
      if (s.title.toLowerCase().includes(q)) matches.push({ field: "title", text: s.title });
      if (s.date.toLowerCase().includes(q)) matches.push({ field: "date", text: s.date });
      const content = s.content.toLowerCase();
      const idx = content.indexOf(q);
      if (idx !== -1) {
        const start = Math.max(0, idx - 40);
        const end = Math.min(s.content.length, idx + q.length + 40);
        const snippet = (start > 0 ? "..." : "") + s.content.slice(start, end) + (end < s.content.length ? "..." : "");
        matches.push({ field: "content", text: snippet, matchStart: idx - start + (start > 0 ? 3 : 0), matchLen: q.length });
      }
      if (matches.length > 0) results.push({ session: s, matches });
    });
    return results;
  }, [sessionSearch, sessionNotes]);

  /* ─── LEVEL LOG ─── */
  // MAX_LEVEL and POINTS_PER_LEVEL imported from data

  const [levelFilter, setLevelFilter] = useState("all"); /* "all", "past", "future" */

  const updateLevel = (lvl, field, value) => {
    setLevelLog((prev) => prev.map((l) => l.level === lvl ? { ...l, [field]: value } : l));
  };

  const updateLevelPoint = (lvl, pointIdx, field, value) => {
    setLevelLog((prev) => prev.map((l) => {
      if (l.level !== lvl) return l;
      const points = [...l.points];
      points[pointIdx] = { ...points[pointIdx], [field]: value };
      return { ...l, points };
    }));
  };

  const addLevelPoint = (lvl) => {
    setLevelLog((prev) => prev.map((l) => l.level === lvl ? { ...l, points: [...l.points, { skill: "", amount: 1 }] } : l));
  };

  const removeLevelPoint = (lvl, pointIdx) => {
    setLevelLog((prev) => prev.map((l) => {
      if (l.level !== lvl) return l;
      const points = l.points.filter((_, i) => i !== pointIdx);
      return { ...l, points };
    }));
  };

  const levelTotalPoints = useMemo(() => {
    let total = 0;
    levelLog.forEach((l) => { if (l.level <= info.level) l.points.forEach((p) => { total += (p.amount || 0); }); });
    return total;
  }, [levelLog, info.level]);

  /* Compute skill bonuses from all level log entries up to current level */
  const levelSkillBonuses = useMemo(() => {
    const bonuses = {};
    levelLog.forEach((l) => {
      if (l.level > info.level) return;
      l.points.forEach((p) => {
        if (p.skill && p.amount) {
          bonuses[p.skill] = (bonuses[p.skill] || 0) + p.amount;
        }
      });
    });
    return bonuses;
  }, [levelLog, info.level]);

  /* Handle level change: update level, apply skill points + ability effects, update lock state */
  const handleLevelChange = (newLevel) => {
    const oldLevel = info.level;
    setInfo({ ...info, level: newLevel });

    /* Update lock state on level cards */
    setLevelLog((prev) => prev.map((l) => ({
      ...l,
      locked: l.level <= newLevel ? (l.level <= oldLevel ? l.locked : true) : false,
    })));

    /* Apply level skill bonuses + ability effects to skills */
    setSkills((prev) => {
      const next = { ...prev };
      /* Reset all skills to SKILL_GROUPS base */
      Object.entries(SKILL_GROUPS).forEach(([, data]) => {
        data.skills.forEach((sk) => {
          next[sk.name] = { ...next[sk.name], base: sk.base };
        });
      });

      /* Track abilities taken and upgrade counts */
      const abilityUpgradeCounts = {};

      levelLog.forEach((l) => {
        if (l.level > newLevel) return;

        /* Apply skill point allocations */
        l.points.forEach((p) => {
          if (p.skill && p.amount && next[p.skill]) {
            next[p.skill] = { ...next[p.skill], base: next[p.skill].base + p.amount };
          }
        });

        /* Track abilities and upgrades */
        if (l.abilityName) {
          if (l.abilityType === "upgrade") {
            const baseName = l.abilityName.replace(/^⬆ /, "");
            abilityUpgradeCounts[baseName] = (abilityUpgradeCounts[baseName] || 0) + 1;
          } else {
            if (!(l.abilityName in abilityUpgradeCounts)) {
              abilityUpgradeCounts[l.abilityName] = 0;
            }
          }
        }
      });

      /* Apply ability skill effects from ABILITY_SKILL_EFFECTS */
      Object.entries(abilityUpgradeCounts).forEach(([abilName, upgradeCount]) => {
        const effects = ABILITY_SKILL_EFFECTS[abilName];
        if (!effects) return;

        /* Upgrades REPLACE base values, not stack on top */
        const finalBonuses = { ...effects.base };
        for (let u = 0; u < upgradeCount && u < effects.upgrades.length; u++) {
          Object.entries(effects.upgrades[u]).forEach(([skill, val]) => {
            finalBonuses[skill] = val;
          });
        }

        /* Add final bonuses to skills */
        Object.entries(finalBonuses).forEach(([skill, val]) => {
          if (next[skill]) {
            next[skill] = { ...next[skill], base: next[skill].base + val };
          }
        });
      });

      return next;
    });

    /* Rebuild level-sourced abilities (same pattern as skills) */
    setAbilities((prev) => {
      const manual = prev.filter((a) => !a._levelSource);
      const fromLevels = [];
      levelLog.forEach((l) => {
        if (l.level > newLevel) return;
        if (!l.abilityName || l.abilityType === "upgrade") return;
        /* Preserve used count if this level's ability already exists */
        const existing = prev.find((a) => a._levelSource === l.level);
        fromLevels.push({
          name: l.abilityName,
          cost: "—",
          desc: l.abilityDesc || "",
          used: existing?.used ?? 0,
          maxUses: existing?.maxUses ?? 1,
          mode: existing?.mode ?? "active",
          _levelSource: l.level,
        });
      });
      return [...manual, ...fromLevels];
    });
  };

  const setInfo_ = (k, v) => setInfo({ ...info, [k]: v });
  const setSkill = (name, field, val) => setSkills((p) => ({ ...p, [name]: { ...p[name], [field]: val } }));
  const healthTotal = useMemo(() => (skills["Health (x4)"]?.base || 0) * 4, [skills]);
  const totalHp = hpMax + hpTemp;
  const hpPct = totalHp > 0 ? Math.max(0, Math.min(100, ((hpCurrent + hpTemp) / totalHp) * 100)) : 0;
  const hpColor = hpPct > 60 ? "#4a7c59" : hpPct > 30 ? "#b8860b" : "#8b2a2a";

  const addNewItem = () => {
    if (!newItemForm.name.trim()) return;
    const id = "custom_" + Date.now();
    const bonuses = {};
    const bonusNotes = {};
    if (newItemForm.bonusSkill && newItemForm.bonusValue) {
      bonuses[newItemForm.bonusSkill] = newItemForm.bonusValue;
      if (newItemForm.bonusNote) bonusNotes[newItemForm.bonusSkill] = newItemForm.bonusNote;
    }
    const ecCap = newItemForm.ecCap > 0 ? newItemForm.ecCap : parseEC(newItemForm.stats);
    setInventory((prev) => [...prev, { id, name: newItemForm.name, stats: newItemForm.stats, notes: newItemForm.notes, category: newItemForm.category || "misc", bonuses, bonusNotes, ecCap, enchantments: [] }]);
    setNewItemForm({ name: "", stats: "", notes: "", bonusSkill: "", bonusValue: 0, bonusNote: "", category: "misc", ecCap: 0 });
  };

  /* ─── Ability drag reordering ─── */
  const [dragAbilityIdx, setDragAbilityIdx] = useState(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);

  const handleAbilityDragStart = (origIdx, e) => {
    setDragAbilityIdx(origIdx);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", "ability");
  };

  const handleAbilityDragOver = (origIdx, e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (origIdx !== dragOverIdx) setDragOverIdx(origIdx);
  };

  const handleAbilityDrop = (targetOrigIdx) => {
    if (dragAbilityIdx === null || dragAbilityIdx === targetOrigIdx) {
      setDragAbilityIdx(null);
      setDragOverIdx(null);
      return;
    }
    setAbilities((prev) => {
      const arr = [...prev];
      const [moved] = arr.splice(dragAbilityIdx, 1);
      arr.splice(targetOrigIdx, 0, moved);
      return arr;
    });
    setDragAbilityIdx(null);
    setDragOverIdx(null);
  };

  const handleAbilityDragEnd = () => {
    setDragAbilityIdx(null);
    setDragOverIdx(null);
  };

  const toggleAbilityMode = (idx) => {
    setAbilities((prev) => {
      const arr = [...prev];
      arr[idx] = { ...arr[idx], mode: arr[idx].mode === "passive" ? "active" : "passive" };
      return arr;
    });
  };

  /* Sorted: actives first (in their current order), passives last (in their current order) */
  const sortedAbilities = useMemo(() => {
    const actives = abilities.map((a, i) => ({ ...a, _origIdx: i })).filter((a) => a.mode !== "passive");
    const passivesList = abilities.map((a, i) => ({ ...a, _origIdx: i })).filter((a) => a.mode === "passive");
    return [...actives, ...passivesList];
  }, [abilities]);

  const allSkillNames = useMemo(() => {
    const names = [];
    Object.values(SKILL_GROUPS).forEach((g) => g.skills.forEach((s) => names.push(s.name)));
    return names;
  }, []);

  if (isLoading || !character) {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #0d1a0d 0%, #111a11 50%, #0d1a0d 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#7a9e7e", fontSize: "1rem", letterSpacing: "0.15em" }}>Loading character...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(160deg, ${t.bgDark} 0%, ${t.bgMid} 50%, ${t.bgDark} 100%)`, fontFamily: "Arial, sans-serif", color: t.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;600&display=swap');
        :root {
          --ty-heading-size: ${textStyles.heading.size}rem;
          --ty-heading-color: ${textStyles.heading.color || t.primaryMid};
          --ty-label-size: ${textStyles.label.size}rem;
          --ty-label-color: ${textStyles.label.color || t.primaryMid};
          --ty-body-size: ${textStyles.body.size}rem;
          --ty-body-color: ${textStyles.body.color || t.text};
          --ty-value-size: ${textStyles.value.size}rem;
          --ty-value-color: ${textStyles.value.color || t.primaryLight};
          --ty-meta-size: ${textStyles.meta.size}rem;
          --ty-meta-color: ${textStyles.meta.color || t.primaryDim};
        }
        * { box-sizing: border-box; }
        input[type=number]::-webkit-inner-spin-button, input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        input[type=number] { -moz-appearance: textfield; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: ${t.primaryDim}1a; }
        ::-webkit-scrollbar-thumb { background: ${t.primaryDim}; border-radius: 3px; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .tab-content { animation: fadeIn 0.3s ease-out; }
        .ability-row:hover { background: ${t.primary}14 !important; }
        .scan-line { position: absolute; top: 0; left: 0; right: 0; bottom: 0; pointer-events: none;
          background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.06) 2px, rgba(0,0,0,0.06) 4px); }
      `}</style>

      {/* HEADER */}
      <div className="px-4 py-3 flex items-center justify-between" style={{ background: `linear-gradient(135deg, ${t.primaryDark} 0%, ${t.primaryDim} 50%, ${t.primaryDark} 100%)`, borderBottom: `2px solid ${t.primary}`, boxShadow: "0 4px 20px rgba(0,0,0,0.6)" }}>
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="cursor-pointer px-2 py-1 rounded"
            style={{ background: "transparent", color: t.primaryMid, border: `1px solid ${t.primaryDim}`, fontSize: "0.6rem", fontFamily: "Arial, sans-serif" }}>
            ← Characters
          </button>
          <div style={{ width: 36, height: 36, borderRadius: "50%", border: `2px solid ${t.primary}`, background: `radial-gradient(circle, ${t.primaryDim}, ${t.primaryDark})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem" }}>🌿</div>
          <div>
            <h1 style={{ fontFamily: "Arial, sans-serif", color: t.primaryMid, fontSize: "1rem", letterSpacing: "0.15em", margin: 0, fontWeight: 700 }}>{info.name || "Character Sheet"}</h1>
            <span style={{ fontFamily: "Arial, sans-serif", color: t.primary + "99", fontSize: "0.55rem", letterSpacing: "0.2em", textTransform: "uppercase" }}>Level {info.level} {info.race} {info.class_}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowThemeEditor(!showThemeEditor)} className="cursor-pointer px-2 py-1 rounded"
            style={{ background: showThemeEditor ? t.primary : "transparent", color: showThemeEditor ? t.primaryLight : t.primaryMid, border: `1px solid ${t.primary}66`, fontSize: "0.6rem", fontFamily: "Arial, sans-serif", transition: "all 0.2s" }}>
            🎨 Theme
          </button>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: t.primary, fontSize: "0.55rem", letterSpacing: "0.15em", textTransform: "uppercase" }}>{info.alignment}</div>
            <div style={{ color: t.primaryMid + "88", fontSize: "0.7rem" }}>Player: {info.player}</div>
          </div>
          <SignOutButton>
            <button className="cursor-pointer px-2 py-1 rounded"
              style={{ background: "transparent", color: t.primaryMid, border: `1px solid ${t.primaryDim}`, fontSize: "0.6rem", fontFamily: "Arial, sans-serif" }}>
              Sign Out
            </button>
          </SignOutButton>
        </div>
      </div>

      {/* BODY */}
      <div className="max-w-5xl mx-auto my-3 rounded-xl p-4 overflow-auto" style={{ background: `linear-gradient(145deg, ${t.bgLight}, ${t.bgCard}, ${t.bgLight})`, boxShadow: `0 8px 40px rgba(0,0,0,0.6), inset 0 0 80px ${t.primary}08`, border: `1.5px solid ${t.primaryDark}`, maxHeight: "calc(100vh - 75px)" }}>

        {/* ─── THEME EDITOR (collapsible) ─── */}
        {showThemeEditor && (
          <div className="mb-4 rounded-lg p-4" style={{ background: `${t.bgDark}cc`, border: `1.5px solid ${t.primary}44`, animation: "fadeIn 0.2s ease-out" }}>
            <div className="flex items-center justify-between mb-3">
              <h3 style={{ fontSize: "0.75rem", fontWeight: 700, color: t.primaryLight, textTransform: "uppercase", letterSpacing: "0.12em", margin: 0, fontFamily: "Arial, sans-serif" }}>🎨 Theme Editor</h3>
              <button onClick={() => setShowThemeEditor(false)} className="cursor-pointer" style={{ color: t.primaryMid, fontSize: "0.7rem", background: "none", border: "none" }}>✕ Close</button>
            </div>

            {/* Presets */}
            <div className="mb-3">
              <div style={{ fontSize: "0.55rem", color: t.primaryMid, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6, fontWeight: 700 }}>Presets</div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(THEME_PRESETS).map(([key, preset]) => (
                  <button key={key} onClick={() => setTheme(preset)} className="cursor-pointer px-3 py-1.5 rounded flex items-center gap-2"
                    style={{
                      background: theme.name === preset.name ? `${preset.primary}33` : "rgba(0,0,0,0.3)",
                      border: theme.name === preset.name ? `1.5px solid ${preset.primary}` : "1.5px solid transparent",
                      fontSize: "0.6rem", color: preset.primaryLight, fontFamily: "Arial, sans-serif", transition: "all 0.15s",
                    }}>
                    <div className="flex gap-0.5">
                      <span style={{ width: 10, height: 10, borderRadius: 2, background: preset.primary, display: "inline-block" }} />
                      <span style={{ width: 10, height: 10, borderRadius: 2, background: preset.primaryDark, display: "inline-block" }} />
                      <span style={{ width: 10, height: 10, borderRadius: 2, background: preset.accent1, display: "inline-block" }} />
                    </div>
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Individual color pickers */}
            <div style={{ fontSize: "0.55rem", color: t.primaryMid, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6, fontWeight: 700 }}>Custom Colors</div>
            <div className="grid grid-cols-3 gap-x-4 gap-y-2" style={{ maxWidth: 600 }}>
              {THEME_FIELDS.map((f) => (
                <div key={f.key} className="flex items-center gap-2">
                  <input type="color" value={t[f.key]} onChange={(e) => setThemeColor(f.key, e.target.value)}
                    className="cursor-pointer" style={{ width: 24, height: 24, border: "none", borderRadius: 4, padding: 0, background: "transparent" }} />
                  <div>
                    <div style={{ fontSize: "0.55rem", color: t.primaryMid, fontFamily: "Arial, sans-serif" }}>{f.label}</div>
                    <div style={{ fontSize: "0.5rem", color: t.primaryDim, fontFamily: "'Fira Code', monospace" }}>{t[f.key]}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Typography editor */}
            <div style={{ marginTop: 16, paddingTop: 12, borderTop: `1px solid ${t.primaryDim}33` }}>
              <div style={{ fontSize: "0.55rem", color: t.primaryMid, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8, fontWeight: 700 }}>Typography</div>
              <div style={{ display: "grid", gridTemplateColumns: "120px 1fr 28px", gap: "2px 12px", alignItems: "center", marginBottom: 4 }}>
                <span style={{ fontSize: "0.5rem", color: t.primaryDim, textTransform: "uppercase", letterSpacing: "0.08em" }}>Style</span>
                <span style={{ fontSize: "0.5rem", color: t.primaryDim, textTransform: "uppercase", letterSpacing: "0.08em" }}>Size</span>
                <span style={{ fontSize: "0.5rem", color: t.primaryDim, textTransform: "uppercase", letterSpacing: "0.08em" }}>Color</span>
              </div>
              {[
                { key: "heading", label: "Headings",   desc: "Section titles" },
                { key: "label",   label: "Labels",     desc: "Field & column headers" },
                { key: "body",    label: "Body",       desc: "Skill names, descriptions" },
                { key: "value",   label: "Values",     desc: "Numbers & stats" },
                { key: "meta",    label: "Meta",       desc: "Costs, notes, small text" },
              ].map(({ key, label, desc }) => {
                const defaultColor = { heading: t.primaryMid, label: t.primaryMid, body: t.text, value: t.primaryLight, meta: t.primaryDim }[key];
                const hasOverride = !!textStyles[key].color;
                return (
                  <div key={key} style={{ display: "grid", gridTemplateColumns: "120px 1fr 28px", gap: "0 12px", alignItems: "center", padding: "5px 0", borderBottom: `1px solid ${t.primaryDim}22` }}>
                    {/* Name + live preview */}
                    <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                      <div>
                        <div style={{ fontSize: "0.6rem", color: t.primaryLight, fontWeight: 600, fontFamily: "Arial, sans-serif" }}>{label}</div>
                        <div style={{ fontSize: "0.5rem", color: t.primaryDim, fontStyle: "italic", fontFamily: "Arial, sans-serif" }}>{desc}</div>
                      </div>
                      <span style={{ fontSize: `${textStyles[key].size}rem`, color: textStyles[key].color || defaultColor, marginLeft: "auto", opacity: 0.7 }}>Aa</span>
                    </div>
                    {/* Size slider + value */}
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <input type="range" min={0.4} max={1.5} step={0.05}
                        value={textStyles[key].size}
                        onChange={(e) => setTextStyle(key, "size", +e.target.value)}
                        style={{ flex: 1, accentColor: t.primary }} />
                      <span style={{ fontSize: "0.55rem", color: t.primaryMid, width: 38, textAlign: "right", fontFamily: "'Fira Code', monospace", flexShrink: 0 }}>{textStyles[key].size.toFixed(2)}rem</span>
                    </div>
                    {/* Color picker + reset */}
                    <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                      <input type="color" value={textStyles[key].color || defaultColor}
                        onChange={(e) => setTextStyle(key, "color", e.target.value)}
                        title={hasOverride ? "Custom color set" : "Using theme default"}
                        style={{ width: 20, height: 20, border: hasOverride ? `2px solid ${t.accent3}` : `1px solid ${t.primaryDim}44`, borderRadius: 4, padding: 0, background: "transparent", cursor: "pointer", flexShrink: 0 }} />
                      {hasOverride && (
                        <button onClick={() => setTextStyle(key, "color", "")} title="Reset to theme default"
                          style={{ fontSize: "0.55rem", color: t.primaryDim, background: "none", border: "none", cursor: "pointer", padding: 0, lineHeight: 1 }}>↺</button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* BIO */}
        <Section t={t}>
          <div className="grid grid-cols-4 gap-3">
            <Field t={t} label="Character Name" value={info.name} onChange={(v) => setInfo_("name", v)} />
            <Field t={t} label="Player" value={info.player} onChange={(v) => setInfo_("player", v)} />
            <div className="flex flex-col">
              <label style={{ fontFamily: "Arial, sans-serif", fontSize: "0.6rem", color: t.primaryMid, letterSpacing: "0.08em", textTransform: "uppercase" }}>Race</label>
              <select value={info.race} onChange={(e) => {
                const newRace = e.target.value;
                setInfo_("race", newRace);
                const rd = RACE_DATA[newRace];
                if (rd?.stats) {
                  const newStats = {};
                  Object.entries(rd.stats).forEach(([k, v]) => { if (v !== 0) newStats[k] = v; });
                  setRacialStats(newStats);
                }
              }}
                style={{ background: "transparent", borderBottom: `2px solid ${t.primaryDim}`, color: t.text, fontSize: "0.9rem", fontFamily: "Arial, sans-serif", outline: "none", padding: "2px 4px" }}>
                {RACE_NAMES.map((r) => <option key={r} value={r} style={{ background: "#1a2a1a" }}>{r}</option>)}
              </select>
            </div>
            <div className="flex flex-col">
              <label style={{ fontFamily: "Arial, sans-serif", fontSize: "0.6rem", color: t.primaryMid, letterSpacing: "0.08em", textTransform: "uppercase" }}>Class</label>
              <select value={info.class_} onChange={(e) => setInfo_("class_", e.target.value)}
                style={{ background: "transparent", borderBottom: `2px solid ${t.primaryDim}`, color: t.text, fontSize: "0.9rem", fontFamily: "Arial, sans-serif", outline: "none", padding: "2px 4px" }}>
                {CLASS_NAMES.map((c) => <option key={c} value={c} style={{ background: "#1a2a1a" }}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-6 gap-3 mt-2">
            <div className="flex flex-col">
              <label style={{ fontFamily: "Arial, sans-serif", fontSize: "0.6rem", color: t.primaryMid, letterSpacing: "0.08em", textTransform: "uppercase" }}>Level</label>
              <select value={info.level} onChange={(e) => handleLevelChange(+e.target.value)}
                style={{ background: "transparent", borderBottom: `2px solid ${t.primaryDim}`, color: t.text, fontSize: "0.9rem", fontFamily: "Arial, sans-serif", outline: "none", padding: "2px 4px" }}>
                {Array.from({ length: 30 }, (_, i) => i + 1).map((n) => <option key={n} value={n} style={{ background: "#1a2a1a" }}>{n}</option>)}
              </select>
            </div>
            <Field t={t} label="Alignment" value={info.alignment} onChange={(v) => setInfo_("alignment", v)} w="col-span-2" />
            <Field t={t} label="Age" value={info.age} onChange={(v) => setInfo_("age", v)} type="number" />
            <Field t={t} label="Height" value={info.height} onChange={(v) => setInfo_("height", v)} />
            <Field t={t} label="Weight" value={info.weight} onChange={(v) => setInfo_("weight", v)} />
          </div>
          <div className="mt-2 flex gap-4 items-center flex-wrap">
            <span style={{ fontSize: "0.6rem", color: t.primaryMid, textTransform: "uppercase", letterSpacing: "0.1em" }}>Racial Stats:</span>
            {Object.entries(racialStats).filter(([,v]) => v !== 0).map(([k, v]) => (
              <div key={k} className="flex items-center gap-1">
                <span style={{ fontSize: "0.7rem", color: t.primaryMid }}>{k}:</span>
                <span style={{ fontSize: "0.8rem", color: v > 0 ? t.primary : t.dangerLight, fontWeight: 700 }}>{v > 0 ? `+${v}` : v}</span>
              </div>
            ))}
            {RACE_DATA[info.race]?.racialAbility && (
              <span style={{ fontSize: "0.6rem", color: t.accent4, fontWeight: 600 }}>Innate: {RACE_DATA[info.race].racialAbility}</span>
            )}
            {RACE_DATA[info.race]?.statsText && (
              <span style={{ fontSize: "0.55rem", color: t.primaryDim, fontStyle: "italic", marginLeft: "auto" }}>{RACE_DATA[info.race].statsText}</span>
            )}
            <span style={{ fontSize: "0.6rem", color: t.primaryMid, textTransform: "uppercase", letterSpacing: "0.1em", marginLeft: "auto" }}>Initial Total: {initialTotal}</span>
          </div>
        </Section>

        {/* HP BAR */}
        <Section t={t}>
          <div className="flex items-center gap-4 mb-2">
            <Field t={t} label="HP Current" value={hpCurrent} onChange={setHpCurrent} type="number" w="w-20" small />
            <span className="text-lg font-bold opacity-30 mt-3">/</span>
            <Field t={t} label="HP Max" value={hpMax} onChange={setHpMax} type="number" w="w-20" small />
            <Field t={t} label="Temp HP" value={hpTemp} onChange={setHpTemp} type="number" w="w-20" small />
            <span style={{ fontSize: "0.7rem", color: "#7a9e7e88", marginTop: "auto", marginBottom: 4 }}>Health (x4) = {healthTotal}</span>
          </div>
          <div className="w-full h-5 rounded-full overflow-hidden" style={{ background: "#1a1a1a", border: `1px solid ${t.primaryDim}` }}>
            <div className="h-full rounded-full transition-all duration-500 flex items-center justify-end pr-2" style={{ width: `${hpPct}%`, background: `linear-gradient(90deg, ${hpColor}cc, ${hpColor})`, boxShadow: `0 0 12px ${hpColor}44`, minWidth: hpPct > 5 ? "auto" : 0 }}>
              {hpPct > 15 && <span style={{ fontSize: "0.6rem", color: "#fff", fontWeight: 700 }}>{hpCurrent}/{hpMax}</span>}
            </div>
          </div>
        </Section>

        {/* ═══ EQUIPMENT LOADOUT — FREEFORM CANVAS ═══ */}
        <Section t={t} title="Equipment Loadout" accent="#4a7c59">
          {/* Controls row */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {/* Upload background */}
            <label className="cursor-pointer px-2 py-1 rounded flex items-center gap-1"
              style={{ background: t.primaryDark, color: t.primaryMid, border: "1px solid #3a5a40", fontSize: "0.6rem", fontFamily: "Arial, sans-serif" }}>
              📷 {bgImage ? "Change" : "Upload"} Background
              <input type="file" accept="image/*" onChange={handleBgUpload} style={{ display: "none" }} />
            </label>
            {bgImage && (
              <button onClick={() => setBgImage(null)} className="cursor-pointer px-2 py-1 rounded"
                style={{ background: "rgba(206,107,107,0.1)", color: "#ce6b6b", border: "1px solid #ce6b6b33", fontSize: "0.6rem" }}>
                ✕ Remove BG
              </button>
            )}
            <div style={{ width: 1, height: 16, background: "#3a5a4044" }} />
            {/* Add new slot */}
            <input value={newSlotLabel} onChange={(e) => setNewSlotLabel(e.target.value)} placeholder="New slot name..."
              className="bg-transparent border-b outline-none px-1"
              style={{ borderColor: t.primaryDim, color: t.text, fontSize: "0.7rem", width: 120, fontFamily: "Arial, sans-serif" }}
              onKeyDown={(e) => { if (e.key === "Enter") addSlot(); }} />
            <button onClick={addSlot} className="cursor-pointer px-2 py-1 rounded"
              style={{ background: t.primaryDark, color: t.primaryLight, border: "1px solid #3a5a40", fontSize: "0.6rem", fontFamily: "Arial, sans-serif" }}>
              + Add Slot
            </button>
            <span style={{ fontSize: "0.5rem", color: "#3a5a40", marginLeft: "auto" }}>Drag slots to reposition</span>
          </div>

          <div className="flex gap-4" style={{ minHeight: 320 }}>
            {/* Canvas */}
            <div ref={canvasRef} style={{
              position: "relative", flex: "0 0 300px", height: 320, borderRadius: 8,
              border: "1px solid #3a5a4044", overflow: "hidden",
              background: bgImage ? `url(${bgImage}) center/cover no-repeat` : "rgba(0,0,0,0.2)",
            }}>
              {/* Scan-line overlay */}
              <div className="scan-line" />
              {/* SVG body figure underneath — only show when no background */}
              {!bgImage && (
                <svg width="300" height="320" viewBox="0 0 300 320" style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}>
                  <BodySVG />
                </svg>
              )}
              {/* Semi-transparent overlay when background is set */}
              {bgImage && <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.15)", pointerEvents: "none" }} />}
              {/* Draggable slots */}
              {slotPositions.map((slot) => {
                const equippedId = bodySlots[slot.id];
                const equippedItem = equippedId ? inventory.find((i) => i.id === equippedId) : null;
                return (
                  <DraggableSlot
                    key={slot.id}
                    slot={slot}
                    equippedItem={equippedItem}
                    onDrop={equipItem}
                    onRemove={unequipItem}
                    onMove={moveSlot}
                    onDelete={deleteSlot}
                    canvasRef={canvasRef}
                  />
                );
              })}
            </div>

            {/* Inventory panel */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ fontSize: "0.6rem", color: t.primaryMid, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700 }}>Inventory — drag items onto slots</div>

              {/* Category sub-tabs — only weapons/armor are drag-droppable */}
              <div className="flex gap-1">
                {[{ key: "all", label: "All" }, { key: "weapons", label: "Weapons" }, { key: "armor", label: "Armor" }].map((ct) => {
                  const count = ct.key === "all" ? equipableItems.length : equipableItems.filter((i) => i.category === ct.key).length;
                  return (
                    <button key={ct.key} onClick={() => setInventoryTab(ct.key)} className="cursor-pointer px-2 py-1 rounded"
                      style={{
                        fontSize: "0.55rem", fontFamily: "Arial, sans-serif",
                        background: inventoryTab === ct.key ? t.primaryDark : "transparent",
                        color: inventoryTab === ct.key ? t.primaryLight : t.primaryMid,
                        border: inventoryTab === ct.key ? `1px solid ${t.primary}` : `1px solid ${t.primaryDim}33`,
                        transition: "all 0.15s",
                      }}>
                      {ct.label} <span style={{ opacity: 0.5 }}>({count})</span>
                    </button>
                  );
                })}
              </div>

              <div style={{ flex: 1, overflowY: "auto", maxHeight: 200 }}>
                {equipableItems
                  .filter((item) => inventoryTab === "all" || item.category === inventoryTab)
                  .map((item) => {
                    const eqSlot = getEquippedSlot(item.id);
                    return <DragItem key={item.id} item={item} isEquipped={!!eqSlot} equippedSlotLabel={eqSlot ? getSlotLabel(eqSlot) : ""} />;
                  })}
                {equipableItems.filter((item) => inventoryTab === "all" || item.category === inventoryTab).length === 0 && (
                  <div style={{ fontSize: "0.7rem", color: t.primaryDim, fontStyle: "italic", padding: "12px 0", textAlign: "center" }}>No items in this category</div>
                )}
              </div>

              {/* Active bonuses */}
              {Object.keys(equipBonuses).length > 0 && (
                <div className="rounded p-2 mt-1" style={{ background: "rgba(74,124,89,0.08)", border: "1px solid #4a7c5933" }}>
                  <div style={{ fontSize: "0.55rem", color: "#4a7c59", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700, marginBottom: 4 }}>Active Equipment Bonuses</div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    {Object.entries(equipBonuses).map(([skill, val]) => (
                      <span key={skill} style={{ fontSize: "0.65rem", color: t.primaryLight }}>
                        <span style={{ color: t.primaryMid }}>{skill.startsWith("_") ? skill.slice(1) : skill}:</span> <span style={{ fontWeight: 700 }}>{fmtMod(val)}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Add new item */}
              <details style={{ marginTop: 4 }}>
                <summary style={{ fontSize: "0.6rem", color: t.primaryMid, cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.08em" }}>+ Add New Item</summary>
                <div className="grid grid-cols-2 gap-2 mt-2 p-2 rounded" style={{ background: "rgba(20,30,20,0.4)", border: "1px solid #3a5a4044" }}>
                  <Field t={t} label="Name" value={newItemForm.name} onChange={(v) => setNewItemForm((p) => ({ ...p, name: v }))} small />
                  <div className="flex flex-col">
                    <label style={{ fontSize: "0.5rem", color: t.primaryMid, textTransform: "uppercase", letterSpacing: "0.06em" }}>Category</label>
                    <select value={newItemForm.category} onChange={(e) => setNewItemForm((p) => ({ ...p, category: e.target.value }))}
                      style={{ background: t.bgCard, border: `1px solid ${t.primaryDim}44`, color: t.text, fontSize: "0.65rem", borderRadius: 4, padding: "3px 6px" }}>
                      {ITEM_CATEGORIES.map((c) => <option key={c} value={c}>{ITEM_CAT_LABELS[c]}</option>)}
                    </select>
                  </div>
                  <Field t={t} label="Stats" value={newItemForm.stats} onChange={(v) => setNewItemForm((p) => ({ ...p, stats: v }))} small />
                  <Field t={t} label="Notes" value={newItemForm.notes} onChange={(v) => setNewItemForm((p) => ({ ...p, notes: v }))} small />
                  <div className="flex gap-1">
                    <div className="flex flex-col flex-1">
                      <label style={{ fontSize: "0.5rem", color: t.primaryMid, textTransform: "uppercase", letterSpacing: "0.06em" }}>Bonus Skill</label>
                      <select value={newItemForm.bonusSkill} onChange={(e) => setNewItemForm((p) => ({ ...p, bonusSkill: e.target.value }))}
                        style={{ background: t.bgCard, border: "1px solid #3a5a40", color: t.text, fontSize: "0.65rem", borderRadius: 4, padding: "2px 4px" }}>
                        <option value="">None</option>
                        {allSkillNames.map((n) => <option key={n} value={n}>{n}</option>)}
                      </select>
                    </div>
                    <Field t={t} label="+" value={newItemForm.bonusValue} onChange={(v) => setNewItemForm((p) => ({ ...p, bonusValue: v }))} type="number" w="w-12" small />
                  </div>
                  <button onClick={addNewItem} className="col-span-2 px-3 py-1 text-xs rounded cursor-pointer" style={{ background: t.primaryDark, color: t.primaryLight, border: "1px solid #3a5a40" }}>Add to Inventory</button>
                </div>
              </details>
            </div>
          </div>
        </Section>

        {/* TABS */}
        <div className="flex gap-0.5 flex-wrap" style={{ borderBottom: `1px solid ${t.primaryDim}55` }}>
          <TabBtn t={t} active={tab === "skills"} label="Skills" onClick={() => setTab("skills")} icon="🎯" />
          <TabBtn t={t} active={tab === "abilities"} label="Abilities" onClick={() => setTab("abilities")} icon="✨" />
          <TabBtn t={t} active={tab === "inventory"} label="Inventory" onClick={() => setTab("inventory")} icon="🎒" />
          <TabBtn t={t} active={tab === "items"} label="Items" onClick={() => setTab("items")} icon="🛒" />
          <TabBtn t={t} active={tab === "notes"} label="Notes" onClick={() => setTab("notes")} icon="📜" />
          <TabBtn t={t} active={tab === "levels"} label="Levels" onClick={() => setTab("levels")} icon="📈" />
        </div>

        {/* SKILLS TAB */}
        {tab === "skills" && (
          <div className="pt-3 tab-content">
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(SKILL_GROUPS).map(([groupName, groupData]) => (
                <Section t={t} key={groupName} title={groupName} accent={groupName.includes("WISDOM") || groupName.includes("INTELLIGENCE") ? "#6b8cce" : groupName.includes("STRENGTH") || groupName.includes("CONSTITUTION") ? "#ce6b6b" : "#c4a96a"}>
                  {/* Column headers */}
                  <div style={{ display: "grid", gridTemplateColumns: "46px 46px 1fr 50px 44px 1fr", gap: "0 6px", marginBottom: 4, paddingBottom: 3, borderBottom: `1px solid ${t.primaryDim}33` }}>
                    {["Total","Base","Skill","Equip","Temp","Effect"].map((h, i) => (
                      <span key={h} style={{ fontSize: "var(--ty-label-size)", color: "#ffffff", textTransform: "uppercase", letterSpacing: "0.07em", textAlign: i < 2 || i === 3 || i === 4 ? "center" : "left" }}>{h}</span>
                    ))}
                  </div>
                  {groupData.skills.map((sk) => {
                    const cur = skills[sk.name] || { base: 0, bonus: "", temp: 0, tempNote: "" };
                    const eqBonus = equipBonuses[sk.name] || 0;
                    const temp = cur.temp || 0;
                    const total = cur.base + eqBonus + temp;
                    return (
                      <div key={sk.name} className="ability-row py-1 px-1 rounded" style={{ display: "grid", gridTemplateColumns: "46px 46px 1fr 50px 44px 1fr", gap: "0 6px", alignItems: "center", transition: "background 0.15s" }}>

                        {/* Col 1: Total (read-only) */}
                        <div style={{ fontSize: "var(--ty-value-size)", fontWeight: 700, color: "var(--ty-value-color)", textAlign: "center", lineHeight: 1 }}>
                          {total}
                        </div>

                        {/* Col 2: Base (editable) */}
                        <input type="number" value={cur.base} onChange={(e) => setSkill(sk.name, "base", +e.target.value || 0)}
                          className="bg-transparent outline-none text-center w-full"
                          style={{ fontSize: "var(--ty-value-size)", fontWeight: 600, color: t.primaryMid, borderBottom: `1px solid ${t.primaryDim}44` }} />

                        {/* Col 3: Skill name */}
                        <span style={{ fontSize: "var(--ty-body-size)", color: "var(--ty-body-color)" }}>{sk.name}</span>

                        {/* Col 4: Equipment bonus */}
                        <div style={{ textAlign: "center" }}>
                          {eqBonus !== 0 ? (
                            <BonusTooltip skillName={sk.name} bodySlots={bodySlots} inventory={inventory} equipBonuses={equipBonuses} slotLookup={bodySlotLookup} />
                          ) : (
                            <span style={{ fontSize: "var(--ty-body-size)", color: t.primaryDim + "55" }}>—</span>
                          )}
                        </div>

                        {/* Col 5: Temp number */}
                        <input type="number" value={temp || ""} placeholder="0"
                          onChange={(e) => setSkill(sk.name, "temp", +e.target.value || 0)}
                          className="bg-transparent outline-none text-center w-full"
                          style={{ borderBottom: `1px solid ${temp !== 0 ? t.accent3 : t.primaryDim + "44"}`, color: temp !== 0 ? t.accent3 : "var(--ty-meta-color)", fontSize: "var(--ty-body-size)", fontWeight: temp !== 0 ? 700 : 400 }} />

                        {/* Col 6: Effect note */}
                        <input value={cur.tempNote || ""} placeholder="source..."
                          onChange={(e) => setSkill(sk.name, "tempNote", e.target.value)}
                          className="bg-transparent outline-none w-full"
                          style={{ borderBottom: `1px solid ${t.primaryDim}33`, color: t.primaryMid, fontSize: "var(--ty-meta-size)", fontStyle: "italic", minWidth: 0 }} />

                      </div>
                    );
                  })}
                </Section>
              ))}
            </div>
          </div>
        )}

        {/* ABILITIES TAB */}
        {tab === "abilities" && (
          <div className="pt-3 tab-content">
            <Section t={t} title="Abilities" accent={t.accent1}>
              {/* Battle controls */}
              <div className="flex items-center gap-3 mb-3 pb-2" style={{ borderBottom: `1px solid ${t.accent1}22` }}>
                <button onClick={() => setAbilities((prev) => prev.map((a) => ({ ...a, used: 0 })))}
                  className="cursor-pointer px-3 py-1.5 rounded flex items-center gap-1.5"
                  style={{ background: `linear-gradient(135deg, ${t.primaryDark}, ${t.primaryDim})`, color: t.primaryLight, border: `1.5px solid ${t.primary}`, fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.05em" }}>
                  ⚔ New Battle — Reset All
                </button>
                <span style={{ fontSize: "0.6rem", color: t.primaryMid + "88" }}>
                  {abilities.filter((a) => a.mode !== "passive" && a.maxUses !== -1 && a.used >= (a.maxUses || 1)).length} / {abilities.filter((a) => a.mode !== "passive" && a.maxUses !== -1).length} active used
                </span>
                <span style={{ fontSize: "0.55rem", color: t.primaryDim, marginLeft: "auto" }}>
                  {abilities.filter((a) => a.mode !== "passive").length} active · {abilities.filter((a) => a.mode === "passive").length} passive
                </span>
              </div>

              {/* Divider label when transitioning from active to passive */}
              {sortedAbilities.map((ab, si) => {
                const i = ab._origIdx;
                const isPassive = ab.mode === "passive";
                const maxUses = ab.maxUses ?? 1;
                const isUnlimited = maxUses === -1;
                const used = ab.used || 0;
                const isSpent = !isPassive && !isUnlimited && used >= maxUses;

                /* Show passive divider before first passive */
                const showPassiveDivider = isPassive && (si === 0 || sortedAbilities[si - 1].mode !== "passive");

                return (
                  <div key={i}>
                    {showPassiveDivider && (
                      <div className="flex items-center gap-2 my-3 pt-2" style={{ borderTop: `1px dashed ${t.accent2}44` }}>
                        <span style={{ fontSize: "0.6rem", color: t.accent2, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>Passive Abilities</span>
                        <div style={{ flex: 1, height: 1, background: t.accent2 + "22" }} />
                      </div>
                    )}

                    <div className="mb-2 p-2 rounded" 
                      draggable
                      onDragStart={(e) => handleAbilityDragStart(i, e)}
                      onDragOver={(e) => handleAbilityDragOver(i, e)}
                      onDrop={() => handleAbilityDrop(i)}
                      onDragEnd={handleAbilityDragEnd}
                      style={{
                        background: isPassive ? `${t.accent2}08` : isSpent ? "rgba(60,40,40,0.15)" : `${t.accent1}08`,
                        borderLeft: isPassive ? `3px solid ${t.accent2}44` : isSpent ? `3px solid ${t.danger}44` : `3px solid ${t.accent1}44`,
                        opacity: dragAbilityIdx === i ? 0.35 : isSpent ? 0.45 : 1,
                        transition: "all 0.2s",
                        borderTop: dragOverIdx === i && dragAbilityIdx !== i ? `2px solid ${t.primary}` : "2px solid transparent",
                        cursor: "default",
                      }}>
                      {/* Top row: drag handle + mode + usage */}
                      <div className="flex items-center gap-1.5 mb-1">
                        {/* Drag handle */}
                        <div style={{ cursor: "grab", color: t.primaryDim, fontSize: "0.8rem", lineHeight: 1, padding: "0 2px", userSelect: "none" }}
                          title="Drag to reorder">⠿</div>

                        {/* Mode selector */}
                        <select value={ab.mode || "active"} onChange={(e) => { const a = [...abilities]; a[i] = { ...a[i], mode: e.target.value }; setAbilities(a); }}
                          style={{
                            fontSize: "0.5rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em",
                            background: isPassive ? `${t.accent2}22` : `${t.accent1}22`,
                            color: isPassive ? t.accent2 : t.accent1,
                            border: `1px solid ${isPassive ? t.accent2 : t.accent1}33`,
                            borderRadius: 4, padding: "2px 6px", cursor: "pointer",
                          }}>
                          <option value="active">Active</option>
                          <option value="passive">Passive</option>
                        </select>

                        {/* Usage tracking (only for active) */}
                        {!isPassive && (
                          <>
                            {isUnlimited ? (
                              <span style={{ fontSize: "0.5rem", color: t.primary, background: `${t.primary}22`, borderRadius: 4, padding: "2px 6px", fontWeight: 700 }}>∞ UNLIMITED</span>
                            ) : (
                              <div className="flex items-center gap-1">
                                {Array.from({ length: maxUses }).map((_, ui) => (
                                  <button key={ui}
                                    onClick={() => { const a = [...abilities]; a[i] = { ...a[i], used: used === ui + 1 ? ui : ui + 1 }; setAbilities(a); }}
                                    className="cursor-pointer"
                                    style={{ width: 14, height: 14, borderRadius: "50%", border: ui < used ? `1.5px solid ${t.danger}` : `1.5px solid ${t.accent1}55`, background: ui < used ? t.danger : "transparent", transition: "all 0.2s", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    {ui < used && <span style={{ color: "#ff9999", fontSize: "0.45rem", lineHeight: 1 }}>✕</span>}
                                  </button>
                                ))}
                                <span style={{ fontSize: "0.5rem", color: isSpent ? t.danger : t.primaryMid, marginLeft: 2, fontWeight: 600 }}>{isSpent ? "SPENT" : `${used}/${maxUses}`}</span>
                              </div>
                            )}
                            <select value={maxUses} onChange={(e) => { const a = [...abilities]; a[i] = { ...a[i], maxUses: +e.target.value, used: Math.min(ab.used || 0, +e.target.value === -1 ? 0 : +e.target.value) }; setAbilities(a); }}
                              style={{ background: t.bgCard, border: `1px solid ${t.primaryDim}44`, color: t.primaryMid, fontSize: "0.5rem", borderRadius: 3, padding: "1px 3px", marginLeft: "auto" }}>
                              <option value={-1}>∞</option>
                              {[1,2,3,4,5,6,7,8,9,10].map((n) => <option key={n} value={n}>{n}</option>)}
                            </select>
                          </>
                        )}

                        {isPassive && <div style={{ flex: 1 }} />}

                        {/* Delete */}
                        <button onClick={() => setAbilities(abilities.filter((_, idx) => idx !== i))} className="cursor-pointer"
                          style={{ fontSize: "0.5rem", color: t.dangerLight + "66", background: "none", border: "none", marginLeft: isPassive ? 0 : undefined }}>Remove</button>
                      </div>

                      {/* Name + cost */}
                      <div className="flex items-center justify-between mb-1">
                        <input value={ab.name} onChange={(e) => { const a = [...abilities]; a[i] = { ...a[i], name: e.target.value }; setAbilities(a); }}
                          className="bg-transparent outline-none font-bold" style={{ fontSize: "0.8rem", color: isPassive ? t.accent2 : isSpent ? t.danger + "88" : t.accent1, letterSpacing: "0.05em", border: "none", width: "60%", textDecoration: isSpent ? "line-through" : "none" }} />
                        <input value={ab.cost} onChange={(e) => { const a = [...abilities]; a[i] = { ...a[i], cost: e.target.value }; setAbilities(a); }}
                          className="bg-transparent border-b outline-none text-right" style={{ borderColor: t.primaryDim + "55", fontSize: "0.75rem", color: t.primaryMid, width: "35%" }} />
                      </div>

                      {/* Description */}
                      <RichTextEditor html={ab.desc} onChange={(v) => { const a = [...abilities]; a[i] = { ...a[i], desc: v }; setAbilities(a); }} minHeight={isPassive ? 24 : 40} />
                    </div>
                  </div>
                );
              })}

              {/* Add new ability */}
              <div className="flex gap-2 mt-3">
                <button onClick={() => setAbilities([...abilities, { name: "New Ability", cost: "0 actions", desc: "Description...", used: 0, maxUses: 1, mode: "active" }])}
                  className="px-3 py-1 text-xs rounded cursor-pointer" style={{ background: t.primaryDark, color: t.accent1, border: `1px solid ${t.accent1}33` }}>+ Add Active</button>
                <button onClick={() => setAbilities([...abilities, { name: "New Passive", cost: "—", desc: "Description...", used: 0, maxUses: -1, mode: "passive" }])}
                  className="px-3 py-1 text-xs rounded cursor-pointer" style={{ background: t.primaryDark, color: t.accent2, border: `1px solid ${t.accent2}33` }}>+ Add Passive</button>
              </div>
            </Section>
          </div>
        )}

        {/* LEVELS TAB */}
        {tab === "levels" && (
          <div className="pt-3 tab-content">
            {/* Summary bar */}
            <Section t={t} title="Level Progression" accent={t.primary}>
              <div className="flex items-center gap-4 flex-wrap">
                <div style={{ fontSize: "0.7rem", color: t.text }}>
                  <span style={{ color: t.primaryMid }}>Current Level:</span> <strong>{info.level}</strong> / {MAX_LEVEL}
                </div>
                <div style={{ fontSize: "0.7rem", color: t.text }}>
                  <span style={{ color: t.primaryMid }}>Points Allocated:</span> <strong>{levelTotalPoints}</strong> <span style={{ color: t.primaryMid }}>/ {info.level * POINTS_PER_LEVEL} available</span>
                </div>
                <div style={{ fontSize: "0.7rem", color: t.text }}>
                  <span style={{ color: t.primaryMid }}>Race:</span> <strong>{info.race}</strong>
                </div>
                <div style={{ fontSize: "0.7rem", color: t.text }}>
                  <span style={{ color: t.primaryMid }}>Class:</span> <strong>{info.class_}</strong>
                </div>
                {Object.keys(levelSkillBonuses).length > 0 && (
                  <div style={{ fontSize: "0.55rem", color: t.primary, fontStyle: "italic" }}>
                    Skill points from levels are applied to the Skills tab
                  </div>
                )}

                {/* Filter */}
                <div className="flex gap-1 ml-auto">
                  {[
                    { key: "all", label: "All 30" },
                    { key: "past", label: `Past (1–${info.level})` },
                    { key: "future", label: `Future (${info.level + 1}–30)` },
                  ].map((f) => (
                    <button key={f.key} onClick={() => setLevelFilter(f.key)} className="cursor-pointer px-2 py-1 rounded"
                      style={{
                        fontSize: "0.55rem", fontFamily: "Arial, sans-serif",
                        background: levelFilter === f.key ? t.primaryDark : "transparent",
                        color: levelFilter === f.key ? t.primaryLight : t.primaryMid,
                        border: levelFilter === f.key ? `1px solid ${t.primary}` : `1px solid ${t.primaryDim}44`,
                      }}>
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            </Section>

            {/* Level cards */}
            {levelLog
              .filter((l) => levelFilter === "all" || (levelFilter === "past" ? l.level <= info.level : l.level > info.level))
              .map((lvl) => {
                const isPast = lvl.level <= info.level;
                const isCurrent = lvl.level === info.level;
                const isFuture = lvl.level > info.level;
                const borderColor = isCurrent ? t.accent3 : isPast ? t.primary : t.primaryDim + "66";
                const usedPoints = lvl.points.reduce((s, p) => s + (p.amount || 0), 0);

                return (
                  <div key={lvl.level} className="mb-2 rounded-lg overflow-hidden" style={{
                    border: `1.5px solid ${borderColor}`,
                    background: isCurrent ? `${t.accent3}0a` : "rgba(20,30,20,0.4)",
                    opacity: isPast && !isCurrent ? 0.75 : 1,
                    transition: "all 0.2s",
                  }}>
                    {/* Level header */}
                    <div className="flex items-center gap-3 px-3 py-2">
                      {/* Level badge */}
                      <div style={{
                        width: 32, height: 32, borderRadius: "50%",
                        border: `2px solid ${borderColor}`,
                        background: isPast ? `${t.primary}22` : "rgba(0,0,0,0.3)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "0.75rem", fontWeight: 700, color: isCurrent ? t.accent3 : isPast ? t.primaryLight : t.primaryDim,
                        flexShrink: 0,
                      }}>
                        {lvl.level}
                      </div>

                      <div style={{ flex: 1 }}>
                        <div className="flex items-center gap-2">
                          <span style={{ fontSize: "0.7rem", fontWeight: 700, color: isCurrent ? t.accent3 : isPast ? t.primaryLight : t.primaryMid }}>
                            Level {lvl.level}
                          </span>
                          {isCurrent && <span style={{ fontSize: "0.5rem", background: t.accent3 + "33", color: t.accent3, borderRadius: 4, padding: "1px 6px", fontWeight: 700 }}>CURRENT</span>}
                          {isFuture && <span style={{ fontSize: "0.5rem", background: t.primaryDim + "33", color: t.primaryMid, borderRadius: 4, padding: "1px 6px" }}>PLANNED</span>}
                          {isPast && !isCurrent && lvl.locked && <span style={{ fontSize: "0.5rem", color: t.primaryDim }}>✓ Confirmed</span>}
                        </div>
                        <div style={{ fontSize: "0.55rem", color: t.primaryMid + "88" }}>
                          {usedPoints}/{POINTS_PER_LEVEL} points allocated
                          {lvl.abilityName ? ` · ${lvl.abilityName}` : " · No ability selected"}
                        </div>
                      </div>

                      {/* Lock toggle for past levels */}
                      {isPast && (
                        <button onClick={() => updateLevel(lvl.level, "locked", !lvl.locked)} className="cursor-pointer"
                          style={{ fontSize: "0.5rem", color: lvl.locked ? t.primaryDim : t.accent3, background: "none", border: `1px solid ${lvl.locked ? t.primaryDim + "44" : t.accent3 + "44"}`, borderRadius: 4, padding: "2px 6px" }}>
                          {lvl.locked ? "🔒 Unlock" : "🔓 Lock"}
                        </button>
                      )}
                    </div>

                    {/* Level content — editable */}
                    {(!isPast || !lvl.locked || isCurrent) && (
                      <div className="px-3 pb-3">
                        {/* Point allocation */}
                        <div style={{ fontSize: "0.55rem", color: t.primaryMid, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700, marginBottom: 4 }}>
                          Skill Points ({POINTS_PER_LEVEL} per level)
                        </div>
                        {lvl.points.map((pt, pi) => (
                          <div key={pi} className="flex items-center gap-2 mb-1">
                            <select value={pt.skill} onChange={(e) => updateLevelPoint(lvl.level, pi, "skill", e.target.value)}
                              style={{ background: t.bgCard, border: `1px solid ${t.primaryDim}44`, color: t.text, fontSize: "0.7rem", borderRadius: 4, padding: "3px 6px", flex: 1 }}>
                              <option value="">— Select Skill —</option>
                              {Object.entries(SKILL_GROUPS).map(([groupName, groupData]) => (
                                <optgroup key={groupName} label={groupName}>
                                  {groupData.skills.map((sk) => <option key={sk.name} value={sk.name}>{sk.name}</option>)}
                                </optgroup>
                              ))}
                            </select>
                            <input type="number" value={pt.amount} onChange={(e) => updateLevelPoint(lvl.level, pi, "amount", Math.max(0, +e.target.value || 0))}
                              className="bg-transparent border-b outline-none text-center w-10"
                              style={{ borderColor: t.primaryDim, color: t.primaryLight, fontSize: "0.75rem", fontWeight: 600 }} />
                            <span style={{ fontSize: "0.5rem", color: t.primaryDim }}>pts</span>
                            {lvl.points.length > 1 && (
                              <button onClick={() => removeLevelPoint(lvl.level, pi)} className="cursor-pointer"
                                style={{ fontSize: "0.5rem", color: t.dangerLight + "88", background: "none", border: "none" }}>✕</button>
                            )}
                          </div>
                        ))}
                        <button onClick={() => addLevelPoint(lvl.level)} className="cursor-pointer mt-1"
                          style={{ fontSize: "0.55rem", color: t.primaryMid, background: "none", border: `1px dashed ${t.primaryDim}44`, borderRadius: 4, padding: "2px 8px" }}>
                          + Split point
                        </button>

                        {/* Ability selection */}
                        <div style={{ fontSize: "0.55rem", color: t.primaryMid, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700, marginTop: 10, marginBottom: 4 }}>
                          Ability Gained
                        </div>
                        <div className="flex gap-2 mb-1 flex-wrap">
                          <select value={lvl.abilityType} onChange={(e) => { updateLevel(lvl.level, "abilityType", e.target.value); updateLevel(lvl.level, "abilityName", ""); updateLevel(lvl.level, "abilityDesc", ""); }}
                            style={{ background: t.bgCard, border: `1px solid ${t.primaryDim}44`, color: t.text, fontSize: "0.65rem", borderRadius: 4, padding: "3px 6px" }}>
                            <option value="">— Source —</option>
                            <option value="class">Class ({info.class_})</option>
                            <option value="race-own">Race ({info.race})</option>
                            <option value="race-human">Race (Human)</option>
                            <option value="upgrade">⬆ Upgrade Existing</option>
                            <option value="non-class">Non-Class Ability</option>
                          </select>

                          {/* Ability dropdown — populated based on source */}
                          {lvl.abilityType === "upgrade" ? (() => {
                            /* Find all abilities taken in previous levels that have upgrade tiers available */
                            const takenAbilities = {};
                            levelLog.forEach((l) => {
                              if (l.level >= lvl.level) return;
                              if (!l.abilityName) return;
                              if (l.abilityType === "upgrade") {
                                /* Count upgrades already taken for the base ability */
                                const baseName = l.abilityName.replace(/^⬆ /, "");
                                takenAbilities[baseName] = (takenAbilities[baseName] || 0) + 1;
                              } else {
                                /* Base ability taken */
                                if (!(l.abilityName in takenAbilities)) takenAbilities[l.abilityName] = 0;
                              }
                            });
                            /* Also count upgrades at the current level and after for display purposes */
                            const upgradeOptions = [];
                            Object.entries(takenAbilities).forEach(([name, upgradesTaken]) => {
                              const tiers = ABILITY_UPGRADES[name];
                              if (!tiers || upgradesTaken >= tiers.length) return;
                              const nextTier = upgradesTaken;
                              upgradeOptions.push({ name, tier: nextTier, desc: tiers[nextTier], tierLabel: `Tier ${nextTier + 1}/${tiers.length}` });
                            });

                            return (
                              <select value={lvl.abilityName} onChange={(e) => {
                                const val = e.target.value;
                                updateLevel(lvl.level, "abilityName", val);
                                if (val) {
                                  const baseName = val.replace(/^⬆ /, "");
                                  const tiers = ABILITY_UPGRADES[baseName];
                                  const upgradesTaken = takenAbilities[baseName] || 0;
                                  if (tiers && tiers[upgradesTaken]) {
                                    updateLevel(lvl.level, "abilityDesc", `Upgrade: ${tiers[upgradesTaken]}`);
                                  }
                                }
                              }}
                                style={{ background: t.bgCard, border: `1px solid ${t.primaryDim}44`, color: t.text, fontSize: "0.65rem", borderRadius: 4, padding: "3px 6px", flex: 1, minWidth: 140 }}>
                                <option value="">— Select Ability to Upgrade —</option>
                                {upgradeOptions.length === 0 && <option disabled>No upgradeable abilities found</option>}
                                {upgradeOptions.map((opt) => (
                                  <option key={opt.name} value={`⬆ ${opt.name}`}>⬆ {opt.name} — {opt.tierLabel}: {opt.desc}</option>
                                ))}
                              </select>
                            );
                          })() : lvl.abilityType === "race-own" || lvl.abilityType === "race-human" ? (
                            <select value={lvl.abilityName} onChange={(e) => {
                              const abilName = e.target.value;
                              updateLevel(lvl.level, "abilityName", abilName);
                              updateLevel(lvl.level, "abilityDesc", ABILITY_DESCRIPTIONS[abilName] || "");
                            }}
                              style={{ background: t.bgCard, border: `1px solid ${t.primaryDim}44`, color: t.text, fontSize: "0.65rem", borderRadius: 4, padding: "3px 6px", flex: 1, minWidth: 140 }}>
                              <option value="">— Select Ability —</option>
                              {lvl.abilityType === "race-own" && RACE_DATA[info.race] && (
                                <>
                                  {RACE_DATA[info.race].racialAbility && <option value={RACE_DATA[info.race].racialAbility}>★ {RACE_DATA[info.race].racialAbility} (Innate)</option>}
                                  {RACE_DATA[info.race].abilities.map((a) => <option key={a} value={a}>{a}</option>)}
                                </>
                              )}
                              {lvl.abilityType === "race-human" && RACE_DATA.Human && (
                                RACE_DATA.Human.abilities.map((a) => <option key={a} value={a}>{a}</option>)
                              )}
                            </select>
                          ) : lvl.abilityType === "class" ? (
                            <select value={lvl.abilityName} onChange={(e) => {
                              const abilName = e.target.value;
                              updateLevel(lvl.level, "abilityName", abilName);
                              updateLevel(lvl.level, "abilityDesc", ABILITY_DESCRIPTIONS[abilName] || "");
                            }}
                              style={{ background: t.bgCard, border: `1px solid ${t.primaryDim}44`, color: t.text, fontSize: "0.65rem", borderRadius: 4, padding: "3px 6px", flex: 1, minWidth: 140 }}>
                              <option value="">— Select {info.class_} Ability —</option>
                              {(CLASS_DATA[info.class_] || []).map((a) => <option key={a} value={a}>{a}</option>)}
                            </select>
                          ) : lvl.abilityType === "non-class" ? (
                            <select value={lvl.abilityName} onChange={(e) => {
                              const abilName = e.target.value;
                              updateLevel(lvl.level, "abilityName", abilName);
                              updateLevel(lvl.level, "abilityDesc", ABILITY_DESCRIPTIONS[abilName] || "");
                            }}
                              style={{ background: t.bgCard, border: `1px solid ${t.primaryDim}44`, color: t.text, fontSize: "0.65rem", borderRadius: 4, padding: "3px 6px", flex: 1, minWidth: 140 }}>
                              <option value="">— Select Non-Class Ability —</option>
                              {CLASS_NAMES.filter((cls) => cls !== info.class_).map((cls) => (
                                <optgroup key={cls} label={cls}>
                                  {(CLASS_DATA[cls] || []).map((a) => <option key={`${cls}-${a}`} value={a}>{a}</option>)}
                                </optgroup>
                              ))}
                            </select>
                          ) : (
                            <input value={lvl.abilityName} onChange={(e) => updateLevel(lvl.level, "abilityName", e.target.value)}
                              placeholder="Select a source first..."
                              className="bg-transparent border-b outline-none flex-1"
                              style={{ borderColor: t.primaryDim + "66", color: t.text, fontSize: "0.75rem", minWidth: 140 }} />
                          )}
                        </div>

                        {/* Ability Description */}
                        {lvl.abilityName && (
                          <div className="mt-2">
                            <div style={{ fontSize: "0.5rem", color: t.accent1, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700, marginBottom: 3 }}>
                              Ability Description{ABILITY_DESCRIPTIONS[lvl.abilityName] ? " — auto-filled" : ""}
                            </div>
                            <textarea value={lvl.abilityDesc} onChange={(e) => updateLevel(lvl.level, "abilityDesc", e.target.value)}
                              placeholder="Describe what this ability does..."
                              rows={Math.max(3, (lvl.abilityDesc || "").split("\n").length + 1)}
                              className="w-full bg-transparent border outline-none rounded px-2 py-1.5 resize-y"
                              style={{ borderColor: t.accent1 + "33", color: t.text, fontSize: "0.7rem", background: `${t.accent1}06`, whiteSpace: "pre-wrap", lineHeight: 1.5 }} />
                          </div>
                        )}

                        {/* Player Notes */}
                        <div className="mt-2">
                          <div style={{ fontSize: "0.5rem", color: t.primaryMid, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700, marginBottom: 3 }}>
                            Player Notes
                          </div>
                          <textarea value={lvl.abilityNotes} onChange={(e) => updateLevel(lvl.level, "abilityNotes", e.target.value)}
                            placeholder="Your notes for this level (strategy, reasoning, etc.)..."
                            rows={2}
                            className="w-full bg-transparent border outline-none rounded px-2 py-1 resize-y"
                            style={{ borderColor: t.primaryDim + "33", color: t.textDim, fontSize: "0.7rem" }} />
                        </div>
                      </div>
                    )}

                    {/* Collapsed summary for locked past levels */}
                    {isPast && lvl.locked && !isCurrent && (
                      <div className="px-3 pb-2" style={{ paddingLeft: 50 }}>
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                          {lvl.points.filter((p) => p.skill).map((p, i) => (
                            <span key={i} style={{ fontSize: "0.6rem", color: t.primaryMid }}>
                              {p.skill}: <strong style={{ color: t.primaryLight }}>+{p.amount}</strong>
                            </span>
                          ))}
                          {lvl.abilityName && (
                            <span style={{ fontSize: "0.6rem", color: t.accent1 }}>
                              {lvl.abilityType === "class" ? `${info.class_}` : lvl.abilityType === "race-own" ? info.race : lvl.abilityType === "race-human" ? "Human" : lvl.abilityType === "upgrade" ? "⬆ Upgrade" : ""}: <strong>{lvl.abilityName}</strong>
                            </span>
                          )}
                        </div>
                        {lvl.abilityDesc && (
                          <div style={{ fontSize: "0.55rem", color: t.textDim + "88", fontStyle: "italic", marginTop: 2 }}>
                            {lvl.abilityDesc.slice(0, 100)}{lvl.abilityDesc.length > 100 ? "..." : ""}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        )}

        {/* EQUIPMENT TAB */}
        {/* INVENTORY TAB */}
        {tab === "inventory" && (
          <div className="pt-3 tab-content">
            {/* Folder tabs + add folder */}
            <div className="flex items-center gap-1 mb-3 flex-wrap">
              {inventoryFolders.map((folder) => {
                const count = folder.id === "equipment" ? inventory.length : folder.items.length;
                return (
                  <button key={folder.id} onClick={() => setInvActiveFolder(folder.id)} className="cursor-pointer px-2.5 py-1.5 rounded flex items-center gap-1.5"
                    style={{
                      fontSize: "0.6rem", fontFamily: "Arial, sans-serif",
                      background: invActiveFolder === folder.id ? t.primaryDark : "rgba(20,30,20,0.3)",
                      color: invActiveFolder === folder.id ? t.primaryLight : t.primaryMid,
                      border: invActiveFolder === folder.id ? `1.5px solid ${t.primary}` : "1.5px solid transparent",
                      fontWeight: invActiveFolder === folder.id ? 700 : 400, transition: "all 0.15s",
                    }}>
                    {folder.icon} {folder.name} <span style={{ opacity: 0.5 }}>({count})</span>
                  </button>
                );
              })}
              <div style={{ width: 1, height: 20, background: t.primaryDim + "33", margin: "0 4px" }} />
              <input value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} placeholder="New folder..."
                className="bg-transparent border-b outline-none px-1"
                style={{ borderColor: t.primaryDim + "44", color: t.text, fontSize: "0.65rem", width: 100 }}
                onKeyDown={(e) => { if (e.key === "Enter") addFolder(); }} />
              <button onClick={addFolder} className="cursor-pointer px-2 py-1 rounded"
                style={{ background: t.primaryDark, color: t.primaryLight, border: `1px solid ${t.primaryDim}44`, fontSize: "0.55rem" }}>
                + Folder
              </button>
            </div>

            {/* Carry Capacity */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, padding: "4px 8px", background: "rgba(5,10,5,0.5)", borderRadius: 6, border: `1px solid ${t.primaryDim}33` }}>
              <span style={{ fontSize: "var(--ty-label-size)", color: t.textDim, whiteSpace: "nowrap" }}>Weight Capacity:</span>
              <span style={{ fontSize: "var(--ty-label-size)", color: t.primary, fontWeight: 600 }}>5 (Athletics+2)</span>
            </div>

            {/* ══ EQUIPMENT FOLDER (special — shows equipment loadout items) ══ */}
            {invActiveFolder === "equipment" && (
              <div>
                <Section t={t} title="Equipment — Synced with Loadout" accent={t.accent3}>
                  {inventory.map((item) => {
                    const eqSlot = getEquippedSlot(item.id);
                    return (
                      <div key={item.id} className="mb-3 p-2 rounded" style={{ background: "rgba(196,169,106,0.04)", borderLeft: eqSlot ? `3px solid ${t.primary}` : `3px solid ${t.accent3}33` }}>
                        {/* Row 1: name, qty, delete */}
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <span style={{ fontSize: "0.5rem", color: t.primaryMid, textTransform: "uppercase", letterSpacing: "0.1em" }}>{eqSlot ? `Equipped: ${getSlotLabel(eqSlot)}` : "Unequipped"}</span>
                            <input value={item.name} onChange={(e) => updateInventoryItem(item.id, "name", e.target.value)}
                              className="w-full bg-transparent border-b outline-none" style={{ borderColor: t.primaryDim, color: t.accent3, fontSize: "0.8rem", fontWeight: 600 }} />
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1, flexShrink: 0 }}>
                            <span style={{ fontSize: "0.45rem", color: t.primaryDim, textTransform: "uppercase" }}>Qty</span>
                            <input type="number" value={item.qty ?? 1} onChange={(e) => updateInventoryItem(item.id, "qty", Math.max(1, +e.target.value || 1))}
                              className="bg-transparent border-b outline-none text-center"
                              style={{ width: 36, borderColor: t.primaryDim + "66", color: t.primaryLight, fontSize: "0.75rem" }} />
                          </div>
                          <button onClick={() => { if (confirm(`Delete "${item.name}"?`)) deleteInventoryItem(item.id); }}
                            style={{ flexShrink: 0, background: "none", border: "none", color: t.dangerLight + "66", fontSize: "0.75rem", cursor: "pointer", padding: "0 2px", alignSelf: "flex-end" }}>✕</button>
                        </div>
                        {/* Row 2: stats + bonuses */}
                        <div className="grid grid-cols-2 gap-2 mb-1">
                          <div>
                            <span style={{ fontSize: "0.5rem", color: t.primaryMid, textTransform: "uppercase", letterSpacing: "0.1em" }}>Stats</span>
                            <input value={item.stats} onChange={(e) => updateInventoryItem(item.id, "stats", e.target.value)}
                              className="w-full bg-transparent border-b outline-none" style={{ borderColor: t.primaryDim, color: t.primaryLight, fontSize: "0.8rem" }} />
                          </div>
                          <div>
                            <span style={{ fontSize: "0.5rem", color: t.primaryMid, textTransform: "uppercase", letterSpacing: "0.1em" }}>Bonuses</span>
                            <div style={{ fontSize: "0.7rem", color: t.primaryLight }}>
                              {item.bonuses && Object.entries(item.bonuses).map(([sk, val]) => (
                                <span key={sk} className="mr-2">{sk}: {fmtMod(val)}{item.bonusNotes?.[sk] ? ` (${item.bonusNotes[sk]})` : ""}</span>
                              ))}
                              {(!item.bonuses || Object.keys(item.bonuses).length === 0) && <span style={{ color: t.primaryDim }}>—</span>}
                            </div>
                          </div>
                        </div>
                        <div>
                          <span style={{ fontSize: "0.5rem", color: t.primaryMid, textTransform: "uppercase", letterSpacing: "0.1em" }}>Notes</span>
                          <textarea value={item.notes} onChange={(e) => updateInventoryItem(item.id, "notes", e.target.value)}
                            rows={2} className="w-full bg-transparent border outline-none rounded px-1" style={{ borderColor: t.primaryDim + "55", color: t.textDim, fontSize: "0.75rem" }} />
                        </div>
                        {/* Enchantments section */}
                        {(item.ecCap > 0) && (() => {
                          const usedEC = (item.enchantments || []).reduce((sum, e) => sum + (e.fillsEC || 0), 0);
                          const remainEC = item.ecCap - usedEC;
                          return (
                            <div style={{ marginTop: 6, padding: "5px 7px", borderRadius: 5, background: "rgba(74,124,89,0.06)", border: `1px solid ${t.primaryDim}33` }}>
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
                                <span style={{ fontSize: "0.5rem", color: t.primaryMid, textTransform: "uppercase", letterSpacing: "0.1em" }}>Enchantments</span>
                                <span style={{ fontSize: "0.5rem", color: remainEC > 0 ? t.primary : "#ce6b6b", fontWeight: 600 }}>{usedEC}/{item.ecCap} EC</span>
                              </div>
                              {(item.enchantments || []).length === 0 && (
                                <span style={{ fontSize: "0.6rem", color: t.primaryDim, fontStyle: "italic" }}>No enchantments</span>
                              )}
                              {(item.enchantments || []).map((e) => (
                                <div key={e.id} style={{ display: "flex", alignItems: "flex-start", gap: 4, marginBottom: 3 }}>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <span style={{ fontSize: "0.6rem", color: t.primaryLight, fontWeight: 600 }}>{e.name}</span>
                                    {e.description && <span style={{ fontSize: "0.55rem", color: t.textDim, marginLeft: 5 }}>{e.description}</span>}
                                  </div>
                                  <span style={{ fontSize: "0.5rem", color: t.primaryDim, flexShrink: 0 }}>EC:{e.fillsEC}</span>
                                  <button onClick={() => removeEnchantment(item.id, e.id)}
                                    style={{ background: "none", border: "none", color: "#ce6b6b88", fontSize: "0.55rem", cursor: "pointer", padding: 0, flexShrink: 0 }}>✕</button>
                                </div>
                              ))}
                            </div>
                          );
                        })()}
                      </div>
                    );
                  })}
                  {/* Add custom item */}
                  <div style={{ borderTop: `1px solid ${t.primaryDim}22`, paddingTop: 8, marginTop: 4, display: "flex", gap: 6, alignItems: "flex-end", flexWrap: "wrap" }}>
                    <div style={{ flex: 1, minWidth: 100 }}>
                      <span style={{ fontSize: "0.45rem", color: t.primaryDim, textTransform: "uppercase", letterSpacing: "0.08em" }}>Name</span>
                      <input value={newItemForm.name} onChange={(e) => setNewItemForm((p) => ({ ...p, name: e.target.value }))}
                        placeholder="Custom item..." onKeyDown={(e) => { if (e.key === "Enter") addNewItem(); }}
                        className="w-full bg-transparent border-b outline-none" style={{ borderColor: t.primaryDim + "55", color: t.text, fontSize: "0.7rem" }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 80 }}>
                      <span style={{ fontSize: "0.45rem", color: t.primaryDim, textTransform: "uppercase", letterSpacing: "0.08em" }}>Stats</span>
                      <input value={newItemForm.stats} onChange={(e) => setNewItemForm((p) => ({ ...p, stats: e.target.value }))}
                        placeholder="DMG, AC, etc..." className="w-full bg-transparent border-b outline-none" style={{ borderColor: t.primaryDim + "55", color: t.text, fontSize: "0.7rem" }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 80 }}>
                      <span style={{ fontSize: "0.45rem", color: t.primaryDim, textTransform: "uppercase", letterSpacing: "0.08em" }}>Notes</span>
                      <input value={newItemForm.notes} onChange={(e) => setNewItemForm((p) => ({ ...p, notes: e.target.value }))}
                        placeholder="Notes..." className="w-full bg-transparent border-b outline-none" style={{ borderColor: t.primaryDim + "55", color: t.text, fontSize: "0.7rem" }} />
                    </div>
                    <button onClick={addNewItem} style={{ flexShrink: 0, padding: "4px 10px", borderRadius: 5, background: t.primaryDark, color: t.primaryLight, border: `1px solid ${t.primaryDim}44`, fontSize: "0.6rem", cursor: "pointer" }}>
                      + Add Item
                    </button>
                  </div>
                </Section>
              </div>
            )}

            {/* ══ GENERIC FOLDER CONTENT ══ */}
            {invActiveFolder !== "equipment" && (() => {
              const folder = inventoryFolders.find((f) => f.id === invActiveFolder);
              if (!folder) return null;
              return (
                <div>
                  {/* Folder header */}
                  <Section t={t} title={`${folder.icon} ${folder.name}`} accent={t.accent2}>
                    <div className="flex items-center gap-2 mb-3">
                      {!folder.locked && (
                        <>
                          <input value={folder.name} onChange={(e) => renameFolder(folder.id, e.target.value)}
                            className="bg-transparent border-b outline-none"
                            style={{ borderColor: t.primaryDim + "44", color: t.text, fontSize: "0.75rem", fontWeight: 600, width: 160 }} />
                          <button onClick={() => { if (confirm(`Delete folder "${folder.name}"? Items will be lost.`)) deleteFolder(folder.id); }}
                            className="cursor-pointer px-2 py-0.5 rounded ml-auto"
                            style={{ fontSize: "0.5rem", color: t.dangerLight, background: `${t.danger}11`, border: `1px solid ${t.danger}33` }}>
                            Delete Folder
                          </button>
                        </>
                      )}
                    </div>

                    {/* Items */}
                    {folder.items.length === 0 && (
                      <div style={{ fontSize: "0.75rem", color: t.primaryDim, fontStyle: "italic", padding: "12px 0", textAlign: "center" }}>This folder is empty</div>
                    )}
                    {folder.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-2 mb-1.5 p-2 rounded" style={{ background: "rgba(20,30,20,0.3)", border: `1px solid ${t.primaryDim}22` }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="flex items-center gap-2">
                            <input value={item.name} onChange={(e) => updateInvItem(folder.id, item.id, "name", e.target.value)}
                              className="bg-transparent outline-none font-bold"
                              style={{ border: "none", color: t.text, fontSize: "0.75rem", flex: 1, minWidth: 0 }} />
                            <span style={{ fontSize: "0.55rem", color: t.primaryDim }}>×</span>
                            <input type="number" value={item.qty || 1} onChange={(e) => updateInvItem(folder.id, item.id, "qty", Math.max(1, +e.target.value || 1))}
                              className="bg-transparent border-b outline-none text-center w-8"
                              style={{ borderColor: t.primaryDim + "44", color: t.primaryLight, fontSize: "0.7rem" }} />
                          </div>
                          <input value={item.notes || ""} onChange={(e) => updateInvItem(folder.id, item.id, "notes", e.target.value)}
                            placeholder="Notes..."
                            className="bg-transparent outline-none w-full"
                            style={{ border: "none", color: t.primaryMid, fontSize: "0.65rem", fontStyle: "italic" }} />
                        </div>
                        {/* Move to folder dropdown */}
                        <select
                          value=""
                          onChange={(e) => { if (e.target.value) { moveInvItem(folder.id, item.id, e.target.value); e.target.value = ""; } }}
                          style={{ background: t.bgCard, border: `1px solid ${t.primaryDim}33`, color: t.primaryMid, fontSize: "0.5rem", borderRadius: 4, padding: "2px 4px", width: 70 }}>
                          <option value="">Move to...</option>
                          {inventoryFolders.filter((f) => f.id !== folder.id && f.id !== "equipment").map((f) => (
                            <option key={f.id} value={f.id}>{f.icon} {f.name}</option>
                          ))}
                        </select>
                        <button onClick={() => removeInvItem(folder.id, item.id)} className="cursor-pointer"
                          style={{ fontSize: "0.6rem", color: t.dangerLight + "66", background: "none", border: "none" }}>✕</button>
                      </div>
                    ))}

                    {/* Add item to this folder */}
                    <div className="flex items-center gap-2 mt-3 pt-2" style={{ borderTop: `1px solid ${t.primaryDim}22` }}>
                      <input value={newInvItem.name} onChange={(e) => setNewInvItem((p) => ({ ...p, name: e.target.value }))}
                        placeholder="Item name..." className="bg-transparent border-b outline-none flex-1"
                        style={{ borderColor: t.primaryDim + "44", color: t.text, fontSize: "0.7rem" }}
                        onKeyDown={(e) => { if (e.key === "Enter") addInvItem(folder.id); }} />
                      <input value={newInvItem.notes} onChange={(e) => setNewInvItem((p) => ({ ...p, notes: e.target.value }))}
                        placeholder="Notes..." className="bg-transparent border-b outline-none"
                        style={{ borderColor: t.primaryDim + "44", color: t.primaryMid, fontSize: "0.65rem", width: 120 }} />
                      <input type="number" value={newInvItem.qty} onChange={(e) => setNewInvItem((p) => ({ ...p, qty: Math.max(1, +e.target.value || 1) }))}
                        className="bg-transparent border-b outline-none text-center w-10"
                        style={{ borderColor: t.primaryDim + "44", color: t.primaryLight, fontSize: "0.7rem" }} />
                      <button onClick={() => addInvItem(folder.id)} className="cursor-pointer px-2 py-1 rounded"
                        style={{ background: t.primaryDark, color: t.primaryLight, border: `1px solid ${t.primaryDim}44`, fontSize: "0.6rem", whiteSpace: "nowrap" }}>
                        + Add
                      </button>
                    </div>
                  </Section>
                </div>
              );
            })()}

          </div>
        )}

        {/* ITEMS TAB */}
        {tab === "items" && (() => {
          const activeCat = ITEM_CATALOG.find((c) => c.category === itemsCategory) ?? ITEM_CATALOG[0];
          const query = itemsSearch.trim().toLowerCase();
          const isEnchantments = activeCat.category === "Enchantments" && !query;
          const visibleItems = (() => {
            let items = query
              ? ITEM_CATALOG.flatMap((c) => c.items.filter((i) => i.name.toLowerCase().includes(query) || i.description.toLowerCase().includes(query)))
              : activeCat.items;
            if (isEnchantments && enchantTypeFilter !== "all") {
              items = items.filter((i) => parseEnchType(i.stats) === enchantTypeFilter);
            }
            return items;
          })();
          return (
            <div className="pt-3 tab-content" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {/* Currency */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", padding: "6px 10px", background: "rgba(5,10,5,0.5)", borderRadius: 7, border: `1px solid ${t.primaryDim}33` }}>
                {[["cp", "CP"], ["sp", "SP"], ["gp", "GP"], ["pp", "PP"], ["cr", "Credits"]].map(([key, label]) => (
                  <div key={key} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                    <span style={{ fontSize: "var(--ty-label-size)", color: t.textDim, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</span>
                    <input
                      type="number"
                      value={currency[key] ?? 0}
                      onChange={(e) => setCurrency((p) => ({ ...p, [key]: Number(e.target.value) }))}
                      style={{ width: key === "cr" ? 80 : 52, background: "rgba(5,10,5,0.7)", border: `1px solid ${t.primaryDim}44`, borderRadius: 5, color: t.text, padding: "2px 6px", fontSize: "var(--ty-body-size)", outline: "none", textAlign: "center" }}
                    />
                  </div>
                ))}
              </div>
              {/* Search */}
              <input
                value={itemsSearch}
                onChange={(e) => setItemsSearch(e.target.value)}
                placeholder="Search all items..."
                style={{ width: "100%", background: "rgba(5,10,5,0.7)", border: `1px solid ${t.primaryDim}44`, borderRadius: 6, color: t.text, padding: "5px 10px", fontSize: "var(--ty-body-size)", outline: "none", boxSizing: "border-box" }}
              />
              <div style={{ display: "flex", gap: 8, minHeight: 0 }}>
                {/* Category sidebar — hidden when searching */}
                {!query && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 110, flexShrink: 0 }}>
                    {ITEM_CATALOG.map((cat) => (
                      <button key={cat.category} onClick={() => setItemsCategory(cat.category)}
                        style={{ textAlign: "left", padding: "4px 8px", borderRadius: 5, fontSize: "var(--ty-label-size)", cursor: "pointer", border: "none",
                          background: cat.category === itemsCategory ? `${t.primary}33` : "transparent",
                          color: cat.category === itemsCategory ? t.primary : t.textDim,
                          fontWeight: cat.category === itemsCategory ? 700 : 400 }}>
                        {cat.category}
                      </button>
                    ))}
                  </div>
                )}
                {/* Item list */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4, overflowY: "auto", maxHeight: 420, paddingRight: 2 }}>
                  {/* Enchantment type filter */}
                  {isEnchantments && (
                    <div style={{ display: "flex", gap: 4, marginBottom: 4, flexWrap: "wrap" }}>
                      {[
                        { key: "all", label: "All" },
                        { key: "armor", label: "Armor" },
                        { key: "weapons", label: "Weapons" },
                        { key: "both", label: "Weapons/Armor" },
                      ].map(({ key, label }) => (
                        <button key={key} onClick={() => setEnchantTypeFilter(key)}
                          style={{
                            padding: "2px 10px", borderRadius: 4, fontSize: "var(--ty-label-size)", cursor: "pointer", border: "none",
                            background: enchantTypeFilter === key ? `${t.primary}44` : `${t.primary}11`,
                            color: enchantTypeFilter === key ? t.primaryLight : t.primaryDim,
                            fontWeight: enchantTypeFilter === key ? 700 : 400,
                          }}>
                          {label}
                        </button>
                      ))}
                    </div>
                  )}
                  {visibleItems.length === 0 && (
                    <span style={{ color: t.textDim, fontSize: "var(--ty-body-size)", padding: 8 }}>No items found.</span>
                  )}
                  {visibleItems.map((item) => (
                    <div key={item.name} style={{ background: "rgba(5,10,5,0.6)", border: `1px solid ${t.primaryDim}33`, borderRadius: 7, padding: "6px 10px", display: "flex", alignItems: "flex-start", gap: 8 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                          <span style={{ fontSize: "var(--ty-body-size)", color: t.text, fontWeight: 600 }}>{item.name}</span>
                          <span style={{ fontSize: "var(--ty-label-size)", color: t.primary, fontWeight: 500 }}>{item.price}</span>
                        </div>
                        {item.stats && <div style={{ fontSize: "var(--ty-label-size)", color: t.textDim, marginTop: 1 }}>{item.stats}</div>}
                        {item.description && <div style={{ fontSize: "var(--ty-label-size)", color: t.textDim, marginTop: 1, fontStyle: "italic" }}>{item.description}</div>}
                      </div>
                      <button
                        onClick={() => {
                          const cost = (() => {
                            if (!item.price || item.price === "—") return 0;
                            const match = item.price.replace(/,/g, "").match(/\d+/);
                            return match ? parseInt(match[0], 10) : 0;
                          })();
                          if (activeCat.category === "Enchantments") {
                            const fillsEC = parseEC(item.stats);
                            const enchType = parseEnchType(item.stats);
                            setEnchantPicker({ enchantment: item, cost, fillsEC, enchType });
                            return;
                          }
                          const id = "cat_" + Date.now() + "_" + Math.random().toString(36).slice(2);
                          const weaponCats = ["Light Weapons", "Heavy Weapons", "Finesse Weapons"];
                          const armorCats = ["Armor", "Shields"];
                          const invCategory = weaponCats.includes(activeCat.category) ? "weapons" : armorCats.includes(activeCat.category) ? "armor" : "misc";
                          const ecCap = parseEC(item.stats);
                          setInventory((prev) => [...prev, { id, name: item.name, stats: item.stats, notes: item.description, category: invCategory, bonuses: {}, bonusNotes: {}, ecCap, enchantments: [] }]);
                          if (cost > 0) setCurrency((p) => ({ ...p, cr: Math.max(0, (p.cr ?? 0) - cost) }));
                        }}
                        style={{ flexShrink: 0, padding: "3px 9px", borderRadius: 5, border: `1px solid ${t.primary}66`, background: `${t.primary}22`, color: t.primary, fontSize: "var(--ty-label-size)", cursor: "pointer", whiteSpace: "nowrap" }}>
                        Buy
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}

        {/* NOTES TAB */}
        {tab === "notes" && (
          <div className="pt-3 tab-content">
            {/* Sub-tabs */}
            <div className="flex gap-2 mb-3">
              {[
                { key: "character", label: "📋 Character Notes" },
                { key: "sessions", label: "📖 Session Notes" },
              ].map((st) => (
                <button key={st.key} onClick={() => setNotesSubTab(st.key)} className="px-3 py-1.5 rounded cursor-pointer transition-all duration-200"
                  style={{
                    fontSize: "0.65rem", letterSpacing: "0.08em", fontFamily: "Arial, sans-serif",
                    background: notesSubTab === st.key ? "linear-gradient(135deg, #2d4a30, #3a5a40)" : "rgba(20,30,20,0.3)",
                    color: notesSubTab === st.key ? "#c8e6c9" : "#7a9e7e",
                    border: notesSubTab === st.key ? "1.5px solid #4a7c59" : "1.5px solid #3a5a4044",
                    fontWeight: notesSubTab === st.key ? 700 : 400,
                  }}>
                  {st.label}
                </button>
              ))}
            </div>

            {/* CHARACTER NOTES */}
            {notesSubTab === "character" && (
              <Section t={t} title="Character Notes & Rules Reference" accent="#7a9e7e">
                <TextArea t={t} value={charNotes} onChange={setCharNotes} rows={12} />
              </Section>
            )}

            {/* SESSION NOTES */}
            {notesSubTab === "sessions" && (
              <div>
                {/* Header row: New session + search */}
                <div className="flex gap-3 mb-3 items-center">
                  <button onClick={addSession} className="px-4 py-2 rounded cursor-pointer flex items-center gap-1.5"
                    style={{ background: "linear-gradient(135deg, #2d4a30, #3a5a40)", color: t.primaryLight, border: "1.5px solid #4a7c59", fontFamily: "Arial, sans-serif", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.05em", whiteSpace: "nowrap" }}>
                    + New Session
                  </button>
                  <div style={{ flex: 1, position: "relative" }}>
                    <input
                      type="text"
                      value={sessionSearch}
                      onChange={(e) => setSessionSearch(e.target.value)}
                      placeholder="Search across all sessions..."
                      className="w-full bg-transparent outline-none px-3 py-2 rounded"
                      style={{ border: "1.5px solid #3a5a4066", color: t.text, fontSize: "0.8rem", fontFamily: "Arial, sans-serif", background: "rgba(20,30,20,0.4)" }}
                    />
                    {sessionSearch && (
                      <button onClick={() => setSessionSearch("")} className="cursor-pointer"
                        style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: t.primaryMid, fontSize: "0.8rem" }}>
                        ✕
                      </button>
                    )}
                  </div>
                  <span style={{ fontSize: "0.6rem", color: "#7a9e7e88", whiteSpace: "nowrap" }}>{sessionNotes.length} session{sessionNotes.length !== 1 ? "s" : ""}</span>
                </div>

                {/* Search results */}
                {searchResults && (
                  <Section t={t} title={`Search Results — "${sessionSearch}" (${searchResults.length} found)`} accent="#f0d060">
                    {searchResults.length === 0 && (
                      <div style={{ fontSize: "0.8rem", color: "#7a9e7e88", fontStyle: "italic", padding: "8px 0" }}>No matches found across session notes.</div>
                    )}
                    {searchResults.map((r) => (
                      <div key={r.session.id}
                        className="mb-2 p-2 rounded cursor-pointer"
                        onClick={() => { setSessionSearch(""); setExpandedSession(r.session.id); }}
                        style={{ background: "rgba(240,208,96,0.05)", border: "1px solid #f0d06033", transition: "background 0.15s" }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "rgba(240,208,96,0.1)"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "rgba(240,208,96,0.05)"}>
                        <div className="flex items-center justify-between mb-1">
                          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#f0d060", fontFamily: "Arial, sans-serif" }}>{r.session.title}</span>
                          {r.session.date && <span style={{ fontSize: "0.6rem", color: "#7a9e7e88" }}>{r.session.date}</span>}
                        </div>
                        {r.matches.map((m, mi) => (
                          <div key={mi} style={{ fontSize: "0.7rem", color: "#c8c0b0", marginTop: 2, lineHeight: 1.4 }}>
                            {m.field === "content" ? (
                              <span>
                                {m.text.slice(0, m.matchStart)}
                                <mark style={{ background: "#f0d06044", color: "#f0d060", borderRadius: 2, padding: "0 1px" }}>{m.text.slice(m.matchStart, m.matchStart + m.matchLen)}</mark>
                                {m.text.slice(m.matchStart + m.matchLen)}
                              </span>
                            ) : (
                              <span style={{ color: t.primaryMid }}>{m.field}: {m.text}</span>
                            )}
                          </div>
                        ))}
                        <div style={{ fontSize: "0.55rem", color: "#4a7c5988", marginTop: 4 }}>Click to open this session</div>
                      </div>
                    ))}
                  </Section>
                )}

                {/* Session cards */}
                {!searchResults && sessionNotes.map((session) => {
                  const isExpanded = expandedSession === session.id;
                  return (
                    <div key={session.id} className="mb-2 rounded-lg overflow-hidden" style={{ border: isExpanded ? "1.5px solid #4a7c59" : "1.5px solid #3a5a4044", background: "rgba(20,30,20,0.5)", transition: "all 0.2s" }}>
                      {/* Card header — always visible */}
                      <div
                        className="flex items-center gap-3 px-3 py-2 cursor-pointer"
                        onClick={() => setExpandedSession(isExpanded ? null : session.id)}
                        style={{ background: isExpanded ? "rgba(74,124,89,0.08)" : "transparent", transition: "background 0.15s" }}
                        onMouseEnter={(e) => { if (!isExpanded) e.currentTarget.style.background = "rgba(74,124,89,0.04)"; }}
                        onMouseLeave={(e) => { if (!isExpanded) e.currentTarget.style.background = "transparent"; }}>
                        <span style={{ fontSize: "0.7rem", color: isExpanded ? "#c8e6c9" : "#7a9e7e", transition: "transform 0.2s", display: "inline-block", transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)" }}>▶</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          {isExpanded ? (
                            <input value={session.title}
                              onChange={(e) => updateSession(session.id, "title", e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              className="bg-transparent outline-none w-full"
                              style={{ fontSize: "0.8rem", fontWeight: 700, color: t.primaryLight, border: "none", borderBottom: "1px solid #4a7c5944", fontFamily: "Arial, sans-serif" }} />
                          ) : (
                            <span style={{ fontSize: "0.8rem", fontWeight: 600, color: t.text, fontFamily: "Arial, sans-serif" }}>{session.title || "Untitled Session"}</span>
                          )}
                        </div>
                        {isExpanded ? (
                          <input type="date" value={session.date}
                            onChange={(e) => updateSession(session.id, "date", e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-transparent outline-none"
                            style={{ fontSize: "0.6rem", color: t.primaryMid, border: "1px solid #3a5a4044", borderRadius: 4, padding: "2px 4px", fontFamily: "Arial, sans-serif", colorScheme: "dark" }} />
                        ) : (
                          <span style={{ fontSize: "0.6rem", color: "#7a9e7e88" }}>{session.date || "No date"}</span>
                        )}
                        {isExpanded && (
                          <button onClick={(e) => { e.stopPropagation(); if (confirm("Delete this session note?")) deleteSession(session.id); }}
                            className="cursor-pointer px-2 py-0.5 rounded"
                            style={{ fontSize: "0.55rem", color: "#ce6b6b", background: "rgba(206,107,107,0.08)", border: "1px solid #ce6b6b33" }}>
                            Delete
                          </button>
                        )}
                      </div>

                      {/* Expanded content */}
                      {isExpanded && (
                        <div className="px-3 pb-3">
                          <textarea
                            value={session.content}
                            onChange={(e) => updateSession(session.id, "content", e.target.value)}
                            rows={10}
                            className="w-full bg-transparent outline-none rounded px-2 py-2 resize-y"
                            style={{ border: "1.5px solid #3a5a4044", color: t.text, fontSize: "0.8rem", fontFamily: "Arial, sans-serif", lineHeight: 1.6, background: "rgba(0,0,0,0.15)", minHeight: 120 }}
                            placeholder="Write your session notes here..."
                          />
                          <div style={{ fontSize: "0.55rem", color: "#3a5a40", marginTop: 4 }}>
                            {session.content.length} characters · {session.content.split(/\s+/).filter(Boolean).length} words
                          </div>
                        </div>
                      )}

                      {/* Collapsed preview */}
                      {!isExpanded && session.content && (
                        <div className="px-3 pb-2" style={{ paddingLeft: "2rem" }}>
                          <span style={{ fontSize: "0.7rem", color: "#7a9e7e66", fontStyle: "italic" }}>
                            {session.content.slice(0, 120)}{session.content.length > 120 ? "..." : ""}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ═══ ENCHANTMENT PICKER MODAL ═══ */}
    {enchantPicker && (() => {
      const { enchantment, cost, fillsEC, enchType } = enchantPicker;
      const compatibleItems = inventory.filter((i) => {
        const isWeapon = i.category === "weapons";
        const isArmor = i.category === "armor";
        if (enchType === "weapons" && !isWeapon) return false;
        if (enchType === "armor" && !isArmor) return false;
        if (enchType === "both" && !isWeapon && !isArmor) return false;
        return (i.ecCap || 0) > 0;
      });
      return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={(e) => { if (e.target === e.currentTarget) setEnchantPicker(null); }}>
          <div style={{ background: "#0d1a0d", border: "1.5px solid #4a7c59", borderRadius: 10, padding: "20px 24px", width: 400, maxWidth: "90vw", maxHeight: "80vh", display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: "0.9rem", color: "#c8e6c9", fontWeight: 700 }}>{enchantment.name}</div>
                <div style={{ fontSize: "0.6rem", color: "#4a7c59", marginTop: 2 }}>{enchantment.stats}</div>
                <div style={{ fontSize: "0.6rem", color: "#7a9e7e", marginTop: 2, fontStyle: "italic" }}>{enchantment.description}</div>
              </div>
              <button onClick={() => setEnchantPicker(null)}
                style={{ background: "none", border: "none", color: "#ce6b6b88", fontSize: "1rem", cursor: "pointer", padding: 0, lineHeight: 1 }}>✕</button>
            </div>
            <div style={{ fontSize: "0.6rem", color: "#7a9e7e", borderTop: "1px solid #3a5a4033", paddingTop: 8 }}>
              Select which item to enchant. This uses <strong style={{ color: "#c8e6c9" }}>{fillsEC} EC</strong>.
              {enchType === "armor" && " (Armor enchantments only)"}
              {enchType === "weapons" && " (Weapon enchantments only)"}
            </div>
            {/* Item list */}
            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
              {compatibleItems.length === 0 && (
                <div style={{ color: "#7a9e7e66", fontSize: "0.65rem", fontStyle: "italic", textAlign: "center", padding: 12 }}>
                  No compatible items in your inventory with available EC.
                  {enchType === "armor" ? " Buy some armor or shields first." : enchType === "weapons" ? " Buy some weapons first." : " Buy a weapon or armor first."}
                </div>
              )}
              {compatibleItems.map((i) => {
                const usedEC = (i.enchantments || []).reduce((sum, e) => sum + (e.fillsEC || 0), 0);
                const remainEC = i.ecCap - usedEC;
                const canFit = remainEC >= fillsEC;
                return (
                  <button key={i.id} disabled={!canFit}
                    onClick={() => {
                      const enchId = "ench_" + Date.now() + "_" + Math.random().toString(36).slice(2);
                      setInventory((prev) => prev.map((inv) =>
                        inv.id === i.id
                          ? { ...inv, enchantments: [...(inv.enchantments || []), { id: enchId, name: enchantment.name, fillsEC, description: enchantment.description }] }
                          : inv
                      ));
                      if (cost > 0) setCurrency((p) => ({ ...p, cr: Math.max(0, (p.cr ?? 0) - cost) }));
                      setEnchantPicker(null);
                    }}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "8px 12px", borderRadius: 7,
                      background: canFit ? "rgba(74,124,89,0.1)" : "rgba(206,107,107,0.05)",
                      border: canFit ? "1px solid #4a7c5944" : "1px solid #ce6b6b22",
                      cursor: canFit ? "pointer" : "not-allowed",
                      opacity: canFit ? 1 : 0.5,
                      textAlign: "left",
                    }}>
                    <div>
                      <div style={{ fontSize: "0.7rem", color: "#c8e6c9", fontWeight: 600 }}>{i.name}</div>
                      <div style={{ fontSize: "0.55rem", color: "#7a9e7e", marginTop: 1 }}>
                        {(i.enchantments || []).map((e) => e.name).join(", ") || "No enchantments"}
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 8 }}>
                      <div style={{ fontSize: "0.6rem", fontWeight: 700, color: canFit ? "#4a7c59" : "#ce6b6b" }}>{remainEC}/{i.ecCap} EC free</div>
                      {!canFit && <div style={{ fontSize: "0.5rem", color: "#ce6b6b88" }}>needs {fillsEC} EC</div>}
                    </div>
                  </button>
                );
              })}
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, borderTop: "1px solid #3a5a4033", paddingTop: 8 }}>
              <div style={{ fontSize: "0.6rem", color: "#7a9e7e", alignSelf: "center" }}>Cost: {enchantment.price}</div>
              <button onClick={() => setEnchantPicker(null)}
                style={{ padding: "5px 14px", borderRadius: 5, background: "transparent", color: "#7a9e7e", border: "1px solid #3a5a4066", fontSize: "0.65rem", cursor: "pointer" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      );
    })()}
    </div>
  );
}

/* ═══════════════════════════════════════
   LOGIN SCREEN
   ═══════════════════════════════════════ */
function LoginScreen() {
  const p = THEME_PRESETS.forest;
  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(160deg, ${p.bgDark} 0%, ${p.bgMid} 50%, ${p.bgDark} 100%)`, fontFamily: "Arial, sans-serif", color: p.text, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 24 }}>
      <div style={{ fontSize: "3rem" }}>📜</div>
      <h1 style={{ fontSize: "1.4rem", fontWeight: 700, color: p.primaryLight, letterSpacing: "0.15em", textTransform: "uppercase", margin: 0 }}>D&D Character Sheets</h1>
      <p style={{ fontSize: "0.7rem", color: p.primaryMid, letterSpacing: "0.1em", margin: 0 }}>Sign in to manage your characters</p>
      <SignInButton mode="modal">
        <button className="cursor-pointer px-6 py-3 rounded-lg"
          style={{ background: `linear-gradient(135deg, ${p.primaryDark}, ${p.primaryDim})`, color: p.primaryLight, border: `1.5px solid ${p.primary}`, fontSize: "0.8rem", fontWeight: 700, letterSpacing: "0.08em", fontFamily: "Arial, sans-serif" }}>
          Sign In to Continue
        </button>
      </SignInButton>
    </div>
  );
}

/* ═══════════════════════════════════════
   AUTHENTICATED APP — CHARACTER ROUTING
   ═══════════════════════════════════════ */
async function extractPdfText(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const parts = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    parts.push(content.items.map((item) => item.str).join(" "));
  }
  return parts.join("\n");
}

function AuthenticatedApp() {
  const [activeCharacterId, setActiveCharacterId] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState(null);
  const characters = useQuery(api.characters.list) ?? [];
  const createCharacter = useMutation(api.characters.create);
  const deleteCharacter = useMutation(api.characters.remove);
  const parseCharacterSheet = useAction(api.ai.parseCharacterSheet);

  const handleCreate = async (seed) => {
    const defaults = seed || BLANK_CHARACTER;
    const id = await createCharacter({ defaults });
    setActiveCharacterId(id);
  };

  const handleDelete = async (id) => {
    await deleteCharacter({ characterId: id });
    if (activeCharacterId === id) setActiveCharacterId(null);
  };

  const handleImportPDF = async (file) => {
    setImporting(true);
    setImportError(null);
    try {
      const pdfText = await extractPdfText(file);
      const parsed = await parseCharacterSheet({ pdfText });
      // Merge parsed data onto BLANK_CHARACTER so all required fields are present
      const defaults = {
        ...BLANK_CHARACTER,
        info: { ...BLANK_CHARACTER.info, ...(parsed.info || {}) },
        hp: { ...BLANK_CHARACTER.hp, ...(parsed.hp || {}) },
        currency: { ...BLANK_CHARACTER.currency, ...(parsed.currency || {}) },
        charNotes: parsed.charNotes || "",
        skills: Object.keys(parsed.skills || {}).length > 0
          ? { ...BLANK_CHARACTER.skills, ...parsed.skills }
          : BLANK_CHARACTER.skills,
        inventory: Array.isArray(parsed.inventory) ? parsed.inventory : [],
      };
      const id = await createCharacter({ defaults });
      setActiveCharacterId(id);
    } catch (err) {
      console.error("PDF import failed:", err);
      setImportError(err.message || "Import failed. Please try again.");
    } finally {
      setImporting(false);
    }
  };

  if (activeCharacterId) {
    return (
      <CharacterSheet
        characterId={activeCharacterId}
        onBack={() => setActiveCharacterId(null)}
      />
    );
  }

  return (
    <div>
      {importError && (
        <div style={{ position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)", zIndex: 2000, background: "#3a1a1a", border: "1.5px solid #c0392b", color: "#f1948a", borderRadius: 8, padding: "10px 20px", fontSize: "0.75rem", fontFamily: "Arial, sans-serif", maxWidth: 500, textAlign: "center" }}>
          {importError}
          <button onClick={() => setImportError(null)} style={{ marginLeft: 12, background: "none", border: "none", color: "#f1948a", cursor: "pointer", fontSize: "0.85rem" }}>✕</button>
        </div>
      )}
      {importing && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1500, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#1a2a1a", border: "1.5px solid #4a7c59", borderRadius: 12, padding: "32px 48px", textAlign: "center", fontFamily: "Arial, sans-serif" }}>
            <div style={{ fontSize: "1.5rem", marginBottom: 12 }}>📄</div>
            <div style={{ color: "#c8e6c9", fontSize: "0.9rem", letterSpacing: "0.08em" }}>Parsing character sheet...</div>
            <div style={{ color: "#7a9e7e", fontSize: "0.7rem", marginTop: 8 }}>This may take a moment</div>
          </div>
        </div>
      )}
      <CharacterSelectScreen
        characters={characters.map((c) => ({
          id: c._id,
          name: c.info.name,
          race: c.info.race,
          class_: c.info.class_,
          level: c.info.level,
        }))}
        onCreate={() => handleCreate()}
        onOpen={setActiveCharacterId}
        onDelete={handleDelete}
        onImportPDF={handleImportPDF}
      />
      {/* Seed Hugh Jass button — only shows if no characters exist */}
      {characters.length === 0 && (
        <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)" }}>
          <button onClick={() => handleCreate(HUGH_JASS_SEED)}
            className="cursor-pointer px-4 py-2 rounded-lg"
            style={{ background: "linear-gradient(135deg, #2d4a30, #3a5a40)", color: "#c8e6c9", border: "1.5px solid #4a7c59", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.05em", fontFamily: "Arial, sans-serif", boxShadow: "0 4px 20px rgba(0,0,0,0.6)" }}>
            Import Hugh Jass PhD (Existing Character)
          </button>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════
   TOP-LEVEL APP — AUTH GATE
   ═══════════════════════════════════════ */
export default function App() {
  const { isSignedIn, isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #0d1a0d 0%, #111a11 50%, #0d1a0d 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#7a9e7e", fontSize: "1rem", letterSpacing: "0.15em" }}>Loading...</div>
      </div>
    );
  }

  if (!isSignedIn) return <LoginScreen />;
  return <AuthenticatedApp />;
}
