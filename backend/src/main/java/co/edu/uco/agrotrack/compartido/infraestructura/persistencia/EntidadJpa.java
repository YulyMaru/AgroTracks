package co.edu.uco.agrotrack.compartido.infraestructura.persistencia;

import java.time.Instant;
import java.util.UUID;

import org.springframework.data.domain.Persistable;

import jakarta.persistence.Column;
import jakarta.persistence.Id;
import jakarta.persistence.MappedSuperclass;
import jakarta.persistence.PostLoad;
import jakarta.persistence.PostPersist;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Transient;

/**
 * Base de las filas JPA con id UUID asignado por la aplicacion (o por el movil, ADR-007) y marcas
 * de auditoria. Implementa {@link Persistable} para que Spring Data haga INSERT directo en vez de
 * SELECT + MERGE al tener el id ya asignado.
 */
@MappedSuperclass
public abstract class EntidadJpa implements Persistable<UUID> {

	@Id
	private UUID id;

	@Column(name = "creado_en", nullable = false, updatable = false)
	private Instant creadoEn;

	@Column(name = "actualizado_en", nullable = false)
	private Instant actualizadoEn;

	@Transient
	private boolean nueva = true;

	protected EntidadJpa() {
	}

	protected EntidadJpa(UUID id) {
		this.id = id != null ? id : UUID.randomUUID();
	}

	@PrePersist
	void alCrear() {
		Instant ahora = Instant.now();
		creadoEn = ahora;
		actualizadoEn = ahora;
	}

	@PreUpdate
	void alActualizar() {
		actualizadoEn = Instant.now();
	}

	@PostLoad
	@PostPersist
	void marcarPersistida() {
		nueva = false;
	}

	@Override
	public UUID getId() {
		return id;
	}

	@Override
	public boolean isNew() {
		return nueva;
	}

	public Instant getCreadoEn() {
		return creadoEn;
	}

	public Instant getActualizadoEn() {
		return actualizadoEn;
	}
}
