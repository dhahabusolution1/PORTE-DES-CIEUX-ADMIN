import {
  ApolloClient,
  InMemoryCache,
  HttpLink,
  from,
  split,
} from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { createClient } from 'graphql-ws';
import { createLoadingLink } from './loadingLink';

const GRAPHQL_HTTP = import.meta.env.VITE_GRAPHQL_HTTP_URL ?? '/graphql';
const GRAPHQL_WS   = import.meta.env.VITE_GRAPHQL_WS_URL  ?? 'ws://localhost:4000/graphql';

function getToken(): string | null {
  try {
    const raw = localStorage.getItem('auth-storage');
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { state?: { accessToken?: string } };
    return parsed?.state?.accessToken ?? null;
  } catch {
    return null;
  }
}

const httpLink = new HttpLink({ uri: GRAPHQL_HTTP });

const authLink = setContext((_, prevContext: Record<string, unknown>) => {
  const token = getToken();
  const headers = (prevContext.headers ?? {}) as Record<string, string>;
  return {
    headers: {
      ...headers,
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
  };
});

const wsClient = createClient({
  url: GRAPHQL_WS,
  connectionParams: () => {
    const token = getToken();
    return token ? { authorization: `Bearer ${token}` } : {};
  },
});

const wsLink = new GraphQLWsLink(wsClient);

const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        getEglises:       { merge: false },
        getCellules:      { merge: false },
        getDepartements:  { merge: false },
        getMessages:      { merge: false },
        getRendezVous:    { merge: false },
        getVersets:       { merge: false },
        getEvenements:    { merge: false },
        getPlaylists:     { merge: false },
        getSermons:       { merge: false },
        getEmissions:     { merge: false },
        getShortVideos:   { merge: false },
        getCultes:        { merge: false },
        getCitations:     { merge: false },
        getArticlesAdmin: { merge: false },
        getConversations: { merge: false },
        getRequetes:      { merge: false },
        getUtilisateurs:  { merge: false },
        getDonsAdmin:     { merge: false },
      },
    },
  },
});

const loadingLink = createLoadingLink(cache);

const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  wsLink,
  from([loadingLink, authLink, httpLink]),
);

export const apolloClient = new ApolloClient({
  link: splitLink,
  cache,
  defaultOptions: {
    watchQuery: { fetchPolicy: 'cache-and-network' },
  },
});
