package com.ibizabroker.bibliotheque.configuration;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI bibliothequeOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Bibliotheque API")
                        .description("**REST API — Gestion de Bibliothèque (KFOKAM48 Phase 3)**\n\n"
                                + "- Module Réservation : /api/reservations (RG-01 → RG-06)\n"
                                + "- Tous les endpoints (sauf /authenticate et Swagger) nécessitent un token JWT.")
                        .version("v1.0.0")
                        .contact(new Contact().name("KFOKAM48 - Batch 2")))
                .servers(List.of(
                        new Server().url("http://localhost:8080").description("Local dev")))
                .components(new Components()
                        .addSecuritySchemes("bearerAuth", new SecurityScheme()
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")
                                .description("Token JWT obtenu via POST /authenticate")))
                .addSecurityItem(new SecurityRequirement().addList("bearerAuth"));
    }
}
