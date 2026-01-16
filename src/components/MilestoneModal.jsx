
import React from 'react';
import { useMilestone } from '../context/MilestoneContext';
import { useSettings } from '../context/SettingsContext'; // [NEW]
import { Trophy, Check, X } from 'lucide-react';
import { format } from 'date-fns';

const MilestoneModal = () => {
    const { celebration, closeCelebration } = useMilestone();
    const { showMilestoneModal } = useSettings(); // [NEW] Consume setting

    if (!celebration || !showMilestoneModal) return null; // [CHANGED] Check setting

    const { milestone, daysTaken, totalAmount } = celebration;

    const formattedMilestone = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(milestone);

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            zIndex: 10000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(8px)',
            animation: 'fadeIn 0.5s ease-out'
        }}>
            <style>{`
                @keyframes popIn {
                    0% { transform: scale(0.5); opacity: 0; }
                    50% { transform: scale(1.05); }
                    100% { transform: scale(1); opacity: 1; }
                }
                @keyframes float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }
            `}</style>
            <div className="card glass" style={{
                position: 'relative',
                width: '90%', maxWidth: '400px',
                padding: '30px',
                textAlign: 'center',
                borderRadius: '30px',
                border: '2px solid rgba(255, 215, 0, 0.3)', // Gold border
                boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 215, 0, 0.05) 100%)',
                animation: 'popIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards'
            }}>
                {/* Trophy Icon */}
                <div style={{
                    width: '80px', height: '80px',
                    margin: '0 auto 20px',
                    background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                    borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 10px 25px rgba(255, 165, 0, 0.5)',
                    animation: 'float 3s ease-in-out infinite'
                }}>
                    <Trophy size={40} color="white" strokeWidth={2} />
                </div>

                <h2 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '0 0 8px', color: 'var(--color-text-main)', letterSpacing: '-0.5px' }}>
                    Milestone Unlocked!
                </h2>
                <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--color-primary)', textShadow: '0 2px 10px rgba(16, 185, 129, 0.3)' }}>
                    {formattedMilestone}
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '2px', marginTop: '4px', fontWeight: 600 }}>
                    Total Sales Reached
                </div>

                <div style={{
                    marginTop: '24px',
                    padding: '16px',
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    borderRadius: '16px',
                    textAlign: 'left'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                        <div style={{
                            backgroundColor: 'var(--color-success)',
                            padding: '4px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minWidth: '24px',
                            height: '24px',
                            flexShrink: 0
                        }}>
                            <Check size={14} color="white" strokeWidth={3} />
                        </div>
                        <span style={{ fontSize: '0.95rem', color: 'var(--color-text-main)' }}>
                            You hit this in <strong>{daysTaken} days</strong>! 🚀
                        </span>
                    </div>
                </div>

                <button
                    onClick={closeCelebration}
                    className="btn btn-primary"
                    style={{
                        marginTop: '24px',
                        width: '100%',
                        padding: '16px',
                        fontSize: '1rem',
                        fontWeight: 700,
                        borderRadius: '16px',
                        boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)'
                    }}
                >
                    Awesome! 🎉
                </button>
            </div>
        </div>
    );
};

export default MilestoneModal;
