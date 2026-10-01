import { Phone as PhoneIcon } from 'lucide-react';
import { Button, Spinner, Chip, TextField, Label, Input } from '@heroui/react';
import React from 'react';
import { UserSearchResult } from '../types';
interface UserSearchProps {
    searchTerm: string;
    searchLoading: boolean;
    error: string | null;
    searchResults: UserSearchResult[];
    selectedUser: UserSearchResult | null;
    setSearchTerm: (value: string) => void;
    searchUsers: () => void;
    handleUserSelect: (user: UserSearchResult) => void;
}
const UserSearch: React.FC<UserSearchProps> = ({ searchTerm, searchLoading, error, searchResults, selectedUser, setSearchTerm, searchUsers, handleUserSelect }) => {
    return (<section style={{ padding: 24, marginBottom: 24 }} className="rounded-xl border bg-white p-4">
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
        <TextField className="mb-4"><Label>{"사용자 이름 검색"}</Label><Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}></Input></TextField>
        <Button onPress={searchUsers} isDisabled={searchLoading} variant="primary">
          {searchLoading ? <Spinner size="sm"></Spinner> : '검색'}
        </Button>
      </div>

      {error && (<aside role="alert" className="rounded-lg border p-3" style={{ marginBottom: 16 }}>
          {error}
        </aside>)}

      {/* 검색 결과 목록 */}
      {searchResults.length > 0 ? (<section style={{ marginBottom: 24, maxHeight: 300, overflow: 'auto' }} className="rounded-xl border bg-white p-4">
          <ul>
            {searchResults.map((user) => (<li key={user.id} onClick={() => handleUserSelect(user)} style={{ cursor: 'pointer', backgroundColor: selectedUser?.id === user.id ? 'action.selected' : undefined }}>
                <span>
                  <img src={user.profileImageUrl} alt="프로필" className="h-9 w-9 rounded-full object-cover"></img>
                </span>
                <div><p>{<div>
                      <p>
                        {user.name} ({user.age}세, {user.gender === 'MALE' ? '남성' : '여성'})
                      </p>
                      {user.appearanceGrade && (<Chip size="sm">{user.appearanceGrade}</Chip>)}
                    </div>}</p><small>{<div>
                      {/* 전화번호 */}
                      {user.phoneNumber && (<div>
                          <PhoneIcon></PhoneIcon>
                          <p>
                            {user.phoneNumber}
                          </p>
                        </div>)}
                      {/* 대학교 정보 */}
                      <p>
                        {user.university ? (typeof user.university === 'string' ? user.university : user.university.name) : user.universityDetails?.name ?
                        `${user.universityDetails.name} ${user.universityDetails.department || ''}` :
                        '대학 정보 없음'}
                      </p>
                    </div>}</small></div>
              </li>))}
          </ul>
        </section>) : (<div style={{ paddingBlock: 24, textAlign: 'center' }}>
          <p>
            검색 결과가 없습니다.
          </p>
          <p style={{ marginTop: 8 }}>
            다른 이름으로 검색해보세요.
          </p>
        </div>)}
    </section>);
};
export default UserSearch;
