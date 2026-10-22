package co.edu.uco.agrotrack.modulos.autenticacion.infraestructura.salida.persistencia;

import java.time.Instant;
import java.util.UUID;

import org.springframework.data.domain.Persistable;

import co.edu.uco.agrotrack.modulos.autenticacion.dominio.TokenRenovacion;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PostLoad;
import jakarta.persistence.PostPersist;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;

/** Fila de la tabla tokens_renovacion. */
@Entity
@Table(name = "tokens_renovacion")
class TokenRenovacionJpa implements Persistable<UUID> {

	@Id
	private UUID id;

	@Column(name = "id_usuario", nullable = false)
	private UUID idUsuario;

	@Column(name = "token_hash", nullable = false, unique = true, length = 64)
	private String tokenHash;

	@Column(name = "expira_en", nullable = false)
	private Instant expiraEn;

	@Column(nullable = false)
	private boolean revocado;

	@Column(name = "creado_en", nullable = false)
	private Instant creadoEn;

	@Transient
	private boolean nueva = true;

	protected TokenRenovacionJpa() {
	}

	TokenRenovacionJpa(TokenRenovacion token) {
		this.id = token.getId();
		this.idUsuario = token.getIdUsuario();
		this.tokenHash = token.getTokenHash();
		this.expiraEn = token.getExpiraEn();
		this.creadoEn = token.getCreadoEn();
		this.revocado = token.isRevocado();
	}

	void copiarDe(TokenRenovacion token) {
		this.revocado = token.isRevocado();
	}

	TokenRenovacion aDominio() {
		return new TokenRenovacion(id, idUsuario, tokenHash, expiraEn, revocado, creadoEn);
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
}
