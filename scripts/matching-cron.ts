import cron from 'node-cron';
import fetch from 'node-fetch';

// 매일 밤 10시에 실행
cron.schedule('0 22 * * *', async () => {
  try {
    const response = await fetch('http://localhost:3000/api/matching', {
      method: 'POST',
    });

    const result = await response.json();
    console.log('Matching result:', result);
  } catch (error) {
    console.error('Cron job error:', error);
  }
}); 