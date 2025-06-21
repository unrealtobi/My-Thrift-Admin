const admin = require('firebase-admin');
const serviceAccount = require('./Serviceaccount.json'); // replace with the correct relative path to the JSON file

// Initialize Firebase Admin SDK
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount), // Ensure you have your serviceAccountKey.json file
    databaseURL: "https://<ecommerce-ba250>.firebaseio.com", // replace with your actual database URL
});

// Replace with the email and password of the admin user you want to create or update
const email = "admin@gmail.com";
const password = "Bigboy90p"; // Set your desired password

// Create the user with email and password, or update if the user already exists
admin.auth().getUserByEmail(email)
  .then((user) => {
    console.log('User already exists:', user.uid);

    // If the user exists, we update the password
    return admin.auth().updateUser(user.uid, {
      password: password,
    });
  })
  .catch((error) => {
    if (error.code === 'auth/user-not-found') {
      // If the user does not exist, create the user with the provided email and password
      return admin.auth().createUser({
        email: email,
        password: password,
      });
    } else {
      // Handle other errors
      throw error;
    }
  })
  .then((userRecord) => {
    // Now we assign admin claims to the user
    return admin.auth().setCustomUserClaims(userRecord.uid, { admin: true });
  })
  .then(() => {
    console.log(`Success! ${email} has been made an admin with a new password.`);
  })
  .catch((error) => {
    console.error("Error making admin or setting password:", error);
  });
