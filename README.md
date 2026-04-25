# Sécurité Blockchain - Détection de Fissures dans les Bâtiments

**Travaux Pratiques - Blockchain Security**

## Description du Projet

Implémentation et démonstration de 3 attaques blockchain et leurs mécanismes de protection dans le contexte d'un système IoT de détection de fissures.

### Attaques Implémentées

1. **Sybil Attack** → Protection : PoA + PKI
2. **Data Tampering / MITM** → Protection : ECDSA + Merkle Tree
3. **Replay Attack** → Protection : Nonce + Timestamp

## Installation

### Prérequis

- Node.js 18+ 
- Python 3.10+
- Git

### Installation des dépendances

```bash
# Dépendances Node.js (Solidity)
npm install

# Dépendances Python (Simulations)
pip install -r requirements.txt
```

## Utilisation

### 1. Simulations Python

```bash
# Lancer toutes les simulations
python simulations/attack_simulator.py

# Ou lancer individuellement
python simulations/sybil_attack.py
python simulations/mitm_attack.py
python simulations/replay_attack.py
```

### 2. Smart Contracts Solidity

```bash
# Compiler les contrats
npx hardhat compile

# Lancer un nœud de test
npx hardhat node

# Déployer (dans un autre terminal)
npx hardhat run scripts/deploy.js --network localhost

# Exécuter les tests
npx hardhat test
```

## Structure
blockchain-security/
├── contracts/         # Smart contracts Solidity
├── scripts/           # Scripts de déploiement
├── simulations/       # Simulations Python des attaques
├── tests/             # Tests unitaires
├── rapport/           # Rapport et captures d'écran
└── presentation/      # Slides de présentation

## Documentation

- [Rapport PDF](rapport/rapport_template.md)
- [Présentation](presentation/slides.md)
- [Captures d'écran](rapport/captures/)

##  Auteur

Hadil Kharroubi - Projet ADEVA 2025-2026


