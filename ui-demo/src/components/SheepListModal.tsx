import { useState, useRef, useEffect } from 'react';
import svgPaths from "../imports/svg-lf1lafkw00";
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

// Sheep images by status
const HEALTHY_SHEEP_IMAGES = [imgSheep01, imgSheep02, imgSheep03, imgSheep04, imgSheep05];
const WEAK_SHEEP_IMAGES = [imgWeaksheep01, imgWeaksheep02, imgWeaksheep03, imgWeaksheep04, imgWeaksheep05];
const GHOST_IMAGE = imgGhost;

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
  loveValue: number;
  notes: string;
  prayCount: number;
}

interface SheepListModalProps {
  isOpen: boolean;
  onClose: () => void;
  sheep: SheepData[];
  onUpdateSheep: (sheep: SheepData) => void;
  onAddNewSheep: (name: string, category: SheepCategory, notes: string) => void;
  onPray: (sheep: SheepData) => void;
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

function SheepIcon() {
  return (
    <div className="relative shrink-0 size-[24px]">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <path d={svgPaths.p3fc43e00} fill="white" />
        <path d={svgPaths.p34e54300} fill="white" />
        <path d={svgPaths.p31835a00} fill="white" />
        <path d={svgPaths.p30ad8400} fill="white" />
      </svg>
    </div>
  );
}

function HeartIcon() {
  return (
    <div className="relative shrink-0 size-[14px]">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 14">
        <path d={svgPaths.pb328900} fill="#B65A5A" />
      </svg>
    </div>
  );
}

function HandsPrayingIcon() {
  return (
    <div className="relative shrink-0 size-[20px]">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        <path d={svgPaths.p3845a300} fill="white" />
      </svg>
    </div>
  );
}

function PencilIcon() {
  return (
    <div className="relative shrink-0 size-[20px]">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        <path d={svgPaths.p20a58f00} fill="#A5958C" />
      </svg>
    </div>
  );
}

function PlusIcon() {
  return (
    <div className="relative shrink-0 size-[24px]">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <path d={svgPaths.p2da0e800} fill="white" />
      </svg>
    </div>
  );
}

interface SheepCardProps {
  sheep: SheepData;
  onEdit: () => void;
  onPray: () => void;
}

function SheepCard({ sheep, onEdit, onPray }: SheepCardProps) {
  const getCategoryStyle = (category: SheepCategory) => {
    switch (category) {
      case '新朋友':
        return { color: 'text-[#5385db]', bg: 'bg-[#d2dbea]' };
      case '慕道友':
        return { color: 'text-[#4ba762]', bg: 'bg-[#c2e7cb]' };
      case '基督徒':
        return { color: 'text-[#7f5b9b]', bg: 'bg-[#e5d6f1]' };
    }
  };

  const getStatusStyle = (status: SheepStatus) => {
    switch (status) {
      case '健康':
        return { color: 'text-[#4ba762]', bg: 'bg-[#c2e7cb]' };
      case '虛弱':
        return { color: 'text-[#f39fac]', bg: 'bg-[#fde8ec]' };
      case '失喪的靈魂':
        return { color: 'text-[#b65a5a]', bg: 'bg-[#f5d6d6]' };
    }
  };

  const categoryStyle = getCategoryStyle(sheep.category);
  const statusStyle = getStatusStyle(sheep.status);

  return (
    <div className="bg-[#fffaf2] content-stretch flex flex-col gap-[6px] items-center p-[12px] relative rounded-[20px] shrink-0 w-[160px]">
      <div aria-hidden="true" className="absolute border border-[#f0dcc0] border-solid inset-0 pointer-events-none rounded-[20px]" />
      
      {/* Edit Button */}
      <button
        onClick={onEdit}
        className="absolute right-[12px] top-[12px] size-[20px] hover:opacity-70 transition-opacity"
      >
        <PencilIcon />
      </button>

      {/* Sheep Image */}
      <div className="relative shrink-0 size-[60px]">
        <img alt="" className="absolute inset-0 max-w-none object-contain pointer-events-none size-full" src={sheep.image} />
      </div>

      {/* Sheep Info */}
      <div className="content-stretch flex flex-col gap-[8px] items-center relative shrink-0 w-full">
        {/* Name */}
        <p className="css-ew64yg font-['Rounded_Mgen+_1c:medium',sans-serif] leading-[18px] not-italic relative shrink-0 text-[#7b5b33] text-[18px]">
          {sheep.name}
        </p>

        {/* Love Value */}
        <div className="content-stretch flex gap-[2px] h-[14px] items-center relative shrink-0">
          <HeartIcon />
          <p className="css-ew64yg font-['Rounded_Mgen+_1c:medium',sans-serif] leading-[18px] not-italic relative shrink-0 text-[#b65a5a] text-[12px]">
            {sheep.loveValue}%
          </p>
        </div>

        {/* Tags */}
        <div className="content-stretch flex gap-[8px] h-[26px] items-start justify-center relative shrink-0 w-full">
          {/* Category Tag */}
          <div className={`${categoryStyle.bg} h-[26px] relative rounded-[8px] shrink-0`}>
            <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full px-[8px] flex items-center">
              <p className={`css-ew64yg font-['Huninn:Regular',sans-serif] leading-[18px] not-italic ${categoryStyle.color} text-[12px]`}>
                {sheep.category}
              </p>
            </div>
          </div>

          {/* Status Tag */}
          <div className={`${statusStyle.bg} h-[26px] relative rounded-[8px] shrink-0`}>
            <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full px-[8px] flex items-center">
              <p className={`css-ew64yg font-['Huninn:Regular',sans-serif] leading-[18px] not-italic ${statusStyle.color} text-[12px]`}>
                {sheep.status === '失喪的靈魂' ? '失喪' : sheep.status}
              </p>
            </div>
          </div>
        </div>

        {/* Pray Button */}
        {sheep.prayCount >= 3 ? (
          <div className="bg-[#c7b292] relative rounded-[60px] shrink-0 w-full">
            <div className="flex flex-row items-center justify-center size-full">
              <div className="content-stretch flex items-center justify-center px-[8px] py-[5px] relative w-full">
                <p className="css-ew64yg font-['Rounded_Mgen+_1c:medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#ffefd6] text-[14px] tracking-[0.42px]">
                  明天再繼續
                </p>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={onPray}
            className="bg-[#f39fac] relative rounded-[60px] shrink-0 w-full hover:bg-[#e88d9c] transition-colors"
          >
            <div className="flex flex-row items-center justify-center size-full">
              <div className="content-stretch flex gap-[2px] items-center justify-center px-[8px] py-[5px] relative w-full">
                <HandsPrayingIcon />
                <p className="css-ew64yg font-['Rounded_Mgen+_1c:medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[14px] text-white tracking-[0.42px]">
                  為他禱告 {sheep.prayCount}/3
                </p>
              </div>
            </div>
          </button>
        )}
      </div>
    </div>
  );
}

export function SheepListModal({ isOpen, onClose, sheep, onUpdateSheep, onAddNewSheep, onPray }: SheepListModalProps) {
  const [editingSheep, setEditingSheep] = useState<SheepData | null>(null);
  const [isAddingNewSheep, setIsAddingNewSheep] = useState(false);
  const [newSheepName, setNewSheepName] = useState('');
  const [newSheepCategory, setNewSheepCategory] = useState<SheepCategory>('新朋友');
  const [newSheepNotes, setNewSheepNotes] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<SheepCategory[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<SheepStatus[]>([]);
  const [searchName, setSearchName] = useState('');
  const [showFilter, setShowFilter] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);

  // Reset filter visibility when modal opens
  useEffect(() => {
    if (isOpen) {
      setShowFilter(true);
      lastScrollY.current = 0;
    }
  }, [isOpen]);

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer || !isOpen) return;

    const handleScroll = () => {
      const currentScrollY = scrollContainer.scrollTop;
      
      if (currentScrollY < lastScrollY.current) {
        // Scrolling up - show filter
        setShowFilter(true);
      } else if (currentScrollY > lastScrollY.current && currentScrollY > 30) {
        // Scrolling down - hide filter
        setShowFilter(false);
      }
      
      lastScrollY.current = currentScrollY;
    };

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, [isOpen]);

  const toggleCategory = (category: SheepCategory) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const toggleStatus = (status: SheepStatus) => {
    setSelectedStatuses(prev => 
      prev.includes(status) 
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  const filteredSheep = sheep.filter(s => {
    const categoryMatch = selectedCategories.length === 0 || selectedCategories.includes(s.category);
    const statusMatch = selectedStatuses.length === 0 || selectedStatuses.includes(s.status);
    const nameMatch = searchName === '' || s.name.toLowerCase().includes(searchName.toLowerCase());
    return categoryMatch && statusMatch && nameMatch;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div className="absolute inset-0 bg-[rgba(0,0,0,0.6)]" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-[#f3eee7] content-stretch flex flex-col h-[650px] w-[362px] items-center justify-center overflow-clip rounded-[30px]">
        {/* Header */}
        <div className="bg-[#fcb751] relative shrink-0 w-full">
          <div className="flex flex-row items-center justify-center size-full">
            <div className="content-stretch flex gap-[5px] items-center justify-center px-[24px] py-[10px] relative w-full">
              <SheepIcon />
              <p className="css-ew64yg font-['Rounded_Mgen+_1c:medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[18px] text-white tracking-[0.54px]">
                你的羊群
              </p>
            </div>
          </div>
        </div>

        {/* Filter Chips */}
        <div 
          className={`bg-[#f3eee7] w-full shrink-0 overflow-hidden transition-all duration-300 ease-in-out ${
            showFilter ? 'max-h-[200px]' : 'max-h-0'
          }`}
        >
          {/* Search Input */}
          <div className="px-[16px] pt-[16px]">
            <input
              type="text"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              placeholder="搜尋姓名"
              className="w-full px-3 py-2 bg-white border border-[#c7b292] rounded-[10px] text-[14px] text-[#7b5b33] placeholder:text-[#c7b292]"
            />
          </div>

          {/* Horizontal Scrolling Chips */}
          <div className="overflow-x-auto px-[16px] py-[12px]">
            <div className="flex gap-[6px] items-center">
              {(['新朋友', '慕道友', '基督徒'] as SheepCategory[]).map((category) => {
                const isSelected = selectedCategories.includes(category);
                const style = {
                  '新朋友': { selectedBg: 'bg-[#5385db]' },
                  '慕道友': { selectedBg: 'bg-[#4ba762]' },
                  '基督徒': { selectedBg: 'bg-[#7f5b9b]' },
                }[category];
                
                return (
                  <button
                    key={category}
                    onClick={() => toggleCategory(category)}
                    className={`${isSelected ? `${style.selectedBg} text-white` : 'bg-transparent text-[#7b5b33] border border-[#7b5b33]'} px-[12px] py-[4px] rounded-[8px] text-[12px] font-['Huninn:Regular',sans-serif] transition-colors hover:opacity-80 flex items-center gap-[4px] whitespace-nowrap`}
                  >
                    {category}
                    {isSelected && <span className="text-[10px]">✕</span>}
                  </button>
                );
              })}
              
              {(['健康', '虛弱', '失喪的靈魂'] as SheepStatus[]).map((status) => {
                const isSelected = selectedStatuses.includes(status);
                const style = {
                  '健康': { selectedBg: 'bg-[#4ba762]' },
                  '虛弱': { selectedBg: 'bg-[#f39fac]' },
                  '失喪的靈魂': { selectedBg: 'bg-[#b65a5a]' },
                }[status];
                
                return (
                  <button
                    key={status}
                    onClick={() => toggleStatus(status)}
                    className={`${isSelected ? `${style.selectedBg} text-white` : 'bg-transparent text-[#7b5b33] border border-[#7b5b33]'} px-[12px] py-[4px] rounded-[8px] text-[12px] font-['Huninn:Regular',sans-serif] transition-colors hover:opacity-80 flex items-center gap-[4px] whitespace-nowrap`}
                  >
                    {status === '失喪的靈魂' ? '失喪' : status}
                    {isSelected && <span className="text-[10px]">✕</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sheep Grid */}
        <div className="flex-1 min-h-px min-w-px relative w-full overflow-auto" ref={scrollRef}>
          <div className="content-start flex flex-wrap gap-[10px] items-start px-[16px] py-[24px] pb-[150px] relative size-full">
            {filteredSheep.map((s) => (
              <SheepCard
                key={s.id}
                sheep={s}
                onEdit={() => setEditingSheep(s)}
                onPray={() => onPray(s)}
              />
            ))}
          </div>
        </div>

        {/* Bottom Buttons */}
        <div className="absolute bottom-0 content-stretch flex gap-[10px] items-center justify-center left-0 pb-[20px] pt-[16px] w-full px-[16px] pointer-events-none">
          <button
            onClick={onClose}
            className="bg-[#a28e8e] content-stretch flex h-[43px] items-center justify-center px-[18px] py-[10px] relative rounded-[214712px] shrink-0 hover:bg-[#8f7d7d] transition-colors pointer-events-auto"
          >
            <div aria-hidden="true" className="absolute border-2 border-solid border-white inset-0 pointer-events-none rounded-[214712px] shadow-[0px_2px_6px_0px_rgba(0,0,0,0.18)]" />
            <p className="css-ew64yg font-['Rounded_Mgen+_1c:medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[18px] text-white tracking-[0.54px]">
              關閉
            </p>
          </button>

          <button
            onClick={() => setIsAddingNewSheep(true)}
            className="bg-[#54afcb] content-stretch flex gap-[5px] items-center px-[16px] py-[8px] relative rounded-[30px] shrink-0 hover:bg-[#4a9ab5] transition-colors pointer-events-auto"
          >
            <div aria-hidden="true" className="absolute border-2 border-solid border-white inset-[-2px] pointer-events-none rounded-[32px] shadow-[0px_2px_6px_0px_rgba(0,0,0,0.18)]" />
            <PlusIcon />
            <p className="css-ew64yg font-['Rounded_Mgen+_1c:medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[18px] text-white tracking-[0.54px]">
              認領小羊
            </p>
          </button>
        </div>
      </div>

      {/* Add New Sheep Modal */}
      {isAddingNewSheep && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-4 z-10">
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
                    onAddNewSheep(newSheepName, newSheepCategory, newSheepNotes);
                    setNewSheepName('');
                    setNewSheepCategory('新朋友');
                    setNewSheepNotes('');
                    setIsAddingNewSheep(false);
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
                  setIsAddingNewSheep(false);
                }}
                className="flex-1 bg-[#c7b292] text-[#ffefd6] py-2 rounded-[30px] font-['Rounded_Mgen+_1c:medium',sans-serif] hover:bg-[#b5a184] transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingSheep && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-4 z-10">
          <div className="bg-[#ffefd6] rounded-[20px] max-w-md w-full p-6">
            <h3 className="font-['Rounded_Mgen+_1c:medium',sans-serif] text-[20px] text-[#7b5b33] mb-4">
              小羊資料卡
            </h3>
            
            <div className="space-y-3">
              <div>
                <label className="text-[14px] text-[#7b5b33] mb-1 block">姓名</label>
                <input
                  type="text"
                  value={editingSheep.name}
                  onChange={(e) => setEditingSheep({ ...editingSheep, name: e.target.value })}
                  className="w-full px-3 py-2 bg-white border-2 border-[#8f7d67] rounded-[10px] text-[14px]"
                />
              </div>

              <div>
                <label className="text-[14px] text-[#7b5b33] mb-1 block">類別</label>
                <select
                  value={editingSheep.category}
                  onChange={(e) => setEditingSheep({ ...editingSheep, category: e.target.value as SheepCategory })}
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
                  value={editingSheep.notes}
                  onChange={(e) => setEditingSheep({ ...editingSheep, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-white border-2 border-[#8f7d67] rounded-[10px] text-[14px] min-h-[80px]"
                  placeholder="輸入備註..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  onUpdateSheep(editingSheep);
                  setEditingSheep(null);
                }}
                className="flex-1 bg-[#54afcb] text-white py-2 rounded-[30px] font-['Rounded_Mgen+_1c:medium',sans-serif] hover:bg-[#4a9ab5] transition-colors"
              >
                儲存
              </button>
              <button
                onClick={() => setEditingSheep(null)}
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