package co.edu.uco.agrotrack.compartido.infraestructura.persistencia;

import java.util.function.Supplier;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Component;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import co.edu.uco.agrotrack.compartido.aplicacion.puerto.Transacciones;
import co.edu.uco.agrotrack.compartido.dominio.ConflictoDeDatos;

/** Adaptador de {@link Transacciones} con el gestor de transacciones de Spring. */
@Component
class TransaccionesSpring implements Transacciones {

	private final TransactionTemplate plantilla;

	TransaccionesSpring(PlatformTransactionManager gestor) {
		this.plantilla = new TransactionTemplate(gestor);
	}

	@Override
	public <T> T ejecutar(Supplier<T> trabajo) {
		try {
			return plantilla.execute(estado -> trabajo.get());
		} catch (DataIntegrityViolationException e) {
			throw new ConflictoDeDatos("La información entra en conflicto con datos existentes.", e);
		}
	}
}
