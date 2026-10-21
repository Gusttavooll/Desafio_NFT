// SPDX-License-Identifier: MIT
pragma solidity 0.8.37;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {MerkleProof} from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @notice Three approved Pi artworks, each occupying 12,288 exclusive digits.
/// @dev The manifest commits to verified off-chain inputs. This contract does not
///      calculate Pi, prove AI behavior, prevent copying images, or handle sales.
contract KronosPiGenesis is ERC721, Ownable2Step, ReentrancyGuard {
    uint256 public constant MAX_SUPPLY = 3;
    uint256 public constant DIGIT_COUNT = 90_000;
    uint256 public constant INTERVAL_LENGTH = 12_288;

    bytes32 public immutable manifestRoot;
    bytes32 public immutable piDatasetHash;
    uint256 public totalSupply;

    struct Provenance {
        bytes32 digitsHash;
        bytes32 imageHash;
    }

    mapping(uint256 => Provenance) public provenance;
    mapping(bytes32 => bool) public imageUsed;
    mapping(uint256 => string) private _tokenURIs;
    uint256[] private _starts;

    error InvalidCommitment();
    error InvalidInterval();
    error InvalidMetadataURI();
    error UnapprovedArtwork();
    error SupplyExhausted();
    error IntervalOccupied();
    error ArtworkAlreadyUsed();

    event PiArtworkMinted(
        uint256 indexed tokenId,
        address indexed recipient,
        uint256 endExclusive,
        bytes32 digitsHash,
        bytes32 imageHash,
        string metadataURI
    );

    constructor(address initialOwner, bytes32 approvedManifest, bytes32 datasetHash)
        ERC721("Kronos Pi Genesis", "KPI")
        Ownable(initialOwner)
    {
        if (approvedManifest == bytes32(0) || datasetHash == bytes32(0)) revert InvalidCommitment();
        manifestRoot = approvedManifest;
        piDatasetHash = datasetHash;
    }

    /// @notice Mint an approved entry to a recipient. The starting coordinate is
    ///         also the token ID. Entries and URIs cannot be changed after mint.
    function mint(
        address recipient,
        uint256 start,
        bytes32 digitsHash,
        bytes32 imageHash,
        string calldata metadataURI,
        bytes32[] calldata proof
    ) external onlyOwner nonReentrant {
        if (totalSupply >= MAX_SUPPLY) revert SupplyExhausted();
        if (start == 0 || start > DIGIT_COUNT - INTERVAL_LENGTH + 1) revert InvalidInterval();
        if (digitsHash == bytes32(0) || imageHash == bytes32(0)) revert InvalidCommitment();
        if (bytes(metadataURI).length <= 7 || bytes7(bytes(metadataURI)) != bytes7("ipfs://")) {
            revert InvalidMetadataURI();
        }

        // StandardMerkleTree double-hashed leaf, with the exact same ABI types.
        bytes32 leaf = keccak256(bytes.concat(keccak256(abi.encode(start, digitsHash, imageHash, metadataURI))));
        if (!MerkleProof.verifyCalldata(proof, manifestRoot, leaf)) revert UnapprovedArtwork();
        if (imageUsed[imageHash]) revert ArtworkAlreadyUsed();

        uint256 endExclusive = start + INTERVAL_LENGTH;
        for (uint256 i = 0; i < _starts.length; ++i) {
            uint256 otherStart = _starts[i];
            if (start < otherStart + INTERVAL_LENGTH && otherStart < endExclusive) revert IntervalOccupied();
        }

        // Commit all state before the receiver callback. A rejected callback
        // reverts the entire operation, including availability and supply.
        _starts.push(start);
        imageUsed[imageHash] = true;
        provenance[start] = Provenance(digitsHash, imageHash);
        _tokenURIs[start] = metadataURI;
        totalSupply += 1;
        _safeMint(recipient, start);
        emit PiArtworkMinted(start, recipient, endExclusive, digitsHash, imageHash, metadataURI);
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        return _tokenURIs[tokenId];
    }

    function occupiedStarts() external view returns (uint256[] memory) {
        return _starts;
    }
}
