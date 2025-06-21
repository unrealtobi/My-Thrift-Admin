// const functions = require("firebase-functions");
// const admin = require("firebase-admin");
// const cors = require("cors")({ origin: true });

// admin.initializeApp();
// exports.deleteVendorAndData = functions.https.onRequest((req, res) => {
//   cors(req, res, async () => {
//     if (req.method !== "POST") {
//       return res.status(403).send("Forbidden!");
//     }

//     const uid = req.body.uid;

//     try {
//       // 1. Delete the vendor from Firebase Authentication (optional if needed)
//       await admin.auth().deleteUser(uid);

//       const batch = admin.firestore().batch();

//       // 2. Delete the vendor's document from the vendors collection
//       const vendorDocRef = admin.firestore().collection("vendors").doc(uid);
//       batch.delete(vendorDocRef);

//       // 3. Fetch and delete all products associated with this vendor
//       const productsSnapshot = await admin
//         .firestore()
//         .collection("products")
//         .where("vendorId", "==", uid)
//         .get();

//       productsSnapshot.forEach((doc) => {
//         batch.delete(doc.ref); // Delete each product document
//       });

//       // 4. Commit the batch operation to delete the vendor and products
//       await batch.commit();

//       return res
//         .status(200)
//         .json({
//           success: true,
//           message: `Vendor ${uid} and all related data deleted successfully.`,
//         });
//     } catch (error) {
//       console.error("Error deleting vendor and data:", error);
//       return res.status(500).json({ success: false, error: error.message });
//     }
//   });
// });



// Import the Firebase Admin SDK
const admin = require('firebase-admin');

// Import the Service Account Key
const serviceAccount = require('./Serviceaccount.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Fetch User by UID
const auth = admin.auth();

async function fetchUserByUID(uid) {
  try {
    const userRecord = await auth.getUser(uid);
    console.log('User Details:', userRecord);
    console.log('Provider Data:', userRecord.providerData); // List of auth providers
  } catch (error) {
    console.error('Error fetching user:', error.message);
  }
}

// Replace 'USER_UID' with the actual user's UID
fetchUserByUID('ejCH0T3E0YOKXHN4PjWuBXVFV5J2');
