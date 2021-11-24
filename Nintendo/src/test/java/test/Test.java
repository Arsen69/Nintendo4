package test;

import java.util.ArrayList;
import java.util.List;

import metier.Achat;
import metier.Adresse;
import metier.Boutique;
import metier.Client;
import metier.Hybride;
import metier.Jeu;
import metier.Salon;

public class Test {

	public static void main(String[] args) {
		// TODO Auto-generated method stub

		List<Achat> achats1 = new ArrayList();
		List<Achat> achats2 = new ArrayList();
		
		
		Hybride c1 = new Hybride("Switch", 300, "2015");
		Salon c2 = new Salon("GameCube", 120, "2001");
		
		Adresse a1 = new Adresse(5, "rue de la Paix", "Monopoly");
		Adresse a2 = new Adresse(7, "rue Victor Hugo", "Monopoly");
		
		Client cl1 = new Client ("Doe","John", achats1);
		Client cl2 = new Client ("Doe","Jane", achats2);
		Boutique b1 = new Boutique("Gamestop", a1);
		Boutique b2 = new Boutique("Fnac", a2);
		
		Jeu j1 = new Jeu("Breath of the Wild", c1, b2);
		Jeu j2 = new Jeu("Mario Party", c1,b2);
		Jeu j3 = new Jeu("The Wind Waker", c2,b1);
		Jeu j4 = new Jeu("Metroid Prime", c2,b1);
		Jeu j5 = new Jeu("Mario Kart 8", c1,b2);
		
		
		
	}

}
