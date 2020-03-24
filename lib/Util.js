export function getContributorLinks(organization, contributor) {
    const home = `${this.BaseUrl}/${contributor}`;
    const openPRsLink = `${this.BaseUrl}/pulls?q=is:pr+org:${organization}+author:${contributor}+is:open`;
    const mergedPRsLink = `${this.BaseUrl}/pulls?q=is:pr+org:${organization}+author:${contributor}+is:merged`;
    const issuesLink = `${this.BaseUrl}/issues?q=is:issue+org:${organization}+author:${contributor}`;

    return [home, openPRsLink, mergedPRsLink, issuesLink];
}