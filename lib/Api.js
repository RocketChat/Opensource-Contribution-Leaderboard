import axios from 'axios';

class Api {
    BaseUrl = 'https://github.com';
    ApiHost = 'https://api.github.com';
    token = '';

    constructor(token) {
        this.token = token;
    }

    async get(url) {
        try {
            return axios.get(url, {
                headers: {
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'GSoC-Contribution-Leaderboard',
                    'Authorization': `token ${this.token}`
                }
            });
        } catch (err) {
            if (err.code === 'ECONNABORTED') {
                return console.log('[WARNING] Time Out.');
            }

            if (err.response) {
                const { message } = err.response.data;

                return console.warn(message);
            }
        }
    }

    async getContributorAvatar(contributor) {
        const res = await get(`${this.ApiHost}/users/${contributor}`);

        return res ? res.data.avatar_url : '';
    }


    async getOpenPRs(organization, contributor) {
        const OpenPRsURL = `/search/issues?q=is:pr+org:${organization}+author:${contributor}+is:Open`;
        const res = await get(this.ApiHost + OpenPRsURL)

        return res ? res.data.items : null;
    }

    async getMergedPRs(organization, contributor) {
        const MergedPRsURL = `/search/issues?q=is:pr+org:${organization}+author:${contributor}+is:Merged`
        const res = await get(APIHOST + MergedPRsURL)

        return res ? res.data.items : null;
    }

    async getIssues(organization, contributor) {
        const IssuesURL = `/search/issues?q=is:issue+org:${organization}+author:${contributor}`
        const res = await get(APIHOST + IssuesURL)

        return res ? res.data.items : null;
    }
}