import { ApolloLink, Observable, type InMemoryCache } from '@apollo/client';
import { getMainDefinition } from '@apollo/client/utilities';
import { useUIStore } from '@/stores/uiStore';
import { getQueryLoadingMessage } from './queryLabels';

function hasCachedQueryData(cache: InMemoryCache, operation: ApolloLink.Operation): boolean {
  try {
    const data = cache.readQuery({
      query: operation.query,
      variables: operation.variables,
    });
    return data != null;
  } catch {
    return false;
  }
}

/**
 * Affiche le ProcessingModal lors des requêtes GraphQL sans données en cache.
 * Les rechargements silencieux (cache-and-network) ne déclenchent pas le modal.
 */
export function createLoadingLink(cache: InMemoryCache) {
  return new ApolloLink((operation, forward) => {
    const definition = getMainDefinition(operation.query);
    if (definition.kind !== 'OperationDefinition' || definition.operation !== 'query') {
      return forward(operation);
    }

    if (operation.getContext().skipLoadingModal === true) {
      return forward(operation);
    }

    if (hasCachedQueryData(cache, operation)) {
      return forward(operation);
    }

    const message = getQueryLoadingMessage(operation.operationName);
    const end = useUIStore.getState().beginFetchLoading(message);

    return new Observable((observer) => {
      const subscription = forward(operation).subscribe({
        next: (result) => {
          end();
          observer.next(result);
        },
        error: (error) => {
          end();
          observer.error(error);
        },
        complete: () => {
          end();
          observer.complete();
        },
      });

      return () => {
        end();
        subscription.unsubscribe();
      };
    });
  });
}
