import { SignProtocolClient, SpMode, EvmChains } from "@ethsign/sp-sdk";
import { privateKeyToAccount } from "viem/accounts";
import axios from "axios";
import { decodeAbiParameters } from "viem";

async function main() {
  const privateKey =
    "0xfc269f98567c48fb4599116344f5d411c13698f11210378ba7a903ae2c87685e"; // Alice's private key
  const client = new SignProtocolClient(SpMode.OnChain, {
    chain: EvmChains.Sepolia, // Optional, depending on environment
    account: privateKeyToAccount(privateKey), // Optional, depending on environment
  });

  async function schemagen() {
    const res = await client.createSchema({
        name: "SDK Test",
        data: [
          { name: "contractDetails", type: "string" },
          { name: "signer", type: "address" },
        ],
      });
      return res;
  }

  const customer = "0xA22926F16bDa04eb640f9168979cc535Fe5709Aa";//learning(bob)
  const attester = "0x34E85CFA140c87c10E75E22633d5FfFc4384eE07";//temp(alice)

  // const contractDetails = {
  //   schemaId: "0x90",
  //   txHash:
  //     "0xbe0a270a7fa1366442663ac69fd0d30ad4fb78a1ef8a388c6123a9168d24c23a",
  // };

  
 async function createNotaryAttestation(contractDetails, signer) {
  const res = await client.createAttestation({
    schemaId: "0x90",
    data: {
      contractDetails,
      signer
    },
    indexingValue: signer.toLowerCase()
  });
  return res;
}

// Generate a function for making requests to the Sign Protocol Indexing Service
async function makeAttestationRequest(endpoint, options) {
  const url = `https://testnet-rpc.sign.global/api/${endpoint}`;
  const res = await axios.request({
    url,
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
    },
    ...options,
  });
  // Throw API errors
  if (res.status !== 200) {
    throw new Error(JSON.stringify(res));
  }
  // Return original response
  return res.data;
}

async function queryAttestations() {
  const response = await makeAttestationRequest("index/attestations", {
    method: "GET",
    params: {
      mode: "onchain", // Data storage location
      schemaId: "onchain_evm_84532_0x9e", // Your full schema's ID
      attester: attester, // Alice's address
      indexingValue: customer.toLowerCase(), // Bob's address
    },
  });

  // Make sure the request was successfully processed.
  if (!response.success) {
    return {
      success: false,
      message: response?.message ?? "Attestation query failed.",
    };
  }

  // Return a message if no attestations are found.
  if (response.data?.total === 0) {
    return {
      success: false,
      message: "No attestation for this address found.",
    };
  }

  // Return all attestations that match our query.
  return {
    success: true,
    attestations: response.data.rows,
  };
}
  const contractDetails ={
    schemaId: '0x9e',
    txHash: '0xf60c50345929f85c55ccff15798b539867f2fcc2c9f201b523e5c04939f4b97b'
  }
  console.log(contractDetails);
  const attestation = {
    attestationId: '0x152',
    txHash: '0x1668726143b25982461308e262663acdb466e737c1f1228b4662c1f1669cd9e3',
    indexingValue: '0x34e85cfa140c87c10e75e22633d5fffc4384ee07'
  }
  const res = await queryAttestations(); //what is my full schema id i dont know
  console.log(res);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.log(error);
    process.exit(1);
  });
