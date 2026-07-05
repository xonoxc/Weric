# API Documentation

The Weric API is an HTTP interface built with Hono and Effect. It serves as the communication layer between the frontend applications and the domain packages.

## Base URL

```
Development: http://localhost:3000
Production:  https://api.weric.app
```

## Authentication

All authenticated endpoints require a Bearer token in the `Authorization` header.

```
Authorization: Bearer <token>
```

Tokens are obtained through the authentication endpoints.

## Endpoints

### Stories

#### `GET /stories`

List stories with pagination.

**Query Parameters**

| Parameter | Type     | Default      | Description                      |
| --------- | -------- | ------------ | -------------------------------- |
| `page`    | `number` | `1`          | Page number                      |
| `limit`   | `number` | `20`         | Items per page (max 100)         |
| `status`  | `string` | `published`  | Filter by status                 |
| `sort`    | `string` | `-createdAt` | Sort field with direction prefix |

**Response**

```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Story Title",
      "slug": "story-title",
      "summary": "Brief summary",
      "confidence": 0.85,
      "status": "published",
      "evidenceCount": 5,
      "createdAt": "2026-01-01T00:00:00Z",
      "updatedAt": "2026-01-01T00:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

#### `GET /stories/:slug`

Get a story by slug with full evidence details.

**Response**

```json
{
  "id": "uuid",
  "title": "Story Title",
  "slug": "story-title",
  "summary": "Extended summary",
  "confidence": 0.85,
  "status": "published",
  "evidence": [
    {
      "id": "uuid",
      "source": "rss",
      "url": "https://example.com/article",
      "author": "Author Name",
      "title": "Article Title",
      "publishedAt": "2026-01-01T00:00:00Z"
    }
  ],
  "entities": [
    {
      "id": "uuid",
      "name": "Entity Name",
      "type": "person"
    }
  ],
  "createdAt": "2026-01-01T00:00:00Z",
  "updatedAt": "2026-01-01T00:00:00Z"
}
```

#### `POST /stories`

Manually submit evidence for story ingestion.

**Request Body**

```json
{
  "url": "https://example.com/article",
  "source": "manual",
  "title": "Article Title",
  "content": "Full article content..."
}
```

### Feed

#### `GET /feed`

Get personalized feed for the authenticated user.

**Query Parameters**

| Parameter | Type     | Default | Description             |
| --------- | -------- | ------- | ----------------------- |
| `page`    | `number` | `1`     | Page number             |
| `limit`   | `number` | `20`    | Items per page (max 50) |

**Response**

```json
{
  "data": [
    {
      "story": { ... },
      "score": 0.92,
      "reason": "Matches your interest in AI"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 50
  }
}
```

### Search

#### `GET /search`

Search stories and evidence.

**Query Parameters**

| Parameter | Type     | Default  | Description                     |
| --------- | -------- | -------- | ------------------------------- |
| `q`       | `string` | required | Search query                    |
| `type`    | `string` | `all`    | `stories`, `evidence`, or `all` |
| `page`    | `number` | `1`      | Page number                     |
| `limit`   | `number` | `20`     | Items per page                  |

### Interactions

#### `POST /interactions`

Record a user interaction with a story.

**Request Body**

```json
{
  "storyId": "uuid",
  "interactionType": "read",
  "duration": 120
}
```

### Bookmarks

#### `GET /bookmarks`

List user bookmarks.

#### `POST /bookmarks`

Bookmark a story.

**Request Body**

```json
{
  "storyId": "uuid"
}
```

#### `DELETE /bookmarks/:storyId`

Remove a bookmark.

### Interests

#### `GET /interests`

Get the authenticated user's learned interests.

### Authentication

#### `POST /auth/register`

Create a new account.

**Request Body**

```json
{
  "email": "user@example.com",
  "username": "username",
  "password": "secure-password"
}
```

#### `POST /auth/login`

Authenticate and receive a token.

**Request Body**

```json
{
  "email": "user@example.com",
  "password": "secure-password"
}
```

**Response**

```json
{
  "token": "jwt-token",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "username"
  }
}
```

### Health

#### `GET /health`

Health check endpoint.

**Response**

```json
{
  "status": "ok",
  "version": "0.1.0",
  "timestamp": "2026-01-01T00:00:00Z"
}
```

## Error Responses

All errors follow a consistent format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable message",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  }
}
```

### Common Error Codes

| Code               | HTTP Status | Description                       |
| ------------------ | ----------- | --------------------------------- |
| `VALIDATION_ERROR` | 400         | Input validation failed           |
| `UNAUTHORIZED`     | 401         | Missing or invalid authentication |
| `FORBIDDEN`        | 403         | Insufficient permissions          |
| `NOT_FOUND`        | 404         | Resource not found                |
| `CONFLICT`         | 409         | Resource already exists           |
| `RATE_LIMITED`     | 429         | Too many requests                 |
| `INTERNAL_ERROR`   | 500         | Unexpected server error           |

## Rate Limiting

Rate limits are applied per authenticated user:

| Endpoint       | Limit                   |
| -------------- | ----------------------- |
| All endpoints  | 100 requests per minute |
| Search         | 30 requests per minute  |
| Authentication | 10 requests per minute  |

Rate limit headers are included in all responses:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1704067200
```
