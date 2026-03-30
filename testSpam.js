const { isSpamPR } = require('./spamDetector')


//dummy PR data

const pr = {
    title: "test PR",
    created_at: new Date().toISOString(),
    merged_at: null,
    additions: 1,
    deletions: 0,
    body: "",
    user: { login: "nandini" }
}

const userPRs = [pr, pr, pr, pr, pr, pr];
const result = isSpamPR(pr, userPRs);

console.log("Is spam:", result)