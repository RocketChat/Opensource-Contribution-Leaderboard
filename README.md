
<p align="center"><img src="./docs/images/logo.png"></p>

![](./docs/images/demo.png)

## Introduction

This is Node.js implementation of the [GSOC-Contribution-Leaderboard](https://github.com/shubhsherl/GSoC-Contribution-Leaderboard/). The original project cannot count the students' contributions correctly because of its complex inter-mechanism. It's not a good idea that we try to record students' contributions ourselves, the smarter approach is to call the GitHub API directly. So I implement a much more simple and faster one with the same frontend but completely different server service.

### Simple
This new implementation of the [GSOC-Contribution-Leaderboard](https://github.com/shubhsherl/GSoC-Contribution-Leaderboard/) is really simple compared to the original one, whose server-side code is within 150 lines only. It works well with small memory usage.

### Stable
Owning to the new implementation calls the [GitHub API](https://developer.github.com/v3/) directly, so it can always fetch the correct contribution information of the students.

### Lightweight
It requires no database or other environments - Only what you need to do is ensuring that your Node.js works well.

## Quick Start
Clone the repository to your local machine and switch into the project root directory:
````bash
git clone git@github.com:lolimay/webpack-scaffold-lolimay.git
cd GSoC-Contribution-Leaderboard-Node
````
Create a file named `config.json` (or rename `config-example.json` to `config.json`) in the base directory. Add your Github Auth Token and Organization name and other keys in it as following:
````bash
{
    "organization": "",
    "organizationHomepage": "",
    "organizationGithubUrl": "",
    "authToken": "",
    "contributors": []
}
````
And then read the [Development](#development) part or [Production](#production) part for the next step.
## Development
````bash
npm install
npm start
````
Then open a new terminal window (or tab) and enter the following command to start the backend service:
````bash
cd src/server
node app.js
````

## Production
````bash
npm run build
````
Then copy the all files under the `dist` folder into your server domain directory.

To make backend service run well, please use [pm2](http://pm2.keymetrics.io/) as your Node.js process manager.
````bash
npm install pm2 -g # run this command on your server if pm2 is not installed.
cd <your-domain-directory>/server # switch to the server directory.
pm2 start app.js --name "GSOC-Contribution-Leaderboard" # start the backend service
````

## Acknowledgement
Thanks a lot for the project [GSOC-Contribution-Leaderboard](https://github.com/shubhsherl/GSoC-Contribution-Leaderboard/) which gives me much inspiration to work on it.

## License
This project is open source under the Licence [MIT](./LICENSE).