# Series: Reactive File Processing with MQTT: Spring Boot vs Quarkus - Part 2 Reactive Foundations

Modern Java applications often handle **asynchronous** and **streaming** data.
 In this project, our **Reader Service** reads files line by line and publishes messages to MQTT asynchronously.

We explore two **reactive approaches**:

1. **Spring Boot → Project Reactor (Flux / Mono)**
2. **Quarkus → SmallRye Mutiny (Multi / Uni)**

------

## **2.1 Reactive in Spring Boot — Project Reactor**

**Project Reactor** is the reactive library powering Spring WebFlux.

### **Key Types**

- **`Mono<T>`** → Emits **0..1** items (like a single async value)
- **`Flux<T>`** → Emits **0..N** items (like a stream)

------

### **Core Concepts**

- **Publisher** → Emits data (Flux or Mono)
- **Subscriber** → Consumes data
- **Operators** → Transform, filter, and react to data

------

### **Example: Reading File Lines with Flux**

```java
Flux.using(
    () -> Files.newBufferedReader(Path.of("samplefile.txt")),
    reader -> Flux.fromStream(reader.lines()),
    BufferedReader::close
)
.map(String::trim)
.filter(line -> !line.isEmpty())
.doOnNext(line -> System.out.println("Processing: " + line))
.doOnComplete(() -> System.out.println("File processing complete"))
.subscribe();
```

**Key Points**:

- **`Flux.using()`** → Safely manages a resource (file reader)
- **`map` / `filter` / `doOnNext`** → Transform and process lines
- **`subscribe()`** → Starts the stream (lazy until subscribed)

------

### **Flux Sink (Optional for Event Pushing)**

`Sinks.Many<T>` allows **manual emission of data**:

```java
Sinks.Many<String> sink = Sinks.many().unicast().onBackpressureBuffer();

sink.asFlux()
    .doOnNext(System.out::println)
    .subscribe();

sink.tryEmitNext("Line 1");
sink.tryEmitNext("Line 2");
```

**Use Case in Project**:

- Spring Writer Service can **push MQTT messages into a sink** to write asynchronously to a file.

------

## **2.2 Reactive in Quarkus — SmallRye Mutiny**

**Mutiny** is Quarkus’s native reactive programming library, part of SmallRye Reactive.

### **Key Types**

- **`Uni<T>`** → Emits **0..1** item
- **`Multi<T>`** → Emits **0..N** items (streaming)

------

### **Core Concepts**

- **Event-driven** & **lazy evaluation** like Flux
- **Pipeline building with operators**
- **Fluent API** with `.invoke()` for side effects

------

### **Example: Reading File Lines with Multi**

```java
BufferedReader reader = Files.newBufferedReader(Path.of("samplefile.txt"));

Multi.createFrom().items(reader.lines()::iterator)
    .map(String::trim)
    .filter(line -> !line.isEmpty())
    .invoke(line -> System.out.println("Processing: " + line))
    .onTermination().invoke(() -> reader.close())
    .subscribe().with(
        line -> {}, 
        failure -> failure.printStackTrace(),
        () -> System.out.println("File processing complete")
    );
```

**Key Points**:

- **`Multi.createFrom().items()`** → Converts iterable to a reactive stream
- **`invoke()`** → Perform side-effects (like logging or DB writes)
- **`onTermination().invoke()`** → Cleanup resources
- **`subscribe().with()`** → Handles item, failure, and completion

------

### **Flux vs Multi Comparison Table**

| Aspect                   | Spring Flux (`Flux`)     | Quarkus Mutiny (`Multi`)          |
| ------------------------ | ------------------------ | --------------------------------- |
| Single value type        | `Mono<T>`                | `Uni<T>`                          |
| Multi value type         | `Flux<T>`                | `Multi<T>`                        |
| Backpressure             | Built-in                 | Built-in                          |
| Resource handling        | `Flux.using()`           | `onTermination().invoke()`        |
| Trigger processing       | `subscribe()`            | `subscribe().with()`              |
| Event sink               | `Sinks.Many<T>`          | `Emitter` or `Multi.createFrom()` |
| Primary usage in project | Reader & Writer (Spring) | Reader (Quarkus)                  |



------

## **2.3 Key Takeaways**

1. **Both libraries provide reactive streams** for async processing.
2. **Flux** integrates seamlessly with Spring Boot; **Mutiny** is Quarkus-native.
3. For **file processing pipelines**, they let you:
   - Read files line by line without blocking threads
   - Transform and push data to DB or MQTT asynchronously
4. **In our project:**
   - **Reader Service** uses `Flux` in Spring and `Multi` in Quarkus
   - **Writer Service** can use `Flux` sink or Mutiny emitter for async writing

------

### ✅ **Next Step**

In **Part 3 — Reader Service**, we’ll dive into:

- **What the Reader Service does**
- **Spring Boot implementation**
- **Quarkus implementation (Plain, Flux, Mutiny)**
- **Side-by-side code comparison**

------

### **GitHub Repository Link**

🔗 **Project Repo:**
 https://github.com/KathiravanMuthaiah/reactive-mqtt-file-pipeline

------