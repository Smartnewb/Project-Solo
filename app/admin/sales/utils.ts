
// MARK: - 날짜 포매터(Date -> String)
export const formateDateToString = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2,'0');
        const day = String(date.getDate()).padStart(2,'0');
        return `${year}-${month}-${day}`;

};




export const formatCurrency = (amount: number): string => {
        return new Intl.NumberFormat('ko-KR', {
                style: 'currency',
                currency: 'KRW',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
        }).format(amount);
        };

