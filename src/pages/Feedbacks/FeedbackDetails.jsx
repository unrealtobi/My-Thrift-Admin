// File: src/pages/admin/feedbacks/[id].jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase.config";
import { FaChevronLeft } from "react-icons/fa";

export default function FeedbackDetails() {
  const { id } = useParams();
  const [feedback, setFeedback] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFeedback = async () => {
      const ref = doc(db, "feedbacks", id);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const fbData = snap.data();
        const vendorSnap = fbData.userId
          ? await getDoc(doc(db, "vendors", fbData.userId))
          : null;
        const isVendor = vendorSnap?.exists() || false;
        setFeedback({
          id: snap.id,
          ...fbData,
          isVendor,
          vendorData: vendorSnap?.data(),
        });
      }
    };
    fetchFeedback();
  }, [id]);

  const handleMarkAsReviewed = async () => {
    await updateDoc(doc(db, "feedbacks", feedback.id), {
      isReviewed: true,
    });
    setFeedback((prev) => ({ ...prev, isReviewed: true }));
  };

  const formatDate = (ts) => ts?.toDate?.().toLocaleString() || "—";

  if (!feedback) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="bg-customOrange text-white px-4 py-2 rounded-lg flex items-center mb-4"
      >
        <FaChevronLeft className="mr-2" />
        Back
      </button>
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-customOrange">
          Feedback Details
        </h1>
        <button
          className="bg-green-600 text-white px-4 py-2 rounded"
          onClick={handleMarkAsReviewed}
          disabled={feedback.isReviewed}
        >
          {feedback.isReviewed ? "Already Reviewed" : "Mark as Reviewed"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border p-4 rounded shadow">
          <h2 className="font-semibold text-customOrange mb-2">Info</h2>
          <p>
            <strong>Email:</strong> {feedback.email}
          </p>
          <p>
            <strong>Type:</strong> {feedback.feedbackType}
          </p>
          <p>
            <strong>Submitted:</strong> {formatDate(feedback.submittedAt)}
          </p>
          <p>
            <strong>Status:</strong>{" "}
            {feedback.isReviewed ? "Reviewed" : "Unreviewed"}
          </p>
        </div>

        <div className="border p-4 rounded shadow">
          <h2 className="font-semibold text-customOrange mb-2">Source</h2>
          {feedback.userId ? (
            feedback.isVendor ? (
              <p>
                <strong>Vendor Name:</strong>{" "}
                <Link
                  to={`/dashboard/vendors/${feedback.userId}`}
                  className="text-blue-600 underline"
                >
                  {feedback.vendorData?.shopName || "Vendor"}
                </Link>
              </p>
            ) : (
              <p>
                <strong>User ID:</strong> {feedback.userId}
              </p>
            )
          ) : (
            <p>
              <strong>Source:</strong> Guest
            </p>
          )}
        </div>

        <div className="md:col-span-2 border p-4 rounded shadow">
          <h2 className="font-semibold text-customOrange mb-2">Message</h2>
          <p className="bg-gray-100 p-4 rounded">{feedback.feedbackText}</p>

          {feedback.attachmentUrls?.length > 0 && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Attachments</h3>
              <div className="flex gap-4 flex-wrap">
                {feedback.attachmentUrls.map((url, i) => (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <img
                      src={url}
                      alt={`Attachment ${i + 1}`}
                      className="w-32 h-32 object-cover rounded shadow"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
