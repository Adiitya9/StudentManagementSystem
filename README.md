# Studeon — Student Management & Academic Records Portal

Studeon is a production-grade academic records and student management system built with Spring Boot 3.2.0, Java 21, Spring Security with JWT-based role-based access control (RBAC), and a responsive client interface styled with Plus Jakarta Sans and an anchored Royal Cobalt aesthetic.

---

## Overview

The platform is designed around the operational requirements of university registrar offices, faculty gradebooks, and student portals. It replaces generic administrative dashboards with high-density, structured academic records:

- **Student Register**: Authoritative registry supporting multi-field search, column sorting, pagination, and CSV export.
- **Gradebook and Attendance**: Course-section grading matrix computing weighted composites from assignments, midterms, finals, and attendance into official letter grades (A through F).
- **Course Catalog**: Curriculum bulletin detailing course codes, credits, instructors, locations, and enrollment capacities.
- **Academic Transcript and Student ID**: Official registrar document displaying semester-by-semester coursework, quality points, term GPAs, cumulative standing, and student credentials.
- **Audit Logging**: Append-only activity logging capturing all administrative and faculty modifications.

---

## Core Capabilities

### 1. Enterprise Security and RBAC
- Stateless authentication using JSON Web Tokens (JWT) signed with HMAC-SHA512.
- Granular method-level and URL-level security using Spring Security.
- Three distinct authorization tiers:
  - **Administrator** (`ROLE_ADMIN`): Full create, read, update, and delete (CRUD) permissions across all records and access to the complete audit trail.
  - **Faculty** (`ROLE_FACULTY`): Read access, student enrollment, record editing, and grade/attendance tracking. Deletion restricted.
  - **Student** (`ROLE_STUDENT`): Read-only access restricted to verified personal academic transcripts and profile data.

### 2. Academic Data Integrity
- Strict validation on all input payloads via Jakarta Bean Validation (`@NotBlank`, `@Email`, `@Pattern`, `@DecimalMin`, `@DecimalMax`).
- Standardized RFC-7807 error responses with field-specific validation mappings.
- Deterministic database seeding with 40 diverse student records across departments (Computer Science, Data Science, Business Administration, Engineering, Mathematics, Physics).

### 3. User Interface and Accessibility
- Typeset in **Plus Jakarta Sans** with fallbacks to Inter for high legibility and open aperture geometry.
- High-contrast text hierarchy exceeding WCAG AAA standards (14:1 contrast on primary headings, 6.5:1 on secondary text).
- Responsive layout supporting desktop, tablet, and mobile screens.
- Zero layout shift with reserved metric and chart containers.
- Debounced search inputs (200ms) to eliminate redundant DOM calculations.
- Full support for `prefers-reduced-motion` to eliminate decorative motion for users who require it.

---

## Demo Credentials

The application initializes with predefined demo accounts:

| Username | Password | Role | Permissions |
|---|---|---|---|
| `admin` | `admin123` | `ROLE_ADMIN` | Full administrative control (CRUD + Audit Log access) |
| `faculty` | `faculty123` | `ROLE_FACULTY` | Record creation, updating, and gradebook management |
| `student` | `student123` | `ROLE_STUDENT` | Read-only access to personalized Academic Transcript |

---

## Project Structure

```
.
|-- Dockerfile                               # Multi-stage container definition
|-- docker-compose.yml                       # Container orchestration
|-- pom.xml                                  # Project object model & dependencies
|-- README.md                                # System documentation
`-- src/
    |-- main/
    |   |-- java/com/example/sms/
    |   |   |-- StudentManagementSystemApplication.java
    |   |   |-- config/
    |   |   |   `-- SecurityDataInitializer.java # Account and role bootstrap
    |   |   |-- controller/
    |   |   |   |-- AuthController.java      # Login & JWT token issuance
    |   |   |   |-- AuditLogController.java  # Activity feed endpoints
    |   |   |   `-- StudentController.java   # Student registry REST endpoints
    |   |   |-- dto/
    |   |   |   |-- LoginRequest.java
    |   |   |   |-- AuthResponse.java
    |   |   |   |-- StudentRequest.java      # Validated input payload
    |   |   |   `-- StudentResponse.java     # Sanitized response payload
    |   |   |-- exception/
    |   |   |   |-- ErrorResponse.java       # Standardized error structure
    |   |   |   |-- GlobalExceptionHandler.java # @RestControllerAdvice
    |   |   |   `-- ResourceNotFoundException.java
    |   |   |-- model/
    |   |   |   |-- User.java                # Security principal
    |   |   |   |-- Role.java                # Authorization roles
    |   |   |   |-- Student.java             # Academic student record
    |   |   |   `-- AuditLog.java            # Immutable audit event
    |   |   |-- repository/
    |   |   |   |-- UserRepository.java
    |   |   |   |-- StudentRepository.java
    |   |   |   `-- AuditLogRepository.java
    |   |   |-- security/
    |   |   |   |-- JwtAuthenticationFilter.java
    |   |   |   |-- JwtTokenProvider.java
    |   |   |   `-- SecurityConfig.java
    |   |   `-- service/
    |   |       |-- StudentService.java      # Business logic & event emission
    |   |       `-- AuditLogService.java     # Audit record persistence
    |   `-- resources/
    |       |-- application.properties       # Runtime configuration
    |       |-- data.sql                     # Seed records (40 students)
    |       `-- static/
    |           |-- css/style.css            # Stylesheet (Plus Jakarta Sans, Royal Cobalt)
    |           |-- js/app.js                # State management, tabs, charts, DOM rendering
    |           `-- index.html               # Semantic client interface
    `-- test/
        `-- java/com/example/sms/
            |-- controller/
            |   |-- AuthControllerTest.java
            |   |-- AuditLogControllerTest.java
            |   `-- StudentControllerTest.java
            `-- service/
                `-- StudentServiceTest.java
```

---

## Technical Specifications

| Layer | Technology |
|---|---|
| Backend Framework | Spring Boot 3.2.0 |
| Runtime Environment | Java 21 (Eclipse Temurin) |
| Security & Auth | Spring Security 6, JJWT 0.11.5 (HMAC-SHA512) |
| Persistence | Spring Data JPA, Hibernate 6 |
| Database | H2 Embedded Database (In-Memory) |
| Client | Native HTML5, CSS3, ES6 JavaScript |
| Data Visualization | Chart.js 4.4.1 |
| Build & Dependency | Apache Maven 3.9+ |
| Containerization | Docker (Alpine JRE), Docker Compose |

---

## Getting Started

### Prerequisites
- Java Development Kit (JDK) 21 or higher
- Apache Maven 3.8+
- (Optional) Docker Engine and Docker Compose

### Local Execution via Maven

1. Clone the repository and navigate to the project directory:
   ```bash
   git clone https://github.com/Adiitya9/StudentManagementSystem.git
   cd StudentManagementSystem
   ```

2. Compile and launch the service:
   ```bash
   mvn spring-boot:run
   ```

3. Open your browser and access:
   - Application Interface: `http://localhost:8080`
   - H2 Database Console: `http://localhost:8080/h2-console`
     - JDBC URL: `jdbc:h2:mem:testdb`
     - Username: `sa`
     - Password: *(blank)*

### Execution via Docker Compose

```bash
docker compose up --build
```

The application will build within an isolated multi-stage container and expose port `8080`.

---

## REST API Reference

All protected endpoints require an `Authorization` header with the bearer token format:
`Authorization: Bearer <jwt-token>`

### Authentication Endpoints

| Method | Path | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/login` | Public | Authenticates credentials and returns JWT token and user profile |

#### Sample Login Request
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

### Student Registry Endpoints

| Method | Path | Access | Description |
|---|---|---|---|
| `GET` | `/api/students` | Authenticated | Retrieves all registered student records |
| `GET` | `/api/students/{id}` | Authenticated | Retrieves a specific record by numeric ID |
| `POST` | `/api/students` | Admin, Faculty | Enrolls a new student with validation |
| `PUT` | `/api/students/{id}` | Admin, Faculty | Updates an existing student record |
| `DELETE` | `/api/students/{id}` | Admin only | Permanently removes a student record |

#### Sample Create Student Request
```bash
curl -X POST http://localhost:8080/api/students \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Devendra Joshi",
    "email": "devendra.joshi@studeon.edu",
    "phone": "+91 98201 11041",
    "department": "Computer Science",
    "gpa": 3.82,
    "status": "ACTIVE",
    "enrollmentDate": "2024-08-15"
  }'
```

### Audit Log Endpoints

| Method | Path | Access | Description |
|---|---|---|---|
| `GET` | `/api/audit-logs` | Admin, Faculty | Retrieves the 50 most recent administrative audit events |

---

## Automated Testing

The repository contains automated unit and integration tests covering business logic, DTO mapping, security authorization, and controller slices.

Run the test suite:
```bash
mvn clean test
```

Test coverage includes:
- `StudentServiceTest`: Verifies CRUD transactions, GPA boundary handling, and audit event dispatching.
- `StudentControllerTest`: Validates endpoint security, JSON serialization, and validation constraints.
- `AuthControllerTest`: Tests credential verification and JWT token structure.
- `AuditLogControllerTest`: Tests access restrictions and event serialization.

All 21 tests pass with zero failures and zero errors.

---

## License

This project is licensed under the MIT License.
