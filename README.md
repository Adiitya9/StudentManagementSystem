# Studeo — Academic Analytics & Student Directory

A modern, production-grade academic management system and directory built with **Spring Boot 3.2.0 (Java 21)**, **Hibernate / Spring Data JPA**, and a sleek **SaaS Dashboard UI** with interactive analytics (Chart.js), dark theme, and zero frontend runtime bloat.

---

## ✨ Features

- ⚡ **Production-Hardened REST APIs**: Full CRUD operations with strict Jakarta Bean Validation (`@NotBlank`, `@Email`, phone formatting).
- 🛡️ **Centralized Error Handling**: Standardized RFC-7807 structured JSON error responses via `@RestControllerAdvice`.
- 🎨 **Modern SaaS Dashboard UI**:
  - Inter typography, responsive layouts, and polished KPI metrics cards (Total Enrolled, Search Matches, Recent Student).
  - Real-time debounced search & filter across names, emails, and phone numbers.
  - Safe, XSS-free DOM rendering with zero `innerHTML` interpolation of user data.
  - Accessible modal dialogs for Adding/Editing and Deletion Confirmation (replacing native `alert()` and `confirm()`).
  - Animated non-blocking toast notifications (Success, Error, Info).
- 📊 **Production Observability**: Spring Boot Actuator health checks enabled at `/actuator/health`.
- 🐳 **Containerization**: Multi-stage `Dockerfile` (optimized Temurin 21 JRE Alpine running as an unprivileged user) and `docker-compose.yml`.
- 🧪 **Comprehensive Automated Testing**: 100% passing tests with Mockito service tests and MockMvc controller slice tests.

---

## 📁 Project Structure

```
.
├── Dockerfile                               # Multi-stage container build
├── docker-compose.yml                       # Docker Compose specification
├── pom.xml                                  # Maven dependencies & build setup
├── README.md
└── src/
    ├── main/
    │   ├── java/com/example/sms/
    │   │   ├── StudentManagementSystemApplication.java
    │   │   ├── controller/
    │   │   │   └── StudentController.java   # REST API endpoints & DTO validation
    │   │   ├── dto/
    │   │   │   ├── StudentRequest.java      # Validated input payload
    │   │   │   └── StudentResponse.java     # Sanitized response payload
    │   │   ├── exception/
    │   │   │   ├── ErrorResponse.java       # Standardized error format
    │   │   │   ├── GlobalExceptionHandler.java # @RestControllerAdvice
    │   │   │   └── ResourceNotFoundException.java
    │   │   ├── model/
    │   │   │   └── Student.java             # JPA Entity
    │   │   ├── repository/
    │   │   │   └── StudentRepository.java   # Spring Data JPA Repository
    │   │   └── service/
    │   │       └── StudentService.java      # Transactional business logic
    │   └── resources/
    │       ├── application.properties       # App configuration & Actuator
    │       ├── data.sql                     # Seed data
    │       └── static/
    │           ├── css/style.css            # Modern dashboard stylesheet
    │           ├── js/app.js                # Clean DOM logic, search, modals & toasts
    │           └── index.html               # Semantic HTML dashboard
    └── test/
        ├── java/com/example/sms/
        │   ├── controller/StudentControllerTest.java # MockMvc REST tests
        │   └── service/StudentServiceTest.java       # Mockito unit tests
        └── resources/
            └── mockito-extensions/
                └── org.mockito.plugins.MockMaker     # Subclass mock maker
```

---

## 🚀 Running the Application

### Option 1: Run with Maven

```bash
# Run the application locally
mvn spring-boot:run
```

Or build and run the packaged jar:

```bash
mvn clean package
java -jar target/StudentManagementSystem-1.0.0.jar
```

### Option 2: Run with Docker Compose

```bash
docker compose up --build
```

---

## 🌐 Application URLs

Once running, access the following endpoints:

- **Web Dashboard**: [http://localhost:8080](http://localhost:8080)
- **REST API Base**: [http://localhost:8080/api/students](http://localhost:8080/api/students)
- **Actuator Health**: [http://localhost:8080/actuator/health](http://localhost:8080/actuator/health)
- **H2 Database Console**: [http://localhost:8080/h2-console](http://localhost:8080/h2-console) (JDBC URL: `jdbc:h2:mem:testdb`)

---

## 📡 REST API Specification

| HTTP Method | Endpoint | Description | Status Codes |
|---|---|---|---|
| `GET` | `/api/students` | Get all enrolled students | `200 OK` |
| `GET` | `/api/students/{id}` | Get student by ID | `200 OK`, `404 Not Found` |
| `POST` | `/api/students` | Create new student (validated) | `201 Created`, `400 Bad Request` |
| `PUT` | `/api/students/{id}` | Update existing student (validated) | `200 OK`, `400 Bad Request`, `404 Not Found` |
| `DELETE` | `/api/students/{id}` | Delete student | `204 No Content`, `404 Not Found` |

### Sample POST Request

```bash
curl -X POST http://localhost:8080/api/students \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Doe",
    "email": "jane.doe@example.com",
    "phone": "+1 555-0199"
  }'
```

---

## 🧪 Testing

Run the full automated test suite:

```bash
mvn clean test
```
