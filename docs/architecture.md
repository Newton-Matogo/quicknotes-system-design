# QuickNotes System Architecture

## 1. Functional Requirements

- Users can register and log in securely.
- Users can create, read, update, and delete their notes.
- Users can organize notes using tags.
- Users can view their most recent notes.
- The API returns clear success and error responses.

## 2. Non-Functional Requirements

- **Scalability:** The system should support growth to one million registered users.
- **Availability:** The service should continue operating if an application server fails.
- **Performance:** Frequently accessed notes should load quickly.
- **Security:** Users should only access their own notes, and passwords must be stored as secure hashes.
- **Reliability:** Database backups and replication should reduce the risk of data loss.
- **Maintainability:** The application should be divided into components that are easy to update.

## 3. Capacity Estimation for One Million Users

These are planning assumptions, not measured production traffic.

Assume:

- 1,000,000 registered users.
- 10% of users are active daily, giving 100,000 daily active users.
- Each active user makes 20 read requests and 2 write requests per day.
- Requests are spread across 10 hours per day.
- Each user stores 100 notes on average.
- Each note uses approximately 2 KB of stored text and metadata.
- Average stored note data grows by 10% per year.

### Request estimates

Daily read requests:

100,000 × 20 = 2,000,000 reads/day

Daily write requests:

100,000 × 2 = 200,000 writes/day

Assuming requests are spread evenly across 10 hours (36,000 seconds):

- **Average reads/second:** 2,000,000 ÷ 36,000 ≈ 56
- **Average writes/second:** 200,000 ÷ 36,000 ≈ 6

Real traffic will have peaks, so the system should support substantially more than these averages.

### Storage estimate

1,000,000 users × 100 notes/user = 100,000,000 notes

100,000,000 notes × 2 KB ≈ 200 GB of initial note data.

At 10% annual growth, the additional data in the first year is approximately 20 GB, for a total of about 220 GB after one year.

This estimate excludes indexes, replicas, backups, tags, and other database overhead.

## 4. High-Level Architecture

```text
                       Users / Browsers
                              |
                              v
                         DNS Service
                              |
                              v
                         CDN / HTTPS
                              |
                              v
                       Load Balancer
                        /           \
                       v             v
                Application 1   Application 2
                       \             /
                        \           /
                         v         v
                           Cache
                              |
                              v
                       Primary Database
                              |
                       Read Replication
                              |
                              v
                        Read Replica

Application Servers
        |
        v
     Job Queue ------> Background Worker
                           |
                           v
                    Database / Cache
```

The diagram is a conceptual design. The cache, database, and worker can be connected through appropriate application and infrastructure interfaces.

## 5. Components and the Problems They Solve

- **Client / Browser:** Provides the interface users use to create, view, and delete notes.
- **DNS:** Translates the service's domain name into the correct network destination.
- **CDN:** Delivers static files such as CSS and JavaScript closer to users, reducing latency and origin-server load.
- **Load Balancer:** Distributes incoming requests across application servers and avoids sending all traffic to one server.
- **Application Servers:** Run API logic, validate requests, enforce authentication and authorization, and communicate with storage systems.
- **Cache:** Stores frequently requested data temporarily to reduce repeated database reads and improve response times.
- **Primary Database:** Stores authoritative user, note, and tag data and accepts writes.
- **Read Replica:** Serves eligible read queries to reduce load on the primary database; replication lag may mean it is briefly behind.
- **Job Queue:** Holds work that can be processed asynchronously rather than delaying the user's request.
- **Background Worker:** Processes queued tasks such as notifications, exports, or other longer-running jobs.

## 6. Request Flows

### GET /notes

1. The client sends `GET /notes` over HTTPS.
2. DNS resolves the API domain, and the load balancer routes the request to a healthy application server.
3. The application server validates the user's authentication and permissions.
4. The server checks the cache for the requested notes, if caching is appropriate.
5. If the data is not cached, the application queries the database, using a read replica where consistency requirements allow.
6. The server returns the notes as JSON with an appropriate success status, such as `200 OK`.
7. The cache may be updated with the result, subject to the application's caching rules.

### POST /notes

1. The client sends `POST /notes` with a JSON body containing the note title and body over HTTPS.
2. DNS and the load balancer route the request to a healthy application server.
3. The server authenticates the user, validates the request, and checks that the title is valid.
4. The application writes the new note to the primary database, associating it with the authenticated user.
5. The server invalidates or updates any affected cached note lists.
6. The server returns `201 Created` with the created note in JSON.
7. If additional work is required, the application can enqueue it for a background worker.

## 7. Trade-Offs

### SQL vs. NoSQL

A relational database such as PostgreSQL is a good starting choice because users, notes, and tags have clear relationships, and foreign keys and transactions help maintain data integrity. A NoSQL database may be useful for particular high-volume or flexible data workloads, but it can require additional work to enforce relationships.

### Cache speed vs. consistency

Caching improves read performance and reduces database load, but cached notes can become stale. Cache invalidation after creating or deleting a note helps reduce this risk. Data that requires strong consistency should be read from the primary database when appropriate.

### Read replicas vs. consistency

Read replicas can improve read capacity, but replication is not always immediate. A newly created note might not appear on a replica right away. Reads that must immediately reflect a write should use the primary database or another consistency-aware strategy.

### Asynchronous jobs vs. simplicity

A queue and worker keep slow background work out of the user's request path, but they introduce additional infrastructure, retries, monitoring, and possible duplicate processing. Jobs should be designed to handle retries safely.

## 8. High Availability and Avoiding Single Points of Failure

- Run at least two application servers behind a load balancer.
- Use health checks so unhealthy application servers stop receiving traffic.
- Deploy the application servers across separate failure zones where possible.
- Configure database backups and a tested recovery procedure.
- Use database replication and a documented failover process.
- Deploy redundant queue and cache infrastructure where supported.
- Monitor errors, latency, database capacity, queue depth, and server health.
- Keep application servers stateless where possible so requests can be served by any healthy instance.

The primary database remains a potential single point of failure unless a suitable failover setup is configured. A read replica alone does not guarantee automatic failover. The production design should include tested recovery procedures and appropriate database availability features.

## 9. Security Considerations

- Use HTTPS for all client-to-API communication.
- Authenticate users and authorize every note operation against the note's owner.
- Store password hashes, never plaintext passwords.
- Validate request bodies and enforce title length limits on the server.
- Use parameterized SQL queries to prevent SQL injection.
- Keep credentials and secrets out of source control.
- Apply rate limiting and log important errors without exposing passwords or private note contents.
