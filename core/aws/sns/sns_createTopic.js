const sns = require('./sns')

module.exports = {
    createTopic: (applicantId) => {

        // Create promise and SNS service object
        const createTopicPromise = sns.createTopic({ Name: applicantId }).promise();

        // Handle promise's fulfilled/rejected states
        return createTopicPromise.then(
            function (data) {
                console.log("Topic ARN is " + data.TopicArn);
                return data
            }).catch(
                function (err) {
                    console.error(err, err.stack);
                    throw new Error(err)
                });

    },
    subscribe: (topicArn, subscribers, protocol) => {

        const subscribePromise = sns.subscribe({
            Protocol: 'email',
            Endpoint: process.env.EMAIL,
            TopicArn: 'arn:aws:sns:eu-west-1:176434914235:5ea946b85319a54efb193723',
        }).promise()

        return subscribePromise.then(
            function (data) {
                console.log("Topic ARN is " + data.TopicArn);
                return data
            }).catch(
                function (err) {
                    console.error(err, err.stack);
                    throw new Error(err)
                });
    },
    publish: (message, topicArn) => {
        const publishPromise = sns.publish({
            TopicArn: 'arn:aws:sns:eu-west-1:176434914235:5ea946b85319a54efb193723',
            Message: 'Alice found you a job !!! Elle est trop sympaaaaa'
        }).promise()

        return publishPromise.then(
            function (data) {
                console.log("Topic ARN is " + data.TopicArn);
                return data
            }).catch(
                function (err) {
                    console.error(err, err.stack);
                    throw new Error(err)
                });
    }
}