import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../config/firebase';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  serverTimestamp,
  getDocs,
  deleteDoc,
  doc,
  updateDoc
} from 'firebase/firestore';
import { MentionsInput, Mention } from 'react-mentions';
import { Send, User as UserIcon, Trash2, Edit2, Check, X } from 'lucide-react';
import { toast } from 'sonner';

export default function CommentSection({ purchaseOrderId, purchaseOrderNumber }) {
  const { currentUser } = useAuth();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [mentions, setMentions] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editContent, setEditContent] = useState('');

  // Charger les données de l'utilisateur actuel
  useEffect(() => {
    if (!currentUser) return;
    
    let isMounted = true;
    
    const loadUserData = async () => {
      try {
        const userDoc = await getDocs(
          query(collection(db, 'users'), where('email', '==', currentUser.email))
        );
        if (!userDoc.empty && isMounted) {
          const user = { id: userDoc.docs[0].id, ...userDoc.docs[0].data() };
          setUserData(user);
        }
      } catch (error) {
        if (error.name !== 'AbortError' && isMounted) {
          console.error('Erreur chargement user:', error);
        }
      }
    };

    loadUserData();
    
    return () => {
      isMounted = false;
    };
  }, [currentUser]);

  // Charger les membres de l'équipe pour les mentions
  useEffect(() => {
    if (!userData?.companyId) return;

    let isMounted = true;

    const loadTeamMembers = async () => {
      try {
        const usersQuery = query(
          collection(db, 'users'),
          where('companyId', '==', userData.companyId)
        );
        const snapshot = await getDocs(usersQuery);
        if (isMounted) {
          const members = snapshot.docs.map(doc => ({
            id: doc.id,
            display: `${doc.data().firstName || ''} ${doc.data().lastName || ''}`.trim() || doc.data().email,
            ...doc.data()
          }));
          setTeamMembers(members);
        }
      } catch (error) {
        if (error.name !== 'AbortError' && isMounted) {
          console.error('Erreur chargement équipe:', error);
        }
      }
    };

    loadTeamMembers();
    
    return () => {
      isMounted = false;
    };
  }, [userData]);

  // Écouter les commentaires en temps réel
  useEffect(() => {
    if (!purchaseOrderId) return;

    const q = query(
      collection(db, 'purchaseOrderComments'),
      where('purchaseOrderId', '==', purchaseOrderId),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const commentsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setComments(commentsData);
      },
      (error) => {
        console.error('Erreur commentaires:', error);
        toast.error('Erreur de chargement des commentaires');
      }
    );

    return () => unsubscribe();
  }, [purchaseOrderId]);

  // Ajouter un commentaire
  const handleAddComment = async () => {
    if (!newComment.trim()) {
      toast.error('Veuillez écrire un commentaire');
      return;
    }

    if (!currentUser) {
      toast.error('Vous devez être connecté');
      return;
    }

    setLoading(true);

    try {
      // Charger userData si nécessaire
      let user = userData;
      if (!user) {
        try {
          const userDoc = await getDocs(
            query(collection(db, 'users'), where('email', '==', currentUser.email))
          );
          if (!userDoc.empty) {
            user = { id: userDoc.docs[0].id, ...userDoc.docs[0].data() };
            setUserData(user);
          }
        } catch (userError) {
          if (userError.name !== 'AbortError') {
            console.error('Erreur chargement user dans handleAddComment:', userError);
          }
          toast.error('Erreur lors du chargement des données utilisateur');
          setLoading(false);
          return;
        }
      }

      // Extraire les IDs des utilisateurs mentionnés
      const mentionedUserIds = mentions.map(m => m.id);

      // Nettoyer le contenu en remplaçant les mentions par le format simple @Nom
      const cleanContent = newComment.replace(/@\[([^\]]+)\]\([^)]+\)/g, '@$1');

      await addDoc(collection(db, 'purchaseOrderComments'), {
        purchaseOrderId,
        purchaseOrderNumber,
        content: cleanContent,
        authorId: user?.id || currentUser.uid,
        authorName: user ? `${user.firstName} ${user.lastName}` : (currentUser.displayName || currentUser.email),
        authorEmail: currentUser.email,
        authorPhoto: user?.profilePhoto || currentUser.photoURL || null,
        mentions: mentionedUserIds,
        companyId: user?.companyId || null,
        createdAt: serverTimestamp(),
        isEdited: false
      });

      // Créer des notifications pour les utilisateurs mentionnés
      if (mentionedUserIds.length > 0) {
        for (const userId of mentionedUserIds) {
          if (userId !== user.id) { // Ne pas se notifier soi-même
            try {
              await addDoc(collection(db, 'notifications'), {
                recipientId: userId,
                type: 'mention',
                content: `${user.firstName} ${user.lastName} vous a mentionné dans ${purchaseOrderNumber}`,
                link: `/purchase-orders/${purchaseOrderId}`,
                relatedPOId: purchaseOrderId,
                relatedCommentId: null,
                isRead: false,
                createdAt: serverTimestamp()
              });
            } catch (notifError) {
              console.error('❌ Erreur création notification:', notifError);
            }
          }
        }
      }

      setNewComment('');
      setMentions([]);
      toast.success('Commentaire ajouté !');
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Erreur ajout commentaire:', error);
        toast.error('Erreur lors de l\'ajout du commentaire');
      }
    } finally {
      setLoading(false);
    }
  };

  // Supprimer un commentaire
  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Voulez-vous vraiment supprimer ce commentaire ?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'purchaseOrderComments', commentId));
      toast.success('Commentaire supprimé');
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Erreur suppression:', error);
        toast.error('Erreur lors de la suppression');
      }
    }
  };

  // Démarrer l'édition d'un commentaire
  const startEditComment = (comment) => {
    setEditingCommentId(comment.id);
    setEditContent(comment.content);
  };

  // Annuler l'édition
  const cancelEdit = () => {
    setEditingCommentId(null);
    setEditContent('');
  };

  // Sauvegarder les modifications
  const saveEditComment = async (commentId) => {
    if (!editContent.trim()) {
      toast.error('Le commentaire ne peut pas être vide');
      return;
    }

    try {
      // Nettoyer le contenu en remplaçant les mentions par le format simple @Nom
      const cleanContent = editContent.replace(/@\[([^\]]+)\]\([^)]+\)/g, '@$1');
      
      await updateDoc(doc(db, 'purchaseOrderComments', commentId), {
        content: cleanContent,
        isEdited: true,
        editedAt: serverTimestamp()
      });
      
      setEditingCommentId(null);
      setEditContent('');
      toast.success('Commentaire modifié !');
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Erreur édition:', error);
        toast.error('Erreur lors de la modification');
      }
    }
  };

  // Formater le timestamp en temps relatif
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'À l\'instant';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'À l\'instant';
    if (diffInSeconds < 3600) return `Il y a ${Math.floor(diffInSeconds / 60)} min`;
    if (diffInSeconds < 86400) return `Il y a ${Math.floor(diffInSeconds / 3600)} h`;
    if (diffInSeconds < 604800) return `Il y a ${Math.floor(diffInSeconds / 86400)} j`;
    
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Rendre le contenu du commentaire avec les mentions stylisées
  const renderCommentContent = (content) => {
    if (!content) return '';
    
    // Remplacer les mentions @[Nom](ID) et @Nom par des spans stylisés
    const mentionRegex = /(@(?:\[([^\]]+)\]\([^)]+\)|(\w+)))/g;
    const parts = content.split(mentionRegex);
    
    return parts.map((part, index) => {
      if (part && part.startsWith('@')) {
        // C'est une mention
        let mentionName = '';
        
        // Si c'est le format @[Nom](ID), extraire le nom
        if (part.includes('[') && part.includes(']')) {
          const match = part.match(/@\[([^\]]+)\]\([^)]+\)/);
          mentionName = match ? match[1] : part;
        } else {
          // Si c'est le format simple @Nom
          mentionName = part.substring(1); // Enlever le @
        }
        
        return (
          <span
            key={index}
            className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200 mr-1"
          >
            @{mentionName}
          </span>
        );
      } else if (part) {
        // Texte normal
        return <span key={index}>{part}</span>;
      }
      return null;
    }).filter(Boolean);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-[#191919] flex items-center gap-2">
        💬 Commentaires ({comments.length})
      </h3>

      {/* Liste des commentaires */}
      <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
        {comments.length === 0 ? (
          <div className="text-center py-8 text-[#666663] text-sm bg-[#FAFAF7] rounded-lg border border-[#E5E4DF]">
            Aucun commentaire pour le moment
          </div>
        ) : (
          comments.map(comment => {
            const isAuthor = currentUser && (comment.authorEmail === currentUser.email || comment.authorId === currentUser.uid);
            const isEditing = editingCommentId === comment.id;

            return (
              <div key={comment.id} className="bg-[#FAFAF7] border border-[#E5E4DF] rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex gap-3">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {comment.authorPhoto ? (
                      <img 
                        src={comment.authorPhoto} 
                        alt={comment.authorName}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-[#666663] flex items-center justify-center">
                        <UserIcon className="w-5 h-5 text-white" />
                      </div>
                    )}
                  </div>
                  
                  {/* Contenu */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#191919] text-sm">
                          {comment.authorName}
                        </span>
                        <span className="text-xs text-[#666663]">
                          {formatTimestamp(comment.createdAt)}
                          {comment.isEdited && ' (modifié)'}
                        </span>
                      </div>
                      
                      {/* Actions (seulement pour l'auteur) */}
                      {isAuthor && !isEditing && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => startEditComment(comment)}
                            className="p-1 text-[#666663] hover:text-black transition-colors"
                            title="Modifier"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="p-1 text-[#EF1C43] hover:text-red-700 transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                    
                    {/* Contenu ou mode édition */}
                    {isEditing ? (
                      <div className="space-y-2">
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="w-full px-3 py-2 border border-[#E5E4DF] rounded-lg focus:outline-none focus:ring-2 focus:ring-black resize-none text-sm"
                          rows="3"
                        />
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={cancelEdit}
                            className="inline-flex items-center gap-1 px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                          >
                            <X className="w-3 h-3" />
                            Annuler
                          </button>
                          <button
                            onClick={() => saveEditComment(comment.id)}
                            className="inline-flex items-center gap-1 px-3 py-1 text-xs bg-black text-white rounded hover:bg-[#333333] transition-colors"
                          >
                            <Check className="w-3 h-3" />
                            Sauvegarder
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-[#666663] text-sm mt-1 whitespace-pre-wrap break-words">
                        {renderCommentContent(comment.content)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Formulaire d'ajout avec mentions */}
      <div className="space-y-3">
        <MentionsInput
          value={newComment}
          onChange={(e, newValue, newPlainTextValue, mentionsArray) => {
            setNewComment(newValue);
            setMentions(mentionsArray);
          }}
          placeholder="Ajouter un commentaire... Utilisez @ pour mentionner un collègue"
          className="mentions-input"
          disabled={loading}
          style={{
            control: {
              fontSize: 14,
              minHeight: 80,
            },
            highlighter: {
              padding: 12,
              border: '1px solid #E5E4DF',
              borderRadius: 8,
            },
            input: {
              padding: 12,
              border: '1px solid #E5E4DF',
              borderRadius: 8,
              outline: 'none',
              resize: 'vertical',
            },
            suggestions: {
              list: {
                backgroundColor: 'white',
                border: '1px solid #E5E4DF',
                borderRadius: 8,
                fontSize: 14,
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                maxHeight: 200,
                overflowY: 'auto',
              },
              item: {
                padding: '8px 12px',
                borderBottom: '1px solid #F3F4F6',
                '&focused': {
                  backgroundColor: '#F3F4F6',
                },
              },
            },
          }}
        >
          <Mention
            trigger="@"
            data={teamMembers}
            displayTransform={(id, display) => `@${display}`}
            style={{
              backgroundColor: '#DBEAFE',
              color: '#1E40AF',
              padding: '2px 4px',
              borderRadius: 4,
              fontWeight: 500,
            }}
          />
        </MentionsInput>

        <div className="flex justify-end">
          <button
            onClick={handleAddComment}
            disabled={loading || !newComment.trim()}
            className="inline-flex items-center gap-2 px-6 py-2 bg-black text-white rounded-lg hover:bg-[#333333] disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold text-sm"
          >
            <Send className="w-4 h-4" />
            {loading ? 'Envoi...' : 'Envoyer'}
          </button>
        </div>
      </div>
    </div>
  );
}
