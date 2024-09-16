const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });

admin.initializeApp();

exports.deleteUserAndData = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(403).send('Forbidden!');
    }

    const uid = req.body.uid;

    try {
      // 1. Delete the user from Firebase Authentication
      await admin.auth().deleteUser(uid);

      // 2. Define the collections where you need to delete documents
      const collectionsToDeleteFrom = ['favorites', 'notifications', 'carts', 'follows'];

      const batch = admin.firestore().batch();

      // 3. Delete the user's document from the users collection
      const userDocRef = admin.firestore().collection('users').doc(uid);
      batch.delete(userDocRef);  // Add delete operation for users collection

      // 4. Delete associated documents from other collections
      for (const collection of collectionsToDeleteFrom) {
        const docRef = admin.firestore().collection(collection).doc(uid);
        batch.delete(docRef);  // Add delete operation for each associated collection
      }

      // 5. Commit the batch operation
      await batch.commit();

      // 6. Return a success message
      return res.status(200).json({ success: true, message: `User ${uid} and associated data deleted successfully.` });
    } catch (error) {
      console.error('Error deleting user:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  });
});

