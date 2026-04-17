## Local Development

Two terminals:

```bash
# Terminal 1 — frontend with hot reload
NODE_OPTIONS=--openssl-legacy-provider npm start

# Terminal 2 — backend server
npm run serve
```

Frontend at http://localhost:8080. Backend data won't refresh without terminal 2.

To work on the admin panel, add a third terminal:

```bash
cd admin && npm start
```
