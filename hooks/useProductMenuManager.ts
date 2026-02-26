
import { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { PublicProductSection, PublicServiceFeature, AppointmentItem } from '../types';
import { generateId } from '../utils/helpers';

export const useProductMenuManager = () => {
    // Consume Global State
    const { catalog, productSections, setProductSections } = useData();
    
    // UI State for Editor
    const [selectedSectionId, setSelectedSectionId] = useState<string>(productSections.length > 0 ? productSections[0].id : '');
    const [editTab, setEditTab] = useState<'content' | 'design' | 'features'>('content');
    const [productSearch, setProductSearch] = useState('');
    const [newFeature, setNewFeature] = useState<PublicServiceFeature>({ icon: 'star', title: '', description: '' });
    const [isGenerating, setIsGenerating] = useState(false);

    // Derived Data
    const activeSection = useMemo(() => productSections.find(s => s.id === selectedSectionId), [productSections, selectedSectionId]);

    const linkedProducts = useMemo(() => {
        if (!activeSection) return [];
        return activeSection.productIds
            .map(id => catalog.find(item => item.id === id))
            .filter((item): item is AppointmentItem => !!item);
    }, [catalog, activeSection]);

    // Available categories for smart filter (PRODUCTS ONLY)
    const availableCategories = useMemo(() => {
        const cats = new Set(catalog.filter(i => i.type === 'product' && (i.subtype === 'retail' || i.subtype === 'both')).map(i => i.category || 'General'));
        return Array.from(cats);
    }, [catalog]);

    const availableProducts = useMemo(() => {
        return catalog
            .filter(i => i.type === 'product' && (i.subtype === 'retail' || i.subtype === 'both'))
            .filter(i => i.title.toLowerCase().includes(productSearch.toLowerCase()));
    }, [catalog, productSearch]);

    // Section Analytics
    const sectionStats = useMemo(() => {
        if (linkedProducts.length === 0) return { min: 0, max: 0, avg: 0 };
        const prices = linkedProducts.map(s => s.price);
        return {
            min: Math.min(...prices),
            max: Math.max(...prices),
            avg: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)
        };
    }, [linkedProducts]);

    // Actions
    const handleAddSection = () => {
        const newSection: PublicProductSection = {
            id: generateId('SEC-PROD'),
            title: 'Nueva Colección',
            description: '',
            layoutType: 'grid_4',
            showPrices: true,
            productIds: [],
            variant: 'clean',
            imagePosition: 'top',
            isActive: true // Default visible
        };
        setProductSections([...productSections, newSection]);
        setSelectedSectionId(newSection.id);
        setEditTab('content');
    };

    const updateActiveSection = (field: keyof PublicProductSection, value: any) => {
        setProductSections(productSections.map(s => s.id === selectedSectionId ? { ...s, [field]: value } : s));
    };

    const reorderSections = (startIndex: number, endIndex: number) => {
        const result = Array.from(productSections);
        const [removed] = result.splice(startIndex, 1);
        result.splice(endIndex, 0, removed);
        setProductSections(result);
    };

    const handleDeleteSection = (id: string) => {
        if (confirm('¿Eliminar esta colección de productos?')) {
            const newSections = productSections.filter(s => s.id !== id);
            setProductSections(newSections);
            if (selectedSectionId === id && newSections.length > 0) {
                setSelectedSectionId(newSections[0].id);
            } else if (newSections.length === 0) {
                setSelectedSectionId('');
            }
        }
    };

    const toggleProduct = (productId: string | number) => {
        if (!activeSection) return;
        const pid = String(productId);
        const currentIds = activeSection.productIds || [];
        
        let newIds;
        if (currentIds.includes(pid)) {
            newIds = currentIds.filter(id => id !== pid);
        } else {
            newIds = [...currentIds, pid];
        }
        updateActiveSection('productIds', newIds);
    };

    // --- Smart Features ---

    const autoSelectByCategory = (category: string) => {
        if (!activeSection) return;
        const productsInCat = catalog
            .filter(s => s.type === 'product' && (s.subtype === 'retail' || s.subtype === 'both') && s.category === category)
            .map(s => String(s.id));
        
        // Merge with existing avoiding duplicates
        const newIds = Array.from(new Set([...activeSection.productIds, ...productsInCat]));
        updateActiveSection('productIds', newIds);
    };

    const clearSelection = () => {
        updateActiveSection('productIds', []);
    };

    const generateAIDescription = () => {
        if (!activeSection || linkedProducts.length === 0) return;
        
        setIsGenerating(true);
        // Simulate API call delay
        setTimeout(() => {
            const titles = linkedProducts.map(s => s.title).join(', ');
            let mockAIResponse = '';
            // Simple heuristic for products
            if (titles.toLowerCase().includes('cream') || titles.toLowerCase().includes('serum') || titles.toLowerCase().includes('skin')) {
                mockAIResponse = "Elevate your home care routine with our curated skincare essentials. Formulated with potent active ingredients to maintain that post-facial glow every single day.";
            } else if (titles.toLowerCase().includes('hair') || titles.toLowerCase().includes('shampoo')) {
                mockAIResponse = "Professional-grade hair care to keep your locks luscious and healthy. From extensions maintenance to daily nourishment, we've got you covered.";
            } else {
                mockAIResponse = "Discover our exclusive collection of beauty essentials. Hand-picked by our experts to ensure you have the best tools for your self-care rituals.";
            }
            
            updateActiveSection('description', mockAIResponse);
            setIsGenerating(false);
        }, 1200);
    };

    // Feature Management
    const addFeature = () => {
        if (activeSection && newFeature.title) {
            const currentFeatures = activeSection.features || [];
            updateActiveSection('features', [...currentFeatures, newFeature]);
            setNewFeature({ icon: 'star', title: '', description: '' });
        }
    };

    const removeFeature = (idx: number) => {
        if (activeSection && activeSection.features) {
            const updated = activeSection.features.filter((_, i) => i !== idx);
            updateActiveSection('features', updated);
        }
    };

    return {
        sections: productSections,
        selectedSectionId,
        setSelectedSectionId,
        editTab,
        setEditTab,
        productSearch,
        setProductSearch,
        newFeature,
        setNewFeature,
        activeSection,
        linkedProducts,
        availableProducts,
        availableCategories, // Exported
        sectionStats, // Exported
        isGenerating, // Exported
        handleAddSection,
        updateActiveSection,
        reorderSections, // Exported
        handleDeleteSection,
        toggleProduct,
        autoSelectByCategory, // Exported
        clearSelection, // Exported
        generateAIDescription, // Exported
        addFeature,
        removeFeature
    };
};
