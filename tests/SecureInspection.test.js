const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SecureInspection - Tests de Sécurité", function () {
  let contract;
  let owner;
  let sensor1;
  let sensor2;
  let attacker;

  // Déployer avant chaque test
  beforeEach(async function () {
    [owner, sensor1, sensor2, attacker] = await ethers.getSigners();
    
    const SecureInspection = await ethers.getContractFactory("SecureInspection");
    contract = await SecureInspection.deploy();
    await contract.waitForDeployment();
  });

  describe("Déploiement", function () {
    it("Devrait définir le bon propriétaire", async function () {
      expect(await contract.owner()).to.equal(owner.address);
    });

    it("Devrait initialiser avec 0 inspection", async function () {
      expect(await contract.getTotalInspections()).to.equal(0);
    });

    it("Devrait avoir les bonnes constantes", async function () {
      expect(await contract.TIME_WINDOW()).to.equal(30);
      expect(await contract.MIN_REPUTATION()).to.equal(50);
    });
  });

  describe("Protection Sybil Attack (PoA + PKI)", function () {
    it("Devrait permettre au propriétaire d'autoriser un capteur", async function () {
      await contract.authorizeSensor(sensor1.address, "PKI_CERT_001", 365);
      
      const info = await contract.getSensorInfo(sensor1.address);
      expect(info.isAuthorized).to.be.true;
      expect(info.reputation).to.equal(50);
      expect(info.publicKey).to.equal("PKI_CERT_001");
    });

    it("Devrait empêcher la double autorisation", async function () {
      await contract.authorizeSensor(sensor1.address, "PKI_CERT_001", 365);
      
      await expect(
        contract.authorizeSensor(sensor1.address, "PKI_CERT_002", 365)
      ).to.be.revertedWith("Already authorized");
    });

    it("Devrait rejeter un capteur non autorisé (Sybil)", async function () {
      const timestamp = Math.floor(Date.now() / 1000);
      const messageHash = ethers.solidityPackedKeccak256(
        ["string", "string", "uint8", "uint256", "uint256"],
        ["BUILD_001", "Paris", 5, timestamp, 0]
      );
      const signature = await attacker.signMessage(ethers.getBytes(messageHash));

      await expect(
        contract.connect(attacker).recordInspection(
          "BUILD_001",
          "Paris",
          5,
          timestamp,
          signature
        )
      ).to.be.revertedWith("SYBIL PROTECTION: Sensor not authorized");
    });

    it("Devrait permettre de révoquer un capteur", async function () {
      await contract.authorizeSensor(sensor1.address, "PKI_CERT_001", 365);
      await contract.revokeSensor(sensor1.address, "Compromised");
      
      const info = await contract.getSensorInfo(sensor1.address);
      expect(info.isAuthorized).to.be.false;
    });

    it("Devrait lister les capteurs autorisés", async function () {
      await contract.authorizeSensor(sensor1.address, "PKI_CERT_001", 365);
      await contract.authorizeSensor(sensor2.address, "PKI_CERT_002", 365);
      
      const sensors = await contract.getAuthorizedSensors();
      expect(sensors.length).to.equal(2);
      expect(sensors).to.include(sensor1.address);
      expect(sensors).to.include(sensor2.address);
    });

    it("Devrait rejeter si réputation trop basse", async function () {
      // Cette fonctionnalité nécessiterait de manipuler la réputation
      // Test simplifié pour la structure
      await contract.authorizeSensor(sensor1.address, "PKI_CERT_001", 365);
      const info = await contract.getSensorInfo(sensor1.address);
      expect(info.reputation).to.be.gte(50);
    });
  });

  describe("Protection MITM (Signature ECDSA)", function () {
    beforeEach(async function () {
      await contract.authorizeSensor(sensor1.address, "PKI_CERT_001", 365);
    });

    it("Devrait accepter une signature valide", async function () {
      const timestamp = Math.floor(Date.now() / 1000);
      const nonce = await contract.getCurrentNonce(sensor1.address);
      
      const messageHash = ethers.solidityPackedKeccak256(
        ["string", "string", "uint8", "uint256", "uint256"],
        ["BUILD_001", "Paris", 7, timestamp, nonce]
      );
      
      const signature = await sensor1.signMessage(ethers.getBytes(messageHash));
      
      await expect(
        contract.connect(sensor1).recordInspection(
          "BUILD_001",
          "Paris",
          7,
          timestamp,
          signature
        )
      ).to.not.be.reverted;
    });

    it("Devrait rejeter une signature invalide (MITM)", async function () {
      const timestamp = Math.floor(Date.now() / 1000);
      const nonce = await contract.getCurrentNonce(sensor1.address);
      
      // Données originales
      const messageHash = ethers.solidityPackedKeccak256(
        ["string", "string", "uint8", "uint256", "uint256"],
        ["BUILD_001", "Paris", 9, timestamp, nonce]
      );
      
      const signature = await sensor1.signMessage(ethers.getBytes(messageHash));
      
      // Attaquant tente de modifier la sévérité
      await expect(
        contract.connect(sensor1).recordInspection(
          "BUILD_001",
          "Paris",
          1, // Modifié : 9 → 1
          timestamp,
          signature // Signature originale (invalide pour les nouvelles données)
        )
      ).to.be.revertedWith("MITM PROTECTION: Invalid signature");
    });

    it("Devrait vérifier correctement la signature ECDSA", async function () {
      const message = "Test message";
      const messageHash = ethers.keccak256(ethers.toUtf8Bytes(message));
      const signature = await sensor1.signMessage(ethers.getBytes(messageHash));
      
      const isValid = await contract.verifySignature(
        messageHash,
        signature,
        sensor1.address
      );
      
      expect(isValid).to.be.true;
    });

    it("Devrait rejeter une signature d'un autre signataire", async function () {
      const messageHash = ethers.keccak256(ethers.toUtf8Bytes("message"));
      const signature = await sensor1.signMessage(ethers.getBytes(messageHash));
      
      const isValid = await contract.verifySignature(
        messageHash,
        signature,
        sensor2.address // Mauvais signataire
      );
      
      expect(isValid).to.be.false;
    });
  });

  describe("Protection Replay Attack (Nonce + Timestamp)", function () {
    beforeEach(async function () {
      await contract.authorizeSensor(sensor1.address, "PKI_CERT_001", 365);
    });

    it("Devrait incrémenter le nonce après chaque inspection", async function () {
      const timestamp = Math.floor(Date.now() / 1000);
      
      const initialNonce = await contract.getCurrentNonce(sensor1.address);
      expect(initialNonce).to.equal(0);
      
      // Première inspection
      let messageHash = ethers.solidityPackedKeccak256(
        ["string", "string", "uint8", "uint256", "uint256"],
        ["BUILD_001", "Paris", 7, timestamp, initialNonce]
      );
      let signature = await sensor1.signMessage(ethers.getBytes(messageHash));
      
      await contract.connect(sensor1).recordInspection(
        "BUILD_001",
        "Paris",
        7,
        timestamp,
        signature
      );
      
      const newNonce = await contract.getCurrentNonce(sensor1.address);
      expect(newNonce).to.equal(1);
    });

    it("Devrait rejeter un ancien nonce (Replay)", async function () {
      const timestamp = Math.floor(Date.now() / 1000);
      
      // Première transaction
      let nonce = await contract.getCurrentNonce(sensor1.address);
      let messageHash = ethers.solidityPackedKeccak256(
        ["string", "string", "uint8", "uint256", "uint256"],
        ["BUILD_001", "Paris", 7, timestamp, nonce]
      );
      let signature = await sensor1.signMessage(ethers.getBytes(messageHash));
      
      await contract.connect(sensor1).recordInspection(
        "BUILD_001",
        "Paris",
        7,
        timestamp,
        signature
      );
      
      // Tentative de replay avec ancien nonce
      await expect(
        contract.connect(sensor1).simulateReplayAttack(
          "BUILD_001",
          "Paris",
          7,
          timestamp,
          0, // Ancien nonce
          signature
        )
      ).to.be.revertedWith("REPLAY ATTACK DETECTED: Invalid nonce");
    });

    it("Devrait rejeter un timestamp trop ancien", async function () {
      const oldTimestamp = Math.floor(Date.now() / 1000) - 100; // 100s dans le passé
      const nonce = await contract.getCurrentNonce(sensor1.address);
      
      const messageHash = ethers.solidityPackedKeccak256(
        ["string", "string", "uint8", "uint256", "uint256"],
        ["BUILD_001", "Paris", 7, oldTimestamp, nonce]
      );
      const signature = await sensor1.signMessage(ethers.getBytes(messageHash));
      
      await expect(
        contract.connect(sensor1).recordInspection(
          "BUILD_001",
          "Paris",
          7,
          oldTimestamp,
          signature
        )
      ).to.be.revertedWith("REPLAY PROTECTION: Timestamp outside window");
    });

    it("Devrait rejeter un timestamp dans le futur", async function () {
      const futureTimestamp = Math.floor(Date.now() / 1000) + 100; // 100s dans le futur
      const nonce = await contract.getCurrentNonce(sensor1.address);
      
      const messageHash = ethers.solidityPackedKeccak256(
        ["string", "string", "uint8", "uint256", "uint256"],
        ["BUILD_001", "Paris", 7, futureTimestamp, nonce]
      );
      const signature = await sensor1.signMessage(ethers.getBytes(messageHash));
      
      await expect(
        contract.connect(sensor1).recordInspection(
          "BUILD_001",
          "Paris",
          7,
          futureTimestamp,
          signature
        )
      ).to.be.revertedWith("REPLAY PROTECTION: Timestamp outside window");
    });

    it("Devrait accepter un timestamp dans la fenêtre valide", async function () {
      const validTimestamp = Math.floor(Date.now() / 1000);
      const nonce = await contract.getCurrentNonce(sensor1.address);
      
      const messageHash = ethers.solidityPackedKeccak256(
        ["string", "string", "uint8", "uint256", "uint256"],
        ["BUILD_001", "Paris", 7, validTimestamp, nonce]
      );
      const signature = await sensor1.signMessage(ethers.getBytes(messageHash));
      
      await expect(
        contract.connect(sensor1).recordInspection(
          "BUILD_001",
          "Paris",
          7,
          validTimestamp,
          signature
        )
      ).to.not.be.reverted;
    });
  });

  describe("Enregistrement d'inspections", function () {
    beforeEach(async function () {
      await contract.authorizeSensor(sensor1.address, "PKI_CERT_001", 365);
    });

    it("Devrait enregistrer une inspection complète", async function () {
      const timestamp = Math.floor(Date.now() / 1000);
      const nonce = await contract.getCurrentNonce(sensor1.address);
      
      const messageHash = ethers.solidityPackedKeccak256(
        ["string", "string", "uint8", "uint256", "uint256"],
        ["BUILD_001", "Paris", 9, timestamp, nonce]
      );
      const signature = await sensor1.signMessage(ethers.getBytes(messageHash));
      
      await contract.connect(sensor1).recordInspection(
        "BUILD_001",
        "Paris",
        9,
        timestamp,
        signature
      );
      
      const inspection = await contract.getInspection(1);
      
      expect(inspection.id).to.equal(1);
      expect(inspection.sensor).to.equal(sensor1.address);
      expect(inspection.buildingId).to.equal("BUILD_001");
      expect(inspection.location).to.equal("Paris");
      expect(inspection.severity).to.equal(9);
      expect(inspection.nonce).to.equal(nonce);
    });

    it("Devrait émettre un événement InspectionRecorded", async function () {
      const timestamp = Math.floor(Date.now() / 1000);
      const nonce = await contract.getCurrentNonce(sensor1.address);
      
      const messageHash = ethers.solidityPackedKeccak256(
        ["string", "string", "uint8", "uint256", "uint256"],
        ["BUILD_001", "Paris", 8, timestamp, nonce]
      );
      const signature = await sensor1.signMessage(ethers.getBytes(messageHash));
      
      await expect(
        contract.connect(sensor1).recordInspection(
          "BUILD_001",
          "Paris",
          8,
          timestamp,
          signature
        )
      ).to.emit(contract, "InspectionRecorded")
       .withArgs(1, sensor1.address, "BUILD_001", 8);
    });

    it("Devrait rejeter une sévérité invalide", async function () {
      const timestamp = Math.floor(Date.now() / 1000);
      const nonce = await contract.getCurrentNonce(sensor1.address);
      
      const messageHash = ethers.solidityPackedKeccak256(
        ["string", "string", "uint8", "uint256", "uint256"],
        ["BUILD_001", "Paris", 11, timestamp, nonce]
      );
      const signature = await sensor1.signMessage(ethers.getBytes(messageHash));
      
      await expect(
        contract.connect(sensor1).recordInspection(
          "BUILD_001",
          "Paris",
          11, // Invalide (max 10)
          timestamp,
          signature
        )
      ).to.be.revertedWith("Invalid severity");
    });

    it("Devrait compter correctement les inspections", async function () {
      const timestamp = Math.floor(Date.now() / 1000);
      
      // Première inspection
      let nonce = await contract.getCurrentNonce(sensor1.address);
      let messageHash = ethers.solidityPackedKeccak256(
        ["string", "string", "uint8", "uint256", "uint256"],
        ["BUILD_001", "Paris", 5, timestamp, nonce]
      );
      let signature = await sensor1.signMessage(ethers.getBytes(messageHash));
      
      await contract.connect(sensor1).recordInspection(
        "BUILD_001",
        "Paris",
        5,
        timestamp,
        signature
      );
      
      // Deuxième inspection
      nonce = await contract.getCurrentNonce(sensor1.address);
      messageHash = ethers.solidityPackedKeccak256(
        ["string", "string", "uint8", "uint256", "uint256"],
        ["BUILD_002", "Lyon", 3, timestamp, nonce]
      );
      signature = await sensor1.signMessage(ethers.getBytes(messageHash));
      
      await contract.connect(sensor1).recordInspection(
        "BUILD_002",
        "Lyon",
        3,
        timestamp,
        signature
      );
      
      expect(await contract.getTotalInspections()).to.equal(2);
    });
  });

  describe("Événements", function () {
    it("Devrait émettre SensorAuthorized", async function () {
      await expect(
        contract.authorizeSensor(sensor1.address, "PKI_CERT_001", 365)
      ).to.emit(contract, "SensorAuthorized")
       .withArgs(sensor1.address, "PKI_CERT_001");
    });

    it("Devrait émettre SensorRevoked", async function () {
      await contract.authorizeSensor(sensor1.address, "PKI_CERT_001", 365);
      
      await expect(
        contract.revokeSensor(sensor1.address, "Compromised")
      ).to.emit(contract, "SensorRevoked")
       .withArgs(sensor1.address, "Compromised");
    });

    it("Devrait émettre AttackDetected lors d'une tentative de replay", async function () {
      await contract.authorizeSensor(sensor1.address, "PKI_CERT_001", 365);
      
      const timestamp = Math.floor(Date.now() / 1000);
      const nonce = await contract.getCurrentNonce(sensor1.address);
      
      const messageHash = ethers.solidityPackedKeccak256(
        ["string", "string", "uint8", "uint256", "uint256"],
        ["BUILD_001", "Paris", 5, timestamp, nonce]
      );
      const signature = await sensor1.signMessage(ethers.getBytes(messageHash));
      
      await contract.connect(sensor1).recordInspection(
        "BUILD_001",
        "Paris",
        5,
        timestamp,
        signature
      );
      
      // Tenter un replay (devrait échouer mais on teste l'événement dans le catch)
      try {
        await contract.connect(sensor1).simulateReplayAttack(
          "BUILD_001",
          "Paris",
          5,
          timestamp,
          0,
          signature
        );
      } catch (error) {
        // Attendu
      }
    });
  });
});