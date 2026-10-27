package co.edu.uco.agrotrack;

import org.springframework.boot.SpringApplication;

public class TestAgrotrackApplication {

	public static void main(String[] args) {
		SpringApplication.from(AgrotrackApplication::main).with(TestcontainersConfiguration.class).run(args);
	}

}
