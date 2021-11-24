package metier;

public class Jeu {

	private String titre;
	private Console console;
	private Boutique boutique;
	
	public Jeu(String titre, Console console, Boutique boutique) {
		super();
		this.titre = titre;
		this.console = console;
		this.boutique = boutique;
	}
	
	public Boutique getBoutique() {
		return boutique;
	}

	public void setBoutique(Boutique boutique) {
		this.boutique = boutique;
	}

	public String getTitre() {
		return titre;
	}

	public void setTitre(String titre) {
		this.titre = titre;
	}

	public Console getConsole() {
		return console;
	}

	public void setConsole(Console console) {
		this.console = console;
	}

	@Override
	public String toString() {
		return "Jeu [titre=" + titre + ", console=" + console + ", boutique=" + boutique + "]";
	}


	
}
