import React, { useState, useRef, Suspense, useMemo, useEffect } from 'react';
import {
    Plus, Edit2, Trash2, UtensilsCrossed, Camera, Image as ImageIcon,
    Loader2, Search, LayoutGrid, List, X, Save, Package, AlertTriangle
} from 'lucide-react';
import Modal from './Modal';
import ProfileMenu from './ProfileMenu';
import { useInventory } from '../context/InventoryContext';
import { toTitleCase, getSmartEmoji } from '../utils/smartHelpers';
import { triggerHaptic } from '../utils/haptics';

// Lazy load the heavy AI component
const ImageReviewer = React.lazy(() => import('./ImageReviewer'));

const Inventory = () => {
    const { items, addItem, updateItem, deleteItem } = useInventory();

    // UI State
    const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit'

    const [currentItem, setCurrentItem] = useState(null); // Item being edited
    const [suggestedEmoji, setSuggestedEmoji] = useState('');

    // Delete Confirmation State
    const [deleteConfirmation, setDeleteConfirmation] = useState({ show: false, itemId: null, itemName: '' });

    // Mobile Detection
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Global Paste Listener for Seamless Image Upload
    useEffect(() => {
        const handleGlobalPaste = (e) => {
            if (!isModalOpen) return;

            // Do not intercept if typing in a text field
            const target = e.target;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

            const items = e.clipboardData.items;
            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                    const file = items[i].getAsFile();
                    setSelectedFile(file);
                    e.preventDefault();
                    break;
                }
            }
        };

        window.addEventListener('paste', handleGlobalPaste);
        return () => window.removeEventListener('paste', handleGlobalPaste);
    }, [isModalOpen]);

    const [selectedFile, setSelectedFile] = useState(null);
    const fileInputRef = useRef(null);

    // Categories derived from items + static defaults
    const categories = useMemo(() => {
        const derivedCategories = items.map(i => i.category);
        const defaultCategories = ['Cakes', 'Pastries', 'Snacks', 'Drinks'];
        const unique = new Set([...defaultCategories, ...derivedCategories]);
        return ['All', ...Array.from(unique)];
    }, [items]);

    // Filter Logic
    const filteredItems = useMemo(() => {
        return items.filter(item => {
            const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.category.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }, [items, searchTerm, selectedCategory]);

    // --- Actions ---

    function handleEditClick(item) {
        triggerHaptic('light');
        setCurrentItem({ ...item }); // Clone to avoid direct mutation
        setModalMode('edit');
        setIsModalOpen(true);
    }

    function handleAddClick() {
        triggerHaptic('medium');
        setCurrentItem({
            name: '',
            category: 'Cakes',
            price: '',
            stock: 10,
            image: '',
            imageZoom: 1.0,
            imageFit: 'cover'
        });
        setModalMode('add');
        setIsModalOpen(true);
    }

    function handleDeleteClick(item) {
        triggerHaptic('medium');
        setDeleteConfirmation({
            show: true,
            itemId: item.id,
            itemName: item.name
        });
    }

    function confirmDelete() {
        if (deleteConfirmation.itemId) {
            triggerHaptic('heavy');
            deleteItem(deleteConfirmation.itemId);
            setDeleteConfirmation({ show: false, itemId: null, itemName: '' });
        }
    }

    function handleSaveItem() {
        if (!currentItem.name || !currentItem.price) {
            alert("Name and Price are required!");
            return;
        }

        const itemData = {
            ...currentItem,
            name: toTitleCase(currentItem.name), // Auto-Format
            price: parseFloat(currentItem.price),
            stock: parseInt(currentItem.stock) || 0,
            image: currentItem.image || getSmartEmoji(currentItem.name, currentItem.category) // Smart Emoji
        };

        if (modalMode === 'add') {
            addItem(itemData);
        } else {
            updateItem(itemData.id, itemData);
        }
        triggerHaptic('success');
        setIsModalOpen(false);
    }


    // --- Emoji Suggestions ---
    useEffect(() => {
        if (currentItem && (currentItem.name || currentItem.category)) {
            const suggestion = getSmartEmoji(currentItem.name, currentItem.category);
            setSuggestedEmoji(suggestion);
        } else {
            setSuggestedEmoji('');
        }
    }, [currentItem?.name, currentItem?.category]);


    // Image Handlers
    const triggerImageUpload = () => fileInputRef.current.click();

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleImageProcessed = (base64Image) => {
        // Update currentItem in state
        setCurrentItem(prev => ({ ...prev, image: base64Image }));

        // If this was a quick edit (not in main modal), save immediately
        if (!isModalOpen && currentItem?.id) {
            updateItem(currentItem.id, {
                image: base64Image,
                imageZoom: currentItem.imageZoom || 1.0,
                imageFit: currentItem.imageFit || 'cover'
            });
        }

        setSelectedFile(null); // Close ImageReviewer
    };

    // Quick Image Edit from Card
    const handleQuickImageEdit = (item) => {
        setCurrentItem(item);
        triggerImageUpload();
    };


    // --- Mobile Inventory Card ---
    const MobileInventoryCard = ({ item }) => (
        <div className="card card-hover" style={{
            padding: '12px',
            display: 'flex', flexDirection: 'column', gap: '10px',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '20px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
            position: 'relative'
        }}>
            {/* Image/Emoji Area */}
            <div
                onClick={() => handleQuickImageEdit(item)}
                style={{
                    height: '110px',
                    width: '100%',
                    borderRadius: '16px',
                    background: 'var(--color-bg-secondary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    overflow: 'hidden',
                    position: 'relative',
                    cursor: 'pointer'
                }}
            >
                {item.image && item.image.length > 5 ? (
                    <img
                        src={item.image}
                        alt={item.name}
                        style={{
                            width: '100%', height: '100%',
                            objectFit: item.imageFit || 'cover',
                            transform: `scale(${item.imageZoom || 1})`,
                            transition: 'transform 0.2s'
                        }}
                    />
                ) : (
                    <span style={{ fontSize: '2.5rem', transform: `scale(${item.imageZoom || 1})` }}>{item.image || '📦'}</span>
                )}

                {/* Edit Icon Overlay (Invisible until Hover/Tap) */}
                <div
                    className="hover-edit"
                    style={{
                        position: 'absolute', inset: 0,
                        background: 'rgba(0,0,0,0.4)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        opacity: 0, transition: 'opacity 0.2s',
                        borderRadius: '16px'
                    }}
                >
                    <Camera size={28} color="white" />
                </div>
            </div>

            {/* Content Area */}
            <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text-primary)', marginBottom: '2px' }}>{item.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '8px' }}>{item.category}</div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--color-text-primary)' }}>₹{item.price}</div>
                    <div style={{
                        fontSize: '0.75rem',
                        padding: '4px 10px',
                        borderRadius: '20px',
                        background: item.stock < 5 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                        color: item.stock < 5 ? '#ef4444' : '#22c55e',
                        fontWeight: 700
                    }}>
                        {item.stock} left
                    </div>
                </div>
            </div>

            {/* Actions Bar */}
            <div style={{ display: 'flex', gap: '8px', paddingTop: '10px', borderTop: '1px solid var(--color-border)' }}>
                <button
                    onClick={() => handleEditClick(item)}
                    style={{ flex: 1, padding: '10px', borderRadius: '12px', border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', display: 'flex', justifyContent: 'center', transition: 'all 0.2s' }}
                    className="hover-bg-muted"
                >
                    <Edit2 size={18} color="var(--color-text-primary)" />
                </button>
                <button
                    onClick={() => handleDeleteClick(item)}
                    style={{ flex: 1, padding: '10px', borderRadius: '12px', border: 'none', background: 'rgba(239, 68, 68, 0.08)', color: '#ef4444', cursor: 'pointer', display: 'flex', justifyContent: 'center' }}
                >
                    <Trash2 size={18} />
                </button>
            </div>
        </div>
    );


    return (
        <div className="container" style={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            maxWidth: '100%', // Full width as requested
            margin: '0 auto'
        }}>

            {/* --- Header Controls (Search etc) --- */}
            <div style={{
                marginBottom: isMobile ? '16px' : '20px',
                flexShrink: 0,
                padding: '0 16px', // Reduced padding
                marginTop: '10px'  // Reduced margin
            }}>
                {isMobile ? (
                    // MOBILE HEADER
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

                        {/* Top Row: Title + Profile (Right Corner) */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>Menu & Stock</h1>
                            <ProfileMenu />
                        </div>

                        {/* Row 2: Search Bar + Add Button Inline */}
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <div style={{ position: 'relative', flex: 1 }}>
                                <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                                <input
                                    type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                                    style={{
                                        width: '100%', padding: '12px 16px 12px 42px', borderRadius: '14px', border: '1px solid var(--color-border)',
                                        background: 'var(--color-surface)', color: 'var(--color-text-primary)', fontSize: '0.95rem', outline: 'none'
                                    }}
                                />
                            </div>
                            <button
                                onClick={handleAddClick}
                                style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    background: 'var(--color-primary)', color: 'white', border: 'none',
                                    padding: '0 16px', borderRadius: '14px',
                                    boxShadow: '0 4px 12px rgba(34, 197, 94, 0.2)',
                                    cursor: 'pointer'
                                }}
                            >
                                <Plus size={20} />
                            </button>
                        </div>

                        {/* Categories */}
                        <div className="hide-scrollbar" style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '4px' }}>
                            {categories.map(cat => (
                                <button
                                    key={cat} onClick={() => {
                                        triggerHaptic('light');
                                        setSelectedCategory(cat);
                                    }}
                                    style={{
                                        padding: '8px 20px', borderRadius: '25px', border: '1px solid',
                                        borderColor: selectedCategory === cat ? 'var(--color-primary)' : 'var(--color-border)',
                                        background: selectedCategory === cat ? 'var(--color-primary)' : 'var(--color-surface)',
                                        color: selectedCategory === cat ? 'white' : 'var(--color-text-muted)',
                                        fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap'
                                    }}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    // DESKTOP HEADER
                    <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                            <h1 style={{ fontSize: '1.8rem', fontWeight: 700, margin: 0 }}>Menu & Inventory</h1>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <div style={{ background: 'var(--color-bg-secondary)', borderRadius: '12px', padding: '4px', display: 'flex' }}>
                                    <button
                                        onClick={() => setViewMode('grid')}
                                        style={{
                                            padding: '8px', borderRadius: '8px',
                                            background: viewMode === 'grid' ? 'var(--color-bg-surface)' : 'transparent',
                                            color: viewMode === 'grid' ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                                            boxShadow: viewMode === 'grid' ? '0 2px 5px rgba(0,0,0,0.1)' : 'none', border: 'none', cursor: 'pointer'
                                        }}
                                    >
                                        <LayoutGrid size={20} />
                                    </button>
                                    <button
                                        onClick={() => setViewMode('table')}
                                        style={{
                                            padding: '8px', borderRadius: '8px',
                                            background: viewMode === 'table' ? 'var(--color-bg-surface)' : 'transparent',
                                            color: viewMode === 'table' ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                                            boxShadow: viewMode === 'table' ? '0 2px 5px rgba(0,0,0,0.1)' : 'none', border: 'none', cursor: 'pointer'
                                        }}
                                    >
                                        <List size={20} />
                                    </button>
                                </div>
                                <button
                                    onClick={handleAddClick}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '8px',
                                        background: 'var(--color-primary)', color: 'white',
                                        border: 'none', padding: '10px 20px', borderRadius: '12px',
                                        fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer',
                                        boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)'
                                    }}
                                >
                                    <Plus size={20} /> Add Item
                                </button>
                                <ProfileMenu />
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                            <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
                                <Search size={20} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                                <input
                                    type="text" placeholder="Search items..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                                    style={{
                                        width: '100%', padding: '12px 12px 12px 44px', borderRadius: '12px', border: '1px solid var(--color-border)',
                                        background: 'var(--color-bg-input)', color: 'var(--color-text-main)', fontSize: '1rem', outline: 'none'
                                    }}
                                />
                            </div>
                            <div className="hide-scrollbar" style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', maxWidth: '100%' }}>
                                {categories.map(cat => (
                                    <button
                                        key={cat} onClick={() => {
                                            triggerHaptic('light');
                                            setSelectedCategory(cat);
                                        }}
                                        style={{
                                            padding: '8px 16px', borderRadius: '20px', border: '1px solid',
                                            borderColor: selectedCategory === cat ? 'var(--color-primary)' : 'var(--color-border)',
                                            background: selectedCategory === cat ? 'var(--color-primary)' : 'var(--color-bg-surface)',
                                            color: selectedCategory === cat ? 'white' : 'var(--color-text-secondary)',
                                            fontSize: '0.9rem', whiteSpace: 'nowrap'
                                        }}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </>
                )
                }
            </div >

            <style>{`
                .card-hover { transition: transform 0.2s, box-shadow 0.2s; }
                .card-hover:hover { transform: translateY(-3px); box-shadow: 0 10px 25px rgba(0,0,0,0.05) !important; }
                .hover-edit:hover { opacity: 1 !important; }
                .hide-scrollbar::-webkit-scrollbar { display: none; }
                .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>

            {/* --- Content Area --- */}
            <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '0 20px 100px 20px' : '0 20px 120px 20px', minHeight: 0 }}>
                {filteredItems.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px', color: 'var(--color-text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <Package size={64} style={{ opacity: 0.1, marginBottom: '20px' }} />
                        <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>No items found</div>
                        {searchTerm && (
                            <button
                                onClick={() => {
                                    handleAddClick();
                                    setCurrentItem(prev => ({ ...prev, name: toTitleCase(searchTerm) }));
                                }}
                                style={{
                                    marginTop: '16px',
                                    padding: '10px 20px',
                                    borderRadius: '12px',
                                    background: 'var(--color-primary)',
                                    color: 'white',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontWeight: 600,
                                    boxShadow: '0 4px 15px rgba(76, 175, 80, 0.3)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    animation: 'fadeIn 0.3s ease-out'
                                }}
                            >
                                <Plus size={18} />
                                Add "{toTitleCase(searchTerm)}" to menu?
                            </button>
                        )}
                    </div>
                ) : (
                    isMobile ? (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', animation: 'fadeIn 0.4s ease-out' }}>
                            {filteredItems.map(item => (
                                <MobileInventoryCard key={item.id} item={item} />
                            ))}
                        </div>
                    ) : (
                        viewMode === 'grid' ? (
                            // DESKTOP GRID (Restored Original)
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px' }}>
                                {filteredItems.map(item => (
                                    <div key={item.id} className="card card-hover" style={{
                                        padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px',
                                        background: 'var(--color-bg-glass-input)', backdropFilter: 'blur(12px)',
                                        border: '1px solid var(--color-border)', borderRadius: '16px'
                                    }}>
                                        <div
                                            onClick={() => handleQuickImageEdit(item)}
                                            style={{
                                                height: '100px', width: '100%', borderRadius: '12px', background: 'var(--color-bg-secondary)',
                                                overflow: 'hidden', position: 'relative', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                padding: `${item.imagePadding || 0}px`
                                            }}
                                        >
                                            {item.image && item.image.length > 5 ? (
                                                <img
                                                    src={item.image}
                                                    alt={item.name}
                                                    style={{
                                                        width: '100%', height: '100%',
                                                        objectFit: item.imageFit || 'cover',
                                                        transform: `scale(${item.imageZoom || 1})`,
                                                        transition: 'transform 0.2s'
                                                    }}
                                                />
                                            ) : (
                                                <span style={{ fontSize: '2rem', transform: `scale(${item.imageZoom || 1})` }}>
                                                    {item.image || <UtensilsCrossed size={24} color="var(--color-text-muted)" />}
                                                </span>
                                            )}
                                            <div className="hover-edit" style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }}>
                                                <Camera size={20} color="white" />
                                            </div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>{item.name}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{item.category}</div>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                                            <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>₹{item.price}</div>
                                            <div style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '8px', background: item.stock < 5 ? '#ffebee' : '#e8f5e9', color: item.stock < 5 ? '#c62828' : '#2e7d32', fontWeight: 600 }}>{item.stock} left</div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px', paddingTop: '8px', borderTop: '1px solid var(--color-border)' }}>
                                            <button onClick={() => handleEditClick(item)} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', background: 'var(--color-bg-surface)', cursor: 'pointer', display: 'flex', justifyContent: 'center' }}><Edit2 size={18} color="var(--color-text-primary)" /></button>
                                            <button onClick={() => handleDeleteClick(item)} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', background: 'rgba(255,0,0,0.1)', color: 'var(--color-danger)', cursor: 'pointer', display: 'flex', justifyContent: 'center' }}><Trash2 size={18} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            // DESKTOP TABLE (Restored Original)
                            <div className="table-responsive" style={{ background: 'var(--color-bg-glass-input)', backdropFilter: 'blur(12px)', borderRadius: '12px', border: '1px solid var(--color-border)', overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                    <thead style={{ background: 'var(--color-bg-surface)', borderBottom: '1px solid var(--color-border)', position: 'sticky', top: 0, zIndex: 10 }}>
                                        <tr><th style={{ padding: '16px' }}>Item</th><th style={{ padding: '16px' }}>Category</th><th style={{ padding: '16px' }}>Price</th><th style={{ padding: '16px' }}>Stock</th><th style={{ padding: '16px', textAlign: 'right' }}>Actions</th></tr>
                                    </thead>
                                    <tbody>
                                        {filteredItems.map(item => (
                                            <tr key={item.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                                <td style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'var(--color-bg-secondary)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                                                        {item.image && item.image.length > 5 ? (
                                                            <img
                                                                src={item.image}
                                                                alt=""
                                                                style={{
                                                                    width: '100%', height: '100%',
                                                                    objectFit: 'cover',
                                                                    transform: `scale(${item.imageZoom || 1})`
                                                                }}
                                                            />
                                                        ) : (
                                                            <span style={{ transform: `scale(${item.imageZoom || 1})` }}>
                                                                {item.image || <UtensilsCrossed size={16} />}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span style={{ fontWeight: 600 }}>{item.name}</span>
                                                </td>
                                                <td style={{ padding: '16px', color: 'var(--color-text-muted)' }}>{item.category}</td>
                                                <td style={{ padding: '16px', fontWeight: 600 }}>₹{item.price}</td>
                                                <td style={{ padding: '16px' }}><span style={{ fontSize: '0.85rem', padding: '4px 8px', borderRadius: '12px', background: item.stock < 5 ? '#ffebee' : '#e8f5e9', color: item.stock < 5 ? '#c62828' : '#2e7d32', fontWeight: 600 }}>{item.stock}</span></td>
                                                <td style={{ padding: '16px', textAlign: 'right' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                                        <button onClick={() => handleEditClick(item)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}><Edit2 size={16} /></button>
                                                        <button onClick={() => handleDeleteClick(item)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-danger)' }}><Trash2 size={16} /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )
                    )
                )}
            </div>

            {/* --- Modals --- */}

            {/* ADD / EDIT ITEM MODAL */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalMode === 'add' ? 'Add New Item' : 'Edit Item'}>
                {currentItem && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                        {/* Image Preview / Upload */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                            <div
                                onClick={triggerImageUpload}
                                onPaste={(e) => {
                                    const items = e.clipboardData.items;
                                    for (let i = 0; i < items.length; i++) {
                                        if (items[i].type.indexOf('image') !== -1) {
                                            const file = items[i].getAsFile();
                                            setSelectedFile(file);
                                            e.preventDefault();
                                            break;
                                        }
                                    }
                                }}
                                tabIndex={0}
                                style={{
                                    width: '120px', height: '120px',
                                    borderRadius: '16px',
                                    background: 'var(--color-bg-secondary)',
                                    border: '2px dashed var(--color-border)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: 'pointer', overflow: 'hidden', position: 'relative',
                                    outline: 'none',
                                }}
                            >
                                {currentItem.image && currentItem.image.length > 5 ? (
                                    <img
                                        src={currentItem.image}
                                        alt="Preview"
                                        style={{
                                            width: '100%', height: '100%',
                                            objectFit: currentItem.imageFit || 'cover', // Apply fit
                                            transform: `scale(${currentItem.imageZoom || 1})`,
                                            transition: 'transform 0.2s'
                                        }}
                                    />
                                ) : currentItem.image ? (
                                    <span style={{ fontSize: '2.5rem', transform: `scale(${currentItem.imageZoom || 1})` }}>{currentItem.image}</span>
                                ) : (
                                    <Camera size={28} color="var(--color-text-muted)" />
                                )}
                            </div>

                            {/* Suggested Emoji (if no image/emoji) */}
                            {suggestedEmoji && (!currentItem.image || currentItem.image.length < 5) && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', animation: 'fadeIn 0.3s ease-out' }}>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Try:</span>
                                    <button
                                        type="button"
                                        onClick={() => setCurrentItem(prev => ({ ...prev, image: suggestedEmoji }))}
                                        style={{
                                            padding: '4px 10px',
                                            borderRadius: '20px',
                                            border: '1px solid var(--color-primary)',
                                            background: 'rgba(76, 175, 80, 0.1)',
                                            color: 'var(--color-primary)',
                                            fontSize: '0.9rem',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px'
                                        }}
                                    >
                                        <span>{suggestedEmoji}</span>
                                        <Plus size={14} />
                                    </button>
                                </div>
                            )}
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', width: '100%', justifyContent: 'center' }}>
                                {/* Fit Toggle */}
                                <div style={{ display: 'flex', background: 'var(--color-bg-secondary)', borderRadius: '8px', padding: '2px' }}>
                                    <button
                                        type="button"
                                        onClick={() => setCurrentItem(prev => ({ ...prev, imageFit: 'cover' }))}
                                        style={{
                                            padding: '4px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '0.8rem',
                                            background: (currentItem.imageFit || 'cover') === 'cover' ? 'var(--color-bg-surface)' : 'transparent',
                                            color: (currentItem.imageFit || 'cover') === 'cover' ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                                            boxShadow: (currentItem.imageFit || 'cover') === 'cover' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                                        }}
                                    >Fill</button>
                                    <button
                                        type="button"
                                        onClick={() => setCurrentItem(prev => ({ ...prev, imageFit: 'contain' }))}
                                        style={{
                                            padding: '4px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '0.8rem',
                                            background: currentItem.imageFit === 'contain' ? 'var(--color-bg-surface)' : 'transparent',
                                            color: currentItem.imageFit === 'contain' ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                                            boxShadow: currentItem.imageFit === 'contain' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                                        }}
                                    >Fit</button>
                                </div>
                                {/* Zoom (Scale) Slider */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Zoom</span>
                                    <input
                                        type="range"
                                        min="0.5" max="2.0" step="0.1"
                                        value={currentItem.imageZoom || 1.0}
                                        onChange={(e) => setCurrentItem(prev => ({ ...prev, imageZoom: parseFloat(e.target.value) }))}
                                        style={{ width: '60px', accentColor: 'var(--color-primary)' }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Name */}
                        <div>
                            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-main)', marginBottom: '6px' }}>Item Name</label>
                            <input
                                value={currentItem.name}
                                onChange={e => setCurrentItem({ ...currentItem, name: e.target.value })}
                                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg-glass-input)', color: 'var(--color-text-primary)' }}
                                placeholder="e.g. Chocolate Truffle"
                            />
                        </div>

                        {/* Row: Price & Stock */}
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-main)', marginBottom: '6px' }}>Price (₹)</label>
                                <input
                                    type="number"
                                    value={currentItem.price}
                                    onChange={e => setCurrentItem({ ...currentItem, price: e.target.value })}
                                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg-glass-input)', color: 'var(--color-text-primary)' }}
                                    placeholder="0"
                                />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-main)', marginBottom: '6px' }}>Stock Qty</label>
                                <input
                                    type="number"
                                    value={currentItem.stock}
                                    onChange={e => setCurrentItem({ ...currentItem, stock: e.target.value })}
                                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg-glass-input)', color: 'var(--color-text-primary)' }}
                                    placeholder="0"
                                />
                            </div>
                        </div>

                        {/* Category */}
                        <div>
                            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-main)', marginBottom: '6px' }}>Category</label>
                            <input
                                value={currentItem.category}
                                onChange={e => setCurrentItem({ ...currentItem, category: e.target.value })}
                                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg-glass-input)', color: 'var(--color-text-primary)', marginBottom: '8px' }}
                                placeholder="Type or select category..."
                            />
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                {categories.filter(c => c !== 'All').map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setCurrentItem({ ...currentItem, category: cat })}
                                        style={{
                                            padding: '4px 12px', borderRadius: '16px', border: '1px solid var(--color-border)',
                                            background: currentItem.category === cat ? 'var(--color-primary)' : 'rgba(0,0,0,0.03)',
                                            color: currentItem.category === cat ? 'white' : 'var(--color-text-muted)',
                                            cursor: 'pointer', fontSize: '0.75rem', fontWeight: 500
                                        }}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={handleSaveItem}
                            className="btn btn-primary"
                            style={{ padding: '14px', marginTop: '10px', borderRadius: '12px', fontWeight: 700, display: 'flex', justifyContent: 'center', gap: '8px' }}
                        >
                            <Save size={18} /> {modalMode === 'add' ? 'Create Item' : 'Save Changes'}
                        </button>

                    </div>
                )}
            </Modal>

            {/* Hidden: Image Editor Modal (reused from logic) */}
            <Modal isOpen={!!selectedFile} onClose={() => { setSelectedFile(null); }} title="Edit Image">
                {selectedFile && (
                    <Suspense fallback={<div className="p-4 text-center">Loading AI...</div>}>
                        <ImageReviewer
                            file={selectedFile}
                            onConfirm={handleImageProcessed}
                            onCancel={() => setSelectedFile(null)}
                        />
                    </Suspense>
                )}
            </Modal>

            {/* Delete Confirmation Modal */}
            {
                deleteConfirmation.show && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.4)',
                        backdropFilter: 'blur(8px)',
                        zIndex: 10000,
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <div className="glass" style={{
                            width: '85%', maxWidth: '320px', padding: '24px',
                            borderRadius: '24px',
                            border: '1px solid rgba(255,255,255,0.2)',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                            textAlign: 'center',
                            background: 'rgba(255, 255, 255, 0.1)' // Fallback glass
                        }}>
                            <div style={{ color: 'var(--color-danger)', marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
                                <AlertTriangle size={48} />
                            </div>
                            <h3 style={{ fontSize: '1.25rem', marginBottom: '8px', fontWeight: 700, color: 'var(--color-text-main)' }}>Delete Item?</h3>
                            <p style={{ color: 'var(--color-text-muted)', marginBottom: '24px', lineHeight: 1.5, fontSize: '0.95rem' }}>
                                Are you sure you want to delete <span style={{ fontWeight: 700, color: 'var(--color-text-main)' }}>"{deleteConfirmation.itemName}"</span>? This action cannot be undone.
                            </p>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button
                                    onClick={() => setDeleteConfirmation({ show: false, itemId: null, itemName: '' })}
                                    className="btn"
                                    style={{
                                        flex: 1,
                                        backgroundColor: 'rgba(0,0,0,0.05)',
                                        color: 'var(--color-text-main)',
                                        borderRadius: '12px',
                                        padding: '12px',
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontWeight: 600
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="btn"
                                    style={{
                                        flex: 1,
                                        backgroundColor: 'var(--color-danger)',
                                        color: 'white',
                                        borderRadius: '12px',
                                        padding: '12px',
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontWeight: 600,
                                        boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
                                    }}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
            {/* Hidden: File Input for Image Upload */}
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                style={{ display: 'none' }}
            />
        </div >
    );
};

export default Inventory;
