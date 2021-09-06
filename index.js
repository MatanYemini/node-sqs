const express = require('express');
const httpStatuses = require('http-status');

const googleapisUtils = require('./googleapis-utils');

var AWS = require('aws-sdk');

AWS.config.update({
  region: 'us-east-2',
  accessKeyId: 'AKIAWHLWZG3HPRRL2TNT',
  secretAccessKey: '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'
});

AWS.config.getCredentials(function (err) {
  if (err) console.log(err.stack);
  // credentials not loaded
  else {
    console.log('Access key:', AWS.config.credentials.accessKeyId);
  }
});

const app = express();
const port = 5080;

// parse application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: false }));

// parse application/json
app.use(express.json());

app.post('/create-doc', async (req, res) => {
  if (req.body && req.body.title) {
    try {
      const fileUrl = await googleapisUtils.createGoogleDocument(
        req.body.title
      );
      if (!fileUrl) {
        return res
          .status(httpStatuses.NO_CONTENT)
          .send({ ok: false, msg: 'no content' });
      }
      return res.status(httpStatuses.OK).send({ ok: true, fileUrl });
    } catch (error) {
      return res
        .status(httpStatuses.INTERNAL_SERVER_ERROR)
        .send({ ok: false, msg: 'server error' });
    }
  }
});

// catch errors
app.use((err, req, res, _next) => {
  const status = err.status || httpStatuses.INTERNAL_SERVER_ERROR;
  const msg = err.error || err.message;
  log.error(
    { body: req.body },
    `Error ${status} (${msg}) on ${req.method} ${req.url}.`
  );
  if (err.stack) {
    log.error(err.stack);
  }
  res.status(status).send({
    status,
    error: msg
  });
});

app.listen(port, async () => {
  googleapisUtils.setupJwtClient();
  await googleapisUtils.authorize();
  console.log(`listening at http://localhost:${port}`);
});
