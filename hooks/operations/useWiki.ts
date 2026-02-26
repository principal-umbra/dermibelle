
import { useState } from 'react';
import { useData } from '../../context/DataContext';

export const useWiki = () => {
  const { wikiArticles } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredArticles = wikiArticles.filter(a => {
      const matchSearch = a.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCat = selectedCategory ? a.category === selectedCategory : true;
      return matchSearch && matchCat;
  });

  return {
    articles: filteredArticles,
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory
  };
};
