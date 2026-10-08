import React, { useState, useEffect, createContext, useContext } from "react";
import { db, auth } from "./firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import {
  collection,
  addDoc,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import {
  Shield,
  UserCheck,
  Calendar,
  Lock,
  Plus,
  Briefcase,
  XCircle,
  Bell,
  LogOut,
  MessageSquare,
  AlertOctagon,
  Clock,
  CheckCircle2,
} from "lucide-react";

// ===================================================================
// MAPEO DE DÍAS DE LA SEMANA
// ===================================================================
const WEEK_DAYS = [
  { id: "1", label: "Lunes" },
  { id: "2", label: "Martes" },
  { id: "3", label: "Miércoles" },
  { id: "4", label: "Jueves" },
  { id: "5", label: "Viernes" },
  { id: "6", label: "Sábado" },
  { id: "0", label: "Domingo" },
];

// ===================================================================
// CONTEXTO DE AUTENTICACIÓN Y ROLES
// ===================================================================
const AuthContext = createContext();

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists()) {
            setUserProfile(userDoc.data());
          } else {
            setUserProfile(null);
          }
        } catch (error) {
          console.error("Error al obtener perfil:", error);
          setUserProfile(null);
        }
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider
      value={{ user, userProfile, setUserProfile, loading, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

function useAuth() {
  return useContext(AuthContext);
}

// ===================================================================
// PANTALLA DE AUTENTICACIÓN (LOGIN Y REGISTRO DE CLIENTES)
// ===================================================================
function AuthScreen() {
  const [authMode, setAuthMode] = useState("login"); // 'login' | 'register'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSubmitting(true);

    try {
      if (authMode === "register") {
        const res = await createUserWithEmailAndPassword(auth, email, password);
        const profileData = {
          uid: res.user.uid,
          name: fullName,
          email: email,
          phone: phone,
          role: "client", // Los registros públicos son estrictamente Clientes
          createdAt: new Date().toISOString(),
        };
        await setDoc(doc(db, "users", res.user.uid), profileData);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      setErrorMsg("Error: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="text-center mb-6">
          <div className="inline-flex p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-500 mb-3">
            <Briefcase size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-100">ServiCitas Pro</h1>
          <p className="text-xs text-slate-400 mt-1">
            {authMode === "login"
              ? "Ingresa con tus credenciales"
              : "Crea tu cuenta de cliente en segundos"}
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-xl flex items-center gap-2">
            <AlertOctagon size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {authMode === "register" && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Nombre Completo:
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-sm focus:border-amber-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Teléfono / WhatsApp:
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-sm focus:border-amber-500 outline-none"
                  required
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Correo Electrónico:
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-sm focus:border-amber-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Contraseña:
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-sm focus:border-amber-500 outline-none"
              required
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-amber-500 text-slate-950 font-bold py-3 rounded-xl hover:bg-amber-400 transition disabled:opacity-50"
          >
            {submitting
              ? "Procesando..."
              : authMode === "login"
                ? "Iniciar Sesión"
                : "Registrarme"}
          </button>
        </form>

        <div className="mt-6 text-center border-t border-slate-800 pt-4">
          <button
            onClick={() => {
              setAuthMode(authMode === "login" ? "register" : "login");
              setErrorMsg("");
            }}
            className="text-xs text-amber-400 hover:underline"
          >
            {authMode === "login"
              ? "¿No tienes cuenta? Regístrate como cliente"
              : "¿Ya tienes cuenta? Inicia sesión"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ===================================================================
// PANEL DE ADMINISTRADOR GENERAL
// ===================================================================
function AdminPanel({ providers }) {
  const [provName, setProvName] = useState("");
  const [provEmail, setProvEmail] = useState("");
  const [provPassword, setProvPassword] = useState("");
  const [provCategory, setProvCategory] = useState("Barbería");
  const [provDays, setProvDays] = useState(["1", "2", "3", "4", "5"]);
  const [provSlots, setProvSlots] = useState(
    "09:00, 10:00, 11:00, 14:00, 15:00, 16:00",
  );
  const [loading, setLoading] = useState(false);

  const toggleDay = (dayId) => {
    if (provDays.includes(dayId)) {
      setProvDays(provDays.filter((d) => d !== dayId));
    } else {
      setProvDays([...provDays, dayId]);
    }
  };

  const handleCreateProvider = async (e) => {
    e.preventDefault();
    if (!provName || !provEmail || !provPassword) return;

    setLoading(true);
    try {
      // 1. Crear cuenta en Firebase Auth
      const res = await createUserWithEmailAndPassword(
        auth,
        provEmail,
        provPassword,
      );
      const slotsArr = provSlots
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s);

      // 2. Crear registro de usuario con rol 'provider'
      await setDoc(doc(db, "users", res.user.uid), {
        uid: res.user.uid,
        name: provName,
        email: provEmail,
        role: "provider",
        category: provCategory,
      });

      // 3. Crear ficha de prestador con días y horarios semanales
      await setDoc(doc(db, "providers", res.user.uid), {
        id: res.user.uid,
        name: provName,
        email: provEmail,
        category: provCategory,
        workDays: provDays,
        availableSlots: slotsArr,
      });

      alert(`Prestador ${provName} registrado correctamente.`);
      setProvName("");
      setProvEmail("");
      setProvPassword("");
    } catch (error) {
      alert("Error al registrar prestador: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h2 className="text-lg font-bold text-amber-400 mb-2 flex items-center gap-2">
          <Shield size={20} /> Panel del Administrador General
        </h2>
        <p className="text-xs text-slate-400 mb-6">
          Registra prestadores de servicio y asigna sus días laborales y
          horarios semanales.
        </p>

        <form onSubmit={handleCreateProvider} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Nombre del Prestador / Negocio:
              </label>
              <input
                type="text"
                value={provName}
                onChange={(e) => setProvName(e.target.value)}
                placeholder="Ej. Tapicería Marcos"
                className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Correo de Acceso:
              </label>
              <input
                type="email"
                value={provEmail}
                onChange={(e) => setProvEmail(e.target.value)}
                placeholder="marcos@servicitas.com"
                className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Contraseña Inicial:
              </label>
              <input
                type="password"
                value={provPassword}
                onChange={(e) => setProvPassword(e.target.value)}
                placeholder="******"
                className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-sm"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Categoría:
              </label>
              <select
                value={provCategory}
                onChange={(e) => setProvCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-sm"
              >
                <option value="Barbería">Barbería / Peluquería</option>
                <option value="Mueblería y Tapicería">
                  Mueblería y Tapicería
                </option>
                <option value="Estética y Manicura">Estética y Manicura</option>
                <option value="Servicios Técnicos">Servicios Técnicos</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Horarios de Atención (separados por coma):
              </label>
              <input
                type="text"
                value={provSlots}
                onChange={(e) => setProvSlots(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-sm font-mono"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2">
              Días Laborales Permitidos:
            </label>
            <div className="flex flex-wrap gap-2">
              {WEEK_DAYS.map((day) => (
                <button
                  type="button"
                  key={day.id}
                  onClick={() => toggleDay(day.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                    provDays.includes(day.id)
                      ? "bg-amber-500 text-slate-950 border-amber-500"
                      : "bg-slate-950 text-slate-400 border-slate-800"
                  }`}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-amber-500 text-slate-950 font-bold px-6 py-2.5 rounded-xl flex items-center gap-2 hover:bg-amber-400 disabled:opacity-50"
          >
            <Plus size={18} />{" "}
            {loading ? "Creando..." : "Registrar Prestador de Servicio"}
          </button>
        </form>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h3 className="font-bold text-slate-200 mb-4 text-sm">
          Prestadores Activos en el Sistema ({providers.length})
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {providers.map((p) => (
            <div
              key={p.id}
              className="p-4 bg-slate-950 rounded-xl border border-slate-800"
            >
              <p className="font-bold text-amber-400 text-sm">{p.name}</p>
              <p className="text-xs text-slate-400">
                {p.category} | {p.email}
              </p>
              <div className="mt-2 text-[11px] text-slate-400">
                <span className="font-semibold text-slate-300">Horarios:</span>{" "}
                {p.availableSlots?.join(", ")}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ===================================================================
// PANEL DEL PRESTADOR DE SERVICIO (VER DÍAS, HORARIOS Y CANCELAR)
// ===================================================================
function ProviderPanel({ appointments }) {
  const { userProfile } = useAuth();
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );

  // Filtrar citas del prestador logueado para la fecha seleccionada
  const myAppointments = appointments.filter(
    (a) => a.providerId === userProfile?.uid && a.date === selectedDate,
  );

  const handleCancelAppointment = async (appointmentId) => {
    const reason = prompt(
      "Motivo de la cancelación (se enviará como notificación al cliente):",
    );
    if (!reason) return;

    try {
      await updateDoc(doc(db, "appointments", appointmentId), {
        status: "cancelada_por_prestador",
        cancellationReason: reason,
      });
      alert(
        "La cita ha sido cancelada. El horario vuelve a quedar libre y el cliente será notificado.",
      );
    } catch (err) {
      alert("Error al cancelar la cita: " + err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-amber-400 flex items-center gap-2">
              <UserCheck size={20} /> Agenda Personal de Trabajo
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Administra tus turnos por día. Puedes cancelar citas puntuales por
              imprevistos o falta de insumos.
            </p>
          </div>

          <button
            onClick={() =>
              alert(
                `Contacto con Administrador:\nCorreo: admin@servicitas.com\nWhatsApp: +55 47 99999-0000`,
              )
            }
            className="bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 w-fit"
          >
            <MessageSquare size={16} /> Contactar al Administrador
          </button>
        </div>

        <div className="mb-6 max-w-xs">
          <label className="block text-xs font-semibold text-slate-400 mb-1">
            Seleccionar Fecha para Revisar Agenda:
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-sm"
          />
        </div>

        <h3 className="font-bold text-slate-200 mb-3 text-sm">
          Citas programadas para el {selectedDate}: ({myAppointments.length})
        </h3>

        {myAppointments.length > 0 ? (
          <div className="space-y-3">
            {myAppointments.map((apt) => (
              <div
                key={apt.id}
                className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex flex-col sm:flex-row justify-between sm:items-center gap-3"
              >
                <div>
                  <p className="font-bold text-amber-400 text-sm">
                    {apt.time} hs — Cliente: {apt.clientName}
                  </p>
                  <p className="text-xs text-slate-400">
                    Teléfono: {apt.clientPhone}
                  </p>
                  <p
                    className={`text-[11px] font-semibold mt-1 ${apt.status === "confirmada" ? "text-emerald-400" : "text-rose-400"}`}
                  >
                    Estado: {apt.status.toUpperCase()}
                  </p>
                  {apt.cancellationReason && (
                    <p className="text-xs text-rose-300 italic mt-1">
                      Motivo: "{apt.cancellationReason}"
                    </p>
                  )}
                </div>

                {apt.status === "confirmada" && (
                  <button
                    onClick={() => handleCancelAppointment(apt.id)}
                    className="bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto"
                  >
                    <XCircle size={16} /> Cancelar esta cita
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500 italic p-4 bg-slate-950 rounded-xl border border-slate-800/50">
            No hay agendamientos para este día.
          </p>
        )}
      </div>
    </div>
  );
}

// ===================================================================
// PANEL DEL CLIENTE (ELEGIR DÍA, PRESTADOR, HORARIO Y VER NOTIFICACIONES)
// ===================================================================
function ClientPanel({ providers, appointments }) {
  const { userProfile } = useAuth();
  const [selectedProviderId, setSelectedProviderId] = useState("");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [selectedSlot, setSelectedSlot] = useState("");
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    if (providers.length > 0 && !selectedProviderId) {
      setSelectedProviderId(providers[0].id);
    }
  }, [providers, selectedProviderId]);

  const activeProvider = providers.find((p) => p.id === selectedProviderId);

  // Calcular el día de la semana correspondiente a la fecha elegida (0 = Dom, 1 = Lun, etc.)
  const dateObj = new Date(selectedDate + "T00:00:00");
  const dayOfWeek = dateObj.getDay().toString();

  // Verificar si el prestador trabaja en ese día de la semana
  const isDayWorkable = activeProvider?.workDays?.includes(dayOfWeek);

  // Obtener turnos ya confirmados para ese día con ese prestador
  const bookedSlots = appointments
    .filter(
      (a) =>
        a.providerId === selectedProviderId &&
        a.date === selectedDate &&
        a.status === "confirmada",
    )
    .map((a) => a.time);

  // Filtrar horarios disponibles
  const availableSlots = (activeProvider?.availableSlots || []).filter(
    (slot) => !bookedSlots.includes(slot),
  );

  // Notificaciones de citas del cliente
  const myAppointments = appointments.filter(
    (a) => a.clientId === userProfile?.uid,
  );
  const canceledNotifications = myAppointments.filter(
    (a) => a.status === "cancelada_por_prestador",
  );

  const handleBook = async (e) => {
    e.preventDefault();
    if (!selectedSlot || !selectedProviderId || !isDayWorkable) return;

    setBooking(true);
    try {
      await addDoc(collection(db, "appointments"), {
        providerId: selectedProviderId,
        providerName: activeProvider?.name || "Prestador",
        clientId: userProfile.uid,
        clientName: userProfile.name,
        clientPhone: userProfile.phone || "Sin datos",
        date: selectedDate,
        time: selectedSlot,
        status: "confirmada",
        createdAt: serverTimestamp(),
      });

      setSelectedSlot("");
      alert("¡Cita agendada exitosamente!");
    } catch (err) {
      alert("Error al reservar la cita: " + err.message);
    } finally {
      setBooking(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* NOTIFICACIONES DE CANCELACIÓN */}
      {canceledNotifications.length > 0 && (
        <div className="bg-rose-500/10 border border-rose-500/30 p-4 rounded-2xl text-rose-300">
          <h3 className="font-bold text-sm flex items-center gap-2 mb-2 text-rose-400">
            <Bell size={18} /> Notificaciones de Cancelación:
          </h3>
          {canceledNotifications.map((n) => (
            <div
              key={n.id}
              className="text-xs border-b border-rose-500/20 pb-2 mb-2 last:border-0"
            >
              Tu cita del{" "}
              <span className="font-bold text-slate-200">{n.date}</span> a las{" "}
              <span className="font-bold text-slate-200">{n.time} hs</span> con{" "}
              <span className="font-bold text-slate-200">{n.providerName}</span>{" "}
              fue cancelada.
              <br />
              <span className="italic text-slate-400">
                Motivo indicativo: "{n.cancellationReason}"
              </span>
              . Puedes elegir un nuevo horario abajo.
            </div>
          ))}
        </div>
      )}

      {/* FORMULARIO DE RESERVA DE CITAS */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <h2 className="text-lg font-bold text-amber-400 flex items-center gap-2">
          <Calendar size={20} /> Agendar un Servicio
        </h2>

        <form onSubmit={handleBook} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2">
                1. Elige el Servicio / Profesional:
              </label>
              <select
                value={selectedProviderId}
                onChange={(e) => {
                  setSelectedProviderId(e.target.value);
                  setSelectedSlot("");
                }}
                className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-sm"
              >
                {providers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.category})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2">
                2. Elige el Día:
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setSelectedSlot("");
                }}
                className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2">
              3. Horarios Disponibles:
            </label>

            {!isDayWorkable ? (
              <div className="p-4 bg-slate-950 border border-amber-500/20 rounded-xl text-xs text-amber-400 flex items-center gap-2">
                <Lock size={16} /> El prestador no atiende este día de la
                semana. Por favor selecciona otra fecha.
              </div>
            ) : availableSlots.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {availableSlots.map((slot) => (
                  <button
                    type="button"
                    key={slot}
                    onClick={() => setSelectedSlot(slot)}
                    className={`py-2.5 px-3 rounded-xl border text-sm font-semibold transition ${
                      selectedSlot === slot
                        ? "bg-amber-500 text-slate-950 border-amber-500"
                        : "bg-slate-950 text-slate-300 border-slate-800 hover:border-amber-500"
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-slate-950 border border-rose-500/20 rounded-xl text-xs text-rose-400 flex items-center gap-2">
                <Lock size={16} /> Todos los horarios para este día están
                ocupados o cancelados.
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={!selectedSlot || !isDayWorkable || booking}
            className="w-full bg-amber-500 disabled:opacity-40 text-slate-950 font-bold py-3.5 rounded-xl hover:bg-amber-400 transition"
          >
            {booking ? "Confirmando..." : "Confirmar Mi Reserva"}
          </button>
        </form>
      </div>

      {/* HISTORIAL DE CITAS DEL CLIENTE */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h3 className="font-bold text-slate-200 mb-4 text-sm">
          Mis Agendamientos
        </h3>
        {myAppointments.length > 0 ? (
          <div className="space-y-3">
            {myAppointments.map((apt) => (
              <div
                key={apt.id}
                className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center"
              >
                <div>
                  <p className="font-bold text-amber-400 text-sm">
                    {apt.providerName} — {apt.date} a las {apt.time} hs
                  </p>
                  <p
                    className={`text-[11px] font-semibold mt-1 ${apt.status === "confirmada" ? "text-emerald-400" : "text-rose-400"}`}
                  >
                    Estado: {apt.status.toUpperCase()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500 italic">
            Aún no tienes citas registradas.
          </p>
        )}
      </div>
    </div>
  );
}

// ===================================================================
// CONTENEDOR PRINCIPAL
// ===================================================================
function MainApp() {
  const { userProfile, logout } = useAuth();
  const [providers, setProviders] = useState([]);
  const [appointments, setAppointments] = useState([]);

  // Suscribirse en tiempo real a las colecciones de Firestore
  useEffect(() => {
    const unsubProviders = onSnapshot(
      collection(db, "providers"),
      (snapshot) => {
        const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setProviders(data);
      },
    );

    const unsubAppointments = onSnapshot(
      collection(db, "appointments"),
      (snapshot) => {
        const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setAppointments(data);
      },
    );

    return () => {
      unsubProviders();
      unsubAppointments();
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
      {/* BARRA SUPERIOR */}
      <header className="max-w-6xl mx-auto bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-wrap justify-between items-center mb-8 shadow-xl gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-amber-500/10 border border-amber-500/30 p-2.5 rounded-xl text-amber-500">
            <Briefcase size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100">ServiCitas Pro</h1>
            <p className="text-xs text-slate-400">
              Usuario:{" "}
              <span className="text-amber-400 font-semibold">
                {userProfile?.name}
              </span>{" "}
              ({userProfile?.role?.toUpperCase()})
            </p>
          </div>
        </div>

        <button
          onClick={logout}
          className="bg-slate-800 hover:bg-rose-500/20 hover:text-rose-400 border border-slate-700 px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition"
        >
          <LogOut size={14} /> Cerrar Sesión
        </button>
      </header>

      {/* CONTROL STRICTO DE VISTAS Y PERMISOS POR ROL */}
      <main className="max-w-6xl mx-auto">
        {userProfile?.role === "admin" && <AdminPanel providers={providers} />}
        {userProfile?.role === "provider" && (
          <ProviderPanel appointments={appointments} />
        )}
        {userProfile?.role === "client" && (
          <ClientPanel providers={providers} appointments={appointments} />
        )}
      </main>
    </div>
  );
}

// ===================================================================
// EXPORTACIÓN PRINCIPAL DEL COMPONENTE
// ===================================================================
export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

function AppContent() {
  const { user, userProfile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-amber-500 flex items-center justify-center font-bold text-sm">
        Cargando ServiCitas Pro...
      </div>
    );
  }

  if (!user || !userProfile) {
    return <AuthScreen />;
  }

  return <MainApp />;
}
