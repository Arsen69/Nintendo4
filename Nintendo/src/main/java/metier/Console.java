package metier;

public abstract class Console {

	protected String nom;
	private double prix;
	private String date;
	

	public Console(String nom, double prix, String date) {
		super();
		this.nom = nom;
		this.prix = prix;
		this.date = date;
	}


	public String getNom() {
		return nom;
	}

	public void setNom(String nom) {
		this.nom = nom;
	}

	
	public double getPrix() {
		return prix;
	}


	public void setPrix(double prix) {
		this.prix = prix;
	}


	public String getDate() {
		return date;
	}


	public void setDate(String date) {
		this.date = date;
	}


	@Override
	public String toString() {
		return "Console [nom=" + nom + ", prix=" + prix + ", date=" + date + "]";
	}


	
	
	
}
