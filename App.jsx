import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://swmdawmqxvhdvuxkukjj.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3bWRhd21xeHZoZHZ1eGt1a2pqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIxNDgzMjUsImV4cCI6MjA5NzcyNDMyNX0.bUSmchEqeeKAzz7kzytRbCPyH7Nab0awcUoDGhjXVbM";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const DEFAULT_TEAM = [
  { id: "a1", name: "Associé 1", color: "#2D6A4F", initials: "A1" },
  { id: "a2", name: "Associé 2", color: "#1B4332", initials: "A2" },
  { id: "s1", name: "Salarié", color: "#74C69D", initials: "SA" },
];
const CATEGORIES = [
  { id: "cultures", label: "Cultures", icon: "🌾" },
  { id: "elevage", label: "Élevage", icon: "🐄" },
  { id: "materiel", label: "Matériel", icon: "🚜" },
  { id: "admin", label: "Administratif", icon: "📋" },
  { id: "autre", label: "Autre", icon: "📌" },
];
const PRIORITIES = [
  { id: "urgent", label: "Urgent", color: "#E63946" },
  { id: "normal", label: "Normal", color: "#F4A261" },
  { id: "faible", label: "Faible", color: "#74C69D" },
];
const DAYS_FR = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

function getWeekDays(baseDate) {
  const d = new Date(baseDate);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return Array.from({ length: 7 }, (_, i) => { const dd = new Date(d); dd.setDate(d.getDate() + i); return dd; });
}
function fmt(date) { return date.toISOString().split("T")[0]; }

// ─── AUTH SCREENS ───────────────────────────────────────────────────────────

function LoginScreen({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true); setMsg(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setMsg({ type: "error", text: "Email ou mot de passe incorrect." });
    setLoading(false);
  };

  const handleRegister = async () => {
    if (!name.trim()) { setMsg({ type: "error", text: "Entre ton prénom." }); return; }
    setLoading(true); setMsg(null);
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) { setMsg({ type: "error", text: error.message }); setLoading(false); return; }
    if (data.user) {
      await supabase.from("profiles").update({ name }).eq("id", data.user.id);
      setMsg({ type: "success", text: "Compte créé ! En attente de validation par l'administrateur." });
    }
    setLoading(false);
  };

  return (
    <div style={s.authWrap}>
      <div style={s.authCard}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 48 }}>🌾</div>
          <div style={{ fontSize: 22, fontWeight: "bold", color: "#1B4332" }}>FermeOrga</div>
          <div style={{ fontSize: 13, color: "#888", fontFamily: "sans-serif" }}>Gestion des tâches</div>
        </div>
        <div style={s.authTabs}>
          <button style={{ ...s.authTab, borderBottom: mode === "login" ? "2px solid #2D6A4F" : "2px solid transparent", color: mode === "login" ? "#2D6A4F" : "#888" }} onClick={() => setMode("login")}>Connexion</button>
          <button style={{ ...s.authTab, borderBottom: mode === "register" ? "2px solid #2D6A4F" : "2px solid transparent", color: mode === "register" ? "#2D6A4F" : "#888" }} onClick={() => setMode("register")}>Inscription</button>
        </div>
        {mode === "register" && (
          <div style={s.formGroup}>
            <label style={s.label}>Ton prénom</label>
            <input style={s.input} value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Pierre" />
          </div>
        )}
        <div style={s.formGroup}>
          <label style={s.label}>Email</label>
          <input style={s.input} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="ton@email.com" />
        </div>
        <div style={s.formGroup}>
          <label style={s.label}>Mot de passe</label>
          <input style={s.input} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" onKeyDown={e => e.key === "Enter" && (mode === "login" ? handleLogin() : handleRegister())} />
        </div>
        {msg && <div style={{ ...s.msg, background: msg.type === "error" ? "#fdecea" : "#e8f5e9", color: msg.type === "error" ? "#E63946" : "#2D6A4F" }}>{msg.text}</div>}
        <button style={s.authBtn} onClick={mode === "login" ? handleLogin : handleRegister} disabled={loading}>
          {loading ? "..." : mode === "login" ? "Se connecter" : "Créer mon compte"}
        </button>
      </div>
    </div>
  );
}

function PendingScreen({ onLogout }) {
  return (
    <div style={s.authWrap}>
      <div style={s.authCard}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48 }}>⏳</div>
          <h2 style={{ color: "#1B4332" }}>En attente de validation</h2>
          <p style={{ fontFamily: "sans-serif", color: "#666", lineHeight: 1.6 }}>
            Ton compte a été créé. L'administrateur doit le valider avant que tu puisses accéder à l'application.<br /><br />
            Demande-lui de se connecter et de valider ton accès.
          </p>
          <button style={{ ...s.authBtn, marginTop: 20, background: "#ccc" }} onClick={onLogout}>Se déconnecter</button>
        </div>
      </div>
    </div>
  );
}

function AdminPanel({ profiles, onValidate, onLogout }) {
  const pending = profiles.filter(p => p.role === "pending");
  const members = profiles.filter(p => p.role !== "pending");
  return (
    <div style={s.authWrap}>
      <div style={{ ...s.authCard, maxWidth: 560 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ margin: 0, color: "#1B4332" }}>⚙️ Validation des accès</h2>
          <button style={{ background: "none", border: "none", cursor: "pointer", color: "#888", fontFamily: "sans-serif" }} onClick={onLogout}>Déconnexion</button>
        </div>
        {pending.length === 0 ? (
          <div style={{ fontFamily: "sans-serif", color: "#888", marginBottom: 20 }}>✅ Aucun compte en attente.</div>
        ) : (
          <>
            <div style={{ fontFamily: "sans-serif", fontWeight: "bold", color: "#E63946", marginBottom: 10 }}>🔔 En attente de validation ({pending.length})</div>
            {pending.map(p => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "#fff8e1", borderRadius: 10, marginBottom: 8 }}>
                <div>
                  <div style={{ fontFamily: "sans-serif", fontWeight: "bold" }}>{p.name || "Sans nom"}</div>
                  <div style={{ fontFamily: "sans-serif", fontSize: 12, color: "#888" }}>{p.email}</div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button style={{ ...s.authBtn, padding: "6px 14px", fontSize: 12, margin: 0 }} onClick={() => onValidate(p.id, "member")}>✓ Valider</button>
                  <button style={{ ...s.authBtn, padding: "6px 14px", fontSize: 12, margin: 0, background: "#E63946" }} onClick={() => onValidate(p.id, "rejected")}>✗ Refuser</button>
                </div>
              </div>
            ))}
          </>
        )}
        <div style={{ fontFamily: "sans-serif", fontWeight: "bold", color: "#2D6A4F", margin: "16px 0 10px" }}>👥 Membres actifs</div>
        {members.map(p => (
          <div key={p.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 14px", background: "#f8faf8", borderRadius: 10, marginBottom: 6 }}>
            <div>
              <div style={{ fontFamily: "sans-serif", fontWeight: "bold" }}>{p.name || "Sans nom"} {p.role === "admin" ? "👑" : ""}</div>
              <div style={{ fontFamily: "sans-serif", fontSize: 12, color: "#888" }}>{p.email}</div>
            </div>
            <span style={{ fontFamily: "sans-serif", fontSize: 11, color: "#74C69D", fontWeight: "bold" }}>{p.role}</span>
          </div>
        ))}
        <button style={{ ...s.authBtn, marginTop: 20, background: "#2D6A4F" }} onClick={() => onValidate(null, "continue")}>Accéder à l'application →</button>
      </div>
    </div>
  );
}

// ─── MAIN APP ────────────────────────────────────────────────────────────────

export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [team, setTeam] = useState(DEFAULT_TEAM);
  const [filter, setFilter] = useState({ assignee: "all", category: "all", done: "active" });
  const [showForm, setShowForm] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [view, setView] = useState("board");
  const [weekBase, setWeekBase] = useState(new Date());
  const [showSettings, setShowSettings] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [memberNameEdit, setMemberNameEdit] = useState("");
  const [form, setForm] = useState({ title: "", category: "cultures", priority: "normal", assignee: "a1", dueDate: "", notes: "" });
  const [loading, setLoading] = useState(true);

  // Auth listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => { setSession(session); if (!session) setLoading(false); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  // Load profile when session changes
  useEffect(() => {
    if (!session) { setProfile(null); setLoading(false); return; }
    loadProfile();
  }, [session]);

  const loadProfile = async () => {
    const { data } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
    setProfile(data);
    if (data?.role === "admin") loadAllProfiles();
    if (data?.role === "admin" || data?.role === "member") { loadTasks(); loadTeam(); }
    setLoading(false);
  };

  const loadAllProfiles = async () => {
    const { data } = await supabase.from("profiles").select("*").order("created_at");
    if (data) setProfiles(data);
  };

  const loadTasks = async () => {
    const { data } = await supabase.from("tasks").select("*").order("created_at", { ascending: false });
    if (data) setTasks(data.map(t => ({ ...t, dueDate: t.due_date, done: t.done })));
  };

  const loadTeam = async () => {
    const { data } = await supabase.from("team_config").select("*");
    if (data && data.length > 0) setTeam(data);
  };

  // Realtime subscription
  useEffect(() => {
    if (!profile || (profile.role !== "admin" && profile.role !== "member")) return;
    const channel = supabase.channel("tasks-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, () => loadTasks())
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [profile]);

  const handleValidate = async (userId, action) => {
    if (action === "continue") { setShowAdminPanel(false); return; }
    if (userId) await supabase.from("profiles").update({ role: action }).eq("id", userId);
    loadAllProfiles();
  };

  const handleLogout = () => supabase.auth.signOut();

  const resetForm = () => setForm({ title: "", category: "cultures", priority: "normal", assignee: "a1", dueDate: "", notes: "" });
  const openAdd = (date) => { resetForm(); if (date) setForm(f => ({ ...f, dueDate: date })); setEditTask(null); setShowForm(true); };
  const openEdit = (task) => { setForm({ title: task.title, category: task.category, priority: task.priority, assignee: task.assignee, dueDate: task.dueDate || task.due_date || "", notes: task.notes || "" }); setEditTask(task.id); setShowForm(true); };

  const saveTask = async () => {
    if (!form.title.trim()) return;
    const payload = { title: form.title, category: form.category, priority: form.priority, assignee: form.assignee, due_date: form.dueDate || null, notes: form.notes, done: false };
    if (editTask) {
      await supabase.from("tasks").update(payload).eq("id", editTask);
    } else {
      await supabase.from("tasks").insert(payload);
    }
    setShowForm(false); resetForm(); loadTasks();
  };

  const toggleDone = async (id, currentDone) => {
    await supabase.from("tasks").update({ done: !currentDone }).eq("id", id);
    loadTasks();
  };

  const deleteTask = async (id) => {
    await supabase.from("tasks").delete().eq("id", id);
    loadTasks();
  };

  const saveMemberName = async () => {
    if (!memberNameEdit.trim()) return;
    const updated = { name: memberNameEdit.trim(), initials: memberNameEdit.trim().slice(0, 2).toUpperCase() };
    await supabase.from("team_config").update(updated).eq("id", editingMember);
    setTeam(t => t.map(m => m.id === editingMember ? { ...m, ...updated } : m));
    setEditingMember(null);
  };

  const getMember = (id) => team.find(m => m.id === id) || team[0];
  const getCategory = (id) => CATEGORIES.find(c => c.id === id) || CATEGORIES[0];
  const getPriority = (id) => PRIORITIES.find(p => p.id === id) || PRIORITIES[1];
  const isOverdue = (date) => date && new Date(date) < new Date(new Date().toDateString());

  const filtered = tasks.filter(t => {
    if (filter.assignee !== "all" && t.assignee !== filter.assignee) return false;
    if (filter.category !== "all" && t.category !== filter.category) return false;
    if (filter.done === "active" && t.done) return false;
    if (filter.done === "done" && !t.done) return false;
    return true;
  });

  const stats = { total: tasks.length, done: tasks.filter(t => t.done).length, urgent: tasks.filter(t => t.priority === "urgent" && !t.done).length };
  const chargeByMember = team.map(m => ({ ...m, total: tasks.filter(t => t.assignee === m.id && !t.done).length, urgent: tasks.filter(t => t.assignee === m.id && !t.done && t.priority === "urgent").length }));
  const weekDays = getWeekDays(weekBase);
  const prevWeek = () => { const d = new Date(weekBase); d.setDate(d.getDate() - 7); setWeekBase(d); };
  const nextWeek = () => { const d = new Date(weekBase); d.setDate(d.getDate() + 7); setWeekBase(d); };

  // ── RENDER STATES ──
  if (loading) return <div style={s.authWrap}><div style={{ textAlign: "center", color: "#2D6A4F", fontFamily: "sans-serif" }}>🌾 Chargement...</div></div>;
  if (!session) return <LoginScreen />;
  if (!profile || profile.role === "pending") return <PendingScreen onLogout={handleLogout} />;
  if (profile.role === "admin" && showAdminPanel) return <AdminPanel profiles={profiles} onValidate={handleValidate} onLogout={handleLogout} />;

  return (
    <div style={s.app}>
      <header style={s.header}>
        <div style={s.headerLeft}><span style={s.logo}>🌾</span><div><div style={s.logoTitle}>FermeOrga</div><div style={s.logoSub}>Gestion des tâches</div></div></div>
        <div style={s.statsRow}>
          <div style={s.statBox}><span style={s.statNum}>{stats.total - stats.done}</span><span style={s.statLabel}>En cours</span></div>
          <div style={{ ...s.statBox, borderColor: "#E63946" }}><span style={{ ...s.statNum, color: "#E63946" }}>{stats.urgent}</span><span style={s.statLabel}>Urgents</span></div>
          <div style={{ ...s.statBox, borderColor: "#74C69D" }}><span style={{ ...s.statNum, color: "#74C69D" }}>{stats.done}</span><span style={s.statLabel}>Terminés</span></div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontFamily: "sans-serif", fontSize: 12, color: "rgba(255,255,255,0.7)" }}>{profile.name || profile.email}</span>
          {profile.role === "admin" && <button style={s.settingsBtn} onClick={() => { loadAllProfiles(); setShowAdminPanel(true); }}>👥 Équipe</button>}
          <button style={s.settingsBtn} onClick={() => setShowSettings(true)}>⚙️ Noms</button>
          <button style={{ ...s.settingsBtn, background: "rgba(255,255,255,0.1)" }} onClick={handleLogout}>Déconnexion</button>
          <button style={s.addBtn} onClick={() => openAdd()}>+ Nouvelle tâche</button>
        </div>
      </header>

      <div style={s.chargeBar}>
        <span style={s.chargeTitle}>Charge :</span>
        {chargeByMember.map(m => (
          <div key={m.id} style={s.chargeItem}>
            <div style={{ ...s.avatar, background: m.color }}>{m.initials}</div>
            <div>
              <div style={s.chargeName}>{m.name}</div>
              <div style={s.chargeBars}>
                <div style={s.chargeBarBg}><div style={{ ...s.chargeBarFill, width: `${Math.min(m.total * 12, 100)}%`, background: m.total > 5 ? "#E63946" : m.total > 3 ? "#F4A261" : "#74C69D" }} /></div>
                <span style={s.chargeCount}>{m.total} tâche{m.total > 1 ? "s" : ""}{m.urgent > 0 ? ` · ${m.urgent}⚠️` : ""}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={s.navBar}>
        <div style={s.viewBtns}>
          {[{ id: "board", label: "🗂️ Tableau" }, { id: "calendar", label: "📅 Semaine" }].map(v => (
            <button key={v.id} style={{ ...s.viewBtn, background: view === v.id ? "#2D6A4F" : "transparent", color: view === v.id ? "#fff" : "#2D6A4F" }} onClick={() => setView(v.id)}>{v.label}</button>
          ))}
        </div>
        <div style={s.filterBtnsRow}>
          <select style={s.sel} value={filter.assignee} onChange={e => setFilter(f => ({ ...f, assignee: e.target.value }))}>
            <option value="all">Toute l'équipe</option>
            {team.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
          <select style={s.sel} value={filter.category} onChange={e => setFilter(f => ({ ...f, category: e.target.value }))}>
            <option value="all">Toutes catégories</option>
            {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
          </select>
          <select style={s.sel} value={filter.done} onChange={e => setFilter(f => ({ ...f, done: e.target.value }))}>
            <option value="active">En cours</option>
            <option value="done">Terminées</option>
            <option value="all">Toutes</option>
          </select>
        </div>
      </div>

      {view === "board" && (
        <div style={s.taskGrid}>
          {filtered.length === 0 && <div style={s.empty}>✅ Aucune tâche dans cette vue</div>}
          {[...filtered].sort((a, b) => { const po = { urgent: 0, normal: 1, faible: 2 }; return (po[a.priority] - po[b.priority]) || ((a.dueDate || a.due_date || "9").localeCompare(b.dueDate || b.due_date || "9")); }).map(task => {
            const member = getMember(task.assignee); const cat = getCategory(task.category); const prio = getPriority(task.priority);
            const td = task.dueDate || task.due_date; const overdue = !task.done && isOverdue(td);
            return (
              <div key={task.id} style={{ ...s.card, opacity: task.done ? 0.55 : 1, borderLeft: `4px solid ${prio.color}` }}>
                <div style={s.cardTop}>
                  <div style={s.cardMeta}><span style={{ ...s.badge, background: prio.color + "22", color: prio.color }}>{prio.label}</span><span style={s.catBadge}>{cat.icon} {cat.label}</span></div>
                  <div style={s.cardActions}><button style={s.iconBtn} onClick={() => openEdit(task)}>✏️</button><button style={s.iconBtn} onClick={() => deleteTask(task.id)}>🗑️</button></div>
                </div>
                <div style={{ ...s.cardTitle, textDecoration: task.done ? "line-through" : "none" }}>{task.title}</div>
                {task.notes && <div style={s.cardNotes}>{task.notes}</div>}
                <div style={s.cardBottom}>
                  <div style={{ ...s.avatar, background: member.color }}>{member.initials}</div>
                  <span style={s.memberName}>{member.name}</span>
                  {td && <span style={{ ...s.dueDate, color: overdue ? "#E63946" : "#888" }}>{overdue ? "⚠️ " : "📅 "}{new Date(td + "T12:00:00").toLocaleDateString("fr-FR")}</span>}
                  <button style={{ ...s.doneBtn, background: task.done ? "#74C69D" : "#e8f5e9", color: task.done ? "#fff" : "#2D6A4F" }} onClick={() => toggleDone(task.id, task.done)}>{task.done ? "✓ Fait" : "Marquer fait"}</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {view === "calendar" && (
        <div style={s.calWrap}>
          <div style={s.calHeader}>
            <button style={s.calNavBtn} onClick={prevWeek}>‹ Préc.</button>
            <span style={s.calTitle}>Semaine du {weekDays[0].toLocaleDateString("fr-FR", { day: "numeric", month: "long" })} au {weekDays[6].toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</span>
            <button style={s.calNavBtn} onClick={nextWeek}>Suiv. ›</button>
          </div>
          <div style={s.calGrid}>
            {weekDays.map((day, i) => {
              const dayStr = fmt(day); const isToday = dayStr === fmt(new Date());
              const dayTasks = tasks.filter(t => (t.dueDate || t.due_date) === dayStr && (filter.assignee === "all" || t.assignee === filter.assignee));
              return (
                <div key={i} style={{ ...s.calCol, background: isToday ? "#e8f5e9" : "#fff", borderTop: `3px solid ${isToday ? "#2D6A4F" : "#e0e8e0"}` }}>
                  <div style={s.calDayLabel}><span style={s.calDayName}>{DAYS_FR[i]}</span><span style={{ ...s.calDayNum, fontWeight: isToday ? "bold" : "normal", color: isToday ? "#2D6A4F" : "#333" }}>{day.getDate()}</span></div>
                  <div style={s.calTasks}>
                    {dayTasks.map(task => {
                      const prio = getPriority(task.priority); const member = getMember(task.assignee);
                      return <div key={task.id} style={{ ...s.calTask, borderLeft: `3px solid ${prio.color}`, opacity: task.done ? 0.5 : 1 }} onClick={() => openEdit(task)}>
                        <div style={{ ...s.avatar, background: member.color, width: 18, height: 18, fontSize: 7, flexShrink: 0 }}>{member.initials}</div>
                        <span style={{ fontSize: 10, fontFamily: "sans-serif", flex: 1, lineHeight: 1.3, textDecoration: task.done ? "line-through" : "none" }}>{task.title}</span>
                      </div>;
                    })}
                    <button style={s.calAddBtn} onClick={() => openAdd(dayStr)}>+</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showForm && (
        <div style={s.overlay} onClick={() => setShowForm(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <h2 style={s.modalTitle}>{editTask ? "✏️ Modifier la tâche" : "➕ Nouvelle tâche"}</h2>
            <div style={s.formGroup}><label style={s.label}>Titre *</label><input style={s.input} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Ex: Épandage engrais parcelle A" autoFocus /></div>
            <div style={s.formRow}>
              <div style={s.formGroup}><label style={s.label}>Catégorie</label><select style={s.input} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>{CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}</select></div>
              <div style={s.formGroup}><label style={s.label}>Priorité</label><select style={s.input} value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>{PRIORITIES.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}</select></div>
            </div>
            <div style={s.formRow}>
              <div style={s.formGroup}><label style={s.label}>Assigné à</label><select style={s.input} value={form.assignee} onChange={e => setForm(f => ({ ...f, assignee: e.target.value }))}>{team.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
              <div style={s.formGroup}><label style={s.label}>Date limite</label><input style={s.input} type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} /></div>
            </div>
            <div style={s.formGroup}><label style={s.label}>Notes</label><textarea style={{ ...s.input, height: 70, resize: "vertical" }} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Détails, parcelle, instructions..." /></div>
            <div style={s.modalBtns}><button style={s.cancelBtn} onClick={() => setShowForm(false)}>Annuler</button><button style={s.saveBtn} onClick={saveTask}>{editTask ? "Enregistrer" : "Ajouter"}</button></div>
          </div>
        </div>
      )}

      {showSettings && (
        <div style={s.overlay} onClick={() => setShowSettings(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <h2 style={s.modalTitle}>⚙️ Noms de l'équipe</h2>
            {team.map(m => (
              <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12, padding: "10px 14px", background: "#f8faf8", borderRadius: 10 }}>
                <div style={{ ...s.avatar, background: m.color, width: 38, height: 38, fontSize: 13 }}>{m.initials}</div>
                {editingMember === m.id ? (
                  <><input style={{ ...s.input, flex: 1 }} value={memberNameEdit} onChange={e => setMemberNameEdit(e.target.value)} onKeyDown={e => e.key === "Enter" && saveMemberName()} autoFocus /><button style={s.saveBtn} onClick={saveMemberName}>✓</button><button style={s.cancelBtn} onClick={() => setEditingMember(null)}>✗</button></>
                ) : (
                  <><span style={{ fontFamily: "sans-serif", flex: 1, fontWeight: "bold", color: "#1B4332" }}>{m.name}</span><button style={s.editNameBtn} onClick={() => { setEditingMember(m.id); setMemberNameEdit(m.name); }}>✏️ Modifier</button></>
                )}
              </div>
            ))}
            <div style={s.modalBtns}><button style={s.saveBtn} onClick={() => setShowSettings(false)}>Fermer</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  authWrap: { minHeight: "100vh", background: "#f5f7f4", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 },
  authCard: { background: "#fff", borderRadius: 16, padding: 32, width: "100%", maxWidth: 420, boxShadow: "0 4px 24px rgba(0,0,0,0.10)" },
  authTabs: { display: "flex", marginBottom: 20, borderBottom: "1px solid #e0e8e0" },
  authTab: { flex: 1, background: "none", border: "none", padding: "10px 0", fontSize: 14, fontFamily: "sans-serif", cursor: "pointer", fontWeight: "bold" },
  authBtn: { width: "100%", background: "#2D6A4F", color: "#fff", border: "none", borderRadius: 10, padding: "12px 0", fontSize: 15, fontFamily: "sans-serif", fontWeight: "bold", cursor: "pointer", marginTop: 8 },
  msg: { borderRadius: 8, padding: "10px 14px", fontFamily: "sans-serif", fontSize: 13, marginBottom: 10 },
  app: { minHeight: "100vh", background: "#f5f7f4", fontFamily: "'Georgia', serif" },
  header: { background: "#1B4332", color: "#fff", padding: "14px 20px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" },
  headerLeft: { display: "flex", alignItems: "center", gap: 10, flex: 1 },
  logo: { fontSize: 28 },
  logoTitle: { fontSize: 18, fontWeight: "bold", letterSpacing: 1 },
  logoSub: { fontSize: 11, opacity: 0.7, fontFamily: "sans-serif" },
  statsRow: { display: "flex", gap: 10 },
  statBox: { background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 8, padding: "6px 14px", textAlign: "center" },
  statNum: { display: "block", fontSize: 20, fontWeight: "bold" },
  statLabel: { fontSize: 10, opacity: 0.8, fontFamily: "sans-serif" },
  settingsBtn: { background: "rgba(255,255,255,0.15)", color: "#fff", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 8, padding: "8px 14px", fontSize: 13, cursor: "pointer", fontFamily: "sans-serif" },
  addBtn: { background: "#74C69D", color: "#1B4332", border: "none", borderRadius: 8, padding: "8px 16px", fontWeight: "bold", fontSize: 13, cursor: "pointer", fontFamily: "sans-serif" },
  chargeBar: { background: "#fff", padding: "10px 20px", borderBottom: "1px solid #e0e8e0", display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" },
  chargeTitle: { fontSize: 11, fontWeight: "bold", color: "#aaa", fontFamily: "sans-serif", textTransform: "uppercase", letterSpacing: 1 },
  chargeItem: { display: "flex", alignItems: "center", gap: 8 },
  chargeName: { fontSize: 11, fontFamily: "sans-serif", fontWeight: "bold", color: "#333", marginBottom: 2 },
  chargeBars: { display: "flex", alignItems: "center", gap: 8 },
  chargeBarBg: { width: 80, height: 6, background: "#e8f0e8", borderRadius: 3, overflow: "hidden" },
  chargeBarFill: { height: "100%", borderRadius: 3, transition: "width 0.4s" },
  chargeCount: { fontSize: 11, fontFamily: "sans-serif", color: "#666" },
  navBar: { background: "#fff", borderBottom: "1px solid #e0e8e0", padding: "8px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 },
  viewBtns: { display: "flex", gap: 4, background: "#f0f4f0", borderRadius: 8, padding: 4 },
  viewBtn: { border: "none", borderRadius: 6, padding: "6px 16px", fontSize: 13, cursor: "pointer", fontFamily: "sans-serif", fontWeight: "bold", transition: "all 0.2s" },
  filterBtnsRow: { display: "flex", gap: 8, flexWrap: "wrap" },
  sel: { border: "1px solid #d0ddd0", borderRadius: 8, padding: "6px 10px", fontSize: 12, fontFamily: "sans-serif", background: "#fff", cursor: "pointer" },
  taskGrid: { padding: 20, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 },
  card: { background: "#fff", borderRadius: 10, padding: 14, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" },
  cardTop: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  cardMeta: { display: "flex", gap: 6 },
  badge: { borderRadius: 12, padding: "2px 8px", fontSize: 10, fontFamily: "sans-serif", fontWeight: "bold" },
  catBadge: { background: "#f0f4f0", borderRadius: 12, padding: "2px 8px", fontSize: 10, fontFamily: "sans-serif", color: "#444" },
  cardActions: { display: "flex", gap: 2 },
  iconBtn: { background: "none", border: "none", cursor: "pointer", fontSize: 13, padding: 2 },
  cardTitle: { fontSize: 14, fontWeight: "bold", color: "#1B4332", marginBottom: 5, lineHeight: 1.4 },
  cardNotes: { fontSize: 11, color: "#888", fontFamily: "sans-serif", marginBottom: 8, fontStyle: "italic" },
  cardBottom: { display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap", marginTop: 10, borderTop: "1px solid #f0f0f0", paddingTop: 8 },
  avatar: { width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 10, fontWeight: "bold", fontFamily: "sans-serif", flexShrink: 0 },
  memberName: { fontSize: 11, color: "#555", fontFamily: "sans-serif", flex: 1 },
  dueDate: { fontSize: 11, fontFamily: "sans-serif" },
  doneBtn: { border: "1px solid #2D6A4F", borderRadius: 14, padding: "3px 10px", fontSize: 11, cursor: "pointer", fontFamily: "sans-serif", fontWeight: "bold" },
  empty: { gridColumn: "1/-1", textAlign: "center", color: "#aaa", padding: 60, fontSize: 15, fontFamily: "sans-serif" },
  calWrap: { padding: 20 },
  calHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  calTitle: { fontSize: 14, fontWeight: "bold", color: "#1B4332" },
  calNavBtn: { background: "#fff", border: "1px solid #d0ddd0", borderRadius: 8, padding: "6px 14px", fontSize: 12, cursor: "pointer", fontFamily: "sans-serif" },
  calGrid: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8 },
  calCol: { borderRadius: 10, padding: 10, minHeight: 150, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" },
  calDayLabel: { marginBottom: 8, textAlign: "center" },
  calDayName: { display: "block", fontSize: 9, fontFamily: "sans-serif", color: "#aaa", textTransform: "uppercase", letterSpacing: 1 },
  calDayNum: { display: "block", fontSize: 14, fontFamily: "sans-serif" },
  calTasks: { display: "flex", flexDirection: "column", gap: 4 },
  calTask: { display: "flex", alignItems: "center", gap: 5, background: "#f8faf8", borderRadius: 6, padding: "4px 6px", cursor: "pointer" },
  calAddBtn: { marginTop: 4, background: "none", border: "1px dashed #c0d0c0", borderRadius: 6, color: "#aaa", fontSize: 16, cursor: "pointer", padding: "2px 0", width: "100%", fontFamily: "sans-serif" },
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16 },
  modal: { background: "#fff", borderRadius: 12, padding: 26, width: "100%", maxWidth: 500, maxHeight: "90vh", overflowY: "auto" },
  modalTitle: { margin: "0 0 18px", color: "#1B4332", fontSize: 18 },
  formGroup: { marginBottom: 12, flex: 1 },
  formRow: { display: "flex", gap: 12 },
  label: { display: "block", fontSize: 11, fontWeight: "bold", color: "#555", marginBottom: 4, fontFamily: "sans-serif" },
  input: { width: "100%", padding: "8px 10px", border: "1px solid #d0ddd0", borderRadius: 8, fontSize: 13, fontFamily: "sans-serif", boxSizing: "border-box", outline: "none" },
  modalBtns: { display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 18 },
  cancelBtn: { background: "#f0f4f0", border: "none", borderRadius: 8, padding: "9px 18px", cursor: "pointer", fontFamily: "sans-serif", fontSize: 13 },
  saveBtn: { background: "#2D6A4F", color: "#fff", border: "none", borderRadius: 8, padding: "9px 20px", cursor: "pointer", fontFamily: "sans-serif", fontWeight: "bold", fontSize: 13 },
  editNameBtn: { background: "#f0f4f0", border: "none", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontFamily: "sans-serif", fontSize: 12 },
};
