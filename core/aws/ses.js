const AWS = require('aws-sdk')

AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: 'eu-west-1',
});

// Handle promise's fulfilled/rejected states
const ses = new AWS.SES({ apiVersion: '2010-12-01' })


module.exports = {
    sendEmail: async (recipientEmail, subject, text, link) => {

        const params = {
            Destination: { /* required */

                ToAddresses: [
                    recipientEmail,
                    /* more items */
                ]
            },
            Message: { /* required */
                Body: { /* required */
                    Html: {
                        Charset: "UTF-8",
                        Data: text
                    },
                    Text: {
                        Charset: "UTF-8",
                        Data: text
                    }
                },
                Subject: {
                    Charset: 'UTF-8',
                    Data: subject
                }
            },
            Source: process.env.EMAIL, /* required */
            ReplyToAddresses: [
                process.env.EMAIL,
                /* more items */
            ],
        };

        const sendPromise = ses.sendEmail(params).promise();

        // Handle promise's fulfilled/rejected states
        return sendPromise.then(
            function (data) {
                return data
            }).catch(
                function (err) {
                    console.error('Error sending email :', err, err.stack);
                    throw new Error(err)

                });
    },
}

