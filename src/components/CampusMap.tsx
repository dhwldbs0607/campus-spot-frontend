import React, { useState } from 'react';
import { 
  APIProvider, 
  Map, 
  AdvancedMarker, 
  Pin, 
  InfoWindow,
  useAdvancedMarkerRef 
} from '@vis.gl/react-google-maps';
import { CAMPUS_CENTER, CAMPUS_ZOOM } from '../lib/utils';
import { SosRequest } from '../types';
import { AlertCircle, Clock, User, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const API_KEY = process.env.GOOGLE_MAPS_PLATFORM_KEY || '';
const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

interface CampusMapProps {
  requests: SosRequest[];
  onSelectRequest: (request: SosRequest) => void;
  onAcceptRequest: (request: SosRequest) => void;
  selectedRequestId?: string | null;
  currentUserId?: string;
}

export default function CampusMap({ requests, onSelectRequest, onAcceptRequest, selectedRequestId, currentUserId }: CampusMapProps) {
  if (!hasValidKey) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-slate-50 p-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold mb-2">Google Maps API Key Required</h2>
        <p className="text-slate-600 max-w-md"> Please follow the instructions in the setup guide to add your API key as a secret. </p>
      </div>
    );
  }

  return (
    <APIProvider apiKey={API_KEY} version="weekly">
      <Map
        defaultCenter={CAMPUS_CENTER}
        defaultZoom={CAMPUS_ZOOM}
        mapId="CAMPUS_SOS_MAP"
        className="w-full h-full"
        disableDefaultUI={false}
        internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
      >
        <AnimatePresence>
          {requests.map((req) => (
            <SosMarker 
              key={req.id} 
              request={req} 
              isSelected={selectedRequestId === req.id}
              onClick={() => onSelectRequest(req)}
              onAccept={() => onAcceptRequest(req)}
              isOwnRequest={currentUserId === req.studentId}
            />
          ))}
        </AnimatePresence>
      </Map>
    </APIProvider>
  );
}

function SosMarker({ 
  request, 
  isSelected, 
  onClick, 
  onAccept,
  isOwnRequest 
}: { 
  request: SosRequest; 
  isSelected: boolean; 
  onClick: () => void;
  onAccept: () => void;
  isOwnRequest: boolean;
  key?: string;
}) {
  const [markerRef, marker] = useAdvancedMarkerRef();
  const statusColors = {
    WAITING: '#ff0000',
    ACCEPTED: '#f59e0b',
    COMPLETED: '#22c55e',
    CANCELLED: '#94a3b8'
  };

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        position={request.location}
        onClick={onClick}
        title={request.buildingName}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: isSelected ? 1.2 : 1 }}
          whileHover={{ scale: 1.1 }}
          className="relative"
        >
          {request.status === 'WAITING' && (
            <>
              <motion.div
                animate={{ 
                  scale: [1, 2.5, 1],
                  opacity: [0.6, 0, 0.6]
                }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  ease: "easeOut"
                }}
                style={{ backgroundColor: '#ff0000' }}
                className="absolute inset-0 rounded-full blur-lg"
              />
              <motion.div
                animate={{ 
                  scale: [1, 1.8, 1],
                  opacity: [0.8, 0, 0.8]
                }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  ease: "easeOut",
                  delay: 0.3
                }}
                style={{ backgroundColor: '#ff4444' }}
                className="absolute inset-0 rounded-full blur-md"
              />
            </>
          )}
          <Pin 
            background={statusColors[request.status]} 
            borderColor="white" 
            glyphColor="white"
          >
            {request.status === 'WAITING' ? '!' : request.status === 'ACCEPTED' ? '?' : '✓'}
          </Pin>
        </motion.div>
      </AdvancedMarker>

      {isSelected && (
        <InfoWindow 
          anchor={marker} 
          onCloseClick={onClick}
          headerDisabled
          className="rounded-lg shadow-xl"
        >
          <div className="p-2 min-w-[200px]">
            <div className="flex items-center gap-2 mb-2">
              <span className={cn(
                "px-2 py-0.5 rounded-full text-[10px] font-bold text-white",
                request.status === 'WAITING' ? "bg-red-500" : "bg-amber-500"
              )}>
                {request.status === 'WAITING' ? '대기 중' : '도움 중'}
              </span>
              <span className="text-xs text-slate-500 font-medium">{request.buildingName}</span>
            </div>
            <h4 className="font-bold text-slate-900 mb-1">{request.studentName}</h4>
            <p className="text-sm text-slate-700 leading-tight mb-3">"{request.message}"</p>
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <div className="flex items-center gap-1 text-slate-600">
                <Clock className="w-3 h-3" />
                <span className="text-[10px]">방금 전</span>
              </div>
              <div className="flex items-center gap-1 text-blue-600 font-bold">
                <span className="text-xs">{request.points} P</span>
              </div>
            </div>

            {request.status === 'WAITING' && !isOwnRequest && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onAccept();
                }}
                className="w-full mt-3 bg-red-500 hover:bg-red-600 text-white text-xs font-bold py-2 rounded-lg shadow-md transition-all flex items-center justify-center gap-1"
              >
                <CheckCircle2 className="w-3 h-3" />
                도움 수락하기
              </motion.button>
            )}

            {isOwnRequest && request.status === 'WAITING' && (
              <p className="text-[10px] text-slate-400 text-center mt-3 italic">본인의 요청입니다</p>
            )}
          </div>
        </InfoWindow>
      )}
    </>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}