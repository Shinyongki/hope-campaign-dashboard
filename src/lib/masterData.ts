// 59개 수행기관 마스터 데이터 (기관코드, 전화번호 포함)

export interface Organization {
  city: string;        // 시·군
  code: string;        // 기관코드
  name: string;        // 기관명
  phone: string;       // 전화번호
}

export interface SurveyResponse {
  timestamp: string;   // A열: 제출 시간
  city: string;        // B열: 소속 시군
  orgName: string;     // U열: 통합 수행기관명
  boxes: number;       // V열: 수령 박스 수
  quantity: number;    // W열: 내용물 총 수량
  remarks: string;     // X열: 기타 특이사항
  managerName: string; // Z열: 담당자 (추가)
}

export interface DashboardData {
  responses: SurveyResponse[];
  totalOrgs: number;
  submittedCount: number;
  submissionRate: number;
  totalBoxes: number;
  totalQuantity: number;
  submittedOrgs: Organization[];
  unsubmittedOrgs: Organization[];
  cityStats: CityStats[];
}

export interface CityStats {
  city: string;
  submitted: number;
  total: number;
  boxes: number;
  quantity: number;
}

export const MASTER_ORGS: Organization[] = [
  { city: "거제시", code: "A48310001", name: "거제노인통합지원센터", phone: "055-638-2111" },
  { city: "거제시", code: "A48310002", name: "거제사랑노인복지센터", phone: "055-637-6675" },
  { city: "거제시", code: "A48310003", name: "하청교회 행복늘푸른대학", phone: "055-636-6660" },
  { city: "거제시", code: "A48310004", name: "은빛노인통합지원센터", phone: "055-950-0595" },
  { city: "거창군", code: "A48880002", name: "거창노인통합지원센터", phone: "055-943-1365" },
  { city: "거창군", code: "A48880003", name: "거창인애노인통합지원센터", phone: "055-942-9116" },
  { city: "거창군", code: "A48880004", name: "해월노인복지센터", phone: "055-945-1080" },
  { city: "고성군", code: "A48820003", name: "대한노인회 고성군지회(노인맞춤돌봄서비스)", phone: "055-804-7500" },
  { city: "고성군", code: "A48820005", name: "사회적협동조합 노인세상", phone: "055-674-8989" },
  { city: "김해시", code: "A48250001", name: "효능원노인통합지원센터", phone: "055-723-4888" },
  { city: "김해시", code: "A48250004", name: "김해시종합사회복지관", phone: "070-7605-7774" },
  { city: "김해시", code: "A48250005", name: "생명의전화노인통합지원센터", phone: "055-325-9195" },
  { city: "김해시", code: "A48250006", name: "보현행원노인통합지원센터", phone: "055-329-0070" },
  { city: "김해시", code: "A48250007", name: "김해돌봄지원센터", phone: "055-724-0515" },
  { city: "남해군", code: "A48840001", name: "화방남해노인통합지원센터", phone: "055-863-1737" },
  { city: "남해군", code: "A48840002", name: "화방재가복지센터", phone: "055-863-1988" },
  { city: "밀양시", code: "A48270001", name: "밀양시자원봉사단체협의회", phone: "055-352-0094" },
  { city: "밀양시", code: "A48270002", name: "밀양노인통합지원센터", phone: "055-391-1904" },
  { city: "밀양시", code: "A48270003", name: "우리들노인통합지원센터", phone: "055-802-8765" },
  { city: "사천시", code: "A48240001", name: "사랑원노인지원센터", phone: "055-786-8894" },
  { city: "사천시", code: "A48240002", name: "사천노인통합지원센터", phone: "055-833-3700" },
  { city: "사천시", code: "A48240003", name: "남양양로원", phone: "055-835-9105" },
  { city: "사천시", code: "A48240004", name: "사천건양주야간보호센터", phone: "055-854-5913" },
  { city: "산청군", code: "A48860001", name: "산청한일노인통합지원센터", phone: "055-974-1200" },
  { city: "산청군", code: "A48860002", name: "산청복음노인통합지원센터", phone: "055-973-7900" },
  { city: "산청군", code: "A48860003", name: "산청해민노인통합지원센터", phone: "055-974-1991" },
  { city: "산청군", code: "A48860004", name: "산청성모노인통합지원센터", phone: "055-974-1095" },
  { city: "양산시", code: "A48330001", name: "사회복지법인신생원양산재가노인복지센터", phone: "055-367-8904" },
  { city: "양산시", code: "A48330004", name: "양산행복한돌봄 사회적협동조합", phone: "055-367-3750" },
  { city: "양산시", code: "A48330005", name: "성요셉소규모노인종합센터", phone: "055-366-1113" },
  { city: "의령군", code: "A48720001", name: "의령노인통합지원센터", phone: "055-572-0991" },
  { city: "진주시", code: "A48170001", name: "진양노인통합지원센터", phone: "070-4035-4513" },
  { city: "진주시", code: "A48170002", name: "진주노인통합지원센터", phone: "055-761-5172" },
  { city: "진주시", code: "A48170003", name: "나누리노인통합지원센터", phone: "055-762-1011" },
  { city: "진주시", code: "A48170004", name: "공덕의집노인통합지원센터", phone: "055-744-6557" },
  { city: "진주시", code: "A48170005", name: "하늘마음노인통합지원센터", phone: "055-763-2553" },
  { city: "창녕군", code: "A48740001", name: "창녕지역자활센터", phone: "055-532-0612" },
  { city: "창녕군", code: "A48740002", name: "창녕군새누리노인종합센터", phone: "055-526-1796" },
  { city: "창원시", code: "A48120001", name: "동진노인통합지원센터", phone: "055-299-2233" },
  { city: "창원시", code: "A48120002", name: "창원도우누리노인통합재가센터", phone: "055-262-2773" },
  { city: "창원시", code: "A48120004", name: "명진노인통합지원센터", phone: "055-271-0483" },
  { city: "창원시", code: "A48120005", name: "마산희망지역자활센터", phone: "055-224-2510" },
  { city: "창원시", code: "A48120008", name: "경남노인통합지원센터", phone: "055-298-8602" },
  { city: "창원시", code: "A48120011", name: "정현사회적협동조합", phone: "055-271-9913" },
  { city: "창원시", code: "A48120012", name: "진해서부노인종합복지관", phone: "055-547-8004" },
  { city: "창원시", code: "A48120013", name: "진해노인종합복지관", phone: "055-544-7153" },
  { city: "창원시", code: "A48120014", name: "경남고용복지센터", phone: "055-261-8533" },
  { city: "창원시", code: "A48120015", name: "마산회원노인종합복지관", phone: "070-5156-2443" },
  { city: "통영시", code: "A48220002", name: "통영시종합사회복지관", phone: "055-640-7728" },
  { city: "통영시", code: "A48220003", name: "통영노인통합지원센터", phone: "055-641-6170" },
  { city: "하동군", code: "A48850001", name: "하동노인통합지원센터", phone: "055-884-7078" },
  { city: "하동군", code: "A48850002", name: "경남하동지역자활센터", phone: "055-884-6955" },
  { city: "함안군", code: "A48730001", name: "(사)대한노인회함안군지회", phone: "055-585-8505" },
  { city: "함안군", code: "A48730002", name: "함안군재가노인통합지원센터", phone: "055-586-1236" },
  { city: "함양군", code: "A48870002", name: "사단법인 대한노인회 함양군지회", phone: "055-964-9921" },
  { city: "합천군", code: "A48890003", name: "미타재가복지센터", phone: "055-931-9121" },
  { city: "합천군", code: "A48890004", name: "합천노인통합지원센터", phone: "055-931-1014" },
  { city: "합천군", code: "A48890005", name: "코끼리행복복지센터", phone: "055-932-3141" },
  { city: "합천군", code: "A48890006", name: "사회적협동조합 합천종합복지공동체", phone: "055-933-3933" },
];

export const TOTAL_ORGS = MASTER_ORGS.length; // 59

export const CITIES = [...new Set(MASTER_ORGS.map(o => o.city))].sort();
// 18개 시군: 거제시, 거창군, 고성군, 김해시, 남해군, 밀양시, 사천시, 산청군, 양산시, 의령군, 진주시, 창녕군, 창원시, 통영시, 하동군, 함안군, 함양군, 합천군
