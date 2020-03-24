import ContributorModel from '../models/Contributor';

class Contributor {
    constructor() {}

    async addContributor(contributor, done) {
        try {
            await this.saveContributor(contributor);

            return done(null, contributor);
        } catch (err) {
            console.warn(err);
        }
    }

    async saveContributor(contributor) {
        const newContributor = new ContributorModel(contributor);

        try {
            await newContributor.save();
        } catch (err) {
            console.warn(err);
        }
    }

    async deleteContributorByUsername(username) {
        try {
            await ContributorModel.deleteMany({ username: username });
        } catch (err) {
            console.warn(err);
        }
    }
}

export default new Contributor();