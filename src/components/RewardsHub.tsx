import React, { useState } from 'react';
import { Gift, Coffee, Utensils, ShoppingBag, CreditCard, Coins } from 'lucide-react';

interface RewardsHubProps {
  userPoints: number;
  // [감사 증적] 결제 승인 시 트랜잭션 ID를 상위 컴포넌트(DB)로 전달하여 로깅
  onRedeem: (points: number, name: string, transactionId: string) => void;
}

// 1. [데이터 정규화] 파트너사별 요구 포인트를 데이터 객체로 분리하여 무결성 확보
const PARTNERS = [
  {
    id: 'p1',
    name: '캠퍼스 카페 (A동)',
    category: '카페',
    icon: <Coffee className="w-5 h-5" />,
    discount: '모든 음료 500P 차감 할인',
    requiredPoints: 500, 
    location: '본관 1층',
    color: 'bg-orange-100 text-orange-600'
  },
  {
    id: 'p2',
    name: '학식당 (G동)',
    category: '음식점',
    icon: <Utensils className="w-5 h-5" />,
    discount: '1,000P 사용 시 사이드 메뉴 증정',
    requiredPoints: 1000, 
    location: '학생회관 지하 1층',
    color: 'bg-red-100 text-red-600'
  },
  {
    id: 'p3',
    name: '대학 편의점 (C동)',
    category: '편의점',
    icon: <ShoppingBag className="w-5 h-5" />,
    discount: '300P로 간식 교환 가능',
    requiredPoints: 300,
    location: 'IT관 지하',
    color: 'bg-purple-100 text-purple-600'
  },
  {
    id: 'p4',
    name: '캠퍼스 인쇄소 (J동)',
    category: '기타',
    icon: <CreditCard className="w-5 h-5" />,
    discount: '100P 차감 시 컬러 인쇄 무료',
    requiredPoints: 100,
    location: '미래관 1층',
    color: 'bg-blue-100 text-blue-600'
  }
];

export default function RewardsHub({ userPoints, onRedeem }: RewardsHubProps) {
  // [통제 피드백] 사용자에게 트랜잭션 성공/실패 여부를 명확히 고지하기 위한 상태 관리
  const [alertInfo, setAlertInfo] = useState<{ message: string; isError: boolean } | null>(null);

  const handleRedeemClick = (requiredPoints: number, partnerName: string) => {
    // 2. [내부통제 - 권한 통제] 잔액이 마이너스가 되는 것을 시스템적으로 사전 차단
    if (userPoints < requiredPoints) {
      setAlertInfo({
        message: `[승인 거부] ${partnerName} 혜택 교환에 필요한 포인트가 부족합니다. (부족: ${requiredPoints - userPoints}P)`,
        isError: true
      });
      return; 
    }

    // 3. [감사 증적 - Audit Trail] 결제 건마다 고유 식별자(TxID) 생성
    const generateTxId = `TX-${Date.now()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

    // 4. 검증 통과 시 차감 승인 및 로그 화면 출력
    setAlertInfo({
      message: `[승인 완료] ${partnerName}에서 ${requiredPoints}P가 정상 차감되었습니다. (TxID: ${generateTxId})`,
      isError: false