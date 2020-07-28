

// modules
const { GraphQLScalarType } = require('graphql')
const { Kind } = require('graphql/language')
const mongoose = require('mongoose')
const slugify = require('slugify')
const { withFilter } = require('apollo-server');


// models
const { Player } = require('../models/player');
const { Game } = require('../models/game');
const { Mission } = require('../models/mission');
const { Job } = require('../models/job');
const { Message } = require('../models/message');
const { Notification } = require('../models/notification')

// core
const S3Uri = require('../core/aws/s3Uri')
const { sendEmail } = require('../core/aws/ses')
const { createTopic, subscribe, publish } = require('../core/aws/sns/sns_createTopic')

// document helpers
const { getUri } = require('../domain/document/getUri')
const { getSignedPutUrl } = require('../domain/document/getSignedPutUrl')
const getSignedUrl = require('../domain/document/getSignedUrl')

// utils
const { paginateResults } = require('./utils')

const { ObjectId } = mongoose.Types;


const resolvers = {
    Query: {
        players: async () => {
            const players = await Player.find()
            return players
        },
        games: async (__, { input }) => {
            const { email } = input;
            const player = await Player.findOne({ email })
            if (player === null) {
                return null
            }
            const playerGames = await Game.find({
                $or: [{ 'recruiterId': player.id }, { 'applicantId': player.id }]
            })
            return playerGames
        },
        player: async (__, { input }) => {
            const { email } = input;

            const player = await Player.findOne({ email })

            if (player === null) {
                return Player.create({ email })
            }

            return player
        },
        missions: async (__, { input }) => {
            const { gameId } = input;
            return Mission.find({ gameId })
        },
        getJobsByGameId: async (__, { input }) => {
            const { gameId } = input;
            const jobs = await Job.find({ gameId })
            return jobs


        },
        job: async (__, { input }) => {
            const { jobId } = input;
            const job = await Job.findById(jobId)
            return job
        },
        account: async (__, { input }) => {

            const { email } = input
            let player;
            player = await Player.findOne({ email })

            if (player === null) {
                player = await Player.create({ email })
            }

            const games = await Game.find({
                $or: [{ 'recruiterId': player.id }, { 'applicantId': player.id }]
            })

            return { id: player.id, player, games }

        },
        document: async (__, { input }) => {
            const { jobId } = input
            const result = await Job.findById(jobId, 'applicationProofRef')
            if (result.applicationProofRef) {
                const fileUri = S3Uri.parse(result.applicationProofRef);

                const url = getSignedUrl(fileUri)

                return url
            } else {
                return undefined
            }
        },
        mission: async (__, { input }) => {

            const { missionId } = input;
            const mission = await Mission.findById(missionId)
            return mission
        },
        game: async (__, { input }) => {
            const { gameId } = input;
            const game = await Game.findById(gameId)
            return game

        },

        leaderboardRecruiters: async (__, { input }) => {

            const { pageSize, after, rankFilter } = input;
            const games = await Game.find()

            const allRecruiters = []

            for (let i = 0; i < games.length; i++) {

                const game = games[i]

                const recruiter = await Player.findById(game.recruiterId)

                let index;

                index = allRecruiters.findIndex(player => player.email === recruiter.email)

                if (index === -1) {
                    allRecruiters.push({
                        id: recruiter.id,
                        playerName: recruiter.playerName,
                        email: recruiter.email,
                        acceptedJobsNumber: 0,
                        applicantsNumber: 0,
                    })
                }

            }
            // recruiter kpis
            for (let i = 0; i < allRecruiters.length; i++) {

                const recruiter = allRecruiters[i]

                const games = await Game.find({ recruiterId: recruiter.id })

                if (games.length > 0) {

                    let applicants = []

                    const arrayApplicantIds = games.map(game => game.applicantId)

                    arrayApplicantIds.map(applicantId => {
                        if (!applicants.includes(applicantId)) {
                            applicants.push(applicantId)
                        }
                        return applicants
                    })

                    recruiter.applicantsNumber = applicants.length;

                    for (let i = 0; i < games.length; i++) {

                        const game = games[i]

                        const missions = await Mission.find({ gameId: game.id })

                        const tenJobsMissions = missions.filter(mission => mission.type === process.env.MISSION_TYPE_10JOBS)

                        if (tenJobsMissions.length > 0) {
                            let totalAcceptedJobs = 0;
                            for (let i = 0; i < tenJobsMissions.length; i++) {

                                const mission = tenJobsMissions[i]
                                const jobs = await Job.find({ mission10JobsId: mission.id })
                                const acceptedJobs = jobs.filter(job => job.isAccepted === true)
                                totalAcceptedJobs = totalAcceptedJobs + acceptedJobs.length
                            }
                            recruiter.acceptedJobsNumber = totalAcceptedJobs
                        }
                    }
                }

            }

            const sortedRecruiters = allRecruiters.slice().sort((a, b) => {
                return b.rankFilter - a.rankFilter
            })

            const leaderboardRecruiters = paginateResults(
                {
                    after,
                    pageSize,
                    results: sortedRecruiters,
                    getCursor: (index) => index,
                }
            )

            return {
                leaderboardRecruiters,
                cursor: leaderboardRecruiters.length ? after ? after + 2 : 1 : null,
                hasMore: leaderboardRecruiters.length
                    ? after + pageSize < sortedRecruiters.length - 1
                    : false
            }
        },
        leaderboardApplicants: async (__, { input }) => {
            const { pageSize, after, rankFilter } = input;
            const games = await Game.find()

            const allApplicants = []

            for (let i = 0; i < games.length; i++) {

                const game = games[i]

                const applicant = await Player.findById(game.applicantId)

                let index;

                index = allApplicants.findIndex(player => player.email === applicant.email)

                if (index === -1) {
                    allApplicants.push({
                        id: applicant.id,
                        playerName: applicant.playerName,
                        email: applicant.email,
                        appliedJobs: 0,
                    })
                }

            }

            for (let i = 0; i < allApplicants.length; i++) {

                const applicant = allApplicants[i];
                const games = await Game.find({ applicantId: applicant.id });
                for (let i = 0; i < games.length; i++) {
                    const game = games[i];
                    const jobs = await Job.find({ gameId: game.id })
                    applicant.appliedJobs = applicant.appliedJobs + jobs.filter(job => job.isApplied === true).length
                }
            }

            const sortedApplicants = allApplicants.slice().sort((a, b) => {
                return b[rankFilter] - a[rankFilter]
            })

            const leaderboardApplicants = paginateResults(
                {
                    after,
                    pageSize,
                    results: sortedApplicants,
                    getCursor: (index) => index,
                }
            )

            return {
                leaderboardApplicants,
                cursor: leaderboardApplicants.length ? after ? after + pageSize : 1 : null,
                hasMore: leaderboardApplicants.length
                    ? after + pageSize < sortedApplicants.length - 1
                    : false
            }
        },
        leaderboardResults: async () => {

            // faire recruiters ET applicant
            const games = await Game.find()

            const recruiters = []
            const applicants = []

            for (let i = 0; i < games.length; i++) {

                const game = games[i]

                const applicant = await Player.findById(game.applicantId)
                const recruiter = await Player.findById(game.recruiterId)

                let index;

                index = recruiters.findIndex(player => player.email === recruiter.email)


                if (index === -1) {
                    recruiters.push({
                        id: recruiter.id,
                        playerName: recruiter.playerName,
                        email: recruiter.email,
                        acceptedJobsNumber: 0,
                        applicantsNumber: 0,
                    })
                }
                index = applicants.findIndex(player => player.email === applicant.email)


                if (index === -1) {
                    applicants.push({
                        id: applicant.id,
                        playerName: applicant.playerName,
                        email: applicant.email,
                        appliedJobs: 0,
                    })
                }
            }


            // recruiter kpis
            for (let i = 0; i < recruiters.length; i++) {

                const recruiter = recruiters[i]

                const games = await Game.find({ recruiterId: recruiter.id })

                if (games.length > 0) {

                    let applicants = []

                    const arrayApplicantIds = games.map(game => game.applicantId)

                    arrayApplicantIds.map(applicantId => {
                        if (!applicants.includes(applicantId)) {
                            applicants.push(applicantId)
                        }
                        return applicants
                    })

                    recruiter.applicantsNumber = applicants.length;

                    for (let i = 0; i < games.length; i++) {

                        const game = games[i]

                        const missions = await Mission.find({ gameId: game.id })

                        const tenJobsMissions = missions.filter(mission => mission.type === process.env.MISSION_TYPE_10JOBS)

                        if (tenJobsMissions.length > 0) {
                            let totalAcceptedJobs = 0;
                            for (let i = 0; i < tenJobsMissions.length; i++) {

                                const mission = tenJobsMissions[i]
                                const jobs = await Job.find({ mission10JobsId: mission.id })
                                const acceptedJobs = jobs.filter(job => job.isAccepted === true)
                                totalAcceptedJobs = totalAcceptedJobs + acceptedJobs.length
                            }
                            recruiter.acceptedJobsNumber = totalAcceptedJobs
                        }
                    }
                }

            }

            // applicant kpis
            for (let i = 0; i < applicants.length; i++) {

                const applicant = applicants[i];
                const games = await Game.find({ applicantId: applicant.id });
                for (let i = 0; i < games.length; i++) {
                    const game = games[i];
                    const jobs = await Job.find({ gameId: game.id })
                    applicant.appliedJobs = applicant.appliedJobs + jobs.filter(job => job.isApplied === true).length
                }
            }

            return { recruiters, applicants }
        },
        playerKpisBySearch: async (__, { input }) => {

            let recruiter = {
                id: '',
                playerName: '',
                email: '',
                acceptedJobsNumber: 0,
                applicantsNumber: 0,
            }

            let applicant = {
                id: '',
                playerName: '',
                email: '',
                appliedJobs: 0,
            }

            const { search } = input;

            const player = await Player.findOne({ $or: [{ email: search }, { playerName: search }] })

            if (player === null) {
                return null
            };

            // recruiter kpi
            const recruiterGames = await Game.find({ recruiterId: player.id })

            if (recruiterGames.length > 0) {
                recruiter.id = player.id;
                recruiter.playerName = player.playerName;
                recruiter.email = player.email;
            }

            let applicants = []

            const arrayApplicantIds = recruiterGames.map(game => game.applicantId)

            arrayApplicantIds.map(applicantId => {
                if (!applicants.includes(applicantId)) {
                    applicants.push(applicantId)
                }
                return applicants
            })

            recruiter.applicantsNumber = applicants.length;

            for (let i = 0; i < recruiterGames.length; i++) {

                const game = recruiterGames[i]

                const missions = await Mission.find({ gameId: game.id })

                const tenJobsMissions = missions.filter(mission => mission.type === process.env.MISSION_TYPE_10JOBS)

                if (tenJobsMissions.length > 0) {
                    let totalAcceptedJobs = 0;

                    for (let i = 0; i < tenJobsMissions.length; i++) {

                        const mission = tenJobsMissions[i]
                        const jobs = await Job.find({ mission10JobsId: mission.id })
                        const acceptedJobs = jobs.filter(job => job.isAccepted === true)
                        totalAcceptedJobs = totalAcceptedJobs + acceptedJobs.length
                    }
                    recruiter.acceptedJobsNumber = totalAcceptedJobs;

                }
            }

            // applicant kpi
            const applicantGames = await Game.find({ applicantId: player.id })

            if (applicantGames.length > 0) {
                applicant.id = player.id;
                applicant.playerName = player.playerName;
                applicant.email = player.email;
            }

            for (let i = 0; i < applicantGames.length; i++) {
                const game = applicantGames[i];
                const jobs = await Job.find({ gameId: game.id })
                const appliedJobsPerGame = jobs.filter(job => job.isApplied === true).length
                applicant.appliedJobs = applicant.appliedJobs + appliedJobsPerGame
            }

            return { recruiter, applicant }
        },
        notifications: async (__, { input }) => {
            const { gameId, recipientId, after, pageSize } = input;
            const allNotifications = await Notification.find({ gameId, recipientId });
            allNotifications.reverse()
            if (allNotifications.length > 0) {
                const notifications = paginateResults({
                    after,
                    pageSize,
                    results: allNotifications,
                    getCursor: (index) => index
                })

                return {
                    notifications,
                    cursor: notifications.length ? after ? after + pageSize : pageSize : 0,
                    hasMore: notifications.length
                        ? after + pageSize < allNotifications.length - 1
                        : false
                }
            } else {
                return {
                    notifications: [],
                    cursor: 0,
                    hasMore: false
                }
            }
        },

    },
    Subscription: {
        newNotification: {
            subscribe: withFilter(
                (parent, { input }, { pubsub }) => pubsub.asyncIterator(process.env.NOTIFICATION_SUBSCRIPTION_TOPIC_NEW),
                (payload, variables) => {
                    return payload.newNotification.recipientId === variables.input.clientId;
                },
            )
        },
        newJobs: {
            subscribe: withFilter(
                (parent, { input }, { pubsub }) => {
                    console.log('subscribe newJobs')

                    return pubsub.asyncIterator(process.env.JOB_SUBSCRIPTION_TOPIC_NEW)
                },
                async (payload, variables) => {
                    const { playerId, } = variables.input;
                    const { newJobs } = payload;
                    const game = await Game.findById(newJobs[0].gameId)
                    return game.applicantId === playerId
                }
            )
        },
        newMission: {
            subscribe: withFilter(
                (parent, { input }, { pubsub }) => {
                    console.log('subscribe newMission')

                    return pubsub.asyncIterator(process.env.MISSION_SUBSCRIPTION_TOPIC_NEW)
                },
                async (payload, variables) => {
                    const { gameId, playerId } = variables.input;
                    const { newMission } = payload;
                    const game = await Game.findById(gameId)
                    if (newMission.length === 1) {
                        const mission = newMission[0];
                        if (mission.type === process.env.MISSION_TYPE_10JOBS) {
                            return game.applicantId === playerId;
                        }

                        if (mission.type === process.env.MISSION_TYPE_JOBAPPLICATION) {
                            return game.recruiterId === playerId;
                        }
                    }
                    return game.applicantId === playerId;
                },
            )
        },
        updatedJob: {
            subscribe: withFilter(
                (parent, { input }, { pubsub }) => {
                    console.log('subscribe updatedJob')

                    return pubsub.asyncIterator(process.env.JOB_SUBSCRIPTION_TOPIC_UPDATED)
                },
                (payload, variables) => {
                    return payload.updatedJob.gameId === variables.input.gameId
                }
            )
        },
        updatedMission: {
            subscribe: withFilter(
                (parent, { input }, { pubsub }) => {
                    console.log('subscribe updatedMission')

                    return pubsub.asyncIterator(process.env.MISSION_SUBSCRIPTION_TOPIC_UPDATED)
                },
                (payload, variables) => {
                    return payload.updatedMission.gameId === variables.input.gameId
                }
            )
        },
        newGame: {
            subscribe: withFilter(
                (parent, { input }, { pubsub }) => {
                    console.log('subscribe newGame')
                    return pubsub.asyncIterator(process.env.GAME_SUBSCRIPTION_TOPIC_NEW)
                },
                (payload, variables) => {
                    console.log('newGame payload', payload)
                    return payload.newGame.applicantId === variables.input.playerId
                }
            )
        }
    },
    Mutation: {
        updateGame: async (__, { input }) => {
            const { id, field, data } = input;
            const game = await Game.findByIdAndUpdate(id, { [field]: data }, { new: true })
            return game
        },
        updateNotifications: async (__, { input }) => {
            const { ids, field, data } = input;
            const notifications = [];
            for (let i = 0; i < ids.length; i++) {
                const id = ids[i];
                const notification = await Notification.findByIdAndUpdate({ _id: id }, { [field]: data }, { new: true })
                notifications.push(notification)
            }
            return notifications
        },

        pushNotification: async (__, { input }, { pubsub }) => {

            const { label, gameId, recipientId } = input;

            const newNotification = await Notification.create({ label, gameId, recipientId })

            pubsub.publish(process.env.NOTIFICATION_SUBSCRIPTION_TOPIC_NEW, { newNotification });

            return newNotification
        },
        createMission: async (__, { input }, { pubsub }) => {
            const { quantity, gameId, type } = input;

            if (quantity !== 1) {

                const missions = new Array(quantity)

                for (let i = 0; i < quantity; i++) {
                    missions[i] = { type, gameId }
                }

                const newMissions = await Mission.insertMany(missions)
                pubsub.publish(process.env.MISSION_SUBSCRIPTION_TOPIC_NEW, { newMission: newMissions })
                return newMissions

            } else {

                const mission = await Mission.create({ type, gameId })


                pubsub.publish(process.env.MISSION_SUBSCRIPTION_TOPIC_NEW, { newMission: [mission] })

                return [mission]
            }

        },
        addMessage: async (__, { input }) => {
            const { email, message } = input;

            const newMessage = await Message.create({ email, message })

            // send message to inbox
            const feedbackNote = `New feedback from ${email}: ${message}`

            const adminEmail = process.env.EMAIL
            await sendEmail(adminEmail, 'contact form', feedbackNote)


            // send message receipt
            if (email.includes('@') && email.includes('.')) {

                const messageReceipt = 'Thank you for your message, we will try our best to get back to you'
                await sendEmail(email, 'Thank you for your message', messageReceipt)
            }
            return newMessage


        },
        sendMessage: async (__, { input }) => {
            const { message, recipientId, subject, link } = input
            const recipient = await Player.findById(recipientId).select('email')

            const isEmailSent = await sendEmail(recipient.email, subject, message, link)
                .then(result => {
                    return true
                })
                .catch(error => {
                    return false
                })

            return isEmailSent

        },
        updateMissionV2: async (__, { input }, { pubsub }) => {
            const { data, field, id } = input;


            if (data === 'completed') {
                const mission = await Mission.findById(id)

                // score for '10jobs' mission
                if (mission.type === process.env.MISSION_TYPE_10JOBS) {

                    const jobs = await Job.find({ mission10JobsId: mission.id })
                    mission.score = jobs.filter(job => job.isAccepted === true).length
                }

                // score for 'jobapplication' mission
                if (mission.type === process.env.MISSION_TYPE_JOBAPPLICATION) {
                    const job = await Job.findById(mission.selectedJob)
                    if (job === null) {
                        return null
                    } else {
                        mission.score = job.isApplied ? 1 : 0
                    }
                }

                mission.status = 'completed';

                mission.save()
                pubsub.publish(process.env.MISSION_SUBSCRIPTION_TOPIC_UPDATED, { updatedMission: mission })

                return mission
            }

            const mission = await Mission.findByIdAndUpdate({ _id: id }, { [field]: data }, { new: true })


            pubsub.publish(process.env.MISSION_SUBSCRIPTION_TOPIC_UPDATED, { updatedMission: mission })

            return mission

        },

        startJobApplication: async (__, { input }, { pubsub }) => {
            const { jobId, missionId, gameId, time } = input;

            const mission = await Mission.findByIdAndUpdate(missionId, { selectedJob: jobId, time, status: 'pending' }, { new: true })
            pubsub.publish(process.env.MISSION_SUBSCRIPTION_TOPIC_UPDATED, { updatedMission: mission })

            return mission
        },
        addGame: async (__, { input }, { pubsub }) => {
            const { title, recruiterId, email, name } = input;
            let player = await Player.findOne({ email })

            if (player === null) {
                player = await Player.create({ email, playerName: name })
            }
            const game = await Game.create({ title, recruiterId, applicantId: player.id })


            pubsub.publish(process.env.GAME_SUBSCRIPTION_TOPIC_NEW, { newGame: game })

            // push notif
            const newNotification = await Notification.create({ label: "You have a new 10 jobs challenge", gameId: game.id, recipientId: game.applicantId })

            pubsub.publish(process.env.NOTIFICATION_SUBSCRIPTION_TOPIC_NEW, { newNotification });

            return game
        },

        createJobs: async (__, { input }, { pubsub }) => {
            const { quantity, gameId, missionType, missionId } = input;

            if (quantity !== 1) {
                const jobs = new Array(quantity)

                for (let i = 0; i <= quantity - 1; i++) {
                    jobs[i] = { [missionType]: missionId, gameId }
                }
                const jobList = await Job.insertMany(jobs)

                pubsub.publish(process.env.JOB_SUBSCRIPTION_TOPIC_NEW, { newJobs: jobList })

                return jobList
            }

            else {
                const job = await Job.create({ gameId, [missionType]: missionId })
                pubsub.publish(process.env.JOB_SUBSCRIPTION_TOPIC_NEW, { newJobs: [jobList] })
                return [job]
            }

        },

        updateJob: async (__, { input }, { pubsub }) => {
            const { id, field, data } = input;
            if (field !== 'applicationProofUrl') {
                const updatedJob = await Job.findByIdAndUpdate({ _id: id }, { [field]: data }, { new: true })

                pubsub.publish(process.env.JOB_SUBSCRIPTION_TOPIC_UPDATED, { updatedJob })
                return updatedJob
            }

            // 
            return Job.findById(id)


        },
        updatePlayer: async (__, { input }) => {
            const { email, playerName, id } = input;
            const player = await Player.findByIdAndUpdate(id, { email, playerName }, { new: true })
            return { player }
        },
        createSignedPutUrl: async (__, { input }) => {
            const { fileName, mimeType, jobId } = input;

            // create uri (getUri method)
            const prettyFilename = slugify(fileName).replace(/[+]/gi, '-');

            const tmpFilename = `${new ObjectId()}_${prettyFilename}`;
            const uri = getUri(tmpFilename);

            const signedPutUrl = await getSignedPutUrl(uri, mimeType)
            const signedGetUrl = await getSignedUrl(uri)

            await Job.findByIdAndUpdate({ _id: jobId }, { applicationProofRef: uri.toString() }, { new: true })

            return { signedPutUrl, signedGetUrl }
        },


        // create topic for the applicant !!! ça ca veut dire qu'il peut faire que un topic
        // je peux enregister le topicARN dans la db
        // l'applicant et le jobseeker doivent etre abonné au topic mais avec un filtre pour que chacun recoivent
        // le message de l'autre mais pas ses propres messages envoyés pour son pote
        // vérifier que le topic n'existe pas avec listing Topic

        // const topic = await createTopic(player._id.toString())
        // console.log('topic', topic)


        // pending subscription !!
        // const subscription = await subscribe('topicArn de la db', 'applicant&recruiteremail', 'email')
        // console.log('subscription', subscription)
        sendNotification: async (__, { input }) => {
            const { gameId, message } = input;
            // const game = await Game.findById({ _id: gameId }, 'topicArn')
            // faudrait un param en plus pour savoir si c'est pour le recruiter ou l'applicant
            const publication = await publish(message, 'game.topicArn')

        },
    },
    Game: {
        recruiter: async (game) => {
            const { recruiterId } = game;
            const recruiter = await Player.findById(recruiterId)
            return recruiter
        },
        applicant: async (game) => {
            const { applicantId } = game;
            const applicant = await Player.findById(applicantId)
            return applicant
        },
        missionsAccomplished: async (game) => {
            const { id } = game
            const completedMissions = await Mission.find({ gameId: id, status: 'completed' })
            return completedMissions.length
        },
    },
    Mission: {

        isRecruiter: async (mission, __, context) => {
            const game = await Game.findById(mission.gameId)
            return game.recruiterId === context.playerId
        },
        selectedJob: async (mission) => {
            if (mission.selectedJob) {
                const job = await Job.findById(mission.selectedJob)
                return job
            } else {
                return null
            }
        },
    },
    Job: {

        applicationProofUrl: async (job) => {
            if (job.applicationProofRef) {
                const fileUri = S3Uri.parse(job.applicationProofRef);

                const url = getSignedUrl(fileUri)

                return url
            } else {
                return ''
            }
        },
    },
    StringOrIntOrBoolean: new GraphQLScalarType({
        name: "StringOrIntOrBoolean",
        description: "A String or an Int or a Boolean union type",
        serialize(value) {
            if (typeof value !== "string" && typeof value !== "number" && typeof value !== "boolean") {
                throw new Error("Value must be either a String or an Int or a Bool");
            }

            if (typeof value === "number" && !Number.isInteger(value)) {
                throw new Error("Number value must be an Int");
            }

            return value;
        },
        parseValue(value) {
            if (typeof value !== "string" && typeof value !== "number" && typeof value !== "boolean") {
                throw new Error("Value must be either a String or an Int or a Bool");
            }

            if (typeof value === "number" && !Number.isInteger(value)) {
                throw new Error("Number value must be an Int");
            }

            return value;
        },
        parseLiteral(ast) {

            // Kinds: http://facebook.github.io/graphql/June2018/#sec-Type-Kinds
            // ast.value is always a string
            switch (ast.kind) {
                case Kind.INT: return parseInt(ast.value, 10);
                case Kind.STRING: return ast.value;
                case Kind.BOOLEAN: return ast.value
                default:
                    throw new Error("Value must be either a String or an Int or a Bool");
            }
        }
    }),
    Date: new GraphQLScalarType({
        name: 'Date',
        description: 'Date custom scalar type',
        parseValue(value) {
            return new Date(value); // value from the client
        },
        serialize(value) {
            return value.getTime(); // value sent to the client
        },
        parseLiteral(ast) {
            if (ast.kind === Kind.INT) {
                return new Date(+ast.value) // ast value is always in string format
            }
            return null;
        },
    }),
}

module.exports = resolvers