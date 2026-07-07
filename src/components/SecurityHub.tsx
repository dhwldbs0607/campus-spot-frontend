import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldAlert, 
  X, 
  Activity, 
  AlertTriangle, 
  RotateCcw,
  Sliders,
  CheckCircle2,
  Info,
  MapPin,
  Compass,
  Globe,
  Settings,
  Navigation
} from 'lucide-react';

interface SecurityHubProps {
  onClose: () => void;
}

interface SimulatedUserLog {
  userId: string;
  totalAuthCount: number;
  avgTimeDiff: number; // in minutes
  isAbuserReal: boolean;
  detectedAsAbuser: boolean;
}

// Haversine Distance Calculation (Helper)
function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371.0; // 지구의 반경 (km)
  
  const lat1Rad = (lat1 * Math.PI) / 180;
  const lon1Rad = (lon1 * Math.PI) / 180;
  const lat2Rad = (lat2 * Math.PI) / 180;
  const lon2Rad = (lon2 * Math.PI) / 180;
  
  const dlat = lat2Rad - lat1Rad;
  const dlon = lon2Rad - lon1Rad;
  
  const a = Math.sin(dlat / 2) ** 2 + Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(dlon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c; // Distance in km
}

interface Landmark {
  id: string;
  name: string;
  lat: number;
  lon: number;
  code: string;
}

const LANDMARKS: Landmark[] = [
  { id: 'l1', name: '본관 (A동)', code: 'A-Dong', lat: 37.5508, lon: 126.9255 },
  { id: 'l2', name: '중앙도서관 (F동)', code: 'F-Dong', lat: 37.5515, lon: 126.9250 },
  { id: 'l3', name: '학생회관 (G동)', code: 'G-Dong', lat: 37.5512, lon: 126.9242 },
  { id: 'l4', name: '미래관 (J동)', code: 'J-Dong', lat: 37.5522, lon: 126.9245 },
  { id: 'l5', name: 'IT관 (C동)', code: 'C-Dong', lat: 37.5526, lon: 126.9238 }
];

export default function SecurityHub({ onClose }: SecurityHubProps) {
  const [activeTab, setActiveTab] = useState<'pattern' | 'gps'>('pattern');

  // Tab 1: Pattern Detection state
  const [authCountThreshold, setAuthCountThreshold] = useState<number>(15);
  const [timeDiffThreshold, setTimeDiffThreshold] = useState<number>(12);
  const [numUsers, setNumUsers] = useState<number>(150);
  const [abuserRatio, setAbuserRatio] = useState<number>(6); // 6% abusers
  const [simulatedData, setSimulatedData] = useState<SimulatedUserLog[]>([]);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<SimulatedUserLog | null>(null);

  // Tab 2: GPS Cross-verification state
  const [selectedLandmark, setSelectedLandmark] = useState<Landmark>(LANDMARKS[0]);
  const [userLatOffset, setUserLatOffset] = useState<number>(0.0004); // Offset to simulate GPS deviation
  const [userLonOffset, setUserLonOffset] = useState<number>(0.0003);
  const [allowedRadius, setAllowedRadius] = useState<number>(100); // meters (0.1km = 100m)

  // Simulation run for Tab 1
  const runSimulation = () => {
    setIsSimulating(true);
    setTimeout(() => {
      const generatedUsers: SimulatedUserLog[] = [];
      const totalAbusers = Math.max(1, Math.round((numUsers * abuserRatio) / 100));

      for (let i = 0; i < numUsers; i++) {
        const isAbuser = i < totalAbusers;
        
        let totalAuthCount = 0;
        let avgTimeDiff = 0;

        if (isAbuser) {
          totalAuthCount = Math.floor(Math.random() * 26) + 15;
          avgTimeDiff = parseFloat((Math.random() * 7 + 1).toFixed(1));
        } else {
          totalAuthCount = Math.floor(Math.random() * 5) + 1;
          avgTimeDiff = parseFloat((Math.random() * 140 + 40).toFixed(1));
        }

        const detectedAsAbuser = totalAuthCount >= authCountThreshold && avgTimeDiff <= timeDiffThreshold;

        generatedUsers.push({
          userId: `USER_${String(i).padStart(4, '0')}`,
          totalAuthCount,
          avgTimeDiff,
          isAbuserReal: isAbuser,
          detectedAsAbuser
        });
      }

      generatedUsers.sort(() => Math.random() - 0.5);
      setSimulatedData(generatedUsers);
      setIsSimulating(false);
    }, 600);
  };

  useEffect(() => {
    runSimulation();
  }, []);

  const updatedData = simulatedData.map(user => {
    const detectedAsAbuser = user.totalAuthCount >= authCountThreshold && user.avgTimeDiff <= timeDiffThreshold;
    return { ...user, detectedAsAbuser };
  });

  // Pattern Stats
  const totalLogs = updatedData.reduce((acc, curr) => acc + curr.totalAuthCount, 0);
  const detectedAbusers = updatedData.filter(u => u.detectedAsAbuser);
  const realAbusers = updatedData.filter(u => u.isAbuserReal);
  const savedPoints = detectedAbusers.reduce((acc, curr) => acc + (curr.totalAuthCount * 1000), 0);
  const falsePositives = updatedData.filter(u => u.detectedAsAbuser && !u.isAbuserReal).length;
  const falseNegatives = updatedData.filter(u => !u.detectedAsAbuser && u.isAbuserReal).length;
  const truePositives = updatedData.filter(u => u.detectedAsAbuser && u.isAbuserReal).length;

  // GPS Calculation
  const currentUserLat = parseFloat((selectedLandmark.lat + userLatOffset).toFixed(6));
  const currentUserLon = parseFloat((selectedLandmark.lon + userLonOffset).toFixed(6));
  const distanceKm = calculateHaversineDistance(
    selectedLandmark.lat, 
    selectedLandmark.lon, 
    currentUserLat, 
    currentUserLon
  );
  const distanceMeters = Math.round(distanceKm * 1000);
  const isGpsValid = distanceMeters <= allowedRadius;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col h-[90vh] max-h-[800px]"
    >
      {/* Header */}
      <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500 flex items-center justify-center shadow-lg shadow-red-500/20">
            <ShieldAlert className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-base font-black tracking-tight flex items-center gap-2">
              어뷰징 방지 및 위치 교차 검증 제어실 (Anti-Abuse Control)
            </h3>
            <p className="text-[11px] text-slate-400">캠퍼스 보안 관제 및 GPS 물리 공간 교차 검증</p>
          </div>
        </div>
        <button 
          onClick={onClose} 
          className="p-1.5 hover:bg-white/10 rounded-xl transition-colors"
        >
          <X className="w-5 h-5 text-slate-400" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-950 border-b border-slate-800 p-1.5 gap-1.5">
        <button
          onClick={() => setActiveTab('pattern')}
          className={`flex-1 py-2 px-4 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 ${
            activeTab === 'pattern' 
              ? 'bg-slate-800 text-white shadow' 
              : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          통계 패턴 어뷰징 탐지 (Anomaly Pattern)
        </button>
        <button
          onClick={() => setActiveTab('gps')}
          className={`flex-1 py-2 px-4 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 ${
            activeTab === 'gps' 
              ? 'bg-slate-800 text-white shadow border border-slate-700/50' 
              : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
          }`}
        >
          <Compass className="w-3.5 h-3.5 text-blue-400" />
          하버사인 GPS 교차 검증기 (GPS Verification)
        </button>
      </div>

      {/* Description Info Bar */}
      <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-100 flex items-start gap-2">
        <Info className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
        <p className="text-[11px] text-slate-600 leading-relaxed">
          {activeTab === 'pattern' ? (
            <span><strong>세무 장부 스크리닝 기법</strong>과 동일하게 정상 범위의 기준선(Baseline)을 이탈하는 이상 거래(Anomaly)를 감지하여 포인트 오집행과 불법 누수를 사전에 차단합니다.</span>
          ) : (
            <span><strong>하버사인(Haversine) 구면 공식</strong>을 적용하여 사용자의 실재 GPS 위경도 값과 캠퍼스 건물 좌표의 구면 거리를 실시간 정밀 연산하고, 100m 이내에 실재하는 신뢰 장치인 경우만 포인트 보상을 승인합니다.</span>
          )}
        </p>
      </div>

      {/* Main Tab Views */}
      <AnimatePresence mode="wait">
        {activeTab === 'pattern' ? (
          <motion.div 
            key="tab-pattern"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex-1 overflow-hidden flex flex-col md:flex-row"
          >
            {/* Left Control Column */}
            <div className="w-full md:w-72 border-r border-slate-100 p-4 flex flex-col gap-4 overflow-y-auto bg-slate-50/50">
              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                  <Sliders className="w-3.5 h-3.5 text-slate-500" />
                  감지 임계치 설정 (Thresholds)
                </h4>

                {/* Threshold Auth Count */}
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-slate-600">최대 허용 인증</span>
                    <span className="text-red-500 font-mono">{authCountThreshold}회 이상</span>
                  </div>
                  <input 
                    type="range" 
                    min="5" 
                    max="30" 
                    value={authCountThreshold} 
                    onChange={(e) => setAuthCountThreshold(Number(e.target.value))}
                    className="w-full accent-red-500 h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                  />
                  <p className="text-[9px] text-slate-400 mt-1">이 조건 이상의 빈도 발생 시 어뷰징 진단</p>
                </div>

                {/* Threshold Time Difference */}
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-slate-600">인증 간 평균 시간</span>
                    <span className="text-red-500 font-mono">{timeDiffThreshold}분 이하</span>
                  </div>
                  <input 
                    type="range" 
                    min="3" 
                    max="50" 
                    value={timeDiffThreshold} 
                    onChange={(e) => setTimeDiffThreshold(Number(e.target.value))}
                    className="w-full accent-red-500 h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                  />
                  <p className="text-[9px] text-slate-400 mt-1">인증 간격이 이 시간보다 짧을 시 진단</p>
                </div>
              </div>

              {/* Simulation Environment Config */}
              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">가상 사용자 샘플 설정</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[9px] text-slate-500 font-bold block mb-1">총 유저</label>
                    <select 
                      value={numUsers} 
                      onChange={(e) => setNumUsers(Number(e.target.value))}
                      className="w-full p-1.5 bg-slate-50 border border-slate-100 rounded-lg font-bold text-xs"
                    >
                      <option value={80}>80명</option>
                      <option value={150}>150명</option>
                      <option value={300}>300명</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-500 font-bold block mb-1">공격자 비율</label>
                    <select 
                      value={abuserRatio} 
                      onChange={(e) => setAbuserRatio(Number(e.target.value))}
                      className="w-full p-1.5 bg-slate-50 border border-slate-100 rounded-lg font-bold text-xs"
                    >
                      <option value={3}>3%</option>
                      <option value={6}>6%</option>
                      <option value={10}>10%</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={runSimulation}
                  disabled={isSimulating}
                  className="w-full mt-1 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all"
                >
                  <RotateCcw className={`w-3 h-3 ${isSimulating ? 'animate-spin' : ''}`} />
                  샘플 재생성 & 리셋
                </button>
              </div>

              <div className="mt-auto bg-red-600 text-white rounded-2xl p-4 shadow-lg shadow-red-600/10">
                <span className="text-[9px] uppercase font-black text-red-200 tracking-wider">누수 방지 포인트</span>
                <div className="text-xl font-black mt-0.5">{(savedPoints).toLocaleString()} P</div>
                <p className="text-[8px] text-red-100/90 leading-normal mt-1">
                  통계적 이상 탐지 차단막을 적용하여 지켜낸 캠퍼스 가상 재화입니다.
                </p>
              </div>
            </div>

            {/* Right Scatter Map Area */}
            <div className="flex-1 p-4 flex flex-col overflow-y-auto">
              <div className="grid grid-cols-4 gap-2 mb-4">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-center">
                  <span className="text-[8px] text-slate-400 font-bold uppercase block">분석 로그</span>
                  <span className="text-sm font-black text-slate-800">{totalLogs.toLocaleString()}건</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-center">
                  <span className="text-[8px] text-slate-400 font-bold uppercase block">실제 공격군</span>
                  <span className="text-sm font-black text-slate-800">{realAbusers.length}명</span>
                </div>
                <div className="bg-red-50 p-2.5 rounded-xl border border-red-100 text-center">
                  <span className="text-[8px] text-red-400 font-bold uppercase block">시스템 차단</span>
                  <span className="text-sm font-black text-red-600">{detectedAbusers.length}명</span>
                </div>
                <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-100 text-center">
                  <span className="text-[8px] text-emerald-500 font-bold uppercase block">정밀도율</span>
                  <span className="text-sm font-black text-emerald-600">
                    {realAbusers.length > 0 
                      ? `${Math.round((truePositives / realAbusers.length) * 100)}%` 
                      : '100%'}
                  </span>
                </div>
              </div>

              {/* Scatter Chart */}
              <div className="bg-slate-900 rounded-2xl p-4 mb-4 border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Activity className="w-3 h-3 text-red-500" />
                    인증 로그 분포 산점도 (Anomaly Scatter)
                  </h5>
                  <div className="flex gap-2 text-[8px] font-bold text-white">
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> 정상 유저
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> 탐지/차단
                    </span>
                  </div>
                </div>

                <div className="relative w-full h-44 bg-slate-950/60 rounded-xl border border-slate-800/80 overflow-hidden">
                  <svg className="w-full h-full p-4" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <line x1="0" y1="20" x2="100" y2="20" stroke="#1e293b" strokeWidth="0.2" strokeDasharray="1" />
                    <line x1="0" y1="40" x2="100" y2="40" stroke="#1e293b" strokeWidth="0.2" strokeDasharray="1" />
                    <line x1="0" y1="60" x2="100" y2="60" stroke="#1e293b" strokeWidth="0.2" strokeDasharray="1" />
                    <line x1="0" y1="80" x2="100" y2="80" stroke="#1e293b" strokeWidth="0.2" strokeDasharray="1" />
                    <line x1="20" y1="0" x2="20" y2="100" stroke="#1e293b" strokeWidth="0.2" strokeDasharray="1" />
                    <line x1="40" y1="0" x2="40" y2="100" stroke="#1e293b" strokeWidth="0.2" strokeDasharray="1" />
                    <line x1="60" y1="0" x2="60" y2="100" stroke="#1e293b" strokeWidth="0.2" strokeDasharray="1" />
                    <line x1="80" y1="0" x2="80" y2="100" stroke="#1e293b" strokeWidth="0.2" strokeDasharray="1" />

                    {(() => {
                      const xThreshold = (timeDiffThreshold / 180) * 100;
                      const yThreshold = 100 - (authCountThreshold / 40) * 100;
                      return (
                        <g>
                          <rect x="0" y="0" width={xThreshold} height={yThreshold} fill="rgba(239, 68, 68, 0.08)" />
                          <line x1={xThreshold} y1="0" x2={xThreshold} y2="100" stroke="#ef4444" strokeWidth="0.4" strokeDasharray="2" />
                          <line x1="0" y1={yThreshold} x2="100" y2={yThreshold} stroke="#ef4444" strokeWidth="0.4" strokeDasharray="2" />
                        </g>
                      );
                    })()}

                    {updatedData.map((user) => {
                      const x = 4 + (Math.min(user.avgTimeDiff, 180) / 180) * 92;
                      const y = 96 - (Math.min(user.totalAuthCount, 45) / 45) * 92;
                      const isSelected = selectedUser?.userId === user.userId;

                      return (
                        <circle
                          key={user.userId}
                          cx={x}
                          cy={y}
                          r={isSelected ? "2.2" : "1.2"}
                          className={`cursor-pointer transition-all ${
                            user.detectedAsAbuser ? "fill-red-500 hover:fill-red-400" : "fill-emerald-500 hover:fill-emerald-400"
                          } ${isSelected ? 'stroke-white stroke-[0.6]' : ''}`}
                          onClick={() => setSelectedUser(user)}
                        />
                      );
                    })}
                  </svg>
                </div>
              </div>

              {/* Data list bottom */}
              <div className="flex-1 border border-slate-100 rounded-xl overflow-hidden flex flex-col bg-white">
                <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[10px] font-bold text-slate-500">
                  <span>실시간 탐지 내역 (상위 4명)</span>
                  {selectedUser && (
                    <button onClick={() => setSelectedUser(null)} className="text-red-500 font-bold hover:underline">
                      초기화
                    </button>
                  )}
                </div>
                <div className="flex-1 overflow-y-auto max-h-32 text-[11px] divide-y divide-slate-50">
                  {selectedUser ? (
                    <div className="p-3 bg-slate-50/50 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="font-bold text-slate-800">{selectedUser.userId}</span>
                          <span className={`text-[8px] font-black px-1.5 rounded ${selectedUser.isAbuserReal ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                            {selectedUser.isAbuserReal ? 'Abuser' : 'Normal'}
                          </span>
                        </div>
                        <p className="text-slate-500 text-[10px]">
                          인증 <span className="font-bold text-slate-700">{selectedUser.totalAuthCount}회</span>, 간격 <span className="font-bold text-slate-700">{selectedUser.avgTimeDiff}분</span>
                        </p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black text-white ${selectedUser.detectedAsAbuser ? 'bg-red-500' : 'bg-emerald-500'}`}>
                        {selectedUser.detectedAsAbuser ? '🚨 차단' : '✅ 정상'}
                      </span>
                    </div>
                  ) : (
                    <div className="p-1">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="text-[9px] text-slate-400 border-b border-slate-100">
                            <th className="py-1 pl-2">아이디</th>
                            <th className="py-1">인증수</th>
                            <th className="py-1">평균간격</th>
                            <th className="py-1">시스템 판정</th>
                            <th className="py-1 pr-2 text-right">진단 정확성</th>
                          </tr>
                        </thead>
                        <tbody>
                          {updatedData.filter(u => u.detectedAsAbuser).slice(0, 4).map((user) => (
                            <tr key={user.userId} className="hover:bg-slate-50 cursor-pointer" onClick={() => setSelectedUser(user)}>
                              <td className="py-1.5 pl-2 font-bold text-slate-700">{user.userId}</td>
                              <td className="py-1.5 font-bold text-red-500">{user.totalAuthCount}회</td>
                              <td className="py-1.5 text-slate-500">{user.avgTimeDiff}분</td>
                              <td className="py-1.5">
                                <span className="bg-red-100 text-red-600 text-[9px] px-1 py-0.2 rounded font-bold">Abuser</span>
                              </td>
                              <td className="py-1.5 pr-2 text-right text-slate-400 text-[9px]">
                                {user.isAbuserReal ? 'True Positive' : 'False Positive'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          /* Tab 2: GPS Cross-verification View */
          <motion.div 
            key="tab-gps"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex-1 overflow-hidden flex flex-col md:flex-row"
          >
            {/* Left GPS Settings Column */}
            <div className="w-full md:w-72 border-r border-slate-100 p-4 flex flex-col gap-4 overflow-y-auto bg-slate-50/50">
              <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm space-y-2">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-blue-500" />
                  실증 랜드마크 타겟
                </h4>
                <div className="space-y-1">
                  {LANDMARKS.map((landmark) => (
                    <button
                      key={landmark.id}
                      onClick={() => setSelectedLandmark(landmark)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                        selectedLandmark.id === landmark.id 
                          ? 'bg-blue-50 text-blue-600 border border-blue-100' 
                          : 'text-slate-600 hover:bg-slate-50 border border-transparent'
                      }`}
                    >
                      <span className="truncate">{landmark.name}</span>
                      <span className="text-[9px] font-mono text-slate-400">{landmark.code}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* GPS Deviation Slider */}
              <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm space-y-3">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Settings className="w-3.5 h-3.5 text-slate-500" />
                  가상 GPS 편차 조정 (Deviation)
                </h4>

                {/* Lat Deviation */}
                <div>
                  <div className="flex justify-between text-[11px] font-bold mb-1">
                    <span className="text-slate-600">위도 편차 (Latitude)</span>
                    <span className="text-slate-900 font-mono">{(userLatOffset * 100000).toFixed(0)}m</span>
                  </div>
                  <input 
                    type="range" 
                    min="-0.0015" 
                    max="0.0015" 
                    step="0.0001"
                    value={userLatOffset} 
                    onChange={(e) => setUserLatOffset(Number(e.target.value))}
                    className="w-full accent-blue-500 h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Lon Deviation */}
                <div>
                  <div className="flex justify-between text-[11px] font-bold mb-1">
                    <span className="text-slate-600">경도 편차 (Longitude)</span>
                    <span className="text-slate-900 font-mono">{(userLonOffset * 100000).toFixed(0)}m</span>
                  </div>
                  <input 
                    type="range" 
                    min="-0.0015" 
                    max="0.0015" 
                    step="0.0001"
                    value={userLonOffset} 
                    onChange={(e) => setUserLonOffset(Number(e.target.value))}
                    className="w-full accent-blue-500 h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Allowed Radius */}
                <div>
                  <div className="flex justify-between text-[11px] font-bold mb-1">
                    <span className="text-slate-600">허용 검증 반경</span>
                    <span className="text-blue-500 font-mono">{allowedRadius}m</span>
                  </div>
                  <input 
                    type="range" 
                    min="30" 
                    max="200" 
                    step="10"
                    value={allowedRadius} 
                    onChange={(e) => setAllowedRadius(Number(e.target.value))}
                    className="w-full accent-blue-500 h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>

              {/* Verification Verdict */}
              <div className={`rounded-xl p-3 border text-center ${
                isGpsValid 
                  ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
                  : 'bg-red-50 border-red-100 text-red-800'
              }`}>
                <div className="text-[10px] font-black uppercase tracking-wider mb-0.5">교차 검증 판정 결과</div>
                <div className="text-base font-black flex items-center justify-center gap-1.5">
                  {isGpsValid ? (
                    <>
                      <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500" />
                      <span>검증 완료 (VALID)</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4.5 h-4.5 text-red-500" />
                      <span>위치 불일치 (INVALID)</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Right Interactive Radar/Graph Area */}
            <div className="flex-1 p-4 flex flex-col justify-between">
              {/* Core coordinate overview */}
              <div className="grid grid-cols-3 gap-2.5">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-300">
                  <span className="text-[9px] text-slate-500 font-bold block">타겟 랜드마크 GPS</span>
                  <p className="text-[11px] font-mono font-bold mt-0.5">{selectedLandmark.lat.toFixed(5)}, {selectedLandmark.lon.toFixed(5)}</p>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-300">
                  <span className="text-[9px] text-slate-500 font-bold block">사용자 단말 GPS</span>
                  <p className="text-[11px] font-mono font-bold mt-0.5">{currentUserLat.toFixed(5)}, {currentUserLon.toFixed(5)}</p>
                </div>
                <div className={`border rounded-xl p-2.5 text-center flex flex-col justify-center ${
                  isGpsValid ? 'bg-emerald-950/20 border-emerald-800 text-emerald-400' : 'bg-red-950/20 border-red-800 text-red-400'
                }`}>
                  <span className="text-[9px] text-slate-400 font-bold block">연산된 오차 거리</span>
                  <p className="text-sm font-black mt-0.5">{distanceMeters} m</p>
                </div>
              </div>

              {/* Haversine Map Visualizer Box */}
              <div className="bg-slate-950 rounded-2xl border border-slate-800 p-4 my-3 flex-1 flex flex-col justify-between relative overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:16px_16px] opacity-30" />

                <div className="flex items-center justify-between z-10">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5 text-blue-500" />
                    하버사인 실재성 검증 레이더 (GPS Space Verification Radar)
                  </span>
                  <span className="text-[9px] font-mono text-slate-500">Scale: Center = Target Landmark</span>
                </div>

                {/* Radar Grid Graphic */}
                <div className="flex-1 flex items-center justify-center relative mt-2 mb-2">
                  <div className="w-48 h-48 rounded-full border border-slate-800/80 flex items-center justify-center relative bg-slate-950/20">
                    <div 
                      style={{ 
                        width: `${(allowedRadius / 200) * 192}px`, 
                        height: `${(allowedRadius / 200) * 192}px` 
                      }}
                      className={`rounded-full border-2 border-dashed absolute flex items-center justify-center transition-all duration-300 ${
                        isGpsValid ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-red-500/20 bg-red-500/5'
                      }`}
                    >
                      <div className="absolute inset-0 rounded-full border border-slate-700/10 animate-ping" />
                    </div>

                    <div className="w-3.5 h-3.5 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center shadow-lg z-20">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-900" />
                    </div>
                    <span className="absolute text-[9px] font-black text-blue-400 top-20 text-center select-none bg-slate-950/80 px-1 rounded border border-slate-800">
                      {selectedLandmark.name} (기준점)
                    </span>

                    {(() => {
                      const maxOffsetValue = 0.0015;
                      const xPercent = (userLonOffset / maxOffsetValue) * 96; 
                      const yPercent = -(userLatOffset / maxOffsetValue) * 96; 
                      return (
                        <motion.div
                          animate={{ x: xPercent, y: yPercent }}
                          transition={{ type: 'spring', stiffness: 100, damping: 15 }}
                          className={`w-4 h-4 rounded-full absolute z-30 flex items-center justify-center shadow-xl ${
                            isGpsValid 
                              ? 'bg-emerald-500 border-2 border-white' 
                              : 'bg-red-500 border-2 border-white animate-bounce'
                          }`}
                        >
                          <Navigation className={`w-2 h-2 text-white transform rotate-45 ${isGpsValid ? '' : 'text-slate-100'}`} />
                          
                          <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 whitespace-nowrap bg-slate-900/90 text-[8px] font-bold text-white px-1.5 py-0.5 rounded border border-slate-800 shadow">
                            사용자 (오차: {distanceMeters}m)
                          </div>
                        </motion.div>
                      );
                    })()}
                  </div>
                </div>

                <div className="text-center text-[9px] text-slate-500 leading-normal flex items-center justify-center gap-2">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-blue-500 rounded" /> 타겟 랜드마크
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-emerald-500 rounded" /> 사용자 (정상범위)
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-red-500 rounded" /> 사용자 (이탈위치)
                  </span>
                </div>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[10px] text-slate-600 flex items-start gap-2">
                <Info className="w-3.5 h-3.5 text-blue-500 mt-0.5 shrink-0" />
                <p className="leading-normal">
                  <strong>하버사인 공식 수학 구조:</strong> <code className="text-blue-600 font-mono text-[9px]">d = 2R · arcsin(√(sin²(Δlat/2) + cos(lat1)·cos(lat2)·sin²(Δlon/2)))</code> 
                  <br />
                  이 정밀 통제 모델을 통하여 모바일 단말기의 인위적 GPS 조작 우회 공격(Mock Location)을 실사 수준으로 무력화합니다.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer bar */}
      <div className="p-3 bg-slate-900 text-slate-300 border-t border-slate-800 flex flex-col md:flex-row justify-between gap-4 text-[10px]">
        {activeTab === 'pattern' ? (
          <div className="flex gap-4">
            <div>
              <span className="text-slate-500 font-bold block uppercase mb-0.5">True Positives</span>
              <span className="text-emerald-400 font-bold">{truePositives}명 (정상 탐지)</span>
            </div>
            <div>
              <span className="text-slate-500 font-bold block uppercase mb-0.5">False Positives</span>
              <span className="text-amber-400 font-bold">{falsePositives}명 (일반 유저 오판)</span>
            </div>
            <div>
              <span className="text-slate-500 font-bold block uppercase mb-0.5">False Negatives</span>
              <span className="text-red-400 font-bold">{falseNegatives}명 (어뷰저 미감지)</span>
            </div>
          </div>
        ) : (
          <div className="flex gap-4">
            <div>
              <span className="text-slate-500 font-bold block uppercase mb-0.5">최대 오차 허용 한도</span>
              <span className="text-blue-400 font-bold">{allowedRadius}m 이내</span>
            </div>
            <div>
              <span className="text-slate-500 font-bold block uppercase mb-0.5">실재성 검사 연산</span>
              <span className="text-emerald-400 font-bold">Haversine Equation Active</span>
            </div>
          </div>
        )}

        <div className="flex items-center gap-1.5 text-slate-400">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>실시간 공간 교차 검증 및 통제 시스템 정상 작동 중</span>
        </div>
      </div>
    </motion.div>
  );
}