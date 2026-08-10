# OAuth Server

This is an OAuth server implementation.

## Environment Variables

The following environment variables are required to run the server:

- `PORT`: The port the server runs on (default: 4000).
- `DATABASE_URL`: The connection string for the database (e.g., `postgres://user:password@localhost:5432/dbname`).
- `USERS_FILE_PATH`: The path to the JSON file containing test users.
- `ISSUER`: The URL of this OAuth server.
- `SESSION_SECRET`: A long, secure string used to sign session cookies.
- `CLIENT_SECRET`: A secret used for client authentication.
- `CLIENT_ID`: The ID of the authorized client.
- `JWT_AUDIENCE`: The audience for the JWT tokens.

## Database Setup
Run the following SQL to initialize the database:
```sql
psql -d <DATABASE_URL> -f schema.sql
```
