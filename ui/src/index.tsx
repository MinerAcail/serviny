import { ApolloClient, InMemoryCache, ApolloLink } from "@apollo/client";
import createUploadLink from "apollo-upload-client/createUploadLink.mjs";

    export const Production = true; 
//export const Production = false;
const API_URL = Production ? "https://api.winnemart.com/query" : "http://localhost:4003/query";

// Upload link
const uploadLink = createUploadLink({
  uri: API_URL,
  credentials: "include",
});
 
// Logger link
const logLink = new ApolloLink((operation, forward) => {
  // console.log("GraphQL Request", operation);
  return forward(operation);
});

// Combine logger + upload

const link = logLink.concat(uploadLink);

const Client = new ApolloClient({
  cache: new InMemoryCache(),
  link,
});

export default Client;
