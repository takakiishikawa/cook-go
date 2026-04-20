import { Leaf } from "lucide-react";
import { ConceptPage } from "@takaki/go-design-system";
import { AppHeader } from "@/components/layout/app-header";

export default function ConceptPageRoute() {
  return (
    <div className="flex flex-col">
      <AppHeader />
      <ConceptPage
        productName="CookGo"
        productLogo={<Leaf className="w-5 h-5 text-primary" />}
        tagline="撮るだけ・選ぶだけで、タンパク質の水位が見えて、料理のレパートリーが増えていく。"
        coreMessage="食事の記録を「めんどくさい」から「一瞬で終わる」に変え、タンパク質目標の達成を習慣にする。"
        coreValue="AIによる写真解析で食事内容を自動識別し、タンパク質・カロリーを即座に集計。食材庫の在庫状況に応じたレシピ提案で、「何を作るか」の悩みをゼロにする。記録・分析・提案がシームレスにつながることで、食と栄養の自己管理を無理なく継続できる。"
        scope={{
          solve: [
            "写真1枚での食事ログと栄養自動計算",
            "タンパク質目標の可視化と達成管理",
            "食材庫在庫に基づくAIレシピ提案",
            "買い物リストの自動生成と多言語表示",
            "定期メニューの一括登録",
          ],
          notSolve: [
            "医療・臨床栄養の診断・治療",
            "アレルギー・疾患管理",
            "食事以外のフィットネス計画",
            "食材の自動購入・デリバリー連携",
          ],
        }}
        productLogic={{
          steps: [
            { title:"写真を撮る", description: "食事の写真を1枚撮影する" },
            { title:"AIが解析", description: "栄養素・食事区分を自動判定" },
            { title:"ログに蓄積", description: "タンパク質・カロリーが集計される" },
            { title:"目標と照合", description: "今日の達成度が一目でわかる" },
            { title:"レシピ提案", description: "食材庫に合わせてAIが次の食事を提案" },
          ],
          outcome: "毎日のタンパク質目標を無理なく達成し、食事の多様性が広がる",
        }}
        resultMetric={{
          title: "タンパク質目標の週次達成率 80% 以上",
          description: "ユーザーが設定した1日のタンパク質目標を、週の80%以上の日で達成できている状態",
        }}
        behaviorMetrics={[
          {
            title: "週3回以上の食事ログ",
            description: "週に3日以上、写真または手動で食事を記録している",
          },
          {
            title: "月2回以上のレシピ実践",
            description: "AIが提案したレシピを月に2回以上実際に調理している",
          },
          {
            title: "食材庫の継続的な更新",
            description: "食材庫を週1回以上更新し、在庫情報が最新状態を保っている",
          },
          {
            title: "買い物リストの利用",
            description: "レシピから自動生成した買い物リストを月1回以上活用している",
          },
        ]}
      />
    </div>
  );
}
