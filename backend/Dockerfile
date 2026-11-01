# Imagen del backend para Cloud Run (ADR-031).
# Se construye desde la carpeta backend:  docker build -t agrotrack-backend .

# 1) Compilar el JAR con el JDK 27 (las pruebas corren antes, en el pipeline)
FROM eclipse-temurin:27-jdk AS compilacion
WORKDIR /fuente
COPY .mvn .mvn
COPY mvnw pom.xml ./
RUN chmod +x mvnw && ./mvnw -B -q dependency:go-offline
COPY src src
RUN ./mvnw -B -q package -DskipTests

# 2) Imagen final: solo el JRE y el JAR, ejecutando sin permisos de administrador
FROM eclipse-temurin:27-jre
RUN useradd --system --uid 1001 agrotrack
WORKDIR /app
COPY --from=compilacion /fuente/target/agrotrack-0.0.1-SNAPSHOT.jar app.jar
USER agrotrack
ENV SPRING_PROFILES_ACTIVE=prod
# Cloud Run indica el puerto en la variable PORT (server.port=${PORT:8080})
EXPOSE 8080
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-jar", "app.jar"]
