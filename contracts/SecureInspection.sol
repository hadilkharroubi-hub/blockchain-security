// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title SecureInspection
 * @dev Smart contract pour démonstration des protections contre les 3 attaques
 * 
 * Attaques protégées :
 * 1. Sybil Attack → PoA (Proof of Authority) + PKI
 * 2. MITM / Data Tampering → Signature ECDSA
 * 3. Replay Attack → Nonce + Timestamp
 */
contract SecureInspection {
    
    // ========================================
    // STRUCTURES
    // ========================================
    
    struct Inspection {
        uint256 id;
        address sensor;
        string buildingId;
        string location;
        uint8 severity;          // 1-10
        uint256 timestamp;
        uint256 nonce;
        bytes signature;
        bool verified;
    }
    
    struct AuthorizedSensor {
        bool isAuthorized;
        uint256 reputation;      // 0-100
        uint256 certificateExpiry;
        string publicKey;        // PKI
        uint256 validInspections;
        uint256 totalInspections;
    }
    
    // ========================================
    // ÉTAT
    // ========================================
    
    address public owner;
    
    mapping(uint256 => Inspection) public inspections;
    uint256 public inspectionCount;
    
    // Protection Sybil : Seuls capteurs autorisés
    mapping(address => AuthorizedSensor) public authorizedSensors;
    address[] public sensorList;
    
    // Protection Replay : Nonce tracking
    mapping(address => uint256) public nonces;
    
    // Fenêtre temporelle : ±30 secondes
    uint256 public constant TIME_WINDOW = 30;
    
    // Réputation minimale requise
    uint256 public constant MIN_REPUTATION = 50;
    
    // ========================================
    // ÉVÉNEMENTS
    // ========================================
    
    event InspectionRecorded(
        uint256 indexed id,
        address indexed sensor,
        string buildingId,
        uint8 severity
    );
    
    event SensorAuthorized(
        address indexed sensor,
        string publicKey
    );
    
    event SensorRevoked(
        address indexed sensor,
        string reason
    );
    
    event AttackDetected(
        string attackType,
        address indexed attacker,
        string details
    );
    
    event ReputationUpdated(
        address indexed sensor,
        uint256 newReputation
    );
    
    // ========================================
    // MODIFICATEURS
    // ========================================
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }
    
    modifier onlyAuthorizedSensor() {
        require(
            authorizedSensors[msg.sender].isAuthorized,
            "SYBIL PROTECTION: Sensor not authorized"
        );
        require(
            authorizedSensors[msg.sender].certificateExpiry > block.timestamp,
            "SYBIL PROTECTION: Certificate expired"
        );
        require(
            authorizedSensors[msg.sender].reputation >= MIN_REPUTATION,
            "SYBIL PROTECTION: Reputation too low"
        );
        _;
    }
    
    // ========================================
    // CONSTRUCTEUR
    // ========================================
    
    constructor() {
        owner = msg.sender;
    }
    
    // ========================================
    // PROTECTION SYBIL ATTACK
    // ========================================
    
    /**
     * @dev Autorise un capteur (PKI - Infrastructure à Clé Publique)
     * Implémente la protection Proof of Authority (PoA)
     */
    function authorizeSensor(
        address _sensor,
        string memory _publicKey,
        uint256 _validityDays
    ) public onlyOwner {
        require(!authorizedSensors[_sensor].isAuthorized, "Already authorized");
        require(_validityDays > 0 && _validityDays <= 365, "Invalid validity");
        
        authorizedSensors[_sensor] = AuthorizedSensor({
            isAuthorized: true,
            reputation: 50,
            certificateExpiry: block.timestamp + (_validityDays * 1 days),
            publicKey: _publicKey,
            validInspections: 0,
            totalInspections: 0
        });
        
        sensorList.push(_sensor);
        
        emit SensorAuthorized(_sensor, _publicKey);
    }
    
    /**
     * @dev Révoque un capteur compromis
     */
    function revokeSensor(address _sensor, string memory _reason) 
        public 
        onlyOwner 
    {
        require(authorizedSensors[_sensor].isAuthorized, "Not authorized");
        authorizedSensors[_sensor].isAuthorized = false;
        
        emit SensorRevoked(_sensor, _reason);
    }
    
    /**
     * @dev Système de réputation
     */
    function updateReputation(address _sensor, bool _isValid) internal {
        AuthorizedSensor storage sensor = authorizedSensors[_sensor];
        sensor.totalInspections++;
        
        if (_isValid) {
            sensor.validInspections++;
            // Augmenter réputation (max 100)
            if (sensor.reputation < 100) {
                sensor.reputation = (sensor.reputation * 9 + 100) / 10;
            }
        } else {
            // Diminuer réputation
            if (sensor.reputation > 20) {
                sensor.reputation = (sensor.reputation * 9) / 10;
            }
        }
        
        emit ReputationUpdated(_sensor, sensor.reputation);
    }
    
    /**
     * @dev Liste tous les capteurs autorisés
     */
    function getAuthorizedSensors() public view returns (address[] memory) {
        return sensorList;
    }
    
    /**
     * @dev Info d'un capteur
     */
    function getSensorInfo(address _sensor) public view returns (
        bool isAuthorized,
        uint256 reputation,
        uint256 certificateExpiry,
        string memory publicKey
    ) {
        AuthorizedSensor memory sensor = authorizedSensors[_sensor];
        return (
            sensor.isAuthorized,
            sensor.reputation,
            sensor.certificateExpiry,
            sensor.publicKey
        );
    }
    
    // ========================================
    // PROTECTION MITM : SIGNATURE ECDSA
    // ========================================
    
    /**
     * @dev Vérifie la signature ECDSA
     */
    function verifySignature(
        bytes32 _messageHash,
        bytes memory _signature,
        address _signer
    ) public pure returns (bool) {
        bytes32 ethSignedMessageHash = getEthSignedMessageHash(_messageHash);
        return recoverSigner(ethSignedMessageHash, _signature) == _signer;
    }
    
    function getEthSignedMessageHash(bytes32 _messageHash) 
        public 
        pure 
        returns (bytes32) 
    {
        return keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", _messageHash)
        );
    }
    
    function recoverSigner(
        bytes32 _ethSignedMessageHash, 
        bytes memory _signature
    )
        public
        pure
        returns (address)
    {
        (bytes32 r, bytes32 s, uint8 v) = splitSignature(_signature);
        return ecrecover(_ethSignedMessageHash, v, r, s);
    }
    
    function splitSignature(bytes memory sig)
        public
        pure
        returns (bytes32 r, bytes32 s, uint8 v)
    {
        require(sig.length == 65, "Invalid signature length");
        
        assembly {
            r := mload(add(sig, 32))
            s := mload(add(sig, 64))
            v := byte(0, mload(add(sig, 96)))
        }
    }
    
    // ========================================
    // ENREGISTREMENT SÉCURISÉ
    // ========================================
    
    /**
     * @dev Enregistre une inspection avec TOUTES les protections
     */
    function recordInspection(
        string memory _buildingId,
        string memory _location,
        uint8 _severity,
        uint256 _timestamp,
        bytes memory _signature
    ) public onlyAuthorizedSensor returns (uint256) {
        
        require(_severity >= 1 && _severity <= 10, "Invalid severity");
        
        // PROTECTION REPLAY : Vérifier nonce
        uint256 expectedNonce = nonces[msg.sender];
        
        // PROTECTION REPLAY : Vérifier timestamp (±30s)
        require(
            _timestamp >= block.timestamp - TIME_WINDOW &&
            _timestamp <= block.timestamp + TIME_WINDOW,
            "REPLAY PROTECTION: Timestamp outside window"
        );
        
        // PROTECTION MITM : Vérifier signature ECDSA
        bytes32 messageHash = keccak256(
            abi.encodePacked(
                _buildingId,
                _location,
                _severity,
                _timestamp,
                expectedNonce
            )
        );
        
        require(
            verifySignature(messageHash, _signature, msg.sender),
            "MITM PROTECTION: Invalid signature"
        );
        
        // Incrémenter nonce (anti-replay)
        nonces[msg.sender]++;
        
        // Enregistrer l'inspection
        inspectionCount++;
        
        inspections[inspectionCount] = Inspection({
            id: inspectionCount,
            sensor: msg.sender,
            buildingId: _buildingId,
            location: _location,
            severity: _severity,
            timestamp: _timestamp,
            nonce: expectedNonce,
            signature: _signature,
            verified: false
        });
        
        // Mettre à jour réputation
        updateReputation(msg.sender, true);
        
        emit InspectionRecorded(
            inspectionCount,
            msg.sender,
            _buildingId,
            _severity
        );
        
        return inspectionCount;
    }
    
    /**
     * @dev Simule une attaque Replay (pour démonstration)
     */
    function simulateReplayAttack(
        string memory _buildingId,
        string memory _location,
        uint8 _severity,
        uint256 _oldTimestamp,
        uint256 _oldNonce,
        bytes memory _oldSignature
    ) public {
        
        // Vérification signature
        bytes32 messageHash = keccak256(
            abi.encodePacked(
                _buildingId,
                _location,
                _severity,
                _oldTimestamp,
                _oldNonce
            )
        );
        
        require(
            verifySignature(messageHash, _oldSignature, msg.sender),
            "Invalid signature"
        );
        
        // Vérification nonce (ÉCHOUERA)
        require(
            _oldNonce == nonces[msg.sender],
            "REPLAY ATTACK DETECTED: Invalid nonce"
        );
        
        // Vérification timestamp (ÉCHOUERA)
        require(
            _oldTimestamp >= block.timestamp - TIME_WINDOW,
            "REPLAY ATTACK DETECTED: Timestamp too old"
        );
        
        emit AttackDetected(
            "Replay Attack", 
            msg.sender, 
            "Attempted to replay old transaction"
        );
        
        // Pénaliser la réputation
        updateReputation(msg.sender, false);
    }
    
    // ========================================
    // GETTERS
    // ========================================
    
    function getInspection(uint256 _id) 
        public 
        view 
        returns (Inspection memory) 
    {
        require(_id > 0 && _id <= inspectionCount, "Invalid ID");
        return inspections[_id];
    }
    
    function getCurrentNonce(address _sensor) 
        public 
        view 
        returns (uint256) 
    {
        return nonces[_sensor];
    }
    
    function getTotalInspections() public view returns (uint256) {
        return inspectionCount;
    }
}