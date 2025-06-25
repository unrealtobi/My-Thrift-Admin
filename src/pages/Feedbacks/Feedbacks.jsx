import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  getDoc,
} from "firebase/firestore";
import { db } from "../../firebase.config";
import { Link, useNavigate } from "react-router-dom";
import ReactPaginate from "react-paginate";
import { FaChevronLeft, FaFileExport } from "react-icons/fa";

export default function FeedbackList() {
  const navigate = useNavigate();
  const [feedbacks, setFeedbacks] = useState([]);
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [page, setPage] = useState(0);
  const PER_PAGE = 10;

  const formatDate = (ts) => ts?.toDate?.().toLocaleString() || "—";

  useEffect(() => {
    const fetchFeedbacks = async () => {
      const snap = await getDocs(collection(db, "feedbacks"));
      const list = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setFeedbacks(list);
    };
    fetchFeedbacks();
  }, []);

  const filtered = feedbacks.filter((fb) => {
    const matchSearch =
      fb.email?.toLowerCase().includes(search.toLowerCase()) ||
      fb.feedbackText?.toLowerCase().includes(search.toLowerCase());

    const matchType = filterType === "all" || fb.feedbackType === filterType;

    return matchSearch && matchType;
  });

  const paginated = filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

  const toggleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleExport = () => {
    const headers = ["Email", "Type", "Submitted", "Feedback"];
    const rows = filtered.map((fb) => [
      fb.email,
      fb.feedbackType,
      formatDate(fb.submittedAt),
      fb.feedbackText?.replace(/(\r\n|\n|\r)/gm, " "),
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers, ...rows].map((r) => r.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "feedbacks.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getSource = (userId) => {
    if (!userId) return "Guest";
    if (userId.startsWith("vendor_")) return "Vendor";
    return "Customer";
  };

  const markViewed = async (id) => {
    const ref = doc(db, "feedbacks", id);
    const snap = await getDoc(ref);
    if (snap.exists() && snap.data().isReviewed === undefined) {
      await updateDoc(ref, { isReviewed: false });
    }
  };

  return (
    <div className="p-6">
      <button
        onClick={() => navigate("/dashboard")}
        className="bg-customOrange text-white px-4 py-2 rounded-lg flex items-center mb-4"
      >
        <FaChevronLeft className="mr-2" />
        Back
      </button>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-center text-customOrange">
          Feedbacks
        </h1>
        <button
          onClick={handleExport}
          className="bg-green-600 text-white px-4 py-2 rounded flex items-center hover:bg-green-700"
        >
          <FaFileExport className="mr-2" />
          Export CSV
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search email or message"
          className="p-2 border border-gray-300 rounded w-full md:w-1/2"
        />
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="p-2 border border-gray-300 rounded w-full md:w-1/4"
        >
          <option value="all">All Types</option>
          <option value="bug">Bug</option>
          <option value="suggestion">Suggestion</option>
          <option value="complaint">Complaint</option>
          <option value="payment">Payment</option>
          <option value="general">General</option>
        </select>
      </div>

      <div className="overflow-x-auto bg-white border rounded shadow">
        <table className="min-w-full">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-3">
                <input
                  type="checkbox"
                  onChange={(e) =>
                    setSelected(
                      e.target.checked ? paginated.map((f) => f.id) : []
                    )
                  }
                />
              </th>
              <th className="p-3">Email</th>
              <th className="p-3">Type</th>
              <th className="p-3">Source</th>
              <th className="p-3">Status</th>
              <th className="p-3">Submitted</th>
              <th className="p-3">Feedback</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((fb) => (
              <tr key={fb.id} className="border-t hover:bg-gray-50">
                <td className="p-3">
                  <input
                    type="checkbox"
                    checked={selected.includes(fb.id)}
                    onChange={() => toggleSelect(fb.id)}
                  />
                </td>
                <td className="p-3">{fb.email}</td>
                <td className="p-3 capitalize">{fb.feedbackType}</td>
                <td className="p-3">{getSource(fb.userId)}</td>
                <td className="p-3">
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${
                      fb.isReviewed
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {fb.isReviewed ? "Reviewed" : "Unreviewed"}
                  </span>
                </td>
                <td className="p-3">{formatDate(fb.submittedAt)}</td>
                <td className="p-3 truncate max-w-xs">{fb.feedbackText}</td>
                <td className="p-3">
                  <Link
                    to={`/dashboard/feedbacks/${fb.id}`}
                    className="text-blue-600 hover:underline"
                    onClick={() => markViewed(fb.id)}
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ReactPaginate
        previousLabel="Previous"
        nextLabel="Next"
        breakLabel="..."
        pageCount={Math.ceil(filtered.length / PER_PAGE)}
        onPageChange={({ selected }) => setPage(selected)}
        containerClassName="flex justify-center mt-6 space-x-2"
        pageClassName="px-3 py-2 bg-gray-200 rounded"
        activeClassName="bg-blue-600 text-white"
        previousClassName="px-3 py-2 bg-blue-500 text-white rounded"
        nextClassName="px-3 py-2 bg-blue-500 text-white rounded"
      />
    </div>
  );
}
