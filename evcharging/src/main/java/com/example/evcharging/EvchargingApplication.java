package com.example.evcharging;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class EvchargingApplication {

	public static void main(String[] args) {
		SpringApplication.run(EvchargingApplication.class, args);
	}

}
