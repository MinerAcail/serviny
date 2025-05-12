import { ApolloClient, InMemoryCache, ApolloLink } from "@apollo/client";
import createUploadLink from "apollo-upload-client/createUploadLink.mjs";

const Production = true;
// const Production = false;
// const API_URL = Production ? "https://api.serviny.com/query" : "http://localhost:4003/query";
const API_URL = Production ? "http://16.16.193.100:4003/query" : "http://localhost:4003/query";

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
