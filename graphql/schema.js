const { gql } = require('apollo-server');

const typeDefs = gql`

    type Query {
        players: [Player]
        games(input: gamesInput): [Game]
        game(input: gameInput): Game
        player(input: playerInput): Player
        missions(input: missionsInput): [Mission]
        mission(input: missionInput): Mission
        account(input: accountInput): AccountPayload
        document(input: documentInput): String
        job(input: jobInput): Job
        getJobsByGameId(input: getJobsByGameIdInput): [Job]
        leaderboardResults: LeaderboardResultsPayload
        leaderboardRecruiters(input: leaderboardInput): RecruiterKpiPayload
        leaderboardApplicants(input: leaderboardInput): ApplicantKpiPayload
        playerKpisBySearch(input: playerKpisBySearchInput): playerKpisBySearchPayload
        notifications(input: notificationsInput): NotificationConnection
    }
    
    type Mutation {
        createMission(input: createMissionInput): [Mission]
        updateMissionV2(input: updateMissionV2Input): Mission
        updateJob(input: updateJobInput): Job
        sendMessage(input: sendMessageInput): Boolean
        addGame(input: addGameInput): Game
        uploadDocument: String
        createSignedPutUrl(input: createSignedPutUrlInput): CreateSignedPutUrlPayload
        sendNotification(input: sendNotificationInput):String
        updatePlayer(input: updatePlayerInput): UpdatePlayerPayload
        startJobApplication(input: startJobApplicationInput): Mission
        addMessage(input: addMessageInput): Message
        createJobs(input: createJobsInput): [Job]
        pushNotification(input: pushNotificationInput): Notification
        updateNotifications(input: updateNotificationsInput): [Notification]
        updateGame(input: updateGameInput): Game
    }
    type Subscription { 
        newNotification(input: newNotificationInput ): Notification 
        newMission(input: newMissionInput): [Mission]
        updatedMission(input: updatedMissionSubInput): Mission
        newGame(input: newGameSubInput): Game
        newJobs(input: newJobsSubInput): [Job]
        updatedJob(input: updatedJobSubInput): Job
    }

    type Player {
        id: ID!
        firstName: String
        lastName: String
        email: String
        playerName: String
    }

    type Game {
        id: ID!
        title: String
        recruiter: Player
        applicant: Player
        applicantId: String
        recruiterId: String
        missionsAccomplished: Int
        createdAt: Date
        people: [String]
    }

    type Message {
        id: ID!
        email: String
        message: String
    }


    type Mission {
        id: ID!
        status: String
        isLocked: Boolean
        type: String
        gameId: ID!
        isUnderReview: Boolean
        isEvaluated: Boolean
        progress: Int
        isRecruiter: Boolean
        score: Int
        selectedJob: Job
        time: String
    }

    type Job {
        id: ID!
        url: String
        missionId: String
        isAccepted: Boolean
        rank: Int
        name: String
        applicationProofUrl: String
        isComplete: Boolean
        gameId: String
        isApplied: Boolean
        isSelected: Boolean
        missionJobApplicationId: String
        mission10JobsId: String
    }

    type Notification {
        id: ID!
        gameId: String
        label: String
        isRead: Boolean
        createdAt: Date
        recipientId: String
    }

    type CreateSignedPutUrlPayload {
        signedPutUrl: String
        signedGetUrl: String
    }

    type LeaderboardResultsPayload {
        recruiters: [RecruiterKpi]
        applicants: [ApplicantKpi]
    }

    type playerKpisBySearchPayload{
        recruiter: RecruiterKpi
        applicant: ApplicantKpi
    }

    type RecruiterKpi {
        id: ID!
        email: String,
        playerName: String,
        acceptedJobsNumber: Int,
        applicantsNumber: Int,
    }

    type ApplicantKpi {
        id: ID!
        email: String,
        playerName: String,
        appliedJobs: Int,
    }

    type RecruiterKpiPayload {
        cursor: Int
        hasMore: Boolean
        leaderboardRecruiters: [RecruiterKpi]
    }

    type ApplicantKpiPayload {
        cursor: Int
        hasMore: Boolean
        leaderboardApplicants: [ApplicantKpi]
    }

    type NotificationConnection {
        cursor: Int
        hasMore: Boolean
        notifications: [Notification]
    }


    type AccountPayload {
        id: ID!
        player: Player
        games: [Game]
    }

    scalar StringOrIntOrBoolean 

    scalar Date

    input sendNotificationInput {
        gameId: String
        message: String
    }

    input documentInput{
        jobId: String
    }

    input accountInput{
        email: String
    }


    input addGameInput {
        title: String
        recruiterId: String
        email: String
        name: String
    }

    input loginInput {
        email: String
    }
    input gamesInput{
        email: String
    }

    input playerInput{
        email: String
    }

    input missionsInput{
        gameId: String
    }

    input updateJobInput {
        id: String
        field: String
        data: StringOrIntOrBoolean
    }

    input InputJob {
        id: String
        url: String
        name: String
        missionId: String
        rank: Int
        applicationProofUrl: String
    }
    input createSignedPutUrlInput {
        fileName: String
        mimeType: String
        jobId: String
    }

    input missionInput{
        missionId: String
    }

    input updateMissionInput{
        id: String
    }

    input updatePlayerInput{
        email: String
        playerName: String
        id: String
    }
    type UpdatePlayerPayload {
        player: Player
    }

    input addApplicantInput{
        gameId:String
        email: String
    }

    input gameInput{
        gameId: String
    }

    input startJobApplicationInput {
        missionId: String
        jobId: String
        time: String
        gameId: String
    }

    input jobInput {
        jobId: String
    }

    input addMessageInput {
        email: String
        message: String
    }

    input updateMissionV2Input {
        id: String
        data: StringOrIntOrBoolean
        field: String
    }

    input sendMessageInput {
        message: String
        recipientId: String
        subject: String
        link: String
    }

    input getJobsByGameIdInput {
        gameId: String
    }

    input createMissionInput {
        gameId: String
        type: String
        quantity: Int
    }

    input createJobsInput{
        quantity: Int,
        missionType: String,
        gameId: String,
        missionId: String,
    }

    input playerKpisBySearchInput{
        search: String
    }

    input leaderboardInput{
        pageSize: Int
        after: Int
        rankFilter: String
    }
    input pushNotificationInput{
        label: String
        gameId: String
        recipientId: String
    }

    input notificationsInput{
        gameId: String
        recipientId: String
        pageSize: Int
        after: Int
    }

    input updateNotificationsInput{
        ids: [String]
        field: String
        data: StringOrIntOrBoolean
    }

    input newNotificationInput{
        clientId: String
    }

    input newMissionInput{
        gameId: String
        playerId: String
    }
    input updatedMissionSubInput{
        gameId: String 
    }

    input updateGameInput{
        id: String
        field: String
        data: StringOrIntOrBoolean
    }

    input newGameSubInput{
        playerId: String
    }

    input newJobsSubInput{
        playerId: String
    }

    input updatedJobSubInput{
        gameId: String
    }
`


module.exports = typeDefs

