import { MASTER_ORGS, TOTAL_ORGS } from './masterData';
import type { SurveyResponse, DashboardData, CityStats, Organization } from './masterData';

// CSV 파싱: 한 줄을 필드 배열로 변환 (쉼표 내 큰따옴표 처리)
function parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current.trim());
    return result;
}

// 구글 스프레드시트 CSV 데이터 Fetch
export async function fetchSheetData(): Promise<SurveyResponse[]> {
    const csvUrl = process.env.NEXT_PUBLIC_SHEET_CSV_URL;

    if (!csvUrl) {
        console.warn('NEXT_PUBLIC_SHEET_CSV_URL 환경 변수가 설정되지 않았습니다. 샘플 데이터를 사용합니다.');
        return getSampleData();
    }

    try {
        // 캐시 방지를 위한 타임스탬프 파라미터 추가
        const separator = csvUrl.includes('?') ? '&' : '?';
        const url = `${csvUrl}${separator}_t=${Date.now()}`;

        const response = await fetch(url, {
            cache: 'no-store',
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const text = await response.text();
        return parseCSV(text);
    } catch (error) {
        console.error('구글 스프레드시트 데이터 가져오기 실패:', error);
        return [];
    }
}

// 기관명 별칭 매핑 (시트에 잘못 입력된 이름 → 정식 이름)
const ORG_NAME_ALIASES: Record<string, string> = {
    '사천건양주간보호센터': '사천건양주야간보호센터',
};

// CSV 텍스트를 SurveyResponse 배열로 변환
function parseCSV(text: string): SurveyResponse[] {
    const lines = text.split('\n').filter(line => line.trim() !== '');

    // 첫 번째 행은 헤더, 건너뛰기
    if (lines.length <= 1) return [];

    return lines.slice(1).map(line => {
        const fields = parseCSVLine(line);
        const rawOrgName = (fields[20] || '').trim();
        // 별칭 매핑 적용: 잘못 입력된 이름을 정식 이름으로 변환
        const orgName = ORG_NAME_ALIASES[rawOrgName] || rawOrgName;

        return {
            timestamp: fields[0] || '',          // A열 (Column 0): 타임스탬프
            city: fields[1] || '',               // B열 (Column 1): 소속 시군
            orgName,                             // U열 (Column 20): 통합 수행기관명
            boxes: parseNumber(fields[21]),      // V열 (Column 21): 수령 박스 수
            quantity: parseNumber(fields[22]),    // W열 (Column 22): 내용물 총 수량
            remarks: fields[23] || '',           // X열 (Column 23): 기타 특이사항
            managerName: fields[25] || '',       // Z열 (Column 25): 담당자
        };
    }).filter(r => r.orgName !== ''); // 기관명 없는 행은 제외
}

// "8박스", "562개", "1,021개", "브라 174개, 팬티 492개 총 666개" 등에서 숫자 추출
function parseNumber(value: string | undefined): number {
    if (!value) return 0;
    const cleaned = value.trim();
    if (!cleaned) return 0;

    // 콤마 제거한 버전
    const noComma = cleaned.replace(/,/g, '');

    // 순수 숫자면 바로 반환
    if (/^\d+$/.test(noComma)) return parseInt(noComma, 10);

    // "총 666개" "총:986" 패턴이 있으면 총 뒤의 숫자 사용
    const totalMatch = noComma.match(/총\s*[:：]?\s*(\d+)/);
    if (totalMatch) return parseInt(totalMatch[1], 10);

    // 숫자로 시작하면 첫 번째 숫자가 총계 ("1139개(브라:689/팬티450)" → 1139, "8박스" → 8)
    if (/^\d/.test(noComma)) {
        const firstMatch = noComma.match(/^(\d+)/);
        if (firstMatch) return parseInt(firstMatch[1], 10);
    }

    // 텍스트로 시작하면 모든 숫자를 합산 ("브라 305, 팬티252" → 305+252=557)
    const allNums = noComma.match(/\d+/g);
    if (allNums && allNums.length > 0) {
        return allNums.reduce((sum, n) => sum + parseInt(n, 10), 0);
    }

    return 0;
}

// 대시보드 데이터 가공
export function processDashboardData(responses: SurveyResponse[]): DashboardData {
    // 중복 제출 처리: 기관명 기준으로 가장 최근(마지막) 응답만 사용
    const latestMap = new Map<string, SurveyResponse>();
    for (const r of responses) {
        const key = r.orgName.trim();
        if (key) {
            latestMap.set(key, r); // 같은 기관은 덮어쓰기 → 마지막(최신)이 남음
        }
    }
    const deduplicated = Array.from(latestMap.values());

    const submittedNames = new Set(deduplicated.map(r => r.orgName.trim()));

    const submittedOrgs = MASTER_ORGS.filter(org =>
        submittedNames.has(org.name)
    );
    const unsubmittedOrgs = MASTER_ORGS.filter(org =>
        !submittedNames.has(org.name)
    );

    const totalBoxes = deduplicated.reduce((sum, r) => sum + r.boxes, 0);
    const totalQuantity = deduplicated.reduce((sum, r) => sum + r.quantity, 0);

    // 시·군별 통계
    const cityMap = new Map<string, { submitted: number; total: number; boxes: number; quantity: number }>();

    // 마스터 명단 기반 total 초기화
    for (const org of MASTER_ORGS) {
        if (!cityMap.has(org.city)) {
            cityMap.set(org.city, { submitted: 0, total: 0, boxes: 0, quantity: 0 });
        }
        cityMap.get(org.city)!.total++;
    }

    // 중복 제거된 응답 데이터 기반 submitted, boxes, quantity 집계
    for (const r of deduplicated) {
        const city = r.city.trim();
        if (cityMap.has(city)) {
            const stat = cityMap.get(city)!;
            stat.submitted++;
            stat.boxes += r.boxes;
            stat.quantity += r.quantity;
        }
    }

    const cityStats: CityStats[] = Array.from(cityMap.entries())
        .map(([city, stat]) => ({ city, ...stat }))
        .sort((a, b) => a.city.localeCompare(b.city, 'ko'));

    return {
        responses: deduplicated,
        totalOrgs: TOTAL_ORGS,
        submittedCount: submittedOrgs.length,
        submissionRate: Math.round((submittedOrgs.length / TOTAL_ORGS) * 1000) / 10,
        totalBoxes,
        totalQuantity,
        submittedOrgs,
        unsubmittedOrgs,
        cityStats,
    };
}

// 환경 변수 미설정 시 샘플 데이터
function getSampleData(): SurveyResponse[] {
    const sampleOrgs: { name: string; city: string }[] = [
        { name: "동진노인통합지원센터", city: "창원시" },
        { name: "진양노인통합지원센터", city: "진주시" },
        { name: "거창노인통합지원센터", city: "거창군" },
        { name: "효능원노인통합지원센터", city: "김해시" },
        { name: "통영시종합사회복지관", city: "통영시" },
        { name: "하동노인통합지원센터", city: "하동군" },
        { name: "사천노인통합지원센터", city: "사천시" },
        { name: "밀양노인통합지원센터", city: "밀양시" },
        { name: "양산행복한돌봄 사회적협동조합", city: "양산시" },
        { name: "의령노인통합지원센터", city: "의령군" },
        { name: "창녕지역자활센터", city: "창녕군" },
        { name: "화방남해노인통합지원센터", city: "남해군" },
        { name: "산청한일노인통합지원센터", city: "산청군" },
        { name: "합천노인통합지원센터", city: "합천군" },
        { name: "김해시종합사회복지관", city: "김해시" },
    ];

    return sampleOrgs.map((org, i) => ({
        timestamp: new Date(Date.now() - i * 3600000).toISOString(),
        city: org.city,
        orgName: org.name,
        boxes: Math.floor(Math.random() * 10) + 1,
        quantity: Math.floor(Math.random() * 500) + 100,
        remarks: Math.random() > 0.7 ? "특이사항 있음" : "",
        managerName: "홍길동",
    }));
}
