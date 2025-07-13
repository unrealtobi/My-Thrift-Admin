import React, { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase.config";
import { getFunctions, httpsCallable } from "firebase/functions";
import { FaChevronLeft } from "react-icons/fa";
import toast, { Toaster } from "react-hot-toast";

export default function FeedbackDetails() {
  const { id } = useParams();
  const [feedback, setFeedback] = useState(null);
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  const functions = getFunctions();
  const sendPush = httpsCallable(functions, "sendAdminPushNotification");

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

  const handleSendMessage = async () => {
    if (!title || !body) return toast.error("Title and body are required.");
    if (!feedback.userId) return toast.error("This feedback is from a guest.");

    setSending(true);
    toast.loading("Sending message...");

    try {
      const payload = {
        title,
        body,
        targetType: "custom",
        vendorIds: feedback.isVendor ? [feedback.userId] : [],
        userIds: !feedback.isVendor ? [feedback.userId] : [],
      };

      const { data } = await sendPush(payload);

      if (data.success) {
        toast.dismiss();
        toast.success("Message sent and saved.");

        // Save reply and mark as reviewed in Firestore
        const feedbackRef = doc(db, "feedbacks", feedback.id);
        await updateDoc(feedbackRef, {
          isReviewed: true,
          adminReply: {
            title,
            body,
            sentAt: new Date(), // you can use Timestamp.now() if you import from firebase/firestore
          },
        });

        setFeedback((prev) => ({
          ...prev,
          isReviewed: true,
          adminReply: { title, body, sentAt: new Date() },
        }));

        setTitle("");
        setBody("");
      } else {
        toast.dismiss();
        toast.error(data.message || "Failed to send message.");
      }
    } catch (err) {
      toast.dismiss();
      toast.error("An error occurred.");
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const formatDate = (ts) => ts?.toDate?.().toLocaleString() || "—";

  if (!feedback) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 space-y-6">
      <Toaster position="top-right" />
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
                <strong>User ID:</strong>{" "}
                <Link
                  to={`/dashboard/newusers/${feedback.userId}`}
                  className="text-blue-600 underline"
                >
                  {feedback.userId}
                </Link>
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

      {feedback.userId && (
        <div className="mt-8 border p-6 rounded shadow">
          <h2 className="text-lg font-bold text-customOrange mb-4">
            Send Message to {feedback.isVendor ? "Vendor" : "User"}
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block font-medium text-gray-700 mb-1">
                Message Body
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={4}
                className="w-full border border-gray-300 rounded px-3 py-2"
              ></textarea>
            </div>
            <button
              onClick={handleSendMessage}
              disabled={sending}
              className="bg-customOrange text-white px-4 py-2 rounded hover:bg-opacity-90"
            >
              {sending ? "Sending..." : "Send Message"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
