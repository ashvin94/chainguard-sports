// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract SportsMediaRegistry {
    struct MediaNFT {
        uint256 tokenId;
        address owner;
        string sha256Hash;
        string contentCID;
        string fileName;
        string fileType;
        string description;
        uint256 timestamp;
        bool isActive;
    }

    uint256 private _tokenCounter;
    mapping(uint256 => MediaNFT) public nfts;
    mapping(string => uint256) public hashToTokenId;
    mapping(address => uint256[]) public ownerTokens;

    event NFTMinted(
        uint256 indexed tokenId,
        address indexed owner,
        string sha256Hash,
        string contentCID
    );

    constructor() {
        _tokenCounter = 0;
    }

    function mintNFT(
        string memory _sha256Hash,
        string memory _contentCID,
        string memory _fileName,
        string memory _fileType,
        string memory _description
    ) public returns (uint256) {
        require(hashToTokenId[_sha256Hash] == 0, "Content already registered!");

        _tokenCounter++;
        uint256 newTokenId = _tokenCounter;

        nfts[newTokenId] = MediaNFT({
            tokenId: newTokenId,
            owner: msg.sender,
            sha256Hash: _sha256Hash,
            contentCID: _contentCID,
            fileName: _fileName,
            fileType: _fileType,
            description: _description,
            timestamp: block.timestamp,
            isActive: true
        });

        hashToTokenId[_sha256Hash] = newTokenId;
        ownerTokens[msg.sender].push(newTokenId);
        emit NFTMinted(newTokenId, msg.sender, _sha256Hash, _contentCID);
        return newTokenId;
    }

    function getNFT(uint256 _tokenId) public view returns (MediaNFT memory) {
        return nfts[_tokenId];
    }

    function getMyNFTs() public view returns (uint256[] memory) {
        return ownerTokens[msg.sender];
    }

    function getTotalNFTs() public view returns (uint256) {
        return _tokenCounter;
    }
}
