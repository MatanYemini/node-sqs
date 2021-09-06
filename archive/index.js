const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');
const { GoogleToken } = require('gtoken');

let jwtClient;

const setupJwtClient = () => {
  jwtClient = new google.auth.JWT(
    saDetails.client_email,
    keyPath,
    saDetails.private_key,
    [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive',
      'https://www.googleapis.com/auth/documents'
    ]
  );
};

jwtClient;

let tokens = null;

const gtoken = new GoogleToken({
  keyFile: './matan-docs-service-account.json',
  scope: [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/documents'
  ],
  eagerRefreshThresholdMillis: 5 * 60 * 1000 // or space-delimited string of scopes,
});

const authenticate = async () => {
  if (gtoken.hasExpired() && gtoken.accessToken) {
    await gtoken.refreshToken();
  } else {
    tokens = await gtoken.getToken();
  }
};

const createGoogleDocument = async () => {
  // await authenticate();
  // console.log(gtoken);
  const docs = google.docs({ version: 'v1' });
  const bodyTemplate = {
    title: 'MatanTest'
  };

  const createdDoc = await docs.documents.create(bodyTemplate);
  // console.log(createdDoc);
};

const getToken = async (_serviceAccountJson, _cb) => {
  const gtoken = new GoogleToken({
    keyFile: './matan-docs-service-account.json',
    scope: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive',
      'https://www.googleapis.com/auth/documents'
    ] // or space-delimited string of scopes
  });

  gtoken.getToken((err, token) => {
    if (err) {
      console.log('ERROR: ', err);
      return;
    }
    console.log(token);
    token = token;
  });
};

const authorizeServiceAccount = async () => {
  try {
    if (!gtoken || gtoken.hasExpired()) {
      console.log('Sss');
      await getToken();
    }
  } catch (error) {
    console.log(error);
  }
};

const createGoogleDoc = async () => {
  await authorizeServiceAccount();
  setTimeout(() => {
    console.log('hh', token);
  }, 10000);
};

const main = async () => {
  //   await authorizeServiceAccount();
  //   await createGoogleDoc();
  await createGoogleDocument();
};

async function generateDocs() {
  const keyPath = path.resolve('matan-docs-service-account.json');
  const saDetails = fs.readFileSync(keyPath);
  console.log(keyPath);

  // configure a JWT auth client
  let jwtClient = new google.auth.JWT(
    saDetails.client_email,
    keyPath,
    saDetails.private_key,
    [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive',
      'https://www.googleapis.com/auth/documents'
    ]
  );
  //authenticate request
  jwtClient.authorize(function (err, tokens) {
    if (err) {
      console.log(err);
      return;
    } else {
      console.log('Successfully connected!');
    }
  });

  //   jwtClient.gtoken.hasExpired()

  //   const docs = google.docs({ version: 'v1', auth: jwtClient });

  //     docs.documents.get(
  //       {
  //         documentId: '195j9eDD3ccgjQRttHhJPymLJUCOUjs-jmwTrekvdjFE'
  //       },
  //       (err, res) => {
  //         if (err) return console.log('The API returned an error: ' + err);
  //         console.log(`The title of the document is: ${res.data.title}`);
  //       }
  //     );

  // const bodyTemplate  = {
  //     title: "MatanTest",
  //     body: {
  //         content: {
  //             elements: [{
  //                 autoText: "aaaa"
  //             }]
  //         }
  //     }
  // }

  // const bodyTemplate  = {
  //     title: "MatanTest",
  // }

  // const createdDoc = await docs.documents.create(bodyTemplate);

  // console.log("created: ", createdDoc.data.documentId);

  const driveFile = google.drive({ version: 'v2', auth: jwtClient });

  const updateFile = await driveFile.permissions.insert({
    fileId: '1R_-OuwJYfZmTnoTclVLznqJMiJ07QP4J7HiNWANT1f0',
    supportsAllDrives: true,
    requestBody: {
      role: 'writer',
      type: 'anyone'
    }
  });

  const file = await (await driveFile.files.list()).data.items[0];

  console.log('file: ', file);

  //   //   const creds = await gToken.getCredentials(keyPath);

  //   const token = await gToken.getToken({ forceRefresh: true });

  //   const oAuth2Client = new google.auth.OAuth2(
  //     saDetails.client_id,
  //     saDetails.client_secret
  //   );
  //   oAuth2Client.setCredentials({
  //     access_token: token
  //   });

  //
}

// authorizeServiceAccount();

// generateDocs();
(async () => {
  await main();
})();
