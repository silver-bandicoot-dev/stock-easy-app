import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronRight, ArrowLeft, X } from 'lucide-react';
import { 
  HELP_CATEGORIES, 
  HELP_ARTICLES, 
  searchArticles, 
  getArticleById,
  getCategoryById 
} from './helpContent';

/**
 * Barre de recherche du centre d'aide
 */
const HelpSearchBar = ({ searchTerm, setSearchTerm, onClear, placeholder }) => (
  <div className="relative">
    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#666663]" />
    <input
      type="text"
      placeholder={placeholder}
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      className="w-full pl-12 pr-12 py-3.5 bg-white border-2 border-[#E5E4DF] rounded-xl text-base focus:outline-none focus:border-[#191919] focus:ring-2 focus:ring-[#191919]/10 transition-all"
    />
    {searchTerm && (
      <button
        onClick={onClear}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-[#E5E4DF] rounded-full transition-colors"
      >
        <X className="w-4 h-4 text-[#666663]" />
      </button>
    )}
  </div>
);

/**
 * Carte de catégorie
 */
const HelpCategoryCard = ({ category, onClick, articleCount, articlesLabel }) => {
  const Icon = category.icon;
  
  return (
    <motion.button
      onClick={onClick}
      className="w-full p-5 bg-white rounded-xl border-2 border-[#E5E4DF] hover:border-[#191919] hover:shadow-lg transition-all text-left group"
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-xl ${category.color} flex items-center justify-center shrink-0 shadow-lg`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-[#191919] text-lg mb-1 group-hover:text-[#191919]">
            {category.title}
          </h3>
          <p className="text-sm text-[#666663] line-clamp-2">
            {category.description}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs text-[#666663] bg-[#FAFAF7] px-2 py-1 rounded-full">
              {articleCount} {articlesLabel}
            </span>
            <ChevronRight className="w-4 h-4 text-[#666663] group-hover:text-[#191919] group-hover:translate-x-1 transition-all" />
          </div>
        </div>
      </div>
    </motion.button>
  );
};

/**
 * Liste des articles d'une catégorie
 */
const HelpArticleList = ({ category, articles, onSelectArticle, onBack, articlesLabel }) => {
  const Icon = category.icon;
  
  return (
    <div className="space-y-6">
      {/* Header avec bouton retour */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-[#E5E4DF] rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-[#666663]" />
        </button>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg ${category.color} flex items-center justify-center shadow-md`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#191919]">{category.title}</h2>
            <p className="text-sm text-[#666663]">{articles.length} {articlesLabel}</p>
          </div>
        </div>
      </div>
      
      {/* Liste des articles */}
      <div className="space-y-3">
        {articles.map((article, index) => (
          <motion.button
            key={article.id}
            onClick={() => onSelectArticle(article)}
            className="w-full p-4 bg-white rounded-xl border-2 border-[#E5E4DF] hover:border-[#191919] hover:shadow-md transition-all text-left group"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-[#191919] mb-1 group-hover:text-[#191919]">
                  {article.title}
                </h3>
                <p className="text-sm text-[#666663] line-clamp-1">
                  {article.summary}
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-[#666663] group-hover:text-[#191919] group-hover:translate-x-1 transition-all shrink-0" />
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

/**
 * Affichage d'un article
 */
const HelpArticle = ({ article, category, onBack, backLabel }) => {
  const Icon = category?.icon;
  
  // Parser le markdown de base
  const renderContent = (content) => {
    const lines = content.trim().split('\n');
    const elements = [];
    let inTable = false;
    let tableRows = [];
    let inCodeBlock = false;
    let codeBlockContent = [];
    
    lines.forEach((line, index) => {
      // Gestion des blocs de code
      if (line.trim().startsWith('```')) {
        if (inCodeBlock) {
          elements.push(
            <pre key={`code-${index}`} className="bg-[#1a1a1a] text-[#e5e5e5] p-4 rounded-lg overflow-x-auto my-4 text-sm font-mono">
              {codeBlockContent.join('\n')}
            </pre>
          );
          codeBlockContent = [];
          inCodeBlock = false;
        } else {
          inCodeBlock = true;
        }
        return;
      }
      
      if (inCodeBlock) {
        codeBlockContent.push(line);
        return;
      }
      
      // Gestion des tableaux
      if (line.includes('|') && !line.trim().startsWith('>')) {
        if (!inTable) {
          inTable = true;
          tableRows = [];
        }
        
        // Ignorer les lignes de séparation
        if (line.trim().match(/^\|[\s\-:|]+\|$/)) {
          return;
        }
        
        const cells = line.split('|').filter(cell => cell.trim() !== '');
        tableRows.push(cells.map(cell => cell.trim()));
        return;
      } else if (inTable) {
        // Fin du tableau
        elements.push(
          <div key={`table-${index}`} className="overflow-x-auto my-4">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#FAFAF7]">
                  {tableRows[0]?.map((cell, i) => (
                    <th key={i} className="border border-[#E5E4DF] px-4 py-2 text-left text-sm font-semibold text-[#191919]">
                      {cell.replace(/\*\*/g, '')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableRows.slice(1).map((row, rowIndex) => (
                  <tr key={rowIndex} className="hover:bg-[#FAFAF7]">
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex} className="border border-[#E5E4DF] px-4 py-2 text-sm text-[#191919]">
                        {cell.replace(/\*\*/g, '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        tableRows = [];
        inTable = false;
      }
      
      // Ligne vide
      if (!line.trim()) {
        elements.push(<div key={`space-${index}`} className="h-2" />);
        return;
      }
      
      // Titres
      if (line.startsWith('## ')) {
        elements.push(
          <h2 key={index} className="text-2xl font-bold text-[#191919] mt-8 mb-4 pb-2 border-b border-[#E5E4DF]">
            {line.replace('## ', '')}
          </h2>
        );
        return;
      }
      
      if (line.startsWith('### ')) {
        elements.push(
          <h3 key={index} className="text-lg font-semibold text-[#191919] mt-6 mb-3">
            {line.replace('### ', '')}
          </h3>
        );
        return;
      }
      
      // Citations / Notes
      if (line.startsWith('> ')) {
        elements.push(
          <div key={index} className="bg-blue-50 border-l-4 border-blue-500 p-4 my-4 rounded-r-lg">
            <p className="text-sm text-blue-800">{line.replace('> ', '').replace(/\*\*/g, '')}</p>
          </div>
        );
        return;
      }
      
      // Listes à puces
      if (line.startsWith('- ')) {
        const content = line.replace('- ', '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        elements.push(
          <div key={index} className="flex items-start gap-3 ml-4 my-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#191919] mt-2 shrink-0" />
            <span className="text-[#191919]" dangerouslySetInnerHTML={{ __html: content }} />
          </div>
        );
        return;
      }
      
      // Listes numérotées
      const numberedMatch = line.match(/^(\d+)\. /);
      if (numberedMatch) {
        const content = line.replace(/^\d+\. /, '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        elements.push(
          <div key={index} className="flex items-start gap-3 ml-4 my-1">
            <span className="w-6 h-6 rounded-full bg-[#191919] text-white text-xs flex items-center justify-center shrink-0">
              {numberedMatch[1]}
            </span>
            <span className="text-[#191919] pt-0.5" dangerouslySetInnerHTML={{ __html: content }} />
          </div>
        );
        return;
      }
      
      // Paragraphe normal
      const formattedLine = line
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/`(.*?)`/g, '<code class="bg-[#FAFAF7] px-1.5 py-0.5 rounded text-sm font-mono text-[#191919]">$1</code>');
      
      elements.push(
        <p key={index} className="text-[#191919] my-2 leading-relaxed" dangerouslySetInnerHTML={{ __html: formattedLine }} />
      );
    });
    
    return elements;
  };
  
  return (
    <div className="space-y-6">
      {/* Header avec fil d'Ariane */}
      <div className="flex items-center gap-2 text-sm">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-[#666663] hover:text-[#191919] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{backLabel}</span>
        </button>
        <ChevronRight className="w-4 h-4 text-[#E5E4DF]" />
        <span className="text-[#666663]">{category?.title}</span>
        <ChevronRight className="w-4 h-4 text-[#E5E4DF]" />
        <span className="text-[#191919] font-medium truncate">{article.title}</span>
      </div>
      
      {/* Contenu de l'article */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl border-2 border-[#E5E4DF] p-6 sm:p-8"
      >
        {/* Titre avec icône */}
        <div className="flex items-start gap-4 mb-6 pb-6 border-b border-[#E5E4DF]">
          {Icon && (
            <div className={`w-12 h-12 rounded-xl ${category?.color} flex items-center justify-center shadow-lg shrink-0`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-[#191919] mb-2">{article.title}</h1>
            <p className="text-[#666663]">{article.summary}</p>
          </div>
        </div>
        
        {/* Corps de l'article */}
        <div className="prose prose-slate max-w-none">
          {renderContent(article.content)}
        </div>
      </motion.div>
    </div>
  );
};

/**
 * Résultats de recherche
 */
const SearchResults = ({ results, searchTerm, onSelectArticle, onClear, resultsLabel, resultsForLabel, clearSearchLabel, noResultsLabel }) => (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <p className="text-sm text-[#666663]">
        {results.length} {resultsLabel} {resultsForLabel} "<span className="font-medium text-[#191919]">{searchTerm}</span>"
      </p>
      <button
        onClick={onClear}
        className="text-sm text-[#666663] hover:text-[#191919] transition-colors"
      >
        {clearSearchLabel}
      </button>
    </div>
    
    {results.length === 0 ? (
      <div className="bg-white rounded-xl border-2 border-[#E5E4DF] p-8 text-center">
        <p className="text-[#666663]">{noResultsLabel}</p>
      </div>
    ) : (
      <div className="space-y-3">
        {results.map((article, index) => {
          const category = getCategoryById(article.categoryId);
          const Icon = category?.icon;
          
          return (
            <motion.button
              key={article.id}
              onClick={() => onSelectArticle(article)}
              className="w-full p-4 bg-white rounded-xl border-2 border-[#E5E4DF] hover:border-[#191919] hover:shadow-md transition-all text-left group"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <div className="flex items-start gap-4">
                {Icon && (
                  <div className={`w-10 h-10 rounded-lg ${category?.color} flex items-center justify-center shadow-md shrink-0`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-[#666663] bg-[#FAFAF7] px-2 py-0.5 rounded">
                      {category?.title}
                    </span>
                  </div>
                  <h3 className="font-semibold text-[#191919] mb-1 group-hover:text-[#191919]">
                    {article.title}
                  </h3>
                  <p className="text-sm text-[#666663] line-clamp-2">
                    {article.summary}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-[#666663] group-hover:text-[#191919] group-hover:translate-x-1 transition-all shrink-0 mt-2" />
              </div>
            </motion.button>
          );
        })}
      </div>
    )}
  </div>
);

/**
 * Composant principal du Centre d'Aide
 */
export const HelpCenterTab = () => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedArticle, setSelectedArticle] = useState(null);
  
  // Résultats de recherche
  const searchResults = useMemo(() => {
    if (searchTerm.length >= 2) {
      return searchArticles(searchTerm);
    }
    return [];
  }, [searchTerm]);
  
  // Détermine la vue à afficher
  const currentView = useMemo(() => {
    if (selectedArticle) return 'article';
    if (selectedCategory) return 'category';
    if (searchTerm.length >= 2) return 'search';
    return 'home';
  }, [selectedArticle, selectedCategory, searchTerm]);
  
  // Handlers
  const handleSelectCategory = (category) => {
    setSelectedCategory(category);
    setSearchTerm('');
  };
  
  const handleSelectArticle = (article) => {
    const fullArticle = getArticleById(article.id) || article;
    setSelectedArticle(fullArticle);
    if (!selectedCategory && fullArticle.categoryId) {
      setSelectedCategory(getCategoryById(fullArticle.categoryId));
    }
  };
  
  const handleBack = () => {
    if (selectedArticle) {
      setSelectedArticle(null);
    } else if (selectedCategory) {
      setSelectedCategory(null);
    }
  };
  
  const handleClearSearch = () => {
    setSearchTerm('');
  };
  
  return (
    <motion.div
      key="help"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-[#191919]">
            {t('helpCenter.title')}
          </h1>
          <p className="text-sm text-[#6B7177] mt-0.5">
            {t('helpCenter.subtitle')}
          </p>
        </div>
      </div>
      
      {/* Barre de recherche */}
      <HelpSearchBar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        onClear={handleClearSearch}
        placeholder={t('helpCenter.searchPlaceholder')}
      />
      
      {/* Contenu principal */}
      <AnimatePresence mode="wait">
        {currentView === 'article' && selectedArticle && (
          <motion.div
            key="article"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <HelpArticle
              article={selectedArticle}
              category={selectedCategory}
              onBack={handleBack}
              backLabel={t('helpCenter.back')}
            />
          </motion.div>
        )}
        
        {currentView === 'category' && selectedCategory && (
          <motion.div
            key="category"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <HelpArticleList
              category={selectedCategory}
              articles={HELP_ARTICLES[selectedCategory.id] || []}
              onSelectArticle={handleSelectArticle}
              onBack={handleBack}
              articlesLabel={t('helpCenter.articles')}
            />
          </motion.div>
        )}
        
        {currentView === 'search' && (
          <motion.div
            key="search"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <SearchResults
              results={searchResults}
              searchTerm={searchTerm}
              onSelectArticle={handleSelectArticle}
              onClear={handleClearSearch}
              resultsLabel={t('helpCenter.results')}
              resultsForLabel={t('helpCenter.resultsFor')}
              clearSearchLabel={t('helpCenter.clearSearch')}
              noResultsLabel={t('helpCenter.noResults')}
            />
          </motion.div>
        )}
        
        {currentView === 'home' && (
          <motion.div
            key="home"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Message d'accueil */}
            <div className="bg-gradient-to-br from-[#191919] to-[#333] rounded-xl p-6 text-white">
              <h2 className="text-xl font-bold mb-2">{t('helpCenter.welcome.title')}</h2>
              <p className="text-white/80 text-sm">
                {t('helpCenter.welcome.description')}
              </p>
            </div>
            
            {/* Grille des catégories */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {HELP_CATEGORIES.map((category, index) => (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <HelpCategoryCard
                    category={category}
                    articleCount={HELP_ARTICLES[category.id]?.length || 0}
                    onClick={() => handleSelectCategory(category)}
                    articlesLabel={t('helpCenter.articles')}
                  />
                </motion.div>
              ))}
            </div>
            
            {/* Articles populaires */}
            <div className="bg-white rounded-xl border-2 border-[#E5E4DF] p-6">
              <h3 className="text-lg font-semibold text-[#191919] mb-4">{t('helpCenter.popularArticles')}</h3>
              <div className="space-y-2">
                {[
                  getArticleById('welcome'),
                  getArticleById('initial-setup'),
                  getArticleById('order-logic'),
                  getArticleById('stock-health-colors'),
                  getArticleById('faq-top')
                ].filter(Boolean).map((article) => (
                  <button
                    key={article.id}
                    onClick={() => handleSelectArticle(article)}
                    className="w-full flex items-center justify-between p-3 hover:bg-[#FAFAF7] rounded-lg transition-colors text-left group"
                  >
                    <span className="text-[#191919] group-hover:font-medium">{article.title}</span>
                    <ChevronRight className="w-4 h-4 text-[#666663] group-hover:translate-x-1 transition-transform" />
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default HelpCenterTab;

