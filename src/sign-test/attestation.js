import axios from "axios";
import { decodeAbiParameters } from "viem";


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
      schemaId: "onchain_evm_84532_0x34", // Your full schema's ID
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
function findAttestation(message, attestations) {
  // Iterate through the list of attestations
  for (const att of attestations) {
    if (!att.data) continue;

    let parsedData = {};
    
    // Parse the data.
    if (att.mode === "onchain") {
      // Looking for nested items in the on-chain schema
      try {
        const data = decodeAbiParameters(
          [att.dataLocation === "onchain" ? { components: att.schema.data, type: "tuple" } : { type: "string" }],
          att.data
        );
        parsedData = data[0];
      } catch (error) {
        // Looking for a regular schema format if the nested parse fails
        try {
          const data = decodeAbiParameters(
            att.dataLocation === "onchain" ? att.schema.data : [{ type: "string" }],
            att.data
          );
          const obj = {};
          data.forEach((item, i) => {
            obj[att.schema.data[i].name] = item;
          });
          parsedData = obj;
        } catch (error) {
          continue;
        }
      }
    } else {
      // Try parsing as a string (off-chain attestation)
      try {
        parsedData = JSON.parse(att.data);
      } catch (error) {
        console.log(error);
        continue;
      }
    }
    
    // Return the correct attestation and its parsed data.
    if(parsedData?.contractDetails === message) {
      return { parsedData, attestation: att };
    }
  }
  
  // Did not find the attestation we are looking for.
  return undefined;
}

export { createNotaryAttestation, makeAttestationRequest, queryAttestations, findAttestation };