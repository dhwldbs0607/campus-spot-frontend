import React, { useState, useEffect } from 'react';

// 1. 데이터 타입 정의 (인터페이스)
interface Spot {
  id: string;
  name: string;
  description: string;
}

interface Message {
  id: string;
  spotId: string;
  user: string;
  text: string;
  time: string;
}

interface HelpRequest {
  id: string;
  title: string;
  rewardPoints: number;
  status: '모집중' | '도움제공됨' | '완료';
}

export default function App() {
  // 2. 상태 관리 (State)
  const [currentSpot, setCurrentSpot] = useState<string>('spot_A'); // 현재 위치 (GPS 시뮬레이션)
  const [userPoints, setUserPoints] = useState<number>(1000);        // 유저 리워드 잔액
  const [inputText, setInputText] = useState<string>('');           // 게시판 입력 필드
  
  // 가상 장소 데이터
  const spots: Spot[] = [
    { id: 'spot_A', name: '📍 도서관 정문 스팟', description: '현재 도서관에 있는 학생들이 실시간으로 소통 중입니다.' },
    { id: 'spot_B', name: '📍 학생회관 광장 스팟', description: '학생회관 주변의 실시간 정보 공유 공간입니다.' },
    { id: 'spot_C', name: '📍 본관 대강당 스팟', description: '대강당 주변의 실시간 게시판입니다.' },
  ];

  // 실시간 게시판 메시지 데이터 (초기값)
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', spotId: 'spot_A', user: '익명1', text: '도서관 3층 열람실 지금 자리 많나요?', time: '방금 전' },
    { id: '2', spotId: 'spot_A', user: '익명2', text: '2층 노트북석 자리 널널해요!', time: '1분 전' },
    { id: '3', spotId: 'spot_B', user: '익명3', text: '학생회관 앞에 푸드트럭 왔어요', time: '5분 전' },
  ]);

  // SOS 도움 요청 데이터
  const [helpRequests, setHelpRequests] = useState<HelpRequest[]>([
    { id: 'req_1', title: '도서관 4층인데 컴퓨터 충전기 빌려주실 분 ㅠㅠ', rewardPoints: 200, status: '모집중' },
    { id: 'req_2', title: '학생회관 서점에서 전공책 대신 수령해 주실 분 구합니다', rewardPoints: 500, status: '모집중' },
  ]);

  // 3. 기능 로직 (Hander Functions)
  
  // 기능 [1]: 실시간 상호작용 (메시지 전송)
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      spotId: currentSpot,
      user: '나(사용자)',
      text: inputText,
      time: '방금 전',
    };

    setMessages([...messages, newMessage]);
    setInputText('');
  };

  // 기능 [2]: 도움 요청 응답 및 리워드 지급 로직 (핵심)
  const handleAcceptHelp = (id: string, points: number) => {
    // 요청 상태 변경
    setHelpRequests(helpRequests.map(req => 
      req.id === id ? { ...req, status: '완료' } : req
    ));
    
    // 리워드 포인트 가산 (통제 데이터 반영)
    setUserPoints(prevPoints => prevPoints + points);
    
    alert(`🎉 도움이 완료되었습니다! ${points}P가 지급되었습니다.`);
  };

  // 현재 선택된 스팟 정보 추출
  const activeSpot = spots.find(s => s.id === currentSpot) || spots[0];

  // 4. UI 렌더링
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif', backgroundColor: '#f9f9fb', minHeight: '100vh' }}>
      
      {/* 상단 헤더 및 리워드 대시보드 */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '20px', margin: 0, color: '#1a1f36' }}>Campus Spot Core</h1>
          <p style={{ fontSize: '12px', color: '#697386', margin: '4px 0 0 0' }}>위치 기반 실시간 상호작용 플랫폼</p>
        </div>
        <div style={{ backgroundColor: '#edf2fe', padding: '8px 16px', borderRadius: '20px', fontWeight: 'bold', color: '#4f46e5' }}>
          내 리워드: <span style={{ color: '#111827' }}>{userPoints.toLocaleString()} P</span>
        </div>
      </header>

      {/* GPS 위치 시뮬레이터 (면접관 시연용 구동 기능) */}
      <section style={{ backgroundColor: '#fff', padding: '15px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', marginBottom: '20px' }}>
        <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#4f566b' }}>🛰️ GPS 현재 위치 시뮬레이터 (이동할 장소를 선택하세요)</h3>
        <div style={{ display: 'flex', gap: '10px' }}>
          {spots.map(spot => (
            <button
              key={spot.id}
              onClick={() => setCurrentSpot(spot.id)}
              style={{
                flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid',
                borderColor: currentSpot === spot.id ? '#4f46e5' : '#e3e8ee',
                backgroundColor: currentSpot === spot.id ? '#edf2fe' : '#fff',
                color: currentSpot === spot.id ? '#4f46e5' : '#1a1f36',
                fontWeight: currentSpot === spot.id ? 'bold' : 'normal',
                cursor: 'pointer', transition: 'all 0.2s'
              }}
            >
              {spot.name.split(' ')[1]} {/* 이모지 제외 이름만 */}
            </button>
          ))}
        </div>
      </section>

      {/* 메인 콘텐츠 영역 */}
      <div style={{ display: 'flex', gap: '20px' }}>
        
        {/* 왼쪽: 실시간 스팟 게시판 (위치 연동) */}
        <main style={{ flex: 1, backgroundColor: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <div style={{ borderBottom: '2px solid #f4f6f8', paddingBottom: '10px', marginBottom: '15px' }}>
            <h2 style={{ fontSize: '16px', margin: 0, color: '#1a1f36' }}>{activeSpot.name}</h2>
            <p style={{ fontSize: '12px', color: '#697386', margin: '4px 0 0 0' }}>{activeSpot.description}</p>
          </div>

          {/* 메시지 리스트 */}
          <div style={{ height: '250px', overflowY: 'auto', marginBottom: '15px', padding: '5px' }}>
            {messages.filter(msg => msg.spotId === currentSpot).length === 0 ? (
              <p style={{ color: '#a3acb9', textAlign: 'center', marginTop: '100px', fontSize: '14px' }}>이 스팟의 첫 번째 대화에 참여해 보세요!</p>
            ) : (
              messages
                .filter(msg => msg.spotId === currentSpot)
                .map(msg => (
                  <div key={msg.id} style={{ marginBottom: '12px', padding: '10px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 'bold', fontSize: '12px', color: '#4f566b' }}>{msg.user}</span>
                      <span style={{ fontSize: '11px', color: '#a3acb9' }}>{msg.time}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '13px', color: '#1a1f36' }}>{msg.text}</p>
                  </div>
                ))
            )}
          </div>

          {/* 메시지 입력 폼 */}
          <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="실시간 대화에 참여하세요..."
              style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #e3e8ee', fontSize: '13px' }}
            />
            <button type="submit" style={{ padding: '10px 16px', backgroundColor: '#4f46e5', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
              전송
            </button>
          </form>
        </main>

        {/* 오른쪽: SOS 도움 요청 및 리워드 매칭 */}
        <aside style={{ width: '320px', backgroundColor: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <h2 style={{ fontSize: '16px', margin: '0 0 15px 0', color: '#1a1f36', borderBottom: '2px solid #f4f6f8', paddingBottom: '10px' }}>
            🆘 실시간 도움 요청 (SOS)
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {helpRequests.map(req => (
              <div key={req.id} style={{ padding: '12px', border: '1px solid #e3e8ee', borderRadius: '8px', backgroundColor: req.status === '완료' ? '#f4f6f8' : '#fff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '4px', backgroundColor: req.status === '완료' ? '#9a9ea6' : '#fee2e2', color: req.status === '완료' ? '#fff' : '#ef4444', fontWeight: 'bold' }}>
                    {req.status}
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#059669' }}>+{req.rewardPoints} P</span>
                </div>
                <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: req.status === '완료' ? '#9a9ea6' : '#1a1f36', fontWeight: 500, lineHeight: '1.4' }}>
                  {req.title}
                </p>
                {req.status === '모집중' && (
                  <button
                    onClick={() => handleAcceptHelp(req.id, req.rewardPoints)}
                    style={{ width: '100%', padding: '8px', backgroundColor: '#059669', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}
                  >
                    도움 제공하고 리워드 받기
                  </button>
                )}
              </div>
            ))}
          </div>
        </aside>

      </div>
    </div>
  );
}