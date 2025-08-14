// File: src/pages/admin/revenue/RevenueDashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "../../firebase.config";
import {
  FaChevronLeft,
  FaChartLine,
  FaTable,
  FaFileExport,
  FaCalendarAlt,
} from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import ReactPaginate from "react-paginate";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  LineChart,
} from "recharts";

const NGN = (n) =>
  (n ?? 0).toLocaleString("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 2,
  });

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d, days) => {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
};
const formatDayKey = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;

  const daysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
  const getWeeksInMonth = (month, year) => {
    const totalDays = daysInMonth(month, year);
    const weeks = [];
    let start = 1;
    while (start <= totalDays) {
      let end = Math.min(start + 6, totalDays);
      weeks.push({ start, end });
      start += 7;
    }
    return weeks;
  };

export default function RevenueDashboard() {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [viewGraph, setViewGraph] = useState(false);
  const [range, setRange] = useState("month");
  const [page, setPage] = useState(0);
  const PER_PAGE = 10;

  // Custom date filters
  const [selectedDate, setSelectedDate] = useState(new Date()); // Day mode
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().getMonth()
  );
  const [selectedYear, setSelectedYear] = useState(
    new Date().getFullYear()
  );
  const [selectedWeek, setSelectedWeek] = useState(0); // week index in month

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        const qy = query(
          collection(db, "cartServiceFees"),
          orderBy("timestamp", "desc")
        );
        const snap = await getDocs(qy);
        const rows = snap.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            serviceFee: Number(data.serviceFee ?? 0),
            createdAt: data.timestamp?.toDate
              ? data.timestamp.toDate()
              : new Date(),
            cartHash: data.cartHash || "",
          };
        });
        setItems(rows);
      } catch (e) {
        console.error(e);
        toast.error("Failed to load revenue data.");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  const filtered = useMemo(() => {
    if (range === "all") return items;
    if (range === "day") {
      return items.filter(
        (i) =>
          i.createdAt.toDateString() === selectedDate.toDateString()
      );
    }
    if (range === "week") {
      const start = new Date(selectedYear, selectedMonth, selectedWeek * 7 + 1);
      const end = new Date(
        selectedYear,
        selectedMonth,
        Math.min((selectedWeek + 1) * 7, daysInMonth(selectedMonth, selectedYear))
      );
      return items.filter(
        (i) => i.createdAt >= start && i.createdAt <= end
      );
    }
    if (range === "month") {
      return items.filter(
        (i) =>
          i.createdAt.getMonth() === selectedMonth &&
          i.createdAt.getFullYear() === selectedYear
      );
    }
    return items;
  }, [items, range, selectedDate, selectedMonth, selectedYear, selectedWeek]);

  const totalAllTime = useMemo(
    () => items.reduce((sum, r) => sum + (r.serviceFee || 0), 0),
    [items]
  );
  const totalFiltered = useMemo(
    () => filtered.reduce((sum, r) => sum + (r.serviceFee || 0), 0),
    [filtered]
  );

  const pageCount = Math.ceil(filtered.length / PER_PAGE) || 1;
  const currentRows = useMemo(() => {
    const start = page * PER_PAGE;
    return filtered.slice(start, start + PER_PAGE);
  }, [filtered, page]);

  const chartData = useMemo(() => {
    if (!items.length) return [];
    const ascending = [...items].sort((a, b) => a.createdAt - b.createdAt);
    const dailyMap = new Map();
    for (const row of ascending) {
      const k = formatDayKey(row.createdAt);
      dailyMap.set(k, (dailyMap.get(k) || 0) + (row.serviceFee || 0));
    }
    const firstDay = startOfDay(ascending[0].createdAt);
    const lastDay = startOfDay(ascending[ascending.length - 1].createdAt);
    const out = [];
    let cursor = new Date(firstDay);
    let running = 0;
    while (cursor <= lastDay) {
      const k = formatDayKey(cursor);
      const dayTotal = dailyMap.get(k) || 0;
      running += dayTotal;
      out.push({
        day: k,
        daily: Math.round(dayTotal * 100) / 100,
        cumulative: Math.round(running * 100) / 100,
      });
      cursor = addDays(cursor, 1);
    }
    return out;
  }, [items]);

  const exportCSV = () => {
    if (!filtered.length) {
      toast.info("No transactions to export for this range.");
      return;
    }
    const headers = ["ID", "Service Fee (NGN Kobo)", "Service Fee (₦)", "Date/Time"];
    const rows = filtered.map((r) => [
      r.id,
      (r.serviceFee ?? 0).toFixed(2),
      NGN(r.serviceFee ?? 0),
      r.createdAt.toLocaleString(),
    ]);
    const csv = [headers, ...rows].map((arr) => arr.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `revenue_${range}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported.");
  };



  return (
    <div className="p-6">
      <ToastContainer />
      <button
        onClick={() => navigate(-1)}
        className="bg-customOrange text-white px-4 py-2 rounded-lg flex items-center mb-6"
      >
        <FaChevronLeft className="mr-2" />
        Back
      </button>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-customOrange">Revenue</h1>
        <div className="flex items-center gap-2">
          {["day", "week", "month", "all"].map((r) => (
            <button
              key={r}
              className={`px-3 py-2 rounded border ${
                range === r
                  ? "bg-customOrange text-white border-customOrange"
                  : "bg-white text-gray-700 border-gray-300"
              }`}
              onClick={() => setRange(r)}
            >
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {range === "day" && (
        <input
          type="date"
          className="border p-2 rounded mb-4"
          value={selectedDate.toISOString().split("T")[0]}
          onChange={(e) => setSelectedDate(new Date(e.target.value))}
        />
      )}

      {range === "week" && (
        <div className="flex gap-2 mb-4">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="border p-2 rounded"
          >
            {Array.from({ length: 12 }).map((_, i) => (
              <option key={i} value={i}>
                {new Date(0, i).toLocaleString("default", { month: "long" })}
              </option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="border p-2 rounded"
          >
            {Array.from({ length: 5 }).map((_, i) => {
              const y = new Date().getFullYear() - i;
              return (
                <option key={y} value={y}>
                  {y}
                </option>
              );
            })}
          </select>
          <select
            value={selectedWeek}
            onChange={(e) => setSelectedWeek(Number(e.target.value))}
            className="border p-2 rounded"
          >
            {getWeeksInMonth(selectedMonth, selectedYear).map((w, i) => (
              <option key={i} value={i}>
                {`${w.start} - ${w.end}`}
              </option>
            ))}
          </select>
        </div>
      )}

      {range === "month" && (
        <div className="flex gap-2 mb-4">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="border p-2 rounded"
          >
            {Array.from({ length: 12 }).map((_, i) => (
              <option key={i} value={i}>
                {new Date(0, i).toLocaleString("default", { month: "long" })}
              </option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="border p-2 rounded"
          >
            {Array.from({ length: 5 }).map((_, i) => {
              const y = new Date().getFullYear() - i;
              return (
                <option key={y} value={y}>
                  {y}
                </option>
              );
            })}
          </select>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-customOrange text-white p-5 rounded-lg shadow">
          <div className="text-sm opacity-90">Total Revenue (All Time)</div>
          <div className="text-2xl font-bold">{NGN(totalAllTime)}</div>
        </div>
        <div className="bg-white p-5 rounded-lg shadow border">
          <div className="text-sm text-gray-500">Filtered Revenue</div>
          <div className="text-2xl font-bold text-gray-800">{NGN(totalFiltered)}</div>
        </div>
        <div className="bg-white p-5 rounded-lg shadow border">
          <div className="text-sm text-gray-500">Transactions (Filtered)</div>
          <div className="text-2xl font-bold text-gray-800">{filtered.length}</div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="font-semibold text-gray-700">
          {viewGraph ? "Revenue Graph" : "Transactions"}
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportCSV}
            className="px-4 py-2 bg-green-600 text-white rounded flex items-center gap-2 hover:bg-green-700"
          >
            <FaFileExport /> Export CSV
          </button>
          <button
            onClick={() => setViewGraph((v) => !v)}
            className="px-4 py-2 bg-blue-600 text-white rounded flex items-center gap-2 hover:bg-blue-700"
          >
            {viewGraph ? (
              <>
                <FaTable /> View Table
              </>
            ) : (
              <>
                <FaChartLine /> View Graph
              </>
            )}
          </button>
        </div>
      </div>

      <div className="relative overflow-hidden">
        {/* Table */}
        <div
          className={`transition-all duration-500 ${
            viewGraph
              ? "opacity-0 -translate-x-6 absolute inset-0 pointer-events-none"
              : "opacity-100 translate-x-0"
          }`}
        >
          <div className="overflow-x-auto bg-white border rounded shadow">
            <table className="min-w-full">
              <thead className="bg-gray-100 text-left">
                <tr>
                  <th className="p-4">ID</th>
                  <th className="p-4">Service Fee</th>
                  <th className="p-4">Date/Time</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td className="p-4" colSpan={3}>
                      Loading…
                    </td>
                  </tr>
                ) : currentRows.length ? (
                  currentRows.map((r) => (
                    <tr key={r.id} className="border-t hover:bg-gray-50">
                      <td className="p-4">{r.id}</td>
                      <td className="p-4">{NGN(r.serviceFee)}</td>
                      <td className="p-4">{r.createdAt.toLocaleString()}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="p-4" colSpan={3}>
                      No transactions for this range.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <ReactPaginate
            previousLabel={"Previous"}
            nextLabel={"Next"}
            breakLabel={"..."}
            pageCount={pageCount}
            onPageChange={({ selected }) => setPage(selected)}
            containerClassName="flex justify-center mt-6 space-x-2"
            pageClassName="px-3 py-2 bg-gray-200 rounded"
            activeClassName="bg-blue-500 text-white"
            previousClassName="px-3 py-2 bg-blue-500 text-white rounded"
            nextClassName="px-3 py-2 bg-blue-500 text-white rounded"
            forcePage={Math.min(page, pageCount - 1)}
          />
        </div>

        {/* Graph */}
        <div
          className={`transition-all duration-500 ${
            viewGraph
              ? "opacity-100 translate-x-0"
              : "opacity-0 translate-x-6 absolute inset-0 pointer-events-none"
          }`}
        >
          <div
  className="p-4 rounded-2xl shadow-lg h-[420px]"
  style={{
    background: "rgba(255, 255, 255, 0.15)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    border: "1px solid rgba(255, 255, 255, 0.2)",
  }}
>

  <ResponsiveContainer width="100%" height={400}>
    <LineChart
      data={chartData}
      margin={{ top: 20, right: 30, bottom: 20, left: 0 }}
    >
      <defs>
        {/* Background gradient */}
        <linearGradient id="bgGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f8fafc" stopOpacity={0.8} />
          <stop offset="100%" stopColor="#eef2f7" stopOpacity={0.8} />
        </linearGradient>

        {/* Line gradient */}
        <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#ff7f50" /> {/* your custom color */}
          <stop offset="100%" stopColor="#ff4500" /> {/* darker shade */}
        </linearGradient>
      </defs>

      {/* Subtle grid */}
      <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" vertical={false} />

      {/* X Axis */}
      <XAxis
        dataKey="day"
        tick={{ fontSize: 12, fill: "#6b7280" }}
        axisLine={false}
        tickLine={false}
      />

      {/* Y Axis */}
      <YAxis
        tickFormatter={(v) =>
          v >= 1_000_000
            ? `${(v / 1_000_000).toFixed(1)}M`
            : v >= 1_000
            ? `${(v / 1_000).toFixed(1)}k`
            : v
        }
        tick={{ fontSize: 12, fill: "#6b7280" }}
        axisLine={false}
        tickLine={false}
      />

      {/* Tooltip */}
      <Tooltip
        contentStyle={{
          backgroundColor: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: "8px",
          fontSize: "12px",
        }}
        formatter={(value) => NGN(value)}
        labelFormatter={(label) => `Date: ${label}`}
      />

      {/* Main Line */}
      <Line
        type="monotone"
        dataKey="cumulative"
        stroke="url(#lineGradient)"
        strokeWidth={3}
        dot={false}
      />
    </LineChart>
  </ResponsiveContainer>
</div>

        </div>
      </div>
    </div>
  );
}
