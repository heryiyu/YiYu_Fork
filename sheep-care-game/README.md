# 🐑 Sheep Care Game

一款療癒的牧羊養成遊戲。

## 遊戲特色
- **領養**: 召喚迷途的小羊（初始負擔 60%）。
- **禱告**: 透過禱告 (點擊) 照顧小羊，讓牠們健康長大。
- **狀態系統**: 
  - 負擔 **< 40%**：生病 🤒（需要禱告恢復）
  - 負擔 **40-79%**：健康 ✅（正常狀態）
  - 負擔 **≥ 80%**：強壯 💪（最佳狀態）
- **動態**: 小羊會在牧場上自由漫步。
- **風險**: 如果不好好照顧，小羊會因負擔歸零而離世！
- **復活**: 離世的小羊可透過連續 5 天的認領禱告復活。
- **自訂外觀**: 管理員可上傳圖片造型（支援 GIF 動圖）。

## 執行方式

1. **安裝依賴**:
   ```bash
   npm install
   ```
   (如果遇到權限問題，請嘗試使用 `npm.cmd install`)

2. **啟動遊戲**:
   ```bash
   npm run dev
   ```

3. **遊玩**:
   打開瀏覽器訪問顯示的網址 (通常是 `http://localhost:5173`)。

## 操作說明
- **點擊小羊**: 禱告（恢復負擔 +6%、增加關愛度）。
- **小羊圖鑑**: 查看所有小羊列表、搜尋、批次管理。
- **點擊頭像**: 編輯小羊外觀（顏色、配件、圖片造型）。
- **編輯資料**: 點擊欄位直接編輯姓名、靈程、備註。

## Database (Supabase)

- Migrations: See [MIGRATIONS.md](MIGRATIONS.md) for schema changes and run order.
- Run scripts in `supabase/migrations/` sequentially in Supabase SQL Editor.
