package test;

import metier.Console;
import metier.Jeu;

public class Test {

	public static void main(String[] args) {
		// TODO Auto-generated method stub

		Console c1 = new Console("Switch");
		Console c2 = new Console("GameCube");
		
		Jeu j1 = new Jeu("Breath of the Wild", c1);
		Jeu j2 = new Jeu("Mario Party", c1);
		Jeu j3 = new Jeu("The Wind Waker", c2);
		Jeu j4 = new Jeu("Metroid Prime", c2);
		Jeu j5 = new Jeu("Mario Kart 8", c1);
		
		
		
	}

}
