import React, { useState, useEffect, useRef } from 'react';
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
import { Send, User as UserIcon, Trash2, Edit2, Check, X, AtSign } from 'lucide-react';
import { toast } from 'sonner';

export default function CommentSection({ purchaseOrderId, purchaseOrderNumber }) {
  const { currentUser } = useAuth();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [teamMembers, setTeamMembers] = useState([]);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = useRef(null);
  const mentionsListRef = useRef(null);

  // Charger les données de l'utilisateur et les membres de l'équipe
  useEffect(() => {
    if (!currentUser) return;
    
    // Pour l'instant, utilisons des données de test pour que les mentions fonctionnent
    const mockTeamMembers = [
      {
        id: '1',
        firstName: 'Jory',
        lastName: 'Cherief',
        email: 'jory@example.com',
        profilePhoto: null
      },
      {
        id: '2',
        firstName: 'Marie',
        lastName: 'Dupont',
        email: 'marie@example.com',
        profilePhoto: null
      },
      {
        id: '3',
        firstName: 'Pierre',
        lastName: 'Martin',
        email: 'pierre@example.com',
        profilePhoto: null
      }
    ];
    
    setTeamMembers(mockTeamMembers);
    
    // Essayer de charger les vraies données en arrière-plan
    let isMounted = true;
    
    const loadData = async () => {
      try {
        // Charger les données utilisateur
        const userDoc = await getDocs(
          query(collection(db, 'users'), where('email', '==', currentUser.email))
        );
        
        if (!userDoc.empty && isMounted) {
          const user = { id: userDoc.docs[0].id, ...userDoc.docs[0].data() };
          setUserData(user);
          
          // Charger les membres de l'équipe
          if (user.companyId) {
            const usersQuery = query(
              collection(db, 'users'),
              where('companyId', '==', user.companyId)
            );
            const snapshot = await getDocs(usersQuery);
            if (isMounted) {
              const members = snapshot.docs.map(doc => ({
                id: doc.id,
                display: `${doc.data().firstName || ''} ${doc.data().lastName || ''}`.trim() || doc.data().email,
                ...doc.data()
              }));
              // Remplacer les données mockées par les vraies données
              setTeamMembers(members);
            }
          }
        }
      } catch (error) {
        if (error.name !== 'AbortError' && isMounted) {
          console.error('Erreur chargement données:', error);
        }
      }
    };

    loadData();
    
    return () => {
      isMounted = false;
    };
  }, [currentUser]);

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

      // Extraire les utilisateurs mentionnés à partir du contenu
      const mentionedUserIds = [];
      const mentionMatches = newComment.match(/@(\w+)/g);
      if (mentionMatches) {
        mentionMatches.forEach(mention => {
          const username = mention.substring(1); // Enlever le @
          const user = teamMembers.find(member => 
            `${member.firstName} ${member.lastName}`.toLowerCase().includes(username.toLowerCase()) ||
            member.email.toLowerCase().includes(username.toLowerCase())
          );
          if (user && !mentionedUserIds.includes(user.id)) {
            mentionedUserIds.push(user.id);
          }
        });
      }

      await addDoc(collection(db, 'purchaseOrderComments'), {
        purchaseOrderId,
        purchaseOrderNumber,
        content: newComment,
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
      await updateDoc(doc(db, 'purchaseOrderComments', commentId), {
        content: editContent,
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
    
    // Remplacer les mentions @Nom Prénom par des spans stylisés
    const mentionRegex = /@([^@\s]+(?:\s+[^@\s]+)*)/g;
    const parts = content.split(mentionRegex);
    
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        // C'est une mention (les parties impaires sont les noms d'utilisateur)
        return (
          <span
            key={index}
            className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200 mr-1"
          >
            @{part}
          </span>
        );
      } else if (part) {
        // Texte normal
        return <span key={index}>{part}</span>;
      }
      return null;
    }).filter(Boolean);
  };

  // Gérer les mentions dans le textarea
  const handleTextareaChange = (e) => {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart;
    setCursorPosition(cursorPos);
    setNewComment(value);
    
    // Vérifier si on tape @
    const beforeCursor = value.substring(0, cursorPos);
    const atMatch = beforeCursor.match(/@([^@\s]*)$/);
    
    
    
    if (atMatch) {
      setMentionSearch(atMatch[1]);
      setShowMentions(true);
    } else {
      setShowMentions(false);
    }
  };

  // Insérer une mention
  const insertMention = (user) => {
    const beforeCursor = newComment.substring(0, cursorPosition);
    const afterCursor = newComment.substring(cursorPosition);
    const beforeMention = beforeCursor.replace(/@([^@\s]*)$/, '');
    const newValue = beforeMention + `@${user.firstName} ${user.lastName}` + ' ' + afterCursor;
    
    setNewComment(newValue);
    setShowMentions(false);
    
    // Repositionner le curseur
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos = beforeMention.length + `@${user.firstName} ${user.lastName}`.length + 1;
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        textareaRef.current.focus();
      }
    }, 0);
  };

  // Filtrer les membres de l'équipe pour les mentions
  const filteredMembers = teamMembers.filter(member => 
    member.firstName.toLowerCase().includes(mentionSearch.toLowerCase()) ||
    member.lastName.toLowerCase().includes(mentionSearch.toLowerCase()) ||
    member.email.toLowerCase().includes(mentionSearch.toLowerCase())
  );

  // Fermer les mentions quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (mentionsListRef.current && !mentionsListRef.current.contains(event.target) && 
          textareaRef.current && !textareaRef.current.contains(event.target)) {
        setShowMentions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
        {/* Liste des mentions - Positionnée AVANT le textarea comme Slack */}
        {showMentions && filteredMembers.length > 0 && (
          <div
            ref={mentionsListRef}
            className="bg-white border border-[#E5E4DF] rounded-lg shadow-lg max-h-48 overflow-y-auto mb-2"
            style={{
              minWidth: '250px',
              maxWidth: '400px'
            }}
          >
            {filteredMembers.map(member => (
              <button
                key={member.id}
                onClick={() => insertMention(member)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 border-b border-[#F3F4F6] last:border-b-0 transition-all duration-150 text-left group"
              >
                {member.profilePhoto ? (
                  <img 
                    src={member.profilePhoto} 
                    alt={`${member.firstName} ${member.lastName}`}
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-white group-hover:ring-blue-200 transition-all"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center ring-2 ring-white group-hover:ring-blue-200 transition-all">
                    <UserIcon className="w-5 h-5 text-white" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-[#191919] truncate group-hover:text-blue-700 transition-colors">
                    {member.firstName} {member.lastName}
                  </div>
                  <div className="text-xs text-[#666663] truncate">
                    {member.email}
                  </div>
                </div>
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 group-hover:bg-blue-200 transition-colors">
                  <AtSign className="w-3 h-3 text-blue-600" />
                </div>
              </button>
            ))}
          </div>
        )}

        <textarea
          ref={textareaRef}
          value={newComment}
          onChange={handleTextareaChange}
          placeholder="Ajouter un commentaire... Utilisez @ pour mentionner un collègue"
          className="w-full px-4 py-3 border border-[#E5E4DF] rounded-lg focus:outline-none focus:ring-2 focus:ring-black resize-none text-sm"
          rows="3"
          disabled={loading}
        />

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
