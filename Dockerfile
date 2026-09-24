# Stage 1: Build application with Maven
FROM maven:3.9-eclipse-temurin-21-alpine AS builder
WORKDIR /workspace

# Cache dependencies
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Build application
COPY src src
RUN mvn clean package -DskipTests -B

# Stage 2: Minimal, secure JRE runtime
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Run as non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser:appgroup

# Copy compiled jar
COPY --from=builder /workspace/target/*.jar app.jar

# Expose HTTP port (default 8080, overridden by Render's PORT environment variable)
EXPOSE 8080

# Production memory tuning for cloud containers (Render 512MB RAM safety)
ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]
