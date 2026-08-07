import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useSubscription } from '@apollo/client/react';
import { MessageSquare, X, CheckCheck, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

import { GET_CONVERSATIONS, GET_MESSAGES } from '@/graphql/queries/interactions.queries';
import {
  ENVOYER_MESSAGE,
  MARQUER_MESSAGES_LUS,
  FERMER_CONVERSATION,
} from '@/graphql/mutations/interactions.mutations';
import { NOUVEAU_MESSAGE_SUB } from '@/graphql/subscriptions/messagerie.subscriptions';
import { useAuthStore } from '@/stores/authStore';
import type { Conversation, Message } from '@/types';

const LIMIT_CONV = 30;

interface ConvsData {
  getConversations: { items: Conversation[]; pagination: { total: number } };
}
interface MessagesData { getMessages: Message[] }

function ConvItem({
  conv,
  isActive,
  onClick,
}: {
  conv: Conversation;
  isActive: boolean;
  onClick: () => void;
}) {
  const nom = [conv.fidele.prenom, conv.fidele.nom].filter(Boolean).join(' ');
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2.5 flex items-start gap-2.5 transition-colors cursor-pointer ${
        isActive ? 'bg-primary-50' : 'hover:bg-accent-50'
      }`}
    >
      <div className="w-8 h-8 rounded-full bg-primary-200 flex-shrink-0 flex items-center justify-center overflow-hidden">
        {conv.fidele.photoUrl ? (
          <img src={conv.fidele.photoUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-primary-700 text-xs font-semibold">
            {conv.fidele.nom.charAt(0).toUpperCase()}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <p className="text-xs font-medium text-accent-800 truncate">{nom}</p>
          {conv.messagesNonLus > 0 && (
            <span className="flex-shrink-0 w-4 h-4 rounded-full bg-primary-600 text-white text-[10px] flex items-center justify-center">
              {conv.messagesNonLus}
            </span>
          )}
        </div>
        <p className="text-[10px] text-accent-400 mt-0.5">
          {conv.statut === 'FERMEE' ? '🔒 Fermée' : conv.admin ? `Assignée à ${conv.admin.nom}` : 'Non assignée'}
        </p>
      </div>
    </button>
  );
}

function ChatWindow({
  conversation,
  onClose,
  onRefetchConvs,
}: {
  conversation: Conversation;
  onClose: () => void;
  onRefetchConvs: () => void;
}) {
  const [texte, setTexte] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const me = useAuthStore((s) => s.user);

  const { data, refetch } = useQuery<MessagesData>(GET_MESSAGES, {
    variables: { conversationId: conversation.id, limit: 100, offset: 0 },
    fetchPolicy: 'cache-and-network',
  });

  const [envoyerMessage] = useMutation(ENVOYER_MESSAGE);
  const [marquerLus] = useMutation(MARQUER_MESSAGES_LUS);
  const [fermerConversation] = useMutation(FERMER_CONVERSATION);

  const messages = data?.getMessages ?? [];

  // Subscribe to new messages
  useSubscription(NOUVEAU_MESSAGE_SUB, {
    variables: { conversationId: conversation.id },
    onData: ({ data: subData }) => {
      const newMsg = (subData.data as { nouveauMessage?: Message } | null)?.nouveauMessage;
      if (newMsg) {
        void refetch();
      }
    },
  });

  // Mark as read when opening
  useEffect(() => {
    if (conversation.messagesNonLus > 0) {
      void marquerLus({ variables: { conversationId: conversation.id } });
    }
  }, [conversation.id, conversation.messagesNonLus, marquerLus]);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = async () => {
    if (!texte.trim()) return;
    const contenu = texte.trim();
    setTexte('');
    try {
      await envoyerMessage({ variables: { conversationId: conversation.id, contenu } });
      void refetch();
    } catch {
      toast.error("Échec de l'envoi du message");
      setTexte(contenu);
    }
  };

  const handleFermer = async () => {
    try {
      await fermerConversation({ variables: { conversationId: conversation.id } });
      toast.success('Conversation fermée');
      onRefetchConvs();
      onClose();
    } catch {
      toast.error('Échec de la fermeture');
    }
  };

  const nomFidele = [conversation.fidele.prenom, conversation.fidele.nom].filter(Boolean).join(' ');
  const isClosed = conversation.statut === 'FERMEE';

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-accent-200 bg-surface flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-primary-200 flex items-center justify-center overflow-hidden">
            {conversation.fidele.photoUrl ? (
              <img src={conversation.fidele.photoUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-primary-700 text-xs font-semibold">
                {conversation.fidele.nom.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <p className="text-xs font-semibold text-accent-800">{nomFidele}</p>
            <p className="text-[10px] text-accent-400">{conversation.fidele.numeroWhatsapp}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {!isClosed && (
            <button
              onClick={() => void handleFermer()}
              title="Fermer la conversation"
              className="text-xs px-2 py-1 text-accent-500 border border-accent-200 rounded cursor-pointer hover:bg-accent-100 flex items-center gap-1"
            >
              <Lock size={11} />
              Fermer
            </button>
          )}
          <button onClick={onClose} className="text-accent-400 cursor-pointer hover:text-accent-600 ml-1">
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {messages.map((msg) => {
          const isMe = msg.expediteur.id === me?.id;
          const isAdmin = msg.expediteur.role === 'ADMIN' || msg.expediteur.role === 'SUPER_ADMIN';
          return (
            <div key={msg.id} className={`flex ${isMe || isAdmin ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[70%] px-3 py-1.5 rounded-lg text-xs ${
                  isMe || isAdmin
                    ? 'bg-primary-600 text-white'
                    : 'bg-accent-100 text-accent-800'
                }`}
              >
                {!isMe && !isAdmin && (
                  <p className="text-[10px] font-semibold text-primary-600 mb-0.5">
                    {msg.expediteur.nom}
                  </p>
                )}
                <p className="leading-relaxed">{msg.contenu}</p>
                <p className={`text-[10px] mt-0.5 ${isMe || isAdmin ? 'text-white/60' : 'text-accent-400'}`}>
                  {format(new Date(msg.createdAt), 'HH:mm', { locale: fr })}
                  {(isMe || isAdmin) && msg.statut === 'LU' && (
                    <CheckCheck size={10} className="inline ml-1" />
                  )}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {!isClosed ? (
        <div className="px-3 py-2 border-t border-accent-200 flex gap-2 flex-shrink-0">
          <input
            value={texte}
            onChange={(e) => setTexte(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void handleSend(); } }}
            placeholder="Répondre au fidèle…"
            className="flex-1 text-sm px-3 py-1.5 border border-accent-200 rounded outline-none focus:border-primary-400"
          />
          <button
            onClick={() => void handleSend()}
            disabled={!texte.trim()}
            className="text-sm px-3 py-1.5 bg-primary-600 text-white rounded cursor-pointer hover:bg-primary-700 disabled:opacity-40"
          >
            Envoyer
          </button>
        </div>
      ) : (
        <div className="px-4 py-2 border-t border-accent-200 bg-accent-50">
          <p className="text-xs text-accent-500 text-center flex items-center justify-center gap-1">
            <Lock size={11} /> Conversation fermée
          </p>
        </div>
      )}
    </div>
  );
}

export function MessageriePage() {
  const [filterStatut, setFilterStatut] = useState('');
  const [activeConvId, setActiveConvId] = useState<string | null>(null);

  const { data, loading, refetch } = useQuery<ConvsData>(GET_CONVERSATIONS, {
    variables: {
      statut: filterStatut || undefined,
      limit: LIMIT_CONV,
      offset: 0,
    },
    fetchPolicy: 'cache-and-network',
    pollInterval: 30000, // refresh every 30s as fallback
  });

  const conversations = data?.getConversations.items ?? [];
  const total = data?.getConversations.pagination.total ?? 0;

  const activeConv = conversations.find((c) => c.id === activeConvId) || null;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-base font-semibold text-accent-900">Messagerie</h2>
          <p className="text-xs text-accent-400 mt-0.5">
            {total} conversation{total > 1 ? 's' : ''} au total
          </p>
        </div>
        <select
          value={filterStatut}
          onChange={(e) => setFilterStatut(e.target.value)}
          className="text-xs px-3 py-1.5 border border-accent-200 rounded outline-none cursor-pointer bg-white text-accent-700 focus:border-primary-400"
        >
          <option value="">Toutes les conversations</option>
          <option value="OUVERTE">Ouvertes</option>
          <option value="FERMEE">Fermées</option>
        </select>
      </div>

      <div className="border border-accent-200 rounded-lg overflow-hidden flex" style={{ height: '65vh' }}>
        {/* Left panel — conversation list */}
        <div className="w-72 flex-shrink-0 border-r border-accent-200 flex flex-col">
          <div className="px-3 py-2 border-b border-accent-200 bg-accent-50">
            <p className="text-[11px] font-medium text-accent-500 uppercase tracking-wide">
              Conversations ({conversations.length})
            </p>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-accent-100">
            {loading && conversations.length === 0 && (
              <p className="text-xs text-accent-400 text-center py-6">Chargement…</p>
            )}
            {!loading && conversations.length === 0 && (
              <p className="text-xs text-accent-400 text-center py-6">Aucune conversation</p>
            )}
            {conversations.map((conv) => (
              <ConvItem
                key={conv.id}
                conv={conv}
                isActive={activeConvId === conv.id}
                onClick={() => setActiveConvId(conv.id)}
              />
            ))}
          </div>
        </div>

        {/* Right panel — chat window */}
        <div className="flex-1 flex flex-col">
          {activeConv ? (
            <ChatWindow
              conversation={activeConv}
              onClose={() => setActiveConvId(null)}
              onRefetchConvs={() => void refetch()}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-accent-400 gap-3">
              <MessageSquare size={32} className="text-accent-200" />
              <p className="text-sm">Sélectionnez une conversation</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
