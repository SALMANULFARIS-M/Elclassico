const sessionSecret = process.env.SESSION_SECRET
let projEmail = process.env.PROJECT_EMAIL
let projPsw  =  process.env.PROJECT_PSW

module.exports = {
    projEmail,
    projPsw,
    sessionSecret
}

