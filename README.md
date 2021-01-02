
<p align="center"><img src="./docs/images/logo.png"></p>

![](./docs/images/demo.png)

## Introduction

An open source contributors leaderboard for your developers community, Github organization, or Google Summer of Code (GSoC) organization. Contributors can track their position on the leaderboard based on the PRs, commits, and issues they've completed across the repositories of interest across your Github organization . Proudly created and maintained by the GSoC 2019-2021 students and the wider [Rocket.Chat community](https://github.com/RocketChat).

## Benefits
- Encourage contributors to improve their position - by increasing contribution to your organization
- Easy to setup and administer
- Realtime organization - wide visibility to top contributors.

## Main Features
- Track commits/PRs/issues for contributors and GSoC student candidates in real time
- At a glance view of participating top students
- Easy administration to add students (even before they have made their very first contribution)
- Requires no database or other environments - Only what you need to do is to ensure that your Node.js works well
- Real-time updation of results - Contributions get updated real-time after server start without the need to refresh.

## Quick Start
Clone the repository to your local machine and switch into the project root directory:
````bash
git clone git@github.com:RocketChat/GSoC-Contribution-Leaderboard-Node.git
cd GSoC-Contribution-Leaderboard-Node
````
Copy `config-example.json` to `config.json` in the **src/server** directory. Add your Github Auth Token and Organization name and other keys in it as following:
````bash
{
  "organization": "OrgName",
  "organizationHomepage": "https://<OrgName>/",
  "organizationGithubUrl": "https://github.com/<OrgName>",
  "authToken": "",
  "adminPassword": "123456",
  "delay": "10",
  "serverPort": "62050",
  "contributors": []
}
````
Then switch to the project root directory, install the dependencies:
````bash
cd ../../
npm run add
````

And then you can read [Development](#development) part or [Production](#production) part for the next step.
## Development
Switch your path to the project base directory:
````bash
npm start
````
You will see the GSOC Contribution Leaderboard in the [http://localhost:8080](http://localhost:8080) if all works well. Then open a new terminal window (or tab) and enter the following commands to start your backend service:
````bash
npm run serve
````
**Note:** If the backend service is not started, the contributions data will not be refreshed.

### Develop Administration Panel
You need to start another instance if you'd like to develop administration panel, open a new terminal window (or tab) and try following commands:
````bash
cd admin
npm start
````

## Production
Generate the static files first by running the following command:
````bash
npm run build
cd dist/server
npm install pm2 -g # run this command on your server if pm2 is not installed.
pm2 start app.js --name "GSOC-Contribution-Leaderboard" # start the backend service
````

## Acknowledgement
This project is inspired by [GSOC-Contribution-Leaderboard](https://github.com/shubhsherl/GSoC-Contribution-Leaderboard/). Thanks to the Python team for the work.

## License
This project is open source under the Licence [MIT](./LICENSE).
