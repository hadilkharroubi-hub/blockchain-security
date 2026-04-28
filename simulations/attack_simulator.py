import hashlib
import time
import json
from datetime import datetime

try:
    from ecdsa import SigningKey, SECP256k1
    from colorama import init, Fore, Back, Style
    init(autoreset=True)
except ImportError:
    print("  Installation des dépendances requises...")
    import subprocess
    subprocess.check_call(["pip", "install", "ecdsa", "colorama"])
    from ecdsa import SigningKey, SECP256k1
    from colorama import init, Fore, Back, Style
    init(autoreset=True)


class Colors:
    HEADER = Fore.CYAN + Style.BRIGHT
    SUCCESS = Fore.GREEN + Style.BRIGHT
    WARNING = Fore.YELLOW + Style.BRIGHT
    ERROR = Fore.RED + Style.BRIGHT
    INFO = Fore.BLUE
    BOLD = Style.BRIGHT
    RESET = Style.RESET_ALL


class BlockchainSecuritySimulator:
    def __init__(self):
        self.authorized_nodes = {}
        self.nonces = {}
        self.inspections = []
        self.attack_logs = []
        
    def _print_header(self, title):
        print("\n" + "="*70)
        print(Colors.HEADER + title.center(70))
        print("="*70 + Colors.RESET)
    
    def _print_subheader(self, title):
        print("\n" + Colors.BOLD + title)
        print("-" * len(title) + Colors.RESET)
    
    # =========================================
    # ATTAQUE 1 : SYBIL ATTACK
    # =========================================
    
    def demo_sybil_vulnerable(self):
        """Démo Sybil Attack SANS protection"""
        self._print_header("ATTAQUE N°1 : SYBIL ATTACK (SYSTÈME VULNÉRABLE)")
        
        print(f"\n{Colors.INFO} Contexte :")
        print("   Un réseau blockchain avec 8 nœuds validateurs")
        print("   3 nœuds légitimes + 5 nœuds créés par un attaquant")
        print(Colors.RESET)
        
        # Nœuds du réseau
        legitimate = ["Node_A", "Node_B", "Node_C"]
        attackers = ["FAKE_1", "FAKE_2", "FAKE_3", "FAKE_4", "FAKE_5"]
        
        print(f"\n{Colors.SUCCESS} Nœuds légitimes :")
        for node in legitimate:
            print(f"   • {node}")
        
        print(f"\n{Colors.ERROR} Nœuds attaquants (Sybil) :")
        for node in attackers:
            print(f"   • {node}")
        
        input(f"\n{Colors.WARNING}→ Appuyez sur Entrée pour détecter une fissure...{Colors.RESET}")
        
        # Détection de fissure
        self._print_subheader(" DÉTECTION DE FISSURE CRITIQUE")
        print(f"{Colors.ERROR}   Capteur Node_A détecte : Sévérité 9/10 (CRITIQUE)")
        print(f"   Localisation : Bâtiment A, Paris")
        print(f"   Risque : Effondrement imminent{Colors.RESET}")
        
        input(f"\n{Colors.WARNING}→ Appuyez sur Entrée pour le vote de validation...{Colors.RESET}")
        
        # Vote
        self._print_subheader("  VOTE DE VALIDATION")
        
        votes = []
        for node in legitimate:
            votes.append(("VALID", node))
            print(f"   {Colors.SUCCESS} {node:10s} : VALIDE la détection{Colors.RESET}")
        
        for node in attackers:
            votes.append(("REJECT", node))
            print(f"   {Colors.ERROR} {node:10s} : REJETTE la détection{Colors.RESET}")
        
        # Comptage
        valid_count = sum(1 for v, _ in votes if v == "VALID")
        reject_count = sum(1 for v, _ in votes if v == "REJECT")
        
        self._print_subheader(" RÉSULTAT DU VOTE")
        print(f"   {Colors.SUCCESS}VALIDE  : {valid_count} votes (37.5%){Colors.RESET}")
        print(f"   {Colors.ERROR}REJETÉ  : {reject_count} votes (62.5%){Colors.RESET}")
        
        print(f"\n{Colors.ERROR}{'  ATTAQUE RÉUSSIE ! ':═^70}")
        print(f"    Fissure critique REJETÉE par majorité Sybil")
        print(f"    Pas d'intervention de maintenance")
        print(f"    DANGER : Risque d'effondrement non traité")
        print(f"    Dommages potentiels : >10M€ + vies humaines")
        print("="*70 + Colors.RESET)
        
        self.attack_logs.append({
            "attack": "Sybil Attack",
            "vulnerable": True,
            "success": True,
            "impact": "Fissure critique non traitée"
        })
    
    def demo_sybil_protected(self):
        """Démo Sybil Attack AVEC protection PoA"""
        self._print_header("ATTAQUE N°1 : SYBIL ATTACK (SYSTÈME PROTÉGÉ - PoA)")
        
        print(f"\n{Colors.INFO} Protection activée : Proof of Authority (PoA) + PKI")
        print("   Seuls les capteurs CERTIFIÉS peuvent valider")
        print(Colors.RESET)
        
        # Capteurs autorisés (PKI)
        authorized = {
            "Node_A": {"reputation": 95, "cert": "CERT_A_2024", "expiry": "2025-12-31"},
            "Node_B": {"reputation": 88, "cert": "CERT_B_2024", "expiry": "2025-12-31"},
            "Node_C": {"reputation": 92, "cert": "CERT_C_2024", "expiry": "2025-12-31"}
        }
        
        unauthorized = ["FAKE_1", "FAKE_2", "FAKE_3", "FAKE_4", "FAKE_5"]
        
        self._print_subheader(" CAPTEURS AUTORISÉS (PKI)")
        for node, info in authorized.items():
            print(f"   {Colors.SUCCESS} {node:10s} - Réputation: {info['reputation']}/100 - Cert: {info['cert']}{Colors.RESET}")
        
        self._print_subheader(" NŒUDS NON AUTORISÉS")
        for node in unauthorized:
            print(f"   {Colors.ERROR} {node} - Aucun certificat{Colors.RESET}")
        
        input(f"\n{Colors.WARNING}→ Appuyez sur Entrée pour détecter une fissure...{Colors.RESET}")
        
        # Détection
        self._print_subheader(" DÉTECTION DE FISSURE CRITIQUE")
        print(f"{Colors.ERROR}   Capteur Node_A détecte : Sévérité 9/10 (CRITIQUE){Colors.RESET}")
        
        input(f"\n{Colors.WARNING}→ Appuyez sur Entrée pour le vote...{Colors.RESET}")
        
        # Vote avec vérification PoA
        self._print_subheader("  VOTE DE VALIDATION (avec vérification PoA)")
        
        valid_votes = 0
        rejected_attempts = 0
        
        for node in authorized:
            print(f"   {Colors.SUCCESS} {node:10s} : VALIDE (certifié PoA){Colors.RESET}")
            valid_votes += 1
        
        for node in unauthorized:
            print(f"   {Colors.ERROR} {node:10s} : REJETÉ (pas de certificat - protection Sybil){Colors.RESET}")
            rejected_attempts += 1
        
        self._print_subheader(" RÉSULTAT")
        print(f"   {Colors.SUCCESS}Votes valides acceptés  : {valid_votes}{Colors.RESET}")
        print(f"   {Colors.ERROR}Tentatives Sybil bloquées : {rejected_attempts}{Colors.RESET}")
        
        print(f"\n{Colors.SUCCESS}{'✅ PROTECTION EFFICACE ! ':═^70}")
        print(f"    Tous les nœuds Sybil BLOQUÉS")
        print(f"    Fissure VALIDÉE par consensus certifié")
        print(f"    Intervention de maintenance DÉCLENCHÉE")
        print(f"    Bâtiment sécurisé, vies sauvées")
        print("="*70 + Colors.RESET)
        
        self.attack_logs.append({
            "attack": "Sybil Attack",
            "vulnerable": False,
            "success": False,
            "impact": "Attaque bloquée par PoA"
        })
    
    # =========================================
    # ATTAQUE 2 : MITM / DATA TAMPERING
    # =========================================
    
    def demo_mitm_vulnerable(self):
        """Démo MITM SANS signature"""
        self._print_header("ATTAQUE N°2 : DATA TAMPERING / MITM (VULNÉRABLE)")
        
        print(f"\n{Colors.INFO} Contexte :")
        print("   Capteur IoT envoie des données vers la blockchain")
        print("   Canal de communication NON SÉCURISÉ")
        print(Colors.RESET)
        
        # Données originales
        original = {
            "building_id": "BUILDING_001",
            "location": "48.8566,2.3522",  # Paris
            "severity": 9,
            "timestamp": int(time.time())
        }
        
        self._print_subheader(" CAPTEUR ENVOIE")
        print(f"   Bâtiment    : {original['building_id']}")
        print(f"   Localisation: {original['location']} (Paris)")
        print(f"   {Colors.ERROR}Sévérité    : {original['severity']}/10 (CRITIQUE){Colors.RESET}")
        print(f"   Timestamp   : {original['timestamp']}")
        
        input(f"\n{Colors.WARNING}→ Appuyez sur Entrée (données en transit)...{Colors.RESET}")
        
        print(f"\n{Colors.ERROR}  ATTAQUANT INTERCEPTE LA TRANSMISSION...{Colors.RESET}")
        time.sleep(1)
        
        # Modification
        tampered = original.copy()
        tampered['severity'] = 1
        tampered['location'] = "43.6047,1.4442"  # Toulouse
        
        self._print_subheader(" ATTAQUANT MODIFIE LES DONNÉES")
        print(f"   Sévérité    : {Colors.ERROR}{original['severity']} → {tampered['severity']}{Colors.RESET} (minimisé)")
        print(f"   Localisation: Paris → Toulouse (falsifié)")
        
        input(f"\n{Colors.WARNING}→ Appuyez sur Entrée (données arrivent à la blockchain)...{Colors.RESET}")
        
        self._print_subheader(" BLOCKCHAIN REÇOIT")
        print(f"   Bâtiment    : {tampered['building_id']}")
        print(f"   Localisation: {tampered['location']} {Colors.ERROR}(MODIFIÉ){Colors.RESET}")
        print(f"   Sévérité    : {tampered['severity']}/10 {Colors.ERROR}(MODIFIÉ){Colors.RESET}")
        print(f"\n     Blockchain ACCEPTE les données modifiées")
        print(f"   (Pas de mécanisme de vérification)")
        
        print(f"\n{Colors.ERROR}{'  ATTAQUE RÉUSSIE ! ':═^70}")
        print(f"    Fissure critique notée comme 'bénigne'")
        print(f"    Mauvaise localisation enregistrée")
        print(f"    Intervention NON DÉCLENCHÉE")
        print(f"    Risque d'effondrement imminent")
        print("="*70 + Colors.RESET)
        
        self.attack_logs.append({
            "attack": "MITM",
            "vulnerable": True,
            "success": True,
            "impact": "Données critiques falsifiées"
        })
    
    def demo_mitm_protected(self):
        """Démo MITM AVEC signature ECDSA"""
        self._print_header("ATTAQUE N°2 : DATA TAMPERING / MITM (PROTÉGÉ - ECDSA)")
        
        print(f"\n{Colors.INFO} Protection activée : Signature ECDSA")
        print("   Chaque transaction est SIGNÉE par le capteur")
        print(Colors.RESET)
        
        # Génération clés ECDSA
        self._print_subheader(" GÉNÉRATION DES CLÉS ECDSA")
        print("   Génération clé privée capteur...")
        private_key = SigningKey.generate(curve=SECP256k1)
        public_key = private_key.get_verifying_key()
        print(f"   {Colors.SUCCESS} Clé privée : {private_key.to_string().hex()[:16]}...{Colors.RESET}")
        print(f"   {Colors.SUCCESS} Clé publique : {public_key.to_string().hex()[:16]}...{Colors.RESET}")
        
        # Données
        data = {
            "building_id": "BUILDING_001",
            "location": "48.8566,2.3522",
            "severity": 9,
            "timestamp": int(time.time())
        }
        
        self._print_subheader(" CAPTEUR PRÉPARE LES DONNÉES")
        print(f"   Bâtiment : {data['building_id']}")
        print(f"   Sévérité : {Colors.ERROR}{data['severity']}/10 (CRITIQUE){Colors.RESET}")
        
        # Signature
        message = json.dumps(data, sort_keys=True).encode()
        signature = private_key.sign(message)
        
        print(f"\n{Colors.SUCCESS} CAPTEUR SIGNE LES DONNÉES")
        print(f"   Signature ECDSA : {signature.hex()[:32]}...{Colors.RESET}")
        
        input(f"\n{Colors.WARNING}→ Appuyez sur Entrée (envoi avec signature)...{Colors.RESET}")
        
        print(f"\n{Colors.ERROR}  ATTAQUANT INTERCEPTE...{Colors.RESET}")
        
        # Tentative modification
        tampered_data = data.copy()
        tampered_data['severity'] = 1
        
        self._print_subheader(" ATTAQUANT TENTE DE MODIFIER")
        print(f"   Sévérité modifiée : 9 → 1")
        print(f"   Signature CONSERVÉE (l'attaquant ne peut pas la refaire)")
        
        input(f"\n{Colors.WARNING}→ Appuyez sur Entrée (blockchain vérifie)...{Colors.RESET}")
        
        # Vérification
        self._print_subheader(" BLOCKCHAIN VÉRIFIE LA SIGNATURE")
        
        tampered_message = json.dumps(tampered_data, sort_keys=True).encode()
        
        print("\n   Test avec données MODIFIÉES :")
        try:
            public_key.verify(signature, tampered_message)
            print(f"   {Colors.SUCCESS} Signature valide{Colors.RESET}")
            verified_tampered = True
        except:
            print(f"   {Colors.ERROR} SIGNATURE INVALIDE !{Colors.RESET}")
            print(f"   {Colors.ERROR}→ Données ont été ALTÉRÉES{Colors.RESET}")
            verified_tampered = False
        
        print("\n   Test avec données ORIGINALES :")
        try:
            public_key.verify(signature, message)
            print(f"   {Colors.SUCCESS} Signature VALIDE{Colors.RESET}")
            verified_original = True
        except:
            print(f"   {Colors.ERROR} Signature invalide{Colors.RESET}")
            verified_original = False
        
        print(f"\n{Colors.SUCCESS}{' PROTECTION EFFICACE ! ':═^70}")
        print(f"    Modification DÉTECTÉE")
        print(f"    Transaction modifiée REJETÉE")
        print(f"    Seules les données signées sont acceptées")
        print(f"    L'attaquant ne peut pas forger la signature sans la clé privée")
        print("="*70 + Colors.RESET)
        
        self.attack_logs.append({
            "attack": "MITM",
            "vulnerable": False,
            "success": False,
            "impact": "Modification détectée par ECDSA"
        })
    
    # =========================================
    # ATTAQUE 3 : REPLAY ATTACK
    # =========================================
    
    def demo_replay_vulnerable(self):
        """Démo Replay SANS nonce"""
        self._print_header("ATTAQUE N°3 : REPLAY ATTACK (VULNÉRABLE)")
        
        print(f"\n{Colors.INFO} Contexte :")
        print("   Système SANS vérification de fraîcheur des transactions")
        print(Colors.RESET)
        
        # Transaction jour 1
        tx_day1 = {
            "building_id": "BUILDING_001",
            "severity": 8,
            "timestamp": "2024-01-01 10:00:00",
            "status": "PENDING_REPAIR"
        }
        
        self._print_subheader(" JOUR 1 (1er janvier 2024)")
        print(f"   {Colors.ERROR}Capteur détecte fissure : Sévérité {tx_day1['severity']}/10{Colors.RESET}")
        print(f"   Transaction enregistrée blockchain ")
        print(f"   Statut : {tx_day1['status']}")
        
        self.inspections.append(tx_day1)
        
        input(f"\n{Colors.WARNING}→ Appuyez sur Entrée (5 jours passent)...{Colors.RESET}")
        
        print(f"\n JOUR 5 (5 janvier 2024)")
        print(f"   {Colors.SUCCESS} Fissure RÉPARÉE{Colors.RESET}")
        print(f"   Bâtiment sécurisé")
        
        input(f"\n{Colors.WARNING}→ Appuyez sur Entrée (1 jour passe)...{Colors.RESET}")
        
        print(f"\n JOUR 6 (6 janvier 2024)")
        print(f"   {Colors.ERROR} ATTAQUANT CAPTURE L'ANCIENNE TRANSACTION...{Colors.RESET}")
        print(f"   Transaction du Jour 1 rejouée...")
        
        # Rejouer
        replayed = tx_day1.copy()
        
        input(f"\n{Colors.WARNING}→ Appuyez sur Entrée (blockchain reçoit)...{Colors.RESET}")
        
        self._print_subheader(" BLOCKCHAIN REÇOIT LA TRANSACTION")
        print(f"   Bâtiment    : {replayed['building_id']}")
        print(f"   Sévérité    : {replayed['severity']}/10")
        print(f"   Timestamp   : {replayed['timestamp']}")
        print(f"\n    Aucune vérification de fraîcheur")
        print(f"   Transaction ACCEPTÉE (à tort)")
        
        self.inspections.append(replayed)
        
        print(f"\n{Colors.ERROR}{'  ATTAQUE RÉUSSIE ! ':═^70}")
        print(f"    Fausse alerte générée")
        print(f"    Équipe de maintenance dépêchée (inutilement)")
        print(f"    Coût : ~2000€ de déplacement")
        print(f"    Nombre d'inspections : {len(self.inspections)}")
        print("="*70 + Colors.RESET)
        
        self.attack_logs.append({
            "attack": "Replay Attack",
            "vulnerable": True,
            "success": True,
            "impact": "Transaction obsolète acceptée"
        })
    
    def demo_replay_protected(self):
        """Démo Replay AVEC nonce + timestamp"""
        self._print_header("ATTAQUE N°3 : REPLAY ATTACK (PROTÉGÉ)")
        
        print(f"\n{Colors.INFO} Protection activée : Nonce + Timestamp")
        print("   Nonce : Compteur unique incrémenté à chaque transaction")
        print("   Timestamp : Fenêtre de validité ±30 secondes")
        print(Colors.RESET)
        
        # Initialiser nonce
        sensor_id = "SENSOR_A"
        self.nonces[sensor_id] = 0
        
        current_time = int(time.time())
        
        # Transaction originale
        tx_original = {
            "building_id": "BUILDING_001",
            "severity": 8,
            "timestamp": current_time,
            "nonce": self.nonces[sensor_id]
        }
        
        self._print_subheader(" TRANSACTION ORIGINALE")
        print(f"   Bâtiment  : {tx_original['building_id']}")
        print(f"   Sévérité  : {tx_original['severity']}/10")
        print(f"   Timestamp : {tx_original['timestamp']}")
        print(f"   {Colors.SUCCESS}Nonce     : {tx_original['nonce']}{Colors.RESET}")
        
        # Enregistrer et incrémenter nonce
        print(f"\n Transaction ACCEPTÉE")
        self.nonces[sensor_id] += 1
        print(f"   {Colors.SUCCESS}Nonce du capteur incrémenté : {self.nonces[sensor_id]}{Colors.RESET}")
        
        input(f"\n{Colors.WARNING}→ Appuyez sur Entrée (5 jours passent)...{Colors.RESET}")
        
        print(f"\n 5 JOURS PLUS TARD...")
        print(f"   Fissure réparée ")
        print(f"   {Colors.INFO}Nonce actuel du capteur : {self.nonces[sensor_id]}{Colors.RESET}")
        
        input(f"\n{Colors.WARNING}→ Appuyez sur Entrée (attaquant rejoue)...{Colors.RESET}")
        
        print(f"\n{Colors.ERROR} ATTAQUANT TENTE DE REJOUER...{Colors.RESET}")
        
        # Rejouer
        replayed = tx_original.copy()
        
        self._print_subheader(" BLOCKCHAIN VÉRIFIE")
        
        # Vérification nonce
        print(f"\n   Vérification NONCE :")
        print(f"      Nonce reçu   : {replayed['nonce']}")
        print(f"      Nonce attendu: {self.nonces[sensor_id]}")
        
        if replayed['nonce'] != self.nonces[sensor_id]:
            print(f"      {Colors.ERROR} NONCE INVALIDE (déjà utilisé){Colors.RESET}")
            nonce_valid = False
        else:
            print(f"      {Colors.SUCCESS} Nonce valide{Colors.RESET}")
            nonce_valid = True
        
        # Vérification timestamp
        time_diff = abs(current_time - replayed['timestamp'])
        print(f"\n   Vérification TIMESTAMP :")
        print(f"      Timestamp reçu  : {replayed['timestamp']}")
        print(f"      Timestamp actuel: {current_time}")
        print(f"      Différence      : {time_diff} secondes")
        
        if time_diff > 30:
            print(f"      {Colors.ERROR} TIMESTAMP TROP ANCIEN (>{30}s){Colors.RESET}")
            timestamp_valid = False
        else:
            print(f"      {Colors.SUCCESS} Timestamp valide{Colors.RESET}")
            timestamp_valid = True
        
        if not nonce_valid or not timestamp_valid:
            print(f"\n{Colors.SUCCESS}{' PROTECTION EFFICACE ! ':═^70}")
            print(f"    REPLAY ATTACK DÉTECTÉE")
            print(f"    Transaction REJETÉE")
            print(f"    Le nonce garantit qu'une transaction ne peut être utilisée qu'une fois")
            print("="*70 + Colors.RESET)
            
            self.attack_logs.append({
                "attack": "Replay Attack",
                "vulnerable": False,
                "success": False,
                "impact": "Rejeu détecté par nonce/timestamp"
            })
        else:
            print(f"\n{Colors.ERROR}  Transaction acceptée{Colors.RESET}")
    
    # =========================================
    # RÉSUMÉ
    # =========================================
    
    def print_summary(self):
        """Affiche le résumé de toutes les démonstrations"""
        self._print_header("RÉSUMÉ FINAL")
        
        print(f"\n{Colors.BOLD} RÉSULTATS DES PROTECTIONS :{Colors.RESET}\n")
        
        protections = [
            {
                "name": "Sybil Attack",
                "vuln": " Majorité factice → Détections critiques rejetées",
                "prot": " PoA + PKI → Seuls nœuds certifiés valident",
                "mech": "Proof of Authority + Certificats PKI + Réputation"
            },
            {
                "name": "MITM / Data Tampering",
                "vuln": " Données modifiées → Sévérité 9→1",
                "prot": " Signature ECDSA → Modification détectée",
                "mech": "Signature cryptographique ECDSA (SECP256k1)"
            },
            {
                "name": "Replay Attack",
                "vuln": " Transaction rejouée → Fausses alertes",
                "prot": " Nonce + Timestamp → Rejeu impossible",
                "mech": "Compteur unique (Nonce) + Fenêtre temporelle ±30s"
            }
        ]
        
        for p in protections:
            print(f"{Colors.HEADER} {p['name']}{Colors.RESET}")
            print(f"   Sans protection : {p['vuln']}")
            print(f"   Avec protection : {p['prot']}")
            print(f"   Mécanisme       : {Colors.INFO}{p['mech']}{Colors.RESET}")
            print()
        
        print("="*70)
        print(f"{Colors.SUCCESS} Démonstration terminée !{Colors.RESET}")
        print(f"{Colors.INFO} Ces protections peuvent être combinées pour une sécurité maximale{Colors.RESET}")
        print("="*70)


# =========================================
# FONCTION PRINCIPALE
# =========================================

def main():
    """Fonction principale - Lance toutes les démos"""
    
    simulator = BlockchainSecuritySimulator()
    
    # En-tête principal
    print("\n")
    print(Colors.HEADER + "╔" + "="*68 + "╗")
    print("║" + "    DÉMONSTRATION SÉCURITÉ BLOCKCHAIN    ".center(68) + "║")
    print("║" + "Système de Détection de Fissures IoT".center(68) + "║")
    print("║" + "".center(68) + "║")
    print("║" + "3 Attaques + 3 Protections".center(68) + "║")
    print("╚" + "="*68 + "╝" + Colors.RESET)
    
    print(f"\n{Colors.INFO}Cette démonstration est INTERACTIVE.")
    print(f"Appuyez sur Entrée pour avancer étape par étape.{Colors.RESET}")
    
    input(f"\n{Colors.WARNING}→ Appuyez sur Entrée pour commencer...{Colors.RESET}")
    
    # ===========================================
    # ATTAQUE 1 : SYBIL
    # ===========================================
    
    print("\n\n" + Colors.HEADER + "┌" + "─"*68 + "┐")
    print("│" + "ATTAQUE N°1 : SYBIL ATTACK".center(68) + "│")
    print("└" + "─"*68 + "┘" + Colors.RESET)
    
    input(f"\n{Colors.WARNING}[1/2] Voir système VULNÉRABLE → Entrée{Colors.RESET}")
    simulator.demo_sybil_vulnerable()
    
    input(f"\n{Colors.WARNING}[2/2] Voir système PROTÉGÉ (PoA) → Entrée{Colors.RESET}")
    simulator.demo_sybil_protected()
    
    # ===========================================
    # ATTAQUE 2 : MITM
    # ===========================================
    
    print("\n\n" + Colors.HEADER + "┌" + "─"*68 + "┐")
    print("│" + "ATTAQUE N°2 : DATA TAMPERING / MITM".center(68) + "│")
    print("└" + "─"*68 + "┘" + Colors.RESET)
    
    input(f"\n{Colors.WARNING}[1/2] Voir système VULNÉRABLE → Entrée{Colors.RESET}")
    simulator.demo_mitm_vulnerable()
    
    input(f"\n{Colors.WARNING}[2/2] Voir système PROTÉGÉ (ECDSA) → Entrée{Colors.RESET}")
    simulator.demo_mitm_protected()
    
    # ===========================================
    # ATTAQUE 3 : REPLAY
    # ===========================================
    
    print("\n\n" + Colors.HEADER + "┌" + "─"*68 + "┐")
    print("│" + "ATTAQUE N°3 : REPLAY ATTACK".center(68) + "│")
    print("└" + "─"*68 + "┘" + Colors.RESET)
    
    input(f"\n{Colors.WARNING}[1/2] Voir système VULNÉRABLE → Entrée{Colors.RESET}")
    simulator.demo_replay_vulnerable()
    
    input(f"\n{Colors.WARNING}[2/2] Voir système PROTÉGÉ (Nonce+Timestamp) → Entrée{Colors.RESET}")
    simulator.demo_replay_protected()
    
    # ===========================================
    # RÉSUMÉ
    # ===========================================
    
    input(f"\n{Colors.WARNING}→ Appuyez sur Entrée pour voir le résumé final...{Colors.RESET}")
    simulator.print_summary()


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print(f"\n\n{Colors.WARNING}Démonstration interrompue.{Colors.RESET}")
    except Exception as e:
        print(f"\n{Colors.ERROR}Erreur : {e}{Colors.RESET}")