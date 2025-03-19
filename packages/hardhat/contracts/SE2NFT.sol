// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";

contract SE2NFT is ERC721Enumerable {
    uint256 public tokenIdCounter;
    mapping(uint256 tokenId => string) public tokenURIs;

    constructor() ERC721("ActivityNFT", "ACTNFT") {}

    function mintItem(address to, string calldata uri) public returns (uint256) {
        tokenIdCounter++;
        _safeMint(to, tokenIdCounter);

        tokenURIs[tokenIdCounter] = uri;
        return tokenIdCounter;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        return tokenURIs[tokenId];
    }
}
