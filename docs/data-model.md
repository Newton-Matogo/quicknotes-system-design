# QuickNotes Data Model

## 1. Overview

QuickNotes uses a relational SQL database to store user accounts,
notes, tags, and the relationships between notes and tags.

The four main entities are:

- Users
- Notes
- Tags
- Note_Tags

Primary keys uniquely identify records. Foreign keys maintain
referential integrity between related records.

## 2. Entities and Columns

### Users

| Column        | Type         | Key / Constraint | Description           |
| ------------- | ------------ | ---------------- | --------------------- |
| id            | BIGINT       | Primary key      | Unique user ID        |
| username      | VARCHAR(50)  | NOT NULL         | Public username       |
| email         | VARCHAR(255) | UNIQUE, NOT NULL | Login email           |
| password_hash | VARCHAR(255) | NOT NULL         | Secure password hash  |
| created_at    | TIMESTAMP    | NOT NULL         | Account creation time |

Passwords must be stored as secure password hashes, never as
plain text.

### Notes

| Column     | Type         | Key / Constraint      | Description                      |
| ---------- | ------------ | --------------------- | -------------------------------- |
| id         | BIGINT       | Primary key           | Unique note ID                   |
| user_id    | BIGINT       | Foreign key, NOT NULL | Owner of the note                |
| title      | VARCHAR(100) | NOT NULL              | Note title                       |
| body       | TEXT         | NOT NULL              | Note body; empty text is allowed |
| created_at | TIMESTAMP    | NOT NULL              | Creation time                    |
| updated_at | TIMESTAMP    | NOT NULL              | Last update time                 |

A note belongs to one user.

### Tags

| Column     | Type        | Key / Constraint      | Description      |
| ---------- | ----------- | --------------------- | ---------------- |
| id         | BIGINT      | Primary key           | Unique tag ID    |
| user_id    | BIGINT      | Foreign key, NOT NULL | Owner of the tag |
| name       | VARCHAR(50) | NOT NULL              | Tag name         |
| created_at | TIMESTAMP   | NOT NULL              | Creation time    |

The same user cannot create duplicate tag names.

### Note_Tags

| Column     | Type      | Key / Constraint              | Description               |
| ---------- | --------- | ----------------------------- | ------------------------- |
| note_id    | BIGINT    | Primary key part; foreign key | Linked note               |
| tag_id     | BIGINT    | Primary key part; foreign key | Linked tag                |
| created_at | TIMESTAMP | NOT NULL                      | Time the tag was assigned |

The composite primary key `(note_id, tag_id)` prevents the same
tag from being assigned to the same note more than once.

## 3. Relationships

### One-to-many

One user can own many notes, but each note belongs to one user.
The `notes.user_id` foreign key implements this relationship.

One user can also own many tags. The `tags.user_id` foreign key
implements this relationship.

### Many-to-many

A note can have multiple tags, and a tag can be assigned to
multiple notes.

The `note_tags` junction table implements this many-to-many
relationship using the `note_id` and `tag_id` foreign keys.

## 4. CREATE TABLE Statements

The following SQL uses PostgreSQL-compatible syntax.

```sql
CREATE TABLE users (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notes (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL,
    body TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tags (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_tag_per_user UNIQUE (user_id, name)
);

CREATE TABLE note_tags (
    note_id BIGINT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    tag_id BIGINT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (note_id, tag_id)
);
```

## 5. Indexes

Primary keys and unique constraints create indexes in PostgreSQL.
Additional indexes support common application queries.

```sql
CREATE INDEX idx_notes_user_created
ON notes (user_id, created_at DESC);

CREATE INDEX idx_note_tags_tag
ON note_tags (tag_id);
```

### Why these indexes?

- `idx_notes_user_created` helps retrieve a user's notes in
  creation-date order without scanning every user's notes.
- `idx_note_tags_tag` helps find notes associated with a given tag.
  The composite primary key already supports searches by `note_id`
  and then `tag_id`, but not tag-first lookups efficiently.

## 6. Example SQL Queries

### Query 1: Retrieve a user's notes

```sql
SELECT id, title, body, created_at, updated_at
FROM notes
WHERE user_id = 7
ORDER BY created_at DESC
LIMIT 10;
```

This retrieves the latest ten notes belonging to user 7.

### Query 2: Create a note

```sql
INSERT INTO notes (user_id, title, body)
VALUES (7, 'Project ideas', 'Plan the next release')
RETURNING id, user_id, title, body, created_at, updated_at;
```

The database generates the ID and creation timestamp.

### Query 3: JOIN notes to their tags

```sql
SELECT
    n.id AS note_id,
    n.title,
    t.name AS tag_name
FROM notes AS n
JOIN note_tags AS nt ON nt.note_id = n.id
JOIN tags AS t ON t.id = nt.tag_id
WHERE n.user_id = 7
ORDER BY n.id, t.name;
```

This returns notes alongside their assigned tags.

### Query 4: Count notes for each user

```sql
SELECT
    u.id,
    u.username,
    COUNT(n.id) AS note_count
FROM users AS u
LEFT JOIN notes AS n ON n.user_id = u.id
GROUP BY u.id, u.username
ORDER BY note_count DESC;
```

The LEFT JOIN includes users who have not created any notes.

### Query 5: Assign a tag to a note

```sql
INSERT INTO note_tags (note_id, tag_id)
VALUES (101, 2)
ON CONFLICT (note_id, tag_id) DO NOTHING;
```

The composite key prevents duplicate note-tag assignments.

## 7. SQL vs NoSQL Decision

QuickNotes will use a relational SQL database, such as PostgreSQL.
The system has clear relationships between users, notes, and tags,
and requires reliable transactions and foreign-key constraints.

SQL supports joins, unique constraints, and ownership relationships
that help protect data consistency. Indexes can improve the
performance of common note-listing and tag-search queries.

A NoSQL database could offer flexible document structures, but that
flexibility is less important than relational integrity for this
application. PostgreSQL can also scale through read replicas,
caching, indexing, and appropriate query optimization.
