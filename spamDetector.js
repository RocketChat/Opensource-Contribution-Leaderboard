const DEFAULT_CONFIG = {
    RATE_LIMIT_MINUTES:10,
    MAX_PRS_IN_WINDOW: 5,
    MIN_CHANGES: 3,
    MIN_DESCRIPTION_LENGTH: 15,
    DUPLICATE_TITLE_THRESHOLD: 2,
    SPAM_SCORE_THRESHOLD: 4
};


function getMinutesDiff(date1, date2){
    return Math.abs(new Date(date1) - new Date(date2)) / (1000 * 60);

}

function isSpamPR(pr, userPrs = [], config={}){
    const cfg = {...DEFAULT_CONFIG, ...config};
    let spamScore =0;

    if (!pr) return true; // invalid PR = spam

    const {
        created_at,
        merged_at,
        additions = 0,
        deletions = 0,
        title = "",
        body = ""
    } = pr;

    // Rate limit check
    const recentPRs = userPrs.filter(p => {
        if(!p.created_at) return false;
        return getMinutesDiff(created_at, p.created_at) <= cfg.RATE_LIMIT_MINUTES;
    });

    if(recentPRs.length > cfg.MAX_PRS_IN_WINDOW){
        spamScore += 2;
    }

    // Not merged
    if(!merged_at){
        spamScore  += 1;   
    }    
    // Low code changes
    if((additions + deletions) < cfg.MIN_CHANGES){
        spamScore += 2;
    }
    // Duplicate title
    const duplicateCount = userPrs.filter(p => p.title === title).length;
    if(duplicateCount >= cfg.DUPLICATE_TITLE_THRESHOLD){
        spamScore += 2;
    }
    // weak or empty description
    if(!body || body.trim().length < cfg.MIN_DESCRIPTION_LENGTH){
        spamScore += 1;
    }
    return spamScore >= cfg.SPAM_SCORE_THRESHOLD;

    
}

module.exports = {
    isSpamPR
};