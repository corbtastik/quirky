---
title: "Kotlin 101"
date: 2025-12-28
tags: ["tutorial", "kotlin", "programming", "backend"]
description: "A comprehensive guide to learning the Kotlin programming language by building a real-world CLI tool."
subtitle: "Learning Kotlin by building a CLI tool."
---

Welcome to **Kotlin 101**. Coming from Java? Python? Never touched a typed
language? You are in for a treat. Kotlin is concise without being cryptic. It is
safe without being bossy. That pairing is why people love it.

We are not here to memorize syntax. We will learn the core ideas and put them to
work. By the end you will have **a persistent Command Line Interface (CLI) Task
Manager** that writes to your disk.

Let's dive in.

## Part 1: The Crash Course

First the building blocks. Kotlin runs on the Java Virtual Machine (JVM). It
talks to Java. The syntax is a generation newer.

### 1. Variables: `val` vs `var`

Kotlin leans on immutability.

* **`val`**: Read-only (Immutable). Once assigned, it cannot change.
* **`var`**: Mutable. Can be reassigned.

```kotlin
val appName = "TaskMaster" // Type inferred as String
var tasksCompleted = 0     // Type inferred as Int

tasksCompleted = 1         // OK
// appName = "NewName"     // Error: Val cannot be reassigned
```

### 2. Null Safety

This is Kotlin's superpower. In most languages a variable with no value crashes
your app. They call it the Billion Dollar Mistake. In Kotlin a variable cannot
be `null` unless you say so.

```kotlin
var name: String = "John"
// name = null // Compiler Error!

// To allow nulls, add a ?
var cleanDate: String? = null 
cleanDate = "2025-12-28"
```

### 3. Functions

Functions are first-class citizens.

```kotlin
fun greet(name: String): String {
    return "Hello, $name"
}

// Single-expression syntax (for concise one-liners)
fun double(x: Int) = x * 2
```

### 4. Data Classes

Ever written a Java POJO by hand? Getters. Setters. `equals()`, `hashCode()`,
`toString()`. You will cry tears of joy.

```kotlin
// This one line generates all standard methods automatically
data class Task(val id: Int, val description: String, var isDone: Boolean)
```

---

## Part 2: Building "KotList"

Basics done. Let's build something. **KotList** adds tasks, lists them, and
writes them to a text file. Close the program and they are still there.

### Prerequisites

* [IntelliJ IDEA](https://www.jetbrains.com/idea/) (Community Edition is free) or VS Code.
* JDK installed (version 17 or 21 recommended).

### Step 1: Define the Data Structure

Open your IDE. Create a file called `Main.kt`. First we need a way to hold a
task.

```kotlin
import java.io.File
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter

// A simple data class to hold our task info
data class Task(
    val id: Int,
    val content: String,
    var isCompleted: Boolean = false,
    val createdAt: String = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"))
) {
    // Override toString for a pretty print in the console
    override fun toString(): String {
        val status = if (isCompleted) "[x]" else "[ ]"
        return "$id. $status $content ($createdAt)"
    }
}
```

### Step 2: File Management

Now save and load. Plain Kotlin file I/O will do.

```kotlin
const val FILE_NAME = "tasks.txt"

// Helper to save tasks to a file
fun saveTasks(tasks: List<Task>) {
    val file = File(FILE_NAME)
    // We map our list of Task objects to a list of Strings like "1|Buy Milk|false|2025..."
    val lines = tasks.map { "${it.id}|${it.content}|${it.isCompleted}|${it.createdAt}" }
    file.writeText(lines.joinToString("\n"))
}

// Helper to load tasks from a file
fun loadTasks(): MutableList<Task> {
    val file = File(FILE_NAME)
    if (!file.exists()) return mutableListOf()

    return file.readLines().mapNotNull { line ->
        // Split the line by the pipe character
        val parts = line.split("|")
        if (parts.size == 4) {
            Task(
                id = parts[0].toInt(),
                content = parts[1],
                isCompleted = parts[2].toBoolean(),
                createdAt = parts[3]
            )
        } else null
    }.toMutableList()
}
```

*Note `map` and `mapNotNull`. Kotlin's collection API reshapes data without a single `for` loop.*

### Step 3: The Application Logic

Now the brains. This part reads what the user types.

```kotlin
fun main() {
    println("Welcome to KotList 1.0")
    val tasks = loadTasks()
    
    // Determine the next ID based on the last task, or 1 if empty
    var nextId = if (tasks.isEmpty()) 1 else tasks.maxOf { it.id } + 1

    while (true) {
        println("\nCommands: (a)dd, (l)ist, (c)omplete, (d)elete, (q)uit")
        print("> ")
        
        // 'when' is Kotlin's powerful switch statement
        when (readlnOrNull()?.trim()?.lowercase()) {
            "a", "add" -> {
                print("Enter task description: ")
                val desc = readlnOrNull().orEmpty()
                if (desc.isNotBlank()) {
                    tasks.add(Task(nextId++, desc))
                    saveTasks(tasks)
                    println("Task added.")
                }
            }
            "l", "list" -> {
                if (tasks.isEmpty()) println("No tasks found.")
                else tasks.forEach { println(it) }
            }
            "c", "complete" -> {
                print("Enter Task ID to complete: ")
                val inputId = readlnOrNull()?.toIntOrNull()
                // Find the task safely
                val task = tasks.find { it.id == inputId }
                if (task != null) {
                    task.isCompleted = true
                    saveTasks(tasks)
                    println("Task marked as done!")
                } else {
                    println("Task not found.")
                }
            }
            "d", "delete" -> {
                 print("Enter Task ID to delete: ")
                 val inputId = readlnOrNull()?.toIntOrNull()
                 val removed = tasks.removeIf { it.id == inputId }
                 if (removed) {
                     saveTasks(tasks)
                     println("Task deleted.")
                 } else {
                     println("Task not found.")
                 }
            }
            "q", "quit" -> {
                println("Goodbye!")
                return // Exits the main function
            }
            else -> println("Unknown command.")
        }
    }
}
```

### Key Kotlin Concepts Used Here:

1. **`readlnOrNull()`**: Safely reads input without crashing on end-of-stream.
2. **`?.` (Safe Call)**: We allow input to be null, but only call `.trim()` if it isn't.
3. **`when` Expression**: Replaces `switch/case` but allows for strings, ranges, and smart logic.
4. **Lambdas**: `tasks.forEach { println(it) }` uses a lambda expression. `it` is the implicit name of the single parameter.

## Part 3: Running Your Application

In IntelliJ, click the green Play triangle beside `main`.

From the command line:

1. Compile: `kotlinc Main.kt -include-runtime -d kotlist.jar`
2. Run: `java -jar kotlist.jar`

Now you can talk to your app.

```text
Commands: (a)dd, (l)ist, (c)omplete, (d)elete, (q)uit
> a
Enter task description: Learn Kotlin
Task added.

Commands: (a)dd, (l)ist, (c)omplete, (d)elete, (q)uit
> l
1. [ ] Learn Kotlin (2025-12-28 14:00)
```

Close the app. Run it again. Type `l`. Your task is still there. You just built
a database-backed application. The database is a text file, but still.

## Conclusion

You covered variables, null safety, data classes, collections and file I/O. You
did it building something that runs.

**Where to go next?**

1. **Coroutines:** For performing asynchronous tasks (like fetching data from the web) without blocking the main thread.
2. **Ktor or Spring Boot:** To turn this logic into a web server/API.
3. **Jetpack Compose:** To put a graphical UI on this logic for Android or Desktop.

Happy coding!
