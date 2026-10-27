package co.edu.uco.agrotrack.modulos.registros.aplicacion.servicio;

import java.util.UUID;

import co.edu.uco.agrotrack.modulos.registros.aplicacion.puerto.entrada.RegistrosVistas.VistaRegistro;
import co.edu.uco.agrotrack.modulos.registros.aplicacion.puerto.salida.RepositorioRegistro;
import co.edu.uco.agrotrack.modulos.registros.dominio.Entidad;
import co.edu.uco.agrotrack.modulos.registros.dominio.Registro;

/**
 * Lo que cada tipo de registro sabe hacer. {@link RegistrosServicio} se encarga de lo comun a
 * todos: version, historial, borrado logico e idempotencia.
 *
 * @param <E> registro del dominio
 * @param <D> datos del formulario
 */
public interface GestorRegistro<E extends Registro, D> {

	Entidad entidad();

	Class<D> claseDatos();

	RepositorioRegistro<E> repositorio();

	/** Reglas que dependen de otros datos: referencias del mismo usuario, catalogos, nombres unicos. */
	void validar(UUID idUsuario, UUID idRegistro, D datos);

	/** Crea el registro con los datos ya validados. */
	E crear(UUID id, UUID idUsuario, D datos);

	/** Copia los datos ya validados sobre el registro existente. */
	void actualizar(E registro, D datos);

	/** Lanza un error si el registro no se puede eliminar (por ejemplo, un lote con cultivos). */
	default void verificarEliminable(E registro) {
	}

	/** Como se ve hacia afuera; tambien es la copia que se guarda en el historial. */
	VistaRegistro vista(E registro);
}
