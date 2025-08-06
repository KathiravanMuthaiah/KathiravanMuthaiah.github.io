# Series: Reactive File Processing with MQTT: Spring Boot vs Quarkus - Part 5 Database store & Final Summary 

The **Database layer** and **Final Summary** in this project serves two key purposes:

1. **Store raw and transformed lines** in the `line_data` table.
2. **Write a summary record** to the `file_summary` table after processing completes.

Both **Spring Boot** and **Quarkus** implementations achieve the same outcome with different idioms:

- **Spring Boot** → JPA (via `LineDataRepository`) + `JdbcTemplate` for summary insert
- **Quarkus** → Panache JPA (via `LineDataRepository`) + `DataSource` (manual JDBC)

After implementing **Reader** and **Writer** services in both frameworks, we can summarize the **key differences, similarities, and lessons learned**.

------

## **5.1 Database Schema**

See [`PGschema.sql`](https://github.com/KathiravanMuthaiah/reactive-mqtt-file-pipeline/blob/main/supportScripts/PGschema.sql) for exact DDL.

```text
CREATE SCHEMA IF NOT EXISTS fileproc;

CREATE TABLE fileproc.line_data (
    id SERIAL PRIMARY KEY,
    original_line TEXT NOT NULL,
    transformed_line TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE fileproc.file_summary (
    id SERIAL PRIMARY KEY,
    file_name VARCHAR(255) NOT NULL,
    total_lines INT NOT NULL,
    processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

- **line_data** → Stores one row per processed line
- **file_summary** → Stores one row per processed file

------

## **5.2 Spring Boot Database Layer**

### **5.2.1 Line Data Persistence**

**Spring Boot Reader** uses JPA to persist each processed line:

```text
lineDataRepository.save(new LineData(rawLine, transformed));
```

- `LineData` is a JPA entity mapped to `fileproc.line_data`.
- Spring Boot uses **Spring Data JPA** to handle CRUD operations automatically.

------

### **5.2.2 Summary Writer**

**Spring Boot `SummaryJdbcWriter.java`**:

```text
@Component
public class SummaryJdbcWriter {

    private static final Logger log = LoggerFactory.getLogger(SummaryJdbcWriter.class);

    private final JdbcTemplate jdbcTemplate;

    public SummaryJdbcWriter(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public void writeSummary(String fileName, int lineCount) {
        String sql = "INSERT INTO fileproc.file_summary (file_name, total_lines) VALUES (?, ?)";
        try {
            jdbcTemplate.update(sql, fileName, lineCount);
            log.info("Inserted summary row for file: {}, lines: {}", fileName, lineCount);
        } catch (Exception e) {
            log.error("Failed to insert summary row for file: {}", fileName, e);
        }
    }
}
```

**Behavior:**

- Uses **JdbcTemplate** to perform the summary insert.
- Keeps line persistence (JPA) and summary (JDBC) **separate**.
- Exception handling ensures failures are logged without breaking the stream.

------

### **5.2.3 Spring Boot Configuration**

`application.yml` (Reader Service):

```text
spring:
  datasource:
    url: jdbc:postgresql://${POSTGRES_HOST:localhost}:${POSTGRES_PORT:5432}/${POSTGRES_DB:fileproc}
    username: ${POSTGRES_USER:postgres}
    password: ${POSTGRES_PASSWORD:postgres}
  jpa:
    hibernate:
      ddl-auto: update
    properties:
      hibernate.dialect: org.hibernate.dialect.PostgreSQLDialect
```

- **`ddl-auto: update`** → Ensures tables are auto-created/updated if needed.
- **`JdbcTemplate`** uses the same `DataSource` automatically.

------

## **5.3 Quarkus Database Layer**

### **5.3.1 Line Data Persistence**

**Quarkus Reader** uses **Panache Repository** for JPA persistence:

```text
lineDataRepository.persist(new LineData(rawLine, transformed));
```

- `LineData` is a JPA entity with `@Table(schema="fileproc")`.
- Panache simplifies operations with `persist()`, `findAll()`, `delete()`, etc.

------

### **5.3.2 Summary Writer**

**Quarkus `SummaryJdbcWriter.java`**:

```text
@ApplicationScoped
public class SummaryJdbcWriter {

    private static final Logger log = Logger.getLogger(SummaryJdbcWriter.class);

    @Inject
    DataSource dataSource;

    public void writeSummary(String fileName, int totalLines) {
        String sql = """
            INSERT INTO fileproc.file_summary (file_name, total_lines, processed_at)
            VALUES (?, ?, now())
        """;

        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setString(1, fileName);
            ps.setInt(2, totalLines);
            ps.executeUpdate();

            log.infof("Summary inserted: file=%s, lines=%d", fileName, totalLines);

        } catch (Exception e) {
            log.error("Failed to insert summary record", e);
        }
    }
}
```

**Behavior:**

- Uses **Agroal DataSource** (Quarkus built-in connection pool).
- Performs raw JDBC insert for summary records.
- Logging is handled via `org.jboss.logging.Logger`.

------

### **5.3.3 Quarkus Configuration**

`application.yml` (Reader Service):

```text
quarkus:
  datasource:
    db-kind: postgresql
    username: ${POSTGRES_USER:postgres}
    password: ${POSTGRES_PASSWORD:postgres}
    jdbc:
      url: jdbc:postgresql://${POSTGRES_HOST:localhost}:${POSTGRES_PORT:5432}/${POSTGRES_DB:fileproc}
    reactive: false

  hibernate-orm:
    database:
      generation: update
    dialect: org.hibernate.dialect.PostgreSQLDialect
    log:
      sql: true
```

- **`generation: update`** → Similar to Spring Boot `ddl-auto: update`
- **Agroal** handles connection pooling automatically.
- **`hibernate-orm.log.sql: true`** → SQL statements logged in console.

------

## **5.4 Spring vs Quarkus Database Comparison**

| Aspect                 | **Spring Boot**              | **Quarkus**                                 |
| ---------------------- | ---------------------------- | ------------------------------------------- |
| **ORM**                | Spring Data JPA              | Panache JPA                                 |
| **Summary Insert**     | `JdbcTemplate.update()`      | Manual JDBC with `DataSource`               |
| **Connection Pooling** | HikariCP (default)           | Agroal                                      |
| **Schema Handling**    | `ddl-auto: update`           | `hibernate-orm.database.generation: update` |
| **Entity Definition**  | `@Entity` + Spring Data Repo | `@Entity` + `PanacheRepository`             |
| **Logging**            | SLF4J / Logback              | JBoss Logger / Quarkus logging              |



------

## **5.5 Key Takeaways for Database**

- **Spring Boot**:
  - Uses **JdbcTemplate** for summary → concise and high-level.
  - Auto-configures HikariCP for pooling.
  - JPA and JDBC share the same DataSource.
- **Quarkus**:
  - Uses **Panache Repository** for line persistence → concise CRUD.
  - Manual JDBC for summary → closer to the metal.
  - Uses Agroal for lightweight, fast connection pooling.
- **Both Approaches**:
  - Separate **line persistence** (JPA) and **summary writing** (JDBC).
  - Keep transaction scope simple for high-throughput streaming.

## **5.6 Deployment with Docker**

The **Reactive MQTT File Pipeline** runs with the following components:

1. **Reader Service** (Spring Boot or Quarkus)
2. **Writer Service** (Spring Boot or Quarkus)
3. **PostgreSQL Database** (stores line and summary data)
4. **Mosquitto MQTT Broker** (event bus between Reader and Writer)

Docker and Docker Compose are used to **orchestrate services and infrastructure** for local development and testing.

## **5.7 Unified Deployment Flow**

1. **Start PostgreSQL and Mosquitto** externally or via their own Compose files.

2. **Build images** for the services:

   ```
   bashCopyEditdocker compose -f docker-compose.reader-springboot.yaml build
   docker compose -f docker-compose.writer-springboot.yaml build
   ```

3. **Start the services**:

   ```
   bashCopyEditdocker compose -f docker-compose.reader-springboot.yaml up -d
   docker compose -f docker-compose.writer-springboot.yaml up -d
   ```

4. **Verify**:

   - Reader container logs show file processing
   - Writer container logs show message reception and output file writing
   - DB tables `line_data` and `file_summary` get populated

## **5.7 Spring vs Quarkus Deployment Comparison**

| Aspect                    | **Spring Boot Services**     | **Quarkus Services**                      |
| ------------------------- | ---------------------------- | ----------------------------------------- |
| **Build Artifact**        | Fat JAR (`app.jar`)          | Fast JAR runner (`app-runner.jar`)        |
| **Default Ports**         | Reader: 8081, Writer: 8082   | Reader: 8083, Writer: 8084                |
| **Log Handling**          | Logback file & console       | Console + optional Quarkus log categories |
| **Output Volume**         | `docker-volume/output`       | `docker-volume/output`                    |
| **Startup Speed**         | Slower due to Spring context | Faster due to Quarkus lightweight runtime |
| **Network**               | `pipeline-net` bridge        | `pipeline-net` bridge                     |
| **Environment Variables** | `.env` → `@Value`            | `.env` → `@ConfigProperty`                |

### **5.8 Key Takeaways for Deployments**

- Both frameworks are **Docker-friendly** and work with a **modular Compose setup**.
- **Spring Boot** uses **fat JARs** and **Logback file logging**, while **Quarkus** prefers **fast JARs** with console logging.
- **Volumes and networks** are shared for smooth Reader/Writer and DB/MQTT communication.
- **`.env` file** standardizes configuration across services.



## **5.9 Learnings & Framework Comparison**

The **Reactive MQTT File Pipeline** project allowed a **side-by-side comparison** of **Spring Boot 3.2** and **Quarkus 3.8**, using **reactive file processing, MQTT messaging, and PostgreSQL persistence**.

After implementing **Reader** and **Writer** services in both frameworks, we can summarize the **key differences, similarities, and lessons learned**.



### **5.9.1 Spring Boot Implementation Highlights**

- **Reactive File Processing:**
  - Uses **Project Reactor Flux** for line streaming.
  - Backpressure handled by **Reactor Sinks**.
  - `Flux.using()` for safe resource handling.
- **Dependency Injection & Config:**
  - `@Service` + `@Autowired`
  - Config via `@Value("${...}")` from `application.yml`.
- **Persistence Layer:**
  - **Spring Data JPA** for `line_data` inserts.
  - **JdbcTemplate** for summary table (`file_summary`).
  - HikariCP for connection pooling.
- **Writer Service:**
  - Reactor-based **async file writing** using `Sinks.Many` → Flux subscriber.
  - Logs to file and console via **Logback**.
- **Deployment:**
  - Builds **fat JAR**.
  - Logback file + console logging.
  - Slower startup due to full Spring context.

------

### **5.9.2 Quarkus Implementation Highlights**

- **Reactive File Processing:**
  - **Mutiny Multi** for reactive streaming.
  - Optional plain blocking I/O and Flux variants.
  - Manual resource handling with `onTermination().invoke()`.
- **Dependency Injection & Config:**
  - `@ApplicationScoped` + `@Inject` (CDI)
  - Config via `@ConfigProperty(name="...")` from `application.properties`/`application.yml`.
- **Persistence Layer:**
  - **Panache Repository** for JPA entity persistence.
  - **Manual JDBC** for summary insert via `DataSource`.
  - Agroal as the lightweight connection pool.
- **Writer Service:**
  - Queue-based async writing with **LinkedBlockingQueue + Mutiny emitter**.
  - Logs to **stdout** and `org.jboss.logging.Logger`.
  - Explicit thread control via `AsyncWriterThread`.
- **Deployment:**
  - Builds **fast-jar runner**.
  - Console logging preferred.
  - Faster startup and lower memory footprint.

------

### **5.9.3 Key Differences: Spring Boot vs Quarkus**

| Aspect                     | **Spring Boot**                        | **Quarkus**                                     |
| -------------------------- | -------------------------------------- | ----------------------------------------------- |
| **Reactive Framework**     | Project Reactor (`Flux` / `Mono`)      | SmallRye Mutiny (`Multi` / `Uni`)               |
| **Reader File Processing** | `Flux.using()` + `Flux.fromStream()`   | `Multi.createFrom().items()` + queue/thread     |
| **Writer Async Handling**  | Reactor `Sinks.Many` → Flux subscriber | Queue + Mutiny emitter + dedicated thread       |
| **Config Injection**       | `@Value`                               | `@ConfigProperty`                               |
| **Dependency Injection**   | Spring `@Service` + `@Autowired`       | CDI `@ApplicationScoped` + `@Inject`            |
| **DB Line Persistence**    | Spring Data JPA                        | Panache Repository                              |
| **DB Summary Insert**      | `JdbcTemplate.update()`                | Manual JDBC via `DataSource`                    |
| **Connection Pool**        | HikariCP (default)                     | Agroal (lightweight, Quarkus-native)            |
| **Logging**                | SLF4J + Logback (console + file)       | `org.jboss.logging.Logger` (console)            |
| **Shutdown Handling**      | `@PreDestroy` completes Reactor sink   | `@PreDestroy` flips `running` + completes Multi |
| **Packaging**              | Fat JAR                                | Fast JAR Runner                                 |
| **Startup Speed**          | Slower                                 | Faster                                          |
| **Memory Footprint**       | Higher                                 | Lower                                           |



------

## **Final Takeaway**

This project demonstrated that:

- Both **Spring Boot** and **Quarkus** can implement a **reactive, event-driven pipeline** with similar architecture.
- **Spring Boot** prioritizes developer convenience with richer abstractions.
- **Quarkus** prioritizes performance, lower footprint, and explicit control.

------

This completes **Part 5 — Database & Summary Writing** with **equal focus and actual code** for both frameworks.

------

### **GitHub Repository Link**

🔗 **Project Repo:**
 https://github.com/KathiravanMuthaiah/reactive-mqtt-file-pipeline

------

