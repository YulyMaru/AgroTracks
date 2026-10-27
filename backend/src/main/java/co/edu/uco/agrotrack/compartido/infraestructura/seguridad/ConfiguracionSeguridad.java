package co.edu.uco.agrotrack.compartido.infraestructura.seguridad;

import java.nio.charset.StandardCharsets;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.security.web.SecurityFilterChain;

import com.nimbusds.jose.jwk.source.ImmutableSecret;
import com.nimbusds.jose.proc.SecurityContext;

/**
 * Seguridad del backend (ADR-011, ADR-016): API sin estado protegida con JWT.
 * Solo son publicos el login/registro/renovacion, el estado del servidor y la salud.
 */
@Configuration
public class ConfiguracionSeguridad {

	@Bean
	SecurityFilterChain cadenaSeguridad(HttpSecurity http, RespuestasErrorSeguridad errores) throws Exception {
		http.csrf(csrf -> csrf.disable())
				.sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
				.headers(h -> h.frameOptions(f -> f.sameOrigin()))
				.authorizeHttpRequests(a -> a
						.requestMatchers(HttpMethod.POST, "/api/v1/autenticacion/**").permitAll()
						.requestMatchers(HttpMethod.GET, "/api/v1/sincronizacion/estado").permitAll()
						.requestMatchers("/actuator/health/**", "/actuator/info", "/actuator/prometheus").permitAll()
						.requestMatchers("/swagger-ui.html", "/swagger-ui/**", "/v3/api-docs/**").permitAll()
						.requestMatchers("/h2-console/**").permitAll()
						.requestMatchers("/error").permitAll()
						.anyRequest().authenticated())
				.oauth2ResourceServer(o -> o.jwt(Customizer.withDefaults())
						.authenticationEntryPoint(errores.noAutenticado())
						.accessDeniedHandler(errores.accesoDenegado()))
				.exceptionHandling(e -> e.authenticationEntryPoint(errores.noAutenticado())
						.accessDeniedHandler(errores.accesoDenegado()));
		return http.build();
	}

	@Bean
	SecretKey claveFirmaJwt(PropiedadesSeguridad propiedades) {
		return new SecretKeySpec(propiedades.jwtSecreto().getBytes(StandardCharsets.UTF_8), "HmacSHA256");
	}

	@Bean
	JwtDecoder jwtDecoder(SecretKey claveFirmaJwt) {
		return NimbusJwtDecoder.withSecretKey(claveFirmaJwt).macAlgorithm(MacAlgorithm.HS256).build();
	}

	@Bean
	JwtEncoder jwtEncoder(SecretKey claveFirmaJwt) {
		return new NimbusJwtEncoder(new ImmutableSecret<SecurityContext>(claveFirmaJwt));
	}

	@Bean
	PasswordEncoder passwordEncoder() {
		return new BCryptPasswordEncoder();
	}
}
