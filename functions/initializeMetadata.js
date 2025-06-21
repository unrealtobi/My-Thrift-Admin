const admin = require("firebase-admin");

const serviceAccount = require('./Serviceaccount.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://ecommerce-ba520.firebaseio.com",
});

const db = admin.firestore();

const initializeMetadataForUsers = async () => {
    try {
        // Fetch all users from the `users` collection
        const usersSnapshot = await db.collection("users").get();

        if (usersSnapshot.empty) {
            console.log("No users found in the database.");
            return;
        }

        const batch = db.batch();

        // Iterate over each user document
        usersSnapshot.forEach((doc) => {
            const userId = doc.id; // Assuming user ID matches the document ID
            const metadataRef = db.collection("usage_metadata").doc(userId);

            // Add metadata creation to the batch
            batch.set(metadataRef, {
                uid: userId,
                writeCount: 0, // Initial write count
                lastWrite: null, // No writes yet
                resetTime: null, // Reset time not set initially
            });
        });

        // Commit the batch operation
        await batch.commit();
        console.log("Metadata initialized for all existing users.");
    } catch (error) {
        console.error("Error initializing metadata for users:", error);
    }
};

// Run the script
initializeMetadataForUsers();
