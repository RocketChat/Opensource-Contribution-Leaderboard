
<p align="center"><img src="./docs/images/logo.png"></p>

![](./docs/images/demo.png)

## Introduction

This is the Node.js implementation of the [GSOC-Contribution-Leaderboard](https://github.com/shubhsherl/GSoC-Contribution-Leaderboard/). It has the same frontend but a different server implementation compared to the original one. You can view [this site](https://gsoc.lolimay.cn) for the real-time preview.

It requires no database or other environments - Only what you need to do is ensuring that your Node.js works well.

Thanks a lot to the project [GSOC-Contribution-Leaderboard](https://github.com/shubhsherl/GSoC-Contribution-Leaderboard/) which gives me much inspiration to work on it!

## Quick Start
Clone the repository to your local machine and switch into the project root directory:
````bash
git clone git@github.com:lolimay/GSoC-Contribution-Leaderboard-Node.git
cd GSoC-Contribution-Leaderboard-Node
````
Create a file named `config.json` (or copy `config-example.json` to `config.json`) in the **src/server** directory. Add your Github Auth Token and Organization name and other keys in it as following:
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
You will see the GSOC Contribution Leaderboard in the [http://localhost:8080](http://localhost:8080) if all works well. Then open a new terminal window (or tab) and enter the following commands to start your backend service:
````bash
cd src/server
node app.js
````
**Note:** If the backend service is not started, the contributions data will not be refreshed. Please refresh the [http://localhost:8080](http://localhost:8080) after the contributors data was fetched.

## Production
Generate the static files first by running the following command:
````bash
npm run build
````
Then copy all the files under the `dist` folder into the domain directory on your server. And now you can see the GSOC Contribution Leaderboard by visiting your domain (eg. [https://gsoc.lolimay.cn](https://gsoc.lolimay.cn)). *BUT THIS IS NOT ENOUGH!*

To make backend service run well, please use [pm2](http://pm2.keymetrics.io/) as your Node.js process manager.
````bash
npm install pm2 -g # run this command on your server if pm2 is not installed.
cd <your-domain-directory>/server # switch to the server directory.
pm2 start app.js --name "GSOC-Contribution-Leaderboard" # start the backend service
````
Start your backend service by the above commands on the server so that the data can be always refreshed.

## Acknowledgement
Thanks a lot for the project [GSOC-Contribution-Leaderboard](https://github.com/shubhsherl/GSoC-Contribution-Leaderboard/) which gives me much inspiration to work on it.

## License
This project is open source under the Licence [MIT](./LICENSE).
