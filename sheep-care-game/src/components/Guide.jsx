import React, { useState, useEffect, useRef } from 'react';
import { SevenStepsMap } from './SevenStepsMap';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

const ManualSection = () => {
    const [view, setView] = useState('MENU'); // MENU | SEVEN_STEPS | BIND_RELEASE | SCRIPTURES | CARDS | PRAYERS
    const [selectedId, setSelectedId] = useState(null);

    const menuItems = [
        { id: 'SEVEN_STEPS', label: '領人歸主七招', icon: '🗺️' },
        { id: 'BIND_RELEASE', label: '五綑綁五釋放', icon: '🤲' },
        { id: 'SCRIPTURES', label: '七經文', icon: '📖' },
        { id: 'CARDS', label: '天父小卡', icon: '💌' },
        { id: 'PRAYERS', label: '認領禱告詞範例', icon: '🙏' },
    ];

    const handleItemClick = (id) => {
        setSelectedId(id);
        setTimeout(() => {
            setView(id);
            setSelectedId(null);
        }, 600); // Wait for animation
    };

    if (view === 'MENU') {
        return (
            <div style={{ padding: '20px 10px' }}>
                <p style={{ textAlign: 'center', color: '#666', marginBottom: '20px' }}>
                    點擊卷軸領取秘笈
                </p>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '20px',
                    justifyContent: 'center'
                }}>
                    {menuItems.map((item, index) => (
                        <motion.button
                            key={item.id}
                            onClick={() => handleItemClick(item.id)}
                            layout
                            initial={{ scale: 1, opacity: 0 }}
                            animate={{
                                scale: selectedId === item.id ? 1.15 : 1,
                                opacity: 1,
                                filter: selectedId === item.id ? 'brightness(1.2)' : 'brightness(1)',
                                zIndex: selectedId === item.id ? 10 : 1
                            }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            transition={{ duration: 0.3 }}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '8px',
                                gridColumn: index === 4 ? '1 / -1' : 'auto', // Last item centered if odd count
                                width: index === 4 ? '50%' : '100%',
                                justifySelf: 'center',
                                outline: 'none'
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
                                animate={selectedId === item.id ? {
                                    rotate: [0, -5, 5, -5, 5, 0],
                                    transition: { duration: 0.5 }
                                } : {}}
                            />
                            <span style={{
                                color: '#5d4037',
                                fontWeight: 'bold',
                                fontSize: '0.95rem',
                                textAlign: 'center',
                                textShadow: '0 1px 2px rgba(255,255,255,0.8)'
                            }}>
                                {item.label}
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
                    <div style={{ padding: '20px' }}>
                        <h4 style={{ textAlign: 'center', marginBottom: '8px' }}>🤲 五綑綁五釋放</h4>

                        <div style={{ background: '#fff0f0', padding: '15px', borderRadius: '10px', marginBottom: '15px', border: '1px solid #ffcdd2' }}>
                            <h5 style={{ color: '#d32f2f', marginBottom: '10px', borderBottom: '1px solid #ffcdd2', paddingBottom: '5px' }}>❌ 5個綑綁 HELLS</h5>
                            <ul style={{ paddingLeft: '0', listStyle: 'none', lineHeight: '1.6', fontSize: '0.95rem' }}>
                                <li style={{ marginBottom: '8px' }}><strong>Hades:</strong> 脫離 陰間、罪惡、死亡權勢</li>
                                <li style={{ marginBottom: '8px' }}><strong>Enemy:</strong> 得勝 仇敵攻擊、試探、迷惑</li>
                                <li style={{ marginBottom: '8px' }}><strong>Lusts:</strong> 勝過 肉體、情慾、驕傲、自我中心</li>
                                <li style={{ marginBottom: '8px' }}><strong>Lying:</strong> 綑綁 虛謊、錯誤、巫術的靈</li>
                                <li><strong>Sickness:</strong> 免於 疾病、意外、宿疾</li>
                            </ul>
                        </div>

                        <div style={{ background: '#e8f5e9', padding: '15px', borderRadius: '10px', border: '1px solid #c8e6c9', marginBottom: '20px' }}>
                            <h5 style={{ color: '#2e7d32', marginBottom: '10px', borderBottom: '1px solid #c8e6c9', paddingBottom: '5px' }}>✅ 5個釋放 BLESS</h5>
                            <ul style={{ paddingLeft: '0', listStyle: 'none', lineHeight: '1.6', fontSize: '0.95rem' }}>
                                <li style={{ marginBottom: '8px' }}><strong>Body:</strong> 身體健康、喜樂平安</li>
                                <li style={{ marginBottom: '8px' }}><strong>Labors:</strong> 績效卓越、潛能突破</li>
                                <li style={{ marginBottom: '8px' }}><strong>Emotion:</strong> 情緒管理、思想積極</li>
                                <li style={{ marginBottom: '8px' }}><strong>Social:</strong> 人際、溝通、社交</li>
                                <li><strong>Spiritual:</strong> 決志信主、信靠真神</li>
                            </ul>
                        </div>

                        <div style={{ marginTop: '20px' }}>
                            <h5 style={{ textAlign: 'center', marginBottom: '10px', color: '#555' }}>📺 相關教學影片</h5>
                            <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
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
                return (
                    <div style={{ padding: '20px', textAlign: 'center' }}>
                        <h4 style={{ marginBottom: '20px' }}>📖 七經文</h4>
                        <p style={{ color: '#666' }}>（請在此填入相關經文內容...）</p>
                        <div style={{ padding: '20px', border: '1px dashed #ccc', borderRadius: '10px', background: '#fcfcfc', color: '#999' }}>
                            🚧 內容建置中
                        </div>
                    </div>
                );
            case 'CARDS':
                return (
                    <div style={{ padding: '20px', textAlign: 'center' }}>
                        <h4 style={{ marginBottom: '20px' }}>💌 天父小卡</h4>
                        <p style={{ color: '#666' }}>（每日一張天父的話語...）</p>
                        <div style={{ padding: '20px', border: '1px dashed #ccc', borderRadius: '10px', background: '#fcfcfc', color: '#999' }}>
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
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ padding: '10px', borderBottom: '1px solid #eee', background: '#fbfbfb', display: 'flex', alignItems: 'center' }}>
                <button
                    onClick={() => setView('MENU')}
                    style={{
                        background: 'transparent', border: 'none', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '5px', color: '#666', fontWeight: 'bold'
                    }}
                >
                    <ArrowLeft size={18} /> 返回目錄
                </button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
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
                    <button ref={closeBtnRef} className="close-btn" onClick={onClose} aria-label="關閉">✖</button>
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
                            className={`modal-tab ${activeTab === 'SYSTEM' ? 'modal-tab-active' : ''}`}
                            data-tab="plan"
                            onClick={() => setActiveTab('SYSTEM')}
                        >
                            ⚙️ 系統說明
                        </button>
                    </div>

                    <div className="modal-scroll">
                        <div
                            className="modal-content guide-modal-content"
                            style={{
                                color: '#000',
                                padding: activeTab === 'MANUAL' ? '0' : '0 10px'
                            }}
                        >
                            {activeTab === 'MANUAL' ? (
                                <ManualSection />
                            ) : (
                                <>
                                    <h4>1. 每日照顧與進化</h4>
                                    <p>上帝限制了每日的影響力，讓成長循序漸進：</p>
                                    <ul>
                                        <li><strong>禱告 (Prayer):</strong> 每隻小羊每天最多 <strong>3 次</strong> (每次恢復 <strong>+6 負擔</strong>)。</li>
                                        <li><strong>負擔 (Burden):</strong> 每次禱告恢復負擔，代表對靈魂的負擔與關愛。</li>
                                        <li><strong>生命三階段 (負擔指數):</strong>
                                            <div className="modal-info-box modal-info-box-blue" style={{ margin: '5px 0' }}>
                                                🍂 <strong>虛弱 (Weak):</strong> 負擔 &lt; 40，小羊看起來無精打采。<br />
                                                🐑 <strong>健康 (Healthy):</strong> 負擔 40-79，精神飽滿的樣子。<br />
                                                💪 <strong>強壯 (Strong):</strong> 負擔 &ge; 80，長出羊角，強壯有力！
                                            </div>
                                        </li>
                                    </ul>

                                    <h4>2. 離線與自然衰退</h4>
                                    <p>即使不在線上，時間仍在流動：</p>
                                    <ul>
                                        <li><strong>離線機制:</strong> 負擔會自然流失 (每天約 <strong>13%</strong>)。</li>
                                        <li><strong>守望保護:</strong> 當日有被禱告的小羊，流失大幅減緩至約 <strong>6%</strong>！</li>
                                        <li><strong>狀態影響:</strong> 生病或受傷流失更快 (每天約 <strong>17-20%</strong>)。</li>
                                    </ul>

                                    <h4>3. 沉睡與甦醒 (Miracle)</h4>
                                    <p>沉睡不是終點，信心能喚回生命：</p>
                                    <ul>
                                        <li><strong>沉睡紀錄:</strong> 小羊沉睡後會化為沉睡紀錄，您可以修改紀錄與追憶。</li>
                                        <li><strong>甦醒儀式:</strong> 連續 <strong>5 天</strong> 進行「喚醒禱告」(每天1次)。</li>
                                        <li><strong>奇蹟:</strong> 第 5 次禱告後，小羊將甦醒！(保留姓名與靈程，重置為健康小羊)。</li>
                                        <li><strong>中斷歸零:</strong> 若中斷一天沒禱告，進度將歸零重來。</li>
                                    </ul>

                                    <h4>4. 靈程與資料管理</h4>
                                    <ul>
                                        <li><strong>靈程 (Maturity):</strong> 可設定小羊的屬靈階段 (新朋友/慕道友/基督徒...)。</li>
                                        <li><strong>使用說明:</strong> 請使用 LINE 帳號登入，系統會自動備份您的羊群資料。</li>
                                    </ul>

                                    <h4>5. 提醒與通知 (Bell)</h4>
                                    <ul>
                                        <li><strong>鈴鐺按鈕 (右上方):</strong> 點擊鈴鐺可開啟/關閉牧羊提醒。</li>
                                        <li><strong>開啟後:</strong> 系統將在適當時間提醒您回來關心羊群的狀況。</li>
                                    </ul>

                                    <p style={{ textAlign: 'center', marginTop: '20px', color: '#666' }}>
                                        <em>"信心若沒有行為就是死的。"</em>
                                    </p>
                                </>
                            )}
                        </div>

                        <button className="modal-btn-primary guide-action-btn" onClick={onClose}>
                            關閉
                        </button>
                    </div>


                </div>
            </div>
        </div>
    );
};
