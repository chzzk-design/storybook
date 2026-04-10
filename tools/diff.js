/**
 * diff.js
 * 피그마 디자인 스크린샷 vs 구현 스크린샷 픽셀 비교
 *
 * 사용법:
 *   node tools/diff.js <피그마.png> <구현.png> [출력.png]
 *
 * 출력:
 * - 히트맵 이미지 (빨간색 = 차이 영역)
 * - 일치율 (%)
 * - 차이 픽셀 수
 */

const fs = require('fs');
const path = require('path');

async function main() {
  const [,, img1Path, img2Path, outputPath] = process.argv;

  if (!img1Path || !img2Path) {
    console.log('사용법: node tools/diff.js <피그마.png> <구현.png> [히트맵출력.png]');
    console.log('예시: node tools/diff.js reference/header.png build/header.png diff-header.png');
    process.exit(1);
  }

  // 동적 import (pixelmatch, pngjs는 ESM/CJS 혼용)
  let pixelmatch, PNG;
  try {
    const pm = require('pixelmatch');
    pixelmatch = pm.default || pm;
    PNG = require('pngjs').PNG;
  } catch (e) {
    console.error('❌ 의존성을 설치하세요: npm install pixelmatch pngjs');
    process.exit(1);
  }

  // 이미지 로드
  const img1 = PNG.sync.read(fs.readFileSync(img1Path));
  const img2 = PNG.sync.read(fs.readFileSync(img2Path));

  // 해상도 확인
  if (img1.width !== img2.width || img1.height !== img2.height) {
    console.error(`❌ 해상도 불일치:`);
    console.error(`  피그마: ${img1.width}x${img1.height}`);
    console.error(`  구현:   ${img2.width}x${img2.height}`);
    console.error(`  두 이미지의 해상도가 동일해야 합니다.`);
    process.exit(1);
  }

  const { width, height } = img1;
  const diff = new PNG({ width, height });

  // 픽셀 비교
  const numDiffPixels = pixelmatch(
    img1.data,
    img2.data,
    diff.data,
    width,
    height,
    {
      threshold: 0.1,           // 색상 차이 허용치 (0~1, 낮을수록 엄격)
      includeAA: false,         // 안티앨리어싱 차이 무시
      diffColor: [255, 0, 0],   // 차이 영역 = 빨간색
      diffColorAlt: [255, 165, 0] // AA 차이 = 주황색
    }
  );

  const totalPixels = width * height;
  const matchRate = ((1 - numDiffPixels / totalPixels) * 100).toFixed(2);

  // 히트맵 저장
  const out = outputPath || `diff-${Date.now()}.png`;
  fs.writeFileSync(out, PNG.sync.write(diff));

  // 결과 출력
  console.log(`══════════════════════════════════════`);
  console.log(`  픽셀 Diff 결과`);
  console.log(`══════════════════════════════════════`);
  console.log(`  해상도:     ${width}x${height}`);
  console.log(`  총 픽셀:    ${totalPixels.toLocaleString()}`);
  console.log(`  차이 픽셀:  ${numDiffPixels.toLocaleString()}`);
  console.log(`  일치율:     ${matchRate}%`);
  console.log(`  히트맵:     ${out}`);
  console.log(`══════════════════════════════════════`);

  if (parseFloat(matchRate) >= 99) {
    console.log(`  ✅ 목표 달성 (99%+)`);
  } else if (parseFloat(matchRate) >= 95) {
    console.log(`  ⚠️ 거의 일치 — 미세 조정 필요`);
  } else {
    console.log(`  ❌ 차이가 큼 — 수정 필요`);
  }
}

main();
