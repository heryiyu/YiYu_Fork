import React, { useState, useEffect, useRef } from 'react';
import { SevenStepsMap } from './SevenStepsMap';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { CloseButton } from './ui/CloseButton';
import { motion, useReducedMotion } from 'framer-motion';
import './Guide.css';

const ManualSection = () => {
    const shouldReduceMotion = useReducedMotion();
    const { isAdmin } = useGame();
    const [view, setView] = useState('MENU'); // MENU | SEVEN_STEPS | BIND_RELEASE | SCRIPTURES | CARDS | PRAYERS
    const [selectedId, setSelectedId] = useState(null);
    const [activeScripture, setActiveScripture] = useState(null); // New state for Scriptures

    const allMenuItems = [
        { id: 'SEVEN_STEPS', label: '領人歸主七招', icon: '🗺️' },
        { id: 'BIND_RELEASE', label: '五綑綁五釋放', icon: '🤲' },
        { id: 'SCRIPTURES', label: '七經文', icon: '📖', wip: true },
        { id: 'CARDS', label: '天父小卡', icon: '💌', wip: true },
        { id: 'PRAYERS', label: '認領禱告詞範例', icon: '🙏' },
    ];

    const menuItems = isAdmin ? allMenuItems : allMenuItems.filter(item => !item.wip);

    const handleItemClick = (id) => {
        setSelectedId(id);
        setTimeout(() => {
            setView(id);
            setSelectedId(null);
        }, 600); // Wait for animation
    };

    if (view === 'MENU') {
        return (
            <div className="guide-menu">
                <p className="guide-menu-hint">
                    點擊卷軸領取秘笈
                </p>
                <div className="guide-menu-grid">
                    {menuItems.map((item, index) => (
                        <motion.button
                            key={item.id}
                            onClick={() => handleItemClick(item.id)}
                            layout={!shouldReduceMotion}
                            initial={{ scale: 1, opacity: 0 }}
                            animate={{
                                scale: selectedId === item.id && !shouldReduceMotion ? 1.15 : 1,
                                opacity: 1,
                                filter: selectedId === item.id && !shouldReduceMotion ? 'brightness(1.2)' : 'brightness(1)',
                                zIndex: selectedId === item.id ? 10 : 1
                            }}
                            whileHover={!shouldReduceMotion ? { scale: 1.05 } : undefined}
                            whileTap={!shouldReduceMotion ? { scale: 0.95 } : undefined}
                            transition={{ duration: shouldReduceMotion ? 0 : 0.3 }}
                            className="guide-menu-btn"
                            style={{
                                gridColumn: (menuItems.length % 2 !== 0 && index === menuItems.length - 1) ? '1 / -1' : 'auto',
                                width: (menuItems.length % 2 !== 0 && index === menuItems.length - 1) ? '50%' : '100%'
                            }}
                        >
                            <motion.img
                                src="/assets/manual_scroll.png"
                                alt={item.label}
                                style={{
                                    width: '100%',
                                    maxWidth: '100px',
                                    filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))'
                                }}
                                animate={selectedId === item.id && !shouldReduceMotion ? {
                                    rotate: [0, -5, 5, -5, 5, 0],
                                    transition: { duration: 0.5 }
                                } : {}}
                            />
                            <span className="guide-menu-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                {item.label}
                                {item.wip && <span style={{ fontSize: '0.6rem', background: 'var(--palette-orange-action)', color: '#fff', padding: '2px 4px', borderRadius: '4px' }}>WIP</span>}
                            </span>
                        </motion.button>
                    ))}
                </div>
            </div>
        );
    }

    const renderContent = () => {
        switch (view) {
            case 'SEVEN_STEPS':
                return <SevenStepsMap />;
            case 'BIND_RELEASE':
                return (
                    <div className="guide-section">
                        <h4 style={{ textAlign: 'center', marginBottom: '8px' }}>🤲 五釋放五綑綁</h4>

                        <div className="guide-box-success">
                            <h5 className="guide-box-title-success">✅ 5個釋放 BLESS</h5>
                            <ul className="guide-list">
                                <li><strong>Body:</strong> 身體健康、喜樂平安</li>
                                <li><strong>Labors:</strong> 績效卓越、潛能突破</li>
                                <li><strong>Emotion:</strong> 情緒管理、思想積極</li>
                                <li><strong>Social:</strong> 人際、溝通、社交</li>
                                <li><strong>Spiritual:</strong> 決志信主、信靠真神</li>
                            </ul>
                        </div>

                        <div className="guide-box-danger">
                            <h5 className="guide-box-title-danger">❌ 5個綑綁 HELLS</h5>
                            <ul className="guide-list">
                                <li><strong>Hades:</strong> 脫離 陰間、罪惡、死亡權勢</li>
                                <li><strong>Enemy:</strong> 得勝 仇敵攻擊、試探、迷惑</li>
                                <li><strong>Lusts:</strong> 勝過 肉體、情慾、驕傲、自我中心</li>
                                <li><strong>Lying:</strong> 綑綁 虛謊、錯誤、巫術的靈</li>
                                <li><strong>Sickness:</strong> 免於 疾病、意外、宿疾</li>
                            </ul>
                        </div>


                        <div style={{ marginTop: '20px' }}>
                            <h5 style={{ textAlign: 'center', marginBottom: '10px', color: 'var(--text-muted)' }}>📺 相關教學影片</h5>
                            <div className="guide-video-wrap">
                                <iframe
                                    src="https://www.youtube.com/embed/tZ_Yt9Yt5v4"
                                    title="五綑綁五釋放教學"
                                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                />
                            </div>
                        </div>
                    </div>
                );
            case 'SCRIPTURES':
                const scriptures = [
                    { id: 1, title: '經文一', ref: '約翰福音 3:16', content: '神愛世人，甚至將他的獨生子賜給他們，叫一切信他的，不至滅亡，反得永生。', icon: '✝️' },
                    { id: 2, title: '經文二', ref: '約翰福音 1:12', content: '凡接待他的，就是信他名的人，他就賜他們權柄、作 神的兒女。', icon: '👨‍👩‍👧‍👦' },
                    { id: 3, title: '經文三', ref: '哥林多後書 5:17', content: '若有人在基督裡，他就是新造的人，舊事已過，都變成新的了。', icon: '✨' },
                    { id: 4, title: '經文四', ref: '馬太福音 7:7-8', content: '你們祈求，就給你們；尋找，就尋見；叩門，就給你們開門。因為凡祈求的，就得著；尋找的，就尋見；叩門的，就給他開門。', icon: '🚪' },
                    { id: 5, title: '經文五', ref: '提摩太後書 3:16', content: '聖經都是神所默示的，於教訓、督責、使人歸正、教導人學義、都是有益的。', icon: '📖' },
                    { id: 6, title: '經文六', ref: '希伯來書 10:25', content: '你們不可停止聚會，好像那些停止慣了的人，倒要彼此勸勉，既知道那日子臨近，就更當如此。', icon: '⛪' },
                    { id: 7, title: '經文七', ref: '哥林多後書 9:6-7', content: '少種的少收，多種的多收，這話是真的。各人要隨本心所酌定的，不要作難，不要勉強，因為捐得樂意的人，是神所喜愛的。', icon: '🌱' },
                ];

                if (activeScripture) {
                    return (
                        <div style={{ padding: '20px', textAlign: 'center' }}>
                            <div style={{
                                padding: '30px',
                                background: '#fdfbf7 url("https://www.transparenttextures.com/patterns/aged-paper.png")', // Parchment texture feel
                                backgroundColor: '#fdfbf7',
                                borderRadius: '4px',
                                boxShadow: '0 4px 15px rgba(93, 64, 55, 0.15), inset 0 0 30px rgba(161, 136, 127, 0.1)',
                                border: '2px solid #d7ccc8',
                                minHeight: '300px',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                                alignItems: 'center',
                                position: 'relative',
                                fontFamily: '"Times New Roman", "KaiTi", "STKaiti", serif', // Serif for classic feel
                                color: '#3e2723'
                            }}>
                                <h3 style={{
                                    color: '#5d4037',
                                    marginBottom: '10px',
                                    fontSize: '1.6rem',
                                    fontWeight: 'bold',
                                    borderBottom: '2px solid #8d6e63',
                                    paddingBottom: '5px',
                                    display: 'inline-block'
                                }}>
                                    {activeScripture.title}
                                </h3>

                                <span style={{
                                    display: 'block',
                                    marginBottom: '20px',
                                    fontSize: '1rem',
                                    fontStyle: 'italic',
                                    color: '#795548'
                                }}>
                                    ({activeScripture.ref})
                                </span>

                                <p style={{
                                    color: '#4e342e',
                                    fontSize: '1.2rem',
                                    lineHeight: '1.8',
                                    fontWeight: '500',
                                    maxWidth: '90%'
                                }}>
                                    {activeScripture.content}
                                </p>

                                <div style={{ fontSize: '3rem', margin: '20px 0', opacity: 0.2 }}>
                                    {activeScripture.icon}
                                </div>

                                <button
                                    onClick={() => setActiveScripture(null)}
                                    style={{
                                        marginTop: 'auto',
                                        padding: '8px 24px',
                                        background: 'transparent',
                                        color: '#5d4037',
                                        border: '1px solid #8d6e63',
                                        borderRadius: '20px',
                                        cursor: 'pointer',
                                        fontSize: '0.9rem',
                                        fontWeight: 'bold',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    ↩ 返回列表
                                </button>
                            </div>
                        </div>
                    );
                }

                return (
                    <div style={{ padding: '10px' }}>
                        <h4 style={{ textAlign: 'center', marginBottom: '15px', fontFamily: '"Times New Roman", serif', color: '#5d4037' }}>📖 七經文</h4>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(2, 1fr)',
                            gap: '20px',
                            padding: '0 10px 15px 10px' // Add side padding to container to squeeze grid slightly if needed
                        }}>
                            {scriptures.map((s, idx) => (
                                <motion.div
                                    key={s.id}
                                    onClick={() => setActiveScripture(s)}
                                    whileHover={{ scale: 1.02, y: -3 }}
                                    whileTap={{ scale: 0.98, y: 0 }}
                                    style={{
                                        background: 'linear-gradient(145deg, #fffdf5 0%, #f0e6dc 100%)', // Subtle gradient for form
                                        padding: '8px', // Tight padding
                                        borderRadius: '8px',
                                        boxShadow: '0 6px 12px rgba(93, 64, 55, 0.15), inset 0 1px 0 rgba(255,255,255,0.8)', // 3D shadow + highlight
                                        border: '1px solid #d7ccc8',
                                        borderBottom: '4px solid #c8b7a6', // Thicker bottom for "block" feel
                                        cursor: 'pointer',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center', // Center content vertically
                                        gap: '4px',
                                        minHeight: '110px', // Ensure consistent height but compact
                                        gridColumn: idx === 6 ? '1 / -1' : 'auto',
                                        width: idx === 6 ? '60%' : '100%',
                                        justifySelf: 'center',
                                        position: 'relative',
                                        overflow: 'hidden'
                                    }}
                                >
                                    {/* Subtle inner border for refinement */}
                                    <div style={{
                                        position: 'absolute', top: '4px', left: '4px', right: '4px', bottom: '4px',
                                        border: '1px dashed rgba(141, 110, 99, 0.2)',
                                        borderRadius: '4px',
                                        pointerEvents: 'none'
                                    }} />

                                    <span style={{
                                        fontSize: '1.8rem',
                                        opacity: 0.9,
                                        filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.1))', // Icon shadow
                                        lineHeight: 1,
                                        marginTop: '5px'
                                    }}>{s.icon}</span>

                                    <span style={{
                                        fontWeight: 'bold',
                                        color: '#4e342e', // Slightly darker for contrast
                                        fontSize: '1rem',
                                        fontFamily: '"Times New Roman", "KaiTi", serif',
                                        textAlign: 'center',
                                        lineHeight: '1.2',
                                        textShadow: '0 1px 0 rgba(255,255,255,0.5)' // Engraved text feel
                                    }}>
                                        {s.title}
                                    </span>
                                    <span style={{ fontSize: '0.75rem', color: '#8d6e63', textAlign: 'center', lineHeight: '1.2', marginBottom: '5px' }}>{s.ref}</span>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                );
            case 'CARDS':
                return (
                    <div style={{ padding: '20px', textAlign: 'center' }}>
                        <h4 style={{ marginBottom: '20px' }}>💌 天父小卡</h4>
                        <p style={{ color: 'var(--text-muted)' }}>（每日一張天父的話語...）</p>
                        <div style={{ padding: '20px', border: '1px dashed var(--border-subtle)', borderRadius: '10px', background: 'var(--bg-light-gray)', color: 'var(--text-muted-light)' }}>
                            🚧 內容建置中
                        </div>
                    </div>
                );
            case 'PRAYERS':
                return (
                    <div style={{ padding: '20px' }}>
                        <h4 style={{ textAlign: 'center', marginBottom: '20px' }}>🙏 認領禱告詞範例</h4>
                        <div style={{
                            background: 'linear-gradient(135deg, #fff3e0 0%, #ffffff 100%)',
                            padding: '25px',
                            borderRadius: '15px',
                            boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
                            lineHeight: '1.8',
                            color: '#5d4037',
                            fontSize: '1rem'
                        }}>
                            <p>奉主耶穌的名，我將 <span style={{ borderBottom: '2px solid #a1887f', display: 'inline-block', width: '80px' }}>&nbsp;</span> 交在祢手中，求主親自動工。</p>
                            <p>主啊，求祢賜他們健康與平安，讓他們每天充滿活力與喜樂。</p>
                            <p>求祢祝福他們手中所做的，無論工作或學業，都有果效、順利與突破。</p>
                            <p>願他們的內心剛強有力，思想正直、情緒穩定，充滿盼望與信心。</p>
                            <p>求祢吸引他們渴慕真理，開他們的心眼，使他們遇見祢、經歷祢。</p>
                            <p>願他們的人際關係良好，溝通有智慧，家庭和睦、彼此相愛。</p>
                            <div style={{ margin: '20px 0', padding: '10px', background: 'rgba(255,255,255,0.6)', borderRadius: '10px', borderLeft: '4px solid #8d6e63' }}>
                                <p style={{ fontWeight: 'bold' }}>奉主的名，拿起天國禱告的權柄，要捆綁黑暗勢力</p>
                                <p style={{ fontWeight: 'bold' }}>奉主的名，拿起天國禱告的權柄，要賜下天國祝福</p>
                            </div>
                            <p style={{ textAlign: 'right', fontWeight: 'bold', marginTop: '15px' }}>禱告奉耶穌的名，阿們</p>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
            {view !== 'MENU' && (
                <div style={{ padding: '10px 0 10px 0', display: 'flex', alignItems: 'center' }}>
                    <button
                        onClick={() => setView('MENU')}
                        style={{
                            background: '#8d6e63',
                            border: 'none',
                            borderBottom: '4px solid #5d4037', // 3D effect
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            color: '#fff',
                            fontWeight: 'bold',
                            padding: '8px 16px',
                            borderRadius: '30px', // Circular capsule
                            fontSize: '0.95rem',
                            transition: 'all 0.1s',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.2)',
                            marginLeft: '5px',
                            transform: 'translateY(0)'
                        }}
                        onMouseDown={(e) => {
                            e.currentTarget.style.borderBottomWidth = '0px';
                            e.currentTarget.style.transform = 'translateY(4px)';
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                        onMouseUp={(e) => {
                            e.currentTarget.style.borderBottomWidth = '4px';
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.2)';
                        }}
                        onMouseLeave={(e) => {
                            // Reset if mouse leaves
                            e.currentTarget.style.borderBottomWidth = '4px';
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.2)';
                        }}
                    >
                        <ArrowLeft size={18} strokeWidth={3} /> 返回目錄
                    </button>
                </div>
            )}
            <div style={{}}>
                {renderContent()}
            </div>
        </div>
    );
};

export const Guide = ({ onClose }) => {
    const [activeTab, setActiveTab] = useState('MANUAL'); // Default to Manual as per previous user preference
    const closeBtnRef = useRef(null);

    return (
        <div className="debug-editor-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="guide-modal-title">
            <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '430px' }}> {/* Slightly wider for map comfort */}
                <div className="modal-header">
                    <h3 id="guide-modal-title">📖 牧羊人手冊</h3>
                    <CloseButton ref={closeBtnRef} onClick={onClose} ariaLabel="關閉" />
                </div>

                <div className="modal-form guide-modal-form">
                    <div className="modal-tabs">
                        <button
                            className={`modal-tab ${activeTab === 'MANUAL' ? 'modal-tab-active' : ''}`}
                            onClick={() => setActiveTab('MANUAL')}
                        >
                            📜 認領秘笈
                        </button>
                        <button
                            className={`modal-tab ${activeTab === 'BURDEN' ? 'modal-tab-active' : ''}`}
                            onClick={() => setActiveTab('BURDEN')}
                        >
                            📽️ 負擔傳遞
                        </button>

                    </div>

                    <div className="modal-scroll">
                        <div
                            className="modal-content guide-modal-content"
                            style={{
                                color: '#000',
                                padding: activeTab === 'MANUAL' ? '0' : '16px',
                                background: 'rgba(255, 255, 255, 0.15)',
                                borderRadius: '12px',
                                border: '2px solid rgba(143, 125, 103, 0.15)',
                                minHeight: '300px'
                            }}
                        >
                            {activeTab === 'MANUAL' ? (
                                <ManualSection />
                            ) : (
                                <div style={{ padding: '10px' }}>
                                    <h4 style={{ textAlign: 'center', marginBottom: '15px' }}>🎥 認領負擔傳遞</h4>
                                    <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                                        <iframe
                                            src="https://www.youtube.com/embed/tqupdMUIVWQ?start=16"
                                            title="認領負擔傳遞"
                                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                        />
                                    </div>
                                    <p style={{ marginTop: '20px', lineHeight: '1.6', color: '#555', fontSize: '0.95rem' }}>
                                        透過影片了解認領的意義，準備一起來得人如得魚吧!
                                    </p>
                                </div>
                            )}

                        </div>

                    </div>

                </div>
            </div>
        </div>
    );
};
