import { FruitHarvestGame } from "@/components/FruitHarvestGame";

export default function Home() {
  // 支援技術がページ本体へ直接移動できるよう main ランドマークで包む
  return (
    <main>
      <FruitHarvestGame />
    </main>
  );
}
