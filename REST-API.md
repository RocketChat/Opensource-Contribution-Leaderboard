## Automated Data Fetch REST-API

The following endpoints can be used to fetch leaderboard data.

`/stats`

Gets important statistics about the leaderboard. 

**Example Call**

```
curl --request GET 'http://localhost:8080/api/stats'
```

**Example Response**

```
{
   totalContributors: 128,
   totalOpenPRs: 58,
   totalMergedPRs: 87,
   totalIssues: 70,
}
```

---

`/rank`

Used to rank contributors by a parameter. Can be used to fetch the rank of a contributor based on a parameter (defaults to number of merged PRs). 

Provides ranked list of contributor usernames sorted by `mergedprs` if no parameters provided. 

**Query Parameters**

| Argument  | Example | Required | Description
| ------------- | ------------- | ------------- | -------------
| parameter  | openprs | Optional | Can take values `openprs`, `issues`, `mergedprs` to rank contributors by. Defaults to `mergedprs`. 
| username | RonLek | Optional | Username of any contributor within the leaderboard. Returns error response if username not found. Case-insensitive.

**Example Call 1**

```
curl --request GET 'http://localhost:8080/api/rank?username=RonLek'
```

**Example Response 1**
```
{"username":"RonLek","rank":3}
```

**Example Call 2**

```
curl --request GET 'http://localhost:8080/api/rank?username=RonLek&parameter=openprs'
```

**Example Response 2**
```
{"username":"RonLek","rank":4}
```

**Example Call 3**

```
curl --request GET 'http://localhost:8080/api/rank?parameter=issues'
```

**Example Response 3**

```
{"ranks":["Darshilp326","yash-rajpal","RonLek","aditya-mitra","rodriq","djcruz93","lolimay"]}
```

---

`/contributor`

Used to fetch contributor details. Can be used to fetch contributor details by contributor rank sorted by parameter (defaults to number of merged PRs).

Provides all contributor data if no parameters provided.

**Query Parameters**

| Argument  | Example | Required | Description
| ------------- | ------------- | ------------- | -------------
| parameter  | openprs | Optional | Can take values `openprs`, `issues`, `mergedprs` to rank contributors by. Defaults to `mergedprs`. 
| username | RonLek | Optional | Username of any contributor within the leaderboard. Returns error response if username not found. Case-sensitive.
| rank | 3 | Optional | Rank starting with 1.

**Example Call 1**

```
curl --request GET 'http://localhost:8080/api/contributor?username=RonLek'
```

**Example Response 1**

```
{
  "home":"https://github.com/RonLek",
  "avatarUrl":"https://avatars.githubusercontent.com/u/28918901?v=4",
  "openPRsNumber": ...,
  "openPRsLink": ...,
  "mergedPRsNumber": ...,
  "mergedPRsLink": ..,
  "issuesNumber": ...,
  "issuesLink": ...
}
```

**Example Call 2**
```
curl --request GET 'http://localhost:8080/api/contributor?rank=3'
```

**Example Response 2**
```
{
  "home":"https://github.com/RonLek",
  "avatarUrl":"https://avatars.githubusercontent.com/u/28918901?v=4",
  "openPRsNumber": ...,
  "openPRsLink": ...,
  "mergedPRsNumber": ...,
  "mergedPRsLink": ..,
  "issuesNumber": ...,
  "issuesLink": ...
}
```

**Example Call 3**

```
curl --request GET 'http://localhost:8080/api/contributor?rank=3&parameter=issues'
```

**Example Response 3**
```
{
  "home":"https://github.com/RonLek",
  "avatarUrl":"https://avatars.githubusercontent.com/u/28918901?v=4",
  "openPRsNumber": ...,
  "openPRsLink": ...,
  "mergedPRsNumber": ...,
  "mergedPRsLink": ..,
  "issuesNumber": ...,
  "issuesLink": ...
}
```