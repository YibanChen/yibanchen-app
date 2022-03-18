import axios from "axios";

let domain;
if (process.env.NODE_ENV === "development") {
  //domain = "http://localhost:5000";
  domain = "https://devapi.yibanchen.com";
} else {
  domain = "https://devapi.yibanchen.com";
}

export const postSite = async (data) => {
  let res;
  await axios
    .post(`${domain}/api/Sites`, data, {
      headers: {},
    })
    .then((response) => {
      res = response.data;
    })
    .catch((err) => {
      throw Error("Node error");
    });

  return res;
};

export const putSite = async (uuid, data) => {
  let res;
  console.log(`uuid: ${uuid}`);
  await axios
    .put(`${domain}/api/Sites/${uuid}`, data, {
      headers: {},
    })
    .then((response) => {
      res = response.data;
    })
    .catch((err) => {
      throw Error("Node error");
    });

  return res;
};

export const putSiteFromIndex = async (uuid, data) => {
  let res;
  console.log(`uuid: ${uuid}`);
  console.log(`data: ${data}`);
  await axios
    .post(`${domain}/api/Sites/fromindex/${uuid}`, data, {
      headers: {},
    })
    .then((response) => {
      res = response.data;
    })
    .catch((err) => {
      throw Error("Node error");
    });

  return res;
};

export const deleteSite = async (uuid, data) => {
  let res;
  console.log(`uuid: ${uuid}`);
  await axios
    .delete(`${domain}/api/Sites/${uuid}`, data, {
      headers: {},
    })
    .then((response) => {
      res = response.data;
    })
    .catch((err) => {
      throw Error("Node error");
    });

  return res;
};

export const deleteSiteFromIndex = async (siteIndex, data) => {
  let res;
  await axios
    .delete(`${domain}/api/Sites/fromindex/${siteIndex}`, data, {
      headers: {},
    })
    .then((response) => {
      res = response.data;
    })
    .catch((err) => {
      throw Error("Node error");
    });

  return res;
};
