import { Button, Spinner, Chip, Slider } from '@heroui/react';
import React from 'react';
import { UserSearchResult, MatchingSimulationResult } from '../types';
interface MatchingSimulationProps {
    selectedUser: UserSearchResult | null;
    simulationLoading: boolean;
    simulationResult: MatchingSimulationResult | null;
    matchLimit: number;
    selectedPartnerIndex: number | null;
    setMatchLimit: (value: number) => void;
    runMatchingSimulation: () => void;
    handlePartnerSelect: (index: number) => void;
}
const MatchingSimulation: React.FC<MatchingSimulationProps> = ({ selectedUser, simulationLoading, simulationResult, matchLimit, selectedPartnerIndex, setMatchLimit, runMatchingSimulation, handlePartnerSelect }) => {
    return (<>
      {/* 선택된 사용자 정보 */}
      {selectedUser && (<section style={{ padding: 24, marginBottom: 24 }} className="rounded-xl border bg-white p-4">
          <p>
            선택된 사용자:
          </p>
          <section style={{ padding: 16 }} className="rounded-xl border bg-white p-4">
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <img src={selectedUser.profileImageUrl} alt="프로필" className="h-9 w-9 rounded-full object-cover"></img>
              <div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <p>
                    {selectedUser.name} ({selectedUser.age}세, {selectedUser.gender === 'MALE' ? '남성' : '여성'})
                  </p>
                  {selectedUser.appearanceGrade && (<Chip size="sm">{selectedUser.appearanceGrade}</Chip>)}
                </div>
                <p>
                  {selectedUser.university ? (typeof selectedUser.university === 'string' ?
                selectedUser.university :
                selectedUser.university.name) : selectedUser.universityDetails?.name ?
                `${selectedUser.universityDetails.name} ${selectedUser.universityDetails.department || ''}` :
                '대학 정보 없음'}
                </p>
              </div>
            </div>
          </section>

          <div style={{ marginTop: 16 }}>
            <p>
              매칭 결과 수 제한 (1-20):
            </p>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
              <Slider value={matchLimit} style={{ marginRight: 16 }} aria-label="매칭 결과 수 제한" minValue={1} maxValue={20} step={1} onChange={value => setMatchLimit(Number(value))}><Slider.Track><Slider.Fill></Slider.Fill><Slider.Thumb></Slider.Thumb></Slider.Track></Slider>
              <p style={{ minWidth: 40, textAlign: 'right' }}>
                {matchLimit}명
              </p>
            </div>
            <Button onPress={runMatchingSimulation} isDisabled={simulationLoading} fullWidth variant="primary">
              {simulationLoading ? <Spinner size="sm"></Spinner> : '매칭 시뮬레이션 실행'}
            </Button>
          </div>
        </section>)}

      {/* 매칭 시뮬레이션 결과 */}
      {simulationResult && (<div style={{ marginTop: 32 }}>
          <h2 className="text-lg font-semibold">
            매칭 시뮬레이션 결과
          </h2>

          {simulationResult.success ? (<>
              <aside role="alert" className="rounded-lg border p-3" style={{ marginBottom: 16 }}>
                {simulationResult.message}
              </aside>

              {/* 선택된 매칭 상대 (최적 매칭 또는 사용자가 선택한 매칭) */}
              <div style={{ marginBottom: 32 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <p>
                    {selectedPartnerIndex === null ? '최적 매칭 상대:' : `선택한 매칭 상대 (#${selectedPartnerIndex + 1}):`}
                  </p>
                  {selectedPartnerIndex !== null && (<Button onPress={() => handlePartnerSelect(-1)} // -1을 전달하여 null로 설정
                 variant="secondary">
                      최적 매칭 상대로 돌아가기
                    </Button>)}
                </div>
                <div className="rounded-xl border p-4">
                  <div className="p-4">
                    <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                      {/* 선택된 파트너 정보 표시 */}
                      {(() => {
                    // 표시할 파트너 정보 결정
                    const partnerInfo = selectedPartnerIndex !== null && simulationResult.potentialPartners[selectedPartnerIndex]
                        ? simulationResult.potentialPartners[selectedPartnerIndex]
                        : simulationResult.selectedPartner;
                    return (<>
                            <img src={partnerInfo.profile.profileImages?.find(img => img.isMain)?.url} alt="프로필" className="h-9 w-9 rounded-full object-cover"></img>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                                <h2 className="text-lg font-semibold">
                                  {partnerInfo.profile.name}
                                </h2>
                                <Chip size="sm">{partnerInfo.profile.rank}</Chip>
                                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
                                  <p>
                                    유사도: {(partnerInfo.similarity * 100).toFixed(1)}%
                                  </p>
                                </div>
                              </div>

                              <p style={{ marginBottom: 8 }}>
                                {partnerInfo.profile.age}세 / {partnerInfo.profile.gender === 'MALE' ? '남성' : '여성'}
                                {partnerInfo.profile.mbti && ` • ${partnerInfo.profile.mbti}`}
                              </p>

                              <p style={{ marginBottom: 8 }}>
                                {partnerInfo.profile.universityDetails?.name} {partnerInfo.profile.universityDetails?.department}
                                {partnerInfo.profile.universityDetails?.grade && ` • ${partnerInfo.profile.universityDetails?.grade}`}
                                {partnerInfo.profile.universityDetails?.studentNumber && ` • ${partnerInfo.profile.universityDetails?.studentNumber}`}
                              </p>

                              {/* 선호 조건 */}
                              {partnerInfo.profile.preferences && partnerInfo.profile.preferences.length > 0 && (<div style={{ marginTop: 16 }}>
                                  <p>
                                    선호 조건:
                                  </p>
                                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    {partnerInfo.profile.preferences.map((pref, index) => (<div key={index} className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <p>
                                          {pref.typeName}:
                                        </p>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                          {pref.selectedOptions.map(option => (<Chip key={option.id} size="sm">{option.displayName}</Chip>))}
                                        </div>
                                      </div>))}
                                  </div>
                                </div>)}
                            </div>
                          </>);
                })()}
                    </div>
                  </div>
                </div>
              </div>

              {/* 잠재적 매칭 상대 목록 */}
              {simulationResult.potentialPartners && simulationResult.potentialPartners.length > 0 && (<div>
                  <p>
                    잠재적 매칭 상대 목록:
                  </p>
                  <div>
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 text-left">
                        <tr style={{ backgroundColor: '#f5f5f5' }} className="border-b">
                          <th scope="col" className="border-b px-4 py-3">순위</th>
                          <th scope="col" className="border-b px-4 py-3">프로필</th>
                          <th scope="col" className="border-b px-4 py-3">이름</th>
                          <th scope="col" className="border-b px-4 py-3">나이/성별</th>
                          <th scope="col" className="border-b px-4 py-3">대학교</th>
                          <th scope="col" className="border-b px-4 py-3">유사도</th>
                        </tr>
                      </thead>
                      <tbody>
                        {simulationResult.potentialPartners.map((partner, index) => (<tr key={partner.profile.id} style={{ cursor: 'pointer', backgroundColor: selectedPartnerIndex === index ? 'rgba(122, 74, 226, 0.08)' : 'inherit' }} className="border-b">
                            <td className="border-b px-4 py-3">{index + 1}</td>
                            <td className="border-b px-4 py-3">
                              <img src={partner.profile.profileImages?.find(img => img.isMain)?.url} alt="프로필" className="h-9 w-9 rounded-full object-cover"></img>
                            </td>
                            <td className="border-b px-4 py-3">
                              <div style={{ display: 'flex', alignItems: 'center' }}>
                                <Button variant="tertiary" aria-pressed={selectedPartnerIndex === index} onPress={() => handlePartnerSelect(index)}>{partner.profile.name}</Button>
                                {partner.profile.rank && (<Chip size="sm">{partner.profile.rank}</Chip>)}
                              </div>
                            </td>
                            <td className="border-b px-4 py-3">{partner.profile.age}세 / {partner.profile.gender === 'MALE' ? '남성' : '여성'}</td>
                            <td className="border-b px-4 py-3">{partner.profile.universityDetails?.name || '정보 없음'}</td>
                            <td className="border-b px-4 py-3">
                              <div style={{ display: 'flex', alignItems: 'center' }}>
                                <div style={{ width: 60, backgroundColor: '#d1d5db', marginRight: 8, borderRadius: 1, position: 'relative' }}>
                                  <div style={{ width: `${partner.similarity * 100}%`, height: 8, backgroundColor: partner.similarity > 0.7 ? '#16a34a' : partner.similarity > 0.5 ? '#7A4AE2' : '#d97706', borderRadius: 1 }}></div>
                                </div>
                                <p>
                                  {(partner.similarity * 100).toFixed(1)}%
                                </p>
                              </div>
                            </td>
                          </tr>))}
                      </tbody>
                    </table>
                  </div>
                </div>)}
            </>) : (<aside role="alert" className="rounded-lg border p-3">
              {simulationResult.message || '매칭 가능한 사용자를 찾을 수 없습니다.'}
            </aside>)}
        </div>)}
    </>);
};
export default MatchingSimulation;
