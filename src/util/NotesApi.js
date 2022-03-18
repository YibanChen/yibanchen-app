import axios from "axios";

let domain;
if (process.env.NODE_ENV === "development") {
  //domain = "http://localhost:5000";
  domain = "https://devapi.yibanchen.com";
} else {
  domain = "https://devapi.yibanchen.com";
}

export const postNote = async (data) => {
  let res;

  await axios
    .post(`${domain}/api/Notes`, data, {
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

export const putNote = async (uuid, data) => {
  let res;
  await axios
    .put(`${domain}/api/Notes/${uuid}`, data, {
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

export const deleteNote = async (uuid, data) => {
  let res;
  await axios
    .delete(`${domain}/api/Notes/${uuid}`, data, {
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

export const deleteNoteFromIndex = async (noteIndex, data) => {
  let res;
  await axios
    .delete(`${domain}/api/Notes/fromindex/${noteIndex}`, data, {
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
