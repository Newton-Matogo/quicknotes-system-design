# QuickNotes REST API Design

## 1. Overview

QuickNotes is an online note-taking service that allows registered
users to create, view, update, delete, and organize their notes
with tags.

The production API will use REST principles and JSON for request
and response bodies. All endpoints use HTTPS. Protected endpoints
require authentication.

**Base URL:** `https://api.quicknotes.example.com/v1`

The example domain is a placeholder for the future production
deployment.

## 2. Resource Model

The main resources are:

- Users: accounts belonging to QuickNotes customers.
- Notes: text entries owned by users.
- Tags: labels used to categorize notes.
- Note-tag relationships: connections between notes and tags.

A user can only access or modify notes they are authorized to use.

## 3. Endpoint Reference

| Method | Path                           | Description                         | Success status |
| ------ | ------------------------------ | ----------------------------------- | -------------- |
| POST   | `/auth/register`               | Register a new user                 | 201 Created    |
| POST   | `/auth/login`                  | Authenticate a user                 | 200 OK         |
| GET    | `/notes`                       | List the authenticated user's notes | 200 OK         |
| POST   | `/notes`                       | Create a note                       | 201 Created    |
| GET    | `/notes/{noteId}`              | Retrieve one note                   | 200 OK         |
| PATCH  | `/notes/{noteId}`              | Update part of a note               | 200 OK         |
| DELETE | `/notes/{noteId}`              | Delete a note                       | 204 No Content |
| GET    | `/tags`                        | List the user's tags                | 200 OK         |
| POST   | `/notes/{noteId}/tags`         | Assign a tag to a note              | 201 Created    |
| DELETE | `/notes/{noteId}/tags/{tagId}` | Remove a tag from a note            | 204 No Content |

## 4. Authentication

Protected endpoints require a valid access token.

Example request header:

```http
Authorization: Bearer <access-token>
```

The server identifies the authenticated user from the token and
checks ownership before returning or changing a note.

## 5. Create a Note

**Request**

`POST /v1/notes`

```json
{
  "title": "My first note",
  "body": "Ideas for my next project",
  "tagIds": [2, 5]
}
```

The title is required and must contain between 1 and 100
characters after trimming whitespace. The body is optional.
Every supplied tag ID must belong to the authenticated user.

**Successful response**

Status: `201 Created`

```json
{
  "id": 101,
  "userId": 7,
  "title": "My first note",
  "body": "Ideas for my next project",
  "tags": [
    {
      "id": 2,
      "name": "Work"
    },
    {
      "id": 5,
      "name": "Ideas"
    }
  ],
  "createdAt": "2026-10-15T08:00:00Z",
  "updatedAt": "2026-10-15T08:00:00Z"
}
```

The IDs and timestamps above are illustrative examples.
The production server generates the note ID and timestamps.

## 6. List Notes

**Request**

`GET /v1/notes?limit=10&offset=0`

The API returns only notes accessible to the authenticated user.
Pagination prevents large collections from being returned at once.

**Successful response**

Status: `200 OK`

```json
{
  "data": [
    {
      "id": 101,
      "userId": 7,
      "title": "My first note",
      "body": "Ideas for my next project",
      "createdAt": "2026-10-15T08:00:00Z",
      "updatedAt": "2026-10-15T08:00:00Z"
    },
    {
      "id": 102,
      "userId": 7,
      "title": "Shopping list",
      "body": "Milk and bread",
      "createdAt": "2026-10-15T08:10:00Z",
      "updatedAt": "2026-10-15T08:10:00Z"
    }
  ],
  "pagination": {
    "limit": 10,
    "offset": 0,
    "total": 2
  }
}
```

An empty collection returns `200 OK` with an empty `data` array.

## 7. Update a Note

**Request**

`PATCH /v1/notes/101`

```json
{
  "title": "Updated project ideas"
}
```

**Successful response:** `200 OK`

The response contains the updated note representation, including
its updated timestamp. Only supplied fields are changed.

## 8. Delete a Note

**Request**

`DELETE /v1/notes/101`

**Successful response:** `204 No Content`

The server permanently removes the note and its note-tag
relationships according to the configured database rules.
The response has no body.

## 9. Error Handling

Errors use standard HTTP status codes and a consistent JSON body.

| Status | Meaning               | Example situation                                      |
| ------ | --------------------- | ------------------------------------------------------ |
| 400    | Bad Request           | Invalid title or malformed JSON                        |
| 401    | Unauthorized          | Missing or invalid access token                        |
| 403    | Forbidden             | The user lacks permission for the operation            |
| 404    | Not Found             | The requested note does not exist or is not accessible |
| 409    | Conflict              | Duplicate email during registration                    |
| 422    | Unprocessable Content | Valid JSON that fails business validation              |
| 429    | Too Many Requests     | Rate limit exceeded                                    |
| 500    | Internal Server Error | Unexpected server failure                              |
| 503    | Service Unavailable   | The service is temporarily unavailable                 |

**Example error response**

Status: `400 Bad Request`

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The title is required.",
    "details": [
      {
        "field": "title",
        "issue": "This field must not be empty."
      }
    ],
    "requestId": "req_example_123"
  }
}
```

Error responses must not expose passwords, access tokens,
database credentials, or internal stack traces.

## 10. API Design Decisions

- HTTPS protects data while it travels between the client and server.
- JSON provides a consistent request and response format.
- Pagination limits response sizes and reduces database work.
- Authentication and ownership checks protect private notes.
- Consistent errors help clients display useful messages.
- Rate limiting helps protect the service from excessive requests.
- `201 Created` indicates successful creation, while `204 No Content`
  indicates successful deletion without a response body.
