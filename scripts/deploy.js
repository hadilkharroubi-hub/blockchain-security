const hre = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("=".repeat(70));
  console.log("DÉPLOIEMENT DU SMART CONTRACT SÉCURISÉ");
  console.log("=".repeat(70));

  // Récupérer le compte déployeur
  const [deployer] = await hre.ethers.getSigners();
  
  console.log("\n Informations de déploiement :");
  console.log(`   Compte déployeur : ${deployer.address}`);
  
  // Récupérer le solde
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log(`   Solde : ${hre.ethers.formatEther(balance)} ETH`);
  console.log(`   Réseau : ${hre.network.name}`);

  // Récupérer le contrat
  console.log("\n Compilation du contrat...");
  const SecureInspection = await hre.ethers.getContractFactory("SecureInspection");
  
  // Déployer
  console.log("\n Déploiement en cours...");
  const contract = await SecureInspection.deploy();
  
  await contract.waitForDeployment();
  
  const contractAddress = await contract.getAddress();
  
  console.log("\n Déploiement réussi !");
  console.log("=".repeat(70));
  console.log(` Adresse du contrat : ${contractAddress}`);
  console.log(` Réseau : ${hre.network.name}`);
  console.log(` Timestamp : ${new Date().toISOString()}`);
  console.log("=".repeat(70));

  // Informations initiales
  console.log("\n État initial du contrat :");
  const owner = await contract.owner();
  const totalInspections = await contract.getTotalInspections();
  
  console.log(`   Propriétaire : ${owner}`);
  console.log(`   Inspections : ${totalInspections}`);
  console.log(`   Fenêtre temporelle : ${await contract.TIME_WINDOW()} secondes`);
  console.log(`   Réputation minimale : ${await contract.MIN_REPUTATION()}`);

  // Sauvegarder les informations de déploiement
  const deploymentInfo = {
    network: hre.network.name,
    contractName: "SecureInspection",
    contractAddress: contractAddress,
    deployerAddress: deployer.address,
    deploymentTime: new Date().toISOString(),
    blockNumber: await hre.ethers.provider.getBlockNumber(),
    chainId: (await hre.ethers.provider.getNetwork()).chainId.toString()
  };
  
  const filePath = "./deployment-info.json";
  fs.writeFileSync(
    filePath,
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  console.log(`\n Informations sauvegardées dans : ${filePath}`);

}

// Gestion des erreurs
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n ERREUR DE DÉPLOIEMENT :");
    console.error(error);
    process.exit(1);
  });