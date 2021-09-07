// const util = require('util');
// var AWS = require('@aws-sdk/types');
// const Keys = require('./Keys');

class NodeSQSProducer {
  /**
   *
   * @param {AWS} awsObj
   */
  constructor(awsObj) {
    this.sqs = new awsObj.SQS();
  }

  async getQueues() {
    try {
      const data = await this.sqs.listQueues().promise();
      console.log('Success', data.QueueUrls);
      return data;
    } catch (error) {
      console.log('Error', err);
    }
  }

  async publishMessage(
    queueUrl,
    newMessageTitle,
    newMessageBody,
    newMessageAuthor
  ) {
    if (!newMessageTitle || typeof newMessageTitle !== 'string') {
      throw new Error('Title is missing for sending a message to SQS queue');
    }
    if (!queueUrl) {
      throw new Error('Was not able to find SQS queue. Got: ', queueUrl);
    }
    if (!newMessageBody) {
      throw new Error(
        'Cannot send empty message to SQS queue. Got: ',
        newMessageBody
      );
    }
    const params = {
      MessageAttributes: {
        ['Title']: {
          DataType: 'String',
          StringValue: newMessageTitle
        },
        ['Author']: {
          DataType: 'String',
          StringValue: newMessageAuthor
        }
      },
      MessageBody: JSON.stringify(newMessageBody),
      QueueUrl: queueUrl
    };

    const messageAcknowledge = await this.sqs.sendMessage(params).promise();

    return messageAcknowledge;
  }
}

module.exports = NodeSQSProducer;

// AWS.config.update({
//   region: 'us-east-2',
//   accessKeyId: Keys.accessKeys.accessKeyId,
//   secretAccessKey: Keys.accessKeys.secretAccessKey
// });

// // Create an SQS service object
// const sqs = new AWS.SQS();

// const asyncGetQueues = util.promisify(sqs.listQueues);
// const asyncSendMessage = util.promisify(sqs.sendMessage);

// module.exports.getQueues = async () => {
//   try {
//     const data = await sqs.listQueues().promise();
//     console.log('Success', data.QueueUrls);
//     return data;
//   } catch (error) {
//     console.log('Error', err);
//   }
// };

// module.exports.publishMessage = async (queueUrl, newMessage) => {
//   const params = {
//     MessageBody: JSON.stringify(newMessage),
//     QueueUrl: queueUrl
//   };

//   const messageAcknowledge = await sqs.sendMessage(params).promise();

//   return messageAcknowledge;
// };
