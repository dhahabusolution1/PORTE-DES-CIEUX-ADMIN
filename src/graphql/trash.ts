import { gql } from '@apollo/client';

export type TrashType =
  | 'UTILISATEUR' | 'VERSET' | 'EVENEMENT' | 'PLAYLIST' | 'SERMON'
  | 'EMISSION' | 'SHORT' | 'CULTE' | 'CITATION' | 'EGLISE'
  | 'CELLULE' | 'DEPARTEMENT' | 'REQUETE' | 'RENDEZ_VOUS'
  | 'ARTICLE' | 'SESSION' | 'DON';

export const GET_CORBEILLE = gql`
  query GetCorbeille($type: TrashType, $limit: Int, $offset: Int) {
    getCorbeille(type: $type, limit: $limit, offset: $offset) {
      totalCount
      items { id type label deletedAt }
    }
  }
`;

export const METTRE_CORBEILLE = gql`
  mutation MettreCorbeille($type: TrashType!, $ids: [ID!]!) {
    mettreCorbeille(type: $type, ids: $ids)
  }
`;

export const RESTAURER_CORBEILLE = gql`
  mutation RestaurerCorbeille($type: TrashType!, $ids: [ID!]!) {
    restaurerCorbeille(type: $type, ids: $ids)
  }
`;
