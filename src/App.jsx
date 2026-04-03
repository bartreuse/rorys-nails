import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  CalendarDays,
  Clock3,
  User,
  Phone,
  Trash2,
  CheckCircle2,
  Search,
  DollarSign,
} from "lucide-react";

const SERVICE_OPTIONS = [
  "Gel Manicure",
  "Gel X Acrylic",
  "Acrylic Full Set",
  "Acrylic Fill",
  "Nail Art",
  "Pedicure",
  "French Tips",
  "Repair / Fix",
];

const DEFAULT_FORM = {
  client: "",
  phone: "",
  date: "",
  time: "",
  service: "Gel Manicure",
  notes: "",
  status: "Booked",
};

function formatDate(dateString) {
  if (!dateString) return "";
  const date = new Date(`${dateString}T12:00:00`);
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function sortAppointments(items) {
  return [...items].sort((a, b) => {
    const aDate = new Date(`${a.date}T${a.time || "00:00"}`);
    const bDate = new Date(`${b.date}T${b.time || "00:00"}`);
    return aDate - bDate;
  });
}

function getWeekStart(dateString) {
  const date = new Date(`${dateString}T12:00:00`);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(12, 0, 0, 0);
  return date;
}

function formatMoney(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function StatCard({ label, value }) {
  return (
    <div className="card">
      <div className="card-content">
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value}</div>
      </div>
    </div>
  );
}

function IconInput({ icon: Icon, className = "", ...props }) {
  return (
    <div className="input-icon-wrap">
      <Icon size={16} className="input-icon" />
      <input {...props} className={`input input-with-icon ${className}`.trim()} />
    </div>
  );
}

export default function App() {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [appointments, setAppointments] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    const saved = localStorage.getItem("nail-appointments-v1");
    if (saved) {
      try {
        setAppointments(JSON.parse(saved));
      } catch {
        setAppointments([]);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("nail-appointments-v1", JSON.stringify(appointments));
  }, [appointments]);

  const filteredAppointments = useMemo(() => {
    return sortAppointments(
      appointments.filter((appt) => {
        const matchesSearch =
          appt.client.toLowerCase().includes(search.toLowerCase()) ||
          appt.service.toLowerCase().includes(search.toLowerCase()) ||
          (appt.phone || "").toLowerCase().includes(search.toLowerCase());

        const matchesStatus =
          statusFilter === "All" || appt.status === statusFilter;

        if (appt.status === "Completed") return false;
        return matchesSearch && matchesStatus;
      })
    );
  }, [appointments, search, statusFilter]);

  const stats = useMemo(() => {
    const today = new Date();
    const todayKey = today.toISOString().slice(0, 10);
    const totalMoney = appointments.reduce((sum, appt) => {
      if (appt.status !== "Completed") return sum;
      return sum + Number(appt.amount || 0);
    }, 0);

    return {
      total: appointments.length,
      today: appointments.filter((a) => a.date === todayKey).length,
      completed: appointments.filter((a) => a.status === "Completed").length,
      totalMoney,
    };
  }, [appointments]);

  const weeklyEarnings = useMemo(() => {
    const grouped = {};

    appointments.forEach((appt) => {
      if (appt.status !== "Completed" || !appt.date) return;
      const weekStart = getWeekStart(appt.date);
      const key = weekStart.toISOString().slice(0, 10);

      if (!grouped[key]) {
        grouped[key] = {
          key,
          start: new Date(weekStart),
          total: 0,
        };
      }

      grouped[key].total += Number(appt.amount || 0);
    });

    return Object.values(grouped)
      .sort((a, b) => b.start - a.start)
      .map((week) => {
        const end = new Date(week.start);
        end.setDate(end.getDate() + 6);
        return {
          ...week,
          label: `${week.start.toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          })} - ${end.toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          })}`,
        };
      });
  }, [appointments]);

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.client || !form.date || !form.time || !form.service) return;

    const newAppointment = {
      id: crypto.randomUUID(),
      ...form,
      createdAt: new Date().toISOString(),
    };

    setAppointments((prev) => [...prev, newAppointment]);
    setForm({ ...DEFAULT_FORM, service: "Gel Manicure" });
  }

  function deleteAppointment(id) {
    setAppointments((prev) => prev.filter((appt) => appt.id !== id));
  }

  function updateAppointmentAmount(id, value) {
    setAppointments((prev) =>
      prev.map((appt) =>
        appt.id === id
          ? {
              ...appt,
              amount: value,
            }
          : appt
      )
    );
  }

  function toggleComplete(id) {
    setAppointments((prev) =>
      prev.map((appt) =>
        appt.id === id
          ? {
              ...appt,
              status: appt.status === "Completed" ? "Booked" : "Completed",
            }
          : appt
      )
    );
  }

  return (
    <div className="app-shell">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="logo-wrap"
        >
          <div className="logo-oval">
            <h1 className="logo-text">Rorys Nails</h1>
          </div>
        </motion.div>

        <div className="stats-grid">
          <StatCard label="Total Appointments" value={stats.total} />
          <StatCard label="Today" value={stats.today} />
          <StatCard label="Completed" value={stats.completed} />
          <StatCard label="Total Money" value={formatMoney(stats.totalMoney)} />
        </div>

        <div className="layout-grid">
          <div className="form-stack">
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Add New Appointment</h2>
              </div>
              <div className="card-content">
                <form onSubmit={handleSubmit} className="form-stack">
                  <div className="field">
                    <label className="label" htmlFor="client">Client Name</label>
                    <IconInput
                      icon={User}
                      id="client"
                      value={form.client}
                      onChange={(e) => updateField("client", e.target.value)}
                      placeholder="Ex: Ava"
                    />
                  </div>

                  <div className="field">
                    <label className="label" htmlFor="phone">Phone Number</label>
                    <IconInput
                      icon={Phone}
                      id="phone"
                      value={form.phone}
                      onChange={(e) => updateField("phone", e.target.value)}
                      placeholder="Ex: 555-123-4567"
                    />
                  </div>

                  <div className="two-col">
                    <div className="field">
                      <label className="label" htmlFor="date">Date</label>
                      <IconInput
                        icon={CalendarDays}
                        id="date"
                        type="date"
                        value={form.date}
                        onChange={(e) => updateField("date", e.target.value)}
                      />
                    </div>

                    <div className="field">
                      <label className="label" htmlFor="time">Time</label>
                      <IconInput
                        icon={Clock3}
                        id="time"
                        type="time"
                        value={form.time}
                        onChange={(e) => updateField("time", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="field">
                    <label className="label" htmlFor="service">Service</label>
                    <select
                      id="service"
                      className="select"
                      value={form.service}
                      onChange={(e) => updateField("service", e.target.value)}
                    >
                      {SERVICE_OPTIONS.map((service) => (
                        <option key={service} value={service}>
                          {service}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="field">
                    <label className="label" htmlFor="notes">Notes</label>
                    <input
                      id="notes"
                      className="input"
                      value={form.notes}
                      onChange={(e) => updateField("notes", e.target.value)}
                      placeholder="Color, design idea, or special request"
                    />
                  </div>

                  <button type="submit" className="button">
                    Save Appointment
                  </button>
                </form>
              </div>
            </div>
          </div>

          <div className="right-stack">
            <div className="card">
              <div className="card-header">
                <div className="toolbar">
                  <h2 className="card-title">Upcoming Appointments</h2>
                  <div className="toolbar-right">
                    <div className="search-box">
                      <IconInput
                        icon={Search}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search client or service"
                      />
                    </div>
                    <select
                      className="select"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <option value="All">All Statuses</option>
                      <option value="Booked">Booked</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="card-content">
                {filteredAppointments.length === 0 ? (
                  <div className="empty-state">
                    No appointments yet. Add your first booking on the left.
                  </div>
                ) : (
                  <div className="right-stack">
                    {filteredAppointments.map((appt) => (
                      <motion.div
                        key={appt.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="appointment"
                      >
                        <div className="appointment-row">
                          <div className="appointment-main">
                            <div className="client-row">
                              <div className="client-name">{appt.client}</div>
                              <span
                                className={`badge ${
                                  appt.status === "Completed"
                                    ? "badge-completed"
                                    : "badge-booked"
                                }`}
                              >
                                {appt.status}
                              </span>
                            </div>

                            <div className="meta-row">
                              <span>{formatDate(appt.date)}</span>
                              <span>{appt.time}</span>
                              <span>{appt.service}</span>
                              {appt.phone ? <span>{appt.phone}</span> : null}
                            </div>

                            {appt.notes ? (
                              <div className="notes">Notes: {appt.notes}</div>
                            ) : null}
                          </div>

                          <div className="appointment-actions">
                            <IconInput
                              icon={DollarSign}
                              type="number"
                              min="0"
                              step="0.01"
                              value={appt.amount || ""}
                              onChange={(e) =>
                                updateAppointmentAmount(appt.id, e.target.value)
                              }
                              placeholder="Add price"
                            />

                            <div className="button-row">
                              <button
                                type="button"
                                className="button-outline"
                                onClick={() => toggleComplete(appt.id)}
                              >
                                <CheckCircle2 size={16} style={{ marginRight: 6, verticalAlign: "text-bottom" }} />
                                {appt.status === "Completed" ? "Mark Booked" : "Complete"}
                              </button>

                              <button
                                type="button"
                                className="button-outline"
                                onClick={() => deleteAppointment(appt.id)}
                              >
                                <Trash2 size={16} style={{ marginRight: 6, verticalAlign: "text-bottom" }} />
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Weekly Earnings</h2>
              </div>
              <div className="card-content">
                {weeklyEarnings.length === 0 ? (
                  <div className="small-muted">
                    Complete appointments and add prices to see your money by week.
                  </div>
                ) : (
                  <div className="week-list">
                    {weeklyEarnings.map((week) => (
                      <div key={week.key} className="week-item">
                        <div>
                          <div className="week-title">Week of {week.label}</div>
                          <div className="week-subtitle">
                            Completed appointment earnings
                          </div>
                        </div>
                        <div className="week-value">{formatMoney(week.total)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}