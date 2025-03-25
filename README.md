# On-Chain Activity NFT
## `.env` setup
To prevent rate-limiting of Alchemy API, you may need to create a `.env` from `packages/frontend/.env.example` and add your Alchemy API key.
## web3.storage setup
To be able to upload files to web3.storage, you'll need to create a web.storage and put in your account and space ID in `packages\nextjs\app\api\upload-to-ipfs\route.ts` 4~6 line.
```javascript
const client = await create();
await client.login('<Your Account>');
await client.setCurrentSpace('<Space ID>');
```
It'll send an authorization request to your email, you'll need to approve it to be able to upload files to web3.storage.
## Interact with Testnet
### Install Dependencies
```bash
yarn install
```
### Start Frontend
```bash
yarn start
```

## Local Development
### Install Dependencies
```bash
yarn install
```
### Start Local Hardhat Chain
```bash
yarn chain
```
### Deploy Contracts
```bash
yarn deploy
```
### Start Frontend
```bash
yarn start
```