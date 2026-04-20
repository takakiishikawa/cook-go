@AGENTS.md

# CookGo — CLAUDE.md

このプロダクトは **Goシリーズ** の一員です。  
Goシリーズ共通のデザインシステムは `@takaki/go-design-system` リポで管理されています。

## 絶対に守るルール（最重要）

### 1. UIコンポーネントは必ず @takaki/go-design-system から import する

- ✅ 正しい：`import { Button, Card } from '@takaki/go-design-system'`
- ❌ NG：独自に `components/ui/button.tsx` を作る（再エクスポートラッパーは許可）
- ❌ NG：shadcn/ui CLI で直接コンポーネントを追加する

### 2. 必要なコンポーネントがない場合

独自に作らず、以下のいずれかを選ぶ：
- 既存コンポーネントの組み合わせで実現できないか検討
- どうしても必要な場合は、go-design-system リポに追加する

### 3. デザイントークンの上書き禁止

許可されている上書き：
- `--color-primary`（このプロダクトのブランドカラー）
- `--color-primary-hover`

禁止されている上書き：
- 色（上記以外全て）
- 角丸（`--radius-*`）
- フォントサイズ（`--text-*`）
- 余白（`--space-*`）
- シャドウ（`--shadow-*`）

### 4. className の使用範囲

許可：
- レイアウト（`flex`, `grid`, `gap`, `justify-*`, `items-*`）
- 配置（`margin`, `padding` でトークン値を使う場合）
- レスポンシブ制御（`md:`, `lg:`）

禁止：
- 色の直接指定（`bg-red-500`, `text-blue-600` など）
- 固定値の角丸（`rounded-lg` など、トークン経由で使う）
- 独自のシャドウ
- カスタムフォントサイズ

### 5. アイコンは lucide-react に統一

- ✅ `import { Leaf } from 'lucide-react'`
- ❌ 他のアイコンライブラリを追加しない

### 6. レイアウトパターンはテンプレートから派生させる

`AppLayout` + `CookGoSidebar` を `src/app/(app)/layout.tsx` で使用している。
新規ページは既存パターンに従う。

## CSS の読み込み方（Tailwind v4 + Turbopack）

**正しい方法：`DesignTokens` コンポーネントを `app/layout.tsx` の `<head>` に置く**

```tsx
import { DesignTokens } from '@takaki/go-design-system'

<head>
  <DesignTokens primaryColor="#16A34A" primaryColorHover="#15803D" />
</head>
```

Tailwind が設計システムのクラスをスキャンするよう `app/globals.css` に `@source` を追加：

```css
@import "tailwindcss";
@source "../node_modules/@takaki/go-design-system/dist";
@import "@takaki/go-design-system/theme.css";
```

## デザインシステムの更新への追従

```json
// vercel.json
{
  "buildCommand": "npm update @takaki/go-design-system && npm run build"
}
```

## プライマリカラー

**#16A34A（フレッシュグリーン）**

選定理由：
- CookGo は料理・栄養管理アプリ。新鮮な食材、健康的な食事、自然の恵みを連想させる緑を選択
- タンパク質ゲージを見る体験は「成長・達成」の感覚。緑はその達成感を強調
- 既存 UI で使われていた emerald 系の緑（#10b981）から、より落ち着いた forest green へ洗練

## このプロダクト固有の情報

- **プロダクト名**: CookGo
- **プライマリカラー**: `#16A34A` / hover: `#15803D`
- **ドメイン**: https://cook-go.vercel.app
- **データモデル**: meal_logs, recipes, pantry_items, shopping_list_items, recurring_meals, user_settings
- **外部連携**: Supabase (DB + Auth), Anthropic Claude API (meal analysis, recipe suggestions)
- **スキーマ**: cookgo (Supabase schema prefix)

## サイドバー

`src/components/layout/cook-go-sidebar.tsx` — Goシリーズ共通の `AppSwitcher` を含む。

## AppSwitcher の設定

```tsx
const GO_APPS = [
  { name: "NativeGo", url: "https://native-go.vercel.app", color: "#3B82F6" },
  { name: "CareGo", url: "https://care-go.vercel.app", color: "#EC4899" },
  { name: "KenyakuGo", url: "https://kenyaku-go.vercel.app", color: "#F59E0B" },
  { name: "TaskGo", url: "https://task-go.vercel.app", color: "#8B5CF6" },
  { name: "CookGo", url: "https://cook-go.vercel.app", color: "#16A34A" },
  { name: "PhysicalGo", url: "https://physical-go.vercel.app", color: "#06B6D4" },
  { name: "Design System", url: "https://go-design-system.vercel.app", color: "#6B7280" },
]
```

## 作業時の判断基準

1. 新しい UI が必要 → まず `@takaki/go-design-system` に該当コンポーネントがあるか確認
2. ある → それを使う
3. ない → 既存の組み合わせで実現できないか検討
4. それも無理 → go-design-system 側への追加を検討

独自実装は最後の手段。
