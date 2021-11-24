package metier;

import java.util.List;

public class Jeu {

	private String titre;
	private Console console;
	
	
	
	public Jeu(String titre, Console console) {
		this.titre = titre;
		this.console = console;
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
		return "Jeu [titre=" + titre + ", console=" + console + "]";
	}
	
	
}
