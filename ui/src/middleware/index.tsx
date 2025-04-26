import { ApolloClient, InMemoryCache } from "@apollo/client";
import createUploadLink from "apollo-upload-client/createUploadLink.mjs";
// import { Production } from "../../v";
const Production = false;
const API_URL = Production ? "https://api.serviny.com/query" : "http://localhost:4003/query";
const link = createUploadLink({
  uri: API_URL,
  // uri: "http://localhost:4003/query",
  credentials: "include",
});
// "http://16.16.208.207:4003/query"

// console.log("API_URL",  window.location.hostname);
// .console(API_URL);
const Client = new ApolloClient({
  cache: new InMemoryCache(),
  link,
  // ssrForceFetchDelay: 100 // Prevents refetching after hydration
});

export default Client;
