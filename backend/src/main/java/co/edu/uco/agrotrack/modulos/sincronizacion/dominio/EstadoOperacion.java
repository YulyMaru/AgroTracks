package co.edu.uco.agrotrack.modulos.sincronizacion.dominio;

/**
 * Resultado por operacion que el movil usa para actualizar su cola (Flujo-Sincronizacion):
 * <ul>
 * <li>{@code SINCRONIZADO}: se aplico ahora. El movil la quita de la cola.</li>
 * <li>{@code YA_REGISTRADO}: ya se habia aplicado (reintento). Se trata como exito.</li>
 * <li>{@code ERROR}: dato invalido o conflicto de version (equivalente a 4xx). El movil la marca
 * ERROR y NO reintenta; el registro local se conserva para que el campesino lo corrija.</li>
 * </ul>
 * Los fallos temporales no aparecen aqui: el endpoint responde 5xx y el movil reintenta con backoff.
 */
public enum EstadoOperacion {
	SINCRONIZADO, YA_REGISTRADO, ERROR
}
