package co.edu.uco.agrotrack.modulos.autenticacion.dominio;

import java.time.Instant;
import java.util.UUID;

/** Refresh token guardado como hash SHA-256; se rota en cada renovacion (ADR-011). */
public class TokenRenovacion {

	private final UUID id;
	private final UUID idUsuario;
	private final String tokenHash;
	private final Instant expiraEn;
	private boolean revocado;
	private final Instant creadoEn;

	public TokenRenovacion(UUID id, UUID idUsuario, String tokenHash, Instant expiraEn, boolean revocado,
			Instant creadoEn) {
		this.id = id;
		this.idUsuario = idUsuario;
		this.tokenHash = tokenHash;
		this.expiraEn = expiraEn;
		this.revocado = revocado;
		this.creadoEn = creadoEn;
	}

	public static TokenRenovacion nuevo(UUID idUsuario, String tokenHash, Instant expiraEn) {
		return new TokenRenovacion(UUID.randomUUID(), idUsuario, tokenHash, expiraEn, false, Instant.now());
	}

	public boolean esValido() {
		return !revocado && expiraEn.isAfter(Instant.now());
	}

	public void revocar() {
		this.revocado = true;
	}

	public UUID getId() {
		return id;
	}

	public UUID getIdUsuario() {
		return idUsuario;
	}

	public String getTokenHash() {
		return tokenHash;
	}

	public Instant getExpiraEn() {
		return expiraEn;
	}

	public boolean isRevocado() {
		return revocado;
	}

	public Instant getCreadoEn() {
		return creadoEn;
	}
}
