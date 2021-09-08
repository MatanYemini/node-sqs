// const util = require('util');
// var AWS = require('@aws-sdk/types');
// const Keys = require('./Keys');

class NodeSQSConsumer {
    /**
     *
     * @param {AWS} awsObj
     */
    constructor(awsObj, queueUrl, consumerIntervalInSeconds) {
      this.sqs = new awsObj.SQS();
      this.consumerInterval = null;
      this.CONSUMER_INTERVAL = consumerIntervalInSeconds || 5000;
      this.queueUrl = queueUrl
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
  
    async receiveMessage(
      queueUrl,
      params,
    ) {
      if (!queueUrl) {
        throw new Error('Was not able to find SQS queue. Got: ', queueUrl);
      } 

      if (!params) {
          params = {};
      }
      params = {
        AttributeNames: ["SentTimestamp"],
        MaxNumberOfMessages: 10,
        MessageAttributeNames: ["All"],
        QueueUrl: queueUrl,
        VisibilityTimeout: 20,
        WaitTimeSeconds: 20,
      };
      const kkk = this.sqs.receiveMessage(params, (err, d) => {
          console.log(d);
      })
      const messageData = await this.sqs.receiveMessage(params).promise();
      if (messageData) {
          if (!messageData || !messageData.Messages || !messageData.Messages[0] || !messageData.Messages[0].ReceiptHandle) {
              return;
          }
          // remove the message after it has been consumed
          const deleteAck = await this.sqs.deleteMessage({
              QueueUrl: this.queueUrl,
              ReceiptHandle: messageData.Messages[0].ReceiptHandle,
          }).promise();

          if (deleteAck) {
              console.log("Message Deleted. Ack: ", deleteAck);
          }
      }
  
      return messageData;
    }

    initConsumerInterval(receiveMessageParams) {
        if (this.consumerInterval) {
            clearInterval(this.consumerInterval)
            this.consumerInterval = null;
        }
        this.consumerInterval = setInterval(async () => {
            const messageData = await this.receiveMessage(this.queueUrl, receiveMessageParams);
            console.log("Message Data: ", messageData);
        }, this.CONSUMER_INTERVAL)
    }

    
  }
  
  module.exports = NodeSQSConsumer;  