package co.edu.uco.agrotrack.compartido.infraestructura.json;

import java.util.Comparator;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Component;

import co.edu.uco.agrotrack.compartido.aplicacion.puerto.ConversorJson;
import co.edu.uco.agrotrack.compartido.dominio.CodigoError;
import co.edu.uco.agrotrack.compartido.dominio.ExcepcionAgroTrack;
import jakarta.validation.Validator;
import tools.jackson.databind.DeserializationFeature;
import tools.jackson.databind.exc.UnrecognizedPropertyException;
import tools.jackson.databind.json.JsonMapper;

/**
 * Adaptador de {@link ConversorJson} con Jackson y Bean Validation. Es estricto a proposito:
 * <ul>
 * <li>un campo que el modelo no define se RECHAZA (si se ignorara, se perderia sin aviso);</li>
 * <li>un decimal donde se esperan pesos enteros se RECHAZA (no se recorta en silencio).</li>
 * </ul>
 */
@Component
class ConversorJsonJackson implements ConversorJson {

	private final JsonMapper estricto;
	private final JsonMapper jsonMapper;
	private final Validator validator;

	ConversorJsonJackson(JsonMapper jsonMapper, Validator validator) {
		this.jsonMapper = jsonMapper;
		this.estricto = jsonMapper.rebuild()
				.enable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES)
				.disable(DeserializationFeature.ACCEPT_FLOAT_AS_INT)
				.build();
		this.validator = validator;
	}

	@Override
	public <T> T leer(Map<String, Object> contenido, Class<T> tipo) {
		T dto;
		try {
			dto = estricto.convertValue(contenido, tipo);
		} catch (RuntimeException e) {
			throw new ExcepcionAgroTrack(CodigoError.ERROR_VALIDACION, "El contenido tiene un formato inválido.",
					List.of(detalle(e)));
		}
		var violaciones = validator.validate(dto);
		if (!violaciones.isEmpty()) {
			List<String> detalles = violaciones.stream()
					.map(v -> v.getPropertyPath() + ": " + v.getMessage())
					.sorted(Comparator.naturalOrder())
					.toList();
			throw new ExcepcionAgroTrack(CodigoError.ERROR_VALIDACION, "Revisa los datos del registro.", detalles);
		}
		return dto;
	}

	@Override
	public String escribir(Object valor) {
		return jsonMapper.writeValueAsString(valor);
	}

	private static String detalle(Throwable error) {
		for (Throwable t = error; t != null; t = t.getCause()) {
			if (t instanceof UnrecognizedPropertyException noReconocido) {
				return "campo no definido en la historia de usuario: " + noReconocido.getPropertyName();
			}
		}
		return String.valueOf(error.getMessage());
	}
}
