const express = require('express');
const httpStatuses = require('http-status');

const googleapisUtils = require('./googleapis-utils');
// const sqsUtils = require('./node-sqs-producer');
const Keys = require('./Keys');
const NodeSQSProducer = require('./node-sqs-producer');
const NodeSQSConsumer = require("./node-sqs-consumer");

const AWS = require('aws-sdk');

module.exports.QUEUE_URL =
  'https://sqs.us-east-2.amazonaws.com/428135233230/docs-ss';

AWS.config.update({
  region: 'us-east-2',
  accessKeyId: Keys.accessKeys.accessKeyId,
  secretAccessKey: Keys.accessKeys.secretAccessKey
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

app.set('AWS', AWS);

const nodeSQSProducer = new NodeSQSProducer(AWS);
const nodeSQSConsumer = new NodeSQSConsumer(AWS, this.QUEUE_URL);

nodeSQSConsumer.initConsumerInterval({})

// parse application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: false }));

// parse application/json
app.use(express.json());

app.post('/create-doc-direct', async (req, res) => {
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

app.post('/create-doc', async (req, res) => {
  if (req.body && req.body.title && req.body.author) {
    try {
      const gotAck = await nodeSQSProducer.publishMessage(
        this.QUEUE_URL,
        req.body.title,
        {
          action: 'CREATE'
        },
        req.body.author
      );

      if (gotAck) {
        return res
          .status(httpStatuses.OK)
          .send({ ok: true, data: req.body.title });
      } else {
        return res
          .status(httpStatuses.INTERNAL_SERVER_ERROR)
          .send({ ok: false, msg: 'server error' });
      }
    } catch (error) {
      return res
        .status(httpStatuses.INTERNAL_SERVER_ERROR)
        .send({ ok: false, msg: 'server error' });
    }
  } else {
    return res
      .status(httpStatuses.BAD_REQUEST)
      .send({ ok: false, msg: 'bad request' });
  }
});

// catch errors
app.use((err, req, res, _next) => {
  const status = err.status || httpStatuses.INTERNAL_SERVER_ERROR;
  const msg = err.error || err.message;
  console.error(
    { body: req.body },
    `Error ${status} (${msg}) on ${req.method} ${req.url}.`
  );
  if (err.stack) {
    console.error(err.stack);
  }
  res.status(status).send({
    status,
    error: msg
  });
});

app.listen(port, async () => {
  // googleapisUtils.setupJwtClient();
  // await googleapisUtils.authorize();
  console.log(`listening at http://localhost:${port}`);
});
