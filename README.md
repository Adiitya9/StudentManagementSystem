# Student Management System - Full Stack Web Application

A minimal, complete Student Management System built with Java Spring Boot, Hibernate, and vanilla JavaScript.

## Features

✅ **RESTful APIs** - Full CRUD operations for student management
✅ **In-Memory Database** - H2 database (no external setup required)
✅ **Responsive UI** - Modern, clean frontend with HTML/CSS/JavaScript
✅ **Sample Data** - Pre-loaded with 4 sample students
✅ **Zero Dependencies** - Everything included, ready to run

## Project Structure

```
src/main/
├── java/com/example/sms/
│   ├── StudentManagementSystemApplication.java   (Main class)
│   ├── controller/StudentController.java         (REST API endpoints)
│   ├── service/StudentService.java              (Business logic)
│   ├── repository/StudentRepository.java        (Database access)
│   └── model/Student.java                       (Entity model)
├── resources/
│   ├── application.properties                   (Configuration)
│   ├── data.sql                                 (Sample data)
│   └── static/
│       ├── index.html                           (Frontend UI)
│       └── style.css                            (Styling)
```

## Prerequisites

- **Java 17+** (Spring Boot 3.x requirement)
- **Maven 3.6+**

## Running the Application

### Option 1: Build & Run with Maven

```bash
# Navigate to project directory
cd /Users/adityamacbook/Documents/Project

# Build the project
mvn clean package

# Run the application
java -jar target/StudentManagementSystem-1.0.0.jar
```

### Option 2: Run with Maven directly

```bash
cd /Users/adityamacbook/Documents/Project
mvn spring-boot:run
```

## Accessing the Application

Once running, open your browser and navigate to:

- **Frontend**: http://localhost:8080
- **API Base**: http://localhost:8080/api/students
- **H2 Console** (optional): http://localhost:8080/h2-console

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/students` | Get all students |
| GET | `/api/students/{id}` | Get student by ID |
| POST | `/api/students` | Create new student |
| PUT | `/api/students/{id}` | Update student |
| DELETE | `/api/students/{id}` | Delete student |

### Example API Calls

**Add Student:**
```bash
curl -X POST http://localhost:8080/api/students \
  -H "Content-Type: application/json" \
  -d '{"name":"Jane Doe","email":"jane@example.com","phone":"555-0105"}'
```

**Get All Students:**
```bash
curl http://localhost:8080/api/students
```

**Update Student:**
```bash
curl -X PUT http://localhost:8080/api/students/1 \
  -H "Content-Type: application/json" \
  -d '{"name":"John Updated","email":"john.updated@example.com","phone":"555-9999"}'
```

**Delete Student:**
```bash
curl -X DELETE http://localhost:8080/api/students/1
```

## Frontend Features

- ✏️ **Add Students** - Fill the form and submit
- 👁️ **View Students** - All students displayed in a table
- 📝 **Edit Students** - Click Edit button, modify, and update
- ❌ **Delete Students** - Click Delete with confirmation

## Sample Data

The application comes pre-loaded with 4 sample students:
1. John Smith - john.smith@example.com - 555-0101
2. Sarah Johnson - sarah.johnson@example.com - 555-0102
3. Michael Brown - michael.brown@example.com - 555-0103
4. Emily Davis - emily.davis@example.com - 555-0104

## Student Model

Each student has the following fields:
- **ID** (Long) - Auto-generated primary key
- **Name** (String) - Student's full name
- **Email** (String) - Email address (unique recommended)
- **Phone** (String) - Phone number

## Technology Stack

- **Backend**: Spring Boot 3.2.0
- **ORM**: Hibernate (Spring Data JPA)
- **Database**: H2 (In-memory)
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Build Tool**: Maven
- **Language**: Java 17

## Stopping the Application

Press `Ctrl + C` in your terminal to stop the server.

## Troubleshooting

**Port 8080 already in use?**
- Change the port in `application.properties`:
  ```properties
  server.port=8081
  ```

**Build fails?**
- Ensure Java 17+ is installed: `java -version`
- Clear Maven cache: `mvn clean`

**Database issues?**
- The H2 database resets on restart (as expected with in-memory DB)
- To persist data, change the datasource URL in `application.properties`

## Notes

- The H2 database is in-memory and will reset when the application restarts
- Cross-Origin (CORS) is enabled for frontend requests
- The frontend is served as static content from the Spring Boot server

---

**Ready to use!** Follow the "Running the Application" section to get started.
