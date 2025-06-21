const admin = require("firebase-admin");
const serviceAccount = require("./Serviceaccount.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
databaseURL: "https://<ecommerce-ba250>.firebaseio.com"
});

const db = admin.firestore();

async function fetchVendorEmails() {
  try {
    const vendorsSnapshot = await db.collection("vendors").get();
    const vendorEmails = vendorsSnapshot.docs
      .map((doc) => doc.data().email)
      .filter((email) => email);
    
    console.log("Vendor Emails:", vendorEmails);
    return vendorEmails;
  } catch (error) {
    console.error("Error fetching vendor emails:", error);
    return [];
  }
}

// Run it immediately
fetchVendorEmails();
