
import { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { PublicServiceSection, PublicServiceFeature, AppointmentItem } from '../types';
import { generateId } from '../utils/helpers';

export const useServiceMenuManager = () => {
    // Consume Global State instead of Local Initial State
    const { catalog, serviceSections, setServiceSections } = useData();
    
    // UI State for Editor
    const [selectedSectionId, setSelectedSectionId] = useState<string>(serviceSections.length > 0 ? serviceSections[0].id : '');
    const [editTab, setEditTab] = useState<'content' | 'design' | 'features'>('content');
    const [serviceSearch, setServiceSearch] = useState('');
    const [newFeature, setNewFeature] = useState<PublicServiceFeature>({ icon: 'star', title: '', description: '' });
    const [isGenerating, setIsGenerating] = useState(false);

    // Derived Data
    const activeSection = useMemo(() => serviceSections.find(s => s.id === selectedSectionId), [serviceSections, selectedSectionId]);

    const linkedServices = useMemo(() => {
        if (!activeSection) return [];
        return activeSection.serviceIds
            .map(id => catalog.find(item => item.id === id))
            .filter((item): item is AppointmentItem => !!item);
    }, [catalog, activeSection]);

    // Available categories for smart filter
    const availableCategories = useMemo(() => {
        const cats = new Set(catalog.filter(i => i.type === 'service').map(i => i.category || 'General'));
        return Array.from(cats);
    }, [catalog]);

    const availableServices = useMemo(() => {
        return catalog
            .filter(i => i.type === 'service')
            .filter(i => i.title.toLowerCase().includes(serviceSearch.toLowerCase()));
    }, [catalog, serviceSearch]);

    // Section Analytics
    const sectionStats = useMemo(() => {
        if (linkedServices.length === 0) return { min: 0, max: 0, avg: 0 };
        const prices = linkedServices.map(s => s.price);
        return {
            min: Math.min(...prices),
            max: Math.max(...prices),
            avg: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)
        };
    }, [linkedServices]);

    // Actions
    const handleAddSection = () => {
        const newSection: PublicServiceSection = {
            id: generateId('SEC'),
            title: 'Nueva Colección',
            description: '',
            layoutType: 'list',
            showPrices: true,
            serviceIds: [],
            variant: 'clean',
            imagePosition: 'top',
            isActive: true // Default visible
        };
        setServiceSections([...serviceSections, newSection]);
        setSelectedSectionId(newSection.id);
        setEditTab('content');
    };

    const updateActiveSection = (field: keyof PublicServiceSection, value: any) => {
        setServiceSections(serviceSections.map(s => s.id === selectedSectionId ? { ...s, [field]: value } : s));
    };

    const reorderSections = (startIndex: number, endIndex: number) => {
        const result = Array.from(serviceSections);
        const [removed] = result.splice(startIndex, 1);
        result.splice(endIndex, 0, removed);
        setServiceSections(result);
    };

    const handleDeleteSection = (id: string) => {
        if (confirm('¿Eliminar esta sección?')) {
            const newSections = serviceSections.filter(s => s.id !== id);
            setServiceSections(newSections);
            if (selectedSectionId === id && newSections.length > 0) {
                setSelectedSectionId(newSections[0].id);
            } else if (newSections.length === 0) {
                setSelectedSectionId('');
            }
        }
    };

    const toggleService = (serviceId: string | number) => {
        if (!activeSection) return;
        const sid = String(serviceId);
        const currentIds = activeSection.serviceIds || [];
        
        let newIds;
        if (currentIds.includes(sid)) {
            newIds = currentIds.filter(id => id !== sid);
        } else {
            newIds = [...currentIds, sid];
        }
        updateActiveSection('serviceIds', newIds);
    };

    // --- Smart Features ---

    const autoSelectByCategory = (category: string) => {
        if (!activeSection) return;
        const servicesInCat = catalog
            .filter(s => s.type === 'service' && s.category === category)
            .map(s => String(s.id));
        
        // Merge with existing avoiding duplicates
        const newIds = Array.from(new Set([...activeSection.serviceIds, ...servicesInCat]));
        updateActiveSection('serviceIds', newIds);
    };

    const clearSelection = () => {
        updateActiveSection('serviceIds', []);
    };

    const generateAIDescription = () => {
        if (!activeSection || linkedServices.length === 0) return;
        
        setIsGenerating(true);
        // Simulate API call delay
        setTimeout(() => {
            const titles = linkedServices.map(s => s.title).join(', ');
            // Simple heuristic to mock "AI" response based on content
            let mockAIResponse = '';
            if (titles.toLowerCase().includes('facial') || titles.toLowerCase().includes('skin')) {
                mockAIResponse = "Revitalize your complexion with our curated selection of facial treatments. From deep cleansing to anti-aging powerhouses, each service is designed to restore your natural glow using premium organic ingredients.";
            } else if (titles.toLowerCase().includes('wax') || titles.toLowerCase().includes('sugar') || titles.toLowerCase().includes('hair')) {
                mockAIResponse = "Experience the smoothest skin of your life. Our gentle hair removal techniques are designed for maximum comfort and long-lasting results, leaving you feeling confident and carefree.";
            } else {
                mockAIResponse = "Discover our exclusive range of treatments tailored to elevate your beauty routine. Personalized care and expert techniques come together to provide you with an unforgettable experience.";
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
        sections: serviceSections,
        selectedSectionId,
        setSelectedSectionId,
        editTab,
        setEditTab,
        serviceSearch,
        setServiceSearch,
        newFeature,
        setNewFeature,
        activeSection,
        linkedServices,
        availableServices,
        availableCategories, // Exported
        sectionStats, // Exported
        isGenerating, // Exported
        handleAddSection,
        updateActiveSection,
        reorderSections, // Exported
        handleDeleteSection,
        toggleService,
        autoSelectByCategory, // Exported
        clearSelection, // Exported
        generateAIDescription, // Exported
        addFeature,
        removeFeature
    };
};
