const { ApolloServer, PubSub } = require('apollo-server');

require('dotenv').config()

const { mongodbConnection } = require('./config');
mongodbConnection();

const typeDefs = require('./graphql/schema')
const resolvers = require('./graphql/resolvers')

const pubsub = new PubSub();

const server = new ApolloServer({
    cors: true,
    typeDefs,
    formatError: (err) => {
        return err;
    },
    resolvers,
    context: ({ req, res }) => ({ req, res, pubsub, playerId: "5e9582ecb1f1623b439af5ab", playerEmail: process.env.EMAIL }),
    playground: true,
    introspection: true,
})



server.listen({ port: process.env.PORT || 4000 }).then(({ url, subscriptionsUrl }) => {

    console.log(`🚀 Server ready at ${url}`)
    console.log(`🚀 Subscription ready at ${subscriptionsUrl}`)
}
);
