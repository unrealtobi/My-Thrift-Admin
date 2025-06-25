import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase.config";
import { CSVLink } from "react-csv";
import ReactPaginate from "react-paginate";
import { FaChevronLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

export default function SubscriptionList() {
  const navigate = useNavigate();
  const [subscriptions, setSubscriptions] = useState([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    const fetchSubscriptions = async () => {
      const ref = collection(db, "subscriptions");
      const snap = await getDocs(ref);
      const list = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setSubscriptions(list);
    };
    fetchSubscriptions();
  }, []);

  const filtered = subscriptions.filter(
    (sub) =>
      sub.email?.toLowerCase().includes(search.toLowerCase()) ||
      sub.emails?.some((e) => e.toLowerCase().includes(search.toLowerCase()))
  );

  const pageCount = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const offset = currentPage * ITEMS_PER_PAGE;
  const paginated = filtered.slice(offset, offset + ITEMS_PER_PAGE);

  const totalEmails = subscriptions.reduce(
    (acc, sub) => acc + (sub.emails?.length || 0),
    0
  );

  return (
    <div className="p-6">
      <button
        onClick={() => navigate(-1)}
        className="bg-customOrange text-white px-4 py-2 rounded-lg flex mb-8 items-center"
      >
        <FaChevronLeft className="mr-2" /> Back
      </button>
      <div className="flex justify-between items-center flex-wrap mb-6">
        <h1 className="text-3xl text-customOrange font-bold font-opensans">
          Email Subscriptions
        </h1>

        <CSVLink
          data={subscriptions.flatMap(
            (s) => s.emails?.map((e) => ({ email: e })) || []
          )}
          filename={"subscribed_emails.csv"}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Export CSV
        </CSVLink>
      </div>

      <div className="bg-customOrange p-4 rounded-lg text-white mb-6 max-w-sm">
        <p className="text-lg font-bold">
          Total Subscriptions: {subscriptions.length}
        </p>
        <p className="text-md">Total Emails: {totalEmails}</p>
      </div>

      <div className="mb-4 flex flex-col md:flex-row gap-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search email addresses..."
          className="p-2 border border-gray-300 rounded w-full md:w-1/2"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border rounded shadow">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-3">Primary Email</th>
              <th className="p-3">Subscribed Emails</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((sub, index) => (
              <tr key={index} className="border-t hover:bg-gray-50">
                <td className="p-3 font-medium text-sm">{sub.email}</td>
                <td className="p-3 text-sm">
                  <ul className="list-disc pl-5 space-y-1">
                    {sub.emails?.map((email, i) => (
                      <li key={i} className="truncate max-w-xs">
                        {email}
                      </li>
                    ))}
                  </ul>
                </td>
              </tr>
            ))}
            {paginated.length === 0 && (
              <tr>
                <td colSpan={2} className="p-4 text-center text-gray-500">
                  No subscriptions found.
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
        onPageChange={({ selected }) => setCurrentPage(selected)}
        containerClassName={"flex justify-center mt-6 space-x-2"}
        pageClassName={"px-3 py-2 bg-gray-200 rounded"}
        activeClassName={"bg-blue-500 text-white"}
        previousClassName={"px-3 py-2 bg-blue-500 text-white rounded"}
        nextClassName={"px-3 py-2 bg-blue-500 text-white rounded"}
      />
    </div>
  );
}
