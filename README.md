
<p align="center"><img src="./docs/images/logo.png"></p>

![](./docs/images/demo.png)

## Introduction

This is Node.js implementation of the [GSOC-Contribution-Leaderboard](https://github.com/shubhsherl/GSoC-Contribution-Leaderboard/). The original project cannot count the students' contributions correctly because of its complex inter-mechanism. So I implement a much more stable and faster one with the same frontend but completely different server service.

### Stable
Owning to, the new one calls the [GitHub API](https://developer.github.com/v3/) directly, so it can always fetch the correct information of the students.

### Lightweight
This new implementation is really simple, whose server-side code is within 150 lines. It works well with no serious problems. And it didn't need to configre any database.

## Development
````bash
git clone git@github.com:lolimay/webpack-scaffold-lolimay.git
cd GSoC-Contribution-Leaderboard-Node
npm install
npm start
````


## Advantages
- No Database Needed
- Calling Github API directly