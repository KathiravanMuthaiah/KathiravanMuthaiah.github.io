# Series: Reactive File Processing with MQTT: Spring Boot vs Quarkus - Part 3 Reader Service

The **Reader Service** is the heart of this project.
 It **reads a file line by line**, **transforms each line**, **persists it to PostgreSQL**, **publishes it to MQTT**, and **writes a summary record** after processing completes.

------

## **3.1 Reader Responsibilities**

1. **File Ingestion**
   - Reads a local input file line by line.
   - Ignores empty lines and trims whitespace.
2. **Line Transformation**
   - Calculates the sum of comma-separated numbers.
   - Appends the sum to the line.
3. **Database Persistence**
   - Saves raw and transformed lines into `fileproc.line_data` via JPA.
   - Writes summary record (`fileproc.file_summary`) after full file processing.
4. **MQTT Publishing**
   - Publishes transformed lines to MQTT topic (`file.processed.line`).
5. **Completion & Logging**
   - Logs total lines processed.
   - Maintains rolling log files with `logback-spring.xml` (Spring Boot).

------

## **3.2 Spring Boot Reader Implementation**

**Spring Boot** `FileProcessingService.java`:

```text
@Service
public class FileProcessingService {

  private static final Logger log = LoggerFactory.getLogger(FileProcessingService.class);

  private final LineDataRepository lineDataRepository;
  private final MqttPublisherService mqttPublisherService;
  private final SummaryJdbcWriter summaryJdbcWriter;

  public FileProcessingService(LineDataRepository lineDataRepository,
      MqttPublisherService mqttPublisherService, SummaryJdbcWriter summaryJdbcWriter) {
    this.lineDataRepository = lineDataRepository;
    this.mqttPublisherService = mqttPublisherService;
    this.summaryJdbcWriter = summaryJdbcWriter;
  }

  public void processFile(Path filePath) {
    log.info("Starting processing of file: {}", filePath);

    AtomicInteger lineCounter = new AtomicInteger();

    try {
      Flux.using(() -> new BufferedReader(new FileReader(filePath.toFile())),
          reader -> Flux.fromStream(reader.lines()), BufferedReader::close)
          .subscribeOn(Schedulers.boundedElastic())
          .map(String::trim)
          .filter(line -> !line.isEmpty())
          .doOnNext(rawLine -> {

            // Transform line
            String transformed = LineTransformer.appendSum(rawLine);

            // Save to DB (JPA)
            lineDataRepository.save(new LineData(rawLine, transformed));

            // Publish to MQTT
            mqttPublisherService.publish(transformed);

            lineCounter.incrementAndGet();
          })
          .doOnComplete(() -> {
            log.info("Completed processing file: {} | {} lines", filePath.getFileName(), lineCounter.get());
            summaryJdbcWriter.writeSummary(filePath.getFileName().toString(), lineCounter.get());
          })
          .doOnError(e -> log.error("Error during file processing", e))
          .subscribe();
    } catch (Exception e) {
      log.error("Failed to process file: {}", filePath, e);
    }
  }
}
```

------

### **Spring Key Points**

- **Reactive File Processing:**
   Uses `Flux.using()` and `Flux.fromStream(reader.lines())` to stream file lines reactively.
- **Threading:**
   `subscribeOn(Schedulers.boundedElastic())` ensures file I/O runs on a non-blocking elastic thread pool.
- **Persistence:**
   Uses `lineDataRepository.save()` for each line and `summaryJdbcWriter` for summary.
- **MQTT Publishing:**
   `mqttPublisherService.publish(transformed)` uses **Eclipse Paho** client.
- **Logging:**
   Controlled by `logback-spring.xml` with daily rolling logs and Hibernate SQL debug.

------

### **Sample Spring Reader Logs**

```structured text
2025-08-01 20:15:01.123 [boundedElastic-1] INFO  FileProcessingService - Starting processing of file: samplefile.txt
2025-08-01 20:15:01.456 [boundedElastic-1] INFO  FileProcessingService - Completed processing file: samplefile.txt | 100 lines
```

------

## **3.3 Quarkus Reader Implementation**

In **Quarkus**, you implemented three variations:

1. **Plain (Blocking I/O)** → Simple, direct `BufferedReader` loop.
2. **Flux (Project Reactor)** → Same as Spring but runs in Quarkus.
3. **Mutiny (SmallRye Reactive)** → Quarkus-native reactive streaming with `Multi`.

------

### **Quarkus FileProcessingService (Mutiny Example)**

```text
@ApplicationScoped
public class FileProcessingService {

    private static final Logger log = Logger.getLogger(FileProcessingService.class);

    private final LineDataRepository lineDataRepository;
    private final MqttPublisherService mqttPublisherService;
    private final SummaryJdbcWriter summaryJdbcWriter;

    public FileProcessingService(LineDataRepository lineDataRepository,
                                 MqttPublisherService mqttPublisherService,
                                 SummaryJdbcWriter summaryJdbcWriter) {
        this.lineDataRepository = lineDataRepository;
        this.mqttPublisherService = mqttPublisherService;
        this.summaryJdbcWriter = summaryJdbcWriter;
    }

    public void processFile(Path filePath) {
        log.infof("Starting processing of file: %s", filePath);

        AtomicInteger lineCounter = new AtomicInteger();

        try {
            BufferedReader reader = new BufferedReader(new FileReader(filePath.toFile()));

            Multi.createFrom().items(reader.lines()).onTermination().invoke(() -> {
                try {
                    reader.close();
                } catch (IOException e) {
                    log.warn("Failed to close reader", e);
                }
            }).map(String::trim)
                .filter(line -> !line.isEmpty())
                .invoke(rawLine -> {
                    String transformed = LineTransformer.appendSum(rawLine);

                    // Persist and publish
                    lineDataRepository.persist(new LineData(rawLine, transformed));
                    mqttPublisherService.publish(transformed);

                    lineCounter.incrementAndGet();
                })
                .onCompletion().invoke(() -> {
                    summaryJdbcWriter.writeSummary(filePath.getFileName().toString(), lineCounter.get());
                    log.infof("Completed file %s | %d lines", filePath.getFileName(), lineCounter.get());
                }).onFailure()
                    .invoke(e -> log.errorf("Error during file processing: %s", e.getMessage()))
                    .subscribe().with(x -> {
                    });
        } catch (Exception e) {
            log.errorf("Failed to process file: %s", filePath, e);
        }
    }
}
```

------

### **Quarkus Key Points**

- **Mutiny `Multi`** for line streaming instead of Flux.
- **`invoke()`** for side effects (DB + MQTT).
- **`onCompletion().invoke()`** for logging and summary writing.
- **`onFailure().invoke()`** is Quarkus-native way to handle side-effect hook for error logging.

------

## **3.4 Spring vs Quarkus Reader — Side-by-Side**

| Feature                 | Spring Boot (Flux)                       | Quarkus (Mutiny)                      |
| ----------------------- | ---------------------------------------- | ------------------------------------- |
| Entry point             | `CommandLineRunner`                      | `@QuarkusMain` + `QuarkusApplication` |
| Reactive type           | `Flux<String>`                           | `Multi<String>`                       |
| Resource handling       | `Flux.using()` + `BufferedReader::close` | `onTermination().invoke()`            |
| Side effects (DB, MQTT) | `doOnNext()`                             | `invoke()`                            |
| Completion hook         | `doOnComplete()`                         | `onTermination().invoke()`            |
| Logging                 | Logback + SLF4J                          | `org.jboss.logging.Logger`            |
| Config injection        | `@Value`                                 | `@ConfigProperty`                     |
| Summary insert          | `JdbcTemplate` (Spring)                  | Direct JDBC with `DataSource`         |



------

## **3.5 Key Takeaways for Reader Service**

- **Reactive Streams** eliminate manual threading for file I/O.
- **Spring Boot** is Flux-first, **Quarkus** is Mutiny-first.
- **Post-processing (summary) occurs after stream completes**.
- **MQTT decouples Reader from Writer**, allowing asynchronous processing.

------

Next, we will cover **Part 4 — Writer Service**, which subscribes to MQTT and writes to an output file asynchronously, with **Spring Boot vs Quarkus** comparison.

------

### **GitHub Repository Link**

🔗 **Project Repo:**
 https://github.com/KathiravanMuthaiah/reactive-mqtt-file-pipeline

------

