import axios from "axios";

export const sendErrorToServer = async (err) => {
  axios
    .post(
      "http://localhost:5000/api/errorlogs",
      { message: err.message },
      {
        headers: {},
      }
    )
    .then((response) => {
      console.log(response);
    })
    .catch((err) => {
      console.log("error calling node backend");
      console.log("err.message: ", err.message);
    });
};

export const checkUserBalance = async (address, api) => {
  const { data: balance } = await api.query.system.account(address);
  if (balance.free.toJSON() === 0) {
    return false;
  }

  return true;
};
