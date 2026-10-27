package co.edu.uco.agrotrack;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.cache.annotation.EnableCaching;

@SpringBootApplication
@ConfigurationPropertiesScan
@EnableCaching
public class AgrotrackApplication {

	public static void main(String[] args) {
		SpringApplication.run(AgrotrackApplication.class, args);
	}

}