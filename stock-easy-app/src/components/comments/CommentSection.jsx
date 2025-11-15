import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/SupabaseAuthContext';
import { Send, User as UserIcon, Trash2, Edit2, Check, X, AtSign } from 'lucide-react';
import { toast } from 'sonner';
import {
  getOrderComments,
  addComment,
  updateComment,
  deleteComment,
  subscribeToOrderComments
} from '../../services/commentsService';
import { getTeamMembers } from '../../services/profileService';

export default function CommentSection({ purchaseOrderId, purchaseOrderNumber }) {
  const { currentUser } = useAuth();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [teamMembers, setTeamMembers] = useState([]);
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
    
    loadTeamMembers();
  }, [currentUser]);

  // Charger les commentaires et s'abonner au real-time
  useEffect(() => {
    if (!purchaseOrderId) return;

    loadComments();

    // S'abonner aux changements en temps réel
    const unsubscribe = subscribeToOrderComments(purchaseOrderId, (updatedComments) => {
      setComments(updatedComments);
    });

    return () => unsubscribe();
  }, [purchaseOrderId]);

  const loadComments = async () => {
    try {
      const { data, error } = await getOrderComments(purchaseOrderId);
      
      if (error) {
        throw error;
      }

      setComments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erreur chargement commentaires:', error);
      toast.error('Erreur lors du chargement des commentaires');
    }
  };

  const loadTeamMembers = async () => {
    try {
      const { data, error } = await getTeamMembers();

      if (error) {
        throw error;
      }

      setTeamMembers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erreur chargement team members:', error);
      setTeamMembers([]);
    }
  };

  // Détection des mentions (@)
  const handleInputChange = (e) => {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart;
    
    setNewComment(value);
    setCursorPosition(cursorPos);

    // Chercher un @ avant le curseur
    const textBeforeCursor = value.substring(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      if (!textAfterAt.includes(' ')) {
        setMentionSearch(textAfterAt.toLowerCase());
        setShowMentions(true);
        return;
      }
    }
    
    setShowMentions(false);
  };

  const insertMention = (member) => {
    const textBeforeCursor = newComment.substring(0, cursorPosition);
    const textAfterCursor = newComment.substring(cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    const newText = 
      newComment.substring(0, lastAtIndex) +
      `@${member.firstName} ${member.lastName} ` +
      textAfterCursor;
    
    setNewComment(newText);
    setShowMentions(false);
    textareaRef.current?.focus();
  };

  const filteredMembers = Array.isArray(teamMembers) ? teamMembers.filter(member => {
    const fullName = `${member.firstName} ${member.lastName}`.toLowerCase();
    return fullName.includes(mentionSearch);
  }) : [];

  // Extraire les mentions du texte
  const extractMentions = (text) => {
    const mentionRegex = /@([A-Za-zÀ-ÿ]+)\s+([A-Za-zÀ-ÿ]+)/g;
    const mentions = [];
    let match;
    
    while ((match = mentionRegex.exec(text)) !== null) {
      const firstName = match[1];
      const lastName = match[2];
      const member = teamMembers.find(
        m => m.firstName?.toLowerCase() === firstName.toLowerCase() &&
             m.lastName?.toLowerCase() === lastName.toLowerCase()
      );
      if (member) {
        mentions.push(member.id);
      }
    }
    
    return mentions;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!newComment.trim()) {
      toast.error('Le commentaire ne peut pas être vide');
      return;
    }

    setLoading(true);
    
    try {
      const mentionedUserIds = extractMentions(newComment);
      
      await addComment(purchaseOrderId, newComment.trim(), mentionedUserIds);
      
      setNewComment('');
      toast.success('Commentaire ajouté !');
    } catch (error) {
      console.error('Erreur ajout commentaire:', error);
      toast.error('Erreur lors de l\'ajout du commentaire');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (commentId) => {
    if (!editContent.trim()) {
      toast.error('Le commentaire ne peut pas être vide');
      return;
    }

    try {
      await updateComment(commentId, editContent.trim());
      
      setEditingCommentId(null);
      setEditContent('');
      toast.success('Commentaire modifié !');
    } catch (error) {
      console.error('Erreur modification commentaire:', error);
      toast.error('Erreur lors de la modification');
    }
  };

  const handleDelete = async (commentId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce commentaire ?')) {
      return;
    }

    try {
      await deleteComment(commentId);
      toast.success('Commentaire supprimé !');
    } catch (error) {
      console.error('Erreur suppression commentaire:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const startEditing = (comment) => {
    setEditingCommentId(comment.id);
    setEditContent(comment.content);
  };

  const cancelEditing = () => {
    setEditingCommentId(null);
    setEditContent('');
  };

  // Formater le contenu avec les mentions en surbrillance
  const formatCommentContent = (content) => {
    const mentionRegex = /@([A-Za-zÀ-ÿ]+)\s+([A-Za-zÀ-ÿ]+)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = mentionRegex.exec(content)) !== null) {
      // Texte avant la mention
      if (match.index > lastIndex) {
        parts.push(content.substring(lastIndex, match.index));
      }
      
      // La mention
      parts.push(
        <span key={match.index} className="bg-blue-100 text-blue-800 px-1 rounded font-medium">
          @{match[1]} {match[2]}
        </span>
      );
      
      lastIndex = match.index + match[0].length;
    }
    
    // Texte après la dernière mention
    if (lastIndex < content.length) {
      parts.push(content.substring(lastIndex));
    }
    
    return parts.length > 0 ? parts : content;
  };

  return (
    <div className="bg-white rounded-lg border border-[#E5E4DF] p-6">
      <h3 className="text-lg font-bold text-[#191919] mb-4">
        Commentaires {purchaseOrderNumber && `- ${purchaseOrderNumber}`}
      </h3>

      {/* Liste des commentaires */}
      <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
        {comments.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">
            Aucun commentaire pour le moment
          </p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 rounded-full shrink-0 overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm font-bold flex items-center justify-center">
                {comment.user?.photoUrl ? (
                  <img
                    src={comment.user.photoUrl}
                    alt={`${(comment.user?.firstName || '').trim()} ${(comment.user?.lastName || '').trim()}`.trim() || 'Avatar'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  comment.user?.firstName?.charAt(0) || <UserIcon className="w-4 h-4" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[#191919]">
                      {comment.user?.firstName} {comment.user?.lastName}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(comment.createdAt).toLocaleString('fr-FR')}
                    </span>
                    {comment.isEdited && (
                      <span className="text-xs text-gray-400 italic">(modifié)</span>
                    )}
                  </div>
                  
                  {comment.userId === currentUser?.id && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => startEditing(comment)}
                        className="p-1 hover:bg-gray-200 rounded transition-colors"
                        title="Modifier"
                      >
                        <Edit2 className="w-3 h-3 text-gray-600" />
                      </button>
                      <button
                        onClick={() => handleDelete(comment.id)}
                        className="p-1 hover:bg-red-100 rounded transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-3 h-3 text-red-600" />
                      </button>
                    </div>
                  )}
                </div>
                
                {editingCommentId === comment.id ? (
                  <div className="space-y-2">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full px-3 py-2 border border-[#E5E4DF] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black resize-none"
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(comment.id)}
                        className="px-3 py-1 bg-black text-white rounded text-xs hover:bg-gray-800 flex items-center gap-1"
                      >
                        <Check className="w-3 h-3" />
                        Sauvegarder
                      </button>
                      <button
                        onClick={cancelEditing}
                        className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-xs hover:bg-gray-300 flex items-center gap-1"
                      >
                        <X className="w-3 h-3" />
                        Annuler
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                    {formatCommentContent(comment.content)}
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Formulaire de nouveau commentaire */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={newComment}
            onChange={handleInputChange}
            placeholder="Ajouter un commentaire... (utilisez @ pour mentionner quelqu'un)"
            className="w-full px-4 py-3 pr-12 border border-[#E5E4DF] rounded-lg focus:outline-none focus:ring-2 focus:ring-black resize-none text-sm"
            rows={3}
            disabled={loading}
          />
          
          <button
            type="submit"
            disabled={loading || !newComment.trim()}
            className="absolute right-2 bottom-2 p-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

        {/* Liste des suggestions de mentions */}
        {showMentions && filteredMembers.length > 0 && (
          <div
            ref={mentionsListRef}
            className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-[#E5E4DF] rounded-lg shadow-lg max-h-48 overflow-y-auto z-10"
          >
            {filteredMembers.map((member) => (
              <button
                key={member.id}
                type="button"
                onClick={() => insertMention(member)}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 transition-colors"
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs font-bold flex items-center justify-center overflow-hidden">
                  {member.photoUrl ? (
                    <img
                      src={member.photoUrl}
                      alt={`${(member.firstName || '').trim()} ${(member.lastName || '').trim()}`.trim() || 'Avatar'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    member.firstName?.charAt(0) || <UserIcon className="w-3 h-3" />
                  )}
                </div>
                <span className="text-sm">
                  {member.firstName} {member.lastName}
                </span>
              </button>
            ))}
          </div>
        )}

        <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
          <AtSign className="w-3 h-3" />
          Tapez @ pour mentionner un membre de l'équipe
        </p>
      </form>
    </div>
  );
}
