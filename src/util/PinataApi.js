import axios from "axios";

export const postNoteWithCustomKey = async (
  data,
  pinataApiKey,
  pinataSecretApiKey
) => {
  let res;
  const url = `https://api.pinata.cloud/pinning/pinJSONToIPFS`;
  await axios
    .post(url, data, {
      headers: {
        pinata_api_key: pinataApiKey,
        pinata_secret_api_key: pinataSecretApiKey,
      },
    })
    .then((response) => {
      res = response.data;
    })
    .catch((err) => {
      throw Error("Node error");
    });
  return res;
};
