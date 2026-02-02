import { useState } from 'react';
import { motion } from 'motion/react';
import svgPaths from "./imports/svg-2b87y7op5v";
import imgSheep01 from "figma:asset/97a7f102eef5c41931c9014f83766c636734e745.png";
import imgSheep02 from "figma:asset/e57a0b7d8cb7b74ba460fd64d024791e8bb150da.png";
import imgSheep03 from "figma:asset/7f0ede6e3312d7ccf4d6daff2ed8e3382df7a234.png";
import imgSheep04 from "figma:asset/a37a0a0ad53c34dd340f0bba0eac0048c19392bc.png";
import imgSheep05 from "figma:asset/78c3d022fb808261119be0d75f5b56e0c44187c4.png";
import imgWeaksheep01 from "figma:asset/920e3e9c8785640c1af6af3da55cc92361e090f9.png";
import imgWeaksheep02 from "figma:asset/1748a2a10ef1455015926c1ac671d32ac5451ed5.png";
import imgWeaksheep03 from "figma:asset/f62b0056d936c849a8ba815014d2aa8655f69112.png";
import imgWeaksheep04 from "figma:asset/7f1d290d9127134f964237eeeb6d8b08cad08436.png";
import imgWeaksheep05 from "figma:asset/7c7d2527c7851d92bbba905ee5449607555d69a2.png";
import imgGhost from "figma:asset/45075679e56e4f999f03f8e4e8f7bf92ac035b23.png";
import imgEllipse1 from "figma:asset/825f1677ded4f550211508176253685cf29a5a80.png";
import imgBackground from "figma:asset/f293c16fcbc5fbdf74b6699d22312d90d92f3a6e.png";
import { SheepListModal } from './components/SheepListModal';

// Sheep images by status
const HEALTHY_SHEEP_IMAGES = [imgSheep01, imgSheep02, imgSheep03, imgSheep04, imgSheep05];
const WEAK_SHEEP_IMAGES = [imgWeaksheep01, imgWeaksheep02, imgWeaksheep03, imgWeaksheep04, imgWeaksheep05];
const GHOST_IMAGE = imgGhost;

// Sheep formation configuration: [column1: 2 sheep, column2: 3 sheep, column3: 2 sheep, column4: 3 sheep, column5: 2 sheep]
const FORMATION = [2, 3, 2, 3, 2];

type SheepCategory = '新朋友' | '慕道友' | '基督徒';
type SheepStatus = '健康' | '虛弱' | '失喪的靈魂';

interface SheepData {
  id: number;
  image: string;
  columnIndex: number;
  rowIndex: number;
  name: string;
  category: SheepCategory;
  status: SheepStatus;
  loveValue: number; // 0-100
  notes: string;
  prayCount: number; // 今天的禱告次數，最多3次
}

// 根據愛心值計算羊的狀態
function calculateSheepStatus(loveValue: number): SheepStatus {
  if (loveValue >= 50) return '健康';
  if (loveValue >= 10) return '虛弱';
  return '失喪的靈魂';
}

// 根據羊的 ID 和愛心值獲取對應的圖片
function getSheepImage(id: number, loveValue: number): string {
  const status = calculateSheepStatus(loveValue);
  const imageIndex = id % 5; // 循環使用5張圖片
  
  if (status === '失喪的靈魂') {
    return GHOST_IMAGE;
  } else if (status === '虛弱') {
    return WEAK_SHEEP_IMAGES[imageIndex];
  } else {
    return HEALTHY_SHEEP_IMAGES[imageIndex];
  }
}

function generateSheep(count: number): SheepData[] {
  const sheep: SheepData[] = [];
  let id = 0;
  
  const sampleNames = ['林鳳雯', '郭聖兆', '戴文心', 'Amy', '蕭婷瑜', '王小明', '李美玲', '張志豪', '陳雅婷', '黃建國', '吳佳蓉', '周文傑'];
  const categories: SheepCategory[] = ['新朋友', '慕道友', '基督徒'];
  
  // 隨機生成愛心值，讓每次打開頁面時羊群狀態都不同
  // 健康（≥50%）、虛弱（10-49%）、失喪的靈魂（0-9%）
  const generateRandomLoveValue = () => {
    const rand = Math.random();
    // 40% 機率健康 (50-100)
    if (rand < 0.4) return Math.floor(Math.random() * 51) + 50;
    // 40% 機率虛弱 (10-49)
    if (rand < 0.8) return Math.floor(Math.random() * 40) + 10;
    // 20% 機率失喪 (0-9)
    return Math.floor(Math.random() * 10);
  };
  
  FORMATION.forEach((sheepInColumn, columnIndex) => {
    for (let rowIndex = 0; rowIndex < sheepInColumn; rowIndex++) {
      const loveValue = generateRandomLoveValue();
      sheep.push({
        id,
        image: getSheepImage(id, loveValue),
        columnIndex,
        rowIndex,
        name: sampleNames[id] || `羊 ${id + 1}`,
        category: categories[id % 3],
        status: calculateSheepStatus(loveValue),
        loveValue,
        notes: '',
        prayCount: 0,
      });
      id++;
    }
  });
  
  return sheep.slice(0, count);
}

// Scrolling Background Component
function ScrollingBackground() {
  return (
    <>
      {/* First background */}
      <motion.div
        className="absolute bottom-0 h-[664px] left-0 w-[1599px]"
        animate={{ x: [0, -1599] }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
      >
        <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgBackground} />
      </motion.div>
      {/* Second background for seamless loop */}
      <motion.div
        className="absolute bottom-0 h-[664px] left-[1599px] w-[1599px]"
        animate={{ x: [0, -1599] }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
      >
        <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgBackground} />
      </motion.div>
    </>
  );
}

// Sheep Component with bounce animation
function Sheep({ sheep }: { sheep: SheepData }) {
  // Calculate position based on formation
  // Column spacing: each sheep is 65px wide + 6px gap
  const sheepWidth = 65;
  const columnGap = 6;
  
  // Calculate the number of sheep in this column to center vertically
  const sheepInThisColumn = FORMATION[sheep.columnIndex];
  
  // Calculate horizontal position (from left to right, but we want right to left display)
  // Column 0 should be rightmost, so we reverse the index
  // Total width = 5 columns * 65px + 4 gaps * 6px = 349px
  const totalWidth = FORMATION.length * sheepWidth + (FORMATION.length - 1) * columnGap;
  
  // Position from the left side of the container, but in reverse order
  const reversedColumnIndex = FORMATION.length - 1 - sheep.columnIndex;
  
  // Generate unique random values for each sheep based on their ID
  const randomSeed = sheep.id * 123.456; // Use ID as seed for consistency
  const randomAmplitude = 1 + (Math.sin(randomSeed) + 1) * 1.5; // 1-4px amplitude
  const randomDuration = 1.5 + (Math.cos(randomSeed) + 1) * 1; // 1.5-3.5s duration
  const randomDelay = (sheep.id * 0.15) % 2; // Staggered delays
  
  return (
    <motion.div
      className="absolute"
      style={{ 
        // Position columns from left (reversed order so rightmost column comes first)
        left: `${reversedColumnIndex * (sheepWidth + columnGap)}px`,
        // Center the sheep group and offset by row
        top: `calc(50% - ${(sheepInThisColumn * 80) / 2}px + ${sheep.rowIndex * 80}px - 30px)`,
      }}
      animate={{ y: [-randomAmplitude, randomAmplitude, -randomAmplitude] }}
      transition={{
        duration: randomDuration,
        repeat: Infinity,
        ease: "easeInOut",
        delay: randomDelay,
      }}
    >
      <div className="-scale-y-100 rotate-180 w-[65px] h-[80px]">
        <img alt="" className="w-full h-full object-contain" src={sheep.image} />
      </div>
    </motion.div>
  );
}

// Task Card Components
function Heart() {
  return (
    <div className="relative shrink-0 size-[14px]">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 14">
        <path d={svgPaths.pb328900} fill="#B65A5A" />
      </svg>
    </div>
  );
}

function HandsPraying() {
  return (
    <div className="relative shrink-0 size-[20px]">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        <path d={svgPaths.p3845a300} fill="white" />
      </svg>
    </div>
  );
}

interface TaskCardProps {
  sheep: SheepData;
  buttonType: 'pray' | 'continue';
  showToday?: boolean;
  onPray: (sheep: SheepData) => void;
}

function TaskCard({ sheep, buttonType, showToday, onPray }: TaskCardProps) {
  // 根据类别确定颜色
  const getCategoryStyle = (category: SheepCategory) => {
    switch (category) {
      case '新朋友':
        return { typeColor: 'text-[#5385db]', typeBg: 'bg-[#d2dbea]' };
      case '慕道友':
        return { typeColor: 'text-[#4ba762]', typeBg: 'bg-[#c2e7cb]' };
      case '基督徒':
        return { typeColor: 'text-[#7f5b9b]', typeBg: 'bg-[#e5d6f1]' };
    }
  };
  
  const { typeColor, typeBg } = getCategoryStyle(sheep.category);
  
  return (
    <div className="bg-[#ffefd6] content-stretch flex flex-col gap-[8px] h-[168px] isolate items-center justify-center px-[8px] py-[6px] relative rounded-[20px] shrink-0 w-[140px]">
      <div aria-hidden="true" className="absolute border-2 border-[#8f7d67] border-solid inset-[-2px] pointer-events-none rounded-[22px]" />
      
      {showToday && (
        <div className="absolute bg-[#6a78e3] content-stretch flex flex-col h-[18px] items-center justify-center left-[39px] px-[10px] py-[2px] rounded-[10px] top-[-9px] z-[4]">
          <p className="css-ew64yg font-['Rounded_Mgen+_1c:medium',sans-serif] leading-[11px] not-italic relative shrink-0 text-[10px] text-center text-white tracking-[0.6px]">今日任務</p>
        </div>
      )}
      
      <div className="content-stretch flex flex-col gap-[2px] items-center relative shrink-0 w-full z-[3]">
        <div className="content-stretch flex gap-[3px] items-center relative shrink-0">
          <Heart />
          <p className="css-ew64yg font-['Rounded_Mgen+_1c:medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#b65a5a] text-[12px] tracking-[0.36px]">{sheep.loveValue}%</p>
        </div>
        
        <div className="h-[40px] relative rounded-[40px] shrink-0 w-[68px]">
          <div aria-hidden="true" className="absolute inset-0 pointer-events-none rounded-[40px]">
            <div className="absolute bg-[#e9d6b9] inset-0 rounded-[40px]" />
            <div className="absolute inset-0 overflow-hidden rounded-[40px]">
              <img alt="" className="absolute h-[126.47%] left-[85.55%] max-w-none top-[11.03%] w-[-93.32%]" src={sheep.image} />
            </div>
          </div>
        </div>
        
        <p className="css-g0mm18 font-['Rounded_Mgen+_1c:medium',sans-serif] leading-[normal] min-w-full not-italic overflow-hidden relative shrink-0 text-[#7b5b33] text-[16px] text-center text-ellipsis tracking-[0.48px] w-[min-content]">{sheep.name}</p>
        
        <div className={`${typeBg} content-stretch flex items-center justify-center px-[4px] py-[2px] relative rounded-[10px] shrink-0`}>
          <p className={`css-ew64yg font-['Huninn:Regular',sans-serif] leading-[normal] not-italic relative shrink-0 ${typeColor} text-[12px] tracking-[-0.36px]`}>{sheep.category}</p>
        </div>
      </div>
      
      {buttonType === 'pray' ? (
        <button
          onClick={() => onPray(sheep)}
          disabled={sheep.prayCount >= 3}
          className="bg-[#f39fac] content-stretch flex gap-[2px] items-center justify-center px-[8px] py-[5px] relative rounded-[60px] shrink-0 w-[124px] z-[2] hover:bg-[#f28a9a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <HandsPraying />
          <p className="css-ew64yg font-['Rounded_Mgen+_1c:medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[14px] text-white tracking-[0.42px]">為他禱告 {sheep.prayCount}/3</p>
        </button>
      ) : (
        <div className="bg-[#c7b292] content-stretch flex items-center justify-center px-[8px] py-[5px] relative rounded-[60px] shrink-0 w-[124px] z-[2]">
          <p className="css-ew64yg font-['Rounded_Mgen+_1c:medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#ffefd6] text-[14px] tracking-[0.42px]">明天再繼續</p>
        </div>
      )}
      
      <div className="absolute bg-[#ffefd6] bottom-0 left-0 rounded-[20px] top-0 w-[140px] z-[1]">
        <div className="absolute inset-0 pointer-events-none rounded-[inherit] shadow-[inset_0px_-7px_0px_0px_#ccbea8]" />
      </div>
    </div>
  );
}

// Main App Component
export default function App() {
  const [sheep, setSheep] = useState<SheepData[]>(() => generateSheep(12));
  const [isSheepListModalOpen, setSheepListModalOpen] = useState(false);
  const [isAddSheepModalOpen, setAddSheepModalOpen] = useState(false);
  const [newSheepName, setNewSheepName] = useState('');
  const [newSheepCategory, setNewSheepCategory] = useState<SheepCategory>('新朋友');
  const [newSheepNotes, setNewSheepNotes] = useState('');

  const handleAddSheep = (name: string, category: SheepCategory, notes: string) => {
    const newId = sheep.length > 0 ? Math.max(...sheep.map(s => s.id)) + 1 : 0;
    const initialLoveValue = 0;
    const newSheep: SheepData = {
      id: newId,
      image: getSheepImage(newId, initialLoveValue),
      columnIndex: 0,
      rowIndex: 0,
      name,
      category,
      status: calculateSheepStatus(initialLoveValue),
      loveValue: initialLoveValue,
      notes,
      prayCount: 0,
    };
    setSheep([...sheep, newSheep]);
  };

  const handlePray = (sheepItem: SheepData) => {
    if (sheepItem.prayCount >= 3) return;
    
    const newLoveValue = Math.min(100, sheepItem.loveValue + 10);
    const newStatus = calculateSheepStatus(newLoveValue);
    const updatedSheep = {
      ...sheepItem,
      loveValue: newLoveValue,
      prayCount: sheepItem.prayCount + 1,
      status: newStatus,
      image: getSheepImage(sheepItem.id, newLoveValue), // 根據新的愛心值更新圖片
    };
    
    const updatedSheepList = sheep.map((s) => (s.id === updatedSheep.id ? updatedSheep : s));
    setSheep(updatedSheepList);
  };

  // 选择前6只羊作为任务卡片
  const taskSheep = sheep.slice(0, 6);
  const taskCards = taskSheep.map((s, index) => ({
    sheep: s,
    buttonType: (s.prayCount >= 3 ? 'continue' : 'pray') as 'pray' | 'continue',
    showToday: index === 0,
  }));
  
  // 畫面上只顯示前12隻羊（固定隊形）
  const displayedSheep = sheep.slice(0, 12);

  return (
    <div className="bg-[#e3f7fe] relative size-full overflow-hidden">
      {/* Scrolling Background */}
      <ScrollingBackground />
      
      {/* Sheep Herd */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute left-1/2 -translate-x-1/2 bottom-[300px] w-[349px] h-[240px]">
          {displayedSheep.map((s) => (
            <Sheep key={s.id} sheep={s} />
          ))}
        </div>
      </div>
      
      {/* Top Header */}
      <div className="absolute content-stretch flex items-center justify-between left-0 px-[16px] py-[12px] right-0 top-[20px] z-10">
        <div className="content-stretch flex gap-[6px] items-center relative shrink-0">
          <div className="relative shrink-0 size-[28px]">
            <img alt="" className="block max-w-none size-full" height="28" src={imgEllipse1} width="28" />
          </div>
          <p className="css-ew64yg font-['Rounded_Mgen+_1c:medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#3c669a] text-[14px]">Shepherd</p>
        </div>
        
        <div className="bg-[#c2dbfa] content-stretch flex items-center justify-center p-[6px] relative rounded-[10px] shrink-0">
          <div className="relative shrink-0 size-[24px]">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
              <path d={svgPaths.p2892acb0} fill="#5E91D1" />
            </svg>
          </div>
        </div>
      </div>
      
      {/* Center Buttons */}
      <div className="absolute bottom-[212px] content-stretch flex items-center justify-between left-0 px-[16px] py-[12px] right-0 z-10">
        <button
          onClick={() => setSheepListModalOpen(true)}
          className="bg-[#fcb751] content-stretch flex gap-[5px] items-center justify-center px-[16px] py-[8px] relative rounded-[30px] shrink-0 w-[98px] cursor-pointer hover:bg-[#f0ab3f] transition-colors active:scale-95"
        >
          <div aria-hidden="true" className="absolute border-2 border-solid border-white inset-[-2px] pointer-events-none rounded-[32px] shadow-[0px_2px_6px_0px_rgba(0,0,0,0.18)]" />
          <p className="css-ew64yg font-['Rounded_Mgen+_1c:medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[18px] text-white tracking-[0.54px]">{sheep.length}隻</p>
          <div className="relative shrink-0 size-[24px]">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
              <path d={svgPaths.p3fc43e00} fill="white" />
              <path d={svgPaths.p34e54300} fill="white" />
              <path d={svgPaths.p31835a00} fill="white" />
              <path d={svgPaths.p30ad8400} fill="white" />
            </svg>
          </div>
        </button>
        
        <button 
          onClick={() => setAddSheepModalOpen(true)}
          className="bg-[#54afcb] content-stretch flex gap-[5px] items-center px-[16px] py-[8px] relative rounded-[30px] shrink-0 hover:bg-[#4a9ab5] transition-colors active:scale-95"
        >
          <div aria-hidden="true" className="absolute border-2 border-solid border-white inset-[-2px] pointer-events-none rounded-[32px] shadow-[0px_2px_6px_0px_rgba(0,0,0,0.18)]" />
          <div className="relative shrink-0 size-[24px]">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
              <path d={svgPaths.p2da0e800} fill="white" />
            </svg>
          </div>
          <p className="css-ew64yg font-['Rounded_Mgen+_1c:medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[18px] text-white tracking-[0.54px]">認領小羊</p>
        </button>
      </div>
      
      {/* Bottom Task Cards */}
      <div className="absolute bottom-[12px] left-0 right-0 pb-[12px] pt-[12px] px-[16px] z-10">
        <div className="flex gap-[12px] overflow-x-auto p-[16px] m-[-16px]">
          {taskCards.map((card, index) => (
            <TaskCard key={card.sheep.id} {...card} onPray={handlePray} />
          ))}
        </div>
      </div>

      {/* Sheep List Modal */}
      <SheepListModal
        isOpen={isSheepListModalOpen}
        onClose={() => setSheepListModalOpen(false)}
        sheep={sheep}
        onUpdateSheep={(updatedSheep) => {
          const updatedSheepList = sheep.map((s) => (s.id === updatedSheep.id ? updatedSheep : s));
          setSheep(updatedSheepList);
        }}
        onAddNewSheep={handleAddSheep}
        onPray={handlePray}
      />

      {/* Add New Sheep Modal */}
      {isAddSheepModalOpen && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-4 z-20">
          <div className="bg-[#ffefd6] rounded-[20px] max-w-md w-full p-6">
            <h3 className="font-['Rounded_Mgen+_1c:medium',sans-serif] text-[20px] text-[#7b5b33] mb-4">
              認領新小羊
            </h3>
            
            <div className="space-y-3">
              <div>
                <label className="text-[14px] text-[#7b5b33] mb-1 block">姓名</label>
                <input
                  type="text"
                  value={newSheepName}
                  onChange={(e) => setNewSheepName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border-2 border-[#8f7d67] rounded-[10px] text-[14px]"
                  placeholder="輸入姓名..."
                />
              </div>

              <div>
                <label className="text-[14px] text-[#7b5b33] mb-1 block">類別</label>
                <select
                  value={newSheepCategory}
                  onChange={(e) => setNewSheepCategory(e.target.value as SheepCategory)}
                  className="w-full px-3 py-2 bg-white border-2 border-[#8f7d67] rounded-[10px] text-[14px]"
                >
                  <option value="新朋友">新朋友</option>
                  <option value="慕道友">慕道友</option>
                  <option value="基督徒">基督徒</option>
                </select>
              </div>

              <div>
                <label className="text-[14px] text-[#7b5b33] mb-1 block">筆記</label>
                <textarea
                  value={newSheepNotes}
                  onChange={(e) => setNewSheepNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-white border-2 border-[#8f7d67] rounded-[10px] text-[14px] min-h-[80px]"
                  placeholder="輸入備註..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  if (newSheepName.trim()) {
                    handleAddSheep(newSheepName, newSheepCategory, newSheepNotes);
                    setNewSheepName('');
                    setNewSheepCategory('新朋友');
                    setNewSheepNotes('');
                    setAddSheepModalOpen(false);
                  }
                }}
                className="flex-1 bg-[#54afcb] text-white py-2 rounded-[30px] font-['Rounded_Mgen+_1c:medium',sans-serif] hover:bg-[#4a9ab5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!newSheepName.trim()}
              >
                認領
              </button>
              <button
                onClick={() => {
                  setNewSheepName('');
                  setNewSheepCategory('新朋友');
                  setNewSheepNotes('');
                  setAddSheepModalOpen(false);
                }}
                className="flex-1 bg-[#c7b292] text-[#ffefd6] py-2 rounded-[30px] font-['Rounded_Mgen+_1c:medium',sans-serif] hover:bg-[#b5a184] transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}