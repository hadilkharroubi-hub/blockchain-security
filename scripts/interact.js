const hre = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("=".repeat(70));
  console.log("INTERACTION AVEC LE SMART CONTRACT SÉCURISÉ");
  console.log("=".repeat(70));

  // Charger les informations de déploiement
  if (!fs.existsSync("./deployment-info.json")) {
    console.error("\n Fichier deployment-info.json non trouvé");
    console.log("Déployez d'abord le contrat avec :");
    console.log("   npx hardhat run scripts/deploy.js --network localhost");
    process.exit(1);
  }

  const deploymentInfo = JSON.parse(
    fs.readFileSync("./deployment-info.json", "utf8")
  );

  const contractAddress = deploymentInfo.contractAddress;
  console.log(`\n Adresse du contrat : ${contractAddress}`);
  console.log(` Réseau : ${deploymentInfo.network}`);

  // Récupérer les comptes
  const [owner, sensor1, sensor2, attacker] = await hre.ethers.getSigners();

  console.log("\n Comptes disponibles :");
  console.log(`   Owner    : ${owner.address}`);
  console.log(`   Sensor 1 : ${sensor1.address}`);
  console.log(`   Sensor 2 : ${sensor2.address}`);
  console.log(`   Attacker : ${attacker.address}`);

  // Récupérer le contrat
  const SecureInspection = await hre.ethers.getContractFactory("SecureInspection");
  const contract = SecureInspection.attach(contractAddress);

  // =========================================
  // 1. VÉRIFIER LE PROPRIÉTAIRE
  // =========================================
  
  console.log("\n" + "=".repeat(70));
  console.log("1️  VÉRIFICATION DU PROPRIÉTAIRE");
  console.log("=".repeat(70));

  const contractOwner = await contract.owner();
  console.log(`Propriétaire du contrat : ${contractOwner}`);
  console.log(`Est bien le déployeur : ${contractOwner === owner.address ? " Oui" : " Non"}`);

  // =========================================
  // 2. AUTORISER UN CAPTEUR (PoA + PKI)
  // =========================================
  
  console.log("\n" + "=".repeat(70));
  console.log("2️  AUTORISATION D'UN CAPTEUR (PoA + PKI)");
  console.log("=".repeat(70));

  console.log(`\n Autorisation du capteur : ${sensor1.address}`);
  console.log("   Génération d'un certificat PKI...");
  
  const publicKey = `PKI_CERT_${sensor1.address.slice(2, 10).toUpperCase()}_2024`;
  const validityDays = 365;
  
  console.log(`   Clé publique (certificat) : ${publicKey}`);
  console.log(`   Validité : ${validityDays} jours`);

  const authTx = await contract.authorizeSensor(
    sensor1.address,
    publicKey,
    validityDays
  );
  await authTx.wait();
  
  console.log(" Capteur autorisé avec succès");

  // Vérifier l'autorisation
  const sensorInfo = await contract.getSensorInfo(sensor1.address);
  console.log("\n Informations du capteur :");
  console.log(`   Autorisé : ${sensorInfo.isAuthorized ? " Oui" : " Non"}`);
  console.log(`   Réputation : ${sensorInfo.reputation}/100`);
  console.log(`   Certificat PKI : ${sensorInfo.publicKey}`);
  console.log(`   Expiration : ${new Date(Number(sensorInfo.certificateExpiry) * 1000).toLocaleDateString()}`);

  // =========================================
  // 3. ENREGISTRER UNE INSPECTION SÉCURISÉE
  // =========================================
  
  console.log("\n" + "=".repeat(70));
  console.log("3️  ENREGISTREMENT D'UNE INSPECTION SÉCURISÉE");
  console.log("=".repeat(70));

  const inspectionData = {
    buildingId: "BUILDING_001",
    location: "48.8566,2.3522", // Paris
    severity: 9,
    timestamp: Math.floor(Date.now() / 1000)
  };

  console.log("\n Données de l'inspection :");
  console.log(`   Bâtiment ID : ${inspectionData.buildingId}`);
  console.log(`   Localisation : ${inspectionData.location}`);
  console.log(`   Sévérité : ${inspectionData.severity}/10 (CRITIQUE)`);
  console.log(`   Timestamp : ${inspectionData.timestamp}`);

  // Récupérer le nonce actuel
  const currentNonce = await contract.getCurrentNonce(sensor1.address);
  console.log(`   Nonce actuel : ${currentNonce}`);

  // Créer le message à signer
  const messageHash = hre.ethers.solidityPackedKeccak256(
    ["string", "string", "uint8", "uint256", "uint256"],
    [
      inspectionData.buildingId,
      inspectionData.location,
      inspectionData.severity,
      inspectionData.timestamp,
      currentNonce
    ]
  );

  console.log(`\n Signature ECDSA de la transaction...`);
  console.log(`   Message hash : ${messageHash}`);

  // Signer avec la clé privée du capteur
  const signature = await sensor1.signMessage(hre.ethers.getBytes(messageHash));
  console.log(`   Signature : ${signature.slice(0, 20)}...`);

  // Enregistrer l'inspection
  console.log(`\n Enregistrement de l'inspection sur la blockchain...`);
  
  const recordTx = await contract.connect(sensor1).recordInspection(
    inspectionData.buildingId,
    inspectionData.location,
    inspectionData.severity,
    inspectionData.timestamp,
    signature
  );

  const receipt = await recordTx.wait();
  
  console.log(" Inspection enregistrée avec succès !");
  console.log(`   Transaction hash : ${receipt.hash}`);
  console.log(`   Block number : ${receipt.blockNumber}`);
  console.log(`   Gas utilisé : ${receipt.gasUsed.toString()}`);

  // =========================================
  // 4. RÉCUPÉRER L'INSPECTION
  // =========================================
  
  console.log("\n" + "=".repeat(70));
  console.log("4️  RÉCUPÉRATION DE L'INSPECTION");
  console.log("=".repeat(70));

  const totalInspections = await contract.getTotalInspections();
  console.log(`\n Nombre total d'inspections : ${totalInspections}`);

  const inspection = await contract.getInspection(1);
  
  console.log("\n Détails de l'inspection #1 :");
  console.log(`   ID : ${inspection.id}`);
  console.log(`   Capteur : ${inspection.sensor}`);
  console.log(`   Bâtiment : ${inspection.buildingId}`);
  console.log(`   Localisation : ${inspection.location}`);
  console.log(`   Sévérité : ${inspection.severity}/10`);
  console.log(`   Timestamp : ${new Date(Number(inspection.timestamp) * 1000).toLocaleString()}`);
  console.log(`   Nonce : ${inspection.nonce}`);
  console.log(`   Signature : ${inspection.signature.slice(0, 20)}...`);
  console.log(`   Vérifié : ${inspection.verified ? " Oui" : " Non"}`);

  // =========================================
  // 5. DÉMONSTRATION ATTAQUE SYBIL (BLOQUÉE)
  // =========================================
  
  console.log("\n" + "=".repeat(70));
  console.log("5️  DÉMONSTRATION : TENTATIVE SYBIL ATTACK");
  console.log("=".repeat(70));

  console.log(`\n L'attaquant (${attacker.address}) tente d'enregistrer une inspection...`);
  
  try {
    const attackTx = await contract.connect(attacker).recordInspection(
      "BUILDING_FAKE",
      "0,0",
      1,
      Math.floor(Date.now() / 1000),
      "0x" + "00".repeat(65) // Signature factice
    );
    await attackTx.wait();
    
    console.log(" Attaque réussie (ne devrait pas arriver)");
  } catch (error) {
    console.log(" Attaque BLOQUÉE par la protection Sybil !");
    console.log(`   Raison : ${error.message.includes("not authorized") ? "Capteur non autorisé (PoA)" : error.message}`);
  }

  // =========================================
  // 6. DÉMONSTRATION REPLAY ATTACK (BLOQUÉE)
  // =========================================
  
  console.log("\n" + "=".repeat(70));
  console.log("6️  DÉMONSTRATION : TENTATIVE REPLAY ATTACK");
  console.log("=".repeat(70));

  console.log(`\n Tentative de rejouer l'ancienne transaction...`);
  console.log(`   Ancien nonce : ${currentNonce}`);
  console.log(`   Nonce actuel : ${await contract.getCurrentNonce(sensor1.address)}`);

  try {
    const replayTx = await contract.connect(sensor1).simulateReplayAttack(
      inspectionData.buildingId,
      inspectionData.location,
      inspectionData.severity,
      inspectionData.timestamp,
      currentNonce, // Ancien nonce
      signature
    );
    await replayTx.wait();
    
    console.log(" Replay réussie (ne devrait pas arriver)");
  } catch (error) {
    console.log(" Replay Attack DÉTECTÉE et BLOQUÉE !");
    console.log(`   Raison : ${error.message.includes("Invalid nonce") ? "Nonce invalide (déjà utilisé)" : "Autre protection"}`);
  }

  // =========================================
  // 7. LISTE DES CAPTEURS AUTORISÉS
  // =========================================
  
  console.log("\n" + "=".repeat(70));
  console.log("7️  LISTE DES CAPTEURS AUTORISÉS");
  console.log("=".repeat(70));

  const authorizedSensors = await contract.getAuthorizedSensors();
  
  console.log(`\n ${authorizedSensors.length} capteur(s) autorisé(s) :`);
  
  for (let i = 0; i < authorizedSensors.length; i++) {
    const addr = authorizedSensors[i];
    const info = await contract.getSensorInfo(addr);
    
    console.log(`\n   ${i + 1}. ${addr}`);
    console.log(`      Réputation : ${info.reputation}/100`);
    console.log(`      Certificat : ${info.publicKey}`);
    console.log(`      Expire le : ${new Date(Number(info.certificateExpiry) * 1000).toLocaleDateString()}`);
  }

  // =========================================
  // RÉSUMÉ FINAL
  // =========================================
  
  console.log("\n" + "=".repeat(70));
  console.log(" INTERACTION TERMINÉE");
  console.log("=".repeat(70));
  
  console.log("\n RÉSUMÉ :");
  console.log(`    Capteurs autorisés : ${authorizedSensors.length}`);
  console.log(`    Inspections enregistrées : ${totalInspections}`);
  console.log(`    Protection Sybil : ACTIVE (PoA + PKI)`);
  console.log(`    Protection MITM : ACTIVE (Signature ECDSA)`);
  console.log(`    Protection Replay : ACTIVE (Nonce + Timestamp)`);
  
  console.log("\n" + "=".repeat(70));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n ERREUR :");
    console.error(error);
    process.exit(1);
  });