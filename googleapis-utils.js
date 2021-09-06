const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

let jwtClient;

const setupJwtClient = () => {
  const keyPath = path.resolve('matan-docs-service-account.json');
  const saDetails = fs.readFileSync(keyPath);
  jwtClient = new google.auth.JWT(
    {
      email: saDetails.client_email,
      keyFile: keyPath,
      key: saDetails.private_key,
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/documents'
      ],
      forceRefreshOnFailure: true
    }
    // saDetails.client_email,
    // keyPath,
    // saDetails.private_key,
    // [
    //   'https://www.googleapis.com/auth/spreadsheets',
    //   'https://www.googleapis.com/auth/drive',
    //   'https://www.googleapis.com/auth/documents'
    // ],
    // forceRefreshOnFailure: true,
  );
};

const authorize = async () => {
  //authenticate request
  return new Promise((resolve, reject) => {
    jwtClient.authorize(function (err, _tokens) {
      if (err) {
        console.log(err);
        reject(err);
      } else {
        console.log('Successfully connected!');
        resolve();
      }
    });
  });
};

const createGoogleDocument = async (title) => {
  if (jwtClient.gtoken.hasExpired()) {
    await authorize();
  }
  const docs = google.docs({ version: 'v1', auth: jwtClient });

  const bodyTemplate = {
    title: title || 'MatanTest2'
  };

  let fileUrl;
  const createdDoc = await docs.documents.create(bodyTemplate);
  if (createdDoc && createdDoc.data && createdDoc.data.documentId) {
    fileUrl = await insertPermissionsFor(
      createdDoc.data.documentId,
      'anyone',
      'writer'
    );
  }

  return fileUrl;
};

const insertPermissionsFor = async (documentId, pAudienceType, pRoleAccess) => {
  // Read here: https://developers.google.com/drive/api/v3/manage-sharing
  const driveFile = google.drive({ version: 'v2', auth: jwtClient });

  await driveFile.permissions.insert({
    fileId: documentId,
    supportsAllDrives: true,
    requestBody: {
      role: pRoleAccess,
      type: pAudienceType
    }
  });

  const file = (await driveFile.files.list()).data.items[0];

  return file.alternateLink;
};

module.exports = {
  setupJwtClient,
  authorize,
  createGoogleDocument,
  insertPermissionsFor
};
