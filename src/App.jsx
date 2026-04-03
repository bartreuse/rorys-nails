import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  CalendarDays,
  Clock3,
  User,
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

function Card({ className = "", children }) {
  return <div className={`rounded-3xl bg-white shadow-lg ${className}`}>{children}</div>;
}

function CardHeader({ className = "", children }) {
  return <div className={`p-6 pb-0 ${className}`}>{children}</div>;
}

function CardTitle({ className = "", children }) {
  return <h2 className={`text-xl font-semibold text-slate-900 ${className}`}>{children}</h2>;
}

function CardContent({ className = "", children }) {
  return <div className={`p-6 ${className}`}>{children}</div>;
}

function Button({ className = "", variant = "default", type = "button", children, ...props }) {
  const base = "inline-flex items-center justify-center rounded-2xl px-4 py-2 text-sm font-medium transition";
  const styles =
    variant === "outline"
      ? "border border-slate-300 bg-white text-slate-900 hover:bg-slate-50"
      : "bg-pink-500 text-white hover:bg-pink-600";

  return (
    <button type={type} className={`${base} ${styles} ${className}`} {...props}>
      {children}
    </button>
  );
}

function Input({ className = "", ...props }) {
  return (
    <input
      className={`w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-pink-400 ${className}`}
      {...props}
    />
  );
}

function Label({ className = "", children, ...props }) {
  return (
    <label className={`text-sm font-medium text-slate-700 ${className}`} {...props}>
      {children}
    </label>
  );
}

function Badge({ className = "", children, variant = "default" }) {
  const styles =
    variant === "secondary"
      ? "bg-slate-200 text-slate-700"
      : "bg-pink-100 text-pink-700";

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${styles} ${className}`}>
      {children}
    </span>
  );
}

export default function NailAppointmentScheduler() {
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
          appt.service.toLowerCase().includes(search.toLowerCase());

        const matchesStatus = statusFilter === "All" || appt.status === statusFilter;

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
          label: `${week.start.toLocaleDateString(undefined, { month: "short", day: "numeric" })} - ${end.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`,
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
    <div className="min-h-screen bg-pink-100 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center"
        >
          <div className="flex h-48 w-96 items-center justify-center rounded-full border-4 border-yellow-400 bg-white shadow-xl">
            <h1 className="text-center text-8xl leading-none text-black" style={{ fontFamily: "Brush Script MT, cursive" }}>
              Rorys Nails
            </h1>
          </div>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-4">
          {[
            { label: "Total Appointments", value: stats.total },
            { label: "Today", value: stats.today },
            { label: "Completed", value: stats.completed },
            { label: "Total Money", value: formatMoney(stats.totalMoney) },
          ].map((item) => (
            <Card key={item.label} className="shadow-md">
              <CardContent className="p-5">
                <div className="text-sm text-slate-500">{item.label}</div>
                <div className="mt-2 text-3xl font-bold text-slate-900">{item.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[420px,1fr]">
          <Card>
            <CardHeader>
              <CardTitle>Add New Appointment</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="client">Client Name</Label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                    <Input
                      id="client"
                      className="pl-9"
                      value={form.client}
                      onChange={(e) => updateField("client", e.target.value)}
                      placeholder="Ex: Ava"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <div className="relative">
                      <CalendarDays className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                      <Input
                        id="date"
                        type="date"
                        className="pl-9"
                        value={form.date}
                        onChange={(e) => updateField("date", e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time">Time</Label>
                    <div className="relative">
                      <Clock3 className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                      <Input
                        id="time"
                        type="time"
                        className="pl-9"
                        value={form.time}
                        onChange={(e) => updateField("time", e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="service">Service</Label>
                  <select
                    id="service"
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-pink-400"
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

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Input
                    id="notes"
                    value={form.notes}
                    onChange={(e) => updateField("notes", e.target.value)}
                    placeholder="Color, design idea, or special request"
                  />
                </div>

                <Button type="submit" className="w-full text-base">
                  Save Appointment
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader className="gap-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <CardTitle>Upcoming Appointments</CardTitle>
                  <div className="flex flex-col gap-3 md:flex-row">
                    <div className="relative min-w-[220px]">
                      <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                      <Input
                        className="pl-9"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search client or service"
                      />
                    </div>
                    <select
                      className="min-w-[160px] rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-pink-400"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <option value="All">All Statuses</option>
                      <option value="Booked">Booked</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filteredAppointments.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-slate-200 p-10 text-center text-slate-500">
                    No appointments yet. Add your first booking on the left.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredAppointments.map((appt) => (
                      <motion.div
                        key={appt.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-3xl border bg-white p-4 shadow-sm"
                      >
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <h3 className="text-lg font-semibold text-slate-900">{appt.client}</h3>
                              <Badge variant={appt.status === "Completed" ? "secondary" : "default"}>{appt.status}</Badge>
                            </div>
                            <div className="flex flex-wrap gap-3 text-sm text-slate-600">
                              <span>{formatDate(appt.date)}</span>
                              <span>{appt.time}</span>
                              <span>{appt.service}</span>
                            </div>
                            {appt.notes ? <p className="text-sm text-slate-500">Notes: {appt.notes}</p> : null}
                          </div>

                          <div className="flex flex-col gap-2 md:items-end">
                            <div className="relative w-full md:w-[150px]">
                              <DollarSign className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                className="pl-9"
                                value={appt.amount || ""}
                                onChange={(e) => updateAppointmentAmount(appt.id, e.target.value)}
                                placeholder="Add price"
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button variant="outline" onClick={() => toggleComplete(appt.id)}>
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                {appt.status === "Completed" ? "Mark Booked" : "Complete"}
                              </Button>
                              <Button variant="outline" onClick={() => deleteAppointment(appt.id)}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </Button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Weekly Earnings</CardTitle>
              </CardHeader>
              <CardContent>
                {weeklyEarnings.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">
                    Complete appointments and add prices to see your money by week.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {weeklyEarnings.map((week) => (
                      <div key={week.key} className="flex items-center justify-between rounded-2xl border bg-white p-4">
                        <div>
                          <div className="text-sm font-medium text-slate-900">Week of {week.label}</div>
                          <div className="text-xs text-slate-500">Completed appointment earnings</div>
                        </div>
                        <div className="text-lg font-bold text-slate-900">{formatMoney(week.total)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
