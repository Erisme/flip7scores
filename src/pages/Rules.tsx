import { BookOpen, Skull } from '@phosphor-icons/react';

export default function Rules() {
  return (
    <div className="page">
      <div className="page-title">
        <h1>Règles</h1>
        <p>Le rappel des règles de comptage des points</p>
      </div>

      <div className="card">
        <h2><BookOpen /> Classique</h2>
        <ul className="rules-list">
          <li><strong>Flip 7</strong> : collectez 7 cartes Numéro différentes → <strong>+15 pts bonus</strong></li>
          <li><strong>Bust</strong> : doublon sur une carte Numéro → score 0 pour ce tour</li>
          <li><strong>Carte ×2</strong> : double la somme de vos cartes Numéro</li>
          <li><strong>Cartes bonus</strong> : +2, +4, +6, +8, +10 ajoutés après le doublement</li>
          <li><strong>Objectif</strong> : atteindre le score cible en premier</li>
        </ul>
      </div>

      <div className="card">
        <h2><Skull /> Vengeance</h2>
        <ul className="rules-list">
          <li><strong>Cartes Numéro</strong> : de 0 à 13</li>
          <li><strong>The Zero</strong> : score du tour à 0, sauf en cas de Flip 7</li>
          <li><strong>Lucky 13</strong> : permet d'avoir deux 13 sans sauter ; ils comptent tous les deux pour le Flip 7</li>
          <li><strong>Calcul</strong> : somme des Numéros → ÷2 (arrondi en dessous) → modificateurs −2 à −10 (le score ne descend pas sous 0) → <strong>+15</strong> si Flip 7</li>
          <li><strong>Bust</strong> : score 0 pour ce tour</li>
          <li><strong>Mode Brutal</strong> : scores négatifs possibles, modificateurs aussi sur un joueur qui a sauté, et sur un Flip 7 on choisit <strong>+15</strong> ou <strong>−15 à un adversaire</strong></li>
        </ul>
      </div>
    </div>
  );
}
