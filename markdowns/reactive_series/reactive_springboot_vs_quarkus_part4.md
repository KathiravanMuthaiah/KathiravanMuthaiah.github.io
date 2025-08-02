# Series: Reactive File Processing with MQTT: Spring Boot vs Quarkus - Part 4 Writer Service

The **Writer Service** subscribes to MQTT and writes the transformed lines to a file asynchronously.
 Both **Spring Boot** and **Quarkus** implementations follow the same core responsibilities but differ in configuration and DI style.

------

## **4.1 Writer Responsibilities**

1. **Subscribe to MQTT topic** published by the Reader Service.
2. **Receive each transformed line** asynchronously.
3. **Write to output file** (`output.txt`) without blocking the main thread.
4. **Stay alive** to process continuous incoming messages.
5. **Graceful shutdown** to ensure pending lines are written to file.

------

## **4.1 Spring Boot Writer**

### **4.1.1 Responsibilities**

- Connect to **MQTT broker** and subscribe to the configured topic.
- Receive each message asynchronously via **Eclipse Paho client**.
- Buffer incoming lines using **Project Reactor Sinks** for backpressure handling.
- Asynchronously write lines to an **output file**.
- Gracefully flush and stop processing on shutdown.

------

### **4.1.2 AsyncFileWriterService.java**

```java
@Service
public class AsyncFileWriterService {

    private static final Logger log = LoggerFactory.getLogger(AsyncFileWriterService.class);

    @Value("${output.path}")
    private String outputFilePath;

    private final Sinks.Many<String> sink = Sinks.many().unicast().onBackpressureBuffer();

    @PostConstruct
    public void initWriter() {
        Flux<String> fileFlux = sink.asFlux();

        fileFlux.subscribe(line -> {
            try {
                FileWriterHelper.appendLine(outputFilePath, line);
                log.info("Written to file: {}", line);
            } catch (Exception e) {
                log.error("Failed to write line to file", e);
            }
        });

        log.info("Async file writer initialized for: {}", outputFilePath);
    }

    public void writeLine(String line) {
        sink.tryEmitNext(line);
    }

    @PreDestroy
    public void shutdown() {
        sink.tryEmitComplete();
        log.info("Shutting down async file writer");
    }
}
```

**Behavior:**

- Uses **Project Reactor Sinks** to buffer messages.
- Writes each message to the output file asynchronously.
- Completes the sink on shutdown to flush remaining lines.

------

### **4.1.3 Spring Boot Configuration (application.yml)**

```yaml
server:
  port: 8082

mqtt:
  broker: tcp://${MQTT_BROKER_HOST:localhost}:1883
  topic: ${MQTT_TOPIC:file.processed.line}

output:
  path: ${OUTPUT_FILE_PATH:./output/output.txt}
```

- **Port 8082** for the writer service
- **Environment-driven MQTT broker and topic**
- **Output path configurable**, defaults to `./output/output.txt`

------

## **4.2 Quarkus Writer**

### **4.2.1 Responsibilities**

- Subscribe to **MQTT topic** using Paho client.
- Queue incoming messages for asynchronous processing.
- Use **Mutiny `Multi` emitter + LinkedBlockingQueue** for backpressure and non-blocking consumption.
- Log (or write) messages from a **dedicated processing thread**.
- Gracefully stop on shutdown using a **volatile flag**.

------

### **4.2.2 AsyncFileWriterService.java**

```java
@ApplicationScoped
public class AsyncFileWriterService {

    private static final Logger log = Logger.getLogger(AsyncFileWriterService.class);

    private final LinkedBlockingQueue<String> queue = new LinkedBlockingQueue<>();
    private volatile boolean running = true;

    @PostConstruct
    void init() {
        Multi.createFrom().emitter(emitter -> {
            new Thread(() -> {
                while (running) {
                    try {
                        String line = queue.take();
                        System.out.println(line);
                        log.infof("Written to stdout: %s", line);
                    } catch (Exception e) {
                        log.error("Failed to write line to stdout", e);
                    }
                }
                emitter.complete();
            }, "AsyncWriterThread").start();
        }, BackPressureStrategy.BUFFER).subscribe().with(item -> {});
    }

    public void writeLine(String line) {
        queue.offer(line);
    }

    @PreDestroy
    void shutdown() {
        running = false;
        log.info("Shutting down async file writer");
    }
}
```

**Behavior:**

- Uses **LinkedBlockingQueue** for message buffering.
- Starts a **dedicated processing thread** to consume the queue.
- Uses **Mutiny Multi emitter** with `BUFFER` strategy.
- Writes to **stdout** (can be extended to file writing).
- Graceful shutdown via **volatile flag** and `@PreDestroy`.

------

### **4.2.3 Quarkus Writer Configuration (application.properties)**

```properties
quarkus.http.port=8082
mqtt.broker=tcp://localhost:1883
mqtt.topic=file.processed.line
output.path=./output/output.txt
```

- Runs on **port 8082** (matching Spring for parity).
- Configured via **MicroProfile Config**.
- Uses **console logging** with Quarkus `Logger`.

------

## **4.3 Spring vs Quarkus Writer Comparison**

| Aspect                    | **Spring Boot Writer**                 | **Quarkus Writer**                                     |
| ------------------------- | -------------------------------------- | ------------------------------------------------------ |
| **DI & Bean Scope**       | `@Service` + `@Autowired`              | `@ApplicationScoped` + `@Inject`                       |
| **Config Injection**      | `@Value("${...}")`                     | `@ConfigProperty(name="...")`                          |
| **MQTT Subscription**     | Paho + `@PostConstruct`                | Paho + `@PostConstruct`                                |
| **Async Buffering**       | Reactor `Sinks.Many` (unicast)         | `LinkedBlockingQueue` + Mutiny `Multi` emitter         |
| **Backpressure Handling** | Reactor-managed via sinks              | Queue + `BackPressureStrategy.BUFFER`                  |
| **Message Processing**    | Flux subscriber on elastic thread pool | Dedicated thread (`AsyncWriterThread`)                 |
| **Output Destination**    | Writes to file (`output.path`)         | Logs to stdout (extendable to file)                    |
| **Shutdown Handling**     | `@PreDestroy` completes Flux sink      | `@PreDestroy` sets `running=false` and completes Multi |



------

### **Key Takeaways**

- **Spring Boot Writer** is fully **Flux-based**, reactive end-to-end, and uses **Reactor sinks** for backpressure and asynchronous writing to file.
- **Quarkus Writer** combines **Mutiny emitter** with a **manual queue and thread**, giving explicit control over processing and shutdown.
- **Configuration and DI** follow their respective framework idioms:
  - Spring → `@Value`, SLF4J
  - Quarkus → `@ConfigProperty`, JBoss Logger

------

### **GitHub Repository Link**

🔗 **Project Repo:**
 https://github.com/KathiravanMuthaiah/reactive-mqtt-file-pipeline

------

