const admin = require('firebase-admin');
const serviceAccount = require('./Serviceaccount.json'); // replace with the correct relative path to the JSON file



// Initialize Firebase Admin SDK
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount), // Ensure you have your serviceAccountKey.json file
  databaseURL: "https://<ecommerce-ba250>.firebaseio.com",
});

// Replace with the email of the user you want to make admin
const email = "olaatobii@gmail.com";

admin.auth().getUserByEmail(email)
  .then((user) => {
    return admin.auth().setCustomUserClaims(user.uid, { admin: true });
  })
  .then(() => {
    console.log(`Success! ${email} has been made an admin.`);
  })
  .catch((error) => {
    console.error("Error making admin:", error);
  });
