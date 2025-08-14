// File: src/pages/admin/revenue/RevenueDashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "../../firebase.config";
import { FaChevronLeft, FaChartLine, FaTable, FaFileExport } from "react-icons/fa";
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
} from "recharts";

// ---- Helpers ----
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

export default function RevenueDashboard() {
  const navigate = useNavigate();

  // Raw items fetched from Firestore
  const [items, setItems] = useState([]); // { id, serviceFee: number, createdAt: Date }
  const [loading, setLoading] = useState(true);

  // UI states
  const [viewGraph, setViewGraph] = useState(false);
  const [range, setRange] = useState("month"); // 'day' | 'week' | 'month' | 'all'
  const [page, setPage] = useState(0);
  const PER_PAGE = 10;

  // Fetch all service fees (sorted desc by createdAt)
  useEffect(() => {
  const run = async () => {
    try {
      setLoading(true);

      const qy = query(collection(db, "cartServiceFees"), orderBy("timestamp", "desc"));
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



  // Filter by timeframe
  const filtered = useMemo(() => {
    if (range === "all") return items;
    const now = new Date();
    const todayStart = startOfDay(now);
    if (range === "day") {
      // from start of today
      return items.filter((i) => i.createdAt >= todayStart);
    }
    if (range === "week") {
      // last 7 days including today
      const sevenDaysAgo = addDays(todayStart, -6); // include today => 7 days window
      return items.filter((i) => i.createdAt >= sevenDaysAgo);
    }
    if (range === "month") {
      const monthAgo = addDays(todayStart, -29); // 30 days window
      return items.filter((i) => i.createdAt >= monthAgo);
    }
    return items;
  }, [items, range]);

  // Live totals
  const totalAllTime = useMemo(
    () => items.reduce((sum, r) => sum + (r.serviceFee || 0), 0),
    [items]
  );
  const totalFiltered = useMemo(
    () => filtered.reduce((sum, r) => sum + (r.serviceFee || 0), 0),
    [filtered]
  );

  // Table pagination over filtered list
  const pageCount = Math.ceil(filtered.length / PER_PAGE) || 1;
  const currentRows = useMemo(() => {
    const start = page * PER_PAGE;
    return filtered.slice(start, start + PER_PAGE);
  }, [filtered, page]);

  // Build data for graph: daily buckets (ascending date)
  const chartData = useMemo(() => {
    if (!items.length) return [];
    // We want from earliest to latest (ascending) for graph & cumulative line
    const ascending = [...items].sort((a, b) => a.createdAt - b.createdAt);
    const dailyMap = new Map(); // dayKey -> total
    for (const row of ascending) {
      const k = formatDayKey(row.createdAt);
      dailyMap.set(k, (dailyMap.get(k) || 0) + (row.serviceFee || 0));
    }
    // Build a continuous series from first to last day for smoother chart
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

  // CSV export for the *filtered* list
  const exportCSV = () => {
    if (!filtered.length) {
      toast.info("No transactions to export for this range.");
      return;
    }
    const headers = ["ID", "Service Fee (NGN Kobo)", "Service Fee (₦)", "Date/Time"];
    const rows = filtered.map((r) => [
      r.id,
      // keep a raw value column and a pretty column
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

  // Reset page when range changes
  useEffect(() => {
    setPage(0);
  }, [range]);

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

      {/* Totals summary */}
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
              {r === "day" ? "Today" : r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* KPI card */}
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

      {/* Action Row */}
      <div className="flex items-center justify-between mb-4">
        <div className="font-semibold text-gray-700">
          {viewGraph ? "Revenue Graph" : "Transactions"}
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportCSV}
            className="px-4 py-2 bg-green-600 text-white rounded flex items-center gap-2 hover:bg-green-700"
            title="Export filtered rows to CSV"
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

      {/* Content area with slide animation */}
      <div className="relative overflow-hidden">
        {/* Table */}
        <div
          className={`transition-all duration-500 ${
            viewGraph ? "opacity-0 -translate-x-6 absolute inset-0 pointer-events-none" : "opacity-100 translate-x-0"
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

          {/* Pagination */}
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
            viewGraph ? "opacity-100 translate-x-0" : "opacity-0 translate-x-6 absolute inset-0 pointer-events-none"
          }`}
        >
          <div className="bg-white border rounded shadow p-4 h-[420px]">
            {chartData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 12 }}
                    interval="preserveStartEnd"
                    minTickGap={24}
                  />
                  <YAxis
                    tickFormatter={(v) =>
                      v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v >= 1_000 ? `${(v / 1_000).toFixed(1)}k` : v
                    }
                  />
                  <Tooltip
                    formatter={(value, name) => [NGN(value), name === "daily" ? "Daily" : "Cumulative"]}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Bar dataKey="daily" name="Daily" />
                  <Line dataKey="cumulative" name="Cumulative" dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                Not enough data to display a graph.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
